import { SITE } from "../siteConfig";

export default function Terms() {
  return (
    <main className="container" style={{ padding: "56px 20px 40px", maxWidth: 720 }}>
      <p style={eyebrow}>Legal</p>
      <h1 style={{ fontSize: 38, margin: "8px 0 8px" }}>Terms of Use</h1>
      <p style={{ color: "var(--text-dim)", marginBottom: 28 }}>Last updated {new Date().getFullYear()}</p>
      <div style={prose}>
        <p>Welcome to Aifrobeats. By using this site you agree to these terms. Please read them.</p>
        <h2 style={h2}>Using the site</h2>
        <p>You may browse, stream, vote, comment, build playlists, and submit requests. You agree not to misuse the site, attempt to disrupt it, manipulate votes or the chart through automated means, or upload content you do not have the right to share.</p>
        <h2 style={h2}>Accounts</h2>
        <p>Accounts use a passwordless email sign-in link. You are responsible for the email account tied to your access. We may suspend accounts that violate these terms.</p>
        <h2 style={h2}>Your content</h2>
        <p>Comments, playlist choices, and requests you post are yours. By posting them, you grant Aifrobeats permission to display them on the platform. We may remove content that is abusive, unlawful, or violates these terms.</p>
        <h2 style={h2}>Music and rights</h2>
        <p>Tracks on Aifrobeats are AI-generated works published by Aifrobeats. You may stream them on the platform for personal enjoyment. You may not redistribute or resell them without permission.</p>
        <h2 style={h2}>Request Booth</h2>
        <p>Submitting a request does not guarantee a track will be made. Winning requests may be produced at Aifrobeats' discretion. Credit is given to the requesting fan where a request is fulfilled.</p>
        <h2 style={h2}>No warranty</h2>
        <p>The site is provided as is, without warranties of any kind. We do our best to keep it running but cannot guarantee uninterrupted service.</p>
        <h2 style={h2}>Changes</h2>
        <p>We may update these terms. Continued use after changes means you accept them.</p>
        <h2 style={h2}>Contact</h2>
        <p>Questions about these terms? Email <a href={`mailto:${SITE.contactEmail}`} style={link}>{SITE.contactEmail}</a>.</p>
      </div>
    </main>
  );
}
const eyebrow: React.CSSProperties = { textTransform: "uppercase", letterSpacing: "0.16em", fontSize: 12, fontWeight: 700, color: "var(--sunset)", margin: 0 };
const prose: React.CSSProperties = { color: "var(--text)", lineHeight: 1.7, fontSize: 16 };
const h2: React.CSSProperties = { fontSize: 20, marginTop: 28, marginBottom: 6 };
const link: React.CSSProperties = { color: "var(--sunset)", fontWeight: 700 };
