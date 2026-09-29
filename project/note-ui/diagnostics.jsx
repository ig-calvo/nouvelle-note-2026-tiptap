/* global window */
// =========================================================
// diagnostics.jsx — modèle pur des diagnostics de la note : fils (un
// diagnostic peut apparaître plusieurs fois dans la même note, en Détails
// comme en Conclusion, sous la même dxKey et le même numéro — voir R3),
// constructeur des attributs de région (Reprendre/Remplacer/Cesser — R4),
// et pont déclaratif avec le Sommaire (Documenter comme Problème/Antécédent
// — R1/D1, Cesser -> Antécédent résolu — D2, Remplacer -> renomme la ligne
// liée — D3).
//
// Fichier pur (aucun JSX, aucun DOM, aucune dépendance à Tiptap) : testable
// tel quel par le harnais, comme note-sections.jsx. La numérotation par
// décorations ProseMirror (le seul endroit qui doit connaître le doc
// « vivant » de l'éditeur) vit dans editor-schema.jsx, qui appelle
// diagnosticThreads ci-dessous à chaque transaction.
//
// _dxSeq / newDiagId vivent ici (déménagés depuis editor-schema.jsx) : c'est
// le seul fichier que prepareDiagDoc (qui doit recaler ce compteur) et le
// constructeur de région (qui doit le lire) partagent tous les deux.
// =========================================================

let _dxSeq = 1;
function newDiagId() { return 'd' + _dxSeq++; }

// ---------------------------------------------------------
// Parcours du document — un ProseMirror Node (descendants/forEach/nodeSize)
// ou un JSON Tiptap ({type, content:[...]}) donnent la MÊME suite d'appels,
// dans le même ordre : c'est ce qui garantit que la numérotation calculée
// sur le doc vivant de l'éditeur et celle calculée sur une note complétée
// (JSON) tombent toujours d'accord.
// ---------------------------------------------------------
function dxIsPmNode(x) { return !!(x && x.type && typeof x.type === 'object' && typeof x.forEach === 'function'); }

// cb({kind:'region'|'ref', attrs, pos, nodeSize, zone}) — pos/nodeSize valent
// null en JSON (pas de position à donner hors de l'éditeur).
function dxWalkDoc(doc, cb) {
  let zone = 'details';
  if (dxIsPmNode(doc)) {
    doc.forEach(function (node, offset) {
      if (node.type.name === 'sectionSplit') { zone = 'conclusion'; return; }
      if (node.type.name === 'diagnosticRegion') cb({ kind: 'region', attrs: node.attrs, pos: offset, nodeSize: node.nodeSize, zone: zone });
      node.descendants(function (n, p) {
        if (n.type.name === 'diagnosticRef') cb({ kind: 'ref', attrs: n.attrs, pos: offset + 1 + p, nodeSize: n.nodeSize, zone: zone });
      });
    });
    return;
  }
  (doc && doc.content || []).forEach(function (top) {
    if (!top) return;
    if (top.type === 'sectionSplit') { zone = 'conclusion'; return; }
    if (top.type === 'diagnosticRegion') cb({ kind: 'region', attrs: top.attrs || {}, pos: null, nodeSize: null, zone: zone });
    (function walkInline(n) {
      (n.content || []).forEach(function (child) {
        if (child.type === 'diagnosticRef') cb({ kind: 'ref', attrs: child.attrs || {}, pos: null, nodeSize: null, zone: zone });
        walkInline(child);
      });
    })(top);
  });
}

// Même parcours, mais sur un JSON qu'on mutera en place (prepareDiagDoc,
// rebaseDiagDocForNewNote) — pose attrs:{} si absent pour pouvoir y écrire.
function dxWalkDocMutable(doc, cb) {
  (doc && doc.content || []).forEach(function (top) {
    if (!top) return;
    (function walk(n) {
      if (n.type === 'diagnosticRegion') { n.attrs = n.attrs || {}; cb(n); }
      (n.content || []).forEach(walk);
    })(top);
  });
}

