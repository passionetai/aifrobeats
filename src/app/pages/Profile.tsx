import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Profile as P, PlaylistSummary, getProfile, toggleFollow } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { handle } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState<{ profile: P; playlists: PlaylistSummary[]; is_following: boolean; is_me: boolean } | null | undefined>(undefined);

  async function load() { if (handle) setData(await getProfile(handle)); }
  useEffect(() => { load(); }, [handle]);

  if (data === undefined) return <main className="container" style={{ padding: "60px 20px" }}><p style={{ color: "var(--text-dim)" }}>Loading...</p></main>;
  if (data === null) return <main className="container" style={{ padding: "60px 20px" }}><h1>Profile not found</h1></main>;

  const p = data.profile;

  async function follow() {
    if (!user) { window.location.href = "/login"; return; }
    await toggleFollow(p.handle, !data!.is_following);
    load();
  }

  return (
    <main className="container" style={{ padding: "48px 20px 110px", maxWidth: 760 }}>
      <div style={s.head}>
        <div style={s.avatar}>{p.display_name.charAt(0).toUpperCase()}</div>
        <div style={{ flex: 1 }}>
          <div style={s.badge}>{p.badge}</div>
          <h1 style={{ fontSize: 34, margin: "6px 0 2px" }}>{p.display_name}</h1>
          <div style={{ color: "var(--text-dim)" }}>@{p.handle}</div>
        </div>
        {!data.is_me && (
          <button onClick={follow} style={{ ...s.follow, ...(data.is_following ? s.followingBtn : {}) }}>
            {data.is_following ? "Following" : "Follow"}
          </button>
        )}
      </div>

      {p.bio && <p style={{ marginTop: 16 }}>{p.bio}</p>}

      <div style={s.stats}>
        <div><b>{p.points}</b> <span style={s.stat}>points</span></div>
        <div><b>{p.followers}</b> <span style={s.stat}>followers</span></div>
        <div><b>{p.following}</b> <span style={s.stat}>following</span></div>
      </div>

      <h2 style={s.h2}>Playlists</h2>
      {data.playlists.length === 0 && <p style={{ color: "var(--text-dim)" }}>No public playlists yet.</p>}
      <div style={s.grid}>
        {data.playlists.map((pl) => (
          <Link key={pl.id} to={`/playlists/${pl.id}`} style={s.card}>
            <div style={{ fontWeight: 700 }}>{pl.title}</div>
            <div style={{ color: "var(--text-dim)", fontSize: 13, marginTop: 8 }}>{pl.track_count} tracks</div>
          </Link>
        ))}
      </div>
    </main>
  );
}

const s: Record<string, React.CSSProperties> = {
  head: { display: "flex", alignItems: "center", gap: 18 },
  avatar: { width: 76, height: 76, borderRadius: "50%", background: "var(--bg-elev-2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 700, color: "var(--sunset)", flexShrink: 0 },
  badge: { display: "inline-block", background: "rgba(242,183,5,0.15)", color: "var(--gold)", fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 999, textTransform: "uppercase", letterSpacing: "0.08em" },
  follow: { border: "none", background: "var(--sunset)", color: "#0B0B14", fontWeight: 700, padding: "11px 22px", borderRadius: "var(--radius)", cursor: "pointer" },
  followingBtn: { background: "transparent", border: "1px solid var(--line)", color: "var(--text)" },
  stats: { display: "flex", gap: 26, marginTop: 22, fontSize: 18 },
  stat: { color: "var(--text-dim)", fontSize: 14 },
  h2: { fontSize: 22, margin: "36px 0 16px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 },
  card: { display: "block", background: "var(--bg-elev)", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: 16 },
};
