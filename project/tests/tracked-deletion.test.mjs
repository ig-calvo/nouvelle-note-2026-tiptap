// Suppression suivie d'une entité (lot 1b de PLAN-gabarits-vision-v1.md, Q9) :
// sous suivi, retirer une puce déjà dans la note la laisse en place, barrée et
// signée (marque `deletion` sur le nœud), jusqu'à ce qu'un relecteur accepte (la
// puce part) ou refuse (elle redevient normale). Ici, la logique sans éditeur :
// le classement d'un passage retiré, le scan, le résumé, le plan de résolution
// et la résolution d'un doc JSON. La pose de la marque par le traqueur
// (review-mode.jsx, du JSX) se vérifie dans le navigateur.
// Lancer : node --test project/tests/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPrototype, doc } from './harness.mjs';

const w = loadPrototype(['note-ui/note-sections.jsx', 'note-ui/diagnostics.jsx', 'note-ui/editor-data.jsx', 'note-ui/editor-schema.jsx', 'note-ui/proposed-changes.jsx']);

const jsonMark = (type, authorId = 'me') => ({ type, attrs: { authorId, authorName: 'Dr Test', ts: 1 } });
const pmMark = (type, authorId = 'me') => ({ type: { name: type }, attrs: { authorId } });
const txt = (text) => ({ type: 'text', text });
const struck = (text, authorId = 'me') => ({ type: 'text', text, marks: [jsonMark('deletion', authorId)] });
const para = (...content) => ({ type: 'paragraph', content });
const scan = (d) => w.scanProposedChanges(w.proposedDocLike(d));

// Une ordonnance déjà dans la note (acceptée), avec ou sans marque.
const acceptedRx = (cid, marks) => {
  const c = w.buildPendingChipNode({ kind: 'rx', key: 'amox500' }, 'Gabarit « Test »');
  const attrs = Object.assign({}, c.attrs, { cid, pending: false, proposedBy: null, details: Object.assign({ dose: '500 mg', route: 'PO', frequency: 'TID' }, c.attrs.details) });
  return marks ? { type: 'chip', attrs, marks } : { type: 'chip', attrs };
};
const strickenRx = (cid, authorId = 'me') => acceptedRx(cid, [jsonMark('deletion', authorId)]);
const label = (cid) => acceptedRx(cid).attrs.label;

test('classer un passage retiré : puce acceptée et texte ordinaire restent barrés, le reste part sans trace', () => {
  const how = (run) => w.classifyDeletedRun(run, 'me');
  assert.equal(how({ text: 'abc', marks: [] }), 'mark', 'texte ordinaire');
  assert.equal(how({ node: { attrs: { pending: false } }, marks: [] }), 'mark', 'puce déjà dans la note');
  assert.equal(how({ node: { attrs: { pending: true } }, marks: [] }), 'skip', 'puce proposée : pas encore dans la note');
  assert.equal(how({ node: { attrs: { pending: true, draft: { kind: 'rx', term: 'Amoxicilline' } } }, marks: [] }), 'skip', 'ligne à compléter');
  assert.equal(how({ text: 'abc', marks: [pmMark('insertion', 'me')] }), 'skip', 'ma propre insertion en attente : annulation nette');
  assert.equal(how({ node: { attrs: { pending: false } }, marks: [pmMark('insertion', 'me')] }), 'skip', 'une puce que je viens d’ajouter sous suivi aussi');
  assert.equal(how({ text: 'abc', marks: [pmMark('insertion', 'ai')] }), 'mark', 'l’insertion de quelqu’un d’autre : une suppression signée');
  assert.equal(how({ text: 'abc', marks: [pmMark('deletion', 'lefebvre')] }), 'keep', 'déjà barré : il le reste');
  assert.equal(how({ node: { attrs: { pending: false } }, marks: [pmMark('deletion', 'lefebvre')] }), 'keep');
});

test('le scan lit une puce barrée comme un passage retiré, avec son nom', () => {
  const d = doc(para(txt('Plan : '), strickenRx('a'), txt(' reste')));
  const cs = scan(d);
  assert.equal(cs.length, 1);
  assert.equal(cs[0].kind, 'deletion');
  assert.equal(cs[0].chips, 1);
  assert.equal(cs[0].text, label('a'));
  assert.equal(cs[0].authorName, 'Dr Test');
  assert.equal(cs[0].to - cs[0].from, 1, 'une puce occupe une position');
  assert.ok(cs[0].acceptable && cs[0].canAccept);
});

