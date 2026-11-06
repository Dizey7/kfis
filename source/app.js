(function () {
'use strict';
const K = window.KYF;
const TZ = 'America/Toronto';

/* =========================== Utilitaires =========================== */
const $ = (s, r) => (r || document).querySelector(s);
const esc = s => String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const M = (c, o) => K.formatMoney(c, o);
const today = () => K.todayISO(TZ);
const uid = p => (p || 'x') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const PEOPLE = { khalil: 'Khalil', yousra: 'Yousra', commun: 'Commun' };
const pcls = p => p === 'khalil' ? 'k' : p === 'yousra' ? 'y' : 'c';
const store = {
  get(k) { try { return localStorage.getItem('kyf.' + k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem('kyf.' + k, v); } catch (e) { /* stockage local indisponible */ } },
};
function dDate(iso) { return new Date(K.dayNum(iso) * 86400000); }
function fmtD(iso, kind) {
  if (!iso) return '—';
  const o = { timeZone: 'UTC' };
  if (kind === 'long') Object.assign(o, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  else if (kind === 'dm') Object.assign(o, { day: 'numeric', month: 'short' });
  else if (kind === 'wdm') Object.assign(o, { weekday: 'short', day: 'numeric', month: 'short' });
  else if (kind === 'month') Object.assign(o, { month: 'long', year: 'numeric' });
  else if (kind === 'mshort') Object.assign(o, { month: 'short' });
  else Object.assign(o, { day: 'numeric', month: 'short', year: 'numeric' });
  return new Intl.DateTimeFormat('fr-CA', o).format(dDate(iso.length === 7 ? iso + '-01' : iso));
}
const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;
const fmtMonth = ymS => cap(fmtD(ymS, 'month'));
const kfmt = c => { const d = Math.round(c / 100); return Math.abs(d) >= 1000 ? (d / 1000).toLocaleString('fr-CA', { maximumFractionDigits: 1 }) + ' k$' : d + ' $'; };
/** Nombre décimal "9,975" -> entier à `places` décimales (9975). */
function parseFixed(s, places) {
  if (s === null || s === undefined) return null;
  s = String(s).trim().replace(/\s|%/g, '').replace(',', '.');
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
  const neg = s[0] === '-'; if (neg) s = s.slice(1);
  const [w, f = ''] = s.split('.');
  if (f.length > places) return null;
  const v = Number(w) * Math.pow(10, places) + Number(f.padEnd(places, '0') || 0);
  return neg ? -v : v;
}
const fixedStr = (v, places) => v === null || v === undefined ? '' : (v / Math.pow(10, places)).toLocaleString('fr-CA', { useGrouping: false, maximumFractionDigits: places });
const centsStr = c => c === null || c === undefined || c === '' ? '' : (c / 100).toFixed(2).replace('.', ',');

/* ============================== Icônes ============================== */
const IC = {
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5.5v-6h-5v6H4a1 1 0 0 1-1-1z"/>',
  list: '<path d="M9 6h12M9 12h12M9 18h12"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>',
  income: '<path d="M12 3v12M7 10l5 5 5-5M4 20h16"/>',
  expense: '<path d="M12 21V9M7 14l5-5 5 5M4 4h16"/>',
  period: '<rect x="3" y="4.5" width="18" height="16" rx="2.5"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4M7 14h5M7 17h3"/>',
  budget: '<circle cx="12" cy="12" r="9"/><path d="M12 3v9l6.4 6.4"/>',
  savings: '<path d="M6 8.5h12l-1 11.5H7z"/><path d="M8.5 8.5V6.8a3.5 3.5 0 0 1 7 0v1.7"/><path d="M12 12.5v4M10 14.5h4"/>',
  debt: '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19M6.5 15h4"/>',
  calendar: '<rect x="3" y="4.5" width="18" height="16" rx="2.5"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/><circle cx="8" cy="14" r=".8"/><circle cx="12" cy="14" r=".8"/><circle cx="16" cy="14" r=".8"/>',
  chart: '<path d="M4 20V11M10 20V5M16 20v-6M21 20H3"/>',
  trend: '<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6"/>',
  transfer: '<path d="M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7"/>',
  refund: '<path d="M9 14 4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', x: '<path d="M6 6l12 12M18 6 6 18"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>', trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  check: '<path d="m5 12 5 5L20 7"/>', download: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>', upload: '<path d="M12 15V3M7 8l5-5 5 5M4 21h16"/>',
  spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
  alert: '<path d="M12 4 2.5 20h19z"/><path d="M12 10v4M12 17v.5"/>', chev: '<path d="m9 6 6 6-6 6"/>', chevl: '<path d="m15 6-6 6 6 6"/>',
  repeat: '<path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/>',
};
const ico = (n, sw) => `<svg viewBox="0 0 24 24" fill="none" stroke-width="${sw || 1.8}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n] || ''}</svg>`;

/* ============================ État & données ============================ */
const COLS = ['tx', 'sources', 'recurring', 'goals', 'debts', 'budgets', 'categories', 'events'];
document.documentElement.dataset.person = (function () { try { return localStorage.getItem('kyf.me') || 'khalil'; } catch (e) { return 'khalil'; } })();
const S = { settings: {}, mode: 'loading', canWrite: true, loaded: {}, stale: false, me: store.get('me') || 'khalil' };
COLS.forEach(c => S[c] = []);
const UI = {
  chartMode: 'month', month: null, periodIdx: null, calMonth: null, calSel: null,
  tx: { q: '', type: '', person: '', cat: '', month: '', cancelled: false }, scenario: 'realiste', answer: null,
};
let db = null, sampleFn = null, downloads = null, userCap = null;

const C = () => K.categoryMap(S.categories);
const DATA = () => ({ txs: S.tx, cats: C(), sources: S.sources, recurring: S.recurring, settings: S.settings, goals: S.goals });
function anchor() {
  if (S.settings.anchorDate) return S.settings.anchorDate;
  const b = S.sources.find(s => s.frequency === 'biweekly' && s.active !== false && s.anchorDate);
  return b ? b.anchorDate : null;
}
function catName(id) { const c = C()[id]; return c ? c.name : 'Sans catégorie'; }
function goalName(id) { const g = S.goals.find(x => x.id === id); return g ? g.name : 'Épargne'; }
function hasDemo() { return COLS.some(c => S[c].some(x => x.demo)) || !!S.settings.demoLoaded; }

const queues = {};
function enqueue(key, fn) { const p = (queues[key] || Promise.resolve()).catch(() => {}).then(fn); queues[key] = p; return p; }
function clean(o) { return JSON.parse(JSON.stringify(o)); }
async function withRetry(fn) {
  try { return await fn(); } catch (e) {
    if (e && (e.code === 'unavailable' || e.code === 'resource_exhausted')) { await new Promise(r => setTimeout(r, 500 + Math.random() * 600)); return fn(); }
    throw e;
  }
}
function writeError(e) {
  const c = e && e.code;
  if (c === 'invalid_argument' && !S.isOwner) { S.canWrite = false; schedule(); return 'Modification refusée : seul le propriétaire du compte peut modifier ces données.'; }
  if (c === 'quota_exceeded') return 'Espace de stockage plein : supprimez d’anciennes données (par exemple la démo) puis réessayez.';
  if (c === 'revoked' || c === 'not_granted') return 'Accès retiré à la base de données. Rechargez la page.';
  return 'Enregistrement impossible pour le moment. Vérifiez la connexion et réessayez.';
}
async function save(col, obj) {
  if (!S.canWrite) { toast('Lecture seule : modification impossible.'); throw new Error('ro'); }
  obj = clean(obj);
  if (S.mode === 'memory' || S.mode === 'local') { const a = S[col], i = a.findIndex(x => x.id === obj.id); if (i >= 0) a[i] = obj; else a.push(obj); persistLocal(); schedule(); return; }
  return enqueue(col + '/' + obj.id, () => withRetry(() => db.collection(col).doc(obj.id).set(obj))).catch(e => { toast(writeError(e)); throw e; });
}
async function removeDoc(col, id) {
  if (!S.canWrite) { toast('Lecture seule : suppression impossible.'); throw new Error('ro'); }
  if (S.mode === 'memory' || S.mode === 'local') { S[col] = S[col].filter(x => x.id !== id); persistLocal(); schedule(); return; }
  return enqueue(col + '/' + id, () => withRetry(() => db.collection(col).doc(id).delete())).catch(e => { toast(writeError(e)); throw e; });
}
async function saveSettings(patch) {
  const next = clean(Object.assign({}, S.settings, patch));
  Object.keys(next).forEach(k => { if (next[k] === null) delete next[k]; });
  if (S.mode === 'memory' || S.mode === 'local') { S.settings = next; persistLocal(); schedule(); return; }
  if (!S.canWrite) { toast('Lecture seule.'); return; }
  S.settings = next; schedule();
  return enqueue('config/settings', () => withRetry(() => db.doc('config/settings').set(next))).catch(e => toast(writeError(e)));
}
async function pool(items, n, fn, onProgress) {
  let i = 0, done = 0;
  const run = async () => { while (i < items.length) { const it = items[i++]; await fn(it); done++; onProgress && onProgress(done, items.length); } };
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, run));
}

/* ============================= Rendu global ============================= */
let rafId = 0;
let deferred = false;
function schedule() { if (!rafId) rafId = requestAnimationFrame(() => { rafId = 0; const a = document.activeElement; if (a && a.id !== 'smart-in' && a.closest && a.closest('#view') && /INPUT|SELECT|TEXTAREA/.test(a.tagName)) { deferred = true; return; } render(); }); }
document.addEventListener('focusout', () => { if (deferred) setTimeout(() => { const a = document.activeElement; if (!(a && a.closest && a.closest('#view') && /INPUT|SELECT|TEXTAREA/.test(a.tagName))) { deferred = false; render(); } }, 0); });
let toastT;
let toastUndo = null;
function toast(msg, undo) {
  const r = $('#toast-root');
  toastUndo = undo || null;
  r.innerHTML = `<div class="toast" role="status">${esc(msg)}${undo ? ' <button class="toast-undo" data-act="toast-undo">Annuler</button>' : ''}</div>`;
  clearTimeout(toastT); toastT = setTimeout(() => { r.innerHTML = ''; toastUndo = null; }, undo ? 7000 : 2800);
}

const ROUTES = [
  ['tableau', 'Tableau de bord', 'home'], ['transactions', 'Transactions', 'list'], ['revenus', 'Revenus', 'income'],
  ['depenses', 'Dépenses', 'expense'], ['periodes', 'Périodes de paie', 'period'], ['budgets', 'Budgets', 'budget'],
  ['epargne', 'Épargne', 'savings'], ['dettes', 'Dettes', 'debt'], ['calendrier', 'Calendrier', 'calendar'],
  ['analyses', 'Analyses', 'chart'], ['previsions', 'Prévisions', 'trend'], ['parametres', 'Paramètres', 'settings'],
];
function route() { const h = (location.hash || '').slice(1); return ROUTES.some(r => r[0] === h) ? h : 'tableau'; }

function render() {
  const r = route();
  $('#nav').innerHTML = ROUTES.map(([id, label, ic]) => `<a href="#${id}" class="${id === r ? 'on' : ''}" ${id === r ? 'aria-current="page"' : ''}>${ico(ic)}<span>${label}</span></a>`).join('');
  document.querySelectorAll('#me-seg button').forEach(b => b.classList.toggle('on', b.dataset.v === S.me));
  if (document.documentElement.dataset.person !== S.me) document.documentElement.dataset.person = S.me;
  const ss = $('#sync-state');
  ss.textContent = S.mode === 'local' ? (S.localOk ? 'Enregistré sur cet appareil' : 'Enregistrement impossible sur cet appareil') : S.mode === 'memory' ? 'Aperçu : rien n’est enregistré' : S.mode === 'loading' ? 'Connexion…' : S.stale ? 'Données peut-être pas à jour' : (S.canWrite ? 'Enregistré · synchronisé' : 'Lecture seule');
  const meta = ROUTES.find(x => x[0] === r);
  $('#title').textContent = meta[1];
  const v = VIEWS[r];
  const t = today();
  $('#subtitle').textContent = cap(fmtD(t, 'long'));
  let html = banners();
  try { html += v(t); } catch (e) { console.error(e); html += `<div class="card"><div class="empty"><b>Cette section n’a pas pu s’afficher.</b>${esc(e.message)}</div></div>`; }
  const view = $('#view');
  const sx = window.scrollX, sy = window.scrollY;
  const ae = document.activeElement, smartFocus = ae && ae.id === 'smart-in' ? [ae.selectionStart, ae.selectionEnd] : null;
  view.innerHTML = html;
  window.scrollTo(sx, sy);
  afterRender[r] && afterRender[r]();
  if (smartFocus) { const el = $('#smart-in'); if (el) { el.focus({ preventScroll: true }); try { el.setSelectionRange(smartFocus[0], smartFocus[1]); } catch (e) { /* ignoré */ } } }
}
const afterRender = {};

function banners() {
  let h = '';
  if (S.mode === 'memory') h += `<div class="banner info">${ico('alert')}<div class="grow"><b>Aperçu hors connexion.</b> La base de données n’est pas disponible ici : les données affichées sont des exemples et rien n’est enregistré.</div></div>`;
  else if (S.mode === 'loading') h += `<div class="banner info"><div class="grow">Chargement de vos données…</div></div>`;
  if (!S.canWrite && S.mode === 'live') h += `<div class="banner">${ico('alert')}<div class="grow">Lecture seule : seul le propriétaire du compte peut modifier ces données.</div></div>`;
  if (S.mode === 'local' && !S.localOk) h += `<div class="banner">${ico('alert')}<div class="grow"><b>Ce navigateur bloque l’enregistrement</b> (navigation privée ?). Ouvrez le lien dans une fenêtre normale pour garder vos données.</div></div>`;
  if (S.mode === 'local' && S.localOk && S.tx.length && !hasDemo() && (!S.settings.lastBackup || K.diffDays(S.settings.lastBackup, today()) > 14)) h += `<div class="banner info">${ico('download')}<div class="grow"><b>Sauvegarde conseillée.</b> Vos données sont uniquement sur cet appareil. ${S.settings.lastBackup ? 'Dernière sauvegarde : ' + esc(fmtD(S.settings.lastBackup)) + '.' : 'Aucune sauvegarde encore.'}</div><button class="btn sm" data-act="backup-export">Sauvegarder</button></div>`;
  if ((S.mode === 'live' || S.mode === 'local') && hasDemo()) h += `<div class="banner">${ico('alert')}<div class="grow"><b>Données de démonstration.</b> Les montants affichés sont fictifs (étiquette « Démo »). Supprimez-les quand vous êtes prêts à saisir vos vrais chiffres.</div><button class="btn sm" data-act="demo-clear">Supprimer la démo</button></div>`;
  return h;
}

/* ============================== Graphiques ============================== */
function niceStep(max, n) {
  const raw = max / n; const p = Math.pow(10, Math.floor(Math.log10(raw || 1)));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * p >= raw) return m * p;
  return 10 * p;
}
/** Barres groupées (cents). rows: [{label, values:[..]}], colors: tokens */
function barChart(rows, keys, opts) {
  opts = opts || {};
  const W = 720, H = opts.h || 250, pl = 52, pr = 10, pt = 14, pb = 30;
  let max = 0, min = 0;
  rows.forEach(r => keys.forEach(k => { max = Math.max(max, r[k.key]); min = Math.min(min, r[k.key]); }));
  if (max === 0 && min === 0) max = 100000;
  const step = niceStep((max - min) / 100, 4) * 100;
  const top = Math.ceil(max / step) * step, bot = Math.floor(min / step) * step;
  const y = v => pt + (top - v) / (top - bot) * (H - pt - pb);
  const gw = (W - pl - pr) / rows.length;
  const bw = Math.max(2, Math.min(16, gw * 0.72 / keys.length));
  let g = '';
  for (let v = bot; v <= top + 1; v += step) g += `<line x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line-2)" stroke-width="1"/><text x="${pl - 8}" y="${y(v) + 4}" text-anchor="end">${kfmt(v)}</text>`;
  const every = Math.ceil(rows.length / 12);
  rows.forEach((r, i) => {
    const x0 = pl + i * gw + (gw - bw * keys.length - 2 * (keys.length - 1)) / 2;
    keys.forEach((k, j) => {
      const v = r[k.key], yy = y(Math.max(v, 0)), hh = Math.abs(y(v) - y(0));
      g += `<rect x="${(x0 + j * (bw + 2)).toFixed(1)}" y="${yy.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(v ? 1 : 0, hh).toFixed(1)}" rx="${Math.min(3, bw / 2)}" fill="var(${k.color})"><title>${esc(r.label)} · ${k.label} : ${M(v)}</title></rect>`;
    });
    if (i % every === 0) g += `<text x="${(pl + i * gw + gw / 2).toFixed(1)}" y="${H - 9}" text-anchor="middle">${esc(r.short || r.label)}</text>`;
  });
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opts.aria || 'Graphique')}">${g}<line x1="${pl}" x2="${W - pr}" y1="${y(0)}" y2="${y(0)}" stroke="var(--line)" /></svg></div>`;
}
function lineChart(rows, keys, opts) {
  opts = opts || {};
  const W = 720, H = opts.h || 230, pl = 56, pr = 14, pt = 14, pb = 30;
  let max = 0, min = 0;
  rows.forEach(r => keys.forEach(k => { if (r[k.key] !== null) { max = Math.max(max, r[k.key]); min = Math.min(min, r[k.key]); } }));
  if (max === min) max = min + 100000;
  const step = niceStep((max - min) / 100, 4) * 100;
  const top = Math.ceil(max / step) * step, bot = Math.floor(min / step) * step;
  const y = v => pt + (top - v) / (top - bot) * (H - pt - pb);
  const x = i => pl + (rows.length === 1 ? (W - pl - pr) / 2 : i * (W - pl - pr) / (rows.length - 1));
  let g = '';
  for (let v = bot; v <= top + 1; v += step) g += `<line x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}" stroke="var(${v === 0 ? '--line' : '--line-2'})"/><text x="${pl - 8}" y="${y(v) + 4}" text-anchor="end">${kfmt(v)}</text>`;
  const every = Math.ceil(rows.length / 12);
  rows.forEach((r, i) => { if (i % every === 0) g += `<text x="${x(i)}" y="${H - 9}" text-anchor="middle">${esc(r.short || r.label)}</text>`; });
  keys.forEach(k => {
    const pts = rows.map((r, i) => r[k.key] === null ? null : [x(i), y(r[k.key])]).filter(Boolean);
    if (!pts.length) return;
    const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    if (k.area) g += `<path d="${d} L${pts[pts.length - 1][0].toFixed(1)} ${y(Math.max(bot, 0))} L${pts[0][0].toFixed(1)} ${y(Math.max(bot, 0))} Z" fill="var(${k.color})" opacity=".12"/>`;
    g += `<path d="${d}" fill="none" stroke="var(${k.color})" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round" ${k.dash ? 'stroke-dasharray="5 5"' : ''}/>`;
    const last = pts[pts.length - 1];
    g += `<circle cx="${last[0]}" cy="${last[1]}" r="4" fill="var(--surface)" stroke="var(${k.color})" stroke-width="2.2"/>`;
    rows.forEach((r, i) => { if (r[k.key] !== null) g += `<circle cx="${x(i)}" cy="${y(r[k.key])}" r="9" fill="transparent"><title>${esc(r.label)} · ${k.label} : ${M(r[k.key])}</title></circle>`; });
  });
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opts.aria || 'Graphique')}">${g}</svg></div>`;
}
function donut(segs, center) {
  const total = segs.reduce((s, x) => s + x.v, 0);
  const R = 70, c = 2 * Math.PI * R;
  let off = 0, g = '';
  if (!total) g = `<circle cx="90" cy="90" r="${R}" fill="none" stroke="var(--line-2)" stroke-width="22"/>`;
  segs.forEach(s => {
    const len = s.v / total * c;
    g += `<circle cx="90" cy="90" r="${R}" fill="none" stroke="${s.color}" stroke-width="22" stroke-dasharray="${Math.max(0, len - 1.5).toFixed(2)} ${(c - len + 1.5).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}" transform="rotate(-90 90 90)"><title>${esc(s.label)} : ${M(s.v)}</title></circle>`;
    off += len;
  });
  return `<div class="chart" style="max-width:220px;margin:auto"><svg viewBox="0 0 180 180">${g}<text x="90" y="86" text-anchor="middle" style="font-size:11px">${esc(center[0])}</text><text x="90" y="106" text-anchor="middle" style="font-size:17px;fill:var(--ink);font-weight:600">${esc(center[1])}</text></svg></div>`;
}
const GROUP_COLORS = ['#1B5A4A', '#33589A', '#C1952F', '#A1436C', '#6D7F95', '#2F8F86', '#B86A3B', '#7A6AA8'];
const groupColor = gid => GROUP_COLORS[K.GROUPS.findIndex(g => g.id === gid) % GROUP_COLORS.length] || '#8392A8';

