// =========================================================
// popover-placement.jsx — où ouvrir un panneau flottant ancré à une puce
// (rencontre inline entity : un formulaire trop grand ne doit ni déborder de
// l'écran, ni faire défiler la note). Pur (pas de DOM) : testé par
// tests/popover-placement.test.mjs, appliqué par placePopover
// (editor-popover.jsx).
//
// Modes (tweak « Ouverture du formulaire ») :
//   'auto'   — sous la puce s'il y tient en entier, sinon au-dessus s'il y
//              tient, sinon au centre de l'écran (la note ne défile jamais) ;
//   'sous'   — RA-03 : sous la puce tant qu'il y a 320 px (le corps défile),
//              sinon au-dessus, sinon pleine hauteur ;
//   'centre' — toujours au centre ;
//   'sheet'  — bottom sheet : ancré au bas de l'écran, largeur de la colonne
//              de la note, 60 % de la hauteur au plus ;
//   'flip'   — petits panneaux (éditeur d'un champ, révision) : sous la
//              puce, au-dessus s'il n'y a pas la place, sinon le plus grand
//              des deux côtés, hauteur plafonnée.
// Renvoie { kind: 'below'|'above'|'center'|'sheet', top, left, maxHeight,
// width? } en px, viewport (position: fixed).
// =========================================================
const POPOVER_MARGIN = 12;
const POPOVER_GAP = 8;
const POPOVER_MIN_BODY = 320;

function choosePopoverPlacement(o) {
  const M = POPOVER_MARGIN, GAP = POPOVER_GAP;
  const vw = o.viewport.w, vh = o.viewport.h;
  const w = Math.min(o.size.w, vw - 2 * M), h = o.size.h;
  const a = o.anchor;
  const below = vh - a.bottom - GAP - M;
  const above = a.top - GAP - M;
  const left = Math.max(M, Math.min(a.left, vw - w - M));
  const mode = o.mode || 'auto';
  const full = vh - 2 * M;

  function place(kind, top, maxHeight) { return { kind: kind, top: Math.round(top), left: Math.round(left), maxHeight: Math.round(maxHeight) }; }
  function centered() {
    const hh = Math.min(h, full);
    return { kind: 'center', top: Math.round((vh - hh) / 2), left: Math.round(Math.max(M, (vw - w) / 2)), maxHeight: Math.round(full) };
  }

  if (mode === 'sheet') {
    const col = o.column || { left: 0, width: vw };
    const maxH = Math.round(vh * 0.6);
    const hh = Math.min(h, maxH);
    return { kind: 'sheet', top: Math.round(vh - hh), left: Math.round(col.left), width: Math.round(col.width), maxHeight: maxH };
  }
  if (mode === 'centre') return centered();
  if (h <= below) return place('below', a.bottom + GAP, below);
  if (mode === 'sous') {
    if (below >= POPOVER_MIN_BODY) return place('below', a.bottom + GAP, below);
    if (h <= above) return place('above', a.top - GAP - h, above);
    if (above >= POPOVER_MIN_BODY) return place('above', a.top - GAP - above, above);
    return place('below', M, full);
  }
  if (h <= above) return place('above', a.top - GAP - h, above);
  if (mode === 'flip') {
    return below >= above ? place('below', a.bottom + GAP, below) : place('above', M, above);
  }
  return centered();
}

window.choosePopoverPlacement = choosePopoverPlacement;
