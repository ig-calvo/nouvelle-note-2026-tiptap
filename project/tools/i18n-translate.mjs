#!/usr/bin/env node
// =========================================================
// i18n-translate.mjs — outil de la piste B (traductions automatiques).
//
// Sous-commandes :
//   entrees <dossier>
//       extrait de note-ui/ les textes à traduire : CIM-10 vers l'anglais
//       (cim10.entrees.json) et SNOMED vers le français (snomed.entrees.json)
//   lots <entrees.json> <dossier> [taille]
//       découpe les entrées en lots lot-NNN.json : consignes, glossaire, textes.
//       Chaque lot est traduit par un agent, qui écrit lot-NNN.sortie.json
//       au format { id: traduction }
//   fusion <dossier> <sortie.json>
//       réunit les sorties ; vérifie la couverture, les {valeurs} et le
//       glossaire ; écrit { id: traduction } si aucune erreur
//   construire <trad-cim10.json> <trad-snomed.json>
//       écrit cim10-en-clinique.json, cim10-hierarchy-en.json,
//       snomed-diagnostics-fr.json dans note-ui/, et traductions.meta.json
//       dans note-ui/i18n/
//
// Identifiants : code:<code> (ou code:<code>#generique), chap:<id>,
// bloc:<début>-<fin>, parent:<code>, ajout:<code>, concept:<conceptId>.
// =========================================================

import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const NOTE_UI = path.join(RACINE, 'note-ui');
const GLOSSAIRE = path.join(NOTE_UI, 'i18n', 'glossaire.json');
const DATE = '2026-10-22';

const lire = async (f) => JSON.parse(await readFile(f, 'utf8'));
const ecrire = async (f, donnees) => {
  await mkdir(path.dirname(f), { recursive: true });
  await writeFile(f, JSON.stringify(donnees) + '\n', 'utf8');
};

const CONSIGNES = {
  'fr-en': [
    'Traduire chaque libellé clinique en anglais canadien (en-CA), ton clinique professionnel.',
    'Si le libellé est un intitulé officiel de la CIM-10 (OMS) pour ce code, donner le titre anglais officiel de l\'OMS.',
    'Un libellé composé « A / B » garde sa structure : traduire chaque partie.',
    'Un libellé marqué « libellé générique de remplacement » est un intitulé court : le traduire comme tel.',
    'Ne rien ajouter de clinique, pas de ponctuation finale absente de la source.',
    'Conserver les {valeurs} entre accolades à l\'identique.',
    'Appliquer le glossaire quand un de ses termes figure dans le texte.',
  ],
  'fr-en-interface': [
    'Traduire chaque texte d\'interface de Note Clinique (boutons, titres, messages, aides) en anglais canadien (en-CA).',
    'Style anglais : sentence case (majuscule au premier mot seulement), boutons à l\'infinitif sans article (« Cancel appointment »).',
    'Guillemets français « » deviennent “ ” ; pas d\'espace avant les deux-points, les points-virgules ou les points d\'interrogation.',
    'Conserver les {valeurs} entre accolades à l\'identique (même nom, même place logique).',
    'Un {noun} désigne un groupe nominal déjà traduit ailleurs : garder {noun} tel quel, il est remplacé à l\'affichage.',
    'Conserver les balises HTML <strong>, </strong> et <br> à l\'identique, au bon endroit dans la phrase anglaise. Aucune autre balise.',
    'Les valeurs, unités et sigles (PO, DIE, mg, PrescripTIon®) ne sont pas traduits.',
    'Le champ « contexte » indique l\'emplacement du texte (bouton, titre, aide…) : il sert au ton, il n\'apparaît pas dans la traduction.',
    'Appliquer le glossaire quand un de ses termes figure dans le texte.',
  ],
  'fr-en-donnees': [
    'Traduire chaque texte de démonstration (médicament, posologie, analyse, imagerie, référence, patient, gabarit) en anglais canadien (en-CA).',
    'Les noms de marque (Lipitor, Crestor, Norvasc…) restent identiques.',
    'Les noms génériques suivent l\'orthographe anglaise courante (Warfarine → Warfarin, Atorvastatine → Atorvastatin).',
    'Dans une posologie, traduire les abréviations : co / comp. → tab., caps → cap., DIE → once daily, HS → at bedtime, AM → in the morning, c. repas → with meals. BID, PO et TID restent tels quels.',
    'Garder les nombres, unités et symboles à l\'identique (mg, mL, %, —).',
    'Un texte sans rien à traduire (nom propre, sigle, nombre) est repris tel quel.',
    'Conserver les {valeurs} entre accolades à l\'identique.',
    'Appliquer le glossaire quand un de ses termes figure dans le texte.',
  ],
  'en-fr': [
    'Traduire chaque terme préféré SNOMED CT (anglais) en français clinique, tel qu\'employé au Québec.',
    'Utiliser le terme français d\'usage quand il existe (ex. « Hypernatremia » → « Hypernatrémie »).',
    'Le contexte indique la nature du concept (balise) : il sert à lever une ambiguïté, il n\'apparaît pas dans la traduction.',
    'Première lettre en majuscule, le reste en minuscules sauf noms propres et sigles.',
    'Ne rien ajouter de clinique.',
  ],
};

