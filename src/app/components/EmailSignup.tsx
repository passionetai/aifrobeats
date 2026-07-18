import { useState } from "react";
import { subscribeEmail } from "../lib/api";

export default function EmailSignup() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  async function go() {
    setErr("");
    const res = await subscribeEmail(email.trim());
    if (res.ok) setDone(true);
    else setErr(res.error || "Try again.");
  }

  if (done) return <p style={{ color: "var(--up)", margin: 0 }}>You're on the list. New drops incoming.</p>;

  return (
    <div>
      <div className="stack-sm" style={{ display: "flex", gap: 8, maxWidth: 420 }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && go()}
          placeholder="Your email for drop alerts"
          style={{ flex: 1, padding: "12px 14px", background: "var(--bg)", border: "1px solid var(--line)", borderRadius: "var(--radius)", color: "var(--text)", fontSize: 15 }}
        />
        <button onClick={go} style={{ border: "none", background: "var(--sunset)", color: "#0B0B14", fontWeight: 700, padding: "12px 20px", borderRadius: "var(--radius)", cursor: "pointer", whiteSpace: "nowrap" }}>
          Notify me
        </button>
      </div>
      {err && <p style={{ color: "var(--down)", fontSize: 13, marginTop: 8 }}>{err}</p>}
    </div>
  );
}
