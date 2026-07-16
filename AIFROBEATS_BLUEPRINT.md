# AIFROBEATS BUILD BLUEPRINT

**Version:** 1.0
**Owner:** Jerry Asemota (Babaearly)
**Domain:** aifrobeats.com
**Stack:** Cloudflare free tier only
**Status:** Blueprint complete, code build not yet started
**Last edited by:** Claude (Anthropic), handoff-ready

---

## 0. HOW TO USE THIS DOCUMENT (read this first, every agent)

This is a resumable build spec. Any coding agent (Codex, Cursor, another Claude session, or a human) can pick this up cold and know exactly what to build and where the last one stopped.

The rules for working from this blueprint:

1. **Always update Section 1 (BUILD LEDGER) before you stop.** Mark what you finished as DONE, what you were mid-way through as IN PROGRESS with a one-line note on the exact stopping point, and leave the rest as TODO. This ledger is the single source of truth for "where are we."
2. **Build in the phase order in Section 13.** Do not jump ahead. Each phase produces something deployable and testable.
3. **Do not add paid Cloudflare services.** If something seems to need a paid tier, note it in the ledger and flag it rather than silently upgrading. The whole point is zero cost.
4. **No em dashes anywhere in generated content, code comments, UI copy, or docs.** This is a hard style rule from the owner. Use commas, colons, or new sentences.
5. **Image generation, when needed, uses GPT Image 1 only.** Do not wire in Midjourney, Flux, or DALL-E unless the owner explicitly asks.
6. **Commit small and often** with clear messages so the git history itself becomes a progress trail.

Conventions used below: `TODO` = not started, `WIP` = in progress, `DONE` = complete and tested, `BLOCKED` = needs owner input.

---

## 1. BUILD LEDGER (STATE TRACKER)

Update this table at the end of every working session.

| # | Module | Phase | Status | Notes / stopping point |
|---|--------|-------|--------|------------------------|
| 1 | Repo scaffold + wrangler config | 0 | DONE | Builds + typechecks clean. Still need to paste D1 + KV ids into wrangler.toml after creating resources. |
| 2 | D1 schema + migrations | 0 | DONE | 0001_init.sql written (full schema). Still needs applying: `npm run db:migrate`. |
| 3 | R2 buckets + KV namespaces created | 0 | TODO | OWNER ACTION: run the four `wrangler create` commands, paste ids. |
| 4 | Hono API skeleton + health route | 0 | DONE | /api/health and /api/status (DB ping) live. Route modules mount in Phase 1. |
| 5 | React + Vite frontend shell + design tokens | 0 | DONE | Diaspora Modern shell, Nav, Home with live backend status, placeholder routes. |
| 6 | Auth (magic-link, sessions) | 1 | DONE | Phase 1b: Resend magic-link login, D1 sessions + HttpOnly cookie, onboarding (handle/display name), profile edit. Owner auto-promoted to admin via OWNER_EMAIL. Admin routes + upload page switched from ADMIN_TOKEN to session role check. Turnstile left optional (skipped if TURNSTILE_SECRET unset). Builds + typechecks clean. |
| 7 | Track catalog (list, detail, R2 streaming) | 1 | DONE | Phase 1a: public list/detail, range-enabled R2 audio + cover streaming, persistent player, /admin upload page (token-gated via ADMIN_TOKEN secret, temporary until 1b). Builds + typechecks clean. |
| 8 | Voting + Hot 100 chart + cron recompute | 1 | DONE | Phase 1c: upvote/unvote (one per user, toggle), optimistic vote button, live chart with movement arrows, hourly cron records snapshots + corrects score drift + trims to 14 days. Chart reads live from D1 for now (switch to KV cache at scale). Builds + typechecks clean. |
| 9 | Comments + reactions | 1 | TODO | |
| 10 | Request Booth (submit, vote, admin fulfil) | 2 | TODO | |
| 11 | Synced Radio Durable Object + WebSocket UI | 3 | TODO | |
| 12 | Playlists + follows + curator leaderboard | 4 | TODO | |
| 13 | Gamification (points, streaks, badges) | 4 | TODO | |
| 14 | Share cards + SEO + PWA | 5 | TODO | |
| 15 | Workers AI touches (auto-tag, moderation) | 5 | TODO | |
| 16 | Admin panel (owner-only) | across | TODO | |
| 17 | Seed/content ingestion pipeline | 0 | TODO | |

---

## 2. PRODUCT OVERVIEW AND THE STRATEGIC BET

Aifrobeats is not a music generator. It does not try to be Suno. It is the **culture layer** around AI Afrobeats: the radio station, the chart, the club, and the record label in one place.

The owner (and a small circle) generate tracks externally with Suno and upload them. The site's job is discovery, community, and status. Users never generate on-site. They discover, vote, champion, request, curate, and share. That community activity is what makes the site trendy and participatory, and it removes any need for GPU or generation infrastructure, which is exactly what keeps it inside the free tier.

**Four engagement loops carry the whole product:**

