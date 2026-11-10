// Changement proposé (lot 1 de PLAN-gabarits-vision-v1.md) : un seul modèle
// pour le texte et les entités. Ici, la logique sans éditeur : le scan, les
// états, les résumés, le plan de résolution, la résolution d'un doc JSON.
// L'application à l'éditeur (transaction Tiptap) se vérifie dans le navigateur.
// Lancer : node --test project/tests/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPrototype, doc, P } from './harness.mjs';

const w = loadPrototype(['note-ui/note-sections.jsx', 'note-ui/diagnostics.jsx', 'note-ui/editor-data.jsx', 'note-ui/editor-schema.jsx', 'note-ui/proposed-changes.jsx']);
const tpl = (key) => w.NOTE_DATA.NOTE_TEMPLATES.find((t) => t.key === key);

const mark = (type, authorId, authorName) => ({ type, attrs: { authorId, authorName, ts: 1 } });
const ins = (text, authorId = 'gabarit', authorName = 'Gabarit « Test »') => ({ type: 'text', text, marks: [mark('insertion', authorId, authorName)] });
const del = (text, authorId = 'me') => ({ type: 'text', text, marks: [mark('deletion', authorId, 'Dr Test')] });
const txt = (text) => ({ type: 'text', text });
const para = (...content) => ({ type: 'paragraph', content });
const scan = (d) => w.scanProposedChanges(w.proposedDocLike(d));
const chipsIn = (nodes) => {
  const out = [];
  const walk = (n) => { if (n && n.type === 'chip') out.push(n); ((n && n.content) || []).forEach(walk); };
  nodes.forEach(walk);
  return out;
};
const textOf = (n) => {
  const out = [];
  const walk = (x) => { if (x && x.type === 'text') out.push(x.text); ((x && x.content) || []).forEach(walk); };
  walk(n);
  return out.join('');
};
// Une ordonnance complète, sans conflit d'allergie.
const completeRx = (cid) => {
  const c = w.buildPendingChipNode({ kind: 'rx', key: 'amox500' }, 'Gabarit « Test »');
  return Object.assign({}, c, { attrs: Object.assign({}, c.attrs, { cid, details: Object.assign({ dose: '500 mg', route: 'PO', frequency: 'TID' }, c.attrs.details) }) });
};
const incompleteRx = (cid) => {
  const c = completeRx(cid);
  return Object.assign({}, c, { attrs: Object.assign({}, c.attrs, { details: Object.assign({}, c.attrs.details, { frequency: '' }) }) });
};
const draftLine = (cid) => {
  w.__TEMPLATE_DRAFT_LINES = true;
  try { return Object.assign({}, w.buildDraftChipNode({ kind: 'rx', key: 'amox500' }, 'Gabarit « Test »'), {}); } finally { delete w.__TEMPLATE_DRAFT_LINES; }
};

test('le scan range le texte et les entités dans un seul fil, dans l’ordre du document', () => {
  const d = doc(para(txt('Plan : '), completeRx('a'), txt(' '), ins('Revoir dans 7 jours.')), para(del('Ancien texte'), txt(' reste')));
  const cs = scan(d);
  assert.deepEqual(cs.map((c) => c.kind), ['entity', 'insertion', 'deletion']);
  assert.deepEqual(cs.map((c) => c.author.kind), ['gabarit', 'gabarit', 'medecin']);
  assert.ok(cs[0].from < cs[1].from && cs[1].from < cs[2].from);
  assert.equal(cs[1].text, 'Revoir dans 7 jours.');
  assert.equal(cs[2].authorName, 'Dr Test');
});

test('un passage contigu du même auteur est un seul changement ; un autre auteur en est un autre', () => {
  const d = doc(para(ins('Un '), ins('texte'), ins(' de l’IA', 'ai', 'Assistant IA')));
  const cs = scan(d);
  assert.equal(cs.length, 2);
  assert.equal(cs[0].text, 'Un texte');
  assert.equal(cs[1].author.kind, 'ia');
});

