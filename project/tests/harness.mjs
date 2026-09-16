// Charge les sources du prototype hors navigateur.
//
// Le prototype n'a ni build ni npm : chaque fichier est un script classique
// chargé par <script type="text/babel"> qui publie ses fonctions sur `window`.
// On reproduit donc exactement ça — un `window` de remplacement et les vrais
// fichiers évalués dedans — plutôt que de dupliquer la logique dans les tests.
// Aucune dépendance : `node --test project/tests/`.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function loadPrototype(files = ['note-ui/note-sections.jsx', 'note-ui/editor-schema.jsx']) {
  const win = {};
  for (const rel of files) {
    const src = fs.readFileSync(path.join(projectDir, rel), 'utf8');
    // `new Function` plutôt que `vm` : le code s'exécute dans le MÊME realm que
    // les tests, donc les objets qu'il produit sont comparables avec
    // assert.deepEqual (un contexte vm a ses propres Object/Array, et toute
    // comparaison stricte échouerait sur la seule identité des prototypes).
    // Chaque fichier garde sa propre portée — comme des <script> séparés dans
    // le navigateur — et ne communique que par `window`.
    // eslint-disable-next-line no-new-func
    new Function('window', 'document', 'React', src)(win, undefined, undefined);
  }
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
