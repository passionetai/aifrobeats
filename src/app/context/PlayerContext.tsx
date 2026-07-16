import { createContext, useContext, useRef, useState, useCallback, ReactNode } from "react";
import { Track, audioUrl, markPlay } from "../lib/api";

interface PlayerState {
  current: Track | null;
  playing: boolean;
  play: (track: Track) => void;
  toggle: () => void;
  audioRef: React.RefObject<HTMLAudioElement>;
}

const Ctx = createContext<PlayerState | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [current, setCurrent] = useState<Track | null>(null);
  const [playing, setPlaying] = useState(false);

  const play = useCallback((track: Track) => {
    const el = audioRef.current;
    if (!el) return;
    if (current?.id !== track.id) {
      setCurrent(track);
      el.src = audioUrl(track.id);
      markPlay(track.id);
    }
    el.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }, [current]);

  const toggle = useCallback(() => {
    const el = audioRef.current;
    if (!el || !current) return;
    if (el.paused) el.play().then(() => setPlaying(true)).catch(() => {});
    else { el.pause(); setPlaying(false); }
  }, [current]);

  return (
    <Ctx.Provider value={{ current, playing, play, toggle, audioRef }}>
      {children}
      <audio
        ref={audioRef}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        hidden
      />
    </Ctx.Provider>
  );
}

export function usePlayer(): PlayerState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePlayer must be used inside PlayerProvider");
  return ctx;
}
