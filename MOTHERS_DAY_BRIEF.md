# Aifrobeats — Mother's Day Campaign Page

This is an addition to the existing site. Build a single new campaign landing page at `/mothersday.html` and create one new product on Gumroad. Use the existing design system (`/css/styles.css`) — do not introduce new colors, fonts, or components. The page should look and feel like the rest of the site, just with campaign-specific copy.

The user has separately set up a Gumroad product for the album upsell. The CTA on this page will link to that Gumroad URL.

---

## 1. Create `mothersday.html` at the project root

Use `index.html` as a structural starting point — same `<head>` (Cloudflare Analytics, Google Fonts, Tailwind, styles.css), same site header with nav, same footer. Strip out everything else from the body and replace with the sections below.

### Page metadata

```html
<title>Aifrobeats | Free Mother's Day Song</title>
<meta name="description" content="Free Afrobeats song for your mom this Mother's Day. Delivered May 7th. First 40 requests only.">
<meta property="og:title" content="A Free Mother's Day Song for Your Mom">
<meta property="og:description" content="Tell us her name and a story. We'll make her a song. Delivered May 7th.">
<meta property="og:url" content="https://aifrobeats.com/mothersday.html">
```

---

## 2. Hero section

Same dark theme as the rest of the site. Centered, generous vertical padding, minimal — let the message breathe.

**Eyebrow text** (small, uppercase, tracking-wide, accent-secondary red, above headline):
> MOTHER'S DAY · MAY 7TH

**Headline** (`text-hero`, font-display, uppercase, white, two lines, period at end of each line is intentional):
> A FREE AFROBEATS SONG. / FOR THE WOMAN WHO RAISED YOU.

**Subhead** (font-body, text-secondary, italic, 1.1rem, max-width 600px, centered):
> Tell us her name and one thing she always says. We'll make her a song — yours to keep, hers to play forever. Free for the first 40 requests.

**Deadline callout** (small, font-display uppercase, tracking-wide, accent-primary, with a thin orange divider line above and below):
> SUBMIT BY TUESDAY MAY 6TH · DELIVERED WEDNESDAY MAY 7TH

No CTA button in the hero. The form below IS the CTA. The user should scroll one screen and start filling it in. Do not add a "scroll for more" arrow or any decoration — keep it clean.

---

## 3. Spot counter (small, just below hero)

A small, centered element that conveys urgency without being pushy.

**Markup:**
```html
<div class="spot-counter">
  <span class="spot-dot"></span>
  <span><strong id="spots-left">40</strong> FREE SONGS AVAILABLE</span>
</div>
```

**Styling (add to styles.css):**
```css
.spot-counter {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 10px 20px;
  border: 1px solid var(--border-accent);
  border-radius: 999px;
  background-color: rgba(255, 107, 53, 0.05);
  font-family: var(--font-display);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  font-size: 0.75rem;
  color: var(--text-secondary);
}
.spot-counter strong {
  color: var(--accent-primary);
}
.spot-dot {
  width: 8px;
  height: 8px;
  background-color: var(--accent-primary);
  border-radius: 50%;
  animation: pulse-dot 2s infinite;
}
```

For now, hardcode the number `40`. The user will manually update this number as requests come in (just edit the HTML). Do NOT build any backend counter logic.

Wrap the counter in a centered div below the hero with margin-top of 32px.

---

## 4. Audio sample (a "this is what it'll sound like" preview)

Below the spot counter, before the form. A simple, single audio player — uses the same styling as the homepage radio player but with a static title.

**Section heading:** HEAR THE VIBE.

**Layout:** Same audio player container styling as the homepage radio (`.audio-player-container`), but with:
- Static track title: "FOR YOUR MOTHER (SAMPLE)"
- No "LIVE" indicator
- A simple play button + waveform + time display
- Caption beneath: *A taste of what your mom's song could feel like.*

**Audio file path:** `/music/samples/mothersday-sample.mp3` — user will provide this file. For now, reference the path; if the file is missing, the player should fail gracefully (just show the player UI without crashing).

Implementation can be a simplified copy of the radio player JS — single track, no rotation, no random pick. Or just use a basic `<audio controls>` tag styled to match. Either approach is fine.

---

## 5. The form

