// Tests automatisés du moteur de calcul — exécuter : node --test core.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const K = require('./core.js');

const cats = K.categoryMap([]);
let idn = 0;
const tx = (o) => Object.assign({ id: 't' + (idn++), status: 'posted', person: 'khalil', date: '2026-11-03' }, o);

/* ---------------- Argent ---------------- */
test('parseMoney : formats canadiens, cents entiers', () => {
  assert.equal(K.parseMoney('1 234,56'), 123456);
  assert.equal(K.parseMoney('1234.5'), 123450);
  assert.equal(K.parseMoney('12 $'), 1200);
  assert.equal(K.parseMoney('0,1'), 10);
  assert.equal(K.parseMoney('1.234,56'), 123456);
  assert.equal(K.parseMoney('-3,10'), -310);
  assert.equal(K.parseMoney('abc'), null);
  assert.equal(K.parseMoney(''), null);
  assert.equal(K.parseMoney('1,2,3'), null);
});
test('pas d’erreur de flottant : 0,10 + 0,20 = 0,30', () => {
  const t = K.totals([tx({ type: 'expense', amountCents: K.parseMoney('0,10'), categoryId: 'cafe' }), tx({ type: 'expense', amountCents: K.parseMoney('0,20'), categoryId: 'cafe' })], cats);
  assert.equal(t.expenses, 30);
});
test('formatMoney fr-CA', () => {
  assert.equal(K.formatMoney(123456), '1 234,56 $');
  assert.equal(K.formatMoney(-5), '−0,05 $');
  assert.equal(K.formatMoney(null), '—');
});
test('divRound arrondit au plus proche', () => {
  assert.equal(K.divRound(5, 2), 3);
  assert.equal(K.divRound(-5, 2), -3);
  assert.equal(K.divRound(4, 3), 1);
  assert.throws(() => K.divRound(1, 0));
});
test('TPS + TVQ', () => {
  const t = K.salesTaxes(10000);
  assert.deepEqual([t.tps, t.tvq, t.total], [500, 998, 11498]);
});

/* ---------------- Revenus, dépenses, économies ---------------- */
test('exemple du cahier des charges : période de 14 jours', () => {
  const anchor = '2026-10-29';
  const p = K.payPeriodFor('2026-11-05', anchor);
  const d = '2026-10-30';
  const txs = [
    tx({ type: 'income', amountCents: 180000, person: 'khalil', date: d }),
    tx({ type: 'income', amountCents: 150000, person: 'yousra', date: d }),
    tx({ type: 'expense', amountCents: 25000, categoryId: 'epicerie', date: d }),
    tx({ type: 'expense', amountCents: 10000, categoryId: 'essence', date: d }),
    tx({ type: 'expense', amountCents: 12000, categoryId: 'restaurants', date: d }),
    tx({ type: 'expense', amountCents: 9000, categoryId: 'assurance_auto', date: d }),
    tx({ type: 'expense', amountCents: 10000, categoryId: 'telephone', date: d }),
    tx({ type: 'savings', direction: 'deposit', goalId: 'g', amountCents: 100000, date: d }),
  ];
  const s = K.periodSummary(p, { txs, cats, sources: [], recurring: [], settings: {} }, '2026-11-05');
  assert.equal(s.receivedIncome, 330000);
  assert.equal(s.actualExpenses, 66000);
  assert.equal(s.remaining, 264000);
  assert.equal(s.actualSavings, 100000);
  assert.equal(s.afterSavings, 164000);
  assert.equal(s.savingsRateBps, 3030); // 1000/3300 = 30,30 %
});
test('addition des revenus par personne', () => {
  const t = K.totals([tx({ type: 'income', amountCents: 100, person: 'khalil' }), tx({ type: 'income', amountCents: 250, person: 'yousra' }), tx({ type: 'income', amountCents: 50, person: 'yousra' })], cats);
  assert.equal(t.income, 400);
  assert.equal(t.byPerson.khalil.income, 100);
  assert.equal(t.byPerson.yousra.income, 300);
});
test('aucun double comptage : même transaction deux fois', () => {
  const a = tx({ type: 'expense', amountCents: 5000, categoryId: 'epicerie' });
  assert.equal(K.totals([a, a, Object.assign({}, a)], cats).expenses, 5000);
});
test('taux d’épargne : null sans revenu (jamais de division par zéro)', () => {
  const t = K.totals([tx({ type: 'savings', direction: 'deposit', goalId: 'g', amountCents: 100 })], cats);
  assert.equal(t.savingsRateBps, null);
});
test('dépenses communes vs individuelles', () => {
  const t = K.totals([tx({ type: 'expense', amountCents: 100, categoryId: 'loyer', shared: true }), tx({ type: 'expense', amountCents: 30, categoryId: 'cafe', shared: false })], cats);
  assert.equal(t.shared, 100); assert.equal(t.individual, 30);
});

