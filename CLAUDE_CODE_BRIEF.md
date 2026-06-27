# Aifrobeats — Site Build Brief for Claude Code

This document is a complete specification for building aifrobeats.com from scratch. Read the whole thing before starting any work. Ask clarifying questions if anything is ambiguous rather than guessing.

---

## 1. Project overview

**What Aifrobeats is:** A custom Afrobeats song commission service. Buyers commission personalized Afrobeats songs for specific occasions — love songs, birthday songs, wedding songs, brand jingles. Songs are AI-assisted (using Suno with commercial subscription) with a human producer directing lyrics, arrangement, and final output. Delivery is in hours, not weeks.

**Who it's for:** A global audience — diaspora Nigerians, Americans, Canadians, British Afrobeats fans, domestic Nigerian buyers, and anyone who wants an Afrobeats song made for a specific moment. Pricing is in USD throughout.

**Positioning line (use on hero):** *Afrobeats songs, made for the people you love. In hours, not weeks.*

**Core principle of the site:** Convert visitors into commissions through emotional resonance, not feature lists. The site's job is to get a visitor to feel *"that song could be for my person"* and click through to Gumroad.

---

## 2. Critical build instructions

**Build location:** This is a fresh build at the project root. There is no existing site to preserve — the previous build was deleted. Build clean, build correct, build the whole thing.

**Deployment target:** Phase 1 lives on cPanel shared hosting. Build as clean static files that can be uploaded via FTP. Future migration to Netlify is planned but not in this build — don't add Netlify-specific config files, netlify.toml, build scripts, or serverless functions.

**Tech stack (keep it light):**
- Static HTML
- Tailwind via CDN (not a build step) — but use it minimally; most styling comes from custom CSS using the design tokens in Section 12
- Vanilla JavaScript (no React, Vue, or frameworks)
- AOS for scroll animations (use sparingly — section reveals only)
- EmailJS for the commission form submission
- Custom-written audio player (the previous `player.js` was lost; write a fresh one per the spec in Section 4 → Radio Player)

**What the user will provide:**
- 4 audio sample files (20-30 seconds each) for the package cards — to be added to `/music/samples/`
- A pool of audio tracks for the always-on radio rotation — to be added to `/music/`
- Jerry's profile photo (replacing placeholder) — added later
- Social media handles for footer links
- Final EmailJS keys (Service ID, Template ID, Public Key)
- Gumroad product URLs (4 products, links provided in Section 4)
- A visual reference mockup at `/design-reference.png` — see Section 12

---

## 3. Site structure — six pages total

1. **Home** (`index.html`) — hero, radio player, packages, recent drops, how it works, FAQ, footer
2. **Commission** (`commission.html`) — the post-payment brief form
3. **Drops** (`drops.html`) — feed of trend-songs and featured commissions
4. **Licensing** (`licensing.html`) — ownership and license terms
5. **About** (`about.html`) — short page with the Jerry bio
6. **Legal** (`legal.html`) — privacy and terms merged into one page (use generic placeholder content; user will update before launch)

Every page must include the Cloudflare Web Analytics snippet in the `<head>` — see Section 18.

---

## 4. Homepage structure (7 sections, top to bottom)

### Section 1 — Hero

Minimal, confident, audio-forward. No carousel, no background video, no animated text.

**Headline:** AFROBEATS SONGS. / MADE FOR THE PEOPLE YOU LOVE.

(Two lines, massive uppercase, font-display per Section 12. Period at the end of each line is intentional.)

**Subhead:** IN HOURS — NOT WEEKS.

(Smaller, uppercase, tracking-wide, in `--accent-secondary` red. The em-dash is intentional.)

**CTA button:** "SEE PACKAGES" — pill-shaped, orange with glow effect, smooth-scrolls to Section 3.

No second CTA. No email capture. No "learn more."

### Section 2 — Radio Player

Placed directly under the hero. Serves as "hear what we make" proof and is the visual centerpiece of the upper page.

**Layout:** One full-width horizontal player bar (max-width 900px, centered), styled per Section 12 component spec.

**Elements (left to right):**
- Large circular orange play button (56px) with soft glow
- Currently playing track title (dynamic) in font-display uppercase
- "LIVE" indicator: small red pulsing dot + uppercase tracking-wide "LIVE" text in `--accent-secondary`
- Animated waveform graphic — ~40 vertical bars in `--accent-primary`, varying heights, subtle pulse animation tied to playback. Frozen at low height when paused.
- Time display (current / total) in muted text
- Volume slider (orange)

**Caption beneath player (centered):** *OUR STATION. ALWAYS ON.* — small, uppercase, tracking-wide, muted text.

