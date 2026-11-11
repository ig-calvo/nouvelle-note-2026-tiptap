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

test('3 675 nœuds sélectionnables (les diagnostics de la feuille Omnimed), 22 chapitres, 263 blocs', () => {
  const s = ix.stats();
  assert.equal(s.selectable, 3675);
  assert.equal(s.chapters, 22);
  assert.equal(s.blocks, 263);
  assert.equal(data.filter((r) => r.generic).length, 7);
  assert.equal(data.filter((r) => !r.generic).length, 3675);
});

test('les fichiers de données (FR, EN, hiérarchies) restent sous la limite de 256 Kio', () => {
  ['cim10-fr-clinique.json', 'cim10-en-clinique.json', 'cim10-hierarchy.json', 'cim10-hierarchy-en.json'].forEach((f) => {
    assert.ok(fs.statSync(path.join(projectDir, 'note-ui/' + f)).size < 262144, f);
  });
});

test('le français et l’anglais portent les mêmes codes, dans le même ordre', () => {
  const en = readProjectJSON('note-ui/cim10-en-clinique.json');
  assert.deepEqual(en.map((r) => r.code), data.map((r) => r.code));
  assert.ok(en.every((r) => r.libelle));
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
test('roots() donne Fréquents puis les 22 chapitres (I à XXII, dont XX causes externes et XXII codes particuliers)', () => {
  const ids = ix.roots().map((r) => r.id);
  assert.equal(ids[0], 'fav');
  assert.equal(ids.length, 23);
  assert.deepEqual(ids.slice(-4), ['ch:XIX', 'ch:XX', 'ch:XXI', 'ch:XXII']);
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

test("children('ch:X') donne les 10 blocs du chapitre X, non sélectionnables", () => {
  const blocks = ix.children('ch:X');
  assert.deepEqual(blocks.map((b) => b.id), ['bl:J00-J06', 'bl:J09-J18', 'bl:J20-J22', 'bl:J30-J39', 'bl:J40-J47', 'bl:J60-J70', 'bl:J80-J84', 'bl:J85-J86', 'bl:J90-J94', 'bl:J95-J99']);
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
  assert.deepEqual(ix.children('bl:J40-J47').map((r) => r.code), ['J40', 'J41', 'J42', 'J43', 'J44', 'J45', 'J47']);
});

test('ancestors(code) — le plus proche en premier, sans le nœud lui-même', () => {
  assert.deepEqual(ix.ancestors('G82.01').map((r) => r.id), ['G82.0', 'G82', 'bl:G80-G83', 'ch:VI']);
  assert.deepEqual(ix.ancestors('D37.03').map((r) => r.id), ['D37.0', 'D37', 'bl:D37-D48', 'ch:II']);
});

test('parent(code) suit la règle du plus long préfixe existant, y compris pour des extensions +/X absentes des données', () => {
  assert.equal(ix.parent('G82.01').id, 'G82.0');
  assert.equal(ix.parent('M45.+0').id, 'M45');
  assert.equal(ix.parent('M45.X0').id, 'M45');
  assert.equal(ix.parent('I20.0+0').id, 'I20');
  assert.equal(ix.parent('F03.+30').id, 'F03');
  assert.equal(ix.parent('K63.5+0').id, 'K63');
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
  // Les chapitres ajoutés pour les codes que contient la feuille (XX, XXII).
  assert.deepEqual(ix.path('V01').map((r) => r.id), ['ch:XX', 'bl:V01-V09', 'V01']);
  assert.deepEqual(ix.path('Y95').map((r) => r.id), ['ch:XX', 'bl:Y90-Y98', 'Y95']);
  assert.deepEqual(ix.path('U07').map((r) => r.id), ['ch:XXII', 'bl:U00-U49', 'U07']);
});

test('resolve(code) tombe sur le plus proche existant, ou null si rien ne correspond', () => {
  assert.equal(ix.resolve('J45.99').code, 'J45.9');
  assert.equal(ix.resolve('C50.99').code, 'C50.9');
  assert.equal(ix.resolve('Q99.9').code, 'Q99'); // Q99 existe, pas Q99.9
  assert.equal(ix.resolve('U05.9'), null); // ni U05 ni U05.9
});

test('levelOf : category seulement pour une catégorie avec enfants ; chapter/block pour les regroupements choisissables', () => {
  assert.equal(ix.levelOf('J45'), 'category');
  assert.equal(ix.levelOf('H66'), 'code'); // H66 n'a pas de sous-codes dans la feuille
  assert.equal(ix.levelOf('I10'), 'code');
  assert.equal(ix.levelOf('J45.9'), 'code');
  assert.equal(ix.levelOf('bl:H65-H75'), 'block');
  assert.equal(ix.levelOf('ch:VIII'), 'chapter');
  assert.equal(ix.levelOf('fav'), null);
  assert.equal(ix.levelOf('XYZ'), null);
});

test('canRefine couvre aussi un code profond qui a lui-même des enfants (G82.0 → G82.01)', () => {
  assert.equal(ix.canRefine('J45'), true);
  assert.equal(ix.canRefine('G82.0'), true);
  assert.equal(ix.canRefine('I10'), false);
  assert.equal(ix.canRefine('G82.01'), false);
});

// ---------------------------------------------------------------------------
// Génériques / Fréquents
// ---------------------------------------------------------------------------
test('les 7 génériques deviennent un alias de la catégorie officielle de la feuille, sans nœud dupliqué', () => {
  const n = ix.node('J06'); // la feuille n'a pas J06.9 : le générique s'accroche à la catégorie
  assert.equal(n.alias, 'IVRS / syndrome viral');
  assert.notEqual(n.libelle, n.alias);
  assert.ok(n.libelle.length > 0);
  assert.equal(ix.node('J06.9'), null);
});

test("children('fav') affiche les 7 génériques d'abord (ordre du fichier), avec label = alias, puis les fréquents ramenés à un code de la feuille", () => {
  const fav = ix.children('fav');
  assert.equal(fav.length, 30);
  assert.deepEqual(fav.slice(0, 7).map((r) => r.code), ['J06', 'N30', 'M54', 'A09', 'J02', 'L30', 'Z00']);
  assert.ok(fav.slice(0, 7).every((r) => r.label === r.alias));
  assert.deepEqual(fav.slice(7, 12).map((r) => r.code), ['I10', 'E11', 'E78', 'J45.9', 'J44']);
});

// ---------------------------------------------------------------------------
// Recherche
// ---------------------------------------------------------------------------
test('search : requêtes courtes', () => {
  assert.equal(ix.search(w.TR('j')).tooShort, true);
  assert.equal(ix.search('').tooShort, true);
  assert.deepEqual(ix.search(w.TR('j')).rows, []);
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
  const a = ix.search('Épisodes dépressifs').rows.map((r) => r.code);
  const b = ix.search('episodes depressifs').rows.map((r) => r.code);
  assert.deepEqual(a, b);
  assert.deepEqual(a, ['F32']);
});

test("search('lombalgie') : un seul M54, en alias (le générique « Lombalgie commune » s'accroche à la catégorie Dorsalgie)", () => {
  const rows = ix.search('lombalgie').rows;
  const m54 = rows.filter((r) => r.code === 'M54');
  assert.equal(m54.length, 1);
  assert.equal(m54[0].matchedOn, 'alias');
  assert.equal(m54[0].label, 'Dorsalgie');
  assert.equal(m54[0].alias, 'Lombalgie commune');
});

test("search('infection urinaire') : N30 (alias « Cystite / infection urinaire ») d'abord, puis les codes dont le libellé correspond", () => {
  const rows = ix.search('infection urinaire').rows;
  assert.equal(rows[0].code, 'N30');
  assert.equal(rows[0].matchedOn, 'alias');
  assert.ok(rows.some((r) => r.code === 'O23.4'));
});

test("search('grossesse') trouve Z34 (surveillance d'une grossesse normale)", () => {
  assert.ok(ix.search('grossesse').rows.some((r) => r.code === 'Z34'));
});

test("search('depress') : F32 puis F33, seuls diagnostics de dépression de la feuille", () => {
  const r = ix.search('depress');
  assert.deepEqual(r.rows.slice(0, 2).map((row) => row.code), ['F32', 'F33']);
  assert.equal(r.truncated, false);
  assert.equal(r.moreGroups, 0);
});

test("search('fracture') : S02 en tête, tronqué (15 codes, 13 cachés), d'autres catégories en plus", () => {
  const r = ix.search('fracture');
  assert.equal(r.rows[0].code, 'S02');
  assert.equal(r.rows[0].matchCount, 15);
  assert.equal(r.rows[0].hiddenCount, 13);
  assert.equal(r.truncated, true);
  assert.ok(r.moreGroups > 0);
});

test('within : limite aux descendants du nœud, sans lister le nœud lui-même', () => {
  const rows = ix.search('asthme', { within: 'J45' }).rows;
  assert.deepEqual(rows.map((r) => r.code), ['J45.9', 'J45.0', 'J45.1', 'J45.8']);
  assert.ok(rows.every((r) => r.code.startsWith('J45') && r.code !== 'J45'));
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
  assert.equal(w.cim10CountLabel(1, 'code'), w.tn('cim10.count.code', 1));
  assert.equal(w.cim10CountLabel(12, 'code'), w.tn('cim10.count.code', 12));
  assert.equal(w.cim10CountLabel(1, 'category'), w.tn('cim10.count.category', 1));
  assert.equal(w.cim10CountLabel(3, 'category'), w.tn('cim10.count.category', 3));
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