/* ---------------- Transferts, remboursements, annulations ---------------- */
test('les transferts internes ne sont ni des revenus ni des dépenses', () => {
  const t = K.totals([tx({ type: 'income', amountCents: 1000 }), tx({ type: 'transfer', amountCents: 500, fromAccount: 'A', toAccount: 'B' })], cats);
  assert.equal(t.income, 1000); assert.equal(t.expenses, 0); assert.equal(t.savings, 0);
});
test('paiement de carte de crédit : neutre (achats déjà comptés)', () => {
  const t = K.totals([tx({ type: 'expense', amountCents: 8000, categoryId: 'restaurants' }), tx({ type: 'expense', amountCents: 8000, categoryId: 'carte_credit' })], cats);
  assert.equal(t.expenses, 8000);
});
test('catégorie Épargne comptée comme épargne, pas comme dépense', () => {
  const t = K.totals([tx({ type: 'income', amountCents: 10000 }), tx({ type: 'expense', amountCents: 2000, categoryId: 'epargne' })], cats);
  assert.equal(t.expenses, 0); assert.equal(t.savings, 2000);
});
test('dépôt puis retrait d’épargne : aucun double comptage', () => {
  const t = K.totals([tx({ type: 'savings', direction: 'deposit', goalId: 'g', amountCents: 1000 }), tx({ type: 'savings', direction: 'withdraw', goalId: 'g', amountCents: 400 })], cats);
  assert.equal(t.savings, 600); assert.equal(t.expenses, 0);
});
test('remboursement réduit la dépense de la catégorie', () => {
  const t = K.totals([tx({ type: 'expense', amountCents: 5000, categoryId: 'vetements' }), tx({ type: 'refund', amountCents: 2000, categoryId: 'vetements' })], cats);
  assert.equal(t.expenses, 3000); assert.equal(t.byCategory.vetements, 3000);
});
test('dépense annulée ignorée partout', () => {
  const t = K.totals([tx({ type: 'expense', amountCents: 5000, categoryId: 'sorties', status: 'cancelled' })], cats);
  assert.equal(t.expenses, 0); assert.equal(t.count, 0);
});
test('montant négatif refusé', () => {
  assert.throws(() => K.classify(tx({ type: 'expense', amountCents: -1, categoryId: 'cafe' }), cats));
});

/* ---------------- Solde ---------------- */
test('solde disponible = départ + revenus − dépenses − épargne (transferts neutres)', () => {
  const settings = { openingBalanceCents: 100000, openingBalanceDate: '2026-10-31' };
  const txs = [
    tx({ type: 'income', amountCents: 50000, date: '2026-11-01' }),
    tx({ type: 'expense', amountCents: 20000, categoryId: 'epicerie', date: '2026-11-02' }),
    tx({ type: 'savings', direction: 'deposit', goalId: 'g', amountCents: 10000, date: '2026-11-02' }),
    tx({ type: 'transfer', amountCents: 99999, fromAccount: 'A', toAccount: 'B', date: '2026-11-02' }),
    tx({ type: 'expense', amountCents: 77777, categoryId: 'epicerie', date: '2026-10-31' }), // avant/au jour du solde de départ : déjà inclus
  ];
  const b = K.balance(txs, cats, settings, '2026-11-05');
  assert.equal(b.known, true); assert.equal(b.cents, 120000);
});
test('solde jamais affiché comme certain sans solde de départ', () => {
  const b = K.balance([], cats, {}, '2026-11-05');
  assert.equal(b.known, false); assert.equal(b.cents, null);
});

