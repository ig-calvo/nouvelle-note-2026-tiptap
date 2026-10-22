# Plan — prototype bilingue français / anglais

*Rédigé le 2026-10-22 à la demande d'Ignacio Calvo, mis à jour le même jour : décisions de cadrage, puis découpage en deux pistes. Évaluation seulement : rien n'est implémenté.*

## 1. Objectif et décisions

Le prototype (`project/Note Clinique.html`) fonctionne en français ou en anglais, au choix de l'utilisateur, avec le même parcours dans les deux langues. Le français reste la langue par défaut et ne doit pas régresser.

| Sujet | Décision (Ignacio Calvo, 2026-10-22) |
|---|---|
| Anglais | Canadien (`en-CA`) |
| Changement de langue | Par rechargement de la page : `?lang=en` ou `?lang=fr`, mémorisé dans le navigateur |
| Traductions | **Toutes faites par IA**, y compris SNOMED CT (vers le français) et CIM-10 (vers l'anglais) |
| Validation | Aucune : c'est un prototype. Il doit passer une première vue ; l'exactitude clinique n'est pas exigée à 100 % |
| Texte saisi par le médecin | Jamais traduit |
| Données de démonstration | Existent dans les deux langues (patient, médicaments, analyses, gabarits) |

## 2. Le découpage : deux pistes

Le travail se sépare en deux pistes qui avancent en parallèle et ne se marchent pas dessus.

| | **Piste A — Rendre bilingue** | **Piste B — Traduire** |
|---|---|---|
| Question à laquelle elle répond | « Le prototype *sait-il* changer de langue ? » | « Qu'est-ce qui s'affiche *dans* l'autre langue ? » |
| Nature | Code : infrastructure, remplacement des textes écrits en dur par des appels `t()` / `L()`, dates, pluriels, logique, tests | Contenu : glossaire, dictionnaire anglais, données de démonstration en anglais, CIM-10 anglais, SNOMED français |
| Produit | Le français, extrait dans des fichiers de langue ; un prototype qui fonctionne dans une seule langue **et** qui est prêt pour une seconde | Les fichiers de langue anglais, générés par script avec l'IA |
| Dépend de l'autre ? | Non : tant que l'anglais manque, chaque texte retombe sur le français | Oui, du **contrat** ci-dessous, rien d'autre |

### Le contrat entre les deux pistes

La piste A écrit le français et le catalogue ; la piste B lit le catalogue et écrit l'anglais. Quatre formats, fixés par A0 :

1. **Interface** : `note-ui/i18n/fr.js` (A) et `note-ui/i18n/en.js` (B) — mêmes clés, `{valeurs}` nommées, pluriels en `{ one, other }`.
2. **Données de démonstration** : A entoure chaque texte avec `L('texte français')` ; B écrit `note-ui/i18n/data-en.js`, une table « texte français → anglais ». Une entrée manquante affiche le français.
3. **Catalogue** : `note-ui/i18n/catalog.json`, produit par `tools/i18n-extract.mjs` (A0) : chaque clé ou texte avec son français, son fichier d'origine et un contexte (bouton, titre, aide…). C'est l'entrée du travail de B. Ré-exécuter l'extraction ne retraduit que ce qui a changé (empreinte du français dans `note-ui/i18n/en.lock.json`).
4. **Diagnostics** : B produit `cim10-en-clinique.json` (même structure que `cim10-fr-clinique.json`) et `snomed-diagnostics-fr.json` (même structure + une colonne `terme préféré (fr)`, le terme anglais d'origine reste en place). A5 charge le fichier selon la langue.

**Forme exacte des fichiers** (fixée par A0, lue par `tests/i18n.test.mjs`) :

- `en.js` : `(window.I18N_DICT = window.I18N_DICT || {}).en = { 'clé.plate': 'Texte', 'autre.clé': { one: '{n} item', other: '{n} items' } };` — mêmes clés, mêmes `{valeurs}`, même forme (texte ou pluriel) que `fr.js`.
- `data-en.js` : `(window.I18N_DATA = window.I18N_DATA || {}).en = { 'Texte français': 'English text' };` — la clé est le français tel qu'il apparaît dans `catalog.json` (`donnees[].fr`).
- `catalog.json` : `interface` (clé → `fr`, `empreinte`, `contexte`, `fichiers`) et `donnees` (liste triée : `fr`, `empreinte`, `contexte`, `extrait`, `fichiers`). Généré par `node project/tools/i18n-extract.mjs`, jamais à la main.
- `en.js` et `data-en.js` n'existent pas encore : B les crée. Le chargeur ne les demande que pour `?lang=en` ; leur absence est le repli sur le français.
- Le test de parité passe en mode strict (erreur au lieu d'avertissement) dès que `en.js` existe.

**Règle de repli** : un texte sans traduction affiche le français. Le prototype fonctionne donc à tout moment, avec ou sans la piste B, et chaque piste se fusionne seule.

### Propriété des fichiers

| Piste A modifie | Piste B modifie |
|---|---|
| Tous les `note-ui/*.jsx`, `Note Clinique.html`, `tests/`, `tools/i18n-extract.mjs`, `note-ui/i18n.js`, `note-ui/i18n/fr.js`, `catalog.json` | Seulement : `note-ui/i18n/en.js`, `note-ui/i18n/data-en.js`, `note-ui/i18n/glossaire.json`, `note-ui/i18n/en.lock.json`, `note-ui/cim10-en-clinique.json`, `note-ui/snomed-diagnostics-fr.json`, `tools/i18n-translate.*` |

B ne touche jamais un composant ; A ne touche jamais un fichier de traduction. Il n'y a donc aucun conflit de fusion entre les deux pistes.

## 3. Branches et ordre de fusion

La branche d'intégration reçoit tout, puis une seule PR la fusionne dans `main`.

```
main
 └─ feat/bilingue-fr-en                    (intégration : plan, puis les deux pistes)
      ├─ feat/bilingue-fr-en-code          (piste A : lots A0 à A8, une PR par lot)
      └─ feat/bilingue-fr-en-traductions   (piste B : lots B0 à B5, une PR par lot)
```

(Les noms évitent `feat/bilingue-fr-en/…` : Git refuse une branche dont le nom est aussi un dossier d'une autre.)

Ordre :

1. Le plan est commité sur `feat/bilingue-fr-en`, créée depuis `origin/main`.
2. **A0** (fondation, contrat, extraction) fusionne d'abord dans l'intégration. B2 à B5 démarrent ensuite sur le catalogue ; **B3 (CIM-10) et B4 (SNOMED) peuvent commencer dès le premier jour**, ils ne dépendent que du format des données.
3. Les lots A1 à A8 et B1 à B5 fusionnent dans l'intégration au fil de l'eau, dans n'importe quel ordre.
4. Quand les critères de fin (section 8) sont remplis : une PR `feat/bilingue-fr-en` → `main`, fusion par commit de fusion comme les PR précédentes.

## 4. État des lieux (mesuré le 2026-10-22)

Aucune couche de traduction : `<html lang="fr">` fixe, pas de dictionnaire, tout le texte est écrit en dur dans 35 fichiers `.jsx` (18 720 lignes) et dans `Note Clinique.html`.

| Mesure | Valeur | Remarque |
|---|---|---|
| Chaînes entre guillemets avec accent ou plusieurs mots | ≈ 1 800 | heuristique `grep`, hors commentaires |
| Textes écrits directement dans le JSX | ≈ 540 | boutons, titres, aides |
| Total visible estimé | 1 500 à 2 500 | les chaînes d'un seul mot sans accent (« Annuler ») échappent au comptage |
| `editor-data.jsx` | 469 chaînes | éléments `/`, médicaments, analyses, imagerie, références, gabarits, patient |
| Fichiers les plus lourds | `SummaryModals`, `ClinicalTool`, `NoteEditor`, `editor-schema`, `editor-popover`, `TransmissionModal` | 90 à 240 chaînes chacun |
| Comparaisons qui portent sur une chaîne française | 14 | ex. `status === 'cesse'` ; à remplacer par des codes |
| Pluriels écrits à la main | 14 | `n > 1 ? 's' : ''` |
| Dates formatées en dur en `fr-CA` | 8 sites + une liste de mois dans l'HTML | `NoteEditor`, `ActionLog`, `editor-schema` |
| `aria-label` et `title` | 185 | texte pour les lecteurs d'écran |
| Tests | 22 fichiers, 514 lignes avec du français, 2 862 lignes au total | beaucoup d'assertions sur des libellés |
| CIM-10 | 2 435 libellés français (7 « génériques » inventés) + hiérarchie | piste B : vers l'anglais |
| SNOMED CT | 4 219 concepts, déjà en anglais | affichés tels quels dans l'interface française aujourd'hui ; piste B : vers le français |

Ce qui dépend du texte à l'écran et se cassera si on ne le traite pas : le mode présentation (mes recherches par texte dans l'envoi rapide : « Envoi rapide », « Compléter et envoyer », « Jean-Coutu », le titre « Ajouter un destinataire »), et les recherches des éléments `/` (qui comparent à des titres français).

## 5. Piste A — Rendre bilingue

Chaque lot laisse le français identique à avant (comparaison par captures et par les tests).

| Lot | Contenu | Fichiers principaux | Jours-personne |
|---|---|---|---|
| **A0 Fondation et contrat** | `i18n.js` (script classique, pas `.jsx` : chargé avant Babel, il décide d'abord quels fichiers de langue charger) (`t`, `tn`, `L`, locale `Intl`, `?lang`, mémorisation, `<html lang>`, repli sur le français) ; chargeur dans l'HTML ; `tools/i18n-extract.mjs` et `catalog.json` ; test de parité (avertissement tant que l'anglais manque, erreur ensuite) | `Note Clinique.html`, nouveaux fichiers | 1 à 1,5 |
| **A1 Logique, dates, pluriels** | 14 comparaisons → codes ; `fr-CA` → locale ; mois de l'HTML ; 14 pluriels ; espaces insécables (« : », « ? ») ; guillemets « » → “ ” | `editor-schema`, `NoteEditor`, `ActionLog`, `diagnostics`, HTML | 1 |
| **A2 Interface** | Extraction vers `fr.js`, remplacement par `t()` : barre du haut, menu latéral, bannière, notes, sommaire et ses modales, popovers, menu `/rx`, formulaire d'ordonnance, toasts, 185 `aria-label` | `Summary*`, `NotesList`, `editor-popover`, `editor-field`, `NoteEditor`, `TopBar`, `SideNav`, `PatientBanner` | 1,5 à 2 |
| **A3 Données de démonstration** | `L()` sur les éléments `/`, 4 gabarits de note (virus, ITU, périodique, otite), médicaments et posologies (DIE, « comp. », « jours »…), analyses, imagerie, références, patient, scénarios ; mots-clés des deux langues pour la recherche | `editor-data.jsx` (469 chaînes) | 1 à 1,5 |
| **A4 Outils cliniques et documents** | Outils cliniques, sélecteur, aperçu d'ordonnance, impression, fax, checkout, envoi rapide | `ClinicalTool*`, `Document*`, `PrintDialog`, `FaxScreen`, `TransmissionModal`, `QuickSendModal` | 1 à 1,5 |
| **A5 Diagnostics** | Chargement des fichiers de diagnostic selon la langue (repli sur l'actuel) ; index de recherche sur les deux langues ; textes du sélecteur `/dx` | `dx-picker`, `diagnostics`, `cim10-index`, `snomed-index` | 0,5 à 1 |
| **A6 Mode présentation** | Sélecteurs par `data-*` au lieu de texte ; chapitres, « Gestes », « À dire », 12 étapes de l'Auto en `t()` | `presentation-mode.jsx` | 0,5 à 1 |
| **A7 Tests** | 22 fichiers : assertions sur libellés lues par `t()`, jeu complet exécuté en `fr` puis en `en` | `tests/*.test.mjs` | 1,5 à 2 |
| **A8 Vérification** | Débordements de mise en page en anglais, parcours des 12 étapes dans les deux langues, comparaison du français avant / après | tout | 1,5 à 2 |
| **Total piste A** | | | **9,5 à 13,5** |

**Règle des codes (posée par A1).** Une valeur énumérée que la logique lit (`form`, `durationUnit`, `status`, `visitType`, `normality`…) est un **code** : jamais traduite (ni `L()`, ni piste B), jamais comparée à ce qui s'affiche ; seul son libellé passe par `t()`. Certains codes gardent une orthographe française par héritage (`'comprimé'`, `'cessée'`, `'Sans'`) ; `tests/i18n.test.mjs` liste ces exceptions (`CODES_FRANCAIS`) et refuse toute nouvelle comparaison avec un libellé. Le texte tapé par le médecin (« 3 jours », « 2 weeks ») n'est pas un code : `rx-text.jsx` le lit dans les deux langues. Le même test refuse un `t()` appelé dans une portée qui déclare une variable `t`.

*Reste à traiter plus loin* : les listes de raccourcis de forme (`'1 co'`, `'2 inh'`, `fmMap` dans `NoteEditor`) sont des textes affichés qui servent de clés (A3) ; les valeurs d'options à libellé = valeur (`FIELD_OPTIONS`, `Jours / Semaines / Mois`, priorité `Normal / Urgent / Faible`) passent à `{ value, label }` en A2.

## 6. Piste B — Traduire

Tout est fait par IA, par lots, avec un script reproductible (`tools/i18n-translate.*`). Aucune revue humaine ; deux garde-fous peu coûteux : le glossaire commun et le test de parité.

| Lot | Contenu | Entrée | Sortie | Jours-personne |
|---|---|---|---|---|
| **B0 Glossaire et outil** | Glossaire d'environ 150 termes récurrents (ordonnance, outil clinique, puce, cesser, renouveler, sommaire…), point de départ : les termes FR↔EN du produit (compétence `omnimed-ux-writing`) ; script de traduction par lots (contexte, glossaire, `{valeurs}` conservées, reprise sur empreinte) | — | `glossaire.json`, `tools/i18n-translate.*` | 0,5 à 1 |
| **B1 Interface** | ≈ 2 000 textes d'interface | `catalog.json` (A2) | `en.js` | 0,5 |
| **B2 Données de démonstration** | Éléments `/`, gabarits, médicaments, analyses, imagerie, références, patient | `catalog.json` (A3) | `data-en.js` | 0,5 |
| **B3 CIM-10 → anglais** | 2 435 libellés + hiérarchie (chapitres, blocs) ; les 7 génériques inclus | `cim10-fr-clinique.json`, `cim10-hierarchy.json` | `cim10-en-clinique.json` | 0,5 |
| **B4 SNOMED → français** | 4 219 termes préférés | `snomed-diagnostics.json` | `snomed-diagnostics-fr.json` | 0,5 à 1 |
| **B5 Cohérence** | Chapitres et notes du mode présentation ; passe de cohérence sur le glossaire ; correction des clés signalées par le test de parité | `catalog.json` (A6), tout `en.js` | `en.js` final | 0,5 |
| **Total piste B** | | | | **3 à 4** |

Chaque fichier de données traduit porte `_meta.traduction: "automatique"`. B3 et B4 ne dépendent d'aucun lot de la piste A : ils peuvent partir dès le premier jour.

## 7. Estimation et scénarios

| Scénario | Piste A | Piste B | Total (jours-personne) |
|---|---|---|---|
| **Complet, bascule par rechargement** *(décision du 2026-10-22)* | 9,5 à 13,5 | 3 à 4 | **12,5 à 17,5** |
| Démonstration seulement (les 12 étapes ; B3 et B4 complets, ils dépendent peu du périmètre) | 5,5 à 7,5 | 2 à 3 | 7,5 à 10,5 |

Les deux pistes en parallèle réduisent la durée, pas l'effort : avec deux personnes (ou un développeur et un assistant sur la piste B), le complet tient en 9 à 14 jours calendaires, la piste A étant le chemin critique.

Pourquoi ces chiffres diffèrent de la version précédente (11,5 à 16 jours pour le complet, 5 à 7 pour la démonstration) : le découpage demande un contrat (catalogue, formats, repli), un outil d'extraction et un outil de traduction séparés. Cela coûte 1 à 1,5 jour de plus, et je corrige aussi l'estimation de la démonstration seule, qui était trop basse.

Unité : jours-personne d'un développeur qui travaille avec un assistant IA. La piste B traduit environ 8 000 textes (interface, données et diagnostics) ; son coût en calcul, quelques centaines de milliers de jetons, est négligeable devant le temps d'intégration. Fiabilité : ± 30 %. Les comptes de chaînes viennent d'un `grep`, pas d'un analyseur de syntaxe : du texte construit par concaténation (« 1 comp. » + « PO » + « TID ») n'est pas vu. A0 donne un comptage exact et resserre l'estimation.

## 8. Risques

| Risque | Effet | Parade |
|---|---|---|
| Traductions IA non validées (posologies, abréviations : DIE, « comp. », « co »), CIM-10 et SNOMED compris | Terme faux ou maladroit à l'écran | Accepté pour un prototype. Glossaire commun, phrases entières, `_meta.traduction: "automatique"`. Pas de promesse d'exactitude clinique en démonstration |
| Traduction incohérente d'un même terme | Interface qui change de vocabulaire d'un écran à l'autre | Glossaire injecté dans chaque lot ; test qui repère un terme du glossaire mal rendu |
| Libellés français servant de logique | Régressions silencieuses en anglais | A1 d'abord ; test qui scanne les comparaisons à un libellé |
| Le catalogue change après la traduction (texte français modifié) | Traduction obsolète | Empreinte du français dans `en.lock.json` : seul ce qui a changé est retraduit |
| Mise en page à largeur fixe (rail du mode présentation à 296 px, pastilles, menu `/rx`) | Texte coupé ou débordant en anglais | A8, avec capture dans les deux langues |
| Chaînes construites par morceaux | Phrases fausses (ordre des mots, accords) | Phrases entières dans le dictionnaire, `{valeurs}` nommées |
| Branche longue, plusieurs PR ouvertes ailleurs | Conflits avec le travail en cours | Une PR par lot, fusion dans l'intégration au fil de l'eau ; ramener `main` dans l'intégration souvent ; geler `editor-data.jsx` pendant A3 |
| 22 fichiers de tests | Tests rouges en masse | A7 prévu ; ne pas migrer les tests avant que `t()` existe |
| SNOMED français traduit par IA, alors que SNOMED est une terminologie officielle | Écart avec la version officielle si le prototype est montré comme du produit | Garder le terme anglais d'origine dans les données (recherche et info-bulle) |

## 9. Questions encore ouvertes

1. Langue par défaut : toujours français, ou celle du navigateur ? (hypothèse : toujours français)
2. Les notes du présentateur du mode présentation (« À dire », « Gestes ») doivent-elles aussi être bilingues, ou seulement l'interface montrée au client ? (hypothèse : bilingues, c'est peu de texte)

## 10. Critères de fin

**Piste A** (le prototype sait changer de langue)
- Avec `?lang=fr`, le français est identique à celui d'avant (captures avant et après, jeu de tests complet vert).
- Avec `?lang=en` et sans fichier d'anglais, tout s'affiche en français (repli), sans erreur.
- Aucun texte visible n'est écrit en dur hors des dictionnaires et des `L()` (balayage automatique).
- `<html lang>` suit la langue ; les `aria-label` passent par `t()`.

**Piste B** (l'anglais existe)
- Le test de parité ne trouve ni clé manquante ni clé inutilisée, et passe en mode strict.
- `cim10-en-clinique.json` et `snomed-diagnostics-fr.json` couvrent toutes les entrées (nombre de lignes égal à la source).
- Le glossaire est appliqué sans exception relevée par le test de cohérence.

**Ensemble**
- Le même jeu de tests passe avec `?lang=fr` et `?lang=en`.
- Aucune chaîne française visible en mode anglais (balayage de l'interface et des 12 étapes), et l'inverse.
- Les 12 étapes du mode Auto se déroulent dans les deux langues, jusqu'à l'ordonnance transmise.
