// Copier-coller d'une entité (lot 4 de PLAN-gabarits-vision-v1.md, D3 de la
// vision, RA-53) : ce que devient une puce collée selon sa provenance. Ici, la
// règle sans éditeur (planChipPaste) et ce que le reste du modèle en lit ; le
// plugin qui l'applique au collage (transformPasted) se vérifie dans le
// navigateur.
// Lancer : node --test project/tests/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPrototype, doc } from './harness.mjs';

const w = loadPrototype(['note-ui/note-sections.jsx', 'note-ui/diagnostics.jsx', 'note-ui/editor-data.jsx', 'note-ui/paste-entities.jsx', 'note-ui/editor-schema.jsx']);

const NOTE = 'note-A';
const ctxFor = (used = ['c1', 'c2'], over = {}) => {
  const taken = new Set(used);
  let seq = 100;
  return Object.assign({
    patient: 'pediatrique', note: NOTE,
    hasCid: (cid) => taken.has(cid),
    newCid: () => { let c; do { c = 'n' + seq++; } while (taken.has(c)); taken.add(c); return c; },
    patientName: (key) => ({ pediatrique: 'Geneviève Tremblay', adulte: 'Micheline Lamontagne' })[key] || null
  }, over);
};
// Les attrs d'une ordonnance telle que parseHTML les rend (le reste est perdu).
const rx = (over = {}) => Object.assign({
  cid: 'c1', type: 'prescription', label: 'Amoxicilline 500mg', icon: 'medication', text: 'Amoxicilline 500mg',
  rx: { name: 'Amoxicilline', dose: '500mg', sig: '1 comp. PO TID', kind: 'rx', renewal: true, adjust: 'up', adjustFrom: '250mg' },
  details: { dose: '500 mg', route: 'PO', frequency: 'TID' },
  origin: { patient: 'pediatrique', note: NOTE, pending: false }, ref: null
}, over);

test('même note, la puce d’origine y est encore : une mention, même référence, identité à elle', () => {
  const p = w.planChipPaste(rx(), ctxFor());
  assert.equal(p.how, 'mention');
  assert.equal(p.attrs.ref, 'c1', 'même référence que la puce copiée');
  assert.notEqual(p.attrs.cid, 'c1', 'jamais deux cid identiques');
  assert.equal(p.attrs.origin, null);
  assert.ok(!p.attrs.pending, 'une mention n’est pas une proposition');
  assert.deepEqual(p.attrs.details, rx().details, 'elle garde ses valeurs');
});

test('copier une mention : la copie renvoie à la puce d’origine, pas à la mention', () => {
  const p = w.planChipPaste(rx({ cid: 'c5', ref: 'c1' }), ctxFor(['c1', 'c5']));
  assert.equal(p.how, 'mention');
  assert.equal(p.attrs.ref, 'c1');
});

test('couper-coller dans la même note : la puce se déplace, identité gardée', () => {
  const p = w.planChipPaste(rx(), ctxFor(['c2']));
  assert.equal(p.how, 'keep');
  assert.equal(p.attrs.cid, 'c1');
  assert.equal(p.attrs.ref, null);
  assert.equal(p.attrs.origin, null);
});

test('autre note du même patient : une pré-entité préremplie, sans le lien d’origine, à accepter', () => {
  const p = w.planChipPaste(rx({ origin: { patient: 'pediatrique', note: 'autre-note', pending: false } }), ctxFor());
  assert.equal(p.how, 'preEntity');
  const a = p.attrs;
  assert.equal(a.pending, true, 'elle attend d’être acceptée');
  assert.equal(a.proposedBy, w.t('paste.copy.note.text'));
  assert.equal(a.copyOf, 'note');
  assert.notEqual(a.cid, 'c1', 'identité neuve');
  assert.equal(a.ref, null);
  assert.equal(a.rx.renewal, false, 'plus un renouvellement d’une médication du dossier');
  assert.ok(!('adjust' in a.rx) && !('adjustFrom' in a.rx), 'ni un ajustement');
  assert.deepEqual(a.details, rx().details, 'préremplie : les valeurs restent');
  assert.equal(a.transmittedAt, null);
  assert.equal(a.draft, null);
});

test('autre patient : la pré-entité dit de quel dossier elle vient', () => {
  const p = w.planChipPaste(rx({ origin: { patient: 'adulte', note: 'x', pending: false } }), ctxFor());
  assert.equal(p.how, 'preEntity');
  assert.equal(p.attrs.proposedBy, w.t('paste.copy.patient.text', { name: 'Micheline Lamontagne' }));
  assert.equal(p.attrs.copyOf, 'patient');
});

