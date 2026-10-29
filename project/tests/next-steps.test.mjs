// Suggestions de la suite après chaque fonction ajoutée (rencontre du
// 2026-10-27, lot 2 : barre en ligne sous le curseur).
// Lancer : node --test project/tests/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPrototype } from './harness.mjs';

const w = loadPrototype(['note-ui/note-sections.jsx', 'note-ui/diagnostics.jsx', 'note-ui/editor-data.jsx', 'note-ui/editor-schema.jsx']);
const D = w.NOTE_DATA;
const item = (kind, key) => D.ORDER_DEFS[kind].items().find((it) => it.key === key);
const ids = (list) => list.map((s) => s.id);
const ITU = { id: 'd1', name: 'Cystite', code: 'N30.0' };
const NO_CTX = { notes: [], sommaire: [] };

test('un diagnostic ajouté : son gabarit de conclusion, puis ses prescriptions et requêtes', () => {
  const s = D.nextStepSuggestions({ region: ITU, ctx: NO_CTX });
  assert.deepEqual(ids(s), ['tpl:itu-mine', 'order:rx:cat-44', 'order:rx:cat-46', 'order:rx:cat-45', 'order:lab:srum']);
  assert.equal(s[0].regionId, 'd1');
});

test('déjà sous le diagnostic : ni l’ordonnance ajoutée, ni le gabarit appliqué, ni l’analyse déjà demandée', () => {
  const rx = w.orderChipAttrs('rx', item('rx', 'cat-44'));
  const lab = w.buildRequestChips([item('lab', 'srum')], 'lab')[0];
  const mine = D.dxConclusionOptions(ITU, NO_CTX).find((o) => o.kind === 'mine');
  const s = D.nextStepSuggestions({ region: ITU, present: [rx, lab], sources: [mine.source], ctx: NO_CTX });
  assert.deepEqual(ids(s), ['tpl:itu', 'order:rx:cat-46', 'order:rx:cat-45']);
});

test('une ligne à compléter compte comme déjà là', () => {
  const draft = w.buildDraftChipNode({ kind: 'rx', key: 'cat-46' }, 'x').attrs;
  assert.ok(!ids(D.nextStepSuggestions({ region: ITU, present: [draft], ctx: NO_CTX })).includes('order:rx:cat-46'));
});

test('une ordonnance hors diagnostic : le diagnostic qui va avec, puis le reste de son contexte', () => {
  const rx = w.orderChipAttrs('rx', item('rx', 'cat-44'));
  assert.deepEqual(D.orderItemForChip(rx).item.key, 'cat-44');
  const s = D.nextStepSuggestions({ chip: rx, present: [rx], diagnoses: [], ctx: NO_CTX });
  assert.equal(s[0].kind, 'dx');
  assert.equal(D.dxContextFor(s[0].dx).key, 'itu');
  assert.ok(!ids(s).includes('order:rx:cat-44'), 'pas l’ordonnance qu’on vient d’ajouter');
  assert.ok(ids(s).includes('order:lab:srum'));
});

test('diagnostic déjà dans la note : on ne le suggère pas de nouveau', () => {
  const rx = w.orderChipAttrs('rx', item('rx', 'cat-44'));
  const s = D.nextStepSuggestions({ chip: rx, present: [rx], diagnoses: [{ name: 'Cystite', code: 'N30.0' }], ctx: NO_CTX });
  assert.ok(s.every((x) => x.kind !== 'dx'));
});

test('une fonction sans contexte connu : rien à suggérer', () => {
  const rx = w.orderChipAttrs('rx', item('rx', D.ORDER_DEFS.rx.items().find((it) => !D.DX_CONTEXTS.some((c) => c.rx.includes(it.key))).key));
  assert.deepEqual(D.nextStepSuggestions({ chip: rx, present: [rx], ctx: NO_CTX }), []);
  assert.deepEqual(D.nextStepSuggestions({ region: { id: 'd2', name: 'Fibrillation auriculaire', code: 'I48.9' }, ctx: NO_CTX }), []);
});
