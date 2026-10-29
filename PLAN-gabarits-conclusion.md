# Plan — Gabarits de conclusion avec tuiles dans le texte

Brouillon du 2026-10-29. Les questions sont en bas ; le plan bouge selon les réponses.
Suite de [PLAN-textes-rapides.md](PLAN-textes-rapides.md) et de [PLAN-suggestions-contextuelles.md](PLAN-suggestions-contextuelles.md).

## Ce qu'on veut

Un médecin choisit un diagnostic (ex. pneumonie). Il complète sa conclusion en un geste avec un **texte rapide** : du texte clinique où les prescriptions, requêtes, consignes et références sont des **tuiles à même la phrase**, pas une rangée de puces à la fin.

> Plan : `℞ Amoxicilline 1 g PO TID 5 j` · `Radiographie pulmonaire` si non faite.
> Revoir dans 48 à 72 h. Consulter si dyspnée, confusion ou fièvre au-delà de 72 h.

Une version fonctionnelle pour la pneumonie d'abord, puis une dizaine de maladies courantes.

## Ce qui existe déjà

- **Gabarits de conclusion par diagnostic** : `DX_CONTEXTS[].conclusion` et `.mine`, [editor-data.jsx:1170](project/note-ui/editor-data.jsx:1170). Cinq diagnostics : ITU, asthme, pneumonie, otite, IVRS. Les options sont classées par `dxConclusionOptions` (dernière conclusion, mon gabarit, gabarit Omnimed).
- **Insertion** : `buildConclusionBlocks`, [editor-schema.jsx:2883](project/note-ui/editor-schema.jsx:2883). Le texte devient des paragraphes ; **toutes les puces vont dans un paragraphe à part, à la fin**. C'est ce qu'on change.
- **Puces en attente** : `buildTemplateChipNode` → puce `pending` avec ✓ / ✕, signée par `source`. Le texte peut aussi être proposé (`proposeText`, marques d'insertion).
- **Textes rapides** : planifiés (`QUICK_TEXTS`), pas codés. L'item « Textes rapides » du menu « / » ne fait rien (Q-P11 de [SPEC-recherche-menu-action.md](SPEC-recherche-menu-action.md)).
- **Catalogue** : il manque des molécules de base pour les infections courantes. Pas de doxycycline, azithromycine, clarithromycine, lévofloxacine, pénicilline V, oseltamivir, valacyclovir, fluticasone nasale. L'amoxicilline n'existe qu'en 500 mg (`amox500`). Pas de fiche de consignes pour les infections (les `instr` couvrent surtout les maladies chroniques). Pas de puce « rendez-vous de suivi ».

## Proposition

### 1. Un seul moteur : le texte rapide

Un gabarit de conclusion devient un **texte rapide lié à un diagnostic**. Même forme de données, même insertion. Les entrées changent seulement :

| Entrée | Ce qui est offert |
|---|---|
| Sous un diagnostic (colonne, barre en ligne) | Textes rapides liés à ce diagnostic, dans l'ordre actuel : dernière conclusion, les miens, Omnimed |
| Menu « / » → Textes rapides › | Tous, recherche par nom ; lié au diagnostic si le curseur est dans sa région |
| Raison de consultation | Textes rapides liés à la raison (plan des textes rapides) |

### 2. Tuiles dans le texte

Le contenu garde du texte simple, avec des **jetons** qui renvoient à une table de tuiles :

```js
{ key: 'pac-ambu', name: L('Pneumonie acquise en communauté — ambulatoire'),
  dx: ['pneumonie'],
  content: L('Impression : pneumonie acquise en communauté, prise en charge ambulatoire.\n' +
             'Plan : {abx}. {img} si non faite.\n' +
             '{analg} au besoin pour la fièvre.\n' +
             'Revoir dans 48 à 72 h. Consulter si dyspnée, confusion ou fièvre au-delà de 72 h.'),
  tiles: {
    abx:   { kind: 'rx',  key: 'amox1g', details: { frequency: 'TID', duration: '5', durationUnit: 'jours' } },
    img:   { kind: 'img', key: 'rxpoumon' },
    analg: { kind: 'rx',  key: 'cat-40' } } }
```

- Les jetons survivent à la traduction (`L()` FR/EN) : le traducteur ne touche pas `{abx}`.
- `buildConclusionBlocks` coupe chaque ligne aux jetons et place la puce **à sa position** (`buildTemplateChipNode`). Les anciens `proposals` sans jeton restent en fin de bloc, pour ne rien casser.
- Une puce garde son état en attente et sa source, comme aujourd'hui.

### 3. Insertion et refus

- Le texte rapide arrive **en attente** dans la région du diagnostic (décision Q4 du plan des suggestions).
- « Tout accepter » reste dans la barre des ajouts en attente.
- Refuser une puce au milieu d'une phrase laisse un trou (« Plan : . »). Comportement à décider : **Q3**.

### 4. Données et catalogue

- Déplacer les gabarits de `DX_CONTEXTS[].conclusion/mine` vers une liste `QUICK_TEXTS` avec un champ `dx` (clés de `DX_CONTEXTS`) et `raisons`. `dxConclusionOptions` lit cette liste.
- Ajouter au catalogue les molécules manquantes (liste ci-dessus) et des variantes de dose (amoxicilline 1 g, 875 mg/125 mg pour l'amoxicilline-clavulanate).
- Ajouter les `DX_CONTEXTS` manquants pour les nouveaux diagnostics (codes CIM-10, mots).

### 5. Étapes

1. **Moteur** : jetons dans `buildConclusionBlocks`, `tiles`, compatibilité avec `proposals`. Test dans `pending-chips.test.mjs`.
2. **Pneumonie, version fonctionnelle** : catalogue (amox 1 g, doxycycline, azithromycine, clarithromycine, lévofloxacine), contexte, 2 ou 3 textes rapides (voir exemples), parcours complet vérifié dans le navigateur.
2 bis. **Avertissement d'allergie sur la carte** (Q7) : conflit calculé à partir des tuiles et de la règle d'allergie existante ; variantes sans conflit en premier. Test.
3. **Refus d'une puce dans une phrase** : la puce seule part (Q3) ; vérifier qu'aucun double espace ni « : . » n'est créé par le nettoyage.
4. **Autres maladies** (Q4) : infections courantes, exacerbations d'asthme et de MPOC, suivis HTA et diabète, avec catalogue et contextes.
5. **Menu « / » → Textes rapides ›** : sélecteur avec recherche (règle Q-P11).
6. **i18n et tests** : catalogue i18n, `template-suggestions.test.mjs` et `dx-context.test.mjs` étendus.

## Exemples cliniques

**Registre : formation (Training).** Contenu plausible tiré des pratiques canadiennes et québécoises courantes en première ligne (guides INESSS, Thoracic Society). **Non validé pour ce prototype : à faire relire par un clinicien avant toute démo.** Les doses sont pour un adulte sauf mention. Les `{jetons}` sont des tuiles ; « *(manque)* » = item absent du catalogue actuel.

### Pneumonie acquise en communauté

**A. Ambulatoire, adulte sans comorbidité**
> Impression : pneumonie acquise en communauté, CRB-65 à 0, prise en charge ambulatoire.
> Plan : `{Amoxicilline 1 g PO TID 5 j}` *(dose manque)*. `{Radiographie pulmonaire}` si non faite.
> `{Acétaminophène}` au besoin pour la fièvre.
> Revoir dans 48 à 72 h. Consulter si dyspnée, confusion ou fièvre au-delà de 72 h.
> Radiographie de contrôle dans 6 à 8 semaines si plus de 50 ans ou fumeur.

**B. Ambulatoire, avec comorbidités (MPOC, diabète, insuffisance cardiaque, alcoolisme)**
> Impression : pneumonie acquise en communauté avec comorbidités.
> Plan : `{Amoxicilline-clavulanate 875/125 mg PO BID 5 j}` et `{Azithromycine 500 mg J1 puis 250 mg J2 à J5}` *(manque)*.
> `{Radiographie pulmonaire}`, `{FSC}`, `{Créatinine}`, `{CRP}`.
> Revoir dans 48 h.

**C. Allergie à la pénicilline**
> Plan : `{Doxycycline 100 mg PO BID 5 j}` *(manque)* ; si comorbidités : `{Lévofloxacine 750 mg PO DIE 5 j}` *(manque)*.

### Autres maladies courantes

| Maladie | Texte (tuiles entre accolades) | Manques |
|---|---|---|
| **Cystite non compliquée (femme)** | Plan : `{Nitrofurantoïne 100 mg BID 5 j}` ; `{Culture d'urine}` si récidive ou échec. Consulter si fièvre ou douleur lombaire. | — |
| **Pyélonéphrite simple** | Plan : `{Ciprofloxacine 500 mg BID 7 j}`, `{Culture d'urine}`, `{FSC}`, `{Créatinine}`. Revoir dans 48 h. | — |
| **Otite moyenne aiguë (enfant)** | Plan : `{Amoxicilline 45 mg/kg/dose BID}` 10 j si moins de 2 ans, 5 j sinon. `{Acétaminophène}` ou `{Ibuprofène}` pour la douleur. Option : ordonnance différée de 48 h. | Dosage pédiatrique au poids (existe pour `amox500`) |
| **Pharyngite à streptocoque** | Test rapide positif. Plan : `{Pénicilline V 600 mg BID 10 j}` ou `{Amoxicilline 50 mg/kg DIE 10 j}`. Retour à l'école 24 h après le début. | Pénicilline V, test rapide |
| **Sinusite bactérienne aiguë** | Plan : rinçage salin, `{Fluticasone nasale}` ; si critères : `{Amoxicilline 1 g TID 5 j}`. Revoir si pas mieux en 72 h. | Fluticasone nasale |
| **Syndrome viral / influenza** | Plan : repos, hydratation, `{Acétaminophène}`. Si risque élevé et moins de 48 h : `{Oseltamivir 75 mg BID 5 j}`. Consulter si dyspnée. | Oseltamivir |
| **Cellulite non compliquée** | Plan : `{Céphalexine 500 mg QID 5 j}`, contour marqué. Revoir dans 48 h. | — |
| **Zona** | Plan : `{Valacyclovir 1 g TID 7 j}` si moins de 72 h, `{Acétaminophène}`. Vaccin Shingrix à discuter après guérison. | Valacyclovir |
| **Exacerbation d'asthme légère** | Plan : `{Prednisone 40 mg DIE 5 j}`, `{Ventolin}` au besoin, revoir la technique. Plan d'action écrit `{Consignes asthme}`. | — |
| **Exacerbation de MPOC** | Plan : `{Prednisone 40 mg DIE 5 j}` ; si expectorations purulentes : `{Amoxicilline-clavulanate 875 mg BID 5 j}`. `{Radiographie pulmonaire}`. | — |
| **HTA — suivi** | Plan : `{Bilan HTA de suivi}`, `{Suivi de la pression artérielle}`, `{Consignes HTA}`. Cible PA moins de 130/80. Revoir dans 3 mois. | — |
| **Diabète type 2 — suivi** | Plan : `{HbA1c}`, `{Microalbumine}`, `{Créatinine}`, `{Consignes diabète}`. Cible HbA1c 7 % ou moins. | — |

## Décisions (2026-10-29)

- **Q1. Un seul objet** : un gabarit de conclusion est un texte rapide lié à un diagnostic.
- **Q2. Plusieurs textes rapides par diagnostic** : une variante = un texte (« PAC ambulatoire », « PAC avec comorbidités », « PAC allergie à la pénicilline »). Le médecin choisit.
- **Q3. Refuser une puce retire la puce seule** : le texte autour reste en attente ; le médecin corrige la phrase. Le nettoyage d'espaces de `pendingChipDeleteEnd` s'applique.
- **Q4. Maladies** : pneumonie, puis infections courantes (cystite, pyélonéphrite, otite, pharyngite, sinusite, cellulite, influenza, zona), respiratoire chronique (exacerbations d'asthme et de MPOC), suivis chroniques (HTA, diabète type 2). **Lombalgie hors champ.**

- **Q5. Pas de champs à compléter** : le médecin écrit les valeurs lui-même. Les textes n'ont pas de trous.
- **Q6. Suivi en texte pour l'instant** : « Revoir dans 48 h » reste du texte. **À revoir** : une tuile « rendez-vous à planifier » viendra plus tard. Les textes écrivent le délai de suivi sur une ligne à part, pour qu'il devienne facilement une tuile.
- **Q7. Allergie signalée sur la carte** : un texte rapide dont une tuile entre en conflit avec une allergie au dossier montre un avertissement avant l'insertion. Les variantes sans conflit passent en premier.
- **Q9. « Les miens » : exemples fournis**, simulés. Pas de création ni d'édition.

### Conséquence pour la démo

La patiente de démo a une **allergie à la pénicilline** ([Summary.jsx:29](project/note-ui/Summary.jsx:29), `_patientAllergies` [editor-data.jsx:499](project/note-ui/editor-data.jsx:499)) et aux sulfamidés dans le sommaire. Pour la pneumonie :

- « PAC ambulatoire » (amoxicilline) et « PAC avec comorbidités » (amoxicilline-clavulanate) portent l'avertissement.
- « PAC allergie à la pénicilline » (doxycycline) passe en premier.
- La recherche `/rx` masque déjà les pénicillines (`applyAllergyFilter`). Un texte rapide inséré malgré l'avertissement doit garder le signal sur la puce (`chipIssues`).
- Même règle pour la cystite (TMP-SMX et sulfamidés).

## État (2026-10-29)

Fait sur la branche `feat/textes-rapides-tuiles` :

- **Étape 1, moteur** : jetons `{clé}` → puce à sa place (`buildConclusionBlocks`, `TILE_TOKEN`) ; les ajouts sans jeton gardent leur ligne à la fin.
- **Étape 2, pneumonie** : `QUICK_TEXTS` remplace `DX_CONTEXTS[].conclusion/mine` (les 5 gabarits existants y sont repris tels quels) ; 3 textes de pneumonie (« PAC ambulatoire », « PAC avec comorbidités », « PAC, allergie à la pénicilline ») ; catalogue : amoxicilline 1 g (`cat-50`), doxycycline (`cat-51`), azithromycine (`cat-52`), sans DIN. Clarithromycine et lévofloxacine pas ajoutées : aucun texte ne les utilise encore.
- **Étape 2 bis, allergie** : options classées sans conflit d'abord, avertissement rouge sur la carte de la colonne, icône d'avertissement sur la pastille de la barre si tous les textes sont en conflit. La puce d'une ordonnance allergène porte aussi l'état « Allergie au dossier » (`chipIssues`, sauf renouvellement et ajustement). La colonne et la barre ne proposent plus de produit allergène en prescription directe.
- **Étape 3, refus** : la puce part seule (`resolvePendingInDoc`), testé.
- Tests : `quick-texts.test.mjs` (nouveau), tests existants adaptés aux clés des textes.

À noter :

- Avec la colonne ouverte, une puce longue passe à la ligne après son libellé (« Antibiotique : » puis la puce). Sans la colonne, elle tient sur la ligne.
- Avec le réglage « Gabarit : lignes à compléter » (allumé par défaut), les tuiles arrivent en lignes à compléter, sans posologie. Éteint, elles arrivent en puces en attente complètes.
- Étape 5 faite sur `feat/menu-textes-rapides` (voir plus bas).

Fait sur la branche `feat/textes-rapides-maladies` (étape 4) :

- **Nouveaux contextes** : pyélonéphrite (N10), MPOC (J44), pharyngite (J02, J03), sinusite (J01), influenza (J09 à J11), cellulite (L03), zona (B02), HTA (I10 à I15), diabète de type 2 (E11). Le contexte IVRS ne garde que J00, J04 à J06, et perd les mots « grippe » et « influenza ».
- **Textes rapides** : les 6 gabarits existants passent aux tuiles dans le texte (même sens, nouvelle mise en forme « libellé : tuile »). Nouveaux : pyélonéphrite, exacerbation d'asthme, exacerbation de MPOC (et variante allergie), otite (variante allergie), pharyngite (et variante), sinusite (et variante), influenza, cellulite, zona, HTA, diabète de type 2.
- **Catalogue** : pénicilline V, oseltamivir, valacyclovir, fluticasone nasale, prednisone 50 mg, avec une clé explicite (`key`). `RX_OTHERS` lit `m.key || 'cat-' + i`, pour que deux ajouts en fin de tableau ne se disputent pas un `cat-N`. Forme « vaporisateur » : « 2 vap. » sur la puce.
- Pas de tuile de consignes : les consignes (`instr`) n'ont pas de `name` et ne se construisent pas en puce de gabarit. Elles restent du texte.
- À savoir : la 2e patiente de `feat/reference-specialite` est allergique aux sulfamides, mais `ALLERGEN_CLASSES` ne connaît que la pénicilline. Le TMP-SMX de la pyélonéphrite ne sera signalé qu'une fois une classe « sulfamides » ajoutée.

Fait sur la branche `feat/menu-textes-rapides` (étape 5, règle Q-P11 de SPEC-recherche-menu-action.md) :

- « / » → **Textes rapides ›** ouvre un sous-menu (`QuickTextMenu`, editor-field.jsx), même patron que « Gabarits de note », avec un champ de recherche. La recherche porte sur le nom du texte et sur le nom et les mots de ses diagnostics : « pneumonie » trouve les « PAC… ». Tous les mots tapés doivent s'y trouver, sans tenir compte des accents ni de la casse. Flèches et Entrée au clavier.
- Dans la région d'un diagnostic : « Pour <diagnostic> » d'abord (mêmes options et même ordre que la colonne, dernière conclusion comprise), puis « Autres textes rapides ». Partout, les textes sans conflit d'allergie passent en premier, et un texte en conflit le dit sous son nom.
- Le choix s'insère au curseur, en attente, avec ses tuiles (`note:insert-quick-text`, NoteEditor.jsx), à la place de la ligne si elle est vide, sinon juste après.
- Données : `searchQuickTexts`, `quickTextOptionById` (editor-data.jsx). Amoxicilline 1 g : « 2 gél » par prise.

## Questions restantes

- **Q8. Validation clinique** : qui relit les exemples avant une démo ? Une première relecture (sources et anglais) est dans [RELECTURE-textes-rapides.md](RELECTURE-textes-rapides.md). Ses corrections sont faites ; il reste 8 questions pour un clinicien.
- **Q10. Tuile « rendez-vous à planifier »** (suite de Q6) : forme et destination à définir dans un plan à part.
