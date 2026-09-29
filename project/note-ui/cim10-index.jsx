/* global window */
// =========================================================
// cim10-index.jsx — hiérarchie et recherche CIM-10 (fichier pur : aucun JSX,
// aucun DOM au chargement, testable par le harnais comme note-sections.jsx).
//
// Construit un arbre Chapitre → Bloc → Catégorie → Code à partir de deux
// fichiers JSON :
//  - note-ui/cim10-fr-clinique.json   (liste plate existante, 2 435 codes)
//  - note-ui/cim10-hierarchy.json     (chapitres, blocs, catégories et codes
//                                       intermédiaires manquants, codes
//                                       fréquents — voir _meta.sources)
//
// La logique pure vit dans buildCim10Index(rows, hier), sans dépendance à
// `window` : c'est ce que chargent les tests. La façade window.CIM10 (en bas
// de fichier) l'enveloppe, gère le chargement asynchrone et se reconstruit
// si window.CIM10_DATA change de référence.
//
// Le sélecteur /dx (dx-picker.jsx, éditeur : editor-field.jsx) est le seul
// consommateur de la façade window.CIM10 — searchCIM10/searchDx (l'ancienne
// lecture directe de CIM10_DATA) ont été retirés d'editor-schema.jsx.
// =========================================================

const CIM10_STOP = new Set(['de', 'du', 'des', 'la', 'le', 'les', 'l', 'd', 'et', 'a', 'au', 'aux', 'en', 'un', 'une']);
const CIM10_CODE_Q = /^[a-z]\d[0-9a-z.+]*$/;

function normCim10(s) {
  return (s || '').toLowerCase().replace(/œ/g, 'oe').replace(/æ/g, 'ae').normalize('NFD').replace(/[̀-ͯ]/g, '');
}
function tokensCim10(s) {
  return normCim10(s).split(/[^a-z0-9]+/).filter(Boolean);
}
function cim10CountLabel(n, unit) {
  const forms = {
    code: ['code précis', 'codes précis'],
    category: ['catégorie', 'catégories'],
    block: ['bloc', 'blocs'],
  };
  const f = forms[unit] || forms.code;
  return n + ' ' + (n === 1 ? f[0] : f[1]);
}

// Ordre des enfants d'une catégorie : chiffres, puis X, puis + (extensions
// CIM-10-FR/ATIH), après le point — ex. M45.X0 avant M45.+0.
function cim10Rank(ch) {
  if (ch >= '0' && ch <= '9') return 0;
  if (ch === 'X') return 1;
  if (ch === '+') return 2;
  return 3;
}
function cmpCim10Code(a, b) {
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) {
    const ca = a[i], cb = b[i];
    if (ca === undefined) return -1;
    if (cb === undefined) return 1;
    if (ca === cb) continue;
    const ra = cim10Rank(ca), rb = cim10Rank(cb);
    if (ra !== rb) return ra - rb;
    return ca < cb ? -1 : 1;
  }
  return 0;
}

function cim10NormalizeId(id) {
  if (id == null) return id;
  const s = String(id);
  if (s === 'fav' || s.indexOf('ch:') === 0 || s.indexOf('bl:') === 0) return s;
  return s.toUpperCase();
}

function cim10InRange(code3, range) { return range[0] <= code3 && code3 <= range[1]; }

// Préfixes décroissants d'un code, jusqu'à la catégorie (3 caractères), un
// point final retiré à chaque étape — règle du plus long préfixe existant
// (D-C4). La catégorie sert de filet : elle existe toujours une fois
// matérialisée (voir buildCim10Index, §parents).
function cim10StripCandidates(code) {
  const out = [];
  for (let L = code.length - 1; L >= 3; L--) {
    let cand = code.slice(0, L);
    if (cand.charAt(cand.length - 1) === '.') cand = cand.slice(0, -1);
    out.push(cand);
  }
  return out;
}

function cim10WordMatches(word, tok) {
  if (word.indexOf(tok) === 0) return true;
  // pluriel léger : « otites » retrouve aussi « otite »
  if (tok.length > 4 && /[sx]$/.test(tok)) return word.indexOf(tok.slice(0, -1)) === 0;
  return false;
}

