// Retirer de la note ≠ annuler (D-05) : le Journal lit le document ET les
// événements d'action de la note (transmis, annulé). Un chip transmis puis
// effacé reste au Journal ; un chip jamais transmis et effacé disparaît.
// Le checkout garde un document transmis quand un de ses items quitte la note.
// Lancer : node --test project/tests/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPrototype, doc, H2 } from './harness.mjs';

const w = loadPrototype(['note-ui/note-sections.jsx', 'note-ui/diagnostics.jsx', 'note-ui/editor-data.jsx', 'note-ui/editor-schema.jsx']);

const rxChip = (cid, name, extra) => ({
  type: 'chip',
  attrs: Object.assign({
    cid, type: 'prescription', label: name, text: name + ' — 1 comp. PO TID',
    rx: { name, dose: '', sig: '1 comp. PO TID', kind: 'rx' }, details: {},
    savedAt: '2026-09-29T14:00:00.000Z', author: 'Dre Test'
  }, extra || {})
});
const note = (...chips) => doc(H2('Conclusion'), { type: 'paragraph', content: chips });
const sentEvent = (chip, at) => ({ cid: chip.attrs.cid, type: 'transmis', at, author: 'Dre Test', snapshot: Object.assign({}, chip.attrs, { transmittedAt: at }) });

test('un chip présent et transmis : une entrée, avec la date de transmission', () => {
  const amox = rxChip('c1', 'Amoxicilline 500 mg', { transmittedAt: '2026-09-29T14:05:00.000Z' });
  const log = w.buildActionLog(note(amox), [sentEvent(amox, '2026-09-29T14:05:00.000Z')]);
  assert.equal(log.length, 1);
  assert.equal(log[0].transmittedAt, '2026-09-29T14:05:00.000Z');
  assert.equal(log[0].removed, false);
  assert.equal(log[0].sourceId, 'c1');
});

test('transmis puis retiré de la note : l’entrée reste, marquée retirée, sans source vers quoi défiler', () => {
  const amox = rxChip('c1', 'Amoxicilline 500 mg');
  const log = w.buildActionLog(note(), [sentEvent(amox, '2026-09-29T14:05:00.000Z')]);
  assert.equal(log.length, 1);
  assert.equal(log[0].title, 'Amoxicilline 500 mg — 1 comp. PO TID');
  assert.equal(log[0].removed, true);
  assert.equal(log[0].sourceType, null);
  assert.equal(log[0].logType, 'prescriptions');
});

test('jamais transmis puis effacé : aucune entrée', () => {
  assert.deepEqual(w.buildActionLog(note(), []), []);
  assert.deepEqual(w.buildActionLog(note()), []); // sans événements : comportement d'avant
});

test('annulé : l’entrée garde la transmission et ajoute l’annulation, même retirée ensuite', () => {
  const amox = rxChip('c1', 'Amoxicilline 500 mg');
  const events = [
    sentEvent(amox, '2026-09-29T14:05:00.000Z'),
    { cid: 'c1', type: 'annule', at: '2026-09-29T14:20:00.000Z', author: 'Dre Test', snapshot: Object.assign({}, amox.attrs, { cancelledAt: '2026-09-29T14:20:00.000Z' }) }
  ];
  const present = w.buildActionLog(note(amox), events);
  assert.equal(present[0].transmittedAt, '2026-09-29T14:05:00.000Z');
  assert.equal(present[0].cancelledAt, '2026-09-29T14:20:00.000Z');
  const removed = w.buildActionLog(note(), events);
  assert.equal(removed.length, 1);
  assert.equal(removed[0].cancelledAt, '2026-09-29T14:20:00.000Z');
  assert.equal(removed[0].removed, true);
});

test('checkout : retirer un item d’une ordonnance transmise la laisse transmise ; en ajouter un la rouvre', () => {
  const a = rxChip('c1', 'Amoxicilline 500 mg'), b = rxChip('c2', 'Ibuprofène 400 mg'), c = rxChip('c3', 'Salbutamol 100 mcg');
  const tx = { rx: { complete: true, transmitted: true, itemIds: 'c1,c2' } };
  const ordonnance = (d) => w.buildTransmissionDocs(w.scanDoc(d), tx).find((x) => x.id === 'rx');
  assert.equal(ordonnance(note(a, b)).transmitted, true);
  assert.equal(ordonnance(note(a)).transmitted, true, 'item retiré : le document est parti quand même');
  assert.equal(ordonnance(note(a, b, c)).transmitted, false, 'item ajouté : à compléter de nouveau');
  assert.equal(ordonnance(note(a, b, c)).complete, false);
});