**Implementation:**
- On page load, randomly pick a track from `/music/`
- Play it (with user gesture handling — many browsers block autoplay; if autoplay fails, show the play button prominently and start on first user interaction)
- On `ended` event, queue another random track
- Pure random — no "don't repeat within last N tracks" logic for v1
- Display current track title in the UI dynamically
- No skip button (the "always on" feel is the point)

### Section 3 — Packages

**Section heading:** FOUR WAYS TO MAKE A SONG.

(Centered, font-display uppercase, period intentional.)

**Layout:** 2×2 grid on desktop, stacked single column on mobile. Cards styled per Section 12 component spec.

Each card contains, top to bottom:
- Package name in font-display uppercase
- One-line emotional hook in italic body font, secondary text color
- Large circular orange play button (64px) with soft glow — plays the embedded audio preview
- Price line in uppercase tracking-wide white
- Turnaround line in muted text below price
- "SEE WHAT'S INCLUDED →" CTA link in uppercase tracking-wide accent-primary, links to Gumroad

**Package 1 — For Her / For Him**
- Hook: *The song she'll play when she misses you.*
- Price display: *$35 STANDARD · $55 RUSH (2HR)*
- Turnaround: *Delivered same day*
- Audio file: `/music/samples/for-her-for-him.mp3`
- CTA label: "MAKE HER ONE →"
- Gumroad URL: `https://aifrobeats.gumroad.com/l/for-her-for-him`

**Package 2 — Happy Birthday**
- Hook: *A birthday song with their actual name in it.*
- Price display: *$15 STANDARD · $25 RUSH (2HR)*
- Turnaround: *Delivered in 2-3 hours*
- Audio file: `/music/samples/happy-birthday.mp3`
- CTA label: "GET THEIRS READY →"
- Gumroad URL: `https://aifrobeats.gumroad.com/l/happy-birthday`

**Package 3 — Walk Down The Aisle**
- Hook: *Afrobeats for the moment she walks in.*
- Price display: *$80*
- Turnaround: *Delivered in 3 days · Both vocal & instrumental versions*
- Audio file: `/music/samples/walk-down-the-aisle.mp3`
- CTA label: "START THEIR SONG →"
- Gumroad URL: `https://aifrobeats.gumroad.com/l/walk-down-the-aisle`

**Package 4 — Big Vibes**
- Hook: *Your business, but it slaps.*
- Price display: *$40 SINGLE · $70 THREE-VERSION PACK*
- Turnaround: *Delivered in 24 hours*
- Audio file: `/music/samples/big-vibes.mp3`
- CTA label: "GET YOUR JINGLE →"
- Gumroad URL: `https://aifrobeats.gumroad.com/l/big-vibes`

### Section 4 — Recent Drops

**Section heading:** RECENT DROPS.

Renders from `drops.json` (schema in Section 6). Homepage shows 3-4 most recent items marked `featured: true`.

**Layout:** Three drop cards in a horizontal row (desktop), stacked on mobile. Cards styled per Section 12 component spec.

Each drop card contains:
- Mini animated waveform graphic in orange (40px tall)
- Title in font-display uppercase white
- Date in muted text, uppercase tracking-wide
- One-line italic caption in secondary text
- Link to social post (if `social_link` exists) — opens in new tab

**Below the row:** A link "SEE ALL DROPS →" in accent-primary, uppercase tracking-wide, linking to `drops.html`.

### Section 5 — How it works

**Section heading:** HOW IT WORKS.

Three simple steps, displayed as three cards or a horizontal numbered sequence.

1. **PICK A PACKAGE.** Choose the moment — love, birthday, wedding, brand.
2. **TELL US WHO IT'S FOR.** A quick brief (2-5 minutes) after payment.
3. **GET YOUR SONG.** Delivered to your WhatsApp, Telegram, or email within hours.

Numbers in large orange font-display, step titles in white uppercase, descriptions in secondary text.

### Section 6 — FAQ

**Section heading:** FAQ.

All 13 FAQ questions, collapsible accordion (click to expand). One open by default: the "How fast is 'in hours' actually?" question. Full FAQ content in Section 7 of this brief.

**Styling:**
- Each question: font-display uppercase, white, with an orange "+" icon on the right (rotates to "×" when expanded)
- Each answer: body font, secondary text color, with proper paragraph spacing
- Border between items: thin `--border-subtle` line
- Hover state: question text shifts slightly to orange

### Section 7 — Footer

Three-column layout on desktop, stacked on mobile. Thin orange divider line above.

**Column 1 — EXPLORE:** Home · Drops · Packages (anchor) · About · How it works
**Column 2 — INFO:** FAQ · Delivery & revisions · Commission · Licensing · Legal
**Column 3 — LET'S TALK:**
- "Chat with us on WhatsApp"
- WhatsApp icon + linked number: *+234 805 371 7830* (linked as `https://wa.me/2348053717830`)
- Social icons: Instagram, TikTok, Twitter/X (placeholders `#` for now)

