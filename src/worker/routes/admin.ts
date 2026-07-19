import { Hono } from "hono";
import type { Env } from "../env";
import { newId } from "../lib/id";
import { extensionOf } from "../lib/r2";
import { currentUser } from "../auth/session";
import { award } from "../lib/points";

const admin = new Hono<{ Bindings: Env }>();

// Owner-only. Requires a signed-in user whose role is 'admin'.
admin.use("*", async (c, next) => {
  const user = await currentUser(c.env, c.req.raw);
  if (!user || user.role !== "admin") {
    return c.json({ error: "unauthorized" }, 401);
  }
  await next();
});

// POST /api/admin/tracks  (multipart: audio, cover, title, artist?, mood?, tags?, duration_sec?)
admin.post("/tracks", async (c) => {
  const body = await c.req.parseBody();

  const audio = body["audio"];
  const cover = body["cover"];
  const title = String(body["title"] || "").trim();

  if (!(audio instanceof File)) return c.json({ error: "audio file required" }, 400);
  if (!(cover instanceof File)) return c.json({ error: "cover file required" }, 400);
  if (!title) return c.json({ error: "title required" }, 400);

  const id = newId();
  const artist = String(body["artist"] || "Aifrobeats").trim() || "Aifrobeats";
  const mood = body["mood"] ? String(body["mood"]).trim() : null;
  const tags = body["tags"] ? String(body["tags"]).trim() : null;
  const durationRaw = body["duration_sec"] ? parseInt(String(body["duration_sec"]), 10) : NaN;
  const duration_sec = isNaN(durationRaw) ? null : durationRaw;

  const audioKey = `audio/${id}.${extensionOf(audio.name, "mp3")}`;
  const coverKey = `covers/${id}.${extensionOf(cover.name, "jpg")}`;

  // Store the binaries in R2 with proper content types.
  await c.env.MEDIA.put(audioKey, audio.stream(), {
    httpMetadata: { contentType: audio.type || "audio/mpeg" },
  });
  await c.env.MEDIA.put(coverKey, cover.stream(), {
    httpMetadata: { contentType: cover.type || "image/jpeg" },
  });

  await c.env.DB.prepare(
    `INSERT INTO tracks (id, title, artist, audio_key, cover_key, duration_sec, mood, tags)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, title, artist, audioKey, coverKey, duration_sec, mood, tags).run();

  return c.json({ ok: true, id, title });
});

// PATCH /api/admin/tracks/:id  (hide/show or edit basic fields)
admin.patch("/tracks/:id", async (c) => {
  const id = c.req.param("id");
  type Patch = { status?: string; title?: string; mood?: string };
  const body = await c.req.json<Patch>().catch(() => ({} as Patch));
  const sets: string[] = [];
  const binds: unknown[] = [];
  if (body.status) { sets.push("status = ?"); binds.push(body.status); }
  if (body.title) { sets.push("title = ?"); binds.push(body.title); }
  if (body.mood) { sets.push("mood = ?"); binds.push(body.mood); }
  if (sets.length === 0) return c.json({ error: "nothing to update" }, 400);
  binds.push(id);
  await c.env.DB.prepare(`UPDATE tracks SET ${sets.join(", ")} WHERE id = ?`).bind(...binds).run();
  return c.json({ ok: true });
});

// DELETE /api/admin/tracks/:id  (removes record and R2 objects)
admin.delete("/tracks/:id", async (c) => {
  const id = c.req.param("id");
  const row = await c.env.DB.prepare("SELECT audio_key, cover_key FROM tracks WHERE id = ?")
    .bind(id).first<{ audio_key: string; cover_key: string }>();
  if (row) {
    await c.env.MEDIA.delete(row.audio_key);
    await c.env.MEDIA.delete(row.cover_key);
  }
  await c.env.DB.prepare("DELETE FROM tracks WHERE id = ?").bind(id).run();
  return c.json({ ok: true });
});

// POST /api/admin/requests/:id/fulfil { track_id }  -> link track, credit requester
admin.post("/requests/:id/fulfil", async (c) => {
  const id = c.req.param("id");
  const { track_id } = await c.req.json<{ track_id?: string }>().catch(() => ({ track_id: "" }));
  if (!track_id) return c.json({ error: "track_id required" }, 400);

  const req = await c.env.DB.prepare("SELECT user_id, status FROM requests WHERE id = ?").bind(id).first<{ user_id: string; status: string }>();
  if (!req) return c.json({ error: "request not_found" }, 404);
  const track = await c.env.DB.prepare("SELECT id FROM tracks WHERE id = ?").bind(track_id).first();
  if (!track) return c.json({ error: "track not_found" }, 404);

  // Credit the requester on the track and link both ways.
  await c.env.DB.prepare("UPDATE tracks SET credited_user = ?, request_id = ? WHERE id = ?")
    .bind(req.user_id, id, track_id).run();
  await c.env.DB.prepare("UPDATE requests SET status = 'fulfilled', fulfilled_track_id = ? WHERE id = ?")
    .bind(track_id, id).run();

  // Points: reward the fan who requested it, and everyone who backed it.
  await award(c.env, req.user_id, "request_fulfilled", 50, id);
  const { results: backers } = await c.env.DB.prepare(
    "SELECT user_id FROM request_votes WHERE request_id = ?"
  ).bind(id).all<{ user_id: string }>();
  for (const b of backers ?? []) {
    if (b.user_id !== req.user_id) await award(c.env, b.user_id, "backed_winner", 2, id);
  }

  return c.json({ ok: true });
});

// POST /api/admin/radio/rotation  -> load live tracks into the radio timeline
admin.post("/radio/rotation", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT id, title, artist, duration_sec FROM tracks WHERE status = 'live' ORDER BY released_at DESC LIMIT 100"
  ).all<{ id: string; title: string; artist: string; duration_sec: number | null }>();
  const rotation = (results ?? []).map((t) => ({
    id: t.id,
    title: t.title,
    artist: t.artist,
    dur: t.duration_sec && t.duration_sec > 5 ? t.duration_sec : 210,
  }));
  const roomId = c.env.RADIO.idFromName("global");
  const room = c.env.RADIO.get(roomId);
  await room.fetch(new Request("https://radio/rotation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rotation }),
  }));
  return c.json({ ok: true, count: rotation.length });
});

// GET /api/admin/subscribers  -> count + recent emails (owner only)
admin.get("/subscribers", async (c) => {
  const count = await c.env.DB.prepare("SELECT COUNT(*) AS n FROM subscribers").first<{ n: number }>();
  const { results } = await c.env.DB.prepare(
    "SELECT email, created_at FROM subscribers ORDER BY created_at DESC LIMIT 500"
  ).all<{ email: string; created_at: string }>();
  return c.json({ count: count?.n ?? 0, subscribers: results ?? [] });
});

// POST /api/admin/broadcast { subject, body }  -> email all subscribers
admin.post("/broadcast", async (c) => {
  type Body = { subject?: string; body?: string };
  const { subject, body } = await c.req.json<Body>().catch(() => ({} as Body));
  const subj = (subject || "").trim().slice(0, 150);
  const text = (body || "").trim().slice(0, 5000);
  if (!subj || !text) return c.json({ error: "Subject and body required." }, 400);

  const { results } = await c.env.DB.prepare("SELECT email FROM subscribers").all<{ email: string }>();
  const emails = (results ?? []).map((r) => r.email);
  if (emails.length === 0) return c.json({ ok: true, sent: 0, failed: 0, total: 0 });

  const origin = new URL(c.req.url).origin;
  const { sendBroadcast } = await import("../lib/broadcast");
  const r = await sendBroadcast(c.env, origin, subj, text, emails);
  return c.json({ ok: true, ...r, total: emails.length });
});

export default admin;
