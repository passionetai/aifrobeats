-- Aifrobeats initial schema (Phase 0)

-- USERS
CREATE TABLE users (
  id            TEXT PRIMARY KEY,
  handle        TEXT UNIQUE NOT NULL,
  display_name  TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  avatar_url    TEXT,
  bio           TEXT,
  role          TEXT NOT NULL DEFAULT 'user',
  points        INTEGER NOT NULL DEFAULT 0,
  streak_days   INTEGER NOT NULL DEFAULT 0,
  last_active   TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- MAGIC LINK TOKENS
CREATE TABLE magic_tokens (
  token       TEXT PRIMARY KEY,
  email       TEXT NOT NULL,
  expires_at  TEXT NOT NULL,
  used        INTEGER NOT NULL DEFAULT 0
);

-- SESSIONS
CREATE TABLE sessions (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id),
  expires_at  TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- TRACKS
CREATE TABLE tracks (
  id            TEXT PRIMARY KEY,
  title         TEXT NOT NULL,
  artist        TEXT NOT NULL DEFAULT 'Aifrobeats',
  audio_key     TEXT NOT NULL,
  cover_key     TEXT NOT NULL,
  duration_sec  INTEGER,
  mood          TEXT,
  tags          TEXT,
  credited_user TEXT REFERENCES users(id),
  request_id    TEXT,
  play_count    INTEGER NOT NULL DEFAULT 0,
  score         INTEGER NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'live',
  released_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_tracks_status ON tracks(status);
CREATE INDEX idx_tracks_score ON tracks(score DESC);

-- VOTES
CREATE TABLE votes (
  user_id    TEXT NOT NULL REFERENCES users(id),
  track_id   TEXT NOT NULL REFERENCES tracks(id),
  value      INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, track_id)
);
CREATE INDEX idx_votes_track ON votes(track_id);

-- CHART SNAPSHOTS
CREATE TABLE chart_snapshots (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  taken_at  TEXT NOT NULL DEFAULT (datetime('now')),
  position  INTEGER NOT NULL,
  track_id  TEXT NOT NULL REFERENCES tracks(id),
  score     INTEGER NOT NULL,
  prev_pos  INTEGER
);
CREATE INDEX idx_chart_taken ON chart_snapshots(taken_at);

-- COMMENTS
CREATE TABLE comments (
  id         TEXT PRIMARY KEY,
  track_id   TEXT NOT NULL REFERENCES tracks(id),
  user_id    TEXT NOT NULL REFERENCES users(id),
  body       TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'visible',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_comments_track ON comments(track_id, created_at);

-- REQUEST BOOTH
CREATE TABLE requests (
  id                 TEXT PRIMARY KEY,
  user_id            TEXT NOT NULL REFERENCES users(id),
  title              TEXT NOT NULL,
  brief              TEXT NOT NULL,
  mood               TEXT,
  vote_count         INTEGER NOT NULL DEFAULT 0,
  status             TEXT NOT NULL DEFAULT 'open',
  cycle              TEXT NOT NULL,
  fulfilled_track_id TEXT REFERENCES tracks(id),
  created_at         TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_requests_cycle ON requests(cycle, status);

CREATE TABLE request_votes (
  user_id    TEXT NOT NULL REFERENCES users(id),
  request_id TEXT NOT NULL REFERENCES requests(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, request_id)
);

-- PLAYLISTS
CREATE TABLE playlists (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id),
  title       TEXT NOT NULL,
  description TEXT,
  is_public   INTEGER NOT NULL DEFAULT 1,
  cover_key   TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE playlist_tracks (
  playlist_id TEXT NOT NULL REFERENCES playlists(id),
  track_id    TEXT NOT NULL REFERENCES tracks(id),
  position    INTEGER NOT NULL,
  added_at    TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (playlist_id, track_id)
);

-- FOLLOWS
CREATE TABLE follows (
  follower_id TEXT NOT NULL REFERENCES users(id),
  followee_id TEXT NOT NULL REFERENCES users(id),
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (follower_id, followee_id)
);

-- POINTS LEDGER
CREATE TABLE point_events (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    TEXT NOT NULL REFERENCES users(id),
  kind       TEXT NOT NULL,
  points     INTEGER NOT NULL,
  ref_id     TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_points_user ON point_events(user_id);
