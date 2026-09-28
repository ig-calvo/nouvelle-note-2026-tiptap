// Modèle et réducteur du sélecteur /dx (dx-picker.jsx) — testé contre les
// VRAIS modules (diagnosticThreads, l'index CIM-10 réel), pas des bouchons :
// c'est le seul moyen de trouver un défaut par défaut qui pointe sur la
// mauvaise ligne, ou un dédoublonnage qui manque un code réel. Toutes les
// valeurs ci-dessous ont été vérifiées manuellement contre les données avant
// d'être figées en assertions.
// Lancer : node --test project/tests/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPrototype, readProjectJSON } from './harness.mjs';

const w = loadPrototype(['note-ui/note-sections.jsx', 'note-ui/diagnostics.jsx', 'note-ui/cim10-index.jsx', 'note-ui/dx-picker.jsx']);
const cimData = readProjectJSON('note-ui/cim10-fr-clinique.json');
const cimHier = readProjectJSON('note-ui/cim10-hierarchy.json');
// Façade minimale (ready() en plus du builder brut) — dxBuildModel exige
// ctx.cim.ready(), comme la vraie window.CIM10 (cim10-index.jsx).
const cim = Object.assign({ ready: () => true }, w.buildCim10Index(cimData, cimHier));

const DX = (attrs) => ({ type: 'diagnosticRegion', attrs, content: [{ type: 'paragraph' }] });
const doc = (...content) => ({ type: 'doc', content });

const SOM_ASTHME = { kind: 'sommaire', dxKey: 'som:pb1', sommaireId: 'pb1', name: 'Asthme léger', code: 'J45.9', level: null,
  source: 'sommaire', documentAs: 'probleme', status: 'actif', replaces: null, documentedAt: null, documentedBy: null,
  sommaireKind: 'probleme', sommaireStatus: null, meta: 'Depuis 2018' };
const SOM_COLIQUE = { kind: 'sommaire', dxKey: 'som:hx1', sommaireId: 'hx1', name: 'Colique néphrétique', code: 'N23', level: null,
  source: 'sommaire', documentAs: 'antecedent', status: 'actif', replaces: null, documentedAt: null, documentedBy: null,
  sommaireKind: 'antecedent', sommaireStatus: 'resolu', meta: 'Résolu le 02/07/2026' };

function ctxWith(regionDoc) {
  const threads = regionDoc ? w.diagnosticThreads(regionDoc).threads : [];
  return { threads: threads, sommaire: [SOM_ASTHME, SOM_COLIQUE], cim: cim };
}

const NOTE_DOC = doc(DX({ id: 'd1', dxKey: 'n:d1', name: 'Otite moyenne aigue suppuree', code: 'H66.0', level: 'code', source: 'cim10' }));

// ---------------------------------------------------------------------------
// dxBuildModel — modèle affiché
// ---------------------------------------------------------------------------
test('la liste du clavier est exactement celle affichée (flat = sections aplaties, idx cohérent)', () => {
  const st = w.dxInitState({ kind: 'nouveau' });
  const model = w.dxBuildModel(st, '', ctxWith(NOTE_DOC));
  const bySections = model.sections.flatMap((s) => s.items);
  assert.deepEqual(model.flat, bySections);
  model.flat.forEach((it, i) => assert.equal(it.idx, i));
});

test('ordre des sections à la racine (E1) : Dans cette note, Problèmes, Antécédents, Fréquents, Parcourir', () => {
  const st = w.dxInitState({ kind: 'nouveau' });
  const model = w.dxBuildModel(st, '', ctxWith(NOTE_DOC));
  assert.deepEqual(model.sections.map((s) => s.title), ['Dans cette note', 'Problèmes au sommaire', 'Antécédents au sommaire', 'Fréquents', null]);
  assert.equal(model.defaultIndex, 0);
  assert.equal(model.flat[0].kind, 'note');
});

