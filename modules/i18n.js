/* Limba interfeței: Română (implicit), English, Español. Traduce etichetele, butoanele și setările;
   textele lungi explicative și legislația rămân în română (sunt specifice României). */
(function () {
  'use strict';
  var T = [
['Cont','Account','Cuenta'],['📥 Importă','📥 Import','📥 Importar'],['Calendar','Calendar','Calendario'],['Program','Schedule','Horario'],['Ture libere','Free shifts','Turnos libres'],
['SDSL','Weekend & holiday hours','Horas fin de semana y festivos'],['Salariu','Salary','Salario'],['Zile libere','Days off','Días libres'],['Legislație','Law','Legislación'],
['Export și instalare','Export & install','Exportar e instalar'],['Despre','About','Acerca de'],['+ Nou','+ New','+ Nuevo'],
['Alege tura, apoi apasă zilele','Pick a shift, then tap the days','Elige el turno y toca los días'],['📅 Aplică pe zile','📅 Apply to days','📅 Aplicar a días'],
['↶ Anulează','↶ Undo','↶ Deshacer'],['+ Tură nouă','+ New shift','+ Nuevo turno'],['Vizualizare calendar','Calendar view','Vista del calendario'],['Lună','Month','Mes'],['Tot anul','Full year','Todo el año'],
['ore pontate luna asta','hours logged this month','horas fichadas este mes'],['norma lunii (ore)','monthly norm (hours)','norma mensual (horas)'],['ore extra / minus','extra / missing hours','horas extra / faltantes'],
['ore SDSL luna asta','weekend/holiday hours','horas fin de semana/festivos'],['Legenda','Legend','Leyenda'],['Generator program','Schedule generator','Generador de horario'],['Tipul de tură','Shift pattern','Tipo de turno'],
['Perioada de generare','Generation period','Periodo de generación'],['Generează programul','Generate schedule','Generar horario'],['Categorii de ture','Shift categories','Categorías de turnos'],['🗑 Șterge tot','🗑 Clear all','🗑 Borrar todo'],
['Salvează tura','Save shift','Guardar turno'],['Șterge','Delete','Eliminar'],['Anulează','Cancel','Cancelar'],['Ore din luna anterioară și pentru luna viitoare','Hours from last month and for next month','Horas del mes anterior y para el próximo'],
['Ore suplimentare din luna anterioară','Overtime from last month','Horas extra del mes anterior'],['↻ automat din luna trecută','↻ automatic from last month','↻ automático del mes pasado'],['✎ editat manual','✎ edited manually','✎ editado manualmente'],
['↻ Auto','↻ Auto','↻ Auto'],['Ore suplimentare pentru luna viitoare','Overtime for next month','Horas extra para el próximo mes'],['↻ actualizat automat','↻ updated automatically','↻ actualizado automáticamente'],
['Câte ture libere ies pe luna curentă','How many free shifts this month','Cuántos turnos libres este mes'],['Salariu (estimare și plată pe tură)','Salary (estimate & pay per shift)','Salario (estimación y pago por turno)'],
['Estimare brut → net','Gross → net estimate','Estimación bruto → neto'],['Salariu brut de bază (lei)','Base gross salary (lei)','Salario bruto base (lei)'],['Persoane în întreținere','Dependants','Personas a cargo'],
['Spor noapte %','Night bonus %','Plus nocturno %'],['Spor ore suplim. %','Overtime bonus %','Plus horas extra %'],['Spor weekend %','Weekend bonus %','Plus fin de semana %'],['Spor zile libere legale %','Public-holiday bonus %','Plus festivos %'],
['Orele suplimentare se plătesc (nu se compensează cu timp liber)','Overtime is paid (not taken as time off)','Las horas extra se pagan (no se compensan con descanso)'],['Am sub 26 de ani (deducere suplimentară)','I am under 26 (extra deduction)','Tengo menos de 26 años (deducción extra)'],
['Deschide calculatorul complet →','Open the full calculator →','Abrir la calculadora completa →'],['Zile libere și vacanțe','Days off & holidays','Días libres y vacaciones'],['↻ Actualizează acum','↻ Update now','↻ Actualizar ahora'],
['Baza de calcul pe domenii (legislație)','Calculation basis by sector (law)','Base de cálculo por sector (ley)'],['Ce legi se aplică pentru orele suplimentare?','Which laws apply to overtime?','¿Qué leyes se aplican a las horas extra?'],
['Articole utile','Useful articles','Artículos útiles'],['Exportă și instalează','Export & install','Exportar e instalar'],['🖨️ Print','🖨️ Print','🖨️ Imprimir'],['📄 Export PDF','📄 Export PDF','📄 Exportar PDF'],['📤 Trimite unui coleg','📤 Send to a colleague','📤 Enviar a un compañero'],
['💰 Calculează salariul net (cu sporuri)','💰 Calculate net salary (with bonuses)','💰 Calcular salario neto (con pluses)'],['📱 Instalează aplicația (telefon și PC)','📱 Install the app (phone & PC)','📱 Instalar la app (móvil y PC)'],
['Despre aplicatie','About the app','Acerca de la aplicación'],['Cum funcționează?','How does it work?','¿Cómo funciona?'],['Funcționează pe telefon?','Does it work on phones?','¿Funciona en el móvil?'],['Se păstrează datele?','Is my data kept?','¿Se guardan los datos?'],
['🔔 Notificări pentru programul de ture','🔔 Shift notifications','🔔 Notificaciones de turnos'],['Setări','Settings','Ajustes'],['Aspect','Appearance','Apariencia'],['Pontaj','Time tracking','Fichaje'],['Tipuri de tură','Shift types','Tipos de turno'],
['Categorii și culori','Categories & colors','Categorías y colores'],['Calcul','Calculation','Cálculo'],['Avansat','Advanced','Avanzado'],['Date','Data','Datos'],['Temă','Theme','Tema'],['Automat','Automatic','Automático'],['Luminos','Light','Claro'],['Întunecat','Dark','Oscuro'],
['Mărimea textului','Text size','Tamaño del texto'],['Mic','Small','Pequeño'],['Normal','Normal','Normal'],['Mare','Large','Grande'],['Compact','Compact','Compacto'],['Aerisit','Spacious','Espacioso'],['Animații','Animations','Animaciones'],
['Efecte și animații (ecran de pornire, apariții, tranziții)','Effects & animations (splash, reveals, transitions)','Efectos y animaciones (inicio, apariciones, transiciones)'],['Salt la pornire','On startup','Al iniciar'],
['Deschide mereu luna curentă','Always open the current month','Abrir siempre el mes actual'],['Altele','Other','Otros'],['Concediu de odihnă','Annual leave','Vacaciones anuales'],['Ore suplimentare','Overtime','Horas extra'],
['Limbă și afișare','Language & display','Idioma y visualización'],['Limba calendarului','Language','Idioma'],['Copie de siguranță','Backup','Copia de seguridad'],['📤 Exportă tot (JSON)','📤 Export all (JSON)','📤 Exportar todo (JSON)'],['📥 Importă','📥 Import','📥 Importar'],
['Aplicația','The app','La aplicación'],['↻ Reîncarcă ultima versiune','↻ Reload latest version','↻ Recargar la última versión'],['Resetează preferințele de aspect','Reset appearance preferences','Restablecer apariencia'],
['📱 Instalează Pontaj Ture','📱 Install Pontaj Ture','📱 Instalar Pontaj Ture'],['⬇ Instalează acum','⬇ Install now','⬇ Instalar ahora'],['📖 Ghid pas cu pas pe dispozitiv','📖 Step-by-step guide','📖 Guía paso a paso'],
['🔗 Descarcă scurtătura (.html)','🔗 Download shortcut (.html)','🔗 Descargar acceso directo (.html)'],['💻 Pachet pentru PC (.zip)','💻 PC package (.zip)','💻 Paquete para PC (.zip)'],['Copiază linkul','Copy link','Copiar enlace'],
['Alege tura','Pick a shift','Elige el turno'],['Tura nouă','New shift','Nuevo turno'],['Culoarea turei','Shift color','Color del turno'],['Ore pontate','Hours logged','Horas fichadas'],['Pauză (min)','Break (min)','Pausa (min)'],['Început','Start','Inicio'],['Sfârșit','End','Fin'],
['Nu se pontează în zi nelucrătoare','Not logged on non-working days','No se ficha en día no laborable'],['Tură personalizată','Custom pattern','Turno personalizado'],['Creează modelul','Create pattern','Crear patrón'],
['Luna afișată','Displayed month','Mes mostrado'],['Începe cu','Starts with','Empieza con'],['Până la','Until','Hasta'],['Ture libere (varianta aleasă)','Free shifts (chosen option)','Turnos libres (opción elegida)'],
['Alege altă variantă →','Choose another option →','Elegir otra opción →'],['Zile libere legale','Public holidays','Festivos legales'],['Sărbători religioase','Religious holidays','Fiestas religiosas'],['Vacanțe școlare','School holidays','Vacaciones escolares'],
['Punți / concediu sugerat','Bridge days / suggested leave','Puentes / vacaciones sugeridas'],['Concedii','Leave','Permisos'],['Detalii ziua','Day details','Detalles del día'],['Cu cât timp înainte de tură','How long before the shift','Cuánto antes del turno'],
['Arată în calendar','Show in calendar','Mostrar en el calendario'],['Ore / tură zi','Hours / day shift','Horas / turno de día'],['Ore / tură noapte','Hours / night shift','Horas / turno de noche'],['Mod afișare ore','Hour display','Formato de horas'],
['Română','Romanian','Rumano'],['English','English','Inglés'],['Español','Spanish','Español'],['Reîncarcă ultima versiune','Reload latest version','Recargar la última versión'],['Ture','Shifts','Turnos'],['Salariu pe ture (luna afișată)','Pay per shift (displayed month)','Pago por turno (mes mostrado)'],
['Notificare de test','Test notification','Notificación de prueba'],['Zile pe an (norma ta)','Days per year','Días por año'],['Domeniul tău','Your sector','Tu sector'],['Zile CO pe an','Annual leave days','Días de vacaciones']
  ];
  var DICT = { en: {}, es: {} };
  T.forEach(function (r) { DICT.en[r[0]] = r[1]; DICT.es[r[0]] = r[2]; });
  var MONTHS = { en: ['January','February','March','April','May','June','July','August','September','October','November','December'], es: ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'] };
  var lang = 'ro', orig = new WeakMap(), applied = new WeakMap(), busy = false, timer = null;
  var SKIP = /^(SCRIPT|STYLE|TEXTAREA|INPUT|CODE)$/;
  function tr(s) { var d = DICT[lang]; if (!d) return null; var k = s.trim(); if (!k) return null; return d[k] != null ? d[k] : null; }
  function walk(node) {
    if (node.nodeType === 3) {
      var p = node.parentNode; if (!p || SKIP.test(p.nodeName) || (p.closest && p.closest('[data-no-i18n]'))) return;
      var o = orig.has(node) && applied.get(node) === node.data ? orig.get(node) : node.data;
      if (lang === 'ro') { if (orig.has(node) && applied.get(node) === node.data) { node.data = orig.get(node); } orig.delete(node); applied.delete(node); return; }
      var t = tr(o); if (t == null) { if (orig.has(node)) { orig.delete(node); applied.delete(node); } return; }
      var out = o.replace(o.trim(), t); orig.set(node, o); applied.set(node, out); if (node.data !== out) node.data = out; return;
    }
    if (node.nodeType !== 1 || SKIP.test(node.nodeName) || node.hasAttribute('data-no-i18n')) return;
    ['title', 'placeholder', 'aria-label'].forEach(function (a) {
      if (!node.hasAttribute(a)) return; var k = 'data-ro-' + a, o = node.getAttribute(k) || node.getAttribute(a);
      if (lang === 'ro') { if (node.hasAttribute(k)) { node.setAttribute(a, node.getAttribute(k)); node.removeAttribute(k); } return; }
      var t = tr(o); if (t != null) { node.setAttribute(k, o); node.setAttribute(a, t); }
    });
    for (var c = node.firstChild; c; c = c.nextSibling) walk(c);
  }
  function apply() { busy = true; try { walk(document.body); } finally { busy = false; } document.documentElement.lang = lang; }
  function setLang(l) {
    lang = (l === 'en' || l === 'es') ? l : 'ro'; apply();
    try { localStorage.setItem('pontaj-ture-lang', lang); } catch (e) {}
    if (window.renderCalendar) window.renderCalendar();
  }
  new MutationObserver(function () { if (busy) return; clearTimeout(timer); timer = setTimeout(apply, 80); }).observe(document.body, { childList: true, subtree: true, characterData: true });
  window.i18n = { set: setLang, get: function () { return lang; }, months: function () { return MONTHS[lang] || null; } };
  var saved = 'ro'; try { saved = localStorage.getItem('pontaj-ture-lang') || 'ro'; } catch (e) {}
  try { var c = window.cal && cal(); if (c && c.language && c.language !== 'ro') saved = c.language; } catch (e) {}
  if (saved !== 'ro') setLang(saved);
  var sel = document.getElementById('set-language');
  if (sel) sel.addEventListener('change', function () { setLang(sel.value); });
})();
