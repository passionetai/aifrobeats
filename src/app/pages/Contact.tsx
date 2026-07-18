import { SITE } from "../siteConfig";

export default function Contact() {
  return (
    <main className="container" style={{ padding: "56px 20px 40px", maxWidth: 700 }}>
      <p style={eyebrow}>Contact</p>
      <h1 style={{ fontSize: 42, margin: "8px 0 24px" }}>Get in touch</h1>
      <div style={{ color: "var(--text)", lineHeight: 1.7, fontSize: 17 }}>
        <p>Questions, partnerships, press, or just want to talk about the music? Reach out.</p>
        <p style={{ marginTop: 18 }}>
          <a href={`mailto:${SITE.contactEmail}`} style={{ color: "var(--sunset)", fontWeight: 700, fontSize: 20 }}>{SITE.contactEmail}</a>
        </p>
      </div>
    </main>
  );
}
const eyebrow: React.CSSProperties = { textTransform: "uppercase", letterSpacing: "0.16em", fontSize: 12, fontWeight: 700, color: "var(--sunset)", margin: 0 };
