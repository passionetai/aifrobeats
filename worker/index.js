// Aifrobeats production Worker.
//
// The static site (HTML, CSS, JS, JSON, images) is served by the Workers
// static-assets binding, exactly as before. Because static assets are matched
// first, this Worker only runs for paths that are NOT static files, so a bug
// here can never take down the site.
//
// The one path it owns is /music/* . All audio lives in a PRIVATE R2 bucket
// (no public r2.dev URL). The only way to fetch a track is a same-origin
// request to /music/<key> coming from a page on this site. Hotlinks from other
// sites and direct address-bar hits carry no same-origin signal and are
// refused, so the MP3s cannot be downloaded by sharing or guessing a URL.

const ALLOWED_REFERER_HOSTS = new Set([
  "aifrobeats.com",
  "www.aifrobeats.com",
]);

// Decide whether a request is a genuine same-origin subresource fetch (i.e. an
// <audio> element on one of our own pages) rather than a hotlink or a direct
// hit on the file URL.
function isSameOriginRequest(request, url) {
  // Modern browsers send Fetch Metadata for subresource requests.
  const fetchSite = request.headers.get("Sec-Fetch-Site");
  if (fetchSite) return fetchSite === "same-origin";

  // Fallback for browsers without Fetch Metadata: trust a matching Referer.
  const referer = request.headers.get("Referer");
  if (referer) {
    try {
      const refHost = new URL(referer).host;
      return refHost === url.host || ALLOWED_REFERER_HOSTS.has(refHost);
    } catch (e) {
      return false;
    }
  }

  // No same-origin signal at all: treat as a direct hit and refuse.
  return false;
}

// Parse a single "bytes=start-end" Range header against the object size.
// Returns { offset, length, start, end } or null when unsatisfiable.
function parseRange(rangeHeader, size) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader || "");
  if (!match) return null;

  const hasStart = match[1] !== "";
  const hasEnd = match[2] !== "";
  if (!hasStart && !hasEnd) return null;

  let start;
  let end;
  if (!hasStart) {
    // Suffix range: the last N bytes.
    const suffix = parseInt(match[2], 10);
    if (suffix <= 0) return null;
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = parseInt(match[1], 10);
    end = hasEnd ? parseInt(match[2], 10) : size - 1;
    if (end >= size) end = size - 1;
  }

  if (start > end || start >= size || start < 0) return null;
  return { offset: start, length: end - start + 1, start, end };
}

async function serveAudio(request, env, url) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  if (!isSameOriginRequest(request, url)) {
    return new Response("Forbidden", { status: 403 });
  }

  // /music/<key...>  ->  R2 object key "music/<key...>"
  const key = decodeURIComponent(url.pathname.replace(/^\/+/, ""));
  if (!key.startsWith("music/") || key.includes("..")) {
    return new Response("Not Found", { status: 404 });
  }

  const rangeHeader = request.headers.get("Range");
  const headers = new Headers();
  let object;
  let status = 200;

  if (rangeHeader) {
    const head = await env.AUDIO_BUCKET.head(key);
    if (!head) return new Response("Not Found", { status: 404 });

    const range = parseRange(rangeHeader, head.size);
    if (!range) {
      return new Response("Range Not Satisfiable", {
        status: 416,
        headers: { "Content-Range": `bytes */${head.size}`, "Accept-Ranges": "bytes" },
      });
    }

    object = await env.AUDIO_BUCKET.get(key, {
      range: { offset: range.offset, length: range.length },
    });
    if (!object) return new Response("Not Found", { status: 404 });

    object.writeHttpMetadata(headers);
    status = 206;
    headers.set("Content-Range", `bytes ${range.start}-${range.end}/${head.size}`);
    headers.set("Content-Length", String(range.length));
  } else {
    object = await env.AUDIO_BUCKET.get(key);
    if (!object) return new Response("Not Found", { status: 404 });

    object.writeHttpMetadata(headers);
    headers.set("Content-Length", String(object.size));
  }

  // Force the headers that matter for safe inline streaming, after the stored
  // R2 metadata has been written so these always win.
  headers.set("Content-Type", headers.get("Content-Type") || "audio/mpeg");
  headers.set("Accept-Ranges", "bytes");
  headers.set("Content-Disposition", "inline");
  headers.set("Cache-Control", "private, no-store");
  headers.set("X-Content-Type-Options", "nosniff");
  if (object.httpEtag) headers.set("ETag", object.httpEtag);

  const body = request.method === "HEAD" ? null : object.body;
  return new Response(body, { status, headers });
}

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      if (url.pathname.startsWith("/music/")) {
        return await serveAudio(request, env, url);
      }
    } catch (err) {
      // Never let audio handling affect the rest of the site.
    }
    return env.ASSETS.fetch(request);
  },
};
