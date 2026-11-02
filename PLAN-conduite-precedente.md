# Plan — Reprendre la dernière conduite d'un problème chronique

Brouillon du 2026-10-30, questions tranchées le 2026-11-01. Prêt à coder.
Suite de [PLAN-gabarits-conclusion.md](PLAN-gabarits-conclusion.md) et de [PLAN-suggestions-contextuelles.md](PLAN-suggestions-contextuelles.md) (D2).

## Ce qu'on veut

Retour de Xavier, d'après un médecin de la clinique pendant la démo d'Alex de la nouvelle note :

> Quand on ajoute à la note un diagnostic qui existe déjà dans la liste de problèmes (ex. diabète), la dernière conduite à tenir liée à ce problème s'ajoute automatiquement. Le médecin poursuit la même chose qu'avant, ou modifie un peu son plan de traitement. « De la bombe pour les problèmes chroniques. »

Deuxième idée, de toi : **réordonner** les lignes à l'intérieur d'un diagnostic, et les diagnostics entre eux.

## Ce qui existe déjà

- **« Réutiliser ma dernière conclusion »** : option `last` de `dxConclusionOptions`, [editor-data.jsx:1567](project/note-ui/editor-data.jsx:1567). Offerte seulement si le problème est au dossier et qu'une note antérieure le conclut. Elle est **proposée** dans la colonne de suggestions ([SuggestionsColumn.jsx:43](project/note-ui/SuggestionsColumn.jsx:43)), jamais insérée d'office. Elle ne filtre pas sur l'auteur.
- **Notes antérieures** : `PAST_NOTES` ([NotesList.jsx:149](project/note-ui/NotesList.jsx:149)). La conclusion est du **texte plat** (« Impression : …\nPlan : … »), les ajouts réutilisables sont dans `reuse` (sans jeton dans le texte), et le diagnostic est un **nom** (`diagnostics: [L('Asthme léger')]`), pas un `sommaireId`.
- **Insertion en attente** : `buildConclusionBlocks` ([editor-schema.jsx:2980](project/note-ui/editor-schema.jsx:2980)) place les tuiles aux jetons `{clé}` et marque le texte en insertion (`proposeText`). Puces en attente avec ✓ / ✕, et « Tout accepter » dans la barre des ajouts en attente.
- **Création des régions diagnostic**, quatre points d'entrée qui passent tous par `makeDiagRegionAttrs` ([diagnostics.jsx:220](project/note-ui/diagnostics.jsx:220)) :
  - `/dx` → `runDiagnosticCommand`, [editor-field.jsx:329](project/note-ui/editor-field.jsx:329) ;
  - problèmes cochés au début de visite, [editor-schema.jsx:3034](project/note-ui/editor-schema.jsx:3034) ;
  - diagnostic suggéré par le gabarit de début, [NoteEditor.jsx:384](project/note-ui/NoteEditor.jsx:384) (exclut déjà `last`) ;
  - mode présentation, [presentation-mode.jsx:169](project/note-ui/presentation-mode.jsx:169).
- **Numérotation** : décorations recalculées à chaque transaction (`dxNumberingPlugin`, [editor-schema.jsx:961](project/note-ui/editor-schema.jsx:961)). Le numéro suit l'ordre de la première occurrence ; réordonner les régions renumérote sans travail en plus.
- **Allergies** : `optionAllergy` / `rxAllergyOf` signalent déjà un conflit au niveau de l'option.
- **Glisser-déposer** : seulement dans le Sommaire ([Summary.jsx:351](project/note-ui/Summary.jsx:351)). Rien dans l'éditeur ; les nodes Tiptap sont `draggable: false`.
- **Données de démo** : la patiente adulte a migraine et hypothyroïdie au dossier, avec des notes antérieures signées par moi (`%%DOCTOR%%`). Pas de diabète. La cystite pédiatrique est conclue par un collègue (Dr Marc Lefebvre) : bon cas pour le repli « collègue ».

## Décisions (2026-10-30)

