// Recherche en contexte d'un diagnostic (rencontre vision 2026-10-27) : une
// recherche /rx, /lab ou /img ouverte sous un diagnostic montre, avant
// toute frappe, ce qui se rapporte à ce diagnostic ; taper revient à une
// recherche normale.
// Lancer : node --test project/tests/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPrototype } from './harness.mjs';

const w = loadPrototype(['note-ui/note-sections.jsx', 'note-ui/diagnostics.jsx', 'note-ui/editor-data.jsx', 'note-ui/editor-schema.jsx']);
const D = w.NOTE_DATA;
const keys = (list) => list.map((it) => it.key);

test('le code du diagnostic donne son contexte : CIM-10 par préfixe, SNOMED exact', () => {
  assert.equal(D.dxContextFor({ name: 'x', code: 'J45.9' }).key, 'asthme');
  assert.equal(D.dxContextFor({ name: 'x', code: 'N30.0' }).key, 'itu');
  assert.equal(D.dxContextFor({ name: 'x', code: 'N39.0' }).key, 'itu');
  assert.equal(D.dxContextFor({ name: 'x', code: 'J18.9' }).key, 'pneumonie');
  assert.equal(D.dxContextFor({ name: 'x', code: '65363002' }).key, 'otite');
  assert.equal(D.dxContextFor({ name: 'x', code: 'N39.4' }), null, 'N39.0 seulement, pas tout N39');
});

test('sans code, un mot entier du libellé suffit, dans les deux langues', () => {
  assert.equal(D.dxContextFor({ name: 'Asthme léger' }).key, 'asthme');
  assert.equal(D.dxContextFor({ name: 'Mild asthma' }).key, 'asthme');
  assert.equal(D.dxContextFor({ name: 'Infection urinaire basse' }).key, 'itu');
  assert.equal(D.dxContextFor({ name: 'Urinary tract infection' }).key, 'itu');
  assert.equal(D.dxContextFor({ name: 'Hypertension artérielle' }), null);
  assert.equal(D.dxContextFor({ name: 'Bursite' }), null, 'pas de faux positif sur un morceau de mot');
  assert.equal(D.dxContextFor(null), null);
});

test('chaque clé de la table existe au catalogue', () => {
  D.DX_CONTEXTS.forEach((c) => ['rx', 'lab', 'img'].forEach((k) => {
    const all = keys(D.ORDER_DEFS[k].items());
    c[k].forEach((key) => assert.ok(all.includes(key), `${c.key} : ${k} ${key} absent`));
  }));
});

test('/rx sous un asthme, rien de tapé : le contexte, favoris en tête, puis toutes les médications au dossier', () => {
  const r = D.searchOrder('rx', '', { name: 'Asthme léger', code: 'J45.9' });
  assert.equal(r.contextName, 'Asthme léger');
  assert.deepEqual(keys(r.contexte), ['vento100', 'cat-35', 'cat-37', 'cat-39']);
  assert.deepEqual(keys(r.profil), keys(D.searchOrder('rx', '').profil), 'tout le dossier, tous statuts, même sans lien au diagnostic');
  assert.ok(r.profil.length > 0);
  D.endOrderSearch();
  assert.deepEqual([r.favoris, r.frequents, r.autres].map((l) => l.length), [0, 0, 0]);
  assert.deepEqual(keys(w.flattenRxResults(r)), keys(r.contexte).concat(keys(r.profil)), 'la navigation au clavier suit la liste affichée');
});

test('/lab sous un asthme : le contexte seul, pas de dossier pharmacologique', () => {
  const r = D.searchOrder('lab', '', { name: 'Asthme léger', code: 'J45.9' });
  assert.deepEqual(keys(r.contexte), ['efr']);
  assert.equal(r.profil.length, 0);
});

test('taper quitte le contexte : recherche normale', () => {
  const r = D.searchOrder('rx', 'amox', { name: 'Asthme léger', code: 'J45.9' });
  assert.equal(r.contexte, undefined);
  assert.ok(keys(w.flattenRxResults(r)).includes('amox500'));
  D.endOrderSearch();
});

test('un filtre du rail /rx quitte aussi le contexte', () => {
  D.setRxFilter('favoris');
  const r = D.searchOrder('rx', '', { name: 'Asthme léger', code: 'J45.9' });
  assert.equal(r.contexte, undefined);
  D.endOrderSearch();
});

