/* global React */

// Barre flottante réécrite pour l'éditeur Tiptap unique (phase E). Suit la
// sélection (selectionchange) ou reste épinglée près du bouton « T »
// (événement ftbar-pin, voir editor-field.jsx) tant qu'aucune sélection
// valide ni clic extérieur ne la remplace/ferme. Formats lus/écrits via
// editor.isActive()/editor.chain() — plus d'état de formats dupliqué.

const PALETTE = [
'#1f1f1f', '#5c5c5c', '#8f8f8f', '#bfbfbf', '#ffffff',
'#ffd170', '#ffc01f', '#cfa70c', '#a9790a', '#b4cb2f',
'#52c25c', '#74b84d', '#108840', '#c6aef3', '#9479e0',
'#6f2ee2', '#2e1ba0', '#f4a596', '#ed6a5a', '#e0394b',
'#a8322a', '#7ed6f1', '#16bef0', '#1f7ed1', '#0a5cab'];

const BLOCK_TYPES = [
{ label: 'Paragraphe', level: 0, preview: { fontFamily: "'Inter',sans-serif", fontSize: 14, fontWeight: 400 } },
{ label: 'Titre 1', level: 1, preview: { fontFamily: "'Inter',sans-serif", fontSize: 16, fontWeight: 600 } },
{ label: 'Titre 2', level: 2, preview: { fontFamily: "'Inter',sans-serif", fontSize: 14, fontWeight: 600 } },
{ label: 'Titre 3', level: 3, preview: { fontFamily: "'Inter',sans-serif", fontSize: 12, fontWeight: 600 } }];

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
  const [blockOpen, setBlockOpen] = React.useState(false);
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
        setBlockOpen(false);
      }
    }
    function onPin(e) {
      const { editor, rect } = e.detail;
      setState({ editor, left: rect.left + rect.width / 2, bottom: window.innerHeight - rect.top + 8, pinned: true });
    }
    function onKeyDown(e) {
      if (e.key === 'Escape' && stateRef.current) { setState(null); setBlockOpen(false); }
    }
    function onDocMouseDown(e) {
      if (!stateRef.current) return;
      if (toolbarRef.current && toolbarRef.current.contains(e.target)) return;
      const shell = e.target.closest && e.target.closest('.note-field-shell');
      const host = shell && shell.querySelector('.note-field');
      if (host && host.__editor === stateRef.current.editor) return;
      setState(null);
      setBlockOpen(false);
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

  if (!state) return null;
  const { editor } = state;

  function run(fn) { fn(editor.chain().focus()).run(); }

  const curLevel = [1, 2, 3].find((l) => editor.isActive('heading', { level: l })) || 0;
  const curBlock = BLOCK_TYPES.find((b) => b.level === curLevel) || BLOCK_TYPES[0];
  const curColor = editor.getAttributes('textStyle').color;
  const curHighlight = editor.getAttributes('highlight').color;

  const W = 620;
  const left = Math.max(8, Math.min(state.left - W / 2, window.innerWidth - W - 8));

  return (
    <div
      ref={toolbarRef}
      style={{ ...ftS.bar, left, bottom: state.bottom, width: W }}
      onMouseDown={(e) => e.preventDefault()}>

      {/* Type de bloc */}
      <div style={{ position: 'relative' }}>
        <button style={ftS.typeBtn} onMouseDown={(e) => { e.preventDefault(); setBlockOpen((o) => !o); }}>
          <span>{curBlock.label}</span>
          <span style={ftS.chevrons}>
            <span style={ftS.chevUp}>⌃</span>
            <span style={ftS.chevDown}>⌄</span>
          </span>
        </button>
        {blockOpen &&
        <div style={ftS.blockDrop}>
            {BLOCK_TYPES.map((b) =>
          <div key={b.level} style={{ ...ftS.blockItem, ...b.preview, background: curBlock.level === b.level ? '#ddeaff' : 'transparent' }}
          onMouseDown={(e) => {
            e.preventDefault();
            run((c) => b.level === 0 ? c.setParagraph() : c.toggleHeading({ level: b.level }));
            setBlockOpen(false);
          }}>
                {b.label}
              </div>
          )}
          </div>
        }
      </div>

      <div style={ftS.sep} />

      <FtBtn icon="format_bold" title="Gras" active={editor.isActive('bold')} onCmd={() => run((c) => c.toggleBold())} />
      <FtBtn icon="format_italic" title="Italique" active={editor.isActive('italic')} onCmd={() => run((c) => c.toggleItalic())} iconStyle={{ fontStyle: 'italic' }} />
      <FtBtn icon="format_underlined" title="Souligné" active={editor.isActive('underline')} onCmd={() => run((c) => c.toggleUnderline())} />
      <FtBtn icon="strikethrough_s" title="Barré" active={editor.isActive('strike')} onCmd={() => run((c) => c.toggleStrike())} />

      <div style={ftS.sep} />

      <ColorBtn
        icon="format_color_text" title="Couleur du texte"
        current={curColor} defaultBar="#1f1f1f"
        onPick={(v) => run((c) => v === curColor ? c.unsetColor() : c.setColor(v))} />
      <ColorBtn
        icon="border_color" title="Surlignage"
        current={curHighlight} defaultBar="#ffc01f"
        onPick={(v) => run((c) => v === curHighlight ? c.unsetHighlight() : c.toggleHighlight({ color: v }))} />

      <div style={ftS.sep} />

      <FtBtn icon="format_list_bulleted" title="Liste à puces" active={editor.isActive('bulletList')} onCmd={() => run((c) => c.toggleBulletList())} />
      <FtBtn icon="format_list_numbered" title="Liste numérotée" active={editor.isActive('orderedList')} onCmd={() => run((c) => c.toggleOrderedList())} />
    </div>);
}

