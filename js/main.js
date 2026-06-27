function createWaveformSVG() {
  return `
    <svg class="mb-4" width="40" height="40" viewBox="0 0 40 40">
      <rect x="0" y="15" width="4" height="10" fill="var(--accent-primary)">
        <animate attributeName="height" values="10; 25; 10" dur="1s" repeatCount="indefinite" />
        <animate attributeName="y" values="15; 7.5; 15" dur="1s" repeatCount="indefinite" />
      </rect>
      <rect x="8" y="5" width="4" height="30" fill="var(--accent-primary)">
        <animate attributeName="height" values="30; 15; 30" dur="1.2s" repeatCount="indefinite" />
        <animate attributeName="y" values="5; 12.5; 5" dur="1.2s" repeatCount="indefinite" />
      </rect>
      <rect x="16" y="20" width="4" height="20" fill="var(--accent-primary)">
        <animate attributeName="height" values="20; 35; 20" dur="0.8s" repeatCount="indefinite" />
        <animate attributeName="y" values="20; 2.5; 20" dur="0.8s" repeatCount="indefinite" />
      </rect>
      <rect x="24" y="10" width="4" height="20" fill="var(--accent-primary)">
        <animate attributeName="height" values="20; 10; 20" dur="1.5s" repeatCount="indefinite" />
        <animate attributeName="y" values="10; 15; 10" dur="1.5s" repeatCount="indefinite" />
      </rect>
      <rect x="32" y="15" width="4" height="15" fill="var(--accent-primary)">
        <animate attributeName="height" values="15; 25; 15" dur="1.1s" repeatCount="indefinite" />
        <animate attributeName="y" values="15; 10; 15" dur="1.1s" repeatCount="indefinite" />
      </rect>
    </svg>
  `;
}

const playIconSvg = '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
const pauseIconSvg = '<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';

function resetAudioButton(btn) {
  btn.classList.remove('playing');
  btn.innerHTML = playIconSvg;
}

function setAudioButtonPlaying(btn) {
  btn.classList.add('playing');
  btn.innerHTML = pauseIconSvg;
}

function escapeHtml(value = '') {
  const div = document.createElement('div');
  div.textContent = value;
  return div.innerHTML;
}

function getEmailTemplateDefaultFields() {
  return {
    // Universal fields
    your_name: '',
    order_id: '',
    delivery_method: '',
    contact_detail: '',
    confirmation_email: '',
    timestamp: '',
    subject_prefix: '',
    subject_detail: '',
    selected_package: '',
    package_selection: '',

    // Conditional flags
    is_for_her_him: false,
    is_birthday: false,
    is_wedding: false,
    is_big_vibes: false,
    is_mothersday: false,

    // For Her / For Him fields
    partner_name: '',
    how_met: '',
    shared_thing: '',
    vibe: '',
    occasion: '',
    avoid: '',
    extra_notes: '',

    // Happy Birthday fields
    birthday_name: '',
    relationship: '',
    about_them: '',
    inside_jokes: '',
    needed_by: '',

    // Walk Down The Aisle fields
    partner_1: '',
    partner_2: '',
    wedding_date: '',
    couple_moment: '',
    perspective: '',
    wedding_moment: '',
    tone_balance: '',
    cultural_specifics: '',
    parent_requests: '',

    // Big Vibes fields
    business_name: '',
    pronunciation: '',
    business_description: '',
    tagline: '',
    jingle_placement: '',
    jingle_length: '',
    reference_track: '',

    // Mother's Day fields
    moms_name: '',
    her_story: '',

    // Buyer confirmation copy fields
    buyer_subject: '',
    intro_message: '',
    next_steps: ''
  };
}

function applyEmailTemplateDefaults(data = {}) {
  const defaultFields = getEmailTemplateDefaultFields();

  Object.keys(defaultFields).forEach(key => {
    if (!(key in data) || data[key] === undefined || data[key] === null) {
      data[key] = defaultFields[key];
    }
  });

  return data;
}

function patchEmailjsSendWithDefaults() {
  if (typeof emailjs === 'undefined' || typeof emailjs.send !== 'function' || emailjs.__aifrobeatsDefaultsPatched) {
    return;
  }

  const originalSend = emailjs.send.bind(emailjs);

  emailjs.send = function(serviceId, templateId, templateParams, publicKey) {
    const safeTemplateParams = applyEmailTemplateDefaults({ ...(templateParams || {}) });
    return originalSend(serviceId, templateId, safeTemplateParams, publicKey);
  };

  emailjs.__aifrobeatsDefaultsPatched = true;
}

