import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getSubscribers, sendBroadcast } from "../lib/api";

export default function Admin() {
  const { user, loading } = useAuth();
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("Aifrobeats");
  const [mood, setMood] = useState("");
  const [tags, setTags] = useState("");
  const [audio, setAudio] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  if (loading) return <main className="container" style={{ padding: "60px 20px" }}><p style={{ color: "var(--text-dim)" }}>Loading...</p></main>;

  if (!user) {
    return (
      <main className="container" style={{ padding: "72px 20px", maxWidth: 460 }}>
        <h1 style={{ fontSize: 34 }}>Owner access</h1>
        <p style={{ color: "var(--text-dim)" }}>Sign in with the owner account to upload.</p>
        <Link to="/login" style={styles.submit}>Sign in</Link>
      </main>
    );
  }
  if (user.role !== "admin") {
    return (
      <main className="container" style={{ padding: "72px 20px", maxWidth: 460 }}>
        <h1 style={{ fontSize: 34 }}>Not authorized</h1>
        <p style={{ color: "var(--text-dim)" }}>This page is owner-only.</p>
      </main>
    );
  }

  async function submit() {
    if (!title.trim()) return setMsg({ ok: false, text: "Title is required." });
    if (!audio) return setMsg({ ok: false, text: "Pick an audio file." });
    if (!cover) return setMsg({ ok: false, text: "Pick a cover image." });

    setBusy(true); setMsg(null);
    const form = new FormData();
    form.set("title", title.trim());
    form.set("artist", artist.trim() || "Aifrobeats");
    if (mood.trim()) form.set("mood", mood.trim());
    if (tags.trim()) form.set("tags", tags.trim());
    form.set("audio", audio);
    form.set("cover", cover);

    try {
      const res = await fetch("/api/admin/tracks", {
        method: "POST",
        credentials: "same-origin",
        body: form,
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; title?: string };
      if (res.ok && data.ok) {
        setMsg({ ok: true, text: `Uploaded "${data.title}". It is live on the site now.` });
        setTitle(""); setMood(""); setTags(""); setAudio(null); setCover(null);
      } else {
        setMsg({ ok: false, text: data.error || "Upload failed." });
      }
    } catch {
      setMsg({ ok: false, text: "Network error." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="container" style={{ padding: "48px 20px 110px", maxWidth: 620 }}>
      <h1 style={{ fontSize: 36, margin: "0 0 6px" }}>Upload a drop</h1>
      <p style={{ color: "var(--text-dim)", marginTop: 0 }}>Signed in as owner (@{user.handle}).</p>

      <label style={styles.label}>Title
        <input value={title} onChange={(e) => setTitle(e.target.value)} style={styles.input} />
      </label>
      <label style={styles.label}>Artist
        <input value={artist} onChange={(e) => setArtist(e.target.value)} style={styles.input} />
      </label>
      <div style={styles.two}>
        <label style={styles.label}>Mood
          <input value={mood} onChange={(e) => setMood(e.target.value)} style={styles.input} placeholder="amapiano" />
        </label>
        <label style={styles.label}>Tags
          <input value={tags} onChange={(e) => setTags(e.target.value)} style={styles.input} placeholder="detty-december, love" />
        </label>
      </div>
      <label style={styles.label}>Audio file (mp3)
        <input type="file" accept="audio/*" onChange={(e) => setAudio(e.target.files?.[0] || null)} style={styles.file} />
      </label>
      <label style={styles.label}>Cover image
        <input type="file" accept="image/*" onChange={(e) => setCover(e.target.files?.[0] || null)} style={styles.file} />
      </label>

      <button onClick={submit} disabled={busy} style={{ ...styles.submit, opacity: busy ? 0.6 : 1, display: "inline-block", border: "none", cursor: "pointer" }}>
        {busy ? "Uploading..." : "Upload drop"}
      </button>
      {msg && <p style={{ marginTop: 16, color: msg.ok ? "var(--up)" : "var(--down)" }}>{msg.text}</p>}

      <BroadcastPanel />
    </main>
  );
}

function BroadcastPanel() {
  const [count, setCount] = useState<number | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function loadCount() {
    const s = await getSubscribers();
    setCount(s.count);
  }
  useEffect(() => { loadCount(); }, []);

  async function blast() {
    if (!subject.trim() || !body.trim()) { setResult("Subject and message are required."); return; }
    if (!confirm(`Send this email to all ${count ?? ""} subscribers?`)) return;
    setBusy(true); setResult(null);
    const r = await sendBroadcast(subject.trim(), body.trim());
    setBusy(false);
    if (r.ok) { setResult(`Sent to ${r.sent} of ${r.total} subscribers.${r.failed ? ` ${r.failed} failed.` : ""}`); setSubject(""); setBody(""); }
    else setResult(r.error || "Failed to send.");
  }

  return (
    <section style={{ marginTop: 48, borderTop: "1px solid var(--line)", paddingTop: 32 }}>
      <h2 style={{ fontSize: 26, margin: "0 0 6px" }}>Email blast</h2>
      <p style={{ color: "var(--text-dim)", marginTop: 0 }}>
        Send an announcement to your drop-alert subscribers{count !== null ? ` (${count} on the list)` : ""}.
      </p>
      <label style={styles.label}>Subject
        <input value={subject} onChange={(e) => setSubject(e.target.value)} style={styles.input} maxLength={150} placeholder="New drop just landed" />
      </label>
      <label style={styles.label}>Message
        <textarea value={body} onChange={(e) => setBody(e.target.value)} style={{ ...styles.input, minHeight: 140, resize: "vertical", fontFamily: "inherit" }} maxLength={5000} placeholder="Write your announcement. Blank lines start new paragraphs." />
      </label>
      <button onClick={blast} disabled={busy} style={{ ...styles.submit, border: "none", cursor: "pointer", opacity: busy ? 0.6 : 1 }}>
        {busy ? "Sending..." : "Send to subscribers"}
      </button>
      {result && <p style={{ marginTop: 14, color: "var(--up)" }}>{result}</p>}
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  label: { display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-dim)", marginTop: 16 },
  input: { display: "block", width: "100%", marginTop: 6, padding: "12px 14px", background: "var(--bg-elev)", border: "1px solid var(--line)", borderRadius: "var(--radius)", color: "var(--text)", fontSize: 15 },
  file: { display: "block", marginTop: 6, color: "var(--text)" },
  two: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
  submit: { marginTop: 26, background: "var(--sunset)", color: "#0B0B14", fontWeight: 700, fontSize: 16, padding: "14px 26px", borderRadius: "var(--radius)", textDecoration: "none" },
};
