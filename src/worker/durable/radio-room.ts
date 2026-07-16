// RadioRoom Durable Object (Phase 3).
// One shared radio timeline. Every listener derives "what is playing now" from
// the same rotation + anchor time, so everyone hears the same track at the same
// moment. The room also relays live chat and reactions. Uses the WebSocket
// Hibernation API so it costs nothing while idle.
import type { Env } from "../env";

interface RotItem { id: string; title: string; artist: string; dur: number }

export class RadioRoom {
  private state: DurableObjectState;
  private env: Env;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);

    if (req.headers.get("Upgrade") === "websocket") {
      const pair = new WebSocketPair();
      const client = pair[0];
      const server = pair[1];
      const handle = req.headers.get("x-handle") || "";
      this.state.acceptWebSocket(server);
      server.serializeAttachment({ handle });
      server.send(JSON.stringify(await this.syncPayload()));
      this.broadcastListeners();
      return new Response(null, { status: 101, webSocket: client });
    }

    if (url.pathname.endsWith("/now")) {
      return Response.json(await this.syncPayload());
    }

    if (url.pathname.endsWith("/rotation") && req.method === "POST") {
      const body = await req.json<{ rotation: RotItem[] }>().catch(() => ({ rotation: [] as RotItem[] }));
      await this.state.storage.put("rotation", body.rotation || []);
      await this.state.storage.put("anchor", Date.now());
      this.broadcast(JSON.stringify(await this.syncPayload()));
      return Response.json({ ok: true, count: (body.rotation || []).length });
    }

    return new Response("not found", { status: 404 });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    let data: { type?: string; text?: string; emoji?: string };
    try { data = JSON.parse(typeof message === "string" ? message : ""); } catch { return; }
    const att = (ws.deserializeAttachment() || {}) as { handle?: string };

    if (data.type === "chat") {
      if (!att.handle) return; // must be signed in to chat
      const text = String(data.text || "").slice(0, 300).trim();
      if (!text) return;
      this.broadcast(JSON.stringify({ type: "chat", handle: att.handle, text }));
    } else if (data.type === "reaction") {
      const emoji = String(data.emoji || "").slice(0, 8);
      if (emoji) this.broadcast(JSON.stringify({ type: "reaction", emoji }));
    }
  }

  async webSocketClose() { this.broadcastListeners(); }
  async webSocketError() { this.broadcastListeners(); }

  private async syncPayload() {
    const rotation = ((await this.state.storage.get("rotation")) as RotItem[]) || [];
    const anchor = ((await this.state.storage.get("anchor")) as number) || Date.now();
    return { type: "sync", rotation, anchor, serverNow: Date.now(), listeners: this.state.getWebSockets().length };
  }

  private broadcast(str: string) {
    for (const ws of this.state.getWebSockets()) {
      try { ws.send(str); } catch { /* dropped */ }
    }
  }

  private broadcastListeners() {
    this.broadcast(JSON.stringify({ type: "listeners", count: this.state.getWebSockets().length }));
  }
}
