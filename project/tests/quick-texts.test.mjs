// Textes rapides avec tuiles dans le texte (PLAN-gabarits-conclusion.md) : un
// jeton `{clé}` place sa puce à même la phrase ; les variantes d'un diagnostic
// sont des textes à part. Les allergies au dossier ne les classent pas et ne
// les accompagnent d'aucun avertissement : l'alerte vient sur l'entité, une
// fois ajoutée (RA-48).
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

test('les gabarits d’exemple montrent chaque sorte de puce : ordonnance, labo, imagerie, référence, consigne, examen, service', () => {
  const kinds = new Set();
  D.QUICK_TEXTS.forEach((q) => Object.values(q.tiles || {}).forEach((tile) => {
    const chip = w.buildPendingChipNode(tile, 'x');
    assert.ok(chip, `${q.key} : ${tile.kind}/${tile.key} est au catalogue`);
    assert.ok(!/undefined/.test(chip.attrs.text), `${q.key} : le texte de la puce est complet (${chip.attrs.text})`);
    kinds.add(chip.attrs.type);
  }));
  ['prescription', 'lab', 'imaging', 'referral', 'instructions', 'exam', 'service'].forEach((type) => assert.ok(kinds.has(type), `aucun gabarit d’exemple n’a de puce « ${type} »`));
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

test('allergie à la pénicilline : ni classement ni avertissement sur les options (RA-48)', () => {
  const ids = (list) => list.map((o) => o.id);
  const optionsWith = (allergies) => withAllergies(allergies, () => D.dxConclusionOptions(PNEUMONIE, NO_CTX));
  const without = optionsWith([]);
  const withPenicillin = optionsWith([w.L('Pénicilline')]);
  assert.deepEqual(ids(without), ['pac-ambu', 'pac-comorb', 'pac-allergie']);
  assert.deepEqual(ids(withPenicillin), ids(without), 'l’ordre ne dépend pas de l’allergie');
  assert.ok(withPenicillin.every((x) => x.allergy === undefined), 'aucun conflit d’allergie calculé sur une option');
});

test('l’alerte d’allergie vient sur l’entité, une fois ajoutée : la puce du texte en conflit la porte', () => withAllergies([w.L('Pénicilline')], () => {
  const opt = D.dxConclusionOptions(PNEUMONIE, NO_CTX).find((o) => o.id === 'pac-ambu');
  const kinds = chipsOf(w.buildConclusionBlocks(opt)).flatMap((c) => w.chipIssues(c.attrs).map((i) => i.kind));
  assert.ok(kinds.includes('allergy'), 'l’amoxicilline de « PAC ambulatoire » porte l’alerte d’allergie');
  const sans = D.dxConclusionOptions(PNEUMONIE, NO_CTX).find((o) => o.id === 'pac-allergie');
  const kindsSans = chipsOf(w.buildConclusionBlocks(sans)).flatMap((c) => w.chipIssues(c.attrs).map((i) => i.kind));
  assert.ok(!kindsSans.includes('allergy'), 'la variante « allergie à la pénicilline » n’en porte aucune');
}));

test('barre de la suite : le premier texte, sans avertissement, et aucun produit allergène proposé', () => withAllergies([w.L('Pénicilline')], () => {
  const s = D.nextStepSuggestions({ region: Object.assign({ id: 'd1' }, PNEUMONIE), ctx: NO_CTX });
  assert.equal(s[0].id, 'tpl:pac-ambu');
  assert.equal(s[0].desc, undefined);
  assert.notEqual(s[0].icon, 'warning');
  const rx = s.filter((x) => x.orderKind === 'rx').map((x) => x.item.key);
  assert.ok(rx.length > 0);
  assert.ok(!rx.includes('cat-50') && !rx.includes('cat-48'), 'ni amoxicilline ni amoxicilline-clavulanate');
}));

test('la pastille de la barre ne porte aucun avertissement, même si tous les textes sont en conflit', () => withAllergies([w.L('Pénicilline'), w.L('Azithromycine')], () => {
  // Otite : amoxicilline, ou azithromycine pour l'allergie à la pénicilline.
  const otite = D.nextStepSuggestions({ region: { id: 'd2', name: 'Otite', code: 'H66.9' }, ctx: NO_CTX })[0];
  assert.notEqual(otite.icon, 'warning');
  assert.equal(otite.desc, undefined);
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

test('variantes selon l’allergie : MPOC, otite, pharyngite et sinusite restent offertes, dans le même ordre avec ou sans allergie', () => {
  const idsOf = (allergies, code) => withAllergies(allergies, () => D.dxConclusionOptions({ name: 'x', code }, NO_CTX).map((o) => o.id));
  [['J44.1', 'mpoc-allergie'], ['H66.9', 'otite-allergie'], ['J02.0', 'pharyngite-allergie'], ['J01.9', 'sinusite-allergie']].forEach(([code, variant]) => {
    const avec = idsOf([w.L('Pénicilline')], code);
    assert.ok(avec.includes(variant), `${code} : la variante ${variant} est offerte`);
    assert.deepEqual(avec, idsOf([], code), `${code} : l’allergie ne change pas l’ordre`);
  });
  assert.equal(idsOf([w.L('Pénicilline')], 'L03.1')[0], 'cellulite', 'céphalexine : hors de la classe pénicilline');
});

test('menu « / » : hors diagnostic, tous les textes, les miens d’abord ; la recherche trouve aussi par diagnostic', () => withAllergies([], () => {
  const all = D.searchQuickTexts('', null, NO_CTX);
  assert.deepEqual(all.context, []);
  assert.equal(all.others.length, D.QUICK_TEXTS.length);
  assert.deepEqual([...new Set(all.others.map((o) => o.kind))], ['mine', 'omnimed']);
  const ids = (r) => r.others.map((o) => o.id);
  assert.deepEqual(ids(D.searchQuickTexts('pneumonie', null, NO_CTX)), ['pac-ambu', 'pac-comorb', 'pac-allergie'], 'par le diagnostic, pas seulement le nom « PAC »');
  assert.deepEqual(ids(D.searchQuickTexts('pac allergie', null, NO_CTX)), ['pac-allergie'], 'tous les mots requis');
  assert.ok(ids(D.searchQuickTexts('PYELO', null, NO_CTX)).includes('pyelo'), 'sans accents ni casse');
  assert.deepEqual(ids(D.searchQuickTexts('zzz', null, NO_CTX)), []);
}));

test('menu « / » dans un diagnostic : ses textes d’abord, dans l’ordre des suggestions, puis les autres sans doublon', () => withAllergies([w.L('Pénicilline')], () => {
  const r = D.searchQuickTexts('', PNEUMONIE, NO_CTX);
  assert.deepEqual(r.context.map((o) => o.id), D.dxConclusionOptions(PNEUMONIE, NO_CTX).map((o) => o.id));
  assert.equal(r.context[0].id, 'pac-ambu', 'l’ordre des textes, sans classement selon l’allergie');
  assert.ok(!r.others.some((o) => o.id.startsWith('pac-')));
  assert.equal(r.context.length + r.others.length, D.QUICK_TEXTS.length);
  const sinus = D.quickTextOptionById('sinusite');
  assert.equal(sinus.source, w.t('template.source.label', { name: sinus.name }));
  assert.equal(sinus.allergy, undefined, 'aucun conflit d’allergie calculé sur l’option');
  assert.equal(D.quickTextOptionById('inconnu'), null);
  // Hors diagnostic aussi : même ordre qu'avec ou sans allergie.
  const sinusOrder = (allergies) => withAllergies(allergies, () => D.searchQuickTexts('sinus', null, NO_CTX).others.map((o) => o.id));
  assert.deepEqual(sinusOrder([w.L('Pénicilline')]), sinusOrder([]));
  assert.deepEqual(sinusOrder([]), ['sinusite', 'sinusite-allergie']);
}));
