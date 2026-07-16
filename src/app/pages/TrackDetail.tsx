import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Track, getTrack, coverUrl } from "../lib/api";
import { usePlayer } from "../context/PlayerContext";
import VoteButton from "../components/VoteButton";

export default function TrackDetail() {
  const { id } = useParams();
  const [track, setTrack] = useState<Track | null | undefined>(undefined);
  const { play, current, playing } = usePlayer();

  useEffect(() => {
    if (id) getTrack(id).then(setTrack).catch(() => setTrack(null));
  }, [id]);

  if (track === undefined) return <main className="container" style={{ padding: "60px 20px" }}><p style={{ color: "var(--text-dim)" }}>Loading...</p></main>;
  if (track === null) return <main className="container" style={{ padding: "60px 20px" }}><h1>Track not found</h1></main>;

  const isCurrent = current?.id === track.id;

  return (
    <main className="container" style={{ padding: "48px 20px 110px" }}>
      <div style={styles.head}>
        <img src={coverUrl(track.id)} alt="" style={styles.cover} />
        <div style={styles.info}>
          {track.mood && <p style={styles.eyebrow}>{track.mood}</p>}
          <h1 style={styles.h1}>{track.title}</h1>
          <p style={styles.artist}>{track.artist}</p>
          {track.credited_user && <p style={styles.credit}>Requested by a fan in the Booth</p>}
          <div style={styles.actions}>
            <button style={styles.play} onClick={() => play(track)}>
              {isCurrent && playing ? "❚❚ Pause" : "► Play"}
            </button>
            <VoteButton trackId={track.id} score={track.score} />
            <span style={styles.count}>{track.play_count} plays</span>
          </div>
        </div>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  head: { display: "flex", gap: 28, flexWrap: "wrap", alignItems: "flex-end" },
  cover: { width: 240, height: 240, borderRadius: "var(--radius-lg)", objectFit: "cover", background: "var(--bg-elev-2)", boxShadow: "var(--shadow)" },
  info: { flex: 1, minWidth: 260 },
  eyebrow: { textTransform: "uppercase", letterSpacing: "0.14em", fontSize: 12, fontWeight: 700, color: "var(--sunset)", margin: 0 },
  h1: { fontSize: "clamp(32px, 6vw, 56px)", margin: "8px 0 6px", lineHeight: 1.05 },
  artist: { color: "var(--text-dim)", fontSize: 18, margin: 0 },
  credit: { color: "var(--gold)", fontSize: 14, marginTop: 8 },
  actions: { display: "flex", alignItems: "center", gap: 18, marginTop: 22 },
  play: { border: "none", background: "var(--sunset)", color: "#0B0B14", fontWeight: 700, fontSize: 16, padding: "13px 26px", borderRadius: "var(--radius)", cursor: "pointer" },
  count: { color: "var(--text-dim)" },
};
