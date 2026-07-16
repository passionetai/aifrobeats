import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChartEntry, getChart, coverUrl, getTrack, Track } from "../lib/api";
import { usePlayer } from "../context/PlayerContext";
import VoteButton from "../components/VoteButton";

function Movement({ position, prev }: { position: number; prev: number | null }) {
  if (prev === null) return <span style={{ color: "var(--gold)", fontSize: 11, fontWeight: 700 }}>NEW</span>;
  if (prev > position) return <span style={{ color: "var(--up)", fontSize: 12 }}>▲ {prev - position}</span>;
  if (prev < position) return <span style={{ color: "var(--down)", fontSize: 12 }}>▼ {position - prev}</span>;
  return <span style={{ color: "var(--text-dim)", fontSize: 12 }}>–</span>;
}

export default function Chart() {
  const [entries, setEntries] = useState<ChartEntry[] | null>(null);
  const { play } = usePlayer();

  useEffect(() => {
    getChart().then((d) => setEntries(d.entries)).catch(() => setEntries([]));
  }, []);

  async function playEntry(trackId: string) {
    const t: Track | null = await getTrack(trackId);
    if (t) play(t);
  }

  return (
    <main className="container" style={{ padding: "48px 20px 110px" }}>
      <p style={styles.eyebrow}>Community powered</p>
      <h1 style={styles.h1}>The Hot 100</h1>
      <p style={styles.note}>Voted up by fans. Updated hourly.</p>

      {entries === null && <p style={styles.dim}>Loading...</p>}
      {entries && entries.length === 0 && <p style={styles.dim}>No tracks on the chart yet. Upload a drop and get the votes rolling.</p>}

      <div style={styles.list}>
        {entries && entries.map((e) => (
          <div key={e.track_id} style={styles.row}>
            <div style={styles.rankBlock}>
              <span style={{ ...styles.rank, color: e.position === 1 ? "var(--gold)" : "var(--text)" }}>{e.position}</span>
              <Movement position={e.position} prev={e.prev_pos} />
            </div>
            <img src={coverUrl(e.track_id)} alt="" style={styles.cover} />
            <div style={styles.meta}>
              <Link to={`/track/${e.track_id}`} style={styles.title}>{e.title}</Link>
              <div style={styles.sub}>{e.artist}{e.mood ? ` · ${e.mood}` : ""}</div>
            </div>
            <VoteButton trackId={e.track_id} score={e.score} />
            <button style={styles.play} onClick={() => playEntry(e.track_id)} aria-label={`Play ${e.title}`}>►</button>
          </div>
        ))}
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  eyebrow: { textTransform: "uppercase", letterSpacing: "0.16em", fontSize: 12, fontWeight: 700, color: "var(--sunset)", margin: 0 },
  h1: { fontSize: 44, margin: "10px 0 8px" },
  note: { color: "var(--text-dim)", marginBottom: 28 },
  dim: { color: "var(--text-dim)" },
  list: { display: "flex", flexDirection: "column", gap: 6 },
  row: { display: "flex", alignItems: "center", gap: 14, padding: "10px 14px", borderRadius: "var(--radius)", background: "var(--bg-elev)" },
  rankBlock: { display: "flex", flexDirection: "column", alignItems: "center", width: 42, gap: 2 },
  rank: { fontFamily: "var(--font-display)", fontSize: 20 },
  cover: { width: 48, height: 48, borderRadius: 8, objectFit: "cover", background: "var(--bg-elev-2)" },
  meta: { flex: 1, minWidth: 0 },
  title: { fontWeight: 700, fontSize: 15 },
  sub: { color: "var(--text-dim)", fontSize: 13 },
  play: { width: 40, height: 40, borderRadius: "50%", border: "none", background: "var(--sunset)", color: "#0B0B14", cursor: "pointer", flexShrink: 0 },
};
