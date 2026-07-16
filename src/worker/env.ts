export interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  MEDIA: R2Bucket;
  CACHE: KVNamespace;
  APP_URL: string;

  // Secrets (wrangler secret put ...). Present at runtime, added in Phase 1.
  SESSION_SIGNING_KEY?: string;
  TURNSTILE_SECRET?: string;
  EMAIL_API_KEY?: string;

  // Login email sender + owner bootstrap.
  MAIL_FROM?: string;    // e.g. "Aifrobeats <hello@aifrobeats.com>"
  OWNER_EMAIL?: string;  // this email becomes admin automatically on login

  // Bootstrap admin gate for Phase 1a uploads. Replaced by role-based auth in Phase 1b.
  ADMIN_TOKEN?: string;

  // Enabled in later phases:
  // NOTIFY_QUEUE: Queue;              // Phase 2/4
  // RADIO: DurableObjectNamespace;    // Phase 3
}
