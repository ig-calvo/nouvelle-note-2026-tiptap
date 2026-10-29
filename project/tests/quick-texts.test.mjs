// Textes rapides avec tuiles dans le texte (PLAN-gabarits-conclusion.md) : un
// jeton `{clé}` place sa puce à même la phrase ; les variantes d'un diagnostic
// sont des textes à part, classés selon les allergies au dossier.
// Lancer : node --test project/tests/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPrototype, doc } from './harness.mjs';

const w = loadPrototype(['note-ui/note-sections.jsx', 'note-ui/diagnostics.jsx', 'note-ui/editor-data.jsx', 'note-ui/editor-schema.jsx']);
const D = w.NOTE_DATA;
const NO_CTX = { notes: [], sommaire: [] };
const PNEUMONIE = { name: 'Pneumonie', code: 'J18.9' };
const chipsOf = (blocks) => blocks.flatMap((b) => (b.content || []).filter((n) => n.type === 'chip'));
const lineOf = (b) => (b.content || []).map((n) => (n.type === 'chip' ? `[${n.attrs.label}]` : n.text)).join('');
const withAllergies = (names, fn) => {
  const before = D.getPatientAllergies();
  try { D.setPatientAllergies(names); return fn(); } finally { D.setPatientAllergies(before); }
};

test('chaque texte rapide : diagnostics connus, tuiles toutes placées et au catalogue', () => {
  const ctxKeys = D.DX_CONTEXTS.map((c) => c.key);
  D.QUICK_TEXTS.forEach((q) => {
    assert.ok(q.dx.length && q.dx.every((k) => ctxKeys.includes(k)), q.key);
    assert.ok(['mine', 'omnimed'].includes(q.kind), q.key);
    const tokens = [...q.content.matchAll(/\{([A-Za-z][\w-]*)\}/g)].map((m) => m[1]);
    assert.deepEqual([...new Set(tokens)].sort(), Object.keys(q.tiles || {}).sort(), `${q.key} : un jeton sans tuile ou une tuile sans place`);
  });
  assert.equal(new Set(D.QUICK_TEXTS.map((q) => q.key)).size, D.QUICK_TEXTS.length, 'clés uniques');
});

test('les tuiles arrivent à leur place dans la phrase, en attente et signées', () => withAllergies([], () => {
  const opt = D.dxConclusionOptions(PNEUMONIE, NO_CTX).find((o) => o.id === 'pac-ambu');
  const blocks = w.buildConclusionBlocks(opt);
  assert.ok(blocks.every((b) => b.type === 'paragraph'));
  const lines = blocks.map(lineOf);
  const src = opt.content.split('\n');
  assert.equal(lines[1], src[1].replace('{abx}', `[${w.TR('Amoxicilline')} 1 g]`));
  assert.equal(lines[2], src[2].replace('{img}', `[${w.TR('Radiographie pulmonaire')}]`));
  assert.ok(!lines.some((l) => /\{\w+\}/.test(l)), 'aucun jeton ne reste dans le texte');
  assert.equal(blocks.length, opt.content.split('\n').length, 'pas de ligne de puces en plus à la fin');
  const chips = chipsOf(blocks);
  assert.equal(chips.length, opt.proposals.length);
  assert.ok(chips.every((c) => c.attrs.pending && c.attrs.proposedBy === opt.source));
  assert.deepEqual(opt.proposals.map((p) => p.key), ['cat-50', 'rxpoumon', 'cat-40'], 'dans l’ordre du texte');
}));

test('les ajouts sans jeton gardent leur ligne à la fin ; un jeton inconnu reste du texte', () => {
  const opt = { content: 'Plan : {abx} puis {inconnu}.', source: 's',
    tiles: { abx: { kind: 'rx', key: 'cat-51' } }, proposals: [{ kind: 'lab', key: 'fsc' }] };
  opt.proposals = [opt.tiles.abx].concat(opt.proposals);
  const blocks = w.buildConclusionBlocks(opt);
  assert.equal(blocks.length, 2);
  assert.equal(lineOf(blocks[0]), `Plan : [${w.TR('Doxycycline')} 100 mg] puis {inconnu}.`);
  assert.deepEqual(chipsOf([blocks[1]]).map((c) => c.attrs.type), ['lab']);
});

