# Note Clinique — notes de requis

## Besoins d'affaires
- **BA-01** — Aligner la carte « Note Clinique » et sa barre du bas sur les règles du DS3. *Source : Ignacio Calvo, 2026-09-28.* Statut : appliqué.

## Règles d'affaires
- **RA-01** — Le contour d'un champ de formulaire doit atteindre 3:1 (WCAG 1.4.11, TGV) : `--mat-sys-outline` (4,00:1). *Source : README DS3, section Accessibilité.*
- **RA-02** — Aucune couleur en dur là où un rôle `--mat-sys-*` existe (mode sombre, retinte de marque). *Source : README DS3.*

## Idées et pistes
- **ID-01** — Remplacer `<input type="date|time">` natifs par `MatDatepicker` / `MatTimepicker` (format FR : 28 sept. 2026, 15:35). *Source : analyse Claude, validée par Ignacio Calvo.* Statut : retenue, **pas encore faite** (point 3 de l'analyse du 2026-09-28, à traiter à part).
- **ID-02** — Nommer la pastille bouclier « 0 » (aria-label + infobulle). Statut : en attente.
- **ID-03** — Retirer ou neutraliser l'icône document décorative en haut à droite. Statut : en attente.

## Questions ouvertes
- **Q-01** — Que compte exactement la pastille bouclier « 0 » (titre actuel : « Portail patient ») ? *Déduction Claude — à confirmer.*
- **Q-02** — Largeur du sélecteur « Type de visite » : à revérifier à ≥ 1285 px avec les libellés FR (+50 %).
- **Q-03** — Mode sombre : `color-scheme: light` est forcé dans `ds3-tokens.css` ; le reste du prototype n'est pas prêt pour le sombre.

## Journal des versions
- **2026-09-28** — Création de `ds3-tokens.css` (rôles `--mat-sys-*`, espacement, typo, coins, ombres) ; refonte des styles de `NoteEditor.jsx` (champs 44 px / coin 8 / contour `outline` / focus 2 px primary, titre `headline-small`, carte `level1`, grille 4 pt) ; boutons de la barre du bas en `ds-btn` (tonal, filled, icône 40 px, focus 3 px `inverse-surface`).
