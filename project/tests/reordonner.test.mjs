// Réordonner les lignes d'un diagnostic et les diagnostics entre eux
// (PLAN-conduite-precedente.md, partie B) — les calculs purs ; le geste
// lui-même (clavier, menu, poignée) passe par moveDxLine / moveDxRegion.
// Lancer : node --test project/tests/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPrototype } from './harness.mjs';

const w = loadPrototype(['note-ui/note-sections.jsx', 'note-ui/diagnostics.jsx']);
const R = 'diagnosticRegion', P = 'paragraph', S = 'sectionSplit', T = 'clinicalTool';

test('les régions d’une zone : la ligne Détails / Conclusion est une borne (Q5)', () => {
  const types = [R, P, R, S, P, R, P, T, R, P];
  assert.deepEqual(w.dxZoneRegionSlots(types, 0), [0, 2], 'Détails');
  assert.deepEqual(w.dxZoneRegionSlots(types, 2), [0, 2]);
  assert.deepEqual(w.dxZoneRegionSlots(types, 5), [5, 8], 'Conclusion : le texte et l’outil entre deux régions ne comptent pas');
  assert.deepEqual(w.dxZoneRegionSlots([S, R], 1), [1]);
});

test('déplacer dans une liste', () => {
  assert.deepEqual(w.dxMoveInList(['a', 'b', 'c'], 0, 2), ['b', 'c', 'a']);
  assert.deepEqual(w.dxMoveInList(['a', 'b', 'c'], 2, 0), ['c', 'a', 'b']);
  assert.deepEqual(w.dxMoveInList(['a', 'b', 'c'], 1, 1), ['a', 'b', 'c']);
});

test('glisser-déposer : la fente visée donne le rang d’arrivée, -1 sans déplacement', () => {
  // 3 éléments, celui du rang 1 : fentes 0..3
  assert.equal(w.dxDropRank(1, 0), 0);
  assert.equal(w.dxDropRank(1, 1), -1, 'juste avant lui-même');
  assert.equal(w.dxDropRank(1, 2), -1, 'juste après lui-même');
  assert.equal(w.dxDropRank(1, 3), 2);
  assert.equal(w.dxDropRank(0, 3), 2);
});
