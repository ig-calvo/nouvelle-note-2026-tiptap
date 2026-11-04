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
  assert.deepEqual(rail.slice(0, 4).map((r) => r.key), ['tout', 'favoris', 'suggeres', 'bilans'], 'Récent, Favoris, Suggérés, Ensembles d’examens (Figma « Requêtes — Vision »)');
  assert.deepEqual(rail.slice(0, 4).map((r) => r.label), [w.t('data.labViewRecent.label'), w.t('data.sectionFavorites.title'), w.t('data.labViewSuggested.label'), w.t('data.sectionLabBilans.title')]);
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

test('Récent : Au dossier, Favoris hors dossier, puis Fréquemment prescrit hors dossier et hors favoris ; pas de Prévention', () => {
  const r = D.searchOrder('lab', '');
  D.endOrderSearch();
  assert.deepEqual(r.labSections.map((s) => s.key), ['dossier', 'favoris', 'frequent']);
  const [dossier, fav, frequent] = r.labSections;
  assert.equal(fav.title, w.t('data.sectionFavorites.title'));
  assert.deepEqual(fav.items.map((it) => it.key), ['lipide'], 'FSC est favorite mais déjà au dossier : elle n’est pas répétée');
  assert.equal(frequent.title, w.t('data.sectionLabFrequentRx.title'));
  assert.equal(frequent.items.length, 3);
  const above = dossier.items.concat(fav.items).map((it) => it.key);
  assert.ok(frequent.items.every((it) => !above.includes(it.key)), 'rien de ce qui est déjà au dossier ou parmi les favoris');
  const all = r.labSections.flatMap((s) => s.items.map((it) => it.key));
  assert.equal(all.length, new Set(all).size, 'un examen n’apparaît qu’une fois dans Récent');
  const freqs = frequent.items.map((it) => D.labFreq(it.key));
  assert.deepEqual(freqs, freqs.slice().sort((a, b) => b - a), 'du plus au moins prescrit');
  assert.ok(D.labFreq('lipide') > 0 && D.labFreq('prof-annuel') > 0, 'un bilan compte comme une analyse (il peut figurer sous Fréquemment prescrit, selon le dossier)');
  assert.ok(!D.labViewKeys().includes('prev'), 'pas de vue Prévention');
});

test('Suggérés : une vue du panneau, les problèmes du Sommaire avec leur raison ; sans diagnostic, Récent reste la vue ouverte', () => {
  assert.ok(D.labViewKeys().includes('suggeres'));
  const rec = D.searchOrder('lab', '');
  assert.equal(D.getLabView(), 'tout', 'sans diagnostic, la recherche s’ouvre sur Récent');
  assert.ok(rec.labSections.every((s) => !s.key.startsWith('sugg')));
  D.setLabView('suggeres');
  const r = D.searchOrder('lab', '');
  const total = r.labSections.reduce((n, s) => n + s.items.length, 0);
  assert.equal(D.labRail('').find((x) => x.key === 'suggeres').count, total, 'le compteur du panneau suit la vue');
  assert.ok(r.labSections.length > 0 && r.labSections.every((s) => s.key.startsWith('sugg-')));
  assert.equal(r.labSections[0].title, w.t('data.sectionLabSuggestedProblem.title', { problem: w.TR('Hypertension artérielle') }), 'un titre par problème du Sommaire');
  assert.ok(r.labSections.flatMap((s) => s.items).every((it) => it.why), 'la raison et l’échéance sur la 2ᵉ ligne');
  D.endOrderSearch();
});

test('Suggérés sous un diagnostic : le diagnostic d’abord, puis les problèmes du Sommaire, chaque examen une fois', () => {
  const hta = { name: 'Hypertension artérielle', code: 'I10' };
  const r = D.searchOrder('lab', '', hta);
  assert.equal(D.getLabView(), 'suggeres', 'ouverte sous un diagnostic qui a des examens : la vue Suggérés, d’office');
  assert.equal(r.labSections[0].key, 'sugg-dx');
  assert.deepEqual(r.labSections[0].items.map((it) => it.key), ['creat', 'ions', 'srum']);
  const all = r.labSections.flatMap((s) => s.items.map((it) => it.key));
  assert.equal(all.length, new Set(all).size, 'ions et créatinine, déjà sous le diagnostic, ne reviennent pas sous le problème du Sommaire');
  D.endOrderSearch();
});

test('Suggérés d’office : la première frappe rend la main à Récent, un choix de vue n’est jamais défait', () => {
  const asthme = { name: 'Asthme léger', code: 'J45.9' };
  D.searchOrder('lab', '', asthme);
  assert.equal(D.getLabView(), 'suggeres');
  D.searchOrder('lab', 'f', asthme);
  assert.equal(D.getLabView(), 'tout', 'une frappe : recherche normale');
  D.searchOrder('lab', '', asthme);
  assert.equal(D.getLabView(), 'tout', 'effacer le texte ne ramène pas la vue d’office');
  D.endOrderSearch();
  assert.equal(D.getLabView(), 'tout');
  D.searchOrder('lab', '', asthme);
  D.setLabView('favoris');
  D.searchOrder('lab', '', asthme);
  assert.equal(D.getLabView(), 'favoris', 'le choix de la personne reste');
  D.endOrderSearch();
  D.searchOrder('lab', '', { name: 'Migraine sans aura', code: 'G43.0' });
  assert.equal(D.getLabView(), 'tout', 'un diagnostic sans examen associé : Récent');
  D.endOrderSearch();
});

test('une catégorie : de la plus prescrite à la moins prescrite, sans autre ordre au choix', () => {
  D.setLabView('hematologie');
  const items = D.searchOrder('lab', '').labSections[0].items;
  assert.deepEqual(items.slice(0, 4).map((it) => it.key), ['fsc', 'crp', 'inr', 'vs'], 'fréquence, puis le nom à égalité');
  assert.equal(items.length, D.LAB_GROUPS.find((g) => g.key === 'hematologie').tests.length, 'le tri ne retire rien');
  D.endOrderSearch();
  assert.equal(D.setLabSort, undefined, 'plus de bouton A-Z (décision du 2026-11-04)');
  assert.equal(D.getLabSort, undefined);
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
