import { Hono } from "hono";
import type { Env } from "../env";
import { newId, slugify } from "../lib/id";
import { sendMagicLink } from "./email";
import { createSession, sessionCookie, clearCookie, currentUser, deleteSession, randomToken } from "./session";

const auth = new Hono<{ Bindings: Env }>();

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// POST /api/auth/request-link { email }
auth.post("/request-link", async (c) => {
  const { email } = await c.req.json<{ email?: string }>().catch(() => ({ email: "" }));
  const clean = (email || "").trim().toLowerCase();
  if (!EMAIL_RE.test(clean)) return c.json({ error: "Enter a valid email." }, 400);

  const token = randomToken(24);
  const expires = new Date(Date.now() + 15 * 60_000).toISOString();
  await c.env.DB.prepare(
    "INSERT INTO magic_tokens (token, email, expires_at) VALUES (?, ?, ?)"
  ).bind(token, clean, expires).run();

  // Build the link from the domain the request actually came in on, so it
  // works on workers.dev now and on aifrobeats.com later without reconfig.
  const origin = new URL(c.req.url).origin;
  const link = `${origin}/api/auth/verify?token=${token}`;
  await sendMagicLink(c.env, clean, link);

  // Always report success so we never reveal who has an account.
  return c.json({ ok: true });
});

// GET /api/auth/verify?token=...  (from the email link) -> sets cookie, redirects
auth.get("/verify", async (c) => {
  const token = c.req.query("token") || "";
  const row = await c.env.DB.prepare(
    "SELECT email, expires_at, used FROM magic_tokens WHERE token = ?"
  ).bind(token).first<{ email: string; expires_at: string; used: number }>();

  const fail = (reason: string) =>
    c.redirect(`/login?error=${encodeURIComponent(reason)}`, 302);

  if (!row) return fail("invalid");
  if (row.used) return fail("used");
  if (new Date(row.expires_at).getTime() < Date.now()) return fail("expired");

  await c.env.DB.prepare("UPDATE magic_tokens SET used = 1 WHERE token = ?").bind(token).run();

  // Find existing user or create one.
  let user = await c.env.DB.prepare(
    "SELECT id, handle FROM users WHERE email = ?"
  ).bind(row.email).first<{ id: string; handle: string }>();

  let isNew = false;
  if (!user) {
    isNew = true;
    const id = newId();
    const base = slugify(row.email.split("@")[0]) || "fan";
    let handle = `${base}-${randomToken(2)}`;
    // ensure unique handle
    for (let i = 0; i < 5; i++) {
      const clash = await c.env.DB.prepare("SELECT 1 FROM users WHERE handle = ?").bind(handle).first();
      if (!clash) break;
      handle = `${base}-${randomToken(3)}`;
    }
    const role = c.env.OWNER_EMAIL && row.email === c.env.OWNER_EMAIL.toLowerCase() ? "admin" : "user";
    await c.env.DB.prepare(
      "INSERT INTO users (id, handle, display_name, email, role) VALUES (?, ?, ?, ?, ?)"
    ).bind(id, handle, base, row.email, role).run();
    user = { id, handle };
  } else if (c.env.OWNER_EMAIL && row.email === c.env.OWNER_EMAIL.toLowerCase()) {
    // keep owner as admin even if the row predates OWNER_EMAIL
    await c.env.DB.prepare("UPDATE users SET role = 'admin' WHERE id = ?").bind(user.id).run();
  }

  const sid = await createSession(c.env, user.id);
  c.header("Set-Cookie", sessionCookie(sid));
  return c.redirect(isNew ? "/onboard" : "/", 302);
});

// POST /api/auth/logout
auth.post("/logout", async (c) => {
  await deleteSession(c.env, c.req.raw);
  c.header("Set-Cookie", clearCookie());
  return c.json({ ok: true });
});

// GET /api/auth/me
auth.get("/me", async (c) => {
  const user = await currentUser(c.env, c.req.raw);
  return c.json({ user });
});

// PATCH /api/auth/profile { handle?, display_name?, bio? }
auth.patch("/profile", async (c) => {
  const user = await currentUser(c.env, c.req.raw);
  if (!user) return c.json({ error: "not signed in" }, 401);

  type Patch = { handle?: string; display_name?: string; bio?: string };
  const body = await c.req.json<Patch>().catch(() => ({} as Patch));
  const sets: string[] = [];
  const binds: unknown[] = [];

  if (body.handle) {
    const h = slugify(body.handle);
    if (h.length < 2) return c.json({ error: "Handle too short." }, 400);
    const clash = await c.env.DB.prepare("SELECT 1 FROM users WHERE handle = ? AND id != ?")
      .bind(h, user.id).first();
    if (clash) return c.json({ error: "That handle is taken." }, 409);
    sets.push("handle = ?"); binds.push(h);
  }
  if (body.display_name !== undefined) { sets.push("display_name = ?"); binds.push(body.display_name.trim().slice(0, 40) || user.display_name); }
  if (body.bio !== undefined) { sets.push("bio = ?"); binds.push(body.bio.slice(0, 300)); }

  if (sets.length === 0) return c.json({ error: "nothing to update" }, 400);
  binds.push(user.id);
  await c.env.DB.prepare(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`).bind(...binds).run();

  const updated = await currentUser(c.env, c.req.raw);
  return c.json({ ok: true, user: updated });
});

export default auth;
