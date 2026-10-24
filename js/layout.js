// TAMBURINS — shared header + footer.
// Every page drops in <div data-site-header> / <div data-site-footer>
// placeholders and this script renders the same markup into them, so
// the 9-item nav, icon set and footer stay identical across pages.
//
// Header variants (data-variant):
//   "overlay" — white logo/nav/icons laid over a hero image (main, category)
//   "light"   — dark logo/nav/icons on the page background (all other pages)
// The nav type size is 20px on every page (Figma).
//
// Below 1280px (mobile.css) the desktop header is hidden and a mobile
// header (Figma 모바일 1차) is rendered next to it from the same slot:
//   data-m-variant  "overlay" | "light"  (defaults to data-variant)
//   data-m-title    back arrow + title instead of the logo (cart, login…)
//   data-m-right    "menu" (default) | "close" | "none"
//   data-no-desktop mobile header only (login has no desktop header)
// The hamburger opens a drawer with the same 9-item nav.

(function () {
  // Only 블루히노키 navigates (to the category page). The other menu
  // items still react on hover but don't go anywhere.
  const NAV = [
    { label: '블루히노키', href: 'category.html' },
    { label: '기프트', accent: true },
    { label: '퍼퓸' },
    { label: '핸드&amp;립' },
    { label: '바디' },
    { label: '홈 프래그런스' },
    { label: '향 노트' },
    { label: '컬렉션' },
    { label: '스토어' },
  ];

  function headerMarkup(variant) {
    const dark = variant === 'light';
    const sfx = dark ? '-dark' : '';
    const nav = NAV.map((item) => {
      const cls = item.accent ? ' class="is-accent"' : '';
      return item.href
        ? `<a href="${item.href}"${cls}>${item.label}</a>`
        : `<a role="link" aria-disabled="true"${cls}>${item.label}</a>`;
    }).join('');

    return `
      <header class="site-header site-header--${variant}">
        <div class="site-header__left">
          <a href="index.html" class="site-header__logo">
            <img src="assets/icons/logo-wordmark${sfx}.svg" alt="TAMBURINS" width="202" height="25">
          </a>
          <nav class="site-nav">${nav}</nav>
        </div>
        <div class="site-header__icons">
          <div class="site-search" data-search>
            <button type="button" class="site-search__toggle" aria-label="검색 열기" aria-expanded="false" aria-controls="siteSearchInput">
              <img class="site-search__icon" src="assets/icons/icon-search${sfx}.svg" alt="">
              <img class="site-search__icon site-search__icon--open" src="assets/icons/icon-search-open${sfx}.svg" alt="">
            </button>
            <form class="site-search__form" action="category.html" role="search">
              <input id="siteSearchInput" type="search" name="q" placeholder="NEW 컬렉션 블루히노키를 만나보세요." aria-label="검색어" autocomplete="off" tabindex="-1">
            </form>
          </div>
          <a href="mypage.html" aria-label="마이페이지" data-account-link><img src="assets/icons/icon-person${sfx}.svg" alt=""></a>
          <a href="cart.html" aria-label="장바구니"><img src="assets/icons/icon-bag${sfx}.svg" alt=""></a>
        </div>
      </header>`;
  }

  function mobileHeaderMarkup(slot) {
    const variant = slot.dataset.mVariant || slot.dataset.variant || 'light';
    const dark = variant === 'light';
    const sfx = dark ? '-dark' : '';
    const title = slot.dataset.mTitle;
    const right = slot.dataset.mRight || 'menu';
    const sub = title !== undefined;
    const search = sub ? '' : `
          <div class="site-search m-search" data-search>
            <button type="button" class="site-search__toggle" aria-label="검색 열기" aria-expanded="false" aria-controls="mSearchInput">
              <img class="site-search__icon" src="assets/icons/m-search${sfx}.svg" alt="">
              <img class="site-search__icon site-search__icon--open" src="assets/icons/icon-search-open${sfx}.svg" alt="">
            </button>
            <form class="site-search__form" action="category.html" role="search">
              <input id="mSearchInput" type="search" name="q" placeholder="NEW 컬렉션 블루히노키를 만나보세요." aria-label="검색어" autocomplete="off" tabindex="-1">
            </form>
          </div>`;
    const end = right === 'close'
      ? '<a href="index.html" class="m-header__btn" aria-label="닫기"><img src="assets/icons/m-close-24.svg" alt=""></a>'
      : right === 'none' ? ''
      : `<button type="button" class="m-header__btn" data-drawer-open aria-label="메뉴 열기" aria-expanded="false"><img src="assets/icons/m-menu${sfx}.svg" alt=""></button>`;
    return `
      <header class="m-header m-header--${variant}${sub ? ' is-sub' : ''}">
        <a href="index.html" class="m-header__logo"><img src="assets/icons/m-logo${sfx}.svg" alt="TAMBURINS" width="120" height="15"></a>
        <div class="m-header__sub">
          <button type="button" class="m-header__back" data-back aria-label="뒤로 가기"><img src="assets/icons/m-back-20.svg" alt=""></button>
          <p class="m-header__title" data-m-title>${title || ''}</p>
        </div>
        <div class="m-header__icons">${search}${end}</div>
      </header>`;
  }

  function drawerMarkup() {
    const nav = NAV.map((item) => {
      const cls = item.accent ? ' class="is-accent"' : '';
      return item.href
        ? `<a href="${item.href}"${cls}>${item.label}</a>`
        : `<a role="link" aria-disabled="true"${cls}>${item.label}</a>`;
    }).join('');
    return `
      <div class="m-drawer" id="mDrawer" aria-hidden="true">
        <div class="m-drawer__scrim" data-drawer-close></div>
        <aside class="m-drawer__panel" role="dialog" aria-modal="true" aria-label="메뉴">
          <div class="m-drawer__head">
            <a href="index.html"><img src="assets/icons/m-logo-dark.svg" alt="TAMBURINS" width="120" height="15"></a>
            <button type="button" class="m-header__btn" data-drawer-close aria-label="메뉴 닫기"><img src="assets/icons/m-close-24.svg" alt=""></button>
          </div>
          <nav class="m-drawer__nav">${nav}</nav>
          <div class="m-drawer__links">
            <a href="mypage.html" data-account-link>마이페이지</a>
            <a href="cart.html">장바구니</a>
          </div>
        </aside>
      </div>`;
  }

  const FOOTER = `
    <footer class="site-footer">
      <div class="site-footer__top">
        <nav class="footer-nav">
          <div class="footer-nav__col">
            <p class="footer-nav__title">매장안내</p>
            <ul>
              <li><a href="#">대한민국</a></li>
              <li><a href="#">일본</a></li>
              <li><a href="#">중국</a></li>
              <li><a href="#">태국</a></li>
              <li><a href="#">전시</a></li>
            </ul>
          </div>
          <div class="footer-nav__col">
            <p class="footer-nav__title">고객서비스</p>
            <ul>
              <li><a href="mypage.html">비회원 주문 조회</a></li>
              <li><a href="#">특별한 혜택</a></li>
              <li><a href="#">교환 및 반품</a></li>
              <li><a href="#">자주 묻는 질문</a></li>
              <li><a href="#">1:1문의하기</a></li>
              <li><a href="#">기업 구매</a></li>
            </ul>
          </div>
          <div class="footer-nav__col">
            <p class="footer-nav__title">법적 고지</p>
            <ul>
              <li><a href="#">공지사항</a></li>
              <li><a href="#">이용 약관</a></li>
              <li><a href="#" class="is-strong">개인정보처리방침</a></li>
            </ul>
          </div>
          <div class="footer-nav__col">
            <p class="footer-nav__title">소셜 미디어</p>
            <ul>
              <!-- TAMBURINS official accounts (as listed on tamburins.com) -->
              <li><a href="https://www.instagram.com/tamburinsofficial/" target="_blank" rel="noopener noreferrer">인스타그램</a></li>
              <li><a href="https://pf.kakao.com/_RkqIj" target="_blank" rel="noopener noreferrer">카카오톡</a></li>
              <li><a href="https://www.facebook.com/tamburinsofficial/" target="_blank" rel="noopener noreferrer">페이스북</a></li>
              <li><a href="https://weibo.com/tamburinsofficial" target="_blank" rel="noopener noreferrer">웨이보</a></li>
            </ul>
          </div>
        </nav>

        <div class="footer-newsletter">
          <div class="footer-newsletter__heading">
            <p class="footer-newsletter__title">Stay Connected</p>
            <p class="footer-newsletter__desc">탬버린즈의 새로운 컬렉션과 소식을<br>가장 먼저 받아보세요.</p>
          </div>
          <form class="footer-newsletter__form" id="newsletterForm" novalidate>
            <div class="newsletter-row">
              <input type="email" name="email" placeholder="이메일 주소를 입력해 주세요." required aria-label="이메일 주소">
              <button type="submit" aria-label="구독하기">
                <img src="assets/icons/icon-arrow-forward.svg" alt="">
              </button>
            </div>
            <hr class="footer-divider">
          </form>
        </div>

        <div class="footer-divider--vertical" aria-hidden="true"></div>
      </div>

      <hr class="footer-divider footer-divider--legal-gap">

      <div class="site-footer__legal">
        <div class="footer-business">
          <p>주)아이아이컴바인드 | 사업자등록번호: 119-86-38589 | 대표자: 김한국 | 서울특별시 성동구 뚝섬로 433 | 대표번호: 1644-1246</p>
          <p>이메일: Service.Kr@Tamburins.Com | 개인정보 보호 책임자: 정태호 | 호스팅 서비스 사업자: Aws | 통신판매업신고: 제 2014-서울마포-1050 호</p>
          <a href="#" class="footer-business__cctv">사업자정보확인고정형 영상 정보 처리기기 운영 및 관리</a>
          <p class="m-only footer-business__m">주)아이아이컴바인드<i></i>사업자등록번호: 119-86-38589<i></i>대표자: 김한국<i></i>서울특별시 성동구 뚝섬로 433<i></i>대표번호: 1644-1246<i></i>이메일: Service.Kr@Tamburins.Com<i></i>개인정보 보호 책임자: 정태호<i></i>호스팅 서비스 사업자: Aws<i></i>통신판매업신고: 제 2014-서울마포-1050 호<i></i><a href="#">사업자정보확인</a> <a href="#">고정형 영상 정보 처리기기 운영 및 관리</a></p>
        </div>
        <div class="footer-guarantee">
          <p>고객님의 안전한 현금자산 거래를 위하여 하나은행과 채무지급보증계약을 체결하여 보장해드리고 있습니다.</p>
          <a href="#">서비스 가입사실 확인</a>
        </div>
      </div>

      <hr class="footer-divider">

      <div class="site-footer__bottom">
        <p class="footer-copyright">© Tamburins</p>
        <a href="#" class="footer-shop-kr">
          <span>SHOP IN KOREAN</span>
          <img src="assets/icons/icon-arrow-forward-ios-footer.svg" alt="">
        </a>
      </div>
    </footer>`;

  let hasMobileHeader = false;
  document.querySelectorAll('[data-site-header]').forEach((slot) => {
    const mobile = slot.hasAttribute('data-no-mobile') ? '' : mobileHeaderMarkup(slot);
    hasMobileHeader = hasMobileHeader || !!mobile;
    const desktop = slot.hasAttribute('data-no-desktop') ? '' : headerMarkup(slot.dataset.variant || 'light');
    slot.outerHTML = desktop + mobile;
  });
  if (hasMobileHeader) document.body.insertAdjacentHTML('beforeend', drawerMarkup());

  // mobile drawer
  const drawer = document.getElementById('mDrawer');
  if (drawer) {
    const openers = document.querySelectorAll('[data-drawer-open]');
    const setDrawer = (open) => {
      drawer.classList.toggle('is-open', open);
      drawer.setAttribute('aria-hidden', String(!open));
      document.documentElement.classList.toggle('is-drawer-open', open);
      openers.forEach((b) => b.setAttribute('aria-expanded', String(open)));
    };
    openers.forEach((b) => b.addEventListener('click', () => setDrawer(true)));
    drawer.querySelectorAll('[data-drawer-close]').forEach((b) => b.addEventListener('click', () => setDrawer(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setDrawer(false); });
    // leaving the mobile layout (rotate / resize past 1280) closes it
    matchMedia('(min-width: 1280px)').addEventListener('change', (e) => { if (e.matches) setDrawer(false); });
  }
  // mobile back arrows: previous page, or home when opened directly
  document.addEventListener('click', (e) => {
    const back = e.target.closest('[data-back]');
    if (!back || back.hasAttribute('data-back-custom')) return;
    if (history.length > 1 && document.referrer.startsWith(location.origin)) history.back();
    else location.href = 'index.html';
  });
  // Header search (Figma 메인페이지 3차 v3-2): the magnifier opens a
  // 213px underlined field to its right, pushing the icon group left.
  // Enter searches the category page; the magnifier submits when there is
  // text and closes the field when it is empty; Esc / clicking away closes.
  document.querySelectorAll('[data-search]').forEach((box) => {
    const toggle = box.querySelector('.site-search__toggle');
    const form = box.querySelector('form');
    const input = form.querySelector('input');
    const setOpen = (open) => {
      box.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? '검색하기' : '검색 열기');
      input.tabIndex = open ? 0 : -1;
      if (open) setTimeout(() => input.focus(), 50);
    };
    const query = new URLSearchParams(location.search).get('q');
    if (query && /category\.html$/.test(location.pathname)) { input.value = query; setOpen(true); }

    toggle.addEventListener('click', () => {
      if (!box.classList.contains('is-open')) setOpen(true);
      else if (input.value.trim()) form.requestSubmit();
      else setOpen(false);
    });
    form.addEventListener('submit', (e) => {
      const q = input.value.trim();
      if (!q) { e.preventDefault(); input.focus(); return; }
      input.value = q;
    });
    input.addEventListener('keydown', (e) => { if (e.key === 'Escape') { setOpen(false); toggle.focus(); } });
    document.addEventListener('click', (e) => {
      if (box.classList.contains('is-open') && !box.contains(e.target) && !input.value.trim()) setOpen(false);
    });
  });

  // mobile footer: the nav column titles open their link lists
  document.addEventListener('click', (e) => {
    const title = e.target.closest('.footer-nav__title');
    if (!title || matchMedia('(min-width: 1280px)').matches) return;
    title.parentElement.classList.toggle('is-open');
  });

  document.querySelectorAll('[data-site-footer]').forEach((slot) => {
    if (!slot.hasAttribute('data-ruled')) { slot.outerHTML = FOOTER; return; }
    // ruled variant (product, category): the bank-guarantee note moves up
    // under the newsletter column instead of sitting in the legal row
    const tpl = document.createElement('template');
    tpl.innerHTML = FOOTER.replace('class="site-footer"', 'class="site-footer site-footer--ruled"').trim();
    const footer = tpl.content.firstElementChild;
    // (mobile keeps the original in the legal block; style.css hides it there on desktop)
    footer.querySelector('.footer-newsletter').appendChild(footer.querySelector('.footer-guarantee').cloneNode(true));
    slot.replaceWith(footer);
  });
})();
