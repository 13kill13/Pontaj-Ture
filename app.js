/* =========================================================
   Pontaj Ture — Calculator de ore de lucru și tare
   Static app — no dependencies, everything saved in localStorage
   ========================================================= */

// ---------- Real numbers (from the reference site) ----------
const NORMA = {
  2025: [168, 160, 168, 168, 160, 168, 184, 168, 176, 184, 160, 160],
  2026: [144, 160, 176, 160, 160, 168, 184, 168, 176, 176, 160, 168],
};

// ---------- Zile libere (sursă publică: zilelibere.com + Codul Muncii) ----------
// holidays-data.js (generat la build din holidays-data.json) pune datele pe window.
const HOLIDAYS_DATA = (typeof window !== 'undefined' && window.HOLIDAYS_DATA) || {
  source:'zilelibere.com + Codul Muncii', updated:'', categories:[], days:{}, ranges:[]
};
const HOLIDAY_CATEGORIES = (HOLIDAYS_DATA.categories && HOLIDAYS_DATA.categories.length) ? HOLIDAYS_DATA.categories : [
  { id:'legal', name:'Sărbători legale', cls:'legal' },
  { id:'religios', name:'Sărbători religioase', cls:'religios' },
  { id:'vacanta', name:'Vacanțe școlare', cls:'vacanta' },
  { id:'punte', name:'Punți / concediu sugerat', cls:'punte' },
];
// Zilele libere trăiesc și în state.holidaysData, ca să poată fi trimise în cloud
// împreună cu celelalte setări. Datele înglobate sunt punctul de pornire când
// rețeaua nu e disponibilă (cache-ul local nu generează niciodată erori).
function defaultHolidayState() {
  return {
    source: HOLIDAYS_DATA.source || 'zilelibere.com + Codul Muncii',
    updated: HOLIDAYS_DATA.updated || '',
    days: HOLIDAYS_DATA.days || {},
    ranges: HOLIDAYS_DATA.ranges || [],
    lastHybridSync: ''
  };
}

// ---------- Doar zilele libere legale primesc eticheta ZL ----------
// Sursa autoritară e Codul Muncii (Legea 53/2003, art. 139), NU culoarea celulei
// dintr-un tabel de pe internet. O zi de vacanță școlară (5/12/19/20 iunie 2026,
// 23 decembrie 2026), o punte sau o sărbătoare religioasă rămâne în categoria ei
// și nu devine ZL, nici după o sincronizare live cu date colorate greșit.
const LEGAL_RULES = HOLIDAYS_DATA.legalRules || { fixed:{}, movable:{} };
const LEGAL_NOT_RE = /vacan|ultima zi|prima zi|curs|școal|scoal|punte|concediu|minivacan|revelion|ajunul/i;
const LEGAL_NAME_RE = /anul nou|boboteaza|botezul domnului|sf\.?\s*(ioan|ion|andrei)|unirea principatelor|vinerea mare|pa[șs]te|ziua muncii|ziua copilului|ziua na[țt]ional|rusalii|adormirea|sf\.?\s*maria|cr[ăa]ciun/i;
function legalExpectation(y, m, d) {
  const mov = (LEGAL_RULES.movable || {})[y] || {};
  return (LEGAL_RULES.fixed || {})[`${m + 1}-${d}`] || mov[`${y}-${m + 1}-${d}`] || null;
}
function classifyHoliday(y, m, d, name, cat) {
  const n = String(name || '').trim();
  const expected = legalExpectation(y, m, d);
  const legalName = !LEGAL_NOT_RE.test(n) && LEGAL_NAME_RE.test(n);
  if ((cat === 'legal' && (legalName || (!n && expected))) || (cat !== 'legal' && expected && legalName)) {
    return { name: expected || n, cat:'legal' };
  }
  let demoted = 'religios';
  if (/vacan|ultima zi|prima zi|curs|școal|scoal/i.test(n)) demoted = 'vacanta';
  else if (/punte|concediu|minivacan/i.test(n)) demoted = 'punte';
  return { name: n, cat: demoted };
}
function normalizeHoliday(key, entry) {
  const p = String(key).split('-').map(Number);
  // Sursa publică (Nager.Date) vine deja clasificată: tipul "Public" e zi liberă
  // legală indiferent cum e scris numele, deci nu o retrogradăm după regex-ul de nume.
  if (entry && entry.trusted && (entry.cat === 'legal' || entry.cat === 'religios')) {
    return { name: entry.name, cat: entry.cat };
  }
  return classifyHoliday(p[0], p[1] - 1, p[2], entry.name, entry.cat);
}

// O zi poate purta MAI MULTE sărbători/vacanțe. De exemplu 25 decembrie e în același
// timp sărbătoare legală (SDSL) și în vacanța de iarnă. Le păstrăm pe toate, ca să se
// poată suprapune peste zilele SDSL și peste ture, nu una în locul celeilalte.

// ---------- Zile libere legale calculate (Codul Muncii art. 139 + Paștele ortodox) ----------
// Funcționează pentru ORICE an, offline, ca să nu rămână niciodată un an gol (ex. 2027).
// Datele din Nager.Date / setul înglobat au prioritate: se adaugă doar zilele care lipsesc.
function orthodoxEaster(y) {
  const a = y % 4, b = y % 7, c = y % 19, d = (19 * c + 15) % 30, e = (2 * a + 4 * b - d + 34) % 7;
  const month = Math.floor((d + e + 114) / 31), day = ((d + e + 114) % 31) + 1;
  const dt = new Date(y, month - 1, day + 13);   // iulian → gregorian (1900–2099)
  return dt;
}
function computedLegalDays(y) {
  const out = {};
  const put = (dt, name) => { out[`${dt.getFullYear()}-${dt.getMonth() + 1}-${dt.getDate()}`] = name; };
  const fx = (mo, d, name) => put(new Date(y, mo - 1, d), name);
  fx(1,1,'Anul Nou'); fx(1,2,'Anul Nou'); fx(1,6,'Boboteaza'); fx(1,7,'Sf. Ioan');
  fx(1,24,'Unirea Principatelor'); fx(5,1,'Ziua Muncii'); fx(6,1,'Ziua Copilului');
  fx(8,15,'Adormirea Maicii Domnului'); fx(11,30,'Sf. Andrei'); fx(12,1,'Ziua Națională');
  fx(12,25,'Crăciun'); fx(12,26,'Crăciun');
  const e = orthodoxEaster(y), off = n => new Date(e.getFullYear(), e.getMonth(), e.getDate() + n);
  put(off(-2), 'Vinerea Mare'); put(off(0), 'Paște'); put(off(1), 'Paște (a doua zi)');
  put(off(49), 'Rusalii'); put(off(50), 'Rusalii (a doua zi)');
  return out;
}
function gregorianEaster(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(y, month - 1, day);
}
// Sărbători religioase din România (NU sunt zile libere legale — se lucrează normal, dacă nu e prevăzut altfel).
function computedReligiousDays(y) {
  const out = {};
  const put = (dt, name) => { out[`${dt.getFullYear()}-${dt.getMonth() + 1}-${dt.getDate()}`] = name; };
  const fx = (mo, d, name) => put(new Date(y, mo - 1, d), name);
  fx(1,30,'Sf. Trei Ierarhi'); fx(2,2,'Întâmpinarea Domnului'); fx(3,25,'Buna Vestire'); fx(4,23,'Sf. Gheorghe');
  fx(5,21,'Sf. Constantin și Elena'); fx(6,24,'Nașterea Sf. Ioan Botezătorul'); fx(6,29,'Sf. Petru și Pavel');
  fx(7,20,'Sf. Ilie'); fx(8,6,'Schimbarea la Față'); fx(9,8,'Nașterea Maicii Domnului'); fx(9,14,'Înălțarea Sfintei Cruci');
  fx(10,14,'Sf. Cuv. Parascheva'); fx(10,26,'Sf. Dimitrie'); fx(11,8,'Soborul Sf. Mihail și Gavriil');
  fx(11,21,'Intrarea Maicii Domnului în Biserică'); fx(12,6,'Sf. Nicolae'); fx(12,20,'Ignatul'); fx(12,27,'Sf. Ștefan');
  const e = orthodoxEaster(y), off = n => new Date(e.getFullYear(), e.getMonth(), e.getDate() + n);
  put(off(-7), 'Duminica Floriilor'); put(off(-3), 'Joia Mare'); put(off(-1), 'Sâmbăta Mare');
  put(off(39), 'Înălțarea Domnului (Ziua Eroilor)');
  const ge = gregorianEaster(y);
  if (ge.getTime() !== e.getTime()) put(ge, 'Paștele catolic / greco-catolic');
  return out;
}
function addComputedLegal(map) {
  const now = new Date().getFullYear();
  for (let y = now - 2; y <= now + 5; y++) {
    const days = computedLegalDays(y);
    Object.keys(days).forEach(k => {
      const arr = map[k] || (map[k] = []);
      if (!arr.some(x => x.cat === 'legal')) arr.push({ name: days[k], cat: 'legal' });
    });
    const rel = computedReligiousDays(y);
    Object.keys(rel).forEach(k => {
      const arr = map[k] || (map[k] = []);
      if (!arr.some(x => x.cat === 'legal' || x.cat === 'religios')) arr.push({ name: rel[k], cat: 'religios' });
    });
  }
}

const HOLIDAYS = (function () {
  const map = {};
  const push = (k, entry) => {
    if (!entry || !entry.name) return;
    const arr = map[k] || (map[k] = []);
    if (!arr.some(x => x.name === entry.name && x.cat === entry.cat)) arr.push(entry);
  };
  Object.keys(HOLIDAYS_DATA.days || {}).forEach(k => {
    const v = HOLIDAYS_DATA.days[k];
    (Array.isArray(v) ? v : [v]).forEach(entry => push(k, normalizeHoliday(k, entry)));
  });
  // Range-urile de vacanță se expandează o dată, la pornire, în zile calendaristice.
  (HOLIDAYS_DATA.ranges || []).forEach(r => {
    const a = String(r.from).split('-').map(Number), b = String(r.to).split('-').map(Number);
    let y = a[0], m = a[1] - 1, d = a[2], guard = 0;
    const end = new Date(b[0], b[1] - 1, b[2]).getTime();
    while (new Date(y, m, d).getTime() <= end && guard++ < 4000) {
      push(`${y}-${m + 1}-${d}`, classifyHoliday(y, m, d, r.name, r.cat || 'vacanta'));
      d++;
      const dim = new Date(y, m + 1, 0).getDate();
      if (d > dim) { d = 1; m++; if (m > 11) { m = 0; y++; } }
    }
  });
  addComputedLegal(map);
  return map;
})();
// Întotdeauna o LISTĂ (golă când ziua nu are sărbătoare), ca vacanțele să se poată
// suprapune cu sărbătorile legale / SDSL și cu turele din aceeași zi.
function holidaysFor(y, m, d) { return HOLIDAYS[`${y}-${m + 1}-${d}`] || []; }
function visibleHolidays(c, y, m, d) {
  return holidaysFor(y, m, d).filter(h => c.filters && c.filters[h.cat] !== false);
}
function holTag(cat) { return ({ legal:'ZL', vacanta:'VAC', religios:'SĂR', punte:'P' })[cat] || 'SĂR'; }
// Alias pentru codul care mai citește vechea hartă de sărbători legale.
const LEGAL_HOLIDAYS = {};
function rebuildLegalMap() {
  Object.keys(LEGAL_HOLIDAYS).forEach(k => delete LEGAL_HOLIDAYS[k]);
  Object.keys(HOLIDAYS).forEach(k => {
    const legal = HOLIDAYS[k].filter(h => h.cat === 'legal');
    if (legal.length) LEGAL_HOLIDAYS[k] = legal.map(h => h.name).join(', ');
  });
}
rebuildLegalMap();

// Un răspuns live de pe zilelibere.com (sau o copie făcută la build) poate înlocui
// datele înglobate fără să schimbe codul. Cache-ul e folosit când browserul e offline.
const HOLIDAY_CACHE_KEY = 'ore-ture-holidays-cache-v2';
function applyHolidayData(data, quiet) {
  if (!data || !data.days) return false;
  Object.keys(HOLIDAYS).forEach(k => delete HOLIDAYS[k]);
  const push = (k, entry) => {
    if (!entry || !entry.name) return;
    const arr = HOLIDAYS[k] || (HOLIDAYS[k] = []);
    if (!arr.some(x => x.name === entry.name && x.cat === entry.cat)) arr.push(entry);
  };
  Object.keys(data.days || {}).forEach(k => {
    const v = data.days[k];
    (Array.isArray(v) ? v : [v]).forEach(entry => push(k, normalizeHoliday(k, entry)));
  });
  (data.ranges || []).forEach(r => {
    const a = String(r.from).split('-').map(Number), b = String(r.to).split('-').map(Number);
    let y = a[0], m = a[1] - 1, d = a[2], guard = 0;
    const end = new Date(b[0], b[1] - 1, b[2]).getTime();
    while (new Date(y, m, d).getTime() <= end && guard++ < 4000) {
      push(`${y}-${m + 1}-${d}`, classifyHoliday(y, m, d, r.name, r.cat || 'vacanta'));
      d++;
      const dim = new Date(y, m + 1, 0).getDate();
      if (d > dim) { d = 1; m++; if (m > 11) { m = 0; y++; } }
    }
  });
  addComputedLegal(HOLIDAYS);
  rebuildLegalMap();
  if (data.source) HOLIDAYS_DATA.source = data.source;
  if (data.updated) HOLIDAYS_DATA.updated = data.updated;
  HOLIDAYS_DATA.days = data.days || {};
  HOLIDAYS_DATA.ranges = data.ranges || [];
  if (!quiet) {
    try { localStorage.setItem(HOLIDAY_CACHE_KEY, JSON.stringify(data)); } catch (e) { /* storage full */ }
    (state && state.calendars ? state.calendars : []).forEach(c => { c.holidaysUpdated = data.updated; });
  }
  return true;
}
try {
  const cachedHolidays = JSON.parse(localStorage.getItem(HOLIDAY_CACHE_KEY) || 'null');
  if (cachedHolidays && cachedHolidays.days) applyHolidayData(cachedHolidays, true);
} catch (e) { /* ignore a corrupt holiday cache */ }

const PATTERNS = {
  // — ture de 12 / 24 ore (convenția aplicației: Z 14h, N 13h pontate; editabile în Setări → Calcul)
  '12/24-12/48': { zile:['Z','N','L','L'] },
  '12/24':       { zile:['Z','L','N','L'] },
  '12/24-24/72': { zile:['Z','N','L','L','L','L'] },
  '24/48':       { zile:['Z','L','L'] },
  '24/72':       { zile:['Z','L','L','L'] },
  // — 12 ore reale (07–19 / 19–07)
  '12h-zi-noapte-2L':   { zile:['Z12','N12','L','L'] },
  '12h-2zi-2noapte-4L': { zile:['Z12','Z12','N12','N12','L','L','L','L'] },
  '12/48':              { zile:['Z12','L','L'] },
  // — 8 ore
  '8/5-birou':          { zile:['B8','B8','B8','B8','B8','L','L'] },
  '8/3-dimineata':      { zile:['S1','S1','S1','S1','S1','L','L'] },
  '8/3-dupaamiaza':     { zile:['S2','S2','S2','S2','S2','L','L'] },
  '8/3-noapte':         { zile:['S3','S3','S3','S3','S3','L','L'] },
  '8/3-rotativ':        { zile:['S1','S1','S1','S1','S1','L','L','S2','S2','S2','S2','S2','L','L','S3','S3','S3','S3','S3','L','L'] },
  '8/3-continuu-4zile': { zile:['S1','S1','S2','S2','S3','S3','L','L'] },
};

// The person asked to be able to create, generate and edit "Tipul de tură".
// Built-in patterns stay fixed; each calendar also holds its own custom ones.
function builtinPatterns() {
  return Object.keys(PATTERNS).map(id => ({ id, name: id, zile: PATTERNS[id].zile.slice(), builtin:true }));
}
function allPatterns(c) { return builtinPatterns().concat((c && c.patternTypes) || []); }
function patternById(c, id) { return allPatterns(c).find(p => p.id === id) || null; }
function currentSequence(c) {
  const p = patternById(c, c.pattern);
  return p ? p.zile : ['Z'];
}
function parseSequence(text) {
  return String(text || '').trim().split(/[\s,;]+/).map(s => s.trim()).filter(Boolean);
}

const COLOR_POOL = ['rec','preg','cont','psih','zi','noapte'];
// The person asked for one category holding all seven named shift codes, next to Concedii/COS.
const TURE_CATEGORY = 'Ture';
// „TureZ” — altă categorie pentru TureZ(Zi), N(Noapte), L(Liber), R(Recuperare), P(Pregatire), Cont.(Continuitate), Psih(Psihologic).
const TUREZ_CATEGORY = 'TureZ';
const BUILTIN_SHIFT_IDS = ['Z','N','L','R','P','Cont','Psih'];
const CATEGORY_CLS = {
  'Ture':'zi',
  'TureZ':'zi',
  'Ture de 8 ore':'zi',
  'Ture de 12 ore':'noapte',
  'Ture de 24 ore':'cont',
  'Concedii':'co',
  'COS':'cos',
  'Sărbători':'ort',
  'Altele':'rec',
};
// Free days (L) are drawn exactly like an untouched day in the reference site:
// no fill, no badge, no writing. They stay in the data (0 hours) but never paint a cell.
function isBlankShift(t) {
  if (!t || t.group === 'leave') return false;
  if (t.blank === true) return true;
  const code = String(t.code || t.id || '').toUpperCase();
  // „X” era codul vechi al turei Liber în versiunea veche a programului.
  // Îl tratăm identic: o zi liberă nu afișează niciodată litera X.
  return code === 'L' || code === 'LIBER' || code === 'X';
}

const MONTHS_RO = ['Ianuarie','Februarie','Martie','Aprilie','Mai','Iunie','Iulie','August','Septembrie','Octombrie','Noiembrie','Decembrie'];
const COLOR_OPTIONS = [
  ['zi','Gri (Zi)'], ['noapte','Gri închis (Noapte)'], ['liber','Alb (Liber)'],
  ['rec','Gri deschis (Recuperare)'], ['preg','Albastru (Pregătire)'], ['cont','Albastru (Continuitate)'],
  ['psih','Albastru (Psihologic)'], ['co','Galben (Concediu)'], ['cm','Azuriu (Medical)'], ['cos','Liliac (COS)'],
  ['ort','Portocaliu (Sărbătoare)'],
];
// Matches the reference-site palette (styles.css light theme) and the palette tiles.
const TYPE_HEX = { zi:'#E4E4E4', noapte:'#555555', liber:'#FFFFFF', rec:'#F7F7F7', preg:'#E6F1FB',
  cont:'#E6F1FB', psih:'#E6F1FB', co:'#FFF9C4', cm:'#E0F2FE', cos:'#F3E8FF', ort:'#F7977A' };
// Sârbătoare folosește clasa „ort” (portocaliu), ca în paleta de referință.
function typeColor(t) { return t.bg || TYPE_HEX[t.cls] || '#EEEEEE'; }
function contrastColor(hex) {
  const h = String(hex || '').replace('#','');
  if (h.length < 6) return '#1a1a1a';
  const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16);
  const lum = (0.299*r + 0.587*g + 0.114*b) / 255;
  return lum > 0.6 ? '#1a1a1a' : '#ffffff';
}
function defaultCategories() {
  return [
    { name:'Ture', cls:'zi' }, { name:'TureZ', cls:'zi' }, { name:'Ture de 8 ore', cls:'zi' }, { name:'Ture de 12 ore', cls:'noapte' },
    { name:'Concedii', cls:'co' },
    { name:'COS', cls:'cos' }, { name:'Sărbători', cls:'ort' }, { name:'Altele', cls:'rec' },
  ];
}
function refreshTypeClasses(c) {
  (c.types || []).forEach(t => {
    const cat = (c.categories || []).find(x => x.name === t.category);
    // Turele de bază își păstrează culoarea proprie (N închis, P albastru…) cât timp culoarea categoriei nu a fost schimbată.
    if (t.builtin && cat && cat.cls === CATEGORY_CLS[t.category]) return;
    if (cat && cat.cls) t.cls = cat.cls;
    else if (CATEGORY_CLS[t.category]) t.cls = CATEGORY_CLS[t.category];
  });
}

/* =========================================================
   MECHANICS recovered from the original APK (see MECHANICS.md).
   Package com.pontajture.mobile, classes2.dex (buildPontaj Ture).
   ========================================================= */
// mechanics-data.js (generated by the build from mechanics-data.json) supplies the
// real values decompiled from the original APK. The inline values are a fallback
// so this file still parses and runs on its own.
const APK_MECHANICS = (typeof window !== 'undefined' && window.APK_MECHANICS) || null;
const MECHANICS = Object.assign({
  source: 'Pontaj Ture.apk / com.pontajture.mobile — app de ture gratuită Pontaj Ture.',
  addresses: {},
  settings: { darkMode:false, MantieneTurnosExistentes:true, TipoHoras:'0', tipoMoneda:'€' },
  strings: { FinalizaDiaSiguiente: '*Se încheie a doua zi după' },
  apkShifts: [
    { id:'apk_sabatoare', name:'Sărbătoare',       code:'S',    start:'00:00', end:'00:00', start2:'',    end2:'',    split:false, bg:'#F7977A', fg:'#550804' },
    { id:'apk_ziNaștere', name:'Zi de naștere',   code:'ZN',   start:'00:00', end:'00:00', start2:'',    end2:'',    split:false, bg:'#9BDCF8', fg:'#005F71' },
    { id:'apk_liber',     name:'Timp liber',       code:'L',    start:'00:00', end:'00:00', start2:'',    end2:'',    split:false, bg:'#C7E9CE', fg:'#166558' },
    { id:'apk_mixt',      name:'Dimineaţă / După amiază', code:'M/A', start:'10:00', end:'14:00', start2:'16:00', end2:'20:00', split:true,  bg:'#E1BAEC', fg:'#5C0958' },
    { id:'apk_noapte',    name:'Noapte',           code:'N',    start:'21:00', end:'07:00', start2:'',    end2:'',    split:false, bg:'#7ACDC8', fg:'#005F71' },
    { id:'apk_dupa',      name:'După amiază',      code:'A',    start:'14:00', end:'21:00', start2:'',    end2:'',    split:false, bg:'#F49AC2', fg:'#6B052E' },
    { id:'apk_dimineata', name:'Dimineaţă',        code:'M',    start:'08:00', end:'14:00', start2:'',    end2:'',    split:false, bg:'#FFF699', fg:'#5C5C63' },
  ],
  compareTimes(a, b) {
    if (!b) return 3;
    const sh = +a.slice(0,2), sm = +a.slice(3,5), eh = +b.slice(0,2), em = +b.slice(3,5);
    if (sh > eh || (sh === eh && sm > em)) return 2;
    if (sh === eh && sm === em) return 1;
    return 0;
  },
  scheduleText(clock) {
    if (!clock || !clock.start || !clock.end || clock.start === clock.end) return '';
    let text = `(${clock.start}-${clock.end})`;
    if (clock.split && clock.start2 && clock.end2 && clock.end !== clock.start2) {
      text += ` / (${clock.start2}-${clock.end2})`;
    }
    return text;
  },
  partMinutes(start, end) {
    if (!start || !end) return 0;
    let sh = +start.slice(0,2), sm = +start.slice(3,5);
    let eh = +end.slice(0,2),   em = +end.slice(3,5);
    if (sh > eh || (sh === eh && sm > em)) eh += 24;
    let h = eh - sh;
    let m = em >= sm ? em - sm : (em + 60) - sm;
    if (em < sm) h -= 1;
    return h * 60 + m;
  },
  shiftMinutes(t) {
    if (t.hours != null && !t.clock) return Math.round(Number(t.hours) * 60);
    if (!t.clock) return 0;
    let total = this.partMinutes(t.clock.start, t.clock.end);
    if (t.clock.split && t.clock.start2 && t.clock.end2) {
      total += this.partMinutes(t.clock.start2, t.clock.end2);
    }
    const brk = Math.max(0, Number(t.breakMin) || 0);
    return Math.max(0, total - brk);
  },
  shiftHours(t) { return Math.round((this.shiftMinutes(t) / 60) * 100) / 100; },
  extraMinutes(hours, minutes) { return (parseInt('0' + (minutes||0),10)) + (parseInt('0' + (hours||0),10) * 60); }
}, APK_MECHANICS || {});

