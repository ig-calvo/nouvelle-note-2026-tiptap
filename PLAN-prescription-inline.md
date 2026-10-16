# Plan — Prescription inline : aligner le prototype sur le Figma, puis étendre aux autres éléments inline

**Date :** 2026-10-15
**Statut (2026-10-16) :** destination de l'icône faite pour la prescription (RA-18) ; extension aux autres fonctions : `PLAN-fonctions-inline.md`. Lots 0 à 7 livrés et fusionnés dans `main` (PR #28 à #35), lot 8 (Mentionner / Documenter en boutons de ligne, sans bascule ni tweak) en cours sur `feat/menu-rx-documenter-mentionner-boutons`, branches empilées jusqu'au lot 7 (`feat/prescription-lot0-recherche` → `…lot1-valeurs-manquantes` → `…lot2-statuts` → `…lot3-profil-recherche` → `…lot5-modale` → `…lot4-documenter-mentionner` → `…lot6-sommaire`), rien de poussé. Lot 3 sans le rail de catégories, les flèches ↑ ↓ ni la section Favoris repliable : le rail et les flèches sont faits au lot 7 (RA-17), la section Favoris repliable reste à faire. Lot 5 sans les sélecteurs Produit / Forme, le sélecteur de date ni le basculement de mode de dose (RA-16). Lot 4 derrière un tweak, à la souris seulement (ID-12, Q-25). Lot 6 : le « + » de Médications prescrit par défaut (le Figma allume « Prescrire une médication »), pas Documenter comme écrit au §3. Reste : §4.2 (autres types).

