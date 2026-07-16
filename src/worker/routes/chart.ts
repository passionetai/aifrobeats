import { Hono } from "hono";
import type { Env } from "../env";
import type { ChartEntry } from "../jobs/recompute-chart";

const chart = new Hono<{ Bindings: Env }>();

// GET /api/chart -> live top 100 (so votes reflect immediately), with movement
// arrows derived from the most recent hourly snapshot. At low traffic a live
// query is cheap; switch to the KV cache ("chart:current") when volume grows.
chart.get("/", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT id, title, artist, mood, score
     FROM tracks WHERE status = 'live'
     ORDER BY score DESC, released_at DESC
     LIMIT 100`
  ).all<{ id: string; title: string; artist: string; mood: string | null; score: number }>();

  // Latest snapshot positions for movement arrows.
  const prev = await c.env.DB.prepare(
    "SELECT track_id, position FROM chart_snapshots WHERE taken_at = (SELECT MAX(taken_at) FROM chart_snapshots)"
  ).all<{ track_id: string; position: number }>();
  const prevPos = new Map<string, number>();
  for (const r of prev.results ?? []) prevPos.set(r.track_id, r.position);

  const entries: ChartEntry[] = (results ?? []).map((t, i) => ({
    position: i + 1,
    prev_pos: prevPos.has(t.id) ? prevPos.get(t.id)! : null,
    track_id: t.id,
    title: t.title,
    artist: t.artist,
    mood: t.mood,
    score: t.score,
  }));

  return c.json({ updated_at: new Date().toISOString(), entries });
});

export default chart;
