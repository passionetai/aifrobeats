import { Link } from "react-router-dom";
import { SITE } from "../siteConfig";
import EmailSignup from "./EmailSignup";

export default function Footer() {
  const socials = Object.entries(SITE.socials).filter(([, url]) => url);

  return (
    <footer style={s.footer}>
      <div className="container" style={s.inner}>
        <div style={s.top}>
          <div style={s.brandCol}>
            <div style={s.brand}>AIFRO<span style={{ color: "var(--sunset)" }}>BEATS</span></div>
            <p style={s.tag}>AI-native Afrobeats, chosen by the crowd.</p>
          </div>
          <div style={s.signupCol}>
            <div style={s.signupLabel}>Get drop alerts</div>
            <EmailSignup />
          </div>
        </div>

        <div style={s.links}>
          <Link to="/" style={s.link}>Home</Link>
          <Link to="/chart" style={s.link}>Hot 100</Link>
          <Link to="/booth" style={s.link}>Request Booth</Link>
          <Link to="/live" style={s.link}>Live</Link>
          <Link to="/about" style={s.link}>About</Link>
          <Link to="/contact" style={s.link}>Contact</Link>
          <Link to="/terms" style={s.link}>Terms</Link>
          <Link to="/privacy" style={s.link}>Privacy</Link>
        </div>

        {socials.length > 0 && (
          <div style={s.socials}>
            {socials.map(([name, url]) => (
              <a key={name} href={url} target="_blank" rel="noreferrer" style={s.social}>{name}</a>
            ))}
          </div>
        )}

        <div style={s.copy}>© {new Date().getFullYear()} Aifrobeats. All rights reserved.</div>
      </div>
    </footer>
  );
}

const s: Record<string, React.CSSProperties> = {
  footer: { borderTop: "1px solid var(--line)", background: "var(--bg-elev)", marginTop: 60, paddingBottom: 90 },
  inner: { paddingTop: 40 },
  top: { display: "flex", gap: 32, flexWrap: "wrap", justifyContent: "space-between", marginBottom: 32 },
  brandCol: { minWidth: 220 },
  brand: { fontFamily: "var(--font-display)", fontSize: 22 },
  tag: { color: "var(--text-dim)", fontSize: 14, marginTop: 8, maxWidth: 260 },
  signupCol: { minWidth: 280, flex: 1 },
  signupLabel: { fontWeight: 700, marginBottom: 10 },
  links: { display: "flex", flexWrap: "wrap", gap: "12px 24px", paddingTop: 24, borderTop: "1px solid var(--line)" },
  link: { color: "var(--text-dim)", fontSize: 14, fontWeight: 600 },
  socials: { display: "flex", gap: 16, marginTop: 20 },
  social: { color: "var(--sunset)", fontSize: 14, fontWeight: 700, textTransform: "capitalize" },
  copy: { color: "var(--text-dim)", fontSize: 13, marginTop: 24 },
};
