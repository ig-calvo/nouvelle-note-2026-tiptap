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
  assert.deepEqual(rail.slice(0, 5).map((r) => r.key), ['tout', 'prev', 'sugg', 'favoris', 'bilans']);
  assert.equal(rail.find((r) => r.key === 'biochimie').count, D.LAB_GROUPS[0].tests.length);
  assert.ok(rail.filter((r) => r.group).length === D.LAB_GROUPS.length);
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

test('Prévention et Suggérés : la raison sur la 2e ligne ; un bilan peut être suggéré', () => {
  const r = D.searchOrder('lab', '');
  D.endOrderSearch();
  const prev = r.labSections.find((s) => s.key === 'prev');
  assert.ok(prev.items.every((it) => it.why));
  const sugg = r.labSections.find((s) => s.key === 'sugg1');
  assert.equal(sugg.title, w.t('data.sectionLabSuggested.title', { problem: w.TR('Dyslipidémie') }));
  assert.ok(sugg.items.some((it) => it.key === 'lipide' && it.profile));
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
