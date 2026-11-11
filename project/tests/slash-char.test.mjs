// Caractère du menu des fonctions (RA-56) : « / » par défaut, ou un caractère de
// remplacement (réglage caché Ctrl+0) pour un clavier où le slash est difficile
// à taper (test de la modale de prescription, 2026-11-11, clavier Windows en
// français canadien). Ici, ce que le modèle en lit ; la frappe réelle (le menu
// qui s'ouvre sur « * », « / » qui n'ouvre plus rien) se vérifie dans le
// navigateur.
// Lancer : node --test project/tests/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPrototype } from './harness.mjs';

const w = loadPrototype(['note-ui/note-sections.jsx', 'note-ui/diagnostics.jsx', 'note-ui/editor-data.jsx', 'note-ui/editor-schema.jsx']);
const D = w.NOTE_DATA;
const withChar = (c, fn) => {
  const before = w.__SLASH_CHAR;
  try { w.__SLASH_CHAR = c; return fn(); } finally { w.__SLASH_CHAR = before; }
};

test('par défaut, le menu des fonctions s’ouvre sur « / »', () => {
  assert.equal(D.slashChar(), '/');
  assert.equal(D.SLASH_CHARS[0], '/', '« / » reste le premier choix du réglage');
});

test('le réglage choisit parmi des caractères connus, « # » (gabarits) n’en fait pas partie', () => {
  assert.ok(D.SLASH_CHARS.includes('*'), 'l’étoile, demandée au test de la modale');
  assert.ok(D.SLASH_CHARS.includes('='), 'le signe égal, l’autre solution de rechange demandée (2026-11-11)');
  assert.ok(!D.SLASH_CHARS.includes('#'), '« # » ouvre les gabarits');
  D.SLASH_CHARS.forEach((c) => {
    assert.equal(c.length, 1, 'un seul caractère : les positions des textes en dépendent');
    assert.ok(!/[\p{L}\p{N}\s]/u.test(c), 'ni lettre, ni chiffre, ni espace : le texte de la note ne le déclencherait pas à tort');
  });
});

test('un caractère inconnu, vide ou absent revient à « / »', () => {
  ['', null, undefined, '#', 'a', '**', ' ', 8].forEach((c) => assert.equal(D.normalizeSlashChar(c), '/', String(c)));
  assert.equal(D.normalizeSlashChar('*'), '*');
  assert.equal(D.normalizeSlashChar('='), '=');
});

test('slashChar() suit le réglage posé par l’éditeur', () => {
  assert.equal(withChar('*', () => D.slashChar()), '*');
  assert.equal(withChar(';', () => D.slashChar()), ';');
  assert.equal(withChar('n’importe quoi', () => D.slashChar()), '/');
});

test('la ligne vide de la note nomme le caractère choisi', () => {
  const key = 'noteEditor.appuyerAfficherCommandes.placeholder';
  assert.ok(w.t(key, { char: '*' }).includes('*'));
  assert.ok(w.t(key, { char: '/' }).includes('/'));
  assert.ok(!w.t(key, { char: '*' }).includes('/'));
  assert.ok(w.t(key, { char: '*' }).includes('#'), '« # » ne change pas');
});

// Un faux Tiptap, juste ce que buildSlashExtension touche ; `fn` s'exécute avec
// le faux Tiptap et le caractère `c` en place (le plugin les relit à chaque frappe).
// `fakeMatch` : ce que la recherche de Tiptap « trouve » dans la note.
let fakeMatch = null;
function withPlugins(c, fn) {
  const seen = [];
  const prev = w.Tiptap;
  w.Tiptap = {
    Extension: { create: (cfg) => cfg },
    Suggestion: (opts) => ({ suggestion: opts }),
    findSuggestionMatch: (config) => { seen.push(config); return fakeMatch; },
    pm: {
      Plugin: class { constructor(spec) { this.spec = spec; } },
      PluginKey: class {},
      Decoration: { widget: (pos, f, spec) => ({ pos, spec }), inline: (a, b, spec) => ({ a, b, spec }) },
      DecorationSet: { create: (doc, list) => list }
    }
  };
  try {
    return withChar(c, () => fn(w.buildSlashExtension({}).addProseMirrorPlugins.call({ editor: {} }), seen));
  } finally { w.Tiptap = prev; }
}

