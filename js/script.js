// TAMBURINS — interactions shared by every page (newsletter) and the
// main page's Scent Story controls.

document.addEventListener('DOMContentLoaded', () => {
  initScentStoryNav();
  initNewsletterForm();
});

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
