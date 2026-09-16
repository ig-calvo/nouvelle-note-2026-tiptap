/* global React */
// =========================================================
// review-mode.jsx — Mode révision (track changes) pour la note clinique.
//
// Approche : marks Tiptap `insertion`/`deletion` + une extension avec un
// plugin ProseMirror `appendTransaction` qui « marque au lieu de
// supprimer » (voir buildTrackingTr). Pas de changeId persisté : un
// « changement » est un run contigu de text nodes portant le même type de
// mark et le même auteur — calculé à la volée par scanReviewChanges,
// jamais stocké. Les marks vivent dans le JSON Tiptap, donc les
// changements survivent aux brouillons et au démontage/remontage de
// NoteBody gratuitement.
//
// Toute transaction ÉMISE PAR ce module (accept/reject, insertion IA déjà
// marquée) porte `meta('reviewAction', true)` — le tracker l'ignore. Sans
// cette règle, accepter une suppression la re-marquerait aussitôt comme
// une nouvelle suppression (boucle).
// =========================================================

// ---------------------------------------------------------
// Auteurs simulés — l'IA est un acteur à part, les auteurs humains sont
// dérivés du nom de médecin courant + un second clinicien en dur (repris
// de NotesList.jsx, seul autre acteur humain du prototype). La couleur des
// marques n'est PAS portée par l'auteur — voir reviewMarkColor ci-dessous :
// elle dépend du type de changement (ajout/suppression), avec l'IA en
// exception pour ses ajouts.
// ---------------------------------------------------------
const REVIEW_AI_AUTHOR = { id: 'ai', name: 'Assistant IA' };

function reviewHumanAuthors(doctorName) {
  return [
    { id: 'me', name: doctorName || 'Médecin' },
    { id: 'lefebvre', name: 'Dr Marc Lefebvre' }
  ];
}

function reviewAuthorById(doctorName, id) {
  return reviewHumanAuthors(doctorName).concat([REVIEW_AI_AUTHOR]).find(function (a) { return a.id === id; })
    || reviewHumanAuthors(doctorName)[0];
}

// Couleur d'une marque — sémantique (ajout = vert, suppression = rouge),
// avec une exception : un ajout de l'Assistant IA reste mauve pour rester
// repérable même une fois accepté visuellement au premier coup d'œil.
// Jamais un rouge pour un ajout ni un vert pour une suppression : la
// couleur encode l'ACTION, pas qui l'a faite (le nom de l'auteur reste
// dans le tooltip et le popover).
const REVIEW_COLOR_INSERT = 'var(--omd-success, #39ab49)';
const REVIEW_COLOR_DELETE = 'var(--omd-error-700, #b00020)';
const REVIEW_COLOR_AI = 'var(--omd-primary-400, #6967d1)';
function reviewMarkColor(kind, authorId) {
  if (kind === 'deletion') return REVIEW_COLOR_DELETE;
  return authorId === 'ai' ? REVIEW_COLOR_AI : REVIEW_COLOR_INSERT;
}

