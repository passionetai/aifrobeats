import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useVotes } from "../context/VotesContext";

export default function VoteButton({ trackId, score }: { trackId: string; score: number }) {
  const { user } = useAuth();
  const { has, toggle } = useVotes();
  const nav = useNavigate();
  const [count, setCount] = useState(score);
  const on = has(trackId);

  async function click() {
    if (!user) { nav("/login"); return; }
    // optimistic count nudge
    setCount((c) => (on ? Math.max(0, c - 1) : c + 1));
    const res = await toggle(trackId);
    if (!res.ok) setCount(score); // roll back
  }

  return (
    <button
      onClick={click}
      aria-pressed={on}
      title={on ? "Remove your vote" : "Vote this up"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        border: on ? "1px solid var(--sunset)" : "1px solid var(--line)",
        background: on ? "rgba(255,106,43,0.14)" : "transparent",
        color: on ? "var(--sunset)" : "var(--text)",
        borderRadius: 999,
        padding: "7px 14px",
        fontWeight: 700,
        fontSize: 14,
        cursor: "pointer",
      }}
    >
      <span style={{ fontSize: 15 }}>{on ? "🔥" : "△"}</span>
      <span style={{ fontVariantNumeric: "tabular-nums" }}>{count}</span>
    </button>
  );
}