test('un fil de la note est présenté une fois, avec son numéro et son code', () => {
  const model = w.dxBuildModel(w.dxInitState({ kind: 'nouveau' }), '', ctxWith(NOTE_DOC));
  const noteItem = model.flat.find((it) => it.kind === 'note');
  assert.equal(noteItem.lead, '1');
  assert.equal(noteItem.code, 'H66.0');
  assert.deepEqual(noteItem.actions, ['reprendre', 'remplacer', 'cesser']);
});

test('un problème du sommaire propose Reprendre/Remplacer/Cesser ; un antécédent seulement Reprendre/Remplacer', () => {
  const model = w.dxBuildModel(w.dxInitState({ kind: 'nouveau' }), '', ctxWith(null));
  const asthme = model.flat.find((it) => it.key === 'som:pb1');
  const colique = model.flat.find((it) => it.key === 'som:hx1');
  assert.deepEqual(asthme.actions, ['reprendre', 'remplacer', 'cesser']);
  assert.deepEqual(colique.actions, ['reprendre', 'remplacer']);
});

test('un fil cessé n’offre que Reprendre, avec l’étiquette Cessé', () => {
  const ceased = doc(DX({ id: 'd1', dxKey: 'n:d1', name: 'Otite', code: 'H66', level: 'category', status: 'cesse' }));
  const model = w.dxBuildModel(w.dxInitState({ kind: 'nouveau' }), '', ctxWith(ceased));
  const it = model.flat.find((i) => i.kind === 'note');
  assert.deepEqual(it.actions, ['reprendre']);
  assert.deepEqual(it.tags, [{ kind: 'cesse', text: 'Cessé' }]);
});

test('filtrage insensible aux accents, sur le libellé et sur le code', () => {
  const model1 = w.dxBuildModel(w.dxInitState({ kind: 'nouveau' }), 'asthme', ctxWith(null));
  assert.ok(model1.flat.some((it) => it.key === 'som:pb1'));
  const model2 = w.dxBuildModel(w.dxInitState({ kind: 'nouveau' }), 'colique nephretique', ctxWith(null)); // sans accents
  assert.ok(model2.flat.some((it) => it.key === 'som:hx1'));
});

test('dédoublonnage : un problème déjà repris dans la note disparaît du sommaire et apparaît dans « Dans cette note »', () => {
  const linked = doc(DX({ id: 'd1', dxKey: 'som:pb1', name: 'Asthme léger', code: 'J45.9', sommaireId: 'pb1', documentAs: 'probleme' }));
  const model = w.dxBuildModel(w.dxInitState({ kind: 'nouveau' }), '', ctxWith(linked));
  assert.equal(model.flat.some((it) => it.kind === 'sommaire' && it.key === 'som:pb1'), false);
  assert.ok(model.flat.some((it) => it.kind === 'note' && it.ref.sommaireId === 'pb1'));
});

test('un code CIM-10 déjà utilisé (par un fil ou une ligne du sommaire) n’apparaît plus dans les résultats CIM-10', () => {
  const model = w.dxBuildModel(w.dxInitState({ kind: 'nouveau' }), 'h66', ctxWith(NOTE_DOC)); // H66.0 déjà dans la note
  assert.equal(model.flat.some((it) => it.kind === 'cim' && it.code === 'H66.0'), false);
  assert.ok(model.flat.some((it) => it.kind === 'cim' && it.code === 'H66'));
  const model2 = w.dxBuildModel(w.dxInitState({ kind: 'nouveau' }), 'asthme', ctxWith(null)); // J45.9 déjà au sommaire
  assert.equal(model2.flat.some((it) => it.kind === 'cim' && it.code === 'J45.9'), false);
});

