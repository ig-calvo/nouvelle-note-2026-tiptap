// Interface en français — la source de vérité du texte (PLAN-bilingue-fr-en.md,
// piste A). Une clé = un texte entier : jamais de morceaux à recoller, les
// valeurs variables sont des {noms}, un pluriel est { one, other } (lu par tn()).
//
// Clés : domaine.élément.rôle, le rôle fermant la clé (title, label, button,
// hint, tooltip, aria, placeholder, toast, error, empty, menu, heading, text) :
// `tools/i18n-extract.mjs` s'en sert pour dire au traducteur où le texte
// s'affiche. Fichier lu par tests/i18n.test.mjs : toute clé doit être utilisée.
(window.I18N_DICT = window.I18N_DICT || {}).fr = {
  // Filets de sécurité du chargement (Note Clinique.html)
  'app.error.title': 'Le prototype a rencontré une erreur',
  'app.error.hint': 'Rechargez la page. Si le problème persiste, ouvrez la console (F12) et signalez le message ci-dessus.',
  'app.tiptap.title': 'Le prototype n’a pas pu charger Tiptap',
  'app.tiptap.text': 'Erreur de chargement de Tiptap.',
  'app.tiptap.hint': 'Vérifiez votre connexion internet (esm.sh) et rechargez la page.',

  // Pastilles du pied de note : un libellé par sorte de document
  'document.kind.prescription': 'Ordonnance',
  'document.kind.clinicalTool': 'Outils cliniques',
  'document.kind.lab': 'Laboratoire',
  'document.kind.imaging': 'Imagerie',
  'document.kind.referral': 'Référence',
  'document.kind.instructions': 'Consignes au patient',
  // Nom de la source des propositions de l'IA : comparé à `proposedBy`, donc
  // toujours lu par t() des deux côtés (jamais recopié en dur)
  'ai.assistant.name': 'Assistant IA',

  // Ordonnance : forme et durée (rx-text.jsx)
  'rx.qty.tablet': 'comp.',
  'rx.qty.inhaler': 'inh',
  'rx.qty.gelcap': 'gél',
  'rx.qty.capsule': 'caps.',
  'rx.qty.dose': 'dose',
  'rx.duration.days': { one: 'jour', other: 'jours' },
  'rx.duration.weeks': { one: 'semaine', other: 'semaines' },
  'rx.duration.months': { one: 'mois', other: 'mois' },
  'rx.duration.days.short': 'j',
  'rx.adjust.up.title': 'Dose augmentée',
  'rx.adjust.down.title': 'Dose diminuée',

  // Valeurs à code : le code est gardé et comparé, seul le libellé suit la langue
  'visit.type.clinic': 'Visite en clinique',
  'visit.type.phone': 'Appel téléphonique',
  'visit.type.update': 'Mise à jour',
  'result.normality.normal': 'Normal',
  'result.normality.abnormal': 'Anormal',
  'result.normality.borderline': 'Limite',

  // Dates et phrases à valeurs : la phrase entière, jamais recollée
  'date.atTime': '{date} à {time}',
  'date.numeric': '{day}/{month}/{year}',
  'common.labelValue.text': '{label} : {value}',
  'common.and.text': '{a} et {b}',

  // Pluriels (tn)
  'document.pill.aria': { one: '{kind} : {n} sur {total} complété', other: '{kind} : {n} sur {total} complétés' },
  'portal.pill.label': { one: 'Portail patient : {n} élément partagé', other: 'Portail patient : {n} éléments partagés' },
  'noteStart.drafts.label': { one: 'Brouillon', other: '{n} brouillons' },
  'quickSend.summary.text': { one: '1 document · {n} destination', other: '1 document · {n} destinations' },
  'transmission.pending.hint': {
    one: 'Cette note contient {n} document non transmis ({titles}) — sélectionnez-les dans la liste à gauche pour les compléter.',
    other: 'Cette note contient {n} documents non transmis ({titles}) — sélectionnez-les dans la liste à gauche pour les compléter.'
  },
  'transmission.sent.toast': { one: '{n} document transmis', other: '{n} documents transmis' },
  'transmission.ready.label': { one: '{n} document prêt à transmettre', other: '{n} documents prêts à transmettre' },
  'transmission.prescriptions.label': { one: '{n} prescription', other: '{n} prescriptions' },
  'cim10.count.code': { one: '{n} code précis', other: '{n} codes précis' },
  'cim10.count.category': { one: '{n} catégorie', other: '{n} catégories' },
  'cim10.count.block': { one: '{n} bloc', other: '{n} blocs' },
  'field.removeSelection.hint': {
    one: 'La sélection contient un élément ({names}), qui sera retiré de la note.',
    other: 'La sélection contient {n} éléments ({names}), qui seront retirés de la note.'
  },
  'dx.rename.hint': { one: 'Renomme aussi {n} autre mention de ce diagnostic.', other: 'Renomme aussi {n} autres mentions de ce diagnostic.' },
  'review.count.label': { one: '{n} modification', other: '{n} modifications' },
  'review.pending.text': {
    one: 'Il reste {n} modification en révision dans cette note. Que voulez-vous faire avant de compléter ?',
    other: 'Il reste {n} modifications en révision dans cette note. Que voulez-vous faire avant de compléter ?'
  },
  'review.pending.chips.text': { one: '{n} ajout', other: '{n} ajouts' },
  'review.pending.lines.text': { one: '{n} ligne de texte', other: '{n} lignes de texte' },
  'sections.split.empty.aria': 'Conclusion vide',
  'sections.split.lines.aria': { one: '{n} ligne sur {total} dans la conclusion', other: '{n} lignes sur {total} dans la conclusion' },

  // Guillemets : « » avec espaces insécables en français, “ ” en anglais
  'presentation.chapter.aria': 'Chapitre {n} : {label}',
  'template.source.label': 'Gabarit « {name} »',
  'dx.pending.added.text': 'Ajouté par la note en cours',
  'dx.pending.moved.text': 'Déplacé par la note en cours',
  'dx.pending.ceased.text': 'Cessé dans la note en cours',
  'dx.pending.replaces.text': 'Remplace « {name} » (note en cours)',
  'dx.pending.replaced.text': 'Remplacé (note en cours)',
  'dx.pending.codeChanged.text': 'Code modifié par la note en cours',
  'dx.freeText.new.title': 'Nouveau diagnostic : {term}',
  'dx.freeText.replace.title': 'Remplacer par : {term}',
  'dx.freeText.rename.title': 'Renommer : {term}',
  'dx.banner.replace.text': 'Remplacer n° {number} « {name} » par…',
  'dx.banner.edit.text': 'Modifier « {name} »',
  'dx.banner.refine.text': 'Préciser « {name} »',
  'dx.empty.none.text': 'Aucun diagnostic trouvé pour « {term} ».',
  'dx.empty.cim.text': 'Aucun code CIM-10 pour « {term} ».',
  'lab.profileNote.text': 'Depuis le profil « {profile} »',
  'picker.none.text': 'Aucun {noun} trouvé.',
  'picker.noneFor.text': 'Aucun {noun} trouvé pour « {query} ».',
  'clinicalTool.picker.noResult.empty': 'Aucun résultat pour « {query} ».'
};
