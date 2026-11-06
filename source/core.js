/*
 * KHALIL & YOUSRA FINANCE — moteur de calcul financier
 * ----------------------------------------------------
 * Toutes les sommes sont des ENTIERS EN CENTS. Aucun nombre flottant n'est
 * utilisé pour l'argent. Toutes les dates sont des chaînes 'AAAA-MM-JJ'
 * (dates civiles, sans fuseau), converties en numéros de jour UTC pour les
 * calculs : pas de surprise d'heure avancée.
 *
 * Ce module est pur (aucun accès réseau, DOM ou base de données) : il est
 * utilisé tel quel par l'application et par les tests automatisés.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.KYF = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ======================= ARGENT (cents entiers) ======================= */

  function assertCents(n, label) {
    if (!Number.isSafeInteger(n)) throw new TypeError((label || 'montant') + ' doit être un entier en cents');
    return n;
  }

  /** Division entière arrondie au plus proche (demi -> s'éloigne de zéro). */
  function divRound(a, b) {
    assertCents(a, 'numérateur'); assertCents(b, 'dénominateur');
    if (b === 0) throw new RangeError('division par zéro');
    const neg = (a < 0) !== (b < 0);
    const A = Math.abs(a), B = Math.abs(b);
    const q = Math.floor(A / B), r = A - q * B;
    const res = (2 * r >= B) ? q + 1 : q;
    return neg ? -res : res;
  }

  /** Applique un pourcentage exprimé en points de base (1 % = 100 pb). */
  function mulBps(cents, bps) { return divRound(cents * bps, 10000); }

  /** "1 234,56", "1234.5", "12 $", "-3,1" -> cents (entier). null si invalide. */
  function parseMoney(input) {
    if (typeof input === 'number') {
      if (!Number.isFinite(input)) return null;
      input = String(input);
    }
    if (typeof input !== 'string') return null;
    let s = input.replace(/[\s  $]/g, '').replace(/CAD/i, '');
    if (!s) return null;
    let neg = false;
    if (s[0] === '-') { neg = true; s = s.slice(1); }
    // Le dernier séparateur (virgule ou point) suivi de 1-2 chiffres est décimal.
    const m = s.match(/^(\d{1,3}(?:[.,]?\d{3})*|\d+)(?:[.,](\d{1,2}))?$/);
    if (!m) return null;
    const whole = m[1].replace(/[.,]/g, '');
    const frac = (m[2] || '').padEnd(2, '0');
    const cents = Number(whole) * 100 + Number(frac);
    if (!Number.isSafeInteger(cents)) return null;
    return neg ? -cents : cents;
  }

  /** Format canadien-français : 1 234,56 $ (espaces fines insécables). */
  function formatMoney(cents, opts) {
    opts = opts || {};
    if (cents === null || cents === undefined) return '—';
    assertCents(cents);
    const neg = cents < 0, a = Math.abs(cents);
    const whole = Math.floor(a / 100), frac = a % 100;
    const w = String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    let out = opts.noCents ? w : w + ',' + String(frac).padStart(2, '0');
    out += ' $';
    if (neg) out = '−' + out;
    else if (opts.sign && cents > 0) out = '+' + out;
    return out;
  }

  /** Ratio en points de base (ex. 2500 = 25,00 %). null si dénominateur nul. */
  function ratioBps(num, den) {
    if (!den) return null;
    return divRound(num * 10000, den);
  }
  function formatBps(bps, digits) {
    if (bps === null || bps === undefined) return '—';
    const d = digits === undefined ? 1 : digits;
    const v = bps / 100; // affichage uniquement
    return v.toLocaleString('fr-CA', { minimumFractionDigits: d, maximumFractionDigits: d }) + ' %';
  }

  /* ============================ TAXES QUÉBEC ============================ */

  // TVQ = 9,975 % ne tombe pas sur des points de base entiers : on stocke en
  // millièmes de pour cent (1 % = 1000).
  const TAX_DEFAULTS = { tpsMilli: 5000, tvqMilli: 9975 };
  function salesTaxes(baseCents, rates) {
    const r = rates || TAX_DEFAULTS;
    const tps = divRound(baseCents * r.tpsMilli, 100000);
    const tvq = divRound(baseCents * r.tvqMilli, 100000);
    return { base: baseCents, tps, tvq, total: baseCents + tps + tvq };
  }

  /* =============================== DATES =============================== */

  const DAY_MS = 86400000;
  function isISODate(s) { return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && toISO(dayNum(s)) === s; }
  function dayNum(iso) {
    const y = +iso.slice(0, 4), m = +iso.slice(5, 7), d = +iso.slice(8, 10);
    return Math.round(Date.UTC(y, m - 1, d) / DAY_MS);
  }
  function toISO(n) {
    const dt = new Date(n * DAY_MS);
    return dt.getUTCFullYear().toString().padStart(4, '0') + '-' +
      String(dt.getUTCMonth() + 1).padStart(2, '0') + '-' + String(dt.getUTCDate()).padStart(2, '0');
  }
  function addDays(iso, k) { return toISO(dayNum(iso) + k); }
  function diffDays(a, b) { return dayNum(b) - dayNum(a); }
  function isLeap(y) { return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; }
  function daysInMonth(y, m) { return [31, isLeap(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1]; }
  function ym(iso) { return iso.slice(0, 7); }
  function monthRange(ymStr) {
    const y = +ymStr.slice(0, 4), m = +ymStr.slice(5, 7);
    return { from: ymStr + '-01', to: ymStr + '-' + String(daysInMonth(y, m)).padStart(2, '0') };
  }
  function addMonthsYM(ymStr, k) {
    let y = +ymStr.slice(0, 4), m = +ymStr.slice(5, 7) - 1 + k;
    y += Math.floor(m / 12); m = ((m % 12) + 12) % 12;
    return String(y).padStart(4, '0') + '-' + String(m + 1).padStart(2, '0');
  }
  /** Date du jour dans un fuseau donné (par défaut America/Toronto = Montréal). */
  function todayISO(tz, now) {
    const f = new Intl.DateTimeFormat('en-CA', { timeZone: tz || 'America/Toronto', year: 'numeric', month: '2-digit', day: '2-digit' });
    return f.format(now || new Date());
  }
  function clampDay(y, m, d) { return Math.min(d, daysInMonth(y, m)); }
  function dateOf(y, m, d) { return String(y).padStart(4, '0') + '-' + String(m).padStart(2, '0') + '-' + String(clampDay(y, m, d)).padStart(2, '0'); }
  function inRange(iso, from, to) { return (!from || iso >= from) && (!to || iso <= to); }

  /* ============================ FRÉQUENCES ============================= */

  const FREQUENCIES = {
    weekly: 'Chaque semaine',
    biweekly: 'Toutes les deux semaines',
    semimonthly: 'Deux fois par mois',
    monthly: 'Une fois par mois',
    quarterly: 'Tous les trois mois',
    yearly: 'Une fois par an',
    occasional: 'Occasionnel',
  };

  /**
   * Toutes les occurrences d'une règle entre from et to (inclus).
   * rule: { frequency, startDate, endDate?, day1?, day2? }
   *  - weekly / biweekly : tous les 7 / 14 jours à partir de startDate (jamais "deux fois par mois").
   *  - semimonthly : day1 et day2 de chaque mois (day2 = 31 => dernier jour du mois).
   *  - monthly / quarterly / yearly : même jour que startDate (ou day1), ramené au
   *    dernier jour si le mois est plus court (31 -> 30, 29 févr. -> 28 févr.).
   */
  function occurrences(rule, from, to) {
    const out = [];
    if (!rule || !rule.startDate || !isISODate(rule.startDate)) return out;
    const start = rule.startDate;
    const lo = from > start ? from : start;
    const hi = rule.endDate && rule.endDate < to ? rule.endDate : to;
    if (lo > hi) return out;
    const f = rule.frequency;
    if (f === 'weekly' || f === 'biweekly') {
      const step = f === 'weekly' ? 7 : 14;
      const s = dayNum(start), a = dayNum(lo), b = dayNum(hi);
      let k = Math.ceil((a - s) / step);
      if (k < 0) k = 0;
      for (let n = s + k * step; n <= b; n += step) out.push(toISO(n));
      return out;
    }
    if (f === 'semimonthly') {
      const d1 = rule.day1 || 15, d2 = rule.day2 || 31;
      let cur = ym(lo);
      const last = ym(hi);
      while (cur <= last) {
        const y = +cur.slice(0, 4), m = +cur.slice(5, 7);
        const days = [dateOf(y, m, d1), dateOf(y, m, d2)].sort();
        for (const d of days) if (d >= lo && d <= hi && d >= start && !out.includes(d)) out.push(d);
        cur = addMonthsYM(cur, 1);
      }
      return out;
    }
    if (f === 'monthly' || f === 'quarterly' || f === 'yearly') {
      const step = f === 'monthly' ? 1 : f === 'quarterly' ? 3 : 12;
      const day = rule.day1 || +start.slice(8, 10);
      let cur = ym(start), i = 0;
      // saute directement près de "lo"
      const gap = (+lo.slice(0, 4) - +start.slice(0, 4)) * 12 + (+lo.slice(5, 7) - +start.slice(5, 7));
      if (gap > step) { i = Math.floor((gap - 1) / step); cur = addMonthsYM(ym(start), i * step); }
      for (let guard = 0; guard < 2000; guard++) {
        const y = +cur.slice(0, 4), m = +cur.slice(5, 7);
        const d = dateOf(y, m, day);
        if (d > hi) break;
        if (d >= lo && d >= start) out.push(d);
        cur = addMonthsYM(cur, step);
      }
      return out;
    }
    return out; // occasional : aucune occurrence prévue
  }

  /* ========================= PÉRIODES DE PAIE ========================== */

  /** Période de 14 jours contenant `iso`, ancrée sur `anchor` (un jour de paie). */
  function payPeriodFor(iso, anchor) {
    const idx = Math.floor((dayNum(iso) - dayNum(anchor)) / 14);
    return payPeriodByIndex(idx, anchor);
  }
  function payPeriodByIndex(idx, anchor) {
    const start = addDays(anchor, idx * 14);
    return { index: idx, start, end: addDays(start, 13), id: 'P' + start };
  }

  /* ============================ CATÉGORIES ============================= */
  // kind: 'expense' (dépense), 'savings' (compte comme épargne, pas comme dépense),
  //       'transfer' (paiement de carte : les achats sont déjà comptés -> neutre)
  const DEFAULT_CATEGORIES = (function () {
    const groups = [
      ['logement', 'Logement', [['loyer', 'Hypothèque ou loyer'], ['copro', 'Frais de copropriété'], ['hydro', 'Électricité Hydro-Québec'], ['chauffage', 'Chauffage'], ['internet', 'Internet'], ['entretien_maison', 'Entretien'], ['reparations', 'Réparations']]],
      ['transport', 'Transport', [['auto_paiement', 'Paiement automobile'], ['essence', 'Essence'], ['assurance_auto', 'Assurance automobile'], ['stationnement', 'Stationnement'], ['entretien_auto', 'Entretien automobile'], ['pneus', 'Pneus'], ['transport_commun', 'Transport en commun'], ['uber', 'Uber et taxis']]],
      ['alimentation', 'Alimentation', [['epicerie', 'Épicerie'], ['restaurants', 'Restaurants'], ['livraison', 'Livraison'], ['cafe', 'Café'], ['depanneur', 'Dépanneur']]],
      ['quotidien', 'Vie quotidienne', [['pharmacie', 'Pharmacie'], ['vetements', 'Vêtements'], ['coiffeur', 'Coiffeur'], ['menage', 'Produits ménagers'], ['soins', 'Soins personnels'], ['loisirs', 'Loisirs'], ['sorties', 'Sorties']]],
      ['abonnements', 'Abonnements', [['netflix', 'Netflix'], ['spotify', 'Spotify'], ['apple', 'Apple'], ['telephone', 'Téléphone'], ['applications', 'Applications'], ['abonnements_autres', 'Autres abonnements']]],
      ['finances', 'Finances', [['carte_credit', 'Paiement de cartes de crédit', 'transfer'], ['prets', 'Prêts'], ['frais_bancaires', 'Frais bancaires'], ['interets', 'Intérêts'], ['investissements', 'Investissements', 'savings'], ['epargne', 'Épargne', 'savings']]],
      ['voyages', 'Voyages', [['avion', 'Billets d’avion'], ['hotels', 'Hôtels'], ['voyage_restaurants', 'Restaurants (voyage)'], ['voyage_transport', 'Transport (voyage)'], ['etranger', 'Dépenses à l’étranger']]],
      ['autres', 'Autres', [['cadeaux', 'Cadeaux'], ['imprevues', 'Dépenses imprévues'], ['urgences', 'Urgences'], ['autres_depenses', 'Autres dépenses']]],
    ];
    const out = [];
    for (const [gid, gname, items] of groups)
      for (const [id, name, kind] of items) out.push({ id, group: gid, groupName: gname, name, kind: kind || 'expense' });
    return out;
  })();
  const GROUPS = (function () {
    const seen = {}, out = [];
    for (const c of DEFAULT_CATEGORIES) if (!seen[c.group]) { seen[c.group] = 1; out.push({ id: c.group, name: c.groupName }); }
    return out;
  })();
  function categoryMap(custom) {
    const map = {};
    for (const c of DEFAULT_CATEGORIES) map[c.id] = c;
    for (const c of custom || []) map[c.id] = Object.assign({ kind: 'expense' }, c);
    return map;
  }

  /* ========================= CLASSIFICATION =========================== */

  /**
   * Effet d'une transaction sur les totaux. Une transaction n'est comptée
   * qu'une seule fois, dans une seule rubrique.
   *   income  : revenu net reçu
   *   expense : dépense (les remboursements la réduisent)
   *   savings : argent mis de côté (dépôts - retraits)
   *   neutral : transferts internes et paiements de carte (aucun effet)
   */
  function classify(tx, cats) {
    const r = { income: 0, expense: 0, savings: 0 };
    if (!tx || tx.status === 'cancelled') return r;
    const a = tx.amountCents;
    assertCents(a, 'amountCents');
    if (a < 0) throw new RangeError('Les montants sont toujours positifs ; utilisez le type « remboursement » ou « retrait ».');
    switch (tx.type) {
      case 'income': r.income = a; break;
      case 'expense': {
        const c = cats && cats[tx.categoryId];
        const kind = c ? c.kind : 'expense';
        if (kind === 'savings') r.savings = a;
        else if (kind === 'transfer') { /* neutre */ }
        else r.expense = a;
        break;
      }
      case 'refund': r.expense = -a; break;
      case 'savings': r.savings = tx.direction === 'withdraw' ? -a : a; break;
      case 'transfer': break;
      default: break;
    }
    return r;
  }

  function matches(tx, f) {
    if (!f) return true;
    if (f.from && tx.date < f.from) return false;
    if (f.to && tx.date > f.to) return false;
    if (f.person && tx.person !== f.person) return false;
    if (f.shared !== undefined && !!tx.shared !== f.shared) return false;
    if (f.categoryId && tx.categoryId !== f.categoryId) return false;
    if (f.group && !(f.cats && f.cats[tx.categoryId] && f.cats[tx.categoryId].group === f.group)) return false;
    if (f.type && tx.type !== f.type) return false;
    return true;
  }

  /** Totaux sur un ensemble de transactions (déduplication par id). */
  function totals(txs, cats, filter) {
    const t = { income: 0, expenses: 0, savings: 0, count: 0, byCategory: {}, byPerson: { khalil: { income: 0, expenses: 0, savings: 0 }, yousra: { income: 0, expenses: 0, savings: 0 } }, shared: 0, individual: 0 };
    const seen = new Set();
    const f = filter ? Object.assign({ cats }, filter) : null;
    for (const tx of txs) {
      if (!tx || seen.has(tx.id)) continue;
      seen.add(tx.id);
      if (tx.status === 'cancelled') continue;
      if (f && !matches(tx, f)) continue;
      const r = classify(tx, cats);
      if (!r.income && !r.expense && !r.savings) continue;
      t.count++;
      t.income += r.income; t.expenses += r.expense; t.savings += r.savings;
      const p = t.byPerson[tx.person];
      if (p) { p.income += r.income; p.expenses += r.expense; p.savings += r.savings; }
      if (r.expense) {
        t.byCategory[tx.categoryId] = (t.byCategory[tx.categoryId] || 0) + r.expense;
        if (tx.shared) t.shared += r.expense; else t.individual += r.expense;
      }
    }
    t.net = t.income - t.expenses;                 // ce qui reste après dépenses
    t.afterSavings = t.income - t.expenses - t.savings; // ce qui reste après épargne
    t.savingsRateBps = ratioBps(t.savings, t.income);
    return t;
  }

  /**
   * Solde bancaire disponible (comptes courants regroupés).
   * Nécessite un solde de départ ; sinon `known: false` et aucun montant certain.
   */
  function balance(txs, cats, settings, asOf) {
    const s = settings || {};
    if (s.openingBalanceCents === null || s.openingBalanceCents === undefined || !s.openingBalanceDate)
      return { known: false, cents: null, reason: 'Solde de départ non configuré' };
    const t = totals(txs, cats, { from: addDays(s.openingBalanceDate, 1), to: asOf });
    return { known: true, cents: s.openingBalanceCents + t.income - t.expenses - t.savings, since: s.openingBalanceDate };
  }

  /* ===================== REVENUS ATTENDUS / REÇUS ====================== */

  function sourceRule(src) {
    return { frequency: src.frequency, startDate: src.anchorDate, endDate: src.endDate, day1: src.day1, day2: src.day2 };
  }
  function expectedPays(sources, from, to) {
    const out = [];
    for (const s of sources || []) {
      if (s.active === false || s.frequency === 'occasional') continue;
      for (const d of occurrences(sourceRule(s), from, to))
        out.push({ sourceId: s.id, person: s.person, date: d, amountCents: s.netCents || 0, grossCents: s.grossCents || null, name: s.name });
    }
    return out.sort((a, b) => a.date < b.date ? -1 : 1);
  }
  /** Prochaine date de paie d'une source à partir de `from` (inclus). */
  function nextPayDate(src, from) {
    const o = occurrences(sourceRule(src), from, addDays(from, 400));
    return o[0] || null;
  }

  /**
   * Associe chaque paie attendue à une paie reçue (même source, ±3 jours,
   * chaque transaction utilisée une seule fois). Les paies attendues passées
   * sans correspondance sont « manquantes ».
   */
  function matchPays(expected, txs, today) {
    const used = new Set();
    const incomes = txs.filter(t => t.type === 'income' && t.status !== 'cancelled' && t.sourceId);
    return expected.map(e => {
      let best = null, bestGap = 99;
      for (const t of incomes) {
        if (used.has(t.id) || t.sourceId !== e.sourceId) continue;
        const g = Math.abs(diffDays(e.date, t.date));
        if (g <= 3 && g < bestGap) { best = t; bestGap = g; }
      }
      if (best) used.add(best.id);
      const status = best ? 'received' : (e.date < today ? 'missing' : 'expected');
      return Object.assign({}, e, { status, tx: best ? best.id : null, receivedCents: best ? best.amountCents : 0 });
    });
  }

  /* ======================== DÉPENSES RÉCURRENTES ======================= */

  /** Identifiant déterministe : une occurrence ne peut être enregistrée qu'une fois. */
  function recurringTxId(ruleId, date) { return 'r_' + ruleId + '_' + date; }

  function recurringOccurrences(rules, txs, from, to) {
    const ids = new Set(txs.filter(t => t.status !== 'cancelled').map(t => t.id));
    const out = [];
    for (const r of rules || []) {
      if (r.active === false) continue;
      for (const d of occurrences(r, from, to)) {
        const id = recurringTxId(r.id, d);
        out.push({ ruleId: r.id, date: d, amountCents: r.amountCents, kind: r.kind || 'expense', description: r.description, categoryId: r.categoryId, person: r.person, goalId: r.goalId, txId: id, paid: ids.has(id) });
      }
    }
    return out.sort((a, b) => a.date < b.date ? -1 : 1);
  }

  /** Transaction réelle créée à partir d'une occurrence (id déterministe). */
  function txFromOccurrence(rule, date) {
    const kind = rule.kind || 'expense';
    const tx = {
      id: recurringTxId(rule.id, date), date, amountCents: rule.amountCents, description: rule.description,
      person: rule.person || 'khalil', shared: !!rule.shared, method: rule.method || '', recurringId: rule.id, status: 'posted',
    };
    if (kind === 'savings') { tx.type = 'savings'; tx.direction = 'deposit'; tx.goalId = rule.goalId || null; }
    else if (kind === 'income') { tx.type = 'income'; }
    else { tx.type = 'expense'; tx.categoryId = rule.categoryId; }
    if (rule.debtId) tx.debtId = rule.debtId;
    if (rule.demo) tx.demo = true;
    return tx;
  }

  /* ========================= RÉSUMÉ D'UNE PÉRIODE ====================== */

  function periodSummary(period, data, today) {
    const { txs, cats, sources, recurring, settings } = data;
    const t = totals(txs, cats, { from: period.start, to: period.end });
    const exp = matchPays(expectedPays(sources, period.start, period.end), txs, today);
    const occ = recurringOccurrences(recurring, txs, period.start, period.end);
    const expectedIncome = exp.reduce((s, e) => s + e.amountCents, 0);
    const plannedExpenses = occ.filter(o => o.kind === 'expense').reduce((s, o) => s + o.amountCents, 0);
    const plannedSavings = occ.filter(o => o.kind === 'savings').reduce((s, o) => s + o.amountCents, 0)
      + ((settings && settings.plannedSavingsPerPeriodCents) || 0);
    const unpaidPlannedExpenses = occ.filter(o => o.kind === 'expense' && !o.paid && o.date >= (today < period.start ? period.start : today)).reduce((s, o) => s + o.amountCents, 0);
    const missing = exp.filter(e => e.status === 'missing');
    const pendingIncome = exp.filter(e => e.status !== 'received').reduce((s, e) => s + e.amountCents, 0);
    const savingsStillToSet = Math.max(0, plannedSavings - t.savings);
    // Reste à dépenser : uniquement avec l'argent réellement reçu.
    const leftToSpend = t.income - t.expenses - t.savings - savingsStillToSet - unpaidPlannedExpenses;
    return {
      period,
      expectedIncome, receivedIncome: t.income, pendingIncome,
      plannedExpenses, actualExpenses: t.expenses,
      plannedSavings, actualSavings: t.savings,
      remaining: t.income - t.expenses,                // montant restant
      afterSavings: t.income - t.expenses - t.savings, // disponible après épargne
      savingsRateBps: ratioBps(t.savings, t.income),
      leftToSpend, unpaidPlannedExpenses,
      pays: exp, occurrences: occ, missing,
      certain: missing.length === 0 && pendingIncome === 0,
      status: today < period.start ? 'future' : today > period.end ? 'past' : 'current',
      byPerson: t.byPerson, byCategory: t.byCategory,
    };
  }

  /* ============================== BUDGETS ============================== */

  function budgetLevel(pctBps) {
    if (pctBps === null) return 'none';
    if (pctBps >= 10000) return 'over';     // 100 % : dépassé
    if (pctBps >= 8500) return 'near';      // 85 % : presque atteint
    if (pctBps >= 7000) return 'watch';     // 70 % : à surveiller
    return 'ok';
  }
  function budgetStatus(budgets, txs, cats, ymStr) {
    const r = monthRange(ymStr);
    const t = totals(txs, cats, r);
    return (budgets || []).filter(b => b.limitCents > 0).map(b => {
      const spent = b.categoryId ? (t.byCategory[b.categoryId] || 0)
        : Object.keys(t.byCategory).filter(k => cats[k] && cats[k].group === b.group).reduce((s, k) => s + t.byCategory[k], 0);
      const pct = ratioBps(spent, b.limitCents);
      return { id: b.id, categoryId: b.categoryId, group: b.group, limit: b.limitCents, spent, remaining: b.limitCents - spent, pctBps: pct, level: budgetLevel(pct) };
    });
  }

  /* ============================== ÉPARGNE ============================== */

  function goalProgress(goal, txs, today) {
    let bal = goal.initialCents || 0;
    const seen = new Set();
    for (const t of txs) {
      if (seen.has(t.id)) continue; seen.add(t.id);
      if (t.status === 'cancelled' || t.type !== 'savings' || t.goalId !== goal.id) continue;
      bal += t.direction === 'withdraw' ? -t.amountCents : t.amountCents;
    }
    const remaining = Math.max(0, (goal.targetCents || 0) - bal);
    const pct = goal.targetCents ? Math.min(10000, Math.max(0, ratioBps(bal, goal.targetCents))) : null;
    let perMonth = null, monthsLeft = null;
    if (goal.targetDate && remaining > 0 && today) {
      const days = diffDays(today, goal.targetDate);
      monthsLeft = Math.max(1, Math.ceil(days / 30.4375));
      perMonth = days <= 0 ? remaining : divRound(remaining, monthsLeft);
    }
    return { id: goal.id, balance: bal, remaining, pctBps: pct, perMonthNeeded: perMonth, monthsLeft, reached: goal.targetCents ? bal >= goal.targetCents : false };
  }

  /** Épargne nette moyenne par mois sur les N derniers mois complets. */
  function savingsPace(txs, cats, today, months) {
    const n = months || 3;
    const cur = ym(today);
    let sum = 0;
    for (let i = 1; i <= n; i++) sum += totals(txs, cats, monthRange(addMonthsYM(cur, -i))).savings;
    return divRound(sum, n);
  }

  /* ============================== DETTES =============================== */

  /** Solde estimé : solde déclaré moins les paiements enregistrés depuis. */
  function debtBalance(debt, txs) {
    let paid = 0;
    for (const t of txs) if (t.status !== 'cancelled' && t.debtId === debt.id && t.date > (debt.asOfDate || '0000-00-00') && (t.type === 'expense' || t.type === 'transfer')) paid += t.amountCents;
    return Math.max(0, debt.balanceCents - paid);
  }
  /**
   * Simulation mensuelle : intérêts = solde × taux annuel ÷ 12 (arrondi au cent).
   * Retourne null si le paiement ne couvre pas les intérêts.
   */
  function debtPayoff(balanceCents, aprBps, paymentCents, startISO) {
    if (balanceCents <= 0) return { months: 0, totalInterest: 0, date: startISO };
    if (!paymentCents || paymentCents <= 0) return null;
    let bal = balanceCents, interest = 0, months = 0;
    while (bal > 0 && months < 600) {
      const i = divRound(bal * aprBps, 120000);
      if (paymentCents <= i) return null;
      interest += i;
      bal = bal + i - paymentCents;
      months++;
    }
    if (bal > 0) return null;
    const endYM = addMonthsYM(ym(startISO), months);
    return { months, totalInterest: interest, date: endYM };
  }

  /* ============================ PRÉVISIONS ============================= */

  const DEFAULT_SCENARIOS = {
    prudent: { label: 'Prudent', incomeAdjBps: -500, expenseAdjBps: 1000 },
    realiste: { label: 'Réaliste', incomeAdjBps: 0, expenseAdjBps: 0 },
    optimiste: { label: 'Optimiste', incomeAdjBps: 300, expenseAdjBps: -500 },
  };

  /** Dépenses variables moyennes par mois (hors récurrentes), N derniers mois complets. */
  function variableMonthlyAverage(txs, cats, today, months) {
    const n = months || 3;
    const cur = ym(today);
    let sum = 0, withData = 0;
    for (let i = 1; i <= n; i++) {
      const r = monthRange(addMonthsYM(cur, -i));
      const t = totals(txs.filter(x => !x.recurringId), cats, r);
      sum += t.expenses;
      if (t.count) withData++;
    }
    return { cents: withData ? divRound(sum, withData) : null, months: withData };
  }

  /**
   * Projection sur 12 mois à partir de demain : paies attendues réelles,
   * dépenses récurrentes non encore payées, dépenses variables moyennes.
   */
  function forecast(data, today, scenario, opts) {
    const { txs, cats, sources, recurring, settings, goals } = data;
    const sc = scenario || DEFAULT_SCENARIOS.realiste;
    const o = opts || {};
    const from = addDays(today, 1), to = addDays(today, 365);
    const variable = o.variableMonthlyCents !== undefined && o.variableMonthlyCents !== null
      ? { cents: o.variableMonthlyCents, months: -1 } : variableMonthlyAverage(txs, cats, today, 3);
    const pays = expectedPays(sources, from, to);
    const occ = recurringOccurrences(recurring, txs, from, to).filter(x => !x.paid);
    const bal = balance(txs, cats, settings, today);
    const rows = [];
    let cumulative = 0, cumSavings = 0;
    for (let i = 0; i <= 12; i++) {
      const m = addMonthsYM(ym(from), i);
      const r = monthRange(m);
      const lo = r.from < from ? from : r.from, hi = r.to > to ? to : r.to;
      if (lo > hi) continue;
      const covered = diffDays(lo, hi) + 1, dim = diffDays(r.from, r.to) + 1;
      const incBase = pays.filter(p => p.date >= lo && p.date <= hi).reduce((s, p) => s + p.amountCents, 0)
        + occ.filter(x => x.kind === 'income' && x.date >= lo && x.date <= hi).reduce((s, x) => s + x.amountCents, 0);
      const recExp = occ.filter(x => x.kind === 'expense' && x.date >= lo && x.date <= hi).reduce((s, x) => s + x.amountCents, 0);
      const recSav = occ.filter(x => x.kind === 'savings' && x.date >= lo && x.date <= hi).reduce((s, x) => s + x.amountCents, 0);
      const varExp = variable.cents ? divRound(variable.cents * covered, dim) : 0;
      const income = incBase + mulBps(incBase, sc.incomeAdjBps);
      const expBase = recExp + varExp;
      const expenses = expBase + mulBps(expBase, sc.expenseAdjBps);
      const net = income - expenses;
      cumulative += net; cumSavings += recSav;
      rows.push({ month: m, partial: covered < dim, income, expenses, recurringExpenses: recExp, variableExpenses: varExp, plannedSavings: recSav, net, cumulative, balance: bal.known ? bal.cents + cumulative : null });
    }
    const sum = k => rows.reduce((s, r) => s + r[k], 0);
    const annual = { income: sum('income'), expenses: sum('expenses'), net: sum('net'), plannedSavings: sum('plannedSavings') };
    // Objectifs : le surplus annuel couvre-t-il ce qui reste à épargner ?
    const goalRows = (goals || []).map(g => {
      const p = goalProgress(g, txs, today);
      return { id: g.id, name: g.name, remaining: p.remaining, balance: p.balance, target: g.targetCents };
    });
    const remainingGoals = goalRows.reduce((s, g) => s + g.remaining, 0);
    return {
      scenario: sc, from, to, rows, annual,
      startBalance: bal, endBalance: bal.known ? bal.cents + annual.net : null,
      variable, goals: goalRows, remainingGoals,
      goalsCoveredBps: remainingGoals ? Math.min(10000, Math.max(0, ratioBps(Math.max(0, annual.net), remainingGoals))) : 10000,
      incomplete: !(sources || []).some(s => s.active !== false && s.frequency !== 'occasional') || variable.cents === null,
    };
  }

  /* ============================ SÉRIES (graph.) ======================== */

  /** Séries revenus / dépenses / épargne par jour, période de paie, mois ou année. */
  function series(txs, cats, mode, today, anchor) {
    const buckets = [];
    if (mode === 'day') {
      for (let i = 29; i >= 0; i--) { const d = addDays(today, -i); buckets.push({ key: d, from: d, to: d }); }
    } else if (mode === 'period') {
      const cur = payPeriodFor(today, anchor || today);
      for (let i = 7; i >= 0; i--) { const p = payPeriodByIndex(cur.index - i, anchor || today); buckets.push({ key: p.start, from: p.start, to: p.end }); }
    } else if (mode === 'year') {
      const y = +today.slice(0, 4);
      for (let i = 2; i >= 0; i--) buckets.push({ key: String(y - i), from: (y - i) + '-01-01', to: (y - i) + '-12-31' });
    } else {
      for (let i = 11; i >= 0; i--) { const m = addMonthsYM(ym(today), -i); const r = monthRange(m); buckets.push({ key: m, from: r.from, to: r.to }); }
    }
    return buckets.map(b => { const t = totals(txs, cats, { from: b.from, to: b.to }); return { key: b.key, from: b.from, to: b.to, income: t.income, expenses: t.expenses, savings: t.savings }; });
  }

  /** Comparaison mois en cours (à date) vs même portion du mois précédent. */
  function monthToDateComparison(txs, cats, today) {
    const cur = monthRange(ym(today));
    const prevYM = addMonthsYM(ym(today), -1);
    const pr = monthRange(prevYM);
    const day = +today.slice(8, 10);
    const pdim = +pr.to.slice(8, 10);
    const prevTo = prevYM + '-' + String(Math.min(day, pdim)).padStart(2, '0');
    const a = totals(txs, cats, { from: cur.from, to: today });
    const b = totals(txs, cats, { from: pr.from, to: prevTo });
    const delta = (x, y) => ({ now: x, before: y, diff: x - y, pctBps: y ? ratioBps(x - y, y) : null });
    return { income: delta(a.income, b.income), expenses: delta(a.expenses, b.expenses), savings: delta(a.savings, b.savings) };
  }

  /* ============================ VALIDATION ============================= */

  function validateTx(tx, cats) {
    const e = {};
    if (!['income', 'expense', 'refund', 'savings', 'transfer'].includes(tx.type)) e.type = 'Type inconnu';
    if (!Number.isSafeInteger(tx.amountCents) || tx.amountCents <= 0) e.amount = 'Entrez un montant supérieur à 0';
    if (!isISODate(tx.date)) e.date = 'Date invalide';
    if (!['khalil', 'yousra'].includes(tx.person)) e.person = 'Choisissez Khalil ou Yousra';
    if ((tx.type === 'expense' || tx.type === 'refund') && !(cats && cats[tx.categoryId])) e.category = 'Choisissez une catégorie';
    if (tx.type === 'savings' && !tx.goalId) e.goal = 'Choisissez un compte d’épargne';
    if (tx.type === 'savings' && !['deposit', 'withdraw'].includes(tx.direction)) e.direction = 'Dépôt ou retrait ?';
    if (tx.type === 'transfer' && (!tx.fromAccount || !tx.toAccount || tx.fromAccount === tx.toAccount)) e.accounts = 'Choisissez deux comptes différents';
    return e;
  }

  /* ========================== DONNÉES DE DÉMO ========================== */

  function buildDemoData(today) {
    let seed = 20261105;
    const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
    const between = (a, b) => a + Math.floor(rnd() * (b - a + 1));
    // ancre : un jeudi de paie récent (paie aux deux semaines)
    const anchor = (function () { let d = addDays(today, -6); while (new Date(dayNum(d) * DAY_MS).getUTCDay() !== 4) d = addDays(d, -1); return d; })();
    const D = { demo: true };
    const sources = [
      Object.assign({ id: 'demo_src_k', person: 'khalil', name: 'Salaire', employer: 'Employeur A (démo)', frequency: 'biweekly', anchorDate: addDays(anchor, -14 * 20), grossCents: 245000, netCents: 180000, active: true }, D),
      Object.assign({ id: 'demo_src_y', person: 'yousra', name: 'Salaire', employer: 'Employeur B (démo)', frequency: 'biweekly', anchorDate: addDays(anchor, -14 * 20), grossCents: 205000, netCents: 150000, active: true }, D),
    ];
    const ruleStart = addMonthsYM(ym(today), -4) + '-01';
    const recurring = [
      { id: 'demo_r_loyer', kind: 'expense', description: 'Loyer', amountCents: 165000, categoryId: 'loyer', person: 'khalil', shared: true, frequency: 'monthly', startDate: ruleStart, day1: 1, method: 'Virement' },
      { id: 'demo_r_hydro', kind: 'expense', description: 'Hydro-Québec', amountCents: 9400, categoryId: 'hydro', person: 'yousra', shared: true, frequency: 'monthly', startDate: ruleStart, day1: 12, method: 'Prélèvement' },
      { id: 'demo_r_internet', kind: 'expense', description: 'Internet', amountCents: 7000, categoryId: 'internet', person: 'yousra', shared: true, frequency: 'monthly', startDate: ruleStart, day1: 8, method: 'Carte de crédit' },
      { id: 'demo_r_tel', kind: 'expense', description: 'Forfaits téléphone', amountCents: 10000, categoryId: 'telephone', person: 'khalil', shared: true, frequency: 'monthly', startDate: ruleStart, day1: 20, method: 'Carte de crédit' },
      { id: 'demo_r_auto', kind: 'expense', description: 'Paiement auto', amountCents: 42000, categoryId: 'auto_paiement', person: 'khalil', shared: true, frequency: 'monthly', startDate: ruleStart, day1: 15, method: 'Prélèvement', debtId: 'demo_d_auto' },
      { id: 'demo_r_assur', kind: 'expense', description: 'Assurance auto', amountCents: 9000, categoryId: 'assurance_auto', person: 'khalil', shared: true, frequency: 'monthly', startDate: ruleStart, day1: 5, method: 'Prélèvement' },
      { id: 'demo_r_netflix', kind: 'expense', description: 'Netflix', amountCents: 1899, categoryId: 'netflix', person: 'yousra', shared: true, frequency: 'monthly', startDate: ruleStart, day1: 22, method: 'Carte de crédit' },
      { id: 'demo_r_spotify', kind: 'expense', description: 'Spotify Duo', amountCents: 1699, categoryId: 'spotify', person: 'khalil', shared: true, frequency: 'monthly', startDate: ruleStart, day1: 3, method: 'Carte de crédit' },
      { id: 'demo_r_epargne', kind: 'savings', description: 'Épargne automatique', amountCents: 50000, goalId: 'demo_g_urgence', person: 'khalil', shared: true, frequency: 'biweekly', startDate: addDays(anchor, -14 * 20), method: 'Virement' },
    ].map(r => Object.assign(r, D));
    const goals = [
      { id: 'demo_g_urgence', name: 'Fonds d’urgence', owner: 'commun', targetCents: 1000000, initialCents: 320000, targetDate: addMonthsYM(ym(today), 10) + '-01' },
      { id: 'demo_g_voyage', name: 'Voyage', owner: 'commun', targetCents: 500000, initialCents: 60000, targetDate: addMonthsYM(ym(today), 8) + '-01' },
      { id: 'demo_g_maison', name: 'Achat immobilier', owner: 'commun', targetCents: 3000000, initialCents: 450000, targetDate: addMonthsYM(ym(today), 36) + '-01' },
      { id: 'demo_g_khalil', name: 'Épargne générale Khalil', owner: 'khalil', targetCents: 2000000, initialCents: 150000, targetDate: null },
      { id: 'demo_g_yousra', name: 'Épargne générale Yousra', owner: 'yousra', targetCents: 2000000, initialCents: 210000, targetDate: null },
    ].map(r => Object.assign(r, D));
    const debts = [
      { id: 'demo_d_visa', name: 'Carte Visa', kind: 'credit_card', balanceCents: 240000, originalCents: 400000, aprBps: 2099, minPaymentCents: 7200, plannedPaymentCents: 30000, paymentDay: 25, asOfDate: addDays(today, -40), person: 'khalil' },
      { id: 'demo_d_auto', name: 'Prêt automobile', kind: 'car_loan', balanceCents: 1850000, originalCents: 2800000, aprBps: 649, minPaymentCents: 42000, plannedPaymentCents: 42000, paymentDay: 15, asOfDate: addDays(today, -40), person: 'khalil' },
    ].map(r => Object.assign(r, D));
    const budgets = [
      ['epicerie', 60000], ['restaurants', 25000], ['essence', 20000], ['loisirs', 15000], ['cafe', 6000], ['livraison', 8000],
    ].map(([c, l]) => Object.assign({ id: 'demo_b_' + c, categoryId: c, limitCents: l }, D));

    const txs = [];
    const from = addMonthsYM(ym(today), -3) + '-01';
    // paies
    for (const s of sources) for (const d of occurrences(sourceRule(s), from, today))
      txs.push(Object.assign({ id: 'demo_t_pay_' + s.id + '_' + d, type: 'income', date: d, amountCents: s.netCents, person: s.person, sourceId: s.id, description: 'Paie ' + (s.person === 'khalil' ? 'Khalil' : 'Yousra'), method: 'Dépôt direct', status: 'posted' }, D));
    // récurrentes payées
    for (const r of recurring) for (const d of occurrences(r, from, today)) txs.push(txFromOccurrence(r, d));
    // variables
    const vary = [
      ['epicerie', 'Épicerie', 7, 9000, 17000, 'IGA, Metro, Maxi'], ['essence', 'Essence', 9, 5500, 7500, 'Station-service'], ['restaurants', 'Restaurant', 9, 3500, 9500, 'Souper au resto'],
      ['cafe', 'Café', 4, 450, 900, 'Café'], ['livraison', 'Livraison', 12, 2800, 4800, 'Livraison repas'], ['pharmacie', 'Pharmacie', 18, 1200, 4500, 'Jean Coutu'],
      ['loisirs', 'Loisirs', 15, 2000, 6000, 'Cinéma / activité'], ['depanneur', 'Dépanneur', 10, 400, 1500, 'Dépanneur'], ['transport_commun', 'STM', 30, 9700, 9700, 'Passe mensuelle OPUS'],
    ];
    let n = 0;
    for (const [cat, label, every, lo, hi, desc] of vary) {
      for (let d = addDays(from, between(0, every - 1)); d <= today; d = addDays(d, every + between(-1, 1))) {
        const person = rnd() < 0.5 ? 'khalil' : 'yousra';
        txs.push(Object.assign({ id: 'demo_t_v' + (n++), type: 'expense', date: d, amountCents: between(lo, hi), categoryId: cat, person, shared: cat !== 'cafe', description: desc, method: rnd() < 0.6 ? 'Carte de crédit' : 'Débit', status: 'posted' }, D));
      }
    }
    // dépôts dans d'autres comptes d'épargne
    for (const d of occurrences({ frequency: 'monthly', startDate: from, day1: 2 }, from, today)) {
      txs.push(Object.assign({ id: 'demo_t_sv_' + d, type: 'savings', direction: 'deposit', goalId: 'demo_g_voyage', date: d, amountCents: 25000, person: 'yousra', shared: true, description: 'Mise de côté voyage', status: 'posted' }, D));
      txs.push(Object.assign({ id: 'demo_t_sk_' + d, type: 'savings', direction: 'deposit', goalId: 'demo_g_khalil', date: d, amountCents: 15000, person: 'khalil', description: 'Épargne perso', status: 'posted' }, D));
    }
    // cas particuliers clairement identifiés
    txs.push(Object.assign({ id: 'demo_t_refund', type: 'refund', date: addDays(today, -9), amountCents: 3999, categoryId: 'vetements', person: 'yousra', description: 'Retour de vêtements', status: 'posted' }, D));
    txs.push(Object.assign({ id: 'demo_t_cancel', type: 'expense', date: addDays(today, -5), amountCents: 12000, categoryId: 'sorties', person: 'khalil', description: 'Billets de spectacle (annulés)', status: 'cancelled' }, D));
    txs.push(Object.assign({ id: 'demo_t_transfer', type: 'transfer', date: addDays(today, -3), amountCents: 30000, fromAccount: 'Compte Khalil', toAccount: 'Compte Yousra', person: 'khalil', description: 'Virement entre nos comptes', status: 'posted' }, D));
    txs.push(Object.assign({ id: 'demo_t_visa', type: 'expense', date: addDays(today, -12), amountCents: 30000, categoryId: 'carte_credit', debtId: 'demo_d_visa', person: 'khalil', description: 'Paiement carte Visa', status: 'posted' }, D));
    const events = [
      Object.assign({ id: 'demo_e_impots', title: 'Acomptes provisionnels (rappel)', date: addDays(today, 40), kind: 'bill', notes: 'Exemple d’événement' }, D),
    ];
    return {
      settings: { anchorDate: anchor, openingBalanceCents: 420000, openingBalanceDate: addDays(from, -1), demoLoaded: true },
      sources, recurring, goals, debts, budgets, txs, events,
    };
  }

  return {
    // argent
    divRound, mulBps, parseMoney, formatMoney, ratioBps, formatBps, salesTaxes, TAX_DEFAULTS,
    // dates
    isISODate, dayNum, toISO, addDays, diffDays, isLeap, daysInMonth, ym, monthRange, addMonthsYM, todayISO, inRange,
    // règles
    FREQUENCIES, occurrences, payPeriodFor, payPeriodByIndex,
    DEFAULT_CATEGORIES, GROUPS, categoryMap,
    classify, totals, balance,
    expectedPays, nextPayDate, matchPays,
    recurringTxId, recurringOccurrences, txFromOccurrence,
    periodSummary, budgetLevel, budgetStatus, goalProgress, savingsPace,
    debtBalance, debtPayoff, DEFAULT_SCENARIOS, variableMonthlyAverage, forecast,
    series, monthToDateComparison, validateTx, buildDemoData,
  };
});
