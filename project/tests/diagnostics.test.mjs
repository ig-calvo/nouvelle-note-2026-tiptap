// Modèle pur des diagnostics : fils, numérotation, constructeur de régions
// (Reprendre/Remplacer/Cesser), et fusion déclarative avec le Sommaire.
// Lancer : node --test project/tests/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPrototype } from './harness.mjs';

const w = loadPrototype(['note-ui/note-sections.jsx', 'note-ui/diagnostics.jsx']);

const DX = (attrs, body) => ({ type: 'diagnosticRegion', attrs, content: body || [{ type: 'paragraph' }] });
const REF = (attrs) => ({ type: 'paragraph', content: [{ type: 'diagnosticRef', attrs }] });
const SPLIT = { type: 'sectionSplit' };
const doc = (...content) => ({ type: 'doc', content });

// ---------------------------------------------------------------------------
// diagnosticThreads — numérotation et état effectif
// ---------------------------------------------------------------------------
test('le numéro vient de la 1re occurrence du fil, en Détails puis en Conclusion', () => {
  const d = doc(
    DX({ id: 'd1', dxKey: 'n:d1', name: 'Otite' }),
    DX({ id: 'd2', dxKey: 'n:d2', name: 'Asthme' }),
    SPLIT,
    DX({ id: 'd3', dxKey: 'n:d2', name: 'Asthme' }), // reprise du même fil en conclusion
    DX({ id: 'd4', dxKey: 'n:d4', name: 'Grippe' })
  );
  const m = w.diagnosticThreads(d);
  assert.deepEqual(m.threads.map((t) => [t.dxKey, t.number]), [['n:d1', 1], ['n:d2', 2], ['n:d4', 3]]);
  assert.equal(m.byId.d3.number, 2);
  assert.deepEqual(m.byKey['n:d2'].effective.zones, ['details', 'conclusion']);
});

test('supprimer le premier fil renumérote les autres sans trou', () => {
  const d = doc(
    DX({ id: 'd2', dxKey: 'n:d2', name: 'Asthme' }),
    SPLIT,
    DX({ id: 'd3', dxKey: 'n:d2', name: 'Asthme' }),
    DX({ id: 'd4', dxKey: 'n:d4', name: 'Grippe' })
  );
  assert.deepEqual(w.diagnosticThreads(d).threads.map((t) => [t.dxKey, t.number]), [['n:d2', 1], ['n:d4', 2]]);
});

test('ancien contenu : dxKey absente -> n:id ; ids dupliqués -> même fil ; promotedAt -> documentAs', () => {
  const d = doc(
    DX({ id: 'd1', name: 'Vieux' }),
    DX({ id: 'd1', name: 'Vieux' }),
    DX({ id: 'd5', name: 'Promu', promotedAt: '2026-01-01T00:00:00Z', promotedBy: 'me' })
  );
  const m = w.diagnosticThreads(d);
  assert.equal(m.threads.length, 2);
  assert.equal(m.byKey['n:d1'].occurrences.length, 2);
  assert.equal(m.byKey['n:d5'].effective.documentAs, 'probleme');
  assert.equal(m.byKey['n:d5'].effective.documentedAt, '2026-01-01T00:00:00Z');
});

test("l'état effectif suit l'occurrence la plus récente (createdAt), pas l'ordre du document", () => {
  const later = doc(
    DX({ id: 'd1', dxKey: 'n:d1', name: 'A', status: 'actif', createdAt: '2026-01-01T00:00:00Z' }),
    SPLIT,
    DX({ id: 'd2', dxKey: 'n:d1', name: 'A', status: 'cesse', createdAt: '2026-01-02T00:00:00Z' })
  );
  assert.equal(w.diagnosticThreads(later).byKey['n:d1'].effective.status, 'cesse');

  // Même horodatages, mais la plus récente (t2) apparaît EN PREMIER dans le
  // document — elle doit quand même l'emporter (pas un simple "dernier du
  // document gagne").
  const reordered = doc(
    DX({ id: 'd2', dxKey: 'n:d1', name: 'A', status: 'cesse', createdAt: '2026-01-02T00:00:00Z' }),
    SPLIT,
    DX({ id: 'd1', dxKey: 'n:d1', name: 'A', status: 'actif', createdAt: '2026-01-01T00:00:00Z' })
  );
  assert.equal(w.diagnosticThreads(reordered).byKey['n:d1'].effective.status, 'cesse');
});

