// Lot A7 : aucun texte visible écrit en dur dans les fichiers du prototype.
// Balayage par expressions régulières (pas d'analyse syntaxique) : il cherche
// le texte entre balises JSX et les attributs title / label / placeholder /
// aria-label / alt écrits avec un littéral. Un texte qui doit rester tel quel
// (unité, sigle, nom de la démonstration) se déclare dans EXCEPTIONS, avec la
// raison. Tout autre texte passe par t() ou L().
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { projectDir } from './harness.mjs';
import { sourceFiles, stripComments } from '../tools/i18n-extract.mjs';

// Fichiers entiers hors balayage : le panneau Tweaks est un outil de
// prototypage, pas l'interface du produit.
const FICHIERS_HORS_BALAYAGE = new Set(['tweaks-panel.jsx']);

// « fichier | texte » → raison. Le texte est celui que le balayage rapporte.
const EXCEPTIONS = new Map([
  ['Note Clinique.html|Omnimed — Note clinique', 'titre de l’onglet : nom du prototype'],
  ['note-ui/PatientBanner.jsx|FR', 'langue de la patiente (donnée de démonstration)'],
  ['note-ui/PatientBanner.jsx|2333 ch. du boulevard, Sherbrooke, QC…', 'adresse de démonstration'],
  ['note-ui/SummaryModals.jsx|72 µmol/L', 'valeur de laboratoire de démonstration'],
  ['note-ui/SummaryModals.jsx|89 mL/min', 'valeur de laboratoire de démonstration'],
  ['note-ui/SummaryModals.jsx|62 kg', 'valeur de démonstration'],
  ['note-ui/editor-popover.jsx|RAMQ', 'sigle propre au produit'],
  ['note-ui/editor-popover.jsx|NPS', 'sigle'],
  ['note-ui/editor-popover.jsx|mcg/inh', 'unité'],
  ['note-ui/editor-popover.jsx|mL', 'unité'],
  ['note-ui/editor-popover.jsx|PO', 'voie : code pharmaceutique'],
  ['note-ui/editor-popover.jsx|IM', 'voie : code pharmaceutique'],
  ['note-ui/editor-popover.jsx|IV', 'voie : code pharmaceutique'],
  ['note-ui/editor-popover.jsx|SC', 'voie : code pharmaceutique'],
  ['note-ui/editor-popover.jsx|DIE', 'fréquence : code pharmaceutique'],
  ['note-ui/editor-popover.jsx|BID', 'fréquence : code pharmaceutique'],
  ['note-ui/editor-popover.jsx|TID', 'fréquence : code pharmaceutique'],
  ['note-ui/editor-popover.jsx|QID', 'fréquence : code pharmaceutique'],
  ['note-ui/editor-popover.jsx|HS', 'fréquence : code pharmaceutique'],
  ['note-ui/editor-popover.jsx|TDM', 'sigle d’imagerie'],
  ['note-ui/editor-popover.jsx|IRM', 'sigle d’imagerie'],
]);

const LETTRES = /\p{L}{2,}/u;
const MOT_DE_CODE = /^[a-z_]+$/;
const PONCTUATION_DE_CODE = /^[=&|;)(,.:\/\\-]/;

// Renvoie [{ ligne, genre, texte }] pour le source donné.
export function balayer(src) {
  const hits = [];
  stripComments(src).split('\n').forEach((line, i) => {
    // Le panneau Tweaks de Note Clinique.html : composants <Tweak…>.
    if (/<Tweak/.test(line)) return;
    for (const m of line.matchAll(/(?<=[\w"'})\]\/])>([^<>{}=][^<>{}]*)(?=<|\{|$)/g)) {
      const texte = m[1].trim();
      // Un morceau de HTML assemblé dans une chaîne (« ' + t('…') + ' ») est déjà traduit.
      if (/'\s*\+|\+\s*'/.test(texte)) continue;
      if (LETTRES.test(texte) && !MOT_DE_CODE.test(texte) && !PONCTUATION_DE_CODE.test(texte)) {
        hits.push({ ligne: i + 1, genre: 'texte', texte });
      }
    }
    // data-screen-label et autres attributs « data- » : annotations de développement, jamais affichées.
    for (const m of line.matchAll(/(?<![\w-])(title|label|placeholder|aria-label|alt)="([^"{]*\p{L}[^"]*)"/gu)) {
      hits.push({ ligne: i + 1, genre: `attribut ${m[1]}`, texte: m[2] });
    }
  });
  return hits;
}

test('le balayage reconnaît un texte en dur (garde-fou du test lui-même)', () => {
  const hits = balayer('<button title="Enregistrer">Annuler</button>\n<input placeholder="Rechercher" />');
  assert.deepEqual(hits.map((h) => h.texte).sort(), ['Annuler', 'Enregistrer', 'Rechercher']);
  assert.deepEqual(balayer('<button title={t(\'a.title\')}>{t(\'a.text\')}</button>'), []);
  assert.deepEqual(balayer('<div data-screen-label="Outil clinique — Examen">x</div>'), []);
  assert.deepEqual(balayer('<TweakRadio label="Langue" />'), []);
});

test('aucun texte visible écrit en dur dans le prototype (hors exceptions déclarées)', () => {
  const trouves = [];
  const vus = new Set();
  for (const f of sourceFiles(projectDir)) {
    if (FICHIERS_HORS_BALAYAGE.has(path.basename(f))) continue;
    const src = fs.readFileSync(path.join(projectDir, f), 'utf8');
    for (const h of balayer(src)) {
      const cle = `${f}|${h.texte}`;
      if (EXCEPTIONS.has(cle)) { vus.add(cle); continue; }
      trouves.push(`${f}:${h.ligne} ${h.genre} « ${h.texte} »`);
    }
  }
  assert.deepEqual(trouves, [], 'texte en dur : le passer par t() / L(), ou le déclarer dans EXCEPTIONS avec la raison');
  const perimees = [...EXCEPTIONS.keys()].filter((k) => !vus.has(k));
  assert.deepEqual(perimees, [], 'exception devenue inutile : la retirer de EXCEPTIONS');
});