/* ---------------- Paies aux deux semaines ---------------- */
test('périodes de 14 jours exactes et contiguës', () => {
  const a = '2026-01-01';
  let p = K.payPeriodFor('2026-01-01', a);
  for (let i = 0; i < 60; i++) {
    assert.equal(K.diffDays(p.start, p.end), 13);
    const n = K.payPeriodByIndex(p.index + 1, a);
    assert.equal(K.addDays(p.end, 1), n.start);
    p = n;
  }
  assert.equal(K.payPeriodFor('2025-12-31', a).start, '2025-12-18'); // avant l'ancre
});
test('aux deux semaines ≠ deux fois par mois', () => {
  const bi = K.occurrences({ frequency: 'biweekly', startDate: '2026-01-01' }, '2026-01-01', '2026-12-31');
  const semi = K.occurrences({ frequency: 'semimonthly', startDate: '2026-01-01', day1: 15, day2: 31 }, '2026-01-01', '2026-12-31');
  assert.equal(bi.length, 27); // à partir du 1er janvier 2026 : 27 paies (1er janv. … 31 déc.)
  assert.equal(K.occurrences({ frequency: 'biweekly', startDate: '2026-01-02' }, '2026-01-01', '2026-12-31').length, 26);
  assert.equal(semi.length, 24);
  assert.ok(semi.includes('2026-02-28'));
  for (let i = 1; i < bi.length; i++) assert.equal(K.diffDays(bi[i - 1], bi[i]), 14);
});
test('mois à trois paies détecté', () => {
  const bi = K.occurrences({ frequency: 'biweekly', startDate: '2026-01-02' }, '2026-01-01', '2026-12-31');
  const perMonth = {};
  bi.forEach(d => perMonth[d.slice(0, 7)] = (perMonth[d.slice(0, 7)] || 0) + 1);
  assert.ok(Object.values(perMonth).includes(3));
});
test('paie manquante signalée, paie reçue associée une seule fois', () => {
  const src = { id: 's1', person: 'khalil', frequency: 'biweekly', anchorDate: '2026-10-01', netCents: 180000 };
  const exp = K.expectedPays([src], '2026-10-01', '2026-10-31');
  assert.deepEqual(exp.map(e => e.date), ['2026-10-01', '2026-10-15', '2026-10-29']);
  const txs = [tx({ type: 'income', sourceId: 's1', amountCents: 180000, date: '2026-10-02' })];
  const m = K.matchPays(exp, txs, '2026-10-20');
  assert.deepEqual(m.map(x => x.status), ['received', 'missing', 'expected']);
});
test('période avec paie manquante : non certaine', () => {
  const src = { id: 's1', person: 'khalil', frequency: 'biweekly', anchorDate: '2026-10-29', netCents: 180000 };
  const p = K.payPeriodFor('2026-11-05', '2026-10-29');
  const s = K.periodSummary(p, { txs: [], cats, sources: [src], recurring: [], settings: {} }, '2026-11-05');
  assert.equal(s.missing.length, 1); assert.equal(s.certain, false); assert.equal(s.expectedIncome, 180000); assert.equal(s.receivedIncome, 0);
});
test('prochaine date de paie', () => {
  assert.equal(K.nextPayDate({ frequency: 'biweekly', anchorDate: '2026-10-29' }, '2026-11-05'), '2026-11-12');
  assert.equal(K.nextPayDate({ frequency: 'weekly', anchorDate: '2026-10-29' }, '2026-11-05'), '2026-11-05');
});

