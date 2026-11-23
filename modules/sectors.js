/* Baza de calcul pe domenii: chestionar scurt → norma, sporuri, compensări și legislația relevantă.
   Informativ (actualizat noiembrie 2026). Contractul colectiv, regulamentul intern și ordinele unității pot prevedea mai mult. */
(function () {
  'use strict';
  var KEY = 'pontaj-ture-sector-v1';
  var COMMON_FISCAL = 'Codul fiscal: CAS 25%, CASS 10%, impozit 10% pe baza rămasă după contribuții și deducere personală; HG 146/2026: salariul minim brut 4.325 lei (din 1 iulie 2026; 4.050 lei înainte), din care 200 lei netaxabili iulie–decembrie 2026 (OUG 89/2025).';
  var CM = 'Codul Muncii (Legea 53/2003)';
  var MAI_SUPL = 'Munca suplimentară se dispune în scris de șeful ierarhic, cu plafon anual de 180 de ore (în cazuri deosebite, aprobat, până la 360). Se compensează cu timp liber; ce nu poate fi compensat în 90 de zile se plătește, conform actelor MAI din 2025.';
  var MAI_SARB = 'Munca în zilele libere și în sărbătorile legale se plătește din nou la nivelul din noiembrie 2024 (OUG aprobată în februarie 2025); prioritar se acordă timp liber corespunzător.';
  var DOMAINS = {
    priv: { label: 'Privat (angajat cu contract de muncă)', stat: 'cim', prog: 'p8',
      norma: '8 ore/zi și 40 ore/săptămână (art. 112). La ture, norma lunii = zile lucrătoare × 8 ore, fără sărbătorile legale (aplicația o calculează singură).',
      max: 'Cel mult 48 de ore/săptămână, inclusiv orele suplimentare, ca medie pe perioada de referință (de regulă 4 luni) – art. 114.',
      noapte: 'Muncă de noapte = 22:00–06:00. Spor de cel puțin 25% din salariul de bază pentru orele de noapte sau reducerea programului cu o oră pe zi, dacă nu e prevăzut altfel.',
      supl: 'Compensate cu ore libere plătite în 90 de zile calendaristice (art. 122); dacă nu se poate, spor de cel puțin 75% din salariul de bază (art. 123).',
      sarb: 'Zile libere legale (art. 139): dacă lucrezi, primești timp liber în 30 de zile sau un spor de minimum 100% din salariul de bază.',
      co: 'Minimum 20 de zile lucrătoare pe an (art. 145); sărbătorile legale nu se scad din concediu.',
      legi: [CM + ' – art. 112–114, 120–123, 139, 145', 'Contractul colectiv de muncă / regulamentul intern', COMMON_FISCAL] },
    bug: { label: 'Bugetar – administrație și instituții publice', stat: 'fp', prog: 'p8',
      norma: '8 ore/zi și 40 ore/săptămână (funcționari publici: Codul administrativ; personal contractual: Codul Muncii).',
      max: '48 de ore/săptămână inclusiv orele suplimentare (directiva europeană, preluată în legislația muncii).',
      noapte: 'Spor pentru orele lucrate între 22:00 și 06:00, prevăzut de Legea-cadru 153/2017 (25% din salariul de bază – verifică în fluturaș).',
      supl: 'Se dispun în scris de șeful ierarhic și se compensează cu timp liber în 60 de zile calendaristice; dacă nu e posibil, se plătesc în luna următoare cu sporul din Legea 153/2017 (75%).',
      sarb: 'Munca în zile de repaus și sărbători legale se compensează cu timp liber; dacă nu se poate, se acordă majorarea prevăzută de Legea 153/2017 (100%).',
      co: 'Personal contractual: minimum 20 de zile lucrătoare (Codul Muncii). Funcționari publici: Codul administrativ și ordinele instituției.',
      legi: ['Legea-cadru 153/2017 privind salarizarea personalului plătit din fonduri publice', 'OUG 57/2019 – Codul administrativ', CM, 'Se discută o nouă lege a salarizării – verifică versiunea în vigoare.', COMMON_FISCAL] },
    pol: { label: 'MAI – polițist', stat: 'fpss', prog: 'p12',
      norma: 'Program normal de 8 ore/zi (40/săptămână); în structurile operative ture de 12/24–12/48, 24/48 sau altele stabilite prin ordin (Legea 360/2002 – Statutul polițistului).',
      max: 'Limitele europene (48 h/săptămână, în medie) cu derogările pentru intervenții operative și situații neprevăzute.',
      noapte: 'Spor pentru orele de noapte conform Legii-cadru 153/2017 (22:00–06:00).',
      supl: MAI_SUPL, sarb: MAI_SARB,
      co: 'Concediu de odihnă și zile libere conform Statutului polițistului și ordinelor MAI.',
      legi: ['Legea 360/2002 – Statutul polițistului', 'Legea-cadru 153/2017', 'OUG (feb. 2025) privind plata muncii suplimentare a personalului MAI', 'Ordinele MAI de aplicare și regulamentul structurii'] },
    isu: { label: 'MAI – pompier / ISU', stat: 'mil', prog: 'p24',
      norma: 'Program normal de 8 ore/zi sau ture 24/48 (aprox. 91–93 de ture pe an) ori 12/24–12/48. Fiecare inspectorat stabilește prin ordin cum se ponteză orele din tura de 24 h (în aplicație: Z 14 h, N 13 h – editabile).',
      max: 'Limitele europene (48 h/săptămână, în medie), cu derogările pentru situații de urgență.',
      noapte: 'Spor pentru orele de noapte conform Legii-cadru 153/2017 (22:00–06:00).',
      supl: MAI_SUPL, sarb: MAI_SARB,
      co: 'Concediu de odihnă conform statutului cadrelor militare / Codului Muncii, după statutul tău.',
      legi: ['Legea 80/1995 – Statutul cadrelor militare', 'Legea 307/2006 – apărarea împotriva incendiilor', 'Legea-cadru 153/2017', 'OUG (feb. 2025) privind plata muncii suplimentare a personalului MAI', CM + ' (personal civil)'] },
    jand: { label: 'MAI – jandarm / militar', stat: 'mil', prog: 'p12',
      norma: 'Program normal de 8 ore/zi sau ture de 12/24–12/48 / 24/48, după structură și ordinele unității.',
      max: 'Limitele europene (48 h/săptămână, în medie), cu derogările pentru misiuni.',
      noapte: 'Spor pentru orele de noapte conform Legii-cadru 153/2017 (22:00–06:00).',
      supl: MAI_SUPL, sarb: MAI_SARB,
      co: 'Concediu de odihnă conform statutului cadrelor militare.',
      legi: ['Legea 80/1995 – Statutul cadrelor militare', 'Legea 550/2004 – organizarea Jandarmeriei', 'Legea-cadru 153/2017', 'OUG (feb. 2025) privind plata muncii suplimentare'] },
    anp: { label: 'ANP – polițist de penitenciare / agent', stat: 'fpss', prog: 'p12',
      norma: 'Program normal de 8 ore/zi sau ture de 12/24–12/48 / 24/48 în penitenciare, stabilite prin ordinele administrației penitenciare.',
      max: 'Limitele europene (48 h/săptămână, în medie), cu derogările specifice serviciului.',
      noapte: 'Spor pentru orele de noapte conform Legii-cadru 153/2017 (22:00–06:00).',
      supl: 'Polițiștii de penitenciare sunt incluși în reglementările din 2025 privind plata muncii suplimentare: timp liber compensator cu prioritate, iar ce nu se compensează în termen se plătește.',
      sarb: 'Munca în zilele libere și în sărbători legale: timp liber sau plată, conform actelor din 2025 (nivelul din noiembrie 2024).',
      co: 'Concediu de odihnă conform Legii 293/2004 și ordinelor ANP.',
      legi: ['Legea 293/2004 – Statutul funcționarilor publici cu statut special din ANP', 'Legea-cadru 153/2017', 'OUG (feb. 2025) privind plata muncii suplimentare', 'Ordinele ANP și regulamentul unității'] },
    med: { label: 'Sănătate – medic', stat: 'cim', prog: 'pg',
      norma: 'Normă de 7 ore/zi (35 h/săptămână) în medie; în spitale, activitate curentă de dimineață + gărzi (OMS 870/2004).',
      max: 'Gărzile de 24 h sunt reglementate separat; după gardă urmează 24 de ore de repaus. Spitalele pot organiza gărzi de 12, 18 sau 24 de ore (ordin MS recent).',
      noapte: 'Gărzile se salarizează cu tarif orar; gărzile peste norma obligatorie se fac cu contract cu timp parțial.',
      supl: 'Orice activitate peste programul normal de 7 ore face parte din norma lunară; depășirea este temporară. Gărzile în afara normei se plătesc separat (Legea 153/2017, anexa II).',
      sarb: 'Garda în sărbători legale începe dimineața și durează 24 de ore; plata după anexa II la Legea 153/2017.',
      co: 'Concediu conform Codului Muncii și contractului; norma de gărzi se programează lunar.',
      legi: ['Legea 95/2006 – reforma în domeniul sănătății', 'OMS 870/2004 – timpul de muncă în unitățile sanitare', 'Legea-cadru 153/2017, anexa II (sănătate)', CM] },
    asis: { label: 'Sănătate – asistent medical / personal în ture', stat: 'cim', prog: 'p12',
      norma: 'Ture de 8 ore cu 16 libere sau de 12 ore cu 24 libere (OMS 870/2004, art. 13); norma 7–8 ore/zi după funcție.',
      max: 'Limita europeană de 48 h/săptămână, ca medie pe perioada de referință.',
      noapte: 'Spor de noapte de 25%; anexa II la Legea 153/2017 poate prevedea în regimul 12/24 un spor de 15% în locul celui de noapte – verifică în fluturaș ce se aplică la unitatea ta.',
      supl: 'Compensate cu timp liber în 60 de zile (sectorul public); dacă nu e posibil, plătite cu sporul prevăzut de lege.',
      sarb: 'Timp liber corespunzător sau majorare conform Legii 153/2017.',
      co: 'Concediu conform Codului Muncii și contractului colectiv din sănătate.',
      legi: ['OMS 870/2004', 'Legea-cadru 153/2017, anexa II', CM, 'Contractul colectiv de muncă din unitate'] },
    alt: { label: 'Alt domeniu în ture (transport, port, industrie, retail)', stat: 'cim', prog: 'p3',
      norma: 'Norma legală de 8 ore/zi și 40 ore/săptămână; programul în ture se stabilește prin contract și regulamentul intern.',
      max: 'Maximum 48 de ore/săptămână, ca medie pe perioada de referință (art. 114).',
      noapte: 'Spor de cel puțin 25% pentru orele 22:00–06:00 sau program redus cu o oră – verifică contractul colectiv.',
      supl: 'Ore libere plătite în 90 de zile (art. 122) sau, dacă nu se poate, spor de cel puțin 75% (art. 123).',
      sarb: 'Timp liber în 30 de zile sau spor de minimum 100% pentru munca în sărbătorile legale (art. 139).',
      co: 'Minimum 20 de zile lucrătoare/an (art. 145).',
      legi: [CM, 'Contractul colectiv de muncă aplicabil', COMMON_FISCAL] }
  };
  var STATUT = { cim: 'Contract individual de muncă (Codul Muncii)', fp: 'Funcționar public (Codul administrativ)', fpss: 'Funcționar public cu statut special (polițist, ANP)', mil: 'Cadru militar (Legea 80/1995)' };
  var STAT_NOTE = {
    cim: 'Ai contract individual de muncă: se aplică Codul Muncii, completat de contractul colectiv și regulamentul intern.',
    fp: 'Ca funcționar public se aplică Codul administrativ și Legea 153/2017; Codul Muncii se aplică doar supletiv.',
    fpss: 'Ca funcționar public cu statut special contează statutul propriu (Legea 360/2002 / Legea 293/2004) și Legea 153/2017; Codul Muncii se aplică doar acolo unde statutul trimite la el.',
    mil: 'Ca cadru militar contează Legea 80/1995 și ordinele unității; pentru salarizare se aplică Legea 153/2017.'
  };
  var PROG = {
    p8:  { label: 'Program normal, 8 ore/zi, luni–vineri', pattern: '8/5-birou', note: 'Pontezi 8 ore/zi; norma lunii = zile lucrătoare × 8. În aplicație: tipul „8/5 birou”.' },
    p12: { label: 'Ture de 12 ore (12/24 – 12/48)', pattern: '12/24-12/48', note: 'Cu 12 ore reale folosește „12 h zi + noapte”; dacă unitatea ponteză 14 h (zi) și 13 h (noapte), folosește 12/24–12/48 cu Z/N.' },
    p24: { label: 'Tură de 24 ore (24/48)', pattern: '24/48', note: 'Câte ore se ponteză dintr-o tură de 24 h rezultă din ordinul unității (în aplicație 14 h zi / 13 h noapte, editabile în Setări → Calcul).' },
    p3:  { label: '3 schimburi de 8 ore (dimineață / după-amiază / noapte)', pattern: '8/3-rotativ', note: 'Dimineață 06–14, după-amiază 14–22, noapte 22–06; sporul de noapte se aplică orelor dintre 22:00 și 06:00.' },
    pg:  { label: 'Normă + gărzi medicale', pattern: '24/48', note: 'Garda se marchează cu tura de 24 h (sau Z/N). Garda peste norma legală se plătește separat.' }
  };
  var ORDER = ['priv', 'bug', 'pol', 'isu', 'jand', 'anp', 'med', 'asis', 'alt'];

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var ans = { d: 'priv', s: 'cim', p: 'p8' };
  try { var sv = JSON.parse(localStorage.getItem(KEY) || 'null'); if (sv && DOMAINS[sv.d]) ans = sv; } catch (e) {}
  function save() { try { localStorage.setItem(KEY, JSON.stringify(ans)); } catch (e) {} }

  function radios(name, items, cur) {
    return items.map(function (it) {
      return '<label class="poll-opt"><input type="radio" name="' + name + '" value="' + it[0] + '"' + (cur === it[0] ? ' checked' : '') + ' /><span class="dot"></span><span>' + esc(it[1]) + '</span></label>';
    }).join('');
  }
  function row(title, text) { return text ? '<div class="sec-row"><b>' + title + '</b><p>' + esc(text) + '</p></div>' : ''; }

  function render() {
    var root = document.getElementById('sector-poll'); if (!root) return;
    root.innerHTML =
      '<p class="hint">Răspunde la 3 întrebări și vezi baza de calcul pentru munca ta: norma, sporurile, compensările și legislația. Informațiile sunt orientative; contractul colectiv și ordinele unității au prioritate.</p>' +
      '<div class="poll"><div class="poll-scroll" id="poll-scroll">' +
        '<div class="poll-q"><h4>1. În ce domeniu lucrezi?</h4>' + radios('q-d', ORDER.map(function (k) { return [k, DOMAINS[k].label]; }), ans.d) + '</div>' +
        '<div class="poll-q"><h4>2. Ce statut ai?</h4>' + radios('q-s', Object.keys(STATUT).map(function (k) { return [k, STATUT[k]]; }), ans.s) + '</div>' +
        '<div class="poll-q"><h4>3. Cum e organizat programul tău?</h4>' + radios('q-p', Object.keys(PROG).map(function (k) { return [k, PROG[k].label]; }), ans.p) + '</div>' +
      '</div><button type="button" class="poll-down" id="poll-down" aria-label="Derulează în jos">↓</button></div>' +
      '<button type="button" class="poll-submit" id="poll-submit">Arată baza de calcul</button>' +
      '<div id="sector-result"></div>';
    root.querySelectorAll('input[type=radio]').forEach(function (r) {
      r.onchange = function () {
        if (r.name === 'q-d') { ans.d = r.value; ans.s = DOMAINS[r.value].stat; ans.p = DOMAINS[r.value].prog; save(); render(); showResult(false); return; }
        if (r.name === 'q-s') ans.s = r.value; if (r.name === 'q-p') ans.p = r.value;
        save(); showResult(false);
      };
    });
    var sc = $('poll-scroll'), dn = $('poll-down');
    function arrow() { dn.style.opacity = (sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 6) ? '0' : '1'; }
    sc.addEventListener('scroll', arrow); setTimeout(arrow, 50);
    dn.onclick = function () { sc.scrollBy({ top: 220, behavior: 'smooth' }); };
    $('poll-submit').onclick = function () { showResult(true); };
    showResult(false);
  }
  function $(id) { return document.getElementById(id); }
  function showResult(scroll) {
    var d = DOMAINS[ans.d], p = PROG[ans.p], out = $('sector-result'); if (!out) return;
    out.innerHTML = '<div class="sec-result"><h3>Baza de calcul: ' + esc(d.label) + '</h3>' +
      '<p class="sec-stat">' + esc(STAT_NOTE[ans.s]) + '</p>' +
      row('Norma de lucru', d.norma) + row('Durata maximă', d.max) + row('Programul tău', p.note) +
      row('Muncă de noapte', d.noapte) + row('Ore suplimentare', d.supl) + row('Zile libere legale lucrate', d.sarb) + row('Concediu de odihnă', d.co) +
      '<div class="sec-row"><b>Legislație relevantă</b><ul>' + d.legi.map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('') + '</ul></div>' +
      '<div class="sec-actions"><button class="mini-btn primary" id="sec-apply">Folosește programul în Generator</button><button class="mini-btn" id="sec-salary">Deschide Salariul</button></div>' +
      '<p class="hint">Informativ, actualizat noiembrie 2026; nu înlocuiește consultanța juridică. Verifică mereu contractul colectiv, regulamentul intern și ordinele unității.</p></div>';
    $('sec-apply').onclick = function () {
      var sel = $('tura-type');
      if (sel) { sel.value = p.pattern; sel.dispatchEvent(new Event('change')); }
      if (window.goToSection) window.goToSection('sec-generator'); 
      ['gen', 'tip'].forEach(function (m) { if (typeof menuOpen === 'function' && menuOpen(m) === false) applyMenuOpen(m, true); });
      if (window.uiToast) uiToast('Tipul „' + p.label + '” a fost ales în Generator.', 'ok');
    };
    $('sec-salary').onclick = function () { if (typeof applyMenuOpen === 'function') applyMenuOpen('salariu', true); if (window.goToSection) window.goToSection('sec-salariu'); };
    if (scroll) out.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function setDomain(d) { if (!DOMAINS[d]) return; ans.d = d; ans.s = DOMAINS[d].stat; ans.p = DOMAINS[d].prog; save(); render(); }
  window.SectorInfo = { render: render, domains: DOMAINS, setDomain: setDomain, get: function () { return ans.d; } };
  if (document.readyState !== 'loading') render(); else document.addEventListener('DOMContentLoaded', render);
})();