// ---------- Type catalogue ----------
function builtinTypes() {
  return [
    { id:'Z',    name:'Zi',            code:'Z',    hours:14, group:'shift', builtin:true, cls:'zi',     category:TURE_CATEGORY,
      clock:{start:'07:00',end:'21:00',split:false}, breakMin:0 },
    { id:'N',    name:'Noapte',        code:'N',    hours:13, group:'shift', builtin:true, cls:'noapte', category:TURE_CATEGORY,
      clock:{start:'20:00',end:'09:00',split:false}, breakMin:0 },
    { id:'L',    name:'Liber',         code:'L',    hours:0,  group:'shift', builtin:true, cls:'liber',  category:TURE_CATEGORY, blank:true },
    { id:'R',    name:'Recuperare',    code:'R',    hours:0,  group:'shift', builtin:true, cls:'rec',    category:TURE_CATEGORY },
    { id:'P',    name:'Pregătire',     code:'P',    hours:8,  group:'shift', builtin:true, cls:'preg',   category:TURE_CATEGORY },
    { id:'Cont', name:'Continuitate',  code:'Cont.',hours:12, group:'shift', builtin:true, cls:'cont',   category:TURE_CATEGORY },
    { id:'Psih', name:'Psihologic',    code:'Psih', hours:8,  group:'shift', builtin:true, cls:'psih',   category:TURE_CATEGORY },
    // „Sârbătoare” apare ca paletă în site-ul de referință (categorie separată, 0h).
    // Ture cu orele reale ale programului (8h / 12h), pentru birou, 3 schimburi și ture de 12 ore.
    { id:'B8', name:'Birou 8h', code:'B8', hours:8, group:'shift', builtin:true, cls:'zi', category:'Ture de 8 ore',
      clock:{start:'08:00',end:'16:00',split:false}, breakMin:0, skipNonWorking:true },
    { id:'S1', name:'Dimineață 06–14', code:'S1', hours:8, group:'shift', builtin:true, cls:'zi', category:'Ture de 8 ore',
      clock:{start:'06:00',end:'14:00',split:false}, breakMin:0 },
    { id:'S2', name:'După-amiază 14–22', code:'S2', hours:8, group:'shift', builtin:true, cls:'preg', category:'Ture de 8 ore',
      clock:{start:'14:00',end:'22:00',split:false}, breakMin:0 },
    { id:'S3', name:'Noapte 22–06', code:'S3', hours:8, group:'shift', builtin:true, cls:'noapte', category:'Ture de 8 ore',
      clock:{start:'22:00',end:'06:00',split:false}, breakMin:0 },
    { id:'Z12', name:'Zi 12h 07–19', code:'Z12', hours:12, group:'shift', builtin:true, cls:'zi', category:'Ture de 12 ore',
      clock:{start:'07:00',end:'19:00',split:false}, breakMin:0 },
    { id:'N12', name:'Noapte 12h 19–07', code:'N12', hours:12, group:'shift', builtin:true, cls:'noapte', category:'Ture de 12 ore',
      clock:{start:'19:00',end:'07:00',split:false}, breakMin:0 },
    { id:'Sarb', name:'Sărbătoare',   code:'Săr',  hours:0,  group:'shift', builtin:true, cls:'ort',    category:'Sărbători' },
    // „TureZ” — altă categorie pentru TureZ(Zi), N(Noapte), L(Liber), R(Recuperare), P(Pregatire), Cont.(Continuitate), Psih(Psihologic).
    { id:'TZ_TureZ', name:'TureZ',       code:'TureZ', hours:14, group:'shift', builtin:true, cls:'zi',     category:TUREZ_CATEGORY,
      clock:{start:'07:00',end:'21:00',split:false}, breakMin:0 },
    { id:'TZ_Noapte', name:'Noapte',     code:'N',     hours:13, group:'shift', builtin:true, cls:'noapte', category:TUREZ_CATEGORY,
      clock:{start:'20:00',end:'09:00',split:false}, breakMin:0 },
    { id:'TZ_Liber',  name:'Liber',      code:'L',     hours:0,  group:'shift', builtin:true, cls:'liber',  category:TUREZ_CATEGORY, blank:true },
    { id:'TZ_Recuperare', name:'Recuperare', code:'R', hours:0, group:'shift', builtin:true, cls:'rec',     category:TUREZ_CATEGORY },
    { id:'TZ_Pregatire',  name:'Pregatire',  code:'P', hours:8,  group:'shift', builtin:true, cls:'preg',   category:TUREZ_CATEGORY },
    { id:'TZ_Cont',   name:'Continuitate', code:'Cont.', hours:12, group:'shift', builtin:true, cls:'cont',  category:TUREZ_CATEGORY },
    { id:'TZ_Psih',   name:'Psihologic',   code:'Psih',  hours:8,  group:'shift', builtin:true, cls:'psih',   category:TUREZ_CATEGORY },
  ];
}
const LEAVE_TYPES = [
  { id:'CO',  name:'Concediu de odihnă', code:'CO',  hours:8, group:'leave', builtin:true, cls:'co',  category:'Concedii' },
  { id:'CM',  name:'Concediu medical',   code:'CM',  hours:8, group:'leave', builtin:true, cls:'cm',  category:'Concedii' },
  { id:'COS', name:'COS',                code:'COS', hours:8, group:'leave', builtin:true, cls:'cos', category:'COS' },
];

// ---------- State ----------
const STORAGE_KEY = 'ore-ture-state-v1';
let state = loadState();
let liveStateSig = null;   // ultima stare salvată văzută de sincronizarea automată
let ui = { selected:'Z', paint:false, formMode:null, editing:null, selectedPoss:null, selectedFree:null, overtimeClosed:false };

/* =========================================================
   Meniu retractabil — fiecare meniu are o etichetă de pliere/expansiune.
   Starea persistă în localStorage. Calendarul rămâne mereu deschis.
   ========================================================= */
const MENU_STORAGE = 'ore-ture-menus-v1';
function menuOpen(id) {
  try {
    const m = JSON.parse(localStorage.getItem(MENU_STORAGE) || '{}');
    if (typeof m[id] === 'boolean') return m[id];
  } catch (e) {}
  return false;
}
function applyMenuOpen(id, open) {
  const head = document.querySelector(`[data-menu-id="${id}"]`);
  if (!head) return;
  const body = document.getElementById(head.dataset.menuBody);
  head.setAttribute('aria-expanded', open ? 'true' : 'false');
  const caret = head.querySelector('.caret');
  if (caret) caret.textContent = open ? '▾' : '▶';
  if (body) body.classList.toggle('closed', !open);
  try {
    const m = JSON.parse(localStorage.getItem(MENU_STORAGE) || '{}');
    m[id] = !!open;
    localStorage.setItem(MENU_STORAGE, JSON.stringify(m));
  } catch (e) {}
}
function toggleMenu(id) {
  const head = document.querySelector(`[data-menu-id="${id}"]`);
  if (!head) return;
  const open = head.getAttribute('aria-expanded') !== 'true';
  applyMenuOpen(id, open);
  if (id === 'overtime') ui.overtimeClosed = !open;
}
function initMenus() {
  // La deschiderea paginii toate categoriile sunt restrânse; calendarul rămâne în prim-plan.
  try { localStorage.removeItem(MENU_STORAGE); } catch (e) {}
  document.querySelectorAll('[data-menu-id]').forEach(h => {
    applyMenuOpen(h.dataset.menuId, false);
    h.onclick = () => toggleMenu(h.dataset.menuId);
  });
}
// Deschide meniul overtime-laws automat când există ore suplimentare (ore plus > 0).
function syncOvertimeLaws(total) {
  // Meniurile rămân restrânse până le deschizi tu; doar resetăm starea.
  if (Number(total) <= 0) ui.overtimeClosed = false;
}

// Desfășurare automată a meniurilor care conțin controale relevante până la
// acțiunea utilizatorului (Generează programul, Aplică pe zile, Tura nouă, Setări plată).
function autoOpenMenus(ids) {
  (ids || []).forEach(id => { if (menuOpen(id) === false) applyMenuOpen(id, true); });
}

// ---------- Ghidul overtime complet (modal) ----------
function openOvertimeDetail() {
  const m = document.getElementById('overtime-detail-modal');
  if (!m) return;
  renderOvertimeDetail();
  m.style.display = 'flex';
}
function closeOvertimeDetail() {
  const m = document.getElementById('overtime-detail-modal');
  if (m) m.style.display = 'none';
}
function backToAppFromOvertimeDetail() {
  closeOvertimeDetail();
}

function loadState() {
  let s = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) s = JSON.parse(raw);
  } catch (e) { /* ignore corrupt storage */ }
  if (!s || !Array.isArray(s.calendars) || !s.calendars.length) {
    const first = makeCalendar('Calendarul meu');
    return { calendars:[first], activeId:first.id, theme:'light', holidaysData:defaultHolidayState() };
  }
  s.calendars.forEach(normalizeCalendar);
  if (!s.holidaysData || !s.holidaysData.days) s.holidaysData = defaultHolidayState();
  return s;
}
function normalizeCalendar(c) {
  // Carry-over is a per-month chain. A month's "rămase din luna trecută" is never
  // stored independently — it is always the previous month's "pentru luna viitoare".
  // Migrate the old single global fields once, then drop them so they can't go stale.
  c.carry = c.carry || {};
  if (c.extraPrev != null || c.extraNext != null) {
    const ck = monthKey(c.year, c.month);
    const val = Number(c.extraNext != null ? c.extraNext : c.extraPrev) || 0;
    if (!c.carry[ck]) c.carry[ck] = { v:round2(val), manual:c.autoExtra === false };
    delete c.extraPrev; delete c.extraNext; delete c.autoExtra;
  }
  // Older versions stored a single id per day; overlap needs arrays.
  Object.keys(c.assignments || {}).forEach(k => {
    const v = c.assignments[k];
    c.assignments[k] = Array.isArray(v) ? v : (v ? [v] : []);
  });
  // Curățăm marcajele lăsate de versiunile vechi: litera „X” (codul vechi al
  // turei Liber) și orice tură goală nu trebuie să apară în calendar.
  // Orele pontate rămân în calcul (vin și din tura de noapte a zilei dinainte).
  Object.keys(c.assignments || {}).forEach(k => {
    c.assignments[k] = c.assignments[k].filter(id => {
      const up = String(id || '').toUpperCase();
      const ty = typeById(c, id);
      return up !== 'X' && !(ty && isBlankShift(ty));
    });
    if (!c.assignments[k].length) delete c.assignments[k];
  });
  c.types = (c.types || []).map(t => ({ category:'Altele', ...t }));
  // Turele de bază adăugate în versiuni noi apar și în calendarele salvate mai demult.
  builtinTypes().forEach(b => { if (!c.types.some(t => t.id === b.id)) c.types.push(b); });
  if (!c.prevOverride) c.prevOverride = {};
  if (!c.prevPinned) c.prevPinned = {};
  if (!c.chosenVariant) c.chosenVariant = {};
  if (!c.salary) c.salary = { brut:'', dep:0, sub26:false, pNoapte:25, pExtra:75, pWeekend:50, pLegal:100, platite:false };
  c.patternTypes = (c.patternTypes || []).filter(p => p && p.id && Array.isArray(p.zile) && p.zile.length);
  if (c.keepExisting == null) c.keepExisting = true;
  if (c.currency == null) c.currency = (APK_MECHANICS && APK_MECHANICS.settings && APK_MECHANICS.settings.tipoMoneda) || '€';
  if (c.genScope == null) c.genScope = 'month';
  if (c.genStart == null) c.genStart = 1;
  c.categories = (c.categories && c.categories.length) ? c.categories : defaultCategories();
  // Make sure the three named categories exist, including on calendars saved by older versions.
  defaultCategories().forEach(cat => {
    if (!c.categories.some(x => x.name === cat.name)) c.categories.push({ name:cat.name, cls:cat.cls });
  });
  // The seven named shift codes live together in the "Ture" category.
  c.types.forEach(t => { if (BUILTIN_SHIFT_IDS.indexOf(t.id) !== -1) t.category = TURE_CATEGORY; });
  // Setări scrise pentru Pontaj Ture (vezi MECHANICS.md §1).
  if (c.language == null) c.language = (APK_MECHANICS && APK_MECHANICS.settings && APK_MECHANICS.settings.Idioma) || 'ro';
  if (c.incomePerHour == null) c.incomePerHour = 0;
  if (c.badgeFont == null) c.badgeFont = 10;
  if (c.tipoHoras == null) c.tipoHoras = (APK_MECHANICS && APK_MECHANICS.settings && APK_MECHANICS.settings.TipoHoras) || '0';
  if (c.autoCalc !== false && c.autoCalc !== true) c.autoCalc = true;
  if (c.defaultBreak == null) c.defaultBreak = 0;
  if (c.noteBg == null) c.noteBg = '#ffffff';
  if (c.noteText == null) c.noteText = '#1a1a1a';
  if (c.noteOpacity == null) c.noteOpacity = 100;
  c.filters = Object.assign({ legal:true, religios:true, vacanta:true, punte:true }, c.filters || {});
  // Versiunile vechi foloseau ort / iud / isl: le convertim într-o singură categorie „religios”.
  if (c.filters.religios === undefined) {
    c.filters.religios = c.filters.ort !== false || c.filters.iud !== false || c.filters.isl !== false;
  }
  delete c.filters.ort; delete c.filters.iud; delete c.filters.isl;
  c.view = c.view === 'year' ? 'year' : 'month';
  if (c.sdslInclude == null) c.sdslInclude = false;
  c.dayDetails = c.dayDetails || {};
  // Zilele libere (L) dintr-un program generat: se păstrează doar ca informație
  // de afișare, ca celula să rămână complet goală (fără X, L, culoare sau text).
  c.blankDays = c.blankDays || {};
  // Salariu pe tură (ca pe site-ul de referință)
  if (c.payPerShift === undefined) c.payPerShift = null;
  if (c.doubleMultiplier == null) c.doubleMultiplier = 2;
  if (c.gameInvites == null) c.gameInvites = true;
  // Notificări pentru programul de ture (setare per calendar).
  c.notify = Object.assign({ enabled:false, lead:120, days:3, types:[], sound:true, todaySummary:true }, c.notify || {});
  c.notify.lead = Math.min(1440, Math.max(5, Number(c.notify.lead) || 120));
  c.notify.days = Math.min(14, Math.max(1, Number(c.notify.days) || 3));
  if (!Array.isArray(c.notify.types)) c.notify.types = [];
  if (!c.holidaysUpdated) c.holidaysUpdated = HOLIDAYS_DATA.updated || '';
  if (!c.rangeFrom) c.rangeFrom = { d:1, m:c.month, y:c.year };
  if (!c.rangeTo) c.rangeTo = { d:daysInMonth(c.year, c.month), m:c.month, y:c.year };
  refreshTypeClasses(c);
}
function saveState() {
  const raw = JSON.stringify(state);
  localStorage.setItem(STORAGE_KEY, raw);
  liveStateSig = raw;   // scrierile locale nu trebuie reconstruite ca „străine” la focus
  if (typeof scheduleCloudPush === 'function') scheduleCloudPush();
}

function makeCalendar(name) {
  const now = new Date();
  return {
    id: 'c_' + Date.now() + '_' + Math.random().toString(36).slice(2,6),
    name: name || 'Calendar nou',
    year: now.getFullYear(), month: now.getMonth(),
    pattern: '12/24-12/48', customHours: 14,
    patternTypes: [], keepExisting: true,
    currency: (APK_MECHANICS && APK_MECHANICS.settings && APK_MECHANICS.settings.tipoMoneda) || '€',
    genScope: 'month', genStart: 1,
    rangeFrom: { d:1, m:now.getMonth(), y:now.getFullYear() },
    rangeTo: { d:daysInMonth(now.getFullYear(), now.getMonth()), m:now.getMonth(), y:now.getFullYear() },
    types: builtinTypes(),
    categories: defaultCategories(),
    assignments: {},
    dayDetails: {},
    blankDays: {},
    view: 'month',
    filters: { legal:true, religios:true, vacanta:true, punte:true },
    holidaysUpdated: HOLIDAYS_DATA.updated || '',
    carry: {}, // 'YYYY-MM' -> { v: ore pentru luna următoare, manual: bool }
    dayHours: 14, nightHours: 13,
    sdslInclude: false,
    payPerShift: null, doubleMultiplier: 2, gameInvites: true,
    notify: { enabled:false, lead:120, days:3, types:[], sound:true, todaySummary:true },
    language: (APK_MECHANICS && APK_MECHANICS.settings && APK_MECHANICS.settings.Idioma) || 'ro',
    incomePerHour: 0, badgeFont: 10,
    tipoHoras: (APK_MECHANICS && APK_MECHANICS.settings && APK_MECHANICS.settings.TipoHoras) || '0',
    autoCalc: true, defaultBreak: 0,
    noteBg: '#ffffff', noteText: '#1a1a1a', noteOpacity: 100,
  };
}
function cal() { return state.calendars.find(c => c.id === state.activeId) || state.calendars[0]; }
function typeById(c, id) { return c.types.find(t => t.id === id) || LEAVE_TYPES.find(t => t.id === id); }
function key(y, m, d) { return `${y}-${m + 1}-${d}`; }
function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function round2(n) { return Math.round((Number(n) || 0) * 100) / 100; }
function monthKey(y, m) { return `${y}-${String(m + 1).padStart(2, '0')}`; }
function prevMonth(y, m) { return m === 0 ? [y - 1, 11] : [y, m - 1]; }

// The single source of truth for carry-over: one record per month holding the
// "ore suplimentare pentru luna viitoare" that month sends forward.
function carryRec(c, y, m) {
  c.carry = c.carry || {};
  const k = monthKey(y, m);
  if (!c.carry[k]) c.carry[k] = { v:0, manual:false };
  return c.carry[k];
}
// What a month shows as "rămase din luna trecută": the previous month's carry-out.
function carryIn(c, y, m) {
  // Editarea manuală („dacă vin cu X ore din urmă”) are prioritate; butonul Auto o șterge.
  c.prevOverride = c.prevOverride || {};
  const ov = c.prevOverride[monthKey(y, m)];
  if (ov != null && ov !== '' && !isNaN(Number(ov))) return round2(Number(ov));
  const [py, pm] = prevMonth(y, m);
  return round2(carryRec(c, py, pm).v);
}
function carryOut(c, y, m) { return round2(carryRec(c, y, m).v); }

function getNorma(year, month) {
  if (NORMA[year]) return NORMA[year][month];
  let wd = 0;
  const days = daysInMonth(year, month);
  for (let d = 1; d <= days; d++) {
    const dow = new Date(year, month, d).getDay();
    if (dow !== 0 && dow !== 6 && !holidaysFor(year, month, d).some(h => h.cat === 'legal')) wd++;
  }
  return wd * 8;
}
// "TipoHoras" from the original app: 0 = whole hours, 1 = hours with decimals.
function fmtHours(v) {
  const n = Number(v) || 0;
  if (String((cal() || {}).tipoHoras) === '1') return (Math.round(n * 100) / 100).toFixed(2);
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10);
}

// ---------- Theme ----------
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.getElementById('theme-toggle').textContent = theme === 'dark' ? '☀️' : '🌙';
}
function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  applyTheme(state.theme); saveState();
}

// ---------- Rendering: calendars ----------
function renderCalendarSelect() {
  const sel = document.getElementById('calendar-select');
  sel.innerHTML = state.calendars.map(c =>
    `<option value="${c.id}" ${c.id === state.activeId ? 'selected' : ''}>${escapeHtml(c.name)}</option>`
  ).join('');
}

// ---------- Rendering: palettes ----------
function renderPalettes() {
  const c = cal();
  const wrap = document.getElementById('shift-palette');
  // Concediile (CO/CM/COS) sunt integrate în aceeași paletă cu turele —
  // „Categoria Concedii” face parte din Categoriile de ture.
  const all = c.types.concat(LEAVE_TYPES);
  wrap.innerHTML = all.map(t => {
    const cls = t.cls || 'liber';
    const st = t.bg ? ` style="background:${t.bg};color:${t.fg || '#000'};border-color:${t.bg}"` : '';
    const edit = t.group === 'leave' ? '' : `<span class="pal-edit" data-edit="${t.id}" title="Editează tura ${escapeHtml(t.name)}">✎</span>`;
    const sched = MECHANICS.scheduleText(t.clock);
    const title = `${escapeHtml(t.name)} — ${MECHANICS.shiftHours(t)} ore${t.category ? ' · ' + escapeHtml(t.category) : ''}${sched ? ' ' + sched : ''}`;
    return `
    <button class="pal-btn ${ui.selected === t.id ? 'selected' : ''} ${t.group === 'leave' ? 'leave-tile' : ''}" data-type="${t.id}" data-cls="${cls}" title="${title}"
      ${st}>
      ${edit}
      <span class="pal-code">${escapeHtml(t.code)}</span>
      <span class="pal-name">${escapeHtml(t.name)}</span>
      <span class="pal-ore">${fmtHours(MECHANICS.shiftHours(t))}h</span>
    </button>`;
  }).join('');
  // Selecting a category does NOT turn off the active apply mode.
  wrap.querySelectorAll('.pal-btn').forEach(b => b.onclick = (e) => {
    if (e.target.closest('.pal-edit')) return;
    ui.selected = b.dataset.type; ui.editing = null;
    renderPalettes();
  });
  wrap.querySelectorAll('.pal-edit').forEach(el => el.onclick = (e) => {
    e.stopPropagation(); openEditor(el.dataset.edit);
  });
  renderCategoryOptions();
  renderCategoryPanel();
  renderPaintState();
}

// Categoriile pot fi create / editate de utilizator; lista din formular urmează calendarul activ.
function renderCategoryOptions() {
  const sel = document.getElementById('f-category');
  if (!sel) return;
  const prev = sel.value;
  sel.innerHTML = cal().categories.map(cat =>
    `<option value="${escapeHtml(cat.name)}">${escapeHtml(cat.name)}</option>`).join('');
  if (prev && Array.from(sel.options).some(o => o.value === prev)) sel.value = prev;
}
function clsVar(cls) { return '--' + (cls || 'rec') + '-bg'; }
function renderCategoryPanel() {
  const c = cal();
  const list = document.getElementById('cat-list');
  if (!list) return;
  list.innerHTML = c.categories.map((cat, i) => `
    <div class="cat-row">
      <span class="cat-swatch" style="background:var(${clsVar(cat.cls)})"></span>
      <input class="cat-name-input" data-i="${i}" value="${escapeHtml(cat.name)}" maxlength="30" title="Denumirea categoriei" />
      <select class="color-select" data-i="${i}" title="Culoarea categoriei">
        ${COLOR_OPTIONS.map(([v,n]) => `<option value="${v}" ${v === cat.cls ? 'selected' : ''}>${n}</option>`).join('')}
      </select>
      <button class="mini-btn danger" data-delcat="${i}" title="Șterge categoria">🗑</button>
    </div>`).join('');
  list.querySelectorAll('.cat-name-input').forEach(inp => {
    inp.onchange = () => renameCategory(Number(inp.dataset.i), inp.value.trim());
  });
  list.querySelectorAll('.color-select').forEach(sel => {
    sel.onchange = () => {
      const c2 = cal(), cat = c2.categories[Number(sel.dataset.i)];
      if (!cat) return;
      cat.cls = sel.value; refreshTypeClasses(c2); saveState(); renderAll();
    };
  });
  list.querySelectorAll('[data-delcat]').forEach(b => b.onclick = () => deleteCategory(Number(b.dataset.delcat)));
}
function addCategory() {
  const c = cal();
  const inp = document.getElementById('cat-new-name');
  const name = (inp.value || '').trim();
  if (!name) { uiAlert('Scrie numele categoriei noi.'); return; }
  if (c.categories.some(x => x.name === name)) { uiAlert('Există deja o categorie cu acest nume.'); return; }
  c.categories.push({ name, cls: document.getElementById('cat-new-color').value || 'rec' });
  inp.value = '';
  saveState(); renderAll();
}
function renameCategory(i, newName) {
  const c = cal(), cat = c.categories[i];
  if (!cat || !newName) { renderCategoryPanel(); return; }
  const old = cat.name;
  if (old === newName) return;
  if (c.categories.some((x, j) => j !== i && x.name === newName)) {
    uiAlert('Există deja o categorie cu acest nume.'); renderCategoryPanel(); return;
  }
  cat.name = newName;
  c.types.forEach(t => { if (t.category === old) t.category = newName; });
  saveState(); renderAll();
}
async function deleteCategory(i) {
  const c = cal(), cat = c.categories[i];
  if (!cat) return;
  if (!(await uiConfirm(`Ștergi categoria „${cat.name}”? Turele ei vor trece la „Altele”.`, 'Șterge'))) return;
  c.types.forEach(t => { if (t.category === cat.name) { t.category = 'Altele'; t.cls = 'rec'; } });
  c.categories.splice(i, 1);
  if (!c.categories.some(x => x.name === 'Altele')) c.categories.push({ name:'Altele', cls:'rec' });
  refreshTypeClasses(c); saveState(); renderAll();
}
function renderPaintState() {
  const btn = document.getElementById('btn-apply');
  btn.classList.toggle('active-mode', ui.paint);
  btn.textContent = ui.paint ? '✓ Mod aplicare activ — apasă zilele' : '📅 Aplică pe zile';
}

