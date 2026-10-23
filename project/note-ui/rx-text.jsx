// Ce qu'une ordonnance dit de sa forme et de sa durée, selon la langue —
// PLAN-bilingue-fr-en.md, lot A1.
//
// Dans les données d'une ordonnance, `form` ('comprimé', 'gélule', 'aérosol-doseur',
// 'capsule'…) et `durationUnit` ('jours', 'semaines', 'mois') sont des CODES,
// écrits en français par héritage : ils ne sont jamais traduits (ni par L(), ni
// par la piste B) et ne se comparent jamais à ce qui s'affiche. Ce fichier est le
// seul endroit qui les lit pour produire du texte ; avant lui, la même chaîne de
// `d.form === 'comprimé' ? 'comp.' : …` était recopiée dans editor-data,
// editor-schema et NoteEditor.
//
// Ce que le médecin tape (« 3 jours », « 2 weeks ») est du texte, pas un code :
// les lecteurs ci-dessous acceptent les mots des deux langues et rendent un code.
(function (window) {
  // Abréviation de la forme : « 2 comp. », « 2 inh ». Les clés passent par tk()
  // pour que l'extraction les voie.
  var FORM_ABBR = {
    'comprimé': tk('rx.qty.tablet'),
    'aérosol-doseur': tk('rx.qty.inhaler'),
    'gélule': tk('rx.qty.gelcap'),
    'capsule': tk('rx.qty.capsule')
  };
  var FORM_ABBR_DEFAULT = tk('rx.qty.dose');

  // Unité de durée → entrée de pluriel (« 1 semaine », « 2 semaines »).
  var UNIT_WORD = {
    jours: tk('rx.duration.days'),
    semaines: tk('rx.duration.weeks'),
    mois: tk('rx.duration.months')
  };

  // Nombre d'unités par prise : celui de la modale « Dose », sinon 1 (2 pour un aérosol-doseur).
  function qtyPerDose(d) {
    if (d.qtyDose && /^\d/.test(String(d.qtyDose))) return String(d.qtyDose);
    return d.form === 'aérosol-doseur' ? '2' : '1';
  }

  // « 2 comp. », « 1 inh » — la quantité par prise suivie de l'abréviation de la forme.
  function qtyLabel(d) {
    return qtyPerDose(d) + ' ' + t(FORM_ABBR[d.form] || FORM_ABBR_DEFAULT);
  }

  // 'jour', 'Days', 'semaines', 'weeks', 'mois', 'months' → 'jours' | 'semaines' | 'mois' ; sinon null.
  function unitCode(word) {
    var w = String(word == null ? '' : word).trim().toLowerCase();
    if (/^(jours?|days?)$/.test(w)) return 'jours';
    if (/^(semaines?|weeks?)$/.test(w)) return 'semaines';
    if (/^(mois|months?)$/.test(w)) return 'mois';
    return null;
  }

  // Unité écrite à la suite d'une durée : « 1 semaine », « 2 semaines ». Un code
  // inconnu (texte libre) est rendu tel quel ; vide veut dire des jours.
  function unitText(unit, duration) {
    var code = unit ? unitCode(unit) : 'jours';
    if (!code) return unit;
    var n = Number(duration);
    return tn(UNIT_WORD[code], isNaN(n) ? 2 : n);
  }

  // « 7 jours », « 1 semaine » (étiquette de l'ordonnance).
  function durationLong(d) {
    return d.duration + ' ' + unitText(d.durationUnit, d.duration);
  }

  // « 7j », « 2 semaines » (puce) : les jours s'abrègent, le reste s'écrit.
  function durationShort(d) {
    var days = !d.durationUnit || unitCode(d.durationUnit) === 'jours';
    return d.duration + (days ? t('rx.duration.days.short') : ' ' + unitText(d.durationUnit, d.duration));
  }

  // « long terme » / « long-term » : pas de durée, un renouvellement seulement.
  function isLongTerm(text) {
    return /^long[- ]term/i.test(String(text).trim());
  }

  // Champ « Durée / Renouvellements » : « 30 jours R2 », « 2 weeks », « 14 jours ».
  // → { duration, unit (code), refills ('' si absent) } ou null.
  function parseDurationRefills(text) {
    var m = /^(\d+)\s*(jours?|days?|semaines?|weeks?|mois|months?)(?:\s+R(\d+))?$/i.exec(String(text).trim());
    if (!m) return null;
    return { duration: m[1], unit: unitCode(m[2]), refills: m[3] === undefined ? '' : m[3] };
  }

  // Champ « Durée » : un nombre, puis une unité facultative (« 3 », « 3 mois », « 1 an »).
  // → { duration, unit (code ou '' si absente) } ou null. Un an est rangé en mois,
  // sans conversion du nombre (comportement d'origine, conservé tel quel).
  function parseDuration(text) {
    var m = /^(\d+)\s*(jours?|days?|semaines?|weeks?|mois|months?|ans?|années?s?|years?)?/i.exec(String(text).trim());
    if (!m) return null;
    var unit = '';
    if (m[2]) unit = /^(ans?|années?s?|years?)$/i.test(m[2]) ? 'mois' : unitCode(m[2]);
    return { duration: m[1], unit: unit };
  }

  window.RX_TEXT = {
    qtyPerDose: qtyPerDose, qtyLabel: qtyLabel, unitCode: unitCode, unitText: unitText,
    durationLong: durationLong, durationShort: durationShort,
    isLongTerm: isLongTerm, parseDurationRefills: parseDurationRefills, parseDuration: parseDuration
  };
})(window);
