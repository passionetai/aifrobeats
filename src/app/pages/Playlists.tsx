import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PlaylistSummary, discoverPlaylists, myPlaylists, createPlaylist } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function Playlists() {
  const { user } = useAuth();
  const [discover, setDiscover] = useState<PlaylistSummary[]>([]);
  const [mine, setMine] = useState<PlaylistSummary[]>([]);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");

  async function load() {
    setDiscover(await discoverPlaylists());
    if (user) setMine(await myPlaylists());
  }
  useEffect(() => { load(); }, [user]);

  async function make() {
    if (!title.trim()) return;
    const res = await createPlaylist(title, desc, true);
    if (res.ok) { setTitle(""); setDesc(""); load(); }
  }

  return (
    <main className="container" style={{ padding: "48px 20px 110px", maxWidth: 820 }}>
      <p style={s.eyebrow}>Curate the sound</p>
      <h1 style={{ fontSize: 44, margin: "8px 0 26px" }}>Playlists</h1>

      {user ? (
        <div style={s.form}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New playlist title" style={s.input} maxLength={80} />
          <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description (optional)" style={s.input} maxLength={300} />
          <button onClick={make} style={s.btn}>Create</button>
        </div>
      ) : (
        <p style={{ color: "var(--text-dim)" }}><Link to="/login" style={s.link}>Sign in</Link> to build playlists.</p>
      )}

      {user && mine.length > 0 && (
        <>
          <h2 style={s.h2}>Your playlists</h2>
          <div style={s.grid}>{mine.map((p) => <Card key={p.id} p={p} mine />)}</div>
        </>
      )}

      <h2 style={s.h2}>Discover</h2>
      {discover.length === 0 && <p style={{ color: "var(--text-dim)" }}>No public playlists yet. Make the first one.</p>}
      <div style={s.grid}>{discover.map((p) => <Card key={p.id} p={p} />)}</div>
    </main>
  );
}

function Card({ p, mine }: { p: PlaylistSummary; mine?: boolean }) {
  return (
    <Link to={`/playlists/${p.id}`} style={s.card}>
      <div style={s.cardTitle}>{p.title}</div>
      {p.description && <div style={s.cardDesc}>{p.description}</div>}
      <div style={s.cardMeta}>
        {mine ? `${p.track_count} tracks` : `@${p.handle} · ${p.track_count} tracks`}
      </div>
    </Link>
  );
}

const s: Record<string, React.CSSProperties> = {
  eyebrow: { textTransform: "uppercase", letterSpacing: "0.16em", fontSize: 12, fontWeight: 700, color: "var(--sunset)", margin: 0 },
  link: { color: "var(--sunset)", fontWeight: 700 },
  form: { display: "flex", gap: 10, flexWrap: "wrap", background: "var(--bg-elev)", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: 16, marginBottom: 8 },
  input: { flex: "1 1 200px", padding: "12px 14px", background: "var(--bg)", border: "1px solid var(--line)", borderRadius: "var(--radius)", color: "var(--text)", fontSize: 15 },
  btn: { border: "none", background: "var(--sunset)", color: "#0B0B14", fontWeight: 700, padding: "12px 24px", borderRadius: "var(--radius)", cursor: "pointer" },
  h2: { fontSize: 24, margin: "40px 0 18px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 },
  card: { display: "block", background: "var(--bg-elev)", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: 18 },
  cardTitle: { fontWeight: 700, fontSize: 17 },
  cardDesc: { color: "var(--text-dim)", fontSize: 14, marginTop: 6 },
  cardMeta: { color: "var(--text-dim)", fontSize: 13, marginTop: 12 },
};
