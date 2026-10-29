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

// `lang` : 'fr' (défaut) ou 'en' — la variable d'environnement I18N_TEST_LANG=en fait tourner toute la suite en anglais ; `english: false` n'y charge pas les fichiers anglais ; `data` : table « français → anglais » de démonstration. Les fichiers reçoivent `t`, `tn`, `L` et `tk`
// comme variables libres, ainsi qu'ils les reçoivent de `window` dans le
// navigateur — un fichier chargé par `new Function` n'y a pas accès autrement.
export function loadPrototype(files = ['note-ui/note-sections.jsx', 'note-ui/diagnostics.jsx', 'note-ui/editor-schema.jsx'], { lang = process.env.I18N_TEST_LANG || 'fr', english = true, data = null, patient = null } = {}) {
  const win = {};
  // `patient` : 'pediatrique' (défaut) ou 'adulte' — la patiente active (patients.js).
  if (patient) win.PATIENT_KEY = patient;
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
  // `english: false` : une langue anglaise sans aucun fichier anglais (le repli sur le français),
  // quoi que la piste B ait livré — pour les tests qui vérifient ce repli.
  if (win.I18N.lang === 'en' && english) {
    for (const rel of I18N_SOURCES_EN) if (fs.existsSync(path.join(projectDir, rel))) evaluate(rel);
  }
  // `data` : une table « français → anglais » posée avant le chargement des fichiers, car
  // L() lit sa traduction à l'évaluation des données (pour tester la recherche dans les deux langues).
  if (data) win.I18N_DATA = { en: Object.assign({}, win.I18N_DATA && win.I18N_DATA.en, data) };
  globals = [win.I18N.t, win.I18N.tn, win.I18N.L, win.I18N.tk];
  // TR('texte français') : le texte d'un test rendu dans la langue de la suite, pour que les
  // mêmes assertions passent en français et en anglais. Un texte d'interface (valeur de fr.js)
  // passe par t(), un texte de démonstration par L(), tout autre texte reste tel quel.
  // Plusieurs clés au même texte français : leurs traductions doivent s'accorder.
  const byText = new Map();
  for (const [key, entry] of Object.entries(win.I18N_DICT.fr)) {
    if (typeof entry === 'string') byText.set(entry, [...(byText.get(entry) || []), key]);
  }
  win.TR = (text, values) => {
    const keys = byText.get(text);
    if (!keys) return win.I18N.L(text, values);
    const out = [...new Set(keys.map((k) => win.I18N.t(k, values)))];
    if (out.length > 1) throw new Error(`TR(« ${text} ») : traductions qui divergent selon la clé : ${out.join(' | ')}`);
    return out[0];
  };
  // La patiente active se lit avant toutes les données, comme dans la page.
  evaluate('note-ui/patients.js');
  for (const rel of SHARED_SOURCES) evaluate(rel);
  // Les données CRDS (menu /ref) se chargent avant editor-data.jsx, comme dans la page.
  if (files.includes('note-ui/editor-data.jsx')) evaluate('note-ui/crds-data.js');
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
