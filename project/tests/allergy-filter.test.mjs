// Allergies dans la recherche /rx (débrief du 2026-10-28) : les produits d'une
// classe à laquelle le patient est allergique sont masqués, la recherche le dit
// (`allergy`), « Afficher » les remet. Les médications au dossier restent.
// Lancer : node --test project/tests/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPrototype } from './harness.mjs';

const w = loadPrototype(['note-ui/note-sections.jsx', 'note-ui/diagnostics.jsx', 'note-ui/editor-data.jsx', 'note-ui/editor-schema.jsx']);
const D = w.NOTE_DATA;
const keys = (r) => w.flattenRxResults(r).map((it) => it.key);

test('par défaut, le patient est allergique à la pénicilline', () => {
  assert.deepEqual(D.getPatientAllergies(), ['Pénicilline']);
});

test('les pénicillines sont masquées, la recherche dit combien et pourquoi', () => {
  D.setPatientAllergies(['Pénicilline']);
  D.endOrderSearch();
  const r = D.searchOrder('rx', 'amox');
  assert.equal(keys(r).includes('amox500'), false);
  assert.equal(r.allergy.shown, false);
  assert.deepEqual(r.allergy.names, ['Pénicilline']);
  assert.ok(r.allergy.count >= 1);
  assert.equal(D.rxCounts('amox').tout, keys(r).length, 'le rail compte ce qui est affiché');
  D.endOrderSearch();
});

test('« Afficher » remet les produits, marqués ; fermer la recherche les masque de nouveau', () => {
  D.setPatientAllergies(['Pénicilline']);
  D.endOrderSearch();
  D.setShowAllergens(true);
  const r = D.searchOrder('rx', 'amox');
  assert.ok(keys(r).includes('amox500'));
  assert.equal(r.allergy.shown, true);
  const amox = w.flattenRxResults(r).find((it) => it.key === 'amox500');
  assert.equal(D.rxAllergyOf(amox), 'Pénicilline');
  D.endOrderSearch();
  assert.equal(keys(D.searchOrder('rx', 'amox')).includes('amox500'), false);
  D.endOrderSearch();
});

test('aussi en contexte d’un diagnostic ; un produit sans rapport n’est pas touché', () => {
  D.setPatientAllergies(['Pénicilline']);
  D.endOrderSearch();
  const r = D.searchOrder('rx', '', { name: 'Otite moyenne aiguë', code: '65363002' });
  assert.equal((r.contexte || []).some((it) => it.key === 'amox500'), false);
  assert.ok(r.allergy && r.allergy.count >= 1);
  assert.equal(D.rxAllergyOf({ key: 'x', name: 'Nitrofurantoïne', details: { molecule: 'Nitrofurantoïne' } }), null);
  D.endOrderSearch();
});

test('sans allergie, rien n’est masqué et la recherche ne parle pas d’allergie', () => {
  D.setPatientAllergies([]);
  D.endOrderSearch();
  const r = D.searchOrder('rx', 'amox');
  assert.ok(keys(r).includes('amox500'));
  assert.equal(r.allergy, undefined);
  D.endOrderSearch();
  D.setPatientAllergies(['Pénicilline']);
});
