import { Hono } from "hono";
import type { Env } from "../env";
import { currentUser } from "../auth/session";
import { badgeFor } from "../lib/points";

const users = new Hono<{ Bindings: Env }>();

// GET /api/users/curators  -> leaderboard (points, then followers)
users.get("/curators", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT u.handle, u.display_name, u.points,
            (SELECT COUNT(*) FROM follows f WHERE f.followee_id = u.id) AS followers,
            (SELECT COUNT(*) FROM playlists p WHERE p.user_id = u.id AND p.is_public = 1) AS playlists
     FROM users u
     ORDER BY u.points DESC, followers DESC LIMIT 50`
  ).all<{ handle: string; display_name: string; points: number; followers: number; playlists: number }>();
  const list = (results ?? []).map((u) => ({ ...u, badge: badgeFor(u.points) }));
  return c.json({ curators: list });
});

// GET /api/users/:handle  -> public profile
users.get("/:handle", async (c) => {
  const handle = c.req.param("handle");
  const u = await c.env.DB.prepare(
    "SELECT id, handle, display_name, bio, points, created_at FROM users WHERE handle = ?"
  ).bind(handle).first<{ id: string; handle: string; display_name: string; bio: string | null; points: number; created_at: string }>();
  if (!u) return c.json({ error: "not_found" }, 404);

  const followers = await c.env.DB.prepare("SELECT COUNT(*) AS n FROM follows WHERE followee_id = ?").bind(u.id).first<{ n: number }>();
  const following = await c.env.DB.prepare("SELECT COUNT(*) AS n FROM follows WHERE follower_id = ?").bind(u.id).first<{ n: number }>();
  const { results: pls } = await c.env.DB.prepare(
    `SELECT p.id, p.title, (SELECT COUNT(*) FROM playlist_tracks pt WHERE pt.playlist_id = p.id) AS track_count
     FROM playlists p WHERE p.user_id = ? AND p.is_public = 1 ORDER BY p.created_at DESC`
  ).bind(u.id).all();

  const me = await currentUser(c.env, c.req.raw);
  let is_following = false;
  if (me) {
    const f = await c.env.DB.prepare("SELECT 1 FROM follows WHERE follower_id = ? AND followee_id = ?").bind(me.id, u.id).first();
    is_following = !!f;
  }

  return c.json({
    profile: {
      handle: u.handle, display_name: u.display_name, bio: u.bio, points: u.points,
      badge: badgeFor(u.points), created_at: u.created_at,
      followers: followers?.n ?? 0, following: following?.n ?? 0,
    },
    playlists: pls ?? [],
    is_following,
    is_me: me?.id === u.id,
  });
});

// POST /api/users/:handle/follow
users.post("/:handle/follow", async (c) => {
  const me = await currentUser(c.env, c.req.raw);
  if (!me) return c.json({ error: "sign in" }, 401);
  const handle = c.req.param("handle");
  const target = await c.env.DB.prepare("SELECT id FROM users WHERE handle = ?").bind(handle).first<{ id: string }>();
  if (!target) return c.json({ error: "not_found" }, 404);
  if (target.id === me.id) return c.json({ error: "cannot follow yourself" }, 400);
  await c.env.DB.prepare("INSERT OR IGNORE INTO follows (follower_id, followee_id) VALUES (?, ?)").bind(me.id, target.id).run();
  return c.json({ ok: true, following: true });
});

// DELETE /api/users/:handle/follow
users.delete("/:handle/follow", async (c) => {
  const me = await currentUser(c.env, c.req.raw);
  if (!me) return c.json({ error: "sign in" }, 401);
  const handle = c.req.param("handle");
  const target = await c.env.DB.prepare("SELECT id FROM users WHERE handle = ?").bind(handle).first<{ id: string }>();
  if (!target) return c.json({ error: "not_found" }, 404);
  await c.env.DB.prepare("DELETE FROM follows WHERE follower_id = ? AND followee_id = ?").bind(me.id, target.id).run();
  return c.json({ ok: true, following: false });
});

export default users;
