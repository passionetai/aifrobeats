-- Phase 5+: email capture for drop alerts.
CREATE TABLE subscribers (
  email      TEXT PRIMARY KEY,
  user_id    TEXT REFERENCES users(id),
  source     TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
