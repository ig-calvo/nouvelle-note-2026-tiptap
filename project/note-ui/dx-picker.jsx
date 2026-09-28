/* global window */
// =========================================================
// dx-picker.jsx — modèle pur du sélecteur /dx : construit le modèle affiché
// (sections « Dans cette note » → Sommaire → CIM-10, ordre E1) et le
// réducteur clavier/souris (dxStep), à partir de diagnosticThreads
// (diagnostics.jsx) et de l'index CIM-10 (cim10-index.jsx). Fichier pur :
// aucun JSX, aucun DOM, aucune dépendance à Tiptap — testable tel quel par
// le harnais. Le rendu (DiagnosticDropdown, DxEditPopover) et le contrôleur
// qui appelle ce fichier vivent dans editor-popover.jsx / editor-field.jsx.
//
// Un seul modèle par publication : items() (editor-schema.jsx, mode dx) et
// le rendu React lisent tous les deux `model.flat`, construit une seule fois
// ici par dxBuildModel — jamais recalculé séparément pour le clavier et
// l'affichage (c'était le piège de searchDx, deux appels indépendants).
// =========================================================

const DX_STOP_ACCENTS = /[̀-ͯ]/g;
function dxNorm(s) {
  // Même normalisation que normCim10 (cim10-index.jsx), dupliquée à dessein :
  // ce fichier ne doit pas dépendre de l'ordre de chargement de
  // cim10-index.jsx (il n'a besoin que de window.CIM10, jamais de ses
  // fonctions internes). Limite connue : œ/æ (2 caractères après expansion)
  // décale de 1 les index renvoyés par dxHighlightRanges pour un libellé qui
  // en contient — rare, accepté pour un simple surlignage.
  return (s || '').toLowerCase().replace(/œ/g, 'oe').replace(/æ/g, 'ae').normalize('NFD').replace(DX_STOP_ACCENTS, '');
}
function dxCodeKey(s) { return (s || '').toLowerCase().replace(/\./g, ''); }

const DX_COPY = {
  placeholder: 'Rechercher un diagnostic, un problème ou un code CIM-10…',
  sec: {
    note: 'Dans cette note',
    somProblemes: 'Problèmes au sommaire',
    somAntecedents: 'Antécédents au sommaire',
    frequents: 'Fréquents',
    cim: 'CIM-10',
    browseRoot: 'CIM-10',
    plusPrecis: function (code) { return 'Codes plus précis — ' + code; },
    memeCategorie: function (code) { return 'Même catégorie — ' + code; }
  },
  browse: 'Parcourir la CIM-10 par chapitre',
  loading: 'Chargement de la CIM-10…',
  freeText: {
    nouveau: function (term) { return { title: 'Nouveau diagnostic : ' + term, sub: 'Texte libre, sans code CIM-10' }; },
    remplacer: function (term) { return { title: 'Remplacer par : ' + term, sub: null }; },
    edit: function (term, hadCode) { return { title: 'Renommer : ' + term, sub: hadCode ? 'Le code CIM-10 sera retiré' : null }; }
  },
  banner: {
    remplacer: function (target) { return 'Remplacer n° ' + target.number + ' « ' + target.name + ' » par…'; },
    edit: function (region) { return 'Modifier « ' + region.name + ' »'; },
    refine: function (region) { return 'Préciser « ' + (region.code || region.name) + ' »'; }
  },
  actions: {
    reprendre: { label: 'Reprendre', title: 'Reprendre ce diagnostic (même numéro)' },
    remplacer: { label: 'Remplacer', title: 'Remplacer par un autre diagnostic, garde le numéro' },
    cesser: { label: 'Cesser', title: 'Cesser : passe aux antécédents du sommaire, résolu aujourd’hui' }
  },
  empty: {
    none: function (term) { return 'Aucun diagnostic trouvé pour « ' + term + ' ».'; },
    noneHint: '↵ pour l’utiliser en texte libre, ou parcourir la CIM-10.',
    cim: function (term) { return 'Aucun code CIM-10 pour « ' + term + ' ».'; },
    browseLeaf: 'Aucun code sous ce niveau.',
    replace: 'Rechercher le nouveau diagnostic ou parcourir la CIM-10.'
  },
  more: function (n) { return '+' + n + ' autres résultats — préciser la recherche ou parcourir la CIM-10.'; },
  foot: {
    nav: '↑↓ naviguer · ↵ choisir · → parcourir · ← retour · Échap fermer',
    note: '↑↓ naviguer · ↵ reprendre · → autres actions · Échap fermer',
    root: '↑↓ naviguer · ↵ choisir / créer · Échap fermer'
  }
};

