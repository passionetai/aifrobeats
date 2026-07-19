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

// ---- Playlists ----
export interface PlaylistSummary {
  id: string; title: string; description?: string | null;
  handle?: string; display_name?: string; track_count: number; is_public?: number;
}
export interface PlaylistTrack { id: string; title: string; artist: string; mood: string | null; score: number; }

export async function discoverPlaylists(): Promise<PlaylistSummary[]> {
  const res = await fetch("/api/playlists");
  const data = (await res.json()) as { playlists: PlaylistSummary[] };
  return data.playlists ?? [];
}
export async function myPlaylists(): Promise<PlaylistSummary[]> {
  const res = await fetch("/api/playlists/mine", { credentials: "same-origin" });
  const data = (await res.json()) as { playlists: PlaylistSummary[] };
  return data.playlists ?? [];
}
export async function createPlaylist(title: string, description: string, is_public: boolean): Promise<{ ok: boolean; id?: string; error?: string }> {
  const res = await fetch("/api/playlists", {
    method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin",
    body: JSON.stringify({ title, description, is_public }),
  });
  const data = (await res.json()) as { ok?: boolean; id?: string; error?: string };
  return { ok: !!data.ok, id: data.id, error: data.error };
}
export async function getPlaylist(id: string): Promise<{ playlist: any; tracks: PlaylistTrack[]; is_owner: boolean } | null> {
  const res = await fetch(`/api/playlists/${id}`, { credentials: "same-origin" });
  if (!res.ok) return null;
  return (await res.json()) as { playlist: any; tracks: PlaylistTrack[]; is_owner: boolean };
}
export async function addToPlaylist(playlistId: string, trackId: string): Promise<boolean> {
  const res = await fetch(`/api/playlists/${playlistId}/tracks`, {
    method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin",
    body: JSON.stringify({ track_id: trackId }),
  });
  return res.ok;
}
export async function removeFromPlaylist(playlistId: string, trackId: string): Promise<boolean> {
  const res = await fetch(`/api/playlists/${playlistId}/tracks/${trackId}`, { method: "DELETE", credentials: "same-origin" });
  return res.ok;
}
export async function deletePlaylist(id: string): Promise<boolean> {
  const res = await fetch(`/api/playlists/${id}`, { method: "DELETE", credentials: "same-origin" });
  return res.ok;
}

// ---- Profiles / follow / curators ----
export interface Profile {
  handle: string; display_name: string; bio: string | null; points: number;
  badge: string; created_at: string; followers: number; following: number;
}
export async function getProfile(handle: string): Promise<{ profile: Profile; playlists: PlaylistSummary[]; is_following: boolean; is_me: boolean } | null> {
  const res = await fetch(`/api/users/${handle}`, { credentials: "same-origin" });
  if (!res.ok) return null;
  return (await res.json()) as any;
}
export async function toggleFollow(handle: string, on: boolean): Promise<boolean> {
  const res = await fetch(`/api/users/${handle}/follow`, { method: on ? "POST" : "DELETE", credentials: "same-origin" });
  return res.ok;
}
export interface Curator { handle: string; display_name: string; points: number; followers: number; playlists: number; badge: string; }
export async function getCurators(): Promise<Curator[]> {
  const res = await fetch("/api/users/curators");
  const data = (await res.json()) as { curators: Curator[] };
  return data.curators ?? [];
}

export async function subscribeEmail(email: string): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch("/api/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = (await res.json()) as { ok?: boolean; error?: string };
  return { ok: !!data.ok, error: data.error };
}

export async function getSubscribers(): Promise<{ count: number; subscribers: { email: string; created_at: string }[] }> {
  const res = await fetch("/api/admin/subscribers", { credentials: "same-origin" });
  if (!res.ok) return { count: 0, subscribers: [] };
  return (await res.json()) as { count: number; subscribers: { email: string; created_at: string }[] };
}

export async function sendBroadcast(subject: string, body: string): Promise<{ ok: boolean; sent?: number; failed?: number; total?: number; error?: string }> {
  const res = await fetch("/api/admin/broadcast", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ subject, body }),
  });
  const data = (await res.json()) as { ok?: boolean; sent?: number; failed?: number; total?: number; error?: string };
  return { ok: !!data.ok, sent: data.sent, failed: data.failed, total: data.total, error: data.error };
}
