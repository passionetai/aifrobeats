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

// GET /api/subscribe/unsubscribe?e=email  -> remove from list
subscribe.get("/unsubscribe", async (c) => {
  const e = (c.req.query("e") || "").trim().toLowerCase();
  if (e) await c.env.DB.prepare("DELETE FROM subscribers WHERE email = ?").bind(e).run();
  return c.html(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Unsubscribed</title></head>
  <body style="font-family:system-ui;background:#0B0B14;color:#F5F3EF;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center">
  <div><h1 style="color:#FF6A2B">Unsubscribed</h1><p>You will no longer get Aifrobeats drop alerts.</p><a href="/" style="color:#FF6A2B">Back to Aifrobeats</a></div></body></html>`);
});

export default subscribe;
