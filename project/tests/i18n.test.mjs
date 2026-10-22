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

// --- lot A1 : le français d'avant, accords, dates ---

const fr = loadPrototype(['note-ui/note-sections.jsx', 'note-ui/diagnostics.jsx', 'note-ui/editor-schema.jsx', 'note-ui/cim10-index.jsx']);
const NB = ' ';

test('français : les pluriels écrits à la main donnent les mêmes phrases qu’avant', () => {
  const cases = [
    [fr.tn('document.pill.aria', 1, { kind: 'Ordonnance', total: 3 }), `Ordonnance${NB}: 1 sur 3 complété`],
    [fr.tn('document.pill.aria', 2, { kind: 'Ordonnance', total: 3 }), `Ordonnance${NB}: 2 sur 3 complétés`],
    [fr.tn('portal.pill.label', 1), `Portail patient${NB}: 1 élément partagé`],
    [fr.tn('portal.pill.label', 3), `Portail patient${NB}: 3 éléments partagés`],
    [fr.tn('noteStart.drafts.label', 1), 'Brouillon'],
    [fr.tn('noteStart.drafts.label', 2), '2 brouillons'],
    [fr.tn('quickSend.summary.text', 1), '1 document · 1 destination'],
    [fr.tn('quickSend.summary.text', 2), '1 document · 2 destinations'],
    [fr.tn('transmission.sent.toast', 1), '1 document transmis'],
    [fr.tn('transmission.sent.toast', 4), '4 documents transmis'],
    [fr.tn('transmission.ready.label', 1), '1 document prêt à transmettre'],
    [fr.tn('transmission.ready.label', 2), '2 documents prêts à transmettre'],
    [fr.tn('transmission.prescriptions.label', 2), '2 prescriptions'],
    [fr.tn('dx.rename.hint', 1), 'Renomme aussi 1 autre mention de ce diagnostic.'],
    [fr.tn('dx.rename.hint', 2), 'Renomme aussi 2 autres mentions de ce diagnostic.'],
    [fr.tn('review.count.label', 1), '1 modification'],
    [fr.tn('review.count.label', 5), '5 modifications'],
    [fr.tn('review.pending.chips.text', 2), '2 ajouts'],
    [fr.tn('review.pending.lines.text', 1), '1 ligne de texte'],
    [fr.tn('field.removeSelection.hint', 1, { names: 'Tylenol' }), 'La sélection contient un élément (Tylenol), qui sera retiré de la note.'],
    [fr.tn('field.removeSelection.hint', 3, { names: 'a, b, c' }), 'La sélection contient 3 éléments (a, b, c), qui seront retirés de la note.'],
    [fr.cim10CountLabel(1, 'code'), '1 code précis'],
    [fr.cim10CountLabel(12, 'block'), '12 blocs']
  ];
  for (const [actual, expected] of cases) assert.equal(actual, expected);
});

test('français : le lecteur d’écran annonce les lignes de la conclusion comme avant', () => {
  const doc = (n) => ({ type: 'doc', content: [
    { type: 'paragraph', content: [{ type: 'text', text: 'a' }] },
    { type: 'sectionSplit' },
    ...Array.from({ length: n }, () => ({ type: 'paragraph', content: [{ type: 'text', text: 'b' }] }))
  ] });
  assert.equal(fr.splitAriaValueText(doc(0)), 'Conclusion vide');
  assert.match(fr.splitAriaValueText(doc(1)), /^1 ligne sur \d+ dans la conclusion$/);
  assert.match(fr.splitAriaValueText(doc(2)), /^2 lignes sur \d+ dans la conclusion$/);
});

test('dates : la locale de la langue choisie, jamais « fr-CA » écrit en dur', () => {
  const iso = '2026-03-04T15:35:00';
  const d = new Date(iso);
  const time = d.toTimeString().slice(0, 5);
  assert.equal(fr.formatChipStamp(iso), `${d.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' })} à ${time}`);
  assert.equal(fr.fmtSommaireDate(d), '04/03/2026');
  const en = loadPrototype(['note-ui/diagnostics.jsx', 'note-ui/editor-schema.jsx'], { lang: 'en', english: false });
  assert.equal(en.I18N.locale, 'en-CA');
  assert.equal(en.formatChipStamp(iso), `${d.toLocaleDateString('en-CA', { day: 'numeric', month: 'short', year: 'numeric' })} à ${time}`, 'sans fichier anglais, la phrase « date à heure » retombe sur le français');
});

