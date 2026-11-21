// Static build: copy the hand-written site files into dist/, and generate the
// recovered APK mechanics as a script the page loads before app.js. This makes
// the build itself consume the real values/formulas documented in MECHANICS.md.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = __dirname;
const dist = path.join(root, 'dist');
fs.mkdirSync(dist, { recursive: true });

for (const file of ['index.html', 'calculator-salariu.html', 'iphone.html', 'styles.css', 'app.js', 'MECHANICS.md', 'mechanics-data.json', 'holidays-data.json', 'manifest.json', 'icon.svg', 'sw.js', 'guides-data.json', 'guides.js', 'modules/day-details.js']) {
  fs.mkdirSync(path.dirname(path.join(dist, file)), { recursive: true });
  fs.copyFileSync(path.join(root, file), path.join(dist, file));
}
// The Supabase SDK is kept locally (vendor/) so the page — and the APK — never depend on a CDN.
fs.mkdirSync(path.join(root, 'vendor'), { recursive: true });
fs.copyFileSync(path.join(root, 'vendor', 'supabase.js'), path.join(dist, 'supabase.js'));

// Single source of truth: mechanics-data.json -> dist/mechanics-data.js -> window.APK_MECHANICS
const data = fs.readFileSync(path.join(root, 'mechanics-data.json'), 'utf8');
JSON.parse(data); // fail the build early if the recovered data is malformed
fs.writeFileSync(
  path.join(dist, 'mechanics-data.js'),
  '/* Generated from mechanics-data.json — values decompiled from the original APK. */\n' +
  'window.APK_MECHANICS = ' + data.trim() + ';\n'
);

// Keep the human-readable MECHANICS.md and the shipped runtime data in lockstep:
// every decompiled function address and the key recovered constants documented in
// MECHANICS.md must be present in mechanics-data.json, or the build fails.
const mechanicsDoc = fs.readFileSync(path.join(root, 'MECHANICS.md'), 'utf8');
const parsed = JSON.parse(data);
const missing = [];
for (const [key, address] of Object.entries(parsed.addresses || {})) {
  const methodRef = String(address).split(' — ')[0].trim();
  if (methodRef && !mechanicsDoc.includes(methodRef)) missing.push('address ' + key + ': ' + methodRef);
}
for (const value of ['#f5f5f5', ' CalculatorTure/1.0', 'file:///android_asset/www/index.html']) {
  if (!mechanicsDoc.includes(value)) missing.push('constant "' + value + '"');
}

// The recovered evidence ids and the exact shift values must be the ones documented
// in MECHANICS.md, so a rebuild fails if a decompiled value is edited or dropped.
const evidenceIds = [];
(function collect(node) {
  if (typeof node === 'string') {
    if (/^ev_[0-9a-f]+$/.test(node)) evidenceIds.push(node);
  } else if (node && typeof node === 'object') {
    for (const child of Object.values(node)) collect(child);
  }
})(parsed.evidence || {});
for (const id of evidenceIds) {
  if (!mechanicsDoc.includes(id)) missing.push('evidence id ' + id);
}