test('le patient et la note se comparent ensemble : même note d’un autre patient n’est pas la même note', () => {
  const p = w.planChipPaste(rx({ origin: { patient: 'adulte', note: NOTE, pending: false } }), ctxFor());
  assert.equal(p.how, 'preEntity');
});

test('provenance inconnue (collé d’ailleurs) : une pré-entité aussi, jamais une entité posée d’office', () => {
  const p = w.planChipPaste(rx({ origin: null }), ctxFor());
  assert.equal(p.how, 'preEntity');
  assert.equal(p.attrs.copyOf, 'inconnu');
  assert.equal(p.attrs.proposedBy, w.t('paste.copy.unknown.text'));
});

test('un ajout proposé ou une ligne à compléter ne se copie que comme texte', () => {
  const p = w.planChipPaste(rx({ origin: { patient: 'pediatrique', note: NOTE, pending: true } }), ctxFor());
  assert.deepEqual(p, { how: 'text', text: 'Amoxicilline 500mg' });
});

test('une médication du profil hors de son dossier : du texte', () => {
  const med = rx({ type: 'medication', text: 'Tylenol 500 mg — 2 co DIE', label: 'Tylenol 500 mg', origin: { patient: 'adulte', note: 'x', pending: false } });
  assert.deepEqual(w.planChipPaste(med, ctxFor()), { how: 'text', text: 'Tylenol 500 mg — 2 co DIE' });
  // Dans sa propre note, elle suit la règle des autres puces (mention).
  assert.equal(w.planChipPaste(rx({ type: 'medication' }), ctxFor()).how, 'mention');
});

test('deux copies d’une même puce : deux identités neuves, distinctes', () => {
  const ctx = ctxFor();
  const a = w.planChipPaste(rx(), ctx).attrs.cid;
  const b = w.planChipPaste(rx(), ctx).attrs.cid;
  assert.notEqual(a, b);
  assert.ok(!['c1', 'c2'].includes(a) && !['c1', 'c2'].includes(b));
});

test('une mention n’est pas une entité de la note : ni au Sommaire, ni au journal, ni au checkout', () => {
  const chip = (cid, over = {}) => ({ type: 'chip', attrs: Object.assign({ cid, type: 'prescription', label: 'Amoxicilline 500mg', icon: 'medication', text: 'x', rx: { name: 'Amoxicilline', dose: '500mg', sig: 'TID', kind: 'rx' }, details: null, pending: false }, over) });
  const d = doc({ type: 'paragraph', content: [chip('c1'), { type: 'text', text: ' puis ' }, chip('c2', { ref: 'c1' })] });
  const s = w.scanDoc(d);
  assert.deepEqual(s.chips.map((c) => c.cid), ['c1'], 'la mention ne compte pas');
  assert.equal(s.counts.prescription, 1);
  assert.equal(s.items.length, 1);
});

test('la destination d’une mention : au dossier, rien à envoyer', () => {
  assert.equal(w.chipDestination({ type: 'prescription', ref: 'c1' }), 'dossier');
  assert.equal(w.chipDestination({ type: 'prescription' }), 'a-envoyer');
});

test('une pré-entité copiée est proposée par « Copie de … », comme source distincte', () => {
  const attrs = w.planChipPaste(rx({ origin: { patient: 'adulte', note: 'x', pending: false } }), ctxFor()).attrs;
  const [c] = w.scanProposedChanges(w.proposedDocLike(doc({ type: 'paragraph', content: [{ type: 'chip', attrs }] })));
  assert.equal(c.kind, 'entity');
  assert.equal(c.author.kind, 'copie');
  assert.equal(c.author.name, attrs.proposedBy);
  assert.equal(c.state, 'complete', 'préremplie : prête à accepter');
  const s = w.summarizeProposedChanges([c]);
  assert.deepEqual(s.sources, [attrs.proposedBy], 'la barre nomme « Copie de … »');
  assert.equal(w.proposedAuthorKind('copie'), 'copie');
});

test('une note neuve a une autre identité : une copie de l’ancienne n’y est plus une mention', () => {
  const before = w.currentNoteId();
  assert.equal(w.currentNoteId(), before, 'stable tant que la note continue');
  w.resetNoteSession();
  assert.notEqual(w.currentNoteId(), before);
});