test('dates : aucune locale écrite en dur dans le code', () => {
  const offenders = [];
  for (const file of sourceFilesOf()) {
    stripComments(read(file)).split('\n').forEach((line, i) => {
      if (/['"](?:fr|en)(?:-[A-Z]{2})?['"]/.test(line) && /(?:toLocale\w*String|Intl\.\w+)\s*\(/.test(line)) offenders.push(`${file}:${i + 1}`);
    });
  }
  assert.deepEqual(offenders, [], 'utiliser window.I18N.locale');
});

// --- lot A1 : la logique ne lit jamais du texte affiché ---

import { sourceFiles } from '../tools/i18n-extract.mjs';
const sourceFilesOf = () => sourceFiles(projectDir).filter((f) => f !== 'note-ui/i18n.js');

// Comparaison avec un libellé : `x === 'Texte à afficher'`. Une valeur qui ressemble
// à un libellé (espace, majuscule, accent) doit être un CODE, comparé tel quel, ou
// lue par t() des deux côtés. Les valeurs ci-dessous sont des codes écrits en
// français par héritage : jamais traduits (ni L(), ni piste B), seuls leurs
// libellés passent par t().
const CODES_FRANCAIS = new Set([
  'comprimé', 'aérosol-doseur', 'gélule', // forme d'une ordonnance (rx-text.jsx)
  'cessée',                               // statut d'un médicament (libellé : MED_STATUS_LABEL)
  'intolérance',                          // type d'une allergie
  'Sans',                                 // contraste d'une imagerie ('Sans' | 'Avec')
  'KeyH'                                  // touche (KeyboardEvent.code)
]);

test('logique : aucune comparaison avec un libellé qui changerait de langue', () => {
  const RE = /(?:[!=]==?\s*|\.(?:includes|indexOf|startsWith)\(\s*)(['"])((?:(?!\1).)*)\1|(['"])((?:(?!\3).)*)\3\s*[!=]==?/g;
  const offenders = [];
  for (const file of sourceFilesOf()) {
    stripComments(read(file)).split('\n').forEach((line, i) => {
      for (const m of line.matchAll(RE)) {
        const lit = m[2] !== undefined ? m[2] : m[4];
        if (/(?:\.|\b)key\s*$|typeof [\w.]+\s*$|nodeType|tagName/.test(line.slice(0, m.index))) continue;
        if (!lit.trim() || CODES_FRANCAIS.has(lit)) continue;
        if (/[À-ÿ]|\s/.test(lit) || /^[A-ZÀ-Ý][a-zà-ÿ]/.test(lit)) offenders.push(`${file}:${i + 1} : '${lit}'`);
      }
    });
  }
  assert.deepEqual(offenders, [], 'un libellé affiché ne se compare pas : en faire un code, ou lire les deux côtés par t()');
});

// t(), tn(), L() et tk() sont des variables globales : une variable locale du
// même nom (`const t = setTimeout(…)`, `.map(t => …)`) masque la fonction dans
// toute sa portée, et l'appel plante en production. Lecture par blocs de premier
// niveau : un bloc qui déclare ET appelle le même nom est signalé ; les blocs
// ci-dessous ont été relus à la main (la variable vit dans un autre rappel). Là où
// une variable masque vraiment t, l'appel s'écrit window.t(…) : il n'est pas signalé.
const PORTEE_VERIFIEE = [
  'note-ui/ClinicalToolPicker.jsx:function ClinicalToolPicker',
  'note-ui/editor-popover.jsx:function RxMenu',
  'note-ui/editor-schema.jsx:function buildTransmissionDocs',
  'note-ui/NoteEditor.jsx:function NoteEditor',
  // Lot A2 : vérifiés par analyse de portée (Babel) au moment de la conversion — la variable
  // locale vit dans un rappel qui n'englobe pas l'appel ; là où elle l'englobait, l'appel est window.t(…).
  'note-ui/ActionLog.jsx:function ActionLogTags',
  'note-ui/DocumentViewerModal.jsx:function DocumentViewerModal',
  'note-ui/NoteEditor.jsx:function DsTimeList',
  'note-ui/NoteEditor.jsx:function TagInput',
  'note-ui/SummaryModals.jsx:function ProblemsModal',
  'note-ui/editor-field.jsx:function NoteBody',
  'note-ui/editor-field.jsx:function AddFileSourceMenu',
  'note-ui/editor-field.jsx:function NoteTemplateMenu',
  'note-ui/editor-field.jsx:function DiagnosticRefMenu',
  'note-ui/editor-field.jsx:function DiagDocMenu',
  'note-ui/editor-popover.jsx:function LabTestsField',
  'note-ui/editor-popover.jsx:function DxRow',
  'note-ui/editor-popover.jsx:function DxEditPopover',
  'note-ui/editor-schema.jsx:function makeDiagnosticRegionNode',
  'note-ui/editor-schema.jsx:function makeSectionSplitNode',
  'note-ui/editor-schema.jsx:function buildActionLog',
  'note-ui/presentation-mode.jsx:function PresentationMode'
];

function declares(code, name) {
  if (new RegExp(`\\b(?:const|let|var)\\s+${name}\\s*[=;,]`).test(code)) return true;
  for (const m of code.matchAll(/(?:function\s*\w*\s*)?\(([^()]*)\)\s*(?:=>|\{)/g)) {
    if (m[1].split(',').some((p) => p.trim().split('=')[0].trim() === name)) return true;
  }
  return new RegExp(`(?<![\\w$.])${name}\\s*=>`).test(code);
}

test('portée : aucun t(), tn(), L() ou tk() n’est appelé dans un bloc qui déclare une variable du même nom', () => {
  const found = [];
  for (const file of sourceFilesOf()) {
    const lines = stripComments(read(file)).split('\n');
    const starts = [];
    lines.forEach((l, i) => { if (/^(?:async\s+)?(?:function|const|let|var|class)\b|^(?:window|Object|React)\./.test(l)) starts.push(i); });
    starts.push(lines.length);
    for (let k = 0; k < starts.length - 1; k++) {
      const chunk = lines.slice(starts[k], starts[k + 1]).join('\n');
      const calls = scanSource(chunk, file).calls;
      for (const name of ['t', 'tn', 'L', 'tk']) {
        if (calls.some((c) => c.fn === name && !c.viaWindow) && declares(chunk, name)) {
          const head = lines[starts[k]].trim();
          if (!PORTEE_VERIFIEE.some((p) => `${file}:${head}`.startsWith(p))) found.push(`${file}:${starts[k] + 1} (${name}) ${head.slice(0, 60)}`);
        }
      }
    }
  }
  assert.deepEqual(found, [], 'renommer la variable locale, ou appeler window.t(…) ; si la variable vit dans un autre rappel, l’ajouter à PORTEE_VERIFIEE');
});
