#!/usr/bin/env node
// Extraction des textes à traduire — PLAN-bilingue-fr-en.md, lot A0.
//
// Lit le code du prototype et `note-ui/i18n/fr.js`, puis écrit
// `note-ui/i18n/catalog.json` : l'entrée du travail de la piste B (traduction).
//
//   node project/tools/i18n-extract.mjs            écrit le catalogue
//   node project/tools/i18n-extract.mjs --check    échoue si le catalogue est périmé
//
// Ce qu'il cherche, dans `Note Clinique.html`, `tweaks-panel.jsx` et
// `note-ui/*.jsx` (jamais dans les commentaires) :
//   t('clé')  tn('clé', n)  tk('clé')   texte d'interface, défini dans fr.js
//   L('texte français')                 texte de démonstration, qui est sa propre clé
//
// Heuristique de lecture, pas un analyseur de syntaxe : un appel dont le premier
// argument n'est pas un littéral (`t(key)`, `L(item.titre)`) est relayé, pas
// extrait ; un littéral recollé (`L('a' + b)`) ou un gabarit avec `${…}` est une
// ERREUR — c'est la phrase coupée en morceaux que le plan interdit.
//
// Le catalogue est déterministe (aucune date, tout est trié) : régénéré sans
// changement de texte, il ne produit aucun diff.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const defaultRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const CATALOG_PATH = 'note-ui/i18n/catalog.json';
export const DICT_FR_PATH = 'note-ui/i18n/fr.js';

// Le dernier segment d'une clé dit où le texte s'affiche (voir fr.js).
const CONTEXTES = {
  title: 'titre', heading: 'titre de section', label: 'libellé', button: 'bouton',
  hint: 'aide', tooltip: 'info-bulle', aria: 'texte pour lecteur d’écran (aria-label)',
  placeholder: 'texte d’invite d’un champ', toast: 'notification', error: 'message d’erreur',
  empty: 'état vide', menu: 'entrée de menu', text: 'texte'
};

export function sourceFiles(root = defaultRoot) {
  const files = ['Note Clinique.html', 'tweaks-panel.jsx'];
  for (const f of fs.readdirSync(path.join(root, 'note-ui')).sort()) {
    if (f.endsWith('.jsx')) files.push(`note-ui/${f}`);
  }
  return files.filter((f) => fs.existsSync(path.join(root, f)));
}

// Remplace les commentaires par des espaces (mêmes positions, mêmes sauts de
// ligne) : `t('x')` écrit dans un commentaire d'explication ne compte pas.
// `//` précédé de `:` (https://…) ou collé à un mot n'est pas un commentaire.
export function stripComments(src) {
  const blank = (m) => m.replace(/[^\n]/g, ' ');
  return src
    .replace(/<!--[\s\S]*?-->/g, blank)
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/(^|[\s;,{}()])\/\/.*$/gm, (m, lead) => lead + ' '.repeat(m.length - lead.length));
}

// Lit un littéral de chaîne qui commence à `i` (guillemet ouvrant). Rend le texte
// décodé et la position juste après le guillemet fermant ; `dynamic` si c'est un
// gabarit avec `${` ; `null` si le littéral n'est jamais fermé sur la ligne.
function readLiteral(src, i) {
  const quote = src[i];
  let out = '';
  for (let j = i + 1; j < src.length; j++) {
    const c = src[j];
    if (c === '\\') {
      const n = src[j + 1];
      const esc = { n: '\n', t: '\t', r: '\r', b: '\b', f: '\f', v: '\v', 0: '\0' };
      if (n === 'u' && /^[0-9a-fA-F]{4}$/.test(src.slice(j + 2, j + 6))) {
        out += String.fromCharCode(parseInt(src.slice(j + 2, j + 6), 16));
        j += 5;
      } else if (n === 'x' && /^[0-9a-fA-F]{2}$/.test(src.slice(j + 2, j + 4))) {
        out += String.fromCharCode(parseInt(src.slice(j + 2, j + 4), 16));
        j += 3;
      } else {
        out += Object.prototype.hasOwnProperty.call(esc, n) ? esc[n] : n;
        j += 1;
      }
      continue;
    }
    if (quote === '`' && c === '$' && src[j + 1] === '{') return { dynamic: true, end: j };
    if (c === quote) return { text: out, end: j + 1 };
    if (c === '\n' && quote !== '`') return null;
    out += c;
  }
  return null;
}