| # | Sujet | Décision |
|---|---|---|
| C1 | Déclencheur | **Automatique, en attente** : la conduite arrive sous le diagnostic dès sa création, texte en marques d'insertion et tuiles en attente. Un geste pour tout accepter, un pour tout retirer. |
| C2 | Source | **Ma dernière note seulement** qui conclut ce problème. |
| C3 | Contenu | **Texte + tuiles** à même la phrase (Rx, requêtes, consignes), chaque tuile modifiable avant d'accepter. |
| C4 | Pas de note à moi | Rien d'inséré. La dernière conduite **d'un collègue** est **proposée** en tête de la colonne (« Dernière conduite — Dr X »). |
| C5 | Ancienneté | Toujours insérée, **date visible** sur la source ; au-delà de **12 mois**, la date passe en avertissement. |
| C6 | Divergence | **Garder et signaler** : une tuile cessée ou modifiée depuis, ou en conflit d'allergie, arrive en attente avec un avertissement. Le médecin décide. |
| C7 | Zone | **Conclusion seulement**, à la première occurrence du diagnostic en Conclusion. |
| C8 | Correspondance | **Lié au dossier** : diagnostic choisi depuis le Sommaire (Reprendre) ou relié à une ligne Problèmes (`sommaireId`). Aucune correspondance par code ou libellé. |
| R1 | Réorganiser | **Réordonner les lignes** dans une région et **réordonner les diagnostics** entre eux. |
| R2 | Gestes | Les trois : **poignée ⋮⋮** au survol, **Alt + ↑ / ↓**, **Monter / Descendre** dans le menu de l'en-tête. |
| R3 | Numéros | **Le numéro suit l'ordre** ; les renvois se mettent à jour seuls. |

Tranché le 2026-11-01 :

| # | Sujet | Décision |
|---|---|---|
| Q1 | Démo diabète | **Oui** : diabète de type 2 au dossier de la patiente adulte, avec **deux suivis** à moi (metformine, HbA1c, examen des pieds). La dose de metformine change entre les deux. |
| Q2 | Ce qu'on reprend | **Le plan seulement**. L'impression change à chaque visite ; le médecin l'écrit à neuf. |
| Q3 | Réinsertion | **Une fois par diagnostic et par note**. Retirée, elle reste offerte dans la colonne de suggestions. |
| Q4 | Ligne hors de sa région | **Interdit**. Couper-coller reste possible. |
| Q5 | Diagnostic par-dessus la ligne Détails / Conclusion | **Interdit** : un diagnostic se déplace seulement parmi ceux de sa zone. |
| Q6 | Raccourci | **Alt + ↑ / ↓** (comme VS Code). Dans la note, il remplace le saut de paragraphe natif de macOS (Option + ↑). |
| Q7 | Réglage | **Oui, activé par défaut**. Désactivé, la conduite redevient une suggestion dans la colonne. |
| Q8 | Trace dans la note signée | **Aucune** : une fois acceptée, c'est du texte ordinaire. La source ne sert qu'avant l'acceptation. |

## Proposition

### Partie A — Conduite précédente automatique

#### A1. Données : des notes antérieures structurées par problème

Le texte plat ne suffit pas : une note qui conclut deux problèmes mélange deux plans, et `reuse` ne dit pas où vont les tuiles.

- Ajouter à chaque note antérieure un champ `conducts` : une entrée par problème conclu, `{ sommaireId, content, tiles }`, même forme qu'un texte rapide (jetons `{clé}`, voir PLAN-gabarits-conclusion §2). `content` contient **le plan seulement**, sans l'impression (Q2).
- Garder `conclusion` et `diagnostics` pour l'affichage de la liste des notes. `reuse` reste le repli des notes sans `conducts`.
- Démo, patiente adulte : deux suivis d'hypothyroïdie (le plus récent < 12 mois, un plus ancien) et un suivi de migraine de plus de 12 mois (pour C5). La lévothyroxine change de dose entre les deux notes (pour C6).
- Démo, patiente pédiatrique : la cystite du Dr Lefebvre sert au repli collègue (C4) ; ajouter l'asthme, au dossier, conclu par moi.
- Démo, patiente adulte (Q1) : ajouter un **diabète de type 2** au Sommaire (`DX_SOMMAIRE_SEED`, [diagnostics.jsx:427](project/note-ui/diagnostics.jsx:427)), la metformine aux médicaments actuels, et deux notes de suivi à moi : metformine (dose différente d'une note à l'autre), HbA1c, examen des pieds. C'est le cas qu'on montre à Xavier.

