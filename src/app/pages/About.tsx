import EmailSignup from "../components/EmailSignup";

export default function About() {
  return (
    <main className="container" style={{ padding: "56px 20px 40px", maxWidth: 700 }}>
      <p style={eyebrow}>About</p>
      <h1 style={{ fontSize: 42, margin: "8px 0 24px" }}>Where AI Afrobeats becomes a scene</h1>
      <div style={prose}>
        <p>Aifrobeats is a home for AI-native Afrobeats, shaped by the people who listen to it. This is not a place to generate tracks. It is a place to discover them, champion them, and decide together what gets made next.</p>
        <p>New drops land, and fans vote them up a live Hot 100. Everyone can gather in the live radio room and hear the same track at the same moment. And in the Request Booth, fans ask for the sound they want to hear, and when a request wins, that drop gets made and credited to whoever asked for it.</p>
        <p>It is built to be a scene, not a library. The chart, the radio, and the booth.</p>
      </div>
      <div style={{ marginTop: 36 }}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>Stay in the loop</div>
        <EmailSignup />
      </div>
    </main>
  );
}
const eyebrow: React.CSSProperties = { textTransform: "uppercase", letterSpacing: "0.16em", fontSize: 12, fontWeight: 700, color: "var(--sunset)", margin: 0 };
const prose: React.CSSProperties = { color: "var(--text)", lineHeight: 1.7, fontSize: 17 };