test('replaces effectif = le dernier non nul de tout le fil (une reprise sans replaces ne l’efface pas)', () => {
  const d = doc(
    DX({ id: 'd1', dxKey: 'n:d1', name: 'B', code: 'B1', replaces: { name: 'A', code: 'A1' }, createdAt: 't1' }),
    DX({ id: 'd2', dxKey: 'n:d1', name: 'B', code: 'B1', replaces: null, createdAt: 't2' })
  );
  assert.deepEqual(w.diagnosticThreads(d).byKey['n:d1'].effective.replaces, { name: 'A', code: 'A1' });
});

test('replaces effectif suit createdAt, pas l’ordre du document : un 2e Remplacer posé en Détails après un 1er déjà en Conclusion garde le bon prédécesseur', () => {
  // Conclusion (SPLIT) est toujours physiquement après les Détails, qu'elle
  // ait été écrite avant ou après — order du document ≠ ordre de récence.
  // d3 (t3, dans les Détails, le PLUS RÉCENT) remplace B ; d2 (t2, en
  // Conclusion, plus ancien mais physiquement dernier) remplace A. gagnant
  // effectif = d3 (A), donc replaces effectif doit être « B », pas « A ».
  const d = doc(
    DX({ id: 'd1', dxKey: 'n:d1', name: 'A', code: null, replaces: null, createdAt: 't1' }),
    DX({ id: 'd3', dxKey: 'n:d1', name: 'D', code: null, replaces: { name: 'B', code: null }, createdAt: 't3' }),
    SPLIT,
    DX({ id: 'd2', dxKey: 'n:d1', name: 'B', code: null, replaces: { name: 'A', code: null }, createdAt: 't2' })
  );
  const effective = w.diagnosticThreads(d).byKey['n:d1'].effective;
  assert.equal(effective.name, 'D');
  assert.deepEqual(effective.replaces, { name: 'B', code: null });
});

test('renvois : résolus par dxKey, ou par diagId sur du contenu ancien ; un renvoi cassé donne number:null', () => {
  const d = doc(
    DX({ id: 'd1', dxKey: 'n:d1', name: 'X' }),
    REF({ dxKey: 'n:d1' }),
    REF({ diagId: 'd1' }),
    REF({ dxKey: 'n:zzz' })
  );
  const m = w.diagnosticThreads(d);
  assert.deepEqual(m.refs.map((r) => [r.dxKey, r.number]), [['n:d1', 1], ['n:d1', 1], ['n:zzz', null]]);
});

test('listDiagnostics est dédoublonnée par fil et porte le numéro', () => {
  const d = doc(DX({ id: 'd1', dxKey: 'n:d1', name: 'Otite' }), DX({ id: 'd2', dxKey: 'n:d2', name: 'Asthme' }));
  assert.deepEqual(w.listDiagnostics(d), [
    { id: 'd1', dxKey: 'n:d1', number: 1, name: 'Otite', status: 'actif' },
    { id: 'd2', dxKey: 'n:d2', number: 2, name: 'Asthme', status: 'actif' },
  ]);
});

