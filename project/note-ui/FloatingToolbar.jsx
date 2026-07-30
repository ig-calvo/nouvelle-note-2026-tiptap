/* global React */

// Barre flottante réécrite pour l'éditeur Tiptap unique (phase E). Suit la
// sélection (selectionchange) ou reste épinglée près du bouton « T »
// (événement ftbar-pin, voir editor-field.jsx) tant qu'aucune sélection
// valide ni clic extérieur ne la remplace/ferme. Formats lus/écrits via
// editor.isActive()/editor.chain() — plus d'état de formats dupliqué.
//
// Mode "Flottante" du tweak "Barre de mise en forme" uniquement — le mode
// "Haut de note" est un bloc en flux normal rendu par NoteEditor.jsx
// (NoteRichTextToolbar), pas une variante de ce composant. Les deux
// partagent désormais le même jeu de boutons/palettes — voir
// rich-text-controls.jsx — pour ne plus dériver l'un de l'autre.

function editorFromNode(node) {
  const el = node && (node.nodeType === 1 ? node : node.parentElement);
  const host = el && el.closest && el.closest('.note-field');
  return host ? host.__editor : null;
}

function selectionState() {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null;
  const editor = editorFromNode(sel.anchorNode);
  if (!editor) return null;
  const rect = sel.getRangeAt(0).getBoundingClientRect();
  if (!rect || (rect.width === 0 && rect.height === 0)) return null;
  return { editor, left: rect.left + rect.width / 2, bottom: window.innerHeight - rect.top + 8, pinned: false };
}

function FloatingToolbar() {
  const [state, setState] = React.useState(null); // { editor, left, bottom, pinned }
  const [, bump] = React.useState(0);
  const toolbarRef = React.useRef(null);
  const stateRef = React.useRef(null);
  stateRef.current = state;

  React.useEffect(() => {
    function onSelectionChange() {
      const next = selectionState();
      if (next) { setState(next); return; }
      // Pas de sélection exploitable : une barre épinglée reste ouverte,
      // une barre suivant la sélection se ferme.
      if (!stateRef.current || !stateRef.current.pinned) {
        setState(null);
      }
    }
    function onPin(e) {
      const { editor, rect } = e.detail;
      setState({ editor, left: rect.left + rect.width / 2, bottom: window.innerHeight - rect.top + 8, pinned: true });
    }
    function onKeyDown(e) {
      if (e.key === 'Escape' && stateRef.current) setState(null);
    }
    function onDocMouseDown(e) {
      if (!stateRef.current) return;
      if (toolbarRef.current && toolbarRef.current.contains(e.target)) return;
      const shell = e.target.closest && e.target.closest('.note-field-shell');
      const host = shell && shell.querySelector('.note-field');
      if (host && host.__editor === stateRef.current.editor) return;
      setState(null);
    }
    document.addEventListener('selectionchange', onSelectionChange);
    window.addEventListener('ftbar-pin', onPin);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onDocMouseDown, true);
    return () => {
      document.removeEventListener('selectionchange', onSelectionChange);
      window.removeEventListener('ftbar-pin', onPin);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onDocMouseDown, true);
    };
  }, []);

  // Re-render sur chaque transaction pour garder editor.isActive() à jour
  // (gras/titre/couleur courants) sans dupliquer l'état des formats.
  React.useEffect(() => {
    if (!state || !state.editor) return undefined;
    const editor = state.editor;
    const onTx = () => bump((n) => n + 1);
    editor.on('transaction', onTx);
    return () => editor.off('transaction', onTx);
  }, [state && state.editor]);

  // Doit rester appelé à chaque render (règle des Hooks), même quand
  // `state` est encore null — d'où le editor optionnel géré en interne par
  // useLinkEditor plutôt qu'un appel conditionnel après le `return null` ci-dessous.
  const S = window.ToolbarShared;
  const linkEditor = S.useLinkEditor(state && state.editor);

  if (!state) return null;
  const { editor } = state;

  function run(fn) { fn(editor.chain().focus()).run(); }

  const curLevel = [1, 2, 3].find((l) => editor.isActive('heading', { level: l })) || 0;
  const curBlock = S.TOOLBAR_BLOCK_TYPES.find((b) => b.level === curLevel) || S.TOOLBAR_BLOCK_TYPES[0];

  // Largeur budgétée par la fenêtre (pas de conteneur parent à mesurer,
  // contrairement au mode "Haut de note") — recalculée à chaque render,
  // comme `left` ci-dessous.
  const W = Math.max(300, Math.min(620, window.innerWidth - 16));
  const left = Math.max(8, Math.min(state.left - W / 2, window.innerWidth - W - 8));

  const chunks = S.buildToolbarChunks(editor, linkEditor, run);
  const visibleCount = S.visibleChunkCount(S.CHUNK_WIDTHS, W);
  const visibleChunks = chunks.slice(0, visibleCount);
  const hiddenChunks = chunks.slice(visibleCount);

  return (
    <div
      ref={toolbarRef}
      style={{ ...ftS.bar, left, bottom: state.bottom, width: W }}
      onMouseDown={(e) => e.preventDefault()}>
      {linkEditor.editing ? (
        <S.ToolbarLinkEditRow linkEditor={linkEditor} />
      ) : (
        <>
          <S.ToolbarBlockDropdown
            curBlock={curBlock}
            onPick={(b) => run((c) => b.level === 0 ? c.setParagraph() : c.toggleHeading({ level: b.level }))} />
          {visibleChunks.map((chunk) => (
            <React.Fragment key={chunk.key}>
              <div style={S.tbS.sep} />
              {chunk.render(false)}
            </React.Fragment>
          ))}
          {hiddenChunks.length > 0 &&
            <React.Fragment>
              <div style={S.tbS.sep} />
              <S.ToolbarOverflowMenu chunks={hiddenChunks} />
            </React.Fragment>
          }
        </>
      )}
    </div>
  );
}

const ftS = {
  bar: {
    position: 'fixed',
    zIndex: 2000,
    background: '#fff',
    border: '1px solid #e0e0eb',
    borderRadius: 10,
    boxShadow: '0 4px 20px rgba(37,36,94,0.14)',
    display: 'flex',
    alignItems: 'center',
    padding: '4px 10px',
    gap: 2,
    fontFamily: "'Inter', sans-serif",
    animation: 'pop-in 140ms cubic-bezier(0.2,0,0,1)'
  }
};

window.FloatingToolbar = FloatingToolbar;
