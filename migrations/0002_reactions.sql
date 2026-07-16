-- Phase 1: reactions on tracks. (The comments table already exists from 0001.)

CREATE TABLE reactions (
  track_id   TEXT NOT NULL REFERENCES tracks(id),
  user_id    TEXT NOT NULL REFERENCES users(id),
  emoji      TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (track_id, user_id, emoji)
);
CREATE INDEX idx_reactions_track ON reactions(track_id);