Below the columns, a thin divider, then:
**Copyright line:** *© 2026 AIFROBEATS. ALL RIGHTS RESERVED.* — uppercase, muted, tracking-wide, centered.

---

## 5. The Commission Form (`commission.html`)

This is the most important build after the homepage. Buyers land here after paying on Gumroad via a link in their receipt email. Same dark visual style as the homepage.

### URL parameter handling

The page reads `?package=` from the URL. Four valid values:
- `for-her-for-him`
- `happy-birthday`
- `walk-down-the-aisle`
- `big-vibes`

If the parameter is missing or unrecognized, show a package selector dropdown as the first field so the buyer can pick manually. This catches people who land on `/commission` directly.

### Universal fields (shown on all packages)

At the top of the form:

**Header message:**
> Thanks for commissioning — now tell us about their song.
>
> Prefer to explain over voice? Send a WhatsApp voice note to +234 805 371 7830 with your order ID and skip the form — whatever's easier for you. [Link: "SEND VOICE NOTE ON WHATSAPP →"]

The WhatsApp link format: `https://wa.me/2348053717830?text=Order%20ID%3A%20`

**Universal fields (required unless noted):**
1. Your name — text input
2. Order ID — text input, with helper text: *Check your Gumroad receipt email for this*
3. Preferred delivery method — radio buttons: WhatsApp / Telegram / Email
4. Contact for delivery — text input, appears conditionally once delivery method is selected. Helper text: *Phone number or email address*

### Form styling

- Input backgrounds: `--bg-secondary` with `--border-subtle` 1px border
- Border-radius: 8px
- Padding: 14px 16px (mobile-friendly tap targets, min 48px tall)
- Focus state: border becomes `--accent-primary`, soft orange glow
- Labels above inputs in font-body uppercase tracking-wide, `--text-secondary`
- Required fields marked with small orange asterisk
- Submit button: full-width pill, `--accent-primary` background, font-display uppercase white, with orange glow

### Package-specific fields

Use JavaScript to show/hide field blocks based on the URL parameter. CSS `display: none` by default, JS toggles on for the matched package.

**For Her / For Him fields:**
5. Who's this for? (required, text) — *Partner's name as you want it said in the song*
6. How did you two meet? (required, textarea) — *A few sentences is plenty*
7. What's something only the two of you would get? (optional, textarea) — *Inside joke, nickname, shared memory, a place that means something*
8. The vibe you want (required, radio): Tender and emotional / Hype and celebratory / Smooth and groove-y / Playful and fun
9. What's this song for? (required, radio): Proposal / Anniversary / Apology / "Just because" / Long-distance / Valentine's / Other
10. Anything you want me to avoid? (optional, textarea)
11. Anything else I should know? (optional, textarea)

**Happy Birthday fields:**
5. Whose birthday is it? (required, text) — *Their name, exactly as it should be sung*
6. How do you know them? (required, radio): My partner / Sibling / Parent / Best friend / Child / Colleague / Other
7. Tell me about them — what are they like? (required, textarea) — *Personality, what makes them them*
8. What vibe do you want? (required, radio): Hype them up / Make them laugh / Get emotional / Mix of all three
9. Any inside jokes or specific things to reference? (optional, textarea)
10. Anything I should avoid mentioning? (optional, textarea)
11. When do you need it? (required, radio): Today / Tomorrow / Within the week / [date picker for a specific date]
12. Anything else I should know? (optional, textarea)

**Walk Down The Aisle fields:**
5. The couple's names (required, two text fields side by side) — *Partner 1's name · Partner 2's name*
6. Wedding date (required, date picker) — *Must be at least 3 days from today for standard delivery*
7. How did they meet? (required, textarea)
8. A moment or memory that captures them (required, textarea)
9. Whose perspective should the song be from? (required, radio): Partner 1 to Partner 2 / Partner 2 to Partner 1 / A family member or friend (specify in "Anything else") / Neutral, celebrating both
10. Which moment is the song for? (required, checkboxes — multi-select): Walking down the aisle / First dance / Reception celebration / Surprise during speeches / Other
11. Tone balance (required, radio): More danceable / Balanced / More emotional
12. Any cultural specifics? (optional, textarea) — *Yoruba, Igbo, Hausa, mixed-heritage, specific references to include or avoid*
13. Any requests for the parents? (optional, textarea)
14. Anything else? (optional, textarea)