function FtBtn({ icon, title, active, onCmd, iconStyle }) {
  return (
    <button
      title={title}
      style={{ ...ftS.btn, ...(active ? ftS.btnActive : {}) }}
      onMouseDown={(e) => { e.preventDefault(); onCmd(); }}>
      <span className="material-icons-outlined" style={{ fontSize: 18, ...iconStyle }}>{icon}</span>
    </button>);
}

function ColorBtn({ icon, title, current, defaultBar, onPick }) {
  const [open, setOpen] = React.useState(false);
  const active = !!current;
  const bar = current || defaultBar;
  return (
    <div style={{ position: 'relative' }}>
      <button
        title={title}
        style={{ ...ftS.btn, ...ftS.colorBtn, ...(open || active ? ftS.btnActive : {}) }}
        onMouseDown={(e) => { e.preventDefault(); setOpen((o) => !o); }}>
        <span className="material-icons-outlined" style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ ...ftS.colorBar, background: bar }} />
      </button>
      {open &&
      <>
          <div style={ftS.menuScrim} onMouseDown={(e) => { e.preventDefault(); setOpen(false); }} />
          <div style={ftS.colorMenu}>
            {PALETTE.map((hex) => {
            const isCur = (current || '').toLowerCase() === hex.toLowerCase();
            const isWhite = hex.toLowerCase() === '#ffffff';
            return (
              <button
                key={hex}
                title={hex}
                style={{ ...ftS.swatchBtn, ...(isCur ? ftS.swatchBtnActive : {}) }}
                onMouseDown={(e) => { e.preventDefault(); onPick(hex); setOpen(false); }}>
                  <span style={{
                  ...ftS.swatch,
                  background: hex,
                  ...(isWhite ? { border: '1px solid #d8d8e0' } : {})
                }} />
                </button>);
          })}
          </div>
        </>
      }
    </div>);
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
  },
  typeBtn: {
    display: 'flex', alignItems: 'center', gap: 4,
    padding: '4px 8px', border: 0, background: 'transparent',
    borderRadius: 6, cursor: 'pointer',
    fontSize: 13, color: 'rgba(0,0,0,0.72)', fontFamily: "'Inter',sans-serif",
    whiteSpace: 'nowrap'
  },
  chevrons: { display: 'flex', flexDirection: 'column', lineHeight: 1, gap: -2, marginLeft: 2 },
  chevUp: { fontSize: 9, color: 'rgba(0,0,0,0.5)', lineHeight: 1 },
  chevDown: { fontSize: 9, color: 'rgba(0,0,0,0.5)', lineHeight: 1, marginTop: -2 },
  blockDrop: {
    position: 'absolute', top: '100%', left: 0,
    background: '#fff', border: '1px solid #e0e0eb', borderRadius: 8,
    boxShadow: '0 4px 12px rgba(37,36,94,0.12)',
    zIndex: 10, minWidth: 140, overflow: 'hidden'
  },
  blockItem: {
    padding: '8px 14px', fontSize: 13, cursor: 'pointer',
    color: 'rgba(0,0,0,0.78)'
  },
  sep: { width: 1, height: 20, background: '#e0e0eb', margin: '0 4px', flexShrink: 0 },
  btn: {
    width: 30, height: 30, border: 0, background: 'transparent',
    borderRadius: 6, cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    color: 'rgba(0,0,0,0.62)'
  },
  btnActive: {
    background: '#ddeaff', color: '#1975d1'
  },
  colorBtn: { flexDirection: 'column', gap: 0, height: 30, paddingTop: 1 },
  colorBar: { width: 18, height: 3, borderRadius: 2, marginTop: -2 },
  menuScrim: { position: 'fixed', inset: 0, zIndex: 9 },
  colorMenu: {
    position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: 8,
    background: '#fff', border: '1px solid #ececf2', borderRadius: 16,
    boxShadow: '0 10px 30px rgba(37,36,94,0.18)', zIndex: 10,
    display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, padding: 14
  },
  swatchBtn: {
    width: 34, height: 34, border: 0, background: 'transparent', borderRadius: 10,
    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0
  },
  swatchBtnActive: { boxShadow: 'inset 0 0 0 2px #1f1f1f' },
  swatch: { width: 24, height: 24, borderRadius: 7 }
};

window.FloatingToolbar = FloatingToolbar;
