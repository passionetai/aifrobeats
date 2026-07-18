import { Hono } from "hono";
import type { Env } from "../env";
import { currentUser } from "../auth/session";

const subscribe = new Hono<{ Bindings: Env }>();

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// POST /api/subscribe { email }
subscribe.post("/", async (c) => {
  const { email } = await c.req.json<{ email?: string }>().catch(() => ({ email: "" }));
  const clean = (email || "").trim().toLowerCase();
  if (!EMAIL_RE.test(clean)) return c.json({ error: "Enter a valid email." }, 400);

  const user = await currentUser(c.env, c.req.raw);
  await c.env.DB.prepare(
    "INSERT OR IGNORE INTO subscribers (email, user_id, source) VALUES (?, ?, ?)"
  ).bind(clean, user?.id ?? null, "site").run();

  return c.json({ ok: true });
});

// GET /api/admin/subscribers/count is handled in admin routes.

export default subscribe;
