# Plan — Inline entity : décisions de la rencontre de cadrage (2026-09-29)

Sources : notes et transcription de la rencontre « Inline entity générique » (Xavier Boilard, Alex Montambeault, Antoine Cloutier, Vanessa Bois, Ignacio Calvo) et [la présentation](https://claude.ai/artifact/95ZBSFhJmiAfD5P9W7KRTa).

**Statut (2026-09-30) : lots 0 à 9 livrés**, en PR empilées à fusionner dans l'ordre — ig-calvo/nouvelle-note-2026-tiptap #15 (lot 0), #16 (1), #17 (2), #18 (3), #19 (4), #20 (5), #22 (6), #23 (7), #25 (8), puis le lot 9. Détail, écarts au plan et questions : `project/Note Clinique.notes.md` (RA-03 à RA-11, ID-05 à ID-11, Q-05 à Q-23).

Ce plan traduit en changements de prototype ce qui a été **décidé**, et rend **testable** ce qui reste **ouvert**. Il ne couvre pas ce qui ne se prototype pas (index de recherche, retrait du GSF, documentation DAF, frame by frame Figma — voir §J).

**Principes**

1. Ce qui est décidé devient le comportement par défaut.
2. Ce qui est ouvert passe derrière un tweak (même modèle que `checkoutSuggestions`, `Note Clinique.html:319`), pour le montrer et le tester avec des utilisateurs.
3. Un lot = une branche = une PR. Chaque lot met à jour `project/Note Clinique.notes.md` (RA / D / Q / journal).
4. La logique pure (scans du document, dérivations) est testée par `node --test project/tests/*.test.mjs` ; le comportement de l'éditeur est vérifié au navigateur (serveur `prototypes`, `.claude/launch.json`).

---

## 0. Préalable

| # | Travail | Taille |
|---|---|---|
| 0.1 | Le travail RA-03 (popover dans le viewport) et RA-04 (gabarit « Otite », puces en attente) n'est pas commité, sur `main`. Le mettre sur une branche `feat/gabarit-ajouts-en-attente` et ouvrir la PR avant de continuer. | S |
| 0.2 | Ajouter les décisions de la rencontre au fichier de notes : **D-02** édition inline après le chemin critique Q1 2027 ; **D-03** gabarit = suggestions à accepter ; **D-04** un seul outil rapide, les cas complexes ouvrent la modale existante ; **D-05** Backspace sélectionne d'abord, effacer n'annule pas l'action clinique. | S |

---

## A. Lot 1 — Retirer de la note ≠ annuler (P1)

**Constat.** `buildActionLog` (`editor-schema.jsx`, ~l. 1645) construit le Journal à partir des puces présentes dans le document : une puce effacée disparaît du Journal, même transmise. C'est l'inverse de la décision. De plus, l'état « transmis » n'existe que par document du checkout (`txState`) ; la puce ne l'affiche pas.

**Changements**

1. **Événements d'action.** Nouvel état par note dans `NoteEditor.jsx`, à côté de `txState` : `actionEvents` = liste `{cid, kind: 'transmis' | 'annule', at, author, snapshot}` (`snapshot` = attrs de la puce au moment de l'événement). Même durée de vie que `txState`, sauvegardé avec le brouillon.
2. **Journal.** `buildActionLog(docJson, actionEvents)` : une puce présente → entrée comme aujourd'hui ; une puce absente mais transmise → l'entrée reste, construite depuis `snapshot`, avec la mention « Retirée de la note ». Une puce annulée → entrée « Annulé ». `ActionLog.jsx` affiche ces mentions.
3. **Puce transmise.** Quand un document passe à `transmitted: true` (`patchTxState`), poser `transmittedAt` sur ses puces (`setNodeMarkup`) et ajouter un événement `transmis`. `buildChipDom` affiche la double coche « Transmis » en fin de puce (emplacement du Figma).
4. **Effacer une puce transmise.** Le dialogue de suppression (`editor-field.jsx`, ~l. 858) change de texte : « Retirer de la note n'annule pas l'ordonnance transmise. Elle reste au Journal. » Boutons : « Garder en texte » / « Retirer de la note ».
5. **Annuler.** Dans le menu ⋮ (`chipMore`, ~l. 895), en dernier et sans mise en avant : « Annuler l'ordonnance… » / « Annuler la requête… », seulement pour une puce transmise. Confirmation, puis événement `annule`, statut « Annulée » sur la puce (barrée, même traitement que `chip--ceased`), entrée au Journal. L'envoi de l'annulation est simulé.
6. **Puce transmise en lecture seule** (hypothèse Q-A2) : le formulaire s'ouvre sans champs modifiables, l'édition inline des valeurs est coupée.