// ---------- Rendering: calendar grid ----------
function renderCalendar() {
  const c = cal();
  const monthGrid = document.getElementById('cal');
  const yearGrid = document.getElementById('cal-year');
  const yearView = c.view === 'year';

  const locales = { ro:'ro-RO', en:'en-US', es:'es-ES' };
  const label = yearView ? String(c.year)
    : (new Date(c.year, c.month, 1).toLocaleDateString(locales[c.language] || 'ro-RO', { month:'long', year:'numeric' }));
  document.getElementById('month-label').textContent = label.charAt(0).toUpperCase() + label.slice(1);
  document.getElementById('view-month').classList.toggle('active', !yearView);
  document.getElementById('view-year').classList.toggle('active', yearView);
  if (monthGrid) monthGrid.style.display = yearView ? 'none' : 'grid';
  if (yearGrid) yearGrid.style.display = yearView ? 'grid' : 'none';
  const yh = document.getElementById('year-hint');
  if (yh) yh.style.display = yearView ? 'block' : 'none';
  if (yearView) { renderYearCalendar(); return; }

  const y = c.year, m = c.month;
  const firstDay = new Date(y, m, 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const days = daysInMonth(y, m);
  const names = ({ en:['Mo','Tu','We','Th','Fr','Sa','Su'], es:['Lu','Ma','Mi','Ju','Vi','Sá','Do'] })[c.language] || ['Lu','Ma','Mi','Jo','Vi','Sâ','Du'];
  let html = names.map((n, i) => `<div class="cal-day-name${i >= 5 ? ' weekend' : ''}">${n}</div>`).join('');
  for (let i = 0; i < offset; i++) html += '<div class="day empty"></div>';

  const todayStr = new Date().toDateString();
  for (let d = 1; d <= days; d++) {
    const dateObj = new Date(y, m, d);
    const k = key(y, m, d);
    const ids = c.assignments[k] || [];
    const allTypes = ids.map(id => typeById(c, id)).filter(Boolean);
    // A free day (L) keeps its 0 hours in the data but draws as a completely
    // empty cell — no X, no L, no colour and no holiday text — exactly like an
    // untouched day on app.calculatorture.ro.
    const types = allTypes.filter(t => !isBlankShift(t));
    const explicitBlank = (allTypes.length > 0 && types.length === 0) ||
      (!!(c.blankDays && c.blankDays[k]) && types.length === 0);
    const primary = types[0];
    const hols = visibleHolidays(c, y, m, d);
    const hasLegal = hols.some(h => h.cat === 'legal');

    let cls = 'day' + (primary ? ' ' + primary.cls : '');
    if (explicitBlank) cls += ' blank-cell';
    if (types.length) cls += ' has-shift';
    if (dateObj.getDay() === 0 || dateObj.getDay() === 6) cls += ' weekend';
    if (dateObj.toDateString() === todayStr) cls += ' today';
    // O zi liberă generată rămâne complet goală: nici măcar contur de sărbătoare legală.
    if (hasLegal && !explicitBlank) cls += ' legal-holiday';
    if (types.length > 1) cls += ' overlap';

    let styleAttr = (primary && primary.bg)
      ? ` style="background:${primary.bg};color:${primary.fg || '#000'};border-color:${primary.bg}"` : '';
    if (types.length > 1) {
      const n = types.length;
      const stops = types.map((t, i) =>
        `${typeColor(t)} ${(i * 100 / n).toFixed(2)}%, ${typeColor(t)} ${((i + 1) * 100 / n).toFixed(2)}%`).join(', ');
      styleAttr = ` style="background:linear-gradient(135deg, ${stops});color:#1a1a1a;border-color:var(--accent)"`;
      cls += ' split-overlap';
    }
    const badgeStyle = ` style="font-size:${Number(c.badgeFont) || 10}px"`;
    const badges = types.map(t =>
      `<span class="shift-badge"${badgeStyle} title="${escapeHtml(t.name)} — ${MECHANICS.shiftHours(t)}h">${escapeHtml(t.code)}</span>`
    ).join('');
    // ORELE afișate sus-centru pe fiecare zi. Regula persoanei: o tură care trece
    // de miezul nopții își arată orele împărțite pe zile calendaristice —
    // ex. 15 N (20:00→09:00) → 4h pe 15 (ziua în care începe) și 9h pe 16.
    // Toate celelalte ture (Z, R, P, Cont., Psih, CO, CM, COS, Preg, custom)
    // își arată numărul de ore stabilit în catalog, în ziua în care sunt bifate.
    // Zilele libere (L) rămân complet goale, fără niciun text.
    // Orele pontate în ziua calendaristică se arată și pe zilele libere: vin din
    // tura de noapte a zilei dinainte. Dispare doar litera X / culoarea / etichetele.
    let dayH = 0, hoursTitle = '';
    dayH = effectiveDayHours(c, y, m, d);
    if (dayH > 0) {
      const lastOwn = ids.length ? typeById(c, ids[ids.length - 1]) : null;
      const ownShare = lastOwn
        ? round2((shiftMinutesByDate(lastOwn, y, m, d)[key(y, m, d)] || 0) / 60) : 0;
      const spillShare = round2(dayH - ownShare);
      hoursTitle = hasManualHours(c, y, m, d)
        ? `Ore stabilite manual în ziua ${d}: ${fmtHours(dayH)}h`
        : (spillShare > 0
            ? (ownShare > 0
                ? `${fmtHours(ownShare)}h din tura zilei + ${fmtHours(spillShare)}h după miezul nopții`
                : `${fmtHours(spillShare)}h din tura de noapte a zilei precedente (după miezul nopții)`)
            : `Ore pontate în ziua ${d}: ${fmtHours(dayH)}h`);
    }
    const hoursBadge = dayH > 0
      ? `<span class="hours-badge" title="${escapeHtml(hoursTitle)}">${fmtHours(dayH)}h</span>`
      : '';
    // Sărbătorile și vacanțele se ATAȘEAZă zilei, ca să se suprapună peste SDSL și
    // peste ture. Zilele libere generate (blank-cell) rămân complet goale — fără X,
    // fără L, fără culoare, fără etichetă de sărbătoare și fără creion de editare.
    const holHtml = (!explicitBlank && hols.length)
      ? `<div class="hols">${hols.map(h =>
          `<span class="hol-name hol-${h.cat}" title="${escapeHtml(h.name)}">` +
          `<span class="hol-tag">${holTag(h.cat)}</span>${escapeHtml(h.name)}</span>`
        ).join('')}</div>`
      : '';

    const editBtn = explicitBlank ? '' : `<span class="day-edit-btn" data-editday="${d}" title="Editează ziua ${d}">✎</span>`;
    html += `<div class="${cls}" data-d="${d}"${styleAttr}>${editBtn}<span class="dnum">${d}</span>${hoursBadge}<div class="badges">${badges}</div>${holHtml}</div>`;
  }
  monthGrid.innerHTML = html;
  monthGrid.querySelectorAll('.day:not(.empty)').forEach(el => {
    el.onclick = () => onDayClick(parseInt(el.dataset.d));
  });
  monthGrid.querySelectorAll('[data-editday]').forEach(el => {
    el.onclick = (e) => { e.stopPropagation(); openDayEditor(parseInt(el.dataset.editday)); };
  });
}

// Vizualizarea „Tot anul”: 12 mini-calenare, regenerate din starea curentă la
// fiecare schimbare. Fiecare zi arată codul turei, ca modificările să se vadă.
function renderYearCalendar() {
  const c = cal(), grid = document.getElementById('cal-year');
  const names = ['L','M','M','J','V','S','D'];
  const today = new Date();
  let html = '';
  for (let m = 0; m < 12; m++) {
    const dim = daysInMonth(c.year, m);
    const offset = (new Date(c.year, m, 1).getDay() + 6) % 7;
    let cells = names.map(n => `<div class="mini-dow">${n}</div>`).join('');
    for (let i = 0; i < offset; i++) cells += '<div class="mini-day empty"></div>';
    for (let d = 1; d <= dim; d++) {
      const k = key(c.year, m, d);
      const allTypes = (c.assignments[k] || []).map(id => typeById(c, id)).filter(Boolean);
      const types = allTypes.filter(t => !isBlankShift(t));
      const explicitBlank = (allTypes.length > 0 && types.length === 0) ||
        (!!(c.blankDays && c.blankDays[k]) && types.length === 0);
      const primary = types[0];
      const hols = visibleHolidays(c, c.year, m, d);
      const det = (c.dayDetails || {})[k];
      // Same look as the month view, only smaller: the shift's own colour class drives
      // the background, so CO/CM/COS and any custom category show their real colour.
      // Free days (L) get no class at all and look exactly like an untouched day.
      let cls = 'mini-day';
      if (explicitBlank) cls += ' blank-cell';
      if (primary) cls += ' has-shift ' + (primary.cls || 'custom-type');
      if (types.length > 1) cls += ' overlap split-overlap';
      if (new Date(c.year, m, d).getDay() === 0 || new Date(c.year, m, d).getDay() === 6) cls += ' weekend';
      // Aceeași regulă ca în vizualizarea lunară: ziua liberă rămâne complet goală.
      if (hols.some(h => h.cat === 'legal') && !explicitBlank) cls += ' legal-holiday';
      if (det && det.extra) cls += ' has-extra';
      if (today.getFullYear() === c.year && today.getMonth() === m && today.getDate() === d) cls += ' today';
      let st = '';
      if (types.length > 1) {
        const n = types.length;
        const stops = types.map((t, i) => `${typeColor(t)} ${(i*100/n).toFixed(2)}%, ${typeColor(t)} ${((i+1)*100/n).toFixed(2)}%`).join(', ');
        st = ` style="background:linear-gradient(135deg, ${stops})"`;
      } else if (primary && primary.bg) {
        st = ` style="background:${primary.bg};color:${primary.fg || '#1a1a1a'}"`;
      }
      const code = types.length > 1 ? types.map(t => t.code).join('+') : (primary ? primary.code : '');
      // Același număr de ore ca în vizualizarea lunară, sus-centru, inclusiv orele
      // trecute în ziua următoare de o tură de noapte. Zilele libere rămân goale.
      const miniH = effectiveDayHours(c, c.year, m, d);
      const miniHours = miniH > 0
        ? `<span class="mini-hours" title="Ore pontate: ${fmtHours(miniH)}h">${fmtHours(miniH)}h</span>` : '';
      const holTxt = (!explicitBlank && hols.length) ? ' · ' + hols.map(h => h.name).join(' + ') : '';
      const title = `${d} ${MONTHS_RO[m]}${types.length ? ' — ' + types.map(t => t.name).join(' + ') : ''}${holTxt}${det && det.hoursOverride != null ? ' · ' + det.hoursOverride + 'h' : ''}`;
      // Vacanța și sărbătoarea legală apar amândouă (un punct colorat pentru fiecare),
      // suprapuse peste culoarea turei; ziua liberă generată nu afișează nimic.
      const holDots = (!explicitBlank && hols.length)
        ? `<span class="hol-dots">${hols.slice(0, 3).map(h => `<span class="hol-dot hol-${h.cat}"></span>`).join('')}</span>` : '';
      cells += `<div class="${cls}"${st} data-ym="${m}" data-yd="${d}" title="${escapeHtml(title)}"><span class="mini-num">${d}</span>${miniHours}${code ? `<span class="mini-code">${escapeHtml(code)}</span>` : ''}${holDots}</div>`;
    }
    html += `<div class="mini-month"><div class="mini-title">${MONTHS_RO[m]}</div><div class="mini-grid">${cells}</div></div>`;
  }
  grid.innerHTML = html;
  grid.querySelectorAll('[data-yd]').forEach(el => el.onclick = () => {
    c.month = Number(el.dataset.ym);
    const d = Number(el.dataset.yd);
    saveState(); renderAll(); openDayEditor(d);
  });
  const hint = document.getElementById('year-hint');
  if (hint) hint.textContent = `Previzualizare actualizată pentru anul ${c.year}. Apasă o zi ca să o deschizi și să o editezi — modificările apar imediat aici.`;
}

function onDayClick(d) {
  // Detalii complete la apăsarea unei zile (denumiri complete, ore, ture, notițe,
  // opțiuni de editare) — module/day-details.js. Modul aplicare (paint) rămâne la click.
  if (!ui.paint) {
    openDayDetails(d);
    return;
  }
  const c = cal(), k = key(c.year, c.month, d);
  const ids = c.assignments[k] || [];
  // Toggle this category on the day; several categories may share a day (overlap).
  if (ids.includes(ui.selected)) {
    c.assignments[k] = ids.filter(x => x !== ui.selected);
  } else {
    c.assignments[k] = ids.concat([ui.selected]);
  }
  saveState(); renderAll();
}

// ---------- Wizard: activează un pas din bara de mai sus (index.html) ----------
// Pasul 1 = generatorul de program („Generează programul”), Pasul 2 = calendar,
// Pasul 3 = totaluri, SDSL și salariu. Acesta este fluxul logic al aplicației.
function activateWizard(step) {
  document.querySelectorAll('[data-wizard-step]').forEach(b => {
    b.classList.toggle('is-active', b.getAttribute('data-wizard-step') === String(step));
  });
}

// The "Tipul de tură" model is applied explicitly, starting on the chosen day.
function generatePattern() {
  const c = cal();
  // Regenerarea pornește de la o listă curată de zile libere, ca să nu rămână
  // marcaje de la un program anterior pe zilele care acum sunt ture.
  c.blankDays = {};
  // Uses the selected pattern, including shift types the person created herself.
  const seq = currentSequence(c);
  const start = Math.min(31, Math.max(1, Number(c.genStart) || 1));
  const targets = [];

  if (c.genScope === 'year') {
    for (let m = c.month; m <= 11; m++) {
      const dim = daysInMonth(c.year, m);
      for (let d = (m === c.month ? start : 1); d <= dim; d++) targets.push([c.year, m, d]);
    }
  } else if (c.genScope === 'range') {
    // Perioadă completă: zi + lună + an pentru ambele capete (poate trece peste luni/anuri).
    const a = c.rangeFrom || { d:1, m:c.month, y:c.year };
    const b = c.rangeTo || { d:daysInMonth(c.year, c.month), m:c.month, y:c.year };
    let cur = new Date(a.y, a.m, a.d), end = new Date(b.y, b.m, b.d);
    if (cur.getTime() > end.getTime()) { const tmp = cur; cur = end; end = tmp; }
    let guard = 0;
    while (cur.getTime() <= end.getTime() && guard++ < 5000) {
      targets.push([cur.getFullYear(), cur.getMonth(), cur.getDate()]);
      cur.setDate(cur.getDate() + 1);
    }
  } else {
    const dim = daysInMonth(c.year, c.month);
    for (let d = start; d <= dim; d++) targets.push([c.year, c.month, d]);
  }

  targets.forEach((t, i) => {
    const k = key(t[0], t[1], t[2]);
    const pt = seq[i % seq.length];
    const ptType = typeById(c, pt);
    // REGULA PERSOANEI: la generare se ating DOAR zilele în care se lucrează.    // O zi fără tură în model rămâne exact cum era înainte (fără X, fără L, fără
    // culoare, fără șters de sărbători). Îi înlăturăm doar o eventuală zi liberă
    // (L) lăsată de o generare anterioară, ca să nu rămână marcaje vechi.
    if (!ptType || isBlankShift(ptType)) {
      const old = c.assignments[k] || [];
      const kept = old.filter(id => {
        const ty = typeById(c, id);
        return String(id || '').toUpperCase() !== 'X' && ty && !isBlankShift(ty);
      });
      if (kept.length) c.assignments[k] = kept;
      else delete c.assignments[k];
      if (c.blankDays) delete c.blankDays[k];
      return;
    }
    // Concediile se păstrează întotdeauna; celelalte ture se păstrează când
    // setarea „păstrează turele existente” e activă (implicit, ca în original).
    const keep = (c.assignments[k] || []).filter(id => {
      const ty = typeById(c, id);
      if (String(id || '').toUpperCase() === 'X' || !ty || isBlankShift(ty)) return false;
      return ty.group === 'leave' || c.keepExisting !== false;
    });
    if (!keep.includes(pt)) keep.push(pt);
    c.assignments[k] = keep;
    if (c.blankDays) delete c.blankDays[k];
  });
  saveState(); renderAll();
  autoOpenMenus(['gen', 'cat', 'per']);
  // Mesajul fluxului: programul s-a generat → pasul 2 (verificarea calendarului).
  activateWizard(2);
}

// ---------- Compute ----------
// REGULA ZILEI (cerută de persoană): până la 23:59 e o zi calendaristică,
// de la 00:00 e următoarea. O tură de noapte (ex. 20:00 → 09:00 = 13h) se
// ÎMPARTE, deci: 4h rămân în ziua în care a fost bifată și 9h apar în ziua
// următoare. exact ca în panoul SDSL. Orele nu se pierd și nu se dublează.
//
// effectiveDayInfo păstrează sensul vechi (tura bifată în zi, fără împărțire)
// și e folosit doar de computing-ul SDSL, care își face propriul split.
// Pentru orice afișare de „ore pontate într-o zi” se folosește dayWorkMinutes.
// Când se suprapun mai multe ture în aceeași zi, orele NU se adună: se ia
// tura adăugată ultima. Editarea manuală a orelor zilei are întotdeauna prioritate.
function effectiveDayInfo(c, y, m, d) {
  const k = key(y, m, d);
  const det = (c.dayDetails || {})[k];
  const ids = c.assignments[k] || [];
  const leave = ids.some(id => { const t = typeById(c, id); return t && t.group === 'leave'; });
  // 1. Editare manuală explicită (hoursOverride) câștigă întotdeauna.
  if (det && det.hoursOverride != null && det.hoursOverride !== '') {
    return { hours: Math.max(0, Number(det.hoursOverride) || 0), leave, ids,
             source: { kind: 'override' } };
  }
  if (!ids.length) return { hours: 0, leave:false, ids, source:null };
  // 2. Tura adăugată ultima determină orele zilei (fără adunare).
  const lastId = ids[ids.length - 1];
  const last = typeById(c, lastId);
  return { hours: last ? Math.max(0, MECHANICS.shiftHours(last)) : 0, leave, ids,
           source: { kind: 'shift', id: lastId, name: last ? last.name : '', code: last ? last.code : '' } };
}
// Descompune orele reale ale unei ture pe zile calendaristice.
// Ex. Noapte 20:00→09:00 (13h) → { zi:240, ziuaUrmătoare:540 } minute.
// Pauza (timpul de repaus) se scade proporțional, ca în MECHANICS.shiftMinutes.
function shiftMinutesByDate(t, y, m, d) {
  const out = shiftMinutesByDateRaw(t, y, m, d);
  if (t && t.skipNonWorking) {
    Object.keys(out).forEach(k => {
      const p = k.split('-').map(Number);
      if (isSdslDate(new Date(p[0], p[1] - 1, p[2]))) delete out[k];
    });
  }
  return out;
}
function shiftMinutesByDateRaw(t, y, m, d) {
  const out = {};
  const add = (yy, mm, dd, min) => {
    if (min <= 0) return;
    const k = key(yy, mm, dd);
    out[k] = (out[k] || 0) + min;
  };
  const clock = t && t.clock;
  if (!clock || !clock.start || !clock.end || MECHANICS.compareTimes(clock.start, clock.end) === 3) {
    add(y, m, d, t ? Math.max(0, MECHANICS.shiftMinutes(t)) : 0);
    return out;
  }
  const parts = [{ start: clock.start, end: clock.end }];
  if (clock.split && clock.start2 && clock.end2) parts.push({ start: clock.start2, end: clock.end2 });
  let segs = parts.map(p => ({ start: timeToMinutes(p.start),
    minutes: Math.max(0, MECHANICS.partMinutes(p.start, p.end)) }));
  const raw = segs.reduce((s, x) => s + x.minutes, 0);
  const brk = Math.max(0, Number(t.breakMin) || 0);
  if (brk > 0 && raw > 0) {
    const f = Math.max(0, raw - brk) / raw;
    segs = segs.map(x => ({ start: x.start, minutes: x.minutes * f }));
  }
  segs.forEach(seg => {
    let sm = seg.start;
    const end = sm + seg.minutes;
    let cur = new Date(y, m, d), guard = 0;
    while (sm < end - 1e-6 && guard++ < 10) {
      const dayEnd = sm < 1440 ? 1440 : sm + 1440;
      const slice = Math.min(end, dayEnd) - sm;
      if (slice > 0) add(cur.getFullYear(), cur.getMonth(), cur.getDate(), slice);
      sm = dayEnd;
      if (sm >= end - 1e-6) break;
      cur = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 1);
    }
  });
  return out;
}
function hasManualHours(c, y, m, d) {
  const det = (c.dayDetails || {})[key(y, m, d)];
  return !!(det && det.hoursOverride != null && det.hoursOverride !== '');
}
// Orele care aparțin efectiv zilei calendaristice (y,m,d):
//   segmentul dinainte de 00:00 al turei bifate în zi
// + segmentul după 00:00 al turei bifate în ziua anterioară.
function dayWorkMinutes(c, y, m, d) {
  if (hasManualHours(c, y, m, d)) {
    const det = c.dayDetails[key(y, m, d)];
    return Math.max(0, Number(det.hoursOverride) || 0) * 60;
  }
  const ids = c.assignments[key(y, m, d)] || [];
  const hasLeave = ids.some(id => {
    const t = typeById(c, id);
    return t && t.group === 'leave';
  });
  // Ziua marcată cu concediu (CO / CM / COS) înlocuiește tura și se numără cu 8 h doar în zile lucrătoare.
  if (hasLeave) {
    // Concediu (CO / COS / CM): în zilele lucrătoare se ia în calcul cu orele turei de concediu (8 h);
    // în weekend și în sărbători legale nu se adaugă nimic.
    if (isSdslDate(new Date(y, m, d))) return 0;
    const lt = ids.map(id => typeById(c, id)).filter(t => t && t.group === 'leave').pop();
    return Math.max(0, (lt && Number(lt.hours) > 0) ? Number(lt.hours) : 8) * 60;
  }

  const prev = new Date(y, m, d - 1);
  const py = prev.getFullYear(), pm = prev.getMonth(), pd = prev.getDate();
  const prevIds = c.assignments[key(py, pm, pd)] || [];
  let minutes = 0;
  if (ids.length) {
    const t = typeById(c, ids[ids.length - 1]);
    if (t && !isBlankShift(t)) minutes += shiftMinutesByDate(t, y, m, d)[key(y, m, d)] || 0;
  }
  if (prevIds.length && !hasManualHours(c, py, pm, pd)) {
    const t = typeById(c, prevIds[prevIds.length - 1]);
    if (t && !isBlankShift(t)) minutes += shiftMinutesByDate(t, py, pm, pd)[key(y, m, d)] || 0;
  }
  return minutes;
}
function effectiveDayHours(c, y, m, d) { return round2(dayWorkMinutes(c, y, m, d) / 60); }

function computeMonth() {
  const c = cal();
  let worked = 0, dayExtra = 0;
  const days = daysInMonth(c.year, c.month);
  for (let d = 1; d <= days; d++) {
    const k = key(c.year, c.month, d);
    const det = (c.dayDetails || {})[k];
    if (det && det.extra) dayExtra += Number(det.extra) || 0;
    worked += effectiveDayHours(c, c.year, c.month, d);
  }
  return { worked, leave: 0, dayExtra, total: worked };
}

// Orele luate în considerare într-o zi — aceeași regulă ca pretutindeni.
function workedHoursOn(c, y, m, d) { return effectiveDayHours(c, y, m, d); }