**Big Vibes fields:**
5. Business / brand name (required, text) — *Exactly as it should be said*
6. Phonetic pronunciation (optional, text) — *If the name has unusual pronunciation, e.g. "Iya Basira → ee-ya ba-see-ra"*
7. What does the business do? (required, textarea) — *What you sell, who your customers are, what makes you different*
8. Tagline or key message (optional, text) — *If you want a specific phrase in the jingle*
9. Where will this jingle live? (required, checkboxes — multi-select): Social media ads / Podcast intro / YouTube intro / In-store / Radio ads / Other
10. Jingle length preference (required, radio): 15 seconds (stinger) / 30 seconds (standard) / 60 seconds (full) / Not sure, you decide
11. Vibe (required, radio): Luxury and smooth / Hype and energetic / Warm and welcoming / Bold and confident / Chill and laid-back
12. Reference track (optional, text) — *Link to any Afrobeats song that has the energy you want*
13. Anything to avoid? (optional, textarea)
14. Anything else? (optional, textarea)

### Confirmation page

After submission, the buyer sees:

> **GOT IT. YOUR SONG IS BEING MADE.**
>
> Your brief is in. We'll start work within the hour and deliver via [their chosen contact method] within your turnaround.
>
> Check [contact method] for delivery. If you want to add anything you forgot, reply to the receipt email or DM us on WhatsApp.
>
> — Aifrobeats

Include a WhatsApp link on the confirmation: *MESSAGE US ON WHATSAPP →*

### Mobile responsiveness (non-negotiable)

Most buyers will be on mobile, especially rush-tier birthday buyers at 2am.
- Large tap targets (minimum 48px tall for all buttons/inputs)
- No horizontal scrolling ever
- Native mobile date picker for date fields
- Dropdowns/selects use native mobile UI
- Text inputs use appropriate `inputmode` attribute (`email`, `tel`, `text`)
- The WhatsApp voice-note link at the top of the form is prominent on mobile

---

## 6. The `drops.json` schema and initial entries

Create `drops.json` in the site root. Schema per entry:

```json
{
  "id": "drop-001",
  "title": "Track title here",
  "caption": "One-line description",
  "audio_file": "/music/drops/filename.mp3",
  "date": "2026-04-20",
  "social_link": "https://tiktok.com/@aifrobeats/video/...",
  "featured": true
}
```

- `id`: unique string
- `title`: display title
- `caption`: one sentence
- `audio_file`: path relative to site root
- `date`: ISO date string (YYYY-MM-DD)
- `social_link`: optional, full URL to the social post (can be null/empty)
- `featured`: boolean — if true, appears on homepage "Recent Drops" section; all drops appear on the Drops page regardless

**Initial state:** Create the file with 4 placeholder entries. User will replace content with real drops.

```json
[
  { "id": "drop-001", "title": "Placeholder Drop 1", "caption": "Replace with real caption", "audio_file": "/music/drops/placeholder-1.mp3", "date": "2026-04-20", "social_link": "", "featured": true },
  { "id": "drop-002", "title": "Placeholder Drop 2", "caption": "Replace with real caption", "audio_file": "/music/drops/placeholder-2.mp3", "date": "2026-04-18", "social_link": "", "featured": true },
  { "id": "drop-003", "title": "Placeholder Drop 3", "caption": "Replace with real caption", "audio_file": "/music/drops/placeholder-3.mp3", "date": "2026-04-15", "social_link": "", "featured": true },
  { "id": "drop-004", "title": "Placeholder Drop 4", "caption": "Replace with real caption", "audio_file": "/music/drops/placeholder-4.mp3", "date": "2026-04-12", "social_link": "", "featured": true }
]
```

---

## 7. FAQ content (for homepage Section 6)

Render as collapsible accordion. 13 questions. First one open by default.

### How fast is "in hours" actually?

Fast. The clock starts the moment your order and brief arrive — not when we wake up, not when we "get to it." Whether you order at 10am or 10pm, we start within the hour.

One honest caveat: if you're ordering from a time zone 6-7+ hours away from Lagos (GMT) and your order comes in between 2am and 4am our time, there might be a slight delay — but we'll always confirm timing with you before you wait.

### What if I don't like the song?

We get it — sometimes the first version doesn't land the way you pictured it.

Every package includes up to **2 revisions**, delivered within 24 hours of your feedback. There are two kinds:

- **Tweak revision** — we adjust lyrics, swap phrases, fix pronunciation, but keep the core song the same. The final version sounds like a cover of the first with your changes.
- **Redo revision** — a fresh take with a meaningfully different direction. Different vibe, different mood, different feel.

Just tell us which kind you want when you send your feedback, and we'll deliver within 24 hours. A 3rd revision beyond the 2 included costs $10 across all packages.

### Is this really AI-generated? Should I be worried about that?

Yes and no. We use AI music tools as our instrument — the same way a producer uses a synthesizer or a DAW. But every song is human-directed: we write the lyrics, shape the vibe, pick the sound, and make the creative calls so the song feels like yours.

