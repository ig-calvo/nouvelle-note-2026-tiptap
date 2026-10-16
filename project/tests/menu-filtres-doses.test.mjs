// Menu /rx mis à jour d'après le Figma « Recherche de prescriptions » (section 1,
// 2026-10-15) : rail de filtres à droite (Tout, Renouvelables, Actives, Cessées,
// Favoris, Gabarits) et augmentation / diminution de la dose d'une prescription
// existante. Lancer : node --test project/tests/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPrototype, doc, H2 } from './harness.mjs';

const w = loadPrototype(['note-ui/note-sections.jsx', 'note-ui/diagnostics.jsx', 'note-ui/editor-data.jsx', 'note-ui/editor-schema.jsx']);
const D = w.NOTE_DATA;
const med = (key) => D.PATIENT_MEDS.find((m) => m.key === key);
const keys = (list) => list.map((it) => it.key);
const search = (filter, q) => { D.endOrderSearch(); D.setRxFilter(filter); const r = D.searchOrder('rx', q || ''); D.endOrderSearch(); return r; };

test('augmenter / diminuer : palier suivant ou précédent, rien au bout de l’échelle', () => {
  const t = med('med-tylenol-100'); // 100 mg sur 100 / 325 / 500 / 650
  assert.deepEqual(D.medDoseStep(t, 'up'), { from: '100', to: '325' });
  assert.equal(D.medDoseStep(t, 'down'), null); // déjà au plus bas
  const top = Object.assign({}, t, { details: Object.assign({}, t.details, { dose: '650' }) });
  assert.equal(D.medDoseStep(top, 'up'), null);
  assert.deepEqual(D.medDoseStep(top, 'down'), { from: '650', to: '500' });
  assert.equal(D.medDoseStep(med('med-contraceptif'), 'up'), null); // pas de palier connu
});

test('la médication ajustée : dose, posologie recalculée, détails à jour, l’original intact', () => {
  const t = med('med-tylenol-100');
  const adj = D.adjustMedDose(t, 'up');
  assert.deepEqual([adj.dir, adj.from, adj.to], ['up', '100', '325']);
  assert.equal(adj.item.dose, '325 mg');
  assert.equal(adj.item.details.dose, '325');
  assert.equal(adj.item.chipSig, adj.item.sig);
  assert.match(adj.item.sig, /PO PRN/);
  assert.equal(t.dose, '100 mg'); // pas de mutation du profil
  assert.equal(t.details.dose, '100');
  assert.equal(D.adjustMedDose(t, 'down'), null);
});

test('actions : l’ancien « Ajuster » est remplacé par ↑ ↓', () => {
  for (const m of D.PATIENT_MEDS) assert.ok(!D.medActions(m).includes('ajuster'), m.key);
  assert.deepEqual(D.medActions(med('med-tylenol-100')).slice(0, 2), ['augmenter', 'diminuer']);
});

test('puce ajustée : badge ↑ / ↓ à la place du renouvellement, texte et checkout', () => {
  const adj = D.adjustMedDose(med('med-tylenol-100'), 'up');
  const attrs = Object.assign(w.orderChipAttrs('rx', adj.item), {});
  attrs.rx = Object.assign({}, attrs.rx, { renewal: true, adjust: 'up', adjustFrom: '100 mg' });
  assert.deepEqual(w.chipStatusBadges(attrs).map((b) => [b.kind, b.icon]), [['adjust', 'arrow_upward']]);
  assert.match(w.chipStatusBadges(attrs)[0].title, /Dose augmentée : 100 mg → 325 mg/);
  const down = Object.assign({}, attrs, { rx: Object.assign({}, attrs.rx, { adjust: 'down' }) });
  assert.equal(w.chipStatusBadges(down)[0].icon, 'arrow_downward');
  assert.match(w.chipPrintText(attrs), /^Augmentée Tylenol 325 mg/);
  assert.match(w.chipPrintText(down), /^Diminuée /);
  const d = doc(H2('Conclusion'), { type: 'paragraph', content: [{ type: 'chip', attrs }] });
  assert.equal(w.buildTransmissionDocs(w.scanDoc(d), {})[0].items[0].variant, 'ajustement');
});

test('filtres : Tout, Renouvelables, Actives, Cessées', () => {
  assert.deepEqual(keys(search('tout').profil), ['med-contraceptif', 'med-tylenol-100', 'med-tylenol-500', 'med-nitrofurantoine']);
  assert.deepEqual(keys(search('renouvelables').profil), ['med-tylenol-100', 'med-tylenol-500']); // à renouveler bientôt, échue
  assert.deepEqual(keys(search('actives').profil), ['med-contraceptif', 'med-tylenol-100']);
  assert.deepEqual(keys(search('cessees').profil), ['med-nitrofurantoine']);
  for (const f of ['renouvelables', 'actives', 'cessees']) {
    const r = search(f);
    assert.equal(r.favoris.length + r.frequents.length + r.autres.length + r.gabarits.length, 0, f);
  }
});

test('filtres : Favoris et Gabarits ; Tout n’affiche pas les gabarits', () => {
  const fav = search('favoris');
  assert.equal(fav.profil.length, 0);
  assert.ok(fav.favoris.length > 0);
  assert.equal(search('tout').gabarits.length, 0);
  const gab = search('gabarits');
  assert.deepEqual(gab.gabarits.map((g) => g.noteTemplate), ['otite', 'pneumonie']); // ceux qui proposent une ordonnance
  assert.ok(gab.gabarits.every((g) => g.name && g.sig && g.noteTemplate));
  assert.equal(gab.profil.length + gab.favoris.length, 0);
});

test('la liste navigable suit le filtre (clavier), gabarits compris', () => {
  assert.deepEqual(keys(w.flattenRxResults(search('actives'))), ['med-contraceptif', 'med-tylenol-100']);
  assert.deepEqual(w.flattenRxResults(search('gabarits')).map((g) => g.key), ['tpl-otite', 'tpl-pneumonie']);
});

test('compteurs du rail : ceux des lignes que chaque filtre affiche', () => {
  D.endOrderSearch();
  const c = D.rxCounts('');
  assert.deepEqual([c.renouvelables, c.actives, c.cessees, c.gabarits], [2, 2, 1, 2]);
  assert.equal(c.favoris, search('favoris').favoris.length);
  assert.equal(c.tout, search('tout').profil.length + search('tout').favoris.length + search('tout').frequents.length + search('tout').autres.length);
  assert.equal(D.rxCounts('nitro').cessees, 1); // la recherche filtre les compteurs
  assert.equal(D.rxCounts('nitro').actives, 0);
  D.endOrderSearch();
});

test('le filtre est remis à « Tout » à la fin de la recherche, et les filtres inconnus retombent sur Tout', () => {
  D.setRxFilter('cessees');
  assert.equal(D.getRxFilter(), 'cessees');
  D.endOrderSearch();
  assert.equal(D.getRxFilter(), 'tout');
  D.setRxFilter('nimportequoi');
  assert.equal(D.getRxFilter(), 'tout');
  assert.deepEqual(D.RX_FILTERS.map((f) => f.key), ['tout', 'renouvelables', 'actives', 'cessees', 'favoris', 'gabarits']);
});

test('les filtres ne touchent que /rx : /lab garde sa liste', () => {
  D.endOrderSearch();
  D.setRxFilter('cessees');
  const lab = D.searchOrder('lab', '');
  assert.ok(lab.favoris.length > 0 || lab.frequents.length > 0);
  assert.equal(lab.gabarits, undefined);
  D.endOrderSearch();
});
