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
  'document.kind.instructions': 'Consignes au patient'
};
