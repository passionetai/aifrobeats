import type { Env } from "../env";

export interface ChartEntry {
  position: number;
  prev_pos: number | null;
  track_id: string;
  title: string;
  artist: string;
  mood: string | null;
  score: number;
}

// Runs hourly. Corrects score drift from the vote table, ranks the top 100,
// computes movement vs the last snapshot, writes a new snapshot, and caches
// the current chart JSON in KV for fast reads.
export async function recomputeChart(env: Env): Promise<void> {
  // 1. Correct cached scores from the source of truth (vote counts).
  await env.DB.prepare(
    `UPDATE tracks SET score = (
       SELECT COUNT(*) FROM votes WHERE votes.track_id = tracks.id AND votes.value = 1
     )`
  ).run();

  // 2. Rank the top 100 live tracks.
  const { results: ranked } = await env.DB.prepare(
    `SELECT id, title, artist, mood, score
     FROM tracks WHERE status = 'live'
     ORDER BY score DESC, released_at DESC
     LIMIT 100`
  ).all<{ id: string; title: string; artist: string; mood: string | null; score: number }>();

  const tracks = ranked ?? [];

  // 3. Pull the previous snapshot's positions for movement arrows.
  const prev = await env.DB.prepare(
    "SELECT track_id, position FROM chart_snapshots WHERE taken_at = (SELECT MAX(taken_at) FROM chart_snapshots)"
  ).all<{ track_id: string; position: number }>();
  const prevPos = new Map<string, number>();
  for (const r of prev.results ?? []) prevPos.set(r.track_id, r.position);

  // 4. Build entries and the new snapshot rows.
  const takenAt = new Date().toISOString();
  const entries: ChartEntry[] = [];
  const stmts: D1PreparedStatement[] = [];
  const insert = env.DB.prepare(
    "INSERT INTO chart_snapshots (taken_at, position, track_id, score, prev_pos) VALUES (?, ?, ?, ?, ?)"
  );

  tracks.forEach((t, i) => {
    const position = i + 1;
    const prev_pos = prevPos.has(t.id) ? prevPos.get(t.id)! : null;
    entries.push({ position, prev_pos, track_id: t.id, title: t.title, artist: t.artist, mood: t.mood, score: t.score });
    stmts.push(insert.bind(takenAt, position, t.id, t.score, prev_pos));
  });

  if (stmts.length > 0) await env.DB.batch(stmts);

  // 5. Cache the chart for fast reads.
  await env.CACHE.put("chart:current", JSON.stringify({ updated_at: takenAt, entries }));

  // 6. Trim old snapshots so the table does not grow forever (keep ~14 days).
  await env.DB.prepare(
    "DELETE FROM chart_snapshots WHERE taken_at < datetime('now', '-14 days')"
  ).run();
}
