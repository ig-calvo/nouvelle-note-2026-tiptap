// Ligne de séparation Détails de la consultation / Conclusion.
// Lancer : node --test project/tests/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPrototype, doc, H2, P, SPLIT, CHIP, textOf } from './harness.mjs';

const w = loadPrototype();

// ---------------------------------------------------------------------------
// Découpage du document par la ligne
// ---------------------------------------------------------------------------
test('la ligne découpe la note en détails (au-dessus) et conclusion (en dessous)', () => {
  const d = doc(H2(w.TR('Détails de la consultation')), P('Toux depuis 3 jours'), SPLIT, P('Impression : IVRS'));
  const { details, conclusion, hasSplit } = w.splitDoc(d);
  assert.equal(hasSplit, true);
  assert.deepEqual(textOf(details), [w.TR('Détails de la consultation'), 'Toux depuis 3 jours']);
  assert.deepEqual(textOf(conclusion), ['Impression : IVRS']);
});

test('un document sans ligne met tout dans les détails, sans planter', () => {
  const d = doc(H2(w.TR('Détails')), P('Texte'));
  const { details, conclusion, hasSplit } = w.splitDoc(d);
  assert.equal(hasSplit, false);
  assert.equal(details.length, 2);
  assert.deepEqual(conclusion, []);
  assert.equal(w.conclusionIsEmpty(d), true);
});

test('le document par défaut a une ligne et une conclusion vide', () => {
  const d = w.DEFAULT_DOC();
  assert.equal(w.splitSlot(d), 1); // le titre « Détails de la consultation » n'est plus dans le document
  assert.equal(w.conclusionIsEmpty(d), true);
  assert.equal(d.content.some((n) => n.type === 'heading'), false);
  // Le Titre 2 « Conclusion » d'avant est bien remplacé par la ligne.
  assert.equal(textOf(d.content).includes(w.TR('Conclusion')), false);
});

test('le titre « Détails de la consultation » est hors de l’éditeur : ensureSplit le retire des anciens documents', () => {
  const vieux = doc(H2(w.TR('Détails de la consultation')), P('Toux'), SPLIT, P('Impression'));
  const d = w.ensureSplit(vieux);
  assert.deepEqual(textOf(d.content), ['Toux', '---', 'Impression']);
  assert.equal(w.splitSlot(d), 1);
  assert.equal(vieux.content.length, 4); // le document reçu n'est pas modifié
  // Sans séparateur (note d'avant la ligne) : le titre part aussi, la ligne est ajoutée à la fin.
  const sans = w.ensureSplit(doc(H2(w.TR('Détails de la consultation')), P('Toux')));
  assert.equal(textOf(sans.content)[0], 'Toux');
  assert.equal(sans.content.some((n) => n.type === 'heading'), false);
  assert.equal(w.splitSlot(sans), 1);
  // Un autre Titre 2 reste en place ; la casse du titre ne compte pas.
  assert.equal(textOf(w.ensureSplit(doc(H2(w.DETAILS_LABEL.toUpperCase()), P('a'))).content)[0], 'a');
  assert.deepEqual(textOf(w.ensureSplit(doc(H2(w.TR('Examen')), P('a'))).content).slice(0, 2), [w.TR('Examen'), 'a']);
});

test('un Titre 2 de gabarit clôt la première zone, pas le vieux titre « Détails de la consultation »', () => {
  const idx = (d) => w.endOfFirstSectionIndexJSON(d);
  assert.equal(idx(doc(H2(w.TR('Détails de la consultation')), P('a'), H2(w.TR('Examen')), P('b'))), 2);
  assert.equal(idx(doc(P('a'), H2(w.TR('Examen')), P('b'))), 1);
  assert.equal(idx(doc(P('a'), SPLIT, P('b'))), 1);
});

// ---------------------------------------------------------------------------
// Déplacement — drag basique
// ---------------------------------------------------------------------------
test('déplacer la ligne fait passer une ligne de note des détails à la conclusion', () => {
  const before = doc(H2(w.TR('Détails')), P('Ligne A'), P('Ligne B'), SPLIT, P('Plan : repos'));
  assert.equal(w.splitSlot(before), 3);

  const after = w.withSplitAtSlot(before, 2); // remonter d'un bloc
  assert.equal(w.splitSlot(after), 2);
  assert.deepEqual(textOf(w.detailsBlocks(after)), [w.TR('Détails'), 'Ligne A']);
  assert.deepEqual(textOf(w.conclusionBlocks(after)), ['Ligne B', 'Plan : repos']);
});