// Classe de correspondance (plus petit = meilleur), voir le tableau en tête
// de conception : 0 code exact, 1 préfixe de code, 2 libellé == requête,
// 3 chaque token commence un mot ET le 1er mot correspond au 1er token,
// 4 chaque token commence un mot (sans contrainte d'ordre), 5 sous-chaîne.
function cim10MatchNode(n, qTokens, isCode, qk) {
  if (isCode) {
    if (n.ck === qk) return { cls: 0, on: 'code' };
    if (n.ck.indexOf(qk) === 0) return { cls: 1, on: 'code' };
  }
  function tryLabel(tok, on) {
    if (!qTokens.length || !tok.length) return null;
    if (tok.join(' ') === qTokens.join(' ')) return { cls: 2, on: on };
    if (qTokens.every(function (t) { return tok.some(function (w) { return cim10WordMatches(w, t); }); })) {
      return cim10WordMatches(tok[0], qTokens[0]) ? { cls: 3, on: on } : { cls: 4, on: on };
    }
    if (qTokens.every(function (t) { return tok.some(function (w) { return w.indexOf(t) !== -1; }); })) return { cls: 5, on: on };
    return null;
  }
  const byAlias = n.aliasTok ? tryLabel(n.aliasTok, 'alias') : null;
  const byLabel = tryLabel(n.tok, 'libelle');
  if (byAlias && byLabel) return byAlias.cls <= byLabel.cls ? byAlias : byLabel;
  return byAlias || byLabel;
}

