/* Calcul salariu net — folosit de aplicație (Salariu) ȘI de „Calculator salariu net”, ca să dea același rezultat. */
(function (g) {
  function r2(n) { return Math.round((Number(n) || 0) * 100) / 100; }
  // Salariul minim brut garantat în plată (HG 4050 → 4325 lei de la 1 iulie 2026) și suma netaxabilă (OUG 89/2025).
  function minWage(y, m) { return (y < 2026 || (y === 2026 && m < 6)) ? 4050 : 4325; }
  function exempt(y, m) { if (y < 2026) return 300; if (y === 2026) return m < 6 ? 300 : 200; return 0; }
  // Deducerea personală de bază: 20% / 25% / 30% / 35% / 40% din salariul minim (0–4+ persoane), scade în trepte de 50 lei
  // până la 0 la venit brut = salariul minim + 2.000 lei. Suplimentar sub 26 ani: +15% din salariul minim, aceeași condiție.
  function deduction(brutTotal, dep, sub26, y, m) {
    var sm = minWage(y, m), pct = [0.20, 0.25, 0.30, 0.35, 0.40][Math.min(dep || 0, 4)];
    if (brutTotal >= sm + 2000) return 0;
    var steps = brutTotal <= sm ? 0 : Math.ceil((brutTotal - sm) / 50);
    var f = Math.max(0, 1 - steps / 40);
    return r2((sm * pct + (sub26 ? sm * 0.15 : 0)) * f);
  }
  function compute(o) {
    var y = o.y, m = o.m, brut = Number(o.brut) || 0, norma = Number(o.norma) || 160;
    var tarif = norma > 0 ? brut / norma : 0;
    var pN = (o.pNoapte != null ? o.pNoapte : 25) / 100, pE = (o.pExtra != null ? o.pExtra : 75) / 100;
    var pW = (o.pWeekend != null ? o.pWeekend : 50) / 100, pL = (o.pLegal != null ? o.pLegal : 100) / 100;
    var sporNoapte = r2((o.oreNoapte || 0) * tarif * pN);
    // Orele suplimentare PLĂTITE: orele în sine + sporul (≥75%). Cele compensate cu timp liber nu se plătesc în bani.
    var extraOre = r2((o.oreExtra || 0) * tarif), sporExtra = r2(extraOre * pE);
    var sporWeekend = r2((o.oreWeekend || 0) * tarif * pW), sporLegal = r2((o.oreLegale || 0) * tarif * pL);
    var custom = r2(o.altele || 0);
    var totalSporuri = r2(sporNoapte + extraOre + sporExtra + sporWeekend + sporLegal + custom);
    var brutTotal = r2(brut + totalSporuri);
    var sm = minWage(y, m), scutit = (brut > 0 && brutTotal <= sm + 0.5) ? exempt(y, m) : 0;
    var baza = Math.max(0, brutTotal - scutit);
    var cas = r2(baza * 0.25), cass = r2(baza * 0.10);
    var ded = deduction(brutTotal, o.dep || 0, !!o.sub26, y, m);
    var bazaImp = Math.max(0, baza - cas - cass - ded), imp = r2(bazaImp * 0.10);
    var net = r2(brutTotal - cas - cass - imp);
    return { tarif: tarif, sporNoapte: sporNoapte, extraOre: extraOre, sporExtra: sporExtra, sporWeekend: sporWeekend, sporLegal: sporLegal,
      custom: custom, totalSporuri: totalSporuri, brutTotal: brutTotal, scutit: scutit, cas: cas, cass: cass, deducere: ded, impozit: imp, net: net, salariuMinim: sm };
  }
  // „Alte sporuri” (listă salvată în calculator): procent din brut, sau din valoarea orelor când există ore, + sumă fixă.
  function customSporuri(list, brut, tarif) {
    var tot = 0;
    (list || []).forEach(function (b) {
      var dinProcent = (b.ore > 0) ? b.ore * tarif * (b.pct > 0 ? b.pct / 100 : 1) : brut * ((b.pct || 0) / 100);
      tot += dinProcent + (Number(b.suma) || 0);
    });
    return r2(tot);
  }
  g.SalaryCalc = { customSporuri: customSporuri, compute: compute, minWage: minWage, deduction: deduction, round2: r2 };
})(window);
