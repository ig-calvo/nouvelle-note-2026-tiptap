// Couche de langue (PLAN-bilingue-fr-en.md, lots A0 et suivants) : choix de la
// langue, t / tn / L, repli sur le français, extraction du catalogue, et parité
// des fichiers anglais avec le français quand ils existent.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { loadPrototype, projectDir } from './harness.mjs';
import { extract, scanSource, serialize, stripComments, CATALOG_PATH } from '../tools/i18n-extract.mjs';

const read = (rel) => fs.readFileSync(path.join(projectDir, rel), 'utf8');
const exists = (rel) => fs.existsSync(path.join(projectDir, rel));

// --- i18n.js posé sur une page : langue, mémorisation, <html lang> ---

function page({ search = '', stored = null, storageBroken = false } = {}) {
  const store = new Map(stored ? [['omnimed-note-lang', stored]] : []);
  const win = {
    location: { search },
    document: { documentElement: { lang: 'fr' } },
    get localStorage() {
      if (storageBroken) throw new Error('données de site bloquées');
      return { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, v) };
    }
  };
  // eslint-disable-next-line no-new-func
  new Function('window', read('note-ui/i18n.js'))(win);
  return { win, store };
}

test('langue : français par défaut, <html lang> en fr-CA', () => {
  const { win, store } = page();
  assert.equal(win.I18N.lang, 'fr');
  assert.equal(win.I18N.locale, 'fr-CA');
  assert.equal(win.document.documentElement.lang, 'fr-CA');
  assert.equal(store.size, 0, 'rien à mémoriser tant que personne n’a choisi');
});

test('langue : ?lang=en passe en anglais canadien et se mémorise', () => {
  const { win, store } = page({ search: '?lang=en' });
  assert.equal(win.I18N.lang, 'en');
  assert.equal(win.I18N.locale, 'en-CA');
  assert.equal(win.document.documentElement.lang, 'en-CA');
  assert.equal(store.get('omnimed-note-lang'), 'en');
});

test('langue : sans paramètre, la langue mémorisée s’applique ; le paramètre l’emporte et la remplace', () => {
  assert.equal(page({ stored: 'en' }).win.I18N.lang, 'en');
  const back = page({ search: '?lang=fr', stored: 'en' });
  assert.equal(back.win.I18N.lang, 'fr');
  assert.equal(back.store.get('omnimed-note-lang'), 'fr');
});

test('langue : valeur inconnue ou illisible → français ; EN-CA et fr_CA sont acceptés', () => {
  assert.equal(page({ search: '?lang=de' }).win.I18N.lang, 'fr');
  assert.equal(page({ search: '?lang=' }).win.I18N.lang, 'fr');
  assert.equal(page({ stored: 'klingon' }).win.I18N.lang, 'fr');
  assert.equal(page({ search: '?lang=EN-CA' }).win.I18N.lang, 'en');
  assert.equal(page({ search: '?presentation&lang=fr_CA' }).win.I18N.lang, 'fr');
});

test('langue : stockage bloqué (navigation privée) → le prototype démarre quand même', () => {
  const { win } = page({ search: '?lang=en', storageBroken: true });
  assert.equal(win.I18N.lang, 'en');
});

test('langue : publie t, tn, L et tk sur window', () => {
  const { win } = page();
  for (const name of ['t', 'tn', 'L', 'tk']) assert.equal(typeof win[name], 'function', name);
});

// --- t / tn / L ---

const dict = {
  fr: {
    'a.title': 'Ordonnance',
    'a.sent': 'Envoyé à {dest} le {date}',
    'a.count': { one: '{n} ordonnance', other: '{n} ordonnances' },
    'a.only-fr': 'Seulement en français',
    'a.only-fr-count': { one: '{n} jour', other: '{n} jours' }
  },
  en: {
    'a.title': 'Prescription',
    'a.sent': 'Sent to {dest} on {date}',
    'a.count': { one: '{n} prescription', other: '{n} prescriptions' }
  }
};
const data = { en: { Amoxicilline: 'Amoxicillin', '{n} comp. par jour': '{n} tab. a day' } };
const make = (lang) => page().win.I18N.create({ lang, dict, data });