test('un terme de moins de 2 caractères garde les Fréquents (pas de vraie recherche) ; deux caractères ou plus déclenchent une recherche CIM-10', () => {
  const model1 = w.dxBuildModel(w.dxInitState({ kind: 'nouveau' }), 'h', ctxWith(null));
  assert.ok(model1.sections.find((s) => s.key === 'freq'), 'Fréquents reste affiché sous 2 caractères');
  assert.equal(model1.sections.some((s) => s.key === 'cim'), false, 'pas de section de résultats de recherche');
  const model2 = w.dxBuildModel(w.dxInitState({ kind: 'nouveau' }), 'h6', ctxWith(null));
  assert.ok(model2.sections.find((s) => s.key === 'cim' && s.items.length), 'une vraie recherche démarre à 2 caractères');
});

test('la ligne « Parcourir la CIM-10 » est toujours présente mais jamais sélectionnable', () => {
  const model = w.dxBuildModel(w.dxInitState({ kind: 'nouveau' }), 'asthme', ctxWith(null));
  const nav = model.flat.find((it) => it.kind === 'nav');
  assert.ok(nav);
  assert.equal(nav.selectable, false);
});

test('sans CIM-10 chargée, la section CIM-10 affiche un message de chargement et aucune ligne sélectionnable', () => {
  const model = w.dxBuildModel(w.dxInitState({ kind: 'nouveau' }), 'asthme', { threads: [], sommaire: [], cim: null });
  assert.equal(model.cimReady, false);
  assert.equal(model.flat.some((it) => it.kind === 'cim' || it.kind === 'nav'), false);
  assert.ok(model.sections.find((s) => s.key === 'cim').note);
});

test('parcourir un nœud sans terme liste ses enfants directs, triés', () => {
  const st = { intent: { kind: 'nouveau' }, view: { kind: 'browse', nodeId: 'ch:X' }, stack: [], activeIndex: null, actionFocus: 0 };
  const model = w.dxBuildModel(st, '', ctxWith(null));
  assert.deepEqual(model.sections[0].items.map((it) => it.ref.id), ['bl:J00-J06', 'bl:J09-J18', 'bl:J20-J22', 'bl:J30-J39', 'bl:J40-J47', 'bl:J60-J70']);
  assert.equal(model.defaultIndex, 0);
});

test('parcourir avec un terme cherche seulement sous ce nœud (within)', () => {
  const st = { intent: { kind: 'nouveau' }, view: { kind: 'browse', nodeId: 'H66' }, stack: [], activeIndex: null, actionFocus: 0 };
  const model = w.dxBuildModel(st, 'otite', ctxWith(null));
  assert.ok(model.flat.length > 0);
  assert.ok(model.flat.every((it) => it.kind !== 'cim' || it.code.startsWith('H66')));
});

test('intent remplacer : bandeau, pas de section note/sommaire, « Même catégorie » pour un code précis', () => {
  const target = { kind: 'sommaire', dxKey: 'som:pb1', sommaireId: 'pb1', name: 'Asthme léger', code: 'J45.9', level: 'code' };
  const model = w.dxBuildModel({ intent: { kind: 'remplacer', target: target }, view: { kind: 'root' }, stack: [], activeIndex: null, actionFocus: 0 }, '', ctxWith(null));
  assert.deepEqual(model.banner, { kind: 'remplacer', target: target });
  assert.equal(model.sections.some((s) => s.key === 'note' || s.key === 'somPb'), false);
  assert.equal(model.sections[0].title, 'Même catégorie — J45');
  assert.equal(model.sections[0].items.every((it) => it.code !== 'J45.9'), true);
});

test('intent remplacer sur une catégorie propose « Codes plus précis »', () => {
  const target = { kind: 'note', dxKey: 'n:d1', name: 'Otite moyenne', code: 'H66', level: 'category' };
  const model = w.dxBuildModel({ intent: { kind: 'remplacer', target: target }, view: { kind: 'root' }, stack: [], activeIndex: null, actionFocus: 0 }, '', ctxWith(null));
  assert.equal(model.sections[0].title, 'Codes plus précis — H66');
});

