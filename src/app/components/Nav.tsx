import { NavLink, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/", label: "Home", end: true },
  { to: "/chart", label: "Hot 100" },
  { to: "/booth", label: "Request Booth" },
  { to: "/live", label: "Live" },
  { to: "/curators", label: "Curators" },
];

export default function Nav() {
  const { user, signOut } = useAuth();

  return (
    <header style={styles.header}>
      <div className="container" style={styles.inner}>
        <NavLink to="/" style={styles.brand}>
          AIFRO<span style={{ color: "var(--sunset)" }}>BEATS</span>
        </NavLink>
        <nav style={styles.nav}>
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              style={({ isActive }) => ({
                ...styles.link,
                color: isActive ? "var(--text)" : "var(--text-dim)",
                borderBottom: isActive ? "2px solid var(--sunset)" : "2px solid transparent",
              })}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div style={styles.right}>
          {user?.role === "admin" && (
            <Link to="/admin" style={styles.admin}>Upload</Link>
          )}
          {user ? (
            <div style={styles.userWrap}>
              <Link to={`/u/${user.handle}`} style={styles.handle}>@{user.handle}</Link>
              <button onClick={signOut} style={styles.signout}>Sign out</button>
            </div>
          ) : (
            <Link to="/login" style={styles.cta}>Sign in</Link>
          )}
        </div>
      </div>
    </header>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: { position: "sticky", top: 0, zIndex: 20, background: "rgba(11,11,20,0.85)", backdropFilter: "blur(10px)", borderBottom: "1px solid var(--line)" },
  inner: { display: "flex", alignItems: "center", gap: 24, height: 64 },
  brand: { fontFamily: "var(--font-display)", fontSize: 22, letterSpacing: "0.02em" },
  nav: { display: "flex", gap: 20, marginLeft: 8, flexWrap: "wrap" },
  link: { fontSize: 14, fontWeight: 600, padding: "20px 0" },
  right: { marginLeft: "auto", display: "flex", alignItems: "center", gap: 14 },
  admin: { fontSize: 13, fontWeight: 700, color: "var(--gold)" },
  userWrap: { display: "flex", alignItems: "center", gap: 12 },
  handle: { fontSize: 14, fontWeight: 700 },
  signout: { background: "none", border: "1px solid var(--line)", color: "var(--text-dim)", fontSize: 13, padding: "7px 12px", borderRadius: "var(--radius)", cursor: "pointer" },
  cta: { background: "var(--sunset)", color: "#0B0B14", fontWeight: 700, fontSize: 14, padding: "10px 16px", borderRadius: "var(--radius)" },
};
