// Imagerie de la tête : les examens courants (cerveau, vaisseaux, sinus, face,
// oreille interne) sont proposés dans /img, avec des valeurs que le formulaire
// d'une puce sait afficher, et chacun a son anglais.
// Lancer : node --test project/tests/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPrototype } from './harness.mjs';

const w = loadPrototype(['note-ui/editor-data.jsx']);
const D = w.NOTE_DATA;
const HEAD = ['tdmcereb', 'irmcereb', 'irmcerebc', 'angiotdmcereb', 'tdmsinus', 'tdmface', 'irmcai'];
const AVEC_CONTRASTE = /avec contraste|with contrast/i;
const MODALITES = ['Radiographie', 'Échographie', 'TDM', 'IRM']; // les options du formulaire (ImgFields)
const items = () => D.ORDER_DEFS.img.items();
const names = (list) => list.map((it) => it.name);

test('/img propose les examens courants de la tête, chacun une seule fois', () => {
  const keys = items().map((it) => it.key);
  for (const k of HEAD) assert.ok(keys.includes(k), 'examen absent : ' + k);
  assert.equal(new Set(keys).size, keys.length, 'clé en double');
  assert.equal(new Set(names(items())).size, items().length, 'nom en double');
});

test('chaque examen de la tête a des valeurs que le formulaire sait afficher', () => {
  for (const it of items().filter((x) => HEAD.includes(x.key))) {
    const d = it.details;
    assert.ok(MODALITES.includes(d.modality), `${it.key} : modalité ${d.modality}`);
    assert.ok(D.FIELD_OPTIONS.priority.includes(d.priority), `${it.key} : priorité ${d.priority}`);
    assert.ok(['Avec', 'Sans'].includes(d.contrast), `${it.key} : contraste ${d.contrast}`);
    assert.ok(it.sig && it.chipSig && d.region && d.context, `${it.key} : texte manquant`);
    // Un examen avec contraste le dit dans sa ligne ; un examen sans contraste ne le prétend pas.
    const avec = d.contrast === 'Avec';
    assert.equal(AVEC_CONTRASTE.test(it.sig), avec, `${it.key} : sig ${it.sig}`);
    assert.equal(AVEC_CONTRASTE.test(it.chipSig), avec, `${it.key} : chipSig ${it.chipSig}`);
  }
});

test('sans texte tapé, le menu montre les plus fréquents : IRM cérébrale et TDM des sinus', () => {
  D.endOrderSearch();
  const r = D.searchOrder('img', '');
  const shown = names([].concat(r.favoris, r.frequents));
  assert.ok(shown.includes(w.TR('IRM cérébrale')));
  assert.ok(shown.includes(w.TR('TDM des sinus')));
  assert.ok(shown.includes(w.TR('TDM cérébrale')));
  D.endOrderSearch();
});

test('la recherche trouve les examens de la tête, avec ou sans accents', () => {
  const find = (q) => { D.endOrderSearch(); const r = D.searchOrder('img', q); return names([].concat(r.favoris, r.frequents, r.autres)); };
  assert.ok(find('irm cereb').includes(w.TR('IRM cérébrale avec contraste')));
  assert.ok(find('angio').includes(w.TR('Angio-TDM cérébrale')));
  assert.ok(find('sinus').includes(w.TR('TDM des sinus')));
  assert.ok(find('facial').includes(w.TR('TDM du massif facial')));
  assert.ok(find('auditifs').includes(w.TR('IRM des conduits auditifs internes')));
  D.endOrderSearch();
});

test('le nom d’une puce re-dérivée (modalité + région + vues) est traduit pour chaque examen de la tête', () => {
  for (const it of items().filter((x) => HEAD.includes(x.key))) {
    const rx = D.deriveImgRx(it.details);
    assert.ok(rx.name && rx.name !== w.t('data.imagingRequest.text'), `${it.key} : nom ${rx.name}`);
    if (process.env.I18N_TEST_LANG === 'en') {
      // Aucune valeur de champ ne reste en français quand la langue est l'anglais.
      for (const f of ['region', 'views']) {
        if (!it.details[f]) continue;
        assert.notEqual(D.valueLabel(it.details[f]), it.details[f], `${it.key} : « ${it.details[f]} » non traduit`);
      }
    }
  }
});
