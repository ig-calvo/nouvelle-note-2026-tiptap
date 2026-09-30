// Une seule source pour les valeurs des champs d'une puce (lot 8, D-04) :
// FIELD_OPTIONS alimente le formulaire et l'éditeur inline. Chaque valeur du
// catalogue doit y être — sinon une liste déroulante afficherait une autre
// valeur que celle de la puce (p. ex. « Prioritaire » montré « Routine »).
// Lancer : node --test project/tests/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPrototype } from './harness.mjs';

const w = loadPrototype(['note-ui/editor-data.jsx']);
const D = w.NOTE_DATA;
const F = D.FIELD_OPTIONS;
const rxItems = D.ORDER_DEFS.rx.items().concat(D.PATIENT_MEDS);
const values = (items, field) => [...new Set(items.map((it) => it.details && it.details[field]).filter((v) => v !== undefined && v !== null && String(v) !== ''))];

test('toutes les voies et fréquences du catalogue sont proposées', () => {
  for (const v of values(rxItems, 'route')) assert.ok(F.route.includes(v), 'voie absente : ' + v);
  for (const v of values(rxItems, 'frequency')) assert.ok(F.frequency.includes(v), 'fréquence absente : ' + v);
});

test('tous les renouvellements du catalogue sont proposés', () => {
  for (const v of values(rxItems, 'refills')) assert.ok(F.refills.includes(String(v)), 'renouvellement absent : ' + v);
});

test('toutes les priorités et spécialités des requêtes sont proposées', () => {
  const req = ['lab', 'img', 'ref'].flatMap((k) => D.ORDER_DEFS[k].items());
  for (const v of values(req, 'priority')) assert.ok(F.priority.includes(v), 'priorité absente : ' + v);
  for (const v of values(D.ORDER_DEFS.ref.items(), 'specialty')) assert.ok(F.specialty.includes(v), 'spécialité absente : ' + v);
});

test('pas de doublon dans une liste', () => {
  for (const [k, list] of Object.entries(F)) assert.equal(new Set(list).size, list.length, 'doublon dans ' + k);
});
