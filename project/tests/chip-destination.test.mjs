// Où va la puce : l'icône de début de puce dit si c'est une action en attente au
// checkout (blanche sur fond bleu) ou quelque chose qui existe déjà au dossier
// (noire sur fond blanche) — demande d'Ignacio Calvo, 2026-10-16.
// Lancer : node --test project/tests/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPrototype, doc, H2 } from './harness.mjs';

const w = loadPrototype(['note-ui/note-sections.jsx', 'note-ui/diagnostics.jsx', 'note-ui/editor-data.jsx', 'note-ui/editor-schema.jsx']);
const D = w.NOTE_DATA;
const item = (kind, key) => D.ORDER_DEFS[kind].items().find((it) => it.key === key);
const rx = () => w.orderChipAttrs('rx', item('rx', 'amox500'));
const med = (mode) => w.medicationChipAttrs(D.PATIENT_MEDS[1], mode);

test('une prescription à envoyer : action en attente au checkout (icône blanche sur fond bleu)', () => {
  assert.equal(w.chipDestination(rx()), 'a-envoyer');
});

test('renouveler, cesser et ajuster la dose sont des actions à envoyer aussi', () => {
  for (const rxExtra of [{ renewal: true }, { ceased: true }, { renewal: true, adjust: 'up', adjustFrom: '100 mg' }]) {
    const a = rx(); a.rx = Object.assign({}, a.rx, rxExtra);
    assert.equal(w.chipDestination(a), 'a-envoyer', JSON.stringify(rxExtra));
  }
});

test('une prescription incomplète est encore une action du checkout (elle le bloque)', () => {
  const a = w.orderChipAttrs('rx', item('rx', 'warf') || D.ORDER_DEFS.rx.items().find((it) => it.name === w.TR('Warfarine')));
  assert.ok(w.chipIssues(a).some((i) => i.blocking));
  assert.equal(w.chipDestination(a), 'a-envoyer');
});

test('documentée ou mentionnée : déjà au dossier (icône noire sur fond blanc)', () => {
  assert.equal(w.chipDestination(med('document')), 'dossier');
  assert.equal(w.chipDestination(med('mention')), 'dossier');
});

test('une suggestion pas encore acceptée n’est pas au checkout : icône blanche', () => {
  assert.equal(w.chipDestination(Object.assign(rx(), { pending: true })), 'suggestion');
  assert.equal(w.chipDestination(Object.assign(w.labChipAttrs({ tests: [w.TR('FSC')] }), { pending: true })), 'suggestion');
});

test('envoyée ou annulée : plus rien à envoyer', () => {
  assert.equal(w.chipDestination(Object.assign(rx(), { transmittedAt: '2026-10-16T10:00:00Z' })), 'envoye');
  assert.equal(w.chipDestination(Object.assign(rx(), { transmittedAt: '2026-10-16T10:00:00Z', cancelledAt: '2026-10-16T11:00:00Z' })), 'envoye');
});

test('les requêtes, la référence et les consignes sont aussi des actions à envoyer ; le reste est au dossier', () => {
  for (const type of ['lab', 'imaging', 'referral', 'instructions']) assert.equal(w.chipDestination({ type }), 'a-envoyer', type);
  for (const type of ['problem', 'file', 'diagnostic', 'medication', undefined]) assert.equal(w.chipDestination({ type }), 'dossier', String(type));
  assert.equal(w.chipDestination(null), 'dossier');
});

test('« à envoyer » coïncide avec ce qui devient un document au checkout (buildTransmissionDocs)', () => {
  const chips = {
    prescription: rx(), lab: w.orderChipAttrs('lab', item('lab', 'fsc')), imaging: w.orderChipAttrs('img', item('img', 'rxpoumon')),
    referral: w.orderChipAttrs('ref', item('ref', 'cardio')),
    exam: w.orderChipAttrs('exam', item('exam', 'ecg')), service: w.orderChipAttrs('serv', item('serv', 'pansement')), instructions: { cid: 'ci', type: 'instructions', label: w.TR('Consignes'), details: { title: w.TR('Consignes') } },
    medication: med('document'), file: { cid: 'cf', type: 'file', label: 'a.pdf', details: {} }, problem: { cid: 'cp', type: 'problem', label: 'HTA', details: {} }
  };
  for (const [type, attrs] of Object.entries(chips)) {
    const d = doc(H2(w.TR('Conclusion')), { type: 'paragraph', content: [{ type: 'chip', attrs: Object.assign({}, attrs, { type }) }] });
    const nDocs = w.buildTransmissionDocs(w.scanDoc(d), {}).length;
    assert.equal(nDocs > 0, w.chipDestination(attrs) === 'a-envoyer', type);
  }
  assert.deepEqual(w.CHECKOUT_CHIP_TYPES.slice().sort(), ['exam', 'imaging', 'instructions', 'lab', 'prescription', 'referral', 'service']);
});
