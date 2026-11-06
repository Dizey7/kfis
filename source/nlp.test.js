const test = require('node:test');
const assert = require('node:assert/strict');
const K = require('./core.js');
const N = require('./nlp.js');

const today = '2026-11-06'; // vendredi
const ctx = {
  today, me: 'khalil', cats: K.categoryMap([]),
  sources: [{ id: 'sk', person: 'khalil', name: 'Salaire', frequency: 'biweekly', anchorDate: '2026-10-29', netCents: 180000 }, { id: 'sy', person: 'yousra', name: 'Salaire', frequency: 'biweekly', anchorDate: '2026-10-29', netCents: 150000 }],
  goals: [{ id: 'gu', name: 'Fonds d’urgence', owner: 'commun' }, { id: 'gv', name: 'Voyage', owner: 'commun' }, { id: 'gk', name: 'Épargne Khalil', owner: 'khalil' }],
  debts: [{ id: 'dv', name: 'Carte Visa', kind: 'credit_card' }],
};
const P = s => N.parseLine(s, ctx);

test('dépense simple avec date relative et partage', () => {
  const r = P('45 $ resto avec Yousra hier');
  assert.equal(r.ok, true);
  assert.equal(r.tx.type, 'expense'); assert.equal(r.tx.amountCents, 4500);
  assert.equal(r.tx.categoryId, 'restaurants'); assert.equal(r.tx.date, '2026-11-05');
  assert.equal(r.tx.shared, true); assert.equal(r.tx.person, 'khalil');
  assert.equal(r.confidence, 'high');
});
test('montant décimal à la française, commerçant', () => {
  const r = P('IGA 127,84');
  assert.equal(r.tx.amountCents, 12784); assert.equal(r.tx.categoryId, 'epicerie'); assert.equal(r.tx.shared, true);
});
test('Metro épicerie vs métro transport', () => {
  assert.equal(P('Metro 80$').tx.categoryId, 'epicerie');
  assert.equal(P('passe de métro 97$').tx.categoryId, 'transport_commun');
});
test('payeur : « Yousra a payé »', () => {
  const r = P('Yousra a payé la pharmacie 23,10');
  assert.equal(r.tx.person, 'yousra'); assert.equal(r.tx.categoryId, 'pharmacie'); assert.equal(r.tx.amountCents, 2310);
});
test('paie : source et montant habituel', () => {
  const r = P('paie Yousra');
  assert.equal(r.tx.type, 'income'); assert.equal(r.tx.person, 'yousra'); assert.equal(r.tx.sourceId, 'sy'); assert.equal(r.tx.amountCents, 150000);
  const r2 = P('reçu ma paie 1 812,40 $');
  assert.equal(r2.tx.type, 'income'); assert.equal(r2.tx.amountCents, 181240); assert.equal(r2.tx.sourceId, 'sk');
});
test('épargne : objectif reconnu, retrait', () => {
  const r = P('mis 200$ de côté pour le voyage');
  assert.equal(r.tx.type, 'savings'); assert.equal(r.tx.goalId, 'gv'); assert.equal(r.tx.direction, 'deposit');
  const w = P('retiré 500 du fonds d’urgence');
  assert.equal(w.tx.type, 'savings'); assert.equal(w.tx.direction, 'withdraw'); assert.equal(w.tx.goalId, 'gu');
});
test('paiement de carte : neutre et lié à la dette', () => {
  const r = P('paiement visa 300$');
  assert.equal(r.tx.categoryId, 'carte_credit'); assert.equal(r.tx.debtId, 'dv');
});
test('remboursement', () => {
  const r = P('remboursement Zara 39,99');
  assert.equal(r.tx.type, 'refund'); assert.equal(r.tx.categoryId, 'vetements');
});
test('transfert entre comptes', () => {
  const r = P('transféré 300 à Yousra');
  assert.equal(r.tx.type, 'transfer'); assert.equal(r.tx.fromAccount, 'Compte Khalil'); assert.equal(r.tx.toAccount, 'Compte Yousra');
});
test('dates : jour de semaine, « le 3 », « 3 nov », jj/mm', () => {
  assert.equal(P('essence 60 lundi').tx.date, '2026-11-02');
  assert.equal(P('essence 60 vendredi').tx.date, '2026-10-30'); // vendredi dernier, pas aujourd'hui
  assert.equal(P('le 3 essence 60').tx.amountCents, 6000);
  assert.equal(P('le 3 essence 60').tx.date, '2026-11-03');
  assert.equal(P('3 nov café 4,50').tx.date, '2026-11-03');
  assert.equal(P('3 nov café 4,50').tx.amountCents, 450);
  assert.equal(P('2/11 essence 55').tx.date, '2026-11-02');
  assert.equal(P('le 20 cadeau 50$').tx.date, '2026-10-20'); // le 20 nov. est futur -> octobre
});
test('taxes ajoutées', () => {
  const r = P('chaise 100 $ + taxes');
  assert.equal(r.tx.amountCents, 11498);
});
test('montant manquant -> pas enregistrable', () => {
  const r = P('resto avec Yousra');
  assert.equal(r.ok, false); assert.deepEqual(r.missing, ['montant']);
});
test('catégorie inconnue -> faible confiance', () => {
  const r = P('truc bizarre 12$');
  assert.equal(r.ok, true); assert.equal(r.confidence, 'low'); assert.equal(r.tx.categoryId, 'autres_depenses');
});
test('plusieurs lignes', () => {
  const rs = N.parseText('café 4,25\nessence 62 $; Netflix 18,99', ctx);
  assert.deepEqual(rs.map(r => r.tx.categoryId), ['cafe', 'essence', 'netflix']);
  assert.deepEqual(rs.map(r => r.tx.amountCents), [425, 6200, 1899]);
});
test('milliers avec espace', () => {
  assert.equal(P('loyer 1 650 $').tx.amountCents, 165000);
  assert.equal(P('loyer 1 650 $').tx.categoryId, 'loyer');
});
test('description propre', () => {
  assert.equal(P('45 $ resto avec Yousra hier').tx.description, 'Resto avec Yousra');
  assert.equal(P("j'ai payé 12$ chez Tim").tx.description, 'Tim');
  assert.equal(P('Yousra a payé la pharmacie 23,10').tx.description, 'La pharmacie');
});