// ---------------------------------------------------------
// Conversion des sources (fils de la note, lignes du sommaire, nœuds CIM-10)
// en Item affichable — même forme pour les trois, seul `kind` distingue leur
// traitement (action par défaut, icône de tête, navigation).
// ---------------------------------------------------------
function dxTagsFor(target) {
  const tags = [];
  if (target.status === 'cesse') tags.push({ kind: 'cesse', text: 'Cessé' });
  else if (target.documentAs === 'probleme') tags.push({ kind: 'probleme', text: 'Problème' });
  else if (target.documentAs === 'antecedent') tags.push({ kind: 'antecedent', text: 'Antécédent' });
  return tags;
}
function dxActionsFor(target) {
  if (target.status === 'cesse') return ['reprendre'];
  if (target.documentAs === 'antecedent') return ['reprendre', 'remplacer'];
  return ['reprendre', 'remplacer', 'cesser'];
}
function dxTargetFromThread(t) {
  const e = t.effective;
  return {
    kind: 'note', dxKey: e.dxKey, number: t.number, name: e.name, code: e.code || null, level: e.level || null,
    source: e.source || null, sommaireId: e.sommaireId || null, documentAs: e.documentAs || null,
    status: e.status || 'actif', replaces: e.replaces || null, documentedAt: e.documentedAt || null, documentedBy: e.documentedBy || null
  };
}
function dxThreadItem(t) {
  const target = dxTargetFromThread(t);
  return {
    key: 'note:' + t.dxKey, idx: 0, kind: 'note', label: target.name, code: target.code,
    lead: String(t.number), sub: target.replaces ? ('remplace : ' + target.replaces.name) : null,
    tags: dxTagsFor(target), actions: dxActionsFor(target), selectable: true, nav: null, ref: target
  };
}
function dxSommaireItem(r) {
  return {
    key: 'som:' + r.sommaireId, idx: 0, kind: 'sommaire', label: r.name, code: r.code || null,
    lead: 'inventory_2', sub: r.meta || null, tags: dxTagsFor(r), actions: dxActionsFor(r),
    selectable: true, nav: null, ref: r
  };
}
function dxCimItem(n) {
  return {
    key: 'cim:' + n.id, idx: 0, kind: 'cim', label: n.label, code: n.code || null,
    lead: n.roman || n.range || n.code || '', sub: (n.alias && n.alias !== n.label) ? n.libelle : null,
    tags: [], actions: [], selectable: !!n.selectable, nav: n.hasChildren ? n.id : null, ref: n
  };
}
function dxNavItem(id, label) {
  return { key: 'nav:' + id, idx: 0, kind: 'nav', label: label, code: null, lead: null, sub: null, tags: [], actions: [], selectable: false, nav: id, ref: null };
}
function dxSec(key, title, items, note, more) {
  return { key: key, title: title, items: items, note: note || null, more: more || 0 };
}

function dxLinkedSommaireIds(threads) {
  const set = new Set();
  (threads || []).forEach(function (t) { if (t.effective.sommaireId) set.add(t.effective.sommaireId); });
  return set;
}
function dxTakenCodes(threads, sommaire, extra) {
  const set = new Set();
  (threads || []).forEach(function (t) { if (t.effective.code) set.add(t.effective.code); });
  (sommaire || []).forEach(function (r) { if (r.code) set.add(r.code); });
  (extra || []).forEach(function (c) { if (c) set.add(c); });
  return set;
}
function dxMatch(q, label, code) {
  if (!q) return true;
  if (dxNorm(label).includes(q)) return true;
  if (code && dxCodeKey(code).includes(dxCodeKey(q))) return true;
  return false;
}

