/* global React */

const CLINICAL_TOOLS = [
  { id: 'itu', label: 'Feuille de route - Symptômes urinaires', hasTool: true },
  { id: 'exam-court', label: 'Examen physique - Version courte', hasTool: true },
  { id: 'ep-gabarit', label: 'Examen physique complet - Gabarit' },
  { id: 'em-gabarit', label: 'Examen mental complet - Gabarit' },
  { id: 'sommaire', label: 'Saisie rapide du sommaire - Gabarit' },
  { id: 'douleur-thoracique', label: 'Douleur thoracique' },
  { id: 'prevention', label: 'Fiche de prévention clinique' },
  { id: 'ah253', label: "Note d'évolution (AH-253)" },
  { id: 'findrisc', label: 'Findrisc' },
  { id: 'glycemies', label: 'Tableau des glycémies' },
  { id: 'inr', label: 'Suivi INR' },
  { id: 'cystite', label: "Cystite - Formulaire de liaison à l'attention du pharmacien communautaire" },
  { id: 'hta-oc', label: "Hypertension artérielle - Formulaire d'adhésion à l'ordonnance collective" },
  { id: 'diabete-oc', label: "Diabète de type 2 - Formulaire d'adhésion à l'ordonnance collective" },
  { id: 'alzheimer', label: 'Repérage et processus menant au diagnostic - Alzheimer et TNC' },
  { id: 'exercices', label: "Prescription d'exercices et demande de consultation" },
  { id: 'luci', label: 'Référencement Luci' },
  { id: 'srdv', label: 'Sans rendez-vous - Gabarit' },
  { id: 'hydro', label: 'Certificat médical - Hydro-Québec' },
  { id: 'ah280', label: 'Urgence - Consultation externe (AH-280)' },
  { id: 'mmas8', label: 'MMAS-8 - Morisky Medication Adherence Scale' },
  { id: 'nicotine', label: 'Traitement de remplacement de la nicotine' },
];

