// Requêtes : recherche unifiée, sélection multiple, profils, regroupement au
// checkout (lot 7, rencontre inline entity — Antoine Cloutier, Xavier Boilard).
// Lancer : node --test project/tests/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPrototype, doc, H2 } from './harness.mjs';

const w = loadPrototype(['note-ui/note-sections.jsx', 'note-ui/diagnostics.jsx', 'note-ui/editor-data.jsx', 'note-ui/editor-schema.jsx']);
const D = w.NOTE_DATA;
const lab = (key) => D.ORDER_DEFS.lab.items().find((it) => it.key === key);
const img = (key) => D.ORDER_DEFS.img.items().find((it) => it.key === key);
const prof = (key) => D.LAB_PROFILES.find((p) => p.key === key);

test('/req ouvre la recherche unifiée ; profils, labo et imagerie en trois sections', () => {
  assert.deepEqual(w.parseSlashQuery('req diab'), { mode: 'order', kind: 'req', term: 'diab' });
  const all = D.searchRequests('');
  assert.equal(all.favoris.length, 3);
  assert.ok(all.frequents.length > 0 && all.frequents.every((it) => it.orderKind === 'lab'));
  assert.ok(all.autres.length > 0 && all.autres.every((it) => it.orderKind === 'img'));
  assert.deepEqual(D.searchRequests('diab').favoris.map((p) => p.name), ['Profil diabète']);
  assert.ok(D.searchRequests('radio').autres.some((it) => it.key === 'rxpoumon'));
  assert.ok(D.ORDER_DEFS.req.multi && D.ORDER_DEFS.lab.multi && D.ORDER_DEFS.img.multi && !D.ORDER_DEFS.rx.multi);
});

test('un profil déploie ses analyses, sans doublon', () => {
  const p = prof('prof-diabete');
  assert.deepEqual(p.details.tests, ['HbA1c', 'Glycémie à jeun', 'Créatinine', 'DFGe', 'Cholestérol total', 'HDL', 'LDL', 'Triglycérides']);
  assert.equal(p.details.fasting, true);
});

test('sélection multiple : UNE puce labo pour toutes les analyses, une puce par examen d’imagerie', () => {
  const chips = w.buildRequestChips([Object.assign({}, lab('fsc'), { orderKind: 'lab' }), Object.assign({}, img('rxpoumon'), { orderKind: 'img' }), Object.assign({}, lab('lipide'), { orderKind: 'lab' }), Object.assign({}, img('echoabdo'), { orderKind: 'img' })]);
  assert.deepEqual(chips.map((c) => c.type), ['lab', 'imaging', 'imaging']);
  assert.deepEqual(chips[0].details.tests, ['FSC', 'Cholestérol total', 'HDL', 'LDL', 'Triglycérides']);
  assert.equal(chips[0].details.fasting, true);
  assert.equal(chips[0].rx.name, 'FSC, Cholestérol total, HDL, LDL, Triglycérides');
  assert.notEqual(chips[1].cid, chips[2].cid);
});

test('profil + analyse déjà dedans : pas de doublon ; depuis /lab, le type vient de la recherche', () => {
  const chips = w.buildRequestChips([prof('prof-anemie'), lab('fsc')], 'lab');
  assert.equal(chips.length, 1);
  assert.deepEqual(chips[0].details.tests, ['FSC', 'Ferritine', 'Vitamine B12']);
});

test('un gabarit peut proposer un profil : une puce labo en attente, analyses retirables avant d’accepter', () => {
  const n = w.buildPendingChipNode({ kind: 'profile', key: 'prof-anemie' }, 'Gabarit « Test »');
  assert.equal(n.attrs.type, 'lab');
  assert.equal(n.attrs.pending, true);
  assert.equal(n.attrs.proposedBy, 'Gabarit « Test »');
  assert.deepEqual(n.attrs.details.tests, ['FSC', 'Ferritine', 'Vitamine B12']);
});

test('checkout : une requête par puce, ou regroupées par type', () => {
  const chip = (attrs) => ({ type: 'chip', attrs });
  const l1 = w.buildRequestChips([lab('fsc')], 'lab')[0];
  const l2 = w.buildRequestChips([lab('tsh')], 'lab')[0];
  const i1 = w.orderChipAttrs('img', img('rxpoumon'));
  const d = doc(H2('Conclusion'), { type: 'paragraph', content: [chip(l1), chip(i1), chip(l2)] });
  const perChip = w.buildTransmissionDocs(w.scanDoc(d), {}, { groupRequests: false });
  assert.deepEqual(perChip.map((x) => x.kind), ['lab', 'imaging', 'lab']);
  const grouped = w.buildTransmissionDocs(w.scanDoc(d), {}, { groupRequests: true });
  assert.deepEqual(grouped.map((x) => [x.id, x.title, x.items.length]), [['lab', 'Requête de laboratoire', 2], ['imaging', 'Requête d’imagerie', 1]]);
});

test('imagerie : la latéralité suit l’examen dans le texte de la puce', () => {
  const a = w.orderChipAttrs('img', img('rxgenou'));
  a.details = Object.assign({}, a.details, { laterality: 'Gauche' });
  assert.equal(w.chipPrintText(a), 'Radiographie genou — Gauche, Routine');
});

test('la puce garde le nom du profil d’origine, pour le rappel dans le formulaire', () => {
  assert.equal(w.buildRequestChips([prof('prof-anemie')], 'lab')[0].details.profile, 'Bilan anémie');
  assert.equal(w.buildRequestChips([lab('fsc')], 'lab')[0].details.profile, undefined);
});