/* ---- Corrections : verbe « payer », récurrences, sources ---- */
test('« on paie un loyer » = dépense, jamais un revenu', () => {
  const r = P('on paie le loyer 1174 $ aujourd’hui');
  assert.equal(r.tx.type, 'expense'); assert.equal(r.tx.categoryId, 'loyer');
  assert.equal(P('je paie Hydro 94').tx.type, 'expense');
  assert.equal(P('paiement du loyer 1174').tx.type, 'expense');
});
test('« chaque 1er du mois » -> dépense récurrente mensuelle', () => {
  const r = N.parseText('Chaque 1er du mois, on paie un loyer 1174 $', ctx)[0];
  assert.equal(r.kind, 'rule'); assert.equal(r.ok, true);
  assert.equal(r.rule.frequency, 'monthly'); assert.equal(r.rule.day1, 1);
  assert.equal(r.rule.amountCents, 117400); assert.equal(r.rule.categoryId, 'loyer');
  assert.equal(r.rule.startDate, '2026-11-01'); assert.equal(r.rule.shared, true);
});
test('« Netflix 18,99 par mois le 22 » et « Hydro tous les mois »', () => {
  const r = P('Netflix 18,99 $ par mois le 22');
  assert.equal(r.kind, 'rule'); assert.equal(r.rule.day1, 22); assert.equal(r.rule.categoryId, 'netflix');
  assert.equal(P('épicerie 150 chaque semaine').rule.frequency, 'weekly');
});
test('épargne automatique aux deux semaines', () => {
  const r = P('mettre 200 $ de côté pour le voyage aux deux semaines');
  assert.equal(r.kind, 'rule'); assert.equal(r.rule.kind, 'savings'); assert.equal(r.rule.goalId, 'gv'); assert.equal(r.rule.frequency, 'biweekly');
});
test('deux sources de paie dans une phrase', () => {
  const rs = N.parseText("Khalil reçoit 1600 net par paie et Yousra 1800 $ net par paie, payé à chaque 02 semaines de l'année", ctx);
  assert.equal(rs.length, 2);
  assert.deepEqual(rs.map(r => r.kind), ['source', 'source']);
  assert.deepEqual(rs.map(r => r.source.person), ['khalil', 'yousra']);
  assert.deepEqual(rs.map(r => r.source.netCents), [160000, 180000]);
  assert.deepEqual(rs.map(r => r.source.frequency), ['biweekly', 'biweekly']);
});
test('montant manquant pour Yousra signalé', () => {
  const rs = N.parseText('Khalil reçoit 1600 net par paie et Yousra net par paie aux deux semaines', ctx);
  assert.deepEqual(rs[1].missing, ['montant net']);
});
test('une paie reçue ponctuelle reste une transaction', () => {
  const r = P('reçu ma paie 1 812,40 $');
  assert.equal(r.kind, 'tx'); assert.equal(r.tx.type, 'income');
});