test('états d’une entité : ligne à compléter, préremplie incomplète, complète', () => {
  const d = doc(para(draftLine('d'), txt(' '), incompleteRx('i'), txt(' '), completeRx('c')));
  const cs = scan(d);
  assert.deepEqual(cs.map((c) => c.state), ['draft', 'incomplete', 'complete']);
  assert.deepEqual(cs.map((c) => c.canAccept), [false, true, true], 'une ligne à compléter ne s’accepte pas');
  assert.deepEqual(cs.map((c) => c.acceptable), [false, false, true], '« Tout accepter » ne prend que les complètes');
});

test('une entité déjà acceptée n’est pas un changement proposé', () => {
  const c = completeRx('x');
  const accepted = Object.assign({}, c, { attrs: Object.assign({}, c.attrs, { pending: false }) });
  assert.equal(scan(doc(para(accepted))).length, 0);
});

test('l’auteur d’une entité vient de proposedBy : l’Assistant IA, sinon le gabarit', () => {
  const ai = w.buildPendingChipNode({ kind: 'rx', key: 'amox500' }, w.t('ai.assistant.name'));
  const cs = scan(doc(para(ai, txt(' '), completeRx('g'))));
  assert.deepEqual(cs.map((c) => c.author.kind), ['ia', 'gabarit']);
  assert.equal(cs[0].author.name, w.t('ai.assistant.name'));
});

test('le résumé compte par état et garde la forme de l’ancien pendingSummary', () => {
  const d = doc(para(draftLine('d'), txt(' '), incompleteRx('i'), txt(' '), completeRx('c'), txt(' '), ins('Du texte.'), txt(' '), del('Retiré')));
  const s = w.summarizeProposedChanges(scan(d));
  assert.equal(s.total, 5);
  assert.equal(s.entities, 3);
  assert.equal(s.text, 2);
  assert.deepEqual([s.draft, s.incomplete, s.complete], [1, 1, 1]);
  assert.equal(s.unfinished, 2);
  assert.equal(s.acceptable, 3, 'la complète et les deux textes');
  assert.deepEqual([s.count, s.chips, s.paragraphs, s.drafts], [5, 3, 2, 1]);
  assert.ok(s.sources.includes('Gabarit « Test »') && s.sources.includes('Dr Test'));
});

test('un gabarit est une seule source : ses puces le nomment, son texte « Gabarit » ne compte pas en plus', () => {
  const d = doc(para(ins('Texte du gabarit.', 'gabarit', 'Gabarit'), txt(' '), completeRx('c')), para(del('Retiré')));
  assert.deepEqual(w.summarizeProposedChanges(scan(d)).sources, ['Gabarit « Test »', 'Dr Test']);
  // Sans puce, le texte se signe lui-même.
  assert.deepEqual(w.summarizeProposedChanges(scan(doc(para(ins('Seul.', 'gabarit', 'Gabarit'))))).sources, ['Gabarit']);
});

test('pendingSummary lit le même modèle : le texte d’un gabarit et les puces comptent ensemble', () => {
  const d = doc(para(ins('Texte du gabarit.'), txt(' '), completeRx('c')));
  const s = w.pendingSummary(d);
  assert.equal(s.count, 2);
  assert.equal(s.chips, 1);
  assert.equal(s.paragraphs, 1);
});

test('la liste courte ne nomme que les entités complètes, et signale un conflit d’allergie', () => {
  const d = doc(para(draftLine('d'), txt(' '), incompleteRx('i'), txt(' '), completeRx('c'), txt(' '), ins('Du texte.')));
  const list = w.proposedShortList(scan(d));
  assert.equal(list.length, 1);
  assert.equal(list[0].label, completeRx('c').attrs.label);
  assert.equal(typeof list[0].conflict, 'boolean');
  // La patiente de démo est allergique à la pénicilline : l'amoxicilline le dit.
  assert.deepEqual(w.chipIssues(completeRx('c').attrs).map((i) => i.kind), ['allergy']);
  assert.equal(list[0].conflict, true);
});

