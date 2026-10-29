// Ajout en lot par virgules dans les recherches « / » (« /lab fsc, tsh, … ») :
// chaque terme suivi d'une virgule est résolu à son meilleur résultat, le
// dernier terme reste la recherche en cours (orderBatch, editor-data.jsx).
// Lancer : node --test project/tests/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPrototype } from './harness.mjs';

const w = loadPrototype(['note-ui/note-sections.jsx', 'note-ui/diagnostics.jsx', 'note-ui/editor-data.jsx', 'note-ui/editor-schema.jsx']);
const D = w.NOTE_DATA;
const picks = (kind, q) => D.orderBatch(kind, q).picks.map((p) => (p.item ? p.item.name : null));

test('sans virgule : pas de lot', () => {
  assert.equal(D.orderBatch('lab', 'fsc'), null);
});

test('le dernier terme reste la recherche en cours ; les termes vides sont ignorés', () => {
  const b = D.orderBatch('lab', 'fsc,, tsh, fer');
  assert.deepEqual(b.picks.map((p) => p.term), ['fsc', 'tsh']);
  assert.equal(b.current, 'fer');
});

test('chaque fonction résout ses termes : prescription, requêtes, consignes, antécédents', () => {
  assert.deepEqual(picks('rx', 'tylenol, ventolin, '), ['Tylenol', 'Ventolin']);
  assert.deepEqual(picks('lab', 'fsc, tsh, '), ['Formule sanguine complète', 'Hormone thyréostimulante']);
  assert.deepEqual(picks('img', 'echo abdo, '), ['Échographie abdominale']);
  assert.deepEqual(picks('ref', 'cardio, dermato, '), ['Cardiologie', 'Dermatologie']);
  assert.deepEqual(picks('exam', 'ecg, holter, '), ['ECG au repos', 'Holter 24 h']);
  assert.deepEqual(picks('serv', 'pansement, points, '), ['Soins de plaie et pansement', 'Retrait de points de suture']);
  assert.deepEqual(picks('instr', 'hydratation, repos, '), ['Hydratation', 'Repos']);
  assert.deepEqual(picks('ant', 'hta, diabète, '), ['Hypertension artérielle', 'Diabète de type 2']);
});

test('un terme sans résultat : introuvable, ou texte libre pour les consignes et les antécédents', () => {
  const rx = D.orderBatch('rx', 'xyzz, ').picks[0];
  assert.equal(rx.item, null);
  assert.equal(rx.masked, false);
  const instr = D.orderBatch('instr', 'Mettre de la crème, ').picks[0].item;
  assert.equal(instr.free, true);
  assert.equal(instr.details.title, 'Mettre de la crème');
  const ant = D.orderBatch('ant', 'appendicectomie, ').picks[0].item;
  assert.equal(ant.free, true);
  assert.equal(ant.code, null);
});

test('/rx : un terme qui ne trouve qu’un allergène masqué le dit', () => {
  const p = D.orderBatch('rx', 'amox, ').picks[0];
  assert.equal(p.item, null);
  assert.equal(p.masked, true);
});

test('/instr et /ant proposent le terme tel quel en fin de liste', () => {
  const r = D.searchOrder('instr', 'Mettre de la crème');
  assert.ok(r.autres.some((it) => it.free && it.name === 'Mettre de la crème'));
  // Un nom exact au catalogue : pas de texte libre en double.
  assert.ok(!D.searchOrder('instr', 'Repos').autres.some((it) => it.free));
  D.endOrderSearch();
});
