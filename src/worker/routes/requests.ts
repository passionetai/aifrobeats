import { Hono } from "hono";
import type { Env } from "../env";
import { newId } from "../lib/id";
import { currentUser } from "../auth/session";

const requests = new Hono<{ Bindings: Env }>();

// Tunable rules. Change these two numbers to retune the Booth.
export const WIN_THRESHOLD = 25;      // votes needed to auto-win
export const MAX_OPEN_PER_USER = 3;   // open requests a fan can hold at once

function currentCycle(): string {
  return new Date().toISOString().slice(0, 7); // YYYY-MM
}

interface RequestRow {
  id: string;
  title: string;
  brief: string;
  mood: string | null;
  vote_count: number;
  status: string;
  created_at: string;
  handle: string;
  display_name: string;
}

// GET /api/requests?status=open  -> ranked open requests (default), or by status
requests.get("/", async (c) => {
  const status = c.req.query("status") || "open";
  const { results } = await c.env.DB.prepare(
    `SELECT r.id, r.title, r.brief, r.mood, r.vote_count, r.status, r.created_at, u.handle, u.display_name
     FROM requests r JOIN users u ON u.id = r.user_id
     WHERE r.status = ?
     ORDER BY r.vote_count DESC, r.created_at ASC LIMIT 100`
  ).bind(status).all<RequestRow>();

  // which of these has the current user voted for
  let mine: string[] = [];
  const user = await currentUser(c.env, c.req.raw);
  if (user) {
    const { results: m } = await c.env.DB.prepare(
      "SELECT request_id FROM request_votes WHERE user_id = ?"
    ).bind(user.id).all<{ request_id: string }>();
    mine = (m ?? []).map((r) => r.request_id);
  }

  return c.json({ requests: results ?? [], threshold: WIN_THRESHOLD, voted: mine });
});

// GET /api/requests/winners  -> selected + fulfilled, newest first
requests.get("/winners", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT r.id, r.title, r.brief, r.mood, r.vote_count, r.status, r.created_at,
            u.handle, u.display_name, r.fulfilled_track_id
     FROM requests r JOIN users u ON u.id = r.user_id
     WHERE r.status IN ('selected', 'fulfilled')
     ORDER BY r.created_at DESC LIMIT 50`
  ).bind().all();
  return c.json({ winners: results ?? [], threshold: WIN_THRESHOLD });
});

// POST /api/requests { title, brief, mood }
requests.post("/", async (c) => {
  const user = await currentUser(c.env, c.req.raw);
  if (!user) return c.json({ error: "sign in to request" }, 401);

  type Body = { title?: string; brief?: string; mood?: string };
  const { title, brief, mood } = await c.req.json<Body>().catch(() => ({} as Body));
  const t = (title || "").trim().slice(0, 80);
  const b = (brief || "").trim().slice(0, 500);
  if (!t || !b) return c.json({ error: "Add a title and a brief." }, 400);

  const open = await c.env.DB.prepare(
    "SELECT COUNT(*) AS n FROM requests WHERE user_id = ? AND status = 'open'"
  ).bind(user.id).first<{ n: number }>();
  if ((open?.n ?? 0) >= MAX_OPEN_PER_USER) {
    return c.json({ error: `You can hold ${MAX_OPEN_PER_USER} open requests at a time. Wait for one to close.` }, 429);
  }

  const id = newId();
  await c.env.DB.prepare(
    "INSERT INTO requests (id, user_id, title, brief, mood, cycle) VALUES (?, ?, ?, ?, ?, ?)"
  ).bind(id, user.id, t, b, (mood || "").trim() || null, currentCycle()).run();

  return c.json({ ok: true, id });
});

// POST /api/requests/:id/vote  -> upvote; auto-selects on hitting threshold
requests.post("/:id/vote", async (c) => {
  const user = await currentUser(c.env, c.req.raw);
  if (!user) return c.json({ error: "sign in to vote" }, 401);
  const id = c.req.param("id");

  const req = await c.env.DB.prepare("SELECT status FROM requests WHERE id = ?").bind(id).first<{ status: string }>();
  if (!req) return c.json({ error: "not_found" }, 404);
  if (req.status !== "open") return c.json({ error: "This request is closed." }, 409);

  const ins = await c.env.DB.prepare(
    "INSERT OR IGNORE INTO request_votes (user_id, request_id) VALUES (?, ?)"
  ).bind(user.id, id).run();

  let row = await c.env.DB.prepare("SELECT vote_count FROM requests WHERE id = ?").bind(id).first<{ vote_count: number }>();
  if (ins.meta.changes > 0) {
    row = await c.env.DB.prepare(
      "UPDATE requests SET vote_count = vote_count + 1 WHERE id = ? RETURNING vote_count"
    ).bind(id).first<{ vote_count: number }>();
  }

  const count = row?.vote_count ?? 0;
  let status = "open";
  if (count >= WIN_THRESHOLD) {
    await c.env.DB.prepare("UPDATE requests SET status = 'selected' WHERE id = ? AND status = 'open'").bind(id).run();
    status = "selected";
  }
  return c.json({ ok: true, voted: true, vote_count: count, status });
});

// DELETE /api/requests/:id/vote
requests.delete("/:id/vote", async (c) => {
  const user = await currentUser(c.env, c.req.raw);
  if (!user) return c.json({ error: "sign in" }, 401);
  const id = c.req.param("id");
  const req = await c.env.DB.prepare("SELECT status FROM requests WHERE id = ?").bind(id).first<{ status: string }>();
  if (!req) return c.json({ error: "not_found" }, 404);
  if (req.status !== "open") return c.json({ error: "This request is closed." }, 409);

  const del = await c.env.DB.prepare(
    "DELETE FROM request_votes WHERE user_id = ? AND request_id = ?"
  ).bind(user.id, id).run();
  let row = await c.env.DB.prepare("SELECT vote_count FROM requests WHERE id = ?").bind(id).first<{ vote_count: number }>();
  if (del.meta.changes > 0) {
    row = await c.env.DB.prepare(
      "UPDATE requests SET vote_count = MAX(0, vote_count - 1) WHERE id = ? RETURNING vote_count"
    ).bind(id).first<{ vote_count: number }>();
  }
  return c.json({ ok: true, voted: false, vote_count: row?.vote_count ?? 0 });
});

// DELETE /api/requests/:id  (author or admin, only while open)
requests.delete("/:id", async (c) => {
  const user = await currentUser(c.env, c.req.raw);
  if (!user) return c.json({ error: "unauthorized" }, 401);
  const id = c.req.param("id");
  const row = await c.env.DB.prepare("SELECT user_id, status FROM requests WHERE id = ?").bind(id).first<{ user_id: string; status: string }>();
  if (!row) return c.json({ error: "not_found" }, 404);
  if (row.user_id !== user.id && user.role !== "admin") return c.json({ error: "forbidden" }, 403);
  await c.env.DB.prepare("DELETE FROM request_votes WHERE request_id = ?").bind(id).run();
  await c.env.DB.prepare("DELETE FROM requests WHERE id = ?").bind(id).run();
  return c.json({ ok: true });
});

export default requests;
