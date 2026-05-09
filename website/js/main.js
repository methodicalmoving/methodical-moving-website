/* ===========================
   METHODICAL MOVING — MAIN JS
   =========================== */

// ── Web3Forms API key ──────────────────────────────────────────
// 1. Go to https://web3forms.com/create
// 2. Enter: methodicalmoving2023@gmail.com
// 3. Copy the key from the email they send you and paste it below
const WEB3FORMS_KEY = '727df564-60a8-4906-a64f-d2adbe5f4785';
// ──────────────────────────────────────────────────────────────

// Mobile nav toggle
const hamburger = document.getElementById('hamburger');
const mobileNav = document.getElementById('mobileNav');

if (hamburger && mobileNav) {
  hamburger.addEventListener('click', () => {
    const open = mobileNav.classList.toggle('open');
    hamburger.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', open);
  });

  // Close on link click
  mobileNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileNav.classList.remove('open');
      hamburger.classList.remove('open');
    });
  });
}

// Set active nav link based on current page
const currentPage = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.navbar-links a, .mobile-nav a').forEach(link => {
  const href = link.getAttribute('href');
  if (href === currentPage || (currentPage === '' && href === 'index.html')) {
    link.classList.add('active');
  }
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// Contact form handler
const contactForm = document.getElementById('contactForm');
const contactSuccess = document.getElementById('contactSuccess');

if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = contactForm.querySelector('[type="submit"]');
    submitBtn.textContent = 'Sending…';
    submitBtn.disabled = true;

    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key:  WEB3FORMS_KEY,
          subject:     'New Contact Message — Methodical Moving',
          from_name:   'Methodical Moving Website',
          name:        contactForm.querySelector('[name="name"]').value,
          email:       contactForm.querySelector('[name="email"]').value,
          phone:       contactForm.querySelector('[name="phone"]').value || 'Not provided',
          message:     contactForm.querySelector('[name="message"]').value,
        }),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.message);

      contactForm.style.display = 'none';
      if (contactSuccess) {
        contactSuccess.classList.add('show');
        contactSuccess.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    } catch {
      submitBtn.textContent = 'Something went wrong — please try again';
      submitBtn.disabled = false;
    }
  });
}
