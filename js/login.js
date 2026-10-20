// Login page. Prototype account: ID "tamburins" with any non-empty
// password signs in; any other ID is rejected. A successful login
// always lands on the main page.

const AFTER_LOGIN = 'index.html';

document.addEventListener('DOMContentLoaded', async () => {
  const store = window.TamburinsStore;
  const page = document.querySelector('.login');
  const form = document.getElementById('loginForm');
  const msg = form.querySelector('[data-msg]');
  const id = form.elements.email;
  const password = form.elements.password;
  const say = (text, ok) => { msg.textContent = text; msg.style.color = ok ? 'var(--c-ink)' : ''; };

  if (await store.getUser()) { location.replace(AFTER_LOGIN); return; }

  const setMode = (mode) => { page.dataset.mode = mode; say(''); };
  document.querySelectorAll('[data-mode-switch]').forEach((btn) =>
    btn.addEventListener('click', () => setMode(btn.dataset.modeSwitch)));

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (page.dataset.mode === 'signup') {
      say('회원가입은 준비 중입니다.', true);
      return;
    }
    if (!id.value.trim()) { say('아이디를 입력해 주세요.'); id.focus(); return; }
    if (!password.value) { say('비밀번호를 입력해 주세요.'); password.focus(); return; }
    try {
      await store.signIn(id.value, password.value);
      location.href = AFTER_LOGIN;
    } catch (err) {
      say(err.message);
      password.value = '';
      password.focus();
    }
  });

  form.querySelector('[data-find="id"]').addEventListener('click', () =>
    say('아이디 찾기는 고객센터(1644-1246)로 문의해 주세요.', true));
  form.querySelector('[data-find="password"]').addEventListener('click', () =>
    say('비밀번호 찾기는 고객센터(1644-1246)로 문의해 주세요.', true));
  form.querySelectorAll('[data-social]').forEach((btn) =>
    btn.addEventListener('click', () => say(`${btn.dataset.social} 로그인은 준비 중입니다.`, true)));
});