// ---------------------------------------------------------------------------
// prepareDiagDoc — hygiène d'un document chargé (brouillon, gabarit…)
// ---------------------------------------------------------------------------
test('prepareDiagDoc recale le compteur, corrige les doublons, ne mute pas l’entrée', () => {
  const w2 = loadPrototype(['note-ui/note-sections.jsx', 'note-ui/diagnostics.jsx']); // _dxSeq frais
  const raw = doc(DX({ id: 'd7', name: 'Ancien' }), DX({ id: 'd7', name: 'Ancien' }), DX({ name: 'SansId' }));
  const before = JSON.parse(JSON.stringify(raw));
  const prepared = w2.prepareDiagDoc(raw);
  const ids = prepared.content.map((n) => n.attrs.id);
  assert.equal(new Set(ids).size, 3, 'trois ids distincts après correction des doublons');
  assert.ok(prepared.content.every((n) => /^n:/.test(n.attrs.dxKey)));
  assert.deepEqual(raw, before, 'le document passé en entrée ne doit pas être modifié');
  assert.equal(w2.newDiagId(), 'd' + (Math.max.apply(null, ids.map((i) => +i.slice(1))) + 1));
});

test('prepareDiagDoc migre promotedAt/promotedBy puis les retire', () => {
  const w2 = loadPrototype(['note-ui/note-sections.jsx', 'note-ui/diagnostics.jsx']);
  const prepared = w2.prepareDiagDoc(doc(DX({ id: 'd1', name: 'X', promotedAt: '2026-01-01T00:00:00Z', promotedBy: 'me' })));
  const a = prepared.content[0].attrs;
  assert.equal(a.documentAs, 'probleme');
  assert.equal(a.documentedAt, '2026-01-01T00:00:00Z');
  assert.equal(a.documentedBy, 'me');
  assert.equal('promotedAt' in a, false);
  assert.equal('promotedBy' in a, false);
});

test('rebaseDiagDocForNewNote relie par code, efface replaces et les horodatages', () => {
  const w2 = loadPrototype(['note-ui/note-sections.jsx', 'note-ui/diagnostics.jsx']);
  const base = w2.sommaireDxSeed();
  const src = doc(DX({
    id: 'd1', dxKey: 'n:d1', name: 'Asthme leger', code: 'J45.9', sommaireId: null,
    documentAs: 'probleme', documentedAt: 't0', documentedBy: 'moi', replaces: { name: 'X', code: 'X1' },
  }));
  const out = w2.rebaseDiagDocForNewNote(src, base);
  const a = out.content[0].attrs;
  assert.equal(a.sommaireId, 'som-asthme');
  assert.equal(a.replaces, null);
  assert.equal(a.documentedAt, null);
  assert.equal(a.documentedBy, null);
});

// ---------------------------------------------------------------------------
// makeDiagRegionAttrs — le seul constructeur de région
// ---------------------------------------------------------------------------
const OPTS = { id: 'dNEW', now: '2026-09-28T12:00:00Z', author: 'Dr X' };
const TARGET = {
  dxKey: 'n:d1', name: 'Asthme', code: 'J45.9', level: 'code', source: 'cim10',
  sommaireId: null, documentAs: 'probleme', status: 'actif', documentedAt: 't0', documentedBy: 'prev',
};

test('nouveau : dxKey n:id, jamais documenté', () => {
  const a = w.makeDiagRegionAttrs({ action: 'nouveau', pick: { source: 'cim10', name: 'Otite moyenne suppurée', code: 'H66', level: 'category' } }, OPTS);
  assert.equal(a.dxKey, 'n:dNEW');
  assert.equal(a.level, 'category');
  assert.equal(a.documentAs, null);
  assert.equal(a.status, 'actif');
});

test('reprendre ne change jamais l’état effectif — y compris un fil cessé — et source n’est jamais "note"', () => {
  const a = w.makeDiagRegionAttrs({ action: 'reprendre', target: TARGET }, OPTS);
  assert.equal(a.dxKey, TARGET.dxKey);
  assert.equal(a.status, 'actif');
  assert.equal(a.documentAs, 'probleme');
  assert.equal(a.documentedAt, 't0'); // pas restampé : reprendre ne modifie rien
  assert.equal(a.replaces, null);
  assert.notEqual(a.source, 'note');

  const ceased = w.makeDiagRegionAttrs({ action: 'reprendre', target: Object.assign({}, TARGET, { status: 'cesse' }) }, OPTS);
  assert.equal(ceased.status, 'cesse');
});

