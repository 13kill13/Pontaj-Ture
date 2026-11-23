/* Tema comună pentru toate paginile: urmărește alegerea din aplicație (Automat / Luminos / Întunecat). */
(function () {
  var root = document.documentElement;
  function read() {
    var t = 'auto', text = 'm';
    try { var p = JSON.parse(localStorage.getItem('pontaj-ture-prefs-v1') || '{}'); if (p.theme) t = p.theme; if (p.text) text = p.text; } catch (e) {}
    if (t === 'auto') {
      var st = null; try { st = JSON.parse(localStorage.getItem('ore-ture-state-v1') || 'null'); } catch (e) {}
      var dark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      t = dark ? 'dark' : 'light';
    }
    root.setAttribute('data-theme', t); root.dataset.text = text;
  }
  read();
  window.addEventListener('storage', function (e) { if (!e.key || e.key.indexOf('pontaj-ture-prefs') === 0 || e.key.indexOf('ore-ture-state') === 0) read(); });
  if (window.matchMedia) { var mq = window.matchMedia('(prefers-color-scheme: dark)'); (mq.addEventListener ? mq.addEventListener.bind(mq, 'change') : mq.addListener.bind(mq))(read); }
})();