1. **The Aifrobeats Hot 100:** a live, community-voted chart. The heartbeat. Gives every song stakes and every listener a reason to return.
2. **The Request Booth:** users submit a vibe or theme, the community votes, the top request each cycle gets produced by the owner and released credited to the requester. Turns listeners into co-creators and gives a real demand signal, with zero on-site generation.
3. **Synced Radio + Live Room:** one shared stream everyone hears at the same moment, with live chat and reaction bursts and a live listener count. Creates the feeling that something is happening now.
4. **Curator Playlists + Profiles:** users build and share playlists, follow tastemakers, and climb a Curator leaderboard. Their playlists become free marketing.

Everything else (gamification, share cards, AI touches) is polish layered on top of these four.

---

## 3. ARCHITECTURE OVERVIEW

Single deployable Cloudflare Worker project. The built React SPA is served as static assets from the same Worker that runs the API. This keeps it to one deploy unit, which is the easiest shape for an agent to reason about and resume.

```
                          aifrobeats.com
                                |
                    +-----------v-----------+
                    |   Cloudflare Worker   |   (Hono app)
                    |  - serves SPA assets  |
                    |  - /api/* routes      |
                    +--+----+----+----+--+--+
                       |    |    |    |  |
        +--------------+    |    |    |  +----------------+
        |                   |    |    |                   |
   +----v----+       +------v-+  |  +-v------+      +------v-------+
   |   D1    |       |   R2   |  |  |  KV    |      | Durable Obj  |
   | SQLite  |       | audio  |  |  | cache  |      | RadioRoom    |
   | (all    |       | + art  |  |  | chart, |      | (WebSocket   |
   | records)|       | bucket |  |  | session|      |  hibernation)|
   +---------+       +--------+  |  +--------+      +--------------+
                                 |
                          +------v------+        +-------------+
                          |   Queues    |        | Cron Trigger|
                          | notify jobs |        | recompute   |
                          +-------------+        | chart hourly|
                                                 +-------------+
                          +-------------------+
                          | Workers AI (opt)  |  auto-tag, moderate
                          +-------------------+
                          +-------------------+
                          | Turnstile         |  bot protection on votes
                          +-------------------+
```

Data flow examples:

- **Stream a track:** browser requests `/api/tracks/:id/audio`, Worker fetches the object from R2 and streams it back with range support. No egress cost on R2.
- **Cast a vote:** browser POSTs to `/api/tracks/:id/vote` with a Turnstile token, Worker validates session + token, writes a row to D1 `votes`. Chart is not recomputed live.
- **Chart recompute:** a Cron Trigger fires hourly, a Worker recomputes the Hot 100 from `votes` in D1, writes a `chart_snapshots` row, and caches the current chart JSON in KV for fast reads.
- **Live radio:** browser opens a WebSocket to the `RadioRoom` Durable Object, which holds the shared playback position and broadcasts track changes, chat, and reactions to all connected listeners.

---

## 4. CLOUDFLARE FREE-TIER BUDGET

All limits verified July 2026. Free limits reset daily at 00:00 UTC unless noted monthly.

| Service | Free limit | How Aifrobeats stays inside it |
|---------|-----------|-------------------------------|
| Workers | 100,000 requests/day, 10 ms CPU per request, 50 subrequests per invocation | Cache chart and hot lists in KV so most reads are cheap. Keep per-request DB calls low. Audio streaming is one R2 subrequest. |
| Pages/Static assets | Unlimited requests, free | SPA served as static assets from the Worker. |
| D1 | 5 GB storage, 5M rows read/day, 100K rows written/day | Index well, read chart from KV cache not D1. Writes are votes/comments, well under 100K/day early on. |
| KV | 1 GB storage, 100K reads/day, **1K writes/day** | KV is read-heavy only. Writes limited to hourly chart cache + session refresh. Do NOT write per vote to KV. |
| R2 | 10 GB-month storage, 1M Class A ops/month, 10M Class B ops/month, zero egress | 10 GB holds hundreds of MP3s. Streaming reads are Class B (10M/month is generous). |
| Durable Objects | SQLite backend only on free, 100K requests/day, 5 GB total storage | One RadioRoom object. WebSocket hibernation keeps it cheap when idle. |
| Queues | 10K operations/day, up to 10,000 queues | Notification fan-out only. Batch messages. |
| Vectorize | 30M queried dims/month, 5M stored (optional) | Only if semantic search is built in Phase 5. |
| Workers AI | Daily Neuron allocation (confirm current figure in dashboard before relying on it) | Optional Phase 5 only: auto-tagging and comment moderation, run sparingly. |
| Turnstile | Free | Gate on votes, request submissions, signup. |
| Cron Triggers | Up to 5 on free | One hourly chart recompute. |

**The two limits to respect most:** KV writes (only 1,000/day, so KV is a read cache, never a per-action write target) and Workers CPU (10 ms per request, so no heavy synchronous work in a request; push aggregation to the cron job).

---

## 5. REPOSITORY STRUCTURE