// ---------------------------------------------------------
// Normalisation des attributs d'une région — valeurs par défaut (§1.1 du
// plan) et migration de l'ancien promotedAt/promotedBy (avant cette
// fonctionnalité, « Promouvoir en problème » ne posait que ces deux attrs).
// ---------------------------------------------------------
function normalizeDiagAttrs(attrs) {
  const a = attrs || {};
  const legacyDocumented = a.promotedAt ? 'probleme' : null;
  return {
    id: a.id || null,
    dxKey: a.dxKey || null,
    name: a.name || 'Diagnostic',
    code: a.code || null,
    level: a.level || null,
    source: a.source || null,
    sommaireId: a.sommaireId || null,
    documentAs: a.documentAs || legacyDocumented,
    status: a.status === 'cesse' ? 'cesse' : 'actif',
    replaces: a.replaces || null,
    documentedAt: a.documentedAt || a.promotedAt || null,
    documentedBy: a.documentedBy || a.promotedBy || null,
    createdAt: a.createdAt || null,
  };
}

// ---------------------------------------------------------
// Fils de diagnostics — une dxKey = un numéro, attribué à sa première
// occurrence dans l'ordre du document (Détails puis Conclusion). L'état
// « effectif » (nom, code, documentation, statut…) vient de l'occurrence la
// PLUS RÉCENTE (createdAt), pas de la dernière dans le document : une région
// Cessé glissée au-dessus d'une ancienne mention doit quand même l'emporter.
// ---------------------------------------------------------
// Occurrence la plus récente d'une liste, même règle que dxWinningOccurrence
// (createdAt décroissant ; horodatage absent d'un côté : le dernier du
// document — donc de `list` — gagne). Factorisé pour être réutilisé sur un
// sous-ensemble d'occurrences (dxEffective, pour `replaces`) sans dupliquer
// la règle de récence.
function dxMostRecent(list) {
  let win = list[0];
  for (let i = 1; i < list.length; i++) {
    const o = list[i], a = o.attrs.createdAt, b = win.attrs.createdAt;
    if (a && b) { if (a >= b) win = o; } else win = o;
  }
  return win;
}

function dxWinningOccurrence(occurrences) {
  return dxMostRecent(occurrences);
}

function dxEffective(t) {
  const occs = t.occurrences;
  const win = dxWinningOccurrence(occs);
  // Le `replaces` non nul le plus RÉCENT (même règle de récence que win, pas
  // l'ordre du document) l'emporte, pas seulement celui de l'occurrence
  // gagnante : un Reprendre après un Remplacer remet replaces à null sur SA
  // PROPRE occurrence (il ne doit rien changer à l'état effectif), mais
  // « remplace : X » doit continuer à s'afficher. Prendre le dernier replaces
  // dans l'ordre du DOCUMENT (au lieu de createdAt) était un bogue : un 2e
  // Remplacer posé dans les Détails après un 1er déjà en Conclusion (la
  // Conclusion est toujours physiquement après, même écrite avant) affichait
  // alors le mauvais prédécesseur — trouvé en testant, voir diagnostics.test.mjs.
  const withReplaces = occs.filter(function (o) { return !!o.attrs.replaces; });
  const replaces = withReplaces.length ? dxMostRecent(withReplaces).attrs.replaces : null;
  return {
    dxKey: t.dxKey, number: t.number,
    name: win.attrs.name, code: win.attrs.code || null, level: win.attrs.level || null,
    source: win.attrs.source || null, sommaireId: win.attrs.sommaireId || null,
    documentAs: win.attrs.documentAs || null, status: win.attrs.status || 'actif',
    documentedAt: win.attrs.documentedAt || null, documentedBy: win.attrs.documentedBy || null,
    replaces: replaces,
    firstId: occs[0].id, lastId: occs[occs.length - 1].id,
    count: occs.length,
    zones: Array.from(new Set(occs.map(function (o) { return o.zone; }))),
  };
}

