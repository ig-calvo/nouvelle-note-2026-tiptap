// Recherche dans les problèmes et antécédents d'Omnimed
// (note-ui/problemes-index.jsx), contre les VRAIES données
// (note-ui/omnimed-problemes.json, généré par tools/omnimed-dictionnaire-to-json.py).
// Les valeurs attendues ont été vérifiées contre le fichier avant d'être figées ici.
// Lancer : node --test project/tests/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { loadPrototype, projectDir, readProjectJSON } from './harness.mjs';

const w = loadPrototype(['note-ui/problemes-index.jsx']);
const data = readProjectJSON('note-ui/omnimed-problemes.json');
const fr = w.buildProblemIndex(data, { lang: 'fr' });
const en = w.buildProblemIndex(data, { lang: 'en' });

test('344 termes, identifiants uniques, le fichier reste petit (< 64 Kio)', () => {
  assert.equal(fr.count(), 344);
  assert.equal(data._meta.count, 344);
  assert.equal(new Set(data.termes.map((t) => t[0])).size, 344);
  assert.ok(fs.statSync(path.join(projectDir, 'note-ui/omnimed-problemes.json')).size < 65536);
});

test('un libellé exact arrive en tête, avec son ID_TERME ; casse et accents ignorés', () => {
  const top = fr.search('anemie').rows[0];
  assert.deepEqual([top.id, top.label, top.other], ['833075', 'Anémie', 'Anemia']);
  assert.equal(fr.search('ANÉMIE').rows[0].id, '833075');
});

test('la recherche est bilingue : le terme de l’autre langue trouve aussi, le libellé affiché suit la langue', () => {
  assert.equal(fr.search('appendectomy').rows[0].label, 'Appendicectomie');
  assert.equal(en.search('appendicectomie').rows[0].label, 'Appendectomy');
  assert.equal(en.search('appendicectomie').rows[0].id, '1317587');
});

test('les mots vides sont ignorés (« apnée du sommeil » trouve « Apnée sommeil »)', () => {
  assert.equal(fr.search('apnee du sommeil').rows[0].id, '833231');
});

test('un terme dont l’anglais est identique au français ne répète pas son libellé', () => {
  const alz = fr.search('alzheimer').rows[0];
  assert.deepEqual([alz.id, alz.label, alz.other], ['27608695', 'Alzheimer', null]);
});

test('requête de moins de 2 caractères : rien ; limit et more comptent les termes restants', () => {
  assert.deepEqual(fr.search('a'), { rows: [], total: 0, more: 0 });
  const r = fr.search('an', { limit: 3 });
  assert.equal(r.rows.length, 3);
  assert.ok(r.total > 3);
  assert.equal(r.more, r.total - 3);
});

test('get(id) renvoie le terme, null pour un identifiant inconnu', () => {
  assert.equal(fr.get('833085').label, 'Abcès');
  assert.equal(fr.get('0'), null);
});

test('la façade PROBLEMES est prête une fois window.PROBLEMES_DATA posé, et se reconstruit s’il change', () => {
  const w2 = loadPrototype(['note-ui/problemes-index.jsx']);
  assert.equal(w2.PROBLEMES.ready(), false);
  assert.deepEqual(w2.PROBLEMES.search('anemie'), { rows: [], total: 0, more: 0 });
  w2.PROBLEMES_DATA = data;
  assert.equal(w2.PROBLEMES.ready(), true);
  assert.equal(w2.PROBLEMES.count(), 344);
  w2.PROBLEMES_DATA = { termes: data.termes.slice(0, 10) };
  assert.equal(w2.PROBLEMES.count(), 10);
});
