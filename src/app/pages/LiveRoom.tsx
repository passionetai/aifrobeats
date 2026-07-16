import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface RotItem { id: string; title: string; artist: string; dur: number }
interface ChatMsg { handle: string; text: string; key: number }
interface Burst { emoji: string; key: number; x: number }

const REACTIONS = ["🔥", "❤️", "🕺", "💯", "🙌"];

export default function LiveRoom() {
  const { user } = useAuth();
  const audioRef = useRef<HTMLAudioElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const rotationRef = useRef<RotItem[]>([]);
  const anchorRef = useRef<number>(Date.now());
  const offsetRef = useRef<number>(0); // serverNow - clientNow
  const timerRef = useRef<number | null>(null);

  const [listeners, setListeners] = useState(0);
  const [now, setNow] = useState<RotItem | null>(null);
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [tunedIn, setTunedIn] = useState(false);
  const [msg, setMsg] = useState("");
  const [hasRotation, setHasRotation] = useState(false);

  const compute = useCallback(() => {
    const rot = rotationRef.current;
    const total = rot.reduce((s, t) => s + t.dur, 0);
    if (total <= 0) return null;
    const clockNow = Date.now() + offsetRef.current;
    let elapsed = ((((clockNow - anchorRef.current) % (total * 1000)) + total * 1000) % (total * 1000)) / 1000;
    for (const t of rot) {
      if (elapsed < t.dur) return { track: t, offset: elapsed };
      elapsed -= t.dur;
    }
    return { track: rot[0], offset: 0 };
  }, []);

  const advance = useCallback(() => {
    const cur = compute();
    if (!cur) { setNow(null); return; }
    setNow(cur.track);
    const el = audioRef.current;
    if (el && tunedIn) {
      const wantSrc = `/api/tracks/${cur.track.id}/audio`;
      if (!el.src.endsWith(wantSrc)) {
        el.src = wantSrc;
        el.currentTime = cur.offset;
        el.play().catch(() => {});
      }
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    const remaining = (cur.track.dur - cur.offset) * 1000 + 250;
    timerRef.current = window.setTimeout(advance, remaining);
  }, [compute, tunedIn]);

  // Connect the websocket once.
  useEffect(() => {
    const proto = location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(`${proto}://${location.host}/api/radio/ws`);
    wsRef.current = ws;

    ws.onmessage = (ev) => {
      let data: any;
      try { data = JSON.parse(ev.data); } catch { return; }
      if (data.type === "sync") {
        rotationRef.current = data.rotation || [];
        anchorRef.current = data.anchor;
        offsetRef.current = data.serverNow - Date.now();
        setListeners(data.listeners ?? 0);
        setHasRotation((data.rotation || []).length > 0);
        advance();
      } else if (data.type === "listeners") {
        setListeners(data.count ?? 0);
      } else if (data.type === "chat") {
        setChat((c) => [...c.slice(-40), { handle: data.handle, text: data.text, key: Date.now() + Math.random() }]);
      } else if (data.type === "reaction") {
        const key = Date.now() + Math.random();
        setBursts((b) => [...b, { emoji: data.emoji, key, x: 10 + Math.random() * 80 }]);
        setTimeout(() => setBursts((b) => b.filter((x) => x.key !== key)), 2600);
      }
    };

    return () => { ws.close(); if (timerRef.current) clearTimeout(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function tuneIn() {
    setTunedIn(true);
    const el = audioRef.current;
    const cur = compute();
    if (el && cur) {
      el.src = `/api/tracks/${cur.track.id}/audio`;
      el.currentTime = cur.offset;
      el.play().catch(() => {});
      setNow(cur.track);
    }
    setTimeout(advance, 50);
  }

  function send() {
    const text = msg.trim();
    if (!text || !wsRef.current) return;
    wsRef.current.send(JSON.stringify({ type: "chat", text }));
    setMsg("");
  }

  function react(emoji: string) {
    wsRef.current?.send(JSON.stringify({ type: "reaction", emoji }));
  }

  async function loadRotation() {
    await fetch("/api/admin/radio/rotation", { method: "POST", credentials: "same-origin" });
  }

  return (
    <main className="container" style={{ padding: "40px 20px 110px", maxWidth: 820 }}>
      <style>{`@keyframes floatUp { 0%{transform:translateY(0);opacity:1} 100%{transform:translateY(-220px);opacity:0} }`}</style>

      <div style={styles.head}>
        <div>
          <p style={styles.eyebrow}>Live radio</p>
          <h1 style={{ fontSize: 40, margin: "6px 0 0" }}>The Room</h1>
        </div>
        <div style={styles.listeners}><span style={styles.dot} /> {listeners} listening</div>
      </div>

      <div style={styles.stage}>
        {now ? (
          <>
            <div style={styles.nowLabel}>NOW PLAYING</div>
            <div style={styles.nowTitle}>{now.title}</div>
            <div style={styles.nowArtist}>{now.artist}</div>
          </>
        ) : (
          <div style={{ color: "var(--text-dim)" }}>
            {hasRotation ? "Syncing..." : "The radio has no rotation yet."}
            {user?.role === "admin" && !hasRotation && (
              <div style={{ marginTop: 14 }}>
                <button onClick={loadRotation} style={styles.primary}>Load all tracks into radio</button>
              </div>
            )}
          </div>
        )}

        {!tunedIn && hasRotation && (
          <button onClick={tuneIn} style={{ ...styles.primary, marginTop: 20 }}>▶ Tune in</button>
        )}
        {user?.role === "admin" && hasRotation && (
          <button onClick={loadRotation} style={styles.refresh}>Refresh rotation</button>
        )}

        {bursts.map((b) => (
          <span key={b.key} style={{ position: "absolute", bottom: 20, left: `${b.x}%`, fontSize: 30, animation: "floatUp 2.6s ease-out forwards", pointerEvents: "none" }}>{b.emoji}</span>
        ))}
      </div>

      <div style={styles.reactRow}>
        {REACTIONS.map((e) => (
          <button key={e} onClick={() => react(e)} style={styles.reactBtn} disabled={!user} title={user ? "" : "Sign in to react"}>{e}</button>
        ))}
      </div>

      <div style={styles.chatBox}>
        <div style={styles.chatList}>
          {chat.length === 0 && <p style={{ color: "var(--text-dim)", fontSize: 14 }}>Chat is quiet. Say hello.</p>}
          {chat.map((m) => (
            <div key={m.key} style={{ fontSize: 14, marginBottom: 6 }}>
              <span style={{ color: "var(--sunset)", fontWeight: 700 }}>@{m.handle}</span> {m.text}
            </div>
          ))}
        </div>
        {user ? (
          <div className="stack-sm" style={{ display: "flex", gap: 8 }}>
            <input value={msg} onChange={(e) => setMsg(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Message the room" maxLength={300} style={styles.chatInput} />
            <button onClick={send} style={styles.sendBtn}>Send</button>
          </div>
        ) : (
          <p style={{ color: "var(--text-dim)", fontSize: 14 }}><Link to="/login" style={{ color: "var(--sunset)", fontWeight: 700 }}>Sign in</Link> to chat and react.</p>
        )}
      </div>

      <audio ref={audioRef} hidden />
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  head: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 },
  eyebrow: { textTransform: "uppercase", letterSpacing: "0.16em", fontSize: 12, fontWeight: 700, color: "var(--sunset)", margin: 0 },
  listeners: { display: "flex", alignItems: "center", gap: 8, color: "var(--text-dim)", fontWeight: 600 },
  dot: { width: 9, height: 9, borderRadius: "50%", background: "var(--up)", display: "inline-block" },
  stage: { position: "relative", background: "radial-gradient(600px 260px at 50% 0%, rgba(255,106,43,0.16), transparent 70%)", border: "1px solid var(--line)", borderRadius: "var(--radius-lg)", padding: "48px 24px", textAlign: "center", minHeight: 180, overflow: "hidden" },
  nowLabel: { textTransform: "uppercase", letterSpacing: "0.16em", fontSize: 11, fontWeight: 700, color: "var(--text-dim)" },
  nowTitle: { fontFamily: "var(--font-display)", fontSize: 32, margin: "10px 0 4px" },
  nowArtist: { color: "var(--text-dim)" },
  primary: { border: "none", background: "var(--sunset)", color: "#0B0B14", fontWeight: 700, fontSize: 16, padding: "13px 28px", borderRadius: "var(--radius)", cursor: "pointer" },
  refresh: { display: "block", margin: "16px auto 0", background: "none", border: "1px solid var(--line)", color: "var(--text-dim)", padding: "8px 14px", borderRadius: "var(--radius)", cursor: "pointer", fontSize: 13 },
  reactRow: { display: "flex", gap: 10, justifyContent: "center", marginTop: 20 },
  reactBtn: { fontSize: 22, background: "var(--bg-elev)", border: "1px solid var(--line)", borderRadius: 999, width: 52, height: 52, cursor: "pointer" },
  chatBox: { marginTop: 26, background: "var(--bg-elev)", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: 16 },
  chatList: { maxHeight: 260, overflowY: "auto", marginBottom: 12 },
  chatInput: { flex: 1, padding: "11px 14px", background: "var(--bg)", border: "1px solid var(--line)", borderRadius: "var(--radius)", color: "var(--text)", fontSize: 15 },
  sendBtn: { border: "none", background: "var(--sunset)", color: "#0B0B14", fontWeight: 700, padding: "0 20px", borderRadius: "var(--radius)", cursor: "pointer" },
};
