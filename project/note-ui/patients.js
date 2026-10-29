// Patiente du prototype (tweak « Patiente », PLAN-reference-specialite.md, D3).
// Deux dossiers fictifs :
//   - 'pediatrique' : Geneviève Tremblay, 15 ans — le dossier d'origine ;
//   - 'adulte' (défaut) : Micheline Lamontagne, 47 ans, migraine — l'exemple du Figma
//     « Demande de consultation en médecine spécialisée ».
// Un script classique, lu avant les données (editor-data.jsx, diagnostics.jsx,
// Summary.jsx…), qui le lisent à leur évaluation par forPatient(). Changer de
// patiente recharge donc la page, comme le changement de langue : la note en
// cours et le journal ne passent jamais d'un dossier à l'autre.
// Ordre de lecture : ?patient= dans l'URL, puis le tweak mémorisé (même clé
// que tweaks-panel.jsx, __TWK_KEY), puis le défaut.
(function () {
  var KEYS = ['pediatrique', 'adulte'];
  function read() {
    try {
      var q = new URLSearchParams(window.location.search).get('patient');
      if (KEYS.indexOf(q) >= 0) return q;
    } catch (e) { /* pas d'URL (tests) */ }
    try {
      var o = JSON.parse(localStorage.getItem('omd-tweaks:' + location.pathname) || '{}') || {};
      if (KEYS.indexOf(o.patient) >= 0) return o.patient;
    } catch (e) { /* stockage indisponible */ }
    return 'adulte';
  }
  if (KEYS.indexOf(window.PATIENT_KEY) < 0) window.PATIENT_KEY = read();
  window.PATIENT_KEYS = KEYS;
  // La valeur de la patiente active dans { pediatrique, adulte } ; le dossier
  // pédiatrique sert de repli quand une donnée n'a pas de variante.
  window.forPatient = function (byPatient) {
    return Object.prototype.hasOwnProperty.call(byPatient, window.PATIENT_KEY) ? byPatient[window.PATIENT_KEY] : byPatient.pediatrique;
  };
})();
