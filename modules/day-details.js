/* ===== Module „Detalii complete pe zi” — apasă o zi din calendar =====
   Modularizat în modules/day-details.js: onDayClick() din app.js îi delegă aici.
   La apăsarea unei zile, fară mod aplicare activ: afișează denumiri complete
   ale sărbătorilor/vacanțelor, orele pontate, turele și notițele, cu opțiuni
   de editare (Editează ziua / Editează tura). Regimul „până la 23:59 e o zi,
   de la 00:00 e alta” (orele din tura de noapte a zilei precedente) aparții
   complet vizibil la click. */
(function () {
  'use strict';

  // Denumiri complete (în data-baza de sărbătorii sunt formele scurte „Sf. Andrei” etc.)
  const HOL_FULL = {
    'Sf. Andrei': 'Sfântul Apostol Andrei',
    'Sf. Maria': 'Sfânta Maria'
  };
  const CAT_FULL = {
    legal: 'Sărbătoare legale',
    religios: 'Sărbători religioase',
    vacanta: 'Vacanțe școlare',
    punte: 'Punți / concediu sugerat'
  };

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function fullHolName(n) { return HOL_FULL[n] || n; }
  function fullHolCat(c) { return CAT_FULL[c] || c || ''; }

  function openDayDetails(d) {
    const c = cal(), k = key(c.year, c.month, d);
    const ids = c.assignments[k] || [];
    const det = c.dayDetails[k] || {};
    const hols = visibleHolidays(c, c.year, c.month, d);
    const dayH = effectiveDayHours(c, c.year, c.month, d);
    const types = ids.map(id => typeById(c, id)).filter(Boolean);
    const lastT = types.length ? types[types.length - 1] : null;
    let ownH = 0, spillH = 0;
    if (lastT) {
      ownH = round2((shiftMinutesByDate(lastT, c.year, c.month, d)[k] || 0) / 60);
      spillH = round2(dayH - ownH);
    }
    const monthLabel = new Date(c.year, c.month, d).toLocaleDateString('ro-RO', { day:'numeric', month:'long', year:'numeric' });
    const manual = det.hoursOverride != null && det.hoursOverride !== '';

    // --- Orele pontate în ziua calendaristică
    let html = '<div class="dd-section"><span class="dd-title">Ore pontate în ziua calendaristică</span><div class="dd-line">' +
      (dayH > 0 ? fmtHours(dayH) + ' h' : '0 h (nelucrătoare)') +
      (manual ? ' — ore stabilite manual în această zi' : '') +
      (spillH > 0 ? ' (' + fmtHours(spillH) + ' h după miezul nopții, din ziua precedentă)' : '') + '</div>';
    if (lastT) {
      html += '<div class="dd-line dd-small">Tura: ' + esc(lastT.name) + ' (' + MECHANICS.shiftHours(lastT) + ' h' +
        (lastT.code ? ', cod ' + esc(lastT.code) : '') +
        (lastT.breakMin ? ', pauză ' + lastT.breakMin + ' min' : '') +
        (spillH > 0 ? ', ' + fmtHours(spillH) + ' h peste 00:00' : '') + ')</div>';
    }
    html += '</div>';

    // --- Turele din ziua aceasta
    if (types.length) {
      const chips = types.map(t =>
        '<span class="dd-chip ' + esc(t.cls || 'rec') + '">' + esc(t.name) +
        (t.code ? ' (' + esc(t.code) + ')' : '') + ' — ' + MECHANICS.shiftHours(t) + ' h</span>').join('');
      html += '<div class="dd-section"><span class="dd-title">Turele din ziua ' + d + ' ' + monthLabel + '</span><div class="dd-chips">' + chips + '</div></div>';
    }

    // --- Sărbătorile și vacanțele din ziua aceasta (denumiri complete)
    if (hols.length) {
      const chips = hols.map(h =>
        '<span class="dd-chip hol">' + esc(fullHolName(h.name)) + ' — ' + esc(fullHolCat(h.cat)) + '</span>').join('');
      html += '<div class="dd-section"><span class="dd-title">Sărbătorile și vacanțele din ziua ' + d + '</span><div class="dd-chips">' + chips + '</div></div>';
    }

    // --- Notițele
    html += '<div class="dd-section"><span class="dd-title">Notițele din ziua ' + d + '</span><div class="dd-note">' +
      (det.note ? esc(det.note).replace(/\n/g, '<br/>') : '<span class="dd-muted">—</span>') + '</div></div>';

    // --- Opțiuni de editare
    const btns = ['<button class="mini-btn" id="dd-edit-day" title="Editează ziua ' + d + '">✎ Editează ziua ' + d + '</button>'];
    types.forEach(t => {
      btns.push('<button class="mini-btn ghost" id="dd-edit-' + esc(t.id) + '" title="Editează tură ' + esc(t.name) + '">Editează ' + esc(t.name) + '</button>');
    });
    btns.push('<button class="mini-btn ghost" id="dd-close">Închide</button>');
    html += '<div class="dd-edit-row">' + btns.join('') + '</div>';

    const box = document.getElementById('day-details-modal');
    document.getElementById('day-details-title').textContent = 'Detalii ziua ' + d + ' · ' + monthLabel;
    document.getElementById('day-details-body').innerHTML = html;
    box.style.display = 'flex';

    document.getElementById('dd-edit-day').onclick = () => { closeDayDetails(); openDayEditor(d); };
    types.forEach(t => {
      const b = document.getElementById('dd-edit-' + esc(t.id));
      if (b) b.onclick = () => { closeDayDetails(); openEditor(t.id); };
    });
    document.getElementById('dd-close').onclick = closeDayDetails;
    document.addEventListener('keydown', onDayDetailsEscape, true);
  }
  function onDayDetailsEscape(e) { if (e.key === 'Escape') closeDayDetails(); }
  function closeDayDetails() {
    document.removeEventListener('keydown', onDayDetailsEscape, true);
    const box = document.getElementById('day-details-modal');
    if (box) box.style.display = 'none';
  }

  window.openDayDetails = openDayDetails;
  window.closeDayDetails = closeDayDetails;
})();
