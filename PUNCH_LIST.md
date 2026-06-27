# Aifrobeats — Bug Fixes & Polish Punch List

This is a focused list of issues found in the current build. Fix them in the order given. Do not redesign anything — no color changes, no layout changes, no copy changes. Just fix the bugs and polish per the spec below. The original brief in `CLAUDE_CODE_BRIEF.md` is still authoritative for anything not addressed here.

---

## CRITICAL — fix these first (broken functionality)

### 1. Radio player is pulling from the wrong source

**Problem:** `player.js` has a hardcoded `radioTracks` array that points to `/music/drops/placeholder-1.mp3` etc. with fake titles. The radio is supposed to play tracks from `/music/` (the always-on station pool), not from `/music/drops/` (which is the curated Recent Drops feed — a separate concept).

**Fix:**
- Create a new file at the project root: `radio.json`
- Schema: an array of objects with `title` and `file` fields:
  ```json
  [
    { "title": "PLACEHOLDER TRACK 1", "file": "/music/placeholder-1.mp3" },
    { "title": "PLACEHOLDER TRACK 2", "file": "/music/placeholder-2.mp3" },
    { "title": "PLACEHOLDER TRACK 3", "file": "/music/placeholder-3.mp3" },
    { "title": "PLACEHOLDER TRACK 4", "file": "/music/placeholder-4.mp3" },
    { "title": "PLACEHOLDER TRACK 5", "file": "/music/placeholder-5.mp3" }
  ]
  ```
- Update `player.js` so it `fetch('/radio.json')` on `DOMContentLoaded`, then assigns the result to the existing `radioTracks` variable, and only proceeds with `loadTrack(currentTrackIndex)` and waveform setup AFTER the JSON loads.
- Wrap the existing initialization logic in a function that runs after the fetch resolves.
- Keep all existing playback logic (random track pick, ended handler, volume slider, time display) the same — only the data source changes.

The user will replace `radio.json` entries with real track titles and filenames after the build is done.

---

### 2. Waveform animation in radio player is broken

**Problem:** The CSS selector `.playing .waveform-bar` doesn't match the DOM. The `playing` class is added to `#radio-waveform` itself (an element with class `player-waveform`), not to a parent of the bars. So the keyframe animation never runs. Additionally, the animation goes from 20% to 100% height in lockstep — even if it ran, all 40 bars would pulse identically, looking like a uniform breathing rectangle instead of a waveform.

**Fix in `styles.css`:**

Replace this block:
```css
.playing .waveform-bar {
  animation: pulse-wave 1s ease-in-out infinite alternate;
}

@keyframes pulse-wave {
  0% { height: 20%; }
  100% { height: 100%; }
}
```

With this:
```css
#radio-waveform.playing .waveform-bar {
  animation: pulse-wave 1s ease-in-out infinite alternate;
}

@keyframes pulse-wave {
  0% { height: 20%; }
  100% { height: 80%; }
}
```

The JS in `player.js` already sets randomized `animationDelay` and `animationDuration` per bar via inline styles — those will now actually take effect because the keyframe animation will run. No JS changes needed here.

Verify visually: when the radio is playing, the 40 bars should pulse at varying heights and varying speeds, looking like a dancing audio waveform — not a synchronized rectangle.

---

### 3. Drops feed logic is incomplete on homepage