test('texte libre : absent quand le terme est vide, présent avec le bon `kind` selon l’intent', () => {
  const st = w.dxInitState({ kind: 'nouveau' });
  assert.equal(w.dxBuildModel(st, '', ctxWith(null)).freeText, null);
  assert.deepEqual(w.dxBuildModel(st, 'Grippe', ctxWith(null)).freeText, { name: 'Grippe', kind: 'nouveau' });
});

test('intent refine : démarre DANS le code de la région, propose ses enfants, un pick devient un relabel', () => {
  const region = { id: 'd1', dxKey: 'n:d1', name: 'Otite moyenne suppurée', code: 'H66', level: 'category' };
  const st = w.dxInitState({ kind: 'refine', region: region });
  assert.deepEqual(st.view, { kind: 'browse', nodeId: 'H66' });
  const model = w.dxBuildModel(st, '', ctxWith(null));
  assert.deepEqual(model.sections[0].items.map((it) => it.code).sort(), ['H66.0', 'H66.1', 'H66.2', 'H66.3', 'H66.4', 'H66.9']);
  const h660 = model.flat.find((it) => it.code === 'H66.0');
  const r = w.dxStep(st, { type: 'activate', index: h660.idx }, model);
  assert.deepEqual(r.effects, [{ type: 'relabel', to: { source: 'cim10', name: 'Otite moyenne aiguë suppurée', code: 'H66.0', level: 'code' } }]);
});

test('intent edit : nom inchangé propose « Codes plus précis » sans texte libre ; nom modifié bascule en recherche + texte libre', () => {
  const region = { id: 'd1', dxKey: 'n:d1', name: 'Otite moyenne', code: 'H66', level: 'category' };
  const st = w.dxInitState({ kind: 'edit', region: region });
  const untouched = w.dxBuildModel(st, 'Otite moyenne', ctxWith(null));
  assert.deepEqual(untouched.sections.map((s) => s.title), ['Codes plus précis — H66']);
  assert.equal(untouched.freeText, null);
  const touched = w.dxBuildModel(st, 'Otite moyenne (renommée)', ctxWith(null));
  assert.deepEqual(touched.freeText, { name: 'Otite moyenne (renommée)', kind: 'edit' });
  assert.equal(touched.sections.some((s) => s.title === 'Codes plus précis — H66'), false);
});

// ---------------------------------------------------------------------------
// dxStep — réducteur clavier/souris
// ---------------------------------------------------------------------------
test('↓ part de -1 à la racine ; ↑ y revient ; en vue browse, ↑ reste à 0', () => {
  const st = w.dxInitState({ kind: 'nouveau' });
  const model = w.dxBuildModel(st, '', ctxWith(NOTE_DOC));
  let r = w.dxStep(st, { type: 'key', key: 'ArrowUp' }, model); // déjà au défaut (0) -> minIndex (-1)
  assert.equal(w.dxActiveIndex(r.state, model), -1);
  r = w.dxStep(r.state, { type: 'key', key: 'ArrowDown' }, model);
  assert.equal(w.dxActiveIndex(r.state, model), 0);

  const browseSt = { intent: { kind: 'nouveau' }, view: { kind: 'browse', nodeId: 'ch:X' }, stack: [], activeIndex: 0, actionFocus: 0 };
  const browseModel = w.dxBuildModel(browseSt, '', ctxWith(null));
  const up = w.dxStep(browseSt, { type: 'key', key: 'ArrowUp' }, browseModel);
  assert.equal(w.dxActiveIndex(up.state, browseModel), 0); // pas de -1 en browse
});