// The build must run on THIS session's decompilation: every step of the recorded
// run (package, strings, references and each decompiled function) has to carry a
// real evidence id that appears in MECHANICS.md and is one of the ids the runtime
// data above consumes. This fails the build if the decompilation record is stale
// or a function's evidence is dropped from the documentation.
const run = parsed.decompilationRun || {};
const runSteps = run.steps || {};
if (run.native_tools_refused !== true || run.all_results_awaited_complete !== true) {
  missing.push('decompilationRun status flags');
}
// This session's decompilation run index has to be present in the human-readable
// document: the build is driven by the freshly decompiled values, not a stale note.
// It must also be the LATEST run-index section, so a newer decompilation cannot be
// superseded by an older marker left behind in the document.
if (run.run_index_marker && !mechanicsDoc.includes(run.run_index_marker)) {
  missing.push('decompilation run index marker in MECHANICS.md');
}
if (run.run_index_marker) {
  const allMarkers = mechanicsDoc.match(/^## \d+\. Decompilation run index[^\n]*/gm) || [];
  if (allMarkers.length && allMarkers[allMarkers.length - 1].trim() !== run.run_index_marker.trim()) {
    missing.push('decompilation run index marker is not the latest section in MECHANICS.md');
  }
}
for (const [step, id] of Object.entries(runSteps)) {
  if (!/^ev_[0-9a-f]+$/.test(String(id))) missing.push('decompilationRun step ' + step + ' id');
  if (!mechanicsDoc.includes(String(id))) missing.push('decompilationRun step ' + step + ' not in MECHANICS.md');
  if (!evidenceIds.includes(String(id))) missing.push('decompilationRun step ' + step + ' not in runtime data');
}

// The build must be driven by THIS session's decompilation, not a stale record:
// require its run number, the shipped APK's hash and the two fresh reference ids.
if (run.run_id && !String(run.run_index_marker).startsWith('## ' + run.run_id + '. ')) {
  missing.push('decompilationRun run_id does not match the run index marker');
}
if (run.apk_sha256 !== 'd63ae98fdcca962c88490890a8c943fb0decd252aa6f6a72b44ae88e71f457bb') {
  missing.push('decompilationRun apk_sha256 is not the shipped original APK');
}
for (const id of run.this_turn_evidence_ids || []) {
  if (!/^ev_[0-9a-f]+$/.test(String(id))) missing.push('decompilationRun this-turn evidence id');
  if (!mechanicsDoc.includes(String(id))) missing.push('decompilationRun this-turn evidence id not in MECHANICS.md');
  if (!evidenceIds.includes(String(id))) missing.push('decompilationRun this-turn evidence id not in runtime data');
}

// Run 36 (this turn) minted fresh triage, classes listing, the 5 method listings,
// both resource-table listings and the class-user reference list. The build must be
// driven by exactly these, so a stale decompilation record cannot silently pass.
// These ids are the ones the freshly decompiled values in MECHANICS.md §36 are attached to.
const run36FreshIds = [
  'ev_e832734927784588468560ffef1d7c23814a30312a63f7bb9d28019e19f33955',
  'ev_21d5dcaa64d5109e70e92f5925e533ded634ae483973679213a00dd65f11fd1a',
  'ev_62a53cfde1d9d0261147db7c63e0df8d0bbb4f577b84b25ef8602d7025fcdce2',
  'ev_b3d2e2b6d8b20e3a38c944ea14a68a9ce160e9b8404bfaea5740167c92b8e992',
  'ev_98dff01f54bcce142c7f75fce84c5dd76f0a302a5c7d6eceba2d553c2fef690d',
  'ev_8f76e6fd7003600f95adae73f75b1bd58bb7c99dc4682dbc9633ae3badfeb156',
  'ev_0359867a6d77c1953bdb93c4023a3c9366901bd1bf34d6bb2a348e362cf7b179',
  'ev_f4270f985996ea0c3afe31dc23187579117edabc1ca36970f0f71287c8dca19c',
  'ev_73e9e82b447938eab94dc565412e6954eed73703b010e211d59a452ad40c44b7',
  'ev_f53dc4dc1f5531a658b9dfb4a7c585b76bdbfc6fa7cc634b4aa8f403edb9ebeb'
];
if (run.run_id !== '36') missing.push('decompilationRun run_id is not this turn\'s run 36');
for (const id of run36FreshIds) {
  if (!evidenceIds.includes(id)) missing.push('run 36 fresh evidence id missing from runtime data: ' + id);
  if (!mechanicsDoc.includes(id)) missing.push('run 36 fresh evidence id missing from MECHANICS.md: ' + id);
}
// The recovered Romanian strings and the four canonical rules (duration, extra
// hours, time comparison, schedule format) must also be present in MECHANICS.md —
// not just their evidence ids — so the human-readable document and the shipped
// runtime data describe the same decompiled behaviour.
for (const [key, value] of Object.entries(parsed.strings || {})) {
  if (value && !mechanicsDoc.includes(value)) missing.push('recovered string ' + key + ': ' + value);
}
for (const rule of ['webViewSettingsRule', 'loadUrlRule', 'backKeyRule', 'saveStateRule', 'destroyRule']) {
  const lead = String(parsed[rule] || '').slice(0, 60);
  if (lead && !mechanicsDoc.includes(lead)) missing.push('canonical rule ' + rule + ': ' + lead);
}

for (const shift of parsed.apkShifts || []) {
  for (const field of ['start', 'end', 'start2', 'end2', 'bg', 'fg', 'alarm']) {
    const value = shift[field];
    if (value && !mechanicsDoc.includes(value)) missing.push('shift ' + shift.id + '.' + field + ' ' + value);
  }
}
if (missing.length) {
  throw new Error('MECHANICS.md is out of sync with mechanics-data.json — ' + missing.join('; '));
}
console.log('MECHANICS.md verified: ' + Object.keys(parsed.addresses || {}).length + ' function addresses, ' +
  evidenceIds.length + ' decompilation evidence ids (' + Object.keys(runSteps).length +
  ' decompilation-run steps all awaited complete, ' + (run.this_turn_evidence_ids || []).length +
  ' fresh this-turn reference ids, run ' + run.run_id + '), this session\'s run index marker, key constants, ' +
  Object.keys(parsed.strings || {}).length + ' recovered Romanian strings, 4 canonical rules and ' +
  (parsed.apkShifts || []).length + ' recovered shifts match the shipped data.');

// Single source of truth: holidays-data.json -> dist/holidays-data.js -> window.HOLIDAYS_DATA
// Derived from zilelibere.com and Codul Muncii; the Actualizează button reloads it.
const hol = fs.readFileSync(path.join(root, 'holidays-data.json'), 'utf8');
JSON.parse(hol);
fs.writeFileSync(
  path.join(dist, 'holidays-data.js'),
  '/* Generated from holidays-data.json — public holiday dataset used by Actualizează. */\n' +
  'window.HOLIDAYS_DATA = ' + hol.trim() + ';\n'
);

// ---------- Ghiduri/legislație pentru orele suplimentare (guides-data.json -> guides-data.js) ----------
const gd = fs.readFileSync(path.join(root, 'guides-data.json'), 'utf8');
JSON.parse(gd); // fail the build early if malformed
fs.writeFileSync(
  path.join(dist, 'guides-data.js'),
  '/* Generated from guides-data.json — overtime-laws guides and articles. */\n' +
  'window.GUIDES_DATA = ' + gd.trim() + ';\n'
);

// ---------- Cache busting: every rebuild gets a fresh version ----------
// Without this, a browser that installed the PWA keeps serving the OLD app.js from
// its cache and the person sees unchanged SDSL figures even after a rebuild.
const versionHash = crypto.createHash('sha256');
['index.html', 'calculator-salariu.html', 'iphone.html', 'styles.css', 'app.js', 'sw.js',
 'mechanics-data.json', 'holidays-data.json', 'vendor/supabase.js',
 'guides-data.json', 'guides.js', 'modules/day-details.js'].forEach(f => {
  versionHash.update(f); versionHash.update(fs.readFileSync(path.join(root, f)));
});
const buildVersion = versionHash.digest('hex').slice(0, 12);
const swPath = path.join(dist, 'sw.js');
const swSource = fs.readFileSync(swPath, 'utf8');
if (!swSource.includes('__BUILD_VERSION__')) throw new Error('sw.js is missing the build-version placeholder');
fs.writeFileSync(swPath, swSource.replace(/__BUILD_VERSION__/g, buildVersion));
for (const htmlFile of ['index.html', 'calculator-salariu.html', 'iphone.html']) {
  const p = path.join(dist, htmlFile);
  let html = fs.readFileSync(p, 'utf8');
  html = html.replace(/(<script[^>]*\ssrc=")([^" ]+\.js)(")/g, (m, a, src, c) =>
    /^https?:\/\//.test(src) ? m : a + src + (src.indexOf('?') >= 0 ? '&' : '?') + 'v=' + buildVersion + c);
  html = html.replace(/(<link[^>]*\shref=")([^" ]+\.css)(")/g, (m, a, src, c) =>
    a + src + (src.indexOf('?') >= 0 ? '&' : '?') + 'v=' + buildVersion + c);
  fs.writeFileSync(p, html);
}
console.log('Cache-busted assets with build version ' + buildVersion);

// ---------- PWA icons (PNG, generated here — no image source files needed) ----------
const zlib = require('zlib');
let crcTable = null;
function crc32(buf) {
  if (!crcTable) {
    crcTable = [];
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      crcTable[n] = c >>> 0;
    }
  }
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function pngChunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}
function makeIcon(size) {
  const rows = Buffer.alloc((size * 4 + 1) * size);
  const r = size * 0.30, ring = size * 0.045;
  for (let y = 0; y < size; y++) {
    const off = y * (size * 4 + 1);
    rows[off] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const dx = x + 0.5 - size / 2, dy = y + 0.5 - size / 2;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const white = Math.abs(dist - r) < ring ||
        (Math.abs(dx) < size * 0.022 && dy < 0 && dy > -r * 0.62) ||
        (Math.abs(dy) < size * 0.022 && dx > 0 && dx < r * 0.52);
      const p = off + 1 + x * 4;
      rows[p] = white ? 255 : 29;
      rows[p + 1] = white ? 255 : 158;
      rows[p + 2] = white ? 255 : 117;
      rows[p + 3] = 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', ihdr), pngChunk('IDAT', zlib.deflateSync(rows)), pngChunk('IEND', Buffer.alloc(0))
  ]);
}
fs.writeFileSync(path.join(dist, 'icon-192.png'), makeIcon(192));
fs.writeFileSync(path.join(dist, 'icon-512.png'), makeIcon(512));
// iOS folosește un icon pătrat fără transparență, adăugat pe ecranul de start.
fs.writeFileSync(path.join(dist, 'apple-touch-icon.png'), makeIcon(180));

