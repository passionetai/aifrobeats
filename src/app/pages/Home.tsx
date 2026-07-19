import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Track, listTracks, ChartEntry, getChart, coverUrl, getTrack, RequestItem, listRequests } from "../lib/api";
import TrackCard from "../components/TrackCard";
import VoteButton from "../components/VoteButton";
import EmailSignup from "../components/EmailSignup";
import { usePlayer } from "../context/PlayerContext";

interface RotItem { id: string; title: string; artist: string; dur: number }

export default function Home() {
  const [tracks, setTracks] = useState<Track[] | null>(null);
  const [chart, setChart] = useState<ChartEntry[]>([]);
  const [radio, setRadio] = useState<{ title: string; artist: string; listeners: number } | null>(null);
  const [topRequest, setTopRequest] = useState<RequestItem | null>(null);
  const { play } = usePlayer();

  useEffect(() => {
    listTracks("new").then(setTracks).catch(() => setTracks([]));
    getChart().then((d) => setChart(d.entries.slice(0, 5))).catch(() => {});
    listRequests("open").then((d) => setTopRequest(d.requests[0] || null)).catch(() => {});
    fetch("/api/radio/now").then((r) => r.json()).then((d: any) => {
      const rot: RotItem[] = d.rotation || [];
      const total = rot.reduce((s, t) => s + t.dur, 0);
      if (total > 0) {
        let elapsed = ((((d.serverNow - d.anchor) % (total * 1000)) + total * 1000) % (total * 1000)) / 1000;
        let cur = rot[0];
        for (const t of rot) { if (elapsed < t.dur) { cur = t; break; } elapsed -= t.dur; }
        setRadio({ title: cur.title, artist: cur.artist, listeners: d.listeners || 0 });
      }
    }).catch(() => {});
  }, []);

  async function playChart(id: string) {
    const t = await getTrack(id);
    if (t) play(t);
  }

  return (
    <main>
      {/* HERO */}
      <section style={s.hero}>
        <div className="container">
          <p style={s.eyebrow}>AI-native Afrobeats, chosen by the crowd</p>
          <h1 style={s.h1}>The chart, the radio,<br />and the booth.</h1>
          <p style={s.sub}>Discover new drops, vote them up the Hot 100, and request the sound you want made next. This is where AI Afrobeats becomes a scene.</p>
          <div className="stack-sm" style={s.heroCtas}>
            <Link to="/chart" style={s.primary}>See the Hot 100</Link>
            <Link to="/live" style={s.secondary}>Tune into the radio</Link>
          </div>
        </div>
      </section>

      {/* LIVE RADIO STRIP */}
      {radio && (
        <section className="container" style={{ paddingTop: 32 }}>
          <Link to="/live" style={s.radioStrip}>
            <span style={s.livePulse} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={s.radioLabel}>LIVE NOW · {radio.listeners} listening</div>
              <div style={s.radioTrack}>{radio.title} <span style={{ color: "var(--text-dim)" }}>· {radio.artist}</span></div>
            </div>
            <span style={s.joinBtn}>Join the room →</span>
          </Link>
        </section>
      )}

      {/* HOT 100 PREVIEW */}
      {chart.length > 0 && (
        <section className="container" style={s.section}>
          <div style={s.sectionHead}>
            <h2 style={s.h2}>Hot right now</h2>
            <Link to="/chart" style={s.seeAll}>Full chart →</Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {chart.map((e) => (
              <div key={e.track_id} style={s.chartRow}>
                <span style={{ ...s.rank, color: e.position === 1 ? "var(--gold)" : "var(--text)" }}>{e.position}</span>
                <img src={coverUrl(e.track_id)} alt="" style={s.chartCover} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link to={`/track/${e.track_id}`} style={s.chartTitle}>{e.title}</Link>
                  <div style={s.chartArtist}>{e.artist}</div>
                </div>
                <VoteButton trackId={e.track_id} score={e.score} />
                <button onClick={() => playChart(e.track_id)} style={s.playMini} aria-label="Play">►</button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* REQUEST BOOTH TEASER */}
      <section className="container" style={s.section}>
        <Link to="/booth" style={s.boothCard}>
          <div>
            <div style={s.boothLabel}>THE REQUEST BOOTH</div>
            <div style={s.boothTitle}>Shape what gets made next</div>
            <p style={s.boothText}>
              {topRequest
                ? `Top request right now: "${topRequest.title}" with ${topRequest.vote_count} votes.`
                : "Ask for the sound you want to hear. When a request wins, that drop gets made and credited to you."}
            </p>
          </div>
          <span style={s.joinBtn}>Open the booth →</span>
        </Link>
      </section>

      {/* NEW DROPS */}
      <section className="container" style={s.section}>
        <h2 style={s.h2}>New drops</h2>
        {tracks === null && <p style={s.dim}>Loading...</p>}
        {tracks && tracks.length === 0 && <p style={s.dim}>No tracks yet.</p>}
        {tracks && tracks.length > 0 && (
          <div style={s.grid}>{tracks.map((t) => <TrackCard key={t.id} track={t} />)}</div>
        )}
      </section>

      {/* JOIN CTA */}
      <section className="container" style={{ ...s.section, paddingBottom: 20 }}>
        <div style={s.joinCta}>
          <h2 style={{ fontSize: 26, margin: "0 0 8px" }}>Never miss a drop</h2>
          <p style={{ color: "var(--text-dim)", marginTop: 0, marginBottom: 18 }}>Get an email the moment new tracks land and requests win.</p>
          <EmailSignup />
        </div>
      </section>
    </main>
  );
}

const s: Record<string, React.CSSProperties> = {
  hero: { padding: "72px 0 48px", background: "radial-gradient(1200px 500px at 70% -10%, rgba(255,106,43,0.18), transparent 60%)", borderBottom: "1px solid var(--line)" },
  eyebrow: { textTransform: "uppercase", letterSpacing: "0.16em", fontSize: 12, fontWeight: 700, color: "var(--sunset)", margin: 0 },
  h1: { fontSize: "clamp(38px, 7vw, 68px)", lineHeight: 1.03, margin: "16px 0 18px" },
  sub: { maxWidth: 560, color: "var(--text-dim)", fontSize: 17, margin: 0 },
  heroCtas: { display: "flex", gap: 12, marginTop: 28 },
  primary: { background: "var(--sunset)", color: "#0B0B14", fontWeight: 700, padding: "13px 22px", borderRadius: "var(--radius)", textAlign: "center" },
  secondary: { border: "1px solid var(--line)", color: "var(--text)", fontWeight: 600, padding: "13px 22px", borderRadius: "var(--radius)", textAlign: "center" },
  section: { paddingTop: 44 },
  sectionHead: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 18 },
  h2: { fontSize: 24, margin: 0 },
  seeAll: { color: "var(--sunset)", fontWeight: 700, fontSize: 14 },
  dim: { color: "var(--text-dim)" },
  radioStrip: { display: "flex", alignItems: "center", gap: 14, background: "linear-gradient(90deg, rgba(255,106,43,0.14), var(--bg-elev))", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: "14px 18px" },
  livePulse: { width: 10, height: 10, borderRadius: "50%", background: "var(--up)", boxShadow: "0 0 0 4px rgba(53,208,127,0.2)", flexShrink: 0 },
  radioLabel: { fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "var(--sunset)" },
  radioTrack: { fontWeight: 700, fontSize: 16, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 2 },
  joinBtn: { color: "var(--sunset)", fontWeight: 700, fontSize: 14, whiteSpace: "nowrap" },
  chartRow: { display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", borderRadius: "var(--radius)", background: "var(--bg-elev)" },
  rank: { fontFamily: "var(--font-display)", fontSize: 18, width: 26, textAlign: "center" },
  chartCover: { width: 46, height: 46, borderRadius: 8, objectFit: "cover", background: "var(--bg-elev-2)" },
  chartTitle: { fontWeight: 700, fontSize: 15 },
  chartArtist: { color: "var(--text-dim)", fontSize: 13 },
  playMini: { width: 38, height: 38, borderRadius: "50%", border: "none", background: "var(--sunset)", color: "#0B0B14", cursor: "pointer", flexShrink: 0 },
  boothCard: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, background: "var(--bg-elev)", border: "1px solid var(--line)", borderRadius: "var(--radius-lg)", padding: "24px 22px" },
  boothLabel: { fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", color: "var(--sunset)" },
  boothTitle: { fontFamily: "var(--font-display)", fontSize: 24, margin: "8px 0 6px" },
  boothText: { color: "var(--text-dim)", fontSize: 15, margin: 0, maxWidth: 460 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 20 },
  joinCta: { background: "var(--bg-elev)", border: "1px solid var(--line)", borderRadius: "var(--radius-lg)", padding: "30px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" },
};
