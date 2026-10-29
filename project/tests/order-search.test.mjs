// Recherche de fonction (/rx, /lab, /img, /ref) : favoris stables pendant une
// recherche ouverte, recherche sans accents ni doublons (spec Figma « Prescription
// inline », section Recherche — lot 0 du plan PLAN-prescription-inline.md).
// Lancer : node --test project/tests/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPrototype } from './harness.mjs';

const w = loadPrototype(['note-ui/note-sections.jsx', 'note-ui/diagnostics.jsx', 'note-ui/editor-data.jsx', 'note-ui/editor-schema.jsx']);
const D = w.NOTE_DATA;
// Ces tests portent sur la recherche elle-même : aucune allergie au dossier
// (le filtre d'allergie a ses propres tests, allergy-filter.test.mjs).
D.setPatientAllergies([]);
const names = (r) => ({ favoris: r.favoris.map((it) => it.name), autres: r.autres.map((it) => it.name) });

test('ajouter un favori pendant une recherche ne déplace pas les sections', () => {
  D.endOrderSearch();
  const avant = names(D.searchOrder('rx', 'amoxi'));
  assert.deepEqual(avant.favoris, [w.TR('Amoxicilline')]);
  assert.ok(avant.autres.some((n) => n.startsWith(w.TR('Amoxicilline-clavulanate'))));

  const autre = D.searchOrder('rx', 'amoxi').autres[0];
  D.toggleOrderFav('rx', autre.key); // le cœur lit les favoris à jour…
  assert.ok(D.ORDER_DEFS.rx.favs.has(autre.key));
  assert.deepEqual(names(D.searchOrder('rx', 'amoxi')), avant); // …les sections, non
  assert.deepEqual(names(D.searchOrder('rx', '')).favoris.includes(autre.name), false);

  D.endOrderSearch(); // fermeture du menu : la prochaine recherche voit le favori
  assert.ok(names(D.searchOrder('rx', 'amoxi')).favoris.includes(autre.name));

  D.toggleOrderFav('rx', autre.key); // remet l'état d'origine
  D.endOrderSearch();
});

test('retirer un favori pendant une recherche ne le fait pas disparaître de la liste', () => {
  D.endOrderSearch();
  const avant = names(D.searchOrder('rx', 'amoxi'));
  const fav = D.searchOrder('rx', 'amoxi').favoris[0];
  D.toggleOrderFav('rx', fav.key);
  assert.deepEqual(names(D.searchOrder('rx', 'amoxi')), avant);
  D.endOrderSearch();
  assert.deepEqual(names(D.searchOrder('rx', 'amoxi')).favoris, []);
  D.toggleOrderFav('rx', fav.key);
  D.endOrderSearch();
});

test('le gel est propre à chaque fonction (rx, lab, ref)', () => {
  D.endOrderSearch();
  for (const kind of ['rx', 'lab', 'img', 'ref']) {
    const favKey = Array.from(D.ORDER_DEFS[kind].favs)[0];
    // /lab et /ref rangent leurs favoris dans une section de leur vue « Tout » (labSections).
    const favs = (r) => (r.labSections ? (r.labSections.find((s) => s.key === 'favoris') || { items: [] }).items : r.favoris).map((it) => it.key);
    const avant = favs(D.searchOrder(kind, ''));
    assert.ok(avant.includes(favKey), kind);
    D.toggleOrderFav(kind, favKey);
    assert.deepEqual(favs(D.searchOrder(kind, '')), avant, kind);
    D.toggleOrderFav(kind, favKey);
  }
  D.endOrderSearch();
});

test('la recherche ignore les accents et la casse, sans doublon entre sections', () => {
  D.endOrderSearch();
  assert.deepEqual(names(D.searchOrder('rx', 'amóxicilline')), names(D.searchOrder('rx', 'AMOXICILLINE')));
  assert.ok(D.searchOrder('rx', 'amóxicilline').favoris.length > 0);
  const all = D.searchOrder('rx', '');
  const keys = [].concat(all.profil, all.favoris, all.frequents, all.autres).map((it) => it.key);
  assert.equal(keys.length, new Set(keys).size);
  D.endOrderSearch();
});

test('parseSlashQuery : « mg/kg » n\'ouvre pas de recherche de fonction', () => {
  assert.equal(w.parseSlashQuery('kg').mode, w.TR('menu')); // le « / » de « mg/kg » n'active pas le plugin (pas d'espace avant)
  assert.deepEqual(w.parseSlashQuery('rx amox'), { mode: 'order', kind: 'rx', term: 'amox' });
  assert.equal(w.parseSlashQuery('rx').mode, w.TR('menu')); // sans espace : encore le menu générique
});
