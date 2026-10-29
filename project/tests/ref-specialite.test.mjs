// Référence en spécialité, lot 2 de PLAN-reference-specialite.md : section
// « Céphalée », raisons suggérées selon le diagnostic et l'âge, prérequis
// structurés de la migraine et prérequis par type des autres raisons.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPrototype } from './harness.mjs';

const files = ['note-ui/editor-data.jsx'];
const migraine = { name: 'Migraine sans aura', code: 'G43.0' };
const tout = (r) => r.labSections.map((s) => ({ key: s.key, title: s.title, ids: s.items.map((it) => it.crds || it.key) }));

test('les céphalées de Neurologie sont rangées sous « Céphalée », marquée comme un ajout', () => {
  const D = loadPrototype(files).NOTE_DATA;
  ['neuro-24', 'neuro-25', 'neuro-26', 'neuro-27'].forEach((id) => {
    const r = D.crdsReason(id);
    assert.deepEqual(r.path, ['Céphalée'], id);
    assert.equal(D.crdsSection(r), 'Céphalée');
  });
  assert.equal(D.crdsSection(D.crdsReason('cardio-6')), 'Troubles du rythme');
  const raw = loadPrototype(files).CRDS_DATA.specialties.find((s) => s.key === 'neuro').reasons.find((r) => r.id === 'neuro-24');
  assert.equal(raw.added, true);
});

test('adulte : /ref sous une migraine suggère d’abord les céphalées de Neurologie', () => {
  const w = loadPrototype(files, { patient: 'adulte' });
  const D = w.NOTE_DATA;
  D.endOrderSearch();
  const head = tout(D.searchOrder('ref', '', migraine))[0];
  assert.equal(head.key, 'suggeres');
  assert.equal(head.title, w.TR('Suggérés pour {dx}', { dx: 'Migraine sans aura' }));
  assert.deepEqual(head.ids, ['neuro-24', 'neuro-25', 'neuro-26', 'neuro-27']);
});

test('15 ans : la même migraine suggère la Pédiatrie générale › Céphalée', () => {
  const D = loadPrototype(files).NOTE_DATA;
  D.endOrderSearch();
  const head = tout(D.searchOrder('ref', '', migraine))[0];
  assert.deepEqual(head.ids, ['pedia-12', 'pedia-11', 'pedia-13']);
});

test('sans diagnostic, ou avec une recherche, pas de suggestions', () => {
  const D = loadPrototype(files, { patient: 'adulte' }).NOTE_DATA;
  D.endOrderSearch();
  assert.ok(!tout(D.searchOrder('ref', '')).some((s) => s.key === 'suggeres'));
  assert.ok(!tout(D.searchOrder('ref', 'migr', migraine)).some((s) => s.key === 'suggeres'));
});

test('migraine adulte : médicaments essayés cochés d’après le profil, 2 prophylaxies requises', () => {
  const D = loadPrototype(files, { patient: 'adulte' }).NOTE_DATA;
  const fields = D.crdsPrereqs('neuro-24');
  assert.deepEqual(fields.map((f) => [f.key, f.kind, f.min]), [['triptan', 'choices', 1], ['prophylaxie', 'choices', 2]]);
  assert.equal(fields[0].options.length, 7);
  assert.equal(fields[1].options.length, 5);
  const details = D.crdsRefDetails(D.crdsReason('neuro-24'));
  assert.deepEqual(details.prereqs, { triptan: ['almotriptan'], prophylaxie: ['candesartan'] });
  // Comme dans le Figma : une seule prophylaxie au profil, la référence est « à faire ».
  assert.deepEqual(D.crdsPrereqMissing('neuro-24', details.prereqs).map((f) => f.key), ['prophylaxie']);
  assert.deepEqual(D.crdsPrereqMissing('neuro-24', { triptan: ['almotriptan'], prophylaxie: ['candesartan', 'topiramate'] }), []);
});

test('migraine pédiatrique : prérequis par type, courbes jointes d’office, calendrier à joindre', () => {
  const D = loadPrototype(files).NOTE_DATA;
  const fields = D.crdsPrereqs('pedia-12');
  assert.deepEqual(fields.map((f) => f.kind), ['attach', 'auto']);
  assert.equal(fields[1].source, 'dossier');
  const vals = D.crdsRefDetails(D.crdsReason('pedia-12')).prereqs;
  assert.deepEqual(D.crdsPrereqMissing('pedia-12', vals).map((f) => f.label), ['Calendrier des symptômes']);
  assert.deepEqual(D.crdsPrereqMissing('pedia-12', Object.assign({}, vals, { doc0: true })), []);
});

test('raison à justifier : un texte à inscrire, requis', () => {
  const D = loadPrototype(files, { patient: 'adulte' }).NOTE_DATA;
  const [f] = D.crdsPrereqs('neuro-25');
  assert.equal(f.kind, 'text');
  assert.equal(D.crdsPrereqMissing('neuro-25', { [f.key]: '  ' }).length, 1);
  assert.equal(D.crdsPrereqMissing('neuro-25', { [f.key]: 'Larmoiement, rhinorrhée' }).length, 0);
});
