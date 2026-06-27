# Aifrobeats — EmailJS Dual-Send + Form Updates + Mother's Day Overflow

This adds three things to the existing Aifrobeats site:

1. An optional email field on all forms so buyers using WhatsApp delivery can still receive confirmation emails
2. Dual EmailJS send logic — admin notification + warm buyer confirmation
3. Mother's Day overflow handling for when the 40 free song slots fill up

Read the whole document before starting. Apply changes in the order listed.

**Template IDs to use:**
- Universal admin template: `template_fnabhb3` (existing, unchanged)
- Buyer confirmation template: `template_519ozz5` (new, already created)
- Service ID: `service_4vh02fv`
- Public Key: `u899JogrVD_YHNQIU`

---

## PART 1 — Add optional email field to ALL forms

The optional email field appears on every form whenever the user picks a non-Email delivery method (WhatsApp or Telegram). It's a graceful way to capture an email for confirmation without forcing it.

### 1A. Field markup pattern

Add this markup to BOTH `commission.html` AND `mothersday.html`, immediately AFTER the existing `#contact-field-container` (the conditional contact-detail field that appears after the user picks their delivery method).

```html
<!-- Optional email for confirmation when delivery is non-Email -->
<div id="optional-email-container" class="hidden mt-4">
  <label for="confirmation_email" class="form-label">
    Want a confirmation email? <span class="text-muted normal-case tracking-normal">(optional)</span>
  </label>
  <input
    type="email"
    id="confirmation_email"
    name="confirmation_email"
    class="form-input"
    placeholder="your@email.com"
    inputmode="email"
    autocomplete="email">
  <p class="text-muted text-xs mt-2 italic">We'll send a confirmation email so you have a record of your brief. We won't add you to any list.</p>
</div>
```

The container is hidden by default. JavaScript shows it when delivery_method is WhatsApp or Telegram, hides it when delivery_method is Email (since the contact_detail field will already be an email in that case).

### 1B. Logic to show/hide the optional email field

In `main.js`, find the existing delivery method radio handler:

```js
const deliveryMethods = document.querySelectorAll('input[name="delivery_method"]');
const contactField = document.getElementById('contact-field-container');
const contactInput = document.getElementById('contact_detail');

deliveryMethods.forEach(radio => {
  radio.addEventListener('change', (e) => {
    contactField.classList.remove('hidden');
    contactInput.setAttribute('required', 'required');
    contactInput.placeholder = e.target.value === 'Email' ? 'Your email address' : 'Your phone number with country code';
  });
});
```

Replace with:

```js
const deliveryMethods = document.querySelectorAll('input[name="delivery_method"]');
const contactField = document.getElementById('contact-field-container');
const contactInput = document.getElementById('contact_detail');
const optionalEmailContainer = document.getElementById('optional-email-container');
const optionalEmailInput = document.getElementById('confirmation_email');

deliveryMethods.forEach(radio => {
  radio.addEventListener('change', (e) => {
    const method = e.target.value;
    contactField.classList.remove('hidden');
    contactInput.setAttribute('required', 'required');

    if (method === 'Email') {
      contactInput.placeholder = 'Your email address';
      contactInput.setAttribute('inputmode', 'email');
      // Hide optional email — contact_detail is already the email
      if (optionalEmailContainer) {
        optionalEmailContainer.classList.add('hidden');
        if (optionalEmailInput) optionalEmailInput.value = '';
      }
    } else {
      contactInput.placeholder = 'Your phone number with country code';
      contactInput.setAttribute('inputmode', 'tel');
      // Show optional email field
      if (optionalEmailContainer) {
        optionalEmailContainer.classList.remove('hidden');
      }
    }
  });
});
```

Apply the same pattern to the Mother's Day form's submit handler in `mothersday.html` (or its inline script) — same field markup, same show/hide logic.

---

## PART 2 — Update Commission Form Submit Handler in main.js

Find the existing commission form submit handler. Find the `emailjs.send(...)` call. Replace the entire submission block (from "Set subject prefix based on package" through the end of the `.then()` chain) with the following:

