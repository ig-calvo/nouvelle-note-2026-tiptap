// Gabarits en suggestions, bout à bout (D-03, lot 4) : plusieurs ajouts
// proposés, dont une ordonnance incomplète ; compte des ajouts en attente ;
// tout accepter / tout refuser sur le doc JSON ; texte du gabarit proposé.
// Lancer : node --test project/tests/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPrototype, doc } from './harness.mjs';

const w = loadPrototype(['note-ui/note-sections.jsx', 'note-ui/diagnostics.jsx', 'note-ui/editor-data.jsx', 'note-ui/editor-schema.jsx']);
// review-mode.jsx contient du JSX (non chargeable ici) : même contrat que son
// markBlocksAsInsertion — une marque `insertion` avec l'auteur sur chaque texte.
w.markBlocksAsInsertion = (blocks, author) => blocks.map(function mark(n) {
  if (n.type === 'text') return Object.assign({}, n, { marks: (n.marks || []).concat([{ type: 'insertion', attrs: { authorId: author.id, authorName: author.name } }]) });
  return n.content ? Object.assign({}, n, { content: n.content.map(mark) }) : n;
});
const tpl = (key) => w.NOTE_DATA.NOTE_TEMPLATES.find((t) => t.key === key);
const chipsIn = (nodes) => {
  const out = [];
  const walk = (n) => { if (n && n.type === 'chip') out.push(n); ((n && n.content) || []).forEach(walk); };
  nodes.forEach(walk);
  return out;
};
const textOf = (nodes) => {
  const out = [];
  const walk = (n) => { if (n && n.type === 'text') out.push(n.text); ((n && n.content) || []).forEach(walk); };
  nodes.forEach(walk);
  return out.join('');
};

test('« Pneumonie » propose imagerie, labo et une ordonnance incomplète, toutes en attente et signées par le gabarit', () => {
  const chips = chipsIn(w.buildTemplateBlocks(tpl('pneumonie')));
  assert.deepEqual(chips.map((c) => c.attrs.type), ['imaging', 'lab', 'prescription']);
  assert.ok(chips.every((c) => c.attrs.pending && c.attrs.proposedBy === 'Gabarit « Pneumonie (suspicion) »'));
  const rx = chips[2].attrs;
  assert.equal(rx.details.frequency, '');
  assert.doesNotMatch(rx.rx.sig, /BID/, 'la posologie affichée suit la fréquence vidée');
  assert.deepEqual(w.chipIssues(rx).map((i) => i.kind), ['incomplete']);
});

test('pendingSummary : puces en attente et sources', () => {
  const d = doc(...w.buildTemplateBlocks(tpl('pneumonie')));
  const s = w.pendingSummary(d);
  assert.equal(s.chips, 3);
  assert.equal(s.paragraphs, 0);
  assert.equal(s.count, 3);
  assert.deepEqual(s.sources, ['Gabarit « Pneumonie (suspicion) »']);
});

test('tout accepter : plus rien en attente, les puces restent ; tout refuser : elles disparaissent, le texte reste', () => {
  const d = doc(...w.buildTemplateBlocks(tpl('pneumonie')));
  const accepted = w.resolvePendingInDoc(d, true);
  assert.equal(w.pendingSummary(accepted).count, 0);
  assert.equal(chipsIn([accepted]).length, 3);
  const rejected = w.resolvePendingInDoc(d, false);
  assert.equal(chipsIn([rejected]).length, 0);
  // Le texte reste ; les espaces qui séparaient les puces refusées partent avec elles.
  const plan = rejected.content.find((b) => b.type === 'paragraph' && textOf([b]).startsWith('Plan'));
  assert.equal(textOf([plan]), 'Plan : ');
  assert.equal(textOf([rejected]).replace(/\s+/g, ' '), textOf([d]).replace(/\s+/g, ' ').trimEnd() + ' ');
  assert.equal(w.pendingSummary(d).count, 3, 'le doc reçu n’est pas modifié');
});

test('texte proposé : les paragraphes sont marqués « Gabarit », pas les titres ; accepter retire la marque, refuser retire le texte', () => {
  const blocks = w.buildTemplateBlocks(tpl('otite'), { proposeText: true });
  const headings = blocks.filter((b) => b.type === 'heading');
  assert.ok(headings.length > 0);
  assert.ok(headings.every((h) => (h.content || []).every((t) => !(t.marks || []).length)));
  const d = doc(...blocks);
  const s = w.pendingSummary(d);
  assert.equal(s.chips, 1);
  assert.ok(s.paragraphs > 0);
  const accepted = w.resolvePendingInDoc(d, true);
  assert.equal(w.pendingSummary(accepted).count, 0);
  assert.equal(textOf([accepted]), textOf([d]));
  const rejected = w.resolvePendingInDoc(d, false);
  assert.equal(textOf([rejected]), textOf(headings), 'seuls les titres restent');
});

test('sans le tweak, le texte du gabarit n’est pas proposé', () => {
  const s = w.pendingSummary(doc(...w.buildTemplateBlocks(tpl('otite'))));
  assert.equal(s.paragraphs, 0);
  assert.equal(s.chips, 1);
});