**Problem:** The `main.js` drops loader checks `dropsContainer.hasAttribute('data-homepage')` to decide whether to filter to `featured: true` drops only. But this attribute likely isn't set on the homepage's container — meaning the homepage may currently show all drops instead of just featured ones, OR the drops page may incorrectly filter (depending on what's in `index.html`).

**Fix:**
- In `index.html`, find the `<div id="recent-drops-container">` element in the Recent Drops section.
- Add the attribute `data-homepage="true"` to it. So it becomes:
  ```html
  <div id="recent-drops-container" data-homepage="true" class="...">
  ```
- In `drops.html`, ensure the same container does NOT have this attribute (it's already absent based on the file I reviewed — just confirm).
- No JS changes needed; the existing logic already handles both cases.

---

### 4. Verify EmailJS submission actually works

**Problem:** `main.js` calls `emailjs.send('service_4vh02fv', 'template_fnabhb3', data, 'u899JogrVD_YHNQIU')` — these credentials were provided by the user. They need to be verified end-to-end before launch.

**Fix:**
- Confirm in `commission.html` that the EmailJS SDK script tag is present in the `<head>` or before the closing `</body>`. It should look like:
  ```html
  <script type="text/javascript" src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js"></script>
  ```
- Confirm `emailjs.init({ publicKey: 'u899JogrVD_YHNQIU' })` is called before the form's submit handler runs. If using the older SDK syntax, `emailjs.init('u899JogrVD_YHNQIU')` is also acceptable.
- If either is missing, add it.
- Test the form by submitting a fake commission with `?package=happy-birthday`. Confirm that the success message appears AND the email lands in the user's inbox. If it fails, log the actual EmailJS error to the console and report it.

---

### 5. Site-wide navigation is missing

**Problem:** Inner pages (`about.html`, `drops.html`, `legal.html`, `licensing.html`) have a header containing only a centered logo image, no nav. There's no way for a visitor to navigate between pages without scrolling all the way to the footer. This breaks basic site usability.

**Fix:**
- Add a consistent site-wide `<header>` to ALL six pages (`index.html`, `commission.html`, `drops.html`, `about.html`, `licensing.html`, `legal.html`).
- Header structure:
  - Left: logo image (`/images/mlogo.png`), linked to `index.html`
  - Right: horizontal nav with links: Home · Drops · About · Licensing
- Nav link styling: `font-body`, uppercase, `tracking-wide`, `text-secondary` color. Hover state shifts to white.
- On mobile (under 768px): collapse nav into a hamburger menu icon (right-aligned). Tapping opens a full-width dropdown with the same links stacked vertically. No fancy animations needed — a simple show/hide with CSS transition is fine.
- Header should be:
  - `position: sticky; top: 0; z-index: 100;`
  - Background: `rgba(11, 14, 26, 0.85)` with `backdrop-filter: blur(8px);` so it stays readable when content scrolls behind it
  - Border-bottom: `1px solid var(--border-subtle);`
  - Padding: 16px 24px on mobile, 20px 48px on desktop
- Make sure the same header markup is used on all six pages (copy-paste; no template engine needed).

---

## HIGH PRIORITY — visual polish that matters

### 6. Package card hover should glow outward, not inward

**Problem:** Current hover uses `inset` shadow which feels muted on a dark background.

**Fix in `styles.css`:**

Replace:
```css
.pkg-card:hover {
  border-color: var(--border-accent);
  box-shadow: inset 0 0 20px var(--accent-glow);
  transform: translateY(-4px);
}
```

With:
```css
.pkg-card:hover {
  border-color: var(--border-accent);
  box-shadow:
    0 0 30px rgba(255, 107, 53, 0.2),
    0 8px 24px rgba(0, 0, 0, 0.4);
  transform: translateY(-4px);
}
```

This makes cards feel like they lift off the page with an orange aura, matching the design reference mockup.

---

### 7. CTA button letter-spacing is missing

**Problem:** The orange pill buttons use display font and uppercase but no letter-spacing rule, so they default to normal spacing — feels less premium than the mockup.

**Fix in `styles.css`:**

In the `.btn-orange-pill` rule, add:
```css
letter-spacing: var(--tracking-wide);
```

---

### 8. Pause the radio when commission form is submitted

**Problem:** If a user has the radio playing and submits the commission form, the audio keeps playing through the success message. Minor but jarring UX.

**Fix in `main.js`:**

Inside the commission form `submit` event handler, before the `emailjs.send()` call, add:
```js
const mainAudioPlayer = document.querySelector('audio');
if (mainAudioPlayer && !mainAudioPlayer.paused) {
  mainAudioPlayer.pause();
}
```

---

### 9. Verify Cloudflare Web Analytics token is the production one

**Problem:** The token `5fdf447c3cba4ccd9f7b45aa0d13e518` is hardcoded across all pages. The user needs to confirm this is the correct token for the live aifrobeats.com site.

**Fix:** No code change needed. Just flag in the build summary: "Cloudflare Web Analytics token currently set to `5fdf447c3cba4ccd9f7b45aa0d13e518` across all 6 HTML files. User should verify this matches their production Cloudflare Web Analytics setup before launch."

---

## MEDIUM PRIORITY — nice improvements

### 10. AOS scroll animations may not be loaded on every page

**Problem:** `drops.html` loads AOS, but other pages with `data-aos` attributes may not.

**Fix:** Confirm AOS CSS and JS are loaded in `index.html`. If not, add:
```html
<link href="https://unpkg.com/aos@2.3.1/dist/aos.css" rel="stylesheet">
```
in the `<head>` and:
```html
<script src="https://unpkg.com/aos@2.3.1/dist/aos.js"></script>
```
before `</body>`. Don't add AOS to pages that don't need it (about, legal, licensing).

---

### 11. Drop card waveform SVG is inlined in a JS template literal

**Problem:** The animated SVG for drop card waveforms is hardcoded inside a template string in `main.js`, making it ugly to maintain.

**Fix:** Refactor by creating a JS function `createWaveformSVG()` that returns the SVG element (or HTML string), then call it inside the drop card template. Functionality stays identical; just cleaner code.

This is optional — skip if time is tight.

---

### 12. Licensing page bullet list may not render bullets

**Problem:** `.prose ul { list-style-type: disc; }` may be overridden by Tailwind's preflight reset depending on cascade order.

**Fix:** Test visually. If bullets aren't showing, change to:
```css
.prose ul { list-style-type: disc; padding-left: 1.5rem; }
.prose ul li { display: list-item; }
```

If still not rendering, escalate with `!important` on `list-style-type`.

---

### 13. Footer column headers could use brand color treatment

**Problem:** Footer column titles ("EXPLORE", "INFO", "LET'S TALK") are plain white. A subtle orange accent would tie them visually to the brand.

**Fix in `styles.css`:** Add:
```css
footer h4 {
  color: var(--accent-primary);
}
```

Or apply directly in the markup via a Tailwind class like `text-accent-primary` (or whatever the existing utility is). Either approach is fine.

---

## LOW PRIORITY — final polish before launch

### 14. Add favicon

**Fix:** Create or generate a simple favicon (32x32 PNG of the AIFROBEATS "A" or wordmark, on transparent or dark background) and add to all pages:
```html
<link rel="icon" type="image/png" href="/images/favicon.png">
```
Place file at `/images/favicon.png`. If no favicon exists yet, create a placeholder using just the letter "A" in Archivo Black on a sunset orange background.

---

### 15. Add basic meta tags for sharing

**Fix:** In every HTML page's `<head>`, add:
```html
<meta name="description" content="Custom Afrobeats songs, made for the people you love. In hours, not weeks. Commission yours at aifrobeats.com.">
<meta property="og:title" content="Aifrobeats — Custom Afrobeats Songs">
<meta property="og:description" content="Afrobeats songs, made for the people you love. In hours, not weeks.">
<meta property="og:type" content="website">
<meta property="og:url" content="https://aifrobeats.com">
<meta name="twitter:card" content="summary_large_image">
```

When the user has a real social-share image (1200x630px), add `<meta property="og:image" content="/images/og-image.jpg">` too.

---

### 16. Add `robots.txt` and `sitemap.xml`

**Fix:** Create `/robots.txt`:
```
User-agent: *
Allow: /
Sitemap: https://aifrobeats.com/sitemap.xml
```

Create `/sitemap.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://aifrobeats.com/</loc><priority>1.0</priority></url>
  <url><loc>https://aifrobeats.com/about.html</loc><priority>0.7</priority></url>
  <url><loc>https://aifrobeats.com/drops.html</loc><priority>0.8</priority></url>
  <url><loc>https://aifrobeats.com/licensing.html</loc><priority>0.5</priority></url>
  <url><loc>https://aifrobeats.com/legal.html</loc><priority>0.3</priority></url>
  <url><loc>https://aifrobeats.com/commission.html</loc><priority>0.6</priority></url>
</urlset>
```

---

## Final verification checklist (run through after fixes)

Before declaring the site done, manually verify:

- [ ] Radio player loads, plays a random track, and queues another when one ends
- [ ] Waveform bars actually animate at varying heights when radio is playing
- [ ] Each of the four package cards plays its preview audio when clicked
- [ ] Playing one preview pauses the others (and the radio)
- [ ] Commission form: visiting `/commission.html?package=happy-birthday` shows only birthday-specific fields
- [ ] Commission form: visiting `/commission.html` (no param) shows the package selector dropdown
- [ ] Commission form submission triggers EmailJS and shows the success message
- [ ] FAQ accordion: clicking a question opens it, clicking another closes the first and opens the second
- [ ] All nav links work on every page (no 404s, correct anchor scrolling)
- [ ] Mobile (375px width simulated): no horizontal scroll, hamburger nav works, all tap targets feel comfortable
- [ ] All images load (mlogo.png, cartoon_producer.png, favicon)

---

## What NOT to change

- Do not modify any colors in the design system
- Do not change any copy, hooks, prices, or FAQ answers
- Do not modify the package structure or order
- Do not change the dark theme to something lighter
- Do not add new sections to the homepage
- Do not redesign the audio player visually
- Do not change Cloudflare Analytics integration approach

---

End of punch list.
