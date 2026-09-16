# Plan — Checkout V7 : ce qui doit changer dans le système

Source design : [Figma — Checkout · Vision, section **V7**](https://www.figma.com/design/F3Nia0ctWn4PD7DuW9ZMMI/Checkout---Vision?node-id=17337-189501) (`fileKey` `F3Nia0ctWn4PD7DuW9ZMMI`, node `17337:189501`).

Ce document est la référence pour le checkout. Il remplace l'ancien plan de transmission d'ordonnance, retiré du dépôt — celui-ci reste consultable dans l'historique git (`git show 8a3f881:PLAN-transmission-ordonnance.md`) pour l'historique des décisions (§1), la barre du bas de la note (§2.1) et les écrans fax/impression (§2.5), qui n'ont pas changé.

**Principe directeur : l'affichage est arrêté.** Les variantes de mise en page construites pendant l'exploration disparaissent (§A) — mais l'animation d'entrée reste (§A.1).

---

## 0. Écrans vérifiés

| Node | Nom | Utilisé pour |
|---|---|---|
| `17296:178443` | section « Transmission d'une ordonnance » | flux principal |
| `17327:183804` | Ordonnance — non complétée, menu Compléter ouvert | §B1, §B5 |
| `17327:188208` | Complété | §B1, §B2 |
| `17330:328889` | Outil clinique (IRM Colonne lombaire) | §D |
| `17441:193304` | « Cart » — onglets Suggestions / Aperçu | §B4 |
| `17327:178274` | « modal-finaliser-envoyer » → **Envoi rapide** | §C |
| `17330:317877` | section « Erreur de transmission » | §E — **hors périmètre** |
| `17340:189502` | section « Suggestions destinataires » | §F |
| `17340:192429`, `17340:192562` | Destinataire — états vides | §F |
| `17327:191372` | section « Composants Q3 » | §G |
| `17330:315996` | Complété et faxé (+ faxer à) | §H — conforme au `FaxScreen` actuel |
| `17330:225770` | Complété et imprimer | §H — non diffé en détail |
| `17327:183984` | Note (barre du bas `[💾][Compléter][➤]`) | §H — conforme |
| `17291:181031` | « Transmission » 1440×900, hors section | présumé périmé — voir §I.2 |

---

## A. Surfaces : une seule mise en page, l'animation conservée

### État actuel

| Variante | Où | Sort |
|---|---|---|
| Animation `sheet-up` + `sheet-scrim-in` | `TransmissionModal.jsx:414,421` | **conservée** |
| Dialogue centré léger | `QuickSendModal.jsx` | conservé, contenu réécrit (§C) |
| Panneau 3 colonnes vs 2 colonnes (`compact`) | `DocumentActionPanel.jsx:74` — `dap.cols` / `dap.colsCompact` | **supprimé** |
| Aperçu plein écran | `DocumentActionPanel.jsx` — `previewZoom` | conservé (icône ⛶) |
| Machine `'review' \| 'print' \| 'fax'` **écrite deux fois** | `TransmissionModal.jsx:180` et `QuickSendModal.jsx:11` | **dédupliquée** |

### Changements

1. **L'animation d'entrée reste.** Le checkout complet adopte la mise en page V7 (overlay ancré sous le header DME, rail de navigation visible à gauche, coins arrondis, `X` en haut à droite) **mais garde son entrée `sheet-up 320ms cubic-bezier(.16,1,.3,1)`** et le scrim `sheet-scrim-in`. Ne pas toucher aux `@keyframes` de [Note Clinique.html](project/Note%20Clinique.html) — `sheet-scrim-in` sert aussi à [DocumentViewerModal.jsx:112](project/note-ui/DocumentViewerModal.jsx#L112).
2. `DocumentActionPanel` : supprimer la prop `compact` et le style `dap.colsCompact`. Le composant n'aura plus qu'un seul appelant.
3. `QuickSendModal` : réécrire (§C). Il n'importe plus `DocumentActionPanel`.
4. Machine `review/print/fax` : la dédupliquer. `PrintDialog` et `FaxScreen` n'auront plus qu'un appelant côté checkout complet ; l'Envoi rapide n'a besoin que de l'impression (icône 🖨 dans son pied).

---

## B. Checkout complet — écarts avec le code actuel

### B1. Barre d'action du document : deux boutons, plus des icônes

Aujourd'hui : split « Compléter » + petites icônes imprimer/envoyer.

V7, document de type ordonnance :

| État | Bouton gauche | Bouton droit |
|---|---|---|
| Non complétée | `[Compléter l'ordonnance ▾]` actif (split, menu inchangé : Compléter / et imprimer / et faxer / et faxer à) | `[Transmettre l'ordonnance]` **désactivé** |
| Complétée | `[Compléter l'ordonnance ▾]` **désactivé** | `[Transmettre l'ordonnance]` **primaire rempli** |

V7, document de type outil clinique (`17330:328889`) : bouton « Compléter » désactivé + deux **boutons-icônes** 🖨 et ➤ à droite. (Le libellé dit encore « Compléter l'ordonnance » dans la maquette — oubli manifeste ; utiliser un libellé générique.)

### B2. Badges de statut

`Non complétée` / `Complétée` et `Non transmise` / `Transmise` restent, avec les trois statuts dérivés existants (`À compléter` / `Prêt` / `Finalisé`). Pas de quatrième statut : l'erreur est hors périmètre (§E).

Nuance à trancher : dans `17327:188208` (Complété) seul le badge `Complétée` est affiché, le badge de transmission disparaît. Voir §I.4.

### B3. Colonne « Contenu » : sections repliables + Pièces jointes — **inclus**

`17401:191612` montre la première colonne découpée en sections à en-tête gris repliable :

- **Prescriptions** (dépliée, les lignes)
- **Pièces jointes** (repliée)

Aujourd'hui la colonne est une liste plate. À faire : introduire les sections, et la section **Pièces jointes** dans le checkout complet — pas seulement dans l'Envoi rapide.

Le bloc pièces jointes (spéc dans Composants Q3) : en-tête `PIÈCES JOINTES +`, chips ajoutées avec `✕` pour retirer (ex. `Liste de médicament active ✕`). Le chip `✨ N` et le panneau de suggestions qui l'accompagnent sont **derrière le tweak** (§B4).

### B4. Suggestions — derrière un tweak, masquées par défaut

Toutes les suggestions ✨ du checkout sont pilotées par **un seul réglage** du panneau Tweaks, `checkoutSuggestions`, **`false` par défaut** :

- le chip `✨ N` et le bloc `✨ SUGGESTION N` de la colonne Destinataire (§F) ;
- le chip `✨ N` et le panneau `✨ SUGGESTIONS (N)` du bloc Pièces jointes (§B3) ;
- l'onglet « Suggestions » du panneau `17441:193304` (voir §I.3).

Quand le tweak est à `false` : aucun chip ✨, aucun bloc de suggestions, la colonne Destinataire ne montre que le bandeau d'état vide et les destinataires ajoutés. Quand il est à `true` : tout apparaît, conformément aux maquettes.

Contenu des suggestions, pour quand le tweak est activé (`17441:193304` + Composants Q3) :
- destinataires : cartes contact avec ♡, adresse, ☎, 📠 et `+` ;
- pièces jointes : `Instruction patient +`, `Résumé note clinique +` ;
- contenu : groupes `Instructions patient` et `Renseignements cliniques`, cartes à puces avec `+`, stepper `⌃⌄` par groupe.

### B5. Sidebar

- En-tête : `N documents`, rien d'autre. Le bouton pilule **« ➤ Mode »** visible dans toutes les maquettes est un **reste d'exploration** — ne pas le construire. Il n'existe pas dans le code actuel : il n'y a donc rien à retirer, seulement à ne pas ajouter.
- Catégories avec compteur : `ORDONNANCE 1`, `OUTILS CLINIQUES 3`.
- **Une catégorie vide n'est pas rendue** — pas de titre, pas de compteur à zéro (§D).
- Item : titre, sous-titre (`5 prescriptions`, `Colonne lombaire`), ligne destinataire (`CHU de Québec - Radiologie`, ou **`Aucun destinataire` en ambre**), icône de statut à droite.
- Pied : `+ Ajouter`.

### B6. Pied global

🖨 + `Transmettre le document prêt` + `Tout transmettre (N)`. Conforme au code actuel.

---

## C. Envoi rapide (ex-`QuickSendModal`) — contenu entièrement revu

Node `17327:178274`. Dialogue centré, une seule carte, une seule action primaire.

```
Envoi rapide                                              ✕
┌──────────────────────────────────────────────────────┐
│ ℞ Ordonnance   [Non complétée] [Non transmise]       │
│                                                       │
│ PRESCRIPTIONS (5)  +                                  │
│   … lignes identiques au checkout complet             │
│                                                       │
│ DESTINATAIRE (1)  +                                   │
│   ★ Jean Coutu Alexandra Allie & Guillaume Beauregard │
│     adresse · ☎ · 📠                            ♡     │
│                                                       │
│ PIÈCES JOINTES  +                                     │
│   [x] Liste de médicaments active  [ ] Note clinique  │
│                                                       │
│ ┌──────────────────────────────────────────────────┐ │
│ │ Note pour le pharmacien                          │ │
│ └──────────────────────────────────────────────────┘ │
│ 0/500                                                 │
└──────────────────────────────────────────────────────┘
 📄 1 document · 1 destination      🖨   [➤ Compléter et envoyer]
```

Nouveautés par rapport au code : **pièces jointes à cocher**, **champ libre 0/500**, **une seule action primaire** (plus de split button), **récapitulatif « N document · N destination »** dans le pied. Les suggestions ✨ y suivent la même règle qu'ailleurs (§B4).

Le lien « Voir tous les documents de la note » (prop `onOpenFull`) n'apparaît pas dans la maquette — le garder reste utile en prototype.

---

## D. Outils cliniques transmissibles — seulement s'il y en a dans la note

L'ancien plan de transmission (§4.4) excluait **explicitement** les formulaires `clinicalTool` du checkout, faute de modèle de destination. V7 les montre comme documents à part entière (« Examen physique simple / Prostate »).

**Règle de visibilité : la section « Outils cliniques » n'existe que si la note en contient.** Note sans outil clinique → pas de catégorie dans la sidebar, pas de compteur à zéro, pas d'état vide. C'est cohérent avec le principe « 100 % dynamique » de l'ancien plan : le checkout ne montre que ce qui existe réellement dans la note.

À faire :

1. `buildTransmissionDocs()` ([NoteEditor.jsx:494](project/note-ui/NoteEditor.jsx#L494)) doit émettre **un document par node `clinicalTool`**, en plus des chips `lab`/`imaging`/`referral`/`instructions`, et ne rien émettre s'il n'y en a pas.
2. Les nodes `clinicalTool` doivent porter `recipients`, `complete`, `transmitted` — extension du schéma dans [editor-schema.jsx](project/note-ui/editor-schema.jsx) (`makeClinicalToolNode`) et de `scanDoc`.
3. **Layout à 2 colonnes** pour ces documents : `DESTINATAIRE` puis `APERÇU`, sans colonne de contenu — le document *est* son aperçu (formulaire de requête). En-tête : icône 🔧 + `Outil clinique: <titre>`.
4. Ajouter une entrée dans `TX_META` ([TransmissionModal.jsx](project/note-ui/TransmissionModal.jsx)) pour le kind `clinicalTool` (icône, accent, `nounPhrase`, suggestions de destinataires).

À noter : dans la sidebar, la catégorie « Outils cliniques » regroupe **à la fois** les formulaires `clinicalTool` et les requêtes imagerie/labo — cohérent avec le regroupement actuel.

---

## E. Erreur de transmission — HORS PÉRIMÈTRE

Section `17330:317877`. **Décidé : non couvert par ce prototype.** Ne rien construire. Résumé conservé ici seulement pour mémoire, si le sujet revient :

- 4ᵉ compteur rouge `❗ N Erreur` en tête, avant `À compléter` ;
- 4ᵉ icône de statut (❗ rouge) dans la sidebar + infobulle « Erreur de transmission » ;
- bandeau rouge **dans la carte destinataire** : « Tentative de transmission le 2026-07-30 à 11h30. » + lien `Retransmettre` ;
- conséquence de modèle : l'erreur appartiendrait au couple **(document, destinataire)**, pas au document — donc `lastAttemptAt` / `failed` par destinataire et un état `error` prioritaire dans `txStatus()`.

Ne pas ajouter ces champs tant que le sujet n'est pas repris.

---

## F. Destinataires — états vides, canaux, retrait

Deux états vides (`17340:192429`, `17340:192562`) :

- **Court** : bandeau ambre « ⚠ Ajouter une pharmacie ou un professionnel de la santé pour transmettre l'ordonnance. »
- **Long** : « **Aucun destinataire** » + la même phrase + lien **« Ajouter depuis le bottin »**.

Carte destinataire ajoutée (`Destinataire.ajouté`, Composants Q3) :

- ♡ favori (★ dans l'Envoi rapide) ;
- **deux boutons de canal** : fax (rempli bleu, actif) et courriel (contour) — le canal est porté par le destinataire ;
- **✕ au survol**, en pastille sur le coin, pour retirer le destinataire.

Écarts avec le code actuel : les deux canaux, le retrait au survol et le lien « Ajouter depuis le bottin » n'existent pas.

Le bloc `✨ SUGGESTION N` (avec son icône œil barré) suit la règle du §B4 : masqué tant que le tweak est à `false`.

---

## G. Composants à aligner (section `17327:191372`)

| Composant | Spéc |
|---|---|
| `Statut.document` | 3 icônes utiles : ⚠ ambre, ✓ bleu, ✓✓ vert (la 4ᵉ, ❗ rouge, relève de §E — non implémentée) |
| `Ligne.document` | repos / **sélectionné** (barre bleue à gauche + titre bleu + fond lavande) / transmis (✓✓) |
| `Ligne.nouvelle.prescription` | icône ⓘ bleu ; **survol → ✏️ et 🗑** |
| `Ligne.renouvellement.prescription` | icône ↺ ambre ; idem |
| `Ligne.cessation.prescription` | icône ⊗ rouge, « Cessé le AAAA-MM-JJ » ; idem |
| `Destinataire.suggestion.ajout` | carte + `+`, états repos/survol — sous tweak (§B4) |
| `Suggestions Sidebar Panel` | en-tête `✨ SUGGESTION N` + œil barré — sous tweak (§B4) |
| Bloc pièces jointes | `PIÈCES JOINTES +`, chips ajoutées avec `✕` |

Le manque le plus visible côté code : les lignes de prescription n'ont **aucune action au survol** aujourd'hui.

---

## H. Ce qui ne change pas

- [FaxScreen.jsx](project/note-ui/FaxScreen.jsx) — répertoire / cercle de soins, recherche, filtre type de ressource, pagination, `Envoyer à` + numéro de fax, aperçu, bouton Faxer : conforme à `17330:315996`.
- [PrintDialog.jsx](project/note-ui/PrintDialog.jsx) — le frame `17330:225770` existe ; **non diffé en détail**, à revalider si on y touche.
- Machine `complete` / `transmitted` et compteurs `À compléter` / `Prêt` / `Finalisé`.
- Barre du bas de la note `[💾 Sauvegarder] [Compléter] [➤]` (`17327:183984`).
- Le menu split à 4 options (Compléter / et imprimer / et faxer / et faxer à).
- L'animation d'ouverture du checkout (§A.1).

---

## I. Panneau Tweaks — persistance entre les sessions

Demande : **les valeurs modifiées dans le panneau doivent définir le comportement par défaut du prototype et survivre au rechargement.**

### Pourquoi ça ne tient pas aujourd'hui

[tweaks-panel.jsx](project/tweaks-panel.jsx) — `useTweaks` initialise son state avec `TWEAK_DEFAULTS` et poste `__edit_mode_set_keys` à `window.parent`. La persistance dépend donc entièrement d'un **hôte** qui réécrit le bloc `/*EDITMODE-BEGIN*/ … /*EDITMODE-END*/` dans le HTML. Servi par [.claude/serve.py](.claude/serve.py) — c'est-à-dire en séance de test — il n'y a pas d'hôte : chaque rechargement repart des valeurs du fichier.

### Ce qu'il faut faire

Ajouter une couche `localStorage` dans `useTweaks`, **sans retirer** le `postMessage` (les deux mécanismes coexistent : l'hôte continue de fonctionner quand il est là).

1. **Clé de stockage par page** — `tweaks-panel.jsx` est chargé par trois pages ([Note Clinique.html](project/Note%20Clinique.html), [Header patient.html](project/Header%20patient.html), `snapshots/v1/Note Clinique.html`). Sans ça, leurs réglages se mélangeraient. Ex. : `'tweaks:' + location.pathname`.
2. **Ne persister que les écarts au défaut**, pas l'objet complet. Si on stocke tout, modifier `TWEAK_DEFAULTS` dans le HTML plus tard n'aurait plus aucun effet — la valeur figée dans le navigateur masquerait le fichier. En ne stockant que les clés réellement modifiées, une nouvelle valeur par défaut dans le fichier continue de passer pour toutes les clés jamais touchées.
3. **Fusion à l'initialisation** : `Object.assign({}, defaults, overridesStockés)`, dans le `useState(function(){...})` d'init pour que le premier rendu soit déjà correct (pas de flash de valeur par défaut).
4. **`try/catch` sur toutes les lectures/écritures** — `localStorage` lève en navigation privée et quand les données de site sont bloquées ; le prototype doit démarrer normalement avec zéro valeur stockée.
5. **Bouton « Réinitialiser les tweaks »** en pied de panneau : `localStorage.removeItem(clé)` + retour à `TWEAK_DEFAULTS`. Indispensable — sans lui, un réglage oublié en séance de test devient impossible à retrouver.

Effet de bord bienvenu : `reviewingMode` et `reviewAuthor` (mode révision) deviennent eux aussi persistants, ce qui règle le point « le flag est encore à `false` par défaut » relevé sur cette branche.

### Nouveau réglage à ajouter

| Clé | Type | Défaut | Effet |
|---|---|---|---|
| `checkoutSuggestions` | booléen | `false` | Affiche/masque tous les blocs ✨ du checkout (§B4) |

---

## J. Questions ouvertes — à trancher avant de coder

1. **Le frame « Transmission » 1440×900** (`17291:181031`), posé hors des sections de V7, a un pied et des libellés différents (`Ouvrir le bottin`, `Aggrandir`, `Transmettre le document prêt (1)`, `✓ 1 document prêt · 3 à compléter`) et empile Aperçu + suggestions au lieu de les mettre en onglets. Traité ici comme **itération antérieure** — à confirmer.
2. **Onglets Suggestions / Aperçu** (`17441:193304`) : remplacent-ils la 3ᵉ colonne, ou vivent-ils ailleurs ? Les écrans complets montrent `APERÇU` sans onglets. Question moins urgente maintenant que les suggestions sont derrière un tweak à `false`, mais il faut savoir quoi construire pour le cas `true`.
3. **Écran « Complété »** : le badge `Non transmise` disparaît alors qu'il est présent partout ailleurs. Volontaire ?
4. **L'item « Note »** (faire suivre + signature, `NoteActionPanel`) n'apparaît dans aucune maquette V7. On le garde tel quel dans la liste des documents ? Rappel : il porte aujourd'hui le seul chemin de finalisation de la note.

*Tranché : le bouton « ➤ Mode » de la sidebar est un reste d'exploration, il n'est pas construit (§B5).*

---

## K. Ordre de travail suggéré

1. **§I — persistance des tweaks.** Indépendant du reste, court, et ça sert immédiatement à toutes les séances de test.
2. **§A — surfaces.** Nettoyage pur (`compact`, déduplication print/fax), aucune régression fonctionnelle, dégonfle le code avant le reste.
3. **§B1–B2 — barre d'action à deux boutons** et états associés.
4. **§C — Envoi rapide.** Autonome une fois §A fait.
5. **§B3 + §F — pièces jointes, états vides destinataires, canaux, retrait au survol.**
6. **§D — outils cliniques transmissibles.** Le plus lourd : touche le schéma Tiptap, `scanDoc` et `buildTransmissionDocs`.
7. **§B4 — suggestions**, derrière `checkoutSuggestions`. En dernier, puisque masquées par défaut.
8. **§G — alignement des composants.**

---

## L. Contexte de branche

Ce plan est écrit depuis `feat/mode-revision`, qui porte du travail **non commité** sans rapport avec le checkout : le mode révision ([review-mode.jsx](project/note-ui/review-mode.jsx)) et la prévisualisation de fichiers joints ([DocumentViewerModal.jsx](project/note-ui/DocumentViewerModal.jsx)). Commiter ou isoler ce travail avant d'attaquer le checkout.

---

## M. Proposition revue — nœud `17744:261398` (« la dernière version »)

Source : section **« Proposition revue »**, même fichier Figma, node `17744:261398` (et le pied de note isolé `17782:31054`). Six écrans vérifiés à cette date : `17744:261425`/`273483`/`266931`/`271266` (Ordonnance, 4 états), `17744:265214` (Note, avec le nouveau pied), `17744:269391` (Avant sélection, un outil clinique/imagerie).

C'est un écart **beaucoup plus large** que V7 : deux sous-systèmes entiers qui n'existent pas dans le code, et un changement d'architecture (panneau plein écran vs. bottom-sheet actuel). Avant de coder quoi que ce soit ici, il faut trancher le scope (§M.3) — cette section documente l'écart, elle ne lance pas l'implémentation.

### M.1 — Écart incrémental (même portée fonctionnelle, habillage différent)

- **Pied de la note** (`17744:265214`, `17782:31054`) : remplace les compteurs bruts par type de chip (Rx/labo/imagerie/référence/diagnostic/fichier — [Note Clinique.html:416-468](project/Note%20Clinique.html#L416-L468)) par 3 pastilles **fraction complété/total** — « Documents » (bundle Rx + outils cliniques, ex. `℞ 1/5` `🔧 2/2`), « Portail Patient » (ex. `2`), « Pré-facturation » (montant, ex. `231,75$`). Une pastille à `total` atteint passe grisée (satisfaite) plutôt que colorée.
- **Statuts d'en-tête** : texte souligné + point coloré (« 2 à compléter · 2 Prêt · 0 transmis ») au lieu des pastilles pleines actuelles ([TransmissionModal.jsx](project/note-ui/TransmissionModal.jsx) `tx.pill`).
- **Regroupement sidebar** : catégories nommées et comptées — MÉDICATION 1 / LABORATOIRE 1 / IMAGERIE 2 / CONSULTATION 0 / EXAMENS DIAGNOSTIQUES 0 — plutôt que ORDONNANCE / OUTILS CLINIQUES actuels.
- **Destinataire** : liste triée par distance (« 1,2 km »), favoris (♥), et une carte géographique qui s'affiche au focus du champ de recherche (`273483`). Le bottin actuel (`DocumentActionPanel`/`renderSideRow`) n'a ni distance, ni carte, ni favoris.
- **Icônes par ligne de prescription** (nouvelle/renouvellement/cessation) : déjà amorcé côté code (`variant` dans `NoteEditor.jsx`/`DAP_VARIANT` dans `DocumentActionPanel.jsx`) — à revérifier contre le mapping exact d'icônes des mockups plutôt qu'à reconstruire.
- **« Renseignements cliniques »** avec compteur de suggestions ✨ et champ « Rechercher au dossier » : proche de ce qui existe déjà derrière le tweak `checkoutSuggestions` (§B4/§I) — à vérifier si c'est bien le même bloc ou un nouveau.

### M.2 — Entièrement nouveau (hors scope actuel)

- **Onglet « Portail patient »** (partage de documents au patient, « 0 élément partagé ») : aucune trace dans le code existant.
- **Onglet « Pré-facturation »** (services facturables + montant) : idem, rien d'existant.
- **Carte interactive** pour le choix du destinataire : aucune lib de carte dans le projet actuellement.

*Tranché : ça reste un bottom-sheet (même mécanique que `TransmissionModal` actuel, animation d'entrée gardée) — pas de migration vers un panneau plein écran. Les captures qui semblaient montrer un panneau remplaçant le `Sommaire` sont trompeuses (le bottom-sheet actuel couvre déjà quasi tout le viewport à 95vh).*

### M.3 — Questions à trancher avant de coder

1. **Scope** : construit-on Portail patient et Pré-facturation maintenant (deux sous-systèmes complets), ou seulement leur pastille de pied de note à titre décoratif/désactivé pour l'instant ?
2. **Carte** : vraie intégration cartographique (nouvelle dépendance) ou simple illustration statique façon maquette ?
3. **Pied de note** : si le reste est différé, applique-t-on déjà le nouveau design de pastilles (Documents/Portail Patient/Pré-facturation) au pied actuel, avec Portail Patient/Pré-facturation à 0 en dur ?

**Première étape retenue (voir §M.4 ci-dessous) : le pied de note seul**, le reste (sidebar par catégorie, destinataire distance/favoris/carte, onglets Portail patient/Pré-facturation) reste en attente.
