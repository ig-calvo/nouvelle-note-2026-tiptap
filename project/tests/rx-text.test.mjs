// Forme, quantité par prise et durée d'une ordonnance (note-ui/rx-text.jsx) :
// les valeurs `form` et `durationUnit` sont des codes ; ce que le médecin tape
// est du texte, lu dans les deux langues.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPrototype } from './harness.mjs';

const w = loadPrototype([]);
const R = w.RX_TEXT;

test('qtyLabel : quantité par prise + abréviation de la forme', () => {
  assert.equal(R.qtyLabel({ form: 'comprimé' }), '1 comp.');
  assert.equal(R.qtyLabel({ form: 'comprimé', qtyDose: '2' }), '2 comp.');
  assert.equal(R.qtyLabel({ form: 'aérosol-doseur' }), '2 inh', 'un aérosol-doseur vaut 2 inhalations par défaut');
  assert.equal(R.qtyLabel({ form: 'gélule' }), '1 gél');
  assert.equal(R.qtyLabel({ form: 'capsule' }), '1 caps.');
  assert.equal(R.qtyLabel({ form: 'sirop' }), '1 dose', 'forme sans abréviation → « dose »');
  assert.equal(R.qtyLabel({ form: 'comprimé', qtyDose: 'à jeun' }), '1 comp.', 'une quantité qui ne commence pas par un chiffre est ignorée');
});

test('durationShort : « 7j » pour les jours, l’unité écrite sinon', () => {
  assert.equal(R.durationShort({ duration: '7', durationUnit: 'jours' }), '7j');
  assert.equal(R.durationShort({ duration: '7', durationUnit: '' }), '7j');
  assert.equal(R.durationShort({ duration: '1', durationUnit: 'semaines' }), '1 semaine');
  assert.equal(R.durationShort({ duration: '2', durationUnit: 'semaines' }), '2 semaines');
  assert.equal(R.durationShort({ duration: '3', durationUnit: 'mois' }), '3 mois');
});

test('durationLong : « 7 jours » (jours par défaut), accord selon le nombre', () => {
  assert.equal(R.durationLong({ duration: '7' }), '7 jours');
  assert.equal(R.durationLong({ duration: '1', durationUnit: 'jours' }), '1 jour');
  assert.equal(R.durationLong({ duration: '2', durationUnit: 'semaines' }), '2 semaines');
});

test('durationLong : une unité inconnue (texte libre) est rendue telle quelle', () => {
  assert.equal(R.durationLong({ duration: '2', durationUnit: 'cycles' }), '2 cycles');
});

test('parseDurationRefills : mots français et anglais → code ; renouvellement facultatif', () => {
  assert.deepEqual(R.parseDurationRefills('30 jours R2'), { duration: '30', unit: 'jours', refills: '2' });
  assert.deepEqual(R.parseDurationRefills('1 semaine'), { duration: '1', unit: 'semaines', refills: '' });
  assert.deepEqual(R.parseDurationRefills('30 days R3'), { duration: '30', unit: 'jours', refills: '3' });
  assert.deepEqual(R.parseDurationRefills('2 Weeks'), { duration: '2', unit: 'semaines', refills: '' });
  assert.deepEqual(R.parseDurationRefills('3 months R0'), { duration: '3', unit: 'mois', refills: '0' });
  assert.equal(R.parseDurationRefills('à vie'), null);
});

test('parseDuration : nombre, unité facultative ; un an est rangé en mois (comportement conservé)', () => {
  assert.deepEqual(R.parseDuration('14'), { duration: '14', unit: '' });
  assert.deepEqual(R.parseDuration('3 mois'), { duration: '3', unit: 'mois' });
  assert.deepEqual(R.parseDuration('10 days'), { duration: '10', unit: 'jours' });
  assert.deepEqual(R.parseDuration('1 an'), { duration: '1', unit: 'mois' });
  assert.deepEqual(R.parseDuration('1 year'), { duration: '1', unit: 'mois' });
  assert.equal(R.parseDuration('long'), null);
});

test('isLongTerm : « long terme » et « long-term »', () => {
  assert.ok(R.isLongTerm('Long terme R5'));
  assert.ok(R.isLongTerm(' long-term'));
  assert.ok(!R.isLongTerm('30 jours'));
});

test('unitCode : singulier, pluriel et casse', () => {
  assert.equal(R.unitCode('Jour'), 'jours');
  assert.equal(R.unitCode('semaines'), 'semaines');
  assert.equal(R.unitCode('MONTH'), 'mois');
  assert.equal(R.unitCode('cycles'), null);
});

test('en anglais sans fichier anglais : mêmes textes (repli sur le français), mêmes accords', () => {
  const en = loadPrototype([], { lang: 'en' });
  assert.equal(en.RX_TEXT.qtyLabel({ form: 'comprimé' }), '1 comp.');
  assert.equal(en.RX_TEXT.durationShort({ duration: '2', durationUnit: 'semaines' }), '2 semaines');
});