**Fichiers** : `editor-schema.jsx` (attrs `transmittedAt` / `cancelledAt`, `buildChipDom`, `buildActionLog`), `NoteEditor.jsx`, `editor-field.jsx`, `ActionLog.jsx`, `editor.css`.
**Tests** : `buildActionLog` avec puce présente, retirée non transmise, retirée transmise, annulée.
**Taille** : M.

---

## B. Lot 2 — Backspace sélectionne d'abord (P1)

**Constat.** Le nœud `chip` n'a pas de raccourci clavier. Backspace juste après une puce l'efface probablement tout de suite (comportement natif de ProseMirror sur un atome inline — à confirmer au navigateur avant de coder). Le dialogue « Garder en texte / Supprimer » existe déjà, mais seulement depuis le menu ⋮.

**Changements**

1. `makeChipNode` → `addKeyboardShortcuts` :
   - Backspace, sélection vide, puce juste avant le curseur → sélectionner la puce (`NodeSelection`), rien n'est effacé.
   - Delete, puce juste après → même chose.
   - Backspace ou Delete sur une puce sélectionnée → ouvrir le dialogue existant (événement `note:chip-delete-request` avec `cid` et `rect`), au lieu d'effacer.
2. Dialogue accessible au clavier : focus sur « Garder en texte » à l'ouverture, Échap ferme et remet la sélection sur la puce, Entrée active le bouton focalisé.
3. Entrée sur une puce sélectionnée ouvre son formulaire (même effet que le clic).
4. **Puce en attente** (hypothèse Q-A3) : 1er Backspace sélectionne, 2e Backspace la refuse sans dialogue (ce n'est pas encore une entité).
5. **Sélection de plage** contenant des puces (hypothèse Q-A4) : Backspace ouvre « N éléments seront retirés de la note » avec les mêmes deux choix, appliqués à toutes.

**Fichiers** : `editor-schema.jsx` (`makeChipNode`), `editor-field.jsx` (écoute de l'événement, focus).
**Vérification** : navigateur, souris et clavier seulement, puce en milieu et en fin de ligne, annulation par Ctrl+Z.
**Taille** : S–M.

---

## C. Lot 3 — États de la puce : erreurs, commentaires (P1)

**Constat.** La puce n'a qu'un état visuel (cessée). Le Figma prévoit : erreur de fonction (!), erreur de valeur, commentaires, transmis. La rencontre demande plusieurs niveaux d'erreur.

**Changements**

1. `chipIssues(attrs)` — fonction pure qui dérive les problèmes d'une puce ; rien n'est stocké, sauf l'échec de transmission.

   | Niveau | Cas | Rendu |
   |---|---|---|
   | Bloquant | Prescription incomplète (champs requis du formulaire vides : dose visée, voie, fréquence, renouvellement) | Bordure `error` + ! en fin de puce |
   | Bloquant | Interaction de haut risque (drapeau fictif sur un item du catalogue) | Bordure `error`, fond `error-container`, ! |
   | Bloquant | Échec de transmission (tweak « Simuler un échec de transmission ») | Icône d'échec à la place de la double coche |
   | Avertissement | Requête sans renseignements cliniques | ! en `warning`, sans bordure |

2. Le libellé du problème est dans l'infobulle et dans l'`aria-label` de la puce (« Prescription incomplète : voie manquante »).
3. **Commentaires** : icône bulle en fin de puce quand `details.comment` existe (commentaire au pharmacien, au laboratoire). Champ « Commentaire » ajouté aux formulaires.
4. Le checkout lit `chipIssues` : un document avec un problème bloquant ne peut pas être complété (lien avec le plan V7 §E, erreur de transmission hors périmètre : n'implémenter que l'affichage).
5. **Cas de Xavier** : un gabarit propose une prescription incomplète → puce en attente **et** incomplète.
6. Sur papier, l'erreur n'est pas imprimée (hypothèse Q-A6).

**Fichiers** : `editor-schema.jsx`, `editor-data.jsx` (drapeau d'interaction fictif, marqué « exemple, à valider cliniquement »), `editor-popover.jsx`, `editor.css`, `TransmissionModal.jsx` / `DocumentActionPanel.jsx`.
**Tests** : `chipIssues` pour chaque cas.
**Taille** : M.

---

## D. Lot 4 — Gabarits en suggestions, bout à bout (P1)

**Constat.** RA-04 couvre une ordonnance du gabarit « Otite » : ✓ / ✕ un par un. Il manque l'acceptation en bloc, la finalisation (Q-06), le texte du gabarit et les profils.

**Changements**

1. **Tout accepter / Tout refuser.** Après l'application d'un gabarit, une barre au-dessus de la note : « Gabarit « Otite moyenne aiguë » : N ajouts en attente — Tout accepter · Tout refuser ». Une seule transaction (un seul Ctrl+Z). Même habillage que la barre du mode révision (`review-mode.jsx`).
2. **Finaliser avec des ajouts en attente** (règle Q-06) : dialogue calqué sur celui du mode révision (`openFinalize`, `NoteEditor.jsx` ~l. 652) : « N ajouts en attente — Tout accepter et finaliser / Réviser / Finaliser sans eux ». « Réviser » amène le curseur au premier ajout en attente.
3. **Modifier avant d'accepter** (renverse Q-07, voir Q-A5) : double-clic ou Entrée sur une puce en attente ouvre son formulaire ; « Accepter » dans le formulaire accepte avec les modifications. Nécessaire pour le cas des profils d'Antoine.
4. **Texte du gabarit en suggestion** — tweak « Gabarit : texte proposé », désactivé par défaut. Les blocs du gabarit passent par `markBlocksAsInsertion` (déjà utilisé pour l'IA) avec un auteur « Gabarit » ; « Tout accepter » accepte aussi le texte.
5. **Style des suggestions** — tweak à trois valeurs, CSS seulement :
   - Tirets (actuel) ;
   - Opacité réduite, actions sous la puce (Alex) ;
   - Violet, ✓ / ✕ dans le coin supérieur droit, double-clic pour accepter (Xavier).
6. **Nouveau gabarit d'exemple avec des requêtes** (profil de laboratoire + un examen d'imagerie + une prescription incomplète) pour montrer les points 3 et C.5. Contenu clinique à valider, comme ID-05.

**Fichiers** : `editor-schema.jsx` (`acceptAllPending` / `rejectAllPending`, version pure `resolvePendingInDoc` pour les tests), `NoteEditor.jsx`, `editor-field.jsx`, `editor-data.jsx`, `editor.css`, `Note Clinique.html` (tweaks).
**Tests** : `resolvePendingInDoc` (accepter, refuser, mélange), `buildTemplateBlocks` avec profil.
**Taille** : M–L.

---

## E. Lot 5 — Impression et liste des notes : texte seulement (P2)

**Constat.** `ChipPill` (`NotesList.jsx` ~l. 120) dessine encore une pastille avec icône dans la liste des notes. La décision : dans la liste et à l'impression, seul le texte de la puce reste, statut compris (slide « Étape 6 »).

**Changements**

1. `chipPrintText(attrs)` dans `editor-schema.jsx` : statut + valeur principale + valeurs secondaires, sans icône ni état. Reprendre la logique de `chipPlainText` (`editor-field.jsx` ~l. 739) pour qu'il n'y ait qu'une seule source.
2. `NotesList.jsx` et l'aperçu d'impression utilisent `chipPrintText`. Une puce annulée s'imprime avec « Annulée ».

**Tests** : `chipPrintText` pour ordonnance, renouvellement, cessée, labo multi-analyses.
**Taille** : S.

---

## F. Lot 6 — Ouverture du formulaire : règle responsive (P2)

**Constat.** `ChipPopover` est le formulaire complet (ordonnance 600 px). RA-03 le garde dans le viewport (sous la puce, sinon au-dessus, sinon pleine hauteur avec corps qui défile). Il reste à choisir le comportement quand la place manque (enjeu d'Alex), sans jamais faire défiler la note.

**Changements**

1. Tweak « Ouverture du formulaire » : **Auto** (défaut) / Sous la puce / Centré / Bottom sheet.
2. Règle **Auto** proposée (Q-A8) : sous la puce si le formulaire y tient en entier ; sinon au-dessus s'il y tient ; sinon dialogue centré avec scrim, la puce restant visible et surlignée. La note ne défile jamais.
3. **Bottom sheet** (piste de Vanessa) : ancré au bas de la colonne de la note, largeur de l'éditeur, 60 % de la hauteur au plus ; la note ne défile que si le sheet cache la puce.
4. Appliquer la même règle aux autres panneaux non vérifiés par RA-03 : `DxEditPopover`, popover de révision, éditeur inline d'un champ de puce.

**Fichiers** : `editor-popover.jsx` (`placePopover`, `ChipPopover`), `editor.css`, `Note Clinique.html`.
**Vérification** : navigateur à 1440×900, 1280×720 et 1024×768, puce en haut, au milieu et en bas de la note.
**Taille** : M.

---

## G. Lot 7 — Requêtes : multi-sélection et regroupement (P2)

**Constat.** `RxMenu` (`editor-popover.jsx` ~l. 681) ajoute un item et se ferme. Une puce de labo sait déjà porter plusieurs analyses (`details.tests`), mais la recherche n'en ajoute qu'une. Le checkout fait un document par puce de requête (`buildTransmissionDocs`). Aucun profil n'existe dans les données.

**Changements**

1. **Recherche unifiée** `/req` : labo, imagerie et profils dans une liste à en-têtes de catégorie. `/lab` et `/img` restent comme filtres sur la même recherche.
2. **Multi-sélection** : clic ou Espace coche un résultat, le menu reste ouvert, la recherche peut changer ; pied « Ajouter (4) », Entrée ajoute. Sans case cochée, Entrée ajoute le résultat actif (comportement actuel).
3. **Une puce par catégorie** : les analyses cochées ensemble → une puce labo « FSC, TSH, Créatinine » ; les examens d'imagerie → une puce imagerie. Des ajouts successifs → des puces distinctes, donc des lignes distinctes.
4. **Profils** : données `LAB_PROFILES` (quelques profils, contenu à valider) ; un profil se déploie en ses analyses dans la puce, chacune retirable (✕) dans le formulaire.
5. **Formulaire de requête** : analyses en liste de puces retirables au lieu du champ texte ; latéralisation, priorité et renseignements cliniques (les valeurs que la recherche ne peut pas remplir).
6. **Checkout** — tweak « Checkout des requêtes » : une par puce (actuel) / regroupées par type (toutes les analyses de la note dans une seule requête de laboratoire). Sujet non réglé (Antoine / Alex) : ne rien décider dans le code.
7. **Optionnel** : « Déplacer vers… » dans le formulaire pour passer une analyse d'une puce à une autre (le glisser-déposer entre lignes vient après).

**Fichiers** : `editor-data.jsx` (profils, `searchRequests`), `editor-popover.jsx` (`RxMenu`), `editor-field.jsx` (`chooseOrderItem`, `runOrderCommand`), `editor-schema.jsx` (`buildChipDom` labo, `buildTransmissionDocs`).
**Tests** : `searchRequests` (catégories, filtre), regroupement des documents dans les deux modes du tweak.
**Taille** : L.

---

## H. Lot 8 — Portée Q1 2027 : édition inline derrière un tweak (P2)

1. Tweak « Édition inline des valeurs secondaires (après Q1 2027) », activé par défaut (vision). Désactivé = portée Q1 : un clic sur une valeur secondaire ouvre le formulaire complet ; `buildChipDom` ne pose plus `data-field`.
2. **Un seul système** (D-04) : les listes d'options de l'éditeur inline d'un champ et celles de `ChipPopover` (voie, fréquence, durée…) viennent d'une seule source, `FIELD_OPTIONS` dans `editor-data.jsx`.
3. **Clavier** (tweak activé) : puce sélectionnée, ← / → passent d'une valeur secondaire à l'autre, Entrée ouvre son menu.

**Taille** : S–M.

---

## I. Lot 9 — Pistes de vision, derrière des tweaks (P3)

1. **IA** : l'Assistant IA ajoute aussi des puces en attente, auteur « Assistant IA » (même mécanisme que le gabarit), pour les éléments structurés de la transcription d'exemple — seulement des items déjà au catalogue.
2. **« + » du sommaire** : tweak « Le « + » du sommaire ajoute dans la note ». Pour Problèmes et Antécédents, il insère une région diagnostic à la position du curseur (`runDiagnosticCommand`) au lieu d'ouvrir l'ancienne modale.

**Taille** : M chacun.

---

## J. Hors périmètre du prototype

- Index de recherche (séparés ou non), squelette commun des recherches côté Angular — décision d'architecture DAF.
- Retrait du GSF de la colonne et de la liste des notes ; vues riches des modules (médication, problèmes).
- Fonction « Rendez-vous à planifier » et sa recherche en langage naturel (aucune fonction RDV dans le prototype).
- Prérequis et bundles de requêtes (créatinine avant imagerie) : écartés en rencontre.
- Suggestions IA en cours de visite (transcription en direct, dictée trouée).
- Actions de processus : résumé et documentation DAF (Alex), liste de livrables et deadline, frame by frame Figma (Ignacio — la skill `prototype-to-figma` peut produire les frames à partir de ce prototype), tests utilisateurs des cas multi et du débordement.

---

## K. Questions — hypothèses retenues en attendant

| # | Question | Hypothèse |
|---|---|---|
| Q-A1 | Une puce **non transmise** effacée reste-t-elle au Journal ? | Non : rien ne s'est passé cliniquement. |
| Q-A2 | Une puce transmise est-elle modifiable ? | Non, lecture seule ; annuler par le menu ⋮. |
| Q-A3 | Backspace sur une puce en attente ? | Sélectionne, puis refuse sans dialogue. |
| Q-A4 | Sélection de plage avec des puces ? | Un dialogue pour toutes. |
| Q-A5 | Modifier une puce en attente (renverse Q-07) ? | Oui ; « Accepter » dans le formulaire accepte avec les modifications. |
| Q-A6 | Une erreur s'imprime-t-elle ? | Non. |
| Q-A7 | Checkout des requêtes : par puce ou regroupé ? | Tweak ; par puce par défaut (actuel). |
| Q-A8 | Règle responsive du formulaire ? | §F.2, à valider en tests utilisateurs. |
| Q-A9 | Contenu clinique des exemples (interaction, profils, gabarit de requêtes) ? | Fictif, marqué « à valider ». |

---

## L. Ordre de travail

| Ordre | Lot | Pourquoi |
|---|---|---|
| 1 | §0 Préalable | Rien de nouveau sur du travail non commité. |
| 2 | A — Retirer ≠ annuler | Corrige un comportement contraire à une décision. |
| 3 | B — Backspace | Idem ; petit. |
| 4 | C — États de la puce | Nécessaire au gabarit avec prescription incomplète (D.6). |
| 5 | D — Gabarits en suggestions | Termine RA-04, règle Q-06. |
| 6 | E — Texte seulement | Petit, décision nette. |
| 7 | F — Règle responsive | Point jugé critique par Xavier ; à tester avec des utilisateurs. |
| 8 | G — Multi-sélection des requêtes | Le plus gros ; dépend de F pour le formulaire. |
| 9 | H — Édition inline derrière un tweak | Portée Q1. |
| 10 | I — Pistes de vision | Exploratoire. |