function diagnosticThreads(doc) {
  const byId = {};
  const threadsByKey = new Map();
  const order = [];
  const refs = [];

  dxWalkDoc(doc, function (item) {
    if (item.kind === 'ref') { refs.push(item); return; }
    const a = normalizeDiagAttrs(item.attrs);
    const key = a.dxKey || ('n:' + a.id);
    let t = threadsByKey.get(key);
    if (!t) { t = { dxKey: key, occurrences: [] }; threadsByKey.set(key, t); order.push(key); }
    t.occurrences.push({ id: a.id, pos: item.pos, nodeSize: item.nodeSize, zone: item.zone, attrs: a });
  });

  const threads = order.map(function (key, i) {
    const t = threadsByKey.get(key);
    t.number = i + 1;
    t.effective = dxEffective(t);
    t.occurrences.forEach(function (o) { byId[o.id] = { dxKey: key, number: t.number, occurrence: o }; });
    return t;
  });

  const byKey = {};
  threads.forEach(function (t) { byKey[t.dxKey] = t; });

  refs.forEach(function (r) {
    const key = r.attrs.dxKey || (r.attrs.diagId && byId[r.attrs.diagId] && byId[r.attrs.diagId].dxKey) || null;
    r.dxKey = key;
    r.number = (key && byKey[key]) ? byKey[key].number : null;
  });

  return { threads: threads, byKey: byKey, byId: byId, refs: refs };
}

function listDiagnostics(doc) {
  return diagnosticThreads(doc).threads.map(function (t) {
    return { id: t.effective.firstId, dxKey: t.dxKey, number: t.number, name: t.effective.name, status: t.effective.status };
  });
}

// null (non documenté) | 'probleme' | 'antecedent' | 'antecedent-resolu'
// (documenté puis cessé — D2 : la ligne passe aux antécédents, résolue).
function diagPlacement(e) {
  if (!e || !e.documentAs) return null;
  return e.status === 'cesse' ? 'antecedent-resolu' : e.documentAs;
}

// Identité de la ligne du sommaire visée par un fil : son id si le fil est
// lié (venu du sommaire, ou relié depuis), sinon un id stable dérivé de la
// dxKey — stable d'une frappe à l'autre et d'une complétion à l'autre
// (« Depuis la dernière note » retombe sur la même ligne).
function dxSommaireTargetId(e) { return e.sommaireId || ('dx:' + e.dxKey); }

// ---------------------------------------------------------
// Constructeur unique des attributs d'une région diagnostic — la SEULE
// façon d'en créer une (/dx nouveau, Reprendre, Remplacer, Cesser). `target`
// est soit l'effectif d'un fil de la note, soit une ligne du sommaire déjà
// convertie par getSommaireDiagnostics (même forme : dxKey/name/code/level/
// source/sommaireId/documentAs/status/replaces/documentedAt/documentedBy).
// ---------------------------------------------------------
function dxThreadIdentity(t) {
  return {
    dxKey: t.dxKey, name: t.name, code: t.code || null, level: t.level || null, source: t.source || null,
    sommaireId: t.sommaireId || null, documentAs: t.documentAs || null, status: t.status || 'actif',
    documentedAt: t.documentedAt || null, documentedBy: t.documentedBy || null,
  };
}