This is the conversion moment. Keep it short — 5 fields total.

**Section heading:** HER STORY.

**Subheading:** Tell us about her. We'll make a song from what you give us.

### Form fields (all required)

1. **Your name** — text input
2. **Mom's name (as you want it sung)** — text input. Helper text: *Phonetic spelling helps if her name is uncommon.*
3. **One thing she always says, OR a short story about her** — textarea, 4 rows. Helper text: *Could be a phrase, an inside joke, a memory — anything that captures her.*
4. **Preferred delivery method** — radio buttons: WhatsApp / Email
5. **Contact for delivery** — text input. Conditional helper text based on delivery method (same logic as commission form): "Your phone number with country code" for WhatsApp, "Your email address" for Email.

### Form styling

Use the existing `.form-input`, `.form-label`, `.form-radio-label` classes from `styles.css`. No new styles needed.

### Submit button

Full-width pill, accent-primary, font-display uppercase white, with glow. Label:
> SEND HER STORY →

While submitting, change to "SENDING..." and disable.

### EmailJS submission

Use the same EmailJS Service ID and Public Key as the commission form. **Create a new template** for Mother's Day requests OR reuse the existing template with a different subject prefix.

Subject line:
```
[MOTHERS DAY 2026] {{your_name}} - for {{moms_name}}
```

Required fields to include in the email body:
- your_name
- moms_name
- her_story
- delivery_method
- contact_detail
- timestamp (auto-generated, ISO format)

If a new template ID is needed, use placeholder `template_mothersday` and flag it for the user to swap with their real template ID.

### Success state

Replace the form with a success message in the same container:

> **GOT HER NAME. WE'RE ON IT.**
>
> Your request is in. We'll make her song and deliver via [their chosen contact method] on Wednesday May 7th.
>
> While you wait, follow us on Instagram for behind-the-scenes — and tell another friend whose mom deserves one. We're capping at 40 requests total.
>
> [INSTAGRAM LINK BUTTON]
>
> — Aifrobeats

Same visual styling as the commission form's success state.

---

## 6. The album upsell section

This is where the campaign earns money. Below the form, prominent, distinct from the free-song flow but not pushy.

**Section heading:** WANT MORE THAN A SONG?

**Subheading (font-body, text-secondary, italic, max-width 600px):**
> The free song is one moment. An album is her whole story.

### Card layout (single, large card — center-aligned)

Use a wider variant of the existing `.pkg-card` styling. Roughly 600px max-width on desktop, full-width on mobile. Same dark background, thin border, padding similar to existing package cards.

**Inside the card, top to bottom:**

1. **Eyebrow** (small, uppercase, tracking-wide, accent-primary):
   > AIFROBEATS ALBUM · MOTHER'S DAY EDITION

2. **Title** (font-display uppercase, white, `text-card-title` size):
   > THREE SONGS. ONE STORY. ALL HERS.

3. **Body copy** (font-body, text-secondary, regular weight, line-height 1.6):
   > Three custom Afrobeats songs made just for your mom — each capturing a different chapter of who she is. Her energy. Her struggle. Her joy. Delivered as a single album she'll play for years.
   >
   > Briefed via WhatsApp after purchase. Delivered before Mother's Day if ordered by Tuesday May 6th.

4. **Pricing block** (centered, with visual hierarchy):
   - Original price (text-muted, strikethrough, smaller): *$105*
   - New price (font-display, accent-primary, large — like 2.5rem):
     **$49**
   - Below price (text-muted, font-body, italic, small):
     *Save $56 vs. our regular three-song pricing*

5. **CTA button** (orange pill, full-width inside card, font-display uppercase, with glow):
   > GET HER THE ALBUM →

   Link goes to the Gumroad URL (user will provide — use placeholder `https://aifrobeats.gumroad.com/l/mothersday-album` for now).

6. **Tiny reassurance text below button** (text-muted, font-body, 0.75rem, centered):
   > Briefed via WhatsApp after purchase · Delivered before Mother's Day · Pay securely via Gumroad

### Spacing

The album upsell needs visual breathing room from the form above it. Use `margin-top: 96px` between the form's success/submit area and this section. On mobile, `margin-top: 64px`.

Add a thin orange divider line between the form section and the album section.

---

## 7. FAQ (mini version, 3 questions only)