test('plan « Tout accepter » : le texte et les complètes ; l’incomplète et la ligne à compléter restent', () => {
  const d = doc(para(draftLine('d'), txt(' '), incompleteRx('i'), txt(' '), completeRx('c'), txt(' '), ins('Du texte.'), txt(' '), del('Retiré')));
  const ops = w.planProposedResolution(scan(d), true, { all: true });
  assert.deepEqual(ops.map((o) => o.op).sort(), ['accept', 'delete', 'unmark']);
  const cs = scan(d);
  const retire = cs.find((c) => c.kind === 'deletion');
  assert.deepEqual(ops.find((o) => o.op === 'delete'), { op: 'delete', from: retire.from, to: retire.to }, 'accepter une suppression retire le texte');
  assert.equal(ops.find((o) => o.op === 'unmark').mark, 'insertion', 'accepter une insertion en retire la marque');
  assert.equal(ops.find((o) => o.op === 'accept').from, cs.find((c) => c.state === 'complete').from);
});

test('plan « Tout accepter et finaliser » : ce qui n’est pas accepté est retiré (Q8)', () => {
  const d = doc(para(draftLine('d'), txt(' '), incompleteRx('i'), txt(' '), completeRx('c')));
  const ops = w.planProposedResolution(scan(d), true, { all: true, dropRest: true });
  assert.deepEqual(ops.map((o) => o.op).sort(), ['accept', 'deleteEntity', 'deleteEntity']);
});

test('plan « Tout refuser » : tout part ; une suppression refusée garde son texte', () => {
  const d = doc(para(completeRx('c'), txt(' '), ins('Du texte.'), txt(' '), del('Gardé')));
  const ops = w.planProposedResolution(scan(d), false);
  assert.deepEqual(ops.map((o) => o.op).sort(), ['delete', 'deleteEntity', 'unmark']);
  assert.equal(ops.find((o) => o.op === 'unmark').mark, 'deletion');
});

test('plan d’un changement à la pièce : accepter une incomplète est permis, une ligne à compléter non', () => {
  const d = doc(para(draftLine('d'), txt(' '), incompleteRx('i')));
  const [draft, incomplete] = scan(d);
  assert.deepEqual(w.planProposedResolution([draft], true), []);
  assert.deepEqual(w.planProposedResolution([incomplete], true).map((o) => o.op), ['accept']);
  assert.deepEqual(w.planProposedResolution([draft], false).map((o) => o.op), ['deleteEntity'], 'la refuser la retire');
});

test('plan dans une plage : seulement ce qui s’y trouve', () => {
  const d = doc(para(completeRx('a')), para(completeRx('b')));
  const cs = scan(d);
  const ops = w.planProposedResolution(cs, true, { all: true, range: { from: cs[1].from - 1, to: cs[1].to + 1 } });
  assert.deepEqual(ops.map((o) => o.from), [cs[1].from]);
});

test('applyProposedOps : une transaction, positions décroissantes, marquée reviewAction', () => {
  const calls = [];
  const tr = {
    setMeta: (k, v) => calls.push(['meta', k, v]),
    delete: (a, b) => calls.push(['delete', a, b]),
    removeMark: (a, b, m) => calls.push(['unmark', a, b, m]),
    setNodeMarkup: (p, _t, attrs) => calls.push(['accept', p, attrs.pending, attrs.savedAt ? 'stamped' : null]),
    doc: { nodeAt: () => ({ attrs: { pending: true }, nodeSize: 1 }), resolve: () => ({ start: () => 0, end: () => 99 }), textBetween: () => '' }
  };
  const schema = { marks: { insertion: 'INS', deletion: 'DEL' } };
  const ops = [{ op: 'accept', from: 5 }, { op: 'unmark', from: 20, to: 30, mark: 'insertion' }, { op: 'delete', from: 12, to: 15 }];
  w.applyProposedOps(tr, ops, schema, { pending: false, warn: null, savedAt: 'now', author: null });
  assert.deepEqual(calls, [['meta', 'reviewAction', true], ['unmark', 20, 30, 'INS'], ['delete', 12, 15], ['accept', 5, false, 'stamped']]);
});

