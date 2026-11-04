// Menu de sélection des requêtes de laboratoire (PLAN-menu-requetes-labo.md) :
// catalogue « contenu fourni », recherche par acronyme, groupe et plusieurs
// mots, panneau des vues et des groupes, bilans, dernier résultat au dossier.
// Lancer : node --test project/tests/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPrototype } from './harness.mjs';

const w = loadPrototype(['note-ui/note-sections.jsx', 'note-ui/diagnostics.jsx', 'note-ui/editor-data.jsx', 'note-ui/editor-schema.jsx']);
const D = w.NOTE_DATA;
const lab = (key) => D.ORDER_DEFS.lab.items().find((it) => it.key === key);
const found = (q) => { const r = D.searchOrder('lab', q); D.endOrderSearch(); return r.labSections.flatMap((s) => s.items).map((it) => it.key); };

test('catalogue : les six groupes du contenu fourni, plus la spirométrie ; les anciennes clés restent', () => {
  assert.deepEqual(D.LAB_GROUPS.map((g) => g.key), ['biochimie', 'biochimie-urinaire', 'hematologie', 'medicament', 'microbiologie', 'serologie', 'fonction-respiratoire']);
  for (const key of ['fsc', 'tsh', 'glyc', 'hba1c', 'creat', 'ions', 'ferritine', 'b12', 'inr', 'srum', 'efr', 'lipide']) assert.ok(lab(key), key);
  const keys = D.ORDER_DEFS.lab.items().map((it) => it.key);
  assert.equal(keys.length, new Set(keys).size, 'aucune clé en double');
  assert.equal(lab('fsc').name, w.TR('Formule sanguine complète'));
  assert.equal(lab('fsc').groupName, w.TR('Hématologie'));
});

test('recherche : acronyme, alias, plusieurs mots, nom de groupe, sans accents', () => {
  assert.equal(found('fsc')[0], 'fsc');
  assert.ok(found('psa').includes('aps'), 'PSA = APS (RA-18)');
  assert.ok(found('tsh').includes('tsh'));
  assert.ok(found('inr').includes('inr'));
  assert.deepEqual(found('glucose jeun'), ['bilan-hta-initial', 'bilan-hta-suivi', 'prof-diabete', 'prof-annuel', 'glyc'], 'tous les mots, bilans d’abord');
  assert.equal(found('microbiologie').length, D.LAB_GROUPS.find((g) => g.key === 'microbiologie').tests.length, 'un nom de groupe donne tout le groupe');
  assert.deepEqual(found('electrolytes'), found('Électrolytes'));
  assert.deepEqual(found('zzz'), []);
});

test('avec une recherche : les bilans, puis les analyses sous leur groupe', () => {
  const r = D.searchOrder('lab', 'fer');
  D.endOrderSearch();
  assert.equal(r.labSections[0].key, 'bilans');
  assert.ok(r.labSections.slice(1).every((s) => D.LAB_GROUPS.some((g) => g.key === s.key)));
  assert.ok(r.labSections.find((s) => s.key === 'biochimie').items.some((it) => it.key === 'ferritine'));
});

test('panneau : une vue filtre la liste et la recherche, ses nombres suivent la recherche, retour à Tout à la fermeture', () => {
  D.endOrderSearch();
  const rail = D.labRail('');
  assert.deepEqual(rail.slice(0, 3).map((r) => r.key), ['tout', 'favoris', 'bilans'], 'Récent, Favoris, Ensembles d’examens (Figma « Requêtes — Vision »)');
  assert.deepEqual(rail.slice(0, 3).map((r) => r.label), [w.t('data.labViewRecent.label'), w.t('data.sectionFavorites.title'), w.t('data.sectionLabBilans.title')]);
  assert.equal(D.labRail('fsc')[0].label, w.t('data.labViewAll.label'), 'avec une recherche, la première vue montre tout');
  assert.equal(rail.find((r) => r.key === 'biochimie').count, D.LAB_GROUPS[0].tests.length);
  assert.ok(rail.filter((r) => r.group).length === D.LAB_GROUPS.length);
  assert.deepEqual(rail.filter((r) => r.group).map((r) => r.key), ['biochimie', 'hematologie', 'microbiologie', 'serologie', 'biochimie-urinaire', 'fonction-respiratoire', 'medicament'], 'les catégories, de la plus prescrite à la moins prescrite');
  assert.deepEqual(D.labViewKeys(), rail.map((r) => r.key), 'le clavier suit l’ordre du panneau');
  D.setLabView('hematologie');
  assert.deepEqual(D.searchOrder('lab', '').labSections.map((s) => s.key), ['hematologie']);
  assert.deepEqual(D.searchOrder('lab', 'c').labSections.map((s) => s.key), ['hematologie'], 'la vue filtre aussi la recherche');
  assert.ok(D.labRail('fsc').find((r) => r.key === 'hematologie').count >= 1);
  assert.equal(D.labRail('fsc').find((r) => r.key === 'medicament').count, 0);
  D.endOrderSearch();
  assert.equal(D.getLabView(), 'tout');
  D.setLabView('inconnue');
  assert.equal(D.getLabView(), 'tout');
});

