import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Curator, getCurators } from "../lib/api";

export default function Curators() {
  const [list, setList] = useState<Curator[] | null>(null);
  useEffect(() => { getCurators().then(setList); }, []);

  return (
    <main className="container" style={{ padding: "48px 20px 110px", maxWidth: 720 }}>
      <p style={s.eyebrow}>Taste that moves the crowd</p>
      <h1 style={{ fontSize: 44, margin: "8px 0 26px" }}>Curators</h1>

      {list === null && <p style={{ color: "var(--text-dim)" }}>Loading...</p>}
      {list && list.length === 0 && <p style={{ color: "var(--text-dim)" }}>No curators yet.</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {list && list.map((u, i) => (
          <Link key={u.handle} to={`/u/${u.handle}`} style={s.row}>
            <span style={{ ...s.rank, color: i === 0 ? "var(--gold)" : "var(--text)" }}>{i + 1}</span>
            <div style={s.avatar}>{u.display_name.charAt(0).toUpperCase()}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700 }}>{u.display_name} <span style={s.badge}>{u.badge}</span></div>
              <div style={{ color: "var(--text-dim)", fontSize: 13 }}>@{u.handle} · {u.followers} followers · {u.playlists} playlists</div>
            </div>
            <div style={s.points}>{u.points}</div>
          </Link>
        ))}
      </div>
    </main>
  );
}

const s: Record<string, React.CSSProperties> = {
  eyebrow: { textTransform: "uppercase", letterSpacing: "0.16em", fontSize: 12, fontWeight: 700, color: "var(--sunset)", margin: 0 },
  row: { display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", borderRadius: "var(--radius)", background: "var(--bg-elev)" },
  rank: { fontFamily: "var(--font-display)", fontSize: 20, width: 30, textAlign: "center" },
  avatar: { width: 42, height: 42, borderRadius: "50%", background: "var(--bg-elev-2)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "var(--sunset)" },
  badge: { fontSize: 11, fontWeight: 700, color: "var(--gold)", marginLeft: 6 },
  points: { fontWeight: 700, fontVariantNumeric: "tabular-nums" },
};