test('descriptions de récurrences nettoyées', () => {
  assert.equal(N.parseText('Chaque 1er du mois, on paie un loyer 1174 $', ctx)[0].rule.description, 'Loyer');
  assert.equal(P('Netflix 18,99 $ par mois le 22').rule.description, 'Netflix');
});

/* ---- Reçus ---- */
const R1 = `IGA EXTRA
Marché Lambert
1234 boul. Saint-Laurent, Montréal QC
Tél. 514-555-0199
2026/11/04 18:42
LAIT 2% 4L          6,49
PAIN               3,99
POULET           14,87
FROMAGE           8,99 FP
SOUS-TOTAL        34,34
TPS 5%             0,45
TVQ 9,975%         0,90
TOTAL             35,69
VISA ************1234   35,69
MERCI DE VOTRE VISITE`;
test('reçu d’épicerie : total, taxes, date, commerçant, catégorie', () => {
  const r = N.parseReceipt(R1, ctx);
  assert.equal(r.totalCents, 3569); assert.equal(r.subtotalCents, 3434);
  assert.equal(r.tpsCents, 45); assert.equal(r.tvqCents, 90);
  assert.equal(r.date, '2026-11-04'); assert.equal(r.merchant, 'IGA');
  assert.equal(r.categoryId, 'epicerie'); assert.equal(r.method, 'Carte de crédit');
});
const R2 = `Chez Ma Tante
Restaurant
6/11/2026
2 Poutine   25.00
Biere       8.50
Sous-total 33.50
GST 1.68
QST 3.34
Total 38.52
Pourboire 6.00
INTERAC`;
test('reçu de resto : point décimal, jj/mm/aaaa, débit', () => {
  const r = N.parseReceipt(R2, ctx);
  assert.equal(r.totalCents, 3852); assert.equal(r.date, '2026-11-06');
  assert.equal(r.categoryId, 'restaurants'); assert.equal(r.method, 'Débit'); assert.equal(r.merchant, 'Chez Ma Tante');
});
test('reçu sans mot TOTAL : montant le plus élevé + avertissement', () => {
  const r = N.parseReceipt('Petro-Canada\n55,23\n2026-11-05', ctx);
  assert.equal(r.totalCents, 5523); assert.equal(r.categoryId, 'essence');
  assert.ok(r.warnings.some(w => /deviné/.test(w)));
});
test('date future ou absurde rejetée', () => {
  const r = N.parseReceipt('Tim Hortons\nTOTAL 4,25\n2031-01-01', ctx);
  assert.equal(r.date, '2026-11-06'); assert.equal(r.categoryId, 'cafe');
});

test('reçu lu avec des confusions (e,22 / Ssous-TOTAL)', () => {
  const r = N.parseReceipt('METRO PLUS\n2026-11-05 17:32 CAISSE 4\nBANANES 2,15\nSsous-TOTAL 33,50\nTPS 5% e,22\nTVQ 9,975% 0,45\nTOTAL 34,17\nMASTERCARD ****4821', ctx);
  assert.equal(r.tpsCents, 22); assert.equal(r.tvqCents, 45); assert.equal(r.totalCents, 3417); assert.equal(r.merchant, 'Metro'); assert.deepEqual(r.warnings, []);
});
