// Sélection de /lab dans la ligne de la note (batch 2 de Vanessa Bois, flows
// « Laboratoire - flow baseline » et « Recherche par catégorie de laboratoire »,
// 2026-11-04) : une analyse choisie — cochée, ou résolue par une virgule —
// devient une puce « FSC ✕ » dans la ligne ; un clic en dehors du menu ou
// Entrée crée la tuile. Les décorations et le clavier ne tournent pas hors
// navigateur : ici, le découpage des termes (`labPendingParts`), les libellés
// des puces (`labChipLabel`) et, en lecture du source, le branchement.
// Lancer : node --test project/tests/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { loadPrototype, projectDir } from './harness.mjs';

const w = loadPrototype(['note-ui/note-sections.jsx', 'note-ui/diagnostics.jsx', 'note-ui/editor-data.jsx', 'note-ui/editor-schema.jsx']);
const D = w.NOTE_DATA;
const read = (rel) => fs.readFileSync(path.join(projectDir, rel), 'utf8');

test('chaque terme suivi d’une virgule est une partie : décalages, analyse trouvée, terme en cours', () => {
  const r = D.labPendingParts('fsc, tsh, cu');
  assert.deepEqual(r.parts.map((p) => [p.start, p.end, p.text, p.item && p.item.key]), [[0, 4, 'fsc', 'fsc'], [4, 9, 'tsh', 'tsh']]);
  assert.equal(r.hideTo, 9, 'le texte déjà résolu, virgules comprises');
  assert.equal(r.current, ' cu');
  // « fsc, tsh, cu » : le terme retiré par ✕ s'enlève du texte par ses décalages.
  const text = 'fsc, tsh, cu';
  assert.equal(text.slice(0, r.parts[0].start) + text.slice(r.parts[0].end).replace(/^ /, ''), 'tsh, cu');
});

test('sans virgule : aucune partie, tout le terme est en cours', () => {
  const r = D.labPendingParts('fsc');
  assert.deepEqual([r.parts.length, r.hideTo, r.current], [0, 0, 'fsc']);
  assert.deepEqual(D.labPendingParts(''), { parts: [], hideTo: 0, current: '' });
  assert.deepEqual(D.labPendingParts(null), { parts: [], hideTo: 0, current: '' });
});

test('termes vides ignorés, terme introuvable gardé sans analyse', () => {
  const r = D.labPendingParts('fsc,, zzzz,');
  assert.deepEqual(r.parts.map((p) => [p.text, !!p.item]), [['fsc', true], ['zzzz', false]]);
  assert.equal(r.hideTo, 'fsc,, zzzz,'.length, 'tout est résolu : rien n’est en cours');
  assert.equal(r.current, '');
  assert.deepEqual(D.labPendingParts('fsc, tsh,').parts.map((p) => p.item.key), ['fsc', 'tsh'], 'même résolution que orderBatch');
  assert.deepEqual(D.orderBatch('lab', 'fsc, tsh,').picks.map((p) => p.item.key), ['fsc', 'tsh']);
});

test('libellé d’une puce de sélection : l’acronyme, le nom sans acronyme, le nom d’un bilan', () => {
  const lab = (key) => D.ORDER_DEFS.lab.items().find((it) => it.key === key);
  assert.equal(D.labChipLabel(lab('fsc')), w.TR('FSC'));
  assert.equal(D.labChipLabel(lab('tsh')), w.TR('TSH'));
  assert.equal(D.labChipLabel(D.ORDER_DEFS.lab.items().find((it) => it.name === w.TR('Fibrinogène'))), w.TR('Fibrinogène'));
  assert.equal(D.labChipLabel(lab('lipide')), w.TR('Bilan lipidique'), 'un bilan garde son nom');
  assert.equal(D.labChipLabel(null), '');
});

test('branchement : le plugin des puces, le clic en dehors qui crée la tuile, le menu qui ignore les puces', () => {
  const schema = read('note-ui/editor-schema.jsx');
  assert.match(schema, /orderHintPlugin\(\),\s*labPendingChipsPlugin\(\)/, 'le plugin est dans l’extension « / »');
  assert.match(schema, /Decoration\.inline\(p\.slashFrom, p\.termFrom \+ info\.hideTo, \{ class: 'slash-hidden' \}\)/);
  assert.match(schema, /buildSlashExtension, clearLabPendingParts,/);
  const field = read('note-ui/editor-field.jsx');
  assert.match(field, /closeOutside\(\) \{/);
  assert.match(field, /onClose=\{\(\) => \{ if \(slashApiRef\.current\) slashApiRef\.current\.closeOutside\(\); else setSlash\(null\); \}\} \/>\s*\}\s*\{\/\* Mode diagnostic/);
  assert.match(field, /if \(pending\.length && range\) commitPendingTile\(range, query, pending, parsedExit\.kind\);/);
  assert.match(field, /syncLabPending\(parsed\.mode === 'order' && parsed\.kind === 'lab'\);/);
  const popover = read('note-ui/editor-popover.jsx');
  assert.match(popover, /closest\('\.pchips'\)\) return;/, 'un clic sur ✕ n’est pas « en dehors »');
  assert.match(popover, /batch && batch\.length > 0 && kind !== 'lab' && <BatchList/, 'la liste du lot est remplacée par les puces en labo');
  assert.match(popover, /pickedCount = checkedKeys\.length \+ \(kind === 'lab' && batch \? batch\.filter\(\(p\) => p\.item\)\.length : 0\)/);
});