function formatDropDate(dateValue) {
  const parsedDate = new Date(dateValue);
  if (Number.isNaN(parsedDate.getTime())) return '';

  return parsedDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).toUpperCase();
}

function renderHomepageDrop(drop) {
  const title = escapeHtml(drop.title);
  const caption = escapeHtml(drop.caption);
  const audioFile = escapeHtml(drop.audio_file);
  const formattedDate = formatDropDate(drop.date);
  const dateHtml = formattedDate ? '<p class="text-muted tracking-wide text-tiny mb-3 uppercase">' + formattedDate + '</p>' : '';
  const captionHtml = caption ? '<p class="text-secondary italic text-small mb-4">' + caption + '</p>' : '';
  const socialHtml = drop.social_link ? '<a href="' + escapeHtml(drop.social_link) + '" target="_blank" class="accent-primary tracking-wide text-tiny uppercase font-display flex items-center gap-1">WATCH POST <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg></a>' : '';

  return [
    '<div class="drop-card" data-aos="fade-up">',
    '<div class="flex items-start justify-between gap-4 mb-4">',
    createWaveformSVG(),
    '<button class="drop-play-btn play-btn play-btn-small" data-audio="' + audioFile + '" aria-label="Play drop">' + playIconSvg + '</button>',
    '</div>',
    '<h3 class="font-display text-white text-lg mb-1 uppercase">' + title + '</h3>',
    dateHtml,
    captionHtml,
    socialHtml,
    '</div>',
  ].join('');
}

function renderMediaDrop(drop) {
  const title = escapeHtml(drop.title);
  const caption = escapeHtml(drop.caption);
  const audioFile = escapeHtml(drop.audio_file);
  const formattedDate = formatDropDate(drop.date);
  const dateHtml = formattedDate ? '<p class="text-muted tracking-wide text-tiny mb-3 uppercase">' + formattedDate + '</p>' : '';
  const captionHtml = caption ? '<p class="text-secondary italic text-small mb-0">' + caption + '</p>' : '';

  return [
    '<div class="drop-card drop-media-card" data-aos="fade-up">',
    '<button class="drop-play-btn play-btn media-play-btn" data-audio="' + audioFile + '" aria-label="Play drop">' + playIconSvg + '</button>',
    '<div class="drop-media-copy">',
    '<h3 class="font-display text-white uppercase mb-2">' + title + '</h3>',
    dateHtml,
    captionHtml,
    '</div>',
    '</div>',
  ].join('');
}

