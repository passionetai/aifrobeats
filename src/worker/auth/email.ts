import type { Env } from "../env";

export async function sendMagicLink(env: Env, to: string, link: string): Promise<boolean> {
  if (!env.EMAIL_API_KEY) {
    console.log("EMAIL_API_KEY not set; would have sent link:", link);
    return false;
  }
  const from = env.MAIL_FROM || "Aifrobeats <hello@aifrobeats.com>";

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;background:#0B0B14;color:#F5F3EF;padding:32px;border-radius:16px;max-width:480px;margin:auto">
      <div style="font-family:'Archivo Black',Arial,sans-serif;font-size:22px;margin-bottom:20px">
        AIFRO<span style="color:#FF6A2B">BEATS</span>
      </div>
      <h1 style="font-size:22px;margin:0 0 12px">Your sign-in link</h1>
      <p style="color:#A6A2B0;margin:0 0 24px">
        Tap the button to sign in. This link works once and expires in 15 minutes.
      </p>
      <a href="${link}" style="display:inline-block;background:#FF6A2B;color:#0B0B14;font-weight:700;text-decoration:none;padding:14px 24px;border-radius:12px">
        Sign in to Aifrobeats
      </a>
      <p style="color:#A6A2B0;font-size:13px;margin-top:24px">
        If you did not request this, you can ignore this email.
      </p>
    </div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.EMAIL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: "Your Aifrobeats sign-in link",
      html,
    }),
  });

  if (!res.ok) {
    console.log("Resend send failed:", res.status, await res.text());
    return false;
  }
  return true;
}