function fmtReviewDate(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const months = ['jan.', 'fév.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  return d.getDate() + ' ' + months[d.getMonth()] + ' à ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

// ---------------------------------------------------------
// Marks — insertion (inclusive : la frappe au bord étend le mark) et
// deletion (non-inclusive : taper à côté d'un passage barré ne doit pas
// hériter du marquage). Factories appelées seulement à la construction de
// l'éditeur (voir buildEditorExtensions dans editor-schema.jsx) — jamais
// au parse du script, même piège que les node.create() de ce fichier.
// ---------------------------------------------------------
function reviewMarkAttrs() {
  return {
    authorId: { default: null },
    authorName: { default: '' },
    color: { default: '#1975d1' },
    ts: { default: null }
  };
}

function reviewMarkParseHTML(tag) {
  return [{
    tag: tag,
    getAttrs(dom) {
      return {
        authorId: dom.getAttribute('data-author-id'),
        authorName: dom.getAttribute('data-author-name') || '',
        color: dom.getAttribute('data-color') || '#1975d1',
        ts: dom.getAttribute('data-ts') ? Number(dom.getAttribute('data-ts')) : null
      };
    }
  }];
}

function reviewMarkRenderHTML(cls, verb) {
  return function ({ mark }) {
    const title = verb + ' par ' + (mark.attrs.authorName || '?') + (mark.attrs.ts ? ' — ' + fmtReviewDate(mark.attrs.ts) : '');
    return ['span', {
      class: cls,
      style: '--rvw-c:' + (mark.attrs.color || '#1975d1'),
      'data-author-id': mark.attrs.authorId,
      'data-author-name': mark.attrs.authorName,
      'data-color': mark.attrs.color,
      'data-ts': mark.attrs.ts,
      title: title
    }, 0];
  };
}

function makeInsertionMark() {
  return window.Tiptap.Mark.create({
    name: 'insertion',
    inclusive: true,
    addAttributes: reviewMarkAttrs,
    parseHTML() { return reviewMarkParseHTML('span.rvw-ins'); },
    renderHTML: reviewMarkRenderHTML('rvw-ins', 'Inséré')
  });
}

function makeDeletionMark() {
  return window.Tiptap.Mark.create({
    name: 'deletion',
    inclusive: false,
    addAttributes: reviewMarkAttrs,
    parseHTML() { return reviewMarkParseHTML('span.rvw-del'); },
    renderHTML: reviewMarkRenderHTML('rvw-del', 'Supprimé')
  });
}

// ---------------------------------------------------------
// Tracker — plugin ProseMirror appendTransaction. Lit l'état courant sur
// window.__REVIEW_STATE (pont posé par NoteEditor.jsx, même pattern que
// window.__SHOW_CLINICAL_TOOLS) plutôt que de reconfigurer l'éditeur à
// chaque changement d'auteur ou d'activation.
// ---------------------------------------------------------

// Aplatit les text nodes d'une Slice (contenu avant un remplacement) en
// runs {text, marks} — insère un espace entre deux blocs pour ne pas
// coller deux mots de paragraphes différents en un seul run barré.
function collectTextRuns(slice) {
  const runs = [];
  let sawBlockBreak = false;
  slice.content.forEach(function (node) {
    walkForRuns(node);
  });
  function walkForRuns(node) {
    if (node.isText) {
      if (sawBlockBreak && runs.length) { runs.push({ text: ' ', marks: [] }); }
      sawBlockBreak = false;
      runs.push({ text: node.text, marks: node.marks });
      return;
    }
    if (node.isBlock && runs.length) sawBlockBreak = true;
    node.content.forEach(walkForRuns);
    if (node.isBlock) sawBlockBreak = true;
  }
  return runs;
}

function buildTrackingTr(transactions, oldState, newState, author, TextSelection) {
  const schema = newState.schema;
  const insType = schema.marks.insertion;
  const delType = schema.marks.deletion;
  if (!insType || !delType) return null;
  const ts = Date.now();
  const insertAttrs = { authorId: author.id, authorName: author.name, ts: ts, color: reviewMarkColor('insertion', author.id) };
  const deleteAttrs = { authorId: author.id, authorName: author.name, ts: ts, color: reviewMarkColor('deletion', author.id) };
  const tr = newState.tr.setMeta('reviewAction', true);

  // Aplatit tous les steps des transactions candidates, avec le doc juste
  // avant chaque step (nécessaire pour lire le contenu supprimé).
  const steps = [];
  transactions.forEach(function (t) {
    let before = t.before;
    t.steps.forEach(function (s) {
      steps.push({ step: s, before: before });
      before = s.apply(before).doc || before;
    });
  });

  // Mappe une position exprimée juste après le step d'index `idx` vers sa
  // position finale : d'abord à travers les steps restants de ce lot de
  // transactions, puis à travers `tr` (les insertions déjà faites plus tôt
  // dans cette même passe).
  function toFinal(pos, idx, assoc) {
    let p = pos;
    for (let k = idx + 1; k < steps.length; k++) p = steps[k].step.getMap().map(p, assoc);
    return tr.mapping.map(p, assoc);
  }

  let caret = null;
  steps.forEach(function (entry, idx) {
    const step = entry.step, before = entry.before;
    if (step.jsonID !== 'replace' && step.jsonID !== 'replaceAround') return;
    const pureDelete = step.slice.size === 0;

    // ── Suppression : réinsère le contenu retiré, barré, au point de
    // suppression (biais gauche : le barré atterrit AVANT le contenu de
    // remplacement éventuel) ──
    if (step.to > step.from) {
      const runs = collectTextRuns(before.slice(step.from, step.to));
      const at0 = toFinal(step.from, idx, -1);
      let at = at0;
      runs.forEach(function (run) {
        if (!run.text) return;
        const ownInsertion = run.marks.some(function (m) { return m.type === insType && m.attrs.authorId === author.id; });
        if (ownInsertion) return; // supprimer sa propre insertion en attente = annulation nette
        const alreadyDeleted = run.marks.some(function (m) { return m.type === delType; });
        const marks = alreadyDeleted
          ? run.marks
          : run.marks.filter(function (m) { return m.type !== insType; }).concat(delType.create(deleteAttrs));
        tr.insert(at, schema.text(run.text, marks));
        at += run.text.length;
      });
      if (pureDelete && at > at0) {
        const backspace = oldState.selection.head >= step.to;
        caret = backspace ? at0 : at;
      }
    }

    // ── Insertion : marque la plage insérée. Réutilise la marque d'un
    // caractère d'insertion adjacent du même auteur (même attrs, même ts)
    // plutôt que d'en créer une nouvelle à chaque frappe : sans ça, chaque
    // caractère tapé porte un `ts` distinct et ProseMirror ne peut jamais
    // fusionner les text nodes adjacents (fragmentation du doc, horodatage
    // qui ne reflète plus le début réel de la saisie). ──
    step.getMap().forEach(function (oldStart, oldEnd, newStart, newEnd) {
      if (newEnd <= newStart) return;
      const start = toFinal(newStart, idx, 1);
      const end = toFinal(newEnd, idx, -1);
      let reuse = null;
      try {
        const before = tr.doc.resolve(start).nodeBefore;
        if (before && before.isText) {
          const m = before.marks.find(function (mk) { return mk.type === insType && mk.attrs.authorId === author.id; });
          if (m) reuse = m;
        }
      } catch (e) {}
      tr.addMark(start, end, reuse || insType.create(insertAttrs));
    });
  });

  if (!tr.steps.length) return null;
  if (caret != null) {
    try { tr.setSelection(TextSelection.create(tr.doc, Math.min(caret, tr.doc.content.size))); } catch (e) {}
  }
  return tr;
}

function makeReviewTrackerExtension() {
  const pm = window.Tiptap.pm;
  return window.Tiptap.Extension.create({
    name: 'reviewTracker',
    addProseMirrorPlugins() {
      return [new pm.Plugin({
        key: new pm.PluginKey('reviewTracker'),
        appendTransaction(transactions, oldState, newState) {
          const st = window.__REVIEW_STATE;
          if (!st || !st.active || !st.author) return null;
          if (!transactions.some(function (t) { return t.docChanged; })) return null;
          if (transactions.some(function (t) { return t.getMeta('reviewAction') || t.getMeta('history$'); })) return null;
          try {
            return buildTrackingTr(transactions, oldState, newState, st.author, pm.TextSelection);
          } catch (e) {
            console.warn('reviewTracker : modification non suivie', e);
            return null;
          }
        }
      })];
    }
  });
}

function buildReviewExtensions() {
  return [makeInsertionMark(), makeDeletionMark(), makeReviewTrackerExtension()];
}

// ---------------------------------------------------------
// Scan — un « changement » = run contigu de text nodes {même type de mark,
// même auteur}. Recalculé sur chaque `update` de l'éditeur (voir
// NoteEditor.jsx), jamais persisté.
// ---------------------------------------------------------
function scanReviewChanges(doc) {
  const changes = [];
  doc.descendants(function (node, pos) {
    if (!node.isText) return;
    const m = node.marks.find(function (mk) { return mk.type.name === 'insertion' || mk.type.name === 'deletion'; });
    if (!m) return;
    const last = changes[changes.length - 1];
    if (last && last.to === pos && last.kind === m.type.name && last.authorId === m.attrs.authorId) {
      last.to = pos + node.nodeSize;
      last.text += node.text;
    } else {
      changes.push({
        id: m.type.name + ':' + pos,
        kind: m.type.name,
        from: pos,
        to: pos + node.nodeSize,
        authorId: m.attrs.authorId,
        authorName: m.attrs.authorName,
        color: m.attrs.color,
        ts: m.attrs.ts,
        text: node.text
      });
    }
  });
  return changes;
}

// Résolution — toujours dans UNE tr `meta reviewAction`, positions
// traitées en ordre décroissant pour rester valides après chaque delete.
// accepter une insertion / refuser une suppression = on garde le texte,
// on retire juste le marquage. refuser une insertion / accepter une
// suppression = le texte disparaît réellement.
function resolveChanges(editor, changes, accept) {
  if (!changes.length) return;
  editor.chain().command(function (props) {
    const tr = props.tr;
    tr.setMeta('reviewAction', true);
    changes.slice().sort(function (a, b) { return b.from - a.from; }).forEach(function (c) {
      const kill = (c.kind === 'insertion') !== accept;
      if (kill) tr.delete(c.from, c.to);
      else tr.removeMark(c.from, c.to, props.state.schema.marks[c.kind]);
    });
    return true;
  }).run();
}

function acceptChange(editor, change) { resolveChanges(editor, [change], true); }
function rejectChange(editor, change) { resolveChanges(editor, [change], false); }
function acceptAllChanges(editor) { resolveChanges(editor, scanReviewChanges(editor.state.doc), true); }
function rejectAllChanges(editor) { resolveChanges(editor, scanReviewChanges(editor.state.doc), false); }

// Décore récursivement les text nodes d'un tableau de blocs JSON avec le
// mark insertion — utilisé pour le texte inséré par l'Assistant IA, marqué
// dès sa création (pas de passage par le tracker, voir NoteEditor.jsx).
function markBlocksAsInsertion(blocks, author) {
  const attrs = { authorId: author.id, authorName: author.name, ts: Date.now(), color: reviewMarkColor('insertion', author.id) };
  function walk(node) {
    if (node.type === 'text') {
      const marks = (node.marks || []).filter(function (m) { return m.type !== 'insertion'; }).concat([{ type: 'insertion', attrs: attrs }]);
      return Object.assign({}, node, { marks: marks });
    }
    if (node.content) return Object.assign({}, node, { content: node.content.map(walk) });
    return node;
  }
  return blocks.map(walk);
}

// Retrouve le changement (scan) qui contient la position DOM cliquée.
function findChangeAtDom(editor, domNode) {
  let pos;
  try { pos = editor.view.posAtDOM(domNode, 0); } catch (e) { return null; }
  const changes = scanReviewChanges(editor.state.doc);
  return changes.find(function (c) { return pos >= c.from && pos < c.to; }) || null;
}

// ---------------------------------------------------------
// UI — popover ✓/✗ (calqué sur ChipPopover, editor-popover.jsx), contrôles
// d'en-tête (toggle + compteur + tout accepter/refuser), dialogue de
// complétion bloquant.
// ---------------------------------------------------------
function ReviewChangePopover({ change, anchorRect, onClose, onAccept, onReject }) {
  const ref = React.useRef(null);
  React.useEffect(function () {
    function onDoc(e) { if (ref.current && !ref.current.contains(e.target) && !e.target.closest('.rvw-ins, .rvw-del')) onClose(); }
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return function () { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [onClose]);
  if (!anchorRect) return null;
  const W = 300;
  const top = anchorRect.bottom + 8;
  let left = anchorRect.left;
  if (left + W > window.innerWidth - 16) left = Math.max(12, window.innerWidth - W - 16);
  const verb = change.kind === 'insertion' ? 'Insertion' : 'Suppression';
  return (
    <div ref={ref} style={Object.assign({}, rvwS.popover, { top: top, left: left, width: W })} role="dialog">
      <div style={rvwS.popHead}>
        <span style={Object.assign({}, rvwS.popDot, { background: change.color })} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={rvwS.popTitle}>{verb} — {change.authorName}</div>
          <div style={rvwS.popSub}>{fmtReviewDate(change.ts)}</div>
        </div>
      </div>
      <div style={rvwS.popText}>{change.text.length > 90 ? change.text.slice(0, 90) + '…' : change.text}</div>
      <div style={rvwS.popActions}>
        <button type="button" style={rvwS.popBtnReject} onClick={function () { onReject(change); onClose(); }}>
          <span className="material-icons-outlined" style={{ fontSize: 17 }}>close</span> Refuser
        </button>
        <button type="button" style={rvwS.popBtnAccept} onClick={function () { onAccept(change); onClose(); }}>
          <span className="material-icons-outlined" style={{ fontSize: 17 }}>check</span> Accepter
        </button>
      </div>
    </div>
  );
}

function ReviewHeaderControls({ active, onToggle, count, onAcceptAll, onRejectAll }) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  return (
    <div style={rvwS.headerRow}>
      <button
        type="button"
        title={active ? 'Désactiver le mode révision' : 'Activer le mode révision'}
        aria-pressed={active}
        onClick={onToggle}
        style={Object.assign({}, rvwS.toggleBtn, active ? rvwS.toggleBtnOn : {})}>
        <span className="material-icons-outlined" style={{ fontSize: 18 }}>rate_review</span>
        Mode révision
      </button>
      {active && count > 0 &&
        <div style={{ position: 'relative' }}>
          <button type="button" style={rvwS.countBtn} onClick={function () { setMenuOpen(function (v) { return !v; }); }}>
            {count} modification{count > 1 ? 's' : ''}
            <span className="material-icons-outlined" style={{ fontSize: 16 }}>arrow_drop_down</span>
          </button>
          {menuOpen &&
            <React.Fragment>
              <div style={rvwS.menuBg} onClick={function () { setMenuOpen(false); }} />
              <div style={rvwS.countMenu}>
                <button type="button" style={rvwS.countMenuItem} onClick={function () { onAcceptAll(); setMenuOpen(false); }}>
                  <span className="material-icons-outlined" style={{ fontSize: 17, color: '#1F8A5B' }}>done_all</span> Tout accepter
                </button>
                <button type="button" style={rvwS.countMenuItem} onClick={function () { onRejectAll(); setMenuOpen(false); }}>
                  <span className="material-icons-outlined" style={{ fontSize: 17, color: '#b3261e' }}>remove_done</span> Tout refuser
                </button>
              </div>
            </React.Fragment>}
        </div>}
    </div>
  );
}

function ReviewCompleteDialog({ count, onAcceptAllAndComplete, onReview, onCancel }) {
  return (
    <div style={rvwS.dialogScrim}>
      <div style={rvwS.dialogBox} role="dialog">
        <div style={rvwS.dialogTitle}>Modifications en attente</div>
        <p style={rvwS.dialogText}>
          Il reste {count} modification{count > 1 ? 's' : ''} en révision dans cette note. Que voulez-vous faire avant de compléter ?
        </p>
        <div style={rvwS.dialogActions}>
          <button type="button" style={rvwS.dialogBtnGhost} onClick={onCancel}>Annuler</button>
          <button type="button" style={rvwS.dialogBtnOutline} onClick={onReview}>Réviser</button>
          <button type="button" style={rvwS.dialogBtnPrimary} onClick={onAcceptAllAndComplete}>Tout accepter et compléter</button>
        </div>
      </div>
    </div>
  );
}

const rvwS = {
  headerRow: { display: 'flex', alignItems: 'center', gap: 8 },
  toggleBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid #c9c9d6', borderRadius: 8, background: '#fff', padding: '7px 12px', font: "500 13.5px 'Inter',sans-serif", color: 'rgba(0,0,0,0.72)', cursor: 'pointer', whiteSpace: 'nowrap' },
  toggleBtnOn: { background: '#ebf6ff', border: '1px solid #1975d1', color: '#1975d1' },
  countBtn: { display: 'inline-flex', alignItems: 'center', gap: 2, border: '1px solid #c9c9d6', borderRadius: 8, background: '#fff', padding: '7px 8px 7px 12px', font: "500 13px 'Inter',sans-serif", color: 'rgba(0,0,0,0.72)', cursor: 'pointer', whiteSpace: 'nowrap' },
  menuBg: { position: 'fixed', inset: 0, zIndex: 199 },
  countMenu: { position: 'absolute', top: 'calc(100% + 6px)', right: 0, background: '#fff', border: '1px solid #e3e3ea', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.14)', zIndex: 200, minWidth: 180, padding: '5px 0' },
  countMenuItem: { display: 'flex', alignItems: 'center', gap: 8, width: '100%', border: 0, background: 'transparent', padding: '9px 14px', font: "400 13.5px 'Inter',sans-serif", color: 'rgba(0,0,0,0.8)', cursor: 'pointer', textAlign: 'left' },

  popover: { position: 'fixed', zIndex: 90, background: '#fff', border: '1px solid #e3e3ea', borderRadius: 10, boxShadow: '0 8px 24px rgba(37,36,94,0.18)', padding: '12px 14px', fontFamily: "'Inter',sans-serif" },
  popHead: { display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  popDot: { width: 10, height: 10, borderRadius: '50%', marginTop: 4, flexShrink: 0 },
  popTitle: { font: "600 13px 'Inter',sans-serif", color: 'rgba(0,0,0,0.85)' },
  popSub: { font: "400 11.5px 'Inter',sans-serif", color: 'rgba(0,0,0,0.5)' },
  popText: { font: "400 13px/1.5 'Inter',sans-serif", color: 'rgba(0,0,0,0.7)', background: '#f7f7fb', borderRadius: 6, padding: '6px 8px', marginBottom: 10, wordBreak: 'break-word' },
  popActions: { display: 'flex', gap: 8 },
  popBtnReject: { flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4, border: '1px solid #e0b3ae', borderRadius: 8, background: '#fff', color: '#b3261e', padding: '7px 0', font: "500 13px 'Inter',sans-serif", cursor: 'pointer' },
  popBtnAccept: { flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4, border: 0, borderRadius: 8, background: '#1F8A5B', color: '#fff', padding: '7px 0', font: "500 13px 'Inter',sans-serif", cursor: 'pointer' },

  dialogScrim: { position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(20,20,40,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'snm-fade 160ms ease-out' },
  dialogBox: { width: 440, maxWidth: 'calc(100vw - 32px)', background: '#fff', borderRadius: 14, padding: '22px 24px', boxShadow: '0 20px 48px rgba(0,0,0,0.24)', fontFamily: "'Inter',sans-serif", animation: 'snm-pop 180ms ease-out' },
  dialogTitle: { font: "600 17px 'Poppins',sans-serif", color: 'rgba(0,0,0,0.88)', marginBottom: 8 },
  dialogText: { font: "400 14px/1.55 'Inter',sans-serif", color: 'rgba(0,0,0,0.65)', margin: '0 0 20px' },
  dialogActions: { display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' },
  dialogBtnGhost: { border: 0, background: 'transparent', color: 'rgba(0,0,0,0.6)', borderRadius: 8, padding: '9px 14px', font: "500 13.5px 'Inter',sans-serif", cursor: 'pointer' },
  dialogBtnOutline: { border: '1px solid #c9c9d6', background: '#fff', color: '#25245E', borderRadius: 8, padding: '9px 16px', font: "600 13.5px 'Inter',sans-serif", cursor: 'pointer' },
  dialogBtnPrimary: { border: 0, background: '#25245E', color: '#fff', borderRadius: 8, padding: '9px 16px', font: "600 13.5px 'Inter',sans-serif", cursor: 'pointer' }
};

Object.assign(window, {
  REVIEW_AI_AUTHOR,
  reviewHumanAuthors,
  reviewAuthorById,
  fmtReviewDate,
  buildReviewExtensions,
  scanReviewChanges,
  resolveChanges,
  acceptChange,
  rejectChange,
  acceptAllChanges,
  rejectAllChanges,
  markBlocksAsInsertion,
  findChangeAtDom,
  ReviewChangePopover,
  ReviewHeaderControls,
  ReviewCompleteDialog
});
