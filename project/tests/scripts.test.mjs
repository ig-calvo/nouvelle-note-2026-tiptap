// Intégrité du chargeur de scripts (Note Clinique.html) : chaque fichier
// listé existe, et aucun nom de haut niveau (function/class/const/let) n'est
// déclaré deux fois entre les scripts — les <script type="text/babel">
// classiques partagent une seule portée lexicale globale, donc un doublon
// casse le chargement au complet avec un SyntaxError silencieux (page
// blanche). `var` est exempté : sa redéclaration est légale (ex.
// MEDS_STATUS_COLOR, répété tel quel dans Summary.jsx et SummaryModals.jsx).
// Lancer : node --test project/tests/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { projectDir } from './harness.mjs';

function readSrcsList() {
  const html = fs.readFileSync(path.join(projectDir, 'Note Clinique.html'), 'utf8');
  const m = /var srcs = \[([\s\S]*?)\];/.exec(html);
  assert.ok(m, 'le tableau `srcs` du chargeur est introuvable dans Note Clinique.html');
  const out = [];
  const re = /'([^']+)'/g;
  let mm;
  while ((mm = re.exec(m[1]))) out.push(mm[1]);
  assert.ok(out.length > 10, 'le tableau `srcs` extrait semble vide ou tronqué');
  return out;
}

// function/class/const/let/var en colonne 0 uniquement — le style du dépôt
// n'indente jamais une déclaration de haut niveau (vérifié sur les fichiers
// existants avant d'écrire ce test).
function topLevelNames(file) {
  const src = fs.readFileSync(path.join(projectDir, file), 'utf8');
  const out = [];
  const re = /^(?:export\s+)?(function\*?|class|const|let|var)\s+([A-Za-z_$][\w$]*)/gm;
  let m;
  while ((m = re.exec(src))) out.push({ kind: m[1].replace('*', ''), name: m[2] });
  return out;
}

const srcs = readSrcsList();

test('chaque fichier du chargeur existe', () => {
  for (const rel of srcs) {
    assert.ok(fs.existsSync(path.join(projectDir, rel)), `manquant : ${rel}`);
  }
});

test('aucun nom de haut niveau (function/class/const/let) n’est déclaré deux fois entre les scripts', () => {
  const bindings = new Map(); // name -> [{file, kind}]
  for (const rel of srcs) {
    for (const d of topLevelNames(rel)) {
      if (d.kind === 'var') continue; // redéclaration légale
      if (!bindings.has(d.name)) bindings.set(d.name, []);
      bindings.get(d.name).push({ file: rel, kind: d.kind });
    }
  }
  const dups = [...bindings.entries()].filter(([, arr]) => arr.length > 1);
  assert.deepEqual(dups, [], 'doublons trouvés : ' + JSON.stringify(dups));
});
