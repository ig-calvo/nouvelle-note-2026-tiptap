// Couche de traduction du prototype — PLAN-bilingue-fr-en.md, lot A0.
//
// Script classique (ni JSX ni module), chargé AVANT tous les autres : il choisit
// la langue, fixe <html lang> et publie `window.I18N` ainsi que les raccourcis
// `t`, `tn`, `L` et `tk`. Les dictionnaires arrivent après, par leurs propres
// fichiers, et sont lus à l'appel (jamais à l'évaluation de ce fichier) :
//
//   note-ui/i18n/fr.js       window.I18N_DICT.fr   interface, français (piste A)
//   note-ui/i18n/en.js       window.I18N_DICT.en   interface, anglais (piste B)
//   note-ui/i18n/data-en.js  window.I18N_DATA.en   « texte français → anglais »
//
// Règle de repli : un texte sans traduction affiche le français. Le prototype
// fonctionne donc avec ou sans les fichiers anglais.
//
// Pas de `lang` dans l'état de React : la langue change par rechargement de la
// page (`?lang=en` / `?lang=fr`, mémorisée dans le navigateur), jamais en cours
// de route. Un `t()` évalué une fois au chargement d'un module reste donc juste.
(function (global) {
  'use strict';

  var DEFAULT_LANG = 'fr';
  // Anglais canadien (décision du 2026-10-22). `Intl` et <html lang> s'en servent.
  var LOCALES = { fr: 'fr-CA', en: 'en-CA' };
  var STORAGE_KEY = 'omnimed-note-lang';
  var has = Object.prototype.hasOwnProperty;

  // 'en', 'EN', 'en-CA', 'fr_CA' → 'en' / 'fr'. Tout le reste → null.
  function normalize(value) {
    var m = /^(fr|en)(?:[-_]|$)/i.exec(String(value == null ? '' : value).trim());
    return m ? m[1].toLowerCase() : null;
  }

  // Le paramètre d'adresse prime sur la langue mémorisée, qui prime sur le français.
  function resolveLang(search, stored) {
    var fromUrl = null;
    try { fromUrl = normalize(new URLSearchParams(search || '').get('lang')); } catch (err) { /* adresse illisible */ }
    return { lang: fromUrl || normalize(stored) || DEFAULT_LANG, fromUrl: fromUrl };
  }

  // Remplace {nom} par values.nom ; sans valeur correspondante, le {nom} reste
  // visible (une erreur qui se voit vaut mieux qu'un trou silencieux).
  function fill(text, values) {
    if (!values || typeof text !== 'string') return text;
    return text.replace(/\{(\w+)\}/g, function (whole, name) {
      return has.call(values, name) && values[name] != null ? String(values[name]) : whole;
    });
  }

  // Fabrique indépendante de `window` : les tests en créent une par langue.
  //   opts.lang  'fr' | 'en'
  //   opts.dict  { fr: {clé: texte | {one, other}}, en: {…} } — ou une fonction qui le renvoie
  //   opts.data  { en: {'texte français': 'English text'} }   — ou une fonction
  function create(opts) {
    var lang = has.call(LOCALES, opts && opts.lang) ? opts.lang : DEFAULT_LANG;
    var getDict = typeof (opts && opts.dict) === 'function' ? opts.dict : function () { return (opts && opts.dict) || {}; };
    var getData = typeof (opts && opts.data) === 'function' ? opts.data : function () { return (opts && opts.data) || {}; };
    var missing = {}; // clés et textes sans traduction, pour les tests et le débogage
    var rules = {};

    function category(forLang, n) {
      try {
        rules[forLang] = rules[forLang] || new Intl.PluralRules(LOCALES[forLang]);
        return rules[forLang].select(n);
      } catch (err) {
        return n === 1 ? 'one' : 'other';
      }
    }

    // { entry, from } — `from` sert aux pluriels : une entrée qui retombe sur le
    // français s'accorde selon les règles du français, pas de l'anglais.
    function find(key) {
      var dict = getDict() || {};
      if (dict[lang] && has.call(dict[lang], key)) return { entry: dict[lang][key], from: lang };
      if (lang !== DEFAULT_LANG && dict[DEFAULT_LANG] && has.call(dict[DEFAULT_LANG], key)) {
        return { entry: dict[DEFAULT_LANG][key], from: DEFAULT_LANG };
      }
      return null;
    }

    // Texte de l'interface : t('ordonnance.titre'), t('toast.envoye', { dest: 'Jean-Coutu' })
    function t(key, values) {
      var found = find(key);
      if (!found) { missing[key] = true; return key; }
      var text = typeof found.entry === 'string' ? found.entry : found.entry.other;
      return fill(text, values);
    }

    // Texte accordé selon un nombre : tn('ordonnance.nb', 2) → « 2 ordonnances ».
    // L'entrée est { one: '{n} ordonnance', other: '{n} ordonnances' } ; {n} est
    // fourni, tel quel (String(n)), sans séparateur de milliers.
    function tn(key, n, values) {
      var found = find(key);
      if (!found) { missing[key] = true; return key; }
      var text = found.entry;
      if (typeof text !== 'string') {
        var cat = category(found.from, n);
        text = has.call(text, cat) ? text[cat] : text.other;
      }
      var all = { n: n };
      if (values) for (var k in values) if (has.call(values, k)) all[k] = values[k];
      return fill(text, all);
    }

    // Texte de démonstration (patient, médicaments, gabarits…) : le français sert
    // de clé. L('Amoxicilline') → 'Amoxicillin' en anglais s'il existe dans
    // data-en.js, sinon le français. Une valeur qui n'est pas du texte passe telle quelle.
    function L(text, values) {
      if (typeof text !== 'string') return text;
      var out = text;
      if (lang !== DEFAULT_LANG) {
        var table = (getData() || {})[lang];
        if (table && has.call(table, text)) out = table[text];
        else missing[text] = true;
      }
      return fill(out, values);
    }

    // L'autre langue d'un texte de démonstration, pour que la recherche trouve un
    // produit par son nom français ou anglais : en anglais, le français d'origine
    // (table inversée) ; en français, l'anglais s'il est chargé. Sans traduction
    // connue, le texte lui-même.
    var reverse = null, reverseOf = null;
    function other(text) {
      if (typeof text !== 'string') return text;
      var table = (getData() || {}).en;
      if (!table) return text;
      if (lang === DEFAULT_LANG) return has.call(table, text) ? table[text] : text;
      if (reverseOf !== table) {
        reverse = {};
        for (var k in table) if (has.call(table, k) && !has.call(reverse, table[k])) reverse[table[k]] = k;
        reverseOf = table;
      }
      return has.call(reverse, text) ? reverse[text] : text;
    }

    // Marque une clé construite à part (tables de codes → libellés) pour que
    // l'extraction la voie : { cesse: tk('statut.cesse') }, puis t(table[code]).
    function tk(key) { return key; }

    return { lang: lang, locale: LOCALES[lang], t: t, tn: tn, L: L, tk: tk, other: other, missing: missing };
  }

  function safeStorage() {
    try { return global.localStorage || null; } catch (err) { return null; }
  }

  // --- installation sur la page (rien de tout ça sans `window`, ex. dans les tests) ---
  var storage = safeStorage();
  var stored = null;
  try { stored = storage && storage.getItem(STORAGE_KEY); } catch (err) { /* données de site bloquées */ }
  var resolved = resolveLang(global.location && global.location.search, stored);
  if (resolved.fromUrl) {
    try { storage && storage.setItem(STORAGE_KEY, resolved.fromUrl); } catch (err) { /* idem */ }
  }
  if (global.document && global.document.documentElement) {
    global.document.documentElement.lang = LOCALES[resolved.lang];
  }

  var api = create({
    lang: resolved.lang,
    dict: function () { return global.I18N_DICT; },
    data: function () { return global.I18N_DATA; }
  });
  // Adresse de la même page dans une autre langue : `?lang=` posé ou remplacé, le reste
  // de l'adresse (autres paramètres, #ancre) intact. Un sélecteur de langue n'a plus
  // qu'à y aller : le choix se mémorise tout seul au chargement (voir plus haut).
  api.urlFor = function (lang, href) {
    var url = new URL(href);
    url.searchParams.set('lang', normalize(lang) || DEFAULT_LANG);
    return url.toString();
  };
  api.create = create;
  api.resolveLang = resolveLang;
  api.LOCALES = LOCALES;
  api.DEFAULT_LANG = DEFAULT_LANG;
  api.STORAGE_KEY = STORAGE_KEY;

  global.I18N = api;
  global.t = api.t;
  global.tn = api.tn;
  global.L = api.L;
  global.tk = api.tk;
})(typeof window !== 'undefined' ? window : globalThis);