test('t : texte, valeurs nommées, clé inconnue rendue telle quelle', () => {
  const fr = make('fr');
  assert.equal(fr.t('a.title'), 'Ordonnance');
  assert.equal(fr.t('a.sent', { dest: 'Jean-Coutu', date: '3 mars' }), 'Envoyé à Jean-Coutu le 3 mars');
  assert.equal(fr.t('a.sent', { dest: 'Jean-Coutu' }), 'Envoyé à Jean-Coutu le {date}', 'valeur manquante : le {nom} reste visible');
  assert.equal(fr.t('n’existe.pas'), 'n’existe.pas');
  assert.ok(fr.missing['n’existe.pas']);
  assert.equal(make('en').t('a.title'), 'Prescription');
});

test('t : en anglais, une clé sans traduction affiche le français (repli)', () => {
  const en = make('en');
  assert.equal(en.t('a.only-fr'), 'Seulement en français');
});

test('tn : pluriel du français (0 et 1 au singulier) et de l’anglais (0 au pluriel)', () => {
  const fr = make('fr');
  assert.equal(fr.tn('a.count', 0), '0 ordonnance');
  assert.equal(fr.tn('a.count', 1), '1 ordonnance');
  assert.equal(fr.tn('a.count', 2), '2 ordonnances');
  const en = make('en');
  assert.equal(en.tn('a.count', 0), '0 prescriptions');
  assert.equal(en.tn('a.count', 1), '1 prescription');
  assert.equal(en.tn('a.count', 3), '3 prescriptions');
});

test('tn : une entrée qui retombe sur le français s’accorde selon le français, pas l’anglais', () => {
  assert.equal(make('en').tn('a.only-fr-count', 0), '0 jour');
});

test('L : français inchangé ; anglais depuis la table ; repli sur le français', () => {
  assert.equal(make('fr').L('Amoxicilline'), 'Amoxicilline');
  const en = make('en');
  assert.equal(en.L('Amoxicilline'), 'Amoxicillin');
  assert.equal(en.L('Pénicilline'), 'Pénicilline');
  assert.equal(en.L('{n} comp. par jour', { n: 2 }), '2 tab. a day');
  assert.equal(en.L('constructor'), 'constructor', 'pas de piège sur les propriétés d’Object');
  assert.equal(en.L(undefined), undefined);
  assert.equal(en.L('Texte avec {accolades}'), 'Texte avec {accolades}', 'sans valeurs, rien n’est remplacé');
});

test('dictionnaires lus à l’appel : un fichier chargé après i18n.js est vu', () => {
  const win = loadPrototype([]);
  assert.equal(typeof win.I18N_DICT.fr['app.error.title'], 'string');
  assert.equal(win.t('app.error.title'), win.I18N_DICT.fr['app.error.title']);
});

test('harnais : un fichier chargé reçoit t, tn, L et tk comme variables libres', () => {
  const win = loadPrototype([]);
  const probe = new Function('t', 'L', 'tk', 'return [t("app.error.title"), L("x"), tk("k")]');
  assert.deepEqual(probe(win.t, win.L, win.tk), [win.t('app.error.title'), 'x', 'k']);
});

// --- extraction ---

