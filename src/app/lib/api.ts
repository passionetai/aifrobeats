export interface Track {
  id: string;
  title: string;
  artist: string;
  mood: string | null;
  tags: string | null;
  duration_sec: number | null;
  credited_user: string | null;
  play_count: number;
  score: number;
  status: string;
  released_at: string;
}

export const audioUrl = (id: string) => `/api/tracks/${id}/audio`;
export const coverUrl = (id: string) => `/api/tracks/${id}/cover`;

export async function listTracks(sort: "new" | "top" = "new", mood?: string): Promise<Track[]> {
  const params = new URLSearchParams({ sort });
  if (mood) params.set("mood", mood);
  const res = await fetch(`/api/tracks?${params.toString()}`);
  const data = (await res.json()) as { tracks: Track[] };
  return data.tracks ?? [];
}

export async function getTrack(id: string): Promise<Track | null> {
  const res = await fetch(`/api/tracks/${id}`);
  if (!res.ok) return null;
  const data = (await res.json()) as { track: Track };
  return data.track ?? null;
}

export function markPlay(id: string): void {
  // fire and forget
  fetch(`/api/tracks/${id}/play`, { method: "POST" }).catch(() => {});
}

export interface ChartEntry {
  position: number;
  prev_pos: number | null;
  track_id: string;
  title: string;
  artist: string;
  mood: string | null;
  score: number;
}

export async function getChart(): Promise<{ entries: ChartEntry[]; updated_at: string | null }> {
  const res = await fetch("/api/chart");
  const data = (await res.json()) as { entries: ChartEntry[]; updated_at: string | null };
  return { entries: data.entries ?? [], updated_at: data.updated_at };
}

export async function fetchMyVotes(): Promise<string[]> {
  const res = await fetch("/api/me/votes", { credentials: "same-origin" });
  if (!res.ok) return [];
  const data = (await res.json()) as { track_ids: string[] };
  return data.track_ids ?? [];
}

export async function castVote(id: string, on: boolean): Promise<{ ok: boolean; score?: number; error?: string }> {
  const res = await fetch(`/api/tracks/${id}/vote`, {
    method: on ? "POST" : "DELETE",
    credentials: "same-origin",
  });
  const data = (await res.json()) as { ok?: boolean; score?: number; error?: string };
  return { ok: !!data.ok, score: data.score, error: data.error };
}

export interface Comment {
  id: string;
  body: string;
  created_at: string;
  handle: string;
  display_name: string;
}

export async function getComments(trackId: string): Promise<Comment[]> {
  const res = await fetch(`/api/tracks/${trackId}/comments`);
  const data = (await res.json()) as { comments: Comment[] };
  return data.comments ?? [];
}

export async function postComment(trackId: string, body: string): Promise<{ ok: boolean; comment?: Comment; error?: string }> {
  const res = await fetch(`/api/tracks/${trackId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ body }),
  });
  const data = (await res.json()) as { ok?: boolean; comment?: Comment; error?: string };
  return { ok: !!data.ok, comment: data.comment, error: data.error };
}

export async function deleteComment(commentId: string): Promise<boolean> {
  const res = await fetch(`/api/comments/${commentId}`, { method: "DELETE", credentials: "same-origin" });
  const data = (await res.json()) as { ok?: boolean };
  return !!data.ok;
}

export interface Reactions {
  counts: Record<string, number>;
  mine: string[];
  palette: string[];
}

export async function getReactions(trackId: string): Promise<Reactions> {
  const res = await fetch(`/api/tracks/${trackId}/reactions`, { credentials: "same-origin" });
  return (await res.json()) as Reactions;
}

export async function toggleReaction(trackId: string, emoji: string): Promise<{ ok: boolean; on?: boolean; error?: string }> {
  const res = await fetch(`/api/tracks/${trackId}/reactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ emoji }),
  });
  const data = (await res.json()) as { ok?: boolean; on?: boolean; error?: string };
  return { ok: !!data.ok, on: data.on, error: data.error };
}

export interface RequestItem {
  id: string;
  title: string;
  brief: string;
  mood: string | null;
  vote_count: number;
  status: string;
  created_at: string;
  handle: string;
  display_name: string;
  fulfilled_track_id?: string | null;
}

export async function listRequests(status = "open"): Promise<{ requests: RequestItem[]; threshold: number; voted: string[] }> {
  const res = await fetch(`/api/requests?status=${status}`, { credentials: "same-origin" });
  const data = (await res.json()) as { requests: RequestItem[]; threshold: number; voted: string[] };
  return { requests: data.requests ?? [], threshold: data.threshold ?? 25, voted: data.voted ?? [] };
}

export async function listWinners(): Promise<{ winners: RequestItem[]; threshold: number }> {
  const res = await fetch(`/api/requests/winners`);
  const data = (await res.json()) as { winners: RequestItem[]; threshold: number };
  return { winners: data.winners ?? [], threshold: data.threshold ?? 25 };
}

export async function submitRequest(title: string, brief: string, mood: string): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(`/api/requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ title, brief, mood }),
  });
  const data = (await res.json()) as { ok?: boolean; error?: string };
  return { ok: !!data.ok, error: data.error };
}

export async function voteRequest(id: string, on: boolean): Promise<{ ok: boolean; vote_count?: number; status?: string; error?: string }> {
  const res = await fetch(`/api/requests/${id}/vote`, {
    method: on ? "POST" : "DELETE",
    credentials: "same-origin",
  });
  const data = (await res.json()) as { ok?: boolean; vote_count?: number; status?: string; error?: string };
  return { ok: !!data.ok, vote_count: data.vote_count, status: data.status, error: data.error };
}

export async function deleteRequest(id: string): Promise<boolean> {
  const res = await fetch(`/api/requests/${id}`, { method: "DELETE", credentials: "same-origin" });
  const data = (await res.json()) as { ok?: boolean };
  return !!data.ok;
}

export async function fulfilRequest(id: string, trackId: string): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(`/api/admin/requests/${id}/fulfil`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ track_id: trackId }),
  });
  const data = (await res.json()) as { ok?: boolean; error?: string };
  return { ok: !!data.ok, error: data.error };
}
