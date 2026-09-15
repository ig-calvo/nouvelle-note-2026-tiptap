/* global window */
// =========================================================
// note-sections.jsx — logique pure de la séparation « Détails de la
// consultation » / « Conclusion ».
//
// La séparation est un NŒUD du document Tiptap (`sectionSplit`, voir
// editor-schema.jsx), pas un réglage à côté : sa position vit donc dans le
// JSON de la note, elle est sauvegardée et rechargée avec elle (brouillon,
// note complétée, « depuis la dernière note ») sans stockage parallèle, et
// elle suit naturellement les insertions/suppressions de contenu.
//
// Ce fichier ne contient QUE des fonctions pures sur le JSON — aucun DOM,
// aucun React, aucune dépendance à window.Tiptap. C'est ce qui permet de le
// couvrir par des tests exécutables hors navigateur (tests/note-sections.test.mjs)
// et de le charger avant editor-schema.jsx.
//
// Vocabulaire : un « slot » est une frontière entre deux blocs de premier
// niveau, comptée en ignorant le séparateur lui-même. Pour N blocs de
// contenu il y a N+1 slots (0 = tout en conclusion, N = conclusion vide).
// =========================================================

const SECTION_SPLIT = 'sectionSplit';

// Étiquette du bloc de conclusion. Sert à la fois de libellé permanent dans
// l'éditeur (au-dessus de la ligne) et de titre de l'aperçu dans la liste.
const CONCLUSION_LABEL = 'Conclusion';

function splitNode() { return { type: SECTION_SPLIT }; }

function topBlocks(docJson) {
  return (docJson && docJson.content) || [];
}

// Index du séparateur dans doc.content, ou -1. Comme tous les blocs qui le
// précèdent sont des blocs de contenu, cet index EST aussi son slot.
function splitSlot(docJson) {
  const content = topBlocks(docJson);
  for (let i = 0; i < content.length; i++) {
    if (content[i] && content[i].type === SECTION_SPLIT) return i;
  }
  return -1;
}

// Nombre de blocs de contenu (séparateur exclu) = slot maximal atteignable.
function splitMaxSlot(docJson) {
  return topBlocks(docJson).filter(function (n) { return !n || n.type !== SECTION_SPLIT; }).length;
}

// { details, conclusion, hasSplit } — les deux zones délimitées par la ligne.
// Sans séparateur (documents d'avant cette fonctionnalité), tout est dans les
// détails et la conclusion est vide : jamais d'erreur, jamais de devinette.
function splitDoc(docJson) {
  const content = topBlocks(docJson);
  const at = splitSlot(docJson);
  if (at < 0) return { details: content.slice(), conclusion: [], hasSplit: false };
  return { details: content.slice(0, at), conclusion: content.slice(at + 1), hasSplit: true };
}

function detailsBlocks(docJson) { return splitDoc(docJson).details; }
function conclusionBlocks(docJson) { return splitDoc(docJson).conclusion; }

// « Vide » au sens de docIsBlank (editor-schema.jsx) : les titres de section
// sont structurels et ne comptent pas comme du contenu saisi — une conclusion
// réduite à « Conclusion » + un paragraphe vide reste une conclusion vide.
function blocksAreBlank(blocks) {
  let blank = true;
  function walk(node) {
    if (!blank || !node) return;
    if (node.type === 'heading' || node.type === SECTION_SPLIT) return;
    if (node.type === 'text' && node.text && node.text.trim()) { blank = false; return; }
    if (node.type === 'chip' || node.type === 'reference' ||
        node.type === 'diagnosticRegion' || node.type === 'clinicalTool') { blank = false; return; }
    (node.content || []).forEach(walk);
  }
  (blocks || []).forEach(walk);
  return blank;
}

function conclusionIsEmpty(docJson) { return blocksAreBlank(conclusionBlocks(docJson)); }

// Nombre de blocs de contenu réellement porteurs de texte/entités sous la
// ligne — ce que la synthèse vocale annonce (aria-valuetext).
function conclusionLineCount(docJson) {
  return conclusionBlocks(docJson).filter(function (b) { return !blocksAreBlank([b]); }).length;
}

// Déplace le séparateur au slot demandé (borné). Retourne un NOUVEAU document ;
// n'altère jamais celui reçu.
function withSplitAtSlot(docJson, slot) {
  const content = topBlocks(docJson);
  const bare = content.filter(function (n) { return !n || n.type !== SECTION_SPLIT; });
  const target = Math.max(0, Math.min(slot, bare.length));
  const next = bare.slice(0, target).concat([splitNode()], bare.slice(target));
  return Object.assign({}, docJson, { type: (docJson && docJson.type) || 'doc', content: next });
}

