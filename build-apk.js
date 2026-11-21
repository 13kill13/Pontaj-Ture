// Packages the finished static site into a genuine, signed Android APK.
// The toolchain (JDK + Android SDK) lives in app/.apk-toolchain and is used only here.
// If it is not present, the static build still succeeds and simply reports the skip.
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const zlib = require('zlib');

const root = __dirname;
const dist = path.join(root, 'dist');
const tc = path.join(root, '.apk-toolchain');
const sdkRoot = path.join(tc, 'sdk');
const buildTools = path.join(sdkRoot, 'build-tools', '34.0.0');
const androidJar = path.join(sdkRoot, 'platforms', 'android-34', 'android.jar');
const java = path.join(tc, 'jdk', 'bin', 'java');
const javac = path.join(tc, 'jdk', 'bin', 'javac');
const keytool = path.join(tc, 'jdk', 'bin', 'keytool');
const aapt2 = path.join(buildTools, 'aapt2');
const d8 = path.join(buildTools, 'd8');
const zipalign = path.join(buildTools, 'zipalign');
const apksigner = path.join(buildTools, 'apksigner');
const work = path.join(root, '.apk-build');
const outApk = path.join(dist, 'Pontaj Ture.apk');
const keystore = path.join(tc, 'release.jks');
const storePass = 'calculator2026';

function run(cmd, args) {
  const env = Object.assign({}, process.env, {
    JAVA_HOME: path.join(tc, 'jdk'),
    PATH: path.join(tc, 'jdk', 'bin') + path.delimiter + (process.env.PATH || '')
  });
  const r = cp.spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, env });
  if (r.error) throw r.error;
  if (r.status !== 0) {
    throw new Error(path.basename(cmd) + ' failed (' + r.status + '):\n' + (r.stdout || '') + '\n' + (r.stderr || ''));
  }
  return r.stdout || '';
}

// --- small stored-ZIP writer (an APK is a ZIP; stored entries are valid and zipalign fixes alignment)
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
function zipStore(entries) {
  const locals = [], central = [];
  let offset = 0;
  entries.forEach(e => {
    const name = Buffer.from(e.name, 'utf8'), data = e.data;
    const crc = crc32(data);
    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034B50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(0, 6);
    lh.writeUInt16LE(0, 8); lh.writeUInt16LE(0, 10); lh.writeUInt16LE(0, 12);
    lh.writeUInt32LE(crc, 14); lh.writeUInt32LE(data.length, 18); lh.writeUInt32LE(data.length, 22);
    lh.writeUInt16LE(name.length, 26); lh.writeUInt16LE(0, 28);
    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(0x02014B50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6);
    ch.writeUInt16LE(0, 8); ch.writeUInt16LE(0, 10); ch.writeUInt16LE(0, 12); ch.writeUInt16LE(0, 14);
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
function copyTree(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const name of fs.readdirSync(src)) {
    const s = path.join(src, name), d = path.join(dest, name);
    if (fs.statSync(s).isDirectory()) copyTree(s, d);
    else fs.copyFileSync(s, d);
  }
}
function filesUnder(dir, base) {
  const out = [];
  for (const name of fs.readdirSync(dir).sort()) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) out.push(...filesUnder(p, base));
    else out.push({ name: path.relative(base, p).split(path.sep).join('/'), data: fs.readFileSync(p) });
  }
  return out;
}

