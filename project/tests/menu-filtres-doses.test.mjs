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
  assert.deepEqual(keys(search('renouvelables').profil), ['med-tylenol-100', 'med-tylenol-500']); // active, échue
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

test('/rx : les favoris se lisent « Fréquemment prescrits », au rail comme dans la liste ; les autres menus gardent « Favoris »', () => {
  const en = process.env.I18N_TEST_LANG === 'en';
  const frequents = en ? 'Frequently prescribed' : 'Fréquemment prescrits';
  const favoris = en ? 'Favorites' : 'Favoris';
  assert.equal(D.RX_FILTERS.find((f) => f.key === 'favoris').label, frequents);
  assert.equal(D.ORDER_DEFS.rx.sections[0], frequents);
  for (const kind of ['lab', 'img', 'ref', 'exam', 'serv', 'instr', 'ant']) assert.equal(D.ORDER_DEFS[kind].sections[0], favoris, kind);
});

test('les filtres ne touchent que /rx : /lab garde sa liste', () => {
  D.endOrderSearch();
  D.setRxFilter('cessees');
  const lab = D.searchOrder('lab', '');
  assert.ok(lab.labSections.length > 0);
  assert.equal(lab.phrases, undefined);
  D.endOrderSearch();
});

test('Renouvelables : toute médication active ou échue, jamais une cessée', () => {
  const adulte = loadPrototype(['note-ui/note-sections.jsx', 'note-ui/diagnostics.jsx', 'note-ui/editor-data.jsx', 'note-ui/editor-schema.jsx'], { patient: 'adulte' });
  const A = adulte.NOTE_DATA;
  const rx = (filter) => { A.endOrderSearch(); A.setRxFilter(filter); const r = A.searchOrder('rx', ''); A.endOrderSearch(); return r; };
  // Aucune n'est « à renouveler bientôt » : les actives y sont quand même.
  assert.deepEqual(keys(rx('renouvelables').profil), ['med-almotriptan', 'med-candesartan', 'med-levothyroxine', 'med-metformine']);
  assert.deepEqual(keys(rx('renouvelables').profil), keys(rx('actives').profil));
  assert.deepEqual(keys(rx('cessees').profil), ['med-gliclazide', 'med-naproxene']);
  assert.equal(A.rxCounts('').renouvelables, 4);
  assert.equal(A.rxCounts('metformine').renouvelables, 1); // la recherche filtre aussi ce compteur
  // Une échue et une active, ensemble.
  assert.equal(D.rxCounts('tylenol').renouvelables, 2);
});

test('chaque médication du profil a la date de sa prescription d’origine, avant son arrêt ou son échéance', () => {
  const adulte = loadPrototype(['note-ui/note-sections.jsx', 'note-ui/diagnostics.jsx', 'note-ui/editor-data.jsx', 'note-ui/editor-schema.jsx'], { patient: 'adulte' });
  for (const m of adulte.NOTE_DATA.PATIENT_MEDS.concat(D.PATIENT_MEDS)) {
    assert.match(m.prescribedOn, /^\d{4}-\d{2}-\d{2}$/, m.key);
    if (m.medDate) { // « 02/2026 » : l'origine n'est pas plus tard que ce mois-là
      const [mm, yyyy] = m.medDate.split('/');
      assert.ok(m.prescribedOn.slice(0, 7) <= yyyy + '-' + mm, m.key);
    }
  }
  // Maquette « Prescription — Vision » (2026-11-04) : la date en aaaa-mm-jj, pour une médication active ou échue ; pas pour une cessée.
  const text = D.medPrescribedText(med('med-tylenol-100'));
  assert.equal(text, (process.env.I18N_TEST_LANG === 'en' ? 'Prescribed on ' : 'Prescrit le ') + '2026-01-20');
  assert.match(D.medPrescribedText(med('med-tylenol-500')), /2025-08-14$/, 'échue : la date aussi');
  assert.equal(med('med-tylenol-500').medStatus, 'echue');
  assert.equal(D.medPrescribedText(med('med-nitrofurantoine')), '', 'cessée : pas de date');
  assert.equal(D.medPrescribedText({ key: 'sans-date' }), '');
  assert.equal(D.medPrescribedText(null), '');
  assert.equal(D.medPrescribedText(D.RX_ALL ? D.RX_ALL[0] : {}), ''); // un produit du catalogue n'a pas de prescription d'origine
});
