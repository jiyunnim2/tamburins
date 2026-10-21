// Order sheet (step 2 · 배송 정보): validates the shipping form, keeps
// the collapsible order summary in sync with the cart, and places the
// order through TamburinsStore.createOrder (Supabase Edge Function).

const LAST_SHIPPING_KEY = 'tamburins.lastShipping.v1';

document.addEventListener('DOMContentLoaded', async () => {
  const store = window.TamburinsStore;
  const form = document.getElementById('shippingForm');
  const summary = document.querySelector('[data-summary]');
  const errorEl = document.querySelector('[data-error]');
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const readLast = () => { try { return JSON.parse(localStorage.getItem(LAST_SHIPPING_KEY)); } catch (e) { return null; } };

  const cart = store.getCart();
  if (cart.total === 0) { location.replace('cart.html'); return; }

  /* ----- summary ----- */
  const item = (it, priceText) => `
    <div class="order-sum__item">
      <div class="acc-thumb${it.gift || it.productId === 'shopping-bag-s' ? ' acc-thumb--gift' : ''}"><img src="${esc(it.image)}" alt=""></div>
      <div class="order-sum__item-text">
        <div><p class="acc-item__notes">${esc(it.notes)}</p><p class="acc-item__name">${esc(it.name)}</p></div>
        <p class="order-sum__line"><span><b>수량</b>${it.qty}개</span><span>${priceText}</span></p>
      </div>
    </div>`;
  document.querySelector('[data-items]').innerHTML = [
    ...cart.products.map((p) => item(p, store.won(p.lineTotal))),
    ...cart.gifts.map((g) => item({ ...g, qty: 1, gift: true }, '0원')),
    ...cart.bags.map((b) => item(b, store.won(b.lineTotal))),
  ].join('');
  document.querySelector('[data-count]').textContent = cart.count;
  document.querySelector('[data-subtotal]').textContent = store.won(cart.subtotal);
  document.querySelector('[data-shipping]').textContent = store.won(cart.shipping);
  document.querySelector('[data-total]').textContent = store.won(cart.total);
  document.querySelector('[data-points]').textContent = `${cart.points} P`;

  const toggle = document.querySelector('[data-summary-toggle]');
  const itemsWrap = document.querySelector('[data-items-wrap]');
  toggle.addEventListener('click', () => {
    const open = !summary.classList.contains('is-open');
    summary.classList.toggle('is-open', open);
    // slide the product list down / up to its measured height
    itemsWrap.style.height = open ? itemsWrap.firstElementChild.offsetHeight + 'px' : '0px';
    toggle.setAttribute('aria-expanded', String(open));
    document.querySelector('[data-summary-icon]').src = `assets/icons/icon-summary-${open ? 'up' : 'down'}.svg`;
  });

  /* ----- form helpers ----- */
  const f = form.elements;
  const user = await store.getUser();
  form.querySelector('[data-same-as-buyer]').addEventListener('click', () => {
    const last = readLast();
    const meta = (user && user.user_metadata) || {};
    f.recipient_name.value = meta.name || (last && last.recipient_name) || (user ? user.email.split('@')[0] : '');
    f.phone.value = meta.phone || (last && last.phone) || '';
    validate(false);
  });
  form.querySelector('[data-recent]').addEventListener('click', () => {
    const last = readLast();
    if (!last) { showError('저장된 최근 배송지가 없습니다.'); return; }
    ['recipient_name', 'phone', 'address', 'address_detail'].forEach((k) => { f[k].value = last[k] || ''; });
    validate(false);
  });
  f.phone.addEventListener('input', () => { f.phone.value = f.phone.value.replace(/\D/g, ''); });

  // 주소 찾기 — Kakao(Daum) postcode search, loaded on first use.
  form.querySelector('[data-find-address]').addEventListener('click', () => {
    const open = () => new window.daum.Postcode({
      oncomplete: (data) => {
        f.address.value = `(${data.zonecode}) ${data.roadAddress || data.jibunAddress}`;
        f.address_detail.focus();
        validate(false);
      },
    }).open();
    if (window.daum && window.daum.Postcode) { open(); return; }
    const s = document.createElement('script');
    s.src = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
    s.onload = open;
    s.onerror = () => {
      f.address.readOnly = false;
      f.address.placeholder = '주소를 직접 입력해 주세요.';
      f.address.focus();
    };
    document.head.appendChild(s);
  });

  function showError(text) {
    errorEl.textContent = text;
    errorEl.hidden = !text;
  }
  function validate(report) {
    const checks = [
      [f.recipient_name, (v) => v.trim().length > 0, '수령인을 입력해 주세요.'],
      [f.phone, (v) => /^01\d{8,9}$/.test(v), '휴대폰 번호를 정확히 입력해 주세요.'],
      [f.address, (v) => v.trim().length > 0, '주소 찾기로 배송지를 입력해 주세요.'],
      [f.address_detail, (v) => v.trim().length > 0, '배송지 상세 정보를 입력해 주세요.'],
    ];
    let first = null;
    checks.forEach(([el, ok, msg]) => {
      const bad = !ok(el.value);
      el.closest('.order-field').classList.toggle('is-invalid', bad && report);
      if (bad && !first) first = [el, msg];
    });
    if (report) showError(first ? first[1] : '');
    else if (!first) showError('');
    return first;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const bad = validate(true);
    if (bad) { bad[0].focus(); return; }
    const shipping = {
      recipient_name: f.recipient_name.value.trim(),
      phone: f.phone.value,
      address: f.address.value.trim(),
      address_detail: f.address_detail.value.trim(),
      request: f.request.value || null,
    };
    const submit = document.querySelector('[data-submit]');
    submit.disabled = true;
    try {
      const order = await store.createOrder(shipping);
      if (f.save_default.checked || !readLast()) localStorage.setItem(LAST_SHIPPING_KEY, JSON.stringify(shipping));
      document.querySelector('[data-order]').hidden = true;
      document.querySelectorAll('.order-steps li').forEach((li, i) => {
        li.classList.toggle('is-active', i === 3);
        if (i === 3) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
      });
      document.querySelector('[data-done-text]').textContent =
        `${store.won(order.total)} · ${shipping.recipient_name}님께 1~2 영업일 내 출고됩니다.`;
      const done = document.querySelector('[data-done]');
      done.hidden = false;
      if (!user) done.querySelector('a').href = 'mypage.html?guest=1';
    } catch (err) {
      showError(err.message);
    } finally {
      submit.disabled = false;
    }
  });
});