test('extraction : lit t, tn, tk, L ; ignore commentaires, .t(), relais et noms voisins', () => {
  const src = [
    "const a = t('x.title');",
    "const b = tn(\"x.count\", n, { z: 1 });",
    "const c = { k: tk('x.kind') };",
    "const d = L('Amoxicilline 500 mg');",
    "// t('dans.un.commentaire')",
    "/* L('bloc') */ const e = 1;",
    "{/* t('jsx.commentaire') */}",
    "const f = obj.t('methode'); const g = split('x'); const h = format('y');",
    "const i = t(key); const j = L(item.titre);",
    "const url = 'https://exemple.ca'; const k = t('apres.url');"
  ].join('\n');
  const { calls, problems } = scanSource(src, 'x.jsx');
  assert.deepEqual(problems, []);
  assert.deepEqual(calls.map((c) => `${c.fn}:${c.text}`), ['t:x.title', 'tn:x.count', 'tk:x.kind', 'L:Amoxicilline 500 mg', 't:apres.url']);
});

test('extraction : texte recollé, gabarit avec ${} et littéral non fermé sont des erreurs', () => {
  const { problems } = scanSource("L('1 comp. ' + freq);\nt(`a ${b}`);\nt('ouvert\n", 'x.jsx');
  assert.equal(problems.length, 3);
  assert.match(problems[0], /x\.jsx:1.*recollé/);
  assert.match(problems[1], /x\.jsx:2.*\$\{/);
  assert.match(problems[2], /x\.jsx:3.*non fermé/);
});

test('extraction : les commentaires gardent leurs positions (numéros de ligne justes)', () => {
  const src = '/* a\nb */\nt("k.title");';
  assert.equal(stripComments(src).length, src.length);
  assert.equal(scanSource(src, 'x').calls[0].line, 3);
});

test('extraction : le dépôt est cohérent — aucune clé manquante, inutilisée ou mal lue', () => {
  const { errors } = extract(projectDir);
  assert.deepEqual(errors, []);
});

test('extraction : catalog.json est à jour (relancer node project/tools/i18n-extract.mjs)', () => {
  const { catalog } = extract(projectDir);
  assert.equal(read(CATALOG_PATH), serialize(catalog));
});

// --- parité des fichiers anglais (piste B) ---

const placeholders = (v) => [...new Set([].concat(typeof v === 'string' ? v : Object.values(v)).join(' ').match(/\{\w+\}/g) || [])].sort();

test('parité : en.js a les mêmes clés, {valeurs} et pluriels que fr.js', (tc) => {
  if (!exists('note-ui/i18n/en.js')) { tc.skip('en.js absent : tout s’affiche en français (repli) — avertissement tant que la piste B n’a pas livré'); return; }
  const { I18N_DICT } = loadPrototype([], { lang: 'en' });
  const { fr, en } = I18N_DICT;
  const problems = [];
  for (const key of Object.keys(fr)) {
    if (!(key in en)) { problems.push(`manquante en anglais : ${key}`); continue; }
    if (typeof fr[key] !== typeof en[key]) problems.push(`forme différente (texte / pluriel) : ${key}`);
    if (typeof en[key] === 'object' && typeof en[key].other !== 'string') problems.push(`pluriel sans « other » : ${key}`);
    if (placeholders(fr[key]).join() !== placeholders(en[key]).join()) problems.push(`{valeurs} différentes : ${key}`);
  }
  for (const key of Object.keys(en)) if (!(key in fr)) problems.push(`inutilisée (absente du français) : ${key}`);
  assert.deepEqual(problems, []);
});

test('parité : data-en.js ne traduit que des textes qui existent encore en français', (tc) => {
  if (!exists('note-ui/i18n/data-en.js')) { tc.skip('data-en.js absent : les données de démonstration restent en français (repli)'); return; }
  const { I18N_DATA } = loadPrototype([], { lang: 'en' });
  const known = new Set(extract(projectDir).catalog.donnees.map((d) => d.fr));
  const problems = [];
  for (const [fr, en] of Object.entries(I18N_DATA.en)) {
    if (!known.has(fr)) problems.push(`texte français disparu : ${fr}`);
    if (placeholders(fr).join() !== placeholders(en).join()) problems.push(`{valeurs} différentes : ${fr}`);
  }
  assert.deepEqual(problems, []);
});