#### A2. Modèle pur : `lastConduct(dx, ctx)`

Dans editor-data.jsx, à côté de `dxConclusionOptions` :

- Entrée : les attributs de la région (`sommaireId`, `documentAs`), `ctx = { notes, sommaire, author }`.
- Sortie : `{ mine, colleague }`. Chacun vaut `null` ou une option `{ kind: 'last' | 'last-colleague', content, tiles, date, author, ageMonths, source }`.
- Correspondance **par `sommaireId` seulement** (C8). Rien si la région n'a pas de `sommaireId`, ou si elle documente un antécédent ou un problème cessé.
- `dxConclusionOptions` s'appuie sur ce modèle : `last` = la mienne. `last-colleague` n'apparaît que si je n'en ai pas (C4).
- Tests dans `tests/dx-context.test.mjs` : ma note gagne sur celle d'un collègue plus récente ; repli collègue ; pas de `sommaireId` → rien ; âge en mois.

#### A3. Signaler les tuiles divergentes (C6)

- `conductWarnings(tile, today)` compare la tuile à l'état actuel du dossier : médicament **cessé** depuis (avec la date), **dose ou posologie changée** (« Dose actuelle : 100 µg »), **allergie** (`rxAllergyOf`).
- La puce en attente porte un attribut `warn` : icône d'avertissement, explication au survol. Elle reste acceptable telle quelle.
- La source des médicaments actuels est `meds` du Sommaire. Il faudra y ajouter un statut et une date de cessation pour la démo.

#### A4. Insertion automatique (C1, C5, C7)

- Un seul assistant, `dxAutoConductBlocks(attrs, zone)`, appelé par les quatre points d'entrée. Il renvoie le corps de la région : `buildConclusionBlocks(mine, { proposeText: true })`, ou un paragraphe vide.
- Conditions : réglage actif (Q7), zone = Conclusion, première occurrence du fil (`dxKey`) **en Conclusion**, `mine` trouvé, et conduite **pas encore insérée pour ce fil dans cette note** (Q3). Ce dernier point se retient dans l'éditeur (ensemble de `dxKey` déjà servis), pas dans le document : retirer le texte ne remet pas le compteur à zéro.
- Réglage désactivé (Q7) : rien d'inséré, la conduite reste la première option de la colonne. Interrupteur dans le panneau de réglages ([tweaks-panel.jsx](project/tweaks-panel.jsx)), activé par défaut.
- Après l'acceptation, le texte et les puces sont ordinaires : aucune mention de reprise dans la note signée ni à l'impression (Q8).
- Source affichée sur les puces et en tête du texte proposé : « Reprise de ta note du 12 mars 2026 ». Au-delà de 12 mois : même libellé, en style avertissement (C5).
- Le curseur va à la fin du texte proposé, pas sur une ligne vide au-dessus.
- « Tout accepter » / « Tout retirer » limités à la région, dans le menu de l'en-tête de la région, en plus de la barre globale.

#### A5. Repli collègue (C4)

- Dans la colonne de suggestions, en tête des options de la région : « Dernière conduite — Dr Lefebvre, 8 déc. 2025 », icône `history`. Un clic l'insère exactement comme A4.
- Même entrée dans le menu « / » → Textes rapides (section « Pour <diagnostic> »).

#### A6. Textes FR / EN

Clés dans `i18n/fr.js` et `i18n/en.js` (+ `catalog.json`) : source « Reprise de ta note du {date} », avertissement d'ancienneté, « Dernière conduite — {author} », avertissements de tuile (cessée, dose changée, allergie), « Tout accepter / Tout retirer pour ce diagnostic ». Relire avec la skill omnimed-ux-writing.

### Partie B — Réordonner

#### B1. Commandes pures