// ---------- SDSL ----------
// SDSL = orele lucrate sâmbăta, duminica și în zilele libere legale (sărbători legale).
// REGULA ZILEI (cerută de persoană): până la 23:59 e o zi, de la 00:00 e o altă zi.
// Deci o tură care trece de miezul nopții se ÎMPARTE între două zile calendaristice:
//   • 20:00 → 09:00 (13h): 4h (20:00→24:00) în ziua de start, 9h (00:00→09:00) în ziua următoare.
//   • noaptea din 11 dec (vinerei) → 12 dec (sâmbătă): 4h în 11 + 9h în 12 → 9h SDSL.
//   • noaptea din 27 dec (duminică) → 28 dec (luni):    4h în 27 + 9h în 28 → 4h SDSL.
// Se ține cont de orele reale ale fiecărei ture (până la 24h) și de orele din SDSL.
function isSdslDate(dateObj) {
  const dow = dateObj.getDay();
  const hols = holidaysFor(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
  return dow === 0 || dow === 6 || hols.some(h => h.cat === 'legal');
}
function sdslKind(dateObj) {
  const hols = holidaysFor(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
  if (hols.some(h => h.cat === 'legal')) return 'legal';
  const dow = dateObj.getDay();
  return (dow === 0 || dow === 6) ? 'weekend' : '';
}
const SD_DAYS = ['Duminică','Luni','Marți','Miercuri','Joi','Vineri','Sâmbătă'];
function sdslDayLabel(y, m, d) {
  const date = new Date(y, m, d);
  return `${SD_DAYS[date.getDay()]} ${String(d).padStart(2, '0')}.${String(m + 1).padStart(2, '0')}`;
}
// O tură de noapte NU înseamnă SDSL prin ea însăși. SDSL înseamnă doar orele care
// cad efectiv sâmbăta, duminica sau într-o sărbătoare legală. Ca să putem arăta câte
// ore din SDSL vin din ture de noapte, marcăm fiecare segment de pontaj cu originea lui.
function isNightShiftType(t) {
  if (!t) return false;
  const code = String(t.code || t.id || '').toUpperCase();
  const name = String(t.name || '').toLowerCase();
  if (code === 'N' || code === 'NOAPTE') return true;
  if (/noapte|night|noche/.test(name)) return true;
  const clock = t.clock;
  if (clock && clock.start && clock.end && MECHANICS.compareTimes(clock.start, clock.end) === 2) {
    const h = parseInt(String(clock.start).slice(0, 2), 10) || 0;
    if (h >= 18) return true;
  }
  return false;
}

// O singură sursă de adevăr: descompunem fiecare zi în segmente de pontaj pe
// zile calendaristice. O zi are 24 de ore (00:00–23:59); orele după miezul nopții
// aparțin zilei următoare, chiar dacă tura a început în ziua anterioară.
// Rezultat: { days: [{y,m,d,minutes,kind,holidays,parts:[{t,hours,label}]}], total, ... }
function computeSDSLDetails(c, y, m) {
  const daysMap = {};
  const ensure = (yy, mm, dd) => {
    const k = `${yy}-${mm}-${dd}`;
    if (!daysMap[k]) daysMap[k] = { y:yy, m:mm, d:dd, minutes:0, parts:[],
      kind: sdslKind(new Date(yy, mm, dd)),
      holidays: holidaysFor(yy, mm, dd).map(h => h.name) };
    return daysMap[k];
  };
  const addWork = (yy, mm, dd, minutes, label, night) => {
    if (minutes <= 0) return;
    const rec = ensure(yy, mm, dd);
    rec.minutes = round2(rec.minutes + minutes);
    rec.parts.push({ label, hours: round2(minutes / 60), night: !!night });
  };
  const dim = daysInMonth(y, m);
  for (let d = 1; d <= dim; d++) {
    const kDay = key(y, m, d);
    const dayIds = c.assignments[kDay] || [];
    if (dayIds.some(id => { const ty = typeById(c, id); return ty && ty.group === 'leave'; })) {
      continue;
    }
    const info = effectiveDayInfo(c, y, m, d);
    if (info.hours <= 0) continue;
    const det = (c.dayDetails || {})[key(y, m, d)];
    const manual = det && det.hoursOverride != null && det.hoursOverride !== '';
    const ids = info.ids || [];
    let src = info.source && info.source.kind === 'shift' ? typeById(c, info.source.id) : null;
    if (!src) {
      for (let i = ids.length - 1; i >= 0; i--) {
        const t = typeById(c, ids[i]);
        if (t && t.clock && t.clock.start && t.clock.end) { src = t; break; }
      }
    }
    let label = info.source && info.source.name ? info.source.name : 'Tură';
    if (src) label = src.name || src.code || label;
    if (manual) label = 'Ore editate manual';
    const nightShift = isNightShiftType(src);
    const clock = src && src.clock;
    // Segmentele de pontaj; fiecare segment e o pereche start/end cu orele lui.
    let segments = [];
    if (clock && clock.start && clock.end && MECHANICS.compareTimes(clock.start, clock.end) !== 3) {
      const parts = [{ start:clock.start, end:clock.end }];
      if (clock.split && clock.start2 && clock.end2) parts.push({ start:clock.start2, end:clock.end2 });
      segments = parts.map(p => ({ start:p.start, minutes: Math.max(0, MECHANICS.partMinutes(p.start, p.end)) }));
      // Pauza (timpul de repaus) se scade din totalul turei, proporțional cu segmentele.
      const totalRaw = segments.reduce((s, x) => s + x.minutes, 0);
      const brk = Math.max(0, Number(src.breakMin) || 0);
      if (brk > 0 && totalRaw > 0) {
        const factor = Math.max(0, totalRaw - brk) / totalRaw;
        segments.forEach(x => { x.minutes = round2(x.minutes * factor); });
      }
      // Orele editate manual au prioritate: le folosim pe ele ca total.
      if (manual) {
        const totalNow = segments.reduce((s, x) => s + x.minutes, 0);
        if (totalNow > 0) segments.forEach(x => { x.minutes = round2(x.minutes * info.hours / totalNow); });
      }
    }
    if (!segments.length) {
      // Fără ore de pontare (doar ore fixe): toate orele rămân în ziua curentă.
      addWork(y, m, d, Math.round(info.hours * 60), label, nightShift);
      continue;
    }
    // Împarte fiecare segment la miezul nopții: [start..24:00] + [00:00..end].
    segments.forEach(seg => {
      let sm = timeToMinutes(seg.start);              // minute de la 00:00
      const endMin = sm + seg.minutes;
      let cy = y, cm = m, cd = d, guard = 0;
      while (sm < endMin - 1e-6 && guard++ < 10) {
        const dayEnd = sm < 1440 ? 1440 : sm + 1440;  // următorul 00:00
        const slice = Math.min(endMin, dayEnd) - sm;
        if (slice > 0) addWork(cy, cm, cd, slice, label + (sm >= 1440 ? ' (după 00:00)' : ''), nightShift);
        sm = dayEnd;
        if (sm >= endMin - 1e-6) break;
        const next = new Date(cy, cm, cd + 1);
        cy = next.getFullYear(); cm = next.getMonth(); cd = next.getDate();
      }
    });
  }
  const dayList = Object.values(daysMap).sort((a, b) =>
    a.y - b.y || a.m - b.m || a.d - b.d);
  const sum = pred => round2(dayList.filter(pred).reduce((s, x) => s + x.minutes / 60, 0));
  const total = sum(x => !!x.kind);
  const nightSum = pred => round2(dayList.filter(pred).reduce((s, x) =>
    s + x.parts.filter(p => p.night).reduce((a, p) => a + p.hours, 0), 0));
  return {
    days: dayList,
    total,
    weekend: sum(x => x.kind === 'weekend'),
    legal: sum(x => x.kind === 'legal'),
    // Doar orele din ture de noapte care CAD într-o zi SDSL (sunt deja în total).
    // O tură de noapte nu e SDSL prin ea însăși: orele ei din zile de lucru nu se numără.
    night: nightSum(x => !!x.kind),
    // Afișate separat, ca excluse explicit din SDSL.
    nightOutside: nightSum(x => !x.kind)
  };
}
function computeSDSL(c, y, m) { return computeSDSLDetails(c, y, m).total; }

// Rubrica „Câte ture libere ies din orele SDSL” se poate ascunde/arăta.
// Starea rămâne după reîncărcare; calculul și bifa „adaugă la orele plus”
// funcționează identic, indiferent că rubrica e deschisă sau închisă.
const SDSL_FREE_KEY = 'ore-ture-sdsl-free-open-v1';
function applySdslFreeCollapse() {
  const content = document.getElementById('sdsl-free-content');
  const btn = document.getElementById('sdsl-free-toggle');
  if (!content || !btn) return;
  let open = true;
  try { const v = localStorage.getItem(SDSL_FREE_KEY); if (v !== null) open = v === '1'; } catch (e) { /* storage blocat */ }
  content.style.display = open ? '' : 'none';
  btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  btn.classList.toggle('collapsed', !open);
  const caret = btn.querySelector('.caret');
  if (caret) caret.textContent = open ? '▾' : '▶';
}

// Panoul SDSL: arată orele fiecărei ture, cum se împart la miezul nopții și
// câte ture libere (Z de 14h / N de 13h) ies din orele SDSL.
function renderSDSL() {
  const c = cal();
  const det = computeSDSLDetails(c, c.year, c.month);
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('sdsl-stat', fmtHours(det.total));
  set('sdsl-total', fmtHours(det.total));
  set('sdsl-weekend', fmtHours(det.weekend));
  set('sdsl-legal', fmtHours(det.legal));
  set('sdsl-night', fmtHours(det.night));
  const tag = document.getElementById('sdsl-total-tag');
  if (tag) tag.textContent = `${MONTHS_RO[c.month]} ${c.year}`;
  // Regula explicată pe înțeles: tura de noapte nu e SDSL; SDSL e doar ziua pe care cade ora.
  const principle = document.getElementById('sdsl-principle');
  if (principle) principle.innerHTML =
    'SDSL înseamnă <b>doar</b> sâmbăta, duminica și zilele libere legale (ZL, conform Codului Muncii). O tură de noapte nu e SDSL prin ea însăși: ' +
    'din ea se numără numai orele care cad într-o zi SDSL (deja incluse în total). ' +
    (det.nightOutside > 0
      ? `<b>${fmtHours(det.nightOutside)}h</b> din ture de noapte au fost lucrate în zile de lucru și <b>nu</b> sunt SDSL.`
      : 'Nu există ore de noapte în zile de lucru.');

  // Detailul zilelor: fiecare zi arată tura, minutele împărțite și dacă e SDSL.
  const row = x => {
    const counted = !!x.kind;
    const kinds = x.holidays.length ? x.holidays.join(', ') : (x.kind === 'weekend' ? 'Sâmbătă / Duminică' : 'Zi lucrătoare');
    return `<div class="sdsl-row ${counted ? 'counted' : 'muted'}">
      <span class="sdsl-day">${sdslDayLabel(x.y, x.m, x.d)}</span>
      <span class="sdsl-shift">${escapeHtml(x.parts.map(p => p.label).join(' + ') || '—')}</span>
      <span class="sdsl-part">${escapeHtml(x.parts.map(p => fmtHours(p.hours) + 'h').join(' + '))}</span>
      <span class="sdsl-hours">${fmtHours(x.minutes / 60)}h${counted ? ' ★' : ''}</span>
      <span class="sdsl-kind ${x.kind}">${counted ? 'SDSL · ' : ''}${escapeHtml(kinds)}</span>
    </div>`;
  };
  const bd = document.getElementById('sdsl-breakdown');
  if (bd) bd.innerHTML = det.days.length
    ? det.days.map(row).join('')
    : '<div class="sdsl-row muted">Nu există ore pontate în această lună.</div>';

  // Toate combinațiile de ture libere din orele SDSL (zi 14h / noapte 13h).
  const dayH = Number(c.dayHours) || 14, nightH = Number(c.nightHours) || 13;
  const combos = [];
  const minShift = Math.min(dayH, nightH) || 13;
  if (det.total >= minShift) {
    for (let z = 0; z <= Math.floor(det.total / dayH); z++) {
      for (let n = 0; n <= Math.floor((det.total - z * dayH) / nightH); n++) {
        const used = round2(z * dayH + n * nightH), left = round2(det.total - used);
        if (left + 1e-9 >= minShift) continue;
        if (z === 0 && n === 0) continue;
        combos.push({ z, n, left });
      }
    }
  }
  combos.sort((a, b) => (b.z + b.n) - (a.z + a.n) || b.z - a.z || a.left - b.left);
  const sw = (n, one, many) => n ? `${n} ${n === 1 ? one : many}` : '';
  const txt = document.getElementById('sdsl-free-text');
  if (txt) {
    if (!combos.length) {
      txt.textContent = det.total > 0
        ? `${fmtHours(det.total)}h SDSL — nu ajung pentru o tură completă (${fmtHours(minShift)}h).`
        : 'Nu rezultă ore SDSL în această lună.';
    } else {
      const best = combos[0];
      txt.textContent = `${fmtHours(det.total)}h SDSL ⇒ ${sw(best.z, 'tură zi', 'ture zi')}${best.z && best.n ? ' + ' : ''}${sw(best.n, 'tură noapte', 'ture noapte')}` +
        (best.left ? ` + ${fmtHours(best.left)}h suplimentare` : '') + ' (varianta cu cele mai multe ture).';
    }
  }
  const vwrap = document.getElementById('sdsl-variants');
  if (vwrap) vwrap.innerHTML = combos.map(v =>
    `<span class="vrow">${sw(v.z, 'zi', 'zile')}${v.z && v.n ? ' + ' : ''}${sw(v.n, 'noapte', 'nopți')}${v.left ? ' + ' + fmtHours(v.left) + 'h' : ''}</span>`
  ).join('');
  const inc = document.getElementById('sdsl-include');
  if (inc) inc.checked = !!c.sdslInclude;
  markSdslSynced();
}

// ---------- Free-shift calculation (all possibilities) ----------
// Regulile persoanei (mesajul de azi):
//   Total ore plus = (ore pontate luna asta − norma lunii) + Ore rămase din luna trecută
//   Ture Z/N (libere) = ore pontate luna asta − norma lunii   (baza lunii curente)
//   Recuperari = Ore rămase din luna trecută + ce ore rămân din bază după tura liberă aleasă (Z=14h / N=13h)
// Variantele se enumeră din TOTALUL orelor plus (ex. 48h), nu doar din baza lunii, ca să iasă
// toate combinațiile de ture zi/noapte din exemplu: 3zi+6, 2zi+1noapte+7, 1zi+2noapte+8, 3noapte+9.
// NU mai filtrăm doar varianta cu numărul maxim de ture: pentru 52h, de pildă, ies patru
// variante (4 nopți; 3 zile; 2 zile + 1 noapte; 1 zi + 2 nopți), nu doar una singură.
function enumerateVariants(total, dayH, nightH) {
  const minShift = Math.min(dayH, nightH) || 13;
  if (total < minShift) return [{ z:0, n:0, used:0, leftover:round2(total) }];
  const rows = [];
  for (let z = 0; z <= Math.floor(total / dayH); z++) {
    for (let n = 0; n <= Math.floor((total - z * dayH) / nightH); n++) {
      const used = z * dayH + n * nightH;
      const leftover = round2(total - used);
      // O variantă e completă când nu mai încape încă o tură în orele rămase.
      // Altfel combinația e incompletă (ai putea adăuga o tură), deci nu o afișăm.
      if (leftover + 1e-9 >= minShift) continue;
      if (z === 0 && n === 0) continue;
      rows.push({ z, n, used, leftover });
    }
  }
  if (!rows.length) return [{ z:0, n:0, used:0, leftover:round2(total) }];
  // Cea mai multe ture libere primește steaua; apoi preferăm turele de zi.
  return rows.sort((a, b) =>
    (b.z + b.n) - (a.z + a.n) || b.z - a.z || a.leftover - b.leftover);
}

// Împarte o variantă în ture libere (plătite din baza lunii curente) și ture de
// recuperare (plătite din orele rămase luna trecută + restul din bază).
function splitVariant(row, baza, prev, dayH, nightH, freeChoice) {
  const seq = [];
  for (let i = 0; i < row.z; i++) seq.push('Z');
  for (let i = 0; i < row.n; i++) seq.push('N');
  if (freeChoice === 'N') seq.sort((a, b) => (a === 'N' ? -1 : 1) - (b === 'N' ? -1 : 1));
  let rem = Math.max(0, baza), freeHours = 0, freeZ = 0, freeN = 0, recZ = 0, recN = 0;
  seq.forEach(t => {
    const h = t === 'Z' ? dayH : nightH;
    if (rem + 1e-9 >= h) {
      rem = round2(rem - h); freeHours += h;
      if (t === 'Z') freeZ++; else freeN++;
    } else if (t === 'Z') recZ++; else recN++;
  });
  const freeCount = freeZ + freeN, recCount = recZ + recN;
  // Fondul de recuperare = TOTALUL orelor plus − orele consumate de turele libere.
  // Include și eventualul deficit din baza lunii (-X ore), altfel s-ar pierduse.
  const recPool = round2(baza + prev - freeHours);
  const recHours = recZ * dayH + recN * nightH;
  const reportNext = round2(recPool - recHours); // ore raportate luna viitoare
  return { freeZ, freeN, recZ, recN, freeCount, recCount, rem, recPool, recHours, reportNext };
}

function renderCalc() {
  const c = cal();
  const m = computeMonth();
  const norma = getNorma(c.year, c.month);
  const dayH = Number(c.dayHours) || 14;
  const nightH = Number(c.nightHours) || 13;
  const sdslHours = c.sdslInclude ? computeSDSL(c, c.year, c.month) : 0;
  const baza = round2(m.total + m.dayExtra + sdslHours - norma);   // strict luna afișată, fără report
  const monthOnlyDelta = round2(m.total + m.dayExtra - norma);   // modificările directe din calendar față de normă
  const prev = carryIn(c, c.year, c.month);             // din luna anterioară (folosit doar la calculul turelor libere)
  const total = round2(baza + prev);                    // Total ore plus (pentru ture libere / report)
  syncOvertimeLaws(total);
  ui.lastPlan = null; ui.lastRows = null;
  const rec = carryRec(c, c.year, c.month);

  document.getElementById('ore-lucrate').textContent = fmtHours(m.total);
  document.getElementById('norma').textContent = fmtHours(norma);
  const ex = document.getElementById('ore-extra');
  ex.textContent = (monthOnlyDelta >= 0 ? '+' : '') + fmtHours(monthOnlyDelta);
  ex.style.color = monthOnlyDelta >= 0 ? '#1D9E75' : '#e53e3e';

  const prevField = document.getElementById('extra-prev');
  if (prevField && document.activeElement !== prevField) prevField.value = prev;
  const prevMode = document.getElementById('prev-mode');
  if (prevMode) prevMode.textContent = ((c.prevOverride || {})[monthKey(c.year, c.month)] != null) ? '✎ editat manual' : '↻ automat din luna trecută';
  document.getElementById('day-hours').value = c.dayHours;
  document.getElementById('night-hours').value = c.nightHours;
  const nextField = document.getElementById('extra-next');
  nextField.value = rec.v;
  const recBadge = document.getElementById('carry-mode');
  if (recBadge) recBadge.textContent = rec.manual ? '✎ editat manual' : '↻ actualizat automat';

  const summary = document.getElementById('calc-summary');
  const poss = document.getElementById('calc-possibilities');
  const legendEl = document.getElementById('calc-legend');
  if (legendEl) legendEl.innerHTML =
    '<p class="calc-legend-text"><b>Legenda:</b> pentru 14 ore/zi și 13 ore/noapte variantele arată de forma „X ture zi + Y ture noapte + Z ore supl”. „Liber” = ture plătite din baza lunii (pontate − normă); „recuperare” = ore plătite de orele rămase (luna trecută + restul bazei); orele supl rămase intră în „Ore suplimentare pentru luna viitoare”.</p>';
  const formula =
    `<div class="line"><span>Ore pontate + extra zile${sdslHours ? ' + SDSL' : ''} − normă</span><span>${m.total} + ${m.dayExtra}${sdslHours ? ' + ' + sdslHours : ''} − ${norma} = ${baza}</span></div>` +
    `<div class="line"><span>+ Ore rămase din luna trecută</span><span>${prev}</span></div>` +
    `<div class="line big"><span>Total ore plus</span><span>${total}</span></div>`;

  if (total <= 0) {
    summary.innerHTML = formula +
      `<div class="line neg"><span>Rezultat</span><span>${total} ore (sub normă / datorie)</span></div>`;
    poss.innerHTML = '<div class="possibility">Nu rezultă ore plus, deci nu ies ture libere. Orele (sau datoria) se reportează în luna viitoare.</div>';
    if (!rec.manual) { rec.v = total; saveState(); }
    nextField.value = rec.v;
    return;
  }

  const rows = enumerateVariants(total, dayH, nightH);
  const splits = rows.map(r => splitVariant(r, baza, prev, dayH, nightH, ui.selectedFree));
  const maxFree = Math.max(...splits.map(s => s.freeCount));
  const best = splits.findIndex(s => s.freeCount === maxFree);

  summary.innerHTML = formula +
    `<div class="line"><span>Bază pentru ture libere (pontate − normă)</span><span>${Math.max(0, baza)}</span></div>` +
    `<div class="line"><span>Ore din luna trecută (recuperare)</span><span>${prev}</span></div>` +
    (Number(c.incomePerHour) > 0
      ? `<div class="line"><span>Venit estimat (${escapeHtml(c.currency || '€')}${c.incomePerHour}/h)</span><span>${escapeHtml(c.currency || '€')}${Math.round(Math.max(0, total / 2) * Number(c.incomePerHour) * 100) / 100}</span></div>`
      : '');

  // Varianta aleasă se ține minte pe lună (după structura ei), ca să nu se piardă la o reîncărcare sau sincronizare.
  const vSig = r => r.z + '-' + r.n;
  const chosenSig = (c.chosenVariant || {})[monthKey(c.year, c.month)];
  const chosenIdx = chosenSig ? rows.findIndex(r => vSig(r) === chosenSig) : -1;
  const selected = ui.selectedPoss != null ? Number(ui.selectedPoss) : (chosenIdx >= 0 ? chosenIdx : (rec.manual ? null : (best < 0 ? 0 : best)));
  ui.lastRows = rows.map((r, i) => ({ r, s: splits[i], best: i === best, selected: selected === i }));
  ui.pickVariant = (i) => {
    const s2 = splits[i]; if (!s2) return;
    ui.selectedPoss = Number(i);
    c.chosenVariant = c.chosenVariant || {}; c.chosenVariant[monthKey(c.year, c.month)] = vSig(rows[i]);
    if (!rec.pinned) { rec.v = round2(s2.reportNext); rec.manual = false; }   // orele reținute nu se suprascriu
    saveState(); renderAll();
  };
  ui.lastPlan = (selected != null && selected >= 0 && splits[selected]) ? Object.assign({ total, baza, prev }, splits[selected]) : null;
  const sw = (n, one, many) => n ? `${n} ${n === 1 ? one : many}` : '';

  poss.innerHTML = rows.map((r, i) => {
    const s = splits[i];
    const isSel = selected === i;
    const rawDesc = [sw(r.z, 'tură zi', 'ture zi'), sw(r.n, 'tură noapte', 'ture noapte'), r.leftover ? `${r.leftover} ore suplimentare` : ''].filter(Boolean).join(' + ');
    // Fiecare descriptor spune doar numărul de ture; cuvântul „liber"/„recuperare"
    // se adaugă o singură dată în rândul de mai jos, ca să nu se repete (ex. „0 ture recuperare recuperare").
    const freeDesc = [sw(s.freeZ, 'tură zi', 'ture zi'), sw(s.freeN, 'tură noapte', 'ture noapte')].filter(Boolean).join(' + ') || '0 ture';
    const recDesc = [sw(s.recZ, 'tură zi', 'ture zi'), sw(s.recN, 'tură noapte', 'ture noapte')].filter(Boolean).join(' + ') || '0 ture';
    const basePart = baza >= 0 ? `+ ${s.rem}h (rămase din bază)` : `− ${round2(-baza)}h (deficit lunar)`;
    const explain = `<div class="rec-line">Ture libere din baza lunii (${Math.max(0, baza)}h): ${freeDesc} → rămân <b>${s.rem}h</b>. ` +
      `Recuperare = ${prev}h (luna trecută) ${basePart} = <b>${s.recPool}h</b> → ${recDesc} (${s.recHours}h) → <b>${s.reportNext}h</b> luna viitoare.</div>`;
    return `<div class="possibility ${i === best ? 'best' : ''} ${isSel ? 'selected' : ''}" data-i="${i}" data-leftover="${s.reportNext}">
      <span class="poss-check" aria-hidden="true">${isSel ? '✓' : ''}</span>
      <div class="poss-body">
        <div class="ptitle">${i === best ? '★ Varianta cu cele mai multe ture libere' : 'Variantă alternativă'}</div>
        <div class="pdesc">${rawDesc} → <strong>${freeDesc} liber + ${recDesc} recuperare</strong> + ${s.reportNext} ore suplimentare</div>
        ${explain}
        <div class="chips">
          ${r.z ? `<span class="chip zi">${r.z} zi</span>` : ''}
          ${r.n ? `<span class="chip noapte">${r.n} noapte</span>` : ''}
          <span class="chip extra">${s.reportNext}h → luna viitoare</span>
        </div>
      </div>
    </div>`;
  }).join('') + '<p class="hint">Apasă o variantă ca să o selectezi (✓). Orele ei rămase se pun automat în „Ore suplimentare pentru luna viitoare” și devin „rămase din luna trecută” în luna următoare.</p>';

  poss.querySelectorAll('.possibility').forEach(el => {
    el.style.cursor = 'pointer';
    el.onclick = () => ui.pickVariant(Number(el.dataset.i));
  });

  if (!rec.manual && selected >= 0 && splits[selected] && rec.v !== splits[selected].reportNext) {
    rec.v = splits[selected].reportNext; saveState(); nextField.value = rec.v;
  }
}

// ---------- Rendering: legend (follows the configured shifts) ----------
const LEG_CLS = { zi:'leg-zi', noapte:'leg-noapte', liber:'leg-liber', rec:'leg-rec',
  preg:'leg-preg', cont:'leg-cont', psih:'leg-psih', co:'leg-co', cm:'leg-cm', cos:'leg-cos', ort:'leg-ort' };

function renderLegend() {
  const c = cal();
  const items = [...c.types, ...LEAVE_TYPES];
  let html = items.map(t => {
    const lc = LEG_CLS[t.cls] || 'leg-liber';
    const st = t.bg ? ` style="background:${t.bg};border-color:${t.bg}"` : '';
    return `<div class="leg-item"><span class="dot ${lc}"${st}></span>${escapeHtml(t.name)}</div>`;
  }).join('');
  html += HOLIDAY_CATEGORIES.map(cat =>
    `<div class="leg-item"><span class="hol-${cat.id}">■</span> ${escapeHtml(cat.name)}</div>`).join('');
  html += '<div class="leg-item"><span class="zl">ZL</span> = Zi liberă legală (SDSL)</div>'
        + '<div class="leg-item">Zilele cu mai multe ture se împart în culorile turelor</div>';
  document.getElementById('legend').innerHTML = html;
}

// ---------- Generation controls ----------
function renderGenControls() {
  const c = cal();
  document.getElementById('gen-scope').value = c.genScope;
  document.getElementById('gen-start').value = c.genStart;
  [['From', 'from'], ['To', 'to']].forEach(([prop, pfx]) => {
    const r = c['range' + prop] || {};
    const dd = document.getElementById('gen-' + pfx + '-d');
    const mm = document.getElementById('gen-' + pfx + '-m');
    const yy = document.getElementById('gen-' + pfx + '-y');
    if (dd) dd.value = r.d != null ? r.d : 1;
    if (mm) mm.value = r.m != null ? r.m : c.month;
    if (yy) yy.value = r.y || c.year;
  });
  document.getElementById('gen-range-row').style.display = c.genScope === 'range' ? 'block' : 'none';
}

// ---------- Shift types the person can create / edit / delete ----------
function renderTypeOptions() {
  const sel = document.getElementById('tura-type');
  if (!sel) return;
  const old = document.getElementById('custom-types-group');
  if (old) old.remove();
  const c = cal();
  const custom = c.patternTypes || [];
  if (custom.length) {
    const g = document.createElement('optgroup');
    g.id = 'custom-types-group';
    g.label = 'Tipurile mele de tură';
    custom.forEach(pt => {
      const o = document.createElement('option');
      o.value = pt.id;
      o.textContent = `${pt.name} (${pt.zile.join('-')})`;
      g.appendChild(o);
    });
    sel.appendChild(g);
  }
  const value = patternById(c, c.pattern) ? c.pattern : (custom[0] ? custom[0].id : 'custom');
  sel.value = value;
  if (c.pattern !== value) { c.pattern = value; saveState(); }
  document.getElementById('custom-panel').style.display = value === 'custom' ? 'block' : 'none';
}

function generateShiftType() {
  const name = (document.getElementById('pt-name').value || '').trim();
  const zile = parseSequence(document.getElementById('pt-seq').value);
  const status = document.getElementById('pt-status');
  if (!name) { if (status) status.textContent = 'Scrie mai întâi denumirea tipului de tură.'; return; }
  if (!zile.length) { if (status) status.textContent = 'Scrie secvența, de exemplu: Z N L L.'; return; }
  const c = cal();
  c.patternTypes = c.patternTypes || [];
  const pt = { id:'pt_' + Date.now().toString(36), name, zile };
  c.patternTypes.push(pt);
  c.pattern = pt.id;
  document.getElementById('pt-name').value = '';
  document.getElementById('pt-seq').value = '';
  saveState(); renderAll();
  autoOpenMenus(['tip']);
  // Keep the maker visible so the person sees the confirmation and can add another type.
  const panel = document.getElementById('custom-panel');
  if (panel) panel.style.display = 'block';
  if (status) status.textContent = `✓ Tipul „${name}" a fost creat și selectat. Apasă „▶ Generează programul” ca să-l aplici pe zile.`;
}

function renderPatternList() {
  const wrap = document.getElementById('pattern-list');
  if (!wrap) return;
  const c = cal();
  const pats = allPatterns(c);
  wrap.innerHTML = pats.map((p, i) => `
    <div class="pattern-row" data-patrow="${i}" data-id="${escapeHtml(p.id)}">
      <input class="pat-name" data-i="${i}" value="${escapeHtml(p.name)}" maxlength="30" title="Denumirea tipului de tură" />
      <input class="pat-seq" data-i="${i}" value="${escapeHtml(p.zile.join(' '))}" placeholder="Z N L L" maxlength="80" title="Secvența de zile" />
      <button class="mini-btn" data-savepat="${i}" title="Salvează modificările">✓</button>
      ${p.builtin
        ? `<button class="mini-btn ghost" data-duppat="${i}" title="Duplică și editează">⧉</button>`
        : `<button class="mini-btn danger" data-delpat="${i}" title="Șterge tipul">🗑</button>`}
    </div>`).join('');
  wrap.querySelectorAll('[data-savepat]').forEach(b => b.onclick = () => savePattern(Number(b.dataset.savepat)));
  wrap.querySelectorAll('[data-duppat]').forEach(b => b.onclick = () => duplicatePattern(Number(b.dataset.duppat)));
  wrap.querySelectorAll('[data-delpat]').forEach(b => b.onclick = () => deletePattern(Number(b.dataset.delpat)));
}
function savePattern(i) {
  const c = cal(), p = allPatterns(c)[i];
  if (!p) return;
  const row = document.querySelector(`.pattern-row[data-patrow="${i}"]`);
  const name = row ? (row.querySelector('.pat-name').value || '').trim() : p.name;
  const zile = row ? parseSequence(row.querySelector('.pat-seq').value) : p.zile;
  if (!name || !zile.length) { uiAlert('Scrie denumirea și secvența (ex: Z N L L).'); return; }
  if (p.builtin) { duplicatePattern(i, name, zile); return; }
  const stored = c.patternTypes.find(x => x.id === p.id);
  if (stored) { stored.name = name; stored.zile = zile; }
  saveState(); renderAll();
}
function duplicatePattern(i, nameOverride, seqOverride) {
  const c = cal(), p = allPatterns(c)[i];
  if (!p) return;
  const row = document.querySelector(`.pattern-row[data-patrow="${i}"]`);
  const name = nameOverride || ((row && row.querySelector('.pat-name').value.trim()) || p.name + ' (copie)');
  const zile = seqOverride || (row ? parseSequence(row.querySelector('.pat-seq').value) : p.zile);
  c.patternTypes = c.patternTypes || [];
  const pt = { id:'pt_' + Date.now().toString(36), name, zile: zile.length ? zile : p.zile };
  c.patternTypes.push(pt); c.pattern = pt.id;
  saveState(); renderAll();
}
async function deletePattern(i) {
  const c = cal(), p = allPatterns(c)[i];
  if (!p || p.builtin) return;
  if (!(await uiConfirm(`Ștergi tipul de tură „${p.name}”?`, 'Șterge'))) return;
  c.patternTypes = c.patternTypes.filter(x => x.id !== p.id);
  if (c.pattern === p.id) c.pattern = 'custom';
  saveState(); renderAll();
}
function addBlankPattern() {
  const c = cal();
  c.patternTypes = c.patternTypes || [];
  const pt = { id:'pt_' + Date.now().toString(36), name:'Tip nou de tură', zile:['Z','N','L','L'] };
  c.patternTypes.push(pt); c.pattern = pt.id;
  saveState(); renderAll();
}

// ---------- Settings panel ----------
function openSettings() {
  const m = document.getElementById('settings-modal');
  if (!m) return;
  m.style.display = 'flex';
  renderPatternList();
  renderCategoryPanel();
  renderFilterButtons();
  const c = cal();
  document.getElementById('keep-existing').checked = c.keepExisting !== false;
  document.getElementById('set-currency').value = c.currency || '€';
  document.getElementById('set-theme-light').classList.toggle('active-mode', (state.theme || 'light') !== 'dark');
  document.getElementById('set-theme-dark').classList.toggle('active-mode', state.theme === 'dark');
  // Setări scrise pentru Pontaj Ture.
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
  const chk = (id, v) => { const el = document.getElementById(id); if (el) el.checked = v; };
  set('set-language', c.language || 'ro');
  set('set-income', c.incomePerHour || 0);
  set('set-badge-font', c.badgeFont || 10);
  set('set-tipo-horas', String(c.tipoHoras || '0'));
  chk('set-auto-calc', c.autoCalc !== false);
  set('set-default-break', c.defaultBreak || 0);
  set('set-note-bg', c.noteBg || '#ffffff');
  set('set-note-text', c.noteText || '#1a1a1a');
  set('set-note-opacity', c.noteOpacity == null ? 100 : c.noteOpacity);
  const opVal = document.getElementById('note-opacity-val');
  if (opVal) opVal.textContent = (c.noteOpacity == null ? 100 : c.noteOpacity) + '%';
}
function closeSettings() {
  const m = document.getElementById('settings-modal');
  if (m) m.style.display = 'none';
}
function setTheme(theme) {
  state.theme = theme; applyTheme(theme); saveState();
  const l = document.getElementById('set-theme-light'), d = document.getElementById('set-theme-dark');
  if (l) l.classList.toggle('active-mode', theme !== 'dark');
  if (d) d.classList.toggle('active-mode', theme === 'dark');
}

// ---------- Sincronizare automată calendar -> panou SDSL ----------
// Panoul SDSL (total, weekend, sărbători legale, ture de noapte) e o imagine a
// calendarului activ. Îl recalculăm la fiecare schimbare de stare, inclusiv când
// calendarul e editat în altă filă/fereastră sau când revii pe pagină. Așa cifrele
// nu pot rămâne „neschimbate” față de ce vezi în calendar.
function rememberStateSignature() {
  try { liveStateSig = localStorage.getItem(STORAGE_KEY) || ''; } catch (e) { liveStateSig = null; }
}
function syncFromStorage() {
  let raw = null;
  try { raw = localStorage.getItem(STORAGE_KEY); } catch (e) { return; }
  if (raw === liveStateSig) return;            // nimic nou, nu atingem ecranul
  const next = loadState();
  if (!next || !Array.isArray(next.calendars) || !next.calendars.length) return;
  state = next;
  liveStateSig = raw;
  ui.selectedPoss = null; ui.selectedFree = null;
  renderAll();
}
function bindLiveSync() {
  rememberStateSignature();
  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('storage', e => {
      if (!e.key || e.key === STORAGE_KEY || e.key === HOLIDAY_CACHE_KEY) syncFromStorage();
    });
    window.addEventListener('focus', syncFromStorage);
    if (typeof document !== 'undefined' && document.addEventListener) {
      document.addEventListener('visibilitychange', () => { if (!document.hidden) syncFromStorage(); });
    }
  }
}
function markSdslSynced() {
  const el = document.getElementById('sdsl-sync');
  if (!el) return;
  const d = new Date();
  el.textContent = `✓ sincronizat automat ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
}

// ---------- Master render ----------
function renderAll() {
  renderCalendarSelect();
  renderPalettes();
  renderCalendar();
  renderLegend();
  renderSDSL();
  renderCalc();
  renderSalary();
  renderFilterButtons();
  renderGenControls();
  renderTypeOptions();
  renderPatternList();
}

function renderFilterButtons() {
  const c = cal();
  ['holiday-filters', 'holiday-filters-main'].forEach(id => {
    const wrap = document.getElementById(id);
    if (!wrap) return;
    wrap.innerHTML = HOLIDAY_CATEGORIES.map(cat =>
      `<button class="filter-btn ${c.filters[cat.id] !== false ? 'active-' + cat.id : ''}" data-type="${cat.id}">✦ ${escapeHtml(cat.name)}</button>`
    ).join('');
    wrap.querySelectorAll('.filter-btn').forEach(b => b.onclick = () => {
      const c2 = cal();
      c2.filters[b.dataset.type] = c2.filters[b.dataset.type] === false;
      // SDSL depinde direct de zilele considerate libere legale: recalculăm mereu
      // panoul când se schimbă filtrele, ca cifrele să nu rămână vechi.
      saveState(); renderFilterButtons(); renderCalendar(); renderSDSL();
    });
  });
  const statusText = c.holidaysUpdated
    ? `Sursă: ${HOLIDAYS_DATA.source} · date din ${c.holidaysUpdated}. Apasă „Actualizare” pentru a reîncărca.`
    : null;
  ['holiday-status', 'holiday-status-main'].forEach(id => {
    const el = document.getElementById(id);
    if (el && statusText) el.textContent = statusText;
  });
}

// ---------- Sincronizare live cu zilelibere.com ----------
const HOLIDAY_MONTHS = { ianuarie:0, februarie:1, martie:2, aprilie:3, mai:4, iunie:5,
  iulie:6, august:7, septembrie:8, octombrie:9, noiembrie:10, decembrie:11 };
function holidayCategory(color, name) {
  const s = String(color || '').toLowerCase(), n = String(name || '').toLowerCase();
  if (/ff0000|#f00|rgb\(255,\s*0,\s*0\)/.test(s)) return 'legal';
  if (/66ffff/.test(s)) return 'religios';
  if (/ffcc00/.test(s)) return 'punte';
  if (/00cc99|d4edda/.test(s) || /vacan/.test(n)) return 'vacanta';
  if (/punte|concediu/i.test(n)) return 'punte';
  // O celulă cu o culoare necunoscută NU e automat zi liberă legală;
  // clasificatorul de mai sus decide după dată și nume, niciodată după fallback.
  return 'religios';
}
// Citește fie HTML-ul paginii de pe zilelibere.com, fie textul returnat de un proxy.
function parseHolidays(raw) {
  const days = {}, ranges = [], today = new Date().toLocaleDateString('ro-RO');
  const add = (y, m, d, name, cat) => {
    if (!name || !y || m == null || !d || d < 1 || d > 31) return;
    const k = `${y}-${m + 1}-${d}`;
    if (!days[k]) days[k] = [];
    if (!days[k].some(x => x.name === name && x.cat === cat)) days[k].push({ name, cat });
  };
  if (/<table/i.test(raw) && typeof DOMParser !== 'undefined') {
    const doc = new DOMParser().parseFromString(raw, 'text/html');
    doc.querySelectorAll('table[aria-label]').forEach(t => {
      const label = t.getAttribute('aria-label') || '';
      if (/idei pentru minivacan/i.test(label)) return; // tabelul cu sugestii, nu zilele reale
      const mm = label.match(/(ianuarie|februarie|martie|aprilie|mai|iunie|iulie|august|septembrie|octombrie|noiembrie|decembrie)\s+(\d{4})/i);
      if (!mm) return;
      const m = HOLIDAY_MONTHS[mm[1].toLowerCase()], y = Number(mm[2]);
      t.querySelectorAll('td[title]').forEach(td => {
        const d = parseInt(String(td.textContent).trim(), 10);
        const name = String(td.getAttribute('title') || '').trim();
        const style = td.getAttribute('style') || '';
        const bg = td.getAttribute('bgcolor') || (style.match(/background-color:\s*([^;]+)/i) || [])[1] || '';
        add(y, m, d, name, holidayCategory(bg, name));
      });
    });
  } else {
    // Text/markdown: „1 ianuarie — Anul Nou”, „10 - 13 aprilie — Paște ortodox”…
    const lines = String(raw).split(/\n/);
    lines.forEach(line => {
      if (!/\s[—–]\s/.test(line)) return; // ignoră titlurile și liniile de tabel
      const m = line.match(/(\d{1,2})\s*(?:ianuarie|februarie|martie|aprilie|mai|iunie|iulie|august|septembrie|octombrie|noiembrie|decembrie)/i);
      if (!m) return;
      const monthName = (line.match(/ianuarie|februarie|martie|aprilie|mai|iunie|iulie|august|septembrie|octombrie|noiembrie|decembrie/i) || [])[0];
      const mi = HOLIDAY_MONTHS[String(monthName).toLowerCase()];
      const ym = String(raw).match(/\b(20\d{2})\b/);
      const y = ym ? Number(ym[1]) : new Date().getFullYear();
      const parts = line.split(/\s+[—–]\s+/);
      const name = parts.length > 1 ? parts[1].replace(/\s{2,}/g,' ').trim().slice(0,60) : '';
      if (name.length < 3 || /https?:|source:|published|title:/i.test(name)) return;
      const range = line.match(/(\d{1,2})\s*[-–]\s*(\d{1,2})/);
      if (range && name) ranges.push({ from:`${y}-${mi + 1}-${Number(range[1])}`,
        to:`${y}-${mi + 1}-${Number(range[2])}`, name, cat:'vacanta' });
      else add(y, mi, Number(m[1]), name, 'legal');
    });
  }
  return { source:'zilelibere.com (sincronizat live)', updated:today, days, ranges };
}
// Fiecare cerere are propriul timeout: pe telefon o rețea lentă nu trebuie să
// blocheze niciodată calendarul. AbortController oprește cererea după 4,5 secunde.
const HOLIDAY_FETCH_TIMEOUT_MS = 4500;
function fetchWithTimeout(url, options) {
  const controller = (typeof AbortController !== 'undefined') ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), HOLIDAY_FETCH_TIMEOUT_MS) : null;
  const opts = Object.assign({ cache:'no-store' }, options || {});
  if (controller) opts.signal = controller.signal;
  return fetch(url, opts).finally(() => { if (timer) clearTimeout(timer); });
}
// Vacanțele școlare și punțile vin în continuare de pe zilelibere.com, prin
// proxy-urile care ocolesc blocajul CORS. AllOrigins și Jina Reader sunt primele.
const HOLIDAY_SOURCES = [
  { name:'proxy AllOrigins', url:'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://zilelibere.com/') },
  { name:'proxy Jina Reader', url:'https://r.jina.ai/https://zilelibere.com/' },
  { name:'zilelibere.com', url:'https://zilelibere.com/' },
  { name:'proxy CodeTabs', url:'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent('https://zilelibere.com/') },
];
function setHolidayStatus(text, kind) {
  ['holiday-status', 'holiday-status-main'].forEach(id => {
    const s = document.getElementById(id);
    if (s) { s.textContent = text; s.className = 'hint' + (kind ? ' ' + kind : ''); }
  });
}

// ----- Sărbători legale și religioase: API-ul public gratuit Nager.Date -----
const NAGER_HOLIDAYS_URL = year => `https://date.nager.at/api/v3/PublicHolidays/${year}/RO`;
function nagerDaysFromJson(list) {
  const days = {};
  (Array.isArray(list) ? list : []).forEach(h => {
    if (!h || !h.date || !h.localName) return;
    const p = String(h.date).split('-').map(Number);
    if (p.length !== 3 || !p[0] || !p[1] || !p[2]) return;
    const types = Array.isArray(h.types) ? h.types : [];
    let cat = types.indexOf('Public') !== -1 ? 'legal'
            : (types.indexOf('Observance') !== -1 || types.indexOf('Bank') !== -1) ? 'religios' : null;
    if (!cat) return;
    // O zi de vacanță / punte nu devine ZL nici dacă API-ul o etichetează altfel.
    if (cat === 'legal' && LEGAL_NOT_RE.test(h.localName)) cat = 'religios';
    const k = `${p[0]}-${p[1]}-${p[2]}`;
    if (!days[k]) days[k] = [];
    days[k].push({ name:String(h.localName).trim(), cat, trusted:true });
  });
  return days;
}
async function fetchNagerHolidays(years) {
  const results = await Promise.all(years.map(async y => {
    try {
      const res = await fetchWithTimeout(NAGER_HOLIDAYS_URL(y));
      if (!res || !res.ok) return { days:{}, ok:false };
      return { days:nagerDaysFromJson(await res.json()), ok:true };
    } catch (e) { return { days:{}, ok:false }; }
  }));
  const days = {};
  let ok = 0;
  results.forEach(r => {
    if (r.ok) ok++;
    Object.keys(r.days).forEach(k => {
      const arr = days[k] || (days[k] = []);
      r.days[k].forEach(e => { if (!arr.some(x => x.name === e.name && x.cat === e.cat)) arr.push(e); });
    });
  });
  return { days, ok };
}

// ----- Îmbinare inteligentă: local (cache) + Nager + zilelibere.com -----
function mergeHolidaySources(base, nagerDays, live) {
  const days = {};
  const put = (k, entry) => {
    if (!entry || !entry.name) return;
    const arr = days[k] || (days[k] = []);
    // O singură etichetă pe categorie per zi; numele din setul local câștigă.
    if (arr.some(x => x.cat === entry.cat)) return;
    arr.push(entry);
  };
  Object.keys((base && base.days) || {}).forEach(k => {
    const v = base.days[k];
    (Array.isArray(v) ? v : [v]).forEach(e => put(k, e));
  });
  Object.keys(nagerDays || {}).forEach(k => (nagerDays[k] || []).forEach(e => put(k, e)));
  // De pe zilelibere.com luăm doar vacanțele și punțile; sărbătorile vin de la Nager.
  if (live) Object.keys(live.days || {}).forEach(k => {
    const v = live.days[k];
    (Array.isArray(v) ? v : [v]).forEach(e => {
      if (/vacan|punte|concediu|școal|scoal|curs/i.test(e.name || '')) put(k, e);
    });
  });
  const ranges = [].concat((base && base.ranges) || [], (live && live.ranges) || [])
    .filter((r, i, all) => all.findIndex(x => x.from === r.from && x.to === r.to && x.name === r.name) === i);
  return {
    source: live ? 'Nager.Date + zilelibere.com + Codul Muncii'
                 : ((nagerDays && Object.keys(nagerDays).length) ? 'Nager.Date + Codul Muncii' : ((base && base.source) || 'zilelibere.com + Codul Muncii')),
    updated: new Date().toLocaleDateString('ro-RO'),
    days, ranges,
    lastHybridSync: new Date().toISOString()
  };
}

// Actualizarea hibridă: pornește automat la deschidere și la apăsarea butonului.
// Dacă rețeaua cade, calendarul rămâne cu datele locale, iar verificarea se reia
// periodic (scheduleHolidayRetry) până revine internetul sau până la un număr
// limitat de încercări — nu blochează nicio cerere și nu atinge ecranul.
async function syncHolidaysHybrid(opts) {
  if (ui.holidaySyncBusy) return null;
  const options = opts || {};
  ui.holidaySyncBusy = true;
  const base = (state && state.holidaysData) || defaultHolidayState();
  const today = new Date().toISOString().slice(0, 10);
  if (!options.force && base.lastHybridSync && base.lastHybridSync.slice(0, 10) === today) {
    ui.holidaySyncBusy = false;
    return null; // avem deja datele proaspăte de azi în cache
  }
  if (navigator.onLine === false) {
    setHolidayStatus(`ℹ Ești offline. Folosesc zilele libere salvate local (${base.updated || '2026'}); verific din nou sincronizarea peste 30 de secunde.`);
    scheduleHolidayRetry();
    ui.holidaySyncBusy = false;
    return null;
  }
  setHolidayStatus('↻ Actualizez zilele libere (sărbători + vacanțe)…');
  const year = new Date().getFullYear();
  const nager = await fetchNagerHolidays([year, year + 1]);
  let live = null, via = '';
  for (const src of HOLIDAY_SOURCES) {
    try {
      const res = await fetchWithTimeout(src.url);
      if (!res || !res.ok) continue;
      const data = parseHolidays(await res.text());
      if (data && Object.keys(data.days).length >= 8) { live = data; via = src.name; break; }
    } catch (e) { /* timeout / CORS / rețea: încercăm următorul proxy */ }
  }
  const merged = mergeHolidaySources(base, nager.days, live);
  applyHolidayData(merged, true);
  state.holidaysData = merged;
  try { localStorage.setItem(HOLIDAY_CACHE_KEY, JSON.stringify(merged)); } catch (e) { /* storage full */ }
  (state.calendars || []).forEach(c => { c.holidaysUpdated = merged.updated; });
  saveState();
  // Sărbătorile proaspete schimbă zilele SDSL: recalculăm calendarul și panoul.
  renderFilterButtons(); renderCalendar(); renderLegend(); renderSDSL();
  if (!options.quiet) {
    const bits = [
      nager.ok ? `✓ ${nager.ok} an(i) de sărbători de la Nager.Date` : '⚠ API-ul de sărbători nu a răspuns',
      live ? `vacanțe de pe zilelibere.com (${via})` : 'vacanțele rămân din copia locală'
    ];
    setHolidayStatus(bits.join(' · ') + ` · ${merged.updated}.`, nager.ok ? 'ok' : null);
  } else {
    markSdslSynced();
  }
  ui.holidaySyncBusy = false;
  return merged;
}
async function updateHolidays() {
  return syncHolidaysHybrid({ force:true, quiet:false });
}

// Retrăgește sincronizarea hibridă a zilelor libere offline — offlineul nu este
// o sălbăticenie: retrajesim periodic, nu blocăm și nu țărem useri ca fiind offline
// (reîncearca o dată la 30 de secunde, până la 10 încercări; reîncepe logical la
// orice eveniment online).
let holidayRetryTimer = null, holidayRetryCount = 0;
function scheduleHolidayRetry() {
  if (holidayRetryTimer || holidayRetryCount >= 10) return;
  holidayRetryTimer = setTimeout(() => {
    holidayRetryTimer = null;
    holidayRetryCount++;
    syncHolidaysHybrid({ quiet: true });
  }, 30000);
}
window.addEventListener('online', () => {
  holidayRetryCount = 0;
  syncHolidaysHybrid({ quiet: false });
});

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}

/* =========================================================
   Cont, sincronizare și import/export
   Datele rămân pe dispozitiv; contul le poate trimite către un depozit online
   public, iar codul de sincronizare / fișierul JSON funcționează întotdeauna
   (îl poți trimite prin e-mail către tine și-l poți deschide pe alt dispozitiv).
   ========================================================= */
const ACCOUNT_KEY = 'ore-ture-account-v1';
const CLOUD_BASE = 'https://api.jsonstorage.net/v1/json';
let account = (function () {
  try { return JSON.parse(localStorage.getItem(ACCOUNT_KEY) || 'null'); } catch (e) { return null; }
})();
function hashText(str) {
  let h1 = 5381, h2 = 52711;
  for (let i = 0; i < String(str).length; i++) {
    const c = String(str).charCodeAt(i);
    h1 = ((h1 * 33) ^ c) >>> 0;
    h2 = ((h2 * 33) ^ (c + i)) >>> 0;
  }
  return h1.toString(36) + h2.toString(36);
}
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email || '').trim());
}
function accountIds(email, pass) {
  const base = String(email).trim().toLowerCase() + '|' + String(pass);
  return { userId:'ct_' + hashText(base), itemId:'setari' };
}
const ACCOUNT_DATA_PREFIX = 'ore-ture-cont-';
// Fișierul de configurare e simplu JSON (nu criptat), ca să poată fi pus în
// Google Drive / Dropbox sau trimis prin e-mail și deschis cu „📥 Importă”.
function configPayload() {
  return {
    app:'Pontaj Ture', format:1, email:(account && account.email) || '',
    exported:new Date().toISOString(), state:state
  };
}
function configFileName() {
  const who = (account && account.email ? account.email.replace(/[^a-z0-9._-]/gi,'_') : 'cont');
  return 'pontaj-ture-configurare-' + who + '-' + new Date().toISOString().slice(0,10) + '.json';
}
function downloadConfig(quiet) {
  try {
    downloadJson(configFileName(), configPayload());
    if (!quiet) setAccountStatus('✓ Fișierul de configurare a fost descărcat. Pune-l în Google Drive sau trimite-l pe e-mail către tine.', 'ok');
    return true;
  } catch (e) {
    if (!quiet) setAccountStatus('⚠ Browserul nu a permis descărcarea fișierului.', 'err');
    return false;
  }
}
async function mailConfig() {
  const box = document.getElementById('account-code');
  const code = box && box.value ? box.value : await makeSyncCode(state, (account && account.pass) || '');
  const subject = 'Configurare Pontaj Ture' + (account && account.email ? ' — ' + account.email : '');
  const body = 'Salvează acest cod într-un fișier (ex. configurare.txt) în Google Drive sau pe telefonul celălalt.\n\n' +
    'Pe celălalt dispozitiv: deschide Pontaj Ture → 👤 Cont → lipește codul în „Cod de sincronizare” → „⬇ Preia din cod”.\n\n' + code;
  window.location.href = 'mailto:' + encodeURIComponent((account && account.email) || '') +
    '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  setAccountStatus('✓ S-a deschis aplicația de e-mail cu codul de configurare în corpul mesajului.', 'ok');
}
function b64encode(str) {
  const bytes = new TextEncoder().encode(str);
  let out = '';
  for (let i = 0; i < bytes.length; i += 8192) out += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192));
  return btoa(out);
}
function b64decode(code) {
  const bytes = Uint8Array.from(atob(code), c => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
function b64bytes(bytes) {
  let out = '';
  for (let i = 0; i < bytes.length; i += 8192) out += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192));
  return btoa(out);
}
function bytesToHex(bytes) { return Array.from(bytes, b => ('0' + b.toString(16)).slice(-2)).join(''); }
function hexToBytes(hex) { return new Uint8Array(String(hex).match(/../g).map(x => parseInt(x, 16))); }
async function cryptoKey(pass, saltHex) {
  if (!window.crypto || !crypto.subtle) return null;
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name:'PBKDF2', salt:hexToBytes(saltHex), iterations:100000, hash:'SHA-256' },
    base, { name:'AES-GCM', length:256 }, false, ['encrypt','decrypt']);
}
async function makeSyncCode(data, pass) {
  const json = JSON.stringify(data);
  const key = await cryptoKey(pass, 'c3547572653031'); // „cture01” — salt fix, derivat din parolă
  if (!key) return 'CTURE-PLAIN:' + b64encode(json);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt({ name:'AES-GCM', iv }, key, new TextEncoder().encode(json));
  return 'CTURE1:' + b64bytes(iv) + ':' + b64bytes(new Uint8Array(cipher));
}
async function readSyncCode(code, pass) {
  const s = String(code || '').trim();
  if (s.indexOf('CTURE-PLAIN:') === 0) return JSON.parse(b64decode(s.slice(12)));
  if (s.indexOf('CTURE1:') === 0) {
    const parts = s.split(':');
    const key = await cryptoKey(pass, 'c3547572653031');
    if (!key) throw new Error('Acest browser nu poate decripta codul (lipsește AES-GCM).');
    const iv = Uint8Array.from(atob(parts[1]), c => c.charCodeAt(0));
    const ct = Uint8Array.from(atob(parts[2]), c => c.charCodeAt(0));
    const plain = await crypto.subtle.decrypt({ name:'AES-GCM', iv }, key, ct);
    return JSON.parse(new TextDecoder().decode(plain));
  }
  return JSON.parse(s); // JSON obișnuit
}
function cloudUrls(ids) {
  return [
    { name:'JsonStorage', url:`${CLOUD_BASE}/${ids.userId}/${ids.itemId}` },
    { name:'JsonStorage alternativ', url:`${CLOUD_BASE}/${ids.userId}/setari2` },
  ];
}
async function cloudFetch(ids) {
  for (const p of cloudUrls(ids)) {
    try {
      const r = await fetch(p.url, { cache:'no-store' });
      if (r && r.ok) {
        const payload = await r.json();
        if (payload && (payload.state || payload.data)) return { provider:p.name, payload };
      }
    } catch (e) { /* depozitul refuză sau browserul blochează */ }
  }
  return null;
}
async function cloudPush(ids, code) {
  for (const p of cloudUrls(ids)) {
    try {
      const r = await fetch(p.url, { method:'PUT', headers:{ 'Content-Type':'application/json' },
        body:JSON.stringify({ app:'pontaj-ture', updated:new Date().toISOString(), state:code }) });
      if (r && r.ok) return p.name;
    } catch (e) { /* se încearcă următorul depozit */ }
  }
  return null;
}
/* =========================================================
   Supabase — autentificare și sincronizare în cloud.
   Configurarea și funcțiile de mai jos sunt exact cele furnizate.
   Singura protecție adăugată este un gard pentru cazul în care SDK-ul
   Supabase nu s-a încărcat (de exemplu fără internet): aplicația
   trebuie să continue să funcționeze local, nu să se oprească la pornire.
   ========================================================= */