test('cesser : même dxKey, statut cessé, horodaté seulement si documenté', () => {
  const a = w.makeDiagRegionAttrs({ action: 'cesser', target: TARGET }, OPTS);
  assert.equal(a.dxKey, TARGET.dxKey);
  assert.equal(a.status, 'cesse');
  assert.equal(a.documentedAt, OPTS.now);
  assert.equal(a.documentedBy, OPTS.author);

  const undocumented = w.makeDiagRegionAttrs({ action: 'cesser', target: Object.assign({}, TARGET, { documentAs: null, documentedAt: null, documentedBy: null }) }, OPTS);
  assert.equal(undocumented.documentedAt, null);
});

test('remplacer : garde dxKey/sommaireId/documentAs, prend le nouveau nom/code, pose replaces sur la cible', () => {
  const a = w.makeDiagRegionAttrs({ action: 'remplacer', target: TARGET, pick: { source: 'cim10', name: 'Bronchite aiguë', code: 'J20.9' } }, OPTS);
  assert.equal(a.dxKey, TARGET.dxKey);
  assert.equal(a.name, 'Bronchite aiguë');
  assert.equal(a.code, 'J20.9');
  assert.equal(a.status, 'actif');
  assert.deepEqual(a.replaces, { name: 'Asthme', code: 'J45.9' });
  assert.equal(a.documentAs, 'probleme');
  assert.equal(a.documentedAt, OPTS.now);
});

test('l’ancienne charge utile {__dx:true, name} équivaut à un nouveau diagnostic en texte libre', () => {
  const a = w.makeDiagRegionAttrs({ name: 'Texte libre' }, OPTS);
  assert.equal(a.source, 'libre');
  assert.equal(a.name, 'Texte libre');
  assert.equal(a.code, null);
});

// ---------------------------------------------------------------------------
// diagPlacement / diagCanRefine / diagDocButton / diagDocMenuItems
// ---------------------------------------------------------------------------
test('diagPlacement : non documenté, problème, antécédent, ou antécédent-résolu si cessé', () => {
  assert.equal(w.diagPlacement({ documentAs: null }), null);
  assert.equal(w.diagPlacement({ documentAs: 'probleme', status: 'actif' }), 'probleme');
  assert.equal(w.diagPlacement({ documentAs: 'antecedent', status: 'actif' }), 'antecedent');
  assert.equal(w.diagPlacement({ documentAs: 'probleme', status: 'cesse' }), 'antecedent-resolu');
});

test('diagCanRefine retombe sur `level` tant que la CIM-10 n’est pas chargée', () => {
  assert.equal(w.diagCanRefine({ code: 'H66', level: 'category' }), true);
  assert.equal(w.diagCanRefine({ code: 'H66.0', level: 'code' }), false);
  assert.equal(w.diagCanRefine({ code: null, level: 'category' }), false);
});

test('diagDocMenuItems : Problème désactivé si cessé ; « Non documenté » explique le sommaire selon le lien', () => {
  const unlinked = w.diagDocMenuItems({ documentAs: null, linked: false });
  assert.equal(unlinked.find((i) => i.value === null).desc, 'Ne pas ajouter au sommaire');

  const linkedUndoc = w.diagDocMenuItems({ documentAs: null, linked: true });
  assert.equal(linkedUndoc.find((i) => i.value === null).desc, 'Laisser le sommaire tel quel');

  const ceased = w.diagDocMenuItems({ documentAs: 'probleme', ceased: true, linked: true, baseKind: 'problems' });
  assert.equal(ceased.find((i) => i.value === 'probleme').disabled, true);
  assert.equal(ceased.find((i) => i.value === 'antecedent').selected, true);
  assert.equal(ceased.find((i) => i.value === 'antecedent').label, 'Antécédent · résolu');
});

