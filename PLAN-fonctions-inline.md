# Plan — étendre aux autres fonctions : filtres, destination de l'icône, documenter / mentionner

**Date :** 2026-10-16
**Demande (Ignacio Calvo, 2026-10-16) :** dans la tuile, l'icône de début de ligne dit **où va l'élément** — fond blanc et icône noire = on documente quelque chose qui existe déjà au dossier ; fond bleu et icône blanche = une action en attente au checkout, à envoyer. Intégrer ça pour les prescriptions, puis planifier le travail pour ramener dans les **autres fonctions** ce qui a été ajouté aux prescriptions (le système de filtres et ce comportement d'icône) afin de clarifier ce qui s'en va où.
**Source Figma :** [Prescription - DEV, page « Prescription inline »](https://www.figma.com/design/yKlDaui3uatLoHfsfhdJbG/Prescription---DEV?node-id=7802-1787) : les deux exemples « CESSER Tylenol » (`8080:29504`) et « RENOUVELER Tylenol » (`8080:30748`) (aujourd'hui une icône ℞ bleue sur fond blanc, sans le nouveau traitement), et « Documentation au profil vs prescrire » (`8080:29531`), qui montre déjà les deux familles côte à côte.
**État du prototype :** `main` contient les lots 0 à 8 du plan `PLAN-prescription-inline.md` (PR #28 à #36). Le traitement d'icône est fait pour la prescription (branche `feat/icone-destination-puce`, voir RA-18 des notes).

---

## 1. Ce qui existe pour la prescription

| Brique | Où | Générique ou propre à la prescription |
|---|---|---|
| Rail de filtres à droite (Tout, Renouvelables, Actives, Cessées, Favoris, Gabarits), compteurs, liste navigable qui suit le filtre | `RxMenu`, `RX_FILTERS`, `applyRxFilter`, `rxCounts` (editor-data.jsx, editor-popover.jsx) | **Propre** : les filtres sont codés pour les statuts d'une médication. À généraliser en une définition de filtres par fonction |
| Boutons de ligne au survol : Mentionner, ↑ ↓, ⟳, ⊘, Prescrire, Documenter | `RxMenu`, `medActions` | Mentionner et Documenter sont **génériques** ; ↑ ↓, ⟳, ⊘ propres à la médication |
| Statut au profil (Actif / Échu / Cessé), étiquette dans la ligne | `PATIENT_MEDS`, `MED_STATUS_LABEL` | Propre ; chaque fonction a ses statuts |
| Puce documentaire (type `medication`) : documentée ou mentionnée, au Sommaire en attente / au Journal / jamais au checkout | `medicationChipAttrs`, `buildMedicationChipDom`, `scanDoc`, `buildActionLog` | Le **mécanisme** est générique (un type de puce documentaire par fonction, ou un seul type avec un `kind`) |
| Badges de statut (Cesser, ⟳, ↑ ↓, Incomplet, En suspens) | `chipStatusBadges` | Générique pour Incomplet et En suspens ; le reste propre à la prescription |
| Valeurs manquantes dans la puce | `chipIssues` → `missing`, `rxChipSegments` | Le mécanisme est générique ; les champs requis sont propres à chaque fonction |
| **Destination de l'icône** (blanche sur bleu / noire sur blanc) | `chipDestination` (editor-schema.jsx), `data-dest` et editor.css | **Générique** : déjà calculé pour tous les types de puce ; le style n'est posé que sur ℞ et la médication documentée |

### Les quatre destinations (déjà codées, `chipDestination`)

| Destination | Quand | Icône |
|---|---|---|
| `a-envoyer` | Prescription, requête (labo, imagerie), référence, consigne présente dans la note : produit un document au checkout | Blanche sur fond bleu (`primary`) |
| `dossier` | Médication documentée ou mentionnée ; problème, fichier, diagnostic | Noire sur fond blanc |
| `envoye` | Déjà envoyée ou annulée | Noire sur fond blanc (hypothèse, Q-36) |
| `suggestion` | Ajout proposé par un gabarit ou l'Assistant IA, pas encore accepté donc pas encore au checkout | Noire sur fond blanc (hypothèse, Q-36) |

Un test vérifie que « à envoyer » coïncide exactement avec ce que `buildTransmissionDocs` transforme en document : si on ajoute un type au checkout, la destination suit.

---

## 2. Les autres fonctions

| Fonction | Menu | « Au dossier » (ce qu'on documente ou mentionne) | À envoyer au checkout | Destination de l'icône aujourd'hui |
|---|---|---|---|---|
| **Laboratoire** `/lab` | `RxMenu`, multi-sélection, favoris, profils (`LAB_PROFILES`) | Résultats déjà au dossier : le prototype n'en a que 2 en démo (`RESULTS_RECENT`), le Sommaire est vide (`results: []`). Le Figma montre des puces de résultat (« PSA 5,9 H », drapeaux H / B) | La requête de laboratoire | Glyphe `science` en couleur `primary`, sans boîte |
| **Imagerie** `/img` | `RxMenu`, multi-sélection | Examens passés : aucune donnée | La requête d'imagerie | Glyphe `radiology` en `tertiary` |
| **Requêtes** `/req` | Recherche unifiée (profils, labo, imagerie), multi | Les deux ci-dessus | Une requête labo, une par examen d'imagerie | Selon la ligne |
| **Référence** `/ref` | `RxMenu`, favoris | Références déjà ouvertes : aucune donnée | La référence à un spécialiste | Glyphe `person_add` en `secondary` |
| **Consignes** `/instr` | Items du menu « / » | Rien au dossier à mentionner (une consigne est toujours un envoi au patient) | La consigne au patient | Glyphe `menu_book` |
| **Diagnostic** `/dx` | Picker propre (Dans cette note / Sommaire / Fréquents / CIM-10) | Problèmes et antécédents déjà au Sommaire : **existe** (Reprendre, Remplacer, Cesser, Documenter comme…) | Rien : un diagnostic n'est pas un envoi | Région diagnostic, pas une puce |
| **Problème** `/pb` | Items du menu | Le problème existe au Sommaire | Rien | Puce `problem`, sans destination (`dossier`) |
| **Outils cliniques** | Sélecteur propre | Valeurs d'un formulaire | Le formulaire (document au checkout) | Barre d'outil, pas une puce |
| **Fichiers** | Source (ordinateur, cellulaire, patient) | Le fichier est dans le dossier | Rien | Puce `file`, `dossier` |

Constat : seules la **prescription** (profil de médications) et le **diagnostic** (Sommaire) ont déjà une notion de « ce qui est au dossier ». Pour le labo, l'imagerie et la référence, il faut d'abord **des données d'exemple** de ce qui est au dossier (comme `PATIENT_MEDS`), fictives et marquées « à valider cliniquement ».

---

## 3. Lots proposés

### Lot A — Fondations génériques (P1, M–L)
1. **Destination de l'icône pour toutes les puces.** Poser la boîte (18 px, `data-dest`) sur les glyphes `science`, `radiology`, `person_add`, `menu_book` aussi : le glyphe garde le type, la boîte dit où ça va. Les couleurs par type (`primary` / `tertiary` / `secondary`, sans rôle DS, question ID-04 ouverte) disparaissent : la couleur ne dit plus le type, elle dit la destination.
2. **Filtres par fonction.** Remplacer `RX_FILTERS` en dur par une définition portée par `ORDER_DEFS[kind]` : `filters: [{ key, label, icon, predicate, count }]`, `applyFilter`, `counts`, `setFilter`. Le rail de `RxMenu` lit cette définition ; sans définition, pas de rail (comportement actuel de /lab, /img, /ref).
3. **Boutons de ligne génériques.** `medActions(it)` devient `rowActions(kind, it)` ; Mentionner et Documenter viennent de la fonction, les boutons propres à la médication restent dans sa définition.
4. **Puce documentaire générique.** `medicationChipAttrs` / `buildMedicationChipDom` / `CHIP_TYPE_TO_LOG` / `scanDoc` : passer d'un type `medication` à un type par fonction (`labResult`, `imagingStudy`…) ou à un seul type `documented` avec `kind`. Le journal, le Sommaire et le checkout lisent déjà le type : à confirmer au moment de coder.
5. **Tests** : `chipDestination` (déjà), une définition de filtre par fonction, la puce documentaire pour deux fonctions.
**Fichiers :** editor-data.jsx, editor-popover.jsx, editor-schema.jsx, editor.css.

### Lot B — Laboratoire, imagerie, requêtes (P1, L)
1. **Données d'exemple « au dossier »** : quelques résultats de labo (valeur, date, drapeau H / B) et examens d'imagerie passés ; le Sommaire « Résultats » les liste.
2. **Filtres** : Tout, Récents (déjà au dossier), À refaire (périmés), Favoris, Profils (labo), Gabarits (ceux qui proposent une requête). Pour `/req`, un rail commun.
3. **Boutons de ligne** : Mentionner (le résultat existant), Refaire (une nouvelle requête à l'identique, comme Renouveler), Documenter (un résultat reçu ailleurs, sans requête).
4. **Puce documentaire** : résultat avec valeur et drapeau (« PSA 5,9 H »), icône noire sur blanc ; la requête garde l'icône blanche sur bleu.
5. **Statuts** : En suspens et Incomplet déjà là ; un résultat « à refaire » en étiquette de ligne.
**Question :** « Documenter » un résultat de labo : le saisit-on à la main, ou est-ce seulement pour un résultat reçu ?

### Lot C — Référence (P2, M)
Filtres Tout, En cours (références ouvertes), Favoris, Gabarits ; données d'exemple de références en cours ; Mentionner une référence existante, Renvoyer (nouvelle référence à la même spécialité), Documenter ; champ requis « Question clinique » en espace réservé (lot 1) à la place de l'icône d'avertissement ; icône blanche sur bleu.

### Lot D — Consignes, problème, fichier (P2, S)
Une consigne est toujours une action à envoyer : icône blanche sur bleu, rien d'autre à faire que la boîte (Lot A). Le problème et le fichier sont `dossier` : icône noire sur blanc, déjà calculée. Vérifier le rendu et les infobulles.

### Lot E — Diagnostics (P2, M)
Le picker `/dx` a déjà ses sources (Dans cette note, Sommaire, Fréquents, CIM-10) et ses actions (Reprendre, Remplacer, Cesser). Y ajouter le **rail de filtres** de la prescription (Problèmes, Antécédents, Cessés, Fréquents, CIM-10) et la **destination** : une région diagnostic ne va jamais au checkout, donc l'icône d'en-tête passe à noir sur blanc quand elle documente quelque chose du Sommaire. Décision à prendre : le diagnostic suit-il la même anatomie de puce ?

### Lot F — Éléments documentaires hors médication (P3, M par type)
Allergie, signes vitaux, résultat : nouvelles puces documentaires (Figma `8080:29531` : « Iode-123 Allergie 2012 », « TA 148/92 ↑ … », « PSA 5,9 H »), toujours `dossier`, créées depuis le « + » du Sommaire (tweak existant, Q-23) ou une recherche. Voir le §4.2 de `PLAN-prescription-inline.md`.

### Lot G — Fil de lecture du « qui part où » (P2, S–M)
La même destination aux autres endroits où l'élément apparaît : lignes du checkout (`DocumentActionPanel`), « Activités de la note » (Journal), Sommaire « en attente ». Légende courte (infobulle ou texte) : bleu = part au checkout, blanc = déjà au dossier.

---

## 4. Ordre de travail

| Ordre | Lot | Pourquoi |
|---|---|---|
| 1 | A — Fondations | Tout le reste s'appuie dessus ; ne change rien de visible hors la boîte d'icône |
| 2 | B — Labo, imagerie, requêtes | Les plus utilisées après la prescription, et le Figma montre déjà leurs puces documentaires |
| 3 | C — Référence | Même schéma, peu de données |
| 4 | D — Consignes, problème, fichier | Quasi gratuit après A |
| 5 | G — Fil de lecture | À faire une fois que les destinations existent partout |
| 6 | E — Diagnostics | Picker à part, décision d'anatomie à prendre |
| 7 | F — Documentaires hors médication | P3 |

Un lot = une branche = une PR ; chaque lot met à jour `project/Note Clinique.notes.md` ; la logique pure se teste (`node --test project/tests/*.test.mjs`), le comportement se vérifie au navigateur.

## 5. Questions — hypothèses retenues en attendant

| # | Question | Hypothèse |
|---|---|---|
| Q-36 | Quelle icône pour une action **déjà envoyée** et pour une **suggestion** pas encore acceptée ? La règle donnée ne parle que de « en attente au checkout » (bleu) et « déjà au dossier » (blanc) | Envoyée, annulée, suggestion : noire sur blanc, puisqu'il n'y a (plus) rien en attente au checkout |
| Q-37 | La boîte blanche porte-t-elle un contour ? | Oui, un trait de 1 px (`outline-variant`) : sans lui, la boîte blanche sur la puce blanche ne se voit pas |
| Q-38 | Les couleurs par type (labo bleu, imagerie, référence) disparaissent-elles ? | Oui : la couleur de l'icône dit désormais la destination, le glyphe dit le type |
| Q-39 | Le diagnostic (région, pas puce) suit-il la même anatomie ? | À décider avant le lot E |
| Q-40 | Les données « au dossier » de labo, imagerie et référence : d'où viennent-elles ? | Exemples fictifs dans le prototype, marqués « à valider cliniquement » |

## 6. Hors périmètre

- Mettre à jour le Figma (les deux exemples de tuile gardent leur icône d'avant) : c'est au design de décider s'il reprend la règle.
- Vraies données du dossier (DSQ, résultats réels) : le prototype n'en a pas.
- Le clavier pour les boutons de ligne et le rail (Tab sert d'Entrée dans ce menu) : sujet transversal d'accessibilité.
