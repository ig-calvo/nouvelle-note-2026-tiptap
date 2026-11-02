// Conduite précédente (PLAN-conduite-precedente.md) : un problème du dossier
// repris en Conclusion arrive avec ma dernière conduite pour ce problème, en
// attente ; une tuile qui ne correspond plus au dossier le dit.
// Lancer : node --test project/tests/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPrototype } from './harness.mjs';

const w = loadPrototype(['note-ui/note-sections.jsx', 'note-ui/diagnostics.jsx', 'note-ui/editor-data.jsx', 'note-ui/editor-schema.jsx'], { patient: 'adulte' });
const D = w.NOTE_DATA;
D.setPatientAllergies([]);

const TODAY = new Date(2026, 10, 1);
const row = (id) => w.getSommaireDiagnostics().find((r) => r.sommaireId === id);
const region = (id) => w.makeDiagRegionAttrs({ action: 'reprendre', target: row(id) }, { id: w.newDiagId(), now: TODAY.toISOString() });

const DIABETE = {
  sommaireId: 'som-diabete',
  content: 'Plan : Poursuivre {metf} et {glic}. {hba1c} dans 3 mois.',
  tiles: {
    metf: { kind: 'rx', key: 'cat-15', details: { dose: '500', frequency: 'BID' } },
    glic: { kind: 'rx', key: 'cat-16' },
    hba1c: { kind: 'lab', key: 'hba1c' } },
};
const note = (date, author, conducts) => ({ date, author, diagnostics: [], conclusion: 'x', conducts });
const NOTES = [
  note('2 OCTOBRE 2026 10:00', 'Dr Marc Lefebvre', [Object.assign({}, DIABETE, { content: 'Plan : collègue.' })]),
  note('9 SEPTEMBRE 2026 08:50', '%%DOCTOR%%', [DIABETE]),
  note('12 MARS 2026 08:15', '%%DOCTOR%%', [Object.assign({}, DIABETE, { content: 'Plan : plus ancienne.' })]),
  note('3 MARS 2025 09:30', '%%DOCTOR%%', [{ sommaireId: 'som-hypothyroidie', content: 'Plan : Poursuivre {levo}. {tsh} dans 12 mois.',
    tiles: { levo: { kind: 'rx', key: 'med-levothyroxine' }, tsh: { kind: 'lab', key: 'tsh' } } }]),
  note('15 AVRIL 2026 11:05', 'Dr Marc Lefebvre', [{ sommaireId: 'som-migraine', content: 'Plan : collègue migraine.', tiles: {} }]),
];
const CTX = { notes: NOTES, today: TODAY };
const chipsOf = (blocks) => blocks.flatMap((b) => (b.content || []).filter((n) => n.type === 'chip'));

test('date d’une note antérieure, en français comme en anglais', () => {
  assert.deepEqual(D.parseNoteDate('9 SEPTEMBRE 2026 08:50'), new Date(2026, 8, 9));
  assert.deepEqual(D.parseNoteDate('SEPTEMBER 9, 2026 8:50 AM'), new Date(2026, 8, 9));
  assert.deepEqual(D.parseNoteDate('8 DÉCEMBRE 2025 09:15'), new Date(2025, 11, 8));
  assert.equal(D.parseNoteDate('hier'), null);
});

test('ma dernière note gagne, même si un collègue a écrit plus récemment (C2)', () => {
  const lc = D.lastConduct(region('som-diabete'), CTX);
  assert.equal(lc.mine.id, 'last');
  assert.equal(lc.mine.content, DIABETE.content, 'la plus récente de MES notes, pas celle de mars');
  assert.equal(lc.mine.ageMonths, 1);
  assert.equal(lc.mine.stale, false);
  assert.equal(lc.mine.source, w.t('conduct.source.mine.label', { date: lc.mine.date }));
  assert.equal(lc.colleague.author, 'Dr Marc Lefebvre');
});

test('reliée au dossier seulement (C8) : sans sommaireId, antécédent ou problème cessé, rien', () => {
  const none = { mine: null, colleague: null };
  const dx = region('som-diabete');
  assert.deepEqual(D.lastConduct(Object.assign({}, dx, { sommaireId: null }), CTX), none);
  assert.deepEqual(D.lastConduct(Object.assign({}, dx, { documentAs: 'antecedent' }), CTX), none);
  assert.deepEqual(D.lastConduct(Object.assign({}, dx, { status: 'cesse' }), CTX), none);
  assert.deepEqual(D.lastConduct({ name: 'Diabète de type 2', code: 'E11.9' }, CTX), none, 'jamais par code ni libellé');
});

