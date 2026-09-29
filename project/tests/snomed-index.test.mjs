// Recherche dans le dictionnaire SNOMED CT (note-ui/snomed-index.jsx), contre
// les VRAIES données (note-ui/snomed-diagnostics.json, généré par
// tools/csv-to-snomed-json.py). Les valeurs attendues ont été vérifiées
// contre le fichier avant d'être figées ici.
// Lancer : node --test project/tests/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { loadPrototype, projectDir, readProjectJSON } from './harness.mjs';

const w = loadPrototype(['note-ui/snomed-index.jsx']);
const data = readProjectJSON('note-ui/snomed-diagnostics.json');
const ix = w.buildSnomedIndex(data);
const labels = (q, opts) => ix.search(q, opts).rows.map((r) => r.label);

test('4 219 concepts, identifiants uniques, le fichier reste raisonnable (< 1 Mio)', () => {
  assert.equal(ix.count(), 4219);
  assert.equal(new Set(data.concepts.map((c) => c[0])).size, 4219);
  assert.equal(data._meta.count, 4219);
  assert.ok(fs.statSync(path.join(projectDir, 'note-ui/snomed-diagnostics.json')).size < 1048576);
});

test('un libellé exact arrive en tête, avec son identifiant de concept', () => {
  const top = ix.search('cholecystitis').rows[0];
  assert.equal(top.label, 'Cholecystitis');
  assert.equal(top.id, '76581006');
  assert.equal(top.tag, 'disorder');
});

test('la recherche ignore casse, accents et mots vides ; l’ordre des mots libre', () => {
  assert.equal(ix.search('CHOLECYSTITIS').rows[0].id, '76581006');
  assert.ok(labels('sjogren').some((l) => /Sj[oö]gren/.test(l)), 'sans accent retrouve « Sjögren »');
  assert.ok(labels('disorder of form of thought').includes('Disorder of form of thought'));
  assert.ok(labels('thought form').includes('Disorder of form of thought'));
});

test('le nom complet SNOMED (FSN) est cherché aussi, pas seulement le terme préféré', () => {
  // 20052008 : préféré « Hereditary fructosuria », FSN « Fructose-1,6-bisphosphate aldolase B deficiency ».
  assert.equal(ix.search('aldolase B deficiency').rows[0].id, '20052008');
  assert.equal(ix.get('20052008').label, 'Hereditary fructosuria');
});

test('recherche par identifiant de concept : exact, ou préfixe à partir de 4 chiffres', () => {
  assert.equal(ix.search('76581006').rows[0].label, 'Cholecystitis');
  assert.equal(ix.search('7658').rows.some((r) => r.id === '76581006'), true);
  assert.deepEqual(ix.search('765').rows, []); // 3 chiffres : trop court pour un préfixe
});

test('moins de 2 caractères : rien ; limit borne les lignes et `more` compte le reste', () => {
  assert.deepEqual(ix.search('a'), { rows: [], total: 0, more: 0 });
  const r = ix.search('syndrome', { limit: 4 });
  assert.equal(r.rows.length, 4);
  assert.equal(r.more, r.total - 4);
  assert.ok(r.more > 0);
});

test('à classe égale, le terme le plus court (le plus général) passe devant', () => {
  const r = ix.search('asthma', { limit: 3 }).rows;
  assert.ok(r[0].label.length <= r[1].label.length && r[1].label.length <= r[2].label.length);
});

test('get() d’un identifiant inconnu renvoie null ; sans données la façade est prête à vide', () => {
  assert.equal(ix.get('0'), null);
  assert.equal(w.SNOMED.ready(), false);
  assert.deepEqual(w.SNOMED.search('asthma'), { rows: [], total: 0, more: 0 });
  w.SNOMED_DATA = data;
  assert.equal(w.SNOMED.ready(), true);
  assert.equal(w.SNOMED.search('cholecystitis').rows[0].id, '76581006');
});
