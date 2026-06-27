# Deploy Aifrobeats to Cloudflare Pages

This guide deploys the Aifrobeats landing page, the Workers AI vibe-search demo, and the D1 waitlist database.

## Prerequisites

- Cloudflare account
- `aifrobeats.com` added to Cloudflare
- Wrangler CLI installed:

```

npm install -g wrangler

```

- Logged in to Cloudflare:

```

wrangler login

```

## File structure

Before deploying, your project should look like this:

```

/

├── index.html

├── functions/

│   └── api/

│       ├── analyze.js

│       └── waitlist.js

├── schema.sql

├── wrangler.toml

└── [DEPLOY.md](http://DEPLOY.md)

```

## 1. Create the D1 database

Run:

```

wrangler d1 create aifrobeats-db

```

Cloudflare will return output containing a `database_id`.

Copy that value into `wrangler.toml`:

```

[[d1_databases]]

binding = "DB"

database_name = "aifrobeats-db"

database_id = "paste-database-id-here"

```

## 2. Apply the database schema

Run:

```

wrangler d1 execute aifrobeats-db --file=schema.sql --remote

```

This creates:

- `waitlist` table
- `idx_waitlist_created` index
- `vibe_queries` table for future AI query logging
- `idx_vibe_queries_created` index

## 3. Deploy to Cloudflare Pages

### Option A — Dashboard upload

This is the easiest first deployment.

1. Open Cloudflare dashboard.
2. Go to **Workers & Pages**.
3. Click **Create**.
4. Choose **Pages**.
5. Choose **Upload assets**.
6. Project name:

```

aifrobeats

```

7. Upload the full project folder.
8. After deployment, open the Pages project settings.
9. Go to **Functions** or **Bindings**.
10. Add the D1 binding:

```

Variable name: DB

Database: aifrobeats-db

```

11. Add the Workers AI binding:

```

Variable name: AI

```

12. Save and redeploy if prompted.

### Option B — Wrangler deploy

Run from the project root:

```

wrangler pages deploy . --project-name=aifrobeats

```

After the first deploy, confirm the bindings in the Cloudflare dashboard:

- D1 binding named `DB`
- Workers AI binding named `AI`

## 4. Add the custom domain

In Cloudflare:

1. Open **Workers & Pages**.
2. Select the `aifrobeats` Pages project.
3. Go to **Custom domains**.
4. Add:

```

[aifrobeats.com](http://aifrobeats.com)

```

5. Follow Cloudflare’s DNS prompts.
6. Wait for the domain status to become active.

## 5. Test the site

Visit:

```

https://aifrobeats.com

```

Confirm:

- Page loads on desktop.
- Page loads on mobile.
- Fonts load correctly:
  - Fraunces
  - Inter Tight
  - JetBrains Mono
- No console errors on page load.
- Footer includes:

```

Built on Cloudflare

```

- Footer email is:

```

[founder@aifrobeats.com](mailto:founder@aifrobeats.com)

```

## 6. Test the vibe search API

On the site, submit at least five test vibes:

```

sad Burna Boy at 100 BPM with horns

```

```

upbeat Lagos party anthem with log drums

```

```

melancholic Wizkid-style night drive at 96 BPM

```

```

Afro-house groove with shekere and deep bass

```

```

romantic mid-tempo Afrobeats with vocal chops

```

Each result should return:

- BPM
- Key
- 3–5 mood tags
- 4–7 production elements
- One short description

The response should render inside the page, not as raw JSON.

## 7. Test the waitlist

Submit a valid email on the site.

Expected result:

```

You’re on the list. We’ll send the first producer invites soon.

```

Then submit a malformed email, for example:

```

wrong-email

```

Expected result:

```

Enter a valid email address.

```

Submit the same valid email twice.

Expected result:

- No error
- Same success message
- No duplicate database row

## 8. Confirm D1 storage

Run:

```

wrangler d1 execute aifrobeats-db --command="SELECT * FROM waitlist" --remote

```

Confirm the submitted email appears in the `waitlist` table.

## 9. Lighthouse check

Run Lighthouse in Chrome DevTools.

Target scores:

- Performance: `90+`
- Accessibility: `95+`

If Performance is low, check:

- Google Fonts loading
- No large external assets
- No blocking scripts beyond the inline page script

If Accessibility is low, check:

- Input labels
- Button contrast
- Focus states
- Heading order

## 10. Cloudflare Startup Program application notes

Apply here:

```

https://www.cloudflare.com/lp/startups

```

Use:

```

Company name: Aifrobeats

Website: https://aifrobeats.com

Founder email: [founder@aifrobeats.com](mailto:founder@aifrobeats.com)

Founder location: Lagos, Nigeria

Funding status: Bootstrapped

Requested tier: Tier 3 — $10k credits

```

Mention that the live product already uses:

- Cloudflare Pages for the frontend
- Pages Functions for the API
- Workers AI for vibe-to-tags analysis
- D1 for waitlist storage

Also mention that Cloudflare credits will directly support the V1 architecture:

- R2 for audio storage
- Stream for beat previews
- Vectorize for similarity search
- D1 for marketplace data
- Workers AI for tagging, search, and co-creation tools

## 11. Final acceptance checklist

Before submitting the Cloudflare Startup Program application:

- [ ] Page renders on desktop without layout breaks
- [ ] Page renders on mobile without layout breaks
- [ ] Fraunces loads correctly
- [ ] Inter Tight loads correctly
- [ ] JetBrains Mono loads correctly
- [ ] Vibe search returns structured JSON
- [ ] Vibe search renders BPM, key, tags, elements, and description
- [ ] At least five test vibes produce coherent, distinct outputs
- [ ] Waitlist accepts valid email
- [ ] Waitlist rejects malformed email
- [ ] Duplicate email submission does not error
- [ ] D1 query confirms email was stored
- [ ] No console errors on load
- [ ] Lighthouse Performance score is 90 or higher
- [ ] Lighthouse Accessibility score is 95 or higher
- [ ] Footer contains `Built on Cloudflare`
- [ ] Footer email is `founder@aifrobeats.com`
- [ ] `aifrobeats.com` resolves correctly
- [ ] Cloudflare Pages deployment is live
```