test('withSplitAtSlot ne modifie pas le document reçu', () => {
  const before = doc(H2(w.TR('Détails')), P('A'), SPLIT, P('B'));
  const snapshot = JSON.stringify(before);
  w.withSplitAtSlot(before, 0);
  assert.equal(JSON.stringify(before), snapshot);
});

test('le slot demandé est borné aux extrémités du document', () => {
  const d = doc(H2(w.TR('Détails')), P('A'), SPLIT, P('B'));
  const max = w.splitMaxSlot(d); // 3 blocs de contenu
  assert.equal(max, 3);

  assert.equal(w.splitSlot(w.withSplitAtSlot(d, -5)), 0);   // tout en conclusion
  assert.equal(w.splitSlot(w.withSplitAtSlot(d, 99)), max); // conclusion vide
  assert.equal(w.conclusionIsEmpty(w.withSplitAtSlot(d, max)), true);
  assert.equal(w.detailsBlocks(w.withSplitAtSlot(d, 0)).length, 0);
});

test('déplacer puis revenir redonne exactement le document de départ', () => {
  const d = doc(H2(w.TR('Détails')), P('A'), P('B'), SPLIT, P('C'));
  const moved = w.withSplitAtSlot(d, 1);
  const back = w.withSplitAtSlot(moved, 3);
  assert.deepEqual(back.content, d.content);
});

// ---------------------------------------------------------------------------
// Ancrage du glisser aux frontières de blocs (jamais au pixel)
// ---------------------------------------------------------------------------
test('le glisser s’ancre sur la frontière de bloc la plus proche', () => {
  // 3 blocs de 20px, collés : [0-20], [20-40], [40-60].
  const rects = [{ top: 0, bottom: 20 }, { top: 20, bottom: 40 }, { top: 40, bottom: 60 }];
  assert.equal(w.boundarySlotFromY(rects, 0), 0);    // tout en haut
  assert.equal(w.boundarySlotFromY(rects, 3), 0);    // proche du haut → slot 0
  assert.equal(w.boundarySlotFromY(rects, 18), 1);   // proche de la frontière 20
  assert.equal(w.boundarySlotFromY(rects, 33), 2);   // proche de la frontière 40
  assert.equal(w.boundarySlotFromY(rects, 58), 3);   // tout en bas
  assert.equal(w.boundarySlotFromY(rects, 9999), 3); // relâché hors de la note
  assert.equal(w.boundarySlotFromY(rects, -9999), 0);
});

test('le glisser rend toujours un slot entier valide, jamais une position libre', () => {
  const rects = [{ top: 0, bottom: 20 }, { top: 24, bottom: 44 }];
  for (let y = -50; y <= 100; y += 1) {
    const slot = w.boundarySlotFromY(rects, y);
    assert.ok(Number.isInteger(slot), 'slot entier');
    assert.ok(slot >= 0 && slot <= rects.length, 'slot dans les bornes');
  }
});

test('l’indicateur de dépôt est posé exactement sur la frontière visée', () => {
  const rects = [{ top: 0, bottom: 20 }, { top: 24, bottom: 44 }, { top: 48, bottom: 68 }];
  assert.equal(w.boundaryY(rects, 0), 0);    // au-dessus du premier bloc
  assert.equal(w.boundaryY(rects, 1), 22);   // entre le 1er et le 2e
  assert.equal(w.boundaryY(rects, 2), 46);   // entre le 2e et le 3e
  assert.equal(w.boundaryY(rects, 3), 68);   // sous le dernier
  assert.equal(w.boundaryY(rects, 99), 68, 'borné au bas');
  assert.equal(w.boundaryY(rects, -5), 0, 'borné au haut');
  assert.equal(w.boundaryY([], 2), 0);
});

test('le trait affiché pendant le glisser est bien celui où la ligne se posera', () => {
  // La même frontière doit gouverner l'aperçu et le dépôt : sinon la ligne
  // atterrit ailleurs que là où l'utilisateur la voit.
  const rects = [{ top: 0, bottom: 20 }, { top: 24, bottom: 44 }, { top: 48, bottom: 68 }];
  for (let y = -20; y <= 90; y += 1) {
    const slot = w.boundarySlotFromY(rects, y);
    const affiche = w.boundaryY(rects, slot);
    for (let autre = 0; autre <= rects.length; autre++) {
      assert.ok(Math.abs(y - affiche) <= Math.abs(y - w.boundaryY(rects, autre)) + 1e-9,
        'le slot retenu est le plus proche de ' + y);
    }
  }
});

test('glisser dans une note sans aucun bloc ne casse rien', () => {
  assert.equal(w.boundarySlotFromY([], 42), 0);
  assert.equal(w.boundarySlotFromY(undefined, 42), 0);
});

