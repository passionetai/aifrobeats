import { Link } from "react-router-dom";
import { Track, coverUrl } from "../lib/api";
import { usePlayer } from "../context/PlayerContext";

export default function TrackCard({ track, rank }: { track: Track; rank?: number }) {
  const { play, current, playing } = usePlayer();
  const isCurrent = current?.id === track.id;

  return (
    <div style={styles.card}>
      <div style={styles.art}>
        <img src={coverUrl(track.id)} alt="" style={styles.cover} />
        {rank !== undefined && (
          <span style={{ ...styles.rank, color: rank === 1 ? "var(--gold)" : "var(--text)" }}>
            {rank}
          </span>
        )}
        <button
          style={styles.playBtn}
          onClick={() => play(track)}
          aria-label={`Play ${track.title}`}
        >
          {isCurrent && playing ? "❚❚" : "►"}
        </button>
      </div>
      <Link to={`/track/${track.id}`} style={styles.title}>{track.title}</Link>
      <div style={styles.sub}>
        {track.artist}
        {track.mood ? ` · ${track.mood}` : ""}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: { width: "100%" },
  art: {
    position: "relative",
    aspectRatio: "1 / 1",
    borderRadius: "var(--radius)",
    overflow: "hidden",
    background: "var(--bg-elev-2)",
  },
  cover: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  rank: {
    position: "absolute",
    top: 8,
    left: 10,
    fontFamily: "var(--font-display)",
    fontSize: 22,
    textShadow: "0 2px 8px rgba(0,0,0,0.6)",
  },
  playBtn: {
    position: "absolute",
    right: 10,
    bottom: 10,
    width: 40,
    height: 40,
    borderRadius: "50%",
    border: "none",
    background: "var(--sunset)",
    color: "#0B0B14",
    fontSize: 14,
    cursor: "pointer",
    boxShadow: "var(--shadow)",
  },
  title: { display: "block", fontWeight: 700, fontSize: 15, marginTop: 10 },
  sub: { color: "var(--text-dim)", fontSize: 13, marginTop: 2 },
};
