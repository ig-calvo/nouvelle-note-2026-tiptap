// Requêtes : sélection multiple en labo, profils en tête de /lab, regroupement
// au checkout (lot 7, rencontre inline entity — Antoine Cloutier, Xavier
// Boilard ; /req retiré, rencontre du 2026-10-27).
// Lancer : node --test project/tests/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPrototype, doc, H2 } from './harness.mjs';

const w = loadPrototype(['note-ui/note-sections.jsx', 'note-ui/diagnostics.jsx', 'note-ui/editor-data.jsx', 'note-ui/editor-schema.jsx']);
const D = w.NOTE_DATA;
const lab = (key) => D.ORDER_DEFS.lab.items().find((it) => it.key === key);
const img = (key) => D.ORDER_DEFS.img.items().find((it) => it.key === key);
const prof = (key) => D.LAB_PROFILES.find((p) => p.key === key);

test('plus de /req : /lab montre les profils en tête, puis les analyses ; l’imagerie en sélection unique', () => {
  assert.deepEqual(w.parseSlashQuery('req diab'), { mode: 'menu' }, '« /req » n’ouvre plus de recherche');
  assert.ok(!D.ORDER_DEFS.req);
  assert.ok(!D.SLASH_ITEMS.some((it) => it.kbd === 'req'));
  const all = D.searchOrder('lab', '');
  assert.deepEqual(all.profiles.map((p) => p.key), ['prof-diabete', 'prof-annuel', 'prof-anemie']);
  assert.ok(all.frequents.length > 0);
  assert.deepEqual(w.flattenRxResults(all).slice(0, 3).map((it) => it.key), ['prof-diabete', 'prof-annuel', 'prof-anemie'], 'au clavier, les profils d’abord');
  D.endOrderSearch();
  assert.deepEqual(D.searchOrder('lab', 'diab').profiles.map((p) => p.name), [w.TR('Profil diabète')]);
  D.endOrderSearch();
  assert.equal(D.searchOrder('img', '').profiles, undefined, 'pas de profils en imagerie');
  D.endOrderSearch();
  assert.ok(D.ORDER_DEFS.lab.multi && !D.ORDER_DEFS.img.multi && !D.ORDER_DEFS.rx.multi);
});

test('un profil déploie ses analyses, sans doublon', () => {
  const p = prof('prof-diabete');
  assert.deepEqual(p.details.tests, [w.TR('HbA1c'), w.TR('Glycémie à jeun'), w.TR('Créatinine'), w.TR('DFGe'), w.TR('Cholestérol total'), w.TR('HDL'), w.TR('LDL'), w.TR('Triglycérides')]);
  assert.equal(p.details.fasting, true);
});

test('sélection multiple : UNE puce labo pour toutes les analyses, une puce par examen d’imagerie', () => {
  const chips = w.buildRequestChips([Object.assign({}, lab('fsc'), { orderKind: 'lab' }), Object.assign({}, img('rxpoumon'), { orderKind: 'img' }), Object.assign({}, lab('lipide'), { orderKind: 'lab' }), Object.assign({}, img('echoabdo'), { orderKind: 'img' })]);
  assert.deepEqual(chips.map((c) => c.type), ['lab', 'imaging', 'imaging']);
  assert.deepEqual(chips[0].details.tests, [w.TR('FSC'), w.TR('Cholestérol total'), w.TR('HDL'), w.TR('LDL'), w.TR('Triglycérides')]);
  assert.equal(chips[0].details.fasting, true);
  assert.equal(chips[0].rx.name, ['FSC', 'Cholestérol total', 'HDL', 'LDL', 'Triglycérides'].map((x) => w.L(x)).join(', '));
  assert.notEqual(chips[1].cid, chips[2].cid);
});

test('profil + analyse déjà dedans : pas de doublon ; depuis /lab, le type vient de la recherche', () => {
  const chips = w.buildRequestChips([prof('prof-anemie'), lab('fsc')], 'lab');
  assert.equal(chips.length, 1);
  assert.deepEqual(chips[0].details.tests, [w.TR('FSC'), w.TR('Ferritine'), w.TR('Vitamine B12')]);
});

