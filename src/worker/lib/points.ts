import type { Env } from "../env";

// Award points to a user and log the event. Non-farmable callers only.
export async function award(env: Env, userId: string, kind: string, points: number, refId?: string): Promise<void> {
  await env.DB.prepare(
    "INSERT INTO point_events (user_id, kind, points, ref_id) VALUES (?, ?, ?, ?)"
  ).bind(userId, kind, points, refId ?? null).run();
  await env.DB.prepare("UPDATE users SET points = points + ? WHERE id = ?").bind(points, userId).run();
}

// Badge tiers derived from points (no storage needed).
export function badgeFor(points: number): string {
  if (points >= 500) return "Tastemaker";
  if (points >= 200) return "Curator";
  if (points >= 50) return "Selector";
  return "Listener";
}
