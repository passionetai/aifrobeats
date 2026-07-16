import type { Context } from "hono";
import type { Env } from "../env";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Serves the SPA index.html for /track/:id but with track-specific Open Graph
// and Twitter tags injected, so shared links preview with cover art + title.
export async function trackMetaResponse(c: Context<{ Bindings: Env }>): Promise<Response> {
  const id = c.req.param("id");
  const origin = new URL(c.req.url).origin;

  const assetRes = await c.env.ASSETS.fetch(new Request(`${origin}/index.html`));
  let html = await assetRes.text();

  const track = await c.env.DB.prepare(
    "SELECT title, artist, mood FROM tracks WHERE id = ? AND status = 'live'"
  ).bind(id).first<{ title: string; artist: string; mood: string | null }>();

  if (track) {
    const title = `${track.title} — Aifrobeats`;
    const desc = `${track.artist}${track.mood ? " · " + track.mood : ""}. Stream and vote on Aifrobeats.`;
    const image = `${origin}/api/tracks/${id}/cover`;
    const tags = [
      `<meta property="og:type" content="music.song" />`,
      `<meta property="og:site_name" content="Aifrobeats" />`,
      `<meta property="og:title" content="${esc(title)}" />`,
      `<meta property="og:description" content="${esc(desc)}" />`,
      `<meta property="og:image" content="${image}" />`,
      `<meta property="og:url" content="${origin}/track/${id}" />`,
      `<meta name="twitter:card" content="summary_large_image" />`,
      `<meta name="twitter:title" content="${esc(title)}" />`,
      `<meta name="twitter:description" content="${esc(desc)}" />`,
      `<meta name="twitter:image" content="${image}" />`,
    ].join("\n    ");
    html = html.replace("</head>", `    ${tags}\n  </head>`);
    html = html.replace(/<title>.*?<\/title>/, `<title>${esc(title)}</title>`);
  }

  return c.html(html);
}