document.addEventListener('DOMContentLoaded', () => {
  // Initialize AOS if available
  if (typeof AOS !== 'undefined') {
    AOS.init({
      once: true,
      offset: 50,
      duration: 600,
      easing: 'ease-out-cubic',
    });
  }

  patchEmailjsSendWithDefaults();

  // --- FAQ Accordion Logic ---
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      // Close all
      faqItems.forEach(i => i.classList.remove('open'));
      // Open clicked if it was not open
      if (!isOpen) {
        item.classList.add('open');
      }
    });
  });

  // --- Audio Preview for Packages and Drops ---
  let currentPreviewAudio = null;
  let currentPreviewBtn = null;

  document.addEventListener('click', event => {
    const btn = event.target.closest('.pkg-play-btn, .drop-play-btn');
    if (!btn) return;

    const audioSrc = btn.getAttribute('data-audio');
    if (!audioSrc) return;

    if (currentPreviewBtn === btn && currentPreviewAudio) {
      if (!currentPreviewAudio.paused) {
        currentPreviewAudio.pause();
        resetAudioButton(btn);
        return;
      }

      currentPreviewAudio.play().catch(e => console.error('Preview play failed', e));
      setAudioButtonPlaying(btn);
      return;
    }

    // Stop any other preview
    if (currentPreviewAudio) {
      currentPreviewAudio.pause();
      if (currentPreviewBtn) resetAudioButton(currentPreviewBtn);
    }

    // Pause the main radio if it's playing
    const mainAudioPlayer = document.querySelector('audio'); // from player.js
    if (mainAudioPlayer && !mainAudioPlayer.paused) {
      mainAudioPlayer.pause();
    }

    currentPreviewAudio = new Audio(audioSrc);
    currentPreviewBtn = btn;

    currentPreviewAudio.play().catch(e => {
      console.error('Preview play failed', e);
      resetAudioButton(btn);
    });
    setAudioButtonPlaying(btn);

    currentPreviewAudio.addEventListener('ended', () => {
      resetAudioButton(btn);
    });
  });

  // --- Drops Loader ---
  const dropsContainer = document.getElementById('recent-drops-container');
  if (dropsContainer) {
    fetch('/drops.json')
      .then(res => res.json())
      .then(drops => {
        const isHomepage = dropsContainer.hasAttribute('data-homepage');
        const displayDrops = isHomepage ? drops.filter(d => d.featured).slice(0, 3) : drops;
        const renderDrop = isHomepage ? renderHomepageDrop : renderMediaDrop;

        dropsContainer.innerHTML = displayDrops.map(renderDrop).join('');
      })
      .catch(err => console.error('Error loading drops:', err));
  }

  // --- Commission Form Logic ---
  const commissionForm = document.getElementById('commission-form');
  if (commissionForm) {
    if (typeof emailjs !== 'undefined' && typeof emailjs.init === 'function') {
      emailjs.init({ publicKey: 'u899JogrVD_YHNQIU' });
    }

    const urlParams = new URLSearchParams(window.location.search);
    let currentPackage = urlParams.get('package');
    const validPackages = ['for-her-for-him', 'happy-birthday', 'walk-down-the-aisle', 'big-vibes'];
    
    const packageSelector = document.getElementById('package-selector-container');
    const packageSelectInput = document.getElementById('package-select');
    const sections = {
      'for-her-for-him': document.getElementById('fields-for-her'),
      'happy-birthday': document.getElementById('fields-birthday'),
      'walk-down-the-aisle': document.getElementById('fields-wedding'),
      'big-vibes': document.getElementById('fields-big-vibes')
    };

    function showPackageFields(pkg) {
      Object.entries(sections).forEach(([sectionKey, sec]) => {
        const isActive = validPackages.includes(pkg) && sectionKey === pkg;
        sec.classList.toggle('hidden', !isActive);

        const inputs = sec.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
          input.disabled = !isActive;

          if (input.hasAttribute('data-required')) {
            if (isActive) input.setAttribute('required', 'required');
            else input.removeAttribute('required');
          }
        });
      });
    }

    if (!validPackages.includes(currentPackage)) {
      packageSelector.classList.remove('hidden');
      packageSelectInput.setAttribute('required', 'required');
      showPackageFields(currentPackage);
      packageSelectInput.addEventListener('change', (e) => {
        currentPackage = e.target.value;
        showPackageFields(currentPackage);
      });
    } else {
      packageSelector.classList.add('hidden');
      showPackageFields(currentPackage);
    }

    // Delivery method conditional contact field + optional email
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

    // Handle Form Submission with EmailJS
    commissionForm.addEventListener('submit', function(event) {
      event.preventDefault();
      
      const submitBtn = document.getElementById('submit-btn');
      submitBtn.innerText = 'SENDING...';
      submitBtn.disabled = true;

      // Ensure EmailJS is loaded
      if (typeof emailjs === 'undefined') {
        alert("EmailJS is not loaded properly. Please check your internet connection.");
        submitBtn.innerText = 'SEND BRIEF →';
        submitBtn.disabled = false;
        return;
      }

      // Collect data into a unified object for EmailJS template
      const formData = new FormData(commissionForm);
      const data = Object.fromEntries(formData.entries());

      // --- Initialize ALL possible template variables with empty defaults ---
      // This prevents EmailJS "dynamic variables corrupted" errors when the
      // template references fields not present in the current form's payload.
      applyEmailTemplateDefaults(data);
      
      // Handle multi-select checkboxes
      const weddingMoments = formData.getAll('wedding_moment');
      if(weddingMoments.length) data.wedding_moment = weddingMoments.join(', ');
      
      const jinglePlacements = formData.getAll('jingle_placement');
      if(jinglePlacements.length) data.jingle_placement = jinglePlacements.join(', ');

      data.selected_package = currentPackage || packageSelectInput.value;

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

      // --- Pause the radio if it's playing ---
      const mainAudioPlayer = document.querySelector('audio');
      if (mainAudioPlayer && !mainAudioPlayer.paused) {
        mainAudioPlayer.pause();
      }

      // --- Dual send: admin notification first, then buyer confirmation ---
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
          document.getElementById('form-container').classList.add('hidden');
          document.getElementById('success-message').classList.remove('hidden');
          window.scrollTo(0, 0);
        })
        .catch((error) => {
          console.error('EmailJS error:', error);
          if (!adminSendSucceeded) {
            alert('Failed to send the brief. Please try again or message us on WhatsApp at +234 805 371 7830.');
            submitBtn.innerText = 'SEND BRIEF →';
            submitBtn.disabled = false;
          } else {
            console.warn('Buyer confirmation email failed but admin notification succeeded.');
            document.getElementById('form-container').classList.add('hidden');
            document.getElementById('success-message').classList.remove('hidden');
            window.scrollTo(0, 0);
          }
        });
    });
  }
});
