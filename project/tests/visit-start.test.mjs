// Points de départ de la visite et flux de Sacha (rencontre vision
// 2026-10-27, lot 3 de PLAN-suggestions-contextuelles.md) : choisir un ou
// plusieurs points de départ, un gabarit de début selon ces choix, puis des
// diagnostics suggérés par ce gabarit.
// Lancer : node --test project/tests/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPrototype } from './harness.mjs';

const w = loadPrototype(['note-ui/note-sections.jsx', 'note-ui/diagnostics.jsx', 'note-ui/editor-data.jsx', 'note-ui/editor-schema.jsx']);
const D = w.NOTE_DATA;
const ctx = () => ({ appointment: D.VISIT_APPOINTMENT, results: D.RESULTS_TO_FOLLOW, sommaire: w.getSommaireDiagnostics() });
const byId = (points, ...ids) => points.filter((p) => ids.includes(p.id));

test('points de départ : la raison du rendez-vous, les résultats à suivre, les problèmes actifs (pas les antécédents)', () => {
  const pts = D.visitStartPoints(ctx());
  assert.deepEqual(pts.map((p) => p.kind), ['raison', 'resultat', 'probleme', 'probleme']);
  assert.deepEqual(pts.filter((p) => p.kind === 'probleme').map((p) => p.label), [w.TR('Asthme léger'), w.TR('Rhinite allergique')]);
  assert.ok(pts.every((p) => p.label && p.text && p.short));
  assert.deepEqual(D.visitStartPoints({}), []);
});

test('gabarit de début selon les points choisis ; raison de consultation = les points, dans l’ordre', () => {
  const pts = D.visitStartPoints(ctx());
  assert.deepEqual(D.startTemplatesFor(byId(pts, 'raison')).map((x) => x.key), ['itu']);
  assert.deepEqual(D.startTemplatesFor(byId(pts, 'pb:som-asthme')), []);
  const two = byId(pts, 'raison', 'pb:som-asthme');
  assert.equal(D.visitReason(two), [w.TR('Brûlures mictionnelles depuis 3 jours'), w.TR('Asthme léger')].join(' · '));
});

test('note de départ : gabarit sans outil, ligne de suivi en tête, problème repris en diagnostic relié au dossier', () => {
  const pts = byId(D.visitStartPoints(ctx()), 'raison', 'res:res-a1c', 'pb:som-asthme');
  const doc = w.buildVisitStartDoc(pts, 'itu', { showTools: false });
  const types = doc.content.map((n) => n.type);
  assert.equal(doc.content[0].type, 'paragraph');
  assert.match(doc.content[0].content[0].text, /HbA1c/);
  assert.ok(!types.includes('clinicalTool'), 'sans outils cliniques : pas de feuille de route');
  assert.ok(types.indexOf('sectionSplit') > 0);
  const region = doc.content[doc.content.length - 1];
  assert.equal(region.type, 'diagnosticRegion');
  assert.equal(region.attrs.sommaireId, 'som-asthme');
  assert.equal(region.attrs.code, 'J45.9');
  assert.ok(types.indexOf('sectionSplit') < types.lastIndexOf('diagnosticRegion'), 'le problème va dans la conclusion');
  const chips = [];
  const walk = (n) => { if (n.type === 'chip') chips.push(n); (n.content || []).forEach(walk); };
  walk(doc);
  assert.deepEqual(chips.map((c) => [c.attrs.type, c.attrs.pending]), [['lab', true]], 'l’analyse d’urine du gabarit, en attente');
});

test('note de départ avec outils cliniques, ou sans gabarit', () => {
  const pts = byId(D.visitStartPoints(ctx()), 'raison');
  assert.ok(w.buildVisitStartDoc(pts, 'itu', { showTools: true }).content.some((n) => n.type === 'clinicalTool'));
  const blank = w.buildVisitStartDoc(pts, null, {});
  assert.deepEqual(blank.content.map((n) => n.type), ['paragraph', 'sectionSplit', 'paragraph']);
});

test('flux de Sacha : chaque diagnostic suggéré par un gabarit est codé, et ceux du gabarit ITU ont leur gabarit de conclusion', () => {
  D.NOTE_TEMPLATES.filter((x) => x.dxSuggestions).forEach((tpl) => {
    assert.ok(tpl.dxSuggestions.length >= 3 && tpl.dxSuggestions.length <= 4, tpl.key);
    tpl.dxSuggestions.forEach((d) => assert.match(d.code, /^[A-Z]\d{2}(\.\d)?$/, `${tpl.key} ${d.name}`));
  });
  const pneumonie = D.NOTE_TEMPLATES.find((x) => x.key === 'virus').dxSuggestions.find((d) => d.code === 'J18.9');
  const opts = D.dxConclusionOptions({ name: pneumonie.name, code: pneumonie.code }, { notes: [], sommaire: [] });
  assert.deepEqual(opts.map((o) => o.id), ['omnimed'], 'clic sur Pneumonie : le gabarit pneumonie personnalise la conclusion');
  assert.equal(D.NOTE_TEMPLATES.find((x) => x.key === 'periodique').dxSuggestions, undefined);
});
