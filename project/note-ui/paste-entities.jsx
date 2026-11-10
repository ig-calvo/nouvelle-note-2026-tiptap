// =========================================================
// paste-entities.jsx — Copier-coller d'une entité (lot 4 de
// PLAN-gabarits-vision-v1.md ; D3 de la vision, Q5, RA-53).
//
// Une puce copiée porte sa provenance dans le HTML du presse-papiers : le
// patient et la note d'où elle vient (`data-origin-patient`,
// `data-origin-note`, posés par le rendu de la puce, editor-schema.jsx). Au
// collage, planChipPaste décide de ce qu'elle devient :
//   même note, la puce d'origine y est encore → une MENTION : sa propre
//                       identité (`cid`), mais la même référence (`ref`) ;
//                       jamais deux prescriptions pour une seule ;
//   même note, la puce d'origine n'y est plus (couper-coller) → elle se
//                       déplace, identité gardée ;
//   autre note, autre patient, ou provenance inconnue → une PRÉ-ENTITÉ :
//                       préremplie, sans le lien vers l'élément d'origine
//                       (identité neuve, plus de renouvellement ni d'ajustement
//                       d'une médication du dossier, plus de transmission),
//                       proposée par « Copie de … » ; elle n'entre dans la note
//                       que si le médecin l'accepte (D4).
// Un ajout proposé, une ligne à compléter (elle n'est pas encore dans la note) et
// une médication documentée ou mentionnée (elle vient du profil d'un dossier)
// ne se copient que comme texte hors de leur note.
//
// Ce fichier n'a pas de JSX et ne lit rien d'un autre fichier au chargement
// (window.t, window.PATIENT_KEY, window.newChipId se lisent à l'appel) : les
// tests le chargent tel quel (tests/paste-entities.test.mjs). Le branchement à
// l'éditeur (le plugin transformPasted) se vérifie dans le navigateur.
// =========================================================

// La note en cours d'écriture : un identifiant par note, renouvelé quand on en
// commence une autre (resetNote, NoteEditor.jsx). Le prototype n'en avait pas.
function newNoteSessionId() { return 'n' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
let _noteSession = newNoteSessionId();
function currentNoteId() { return _noteSession; }
function resetNoteSession() { _noteSession = newNoteSessionId(); }

// Noms des deux dossiers fictifs (patients.js), pour dire d'où vient une copie.
const PASTE_PATIENT_NAMES = { pediatrique: 'Geneviève Tremblay', adulte: 'Micheline Lamontagne' };

// Le texte d'une puce qui ne se copie que comme texte.
function pasteChipText(attrs) {
  return attrs.label || (attrs.rx && attrs.rx.name) || attrs.text || '';
}

// Ce que devient une puce collée. `attrs` : ses attrs après parseHTML, où
// `origin` = { patient, note, pending } lu dans le HTML copié, ou null.
// ctx : { patient, note, hasCid(cid), newCid(), patientName(key) }.
// → { how: 'text', text } | { how: 'keep' | 'mention' | 'preEntity', attrs }
function planChipPaste(attrs, ctx) {
  const origin = attrs.origin || null;
  // Un ajout proposé n'est pas encore dans la note : seul son nom se copie.
  if (origin && origin.pending) return { how: 'text', text: pasteChipText(attrs) };
  const clean = Object.assign({}, attrs, { origin: null });

  if (origin && origin.patient === ctx.patient && origin.note === ctx.note) {
    if (ctx.hasCid(attrs.cid)) {
      return { how: 'mention', attrs: Object.assign(clean, { cid: ctx.newCid(), ref: attrs.ref || attrs.cid }) };
    }
    return { how: 'keep', attrs: clean }; // couper-coller : la puce se déplace
  }

  // Une médication du profil n'a de sens que dans son dossier.
  if (attrs.type === 'medication') return { how: 'text', text: attrs.text || pasteChipText(attrs) };

  const kind = !origin ? 'inconnu' : (origin.patient !== ctx.patient ? 'patient' : 'note');
  const name = kind === 'patient' ? ctx.patientName(origin.patient) : null;
  const proposedBy = kind === 'patient' && name ? t('paste.copy.patient.text', { name: name })
    : kind === 'inconnu' ? t('paste.copy.unknown.text') : t('paste.copy.note.text');
  // Sans le lien vers l'élément d'origine : plus de renouvellement ni
  // d'ajustement d'une médication du dossier, plus de transmission.
  let rx = attrs.rx;
  if (rx) { rx = Object.assign({}, rx, { renewal: false }); delete rx.adjust; delete rx.adjustFrom; }
  return {
    how: 'preEntity',
    attrs: Object.assign(clean, {
      cid: ctx.newCid(), ref: null, rx: rx,
      pending: true, proposedBy: proposedBy, copyOf: kind, draft: null, warn: null, warnAfter: null,
      savedAt: null, author: null, transmittedAt: null, cancelledAt: null, transmitError: null
    })
  };
}

// Réécrit les puces d'un Slice ProseMirror collé. `Slice` et `Fragment`
// viennent du Slice reçu (le paquet Tiptap du prototype n'expose pas pm.model).
function rewriteChipsInSlice(slice, ctx) {
  const Slice = slice.constructor, Fragment = slice.content.constructor;
  let changed = false;
  function mapFragment(fragment) {
    const out = [];
    fragment.forEach(function (node) {
      if (node.type.name === 'chip') {
        changed = true;
        const plan = planChipPaste(node.attrs, ctx);
        if (plan.how === 'text') { if (plan.text) out.push(node.type.schema.text(plan.text, node.marks)); }
        else out.push(node.type.create(plan.attrs, null, node.marks));
      } else if (node.content && node.content.size) {
        out.push(node.copy(mapFragment(node.content)));
      } else {
        out.push(node);
      }
    });
    return Fragment.fromArray(out);
  }
  const content = mapFragment(slice.content);
  return changed ? new Slice(content, slice.openStart, slice.openEnd) : slice;
}

// Le contexte d'un collage dans l'éditeur : qui est là, et quels `cid` y sont pris.
function pasteContextFor(editor) {
  const used = {};
  editor.state.doc.descendants(function (n) { if (n.type.name === 'chip') used[n.attrs.cid] = true; });
  return {
    patient: window.PATIENT_KEY,
    note: currentNoteId(),
    hasCid: function (cid) { return !!used[cid]; },
    newCid: function () {
      let c = window.newChipId();
      while (used[c]) c = window.newChipId();
      used[c] = true;
      return c;
    },
    patientName: function (key) { return PASTE_PATIENT_NAMES[key] || null; }
  };
}

// Plugin ProseMirror : réécrit les puces de ce qu'on colle, avant de l'insérer.
// Appelée à la construction de l'éditeur (buildEditorExtensions), pas au parse.
function makePasteEntitiesExtension() {
  const pm = window.Tiptap.pm;
  return window.Tiptap.Extension.create({
    name: 'pasteEntities',
    addProseMirrorPlugins() {
      const editor = this.editor;
      return [new pm.Plugin({
        key: new pm.PluginKey('pasteEntities'),
        props: {
          transformPasted: function (slice) { return rewriteChipsInSlice(slice, pasteContextFor(editor)); }
        }
      })];
    }
  });
}

function buildPasteExtensions() { return [makePasteEntitiesExtension()]; }

Object.assign(window, {
  currentNoteId,
  resetNoteSession,
  planChipPaste,
  rewriteChipsInSlice,
  buildPasteExtensions
});