test('le plugin « / » cherche son déclencheur avec le caractère du moment, « # » garde le sien', () => {
  withPlugins('*', ([fn, hash], seen) => {
    assert.equal(hash.suggestion.char, '#');
    assert.equal(hash.suggestion.findSuggestionMatch, undefined, '« # » n’est pas remplaçable');
    fn.suggestion.findSuggestionMatch({ char: '/', allowSpaces: true });
    assert.equal(seen.length, 1);
    assert.equal(seen[0].char, '*', 'le caractère de remplacement, pas celui de la création du plugin');
    assert.equal(seen[0].allowSpaces, true, 'le reste de la configuration passe tel quel');
  });
  // Le caractère se relit à chaque frappe : changer le réglage sans recréer l'éditeur.
  withPlugins('/', ([fn], seen) => {
    fn.suggestion.findSuggestionMatch({ char: '/' });
    w.__SLASH_CHAR = ';';
    fn.suggestion.findSuggestionMatch({ char: '/' });
    assert.deepEqual(seen.map((c) => c.char), ['/', ';']);
  });
});

// « TA = 120/80 », « 5 * 3 » : du texte, pas une commande. La commande suit tout
// de suite le caractère de remplacement (« =rx amox »). « / » garde son comportement.
test('un caractère de remplacement suivi d’une espace n’ouvre pas le menu, « / » reste comme avant', () => {
  const found = (query) => ({ range: { from: 3, to: 3 + 1 + query.length }, query, text: '=' + query });
  try {
    ['=', '*', ';'].forEach((c) => withPlugins(c, ([fn]) => {
      fakeMatch = found(' 120/80');
      assert.equal(fn.suggestion.findSuggestionMatch({ char: '/' }), null, c + ' + espace : du texte libre');
      fakeMatch = found('\t120');
      assert.equal(fn.suggestion.findSuggestionMatch({ char: '/' }), null, c + ' + tabulation : idem');
      fakeMatch = found(c + ' surligné');
      assert.equal(fn.suggestion.findSuggestionMatch({ char: '/' }), null, c + c + ' : le caractère doublé n’est pas une commande');
      fakeMatch = found('rx amox');
      assert.equal(fn.suggestion.findSuggestionMatch({ char: '/' }), fakeMatch, c + 'rx amox : la commande, espaces permises plus loin');
      fakeMatch = found('');
      assert.equal(fn.suggestion.findSuggestionMatch({ char: '/' }), fakeMatch, 'le caractère seul (le « + », ou le début de la frappe) ouvre le menu');
      fakeMatch = null;
      assert.equal(fn.suggestion.findSuggestionMatch({ char: '/' }), null, 'rien trouvé : rien');
    }));
    withPlugins('/', ([fn]) => {
      fakeMatch = found(' 120/80');
      assert.equal(fn.suggestion.findSuggestionMatch({ char: '/' }), fakeMatch, '« / » + espace : comportement inchangé');
    });
  } finally { fakeMatch = null; }
});

test('sans la recherche exportée par Tiptap, le plugin retombe sur « / »', () => {
  const prev = w.Tiptap;
  w.Tiptap = {
    Extension: { create: (cfg) => cfg }, Suggestion: (opts) => ({ suggestion: opts }),
    pm: { Plugin: class { constructor(spec) { this.spec = spec; } }, PluginKey: class {} }
  };
  try {
    const [fn] = w.buildSlashExtension({}).addProseMirrorPlugins.call({ editor: {} });
    assert.equal(fn.suggestion.findSuggestionMatch, undefined);
    assert.equal(fn.suggestion.char, '/');
  } finally { w.Tiptap = prev; }
});

// L'aide d'une recherche vide (« /ref ») : le texte avant le curseur finit par
// le caractère, la fonction et une espace.
function hintFor(c, text) {
  return withPlugins(c, (plugins) => {
    const parent = { content: { size: text.length }, textBetween: (from, to) => text.slice(from, to) };
    const state = { selection: { empty: true, from: text.length, $from: { parent, parentOffset: text.length } }, doc: {} };
    return plugins[2].spec.props.decorations(state);
  });
}

test('l’aide « Rechercher … » suit le caractère, et « / » n’y compte plus quand il est remplacé', () => {
  const kind = Object.keys(D.ORDER_DEFS).find((k) => D.ORDER_DEFS[k].hint);
  assert.ok(kind, 'au moins une fonction a une aide');
  const kbd = D.ORDER_DEFS[kind].kbd || kind;
  assert.ok(hintFor('/', '/' + kbd + ' '), 'défaut : « /' + kbd + ' »');
  assert.ok(hintFor('*', '*' + kbd + ' '), 'étoile : « *' + kbd + ' »');
  assert.equal(hintFor('*', '/' + kbd + ' '), null, 'le slash ne déclenche plus rien');
  assert.equal(hintFor('/', '*' + kbd + ' '), null);
  assert.ok(hintFor('=', '=' + kbd + ' '), 'signe égal : « =' + kbd + ' »');
  assert.equal(hintFor('=', '*' + kbd + ' '), null, 'un autre caractère ne déclenche plus rien');
});
