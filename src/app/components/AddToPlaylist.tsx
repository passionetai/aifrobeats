import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PlaylistSummary, myPlaylists, addToPlaylist, createPlaylist } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function AddToPlaylist({ trackId }: { trackId: string }) {
  const { user } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [lists, setLists] = useState<PlaylistSummary[]>([]);
  const [msg, setMsg] = useState("");

  useEffect(() => { if (open && user) myPlaylists().then(setLists); }, [open, user]);

  if (!user) {
    return <button onClick={() => nav("/login")} style={btn}>+ Add to playlist</button>;
  }

  async function add(id: string) {
    const ok = await addToPlaylist(id, trackId);
    setMsg(ok ? "Added" : "Already there");
    setTimeout(() => { setMsg(""); setOpen(false); }, 900);
  }

  async function quickCreate() {
    const res = await createPlaylist("My playlist", "", true);
    if (res.ok && res.id) { await addToPlaylist(res.id, trackId); setMsg("Created and added"); setTimeout(() => { setMsg(""); setOpen(false); }, 900); }
  }

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button onClick={() => setOpen((o) => !o)} style={btn}>+ Add to playlist</button>
      {open && (
        <div style={menu}>
          {lists.length === 0 && <button onClick={quickCreate} style={item}>Create a playlist</button>}
          {lists.map((p) => (
            <button key={p.id} onClick={() => add(p.id)} style={item}>{p.title}</button>
          ))}
          {msg && <div style={{ padding: "8px 12px", color: "var(--up)", fontSize: 13 }}>{msg}</div>}
        </div>
      )}
    </div>
  );
}

const btn: React.CSSProperties = { border: "1px solid var(--line)", background: "transparent", color: "var(--text)", fontWeight: 600, padding: "9px 14px", borderRadius: 999, cursor: "pointer", fontSize: 14 };
const menu: React.CSSProperties = { position: "absolute", top: "110%", left: 0, zIndex: 10, background: "var(--bg-elev)", border: "1px solid var(--line)", borderRadius: "var(--radius)", minWidth: 200, boxShadow: "var(--shadow)", overflow: "hidden" };
const item: React.CSSProperties = { display: "block", width: "100%", textAlign: "left", background: "none", border: "none", color: "var(--text)", padding: "11px 14px", cursor: "pointer", fontSize: 14 };
