import { Hono } from "hono";
import type { Env } from "../env";
import { newId } from "../lib/id";
import { extensionOf } from "../lib/r2";
import { currentUser } from "../auth/session";

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

export default admin;
