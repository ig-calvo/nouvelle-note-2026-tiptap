// Charge les sources du prototype hors navigateur.
//
// Le prototype n'a ni build ni npm : chaque fichier est un script classique
// chargé par <script type="text/babel"> qui publie ses fonctions sur `window`.
// On reproduit donc exactement ça — un `window` de remplacement et les vrais
// fichiers évalués dedans — plutôt que de dupliquer la logique dans les tests.
// Aucune dépendance : `node --test project/tests/*.test.mjs` (la forme
// « dossier » n'est plus acceptée depuis Node 25).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const projectDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Lit un fichier JSON du prototype (ex. la base CIM-10) sans passer par le
// faux `window` — utile aux tests qui vérifient les données elles-mêmes.
export function readProjectJSON(rel) {
  return JSON.parse(fs.readFileSync(path.join(projectDir, rel), 'utf8'));
}

// La couche de langue passe toujours en premier, comme dans l'HTML : i18n.js,
// puis les dictionnaires (le français toujours, l'anglais seulement s'il est
// demandé ET qu'il existe — son absence est le repli sur le français).
const I18N_SOURCES = ['note-ui/i18n.js', 'note-ui/i18n/fr.js'];
// Ce que les fichiers du prototype supposent déjà chargé (comme dans l'HTML), après la langue.
const SHARED_SOURCES = ['note-ui/rx-text.jsx'];
const I18N_SOURCES_EN = ['note-ui/i18n/en.js', 'note-ui/i18n/data-en.js'];

// `lang` : 'fr' (défaut) ou 'en'. Les fichiers reçoivent `t`, `tn`, `L` et `tk`
// comme variables libres, ainsi qu'ils les reçoivent de `window` dans le
// navigateur — un fichier chargé par `new Function` n'y a pas accès autrement.
export function loadPrototype(files = ['note-ui/note-sections.jsx', 'note-ui/diagnostics.jsx', 'note-ui/editor-schema.jsx'], { lang = 'fr' } = {}) {
  const win = {};
  if (lang !== 'fr') win.location = { search: `?lang=${lang}` };
  let globals = [];
  const evaluate = (rel) => {
    const src = fs.readFileSync(path.join(projectDir, rel), 'utf8');
    // `new Function` plutôt que `vm` : le code s'exécute dans le MÊME realm que
    // les tests, donc les objets qu'il produit sont comparables avec
    // assert.deepEqual (un contexte vm a ses propres Object/Array, et toute
    // comparaison stricte échouerait sur la seule identité des prototypes).
    // Chaque fichier garde sa propre portée — comme des <script> séparés dans
    // le navigateur — et ne communique que par `window`.
    // eslint-disable-next-line no-new-func
    new Function('window', 'document', 'React', 't', 'tn', 'L', 'tk', src)(win, undefined, undefined, ...globals);
  };
  for (const rel of I18N_SOURCES) evaluate(rel);
  if (win.I18N.lang === 'en') {
    for (const rel of I18N_SOURCES_EN) if (fs.existsSync(path.join(projectDir, rel))) evaluate(rel);
  }
  globals = [win.I18N.t, win.I18N.tn, win.I18N.L, win.I18N.tk];
  for (const rel of SHARED_SOURCES) evaluate(rel);
  for (const rel of files) evaluate(rel);
  return win;
}

// --- fabriques de documents, pour que les tests lisent comme des notes ---

export const H2 = (text) => ({ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text }] });
export const P = (text) => (text === undefined
  ? { type: 'paragraph' }
  : { type: 'paragraph', content: [{ type: 'text', text }] });
export const SPLIT = { type: 'sectionSplit' };
export const CHIP = (label) => ({
  type: 'paragraph',
  content: [{ type: 'chip', attrs: { cid: 'c1', type: 'prescription', label } }]
});
export const doc = (...content) => ({ type: 'doc', content });

// Texte brut des blocs, pour comparer une zone à ce qu'on y attend.
export function textOf(blocks) {
  const out = [];
  const walk = (n) => {
    if (!n) return;
    if (n.type === 'text' && n.text) out.push(n.text);
    if (n.type === 'sectionSplit') out.push('---');
    (n.content || []).forEach(walk);
  };
  (blocks || []).forEach(walk);
  return out;
}
