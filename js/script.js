// TAMBURINS — interactions shared by every page (newsletter) and the
// main page's Scent Story controls.

document.addEventListener('DOMContentLoaded', () => {
  initHeroBanner();
  initCategorySearch();
  initCollectionSwap();
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

// Main Collection side columns: each column shows one entry's photo and
// the other entry as text only. Hovering the text-only entry swaps the
// column (its photo opens, the other closes) and the swap stays after the
// pointer leaves; hovering the entry that is now text-only swaps it back.
// Every visit to the main page — link, back/forward, or refresh — starts
// from the default (블루히노키 · 선샤인 · 보타리 photos).
function initCollectionSwap() {
  const cols = [...document.querySelectorAll('[data-collection-col]')];
  if (!cols.length) return;
  cols.forEach((col) => {
    col.querySelectorAll('.collection__item').forEach((item) => {
      item.addEventListener('mouseenter', () => {
        const swapped = col.classList.contains('is-swapped');
        const textOnly = item.classList.contains('is-collapsed') !== swapped;
        if (textOnly) col.classList.toggle('is-swapped');
      });
    });
  });
  const reset = () => cols.forEach((col) => {
    col.classList.add('is-resetting'); // snap back without animating
    col.classList.remove('is-swapped');
    requestAnimationFrame(() => requestAnimationFrame(() => col.classList.remove('is-resetting')));
  });
  window.addEventListener('pageshow', (event) => { if (event.persisted) reset(); });
}

// Category page as search results: ?q= filters the product cards by
// name / notes (spaces and case ignored) and says so when nothing matches.
function initCategorySearch() {
  const grid = document.querySelector('.cat-grid');
  const q = new URLSearchParams(location.search).get('q');
  if (!grid || !q) return;
  const norm = (t) => t.toLowerCase().replace(/\s+/g, '');
  const needle = norm(q);
  let hits = 0;
  grid.querySelectorAll('.cat-card').forEach((card) => {
    const hay = norm(card.querySelector('.cat-card__name').textContent + card.querySelector('.cat-card__notes').textContent);
    const show = hay.includes(needle);
    card.hidden = !show;
    if (show) hits += 1;
  });
  const promo = grid.querySelector('.cat-promo');
  if (promo) promo.hidden = true;
  const note = document.createElement('p');
  note.className = 'cat-search-note';
  note.textContent = hits ? `'${q}' 검색 결과 ${hits}개` : `'${q}'에 대한 검색 결과가 없습니다.`;
  grid.before(note);
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
      input.placeholder = '이메일 주소를 확인해 주세요.';
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