// Garantit exactement un séparateur dans le document — appelé sur tout
// contenu venu d'ailleurs (brouillon repris, dernière note, gabarit, note
// d'avant la fonctionnalité).
//
// Trois cas :
//  1. déjà un séparateur → on retire les doublons éventuels (copier-coller
//     d'une sélection qui en contenait un) et on garde le premier ;
//  2. un Titre 2 « Conclusion » de premier niveau (l'ancienne façon de
//     marquer la conclusion, encore produite par les gabarits de note) → il
//     DEVIENT la ligne, à sa place exacte : aucune note ne perd sa structure ;
//  3. rien → la ligne est posée à la fin, conclusion vide, avec un paragraphe
//     pour pouvoir y écrire.
function ensureSplit(docJson) {
  const base = docJson && docJson.content ? docJson : { type: 'doc', content: [] };
  const content = topBlocks(base);
  let seen = false;
  const deduped = content.filter(function (n) {
    if (!n || n.type !== SECTION_SPLIT) return true;
    if (seen) return false;
    seen = true;
    return true;
  });
  if (seen) return Object.assign({}, base, { content: deduped });

  const headingIdx = deduped.findIndex(function (n) {
    return n && n.type === 'heading' && headingText(n).toLowerCase() === CONCLUSION_LABEL.toLowerCase();
  });
  if (headingIdx >= 0) {
    const next = deduped.slice();
    next.splice(headingIdx, 1, splitNode());
    return Object.assign({}, base, { content: next });
  }
  return Object.assign({}, base, { content: deduped.concat([splitNode(), { type: 'paragraph' }]) });
}

function headingText(node) {
  return (node.content || []).map(function (c) { return c.text || ''; }).join('').trim();
}

// Ordonnée à l'écran de la frontière `slot`. Au-dessus du premier bloc, sous
// le dernier, et à mi-chemin entre deux blocs voisins ailleurs.
// `rects` = les rectangles des blocs de contenu (séparateur exclu), dans
// l'ordre du document. Fonctions géométriques pures, donc testables sans DOM.
function boundaryY(rects, slot) {
  const list = rects || [];
  if (!list.length) return 0;
  if (slot <= 0) return list[0].top;
  if (slot >= list.length) return list[list.length - 1].bottom;
  return (list[slot - 1].bottom + list[slot].top) / 2;
}

// Slot le plus proche d'une ordonnée à l'écran — cœur de l'ancrage du drag :
// la ligne ne se pose jamais au pixel près, toujours sur une frontière de bloc.
// Même fonction que l'indicateur de dépôt affiché pendant le glisser : ce que
// l'utilisateur voit est exactement là où la ligne se posera.
function boundarySlotFromY(rects, y) {
  const list = rects || [];
  if (!list.length) return 0;
  let best = 0;
  let bestDist = Infinity;
  for (let slot = 0; slot <= list.length; slot++) {
    const dist = Math.abs(y - boundaryY(list, slot));
    if (dist < bestDist) { bestDist = dist; best = slot; }
  }
  return best;
}

// Frontière de bloc la plus proche d'une position, parmi celles fournies.
// Sert à reposer la ligne après une suppression qui l'aurait emportée : une
// ligne doit toujours atterrir entre deux blocs, jamais au milieu de l'un.
function nearestBoundary(bounds, pos) {
  const list = bounds || [];
  if (!list.length) return 0;
  let best = list[0];
  for (let i = 1; i < list.length; i++) {
    if (Math.abs(list[i] - pos) < Math.abs(best - pos)) best = list[i];
  }
  return best;
}

// Plan de déplacement de la ligne dans le document VIVANT (positions
// ProseMirror) : quoi supprimer, où réinsérer. Isolé ici parce que c'est
// l'arithmétique délicate du déplacement — la même pour le glisser, les
// flèches du clavier et les boutons ▲/▼ — et qu'elle se teste sans éditeur.
// `insertAt` est exprimé dans les coordonnées d'AVANT la suppression :
// l'appelant le fait passer par le mapping de sa transaction.
// Retourne null quand il n'y a rien à faire (ligne déjà au bon endroit).
function splitMovePlan(plan) {
  const positions = plan.blockPositions || [];
  const target = Math.max(0, Math.min(plan.targetSlot, positions.length));
  if (target === plan.currentSlot) return null;
  return {
    slot: target,
    from: plan.splitPos,
    to: plan.splitPos + plan.splitSize,
    insertAt: target < positions.length ? positions[target] : plan.docSize
  };
}

// Texte annoncé par les lecteurs d'écran (aria-valuetext du role="separator").
function splitAriaValueText(docJson) {
  const total = splitMaxSlot(docJson);
  const inConclusion = conclusionLineCount(docJson);
  if (inConclusion === 0) return 'Conclusion vide';
  return inConclusion + (inConclusion > 1 ? ' lignes' : ' ligne') + ' sur ' + total + ' dans la conclusion';
}

Object.assign(window, {
  SECTION_SPLIT,
  CONCLUSION_LABEL,
  splitSlot,
  splitMaxSlot,
  splitDoc,
  detailsBlocks,
  conclusionBlocks,
  blocksAreBlank,
  conclusionIsEmpty,
  conclusionLineCount,
  withSplitAtSlot,
  ensureSplit,
  boundaryY,
  boundarySlotFromY,
  nearestBoundary,
  splitMovePlan,
  splitAriaValueText
});
