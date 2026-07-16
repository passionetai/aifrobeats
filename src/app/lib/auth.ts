export interface Me {
  id: string;
  handle: string;
  display_name: string;
  email: string;
  avatar_url: string | null;
  bio: string | null;
  role: string;
  points: number;
}

export async function fetchMe(): Promise<Me | null> {
  const res = await fetch("/api/auth/me", { credentials: "same-origin" });
  if (!res.ok) return null;
  const data = (await res.json()) as { user: Me | null };
  return data.user;
}

export async function requestLink(email: string): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch("/api/auth/request-link", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = (await res.json()) as { ok?: boolean; error?: string };
  return { ok: !!data.ok, error: data.error };
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
}

export async function updateProfile(patch: { handle?: string; display_name?: string; bio?: string }): Promise<{ ok: boolean; error?: string; user?: Me }> {
  const res = await fetch("/api/auth/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(patch),
  });
  const data = (await res.json()) as { ok?: boolean; error?: string; user?: Me };
  return { ok: !!data.ok, error: data.error, user: data.user };
}