test('une puce barrée et le texte barré qui la touche, du même auteur, font un seul changement', () => {
  const d = doc(para(struck('Antibiotique : '), strickenRx('a'), struck(' ')));
  const cs = scan(d);
  assert.equal(cs.length, 1);
  assert.equal(cs[0].chips, 1);
  assert.equal(cs[0].text, 'Antibiotique : ' + label('a') + ' ');
  // Un autre auteur, ou un passage ordinaire entre les deux : deux changements.
  assert.equal(scan(doc(para(strickenRx('a', 'me'), struck(' ', 'lefebvre')))).length, 2);
  assert.equal(scan(doc(para(strickenRx('a'), txt(' '), strickenRx('b')))).length, 2);
});

test('une puce sans marque de suppression n’est pas un changement ; sa marque d’insertion non plus', () => {
  assert.equal(scan(doc(para(txt('Plan : '), acceptedRx('a')))).length, 0);
  assert.equal(scan(doc(para(acceptedRx('a', [jsonMark('insertion')])))).length, 0);
});

test('une puce proposée reste une entité, jamais une suppression', () => {
  const pending = w.buildPendingChipNode({ kind: 'rx', key: 'amox500' }, 'Gabarit « Test »');
  const cs = scan(doc(para(Object.assign({}, pending, { marks: [jsonMark('deletion')] }))));
  assert.deepEqual(cs.map((c) => c.kind), ['entity']);
});

test('le résumé compte à part les éléments retirés', () => {
  const d = doc(para(strickenRx('a'), txt(' '), struck('un vieux texte'), txt(' '), { type: 'text', text: 'neuf', marks: [jsonMark('insertion', 'gabarit')] }));
  const s = w.summarizeProposedChanges(scan(d));
  assert.equal(s.total, 3);
  assert.equal(s.removed, 1, 'la puce barrée');
  assert.equal(s.text, 2, 'le texte barré et le texte inséré');
  assert.equal(s.acceptable, 3);
});

test('le plan : accepter retire le passage et la puce, refuser lui rend son état', () => {
  const cs = scan(doc(para(txt('Plan : '), strickenRx('a'), txt(' '))));
  const [c] = cs;
  assert.deepEqual(w.planProposedResolution(cs, true), [{ op: 'delete', from: c.from, to: c.to }]);
  assert.deepEqual(w.planProposedResolution(cs, false), [{ op: 'unmark', from: c.from, to: c.to, mark: 'deletion' }]);
});

test('sur un doc JSON : accepter la suppression retire la puce, refuser la garde sans marque', () => {
  const d = doc(para(txt('Plan : '), struck('x '), strickenRx('a'), txt(' fin')));
  const before = JSON.stringify(d);
  const accepted = w.resolveProposedInDoc(d, true);
  const kept = w.resolveProposedInDoc(d, false);
  assert.equal(JSON.stringify(d), before, 'le doc reçu n’est pas modifié');
  const chips = (n) => { const out = []; const walk = (x) => { if (x && x.type === 'chip') out.push(x); ((x && x.content) || []).forEach(walk); }; walk(n); return out; };
  const textOf = (n) => { const out = []; const walk = (x) => { if (x && x.type === 'text') out.push(x.text); ((x && x.content) || []).forEach(walk); }; walk(n); return out.join(''); };
  assert.equal(chips(accepted).length, 0, 'la puce part');
  assert.equal(textOf(accepted), 'Plan :  fin', 'le texte barré part aussi');
  assert.equal(chips(kept).length, 1, 'la puce reste');
  assert.equal(chips(kept)[0].marks, undefined, 'sans sa marque de suppression');
  assert.equal(textOf(kept), 'Plan : x  fin');
});

test('une puce acceptée portant une marque d’insertion garde le traitement d’avant à la finalisation', () => {
  const d = doc(para(acceptedRx('a', [jsonMark('insertion', 'me')])));
  assert.equal(JSON.stringify(w.resolveProposedInDoc(d, true)), JSON.stringify(d));
  assert.equal(JSON.stringify(w.resolveProposedInDoc(d, false)), JSON.stringify(d));
});
