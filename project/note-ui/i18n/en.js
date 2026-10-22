// Interface en anglais canadien : traduction automatique, sans relecture humaine
// (PLAN-bilingue-fr-en.md, piste B, lot B1). Mêmes clés que fr.js. Une clé
// absente d'ici affiche le français. Le texte français d'origine est fixé dans
// note-ui/i18n/en.lock.json : si fr.js change, la clé est à retraduire.
(window.I18N_DICT = window.I18N_DICT || {}).en = {
  // Filets de sécurité du chargement (Note Clinique.html)
  'app.error.title': 'The prototype encountered an error',
  'app.error.hint': 'Reload the page. If the problem persists, open the console (F12) and report the message above.',
  'app.tiptap.title': 'The prototype could not load Tiptap',
  'app.tiptap.text': 'Error loading Tiptap.',
  'app.tiptap.hint': 'Check your internet connection (esm.sh) and reload the page.',

  // Pastilles du pied de note : un libellé par sorte de document
  'document.kind.prescription': 'Order',
  'document.kind.clinicalTool': 'Clinical tools',
  'document.kind.lab': 'Laboratory',
  'document.kind.imaging': 'Imaging',
  'document.kind.referral': 'Referral',
  'document.kind.instructions': 'Patient instructions'
};
