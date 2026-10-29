# Relecture des textes rapides — contenu clinique et anglais

Relecture du 2026-10-29, faite par Claude. Elle porte sur les 23 textes rapides de `QUICK_TEXTS` et sur les produits du catalogue qu'ils utilisent ([editor-data.jsx](project/note-ui/editor-data.jsx)).

**Ce n'est pas une validation clinique.** Claude n'est pas clinicien. Les sources consultées sont surtout des résumés secondaires : les documents primaires (INESSS, CTS, AMMI) n'ont pas été ouverts. **Il faut une relecture par un médecin avant toute démo** (Q8 du plan).

Registres utilisés (voir les consignes Omnimed) :

- **Sourcé** : lu cette session dans la source.
- **Formation** : vient de la formation de Claude, sans vérification.
- **Partiel** : précise ce qui n'a pas été vu.

## 1. Corrigé dans cette relecture

| Texte | Avant | Après | Base |
|---|---|---|---|
| HTA — suivi | « Cible : PA inférieure à 130/80 » | « PA systolique inférieure à 130 mm Hg, si bien tolérée » | Sourcé, partiel : résumé de la ligne directrice 2025 de Hypertension Canada (CMAJ 2025;197:e549). Cible systolique unique, pas de cible diastolique. Texte intégral non lu. |
| Exacerbation de MPOC (2 textes) | Prednisone 50 mg × 5 j | Prednisone 40 mg par jour × 5 j (8 comprimés de 5 mg) | Sourcé, partiel : GOLD et l'essai REDUCE (40 mg, 5 jours). Position exacte de la CTS non trouvée. |
| Influenza | Antiviral « si risque de complications et moins de 48 h » | « si risque de complications, même après 48 h » | Sourcé, partiel : les résumés AMMI disent que la limite de 48 h vaut pour les patients sans risque ; chez les patients à risque, on traite quand même. Document AMMI 2019 non lu. |
| Otite | Puce « 7 j, #21 », alors que le texte dit 5 ou 10 jours | Puce « 5 j, #15 », cohérente avec le texte pour 2 ans et plus | Incohérence interne. 5 jours à partir de 2 ans, 10 jours avant : sourcé, partiel (Canadian Family Physician 2017, HAS 2024). |
| Pharyngite | Puce « 1 comp. » pour 600 mg | « 2 comp. » (2 × 300 mg), cohérent avec #40 sur 10 jours | Incohérence interne |
| Asthme — palier 2 | Puce « 2 inh » de Fluticasone/Salmeterol 250/50 | « 1 inh » | Formation : la dose 250/50 existe en poudre sèche, 1 inhalation BID |
| Sinusite | « Fluticasone (nasal) 50 mcg/vap. » | « 50 mcg » | « vap. » restait en français dans l'interface anglaise |
| Oseltamivir (catalogue) | « Commencer dans les 48 h » | « Dès que possible, idéalement dans les 48 h » | Cohérent avec la ligne Influenza |

## 2. À trancher par un clinicien

1. **Asthme léger : salbutamol seul.** La CTS 2021 réserve le BACA seul au besoin aux asthmes très légers, bien maîtrisés et sans risque d'exacerbation. Sinon, elle recommande un CSI quotidien, ou le budésonide-formotérol au besoin à partir de 12 ans. Sourcé, partiel : commentaires de la ligne directrice, texte non lu. Le texte « Asthme léger » ne propose que le salbutamol. Faut-il le changer ? Si oui, le budésonide-formotérol n'est pas au catalogue.
2. **« Asthme — palier 2 » avec un CSI + BALA à dose moyenne.** Le palier 2 de la CTS correspond à un CSI à faible dose. Le nom ou le contenu de ce texte simulé est à revoir.
3. **Sinusite : amoxicilline 1 g TID × 5 j.** Les doses trouvées vont de 500 mg TID à 1 g TID, sur 5 à 10 jours (HAS : 3 g par jour × 7 j ; MSF : 1 g TID × 7 à 10 j). Le guide de l'INESSS n'a pas été trouvé. Quelle durée retenir ?
4. **Azithromycine (PAC avec comorbidités, otite, pharyngite).** La puce affiche « 1 comp. DIE #6 », alors que le 1er jour est à 2 comprimés. La dose de charge n'est que dans les notes du produit. Faut-il le dire dans le texte ?
5. **Otite et pharyngite chez l'enfant.** Les puces portent des doses d'adulte. Chez l'enfant, la dose se calcule au poids (par exemple, amoxicilline 75 à 90 mg/kg/jour en 2 prises ; sourcé, partiel). Les deux patientes de démo ont 15 ans et l'âge adulte. Faut-il des variantes pédiatriques ?
6. **Otite chez l'allergique : azithromycine.** Formation : dans une allergie à la pénicilline sans réaction grave, une céphalosporine (céfuroxime, cefprozil) est souvent préférée. Elle n'est pas au catalogue.
7. **Pyélonéphrite chez l'allergique aux sulfamides.** Il n'y a pas de variante sans TMP-SMX (la ciprofloxacine, par exemple).
8. **Acétaminophène 500 mg, 1 comprimé QID au besoin.** La posologie du catalogue est « 1 à 2 comp. ». La puce affiche 1 comprimé ; pour la fièvre et la douleur de l'adulte, 2 comprimés sont souvent visés.

## 3. Anglais

Revu et corrigé ([data-en.js](project/note-ui/i18n/data-en.js), textes rapides seulement) :

- « Seek care if short of breath, confused, or fever beyond 72 h » → « Return if shortness of breath, confusion or fever lasting more than 72 h » (parallélisme, tournure clinique usuelle). Même correction dans les autres textes.
- « Bronchodilator as needed » → « Reliever as needed » (terme des lignes directrices canadiennes sur l'asthme). « Nasal corticosteroid » → « Intranasal corticosteroid ». « Saline nasal rinse » → « Saline nasal irrigation ».
- « CRB-65 of 0 » → « CRB-65 score 0 » ; « rapid test positive » → « positive rapid strep test » ; « Edge of redness » → « Margin of erythema » ; « shingles » → « herpes zoster (shingles) ».
- « Duration: 10 days under 2 years, 5 days after » → « 10 days if under 2 years old, 5 days if 2 or older ».
- Noms : « Otitis, penicillin allergy » → « Otitis media, penicillin allergy » ; « Pharyngitis, penicillin allergy » → « Strep pharyngitis, penicillin allergy ».

Laissé tel quel : ce sont des choix de l'application, pas des textes rapides, et ils touchent tout le prototype.

- **« DIE »** dans les posologies anglaises : abréviation québécoise. En anglais, on attend « daily » ou « OD ». Les fréquences sont des codes français partagés par tout le prototype (`FIELD_OPTIONS`).
- **« Inhalé »** comme voie dans une puce anglaise (Fluticasone/Salmeterol) : les voies ne sont pas traduites.
- **« gel cap »** pour « gélule » : « cap. » serait plus naturel (clé `rx.qty.gelcap`).
- **« Ventolin 100mcg », « Amoxicilline 500mg »** : il manque l'espace avant l'unité (données `RX_ITEMS`).
- **Noms français sans accents** dans le catalogue (« Acetaminophene », « Cephalexine », « Nitrofurantoine ») : ils viennent de `medicaments.json`.