test('finaliser en acceptant : texte accepté, complètes gardées, incomplètes et lignes à compléter retirées', () => {
  const d = doc(para(txt('Plan : '), draftLine('d'), txt(' '), incompleteRx('i'), txt(' '), completeRx('c'), txt(' '), ins('Suivi 7 jours.', 'ai', 'Assistant IA')), para(del('Ancien'), txt(' reste')));
  const out = w.resolveProposedInDoc(d, true);
  const chips = chipsIn(out.content);
  assert.deepEqual(chips.map((c) => c.attrs.cid), ['c']);
  assert.ok(chips.every((c) => !c.attrs.pending && !c.attrs.warn));
  // « Plan : » + la complète (hors texte) + l'espace + le texte de l'IA ; les espaces des retirées sont partis avec elles.
  assert.equal(textOf(out.content[0]), 'Plan :  Suivi 7 jours.');
  assert.equal(textOf(out.content[1]), ' reste', 'une suppression acceptée retire le texte');
  assert.ok(out.content[0].content.every((n) => !n.marks), 'plus aucune marque');
});

test('finaliser en refusant : rien de proposé n’entre ; une suppression refusée garde son texte', () => {
  const d = doc(para(txt('Plan : '), completeRx('c'), txt(' '), ins('Du texte.')), para(del('Gardé'), txt(' et le reste')));
  const out = w.resolveProposedInDoc(d, false);
  assert.equal(chipsIn(out.content).length, 0);
  assert.equal(textOf(out.content[0]), 'Plan : ', 'l’espace qui suivait la puce part avec elle');
  assert.equal(textOf(out.content[1]), 'Gardé et le reste');
  assert.ok(out.content[1].content.every((n) => !n.marks));
});

test('le doc reçu n’est pas modifié', () => {
  const d = doc(para(txt('Plan : '), completeRx('c'), txt(' '), ins('Du texte.')));
  const before = JSON.stringify(d);
  w.resolveProposedInDoc(d, true);
  w.resolveProposedInDoc(d, false);
  assert.equal(JSON.stringify(d), before);
});

test('le texte d’un autre auteur que le gabarit se résout comme celui du gabarit', () => {
  const d = doc(para(ins('Texte de l’IA.', 'ai', 'Assistant IA'), txt(' '), ins('Texte du médecin.', 'me', 'Dr Test')));
  assert.equal(textOf(w.resolveProposedInDoc(d, false).content[0]), ' ');
  assert.equal(textOf(w.resolveProposedInDoc(d, true).content[0]), 'Texte de l’IA. Texte du médecin.');
});

test('suivant et précédent : dans l’ordre du document, en faisant le tour', () => {
  const cs = scan(doc(para(completeRx('a'), txt(' '), ins('Un texte.'), txt(' '), completeRx('b'))));
  assert.equal(cs.length, 3);
  assert.equal(w.nextProposedChange(cs, 0, 1).id, cs[0].id);
  assert.equal(w.nextProposedChange(cs, cs[0].from, 1).id, cs[1].id, 'depuis un changement : le suivant');
  assert.equal(w.nextProposedChange(cs, cs[2].from, 1).id, cs[0].id, 'après le dernier : le premier');
  assert.equal(w.nextProposedChange(cs, cs[1].from, -1).id, cs[0].id);
  assert.equal(w.nextProposedChange(cs, cs[0].from, -1).id, cs[2].id, 'avant le premier : le dernier');
  assert.equal(w.nextProposedChange([], 0, 1), null);
});

test('les gabarits du prototype restent lus : « Pneumonie » propose quatre complètes et une incomplète', () => {
  const cs = scan(doc(...w.buildTemplateBlocks(tpl('pneumonie'))));
  assert.deepEqual(cs.map((c) => c.state), ['complete', 'complete', 'complete', 'incomplete', 'complete']);
  assert.ok(cs.every((c) => c.author.kind === 'gabarit'));
});