AI is how we deliver in hours what traditional studios take weeks to do. You're not getting a random AI output — you're getting a song a human made with AI as the tool, tuned for you.

The songs are fully commercially viable and yours to use anywhere.

### Can I release the song on Spotify, Apple Music, or other streaming platforms?

Yes, absolutely. The song is yours with full commercial rights.

One thing to know: streaming platforms (Spotify, Apple Music, DistroKid, YouTube, etc.) have their own rules about disclosing AI-assisted music. Those rules change and vary by platform, so it's your responsibility to check and follow whatever the current policy is when you upload. A simple "AI-assisted" disclosure is usually all that's needed.

### What happens if I pay but forget to fill out the brief?

No stress — we follow up within 3 hours through WhatsApp and email to remind you and make sure you didn't get stuck.

If for some reason you never respond or change your mind entirely, we offer a refund since we can't deliver a song we don't have a brief for. Your money's never sitting in limbo.

### Do I own the song after delivery?

Yes, fully. Play it, post it, release it, use it commercially — it's yours.

One small thing: by default, we may feature your song as a sample on our site or socials (as part of our portfolio). **If you want it kept completely private** — like a surprise proposal song — just let us know and we'll keep it off everything. No questions asked.

### What format do the songs come in?

All songs are delivered as **high-quality WAV files** by default. If you'd prefer MP3, just let us know in the brief and we'll send that format instead.

For **wedding songs**, you get both the vocal version and an instrumental version, both in WAV, automatically.

For **Big Vibes jingles**, you can request an instrumental version at no extra charge — just mention it in the brief.

### Can I pay by bank transfer instead of online card?

For Nigerian buyers who can't pay online, yes — reach out on WhatsApp (+234 805 371 7830) and we'll arrange a bank transfer. Everyone else pays through Gumroad (cards, PayPal).

### Can you make songs in languages other than English?

Yes. As long as the baseline is Afrobeats, we can do songs in Yoruba, Igbo, Hausa, French, or any other language. Just tell us what you want in the brief.

### Can I commission anonymously or outside your standard packages?

Yes to both. If you want to commission anonymously (no credit, no reference to you), we'll respect that. And if your idea doesn't fit into our four packages — a diss track, a graduation song, a baby announcement, something we haven't thought of — reach out on WhatsApp and we'll work something out.

### Do I get to hear a preview before final delivery?

Yes. Before final delivery, we send you a 20-30 second preview (usually the first verse and chorus) so you can confirm it's going the right direction before we finalize. Saves revisions and makes sure you get exactly what you imagined.

### How many commissions can you handle at once?

As many as you need. Whether you're commissioning one song or a batch (for an event, a campaign, or multiple people), we scale to fit. Just let us know in the brief if you're ordering multiple songs at once.

### Can I hear more of your work before commissioning?

Our radio station on the homepage runs 24/7 — it plays our portfolio on loop. You can also browse recent drops and the music library for vocals and instrumentals. If you want to hear something specific before ordering (a certain vibe, a certain language, a certain mood), DM us on WhatsApp and we'll send samples.

---

## 8. Licensing page content (`licensing.html`)

Render as a clean, scannable document page. Use proper heading hierarchy. Same dark visual style as homepage — headings in font-display uppercase, body text in font-body secondary color.

---

# LICENSING & OWNERSHIP

When you commission a song from Aifrobeats, here's what you get and what we keep.

## What you get

You receive a **perpetual, worldwide, unlimited-use license** to the song we commission for you. In practice, that means:

- You can release it on Spotify, Apple Music, YouTube, SoundCloud, or any other streaming platform
- You can monetize it — ads, sync deals, licensing to other creators, anything
- You can register it with a performing rights organization (ASCAP, BMI, PRS, COSON, etc.)
- You can use it in commercial content — ads, films, podcasts, business materials, events
- You can credit yourself as the artist
- You can keep it forever. No expiration, no renewal fees, no royalties owed back to us

## What we retain

Aifrobeats retains the underlying copyright to the song. This is standard for AI-assisted music commissions and doesn't affect your ability to use, release, or monetize the song in any of the ways described above.

## What you can't do with the song

A few standard limits on the license:

- **You can't resell the raw files.** You can release the song as your own music, but you can't list the WAV or MP3 on stock-music sites, beat marketplaces, or sample packs for others to buy.
- **You can't claim you produced it solo in a traditional studio.** You can credit yourself as the artist and release the song anywhere, but you should follow each platform's AI disclosure rules when uploading.
- **You can't use the song to train AI models.** The song can't be used as training data for AI music generators or sold to dataset companies.
- **You can't use the song in content that promotes hate, violence, or illegal activity.** The song is yours, but it can't be attached to content that would bring Aifrobeats into disrepute by association.

## About the AI disclosure

