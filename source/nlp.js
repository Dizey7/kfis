/*
 * KFI'S — saisie en langage naturel (français québécois)
 * « 45 $ resto avec Yousra hier » -> transaction structurée.
 * Analyse 100 % locale, déterministe et testable : aucun texte n'est envoyé ailleurs.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./core.js'));
  else root.KYF_NLP = factory(root.KYF);
})(typeof self !== 'undefined' ? self : this, function (K) {
  'use strict';

  const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, "'");
  const MONTHS = { janvier: 1, janv: 1, jan: 1, fevrier: 2, fevr: 2, fev: 2, mars: 3, mar: 3, avril: 4, avr: 4, mai: 5, juin: 6, juillet: 7, juil: 7, aout: 8, septembre: 9, sept: 9, sep: 9, octobre: 10, oct: 10, novembre: 11, nov: 11, decembre: 12, dec: 12 };
  const WEEKDAYS = { dimanche: 0, lundi: 1, mardi: 2, mercredi: 3, jeudi: 4, vendredi: 5, samedi: 6 };

  /* Mots-clés -> catégorie. Testés sur le texte SANS accents, sauf `exact` (avec accents). */
  const CAT_RULES = [
    ['carte_credit', /\b(paiement (de )?(la |ma )?(carte|visa|mastercard|amex)|paye (la |ma )?(visa|mastercard|amex|carte de credit))\b/],
    ['livraison', /\b(uber ?eats|doordash|door dash|skip(the ?dishes)?|livraison)\b/],
    ['uber', /\b(uber|lyft|taxi|eva)\b/],
    ['epicerie', /\b(epicerie|iga|metro plus|maxi|provigo|super ?c|costco|walmart|adonis|marche|loblaws|avril|segal|epice|courses|bouffe maison)\b/],
    ['cafe', /\b(cafe|tim ?hortons?|tims|starbucks|second cup|van houtte|latte|cappuccino|espresso)\b/],
    ['restaurants', /\b(resto|restaurant|souper|diner|dejeuner|brunch|mcdo|mcdonald'?s?|a&w|subway|poutine|pizza|sushi|shawarma|st-hubert|st hubert|benny|lunch|bouffe)\b/],
    ['depanneur', /\b(depanneur|dep|couche-tard|couche tard)\b/],
    ['essence', /\b(essence|gaz|plein|petro|petro-canada|shell|esso|ultramar|irving|crevier)\b/],
    ['transport_commun', /\b(stm|opus|autobus|bus|rem|exo|transport en commun)\b/],
    ['stationnement', /\b(stationnement|parking|parcometre)\b/],
    ['assurance_auto', /\b(assurance (auto|voiture|char))\b/],
    ['entretien_auto', /\b(garage|mecanicien|changement d'huile|vidange|lave-auto|lave auto)\b/],
    ['pneus', /\b(pneus?)\b/],
    ['auto_paiement', /\b(paiement (de )?(l'?auto|la voiture|du char)|financement auto)\b/],
    ['loyer', /\b(loyer|hypotheque)\b/],
    ['copro', /\b(copro|frais de condo|condo fees)\b/],
    ['hydro', /\b(hydro|hydro-quebec|electricite)\b/],
    ['chauffage', /\b(chauffage|mazout|energir|gaz naturel)\b/],
    ['internet', /\b(internet|videotron|wifi)\b/],
    ['telephone', /\b(telephone|cellulaire|cell|forfait|fizz|koodo|virgin|fido|telus|rogers|bell)\b/],
    ['netflix', /\b(netflix)\b/],
    ['spotify', /\b(spotify)\b/],
    ['apple', /\b(apple|icloud|app store)\b/],
    ['applications', /\b(application|app|abonnement app)\b/],
    ['abonnements_autres', /\b(abonnement|disney\+?|crave|prime video|youtube premium|gym|ecofitness|energie cardio)\b/],
    ['pharmacie', /\b(pharmacie|pharmaprix|jean coutu|jean-coutu|familiprix|uniprix|proxim|medicament)\b/],
    ['vetements', /\b(vetements?|linge|zara|h&m|uniqlo|simons|winners|souliers|chaussures)\b/],
    ['coiffeur', /\b(coiffeur|coiffeuse|barbier|coupe de cheveux)\b/],
    ['menage', /\b(menage|produits menagers|savon a vaisselle|detergent)\b/],
    ['soins', /\b(soins|cosmetiques|maquillage|sephora|manucure|massage|esthetique)\b/],
    ['sorties', /\b(sortie|bar|biere|cinema|cine|spectacle|concert|show)\b/],
    ['loisirs', /\b(loisirs?|jeu|jeux|livre|sport|activite|bowling)\b/],
    ['reparations', /\b(reparation|plombier|electricien|quincaillerie|reno|canadian tire|home depot|rona)\b/],
    ['avion', /\b(billet d'avion|avion|vol|air canada|air transat|westjet|flair)\b/],
    ['hotels', /\b(hotel|airbnb|motel)\b/],
    ['cadeaux', /\b(cadeau|fete de|anniversaire)\b/],
    ['frais_bancaires', /\b(frais bancaires?|frais de compte)\b/],
    ['interets', /\b(interets?)\b/],
    ['urgences', /\b(urgence|veterinaire|veto|dentiste|clinique)\b/],
  ];

  function matchCategory(n, raw, cats) {
    // catégories personnalisées : par nom
    for (const c of Object.values(cats || {})) {
      if (c.group && c.id && !K.DEFAULT_CATEGORIES.some(d => d.id === c.id)) {
        const cn = norm(c.name);
        if (cn.length > 2 && n.includes(cn)) return { id: c.id, sure: true };
      }
    }
    // « métro » (transport) vs « Metro » (épicerie) : l'accent tranche
    if (/\bmétro\b/i.test(raw) && !/\bmetro\b/.test(raw)) return { id: 'transport_commun', sure: true };
    if (/\bmetro\b/i.test(raw)) return { id: 'epicerie', sure: true };
    for (const [id, re] of CAT_RULES) if (re.test(n)) return { id, sure: true };
    return { id: 'autres_depenses', sure: false };
  }

  /* --------------------------- Montant --------------------------- */
  function extractAmount(raw) {
    // 1) montant avec $ ou « dollars »
    const re = /(\d{1,3}(?:[   ]\d{3})+|\d+)(?:[.,](\d{1,2}))?\s*(?:\$|dollars?|piasses?|cad\b)|\$\s*(\d{1,3}(?:[   ]\d{3})+|\d+)(?:[.,](\d{1,2}))?/i;
    let m = raw.match(re);
    if (m) {
      const whole = (m[1] || m[3]).replace(/[   ]/g, ''), frac = (m[2] || m[4] || '');
      return { cents: K.parseMoney(whole + (frac ? ',' + frac : '')), span: [m.index, m.index + m[0].length] };
    }
    // 2) nombre décimal (12,50 / 12.50)
    m = raw.match(/(?<![\d/:-])(\d+)[.,](\d{1,2})(?![\d/:-])/);
    if (m) return { cents: K.parseMoney(m[1] + ',' + m[2]), span: [m.index, m.index + m[0].length] };
    // 3) nombre entier qui n'est pas une date (« le 3 », « 3 nov », « 2026-11-03 »)
    const ints = [...raw.matchAll(/(?<![\d/:-])(\d{1,3}(?:[   ]\d{3})+|\d+)(?![\d/:-])/g)];
    for (const x of ints) {
      const before = norm(raw.slice(Math.max(0, x.index - 4), x.index));
      const after = norm(raw.slice(x.index + x[0].length, x.index + x[0].length + 12));
      if (/\ble\s*$/.test(before) || /^\s*(er\b)?\s*(janv|jan|fev|mars|mar|avr|mai|juin|juil|aout|sep|oct|nov|dec)/.test(after)) continue;
      if (/^\s*(fois|jours?|semaines?|mois|ans?|h\b|heures?|min|km|%)/.test(after)) continue;
      return { cents: K.parseMoney(x[1].replace(/[   ]/g, '')), span: [x.index, x.index + x[0].length] };
    }
    return null;
  }

  /* ----------------------------- Date ----------------------------- */
  function extractDate(raw, today) {
    const n = norm(raw);
    let m;
    if ((m = raw.match(/\b(\d{4})-(\d{2})-(\d{2})\b/)) && K.isISODate(m[0])) return { date: m[0], words: [m[0]] };
    if (/\bavant[- ]hier\b/.test(n)) return { date: K.addDays(today, -2), words: ['avant-hier', 'avant hier'] };
    if (/\bhier\b/.test(n)) return { date: K.addDays(today, -1), words: ['hier'] };
    if (/\b(aujourd'hui|aujourdhui|ce matin|ce midi|ce soir|tantot)\b/.test(n)) return { date: today, words: [] };
    if ((m = n.match(/\b(dimanche|lundi|mardi|mercredi|jeudi|vendredi|samedi)( (dernier|passe))?\b/))) {
      const target = WEEKDAYS[m[1]];
      const dow = new Date(K.dayNum(today) * 86400000).getUTCDay();
      let back = (dow - target + 7) % 7; if (back === 0) back = 7;
      return { date: K.addDays(today, -back), words: [m[0]] };
    }
    // « 3 nov », « 3 novembre », « le 1er novembre 2026 »
    if ((m = n.match(/\b(\d{1,2})(?:er)?\s+(janvier|janv|jan|fevrier|fevr|fev|mars|mar|avril|avr|mai|juin|juillet|juil|aout|septembre|sept|sep|octobre|oct|novembre|nov|decembre|dec)\.?(?:\s+(\d{4}))?\b/))) {
      const mo = MONTHS[m[2]], d = +m[1];
      let y = m[3] ? +m[3] : +today.slice(0, 4);
      let iso = String(y) + '-' + String(mo).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      if (!m[3] && K.isISODate(iso) && iso > K.addDays(today, 31)) iso = String(y - 1) + iso.slice(4);
      if (K.isISODate(iso)) return { date: iso, words: [m[0]] };
    }
    // « 3/11 » (jour/mois, format canadien-français)
    if ((m = raw.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/))) {
      let y = m[3] ? (m[3].length === 2 ? 2000 + +m[3] : +m[3]) : +today.slice(0, 4);
      const iso = String(y) + '-' + String(+m[2]).padStart(2, '0') + '-' + String(+m[1]).padStart(2, '0');
      if (K.isISODate(iso)) return { date: iso, words: [m[0]] };
    }
    // « le 3 » -> ce mois-ci, sinon le mois précédent si dans le futur
    if ((m = n.match(/\ble (\d{1,2})(?:er)?\b/))) {
      const d = +m[1]; let iso = today.slice(0, 8) + String(d).padStart(2, '0');
      if (!K.isISODate(iso) || iso > today) { const pm = K.addMonthsYM(K.ym(today), -1); iso = pm + '-' + String(d).padStart(2, '0'); }
      if (K.isISODate(iso)) return { date: iso, words: [m[0]] };
    }
    return { date: today, words: [], defaulted: true };
  }

  /* --------------------------- Analyse --------------------------- */
  /**
   * ctx: { today, me, sources, goals, debts, cats, taxes }
   * Retourne { ok, tx, confidence: 'high'|'low', notes: [..], missing: [..] }
   */
  function parseLine(raw, ctx) {
    const text = String(raw || '').trim();
    const n = norm(text);
    const notes = [], missing = [];
    const today = ctx.today;
    const tx = { status: 'posted', person: ctx.me || 'khalil', shared: false };

    // Montant
    const amt = extractAmount(text);
    if (!amt || !amt.cents || amt.cents <= 0) missing.push('montant');
    else tx.amountCents = amt.cents;
    if (tx.amountCents && /(\+ ?taxes?\b|\b(plus taxes?|avant taxes?|tx en sus|taxes en sus)\b)/.test(n)) {
      const t = K.salesTaxes(tx.amountCents, ctx.taxes || K.TAX_DEFAULTS);
      notes.push('TPS + TVQ ajoutées : ' + K.formatMoney(t.tps + t.tvq));
      tx.amountCents = t.total;
    }

    // Date
    const d = extractDate(text, today);
    tx.date = d.date;
    if (d.defaulted) notes.push('Date : aujourd’hui');

    // Personnes
    const mentionsK = /\bkhalil\b/.test(n), mentionsY = /\byousra\b/.test(n);
    const payerRe = /\b(khalil|yousra)\s+(a|à)\s+(paye|payer|achete|depense|recu|mis|transfere|envoye|donne)/;
    const pm = n.match(payerRe);
    if (pm) tx.person = pm[1];
    else if (/\b(par|pour|de)\s+(khalil|yousra)\b/.test(n) && !/\bavec\b/.test(n)) tx.person = n.match(/\b(?:par|pour|de)\s+(khalil|yousra)\b/)[1];
    else if (mentionsK !== mentionsY && /^(khalil|yousra)\b/.test(n)) tx.person = mentionsK ? 'khalil' : 'yousra';
    if (/\b(avec (khalil|yousra|ma blonde|mon chum|ma femme|mon mari)|ensemble|en couple|commune?|pour (la maison|nous|le couple)|on a|nous avons|a deux)\b/.test(n)) tx.shared = true;

    // Type
    const payVerb = /\b(on|je|j'|nous|tu|il|elle|ils|elles|vous|khalil|yousra|qui)\s+(paie|paye|payons|payez|paient|payer)\b|\b(paiement|payer|payons|payez|paient)\b/.test(n) && !/\b(recoi[st]|recu|recevons|depot de paie|sa paie|ma paie|notre paie)\b/.test(n);
    const isIncome = !payVerb && /\b(paie|paye de|salaire|recoi[st]|recevons|recevez|gagne|recu (ma |la )?paie|depot de paie|revenu|bonus|prime|remboursement d'impot|retour d'impot|allocation|ace|cheque de|vendu|vente de|pourboires?)\b/.test(n) && !/\bpaye (la |le |l'|un |une |mon |ma |mes )/.test(n);
    const isRefund = /\b(rembourse|remboursement|retour de|retourne|credit de)\b/.test(n) && !/\bremboursement d'impot\b/.test(n) && !/\b(paiement|rembourser) (de )?(la |ma )?(visa|carte|pret)/.test(n);
    const isWithdraw = /\b(retire|retrait|sorti|pris)\b.*\b(epargne|celi|reer|celiapp|fonds|compte epargne|voyage|urgence)\b/.test(n);
    const isSavings = isWithdraw || /\b(epargne|epargner|economise|de cote|celi|reer|celiapp|placement)\b/.test(n);
    const isTransfer = /\b(transfere|transfert|vire|virement|envoye|interac)\b/.test(n) && /\b(compte|khalil|yousra|a (lui|elle)|vers)\b/.test(n) && !isSavings && !/\b(loyer|hydro|facture)\b/.test(n);

    const rec = extractRecurrence(n, today);

    if (isSavings) {
      tx.type = 'savings'; tx.direction = isWithdraw ? 'withdraw' : 'deposit';
      const goals = ctx.goals || [];
      let g = goals.find(x => norm(x.name).split(/\s+/).some(w => w.length > 3 && n.includes(w) && !['epargne', 'generale'].includes(w)));
      if (!g && tx.person) g = goals.find(x => x.owner === tx.person && /\b(mon|ma|perso|personnelle?)\b/.test(n));
      if (!g && tx.shared) g = goals.find(x => (x.owner || 'commun') === 'commun');
      if (!g) { g = goals[0]; if (g) notes.push('Compte d’épargne choisi par défaut'); }
      if (g) tx.goalId = g.id; else missing.push('compte d’épargne');
    } else if (isTransfer) {
      tx.type = 'transfer';
      const other = tx.person === 'khalil' ? 'yousra' : 'khalil';
      tx.fromAccount = 'Compte ' + (tx.person === 'khalil' ? 'Khalil' : 'Yousra');
      tx.toAccount = /\bcommun\b/.test(n) ? 'Compte commun' : 'Compte ' + (other === 'khalil' ? 'Khalil' : 'Yousra');
      if (/\b(de|du) (compte )?commun\b/.test(n)) { tx.fromAccount = 'Compte commun'; }
      if (tx.fromAccount === tx.toAccount) tx.toAccount = 'Compte commun';
    } else if (isIncome) {
      tx.type = 'income';
      if (!pm && mentionsK !== mentionsY) tx.person = mentionsK ? 'khalil' : 'yousra';
      const srcs = (ctx.sources || []).filter(s => s.person === tx.person && s.active !== false);
      const s = srcs.find(x => n.includes(norm(x.name || '')) && x.name) || (/\b(paie|salaire|depot de paie)\b/.test(n) ? srcs.find(x => x.frequency !== 'occasional') : null);
      if (s) { tx.sourceId = s.id; if (!tx.amountCents && s.netCents) { tx.amountCents = s.netCents; missing.splice(missing.indexOf('montant'), 1); notes.push('Montant net habituel utilisé'); } }
    } else {
      const c = matchCategory(n, text, ctx.cats);
      tx.type = isRefund ? 'refund' : 'expense';
      tx.categoryId = c.id;
      if (!c.sure) notes.push('Catégorie à vérifier');
      // dette liée (Visa, prêt auto…)
      const debt = (ctx.debts || []).find(x => norm(x.name).split(/\s+/).some(w => w.length > 2 && new RegExp('\\b' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b').test(n)));
      if (debt && /\b(paiement|paye|rembourse|versement)\b/.test(n)) {
        tx.type = 'expense'; tx.debtId = debt.id;
        tx.categoryId = debt.kind === 'credit_card' ? 'carte_credit' : debt.kind === 'car_loan' ? 'auto_paiement' : debt.kind === 'mortgage' ? 'loyer' : 'prets';
      }
      if (tx.categoryId && ['loyer', 'hydro', 'internet', 'chauffage', 'copro', 'epicerie'].includes(tx.categoryId) && !/\b(moi|perso|pour moi)\b/.test(n)) tx.shared = true;
    }
    if (/\b(cash|comptant)\b/.test(n)) tx.method = 'Comptant';
    else if (/\b(debit)\b/.test(n)) tx.method = 'Débit';
    else if (/\b(credit|visa|mastercard|amex)\b/.test(n) && tx.categoryId !== 'carte_credit') tx.method = 'Carte de crédit';
    else if (/\binterac\b/.test(n)) tx.method = 'Interac';

    // Description : le texte sans le montant ni la date
    let desc = text;
    if (amt) desc = desc.slice(0, amt.span[0]) + ' ' + desc.slice(amt.span[1]);
    for (const w of d.words) desc = desc.replace(new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), ' ');
    desc = desc.replace(/\b(hier|aujourd'hui|aujourd’hui|avant-hier|\+ ?taxes?|plus taxes?|avant taxes?)\b/gi, ' ')
      .replace(/^\s*(j'ai|j’ai|on a|nous avons|khalil a|yousra a)\s+(payé|paye|dépensé|depense|acheté|achete|mis|reçu|recu)\s*/i, '')
      .replace(/\b((le|chaque|au|tous les)\s+)?\d{1,2}(er|e|ème)?\s+(du mois|de chaque mois|de tous les mois)\b/gi, ' ')
      .replace(/(\s|^)le\s+\d{1,2}(er)?\s*$/i, ' ')
      .replace(/\b(à\s+|a\s+)?(chaque|tous les|toutes les|aux|par)\s+(0?2\s+|deux\s+|3\s+|trois\s+)?(mois|semaines?|années?|annees?|ans?)(\s+de l['’]ann[ée]es?)?\b/gi, ' ')
      .replace(/\b(premier|début|debut|fin) du mois\b/gi, ' ').replace(/\b(mensuel(le)?|hebdomadaire)\b/gi, ' ')
      .replace(/^[\s,]*(on|je|nous|j['’]|khalil|yousra)\s*(paie|paye|payons|payez|verse|versons|met|mets|mettons)\s+(un|une|le|la|les|l['’])?\s*/i, '')
      .replace(/^[\s,]*(mettre|mettons|met)\s+/i, '').replace(/^[\s,]+|[\s,]+$/g, '')
      .replace(/\s+(à|a|au|chez|pour|de|en)\s*$/i, '').replace(/^\s*(à|a|au|chez|pour|de|en)\s+/i, '').replace(/\s{2,}/g, ' ').trim();
    tx.description = desc ? desc[0].toUpperCase() + desc.slice(1) : '';
    if (tx.type === 'income' && !tx.description) tx.description = 'Paie ' + (tx.person === 'khalil' ? 'Khalil' : 'Yousra');

    // Revenu régulier -> source de revenu (paie)
    if (tx.type === 'income' && (rec || /\bpar paie\b/.test(n))) {
      const src = { person: tx.person, name: 'Salaire', frequency: rec ? rec.frequency : null, netCents: notes.includes('Montant net habituel utilisé') ? null : (tx.amountCents || null), active: true };
      if (rec && rec.day1) src.day1 = rec.day1; if (rec && rec.day2) src.day2 = rec.day2;
      const em = text.match(/\b(?:chez|employeur\s*:?)\s+([A-ZÀ-Ü][\w&.\- ]{1,30})/); if (em) src.employer = em[1].trim();
      const m2 = []; if (!src.netCents) m2.push('montant net'); if (!src.frequency) m2.push('fréquence');
      const ex = (ctx.sources || []).find(x => x.person === src.person && x.active !== false && !x.demo);
      return { kind: 'source', ok: false, needsForm: true, source: src, existingId: ex ? ex.id : null, tx, notes: ['Date de paie à choisir'], missing: m2, errors: {}, text, confidence: 'low' };
    }
    // Dépense / épargne régulière -> dépense récurrente
    if (rec && (tx.type === 'expense' || tx.type === 'savings')) {
      const rule = { kind: tx.type === 'savings' ? 'savings' : 'expense', description: tx.description || '', amountCents: tx.amountCents, categoryId: tx.categoryId, goalId: tx.goalId, person: tx.person, shared: !!tx.shared, frequency: rec.frequency, startDate: rec.startDate, method: tx.method, debtId: tx.debtId };
      if (rec.day1) rule.day1 = rec.day1; if (rec.day2) rule.day2 = rec.day2;
      Object.keys(rule).forEach(k => rule[k] === undefined && delete rule[k]);
      const okR = !missing.length && Number.isSafeInteger(rule.amountCents) && rule.amountCents > 0 && K.isISODate(rule.startDate) && (rule.kind !== 'savings' || rule.goalId);
      const rn = notes.filter(x => !/^Date/.test(x)); rn.push('Première échéance : ' + rule.startDate);
      return { kind: 'rule', ok: okR, rule, tx, notes: rn, missing, errors: {}, text, confidence: okR && !rn.includes('Catégorie à vérifier') ? 'high' : 'low' };
    }
    const errors = missing.length ? {} : K.validateTx(tx, ctx.cats);
    const ok = missing.length === 0 && Object.keys(errors).length === 0;
    const low = notes.includes('Catégorie à vérifier') || notes.includes('Compte d’épargne choisi par défaut');
    return { kind: 'tx', ok, tx, confidence: ok && !low ? 'high' : 'low', notes, missing, errors, text };
  }

  /* --------------------------- Récurrence --------------------------- */
  function extractRecurrence(n, today) {
    let frequency = null, day1 = null, day2 = null;
    if (/\b(chaque|toutes? les|aux|a toutes les|a chaque) (2|02|deux) semaines\b|\bbi-?hebdo|\bdeux semaines\b/.test(n)) frequency = 'biweekly';
    else if (/\b(deux fois par mois|2 fois par mois|bimensuel)\b/.test(n)) { frequency = 'semimonthly'; const m = n.match(/\b(?:le )?(\d{1,2})(?:er)? et (?:le )?(\d{1,2}|dernier)\b/); day1 = m ? +m[1] : 15; day2 = m ? (m[2] === 'dernier' ? 31 : +m[2]) : 31; }
    else if (/\b(chaque semaine|toutes les semaines|par semaine|hebdo(madaire)?)\b/.test(n)) frequency = 'weekly';
    else if (/\b(chaque|tous les|par|aux) (3|trois) mois\b|\btrimestriel/.test(n)) frequency = 'quarterly';
    else if (/\b(chaque annee|par annee|par an|annuel(le)?|une fois par an|tous les ans)\b/.test(n)) frequency = 'yearly';
    else if (/\b(chaque mois|tous les mois|par mois|mensuel(le)?(ment)?|du mois|de chaque mois|de tous les mois|le \d{1,2}(er)? de chaque)\b/.test(n)) frequency = 'monthly';
    if (!frequency) return null;
    let startDate = today;
    if (frequency === 'monthly' || frequency === 'quarterly' || frequency === 'yearly') {
      const m = n.match(/\b(?:le |chaque |au )?(\d{1,2})(?:er|e|eme)?\s+(?:du mois|de chaque mois|de tous les mois|de chaque)\b/) || n.match(/\b(?:chaque|le) (\d{1,2})(?:er|e)?\b/) || (/\b(premier|debut) du mois\b/.test(n) ? [0, '1'] : null) || (/\bfin du mois\b/.test(n) ? [0, '31'] : null);
      if (m && +m[1] >= 1 && +m[1] <= 31) {
        day1 = +m[1];
        const y = +today.slice(0, 4), mo = +today.slice(5, 7);
        const dd = Math.min(day1, K.daysInMonth(y, mo));
        startDate = today.slice(0, 8) + String(dd).padStart(2, '0');
      } else day1 = +today.slice(8, 10);
    }
    return { frequency, startDate, day1, day2 };
  }

  /** Plusieurs transactions : une par ligne, ou séparées par « ; ». */
  function parseText(text, ctx) {
    const out = [];
    for (const line of String(text || '').split(/\n|;/).map(s => s.trim()).filter(Boolean)) {
      const nl = norm(line);
      // « Khalil reçoit 1600 … et Yousra 1800 … » : une phrase par personne
      if (/\bkhalil\b/.test(nl) && /\byousra\b/.test(nl) && !/\bavec (khalil|yousra)\b/.test(nl)) {
        const parts = line.split(/[,]?\s+et\s+(?=(?:khalil|yousra)\b)/i);
        if (parts.length > 1) {
          const shared = parts.map(p => norm(p)).join(' ');
          const verb = (nl.match(/\b(recoi[st]|gagne|touche)\b/) || [])[0];
          const lineRec = extractRecurrence(nl, ctx.today);
          const recTxt = lineRec ? { weekly: 'chaque semaine', biweekly: 'aux deux semaines', semimonthly: 'deux fois par mois', monthly: 'chaque mois', quarterly: 'chaque 3 mois', yearly: 'chaque année' }[lineRec.frequency] : '';
          parts.forEach((p, i) => {
            let q = p.trim();
            const qn = norm(q);
            if (verb && !/\b(recoi[st]|gagne|touche|paie|salaire)\b/.test(qn)) q = q.replace(/^(khalil|yousra)\b/i, '$1 ' + verb);
            if (recTxt && !extractRecurrence(qn, ctx.today)) q += ' ' + recTxt;
            out.push(parseLine(q, ctx));
          });
          continue;
        }
      }
      out.push(parseLine(line, ctx));
    }
    return out;
  }

  /* ------------------------- Lecture de reçus ------------------------- */
  const MONEY_RE = /(-?\d{1,3}(?:[  ]?\d{3})*|\d+)\s*[.,]\s*(\d{2})(?!\d)/g;
  function moneyOnLine(line) {
    const out = []; let m; MONEY_RE.lastIndex = 0;
    while ((m = MONEY_RE.exec(line))) out.push(K.parseMoney(m[1].replace(/[  ]/g, '') + ',' + m[2]));
    return out.filter(v => v !== null);
  }
  const KNOWN_MERCHANTS = ['IGA', 'METRO', 'MAXI', 'PROVIGO', 'SUPER C', 'COSTCO', 'WALMART', 'ADONIS', 'JEAN COUTU', 'PHARMAPRIX', 'FAMILIPRIX', 'UNIPRIX', 'PROXIM', 'TIM HORTONS', 'STARBUCKS', 'MCDONALD', 'A&W', 'SUBWAY', 'ST-HUBERT', 'PETRO-CANADA', 'PETRO CANADA', 'SHELL', 'ESSO', 'ULTRAMAR', 'COUCHE-TARD', 'CANADIAN TIRE', 'HOME DEPOT', 'RONA', 'DOLLARAMA', 'WINNERS', 'SIMONS', 'SAQ', 'SAAQ', 'AMAZON', 'IKEA', 'BEST BUY', 'SEPHORA', 'UBER', 'STM', 'HYDRO-QUEBEC', 'VIDEOTRON', 'BELL'];
  /**
   * Texte d'un reçu (OCR) -> { merchant, totalCents, tpsCents, tvqCents, date, method, categoryId, warnings }
   */
  function parseReceipt(text, ctx) {
    // Corrige les confusions classiques de lecture : « e,22 » -> « 0,22 », « 1O,50 » -> « 10,50 », « 4 , 99 » -> « 4,99 »
    const fix = l => l.replace(/(^|[\s$])[oOeDQ]([.,]\d{2})(?!\d)/g, '$10$2').replace(/(\d)[oO](?=\d|[.,]\d)/g, '$10').replace(/(\d)[lI|](?=\d|[.,]\d)/g, '$11').replace(/(\d)\s+([.,])\s*(\d{2})(?!\d)/g, '$1$2$3');
    const lines = String(text || '').split(/\r?\n/).map(l => fix(l.replace(/\s+/g, ' ').trim())).filter(Boolean);
    const N_ = lines.map(norm);
    const warnings = [];
    // Total : ligne « TOTAL » (pas sous-total), sinon « montant / à payer », sinon le plus grand montant
    let total = null;
    for (let i = lines.length - 1; i >= 0; i--) {
      const n = N_[i];
      if (/\b(sous[- ]?total|subtotal|s\/total|total partiel|economies?|rabais|epargne|savings)\b/.test(n)) continue;
      if (/\b(total|montant du|montant total|a payer|grand total|net a payer|amount due|balance due)\b/.test(n)) {
        const v = moneyOnLine(lines[i]).concat(moneyOnLine(lines[i + 1] || '').slice(0, /\d[.,]\d{2}/.test(lines[i]) ? 0 : 1));
        if (v.length) { total = Math.max(...v.filter(x => x > 0)); if (total > 0) break; total = null; }
      }
    }
    const all = lines.flatMap(moneyOnLine).filter(v => v > 0);
    if (total === null && all.length) { total = Math.max(...all); warnings.push('Total deviné (montant le plus élevé)'); }
    const taxOn = re => { for (let i = 0; i < lines.length; i++) if (re.test(N_[i])) { const v = moneyOnLine(lines[i]).filter(x => x > 0); if (v.length) return v[v.length - 1]; } return null; };
    const tps = taxOn(/\b(tps|gst|t\.p\.s|federal|fed\b)/), tvq = taxOn(/\b(tvq|qst|pst|t\.v\.q|provincial)\b/);
    let sub = null;
    for (let i = 0; i < lines.length; i++) if (/\b(sous[- ]?total|subtotal|s\/total)\b/.test(N_[i])) { const v = moneyOnLine(lines[i]).filter(x => x > 0); if (v.length) sub = v[v.length - 1]; }
    if (total && sub && tps !== null && tvq !== null && sub + tps + tvq !== total && Math.abs(sub + tps + tvq - total) > 2) warnings.push('Total à vérifier : sous-total + taxes ≠ total');
    // Date
    let date = null; const joined = lines.join(' ');
    let m = joined.match(/\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/);
    if (m) date = m[1] + '-' + m[2].padStart(2, '0') + '-' + m[3].padStart(2, '0');
    if (!date && (m = joined.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](20\d{2}|\d{2})\b/))) {
      const y = m[3].length === 2 ? '20' + m[3] : m[3];
      let d = +m[1], mo = +m[2]; if (mo > 12 && d <= 12) { const t = d; d = mo; mo = t; }
      date = y + '-' + String(mo).padStart(2, '0') + '-' + String(d).padStart(2, '0');
    }
    if (!date) { const dd = extractDate(joined.replace(/\b\d{1,2}:\d{2}\b/g, ''), ctx.today); if (!dd.defaulted) date = dd.date; }
    if (date && (!K.isISODate(date) || date > ctx.today || date < K.addDays(ctx.today, -400))) date = null;
    if (!date) { date = ctx.today; warnings.push('Date du reçu non trouvée : aujourd’hui'); }
    // Commerçant
    const upper = joined.toUpperCase();
    let merchant = KNOWN_MERCHANTS.find(k => upper.includes(k)) || null;
    if (merchant) merchant = merchant.split(/([ -])/).map(w => w.length > 3 ? w[0] + w.slice(1).toLowerCase() : w).join('');
    if (!merchant) {
      const cand = lines.slice(0, 6).find(l => /[a-zà-ü]{3,}/i.test(l) && !/\d{3}[- ]?\d{3}[- ]?\d{4}/.test(l) && !/\b(rue|boul|avenue|av\.|ch\.|chemin|qc|quebec|montreal|laval|tel|www|http|bienvenue|welcome|facture|recu|receipt|caisse|transaction)\b/i.test(norm(l)) && !/^\d/.test(l));
      merchant = cand ? cand.replace(/[^\p{L}\p{N}&'’ .-]/gu, '').trim().slice(0, 40) : null;
    }
    if (!merchant) warnings.push('Commerçant non reconnu');
    const n = norm(joined);
    const cat = matchCategory(norm((merchant || '') + ' ' + joined), (merchant || '') + ' ' + joined, ctx.cats);
    if (!cat.sure) warnings.push('Catégorie à vérifier');
    const method = /\b(visa|mastercard|master card|amex|american express|credit)\b/.test(n) ? 'Carte de crédit' : /\b(interac|debit)\b/.test(n) ? 'Débit' : /\b(comptant|cash|argent)\b/.test(n) ? 'Comptant' : '';
    if (!total) warnings.push('Total non trouvé');
    return { merchant, totalCents: total, subtotalCents: sub, tpsCents: tps, tvqCents: tvq, date, method, categoryId: cat.id, warnings };
  }

  return { parseLine, parseText, extractAmount, extractDate, norm, parseReceipt, matchCategory };
});
