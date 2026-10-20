// TAMBURINS — interactions shared by every page (newsletter) and the
// main page's Scent Story controls.

document.addEventListener('DOMContentLoaded', () => {
  initHeroBanner();
  initScentStoryNav();
  initNewsletterForm();
});

// Main hero: two banners. The active banner's indicator fills over
// HERO_DURATION; when it is full the next banner fades in (1 → 2 → 1 …).
// While banner 2 runs, indicator 1 stays full; returning to banner 1
// clears both. Every visit to the main page starts at banner 1 —
// including back/forward navigation restored from the page cache.
const HERO_DURATION_MS = 4000;

function initHeroBanner() {
  const slides = document.querySelectorAll('[data-hero] .hero__bg');
  const dots = document.querySelectorAll('[data-hero-dot]');
  if (slides.length < 2 || dots.length !== slides.length) return;
  document.querySelector('.hero').style.setProperty('--hero-duration', HERO_DURATION_MS + 'ms');

  const show = (index) => {
    slides.forEach((slide, i) => slide.classList.toggle('is-active', i === index));
    dots.forEach((dot, i) => {
      dot.classList.remove('is-running');
      dot.classList.toggle('is-done', i < index);
      dot.setAttribute('aria-selected', String(i === index));
    });
    void dots[index].offsetWidth; // restart the fill animation
    dots[index].classList.add('is-running');
  };

  dots.forEach((dot, i) => {
    dot.addEventListener('animationend', () => show((i + 1) % slides.length));
    dot.addEventListener('click', () => show(i));
  });

  window.addEventListener('pageshow', (event) => { if (event.persisted) show(0); });
  show(0);
}

// Scent Story section currently ships with a single fragrance (블루히노키).
// The prev/next controls are wired for when more fragrances are added;
// today both are disabled since there is nothing else to page to.
function initScentStoryNav() {
  const prevBtn = document.querySelector('.scent-story__arrow[data-dir="prev"]');
  const nextBtn = document.querySelector('.scent-story__arrow[data-dir="next"]');
  if (!prevBtn || !nextBtn) return;

  prevBtn.disabled = true;
  nextBtn.disabled = true;
}

function initNewsletterForm() {
  const form = document.getElementById('newsletterForm');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const input = form.querySelector('input[type="email"]');
    const email = input.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      input.value = '';
      input.placeholder = '올바른 이메일 주소를 입력해 주세요.';
      return;
    }
    try {
      if (window.TamburinsStore) await window.TamburinsStore.subscribe(email);
      input.value = '';
      input.placeholder = '구독해 주셔서 감사합니다.';
    } catch (e) {
      input.placeholder = '잠시 후 다시 시도해 주세요.';
    }
  });
}
