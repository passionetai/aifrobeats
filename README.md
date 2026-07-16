# Aifrobeats

AI-native Afrobeats platform on Cloudflare's free tier. Culture layer, not a
generation engine: discover, vote, request, and curate AI Afrobeats.

Full spec and the phase-by-phase build ledger live in `AIFROBEATS_BLUEPRINT.md`.
Read that first, then work the ledger top to bottom.

## Quickstart (Phase 0)

1. Install: `npm install`
2. Create the free Cloudflare resources and paste the printed ids into `wrangler.toml`:
   ```
   npx wrangler d1 create aifrobeats-db
   npx wrangler r2 bucket create aifrobeats-media
   npx wrangler kv namespace create CACHE
   ```
3. Apply the schema: `npm run db:migrate:local` then `npm run db:migrate`
4. Set the session secret: `npx wrangler secret put SESSION_SIGNING_KEY`
5. Local dev: `npm run dev`  (Vite build watch + wrangler dev)
6. Deploy: `npm run deploy`
7. Add aifrobeats.com as a custom domain to the Worker in the dashboard.

Verify: `/api/health` returns ok, `/api/status` shows the DB connected, and the
home page renders the shell.

## House rules
- No em dashes anywhere (owner style rule).
- Free Cloudflare services only. Flag anything that would need a paid tier.
- Any generated imagery uses GPT Image 1.
