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
// Lire et résoudre les changements (le texte marqué ET les entités en
// attente, d'un même geste) se fait dans proposed-changes.jsx ; ce fichier
// garde les marques, le traqueur, et l'interface : popover, barre, dialogue.
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
const REVIEW_AI_AUTHOR = { id: 'ai', name: t('ai.assistant.name') };

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
  return t('date.atTime', {
    date: d.toLocaleDateString(window.I18N.locale, { day: 'numeric', month: 'short' }),
    time: String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0')
  });
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
    color: { default: 'var(--mat-sys-primary)' },
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
        color: dom.getAttribute('data-color') || 'var(--mat-sys-primary)',
        ts: dom.getAttribute('data-ts') ? Number(dom.getAttribute('data-ts')) : null
      };
    }
  }];
}

function reviewMarkRenderHTML(cls, verb) {
  return function ({ mark }) {
    const who = mark.attrs.authorName || '?';
    const title = mark.attrs.ts ? t('review.markByAt.tooltip', { verb: verb, who: who, date: fmtReviewDate(mark.attrs.ts) }) : t('review.markBy.tooltip', { verb: verb, who: who });
    return ['span', {
      class: cls,
      style: '--rvw-c:' + (mark.attrs.color || 'var(--mat-sys-primary)'),
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
    renderHTML: reviewMarkRenderHTML('rvw-ins', t('review.inserted.text'))
  });
}

function makeDeletionMark() {
  return window.Tiptap.Mark.create({
    name: 'deletion',
    inclusive: false,
    addAttributes: reviewMarkAttrs,
    parseHTML() { return reviewMarkParseHTML('span.rvw-del'); },
    renderHTML: reviewMarkRenderHTML('rvw-del', t('review.deleted.text'))
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
// coller deux mots de paragraphes différents en un seul run barré. Une puce
// (nœud inline) est un run {node, marks} : elle reste en place, barrée
// (lot 1b, classifyDeletedRun dans proposed-changes.jsx).
function collectTextRuns(slice) {
  const runs = [];
  let sawBlockBreak = false;
  slice.content.forEach(function (node) {
    walkForRuns(node);
  });
  function walkForRuns(node) {
    if (node.isText || node.type.name === 'chip') {
      if (sawBlockBreak && runs.length) { runs.push({ text: ' ', marks: [] }); }
      sawBlockBreak = false;
      runs.push(node.isText ? { text: node.text, marks: node.marks } : { node: node, marks: node.marks });
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
    // Un ReplaceAroundStep « structurel » (ex. tr.setNodeMarkup — changer les
    // attrs d'un node sans toucher son contenu) porte structure:true : aucun
    // texte n'est réellement supprimé ni inséré, seule l'enveloppe change.
    // Le traiter comme un remplacement de texte réinsérerait tout le corps du
    // node en barré (le slice recouvre tout le contenu par construction d'un
    // ReplaceAroundStep) — rien à tracker ici, l'attribut change silencieusement.
    if (step.jsonID === 'replaceAround' && step.structure) return;
    const pureDelete = step.slice.size === 0;

    // ── Suppression : réinsère le contenu retiré, barré, au point de
    // suppression (biais gauche : le barré atterrit AVANT le contenu de
    // remplacement éventuel) ──
    if (step.to > step.from) {
      const runs = collectTextRuns(before.slice(step.from, step.to));
      const at0 = toFinal(step.from, idx, -1);
      let at = at0;
      runs.forEach(function (run) {
        if (!run.node && !run.text) return;
        // 'skip' : sa propre insertion en attente (annulation nette), une puce
        // proposée ou une ligne à compléter (pas encore dans la note) ;
        // 'keep' : déjà barré ; 'mark' : barré et signé, la puce comprise (Q9).
        const how = window.classifyDeletedRun(run, author.id);
        if (how === 'skip') return;
        const marks = how === 'keep'
          ? run.marks
          : run.marks.filter(function (m) { return m.type !== insType; }).concat(delType.create(deleteAttrs));
        tr.insert(at, run.node ? run.node.mark(marks) : schema.text(run.text, marks));
        at += run.node ? run.node.nodeSize : run.text.length;
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
// Scan et résolution — le modèle unique du texte et des entités vit dans
// proposed-changes.jsx (scanProposedChanges, resolveProposed). Ici, la part
// du texte seulement : ce que le popover ✓/✗ d'une marque lit et résout.
// Recalculé sur chaque `update` de l'éditeur (voir NoteEditor.jsx), jamais
// persisté.
// ---------------------------------------------------------
function scanReviewChanges(doc) {
  return window.scanProposedChanges(doc).filter(function (c) { return c.kind !== 'entity'; });
}

function resolveChanges(editor, changes, accept) { window.resolveProposed(editor, changes, accept); }

function acceptChange(editor, change) { resolveChanges(editor, [change], true); }
function rejectChange(editor, change) { resolveChanges(editor, [change], false); }

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
  // Sous la marque, ou au-dessus s'il n'y a pas la place (placePopover, mode 'flip').
  React.useLayoutEffect(function () {
    if (!anchorRect || !ref.current || !window.placePopover) return;
    ref.current.style.overflowY = 'auto';
    window.placePopover(ref.current, anchorRect, { mode: 'flip' });
  });
  if (!anchorRect) return null;
  const W = 300;
  const top = anchorRect.bottom + 8;
  let left = anchorRect.left;
  if (left + W > window.innerWidth - 16) left = Math.max(12, window.innerWidth - W - 16);
  const verb = change.kind === 'insertion' ? t('review.inserted.text') : t('review.deleted.text');
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
          <span className="material-icons-outlined" style={{ fontSize: 17 }}>close</span> {t('review.refuser.button')}
        </button>
        <button type="button" style={rvwS.popBtnAccept} onClick={function () { onAccept(change); onClose(); }}>
          <span className="material-icons-outlined" style={{ fontSize: 17 }}>check</span> {t('review.accepter.button')}
        </button>
      </div>
    </div>
  );
}

// « Suivre mes modifications » : le seul réglage que garde l'en-tête. Le
// compteur, « Tout accepter » et « Tout refuser » sont dans la barre des
// changements proposés (ProposedChangesBar), qui sert le texte et les entités.
function ReviewHeaderControls({ active, onToggle }) {
  return (
    <div style={rvwS.headerRow}>
      <button
        type="button"
        title={active ? t('review.desactiverModeRevision.tooltip') : t('review.activerModeRevision.tooltip')}
        aria-pressed={active}
        onClick={onToggle}
        style={Object.assign({}, rvwS.toggleBtn, active ? rvwS.toggleBtnOn : {})}>
        <span className="material-icons-outlined" style={{ fontSize: 18 }}>rate_review</span>
        {t('review.modeRevision.button')}
      </button>
    </div>
  );
}

// ---------------------------------------------------------
// Changements proposés — `summary` = summarizeProposedChanges
// (proposed-changes.jsx). Une barre au-dessus du corps de la note, un
// dialogue à la finalisation (Q-06) : le même pour le texte d'un gabarit ou
// de l'IA, les entités et les modifications suivies.
// ---------------------------------------------------------
function proposedPiecesText(summary) {
  const parts = [];
  if (summary.complete) parts.push(tn('proposed.complete.text', summary.complete));
  if (summary.incomplete) parts.push(tn('proposed.incomplete.text', summary.incomplete));
  if (summary.draft) parts.push(tn('proposed.draft.text', summary.draft));
  if (summary.removed) parts.push(tn('proposed.removed.text', summary.removed));
  if (summary.text) parts.push(tn('proposed.textRuns.text', summary.text));
  return parts.join(', ');
}

function proposedSummaryText(summary) {
  return t('proposed.summary.text', { total: tn('proposed.total.text', summary.total), pieces: proposedPiecesText(summary) });
}

// `shortList` : les entités complètes que « Tout accepter » prendrait (nom,
// posologie) ; `showList` : la liste s'affiche avant le geste — une seule
// fois par note (Q7), `onListShown` le note. Le bouton reste toujours offert.
function ProposedChangesBar({ summary, shortList, showList, onListShown, onAcceptAll, onRejectAll, onPrev, onNext }) {
  const [confirming, setConfirming] = React.useState(false);
  React.useEffect(function () {
    if (confirming && (!shortList.length || !summary.acceptable)) setConfirming(false);
  }, [confirming, shortList.length, summary.acceptable]);
  // Plusieurs auteurs (gabarit de note, dernière conclusion, Assistant IA…) : un libellé commun.
  const who = summary.sources.length === 1 ? summary.sources[0] : t('review.plusieursSources.text');
  function askAcceptAll() {
    if (showList && shortList.length) { setConfirming(true); if (onListShown) onListShown(); return; }
    onAcceptAll();
  }
  return (
    <div style={rvwS.pendingBar} role="region" aria-label={t('proposed.bar.aria')}>
      <div style={rvwS.barRow}>
        <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 20, color: 'var(--mat-sys-primary)' }}>playlist_add_check</span>
        <span style={rvwS.pendingText} title={t('review.rienCreeAvantEtre.tooltip')}>
          <b>{who}</b>{t('proposed.barText.text', { summary: proposedSummaryText(summary) })}
        </span>
        {/* Les actions passent à la ligne ensemble, jamais une seule. */}
        <span style={rvwS.pendingActions}>
          <button type="button" style={rvwS.navBtn} onClick={onPrev} title={t('proposed.previous.tooltip')} aria-label={t('proposed.previous.tooltip')}>
            <span className="material-icons-outlined" aria-hidden="true" style={{ fontSize: 20 }}>chevron_left</span>
          </button>
          <button type="button" style={rvwS.navBtn} onClick={onNext} title={t('proposed.next.tooltip')} aria-label={t('proposed.next.tooltip')}>
            <span className="material-icons-outlined" aria-hidden="true" style={{ fontSize: 20 }}>chevron_right</span>
          </button>
          <button type="button" style={rvwS.pendingBtnOutline} onClick={onRejectAll}>
            <span className="material-icons-outlined" aria-hidden="true" style={{ fontSize: 17 }}>remove_done</span> {t('review.toutRefuser.button')}
          </button>
          {/* Une ligne à compléter ne s'accepte pas (elle attend un choix) et une
              entité incomplète non plus par ce geste : sans rien d'autre,
              « Tout accepter » n'aurait rien à faire. */}
          {summary.acceptable > 0 &&
          <button type="button" style={rvwS.pendingBtnPrimary} onClick={askAcceptAll}
            title={summary.unfinished ? tn('proposed.acceptAll.tooltip', summary.unfinished) : undefined}>
            <span className="material-icons-outlined" aria-hidden="true" style={{ fontSize: 17 }}>done_all</span> {t('review.toutAccepter.button')}
          </button>}
        </span>
      </div>
      {confirming &&
        <div style={rvwS.shortList} role="group" aria-label={tn('proposed.list.title', shortList.length)}>
          <div style={rvwS.shortTitle}>{tn('proposed.list.title', shortList.length)}</div>
          <ul style={rvwS.shortUl}>
            {shortList.map(function (item) {
              return (
                <li key={item.id} style={rvwS.shortItem}>
                  <b>{item.label}</b>
                  {item.detail && <span style={rvwS.shortDetail}> — {item.detail}</span>}
                  {item.conflict &&
                    <span style={rvwS.shortConflict}>
                      <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 16 }}>warning</span>
                      {t('proposed.list.conflict.text')}
                    </span>}
                </li>
              );
            })}
          </ul>
          {summary.unfinished > 0 && <div style={rvwS.shortNote}>{tn('proposed.list.unfinished.text', summary.unfinished)}</div>}
          <div style={rvwS.shortActions}>
            <button type="button" style={rvwS.pendingBtnGhost} onClick={function () { setConfirming(false); }}>{t('review.annuler.button')}</button>
            <button type="button" style={rvwS.pendingBtnPrimary} autoFocus onClick={function () { setConfirming(false); onAcceptAll(); }}>
              <span className="material-icons-outlined" aria-hidden="true" style={{ fontSize: 17 }}>done_all</span> {t('review.accepter.button')}
            </button>
          </div>
        </div>}
    </div>
  );
}

// `unfinishedNames` : les lignes à compléter et les entités incomplètes ; elles
// n'entrent pas dans la note finale si on ne les complète pas (Q8).
function ProposedCompleteDialog({ summary, unfinishedNames, onAcceptAllAndComplete, onReview, onRemoveAndComplete, onCancel }) {
  React.useEffect(function () {
    function onKey(e) { if (e.key === 'Escape') onCancel(); }
    document.addEventListener('keydown', onKey);
    return function () { document.removeEventListener('keydown', onKey); };
  }, [onCancel]);
  const canAcceptAll = summary.acceptable > 0;
  return (
    <div style={rvwS.dialogScrim} onMouseDown={function (e) { if (e.target === e.currentTarget) onCancel(); }}>
      <div style={rvwS.dialogBox} role="dialog" aria-label={t('proposed.bar.aria')}>
        <div style={rvwS.dialogTitle}>{t('proposed.dialog.title')}</div>
        <p style={rvwS.dialogText}>{t('proposed.dialog.text', { summary: proposedSummaryText(summary) })}</p>
        {unfinishedNames.length > 0 &&
          <p style={rvwS.dialogText}>{tn('proposed.dialog.unfinished.text', unfinishedNames.length, { names: unfinishedNames.join(', ') })}</p>}
        <div style={rvwS.dialogActions}>
          <button type="button" style={rvwS.dialogBtnGhost} onClick={onRemoveAndComplete}>{t('proposed.dialog.remove.button')}</button>
          <button type="button" style={canAcceptAll ? rvwS.dialogBtnOutline : rvwS.dialogBtnPrimary} autoFocus={!canAcceptAll} onClick={onReview}>
            {unfinishedNames.length ? t('proposed.dialog.complete.button') : t('review.reviser.button')}
          </button>
          {canAcceptAll &&
            <button type="button" style={rvwS.dialogBtnPrimary} autoFocus onClick={onAcceptAllAndComplete}>{t('review.toutAccepterFinaliser.button')}</button>}
        </div>
      </div>
    </div>
  );
}

const rvwS = {
  // Collante : « suivant » et « précédent » font défiler la note jusqu'au changement, la barre reste à portée.
  pendingBar: { position: 'sticky', top: 8, zIndex: 5, boxShadow: '0 2px 8px rgba(37,36,94,0.10)', margin: '0 0 8px', padding: '8px 10px 8px 12px', borderRadius: 8, background: 'color-mix(in srgb, var(--mat-sys-primary) 6%, var(--mat-sys-surface-container-lowest))', border: '1px solid var(--mat-sys-outline-variant)', fontFamily: "'Inter',sans-serif" },
  barRow: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  navBtn: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, border: 0, background: 'transparent', color: 'var(--mat-sys-primary)', borderRadius: 8, padding: 0, cursor: 'pointer' },
  shortList: { margin: '8px 0 2px', padding: '10px 12px', borderRadius: 8, background: 'var(--mat-sys-surface-container-lowest)', border: '1px solid var(--mat-sys-outline-variant)' },
  shortTitle: { font: "600 13px 'Inter',sans-serif", color: 'var(--mat-sys-on-surface)', marginBottom: 6 },
  shortUl: { margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 },
  shortItem: { font: "400 13.5px/1.4 'Inter',sans-serif", color: 'var(--mat-sys-on-surface)' },
  shortDetail: { color: 'color-mix(in srgb, var(--mat-sys-on-surface) 65%, transparent)' },
  shortConflict: { display: 'inline-flex', alignItems: 'center', gap: 2, marginLeft: 8, font: "600 12px 'Inter',sans-serif", color: 'light-dark(#8a5a00, #f5d27a)' },
  shortNote: { margin: '8px 0 0', font: "400 12.5px/1.4 'Inter',sans-serif", color: 'color-mix(in srgb, var(--mat-sys-on-surface) 65%, transparent)' },
  shortActions: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 },
  pendingText: { flex: '1 1 240px', font: "400 13.5px/1.4 'Inter',sans-serif", color: 'var(--mat-sys-on-surface)' },
  pendingActions: { display: 'inline-flex', alignItems: 'center', gap: 8, marginLeft: 'auto', whiteSpace: 'nowrap' },
  pendingBtnGhost: { border: 0, background: 'transparent', color: 'var(--mat-sys-primary)', borderRadius: 8, padding: '7px 10px', font: "600 13px 'Inter',sans-serif", cursor: 'pointer' },
  pendingBtnOutline: { display: 'inline-flex', alignItems: 'center', gap: 4, border: '1px solid var(--mat-sys-outline)', background: 'var(--mat-sys-surface-container-lowest)', color: 'var(--mat-sys-on-surface)', borderRadius: 8, padding: '6px 12px', font: "600 13px 'Inter',sans-serif", cursor: 'pointer' },
  pendingBtnPrimary: { display: 'inline-flex', alignItems: 'center', gap: 4, border: 0, background: 'var(--mat-sys-primary)', color: 'var(--mat-sys-on-primary)', borderRadius: 8, padding: '7px 12px', font: "600 13px 'Inter',sans-serif", cursor: 'pointer' },
  headerRow: { display: 'flex', alignItems: 'center', gap: 8 },
  toggleBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid var(--mat-sys-outline-variant)', borderRadius: 8, background: 'var(--mat-sys-surface-container-lowest)', padding: '7px 12px', font: "500 13.5px 'Inter',sans-serif", color: 'color-mix(in srgb, var(--mat-sys-on-surface) 72%, transparent)', cursor: 'pointer', whiteSpace: 'nowrap' },
  toggleBtnOn: { background: 'color-mix(in srgb, var(--mat-sys-primary) 10%, var(--mat-sys-surface-container-lowest))', border: '1px solid var(--mat-sys-primary)', color: 'var(--mat-sys-primary)' },

  popover: { position: 'fixed', zIndex: 90, background: 'var(--mat-sys-surface-container-lowest)', border: '1px solid var(--mat-sys-outline-variant)', borderRadius: 10, boxShadow: '0 8px 24px rgba(37,36,94,0.18)', padding: '12px 14px', fontFamily: "'Inter',sans-serif" },
  popHead: { display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  popDot: { width: 10, height: 10, borderRadius: '50%', marginTop: 4, flexShrink: 0 },
  popTitle: { font: "600 13px 'Inter',sans-serif", color: 'color-mix(in srgb, var(--mat-sys-on-surface) 85%, transparent)' },
  popSub: { font: "400 11.5px 'Inter',sans-serif", color: 'color-mix(in srgb, var(--mat-sys-on-surface) 50%, transparent)' },
  popText: { font: "400 13px/1.5 'Inter',sans-serif", color: 'color-mix(in srgb, var(--mat-sys-on-surface) 70%, transparent)', background: 'var(--mat-sys-surface-container-low)', borderRadius: 6, padding: '6px 8px', marginBottom: 10, wordBreak: 'break-word' },
  popActions: { display: 'flex', gap: 8 },
  popBtnReject: { flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4, border: '1px solid #e0b3ae', borderRadius: 8, background: 'var(--mat-sys-surface-container-lowest)', color: 'light-dark(#b3261e, #e9a9a5)', padding: '7px 0', font: "500 13px 'Inter',sans-serif", cursor: 'pointer' },
  popBtnAccept: { flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4, border: 0, borderRadius: 8, background: '#1F8A5B', color: '#fff', padding: '7px 0', font: "500 13px 'Inter',sans-serif", cursor: 'pointer' },

  dialogScrim: { position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(20,20,40,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'snm-fade 160ms ease-out' },
  dialogBox: { width: 520, maxWidth: 'calc(100vw - 32px)', background: 'var(--mat-sys-surface-container-lowest)', borderRadius: 14, padding: '22px 24px', boxShadow: '0 20px 48px rgba(0,0,0,0.24)', fontFamily: "'Inter',sans-serif", animation: 'snm-pop 180ms ease-out' },
  dialogTitle: { font: "600 17px 'Poppins',sans-serif", color: 'color-mix(in srgb, var(--mat-sys-on-surface) 88%, transparent)', marginBottom: 8 },
  dialogText: { font: "400 14px/1.55 'Inter',sans-serif", color: 'color-mix(in srgb, var(--mat-sys-on-surface) 65%, transparent)', margin: '0 0 20px' },
  dialogActions: { display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' },
  dialogBtnGhost: { border: 0, background: 'transparent', color: 'color-mix(in srgb, var(--mat-sys-on-surface) 60%, transparent)', borderRadius: 8, padding: '9px 14px', font: "500 13.5px 'Inter',sans-serif", cursor: 'pointer' },
  dialogBtnOutline: { border: '1px solid var(--mat-sys-outline-variant)', background: 'var(--mat-sys-surface-container-lowest)', color: 'var(--mat-sys-on-surface)', borderRadius: 8, padding: '9px 16px', font: "600 13.5px 'Inter',sans-serif", cursor: 'pointer' },
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
  markBlocksAsInsertion,
  findChangeAtDom,
  ReviewChangePopover,
  ReviewHeaderControls,
  ProposedChangesBar,
  ProposedCompleteDialog
});
