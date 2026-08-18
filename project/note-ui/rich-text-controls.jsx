/* global React */

// =========================================================
// rich-text-controls.jsx — cœur commun aux deux barres de mise en forme
// (FloatingToolbar.jsx, mode "Flottante" ; NoteRichTextToolbar dans
// NoteEditor.jsx, mode "Haut de note" — tweak "Barre de mise en forme").
//
// Les deux modes ne doivent différer que par leur HABILLAGE (bulle
// positionnée sur la sélection vs bandeau en flux normal au-dessus de la
// note) : mêmes groupes de boutons, mêmes tailles, mêmes palettes, même
// bascule "..." en cas de manque de place. Avant ce fichier, les deux
// composants dupliquaient (et désynchronisaient) tout ça séparément.
// =========================================================

const TOOLBAR_BLOCK_TYPES = [
  { label: 'Paragraphe', level: 0, preview: { fontFamily: "'Inter',sans-serif", fontSize: 14, fontWeight: 400 } },
  { label: 'Titre 1', level: 1, preview: { fontFamily: "'Inter',sans-serif", fontSize: 16, fontWeight: 600 } },
  { label: 'Titre 2', level: 2, preview: { fontFamily: "'Inter',sans-serif", fontSize: 14, fontWeight: 600 } },
  { label: 'Titre 3', level: 3, preview: { fontFamily: "'Inter',sans-serif", fontSize: 12, fontWeight: 600 } }
];

const TEXT_COLORS = [
  '#1f1f1f', '#5c5c5c', '#8f8f8f', '#bfbfbf', '#ffffff',
  '#ffd170', '#ffc01f', '#cfa70c', '#a9790a', '#b4cb2f',
  '#52c25c', '#74b84d', '#108840', '#c6aef3', '#9479e0',
  '#6f2ee2', '#2e1ba0', '#f4a596', '#ed6a5a', '#e0394b',
  '#a8322a', '#7ed6f1', '#16bef0', '#1f7ed1', '#0a5cab'
];

// Surlignage : mêmes teintes que TEXT_COLORS éclaircies vers le blanc — un
// aplat pastel reste lisible derrière du texte, contrairement à la couleur
// saturée telle quelle (jeu de teintes dédié, pas la palette texte réutilisée).
function pastel(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const mix = (c) => Math.round(c + (255 - c) * amount);
  return '#' + [mix(r), mix(g), mix(b)].map((c) => c.toString(16).padStart(2, '0')).join('');
}
const HIGHLIGHT_COLORS = TEXT_COLORS.map((hex) => pastel(hex, 0.78));

// ---------------------------------------------------------
// Largeurs pour le calcul de débordement (voir visibleChunkCount) — tous
// les boutons font CHUNK_BTN_W de large (valeurs fixes, pas de mesure DOM
// nécessaire).
// ---------------------------------------------------------
const CHUNK_BTN_W = 40, CHUNK_GAP = 4, CHUNK_PAD = 16, CHUNK_DIV_W = 1, CHUNK_DROPDOWN_W = 144;

function chunkedWidth(chunkWidths, visibleCount, withOverflow) {
  const items = [CHUNK_DROPDOWN_W, CHUNK_DIV_W];
  for (let i = 0; i < visibleCount; i++) {
    items.push(chunkWidths[i]);
    if (i < visibleCount - 1) items.push(CHUNK_DIV_W);
  }
  if (withOverflow) { items.push(CHUNK_DIV_W); items.push(CHUNK_BTN_W); }
  const sum = items.reduce((a, b) => a + b, 0);
  return sum + (items.length - 1) * CHUNK_GAP + CHUNK_PAD;
}

// Nombre de groupes affichables sans débordement pour une largeur donnée —
// « si tout rentre, pas de bouton ⋯ » : withOverflow=true n'est testé que si
// la largeur complète ne rentre pas.
function visibleChunkCount(chunkWidths, containerWidth) {
  const n = chunkWidths.length;
  if (!containerWidth || chunkedWidth(chunkWidths, n, false) <= containerWidth) return n;
  for (let k = n - 1; k >= 0; k--) {
    if (chunkedWidth(chunkWidths, k, true) <= containerWidth) return k;
  }
  return 0;
}