const SUPABASE_URL = 'https://hhrrurdxryblpsifksuk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_uiKSIGD9Ome5himN7OBWpA_TXmQK9iC';
const supabaseClient = (typeof supabase !== 'undefined' && typeof supabase.createClient === 'function')
  ? supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

let currentUser = null;

async function checkSupabaseSession() {
  if (!supabaseClient) return;
  let session = null;
  // Offline sau eroare de rețea la verificarea sesiunii: sesiunea nu se reia,
  // dar datele locale rămân accesibile și deschiderea nu e blocată.
  try { ({ data: { session } } = await supabaseClient.auth.getSession()); }
  catch (e) { /* eroare/offline: se continuă cu sesiunea dintr-un slot anterior sau gol */ }
  if (session && session.user) {
    currentUser = session.user;
    renderAccountButton();
    updateAccountExtras();
    if (navigator.onLine === false) markCloudPending();
    else await loadDataFromSupabase(currentUser.id);
  }
  // Ascultările stării contului (SUPABASE): SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, PASSWORD_RECOVERY.
  supabaseClient.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN') {
      if (!currentUser) {
        currentUser = session && session.user;
        renderAccountButton();
        updateAccountExtras();
        if (currentUser) {
          setAccountStatus(`✓ Autentificat ca ${currentUser.email}. Datele se sincronizează automat cu Supabase.`);
          if (navigator.onLine !== false) await loadDataFromSupabase(currentUser.id);
          refreshSyncCode();
        }
      }
    } else if (event === 'SIGNED_OUT') {
      currentUser = null;
      renderAccountButton();
      updateAccountExtras();
      hideAccountRecovery();
      setAccountStatus('✓ Deconectat. Datele rămân salvate pe acest dispozitiv.');
    } else if (event === 'PASSWORD_RECOVERY') {
      showAccountRecovery();
    }
    if (event === 'TOKEN_REFRESHED' && currentUser) {
      renderAccountButton();
      updateAccountExtras();
      refreshSyncCode();
    }
  });
}