const CALL = /(?<![\w$.])(t|tn|tk|L)\(\s*/g;

// Les appels d'un fichier : [{ fn, kind, key|text, line, ... }] et les problèmes.
export function scanSource(src, file) {
  const clean = stripComments(src);
  const calls = [];
  const problems = [];
  let m;
  CALL.lastIndex = 0;
  while ((m = CALL.exec(clean))) {
    const fn = m[1];
    const start = m.index + m[0].length;
    const line = clean.slice(0, m.index).split('\n').length;
    const where = `${file}:${line}`;
    if (!'\'"`'.includes(clean[start])) continue; // `t(key)`, `L(item.titre)` : relayé
    const lit = readLiteral(clean, start);
    if (!lit) { problems.push(`${where} : ${fn}( : littéral non fermé`); continue; }
    if (lit.dynamic) { problems.push(`${where} : ${fn}( : gabarit avec \${…} — une phrase entière, avec {valeurs} nommées, dans le dictionnaire`); continue; }
    const after = clean.slice(lit.end).match(/^\s*(.)/);
    const next = after ? after[1] : '';
    if (next !== ',' && next !== ')') {
      problems.push(`${where} : ${fn}('${lit.text}'… : texte recollé (${next}) — une phrase entière, avec {valeurs} nommées`);
      continue;
    }
    const lineText = src.split('\n')[line - 1].trim();
    calls.push({ fn, text: lit.text, line, where, lineText });
  }
  return { calls, problems };
}

export function readDict(root = defaultRoot, rel = DICT_FR_PATH) {
  const win = {};
  new Function('window', fs.readFileSync(path.join(root, rel), 'utf8'))(win);
  return (win.I18N_DICT && win.I18N_DICT.fr) || {};
}

const fingerprint = (value) => crypto.createHash('sha1')
  .update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex').slice(0, 12);

const isPlural = (entry) => entry !== null && typeof entry === 'object';

export function contextOf(key) {
  const last = key.split('.').pop();
  return CONTEXTES[last] || 'texte';
}

export function extract(root = defaultRoot) {
  const dict = readDict(root);
  const errors = [];
  const used = new Map(); // clé → [{ fn, where }]
  const data = new Map(); // texte français → [where]

  for (const file of sourceFiles(root)) {
    const { calls, problems } = scanSource(fs.readFileSync(path.join(root, file), 'utf8'), file);
    errors.push(...problems);
    for (const c of calls) {
      if (c.fn === 'L') {
        if (!data.has(c.text)) data.set(c.text, { where: [], lineText: c.lineText });
        data.get(c.text).where.push(c.where);
      } else {
        if (!used.has(c.text)) used.set(c.text, []);
        used.get(c.text).push({ fn: c.fn, where: c.where });
      }
    }
  }

  const interfaceEntries = {};
  for (const key of [...used.keys()].sort()) {
    const uses = used.get(key);
    if (!Object.prototype.hasOwnProperty.call(dict, key)) {
      errors.push(`${uses[0].where} : clé « ${key} » absente de ${DICT_FR_PATH}`);
      continue;
    }
    const entry = dict[key];
    for (const u of uses) {
      if (u.fn === 't' && isPlural(entry)) errors.push(`${u.where} : « ${key} » est un pluriel — lire avec tn(clé, n)`);
      if (u.fn === 'tn' && !isPlural(entry)) errors.push(`${u.where} : « ${key} » lu par tn() mais défini en texte simple — { one, other }`);
    }
    interfaceEntries[key] = {
      fr: entry,
      empreinte: fingerprint(entry),
      contexte: contextOf(key),
      fichiers: [...new Set(uses.map((u) => u.where))].sort()
    };
  }
  for (const key of Object.keys(dict)) {
    if (!used.has(key)) errors.push(`${DICT_FR_PATH} : clé « ${key} » jamais utilisée`);
    const entry = dict[key];
    if (isPlural(entry) && typeof entry.other !== 'string') errors.push(`${DICT_FR_PATH} : pluriel « ${key} » sans forme « other »`);
  }

  const donnees = [...data.keys()].sort().map((fr) => ({
    fr,
    empreinte: fingerprint(fr),
    contexte: 'donnée de démonstration',
    extrait: data.get(fr).lineText.slice(0, 160),
    fichiers: [...new Set(data.get(fr).where)].sort()
  }));

  const catalog = {
    _meta: {
      genere_par: 'project/tools/i18n-extract.mjs',
      avertissement: 'Fichier généré : ne pas modifier à la main, relancer l’extraction.',
      langue_source: 'fr',
      interface: Object.keys(interfaceEntries).length,
      donnees: donnees.length
    },
    interface: interfaceEntries,
    donnees
  };
  return { catalog, errors };
}

export const serialize = (catalog) => JSON.stringify(catalog, null, 2) + '\n';

function main() {
  const check = process.argv.includes('--check');
  const { catalog, errors } = extract();
  if (errors.length) {
    console.error(errors.map((e) => `  ✗ ${e}`).join('\n'));
    console.error(`\n${errors.length} problème(s) : catalogue non écrit.`);
    process.exit(1);
  }
  const out = path.join(defaultRoot, CATALOG_PATH);
  const next = serialize(catalog);
  const current = fs.existsSync(out) ? fs.readFileSync(out, 'utf8') : null;
  if (check) {
    if (current !== next) { console.error(`${CATALOG_PATH} est périmé : relancer node project/tools/i18n-extract.mjs`); process.exit(1); }
    console.log(`${CATALOG_PATH} à jour.`);
    return;
  }
  if (current !== next) fs.writeFileSync(out, next);
  console.log(`${CATALOG_PATH} ${current === next ? 'inchangé' : 'écrit'} : ${catalog._meta.interface} textes d’interface, ${catalog._meta.donnees} données de démonstration.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
