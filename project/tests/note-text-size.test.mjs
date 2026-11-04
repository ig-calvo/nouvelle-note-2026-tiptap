// Tweak « Taille du texte de la note » (demande d'Ignacio Calvo, 2026-11-04) :
// « Prototype » (défaut) garde le style actuel ; « Vraie note » applique la taille
// de la note enregistrée (éditeur Tiptap DS3, body-large). Le CSS ne tourne pas
// hors navigateur : ces tests lisent les fichiers (valeurs par défaut inchangées,
// jetons DS3 définis, tweak branché partout). Les valeurs calculées à l'écran se
// vérifient dans le navigateur (getComputedStyle).
// Lancer : node --test project/tests/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { projectDir } from './harness.mjs';

const read = (rel) => fs.readFileSync(path.join(projectDir, rel), 'utf8');
const css = read('note-ui/editor.css');
const tokens = read('ds3-tokens.css');
const rootBlock = (css.match(/:root \{\s*--note-font-body:[^}]*\}/) || [''])[0];
const vraieBlock = (css.match(/html\[data-note-text="vraie"\] \{[^}]*\}/) || [''])[0];

test('par défaut, les variables valent le style actuel du prototype', () => {
  assert.match(rootBlock, /--note-font-body: 400 14px\/21px var\(--font-body\);/);
  assert.match(rootBlock, /--note-font-h1: 500 16px\/20px var\(--font-body\);/);
  assert.match(rootBlock, /--note-font-h2: 500 14px\/20px var\(--font-body\);/);
  assert.match(rootBlock, /--note-font-h3: 500 12px\/16px var\(--font-body\);/);
});

test('« Vraie note » : les jetons DS3 du texte normal et des titres, tous définis', () => {
  assert.ok(vraieBlock, 'bloc html[data-note-text="vraie"]');
  const used = [...vraieBlock.matchAll(/var\((--mat-sys-[\w-]+)\)/g)].map((m) => m[1]);
  assert.deepEqual(used, ['--mat-sys-body-large', '--mat-sys-body-large-bold', '--mat-sys-body-medium-bold', '--mat-sys-body-small-bold']);
  for (const token of used) assert.match(tokens, new RegExp(`${token}: [^;]+;`), `${token} défini dans ds3-tokens.css`);
  assert.match(tokens, /--mat-sys-body-large: 400 16px\/24px /);
  assert.match(tokens, /--mat-sys-body-large-bold: 600 16px\/24px /);
  assert.match(tokens, /--mat-sys-body-medium-bold: 600 14px\/21px /);
  assert.match(tokens, /--mat-sys-body-small-bold: 600 12px\/18px /);
});

test('l’éditeur lit les variables, avec un !important de moins par règle et la police du prototype', () => {
  const rule = (sel) => (css.match(new RegExp(sel.replace(/[.[\]]/g, '\\$&') + ' \\{[^}]*\\}')) || [''])[0];
  assert.match(css, /\.note-field \.ql-editor \{ font: var\(--note-font-body\) !important; font-family: var\(--font-body\) !important;/);
  assert.match(css, /\.note-field \.ql-editor blockquote \{ font: var\(--note-font-body\) !important; font-family: var\(--font-body\) !important;/);
  for (const level of ['h1', 'h2', 'h3']) {
    assert.match(rule(`.note-field .ql-editor ${level}`), new RegExp(`font: var\\(--note-font-${level}\\) !important; font-family: var\\(--font-body\\) !important;`));
  }
  assert.ok(!/\.note-field \.ql-editor (?:h1|h2|h3) \{[^}]*font-(?:size|weight)/.test(css), 'plus de taille ni de poids écrits en dur dans les titres');
  assert.ok(!/\.note-field \.ql-editor blockquote \{[^}]*font-size/.test(css), 'ni dans le texte normal');
  assert.ok(!/\.note-field \.ql-editor \{ font:[^}]*font-size/.test(css));
});

test('la Liste de notes cliniques suit le même tweak', () => {
  const src = read('note-ui/NotesList.jsx');
  for (const [name, v] of [['roHeading1', 'h1'], ['roHeading2', 'h2'], ['roHeading3', 'h3'], ['detailsLabel', 'h2']]) {
    assert.match(src, new RegExp(`${name}: \\{\\s*font: 'var\\(--note-font-${v}\\)'`), name);
  }
  assert.match(src, /detailsText: \{\s*font: 'var\(--note-font-body\)'/);
  assert.match(src, /roDiagBody: \{[^}]*font: 'var\(--note-font-body\)'/);
});

test('le tweak : « Prototype » par défaut, posé sur <html> par l’application, fixé à « Prototype » en présentation', () => {
  const html = read('Note Clinique.html');
  assert.match(html, /"noteTextSize": "prototype",/);
  assert.match(html, /setAttribute\('data-note-text', t\.noteTextSize === 'vraie' \? 'vraie' : 'prototype'\)/);
  assert.match(html, /<TweakRadio label="Taille du texte de la note"/);
  assert.match(html, /\{ value: 'vraie', label: 'Vraie note' \}/);
  assert.match(read('note-ui/presentation-mode.jsx'), /noteTextSize: 'prototype',/);
});
