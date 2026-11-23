/* Service worker: instalare ca aplicație și funcționare offline.
   Fișierele statice sunt cache-uite; paginile încearcă rețeaua prima dată.
   __BUILD_VERSION__ este înlocuit de build cu o versiune nouă la fiecare
   reconstrucție, ca modificările (de ex. panoul SDSL) să ajungă la browser. */
const CACHE = 'pontaj-ture-v__BUILD_VERSION__';
const ASSETS = [
  './', './index.html', './calculator-salariu.html', './iphone.html', './styles.css',
  './app.js', './supabase.js', './holidays-data.js', './mechanics-data.js',
  './guides-data.js', './guides.js', './guides-data.json', './modules/day-details.js', './modules/dialogs.js', './modules/salary.js', './modules/sectors.js', './modules/ux.js', './modules/ux2.js', './modules/auth.js', './modules/i18n.js', './theme.js', './instalare.html', './calculator-salariu.html', './iphone.html',
  './holidays-data.json', './mechanics-data.json', './manifest.json',
  './icon.svg', './icon-192.png', './icon-512.png', './apple-touch-icon.png'
];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    // Nu eșuează dacă o resursă lipsește (de ex. în contextul root, unde
    // holidays-data.js etc. sunt generate la build): se cache-esc orașele
    // disponibile și app-ul continuă cu datele locale (app.js are valori de
    // întâmpinare). allSettled nu blochează instalarea niciodată.
    return Promise.allSettled(ASSETS.map(function (a) { return c.add(a); }));
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(function (res) {
      const copy = res.clone();
      caches.open(CACHE).then(function (c) { c.put('./index.html', copy); });
      return res;
    }).catch(function () { return caches.match('./index.html') || new Response('', { status: 404 }); }));
    return;
  }
  // Rețeaua prima dată pentru scripturi/css: codul proaspăt înlocuiește vechiul
  // cache imediat ce e disponibil; offline-ul folosește copia salvată.
  e.respondWith(fetch(req).then(function (res) {
    if (res && res.ok) {
      const copy = res.clone();
      caches.open(CACHE).then(function (c) { c.put(req, copy); });
    }
    return res;
  }).catch(function () { return caches.match(req) || new Response('', { status: 404 }); }));
});
// Notificările programului de ture: pagina trimite titlul/prin postMessage, iar
// service worker-ul le afișează astfel încât să funcționeze și când pagina e în
// fundal (în PWA, inclusiv pe iPhone după „Adaugă la ecranul de start”).
self.addEventListener('message', function (e) {
  const msg = e.data || {};
  if (msg.type === 'notify' && msg.title) {
    e.waitUntil(self.registration.showNotification(msg.title, msg.options || {}));
  }
});
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    for (let i = 0; i < list.length; i++) {
      if (list[i].focus) return list[i].focus();
    }
    return clients.openWindow('./index.html');
  }));
});
