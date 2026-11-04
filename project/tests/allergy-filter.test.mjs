// Allergies et interactions dans /rx (demande d'Ignacio Calvo, 2026-11-04) : la
// recherche ne masque plus les produits allergènes, ne les marque plus et n'affiche
// plus de bannière ; la puce montre son avertissement (allergie, interaction)
// une seconde après son ajout dans la note.
// Lancer : node --test project/tests/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPrototype } from './harness.mjs';

const w = loadPrototype(['note-ui/note-sections.jsx', 'note-ui/diagnostics.jsx', 'note-ui/editor-data.jsx', 'note-ui/editor-schema.jsx']);
const D = w.NOTE_DATA;
const keys = (r) => w.flattenRxResults(r).map((it) => it.key);
const item = (test) => D.ORDER_DEFS.rx.items().find(test);
const kinds = (issues) => issues.map((i) => i.kind);

test('par défaut, le patient est allergique à la pénicilline', () => {
  assert.deepEqual(D.getPatientAllergies(), ['Pénicilline']);
});

test('les pénicillines restent dans la recherche : rien de masqué, aucune bannière', () => {
  D.setPatientAllergies(['Pénicilline']);
  D.endOrderSearch();
  const r = D.searchOrder('rx', 'amox');
  assert.ok(keys(r).includes('amox500'));
  assert.equal(r.allergy, undefined);
  assert.equal(D.rxCounts('amox').tout, keys(r).length, 'le rail compte ce qui est affiché');
  D.endOrderSearch();
  assert.equal(D.setShowAllergens, undefined, 'plus de « Afficher » ni de « Masquer »');
  assert.equal(D.applyAllergyFilter, undefined);
});

test('rxAllergyOf repère encore l’allergène ; un produit sans rapport n’est pas touché', () => {
  D.setPatientAllergies(['Pénicilline']);
  assert.equal(D.rxAllergyOf(item((it) => it.key === 'amox500')), 'Pénicilline');
  assert.equal(D.rxAllergyOf({ key: 'x', name: 'Nitrofurantoïne', details: { molecule: 'Nitrofurantoïne' } }), null);
});

test('en contexte d’un diagnostic, l’allergène est dans la liste aussi', () => {
  D.setPatientAllergies(['Pénicilline']);
  D.endOrderSearch();
  const r = D.searchOrder('rx', '', { name: 'Otite moyenne aiguë', code: '65363002' });
  assert.ok((r.contexte || []).some((it) => it.key === 'amox500'));
  assert.equal(r.allergy, undefined);
  D.endOrderSearch();
});

test('les suggestions (colonne, agent) écartent toujours les allergènes', () => {
  D.setPatientAllergies(['Pénicilline']);
  const ctx = D.contextResultsFor({ name: 'Otite moyenne aiguë', code: '65363002' }, 'rx');
  assert.ok(ctx.some((it) => D.rxAllergyOf(it)), 'le contexte du diagnostic contient un allergène');
  const suggested = ctx.filter((it) => !D.rxAllergyOf(it));
  assert.ok(suggested.length < ctx.length && suggested.every((it) => !D.rxAllergyOf(it)));
});

test('sans allergie, rien ne change', () => {
  D.setPatientAllergies([]);
  D.endOrderSearch();
  assert.ok(keys(D.searchOrder('rx', 'amox')).includes('amox500'));
  D.endOrderSearch();
  D.setPatientAllergies(['Pénicilline']);
});

// --- L'avertissement vient sur la puce, une seconde après son ajout ---

test('une ordonnance allergène est retenue une seconde ; au bout du délai, la puce montre l’allergie', () => {
  D.setPatientAllergies(['Pénicilline']);
  const before = Date.now();
  const a = w.holdChipWarnings(w.orderChipAttrs('rx', item((it) => it.key === 'amox500')));
  assert.ok(a.warnAfter >= before + w.CHIP_WARN_DELAY_MS && a.warnAfter <= Date.now() + w.CHIP_WARN_DELAY_MS, 'une seconde plus tard');
  assert.equal(w.CHIP_WARN_DELAY_MS, 1000);
  assert.deepEqual(kinds(w.shownChipIssues(a, a.warnAfter - 1)), [], 'pas encore');
  assert.deepEqual(kinds(w.shownChipIssues(a, a.warnAfter)), ['allergy'], 'au bout du délai');
  assert.deepEqual(kinds(w.shownChipIssues(Object.assign({}, a, { warnAfter: null }), 0)), ['allergy'], 'délai levé');
  assert.deepEqual(kinds(w.chipIssues(a)), ['allergy'], 'l’état de la puce, lui, ne dépend pas du temps (checkout)');
});

test('une interaction de haut risque est retenue de la même façon', () => {
  const cipro = item((it) => it.name === w.TR('Ciprofloxacine'));
  assert.ok(cipro, 'ciprofloxacine au catalogue');
  const a = w.holdChipWarnings(w.orderChipAttrs('rx', cipro));
  assert.ok(a.warnAfter);
  assert.deepEqual(kinds(w.shownChipIssues(a, a.warnAfter - 1)), []);
  assert.ok(kinds(w.shownChipIssues(a, a.warnAfter)).includes('interaction'));
});

test('sans allergie ni interaction, rien n’est retenu ; une puce incomplète garde son état tout de suite', () => {
  const plain = w.orderChipAttrs('rx', item((it) => it.key === 'vento100'));
  assert.equal(w.holdChipWarnings(plain), plain);
  assert.equal(plain.warnAfter, undefined);
  const a = w.holdChipWarnings(w.orderChipAttrs('rx', item((it) => it.key === 'amox500')));
  const incomplete = Object.assign({}, a, { details: Object.assign({}, a.details, { route: '' }) });
  assert.deepEqual(kinds(w.shownChipIssues(incomplete, a.warnAfter - 1)), ['incomplete'], 'seuls l’allergie et l’interaction attendent');
  assert.equal(w.holdChipWarnings(null), null);
});

test('une puce rechargée avec un délai déjà passé montre tout de suite ses avertissements', () => {
  const a = w.orderChipAttrs('rx', item((it) => it.key === 'amox500'));
  assert.deepEqual(kinds(w.shownChipIssues(Object.assign({}, a, { warnAfter: Date.now() - 60000 }))), ['allergy']);
});
