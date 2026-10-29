// États d'une puce (rencontre inline entity : plusieurs niveaux d'erreur) :
// chipIssues dérive les états des attrs ; le checkout les reprend et bloque
// la complétion d'un document tant qu'un item est incomplet.
// Lancer : node --test project/tests/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPrototype, doc, H2 } from './harness.mjs';

const w = loadPrototype(['note-ui/note-sections.jsx', 'note-ui/diagnostics.jsx', 'note-ui/editor-data.jsx', 'note-ui/editor-schema.jsx']);
const item = (kind, test) => w.NOTE_DATA.ORDER_DEFS[kind].items().find(test);
const attrsFor = (kind, it) => w.orderChipAttrs(kind, it);
const kinds = (issues) => issues.map((i) => i.kind);
// Ce que la puce écrit pour « 1 comprimé » et « 7 jours » dans la langue de la suite.
const tablet = w.RX_TEXT.qtyLabel({ form: 'comprimé' });
const days7 = w.RX_TEXT.durationShort({ duration: '7', durationUnit: 'jours' });

test('une prescription complète n’a aucun état', () => {
  const a = attrsFor('rx', item('rx', (it) => it.key === 'vento100'));
  assert.deepEqual(w.chipIssues(a), []);
});

test('allergie au dossier : erreur non bloquante sur l’ordonnance, jamais sur un renouvellement', () => {
  const a = attrsFor('rx', item('rx', (it) => it.key === 'amox500'));
  const issues = w.chipIssues(a);
  assert.deepEqual(kinds(issues), ['allergy']);
  assert.equal(issues[0].blocking, undefined);
  assert.equal(issues[0].message, w.t('schema.allergy.text', { name: w.L('Pénicilline') }));
  assert.deepEqual(w.chipIssues(Object.assign({}, a, { rx: Object.assign({}, a.rx, { renewal: true }) })), []);
  const before = w.NOTE_DATA.getPatientAllergies();
  try {
    w.NOTE_DATA.setPatientAllergies([]);
    assert.deepEqual(w.chipIssues(a), [], 'sans allergie au dossier');
  } finally { w.NOTE_DATA.setPatientAllergies(before); }
});

test('sans fréquence : incomplète, bloquante, et le message nomme le champ', () => {
  const a = attrsFor('rx', item('rx', (it) => it.name === w.TR('Warfarine')));
  const issues = w.chipIssues(a);
  assert.deepEqual(kinds(issues), ['incomplete']);
  assert.equal(issues[0].blocking, true);
  assert.equal(issues[0].level, 'error');
  assert.match(issues[0].message, new RegExp(w.t('schema.frequency.word')));
});

test('un renouvellement vide vaut R0 : pas « incomplète »', () => {
  const a = attrsFor('rx', item('rx', (it) => it.name === w.TR('Atorvastatine')));
  assert.equal(a.details.refills, '');
  assert.deepEqual(w.chipIssues(a), []);
});

test('interaction simulée : erreur non bloquante', () => {
  const a = attrsFor('rx', item('rx', (it) => it.name === w.TR('Ciprofloxacine')));
  const issues = w.chipIssues(a);
  assert.deepEqual(kinds(issues), ['interaction']);
  assert.equal(issues[0].blocking, undefined);
  assert.equal(issues[0].message, a.details.alert.message);
});

test('référence : « à faire » tant qu’un prérequis CRDS requis manque', () => {
  // Une spécialité sans raison n'a pas de prérequis.
  assert.deepEqual(w.chipIssues(attrsFor('ref', item('ref', (it) => it.key === 'cardio'))), []);
  const D = w.NOTE_DATA;
  const a = attrsFor('ref', D.crdsRefItem(D.crdsReason('neuro-24')));
  assert.deepEqual(w.chipIssues(a).map((i) => [i.kind, i.level]), [['prereq', 'warning']]);
  a.details = Object.assign({}, a.details, { prereqs: { triptan: ['sumatriptan'], prophylaxie: ['candesartan', 'topiramate'] } });
  assert.deepEqual(w.chipIssues(a), []);
});