```
aifrobeats/
├── AIFROBEATS_BLUEPRINT.md        # this file, the source of truth
├── package.json
├── wrangler.toml
├── tsconfig.json
├── vite.config.ts
├── .dev.vars                       # local secrets, gitignored
├── migrations/
│   ├── 0001_init.sql               # full schema
│   └── 0002_seed_dev.sql           # optional dev seed data
├── src/
│   ├── worker/                     # backend (Hono on Workers)
│   │   ├── index.ts                # Hono app entry, mounts routes, serves assets
│   │   ├── env.ts                  # typed Env bindings
│   │   ├── auth/
│   │   │   ├── magic-link.ts
│   │   │   └── session.ts
│   │   ├── routes/
│   │   │   ├── tracks.ts
│   │   │   ├── chart.ts
│   │   │   ├── votes.ts
│   │   │   ├── requests.ts
│   │   │   ├── comments.ts
│   │   │   ├── playlists.ts
│   │   │   ├── users.ts
│   │   │   ├── radio.ts
│   │   │   └── admin.ts
│   │   ├── lib/
│   │   │   ├── db.ts               # D1 query helpers
│   │   │   ├── kv.ts               # KV cache helpers
│   │   │   ├── r2.ts               # R2 streaming + range support
│   │   │   ├── turnstile.ts
│   │   │   └── points.ts           # gamification scoring
│   │   ├── jobs/
│   │   │   ├── recompute-chart.ts  # cron handler
│   │   │   └── notify.ts           # queue consumer
│   │   └── durable/
│   │       └── radio-room.ts       # RadioRoom Durable Object
│   └── app/                        # frontend (React + Vite)
│       ├── main.tsx
│       ├── App.tsx
│       ├── router.tsx
│       ├── styles/
│       │   └── tokens.css          # Diaspora Modern design tokens
│       ├── lib/
│       │   ├── api.ts              # fetch wrapper
│       │   └── ws.ts               # radio WebSocket client
│       ├── components/
│       │   ├── Player.tsx          # persistent bottom player
│       │   ├── TrackCard.tsx
│       │   ├── VoteButton.tsx
│       │   ├── ChartRow.tsx
│       │   ├── RequestCard.tsx
│       │   ├── ReactionBurst.tsx
│       │   ├── ShareCard.tsx
│       │   └── Nav.tsx
│       └── pages/
│           ├── Home.tsx            # radio + hot right now
│           ├── Chart.tsx           # the Hot 100
│           ├── TrackDetail.tsx
│           ├── RequestBooth.tsx
│           ├── LiveRoom.tsx        # synced radio room
│           ├── Playlists.tsx
│           ├── Profile.tsx
│           ├── Curators.tsx        # leaderboard
│           └── Login.tsx
└── public/
    └── (favicons, manifest.json for PWA)
```

---

## 6. TECH STACK DECISIONS

- **Backend:** Hono (runs natively on Workers, tiny, excellent DX, well-supported by coding agents).
- **Frontend:** React 18 + TypeScript + Vite, built to a `dist/` folder and served as static assets by the same Worker via the assets binding.
- **Routing (frontend):** React Router.
- **Styling:** plain CSS with custom properties (design tokens in `tokens.css`). No heavy UI kit needed. Optionally Tailwind if the building agent prefers, but tokens-first keeps it lean.
- **DB:** Cloudflare D1 (SQLite). Access via Hono + prepared statements.
- **Real-time:** Durable Object with the WebSocket Hibernation API.
- **Auth:** passwordless magic-link via email. Sessions stored in D1 with a signed cookie. (Chosen because it needs no third-party auth provider and no passwords to manage.)
- **Email sending:** the owner already uses EmailJS on other Aifrobeats properties. For transactional magic-link email, prefer a Worker-friendly transactional provider (e.g. Resend or MailChannels-compatible) via `fetch`. Confirm which sender the owner wants before Phase 1. Marked as a decision point in the ledger.
- **Package manager:** npm.

---

## 7. DATA MODEL (D1 SCHEMA)

Full initial migration. This is `migrations/0001_init.sql`.

