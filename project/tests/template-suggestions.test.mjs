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
  assert.ok(chips.every((c) => c.attrs.pending && c.attrs.proposedBy === w.t('template.source.label', { name: w.TR('Pneumonie (suspicion)') })));
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
  assert.deepEqual(s.sources, [w.t('template.source.label', { name: w.TR('Pneumonie (suspicion)') })]);
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
  assert.equal(textOf([plan]), w.L('Impression : \nPlan : ').split('\n')[1]);
  assert.equal(textOf([rejected]).replace(/\s+/g, ' '), textOf([d]).replace(/\s+/g, ' ').trimEnd() + ' ');
  assert.equal(w.pendingSummary(d).count, 3, 'le doc reçu n’est pas modifié');
});

test('texte proposé : les paragraphes sont marqués « Gabarit », pas les titres ; accepter retire la marque, refuser retire le texte', () => {
  const blocks = w.buildTemplateBlocks(tpl('otite'), { proposeText: true });
  // Les titres de section sont des lignes de texte normal (pas de Titre 2).
  const titles = new Set(tpl('otite').sections.map((s) => s.title));
  const headings = blocks.filter((b) => b.type === 'paragraph' && titles.has(textOf([b])));
  assert.equal(headings.length, 2, 'Histoire et Examen ; la Conclusion devient la ligne');
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

// Réglage « Gabarit : lignes à compléter » (rencontre du 2026-10-27, A3) : le
// gabarit pose la fonction et le terme, sans item choisi ; le médecin choisit.
test('lignes à compléter : chaque ajout du gabarit est une ligne d’état 1 (fonction + terme), en attente', () => {
  w.__TEMPLATE_DRAFT_LINES = true;
  try {
    const chips = chipsIn(w.buildTemplateBlocks(tpl('pneumonie')));
    assert.deepEqual(chips.map((c) => c.attrs.draft.kind), ['img', 'lab', 'rx']);
    assert.ok(chips.every((c) => c.attrs.pending && c.attrs.rx === null && c.attrs.draft.term === c.attrs.label));
    assert.deepEqual(chips.map((c) => c.attrs.type), ['imaging', 'lab', 'prescription']);
    // Un profil se rouvre dans /lab, sous son nom.
    const prof = w.buildDraftChipNode({ kind: 'profile', key: 'prof-anemie' }, 'x');
    assert.deepEqual(prof.attrs.draft, { kind: 'lab', term: w.TR('Bilan anémie') });
    // Une conclusion de diagnostic aussi.
    const opt = w.NOTE_DATA.dxConclusionOptions({ name: 'Cystite', code: 'N30.0' }, { notes: [], sommaire: [] })[0];
    assert.ok(chipsIn(w.buildConclusionBlocks(opt)).every((c) => c.attrs.draft));
  } finally { delete w.__TEMPLATE_DRAFT_LINES; }
});

test('lignes à compléter : accepter les garde en texte (rien n’est prescrit sans choix), refuser les retire', () => {
  w.__TEMPLATE_DRAFT_LINES = true;
  let d;
  try { d = doc(...w.buildTemplateBlocks(tpl('otite'))); } finally { delete w.__TEMPLATE_DRAFT_LINES; }
  const terms = chipsIn([d]).map((c) => c.attrs.draft.term);
  assert.ok(terms.length > 0);
  const accepted = w.resolvePendingInDoc(d, true);
  assert.equal(chipsIn([accepted]).length, 0);
  terms.forEach((term) => assert.ok(textOf([accepted]).includes(term), term));
  assert.equal(w.pendingSummary(accepted).count, 0);
  assert.equal(chipsIn([w.resolvePendingInDoc(d, false)]).length, 0);
});

test('aucun gabarit de note ne crée de titre spécial : titres en texte normal, Conclusion en ligne de séparation', () => {
  w.NOTE_DATA.NOTE_TEMPLATES.forEach((t) => {
    const blocks = w.buildTemplateBlocks(t);
    assert.equal(blocks.filter((b) => b.type === 'heading').length, 0, t.key);
    const splits = blocks.filter((b) => b.type === w.SECTION_SPLIT).length;
    const hasConclusion = t.sections.some((s) => s.title === w.CONCLUSION_LABEL);
    assert.equal(splits, hasConclusion ? 1 : 0, t.key + ' : une ligne pour sa conclusion');
  });
});
