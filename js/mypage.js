// My page: requires a signed-in member (or ?guest=1 for orders placed
// on this device without an account). Lists real orders from Supabase
// first, then the store-purchase history shown in the Figma screen.

const HISTORY = [
  {
    id: 'history-online', channel: 'online', status: '온라인 구매 완료', created_at: '2026-06-11T12:00:00+09:00',
    items: [{ productId: 'perfume-blue-hinoki', name: '퍼퓸 블루히노키', notes: '상쾌한 파인오일  |  푸른 히노키  |  드리프트우드', option: '50ml', qty: 1, image: 'assets/images/item-perfume-50ml.png' }],
    total: 166000, reviewPoints: 2500,
  },
  {
    id: 'history-offline', channel: 'offline', status: '오프라인 구매 완료', store: '탬버린즈 서울 성수', created_at: '2026-06-06T12:00:00+09:00',
    items: [{ productId: 'perfume-blue-hinoki', name: '퍼퓸 블루히노키', notes: '상쾌한 파인오일  |  푸른 히노키  |  드리프트우드', option: '11ml', qty: 1, image: 'assets/images/item-perfume-11ml.png' }],
    total: 45000, reviewPoints: 1500,
  },
];
const PAGE_SIZE = 2;
const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

document.addEventListener('DOMContentLoaded', async () => {
  const store = window.TamburinsStore;
  const guest = new URLSearchParams(location.search).has('guest');
  const user = await store.getUser();
  if (!user && !guest) {
    location.replace('login.html?next=mypage.html');
    return;
  }

  const listEl = document.querySelector('[data-orders]');
  const emptyEl = document.querySelector('[data-empty]');
  const moreBtn = document.querySelector('[data-more]');
  let channel = 'all';
  let shown = PAGE_SIZE;
  let orders = [];

  try {
    orders = guest && !user ? store.getGuestOrders() : await store.listOrders();
  } catch (e) {
    orders = [];
  }
  const all = [...orders.map((o) => ({ ...o, channel: o.channel || 'online', status: o.status || '온라인 구매 완료' })), ...HISTORY];

  const fmtDate = (iso) => {
    const d = new Date(iso);
    const yy = String(d.getFullYear()).slice(2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yy}.${mm}.${dd}(${DAYS[d.getDay()]})`;
  };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const card = (o) => {
    const first = o.items[0];
    const extra = o.items.filter((i) => i.productId !== 'shopping-bag-s').length - 1;
    const points = o.reviewPoints || (first.option === '50ml' ? 2500 : 1500);
    const actions = o.channel === 'offline'
      ? `<div class="order-card__actions order-card__actions--wide">
           <button type="button" data-review>후기 작성 (최대 ${points.toLocaleString('ko-KR')}원 적립)</button>
           <a href="#" class="order-card__store">${esc(o.store || '탬버린즈 매장')} <img src="assets/icons/icon-arrow-forward-14.svg" alt=""></a>
         </div>`
      : `<div class="order-card__actions">
           <button type="button" data-review>후기 작성 (최대 ${points.toLocaleString('ko-KR')}원 적립)</button>
           <button type="button" data-rebuy="${esc(first.productId)}|${esc(first.option)}">재구매</button>
         </div>`;
    return `
      <article class="order-card">
        <div class="order-card__head">
          <p class="order-card__date">${fmtDate(o.created_at)}</p>
          <a href="#" class="acc-link" data-detail>주문 상세</a>
        </div>
        <p class="order-card__status">${esc(o.status)}</p>
        <div class="order-card__body">
          <div class="acc-thumb"><img src="${esc(first.image)}" alt=""></div>
          <div class="order-card__info">
            <div class="order-card__item">
              <div>
                <p class="acc-item__notes">${esc(first.notes)}</p>
                <p class="acc-item__name">${esc(first.name)}</p>
              </div>
              <p class="acc-item__option">${esc(first.option)} / ${first.qty}개${extra > 0 ? ` 외 ${extra}건` : ''}</p>
            </div>
            <p class="order-card__price">${store.won(o.total)}</p>
          </div>
          ${actions}
        </div>
      </article>`;
  };

  const render = () => {
    const rows = all.filter((o) => channel === 'all' || o.channel === channel);
    listEl.innerHTML = rows.slice(0, shown).map(card).join('');
    emptyEl.hidden = rows.length > 0;
    // Figma always shows the 더보기 control under a full first page
    moreBtn.hidden = rows.length < PAGE_SIZE;
    moreBtn.disabled = rows.length <= shown;
  };

  document.querySelectorAll('[data-channel]').forEach((btn) => btn.addEventListener('click', () => {
    channel = btn.dataset.channel;
    shown = PAGE_SIZE;
    document.querySelectorAll('[data-channel]').forEach((b) => b.classList.toggle('is-active', b === btn));
    render();
  }));
  moreBtn.addEventListener('click', () => { shown += PAGE_SIZE; render(); });

  listEl.addEventListener('click', (e) => {
    const rebuy = e.target.closest('[data-rebuy]');
    if (rebuy) {
      const [productId, option] = rebuy.dataset.rebuy.split('|');
      store.addToCart(productId, option, 1);
      location.href = 'cart.html';
      return;
    }
    if (e.target.closest('[data-review]')) location.href = 'product.html#reviews';
    if (e.target.closest('[data-detail], .order-card__store')) e.preventDefault();
  });

  document.querySelector('[data-logout]').addEventListener('click', async () => {
    await store.signOut();
    location.href = 'index.html';
  });
  document.querySelectorAll('[data-soon]').forEach((a) => a.addEventListener('click', (e) => e.preventDefault()));

  render();
});