```sql
-- USERS
CREATE TABLE users (
  id            TEXT PRIMARY KEY,           -- uuid
  handle        TEXT UNIQUE NOT NULL,        -- @name, url-safe
  display_name  TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  avatar_url    TEXT,
  bio           TEXT,
  role          TEXT NOT NULL DEFAULT 'user', -- user | admin
  points        INTEGER NOT NULL DEFAULT 0,
  streak_days   INTEGER NOT NULL DEFAULT 0,
  last_active   TEXT,                        -- ISO date for streak calc
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- MAGIC LINK TOKENS
CREATE TABLE magic_tokens (
  token       TEXT PRIMARY KEY,             -- random, single use
  email       TEXT NOT NULL,
  expires_at  TEXT NOT NULL,
  used        INTEGER NOT NULL DEFAULT 0
);

-- SESSIONS
CREATE TABLE sessions (
  id          TEXT PRIMARY KEY,             -- random session id
  user_id     TEXT NOT NULL REFERENCES users(id),
  expires_at  TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- TRACKS
CREATE TABLE tracks (
  id            TEXT PRIMARY KEY,
  title         TEXT NOT NULL,
  artist        TEXT NOT NULL DEFAULT 'Aifrobeats',
  audio_key     TEXT NOT NULL,               -- R2 object key
  cover_key     TEXT NOT NULL,               -- R2 object key
  duration_sec  INTEGER,
  mood          TEXT,                        -- e.g. amapiano, detty-december
  tags          TEXT,                        -- comma separated
  credited_user TEXT REFERENCES users(id),   -- requester if from Request Booth
  request_id    TEXT,                        -- link back to requests.id if applicable
  play_count    INTEGER NOT NULL DEFAULT 0,
  score         INTEGER NOT NULL DEFAULT 0,  -- cached net vote score
  status        TEXT NOT NULL DEFAULT 'live', -- live | hidden
  released_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_tracks_status ON tracks(status);
CREATE INDEX idx_tracks_score ON tracks(score DESC);

-- VOTES (one row per user per track, up or down)
CREATE TABLE votes (
  user_id   TEXT NOT NULL REFERENCES users(id),
  track_id  TEXT NOT NULL REFERENCES tracks(id),
  value     INTEGER NOT NULL,                -- +1 or -1
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, track_id)
);
CREATE INDEX idx_votes_track ON votes(track_id);

-- CHART SNAPSHOTS (hourly ranking history)
CREATE TABLE chart_snapshots (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  taken_at    TEXT NOT NULL DEFAULT (datetime('now')),
  position    INTEGER NOT NULL,
  track_id    TEXT NOT NULL REFERENCES tracks(id),
  score       INTEGER NOT NULL,
  prev_pos    INTEGER                        -- for up/down arrows
);
CREATE INDEX idx_chart_taken ON chart_snapshots(taken_at);

-- COMMENTS
CREATE TABLE comments (
  id         TEXT PRIMARY KEY,
  track_id   TEXT NOT NULL REFERENCES tracks(id),
  user_id    TEXT NOT NULL REFERENCES users(id),
  body       TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'visible', -- visible | hidden
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_comments_track ON comments(track_id, created_at);

-- REQUEST BOOTH
CREATE TABLE requests (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id),
  title       TEXT NOT NULL,                 -- short vibe label
  brief       TEXT NOT NULL,                 -- the description
  mood        TEXT,
  vote_count  INTEGER NOT NULL DEFAULT 0,    -- cached
  status      TEXT NOT NULL DEFAULT 'open',  -- open | selected | fulfilled | closed
  cycle       TEXT NOT NULL,                 -- e.g. 2026-W29 for weekly cycles
  fulfilled_track_id TEXT REFERENCES tracks(id),
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_requests_cycle ON requests(cycle, status);

-- REQUEST VOTES
CREATE TABLE request_votes (
  user_id     TEXT NOT NULL REFERENCES users(id),
  request_id  TEXT NOT NULL REFERENCES requests(id),
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
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

-- FOLLOWS (user follows curator)
CREATE TABLE follows (
  follower_id TEXT NOT NULL REFERENCES users(id),
  followee_id TEXT NOT NULL REFERENCES users(id),
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (follower_id, followee_id)
);

-- POINTS LEDGER (audit trail for gamification)
CREATE TABLE point_events (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    TEXT NOT NULL REFERENCES users(id),
  kind       TEXT NOT NULL,                  -- vote_early, request_fulfilled, daily_streak, etc
  points     INTEGER NOT NULL,
  ref_id     TEXT,                           -- related track/request id
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_points_user ON point_events(user_id);
```

Notes for the building agent:

- `tracks.score` is a cached net vote total updated on each vote write (cheap increment) so the chart cron and track cards do not have to aggregate `votes` every read.
- The chart cron still recomputes authoritative scores from `votes` hourly to correct any drift and to write the snapshot with movement arrows.
- Use UUIDs generated with `crypto.randomUUID()` for all `TEXT PRIMARY KEY` ids.
- `cycle` on requests uses ISO week strings so the Request Booth runs weekly. Adjust cadence if the owner wants a different cycle.

---

## 8. API SURFACE

All under `/api`. JSON in, JSON out. Auth via session cookie. Turnstile token required on mutating public actions (marked *T*).

**Auth**
- `POST /api/auth/request-link` body `{ email }` -> sends magic link *T*
- `GET  /api/auth/verify?token=...` -> creates session, sets cookie, redirects
- `POST /api/auth/logout`
- `GET  /api/auth/me` -> current user or null

**Tracks**
- `GET  /api/tracks` query `?sort=hot|new|top&mood=&page=` -> paginated list (served from KV cache for hot/top)
- `GET  /api/tracks/:id` -> track detail + user's vote state
- `GET  /api/tracks/:id/audio` -> streams audio from R2 with HTTP range support
- `POST /api/tracks/:id/play` -> increments play_count (throttled, fire-and-forget)

**Votes**
- `POST /api/tracks/:id/vote` body `{ value: 1 | -1 }` -> upsert vote, adjust cached score *T*
- `DELETE /api/tracks/:id/vote` -> remove vote