function ClinicalToolPicker({ anchorRect, onClose, onSelect, onBack }) {
  const [query, setQuery] = React.useState('');
  const [tab, setTab] = React.useState('all');
  const DEFAULT_FAVORITES = ['itu', 'ep-gabarit', 'em-gabarit', 'douleur-thoracique', 'prevention'];
  const [favorites, setFavorites] = React.useState(function () {
    try {
      const stored = localStorage.getItem('ct-favorites');
      return stored !== null ? JSON.parse(stored) : DEFAULT_FAVORITES;
    } catch (e) { return DEFAULT_FAVORITES; }
  });
  const [hovered, setHovered] = React.useState(null);
  const [inputFocused, setInputFocused] = React.useState(false);
  const panelRef = React.useRef(null);
  const inputRef = React.useRef(null);

  React.useEffect(function () {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    function onDoc(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose();
    }
    window.addEventListener('keydown', onKey);
    // Defer the close-outside listener by a tick: the menu item that opens this
    // picker fires on mousedown, and React mounts us mid-propagation — attaching
    // synchronously would let that same mousedown immediately close the picker.
    const t = setTimeout(function () { document.addEventListener('mousedown', onDoc); }, 0);
    return function () {
      clearTimeout(t);
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDoc);
    };
  }, [onClose]);

  React.useEffect(function () {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  function toggleFav(id, e) {
    e.stopPropagation();
    setFavorites(function (favs) {
      const next = favs.includes(id) ? favs.filter(function (f) { return f !== id; }) : favs.concat([id]);
      try { localStorage.setItem('ct-favorites', JSON.stringify(next)); } catch (err) {}
      return next;
    });
  }

  const q = query.toLowerCase().trim();
  const filtered = CLINICAL_TOOLS.filter(function (t) { return !q || t.label.toLowerCase().includes(q); });
  const displayed = tab === 'favori' ? filtered.filter(function (t) { return favorites.includes(t.id); }) : filtered;

  // Panel position: below anchor (or flipped above), clamped to viewport.
  // Same 70vh cap as the slash / add menu, but the height is also bounded by
  // the space actually available so the list never overflows the screen.
  const panelW = 480;
  const MARGIN = 16;
  const VH_CAP = Math.round(window.innerHeight * 0.7);
  var left = MARGIN, top = 80, maxH = VH_CAP;
  if (anchorRect) {
    left = Math.max(MARGIN, Math.min(anchorRect.left, window.innerWidth - panelW - MARGIN));
    const spaceBelow = window.innerHeight - anchorRect.bottom - MARGIN;
    const spaceAbove = anchorRect.top - MARGIN;
    if (spaceBelow >= 280 || spaceBelow >= spaceAbove) {
      top = anchorRect.bottom + 6;
      maxH = Math.min(VH_CAP, spaceBelow);
    } else {
      maxH = Math.min(VH_CAP, spaceAbove);
      top = Math.max(MARGIN, anchorRect.top - 6 - maxH);
    }
  }

  return (
    <div
      ref={panelRef}
      style={Object.assign({}, ctpS.panel, { left: left, top: top, maxHeight: maxH })}>

      {/* Header */}
      <div style={ctpS.header}>
        <button style={ctpS.iconBtn} onClick={onBack || onClose} title="Retour">
          <span className="material-icons-outlined" style={{ fontSize: 20 }}>arrow_back</span>
        </button>
        <span style={ctpS.title}>Outils cliniques</span>
        <button style={ctpS.iconBtn} onClick={onClose} title="Fermer">
          <span className="material-icons-outlined" style={{ fontSize: 20 }}>close</span>
        </button>
      </div>

      {/* Search — outlined floating-label field */}
      <div style={ctpS.searchOuter}>
        <div style={Object.assign({}, ctpS.searchBox, inputFocused ? ctpS.searchBoxFocused : {})}>
          <span style={Object.assign({}, ctpS.searchLabel, (inputFocused || query) ? ctpS.searchLabelFloat : {})}>
            Recherche
          </span>
          <span className="material-icons-outlined" style={ctpS.searchLeadIcon}>list</span>
          <input
            ref={inputRef}
            style={ctpS.searchInput}
            value={query}
            onChange={function (e) { setQuery(e.target.value); }}
            onFocus={function () { setInputFocused(true); }}
            onBlur={function () { setInputFocused(false); }}
          />
          {query &&
            <button style={ctpS.clearBtn} onMouseDown={function (e) { e.preventDefault(); }} onClick={function () { setQuery(''); inputRef.current && inputRef.current.focus(); }}>
              <span className="material-icons-outlined" style={{ fontSize: 16 }}>close</span>
            </button>
          }
        </div>
      </div>

      {/* Tabs */}
      <div style={ctpS.tabs}>
        <button
          style={Object.assign({}, ctpS.tab, tab === 'favori' ? ctpS.tabActive : {})}
          onClick={function () { setTab('favori'); }}>
          <span className="material-icons-outlined" style={{ fontSize: 15 }}>
            {tab === 'favori' ? 'favorite' : 'favorite_border'}
          </span>
          Favori
        </button>
        <button
          style={Object.assign({}, ctpS.tab, tab === 'all' ? ctpS.tabActive : {})}
          onClick={function () { setTab('all'); }}>
          <span className="material-icons-outlined" style={{ fontSize: 15 }}>folder</span>
          Groupes
        </button>
      </div>

      {/* List */}
      <div style={ctpS.list}>
        {displayed.map(function (tool) {
          const isFav = favorites.includes(tool.id);
          const isHov = hovered === tool.id;
          const disabled = !tool.hasTool;
          return (
            <div
              key={tool.id}
              style={Object.assign({}, ctpS.item, disabled ? ctpS.itemDisabled : (isHov ? ctpS.itemHov : {}))}
              title={disabled ? 'Bientôt disponible' : undefined}
              onMouseEnter={function () { if (!disabled) setHovered(tool.id); }}
              onMouseLeave={function () { setHovered(null); }}
              onClick={function () { if (!disabled) onSelect(tool); }}>
              <button
                style={ctpS.heartBtn}
                onMouseDown={function (e) { e.stopPropagation(); }}
                onClick={function (e) { toggleFav(tool.id, e); }}
                title={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}>
                <span className="material-icons" style={{ fontSize: 20, color: isFav ? '#e8112d' : 'rgba(0,0,0,0.28)' }}>
                  {isFav ? 'favorite' : 'favorite_border'}
                </span>
              </button>
              <span style={Object.assign({}, ctpS.itemLabel, disabled ? ctpS.itemLabelDisabled : {})}>{tool.label}</span>
              {disabled && <span style={ctpS.soonBadge}>Bientôt</span>}
            </div>
          );
        })}
        {displayed.length === 0 && tab === 'favori' && !q &&
          <div style={ctpS.empty}>Cliquez sur ♡ pour ajouter des favoris.</div>
        }
        {displayed.length === 0 && q &&
          <div style={ctpS.empty}>Aucun résultat pour «&nbsp;{query}&nbsp;».</div>
        }
      </div>

    </div>
  );
}

const ctpS = {
  panel: {
    position: 'fixed',
    zIndex: 3000,
    width: 480,
    background: '#fff',
    border: '1px solid #ececf2',
    borderRadius: 12,
    boxShadow: '0 14px 40px rgba(37,36,94,0.20)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    fontFamily: "var(--font-body, 'Inter', sans-serif)",
    animation: 'medmenu-in 140ms var(--motion-ease, cubic-bezier(0.2,0,0,1))',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 12px',
    borderBottom: '1px solid #f0f0f6',
    flexShrink: 0,
  },
  iconBtn: {
    width: 32, height: 32, border: 0,
    background: 'transparent', borderRadius: 8,
    cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    color: 'rgba(0,0,0,0.45)',
  },
  title: {
    flex: 1, textAlign: 'center',
    fontSize: 14, fontWeight: 600,
    color: 'var(--fg-1, rgba(0,0,0,0.82))',
    fontFamily: "var(--font-head, 'Poppins', sans-serif)",
  },
  searchOuter: {
    padding: '10px 14px 6px',
    flexShrink: 0,
  },
  searchBox: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    border: '1.5px solid #c4c4d4',
    borderRadius: 8,
    padding: '0 8px 0 10px',
    transition: 'border-color 120ms',
    background: '#fff',
  },
  searchBoxFocused: {
    border: '1.5px solid var(--brand-primary, #1a5fd4)',
  },
  searchLabel: {
    position: 'absolute',
    left: 36,
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: 13.5,
    color: '#8888a0',
    pointerEvents: 'none',
    transition: 'all 120ms',
    background: '#fff',
    padding: '0 3px',
  },
  searchLabelFloat: {
    top: 0,
    left: 32,
    fontSize: 11,
    color: 'var(--brand-primary, #1a5fd4)',
    transform: 'translateY(-50%)',
  },
  searchLeadIcon: {
    fontSize: 18,
    color: '#8888a0',
    flexShrink: 0,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    border: 0,
    outline: 'none',
    padding: '11px 4px',
    fontSize: 13.5,
    color: 'var(--fg-1, rgba(0,0,0,0.82))',
    background: 'transparent',
    fontFamily: "var(--font-body, 'Inter', sans-serif)",
  },
  clearBtn: {
    border: 0,
    background: 'transparent',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    color: '#9494aa',
    padding: 2,
    flexShrink: 0,
  },
  tabs: {
    display: 'flex',
    gap: 6,
    padding: '2px 14px 8px',
    flexShrink: 0,
  },
  tab: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '5px 12px',
    border: '1.5px solid #dcdce8',
    borderRadius: 20,
    background: 'transparent',
    cursor: 'pointer',
    fontSize: 12.5,
    fontWeight: 500,
    color: 'rgba(0,0,0,0.54)',
    fontFamily: "var(--font-body, 'Inter', sans-serif)",
  },
  tabActive: {
    borderColor: 'var(--brand-primary, #1a5fd4)',
    background: '#eef1fb',
    color: 'var(--brand-primary, #1a5fd4)',
  },
  list: {
    flex: 1,
    overflowY: 'auto',
    padding: '2px 0 6px',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '8px 14px 8px 10px',
    cursor: 'pointer',
    transition: 'background 110ms',
  },
  itemHov: {
    background: '#eef1fb',
  },
  itemDisabled: {
    cursor: 'default',
  },
  itemLabelDisabled: {
    color: 'var(--fg-3, rgba(0,0,0,0.4))',
  },
  soonBadge: {
    flexShrink: 0,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: 0.2,
    color: 'rgba(0,0,0,0.42)',
    background: 'rgba(0,0,0,0.06)',
    borderRadius: 20,
    padding: '3px 9px',
  },
  heartBtn: {
    border: 0,
    background: 'transparent',
    cursor: 'pointer',
    flexShrink: 0,
    display: 'inline-flex',
    alignItems: 'center',
    padding: 2,
    borderRadius: '50%',
  },
  itemLabel: {
    flex: 1,
    fontSize: 14,
    color: 'var(--fg-1, rgba(0,0,0,0.82))',
    lineHeight: 1.4,
  },
  empty: {
    padding: '24px 18px',
    textAlign: 'center',
    fontSize: 13,
    color: 'var(--fg-3, #9494aa)',
  },
};

window.ClinicalToolPicker = ClinicalToolPicker;
