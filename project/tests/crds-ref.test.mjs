// Menu /ref sur le dictionnaire CRDS (crds-data.js, demande de Xavier Boilard,
// 2026-10-28) : Spécialité > Section > Sous-section > Raison, recherche par
// raison, vue par spécialité, cote de priorité et puce de référence.
// Lancer : node --test project/tests/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPrototype } from './harness.mjs';

const w = loadPrototype(['note-ui/note-sections.jsx', 'note-ui/diagnostics.jsx', 'note-ui/editor-data.jsx', 'note-ui/editor-schema.jsx']);
const D = w.NOTE_DATA;
const search = (q, view) => {
  D.endOrderSearch();
  if (view) D.setRefView(view);
  const r = D.searchOrder('ref', q);
  D.endOrderSearch();
  return r.labSections;
};
const reasonOf = (spec, label) => D.CRDS_REASONS.find((r) => r.spec === spec && r.name === label);

test('données : 26 spécialités et leurs raisons, les 12 clés d’avant gardées', () => {
  assert.equal(D.CRDS_SPECS.length, 26);
  assert.equal(D.CRDS_REASONS.length, 479);
  for (const key of ['cardio', 'ortho', 'derm', 'gastro', 'neuro', 'pneumo', 'rhuma', 'endo', 'nephro', 'uro', 'gyn', 'ophthal']) {
    assert.ok(D.ORDER_DEFS.ref.items().some((it) => it.key === key), key);
  }
  assert.deepEqual(D.FIELD_OPTIONS.specialty, D.CRDS_SPECS.map((s) => s.name));
});

test('hiérarchie : les sections viennent des colonnes ou du début du texte', () => {
  const surdite = reasonOf('orl', 'Avec retard de langage chez l\'enfant');
  assert.deepEqual(surdite.path, ['Otologie', 'Surdité']);
  assert.equal(surdite.cote, 'D');
  const angine = reasonOf('cardio', 'Angine d\'effort sévère (CCS 3/4) stable');
  assert.deepEqual(angine.path, ['DRS/Angine']);
  assert.equal(angine.cote, 'B');
  // « voir notes 1 et 2* » renvoie au formulaire papier : retiré du libellé.
  assert.ok(D.CRDS_REASONS.every((r) => !/voir notes?/i.test(r.name)));
});

test('« Tout » : une recherche trouve les raisons, rangées sous leur spécialité', () => {
  const secs = search('urinaire homme');
  const uro = secs.find((s) => s.key === 'r:uro');
  assert.ok(uro, 'section Urologie');
  assert.ok(uro.items.some((it) => it.name === 'Infection urinaire chez l\'homme'));
  // Une spécialité se trouve par son nom.
  assert.ok(search('cardio').find((s) => s.key === 'specs').items.some((it) => it.key === 'cardio'));
});

test('vue d’une spécialité : la spécialité seule, puis ses raisons sous leur 1re section', () => {
  const secs = search('', 'orl');
  assert.equal(secs[0].items[0].key, 'orl');
  const otologie = secs.find((s) => s.title === 'Otologie');
  assert.ok(otologie.items.some((it) => it.name === 'Avec retard de langage chez l\'enfant' && it.sig === 'Surdité'));
  assert.equal(secs.reduce((n, s) => n + s.items.filter((it) => it.crds).length, 0), 22);
});

test('panneau : Tout, Favoris, puis une spécialité par ligne avec son nombre de raisons', () => {
  D.endOrderSearch();
  const rail = D.refRail('');
  assert.deepEqual(rail.slice(0, 2).map((r) => r.key), ['tout', 'favoris']);
  assert.equal(rail.find((r) => r.key === 'uro').count, 19);
  assert.equal(rail.length, 2 + 26);
  assert.ok(D.refRail('urinaire').find((r) => r.key === 'uro').count < 19);
});

test('puce : la spécialité, la raison et sa cote comme priorité', () => {
  const r = reasonOf('uro', 'Infection urinaire chez l\'homme');
  const item = D.crdsRefItem(r);
  assert.equal(item.details.specialty, 'Urologie');
  assert.equal(item.details.crdsKey, r.crds);
  assert.equal(item.details.priority, 'D');
  assert.equal(item.chipSig, 'Infection urinaire chez l\'homme · Priorité D');
  // Sans cote (formulaire sans priorité) : Routine.
  const sansCote = D.CRDS_REASONS.find((x) => !x.cote);
  assert.equal(D.crdsRefDetails(sansCote).priority, 'Routine');
  // Une référence sans raison garde l'affichage d'avant.
  assert.equal(D.deriveRefRx({ specialty: 'Cardiologie', priority: 'Routine' }).sig, 'Routine');
});

test('la vue revient à « Tout » à la fin d’une recherche', () => {
  D.setRefView('orl');
  assert.equal(D.getRefView(), 'orl');
  D.endOrderSearch();
  assert.equal(D.getRefView(), 'tout');
  D.setRefView('inconnue');
  assert.equal(D.getRefView(), 'tout');
});
