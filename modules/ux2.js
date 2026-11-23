/* Pontaj Ture — a doua parte a interfeței: bara laterală, „ture libere” lângă calendar, listă de sărbători,
   estimare salariu, anulare, ore din luna anterioară, scurtătură de instalare. Se încarcă după ux.js. */
(function () {
  'use strict';
  var root = document.documentElement;
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return escapeHtml(String(s == null ? '' : s)); };
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Bara laterală cu navigare între secțiuni ---------- */
  (function sideRail() {
    var links = document.querySelectorAll('#nav-track a'); if (!links.length) return;
    var rail = document.createElement('nav'); rail.id = 'side-rail'; rail.setAttribute('aria-label', 'Secțiuni');
    rail.innerHTML = '<div class="rail-line"><i id="rail-fill"></i></div>' + Array.prototype.map.call(links, function (a) {
      return '<button type="button" data-target="' + a.dataset.target + '" aria-label="' + esc(a.textContent) + '"><span class="rl">' + esc(a.textContent) + '</span><span class="rd"></span></button>';
    }).join('');
    document.body.appendChild(rail);
    var btns = rail.querySelectorAll('button'), fill = $('rail-fill'), tick = false;
    btns.forEach(function (b, i) { b.onclick = function () { links[i].click(); }; });
    function upd() {
      tick = false;
      var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      fill.style.height = Math.min(100, (window.pageYOffset / max) * 100) + '%';
      links.forEach(function (a, i) { btns[i].classList.toggle('active', a.classList.contains('active')); });
    }
    window.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true });
    window.addEventListener('resize', upd); setTimeout(upd, 200);
  })();

  /* ---------- Ore din luna anterioară (editabile, cu „Auto”) ---------- */
  var pf = $('extra-prev');
  if (pf) pf.oninput = function () {
    var c = cal(), k = monthKey(c.year, c.month); c.prevOverride = c.prevOverride || {};
    if (pf.value === '' || isNaN(Number(pf.value))) delete c.prevOverride[k]; else c.prevOverride[k] = Number(pf.value);
    saveState(); renderCalc(); renderFreeWidget();
  };
  var pr = $('prev-reset');
  if (pr) pr.onclick = function () { var c = cal(); if (c.prevOverride) delete c.prevOverride[monthKey(c.year, c.month)]; if (c.prevPinned) delete c.prevPinned[monthKey(c.year, c.month)]; saveState(); renderAll(); uiToast('Revenit la calculul automat.', 'ok'); };

  /* ---------- „Reține orele”: valorile fixate nu mai sunt schimbate de calcul automat ---------- */
  function pinState() {
    var c = cal(), k = monthKey(c.year, c.month), rec = carryRec(c, c.year, c.month);
    return { prev: !!(c.prevPinned || {})[k], next: !!rec.pinned, c: c, k: k, rec: rec };
  }
  function paintPins() {
    var st = pinState();
    var set = function (btn, badge, on, txt) { var b = $(btn); if (b) { b.classList.toggle('on', on); b.textContent = on ? '📌 Reținut ✓' : '📌 Reține orele'; b.title = on ? 'Apasă pentru a renunța la fixare' : 'Păstrează aceste ore'; } var g = $(badge); if (g && on) g.textContent = '📌 reținut'; };
    set('prev-pin', 'prev-mode', st.prev); set('carry-pin', 'carry-mode', st.next);
  }
  var pp = $('prev-pin');
  if (pp) pp.onclick = function () {
    var st = pinState(), c = st.c; c.prevOverride = c.prevOverride || {}; c.prevPinned = c.prevPinned || {};
    if (st.prev) { delete c.prevPinned[st.k]; uiToast('Fixarea orelor din luna anterioară a fost anulată (valoarea rămâne, o poți edita).'); }
    else { var v = Number($('extra-prev').value); c.prevOverride[st.k] = isNaN(v) ? 0 : v; c.prevPinned[st.k] = true; uiToast('Orele din luna anterioară au fost reținute: ' + (c.prevOverride[st.k] > 0 ? '+' : '') + c.prevOverride[st.k] + ' h.', 'ok'); }
    saveState(); renderAll();
  };
  var cp = $('carry-pin');
  if (cp) cp.onclick = function () {
    var st = pinState(), rec = st.rec;
    if (st.next) { rec.pinned = false; uiToast('Fixarea orelor pentru luna viitoare a fost anulată (valoarea rămâne, o poți edita).'); }
    else { var v = Number($('extra-next').value); rec.v = isNaN(v) ? 0 : v; rec.manual = true; rec.pinned = true; uiToast('Orele pentru luna viitoare au fost reținute: ' + (rec.v > 0 ? '+' : '') + rec.v + ' h.', 'ok'); }
    saveState(); renderAll();
  };

  /* ---------- „Ture libere” lângă calendar: variante selectabile + concedii (CO / COS / CM) ---------- */
  function countMarked(c, pred) {
    var n = 0, dim = daysInMonth(c.year, c.month);
    for (var d = 1; d <= dim; d++) {
      var ids = c.assignments[key(c.year, c.month, d)] || [];
      if (ids.some(function (id) { var t = typeById(c, id); return t && pred(t, id); })) n++;
    }
    return n;
  }
  function sw(n, one, many) { return n ? n + ' ' + (n === 1 ? one : many) : ''; }
  var DEFAULTS = { priv: [21, 0], bug: [21, 0], pol: [38, 5], isu: [38, 5], jand: [38, 5], anp: [38, 5], med: [21, 0], asis: [21, 0], alt: [21, 0] };
  // Zilele de concediu din anul afișat: luate (până azi), planificate (după azi), rămase din normă.
  // Tipul de concediu se recunoaște după culoare/cod/nume, nu doar după id (calendarele vechi sau tipurile recreate au alt id).
  function leaveKind(t) {
    if (!t) return '';
    var code = String(t.code || '').toUpperCase().trim(), name = String(t.name || '').toLowerCase(), id = String(t.id || '').toUpperCase();
    if (t.cls === 'cos' || code === 'COS' || id === 'COS' || /\bcos\b/.test(name)) return 'COS';
    if (t.cls === 'cm' || code === 'CM' || id === 'CM' || /medical/.test(name)) return 'CM';
    if (t.cls === 'co' || code === 'CO' || id === 'CO' || /odihn/.test(name)) return 'CO';
    return '';
  }
  // Zilele de concediu din anul afișat: luate (până azi), planificate (după azi), rămase din normă.
  function leaveStats(c, kind, ent) {
    var y = c.year, now = new Date(), t0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()), taken = 0, planned = 0, skipped = 0;
    for (var m = 0; m < 12; m++) for (var d = 1; d <= daysInMonth(y, m); d++) {
      var ids = c.assignments[key(y, m, d)] || [];
      if (!ids.some(function (id) { return leaveKind(typeById(c, id)) === kind; })) continue;
      var dt = new Date(y, m, d);
      if (!c.coCountAll && kind !== 'CM' && isSdslDate(dt)) { skipped++; continue; }   // weekendurile și sărbătorile nu se scad din concediu
      if (dt <= t0) taken++; else planned++;
    }
    return { taken: taken, planned: planned, left: ent - taken - planned, ent: ent, skipped: skipped };
  }
  function leaveHtml(c) {
    var co = leaveStats(c, 'CO', Number(c.coDays) || 21), cos = leaveStats(c, 'COS', Number(c.cosDays) || 0), cm = leaveStats(c, 'CM', Number(c.cmDays) || 183);
    var n = new Date(), z = function (k) { return Math.abs(k) === 1 ? 'zi' : 'zile'; };
    var row = function (name, l) {
      var left = l.left < 0 ? '<b class="over">' + Math.abs(l.left) + ' peste normă</b>' : '<b>' + l.left + '</b> ' + z(l.left) + ' rămase';
      return '<div class="lv-row"><div class="lv-name">' + name + '<span class="muted"> din ' + l.ent + '</span></div>' +
        '<div class="lv-nums"><span>luate <b>' + l.taken + '</b></span><span>planificate <b>' + l.planned + '</b></span><span>' + left + '</span>' + (l.skipped ? '<span class="muted">(' + l.skipped + ' în weekend/sărbători, nu se scad)</span>' : '') + '</div></div>';
    };
    return '<div class="fw-leave"><div class="fw-leave-t">🏖 Concedii ' + c.year + (c.year === n.getFullYear() ? ' · azi ' + n.getDate() + '.' + (n.getMonth() + 1) : '') + '</div>' +
      row('CO · concediu de odihnă', co) + (cos.ent || cos.taken || cos.planned ? row('COS', cos) : '') +
      '<div class="lv-row"><div class="lv-name">CM · concediu medical<span class="muted"> limită orientativă ' + cm.ent + '</span></div><div class="lv-nums"><span>luate <b>' + cm.taken + '</b></span><span>planificate <b>' + cm.planned + '</b></span></div></div>' +
      '<div class="lv-help"><b>Cum modifici zilele de concediu (în funcție de angajator)</b>' +
      '<p>Normele diferă de la un angajator la altul. Apasă <button type="button" class="lv-link" data-act="set-calc">Setări → Calcul</button> și acolo:</p>' +
      '<ol><li>alegi <b>Domeniul</b> tău: se completează valori orientative;</li><li>sau scrii direct <b>Zile CO</b>, <b>Zile COS</b> și <b>Limita CM</b>;</li><li>bifezi „Numără și weekendurile” dacă angajatorul scade și zilele nelucrătoare.</li></ol>' +
      '<ul><li>Privat: minimum 20 de zile lucrătoare CO pe an (Codul Muncii), de regulă 21 în contract.</li><li>Bugetar: după vechime și actul de salarizare; întreabă la resurse umane.</li><li>MAI / ANP: 32 zile CO (38 zile CO cu peste 10 ani vechime in campul muncii) + 5 zile COS.</li><li>Medici și asistenți: conform contractului colectiv din unitate.</li></ul>' +
      '<p class="muted">Valorile sunt orientative: contractul și vechimea ta contează.</p></div></div>';
  }
  function syncLeaveFields(c) {
    var set = function (id, v) { var e = $(id); if (e && document.activeElement !== e) e.value = v; };
    set('set-co-days', c.coDays || 21); set('set-cos-days', c.cosDays || 0); set('set-cm-days', c.cmDays || 183); set('set-domain', c.domain || '');
    var ca = $('set-co-all'); if (ca) ca.checked = !!c.coCountAll;
  }
  function renderFreeWidget() {
    var w = $('free-widget'); if (!w) return;
    var c = cal(), p = ui.lastPlan; syncLeaveFields(c);
    var leave = leaveHtml(c);
    if (!p) { w.innerHTML = '<div class="fw-title">Ture libere</div><p class="fw-empty">Nu rezultă ore în plus în luna asta. Dacă adaugi ture sau scrii „ore din luna anterioară”, vezi aici ce variante de ture libere ies.</p>' + leave; return; }
    var recMarked = countMarked(c, function (t) { return String(t.code).toUpperCase() === 'R' || t.cls === 'rec'; });
    var recLeft = Math.max(0, p.recCount - recMarked), over = Math.max(0, recMarked - p.recCount);
    var fz = p.freeZ, fn = p.freeN;
    for (var i = 0; i < over; i++) { if (fz > 0) fz--; else if (fn > 0) fn--; }
    var free = [sw(fz, 'tură zi', 'ture zi'), sw(fn, 'tură noapte', 'ture noapte')].filter(Boolean).join(' + ') || '0 ture';
    var done = (p.freeCount + p.recCount) > 0 && recLeft === 0 && fz + fn === 0;
    var variants = (ui.lastRows || []).map(function (v, i) {
      var f = [sw(v.s.freeZ, 'zi', 'zi'), sw(v.s.freeN, 'noapte', 'noapte')].filter(Boolean).join(' + ') || '0';
      return '<button type="button" class="fw-var' + (v.selected ? ' on' : '') + '" data-i="' + i + '"><span class="ck">' + (v.selected ? '✓' : '') + '</span><span>' + esc(f) + ' liber · ' + v.s.recCount + ' rec.' + (v.best ? ' ★' : '') + '</span><small>+' + v.s.reportNext + ' h</small></button>';
    }).join('');
    w.innerHTML = '<div class="fw-title">Ture libere (varianta aleasă)</div>' +
      '<div class="fw-line big">' + (done ? '✓ Toate turele libere au fost folosite' : 'Au mai rămas: <b>' + esc(free) + '</b> libere' + (recLeft ? ' + <b>' + recLeft + (recLeft === 1 ? ' recuperare' : ' recuperări') + '</b>' : '')) + '</div>' +
      '<div class="fw-line sub">Recuperări marcate în calendar: ' + recMarked + ' din ' + p.recCount + ' · ' + (p.reportNext >= 0 ? '+' : '') + fmtHours(p.reportNext) + ' h merg în luna viitoare</div>' +
      '<div class="fw-vars" role="listbox" aria-label="Variante de ture libere">' + variants + '</div>' + leave;
    w.querySelectorAll('.fw-var').forEach(function (b) { b.onclick = function () { if (ui.pickVariant) ui.pickVariant(Number(b.dataset.i)); }; });
  }
  window.renderFreeWidget = renderFreeWidget;
  // Linkul „Setări → Calcul” din ghidul de concedii (delegare: merge și când nu există variante de ture libere)
  var fwEl = $('free-widget');
  if (fwEl) fwEl.addEventListener('click', function (e) {
    if (!e.target.closest('[data-act="set-calc"]')) return;
    openSettings();
    setTimeout(function () { var t = document.querySelector('.set-tab[data-tab="calcul"]'); if (t) t.click(); }, 60);
    setTimeout(function () { var d = $('set-domain'); if (d) { d.scrollIntoView({ block: 'center', behavior: 'smooth' }); d.focus({ preventScroll: true }); d.classList.add('flash'); setTimeout(function () { d.classList.remove('flash'); }, 1800); } }, 260);
  });
  // setări concedii
  (function bindLeave() {
    var dom = $('set-domain');
    if (dom) dom.onchange = function () {
      var c = cal(), d = dom.value; c.domain = d;
      if (DEFAULTS[d]) { c.coDays = DEFAULTS[d][0]; c.cosDays = DEFAULTS[d][1]; }
      if (window.SectorInfo && d) SectorInfo.setDomain(d);
      saveState(); renderFreeWidget(); uiToast('Normele de concediu au fost completate pentru domeniul ales. Le poți ajusta.', 'ok');
    };
    [['set-co-days', 'coDays', 21], ['set-cos-days', 'cosDays', 0], ['set-cm-days', 'cmDays', 183]].forEach(function (x) {
      var el = $(x[0]); if (el) el.onchange = function () { var v = Number(el.value); cal()[x[1]] = isNaN(v) ? x[2] : v; saveState(); renderFreeWidget(); };
    });
    var ca = $('set-co-all'); if (ca) ca.onchange = function () { cal().coCountAll = ca.checked; saveState(); renderFreeWidget(); };
  })();
  var _rc = window.renderCalc;
  window.renderCalc = function () { _rc.apply(this, arguments); renderFreeWidget(); paintPins(); };

  /* ---------- Lista de sărbători din luna afișată (lizibilă, cu categoria clară) ---------- */
  var CATLBL = { legal: ['Zi liberă legală', 'nelucrătoare'], religios: ['Sărbătoare religioasă', 'se lucrează normal'], vacanta: ['Vacanță școlară', ''], punte: ['Punte / concediu sugerat', ''] };
  function renderHolList() {
    var box = $('hol-list'); if (!box) return;
    var c = cal(); if (c.view === 'year') { box.innerHTML = ''; return; }
    var rows = [], dim = daysInMonth(c.year, c.month);
    for (var d = 1; d <= dim; d++) holidaysFor(c.year, c.month, d).forEach(function (h) { if (c.filters[h.cat] !== false) rows.push({ d: d, h: h }); });
    var dn = ['Du', 'Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ'];
    box.innerHTML = rows.length ? rows.map(function (r) {
      var l = CATLBL[r.h.cat] || [r.h.cat, '']; var dow = dn[new Date(c.year, c.month, r.d).getDay()];
      return '<div class="hl-row"><span class="hl-day">' + r.d + '<small>' + dow + '</small></span><span class="hl-name">' + esc(r.h.name) + '</span><span class="hl-cat ' + r.h.cat + '">' + l[0] + (l[1] ? ' · ' + l[1] : '') + '</span></div>';
    }).join('') : '';
  }
  var MONTH_NAMES = {};
  var _rcal = window.renderCalendar;
  window.renderCalendar = function () {
    _rcal.apply(this, arguments);
    var c = cal(), t = $('cal-title') || document.querySelector('.cal-header span');
    if (t && c.view !== 'year' && c.language && c.language !== 'ro') {
      try { var s = new Date(c.year, c.month, 1).toLocaleDateString(c.language === 'es' ? 'es-ES' : 'en-GB', { month: 'long', year: 'numeric' }); t.textContent = s.charAt(0).toUpperCase() + s.slice(1); } catch (e) {}
    }
    renderHolList(); renderFreeWidget();
  };
  var _rfb = window.renderFilterButtons;
  window.renderFilterButtons = function () { _rfb.apply(this, arguments); renderHolList(); };

  /* ---------- Estimare brut → net în Salariu (aceleași reguli ca în Calculator salariu net) ---------- */
  function nightHoursInMonth(c, y, m) {
    var tot = 0, dim = daysInMonth(y, m);
    function overlap(s, e) { var t = 0; [-1, 0, 1].forEach(function (k) { var a = 22 * 60 + k * 1440, b = 30 * 60 + k * 1440; t += Math.max(0, Math.min(e, b) - Math.max(s, a)); }); return t; }
    for (var d = 1; d <= dim; d++) {
      var info = effectiveDayInfo(c, y, m, d); if (!info || !(info.hours > 0)) continue;
      var t = info.source && info.source.kind === 'shift' ? typeById(c, info.source.id) : null;
      if (!t) { var ids = info.ids || []; for (var i = ids.length - 1; i >= 0; i--) { var x = typeById(c, ids[i]); if (x && x.group !== 'leave') { t = x; break; } } }
      if (!t || t.group === 'leave') continue;
      var segs = [], nm = 0, raw = 0;
      if (t.clock && t.clock.start && t.clock.end) { segs.push([t.clock.start, t.clock.end]); if (t.clock.split && t.clock.start2 && t.clock.end2) segs.push([t.clock.start2, t.clock.end2]); }
      segs.forEach(function (sg) { var s = timeToMinutes(sg[0]), e = timeToMinutes(sg[1]); if (e <= s) e += 1440; raw += e - s; nm += overlap(s, e); });
      if (!segs.length) { if (t.cls === 'noapte' || /noapte/i.test(t.name)) { nm = Math.min(info.hours * 60, 480); raw = info.hours * 60; } else continue; }
      tot += nm * (raw > 0 ? Math.min(1, info.hours * 60 / raw) : 1) / 60;
    }
    return Math.round(tot * 100) / 100;
  }
  window.nightHoursInMonth = nightHoursInMonth;
  function estInputs() {
    var g = function (id) { var e = $(id); return e ? e.value : ''; };
    return { brut: g('est-brut'), dep: g('est-dep'), pn: g('est-pn'), pe: g('est-pe'), pw: g('est-pw'), pl: g('est-pl'), paid: ($('est-paid') || {}).checked, u26: ($('est-u26') || {}).checked };
  }
  function renderEstimate() {
    var out = $('est-out'); if (!out) return;
    var c = cal(), s = c.salary || (c.salary = {});
    var set = function (id, v) { var e = $(id); if (e && document.activeElement !== e) e.value = v; };
    set('est-brut', s.brut == null ? '' : s.brut); set('est-dep', s.dep || 0); set('est-pn', s.pNoapte != null ? s.pNoapte : 25); set('est-pe', s.pExtra != null ? s.pExtra : 75);
    set('est-pw', s.pWeekend != null ? s.pWeekend : 50); set('est-pl', s.pLegal != null ? s.pLegal : 100);
    if ($('est-paid')) $('est-paid').checked = !!s.platite; if ($('est-u26')) $('est-u26').checked = !!s.sub26;
    var brut = Number(s.brut) || 0;
    if (!brut) { out.innerHTML = '<p class="hint">Scrie salariul brut de bază ca să vezi estimarea netului pentru ' + MONTHS_RO[c.month] + ' ' + c.year + '.</p>'; return; }
    var m = computeMonth(), norma = getNorma(c.year, c.month), det = computeSDSLDetails(c, c.year, c.month);
    var oreNoapte = nightHoursInMonth(c, c.year, c.month);
    var oreExtra = s.platite ? Math.max(0, Math.round((m.total + m.dayExtra - norma) * 100) / 100) : 0;
    var tarif = brut / norma, custom = 0;
    try { custom = SalaryCalc.customSporuri(JSON.parse(localStorage.getItem('salariu-net-sporuri-v1') || '[]'), brut, tarif); } catch (e) {}
    var r = SalaryCalc.compute({ y: c.year, m: c.month, brut: brut, norma: norma, oreNoapte: oreNoapte, oreExtra: oreExtra, oreWeekend: det.weekend, oreLegale: det.legal,
      pNoapte: s.pNoapte, pExtra: s.pExtra, pWeekend: s.pWeekend, pLegal: s.pLegal, dep: s.dep, sub26: s.sub26, altele: custom });
    var f = function (n) { return Number(n).toLocaleString('ro-RO', { minimumFractionDigits: 0, maximumFractionDigits: 2 }); };
    out.innerHTML = '<div class="est-net"><span>Net estimat</span><b>' + f(r.net) + ' lei</b></div>' +
      '<div class="est-rows">' +
      '<div><span>Brut de bază</span><b>' + f(brut) + '</b></div>' +
      (r.sporNoapte ? '<div><span>Spor noapte (' + fmtHours(oreNoapte) + ' h)</span><b>+' + f(r.sporNoapte) + '</b></div>' : '') +
      (r.extraOre + r.sporExtra ? '<div><span>Ore suplimentare plătite (' + fmtHours(oreExtra) + ' h)</span><b>+' + f(r.extraOre + r.sporExtra) + '</b></div>' : '') +
      (r.sporWeekend ? '<div><span>Spor weekend (' + fmtHours(det.weekend) + ' h)</span><b>+' + f(r.sporWeekend) + '</b></div>' : '') +
      (r.sporLegal ? '<div><span>Spor zile libere legale (' + fmtHours(det.legal) + ' h)</span><b>+' + f(r.sporLegal) + '</b></div>' : '') +
      (r.custom ? '<div><span>Alte sporuri</span><b>+' + f(r.custom) + '</b></div>' : '') +
      '<div class="tot"><span>Brut total</span><b>' + f(r.brutTotal) + '</b></div>' +
      '<div><span>CAS 25%</span><b>−' + f(r.cas) + '</b></div><div><span>CASS 10%</span><b>−' + f(r.cass) + '</b></div>' +
      '<div><span>Impozit 10% (după deducere ' + f(r.deducere) + ')</span><b>−' + f(r.impozit) + '</b></div>' +
      (r.scutit ? '<div><span>Sumă netaxabilă (salariu minim)</span><b>' + f(r.scutit) + '</b></div>' : '') + '</div>' +
      '<p class="hint">Ore luate din calendar pentru ' + MONTHS_RO[c.month] + ': norma ' + fmtHours(norma) + ' h, pontate ' + fmtHours(m.total) + ' h. Orele suplimentare compensate cu timp liber nu intră în bani (bifa de mai sus).</p>';
  }
  function bindEst() {
    var map = { 'est-brut': ['brut', 'n'], 'est-dep': ['dep', 'i'], 'est-pn': ['pNoapte', 'n'], 'est-pe': ['pExtra', 'n'], 'est-pw': ['pWeekend', 'n'], 'est-pl': ['pLegal', 'n'], 'est-paid': ['platite', 'b'], 'est-u26': ['sub26', 'b'] };
    Object.keys(map).forEach(function (id) {
      var el = $(id); if (!el) return;
      el.addEventListener(el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'input', function () {
        var c = cal(); c.salary = c.salary || {}; var k = map[id];
        c.salary[k[0]] = k[1] === 'b' ? el.checked : (k[1] === 'i' ? parseInt(el.value, 10) || 0 : (el.value === '' ? '' : Number(el.value)));
        saveState(); renderEstimate();
      });
    });
  }
  bindEst();
  var _rs = window.renderSalary;
  window.renderSalary = function () { _rs.apply(this, arguments); renderEstimate(); };

  /* ---------- Anulează ultima aplicare de ture ---------- */
  var undoStack = [], ub = $('btn-undo');
  function snap() { var c = cal(); return { id: c.id, a: JSON.stringify(c.assignments || {}), b: JSON.stringify(c.blankDays || {}), d: JSON.stringify(c.dayDetails || {}) }; }
  function push() { undoStack.push(snap()); if (undoStack.length > 25) undoStack.shift(); if (ub) ub.disabled = false; }
  var _odc = window.onDayClick;
  window.onDayClick = function () { if (ui.paint) push(); return _odc.apply(this, arguments); };
  if (typeof window.generatePattern === 'function') { var _gp = window.generatePattern; window.generatePattern = function () { push(); return _gp.apply(this, arguments); }; }
  if (ub) ub.onclick = function () {
    var s = undoStack.pop(); if (!s) return; var c = cal();
    if (c.id !== s.id) { undoStack = []; ub.disabled = true; return; }
    c.assignments = JSON.parse(s.a); c.blankDays = JSON.parse(s.b); c.dayDetails = JSON.parse(s.d);
    saveState(); renderAll(); ub.disabled = undoStack.length === 0; uiToast('Ultima modificare a fost anulată.', 'ok');
  };

  /* ---------- Scurtătură de instalare (.html) ---------- */
  var dl = $('dl-shortcut');
  if (dl) dl.onclick = function () {
    var base = location.href.split('#')[0].split('?')[0].replace(/[^/]*$/, '') + 'index.html';
    function build(icon) {
      var html = '<!DOCTYPE html><html lang="ro"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pontaj Ture</title>' +
        (icon ? '<link rel="icon" href="' + icon + '">' : '') + '<meta http-equiv="refresh" content="0;url=' + base + '">' +
        '<style>body{font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;background:#eef3f0;color:#10241c;text-align:center}a{color:#1D9E75;font-weight:700}img{width:84px;border-radius:20px}</style></head><body><div>' +
        (icon ? '<img src="' + icon + '" alt="">' : '') + '<h1>Pontaj Ture</h1><p>Se deschide aplicația… Dacă nu se deschide, <a href="' + base + '">apasă aici</a>.</p></div></body></html>';
      var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([html], { type: 'text/html' })); a.download = 'Pontaj Ture.html';
      document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
      uiToast('Scurtătura „Pontaj Ture.html” a fost descărcată. Pune-o pe desktop sau în favorite.', 'ok');
    }
    fetch('icon.svg').then(function (r) { return r.text(); }).then(function (t) { build('data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(t)))); }).catch(function () { build(''); });
  };
  var pd = $('pwa-detected');
  if (pd) { var ua = navigator.userAgent || ''; pd.innerHTML = '<p class="hint">' + (/iPad|iPhone|iPod/.test(ua) ? 'Pe iPhone/iPad: Safari → butonul Partajează → „Adaugă pe ecranul de start”.' : /Android/.test(ua) ? 'Pe Android: meniul browserului ⋮ → „Instalează aplicația” sau „Adaugă la ecranul de start”.' : 'Pe computer: în Chrome/Edge apasă iconița de instalare din bara de adrese sau meniul ⋮ → „Instalează Pontaj Ture”.') + '</p>'; }

  /* ---------- Săgeți mari transparente peste caseta cu ture (apar la hover, pe PC) ---------- */
  (function paletteArrows() {
    var pal = $('shift-palette'); if (!pal || pal.parentNode.classList.contains('pal-wrap')) return;
    var wrap = document.createElement('div'); wrap.className = 'pal-wrap'; pal.parentNode.insertBefore(wrap, pal); wrap.appendChild(pal);
    var L = document.createElement('button'), R = document.createElement('button');
    L.type = R.type = 'button'; L.className = 'pal-arrow left'; R.className = 'pal-arrow right'; L.setAttribute('aria-label', 'Ture anterioare'); R.setAttribute('aria-label', 'Ture următoare');
    L.innerHTML = '<svg viewBox="0 0 24 24" width="44" height="44"><path d="M15 4 7 12l8 8" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    R.innerHTML = '<svg viewBox="0 0 24 24" width="44" height="44"><path d="m9 4 8 8-8 8" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    wrap.appendChild(L); wrap.appendChild(R);
    function upd() { var over = pal.scrollWidth > pal.clientWidth + 4; L.hidden = !over || pal.scrollLeft < 6; R.hidden = !over || pal.scrollLeft + pal.clientWidth > pal.scrollWidth - 6; }
    function go(dir) { pal.scrollBy({ left: dir * Math.max(160, pal.clientWidth * 0.75), behavior: 'smooth' }); }
    L.onclick = function () { go(-1); }; R.onclick = function () { go(1); };
    pal.addEventListener('scroll', upd, { passive: true }); window.addEventListener('resize', upd);
    new MutationObserver(function () { setTimeout(upd, 30); }).observe(pal, { childList: true });
    pal.addEventListener('wheel', function (e) { if (pal.scrollWidth > pal.clientWidth + 4 && Math.abs(e.deltaY) > Math.abs(e.deltaX)) { pal.scrollLeft += e.deltaY; e.preventDefault(); } }, { passive: false });
    setTimeout(upd, 120);
  })();

  renderAll();
})();
