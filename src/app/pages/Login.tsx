import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { requestLink } from "../lib/auth";

const errorText: Record<string, string> = {
  invalid: "That link was not valid. Request a new one below.",
  used: "That link was already used. Request a fresh one.",
  expired: "That link expired. Request a new one below.",
};

export default function Login() {
  const [params] = useSearchParams();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(params.get("error") ? (errorText[params.get("error")!] || "Something went wrong.") : null);

  async function submit() {
    if (busy) return;
    setBusy(true); setErr(null);
    const res = await requestLink(email.trim());
    setBusy(false);
    if (res.ok) setSent(true);
    else setErr(res.error || "Could not send the link.");
  }

  return (
    <main className="container" style={{ padding: "72px 20px 110px", maxWidth: 460 }}>
      <h1 style={{ fontSize: 40, margin: "0 0 8px" }}>Sign in</h1>
      <p style={{ color: "var(--text-dim)", marginTop: 0 }}>
        No passwords. Enter your email and we send you a one-tap sign-in link.
      </p>

      {sent ? (
        <div style={styles.card}>
          <p style={{ margin: 0, fontWeight: 700 }}>Check your email.</p>
          <p style={{ color: "var(--text-dim)", marginBottom: 0 }}>
            We sent a sign-in link to {email}. It expires in 15 minutes.
          </p>
        </div>
      ) : (
        <>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="you@email.com"
            style={styles.input}
          />
          <button onClick={submit} disabled={busy} style={{ ...styles.btn, opacity: busy ? 0.6 : 1 }}>
            {busy ? "Sending..." : "Send my sign-in link"}
          </button>
        </>
      )}
      {err && <p style={{ color: "var(--down)", marginTop: 14 }}>{err}</p>}
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  input: { width: "100%", padding: "14px 16px", background: "var(--bg-elev)", border: "1px solid var(--line)", borderRadius: "var(--radius)", color: "var(--text)", fontSize: 16, marginTop: 8 },
  btn: { width: "100%", marginTop: 14, border: "none", background: "var(--sunset)", color: "#0B0B14", fontWeight: 700, fontSize: 16, padding: "14px", borderRadius: "var(--radius)", cursor: "pointer" },
  card: { background: "var(--bg-elev)", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: "22px 20px", marginTop: 8 },
};
