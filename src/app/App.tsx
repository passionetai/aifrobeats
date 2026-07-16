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
import LiveRoom from "./pages/LiveRoom";
import Playlists from "./pages/Playlists";
import PlaylistDetail from "./pages/PlaylistDetail";
import Profile from "./pages/Profile";
import Curators from "./pages/Curators";

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
              <Route path="/live" element={<LiveRoom />} />
              <Route path="/playlists" element={<Playlists />} />
              <Route path="/playlists/:id" element={<PlaylistDetail />} />
              <Route path="/curators" element={<Curators />} />
              <Route path="/u/:handle" element={<Profile />} />
              <Route path="*" element={<Soon title="Not found" phase="a later phase" />} />
            </Routes>
            <Player />
          </PlayerProvider>
        </VotesProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
