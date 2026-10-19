// TAMBURINS — data layer shared by every page.
//
//  • Cart: kept in localStorage (works for guests and members alike).
//  • Auth, orders, newsletter: Supabase. The anon key in js/config.js is
//    a public, RLS-restricted key. Orders are written by the
//    `create-order` Edge Function, which re-prices the cart server-side.
//  • If js/config.js has no Supabase project configured, everything
//    falls back to localStorage so the prototype still runs offline.

(function () {
  const CART_KEY = 'tamburins.cart.v1';
  const LOCAL_USER_KEY = 'tamburins.localUser.v1';
  const LOCAL_ORDERS_KEY = 'tamburins.localOrders.v1';
  const GUEST_ORDERS_KEY = 'tamburins.guestOrders.v1'; // orders placed here without an account
  const SHIPPING_FREE_OVER = 30000;
  const SHIPPING_FEE = 3000;

  // Catalog — mirrors supabase/functions/create-order/catalog.ts, which is
  // the price source of truth when an order is placed.
  const PRODUCTS = {
    'perfume-blue-hinoki': {
      name: '퍼퓸 블루히노키',
      notes: '상쾌한 파인오일  |  푸른 히노키  |  드리프트우드',
      options: {
        '11ml': { price: 45000, points: 1000, image: 'assets/images/item-perfume-11ml.png' },
        '14ml': { price: 56000, points: 1200, image: 'assets/images/item-perfume-11ml.png' },
        '50ml': { price: 165000, points: 3500, image: 'assets/images/item-perfume-50ml.png' },
      },
    },
    'shopping-bag-s': {
      name: '쇼핑백 (S)',
      notes: '쇼핑백 추가',
      options: { 'Small Size': { price: 1000, points: 0, image: 'assets/images/item-shopping-bag.png' } },
    },
  };

  // Gifts that ride along with any perfume purchase (무료증정 rows).
  const GIFTS = [
    { id: 'gift-chamo-2ml', name: '퍼퓸 카모 2ml', notes: '무료증정', option: '2ml', image: 'assets/images/item-chamo-2ml.png' },
    { id: 'gift-ribbon-bag', name: '리본 백 미니', notes: '무료증정', option: '', image: 'assets/images/item-ribbon-bag.png' },
  ];

  const won = (n) => `${Number(n).toLocaleString('ko-KR')}원`;

  /* ---------------- Supabase client ---------------- */
  const cfg = window.TAMBURINS_CONFIG || {};
  const hasSupabase = Boolean(cfg.supabaseUrl && cfg.supabaseAnonKey && window.supabase);
  const sb = hasSupabase ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey) : null;

  /* ---------------- storage helpers ---------------- */
  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* private mode */ }
  }

  /* ---------------- cart ---------------- */
  // First visit starts from the same cart the Figma screen shows
  // (퍼퓸 블루히노키 50ml + 쇼핑백 (S)), so the prototype opens on-design.
  const SEED_CART = [
    { productId: 'perfume-blue-hinoki', option: '50ml', qty: 1 },
    { productId: 'shopping-bag-s', option: 'Small Size', qty: 1 },
  ];

  function getCartLines() {
    return read(CART_KEY, SEED_CART);
  }
  function saveCartLines(lines) {
    write(CART_KEY, lines);
    document.dispatchEvent(new CustomEvent('cart:change'));
  }
  function addToCart(productId, option, qty) {
    const lines = getCartLines();
    const hit = lines.find((l) => l.productId === productId && l.option === option);
    if (hit) hit.qty += qty;
    else lines.unshift({ productId, option, qty });
    saveCartLines(lines);
  }
  function setQty(productId, option, qty) {
    const lines = getCartLines()
      .map((l) => (l.productId === productId && l.option === option ? { ...l, qty } : l))
      .filter((l) => l.qty > 0);
    saveCartLines(lines);
  }
  function removeFromCart(productId, option) {
    saveCartLines(getCartLines().filter((l) => !(l.productId === productId && l.option === option)));
  }
  function clearCart() {
    saveCartLines([]);
  }

  // Expanded view used by cart + order pages: priced lines, gifts, totals.
  function getCart() {
    const lines = getCartLines()
      .filter((l) => PRODUCTS[l.productId] && PRODUCTS[l.productId].options[l.option])
      .map((l) => {
        const p = PRODUCTS[l.productId];
        const o = p.options[l.option];
        return { ...l, name: p.name, notes: p.notes, price: o.price, image: o.image, lineTotal: o.price * l.qty, linePoints: o.points * l.qty };
      });
    const products = lines.filter((l) => l.productId !== 'shopping-bag-s');
    const bags = lines.filter((l) => l.productId === 'shopping-bag-s');
    const gifts = products.some((l) => l.productId.startsWith('perfume')) ? GIFTS : [];
    const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
    const shipping = subtotal === 0 || subtotal >= SHIPPING_FREE_OVER ? 0 : SHIPPING_FEE;
    const total = subtotal + shipping;
    const count = products.length + gifts.length + bags.length;
    const points = lines.reduce((s, l) => s + l.linePoints, 0); // 구매 적립금
    return { products, bags, gifts, subtotal, shipping, total, count, points };
  }

  /* ---------------- auth ---------------- */
  async function getUser() {
    if (sb) {
      const { data } = await sb.auth.getSession();
      return data.session ? data.session.user : null;
    }
    return read(LOCAL_USER_KEY, null);
  }
  async function signIn(email, password) {
    if (sb) {
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw new Error(translateAuthError(error.message));
      return data.user;
    }
    const user = { id: 'local-' + email, email };
    write(LOCAL_USER_KEY, user);
    return user;
  }
  async function signUp(email, password) {
    if (sb) {
      const { data, error } = await sb.auth.signUp({ email, password });
      if (error) throw new Error(translateAuthError(error.message));
      return data;
    }
    return signIn(email, password);
  }
  async function signOut() {
    if (sb) await sb.auth.signOut();
    try { localStorage.removeItem(LOCAL_USER_KEY); } catch (e) { /* ignore */ }
  }
  async function resetPassword(email) {
    if (!sb) return;
    const redirectTo = new URL('login.html', window.location.href).href;
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw new Error(translateAuthError(error.message));
  }
  function translateAuthError(message) {
    if (/invalid login credentials/i.test(message)) return '아이디 또는 비밀번호가 일치하지 않습니다.';
    if (/email not confirmed/i.test(message)) return '이메일 인증 후 로그인해 주세요.';
    if (/already registered/i.test(message)) return '이미 가입된 이메일입니다.';
    if (/password should be at least/i.test(message)) return '비밀번호는 6자 이상이어야 합니다.';
    return message;
  }

  /* ---------------- orders ---------------- */
  async function createOrder(shipping) {
    const lines = getCartLines();
    if (sb) {
      const { data, error } = await sb.functions.invoke('create-order', { body: { lines, shipping } });
      if (error) {
        let msg = '주문을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.';
        try { msg = (await error.context.json()).error || msg; } catch (e) { /* keep default */ }
        throw new Error(msg);
      }
      clearCart();
      if (!(await getUser())) write(GUEST_ORDERS_KEY, [data.order, ...read(GUEST_ORDERS_KEY, [])]);
      return data.order;
    }
    const cart = getCart();
    const user = await getUser();
    const order = {
      id: 'local-' + Date.now(),
      user_id: user ? user.id : null,
      channel: 'online',
      status: '온라인 구매 완료',
      items: [...cart.products, ...cart.bags].map(({ productId, name, notes, option, qty, price, image }) => ({ productId, name, notes, option, qty, price, image })),
      subtotal: cart.subtotal,
      shipping_fee: cart.shipping,
      total: cart.total,
      points: cart.points,
      ...shipping,
      created_at: new Date().toISOString(),
    };
    write(LOCAL_ORDERS_KEY, [order, ...read(LOCAL_ORDERS_KEY, [])]);
    if (!user) write(GUEST_ORDERS_KEY, [order, ...read(GUEST_ORDERS_KEY, [])]);
    clearCart();
    return order;
  }
  async function listOrders() {
    if (sb) {
      const { data, error } = await sb.from('orders').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
    const user = await getUser();
    return read(LOCAL_ORDERS_KEY, []).filter((o) => user && o.user_id === user.id);
  }

  function getGuestOrders() {
    return read(GUEST_ORDERS_KEY, []);
  }

  /* ---------------- newsletter ---------------- */
  async function subscribe(email) {
    if (sb) {
      const { error } = await sb.from('newsletter_subscribers').insert({ email });
      if (error && error.code !== '23505') throw error; // 23505 = already subscribed
      return;
    }
    const list = read('tamburins.newsletter.v1', []);
    if (!list.includes(email)) write('tamburins.newsletter.v1', [...list, email]);
  }

  window.TamburinsStore = {
    PRODUCTS, won, hasSupabase,
    getCart, addToCart, setQty, removeFromCart, clearCart,
    getUser, signIn, signUp, signOut, resetPassword,
    createOrder, listOrders, getGuestOrders, subscribe,
  };
})();