**Chart**
- `GET  /api/chart` -> current Hot 100 from KV cache, with movement arrows
- `GET  /api/chart/history/:trackId` -> a track's position over time

**Comments**
- `GET  /api/tracks/:id/comments`
- `POST /api/tracks/:id/comments` body `{ body }` *T*
- `DELETE /api/comments/:id` (author or admin)

**Request Booth**
- `GET  /api/requests` query `?cycle=&status=` -> ranked open requests
- `POST /api/requests` body `{ title, brief, mood }` *T*
- `POST /api/requests/:id/vote` -> upvote, adjust cached count *T*
- `DELETE /api/requests/:id/vote`
- `GET  /api/requests/winners` -> fulfilled requests wall (social proof)

**Playlists**
- `GET  /api/playlists` (public, discoverable)
- `POST /api/playlists` body `{ title, description, is_public }`
- `GET  /api/playlists/:id`
- `POST /api/playlists/:id/tracks` body `{ track_id }`
- `DELETE /api/playlists/:id/tracks/:trackId`
- `PATCH /api/playlists/:id/order` body `{ orderedTrackIds }`

**Users / social**
- `GET  /api/users/:handle` -> profile, playlists, points
- `POST /api/users/:handle/follow`
- `DELETE /api/users/:handle/follow`
- `GET  /api/curators` -> leaderboard (points desc), KV cached

**Radio (real-time via Durable Object)**
- `GET  /api/radio/ws` -> upgrades to WebSocket, connects to RadioRoom DO
- `GET  /api/radio/now` -> current track + position (for non-WS fallback)

**Admin (owner only, role=admin)**
- `POST /api/admin/tracks` -> create track record after R2 upload
- `POST /api/admin/tracks/:id/upload-url` -> presigned or direct R2 upload path
- `PATCH /api/admin/tracks/:id` -> edit/hide
- `POST /api/admin/requests/:id/select` -> mark a request selected for production
- `POST /api/admin/requests/:id/fulfil` body `{ track_id }` -> link the released track, credit requester, award points
- `POST /api/admin/radio/playlist` -> set the radio rotation

---

## 9. FRONTEND SPEC

### 9.1 Design system: Diaspora Modern

This is the owner's existing Aifrobeats identity. Keep it consistent.

```css
/* src/app/styles/tokens.css */
:root {
  /* color */
  --bg:            #0B0B14;   /* midnight background */
  --bg-elev:       #14141F;   /* raised surfaces */
  --sunset:        #FF6A2B;   /* sunset orange, primary accent */
  --sunset-deep:   #E1531B;
  --gold:          #F2B705;   /* highlight / rank #1 */
  --text:          #F5F3EF;   /* off-white */
  --text-dim:      #A6A2B0;
  --line:          #26263A;   /* borders */
  --up:            #35D07F;
  --down:          #FF5C7A;

  /* type */
  --font-display: "Archivo Black", system-ui, sans-serif;
  --font-body:    "Inter", system-ui, sans-serif;

  /* shape */
  --radius:       14px;
  --radius-lg:    22px;
  --shadow:       0 8px 30px rgba(0,0,0,0.45);
}
```

Typography: Archivo Black for headers, chart numbers, and the logo. Inter (or similar clean sans) for body. Big confident numerals on the chart. Generous letter-spacing on display headers.

Visual mood: dark, warm, premium. Sunset orange as the single loud accent against midnight. Gold reserved for the number 1 chart position and top curator. Cover art carries the color; UI stays restrained around it.

Motion: reaction bursts (hearts/fire floating up), smooth number roll on vote count change, subtle rank-change slide on the chart. Keep it tasteful, not noisy.

### 9.2 Pages / routes

- `/` Home: the live radio player up top with listener count, then "Hot Right Now" strip, then the Request Booth teaser and the top of the chart.
- `/chart` The Hot 100: ranked list with movement arrows, mood filter, share button per row.
- `/track/:id` Track detail: big cover, play, vote, comments, "credited to @user" if it came from a request, chart history sparkline.
- `/booth` Request Booth: submit form, ranked open requests with upvote, a Winners wall of fulfilled requests.
- `/live` Live Room: synced radio, live chat, reaction bursts, who is listening.
- `/playlists` Discover playlists.
- `/u/:handle` Profile: avatar, points, badges, playlists, followers.
- `/curators` Curator leaderboard.
- `/login` Magic-link login.

### 9.3 Persistent player

A bottom-docked player (like Spotify) that stays mounted across route changes. Holds playback state in a React context so navigating does not stop the music. Shows current track, play/pause, progress, vote buttons inline, and a "add to playlist" action.

### 9.4 Key components

- `Player.tsx` persistent audio, streams from `/api/tracks/:id/audio`.
- `VoteButton.tsx` optimistic UI, Turnstile-gated, rolls the count.
- `ChartRow.tsx` rank numeral, movement arrow, cover, title, score, share.
- `RequestCard.tsx` brief, upvote, vote count, status pill.
- `ReactionBurst.tsx` floating emoji animation for the Live Room.
- `ShareCard.tsx` generates an OG share image URL per track (see Section 14 share cards).

