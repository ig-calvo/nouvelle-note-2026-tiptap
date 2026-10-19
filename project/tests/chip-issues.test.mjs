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

test('une prescription complète n’a aucun état', () => {
  const a = attrsFor('rx', item('rx', (it) => it.key === 'amox500'));
  assert.deepEqual(w.chipIssues(a), []);
});

test('sans fréquence : incomplète, bloquante, et le message nomme le champ', () => {
  const a = attrsFor('rx', item('rx', (it) => it.name === 'Warfarine'));
  const issues = w.chipIssues(a);
  assert.deepEqual(kinds(issues), ['incomplete']);
  assert.equal(issues[0].blocking, true);
  assert.equal(issues[0].level, 'error');
  assert.match(issues[0].message, /fréquence/);
});

test('un renouvellement vide vaut R0 : pas « incomplète »', () => {
  const a = attrsFor('rx', item('rx', (it) => it.name === 'Atorvastatine'));
  assert.equal(a.details.refills, '');
  assert.deepEqual(w.chipIssues(a), []);
});

test('interaction simulée : erreur non bloquante', () => {
  const a = attrsFor('rx', item('rx', (it) => it.name === 'Ciprofloxacine'));
  const issues = w.chipIssues(a);
  assert.deepEqual(kinds(issues), ['interaction']);
  assert.equal(issues[0].blocking, undefined);
  assert.match(issues[0].message, /simulé/);
});

test('référence sans question clinique : avertissement', () => {
  const a = attrsFor('ref', item('ref', (it) => it.key === 'cardio'));
  assert.deepEqual(w.chipIssues(a).map((i) => [i.kind, i.level]), [['missing-info', 'warning']]);
  a.details = Object.assign({}, a.details, { question: 'Souffle systolique à évaluer' });
  assert.deepEqual(w.chipIssues(a), []);
});

test('transmise : ne garde que l’échec de transmission ; annulée : rien', () => {
  const a = attrsFor('rx', item('rx', (it) => it.name === 'Warfarine'));
  assert.deepEqual(w.chipIssues(Object.assign({}, a, { transmittedAt: '2026-09-29T14:00:00Z' })), []);
  assert.deepEqual(kinds(w.chipIssues(Object.assign({}, a, { transmitError: 'envoi non reçu' }))), ['transmission', 'incomplete']);
  assert.deepEqual(w.chipIssues(Object.assign({}, a, { transmittedAt: '2026-09-29T14:00:00Z', cancelledAt: '2026-09-29T15:00:00Z' })), []);
});

test('une prescription cessée n’est jamais « incomplète »', () => {
  const a = attrsFor('rx', item('rx', (it) => it.name === 'Warfarine'));
  a.rx = Object.assign({}, a.rx, { ceased: true });
  a.details = {};
  assert.deepEqual(w.chipIssues(a), []);
});

test('checkout : l’ordonnance porte le message bloquant de son item incomplet, les items leurs états', () => {
  const ok = { type: 'chip', attrs: attrsFor('rx', item('rx', (it) => it.key === 'amox500')) };
  const incomplete = { type: 'chip', attrs: attrsFor('rx', item('rx', (it) => it.name === 'Warfarine')) };
  const d = doc(H2('Conclusion'), { type: 'paragraph', content: [ok, incomplete] });
  const rx = w.buildTransmissionDocs(w.scanDoc(d), {}).find((x) => x.id === 'rx');
  assert.equal(rx.blocking.length, 1);
  assert.match(rx.blocking[0], /Warfarine.*fréquence/);
  assert.deepEqual(rx.items.map((it) => kinds(it.issues)), [[], ['incomplete']]);
  const alone = w.buildTransmissionDocs(w.scanDoc(doc(H2('Conclusion'), { type: 'paragraph', content: [ok] })), {}).find((x) => x.id === 'rx');
  assert.deepEqual(alone.blocking, []);
});

// --- Lot 1 « Prescription inline » : valeurs manquantes dans la puce ---

