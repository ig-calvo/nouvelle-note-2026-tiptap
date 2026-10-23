// Texte du dictionnaire avec un peu de mise en forme : une phrase entière, où le
// gras et le saut de ligne se marquent par <strong>…</strong> et <br> dans le texte
// lui-même, pour que la traduction décide où tombe le gras (l'ordre des mots change
// d'une langue à l'autre). Rien d'autre que ces deux balises n'est reconnu.
//
//   tRich('clinicalTool.note.text')  →  ['Si présence d’', <strong>au moins 2 signes</strong>, ' …']
(function (window) {
  function rich(text) {
    return String(text).split(/(<strong>[\s\S]*?<\/strong>|<br\s*\/?>)/).map(function (part, i) {
      if (/^<strong>/.test(part)) return React.createElement('strong', { key: i }, part.slice(8, -9));
      if (/^<br/.test(part)) return React.createElement('br', { key: i });
      return part;
    });
  }
  window.I18N.rich = rich;
  window.tRich = function (key, values) { return rich(window.t(key, values)); };
})(window);