---

## 10. FEATURE SPECS (THE FOUR LOOPS)

### 10.1 Hot 100 chart

- Users vote +1 / -1 on tracks. One vote per user per track, changeable.
- On each vote, update `tracks.score` with a delta (cheap) and upsert the `votes` row.
- Hourly cron (`recompute-chart.ts`): recompute authoritative net score per track from `votes`, rank top 100, compare to previous snapshot for movement arrows, insert `chart_snapshots` rows, and write the full current chart JSON into KV key `chart:current`.
- `GET /api/chart` reads `chart:current` from KV (one KV read, no D1 aggregation).
- Ranking formula: start with net votes, then add a light recency boost so new tracks are not buried. Suggested score for ranking: `net_votes + (play_count * 0.1) - hours_since_release * decay`. Keep the exact weights in `lib/points.ts` so they are tunable. Store the computed rank score, not just raw votes.

### 10.2 Request Booth

- Weekly cycle keyed by ISO week (`2026-W29`).
- Users submit `{ title, brief, mood }`. Community upvotes. `requests.vote_count` cached, corrected by the same hourly cron.
- Owner sees ranked open requests in admin, marks one `selected`, produces it externally in Suno, uploads the track, then calls fulfil which:
  - creates/links the track,
  - sets `tracks.credited_user` to the requester,
  - sets `requests.status = 'fulfilled'` and `fulfilled_track_id`,
  - awards points to the requester and to everyone who upvoted the winning request,
  - optionally queues a notification.
- The Winners wall shows fulfilled requests with the resulting track and the credited user. This is the social proof engine, show it prominently.

### 10.3 Synced Radio (Durable Object)

- One `RadioRoom` Durable Object holds the shared state: current track, playback start timestamp, rotation queue, connected listeners, recent chat.
- Clients connect via WebSocket (`/api/radio/ws`). Use the **WebSocket Hibernation API** so the object is not billed while idle between messages.
- The DO broadcasts: `track_change` (id + server start time so clients sync position), `chat`, `reaction`, `listener_count`.
- Clients compute their playback offset from the server start timestamp so everyone is roughly in sync. Audio still streams from R2 per client.
- Rotation: the DO advances to the next track when the current one ends (use `setAlarm` for the track duration). Owner sets the rotation via admin.
- Chat and reactions are ephemeral (kept in DO memory / short SQLite in the DO), not written to D1, to protect D1 write budget.

`RadioRoom` skeleton (`src/worker/durable/radio-room.ts`):

```ts
export class RadioRoom implements DurableObject {
  state: DurableObjectState;
  env: Env;
  sessions: Set<WebSocket> = new Set();
  current: { trackId: string; startedAt: number; durationSec: number } | null = null;
  queue: string[] = [];

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(req: Request): Promise<Response> {
    if (req.headers.get("Upgrade") === "websocket") {
      const pair = new WebSocketPair();
      this.state.acceptWebSocket(pair[1]);   // hibernation-aware accept
      this.sessions.add(pair[1]);
      // send current state to the new listener
      this.sendState(pair[1]);
      this.broadcastListenerCount();
      return new Response(null, { status: 101, webSocket: pair[0] });
    }
    // HTTP: admin sets rotation, or /now returns current
    return new Response("ok");
  }

  async webSocketMessage(ws: WebSocket, msg: string) {
    const data = JSON.parse(msg);
    if (data.type === "chat")     this.broadcast({ type: "chat", ...data });
    if (data.type === "reaction") this.broadcast({ type: "reaction", emoji: data.emoji });
  }

  async webSocketClose(ws: WebSocket) {
    this.sessions.delete(ws);
    this.broadcastListenerCount();
  }

  async alarm() {
    // current track ended, advance rotation
    this.advance();
  }

  advance() { /* pick next from queue, set current.startedAt = Date.now(), setAlarm, broadcast track_change */ }
  sendState(ws: WebSocket) { /* ws.send(current + offset) */ }
  broadcast(obj: unknown) { for (const s of this.sessions) s.send(JSON.stringify(obj)); }
  broadcastListenerCount() { this.broadcast({ type: "listener_count", count: this.sessions.size }); }
}
```

### 10.4 Playlists and curators

- Users create playlists, add tracks, reorder, make public.
- Public playlists are discoverable on `/playlists`.
- Following: users follow curators. A curator's influence feeds the leaderboard.
- Curator score (in `lib/points.ts`): weighted by followers, playlist saves, and how many of their early-championed tracks later chart. Cache the leaderboard in KV, recompute in the hourly cron.

---

## 11. AUTH APPROACH (passwordless magic link)

Chosen to avoid passwords and third-party auth providers.

Flow:
1. User enters email, passes Turnstile, POSTs `/api/auth/request-link`.
2. Worker creates a random token in `magic_tokens` with a short expiry (15 min), emails a link `https://aifrobeats.com/api/auth/verify?token=...`.
3. User clicks. Worker validates token (exists, not used, not expired), finds or creates the user, creates a `sessions` row, sets an `HttpOnly; Secure; SameSite=Lax` cookie with the session id, marks token used, redirects to the app.
4. `GET /api/auth/me` reads the cookie, looks up the session, returns the user.
5. Logout deletes the session row and clears the cookie.