function makeDiagRegionAttrs(payload, opts) {
  const p = payload || {};
  // Compatibilité : l'ancienne charge utile {__dx:true, name} (texte tapé
  // sans suggestion choisie) équivaut à un nouveau diagnostic en texte
  // libre — le picker (dx-picker.jsx) envoie toujours {action, pick, target}.
  const action = p.action || (p.name != null ? 'nouveau' : null);
  const base = { id: opts.id, createdAt: opts.now, replaces: null };

  if (action === 'nouveau') {
    const pick = p.pick || { source: 'libre', name: p.name };
    const name = (pick.name || '').trim() || 'Diagnostic';
    return Object.assign({}, base, {
      dxKey: 'n:' + opts.id, name: name, code: pick.code || null, level: pick.level || null,
      source: pick.source || 'libre', sommaireId: null, documentAs: null, status: 'actif',
      documentedAt: null, documentedBy: null,
    });
  }

  const target = p.target;
  if (!target) return null;
  const identity = dxThreadIdentity(target);
  const documented = !!identity.documentAs;
  const stamp = documented ? { documentedAt: opts.now, documentedBy: opts.author || null } : {};

  if (action === 'reprendre') {
    // Invariant : Reprendre ne change JAMAIS l'état effectif (même statut, y
    // compris cessé, même documentation) — seul un nouvel id est créé.
    // replaces repart à null : l'effectif retient déjà le dernier replaces
    // non nul de tout le fil (dxEffective), rien n'est perdu à l'affichage.
    return Object.assign({}, base, identity);
  }
  if (action === 'cesser') {
    return Object.assign({}, base, identity, { status: 'cesse' }, stamp);
  }
  if (action === 'remplacer') {
    const pick = p.pick || {};
    const name = (pick.name || '').trim() || 'Diagnostic';
    return Object.assign({}, base, identity, {
      name: name, code: pick.code || null, level: pick.level || null, source: pick.source || 'libre',
      status: 'actif', replaces: { name: target.name, code: target.code || null },
    }, stamp);
  }
  return null;
}

// ---------------------------------------------------------
// Hygiène des documents chargés (brouillon repris, gabarit, dernière note…)
// ---------------------------------------------------------
function prepareDiagDoc(json) {
  const doc = JSON.parse(JSON.stringify(json || { type: 'doc', content: [] }));
  let maxSeq = 0;
  const seenIds = new Set();
  dxWalkDocMutable(doc, function (n) {
    const m = /^d(\d+)$/.exec(n.attrs.id || '');
    if (m) maxSeq = Math.max(maxSeq, +m[1]);
  });
  if (maxSeq >= _dxSeq) _dxSeq = maxSeq + 1;
  dxWalkDocMutable(doc, function (n) {
    let id = n.attrs.id;
    if (!id || seenIds.has(id)) { id = newDiagId(); n.attrs.id = id; }
    seenIds.add(id);
    if (!n.attrs.dxKey) n.attrs.dxKey = 'n:' + id;
    if (n.attrs.promotedAt && !n.attrs.documentAs) {
      n.attrs.documentAs = 'probleme';
      n.attrs.documentedAt = n.attrs.documentedAt || n.attrs.promotedAt;
      n.attrs.documentedBy = n.attrs.documentedBy || n.attrs.promotedBy || null;
    }
    delete n.attrs.promotedAt;
    delete n.attrs.promotedBy;
    if (n.attrs.status !== 'cesse') n.attrs.status = 'actif';
  });
  return doc;
}

// « Depuis la dernière note » : relie chaque région à sa ligne du sommaire
// (par code, ou par nom si aucun des deux n'a de code — dxFindLinkableRow),
// et efface replaces/les horodatages : la nouvelle note ne doit pas prétendre
// avoir documenté quelque chose que la note précédente avait déjà fait.
function rebaseDiagDocForNewNote(json, base) {
  const doc = JSON.parse(JSON.stringify(json || { type: 'doc', content: [] }));
  dxWalkDocMutable(doc, function (n) {
    const a = n.attrs;
    if (!a.sommaireId && base) {
      const found = dxFindLinkableRow(base, { name: a.name, code: a.code || null });
      if (found) a.sommaireId = found.row.id;
    }
    a.replaces = null;
    a.documentedAt = null;
    a.documentedBy = null;
  });
  return doc;
}

// ---------------------------------------------------------
// Renommer / préciser un diagnostic existant — propage à toutes les
// occurrences qui portent la MÊME version (nom+code) que celle éditée, et
// met à jour les mentions « remplace : X » qui pointaient sur cette version.
// `allOccurrences` = TOUTES les régions du document, dans l'ordre (le tri par
// dxKey se fait ici, l'appelant n'a pas à le faire lui-même).
// ---------------------------------------------------------
function dxSameVersion(a, b) { return !!a && !!b && a.name === b.name && (a.code || null) === (b.code || null); }

