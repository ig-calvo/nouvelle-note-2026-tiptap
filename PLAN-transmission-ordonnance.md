# Plan d'implémentation — Transmission des documents (checkout)

Source design : [Figma — Checkout · Vision](https://www.figma.com/design/F3Nia0ctWn4PD7DuW9ZMMI/Checkout---Vision?node-id=17296-178443), section **« Transmission d'une ordonnance »** (node `17296:178443`).

Ce document est destiné à un agent Claude (Sonnet) qui codera la fonctionnalité dans ce prototype React/Tiptap (`project/note-ui/`). Il part du principe qu'il lira aussi [README.md](README.md) et [project/Note Clinique.html](project/Note%20Clinique.html).

---

## 1. Décisions confirmées avec l'utilisateur

| Sujet | Décision |
|---|---|
| Lien note ↔ checkout | **Module indépendant.** Le checkout gère la transmission des documents ; la complétion de la note reste un geste séparé. *(Confirmé de plus par le Figma lui-même : la barre du bas ajoute une icône **➤** distincte du bouton **Compléter** — voir §2.1.)* |
| Périmètre | **Multi-documents** — Ordonnance + « outils cliniques » (imagerie, labo, référence…) avec leurs statuts propres, pas seulement l'ordonnance. |
| Source des données | **100 % dynamique** — uniquement ce qui existe réellement dans la note (chips), pas de contenu figé/fictif injecté dans le composant. |
| Flux impression / fax | **Écrans simulés fidèles** — un faux dialogue d'impression et un écran « Faxer un document » complet avec répertoire filtrable, comme dans le Figma. |
| Faire suivre la note + signature | **Déplacés dans leur propre section** (`FinalizeNoteModal`, §3), déclenchée par « Compléter » — décorrélée du checkout de transmission des documents. |

## 2. Ce que le Figma révèle (analyse d'écrans)

### 2.1 Barre du bas de la note (node `17327:184061`)
Le pied de la carte note contient, de gauche à droite : compteurs Rx/outils cliniques (badges), puis à droite **[💾 Sauvegarder] [Compléter] [➤]**. L'icône **➤** est un bouton icône séparé, pas une déclinaison de « Compléter ».

→ **Conséquence directe pour l'implémentation** : ajouter ce bouton icône dans le footer de [Note Clinique.html](project/Note%20Clinique.html) (à côté du bouton Compléter existant, ligne ~417-421). C'est lui qui ouvre le nouveau checkout de transmission (`TransmissionModal`, §5). Le bouton **Compléter** garde son rôle de finalisation de la note, mais passe désormais par sa propre petite fenêtre (§3) au lieu d'un appel direct.

### 2.2 Écran « Transmission des documents » (node `17327:183804`, capture jointe)
Plein écran (overlay au-dessus du dossier, pas un dialogue centré comme l'actuel `CheckoutModal`).

- **En-tête** : titre « Transmission des documents » + 3 compteurs de statut globaux (`À compléter` / `Prêt` / `Finalisé`) + bouton fermer (X).
- **Sidebar gauche** : liste des documents de la note, groupés par catégorie :
  - **ORDONNANCE** — un seul document qui bundle toutes les prescriptions (« 5 prescriptions », destinataire affiché en sous-texte).
  - **OUTILS CLINIQUES** — chaque item (imagerie, labo, référence…) est son **propre document individuel**, pas groupé par type. Chaque ligne affiche une icône de statut (⚠ à compléter / ✓ prêt / ✓✓ finalisé) + le destinataire déjà choisi le cas échéant.
  - Bouton « + Ajouter un document » en bas de la sidebar.
- **Panneau document sélectionné** (3 colonnes) :
  1. **Contenu** — pour l'ordonnance : liste des prescriptions avec icône d'état par ligne (info / historique — remplacement / annulée). Pour un autre type de document, ce serait un résumé des détails de la requête (voir §5.3).
  2. **Destinataire** — compteur `(0)` avec bannière d'avertissement si vide, bouton `+`, et un bloc **Suggestions ✨** (contacts favoris ♥ avec téléphone/fax, masquable par un œil barré).
  3. **Aperçu** — rendu façon PDF du document (en-tête clinique, patient, Rx, signature, mentions légales), avec bouton plein écran.
- **Barre d'état du document** (au-dessus des 3 colonnes) : badges `Non complétée`/`Complétée` et `Non transmise`/`Transmise`, bouton splitté **« Compléter l'ordonnance »** (voir §2.3), icônes imprimer/envoyer.
- **Footer global** : « Transmettre le document prêt » (documents déjà complétés, pas encore transmis) + « Tout transmettre (N) ».

### 2.3 Menu « Compléter » (split-button, propre au document du checkout)
4 options : **Compléter** / **Compléter et imprimer** / **Compléter et faxer** / **Compléter et faxer à** (préremplit un destinataire fax spécifique — probablement celui du destinataire sélectionné).

Tooltip observé sur le bouton désactivé : *« Aucun destinataire sélectionné / Ordonnance non complétée »* — donc le bouton est désactivé tant que ces deux conditions ne sont pas remplies (voir machine à états §2.4).

⚠️ Ne pas confondre ce bouton (complète **un document** dans le checkout de transmission) avec le bouton **Compléter** de la barre du bas de la note, qui finalise **la note entière** via `FinalizeNoteModal` (§3). Les deux portent le même mot mais agissent à des niveaux différents.

### 2.4 Machine à états par document (déduite des captures « avant/après complétion »)

Chaque document a deux booléens indépendants :
- `complete` (Non complétée → Complétée) — posé par « Compléter »/« Compléter et… » du document.
- `transmitted` (Non transmise → Transmise) — posé par un envoi réel (imprimer compte comme transmis dans ce flux, faxer aussi).

Le badge de statut affiché dans les compteurs et la sidebar est dérivé :

| `complete` | `transmitted` | Badge |
|---|---|---|
| false | false | **À compléter** |
| true | false | **Prêt** |
| true | true | **Finalisé** |

Vérifié numériquement sur les captures : état initial `2 À compléter / 1 Prêt / 1 Finalisé` (Ordonnance + Examen physique non complétés, IRM complété-non transmis, Radiographie complété-transmis) → après avoir complété l'Ordonnance : `1 À compléter / 2 Prêt / 1 Finalisé`. Les totaux (4 documents) restent constants — seul le statut de l'ordonnance a changé de colonne.

### 2.5 Écrans d'impression et de fax
- **Impression** (node `17330:225770`) : simulation d'un dialogue d'impression de navigateur (Chrome) devant l'aperçu du document. → à recréer comme faux dialogue (pas de vrai `window.print()`), pour rester cohérent avec le fax simulé et parce que le contenu est généré dynamiquement.
- **Fax** (node `17330:315996`, écran « Faxer un document ») : deux colonnes — répertoire (onglets **Répertoire** / **Cercle de soins**, recherche + filtre par type de ressource, liste paginée de contacts avec `+` pour ajouter), champ **Envoyer à** + **numéro de fax**, aperçu PDF à droite, bouton **Faxer**.

### 2.6 Règles métier (stickies Figma)
- Une fois un document **complété**, l'utilisateur peut l'imprimer, ou le transmettre *si* un destinataire est sélectionné.
- Une fois **envoyé** : s'il reste des documents non transmis dans le checkout → revenir à l'écran « Transmission des documents » ; sinon → fermer.
- Si le destinataire est changé/ajouté **depuis l'écran de fax**, cela doit se répercuter dans les écrans précédents (le panneau Destinataire du checkout).

## 3. Finalisation de la note — section indépendante (`FinalizeNoteModal`)

L'actuel `CheckoutModal.jsx` mélangeait deux préoccupations distinctes : la transmission des documents cliniques (remplacée par le flux du §2) et la finalisation de la note elle-même (faire suivre la note à un tiers + signature médecin/établissement). Le Figma analysé ne couvre que la première. Sur demande de l'utilisateur, la seconde devient **sa propre section**, découplée du checkout de transmission.

### 3.1 Pourquoi une section à part
- La transmission (§2) porte sur des **documents cliniques individuels** (Rx, requêtes) envoyés à des tiers externes (pharmacie, labo, spécialiste) — logique déjà couverte par le Figma.
- La finalisation porte sur **la note elle-même** en tant qu'objet du dossier patient (la faire suivre à un collègue/au patient, la signer) — c'est un geste de fin de rédaction, pas un envoi de document clinique. Les deux ne partagent pas de destinataires ni de statuts.
- Conserver ce comportement évite une régression fonctionnelle par rapport à l'actuel `CheckoutModal` tout en respectant le fait que le nouveau design Figma ne le montre pas comme faisant partie de la transmission.

### 3.2 Contenu de `FinalizeNoteModal`
Reprend, en les isolant, les blocs déjà présents dans l'actuel `CheckoutModal.jsx` (fonction `renderMetaSection`, styles `cm.metaSection`/`cm.noteTile`/`cm.sigRow`, données `CM_FORWARD_OPTS`/`CM_OTHER_DOCTORS`/`CM_OTHER_INSTITUTIONS`) :

- **Tuile de la note** : titre, date/heure, médecin, établissement, badge type de visite (déjà implémenté — `cm.noteTile`).
- **Faire suivre la note** : liste déroulante (`Ne pas faire suivre` / `Médecin de famille` / `Médecin référent` / `Patient (portail sécurisé)` / `Autre professionnel de la santé`).
- **Signature** : deux listes déroulantes, Médecin et Établissement (valeurs par défaut = `doctorName`/`institution` passés en props, plus quelques options fictives comme aujourd'hui).
- **Avertissement optionnel** : si `buildTransmissionDocs()` (§5.1) retourne des documents transmissibles non encore `transmitted`, afficher un bandeau *« Cette note contient N document(s) non transmis »* avec un bouton secondaire qui ouvre `TransmissionModal` (sans fermer `FinalizeNoteModal` — ou en le fermant puis le rouvrant automatiquement une fois la transmission terminée, au choix de l'implémentation). Objectif : éviter qu'un médecin complète une note en oubliant d'envoyer une ordonnance, sans pour autant bloquer la complétion (cf. §2.6 — la transmission reste indépendante).
- **Confirmation** : au clic sur « Compléter la note », afficher brièvement un état de succès (repris de `cm.doneWrap`/`cm.doneCheckCircle` — « Note sauvegardée et ajoutée au Journal de notes »), puis appeler `finalizeComplete()` et fermer.

### 3.3 Déclenchement
Le bouton **Compléter** de la barre du bas (`Note Clinique.html`) ouvre `FinalizeNoteModal` au lieu d'appeler `finalizeComplete()` directement. C'est ce modal, à sa confirmation, qui appelle `finalizeComplete()`.

## 4. Hypothèses retenues (à valider en cours de route, pas bloquantes)

Ces points n'ont pas été tranchés explicitement par l'utilisateur ; voici les défauts raisonnables retenus pour ce plan — à ajuster si l'utilisateur redirige :

1. **Plusieurs destinataires par document** : le `+` à côté de « Destinataire (N) » reste visible même à N≥1 dans le Figma → on autorise une **liste** de destinataires par document, pas un remplacement unique.
2. **Aperçu généré dynamiquement** : cohérent avec le choix « 100 % dynamique » — un gabarit HTML (voir §5.4) rend le vrai contenu de la note (prescriptions, patient, signature), réutilisé pour l'aperçu, le dialogue d'impression et l'écran de fax.
3. **Actions d'ajout** : seul le `+` **Destinataire** est fonctionnel (ouvre une recherche/liste de contacts fictifs + suggestions cliquables). « + Ajouter un document » (sidebar) et l'ajout de prescription restent décoratifs pour cette itération — hors périmètre du test.
4. **Portée « Outils cliniques »** : seuls les chips déjà transmissibles dans le modèle actuel (`lab`, `imaging`, `referral`, `instructions` — voir `scanDoc`/`buildCheckoutGroups` dans `editor-schema.jsx`/`NoteEditor.jsx`) apparaissent comme documents. Les formulaires d'outils cliniques embarqués (`ClinicalTool.jsx`, ex. « Examen physique ») ne sont **pas** transmissibles dans cette itération — le Figma en montre un dans sa démo, mais rien dans le code actuel ne modélise une destination pour ces formulaires. Si l'utilisateur veut les inclure, c'est une extension notable du modèle de données (ajouter un état `destinataire`/`statut` aux nodes `clinicalTool`), à traiter comme un lot séparé.
5. **Scénario de test riche** : comme les données sont 100 % dynamiques, le checkout sera pauvre si la note ne contient qu'une seule prescription (cas par défaut du prototype). Recommandation : préparer un **point de départ de démo** (`startPoints`) avec plusieurs prescriptions + une imagerie + un labo, pour que les séances de test ressemblent à la richesse du Figma. Ce n'est pas un mock injecté dans le composant — juste un contenu de note plus généreux pour la démo.
6. **Avertissement de documents non transmis** dans `FinalizeNoteModal` (§3.2) : non montré explicitement dans les stickies Figma, ajouté par cohérence pour éviter de perdre silencieusement des documents non envoyés. Purement informatif — ne bloque jamais la complétion.

## 5. Modèle de données

### 5.1 Regroupement des documents (nouvelle fonction, remplace l'usage checkout de `buildCheckoutGroups`)

Contrairement à l'actuel `buildCheckoutGroups()` (qui bundle tous les chips d'un même type dans un seul groupe), le nouveau checkout de transmission a besoin de :
- **Un document « Ordonnance »** = bundle de **tous** les chips `prescription` (comme aujourd'hui pour le groupe `pharmacie`).
- **Un document par chip** pour chaque chip `lab` / `imaging` / `referral` / `instructions` (pas de bundling).

Proposition : nouvelle fonction `buildTransmissionDocs(docStats)` dans `NoteEditor.jsx` (ou extraite dans `editor-schema.jsx` si on veut la garder testable) qui retourne :

```js
[
  {
    id: 'rx',                     // fixe pour l'ordonnance, sinon cid du chip
    kind: 'prescription',         // 'prescription' | 'lab' | 'imaging' | 'referral' | 'instructions'
    title: 'Ordonnance',
    items: [ /* items Rx, cf. mk() existant */ ],
    recipients: [],                // [{ id, name, phone, fax, favorite }]
    complete: false,
    transmitted: false,
    comment: '',
  },
  // ... un objet par chip non-Rx
]
```

État (`recipients`, `complete`, `transmitted`, `comment`) géré en `useState` dans `TransmissionModal`, indexé par `id` — remis à zéro à chaque ouverture à partir de `docStats.chips` courant (pas de persistance au-delà de la session du modal, comme l'actuel `CheckoutModal`).

Cette fonction est également utilisée par `FinalizeNoteModal` (§3.2) uniquement pour compter les documents non transmis (pas pour les afficher en détail).

### 5.2 Suggestions de destinataires
Réutiliser le principe de `CM_GROUPS[key].recipients` de l'actuel `CheckoutModal.jsx` comme données fictives de répertoire (favoris avec ♥, téléphone/fax), mais adaptées au type de document (pharmacie pour l'ordonnance, labo/imagerie/spécialiste selon `kind`).

### 5.3 Contenu du panneau « détails » selon le type
- `prescription` → liste des lignes Rx (déjà géré par `mk()` dans `buildCheckoutGroups`).
- `lab` / `imaging` / `referral` / `instructions` → un seul item, afficher ses `details` (`d.tests`, `d.modality`/`d.region`, `d.specialty`/`d.question`, `d.title`) dans un résumé compact plutôt qu'une liste.

### 5.4 Gabarit d'aperçu (PDF simulé)
Un composant `PrescriptionPreview` (ou générique `DocumentPreview`) en HTML/CSS qui imite le rendu papier vu dans le Figma : en-tête clinique (nom, adresse, tél/fax), identité patient, corps (Rx ou détails de la requête), bloc signature (« Ordonnance complétée électroniquement par {médecin} le {date} », référence, signature), mention de confidentialité. Réutilisé tel quel dans :
- la colonne Aperçu du checkout,
- le faux dialogue d'impression,
- le panneau de droite de l'écran fax.

### 5.5 Options de « faire suivre » / signature (pour `FinalizeNoteModal`)
Reprendre telles quelles les constantes existantes de `CheckoutModal.jsx` : `CM_FORWARD_OPTS`, `CM_OTHER_DOCTORS`, `CM_OTHER_INSTITUTIONS`.

## 6. Composants à créer / modifier

| Fichier | Action |
|---|---|
| `project/note-ui/CheckoutModal.jsx` | **Supprimer**, remplacé par `TransmissionModal.jsx` (§6) et `FinalizeNoteModal.jsx` (§3) — l'ancien dialogue centré 640px ne correspond plus au design ni à la séparation des deux responsabilités. |
| `project/note-ui/FinalizeNoteModal.jsx` *(nouveau)* | Petit modal de finalisation de note : tuile note, faire suivre, signature, avertissement documents non transmis, confirmation → `finalizeComplete()`. Recycle le contenu de l'actuel `renderMetaSection`/`CM_FORWARD_OPTS`/etc. (§3, §5.5). |
| `project/note-ui/TransmissionModal.jsx` *(nouveau)* | Composant plein écran principal du checkout : en-tête + compteurs globaux, layout 2 colonnes (sidebar + panneau document), footer global. Orchestre `phase` (review / sending / print / fax). |
| `project/note-ui/transmission/DocumentSidebar.jsx` *(nouveau)* | Liste des documents groupés (Ordonnance / Outils cliniques), icônes de statut, sélection. |
| `project/note-ui/transmission/DocumentPanel.jsx` *(nouveau)* | Les 3 colonnes (contenu / destinataire / aperçu) + barre d'état + bouton split « Compléter… ». |
| `project/note-ui/transmission/RecipientPicker.jsx` *(nouveau)* | Liste de destinataires + suggestions, ajout/suppression. |
| `project/note-ui/transmission/DocumentPreview.jsx` *(nouveau)* | Gabarit PDF simulé partagé (§5.4). |
| `project/note-ui/transmission/PrintDialog.jsx` *(nouveau)* | Faux dialogue d'impression par-dessus l'aperçu. |
| `project/note-ui/transmission/FaxScreen.jsx` *(nouveau)* | Écran « Faxer un document » (répertoire filtrable + envoyer à + aperçu). |
| `project/note-ui/NoteEditor.jsx` | Ajouter `buildTransmissionDocs()`, deux states `transmissionOpen`/`finalizeOpen` (remplacent `checkoutOpen`/`checkoutGroups`/`checkoutMode`), voir §7. |
| `project/Note Clinique.html` | Ajouter le bouton icône **➤** dans le footer (à côté de Compléter) qui ouvre `TransmissionModal` ; le bouton **Compléter** ouvre désormais `FinalizeNoteModal`. |

*(Nommage indicatif — Sonnet peut aplatir en un seul fichier `TransmissionModal.jsx` si la décomposition en sous-dossier complique l'intégration avec le bundler actuel du prototype ; vérifier comment `index.html`/le build charge les fichiers `.jsx` avant de créer un sous-dossier.)*

## 7. Découplage note / checkout / finalisation (impact sur `NoteEditor.jsx`)

Actuellement (`NoteEditor.jsx` lignes 470-507) :
- `openCheckout(onlyCid)` est appelé par `completeRef` (bouton Compléter) ET par l'event `note:open-checkout` (menu des chips).
- La confirmation du modal déclenche `finalizeComplete()` seulement si `checkoutMode === 'complete'`.

Nouveau comportement proposé :
- Le bouton **Compléter** (via `completeRef`) appelle `openFinalize()`, qui ouvre `FinalizeNoteModal` (§3). Sa confirmation appelle `finalizeComplete()`.
- La nouvelle icône **➤** appelle `openTransmission()` qui construit `buildTransmissionDocs()` et ouvre `TransmissionModal` (§2), indépendamment de la finalisation de note.
- L'event `note:open-checkout` (déclenché par « Prescrire »/« Transmettre » sur une chip) ouvre aussi `TransmissionModal`, avec la sidebar pré-filtrée/sélectionnée sur ce document précis (équivalent de l'actuel `onlyCid`).
- `checkoutMode` disparaît : il n'a plus de raison d'être puisque la transmission n'a plus jamais pour effet de finaliser la note (c'est désormais exclusivement le rôle de `FinalizeNoteModal`).

## 8. Découpage en tâches (ordre d'implémentation suggéré)

1. **`FinalizeNoteModal`** : extraire `renderMetaSection`/`CM_FORWARD_OPTS`/`CM_OTHER_DOCTORS`/`CM_OTHER_INSTITUTIONS` de l'actuel `CheckoutModal.jsx` dans ce nouveau composant autonome, brancher sur `completeRef`/`finalizeComplete()`. C'est le lot le plus petit et le plus proche de l'existant — bon point de départ, et il peut être livré indépendamment du reste.
2. **Modèle** : implémenter `buildTransmissionDocs()` + réducteurs d'état (`recipients`, `complete`, `transmitted`, `comment` par document) — sans UI, testable en isolation.
3. **Layout statique** : `TransmissionModal` plein écran + `DocumentSidebar` + `DocumentPanel` (3 colonnes) avec données factices en dur, pour caler le layout sur les captures Figma avant de brancher les vraies données.
4. **Brancher les vraies données** : remplacer les données en dur par `buildTransmissionDocs(docStats)`, gérer la sélection de document dans la sidebar.
5. **Destinataires** : `RecipientPicker` (liste + suggestions + ajout/suppression), mise à jour du badge `DESTINATAIRE (N)` et de la bannière d'avertissement.
6. **Aperçu** : `DocumentPreview` générique (Rx + requêtes), branché dans la colonne Aperçu.
7. **Machine à états + bouton split** : `Compléter` / `Compléter et imprimer` / `Compléter et faxer` / `Compléter et faxer à`, désactivation + tooltip tant que `recipients.length === 0` (pour l'action imprimer/faxer) ou selon les règles de §2.6.
8. **Écrans simulés** : `PrintDialog` et `FaxScreen`, branchés sur `DocumentPreview`. Propagation du destinataire choisi dans `FaxScreen` vers le document du checkout (règle sticky §2.6).
9. **Navigation post-envoi** : après un envoi (impression ou fax), revenir à `TransmissionModal` s'il reste des documents non transmis, sinon fermer tout le flux.
10. **Footer global** : « Transmettre le document prêt » (agit sur le document sélectionné s'il est `complete && !transmitted`) et « Tout transmettre (N) » (boucle sur tous les documents `complete && !transmitted`).
11. **Avertissement croisé dans `FinalizeNoteModal`** : brancher le bandeau « documents non transmis » (§3.2) sur `buildTransmissionDocs()` une fois celle-ci disponible (dépend des tâches 2 et 9).
12. **Intégration finale** : bouton ➤ dans `Note Clinique.html`, suppression de `CheckoutModal.jsx` et de ses références, nettoyage de `checkoutMode`/`onlyCid` dans `NoteEditor.jsx`.
13. **Contenu de démo** : enrichir un `startPoints` (ou créer un nouveau point de départ) avec plusieurs prescriptions + une imagerie + un labo, pour que les séances de test ressemblent à la richesse du Figma (cf. §4.5).

## 9. Références Figma par écran (pour extraction de détails visuels précis)

Fichier : `F3Nia0ctWn4PD7DuW9ZMMI`. Utiliser `get_design_context` sur ces node IDs pour les couleurs/espacements exacts au moment de coder chaque écran :

- Note (état de départ, footer avec ➤) : `17327:183984`
- Transmission des documents (état initial) : `17327:183804`
- Menu split « Compléter » ouvert / tooltip désactivé : `17327:183660`
- Transmission des documents (après complétion d'un document) : `17327:188208`
- Compléter et imprimer (dialogue d'impression) : `17330:225770`
- Compléter et faxer (écran Faxer un document) : `17330:315996`

*(`FinalizeNoteModal` n'a pas de référence Figma dédiée — il reprend le comportement déjà existant de l'actuel `CheckoutModal.jsx`, section `renderMetaSection`, comme base visuelle.)*

## 10. Points d'attention

- Le nouveau flux de transmission est nettement plus gros que l'ancien modal (plusieurs écrans, état par document plutôt que par groupe) — prévoir de le livrer en plusieurs commits suivant le découpage en tâches (§8), pas en un seul gros diff.
- `FinalizeNoteModal` peut être livré et testé indépendamment du reste (tâche 1) : c'est presque une extraction pure de code existant, à faible risque, qui débloque déjà le découplage Compléter/transmission pendant que le reste du checkout est en cours de construction.
- Vérifier que le bandeau d'avertissement de `FinalizeNoteModal` (§3.2, tâche 11) reste bien non bloquant : la complétion de note ne doit jamais être empêchée par des documents non transmis, seulement signalée.
