// Texte du dictionnaire avec du gras (note-ui/i18n-rich.jsx) : seules les balises
// <strong>…</strong> et <br> existent, partout, dans toutes les langues.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { loadPrototype, projectDir } from './harness.mjs';

// React minimal : de quoi voir ce que le lecteur construit.
const React = { createElement: (type, props, ...children) => ({ type, key: props && props.key, children }) };

function loadRich() {
  const win = loadPrototype([]);
  win.React = React;
  const src = fs.readFileSync(path.join(projectDir, 'note-ui/i18n-rich.jsx'), 'utf8');
  // eslint-disable-next-line no-new-func
  new Function('window', 'React', src)(win, React);
  return win;
}

test('rich : le gras et le saut de ligne deviennent des éléments, le reste reste du texte', () => {
  const { I18N } = loadRich();
  const out = I18N.rich('Si <strong>au moins 2</strong> signes<br>puis fin');
  assert.deepEqual(out.map((n) => (typeof n === 'string' ? n : n.type)), ['Si ', 'strong', ' signes', 'br', 'puis fin']);
  assert.equal(out[1].children[0], 'au moins 2');
  assert.deepEqual(I18N.rich('sans balise'), ['sans balise']);
});

test('rich : tRich lit le dictionnaire (une clé réelle d’A4)', () => {
  const win = loadRich();
  const nodes = win.tRich('clinicalTool.noteComplicated.text');
  assert.ok(nodes.some((n) => n && n.type === 'strong'));
  assert.equal(nodes.map((n) => (typeof n === 'string' ? n : n.children[0])).join(''), win.t('clinicalTool.noteComplicated.text').replace(/<\/?strong>/g, ''));
});

test('dictionnaires : aucune balise autre que <strong>, </strong> et <br>', () => {
  const win = loadPrototype([], { lang: 'en' });
  const bad = [];
  for (const [lang, dict] of Object.entries(win.I18N_DICT)) {
    for (const [key, entry] of Object.entries(dict)) {
      for (const text of typeof entry === 'string' ? [entry] : Object.values(entry)) {
        const tags = String(text).match(/<[^>]*>/g) || [];
        if (tags.some((t) => !/^<\/?strong>$|^<br\s*\/?>$/.test(t))) bad.push(`${lang}:${key}`);
      }
    }
  }
  assert.deepEqual(bad, []);
});