async function loadDataFromSupabase(userId) {
  if (!supabaseClient) return;
  if (navigator.onLine === false) { markCloudPending(); return; }
  try {
    const { data, error } = await supabaseClient
      .from('user_data')
      .select('config_json')
      .eq('user_id', userId)
      .single();

    if (error) return;
    if (data && data.config_json) {
      state = data.config_json;
      if (state.calendars) state.calendars.forEach(normalizeCalendar);
      if (!state.holidaysData || !state.holidaysData.days) state.holidaysData = defaultHolidayState();
      saveState();
      renderAll();
    }
  } catch (e) {
    /* Offline/eroare de rețea: datele locale rămân; doar arătăm starea în cloud. */
    if (navigator.onLine === false) markCloudPending();
  }
}

let cloudTimer = null;
let cloudPending = false;
const CLOUD_OFFLINE_MSG = 'ℹ Ești offline. Modificările sunt salvate local și se vor sincroniza când revine internetul.';
// Marcăm starea ca „în așteptare” fără să trecem iar prin saveState(), ca să nu
// intrăm într-o buclă: saveState() apelează chiar această funcție de sincronizare.
// În timp ce e offline, (re)încearcă sincronizarea Supabase la 30 de secunde.
let cloudRetryTimer = null;
function scheduleCloudRetry() {
  if (cloudRetryTimer || navigator.onLine !== false) return;
  cloudRetryTimer = setTimeout(() => { cloudRetryTimer = null; pushToSupabase(false); }, 30000);
}
function setCloudPending(pending) {
  cloudPending = !!pending;
  state.pendingSync = cloudPending;
  try {
    const raw = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, raw);
    liveStateSig = raw;
  } catch (e) { /* spațiu insuficient: mesajul rămâne în memorie */ }
}
function markCloudPending() {
  if (!cloudPending) setCloudPending(true);
  setAccountStatus(CLOUD_OFFLINE_MSG);
}
function clearCloudPending() {
  if (cloudPending || state.pendingSync) setCloudPending(false);
}
// O singură funcție de scriere în cloud, folosită de salvare, de buton și de
// evenimentul „online”. Verifică întâi navigator.onLine, apoi face upsert în
// tabela user_data (user_id, config_json, updated_at).
async function pushToSupabase(announce) {
  if (!supabaseClient || !currentUser) return false;
  if (navigator.onLine === false) { markCloudPending(); return false; }
  try {
    const { error } = await supabaseClient.from('user_data').upsert({
      user_id: currentUser.id,
      config_json: state,
      updated_at: new Date().toISOString()
    });
    if (error) throw error;
    clearCloudPending();
    clearTimeout(cloudRetryTimer); cloudRetryTimer = null;
    if (announce) setAccountStatus(`✓ Sincronizat cu Supabase la ${new Date().toLocaleTimeString('ro-RO')}.`, 'ok');
    return true;
  } catch (e) {
    markCloudPending();
    return false;
  }
}
function scheduleCloudPush() {
  if (!supabaseClient || !currentUser) return;
  if (navigator.onLine === false) { markCloudPending(); scheduleCloudRetry(); return; }
  clearTimeout(cloudTimer);
  cloudTimer = setTimeout(() => { pushToSupabase(false); }, 1000);
}
// Coada offline: imediat ce internetul revine, trimitem tot ce s-a adunat.
window.addEventListener('online', () => {
  if (!supabaseClient || !currentUser) return;
  clearTimeout(cloudTimer);
  pushToSupabase(true);
});
window.addEventListener('offline', () => { if (currentUser) { markCloudPending(); scheduleCloudRetry(); } });
function setAccountStatus(text, kind) {
  const el = document.getElementById('account-status');
  if (!el) return;
  el.className = 'account-status' + (kind ? ' ' + kind : '');
  el.innerHTML = `<span class="cloud-dot${kind === 'ok' ? ' on' : ''}"></span>${escapeHtml(text)}`;
}
async function doAccountLogin() {
  const email = document.getElementById('account-email').value.trim();
  const pass = document.getElementById('account-pass').value;
  if (!email || !pass) return uiAlert('Completează e-mailul și parola.');
  if (navigator.onLine === false) { markCloudPending(); return; }
  if (!supabaseClient) return uiAlert('Librăria Supabase nu s-a putut încărca. Verifică conexiunea la internet și reîncarcă pagina.');

  let { data, error } = await supabaseClient.auth.signInWithPassword({ email, password: pass });
  if (error) {
    let signUpRes = await supabaseClient.auth.signUp({ email, password: pass });
    if (signUpRes.error) {
      uiAlert('Eroare: ' + signUpRes.error.message);
      setAccountStatus('⚠ ' + signUpRes.error.message, 'err');
      return;
    }
    data = signUpRes.data;
  }
  if (data && data.user) {
    currentUser = data.user;
    renderAccountButton();
    updateAccountExtras();
    await loadDataFromSupabase(currentUser.id);
    uiAlert('Autentificat cu succes!');
    setAccountStatus(`✓ Autentificat ca ${currentUser.email}. Datele se sincronizează automat cu Supabase.`, 'ok');
    await refreshSyncCode();
  }
}

async function doAccountLogout() {
  if (supabaseClient) await supabaseClient.auth.signOut();
  currentUser = null;
  renderAccountButton();
  updateAccountExtras();
  hideAccountRecovery();
  setAccountStatus('✓ Deconectat. Datele rămân salvate pe acest dispozitiv.', 'ok');
}
// ——— Forgot password (Am uitat parola) ———
async function doAccountForgotPassword() {
  const email = document.getElementById('account-email').value.trim();
  if (!email) { setAccountStatus('⚠ Completează e-mailul mai întâi.', 'err'); return; }
  if (!supabaseClient) { setAccountStatus('⚠ Librăria Supabase nu s-a putut încărca. Verifică conexiunea la internet și reîncarcă pagina.', 'err'); return; }
  setAccountStatus('⏳ Trimitem linkul de resetare…');
  try {
    await supabaseClient.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    setAccountStatus('✓ Verifică e-mailul și urmează linkul de resetare.');
  } catch (e) {
    setAccountStatus('⚠ ' + (e.message || 'Eroare la resetarea parolei.'), 'err');
  }
}
// ——— Schimbare parolă (updateUser) ———
function updateAccountExtras() {
  const row = document.getElementById('account-change-pass-row');
  if (row) row.style.display = currentUser ? '' : 'none';
}
function showAccountRecovery() {
  const box = document.getElementById('account-recovery-box');
  if (!box) return;
  box.style.display = 'flex';
  const e = document.getElementById('account-email');
  if (e && !e.value && currentUser) e.value = currentUser.email;
  setAccountStatus('✓ Revii din linkul de resetare — setează-ți noua parolă în câmpul de mai jos și apasă „Setează parola nouă”.');
}
function hideAccountRecovery() {
  const box = document.getElementById('account-recovery-box');
  if (box) box.style.display = 'none';
}
async function setAccountPassword(elId) {
  const el = document.getElementById(elId);
  const pass = el && el.value;
  if (!pass) { setAccountStatus('⚠ Lipsește parola nouă.', 'err'); return; }
  if (pass.length < 6) { setAccountStatus('⚠ Parola nouă trebuie să aibă cel puțin 6 caractere.', 'err'); return; }
  if (!supabaseClient || !currentUser) { setAccountStatus('⚠ Trebuie să fii logat pentru a seta parola.', 'err'); return; }
  setAccountStatus('⏳ Se setează parola nouă…');
  try {
    await supabaseClient.auth.updateUser({ password: pass });
    setAccountStatus('✓ Parola a fost setată.');
    hideAccountRecovery();
  } catch (e) {
    setAccountStatus('⚠ ' + (e.message || 'Eroare la setarea parolei.'), 'err');
  }
}
async function doAccountChangePassword() {
  await setAccountPassword('account-new-pass');
}
async function doAccountSetNewPassword() {
  await setAccountPassword('account-recovery-pass');
}
async function doAccountSync() {
  if (!currentUser) { uiAlert('Loghează-te mai întâi.'); return; }
  if (navigator.onLine === false) { markCloudPending(); return; }
  setAccountStatus('↻ Se sincronizează cu Supabase…');
  await loadDataFromSupabase(currentUser.id);
  await pushToSupabase(true);
  if (!cloudPending) setAccountStatus(`✓ Sincronizat cu Supabase la ${new Date().toLocaleTimeString('ro-RO')}.`, 'ok');
}
async function doAccountLoadCode() {
  const code = document.getElementById('account-code').value;
  const pass = account && account.pass ? account.pass : (document.getElementById('account-pass').value || '');
  if (!code.trim()) { setAccountStatus('Lipește mai întâi codul de sincronizare.', 'err'); return; }
  try {
    const data = await readSyncCode(code, pass);
    if (!data || !Array.isArray(data.calendars) || !data.calendars.length) throw new Error('Cod invalid');
    state = data; state.calendars.forEach(normalizeCalendar);
    saveState(); renderAll();
    setAccountStatus('✓ Datele au fost preluate din cod pe acest dispozitiv.', 'ok');
  } catch (e) {
    setAccountStatus('⚠ Codul nu poate fi citit. Verifică parola și faptul că ai copiat tot textul.', 'err');
  }
}
async function copyAccountCode() {
  const box = document.getElementById('account-code');
  if (!box || !box.value) { setAccountStatus('Nu există încă un cod de sincronizare.', 'err'); return; }
  try { await navigator.clipboard.writeText(box.value); setAccountStatus('✓ Cod copiat. Trimite-l pe e-mail către tine.', 'ok'); }
  catch (e) { box.select(); document.execCommand && document.execCommand('copy'); setAccountStatus('✓ Cod selectat — apasă Ctrl/Cmd+C.', 'ok'); }
}
// Cod de sincronizare — generat și completat automat: (1) la login (doAccountLogin)
// și (2) când panoul de Cont e deschis deja logat (openAccountModal). Codul e valid
// pe baza stării curente — poate fi copiat, trimis pe e-mail sau lipit pe alt dispozitiv.
async function refreshSyncCode() {
  const box = document.getElementById('account-code');
  if (!box) return;
  try {
    const typed = document.getElementById('account-pass');
    const pass = (account && account.pass) ? account.pass : (typed ? typed.value : '');
    const code = await makeSyncCode(state, pass);
    if (code) box.value = code;
  } catch (e) { /* s-au refăcut codul deja — lăsăm ce am: textul păstrează ce a fost generat */ }
}
function renderAccountButton() {
  const b = document.getElementById('account-btn');
  if (!b) return;
  if (currentUser) {
    b.textContent = '👤 ' + currentUser.email.split('@')[0];
    b.classList.add('logged-in');
  } else {
    b.textContent = '👤 Cont';
    b.classList.remove('logged-in');
  }
}
function openAccountModal() {
  renderAccountButton();
  setAccountStatus(currentUser
    ? `Logat ca ${currentUser.email}. Datele se sincronizează automat cu Supabase.`
    : 'Nelogoat. Datele se salvează pe acest dispozitiv.');
  if (currentUser) refreshSyncCode(); // cod valid generat automat, la încărcarea panoului logat
  updateAccountExtras();
  hideAccountRecovery();
  const e = document.getElementById('account-email');
  if (e && currentUser && currentUser.email && !e.value) e.value = currentUser.email;
  document.getElementById('account-modal').style.display = 'flex';
}
function closeAccountModal() { document.getElementById('account-modal').style.display = 'none'; }
function openImportModal() {
  document.getElementById('import-status').textContent = 'Alege un fișier sau lipește textul JSON, apoi apasă „Importă”.';
  document.getElementById('import-modal').style.display = 'flex';
}
function closeImportModal() { document.getElementById('import-modal').style.display = 'none'; }
function downloadJson(name, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type:'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
function exportBackup() {
  downloadJson('pontaj-ture-backup-' + new Date().toISOString().slice(0,10) + '.json', state);
  const s = document.getElementById('import-status');
  if (s) s.textContent = '✓ Fișierul de backup a fost descărcat.';
}
async function importData() {
  const fileInput = document.getElementById('import-file');
  const status = document.getElementById('import-status');
  let text = document.getElementById('import-text').value.trim();
  if (fileInput && fileInput.files && fileInput.files[0]) text = await fileInput.files[0].text();
  if (!text) { status.textContent = '⚠ Alege un fișier sau lipește conținutul JSON.'; return; }
  try {
    const data = await readSyncCode(text, account && account.pass ? account.pass : '');
    const merge = document.getElementById('import-merge').checked;
    if (data && Array.isArray(data.calendars) && data.calendars.length) {
      data.calendars.forEach(normalizeCalendar);
      if (merge) {
        const existing = state.calendars.map(c => c.id);
        data.calendars.forEach(c => { if (!existing.includes(c.id)) state.calendars.push(c); });
        if (data.activeId && state.calendars.some(c => c.id === data.activeId)) state.activeId = data.activeId;
      } else {
        state = { calendars:data.calendars, activeId:data.activeId || data.calendars[0].id,
                  theme:data.theme || state.theme };
      }
    } else if (data && data.id && data.name && Array.isArray(data.assignments)) {
      normalizeCalendar(data);
      const i = state.calendars.findIndex(c => c.id === data.id);
      if (i >= 0) state.calendars[i] = data; else state.calendars.push(data);
      state.activeId = data.id;
    } else if (data && data.days && (data.source || data.ranges)) {
      applyHolidayData(data);
    } else {
      throw new Error('Format necunoscut');
    }
    saveState(); renderAll(); renderAccountButton();
    status.textContent = '✓ Import finalizat. Verifică calendarele și setările; totul s-a salvat pe acest dispozitiv.';
  } catch (e) {
    status.textContent = '⚠ Nu pot citi fișierul. Trebuie să fie un backup JSON exportat din aplicație sau un cod de sincronizare.';
  }
}
function bindAccountEvents() {
  const on = (id, evt, fn) => { const el = document.getElementById(id); if (el) el[evt] = fn; };
  on('account-btn','onclick',openAccountModal);
  on('import-btn','onclick',openImportModal);
  on('account-login','onclick',doAccountLogin);
  on('account-sync','onclick',doAccountSync);
  on('account-logout','onclick',doAccountLogout);
  on('account-forgot','onclick',doAccountForgotPassword);
  on('account-change-pass','onclick',doAccountChangePassword);
  on('account-recovery-set','onclick',doAccountSetNewPassword);
  on('account-download','onclick',() => downloadConfig(false));
  on('account-mail','onclick',mailConfig);
  on('account-code-copy','onclick',copyAccountCode);
  on('account-code-load','onclick',doAccountLoadCode);
  on('account-backup','onclick',exportBackup);
  on('account-restore','onclick',openImportModal);
  on('import-do','onclick',importData);
  on('import-export','onclick',exportBackup);
  document.querySelectorAll('.modal-overlay').forEach(m => {
    if (m.id === 'account-modal' || m.id === 'import-modal') return;
  });
  renderAccountButton();
}

/* =========================================================
   Salariu pe ture — „Setează plata pe tură ca să vezi salariul”
   (comportament preluat de pe app.calculatorture.ro — forkă Pontaj Ture)
   ========================================================= */
function computeSalary() {
  const c = cal();
  const r = { tureLucrate:0, tureNormale:0, duble:0, oreSupl:0, zileLucrate:0,
              orePontate:0, sdsl:0, norma:0, concedii:0, salariu:null };
  const baseDay = Number(c.dayHours) || 14;
  const days = daysInMonth(c.year, c.month);
  for (let d = 1; d <= days; d++) {
    const k = key(c.year, c.month, d);
    const all = (c.assignments[k] || []).map(id => typeById(c, id)).filter(Boolean);
    if (all.some(t => t.group === 'leave')) r.concedii++;
    const det = (c.dayDetails || {})[k];
    // Aceeași regulă ca în calendar: turele suprapuse nu se adună, se ia ora
    // turei adăugate ultima (sau editarea manuală), deci Detalii urmează calendarul.
    const hours = effectiveDayHours(c, c.year, c.month, d);
    if (hours <= 0) continue;
    r.tureLucrate += 1;
    r.orePontate = Math.round((r.orePontate + hours) * 100) / 100;
    r.zileLucrate++;
    if (hours > baseDay) { r.duble++; r.oreSupl = Math.round((r.oreSupl + hours - baseDay) * 100) / 100; }
    else r.tureNormale++;
  }
  r.sdsl = computeSDSL(c, c.year, c.month);
  r.norma = getNorma(c.year, c.month);
  if (c.payPerShift != null && c.payPerShift !== '') {
    const pay = Number(c.payPerShift) || 0, mult = Number(c.doubleMultiplier) || 2;
    r.salariu = Math.round((r.tureNormale * pay + r.duble * pay * mult) * 100) / 100;
  }
  return r;
}
function renderSalary() {
  const r = computeSalary(), c = cal();
  const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
  set('sal-ture-lucrate', r.tureLucrate);
  set('sal-ture-normale', r.tureNormale);
  set('sal-duble', r.duble);
  set('sal-ore-supl', fmtHours(r.oreSupl));
  set('sal-zile-lucrate', r.zileLucrate);
  set('sal-ore-pontate', fmtHours(r.orePontate));
  set('sal-sdsl', fmtHours(r.sdsl));
  set('sal-norma', fmtHours(r.norma));
  set('sal-concedii', r.concedii);
  const summary = document.getElementById('sal-rezumat-text');
  if (summary) {
    const diff = Math.round((r.orePontate - r.norma) * 100) / 100;
    summary.textContent = `Rezumat ${MONTHS_RO[c.month]} ${c.year}: ${r.tureLucrate} ture lucrate în ${r.zileLucrate} zile, ` +
      `${fmtHours(r.orePontate)}h pontate din norma de ${fmtHours(r.norma)}h ` +
      `(${diff >= 0 ? '+' : ''}${fmtHours(diff)}h), ${fmtHours(r.sdsl)}h SDSL, ` +
      `${fmtHours(r.oreSupl)}h suplimentare, ${r.concedii} zile de concediu.`;
  }
  const missing = r.salariu == null;
  const box = document.getElementById('sal-total-box'), mb = document.getElementById('sal-total-missing');
  if (box) box.style.display = missing ? 'none' : 'flex';
  if (mb) mb.style.display = missing ? 'flex' : 'none';
  set('sal-total', missing ? '—' : Number(r.salariu).toLocaleString('ro-RO'));
  const pay = document.getElementById('pay-per-shift');
  if (pay && document.activeElement !== pay) pay.value = c.payPerShift == null ? '' : c.payPerShift;
  const dm = document.getElementById('double-multiplier');
  if (dm && document.activeElement !== dm) dm.value = c.doubleMultiplier || 2;
  const gt = document.getElementById('game-invites-toggle');
  if (gt) gt.checked = c.gameInvites !== false;
}
function toggleSalaryPanel(name) {
  const panel = document.getElementById('sal-panel-' + name);
  if (!panel) return;
  const open = panel.style.display === 'none';
  panel.style.display = open ? (name === 'detalii' ? 'grid' : 'block') : 'none';
  const btn = document.getElementById('btn-sal-' + name);
  if (btn) {
    btn.textContent = (name === 'detalii' ? 'Detalii' : 'Setări plată') + (open ? ' ▾' : ' ▶');
    btn.classList.toggle('active-mode', open);
  }
}

/* =========================================================
   Export calendar (.ics) — „📅 Exportă în calendar ▾”
   ========================================================= */
function timeToMinutes(s) {
  const p = String(s || '0:0').split(':').map(Number);
  return (p[0] || 0) * 60 + (p[1] || 0);
}
function addMinutes(date, min) { return new Date(date.getTime() + min * 60000); }
function icsDateNum(d) {
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
}
function icsDateTime(d) {
  const p = n => String(n).padStart(2, '0');
  return `${icsDateNum(d)}T${p(d.getHours())}${p(d.getMinutes())}00`;
}
function icsEscape(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}
function foldLine(line) {
  if (line.length <= 75) return line;
  let res = line.slice(0, 75), rest = line.slice(75);
  while (rest.length) { res += '\r\n ' + rest.slice(0, 74); rest = rest.slice(74); }
  return res;
}
function buildIcsEvents() {
  const c = cal();
  const months = Number(document.getElementById('ics-range').value) || 1;
  const dayStart = document.getElementById('ics-day-start').value || '07:00';
  const nightStart = document.getElementById('ics-night-start').value || '19:00';
  const alarmDay = document.getElementById('ics-alarm-day').value || '05:30';
  const alarmNight = document.getElementById('ics-alarm-night').value || '17:30';
  const alarm2 = document.getElementById('ics-alarm2').checked;
  const alarm2min = Number(document.getElementById('ics-alarm2-min').value) || 30;
  const includeLeave = document.getElementById('ics-include-leave').checked;
  const events = [];
  for (let mi = 0; mi < months; mi++) {
    let y = c.year, m = c.month + mi;
    if (m > 11) { m -= 12; y++; }
    const dim = daysInMonth(y, m);
    for (let d = 1; d <= dim; d++) {
      const k = key(y, m, d);
      const ids = c.assignments[k] || [];
      const det = (c.dayDetails || {})[k];
      const real = ids.map(id => typeById(c, id)).filter(t => t && t.group !== 'leave' && !isBlankShift(t));
      const leave = ids.map(id => typeById(c, id)).filter(t => t && t.group === 'leave');
      if (real.length) {
        const hours = effectiveDayHours(c, y, m, d);
        const isNight = real.some(t => t.id === 'N' || String(t.code || '').toUpperCase() === 'N' || t.cls === 'noapte');
        const startMin = timeToMinutes(isNight ? nightStart : dayStart);
        const start = new Date(y, m, d, Math.floor(startMin / 60), startMin % 60, 0);
        const end = addMinutes(start, Math.round(hours * 60));
        const trigger = Math.max(0, startMin - timeToMinutes(isNight ? alarmNight : alarmDay));
        const alarms = [`TRIGGER:-PT${trigger}M`];
        if (alarm2) alarms.push(`TRIGGER:-PT${Math.max(0, trigger - alarm2min)}M`);
        events.push({ start, end, allDay:false, summary: real.map(t => t.code).join('+') + ' tură', alarms });
      }
      if (includeLeave && leave.length) {
        const start = new Date(y, m, d), end = new Date(y, m, d + 1);
        events.push({ start, end, allDay:true, summary: leave.map(t => t.code).join('+') + ' concediu', alarms:[] });
      }
    }
  }
  return events;
}
function buildIcs(events) {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Pontaj Ture//RO', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
  const stamp = icsDateTime(new Date());
  events.forEach((ev, i) => {
    lines.push('BEGIN:VEVENT', 'UID:t' + Date.now() + '-' + i + '@pontaj-ture', 'DTSTAMP:' + stamp);
    if (ev.allDay) lines.push('DTSTART;VALUE=DATE:' + icsDateNum(ev.start), 'DTEND;VALUE=DATE:' + icsDateNum(ev.end));
    else lines.push('DTSTART:' + icsDateTime(ev.start), 'DTEND:' + icsDateTime(ev.end));
    lines.push('SUMMARY:' + icsEscape(ev.summary));
    ev.alarms.forEach(a => lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsEscape(ev.summary), a, 'END:VALARM'));
    lines.push('END:VEVENT');
  });
  lines.push('END:VCALENDAR');
  return lines.map(foldLine).join('\r\n') + '\r\n';
}
function exportIcs() {
  const events = buildIcsEvents();
  const status = document.getElementById('ics-status');
  if (!events.length) { if (status) status.textContent = 'Nu există ture în perioada aleasă. Generează mai întâi programul.'; return; }
  try {
    const blob = new Blob([buildIcs(events)], { type:'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'ture-calendar.ics'; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    if (status) status.textContent = `✓ ${events.length} evenimente exportate. Importă fișierul în calendarul tău.`;
  } catch (e) {
    if (status) status.textContent = 'Nu am putut crea fișierul. Încearcă din nou.';
  }
}
function toggleIcsPanel() {
  const panel = document.getElementById('ics-panel');
  if (!panel) return;
  const open = panel.style.display === 'none';
  panel.style.display = open ? 'block' : 'none';
  const btn = document.getElementById('btn-ics-toggle');
  if (btn) { btn.textContent = '📅 Exportă în calendar' + (open ? ' ▾' : ' ▶'); btn.classList.toggle('active-mode', open); }
}

/* =========================================================
   Print / PDF / instalare / distribuire / mini-joc
   ========================================================= */
function doPrint() { window.print(); }
function exportPdf() {
  const root = document.documentElement;
  const old = root.getAttribute('data-theme');
  root.setAttribute('data-theme', 'light');
  document.body.classList.add('printing-pdf');
  setTimeout(() => {
    try { window.print(); } finally { setTimeout(() => { root.setAttribute('data-theme', old || 'light'); document.body.classList.remove('printing-pdf'); }, 400); }
  }, 80);
}

let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault(); deferredPrompt = e;
  const b = document.getElementById('pwa-native-btn');
  if (b) b.style.display = 'block';
});
function openPwaModal() {
  const m = document.getElementById('pwa-modal');
  if (!m) return;
  m.style.display = 'flex';
  const ua = navigator.userAgent || '';
  const ios = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
  const android = /Android/.test(ua);
  const show = (id, on) => { const el = document.getElementById(id); if (el) el.style.display = on ? 'block' : 'none'; };
  show('pwa-ios', ios); show('pwa-android', !ios && android); show('pwa-desktop', !ios && !android);
  const b = document.getElementById('pwa-native-btn');
  if (b && !deferredPrompt) b.style.display = 'none';
}
function closePwaModal() { const m = document.getElementById('pwa-modal'); if (m) m.style.display = 'none'; }
function triggerNativeInstall() {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then(() => { deferredPrompt = null; closePwaModal(); });
}

