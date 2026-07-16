import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { updateProfile } from "../lib/auth";

export default function Onboard() {
  const { user, loading, refresh } = useAuth();
  const nav = useNavigate();
  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) nav("/login");
    if (user) {
      setHandle(user.handle);
      setDisplayName(user.display_name);
    }
  }, [user, loading, nav]);

  async function save() {
    if (busy) return;
    setBusy(true); setErr(null);
    const res = await updateProfile({ handle, display_name: displayName });
    setBusy(false);
    if (res.ok) { await refresh(); nav("/"); }
    else setErr(res.error || "Could not save.");
  }

  return (
    <main className="container" style={{ padding: "72px 20px 110px", maxWidth: 460 }}>
      <p style={styles.eyebrow}>Welcome in</p>
      <h1 style={{ fontSize: 40, margin: "6px 0 8px" }}>Set up your profile</h1>
      <p style={{ color: "var(--text-dim)", marginTop: 0 }}>
        Pick a handle and a display name. You can change these later.
      </p>

      <label style={styles.label}>Handle
        <div style={styles.handleWrap}>
          <span style={styles.at}>@</span>
          <input value={handle} onChange={(e) => setHandle(e.target.value)} style={styles.handleInput} />
        </div>
      </label>
      <label style={styles.label}>Display name
        <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} style={styles.input} />
      </label>

      <button onClick={save} disabled={busy} style={{ ...styles.btn, opacity: busy ? 0.6 : 1 }}>
        {busy ? "Saving..." : "Enter Aifrobeats"}
      </button>
      {err && <p style={{ color: "var(--down)", marginTop: 14 }}>{err}</p>}
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  eyebrow: { textTransform: "uppercase", letterSpacing: "0.14em", fontSize: 12, fontWeight: 700, color: "var(--sunset)", margin: 0 },
  label: { display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-dim)", marginTop: 18 },
  input: { display: "block", width: "100%", marginTop: 6, padding: "13px 15px", background: "var(--bg-elev)", border: "1px solid var(--line)", borderRadius: "var(--radius)", color: "var(--text)", fontSize: 16 },
  handleWrap: { display: "flex", alignItems: "center", marginTop: 6, background: "var(--bg-elev)", border: "1px solid var(--line)", borderRadius: "var(--radius)", paddingLeft: 14 },
  at: { color: "var(--text-dim)", fontSize: 16 },
  handleInput: { flex: 1, padding: "13px 12px", background: "transparent", border: "none", color: "var(--text)", fontSize: 16, outline: "none" },
  btn: { width: "100%", marginTop: 26, border: "none", background: "var(--sunset)", color: "#0B0B14", fontWeight: 700, fontSize: 16, padding: "14px", borderRadius: "var(--radius)", cursor: "pointer" },
};
