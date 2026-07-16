import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { PlaylistTrack, getPlaylist, removeFromPlaylist, deletePlaylist, getTrack, coverUrl } from "../lib/api";
import { usePlayer } from "../context/PlayerContext";

export default function PlaylistDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { play } = usePlayer();
  const [data, setData] = useState<{ playlist: any; tracks: PlaylistTrack[]; is_owner: boolean } | null | undefined>(undefined);

  async function load() { if (id) setData(await getPlaylist(id)); }
  useEffect(() => { load(); }, [id]);

  if (data === undefined) return <main className="container" style={{ padding: "60px 20px" }}><p style={{ color: "var(--text-dim)" }}>Loading...</p></main>;
  if (data === null) return <main className="container" style={{ padding: "60px 20px" }}><h1>Playlist not found</h1></main>;

  async function playTrack(t: PlaylistTrack) {
    const full = await getTrack(t.id);
    if (full) play(full);
  }

  return (
    <main className="container" style={{ padding: "48px 20px 110px", maxWidth: 760 }}>
      <p style={s.eyebrow}>Playlist</p>
      <h1 style={{ fontSize: 40, margin: "6px 0 6px" }}>{data.playlist.title}</h1>
      <div style={{ color: "var(--text-dim)", marginBottom: 4 }}>
        by <Link to={`/u/${data.playlist.handle}`} style={{ fontWeight: 700 }}>@{data.playlist.handle}</Link>
      </div>
      {data.playlist.description && <p style={{ color: "var(--text-dim)" }}>{data.playlist.description}</p>}
      {data.is_owner && (
        <button onClick={async () => { if (id && confirm("Delete this playlist?")) { await deletePlaylist(id); nav("/playlists"); } }} style={s.del}>Delete playlist</button>
      )}

      <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 6 }}>
        {data.tracks.length === 0 && <p style={{ color: "var(--text-dim)" }}>No tracks yet. Add some from any track page.</p>}
        {data.tracks.map((t, i) => (
          <div key={t.id} style={s.row}>
            <span style={s.num}>{i + 1}</span>
            <img src={coverUrl(t.id)} alt="" style={s.cover} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <Link to={`/track/${t.id}`} style={s.title}>{t.title}</Link>
              <div style={s.sub}>{t.artist}{t.mood ? ` · ${t.mood}` : ""}</div>
            </div>
            <button style={s.play} onClick={() => playTrack(t)}>►</button>
            {data.is_owner && <button style={s.remove} onClick={async () => { if (id) { await removeFromPlaylist(id, t.id); load(); } }}>✕</button>}
          </div>
        ))}
      </div>
    </main>
  );
}

const s: Record<string, React.CSSProperties> = {
  eyebrow: { textTransform: "uppercase", letterSpacing: "0.16em", fontSize: 12, fontWeight: 700, color: "var(--sunset)", margin: 0 },
  del: { marginTop: 14, background: "none", border: "1px solid var(--line)", color: "var(--down)", padding: "8px 14px", borderRadius: "var(--radius)", cursor: "pointer", fontSize: 13 },
  row: { display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", borderRadius: "var(--radius)", background: "var(--bg-elev)" },
  num: { width: 24, textAlign: "center", color: "var(--text-dim)", fontWeight: 700 },
  cover: { width: 44, height: 44, borderRadius: 8, objectFit: "cover", background: "var(--bg-elev-2)" },
  title: { fontWeight: 700, fontSize: 15 },
  sub: { color: "var(--text-dim)", fontSize: 13 },
  play: { width: 38, height: 38, borderRadius: "50%", border: "none", background: "var(--sunset)", color: "#0B0B14", cursor: "pointer" },
  remove: { background: "none", border: "none", color: "var(--text-dim)", cursor: "pointer", fontSize: 15 },
};