// Ajoute la ou les sections CIM-10 (Fréquents + CIM-10, ou juste CIM-10 pour
// Remplacer/Préciser) — `taken` exclut un code déjà utilisé ailleurs (pas
// deux fois la même identité sous deux numéros différents).
function dxPushCim(sections, cim, term, taken, includeFrequent) {
  if (!cim) { sections.push(dxSec('cim', DX_COPY.sec.cim, [], DX_COPY.loading)); return; }
  if (term && term.length >= 2) {
    const res = cim.search(term, { maxGroups: 4 });
    const rows = res.rows.filter(function (r) { return r.selectable && !(r.code && taken.has(r.code)); });
    sections.push(dxSec('cim', DX_COPY.sec.cim, rows.map(dxCimItem),
      rows.length ? null : DX_COPY.empty.cim(term), res.moreGroups));
  } else {
    if (includeFrequent) {
      const freq = cim.children('fav').filter(function (n) { return !(n.code && taken.has(n.code)); }).slice(0, 8);
      sections.push(dxSec('freq', DX_COPY.sec.frequents, freq.map(dxCimItem)));
    }
  }
  sections.push(dxSec('browse', null, [dxNavItem('root', DX_COPY.browse)]));
}

// Fil d'Ariane pour l'en-tête du picker en mode « browse » — depuis la
// racine (id 'root') jusqu'au nœud courant, node.path (cim10-index.jsx)
// donne déjà la chaîne des ancêtres.
function dxBreadcrumb(cim, nodeId) {
  if (!cim || nodeId == null || nodeId === 'root' || nodeId === '') {
    return [{ id: 'root', label: DX_COPY.sec.browseRoot, current: true }];
  }
  const node = cim.node(nodeId);
  if (!node) return [{ id: 'root', label: DX_COPY.sec.browseRoot, current: true }];
  const chain = (node.path || []).concat([node]);
  const crumbs = [{ id: 'root', label: DX_COPY.sec.browseRoot, current: false }];
  chain.forEach(function (n, i) { crumbs.push({ id: n.id, label: n.crumb, current: i === chain.length - 1 }); });
  return crumbs;
}

