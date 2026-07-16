import { usePlayer } from "../context/PlayerContext";
import { coverUrl } from "../lib/api";

export default function Player() {
  const { current, playing, toggle } = usePlayer();
  if (!current) return null;

  return (
    <div style={styles.bar}>
      <div style={styles.inner}>
        <img src={coverUrl(current.id)} alt="" style={styles.cover} />
        <div style={styles.meta}>
          <div style={styles.title}>{current.title}</div>
          <div style={styles.artist}>{current.artist}</div>
        </div>
        <button onClick={toggle} style={styles.play} aria-label={playing ? "Pause" : "Play"}>
          {playing ? "❚❚" : "►"}
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  bar: {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 30,
    background: "rgba(20,20,31,0.96)",
    backdropFilter: "blur(12px)",
    borderTop: "1px solid var(--line)",
  },
  inner: {
    maxWidth: "var(--maxw)",
    margin: "0 auto",
    padding: "10px 20px",
    display: "flex",
    alignItems: "center",
    gap: 14,
  },
  cover: { width: 44, height: 44, borderRadius: 8, objectFit: "cover", background: "var(--bg-elev-2)" },
  meta: { minWidth: 0, flex: 1 },
  title: { fontWeight: 700, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  artist: { color: "var(--text-dim)", fontSize: 12 },
  play: {
    width: 44,
    height: 44,
    borderRadius: "50%",
    border: "none",
    background: "var(--sunset)",
    color: "#0B0B14",
    fontSize: 16,
    cursor: "pointer",
  },
};
