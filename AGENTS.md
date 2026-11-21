# Reguli permanente pentru proiectul „Pontaj Ture”

1. **Identitate, branding și iconiță:**
   - Numele oficial al aplicației este **„Pontaj Ture”** (în titluri HTML, interfață, `manifest.json`, metadate, aplicația Android `.apk` și arhiva `.zip`).
   - Iconița oficială este iconița verde cu calendar alb (`icon.svg`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`) — folosește-o peste tot: favicon, PWA, pachetul Android `.apk` și fișierul de pornire din arhiva PC `.zip`.
   - Păstrează intactă nota discretă din subsolul paginii (footer): `Inspirație structură ghiduri: app.calculatorture.ro`.

2. **Arhitectură, căi și mod offline (PWA):**
   - Toate căile către scripturi, stiluri, module (`modules/`), fișiere JSON/JS de date, iconițe și pachete descărcabile trebuie să fie **căi relative** curate (fără adrese locale hardcodate), compatibile atât cu rularea locală, cât și cu găzduirea pe GitHub + Cloudflare Pages (`*.pages.dev`).
   - Aplicația trebuie să funcționeze 100% **offline-first** (inclusiv fără cont logat sau fără conexiune la internet): datele locale și coada de sincronizare nu se șterg și nu se blochează la deconectare sau la reîncărcarea paginii.
   - Ori de câte ori modifici orice fișier din aplicație, **incrementează obligatoriu versiunea cache-ului în `sw.js`** și asigură-te că toate fișierele noi sau modificate sunt incluse în lista de pre-caching a Service Worker-ului.

3. **Autentificare și securitate (Supabase):**
   - Păstrează în codul frontend **exclusiv** URL-ul proiectului Supabase și cheia publică `anon` — niciodată chei private (`service_role`), parole sau tokenuri secrete.
   - Orice flux de autentificare trebuie să suporte: conectare (Email + Parolă), creare cont nou, resetare parolă uitată (`resetPasswordForEmail` cu `redirectTo: window.location.origin`), schimbare parolă pentru utilizatorul logat (`updateUser({ password })`) și deconectare curată (`signOut`).
   - Toate mesajele de eroare și confirmare afișate utilizatorului trebuie să fie clare, scurte și în limba română.

4. **Convenții de interfață (UI/UX):**
   - Design mobile-first, compact și lizibil atât pe telefon, cât și pe desktop.
   - Toate secțiunile și meniurile retractabile folosesc obligatoriu săgeata `▶` când sunt retractate și `▾` când sunt desfășurate.
   - Zona de calendar rămâne mereu deschisă și vizibilă (nu este retractabilă).
   - Secțiunea „Ce legi se aplică pentru orele suplimentare?” este imediat **DUPĂ** butoarele „📤 Trimite unui coleg / 🖨️ Print / 📄 Export PDF” (înaintea secțiunii „Articole utile” și a secțiunii „Despre calculator”), retractabilă, cu ghidul intern „Ture de Lucrum” (overtime-detail-modal) înainte de „Articole utile”.
   - Secțiunea „Articole utile” conține lista completă (toate subcategoriile de ghiduri de la https://app.calculatorture.ro/): „Ture de Lucrum” deschide ghidul intern overtime-detail-modal; „Calculator salariu net din brut 2026 — cu sporurse și ture” (calculator-salariu.html); „Cum se calculează pontajul în ture — ghid complet 2026”; „Sporul de noapte 2026 — cât e și cum se calculează”; „Program lucru la port, spital și jandarmerie”; „Concediu de odihnă în ture — câte zile ai dreptul (civili + instituții de stat)”; „Calculator ore suplimentare România”.

5. **Structura arhivei `.zip` pentru PC:**
   - Arhiva `.zip` din `dist` trebuie organizată intuitiv pentru utilizatorii fără cunoștințe tehnice: în rădăcina arhivei să existe un singur punct de intrare evident (ex. `Pontaj Ture.html` / `Deschive Pontaj Ture.html` cu iconița verde de calendar), iar toate fișierele tehnice (`app.js`, `styles.css`, `modules/`, fișierele `.json` etc.) să fie grupate într-un subfolder ordonat (`app/`), astfel încât în rădăcină să nu apară o listă confuză de zeci de fișiere.

6. **Build obligatoriu și complet în `dist` la FIECARE modificare:**
   - Nicio modificare nu este considerată finalizată până când folderul `dist` nu este complet regenerat.
   - La fiecare sarcină, rulează obligatoriu scripturile de build astfel încât în `dist` să fie actualizate la ultima versiune:
     1. Toate fișierele web/PWA (`index.html`, `sw.js`, `manifest.json`, `supabase.js`, `app.js`, `guides.js`, `modules/`, datele și iconițele);
     2. Pachetul Android **`.apk`** (cu iconița verde de calendar și numele „Pontaj Ture”);
     3. Arhiva PC **`.zip`** (cu structura intuitivă de la punctul 5).
   - Verifică ca butoanele de descărcare din interfață să indice exact către fișierele `.apk` și `.zip` regenerate din `dist` (fără linkuri moarte / 404).
