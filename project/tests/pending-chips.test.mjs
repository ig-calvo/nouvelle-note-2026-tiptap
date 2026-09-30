// Ajouts en attente : un gabarit propose ses éléments inline (chip `pending`),
// il ne les applique pas. Accepter/refuser passe par l'éditeur (Tiptap), donc
// se vérifie dans le navigateur ; ici, le modèle : ce que le gabarit produit,
// et ce que les scans du document ignorent tant que rien n'est accepté.
// Lancer : node --test project/tests/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPrototype, doc, H2, P } from './harness.mjs';

const w = loadPrototype(['note-ui/note-sections.jsx', 'note-ui/diagnostics.jsx', 'note-ui/editor-data.jsx', 'note-ui/editor-schema.jsx']);
const tpl = (key) => w.NOTE_DATA.NOTE_TEMPLATES.find((t) => t.key === key);

const chipsIn = (blocks) => {
  const out = [];
  const walk = (n) => { if (n && n.type === 'chip') out.push(n); ((n && n.content) || []).forEach(walk); };
  blocks.forEach(walk);
  return out;
};

test('le gabarit « Otite moyenne aiguë » propose une ordonnance, en attente, à la suite de « Plan : »', () => {
  const blocks = w.buildTemplateBlocks(tpl('otite'));
  const chips = chipsIn(blocks);
  assert.equal(chips.length, 1);
  assert.equal(chips[0].attrs.pending, true);
  assert.equal(chips[0].attrs.type, 'prescription');
  assert.equal(chips[0].attrs.rx.name, 'Amoxicilline');
  assert.ok(!chips[0].attrs.savedAt); // pas encore sauvegardée : rien au Journal
  const plan = blocks.find((b) => b.type === 'paragraph' && b.content && b.content[0].text === 'Plan : ');
  assert.ok(plan, 'la ligne « Plan : » existe');
  assert.equal(plan.content[1].type, 'chip'); // inline, juste après le texte
});

test('un gabarit sans `proposals` ne produit aucun chip', () => {
  ['virus', 'itu', 'periodique'].forEach((key) => {
    assert.equal(chipsIn(w.buildTemplateBlocks(tpl(key))).length, 0, key);
  });
});

test('chaque proposition de gabarit pointe un item du catalogue', () => {
  w.NOTE_DATA.NOTE_TEMPLATES.forEach((t) => (t.sections || []).forEach((s) => (s.proposals || []).forEach((p) => {
    assert.ok(w.buildPendingChipNode(p), `${t.key} : ${p.kind}/${p.key}`);
  })));
});

test('chaque gabarit de note a son entrée « / » et un id de chip unique par ajout', () => {
  assert.ok(w.NOTE_DATA.SLASH_ITEMS.some((it) => it.noteTemplate === 'otite'));
  const a = chipsIn(w.buildTemplateBlocks(tpl('otite')))[0].attrs.cid;
  const b = chipsIn(w.buildTemplateBlocks(tpl('otite')))[0].attrs.cid;
  assert.notEqual(a, b);
});

test('scanDoc et le Journal ignorent un chip en attente', () => {
  const d = doc(H2('Détails'), { type: 'paragraph', content: [w.buildPendingChipNode({ kind: 'rx', key: 'amox500' })] });
  const stats = w.scanDoc(d);
  assert.deepEqual(stats.chips, []);
  assert.deepEqual(stats.items, []);
  assert.equal(stats.counts.prescription, undefined);
  assert.deepEqual(w.buildActionLog(d), []);
});

test('accepté (pending: false), le même chip compte comme une prescription', () => {
  const chip = w.buildPendingChipNode({ kind: 'rx', key: 'amox500' });
  chip.attrs.pending = false;
  const d = doc(H2('Détails'), { type: 'paragraph', content: [chip] });
  assert.equal(w.scanDoc(d).counts.prescription, 1);
});

test('stripPendingChips retire les chips en attente, garde les acceptés, ne modifie pas le doc', () => {
  const pending = w.buildPendingChipNode({ kind: 'rx', key: 'amox500' });
  const accepted = Object.assign({}, w.buildPendingChipNode({ kind: 'lab', key: 'fsc' }));
  accepted.attrs = Object.assign({}, accepted.attrs, { pending: false });
  const d = doc(P('Texte'), { type: 'paragraph', content: [{ type: 'text', text: 'Plan : ' }, pending, accepted] });
  const snapshot = JSON.stringify(d);
  const out = w.stripPendingChips(d);
  assert.equal(JSON.stringify(d), snapshot);
  const left = chipsIn(out.content);
  assert.equal(left.length, 1);
  assert.equal(left[0].attrs.type, 'lab');
});
