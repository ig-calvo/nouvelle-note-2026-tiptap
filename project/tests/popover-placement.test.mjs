// Ouverture du formulaire d'une puce (lot 6) : sous la puce, au-dessus,
// centré ou en bottom sheet, sans jamais déborder de l'écran.
// Lancer : node --test project/tests/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPrototype } from './harness.mjs';

const w = loadPrototype(['note-ui/popover-placement.jsx']);
const vp = { w: 1440, h: 900 };
const at = (top) => ({ top, bottom: top + 24, left: 300 });
const place = (mode, anchorTop, h, extra) => w.choosePopoverPlacement(Object.assign({ mode, anchor: at(anchorTop), size: { w: 600, h }, viewport: vp }, extra || {}));
const inside = (p, h) => p.top >= 12 && p.top + Math.min(h, p.maxHeight) <= vp.h - 12;

test('auto : sous la puce quand il y tient en entier', () => {
  const p = place('auto', 100, 500);
  assert.equal(p.kind, 'below');
  assert.equal(p.top, 132);
});

test('auto : au-dessus quand il ne tient pas dessous mais tient dessus', () => {
  const p = place('auto', 700, 500);
  assert.equal(p.kind, 'above');
  assert.equal(p.top, 700 - 8 - 500);
  assert.ok(inside(p, 500));
});

test('auto : centré quand il ne tient d’aucun côté — jamais tronqué, jamais de défilement de la note', () => {
  const p = place('auto', 400, 600);
  assert.equal(p.kind, 'center');
  assert.equal(p.top, 150);
  assert.equal(p.left, 420);
  assert.ok(inside(p, 600));
});

test('sous (RA-03) : reste sous la puce avec un corps qui défile dès 320 px', () => {
  const p = place('sous', 400, 600);
  assert.equal(p.kind, 'below');
  assert.equal(p.maxHeight, 900 - 424 - 8 - 12);
});

test('centré : toujours au centre, même s’il y a la place dessous', () => {
  assert.equal(place('centre', 100, 300).kind, 'center');
});

test('bottom sheet : largeur de la colonne, collé au bas, 60 % de la hauteur au plus', () => {
  const p = place('sheet', 100, 800, { column: { left: 140, width: 900 } });
  assert.deepEqual([p.kind, p.left, p.width, p.maxHeight, p.top], ['sheet', 140, 900, 540, 360]);
  const small = place('sheet', 100, 300, { column: { left: 140, width: 900 } });
  assert.equal(small.top, 600);
});

test('flip (petits panneaux) : le plus grand côté quand rien ne tient', () => {
  const p = w.choosePopoverPlacement({ mode: 'flip', anchor: at(300), size: { w: 260, h: 700 }, viewport: vp });
  assert.equal(p.kind, 'below');
  assert.equal(p.maxHeight, 900 - 324 - 8 - 12);
});

test('la gauche reste dans l’écran sur un écran étroit', () => {
  const p = w.choosePopoverPlacement({ mode: 'auto', anchor: { top: 100, bottom: 124, left: 900 }, size: { w: 600, h: 300 }, viewport: { w: 1024, h: 768 } });
  assert.equal(p.left, 1024 - 600 - 12);
});
