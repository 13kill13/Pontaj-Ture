/* Ferestre proprii ale aplicației — înlocuiesc alert()/confirm()/prompt() din browser,
   care afișau textul „pontajture.pages.dev spune:” și se suprapuneau pe telefon. */
(function () {
  function esc(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function toastHost() {
    let h = document.getElementById('toast-host');
    if (!h) { h = document.createElement('div'); h.id = 'toast-host'; h.setAttribute('aria-live', 'polite'); document.body.appendChild(h); }
    return h;
  }
  // Mesaj scurt, non-blocant. kind: ok | err | (implicit info)
  window.uiToast = function (text, kind) {
    const t = document.createElement('div');
    t.className = 'toast' + (kind ? ' ' + kind : '');
    t.textContent = text;
    toastHost().appendChild(t);
    requestAnimationFrame(() => t.classList.add('in'));
    setTimeout(() => { t.classList.remove('in'); setTimeout(() => t.remove(), 300); }, kind === 'err' ? 5200 : 3200);
  };
  window.uiAlert = function (text) { window.uiToast(text, /^eroare|nu |trebuie|lipsește|scrie|completează|există/i.test(String(text)) ? 'err' : ''); };

  function dialog(build) {
    return new Promise(resolve => {
      const ov = document.createElement('div');
      ov.className = 'dlg-overlay';
      ov.innerHTML = '<div class="dlg" role="dialog" aria-modal="true"></div>';
      const box = ov.firstChild;
      const prevFocus = document.activeElement;
      const close = v => { ov.classList.remove('in'); setTimeout(() => ov.remove(), 180); if (prevFocus && prevFocus.focus) setTimeout(() => prevFocus.focus(), 120); resolve(v); };
      build(box, close);
      document.body.appendChild(ov);
      requestAnimationFrame(() => ov.classList.add('in'));
      ov.addEventListener('mousedown', e => { if (e.target === ov) close(null); });
      ov.addEventListener('keydown', e => { if (e.key === 'Escape') close(null); });
    });
  }
  window.uiConfirm = function (text, okLabel) {
    return dialog((box, close) => {
      box.innerHTML = '<p class="dlg-text">' + esc(text) + '</p><div class="dlg-actions"><button class="btn-quiet" data-r="0">Anulează</button><button class="btn-danger" data-r="1">' + esc(okLabel || 'Da') + '</button></div>';
      box.querySelectorAll('button').forEach(b => b.onclick = () => close(b.dataset.r === '1'));
      box.querySelector('[data-r="1"]').focus();
    }).then(v => v === true);
  };
  // Alegere între mai multe variante: întoarce indexul ales sau null.
  window.uiChoice = function (text, labels) {
    return dialog((box, close) => {
      box.innerHTML = '<p class="dlg-text">' + esc(text) + '</p><div class="dlg-actions col">' + labels.map((l, i) => '<button class="' + (i === 0 ? 'btn-main' : 'btn-quiet') + '" data-i="' + i + '">' + esc(l) + '</button>').join('') + '</div>';
      box.querySelectorAll('button').forEach(b => b.onclick = () => close(Number(b.dataset.i)));
      box.querySelector('button').focus();
    });
  };
  window.uiPrompt = function (title, value, okLabel) {
    return dialog((box, close) => {
      box.innerHTML = '<label class="dlg-text" for="dlg-in">' + esc(title) + '</label><input id="dlg-in" class="dlg-input" type="text" value="' + esc(value || '') + '" /><div class="dlg-actions"><button class="btn-quiet" data-r="0">Anulează</button><button class="btn-main" data-r="1">' + esc(okLabel || 'OK') + '</button></div>';
      const inp = box.querySelector('input');
      box.querySelector('[data-r="0"]').onclick = () => close(null);
      box.querySelector('[data-r="1"]').onclick = () => close(inp.value);
      inp.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); close(inp.value); } };
      setTimeout(() => { inp.focus(); inp.select(); }, 30);
    });
  };
})();