New users pick a `handle` and `display_name` on first login (a one-step onboarding screen).

Email sending: use a Worker-compatible transactional email API via `fetch` (Resend or similar). Store the API key as a Worker secret. This is a **BLOCKED decision point**: confirm the sender with the owner before building Phase 1 auth.

---

## 12. CONFIG FILES

### package.json

```json
{
  "name": "aifrobeats",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite build --watch & wrangler dev",
    "build": "vite build",
    "deploy": "vite build && wrangler deploy",
    "db:migrate": "wrangler d1 migrations apply aifrobeats-db",
    "db:migrate:local": "wrangler d1 migrations apply aifrobeats-db --local"
  },
  "dependencies": {
    "hono": "^4.6.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.0"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.0.0",
    "typescript": "^5.5.0",
    "vite": "^5.4.0",
    "@vitejs/plugin-react": "^4.3.0",
    "wrangler": "^3.80.0"
  }
}
```

Pin exact latest versions at build time; the above are floors, not gospel.

### wrangler.toml

```toml
name = "aifrobeats"
main = "src/worker/index.ts"
compatibility_date = "2026-07-01"
compatibility_flags = ["nodejs_compat"]

# Serve the built SPA as static assets
[assets]
directory = "./dist"
binding = "ASSETS"
not_found_handling = "single-page-application"

[[d1_databases]]
binding = "DB"
database_name = "aifrobeats-db"
database_id = "REPLACE_WITH_ID_AFTER_CREATE"
migrations_dir = "migrations"

[[r2_buckets]]
binding = "MEDIA"
bucket_name = "aifrobeats-media"

[[kv_namespaces]]
binding = "CACHE"
id = "REPLACE_WITH_ID_AFTER_CREATE"

[[queues.producers]]
binding = "NOTIFY_QUEUE"
queue = "aifrobeats-notify"

[[queues.consumers]]
queue = "aifrobeats-notify"
max_batch_size = 10

[durable_objects]
bindings = [
  { name = "RADIO", class_name = "RadioRoom" }
]

[[migrations]]
tag = "v1"
new_sqlite_classes = ["RadioRoom"]   # SQLite-backed DO, required for free tier

[triggers]
crons = ["0 * * * *"]   # hourly chart + leaderboard recompute

[vars]
APP_URL = "https://aifrobeats.com"
# secrets set via: wrangler secret put EMAIL_API_KEY / TURNSTILE_SECRET / SESSION_SIGNING_KEY
```

Important: the Durable Object must be declared with `new_sqlite_classes` (not `new_classes`) so it uses the SQLite storage backend, which is the only backend available on the free plan.

### Env typing (src/worker/env.ts)

```ts
export interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  MEDIA: R2Bucket;
  CACHE: KVNamespace;
  NOTIFY_QUEUE: Queue;
  RADIO: DurableObjectNamespace;
  APP_URL: string;
  EMAIL_API_KEY: string;
  TURNSTILE_SECRET: string;
  SESSION_SIGNING_KEY: string;
}
```

### Hono entry (src/worker/index.ts)

```ts
import { Hono } from "hono";
import type { Env } from "./env";
import tracks from "./routes/tracks";
import chart from "./routes/chart";
import votes from "./routes/votes";
import requests from "./routes/requests";
import comments from "./routes/comments";
import playlists from "./routes/playlists";
import users from "./routes/users";
import radio from "./routes/radio";
import admin from "./routes/admin";
import auth from "./auth/routes";
import { recomputeChart } from "./jobs/recompute-chart";

export { RadioRoom } from "./durable/radio-room";

const app = new Hono<{ Bindings: Env }>();

app.get("/api/health", (c) => c.json({ ok: true }));
app.route("/api/auth", auth);
app.route("/api/tracks", tracks);
app.route("/api/chart", chart);
app.route("/api/tracks", votes);      // vote routes nested under tracks
app.route("/api/requests", requests);
app.route("/api/tracks", comments);
app.route("/api/playlists", playlists);
app.route("/api/users", users);
app.route("/api/radio", radio);
app.route("/api/admin", admin);

// Everything else: serve the SPA
app.get("*", (c) => c.env.ASSETS.fetch(c.req.raw));

export default {
  fetch: app.fetch,
  async scheduled(_event: ScheduledController, env: Env) {
    await recomputeChart(env);
  },
  async queue(batch: MessageBatch, env: Env) {
    // notification consumer
  },
};
```

---

## 13. BUILD PHASES (THE ORDERED TASK LIST)

Build strictly in this order. Each phase ends deployable and testable. Update the ledger after each.