/* ---------------- Récurrences ---------------- */
test('dépense récurrente : identifiant déterministe, jamais recréée', () => {
  const rule = { id: 'loyer', kind: 'expense', amountCents: 165000, categoryId: 'loyer', frequency: 'monthly', startDate: '2026-01-01' };
  const t1 = K.txFromOccurrence(rule, '2026-11-01');
  const t2 = K.txFromOccurrence(rule, '2026-11-01');
  assert.equal(t1.id, t2.id);
  const occ = K.recurringOccurrences([rule], [t1], '2026-11-01', '2026-12-31');
  assert.deepEqual(occ.map(o => o.paid), [true, false]);
  assert.equal(K.totals([t1, t2], cats).expenses, 165000);
});
test('mensuel le 31 : ramené au dernier jour du mois', () => {
  const o = K.occurrences({ frequency: 'monthly', startDate: '2026-01-31' }, '2026-01-01', '2026-06-30');
  assert.deepEqual(o, ['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30', '2026-05-31', '2026-06-30']);
});
test('fin de règle respectée', () => {
  const o = K.occurrences({ frequency: 'weekly', startDate: '2026-11-02', endDate: '2026-11-16' }, '2026-01-01', '2026-12-31');
  assert.deepEqual(o, ['2026-11-02', '2026-11-09', '2026-11-16']);
});

/* ---------------- Cas particuliers de calendrier ---------------- */
test('année bissextile : 29 février', () => {
  assert.equal(K.daysInMonth(2028, 2), 29); assert.equal(K.daysInMonth(2026, 2), 28);
  assert.equal(K.isLeap(2000), true); assert.equal(K.isLeap(2100), false);
  const o = K.occurrences({ frequency: 'yearly', startDate: '2028-02-29' }, '2028-01-01', '2032-12-31');
  assert.deepEqual(o, ['2028-02-29', '2029-02-28', '2030-02-28', '2031-02-28', '2032-02-29']);
  assert.equal(K.addDays('2028-02-28', 1), '2028-02-29');
  const p = K.payPeriodFor('2028-02-29', '2028-02-17');
  assert.equal(p.end, '2028-03-01');
});
test('changement de mois et d’année : une période peut chevaucher', () => {
  const p = K.payPeriodFor('2026-12-31', '2026-12-24');
  assert.deepEqual([p.start, p.end], ['2026-12-24', '2027-01-06']);
  assert.equal(K.addMonthsYM('2026-12', 1), '2027-01');
  assert.equal(K.addMonthsYM('2027-01', -1), '2026-12');
  const t = K.totals([tx({ type: 'expense', amountCents: 100, categoryId: 'cafe', date: '2026-12-31' }), tx({ type: 'expense', amountCents: 200, categoryId: 'cafe', date: '2027-01-01' })], cats, K.monthRange('2027-01'));
  assert.equal(t.expenses, 200);
});
test('date du jour à Montréal (fuseau America/Toronto)', () => {
  // 2026-11-06 03:30 UTC = 2026-11-05 22:30 à Montréal
  assert.equal(K.todayISO('America/Toronto', new Date(Date.UTC(2026, 10, 6, 3, 30))), '2026-11-05');
});

/* ---------------- Budgets ---------------- */
test('alertes budgétaires à 70 %, 85 % et 100 %', () => {
  assert.equal(K.budgetLevel(6999), 'ok');
  assert.equal(K.budgetLevel(7000), 'watch');
  assert.equal(K.budgetLevel(8500), 'near');
  assert.equal(K.budgetLevel(10000), 'over');
  const st = K.budgetStatus([{ id: 'b', categoryId: 'epicerie', limitCents: 60000 }], [tx({ type: 'expense', amountCents: 51000, categoryId: 'epicerie', date: '2026-11-02' })], cats, '2026-11');
  assert.equal(st[0].remaining, 9000); assert.equal(st[0].pctBps, 8500); assert.equal(st[0].level, 'near');
});

