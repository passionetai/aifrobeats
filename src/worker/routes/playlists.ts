import { Hono } from "hono";
import type { Env } from "../env";
import { newId } from "../lib/id";
import { currentUser } from "../auth/session";

const playlists = new Hono<{ Bindings: Env }>();

// GET /api/playlists  -> public playlists for discovery
playlists.get("/", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT p.id, p.title, p.description, p.created_at, u.handle, u.display_name,
            (SELECT COUNT(*) FROM playlist_tracks pt WHERE pt.playlist_id = p.id) AS track_count
     FROM playlists p JOIN users u ON u.id = p.user_id
     WHERE p.is_public = 1
     ORDER BY p.created_at DESC LIMIT 60`
  ).all();
  return c.json({ playlists: results ?? [] });
});

// GET /api/playlists/mine  -> current user's playlists
playlists.get("/mine", async (c) => {
  const user = await currentUser(c.env, c.req.raw);
  if (!user) return c.json({ playlists: [] });
  const { results } = await c.env.DB.prepare(
    `SELECT p.id, p.title, p.description, p.is_public, p.created_at,
            (SELECT COUNT(*) FROM playlist_tracks pt WHERE pt.playlist_id = p.id) AS track_count
     FROM playlists p WHERE p.user_id = ? ORDER BY p.created_at DESC`
  ).bind(user.id).all();
  return c.json({ playlists: results ?? [] });
});

// POST /api/playlists { title, description, is_public }
playlists.post("/", async (c) => {
  const user = await currentUser(c.env, c.req.raw);
  if (!user) return c.json({ error: "sign in" }, 401);
  type Body = { title?: string; description?: string; is_public?: boolean };
  const b = await c.req.json<Body>().catch(() => ({} as Body));
  const title = (b.title || "").trim().slice(0, 80);
  if (!title) return c.json({ error: "Title required." }, 400);
  const id = newId();
  await c.env.DB.prepare(
    "INSERT INTO playlists (id, user_id, title, description, is_public) VALUES (?, ?, ?, ?, ?)"
  ).bind(id, user.id, title, (b.description || "").trim().slice(0, 300) || null, b.is_public === false ? 0 : 1).run();
  return c.json({ ok: true, id });
});

// GET /api/playlists/:id  -> detail with ordered tracks
playlists.get("/:id", async (c) => {
  const id = c.req.param("id");
  const pl = await c.env.DB.prepare(
    `SELECT p.id, p.title, p.description, p.is_public, p.user_id, u.handle, u.display_name
     FROM playlists p JOIN users u ON u.id = p.user_id WHERE p.id = ?`
  ).bind(id).first<{ id: string; title: string; description: string | null; is_public: number; user_id: string; handle: string; display_name: string }>();
  if (!pl) return c.json({ error: "not_found" }, 404);

  const { results } = await c.env.DB.prepare(
    `SELECT t.id, t.title, t.artist, t.mood, t.score, pt.position
     FROM playlist_tracks pt JOIN tracks t ON t.id = pt.track_id
     WHERE pt.playlist_id = ? ORDER BY pt.position ASC`
  ).bind(id).all();

  const user = await currentUser(c.env, c.req.raw);
  return c.json({ playlist: pl, tracks: results ?? [], is_owner: user?.id === pl.user_id });
});

// POST /api/playlists/:id/tracks { track_id }  (owner)
playlists.post("/:id/tracks", async (c) => {
  const user = await currentUser(c.env, c.req.raw);
  if (!user) return c.json({ error: "sign in" }, 401);
  const id = c.req.param("id");
  const pl = await c.env.DB.prepare("SELECT user_id FROM playlists WHERE id = ?").bind(id).first<{ user_id: string }>();
  if (!pl) return c.json({ error: "not_found" }, 404);
  if (pl.user_id !== user.id) return c.json({ error: "forbidden" }, 403);
  const b = await c.req.json<{ track_id?: string }>().catch(() => ({ track_id: "" }));
  if (!b.track_id) return c.json({ error: "track_id required" }, 400);

  const pos = await c.env.DB.prepare("SELECT COALESCE(MAX(position), 0) + 1 AS n FROM playlist_tracks WHERE playlist_id = ?").bind(id).first<{ n: number }>();
  await c.env.DB.prepare(
    "INSERT OR IGNORE INTO playlist_tracks (playlist_id, track_id, position) VALUES (?, ?, ?)"
  ).bind(id, b.track_id, pos?.n ?? 1).run();
  return c.json({ ok: true });
});

// DELETE /api/playlists/:id/tracks/:trackId  (owner)
playlists.delete("/:id/tracks/:trackId", async (c) => {
  const user = await currentUser(c.env, c.req.raw);
  if (!user) return c.json({ error: "sign in" }, 401);
  const id = c.req.param("id");
  const trackId = c.req.param("trackId");
  const pl = await c.env.DB.prepare("SELECT user_id FROM playlists WHERE id = ?").bind(id).first<{ user_id: string }>();
  if (!pl || pl.user_id !== user.id) return c.json({ error: "forbidden" }, 403);
  await c.env.DB.prepare("DELETE FROM playlist_tracks WHERE playlist_id = ? AND track_id = ?").bind(id, trackId).run();
  return c.json({ ok: true });
});

// DELETE /api/playlists/:id  (owner)
playlists.delete("/:id", async (c) => {
  const user = await currentUser(c.env, c.req.raw);
  if (!user) return c.json({ error: "sign in" }, 401);
  const id = c.req.param("id");
  const pl = await c.env.DB.prepare("SELECT user_id FROM playlists WHERE id = ?").bind(id).first<{ user_id: string }>();
  if (!pl || pl.user_id !== user.id) return c.json({ error: "forbidden" }, 403);
  await c.env.DB.prepare("DELETE FROM playlist_tracks WHERE playlist_id = ?").bind(id).run();
  await c.env.DB.prepare("DELETE FROM playlists WHERE id = ?").bind(id).run();
  return c.json({ ok: true });
});

export default playlists;
