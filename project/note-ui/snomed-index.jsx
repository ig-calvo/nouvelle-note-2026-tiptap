/* global window */
// =========================================================
// snomed-index.jsx — recherche dans le dictionnaire SNOMED CT (fichier pur :
// aucun JSX, aucun DOM au chargement, testable par le harnais comme
// cim10-index.jsx).
//
// Source : note-ui/snomed-diagnostics.json, généré par
// tools/csv-to-snomed-json.py depuis l'export Infoway (refset « Most commonly
// used clinical problems… », 4 219 concepts, TERMES EN ANGLAIS). Liste plate :
// pas de hiérarchie à parcourir, seulement de la recherche par texte ou par
// identifiant de concept.
//
// La logique pure vit dans buildSnomedIndex(data). La façade window.SNOMED
// (bas de fichier) l'enveloppe et se reconstruit si window.SNOMED_DATA change
// de référence. Le sélecteur /dx (dx-picker.jsx) en est le seul consommateur.
// =========================================================

// Mots vides anglais : « disorder of the heart » retrouve « heart disorder ».
const SNOMED_STOP = new Set(['of', 'the', 'a', 'an', 'and', 'in', 'to', 'with', 'by', 'on', 'for', 'from']);

function normSnomed(s) {
  return (s || '').toLowerCase().replace(/œ/g, 'oe').replace(/æ/g, 'ae').normalize('NFD').replace(/[̀-ͯ]/g, '');
}
function tokensSnomed(s) {
  return normSnomed(s).split(/[^a-z0-9]+/).filter(Boolean);
}
function snomedQueryTokens(s) {
  const all = tokensSnomed(s);
  const kept = all.filter(function (t) { return !SNOMED_STOP.has(t); });
  return kept.length ? kept : all;
}

function snomedWordMatches(word, tok) {
  if (word.indexOf(tok) === 0) return true;
  // pluriel léger : « fractures » retrouve aussi « fracture »
  if (tok.length > 4 && /[sx]$/.test(tok)) return word.indexOf(tok.slice(0, -1)) === 0;
  return false;
}

// Classe de correspondance d'une liste de tokens (plus petit = meilleur) :
// 2 libellé == requête, 3 chaque token commence un mot ET le 1er mot
// correspond au 1er token, 4 chaque token commence un mot, 5 sous-chaîne —
// mêmes classes que cim10MatchNode (cim10-index.jsx).
function snomedMatchTokens(tok, qTokens) {
  if (!tok || !tok.length || !qTokens.length) return null;
  if (tok.join(' ') === qTokens.join(' ')) return 2;
  if (qTokens.every(function (t) { return tok.some(function (w) { return snomedWordMatches(w, t); }); })) {
    return snomedWordMatches(tok[0], qTokens[0]) ? 3 : 4;
  }
  if (qTokens.every(function (t) { return tok.some(function (w) { return w.indexOf(t) !== -1; }); })) return 5;
  return null;
}

function buildSnomedIndex(data) {
  const tags = (data && data._meta && data._meta.tags) || [];
  const items = ((data && data.concepts) || []).map(function (r) {
    const label = r[1];
    const fsn = r[2] ? r[2] : null;
    const tok = snomedQueryTokens(label);
    return {
      id: r[0], label: label, fsn: fsn, tag: r[3] >= 0 ? (tags[r[3]] || null) : null,
      tok: tok, fsnTok: fsn ? snomedQueryTokens(fsn) : null,
    };
  });
  const byId = new Map(items.map(function (it) { return [it.id, it]; }));

  function view(it, score) {
    return { id: it.id, label: it.label, fsn: it.fsn, tag: it.tag, score: score };
  }

  let memo = null;
  // { rows, total, more } — les `limit` meilleurs concepts (défaut 6). Une
  // requête faite uniquement de chiffres cherche par identifiant de concept.
  function search(q, opts) {
    const limit = (opts && opts.limit) || 6;
    const qn = normSnomed(q).trim();
    if (qn.length < 2) return { rows: [], total: 0, more: 0 };
    const key = qn + '\u0001' + limit;
    if (memo && memo.key === key) return memo.value;

    const matches = [];
    if (/^\d+$/.test(qn)) {
      items.forEach(function (it) {
        if (it.id === qn) matches.push({ it: it, score: 0 });
        else if (qn.length >= 4 && it.id.indexOf(qn) === 0) matches.push({ it: it, score: 1 });
      });
    } else {
      const qt = snomedQueryTokens(qn);
      items.forEach(function (it) {
        const a = snomedMatchTokens(it.tok, qt), b = snomedMatchTokens(it.fsnTok, qt);
        const cls = a == null ? b : (b == null ? a : Math.min(a, b));
        if (cls == null) return;
        // À classe égale, le libellé le plus court (le plus général) d'abord.
        matches.push({ it: it, score: cls + Math.min(0.99, it.label.length / 200) });
      });
    }
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
// Façade window.SNOMED — chargement asynchrone (Note Clinique.html pose
// window.SNOMED_DATA puis émet 'snomed:ready'), reconstruction si les
// données changent de référence.
// ---------------------------------------------------------
let _snomedInstance = null;
let _snomedBuiltFrom = null;

function snomedEnsure() {
  const data = window.SNOMED_DATA;
  if (!data) return null;
  if (_snomedInstance && _snomedBuiltFrom === data) return _snomedInstance;
  _snomedInstance = buildSnomedIndex(data);
  _snomedBuiltFrom = data;
  return _snomedInstance;
}

const SNOMED = {
  ready: function () { return !!snomedEnsure(); },
  whenReady: function (cb) {
    if (snomedEnsure()) { cb(); return; }
    if (typeof window.addEventListener !== 'function') return; // pas de DOM (tests)
    function onReady() { window.removeEventListener('snomed:ready', onReady); cb(); }
    window.addEventListener('snomed:ready', onReady);
  },
  search: function (q, opts) {
    const ix = snomedEnsure();
    return ix ? ix.search(q, opts) : { rows: [], total: 0, more: 0 };
  },
  get: function (id) { const ix = snomedEnsure(); return ix ? ix.get(id) : null; },
  count: function () { const ix = snomedEnsure(); return ix ? ix.count() : 0; },
};

Object.assign(window, { buildSnomedIndex: buildSnomedIndex, normSnomed: normSnomed, SNOMED: SNOMED });