test('transmise : ne garde que l’échec de transmission ; annulée : rien', () => {
  const a = attrsFor('rx', item('rx', (it) => it.name === w.TR('Warfarine')));
  assert.deepEqual(w.chipIssues(Object.assign({}, a, { transmittedAt: '2026-09-29T14:00:00Z' })), []);
  assert.deepEqual(kinds(w.chipIssues(Object.assign({}, a, { transmitError: 'envoi non reçu' }))), ['transmission', 'incomplete']);
  assert.deepEqual(w.chipIssues(Object.assign({}, a, { transmittedAt: '2026-09-29T14:00:00Z', cancelledAt: '2026-09-29T15:00:00Z' })), []);
});

test('une prescription cessée n’est jamais « incomplète »', () => {
  const a = attrsFor('rx', item('rx', (it) => it.name === w.TR('Warfarine')));
  a.rx = Object.assign({}, a.rx, { ceased: true });
  a.details = {};
  assert.deepEqual(w.chipIssues(a), []);
});

test('checkout : l’ordonnance porte le message bloquant de son item incomplet, les items leurs états', () => {
  const ok = { type: 'chip', attrs: attrsFor('rx', item('rx', (it) => it.key === 'vento100')) };
  const incomplete = { type: 'chip', attrs: attrsFor('rx', item('rx', (it) => it.name === w.TR('Warfarine'))) };
  const d = doc(H2(w.TR('Conclusion')), { type: 'paragraph', content: [ok, incomplete] });
  const rx = w.buildTransmissionDocs(w.scanDoc(d), {}).find((x) => x.id === 'rx');
  assert.equal(rx.blocking.length, 1);
  assert.match(rx.blocking[0], new RegExp(w.L('Warfarine') + '.*' + w.t('schema.frequency.word')));
  assert.deepEqual(rx.items.map((it) => kinds(it.issues)), [[], ['incomplete']]);
  const alone = w.buildTransmissionDocs(w.scanDoc(doc(H2(w.TR('Conclusion')), { type: 'paragraph', content: [ok] })), {}).find((x) => x.id === 'rx');
  assert.deepEqual(alone.blocking, []);
});

// --- Lot 1 « Prescription inline » : valeurs manquantes dans la puce ---

test('incomplète : chipIssues liste les champs vides, dans l’ordre de la puce', () => {
  const a = attrsFor('rx', item('rx', (it) => it.name === w.TR('Warfarine')));
  const incomplete = w.chipIssues(a).find((i) => i.kind === 'incomplete');
  assert.deepEqual(incomplete.missing, [{ field: 'frequency', word: w.TR('fréquence'), label: w.TR('Fréquence') }]);
  const none = Object.assign({}, a, { details: Object.assign({}, a.details, { dose: '', route: '', frequency: '' }) });
  assert.deepEqual(w.chipIssues(none).find((i) => i.kind === 'incomplete').missing.map((m) => m.field), ['dose', 'route', 'frequency']);
  assert.match(w.chipIssues(none)[0].message, new RegExp(['dose', 'route', 'frequency'].map((k) => w.t('schema.' + k + '.word')).join(', ')));
});

test('segments : un champ requis vide est un espace réservé à sa place, pas un trou', () => {
  const d = { form: 'comprimé', route: 'PO', frequency: '', quantity: '21', duration: '7', durationUnit: 'jours', refills: '' };
  const missing = [{ field: 'frequency', word: w.TR('fréquence'), label: w.TR('Fréquence') }];
  assert.deepEqual(w.rxChipSegments(d, missing).map((s) => s.text), [tablet, 'PO', w.TR('Fréquence'), '#21', days7, 'R0']);
  assert.deepEqual(w.rxChipSegments(d, missing).filter((s) => s.missing).map((s) => s.field), ['frequency']);
  // Rien de manquant : aucun espace réservé, rendu inchangé.
  assert.deepEqual(w.rxChipSegments(Object.assign({}, d, { frequency: 'TID' }), []).map((s) => s.text), [tablet, 'PO', 'TID', '#21', days7, 'R0']);
});

test('segments : route et fréquence vides ensemble, ordre voie puis fréquence', () => {
  const missing = [{ field: 'route', word: 'voie', label: w.TR('Voie') }, { field: 'frequency', word: w.TR('fréquence'), label: w.TR('Fréquence') }];
  const segs = w.rxChipSegments({ form: 'capsule', refills: '2' }, missing);
  assert.deepEqual(segs.map((s) => s.text), [w.RX_TEXT.qtyLabel({ form: 'capsule' }), w.TR('Voie'), w.TR('Fréquence'), 'R2']);
  assert.deepEqual(segs.map((s) => s.field), ['form', 'route', 'frequency', 'refills']);
});

