import type { Env } from "../env";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function template(bodyText: string, origin: string, email: string): string {
  const paragraphs = esc(bodyText).split(/\n{2,}/).map((p) => `<p style="margin:0 0 16px;line-height:1.6">${p.replace(/\n/g, "<br/>")}</p>`).join("");
  const unsub = `${origin}/api/subscribe/unsubscribe?e=${encodeURIComponent(email)}`;
  return `
  <div style="font-family:Inter,Arial,sans-serif;background:#0B0B14;color:#F5F3EF;padding:32px;border-radius:16px;max-width:520px;margin:auto">
    <div style="font-family:'Archivo Black',Arial,sans-serif;font-size:22px;margin-bottom:22px">AIFRO<span style="color:#FF6A2B">BEATS</span></div>
    <div style="font-size:16px;color:#F5F3EF">${paragraphs}</div>
    <div style="margin-top:26px"><a href="${origin}" style="display:inline-block;background:#FF6A2B;color:#0B0B14;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:12px">Open Aifrobeats</a></div>
    <p style="color:#A6A2B0;font-size:12px;margin-top:26px">You are getting this because you signed up for Aifrobeats drop alerts. <a href="${unsub}" style="color:#A6A2B0">Unsubscribe</a>.</p>
  </div>`;
}

// Sends a broadcast to all recipients via Resend's batch endpoint (100 per call).
export async function sendBroadcast(
  env: Env, origin: string, subject: string, bodyText: string, recipients: string[]
): Promise<{ sent: number; failed: number }> {
  if (!env.EMAIL_API_KEY) return { sent: 0, failed: recipients.length };
  const from = env.MAIL_FROM || "Aifrobeats <hello@aifrobeats.com>";
  let sent = 0, failed = 0;

  for (let i = 0; i < recipients.length; i += 100) {
    const chunk = recipients.slice(i, i + 100);
    const batch = chunk.map((email) => ({ from, to: email, subject, html: template(bodyText, origin, email) }));
    try {
      const res = await fetch("https://api.resend.com/emails/batch", {
        method: "POST",
        headers: { Authorization: `Bearer ${env.EMAIL_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify(batch),
      });
      if (res.ok) sent += chunk.length; else failed += chunk.length;
    } catch {
      failed += chunk.length;
    }
  }
  return { sent, failed };
}