// ---------------------------------------------------------
// dxBuildModel — LE modèle affiché et navigué au clavier.
// state = { intent, view, stack, activeIndex, actionFocus } (voir dxInitState/dxStep)
// ctx   = { threads: diagnosticThreads(doc).threads, sommaire: getSommaireDiagnostics(), cim: window.CIM10|null }
// ---------------------------------------------------------
function dxBuildModel(state, rawTerm, ctx) {
  const term = (rawTerm || '').trim();
  const q = dxNorm(term);
  const threads = ctx.threads || [];
  const sommaire = ctx.sommaire || [];
  const cim = (ctx.cim && ctx.cim.ready && ctx.cim.ready()) ? ctx.cim : null;
  const intent = state.intent, view = state.view;
  const sections = [];
  let banner = null, crumbs = null, freeText = null, empty = null;

  if (view.kind === 'browse') {
    crumbs = dxBreadcrumb(cim, view.nodeId);
    if (intent.kind === 'remplacer') banner = { kind: 'remplacer', target: intent.target };
    else if (intent.kind === 'edit') banner = { kind: 'edit', region: intent.region };
    else if (intent.kind === 'refine') banner = { kind: 'refine', region: intent.region };
    if (!cim) {
      sections.push(dxSec('cim', DX_COPY.sec.cim, [], DX_COPY.loading));
    } else if (!term) {
      const node = (view.nodeId === 'root' || !view.nodeId) ? null : cim.node(view.nodeId);
      const kids = cim.children(view.nodeId);
      sections.push(dxSec('browse', node ? node.crumb : DX_COPY.sec.browseRoot, kids.map(dxCimItem),
        kids.length ? null : DX_COPY.empty.browseLeaf));
    } else {
      const res = cim.search(term, { within: (view.nodeId === 'root' || !view.nodeId) ? null : view.nodeId, maxGroups: 6 });
      const rows = res.rows.filter(function (r) { return r.selectable; });
      sections.push(dxSec('browse', 'Résultats', rows.map(dxCimItem),
        rows.length ? null : DX_COPY.empty.cim(term), res.moreGroups));
      const fx = intent.kind === 'remplacer' ? 'remplacer' : (intent.kind === 'edit' ? 'edit' : (intent.kind === 'refine' ? 'edit' : 'nouveau'));
      freeText = { name: term, kind: fx };
    }
  } else if (intent.kind === 'nouveau') {
    const linked = dxLinkedSommaireIds(threads);
    const taken = dxTakenCodes(threads, sommaire);
    const noteItems = threads.map(dxThreadItem).filter(function (it) { return dxMatch(q, it.label, it.code); });
    sections.push(dxSec('note', DX_COPY.sec.note, noteItems));
    const somPb = sommaire.filter(function (r) { return r.sommaireKind === 'probleme' && !linked.has(r.sommaireId); })
      .map(dxSommaireItem).filter(function (it) { return dxMatch(q, it.label, it.code); });
    sections.push(dxSec('somPb', DX_COPY.sec.somProblemes, somPb));
    const somAnt = sommaire.filter(function (r) { return r.sommaireKind === 'antecedent' && !linked.has(r.sommaireId); })
      .map(dxSommaireItem).filter(function (it) { return dxMatch(q, it.label, it.code); });
    sections.push(dxSec('somAnt', DX_COPY.sec.somAntecedents, somAnt));
    dxPushCim(sections, cim, term, taken, true);
    if (term) freeText = { name: term, kind: 'nouveau' };
    const hits = sections.reduce(function (n, sec) { return n + sec.items.length; }, 0);
    if (term.length >= 2 && !hits) empty = { text: DX_COPY.empty.none(term), hint: DX_COPY.empty.noneHint };
  } else if (intent.kind === 'remplacer') {
    banner = { kind: 'remplacer', target: intent.target };
    const t = intent.target;
    if (cim && t.code && !term) {
      const base = t.level === 'category' ? t.code : (function () { const p = cim.parent(t.code); return p ? p.id : null; })();
      if (base) {
        const list = cim.children(base).filter(function (n) { return n.code !== t.code; });
        sections.push(dxSec('near', t.level === 'category' ? DX_COPY.sec.plusPrecis(t.code) : DX_COPY.sec.memeCategorie(base), list.map(dxCimItem)));
      }
    }
    dxPushCim(sections, cim, term, dxTakenCodes([], [], [t.code]), false);
    if (term) freeText = { name: term, kind: 'remplacer' };
    if (!term) { const hits = sections.reduce(function (n, sec) { return n + sec.items.length; }, 0); if (!hits) empty = { text: DX_COPY.empty.replace }; }
  } else if (intent.kind === 'edit' || intent.kind === 'refine') {
    const r = intent.region;
    banner = { kind: intent.kind, region: r };
    const untouched = intent.kind === 'edit' && term === (r.name || '');
    if (cim && r.code && (intent.kind === 'refine' || untouched)) {
      sections.push(dxSec('near', DX_COPY.sec.plusPrecis(r.code), cim.children(r.code).map(dxCimItem)));
    }
    if (!untouched) {
      dxPushCim(sections, cim, term, dxTakenCodes([], [], [r.code]), false);
      if (term) freeText = { name: term, kind: 'edit' };
    }
  }

  const filtered = sections.filter(function (s) { return s.items.length || s.note; });
  const flat = [];
  filtered.forEach(function (s) { s.items.forEach(function (it) { it.idx = flat.length; flat.push(it); }); });
  const minIndex = view.kind === 'root' ? -1 : 0;
  // Le premier résultat SÉLECTIONNABLE (note/sommaire d'abord — E1, puis
  // CIM-10) est actif par défaut : reprendre un diagnostic déjà présent est
  // le cas le plus fréquent, il ne doit pas falloir descendre la liste pour
  // l'atteindre. La ligne « Parcourir la CIM-10 » (kind:'nav') est TOUJOURS
  // présente (dxPushCim) mais n'est jamais sélectionnable : si elle était
  // choisie comme défaut, Entrée sur un texte qui ne correspond à rien
  // ouvrirait la navigation par chapitre au lieu de créer le diagnostic en
  // texte libre (R2) — un vrai bogue trouvé en testant contre les données
  // réelles, pas une hypothèse. En vue « browse », en revanche, il n'y a pas
  // d'alternative en texte libre : la 1re ligne (même un chapitre non
  // sélectionnable) reste le défaut naturel.
  let defaultIndex;
  if (view.kind === 'browse') {
    defaultIndex = flat.length ? 0 : minIndex;
  } else {
    const firstSelectable = flat.findIndex(function (it) { return it.selectable; });
    defaultIndex = firstSelectable >= 0 ? firstSelectable : minIndex;
  }

  return {
    rawTerm: rawTerm || '', term: term, intent: intent, view: view,
    banner: banner, crumbs: crumbs, freeText: freeText,
    sections: filtered, flat: flat, minIndex: minIndex, defaultIndex: defaultIndex,
    empty: empty, cimReady: !!cim
  };
}