test('segments : le renouvellement vide vaut R0 et n’est jamais un espace réservé (Q-12)', () => {
  const segs = w.rxChipSegments({ form: 'comprimé', route: 'PO', frequency: 'DIE', refills: '' }, []);
  const last = segs[segs.length - 1];
  assert.equal(last.text, 'R0');
  assert.equal(last.missing, undefined);
});

test('segments : PRN ajouté à la fréquence sans doublon ; sans forme ni fréquence, pas de « 1 dose » trompeur', () => {
  assert.equal(w.rxChipSegments({ form: 'comprimé', route: 'PO', frequency: 'DIE', prn: true }, []).find((s) => s.field === 'frequency').text, 'DIE PRN');
  assert.equal(w.rxChipSegments({ form: 'comprimé', route: 'PO', frequency: 'q4-6h PRN', prn: true }, []).find((s) => s.field === 'frequency').text, 'q4-6h PRN');
  assert.deepEqual(w.rxChipSegments({ route: 'PO' }, []).map((s) => s.text), ['PO', 'R0']);
});

// --- Lot 2 « Prescription inline » : badges de statut de la puce ---

const badgeKinds = (a) => w.chipStatusBadges(a).map((b) => b.kind);
const withRx = (a, rx) => Object.assign({}, a, { rx: Object.assign({}, a.rx, rx) });

test('statuts : une nouvelle prescription complète n’a aucun badge', () => {
  assert.deepEqual(w.chipStatusBadges(attrsFor('rx', item('rx', (it) => it.key === 'amox500'))), []);
});

test('statuts : cesser (texte) et renouveler (icône seule, nom accessible), jamais les deux', () => {
  const a = attrsFor('rx', item('rx', (it) => it.key === 'amox500'));
  const ceased = w.chipStatusBadges(withRx(a, { ceased: true }));
  assert.deepEqual(ceased.map((b) => [b.kind, b.text]), [['ceased', w.TR('Cesser')]]);
  const renewal = w.chipStatusBadges(withRx(a, { renewal: true }));
  assert.deepEqual(renewal.map((b) => [b.kind, b.icon, b.text, b.title]), [['renewal', 'autorenew', undefined, w.TR('Renouvellement')]]);
  assert.deepEqual(badgeKinds(withRx(a, { renewal: true, ceased: true })), ['ceased']);
});

test('statuts : l’ordre est cesser / renouveler, incomplet, en suspens', () => {
  const a = attrsFor('rx', item('rx', (it) => it.name === w.TR('Warfarine'))); // sans fréquence : incomplète
  assert.deepEqual(badgeKinds(a), ['incomplete']);
  assert.deepEqual(badgeKinds(withRx(a, { renewal: true })), ['renewal', 'incomplete']);
  assert.deepEqual(badgeKinds(Object.assign({}, withRx(a, { renewal: true }), { pending: true })), ['renewal', 'incomplete', 'pending']);
});

test('statuts : en suspens sur une suggestion de n’importe quel type, avec son auteur dans l’infobulle', () => {
  const lab = Object.assign({}, attrsFor('lab', item('lab', (it) => it.key === 'fsc')), { pending: true, proposedBy: 'Gabarit' });
  const badges = w.chipStatusBadges(lab);
  assert.deepEqual(badges.map((b) => [b.kind, b.text]), [['pending', w.TR('En suspens')]]);
  assert.equal(badges[0].title, w.t('schema.proposedBy.tooltip', { who: 'Gabarit' }));
  assert.equal(w.chipStatusBadges(Object.assign({}, lab, { proposedBy: undefined }))[0].title, w.t('schema.proposed.tooltip'));
});

test('statuts : une puce annulée n’a pas de badge ici (« Annulée » vient de la puce transmise)', () => {
  const a = Object.assign({}, withRx(attrsFor('rx', item('rx', (it) => it.name === w.TR('Warfarine'))), { renewal: true }), { pending: true, cancelledAt: '2026-10-15T10:00:00Z' });
  assert.deepEqual(w.chipStatusBadges(a), []);
});

test('statuts : une cessée n’est jamais « incomplète » et garde son seul badge « Cesser »', () => {
  const a = withRx(attrsFor('rx', item('rx', (it) => it.name === w.TR('Warfarine'))), { ceased: true });
  a.details = {};
  assert.deepEqual(badgeKinds(a), ['ceased']);
});