// Mesure la largeur réelle du conteneur (ResizeObserver) — utilisé par les
// deux habillages pour piloter visibleChunkCount ci-dessus.
function useToolbarWidth(ref, deps) {
  const [width, setWidth] = React.useState(0);
  React.useEffect(function () {
    if (!ref.current) return undefined;
    const el = ref.current;
    const ro = new ResizeObserver(function (entries) {
      const w = entries[0] && entries[0].contentRect ? entries[0].contentRect.width : el.clientWidth;
      setWidth(w);
    });
    ro.observe(el);
    return function () { ro.disconnect(); };
  }, deps || []);
  return width;
}

// ---------------------------------------------------------
// Lien — bascule le contenu de la barre vers un petit champ URL (comme
// DsTiptap : la barre entière devient l'éditeur de lien, pas une popover à
// part). extendMarkRange() permet de rouvrir/modifier un lien existant en
// cliquant simplement dedans, sans avoir à le resélectionner à la main.
// ---------------------------------------------------------
function useLinkEditor(editor) {
  const [editing, setEditing] = React.useState(false);
  const [url, setUrl] = React.useState('');

  function start() {
    if (!editor) return;
    setUrl(editor.getAttributes('link').href || '');
    setEditing(true);
  }
  function cancel() { setEditing(false); }
  function confirm() {
    if (!editor) { setEditing(false); return; }
    const v = url.trim();
    const chain = editor.chain().focus().extendMarkRange('link');
    if (v) chain.setLink({ href: /^[a-z][a-z0-9+.-]*:/i.test(v) ? v : 'https://' + v }).run();
    else chain.unsetLink().run();
    setEditing(false);
  }

  const canLink = !!editor && (!editor.state.selection.empty || editor.isActive('link'));
  return { editing, url, setUrl, start, cancel, confirm, canLink };
}

function ToolbarLinkEditRow({ linkEditor }) {
  const inputRef = React.useRef(null);
  React.useEffect(function () {
    if (inputRef.current) { inputRef.current.focus(); inputRef.current.select(); }
  }, []);
  return (
    <div style={tbS.linkRow} onMouseDown={(e) => e.preventDefault()}>
      <input
        ref={inputRef}
        value={linkEditor.url}
        onChange={(e) => linkEditor.setUrl(e.target.value)}
        placeholder="Lien*"
        style={tbS.linkInput}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); linkEditor.confirm(); }
          else if (e.key === 'Escape') { e.preventDefault(); linkEditor.cancel(); }
        }} />
      <button type="button" title="Confirmer" style={tbS.linkBtn}
        onMouseDown={(e) => { e.preventDefault(); linkEditor.confirm(); }}>
        <span className="material-icons-outlined" style={{ fontSize: 20, color: '#1975d1' }}>check</span>
      </button>
      <button type="button" title="Annuler" style={tbS.linkBtn}
        onMouseDown={(e) => { e.preventDefault(); linkEditor.cancel(); }}>
        <span className="material-icons-outlined" style={{ fontSize: 20, color: 'rgba(0,0,0,0.5)' }}>close</span>
      </button>
    </div>
  );
}

// ---------------------------------------------------------
// Boutons génériques — `asRow` = rendu en ligne du menu "⋯" (débordement)
// plutôt qu'en icône seule dans la barre.
// ---------------------------------------------------------
function ToolbarBtn({ icon, title, active, disabled, onCmd, iconStyle, asRow }) {
  if (asRow) {
    return (
      <button type="button" title={title} disabled={disabled}
        style={{ ...tbS.overflowItem, ...(active ? tbS.overflowItemActive : {}), ...(disabled ? tbS.itemDisabled : {}) }}
        onMouseDown={(e) => { e.preventDefault(); if (!disabled) onCmd(); }}>
        <span className="material-icons-outlined" style={{ fontSize: 20, ...iconStyle }}>{icon}</span>
        <span>{title}</span>
      </button>
    );
  }
  return (
    <button type="button" title={title} disabled={disabled}
      style={{ ...tbS.btn, ...(active ? tbS.btnActive : {}), ...(disabled ? tbS.itemDisabled : {}) }}
      onMouseDown={(e) => { e.preventDefault(); if (!disabled) onCmd(); }}>
      <span className="material-icons-outlined" style={{ fontSize: 22, ...iconStyle }}>{icon}</span>
    </button>
  );
}

function ToolbarLinkBtn({ editor, linkEditor, asRow }) {
  return (
    <ToolbarBtn asRow={asRow} icon="link" title="Lien" active={editor.isActive('link')}
      disabled={!linkEditor.canLink} onCmd={linkEditor.start} />
  );
}

