// Hiérarchie et recherche CIM-10 (note-ui/cim10-index.jsx). Toutes les
// valeurs attendues ci-dessous ont été vérifiées contre les données réelles
// (note-ui/cim10-fr-clinique.json + note-ui/cim10-hierarchy.json), pas
// devinées — voir les commandes de vérification manuelle dans l'historique
// de la branche si une valeur doit être revalidée après une mise à jour des
// données.
// Lancer : node --test project/tests/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { loadPrototype, projectDir, readProjectJSON } from './harness.mjs';

const w = loadPrototype(['note-ui/cim10-index.jsx']);
const data = readProjectJSON('note-ui/cim10-fr-clinique.json');
const hier = readProjectJSON('note-ui/cim10-hierarchy.json');
const ix = w.buildCim10Index(data, hier);

// ---------------------------------------------------------------------------
// Intégrité des données
// ---------------------------------------------------------------------------
test('aucune alerte de construction (bloc orphelin, catégorie sans bloc, code sans parent…)', () => {
  assert.deepEqual(ix.stats().warnings, []);
});

test('2 745 nœuds sélectionnables, 20 chapitres, 149 blocs', () => {
  const s = ix.stats();
  assert.equal(s.selectable, 2745);
  assert.equal(s.chapters, 20);
  assert.equal(s.blocks, 149);
});

test('les deux fichiers de données restent sous la limite de 256 Kio', () => {
  assert.ok(fs.statSync(path.join(projectDir, 'note-ui/cim10-fr-clinique.json')).size < 262144);
  assert.ok(fs.statSync(path.join(projectDir, 'note-ui/cim10-hierarchy.json')).size < 262144);
});

test('chaque bloc a exactement un chapitre, chaque catégorie exactement un bloc, aucun chevauchement', () => {
  // Vérifié indirectement : stats().warnings est vide (le builder loggue
  // « bloc hors chapitre » / « catégorie sans bloc » sinon) — voir plus haut.
  // Ici on vérifie en plus l'absence de chevauchement entre blocs.
  const blocks = [];
  w.buildCim10Index(data, hier); // recalcule pour lire hier.blocks tel quel
  hier.blocks.forEach((b) => blocks.push(b.range));
  for (let i = 0; i < blocks.length; i++) {
    for (let j = i + 1; j < blocks.length; j++) {
      const a = blocks[i], b = blocks[j];
      const overlap = a[0] <= b[1] && b[0] <= a[1];
      assert.equal(overlap, false, `chevauchement entre ${a} et ${b}`);
    }
  }
});

test('chaque nœud sélectionnable est atteignable depuis les racines, une seule fois par branchement direct', () => {
  const seen = new Set();
  (function walk(id) {
    ix.children(id).forEach((k) => {
      if (k.selectable) seen.add(k.id);
      if (k.hasChildren) walk(k.id);
    });
  })(null);
  assert.equal(seen.size, ix.stats().selectable);
});

// ---------------------------------------------------------------------------
// Navigation dans l'arbre
// ---------------------------------------------------------------------------
test('roots() donne Fréquents puis les 20 chapitres (I à XIX, XXI — pas de XX ni XXII)', () => {
  const ids = ix.roots().map((r) => r.id);
  assert.equal(ids[0], 'fav');
  assert.equal(ids.length, 21);
  assert.equal(ids.includes('ch:XX'), false);
  assert.equal(ids.includes('ch:XXII'), false);
  assert.deepEqual(ids.slice(1, 4), ['ch:I', 'ch:II', 'ch:III']);
});

test("children('root'|''|null|undefined) renvoient tous les racines", () => {
  const expected = ix.roots().map((r) => r.id);
  assert.deepEqual(ix.children('root').map((r) => r.id), expected);
  assert.deepEqual(ix.children('').map((r) => r.id), expected);
  assert.deepEqual(ix.children(null).map((r) => r.id), expected);
  assert.deepEqual(ix.children(undefined).map((r) => r.id), expected);
});

test('children(id) inconnu renvoie []', () => {
  assert.deepEqual(ix.children('XYZ'), []);
});

test("children('ch:X') donne les 6 blocs du chapitre X, non sélectionnables", () => {
  const blocks = ix.children('ch:X');
  assert.deepEqual(blocks.map((b) => b.id), ['bl:J00-J06', 'bl:J09-J18', 'bl:J20-J22', 'bl:J30-J39', 'bl:J40-J47', 'bl:J60-J70']);
  assert.ok(blocks.every((b) => b.selectable === false));
});