test('plus de 12 mois : toujours offerte, marquée `stale` (C5)', () => {
  const mine = D.lastConduct(region('som-hypothyroidie'), CTX).mine;
  assert.equal(mine.ageMonths, 19);
  assert.equal(mine.stale, true);
  assert.equal(mine.source, w.t('conduct.source.mineStale.label', { date: mine.date }), 'la barre des ajouts le dit aussi');
});

test('tuile divergente : dose changée, cessée, allergie ; une tuile à jour n’a rien (C6)', () => {
  assert.match(D.conductWarning(DIABETE.tiles.metf), /1000 mg/);
  assert.equal(D.conductWarning(DIABETE.tiles.metf), w.t('conduct.warn.dose.text', { current: '1000 mg ' + w.TR('1 co PO BID') }));
  assert.equal(D.conductWarning(DIABETE.tiles.glic), w.t('conduct.warn.ceased.text', { status: D.medStatusText(D.PATIENT_MEDS.find((m) => m.key === 'med-gliclazide')) }));
  assert.equal(D.conductWarning({ kind: 'rx', key: 'med-levothyroxine' }), null);
  assert.equal(D.conductWarning(DIABETE.tiles.hba1c), null);
  D.setPatientAllergies([w.TR('Pénicilline')]);
  assert.equal(D.conductWarning({ kind: 'rx', key: 'amox500' }), w.t('conduct.warn.allergy.text', { name: w.TR('Pénicilline') }));
  D.setPatientAllergies([]);
});

test('options de conclusion : la conduite en tête, puis les textes rapides du diagnostic', () => {
  const o = D.dxConclusionOptions(region('som-diabete'), CTX);
  assert.deepEqual(o.map((x) => x.id), ['last', 'db2-suivi']);
  assert.deepEqual(D.dxConclusionOptions(region('som-hypothyroidie'), CTX).map((x) => x.id), ['last'], 'sans texte rapide : la conduite seule');
});

test('pas de note à moi : celle d’un collègue est proposée, à son nom (C4)', () => {
  const o = D.dxConclusionOptions(region('som-migraine'), CTX);
  assert.equal(o[0].id, 'last-colleague');
  assert.equal(o[0].name, w.t('conduct.colleague.title', { author: 'Dr Marc Lefebvre' }));
  assert.equal(D.lastConduct(region('som-migraine'), CTX).mine, null);
});

test('blocs de la conduite : tuiles en attente à leur place, avertissement sur la puce', () => {
  const opt = D.lastConduct(region('som-diabete'), CTX).mine;
  const blocks = w.buildConclusionBlocks(opt);
  assert.equal(blocks.length, 1, 'tout est placé dans le texte, pas de ligne d’ajouts à la fin');
  const chips = chipsOf(blocks);
  assert.equal(chips.length, 3);
  assert.ok(chips.every((c) => c.attrs.pending && c.attrs.proposedBy === opt.source));
  assert.match(chips[0].attrs.warn, /1000 mg/);
  assert.ok(chips[1].attrs.warn);
  assert.equal(chips[2].attrs.warn, undefined);
  const badges = w.chipStatusBadges(chips[0].attrs).map((b) => b.kind);
  assert.deepEqual(badges, ['warn', 'pending']);
});

test('une médication du profil devient une puce (lévothyroxine au dossier)', () => {
  const blocks = w.buildConclusionBlocks(D.lastConduct(region('som-hypothyroidie'), CTX).mine);
  const chips = chipsOf(blocks);
  assert.equal(chips[0].attrs.rx.name, w.TR('Lévothyroxine'));
  assert.equal(chips[0].attrs.rx.dose, '75 mcg');
});

test('insertion automatique : une fois par fil et par note (Q3), réglage éteint = rien (Q7)', () => {
  w.resetConductServed();
  const dx = region('som-diabete');
  const opts = { ctx: CTX, proposeText: false };
  assert.ok(w.autoConductBlocks(dx, opts).length > 0);
  assert.equal(w.autoConductBlocks(region('som-diabete'), opts), null, 'même fil, déjà servi');
  w.resetConductServed();
  w.__AUTO_CONDUCT = false;
  assert.equal(w.autoConductBlocks(dx, opts), null);
  w.__AUTO_CONDUCT = undefined;
  assert.ok(w.autoConductBlocks(dx, opts));
  assert.equal(w.autoConductBlocks(region('som-migraine'), opts), null, 'collègue seulement : rien d’inséré');
  w.resetConductServed();
});

test('accepter en bloc efface l’avertissement', () => {
  const opt = D.lastConduct(region('som-diabete'), CTX).mine;
  const doc = { type: 'doc', content: w.buildConclusionBlocks(opt) };
  const accepted = w.resolvePendingInDoc(doc, true);
  assert.ok(chipsOf(accepted.content).every((c) => !c.attrs.pending && !c.attrs.warn));
});
