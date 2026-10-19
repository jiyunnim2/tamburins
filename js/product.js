// Product detail page: size chips + quantity drive the total, the two
// buttons put the selection in the cart, gallery indicator, accordion,
// and the review board (sort / keyword search / pagination).

document.addEventListener('DOMContentLoaded', () => {
  initBuyBox();
  initGallery();
  initAccordion();
  initReviews();
});

function initBuyBox() {
  const box = document.getElementById('buybox');
  if (!box) return;
  const store = window.TamburinsStore;
  const chips = box.querySelectorAll('.pdp-chip');
  const qtyEl = box.querySelector('[data-qty]');
  const minus = box.querySelector('[data-step="-1"]');
  const unitEl = box.querySelector('[data-unit-price]');
  const totalEl = box.querySelector('[data-total]');
  let qty = 1;

  const active = () => box.querySelector('.pdp-chip.is-active');
  const render = () => {
    const price = Number(active().dataset.price);
    qtyEl.textContent = String(qty);
    minus.disabled = qty <= 1;
    unitEl.textContent = store.won(price);
    totalEl.textContent = store.won(price * qty);
  };

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      chips.forEach((c) => {
        c.classList.toggle('is-active', c === chip);
        c.setAttribute('aria-checked', String(c === chip));
      });
      render();
    });
  });
  box.querySelectorAll('[data-step]').forEach((btn) => {
    btn.addEventListener('click', () => {
      qty = Math.max(1, Math.min(99, qty + Number(btn.dataset.step)));
      render();
    });
  });

  const add = () => store.addToCart(box.dataset.productId, active().dataset.size, qty);

  const addBtn = box.querySelector('[data-add-to-cart]');
  addBtn.addEventListener('click', () => {
    add();
    const label = addBtn.textContent;
    addBtn.textContent = '장바구니에 담았습니다';
    addBtn.disabled = true;
    setTimeout(() => { addBtn.textContent = label; addBtn.disabled = false; }, 1400);
  });
  box.querySelector('[data-buy-now]').addEventListener('click', () => {
    add();
    window.location.href = 'cart.html';
  });

  render();
}

function initGallery() {
  const imgs = document.querySelectorAll('[data-gallery] img');
  const dots = document.querySelectorAll('.pdp-gallery__indicator button');
  if (!imgs.length) return;
  let index = 0;
  const show = (i) => {
    index = (i + imgs.length) % imgs.length;
    imgs.forEach((img, n) => img.classList.toggle('is-active', n === index));
    dots.forEach((dot, n) => dot.classList.toggle('is-active', n === index));
  };
  dots.forEach((dot, n) => dot.addEventListener('click', () => show(n)));
  document.querySelector('[data-gallery]').addEventListener('click', () => show(index + 1));
}

function initAccordion() {
  document.querySelectorAll('.pdp-acc').forEach((acc) => {
    const head = acc.querySelector('.pdp-acc__head');
    const set = (open) => {
      acc.classList.toggle('is-open', open);
      head.setAttribute('aria-expanded', String(open));
    };
    head.addEventListener('click', () => set(!acc.classList.contains('is-open')));
    acc.querySelector('.pdp-acc__close').addEventListener('click', () => set(false));
  });
}

const REVIEWS = [
  { option: '퍼퓸 블루히노키 - 50ml', rating: 5, text: '다른 우디 향수들은 지속력이 약하더라구요. 이건 지속력 강해서 좋아요.', author: '최****', grade: '비회원', date: '2026-06-28' },
  { option: '퍼퓸 블루히노키 - 14ml', rating: 5, text: '탬버린즈 향수는 사이즈가 다양해서 너무 좋아요!', author: '김****', grade: '회원', date: '2026-06-04' },
  { option: '퍼퓸 블루히노키 - 50ml', rating: 5, text: '컬렉션 나올때마다 향수 구매하고 있는데 블루히노키는 역대급으로 향이 좋아서 바디워시랑 헤어오일까지 구매했어요.', author: '이****', grade: '회원', date: '2026-05-17' },
  { option: '퍼퓸 블루히노키 - 50ml', rating: 5, text: '여자친구가 향수를 좋아해서 선물로 블루히노키를 줬는데, 패키지도 예쁘고 쇼핑백도 예뻐서 너무 마음에 들어해요', author: '김****', grade: '비회원', date: '2026-04-12' },
  { option: '퍼퓸 블루히노키 - 11ml', rating: 5, text: '중성적이고 우디한 향 좋아하시면 무조건 블루히노키 사세요.', author: '정****', grade: '회원', date: '2026-03-08' },
];

function initReviews() {
  const list = document.querySelector('[data-review-list]');
  if (!list) return;
  const empty = document.querySelector('[data-review-empty]');
  const search = document.querySelector('[data-review-search]');
  const sortBtns = document.querySelectorAll('[data-sort]');
  const pageBtns = document.querySelectorAll('[data-page]');
  let sort = 'new';
  let page = 1;

  const escape = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const render = () => {
    const q = search.value.trim();
    const rows = REVIEWS
      .filter((r) => !q || r.text.includes(q) || r.option.includes(q))
      .sort((a, b) => {
        if (sort === 'old') return a.date.localeCompare(b.date);
        if (sort === 'high') return b.rating - a.rating || b.date.localeCompare(a.date);
        if (sort === 'low') return a.rating - b.rating || b.date.localeCompare(a.date);
        return b.date.localeCompare(a.date);
      });
    list.innerHTML = rows.map((r) => `
      <li class="pdp-review">
        <div class="pdp-review__main">
          <p class="pdp-review__option"><span>상품 옵션</span><i></i><span>${escape(r.option)}</span></p>
          <div class="pdp-review__content">
            <img class="pdp-review__stars" src="assets/icons/icon-stars-row.svg" alt="별점 ${r.rating}점">
            <p class="pdp-review__text" title="${escape(r.text)}">${escape(r.text)}</p>
          </div>
          <p class="pdp-review__actions"><button type="button" data-report>신고</button><i></i><button type="button" data-hide>숨김</button></p>
        </div>
        <div class="pdp-review__meta">
          <div>
            <p class="pdp-review__author">${escape(r.author)}<span>작성자 등급 <em>${r.grade}</em></span></p>
            <p class="pdp-review__date">${r.date}</p>
          </div>
        </div>
      </li>`).join('');
    empty.hidden = rows.length > 0;
    pageBtns.forEach((b) => b.classList.toggle('is-active', Number(b.dataset.page) === page));
  };

  sortBtns.forEach((btn) => btn.addEventListener('click', () => {
    sort = btn.dataset.sort;
    sortBtns.forEach((b) => b.classList.toggle('is-active', b === btn));
    render();
  }));
  search.addEventListener('input', render);
  pageBtns.forEach((btn) => btn.addEventListener('click', () => { page = Number(btn.dataset.page); render(); }));
  document.querySelectorAll('[data-page-step]').forEach((btn) => btn.addEventListener('click', () => {
    page = Math.max(1, Math.min(pageBtns.length, page + Number(btn.dataset.pageStep)));
    render();
  }));
  list.addEventListener('click', (e) => {
    const item = e.target.closest('.pdp-review');
    if (e.target.matches('[data-hide]')) item.remove();
    if (e.target.matches('[data-report]')) { e.target.textContent = '신고 접수됨'; e.target.disabled = true; }
  });

  render();
}