test('requêtes d’une ITU (colonne) : labo et imagerie, chacun avec sa nature ; /img sans contexte : recherche normale', () => {
  const r = D.contextResultsFor({ name: 'Cystite', code: 'N30.0' }, 'req');
  assert.deepEqual(r.map((it) => it.orderKind + ':' + it.key), ['lab:srum']);
  const img = D.searchOrder('img', '', { name: 'Cystite', code: 'N30.0' });
  assert.equal(img.contexte, undefined, 'rien pour ce diagnostic : la liste habituelle');
  D.endOrderSearch();
});

test('hors diagnostic : la recherche ne change pas', () => {
  assert.deepEqual(D.searchOrder('rx', ''), D.searchOrder('rx', '', null));
  D.endOrderSearch();
});

test('gabarits selon la raison de consultation : mots des deux langues, au plus 3', () => {
  const k = (text) => D.templatesForReason(text).map((tpl) => tpl.key);
  assert.deepEqual(k('Brûlures mictionnelles depuis 3 jours'), ['itu']);
  assert.deepEqual(k('Toux et fièvre'), ['virus', 'pneumonie']);
  assert.deepEqual(k('Burning on urination, urinary frequency'), ['itu']);
  assert.deepEqual(k('Mal à l’oreille'), ['otite']);
  assert.deepEqual(k(''), []);
  assert.deepEqual(k('Renouvellement'), []);
  assert.equal(D.templatesForReason('toux fièvre', 1).length, 1);
});

// Contexte de démonstration : une cystite résolue au dossier, une note qui la conclut.
const CTX = {
  sommaire: [{ name: w.TR('Cystite aiguë non compliquée'), code: 'N30.0' }],
  notes: [
    { date: w.TR('2 JUILLET 2026 09:10'), author: 'Dr X', diagnostics: [], conclusion: 'sans diagnostic' },
    { date: w.TR('8 DÉCEMBRE 2025 09:15'), author: 'Dr Marc Lefebvre', diagnostics: [w.TR('Cystite aiguë non compliquée')],
      conclusion: 'Impression : cystite.\nPlan : nitrofurantoïne.', reuse: [{ kind: 'rx', key: 'cat-44' }, { kind: 'lab', key: 'srum' }] },
  ],
};
const opts = (dx, ctx) => D.dxConclusionOptions(dx, ctx);
const chipsOf = (blocks) => blocks.flatMap((b) => (b.content || []).filter((n) => n.type === 'chip'));

test('options de conclusion sous une ITU : dernière conclusion, mon gabarit, gabarit Omnimed', () => {
  const o = opts({ name: 'Cystite', code: 'N30.0' }, CTX);
  assert.deepEqual(o.map((x) => x.id), ['last', 'mine', 'omnimed']);
  assert.equal(o[0].author, 'Dr Marc Lefebvre');
  assert.equal(o[0].date, w.I18N.lang === 'fr' ? '8 décembre 2025' : 'December 8, 2025');
  assert.equal(o[0].source, w.t('template.lastConclusion.label', { date: o[0].date }));
  assert.deepEqual(o[0].proposals.map((p) => p.key), ['cat-44', 'srum']);
});

test('dernière conclusion : seulement si le problème est au dossier ET qu’une note le conclut', () => {
  assert.deepEqual(opts({ code: 'N30.0' }, { notes: CTX.notes, sommaire: [] }).map((x) => x.id), ['mine', 'omnimed']);
  assert.deepEqual(opts({ code: 'N30.0' }, { notes: [], sommaire: CTX.sommaire }).map((x) => x.id), ['mine', 'omnimed']);
  assert.deepEqual(opts({ code: 'H66.9' }, CTX).map((x) => x.id), ['omnimed'], 'otite : ni dossier ni gabarit à moi');
  assert.deepEqual(opts({ name: 'Hypertension artérielle', code: 'I10' }, CTX), []);
});

