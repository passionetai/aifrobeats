import { Hono } from "hono";
import type { Env } from "../env";
import { newId } from "../lib/id";
import { currentUser } from "../auth/session";

const social = new Hono<{ Bindings: Env }>();

// Fixed reaction palette.
const EMOJI = ["🔥", "❤️", "🕺", "💯"];

// GET /api/tracks/:id/comments
social.get("/tracks/:id/comments", async (c) => {
  const id = c.req.param("id");
  const { results } = await c.env.DB.prepare(
    `SELECT c.id, c.body, c.created_at, u.handle, u.display_name
     FROM comments c JOIN users u ON u.id = c.user_id
     WHERE c.track_id = ? AND c.status = 'visible'
     ORDER BY c.created_at DESC LIMIT 200`
  ).bind(id).all<{ id: string; body: string; created_at: string; handle: string; display_name: string }>();
  return c.json({ comments: results ?? [] });
});

// POST /api/tracks/:id/comments { body }
social.post("/tracks/:id/comments", async (c) => {
  const user = await currentUser(c.env, c.req.raw);
  if (!user) return c.json({ error: "sign in to comment" }, 401);
  const id = c.req.param("id");
  const { body } = await c.req.json<{ body?: string }>().catch(() => ({ body: "" }));
  const text = (body || "").trim().slice(0, 1000);
  if (!text) return c.json({ error: "empty comment" }, 400);

  const exists = await c.env.DB.prepare("SELECT 1 FROM tracks WHERE id = ?").bind(id).first();
  if (!exists) return c.json({ error: "not_found" }, 404);

  const cid = newId();
  await c.env.DB.prepare(
    "INSERT INTO comments (id, track_id, user_id, body) VALUES (?, ?, ?, ?)"
  ).bind(cid, id, user.id, text).run();

  return c.json({ ok: true, comment: { id: cid, body: text, created_at: new Date().toISOString(), handle: user.handle, display_name: user.display_name } });
});

// DELETE /api/comments/:id  (author or admin)
social.delete("/comments/:id", async (c) => {
  const user = await currentUser(c.env, c.req.raw);
  if (!user) return c.json({ error: "unauthorized" }, 401);
  const id = c.req.param("id");
  const row = await c.env.DB.prepare("SELECT user_id FROM comments WHERE id = ?").bind(id).first<{ user_id: string }>();
  if (!row) return c.json({ error: "not_found" }, 404);
  if (row.user_id !== user.id && user.role !== "admin") return c.json({ error: "forbidden" }, 403);
  await c.env.DB.prepare("UPDATE comments SET status = 'hidden' WHERE id = ?").bind(id).run();
  return c.json({ ok: true });
});

// GET /api/tracks/:id/reactions  -> counts per emoji + which ones the user has set
social.get("/tracks/:id/reactions", async (c) => {
  const id = c.req.param("id");
  const { results } = await c.env.DB.prepare(
    "SELECT emoji, COUNT(*) AS n FROM reactions WHERE track_id = ? GROUP BY emoji"
  ).bind(id).all<{ emoji: string; n: number }>();
  const counts: Record<string, number> = {};
  for (const e of EMOJI) counts[e] = 0;
  for (const r of results ?? []) counts[r.emoji] = r.n;

  let mine: string[] = [];
  const user = await currentUser(c.env, c.req.raw);
  if (user) {
    const { results: m } = await c.env.DB.prepare(
      "SELECT emoji FROM reactions WHERE track_id = ? AND user_id = ?"
    ).bind(id, user.id).all<{ emoji: string }>();
    mine = (m ?? []).map((r) => r.emoji);
  }
  return c.json({ counts, mine, palette: EMOJI });
});

// POST /api/tracks/:id/reactions { emoji }  -> toggle
social.post("/tracks/:id/reactions", async (c) => {
  const user = await currentUser(c.env, c.req.raw);
  if (!user) return c.json({ error: "sign in to react" }, 401);
  const id = c.req.param("id");
  const { emoji } = await c.req.json<{ emoji?: string }>().catch(() => ({ emoji: "" }));
  if (!emoji || !EMOJI.includes(emoji)) return c.json({ error: "invalid emoji" }, 400);

  const del = await c.env.DB.prepare(
    "DELETE FROM reactions WHERE track_id = ? AND user_id = ? AND emoji = ?"
  ).bind(id, user.id, emoji).run();

  let on = false;
  if (del.meta.changes === 0) {
    await c.env.DB.prepare(
      "INSERT OR IGNORE INTO reactions (track_id, user_id, emoji) VALUES (?, ?, ?)"
    ).bind(id, user.id, emoji).run();
    on = true;
  }
  return c.json({ ok: true, emoji, on });
});

export default social;
