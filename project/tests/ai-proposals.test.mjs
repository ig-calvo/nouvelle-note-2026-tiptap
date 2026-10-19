// Piste de vision (lot 9) : l'Assistant IA propose des puces en attente, avec
// le même mécanisme qu'un gabarit (D-03) — rien n'est créé avant d'être accepté.
// Lancer : node --test project/tests/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPrototype, doc, H2 } from './harness.mjs';

const w = loadPrototype(['note-ui/note-sections.jsx', 'note-ui/diagnostics.jsx', 'note-ui/editor-data.jsx', 'note-ui/editor-schema.jsx']);

test('les propositions d’exemple sont des items du catalogue, en attente, signées « Assistant IA »', () => {
  const chips = w.NOTE_DATA.AI_SAMPLE_PROPOSALS.map((p) => w.buildPendingChipNode(p, 'Assistant IA'));
  assert.ok(chips.every(Boolean), 'chaque proposition trouve son item');
  assert.deepEqual(chips.map((c) => c.attrs.type), ['lab', 'prescription']);
  assert.ok(chips.every((c) => c.attrs.pending && c.attrs.proposedBy === 'Assistant IA'));
  assert.equal(chips[1].attrs.rx.name, 'Nitrofurantoine');
  assert.match(chips[1].attrs.rx.sig, /5j/, 'la durée proposée apparaît dans la posologie');
  assert.deepEqual(w.chipIssues(chips[1].attrs), [], 'la prescription proposée est complète');
});

test('la barre des ajouts en attente les attribue à l’Assistant IA ; refusées, elles ne laissent rien', () => {
  const chips = w.NOTE_DATA.AI_SAMPLE_PROPOSALS.map((p) => w.buildPendingChipNode(p, 'Assistant IA'));
  const d = doc(H2('Détails'), { type: 'paragraph', content: [chips[0], { type: 'text', text: ' ' }, chips[1]] });
  assert.deepEqual(w.pendingSummary(d).sources, ['Assistant IA']);
  const rejected = w.resolvePendingInDoc(d, false);
  assert.deepEqual(rejected.content[1].content, []);
});
