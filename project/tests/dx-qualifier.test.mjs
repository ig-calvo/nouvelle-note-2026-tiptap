// Qualificatif d'un diagnostic (débrief du 2026-10-28) : « Suspicion » ou
// « À exclure » (rule out), posé par une pastille de l'en-tête, au lieu
// d'écrire une phrase complète.
// Lancer : node --test project/tests/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPrototype } from './harness.mjs';

const fr = loadPrototype(['note-ui/note-sections.jsx', 'note-ui/diagnostics.jsx'], { lang: 'fr' });
const en = loadPrototype(['note-ui/note-sections.jsx', 'note-ui/diagnostics.jsx'], { lang: 'en' });

test('deux qualificatifs, nommés en français et en anglais', () => {
  assert.deepEqual(Object.keys(fr.DX_QUALIFIERS), ['suspicion', 'exclure']);
  assert.deepEqual([fr.DX_QUALIFIERS.suspicion.label, fr.DX_QUALIFIERS.exclure.label], ['Suspicion', 'À exclure']);
  assert.deepEqual([en.DX_QUALIFIERS.suspicion.label, en.DX_QUALIFIERS.exclure.label], ['Suspected', 'Rule out']);
});

test('le qualificatif suit les attributs de la région ; une valeur inconnue est ignorée', () => {
  assert.equal(fr.normalizeDiagAttrs({ name: 'Pneumonie', qualifier: 'suspicion' }).qualifier, 'suspicion');
  assert.equal(fr.normalizeDiagAttrs({ name: 'Pneumonie', qualifier: 'exclure' }).qualifier, 'exclure');
  assert.equal(fr.normalizeDiagAttrs({ name: 'Pneumonie', qualifier: 'peut-être' }).qualifier, null);
  assert.equal(fr.normalizeDiagAttrs({ name: 'Pneumonie' }).qualifier, null);
});