function ToolbarColorBtn({ icon, title, current, colors, defaultBar, onPick, asRow, flip }) {
  const [open, setOpen] = React.useState(false);
  const active = !!current;
  const bar = current || defaultBar;
  return (
    <div style={{ position: 'relative', ...(asRow ? { width: '100%' } : {}) }}>
      {asRow ? (
        <button type="button" title={title}
          style={{ ...tbS.overflowItem, ...((open || active) ? tbS.overflowItemActive : {}) }}
          onMouseDown={(e) => { e.preventDefault(); setOpen((o) => !o); }}>
          <span className="material-icons-outlined" style={{ fontSize: 20 }}>{icon}</span>
          <span>{title}</span>
        </button>
      ) : (
        <button type="button" title={title}
          style={{ ...tbS.btn, ...tbS.colorBtn, ...((open || active) ? tbS.btnActive : {}) }}
          onMouseDown={(e) => { e.preventDefault(); setOpen((o) => !o); }}>
          <span className="material-icons-outlined" style={{ fontSize: 22 }}>{icon}</span>
          <span style={{ ...tbS.colorBar, background: bar }} />
        </button>
      )}
      {open &&
        <>
          <div style={tbS.menuScrim} onMouseDown={(e) => { e.preventDefault(); setOpen(false); }} />
          <div style={asRow ? { ...tbS.colorMenu, left: '100%', top: 0, marginTop: 0, marginLeft: 8 } : menuStyle(tbS.colorMenu, flip)}>
            <button type="button" title="Aucune couleur" style={tbS.swatchBtn}
              onMouseDown={(e) => { e.preventDefault(); onPick(null); setOpen(false); }}>
              <span style={tbS.swatchNone}>
                <span className="material-icons-outlined" style={{ fontSize: 15, color: '#8f8f8f' }}>block</span>
              </span>
            </button>
            {colors.map((hex) => {
              const isCur = (current || '').toLowerCase() === hex.toLowerCase();
              const isWhite = hex.toLowerCase() === '#ffffff';
              return (
                <button type="button" key={hex} title={hex}
                  style={{ ...tbS.swatchBtn, ...(isCur ? tbS.swatchBtnActive : {}) }}
                  onMouseDown={(e) => { e.preventDefault(); onPick(hex); setOpen(false); }}>
                  <span style={{ ...tbS.swatch, background: hex, ...(isWhite ? { border: '1px solid #d8d8e0' } : {}) }} />
                </button>
              );
            })}
          </div>
        </>
      }
    </div>
  );
}

// Ouvre le menu vers le bas (par défaut, `top:100%`) ou vers le haut
// (`flip`, `bottom:100%`) — la barre flottante bascule ses menus vers le
// haut quand elle est elle-même ancrée sous la sélection (position "bas"
// du tweak), pour rester du côté du texte plutôt que de s'éloigner vers le
// bas de la fenêtre. La barre "Haut de note" (en flux normal) n'utilise
// jamais flip : elle a toute la place voulue en dessous.
function menuStyle(base, flip) {
  if (!flip) return base;
  return { ...base, top: 'auto', bottom: '100%', marginTop: 0, marginBottom: base.marginTop || 0 };
}

function ToolbarBlockDropdown({ curBlock, onPick, width, flip }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div style={{ position: 'relative', width: width || CHUNK_DROPDOWN_W, flexShrink: 0 }}>
      <button type="button" style={tbS.typeBtn} onMouseDown={(e) => { e.preventDefault(); setOpen((o) => !o); }}>
        <span>{curBlock.label}</span>
        <span className="material-icons-outlined" style={{ fontSize: 20, color: 'rgba(0,0,0,0.55)' }}>unfold_more</span>
      </button>
      {open &&
        <>
          <div style={tbS.menuScrim} onMouseDown={(e) => { e.preventDefault(); setOpen(false); }} />
          <div style={menuStyle(tbS.blockDrop, flip)}>
            {TOOLBAR_BLOCK_TYPES.map((b) => (
              <div key={b.level}
                style={{ ...tbS.blockItem, ...b.preview, ...(curBlock.level === b.level ? tbS.blockItemActive : {}) }}
                onMouseDown={(e) => { e.preventDefault(); onPick(b); setOpen(false); }}>
                {b.label}
              </div>
            ))}
          </div>
        </>
      }
    </div>
  );
}