test('refuser les puces : elles partent seules, le texte autour reste', () => withAllergies([], () => {
  const opt = D.dxConclusionOptions(PNEUMONIE, NO_CTX).find((o) => o.id === 'pac-ambu');
  const rejected = w.resolvePendingInDoc(doc(...w.buildConclusionBlocks(opt)), false);
  const text = rejected.content.map(lineOf);
  const src = opt.content.split('\n');
  assert.equal(chipsOf(rejected.content).length, 0);
  assert.ok(text.includes(src[4]), 'le délai de suivi reste');
  assert.ok(text.some((l) => l.startsWith(src[1].replace('{abx}', '').trimEnd())), 'la ligne de l’antibiotique reste');
}));

test('allergie à la pénicilline : la variante sans conflit d’abord, les autres signalées', () => {
  const ids = (list) => list.map((o) => o.id);
  withAllergies([], () => {
    const o = D.dxConclusionOptions(PNEUMONIE, NO_CTX);
    assert.deepEqual(ids(o), ['pac-ambu', 'pac-comorb', 'pac-allergie']);
    assert.ok(o.every((x) => x.allergy === null));
  });
  withAllergies([w.L('Pénicilline')], () => {
    const o = D.dxConclusionOptions(PNEUMONIE, NO_CTX);
    assert.deepEqual(ids(o), ['pac-allergie', 'pac-ambu', 'pac-comorb']);
    assert.equal(o[0].allergy, null);
    assert.deepEqual(o[1].allergy, { names: [w.L('Pénicilline')], items: [w.TR('Amoxicilline')] });
    assert.deepEqual(o[2].allergy.items, [w.TR('Amoxicilline-clavulanate')]);
  });
});

test('barre de la suite : le texte sans conflit, et aucun produit allergène proposé', () => withAllergies([w.L('Pénicilline')], () => {
  const s = D.nextStepSuggestions({ region: Object.assign({ id: 'd1' }, PNEUMONIE), ctx: NO_CTX });
  assert.equal(s[0].id, 'tpl:pac-allergie');
  assert.equal(s[0].desc, undefined);
  const rx = s.filter((x) => x.orderKind === 'rx').map((x) => x.item.key);
  assert.ok(rx.length > 0);
  assert.ok(!rx.includes('cat-50') && !rx.includes('cat-48'), 'ni amoxicilline ni amoxicilline-clavulanate');
}));

test('tous les textes en conflit : la pastille de la barre porte l’avertissement', () => withAllergies([w.L('Pénicilline'), w.L('Azithromycine')], () => {
  // Otite : amoxicilline, ou azithromycine pour l'allergie à la pénicilline.
  const otite = D.nextStepSuggestions({ region: { id: 'd2', name: 'Otite', code: 'H66.9' }, ctx: NO_CTX })[0];
  assert.equal(otite.icon, 'warning');
  assert.match(otite.desc, new RegExp(w.L('Pénicilline')));
}));

test('chaque diagnostic connu a au moins un texte rapide, et chaque texte se construit en entier', () => withAllergies([], () => {
  D.DX_CONTEXTS.forEach((c) => {
    const o = D.dxConclusionOptions({ name: 'x', code: c.cim10[0] }, NO_CTX);
    assert.ok(o.length > 0, `${c.key} : aucun texte rapide`);
    o.forEach((x) => assert.equal(chipsOf(w.buildConclusionBlocks(x)).length, x.proposals.length, `${x.id} : une tuile introuvable`));
  });
}));

test('catalogue : une entrée avec `key` garde sa clé, les autres prennent cat- et leur position', () => {
  const rx = D.ORDER_DEFS.rx.items();
  assert.ok(rx.some((it) => it.key === 'penv600' && it.name === w.TR('Pénicilline V')));
  assert.equal(rx.find((it) => it.key === 'cat-52').name, w.TR('Azithromycine'));
  assert.equal(new Set(rx.map((it) => it.key)).size, rx.length, 'clés uniques');
});

test('variantes selon l’allergie : MPOC, otite, pharyngite et sinusite', () => withAllergies([w.L('Pénicilline')], () => {
  const first = (code) => D.dxConclusionOptions({ name: 'x', code }, NO_CTX)[0].id;
  assert.equal(first('J44.1'), 'mpoc-allergie');
  assert.equal(first('H66.9'), 'otite-allergie');
  assert.equal(first('J02.0'), 'pharyngite-allergie');
  assert.equal(first('J01.9'), 'sinusite-allergie');
  assert.equal(first('L03.1'), 'cellulite', 'céphalexine : hors de la classe pénicilline');
}));