/* =========================================================
   Notificări pentru programul de ture
   - setări per calendar (în c.notify)
   - verifică turele din următoarele zile și anunță cu „lead” minute înainte
   - funcționează în pagină, în PWA (showNotification) și pe iPhone după
     adăugarea pe ecranul de start (iOS 16.4+)
   ========================================================= */
const NOTIFY_FIRED_KEY = 'ore-ture-notified-v1';
const RO_DAYS_SHORT = ['Dum','Lun','Mar','Mie','Joi','Vin','Sâm'];
const RO_MONTHS_SHORT = ['ian','feb','mar','apr','mai','iun','iul','aug','sep','oct','nov','dec'];

function notifyPermission() {
  return (typeof Notification !== 'undefined') ? Notification.permission : 'unsupported';
}
function notifyTypesFor(c) {
  const picked = (c.notify && c.notify.types) || [];
  const all = (c.types || []).filter(t => !isBlankShift(t) && (Number(t.hours) || 0) > 0);
  const chosen = picked.length ? all.filter(t => picked.indexOf(t.id) !== -1) : all;
  return chosen.length ? chosen : all;
}
function notifyStartMinutes(t) {
  const s = t && t.clock && t.clock.start;
  if (s && /^\d{1,2}:\d{2}$/.test(s)) return timeToMinutes(s);
  const fallback = { zi:7*60, noapte:20*60, preg:6*60, cont:8*60, psih:9*60, co:8*60, cm:8*60, cos:8*60 };
  return fallback[t && t.cls] || 8*60;
}
function upcomingShifts(c, maxDays) {
  const days = Math.min(14, Math.max(1, Number(maxDays) || 3));
  const types = notifyTypesFor(c);
  const out = [];
  const today = new Date(); today.setHours(0, 0, 0, 0);
  for (let i = 0; i < days; i++) {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
    const ids = (c.assignments || {})[key(date.getFullYear(), date.getMonth(), date.getDate())] || [];
    ids.forEach(id => {
      const t = typeById(c, id);
      if (!t || types.indexOf(t) === -1) return;
      const sm = notifyStartMinutes(t);
      const at = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
      at.setMinutes(sm);
      out.push({ date, at, type:t, id:t.id, code:t.code || t.id, name:t.name,
        hours:Number(t.hours) || 0, start:t.clock && t.clock.start || '' });
    });
  }
  out.sort((a, b) => a.at - b.at);
  return out;
}
function notifyDayLabel(date) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.round((date - today) / 86400000);
  if (diff === 0) return 'azi';
  if (diff === 1) return 'mâine';
  return RO_DAYS_SHORT[date.getDay()] + ' ' + date.getDate() + ' ' + RO_MONTHS_SHORT[date.getMonth()];
}
function getFiredMap() {
  try { return JSON.parse(localStorage.getItem(NOTIFY_FIRED_KEY) || '{}'); } catch (e) { return {}; }
}
function fireNotification(title, options) {
  const opts = Object.assign({ icon:'icon-192.png', badge:'icon-192.png', tag:'ore-ture-shift' }, options || {});
  try {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type:'notify', title, options:opts });
      return true;
    }
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && !opts.inPage) {
      new Notification(title, opts);
      return true;
    }
  } catch (e) { /* fallback la banner-ul din pagină */ }
  showInPageToast(title + (opts.body ? ' — ' + opts.body : ''));
  return false;
}
function showInPageToast(text) {
  let box = document.getElementById('notify-toast');
  if (!box) {
    box = document.createElement('div');
    box.id = 'notify-toast';
    box.className = 'notify-toast';
    document.body.appendChild(box);
  }
  box.textContent = text;
  box.classList.add('show');
  clearTimeout(box._timer);
  box._timer = setTimeout(() => box.classList.remove('show'), 9000);
}
function checkDueNotifications() {
  const c = cal();
  if (!c || !c.notify || !c.notify.enabled || notifyPermission() !== 'granted') return;
  const lead = c.notify.lead * 60000;
  const now = Date.now();
  const fired = getFiredMap();
  let changed = false;
  upcomingShifts(c, 2).forEach(s => {
    const delta = s.at.getTime() - now;
    if (delta > lead || delta < -20 * 60000) return;
    const stamp = c.id + '|' + key(s.date.getFullYear(), s.date.getMonth(), s.date.getDate()) + '|' + s.id;
    if (fired[stamp]) return;
    fired[stamp] = Date.now(); changed = true;
    const body = s.code + ' · ' + s.name + ' · ' + (s.hours ? s.hours + 'h' : '') +
      (s.start ? ' · începe la ' + s.start : '') + ' · ' + notifyDayLabel(s.date);
    const options = { body, tag:'ore-ture-' + stamp, requireInteraction:false,
      silent:c.notify.sound === false, inPage:false };
    fireNotification('🔔 Tura de ' + notifyDayLabel(s.date) + ' începe în curând', options);
  });
  if (changed) { try { localStorage.setItem(NOTIFY_FIRED_KEY, JSON.stringify(fired)); } catch (e) {} }
}
function renderNotifyPanel() {
  const c = cal();
  const btn = document.getElementById('notify-btn');
  if (btn) { btn.classList.toggle('on', !!(c && c.notify && c.notify.enabled)); }
  const status = document.getElementById('notify-status');
  const perm = notifyPermission();
  if (status) {
    const on = c && c.notify && c.notify.enabled;
    status.className = 'notify-status ' + (perm === 'granted' && on ? 'ok' : (perm === 'denied' ? 'warn' : ''));
    status.textContent = perm === 'unsupported'
      ? 'Acest browser nu acceptă notificări desktop. Poți folosi în schimb exportul în calendar (.ics) cu alarme.'
      : perm === 'denied'
        ? 'Notificările sunt blocate în browser. Deschide setările site-ului din bara adresei și permete-le.'
        : perm === 'granted'
          ? (on ? '✓ Notificări active. Vei fi anunțat înainte de fiecare tură din calendar.' :
            'Permisiune acordată, dar notificările sunt oprite. Bifează „Activează”.')
          : 'Apasă „Permite notificările”, apoi activează opțiunea de mai sus.';
  }
  const enabled = document.getElementById('notify-enabled');
  if (enabled) enabled.checked = !!(c && c.notify && c.notify.enabled);
  const lead = document.getElementById('notify-lead'); if (lead) lead.value = c.notify.lead;
  const days = document.getElementById('notify-days'); if (days) days.value = c.notify.days;
  const sound = document.getElementById('notify-sound'); if (sound) sound.checked = c.notify.sound !== false;
  const today = document.getElementById('notify-today'); if (today) today.checked = c.notify.todaySummary !== false;
  const box = document.getElementById('notify-types');
  if (box) {
    const chosen = c.notify.types || [];
    const all = (c.types || []).filter(t => !isBlankShift(t) && (Number(t.hours) || 0) > 0);
    box.innerHTML = all.map(t =>
      `<label><input type="checkbox" data-ntype="${escapeHtml(t.id)}" ${chosen.indexOf(t.id) !== -1 ? 'checked' : ''}/> ` +
      `<span class="upcoming-code">${escapeHtml(t.code || t.id)}</span> ${escapeHtml(t.name)}</label>`).join('');
    box.querySelectorAll('[data-ntype]').forEach(el => el.onchange = () => {
      const id = el.dataset.ntype, arr = cal().notify.types;
      cal().notify.types = el.checked ? arr.concat([id].filter(x => arr.indexOf(x) === -1)) : arr.filter(x => x !== id);
      saveState(); renderNotifyPanel();
    });
  }
  const up = document.getElementById('notify-upcoming');
  if (up) {
    const shifts = upcomingShifts(c, c.notify.days);
    up.innerHTML = shifts.length ? shifts.map(s =>
      `<div class="upcoming-row"><span class="upcoming-day">${notifyDayLabel(s.date)}</span>` +
      `<span class="upcoming-code">${escapeHtml(s.code)}</span>` +
      `<span class="upcoming-time">${s.start ? escapeHtml(s.start) : (s.hours ? s.hours + 'h' : '')}</span>` +
      `<span class="upcoming-name">${escapeHtml(s.name)}</span></div>`).join('')
      : '<div class="upcoming-row">Nu există ture în următoarele zile. Generează programul sau aplică ture pe zile.</div>';
  }
}
function openNotifyModal() {
  const m = document.getElementById('notify-modal');
  if (!m) return;
  renderNotifyPanel();
  m.style.display = 'flex';
}
function closeNotifyModal() { const m = document.getElementById('notify-modal'); if (m) m.style.display = 'none'; }
async function requestNotifyPermission() {
  if (typeof Notification === 'undefined') { renderNotifyPanel(); return; }
  try { await Notification.requestPermission(); } catch (e) {}
  renderNotifyPanel();
  if (Notification.permission === 'granted' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(reg => reg.active && reg.active.postMessage({ type:'ready' })).catch(() => {});
  }
}
function testNotification() {
  const c = cal();
  const on = c && c.notify && c.notify.enabled;
  const status = document.getElementById('notify-status');
  if (!on) {
    if (status) { status.className = 'notify-status warn'; status.textContent = 'Activează mai întâi notificările.'; }
    return;
  }
  const fired = fireNotification('🔔 Test notificare tură', {
    body: 'Exemplu: tura de zi (14h) începe la 07:00. Așa va arăta notificarea înainte de fiecare tură.',
    tag:'ore-ture-test', inPage: notifyPermission() !== 'granted'
  });
  if (status) {
    status.className = 'notify-status ok';
    status.textContent = fired && notifyPermission() === 'granted'
      ? '✓ Notificare de test trimisă.'
      : '✓ Notificare de test afișată în pagină (browserul nu permite încă notificări desktop).';
  }
}
let notifyTimer = null;
function initNotifications() {
  renderNotifyPanel();
  const enabled = document.getElementById('notify-enabled');
  if (enabled) enabled.onchange = () => {
    cal().notify.enabled = enabled.checked;
    if (enabled.checked && notifyPermission() === 'default') requestNotifyPermission();
    saveState(); renderNotifyPanel();
    if (enabled.checked) setTimeout(checkDueNotifications, 400);
  };
  const lead = document.getElementById('notify-lead');
  if (lead) lead.onchange = () => {
    cal().notify.lead = Math.min(1440, Math.max(5, Number(lead.value) || 120));
    lead.value = cal().notify.lead; saveState(); renderNotifyPanel();
  };
  const days = document.getElementById('notify-days');
  if (days) days.onchange = () => {
    cal().notify.days = Math.min(14, Math.max(1, Number(days.value) || 3));
    days.value = cal().notify.days; saveState(); renderNotifyPanel();
  };
  const sound = document.getElementById('notify-sound');
  if (sound) sound.onchange = () => { cal().notify.sound = sound.checked; saveState(); };
  const today = document.getElementById('notify-today');
  if (today) today.onchange = () => { cal().notify.todaySummary = today.checked; saveState(); };
  const allow = document.getElementById('notify-allow');
  if (allow) allow.onclick = requestNotifyPermission;
  const test = document.getElementById('notify-test');
  if (test) test.onclick = testNotification;
  clearInterval(notifyTimer);
  notifyTimer = setInterval(checkDueNotifications, 60000);
  setTimeout(checkDueNotifications, 2500);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { renderNotifyPanel(); checkDueNotifications(); } });
  // Rezumat scurt al zilei la deschidere (doar în pagină, fără notificare de sistem).
  setTimeout(() => {
    const c = cal();
    if (!c || !c.notify || !c.notify.enabled || c.notify.todaySummary === false) return;
    const now = new Date();
    const todayShifts = upcomingShifts(c, 1).filter(s => s.date.getDate() === now.getDate() &&
      s.date.getMonth() === now.getMonth() && s.date.getFullYear() === now.getFullYear());
    if (todayShifts.length) {
      showInPageToast('🔔 Azi: ' + todayShifts.map(s => s.code + (s.start ? ' ' + s.start : '')).join(', '));
    }
  }, 4000);
  // Legătura din pagina iPhone / din manifest deschide direct panoul de notificări.
  if (location.hash === '#notify') setTimeout(openNotifyModal, 350);
  window.addEventListener('hashchange', () => { if (location.hash === '#notify') openNotifyModal(); });
}

function shareUrl() { return location.href.split('#')[0].split('?')[0]; }
function openShareModal() {
  const m = document.getElementById('share-modal');
  if (!m) return;
  m.style.display = 'flex';
  const url = shareUrl(), enc = encodeURIComponent;
  const wa = document.getElementById('share-whatsapp');
  if (wa) wa.href = 'https://wa.me/?text=' + enc('Bă, am găsit un calculator de ture mișto 👇\n' + url);
  const fb = document.getElementById('share-facebook');
  if (fb) fb.href = 'https://www.facebook.com/sharer/sharer.php?u=' + enc(url);
}
function closeShareModal() { const m = document.getElementById('share-modal'); if (m) m.style.display = 'none'; }
function copyShareLink() {
  const url = shareUrl();
  const done = () => {
    const b = document.getElementById('copy-btn-text');
    if (b) { b.textContent = '✓ Link copiat!'; setTimeout(() => { b.textContent = 'Copiază linkul'; }, 2500); }
  };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done).catch(() => uiPrompt('Copiază linkul', url, 'Gata'));
  else uiPrompt('Copiază linkul', url, 'Gata');
}

const GAME_QUESTIONS = [
  { q:'Ce înseamnă litera N în calendar?', a:['Zi','Noapte','Liber'], correct:1 },
  { q:'Câte ore are o tură de zi în exemplul tău?', a:['13','14','12'], correct:1 },
  { q:'Ce se pune în „Ore suplimentare pentru luna viitoare”?', a:['Orele rămase','Norma','Zilele libere'], correct:0 },
];
let gameIdx = 0, gameScore = 0;
function openGame() {
  const m = document.getElementById('game-modal');
  if (!m) return;
  m.style.display = 'flex'; gameIdx = 0; gameScore = 0;
  const s = document.getElementById('game-score'); if (s) s.textContent = '';
  renderGameQuestion();
}
function closeGame() { const m = document.getElementById('game-modal'); if (m) m.style.display = 'none'; }
function renderGameQuestion() {
  const item = GAME_QUESTIONS[gameIdx];
  if (!item) return;
  const q = document.getElementById('game-question'), a = document.getElementById('game-answers');
  if (q) q.textContent = `${gameIdx + 1}. ${item.q}`;
  if (a) a.innerHTML = item.a.map((t, i) => `<button class="mini-btn" data-ans="${i}">${escapeHtml(t)}</button>`).join('');
  a.querySelectorAll('[data-ans]').forEach(b => b.onclick = () => {
    const ok = Number(b.dataset.ans) === item.correct;
    if (ok) gameScore++;
    const s = document.getElementById('game-score');
    if (s) s.textContent = ok ? `✓ Corect! Puncte: ${gameScore}` : `✗ Răspunsul corect: ${item.a[item.correct]}. Puncte: ${gameScore}`;
    gameIdx++;
    setTimeout(() => {
      if (gameIdx < GAME_QUESTIONS.length) renderGameQuestion();
      else if (s) s.textContent = `🏆 Ai terminat cu ${gameScore}/${GAME_QUESTIONS.length} puncte!`;
    }, 650);
  });
}

