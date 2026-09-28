# Note Clinique — notes de requis

## Besoins d'affaires
- **BA-01** — Aligner la carte « Note Clinique » et sa barre du bas sur les règles du DS3. *Source : Ignacio Calvo, 2026-09-28.* Statut : appliqué.

## Règles d'affaires
- **RA-01** — Le contour d'un champ de formulaire doit atteindre 3:1 (WCAG 1.4.11, TGV) : `--mat-sys-outline` (4,00:1). *Source : README DS3, section Accessibilité.*
- **RA-02** — Aucune couleur en dur là où un rôle `--mat-sys-*` existe (mode sombre, retinte de marque). *Source : README DS3.*

## Idées et pistes
- **ID-01** — Remplacer `<input type="date|time">` natifs par un sélecteur DS3 au format FR (28 sept. 2026, 15:35). *Source : analyse Claude, validée par Ignacio Calvo.* Statut : fait (2026-09-28).
- **ID-02** — Nommer la pastille bouclier « 0 » (aria-label + infobulle). Statut : fait (2026-09-28) — « Portail patient : 0 élément partagé » ; même traitement pour les pastilles de documents (« Ordonnance : 1 sur 5 complété »).
- **ID-03** — Retirer ou neutraliser l'icône document décorative en haut à droite. Statut : en attente.

## Questions ouvertes
- **Q-01** — ~~Que compte la pastille bouclier ?~~ Réponse d'Ignacio Calvo (2026-09-28) : les éléments partagés au patient par le portail — consignes au patient, imagerie, laboratoire, références à un spécialiste, et la complétion de la note. Monte dès l'ajout dans la note ; cachée à 0. Statut : répondue. Reste ouvert (**Q-04**) : la complétion de la note.
- **Q-02** — Largeur du sélecteur « Type de visite » : à revérifier à ≥ 1285 px avec les libellés FR (+50 %).
- **Q-03** — Mode sombre : `color-scheme: light` est forcé dans `ds3-tokens.css` ; le reste du prototype n'est pas prêt pour le sombre.

- **Q-04** — La complétion de la note ajoute-t-elle 1 au compteur du portail ? Non implémenté : la pastille disparaît avec le pied de note au moment où la note est complétée (la note se ferme), donc l'ajout ne serait jamais visible. *À trancher : où afficher ce compte après complétion ?*

## Journal des versions
- **2026-09-28** — Création de `ds3-tokens.css` (rôles `--mat-sys-*`, espacement, typo, coins, ombres) ; refonte des styles de `NoteEditor.jsx` (champs 44 px / coin 8 / contour `outline` / focus 2 px primary, titre `headline-small`, carte `level1`, grille 4 pt) ; boutons de la barre du bas en `ds-btn` (tonal, filled, icône 40 px, focus 3 px `inverse-surface`).
- **2026-09-28** — Ajout de `DsDateField` / `DsTimeField` (remplacent les input natifs, format FR, saisie et navigation clavier). Barre de mise en forme flottante : largeur ajustée à ses boutons, puis habillage aligné sur `tiptap-toolbar.component.scss` (production) — container-lowest, bordure outline-variant, coin 8, level2, boutons 40 px, séparateurs 4 px, menus 200 px en container-low, palette 15 px, `aria-pressed` sur les boutons.
- **2026-09-28** — Pastille bouclier et pastilles de documents du pied de note : `role="img"` + `aria-label` (avant : `title` seul), icônes en `aria-hidden`.
- **2026-09-28** — Pastilles du pied de note : icône en police Material Symbols dans une boîte fixe de 17 px (le nom « radiology » n'existe pas dans Material Icons Outlined : le texte étirait la pastille Imagerie à ~132 px, avec un grand vide entre l'icône et « 0/1 »). Largeur ramenée à ~64 px.
- **2026-09-28** — Pastille bouclier : compteur réel (consignes + imagerie + laboratoire + références présents dans la note), cachée à 0 et quand le portail patient est désactivé (tweak `portalActive`). Plus de valeur figée à 0.