Your song was produced using AI music tools, with a human producer directing the lyrics, arrangement, and final output. You're free to release, distribute, and monetize the song commercially, anywhere.

Streaming platforms and sync partners increasingly ask creators to disclose when music is AI-assisted. Each platform's policy is different and they update over time, so we'd recommend checking the current policy wherever you're uploading. A simple "AI-assisted" disclosure is usually all that's required, and we're happy to help you word it if you need.

## Privacy

By default, we may feature delivered songs as portfolio samples on our site or socials. **If you want your song kept completely private** — a surprise proposal, an intimate memorial, anything — just let us know in your brief or afterward, and we'll keep it off all our platforms.

## When this license takes effect

This license takes effect at the moment of purchase and applies to the specific song commissioned. Aifrobeats may update these terms for future commissions, but changes will not affect songs already delivered under an earlier version of the license.

## Questions or licensing confirmations

For licensing questions, written confirmations for sync deals, or help with platform AI disclosure wording, reach out:

**WhatsApp:** +234 805 371 7830
**Email:** licensing@aifrobeats.com

We'll respond within 24 hours.

---

## 9. About page content (`about.html`)

Short page. Header, bio, contact CTA. Same dark visual style.

**Page title:** ABOUT

**Heading:** BEHIND AIFROBEATS

**Bio content:**

**JERRY — PRODUCER, AIFROBEATS**

Jerry is a music producer and lifelong music enthusiast based in Lagos, Nigeria. Over the past decade, he's produced across genres — from underground hip-hop to polished Afrobeats — working with upcoming artists, indie rappers, and solo songwriters refining their sound.

His production philosophy is simple: a song works when it gets stuck in your head for the right reasons. Whether it's a club record, a love song, or a 30-second brand jingle, the goal is the same — make something that actually moves people, and make it sound like it cost more than it did.

At Aifrobeats, Jerry pairs years of DAW-based production experience with modern AI music tools to deliver songs in hours that would traditionally take weeks. Every song on the site is human-directed — lyrics, vibe, sound selection, mixing, mastering — with AI as the instrument that makes the speed possible.

*When he's not producing, you'll find him digging through crates of old highlife records and hyping up Lagos's underground scene.*

**Profile image:** Placeholder circular div (200px diameter) with `--bg-secondary` background, thin orange border, and centered "Photo coming soon." text in muted color. User will swap in real photo later.

**CTA at bottom of page:** A pill button linking to `index.html#packages` — label: "SEE WHAT JERRY CAN MAKE FOR YOU →"

---

## 10. Drops page content (`drops.html`)

Simple feed of all drops from `drops.json`, sorted by date (newest first).

**Page title:** DROPS

**Heading:** EVERY DROP, EVERY MOMENT.

**Subheading:** New songs as we make them — for the moment, the trend, or the person who deserves their own.

**Layout:** 2-column grid of drop cards on desktop, stacked on mobile. Same drop card spec as homepage.

Social link button labeled based on platform (detect by URL): "WATCH ON TIKTOK →" / "VIEW ON TWITTER →" / "SEE ON INSTAGRAM →" / "VIEW POST →"

No pagination needed for v1 — all drops on one page.

---

## 11. Legal page content (`legal.html`)

**Page title:** LEGAL

**Heading:** LEGAL

**Structure:** Two clearly separated sections with `<h2>` headings:
- Privacy Policy
- Terms of Service

Use generic placeholder content (4-5 paragraphs each) with clear flag at the top of the page: *"This page needs final legal content before launch — placeholder text is in use."* The user will replace before going live.

---

## 12. Design system — Direction B "Diaspora Modern"

**A visual reference mockup is provided at `/design-reference.png`.** Use it for atmosphere, layout, and feel. The CSS variables and component specs below are the precise spec; the image is the mood.

The design is bold, contemporary, audio-forward. Dark dark background with one warm accent color (sunset orange) doing all the work. Massive condensed uppercase typography. Glowing audio elements. Clean, premium, modern — Boiler Room meets a streaming platform.

### Color tokens

```css
:root {
  /* Backgrounds */
  --bg-primary: #0B0E1A;        /* Main page background — near-black midnight */
  --bg-secondary: #15192B;      /* Card backgrounds, elevated surfaces */
  --bg-tertiary: #1A1F3A;       /* Subtle gradient end / hover states */

  /* Brand accents */
  --accent-primary: #FF6B35;    /* Sunset orange — CTAs, play buttons, glows */
  --accent-secondary: #E63946;  /* Hibiscus red — secondary text, "LIVE" indicator */
  --accent-glow: rgba(255, 107, 53, 0.25); /* Soft orange glow */

  /* Text */
  --text-primary: #FFFFFF;       /* Headlines, primary copy */
  --text-secondary: #B8BCC8;     /* Body text, secondary copy */
  --text-muted: #6B7080;         /* Captions, dates, metadata */
  --text-on-accent: #FFFFFF;     /* Text on orange buttons */

  /* Borders & dividers */
  --border-subtle: rgba(255, 255, 255, 0.08);
  --border-accent: rgba(255, 107, 53, 0.4);
  --border-divider: rgba(255, 107, 53, 0.2);
}
```