```js
// --- Set conditional flags for template ---
data.is_for_her_him = data.selected_package === 'for-her-for-him';
data.is_birthday = data.selected_package === 'happy-birthday';
data.is_wedding = data.selected_package === 'walk-down-the-aisle';
data.is_big_vibes = data.selected_package === 'big-vibes';

// --- Auto-timestamp in Lagos time ---
data.timestamp = new Date().toLocaleString('en-US', {
  timeZone: 'Africa/Lagos',
  dateStyle: 'medium',
  timeStyle: 'short'
});

// --- Subject prefix and detail ---
const prefixes = {
  'for-her-for-him': '[FOR HER/HIM]',
  'happy-birthday': '[BIRTHDAY]',
  'walk-down-the-aisle': '[WEDDING]',
  'big-vibes': '[BIG VIBES]'
};
data.subject_prefix = prefixes[data.selected_package] || '[COMMISSION]';

if (data.selected_package === 'for-her-for-him') data.subject_detail = data.partner_name || '';
else if (data.selected_package === 'happy-birthday') data.subject_detail = data.birthday_name || '';
else if (data.selected_package === 'walk-down-the-aisle') data.subject_detail = (data.partner_1 && data.partner_2) ? `${data.partner_1} & ${data.partner_2}` : '';
else if (data.selected_package === 'big-vibes') data.subject_detail = data.business_name || '';

// --- Determine which email to send buyer confirmation to ---
// If delivery is Email, use contact_detail. Otherwise check for optional confirmation_email.
const buyerEmail = data.delivery_method === 'Email'
  ? data.contact_detail
  : (data.confirmation_email && data.confirmation_email.trim() ? data.confirmation_email.trim() : null);

// --- Build buyer-facing copy per package ---
const buyerMessages = {
  'for-her-for-him': {
    subject: `Got it — ${data.partner_name || 'their'} song is being made`,
    intro: `Your brief just landed and we love it. We're starting work on ${data.partner_name || 'their'} song right now — every detail you shared is about to become a real Afrobeats record they can play forever.`,
    next: `You'll get your song delivered via ${data.delivery_method} within hours. Before final delivery, we'll send a 20-30 second preview to make sure we're going in the right direction. The clock is ticking — in a good way.`
  },
  'happy-birthday': {
    subject: `Got it — ${data.birthday_name || 'their'} birthday song is on the way`,
    intro: `Your brief just landed. We're making ${data.birthday_name || 'their'} birthday song right now and yes, their actual name will be in it.`,
    next: `Your song will be delivered via ${data.delivery_method} within 2-3 hours (or by your requested date if later). Before final delivery, we'll send a 20-30 second preview so you can confirm it's hitting the right vibe.`
  },
  'walk-down-the-aisle': {
    subject: `Got it — ${data.partner_1 || ''} & ${data.partner_2 || ''}'s wedding song is being made`,
    intro: `Your brief just landed. We're starting on ${data.partner_1 || ''} and ${data.partner_2 || ''}'s wedding song — and we treat these like the once-in-a-lifetime moments they are.`,
    next: `Your song will be delivered via ${data.delivery_method} within 3 days. You'll get both vocal AND instrumental versions in WAV. Before final delivery, we'll send you a preview to confirm direction. Two revisions are included if anything needs adjusting.`
  },
  'big-vibes': {
    subject: `Got it — ${data.business_name || 'your'} jingle is being made`,
    intro: `Your brief landed and we love the direction. We're starting work on ${data.business_name || 'your'} jingle right now.`,
    next: `Your jingle will be delivered via ${data.delivery_method} within 24 hours. Before final delivery, we'll send a preview so you can confirm the energy and pronunciation are right. Two revisions included if needed.`
  }
};

const buyerCopy = buyerMessages[data.selected_package] || {
  subject: 'Got your commission — your song is being made',
  intro: 'Your brief just landed. We\'re starting work right now.',
  next: `Your song will be delivered via ${data.delivery_method} within your turnaround. We'll send a preview before final delivery.`
};

data.buyer_subject = buyerCopy.subject;
data.intro_message = buyerCopy.intro;
data.next_steps = buyerCopy.next;

// --- Pause the radio if it's playing (clean UX during success state) ---
const mainAudioPlayer = document.querySelector('audio');
if (mainAudioPlayer && !mainAudioPlayer.paused) {
  mainAudioPlayer.pause();
}

// --- Dual send: admin notification first, then buyer confirmation if we have an email ---
let adminSendSucceeded = false;

