/* Pontaj Ture — pagina completă de cont (Supabase): conectare, cont nou cu e-mail de
   confirmare, parolă uitată, resetare parolă, schimbare parolă, deconectare.
   Se încarcă după app.js și înlocuiește vechea fereastră „Cont”. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return escapeHtml(String(s == null ? '' : s)); };
  var view = 'login', pendingEmail = '', cooldownTimer = null;

  /* ---------- Mesaje de eroare în română ---------- */
  function mapError(err) {
    var m = String((err && (err.message || err.error_description)) || err || '');
    var st = err && err.status;
    if (/Failed to fetch|NetworkError|Load failed|network/i.test(m) || navigator.onLine === false) return { code: 'net', text: 'Nu ai conexiune la internet. Încearcă din nou când revine.' };
    if (/Invalid login credentials/i.test(m)) return { code: 'creds', text: 'Parola este greșită sau nu există un cont cu acest e-mail.' };
    if (/Email not confirmed/i.test(m)) return { code: 'unconfirmed', text: 'Adresa de e-mail nu este confirmată încă. Deschide linkul primit pe e-mail.' };
    if (/already registered|already been registered|User already/i.test(m)) return { code: 'exists', text: 'Există deja un cont cu acest e-mail. Conectează-te sau resetează parola.' };
    if (/at least \d+ char|weak password|Password should/i.test(m)) return { code: 'weak', text: 'Parola trebuie să aibă cel puțin 6 caractere.' };
    if (/different from the old|same as the old/i.test(m)) return { code: 'same', text: 'Parola nouă trebuie să fie diferită de cea veche.' };
    if (/rate limit|too many|security purposes|429/i.test(m) || st === 429) return { code: 'rate', text: 'Prea multe încercări într-un timp scurt. Așteaptă câteva minute și încearcă din nou.' };
    if (/valid email|invalid format|Unable to validate email/i.test(m)) return { code: 'email', text: 'Adresa de e-mail nu este validă.' };
    if (/signups? (not allowed|are disabled)/i.test(m)) return { code: 'closed', text: 'Crearea de conturi noi este dezactivată momentan.' };
    if (/expired|invalid.*(token|link)|otp/i.test(m)) return { code: 'expired', text: 'Linkul a expirat sau a fost deja folosit. Cere unul nou.' };
    if (/session.*missing|not authenticated|JWT/i.test(m)) return { code: 'session', text: 'Sesiunea a expirat. Conectează-te din nou.' };
    return { code: 'other', text: 'A apărut o eroare: ' + m };
  }

  /* ---------- Pagina ---------- */
  var page = document.createElement('div');
  page.id = 'auth-page'; page.setAttribute('role', 'dialog'); page.setAttribute('aria-modal', 'true'); page.setAttribute('aria-label', 'Cont');
  page.innerHTML =
    '<div class="auth-shell">' +
      '<aside class="auth-side"><img src="icon.svg" alt="" width="56" height="56" /><h2>Pontaj Ture</h2>' +
        '<p>Ture, ore și zile libere într-un singur loc. Cu un cont, calendarele tale te urmăresc pe orice telefon sau computer.</p>' +
        '<ul><li>Sincronizare automată după fiecare modificare</li><li>Funcționează și fără internet</li><li>Datele tale, doar ale tale</li></ul></aside>' +
      '<main class="auth-main"><button class="auth-close" id="auth-close" aria-label="Închide">✕</button><div id="auth-body"></div></main>' +
    '</div>';
  document.body.appendChild(page);

  function open(v) {
    if (v) view = v;
    render();
    page.classList.add('open');
    document.body.classList.add('auth-open');
    setTimeout(function () { var f = page.querySelector('input:not([type=hidden])'); if (f && view !== 'account') f.focus(); }, 80);
  }
  function close() { page.classList.remove('open'); document.body.classList.remove('auth-open'); }
  $('auth-close').onclick = close;
  page.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

  function msg(kind, text, extra) {
    var el = $('auth-msg'); if (!el) { uiToast(text, kind === 'err' ? 'err' : 'ok'); return; }
    el.className = 'auth-msg ' + (kind || ''); el.innerHTML = '<span>' + esc(text) + '</span>' + (extra || '');
    el.hidden = !text;
  }
  function busy(btn, on, label) { if (!btn) return; btn.disabled = on; if (on) { btn.dataset.l = btn.textContent; btn.innerHTML = '<i class="spinner"></i>' + esc(label || 'Se încarcă…'); } else btn.textContent = btn.dataset.l || btn.textContent; }
  function pwField(id, label, auto, extra) {
    return '<label class="af"><span>' + label + '</span><div class="af-pw"><input id="' + id + '" type="password" autocomplete="' + auto + '" placeholder="••••••••" ' + (extra || '') + ' /><button type="button" class="af-eye" data-eye="' + id + '" aria-label="Arată parola">👁</button></div></label>';
  }
  function strength(p) {
    var s = 0; if (p.length >= 6) s++; if (p.length >= 10) s++; if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++; if (/\d/.test(p) && /[^A-Za-z0-9]/.test(p)) s++;
    return Math.min(s, 4);
  }

  /* ---------- Vederi ---------- */
  function render() {
    var b = $('auth-body'), h = '';
    if (currentUser && view !== 'recovery') view = 'account';
    if (view === 'login' || view === 'signup') {
      var su = view === 'signup';
      h = '<h1>' + (su ? 'Creează un cont' : 'Bine ai revenit') + '</h1>' +
        '<p class="auth-sub">' + (su ? 'Îți trimitem un e-mail de confirmare. Contul se activează după ce deschizi linkul din el.' : 'Conectează-te ca să-ți regăsești calendarele.') + '</p>' +
        '<div class="auth-tabs"><button class="' + (!su ? 'on' : '') + '" data-v="login">Conectare</button><button class="' + (su ? 'on' : '') + '" data-v="signup">Cont nou</button></div>' +
        '<form id="auth-form" novalidate>' +
        '<label class="af"><span>E-mail</span><input id="auth-email" type="email" inputmode="email" autocomplete="email" placeholder="nume@exemplu.ro" value="' + esc(pendingEmail) + '" /></label>' +
        pwField('auth-pass', 'Parolă', su ? 'new-password' : 'current-password') +
        (su ? '<div class="pw-meter" id="pw-meter"><i></i><i></i><i></i><i></i></div>' + pwField('auth-pass2', 'Repetă parola', 'new-password') : '') +
        '<div id="auth-msg" class="auth-msg" hidden></div>' +
        '<button class="auth-submit" type="submit">' + (su ? 'Creează contul' : 'Conectează-te') + '</button>' +
        (su ? '' : '<button type="button" class="auth-link" data-v="forgot">Ai uitat parola?</button>') +
        '</form>' +
        '<p class="auth-foot">' + (su ? 'Ai deja cont? <button class="auth-link" data-v="login">Conectează-te</button>' : 'Nu ai cont? <button class="auth-link" data-v="signup">Creează unul gratuit</button>') + '</p>' +
        '<p class="auth-skip">Poți folosi aplicația și fără cont — datele rămân pe acest dispozitiv. <button class="auth-link" id="auth-skip">Continuă fără cont</button></p>';
    } else if (view === 'forgot') {
      h = '<h1>Resetează parola</h1><p class="auth-sub">Scrie e-mailul contului. Îți trimitem un link ca să alegi o parolă nouă.</p>' +
        '<form id="auth-form" novalidate><label class="af"><span>E-mail</span><input id="auth-email" type="email" inputmode="email" autocomplete="email" placeholder="nume@exemplu.ro" value="' + esc(pendingEmail) + '" /></label>' +
        '<div id="auth-msg" class="auth-msg" hidden></div><button class="auth-submit" type="submit">Trimite linkul</button></form>' +
        '<p class="auth-foot"><button class="auth-link" data-v="login">← Înapoi la conectare</button></p>';
    } else if (view === 'sent') {
      h = '<div class="auth-bigicon">✉️</div><h1>Verifică e-mailul</h1><p class="auth-sub">Am trimis un link de confirmare la <b>' + esc(pendingEmail) + '</b>. Deschide-l ca să activezi contul, apoi revino aici — te conectăm automat.</p>' +
        '<div id="auth-msg" class="auth-msg" hidden></div>' +
        '<button class="auth-submit ghost" id="auth-resend">Retrimite e-mailul</button>' +
        '<p class="auth-foot">Nu-l găsești? Verifică și în Spam / Promoții. <br/><button class="auth-link" data-v="login">← Înapoi la conectare</button></p>';
    } else if (view === 'recovery') {
      h = '<h1>Alege o parolă nouă</h1><p class="auth-sub">Linkul din e-mail a funcționat. Scrie noua parolă a contului.</p>' +
        '<form id="auth-form" novalidate>' + pwField('auth-pass', 'Parolă nouă', 'new-password') + '<div class="pw-meter" id="pw-meter"><i></i><i></i><i></i><i></i></div>' + pwField('auth-pass2', 'Repetă parola nouă', 'new-password') +
        '<div id="auth-msg" class="auth-msg" hidden></div><button class="auth-submit" type="submit">Salvează parola</button></form>';
    } else if (view === 'account' && currentUser) {
      var em = currentUser.email || '';
      h = '<div class="acc-head"><div class="acc-avatar">' + esc((em[0] || '?').toUpperCase()) + '</div><div><h1>' + esc(em) + '</h1><p class="auth-sub" id="acc-sync">' + syncText() + '</p></div></div>' +
        '<div class="acc-actions"><button class="auth-submit" id="acc-sync-btn">↻ Sincronizează acum</button><button class="auth-submit ghost" id="acc-logout">Deconectare</button></div>' +
        '<div id="auth-msg" class="auth-msg" hidden></div>' +
        '<details class="acc-box"><summary>Schimbă parola</summary><form id="auth-form" novalidate>' + pwField('auth-pass', 'Parolă nouă', 'new-password') + pwField('auth-pass2', 'Repetă parola nouă', 'new-password') + '<button class="auth-submit" type="submit">Schimbă parola</button></form></details>' +
        '<details class="acc-box"><summary>Copie de siguranță</summary><p class="auth-sub">Un fișier JSON cu toate calendarele tale, independent de cont.</p><div class="acc-actions"><button class="auth-submit ghost" id="acc-export">📤 Exportă</button><button class="auth-submit ghost" id="acc-import">📥 Importă</button></div></details>';
    }
    b.innerHTML = h;
    bind();
  }
  function syncText() {
    if (!currentUser) return '';
    if (navigator.onLine === false) return 'Ești offline — modificările se trimit când revine internetul.';
    return (typeof cloudPending !== 'undefined' && cloudPending) ? 'Modificări în așteptare — se trimit automat.' : '✓ Datele se sincronizează automat în cont.';
  }

  function bind() {
    page.querySelectorAll('[data-v]').forEach(function (el) { el.onclick = function (e) { e.preventDefault(); var em = $('auth-email'); if (em) pendingEmail = em.value.trim(); view = el.dataset.v; render(); var f = page.querySelector('input'); if (f) f.focus(); }; });
    page.querySelectorAll('[data-eye]').forEach(function (el) { el.onclick = function () { var i = $(el.dataset.eye); i.type = i.type === 'password' ? 'text' : 'password'; el.classList.toggle('on', i.type === 'text'); }; });
    var skip = $('auth-skip'); if (skip) skip.onclick = close;
    var p1 = $('auth-pass'), meter = $('pw-meter');
    if (p1 && meter) p1.oninput = function () { var s = strength(p1.value); meter.dataset.s = s; };
    var form = $('auth-form'); if (form) form.onsubmit = function (e) { e.preventDefault(); submit(form.querySelector('button[type=submit]')); };
    var rs = $('auth-resend'); if (rs) { rs.onclick = resend; startCooldown(rs, 0); }
    var sy = $('acc-sync-btn'); if (sy) sy.onclick = async function () { busy(sy, true, 'Se sincronizează…'); try { await doAccountSync(); } catch (e) {} busy(sy, false); var t = $('acc-sync'); if (t) t.textContent = syncText(); msg('ok', 'Sincronizat.'); };
    var lo = $('acc-logout'); if (lo) lo.onclick = async function () { await doAccountLogout(); view = 'login'; pendingEmail = ''; render(); uiToast('Te-ai deconectat. Datele rămân pe acest dispozitiv.', 'ok'); };
    var ex = $('acc-export'); if (ex) ex.onclick = function () { exportBackup(); };
    var im = $('acc-import'); if (im) im.onclick = function () { close(); openImportModal(); };
  }

  /* ---------- Acțiuni ---------- */
  function client() {
    if (!supabaseClient) { msg('err', 'Serviciul de conturi nu s-a încărcat. Verifică internetul și reîncarcă pagina.'); return null; }
    if (navigator.onLine === false) { msg('err', 'Nu ai conexiune la internet. Contul are nevoie de internet; aplicația rămâne utilizabilă offline.'); return null; }
    return supabaseClient;
  }
  async function submit(btn) {
    var sb = client(); if (!sb) return;
    var email = ($('auth-email') ? $('auth-email').value : (currentUser && currentUser.email) || '').trim().toLowerCase();
    var pass = $('auth-pass') ? $('auth-pass').value : '', pass2 = $('auth-pass2') ? $('auth-pass2').value : '';
    msg('', '');
    if (view !== 'recovery' && view !== 'account') {
      if (!email) return msg('err', 'Scrie adresa de e-mail.');
      if (!isValidEmail(email)) return msg('err', 'Adresa de e-mail nu pare corectă (ex. nume@exemplu.ro).');
      pendingEmail = email;
    }
    // Cât timp se conectează, blocăm încărcarea automată din app.js: întâi te întrebăm ce date se păstrează.
    var guard = function () { currentUser = { id: 'pending', email: email, _p: true }; };
    try {
      if (view === 'login') {
        if (!pass) return msg('err', 'Scrie parola.');
        guard();
        busy(btn, true, 'Se conectează…');
        var r = await sb.auth.signInWithPassword({ email: email, password: pass });
        if (r.error) throw r.error;
        await onSignedIn(r.data.user, 'Te-ai conectat.');
      } else if (view === 'signup') {
        if (pass.length < 6) return msg('err', 'Parola trebuie să aibă cel puțin 6 caractere.');
        if (pass !== pass2) return msg('err', 'Cele două parole nu sunt la fel.');
        busy(btn, true, 'Se creează contul…'); guard();
        var s = await sb.auth.signUp({ email: email, password: pass, options: { emailRedirectTo: window.location.origin } });
        if (s.error) throw s.error;
        if (s.data.user && s.data.user.identities && s.data.user.identities.length === 0) throw { message: 'User already registered' };
        if (s.data.session) await onSignedIn(s.data.user, 'Cont creat.');
        else { currentUser = null; view = 'sent'; render(); startCooldown($('auth-resend'), 60); }
      } else if (view === 'forgot') {
        busy(btn, true, 'Se trimite…');
        var f = await sb.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
        if (f.error) throw f.error;
        msg('ok', 'Dacă există un cont cu ' + email + ', ai primit un e-mail cu linkul de resetare. Verifică și în Spam.');
      } else if (view === 'recovery' || view === 'account') {
        if (pass.length < 6) return msg('err', 'Parola nouă trebuie să aibă cel puțin 6 caractere.');
        if (pass !== pass2) return msg('err', 'Cele două parole nu sunt la fel.');
        busy(btn, true, 'Se salvează…');
        var u = await sb.auth.updateUser({ password: pass });
        if (u.error) throw u.error;
        if (view === 'recovery') { var g = await sb.auth.getSession(); if (g.data.session) await onSignedIn(g.data.session.user, 'Parola a fost schimbată.'); else { view = 'login'; render(); } }
        else { uiToast('Parola a fost schimbată.', 'ok'); render(); }
        history.replaceState(null, '', location.pathname + location.search);
      }
    } catch (err) {
      if (currentUser && currentUser._p) currentUser = null;
      var e = mapError(err);
      var extra = '';
      if (e.code === 'creds') extra = '<span class="auth-hints"><button class="auth-link" data-v="forgot">Resetează parola</button><button class="auth-link" data-v="signup">Creează cont</button></span>';
      if (e.code === 'unconfirmed') extra = '<span class="auth-hints"><button class="auth-link" id="auth-resend-inline">Retrimite e-mailul de confirmare</button></span>';
      if (e.code === 'exists') extra = '<span class="auth-hints"><button class="auth-link" data-v="login">Conectează-te</button><button class="auth-link" data-v="forgot">Resetează parola</button></span>';
      busy(btn, false); msg('err', e.text, extra);
      page.querySelectorAll('#auth-msg [data-v]').forEach(function (el) { el.onclick = function () { view = el.dataset.v; render(); }; });
      var ri = $('auth-resend-inline'); if (ri) ri.onclick = function () { resend(); };
      return;
    }
    busy(btn, false);
  }
  async function resend() {
    var sb = client(); if (!sb || !pendingEmail) return;
    var btn = $('auth-resend');
    try {
      var r = await sb.auth.resend({ type: 'signup', email: pendingEmail, options: { emailRedirectTo: window.location.origin } });
      if (r.error) throw r.error;
      if (view !== 'sent') { view = 'sent'; render(); }
      msg('ok', 'Am retrimis e-mailul de confirmare.'); startCooldown($('auth-resend'), 60);
    } catch (err) { msg('err', mapError(err).text); }
  }
  function startCooldown(btn, secs) {
    if (!btn) return; clearInterval(cooldownTimer);
    var left = secs; if (!left) return;
    btn.disabled = true;
    (function tick() { btn.textContent = left > 0 ? 'Retrimite e-mailul (' + left + ' s)' : 'Retrimite e-mailul'; if (left-- <= 0) { clearInterval(cooldownTimer); btn.disabled = false; } })();
    cooldownTimer = setInterval(function () { if (left <= 0) { clearInterval(cooldownTimer); btn.disabled = false; btn.textContent = 'Retrimite e-mailul'; } else { btn.textContent = 'Retrimite e-mailul (' + left + ' s)'; left--; } }, 1000);
  }

  // După autentificare: dacă există date și local, și în cont, întrebăm care se păstrează.
  async function onSignedIn(user, okText) {
    currentUser = user; renderAccountButton();
    var hasLocal = (state.calendars || []).some(function (c) { return Object.keys(c.assignments || {}).length > 0; });
    var cloud = null;
    try { var q = await supabaseClient.from('user_data').select('config_json').eq('user_id', user.id).maybeSingle(); cloud = q && q.data && q.data.config_json; } catch (e) {}
    if (cloud && cloud.calendars && hasLocal && JSON.stringify(cloud.calendars) !== JSON.stringify(state.calendars)) {
      var pick = await uiChoice('Ai calendare și pe acest dispozitiv, și în cont. Care se păstrează?', ['Folosește datele din cont', 'Păstrează cele de pe dispozitiv (le urc în cont)']);
      if (pick === 1) { await pushToSupabase(false); }
      else { await loadDataFromSupabase(user.id); }
    } else if (cloud) { await loadDataFromSupabase(user.id); }
    else { await pushToSupabase(false); }
    view = 'account'; render(); uiToast(okText, 'ok'); close();
  }

  /* ---------- Înlocuiri pentru funcțiile din app.js ---------- */
  window.openAccountModal = function () { open(currentUser ? 'account' : (view === 'signup' ? 'signup' : 'login')); };
  window.closeAccountModal = close;
  window.renderAccountButton = function () {
    var b = $('account-btn'); if (!b) return;
    var name = currentUser && currentUser.email ? currentUser.email.split('@')[0] : 'Cont';
    b.innerHTML = '👤 <span class="lbl">' + esc(name) + '</span>'; b.classList.toggle('logged-in', !!currentUser);
    b.title = currentUser ? 'Cont: ' + currentUser.email : 'Conectare / cont nou';
  };
  window.setAccountStatus = function (text, kind) {
    var t = $('acc-sync'); if (t && page.classList.contains('open') && view === 'account') t.textContent = text;
    if (text && (kind === 'err' || /Autentificat|Deconectat/.test(text) === false)) { /* mesajele de stare nu sunt repetate ca notificări */ }
  };
  window.showAccountRecovery = function () { view = 'recovery'; open('recovery'); };
  window.hideAccountRecovery = function () { if (view === 'recovery') view = currentUser ? 'account' : 'login'; };
  window.updateAccountExtras = function () { if (page.classList.contains('open')) render(); };
  var _acct = $('account-btn'); if (_acct) _acct.onclick = window.openAccountModal;
  renderAccountButton();

  // Reacții la linkurile din e-mail (confirmare cont / resetare parolă / link expirat)
  (function fromLink() {
    var h = location.hash || '';
    if (/error_code=otp_expired|error=access_denied/.test(h)) {
      var d = (/error_description=([^&]+)/.exec(h) || [])[1];
      history.replaceState(null, '', location.pathname + location.search);
      view = 'forgot'; open('forgot'); msg('err', 'Linkul a expirat sau a fost deja folosit. Cere unul nou mai jos.');
    } else if (/type=signup|type=email/.test(h)) {
      setTimeout(function () { uiToast('Adresa de e-mail a fost confirmată. Contul este activ.', 'ok'); }, 900);
    } else if (/type=recovery/.test(h)) { view = 'recovery'; }
  })();
  if (supabaseClient) supabaseClient.auth.onAuthStateChange(function (ev) {
    if (ev === 'PASSWORD_RECOVERY') { view = 'recovery'; open('recovery'); }
    if (ev === 'SIGNED_OUT' && page.classList.contains('open')) { view = 'login'; render(); }
  });
})();