test('un gabarit peut proposer un profil : une puce labo en attente, analyses retirables avant d’accepter', () => {
  const n = w.buildPendingChipNode({ kind: 'profile', key: 'prof-anemie' }, 'Gabarit « Test »');
  assert.equal(n.attrs.type, 'lab');
  assert.equal(n.attrs.pending, true);
  assert.equal(n.attrs.proposedBy, 'Gabarit « Test »');
  assert.deepEqual(n.attrs.details.tests, [w.TR('FSC'), w.TR('Ferritine'), w.TR('Vitamine B12')]);
});

test('checkout : une requête par puce, ou regroupées par type', () => {
  const chip = (attrs) => ({ type: 'chip', attrs });
  const l1 = w.buildRequestChips([lab('fsc')], 'lab')[0];
  const l2 = w.buildRequestChips([lab('tsh')], 'lab')[0];
  const i1 = w.orderChipAttrs('img', img('rxpoumon'));
  const d = doc(H2(w.TR('Conclusion')), { type: 'paragraph', content: [chip(l1), chip(i1), chip(l2)] });
  const perChip = w.buildTransmissionDocs(w.scanDoc(d), {}, { groupRequests: false });
  assert.deepEqual(perChip.map((x) => x.kind), ['lab', 'imaging', 'lab']);
  const grouped = w.buildTransmissionDocs(w.scanDoc(d), {}, { groupRequests: true });
  assert.deepEqual(grouped.map((x) => [x.id, x.title, x.items.length]), [['lab', w.TR('Requête de laboratoire'), 2], ['imaging', w.TR('Requête d’imagerie'), 1]]);
});

test('imagerie : la latéralité suit l’examen dans le texte de la puce', () => {
  const a = w.orderChipAttrs('img', img('rxgenou'));
  a.details = Object.assign({}, a.details, { laterality: w.TR('Gauche') });
  assert.equal(w.chipPrintText(a), w.TR('Radiographie genou') + ' — ' + w.TR('Gauche') + ', Routine');
});

test('la puce garde le nom du profil d’origine, pour le rappel dans le formulaire', () => {
  assert.equal(w.buildRequestChips([prof('prof-anemie')], 'lab')[0].details.profile, w.TR('Bilan anémie'));
  assert.equal(w.buildRequestChips([lab('fsc')], 'lab')[0].details.profile, undefined);
});

// Examen diagnostique (/exam) et services (/serv), rencontre du 2026-10-27 (C2) :
// des requêtes en sélection unique, chacune un document au checkout.
test('/exam et /serv : recherches en sélection unique, une puce « à envoyer », un document au checkout chacune', () => {
  assert.deepEqual(w.parseSlashQuery('exam hol'), { mode: 'order', kind: 'exam', term: 'hol' });
  assert.deepEqual(w.parseSlashQuery('serv pans'), { mode: 'order', kind: 'serv', term: 'pans' });
  assert.ok(!D.ORDER_DEFS.exam.multi && !D.ORDER_DEFS.serv.multi);
  assert.deepEqual(D.searchOrder('exam', '').favoris.map((it) => it.key), ['ecg', 'holter']);
  D.endOrderSearch();
  assert.ok(D.searchOrder('serv', 'point').frequents.some((it) => it.key === 'points'));
  D.endOrderSearch();
  const exam = w.orderChipAttrs('exam', D.ORDER_DEFS.exam.items().find((it) => it.key === 'holter'));
  const serv = w.orderChipAttrs('serv', D.ORDER_DEFS.serv.items().find((it) => it.key === 'pansement'));
  assert.deepEqual([exam.type, exam.rx.kind, serv.type, serv.rx.kind], ['exam', 'exam', 'service', 'serv']);
  assert.equal(w.chipDestination(exam), 'a-envoyer');
  const d = doc(H2(w.TR('Conclusion')), { type: 'paragraph', content: [{ type: 'chip', attrs: exam }, { type: 'text', text: ' ' }, { type: 'chip', attrs: serv }] });
  const docs = w.buildTransmissionDocs(w.scanDoc(d), {});
  assert.deepEqual(docs.map((x) => [x.kind, x.title]), [['exam', w.TR('Holter 24 h')], ['service', w.TR('Soins de plaie et pansement')]]);
  assert.equal(w.chipPrintText(exam), w.TR('Holter 24 h') + ' — Routine');
});