// ---------------------------------------------------------------------------
// diagRelabelPatches
// ---------------------------------------------------------------------------
test('diagRelabelPatches propage à toutes les occurrences de la même version, jamais à un autre fil, et met à jour replaces', () => {
  // Scénario réaliste : Remplacer garde toujours la même dxKey (voir le
  // constructeur), donc un `replaces` ne peut viser qu'une version DU MÊME
  // fil — d4 est un Remplacer antérieur de d1/d2 (même dxKey n:d1) ; d3 est
  // un fil totalement différent qui porte juste le même libellé/code et ne
  // doit jamais être touché.
  const occDoc = doc(
    DX({ id: 'd1', dxKey: 'n:d1', name: 'Otite', code: 'H66', documentAs: 'probleme' }),
    DX({ id: 'd2', dxKey: 'n:d1', name: 'Otite', code: 'H66', replaces: null }),
    DX({ id: 'd3', dxKey: 'n:d5', name: 'Otite', code: 'H66' }), // autre fil, même libellé : ne doit pas être touché
    DX({ id: 'd4', dxKey: 'n:d1', name: 'Grippe', replaces: { name: 'Otite', code: 'H66' } })
  );
  const allOcc = occDoc.content.map((n) => ({ id: n.attrs.id, pos: null, attrs: n.attrs }));
  const patches = w.diagRelabelPatches(allOcc, 'd1', { name: 'Otite moyenne aiguë', code: 'H66.0', level: 'code', source: 'cim10' }, { now: 'T1', author: 'A' });
  assert.deepEqual(patches.map((p) => p.id), ['d1', 'd2', 'd4']);
  assert.equal(patches[0].patch.name, 'Otite moyenne aiguë');
  assert.equal(patches[0].patch.code, 'H66.0');
  assert.equal(patches[0].patch.documentedAt, 'T1'); // d1 était documenté
  assert.equal('documentedAt' in patches[1].patch, true); // même fil : le stamp de l'occurrence éditée s'applique à tout le fil
  assert.deepEqual(patches[2].patch, { replaces: { name: 'Otite moyenne aiguë', code: 'H66.0' } });
});

test('un renommage libre (sans nouveau code) garde le code existant', () => {
  const occDoc = doc(DX({ id: 'd1', dxKey: 'n:d1', name: 'Otite', code: 'H66' }));
  const allOcc = occDoc.content.map((n) => ({ id: n.attrs.id, pos: null, attrs: n.attrs }));
  // Le code d'origine est explicitement conservé par l'appelant (editor-field.jsx) —
  // ici on vérifie que la fonction pure ne l'efface pas d'elle-même.
  const patches = w.diagRelabelPatches(allOcc, 'd1', { name: 'Otite (renommée)', code: 'H66', level: 'category', source: 'cim10' }, {});
  assert.equal(patches[0].patch.code, 'H66');
  assert.equal(patches[0].patch.name, 'Otite (renommée)');
});

test('diagRelabelPatches ne fait rien si le nom et le code n’ont pas changé', () => {
  const occDoc = doc(DX({ id: 'd1', dxKey: 'n:d1', name: 'Otite', code: 'H66' }));
  const allOcc = occDoc.content.map((n) => ({ id: n.attrs.id, pos: null, attrs: n.attrs }));
  assert.deepEqual(w.diagRelabelPatches(allOcc, 'd1', { name: 'Otite', code: 'H66' }, {}), []);
});

// ---------------------------------------------------------------------------
// Sommaire : seed, getSommaireDiagnostics, mergeSommaireDx, commitSommaireDx
// ---------------------------------------------------------------------------
test('la base de démo a 2 problèmes codés et 2 antécédents résolus, cohérents avec le Sommaire (Nulligeste)', () => {
  const seed = w.sommaireDxSeed();
  assert.deepEqual(seed.problems.map((r) => r.code).sort(), ['J30.4', 'J45.9']);
  assert.deepEqual(seed.history.map((r) => r.code).sort(), ['N23', 'N30.0']);
  assert.ok(seed.history.every((r) => r.status === 'resolu' && r.resolvedOn));
});