function diagRelabelPatches(allOccurrences, editedId, to, opts) {
  const edited = (allOccurrences || []).filter(function (o) { return o.id === editedId; })[0];
  if (!edited) return [];
  const key = edited.attrs.dxKey || ('n:' + edited.attrs.id);
  const version = { name: edited.attrs.name, code: edited.attrs.code || null };
  const toVersion = { name: (to.name || '').trim() || version.name, code: to.code != null ? to.code : null };
  if (dxSameVersion(version, toVersion)) return [];
  const documented = !!edited.attrs.documentAs;
  const stamp = (documented && opts) ? { documentedAt: opts.now, documentedBy: opts.author || null } : {};
  const out = [];
  allOccurrences.forEach(function (o) {
    const ok = o.attrs.dxKey || ('n:' + o.attrs.id);
    if (ok !== key) return;
    if (dxSameVersion({ name: o.attrs.name, code: o.attrs.code || null }, version)) {
      out.push({ id: o.id, pos: o.pos, patch: Object.assign({
        name: toVersion.name, code: toVersion.code, level: to.level || null, source: to.source || o.attrs.source || null,
      }, stamp) });
      return;
    }
    if (o.attrs.replaces && dxSameVersion(o.attrs.replaces, version)) {
      out.push({ id: o.id, pos: o.pos, patch: { replaces: { name: toVersion.name, code: toVersion.code } } });
    }
  });
  return out;
}

// « Préciser » : vrai seulement si le code a des enfants dans la CIM-10
// (couvre aussi bien une catégorie qu'un code déjà précis, ex. M08.4 qui a
// lui-même des enfants — voir cim10-index.jsx, D-C6). Avant que l'index ne
// soit chargé, on retombe sur l'attribut `level` posé à la création.
function diagCanRefine(attrs) {
  const a = attrs || {};
  if (!a.code && a.level !== 'chapter' && a.level !== 'block') return false;
  if (window.CIM10 && window.CIM10.ready()) {
    const id = dxRegionCimId(a);
    return !!id && window.CIM10.canRefine(id);
  }
  return a.level === 'category' || a.level === 'chapter' || a.level === 'block';
}

// Nœud CIM-10 d'où « Préciser » / la modification d'une région démarre : son
// code, ou — pour un diagnostic défini par un simple chapitre ou bloc (level
// 'chapter' / 'block', sans code) — l'id du nœud, retrouvé par son libellé
// (unique parmi les blocs comme parmi les chapitres ; le nom d'une région ne
// change qu'avec son level, voir diagRelabelPatches). null pour un texte
// libre, un diagnostic SNOMED, ou tant que la CIM-10 charge.
function dxRegionCimId(region) {
  const r = region || {};
  if (r.source === 'snomed') return null;
  if (r.code) return r.code;
  if ((r.level !== 'chapter' && r.level !== 'block') || !window.CIM10 || !window.CIM10.ready()) return null;
  const chapters = window.CIM10.children('root').filter(function (n) { return n.kind === 'chapter'; });
  if (r.level === 'chapter') {
    const ch = chapters.filter(function (n) { return n.libelle === r.name; })[0];
    return ch ? ch.id : null;
  }
  for (let i = 0; i < chapters.length; i++) {
    const bl = window.CIM10.children(chapters[i].id).filter(function (n) { return n.kind === 'block' && n.libelle === r.name; })[0];
    if (bl) return bl.id;
  }
  return null;
}

// Ce qu'affiche la pastille de code de l'en-tête : le code CIM-10 tel quel,
// l'identifiant SNOMED CT préfixé (un nombre nu ne dit pas de quel système il
// vient), rien pour un texte libre ou un chapitre.
function diagCodeLabel(attrs) {
  const a = attrs || {};
  if (!a.code) return '';
  return a.source === 'snomed' ? ('SNOMED ' + a.code) : a.code;
}

