// Destinataire au checkout (lot 3 du plan PLAN-checkout-transmission-generale.md) :
// la pharmacie favorite au dossier du patient est préremplie sur l'ordonnance,
// tant que personne n'a touché à ses destinataires et que le tweak
// « Pharmacie favorite au dossier » est actif.
// Lancer : node --test project/tests/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPrototype, doc, H2 } from './harness.mjs';

const w = loadPrototype(['note-ui/note-sections.jsx', 'note-ui/diagnostics.jsx', 'note-ui/editor-data.jsx', 'note-ui/editor-schema.jsx']);
const D = w.NOTE_DATA;
const chipDoc = (...attrs) => doc(H2(w.TR('Conclusion')), { type: 'paragraph', content: attrs.map((a) => ({ type: 'chip', attrs: a })) });
const rxChip = () => w.orderChipAttrs('rx', D.ORDER_DEFS.rx.items().find((it) => it.key === 'amox500'));
const ordonnance = (tx) => w.buildTransmissionDocs(w.scanDoc(chipDoc(rxChip())), tx || {}).find((d) => d.kind === 'prescription');

test('la pharmacie du patient existe dans le bottin', () => {
  assert.ok(D.PHARMACIES.some((p) => p.id === D.PATIENT.pharmacyId));
});

test('ordonnance sans destinataire choisi : la pharmacie favorite au dossier est préremplie', () => {
  delete w.__PATIENT_PHARMACY;
  const r = ordonnance().recipients;
  const ph = D.PHARMACIES.find((p) => p.id === D.PATIENT.pharmacyId);
  assert.equal(r.length, 1);
  assert.equal(r[0].name, ph.name);
  assert.equal(r[0].fax, ph.fax);
});

test('destinataires retirés ou tweak éteint : rien n’est prérempli', () => {
  delete w.__PATIENT_PHARMACY;
  assert.deepEqual(ordonnance({ rx: { recipients: [] } }).recipients, []);
  w.__PATIENT_PHARMACY = false;
  assert.deepEqual(ordonnance().recipients, []);
  delete w.__PATIENT_PHARMACY;
});

test('seule l’ordonnance reçoit la pharmacie', () => {
  delete w.__PATIENT_PHARMACY;
  const lab = w.orderChipAttrs('lab', D.ORDER_DEFS.lab.items()[0]);
  const docs = w.buildTransmissionDocs(w.scanDoc(chipDoc(lab)), {});
  assert.ok(docs.length > 0);
  docs.forEach((d) => assert.deepEqual(d.recipients, []));
});