test('incomplète : chipIssues liste les champs vides, dans l’ordre de la puce', () => {
  const a = attrsFor('rx', item('rx', (it) => it.name === 'Warfarine'));
  const incomplete = w.chipIssues(a).find((i) => i.kind === 'incomplete');
  assert.deepEqual(incomplete.missing, [{ field: 'frequency', word: 'fréquence', label: 'Fréquence' }]);
  const none = Object.assign({}, a, { details: Object.assign({}, a.details, { dose: '', route: '', frequency: '' }) });
  assert.deepEqual(w.chipIssues(none).find((i) => i.kind === 'incomplete').missing.map((m) => m.field), ['dose', 'route', 'frequency']);
  assert.match(w.chipIssues(none)[0].message, /dose, voie, fréquence/);
});

test('segments : un champ requis vide est un espace réservé à sa place, pas un trou', () => {
  const d = { form: 'comprimé', route: 'PO', frequency: '', quantity: '21', duration: '7', durationUnit: 'jours', refills: '' };
  const missing = [{ field: 'frequency', word: 'fréquence', label: 'Fréquence' }];
  assert.deepEqual(w.rxChipSegments(d, missing).map((s) => s.text), ['1 comp.', 'PO', 'Fréquence', '#21', '7j', 'R0']);
  assert.deepEqual(w.rxChipSegments(d, missing).filter((s) => s.missing).map((s) => s.field), ['frequency']);
  // Rien de manquant : aucun espace réservé, rendu inchangé.
  assert.deepEqual(w.rxChipSegments(Object.assign({}, d, { frequency: 'TID' }), []).map((s) => s.text), ['1 comp.', 'PO', 'TID', '#21', '7j', 'R0']);
});

test('segments : route et fréquence vides ensemble, ordre voie puis fréquence', () => {
  const missing = [{ field: 'route', word: 'voie', label: 'Voie' }, { field: 'frequency', word: 'fréquence', label: 'Fréquence' }];
  const segs = w.rxChipSegments({ form: 'capsule', refills: '2' }, missing);
  assert.deepEqual(segs.map((s) => s.text), ['1 caps.', 'Voie', 'Fréquence', 'R2']);
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
  assert.deepEqual(ceased.map((b) => [b.kind, b.text]), [['ceased', 'Cesser']]);
  const renewal = w.chipStatusBadges(withRx(a, { renewal: true }));
  assert.deepEqual(renewal.map((b) => [b.kind, b.icon, b.text, b.title]), [['renewal', 'autorenew', undefined, 'Renouvellement']]);
  assert.deepEqual(badgeKinds(withRx(a, { renewal: true, ceased: true })), ['ceased']);
});

test('statuts : l’ordre est cesser / renouveler, incomplet, en suspens', () => {
  const a = attrsFor('rx', item('rx', (it) => it.name === 'Warfarine')); // sans fréquence : incomplète
  assert.deepEqual(badgeKinds(a), ['incomplete']);
  assert.deepEqual(badgeKinds(withRx(a, { renewal: true })), ['renewal', 'incomplete']);
  assert.deepEqual(badgeKinds(Object.assign({}, withRx(a, { renewal: true }), { pending: true })), ['renewal', 'incomplete', 'pending']);
});

test('statuts : en suspens sur une suggestion de n’importe quel type, avec son auteur dans l’infobulle', () => {
  const lab = Object.assign({}, attrsFor('lab', item('lab', (it) => it.key === 'fsc')), { pending: true, proposedBy: 'Gabarit' });
  const badges = w.chipStatusBadges(lab);
  assert.deepEqual(badges.map((b) => [b.kind, b.text]), [['pending', 'En suspens']]);
  assert.match(badges[0].title, /Proposé par Gabarit/);
  assert.match(w.chipStatusBadges(Object.assign({}, lab, { proposedBy: undefined }))[0].title, /Ajout proposé/);
});

test('statuts : une puce annulée n’a pas de badge ici (« Annulée » vient de la puce transmise)', () => {
  const a = Object.assign({}, withRx(attrsFor('rx', item('rx', (it) => it.name === 'Warfarine')), { renewal: true }), { pending: true, cancelledAt: '2026-10-15T10:00:00Z' });
  assert.deepEqual(w.chipStatusBadges(a), []);
});

test('statuts : une cessée n’est jamais « incomplète » et garde son seul badge « Cesser »', () => {
  const a = withRx(attrsFor('rx', item('rx', (it) => it.name === 'Warfarine')), { ceased: true });
  a.details = {};
  assert.deepEqual(badgeKinds(a), ['ceased']);
});
