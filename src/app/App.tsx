import { BrowserRouter, Routes, Route } from "react-router-dom";
import Nav from "./components/Nav";
import Player from "./components/Player";
import { PlayerProvider } from "./context/PlayerContext";
import { AuthProvider } from "./context/AuthContext";
import { VotesProvider } from "./context/VotesContext";
import Home from "./pages/Home";
import Chart from "./pages/Chart";
import TrackDetail from "./pages/TrackDetail";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import Onboard from "./pages/Onboard";
import RequestBooth from "./pages/RequestBooth";

function Soon({ title, phase }: { title: string; phase: string }) {
  return (
    <main className="container" style={{ padding: "72px 20px" }}>
      <h1 style={{ fontSize: 40, margin: "0 0 12px" }}>{title}</h1>
      <p style={{ color: "var(--text-dim)" }}>Arrives in {phase}.</p>
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <VotesProvider>
          <PlayerProvider>
            <Nav />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/chart" element={<Chart />} />
              <Route path="/track/:id" element={<TrackDetail />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/login" element={<Login />} />
              <Route path="/onboard" element={<Onboard />} />
              <Route path="/booth" element={<RequestBooth />} />
              <Route path="/live" element={<Soon title="Live Room" phase="Phase 3" />} />
              <Route path="/curators" element={<Soon title="Curators" phase="Phase 4" />} />
              <Route path="/u/:handle" element={<Soon title="Profiles" phase="Phase 4" />} />
              <Route path="*" element={<Soon title="Not found" phase="a later phase" />} />
            </Routes>
            <Player />
          </PlayerProvider>
        </VotesProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