// ---------- identifiants (partagés entre entrees et construire)

const idLigne = (r) => (r.generic ? `code:${r.code}#generique` : `code:${r.code}`);
const idChapitre = (c) => `chap:${c.id}`;
const idBloc = (b) => `bloc:${b.range[0]}-${b.range[1]}`;
const idParent = (p) => `parent:${p.code}`;
const idAjout = (a) => `ajout:${a.code}`;
const idConcept = (c) => `concept:${c[0]}`;

function verifierUniques(entrees) {
  const vus = new Set();
  for (const e of entrees) {
    if (vus.has(e.id)) throw new Error(`identifiant en double : ${e.id}`);
    vus.add(e.id);
  }
}

// ---------- entrees

async function entrees(dossier) {
  const lignes = await lire(path.join(NOTE_UI, 'cim10-fr-clinique.json'));
  const hier = await lire(path.join(NOTE_UI, 'cim10-hierarchy.json'));
  const snomed = await lire(path.join(NOTE_UI, 'snomed-diagnostics.json'));

  const cim10 = [
    ...lignes.map((r) => ({
      id: idLigne(r),
      texte: r.libelle,
      ctx: `code CIM-10 ${r.code}` + (r.generic ? ' — libellé générique de remplacement' : ''),
    })),
    ...hier.chapters.map((c) => ({ id: idChapitre(c), texte: c.libelle, ctx: `chapitre CIM-10 (${c.range[0]} à ${c.range[1]})` })),
    ...hier.blocks.map((b) => ({ id: idBloc(b), texte: b.libelle, ctx: `bloc CIM-10 (${b.range[0]} à ${b.range[1]})` })),
    ...hier.parents.map((p) => ({ id: idParent(p), texte: p.libelle, ctx: `catégorie CIM-10 ${p.code}` })),
    ...hier.ajouts.map((a) => ({ id: idAjout(a), texte: a.libelle, ctx: `code CIM-10 ${a.code}` })),
  ];
  verifierUniques(cim10);

  const balises = snomed._meta.tags;
  const concepts = snomed.concepts.map((c) => ({
    id: idConcept(c),
    texte: c[1],
    ctx: c[3] != null ? `balise : ${balises[c[3]]}` : '',
  }));
  verifierUniques(concepts);

  await ecrire(path.join(dossier, 'cim10.entrees.json'), { sens: 'fr-en', items: cim10 });
  await ecrire(path.join(dossier, 'snomed.entrees.json'), { sens: 'en-fr', items: concepts });
  console.log(`CIM-10 : ${cim10.length} entrées ; SNOMED : ${concepts.length} entrées → ${dossier}`);
}

// ---------- données de démonstration (B2)

