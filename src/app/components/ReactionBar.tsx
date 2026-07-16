import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Reactions, getReactions, toggleReaction } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function ReactionBar({ trackId }: { trackId: string }) {
  const { user } = useAuth();
  const nav = useNavigate();
  const [data, setData] = useState<Reactions | null>(null);

  useEffect(() => { getReactions(trackId).then(setData); }, [trackId]);

  if (!data) return null;

  async function tap(emoji: string) {
    if (!user) { nav("/login"); return; }
    if (!data) return;
    const on = data.mine.includes(emoji);
    // optimistic
    const counts = { ...data.counts, [emoji]: Math.max(0, (data.counts[emoji] || 0) + (on ? -1 : 1)) };
    const mine = on ? data.mine.filter((e) => e !== emoji) : [...data.mine, emoji];
    setData({ ...data, counts, mine });
    const res = await toggleReaction(trackId, emoji);
    if (!res.ok) getReactions(trackId).then(setData); // resync on failure
  }

  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20 }}>
      {data.palette.map((emoji) => {
        const on = data.mine.includes(emoji);
        const count = data.counts[emoji] || 0;
        return (
          <button
            key={emoji}
            onClick={() => tap(emoji)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              border: on ? "1px solid var(--sunset)" : "1px solid var(--line)",
              background: on ? "rgba(255,106,43,0.14)" : "var(--bg-elev)",
              borderRadius: 999,
              padding: "8px 14px",
              fontSize: 15,
              cursor: "pointer",
              color: "var(--text)",
            }}
          >
            <span>{emoji}</span>
            {count > 0 && <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-dim)" }}>{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
