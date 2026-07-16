import { useState } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/", label: "Home", end: true },
  { to: "/chart", label: "Hot 100" },
  { to: "/booth", label: "Request Booth" },
  { to: "/live", label: "Live" },
  { to: "/playlists", label: "Playlists" },
  { to: "/curators", label: "Curators" },
];

export default function Nav() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const loc = useLocation();

  // close the mobile menu whenever the route changes
  const close = () => setOpen(false);

  return (
    <header style={styles.header}>
      <div className="container" style={styles.bar}>
        <NavLink to="/" style={styles.brand} onClick={close}>
          AIFRO<span style={{ color: "var(--sunset)" }}>BEATS</span>
        </NavLink>

        {/* desktop links */}
        <nav className="nav-desktop" style={styles.navDesktop}>
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end}
              style={({ isActive }) => ({ ...styles.link, color: isActive ? "var(--text)" : "var(--text-dim)", borderBottom: isActive ? "2px solid var(--sunset)" : "2px solid transparent" })}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        {/* desktop right side */}
        <div className="nav-desktop" style={styles.rightDesktop}>
          {user?.role === "admin" && <Link to="/admin" style={styles.admin}>Upload</Link>}
          {user ? (
            <>
              <Link to={`/u/${user.handle}`} style={styles.handle}>@{user.handle}</Link>
              <button onClick={signOut} style={styles.signout}>Sign out</button>
            </>
          ) : (
            <Link to="/login" style={styles.cta}>Sign in</Link>
          )}
        </div>

        {/* mobile hamburger */}
        <button className="nav-burger" onClick={() => setOpen((o) => !o)} aria-label="Menu" style={styles.burger}>
          {open ? "✕" : "☰"}
        </button>
      </div>

      {/* mobile dropdown panel */}
      {open && (
        <div className="nav-mobile-panel" style={styles.panel}>
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} onClick={close}
              style={({ isActive }) => ({ ...styles.mLink, color: isActive ? "var(--sunset)" : "var(--text)" })}>
              {l.label}
            </NavLink>
          ))}
          <div style={styles.mDivider} />
          {user?.role === "admin" && <NavLink to="/admin" onClick={close} style={{ ...styles.mLink, color: "var(--gold)" }}>Upload</NavLink>}
          {user ? (
            <>
              <NavLink to={`/u/${user.handle}`} onClick={close} style={{ ...styles.mLink, color: "var(--text)" }}>@{user.handle}</NavLink>
              <button onClick={() => { signOut(); close(); }} style={{ ...styles.mLink, ...styles.mBtn }}>Sign out</button>
            </>
          ) : (
            <NavLink to="/login" onClick={close} style={{ ...styles.mLink, color: "var(--sunset)", fontWeight: 700 }}>Sign in</NavLink>
          )}
        </div>
      )}
    </header>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: { position: "sticky", top: 0, zIndex: 40, background: "rgba(11,11,20,0.9)", backdropFilter: "blur(10px)", borderBottom: "1px solid var(--line)" },
  bar: { display: "flex", alignItems: "center", height: 60, gap: 16 },
  brand: { fontFamily: "var(--font-display)", fontSize: 20, letterSpacing: "0.02em", whiteSpace: "nowrap" },
  navDesktop: { display: "flex", gap: 18, marginLeft: 12, alignItems: "center" },
  link: { fontSize: 14, fontWeight: 600, padding: "18px 0", whiteSpace: "nowrap" },
  rightDesktop: { marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 },
  admin: { fontSize: 13, fontWeight: 700, color: "var(--gold)", whiteSpace: "nowrap" },
  handle: { fontSize: 14, fontWeight: 700, whiteSpace: "nowrap" },
  signout: { background: "none", border: "1px solid var(--line)", color: "var(--text-dim)", fontSize: 13, padding: "7px 12px", borderRadius: "var(--radius)", cursor: "pointer", whiteSpace: "nowrap" },
  cta: { background: "var(--sunset)", color: "#0B0B14", fontWeight: 700, fontSize: 14, padding: "9px 16px", borderRadius: "var(--radius)", whiteSpace: "nowrap" },
  burger: { marginLeft: "auto", background: "none", border: "1px solid var(--line)", color: "var(--text)", fontSize: 20, width: 42, height: 42, borderRadius: "var(--radius)", cursor: "pointer", display: "none", lineHeight: 1 },
  panel: { display: "flex", flexDirection: "column", padding: "8px 20px 16px", borderTop: "1px solid var(--line)", background: "var(--bg)" },
  mLink: { padding: "14px 4px", fontSize: 16, fontWeight: 600, borderBottom: "1px solid var(--line)", textAlign: "left", background: "none", border: "none", borderBottomWidth: 1, borderBottomStyle: "solid", borderBottomColor: "var(--line)", cursor: "pointer", width: "100%" },
  mBtn: { color: "var(--text-dim)" },
  mDivider: { height: 6 },
};
