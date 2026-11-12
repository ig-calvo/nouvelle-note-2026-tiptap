/* global window */
// =========================================================
// problemes-index.jsx — recherche dans les problèmes et antécédents d'Omnimed
// (fichier pur : aucun JSX, aucun DOM au chargement, testable par le harnais
// comme snomed-index.jsx).
//
// Source : note-ui/omnimed-problemes.json, généré par
// tools/omnimed-dictionnaire-to-json.py depuis l'onglet « Problème (Omnimed) »
// de la feuille « Dictionnaire : Diagnostics / Impressions diagnostics /
// Symptômes » : 344 termes [ID_TERME, français, anglais], liste plate.
//
// La logique pure vit dans buildProblemIndex(data, options). La façade
// window.PROBLEMES (bas de fichier) l'enveloppe et se reconstruit si
// window.PROBLEMES_DATA change de référence. Le sélecteur /dx (dx-picker.jsx)
// en est le seul consommateur.
// =========================================================

// Mots vides des deux langues : « maladie de Parkinson » retrouve « Parkinson ».
const PROBLEMES_STOP = new Set(['de', 'du', 'des', 'la', 'le', 'les', 'l', 'd', 'et', 'a', 'au', 'aux', 'en', 'un', 'une',
  'of', 'the', 'and', 'in', 'to', 'with', 'for']);

function normProbleme(s) {
  return (s || '').toLowerCase().replace(/œ/g, 'oe').replace(/æ/g, 'ae').normalize('NFD').replace(/[̀-ͯ]/g, '');
}
function problemeQueryTokens(s) {
  const all = normProbleme(s).split(/[^a-z0-9]+/).filter(Boolean);
  const kept = all.filter(function (t) { return !PROBLEMES_STOP.has(t); });
  return kept.length ? kept : all;
}
function problemeWordMatches(word, tok) {
  if (word.indexOf(tok) === 0) return true;
  // pluriel léger : « allergies » retrouve aussi « allergie »
  if (tok.length > 4 && /[sx]$/.test(tok)) return word.indexOf(tok.slice(0, -1)) === 0;
  return false;
}
// Mêmes classes que snomedMatchTokens / cim10MatchNode : 2 libellé == requête,
// 3 chaque token commence un mot ET le 1er mot correspond au 1er token,
// 4 chaque token commence un mot, 5 sous-chaîne.
function problemeMatchTokens(tok, qTokens) {
  if (!tok || !tok.length || !qTokens.length) return null;
  if (tok.join(' ') === qTokens.join(' ')) return 2;
  if (qTokens.every(function (t) { return tok.some(function (w) { return problemeWordMatches(w, t); }); })) {
    return problemeWordMatches(tok[0], qTokens[0]) ? 3 : 4;
  }
  if (qTokens.every(function (t) { return tok.some(function (w) { return w.indexOf(t) !== -1; }); })) return 5;
  return null;
}

// `options.lang` : 'fr' ou 'en', la langue du terme affiché. L'autre langue ne
// sert qu'à la recherche (« asthme » trouve « Asthma » en anglais, et inversement).
// Quand le terme anglais est identique au français (la feuille ne l'a pas
// traduit), les deux langues affichent le même libellé.
function buildProblemIndex(data, options) {
  const lang = (options && options.lang) === 'en' ? 'en' : 'fr';
  const items = ((data && data.termes) || []).map(function (r) {
    const fr = r[1], en = r[2] || r[1];
    const label = lang === 'en' ? en : fr;
    const other = lang === 'en' ? fr : en;
    const toks = [problemeQueryTokens(label)];
    if (other && other !== label) toks.push(problemeQueryTokens(other));
    return { id: String(r[0]), label: label, other: other !== label ? other : null, toks: toks };
  });
  const byId = new Map(items.map(function (it) { return [it.id, it]; }));
  function view(it, score) { return { id: it.id, label: it.label, other: it.other, score: score }; }

  let memo = null;
  // { rows, total, more } — les `limit` meilleurs termes (défaut 6).
  function search(q, opts) {
    const limit = (opts && opts.limit) || 6;
    const qn = normProbleme(q).trim();
    if (qn.length < 2) return { rows: [], total: 0, more: 0 };
    const key = qn + '\u0001' + limit;
    if (memo && memo.key === key) return memo.value;
    const qt = problemeQueryTokens(qn);
    const matches = [];
    items.forEach(function (it) {
      let cls = null;
      it.toks.forEach(function (tk) {
        const c = problemeMatchTokens(tk, qt);
        if (c != null && (cls == null || c < cls)) cls = c;
      });
      if (cls == null) return;
      // À classe égale, le libellé le plus court (le plus général) d'abord.
      matches.push({ it: it, score: cls + Math.min(0.99, it.label.length / 200) });
    });
    matches.sort(function (x, y) {
      if (x.score !== y.score) return x.score - y.score;
      return x.it.label < y.it.label ? -1 : (x.it.label > y.it.label ? 1 : 0);
    });
    const value = {
      rows: matches.slice(0, limit).map(function (m) { return view(m.it, m.score); }),
      total: matches.length,
      more: Math.max(0, matches.length - limit),
    };
    memo = { key: key, value: value };
    return value;
  }

  return {
    search: search,
    get: function (id) { const it = byId.get(String(id)); return it ? view(it, 0) : null; },
    count: function () { return items.length; },
  };
}

// ---------------------------------------------------------
// Façade window.PROBLEMES — chargement asynchrone (Note Clinique.html pose
// window.PROBLEMES_DATA puis émet 'problemes:ready'), reconstruction si les
// données changent de référence.
// ---------------------------------------------------------
let _problemesInstance = null;
let _problemesBuiltFrom = null;

function problemesEnsure() {
  const data = window.PROBLEMES_DATA;
  if (!data) return null;
  if (_problemesInstance && _problemesBuiltFrom === data) return _problemesInstance;
  _problemesInstance = buildProblemIndex(data, { lang: (window.I18N && window.I18N.lang) || 'fr' });
  _problemesBuiltFrom = data;
  return _problemesInstance;
}

const PROBLEMES = {
  ready: function () { return !!problemesEnsure(); },
  whenReady: function (cb) {
    if (problemesEnsure()) { cb(); return; }
    if (typeof window.addEventListener !== 'function') return; // pas de DOM (tests)
    function onReady() { window.removeEventListener('problemes:ready', onReady); cb(); }
    window.addEventListener('problemes:ready', onReady);
  },
  search: function (q, opts) {
    const ix = problemesEnsure();
    return ix ? ix.search(q, opts) : { rows: [], total: 0, more: 0 };
  },
  get: function (id) { const ix = problemesEnsure(); return ix ? ix.get(id) : null; },
  count: function () { const ix = problemesEnsure(); return ix ? ix.count() : 0; },
};

Object.assign(window, { buildProblemIndex: buildProblemIndex, normProbleme: normProbleme, PROBLEMES: PROBLEMES });