// ---------------------------------------------------------
// Bouton et menu « Documenter comme » (D1) — état dérivé, jamais stocké.
// ---------------------------------------------------------
const DX_DOC_BUTTON = {
  none_unlinked: { mod: 'none', icon: 'add_task', label: 'Documenter', title: 'Documenter ce diagnostic au sommaire' },
  none_linked: { mod: 'none', icon: 'add_task', label: 'Non documenté', title: 'Le sommaire reste tel quel — modifier' },
  probleme: { mod: 'probleme', icon: 'hub', label: 'Problème', title: 'Documenté comme problème — modifier' },
  antecedent: { mod: 'antecedent', icon: 'assignment', label: 'Antécédent', title: 'Documenté comme antécédent — modifier' },
  'antecedent-resolu': { mod: 'antecedent', icon: 'assignment', label: 'Antécédent · résolu', title: 'Cessé : classé aux antécédents — modifier' },
};
function diagDocButton(placement, linked) {
  const key = placement || (linked ? 'none_linked' : 'none_unlinked');
  return DX_DOC_BUTTON[key] || DX_DOC_BUTTON.none_unlinked;
}

function diagDocMenuItems(ctx) {
  const c = ctx || {};
  const documentAs = c.documentAs || null, ceased = !!c.ceased, linked = !!c.linked, baseKind = c.baseKind || null;
  function desc(kind, already) {
    if (documentAs === kind) return already ? ('Déjà ' + (kind === 'probleme' ? 'aux problèmes' : 'aux antécédents') + ' du sommaire')
      : ('Ajouté aux ' + (kind === 'probleme' ? 'problèmes' : 'antécédents') + ' du sommaire');
    return documentAs ? ('Déplacer vers les ' + (kind === 'probleme' ? 'problèmes' : 'antécédents'))
      : ('Ajouter aux ' + (kind === 'probleme' ? 'problèmes' : 'antécédents') + ' du sommaire');
  }
  return [
    { value: 'probleme', icon: 'hub', label: 'Problème', selected: documentAs === 'probleme' && !ceased,
      disabled: ceased, desc: ceased ? 'Diagnostic cessé dans cette note' : desc('probleme', baseKind === 'problems') },
    { value: 'antecedent', icon: 'assignment', label: ceased ? 'Antécédent · résolu' : 'Antécédent',
      selected: documentAs === 'antecedent' || ceased, disabled: false,
      desc: ceased ? 'Classé aux antécédents, résolu' : desc('antecedent', baseKind === 'history') },
    { value: null, icon: 'remove_done', label: 'Non documenté', selected: !documentAs, disabled: false,
      desc: linked ? 'Laisser le sommaire tel quel' : (documentAs ? 'Retirer du sommaire' : 'Ne pas ajouter au sommaire') },
  ];
}

// ---------------------------------------------------------
// Sommaire — données de démo (E4) et pont déclaratif avec la note.
// Les champs suivent SECTION_CFG / data.problems / data.history de
// Summary.jsx (le seul Sommaire réellement monté, voir NoteEditor.jsx).
// ---------------------------------------------------------
const DX_SOMMAIRE_SEED = {
  problems: [
    { id: 'som-asthme', name: 'Asthme léger', code: 'J45.9', since: '2018' },
    { id: 'som-rhinite', name: 'Rhinite allergique', code: 'J30.4', since: '2019' },
  ],
  history: [
    { id: 'som-colique', name: 'Colique néphrétique', code: 'N23', status: 'resolu', resolvedOn: '02/07/2026' },
    { id: 'som-cystite', name: 'Cystite aiguë non compliquée', code: 'N30.0', status: 'resolu', resolvedOn: '08/12/2025' },
  ],
};
function sommaireDxSeed() { return JSON.parse(JSON.stringify(DX_SOMMAIRE_SEED)); }