**Phase 0: Foundation (get something live)**
1. `npm create`, install deps, set up Vite + React + TypeScript, Hono worker entry.
2. Create Cloudflare resources: `wrangler d1 create aifrobeats-db`, `wrangler r2 bucket create aifrobeats-media`, `wrangler kv namespace create CACHE`, `wrangler queues create aifrobeats-notify`. Paste the ids into wrangler.toml.
3. Write `migrations/0001_init.sql`, run `db:migrate:local` then remote.
4. `/api/health` returns ok. SPA shell renders with Diaspora Modern tokens and Nav.
5. Deploy. Confirm aifrobeats.com serves the shell and the API health route.
6. Build the admin track-ingestion path (upload to R2 + create track row) so content can start loading.

**Phase 1: The core loop (chart + catalog + auth)**
7. Magic-link auth end to end (needs email-sender decision).
8. Track catalog: list, detail, R2 audio streaming with range support, persistent player.
9. Voting with optimistic UI + Turnstile.
10. Hourly chart cron + KV cache + `/chart` page with movement arrows.
11. Comments + basic moderation (hide).
Deploy. This alone is a usable product.

**Phase 2: Request Booth**
12. Submit, list ranked, upvote, weekly cycles.
13. Admin select + fulfil flow, crediting, points award, Winners wall.
Deploy.

**Phase 3: Synced Radio**
14. RadioRoom Durable Object with WebSocket hibernation, rotation via alarm.
15. Live Room page: synced player, live chat, reaction bursts, listener count.
Deploy.

**Phase 4: Social + gamification**
16. Playlists (create, add, reorder, discover).
17. Follows + profiles + curator leaderboard.
18. Points, streaks, badges wired to `point_events`.
Deploy.

**Phase 5: Polish + growth**
19. OG share cards per track (dynamic image), SEO meta, sitemap.
20. PWA (manifest + service worker) for installable mobile.
21. Optional Workers AI: auto-tag moods on upload, comment moderation, semantic search via Vectorize.
22. Analytics review, tune chart formula.

---

## 14. ENVIRONMENT VARIABLES AND SECRETS

Set with `wrangler secret put NAME`:

- `SESSION_SIGNING_KEY` random 32+ byte key for signing session cookies.
- `TURNSTILE_SECRET` from the Turnstile dashboard (also need the site key in the frontend).
- `EMAIL_API_KEY` transactional email provider key (pending sender decision).

Public vars in `wrangler.toml [vars]`: `APP_URL`. Frontend needs the Turnstile **site** key (public) baked at build time via a Vite env var `VITE_TURNSTILE_SITE_KEY`.

Local dev: put the same in `.dev.vars` (gitignored).

**Share cards (Phase 5):** generate OG images at the edge. Option A: a Worker route `/og/track/:id.png` that renders an SVG (cover + title + rank) and returns it, cache in KV or R2. Option B: pre-generate a card image with GPT Image 1 at release time and store in R2. Prefer Option A for freshness (shows live rank). Remember: any static art generation uses GPT Image 1 only.

---

## 15. DEPLOYMENT STEPS

1. `npm install`
2. Create all Cloudflare resources (Phase 0 step 2), update ids in `wrangler.toml`.
3. `npm run db:migrate` (remote).
4. Set secrets with `wrangler secret put`.
5. `npm run deploy` (builds SPA to `dist/`, deploys the Worker with assets).
6. Add the custom domain aifrobeats.com to the Worker in the dashboard (or via `wrangler`), pointing DNS through Cloudflare.
7. Configure Turnstile widget for the domain, add site key to frontend env.
8. Smoke test: health route, signup, upload a track (admin), stream it, vote, see it on the chart after the cron (or trigger recompute manually for testing).

---

## 16. CONTENT INGESTION PIPELINE (how the owner loads music)

The owner produces tracks in Suno externally, then loads them through the admin panel:

1. Admin uploads the MP3 and cover to R2 (via a Worker upload route or `wrangler r2 object put` for bulk).
2. Admin creates the track record: title, mood, tags, duration.
3. If the track fulfils a request, admin links it and credits the requester (Section 10.2).
4. Admin adds the track to the radio rotation if desired.

Keep a simple CSV or JSON manifest of tracks so bulk loading and re-seeding is easy. This mirrors the existing `drops.json` / `radio.json` pattern already used on Aifrobeats, so migrate those in during Phase 0.

---

## 17. RESUME PROTOCOL (for the next agent or the returning session)

When you sit down to work:

1. Read Section 1 (BUILD LEDGER) top to bottom. Find the first row that is not DONE.
2. Read that module's spec section for full context.
3. Check the git log for the last commit to see exactly what shipped.
4. Continue from the ledger's "stopping point" note.
5. Build only within the current phase (Section 13). Do not skip ahead.
6. Respect the free-tier budget (Section 4), especially KV writes (1K/day) and Worker CPU (10 ms).
7. No em dashes. GPT Image 1 for any images. No paid Cloudflare services without flagging.
8. Before you stop: update the ledger, commit, and write a one-line note on where you stopped.

That is the entire loop. This document plus the git history is enough to resume from cold at any time.

---

*End of blueprint v1.0. Keep this file at the repo root and treat it as the contract. Update the ledger, not your memory.*
