import type { Env } from "../env";

const COOKIE = "aifro_session";
const SESSION_DAYS = 30;

export interface User {
  id: string;
  handle: string;
  display_name: string;
  email: string;
  avatar_url: string | null;
  bio: string | null;
  role: string;
  points: number;
  created_at: string;
}

export function randomToken(bytes = 32): string {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function createSession(env: Env, userId: string): Promise<string> {
  const id = randomToken(32);
  const expires = new Date(Date.now() + SESSION_DAYS * 86400_000).toISOString();
  await env.DB.prepare(
    "INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)"
  ).bind(id, userId, expires).run();
  return id;
}

export function sessionCookie(id: string): string {
  return `${COOKIE}=${id}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${SESSION_DAYS * 86400}`;
}

export function clearCookie(): string {
  return `${COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}

function readCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return null;
}

export async function currentUser(env: Env, req: Request): Promise<User | null> {
  const sid = readCookie(req.headers.get("Cookie"), COOKIE);
  if (!sid) return null;
  const row = await env.DB.prepare(
    `SELECT u.id, u.handle, u.display_name, u.email, u.avatar_url, u.bio, u.role, u.points, u.created_at, s.expires_at
     FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.id = ?`
  ).bind(sid).first<User & { expires_at: string }>();
  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await env.DB.prepare("DELETE FROM sessions WHERE id = ?").bind(sid).run();
    return null;
  }
  const { expires_at, ...user } = row;
  return user;
}

export async function deleteSession(env: Env, req: Request): Promise<void> {
  const sid = readCookie(req.headers.get("Cookie"), COOKIE);
  if (sid) await env.DB.prepare("DELETE FROM sessions WHERE id = ?").bind(sid).run();
}
