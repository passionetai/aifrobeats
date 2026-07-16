import { Hono } from "hono";
import type { Env } from "../env";
import { streamObject } from "../lib/r2";

const tracks = new Hono<{ Bindings: Env }>();

interface TrackRow {
  id: string;
  title: string;
  artist: string;
  mood: string | null;
  tags: string | null;
  duration_sec: number | null;
  credited_user: string | null;
  play_count: number;
  score: number;
  status: string;
  released_at: string;
}

// GET /api/tracks?sort=new|top&mood=&page=
tracks.get("/", async (c) => {
  const sort = c.req.query("sort") || "new";
  const mood = c.req.query("mood");
  const page = Math.max(1, parseInt(c.req.query("page") || "1", 10));
  const perPage = 24;
  const offset = (page - 1) * perPage;

  const order = sort === "top" ? "score DESC, released_at DESC" : "released_at DESC";
  const where = mood ? "status = 'live' AND mood = ?" : "status = 'live'";
  const binds = mood ? [mood, perPage, offset] : [perPage, offset];

  const { results } = await c.env.DB.prepare(
    `SELECT id, title, artist, mood, tags, duration_sec, credited_user, play_count, score, status, released_at
     FROM tracks WHERE ${where}
     ORDER BY ${order} LIMIT ? OFFSET ?`
  ).bind(...binds).all<TrackRow>();

  return c.json({ tracks: results ?? [], page });
});

// GET /api/tracks/:id
tracks.get("/:id", async (c) => {
  const id = c.req.param("id");
  const row = await c.env.DB.prepare(
    `SELECT id, title, artist, mood, tags, duration_sec, credited_user, play_count, score, status, released_at
     FROM tracks WHERE id = ?`
  ).bind(id).first<TrackRow>();
  if (!row) return c.json({ error: "not_found" }, 404);
  return c.json({ track: row });
});

// GET /api/tracks/:id/audio  (range-enabled stream)
tracks.get("/:id/audio", async (c) => {
  const id = c.req.param("id");
  const row = await c.env.DB.prepare("SELECT audio_key FROM tracks WHERE id = ?")
    .bind(id).first<{ audio_key: string }>();
  if (!row) return c.text("not found", 404);
  return streamObject(c.env.MEDIA, row.audio_key, c.req.header("Range") ?? null);
});

// GET /api/tracks/:id/cover
tracks.get("/:id/cover", async (c) => {
  const id = c.req.param("id");
  const row = await c.env.DB.prepare("SELECT cover_key FROM tracks WHERE id = ?")
    .bind(id).first<{ cover_key: string }>();
  if (!row) return c.text("not found", 404);
  return streamObject(c.env.MEDIA, row.cover_key, c.req.header("Range") ?? null);
});

// POST /api/tracks/:id/play  (fire-and-forget play count bump)
tracks.post("/:id/play", async (c) => {
  const id = c.req.param("id");
  await c.env.DB.prepare("UPDATE tracks SET play_count = play_count + 1 WHERE id = ?")
    .bind(id).run();
  return c.json({ ok: true });
});

export default tracks;
