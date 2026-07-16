// Streams an R2 object with HTTP range support so the browser audio player
// can seek. Returns 206 Partial Content for range requests, 200 otherwise.
export async function streamObject(
  bucket: R2Bucket,
  key: string,
  rangeHeader: string | null
): Promise<Response> {
  // No range: send the whole object.
  if (!rangeHeader) {
    const obj = await bucket.get(key);
    if (!obj) return new Response("not found", { status: 404 });
    const headers = baseHeaders(obj);
    headers.set("Content-Length", String(obj.size));
    return new Response(obj.body, { status: 200, headers });
  }

  // Parse "bytes=start-end".
  const match = /bytes=(\d*)-(\d*)/.exec(rangeHeader);
  if (!match) {
    const obj = await bucket.get(key);
    if (!obj) return new Response("not found", { status: 404 });
    return new Response(obj.body, { status: 200, headers: baseHeaders(obj) });
  }

  // First fetch just the head to learn the total size.
  const head = await bucket.head(key);
  if (!head) return new Response("not found", { status: 404 });
  const total = head.size;

  const startStr = match[1];
  const endStr = match[2];
  let start: number;
  let end: number;

  if (startStr === "") {
    // suffix range: last N bytes
    const suffix = parseInt(endStr, 10);
    start = Math.max(0, total - suffix);
    end = total - 1;
  } else {
    start = parseInt(startStr, 10);
    end = endStr === "" ? total - 1 : Math.min(parseInt(endStr, 10), total - 1);
  }

  if (isNaN(start) || start > end || start >= total) {
    return new Response("range not satisfiable", {
      status: 416,
      headers: { "Content-Range": `bytes */${total}` },
    });
  }

  const length = end - start + 1;
  const obj = await bucket.get(key, { range: { offset: start, length } });
  if (!obj) return new Response("not found", { status: 404 });

  const headers = baseHeaders(obj);
  headers.set("Content-Range", `bytes ${start}-${end}/${total}`);
  headers.set("Content-Length", String(length));
  return new Response(obj.body, { status: 206, headers });
}

function baseHeaders(obj: R2Object): Headers {
  const headers = new Headers();
  const ct = obj.httpMetadata?.contentType;
  headers.set("Content-Type", ct || "application/octet-stream");
  headers.set("Accept-Ranges", "bytes");
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  return headers;
}

export function extensionOf(filename: string, fallback: string): string {
  const dot = filename.lastIndexOf(".");
  if (dot === -1) return fallback;
  const ext = filename.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "");
  return ext || fallback;
}