// ---------------------------------------------------------
// buildCim10Index — fonction pure : (rows du fichier plat, hier du fichier
// de hiérarchie) -> API de navigation et de recherche. Aucun état global,
// aucune dépendance à `window` : c'est ce qui la rend testable directement.
// ---------------------------------------------------------
function buildCim10Index(rows, hier) {
  const byId = new Map();
  const warnings = [];
  function mk(row) { byId.set(row.id, row); return row; }

  // 1. Chapitres — libellés déjà sourcés (git 89f60b0^), fiables tels quels.
  const chapters = (hier.chapters || []).map(function (c) {
    return mk({
      kind: 'chapter', id: 'ch:' + c.id, code: null, range: c.range, roman: c.id,
      libelle: c.libelle, alias: null, generic: false, frequent: false,
      crumb: 'Chapitre ' + c.id, parentId: null, childIds: [], selectable: false,
    });
  });

  // 2. Blocs, liés à leur chapitre par comparaison de plages.
  const blocks = (hier.blocks || []).map(function (b) {
    const range = b.range, id = 'bl:' + range.join('-');
    const chapter = chapters.filter(function (c) { return cim10InRange(range[0], c.range) && cim10InRange(range[1], c.range); })[0];
    if (!chapter) warnings.push({ id: id, reason: 'bloc hors chapitre' });
    return mk({
      kind: 'block', id: id, code: null, range: range, roman: null,
      libelle: b.libelle, alias: null, generic: false, frequent: false,
      crumb: range[0] + '-' + range[1], parentId: chapter ? chapter.id : null, childIds: [], selectable: false,
    });
  });
  chapters.forEach(function (c) {
    c.childIds = blocks.filter(function (b) { return b.parentId === c.id; })
      .map(function (b) { return b.id; })
      .sort(function (x, y) { return byId.get(x).range[0] < byId.get(y).range[0] ? -1 : 1; });
  });

  // 3. Libellés officiels connus par code : fichier plat (hors génériques),
  // puis parents et ajouts du fichier de hiérarchie (le premier gagne).
  const officialLabel = new Map();
  (rows || []).forEach(function (r) { if (!r.generic && !officialLabel.has(r.code)) officialLabel.set(r.code, r.libelle); });
  (hier.parents || []).forEach(function (r) { if (!officialLabel.has(r.code)) officialLabel.set(r.code, r.libelle); });
  (hier.ajouts || []).forEach(function (r) { if (!officialLabel.has(r.code)) officialLabel.set(r.code, r.libelle); });

  // 4. Codes sélectionnables : fichier plat (hors génériques) + ajouts +
  // catégories/intermédiaires matérialisés dans `parents`.
  const codeSet = new Set();
  (rows || []).forEach(function (r) { if (!r.generic) codeSet.add(r.code); });
  (hier.ajouts || []).forEach(function (r) { codeSet.add(r.code); });
  (hier.parents || []).forEach(function (r) { codeSet.add(r.code); });

  const codeNodes = new Map();
  codeSet.forEach(function (code) {
    const kind = code.length === 3 ? 'category' : 'code';
    const row = {
      kind: kind, id: code, code: code, range: null, roman: null,
      libelle: officialLabel.get(code) || code, alias: null, generic: false, frequent: false,
      crumb: code, parentId: null, childIds: [], selectable: true, level: null, canRefine: false,
    };
    codeNodes.set(code, row);
    byId.set(code, row);
  });

  // 5. Lien parent (D-C4) : une catégorie va dans le bloc dont la plage la
  // contient ; tout autre code va dans le plus long préfixe existant.
  codeNodes.forEach(function (node, code) {
    if (node.kind === 'category') {
      const b = blocks.filter(function (bl) { return cim10InRange(code, bl.range); })[0];
      if (b) { node.parentId = b.id; return; }
      const ch = chapters.filter(function (c) { return cim10InRange(code, c.range); })[0];
      warnings.push({ code: code, reason: 'catégorie sans bloc' });
      node.parentId = ch ? ch.id : null;
      return;
    }
    const cands = cim10StripCandidates(code);
    for (let i = 0; i < cands.length; i++) {
      if (cands[i] !== code && codeNodes.has(cands[i])) { node.parentId = cands[i]; return; }
    }
    warnings.push({ code: code, reason: 'code sans parent' });
  });

  // 6. childIds, triés (mêmes règles pour les blocs et les codes).
  codeNodes.forEach(function (node) {
    if (!node.parentId) return;
    const parent = byId.get(node.parentId);
    if (parent) parent.childIds.push(node.id);
  });
  blocks.forEach(function (b) { b.childIds.sort(cmpCim10Code); });
  codeNodes.forEach(function (node) { node.childIds.sort(cmpCim10Code); });

  // 7. Génériques (parapluies) : posés en alias sur le nœud officiel du même
  // code — jamais de nœud dupliqué. Racine virtuelle « Fréquents » : les 7
  // génériques dans l'ordre du fichier, puis le reste de `frequents` dans
  // l'ordre de la liste (dédoublonné : plusieurs génériques y figurent déjà).
  const favIds = [];
  (rows || []).forEach(function (r) {
    if (!r.generic) return;
    const n = byId.get(r.code);
    if (!n) { warnings.push({ code: r.code, reason: 'alias sans code officiel' }); return; }
    n.alias = r.libelle; n.generic = true;
    favIds.push(n.id);
  });
  (hier.frequents || []).forEach(function (code) {
    const n = byId.get(code);
    if (!n) { warnings.push({ code: code, reason: 'code fréquent introuvable' }); return; }
    n.frequent = true;
    if (favIds.indexOf(n.id) === -1) favIds.push(n.id);
  });
  const favRoot = mk({
    kind: 'group', id: 'fav', code: null, range: null, roman: null,
    libelle: 'Fréquents', alias: null, generic: false, frequent: false,
    crumb: 'Fréquents', parentId: null, childIds: favIds.slice(), selectable: false,
  });

  // 8. Profondeur, hasChildren/childCount, puis descCount de bas en haut.
  function depthOf(id) { let d = 0, n = byId.get(id); while (n && n.parentId) { d++; n = byId.get(n.parentId); } return d; }
  byId.forEach(function (n) { n.depth = depthOf(n.id); n.hasChildren = n.childIds.length > 0; n.childCount = n.childIds.length; });
  const byDepthDesc = Array.from(byId.values()).sort(function (a, b) { return b.depth - a.depth; });
  byDepthDesc.forEach(function (n) {
    n.descCount = n.childIds.reduce(function (acc, cid) {
      const c = byId.get(cid);
      return acc + (c.selectable ? 1 : 0) + (c.descCount || 0);
    }, 0);
  });

  // 9. Niveau (D-C6) : 'category' seulement pour une catégorie qui a des
  // enfants ; 'code' sinon, y compris les catégories-feuilles. canRefine
  // couvre aussi un code de 4+ caractères qui a lui-même des enfants
  // (ex. M08.4 -> M08.45).
  codeNodes.forEach(function (n) {
    n.canRefine = n.hasChildren;
    n.level = (n.kind === 'category' && n.hasChildren) ? 'category' : 'code';
  });
  // Un chapitre ou un bloc se choisit tel quel (définition générale d'un
  // diagnostic : un nom, sans code), puis se précise. Ils ne sont PAS
  // `selectable` — ce champ reste réservé aux vrais codes (stats, descCount,
  // recherche) — mais `pickable` : c'est ce que lit le sélecteur /dx.
  chapters.concat(blocks).forEach(function (g) {
    g.pickable = true;
    g.canRefine = g.hasChildren;
    g.level = g.kind; // 'chapter' | 'block'
  });

  // Chapitre/bloc sans aucun descendant sélectionnable : ne devrait pas
  // arriver avec les données livrées, signalé sans jamais planter.
  chapters.concat(blocks).forEach(function (n) { if (n.descCount === 0) warnings.push({ id: n.id, reason: 'sans code (bloc/chapitre vide)' }); });

  const roots = [favRoot].concat(chapters.filter(function (c) { return c.descCount > 0; }));

  // Préparation de la recherche : tokens, code sans point, racine de 3
  // caractères, indicateur « sans précision » (bonus de tri).
  const selectable = Array.from(codeNodes.values());
  selectable.forEach(function (n) {
    let tok = tokensCim10(n.libelle).filter(function (t) { return !CIM10_STOP.has(t); });
    if (!tok.length) tok = tokensCim10(n.libelle);
    n.tok = tok;
    if (n.alias) {
      let aliasTok = tokensCim10(n.alias).filter(function (t) { return !CIM10_STOP.has(t); });
      if (!aliasTok.length) aliasTok = tokensCim10(n.alias);
      n.aliasTok = aliasTok;
    } else n.aliasTok = null;
    n.ck = n.code.toLowerCase().replace(/\./g, '');
    n.catCode = n.code.slice(0, 3);
    n.unspec = /^[A-Z]\d\d\.9$/.test(n.code);
  });

  // ---- vues (rowView) : forme livrée à l'appelant (D-C8) ----
  function pathAncestors(id) {
    const out = []; let n = byId.get(id); n = n && n.parentId ? byId.get(n.parentId) : null;
    while (n) { out.unshift({ id: n.id, kind: n.kind, crumb: n.crumb, libelle: n.libelle }); n = n.parentId ? byId.get(n.parentId) : null; }
    return out;
  }
  function rowView(n, extra) {
    if (!n) return null;
    const preferAlias = !!(extra && extra.preferAlias);
    const base = {
      kind: n.kind, id: n.id, code: n.code, range: n.range, roman: n.roman,
      libelle: n.libelle, alias: n.alias || null,
      label: (preferAlias && n.alias) ? n.alias : n.libelle,
      crumb: n.crumb, hasChildren: n.hasChildren, childCount: n.childCount, descCount: n.descCount,
      selectable: n.selectable, pickable: !!(n.selectable || n.pickable),
      level: n.level || null, canRefine: n.canRefine, depth: n.depth,
      path: pathAncestors(n.id),
    };
    return extra ? Object.assign(base, {
      matched: extra.matched, matchedOn: extra.matchedOn || null,
      matchCount: extra.matchCount, hiddenCount: extra.hiddenCount, score: extra.score,
    }) : base;
  }

  function node(idOrCode) { return rowView(byId.get(cim10NormalizeId(idOrCode))); }
  function children(id) {
    if (id == null || id === 'root' || id === '') return roots.map(function (n) { return rowView(n); });
    const n = byId.get(cim10NormalizeId(id));
    if (!n) return [];
    const preferAlias = n.id === 'fav';
    return n.childIds.map(function (cid) { return rowView(byId.get(cid), preferAlias ? { preferAlias: true } : null); });
  }
  function parentOf(idOrCode) {
    const id = cim10NormalizeId(idOrCode);
    const n = byId.get(id);
    if (n) return n.parentId ? rowView(byId.get(n.parentId)) : null;
    const cands = cim10StripCandidates(id);
    for (let i = 0; i < cands.length; i++) {
      if (cands[i] !== id && byId.has(cands[i])) return rowView(byId.get(cands[i]));
    }
    return null;
  }
  function resolveNode(idOrCode) {
    const id = cim10NormalizeId(idOrCode);
    if (byId.has(id)) return byId.get(id);
    const cands = cim10StripCandidates(id);
    for (let i = 0; i < cands.length; i++) { if (byId.has(cands[i])) return byId.get(cands[i]); }
    return null;
  }
  function ancestors(code) {
    const n = resolveNode(code);
    if (!n) return [];
    const out = []; let p = n.parentId ? byId.get(n.parentId) : null;
    while (p) { out.push(rowView(p)); p = p.parentId ? byId.get(p.parentId) : null; }
    return out;
  }
  function path(code) {
    const n = resolveNode(code);
    if (!n) return [];
    const chain = []; let cur = n;
    while (cur) { chain.unshift({ id: cur.id, kind: cur.kind, crumb: cur.crumb, libelle: cur.libelle, code: cur.code }); cur = cur.parentId ? byId.get(cur.parentId) : null; }
    return chain;
  }
  function levelOf(id) { const n = byId.get(cim10NormalizeId(id)); return n ? (n.level || null) : null; }
  function canRefine(id) { const n = byId.get(cim10NormalizeId(id)); return !!(n && n.canRefine); }

  let searchMemo = null;
  function emptyResult(q, opts, extra) {
    return Object.assign({
      query: q, within: (opts && opts.within) || null, rows: [], total: 0,
      groups: 0, shownGroups: 0, moreGroups: 0, truncated: false, tooShort: false, pending: false, error: null,
    }, extra || {});
  }
  function search(q, opts) {
    opts = opts || {};
    const qn = normCim10(q || '').trim();
    if (qn.length < 2) return emptyResult(q, opts, { tooShort: true });
    const key = qn + '\u0001' + (opts.within || '') + '\u0001' + (opts.maxGroups || '') + '\u0001' + (opts.limitPerGroup || '');
    if (searchMemo && searchMemo.key === key) return searchMemo.value;

    let qt = tokensCim10(qn).filter(function (t) { return !CIM10_STOP.has(t); });
    if (!qt.length) qt = tokensCim10(qn);
    const compact = qn.replace(/\s+/g, '');
    const isCode = CIM10_CODE_Q.test(compact);
    const qk = compact.replace(/\./g, '');

    const scopeNode = opts.within ? byId.get(cim10NormalizeId(opts.within)) : null;
    const scopeIsFlat = !!scopeNode && (scopeNode.kind === 'category' || scopeNode.kind === 'code');
    function within(n, scope) {
      let cur = n;
      while (cur) { if (cur.id === scope.id) return true; cur = cur.parentId ? byId.get(cur.parentId) : null; }
      return false;
    }
    const matches = [];
    for (let i = 0; i < selectable.length; i++) {
      const n = selectable[i];
      if (scopeNode) { if (n.id === scopeNode.id || !within(n, scopeNode)) continue; }
      const m = cim10MatchNode(n, qt, isCode, qk);
      if (!m) continue;
      const score = m.cls - (m.on === 'alias' ? 1.5 : 0) - (n.frequent ? 1 : 0) + 1.5 * Math.max(0, n.depth - 2) - (n.unspec ? 0.2 : 0);
      matches.push({ node: n, on: m.on, score: score });
    }
    matches.sort(function (a, b) {
      if (a.score !== b.score) return a.score - b.score;
      return cmpCim10Code(a.node.code, b.node.code);
    });

    const rows = [];
    let total = matches.length, groups = 0, shownGroups = 0, moreGroups = 0;
    if (scopeIsFlat) {
      matches.slice(0, 30).forEach(function (m) { rows.push(rowView(m.node, { matched: true, matchedOn: m.on, score: m.score })); });
      groups = shownGroups = rows.length ? 1 : 0;
    } else {
      const byCat = new Map();
      matches.forEach(function (m) {
        const cc = m.node.catCode;
        let g = byCat.get(cc);
        if (!g) { g = { cat: byId.get(cc), catMatch: null, codes: [] }; byCat.set(cc, g); }
        if (m.node.kind === 'category') g.catMatch = m; else g.codes.push(m);
      });
      const allGroups = Array.from(byCat.values()).sort(function (a, b) {
        const as = a.catMatch ? a.catMatch.score : Math.min.apply(null, a.codes.map(function (c) { return c.score; }));
        const bs = b.catMatch ? b.catMatch.score : Math.min.apply(null, b.codes.map(function (c) { return c.score; }));
        return as - bs;
      });
      groups = allGroups.length;
      const maxGroups = opts.maxGroups || 6;
      const shown = allGroups.slice(0, maxGroups);
      shownGroups = shown.length;
      moreGroups = Math.max(0, groups - shownGroups);
      const K = opts.limitPerGroup || (shown.length === 1 ? 8 : shown.length === 2 ? 4 : 2);
      shown.forEach(function (g) {
        if (!g.cat) return;
        rows.push(rowView(g.cat, {
          matched: !!g.catMatch, matchedOn: g.catMatch ? g.catMatch.on : null,
          matchCount: g.codes.length, hiddenCount: Math.max(0, g.codes.length - K),
        }));
        g.codes.slice(0, K).forEach(function (m) { rows.push(rowView(m.node, { matched: true, matchedOn: m.on, score: m.score })); });
      });
    }
    const truncated = moreGroups > 0 || rows.some(function (r) { return r.hiddenCount > 0; });
    const value = {
      query: q, within: opts.within || null, rows: rows, total: total,
      groups: groups, shownGroups: shownGroups, moreGroups: moreGroups,
      truncated: truncated, tooShort: false, pending: false, error: null,
    };
    searchMemo = { key: key, value: value };
    return value;
  }

  return {
    node: node, roots: function () { return roots.map(function (n) { return rowView(n); }); },
    children: children, parent: parentOf, ancestors: ancestors, path: path,
    resolve: function (code) { return rowView(resolveNode(code)); },
    levelOf: levelOf, canRefine: canRefine, search: search,
    stats: function () { return { selectable: selectable.length, chapters: chapters.length, blocks: blocks.length, warnings: warnings }; },
  };
}