// Chaînes françaises de note-ui/editor-data.jsx : littéraux entre guillemets qui
// contiennent une lettre, sauf identifiants (« pill »), URL, couleurs et commentaires.
// Id = le texte français lui-même : data-en.js est une table « français → anglais ».
async function donneesEntrees(sortie) {
  const lignes = (await readFile(path.join(NOTE_UI, 'editor-data.jsx'), 'utf8')).split('\n');
  const vues = new Map();
  const motif = /'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"/g;
  lignes.forEach((ligne, i) => {
    const t = ligne.trim();
    if (t.startsWith('//')) return;
    for (const m of ligne.matchAll(motif)) {
      // Séquences d'échappement JS : \n et \t deviennent de vrais caractères, le reste vaut son caractère.
      const texte = (m[1] ?? m[2]).replace(/\\(.)/g, (_, c) => ({ n: '\n', t: '\t' })[c] ?? c);
      if (texte.length < 2 || !/\p{L}/u.test(texte)) continue;
      if (/^[a-z0-9_.\-]+$/.test(texte) || /^(https?:|#|\/)/.test(texte)) continue;
      if (!vues.has(texte)) vues.set(texte, { id: texte, texte, ctx: `editor-data.jsx ligne ${i + 1} : ${t.slice(0, 140)}` });
    }
  });
  const items = [...vues.values()];
  await ecrire(sortie, { sens: 'fr-en-donnees', items });
  console.log(`${items.length} chaînes uniques → ${sortie}`);
}

async function donnees(fichierTrad) {
  const table = await lire(fichierTrad);
  const cles = Object.keys(table).sort();
  const q = (s) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\t/g, '\\t')}'`;
  const corps = cles.map((k) => `  ${q(k)}: ${q(table[k])},`).join('\n');
  const fichier = path.join(NOTE_UI, 'i18n', 'data-en.js');
  await mkdir(path.dirname(fichier), { recursive: true });
  await writeFile(fichier, `// Données de démonstration en anglais canadien : traduction automatique, sans relecture\n// humaine (PLAN-bilingue-fr-en.md, piste B, lot B2). Table « texte français → anglais » :\n// une entrée absente affiche le français. Les noms de marque restent identiques.\n(window.I18N_DATA = window.I18N_DATA || {}).en = {\n${corps}\n};\n`, 'utf8');
  const metaFichier = path.join(NOTE_UI, 'i18n', 'traductions.meta.json');
  const meta = await lire(metaFichier).catch(() => ({}));
  meta['data-en.js'] = { traduction: 'automatique', sens: 'fr → en-CA', textes: cles.length, date: DATE };
  await ecrire(metaFichier, meta);
  console.log(`écrit : data-en.js (${cles.length} textes)`);
}

// ---------- lots

async function lots(fichierEntrees, dossier, taille = 500) {
  const { sens, items } = await lire(fichierEntrees);
  const glossaire = sens.startsWith('fr-en') ? (await lire(GLOSSAIRE)).termes.map(({ fr, en, ne_pas }) => ({ fr, en, ne_pas: ne_pas ?? [] })) : [];
  const n = Math.ceil(items.length / taille);
  for (let i = 0; i < n; i++) {
    const num = String(i + 1).padStart(3, '0');
    await ecrire(path.join(dossier, `lot-${num}.json`), {
      sens,
      consignes: CONSIGNES[sens],
      glossaire,
      sortie: path.join(dossier, `lot-${num}.sortie.json`),
      items: items.slice(i * taille, (i + 1) * taille),
    });
  }
  console.log(`${items.length} entrées → ${n} lot(s) de ${taille} au plus dans ${dossier}`);
}

// ---------- fusion

const valeurs = (s) => (s.match(/\{[^{}]+\}/g) ?? []).sort().join('|');
const echapper = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Les termes courts (« Non », « OK ») sont cherchés avec la casse : « non » dans « non précisé » n'est pas le terme.
const contientMot = (texte, mot) => new RegExp(`(^|[^\\p{L}])${echapper(mot)}(?=[^\\p{L}]|$)`, mot.length < 4 ? 'u' : 'iu').test(texte);

async function fusion(dossier, sortie) {
  const fichiers = (await readdir(dossier)).filter((f) => /^lot-\d+\.json$/.test(f)).sort();
  if (!fichiers.length) throw new Error(`aucun lot dans ${dossier}`);
  const traductions = {};
  const erreurs = [];
  const avertissements = [];

  for (const f of fichiers) {
    const lot = await lire(path.join(dossier, f));
    const sortieLot = await lire(lot.sortie).catch(() => null);
    if (!sortieLot) {
      erreurs.push(`${path.basename(lot.sortie)} absent ou illisible`);
      continue;
    }
    const attendus = new Set(lot.items.map((it) => it.id));
    for (const k of Object.keys(sortieLot)) if (!attendus.has(k)) avertissements.push(`${f} : identifiant en trop « ${k} »`);

    for (const it of lot.items) {
      const t = sortieLot[it.id];
      if (typeof t !== 'string' || !t.trim()) {
        erreurs.push(`${it.id} : traduction absente`);
        continue;
      }
      if (valeurs(it.texte) !== valeurs(t)) erreurs.push(`${it.id} : {valeurs} différentes (« ${it.texte} » → « ${t} »)`);
      if (lot.sens.startsWith('fr-en')) {
        for (const terme of lot.glossaire) {
          if (contientMot(it.texte, terme.fr) && !t.toLowerCase().includes(terme.en.toLowerCase())) {
            avertissements.push(`${it.id} : « ${terme.fr} » devrait être « ${terme.en} » (obtenu « ${t} »)`);
          }
          for (const interdit of terme.ne_pas) {
            if (contientMot(t, interdit)) avertissements.push(`${it.id} : forme déconseillée « ${interdit} » (glossaire : « ${terme.en} »)`);
          }
        }
      }
      traductions[it.id] = t.trim();
    }
  }

  const voir = (liste) => liste.slice(0, 40).map((e) => `  - ${e}`).join('\n');
  console.log(`${Object.keys(traductions).length} traductions, ${erreurs.length} erreur(s), ${avertissements.length} avertissement(s)`);
  if (avertissements.length) console.log(`avertissements (40 premiers) :\n${voir(avertissements)}`);
  if (erreurs.length) {
    console.error(`erreurs (40 premières) :\n${voir(erreurs)}`);
    process.exitCode = 1;
    return;
  }
  await ecrire(sortie, traductions);
  console.log(`écrit : ${sortie}`);
}