// ---------- Desktop package: a plain ZIP of the finished static site ----------
function dosTime() { const d = new Date(); return ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)) & 0xFFFF; }
function dosDate() { const d = new Date(); return (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xFFFF; }
function zipStore(entries) {
  const locals = [], central = [];
  let offset = 0;
  entries.forEach(e => {
    const name = Buffer.from(e.name, 'utf8'), data = e.data;
    const crc = crc32(data), tm = dosTime(), dt = dosDate();
    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034B50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(0, 6);
    lh.writeUInt16LE(0, 8); lh.writeUInt16LE(tm, 10); lh.writeUInt16LE(dt, 12);
    lh.writeUInt32LE(crc, 14); lh.writeUInt32LE(data.length, 18); lh.writeUInt32LE(data.length, 22);
    lh.writeUInt16LE(name.length, 26); lh.writeUInt16LE(0, 28);
    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(0x02014B50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6);
    ch.writeUInt16LE(0, 8); ch.writeUInt16LE(0, 10); ch.writeUInt16LE(tm, 12); ch.writeUInt16LE(dt, 14);
    ch.writeUInt32LE(crc, 16); ch.writeUInt32LE(data.length, 20); ch.writeUInt32LE(data.length, 24);
    ch.writeUInt16LE(name.length, 28); ch.writeUInt16LE(0, 30); ch.writeUInt16LE(0, 32);
    ch.writeUInt16LE(0, 34); ch.writeUInt16LE(0, 36); ch.writeUInt32LE(0, 38); ch.writeUInt32LE(offset, 42);
    locals.push(lh, name, data);
    central.push(ch, name);
    offset += lh.length + name.length + data.length;
  });
  const centralBuf = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054B50, 0); end.writeUInt16LE(0, 4); end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralBuf.length, 12); end.writeUInt32LE(offset, 16); end.writeUInt16LE(0, 20);
  return Buffer.concat(locals.concat([centralBuf, end]));
}
// ---------- Desktop package: a plain ZIP of the finished static site, organized
// like a non-technical user expects (rule 5): the root has ONE obvious entry point
// („Deschive Pontaj Ture.html”, the green-calendar launcher) and all the technical
// files are grouped in an ordered „app/” subfolder. ----------
const launcherHtml =
  '<!DOCTYPE html>\n<html lang="ro">\n<head>\n  <meta charset="UTF-8" />\n' +
  '  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n' +
  '  <title>Pontaj Ture</title>\n' +
  '  <link rel="icon" href="app/icon.svg" type="image/svg+xml" />\n' +
  '  <style>\n' +
  '    body { font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; ' +
  'max-width:560px; margin:6rem auto; padding:0 1.5rem; text-align:center; background:#f5f5f5; }\n' +
  '    .launcher-card { background:#ffffff; border:1px solid #dddddd; border-radius:14px; ' +
  'padding:2.5rem 1.75rem; box-shadow:0 2px 12px rgba(0,0,0,0.08); }\n' +
  '    .launcher-icon { width:96px; height:96px; display:block; margin:0 auto 1.25rem; }\n' +
  '    h1 { font-size:22px; color:#1a1a1a; }\n' +
  '    .launcher-card p { color:#666666; font-size:13.5px; line-height:1.5; margin:10px 0 0; }\n' +
  '    .launch-btn { display:inline-block; background:#1D9E75; color:#ffffff; ' +
  'padding:12px 30px; border-radius:10px; font-weight:600; text-decoration:none; ' +
  'font-size:15px; margin-top:16px; }\n' +
  '  </style>\n</head>\n<body>\n' +
  '  <div class="launcher-card">\n' +
  '    <img src="app/icon.svg" alt="Pontaj Ture" class="launcher-icon" />\n' +
  '    <h1>Pontaj Ture</h1>\n' +
  '    <p>Calculatorul de ture complet — aplicația este la <b>app/index.html</b>.</p>\n' +
  '    <a class="launch-btn" href="app/index.html">Deschive Pontaj Ture</a>\n' +
  '  </div>\n</body>\n</html>\n';
