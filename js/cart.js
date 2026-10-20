// Cart page: renders the cart from TamburinsStore and keeps the
// summary in sync as quantities change or rows are removed.

document.addEventListener('DOMContentLoaded', () => {
  const store = window.TamburinsStore;
  const body = document.querySelector('[data-cart-body]');
  const BAG = { productId: 'shopping-bag-s', option: 'Small Size' };

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const productRow = (l) => `
    <div class="cart-row" data-line="${esc(l.productId)}|${esc(l.option)}">
      <div class="cart-row__product">
        <div class="acc-thumb${l.productId === BAG.productId ? ' acc-thumb--gift' : ''}"><img src="${esc(l.image)}" alt=""></div>
        <div class="cart-row__text">
          <div>
            <p class="acc-item__notes">${esc(l.notes)}</p>
            <p class="acc-item__name">${esc(l.name)}</p>
          </div>
          <p class="acc-item__option">${esc(l.option)} / ${l.qty}개</p>
        </div>
      </div>
      <div class="cart-row__qty">
        <div class="acc-stepper">
          <button type="button" data-step="-1" aria-label="수량 감소"${l.qty <= 1 ? ' disabled' : ''}><img src="assets/icons/icon-remove-24.svg" alt=""></button>
          <span>${l.qty}</span>
          <button type="button" data-step="1" aria-label="수량 증가"><img src="assets/icons/icon-add-24.svg" alt=""></button>
        </div>
      </div>
      <p class="cart-row__price">${store.won(l.lineTotal)}</p>
      <div class="cart-row__remove"><button type="button" data-remove aria-label="삭제"><img src="assets/icons/icon-close.svg" alt=""></button></div>
    </div>`;

  const giftRow = (g) => `
    <div class="cart-row cart-row--gift">
      <div class="cart-row__product">
        <div class="acc-thumb acc-thumb--gift"><img src="${esc(g.image)}" alt=""></div>
        <div class="cart-row__text">
          <div>
            <p class="acc-item__notes">${esc(g.notes)}</p>
            <p class="acc-item__name">${esc(g.name)}</p>
          </div>
          <p class="acc-item__option">${g.option ? `${esc(g.option)} / ` : ''}1개</p>
        </div>
      </div>
      <div class="cart-row__qty"><span class="cart-row__dash">-</span></div>
      <p class="cart-row__price cart-row__dash">-</p>
      <div class="cart-row__remove"><span class="cart-row__dash">-</span></div>
    </div>`;

  const render = () => {
    const cart = store.getCart();
    const hasBag = cart.bags.length > 0;
    if (!cart.products.length && !hasBag) {
      body.innerHTML = '<p class="cart__empty">장바구니가 비어 있습니다. <a href="category.html">제품 보러가기</a></p>';
    } else {
      body.innerHTML = `
        ${cart.products.length ? `<div class="cart-group">${cart.products.map(productRow).join('')}</div>` : ''}
        ${cart.gifts.length ? `<div class="cart-group cart-group--gifts">${cart.gifts.map(giftRow).join('')}</div>` : ''}
        <div class="cart__bag-offer${hasBag ? '' : ' is-last'}"><span>쇼핑백을 추가하시겠습니까?</span><button type="button" data-add-bag>추가하기</button></div>
        ${hasBag ? `<div class="cart-group cart-group--bag">${cart.bags.map(productRow).join('')}</div>` : ''}
        <div class="cart__end"></div>`;
    }
    document.querySelector('[data-subtotal]').textContent = store.won(cart.subtotal);
    document.querySelector('[data-shipping]').textContent = store.won(cart.shipping);
    document.querySelector('[data-total]').textContent = store.won(cart.total);
    document.querySelector('[data-total-btn]').textContent = store.won(cart.total);
    const checkout = document.querySelector('[data-checkout]');
    checkout.classList.toggle('is-disabled', cart.total === 0);
    checkout.setAttribute('aria-disabled', String(cart.total === 0));
  };

  body.addEventListener('click', (e) => {
    const row = e.target.closest('[data-line]');
    if (e.target.closest('[data-add-bag]')) {
      // one bag per product, as the order-sheet notice says
      const cart = store.getCart();
      const bags = cart.bags.reduce((n, b) => n + b.qty, 0);
      const limit = cart.products.reduce((n, p) => n + p.qty, 0);
      if (bags < Math.max(limit, 1)) store.addToCart(BAG.productId, BAG.option, 1);
      return;
    }
    if (!row) return;
    const [productId, option] = row.dataset.line.split('|');
    const step = e.target.closest('[data-step]');
    if (step) {
      const current = Number(row.querySelector('.acc-stepper span').textContent);
      store.setQty(productId, option, Math.max(1, Math.min(99, current + Number(step.dataset.step))));
    }
    if (e.target.closest('[data-remove]')) store.removeFromCart(productId, option);
  });

  document.querySelector('[data-checkout]').addEventListener('click', (e) => {
    if (store.getCart().total === 0) e.preventDefault();
  });

  document.addEventListener('cart:change', render);
  render();
});
