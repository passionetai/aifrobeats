import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Comment, getComments, postComment, deleteComment } from "../lib/api";
import { useAuth } from "../context/AuthContext";

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso + "Z").getTime()) / 1000);
  if (isNaN(s)) return "";
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export default function CommentSection({ trackId }: { trackId: string }) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { getComments(trackId).then(setComments); }, [trackId]);

  async function submit() {
    const text = body.trim();
    if (!text || busy) return;
    setBusy(true);
    const res = await postComment(trackId, text);
    setBusy(false);
    if (res.ok && res.comment) {
      setComments((cur) => [res.comment!, ...(cur ?? [])]);
      setBody("");
    }
  }

  async function remove(id: string) {
    const ok = await deleteComment(id);
    if (ok) setComments((cur) => (cur ?? []).filter((c) => c.id !== id));
  }

  return (
    <section style={{ marginTop: 44 }}>
      <h2 style={{ fontSize: 22, margin: "0 0 16px" }}>Discussion</h2>

      {user ? (
        <div style={{ display: "flex", gap: 10, marginBottom: 22 }}>
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Say something about this track"
            maxLength={1000}
            style={{ flex: 1, padding: "12px 14px", background: "var(--bg-elev)", border: "1px solid var(--line)", borderRadius: "var(--radius)", color: "var(--text)", fontSize: 15 }}
          />
          <button onClick={submit} disabled={busy} style={{ border: "none", background: "var(--sunset)", color: "#0B0B14", fontWeight: 700, padding: "0 20px", borderRadius: "var(--radius)", cursor: "pointer", opacity: busy ? 0.6 : 1 }}>
            Post
          </button>
        </div>
      ) : (
        <p style={{ color: "var(--text-dim)", marginBottom: 22 }}>
          <Link to="/login" style={{ color: "var(--sunset)", fontWeight: 700 }}>Sign in</Link> to join the discussion.
        </p>
      )}

      {comments === null && <p style={{ color: "var(--text-dim)" }}>Loading...</p>}
      {comments && comments.length === 0 && <p style={{ color: "var(--text-dim)" }}>No comments yet. Be the first.</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {comments && comments.map((c) => (
          <div key={c.id} style={{ display: "flex", gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: "var(--bg-elev-2)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "var(--sunset)", flexShrink: 0 }}>
              {c.display_name.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13 }}>
                <Link to={`/u/${c.handle}`} style={{ fontWeight: 700 }}>{c.display_name}</Link>
                <span style={{ color: "var(--text-dim)" }}> · {timeAgo(c.created_at)}</span>
                {user && (user.handle === c.handle || user.role === "admin") && (
                  <button onClick={() => remove(c.id)} style={{ marginLeft: 10, background: "none", border: "none", color: "var(--text-dim)", cursor: "pointer", fontSize: 12 }}>delete</button>
                )}
              </div>
              <div style={{ marginTop: 3 }}>{c.body}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