test("chapitres et blocs sont choisissables (pickable, level, canRefine) sans devenir `selectable` — ce champ reste réservé aux vrais codes", () => {
  const ch = ix.node('ch:X'), bl = ix.node('bl:J40-J47');
  assert.deepEqual([ch.pickable, ch.selectable, ch.level, ch.canRefine], [true, false, 'chapter', true]);
  assert.deepEqual([bl.pickable, bl.selectable, bl.level, bl.canRefine], [true, false, 'block', true]);
  assert.equal(ix.node('J45').pickable, true); // un vrai code l'est aussi
  assert.equal(ix.node('fav').pickable, false); // « Fréquents » n'est qu'un regroupement
  assert.equal(ix.levelOf('bl:J40-J47'), 'block');
  assert.equal(ix.canRefine('ch:X'), true);
});

test("children('bl:J40-J47') donne les catégories dans l'ordre du code", () => {
  assert.deepEqual(ix.children('bl:J40-J47').map((r) => r.code), ['J40', 'J41', 'J42', 'J44', 'J45']);
});

test('ancestors(code) — le plus proche en premier, sans le nœud lui-même', () => {
  assert.deepEqual(ix.ancestors('M08.45').map((r) => r.id), ['M08.4', 'M08', 'bl:M05-M14', 'ch:XIII']);
  assert.deepEqual(ix.ancestors('F00.032').map((r) => r.id), ['F00.03', 'F00.0', 'F00', 'bl:F00-F09', 'ch:V']);
});

test('parent(code) suit la règle du plus long préfixe existant, y compris pour les extensions +/X', () => {
  assert.equal(ix.parent('M45.+0').id, 'M45');
  assert.equal(ix.parent('M45.X0').id, 'M45.X');
  assert.equal(ix.parent('I20.0+0').id, 'I20.0');
  assert.equal(ix.parent('F03.+30').id, 'F03.+3');
  assert.equal(ix.parent('K63.5+0').id, 'K63.5');
  assert.equal(ix.parent('R53.+2').id, 'R53');
});

test("path(code) donne le fil d'Ariane racine → nœud, nœud inclus", () => {
  assert.deepEqual(ix.path('J45.9').map((r) => r.crumb), ['Chapitre X', 'J40-J47', 'J45', 'J45.9']);
});

test('placement par plage : quelques cas repères', () => {
  assert.equal(ix.path('K64')[1].id, 'bl:K55-K64');
  assert.equal(ix.path('D22.9')[0].id, 'ch:II'); // pas III
  assert.equal(ix.node('H66').path[0].id, 'ch:VIII');
  assert.equal(ix.node('H10').path[0].id, 'ch:VII');
  assert.equal(ix.path('T28')[1].id, 'bl:T26-T28');
});

test('resolve(code) tombe sur le plus proche existant, ou null si rien ne correspond', () => {
  assert.equal(ix.resolve('J45.99').code, 'J45.9');
  assert.equal(ix.resolve('C50.4').code, 'C50');
  assert.equal(ix.resolve('Q99.9'), null);
});

test('levelOf : category seulement pour une catégorie avec enfants ; chapter/block pour les regroupements choisissables', () => {
  assert.equal(ix.levelOf('H66'), 'category');
  assert.equal(ix.levelOf('I10'), 'code');
  assert.equal(ix.levelOf('H66.0'), 'code');
  assert.equal(ix.levelOf('bl:H65-H75'), 'block');
  assert.equal(ix.levelOf('ch:VIII'), 'chapter');
  assert.equal(ix.levelOf('fav'), null);
  assert.equal(ix.levelOf('XYZ'), null);
});

test('canRefine couvre aussi un code profond qui a lui-même des enfants (M08.4 → M08.45)', () => {
  assert.equal(ix.canRefine('H66'), true);
  assert.equal(ix.canRefine('M08.4'), true);
  assert.equal(ix.canRefine('I10'), false);
  assert.equal(ix.canRefine('H66.0'), false);
});

// ---------------------------------------------------------------------------
// Génériques / Fréquents
// ---------------------------------------------------------------------------
test('les 7 génériques deviennent un alias du code officiel, sans nœud dupliqué', () => {
  const n = ix.node('J06.9');
  assert.equal(n.alias, 'IVRS / syndrome viral');
  assert.notEqual(n.libelle, n.alias);
  assert.ok(n.libelle.length > 0);
});

test("children('fav') affiche les 7 génériques d'abord (ordre du fichier), avec label = alias", () => {
  const fav = ix.children('fav');
  assert.equal(fav.length, 30);
  assert.deepEqual(fav.slice(0, 7).map((r) => r.code), ['J06.9', 'N30.9', 'M54.5', 'A09.9', 'J02.9', 'L30.9', 'Z00.0']);
  assert.ok(fav.slice(0, 7).every((r) => r.label === r.alias));
});

// ---------------------------------------------------------------------------
// Recherche
// ---------------------------------------------------------------------------
test('search : requêtes courtes', () => {
  assert.equal(ix.search('j').tooShort, true);
  assert.equal(ix.search('').tooShort, true);
  assert.deepEqual(ix.search('j').rows, []);
});