// ---------- Events ----------
function bindEvents() {
  bindAccountEvents();
  document.getElementById('theme-toggle').onclick = toggleTheme;

  ['f-start','f-end','f-start2','f-end2','f-break'].forEach(id => {
    const input = document.getElementById(id);
    if (input) input.oninput = updateFormHint;
  });

  // Original (APK) shift library — values from d.onCreate(), MECHANICS.md §2.
  const apkSel = document.getElementById('apk-shift-select');
  if (apkSel) {
    apkSel.innerHTML = MECHANICS.apkShifts.map(s =>
      `<option value="${s.id}">${escapeHtml(s.name)} — ${MECHANICS.shiftHours(s)}h (${s.start}${s.end && s.end!=='00:00' ? '-'+s.end : ''})</option>`
    ).join('');
    document.getElementById('add-apk-shift').onclick = () => {
      const src = MECHANICS.apkShifts.find(s => s.id === apkSel.value);
      if (!src) return;
      const c = cal();
      c.types.push({
        id: src.id + '_' + Date.now().toString(36), name: src.name, code: src.code,
        hours: MECHANICS.shiftHours(src), group:'shift', builtin:false, cls:'zi',
        category: src.split ? 'Ture de 8 ore' : 'Altele',
        clock: { start:src.start, end:src.end, start2:src.split?src.start2:'', end2:src.split?src.end2:'', split:src.split },
        breakMin: 0, bg: src.bg, fg: src.fg
      });
      closeShiftForm(); saveState(); renderAll();
    };
  }

  document.getElementById('calendar-select').onchange = e => {
    state.activeId = e.target.value; ui.selectedPoss = null; ui.selectedFree = null; closeShiftForm();
    saveState(); renderAll();
  };
  document.getElementById('cal-new').onclick = async () => {
    const name = await uiPrompt('Numele noului calendar', 'Calendar nou', 'Creează');
    if (!name) return;
    const c = makeCalendar(name.trim());
    state.calendars.push(c); state.activeId = c.id;
    saveState(); renderAll();
  };
  document.getElementById('cal-rename').onclick = async () => {
    const c = cal();
    const name = await uiPrompt('Numele calendarului', c.name, 'Salvează');
    if (!name || !name.trim()) return;
    c.name = name.trim(); saveState(); renderAll();
  };
  document.getElementById('cal-delete').onclick = async () => {
    if (state.calendars.length === 1) { uiAlert('Trebuie să rămână cel puțin un calendar.'); return; }
    if (!(await uiConfirm(`Ștergi calendarul „${cal().name}”? Turele lui se pierd.`, 'Șterge'))) return;
    state.calendars = state.calendars.filter(x => x.id !== state.activeId);
    state.activeId = state.calendars[0].id;
    saveState(); renderAll();
  };

  document.getElementById('tura-type').onchange = e => {
    cal().pattern = e.target.value;
    saveState();
    renderTypeOptions();
  };
  function setTypeHours(id, elId, fallback) {
    const t = cal().types.find(x => x.id === id);
    if (t) { t.hours = Number(document.getElementById(elId).value) || fallback; t.clock = null; }
    saveState(); renderPalettes(); renderLegend(); renderCalc();
  }
  document.getElementById('custom-ore-input').oninput = e => {
    cal().customHours = Number(e.target.value) || 14;
    setTypeHours('Z', 'custom-ore-input', 14);
  };
  document.getElementById('custom-zi-hours').oninput = () => { setTypeHours('Z', 'custom-zi-hours', 14); };
  document.getElementById('custom-noapte-hours').oninput = () => { setTypeHours('N', 'custom-noapte-hours', 13); };

  document.getElementById('btn-apply').onclick = () => { ui.paint = !ui.paint; renderPaintState(); };
  document.getElementById('gen-pattern').onclick = generatePattern;
  document.getElementById('btn-clear-all').onclick = async () => {
    if (!(await uiConfirm('Ștergi toate turele și concediile marcate în acest calendar?', 'Șterge tot'))) return;
    cal().assignments = {}; saveState(); renderAll();
  };

  document.getElementById('gen-scope').onchange = e => {
    cal().genScope = e.target.value; saveState(); renderGenControls();
  };
  document.getElementById('gen-start').oninput = e => { cal().genStart = Number(e.target.value) || 1; saveState(); };
  // Perioada completă: zi, lună și an pentru fiecare capăt.
  [['From','from'],['To','to']].forEach(([prop, pfx]) => {
    ['d','m','y'].forEach(part => {
      const el = document.getElementById(`gen-${pfx}-${part}`);
      if (!el) return;
      const handler = () => {
        const c = cal();
        if (!c['range' + prop]) c['range' + prop] = { d:1, m:c.month, y:c.year };
        c['range' + prop][part] = Number(el.value) || (part === 'm' ? 0 : 1);
        saveState();
      };
      el.oninput = handler; el.onchange = handler;
    });
  });

  document.getElementById('view-month').onclick = () => { cal().view = 'month'; saveState(); renderCalendar(); };
  document.getElementById('view-year').onclick  = () => { cal().view = 'year';  saveState(); renderCalendar(); };
  document.getElementById('btn-refresh-year').onclick = () => { renderCalendar(); };
  document.getElementById('btn-update-holidays').onclick = updateHolidays;
  document.getElementById('btn-update-holidays-main').onclick = updateHolidays;

  // --- Panoul de setări (categoriile de tură au fost mutate aici, de pe ecranul principal) ---
  document.getElementById('settings-btn').onclick = openSettings;
  document.getElementById('settings-close').onclick = closeSettings;
  document.getElementById('settings-modal').onclick = e => {
    if (e.target.id === 'settings-modal') closeSettings();
  };
  document.querySelectorAll('.set-tab').forEach(tab => tab.onclick = () => {
    document.querySelectorAll('.set-tab').forEach(t => t.classList.toggle('active', t === tab));
    document.querySelectorAll('.set-pane').forEach(p =>
      p.style.display = p.dataset.pane === tab.dataset.tab ? 'block' : 'none');
  });
  document.getElementById('set-theme-light').onclick = () => setTheme('light');
  document.getElementById('set-theme-dark').onclick = () => setTheme('dark');
  document.getElementById('keep-existing').onchange = e => { cal().keepExisting = e.target.checked; saveState(); };
  document.getElementById('set-currency').oninput = e => { cal().currency = e.target.value || '€'; saveState(); renderCalc(); };

  // --- Setări de Pontaj Ture ---
  const on = (id, evt, fn) => { const el = document.getElementById(id); if (el) el[evt] = fn; };
  on('set-language', 'onchange', e => { cal().language = e.target.value; saveState(); renderCalendar(); });
  on('set-income', 'oninput', e => { cal().incomePerHour = Number(e.target.value) || 0; saveState(); renderCalc(); });
  on('set-badge-font', 'oninput', e => { cal().badgeFont = Number(e.target.value) || 10; saveState(); renderCalendar(); });
  on('set-tipo-horas', 'onchange', e => { cal().tipoHoras = e.target.value; saveState(); renderPalettes(); renderCalc(); });
  on('set-auto-calc', 'onchange', e => { cal().autoCalc = e.target.checked; saveState(); });
  on('set-default-break', 'oninput', e => { cal().defaultBreak = Math.max(0, Number(e.target.value) || 0); saveState(); });
  on('set-note-bg', 'oninput', e => { cal().noteBg = e.target.value; saveState(); });
  on('set-note-text', 'oninput', e => { cal().noteText = e.target.value; saveState(); });
  on('set-note-opacity', 'oninput', e => {
    cal().noteOpacity = Number(e.target.value) || 0; saveState();
    const v = document.getElementById('note-opacity-val');
    if (v) v.textContent = cal().noteOpacity + '%';
  });

  document.getElementById('pt-generate').onclick = generateShiftType;
  document.getElementById('pt-add').onclick = addBlankPattern;
  document.getElementById('cat-add').onclick = addCategory;

  document.getElementById('prev-month').onclick = () => changeMonth(-1);
  document.getElementById('next-month').onclick = () => changeMonth(1);

  // „Rămase din luna trecută” este OBLIGATORIU derivat din luna anterioară.
  const prevField = document.getElementById('extra-prev');
  if (prevField) { prevField.readOnly = false; }
  const autoBox = document.getElementById('auto-extra');
  if (autoBox) autoBox.style.display = 'none';
  document.getElementById('day-hours').oninput = e => {
    cal().dayHours = Number(e.target.value) || 14; saveState(); renderSDSL(); renderCalc(); renderSalary();
  };
  document.getElementById('night-hours').oninput = e => {
    cal().nightHours = Number(e.target.value) || 13; saveState(); renderSDSL(); renderCalc();
  };
  const sdslInclude = document.getElementById('sdsl-include');
  if (sdslInclude) sdslInclude.onchange = e => {
    cal().sdslInclude = e.target.checked; saveState(); ui.selectedPoss = null; renderCalc();
  };
  const sdslFreeBtn = document.getElementById('sdsl-free-toggle');
  if (sdslFreeBtn) sdslFreeBtn.onclick = () => {
    const content = document.getElementById('sdsl-free-content');
    const open = !content || content.style.display === 'none';
    try { localStorage.setItem(SDSL_FREE_KEY, open ? '1' : '0'); } catch (e) { /* storage blocat */ }
    applySdslFreeCollapse();
  };
  applySdslFreeCollapse();
  document.getElementById('extra-next').oninput = e => {
    const c = cal(), rec = carryRec(c, c.year, c.month);
    rec.v = Number(e.target.value) || 0; rec.manual = true;
    ui.selectedPoss = null; saveState(); renderCalc();
  };
  const carryReset = document.getElementById('carry-reset');
  if (carryReset) carryReset.onclick = () => {
    const c = cal(), rec = carryRec(c, c.year, c.month);
    rec.manual = false; rec.pinned = false; ui.selectedPoss = null; saveState(); renderAll();
  };

  // --- Tura nouă: buton retractabil — o apăsare deschide, următoarea ascunde din nou ---
  document.getElementById('btn-new-shift').onclick = () => {
    const btn = document.getElementById('btn-new-shift');
    if (ui.formMode === 'new' && !ui.editing) { closeShiftForm(); return; }
    ui.formMode = 'new'; ui.editing = null;
    document.getElementById('form-title').textContent = 'Tura nouă';
    document.getElementById('f-name').value = '';
    const firstCat = cal().categories[0] ? cal().categories[0].name : 'Altele';
    document.getElementById('f-category').value = firstCat;
    document.getElementById('f-code').value = '';
    document.getElementById('f-hours').value = '';
    document.getElementById('f-break').value = cal().defaultBreak || 0;
    ['f-start','f-end','f-start2','f-end2'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('f-color').value = '#E6F1FB';
    document.getElementById('f-use-color').checked = false;
    document.getElementById('f-delete').style.display = 'none';
    document.getElementById('shift-form').style.display = 'block';
    btn.setAttribute('aria-expanded', 'true');
    btn.textContent = '▾ − Tura nouă (ascunde)';
    updateFormHint();
  };
  document.getElementById('f-cancel').onclick = closeShiftForm;
  document.getElementById('f-save').onclick = saveShiftForm;
  document.getElementById('f-delete').onclick = deleteShift;

  // --- Salariu pe tură / mini-joc ---
  const pay = document.getElementById('pay-per-shift');
  if (pay) pay.onchange = e => {
    cal().payPerShift = e.target.value.trim() === '' ? null : Number(e.target.value) || 0;
    saveState(); renderSalary(); autoOpenMenus(['salariu']);
  };
  const mult = document.getElementById('double-multiplier');
  if (mult) mult.onchange = e => {
    cal().doubleMultiplier = Number(e.target.value) || 2;
    saveState(); renderSalary();
  };
  const gtoggle = document.getElementById('game-invites-toggle');
  if (gtoggle) gtoggle.onchange = e => { cal().gameInvites = e.target.checked; saveState(); };
  on('btn-sal-detalii', 'onclick', () => toggleSalaryPanel('detalii'));
  on('btn-sal-setari', 'onclick', () => toggleSalaryPanel('setari'));
  on('btn-sal-open', 'onclick', () => {
    if (document.getElementById('sal-panel-setari').style.display === 'none') toggleSalaryPanel('setari');
    const p = document.getElementById('pay-per-shift'); if (p) p.focus();
  });
  on('btn-game-play', 'onclick', openGame);

  // --- Export calendar (.ics) ---
  on('btn-ics-toggle', 'onclick', toggleIcsPanel);
  on('btn-ics-export', 'onclick', exportIcs);
  on('ics-alarm2', 'onchange', e => {
    const row = document.getElementById('ics-alarm2-row');
    if (row) row.style.display = e.target.checked ? 'flex' : 'none';
  });
}

// Uses the recovered o0.c() rule and the shipped "FinalizaDiaSiguiente" message.
function updateFormHint() {
  const el = document.getElementById('f-hint');
  if (!el) return;
  const st  = document.getElementById('f-start').value;
  const en  = document.getElementById('f-end').value;
  const st2 = document.getElementById('f-start2').value;
  const en2 = document.getElementById('f-end2').value;
  const breakMin = Number(document.getElementById('f-break').value) || 0;
  const clock = { start:st, end:en, start2:st2, end2:en2, split: !!(st2 && en2) };
  const nextDay = (a, b) => !!a && !!b && MECHANICS.compareTimes(a, b) === 2;
  const notes = [];
  const nextDayText = (MECHANICS.strings && MECHANICS.strings.FinalizaDiaSiguiente) || '*Se încheie a doua zi după';
  if (nextDay(st, en))  notes.push(nextDayText);
  if (nextDay(st2, en2)) notes.push(nextDayText + ' (tura a doua)');
  const sched = MECHANICS.scheduleText(clock);
  const auto = cal().autoCalc !== false;
  if (auto && st && en && st !== en) {
    const computed = MECHANICS.shiftHours({ hours:null, clock, breakMin });
    document.getElementById('f-hours').value = computed;
    el.textContent = notes.length
      ? `${sched} ${notes.join(' · ')} → ${computed} ore`
      : `${sched} → ${computed} ore pontate`;
  } else {
    el.textContent = notes.join(' · ');
  }
}

function saveShiftForm() {
  const c = cal();
  const name = document.getElementById('f-name').value.trim();
  const category = document.getElementById('f-category').value;
  const code = document.getElementById('f-code').value.trim() || (name ? name[0].toUpperCase() : '?');
  const hoursIn = Number(document.getElementById('f-hours').value);
  const breakMin = Math.max(0, Number(document.getElementById('f-break').value) || 0);
  const st  = document.getElementById('f-start').value;
  const en  = document.getElementById('f-end').value;
  const st2 = document.getElementById('f-start2').value;
  const en2 = document.getElementById('f-end2').value;
  if (!name) { uiAlert('Scrie denumirea turei.'); return; }
  const auto = cal().autoCalc !== false;
  const hasClock = auto && !!(st && en && st !== en);
  const hours = hasClock
    ? MECHANICS.shiftHours({ hours:null, clock:{ start:st, end:en, start2:st2, end2:en2, split: !!(st2 && en2) }, breakMin })
    : Number(hoursIn);
  if (isNaN(hours) || hours < 0 || hours > 24) { uiAlert('Orele trebuie să fie între 0 și 24.'); return; }

  const chosenCat = c.categories.find(x => x.name === category);
  const useColor = !!document.getElementById('f-use-color').checked;
  const hex = document.getElementById('f-color').value || '#E6F1FB';
  const data = {
    name, category, code, hours, group:'shift',
    cls: chosenCat ? chosenCat.cls : (CATEGORY_CLS[category] || 'rec'),
    bg: useColor ? hex : null,
    fg: useColor ? contrastColor(hex) : null,
    breakMin,
    clock: hasClock ? { start:st, end:en, start2:st2, end2:en2, split: !!(st2 && en2) } : null,
    skipNonWorking: !!(document.getElementById('f-skip-nonwork') || {}).checked,
  };

  if (ui.formMode === 'edit' && ui.editing) {
    const t = c.types.find(x => x.id === ui.editing);
    if (!t) return;
    Object.assign(t, data);
  } else {
    c.types.push({ id:'x_' + Date.now().toString(36), builtin:false, ...data });
  }
  closeShiftForm(); saveState(); renderAll();
}

async function deleteShift() {
  if (ui.formMode !== 'edit' || !ui.editing) return;
  const c = cal(), t = c.types.find(x => x.id === ui.editing);
  if (!t) return;
  if (t.builtin) { uiAlert('Turele de bază nu se pot șterge, dar le poți edita.'); return; }
  if (!(await uiConfirm(`Ștergi tura „${t.name}”?`, 'Șterge'))) return;
  c.types = c.types.filter(x => x.id !== t.id);
  Object.keys(c.assignments).forEach(k => {
    c.assignments[k] = (c.assignments[k] || []).filter(id => id !== t.id);
    if (!c.assignments[k].length) delete c.assignments[k];
  });
  closeShiftForm(); saveState(); renderAll();
}

function openEditor(id) {
  const t = typeById(cal(), id);
  if (!t || t.group === 'leave') return;
  ui.formMode = 'edit'; ui.editing = id;
  document.getElementById('form-title').textContent = `Editează tura: ${t.name}`;
  document.getElementById('f-name').value = t.name;
  const catSel = document.getElementById('f-category');
  catSel.value = t.category;
  if (!catSel.value && t.category) {
    catSel.add(new Option(t.category, t.category)); catSel.value = t.category;
  }
  document.getElementById('f-code').value = t.code;
  document.getElementById('f-hours').value = MECHANICS.shiftHours(t);
  document.getElementById('f-break').value = t.breakMin || 0;
  const sk = document.getElementById('f-skip-nonwork'); if (sk) sk.checked = !!t.skipNonWorking;
  document.getElementById('f-use-color').checked = !!t.bg;
  document.getElementById('f-color').value = t.bg || '#E6F1FB';
  const ck = t.clock || {};
  document.getElementById('f-start').value  = ck.start || '';
  document.getElementById('f-end').value    = ck.end || '';
  document.getElementById('f-start2').value = ck.start2 || '';
  document.getElementById('f-end2').value   = ck.end2 || '';
  document.getElementById('f-delete').style.display = 'inline-block';
  document.getElementById('shift-form').style.display = 'block';
  const btn = document.getElementById('btn-new-shift');
  if (btn) { btn.setAttribute('aria-expanded', 'true'); btn.textContent = '▾ − Tura nouă (ascunde)'; }
  updateFormHint();
  autoOpenMenus(['gen', 'cat']);
  if (window.goToSection) setTimeout(() => window.goToSection('shift-form'), 60);
}
function closeShiftForm() {
  ui.formMode = null; ui.editing = null;
  const el = document.getElementById('shift-form');
  if (el) el.style.display = 'none';
  const btn = document.getElementById('btn-new-shift');
  if (btn) { btn.setAttribute('aria-expanded', 'false'); btn.textContent = '▶ + Tura nouă'; }
}

// ---------- Editarea unei zile din calendar ----------
function openDayEditor(d) {
  const c = cal(), k = key(c.year, c.month, d);
  const det = (c.dayDetails || {})[k] || {};
  const ids = c.assignments[k] || [];
  const chips = ids.map(id => {
    const t = typeById(c, id);
    return t ? `<span class="day-type-chip">${escapeHtml(t.name)} (${MECHANICS.shiftHours(t)}h)<button data-rmday="${id}" title="Elimină tura">✕</button></span>` : '';
  }).join('') || '<span class="hint inline">Nicio tură în această zi.</span>';
  // Afișăm exact ce se ia în calcul în ACEASTĂ zi calendaristică, după
  // împărțirea la miezul nopții — ca regula să fie vizibilă persoanei.
  const dayH = effectiveDayHours(c, c.year, c.month, d);
  const ownNames = ids.map(id => { const t = typeById(c, id); return t ? t.name : null; }).filter(Boolean);
  const prevD = new Date(c.year, c.month, d - 1);
  const prevIds = c.assignments[key(prevD.getFullYear(), prevD.getMonth(), prevD.getDate())] || [];
  const prevNames = prevIds.map(id => { const t = typeById(c, id); return t ? t.name : null; }).filter(Boolean);
  const effTxt = dayH > 0
    ? `${fmtHours(dayH)}h pontate în această zi calendaristică` +
      (hasManualHours(c, c.year, c.month, d) ? ' (editare manuală)' :
        (ownNames.length ? ' — ' + escapeHtml(ownNames.join(' + ')) : '')) +
      (prevNames.length && !hasManualHours(c, c.year, c.month, d)
        ? ` + ore după miezul nopții din ${escapeHtml(prevNames.join(' + '))}` : '')
    : '0h (zi nelucrătoare)';
  const allTypes = [...c.types, ...LEAVE_TYPES];
  const opts = allTypes.map(t => `<option value="${t.id}">${escapeHtml(t.name)} (${MECHANICS.shiftHours(t)}h)</option>`).join('');
  const box = document.getElementById('day-editor');
  const monthName = new Date(c.year, c.month, d).toLocaleDateString('ro-RO', { month:'long', year:'numeric' });
  box.innerHTML = `
    <div class="editor-title">Editează ziua ${d} · ${monthName}</div>
    <div class="day-type-list">${chips}</div>
    <p class="hint" style="margin:6px 0">În calendar se iau în calcul: <b>${effTxt}</b>. Turele suprapuse nu se adună.</p>
    <div class="row wrap-row">
      <select id="day-add-type" class="grow">${opts}</select>
      <button class="mini-btn" id="day-add-btn">+ Adaugă tură</button>
    </div>
    <div class="row wrap-row" style="margin-top:10px">
      <label>Ore pontate în această zi (gol = calcul automat)
        <input type="number" id="day-hours-in" class="ore-input" step="0.5" min="0" max="24" value="${det.hoursOverride != null ? det.hoursOverride : ''}" placeholder="auto" />
      </label>
      <label>Ore suplimentare ziua
        <input type="number" id="day-extra-in" class="ore-input" step="1" value="${det.extra || 0}" />
      </label>
    </div>
    <div style="margin-top:10px">
      <label class="sub-label">Notițe</label>
      <textarea id="day-note-in" style="background:${escapeHtml(c.noteBg || '#ffffff')};color:${escapeHtml(c.noteText || '#1a1a1a')};opacity:${(Number(c.noteOpacity) || 100) / 100}" placeholder="Observații pentru această zi…">${escapeHtml(det.note || '')}</textarea>
    </div>
    <div class="row wrap-row" style="margin-top:10px">
      <button class="mini-btn" id="day-save">Salvează ziua</button>
      <button class="mini-btn ghost" id="day-close">Închide</button>
    </div>`;
  box.style.display = 'block';
  box.querySelectorAll('[data-rmday]').forEach(b => b.onclick = () => {
    const id = b.dataset.rmday;
    c.assignments[k] = (c.assignments[k] || []).filter(x => x !== id);
    saveState(); renderAll(); openDayEditor(d);
  });
  document.getElementById('day-add-btn').onclick = () => {
    const id = document.getElementById('day-add-type').value;
    const arr = c.assignments[k] || [];
    if (!arr.includes(id)) arr.push(id);
    c.assignments[k] = arr;
    saveState(); renderAll(); openDayEditor(d);
  };
  document.getElementById('day-save').onclick = () => {
    c.dayDetails = c.dayDetails || {};
    const h = document.getElementById('day-hours-in').value;
    const e = document.getElementById('day-extra-in').value;
    const n = document.getElementById('day-note-in').value;
    c.dayDetails[k] = { hoursOverride: h === '' ? null : Number(h), extra: Number(e) || 0, note:n };
    saveState(); closeDayEditor(); renderAll();
    // Mesajul fluxului: calendarul a fost verificat și validat → pasul 3 (totaluri/salariu).
    if (Object.keys(c.assignments || {}).length > 0) activateWizard(3);
  };
  document.getElementById('day-close').onclick = closeDayEditor;
  box.scrollIntoView({ behavior:'smooth', block:'nearest' });
}
function closeDayEditor() {
  const box = document.getElementById('day-editor');
  if (box) { box.style.display = 'none'; box.innerHTML = ''; }
}

function changeMonth(dir) {
  const c = cal();
  if (c.view === 'year') { c.year += dir; saveState(); renderAll(); return; }
  // Nu mai copiem nimic între luni: fiecare lună își derivează singură orele
  // rămase din luna anterioară din registrul „carry”, deci sincronizarea e automată.
  c.month += dir;
  if (c.month > 11) { c.month = 0; c.year++; }
  if (c.month < 0) { c.month = 11; c.year--; }
  ui.selectedPoss = null; ui.selectedFree = null;
  saveState(); renderAll();
}

function fillSelects() {
  ['gen-from-m', 'gen-to-m'].forEach(id => {
    const sel = document.getElementById(id);
    if (sel) sel.innerHTML = MONTHS_RO.map((n, i) => `<option value="${i}">${n}</option>`).join('');
  });
  const cs = document.getElementById('cat-new-color');
  if (cs) cs.innerHTML = COLOR_OPTIONS.map(([v,n]) => `<option value="${v}">${n}</option>`).join('');
}

// ---------- Init ----------
(function init() {
  applyTheme(state.theme || 'light');
  fillSelects();
  document.getElementById('tura-type').value = cal().pattern;
  document.getElementById('custom-panel').style.display = cal().pattern === 'custom' ? 'block' : 'none';
  document.getElementById('custom-ore-input').value = cal().customHours;
  document.getElementById('custom-zi-hours').value = (cal().types.find(t => t.id === 'Z') || {}).hours || 14;
  document.getElementById('custom-noapte-hours').value = (cal().types.find(t => t.id === 'N') || {}).hours || 13;
  bindEvents();
  bindLiveSync();
  renderAll();
  initMenus();
  initNotifications();
  checkSupabaseSession();   // reia sesiunea și datele salvate în Supabase la pornire
  syncHolidaysHybrid({ quiet:true });  // actualizare automată, non-blocantă, cu cache offline
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