// ---------------------------------------------------------
// Façade window.CIM10 — enveloppe buildCim10Index, gère le chargement
// asynchrone (Note Clinique.html) et se reconstruit si CIM10_DATA change de
// référence (rechargement, données de test remplacées).
// ---------------------------------------------------------
let _cim10Instance = null;
let _cim10BuiltFrom = null;

function cim10Ensure() {
  const data = window.CIM10_DATA, hier = window.CIM10_HIERARCHY;
  if (!data || !hier) return null;
  if (_cim10Instance && _cim10BuiltFrom === data) return _cim10Instance;
  _cim10Instance = buildCim10Index(data, hier);
  _cim10BuiltFrom = data;
  return _cim10Instance;
}

const CIM10 = {
  ready: function () { return !!cim10Ensure(); },
  status: function () { if (window.CIM10_ERROR) return 'error'; return cim10Ensure() ? 'ready' : 'loading'; },
  whenReady: function (cb) {
    if (cim10Ensure()) { cb(); return; }
    if (typeof window.addEventListener !== 'function') return; // pas de DOM (tests)
    function onReady() { window.removeEventListener('cim10:ready', onReady); cb(); }
    window.addEventListener('cim10:ready', onReady);
  },
  node: function (id) { const ix = cim10Ensure(); return ix ? ix.node(id) : null; },
  roots: function () { const ix = cim10Ensure(); return ix ? ix.roots() : []; },
  children: function (id) { const ix = cim10Ensure(); return ix ? ix.children(id) : []; },
  parent: function (id) { const ix = cim10Ensure(); return ix ? ix.parent(id) : null; },
  ancestors: function (code) { const ix = cim10Ensure(); return ix ? ix.ancestors(code) : []; },
  path: function (code) { const ix = cim10Ensure(); return ix ? ix.path(code) : []; },
  resolve: function (code) { const ix = cim10Ensure(); return ix ? ix.resolve(code) : null; },
  levelOf: function (id) { const ix = cim10Ensure(); return ix ? ix.levelOf(id) : null; },
  canRefine: function (id) { const ix = cim10Ensure(); return ix ? ix.canRefine(id) : false; },
  search: function (q, opts) {
    const ix = cim10Ensure();
    if (ix) return ix.search(q, opts);
    return { query: q, within: (opts && opts.within) || null, rows: [], total: 0, groups: 0, shownGroups: 0, moreGroups: 0, truncated: false, tooShort: false, pending: true, error: window.CIM10_ERROR || null };
  },
  stats: function () { const ix = cim10Ensure(); return ix ? ix.stats() : null; },
};

Object.assign(window, { buildCim10Index: buildCim10Index, normCim10: normCim10, tokensCim10: tokensCim10, cmpCim10Code: cmpCim10Code, cim10CountLabel: cim10CountLabel, CIM10: CIM10 });
