// Texte d'une puce hors de l'éditeur (lot 5) : en liste de notes et à
// l'impression, seul le texte reste — statut, valeur principale, valeurs
// secondaires — sans icône, état ni commentaire.
// Lancer : node --test project/tests/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPrototype } from './harness.mjs';

const w = loadPrototype(['note-ui/note-sections.jsx', 'note-ui/diagnostics.jsx', 'note-ui/editor-data.jsx', 'note-ui/editor-schema.jsx']);
const attrs = (kind, key) => w.orderChipAttrs(kind, w.NOTE_DATA.ORDER_DEFS[kind].items().find((it) => it.key === key));

test('prescription : nom, dose — posologie', () => {
  assert.equal(w.chipPrintText(attrs('rx', 'amox500')), 'Amoxicilline 500mg — 1 comp. PO TID #21 7j R0');
});

test('le statut vient en tête : renouvelée, cessée, annulée', () => {
  const a = attrs('rx', 'amox500');
  assert.match(w.chipPrintText(Object.assign({}, a, { rx: Object.assign({}, a.rx, { renewal: true }) })), /^Renouvelée Amoxicilline/);
  assert.equal(w.chipPrintText(Object.assign({}, a, { rx: Object.assign({}, a.rx, { ceased: true, sig: 'Cessé' }) })), 'Cessée Amoxicilline 500mg');
  assert.match(w.chipPrintText(Object.assign({}, a, { transmittedAt: '2026-09-29T14:00:00Z', cancelledAt: '2026-09-29T15:00:00Z' })), /^Annulée Amoxicilline/);
});

test('ni état ni commentaire : incomplète, transmise, commentée → même texte', () => {
  const a = attrs('rx', 'amox500');
  const plain = w.chipPrintText(a);
  const noisy = Object.assign({}, a, { transmittedAt: '2026-09-29T14:00:00Z', transmitError: 'x', details: Object.assign({}, a.details, { comment: 'Ne pas substituer' }) });
  assert.equal(w.chipPrintText(noisy), plain);
});

test('labo : analyses — priorité, à jeun', () => {
  assert.equal(w.chipPrintText(attrs('lab', 'fsc')), 'FSC — Routine');
  assert.equal(w.chipPrintText(attrs('lab', 'lipide')), 'Cholestérol total, HDL, LDL, Triglycérides — Routine, à jeun');
});

test('imagerie : examen — priorité ; référence : préfixée, sinon illisible sans icône', () => {
  assert.equal(w.chipPrintText(attrs('img', 'rxpoumon')), 'Radiographie pulmonaire — Routine');
  assert.equal(w.chipPrintText(attrs('ref', 'cardio')), 'Référence : Cardiologie — Routine');
});

test('autres puces : leur libellé', () => {
  assert.equal(w.chipPrintText({ type: 'file', label: 'TDM abdomino-pelvien.pdf' }), 'TDM abdomino-pelvien.pdf');
  assert.equal(w.chipPrintText(null), '');
});

test('deux puces séparées par un espace, ou collées : « ; » entre elles ; le texte autour ne change pas', () => {
  const chip = (cid) => ({ type: 'chip', attrs: { cid, type: 'file', label: cid } });
  const t = (text) => ({ type: 'text', text });
  const flat = (nodes) => w.separateAdjacentChips(nodes).map((n) => (n.type === 'chip' ? '[' + n.attrs.cid + ']' : n.text)).join('');
  assert.equal(flat([t('Plan : '), chip('a'), t(' '), chip('b'), t(' ')]), 'Plan : [a]; [b] ');
  assert.equal(flat([chip('a'), chip('b')]), '[a]; [b]');
  assert.equal(flat([chip('a'), t(' et '), chip('b')]), '[a] et [b]');
  assert.deepEqual(w.separateAdjacentChips(undefined), []);
});