A compact accordion below the album upsell. Reuse the existing `.faq-item` styling.

**Section heading:** QUICK QUESTIONS.

**Q1: When will my song be delivered?**
> All free Mother's Day songs are delivered on Wednesday May 7th, the day before Mother's Day. We'll send to whichever contact method you chose. Album orders ship in the order they're received — order by Tuesday May 6th to get yours before Mother's Day itself.

**Q2: What if I miss the cutoff or all 40 spots fill up?**
> If you miss it, we still got you — our regular packages start at $15 and turn around in hours. You can commission a birthday or "for her" song any day of the year. Or just save us for next Mother's Day.

**Q3: Can the song be in another language?**
> Yes. Yoruba, Igbo, Hausa, French, Spanish, Pidgin — whatever language she speaks at home, we'll work it into the song. Just mention it in the "story" field above.

First question open by default.

---

## 8. Footer (same as rest of site)

Use the standard site footer. No campaign-specific changes needed here.

---

## 9. Header changes for this page only

The site-wide header should appear on this page too — but with one tweak:

In the nav, add a temporary link "MOTHER'S DAY" (uppercase, accent-primary color, font-body) as the first link, before "Home". This gets removed after the campaign ends. Simply edit it out of `mothersday.html`'s header on May 8th — don't touch the other pages.

---

## 10. Gumroad product setup (user task — happens outside Claude Code)

The user will set this up directly on Gumroad. Confirmation that it exists is needed before going live with the ad, but it does not affect the build:

- **Product:** Aifrobeats Mother's Day Album
- **Price:** $49
- **Post-purchase redirect or message:** "Thanks for ordering. To brief us on your album, send a WhatsApp message to +234 805 371 7830 with your Gumroad order ID and a note about your mom (her personality, key memories, what kind of vibe you want for each of the three songs). We'll respond within 4 hours and deliver before Mother's Day."

The user will paste the real Gumroad URL into the album CTA before launch.

---

## 11. Performance & polish notes

- Keep this page lightweight. No new heavy assets, no new fonts, no new libraries.
- The Mother's Day sample audio file should be 20-30 seconds, max 1MB. User will provide.
- Do not add a video, animation library, or hero illustration. The text and form do the work.
- Test mobile (375px) before declaring done. Hero must be readable, form fields must be tappable, album CTA must be reachable in one scroll from the form success.
- Cloudflare Web Analytics snippet (same token as other pages) goes in the `<head>` just like every other page. The user wants to track this campaign's traffic separately if possible — Cloudflare's referrer tracking will handle this naturally for Twitter clicks.

---

## 12. Final verification before launch

Before declaring done, the user should manually confirm:

- [ ] `mothersday.html` loads at the project root
- [ ] Site header with nav (including new "MOTHER'S DAY" link) appears
- [ ] Hero copy reads correctly, eyebrow shows date, deadline callout is visible
- [ ] Spot counter shows "40 FREE SONGS AVAILABLE" with pulsing dot
- [ ] Sample audio player loads (even if file is still missing — should fail gracefully)
- [ ] Form: all 5 fields render, required validation works, conditional contact helper text changes based on delivery method
- [ ] Form submission triggers EmailJS (test with dummy data and verify email receipt)
- [ ] Success state appears after submission, replaces form
- [ ] Album upsell card appears below form, with strikethrough $105 and prominent $49
- [ ] Album CTA links to Gumroad (URL placeholder is fine for build; user pastes real URL before launch)
- [ ] FAQ accordion works (3 questions, first open by default)
- [ ] Mobile (375px): no horizontal scroll, all CTAs tappable, layout stacks cleanly
- [ ] Cloudflare Analytics snippet present in head

---

## What NOT to do

- Do not redesign anything from the existing site
- Do not add a sidebar, popup, or interstitial
- Do not add countdown timers or fake urgency tactics beyond the existing spot counter
- Do not add a "share with a friend" widget — the success message handles this with copy
- Do not add the album as a permanent fifth package on the homepage — that's a separate decision for after the campaign
- Do not modify the existing commission.html, index.html, or other pages (other than adding the temporary "MOTHER'S DAY" nav link to the site-wide header on this campaign page only)

---

End of Mother's Day campaign brief.
