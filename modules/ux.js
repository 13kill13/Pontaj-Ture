/* Pontaj Ture — interfață: preferințe, ecran de pornire, navigare pe categorii,
   filtre de sărbători vizibile sub calendar, setări. Se încarcă după app.js. */
(function () {
  'use strict';
  var root = document.documentElement;
  var $ = function (id) { return document.getElementById(id); };
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Preferințe de aspect (salvate pe dispozitiv) ---------- */
  var PREF_KEY = 'pontaj-ture-prefs-v1';
  var defaults = { theme: 'auto', text: 'm', density: 'normal', motion: true, today: false, haptic: false };
  var prefs = (function () {
    try { return Object.assign({}, defaults, JSON.parse(localStorage.getItem(PREF_KEY) || '{}')); } catch (e) { return Object.assign({}, defaults); }
  })();
  function savePrefs() { try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch (e) {} }
  function applyPrefs() {
    root.dataset.text = prefs.text; root.dataset.density = prefs.density;
    root.dataset.motion = (prefs.motion && !reduce) ? 'on' : 'off';
    if (prefs.theme === 'auto') {
      var dark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(dark ? 'dark' : 'light');
    } else { applyTheme(prefs.theme); }
    var sync = function (id, v) { var w = $(id); if (w) w.querySelectorAll('button').forEach(function (b) { b.classList.toggle('on', b.dataset.v === v); }); };
    sync('pref-theme', prefs.theme); sync('pref-text', prefs.text); sync('pref-density', prefs.density);
    var m = $('pref-motion'); if (m) m.checked = !!prefs.motion;
    var t = $('pref-today'); if (t) t.checked = !!prefs.today;
    var h = $('pref-haptic'); if (h) h.checked = !!prefs.haptic;
  }
  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    (mq.addEventListener ? mq.addEventListener.bind(mq, 'change') : mq.addListener.bind(mq))(function () { if (prefs.theme === 'auto') applyPrefs(); });
  }
  // butonul de temă din antet fixează alegerea (luminos/întunecat)
  var _toggleTheme = window.toggleTheme;
  window.toggleTheme = function () {
    prefs.theme = (root.getAttribute('data-theme') === 'dark') ? 'light' : 'dark';
    savePrefs(); applyPrefs();
    try { state.theme = prefs.theme; saveState(); } catch (e) {}
    updateThemeBtn();
  };
  // Butoanele „Luminos / Întunecat” din Setări → Pontaj salvau doar în calendar, iar la reîncărcare câștiga „Automat”.
  window.setTheme = function (t) {
    prefs.theme = t; savePrefs(); applyPrefs();
    try { state.theme = t; saveState(); } catch (e) {}
    updateThemeBtn();
    var l = $('set-theme-light'), d = $('set-theme-dark');
    if (l) l.classList.toggle('active-mode', t !== 'dark'); if (d) d.classList.toggle('active-mode', t === 'dark');
  };
  function updateThemeBtn() { var b = $('theme-toggle'); if (b) b.textContent = root.getAttribute('data-theme') === 'dark' ? '☀️' : '🌙'; }
  applyPrefs(); updateThemeBtn();

  function bindSeg(id, key) {
    var w = $(id); if (!w) return;
    w.querySelectorAll('button').forEach(function (b) {
      b.onclick = function () { prefs[key] = b.dataset.v; savePrefs(); applyPrefs(); updateThemeBtn(); };
    });
  }
  bindSeg('pref-theme', 'theme'); bindSeg('pref-text', 'text'); bindSeg('pref-density', 'density');
  [['pref-motion', 'motion'], ['pref-today', 'today'], ['pref-haptic', 'haptic']].forEach(function (p) {
    var el = $(p[0]); if (el) el.onchange = function () { prefs[p[1]] = el.checked; savePrefs(); applyPrefs(); };
  });
  var sv = $('set-version');
  if (sv) { var l = document.querySelector('link[rel="stylesheet"]'); var m = l && /v=([0-9a-f]+)/.exec(l.href); sv.textContent = 'Versiune: ' + (m ? m[1] : 'locală'); }
  var se = $('set-export'); if (se) se.onclick = function () { exportBackup(); };
  var si = $('set-import'); if (si) si.onclick = function () { closeSettings(); openImportModal(); };
  var sr = $('set-reset-ui'); if (sr) sr.onclick = function () { prefs = Object.assign({}, defaults); savePrefs(); applyPrefs(); uiToast('Preferințele de aspect au fost resetate.', 'ok'); };
  var sf = $('set-refresh');
  if (sf) sf.onclick = function () {
    var done = function () { location.reload(); };
    var jobs = [];
    if (navigator.serviceWorker && navigator.serviceWorker.getRegistrations) jobs.push(navigator.serviceWorker.getRegistrations().then(function (rs) { return Promise.all(rs.map(function (r) { return r.unregister(); })); }));
    if (window.caches) jobs.push(caches.keys().then(function (ks) { return Promise.all(ks.map(function (k) { return caches.delete(k); })); }));
    Promise.all(jobs).then(done, done);
  };

  /* ---------- Ecran de pornire (o singură dată pe sesiune) ---------- */
  (function preloader() {
    var pl = $('preloader'); if (!pl) return;
    var seen = false; try { seen = sessionStorage.getItem('pt-pl') === '1'; } catch (e) {}
    var off = function () { pl.classList.add('done'); setTimeout(function () { pl.remove(); }, 700); try { sessionStorage.setItem('pt-pl', '1'); } catch (e) {} };
    if (seen || reduce || !prefs.motion) { pl.remove(); return; }
    pl.classList.add('run');
    setTimeout(off, 1500);
  })();

  /* ---------- Înălțimea barelor lipite ---------- */
  function setBars() {
    var t = $('topbar'), n = $('section-nav');
    if (t) root.style.setProperty('--topbar-h', t.offsetHeight + 'px');
    if (n) root.style.setProperty('--nav-h', n.offsetHeight + 'px');
  }
  setBars(); window.addEventListener('resize', setBars); window.addEventListener('load', setBars);
  var _rps = window.renderPaintState;
  window.renderPaintState = function () { _rps.apply(this, arguments); var w = $('wb-tools'); if (w) w.classList.toggle('painting', !!ui.paint); };

  /* ---------- Navigare pe categorii ---------- */
  var track = $('nav-track'), nav = $('section-nav'), topbar = $('topbar');
  function stickyH() { return (topbar ? topbar.offsetHeight : 0) + (nav ? nav.offsetHeight : 0); }
  function goTo(id, openIds) {
    var el = $(id); if (!el) return;
    (openIds || []).forEach(function (m) { if (menuOpen(m) === false) applyMenuOpen(m, true); });
    var y = el.getBoundingClientRect().top + window.pageYOffset - stickyH() - 10;
    window.scrollTo({ top: Math.max(0, y), behavior: prefs.motion && !reduce ? 'smooth' : 'auto' });
  }
  window.goToSection = goTo;
  if (track) {
    track.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        goTo(a.dataset.target, (a.dataset.open || '').split(',').filter(Boolean));
      });
    });
    var arrows = nav.querySelectorAll('.nav-arrow');
    function arrowState() {
      var over = track.scrollWidth > track.clientWidth + 4;
      arrows[0].hidden = !over || track.scrollLeft < 8;
      arrows[1].hidden = !over || track.scrollLeft + track.clientWidth > track.scrollWidth - 8;
      nav.classList.toggle('fade-l', !arrows[0].hidden); nav.classList.toggle('fade-r', !arrows[1].hidden);
    }
    arrows[0].onclick = function () { track.scrollBy({ left: -220, behavior: 'smooth' }); };
    arrows[1].onclick = function () { track.scrollBy({ left: 220, behavior: 'smooth' }); };
    track.addEventListener('scroll', arrowState, { passive: true });
    window.addEventListener('resize', arrowState);
    track.addEventListener('wheel', function (e) {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && track.scrollWidth > track.clientWidth) { track.scrollLeft += e.deltaY; e.preventDefault(); }
    }, { passive: false });
    var drag = null;
    track.addEventListener('pointerdown', function (e) { if (e.pointerType === 'mouse') drag = { x: e.clientX, l: track.scrollLeft, moved: false }; });
    window.addEventListener('pointermove', function (e) { if (drag) { var dx = e.clientX - drag.x; if (Math.abs(dx) > 4) drag.moved = true; track.scrollLeft = drag.l - dx; } });
    window.addEventListener('pointerup', function () { setTimeout(function () { drag = null; }, 0); });
    track.addEventListener('click', function (e) { if (drag && drag.moved) { e.preventDefault(); e.stopPropagation(); } }, true);
    setTimeout(arrowState, 60);
    // pastila activă urmează secțiunea vizibilă
    var links = {}; track.querySelectorAll('a').forEach(function (a) { links[a.dataset.target] = a; });
    var ids = Object.keys(links);
    var ticking = false;
    function spy() {
      ticking = false;
      var line = stickyH() + 24, cur = ids[0];
      ids.forEach(function (id) { var el = $(id); if (el && el.getBoundingClientRect().top <= line) cur = id; });
      if (window.innerHeight + window.pageYOffset >= document.body.scrollHeight - 4) cur = ids[ids.length - 1];
      ids.forEach(function (id) { links[id].classList.toggle('active', id === cur); });
      var a = links[cur];
      if (a) { var c = a.offsetLeft - (track.clientWidth - a.offsetWidth) / 2; if (Math.abs(track.scrollLeft - c) > 40) track.scrollTo({ left: c, behavior: 'smooth' }); }
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(spy); } }, { passive: true });
  }

  /* ---------- Acasă (numele aplicației) ---------- */
  var brand = $('brand-home');
  if (brand) brand.onclick = function () {
    document.querySelectorAll('.modal-overlay').forEach(function (m) { m.style.display = 'none'; });
    var ap = $('auth-page'); if (ap) ap.classList.remove('open');
    document.querySelectorAll('[data-menu-id]').forEach(function (h) { applyMenuOpen(h.dataset.menuId, false); });
    var c = cal(), n = new Date();
    c.view = 'month'; c.year = n.getFullYear(); c.month = n.getMonth();
    saveState(); renderAll();
    window.scrollTo({ top: 0, behavior: prefs.motion && !reduce ? 'smooth' : 'auto' });
  };

  /* ---------- Filtre de sărbători: vizibile sub calendar, cu număr pe lună ---------- */
  window.renderFilterButtons = function () {
    var c = cal();
    ['holiday-filters', 'holiday-filters-main'].forEach(function (id) {
      var wrap = $(id); if (!wrap) return;
      wrap.innerHTML = HOLIDAY_CATEGORIES.map(function (cat) {
        var on = c.filters[cat.id] !== false, n = 0;
        if (c.view !== 'year') for (var d = 1; d <= daysInMonth(c.year, c.month); d++) if (holidaysFor(c.year, c.month, d).some(function (h) { return h.cat === cat.id; })) n++;
        return '<button type="button" class="filter-btn ' + (on ? 'active-' + cat.id : '') + '" data-type="' + cat.id + '" aria-pressed="' + on + '">' +
          '<span class="fdot"></span>' + escapeHtml(cat.name) + (c.view !== 'year' ? '<b class="fcount">' + n + '</b>' : '') + '</button>';
      }).join('');
      wrap.querySelectorAll('.filter-btn').forEach(function (b) {
        b.onclick = function () {
          var c2 = cal(), t = b.dataset.type, turnOn = c2.filters[t] === false;
          c2.filters[t] = turnOn;
          saveState(); renderFilterButtons(); renderCalendar(); renderSDSL();
          var cat = HOLIDAY_CATEGORIES.find(function (x) { return x.id === t; });
          var n = 0; for (var d = 1; d <= daysInMonth(c2.year, c2.month); d++) if (holidaysFor(c2.year, c2.month, d).some(function (h) { return h.cat === t; })) n++;
          if (turnOn) uiToast(n ? cat.name + ': ' + n + (n === 1 ? ' zi' : ' zile') + ' în ' + MONTHS_RO[c2.month].toLowerCase() + '.' : 'Nicio zi „' + cat.name.toLowerCase() + '” în ' + MONTHS_RO[c2.month].toLowerCase() + '. Răsfoiește alte luni.');
        };
      });
    });
    var st = c.holidaysUpdated ? 'Sursă: ' + HOLIDAYS_DATA.source + ' · actualizat ' + c.holidaysUpdated + '.' : null;
    ['holiday-status', 'holiday-status-main'].forEach(function (id) { var el = $(id); if (el && st && !/↻|⚠|✓|ℹ/.test(el.textContent)) el.textContent = st; });
    var note = $('hol-month-note');
    if (note) {
      var legal = []; for (var d2 = 1; d2 <= daysInMonth(c.year, c.month); d2++) holidaysFor(c.year, c.month, d2).forEach(function (h) { if (h.cat === 'legal') legal.push(d2 + ' ' + h.name); });
      note.textContent = c.view === 'year' ? '' : (legal.length ? 'Zile libere legale în ' + MONTHS_RO[c.month].toLowerCase() + ': ' + legal.join(' · ') : 'Nicio zi liberă legală în ' + MONTHS_RO[c.month].toLowerCase() + '.');
    }
  };
  var q = $('btn-update-holidays-quick');
  if (q) q.onclick = function () { q.classList.add('spin'); Promise.resolve(updateHolidays()).finally(function () { q.classList.remove('spin'); uiToast('Zilele libere au fost verificate.', 'ok'); }); };

  /* ---------- Calendar: apariție treptată la schimbarea lunii + vibrație ---------- */
  var lastKey = null, _rc = window.renderCalendar;
  window.renderCalendar = function () {
    _rc.apply(this, arguments);
    var c = cal(), k = c.year + '-' + c.month + '-' + c.view;
    if (k !== lastKey) {
      lastKey = k;
      var g = $('cal');
      if (g && root.dataset.motion === 'on' && c.view !== 'year') {
        g.querySelectorAll('.day:not(.empty)').forEach(function (el, i) { el.style.setProperty('--i', i); });
        g.classList.remove('cal-enter'); void g.offsetWidth; g.classList.add('cal-enter');
      }
      renderFilterButtons();
    }
  };
  var _odc = window.onDayClick;
  window.onDayClick = function (d) { if (prefs.haptic && ui.paint && navigator.vibrate) navigator.vibrate(8); return _odc.apply(this, arguments); };

  var nb = $('wb-new-shift');
  if (nb) nb.onclick = function () {
    ['gen', 'cat'].forEach(function (m) { if (menuOpen(m) === false) applyMenuOpen(m, true); });
    var f = $('shift-form'), t = $('btn-new-shift');
    if (f && f.style.display === 'none' && t) t.click();
    goTo('shift-form');
    setTimeout(function () { var n = $('f-name'); if (n) n.focus({ preventScroll: true }); }, 400);
  };

  /* ---------- Tură personalizată: construiește secvența din butoane ---------- */
  var keys = $('seq-keys'), seq = $('pt-seq');
  if (keys && seq) {
    keys.querySelectorAll('button[data-seq]').forEach(function (b) { b.onclick = function () { seq.value = (seq.value.trim() + ' ' + b.dataset.seq).trim(); seq.focus(); }; });
    var back = $('seq-back'); if (back) back.onclick = function () { var p = seq.value.trim().split(/\s+/); p.pop(); seq.value = p.join(' '); };
  }

  /* ---------- Pe PC cifrele stau lângă calendar (în coloana din dreapta), pe telefon sub el ---------- */
  var wide = window.matchMedia('(min-width:1000px)');
  function placeStats() {
    var tools = $('wb-tools'), calw = document.querySelector('.wb-cal'), st = document.querySelector('.stats.stats-4'), note = $('cal-stats-note'), fw = $('free-widget');
    if (!tools || !calw || !st) return;
    if (wide.matches) {
      var first = tools.querySelector('.tools-title'); tools.insertBefore(st, first); if (note) tools.insertBefore(note, first);
      if (fw) tools.appendChild(fw);                       // ture libere: în dreapta, sub blocul cu ture
    } else {
      var anchor = $('hol-month-note'); if (anchor) { anchor.after(st); if (note) st.after(note); if (fw) (note || st).after(fw); }
    }
  }
  (wide.addEventListener ? wide.addEventListener.bind(wide, 'change') : wide.addListener.bind(wide))(placeStats);
  placeStats();

  /* ---------- Început: luna curentă (opțional) și calendarul în prim-plan ---------- */
  if (prefs.today) { var c0 = cal(), n0 = new Date(); c0.year = n0.getFullYear(); c0.month = n0.getMonth(); c0.view = 'month'; saveState(); }
  renderAll();
  window.scrollTo(0, 0);
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
})();