module.exports = function buildApk() {
  const needed = [java, javac, keytool, aapt2, d8, zipalign, apksigner, androidJar];
  if (needed.some(p => !fs.existsSync(p))) {
    console.log('APK: Android toolchain not present — skipped (static site still built).');
    return null;
  }

  fs.rmSync(work, { recursive: true, force: true });
  ['apk', 'classes', 'dex', 'gen', 'res/values', 'res/mipmap-mdpi', 'res/mipmap-hdpi',
   'res/mipmap-xhdpi', 'res/mipmap-xxhdpi', 'res/mipmap-xxxhdpi'].forEach(d => fs.mkdirSync(path.join(work, d), { recursive: true }));

  // 1. The offline website that goes inside the app.
  const www = path.join(work, 'www');
  fs.mkdirSync(www, { recursive: true });
  const siteFiles = ['index.html', 'calculator-salariu.html', 'styles.css', 'app.js',
    'holidays-data.js', 'mechanics-data.js', 'supabase.js', 'manifest.json', 'icon.svg',
    'icon-192.png', 'icon-512.png', 'sw.js',
    'guides-data.js', 'guides.js', 'modules/day-details.js'];
  for (const f of siteFiles) {
    if (!fs.existsSync(path.join(dist, f))) throw new Error('APK: missing site file ' + f);
    let data = fs.readFileSync(path.join(dist, f));
    if (/\.html$/.test(f)) {
      // file:// URLs do not need the HTTP cache-bust query; strip it for the APK copy only.
      data = Buffer.from(data.toString('utf8').replace(/(\.(?:js|css))\?v=[0-9a-f]+/g, '$1'));
    }
    fs.mkdirSync(path.dirname(path.join(www, f)), { recursive: true });
    fs.writeFileSync(path.join(www, f), data);
  }

  // 2. Resources: launcher icons from the generated PNGs + the shipped values XML.
  const iconSmall = path.join(dist, 'icon-192.png'), iconBig = path.join(dist, 'icon-512.png');
  for (const dpi of ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi']) {
    const dir = path.join(work, 'res', 'mipmap-' + dpi);
    fs.copyFileSync(dpi === 'xxxhdpi' ? iconBig : iconSmall, path.join(dir, 'ic_launcher.png'));
    fs.copyFileSync(dpi === 'xxxhdpi' ? iconBig : iconSmall, path.join(dir, 'ic_launcher_round.png'));
  }
  copyTree(path.join(root, 'android', 'res', 'values'), path.join(work, 'res', 'values'));

  // 3. Compile and link Android resources into a base APK.
  const flata = path.join(work, 'compiled.flata'), base = path.join(work, 'base.apk');
  run(aapt2, ['compile', '--dir', path.join(work, 'res'), '-o', flata]);
  run(aapt2, ['link', '-o', base, '-I', androidJar,
    '--manifest', path.join(root, 'android', 'AndroidManifest.xml'),
    flata, '--java', path.join(work, 'gen'),
    '--min-sdk-version', '21', '--target-sdk-version', '34',
    '--version-code', '1', '--version-name', '1.0']);

  // 4. The WebView activity.
  const classes = path.join(work, 'classes');
  run(javac, ['-source', '8', '-target', '8', '-bootclasspath', androidJar, '-encoding', 'UTF-8',
    '-d', classes, path.join(root, 'android', 'src', 'com', 'pontajture', 'mobile', 'MainActivity.java')]);
  const dexDir = path.join(work, 'dex');
  run(d8, ['--lib', androidJar, '--min-api', '21', '--output', dexDir,
    path.join(classes, 'com', 'pontajture', 'mobile', 'MainActivity.class')]);

  // 5. Assemble: base resources + classes.dex + the site in assets/www.
  const apkDir = path.join(work, 'apk');
  run('unzip', ['-q', '-o', base, '-d', apkDir]);
  fs.copyFileSync(path.join(dexDir, 'classes.dex'), path.join(apkDir, 'classes.dex'));
  copyTree(www, path.join(apkDir, 'assets', 'www'));
  const entries = filesUnder(apkDir, apkDir)
    .sort((a, b) => (a.name === 'resources.arsc' ? -1 : b.name === 'resources.arsc' ? 1 : 0));
  const unsigned = path.join(work, 'unsigned.apk'), aligned = path.join(work, 'aligned.apk');
  fs.writeFileSync(unsigned, zipStore(entries));
  run(zipalign, ['-f', '4', unsigned, aligned]);

  // 6. Sign with a stable key so later builds upgrade cleanly on the phone.
  if (!fs.existsSync(keystore)) {
    run(keytool, ['-genkeypair', '-keystore', keystore, '-storepass', storePass, '-keypass', storePass,
      '-alias', 'calculator', '-keyalg', 'RSA', '-keysize', '2048', '-validity', '10000',
      '-dname', 'CN=Pontaj Ture, OU=Personal, O=Pontaj Ture, L=Bucuresti, ST=Bucuresti, C=RO']);
  }
  run(apksigner, ['sign', '--ks', keystore, '--ks-pass', 'pass:' + storePass, '--key-pass', 'pass:' + storePass,
    '--v1-signing-enabled', 'true', '--v2-signing-enabled', 'true',
    '--out', outApk, aligned]);
  const verify = run(apksigner, ['verify', '--verbose', outApk]);
  if (!/Verifies|Verified/i.test(verify)) throw new Error('APK: apksigner did not verify the result');

  const size = (fs.statSync(outApk).size / 1024 / 1024).toFixed(2);
  console.log('APK: signed ' + path.basename(outApk) + ' (' + size + ' MB, offline site bundled, ' +
    syncHint(verify) + ').');
  return outApk;
};
function syncHint(verify) {
  const v1 = /v1 scheme/i.test(verify), v2 = /v2 scheme/i.test(verify);
  return 'signature v1=' + (v1 ? 'yes' : 'no') + ' v2=' + (v2 ? 'yes' : 'no');
}