test('Récent : Au dossier, puis Fréquemment prescrit hors dossier ; plus de Prévention ni de Suggérés', () => {
  const r = D.searchOrder('lab', '');
  D.endOrderSearch();
  assert.deepEqual(r.labSections.map((s) => s.key), ['dossier', 'frequent']);
  const frequent = r.labSections[1];
  assert.equal(frequent.title, w.t('data.sectionLabFrequentRx.title'));
  assert.equal(frequent.items.length, 3);
  const onFile = r.labSections[0].items.map((it) => it.key);
  assert.ok(frequent.items.every((it) => !onFile.includes(it.key)), 'rien de ce qui est déjà au dossier');
  const freqs = frequent.items.map((it) => D.labFreq(it.key));
  assert.deepEqual(freqs, freqs.slice().sort((a, b) => b - a), 'du plus au moins prescrit');
  assert.ok(D.labFreq('lipide') > 0 && D.labFreq('prof-annuel') > 0, 'un bilan compte comme une analyse (il peut figurer sous Fréquemment prescrit, selon le dossier)');
  assert.ok(!D.labViewKeys().includes('prev') && !D.labViewKeys().includes('sugg'));
});

test('une catégorie : de la plus prescrite à la moins prescrite, ou de A à Z ; le tri revient à la fermeture', () => {
  D.setLabView('hematologie');
  assert.deepEqual(D.searchOrder('lab', '').labSections[0].items.slice(0, 4).map((it) => it.key), ['fsc', 'crp', 'inr', 'vs'], 'fréquence, puis le nom à égalité');
  D.setLabSort('az');
  const az = D.searchOrder('lab', '').labSections[0].items.map((it) => it.name);
  assert.deepEqual(az, az.slice().sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' })));
  assert.equal(az[0], w.TR('Antithrombine III'));
  assert.equal(az.length, D.LAB_GROUPS.find((g) => g.key === 'hematologie').tests.length, 'le tri ne retire rien');
  D.setLabSort('n’importe quoi');
  assert.equal(D.getLabSort(), 'freq');
  D.setLabSort('az');
  D.endOrderSearch();
  assert.equal(D.getLabSort(), 'freq');
});

test('au dossier : dernier résultat, normal ou anormal, et tendance par rapport au précédent', () => {
  assert.deepEqual(D.labOnFile('ldl'), { date: '2025-09-28', value: w.TR('3,4 mmol/L'), status: 'anormal', prev: w.TR('3,7 mmol/L'), trend: 'down' });
  assert.equal(D.labOnFile('fer').trend, undefined, 'un seul résultat : pas de tendance');
  assert.equal(D.labOnFile('glyc'), null);
  const r = D.searchOrder('lab', '');
  D.endOrderSearch();
  assert.deepEqual(r.labSections[0].items.map((it) => it.key), ['fsc', 'creat', 'ldl', 'tsh', 'fer']);
});

test('puce labo : acronymes ; le nom du bilan tant qu’il est entier', () => {
  const [bilan] = w.buildRequestChips([lab('bilan-fatigue')], 'lab');
  assert.equal(bilan.rx.name, w.TR('Fatigue'));
  const d = Object.assign({}, bilan.details, { tests: bilan.details.tests.filter((x) => x !== w.TR('Créatinine sérique')) });
  assert.equal(D.deriveLabRx(d).name, ['FSC', 'Ferritine', 'TSH'].map(w.TR).join(', '), 'une analyse retirée : la liste, en acronymes');
  const [two] = w.buildRequestChips([lab('fsc'), lab('tsh'), lab('creat')], 'lab');
  assert.equal(two.rx.name, ['FSC', 'TSH', 'Créatinine sérique'].map(w.TR).join(', '));
  assert.ok(['fsc', 'tsh', 'creat'].includes(D.orderItemForChip(two).item.key), 'la puce se rattache encore au catalogue');
});

test('les bilans de la requête papier : analyses du catalogue ou texte, sans doublon', () => {
  const card = lab('bilan-cardiaque');
  assert.ok(card.details.tests.includes(w.TR('Troponine T cardiaque')), 'texte gardé tel quel');
  assert.ok(card.details.tests.includes(w.TR('International Normalized Ratio')));
  for (const b of D.LAB_BILANS) assert.equal(b.details.tests.length, new Set(b.details.tests).size, b.key);
  assert.equal(D.LAB_PROFILES, D.LAB_BILANS);
});
