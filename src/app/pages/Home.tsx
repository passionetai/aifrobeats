import { useEffect, useState } from "react";
import { Track, listTracks } from "../lib/api";
import TrackCard from "../components/TrackCard";

export default function Home() {
  const [tracks, setTracks] = useState<Track[] | null>(null);

  useEffect(() => {
    listTracks("new").then(setTracks).catch(() => setTracks([]));
  }, []);

  return (
    <main style={{ paddingBottom: 90 }}>
      <section style={styles.hero}>
        <div className="container">
          <p style={styles.eyebrow}>AI-native Afrobeats, chosen by the crowd</p>
          <h1 style={styles.h1}>The chart, the radio,<br />and the booth.</h1>
          <p style={styles.sub}>
            Discover new drops, vote them up the Hot 100, and request the sound
            you want made next. This is where AI Afrobeats becomes a scene.
          </p>
        </div>
      </section>

      <section className="container" style={{ padding: "40px 20px 0" }}>
        <h2 style={styles.h2}>New drops</h2>
        {tracks === null && <p style={styles.dim}>Loading...</p>}
        {tracks && tracks.length === 0 && (
          <div style={styles.empty}>
            <p style={{ margin: 0, fontWeight: 700 }}>No tracks yet.</p>
            <p style={styles.dim}>Head to the admin page to upload your first drop.</p>
          </div>
        )}
        {tracks && tracks.length > 0 && (
          <div style={styles.grid}>
            {tracks.map((t) => <TrackCard key={t.id} track={t} />)}
          </div>
        )}
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  hero: {
    padding: "80px 0 56px",
    background: "radial-gradient(1200px 500px at 70% -10%, rgba(255,106,43,0.18), transparent 60%)",
    borderBottom: "1px solid var(--line)",
  },
  eyebrow: { textTransform: "uppercase", letterSpacing: "0.16em", fontSize: 12, fontWeight: 700, color: "var(--sunset)", margin: 0 },
  h1: { fontSize: "clamp(40px, 7vw, 72px)", lineHeight: 1.02, margin: "16px 0 20px" },
  sub: { maxWidth: 560, color: "var(--text-dim)", fontSize: 18, margin: 0 },
  h2: { fontSize: 24, margin: "0 0 20px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 22 },
  empty: { background: "var(--bg-elev)", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: "28px 24px" },
  dim: { color: "var(--text-dim)" },
};