### Typography

Two fonts only. Both load free from Google Fonts.

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

```css
:root {
  --font-display: 'Archivo Black', sans-serif;
  --font-body: 'Inter', sans-serif;

  --text-hero: clamp(2.5rem, 8vw, 5.5rem);
  --text-section: clamp(1.75rem, 4vw, 2.5rem);
  --text-card-title: clamp(1.25rem, 2.5vw, 1.5rem);
  --text-body: 1rem;
  --text-small: 0.875rem;
  --text-tiny: 0.75rem;

  --tracking-wide: 0.15em;
  --tracking-tight: -0.02em;
}
```

Display font: uppercase always, used for headlines, section titles, package names, CTAs.
Body font: used for body copy, italic hooks, prices, captions, nav, footer.

### Spacing scale

Use these increments only:

```
4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px, 96px, 128px
```

### Background treatment

```css
body {
  background:
    radial-gradient(ellipse at top right, rgba(255, 107, 53, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse at bottom left, rgba(230, 57, 70, 0.05) 0%, transparent 50%),
    linear-gradient(180deg, #0B0E1A 0%, #15192B 100%);
  background-attachment: fixed;
  min-height: 100vh;
  color: var(--text-primary);
  font-family: var(--font-body);
}
```

### Glow effect (key visual signature)

```css
.glow-orange {
  box-shadow:
    0 0 40px rgba(255, 107, 53, 0.25),
    0 0 80px rgba(255, 107, 53, 0.1);
}

.glow-orange-strong {
  box-shadow:
    0 0 60px rgba(255, 107, 53, 0.4),
    0 0 120px rgba(255, 107, 53, 0.15);
}
```

### Subtle film grain (atmospheric)

```css
body::after {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  background-image: url("data:image/svg+xml;utf8,<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.5'/></svg>");
  opacity: 0.03;
  mix-blend-mode: overlay;
  z-index: 1;
}
```

### Component specs

**CTA button (orange pill)**
- Pill shape (border-radius: 999px)
- Padding: 14px 32px (mobile), 18px 44px (desktop)
- Background: `--accent-primary`
- Text: uppercase, font-display, white
- Box-shadow: `.glow-orange`
- Hover: brightness(1.1), shadow becomes `.glow-orange-strong`
- Min-tap-target: 48px tall on mobile

**Package card**
- Background: `--bg-secondary`
- Border: 1px solid `--border-subtle`
- Border-radius: 16px
- Padding: 32px 24px (mobile), 40px 32px (desktop)
- Hover: border becomes `--border-accent`, subtle inset orange glow, transform translateY(-4px)

Internal layout (centered):
1. Package name — font-display, uppercase, white, `--text-card-title`
2. Hook line — font-body italic, `--text-secondary`, 0.95rem
3. Spacer 24px
4. Play button — circular 64px, `--accent-primary`, white play icon, glow
5. Spacer 20px
6. Price — uppercase tracking-wide white, 0.875rem
7. Turnaround — `--text-muted`, 0.8rem
8. Spacer 16px
9. CTA link — `--accent-primary`, uppercase tracking-wide, 0.75rem, with → arrow

**Audio player bar**
- Width: 100%, max-width 900px, centered
- Background: `--bg-secondary`
- Border: 1px solid `--border-subtle`
- Border-radius: 12px
- Padding: 20px 24px
- Subtle `.glow-orange` shadow
- Layout: flex — [play btn] [track info] [waveform] [time/volume]

Play button: 56px circular, `--accent-primary`, white icon, glow
Track title: font-display white uppercase, 1rem
LIVE indicator: red pulsing 8px dot + "LIVE" text in `--accent-secondary` uppercase tracking-wide
Waveform: animated SVG ~40 vertical bars in `--accent-primary`, varying 20-80% height, subtle pulse animation
Time display: `--text-muted`, 0.8rem
Volume slider: orange thumb, dark track

**Section heading**
- font-display, uppercase
- `--text-section` size
- White, center-aligned
- Period at end (intentional)
- Margin-bottom: 48px

**Drop card**
- Background: `--bg-secondary`
- Border: 1px solid `--border-subtle`
- Border-radius: 12px
- Padding: 20px

Internal:
1. Mini animated waveform — SVG `--accent-primary`, 40px tall
2. Title — font-display uppercase white, 1rem
3. Date — `--text-muted` uppercase tracking-wide, 0.75rem
4. Caption — italic `--text-secondary`, 0.875rem

