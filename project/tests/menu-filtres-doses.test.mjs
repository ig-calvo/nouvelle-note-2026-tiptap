// Menu /rx mis à jour d'après le Figma « Recherche de prescriptions » (section 1,
// 2026-10-15) : rail de filtres à droite (Tout, Renouvelables, Actives, Cessées,
// Favoris, Phrases de prescription) et augmentation / diminution de la dose d'une prescription
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
  assert.equal(D.medDoseStep(med('med-nitrofurantoine'), 'up'), null); // pas de palier connu
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
  assert.deepEqual(D.medActions(med('med-tylenol-100')), ['renouveler', 'augmenter', 'diminuer', 'cesser']);
});

test('puce ajustée : badge ↑ / ↓ à la place du renouvellement, texte et checkout', () => {
  const adj = D.adjustMedDose(med('med-tylenol-100'), 'up');
  const attrs = Object.assign(w.orderChipAttrs('rx', adj.item), {});
  attrs.rx = Object.assign({}, attrs.rx, { renewal: true, adjust: 'up', adjustFrom: '100 mg' });
  assert.deepEqual(w.chipStatusBadges(attrs).map((b) => [b.kind, b.icon]), [['adjust', 'arrow_upward']]);
  assert.equal(w.chipStatusBadges(attrs)[0].title, w.t('common.labelValue.text', { label: w.t('rx.adjust.up.title'), value: '100 mg → 325 mg' }));
  const down = Object.assign({}, attrs, { rx: Object.assign({}, attrs.rx, { adjust: 'down' }) });
  assert.equal(w.chipStatusBadges(down)[0].icon, 'arrow_downward');
  assert.match(w.chipPrintText(attrs), new RegExp('^' + w.t('schema.statusUp.text') + ' ' + w.L('Tylenol') + ' 325 mg'));
  assert.match(w.chipPrintText(down), new RegExp('^' + w.t('schema.statusDown.text') + ' '));
  const d = doc(H2(w.TR('Conclusion')), { type: 'paragraph', content: [{ type: 'chip', attrs }] });
  assert.equal(w.buildTransmissionDocs(w.scanDoc(d), {})[0].items[0].variant, 'ajustement');
});

test('filtres : Tout, Renouvelables, Actives, Cessées', () => {
  assert.deepEqual(keys(search('tout').profil), ['med-tylenol-100', 'med-tylenol-500', 'med-nitrofurantoine']);
  assert.deepEqual(keys(search('renouvelables').profil), ['med-tylenol-100', 'med-tylenol-500']); // à renouveler bientôt, échue
  assert.deepEqual(keys(search('actives').profil), ['med-tylenol-100']);
  assert.deepEqual(keys(search('cessees').profil), ['med-nitrofurantoine']);
  for (const f of ['renouvelables', 'actives', 'cessees']) {
    const r = search(f);
    assert.equal(r.favoris.length + r.frequents.length + r.autres.length, 0, f);
  }
});

test('filtres : Favoris ; Phrases de prescription = hors du dossier, favoris compris', () => {
  const fav = search('favoris');
  assert.equal(fav.profil.length, 0);
  assert.ok(fav.favoris.length > 0);
  const tout = search('tout');
  const ph = search('phrases');
  assert.equal(ph.profil.length, 0); // rien du dossier
  assert.deepEqual(keys(ph.favoris), keys(tout.favoris)); // favoris compris
  assert.deepEqual(keys(ph.frequents), keys(tout.frequents));
  assert.deepEqual(keys(search('phrases', 'amox').autres), keys(search('tout', 'amox').autres)); // recherche : les autres produits trouvés
});

test('la liste navigable suit le filtre (clavier), phrases comprises', () => {
  assert.deepEqual(keys(w.flattenRxResults(search('actives'))), ['med-tylenol-100']);
  const ph = search('phrases');
  assert.deepEqual(keys(w.flattenRxResults(ph)), keys(ph.favoris.concat(ph.frequents, ph.autres)));
  assert.ok(!keys(w.flattenRxResults(ph)).some((k) => k.startsWith('med-')));
});

test('compteurs du rail : ceux des lignes que chaque filtre affiche', () => {
  D.endOrderSearch();
  const c = D.rxCounts('');
  assert.deepEqual([c.renouvelables, c.actives, c.cessees], [2, 1, 1]);
  const ph = search('phrases');
  assert.equal(c.phrases, ph.favoris.length + ph.frequents.length + ph.autres.length);
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
  assert.deepEqual(D.RX_FILTERS.map((f) => f.key), ['tout', 'renouvelables', 'actives', 'cessees', 'favoris', 'phrases']);
});

test('les filtres ne touchent que /rx : /lab garde sa liste', () => {
  D.endOrderSearch();
  D.setRxFilter('cessees');
  const lab = D.searchOrder('lab', '');
  assert.ok(lab.favoris.length > 0 || lab.frequents.length > 0);
  assert.equal(lab.phrases, undefined);
  D.endOrderSearch();
});