emailjs.send('service_4vh02fv', 'template_fnabhb3', data, 'u899JogrVD_YHNQIU')
  .then(() => {
    adminSendSucceeded = true;
    // Send buyer confirmation if we have an email address for them
    if (buyerEmail) {
      const buyerData = { ...data, contact_detail: buyerEmail };
      return emailjs.send('service_4vh02fv', 'template_519ozz5', buyerData, 'u899JogrVD_YHNQIU');
    }
    return Promise.resolve();
  })
  .then(() => {
    document.getElementById('form-container').classList.add('hidden');
    document.getElementById('success-message').classList.remove('hidden');
    window.scrollTo(0, 0);
  })
  .catch((error) => {
    console.error('EmailJS error:', error);
    if (!adminSendSucceeded) {
      // Admin send failed — order is NOT recorded, alert the buyer
      alert('Failed to send the brief. Please try again or message us on WhatsApp at +234 805 371 7830.');
      submitBtn.innerText = 'SEND BRIEF →';
      submitBtn.disabled = false;
    } else {
      // Admin send succeeded but buyer confirmation failed — order IS recorded, show success
      console.warn('Buyer confirmation email failed but admin notification succeeded.');
      document.getElementById('form-container').classList.add('hidden');
      document.getElementById('success-message').classList.remove('hidden');
      window.scrollTo(0, 0);
    }
  });
```

Replace any earlier `emailjs.send(...)` block in the commission form submit handler with the above. Make sure no duplicate logic remains.

---

## PART 3 — Mother's Day Form Submit Handler

The Mother's Day page form has its own submit handler (or will, once the page is built per the existing brief). Apply the same dual-send pattern with Mother's Day-specific copy.

In whichever script handles the Mother's Day form submission (likely inline in `mothersday.html` or in `main.js` if scoped that way), the submit handler should look like this:

```js
// Inside the Mother's Day form submit handler, after collecting form data:
const formData = new FormData(mothersdayForm);
const data = Object.fromEntries(formData.entries());

// --- Mother's Day specific flags & metadata ---
data.is_mothersday = true;
data.subject_prefix = '[MOTHERS DAY 2026]';
data.subject_detail = `for ${data.moms_name || 'her'}`;
data.timestamp = new Date().toLocaleString('en-US', {
  timeZone: 'Africa/Lagos',
  dateStyle: 'medium',
  timeStyle: 'short'
});

// --- Buyer email determination ---
const buyerEmail = data.delivery_method === 'Email'
  ? data.contact_detail
  : (data.confirmation_email && data.confirmation_email.trim() ? data.confirmation_email.trim() : null);

// --- Mother's Day buyer copy ---
data.buyer_subject = `Got it — ${data.moms_name || 'her'} song is being made`;
data.intro_message = `Your request just landed. ${data.moms_name || 'Her'} song is officially in the queue, and we're going to make her something she'll play for years.`;
data.next_steps = `Your free Mother's Day song will be delivered via ${data.delivery_method} on Wednesday May 7th — the day before Mother's Day itself. We're capping at 40 free songs total, so we're working through them in the order they came in. You're locked in.`;

// --- Dual send ---
let adminSendSucceeded = false;

emailjs.send('service_4vh02fv', 'template_fnabhb3', data, 'u899JogrVD_YHNQIU')
  .then(() => {
    adminSendSucceeded = true;
    if (buyerEmail) {
      const buyerData = { ...data, contact_detail: buyerEmail };
      return emailjs.send('service_4vh02fv', 'template_519ozz5', buyerData, 'u899JogrVD_YHNQIU');
    }
    return Promise.resolve();
  })
  .then(() => {
    // Show Mother's Day success state per the campaign brief
    document.getElementById('mothersday-form-container').classList.add('hidden');
    document.getElementById('mothersday-success').classList.remove('hidden');
    window.scrollTo(0, 0);
  })
  .catch((error) => {
    console.error('EmailJS error:', error);
    if (!adminSendSucceeded) {
      alert('Something went wrong. Please try again or DM us on WhatsApp at +234 805 371 7830 — we want to make sure your mom gets her song.');
      const submitBtn = document.getElementById('mothersday-submit-btn');
      if (submitBtn) {
        submitBtn.innerText = 'SEND HER STORY →';
        submitBtn.disabled = false;
      }
    } else {
      document.getElementById('mothersday-form-container').classList.add('hidden');
      document.getElementById('mothersday-success').classList.remove('hidden');
      window.scrollTo(0, 0);
    }
  });