/* ---------------- Épargne & dettes ---------------- */
test('progression d’objectif d’épargne', () => {
  const g = { id: 'g', targetCents: 1000000, initialCents: 200000, targetDate: '2027-11-05' };
  const p = K.goalProgress(g, [tx({ type: 'savings', direction: 'deposit', goalId: 'g', amountCents: 300000 }), tx({ type: 'savings', direction: 'withdraw', goalId: 'g', amountCents: 100000 })], '2026-11-05');
  assert.equal(p.balance, 400000); assert.equal(p.remaining, 600000); assert.equal(p.pctBps, 4000);
  assert.equal(p.monthsLeft, 12); assert.equal(p.perMonthNeeded, 50000);
});
test('remboursement de dette : simulation et paiement insuffisant', () => {
  const r = K.debtPayoff(100000, 1200, 10000, '2026-11-05'); // 1 000 $ à 12 %, 100 $/mois
  assert.equal(r.months, 11);
  assert.ok(r.totalInterest > 0 && r.totalInterest < 10000);
  assert.equal(K.debtPayoff(100000, 2400, 1000, '2026-11-05'), null); // 10 $ < 20 $ d'intérêts
  assert.equal(K.debtPayoff(0, 2000, 100, '2026-11-05').months, 0);
});

/* ---------------- Prévisions ---------------- */
test('prévisions annuelles : paies réelles + récurrentes + variables', () => {
  const data = {
    txs: [], cats, goals: [],
    sources: [{ id: 's', person: 'khalil', frequency: 'biweekly', anchorDate: '2026-11-06', netCents: 100000 }],
    recurring: [{ id: 'r', kind: 'expense', amountCents: 50000, categoryId: 'loyer', frequency: 'monthly', startDate: '2026-12-01' }],
    settings: { openingBalanceCents: 0, openingBalanceDate: '2026-11-05' },
  };
  const f = K.forecast(data, '2026-11-05', K.DEFAULT_SCENARIOS.realiste, { variableMonthlyCents: 0 });
  assert.equal(f.annual.income, 27 * 100000); // 27 paies sur 365 jours à partir du 6 nov.
  assert.equal(f.annual.expenses, 12 * 50000);
  assert.equal(f.endBalance, f.annual.net);
  const p = K.forecast(data, '2026-11-05', K.DEFAULT_SCENARIOS.prudent, { variableMonthlyCents: 0 });
  assert.ok(p.annual.income < f.annual.income && p.annual.income >= 2700000 - K.mulBps(2700000, 500) - 13); // −5 % (arrondi au cent par mois)
  assert.ok(p.annual.expenses > f.annual.expenses);
  assert.ok(p.annual.net < f.annual.net);
  const o = K.forecast(data, '2026-11-05', K.DEFAULT_SCENARIOS.optimiste, { variableMonthlyCents: 0 });
  assert.ok(o.annual.net > f.annual.net);
});
test('prévisions : récurrentes déjà payées non comptées deux fois', () => {
  const rule = { id: 'r', kind: 'expense', amountCents: 50000, categoryId: 'loyer', frequency: 'monthly', startDate: '2026-12-01' };
  const paid = K.txFromOccurrence(rule, '2026-12-01');
  const base = { cats, goals: [], sources: [], recurring: [rule], settings: {} };
  const a = K.forecast(Object.assign({ txs: [] }, base), '2026-11-05', undefined, { variableMonthlyCents: 0 });
  const b = K.forecast(Object.assign({ txs: [paid] }, base), '2026-11-05', undefined, { variableMonthlyCents: 0 });
  assert.equal(a.annual.expenses - b.annual.expenses, 50000);
});

/* ---------------- Validation & démo ---------------- */
test('validation des formulaires', () => {
  const e = K.validateTx({ type: 'expense', amountCents: 0, date: '2026-02-30', person: 'x' }, cats);
  assert.ok(e.amount && e.date && e.person && e.category);
  assert.deepEqual(K.validateTx({ type: 'transfer', amountCents: 5, date: '2026-02-28', person: 'khalil', fromAccount: 'A', toAccount: 'B' }, cats), {});
});
test('données de démo : toutes identifiées, ids uniques, totaux cohérents', () => {
  const d = K.buildDemoData('2026-11-05');
  const all = [...d.txs, ...d.sources, ...d.recurring, ...d.goals, ...d.debts, ...d.budgets, ...d.events];
  assert.ok(all.every(x => x.demo === true));
  assert.equal(new Set(d.txs.map(t => t.id)).size, d.txs.length);
  for (const t of d.txs) assert.deepEqual(K.validateTx(t, cats), {}, t.id);
  const b = K.balance(d.txs, cats, d.settings, '2026-11-05');
  assert.equal(b.known, true);
});
