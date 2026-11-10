// Liste du « # » : gabarits de note et textes rapides dans une seule recherche.
// « / » n'offre plus les gabarits tapés (/pneumo…) : il garde les items
// « Gabarits de note » et « Textes rapides », qui ouvrent la liste du « # ».
// Lancer : node --test project/tests/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPrototype } from './harness.mjs';

const w = loadPrototype(['note-ui/note-sections.jsx', 'note-ui/diagnostics.jsx', 'note-ui/editor-data.jsx', 'note-ui/editor-schema.jsx']);
const D = w.NOTE_DATA;
const NO_CTX = { notes: [], sommaire: [] };
const PNEUMONIE = { id: 'dx-1', name: 'Pneumonie', code: 'J18.9' };
const sections = (rows) => [...new Set(rows.map((r) => r.section))];
const notes = (rows) => rows.filter((r) => r.noteTemplate).map((r) => r.noteTemplate);
const quick = (rows) => rows.filter((r) => r.quickTextId).map((r) => r.quickTextId);

test('« # » vide : tous les gabarits de note, puis tous les textes rapides', () => {
  D.setPatientAllergies([]);
  const rows = D.searchTemplates('', null, NO_CTX);
  assert.deepEqual(notes(rows), D.NOTE_TEMPLATES.map((tpl) => tpl.key), 'les gabarits de note, dans leur ordre');
  assert.equal(quick(rows).length, D.QUICK_TEXTS.length, 'et chaque texte rapide');
  assert.deepEqual(sections(rows), [w.TR('Gabarits de note'), w.TR('Textes rapides')]);
  assert.ok(rows.every((r) => r.noKbd), 'pas de raccourci « / » affiché : on est déjà dans la liste');
  assert.equal(new Set(rows.map((r) => r.key)).size, rows.length, 'clés uniques');
});

test('la frappe filtre : par nom, par raccourci, sans accents ni casse, dans les deux langues', () => {
  D.setPatientAllergies([]);
  assert.deepEqual(notes(D.searchTemplates('pneumo', null, NO_CTX)), ['pneumonie']);
  assert.deepEqual(notes(D.searchTemplates('PNEUMO', null, NO_CTX)), ['pneumonie']);
  assert.ok(notes(D.searchTemplates('itu', null, NO_CTX)).includes('itu'), '« itu » : le raccourci des anciens /itu');
  assert.ok(notes(D.searchTemplates('virus', null, NO_CTX)).includes('virus'));
  assert.deepEqual(notes(D.searchTemplates('periodique', null, NO_CTX)), ['periodique'], 'sans accent');
  assert.deepEqual(D.searchTemplates('zzzzz', null, NO_CTX), []);
});

test('la recherche trouve aussi le nom dans l’autre langue', () => {
  const bi = loadPrototype(['note-ui/note-sections.jsx', 'note-ui/diagnostics.jsx', 'note-ui/editor-data.jsx', 'note-ui/editor-schema.jsx'],
    { data: { 'Première rencontre': 'First visit' } });
  const rows = bi.NOTE_DATA.searchTemplates('first', null, NO_CTX);
  assert.deepEqual(rows.filter((r) => r.noteTemplate).map((r) => r.noteTemplate), ['premiere']);
});

test('les textes rapides se cherchent par leur diagnostic, tous les mots tapés', () => {
  D.setPatientAllergies([]);
  const ids = quick(D.searchTemplates('pneumonie', null, NO_CTX));
  assert.ok(ids.includes('pac-ambu') && ids.includes('pac-allergie'));
  assert.deepEqual(quick(D.searchTemplates('pac allergie', null, NO_CTX)), ['pac-allergie']);
});

test('sous un diagnostic : ses textes rapides d’abord, puis les gabarits de note, puis les autres textes', () => {
  D.setPatientAllergies([]);
  const rows = D.searchTemplates('', PNEUMONIE, NO_CTX);
  assert.deepEqual(sections(rows), [w.t('field.pourDiagnostic.text', { name: 'Pneumonie' }), w.TR('Gabarits de note'), w.t('field.autresTextesRapides.text')]);
  const own = rows.filter((r) => r.section === sections(rows)[0]).map((r) => r.quickTextId);
  assert.ok(own.includes('pac-ambu') && own.includes('pac-allergie'), 'les textes de la pneumonie');
  const others = rows.filter((r) => r.section === sections(rows)[2]).map((r) => r.quickTextId);
  assert.ok(!others.some((id) => own.includes(id)), 'un texte n’est pas répété dans « autres »');
  assert.equal(own.length + others.length, D.QUICK_TEXTS.length);
  // Une recherche qui ne touche pas le diagnostic : pas de groupe vide.
  assert.deepEqual(sections(D.searchTemplates('pneumo', null, NO_CTX)), [w.TR('Gabarits de note'), w.TR('Textes rapides')]);
});

test('une allergie au dossier : la liste ne porte aucun avertissement et ne change pas d’ordre (RA-48)', () => {
  const before = D.getPatientAllergies();
  const rowsFor = (allergies) => { D.setPatientAllergies(allergies); return D.searchTemplates('', PNEUMONIE, NO_CTX); };
  try {
    const sans = rowsFor([]);
    const avec = rowsFor(['Pénicilline']);
    assert.deepEqual(avec, sans, 'la liste est la même avec ou sans allergie au dossier');
    assert.ok(avec.every((r) => !r.warn), 'aucune ligne ne porte d’avertissement d’allergie');
    const own = avec.filter((r) => r.section === avec[0].section).map((r) => r.quickTextId);
    assert.deepEqual(own, ['pac-ambu', 'pac-comorb', 'pac-allergie'], 'l’ordre des textes de la pneumonie, sans classement');
  } finally { D.setPatientAllergies(before); }
});

test('« / » : plus de gabarits tapés, mais les items qui ouvrent la liste du « # »', () => {
  ['pneumo', 'virus', 'itu', 'otite', 'suivi', 'premiere', 'periodique', 'aigu'].forEach((q) => {
    assert.ok(!w.filterSlashItems(q).some((it) => it.noteTemplate), '/' + q + ' ne propose plus de gabarit de note');
  });
  assert.ok(!w.filterSlashItems('').some((it) => it.noteTemplate));
  const entry = (key) => w.filterSlashItems('').find((it) => it.key === key);
  assert.ok(entry('note-templates').notePicker && entry('textes-rapides').textRapides, 'les deux items restent au menu');
  assert.ok(w.filterSlashItems('gabarit').some((it) => it.key === 'note-templates'), '« /gabarit » trouve l’item');
  assert.ok(w.filterSlashItems('texte').some((it) => it.key === 'textes-rapides'), '« /texte » aussi');
  [entry('note-templates'), entry('textes-rapides')].forEach((it) => {
    assert.equal(it.kbd, '#');
    assert.ok(it.kbdNoSlash && !it.noKbd, 'le menu affiche « # », pas « /# »');
  });
});