// ---------- construire

async function construire(fichierCim10, fichierSnomed) {
  const tc = await lire(fichierCim10);
  const ts = await lire(fichierSnomed);
  const t = (table, id) => {
    if (!table[id]) throw new Error(`traduction absente : ${id}`);
    return table[id];
  };

  const lignes = await lire(path.join(NOTE_UI, 'cim10-fr-clinique.json'));
  const hier = await lire(path.join(NOTE_UI, 'cim10-hierarchy.json'));
  const snomed = await lire(path.join(NOTE_UI, 'snomed-diagnostics.json'));

  await ecrire(
    path.join(NOTE_UI, 'cim10-en-clinique.json'),
    lignes.map((r) => ({ code: r.code, libelle: t(tc, idLigne(r)), ...(r.generic ? { generic: true } : {}) })),
  );
  await ecrire(path.join(NOTE_UI, 'cim10-hierarchy-en.json'), {
    _meta: hier._meta,
    chapters: hier.chapters.map((c) => ({ ...c, libelle: t(tc, idChapitre(c)) })),
    blocks: hier.blocks.map((b) => ({ ...b, libelle: t(tc, idBloc(b)) })),
    parents: hier.parents.map((p) => ({ ...p, libelle: t(tc, idParent(p)) })),
    ajouts: hier.ajouts.map((a) => ({ ...a, libelle: t(tc, idAjout(a)) })),
    frequents: hier.frequents,
  });
  await ecrire(path.join(NOTE_UI, 'snomed-diagnostics-fr.json'), {
    _meta: {
      ...snomed._meta,
      colonnes: [...snomed._meta.colonnes, 'terme préféré (fr)'],
      traduction: 'automatique',
    },
    concepts: snomed.concepts.map((c) => [...c, t(ts, idConcept(c))]),
  });
  // Fusion avec le fichier existant : construire ne réécrit que les trois fichiers CIM-10 et SNOMED.
  const metaFichier = path.join(NOTE_UI, 'i18n', 'traductions.meta.json');
  const meta = await lire(metaFichier).catch(() => ({}));
  await ecrire(metaFichier, {
    ...meta,
    'cim10-en-clinique.json': { traduction: 'automatique', sens: 'fr → en-CA', lignes: lignes.length, date: DATE },
    'cim10-hierarchy-en.json': { traduction: 'automatique', sens: 'fr → en-CA', libelles: hier.chapters.length + hier.blocks.length + hier.parents.length + hier.ajouts.length, date: DATE },
    'snomed-diagnostics-fr.json': { traduction: 'automatique', sens: 'en → fr', lignes: snomed.concepts.length, date: DATE },
    methode: 'IA par lots avec glossaire ; contrôles automatiques (couverture, {valeurs}, glossaire). Aucune relecture humaine.',
  });
  console.log(`écrit : cim10-en-clinique.json (${lignes.length}), cim10-hierarchy-en.json, snomed-diagnostics-fr.json (${snomed.concepts.length}), i18n/traductions.meta.json`);
}

// ---------- dispatch

const AIDE = `usage :
  node tools/i18n-translate.mjs entrees <dossier>
  node tools/i18n-translate.mjs lots <entrees.json> <dossier> [taille]
  node tools/i18n-translate.mjs fusion <dossier> <sortie.json>
  node tools/i18n-translate.mjs construire <trad-cim10.json> <trad-snomed.json>
  node tools/i18n-translate.mjs donnees-entrees <sortie.json>
  node tools/i18n-translate.mjs donnees <trad-donnees.json>`;

const [commande, ...args] = process.argv.slice(2);
try {
  switch (commande) {
    case 'entrees': await entrees(args[0]); break;
    case 'donnees-entrees': await donneesEntrees(args[0]); break;
    case 'donnees': await donnees(args[0]); break;
    case 'lots': await lots(args[0], args[1], args[2] ? Number(args[2]) : undefined); break;
    case 'fusion': await fusion(args[0], args[1]); break;
    case 'construire': await construire(args[0], args[1]); break;
    default: console.error(AIDE); process.exitCode = 2;
  }
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
}
