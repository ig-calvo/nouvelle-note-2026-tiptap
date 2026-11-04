// Multisélection de /lab (demandes d'Ignacio Calvo, 2026-11-04) : allumée d'office
// à l'ouverture (maquette « flow baseline » de Vanessa, hypothèse à tester) ; la
// recherche n'est gelée que si la bascule a été allumée À LA MAIN. Gelée, rien ne
// s'ajoute au texte de la note ; Espace coche la rangée active.
// Le branchement au clavier est dans editor-field.jsx (`onKeyDown`, `toggleMulti`),
// qui ne tourne pas hors navigateur : ici, la décision par touche (`multiFreezeKey`)
// et, en lecture du source, le branchement.
// Lancer : node --test project/tests/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { loadPrototype, projectDir } from './harness.mjs';

const w = loadPrototype(['note-ui/note-sections.jsx', 'note-ui/diagnostics.jsx', 'note-ui/editor-data.jsx', 'note-ui/editor-schema.jsx']);
const D = w.NOTE_DATA;
const field = fs.readFileSync(path.join(projectDir, 'note-ui/editor-field.jsx'), 'utf8');

test('la multisélection est allumée d’office à l’ouverture, sans geler la recherche', () => {
  assert.match(field, /let labMulti = true;/, 'allumée au départ');
  assert.match(field, /let labMultiHand = false;/, 'pas de gel au départ');
  assert.match(field, /checked = \[\]; railFocus = false; labMulti = true; labMultiHand = false;/, 'à chaque ouverture');
});

test('seule la bascule allumée à la main gèle la recherche : éteindre vide la sélection et dégèle', () => {
  assert.match(field, /parsed\.kind === 'lab' && labMultiHand\) \{/, 'le gel ne dépend plus de labMulti ni des analyses cochées');
  assert.match(field, /const on = !\(labMulti \|\| checked\.length > 0\);\s*labMulti = on; labMultiHand = on;\s*if \(!on\) checked = \[\];/);
  assert.ok(!/\(labMulti \|\| checked\.length > 0\)\) \{\s*const frozen/.test(field), 'l’ancienne condition est partie');
});

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
