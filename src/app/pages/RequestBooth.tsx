import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  RequestItem, listRequests, listWinners, submitRequest,
  voteRequest, deleteRequest, fulfilRequest, listTracks, Track,
} from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function RequestBooth() {
  const { user } = useAuth();
  const [open, setOpen] = useState<RequestItem[]>([]);
  const [winners, setWinners] = useState<RequestItem[]>([]);
  const [voted, setVoted] = useState<Set<string>>(new Set());
  const [threshold, setThreshold] = useState(25);
  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");
  const [mood, setMood] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);

  async function load() {
    const [o, w] = await Promise.all([listRequests("open"), listWinners()]);
    setOpen(o.requests); setThreshold(o.threshold); setVoted(new Set(o.voted));
    setWinners(w.winners);
  }
  useEffect(() => { load(); }, [user]);
  useEffect(() => { if (user?.role === "admin") listTracks("new").then(setTracks); }, [user]);

  async function submit() {
    if (!title.trim() || !brief.trim()) { setMsg({ ok: false, text: "Add a title and a brief." }); return; }
    const res = await submitRequest(title, brief, mood);
    if (res.ok) { setTitle(""); setBrief(""); setMood(""); setMsg({ ok: true, text: "Request posted." }); load(); }
    else setMsg({ ok: false, text: res.error || "Could not post." });
  }

  async function vote(r: RequestItem) {
    if (!user) { window.location.href = "/login"; return; }
    const on = !voted.has(r.id);
    const res = await voteRequest(r.id, on);
    if (res.ok) load();
    else setMsg({ ok: false, text: res.error || "Vote failed." });
  }

  return (
    <main className="container" style={{ padding: "48px 20px 110px", maxWidth: 760 }}>
      <p style={styles.eyebrow}>Shape what gets made</p>
      <h1 style={{ fontSize: 44, margin: "8px 0 10px" }}>Request Booth</h1>
      <p style={{ color: "var(--text-dim)", marginBottom: 30 }}>
        Ask for the sound you want to hear. When a request hits {threshold} votes it wins,
        and the drop gets made and credited to whoever asked.
      </p>

      {user ? (
        <div style={styles.form}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short title, e.g. Rainy season amapiano" style={styles.input} maxLength={80} />
          <textarea value={brief} onChange={(e) => setBrief(e.target.value)} placeholder="Describe the vibe, mood, story you want" style={{ ...styles.input, minHeight: 80, resize: "vertical" }} maxLength={500} />
          <div className="stack-sm" style={{ display: "flex", gap: 10 }}>
            <input value={mood} onChange={(e) => setMood(e.target.value)} placeholder="Mood (optional)" style={{ ...styles.input, flex: 1 }} />
            <button onClick={submit} style={styles.postBtn}>Post request</button>
          </div>
        </div>
      ) : (
        <p style={{ color: "var(--text-dim)" }}>
          <Link to="/login" style={{ color: "var(--sunset)", fontWeight: 700 }}>Sign in</Link> to post and vote on requests.
        </p>
      )}
      {msg && <p style={{ color: msg.ok ? "var(--up)" : "var(--down)", marginTop: 12 }}>{msg.text}</p>}

      <h2 style={styles.h2}>Open requests</h2>
      {open.length === 0 && <p style={{ color: "var(--text-dim)" }}>No open requests yet. Be the first to ask.</p>}
      <div style={styles.list}>
        {open.map((r) => {
          const pct = Math.min(100, Math.round((r.vote_count / threshold) * 100));
          const on = voted.has(r.id);
          return (
            <div key={r.id} style={styles.card}>
              <div style={{ flex: 1 }}>
                <div style={styles.cardTitle}>{r.title}</div>
                <div style={styles.brief}>{r.brief}</div>
                <div style={styles.by}>@{r.handle}{r.mood ? ` · ${r.mood}` : ""}</div>
                <div style={styles.barTrack}><div style={{ ...styles.barFill, width: `${pct}%` }} /></div>
                <div style={styles.count}>{r.vote_count} / {threshold} votes</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
                <button onClick={() => vote(r)} style={{ ...styles.voteBtn, ...(on ? styles.voteOn : {}) }}>
                  {on ? "🔥 Voted" : "△ Vote"}
                </button>
                {user && (user.handle === r.handle || user.role === "admin") && (
                  <button onClick={() => deleteRequest(r.id).then(load)} style={styles.del}>delete</button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <h2 style={styles.h2}>Winners wall</h2>
      {winners.length === 0 && <p style={{ color: "var(--text-dim)" }}>No winners yet. The first request to {threshold} votes lands here.</p>}
      <div style={styles.list}>
        {winners.map((r) => (
          <div key={r.id} style={{ ...styles.card, borderColor: "var(--gold)" }}>
            <div style={{ flex: 1 }}>
              <div style={styles.cardTitle}>
                {r.title} <span style={{ color: "var(--gold)", fontSize: 12, fontWeight: 700 }}>{r.status === "fulfilled" ? "MADE" : "IN PRODUCTION"}</span>
              </div>
              <div style={styles.brief}>{r.brief}</div>
              <div style={styles.by}>requested by @{r.handle}</div>
              {r.fulfilled_track_id && (
                <Link to={`/track/${r.fulfilled_track_id}`} style={{ color: "var(--sunset)", fontWeight: 700, fontSize: 14 }}>Listen to the drop →</Link>
              )}
            </div>
            {user?.role === "admin" && r.status === "selected" && (
              <FulfilControl requestId={r.id} tracks={tracks} onDone={load} />
            )}
          </div>
        ))}
      </div>
    </main>
  );
}

function FulfilControl({ requestId, tracks, onDone }: { requestId: string; tracks: Track[]; onDone: () => void }) {
  const [trackId, setTrackId] = useState("");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 200 }}>
      <select value={trackId} onChange={(e) => setTrackId(e.target.value)} style={styles.select}>
        <option value="">Pick the track…</option>
        {tracks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
      </select>
      <button
        onClick={async () => { if (trackId) { await fulfilRequest(requestId, trackId); onDone(); } }}
        style={styles.postBtn}
      >Mark fulfilled</button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  eyebrow: { textTransform: "uppercase", letterSpacing: "0.16em", fontSize: 12, fontWeight: 700, color: "var(--sunset)", margin: 0 },
  form: { display: "flex", flexDirection: "column", gap: 10, background: "var(--bg-elev)", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: 18 },
  input: { padding: "12px 14px", background: "var(--bg)", border: "1px solid var(--line)", borderRadius: "var(--radius)", color: "var(--text)", fontSize: 15, fontFamily: "inherit" },
  postBtn: { border: "none", background: "var(--sunset)", color: "#0B0B14", fontWeight: 700, padding: "12px 20px", borderRadius: "var(--radius)", cursor: "pointer", whiteSpace: "nowrap" },
  h2: { fontSize: 24, margin: "42px 0 18px" },
  list: { display: "flex", flexDirection: "column", gap: 12 },
  card: { display: "flex", gap: 16, background: "var(--bg-elev)", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: 18 },
  cardTitle: { fontWeight: 700, fontSize: 17 },
  brief: { color: "var(--text-dim)", fontSize: 14, marginTop: 4 },
  by: { color: "var(--text-dim)", fontSize: 13, marginTop: 8 },
  barTrack: { height: 6, background: "var(--bg-elev-2)", borderRadius: 99, marginTop: 12, overflow: "hidden" },
  barFill: { height: "100%", background: "var(--sunset)", borderRadius: 99 },
  count: { fontSize: 12, color: "var(--text-dim)", marginTop: 6, fontWeight: 600 },
  voteBtn: { border: "1px solid var(--line)", background: "transparent", color: "var(--text)", borderRadius: 999, padding: "9px 16px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" },
  voteOn: { border: "1px solid var(--sunset)", background: "rgba(255,106,43,0.14)", color: "var(--sunset)" },
  del: { background: "none", border: "none", color: "var(--text-dim)", cursor: "pointer", fontSize: 12 },
  select: { padding: "10px 12px", background: "var(--bg)", border: "1px solid var(--line)", borderRadius: "var(--radius)", color: "var(--text)", fontSize: 14 },
};