test('gabarit de conclusion : texte en paragraphes, ajouts en attente signés par l’option', () => {
  D.DX_CONTEXTS.forEach((c) => {
    opts({ name: 'x', code: c.cim10[0] }, CTX).forEach((o) => {
      const blocks = w.buildConclusionBlocks(o);
      assert.ok(blocks.every((b) => b.type === 'paragraph'), 'une région de diagnostic n’accepte que des paragraphes');
      const chips = chipsOf(blocks);
      assert.equal(chips.length, o.proposals.length, `${c.key} ${o.id} : un ajout introuvable au catalogue`);
      assert.ok(chips.every((ch) => ch.attrs.pending && ch.attrs.proposedBy === o.source));
    });
  });
  const itu = opts({ code: 'N30.0' }, CTX).find((x) => x.id === 'omnimed');
  assert.equal(chipsOf(w.buildConclusionBlocks(itu))[0].attrs.details.duration, '5');
  assert.deepEqual(w.buildConclusionBlocks(null), []);
});

test('date d’une note antérieure : sans l’heure, en minuscules', () => {
  w.I18N.lang === 'fr'
    ? assert.equal(D.noteDayLabel('8 DÉCEMBRE 2025 09:15'), '8 décembre 2025')
    : assert.equal(D.noteDayLabel('JULY 2, 2026 1:45 PM'), 'July 2, 2026');
});

test('sans outils cliniques, le gabarit ITU propose l’analyse d’urine au lieu de l’outil', () => {
  const itu = D.NOTE_TEMPLATES.find((x) => x.key === 'itu');
  const plain = D.templateWithoutTool(itu);
  assert.equal(plain.tool, null);
  assert.deepEqual(chipsOf(w.buildTemplateBlocks(plain)).map((c) => c.attrs.type), ['lab']);
  assert.equal(itu.tool, 'itu', 'le gabarit d’origine ne change pas');
  const virus = D.NOTE_TEMPLATES.find((x) => x.key === 'virus');
  assert.equal(D.templateWithoutTool(virus), virus);
});

test('menu « / » sans outils cliniques : ni item Outils cliniques, ni outil dans la description du gabarit ITU', () => {
  w.__SHOW_CLINICAL_TOOLS = false;
  const items = w.filterSlashItems('itu');
  assert.equal(items.find((it) => it.key === 'tpl-itu').desc, w.TR('Structure + analyse d’urine proposée'));
  assert.ok(!w.filterSlashItems('').some((it) => it.ctPicker));
  w.__SHOW_CLINICAL_TOOLS = true;
  assert.equal(w.filterSlashItems('itu').find((it) => it.key === 'tpl-itu').desc, w.TR('Structure + outil clinique ITU'));
  delete w.__SHOW_CLINICAL_TOOLS;
});

test('sous un asthme, chaque fonction s’ouvre en contexte : /rx, /lab, /img (et les requêtes de la colonne)', () => {
  const dx = { name: w.TR('Asthme léger'), code: 'J45.9' };
  assert.deepEqual(keys(D.searchOrder('rx', '', dx).contexte), ['vento100', 'cat-35', 'cat-37', 'cat-39']);
  assert.deepEqual(keys(D.searchOrder('lab', '', dx).contexte), ['efr']);
  assert.deepEqual(keys(D.searchOrder('img', '', dx).contexte), ['rxpoumon']);
  assert.deepEqual(D.contextResultsFor(dx, 'req').map((it) => it.orderKind + ':' + it.key), ['lab:efr', 'img:rxpoumon']);
  D.endOrderSearch();
});

// Gabarits de visite (demande d'Ignacio Calvo, 2026-10-27) : proposés dans la
// colonne tant que la note est vide, avant les gabarits par maladie.
test('gabarits de visite : première rencontre, suivi, problème aigu, examen périodique ; atteints aussi par la raison', () => {
  assert.deepEqual(D.NOTE_TEMPLATES.filter((tpl) => tpl.general).map((tpl) => tpl.key), ['premiere', 'suivi', 'aigu', 'periodique']);
  D.NOTE_TEMPLATES.filter((tpl) => tpl.general).forEach((tpl) => {
    assert.ok(D.SLASH_ITEMS.some((it) => it.noteTemplate === tpl.key), tpl.key + ' : au menu « / »');
  });
  assert.deepEqual(D.templatesForReason('Suivi du diabète').map((tpl) => tpl.key), ['suivi']);
  assert.deepEqual(D.templatesForReason('Follow-up for hypertension').map((tpl) => tpl.key), ['suivi']);
  assert.deepEqual(D.templatesForReason('Nouveau patient').map((tpl) => tpl.key), ['premiere']);
  assert.ok(w.docIsBlank(w.DEFAULT_DOC()), 'une note neuve est vide : la colonne propose les gabarits de visite');
});