// ---------------------------------------------------------
// Groupes de boutons ("chunks") — chacun disparaît en bloc dans le "⋯" dès
// que la largeur manque, jamais partiellement. `run` = le helper
// (fn) => fn(editor.chain().focus()).run() défini par chaque habillage.
// ---------------------------------------------------------
const CHUNK_WIDTHS = [4 * CHUNK_BTN_W, CHUNK_BTN_W, CHUNK_BTN_W, 2 * CHUNK_BTN_W, 2 * CHUNK_BTN_W, 2 * CHUNK_BTN_W, CHUNK_BTN_W];

function buildToolbarChunks(editor, linkEditor, run, flip) {
  const curColor = editor.getAttributes('textStyle').color;
  const curHighlight = editor.getAttributes('highlight').color;
  return [
    { key: 'marks', render: (asRow) => (
      <>
        <ToolbarBtn asRow={asRow} icon="format_bold" title="Gras" active={editor.isActive('bold')} onCmd={() => run((c) => c.toggleBold())} />
        <ToolbarBtn asRow={asRow} icon="format_italic" title="Italique" active={editor.isActive('italic')} onCmd={() => run((c) => c.toggleItalic())} iconStyle={{ fontStyle: 'italic' }} />
        <ToolbarBtn asRow={asRow} icon="format_underlined" title="Souligné" active={editor.isActive('underline')} onCmd={() => run((c) => c.toggleUnderline())} />
        <ToolbarBtn asRow={asRow} icon="strikethrough_s" title="Barré" active={editor.isActive('strike')} onCmd={() => run((c) => c.toggleStrike())} />
      </>
    ) },
    { key: 'quote', render: (asRow) => (
      <ToolbarBtn asRow={asRow} icon="format_quote" title="Citation" active={editor.isActive('blockquote')} onCmd={() => run((c) => c.toggleBlockquote())} />
    ) },
    { key: 'link', render: (asRow) => <ToolbarLinkBtn editor={editor} linkEditor={linkEditor} asRow={asRow} /> },
    { key: 'color', render: (asRow) => (
      <>
        <ToolbarColorBtn asRow={asRow} flip={flip} icon="format_color_text" title="Couleur du texte" current={curColor} colors={TEXT_COLORS}
          defaultBar="#1f1f1f" onPick={(v) => run((c) => v == null ? c.unsetColor() : c.setColor(v))} />
        <ToolbarColorBtn asRow={asRow} flip={flip} icon="border_color" title="Surlignage" current={curHighlight} colors={HIGHLIGHT_COLORS}
          defaultBar="#ffc01f" onPick={(v) => run((c) => v == null ? c.unsetHighlight() : c.toggleHighlight({ color: v }))} />
      </>
    ) },
    { key: 'lists', render: (asRow) => (
      <>
        <ToolbarBtn asRow={asRow} icon="format_list_bulleted" title="Liste à puces" active={editor.isActive('bulletList')} onCmd={() => run((c) => c.toggleBulletList())} />
        <ToolbarBtn asRow={asRow} icon="format_list_numbered" title="Liste numérotée" active={editor.isActive('orderedList')} onCmd={() => run((c) => c.toggleOrderedList())} />
      </>
    ) },
    { key: 'indent', render: (asRow) => (
      <>
        <ToolbarBtn asRow={asRow} icon="format_indent_decrease" title="Diminuer le retrait" disabled={!editor.can().liftListItem('listItem')} onCmd={() => run((c) => c.liftListItem('listItem'))} />
        <ToolbarBtn asRow={asRow} icon="format_indent_increase" title="Augmenter le retrait" disabled={!editor.can().sinkListItem('listItem')} onCmd={() => run((c) => c.sinkListItem('listItem'))} />
      </>
    ) },
    { key: 'clear', render: (asRow) => (
      <ToolbarBtn asRow={asRow} icon="format_clear" title="Effacer la mise en forme" onCmd={() => run((c) => c.unsetAllMarks().clearNodes())} />
    ) }
  ];
}

