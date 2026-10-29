# Plan — Checkout : « Transmission générale »

Source design : [Figma — Checkout · Vision, section **Transmission générale**](https://www.figma.com/design/F3Nia0ctWn4PD7DuW9ZMMI/Checkout---Vision?node-id=17839-38366) (`fileKey` `F3Nia0ctWn4PD7DuW9ZMMI`, node `17839:38366`). Lue le 2026-10-29 : captures des 6 écrans, des toasts et des annotations.

Le checkout actuel a été capturé au navigateur le même jour : note « Otite », nitrofurantoïne 100 mg et FSC, ouverte par « Finaliser », puis ordonnance choisie et PJC Jean-Coutu ajoutée.

Ce plan complète [PLAN-checkout-v7.md](PLAN-checkout-v7.md). Les points où les deux se contredisent sont des questions (§4).

---

## 0. Écrans lus

| Node | Nom | Ce qu'il montre |
|---|---|---|
| `17850:45215` | Défaut | Ordonnance non complétée, aucun destinataire. Recherche + filtres + 3 pharmacies à proximité |
| `17850:45691` | Pharmacie favorite | Annotation « si pharmacie favorite au dossier ». Jean Coutu préremplie (★ pleine), canaux Fax ☑ / Courriel ☐. **Transmettre actif avant Compléter** |
| `17851:47148` | Pharmacie favorite - Non prescribeit | Même carte, ★ vide. Transmettre désactivé |
| `17867:50408` | Pharmacie favorite - Non prescribeit (2) | Même carte, un seul canal : **PrescribeIT** ☑ |
| `17858:47550` | Complétion | Badge « Complétée » à côté du titre. Compléter désactivé, Transmettre primaire |
| `17867:51286` | Autre document | Ordonnance transmise (✓✓, fond gris, infobulle « Tranmise »), FSC sélectionné, contenu vide. Pied : « Signer le document » désactivé + « Transmettre l'ordonnance » |
| `17867:51209/51225/51255` | DS3/toast | « L'ordonnance a bien été transmise. » (vert) · « … en cours de transmission. » (ambre) · « Erreur lors de la transmission de l'ordonnance. » (rouge) |
| — | Losange + sticky | « Autre document à transmettre ? » Oui → écran Autre document. Non → « L'utilisateur retourne à la note » |

Les textes des toasts et du losange viennent d'une capture à basse résolution. Je les relirai dans Figma avant de les écrire dans le code.

---

## 1. Le flux de la maquette

```
Défaut ──(+ sur une carte)──► Destinataire choisi ──► Compléter ──► Complétion ──► Transmettre
   │                                                                                  │
   └─(pharmacie favorite au dossier)─► Pharmacie favorite préremplie                   ▼
                                                                   toast (en cours → succès | erreur)
                                                                                      │
                                                         Autre document à transmettre ? ──oui──► document suivant
                                                                                      └──non──► retour à la note
```

---

## 2. Écarts avec le checkout actuel

| Zone | Aujourd'hui (`TransmissionModal.jsx`, `DocumentActionPanel.jsx`) | Maquette |
|---|---|---|
| Surface | Bottom sheet pleine largeur (`sheet-up`) | Modale à marges de 40 px, coins arrondis, scrim gris |
| En-tête | Titre « Transmission des documents » + badge « 2 À compléter » + ✕ | **3 onglets** : Transmission des documents (badges `1 À compléter` `1 Prêt`) · Portail patient « 0 élément partagé » · Pré-facturation « 150,00 $ » + ✕ |
| Patient | Ligne fine pleine largeur (nom, sexe, naissance, NAM) | **Bandeau patient DME complet** (photo, MLAM, exp., n° dossier, langue, CV, 7 boutons-icônes), dans la zone de contenu seulement |
| Sidebar : en-tête | Item « Otite — Faire suivre et signer » en tête | `DOCUMENTS (4) +`, puis « Copie de note 0 ». **Plus d'item Note** |
| Sidebar : groupes | 4 familles (`TX_SIDE_GROUPS`) : ORDONNANCE, REQUÊTES, OUTILS CLINIQUES, CONSIGNES. Groupe vide caché | 8 catégories en casse normale : Copie de note, Médication, Laboratoire, Imagerie, Consultation, Examen diagnostique, Service, Formulaire. **Catégories vides affichées avec 0**. Pas de Consignes |
| Sidebar : statut | ⚠ ambre (à compléter) | ⚠ à compléter, ✓ cerclé (prêt), ✓✓ verte (transmise, infobulle). Item transmis sur fond gris, titre gris |
| Sidebar : pied | `+ Ajouter un document` | Supprimé : le `+` passe dans l'en-tête |
| Titre du document | Petit titre + badges `Non complétée` `Non transmise` + 🖨 + split « Compléter » + « Transmettre » | **Grand titre** `℞ Ordonnance`. Un seul badge, `Complétée`, après complétion. Les actions passent dans le pied |
| Colonnes | 3 : Contenu (Prescriptions, Pièces jointes) · Destinataire · Aperçu | **2** : Destinataire · panneau Aperçu / Liste (segmenté) avec 3 icônes (nouveau document, imprimer, réglages) |
| Destinataire vide | Bandeau ambre « Aucun destinataire » + « Ajouter depuis le bottin » qui déplie une liste | Champ de recherche « Nom, adresse, téléphone, télécopie » + icône carte, filtres `5 km ▾` `Toutes les bannières ▾`, **cartes de pharmacies à proximité** (avatar lettre, ♡, adresse, ☎, 📠, distance, `+`). Icône bottin en haut à droite |
| Destinataire choisi | Carte compacte, canaux en boutons-icônes (fax / courriel) | Carte avec avatar, **★ (pharmacie favorite au dossier)**, ♡, ✕, puis **une ligne par canal à cocher** (Fax ☑ grisé, Courriel ☐ ; ou PrescribeIT ☑ seul) |
| Pied | `Transmettre le document prêt` + `Tout transmettre (N)` | Gauche : `✎ Compléter l'ordonnance` (tonal) + `➤ Transmettre l'ordonnance` (filled). Droite : `‹ Document précédent` `› Document suivant` + `➤` (icône) |
| Après transmission | Toast « Document transmis ». Retour à la revue, ou fermeture s'il ne reste rien (`afterTransmit`) | Toast en 3 états (en cours, succès, erreur), puis document suivant ou retour à la note |
| Aperçu | Aperçu papier, ⛶ plein écran | Aperçu papier au format ordonnance réelle (prescripteur, patient, créatinine, ℞, date, « Fin de l'ordonnance ») |

---

## 3. Lots proposés (ordre d'exécution)

Chaque lot se termine par une vérification au navigateur à 1440×900 et une capture.

1. **Coquille** : surface en modale à marges, onglets d'en-tête, bandeau patient, grand titre + badge `Complétée`, pied à deux groupes. Retirer les actions de l'en-tête du document.
2. **Sidebar** : catégories par type avec compteur, `+` dans l'en-tête, icônes de statut (⚠ / ✓ / ✓✓ + infobulle), item transmis grisé, sort de l'item Note (Q3).
3. **Destinataire** : recherche + filtres + cartes à proximité, carte choisie avec ★ et canaux à cocher, préremplissage de la pharmacie favorite au dossier (données fictives dans `crds-data.js` ou `editor-data.jsx`).
4. **Aperçu / Liste** : passage à 2 colonnes. La colonne Contenu devient l'onglet « Liste » (Q15). Icônes du panneau.
5. **Navigation et fin de transmission** : précédent / suivant, toasts « en cours » puis succès ou erreur (le tweak « Simuler un échec » existant pilote l'erreur), enchaînement vers le document suivant ou fermeture.
6. **Fin** : i18n FR + EN (`i18n/fr.js`, `en.js`, `catalog.json`), tests purs touchés (`buildTransmissionDocs`, groupes), entrées RA / D / Q et journal dans `Note Clinique.notes.md`, mise à jour de `PLAN-checkout-v7.md` (sections remplacées).

Fichiers touchés : `note-ui/TransmissionModal.jsx`, `note-ui/DocumentActionPanel.jsx`, `note-ui/Toast.jsx` (état « en cours »), données de pharmacies, i18n, `Note Clinique.html` (tweaks). `QuickSendModal` n'est pas touché, sauf décision contraire (Q17).

---

## 4. Questions de design

### Réponses d'Ignacio Calvo (2026-10-29)

- **Q1** : la maquette **remplace V7** pour le checkout complet, partout où les deux se contredisent. Le lot 6 met `PLAN-checkout-v7.md` à jour.
- **Q2** : erreur de maquette. « Transmettre » reste désactivé tant que le document n'est pas complété.
- **Q3** : la complétion de la note **sort du checkout**. Elle se fait depuis l'éditeur, et le checkout ne traite que les documents. « Copie de note » reste une catégorie de document (copie de la note à transmettre), à 0 par défaut.
- **Q4** : les pharmacies à proximité sont le **comportement de base**. Le tweak `checkoutSuggestions` ne garde que les suggestions ✨.

**Nouvelle question ouverte, Q18 (suite de Q3)** : aujourd'hui, « Finaliser » ouvre le checkout sur l'item Note (faire-suivre, signature, « Compléter la note »). Où vont le faire-suivre et la signature ? Et que fait « Finaliser » ? *Choix par défaut :* « Finaliser » ouvre un petit dialogue dans l'éditeur (faire-suivre + signature + « Compléter la note »). Une fois la note complétée, le checkout s'ouvre s'il reste des documents à transmettre.

### Toutes les questions

Les quatre premières bloquaient le lot 1 ou le lot 2. Pour les autres, le **choix par défaut** est celui que j'appliquerai sans réponse.

| # | Question | Pourquoi ça bloque | Choix par défaut |
|---|---|---|---|
| Q1 | Cette maquette **remplace-t-elle V7** pour le checkout complet ? (colonne Contenu à sections, Pièces jointes, suggestions ✨ sous tweak, catégories vides cachées) | Elle contredit V7 §B3, §B4, §B5 | — à trancher |
| Q2 | « Transmettre » est **actif avant « Compléter »** sur l'écran Pharmacie favorite. Faut-il lire « Transmettre » comme « compléter et transmettre » en un clic ? Ou est-ce une erreur de la maquette ? | Change la logique des deux boutons | — à trancher |
| Q3 | L'item Note (« Faire suivre et signer », « Compléter la note ») disparaît. Où vont le faire-suivre, la signature et « Compléter la note » ? Que veut dire « Copie de note 0 » ? | Seul chemin actuel pour finaliser la note | — à trancher |
| Q4 | La liste de **pharmacies à proximité** fait-elle partie du comportement de base ? Ou est-ce une suggestion, cachée derrière le tweak `checkoutSuggestions` ? | V7 §B4 met toute suggestion derrière un tweak désactivé | — à trancher |
| Q5 | Catégories de la sidebar : on adopte les 8 de la maquette, vides comprises ? Où vont les **Consignes**, absentes de la maquette ? | Contredit `TX_SIDE_GROUPS` et la décision du 2026-09-30 | 8 catégories, vides affichées ; Consignes ajoutée en 9ᵉ |
| Q6 | ★ et ♡ : ★ = pharmacie favorite **du patient** au dossier, ♡ = favori **du clinicien** ? | Deux icônes, sens non écrit | Oui, ce sens-là |
| Q7 | Canaux : « Fax » coché et grisé veut-il dire canal obligatoire ? PrescribeIT **remplace-t-il** fax et courriel pour une pharmacie PrescribeIT ? (les deux écrans s'appellent « Non prescribeit ») | Logique des cases | Le premier canal est obligatoire et grisé ; PrescribeIT seul quand la pharmacie l'accepte |
| Q8 | Les filtres `5 km` et `Toutes les bannières` et l'icône carte doivent-ils fonctionner ? | Effort | Filtres fonctionnels sur des données fictives ; l'icône carte affiche un toast « à venir » |
| Q9 | Le `➤` seul en bas à droite = « Tout transmettre » ? « Transmettre le document prêt » disparaît ? | Pied | Oui, avec l'infobulle « Tout transmettre (N) » |
| Q10 | Onglets **Portail patient** et **Pré-facturation** : affichés seulement, ou cliquables avec des écrans à concevoir ? | Effort | Affichés, non cliquables (toast « à venir ») |
| Q11 | Bandeau patient complet dans le checkout : on garde ses 7 boutons-icônes ? | Bruit visuel dans une modale | Affichés, inertes |
| Q12 | Surface : modale à marges (maquette) ou bottom sheet avec `sheet-up` (V7 §A.1 l'a gardée) ? | Contredit V7 §A.1 | Modale à marges, en gardant l'animation `sheet-up` |
| Q13 | Après une transmission, s'il reste des documents : passage automatique au suivant, ou question à l'utilisateur ? | Le losange ne dit pas qui décide | Passage automatique au suivant non transmis ; fermeture s'il ne reste rien (comme aujourd'hui) |
| Q14 | Toasts : on simule « en cours » (~1,5 s) puis « succès » ? | Nouvel état | Oui |
| Q15 | L'onglet **Liste** de l'aperçu reprend-il l'ancienne colonne Contenu (prescriptions, pièces jointes) ? | Seul endroit où la colonne peut aller | Oui |
| Q16 | Bouton gauche selon le type : « Compléter l'ordonnance » pour l'ordonnance, « Signer le document » pour les autres ? Le libellé « Transmettre l'ordonnance » sur l'écran FSC est-il un oubli ? | Libellés par type | « Compléter » pour l'ordonnance, « Signer » pour les requêtes, « Transmettre le document » générique |
| Q17 | L'envoi rapide (`QuickSendModal`) suit-il la même carte destinataire (★, canaux à cocher) ? | Cohérence | Oui pour la carte, sans le reste |