// ---------------------------------------------------------
// État du picker et réducteur clavier/souris — dxInitState amorce l'intent
// (nouveau, ou remplacer/edit/refine venant du header d'une région
// existante) ; dxStep applique un événement et renvoie le nouvel état plus
// les effets à exécuter côté hôte (setTerm réécrit « /dx … », commit insère
// la région, relabel renomme en place, close ferme le picker).
// ---------------------------------------------------------
function dxInitState(intent) {
  const isRefine = intent.kind === 'refine';
  return {
    intent: intent,
    view: isRefine ? { kind: 'browse', nodeId: intent.region.code } : { kind: 'root' },
    stack: [],
    activeIndex: null, // résolu à l'affichage par dxActiveIndex (= model.defaultIndex tant qu'inconnu)
    actionFocus: 0
  };
}
function dxActiveIndex(state, model) {
  if (state.activeIndex == null) return model.defaultIndex;
  return Math.max(model.minIndex, Math.min(model.flat.length - 1, state.activeIndex));
}

function dxCloneState(s) {
  return { intent: s.intent, view: s.view, stack: s.stack.slice(), activeIndex: s.activeIndex, actionFocus: s.actionFocus };
}

function dxStep(state, event, model) {
  const s = dxCloneState(state);
  const idx = dxActiveIndex(state, model);
  const it = idx >= 0 ? model.flat[idx] : null;
  const effects = [];
  let handled = true;

  function pushStack() { s.stack.push({ intent: state.intent, view: state.view, term: model.rawTerm, activeIndex: state.activeIndex }); }
  function popStack() {
    const top = s.stack.pop();
    if (!top) return false;
    s.intent = top.intent; s.view = top.view; s.activeIndex = top.activeIndex; s.actionFocus = 0;
    effects.push({ type: 'setTerm', term: top.term });
    return true;
  }
  function drillTo(nodeId) {
    pushStack();
    s.view = { kind: 'browse', nodeId: nodeId };
    s.activeIndex = null; s.actionFocus = 0;
    effects.push({ type: 'setTerm', term: '' });
  }
  function startReplace(target) {
    pushStack();
    s.intent = { kind: 'remplacer', target: target };
    s.view = { kind: 'root' };
    s.activeIndex = null; s.actionFocus = 0;
    effects.push({ type: 'setTerm', term: '' });
  }
  function commitPick(item, freeName) {
    const pick = item
      ? { source: 'cim10', name: item.label, code: item.code, level: (item.ref && item.ref.level) || null }
      : { source: 'libre', name: freeName, code: null, level: null };
    if (s.intent.kind === 'remplacer') effects.push({ type: 'commit', payload: { action: 'remplacer', target: s.intent.target, pick: pick } });
    else if (s.intent.kind === 'edit' || s.intent.kind === 'refine') effects.push({ type: 'relabel', to: pick });
    else effects.push({ type: 'commit', payload: { action: 'nouveau', pick: pick } });
  }
  function activate(item, action) {
    if (!item) return;
    if (item.kind === 'nav' || (!item.selectable && item.nav)) { drillTo(item.nav); return; }
    if (item.kind === 'cim') { commitPick(item, null); return; }
    const a = action || item.actions[0] || 'reprendre';
    if (a === 'remplacer') { startReplace(item.ref); return; }
    if (a === 'cesser') { effects.push({ type: 'commit', payload: { action: 'cesser', target: item.ref } }); return; }
    effects.push({ type: 'commit', payload: { action: 'reprendre', target: item.ref } });
  }

  if (event.type === 'term') {
    if (!event.self) { s.activeIndex = null; s.actionFocus = 0; }
  } else if (event.type === 'hover') {
    s.activeIndex = event.index; s.actionFocus = 0;
  } else if (event.type === 'drill') {
    drillTo(event.nodeId);
  } else if (event.type === 'jump') {
    // Le fil d'Ariane remplace la vue SANS empiler : Retour doit revenir à
    // l'état d'avant le premier drill, pas faire défiler chaque niveau
    // traversé en cliquant sur les miettes.
    s.view = { kind: 'browse', nodeId: event.nodeId };
    s.activeIndex = null; s.actionFocus = 0;
    effects.push({ type: 'setTerm', term: '' });
  } else if (event.type === 'back') {
    if (!popStack()) effects.push({ type: 'close' });
  } else if (event.type === 'activate') {
    activate(model.flat[event.index], event.action);
  } else if (event.type === 'key') {
    const key = event.key;
    if (event.mod) { handled = false; }
    else if (key === 'ArrowDown') { s.activeIndex = idx < 0 ? 0 : Math.min(model.flat.length - 1, idx + 1); s.actionFocus = 0; }
    else if (key === 'ArrowUp') { s.activeIndex = idx <= 0 ? model.minIndex : idx - 1; s.actionFocus = 0; }
    else if (key === 'ArrowRight') {
      if (it && it.actions.length > 1) s.actionFocus = Math.min(it.actions.length - 1, state.actionFocus + 1);
      else if (it && it.nav) drillTo(it.nav);
      else handled = false;
    } else if (key === 'ArrowLeft') {
      if (state.actionFocus > 0) s.actionFocus = state.actionFocus - 1;
      else if (model.rawTerm === '' && state.stack.length) popStack();
      else handled = false;
    } else if (key === 'Backspace') {
      if (model.rawTerm === '' && state.stack.length) popStack();
      else handled = false;
    } else if (key === 'Escape') {
      if (state.actionFocus > 0) s.actionFocus = 0;
      else if (state.stack.length) popStack();
      else effects.push({ type: 'close' });
    } else if (key === 'Enter' || key === 'Tab') {
      if (it) {
        if (it.kind === 'nav' || (!it.selectable && it.nav)) drillTo(it.nav);
        else if (state.actionFocus > 0) activate(it, it.actions[state.actionFocus]);
        else activate(it);
      } else if (model.freeText) {
        commitPick(null, model.freeText.name);
      } else {
        handled = false;
      }
    } else {
      handled = false;
    }
  } else {
    handled = false;
  }

  return { state: s, effects: effects, handled: handled };
}

