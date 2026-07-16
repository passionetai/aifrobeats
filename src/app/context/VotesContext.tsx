import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { fetchMyVotes, castVote } from "../lib/api";
import { useAuth } from "./AuthContext";

interface VotesState {
  voted: Set<string>;
  toggle: (trackId: string) => Promise<{ ok: boolean; error?: string }>;
  has: (trackId: string) => boolean;
}

const Ctx = createContext<VotesState | null>(null);

export function VotesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [voted, setVoted] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) fetchMyVotes().then((ids) => setVoted(new Set(ids)));
    else setVoted(new Set());
  }, [user]);

  const toggle = useCallback(async (trackId: string) => {
    const currentlyOn = voted.has(trackId);
    const next = new Set(voted);
    if (currentlyOn) next.delete(trackId); else next.add(trackId);
    setVoted(next); // optimistic

    const res = await castVote(trackId, !currentlyOn);
    if (!res.ok) {
      // roll back on failure
      const rolled = new Set(voted);
      setVoted(rolled);
      return { ok: false, error: res.error };
    }
    return { ok: true };
  }, [voted]);

  const has = useCallback((trackId: string) => voted.has(trackId), [voted]);

  return <Ctx.Provider value={{ voted, toggle, has }}>{children}</Ctx.Provider>;
}

export function useVotes(): VotesState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useVotes must be used inside VotesProvider");
  return ctx;
}