// ---------------------------------------------------------------------------
// Arithmétique du déplacement dans le document vivant (positions ProseMirror)
// ---------------------------------------------------------------------------
test('déplacer vers le bas réinsère la ligne avant le bloc visé', () => {
  // doc : [A@0, LIGNE@10, B@11, C@21], ligne au slot 1
  const plan = w.splitMovePlan({
    blockPositions: [0, 11, 21], splitPos: 10, splitSize: 1, docSize: 31,
    currentSlot: 1, targetSlot: 2
  });
  assert.deepEqual(plan, { slot: 2, from: 10, to: 11, insertAt: 21 });
});

test('déplacer tout en bas réinsère la ligne à la fin du document', () => {
  const plan = w.splitMovePlan({
    blockPositions: [0, 11, 21], splitPos: 10, splitSize: 1, docSize: 31,
    currentSlot: 1, targetSlot: 3
  });
  assert.equal(plan.insertAt, 31);
});

test('déplacer vers le slot courant ne produit aucune transaction', () => {
  const plan = w.splitMovePlan({
    blockPositions: [0, 11], splitPos: 10, splitSize: 1, docSize: 21,
    currentSlot: 1, targetSlot: 1
  });
  assert.equal(plan, null);
});

test('un slot hors bornes est ramené dans le document', () => {
  const base = { blockPositions: [0, 11, 21], splitPos: 10, splitSize: 1, docSize: 31, currentSlot: 1 };
  assert.equal(w.splitMovePlan({ ...base, targetSlot: -3 }).slot, 0);
  assert.equal(w.splitMovePlan({ ...base, targetSlot: 42 }).slot, 3);
});

test('une ligne rescapée d’une suppression se repose sur une frontière de bloc', () => {
  // Frontières de blocs de premier niveau d'un document ProseMirror.
  const bounds = [0, 12, 20, 34];
  assert.equal(w.nearestBoundary(bounds, 0), 0);
  assert.equal(w.nearestBoundary(bounds, 13), 12);
  assert.equal(w.nearestBoundary(bounds, 18), 20);
  assert.equal(w.nearestBoundary(bounds, 999), 34, 'jamais au-delà du document');
  assert.equal(w.nearestBoundary(bounds, -999), 0);
  assert.equal(w.nearestBoundary([], 5), 0, 'document vidé');
});

// ---------------------------------------------------------------------------
// Accessibilité clavier (WCAG 2.1.1 / OMNI31)
// ---------------------------------------------------------------------------
test('les flèches déplacent la ligne d’un bloc et s’arrêtent aux extrémités', () => {
  let d = doc(H2(w.TR('Détails')), P('A'), SPLIT, P('B'));
  const max = w.splitMaxSlot(d); // 3

  const arrowUp = (x) => w.withSplitAtSlot(x, w.splitSlot(x) - 1);
  const arrowDown = (x) => w.withSplitAtSlot(x, w.splitSlot(x) + 1);

  d = arrowUp(d); assert.equal(w.splitSlot(d), 1);
  d = arrowUp(d); assert.equal(w.splitSlot(d), 0);
  d = arrowUp(d); assert.equal(w.splitSlot(d), 0, 'butée haute, pas de débordement');

  d = arrowDown(d); assert.equal(w.splitSlot(d), 1);
  for (let i = 0; i < 10; i++) d = arrowDown(d);
  assert.equal(w.splitSlot(d), max, 'butée basse, pas de débordement');
});

test('Origine et Fin envoient la ligne aux deux extrémités', () => {
  const d = doc(H2(w.TR('Détails')), P('A'), P('B'), SPLIT, P('C'));
  const home = w.withSplitAtSlot(d, 0);
  const end = w.withSplitAtSlot(d, w.splitMaxSlot(d));
  assert.equal(w.detailsBlocks(home).length, 0);
  assert.equal(w.conclusionBlocks(end).length, 0);
});

test('aria-valuetext décrit la conclusion en toutes lettres', () => {
  const d = doc(H2(w.TR('Détails')), P('A'), P('B'), SPLIT, P('C'));
  assert.equal(w.splitAriaValueText(d), w.tn('sections.split.lines.aria', 1, { total: 4 }));
  assert.equal(w.splitAriaValueText(w.withSplitAtSlot(d, 2)), w.tn('sections.split.lines.aria', 2, { total: 4 }));
  assert.equal(w.splitAriaValueText(w.withSplitAtSlot(d, 4)), w.TR('Conclusion vide'));
});