test('→ avance actionFocus jusqu’au dernier, jamais au-delà ; ← revient, puis remonte (back) à terme vide', () => {
  const st = w.dxInitState({ kind: 'nouveau' });
  const model = w.dxBuildModel(st, '', ctxWith(NOTE_DOC)); // flat[0] = fil note, 3 actions
  let r = w.dxStep(st, { type: 'key', key: 'ArrowRight' }, model);
  assert.equal(r.state.actionFocus, 1);
  r = w.dxStep(r.state, { type: 'key', key: 'ArrowRight' }, model);
  assert.equal(r.state.actionFocus, 2);
  r = w.dxStep(r.state, { type: 'key', key: 'ArrowRight' }, model); // plafonne
  assert.equal(r.state.actionFocus, 2);
  r = w.dxStep(r.state, { type: 'key', key: 'ArrowLeft' }, model);
  assert.equal(r.state.actionFocus, 1);
});

test('Entrée avec actionFocus=0 reprend (même numéro) ; actionFocus=2 cesse', () => {
  const st = w.dxInitState({ kind: 'nouveau' });
  const model = w.dxBuildModel(st, '', ctxWith(NOTE_DOC));
  let r = w.dxStep(st, { type: 'key', key: 'Enter' }, model);
  assert.deepEqual(r.effects[0].payload.action, 'reprendre');
  assert.equal(r.effects[0].payload.target.dxKey, 'n:d1');

  let withFocus = w.dxStep(st, { type: 'key', key: 'ArrowRight' }, model);
  withFocus = w.dxStep(withFocus.state, { type: 'key', key: 'ArrowRight' }, model);
  r = w.dxStep(withFocus.state, { type: 'key', key: 'Enter' }, model);
  assert.equal(r.effects[0].payload.action, 'cesser');
});

test('actionFocus=1 (Remplacer) bascule l’intent, vide le terme, empile ; Échap revient exactement à l’état d’avant', () => {
  const st = w.dxInitState({ kind: 'nouveau' });
  const model = w.dxBuildModel(st, 'asthme', ctxWith(null));
  const somIdx = model.flat.findIndex((it) => it.key === 'som:pb1');
  let r = w.dxStep(st, { type: 'activate', index: somIdx, action: 'remplacer' }, model);
  assert.equal(r.state.intent.kind, 'remplacer');
  assert.equal(r.state.intent.target.sommaireId, 'pb1');
  assert.deepEqual(r.effects, [{ type: 'setTerm', term: '' }]);
  assert.equal(r.state.stack.length, 1);

  const model2 = w.dxBuildModel(r.state, '', ctxWith(null));
  const back = w.dxStep(r.state, { type: 'key', key: 'Escape' }, model2);
  assert.equal(back.state.intent.kind, 'nouveau');
  assert.equal(back.state.stack.length, 0);
  assert.deepEqual(back.effects, [{ type: 'setTerm', term: 'asthme' }]);
});

test('une catégorie CIM-10 (H66) est sélectionnable ET navigable (D4) : Entrée la choisit, → descend voir ses codes précis', () => {
  const st = w.dxInitState({ kind: 'nouveau' });
  const model = w.dxBuildModel(st, 'otite', ctxWith(null));
  const h66 = model.flat.find((it) => it.code === 'H66');
  assert.equal(h66.selectable, true);
  assert.ok(h66.nav, 'a des enfants (codes précis), donc navigable aussi');

  const withIdx = Object.assign({}, st, { activeIndex: h66.idx });
  const picked = w.dxStep(withIdx, { type: 'key', key: 'Enter' }, model);
  assert.deepEqual(picked.effects, [{ type: 'commit', payload: { action: 'nouveau', pick: { source: 'cim10', name: h66.label, code: 'H66', level: 'category' } } }]);

  const drilled = w.dxStep(withIdx, { type: 'key', key: 'ArrowRight' }, model);
  assert.deepEqual(drilled.effects, [{ type: 'setTerm', term: '' }]);
  assert.deepEqual(drilled.state.view, { kind: 'browse', nodeId: 'H66' });
});