/* ======================== Composants partagés ======================== */
function txIcon(t) {
  if (t.type === 'income') return `<div class="ico in">${ico('income')}</div>`;
  if (t.type === 'savings') return `<div class="ico sv">${ico('savings')}</div>`;
  if (t.type === 'transfer') return `<div class="ico tr">${ico('transfer')}</div>`;
  if (t.type === 'refund') return `<div class="ico in">${ico('refund')}</div>`;
  const c = C()[t.categoryId]; const col = c ? groupColor(c.group) : 'var(--ink-3)';
  return `<div class="ico" style="color:${col}">${ico(c && c.kind === 'transfer' ? 'transfer' : 'expense')}</div>`;
}
function txLabel(t) {
  if (t.type === 'income') return t.description || 'Revenu';
  if (t.type === 'savings') return t.description || (t.direction === 'withdraw' ? 'Retrait' : 'Dépôt') + ' · ' + goalName(t.goalId);
  if (t.type === 'transfer') return t.description || 'Transfert';
  return t.description || catName(t.categoryId);
}
function txSub(t) {
  const bits = [];
  if (t.type === 'expense' || t.type === 'refund') bits.push(catName(t.categoryId));
  if (t.type === 'refund') bits.push('Remboursement');
  if (t.type === 'savings') bits.push((t.direction === 'withdraw' ? 'Retrait de ' : 'Dépôt dans ') + goalName(t.goalId));
  if (t.type === 'transfer') bits.push((t.fromAccount || '?') + ' → ' + (t.toAccount || '?'));
  if (t.type === 'income') { const s = S.sources.find(x => x.id === t.sourceId); bits.push(s ? (s.employer || s.name) : 'Revenu'); }
  bits.push(PEOPLE[t.person] || '');
  if (t.shared) bits.push('Commune');
  if (t.recurringId) bits.push('Récurrente');
  return bits.filter(Boolean).join(' · ');
}
function txAmount(t) {
  const c = C()[t.categoryId];
  if (t.type === 'income' || t.type === 'refund') return `<span class="pos">${M(t.amountCents, { sign: true })}</span>`;
  if (t.type === 'transfer' || (c && c.kind === 'transfer')) return `<span class="muted">${M(t.amountCents)}</span>`;
  if (t.type === 'savings') return `<span style="color:var(--warn)">${t.direction === 'withdraw' ? '−' : ''}${M(t.amountCents)}</span>`;
  return '−' + M(t.amountCents);
}
function txRow(t, withDate) {
  return `<div class="row click ${t.status === 'cancelled' ? 'cancelled' : ''}" data-act="tx-edit" data-id="${esc(t.id)}" tabindex="0" role="button">
    ${txIcon(t)}<div class="grow"><div class="t">${esc(txLabel(t))} ${t.demo ? '<span class="pill demo">Démo</span>' : ''} ${t.status === 'cancelled' ? '<span class="pill">Annulée</span>' : ''}</div>
    <div class="s">${withDate ? esc(fmtD(t.date, 'dm')) + ' · ' : ''}${esc(txSub(t))}</div></div><div class="amt">${txAmount(t)}</div></div>`;
}
function progress(pctBps, level, ticks) {
  const w = pctBps === null ? 0 : Math.min(100, Math.max(0, pctBps / 100));
  return `<div class="bar ${level || ''}"><i style="width:${w}%"></i>${(ticks || []).map(t => `<span class="tick" style="left:${t}%"></span>`).join('')}</div>`;
}
const LEVEL = { ok: ['ok', 'Normal'], watch: ['watch', '70 % atteint'], near: ['near', 'Presque atteint'], over: ['over', 'Dépassé'], none: ['', '—'] };
function monthPicker(act, ymS) {
  return `<div class="seg"><button data-act="${act}" data-d="-1" aria-label="Mois précédent">${ico('chevl', 2)}</button><button class="on" style="min-width:140px">${esc(fmtMonth(ymS))}</button><button data-act="${act}" data-d="1" aria-label="Mois suivant">${ico('chev', 2)}</button></div>`;
}
function emptyState(title, text, btn) {
  return `<div class="empty"><b>${esc(title)}</b>${esc(text)}${btn ? `<div style="margin-top:12px">${btn}</div>` : ''}</div>`;
}
function catOptions(sel, kinds) {
  const cats = C(); const groups = {};
  Object.values(cats).forEach(c => { if (kinds && !kinds.includes(c.kind)) return; (groups[c.group] = groups[c.group] || []).push(c); });
  const gname = gid => (K.GROUPS.find(g => g.id === gid) || { name: 'Personnalisées' }).name;
  return Object.keys(groups).map(g => `<optgroup label="${esc(gname(g))}">${groups[g].map(c => `<option value="${esc(c.id)}" ${c.id === sel ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</optgroup>`).join('');
}

/* ========================= Calculs d'écran ========================= */
function upcoming(t, days) {
  const to = K.addDays(t, days), cats = C();
  const a = anchor(); const pstart = a ? K.payPeriodFor(t, a).start : t;
  const items = [];
  K.matchPays(K.expectedPays(S.sources, pstart, to), S.tx, t).forEach(p => { if (p.status !== 'received') items.push({ date: p.date, kind: 'pay', person: p.person, title: 'Paie ' + PEOPLE[p.person] + (p.name && p.name !== 'Salaire' ? ' · ' + p.name : ''), amount: p.amountCents, status: p.status, sourceId: p.sourceId }); });
  K.recurringOccurrences(S.recurring, S.tx, pstart, to).forEach(o => { if (!o.paid) items.push({ date: o.date, kind: o.kind === 'savings' ? 'save' : 'bill', title: o.description || catName(o.categoryId), amount: o.amountCents, ruleId: o.ruleId, late: o.date < t, person: o.person }); });
  S.events.forEach(e => K.occurrences({ frequency: e.frequency || 'once', startDate: e.date }, t, to).concat(!e.frequency || e.frequency === 'occasional' || e.frequency === 'once' ? (e.date >= t && e.date <= to ? [e.date] : []) : []).forEach(d => items.push({ date: d, kind: 'event', title: e.title, amount: e.amountCents || null, eventId: e.id })));
  debtDates(t, to).forEach(d => items.push(d));
  return items.sort((x, y) => x.date < y.date ? -1 : x.date > y.date ? 1 : 0);
}
function debtDates(from, to) {
  const linked = new Set(S.recurring.filter(r => r.debtId).map(r => r.debtId));
  const out = [];
  S.debts.forEach(d => {
    if (!d.paymentDay || linked.has(d.id) || K.debtBalance(d, S.tx) <= 0) return;
    K.occurrences({ frequency: 'monthly', startDate: '2000-01-01', day1: d.paymentDay }, from, to).forEach(x => out.push({ date: x, kind: 'debt', title: 'Paiement · ' + d.name, amount: d.plannedPaymentCents || d.minPaymentCents, debtId: d.id }));
  });
  return out;
}

/* ===================== Saisie en langage naturel ===================== */
const NLP = window.KYF_NLP;
UI.smart = ''; UI.smartDupOk = false;
const SMART_EX = ['45 $ resto avec Yousra hier', 'loyer 1174 $ chaque 1er du mois', 'Khalil reçoit 1600 $ net aux deux semaines', 'IGA 127,84', 'Yousra a payé la pharmacie 23,10', 'paie Khalil', 'mis 200 $ de côté pour le voyage', 'essence 62 lundi', 'paiement visa 300', 'café 4,25; Netflix 18,99'];
function nlpCtx() { return { today: today(), me: S.me, cats: C(), sources: S.sources, goals: S.goals, debts: S.debts, taxes: S.settings.taxes }; }
function smartBar() {
  return `<div class="card smart"><form id="smart-form" autocomplete="off"><div class="smart-row"><div class="ico sv smart-ico">${ico('spark')}</div>
    <textarea id="smart-in" class="smart-in" rows="1" enterkeyhint="done" placeholder="Écrivez ce qui s’est passé : « 45 $ resto avec Yousra hier »" aria-label="Écrire une transaction">${esc(UI.smart)}</textarea>
    <button type="submit" class="btn pri" id="smart-go" disabled>Ajouter</button></div></form>
    <div id="smart-prev">${smartPreview()}</div></div>`;
}
function dupOf(tx) {
  return S.tx.find(x => x.status !== 'cancelled' && x.type === tx.type && x.amountCents === tx.amountCents && x.date === tx.date && (x.categoryId || '') === (tx.categoryId || '') && (x.goalId || '') === (tx.goalId || ''));
}
function dupRule(r) { return S.recurring.find(x => x.active !== false && (x.kind || 'expense') === r.kind && x.amountCents === r.amountCents && x.frequency === r.frequency && (x.categoryId || '') === (r.categoryId || '') && (x.goalId || '') === (r.goalId || '')); }
function isDup(r) { return r.kind === 'rule' ? !!dupRule(r.rule) : r.kind === 'tx' ? !!dupOf(r.tx) : false; }
const FREQ_SHORT = { weekly: 'Chaque semaine', biweekly: 'Aux deux semaines', semimonthly: 'Deux fois par mois', monthly: 'Chaque mois', quarterly: 'Chaque 3 mois', yearly: 'Chaque année' };
function smartRow(r, i) {
  const t = r.tx, dup = r.ok && isDup(r);
  let chips, title, amount, action = 'Ajuster dans le formulaire';
  if (r.kind === 'source') {
    const src = r.source;
    title = 'Source de paie · ' + PEOPLE[src.person];
    chips = [`<span class="pill ok">Paie régulière</span>`, `<span class="pill ${pcls(src.person)}">${esc(PEOPLE[src.person])}</span>`, src.frequency ? `<span class="pill">${esc(FREQ_SHORT[src.frequency])}</span>` : '', r.existingId ? '<span class="pill">Remplace la source actuelle</span>' : '', '<span class="pill near">À compléter : une date de paie</span>', ...r.missing.map(m => `<span class="pill neg">Il manque : ${esc(m)}</span>`)];
    amount = src.netCents ? `<span class="pos">${M(src.netCents)}</span><div class="small muted" style="font-weight:400">net / paie</div>` : '<span class="muted">—</span>';
    action = 'Compléter la source de paie';
  } else if (r.kind === 'rule') {
    const ru = r.rule;
    title = ru.description || (ru.kind === 'savings' ? goalName(ru.goalId) : catName(ru.categoryId));
    chips = [`<span class="pill ${ru.kind === 'savings' ? 'watch' : ''}">${ru.kind === 'savings' ? 'Épargne automatique' : 'Dépense récurrente'}</span>`, `<span class="pill">${esc(FREQ_SHORT[ru.frequency])}${ru.frequency === 'monthly' && ru.day1 ? ' · le ' + ru.day1 + (ru.day1 === 1 ? 'er' : '') : ''}</span>`, `<span class="pill">${esc(ru.kind === 'savings' ? goalName(ru.goalId) : catName(ru.categoryId))}</span>`, `<span class="pill ${pcls(ru.person)}">${esc(PEOPLE[ru.person])}</span>`, ru.shared ? '<span class="pill c">Commune</span>' : '', ...r.notes.map(n => `<span class="pill ${/vérifier|défaut/.test(n) ? 'near' : ''}">${esc(n.replace(/Première échéance : (\S+)/, (m0, d) => 'Première échéance : ' + fmtD(d, 'dm')))}</span>`), ...r.missing.map(m => `<span class="pill neg">Il manque : ${esc(m)}</span>`), dup ? '<span class="pill neg">Déjà prévue</span>' : ''];
    amount = ru.amountCents ? M(ru.amountCents) : '<span class="muted">—</span>';
    action = 'Ajuster la dépense récurrente';
  } else {
    const kind = { expense: 'Dépense', refund: 'Remboursement', income: 'Revenu', savings: t.direction === 'withdraw' ? 'Retrait d’épargne' : 'Épargne', transfer: 'Transfert' }[t.type];
    const what = t.type === 'income' ? (S.sources.find(s => s.id === t.sourceId) ? 'Paie' : 'Revenu occasionnel') : t.type === 'savings' ? goalName(t.goalId) : t.type === 'transfer' ? t.fromAccount + ' → ' + t.toAccount : catName(t.categoryId);
    title = t.description || r.text;
    chips = [`<span class="pill ${t.type === 'income' || t.type === 'refund' ? 'ok' : t.type === 'savings' ? 'watch' : ''}">${esc(kind)}</span>`, `<span class="pill">${esc(what)}</span>`, `<span class="pill ${pcls(t.person)}">${esc(PEOPLE[t.person])}</span>`, t.shared ? '<span class="pill c">Commune</span>' : '', `<span class="pill">${esc(cap(fmtD(t.date, 'wdm')))}</span>`, ...r.notes.map(n => `<span class="pill ${/vérifier|défaut/.test(n) ? 'near' : ''}">${esc(n)}</span>`), ...r.missing.map(m => `<span class="pill neg">Il manque : ${esc(m)}</span>`), dup ? '<span class="pill neg">Doublon possible</span>' : ''];
    amount = t.amountCents ? txAmount(Object.assign({ id: 'p' }, t)) : '<span class="muted">—</span>';
  }
  return `<div class="row smart-item ${r.ok || r.kind === 'source' ? '' : 'bad'}"><div class="grow"><div class="t">${esc(title)}</div><div class="chips" style="margin-top:6px">${chips.join('')}</div></div>
    <div class="amt" style="font-size:16px">${amount}</div>
    <button type="button" class="btn sm ${r.kind === 'source' ? '' : 'ghost'}" data-act="smart-edit" data-i="${i}" aria-label="${action}">${r.kind === 'source' ? 'Compléter' : ico('edit')}</button></div>`;
}
function smartPreview() {
  const text = UI.smart.trim();
  if (!text) return `<div class="smart-ex"><span class="small muted">Exemples :</span>${SMART_EX.map(e => `<button type="button" class="chip" data-act="smart-ex" data-v="${esc(e)}">${esc(e)}</button>`).join('')}</div>`;
  const rs = NLP.parseText(text, nlpCtx());
  return `<div class="list smart-list">${rs.map(smartRow).join('')}</div>
  <div class="small muted" style="margin-top:8px">${rs.length > 1 ? rs.length + ' éléments · ' : ''}Entrée pour ajouter · <span class="kbd">Maj + Entrée</span> pour une autre ligne · ✎ pour ajuster</div>`;
}
function refreshSmart() {
  const prev = $('#smart-prev'), go = $('#smart-go'); if (!prev) return;
  prev.innerHTML = smartPreview();
  const rs = UI.smart.trim() ? NLP.parseText(UI.smart, nlpCtx()) : [];
  const n = rs.filter(r => r.ok).length, src = rs.filter(r => r.kind === 'source').length;
  go.disabled = !n && !src;
  go.textContent = n > 1 ? 'Ajouter ' + n : n ? 'Ajouter' : src ? 'Compléter' : 'Ajouter';
}
function autosize(el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 180) + 'px'; }
function bindSmart() {
  const el = $('#smart-in'); if (!el) return;
  autosize(el); refreshSmart();
  el.addEventListener('input', () => { UI.smart = el.value; UI.smartDupOk = false; autosize(el); refreshSmart(); });
  el.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); smartSubmit(); } });
  $('#smart-form').addEventListener('submit', e => { e.preventDefault(); smartSubmit(); });
}
function setSmart(results) {
  UI.smart = results.map(r => r.text).join('\n'); UI.smartDupOk = false;
  const el = $('#smart-in'); if (el) { el.value = UI.smart; autosize(el); }
  refreshSmart();
}
async function smartSubmit() {
  if (!S.canWrite) return toast('Lecture seule.');
  const rs = NLP.parseText(UI.smart, nlpCtx());
  const ok = rs.filter(r => r.ok), sources = rs.filter(r => r.kind === 'source'), rest = rs.filter(r => !r.ok && r.kind !== 'source');
  if (!ok.length && !sources.length) { toast(rs.length ? 'Il manque le montant : écrivez-le avec le texte (ex. « 12,50 »).' : 'Écrivez une transaction.'); return; }
  if (!UI.smartDupOk && ok.some(isDup)) { UI.smartDupOk = true; toast('Doublon possible : appuyez encore sur Entrée pour ajouter quand même.'); return; }
  const done = [];
  try {
    for (const r of ok) {
      if (r.kind === 'rule') {
        const rule = Object.assign({ id: uid('r'), active: true, createdAt: Date.now(), source: 'texte' }, r.rule);
        await save('recurring', rule); done.push(['recurring', rule.id, (rule.description || catName(rule.categoryId)) + ' · ' + FREQ_SHORT[rule.frequency].toLowerCase()]);
      } else {
        const tx = Object.assign({ id: uid('t'), createdAt: Date.now(), updatedAt: Date.now(), updatedBy: S.me, source: 'texte' }, r.tx);
        await save('tx', tx); done.push(['tx', tx.id, txLabel(tx) + ' · ' + K.formatMoney(tx.amountCents)]);
      }
    }
  } catch (e) { /* message déjà affiché */ }
  // Les sources de paie s'ouvrent dans leur formulaire, une à la fois
  const nextSrc = sources[0];
  setSmart(sources.slice(1).concat(rest));
  if (done.length) toast(done.length === 1 ? 'Ajouté : ' + done[0][2] : done.length + ' éléments ajoutés', async () => { for (const [c, id] of done) await removeDoc(c, id).catch(() => {}); toast('Annulé'); });
  if (nextSrc) openSourceFromText(nextSrc);
  else { const el = $('#smart-in'); if (el) el.focus(); }
  schedule();
}
function openSourceFromText(r) {
  const preset = Object.assign({}, r.source); Object.keys(preset).forEach(k => preset[k] === null && delete preset[k]);
  openSource(r.existingId || null, r.source.person, preset);
}
function smartEdit(i) {
  const rs = NLP.parseText(UI.smart, nlpCtx()); const r = rs[i]; if (!r) return;
  setSmart(rs.filter((x, j) => j !== i));
  if (r.kind === 'source') return openSourceFromText(r);
  if (r.kind === 'rule') return openRecurring(null, r.rule);
  openTx({ type: r.tx.type, date: r.tx.date, preset: Object.assign({}, r.tx) });
}

/* ================================ VUES ================================ */
const VIEWS = {};

/* ---------- 1. Tableau de bord ---------- */
VIEWS.tableau = function (t) {
  const cats = C(), D = DATA(), mr = K.monthRange(K.ym(t));
  const mt = K.totals(S.tx, cats, mr);
  const cmp = K.monthToDateComparison(S.tx, cats, t);
  const bal = K.balance(S.tx, cats, S.settings, t);
  const a = anchor();
  const noData = !S.tx.length && !S.sources.length;
  let h = smartBar();
  if (noData && S.mode !== 'loading') {
    h += `<div class="card"><div class="empty" style="padding:40px 12px"><b>Bienvenue, ${esc(PEOPLE[S.me])}.</b>Commencez par vos paies : ajoutez la source de revenu de Khalil et celle de Yousra, puis vos dépenses récurrentes.<br>Vous pouvez aussi explorer l’application avec des données fictives clairement identifiées.
      <div class="toolbar" style="justify-content:center;margin-top:16px"><button class="btn pri" data-act="source-new">${ico('plus')}Ajouter une source de revenu</button><button class="btn" data-act="demo-load">Charger la démonstration</button></div></div></div>`;
    return h;
  }
  // Héros : reste à dépenser pour la période de paie
  let hero;
  if (a) {
    const p = K.payPeriodFor(t, a); const ps = K.periodSummary(p, D, t);
    const day = K.diffDays(p.start, t) + 1;
    const note = ps.missing.length ? `<span class="pill">${ico('alert')} Paie manquante : ${ps.missing.map(m => PEOPLE[m.person] + ' ' + fmtD(m.date, 'dm')).join(', ')}</span>`
      : ps.pendingIncome ? `<span class="pill">À recevoir : ${M(ps.pendingIncome)}</span>` : `<span class="pill">${ico('check')} Paies reçues</span>`;
    hero = `<div class="card kpi hero"><div class="k-l">Reste à dépenser · période du ${esc(fmtD(p.start, 'dm'))} au ${esc(fmtD(p.end, 'dm'))} <span class="pill">Jour ${day}/14</span></div>
      <div class="k-v">${M(ps.leftToSpend)}</div>
      <div class="k-s">Calculé avec l’argent déjà reçu seulement. ${note}</div>
      <div class="break"><span>Reçu <b>${M(ps.receivedIncome)}</b></span><span>Dépensé <b>${M(ps.actualExpenses)}</b></span><span>Épargne <b>${M(Math.max(ps.actualSavings, ps.plannedSavings))}</b></span><span>Factures à venir <b>${M(ps.unpaidPlannedExpenses)}</b></span></div></div>`;
  } else {
    hero = `<div class="card kpi hero"><div class="k-l">Reste à dépenser cette période de paie</div><div class="k-v">—</div><div class="k-s">Indiquez une date de paie (aux deux semaines) pour activer les périodes de 14 jours.</div><div style="margin-top:14px"><button class="btn" data-act="go" data-v="parametres">Configurer la date de paie</button></div></div>`;
  }
  const balCard = `<div class="card kpi"><div class="k-l">Solde bancaire disponible ${bal.known ? '<span class="pill">Estimé</span>' : ''}</div>
    ${bal.known ? `<div class="k-v ${bal.cents < 0 ? 'neg' : ''}">${M(bal.cents)}</div><div class="k-s">Solde de départ du ${esc(fmtD(bal.since))} + revenus − dépenses − épargne. Les transferts internes et paiements de carte sont exclus.</div>`
      : `<div class="k-v muted">À configurer</div><div class="k-s">Sans solde de départ, aucun solde n’est affiché comme certain.</div><div style="margin-top:10px"><button class="btn sm" data-act="go" data-v="parametres">Entrer le solde de départ</button></div>`}
    <div class="split" title="Khalil / Yousra">${mt.income ? `<i style="width:${mt.byPerson.khalil.income / mt.income * 100}%;background:var(--khalil)"></i><i style="width:${mt.byPerson.yousra.income / mt.income * 100}%;background:var(--yousra)"></i>` : ''}</div>
    <div class="legend small" style="margin-top:8px"><span><i class="dot" style="background:var(--khalil)"></i>Revenus Khalil ${M(mt.byPerson.khalil.income)}</span><span><i class="dot" style="background:var(--yousra)"></i>Yousra ${M(mt.byPerson.yousra.income)}</span></div></div>`;
  h += `<div class="grid g-hero">${hero}${balCard}</div>`;
  const delta = (d, inverse) => d.pctBps === null ? '<span class="muted">Pas de mois précédent</span>' : `<span class="${(d.diff > 0) !== !!inverse ? 'pos' : d.diff === 0 ? 'muted' : 'neg'}">${d.diff >= 0 ? '+' : '−'}${K.formatBps(Math.abs(d.pctBps), 0)}</span> vs même période le mois dernier`;
  h += `<div class="grid g4 kpis">
    <div class="card kpi"><div class="k-l"><i class="dot" style="background:var(--c-income)"></i>Revenus du mois</div><div class="k-v">${M(mt.income, { noCents: true })}</div><div class="k-s">${delta(cmp.income)}</div></div>
    <div class="card kpi"><div class="k-l"><i class="dot" style="background:var(--c-exp)"></i>Dépenses du mois</div><div class="k-v">${M(mt.expenses, { noCents: true })}</div><div class="k-s">${delta(cmp.expenses, true)}</div></div>
    <div class="card kpi"><div class="k-l"><i class="dot" style="background:var(--c-sav)"></i>Économies réalisées</div><div class="k-v">${M(mt.savings, { noCents: true })}</div><div class="k-s">${delta(cmp.savings)}</div></div>
    <div class="card kpi"><div class="k-l">Taux d’épargne</div><div class="k-v">${K.formatBps(mt.savingsRateBps)}</div><div class="k-s">${mt.income ? 'Épargne ÷ revenus nets du mois' : 'Aucun revenu ce mois-ci'}</div></div></div>`;
  // Graphique
  const modes = [['day', 'Jour'], ['period', 'Période de paie'], ['month', 'Mois'], ['year', 'Année']];
  const sr = K.series(S.tx, cats, UI.chartMode, t, a || t).map(r => ({ ...r, label: UI.chartMode === 'month' ? fmtMonth(r.key) : UI.chartMode === 'day' || UI.chartMode === 'period' ? fmtD(r.key, 'dm') : r.key, short: UI.chartMode === 'month' ? fmtD(r.key, 'mshort').replace('.', '') : UI.chartMode === 'year' ? r.key : fmtD(r.key, 'dm').replace('.', '') }));
  h += `<div class="grid g-side"><div class="card"><div class="card-h"><h2 class="grow">Revenus, dépenses et économies</h2><div class="seg">${modes.map(([k, l]) => `<button class="${UI.chartMode === k ? 'on' : ''}" data-act="chart-mode" data-v="${k}" ${k === 'period' && !a ? 'disabled' : ''}>${l}</button>`).join('')}</div></div>
    ${barChart(sr, [{ key: 'income', label: 'Revenus', color: '--c-income' }, { key: 'expenses', label: 'Dépenses', color: '--c-exp' }, { key: 'savings', label: 'Économies', color: '--c-sav' }], { aria: 'Revenus, dépenses et économies' })}
    <div class="legend" style="margin-top:8px"><span><i class="dot" style="background:var(--c-income)"></i>Revenus</span><span><i class="dot" style="background:var(--c-exp)"></i>Dépenses</span><span><i class="dot" style="background:var(--c-sav)"></i>Économies</span></div></div>`;
  // Échéances
  const up = upcoming(t, 14).slice(0, 7);
  h += `<div class="card"><div class="card-h"><h2 class="grow">Prochaines échéances</h2><a class="btn ghost sm" href="#calendrier">Calendrier</a></div><div class="list">${up.length ? up.map(upRow).join('') : emptyState('Rien dans les 14 prochains jours', 'Les paies, factures et abonnements récurrents apparaîtront ici.')}</div></div></div>`;
  // Objectifs + budgets + dernières transactions
  const goals = S.goals.map(g => ({ g, p: K.goalProgress(g, S.tx, t) })).slice(0, 5);
  const bs = K.budgetStatus(S.budgets, S.tx, cats, K.ym(t)).sort((x, y) => (y.pctBps || 0) - (x.pctBps || 0)).slice(0, 5);
  const recent = [...S.tx].sort((x, y) => x.date < y.date ? 1 : x.date > y.date ? -1 : 0).slice(0, 7);
  h += `<div class="grid g3">
    <div class="card"><div class="card-h"><h2 class="grow">Objectifs d’épargne</h2><a class="btn ghost sm" href="#epargne">Tout voir</a></div>
      ${goals.length ? `<div class="grid" style="gap:14px">${goals.map(({ g, p }) => `<div><div style="display:flex;justify-content:space-between;gap:8px"><span class="t" style="font-weight:500">${esc(g.name)}</span><span class="tn small">${K.formatBps(p.pctBps, 0)}</span></div><div style="margin:6px 0 4px">${progress(p.pctBps)}</div><div class="small muted tn">${M(p.balance, { noCents: true })} sur ${M(g.targetCents, { noCents: true })}</div></div>`).join('')}</div>` : emptyState('Aucun objectif', 'Fonds d’urgence, voyage, maison…', `<button class="btn sm" data-act="goal-new">${ico('plus')}Créer un objectif</button>`)}</div>
    <div class="card"><div class="card-h"><h2 class="grow">Budgets du mois</h2><a class="btn ghost sm" href="#budgets">Tout voir</a></div>
      ${bs.length ? `<div class="grid" style="gap:14px">${bs.map(b => `<div><div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><span style="font-weight:500">${esc(b.categoryId ? catName(b.categoryId) : b.group)}</span><span class="pill ${LEVEL[b.level][0]}">${K.formatBps(b.pctBps, 0)}</span></div><div style="margin:6px 0 4px">${progress(b.pctBps, b.level, [70, 85])}</div><div class="small muted tn">${M(b.spent, { noCents: true })} / ${M(b.limit, { noCents: true })} · reste ${M(b.remaining, { noCents: true })}</div></div>`).join('')}</div>` : emptyState('Aucun budget', 'Fixez une limite par catégorie.', `<button class="btn sm" data-act="budget-new">${ico('plus')}Créer un budget</button>`)}</div>
    <div class="card"><div class="card-h"><h2 class="grow">Dernières transactions</h2><a class="btn ghost sm" href="#transactions">Tout voir</a></div><div class="list">${recent.length ? recent.map(x => txRow(x, true)).join('') : emptyState('Aucune transaction', 'Ajoutez votre première dépense.')}</div></div></div>`;
  return h;
};
function upRow(u) {
  const kindIco = u.kind === 'pay' ? `<div class="ico in">${ico('income')}</div>` : u.kind === 'save' ? `<div class="ico sv">${ico('savings')}</div>` : u.kind === 'debt' ? `<div class="ico">${ico('debt')}</div>` : u.kind === 'event' ? `<div class="ico">${ico('calendar')}</div>` : `<div class="ico">${ico('repeat')}</div>`;
  let action = '';
  if (u.kind === 'pay') action = `<button class="btn sm" data-act="pay-record" data-src="${esc(u.sourceId)}" data-date="${u.date}">Reçue</button>`;
  else if (u.ruleId) action = `<button class="btn sm" data-act="occ-pay" data-rule="${esc(u.ruleId)}" data-date="${u.date}">${u.kind === 'save' ? 'Faite' : 'Payée'}</button>`;
  const status = u.status === 'missing' ? '<span class="pill neg">Manquante</span>' : u.late ? '<span class="pill near">En retard</span>' : '';
  return `<div class="row">${kindIco}<div class="grow"><div class="t">${esc(u.title)} ${status}</div><div class="s">${esc(cap(fmtD(u.date, 'wdm')))}${u.person && u.kind !== 'pay' ? '' : ''}</div></div><div class="amt">${u.amount !== null && u.amount !== undefined ? (u.kind === 'pay' ? `<span class="pos">${M(u.amount)}</span>` : M(u.amount)) : ''}</div>${action}</div>`;
}

/* ---------- 2. Transactions ---------- */
function filteredTx() {
  const f = UI.tx, q = f.q.trim().toLowerCase();
  return S.tx.filter(t => {
    if (!f.cancelled && t.status === 'cancelled') return false;
    if (f.type && t.type !== f.type) return false;
    if (f.person && t.person !== f.person) return false;
    if (f.cat && t.categoryId !== f.cat) return false;
    if (f.month && K.ym(t.date) !== f.month) return false;
    if (q) { const hay = (txLabel(t) + ' ' + txSub(t) + ' ' + (t.notes || '') + ' ' + (t.amountCents / 100).toFixed(2)).toLowerCase(); if (!hay.includes(q)) return false; }
    return true;
  }).sort((x, y) => x.date < y.date ? 1 : x.date > y.date ? -1 : (y.createdAt || 0) - (x.createdAt || 0));
}
function txListHTML() {
  const list = filteredTx(), cats = C();
  if (!list.length) return emptyState(S.tx.length ? 'Aucun résultat' : 'Aucune transaction', S.tx.length ? 'Modifiez la recherche ou les filtres.' : 'Utilisez « Ajouter une transaction ».');
  const tot = K.totals(list, cats);
  let h = `<div class="toolbar small muted" style="margin-bottom:6px"><span>${list.length} transaction${list.length > 1 ? 's' : ''}</span><span>Revenus <b class="pos tn">${M(tot.income)}</b></span><span>Dépenses <b class="tn">${M(tot.expenses)}</b></span><span>Épargne <b class="tn">${M(tot.savings)}</b></span></div>`;
  let cur = null, shown = 0;
  for (const t of list) {
    if (shown >= 400) { h += `<div class="empty small">Affichage limité aux 400 plus récentes : précisez la recherche.</div>`; break; }
    if (t.date !== cur) { cur = t.date; const dt = K.totals(list.filter(x => x.date === cur), cats); h += `<div class="day-h"><span>${esc(cap(fmtD(cur, 'wdm')))}</span><span class="tn">${dt.expenses ? '−' + M(dt.expenses) : ''}</span></div>`; }
    h += txRow(t); shown++;
  }
  return h;
}
VIEWS.transactions = function () {
  const f = UI.tx;
  const sb = smartBar();
  const months = [...new Set(S.tx.map(t => K.ym(t.date)))].sort().reverse();
  return sb + `<div class="card"><div class="toolbar" style="margin-bottom:12px">
      <div class="search">${ico('search')}<input class="inp" id="tx-q" type="search" placeholder="Rechercher : description, catégorie, montant…" value="${esc(f.q)}" autocomplete="off"></div>
      <select class="inp" id="tx-type" style="width:auto"><option value="">Tous les types</option>${[['expense', 'Dépenses'], ['refund', 'Remboursements'], ['income', 'Revenus'], ['savings', 'Épargne'], ['transfer', 'Transferts']].map(([v, l]) => `<option value="${v}" ${f.type === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
      <select class="inp" id="tx-person" style="width:auto"><option value="">Khalil et Yousra</option><option value="khalil" ${f.person === 'khalil' ? 'selected' : ''}>Khalil</option><option value="yousra" ${f.person === 'yousra' ? 'selected' : ''}>Yousra</option></select>
      <select class="inp" id="tx-cat" style="width:auto"><option value="">Toutes les catégories</option>${catOptions(f.cat)}</select>
      <select class="inp" id="tx-month" style="width:auto"><option value="">Tous les mois</option>${months.map(m => `<option value="${m}" ${f.month === m ? 'selected' : ''}>${esc(fmtMonth(m))}</option>`).join('')}</select>
      <label class="small" style="display:flex;gap:6px;align-items:center"><input type="checkbox" id="tx-cancelled" ${f.cancelled ? 'checked' : ''}>Voir les annulées</label>
      <div class="grow"></div>
      <button class="btn sm" data-act="export-csv">${ico('download')}CSV</button><button class="btn sm" data-act="export-xlsx">${ico('download')}Excel</button></div>
    <div class="list" id="tx-list">${txListHTML()}</div></div>`;
};
afterRender.tableau = bindSmart;
afterRender.transactions = function () {
  bindSmart();
  const upd = () => { $('#tx-list').innerHTML = txListHTML(); };
  $('#tx-q').addEventListener('input', e => { UI.tx.q = e.target.value; upd(); });
  [['tx-type', 'type'], ['tx-person', 'person'], ['tx-cat', 'cat'], ['tx-month', 'month']].forEach(([id, k]) => $('#' + id).addEventListener('change', e => { UI.tx[k] = e.target.value; upd(); }));
  $('#tx-cancelled').addEventListener('change', e => { UI.tx.cancelled = e.target.checked; upd(); });
};

/* ---------- 3. Revenus ---------- */
VIEWS.revenus = function (t) {
  const cats = C(), m = K.ym(t), mt = K.totals(S.tx, cats, K.monthRange(m));
  const yr = K.totals(S.tx, cats, { from: t.slice(0, 4) + '-01-01', to: t.slice(0, 4) + '-12-31' });
  const exp = K.matchPays(K.expectedPays(S.sources, K.monthRange(m).from, K.monthRange(m).to), S.tx, t);
  const expTotal = exp.reduce((s, e) => s + e.amountCents, 0);
  const person = p => {
    const src = S.sources.filter(s => s.person === p);
    return `<div class="card"><div class="card-h"><span class="pill ${pcls(p)}">${PEOPLE[p]}</span><h2 class="grow">Sources de revenus</h2><button class="btn sm" data-act="source-new" data-person="${p}">${ico('plus')}Source</button></div>
      <div class="grid g2" style="gap:12px;margin-bottom:14px"><div class="kpi"><div class="k-l">Reçu ce mois-ci</div><div class="k-v" style="font-size:26px">${M(mt.byPerson[p].income)}</div></div><div class="kpi"><div class="k-l">Depuis le 1er janvier</div><div class="k-v" style="font-size:26px">${M(yr.byPerson[p].income)}</div></div></div>
      <div class="list">${src.length ? src.map(s => {
        const nx = s.frequency === 'occasional' ? null : K.nextPayDate(s, t);
        return `<div class="row click" data-act="source-edit" data-id="${esc(s.id)}" tabindex="0" role="button"><div class="ico in">${ico('income')}</div><div class="grow"><div class="t">${esc(s.name || 'Revenu')}${s.employer ? ' · ' + esc(s.employer) : ''} ${s.demo ? '<span class="pill demo">Démo</span>' : ''} ${s.active === false ? '<span class="pill">Inactive</span>' : ''}</div>
          <div class="s">${esc(K.FREQUENCIES[s.frequency] || '')}${nx ? ' · prochaine paie ' + esc(cap(fmtD(nx, 'wdm'))) : ''}${s.grossCents ? ' · brut ' + M(s.grossCents) : ''}</div></div><div class="amt">${s.netCents ? M(s.netCents) + '<div class="small muted" style="font-weight:400">net / paie</div>' : '<span class="muted small">Montant variable</span>'}</div></div>`;
      }).join('') : emptyState('Aucune source', 'Ajoutez le salaire de ' + PEOPLE[p] + ' : fréquence, net déposé et une date de paie.')}</div></div>`;
  };
  const incomes = S.tx.filter(x => x.type === 'income').sort((a, b) => a.date < b.date ? 1 : -1).slice(0, 12);
  return `<div class="grid g4 kpis">
      <div class="card kpi"><div class="k-l">Revenus du mois (reçus)</div><div class="k-v">${M(mt.income, { noCents: true })}</div><div class="k-s">Montants nets déposés</div></div>
      <div class="card kpi"><div class="k-l">Paies attendues ce mois</div><div class="k-v">${M(expTotal, { noCents: true })}</div><div class="k-s">${exp.length} paie${exp.length > 1 ? 's' : ''} prévue${exp.length > 1 ? 's' : ''}${exp.length >= 3 ? ' · mois à 3 paies' : ''}</div></div>
      <div class="card kpi"><div class="k-l">Paies manquantes</div><div class="k-v ${exp.some(e => e.status === 'missing') ? 'neg' : ''}">${exp.filter(e => e.status === 'missing').length}</div><div class="k-s">Date passée sans dépôt enregistré</div></div>
      <div class="card kpi"><div class="k-l">Revenus ${t.slice(0, 4)}</div><div class="k-v">${M(yr.income, { noCents: true })}</div><div class="k-s">Année civile = année fiscale des particuliers</div></div></div>
    <div class="grid g2">${person('khalil')}${person('yousra')}</div>
    <div class="grid g-side"><div class="card"><div class="card-h"><h2 class="grow">Paies de ${esc(fmtMonth(m).toLowerCase())}</h2></div><div class="list">${exp.length ? exp.map(e => `<div class="row"><div class="ico in">${ico('income')}</div><div class="grow"><div class="t">${PEOPLE[e.person]} · ${esc(e.name || 'Paie')}</div><div class="s">${esc(cap(fmtD(e.date, 'wdm')))}</div></div>
      <span class="pill ${e.status === 'received' ? 'ok' : e.status === 'missing' ? 'neg' : ''}">${e.status === 'received' ? 'Reçue' : e.status === 'missing' ? 'Manquante' : 'Prévue'}</span>
      <div class="amt">${e.status === 'received' ? M(e.receivedCents) : M(e.amountCents)}</div>${e.status !== 'received' ? `<button class="btn sm" data-act="pay-record" data-src="${esc(e.sourceId)}" data-date="${e.date}">Enregistrer</button>` : ''}</div>`).join('') : emptyState('Aucune paie prévue', 'Ajoutez une source de revenu avec sa fréquence.')}</div></div>
    <div class="card"><div class="card-h"><h2 class="grow">Revenus enregistrés</h2><button class="btn sm" data-act="add" data-type="income">${ico('plus')}Revenu</button></div><div class="list">${incomes.length ? incomes.map(x => txRow(x, true)).join('') : emptyState('Aucun revenu enregistré', '')}</div>
    <p class="small muted" style="margin:12px 0 0">Les montants nets réellement déposés font foi. L’application ne calcule jamais un salaire net à partir du brut.</p></div></div>`;
};

/* ---------- 4. Dépenses ---------- */
VIEWS.depenses = function (t) {
  const m = UI.month || K.ym(t), cats = C(), r = K.monthRange(m), mt = K.totals(S.tx, cats, r);
  const byGroup = {};
  Object.entries(mt.byCategory).forEach(([c, v]) => { const g = cats[c] ? cats[c].group : 'autres'; (byGroup[g] = byGroup[g] || { total: 0, items: [] }); byGroup[g].total += v; byGroup[g].items.push([c, v]); });
  const groups = Object.entries(byGroup).sort((a, b) => b[1].total - a[1].total);
  const gname = gid => (K.GROUPS.find(g => g.id === gid) || { name: 'Personnalisées' }).name;
  const list = S.tx.filter(x => (x.type === 'expense' || x.type === 'refund') && x.date >= r.from && x.date <= r.to).sort((a, b) => a.date < b.date ? 1 : -1);
  const rec = S.recurring.slice().sort((a, b) => (b.amountCents || 0) - (a.amountCents || 0));
  const recMonthly = K.recurringOccurrences(S.recurring.filter(x => (x.kind || 'expense') === 'expense'), [], r.from, r.to).reduce((s, o) => s + o.amountCents, 0);
  return `<div class="toolbar">${monthPicker('month-shift', m)}<div class="grow"></div><button class="btn" data-act="recurring-new">${ico('repeat')}Dépense récurrente</button><button class="btn pri" data-act="add" data-type="expense">${ico('plus')}Dépense</button></div>
    <div class="grid g4 kpis">
      <div class="card kpi"><div class="k-l">Dépenses du mois</div><div class="k-v">${M(mt.expenses, { noCents: true })}</div><div class="k-s">Remboursements déduits, annulées exclues</div></div>
      <div class="card kpi"><div class="k-l">Communes</div><div class="k-v">${M(mt.shared, { noCents: true })}</div><div class="k-s">${K.formatBps(K.ratioBps(mt.shared, mt.expenses), 0)} du total</div></div>
      <div class="card kpi"><div class="k-l">Payé par Khalil / Yousra</div><div class="k-v" style="font-size:22px">${M(mt.byPerson.khalil.expenses, { noCents: true })} · ${M(mt.byPerson.yousra.expenses, { noCents: true })}</div><div class="k-s">Selon la personne qui a payé</div></div>
      <div class="card kpi"><div class="k-l">Récurrentes prévues</div><div class="k-v">${M(recMonthly, { noCents: true })}</div><div class="k-s">${S.recurring.length} règle${S.recurring.length > 1 ? 's' : ''} active${S.recurring.length > 1 ? 's' : ''}</div></div></div>
    <div class="grid g-side"><div class="card"><div class="card-h"><h2 class="grow">Par catégorie</h2></div>
      ${groups.length ? groups.map(([g, d]) => `<div style="padding:10px 0;border-top:1px solid var(--line-2)"><div style="display:flex;justify-content:space-between;gap:8px;font-weight:600"><span style="display:flex;gap:8px;align-items:center"><i class="dot" style="background:${groupColor(g)}"></i>${esc(gname(g))}</span><span class="tn">${M(d.total)}</span></div>
        ${d.items.sort((a, b) => b[1] - a[1]).map(([c, v]) => `<div style="display:flex;justify-content:space-between;gap:8px;padding:4px 0 0 16px" class="small"><span class="muted">${esc(catName(c))}</span><span class="tn">${M(v)}</span></div>`).join('')}</div>`).join('') : emptyState('Aucune dépense ce mois-ci', '')}</div>
    <div class="card"><div class="card-h"><h2 class="grow">Dépenses récurrentes</h2></div><div class="list">${rec.length ? rec.map(x => `<div class="row click" data-act="recurring-edit" data-id="${esc(x.id)}" tabindex="0" role="button"><div class="ico ${x.kind === 'savings' ? 'sv' : ''}">${ico(x.kind === 'savings' ? 'savings' : 'repeat')}</div><div class="grow"><div class="t">${esc(x.description || catName(x.categoryId))} ${x.demo ? '<span class="pill demo">Démo</span>' : ''}</div><div class="s">${esc(K.FREQUENCIES[x.frequency] || '')}${x.kind === 'savings' ? ' · vers ' + esc(goalName(x.goalId)) : ' · ' + esc(catName(x.categoryId))} · ${PEOPLE[x.person] || ''}</div></div><div class="amt">${M(x.amountCents)}</div></div>`).join('') : emptyState('Aucune dépense récurrente', 'Loyer, Hydro-Québec, assurances, abonnements…')}</div>
    <p class="small muted" style="margin:12px 0 0">Une occurrence n’est enregistrée qu’une fois : « Payée » crée la transaction avec un identifiant unique par date.</p></div></div>
    <div class="card"><div class="card-h"><h2 class="grow">Dépenses de ${esc(fmtMonth(m).toLowerCase())}</h2></div><div class="list">${list.length ? list.map(x => txRow(x, true)).join('') : emptyState('Aucune dépense', '')}</div></div>`;
};

/* ---------- 5. Périodes de paie ---------- */
VIEWS.periodes = function (t) {
  const a = anchor();
  if (!a) return `<div class="card">${emptyState('Aucune date de paie de référence', 'Les périodes de 14 jours commencent un jour de paie. Indiquez une date de paie (passée ou à venir) ou ajoutez une source de revenu « toutes les deux semaines ».', `<button class="btn pri" data-act="go" data-v="parametres">Configurer</button>`)}</div>`;
  const cur = K.payPeriodFor(t, a);
  if (UI.periodIdx === null) UI.periodIdx = cur.index;
  const D = DATA();
  const idxs = []; for (let i = cur.index - 8; i <= cur.index + 6; i++) idxs.push(i);
  const tl = idxs.map(i => { const p = K.payPeriodByIndex(i, a); const s = K.periodSummary(p, D, t); return `<button class="tl ${i === UI.periodIdx ? 'on' : ''} ${i === cur.index ? 'cur' : ''}" data-act="period" data-v="${i}" ${i === UI.periodIdx ? 'id="tl-on"' : ''}><div class="d">${esc(fmtD(p.start, 'dm'))} – ${esc(fmtD(p.end, 'dm'))}</div><div class="v">${s.status === 'future' ? '<span class="muted">' + M(s.expectedIncome, { noCents: true }) + ' prévus</span>' : M(s.afterSavings, { noCents: true })}</div></button>`; }).join('');
  const p = K.payPeriodByIndex(UI.periodIdx, a), s = K.periodSummary(p, D, t);
  const lbl = s.status === 'current' ? '<span class="pill c">Période en cours</span>' : s.status === 'future' ? '<span class="pill">À venir</span>' : '<span class="pill">Terminée</span>';
  const cell = (label, plan, actual, sub) => `<div><div class="p">${label}</div><div class="a">${M(actual)}</div><div class="p tn">Prévu ${M(plan)}${sub ? ' · ' + sub : ''}</div></div>`;
  const cats = C();
  const catRows = Object.entries(s.byCategory).sort((x, y) => y[1] - x[1]);
  return `<div class="card"><div class="card-h"><h2 class="grow">Chronologie des périodes de 14 jours</h2><div class="toolbar"><button class="btn sm" data-act="period" data-v="${cur.index}">Période en cours</button></div></div><div class="timeline" id="timeline">${tl}</div></div>
    <div class="card"><div class="card-h"><h2 class="grow">Du ${esc(fmtD(p.start, 'long'))} au ${esc(fmtD(p.end, 'long'))}</h2>${lbl}${s.certain ? '' : '<span class="pill near">Montants incomplets</span>'}</div>
      <div class="pv">
        ${cell('Revenus reçus', s.expectedIncome, s.receivedIncome, s.pendingIncome ? 'à recevoir ' + M(s.pendingIncome) : '')}
        ${cell('Dépenses réelles', s.plannedExpenses, s.actualExpenses, 'récurrentes')}
        ${cell('Épargne réelle', s.plannedSavings, s.actualSavings)}
        <div><div class="p">Montant restant</div><div class="a ${s.remaining < 0 ? 'neg' : ''}">${M(s.remaining)}</div><div class="p tn">Après épargne ${M(s.afterSavings)} · taux ${K.formatBps(s.savingsRateBps)}</div></div>
      </div>
      ${s.status !== 'past' ? `<div class="banner info" style="margin-top:14px"><div class="grow">Reste à dépenser : <b class="tn">${M(s.leftToSpend)}</b> — argent reçu, moins dépenses, épargne prévue et factures encore à payer dans cette période.</div></div>` : ''}
    </div>
    <div class="grid g3">
      <div class="card"><div class="card-h"><h2 class="grow">Paies</h2></div><div class="list">${s.pays.length ? s.pays.map(e => `<div class="row"><div class="ico in">${ico('income')}</div><div class="grow"><div class="t">${PEOPLE[e.person]} · ${esc(e.name || 'Paie')}</div><div class="s">${esc(cap(fmtD(e.date, 'wdm')))}</div></div><span class="pill ${e.status === 'received' ? 'ok' : e.status === 'missing' ? 'neg' : ''}">${e.status === 'received' ? 'Reçue' : e.status === 'missing' ? 'Manquante' : 'Prévue'}</span><div class="amt">${M(e.status === 'received' ? e.receivedCents : e.amountCents)}</div>${e.status !== 'received' ? `<button class="btn sm" data-act="pay-record" data-src="${esc(e.sourceId)}" data-date="${e.date}">Reçue</button>` : ''}</div>`).join('') : emptyState('Aucune paie prévue', '')}</div></div>
      <div class="card"><div class="card-h"><h2 class="grow">Factures et épargne prévues</h2></div><div class="list">${s.occurrences.length ? s.occurrences.map(o => `<div class="row"><div class="ico ${o.kind === 'savings' ? 'sv' : ''}">${ico(o.kind === 'savings' ? 'savings' : 'repeat')}</div><div class="grow"><div class="t">${esc(o.description || catName(o.categoryId))}</div><div class="s">${esc(cap(fmtD(o.date, 'wdm')))}</div></div><div class="amt">${M(o.amountCents)}</div>${o.paid ? `<span class="pill ok">${ico('check')}Fait</span>` : `<button class="btn sm" data-act="occ-pay" data-rule="${esc(o.ruleId)}" data-date="${o.date}">${o.kind === 'savings' ? 'Faite' : 'Payée'}</button>`}</div>`).join('') : emptyState('Rien de prévu', 'Ajoutez vos dépenses récurrentes.')}</div></div>
      <div class="card"><div class="card-h"><h2 class="grow">Dépenses par catégorie</h2></div>${catRows.length ? `<div class="table-wrap"><table><tbody>${catRows.map(([c, v]) => `<tr><td>${esc(catName(c))}</td><td>${M(v)}</td></tr>`).join('')}</tbody><tfoot><tr><td>Total</td><td>${M(s.actualExpenses)}</td></tr></tfoot></table></div>` : emptyState('Aucune dépense', '')}
        <div class="legend small" style="margin-top:12px"><span><i class="dot" style="background:var(--khalil)"></i>Khalil ${M(s.byPerson.khalil.expenses)}</span><span><i class="dot" style="background:var(--yousra)"></i>Yousra ${M(s.byPerson.yousra.expenses)}</span></div></div></div>`;
};
afterRender.periodes = function () { const on = $('#tl-on'), tl = $('#timeline'); if (on && tl) tl.scrollLeft = on.offsetLeft - tl.clientWidth / 2 + on.clientWidth / 2; };

/* ---------- 6. Budgets ---------- */
VIEWS.budgets = function (t) {
  const m = UI.month || K.ym(t), cats = C();
  const st = K.budgetStatus(S.budgets, S.tx, cats, m);
  const tot = st.reduce((a, b) => ({ limit: a.limit + b.limit, spent: a.spent + b.spent }), { limit: 0, spent: 0 });
  const totPct = K.ratioBps(tot.spent, tot.limit);
  const isCur = m === K.ym(t);
  const r = K.monthRange(m); const elapsed = isCur ? K.diffDays(r.from, t) + 1 : K.diffDays(r.from, r.to) + 1; const dim = K.diffDays(r.from, r.to) + 1;
  const pace = Math.round(elapsed / dim * 100);
  return `<div class="toolbar">${monthPicker('month-shift', m)}<div class="grow"></div><button class="btn pri" data-act="budget-new">${ico('plus')}Budget</button></div>
    <div class="grid g4 kpis">
      <div class="card kpi"><div class="k-l">Budget autorisé</div><div class="k-v">${M(tot.limit, { noCents: true })}</div><div class="k-s">${st.length} catégorie${st.length > 1 ? 's' : ''}</div></div>
      <div class="card kpi"><div class="k-l">Dépensé</div><div class="k-v">${M(tot.spent, { noCents: true })}</div><div class="k-s">${K.formatBps(totPct, 0)} utilisé</div></div>
      <div class="card kpi"><div class="k-l">Restant</div><div class="k-v ${tot.limit - tot.spent < 0 ? 'neg' : ''}">${M(tot.limit - tot.spent, { noCents: true })}</div><div class="k-s">${isCur ? (dim - elapsed) + ' jours restants dans le mois' : 'Mois ' + (m < K.ym(t) ? 'terminé' : 'à venir')}</div></div>
      <div class="card kpi"><div class="k-l">Alertes</div><div class="k-v">${st.filter(b => b.level !== 'ok').length}</div><div class="k-s">Seuils : 70 %, 85 %, 100 %</div></div></div>
    <div class="card"><div class="card-h"><h2 class="grow">Budgets de ${esc(fmtMonth(m).toLowerCase())}</h2>${isCur ? `<span class="small muted">Rythme du mois : ${pace} % écoulé</span>` : ''}</div>
      ${st.length ? `<div class="list">${st.sort((a, b) => (b.pctBps || 0) - (a.pctBps || 0)).map(b => { const bd = S.budgets.find(x => x.id === b.id); return `<div class="row click" data-act="budget-edit" data-id="${esc(b.id)}" tabindex="0" role="button" style="flex-wrap:wrap"><div class="grow" style="min-width:180px"><div class="t">${esc(b.categoryId ? catName(b.categoryId) : b.group)} ${bd && bd.demo ? '<span class="pill demo">Démo</span>' : ''}</div><div style="margin:8px 0 4px;position:relative">${progress(b.pctBps, b.level, [70, 85])}</div><div class="s tn">${M(b.spent)} dépensés sur ${M(b.limit)} · ${b.remaining >= 0 ? 'reste ' + M(b.remaining) : 'dépassé de ' + M(-b.remaining)}</div></div><span class="pill ${LEVEL[b.level][0]}">${LEVEL[b.level][1]} · ${K.formatBps(b.pctBps, 0)}</span></div>`; }).join('')}</div>`
      : emptyState('Aucun budget', 'Exemple : Épicerie 600 $, Restaurants 250 $, Essence 200 $, Loisirs 150 $ par mois.', `<button class="btn pri" data-act="budget-new">${ico('plus')}Créer un budget</button>`)}</div>`;
};

/* ---------- 7. Épargne ---------- */
VIEWS.epargne = function (t) {
  const cats = C();
  const rows = S.goals.map(g => ({ g, p: K.goalProgress(g, S.tx, t) }));
  const total = rows.reduce((s, r) => s + r.p.balance, 0);
  const pace = K.savingsPace(S.tx, cats, t, 3);
  const mt = K.totals(S.tx, cats, K.monthRange(K.ym(t)));
  const section = owner => {
    const rs = rows.filter(r => (r.g.owner || 'commun') === owner);
    const sum = rs.reduce((s, r) => s + r.p.balance, 0);
    return `<div class="card"><div class="card-h"><span class="pill ${pcls(owner)}">${owner === 'commun' ? 'Épargne commune' : 'Épargne de ' + PEOPLE[owner]}</span><div class="grow"></div><span class="tn" style="font-weight:600">${M(sum)}</span><button class="btn sm" data-act="goal-new" data-owner="${owner}">${ico('plus')}Objectif</button></div>
      ${rs.length ? `<div class="grid" style="gap:18px">${rs.map(({ g, p }) => `<div>
        <div style="display:flex;justify-content:space-between;gap:10px;align-items:baseline;flex-wrap:wrap"><button class="btn ghost" style="padding:0;min-height:0;font-weight:600;font-size:15px" data-act="goal-edit" data-id="${esc(g.id)}">${esc(g.name)}</button>${g.demo ? '<span class="pill demo">Démo</span>' : ''}<span class="grow"></span><span style="font-family:var(--f-num);font-size:24px" class="tn">${M(p.balance)}</span></div>
        <div style="margin:8px 0 6px">${progress(p.pctBps, p.reached ? 'ok' : '')}</div>
        <div class="small muted tn" style="display:flex;gap:4px 14px;flex-wrap:wrap"><span>${K.formatBps(p.pctBps, 0)} de ${M(g.targetCents, { noCents: true })}</span><span>Reste ${M(p.remaining)}</span>${g.targetDate ? `<span>Cible ${esc(fmtD(g.targetDate))}</span>` : ''}${p.perMonthNeeded ? `<span>≈ ${M(p.perMonthNeeded, { noCents: true })}/mois pour y arriver</span>` : ''}${p.reached ? '<span class="pos">Objectif atteint</span>' : ''}</div>
        <div class="toolbar" style="margin-top:10px"><button class="btn sm" data-act="add" data-type="savings" data-goal="${esc(g.id)}" data-dir="deposit">${ico('plus')}Ajouter</button><button class="btn sm" data-act="add" data-type="savings" data-goal="${esc(g.id)}" data-dir="withdraw">Retirer</button></div></div>`).join('')}</div>`
      : emptyState('Aucun objectif', 'Créez un compte ou un objectif d’épargne.')}</div>`;
  };
  return `<div class="grid g4 kpis">
      <div class="card kpi"><div class="k-l">Épargne totale</div><div class="k-v">${M(total, { noCents: true })}</div><div class="k-s">Tous les comptes d’épargne</div></div>
      <div class="card kpi"><div class="k-l">Épargné ce mois-ci</div><div class="k-v">${M(mt.savings, { noCents: true })}</div><div class="k-s">Dépôts − retraits</div></div>
      <div class="card kpi"><div class="k-l">Rythme moyen</div><div class="k-v">${M(pace, { noCents: true })}</div><div class="k-s">Par mois, 3 derniers mois complets</div></div>
      <div class="card kpi"><div class="k-l">Dans 12 mois à ce rythme</div><div class="k-v">${M(total + pace * 12, { noCents: true })}</div><div class="k-s">Solde actuel + 12 × rythme moyen</div></div></div>
    <div class="banner info"><div class="grow">Déposer dans l’épargne ou retirer n’est jamais compté comme une dépense ni comme un revenu : l’argent change seulement de compte.</div></div>
    ${section('commun')}<div class="grid g2">${section('khalil')}${section('yousra')}</div>`;
};

/* ---------- 8. Dettes ---------- */
const DEBT_KINDS = { credit_card: 'Carte de crédit', car_loan: 'Prêt automobile', personal_loan: 'Prêt personnel', mortgage: 'Hypothèque', other: 'Autre dette' };
VIEWS.dettes = function (t) {
  const rows = S.debts.map(d => { const bal = K.debtBalance(d, S.tx); return { d, bal, plan: K.debtPayoff(bal, d.aprBps || 0, d.plannedPaymentCents || d.minPaymentCents, t), min: K.debtPayoff(bal, d.aprBps || 0, d.minPaymentCents, t) }; });
  const total = rows.reduce((s, r) => s + r.bal, 0);
  const monthly = rows.reduce((s, r) => s + (r.d.plannedPaymentCents || r.d.minPaymentCents || 0), 0);
  const interestMonth = rows.reduce((s, r) => s + K.divRound(r.bal * (r.d.aprBps || 0), 120000), 0);
  return `<div class="toolbar"><div class="grow"></div><button class="btn pri" data-act="debt-new">${ico('plus')}Dette</button></div>
    <div class="grid g4 kpis">
      <div class="card kpi"><div class="k-l">Dettes totales (estimé)</div><div class="k-v">${M(total, { noCents: true })}</div><div class="k-s">${rows.length} dette${rows.length > 1 ? 's' : ''}</div></div>
      <div class="card kpi"><div class="k-l">Paiements prévus / mois</div><div class="k-v">${M(monthly, { noCents: true })}</div><div class="k-s">Selon vos paiements prévus</div></div>
      <div class="card kpi"><div class="k-l">Intérêts ce mois-ci</div><div class="k-v">${M(interestMonth, { noCents: true })}</div><div class="k-s">Solde × taux annuel ÷ 12</div></div>
      <div class="card kpi"><div class="k-l">Libre de dettes</div><div class="k-v" style="font-size:24px">${rows.length && rows.every(r => r.plan) ? esc(fmtMonth(rows.map(r => r.plan.date).sort().pop())) : rows.length ? '—' : 'Aucune dette'}</div><div class="k-s">${rows.some(r => !r.plan) ? 'Un paiement ne couvre pas les intérêts' : 'Avec les paiements prévus'}</div></div></div>
    ${rows.length ? `<div class="grid g2">${rows.map(({ d, bal, plan, min }) => { const orig = d.originalCents || d.balanceCents; const paidPct = orig ? K.ratioBps(orig - bal, orig) : null; return `<div class="card">
      <div class="card-h"><div class="ico">${ico('debt')}</div><div class="grow"><h2>${esc(d.name)} ${d.demo ? '<span class="pill demo">Démo</span>' : ''}</h2><div class="small muted">${esc(DEBT_KINDS[d.kind] || 'Dette')} · ${PEOPLE[d.person] || 'Commun'}</div></div><button class="btn sm" data-act="debt-edit" data-id="${esc(d.id)}">${ico('edit')}Modifier</button></div>
      <div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px"><span class="muted small">Solde restant estimé</span><span style="font-family:var(--f-num);font-size:30px" class="tn">${M(bal)}</span></div>
      <div style="margin:8px 0 6px">${progress(paidPct, 'ok')}</div><div class="small muted tn">${K.formatBps(paidPct, 0)} remboursé sur ${M(orig, { noCents: true })}</div>
      <div class="table-wrap" style="margin-top:12px"><table><tbody>
        <tr><td>Taux d’intérêt annuel</td><td>${K.formatBps(d.aprBps, 2)}</td></tr>
        <tr><td>Paiement minimum</td><td>${M(d.minPaymentCents)}</td></tr>
        <tr><td>Paiement prévu</td><td>${M(d.plannedPaymentCents || d.minPaymentCents)}</td></tr>
        <tr><td>Date de paiement</td><td>${d.paymentDay ? 'Le ' + d.paymentDay + ' du mois' : '—'}</td></tr>
        <tr><td>Remboursé (paiement prévu)</td><td>${plan ? esc(fmtMonth(plan.date)) + ' · ' + plan.months + ' mois' : '<span class="neg">Paiement insuffisant</span>'}</td></tr>
        <tr><td>Intérêts restants (prévu)</td><td>${plan ? M(plan.totalInterest) : '—'}</td></tr>
        <tr><td>Au paiement minimum</td><td>${min ? esc(fmtMonth(min.date)) + ' · ' + M(min.totalInterest) + ' d’intérêts' : '<span class="neg">Ne couvre pas les intérêts</span>'}</td></tr>
      </tbody></table></div>
      <div class="toolbar" style="margin-top:12px"><button class="btn sm" data-act="debt-pay" data-id="${esc(d.id)}">${ico('plus')}Enregistrer un paiement</button><span class="small muted">Solde déclaré le ${esc(fmtD(d.asOfDate))}</span></div></div>`; }).join('')}</div>`
      : `<div class="card">${emptyState('Aucune dette suivie', 'Cartes de crédit, prêt auto, prêt personnel, hypothèque…', `<button class="btn pri" data-act="debt-new">${ico('plus')}Ajouter une dette</button>`)}</div>`}
    <p class="small muted">Le solde estimé = solde déclaré − paiements enregistrés depuis (les intérêts sont inclus dans les paiements). Mettez à jour le solde avec votre relevé pour rester exact.</p>`;
};

/* ---------- 9. Calendrier ---------- */
function calItems(from, to, t) {
  const items = [];
  K.matchPays(K.expectedPays(S.sources, from, to), S.tx, t).forEach(p => items.push({ date: p.date, cls: pcls(p.person), title: 'Paie ' + PEOPLE[p.person], amount: p.amountCents, kind: 'pay', status: p.status, sourceId: p.sourceId }));
  K.recurringOccurrences(S.recurring, S.tx, from, to).forEach(o => items.push({ date: o.date, cls: 'bill' + (o.paid ? ' paid' : ''), title: o.description || catName(o.categoryId), amount: o.amountCents, kind: o.kind === 'savings' ? 'save' : 'bill', ruleId: o.ruleId, paid: o.paid }));
  S.events.forEach(e => {
    const f = e.frequency && e.frequency !== 'occasional' ? e.frequency : null;
    const ds = f ? K.occurrences({ frequency: f, startDate: e.date }, from, to) : (e.date >= from && e.date <= to ? [e.date] : []);
    ds.forEach(d => items.push({ date: d, cls: 'custom', title: e.title, amount: e.amountCents || null, kind: 'event', eventId: e.id }));
  });
  debtDates(from, to).forEach(d => items.push(Object.assign({ cls: 'bill' }, d)));
  return items;
}
VIEWS.calendrier = function (t) {
  const m = UI.calMonth || K.ym(t), r = K.monthRange(m);
  const first = dDate(r.from).getUTCDay(); // 0 = dimanche
  const gridFrom = K.addDays(r.from, -first);
  const items = calItems(gridFrom, K.addDays(gridFrom, 41), t);
  const by = {}; items.forEach(i => (by[i.date] = by[i.date] || []).push(i));
  const sel = UI.calSel || t;
  let cells = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'].map(d => `<div class="h">${d}</div>`).join('');
  for (let i = 0; i < 42; i++) {
    const d = K.addDays(gridFrom, i); const its = by[d] || [];
    if (i >= 35 && d > r.to) break;
    cells += `<div class="c ${d.slice(0, 7) !== m ? 'out' : ''} ${d === t ? 'today' : ''} ${d === sel ? 'sel' : ''}" data-act="cal-day" data-d="${d}" tabindex="0" role="button" aria-label="${esc(fmtD(d, 'long'))}"><span class="n">${+d.slice(8)}</span>
      ${its.slice(0, 3).map(x => `<span class="ev ${x.cls}">${esc(x.title)}</span>`).join('')}${its.length > 3 ? `<span class="small muted">+${its.length - 3}</span>` : ''}
      <span class="cal-dots">${its.slice(0, 4).map(x => `<i class="dot" style="background:var(${x.cls.startsWith('k') ? '--khalil' : x.cls.startsWith('y') ? '--yousra' : x.cls.startsWith('custom') ? '--accent' : '--warn'})"></i>`).join('')}</span></div>`;
  }
  const dayItems = (by[sel] || []);
  const up = upcoming(t, 30);
  const itemRow = x => `<div class="row"><span class="dot" style="background:var(${x.cls && x.cls.startsWith('k') ? '--khalil' : x.cls && x.cls.startsWith('y') ? '--yousra' : x.kind === 'event' ? '--accent' : '--warn'})"></span><div class="grow"><div class="t">${esc(x.title)}</div><div class="s">${x.kind === 'pay' ? 'Paie' : x.kind === 'event' ? 'Événement' : x.kind === 'debt' ? 'Paiement de dette' : x.kind === 'save' ? 'Épargne prévue' : 'Facture récurrente'}${x.paid ? ' · payée' : ''}${x.status === 'received' ? ' · reçue' : ''}</div></div><div class="amt">${x.amount ? M(x.amount) : ''}</div>
    ${x.eventId ? `<button class="btn sm ghost" data-act="event-edit" data-id="${esc(x.eventId)}" aria-label="Modifier">${ico('edit')}</button>` : x.ruleId ? `<button class="btn sm ghost" data-act="recurring-edit" data-id="${esc(x.ruleId)}" aria-label="Modifier">${ico('edit')}</button>` : x.sourceId ? `<button class="btn sm ghost" data-act="source-edit" data-id="${esc(x.sourceId)}" aria-label="Modifier">${ico('edit')}</button>` : ''}</div>`;
  return `<div class="grid g-side"><div class="card"><div class="card-h">${monthPicker('cal-shift', m)}<div class="grow"></div><button class="btn sm" data-act="cal-today">Aujourd’hui</button></div>
      <div class="cal">${cells}</div>
      <div class="legend" style="margin-top:12px"><span><i class="dot" style="background:var(--khalil)"></i>Paie Khalil</span><span><i class="dot" style="background:var(--yousra)"></i>Paie Yousra</span><span><i class="dot" style="background:var(--warn)"></i>Factures, loyer, auto, assurances, abonnements</span><span><i class="dot" style="background:var(--accent)"></i>Événements</span></div></div>
    <div class="grid" style="align-content:start"><div class="card"><div class="card-h"><h2 class="grow">${esc(cap(fmtD(sel, 'long')))}</h2><button class="btn sm" data-act="event-new" data-d="${sel}">${ico('plus')}Événement</button></div><div class="list">${dayItems.length ? dayItems.map(itemRow).join('') : emptyState('Rien ce jour-là', '')}</div></div>
      <div class="card"><div class="card-h"><h2 class="grow">À payer · 30 prochains jours</h2></div><div class="list">${up.filter(u => u.kind !== 'pay').length ? up.filter(u => u.kind !== 'pay').slice(0, 12).map(upRow).join('') : emptyState('Aucune facture à venir', '')}</div></div></div></div>`;
};

/* ---------- 10. Analyses + assistant ---------- */
VIEWS.analyses = function (t) {
  const m = UI.month || K.ym(t), cats = C(), r = K.monthRange(m), mt = K.totals(S.tx, cats, r);
  const isCur = m === K.ym(t);
  const days = isCur ? K.diffDays(r.from, t) + 1 : K.diffDays(r.from, r.to) + 1;
  const grp = {}; Object.entries(mt.byCategory).forEach(([c, v]) => { const g = cats[c] ? cats[c].group : 'autres'; grp[g] = (grp[g] || 0) + v; });
  const gname = gid => (K.GROUPS.find(g => g.id === gid) || { name: 'Personnalisées' }).name;
  const segs = Object.entries(grp).filter(x => x[1] > 0).sort((a, b) => b[1] - a[1]).map(([g, v]) => ({ label: gname(g), v, color: groupColor(g) }));
  const top = Object.entries(mt.byCategory).filter(x => x[1] > 0).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const topMax = top.length ? top[0][1] : 1;
  const ser = K.series(S.tx, cats, 'month', t).map(x => ({ ...x, label: fmtMonth(x.key), short: fmtD(x.key, 'mshort').replace('.', ''), rate: x.income ? K.ratioBps(x.savings, x.income) : null }));
  const y12 = ser.reduce((a, x) => ({ income: a.income + x.income, savings: a.savings + x.savings, expenses: a.expenses + x.expenses }), { income: 0, savings: 0, expenses: 0 });
  const a = anchor(); let perPeriod = null;
  if (a) { const cur = K.payPeriodFor(t, a); let s = 0; for (let i = 1; i <= 6; i++) { const p = K.payPeriodByIndex(cur.index - i, a); s += K.totals(S.tx, cats, { from: p.start, to: p.end }).expenses; } perPeriod = K.divRound(s, 6); }
  const cmpRows = ser.slice(-6).reverse();
  return `<div class="toolbar">${monthPicker('month-shift', m)}</div>
    <div class="grid g4 kpis">
      <div class="card kpi"><div class="k-l">Moyenne quotidienne</div><div class="k-v">${M(K.divRound(mt.expenses, days))}</div><div class="k-s">Dépenses ÷ ${days} jour${days > 1 ? 's' : ''}</div></div>
      <div class="card kpi"><div class="k-l">Moyenne par période de paie</div><div class="k-v">${perPeriod === null ? '—' : M(perPeriod, { noCents: true })}</div><div class="k-s">6 dernières périodes de 14 jours</div></div>
      <div class="card kpi"><div class="k-l">Taux d’épargne réel</div><div class="k-v">${K.formatBps(mt.savingsRateBps)}</div><div class="k-s">Ce mois · 12 mois : ${K.formatBps(K.ratioBps(y12.savings, y12.income))}</div></div>
      <div class="card kpi"><div class="k-l">Dépenses communes</div><div class="k-v">${M(mt.shared, { noCents: true })}</div><div class="k-s">Individuelles : ${M(mt.individual, { noCents: true })}</div></div></div>
    <div class="grid g3">
      <div class="card"><div class="card-h"><h2 class="grow">Répartition des dépenses</h2></div>${donut(segs, ['Total', M(mt.expenses, { noCents: true })])}
        <div class="list" style="margin-top:10px">${segs.map(s => `<div class="row" style="padding:7px 0"><i class="dot" style="background:${s.color}"></i><div class="grow small">${esc(s.label)}</div><span class="small muted tn">${K.formatBps(K.ratioBps(s.v, mt.expenses), 0)}</span><span class="amt small">${M(s.v, { noCents: true })}</span></div>`).join('') || emptyState('Aucune dépense', '')}</div></div>
      <div class="card"><div class="card-h"><h2 class="grow">Catégories les plus coûteuses</h2></div>${top.length ? `<div class="grid" style="gap:11px">${top.map(([c, v]) => `<div><div style="display:flex;justify-content:space-between" class="small"><span>${esc(catName(c))}</span><span class="tn" style="font-weight:600">${M(v)}</span></div><div class="bar" style="margin-top:5px;height:6px"><i style="width:${v / topMax * 100}%;background:${groupColor(cats[c] ? cats[c].group : '')}"></i></div></div>`).join('')}</div>` : emptyState('Aucune dépense', '')}</div>
      <div class="card"><div class="card-h"><h2 class="grow">Dépenses par personne</h2></div>
        ${['khalil', 'yousra'].map(p => `<div style="margin-bottom:14px"><div style="display:flex;justify-content:space-between"><span class="pill ${pcls(p)}">${PEOPLE[p]}</span><span class="tn" style="font-weight:600">${M(mt.byPerson[p].expenses)}</span></div><div class="bar" style="margin-top:8px"><i style="width:${mt.expenses ? mt.byPerson[p].expenses / mt.expenses * 100 : 0}%;background:var(--${p})"></i></div><div class="small muted" style="margin-top:4px">Revenus ${M(mt.byPerson[p].income, { noCents: true })} · épargne ${M(mt.byPerson[p].savings, { noCents: true })}</div></div>`).join('')}
        <div class="small muted">Communes ${M(mt.shared)} · individuelles ${M(mt.individual)}</div></div></div>
    <div class="grid g2">
      <div class="card"><div class="card-h"><h2 class="grow">Évolution des revenus et des économies</h2></div>${lineChart(ser, [{ key: 'income', label: 'Revenus', color: '--c-income', area: true }, { key: 'savings', label: 'Économies', color: '--c-sav' }], { aria: 'Évolution sur 12 mois' })}
        <div class="legend"><span><i class="dot" style="background:var(--c-income)"></i>Revenus</span><span><i class="dot" style="background:var(--c-sav)"></i>Économies</span></div></div>
      <div class="card"><div class="card-h"><h2 class="grow">Comparaison mensuelle</h2></div><div class="table-wrap"><table><thead><tr><th>Mois</th><th>Revenus</th><th>Dépenses</th><th>Épargne</th><th>Taux</th></tr></thead><tbody>${cmpRows.map(x => `<tr><td>${esc(x.label)}</td><td>${M(x.income, { noCents: true })}</td><td>${M(x.expenses, { noCents: true })}</td><td>${M(x.savings, { noCents: true })}</td><td>${K.formatBps(x.rate, 0)}</td></tr>`).join('')}</tbody></table></div></div></div>
    ${assistantCard()}`;
};
function assistantCard() {
  const qs = ['Combien avons-nous dépensé en restaurants ce mois-ci ?', 'Combien pouvons-nous économiser chaque mois ?', 'Quelle catégorie coûte le plus cher ?', 'Combien aurons-nous économisé dans 12 mois si nous conservons ce rythme ?'];
  const A = UI.answer;
  return `<div class="card" id="assistant"><div class="card-h"><div class="ico sv">${ico('spark')}</div><h2 class="grow">Assistant financier</h2><span class="small muted">Répond uniquement avec vos données enregistrées</span></div>
    <div class="chips" style="margin-bottom:12px">${qs.map((q, i) => `<button class="chip" data-act="ask-local" data-i="${i}">${esc(q)}</button>`).join('')}</div>
    <form class="ask" id="ask-form" ${sampleFn ? '' : 'hidden'}><input class="inp" id="ask-q" placeholder="Posez votre question : « Combien pour l’épicerie depuis septembre ? »" autocomplete="off"><button class="btn pri" type="submit">Demander</button></form>
    ${A ? `<div class="answer ${A.loading ? 'loading' : ''}" style="margin-top:12px" id="answer">${esc(A.text)}</div>` : ''}</div>`;
}

/* ---------- 11. Prévisions ---------- */
function scenarios() { const s = S.settings.scenarios || {}; const out = {}; Object.keys(K.DEFAULT_SCENARIOS).forEach(k => out[k] = Object.assign({}, K.DEFAULT_SCENARIOS[k], s[k] || {})); return out; }
VIEWS.previsions = function (t) {
  const sc = scenarios(), D = DATA();
  const ov = S.settings.variableMonthlyCents;
  const opts = { variableMonthlyCents: ov === undefined ? null : ov };
  const all = Object.fromEntries(Object.keys(sc).map(k => [k, K.forecast(D, t, sc[k], opts)]));
  const f = all[UI.scenario];
  const rows = f.rows.map(r => ({ ...r, label: fmtMonth(r.month), short: fmtD(r.month, 'mshort').replace('.', '') }));
  const cur = sc[UI.scenario];
  return `<div class="toolbar"><div class="seg">${Object.entries(sc).map(([k, v]) => `<button class="${UI.scenario === k ? 'on' : ''}" data-act="scenario" data-v="${k}">${esc(v.label)}</button>`).join('')}</div><div class="grow"></div><span class="small muted">Du ${esc(fmtD(f.from))} au ${esc(fmtD(f.to))}</span></div>
    ${f.incomplete ? `<div class="banner">${ico('alert')}<div class="grow">Prévision incomplète : ${!S.sources.length ? 'aucune source de revenu récurrente' : 'pas assez d’historique de dépenses variables'}. Complétez les données ou entrez une hypothèse de dépenses variables ci-dessous.</div></div>` : ''}
    <div class="grid g4 kpis">
      <div class="card kpi"><div class="k-l">Revenus annuels prévus</div><div class="k-v">${M(f.annual.income, { noCents: true })}</div><div class="k-s">Selon les vraies dates de paie</div></div>
      <div class="card kpi"><div class="k-l">Dépenses annuelles prévues</div><div class="k-v">${M(f.annual.expenses, { noCents: true })}</div><div class="k-s">Récurrentes + variables</div></div>
      <div class="card kpi"><div class="k-l">Économies annuelles estimées</div><div class="k-v ${f.annual.net < 0 ? 'neg' : ''}">${M(f.annual.net, { noCents: true })}</div><div class="k-s">Capacité d’épargne · ${M(K.divRound(f.annual.net, 12), { noCents: true })}/mois</div></div>
      <div class="card kpi"><div class="k-l">Solde prévisionnel</div><div class="k-v">${f.endBalance === null ? '<span class="muted">—</span>' : M(f.endBalance, { noCents: true })}</div><div class="k-s">${f.endBalance === null ? 'Solde de départ requis' : 'Comptes + épargne dans 12 mois'}</div></div></div>
    <div class="grid g-side"><div class="card"><div class="card-h"><h2 class="grow">Surplus cumulé · trois scénarios</h2></div>
      ${lineChart(rows.map((r, i) => ({ label: r.label, short: r.short, prudent: all.prudent.rows[i] ? all.prudent.rows[i].cumulative : null, realiste: all.realiste.rows[i] ? all.realiste.rows[i].cumulative : null, optimiste: all.optimiste.rows[i] ? all.optimiste.rows[i].cumulative : null })), [{ key: 'prudent', label: 'Prudent', color: '--c-exp', dash: true }, { key: 'realiste', label: 'Réaliste', color: '--c-income', area: true }, { key: 'optimiste', label: 'Optimiste', color: '--c-sav', dash: true }], { aria: 'Surplus cumulé' })}
      <div class="legend"><span><i class="dot" style="background:var(--c-exp)"></i>Prudent ${M(all.prudent.annual.net, { noCents: true })}</span><span><i class="dot" style="background:var(--c-income)"></i>Réaliste ${M(all.realiste.annual.net, { noCents: true })}</span><span><i class="dot" style="background:var(--c-sav)"></i>Optimiste ${M(all.optimiste.annual.net, { noCents: true })}</span></div></div>
    <div class="card"><div class="card-h"><h2 class="grow">Hypothèses · ${esc(cur.label)}</h2></div>
      <form id="assume-form" class="grid" style="gap:12px">
        <div class="field"><label for="as-inc">Variation des revenus (%)</label><input class="inp" id="as-inc" inputmode="decimal" value="${esc(fixedStr(cur.incomeAdjBps, 2))}"></div>
        <div class="field"><label for="as-exp">Variation des dépenses (%)</label><input class="inp" id="as-exp" inputmode="decimal" value="${esc(fixedStr(cur.expenseAdjBps, 2))}"></div>
        <div class="field"><label for="as-var">Dépenses variables par mois ($)</label><input class="inp" id="as-var" inputmode="decimal" placeholder="Automatique : ${f.variable.cents === null ? 'pas d’historique' : esc(M(all.realiste.variable.cents))}" value="${ov === undefined ? '' : esc(centsStr(ov))}"><div class="hint">Vide = moyenne des 3 derniers mois (hors récurrentes). Commun aux 3 scénarios.</div></div>
        <div class="toolbar"><button class="btn pri" type="submit">Appliquer</button><button class="btn ghost" type="button" data-act="assume-reset">Valeurs par défaut</button></div></form>
      <div style="margin-top:16px"><div class="lbl" style="margin-bottom:8px">Objectifs d’épargne</div>${f.goals.length ? `<div class="small">Reste à épargner : <b class="tn">${M(f.remainingGoals)}</b>. Le surplus prévu en couvre <b>${K.formatBps(f.goalsCoveredBps, 0)}</b>.</div><div style="margin-top:8px">${progress(f.goalsCoveredBps, f.goalsCoveredBps >= 10000 ? 'ok' : '')}</div>` : '<div class="small muted">Aucun objectif.</div>'}</div></div></div>
    <div class="card"><div class="card-h"><h2 class="grow">Détail mensuel · ${esc(cur.label)}</h2></div><div class="table-wrap"><table><thead><tr><th>Mois</th><th>Revenus</th><th>Récurrentes</th><th>Variables</th><th>Dépenses</th><th>Surplus</th><th>Cumulé</th><th>Solde prévu</th></tr></thead>
      <tbody>${rows.map(r => `<tr><td>${esc(r.label)}${r.partial ? ' <span class="muted small">(partiel)</span>' : ''}</td><td>${M(r.income, { noCents: true })}</td><td>${M(r.recurringExpenses, { noCents: true })}</td><td>${M(r.variableExpenses, { noCents: true })}</td><td>${M(r.expenses, { noCents: true })}</td><td class="${r.net < 0 ? 'neg' : ''}">${M(r.net, { noCents: true })}</td><td>${M(r.cumulative, { noCents: true })}</td><td>${r.balance === null ? '—' : M(r.balance, { noCents: true })}</td></tr>`).join('')}</tbody>
      <tfoot><tr><td>Total 12 mois</td><td>${M(f.annual.income, { noCents: true })}</td><td></td><td></td><td>${M(f.annual.expenses, { noCents: true })}</td><td>${M(f.annual.net, { noCents: true })}</td><td></td><td></td></tr></tfoot></table></div>
      <p class="small muted" style="margin:10px 0 0">« Récurrentes » et « Variables » sont avant l’ajustement du scénario ; « Dépenses » l’inclut. L’épargne planifiée fait partie du surplus.</p></div>`;
};
afterRender.previsions = function () {
  $('#assume-form').addEventListener('submit', e => {
    e.preventDefault();
    const inc = parseFixed($('#as-inc').value || '0', 2), exp = parseFixed($('#as-exp').value || '0', 2);
    const vRaw = $('#as-var').value.trim(); const v = vRaw ? K.parseMoney(vRaw) : null;
    if (inc === null || exp === null || (vRaw && (v === null || v < 0))) { toast('Vérifiez les hypothèses : nombres seulement (ex. -5 ou 2,5).'); return; }
    const sc = Object.assign({}, S.settings.scenarios || {}); sc[UI.scenario] = { incomeAdjBps: inc, expenseAdjBps: exp };
    saveSettings({ scenarios: sc, variableMonthlyCents: vRaw ? v : null }).then(() => toast('Hypothèses enregistrées'));
  });
};

/* ---------- 12. Paramètres ---------- */
VIEWS.parametres = function (t) {
  const s = S.settings, tax = s.taxes || K.TAX_DEFAULTS;
  const custom = S.categories;
  return `<div class="grid g2">
    <div class="card"><div class="card-h"><h2 class="grow">Paies et solde</h2></div>
      <form id="set-form" class="grid" style="gap:14px">
        <div class="field"><label for="set-anchor">Date de paie de référence (aux deux semaines)</label><input class="inp" type="date" id="set-anchor" value="${esc(s.anchorDate || '')}"><div class="hint">N’importe quel jour de paie, passé ou futur. Chaque période de paie dure exactement 14 jours à partir de cette date.${!s.anchorDate && anchor() ? ' Actuellement déduite de la source de revenu : ' + esc(fmtD(anchor())) + '.' : ''}</div></div>
        <div class="fgrid"><div class="field"><label for="set-open">Solde de départ des comptes courants</label><input class="inp" id="set-open" inputmode="decimal" placeholder="Ex. 4 200,00" value="${esc(centsStr(s.openingBalanceCents))}"></div>
        <div class="field"><label for="set-open-d">En date du</label><input class="inp" type="date" id="set-open-d" value="${esc(s.openingBalanceDate || '')}"></div></div>
        <div class="hint" style="margin-top:-8px;font-size:12px;color:var(--ink-3)">Les transactions après cette date ajustent le solde. Sans ces deux champs, le solde n’est jamais présenté comme certain.</div>
        <div class="field"><label for="set-psav">Épargne prévue par période (en plus des virements récurrents)</label><input class="inp" id="set-psav" inputmode="decimal" placeholder="0,00" value="${esc(centsStr(s.plannedSavingsPerPeriodCents))}"></div>
        <div class="fgrid"><div class="field"><label for="set-tps">TPS (%)</label><input class="inp" id="set-tps" inputmode="decimal" value="${esc(fixedStr(tax.tpsMilli, 3))}"></div><div class="field"><label for="set-tvq">TVQ (%)</label><input class="inp" id="set-tvq" inputmode="decimal" value="${esc(fixedStr(tax.tvqMilli, 3))}"></div></div>
        <div><button class="btn pri" type="submit">Enregistrer</button></div></form></div>
    <div class="grid" style="align-content:start">
      <div class="card"><div class="card-h"><h2 class="grow">Profils et accès</h2></div>
        <p class="small" style="margin:0 0 10px">Khalil et Yousra partagent les mêmes données. Le profil choisi (« Je suis ») sert de payeur par défaut dans les formulaires.</p>
        <p class="small muted" style="margin:0">${S.mode === 'local' ? 'Les données sont enregistrées uniquement sur cet appareil, dans ce navigateur. Une autre personne qui ouvre le lien voit une application vide : vos montants ne quittent jamais votre téléphone. Pour avoir les mêmes données sur l’autre téléphone, utilisez Sauvegarder puis Restaurer.' : 'Les données sont privées : seul le propriétaire du compte Claude qui a créé l’application peut les lire et les modifier. Partager le lien ne donne accès à aucun montant.'}</p>
        <div class="toolbar" style="margin-top:12px"><span class="pill ${S.canWrite ? 'ok' : 'near'}">${S.canWrite ? 'Modification autorisée' : 'Lecture seule'}</span><span class="pill">${S.mode === 'local' ? 'Stockage sur cet appareil' : S.mode === 'live' ? 'Base de données connectée' : S.mode === 'memory' ? 'Aperçu sans enregistrement' : 'Connexion…'}</span></div></div>
      ${S.mode === 'local' ? `<div class="card"><div class="card-h"><h2 class="grow">Sauvegarde et synchronisation</h2></div>
        <p class="small" style="margin:0 0 12px">« Sauvegarder » crée un fichier avec toutes vos données. Envoyez-le à l’autre téléphone (AirDrop, courriel, iMessage), puis « Restaurer » sur cet appareil-là. Gardez aussi une copie dans iCloud ou Google Drive.</p>
        <div class="toolbar"><button class="btn pri" data-act="backup-export">${ico('download')}Sauvegarder</button><label class="btn" for="backup-file">${ico('upload')}Restaurer</label><input type="file" id="backup-file" accept=".json,application/json" hidden></div>
        <div class="small muted" style="margin-top:10px">${S.settings.lastBackup ? 'Dernière sauvegarde : ' + esc(fmtD(S.settings.lastBackup)) : 'Aucune sauvegarde pour l’instant.'}</div></div>` : ''}
      <div class="card"><div class="card-h"><h2 class="grow">Région</h2></div><div class="table-wrap"><table><tbody><tr><td>Devise</td><td>Dollar canadien (CAD)</td></tr><tr><td>Langue</td><td>Français (Canada)</td></tr><tr><td>Fuseau horaire</td><td>America/Toronto (Montréal)</td></tr><tr><td>Format des dates</td><td>AAAA-MM-JJ · ${esc(fmtD(t))}</td></tr><tr><td>Année fiscale</td><td>1er janvier – 31 décembre</td></tr></tbody></table></div></div>
      <div class="card"><div class="card-h"><h2 class="grow">Exports</h2></div>
        <div class="toolbar"><button class="btn" data-act="export-csv">${ico('download')}Transactions (CSV)</button><button class="btn" data-act="export-xlsx">${ico('download')}Classeur Excel</button></div>
        <div class="toolbar" style="margin-top:10px"><select class="inp" id="pdf-month" style="width:auto">${Array.from({ length: 12 }, (_, i) => K.addMonthsYM(K.ym(t), -i)).map(m => `<option value="${m}">${esc(fmtMonth(m))}</option>`).join('')}</select><button class="btn" data-act="export-pdf">${ico('download')}Rapport mensuel PDF</button></div></div>
    </div></div>
    <div class="grid g2">
    <div class="card"><div class="card-h"><h2 class="grow">Catégories personnalisées</h2><button class="btn sm" data-act="cat-new">${ico('plus')}Catégorie</button></div>
      <div class="list">${custom.length ? custom.map(c => `<div class="row click" data-act="cat-edit" data-id="${esc(c.id)}" tabindex="0" role="button"><i class="dot" style="background:${groupColor(c.group)}"></i><div class="grow"><div class="t">${esc(c.name)}</div><div class="s">${esc((K.GROUPS.find(g => g.id === c.group) || { name: 'Autres' }).name)}${c.kind === 'savings' ? ' · comptée comme épargne' : c.kind === 'transfer' ? ' · neutre (transfert)' : ''}</div></div></div>`).join('') : emptyState('Aucune catégorie ajoutée', `Les ${K.DEFAULT_CATEGORIES.length} catégories de base sont déjà disponibles.`)}</div>
      <p class="small muted" style="margin:10px 0 0">« Paiement de cartes de crédit » est neutre : les achats faits avec la carte sont déjà comptés comme dépenses. « Épargne » et « Investissements » comptent comme épargne.</p></div>
    <div class="card"><div class="card-h"><h2 class="grow">Données de démonstration</h2></div>
      <p class="small" style="margin:0 0 12px">Les exemples sont marqués « Démo » et se suppriment en un clic, sans toucher à vos vraies données.</p>
      <div class="toolbar"><button class="btn" data-act="demo-load">Charger la démonstration</button><button class="btn danger" data-act="demo-clear">${ico('trash')}Supprimer la démo</button></div>
      <div class="small muted" id="demo-progress" style="margin-top:10px"></div></div></div>`;
};
afterRender.parametres = function () {
  $('#set-form').addEventListener('submit', e => {
    e.preventDefault();
    const a = $('#set-anchor').value, ob = $('#set-open').value.trim(), od = $('#set-open-d').value, ps = $('#set-psav').value.trim();
    const tps = parseFixed($('#set-tps').value, 3), tvq = parseFixed($('#set-tvq').value, 3);
    const obc = ob ? K.parseMoney(ob) : null, psc = ps ? K.parseMoney(ps) : null;
    if (ob && obc === null) return toast('Solde de départ invalide.');
    if ((ob && !od) || (!ob && od)) return toast('Indiquez le solde de départ ET sa date, ou aucun des deux.');
    if (ps && (psc === null || psc < 0)) return toast('Épargne prévue invalide.');
    if (tps === null || tvq === null || tps < 0 || tvq < 0) return toast('Taux de taxe invalides.');
    saveSettings({ anchorDate: a || null, openingBalanceCents: ob ? obc : null, openingBalanceDate: od || null, plannedSavingsPerPeriodCents: psc, taxes: { tpsMilli: tps, tvqMilli: tvq } }).then(() => { UI.periodIdx = null; toast('Paramètres enregistrés'); });
  });
};

/* =============================== MODALES =============================== */
let modalCtx = null;
function openModal(title, body, foot, onSubmit, ctx) {
  modalCtx = Object.assign({ onSubmit }, ctx || {});
  $('#modal-root').innerHTML = `<div class="overlay" data-act="modal-bg"><form class="modal" id="modal-form" role="dialog" aria-modal="true" aria-label="${esc(title)}" novalidate>
    <div class="modal-h"><h3>${esc(title)}</h3><button type="button" class="btn ghost sm" data-act="modal-close" aria-label="Fermer">${ico('x')}</button></div>
    <div class="modal-b" id="modal-b">${body}</div><div class="modal-f">${foot}</div></form></div>`;
  document.body.style.overflow = 'hidden';
  $('#modal-form').addEventListener('submit', e => { e.preventDefault(); modalCtx && modalCtx.onSubmit && modalCtx.onSubmit(); });
  const f = $('#modal-form [autofocus]') || $('#modal-form input:not([type=hidden]),#modal-form select');
  if (f) setTimeout(() => f.focus(), 30);
}
function closeModal() { $('#modal-root').innerHTML = ''; modalCtx = null; document.body.style.overflow = ''; }
const val = id => { const e = $('#' + id); return e ? e.value : ''; };
const checked = id => { const e = $('#' + id); return !!(e && e.checked); };
function errs(map) {
  document.querySelectorAll('#modal-b .err').forEach(e => e.textContent = '');
  Object.entries(map).forEach(([k, v]) => { const e = $('#err-' + k); if (e) e.textContent = v; else toast(v); });
  return Object.keys(map).length === 0;
}
function deleteBtn(act, id) { return `<button type="button" class="btn danger" data-act="${act}" data-id="${esc(id)}">${ico('trash')}Supprimer</button>`; }
const footStd = (extra) => `${extra || ''}<span class="grow"></span><button type="button" class="btn ghost" data-act="modal-close">Annuler</button><button type="submit" class="btn pri" id="m-save">Enregistrer</button>`;
function personChips(sel, id) { return `<div class="chips" id="${id}">${['khalil', 'yousra'].map(p => `<button type="button" class="chip ${pcls(p)} ${sel === p ? 'on' : ''}" data-act="chip" data-group="${id}" data-v="${p}">${PEOPLE[p]}</button>`).join('')}</div>`; }
const chipVal = id => { const e = $('#' + id + ' .chip.on'); return e ? e.dataset.v : null; };
function freqFields(p, r) {
  return `<div class="field"><label for="${p}-freq">Fréquence</label><select class="inp" id="${p}-freq" data-act="freq-change" data-p="${p}">${Object.entries(K.FREQUENCIES).filter(([k]) => r.allowOcc || k !== 'occasional').map(([k, l]) => `<option value="${k}" ${r.frequency === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
    <div class="field" id="${p}-semi" ${r.frequency === 'semimonthly' ? '' : 'hidden'}><label>Jours du mois</label><div style="display:flex;gap:8px"><input class="inp" id="${p}-d1" inputmode="numeric" placeholder="15" value="${esc(r.day1 || 15)}"><input class="inp" id="${p}-d2" inputmode="numeric" placeholder="31 = dernier jour" value="${esc(r.day2 || 31)}"></div><div class="hint">Deux paies par mois à dates fixes (24 par an), différent de « toutes les deux semaines » (26 ou 27 par an).</div></div>`;
}
function readFreq(p) {
  const f = val(p + '-freq'); const o = { frequency: f };
  if (f === 'semimonthly') { o.day1 = Math.min(31, Math.max(1, parseInt(val(p + '-d1'), 10) || 15)); o.day2 = Math.min(31, Math.max(1, parseInt(val(p + '-d2'), 10) || 31)); }
  return o;
}

/* ---------- Transaction ---------- */
function topCats() {
  const since = K.addDays(today(), -90), n = {};
  S.tx.forEach(t => { if (t.type === 'expense' && t.date >= since) n[t.categoryId] = (n[t.categoryId] || 0) + 1; });
  const ids = Object.entries(n).sort((a, b) => b[1] - a[1]).map(x => x[0]);
  ['epicerie', 'restaurants', 'essence', 'cafe', 'pharmacie', 'loisirs'].forEach(c => { if (!ids.includes(c)) ids.push(c); });
  return ids.filter(id => C()[id] && C()[id].kind === 'expense').slice(0, 7);
}
const ACCOUNTS = ['Compte Khalil', 'Compte Yousra', 'Compte commun', 'Carte de crédit', 'Comptant'];
function openTx(opts) {
  opts = opts || {};
  const ex = opts.id ? S.tx.find(x => x.id === opts.id) : null;
  const tx = ex ? Object.assign({}, ex) : Object.assign({ id: uid('t'), type: opts.type || 'expense', date: opts.date || today(), person: S.me, shared: false, status: 'posted', direction: opts.dir || 'deposit', goalId: opts.goal || (S.goals[0] && S.goals[0].id) || '' }, opts.preset || {});
  if (tx.type === 'expense' && !tx.categoryId) tx.categoryId = topCats()[0] || 'epicerie';
  const isRefund = tx.type === 'refund';
  const mainType = isRefund ? 'expense' : tx.type;
  const types = [['expense', 'Dépense'], ['income', 'Revenu'], ['savings', 'Épargne'], ['transfer', 'Transfert']];
  const p = (K.payPeriodFor(tx.date, anchor() || tx.date));
  const body = `${!ex ? `<div class="field"><label for="tx-nl" style="display:flex;gap:6px;align-items:center">${ico('spark')}Écrire en une phrase</label><input class="inp" id="tx-nl" placeholder="Ex. : 45 $ resto avec Yousra hier" autocomplete="off" enterkeyhint="next"><div class="hint">Le formulaire se remplit tout seul. Vérifiez puis Enregistrer.</div></div>` : ''}
    <div class="seg" id="tx-types" style="width:100%">${types.map(([k, l]) => `<button type="button" class="${mainType === k ? 'on' : ''}" style="flex:1" data-act="tx-type" data-v="${k}">${l}</button>`).join('')}</div>
    <div class="field"><label for="tx-amt">Montant ($ CAD)</label><input class="amount-inp" id="tx-amt" inputmode="decimal" autocomplete="off" placeholder="0,00" value="${esc(centsStr(tx.amountCents))}" autofocus><div class="err" id="err-amount"></div>
      <div class="hint" id="tax-hint" ${mainType === 'expense' ? '' : 'hidden'}><label style="display:inline-flex;gap:6px;align-items:center"><input type="checkbox" id="tx-addtax" data-act="tax-toggle">Montant avant taxes : ajouter TPS + TVQ</label> <span id="tax-out"></span></div></div>
    <div id="tx-fields">${txFields(tx)}</div>
    <div class="fgrid"><div class="field"><label>Personne</label>${personChips(tx.person, 'tx-person')}<div class="err" id="err-person"></div></div>
      <div class="field"><label for="tx-date">Date</label><input class="inp" type="date" id="tx-date" value="${esc(tx.date)}" data-act="tx-date"><div class="hint" id="tx-period">${anchor() ? 'Période de paie : ' + esc(fmtD(p.start, 'dm')) + ' – ' + esc(fmtD(p.end, 'dm')) : ''}</div><div class="err" id="err-date"></div></div></div>
    <div class="field"><label for="tx-desc">Description</label><input class="inp" id="tx-desc" value="${esc(tx.description || '')}" placeholder="Ex. IGA, souper, paie…" autocomplete="off"></div>
    <details class="more" ${ex && (ex.notes || ex.method) ? 'open' : ''}><summary>Plus d’options</summary><div class="fgrid">
      <div class="field"><label for="tx-method">Moyen de paiement</label><select class="inp" id="tx-method">${['', 'Carte de crédit', 'Débit', 'Virement', 'Prélèvement', 'Dépôt direct', 'Comptant', 'Interac'].map(m => `<option value="${m}" ${tx.method === m ? 'selected' : ''}>${m || '—'}</option>`).join('')}</select></div>
      <div class="field" id="tx-debt-f" ${mainType === 'expense' || mainType === 'transfer' ? '' : 'hidden'}><label for="tx-debt">Paiement d’une dette</label><select class="inp" id="tx-debt"><option value="">Non</option>${S.debts.map(d => `<option value="${esc(d.id)}" ${tx.debtId === d.id ? 'selected' : ''}>${esc(d.name)}</option>`).join('')}</select></div>
      <div class="field full"><label for="tx-notes">Notes</label><input class="inp" id="tx-notes" value="${esc(tx.notes || '')}"></div>
      ${!ex ? `<div class="field full" id="tx-rec-f" ${mainType === 'income' || mainType === 'transfer' ? 'hidden' : ''}><label style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="tx-rec">Dépense récurrente : répéter automatiquement</label><select class="inp" id="tx-rec-freq">${['monthly', 'biweekly', 'weekly', 'quarterly', 'yearly'].map(k => `<option value="${k}">${K.FREQUENCIES[k]}</option>`).join('')}</select><div class="hint">Les prochaines occurrences seront prévues au calendrier et dans les périodes de paie, sans jamais être enregistrées deux fois.</div></div>` : ''}
    </div></details>
    <div class="banner" id="dup-warn" hidden></div>`;
  let extra = '';
  if (ex) extra = `${deleteBtn('tx-delete', ex.id)}<button type="button" class="btn" data-act="tx-cancel" data-id="${esc(ex.id)}">${ex.status === 'cancelled' ? 'Rétablir' : 'Annuler la transaction'}</button>`;
  openModal(ex ? 'Modifier la transaction' : 'Ajouter une transaction', body, footStd(extra), saveTx, { tx, existing: !!ex, refund: isRefund, dupOk: false });
}
function txFields(tx) {
  const t = tx.type === 'refund' ? 'expense' : tx.type;
  if (t === 'expense') return `<div class="field"><label>Catégorie</label><div class="chips" id="cat-chips">${topCats().map(c => `<button type="button" class="chip ${tx.categoryId === c ? 'on' : ''}" data-act="cat-chip" data-v="${c}">${esc(catName(c))}</button>`).join('')}</div>
      <select class="inp" id="tx-cat" style="margin-top:6px" data-act="cat-select">${catOptions(tx.categoryId)}</select><div class="err" id="err-category"></div><div class="hint" id="cat-hint">${catHint(tx.categoryId)}</div></div>
    <div class="fgrid"><div class="field"><label>Dépense</label><div class="seg"><button type="button" class="${!tx.shared ? 'on' : ''}" data-act="shared" data-v="0">Individuelle</button><button type="button" class="${tx.shared ? 'on' : ''}" data-act="shared" data-v="1">Commune</button></div></div>
    <div class="field"><label>&nbsp;</label><label style="display:flex;gap:8px;align-items:center;min-height:36px"><input type="checkbox" id="tx-refund" ${tx.type === 'refund' ? 'checked' : ''}>C’est un remboursement</label></div></div>`;
  if (t === 'income') {
    const srcs = S.sources.filter(s => s.person === tx.person);
    return `<div class="field"><label for="tx-src">Source de revenu</label><select class="inp" id="tx-src"><option value="">Revenu occasionnel / autre</option>${srcs.map(s => `<option value="${esc(s.id)}" ${tx.sourceId === s.id ? 'selected' : ''}>${esc(s.name)}${s.employer ? ' · ' + esc(s.employer) : ''}</option>`).join('')}</select><div class="hint">Montant NET réellement déposé.</div></div>`;
  }
  if (t === 'savings') return `<div class="fgrid"><div class="field"><label for="tx-goal">Compte d’épargne</label><select class="inp" id="tx-goal">${S.goals.length ? S.goals.map(g => `<option value="${esc(g.id)}" ${tx.goalId === g.id ? 'selected' : ''}>${esc(g.name)} · ${esc(PEOPLE[g.owner || 'commun'])}</option>`).join('') : '<option value="">Créez d’abord un objectif</option>'}</select><div class="err" id="err-goal"></div></div>
    <div class="field"><label>Mouvement</label><div class="seg"><button type="button" class="${tx.direction !== 'withdraw' ? 'on' : ''}" data-act="dir" data-v="deposit">Ajouter</button><button type="button" class="${tx.direction === 'withdraw' ? 'on' : ''}" data-act="dir" data-v="withdraw">Retirer</button></div></div></div>
    <div class="hint" style="font-size:12px;color:var(--ink-3)">Un dépôt d’épargne n’est pas une dépense : aucun double comptage.</div>`;
  return `<div class="fgrid"><div class="field"><label for="tx-from">De</label><select class="inp" id="tx-from">${ACCOUNTS.map(a => `<option ${tx.fromAccount === a ? 'selected' : ''}>${a}</option>`).join('')}</select></div>
    <div class="field"><label for="tx-to">Vers</label><select class="inp" id="tx-to">${ACCOUNTS.map((a, i) => `<option ${(tx.toAccount || ACCOUNTS[1]) === a ? 'selected' : ''}>${a}</option>`).join('')}</select></div></div><div class="err" id="err-accounts"></div>
    <div class="hint" style="font-size:12px;color:var(--ink-3)">Un transfert entre vos comptes n’est ni un revenu ni une dépense.</div>`;
}
function catHint(id) { const c = C()[id]; if (!c) return ''; return c.kind === 'transfer' ? 'Neutre : les achats faits avec la carte sont déjà comptés. Pas compté comme dépense.' : c.kind === 'savings' ? 'Compté comme épargne, pas comme dépense.' : ''; }
function readTxForm() {
  const ctx = modalCtx, tx = Object.assign({}, ctx.tx);
  tx.type = ctx.tx.type;
  let amt = K.parseMoney(val('tx-amt'));
  if (amt !== null && checked('tx-addtax')) amt = K.salesTaxes(amt, S.settings.taxes).total;
  tx.amountCents = amt === null ? NaN : amt;
  tx.person = chipVal('tx-person'); tx.date = val('tx-date'); tx.description = val('tx-desc').trim(); tx.method = val('tx-method'); tx.notes = val('tx-notes').trim();
  if (tx.type === 'expense' || tx.type === 'refund') { tx.categoryId = val('tx-cat'); tx.type = checked('tx-refund') ? 'refund' : 'expense'; tx.shared = !!ctx.tx.shared; }
  if (tx.type === 'income') { tx.sourceId = val('tx-src') || null; }
  if (tx.type === 'savings') { tx.goalId = val('tx-goal'); tx.direction = ctx.tx.direction || 'deposit'; }
  if (tx.type === 'transfer') { tx.fromAccount = val('tx-from'); tx.toAccount = val('tx-to'); }
  const debt = val('tx-debt'); if (debt && (tx.type === 'expense' || tx.type === 'transfer')) tx.debtId = debt; else delete tx.debtId;
  ['sourceId', 'goalId', 'direction', 'categoryId', 'fromAccount', 'toAccount'].forEach(k => { const keep = { sourceId: 'income', goalId: 'savings', direction: 'savings', categoryId: ['expense', 'refund'], fromAccount: 'transfer', toAccount: 'transfer' }[k]; if (!(Array.isArray(keep) ? keep.includes(tx.type) : keep === tx.type)) delete tx[k]; });
  return tx;
}
async function saveTx() {
  const ctx = modalCtx; const tx = readTxForm();
  if (!errs(K.validateTx(tx, C()))) return;
  // Doublon probable ?
  if (!ctx.existing && !ctx.dupOk) {
    const near = S.tx.find(x => x.id !== tx.id && x.status !== 'cancelled' && x.type === tx.type && x.amountCents === tx.amountCents && Math.abs(K.diffDays(x.date, tx.date)) <= (tx.type === 'income' ? 3 : 0) && (tx.type !== 'expense' || x.categoryId === tx.categoryId) && (tx.type !== 'income' || !tx.sourceId || x.sourceId === tx.sourceId));
    if (near) {
      const w = $('#dup-warn'); w.hidden = false; w.innerHTML = `${ico('alert')}<div class="grow">Une transaction identique existe déjà : <b>${esc(txLabel(near))}</b>, ${esc(fmtD(near.date))}, ${M(near.amountCents)}. Enregistrer quand même ?</div>`;
      ctx.dupOk = true; $('#m-save').textContent = 'Enregistrer quand même'; return;
    }
  }
  const btn = $('#m-save'); btn.disabled = true;
  try {
    if (!ctx.existing) tx.createdAt = Date.now();
    tx.updatedAt = Date.now(); tx.updatedBy = S.me;
    if (!ctx.existing && checked('tx-rec') && (tx.type === 'expense' || tx.type === 'savings')) {
      const rule = { id: uid('r'), kind: tx.type === 'savings' ? 'savings' : 'expense', description: tx.description || (tx.type === 'savings' ? goalName(tx.goalId) : catName(tx.categoryId)), amountCents: tx.amountCents, categoryId: tx.categoryId, goalId: tx.goalId, person: tx.person, shared: !!tx.shared, frequency: val('tx-rec-freq'), startDate: tx.date, method: tx.method, debtId: tx.debtId };
      if (rule.frequency === 'monthly') rule.day1 = +tx.date.slice(8, 10);
      await save('recurring', rule);
      const occ = K.txFromOccurrence(rule, tx.date);
      Object.assign(occ, { createdAt: tx.createdAt, notes: tx.notes, debtId: tx.debtId });
      await save('tx', occ);
    } else await save('tx', tx);
    closeModal(); toast(ctx.existing ? 'Transaction modifiée' : 'Transaction ajoutée');
  } catch (e) { btn.disabled = false; }
}

/* ---------- Source de revenu ---------- */
function openSource(id, person, preset) {
  const ex = id ? S.sources.find(s => s.id === id) : null;
  const s = Object.assign(ex ? Object.assign({}, ex) : { id: uid('src'), person: person || S.me, name: 'Salaire', frequency: 'biweekly', active: true, anchorDate: '' }, preset || {});
  const nx = ex && s.frequency !== 'occasional' ? K.nextPayDate(s, today()) : null;
  const body = `<div class="field"><label>Personne</label>${personChips(s.person, 'src-person')}</div>
    <div class="fgrid"><div class="field"><label for="src-name">Source du revenu</label><input class="inp" id="src-name" value="${esc(s.name || '')}" placeholder="Salaire, contrat, allocation…"><div class="err" id="err-name"></div></div>
    <div class="field"><label for="src-emp">Employeur</label><input class="inp" id="src-emp" value="${esc(s.employer || '')}"></div></div>
    <div class="fgrid">${freqFields('src', Object.assign({ allowOcc: true }, s))}</div>
    <div class="fgrid"><div class="field"><label for="src-net">Montant net reçu par paie</label><input class="inp" id="src-net" inputmode="decimal" value="${esc(centsStr(s.netCents))}" placeholder="Ex. 1 800,00"><div class="hint">Ce qui est réellement déposé. Laissez vide si variable.</div><div class="err" id="err-net"></div></div>
    <div class="field"><label for="src-gross">Montant brut (facultatif)</label><input class="inp" id="src-gross" inputmode="decimal" value="${esc(centsStr(s.grossCents))}"><div class="hint">Pour information : le net n’est jamais calculé à partir du brut.</div></div></div>
    <div class="fgrid"><div class="field"><label for="src-anchor">Une date de paie (dernière ou prochaine)</label><input class="inp" type="date" id="src-anchor" value="${esc(s.anchorDate || '')}"><div class="hint">${nx ? 'Prochaine paie : ' + esc(cap(fmtD(nx, 'wdm'))) : 'Sert à calculer toutes les dates de paie.'}</div><div class="err" id="err-anchor"></div></div>
    <div class="field"><label for="src-end">Fin (facultatif)</label><input class="inp" type="date" id="src-end" value="${esc(s.endDate || '')}"></div></div>
    <label class="small" style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="src-active" ${s.active !== false ? 'checked' : ''}>Source active</label>`;
  openModal(ex ? 'Modifier la source de revenu' : 'Nouvelle source de revenu', body, footStd(ex ? deleteBtn('source-delete', ex.id) : ''), async () => {
    const o = Object.assign({}, s, readFreq('src'), { person: chipVal('src-person'), name: val('src-name').trim(), employer: val('src-emp').trim(), anchorDate: val('src-anchor'), endDate: val('src-end') || null, active: checked('src-active') });
    const net = val('src-net').trim(), gross = val('src-gross').trim();
    o.netCents = net ? K.parseMoney(net) : null; o.grossCents = gross ? K.parseMoney(gross) : null;
    const e = {};
    if (!o.name) e.name = 'Nom requis';
    if (net && (o.netCents === null || o.netCents <= 0)) e.net = 'Montant invalide';
    if (gross && (o.grossCents === null || o.grossCents < 0)) e.net = 'Montant brut invalide';
    if (o.frequency !== 'occasional' && !K.isISODate(o.anchorDate)) e.anchor = 'Indiquez une date de paie';
    if (!errs(e)) return;
    if (!o.endDate) delete o.endDate;
    await save('sources', o); closeModal(); toast('Source enregistrée');
  });
}

/* ---------- Règle récurrente ---------- */
function openRecurring(id, preset) {
  const ex = id ? S.recurring.find(r => r.id === id) : null;
  const r = Object.assign(ex ? Object.assign({}, ex) : { id: uid('r'), kind: 'expense', person: S.me, shared: true, frequency: 'monthly', startDate: today(), categoryId: 'loyer' }, preset || {});
  const body = `<div class="seg" style="width:100%"><button type="button" style="flex:1" class="${r.kind !== 'savings' ? 'on' : ''}" data-act="rec-kind" data-v="expense">Dépense</button><button type="button" style="flex:1" class="${r.kind === 'savings' ? 'on' : ''}" data-act="rec-kind" data-v="savings">Épargne automatique</button></div>
    <div class="fgrid"><div class="field"><label for="rec-desc">Description</label><input class="inp" id="rec-desc" value="${esc(r.description || '')}" placeholder="Loyer, Hydro-Québec, Netflix…"></div>
    <div class="field"><label for="rec-amt">Montant</label><input class="inp" id="rec-amt" inputmode="decimal" value="${esc(centsStr(r.amountCents))}"><div class="err" id="err-amt"></div></div></div>
    <div class="field" id="rec-cat-f" ${r.kind === 'savings' ? 'hidden' : ''}><label for="rec-cat">Catégorie</label><select class="inp" id="rec-cat">${catOptions(r.categoryId)}</select></div>
    <div class="field" id="rec-goal-f" ${r.kind === 'savings' ? '' : 'hidden'}><label for="rec-goal">Vers le compte d’épargne</label><select class="inp" id="rec-goal">${S.goals.map(g => `<option value="${esc(g.id)}" ${r.goalId === g.id ? 'selected' : ''}>${esc(g.name)}</option>`).join('')}</select></div>
    <div class="fgrid">${freqFields('rec', r)}</div>
    <div class="fgrid"><div class="field"><label for="rec-start">Première échéance</label><input class="inp" type="date" id="rec-start" value="${esc(r.startDate)}"><div class="hint">Mensuel : même jour chaque mois (31 → dernier jour).</div><div class="err" id="err-start"></div></div>
    <div class="field"><label for="rec-end">Fin (facultatif)</label><input class="inp" type="date" id="rec-end" value="${esc(r.endDate || '')}"></div></div>
    <div class="fgrid"><div class="field"><label>Payée par</label>${personChips(r.person, 'rec-person')}</div>
    <div class="field"><label for="rec-debt">Lié à une dette</label><select class="inp" id="rec-debt"><option value="">Non</option>${S.debts.map(d => `<option value="${esc(d.id)}" ${r.debtId === d.id ? 'selected' : ''}>${esc(d.name)}</option>`).join('')}</select></div></div>
    <label class="small" style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="rec-shared" ${r.shared ? 'checked' : ''}>Dépense commune</label>`;
  openModal(ex ? 'Modifier la récurrence' : 'Nouvelle dépense récurrente', body, footStd(ex ? deleteBtn('recurring-delete', ex.id) : ''), async () => {
    const kind = modalCtx.kind || r.kind || 'expense';
    const o = Object.assign({}, r, readFreq('rec'), { kind, description: val('rec-desc').trim(), amountCents: K.parseMoney(val('rec-amt')), startDate: val('rec-start'), endDate: val('rec-end') || null, person: chipVal('rec-person'), shared: checked('rec-shared'), debtId: val('rec-debt') || null });
    if (kind === 'savings') { o.goalId = val('rec-goal'); delete o.categoryId; } else { o.categoryId = val('rec-cat'); delete o.goalId; }
    if (o.frequency === 'monthly' || o.frequency === 'quarterly' || o.frequency === 'yearly') o.day1 = K.isISODate(o.startDate) ? +o.startDate.slice(8, 10) : undefined;
    const e = {}; if (!o.amountCents || o.amountCents <= 0) e.amt = 'Montant invalide'; if (!K.isISODate(o.startDate)) e.start = 'Date invalide';
    if (kind === 'savings' && !o.goalId) e.amt = 'Créez d’abord un objectif d’épargne';
    if (!errs(e)) return;
    if (!o.endDate) delete o.endDate; if (!o.debtId) delete o.debtId;
    await save('recurring', o); closeModal(); toast('Récurrence enregistrée');
  }, { kind: r.kind || 'expense' });
}

/* ---------- Objectif d'épargne ---------- */
function openGoal(id, owner) {
  const ex = id ? S.goals.find(g => g.id === id) : null;
  const g = ex ? Object.assign({}, ex) : { id: uid('g'), owner: owner || 'commun', name: '', targetCents: null, initialCents: 0 };
  const body = `<div class="field"><label for="g-name">Nom</label><input class="inp" id="g-name" value="${esc(g.name)}" placeholder="Fonds d’urgence, voyage, maison…"><div class="err" id="err-name"></div></div>
    <div class="field"><label>Type d’épargne</label><div class="seg" id="g-owner">${['commun', 'khalil', 'yousra'].map(o => `<button type="button" class="${g.owner === o ? 'on' : ''}" data-act="seg-pick" data-v="${o}">${o === 'commun' ? 'Commune' : 'Personnelle ' + PEOPLE[o]}</button>`).join('')}</div></div>
    <div class="fgrid"><div class="field"><label for="g-target">Objectif</label><input class="inp" id="g-target" inputmode="decimal" value="${esc(centsStr(g.targetCents))}" placeholder="10 000"><div class="err" id="err-target"></div></div>
    <div class="field"><label for="g-date">Date cible (facultatif)</label><input class="inp" type="date" id="g-date" value="${esc(g.targetDate || '')}"></div></div>
    <div class="field"><label for="g-init">Solde déjà épargné au départ</label><input class="inp" id="g-init" inputmode="decimal" value="${esc(centsStr(g.initialCents || 0))}"><div class="hint">Les dépôts et retraits ajoutés ensuite s’y additionnent.</div></div>`;
  openModal(ex ? 'Modifier l’objectif' : 'Nouvel objectif d’épargne', body, footStd(ex ? deleteBtn('goal-delete', ex.id) : ''), async () => {
    const o = Object.assign({}, g, { name: val('g-name').trim(), owner: ($('#g-owner .on') || {}).dataset ? $('#g-owner .on').dataset.v : 'commun', targetCents: K.parseMoney(val('g-target')), targetDate: val('g-date') || null, initialCents: K.parseMoney(val('g-init') || '0') });
    const e = {}; if (!o.name) e.name = 'Nom requis'; if (!o.targetCents || o.targetCents <= 0) e.target = 'Objectif invalide'; if (o.initialCents === null || o.initialCents < 0) e.target = 'Solde de départ invalide';
    if (!errs(e)) return;
    await save('goals', o); closeModal(); toast('Objectif enregistré');
  });
}

/* ---------- Dette ---------- */
function openDebt(id) {
  const ex = id ? S.debts.find(d => d.id === id) : null;
  const d = ex ? Object.assign({}, ex) : { id: uid('d'), kind: 'credit_card', person: S.me, asOfDate: today() };
  const body = `<div class="fgrid"><div class="field"><label for="d-name">Nom</label><input class="inp" id="d-name" value="${esc(d.name || '')}" placeholder="Visa, prêt auto…"><div class="err" id="err-name"></div></div>
    <div class="field"><label for="d-kind">Type</label><select class="inp" id="d-kind">${Object.entries(DEBT_KINDS).map(([k, l]) => `<option value="${k}" ${d.kind === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div></div>
    <div class="fgrid"><div class="field"><label for="d-bal">Solde restant</label><input class="inp" id="d-bal" inputmode="decimal" value="${esc(centsStr(d.balanceCents))}"><div class="err" id="err-bal"></div></div>
    <div class="field"><label for="d-asof">Solde en date du</label><input class="inp" type="date" id="d-asof" value="${esc(d.asOfDate || today())}"></div></div>
    <div class="fgrid"><div class="field"><label for="d-orig">Montant initial (facultatif)</label><input class="inp" id="d-orig" inputmode="decimal" value="${esc(centsStr(d.originalCents))}"><div class="hint">Pour la barre de progression.</div></div>
    <div class="field"><label for="d-apr">Taux d’intérêt annuel (%)</label><input class="inp" id="d-apr" inputmode="decimal" value="${esc(fixedStr(d.aprBps, 2))}" placeholder="20,99"><div class="err" id="err-apr"></div></div></div>
    <div class="fgrid"><div class="field"><label for="d-min">Paiement minimum / mois</label><input class="inp" id="d-min" inputmode="decimal" value="${esc(centsStr(d.minPaymentCents))}"></div>
    <div class="field"><label for="d-plan">Paiement prévu / mois</label><input class="inp" id="d-plan" inputmode="decimal" value="${esc(centsStr(d.plannedPaymentCents))}"></div></div>
    <div class="fgrid"><div class="field"><label for="d-day">Jour de paiement (1-31)</label><input class="inp" id="d-day" inputmode="numeric" value="${esc(d.paymentDay || '')}"></div><div class="field"><label>Responsable</label>${personChips(d.person, 'd-person')}</div></div>`;
  openModal(ex ? 'Modifier la dette' : 'Nouvelle dette', body, footStd(ex ? deleteBtn('debt-delete', ex.id) : ''), async () => {
    const m = id => { const v = val(id).trim(); return v ? K.parseMoney(v) : null; };
    const o = Object.assign({}, d, { name: val('d-name').trim(), kind: val('d-kind'), balanceCents: m('d-bal'), asOfDate: val('d-asof'), originalCents: m('d-orig'), aprBps: parseFixed(val('d-apr') || '0', 2), minPaymentCents: m('d-min'), plannedPaymentCents: m('d-plan'), paymentDay: parseInt(val('d-day'), 10) || null, person: chipVal('d-person') });
    const e = {}; if (!o.name) e.name = 'Nom requis'; if (o.balanceCents === null || o.balanceCents < 0) e.bal = 'Solde invalide'; if (o.aprBps === null || o.aprBps < 0) e.apr = 'Taux invalide';
    if (!K.isISODate(o.asOfDate)) e.bal = 'Date du solde invalide';
    if (!errs(e)) return;
    await save('debts', o); closeModal(); toast('Dette enregistrée');
  });
}

/* ---------- Budget ---------- */
function openBudget(id) {
  const ex = id ? S.budgets.find(b => b.id === id) : null;
  const b = ex ? Object.assign({}, ex) : { id: uid('b'), categoryId: 'epicerie' };
  const body = `<div class="field"><label for="b-cat">Catégorie</label><select class="inp" id="b-cat">${catOptions(b.categoryId, ['expense'])}</select><div class="err" id="err-cat"></div></div>
    <div class="field"><label for="b-lim">Limite par mois</label><input class="inp" id="b-lim" inputmode="decimal" value="${esc(centsStr(b.limitCents))}" placeholder="600" autofocus><div class="err" id="err-lim"></div><div class="hint">Alertes à 70 %, 85 % et 100 %.</div></div>`;
  openModal(ex ? 'Modifier le budget' : 'Nouveau budget', body, footStd(ex ? deleteBtn('budget-delete', ex.id) : ''), async () => {
    const o = Object.assign({}, b, { categoryId: val('b-cat'), limitCents: K.parseMoney(val('b-lim')) });
    const e = {}; if (!o.limitCents || o.limitCents <= 0) e.lim = 'Limite invalide';
    if (S.budgets.some(x => x.id !== o.id && x.categoryId === o.categoryId)) e.cat = 'Un budget existe déjà pour cette catégorie';
    if (!errs(e)) return;
    await save('budgets', o); closeModal(); toast('Budget enregistré');
  });
}

/* ---------- Événement ---------- */
function openEvent(id, date) {
  const ex = id ? S.events.find(e => e.id === id) : null;
  const ev = ex ? Object.assign({}, ex) : { id: uid('e'), date: date || today(), kind: 'bill', frequency: 'occasional' };
  const kinds = { bill: 'Facture', rent: 'Loyer / hypothèque', car: 'Paiement automobile', insurance: 'Assurance', subscription: 'Abonnement', other: 'Autre' };
  const body = `<div class="field"><label for="e-title">Titre</label><input class="inp" id="e-title" value="${esc(ev.title || '')}" autofocus><div class="err" id="err-title"></div></div>
    <div class="fgrid"><div class="field"><label for="e-date">Date</label><input class="inp" type="date" id="e-date" value="${esc(ev.date)}"></div>
    <div class="field"><label for="e-kind">Type</label><select class="inp" id="e-kind">${Object.entries(kinds).map(([k, l]) => `<option value="${k}" ${ev.kind === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div></div>
    <div class="fgrid"><div class="field"><label for="e-amt">Montant (facultatif)</label><input class="inp" id="e-amt" inputmode="decimal" value="${esc(centsStr(ev.amountCents))}"></div>
    <div class="field"><label for="e-freq">Répétition</label><select class="inp" id="e-freq">${['occasional', 'monthly', 'quarterly', 'yearly'].map(k => `<option value="${k}" ${ev.frequency === k ? 'selected' : ''}>${k === 'occasional' ? 'Une seule fois' : K.FREQUENCIES[k]}</option>`).join('')}</select></div></div>
    <div class="field"><label for="e-notes">Notes</label><input class="inp" id="e-notes" value="${esc(ev.notes || '')}"></div>
    <p class="small muted" style="margin:0">Un événement sert de rappel : il n’est pas compté comme dépense. Pour une facture qui revient, préférez une dépense récurrente.</p>`;
  openModal(ex ? 'Modifier l’événement' : 'Nouvel événement', body, footStd(ex ? deleteBtn('event-delete', ex.id) : ''), async () => {
    const a = val('e-amt').trim();
    const o = Object.assign({}, ev, { title: val('e-title').trim(), date: val('e-date'), kind: val('e-kind'), amountCents: a ? K.parseMoney(a) : null, frequency: val('e-freq'), notes: val('e-notes').trim() });
    const e = {}; if (!o.title) e.title = 'Titre requis'; if (!K.isISODate(o.date)) e.title = 'Date invalide'; if (a && o.amountCents === null) e.title = 'Montant invalide';
    if (!errs(e)) return;
    await save('events', o); closeModal(); toast('Événement enregistré');
  });
}

/* ---------- Catégorie personnalisée ---------- */
function openCategory(id) {
  const ex = id ? S.categories.find(c => c.id === id) : null;
  const c = ex ? Object.assign({}, ex) : { id: uid('cat'), group: 'autres', kind: 'expense' };
  const body = `<div class="field"><label for="c-name">Nom</label><input class="inp" id="c-name" value="${esc(c.name || '')}" autofocus><div class="err" id="err-name"></div></div>
    <div class="fgrid"><div class="field"><label for="c-group">Groupe</label><select class="inp" id="c-group">${K.GROUPS.map(g => `<option value="${g.id}" ${c.group === g.id ? 'selected' : ''}>${esc(g.name)}</option>`).join('')}</select></div>
    <div class="field"><label for="c-kind">Comptée comme</label><select class="inp" id="c-kind"><option value="expense" ${c.kind === 'expense' ? 'selected' : ''}>Dépense</option><option value="savings" ${c.kind === 'savings' ? 'selected' : ''}>Épargne</option><option value="transfer" ${c.kind === 'transfer' ? 'selected' : ''}>Neutre (transfert)</option></select></div></div>`;
  const used = ex && S.tx.some(t => t.categoryId === ex.id);
  openModal(ex ? 'Modifier la catégorie' : 'Nouvelle catégorie', body, footStd(ex && !used ? deleteBtn('cat-delete', ex.id) : ex ? '<span class="small muted">Utilisée par des transactions : suppression impossible.</span>' : ''), async () => {
    const o = Object.assign({}, c, { name: val('c-name').trim(), group: val('c-group'), kind: val('c-kind') });
    if (!errs(o.name ? {} : { name: 'Nom requis' })) return;
    o.groupName = (K.GROUPS.find(g => g.id === o.group) || {}).name;
    await save('categories', o); closeModal(); toast('Catégorie enregistrée');
  });
}

/* ============================== Actions ============================== */
async function markOccurrence(ruleId, date) {
  const rule = S.recurring.find(r => r.id === ruleId); if (!rule) return;
  const tx = K.txFromOccurrence(rule, date);
  if (S.tx.some(x => x.id === tx.id && x.status !== 'cancelled')) { toast('Déjà enregistrée'); return; }
  tx.createdAt = Date.now(); tx.updatedBy = S.me;
  if (rule.debtId) tx.debtId = rule.debtId;
  await save('tx', tx); toast((rule.kind === 'savings' ? 'Épargne enregistrée : ' : 'Payée : ') + (rule.description || catName(rule.categoryId)));
}
function recordPay(srcId, date) {
  const s = S.sources.find(x => x.id === srcId); if (!s) return;
  openTx({ type: 'income', date: date && date <= today() ? date : today(), preset: { person: s.person, sourceId: s.id, amountCents: s.netCents || undefined, description: 'Paie ' + PEOPLE[s.person], method: 'Dépôt direct' } });
}
async function loadDemo() {
  if (!S.canWrite) return toast('Lecture seule.');
  const d = K.buildDemoData(today());
  const items = [];
  ['sources', 'recurring', 'goals', 'debts', 'budgets', 'events'].forEach(c => d[c].forEach(o => items.push([c, Object.assign({ demo: true }, o)])));
  d.txs.forEach(o => items.push(['tx', o]));
  const prog = $('#demo-progress');
  toast('Chargement de la démonstration…');
  const patch = { demoLoaded: true };
  if (!S.settings.anchorDate) patch.anchorDate = d.settings.anchorDate;
  if (S.settings.openingBalanceCents === undefined) { patch.openingBalanceCents = d.settings.openingBalanceCents; patch.openingBalanceDate = d.settings.openingBalanceDate; patch.demoOpening = true; }
  await saveSettings(patch);
  if (S.mode === 'memory' || S.mode === 'local') { items.forEach(([c, o]) => { if (!S[c].some(x => x.id === o.id)) S[c].push(o); }); persistLocal(); schedule(); toast('Démonstration chargée'); return; }
  await pool(items, 4, ([c, o]) => withRetry(() => db.collection(c).doc(o.id).set(clean(o))), (n, tot) => { if (prog) prog.textContent = `Démo : ${n} / ${tot} éléments…`; });
  toast('Démonstration chargée'); if (prog) prog.textContent = '';
}
async function clearDemo() {
  if (!S.canWrite) return toast('Lecture seule.');
  const items = [];
  COLS.forEach(c => S[c].forEach(o => { if (o.demo) items.push([c, o.id]); }));
  toast('Suppression de la démonstration…');
  const patch = { demoLoaded: null };
  if (S.settings.demoOpening) Object.assign(patch, { openingBalanceCents: null, openingBalanceDate: null, demoOpening: null, anchorDate: S.sources.some(s => !s.demo) ? S.settings.anchorDate : null });
  if (S.mode === 'memory' || S.mode === 'local') { COLS.forEach(c => S[c] = S[c].filter(o => !o.demo)); await saveSettings(patch); toast('Démonstration supprimée'); return; }
  await pool(items, 4, ([c, id]) => withRetry(() => db.collection(c).doc(id).delete()), (n, tot) => { const p = $('#demo-progress'); if (p) p.textContent = `Suppression : ${n} / ${tot}…`; });
  await saveSettings(patch);
  toast('Démonstration supprimée');
}

/* ============================== Exports ============================== */
function loadScript(src, globalName) {
  if (window[globalName]) return Promise.resolve(window[globalName]);
  return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = () => res(window[globalName]); s.onerror = () => rej(new Error('Chargement impossible')); document.head.appendChild(s); });
}
async function offer(filename, data) {
  if (!downloads) {
    try {
      const blob = data instanceof Blob ? data : new Blob([data], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob); const a = document.createElement('a');
      a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000); toast('Fichier prêt : ' + filename);
    } catch (e) { toast('Le téléchargement n’est pas disponible ici.'); }
    return;
  }
  try { await downloads.save({ filename, data }); toast('Fichier prêt : ' + filename); }
  catch (e) { if (e && e.code !== 'declined') toast('Téléchargement impossible (' + (e.code || 'erreur') + ').'); }
}
const TYPE_FR = { income: 'Revenu', expense: 'Dépense', refund: 'Remboursement', savings: 'Épargne', transfer: 'Transfert' };
function txRecords(list) {
  return list.map(t => ({ Date: t.date, Type: TYPE_FR[t.type], Description: txLabel(t), Catégorie: t.categoryId ? catName(t.categoryId) : '', Personne: PEOPLE[t.person] || '', Commune: t.shared ? 'Oui' : 'Non', 'Montant (CAD)': (t.amountCents / 100).toFixed(2), 'Montant (cents)': t.amountCents, Moyen: t.method || '', 'Compte épargne': t.goalId ? goalName(t.goalId) : '', Mouvement: t.type === 'savings' ? (t.direction === 'withdraw' ? 'Retrait' : 'Dépôt') : '', De: t.fromAccount || '', Vers: t.toAccount || '', Statut: t.status === 'cancelled' ? 'Annulée' : 'Enregistrée', Récurrente: t.recurringId ? 'Oui' : 'Non', 'Période de paie': anchor() ? K.payPeriodFor(t.date, anchor()).start : '', Notes: t.notes || '', Démo: t.demo ? 'Oui' : '' }));
}
async function exportCSV() {
  const list = route() === 'transactions' ? filteredTx() : [...S.tx].sort((a, b) => a.date < b.date ? 1 : -1);
  const rec = txRecords(list); if (!rec.length) return toast('Aucune transaction à exporter.');
  const cols = Object.keys(rec[0]);
  const q = v => { v = String(v); return /[;"\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
  const csv = '﻿' + [cols.join(';')].concat(rec.map(r => cols.map(c => q(c === 'Montant (CAD)' ? r[c].replace('.', ',') : r[c])).join(';'))).join('\r\n');
  await offer('kfis-transactions-' + today() + '.csv', csv);
}
async function exportXLSX() {
  let X; try { X = await loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js', 'XLSX'); } catch (e) { return toast('Module Excel indisponible.'); }
  const t = today(), cats = C();
  const wb = X.utils.book_new();
  const txr = txRecords([...S.tx].sort((a, b) => a.date < b.date ? 1 : -1)).map(r => Object.assign({}, r, { 'Montant (CAD)': Number(r['Montant (CAD)']) }));
  X.utils.book_append_sheet(wb, X.utils.json_to_sheet(txr.length ? txr : [{ Info: 'Aucune transaction' }]), 'Transactions');
  const months = K.series(S.tx, cats, 'month', t).map(r => ({ Mois: r.key, Revenus: r.income / 100, Dépenses: r.expenses / 100, Épargne: r.savings / 100, 'Taux d’épargne (%)': r.income ? K.ratioBps(r.savings, r.income) / 100 : '' }));
  X.utils.book_append_sheet(wb, X.utils.json_to_sheet(months), 'Résumé 12 mois');
  const bs = K.budgetStatus(S.budgets, S.tx, cats, K.ym(t)).map(b => ({ Catégorie: catName(b.categoryId), Budget: b.limit / 100, Dépensé: b.spent / 100, Restant: b.remaining / 100, 'Utilisé (%)': b.pctBps / 100 }));
  X.utils.book_append_sheet(wb, X.utils.json_to_sheet(bs.length ? bs : [{ Info: 'Aucun budget' }]), 'Budgets');
  const gs = S.goals.map(g => { const p = K.goalProgress(g, S.tx, t); return { Objectif: g.name, Type: PEOPLE[g.owner || 'commun'], Solde: p.balance / 100, Cible: g.targetCents / 100, Restant: p.remaining / 100, 'Date cible': g.targetDate || '' }; });
  X.utils.book_append_sheet(wb, X.utils.json_to_sheet(gs.length ? gs : [{ Info: 'Aucun objectif' }]), 'Épargne');
  const ds = S.debts.map(d => { const b = K.debtBalance(d, S.tx); const p = K.debtPayoff(b, d.aprBps || 0, d.plannedPaymentCents || d.minPaymentCents, t); return { Dette: d.name, Solde: b / 100, 'Taux (%)': (d.aprBps || 0) / 100, Minimum: (d.minPaymentCents || 0) / 100, Prévu: (d.plannedPaymentCents || 0) / 100, 'Remboursée en': p ? p.date : 'Paiement insuffisant' }; });
  X.utils.book_append_sheet(wb, X.utils.json_to_sheet(ds.length ? ds : [{ Info: 'Aucune dette' }]), 'Dettes');
  const out = X.write(wb, { bookType: 'xlsx', type: 'array' });
  await offer('kfis-' + t + '.xlsx', new Blob([out]));
}
async function exportPDF() {
  let J; try { J = await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', 'jspdf'); } catch (e) { return toast('Module PDF indisponible.'); }
  const m = val('pdf-month') || K.ym(today()), cats = C(), r = K.monthRange(m), mt = K.totals(S.tx, cats, r);
  const P = s => String(s).replace(/[  ]/g, ' ').replace(/−/g, '-').replace(/[’]/g, "'").replace(/[«»]/g, '"');
  const doc = new J.jsPDF({ unit: 'pt', format: 'letter' });
  const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight();
  let y = 56;
  const line = (l, rgt, opts) => { opts = opts || {}; if (y > H - 60) { doc.addPage(); y = 56; } doc.setFont('helvetica', opts.bold ? 'bold' : 'normal'); doc.setFontSize(opts.size || 10); doc.setTextColor(opts.grey ? 120 : 25); doc.text(P(l), 48, y); if (rgt !== undefined) doc.text(P(rgt), W - 48, y, { align: 'right' }); y += opts.gap || 16; };
  const rule = () => { doc.setDrawColor(220); doc.line(48, y - 8, W - 48, y - 8); y += 6; };
  line("KFI'S · KHALIL & YOUSRA", undefined, { bold: true, size: 9, grey: true });
  line('Rapport mensuel · ' + fmtMonth(m), undefined, { bold: true, size: 20, gap: 22 });
  line('Généré le ' + fmtD(today(), 'long') + ' · montants en dollars canadiens', undefined, { grey: true, gap: 26 });
  if (S.tx.some(t => t.demo && t.date >= r.from && t.date <= r.to)) line('Contient des données de démonstration fictives.', undefined, { grey: true, gap: 20 });
  line('Sommaire', undefined, { bold: true, size: 13, gap: 18 }); rule();
  [['Revenus nets', M(mt.income)], ['   Khalil', M(mt.byPerson.khalil.income)], ['   Yousra', M(mt.byPerson.yousra.income)], ['Dépenses', M(mt.expenses)], ['   Communes', M(mt.shared)], ['   Individuelles', M(mt.individual)], ['Économies', M(mt.savings)], ['Reste après épargne', M(mt.afterSavings)], ['Taux d’épargne', K.formatBps(mt.savingsRateBps)]].forEach(([a, b]) => line(a, b));
  y += 10; line('Dépenses par catégorie', undefined, { bold: true, size: 13, gap: 18 }); rule();
  Object.entries(mt.byCategory).sort((a, b) => b[1] - a[1]).forEach(([c, v]) => line(catName(c), M(v)));
  const bs = K.budgetStatus(S.budgets, S.tx, cats, m);
  if (bs.length) { y += 10; line('Budgets', undefined, { bold: true, size: 13, gap: 18 }); rule(); bs.forEach(b => line(catName(b.categoryId) + ' (' + K.formatBps(b.pctBps, 0) + ')', M(b.spent) + ' / ' + M(b.limit))); }
  if (S.goals.length) { y += 10; line('Épargne', undefined, { bold: true, size: 13, gap: 18 }); rule(); S.goals.forEach(g => { const p = K.goalProgress(g, S.tx, today()); line(g.name + ' · ' + PEOPLE[g.owner || 'commun'], M(p.balance) + ' / ' + M(g.targetCents)); }); }
  y += 10; line('Transactions', undefined, { bold: true, size: 13, gap: 18 }); rule();
  S.tx.filter(t => t.date >= r.from && t.date <= r.to && t.status !== 'cancelled').sort((a, b) => a.date < b.date ? -1 : 1).forEach(t => line(t.date + '  ' + TYPE_FR[t.type] + ' · ' + txLabel(t).slice(0, 48) + ' · ' + (PEOPLE[t.person] || ''), (t.type === 'income' || t.type === 'refund' ? '+' : t.type === 'transfer' ? '' : '-') + M(t.amountCents), { size: 9, gap: 13 }));
  await offer('rapport-' + m + '.pdf', doc.output('blob'));
}

/* ============================= Assistant ============================= */
function localAnswer(i) {
  const t = today(), cats = C(), mr = K.monthRange(K.ym(t)), mt = K.totals(S.tx, cats, mr);
  const mo = fmtMonth(K.ym(t)).toLowerCase();
  if (!S.tx.length) return 'Aucune transaction n’est encore enregistrée : je ne peux pas répondre sans données.';
  if (i === 0) {
    const r = mt.byCategory.restaurants || 0, l = mt.byCategory.livraison || 0, c = mt.byCategory.cafe || 0;
    return `En ${mo} (au ${fmtD(t, 'dm')}), vous avez dépensé ${M(r)} en restaurants.` + (l || c ? `\nÀ cela s’ajoutent ${M(l)} en livraison et ${M(c)} en café, soit ${M(r + l + c)} pour les repas à l’extérieur.` : '') + (S.budgets.find(b => b.categoryId === 'restaurants') ? `\nBudget restaurants : ${M(S.budgets.find(b => b.categoryId === 'restaurants').limitCents)} par mois.` : '');
  }
  if (i === 1) {
    const f = K.forecast(DATA(), t, scenarios().realiste, { variableMonthlyCents: S.settings.variableMonthlyCents === undefined ? null : S.settings.variableMonthlyCents });
    const pace = K.savingsPace(S.tx, cats, t, 3);
    return `Selon le scénario réaliste (paies prévues − dépenses récurrentes − dépenses variables moyennes), votre capacité d’épargne est d’environ ${M(K.divRound(f.annual.net, 12))} par mois, soit ${M(f.annual.net)} sur 12 mois.\nVous épargnez actuellement en moyenne ${M(pace)} par mois (3 derniers mois complets).` + (f.incomplete ? '\nAttention : la prévision est incomplète, certaines données manquent.' : '');
  }
  if (i === 2) {
    const top = Object.entries(mt.byCategory).sort((a, b) => b[1] - a[1])[0];
    const from3 = K.addMonthsYM(K.ym(t), -3) + '-01', t3 = K.totals(S.tx, cats, { from: from3, to: K.monthRange(K.addMonthsYM(K.ym(t), -1)).to });
    const top3 = Object.entries(t3.byCategory).sort((a, b) => b[1] - a[1])[0];
    return (top ? `Ce mois-ci, la catégorie la plus coûteuse est « ${catName(top[0])} » : ${M(top[1])} (${K.formatBps(K.ratioBps(top[1], mt.expenses), 0)} des dépenses).` : 'Aucune dépense ce mois-ci.') + (top3 ? `\nSur les 3 derniers mois complets : « ${catName(top3[0])} » avec ${M(top3[1])}.` : '');
  }
  const total = S.goals.reduce((s, g) => s + K.goalProgress(g, S.tx, t).balance, 0);
  const pace = K.savingsPace(S.tx, cats, t, 3);
  return `Vous avez ${M(total)} dans vos comptes d’épargne. Au rythme moyen des 3 derniers mois complets (${M(pace)} par mois), vous aurez environ ${M(total + pace * 12)} dans 12 mois (${M(total)} + 12 × ${M(pace)}).`;
}
function digest() {
  const t = today(), cats = C(), D = DATA();
  const d = $ => ($ / 100).toFixed(2);
  const months = K.series(S.tx, cats, 'month', t).map(r => { const tt = K.totals(S.tx, cats, { from: r.from, to: r.to }); return { mois: r.key, revenus: d(r.income), depenses: d(r.expenses), epargne: d(r.savings), depensesParCategorie: Object.fromEntries(Object.entries(tt.byCategory).map(([k, v]) => [catName(k), d(v)])), revenusKhalil: d(tt.byPerson.khalil.income), revenusYousra: d(tt.byPerson.yousra.income), depensesKhalil: d(tt.byPerson.khalil.expenses), depensesYousra: d(tt.byPerson.yousra.expenses), communes: d(tt.shared) }; });
  const a = anchor(); const per = a ? K.periodSummary(K.payPeriodFor(t, a), D, t) : null;
  const f = K.forecast(D, t, scenarios().realiste, {});
  return {
    aujourdhui: t, devise: 'CAD', note: 'Montants en dollars. Les dépenses excluent transferts, paiements de carte et épargne; remboursements déduits.',
    mois: months,
    periodeDePaieActuelle: per && { du: per.period.start, au: per.period.end, revenusRecus: d(per.receivedIncome), revenusPrevus: d(per.expectedIncome), depenses: d(per.actualExpenses), epargne: d(per.actualSavings), resteADepenser: d(per.leftToSpend), paiesManquantes: per.missing.length },
    soldeBancaire: (() => { const b = K.balance(S.tx, cats, S.settings, t); return b.known ? d(b.cents) : 'inconnu (solde de départ non configuré)'; })(),
    objectifs: S.goals.map(g => { const p = K.goalProgress(g, S.tx, t); return { nom: g.name, type: g.owner, solde: d(p.balance), cible: d(g.targetCents), dateCible: g.targetDate }; }),
    rythmeEpargneMensuelMoyen3mois: d(K.savingsPace(S.tx, cats, t, 3)),
    budgetsCeMois: K.budgetStatus(S.budgets, S.tx, cats, K.ym(t)).map(b => ({ categorie: catName(b.categoryId), limite: d(b.limit), depense: d(b.spent) })),
    dettes: S.debts.map(x => ({ nom: x.name, solde: d(K.debtBalance(x, S.tx)), tauxAnnuel: (x.aprBps || 0) / 100 })),
    prevision12moisRealiste: { revenus: d(f.annual.income), depenses: d(f.annual.expenses), surplus: d(f.annual.net), incomplete: f.incomplete },
    depensesRecurrentes: S.recurring.map(r => ({ description: r.description, montant: d(r.amountCents), frequence: K.FREQUENCIES[r.frequency] })),
  };
}
let askCtl = null;
async function askClaude(q) {
  if (!sampleFn) return;
  askCtl && askCtl.abort(); askCtl = new AbortController();
  UI.answer = { text: 'Analyse de vos données…', loading: true }; schedule();
  const prompt = `Tu es l'assistant financier de Khalil et Yousra (Montréal, Québec). Réponds en français canadien, clairement et brièvement (5 phrases max, montants au format 1 234,56 $).
RÈGLES : utilise UNIQUEMENT les chiffres des DONNÉES ci-dessous. N'invente aucun montant. Si l'information n'y est pas, dis-le simplement et indique quoi enregistrer dans l'application. Si tu additionnes des montants, montre le calcul. Précise la période concernée. Ne donne pas de conseil d'investissement personnalisé.

DONNÉES (JSON, générées par l'application à partir des transactions enregistrées) :
${JSON.stringify(digest())}

QUESTION : ${q}`;
  try {
    const r = await sampleFn(prompt, { signal: askCtl.signal, cache: false, onText: ({ text }) => { UI.answer = { text, loading: false }; const el = $('#answer'); if (el) { el.textContent = text; el.classList.remove('loading'); } } });
    UI.answer = { text: r.text + (r.truncated ? '\n(Réponse tronquée.)' : ''), loading: false }; schedule();
  } catch (e) {
    if (e && e.code === 'cancelled') return;
    const msg = { not_granted: 'L’assistant n’a pas été autorisé. Les 4 questions rapides restent disponibles.', rate_limited: 'Trop de questions d’un coup : réessayez dans un moment.', sampling_disabled: 'L’assistant n’est pas disponible pour ce compte.' }[e && e.code] || 'L’assistant n’a pas pu répondre. Réessayez.';
    UI.answer = { text: (e && e.text ? e.text + '\n\n' : '') + msg, loading: false };
    if (e && ['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled'].includes(e.code)) sampleFn = null;
    schedule();
  }
}

/* ========================== Délégation d'événements ========================== */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  const act = el.dataset.act, id = el.dataset.id;
  if (act === 'modal-bg') { if (e.target === el) closeModal(); return; }
  const H = {
    'nav-open': () => document.body.classList.add('nav-open'), 'nav-close': () => document.body.classList.remove('nav-close', 'nav-open'),
    me: () => { S.me = el.dataset.v; store.set('me', S.me); schedule(); },
    go: () => { location.hash = el.dataset.v; },
    add: () => openTx({ type: el.dataset.type, goal: el.dataset.goal, dir: el.dataset.dir }),
    'chart-mode': () => { UI.chartMode = el.dataset.v; schedule(); },
    'month-shift': () => { UI.month = K.addMonthsYM(UI.month || K.ym(today()), +el.dataset.d); schedule(); },
    'cal-shift': () => { UI.calMonth = K.addMonthsYM(UI.calMonth || K.ym(today()), +el.dataset.d); schedule(); },
    'cal-today': () => { UI.calMonth = null; UI.calSel = today(); schedule(); },
    'cal-day': () => { UI.calSel = el.dataset.d; schedule(); },
    period: () => { UI.periodIdx = +el.dataset.v; schedule(); },
    scenario: () => { UI.scenario = el.dataset.v; schedule(); },
    'assume-reset': () => { const sc = Object.assign({}, S.settings.scenarios || {}); delete sc[UI.scenario]; saveSettings({ scenarios: sc, variableMonthlyCents: null }).then(() => toast('Valeurs par défaut rétablies')); },
    'tx-edit': () => openTx({ id }), 'source-new': () => openSource(null, el.dataset.person), 'source-edit': () => openSource(id),
    'recurring-new': () => openRecurring(), 'recurring-edit': () => openRecurring(id), 'goal-new': () => openGoal(null, el.dataset.owner), 'goal-edit': () => openGoal(id),
    'debt-new': () => openDebt(), 'debt-edit': () => openDebt(id), 'budget-new': () => openBudget(), 'budget-edit': () => openBudget(id),
    'event-new': () => openEvent(null, el.dataset.d), 'event-edit': () => openEvent(id), 'cat-new': () => openCategory(), 'cat-edit': () => openCategory(id),
    'debt-pay': () => { const d = S.debts.find(x => x.id === id); openTx({ type: d && d.kind === 'credit_card' ? 'expense' : 'expense', preset: { debtId: id, categoryId: d && d.kind === 'credit_card' ? 'carte_credit' : d && d.kind === 'car_loan' ? 'auto_paiement' : d && d.kind === 'mortgage' ? 'loyer' : 'prets', amountCents: d ? d.plannedPaymentCents || d.minPaymentCents : undefined, description: 'Paiement ' + (d ? d.name : ''), shared: true } }); },
    'occ-pay': () => markOccurrence(el.dataset.rule, el.dataset.date), 'pay-record': () => recordPay(el.dataset.src, el.dataset.date),
    'demo-load': () => loadDemo(), 'demo-clear': () => armed(el, clearDemo, 'Confirmer la suppression de la démo'),
    'smart-ex': () => { const el2 = $('#smart-in'); UI.smart = el.dataset.v; if (el2) { el2.value = UI.smart; autosize(el2); el2.focus(); } refreshSmart(); },
    'smart-edit': () => smartEdit(+el.dataset.i),
    'toast-undo': () => { const u = toastUndo; toastUndo = null; $('#toast-root').innerHTML = ''; if (u) u(); },
    'backup-export': backupExport, 'export-csv': exportCSV, 'export-xlsx': exportXLSX, 'export-pdf': exportPDF,
    'ask-local': () => { UI.answer = { text: localAnswer(+el.dataset.i) }; schedule(); },
    // modale
    'modal-close': closeModal,
    chip: () => { const g = el.dataset.group; document.querySelectorAll('#' + g + ' .chip').forEach(c => c.classList.toggle('on', c === el)); if (g === 'tx-person' && modalCtx && modalCtx.tx.type === 'income') { modalCtx.tx.person = el.dataset.v; $('#tx-fields').innerHTML = txFields(modalCtx.tx); } },
    'seg-pick': () => el.parentElement.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === el)),
    'tx-type': () => { const ctx = modalCtx; const keep = { amt: val('tx-amt') }; ctx.tx.type = el.dataset.v; ctx.tx.person = chipVal('tx-person') || ctx.tx.person; if (ctx.tx.type === 'expense' && !ctx.tx.categoryId) ctx.tx.categoryId = topCats()[0]; el.parentElement.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === el)); $('#tx-fields').innerHTML = txFields(ctx.tx); $('#tax-hint').hidden = ctx.tx.type !== 'expense'; const rf = $('#tx-rec-f'); if (rf) rf.hidden = ctx.tx.type === 'income' || ctx.tx.type === 'transfer'; $('#tx-debt-f').hidden = !(ctx.tx.type === 'expense' || ctx.tx.type === 'transfer'); $('#tx-amt').value = keep.amt; $('#tx-amt').focus(); },
    'cat-chip': () => { modalCtx.tx.categoryId = el.dataset.v; $('#tx-cat').value = el.dataset.v; document.querySelectorAll('#cat-chips .chip').forEach(c => c.classList.toggle('on', c === el)); $('#cat-hint').textContent = catHint(el.dataset.v); },
    shared: () => { modalCtx.tx.shared = el.dataset.v === '1'; el.parentElement.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === el)); },
    dir: () => { modalCtx.tx.direction = el.dataset.v; el.parentElement.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === el)); },
    'rec-kind': () => { modalCtx.kind = el.dataset.v; el.parentElement.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === el)); $('#rec-cat-f').hidden = el.dataset.v === 'savings'; $('#rec-goal-f').hidden = el.dataset.v !== 'savings'; },
    'tx-delete': () => armed(el, async () => { await removeDoc('tx', id); closeModal(); toast('Transaction supprimée'); }),
    'tx-cancel': async () => { const t = S.tx.find(x => x.id === id); if (!t) return; await save('tx', Object.assign({}, t, { status: t.status === 'cancelled' ? 'posted' : 'cancelled', updatedAt: Date.now() })); closeModal(); toast(t.status === 'cancelled' ? 'Transaction rétablie' : 'Transaction annulée : elle n’est plus comptée'); },
    'source-delete': () => armed(el, async () => { await removeDoc('sources', id); closeModal(); toast('Source supprimée (les paies déjà reçues restent)'); }),
    'recurring-delete': () => armed(el, async () => { await removeDoc('recurring', id); closeModal(); toast('Récurrence supprimée (les paiements passés restent)'); }),
    'goal-delete': () => { if (S.tx.some(t => t.goalId === id && t.status !== 'cancelled')) return toast('Des dépôts utilisent cet objectif : retirez-les ou annulez-les d’abord.'); armed(el, async () => { await removeDoc('goals', id); closeModal(); toast('Objectif supprimé'); }); },
    'debt-delete': () => armed(el, async () => { await removeDoc('debts', id); closeModal(); toast('Dette supprimée'); }),
    'budget-delete': () => armed(el, async () => { await removeDoc('budgets', id); closeModal(); toast('Budget supprimé'); }),
    'event-delete': () => armed(el, async () => { await removeDoc('events', id); closeModal(); toast('Événement supprimé'); }),
    'cat-delete': () => armed(el, async () => { await removeDoc('categories', id); closeModal(); toast('Catégorie supprimée'); }),
  };
  if (H[act]) { if (el.tagName === 'A' && act !== 'go') return; e.preventDefault(); H[act](); }
});
document.addEventListener('change', e => {
  const el = e.target;
  if (el.dataset.act === 'cat-select' && modalCtx) { modalCtx.tx.categoryId = el.value; document.querySelectorAll('#cat-chips .chip').forEach(c => c.classList.toggle('on', c.dataset.v === el.value)); $('#cat-hint').textContent = catHint(el.value); }
  if (el.dataset.act === 'freq-change') { const p = el.dataset.p; $('#' + p + '-semi').hidden = el.value !== 'semimonthly'; }
  if (el.dataset.act === 'tx-date' && anchor() && K.isISODate(el.value)) { const p = K.payPeriodFor(el.value, anchor()); $('#tx-period').textContent = 'Période de paie : ' + fmtD(p.start, 'dm') + ' – ' + fmtD(p.end, 'dm'); }
  if (el.dataset.act === 'tax-toggle' || el.id === 'tx-addtax') taxPreview();
});
document.addEventListener('input', e => { if (e.target.id === 'tx-amt') taxPreview(); if (e.target.id === 'tx-nl') fillFromSentence(e.target.value); });
function fillFromSentence(text) {
  if (!modalCtx || !text.trim()) return;
  const r = NLP.parseLine(text, nlpCtx()), t = r.tx, ctx = modalCtx;
  const keepId = ctx.tx.id;
  ctx.tx = Object.assign({ id: keepId, status: 'posted' }, t);
  document.querySelectorAll('#tx-types button').forEach(b => b.classList.toggle('on', b.dataset.v === (t.type === 'refund' ? 'expense' : t.type)));
  $('#tx-fields').innerHTML = txFields(ctx.tx);
  $('#tax-hint').hidden = !(t.type === 'expense' || t.type === 'refund');
  const rf = $('#tx-rec-f'); if (rf) rf.hidden = t.type === 'income' || t.type === 'transfer';
  $('#tx-debt-f').hidden = !(t.type === 'expense' || t.type === 'transfer');
  $('#tx-amt').value = t.amountCents ? centsStr(t.amountCents) : '';
  $('#tx-date').value = t.date; $('#tx-desc').value = t.description || '';
  document.querySelectorAll('#tx-person .chip').forEach(c => c.classList.toggle('on', c.dataset.v === t.person));
  if (t.method) $('#tx-method').value = t.method;
  if (t.debtId) $('#tx-debt').value = t.debtId;
  $('#tx-addtax').checked = false; taxPreview();
}
document.addEventListener('submit', e => { if (e.target.id === 'ask-form') { e.preventDefault(); const q = $('#ask-q').value.trim(); if (q) askClaude(q); } });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { if (modalCtx) closeModal(); document.body.classList.remove('nav-open'); }
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role=button][data-act]')) { e.preventDefault(); e.target.click(); }
  if (e.key === 'n' && !modalCtx && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) && !e.metaKey && !e.ctrlKey) { e.preventDefault(); openTx({}); }
});
function taxPreview() {
  const o = $('#tax-out'); if (!o) return;
  const a = K.parseMoney(val('tx-amt'));
  if (!checked('tx-addtax') || a === null) { o.textContent = ''; return; }
  const s = K.salesTaxes(a, S.settings.taxes); o.textContent = `TPS ${M(s.tps)} + TVQ ${M(s.tvq)} = ${M(s.total)}`;
}
function armed(el, fn, label) {
  if (el.classList.contains('armed')) { fn(); return; }
  el.classList.add('armed'); const old = el.innerHTML; el.textContent = label || 'Confirmer la suppression';
  setTimeout(() => { if (document.body.contains(el)) { el.classList.remove('armed'); el.innerHTML = old; } }, 4000);
}
window.addEventListener('hashchange', () => { document.body.classList.remove('nav-open'); UI.answer = route() === 'analyses' ? UI.answer : null; window.scrollTo(0, 0); render(); });

/* ================================ Démarrage ================================ */
const LKEY = 'kfis.data.v1';
function persistLocal() {
  if (S.mode !== 'local') return;
  const data = { v: 1, savedAt: new Date().toISOString(), settings: S.settings };
  COLS.forEach(c => data[c] = S[c]);
  try { localStorage.setItem(LKEY, JSON.stringify(data)); S.localOk = true; }
  catch (e) { S.localOk = false; toast(e && e.name === 'QuotaExceededError' ? 'Espace plein sur cet appareil : supprimez la démo ou d’anciennes données.' : 'Enregistrement impossible sur cet appareil.'); }
}
function applySnapshot(d) {
  S.settings = d.settings && typeof d.settings === 'object' ? d.settings : {};
  COLS.forEach(c => S[c] = Array.isArray(d[c]) ? d[c].filter(x => x && typeof x.id === 'string') : []);
}
function localMode() {
  S.mode = 'local'; S.canWrite = true;
  try { const raw = localStorage.getItem(LKEY); if (raw) applySnapshot(JSON.parse(raw)); localStorage.setItem(LKEY + '.probe', '1'); localStorage.removeItem(LKEY + '.probe'); S.localOk = true; }
  catch (e) { S.localOk = false; }
  try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) { /* facultatif */ }
  window.addEventListener('storage', ev => { if (ev.key === LKEY && ev.newValue) { try { applySnapshot(JSON.parse(ev.newValue)); schedule(); } catch (e) { /* ignoré */ } } });
  schedule();
}
async function backupExport() {
  const data = { app: 'KFIS', v: 1, exportedAt: new Date().toISOString(), settings: S.settings };
  COLS.forEach(c => data[c] = S[c]);
  await offer('kfis-sauvegarde-' + today() + '.json', JSON.stringify(data));
  await saveSettings({ lastBackup: today() });
}
async function backupImport(file) {
  try {
    const d = JSON.parse(await file.text());
    if (!d || d.app !== 'KFIS' || !Array.isArray(d.tx)) throw new Error('format');
    const cats = K.categoryMap(Array.isArray(d.categories) ? d.categories : []);
    const bad = d.tx.filter(t => Object.keys(K.validateTx(t, cats)).length).length;
    if (!modalCtx) openModal('Restaurer une sauvegarde', `<p style="margin:0">Fichier du ${esc(fmtD(String(d.exportedAt || '').slice(0, 10)))} : <b>${d.tx.length}</b> transactions, ${(d.sources || []).length} sources de revenu, ${(d.goals || []).length} objectifs.${bad ? ` <span class="neg">${bad} transaction(s) invalide(s) seront ignorées.</span>` : ''}</p><p class="small muted" style="margin:0">Les données actuelles de cet appareil seront remplacées.</p>`,
      `<span class="grow"></span><button type="button" class="btn ghost" data-act="modal-close">Annuler</button><button type="submit" class="btn pri">Remplacer mes données</button>`,
      () => { d.tx = d.tx.filter(t => !Object.keys(K.validateTx(t, cats)).length); applySnapshot(d); persistLocal(); closeModal(); UI.periodIdx = null; schedule(); toast('Sauvegarde restaurée'); });
  } catch (e) { toast('Ce fichier n’est pas une sauvegarde KFI’S valide.'); }
}
document.addEventListener('change', e => { if (e.target.id === 'backup-file' && e.target.files[0]) { backupImport(e.target.files[0]); e.target.value = ''; } });
async function boot() {
  render();
  if (window.KFIS_STANDALONE) return localMode();
  const cl = window.claude;
  if (!cl || !cl.use) return memoryMode();
  const [dbx, u, smp, dl] = await Promise.all([cl.use('db'), cl.use('user'), cl.use('sample'), cl.use('downloads')].map(p => p.catch(() => null)));
  db = dbx; userCap = u; sampleFn = smp; downloads = dl;
  if (!db) return memoryMode();
  if (userCap) {
    try { S.isOwner = !!(await userCap.isOwner()); const w = userCap.can ? await userCap.can('data.write') : null; S.canWrite = S.isOwner || w !== false; } catch (e) { /* inconnu : on garde l'écriture */ }
  }
  S.mode = 'live';
  let pending = new Set(COLS.concat(['settings']));
  const timer = setTimeout(() => { if (pending.size) { S.stale = true; schedule(); } }, 10000);
  const done = k => { pending.delete(k); if (!pending.size) { clearTimeout(timer); S.stale = false; } schedule(); };
  const onErr = k => err => { console.warn(k, err); if (err && err.code === 'revoked') { S.canWrite = false; } done(k); };
  COLS.forEach(c => db.collection(c).onSnapshot(snap => { S[c] = snap.docs.map(d => d.data()).filter(Boolean); if (!snap.metadata.fromCache) done(c); else schedule(); }, onErr(c)));
  db.doc('config/settings').onSnapshot(snap => { S.settings = snap.exists ? Object.assign({}, snap.data()) : {}; if (!snap.metadata.fromCache) done('settings'); else schedule(); }, onErr('settings'));
}
function memoryMode() {
  S.mode = 'memory';
  const d = K.buildDemoData(today());
  S.settings = Object.assign({}, d.settings);
  ['sources', 'recurring', 'goals', 'debts', 'budgets', 'events'].forEach(c => S[c] = d[c].map(o => Object.assign({ demo: true }, o)));
  S.tx = d.txs;
  schedule();
}
boot();
})();
