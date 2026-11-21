/* ===== Ghiduri legislative și „Articole utile” — conținut complet pe fiecare articol ===== */
(function () {
  'use strict';
  const DATA = window.GUIDES_DATA || { title: '', intro: '', articles: [] };

  function esc(s) {
    return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  const GUIDES_CONTENT = {
    'ture-de-lucru': {
      title: 'Ture de lucru: tipuri de ture și cum îți calculezi orele',
      html:
      '<p>Turele de lucru sunt programe în care activitatea continuă zi și noapte, inclusiv în weekend și de sărbători, iar angajații se schimbă între ei după un grafic. Așa lucrează asistenții medicali, polițiștii și jandarmii, paznicii, operatorii din producție sau dispecerat și mulți șoferi.</p>' +
      '<p>Problema apare la final de lună: turele nu se potrivesc cu săptămâna de luni până vineri, o tură de noapte se întinde pe două zile, iar sărbătorile cad diferit de la un an la altul. Pe hârtie sau din memorie, e ușor să pierzi o tură sau să numeri greșit orele de noapte.</p>' +
      '<h3>Tipuri de ture</h3>' +
      '<ul>' +
      '<li><strong>Tura 12/24:</strong> Lucrezi 12 ore, apoi ai 24 de ore libere. Ciclul are 36 de ore, așa că ora de început se mută cu 12 ore de la o tură la alta, iar turele de zi și de noapte alternează. E un sistem des întâlnit în spitale, pază și dispecerat.</li>' +
      '<li><strong>Tura 12/48:</strong> Lucrezi 12 ore, apoi ai 48 de ore libere. Ciclul are 60 de ore, deci și aici turele de zi și de noapte alternează dacă graficul merge continuu. Față de 12/24, faci mai puține ture pe lună și ai pauze mai lungi între ele.</li>' +
      '<li><strong>8 ore în 3 schimburi:</strong> Ziua este împărțită în trei ture de câte 8 ore, de exemplu 06:00–14:00, 14:00–22:00 și 22:00–06:00. Angajații trec prin rotație de la un schimb la altul, de obicei săptămânal. Schimbul 22:00–06:00 se află în întregime în intervalul de noapte.</li>' +
      '<li><strong>Tura 4 pe 2:</strong> Lucrezi 4 zile la rând, apoi ai 2 zile libere. Ciclul are 6 zile, nu 7, așa că zilele libere cad în altă zi a săptămânii de la o săptămână la alta. Durata unei ture poate fi de 8 sau de 12 ore, în funcție de angajator.</li>' +
      '<li><strong>Ture de noapte:</strong> O tură de noapte trece aproape întotdeauna peste miezul nopții, deci orele ei aparțin la două zile calendaristice. Pentru evidență contează trei lucruri: câte ore ai lucrat în total, câte dintre ele sunt în intervalul de noapte și în ce zi a căzut fiecare oră.</li>' +
      '</ul>' +
      '<h3>Cum se calculează orele lucrate în ture</h3>' +
      '<ol>' +
      '<li>Notează ora de început și ora de sfârșit pentru fiecare tură din grafic.</li>' +
      '<li>Calculează durata turei. Dacă tura se termină a doua zi, numeri orele până la 24:00 și apoi orele de după miezul nopții.</li>' +
      '<li>Scade pauzele, dacă angajatorul tău nu le include în timpul de lucru.</li>' +
      '<li>Separă orele de noapte, adică orele din intervalul 22:00–06:00.</li>' +
      '<li>Împarte orele pe zile calendaristice, ca să știi exact câte ore ai într-o zi de sărbătoare sau într-o lună.</li>' +
      '<li>Adună orele din toată luna și compară totalul cu norma lunară, adică numărul de ore pe care trebuie să le lucrezi în luna respectivă.</li>' +
      '</ol>' +
      '<p><strong>Exemplu: tura de noapte 19:00–07:00</strong></p>' +
      '<ul>' +
      '<li><strong>Pasul 1. Totalul orelor:</strong> 19:00–24:00 = 5 ore (în prima zi); 00:00–07:00 = 7 ore (în a doua zi). Total: 5 + 7 = <strong>12 ore lucrate</strong>.</li>' +
      '<li><strong>Pasul 2. Orele din intervalul de noapte (22:00–06:00):</strong> 22:00–24:00 = 2 ore; 00:00–06:00 = 6 ore. Total: 2 + 6 = <strong>8 ore de noapte</strong>.</li>' +
      '<li><strong>Pasul 3. Verificarea:</strong> Orele din afara intervalului de noapte sunt 19:00–22:00 (3 ore) și 06:00–07:00 (1 oră), adică 4 ore. 8 + 4 = 12 ore.</li>' +
      '</ul>' +
      '<table class="ot-table">' +
      '<thead><tr><th>Interval</th><th>Ore</th><th>În intervalul de noapte?</th></tr></thead>' +
      '<tbody>' +
      '<tr><td>19:00–22:00</td><td>3</td><td>Nu</td></tr>' +
      '<tr><td>22:00–24:00</td><td>2</td><td>Da</td></tr>' +
      '<tr><td>00:00–06:00</td><td>6</td><td>Da</td></tr>' +
      '<tr><td>06:00–07:00</td><td>1</td><td>Nu</td></tr>' +
      '<tr><td><strong>Total</strong></td><td><strong>12</strong></td><td><strong>8 ore de noapte</strong></td></tr>' +
      '</tbody>' +
      '</table>' +
      '<h3>Sărbători legale și zile libere în ture</h3>' +
      '<p>La un program de luni până vineri, sărbătoarea legală este pur și simplu o zi liberă. În ture, graficul nu se oprește: dacă tura ta cade într-o zi de sărbătoare, de regulă o lucrezi.</p>' +
      '<ul>' +
      '<li><strong>Norma lunii se schimbă:</strong> Când o sărbătoare legală cade într-o zi lucrătoare, luna are mai puține zile lucrătoare, deci și o normă de ore mai mică.</li>' +
      '<li><strong>Orele lucrate de sărbătoare trebuie numărate separat:</strong> Compensarea lor (timp liber sau alt tip de compensare) depinde de contractul colectiv, regulamentul intern sau legislația aplicabilă.</li>' +
      '<li><strong>Tura de noapte poate atinge o zi de sărbătoare doar parțial:</strong> O tură 19:00–07:00 care începe în seara dinaintea unei sărbători are 7 ore în ziua de sărbătoare (00:00–07:00) și 5 ore în ziua precedentă.</li>' +
      '<li><strong>Concediul de odihnă și concediul medical:</strong> Se marchează în zilele din grafic și influențează câte ore mai ai de lucrat în luna respectivă.</li>' +
      '</ul>' +
      '<h3>Întrebări frecvente</h3>' +
      '<details><summary>Câte ore are o tură de noapte 19:00–07:00?</summary><p>12 ore lucrate. Dintre ele, 8 ore se află în intervalul de noapte 22:00–06:00, iar 4 ore (19:00–22:00 și 06:00–07:00) sunt în afara lui.</p></details>' +
      '<details><summary>Ce înseamnă tura 12/24?</summary><p>Lucrezi 12 ore, apoi ai 24 de ore libere, după care începe tura următoare. Ciclul complet are 36 de ore.</p></details>' +
      '<details><summary>Care e diferența dintre 12/24 și 12/48?</summary><p>La ambele lucrezi 12 ore. Diferă pauza dintre ture: 24 de ore la 12/24 și 48 de ore la 12/48. La 12/48 faci mai puține ture într-o lună.</p></details>' +
      '<details><summary>Cum se numără o tură care trece peste miezul nopții?</summary><p>Orele se împart pe cele două zile calendaristice. La o tură 19:00–07:00, 5 ore cad în prima zi (19:00–24:00) și 7 ore în a doua (00:00–07:00).</p></details>' +
      '<details><summary>Se lucrează în ture și de sărbători legale?</summary><p>Da, la locurile de muncă cu activitate continuă turele merg și de sărbători. Compensarea depinde de contractul colectiv, regulamentul intern sau legislația aplicabilă sectorului tău.</p></details>' +
      '<details><summary>Pot folosi calculatorul de ture pe telefon?</summary><p>Da. Pontaj Ture funcționează în browser și poate fi instalat ca aplicație pe Android și iOS, fără App Store.</p></details>' +
      '<p class="ot-note">Informațiile sunt orientative. Verifică regulile angajatorului tău și legislația în vigoare.</p>'
    },

    'pontaj-ture': {
      title: 'Cum se calculează pontajul în ture — ghid complet 2026',
      html:
      '<p>Găsirea unei metode corecte pentru gestionarea timpului de lucru poate fi o provocare, mai ales în companiile care funcționează non-stop. În acest ghid complet pentru 2026, vei descoperi exact cum se calculează pontajul în ture, ce obligații legale ai și cum te poate ajuta o aplicație modernă să eviți greșelile de calcul.</p>' +
      '<h3>Ce înseamnă pontaj în ture</h3>' +
      '<p>Pontajul în ture reprezintă înregistrarea sistematică a orelor de început și de sfârșit ale programului de lucru pentru angajații care nu urmează clasicul interval administrativ (luni–vineri, 09:00–17:00). Munca în ture implică rotația personalului pe intervale orare diferite (de exemplu, ture de 8 ore în 3 schimburi, sau sisteme de tip 12/24, 12/48).</p>' +
      '<p>Conform Codului Muncii, evidența orelor de muncă este obligatorie. Pentru angajații în ture, pontajul nu este doar o formalitate administrativă, ci instrumentul prin care se garantează respectarea repausului legal și calcularea corectă a drepturilor salariale.</p>' +
      '<h3>Norma de ore pe lună 2026</h3>' +
      '<p>Pentru a calcula corect pontajul, trebuie să raportezi mereu orele lucrate la norma legală din luna respectivă.</p>' +
      '<table class="ot-table">' +
      '<thead><tr><th>Luna</th><th>Zile lucrătoare</th><th>Normă ore (8h/zi)</th></tr></thead>' +
      '<tbody>' +
      '<tr><td>Ianuarie</td><td>20</td><td>160 ore</td></tr>' +
      '<tr><td>Februarie</td><td>20</td><td>160 ore</td></tr>' +
      '<tr><td>Martie</td><td>22</td><td>176 ore</td></tr>' +
      '<tr><td>Aprilie</td><td>20</td><td>160 ore</td></tr>' +
      '<tr><td>Mai</td><td>19</td><td>152 ore</td></tr>' +
      '<tr><td>Iunie</td><td>20</td><td>160 ore</td></tr>' +
      '<tr><td>Iulie</td><td>23</td><td>184 ore</td></tr>' +
      '<tr><td>August</td><td>21</td><td>168 ore</td></tr>' +
      '<tr><td>Septembrie</td><td>22</td><td>176 ore</td></tr>' +
      '<tr><td>Octombrie</td><td>22</td><td>176 ore</td></tr>' +
      '<tr><td>Noiembrie</td><td>19</td><td>152 ore</td></tr>' +
      '<tr><td>Decembrie</td><td>21</td><td>168 ore</td></tr>' +
      '<tr><td><strong>TOTAL 2026</strong></td><td><strong>249</strong></td><td><strong>1992 ore</strong></td></tr>' +
      '</tbody>' +
      '</table>' +
      '<h3>Cum se calculează orele suplimentare</h3>' +
      '<p>La munca în ture, calculul orelor suplimentare se face prin raportare la perioada de referință (o lună, 3 luni sau maximum 4 luni, conform legii). Dacă la finalul lunii un angajat a acumulat 172 de ore iar norma a fost 160, are 12 ore suplimentare care trebuie compensate cu timp liber în 90 de zile sau cu sporul legal.</p>' +
      '<h3>Cum se marchează CO și CM în pontaj</h3>' +
      '<ul>' +
      '<li><strong>Concediul de Odihnă (CO):</strong> Se marchează în zilele în care angajatul ar fi trebuit să lucreze conform graficului, diminuând norma pe care trebuie să o realizeze în acea lună.</li>' +
      '<li><strong>Concediul Medical (CM):</strong> Se introduce pe baza certificatului medical. Orele aferente sunt considerate „justificate” și se scad direct din norma lunară, fără a fi contorizate ca ore efectiv lucrate.</li>' +
      '</ul>'
    },

    'spor-noapte': {
      title: 'Sporul de noapte 2026 — cât e și cum se calculează',
      html:
      '<p>Munca în timpul nopții impune un efort suplimentar, motiv pentru care legislația din România protejează această categorie de salariați prin drepturi financiare clare.</p>' +
      '<h3>Ce spune legea (25% din salariul de bază)</h3>' +
      '<p>Conform Codului Muncii în vigoare în 2026, munca prestată între orele 22:00 și 06:00 este considerată muncă de noapte. Salariații care îndeplinesc condițiile legale au dreptul fie la un program redus cu o oră (fără scăderea salariului), fie la un spor de noapte de 25% din salariul de bază. În majoritatea companiilor cu ture, se aplică varianta sporului de 25%.</p>' +
      '<h3>Cine are dreptul la spor de noapte</h3>' +
      '<ul>' +
      '<li>Efectuează muncă de noapte cel puțin 3 ore din timpul zilnic de lucru.</li>' +
      '<li>Efectuează muncă de noapte în proporție de cel puțin 30% din timpul lunar de lucru.</li>' +
      '</ul>' +
      '<p>Dacă aceste criterii sunt îndeplinite, angajatorul are obligația legală să calculeze și să plătească sporul pentru toate orele din intervalul 22:00–06:00.</p>' +
      '<h3>Cum se calculează concret (exemplu cu cifre)</h3>' +
      '<ul>' +
      '<li><strong>Salariu de bază brut:</strong> 6.000 lei</li>' +
      '<li><strong>Norma lunii:</strong> 160 ore</li>' +
      '<li><strong>Tarif orar:</strong> 6.000 / 160 = 37,5 lei/oră</li>' +
      '<li><strong>Ore de noapte lucrate:</strong> 48 ore (6 ture × 8h noapte)</li>' +
      '<li><strong>Sporul pe oră:</strong> 25% × 37,5 = 9,375 lei/oră</li>' +
      '<li><strong>Spor total:</strong> 48 × 9,375 = <strong>450 lei brut</strong></li>' +
      '</ul>' +
      '<p>Angajatul primește 6.000 + 450 = <strong>6.450 lei brut</strong> în luna respectivă.</p>'
    },

    'port-spital-jandarmerie': {
      title: 'Program lucru în schimburi la port, spital și jandarmerie — ce trebuie să știi',
      html:
      '<p>Munca în schimburi este motorul unor industrii și servicii vitale care nu se pot opri niciodată. Acest articol analizează particularitățile programului de lucru în schimburi pentru trei domenii esențiale: port, spital și jandarmerie.</p>' +
      '<h3>Specificul fiecărui domeniu</h3>' +
      '<ul>' +
      '<li><strong>Porturi:</strong> Activitatea e strâns legată de fluxul navelor și condițiile meteo, transformând flexibilitatea într-o necesitate critică.</li>' +
      '<li><strong>Spitale:</strong> Gărzile și turele asigură permanența asistenței medicale. Monitorizarea timpului de odihnă este extrem de riguroasă.</li>' +
      '<li><strong>Jandarmerie:</strong> Turele acoperă evenimente, misiuni neprevăzute și patrule zilnice. Ordinele de mobilizare pot da peste cap graficele obișnuite.</li>' +
      '</ul>' +
      '<h3>Ce tipuri de ture sunt legale</h3>' +
      '<ul>' +
      '<li><strong>12/24, 12/48:</strong> Foarte comun în spitale și jandarmerie. O tură de zi de 12 ore urmată de 24h repaus, o tură de noapte de 12 ore urmată de 48h repaus.</li>' +
      '<li><strong>Schimburi succesive (8 ore):</strong> Des întâlnite în porturi — Schimbul 1 (06:00–14:00), Schimbul 2 (14:00–22:00), Schimbul 3 (22:00–06:00).</li>' +
      '<li><strong>Ture de 24 ore:</strong> Posibile prin statute speciale (MAI), urmate obligatoriu de 72 de ore de repaus.</li>' +
      '</ul>' +
      '<h3>Drepturi și obligații</h3>' +
      '<p><strong>Important:</strong> Repausul săptămânal trebuie să fie de minimum 48 de ore consecutive. Munca în weekend dă dreptul la spor și zile libere compensatorii în cursul săptămânii.</p>' +
      '<p>Un angajat nu poate lucra două ture consecutive fără acordul său scris sau fără o situație de forță majoră reglementată.</p>'
    },

    'concediu-ture': {
      title: 'Concediu de odihnă în ture — câte zile ai dreptul și cum se calculează',
      html:
      '<p>Planificarea concediului poate deveni o bătaie de cap când nu lucrezi clasic luni–vineri. Iată regulile clare pentru 2026.</p>' +
      '<h3>Baza legală (21 zile minim)</h3>' +
      '<p>Conform legislației din România, durata minimă a concediului de odihnă este de 21 de zile lucrătoare pe an. Această bază se aplică egal angajaților de la birou și celor care lucrează în ture de noapte sau în weekend.</p>' +
      '<h3>Cum se numără zilele de CO când lucrezi în schimburi</h3>' +
      '<p><strong>Regula de aur din Codul Muncii:</strong> concediul se calculează exclusiv în zile lucrătoare (luni–vineri), nu în funcție de numărul de ture programate.</p>' +
      '<p><strong>Exemplu:</strong> Dacă îți iei o săptămână de concediu (luni–duminică), ți se deduc 5 zile de CO, chiar dacă în acea săptămână aveai programate doar 3 ture de 12 ore. Graficul de ture se „îngheață” pe perioada concediului.</p>' +
      '<h3>Ce se întâmplă cu CO nemarcate</h3>' +
      '<p>Zilele de CO neefectuate pot fi reportate și luate în termen de 180 de zile de la finalul anului 2026. Compensarea în bani a zilelor neefectuate este strict interzisă prin lege, cu excepția încetării contractului de muncă.</p>'
    },

    'ore-suplimentare': {
      title: 'Calculator ore suplimentare România 2026 — cum știi dacă ești în plus sau minus',
      html:
      '<p>La finalul lunii, mulți angajați se întreabă dacă au ore în plus sau sunt pe minus față de norma legală. Iată cum funcționează calculul în 2026.</p>' +
      '<h3>Ce sunt orele suplimentare conform Codului Muncii</h3>' +
      '<p>Munca suplimentară este munca prestată dincolo de durata normală — 8 ore/zi și 40 ore/săptămână. La ture, orele suplimentare se calculează prin raportare la norma totală a lunii. Orice oră prestată peste normă este oră suplimentară. Legea plafonează munca suplimentară la maximum 32 de ore peste program într-o săptămână.</p>' +
      '<h3>Cum se compensează (timp liber sau spor 75%)</h3>' +
      '<ul>' +
      '<li><strong>Timp liber plătit:</strong> Orele suplimentare se compensează cu ore libere plătite în următoarele 90 de zile calendaristice.</li>' +
      '<li><strong>Spor salarial (minimum 75%):</strong> Dacă compensarea prin timp liber nu e posibilă în 90 de zile, se plătește un spor de minimum 75% din salariul de bază per oră suplimentară.</li>' +
      '</ul>' +
      '<h3>Exemplu practic calculat</h3>' +
      '<ul>' +
      '<li><strong>Norma lunii:</strong> 160 ore</li>' +
      '<li><strong>Ore lucrate efectiv:</strong> 170 ore</li>' +
      '<li><strong>Ore suplimentare:</strong> 10 ore</li>' +
      '<li><strong>Salariu de bază:</strong> 4.800 lei</li>' +
      '<li><strong>Tarif orar:</strong> 4.800 / 160 = 30 lei/oră</li>' +
      '<li><strong>Valoarea orei suplimentare cu spor 75%:</strong> 30 + (75% × 30) = 52,5 lei/oră</li>' +
      '<li><strong>Plată totală ore suplimentare:</strong> 10 × 52,5 = <strong>525 lei brut</strong></li>' +
      '</ul>'
    }
  };

  function openGuideModal(articleId) {
    var modal = document.getElementById('overtime-detail-modal');
    var titleEl = document.getElementById('overtime-detail-title');
    var bodyEl = document.getElementById('ot-detail-body');
    var guide = GUIDES_CONTENT[articleId] || GUIDES_CONTENT['ture-de-lucru'];

    if (titleEl && guide.title) {
      titleEl.textContent = guide.title;
    }
    if (bodyEl && guide.html) {
      bodyEl.innerHTML = guide.html;
      bodyEl.scrollTop = 0;
    }
    if (modal) {
      modal.style.display = 'flex';
      modal.classList.add('open');
    }
  }

  function createArticleElement(item) {
    var li = document.createElement('li');
    if (item.target === 'external' && item.url) {
      var a = document.createElement('a');
      a.href = item.url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.className = 'ot-article-link';
      a.textContent = item.title;
      if (item.desc) {
        var spanDesc = document.createElement('span');
        spanDesc.className = 'ot-article-desc';
        spanDesc.textContent = item.desc;
        a.appendChild(spanDesc);
      }
      li.appendChild(a);
      return li;
    }

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ot-article-btn';
    var spanTitle = document.createElement('span');
    spanTitle.textContent = item.title;
    btn.appendChild(spanTitle);
    if (item.desc) {
      var descEl = document.createElement('span');
      descEl.className = 'ot-article-desc';
      descEl.textContent = item.desc;
      btn.appendChild(descEl);
    }
    btn.addEventListener('click', function () {
      openGuideModal(item.articleId || 'ture-de-lucru');
    });
    li.appendChild(btn);
    return li;
  }

  function renderOvertimeSection() {
    var container = document.getElementById('overtime-laws-section');
    if (!container) return;
    container.innerHTML =
    '<div class="overtime-laws">' +
    '<div class="ol-intro">' + esc(DATA.intro || '') + '</div>' +
    (DATA.updated ? '<p class="ol-note">Actualizat: ' + esc(DATA.updated) + '.</p>' : '') +
    '</div>';

    var ul = document.createElement('ul');
    ul.className = 'ol-articles';
    ul.appendChild(createArticleElement({
      title: 'Calculator ore suplimentare România 2026 — cum știi dacă ești în plus sau minus',
      desc: 'Deschide ghidul despre Codul Muncii, compensare prin timp liber sau spor 75% și exemplu practic.',
      target: 'internal',
      articleId: 'ore-suplimentare'
    }));
    container.querySelector('.overtime-laws').appendChild(ul);
  }

  function renderArticoleUtile() {
    var list = document.getElementById('articole-utils-list');
    if (!list) return;
    list.innerHTML = '';
    var ul = document.createElement('ul');
    ul.className = 'ol-articles';
    (DATA.articles || []).forEach(function (item) {
      ul.appendChild(createArticleElement(item));
    });
    list.appendChild(ul);
  }

  document.addEventListener('click', function (e) {
    var modal = document.getElementById('overtime-detail-modal');
    if (!modal) return;
    if (e.target === modal || e.target.closest('#overtime-detail-modal .modal-close')) {
      modal.style.display = 'none';
      modal.classList.remove('open');
    }
  });

  window.openGuideSection = openGuideModal;
  renderOvertimeSection();
  renderArticoleUtile();
})();
