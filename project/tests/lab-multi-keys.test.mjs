// Multisélection de /lab : la recherche est gelée (demande d'Ignacio Calvo,
// 2026-11-04). Rien ne s'ajoute au texte de la note tant que la sélection n'est
// pas soumise ou que la bascule n'est pas éteinte ; Espace coche la rangée active.
// Le branchement au clavier est dans editor-field.jsx (`onKeyDown`) ; ici, la
// décision par touche (`multiFreezeKey`).
// Lancer : node --test project/tests/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPrototype } from './harness.mjs';

const w = loadPrototype(['note-ui/note-sections.jsx', 'note-ui/diagnostics.jsx', 'note-ui/editor-data.jsx', 'note-ui/editor-schema.jsx']);
const D = w.NOTE_DATA;

test('Espace coche ou décoche la rangée active', () => {
  assert.equal(D.multiFreezeKey({ key: ' ' }), 'toggle');
  assert.equal(D.multiFreezeKey({ key: ' ', shiftKey: true }), 'toggle');
});

test('un caractère, Retour arrière et Suppr sont bloqués : la vue reste stable', () => {
  for (const key of ['a', 'F', '1', ',', 'é', '#']) assert.equal(D.multiFreezeKey({ key }), 'block', key);
  assert.equal(D.multiFreezeKey({ key: 'Backspace' }), 'block');
  assert.equal(D.multiFreezeKey({ key: 'Delete' }), 'block');
  assert.equal(D.multiFreezeKey({ key: 'é', altKey: true }), 'block', 'Option + lettre écrit un caractère : bloqué aussi');
});

test('la navigation, Entrée, Échap, Tab et les raccourcis Cmd ou Ctrl passent', () => {
  for (const key of ['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Enter', 'Escape', 'Tab', 'Shift', 'Meta', 'Home', 'End']) {
    assert.equal(D.multiFreezeKey({ key }), 'pass', key);
  }
  assert.equal(D.multiFreezeKey({ key: 'Enter', shiftKey: true }), 'pass', '⇧ Entrée coche déjà, dans onKeyDown');
  assert.equal(D.multiFreezeKey({ key: 'z', metaKey: true }), 'pass');
  assert.equal(D.multiFreezeKey({ key: 'v', ctrlKey: true }), 'pass');
  assert.equal(D.multiFreezeKey({ key: ' ', metaKey: true }), 'pass', 'Cmd + Espace est au système');
});

test('une composition de texte (IME) ou un événement sans touche passent', () => {
  assert.equal(D.multiFreezeKey({ key: 'a', isComposing: true }), 'pass');
  assert.equal(D.multiFreezeKey({ key: 'Process' }), 'pass');
  assert.equal(D.multiFreezeKey({}), 'pass');
  assert.equal(D.multiFreezeKey(null), 'pass');
});
