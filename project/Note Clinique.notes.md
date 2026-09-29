# Note Clinique — notes de requis

## Besoins d'affaires
- **BA-01** — Aligner la carte « Note Clinique » et sa barre du bas sur les règles du DS3. *Source : Ignacio Calvo, 2026-09-28.* Statut : appliqué.

## Règles d'affaires
- **RA-01** — Le contour d'un champ de formulaire doit atteindre 3:1 (WCAG 1.4.11, TGV) : `--mat-sys-outline` (4,00:1). *Source : README DS3, section Accessibilité.*
- **RA-02** — Aucune couleur en dur là où un rôle `--mat-sys-*` existe (mode sombre, retinte de marque). *Source : README DS3.*

## Idées et pistes
- **ID-01** — Remplacer `<input type="date|time">` natifs par un sélecteur DS3 au format FR (28 sept. 2026, 15:35). *Source : analyse Claude, validée par Ignacio Calvo.* Statut : fait (2026-09-28).
- **ID-02** — Nommer la pastille bouclier « 0 » (aria-label + infobulle). Statut : en attente.
- **ID-03** — Retirer ou neutraliser l'icône document décorative en haut à droite. Statut : fait (2026-09-28) — retirée, y compris à côté du chip « Rédaction assistée ».

## Questions ouvertes
- **Q-01** — Que compte exactement la pastille bouclier « 0 » (titre actuel : « Portail patient ») ? *Déduction Claude — à confirmer.*
- **Q-02** — ~~Largeur du sélecteur « Type de visite » à ≥ 1285 px.~~ Réglée (2026-09-28) : date, heure et type forment un groupe qui passe sous la raison de consultation quand la carte est trop étroite (~760 px dans l'app) ; le sélecteur ne rétrécit plus. Vérifié à 1200 et 1440 px.
- **Q-03** — Mode sombre : `color-scheme: light` est forcé dans `ds3-tokens.css` ; le reste du prototype n'est pas prêt pour le sombre.

## Journal des versions
- **2026-09-28** — Création de `ds3-tokens.css` (rôles `--mat-sys-*`, espacement, typo, coins, ombres) ; refonte des styles de `NoteEditor.jsx` (champs 44 px / coin 8 / contour `outline` / focus 2 px primary, titre `headline-small`, carte `level1`, grille 4 pt) ; boutons de la barre du bas en `ds-btn` (tonal, filled, icône 40 px, focus 3 px `inverse-surface`).
- **2026-09-28** — Ajout de `DsDateField` / `DsTimeField` (remplacent les input natifs, format FR, saisie et navigation clavier). Barre de mise en forme flottante : largeur ajustée à ses boutons, puis habillage aligné sur `tiptap-toolbar.component.scss` (production) — container-lowest, bordure outline-variant, coin 8, level2, boutons 40 px, séparateurs 4 px, menus 200 px en container-low, palette 15 px, `aria-pressed` sur les boutons.
- **2026-09-28** — Icône « radiology » : Material Symbols dans TransmissionModal (sidebar du checkout) et ActionLog (journal d'actions) — le nom n'existe pas dans Material Icons Outlined. Icône document décorative retirée de l'en-tête de la carte. Champs date/heure/type groupés, sous la raison quand la carte est étroite ; largeurs 190 / 140 / 230 px. Vérifié : saisie de l'heure (« 1535 », « 9:05 pm » → 21:05, « 25:00 » rejeté) et de la date (« 05/11/2026 » → 5 nov. 2026, « 31/02/2026 » rejeté), menu Paragraphe, champ de lien, champ Étiquettes.