**Source Figma :** [Prescription - DEV, page « Prescription inline »](https://www.figma.com/design/yKlDaui3uatLoHfsfhdJbG/Prescription---DEV?node-id=7802-1787) (la page entière, 36 enfants ; lue par captures et extraction des textes, pas par `get_metadata`, trop gros). Nœuds clés :

| Nœud | Contenu |
|---|---|
| `8053:28011` Specs V0 · `8017:15709` Notes | Besoins utilisateurs, V0 et hors V0 (2026-10-05 / 06) |
| `8053:27866` Recherche | Règles de la recherche (EX-023, création en cours, recherche abandonnée) |
| `8094:43845` Recherche de prescriptions · `8137:23222` Section 1 | Popover de recherche : variantes, rail de catégories, Documenter / Mentionner |
| `8014:14882` Prescription incomplète | États de la tuile (espaces réservés, badge « Incomplet », bandeau d'erreur) |
| `8080:29531` Documentation au profil vs prescrire | La famille « documentaire » (médication, allergie, problème, signes vitaux, résultats) à côté des actionnables |
| `8137:24378` Modale médicament | Nouveau formulaire complet |
| Sections `7967:27109`, `7925:22157/22158/22159`, `7984:37117`, `8032:24039`, `8094:40754`, `8041:26236` | Scénarios : prescrire, renouveler, cesser, modifier, supprimer, retirer au clavier, depuis le sommaire, champs non renseignés |

**Source prototype :** `project/` sur `main` (lots 0 à 9 du plan inline entity livrés), `project/Note Clinique.notes.md`, [PLAN-inline-entity.md](PLAN-inline-entity.md).

**Ce qui a été vérifié et ce qui ne l'a pas été**
- *Sourced* : le code lu (`editor-schema.jsx` `buildChipDomBase` / `chipIssues`, `editor-popover.jsx` `RxMenu` / `ChipPopover`, `editor-data.jsx` `PATIENT_MEDS` / `searchRx`), le menu `/rx amox` ouvert au navigateur (Favoris, Autres produits, pied de raccourcis), les captures Figma.
- *Non vérifié* : Échap pendant une recherche, `mg/kg` sans déclencher le menu, ordre des favoris après un clic sur le cœur, comportement de la puce au survol dans le navigateur de test. Ce sont des tests du lot 0.
- *Inferred* : le sens de certains éléments du Figma sans annotation (« En suspens », le toggle ↑↓ de la modale). Listés au §6.

---

## 1. Constat : écarts entre le Figma et le prototype

| # | Sujet | Figma | Prototype aujourd'hui | Écart |
|---|---|---|---|---|
| 1 | **Valeurs manquantes** | Chaque champ requis vide devient un espace réservé souligné en rouge dans la tuile (« Dose Voie Fréquence Durée Renouvellement »), le premier est mis en évidence, bandeau « La prescription a des champs non renseignés requis pour sa sauvegarde » | Les valeurs vides **disparaissent** de la tuile ; les segments ne se dessinent que si `details.frequency` existe (`editor-schema.jsx:274`) ; bordure rouge + icône en fin de puce, message en infobulle | Grand |
| 2 | **Badge de statut avant la valeur principale** | « Incomplet », « Cesser » (rouge), icône ⟳ pour renouveler, « En suspens » | « Annulée » seulement (`chip-status--cancelled`) ; cessée = fond rouge + nom barré ; renouvelée = rien de visible sur la tuile (seulement dans le texte imprimé) | Moyen |
| 3 | **Médications au dossier dans la recherche** | 4 médications avec étiquettes **Actif / Échu / Cessé**, toutes visibles et toutes prescriptibles (EX-023 : « tous les statuts sont admis ») ; « Prescrire » au survol d'une ligne échue ou cessée | 2 médications (`PATIENT_MEDS`), statuts `active` / `cessée` seulement ; les cessées sont dans un bloc replié, **non cliquables** (`RxMenu`, `editor-popover.jsx:900`) ; pas d'« Échu » | Grand |
| 4 | **Actions au survol d'une ligne du profil** | Renouveler, Cesser (bouton rouge au survol) ; ↑ ↓ pour ajuster la dose (hors V0) | Renouveler, Ajuster (icône réglages, une seule action), Cesser — actifs seulement | Moyen |
| 5 | **Structure du popover de recherche** | Rail de catégories (Tout 27, Renouvelables, Actives, Cessées, Favoris, Gabarits, + Suggestions en vision), onglets « Médications au profil / Favoris / Fréquemment prescrits » | Une liste à sections (Médications au dossier, Favoris, Traitements fréquents, Autres produits) | Moyen |
| 6 | **Documenter / Mentionner** | Deux bascules : *Documenter* = ajouter au profil sans prescrire ; *Mentionner* = tuile qui parle de quelque chose déjà au profil. Tuile documentaire : icône neutre, point rouge, « Cessé 9/10/2026 » | Absents | Grand (nouveau) |
| 7 | **Modale complète** | Rx + nom, icônes RAMQ / alerte, Produit\*, Forme et teneur\*, Dose\*, Voie\*, Site, Fréquence\*, PRN, Durée, Quantité, Renouvel.\*, Fin du traitement (date), accordéon « Précisions » (intention, note, code d'exception, NPS) | `ChipPopover` : bandeau d'alertes + constantes, Dose visée\* + Dose + Forme, Unités séparées, Mois, Commentaire au pharmacien | Moyen |
| 8 | **Cycle de recherche** | Création en cours : Échap et clic dehors ignorés ; recherche abandonnée : l'entité disparaît, le curseur revient ; jamais d'entité en mode recherche dans une note sauvegardée | À vérifier. Un sticky du Figma dit que le prototype garde le texte de recherche après Échap | À tester |
| 9 | **Famille documentaire** | Signes vitaux (TA 148/92 ↑, flèche et badge H/B hors plage), poids + IMC, allergie, problème (HTA 2012), résultat de labo (PSA 5,9 H), médication au profil | Types inline : prescription, labo, imagerie, référence, consignes, problème, fichier, diagnostic. Rien pour signes vitaux, allergie, résultat | Grand (nouveau) |
| 10 | **Sommaire → Prescripteur** | « + » de Médications ouvre le Prescripteur (Ordonnance en cours, Favoris, bascule « Prescrire une médication ») | Boîtes du Sommaire réduites au titre ; tweak `summaryAddToNote` ne couvre que Problèmes / Antécédents (Q-23) | Moyen |

**Où le prototype est déjà en avance sur le Figma** (rien à défaire, à documenter dans le Figma) : retirer ≠ annuler, Journal, Backspace, gabarits en suggestions, multi-sélection des requêtes, ouverture responsive du formulaire. Ces points sont classés « hors V0 » dans le Figma (`Specs V0`) ; ils restent la vision.

---

## 2. Principes

1. **Une seule anatomie de tuile** pour tous les éléments inline : `[icône de type] [badge de statut] [valeur principale] [valeurs secondaires] [indicateurs : erreur, note, envoi]`. Deux familles :
   - **actionnable** (prescription, labo, imagerie, référence, consignes) : statut, envoi, double coche ;
   - **documentaire / mention** (médication au profil, allergie, problème, signes vitaux, résultat) : icône neutre, aucune action d'envoi, date, indicateur hors plage.
2. **Une valeur manquante se voit à sa place**, pas dans une icône à la fin : espace réservé souligné, même mécanisme pour tous les types qui ont des champs requis.
3. **Une recherche = un cycle de vie** : mêmes règles d'ouverture, d'abandon et de choix pour `/rx`, `/lab`, `/img`, `/ref`, `/req`, `/dx`.
4. **V0 d'abord, vision derrière un tweak** (même modèle que `inlineFieldEdit`, `Note Clinique.html`). Ce que les Specs V0 donnent comme **hors V0** est livré par défaut dans le prototype seulement s'il l'était déjà ; le reste va derrière un tweak.
5. **Un lot = une branche = une PR**, notes mises à jour (RA / Q / journal), logique pure testée par `node --test project/tests/*.test.mjs`, comportement vérifié au navigateur (serveur `prototypes`).

---

## 3. Lots (prescription d'abord)

### Lot 0 — Vérifier les écarts « à tester » (S)
Au navigateur, touches réelles, sur `main` :
1. `/rx amox` puis Échap : la ligne redevient-elle « Plan : » avec le curseur à la fin ? (spec `Recherche abandonnée`, sticky « à vérifier avec Ig »).
2. `/rx amox` puis clic ailleurs dans la note : l'entité de recherche est retirée, le curseur va au clic.
3. Création en cours (choix fait, brouillon en création) : Échap et clic dehors sont ignorés.
4. `mg/kg` : aucun menu.
5. Cœur d'un favori : la liste ne se réordonne pas pendant l'usage.
6. Recherche sans accents (« amoxicilline » / « amoxicillíne ») ; favoris en tête, sans doublons.
7. Une note sauvegardée ne contient jamais l'entité en mode recherche.
Sortie : la liste des écarts réels ; chaque écart devient un correctif dans ce lot. **Fichiers** : `editor-field.jsx` (déclencheur `/`), `editor-popover.jsx` (`RxMenu`).

### Lot 1 — Valeurs manquantes dans la tuile (P1, M)
**Changement** : `buildChipDomBase` émet toujours les segments (dose, forme, voie, fréquence, durée, renouvellement), avec un espace réservé quand la valeur est vide et requise.
1. `chipIssues` renvoie aussi `missing: [{field, label}]` (la source unique, déjà utilisée pour le message).
2. Rendu : libellé du champ en rouge souligné, `data-field` conservé (le clic ouvre le champ ou le formulaire selon `inlineFieldEdit`), pas de segment vide caché.
3. Badge « Incomplet » avant la valeur principale (rouge, comme le Figma) ; l'icône de fin de puce reste pour les cas d'avertissement et d'interaction.
4. Bandeau « La prescription a des champs non renseignés requis pour sa sauvegarde » : dans le formulaire (déjà là, texte aligné) ; au-dessus de la puce sélectionnée seulement derrière un tweak (il décale la ligne).
5. **Décision à prendre (Q-24)** : le renouvellement vide est « manquant » dans le Figma (champ requis dans la modale, espace réservé « Renouvellement ») ; c'est R0 dans le prototype (Q-12). Voir §6.
**Tests** : `chipIssues` avec `missing` ; `buildChipDom` en jsdom léger si le harness le permet, sinon pur (liste des segments dérivée par une fonction pure `chipSegments(details)`).
**Fichiers** : `editor-schema.jsx`, `editor.css`, `editor-popover.jsx` (libellé du bandeau).

### Lot 2 — Statuts sur la tuile : Cesser, Renouveler, Incomplet, En suspens (P1, S–M)
1. Badge de statut générique (`chip-status--*`) : `cesser` (rouge), `renouveler` (icône ⟳ tonale), `incomplet`, `annulée` (existant), `en suspens` (à confirmer, Q-26).
2. Cessée : garder le fond actuel ou passer au badge seul du Figma, sans le nom barré (le Figma ne le barre pas) — trancher en revue.
3. Une renouvelée porte le badge ⟳ sur la tuile (aujourd'hui rien).
4. `chipPrintText` : inchangé (le texte imprimé nomme déjà le statut).
**Fichiers** : `editor-schema.jsx`, `editor.css`. **Tests** : `chip-print-text.test.mjs` étendu si le statut change.

### Lot 3 — Popover de recherche : le profil complet (P1, M–L)
1. **Données** : `PATIENT_MEDS` passe à 4 médications d'exemple (actif ×2, échu, cessé) avec statut `active | echue | cessee`, date de cessation (« Cessé 9/10/2026 »). Contenu fictif, marqué « à valider ».
2. **Statuts** : étiquettes Actif / Échu / Cessé sur chaque ligne ; plus de bloc replié : toutes visibles.
3. **Toutes prescriptibles** (EX-023) : un clic ou Entrée sur une ligne cessée ou échue insère la tuile sans créer de brouillon ; « Prescrire » au survol de ces lignes.
4. **Actions au survol** : Actif = Renouveler, Cesser ; Échu = Renouveler ; Cessé = Prescrire. Cesser en rouge au survol. L'action « Ajuster » (tune) devient ↑ ↓ derrière un tweak (hors V0, Q-27).
5. **Rail de catégories** (Tout, Renouvelables, Actives, Cessées, Favoris, Gabarits ; « Suggestions » seulement avec le tweak IA) derrière un tweak « Recherche : rail de catégories » (désactivé = liste actuelle). Navigation clavier entre les sections (↑ ↓ passe d'une section à l'autre, comme la spec).
6. Section « Favoris (n) » repliable ; le cœur n'en réordonne pas la liste.
**Fichiers** : `editor-data.jsx` (`PATIENT_MEDS`, `searchRx`), `editor-popover.jsx` (`RxMenu`), `editor.css`, `Note Clinique.html` (tweak). **Tests** : `searchRx` (statuts, filtres du rail).

### Lot 4 — Documenter / Mentionner (P2, M)
1. Deux bascules en tête du popover : **Documenter** (ajoute au profil sans prescrire : tuile documentaire, pas d'envoi, pas au checkout) ; **Mentionner** (tuile qui désigne une médication déjà au profil : icône neutre, point d'état, « Cessé <date> »).
2. Tuile documentaire : famille 2 du principe 1 (icône `medication` neutre, aucun badge d'envoi, comptée ni au pied de note ni au checkout).
3. Le Journal note « Documentée au profil », pas « Transmise ».
4. Derrière un tweak « Documenter / Mentionner » (vision ; le Figma ne le met pas dans la V0). Sémantique du Figma : sticky sur `8137:23222` (Sourced) ; le comportement détaillé est inféré, Q-25.
**Fichiers** : `editor-data.jsx` (type d'entité `medication-mention`), `editor-schema.jsx` (`buildChipDomBase` branche documentaire, `buildActionLog`, `buildTransmissionDocs` l'ignore), `editor-popover.jsx`, `editor.css`.

### Lot 5 — Modale complète alignée sur le Figma (P1, M)
`ChipPopover` (ordonnance) devient la modale `8137:24378` :
1. En-tête : icône Rx, nom, pastilles RAMQ et alerte (remplace le bandeau « Aucune alerte » + constantes, qui passent en pied de modale ou en infobulle).
2. Champs : Produit\* et Forme et teneur\* en sélecteurs, Dose\*, Voie\*, Site, Fréquence\*, PRN, Durée, Quantité, Renouvel.\*, Fin du traitement (sélecteur de date DS3, `DsDateField`).
3. Accordéon « Précisions » (intention, note, code d'exception, NPS) ; **le commentaire au pharmacien (RA-07) devient le champ « note »** de cet accordéon, sinon Q-28.
4. Pied : Annuler / Enregistrer (déjà).
5. Garde : la hauteur plafonnée, le corps qui défile et les modes d'ouverture (RA-03, RA-09) ne changent pas.
6. **V0** : le Figma dit « en V0 cela ouvrira le module Prescripteur ». Le formulaire dans la note reste la vision (D-04) ; le tweak existant n'a pas à bouger, mais il faudra noter dans le Figma que ce formulaire est hors V0.
**Fichiers** : `editor-popover.jsx`, `editor-data.jsx` (`FIELD_OPTIONS`, champs `intention`, `exceptionCode`, `nps`). **Tests** : `field-options.test.mjs` étendu.

### Lot 6 — Depuis le Sommaire (P2, S–M)
Étendre le tweak `summaryAddToNote` à **Médications** : le « + » ouvre `/rx` sous la ligne du curseur (comme ID-11 pour `/dx`), avec « Documenter » activé. Le Figma (`8094:41757`) montre plutôt le Prescripteur ; l'autre variante (side sheet) reste « à venir » dans le prototype. Répond à Q-23 pour la boîte Médications seulement.
**Fichiers** : `Summary.jsx`, `NoteEditor.jsx`, `editor-field.jsx`.

---

## 4. Étendre aux autres éléments inline

Le travail tient en deux étapes : **fondations partagées** (lots 1, 2, 3 faits pour la prescription, écrits de façon générique), puis **application par type**.

### 4.1 Fondations (dans les lots 1 à 3, à écrire génériques)
| Brique | Générique dès le départ |
|---|---|
| `chipIssues(attrs)` → `missing[]` | Table par type de ses champs requis (`REQUIRED_FIELDS[type]`) |
| Segments de la tuile | `chipSegments(attrs)` par type, avec espaces réservés |
| Badge de statut | Un seul composant de rendu, statuts par type |
| Recherche | `RxMenu` est déjà partagé par `/lab`, `/img`, `/ref`, `/req` ; le rail et les statuts doivent l'être aussi |
| Cycle de vie de la recherche | Le correctif du lot 0 s'applique à tous les déclencheurs `/…` |

### 4.2 Application par type
| Type | Aujourd'hui | Cible (Figma) | Travail |
|---|---|---|---|
| **Labo** | Nom + priorité ; aucun champ requis | « Bilan lipidique, Créatinine, Albumine, TSH, ALT valeur secondaire ✓✓ » ; profil cessable seulement si l'équivalent existe | Segments génériques ; valeurs secondaires en espace réservé quand une règle de requis existe (aucune aujourd'hui, Q-29) |
| **Imagerie** | Latéralité facultative | « Radiographie du genou **Latéralisation** » en espace réservé rouge quand l'examen est latéralisé | Règle « examen latéralisé → latéralité requise » (liste d'examens du catalogue), Q-30 |
| **Référence** | Avertissement « Question clinique à préciser » (icône) | Même mécanisme que la prescription | Passer de l'icône à l'espace réservé « Question clinique » |
| **Consignes** | Pas de champ requis | Idem labo | Aucun |
| **Médication au profil** (mention) | — | Famille documentaire | Lot 4 |
| **Allergie** | Pas d'entité inline | « Iode-123 Allergie 2012 », icône feuille | Nouvelle entité documentaire (P3) |
| **Problème** | Existe (`problem`, région diagnostic) | « HTA 2012 », icône réseau | Aligner l'anatomie sur la famille documentaire (P3) |
| **Signes vitaux** | Pas d'entité inline | « TA 148/92 ↑ FC 72 … 9/10/2026 », badges H / B, version courte « Poids 82,4 kg IMC 26,9 » | Nouvelle entité documentaire ; règle de plage (valeurs fictives) (P3) |
| **Résultat de labo** | Pas d'entité inline | « PSA 5,9 H » | Nouvelle entité documentaire (P3) |

Les entités documentaires (allergie, signes vitaux, résultat) réutilisent le « + » du Sommaire (lot 6, Q-23) et le tweak existant ; elles sont P3 et passent derrière un tweak commun « Éléments documentaires inline ».

---

## 5. Ordre de travail

| Ordre | Lot | Pourquoi | Taille |
|---|---|---|---|
| 1 | 0 — Vérifications | Évite de reconstruire ce qui marche déjà ; fixe le cycle de recherche | S |
| 2 | 1 — Valeurs manquantes | Le plus visible dans le Figma, base des types suivants | M |
| 3 | 2 — Statuts | Même fichier, même CSS ; fait la tuile complète | S–M |
| 4 | 3 — Recherche : profil complet | Spec V0 (EX-023) ; débloque Renouveler / Cesser sur échu et cessé | M–L |
| 5 | 5 — Modale | Indépendante du reste, utilise `FIELD_OPTIONS` | M |
| 6 | 4 — Documenter / Mentionner | Dépend de la décision Q-25 | M |
| 7 | 6 — Sommaire | Dépend du lot 4 | S–M |
| 8 | §4.2 — Autres types | Après les fondations ; documentaires en P3 | M chacun |

---

## 6. Questions — hypothèses retenues en attendant

| # | Question | Hypothèse |
|---|---|---|
| Q-24 | ~~Le renouvellement vide rend-il la prescription incomplète ?~~ **Réglé le 2026-10-15 (Ignacio Calvo) : non, vide reste R0 par défaut** ; le lot 1 n'affiche donc pas d'espace réservé « Renouvellement ». | **Oui dans le Figma** (« Renouvel.\* » requis, espace réservé rouge) ; **non** dans le prototype aujourd'hui, sinon 50 des 52 items du catalogue seraient incomplets. À trancher avant le lot 1 : soit on garde R0 par défaut, soit on corrige le catalogue |
| Q-25 | Que fait exactement « Mentionner » ? | Une tuile qui désigne une médication déjà au profil, sans rien créer ni envoyer. *Inferred* du sticky « Mentionner : ajouter une chip qui parle de quelque chose déjà au profil » |
| Q-26 | « En suspens » (badge du Figma) : est-ce la suggestion en attente de ✓ / ✕ ? | Probable, non confirmé. En attendant, le style en attente actuel (tirets + ✓ ✕) reste |
| Q-27 | ↑ ↓ (ajuster la dose) remplace-t-il « Ajuster » ? | Seulement derrière un tweak : le Figma classe « Ajuster la dose » hors V0 |
| Q-28 | Que devient le « Commentaire au pharmacien » (RA-07) quand la modale a « Précisions » ? | Il devient le champ « note » de l'accordéon |
| Q-29 | Labo, consignes : quels champs sont requis ? | Aucun ; seule la prescription (et l'imagerie latéralisée) en a |
| Q-30 | Quels examens d'imagerie exigent la latéralité ? | Ceux du catalogue qui ont un côté (genou, épaule…) ; contenu fictif, à valider |
| Q-31 | La modale dans la note : V0 ou vision ? | Vision ; la V0 ouvre le Prescripteur (Specs V0). Le prototype garde les deux, comme aujourd'hui |

---

## 7. Hors périmètre

- Le Prescripteur lui-même (side sheet « Médications », Ordonnance en cours) : le prototype n'en a pas ; le « + » du Sommaire peut seulement ouvrir `/rx`.
- Alertes thérapeutiques réelles, RAMQ, DSQ : valeurs fictives dans le prototype.
- Copier-coller, glisser-déposer de la tuile (spec « Built-in tiptap ») : comportement du moteur d'édition, à vérifier mais pas à construire.
- Checkout / transmission : couverts par PLAN-checkout-v7.md.
- Mettre à jour le Figma de scénarios (PLAN-figma-scenarios.md) : après les lots 1 à 3, les cadres du flux 5 et 6 seront à refaire.
