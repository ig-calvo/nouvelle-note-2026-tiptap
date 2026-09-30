// États d'une puce (rencontre inline entity : plusieurs niveaux d'erreur) :
// chipIssues dérive les états des attrs ; le checkout les reprend et bloque
// la complétion d'un document tant qu'un item est incomplet.
// Lancer : node --test project/tests/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPrototype, doc, H2 } from './harness.mjs';

const w = loadPrototype(['note-ui/note-sections.jsx', 'note-ui/diagnostics.jsx', 'note-ui/editor-data.jsx', 'note-ui/editor-schema.jsx']);
const item = (kind, test) => w.NOTE_DATA.ORDER_DEFS[kind].items().find(test);
const attrsFor = (kind, it) => w.orderChipAttrs(kind, it);
const kinds = (issues) => issues.map((i) => i.kind);

test('une prescription complète n’a aucun état', () => {
  const a = attrsFor('rx', item('rx', (it) => it.key === 'amox500'));
  assert.deepEqual(w.chipIssues(a), []);
});

test('sans fréquence : incomplète, bloquante, et le message nomme le champ', () => {
  const a = attrsFor('rx', item('rx', (it) => it.name === 'Warfarine'));
  const issues = w.chipIssues(a);
  assert.deepEqual(kinds(issues), ['incomplete']);
  assert.equal(issues[0].blocking, true);
  assert.equal(issues[0].level, 'error');
  assert.match(issues[0].message, /fréquence/);
});

test('un renouvellement vide vaut R0 : pas « incomplète »', () => {
  const a = attrsFor('rx', item('rx', (it) => it.name === 'Atorvastatine'));
  assert.equal(a.details.refills, '');
  assert.deepEqual(w.chipIssues(a), []);
});

test('interaction simulée : erreur non bloquante', () => {
  const a = attrsFor('rx', item('rx', (it) => it.name === 'Ciprofloxacine'));
  const issues = w.chipIssues(a);
  assert.deepEqual(kinds(issues), ['interaction']);
  assert.equal(issues[0].blocking, undefined);
  assert.match(issues[0].message, /simulé/);
});

test('référence sans question clinique : avertissement', () => {
  const a = attrsFor('ref', item('ref', (it) => it.key === 'cardio'));
  assert.deepEqual(w.chipIssues(a).map((i) => [i.kind, i.level]), [['missing-info', 'warning']]);
  a.details = Object.assign({}, a.details, { question: 'Souffle systolique à évaluer' });
  assert.deepEqual(w.chipIssues(a), []);
});

test('transmise : ne garde que l’échec de transmission ; annulée : rien', () => {
  const a = attrsFor('rx', item('rx', (it) => it.name === 'Warfarine'));
  assert.deepEqual(w.chipIssues(Object.assign({}, a, { transmittedAt: '2026-09-29T14:00:00Z' })), []);
  assert.deepEqual(kinds(w.chipIssues(Object.assign({}, a, { transmitError: 'envoi non reçu' }))), ['transmission', 'incomplete']);
  assert.deepEqual(w.chipIssues(Object.assign({}, a, { transmittedAt: '2026-09-29T14:00:00Z', cancelledAt: '2026-09-29T15:00:00Z' })), []);
});

test('une prescription cessée n’est jamais « incomplète »', () => {
  const a = attrsFor('rx', item('rx', (it) => it.name === 'Warfarine'));
  a.rx = Object.assign({}, a.rx, { ceased: true });
  a.details = {};
  assert.deepEqual(w.chipIssues(a), []);
});

test('checkout : l’ordonnance porte le message bloquant de son item incomplet, les items leurs états', () => {
  const ok = { type: 'chip', attrs: attrsFor('rx', item('rx', (it) => it.key === 'amox500')) };
  const incomplete = { type: 'chip', attrs: attrsFor('rx', item('rx', (it) => it.name === 'Warfarine')) };
  const d = doc(H2('Conclusion'), { type: 'paragraph', content: [ok, incomplete] });
  const rx = w.buildTransmissionDocs(w.scanDoc(d), {}).find((x) => x.id === 'rx');
  assert.equal(rx.blocking.length, 1);
  assert.match(rx.blocking[0], /Warfarine.*fréquence/);
  assert.deepEqual(rx.items.map((it) => kinds(it.issues)), [[], ['incomplete']]);
  const alone = w.buildTransmissionDocs(w.scanDoc(doc(H2('Conclusion'), { type: 'paragraph', content: [ok] })), {}).find((x) => x.id === 'rx');
  assert.deepEqual(alone.blocking, []);
});