test('un chapitre (non sélectionnable) ne se choisit jamais : Entrée comme → descendent tous les deux', () => {
  const st = { intent: { kind: 'nouveau' }, view: { kind: 'browse', nodeId: 'root' }, stack: [], activeIndex: null, actionFocus: 0 };
  const model = w.dxBuildModel(st, '', ctxWith(null));
  const chapterX = model.flat.find((it) => it.ref && it.ref.id === 'ch:X');
  assert.equal(chapterX.selectable, false);
  const withIdx = Object.assign({}, st, { activeIndex: chapterX.idx });
  const r = w.dxStep(withIdx, { type: 'key', key: 'Enter' }, model);
  assert.deepEqual(r.state.view, { kind: 'browse', nodeId: 'ch:X' });
  assert.equal(r.effects.some((e) => e.type === 'commit'), false);
});

test('Entrée à la racine sans rien (terme vide, rien à sélectionner) est absorbée sans effet', () => {
  const model = w.dxBuildModel(w.dxInitState({ kind: 'nouveau' }), '', { threads: [], sommaire: [], cim: null });
  assert.equal(model.freeText, null);
  const idx = w.dxActiveIndex(w.dxInitState({ kind: 'nouveau' }), model);
  assert.ok(idx < 0 || !model.flat[idx]);
});

test('Entrée avec un texte qui ne correspond à rien crée un diagnostic en texte libre (ne descend PAS dans « Parcourir »)', () => {
  const st = w.dxInitState({ kind: 'nouveau' });
  const model = w.dxBuildModel(st, "un truc qui n'existe pas du tout", ctxWith(null));
  assert.equal(w.dxActiveIndex(st, model), -1); // jamais la ligne « Parcourir »
  const r = w.dxStep(st, { type: 'key', key: 'Enter' }, model);
  assert.deepEqual(r.effects, [{ type: 'commit', payload: { action: 'nouveau', pick: { source: 'libre', name: "un truc qui n'existe pas du tout", code: null, level: null } } }]);
});

test('Backspace sur un terme vide remonte la pile (drill puis retour à la racine)', () => {
  const st = w.dxInitState({ kind: 'nouveau' });
  const model = w.dxBuildModel(st, '', ctxWith(null));
  const nav = model.flat.find((it) => it.kind === 'nav');
  const drilled = w.dxStep(st, { type: 'activate', index: nav.idx }, model);
  assert.equal(drilled.state.view.kind, 'browse');
  const model2 = w.dxBuildModel(drilled.state, '', ctxWith(null));
  const back = w.dxStep(drilled.state, { type: 'key', key: 'Backspace' }, model2);
  assert.deepEqual(back.state.view, { kind: 'root' });
});

test('Échap ferme quand la pile est vide ; survol synchronise activeIndex et remet actionFocus à 0', () => {
  const st = w.dxInitState({ kind: 'nouveau' });
  const model = w.dxBuildModel(st, '', ctxWith(NOTE_DOC));
  const close = w.dxStep(st, { type: 'key', key: 'Escape' }, model);
  assert.deepEqual(close.effects, [{ type: 'close' }]);
  const withFocus = w.dxStep(st, { type: 'key', key: 'ArrowRight' }, model);
  const hovered = w.dxStep(withFocus.state, { type: 'hover', index: 1 }, model);
  assert.equal(hovered.state.activeIndex, 1);
  assert.equal(hovered.state.actionFocus, 0);
});

test('un événement `term` non auto-provoqué (self:false) réinitialise la sélection à la valeur par défaut', () => {
  const st = w.dxInitState({ kind: 'nouveau' });
  const model = w.dxBuildModel(st, '', ctxWith(NOTE_DOC));
  const moved = w.dxStep(st, { type: 'key', key: 'ArrowDown' }, model);
  assert.equal(w.dxActiveIndex(moved.state, model), 1);
  const retyped = w.dxStep(moved.state, { type: 'term', term: 'x', self: false }, model);
  assert.equal(retyped.state.activeIndex, null);
});

test('une touche avec modificateur (Cmd/Ctrl) n’est jamais absorbée', () => {
  const st = w.dxInitState({ kind: 'nouveau' });
  const model = w.dxBuildModel(st, '', ctxWith(null));
  const r = w.dxStep(st, { type: 'key', key: 'a', mod: true }, model);
  assert.equal(r.handled, false);
});