function ToolbarOverflowMenu({ chunks, flip }) {
  const [open, setOpen] = React.useState(false);
  if (!chunks.length) return null;
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button type="button" title="Plus d'options" style={{ ...tbS.btn, ...(open ? tbS.btnActive : {}) }}
        onMouseDown={(e) => { e.preventDefault(); setOpen((o) => !o); }}>
        <span className="material-icons-outlined" style={{ fontSize: 22 }}>more_horiz</span>
      </button>
      {open &&
        <>
          <div style={tbS.menuScrim} onMouseDown={(e) => { e.preventDefault(); setOpen(false); }} />
          <div style={menuStyle(tbS.overflowMenu, flip)}>
            {chunks.map((chunk) => <div key={chunk.key} style={tbS.overflowRow}>{chunk.render(true)}</div>)}
          </div>
        </>
      }
    </div>
  );
}

const tbS = {
  typeBtn: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4, width: '100%', minHeight: 36, padding: '8px 8px 8px 12px', border: 0, background: 'transparent', borderRadius: 999, cursor: 'pointer', font: "400 14px 'Inter',sans-serif", color: '#232428' },
  blockDrop: { position: 'absolute', top: '100%', left: 0, background: '#fff', border: '1px solid #e0e0eb', borderRadius: 8, boxShadow: '0 4px 12px rgba(37,36,94,0.12)', zIndex: 10, minWidth: 140, overflow: 'hidden' },
  blockItem: { padding: '8px 14px', fontSize: 13, cursor: 'pointer', color: 'rgba(0,0,0,0.78)' },
  blockItemActive: { background: '#ebf6ff' },
  sep: { width: 1, alignSelf: 'stretch', background: '#d8d8e0', flexShrink: 0 },
  btn: { width: 40, height: 40, border: 0, background: 'transparent', borderRadius: 6, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(0,0,0,0.7)', flexShrink: 0 },
  btnActive: { background: '#ebf6ff', color: '#1975d1' },
  itemDisabled: { opacity: 0.35, cursor: 'default' },
  colorBtn: { flexDirection: 'column', gap: 0, paddingTop: 2 },
  colorBar: { width: 18, height: 3, borderRadius: 2, marginTop: -3 },
  menuScrim: { position: 'fixed', inset: 0, zIndex: 9 },
  colorMenu: { position: 'absolute', top: '100%', left: 0, marginTop: 8, background: '#fff', border: '1px solid #ececf2', borderRadius: 16, boxShadow: '0 10px 30px rgba(37,36,94,0.18)', zIndex: 10, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, padding: 14 },
  swatchBtn: { width: 34, height: 34, border: 0, background: 'transparent', borderRadius: 10, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0 },
  swatchBtnActive: { boxShadow: 'inset 0 0 0 2px #1f1f1f' },
  swatch: { width: 24, height: 24, borderRadius: 7 },
  swatchNone: { width: 24, height: 24, borderRadius: 7, border: '1px solid #d8d8e0', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
  overflowMenu: { position: 'absolute', top: '100%', right: 0, marginTop: 8, background: '#fff', border: '1px solid #e0e0eb', borderRadius: 8, boxShadow: '0 4px 12px rgba(37,36,94,0.12)', zIndex: 10, minWidth: 190, overflow: 'visible', padding: '4px 0' },
  overflowRow: { display: 'flex', alignItems: 'center' },
  overflowItem: { display: 'flex', alignItems: 'center', gap: 10, width: '100%', border: 0, background: 'transparent', padding: '8px 14px', cursor: 'pointer', font: "400 13px 'Inter',sans-serif", color: 'rgba(0,0,0,0.78)', textAlign: 'left' },
  overflowItemActive: { background: '#ebf6ff' },
  linkRow: { display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 },
  linkInput: { flex: 1, minWidth: 0, border: 0, borderBottom: '1.5px solid #1975d1', outline: 'none', background: 'transparent', font: "400 14px 'Inter',sans-serif", color: 'rgba(0,0,0,0.85)', padding: '4px 2px' },
  linkBtn: { width: 32, height: 32, border: 0, background: 'transparent', borderRadius: 6, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }
};

window.ToolbarShared = {
  TOOLBAR_BLOCK_TYPES, TEXT_COLORS, HIGHLIGHT_COLORS,
  CHUNK_BTN_W, CHUNK_GAP, CHUNK_PAD, CHUNK_DIV_W, CHUNK_DROPDOWN_W, CHUNK_WIDTHS,
  visibleChunkCount, useToolbarWidth,
  useLinkEditor, ToolbarLinkEditRow,
  ToolbarBtn, ToolbarColorBtn, ToolbarBlockDropdown, ToolbarOverflowMenu,
  buildToolbarChunks,
  tbS
};
