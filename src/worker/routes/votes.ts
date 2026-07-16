import { Hono } from "hono";
import type { Env } from "../env";
import { currentUser } from "../auth/session";

const votes = new Hono<{ Bindings: Env }>();

// POST /api/tracks/:id/vote  -> upvote (idempotent). Returns new score + voted.
votes.post("/tracks/:id/vote", async (c) => {
  const user = await currentUser(c.env, c.req.raw);
  if (!user) return c.json({ error: "sign in to vote" }, 401);
  const id = c.req.param("id");

  const exists = await c.env.DB.prepare("SELECT 1 FROM tracks WHERE id = ?").bind(id).first();
  if (!exists) return c.json({ error: "not_found" }, 404);

  const ins = await c.env.DB.prepare(
    "INSERT OR IGNORE INTO votes (user_id, track_id, value) VALUES (?, ?, 1)"
  ).bind(user.id, id).run();

  if (ins.meta.changes > 0) {
    const row = await c.env.DB.prepare(
      "UPDATE tracks SET score = score + 1 WHERE id = ? RETURNING score"
    ).bind(id).first<{ score: number }>();
    return c.json({ ok: true, voted: true, score: row?.score ?? 0 });
  }
  const row = await c.env.DB.prepare("SELECT score FROM tracks WHERE id = ?").bind(id).first<{ score: number }>();
  return c.json({ ok: true, voted: true, score: row?.score ?? 0 });
});

// DELETE /api/tracks/:id/vote  -> remove upvote.
votes.delete("/tracks/:id/vote", async (c) => {
  const user = await currentUser(c.env, c.req.raw);
  if (!user) return c.json({ error: "sign in to vote" }, 401);
  const id = c.req.param("id");

  const del = await c.env.DB.prepare(
    "DELETE FROM votes WHERE user_id = ? AND track_id = ?"
  ).bind(user.id, id).run();

  if (del.meta.changes > 0) {
    const row = await c.env.DB.prepare(
      "UPDATE tracks SET score = MAX(0, score - 1) WHERE id = ? RETURNING score"
    ).bind(id).first<{ score: number }>();
    return c.json({ ok: true, voted: false, score: row?.score ?? 0 });
  }
  const row = await c.env.DB.prepare("SELECT score FROM tracks WHERE id = ?").bind(id).first<{ score: number }>();
  return c.json({ ok: true, voted: false, score: row?.score ?? 0 });
});

// GET /api/me/votes  -> { track_ids: [...] } the current user has upvoted.
votes.get("/me/votes", async (c) => {
  const user = await currentUser(c.env, c.req.raw);
  if (!user) return c.json({ track_ids: [] });
  const { results } = await c.env.DB.prepare(
    "SELECT track_id FROM votes WHERE user_id = ?"
  ).bind(user.id).all<{ track_id: string }>();
  return c.json({ track_ids: (results ?? []).map((r) => r.track_id) });
});

export default votes;