test("search('j45') : la catégorie d'abord (code exact), puis les sous-codes", () => {
  const rows = ix.search('j45').rows;
  assert.equal(rows[0].code, 'J45');
  assert.equal(rows[0].matchedOn, 'code');
  assert.ok(rows.slice(1).some((r) => r.code === 'J45.9'));
});

test("search('J45.9') et search('j459') trouvent toutes deux J45.9, marqué matched", () => {
  assert.ok(ix.search('J45.9').rows.some((r) => r.code === 'J45.9' && r.matched));
  assert.ok(ix.search('j459').rows.some((r) => r.code === 'J45.9' && r.matched));
});

test("search('hypertension') place I10 en tête", () => {
  assert.equal(ix.search('hypertension').rows[0].code, 'I10');
});

test('search ignore les accents et la casse, sur le code comme sur le libellé', () => {
  const a = ix.search('Otite Moyenne Aiguë').rows.map((r) => r.code);
  const b = ix.search('otite moyenne aigue').rows.map((r) => r.code);
  assert.deepEqual(a, b);
  assert.ok(a.every((c) => c.startsWith('H6')));
  assert.ok(a.includes('H66.0'));
});

test("search('lombalgie') : un seul M54.5, en alias « Lombalgie basse »", () => {
  const rows = ix.search('lombalgie').rows;
  const m545 = rows.filter((r) => r.code === 'M54.5');
  assert.equal(m545.length, 1);
  assert.equal(m545[0].matchedOn, 'alias');
  assert.equal(m545[0].label, 'Lombalgie basse');
});

test("search('infection urinaire') : N30.9 (alias) puis N39.0 (libellé)", () => {
  const rows = ix.search('infection urinaire').rows;
  const codes = rows.map((r) => r.code);
  assert.ok(codes.includes('N30.9'));
  assert.ok(codes.includes('N39.0'));
  assert.ok(codes.indexOf('N30.9') < codes.indexOf('N39.0'));
});

test("search('grossesse') trouve Z34.9 (un des codes ajoutés)", () => {
  assert.ok(ix.search('grossesse').rows.some((r) => r.code === 'Z34.9'));
});

test("search('depress') : F32 en tête, tronqué, pas de démence F00.x dans les 6 premiers", () => {
  const r = ix.search('depress');
  assert.equal(r.rows[0].code, 'F32');
  assert.equal(r.rows[0].matchCount, 12);
  assert.equal(r.rows[0].hiddenCount, 10);
  assert.equal(r.truncated, true);
  assert.ok(r.moreGroups > 0);
  assert.ok(!r.rows.slice(0, 6).some((row) => row.code.startsWith('F00.0')));
});

test('within : limite aux descendants du nœud, sans lister le nœud lui-même', () => {
  const rows = ix.search('otite', { within: 'H66' }).rows;
  assert.ok(rows.length > 0);
  assert.ok(rows.every((r) => r.code.startsWith('H66') && r.code !== 'H66'));
});

test('search met en cache le dernier résultat (même référence pour la même requête)', () => {
  assert.equal(ix.search('otite'), ix.search('otite'));
});

// ---------------------------------------------------------------------------
// Utilitaires
// ---------------------------------------------------------------------------
test('normCim10 replie les accents, ligatures et la casse', () => {
  assert.equal(w.normCim10('Œsophage Aiguë'), 'oesophage aigue');
});

test('cim10CountLabel accorde le singulier et le pluriel', () => {
  assert.equal(w.cim10CountLabel(1, 'code'), '1 code précis');
  assert.equal(w.cim10CountLabel(12, 'code'), '12 codes précis');
  assert.equal(w.cim10CountLabel(1, 'category'), '1 catégorie');
  assert.equal(w.cim10CountLabel(3, 'category'), '3 catégories');
});

// ---------------------------------------------------------------------------
// Façade window.CIM10 : chargement asynchrone et reconstruction
// ---------------------------------------------------------------------------
test('CIM10.ready() est faux avant que les deux fichiers soient posés sur window, puis vrai', () => {
  const w2 = loadPrototype(['note-ui/cim10-index.jsx']);
  assert.equal(w2.CIM10.ready(), false);
  assert.equal(w2.CIM10.status(), 'loading');
  const pending = w2.CIM10.search('asthme');
  assert.equal(pending.pending, true);
  w2.CIM10_DATA = data;
  w2.CIM10_HIERARCHY = hier;
  assert.equal(w2.CIM10.ready(), true);
  assert.equal(w2.CIM10.status(), 'ready');
  assert.ok(w2.CIM10.search('asthme').rows.length > 0);
});

test("CIM10 se reconstruit si window.CIM10_DATA change de référence", () => {
  const w2 = loadPrototype(['note-ui/cim10-index.jsx']);
  w2.CIM10_DATA = data;
  w2.CIM10_HIERARCHY = hier;
  const before = w2.CIM10.stats().selectable;
  w2.CIM10_DATA = data.slice(0, 10).concat(data.slice(20));
  const after = w2.CIM10.stats().selectable;
  assert.notEqual(before, after);
});