// ---------------------------------------------------------
// Positionnement du menu (retourné vers le haut si pas la place en bas) —
// même logique que RxMenu, extraite ici pour être testée sans DOM.
// ---------------------------------------------------------
function dxMenuPlacement(anchor, viewport, opts) {
  const o = opts || {};
  const width = o.width || 460;
  const cap = o.cap || 440;
  const chrome = o.chrome || 84;
  const MARGIN = 8;
  const w = viewport.w, h = viewport.h;
  const left = Math.max(MARGIN, Math.min(anchor.left, w - width - MARGIN));
  const spaceBelow = h - anchor.bottom - MARGIN;
  const spaceAbove = anchor.top - MARGIN;
  const below = spaceBelow >= 240 || spaceBelow >= spaceAbove;
  const space = Math.max(160, below ? spaceBelow : spaceAbove);
  const maxHeight = Math.min(cap, space);
  const style = below
    ? { top: anchor.bottom + 6, left: left, width: width, maxHeight: maxHeight }
    : { bottom: h - anchor.top + 6, left: left, width: width, maxHeight: maxHeight };
  return { style: style, above: !below, maxHeight: maxHeight, scrollMax: Math.max(80, maxHeight - chrome) };
}

// Plages [début,fin) à surligner dans `label` pour le terme tapé — voir la
// limite œ/æ notée sur dxNorm plus haut.
function dxHighlightRanges(label, term) {
  const q = dxNorm(term).trim();
  if (!q) return [];
  const norm = dxNorm(label);
  const ranges = [];
  let from = 0, i;
  while ((i = norm.indexOf(q, from)) !== -1) { ranges.push([i, i + q.length]); from = i + q.length; }
  return ranges;
}

Object.assign(window, {
  DX_COPY: DX_COPY, dxNorm: dxNorm, dxHighlightRanges: dxHighlightRanges,
  dxInitState: dxInitState, dxActiveIndex: dxActiveIndex, dxBuildModel: dxBuildModel, dxStep: dxStep,
  dxMenuPlacement: dxMenuPlacement
});