test('aria-valuenow reste dans [aria-valuemin, aria-valuemax]', () => {
  const d = doc(H2(w.TR('Détails')), P('A'), SPLIT, P('B'));
  for (let slot = -2; slot <= 6; slot++) {
    const moved = w.withSplitAtSlot(d, slot);
    assert.ok(w.splitSlot(moved) >= 0);
    assert.ok(w.splitSlot(moved) <= w.splitMaxSlot(moved));
  }
});

// ---------------------------------------------------------------------------
// Cas limites
// ---------------------------------------------------------------------------
test('note sans aucune ligne assignée à la conclusion → conclusion vide explicite', () => {
  const d = doc(H2(w.TR('Détails')), P('Toux'), SPLIT);
  assert.deepEqual(w.conclusionBlocks(d), []);
  assert.equal(w.conclusionIsEmpty(d), true);
  assert.equal(w.conclusionLineCount(d), 0);
});

test('un paragraphe vide sous la ligne ne compte pas comme une conclusion', () => {
  const d = doc(H2(w.TR('Détails')), P('Toux'), SPLIT, P(), P());
  assert.equal(w.conclusionIsEmpty(d), true);
});

test('un titre seul sous la ligne ne compte pas comme une conclusion', () => {
  const d = doc(P('Toux'), SPLIT, H2('Plan'), P());
  assert.equal(w.conclusionIsEmpty(d), true);
});

test('une requête ou une prescription sous la ligne compte comme une conclusion', () => {
  const d = doc(P('Toux'), SPLIT, CHIP('Amoxicilline 500 mg'));
  assert.equal(w.conclusionIsEmpty(d), false);
  assert.equal(w.conclusionLineCount(d), 1);
});

test('note à une seule ligne de contenu : les deux positions restent atteignables', () => {
  const une = doc(P('Patient vu pour renouvellement'), SPLIT);
  assert.equal(w.splitMaxSlot(une), 1);
  assert.equal(w.conclusionIsEmpty(une), true);

  const tout = w.withSplitAtSlot(une, 0);
  assert.deepEqual(w.detailsBlocks(tout), []);
  assert.deepEqual(textOf(w.conclusionBlocks(tout)), ['Patient vu pour renouvellement']);
  assert.equal(w.conclusionIsEmpty(tout), false);
});

test('note entièrement vide : la ligne existe, les deux zones sont vides', () => {
  const d = doc(SPLIT);
  assert.equal(w.splitSlot(d), 0);
  assert.equal(w.splitMaxSlot(d), 0);
  assert.equal(w.conclusionIsEmpty(d), true);
  assert.equal(w.splitSlot(w.withSplitAtSlot(d, 3)), 0);
});

test('les nouvelles lignes vont dans les détails, au-dessus de la ligne déplacée', () => {
  // La ligne a été remontée à la main : la conclusion contient déjà 2 blocs.
  const d = w.withSplitAtSlot(doc(H2(w.TR('Détails')), P('A'), P('B'), SPLIT, P('C')), 2);
  assert.equal(w.splitSlot(d), 2);

  // Point d'insertion utilisé par l'Assistant IA, la référence de passage et
  // le dépôt depuis le Sommaire (appendToFirstSection).
  const idx = w.endOfFirstSectionIndexJSON(d);
  assert.ok(idx <= w.splitSlot(d), 'insertion au-dessus de la ligne');

  const next = { ...d, content: [...d.content.slice(0, idx), P('Nouvelle ligne'), ...d.content.slice(idx)] };
  assert.ok(textOf(w.detailsBlocks(next)).includes('Nouvelle ligne'));
  assert.equal(textOf(w.conclusionBlocks(next)).includes('Nouvelle ligne'), false);
  assert.equal(w.conclusionLineCount(next), 2, 'la conclusion est inchangée');
});

test('la ligne borne l’insertion même quand la note a plusieurs Titres 2', () => {
  const d = doc(H2(w.TR('Détails')), P('A'), H2(w.TR('Examen physique')), P('B'), SPLIT, P('C'));
  const idx = w.endOfFirstSectionIndexJSON(d);
  assert.ok(idx <= w.splitSlot(d));
});

// ---------------------------------------------------------------------------
// Persistance par note
// ---------------------------------------------------------------------------
test('la position de la ligne survit à un aller-retour JSON (sauvegarde / relecture)', () => {
  const d = w.withSplitAtSlot(doc(H2(w.TR('Détails')), P('A'), P('B'), SPLIT, P('C')), 1);
  const relu = JSON.parse(JSON.stringify(d));
  assert.equal(w.splitSlot(relu), 1);
  assert.deepEqual(textOf(w.conclusionBlocks(relu)), ['A', 'B', 'C']);
});

