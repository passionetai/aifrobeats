// RadioRoom Durable Object (Phase 3).
// Holds shared radio state so every listener hears the same track at the
// same moment. Uses the WebSocket Hibernation API so it is not billed while
// idle. NOT bound yet: enable the durable_objects block in wrangler.toml and
// export this class from src/worker/index.ts when you reach Phase 3.
import type { Env } from "../env";

interface NowPlaying {
  trackId: string;
  startedAt: number; // epoch ms, server clock, so clients can compute offset
  durationSec: number;
}

export class RadioRoom {
  private state: DurableObjectState;
  private env: Env;
  private current: NowPlaying | null = null;
  private queue: string[] = [];

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(req: Request): Promise<Response> {
    if (req.headers.get("Upgrade") === "websocket") {
      const pair = new WebSocketPair();
      // Hibernation-aware accept keeps the object cheap between messages.
      this.state.acceptWebSocket(pair[1]);
      this.sendState(pair[1]);
      this.broadcastListenerCount();
      return new Response(null, { status: 101, webSocket: pair[0] });
    }
    if (this.current) return Response.json(this.withOffset());
    return new Response("no track", { status: 404 });
  }

  async webSocketMessage(_ws: WebSocket, raw: string) {
    let data: { type?: string; text?: string; emoji?: string } = {};
    try { data = JSON.parse(raw); } catch { return; }
    if (data.type === "chat") this.broadcast({ type: "chat", text: data.text });
    if (data.type === "reaction") this.broadcast({ type: "reaction", emoji: data.emoji });
  }

  async webSocketClose() {
    this.broadcastListenerCount();
  }

  async alarm() {
    this.advance();
  }

  private advance() {
    const next = this.queue.shift();
    if (!next) return;
    this.queue.push(next); // simple round-robin
    // durationSec should come from the track record; placeholder here.
    this.current = { trackId: next, startedAt: Date.now(), durationSec: 180 };
    this.state.storage.setAlarm(Date.now() + this.current.durationSec * 1000);
    this.broadcast({ type: "track_change", ...this.withOffset() });
  }

  private withOffset() {
    if (!this.current) return null;
    const offsetSec = (Date.now() - this.current.startedAt) / 1000;
    return { ...this.current, offsetSec };
  }

  private sendState(ws: WebSocket) {
    if (this.current) ws.send(JSON.stringify({ type: "track_change", ...this.withOffset() }));
  }

  private broadcast(obj: unknown) {
    const msg = JSON.stringify(obj);
    for (const ws of this.state.getWebSockets()) {
      try { ws.send(msg); } catch { /* dropped socket */ }
    }
  }

  private broadcastListenerCount() {
    this.broadcast({ type: "listener_count", count: this.state.getWebSockets().length });
  }
}
