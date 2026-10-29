// Deux patientes (tweak « Patiente », patients.js) : le dossier pédiatrique
// reste le défaut ; le dossier adulte porte l'exemple du Figma « Demande de
// consultation en médecine spécialisée » (PLAN-reference-specialite.md, lot 1).
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPrototype } from './harness.mjs';

const files = ['note-ui/editor-data.jsx', 'note-ui/diagnostics.jsx'];

test('par défaut, la patiente pédiatrique (Geneviève Tremblay, 15 ans)', () => {
  const w = loadPrototype(files);
  assert.equal(w.PATIENT_KEY, 'pediatrique');
  assert.equal(w.NOTE_DATA.PATIENT.name, 'Geneviève Tremblay');
  assert.deepEqual(w.NOTE_DATA.getPatientAllergies(), [w.TR('Pénicilline')]);
  assert.ok(w.sommaireDxSeed().problems.some((p) => p.code === 'J45.9'), 'asthme au Sommaire');
});

test('patiente adulte : identité, migraine au Sommaire, profil médicamenteux du Figma', () => {
  const w = loadPrototype(files, { patient: 'adulte' });
  const D = w.NOTE_DATA;
  assert.equal(D.PATIENT.name, 'Micheline Lamontagne');
  assert.equal(D.PATIENT.age, w.TR('47 ans'));
  assert.deepEqual(D.getPatientAllergies(), [w.TR('Sulfamides')]);
  const seed = w.sommaireDxSeed();
  assert.ok(seed.problems.some((p) => p.code === 'G43.0'), 'migraine au Sommaire');
  assert.ok(!seed.problems.some((p) => p.code === 'J45.9'), 'pas l’asthme de l’autre dossier');
  // Le profil : almotriptan et candesartan actifs (cochés d'office dans la référence).
  const rx = D.searchRx('');
  const meds = rx.profil.map((it) => it.key);
  assert.ok(meds.includes('med-almotriptan') && meds.includes('med-candesartan'), meds.join(', '));
  assert.ok(!meds.includes('med-tylenol-100'), 'pas le profil de l’autre dossier');
});

test('patiente adulte : l’allergie aux sulfamides masque le TMP-SMX dans /rx, pas un autre antibiotique', () => {
  const w = loadPrototype(files, { patient: 'adulte' });
  const D = w.NOTE_DATA;
  D.endOrderSearch();
  const tmp = D.searchOrder('rx', 'sulfamethox');
  assert.equal(tmp.allergy && tmp.allergy.count, 1, 'TMP-SMX masqué et compté');
  const shown = [...tmp.favoris, ...tmp.frequents, ...tmp.autres].map((it) => it.key);
  assert.ok(!shown.includes('cat-45'), shown.join(', '));
  assert.equal(D.rxAllergyOf({ name: 'Trimethoprime-sulfamethoxazole', details: {} }), w.TR('Sulfamides'));
  const amox = D.searchOrder('rx', 'amox');
  assert.ok(!amox.allergy, 'l’amoxicilline n’est pas masquée pour cette patiente');
});

test('une patiente inconnue retombe sur le dossier pédiatrique', () => {
  const w = loadPrototype(files, { patient: 'inconnue' });
  assert.equal(w.PATIENT_KEY, 'pediatrique');
  assert.equal(w.NOTE_DATA.PATIENT.name, 'Geneviève Tremblay');
});
