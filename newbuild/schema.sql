CREATE TABLE IF NOT EXISTS waitlist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  role TEXT DEFAULT 'other',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_waitlist_created ON waitlist(created_at);

CREATE TABLE IF NOT EXISTS vibe_queries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vibe TEXT NOT NULL,
  response TEXT,
  created_at TEXT NOT NULL
);