test('deux notes gardent chacune sa propre position de ligne', () => {
  const base = doc(H2(w.TR('Détails')), P('A'), P('B'), SPLIT, P('C'));
  const note1 = w.withSplitAtSlot(base, 1);
  const note2 = w.withSplitAtSlot(base, 3);
  assert.equal(w.splitSlot(note1), 1);
  assert.equal(w.splitSlot(note2), 3);
  assert.equal(w.conclusionLineCount(note1), 3);
  assert.equal(w.conclusionLineCount(note2), 1);
  // Aucun réglage partagé : le document de départ est intact.
  assert.equal(w.splitSlot(base), 3);
});

test('un brouillon non complété conserve sa ligne à la reprise', () => {
  const brouillon = w.withSplitAtSlot(w.DEFAULT_DOC(), 1);
  const repris = w.ensureSplit(JSON.parse(JSON.stringify(brouillon)));
  assert.equal(w.splitSlot(repris), 1, 'ensureSplit ne repositionne pas une ligne existante');
});

// ---------------------------------------------------------------------------
// ensureSplit — reprise des documents venus d'ailleurs
// ---------------------------------------------------------------------------
test('un Titre 2 « Conclusion » devient la ligne, à sa place exacte', () => {
  const ancien = doc(H2(w.TR('Détails')), P('A'), H2(w.TR('Conclusion')), P('Impression : ...'));
  const migre = w.ensureSplit(ancien);
  assert.equal(w.splitSlot(migre), 2);
  assert.deepEqual(textOf(w.detailsBlocks(migre)), [w.TR('Détails'), 'A']);
  assert.deepEqual(textOf(w.conclusionBlocks(migre)), ['Impression : ...']);
  assert.equal(migre.content.length, ancien.content.length, 'aucun bloc ajouté ni perdu');
});

test('un gabarit de note garde sa structure, sa conclusion devient la ligne', () => {
  // Structure produite par plainToBlocks pour le gabarit « Syndrome viral ».
  const gabarit = doc(
    H2(w.TR('Histoire de la maladie actuelle')), P('Depuis : '),
    H2(w.TR('Examen physique')), P('Auscultation : '),
    H2(w.TR('Conclusion')), P('Impression : '), P('Plan : ')
  );
  const migre = w.ensureSplit(gabarit);
  assert.deepEqual(textOf(w.conclusionBlocks(migre)), ['Impression : ', 'Plan : ']);
  assert.ok(textOf(w.detailsBlocks(migre)).includes(w.TR('Examen physique')));
});

test('un document sans conclusion reçoit la ligne à la fin, avec de quoi écrire', () => {
  const d = doc(H2(w.TR('Détails')), P('A'));
  const migre = w.ensureSplit(d);
  assert.equal(w.splitSlot(migre), 2);
  assert.equal(w.conclusionIsEmpty(migre), true);
  assert.equal(w.conclusionBlocks(migre).length, 1, 'un paragraphe pour pouvoir écrire');
});

test('ensureSplit est idempotent', () => {
  const une = w.ensureSplit(doc(H2(w.TR('Détails')), P('A')));
  assert.deepEqual(w.ensureSplit(une).content, une.content);
});

test('un copier-coller qui duplique la ligne n’en laisse qu’une', () => {
  const d = doc(H2(w.TR('Détails')), SPLIT, P('A'), SPLIT, P('B'));
  const clean = w.ensureSplit(d);
  assert.equal(clean.content.filter((n) => n.type === 'sectionSplit').length, 1);
  assert.equal(w.splitSlot(clean), 1);
});

test('ensureSplit accepte un document vide ou absent', () => {
  for (const entree of [undefined, null, {}, { type: 'doc', content: [] }]) {
    const migre = w.ensureSplit(entree);
    assert.equal(migre.content.filter((n) => n.type === 'sectionSplit').length, 1);
    assert.equal(w.conclusionIsEmpty(migre), true);
  }
});

// ---------------------------------------------------------------------------
// Non-régression : le reste de la note ignore la ligne
// ---------------------------------------------------------------------------
test('une note réduite à sa ligne reste « vierge » pour l’éditeur', () => {
  assert.equal(w.docIsBlank(w.DEFAULT_DOC()), true);
  assert.equal(w.docIsBlank(doc(SPLIT, P('Impression'))), false);
});

test('le scan de la note (compteurs, sommaire) ignore la ligne', () => {
  const d = doc(P('A'), SPLIT, CHIP('Amoxicilline 500 mg'));
  const stats = w.scanDoc(d);
  assert.equal(stats.counts.prescription, 1);
  assert.equal(stats.items.length, 1);
});