function dxFindRow(base, id) {
  const secs = ['problems', 'history'];
  for (let s = 0; s < secs.length; s++) {
    const arr = (base && base[secs[s]]) || [];
    for (let i = 0; i < arr.length; i++) if (arr[i].id === id) return { section: secs[s], index: i, row: arr[i] };
  }
  return null;
}
function dxNormName(s) { return (s || '').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
// Retrouve une ligne déjà au sommaire par code, ou par nom normalisé quand
// ni l'une ni l'autre n'a de code — pour qu'un pick CIM-10 ou un texte libre
// qui correspond déjà à une ligne du dossier ne crée pas un doublon.
function dxFindLinkableRow(base, e) {
  const secs = ['problems', 'history'];
  for (let s = 0; s < secs.length; s++) {
    const arr = (base && base[secs[s]]) || [];
    for (let i = 0; i < arr.length; i++) {
      const r = arr[i];
      if (e.code && r.code && r.code === e.code) return { section: secs[s], index: i, row: r };
      if (!e.code && !r.code && dxNormName(r.name) === dxNormName(e.name)) return { section: secs[s], index: i, row: r };
    }
  }
  return null;
}

function dxSommaireRowToTarget(r, kind) {
  return {
    kind: 'sommaire', dxKey: 'som:' + r.id, sommaireId: r.id, name: r.name, code: r.code || null, level: null,
    source: 'sommaire', documentAs: kind, status: 'actif', replaces: null, documentedAt: null, documentedBy: null,
    sommaireKind: kind, sommaireStatus: r.status || null,
    meta: r.since ? ('Depuis ' + r.since) : (r.resolvedOn ? ('Résolu le ' + r.resolvedOn) : null),
  };
}
// Base du dossier (sans la superposition de la note en cours), lue depuis le
// pont posé par Summary.jsx (window.__SOMMAIRE_DX_BASE) — voir Summary.jsx.
// Retombe sur les données de démo tant que le Sommaire n'a rien publié.
function getSommaireDiagnostics() {
  const base = window.__SOMMAIRE_DX_BASE || sommaireDxSeed();
  const rows = [];
  (base.problems || []).forEach(function (r) { rows.push(dxSommaireRowToTarget(r, 'probleme')); });
  (base.history || []).forEach(function (r) { rows.push(dxSommaireRowToTarget(r, 'antecedent')); });
  return rows;
}

function fmtSommaireDate(v) {
  if (!v) return '';
  const d = (v instanceof Date) ? v : new Date(v);
  if (isNaN(d.getTime())) return '';
  const pad = function (n) { return n < 10 ? '0' + n : '' + n; };
  return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear();
}

function dxPendingNote(change, prev) {
  switch (change) {
    case 'ajout': return 'Ajouté par la note en cours';
    case 'deplace': return 'Déplacé par la note en cours';
    case 'resolu': return 'Cessé dans la note en cours';
    case 'remplace': return prev ? ('Remplace « ' + prev.name + ' » (note en cours)') : 'Remplacé (note en cours)';
    case 'modifie': return 'Code modifié par la note en cours';
    default: return null;
  }
}

// Fusion déclarative : base du dossier + état effectif des fils documentés
// de la note en cours -> vue avec lignes « en attente » (E2). Ni la base ni
// `threads` ne sont mutés ; supprimer une région dans la note et rappeler
// cette fonction fait donc revenir la ligne à son état d'origine.
function mergeSommaireDx(base, threads, opts) {
  const today = (opts && opts.today) || fmtSommaireDate(new Date());
  const resolved = [];

  (threads || []).forEach(function (e) {
    const placement = diagPlacement(e);
    if (!placement) return; // E3 : non documenté = la note ne touche pas au sommaire
    const found = e.sommaireId ? dxFindRow(base, e.sommaireId) : dxFindLinkableRow(base, e);
    const targetId = e.sommaireId || (found ? found.row.id : ('dx:' + e.dxKey));
    const prev = found ? found.row : null;
    const prevSection = found ? found.section : null;
    const section = placement === 'probleme' ? 'problems' : 'history';
    const codeChanged = !!prev && (prev.code || null) !== (e.code || null);
    const relabel = !prev || codeChanged || !!e.replaces; // A4 : un renommage libre seul ne relabel pas la ligne liée
    const resolvedFlag = placement === 'antecedent-resolu';
    const next = {
      id: targetId,
      name: relabel ? e.name : prev.name,
      code: relabel ? (e.code || null) : (prev.code || null),
      since: prev ? (prev.since || null) : null,
      status: resolvedFlag ? 'resolu' : (section === 'history' ? (prev ? prev.status || null : null) : null),
      resolvedOn: resolvedFlag
        ? ((prev && prev.status === 'resolu' && prev.resolvedOn) || fmtSommaireDate(e.documentedAt) || today)
        : (section === 'history' && prev ? (prev.resolvedOn || null) : null),
    };
    const change = !prev ? 'ajout'
      : (resolvedFlag && prev.status !== 'resolu') ? 'resolu'
      : (prevSection && prevSection !== section) ? 'deplace'
      : (e.replaces && (prev.name !== next.name || codeChanged)) ? 'remplace'
      : codeChanged ? 'modifie'
      : null;
    if (!change) return;
    next.pending = true; next.change = change; next.dxNumber = e.number; next.pendingNote = dxPendingNote(change, prev);
    resolved.push({ id: targetId, section: section, prevSection: prevSection, next: next });
  });

  const byTargetId = new Map(resolved.map(function (r) { return [r.id, r]; }));
  const out = { problems: [], history: [] };
  ['problems', 'history'].forEach(function (sec) {
    (base[sec] || []).forEach(function (row) {
      const r = byTargetId.get(row.id);
      if (!r) { out[sec].push(row); return; }       // non touchée par cette note
      if (r.section === sec) out[sec].push(r.next); // touchée, section inchangée : remplacée en place
      // sinon : déplacée vers l'autre section, ajoutée plus bas
    });
  });
  resolved.forEach(function (r) {
    if (!r.prevSection || r.prevSection !== r.section) out[r.section].push(r.next);
  });
  return out;
}

// À la complétion de la note : même fusion, puis les marqueurs « en attente »
// sont retirés — la ligne devient une ligne normale du dossier.
function commitSommaireDx(base, threads, opts) {
  const merged = mergeSommaireDx(base, threads, opts);
  function strip(row) {
    const r = Object.assign({}, row);
    delete r.pending; delete r.change; delete r.dxNumber; delete r.pendingNote;
    return r;
  }
  return { problems: merged.problems.map(strip), history: merged.history.map(strip) };
}

// Ajoute {left, mid, right, title} attendus par SummaryRow/ProblemsModal
// (Summary.jsx) à une ligne de problème ou d'antécédent.
function sommaireDxRowView(r) {
  return Object.assign({}, r, {
    left: r.name,
    mid: r.status === 'resolu' ? 'résolu' : '',
    // resolvedOn l'emporte quand les deux sont présents : un problème
    // Cessé (D2) garde son `since` d'origine (mergeSommaireDx ne le touche
    // pas), mais c'est la date de résolution, la plus récente, qui doit
    // s'afficher — sinon la ligne semble ignorer le Cesser qui vient de
    // l'y amener.
    right: r.resolvedOn || (r.since ? ('depuis ' + r.since) : ''),
    title: r.name + (r.code ? (' (' + r.code + ')') : ''),
  });
}

Object.assign(window, {
  newDiagId: newDiagId, diagnosticThreads: diagnosticThreads, listDiagnostics: listDiagnostics,
  diagPlacement: diagPlacement, dxSommaireTargetId: dxSommaireTargetId, normalizeDiagAttrs: normalizeDiagAttrs,
  makeDiagRegionAttrs: makeDiagRegionAttrs, prepareDiagDoc: prepareDiagDoc, rebaseDiagDocForNewNote: rebaseDiagDocForNewNote,
  diagRelabelPatches: diagRelabelPatches, diagCanRefine: diagCanRefine, dxRegionCimId: dxRegionCimId, diagCodeLabel: diagCodeLabel,
  diagDocButton: diagDocButton, diagDocMenuItems: diagDocMenuItems,
  getSommaireDiagnostics: getSommaireDiagnostics, sommaireDxSeed: sommaireDxSeed, dxFindLinkableRow: dxFindLinkableRow,
  fmtSommaireDate: fmtSommaireDate, mergeSommaireDx: mergeSommaireDx, commitSommaireDx: commitSommaireDx,
  sommaireDxRowView: sommaireDxRowView,
});
