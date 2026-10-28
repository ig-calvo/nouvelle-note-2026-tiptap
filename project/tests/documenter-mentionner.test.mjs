// Documenter / Mentionner (lot 4 du plan PLAN-prescription-inline.md, piste de
// vision derrière le tweak « Documenter / Mentionner une médication ») : une
// puce documentaire pour une médication du profil, sans prescription. Documenter
// = ajoutée au profil sans prescrire ; Mentionner = parle d'une médication déjà
// au profil. Aucune des deux ne part au checkout.
// Lancer : node --test project/tests/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPrototype, doc, H2 } from './harness.mjs';

const w = loadPrototype(['note-ui/note-sections.jsx', 'note-ui/diagnostics.jsx', 'note-ui/editor-data.jsx', 'note-ui/editor-schema.jsx']);
const D = w.NOTE_DATA;
const med = (key) => D.PATIENT_MEDS.find((m) => m.key === key);
const chipDoc = (...attrs) => doc(H2(w.TR('Conclusion')), { type: 'paragraph', content: attrs.map((a) => ({ type: 'chip', attrs: a })) });

test('documenter : une puce « medication » en mode document, avec le statut du profil', () => {
  const a = w.medicationChipAttrs(med('med-nitrofurantoine'), 'document');
  assert.equal(a.type, 'medication');
  assert.deepEqual([a.rx.kind, a.rx.mode, a.rx.medStatus, a.rx.medDate], ['med', 'document', 'cessée', '12/2025']);
  assert.equal(a.label, w.L('Nitrofurantoïne') + ' 100 mg');
  assert.equal(a.text, w.L('Nitrofurantoïne') + ' 100 mg — ' + w.L('1 co PO BID'));
  assert.equal(a.details.molecule, w.TR('Nitrofurantoïne'));
});

test('mentionner : même puce, en mode mention ; un item du catalogue n’a pas de statut', () => {
  const m = w.medicationChipAttrs(med('med-tylenol-100'), 'mention');
  assert.deepEqual([m.rx.mode, m.rx.medStatus, m.rx.medDate], ['mention', 'active', null]);
  const cat = w.medicationChipAttrs(D.RX_ITEMS[0], 'document');
  assert.equal(cat.rx.medStatus, null);
  assert.equal(cat.type, 'medication');
});

test('statut au profil en texte : actif = rien ; échu et cessé portent leur date', () => {
  assert.equal(D.medStatusText(med('med-tylenol-100')), '');
  assert.equal(D.medStatusText(med('med-tylenol-500')), w.TR('Échu') + ' 02/2026');
  assert.equal(D.medStatusText(med('med-nitrofurantoine')), w.TR('Cessé') + ' 12/2025');
  assert.equal(D.medStatusText(w.medicationChipAttrs(med('med-nitrofurantoine'), 'mention').rx), w.TR('Cessé') + ' 12/2025');
});

test('une puce documentaire n’a ni état ni badge : rien à compléter, rien à envoyer', () => {
  // Dose vide : la puce serait incomplète si c'était une prescription.
  const t = med('med-tylenol-100');
  const a = w.medicationChipAttrs(Object.assign({}, t, { dose: '', details: Object.assign({}, t.details, { dose: '', unit: '' }) }), 'document');
  assert.deepEqual(w.chipIssues(a), []);
  assert.deepEqual(w.chipStatusBadges(a), []);
});

test('checkout : une puce documentaire ou mentionnée ne crée aucun document', () => {
  const d = chipDoc(w.medicationChipAttrs(med('med-tylenol-100'), 'document'), w.medicationChipAttrs(med('med-tylenol-500'), 'mention'));
  assert.deepEqual(w.buildTransmissionDocs(w.scanDoc(d), {}), []);
  // À côté d'une vraie prescription, seule celle-ci est dans l'ordonnance.
  const rx = w.orderChipAttrs('rx', D.ORDER_DEFS.rx.items().find((it) => it.key === 'amox500'));
  const both = chipDoc(rx, w.medicationChipAttrs(med('med-tylenol-100'), 'document'));
  const docs = w.buildTransmissionDocs(w.scanDoc(both), {});
  assert.equal(docs.length, 1);
  assert.deepEqual(docs[0].items.map((it) => it.type), ['prescription']);
});

test('Sommaire : documentée = ligne « en attente » ; mentionnée = rien (le profil ne change pas)', () => {
  const doc1 = w.medicationChipAttrs(med('med-tylenol-100'), 'document');
  const men = w.medicationChipAttrs(med('med-tylenol-500'), 'mention');
  const items = w.scanDoc(chipDoc(doc1, men)).items;
  assert.deepEqual(items.map((it) => [it.type, it.label]), [['medication', w.TR('Tylenol 100 mg')]]);
});

test('Journal : documentée = entrée « Inscription de médication » ; mentionnée = aucune', () => {
  const documented = w.medicationChipAttrs(med('med-tylenol-100'), 'document');
  const mention = w.medicationChipAttrs(med('med-tylenol-500'), 'mention');
  const log = w.buildActionLog(chipDoc(Object.assign({ author: 'Dr Lefebvre', savedAt: '2026-10-15T14:00:00Z' }, documented), mention), []);
  assert.equal(log.length, 1);
  assert.equal(log[0].logType, 'inscriptionMedication');
  assert.equal(log[0].label, w.TR('Inscription de médication'));
  assert.equal(log[0].verb, w.TR('Documentée'));
  assert.equal(log[0].icon, 'medication');
});

test('texte hors éditeur : nom, dose, posologie et statut au profil, sans icône', () => {
  assert.equal(w.chipPrintText(w.medicationChipAttrs(med('med-tylenol-100'), 'mention')), w.TR('Tylenol 100 mg') + ' — ' + w.L('1 co PO PRN'));
  assert.equal(w.chipPrintText(w.medicationChipAttrs(med('med-nitrofurantoine'), 'document')), w.L('Nitrofurantoïne') + ' 100 mg — ' + w.L('1 co PO BID') + ', ' + w.TR('Cessé') + ' 12/2025');
});

test('Documenter : toujours offert, sans tweak, mais seulement pour un produit hors du dossier', () => {
  assert.deepEqual(D.medActions(D.RX_ITEMS[0]), ['documenter']);
  for (const k of ['med-tylenol-100', 'med-tylenol-500', 'med-nitrofurantoine']) {
    assert.ok(!D.medActions(med(k)).includes('documenter'), k); // déjà au dossier : rien à documenter
    assert.ok(!D.medActions(med(k)).includes('mentionner'), k); // Mentionner n'est plus offert
  }
  assert.equal(D.defaultMedAction(med('med-tylenol-100')), 'renouveler'); // l'action principale de la ligne ne change pas
});
