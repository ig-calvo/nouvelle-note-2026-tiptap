// Lot A3 : les données de démonstration passent par L(), la recherche trouve un
// produit par son nom dans les deux langues, et le français n'a pas bougé.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPrototype, projectDir } from './harness.mjs';
import { extract } from '../tools/i18n-extract.mjs';

const EN = {
  'Atorvastatine': 'Atorvastatin', 'Atorvastatine 20 mg': 'Atorvastatin 20 mg',
  'Hypolipemiant': 'Lipid-lowering', 'Cardiologie': 'Cardiology', 'Avis cardiologie · Routine': 'Cardiology review · Routine',
  'Bilan lipidique': 'Lipid panel'
};
const files = ['note-ui/editor-data.jsx'];
const names = (r) => [...r.profil, ...r.favoris, ...r.frequents, ...r.autres].map((it) => it.name);

test('other() : en anglais, le français d’origine ; en français, l’anglais s’il est chargé', () => {
  const mk = (lang) => loadPrototype([], { lang, english: false, data: EN }).I18N;
  assert.equal(mk('en').other('Atorvastatin'), 'Atorvastatine');
  assert.equal(mk('en').other('Texte inconnu'), 'Texte inconnu');
  assert.equal(mk('fr').other('Atorvastatine'), 'Atorvastatin');
  assert.equal(mk('fr').other('Texte inconnu'), 'Texte inconnu');
  assert.equal(mk('fr').other(undefined), undefined);
});

test('recherche /rx en anglais : par le nom anglais ET par le nom français', () => {
  const w = loadPrototype(files, { lang: 'en', english: false, data: EN });
  assert.ok(names(w.NOTE_DATA.searchRx('atorvastatin')).includes('Atorvastatin'), 'nom anglais');
  assert.ok(names(w.NOTE_DATA.searchRx('atorvastatine')).includes('Atorvastatin'), 'nom français');
  assert.ok(names(w.NOTE_DATA.searchRx('lipid')).includes('Atorvastatin'), 'classe, en anglais');
  assert.ok(names(w.NOTE_DATA.searchRx('hypolip')).includes('Atorvastatin'), 'classe, en français');
});

test('recherche /lab et /ref en anglais : le nom français trouve toujours', () => {
  const w = loadPrototype(files, { lang: 'en', english: false, data: EN });
  const refs = w.NOTE_DATA.searchOrder('ref', 'cardiol');
  assert.ok([...refs.favoris, ...refs.frequents, ...refs.autres].some((it) => it.name === 'Cardiology'));
  const labs = w.NOTE_DATA.searchOrder('lab', 'lipid');
  assert.ok(labs.labSections.flatMap((s) => s.items).some((it) => it.name === 'Lipid panel'));
});

test('données : sans traduction, le français est celui d’avant (repli)', () => {
  const fr = loadPrototype(files, { lang: 'fr' }).NOTE_DATA;
  const en = loadPrototype(files, { lang: 'en', english: false }).NOTE_DATA;
  assert.deepEqual(JSON.parse(JSON.stringify(en.MED_CATALOG)), JSON.parse(JSON.stringify(fr.MED_CATALOG)));
  assert.equal(fr.MED_CATALOG[0].label, 'Atorvastatine 20 mg');
  assert.equal(fr.PATIENT.dob.replace(/\s/g, ' '), '03 mai 2011');
});

test('constantes de logique : les titres de section sont lus par t() des deux côtés', () => {
  const w = loadPrototype(['note-ui/note-sections.jsx', 'note-ui/editor-data.jsx']);
  assert.equal(w.CONCLUSION_LABEL, w.t('sections.conclusion.heading'));
  assert.equal(w.DETAILS_LABEL, w.t('sections.details.heading'));
  const titles = w.NOTE_DATA.NOTE_TEMPLATES.flatMap((tpl) => tpl.sections.map((s) => s.title));
  assert.ok(titles.includes(w.CONCLUSION_LABEL), 'un gabarit se termine par le titre que la logique cherche');
  assert.ok(titles.includes(w.DETAILS_LABEL));
});

test('catalogue : les textes de démonstration sont listés pour la traduction', () => {
  const { catalog } = extract(projectDir);
  assert.ok(catalog.donnees.length > 400, `${catalog.donnees.length} textes de démonstration`);
  const known = new Set(catalog.donnees.map((d) => d.fr));
  for (const text of ['Atorvastatine 20 mg — 1 co DIE HS', 'Syndrome viral / IVRS', 'Cardiologie', 'Examen annuel', 'Tylenol 100 mg']) {
    assert.ok(known.has(text), `« ${text} » absent du catalogue`);
  }
  assert.ok(catalog.donnees.every((d) => d.fichiers.length && d.empreinte && d.extrait !== undefined));
});
