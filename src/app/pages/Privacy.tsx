import { SITE } from "../siteConfig";

export default function Privacy() {
  return (
    <main className="container" style={{ padding: "56px 20px 40px", maxWidth: 720 }}>
      <p style={eyebrow}>Legal</p>
      <h1 style={{ fontSize: 38, margin: "8px 0 8px" }}>Privacy Policy</h1>
      <p style={{ color: "var(--text-dim)", marginBottom: 28 }}>Last updated {new Date().getFullYear()}</p>
      <div style={prose}>
        <p>This policy explains what we collect and how we use it. We keep it simple because we collect very little.</p>
        <h2 style={h2}>What we collect</h2>
        <p>Your email address, when you sign in or subscribe to drop alerts. A handle and display name you choose. Activity you create on the site: votes, comments, playlists, requests, and reactions. Basic technical data needed to run the site.</p>
        <h2 style={h2}>How we use it</h2>
        <p>To run your account and show your activity, to send you the sign-in link you request, and, if you opt in, to email you about new drops and platform news. We do not sell your data.</p>
        <h2 style={h2}>Email</h2>
        <p>We use a third-party email provider to send sign-in links and, if you subscribe, drop alerts. You can unsubscribe from alerts at any time.</p>
        <h2 style={h2}>Cookies</h2>
        <p>We use a single sign-in cookie to keep you logged in. We do not use advertising trackers.</p>
        <h2 style={h2}>Your choices</h2>
        <p>You can stop receiving drop alerts, and you can request that we delete your account and associated data by contacting us.</p>
        <h2 style={h2}>Contact</h2>
        <p>Questions or a data request? Email <a href={`mailto:${SITE.contactEmail}`} style={link}>{SITE.contactEmail}</a>.</p>
      </div>
    </main>
  );
}
const eyebrow: React.CSSProperties = { textTransform: "uppercase", letterSpacing: "0.16em", fontSize: 12, fontWeight: 700, color: "var(--sunset)", margin: 0 };
const prose: React.CSSProperties = { color: "var(--text)", lineHeight: 1.7, fontSize: 16 };
const h2: React.CSSProperties = { fontSize: 20, marginTop: 28, marginBottom: 6 };
const link: React.CSSProperties = { color: "var(--sunset)", fontWeight: 700 };