test('getSommaireDiagnostics convertit chaque ligne en cible (dxKey som:, status region "actif", résolu dans sommaireStatus)', () => {
  const w2 = loadPrototype(['note-ui/note-sections.jsx', 'note-ui/diagnostics.jsx']);
  const rows = w2.getSommaireDiagnostics();
  const asthme = rows.find((r) => r.sommaireId === 'som-asthme');
  assert.equal(asthme.dxKey, 'som:som-asthme');
  assert.equal(asthme.documentAs, 'probleme');
  assert.equal(asthme.status, 'actif');
  const cystite = rows.find((r) => r.sommaireId === 'som-cystite');
  assert.equal(cystite.status, 'actif'); // jamais 'resolu' ici — sinon une reprise écrirait un statut de région invalide
  assert.equal(cystite.sommaireStatus, 'resolu');
});

function base() { return { problems: [{ id: 'som-asthme', name: 'Asthme léger', code: 'J45.9', since: '2018' }, { id: 'som-rhinite', name: 'Rhinite allergique', code: 'J30.4', since: '2019' }], history: [] }; }

test('mergeSommaireDx (a) : nouveau fil documenté comme problème -> ligne ajoutée, en attente', () => {
  const e = { dxKey: 'n:d4', number: 3, name: 'Grippe', code: 'J11.1', documentAs: 'probleme', status: 'actif', documentedAt: '2026-09-28T00:00:00Z', sommaireId: null, replaces: null };
  const out = w.mergeSommaireDx(base(), [e], { today: '28/09/2026' });
  const added = out.problems.find((r) => r.id === 'dx:n:d4');
  assert.ok(added);
  assert.equal(added.pending, true);
  assert.equal(added.change, 'ajout');
  assert.equal(added.name, 'Grippe');
});

test('mergeSommaireDx (b) : même fil documenté comme antécédent -> va dans history, pas dans problems', () => {
  const e = { dxKey: 'n:d4', number: 3, name: 'Grippe', code: 'J11.1', documentAs: 'antecedent', status: 'actif', documentedAt: 't', sommaireId: null, replaces: null };
  const out = w.mergeSommaireDx(base(), [e], { today: '28/09/2026' });
  assert.equal(out.history.some((r) => r.id === 'dx:n:d4'), true);
  assert.equal(out.problems.some((r) => r.id === 'dx:n:d4'), false);
});

test('mergeSommaireDx (c) : documentAs null -> résultat identique à la base (E3)', () => {
  const b = base();
  const e = { dxKey: 'n:d4', number: 3, name: 'Grippe', code: 'J11.1', documentAs: null, status: 'actif', sommaireId: null, replaces: null };
  assert.deepEqual(w.mergeSommaireDx(b, [e], {}), { problems: b.problems, history: b.history });
});

test('mergeSommaireDx (d) : cesser une ligne du sommaire -> retirée des problèmes, résolue dans les antécédents à la date de la note', () => {
  const e = { dxKey: 'som:som-rhinite', number: 5, name: 'Rhinite allergique', code: 'J30.4', sommaireId: 'som-rhinite', documentAs: 'probleme', status: 'cesse', documentedAt: '2026-09-28T12:00:00Z', replaces: null };
  const out = w.mergeSommaireDx(base(), [e], { today: '28/09/2026' });
  assert.equal(out.problems.some((r) => r.id === 'som-rhinite'), false);
  const moved = out.history.find((r) => r.id === 'som-rhinite');
  assert.equal(moved.status, 'resolu');
  assert.equal(moved.resolvedOn, '28/09/2026');
  assert.equal(moved.pending, true);
  assert.equal(moved.change, 'resolu');
});