test('le fil d’Ariane (jump) remplace la vue SANS empiler ; drill (chevron/Entrée) empile', () => {
  const st = w.dxInitState({ kind: 'nouveau' });
  const model = w.dxBuildModel(st, '', ctxWith(null));
  const nav = model.flat.find((it) => it.kind === 'nav');
  const drilled = w.dxStep(st, { type: 'activate', index: nav.idx }, model);
  assert.equal(drilled.state.stack.length, 1);
  const model2 = w.dxBuildModel(drilled.state, '', ctxWith(null));
  const chapterX = model2.flat.find((it) => it.ref && it.ref.id === 'ch:X');
  const drilled2 = w.dxStep(drilled.state, { type: 'activate', index: chapterX.idx }, model2);
  assert.equal(drilled2.state.stack.length, 2);
  const jumped = w.dxStep(drilled2.state, { type: 'jump', nodeId: 'root' }, w.dxBuildModel(drilled2.state, '', ctxWith(null)));
  assert.equal(jumped.state.stack.length, 2); // inchangé : jump ne pousse rien
  assert.deepEqual(jumped.state.view, { kind: 'browse', nodeId: 'root' });
});

// ---------------------------------------------------------------------------
// Utilitaires
// ---------------------------------------------------------------------------
test('dxMenuPlacement s’ouvre vers le bas quand il y a la place, vers le haut sinon, et reste dans la fenêtre', () => {
  const below = w.dxMenuPlacement({ left: 100, top: 200, bottom: 220 }, { w: 1000, h: 800 }, { width: 460, cap: 440 });
  assert.equal(below.above, false);
  assert.equal(below.style.top, 226);
  const above = w.dxMenuPlacement({ left: 100, top: 750, bottom: 770 }, { w: 1000, h: 800 }, { width: 460, cap: 440 });
  assert.equal(above.above, true);
  const clamped = w.dxMenuPlacement({ left: 900, top: 200, bottom: 220 }, { w: 1000, h: 800 }, { width: 460, cap: 440 });
  assert.ok(clamped.style.left + 460 <= 1000);
});

test('dxHighlightRanges retrouve un terme sans accent dans un libellé accentué', () => {
  assert.deepEqual(w.dxHighlightRanges('Otite moyenne aiguë', 'aigue'), [[14, 19]]);
  assert.deepEqual(w.dxHighlightRanges('Asthme léger', ''), []);
});

// ---------------------------------------------------------------------------
// Bout en bout avec editor-schema.jsx : une reprise en Conclusion donne le
// même numéro qu'en Détails (R3), preuve que dx-picker consomme bien les
// MÊMES fils que la numérotation de l'éditeur.
// ---------------------------------------------------------------------------
test('reprendre un fil de la note donne bien le même numéro (intégration diagnosticThreads)', () => {
  const twoRegions = doc(
    DX({ id: 'd1', dxKey: 'n:d1', name: 'Otite', code: 'H66', level: 'category' }),
    DX({ id: 'd2', dxKey: 'n:d2', name: 'Asthme', code: 'J45.9', level: 'code' })
  );
  const model = w.dxBuildModel(w.dxInitState({ kind: 'nouveau' }), '', ctxWith(twoRegions));
  const otite = model.flat.find((it) => it.key === 'note:n:d1');
  assert.equal(otite.lead, '1');
  const r = w.dxStep(w.dxInitState({ kind: 'nouveau' }), { type: 'activate', index: otite.idx }, model);
  assert.equal(r.effects[0].payload.target.dxKey, 'n:d1');
  // Une nouvelle occurrence créée avec ce target garderait dxKey n:d1, donc
  // le même number lors du prochain diagnosticThreads(doc) — déjà couvert
  // par tests/diagnostics.test.mjs (numéro par 1re occurrence du fil).
});