```

---

## PART 4 — Mother's Day Overflow Handling (when 40 slots fill)

When the Mother's Day campaign hits the 40-spot cap, the page needs to gracefully handle additional traffic. Instead of just disabling the form, we redirect their energy into a paid commission with a small discount code as compensation for missing the free window.

### 4A. Add a "campaign closed" flag

At the top of the `<body>` of `mothersday.html`, add:

```html
<!-- Mother's Day campaign state. Set data-campaign-state="closed" to switch the page into overflow mode. -->
<div id="mothersday-state" data-campaign-state="open" class="hidden"></div>
```

The user manually changes `data-campaign-state="open"` to `data-campaign-state="closed"` in the HTML when 40 requests are reached. No backend logic — this is a manual switch, same pattern as the spot counter.

### 4B. Build the closed-state markup

Add this section to `mothersday.html`, immediately after the existing form section, hidden by default:

```html
<!-- Overflow / campaign closed state -->
<section id="mothersday-closed" class="hidden px-4 py-16">
  <div class="max-w-2xl mx-auto text-center">

    <div class="inline-flex items-center gap-3 px-5 py-3 rounded-full mb-8" style="border: 1px solid var(--border-accent); background-color: rgba(255, 107, 53, 0.08);">
      <span class="font-display text-xs uppercase tracking-wide" style="color: var(--accent-primary);">ALL 40 FREE SLOTS ARE FULL</span>
    </div>

    <h2 class="font-display text-white uppercase mb-6" style="font-size: var(--text-section); line-height: 1.2;">
      WE FILLED UP FAST. <br>BUT YOUR MOM STILL DESERVES A SONG.
    </h2>

    <p class="text-secondary text-lg mb-12 italic" style="line-height: 1.6;">
      The free 40 went quicker than we expected. If your mom still deserves an Afrobeats song this Mother's Day — and she does — here's what we can do.
    </p>

    <!-- Overflow offer card -->
    <div class="pkg-card text-left" style="max-width: 540px; margin: 0 auto;">

      <p class="font-display uppercase tracking-wide text-xs mb-4" style="color: var(--accent-primary);">
        MOTHER'S DAY OVERFLOW · 30% OFF
      </p>

      <h3 class="font-display text-white uppercase mb-3" style="font-size: var(--text-card-title);">
        A FULL CUSTOM SONG FOR YOUR MOM.
      </h3>

      <p class="text-secondary mb-6" style="line-height: 1.6;">
        Same craft as the free songs — just paid this time, and 30% off our regular For Her / For Him rate as a thank-you for caring enough to come this far. Delivered before Mother's Day if ordered by Tuesday May 6th.
      </p>

      <div class="text-center mb-6">
        <p class="text-muted text-sm" style="text-decoration: line-through;">$35</p>
        <p class="font-display" style="font-size: 2.5rem; color: var(--accent-primary); line-height: 1;">$24.50</p>
        <p class="text-muted text-xs italic mt-2">Use code MOTHERSDAY30 at checkout</p>
      </div>

      <a
        href="https://aifrobeats.gumroad.com/l/for-her-for-him?wanted=true"
        class="btn-orange-pill glow-orange uppercase text-sm w-full text-center"
        style="display: block;">
        GET HER A SONG ANYWAY →
      </a>

      <p class="text-muted text-xs italic mt-4 text-center">
        Or commission the full <a href="https://aifrobeats.gumroad.com/l/aifrobeats-album" style="color: var(--accent-primary); text-decoration: underline;">Aifrobeats Album</a> — three songs for $49 (no extra discount, but it's already half what they cost individually).
      </p>

    </div>

    <p class="text-muted text-sm mt-12 italic">
      Want first dibs on the next free campaign? Follow us on
      <a href="#" style="color: var(--accent-primary); text-decoration: underline;">Instagram</a> and
      <a href="#" style="color: var(--accent-primary); text-decoration: underline;">Twitter</a> — Father's Day is June 21st.
    </p>

  </div>
</section>
```

### 4C. JavaScript to switch state

Add this near the top of `mothersday.html`'s page-specific script (before the form handler):

```js
// --- Check campaign state on load ---
const stateEl = document.getElementById('mothersday-state');
const campaignState = stateEl ? stateEl.getAttribute('data-campaign-state') : 'open';

if (campaignState === 'closed') {
  // Hide the open-state sections
  const heroSection = document.getElementById('mothersday-hero');
  const spotCounter = document.querySelector('.spot-counter');
  const sampleSection = document.getElementById('mothersday-sample-section');
  const formSection = document.getElementById('mothersday-form-container');

  if (heroSection) heroSection.classList.add('hidden');
  if (spotCounter) spotCounter.parentElement.classList.add('hidden');
  if (sampleSection) sampleSection.classList.add('hidden');
  if (formSection) formSection.classList.add('hidden');

  // Show the closed-state section
  const closedSection = document.getElementById('mothersday-closed');
  if (closedSection) closedSection.classList.remove('hidden');

  // Update page title
  document.title = 'Aifrobeats | Mother\'s Day — All Free Slots Full';
}
```

The IDs assumed (`mothersday-hero`, `mothersday-sample-section`, `mothersday-form-container`) should match what was built per the original Mother's Day brief. If different IDs were used, adjust the selectors accordingly.

### 4D. Ensure the album upsell + FAQ stay visible

The album upsell section ("WANT MORE THAN A SONG?") and the FAQ should remain visible whether the campaign is open or closed — both work in either state. Don't add them to the hide-list above.

### 4E. How to flip the switch (user-facing, no code)

When the 40th submission arrives, the user opens `mothersday.html` in a text editor, finds:

```html
<div id="mothersday-state" data-campaign-state="open" class="hidden"></div>
```

Changes `"open"` to `"closed"`:

```html
<div id="mothersday-state" data-campaign-state="closed" class="hidden"></div>
```

Saves and re-uploads the file. Page now shows the overflow state instead of the form.

### 4F. Set up the discount code on Gumroad

Before launch, the user needs to manually create a discount code in Gumroad:

1. In Gumroad dashboard → For Her / For Him product → click "Discounts" or "Offer codes" tab
2. Create new code: `MOTHERSDAY30`
3. Type: percentage off — 30%
4. Limit: optional, can leave unlimited or cap at 50 uses
5. Expires: end of day Wednesday May 7th, 2026
6. Apply to: For Her / For Him product (and optionally Happy Birthday too if user wants flexibility)

Without this code set up, the overflow CTA will fail at checkout. Verify before going live.

---

## PART 5 — Final verification checklist

Before declaring done, manually test:

- [ ] **Commission form, Email delivery:** Submit with delivery=Email. Confirm admin email arrives, buyer confirmation arrives at the same email, both have correct package-specific copy.
- [ ] **Commission form, WhatsApp delivery, no optional email:** Submit with delivery=WhatsApp, leave confirmation_email empty. Confirm admin email arrives, NO buyer email sent, success state still shows.
- [ ] **Commission form, WhatsApp delivery, WITH optional email:** Submit with delivery=WhatsApp and a confirmation_email filled in. Confirm admin email arrives AND buyer confirmation arrives at the optional email address.
- [ ] **Optional email field hides correctly** when user picks Email delivery, shows when user picks WhatsApp or Telegram.
- [ ] **Mother's Day form, Email delivery:** Submit with delivery=Email. Confirm both emails arrive with Mother's Day-specific copy.
- [ ] **Mother's Day form, WhatsApp + optional email:** Submit with WhatsApp delivery and a confirmation email. Both emails arrive.
- [ ] **Mother's Day form, WhatsApp no optional email:** Submit. Admin email arrives, no buyer email, success state shows.
- [ ] **Mother's Day overflow:** Manually change `data-campaign-state="closed"` in mothersday.html. Refresh page. Confirm hero/form/sample sections hide and the overflow card shows. Click the discount CTA — confirm it goes to the correct Gumroad URL.
- [ ] **Mother's Day overflow, switch back:** Change state back to `"open"` and refresh — original form returns.
- [ ] **Reply-to behavior:** Open a buyer confirmation email, click Reply. Confirm it auto-fills the user's admin email (not the buyer's).
- [ ] **No JavaScript console errors** on any of the above tests.

---

## What NOT to change

- Do not change the Service ID, Public Key, or any Template IDs
- Do not modify the existing universal admin template (it stays as-is)
- Do not add new EmailJS templates — we're at the 2-template free tier limit
- Do not auto-decrement the spot counter (the user manually edits it)
- Do not auto-detect when 40 slots fill (the user manually flips campaign state)
- Do not modify any other pages (about, drops, licensing, legal) — those are untouched

---

End of build instructions.