test('mergeSommaireDx (e) : remplacer une ligne du sommaire -> même id, nouveau nom/code, note mentionne l’ancien nom', () => {
  const e = { dxKey: 'som:som-asthme', number: 1, name: 'Asthme, sans précision', code: 'J45.0', sommaireId: 'som-asthme', documentAs: 'probleme', status: 'actif', documentedAt: '2026-09-28T00:00:00Z', replaces: { name: 'Asthme léger', code: 'J45.9' } };
  const out = w.mergeSommaireDx(base(), [e], { today: '28/09/2026' });
  assert.equal(out.problems[0].id, 'som-asthme'); // même position
  assert.equal(out.problems[0].name, 'Asthme, sans précision');
  assert.equal(out.problems[0].change, 'remplace');
  assert.match(out.problems[0].pendingNote, /Asthme léger/);
});

test('mergeSommaireDx : un pick par CODE qui correspond déjà à une ligne du dossier ne crée pas de doublon (I2)', () => {
  const e = { dxKey: 'n:d9', number: 9, name: 'Asthme léger (texte libre)', code: 'J45.9', sommaireId: null, documentAs: 'probleme', status: 'actif', documentedAt: 't', replaces: null };
  const out = w.mergeSommaireDx(base(), [e], { today: '28/09/2026' });
  assert.equal(out.problems.length, 2, 'toujours 2 lignes, pas 3');
});

test('mergeSommaireDx (f) : renommage libre lié, même code -> ligne inchangée, pas en attente', () => {
  const e = { dxKey: 'som:som-asthme', number: 1, name: 'Asthme (léger)', code: 'J45.9', sommaireId: 'som-asthme', documentAs: 'probleme', status: 'actif', documentedAt: null, replaces: null };
  const out = w.mergeSommaireDx(base(), [e], {});
  assert.equal(out.problems[0].pending, undefined);
  assert.equal(out.problems[0].name, 'Asthme léger'); // le nom du dossier n'a pas bougé
});

test('mergeSommaireDx (g) : ne mute jamais la base reçue', () => {
  const b = base();
  const copy = JSON.parse(JSON.stringify(b));
  w.mergeSommaireDx(b, [{ dxKey: 'som:som-asthme', number: 1, name: 'X', code: 'X1', sommaireId: 'som-asthme', documentAs: 'probleme', status: 'actif', documentedAt: 't', replaces: { name: 'Asthme léger', code: 'J45.9' } }], { today: '28/09/2026' });
  assert.deepEqual(b, copy);
});

test('commitSommaireDx retire les marqueurs « en attente » ; refusionner avec les mêmes fils est sans effet (idempotent)', () => {
  const e = { dxKey: 'n:d4', number: 3, name: 'Grippe', code: 'J11.1', documentAs: 'probleme', status: 'actif', documentedAt: 't', sommaireId: null, replaces: null };
  const committed = w.commitSommaireDx(base(), [e], { today: '28/09/2026' });
  assert.ok(committed.problems.every((r) => !('pending' in r) && !('change' in r)));
  const mergedAgain = w.mergeSommaireDx(committed, [], {});
  assert.deepEqual(mergedAgain, committed);
});

test('sommaireDxRowView met en forme left/mid/right/title pour l’affichage du Sommaire', () => {
  const v = w.sommaireDxRowView({ name: 'Asthme léger', code: 'J45.9', since: '2018' });
  assert.equal(v.left, 'Asthme léger');
  assert.equal(v.right, 'depuis 2018');
  assert.equal(v.title, 'Asthme léger (J45.9)');
  const resolved = w.sommaireDxRowView({ name: 'Cystite', code: 'N30.0', status: 'resolu', resolvedOn: '08/12/2025' });
  assert.equal(resolved.mid, 'résolu');
  assert.equal(resolved.right, '08/12/2025');
  // Un problème du dossier cessé (D2) garde son `since` d'origine (mergeSommaireDx
  // ne l'efface pas) : c'est resolvedOn, la date la plus récente, qui doit
  // s'afficher, pas l'ancien « depuis ».
  const ceasedFromProblem = w.sommaireDxRowView({ name: 'Rhinite allergique', code: 'J30.4', since: '2019', status: 'resolu', resolvedOn: '28/09/2026' });
  assert.equal(ceasedFromProblem.right, '28/09/2026');
});
