// Tweak « Bouton Documenter dans les menus » : allumé par défaut, il retire le
// bouton « Documenter » des menus /rx et /lab quand il est éteint. Le drapeau
// window.__SHOW_DOCUMENT_BUTTON est posé par NoteEditor ; les menus le lisent
// par documentButtonShown (editor-data.jsx). Le rendu des boutons (RxMenu) ne
// tourne pas hors navigateur : on vérifie qu'il passe par ce drapeau.
// Lancer : node --test project/tests/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { loadPrototype, projectDir } from './harness.mjs';

const w = loadPrototype(['note-ui/note-sections.jsx', 'note-ui/diagnostics.jsx', 'note-ui/editor-data.jsx', 'note-ui/editor-schema.jsx']);
const D = w.NOTE_DATA;
const read = (rel) => fs.readFileSync(path.join(projectDir, rel), 'utf8');
const produit = { name: 'Amoxicilline' };
const active = { med: true, medStatus: 'active' };

test('allumé par défaut : « documenter » est offert à un produit hors dossier, pas à une médication au dossier', () => {
  assert.equal(w.__SHOW_DOCUMENT_BUTTON, undefined, 'rien de posé : le bouton est offert');
  assert.equal(D.documentButtonShown(), true);
  assert.deepEqual(D.medActions(produit), ['documenter']);
  assert.ok(!D.medActions(active).includes('documenter'));
});

test('éteint : le bouton n’est plus offert, les autres actions restent', () => {
  w.__SHOW_DOCUMENT_BUTTON = false;
  try {
    assert.equal(D.documentButtonShown(), false);
    assert.deepEqual(D.medActions(produit), []);
    assert.deepEqual(D.medActions(active), ['renouveler', 'augmenter', 'diminuer', 'cesser']);
    assert.deepEqual(D.medActions({ med: true, medStatus: 'cessee' }), ['prescrire']);
  } finally { delete w.__SHOW_DOCUMENT_BUTTON; }
  assert.equal(D.documentButtonShown(), true, 'rallumé');
});

test('le drapeau est posé par NoteEditor, réglé par le panneau Tweaks, et fixé en mode présentation', () => {
  assert.match(read('note-ui/NoteEditor.jsx'), /window\.__SHOW_DOCUMENT_BUTTON = showDocumentButton !== false;/);
  const html = read('Note Clinique.html');
  assert.match(html, /"showDocumentButton": true,/, 'allumé par défaut');
  assert.match(html, /showDocumentButton=\{t\.showDocumentButton !== false\}/);
  assert.match(html, /<TweakToggle label="Bouton Documenter dans les menus"/);
  assert.match(read('note-ui/presentation-mode.jsx'), /showDocumentButton: true,/);
});

test('les deux boutons « Documenter » du menu (/rx et /lab) ne sont rendus que si le tweak est allumé', () => {
  const src = read('note-ui/editor-popover.jsx');
  const gated = src.match(/documentButtonShown\(\) &&/g) || [];
  assert.equal(gated.length, 2, 'un garde par bouton');
  assert.equal((src.match(/onSelect\(it, 'documenter'\)/g) || []).length, 2, 'aucun autre bouton Documenter dans le menu');
});