**Form input**
- Background: `--bg-secondary`
- Border: 1px solid `--border-subtle`
- Border-radius: 8px
- Padding: 14px 16px, min-height 48px
- Focus: border `--accent-primary`, glow
- Label above: uppercase tracking-wide `--text-secondary`, 0.75rem
- Required asterisk: `--accent-primary`

**FAQ accordion item**
- Border-bottom: 1px solid `--border-subtle`
- Question: font-display uppercase white, with "+" icon right (rotates 45° to "×" when open) in `--accent-primary`
- Padding: 24px 0
- Hover: question text shifts to `--accent-primary`
- Answer: font-body `--text-secondary`, smooth height transition

---

## 13. Build order recommendation

1. Set up project root: `index.html`, `commission.html`, `drops.html`, `licensing.html`, `about.html`, `legal.html`, `drops.json`, `/css/styles.css`, `/js/player.js`, `/js/main.js`, `/music/`, `/music/samples/`, `/music/drops/`, `/images/`
2. Drop `design-reference.png` in the root for reference
3. Set up the design system: Google Fonts, CSS custom properties, base styles, glow utilities, grain overlay
4. Build the homepage shell (all 7 sections with placeholder content)
5. Build the radio player JS — random track from `/music/`, autoplay handling, ended event queue, dynamic title display, animated waveform
6. Build the package cards with Gumroad links and audio preview functionality
7. Build `drops.json` loader and the Recent Drops section + Drops page
8. Build the commission form page with all conditional logic
9. Wire up EmailJS
10. Build the Licensing, About, and Legal pages
11. Install Cloudflare Web Analytics snippet on every page (Section 18)
12. Test the full flow end-to-end on mobile and desktop
13. Hand back to user for content swap

---

## 14. EmailJS integration details

User has an existing EmailJS account. They will provide:
- Service ID
- Template ID
- Public key

Create a new EmailJS template for the commission form submission. Template should include all form fields dynamically — use conditional logic in the template to only show fields that have values.

Subject line template (dynamic):
```
{{subject_prefix}} Order #{{order_id}} — {{subject_detail}}
```

Where:
- `subject_prefix` is one of: `[RUSH - FOR HER/HIM]`, `[STANDARD - FOR HER/HIM]`, `[RUSH - BIRTHDAY]`, `[STANDARD - BIRTHDAY]`, `[WEDDING]`, `[BIG VIBES]`
- `subject_detail` is built from key fields (partner name, recipient name, couple names, brand name)

For development, hardcode placeholder credentials and clearly mark where the user needs to swap in real values.

---

## 15. What the user will provide after this build

- 4 audio sample files (20-30 seconds each) → `/music/samples/`
- 4 real drop entries → update `drops.json`, audio → `/music/drops/`
- Radio rotation content → `/music/`
- Jerry's profile photo → `/images/jerry.jpg`
- Social media handles → update footer placeholder `#` links
- Final EmailJS keys
- Cloudflare Web Analytics token (Section 18)

---

## 16. Out of scope for this build

- User accounts, login, authentication
- Payment processing on-site (Gumroad handles checkout)
- Database, backend, or dynamic server logic
- A store/catalog/marketplace
- CMS or admin panel
- Email marketing integration
- SEO optimization beyond basic meta tags

---

## 17. Performance requirements

The previous site had Core Web Vitals issues (LCP 3.9s "Needs Improvement", INP "Poor"). This rebuild must do better.

- LCP target: under 2.0s
- INP target: under 200ms
- CLS target: under 0.1

Specific rules:
- No background videos
- No timeline animations
- No heavy JS libraries
- Lazy-load audio files (don't preload all package previews — load on first play interaction)
- Lazy-load images below the fold
- Use `font-display: swap` on Google Fonts
- Inline critical CSS for the hero section in `<head>`
- Defer all non-critical JS

---

## 18. Cloudflare Web Analytics

Install the Cloudflare Web Analytics snippet in the `<head>` of every HTML page. The user will provide the actual token before launch. Use this placeholder structure:

```html
<!-- Cloudflare Web Analytics -->
<script defer src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{"token": "REPLACE_WITH_USER_TOKEN"}'></script>
<!-- End Cloudflare Web Analytics -->
```

Mark the token clearly as `REPLACE_WITH_USER_TOKEN` so it's easy to find and replace across all 6 HTML files. The user will paste their real token in one search-and-replace pass before launch.

---

## 19. Questions to confirm with the user before building

If anything in this brief is unclear, ask before coding. Specifically confirm:
- EmailJS credentials (service ID, template ID, public key)
- Where the project will be developed (local folder path)
- Whether to set up a basic local dev server (e.g., `python -m http.server`) or assume direct file:// testing

---

End of brief. Build it clean, build it fast, build it bold.