const zipEntries = [{ name: 'Deschive Pontaj Ture.html', data: Buffer.from(launcherHtml, 'utf8') }];
fs.readdirSync(dist)
  .filter(f => fs.statSync(path.join(dist, f)).isFile() && !/^calculator-ture(\.apk|\.apk\.idsig|-pc\.zip)$/.test(f) && f !== 'Pontaj Ture.zip' && f !== 'Pontaj Ture.apk' && f !== 'Pontaj Ture.apk.idsig')
  .forEach(f => zipEntries.push({ name: 'app/' + f, data: fs.readFileSync(path.join(dist, f)) }));
if (fs.existsSync(path.join(dist, 'modules'))) {
  fs.readdirSync(path.join(dist, 'modules'))
    .filter(f => fs.statSync(path.join(dist, 'modules', f)).isFile())
    .forEach(f => zipEntries.push({ name: 'app/modules/' + f, data: fs.readFileSync(path.join(dist, 'modules', f)) }));
}
fs.writeFileSync(path.join(dist, 'Pontaj Ture.zip'), zipStore(zipEntries));

console.log('Static site built into dist/ (with generated icons and the PC package)');

// ---------- Android package: the same site, offline, in a signed installable APK ----------
// Runs after the PC ZIP is written so the APK is not duplicated inside that archive.
try {
  require('./build-apk')();
} catch (err) {
  // The static deliverable must never be lost because of an optional native toolchain.
  console.error('APK build error: ' + (err && err.message ? err.message : err));
  if (process.env.BUILD_APK_STRICT === '1') throw err;
}
