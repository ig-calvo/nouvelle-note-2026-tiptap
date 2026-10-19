// « + » du Sommaire derrière le tweak « Le « + » du sommaire ajoute dans la
// note » : Problèmes et Antécédents ouvrent /dx, Médications (lot 6 du plan
// PLAN-prescription-inline.md) ouvre /rx ; les autres boîtes gardent leur modale.
// Lancer : node --test project/tests/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPrototype } from './harness.mjs';

const D = loadPrototype(['note-ui/editor-data.jsx']).NOTE_DATA;

test('Problèmes et Antécédents : /dx, documenté comme problème ou antécédent', () => {
  assert.deepEqual(D.summaryAddDetail('problems'), { documentAs: 'probleme' });
  assert.deepEqual(D.summaryAddDetail('history'), { documentAs: 'antecedent' });
});

test('Médications : /rx dans la note', () => {
  assert.deepEqual(D.summaryAddDetail('meds'), { command: 'rx' });
});

test('les autres boîtes gardent leur modale (null)', () => {
  for (const id of ['tasks', 'vitals', 'habits', 'programs', 'allergies', 'results', 'immun', 'family', 'clinicalTools', 'requests']) {
    assert.equal(D.summaryAddDetail(id), null, id);
  }
});