- `moveBlockInRegion(state, dir)` : déplace le paragraphe du curseur d'un cran dans sa région. Il ne sort jamais de la région (Q4) : aux bornes, rien ne se passe.
- `moveRegion(state, dir)` : échange la région du curseur avec la région voisine **de la même zone**. Le contenu entre deux régions (texte libre, outil clinique) compte comme un bloc à sauter. La ligne Détails / Conclusion est une borne (Q5).
- Dans `note-sections.jsx` ou un nouveau fichier pur, testable par le harnais comme `planSplitMove`.

#### B2. Clavier

Alt + ↑ / ↓ (Q6) : ligne si le curseur est dans le corps d'une région ; région entière si le curseur est dans son en-tête. La sélection suit le bloc déplacé. Hors d'une région, la touche garde son comportement natif. Aucun raccourci de l'éditeur n'utilise déjà Alt + ↑ / ↓ ; seul un menu déroulant ouvre sa liste avec Alt + ↓ ([NoteEditor.jsx:1707](project/note-ui/NoteEditor.jsx:1707)), hors de la note.

#### B3. Menu de l'en-tête

« Monter » / « Descendre » dans le menu de l'en-tête du diagnostic, désactivés aux bornes de la zone.

#### B4. Poignée à glisser

- Poignée ⋮⋮ au survol, à gauche de chaque ligne de corps et de chaque en-tête de région.
- Indicateur d'insertion pendant le glissé ; dépôt limité à la même région (ligne) ou à la même zone (région).
- Implémentation : plugin ProseMirror avec un `dragstart` sur la poignée seulement. Les nodes restent `draggable: false`, pour ne pas casser la sélection de texte.

#### B5. Numérotation

Rien à coder (R3) : la décoration renumérote. Vérifier que les renvois `diagnosticRef` en Détails suivent, et que le Journal des actions ne compte pas un déplacement comme une modification.

## Ordre de travail

1. A1 + A2 (données + modèle + tests). Rien de visible encore.
2. A4 sur `/dx` seulement : démontrable avec l'hypothyroïdie.
3. A3 (avertissements), puis A5 (collègue), puis les trois autres points d'entrée.
4. A6, relecture des textes.
5. B1 + B2 + B3 (clavier et menu : rapides, accessibles).
6. B4 (glisser), le plus risqué dans Tiptap.
7. Vérification dans le navigateur (capture sans tête, voir mémoire « Headless capture »), FR et EN, deux patientes.

Branche de travail : `feat/conduite-precedente`, dans un worktree (dossier partagé avec d'autres sessions).

## Questions ouvertes

Aucune. Les questions Q1 à Q8 sont tranchées (voir Décisions).

## Implémenté (2026-11-01, branche `feat/conduite-precedente`)

Tout le plan, avec ces écarts :

- **Déplacer un diagnostic au clavier** : **Alt + Maj + ↑ / ↓**. Le plan disait « Alt + ↑ / ↓ dans l'en-tête », mais l'en-tête n'est pas éditable : le curseur n'y va jamais. Alt + ↑ / ↓ reste pour les lignes.
- **Menu de l'en-tête** : « Monter / Descendre le diagnostic » et « Tout accepter / Tout retirer dans ce diagnostic » sont sous « Documenter comme », dans le même menu (c'est le seul de l'en-tête). Le menu s'ouvre au-dessus du bouton quand la place manque en dessous.
- **Plus de 12 mois (C5)** : la source le dit (« Reprise de votre note du 3 mars 2025, il y a plus d'un an ») dans la barre des ajouts et l'infobulle des puces ; la colonne affiche « Conduite de plus d'un an : à revoir. »
- **Puces concrètes** : une conduite reprise arrive toujours en puces en attente, même quand le réglage « Gabarit : lignes à compléter » est actif.
- **Texte proposé** : la conduite automatique arrive toujours en texte proposé (C1). Appliquée depuis la colonne, elle suit le réglage « Gabarit : texte proposé », comme les autres gabarits.
- **Données** : la metformine (1000 mg BID depuis 10/2026) et le gliclazide (cessé 10/2026) sont aussi dans la boîte Médications du Sommaire. Patiente pédiatrique : conduite de l'asthme (ma note) et note du Dr Lefebvre pour la rhinite (repli collègue).

Pas fait : aucune entrée particulière au Journal des actions pour un déplacement (B5) ; c'est une transaction ordinaire.
