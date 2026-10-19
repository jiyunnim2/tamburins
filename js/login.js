// Login page: email/password sign-in, sign-up (same form, toggled by
// 회원가입), password reset mail, and the guest order lookup link.

document.addEventListener('DOMContentLoaded', async () => {
  const store = window.TamburinsStore;
  const page = document.querySelector('.login');
  const form = document.getElementById('loginForm');
  const msg = form.querySelector('[data-msg]');
  const email = form.elements.email;
  const password = form.elements.password;
  const next = new URLSearchParams(location.search).get('next') || 'mypage.html';
  const say = (text, ok) => { msg.textContent = text; msg.style.color = ok ? 'var(--c-ink)' : ''; };

  if (await store.getUser()) { location.replace(next); return; }

  const setMode = (mode) => {
    page.dataset.mode = mode;
    password.autocomplete = mode === 'signup' ? 'new-password' : 'current-password';
    say('');
  };
  document.querySelectorAll('[data-mode-switch]').forEach((btn) =>
    btn.addEventListener('click', () => setMode(btn.dataset.modeSwitch)));

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) { say('아이디(이메일)를 정확히 입력해 주세요.'); email.focus(); return; }
    if (password.value.length < 6) { say('비밀번호는 6자 이상 입력해 주세요.'); password.focus(); return; }

    const submit = form.querySelector('.login__submit');
    submit.disabled = true;
    try {
      if (page.dataset.mode === 'signup') {
        const res = await store.signUp(email.value.trim(), password.value);
        if (res && res.session === null) {
          setMode('login');
          say('가입 확인 메일을 보냈습니다. 메일의 링크를 누른 뒤 로그인해 주세요.', true);
          return;
        }
      } else {
        await store.signIn(email.value.trim(), password.value);
      }
      location.href = next;
    } catch (err) {
      say(err.message);
    } finally {
      submit.disabled = false;
    }
  });

  form.querySelector('[data-find="id"]').addEventListener('click', () =>
    say('아이디는 가입하신 이메일 주소입니다. 기억나지 않으면 고객센터(1644-1246)로 문의해 주세요.', true));
  form.querySelector('[data-find="password"]').addEventListener('click', async () => {
    if (!email.value.trim()) { say('비밀번호를 재설정할 이메일을 먼저 입력해 주세요.'); email.focus(); return; }
    try {
      await store.resetPassword(email.value.trim());
      say('비밀번호 재설정 메일을 보냈습니다.', true);
    } catch (err) { say(err.message); }
  });
  form.querySelectorAll('[data-social]').forEach((btn) =>
    btn.addEventListener('click', () => say(`${btn.dataset.social} 로그인은 준비 중입니다. 이메일로 로그인해 주세요.`, true)));
});
