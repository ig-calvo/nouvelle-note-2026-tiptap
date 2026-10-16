// Recherche /rx : le profil complet du patient, avec son statut, toutes les
// lignes prescriptibles (spec Figma « Recherche » EX-023 : « tous les statuts
// au profil sont admis : actif, Expiré et Cessé ») — lot 3 du plan
// PLAN-prescription-inline.md.
// Lancer : node --test project/tests/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPrototype } from './harness.mjs';

const w = loadPrototype(['note-ui/note-sections.jsx', 'note-ui/diagnostics.jsx', 'note-ui/editor-data.jsx', 'note-ui/editor-schema.jsx']);
const D = w.NOTE_DATA;
const row = (key) => D.PATIENT_MEDS.find((m) => m.key === key);

test('le profil montre les 4 médications, tous statuts, dans le menu /rx', () => {
  const r = D.searchRx('');
  assert.deepEqual(r.profil.map((m) => [m.name + ' ' + m.dose, m.medStatus]), [
    ['Contraceptif oral ', 'active'], ['Tylenol 100 mg', 'active'], ['Tylenol 500 mg', 'echue'], ['Nitrofurantoïne 100 mg', 'cessée']
  ]);
  assert.equal(r.profilCeased, undefined); // plus de bloc replié « Médicaments cessés »
  assert.deepEqual(r.profil.map((m) => D.MED_STATUS_LABEL[m.medStatus]), ['Actif', 'Actif', 'Échu', 'Cessé']);
});

test('la recherche filtre le profil sans distinction de statut', () => {
  assert.deepEqual(D.searchRx('tyl').profil.map((m) => m.key), ['med-tylenol-100', 'med-tylenol-500']);
  assert.deepEqual(D.searchRx('nitro').profil.map((m) => m.key), ['med-nitrofurantoine']);
  assert.deepEqual(D.searchRx('NITROFURANTOÏNE').profil.map((m) => m.key), ['med-nitrofurantoine']);
});

test('une médication cessée ou échue se prescrit : elle est dans la liste de navigation au clavier', () => {
  const keys = w.flattenRxResults(D.searchRx('')).map((it) => it.key);
  for (const k of ['med-tylenol-500', 'med-nitrofurantoine']) assert.ok(keys.includes(k), k);
  assert.deepEqual(keys.slice(0, 4), ['med-contraceptif', 'med-tylenol-100', 'med-tylenol-500', 'med-nitrofurantoine']);
});

test('actions d’une ligne : actif augmente, diminue, renouvelle et cesse ; échu renouvelle ou prescrit ; cessé prescrit', () => {
  assert.deepEqual(D.medActions(row('med-tylenol-100')), ['augmenter', 'diminuer', 'renouveler', 'cesser']);
  assert.deepEqual(D.medActions(row('med-tylenol-500')), ['renouveler', 'prescrire']);
  assert.deepEqual(D.medActions(row('med-nitrofurantoine')), ['prescrire']);
  assert.deepEqual(D.medActions(D.RX_ITEMS[0]), []); // un item du catalogue n'a pas d'action de profil
});

test('clic ou Entrée sur une ligne : renouveler (actif, échu) ou nouvelle prescription (cessé, catalogue)', () => {
  assert.equal(D.defaultMedAction(row('med-tylenol-100')), 'renouveler');
  assert.equal(D.defaultMedAction(row('med-tylenol-500')), 'renouveler');
  assert.equal(D.defaultMedAction(row('med-nitrofurantoine')), undefined);
  assert.equal(D.defaultMedAction(D.RX_ITEMS[0]), undefined);
});

test('prescrire une médication échue ou cessée donne une puce complète, prête à signer', () => {
  for (const key of ['med-tylenol-500', 'med-nitrofurantoine']) {
    const a = w.orderChipAttrs('rx', row(key));
    assert.deepEqual(w.chipIssues(a), [], key);
  }
});

test('le statut échu existe aussi au Sommaire (mêmes clés de statut)', () => {
  // Le Sommaire colore actif / échu / cessé avec ces clés (MEDS_STATUS_COLOR, Summary.jsx).
  assert.deepEqual(Object.keys(D.MED_STATUS_LABEL), ['active', 'echue', 'cessée']);
});
