import { Hono } from "hono";
import type { Env } from "./env";
import auth from "./auth/routes";
import tracks from "./routes/tracks";
import votes from "./routes/votes";
import chart from "./routes/chart";
import comments from "./routes/comments";
import admin from "./routes/admin";
import { recomputeChart } from "./jobs/recompute-chart";

const app = new Hono<{ Bindings: Env }>();

// --- API ---------------------------------------------------------------

// Liveness check.
app.get("/api/health", (c) => c.json({ ok: true, service: "aifrobeats", phase: "1c" }));

// Confirms D1 is wired. Returns the current track count (0 until content loads).
app.get("/api/status", async (c) => {
  try {
    const row = await c.env.DB.prepare(
      "SELECT COUNT(*) AS n FROM tracks"
    ).first<{ n: number }>();
    return c.json({ ok: true, db: "connected", tracks: row?.n ?? 0 });
  } catch (err) {
    return c.json({ ok: false, db: "error", message: String(err) }, 500);
  }
});

// Phase 1a/1b/1c routes.
app.route("/api/auth", auth);
app.route("/api/tracks", tracks);
app.route("/api", votes);        // /api/tracks/:id/vote, /api/me/votes
app.route("/api/chart", chart);
app.route("/api", comments);     // /api/tracks/:id/comments, /api/comments/:id, /api/tracks/:id/reactions
app.route("/api/admin", admin);

// Mounts in later sittings:
//   app.route("/api/requests", requests); // Phase 2

// --- SPA ---------------------------------------------------------------
// Anything that is not /api/* is served by the static assets (the built
// React app). not_found_handling = "single-page-application" handles deep links.
app.all("/api/*", (c) => c.json({ ok: false, error: "not_found" }, 404));
app.get("*", (c) => c.env.ASSETS.fetch(c.req.raw));

export default {
  fetch: app.fetch,

  // Hourly chart recompute (cron: 0 * * * *).
  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(recomputeChart(env));
  },
};

// RadioRoom Durable Object is exported here once Phase 3 enables it:
// export { RadioRoom } from "./durable/radio-room";
