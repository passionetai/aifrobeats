import { Hono } from "hono";
import type { Env } from "../env";
import { currentUser } from "../auth/session";

const radio = new Hono<{ Bindings: Env }>();

function room(env: Env) {
  const id = env.RADIO.idFromName("global");
  return env.RADIO.get(id);
}

// GET /api/radio/ws  -> upgrade and proxy to the RadioRoom (attaches handle if signed in)
radio.get("/ws", async (c) => {
  if (c.req.header("Upgrade") !== "websocket") {
    return c.text("expected websocket", 426);
  }
  const user = await currentUser(c.env, c.req.raw);
  const headers = new Headers(c.req.raw.headers);
  headers.set("x-handle", user?.handle || "");
  const doReq = new Request("https://radio/ws", { headers });
  return room(c.env).fetch(doReq);
});

// GET /api/radio/now  -> current rotation + anchor
radio.get("/now", async (c) => {
  return room(c.env).fetch(new Request("https://radio/now"));
});

export default radio;
