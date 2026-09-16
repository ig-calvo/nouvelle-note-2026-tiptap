/* global React */
// =========================================================
// DocumentViewerModal.jsx — prévisualisation d'un fichier joint à la note
// (chip type "file" : PDF/PNG/JPG). Side sheet ancré à droite, scrim sur
// le reste de l'écran — d'après la maquette Figma « Création de documents
// et PDF editable » (états Loading / Édition). Remplace le ChipPopover
// générique pour ce type de chip (son corps était vide, sans utilité pour
// un fichier — voir NoteEditor.jsx onChipClick).
//
// Pas de lib PDF dans ce prototype : un PDF est rendu via le viewer natif
// du navigateur (<iframe src={blobURL}>), suffisant pour une prévisualisation
// (pas de pagination/annotation custom — hors scope de cette fonctionnalité).
// =========================================================

function fileKindFromName(name) {
  var ext = (name || '').split('.').pop().toLowerCase();
  if (ext === 'pdf') return 'pdf';
  if (ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'gif' || ext === 'webp') return 'image';
  return 'file';
}

function fileIconForKind(kind) {
  if (kind === 'pdf') return 'picture_as_pdf';
  if (kind === 'image') return 'image';
  return 'attach_file';
}

// file : { name, url, kind }
function DocumentViewerModal({ file, onClose }) {
  const [loading, setLoading] = React.useState(true);
  const [zoom, setZoom] = React.useState(100);

  // Chargement simulé — même sur un blob local (quasi instantané), le
  // produit veut un état de chargement visible à l'ouverture (voir la
  // maquette Loading) plutôt qu'un flash trop bref pour être perçu.
  React.useEffect(function () {
    setLoading(true);
    setZoom(100);
    const t = setTimeout(function () { setLoading(false); }, 800);
    return function () { clearTimeout(t); };
  }, [file.url]);

  React.useEffect(function () {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return function () { document.removeEventListener('keydown', onKey); };
  }, [onClose]);

  function zoomBy(delta) {
    setZoom(function (z) { return Math.max(50, Math.min(200, z + delta)); });
  }

  return (
    <div style={dvS.scrim} onMouseDown={function (e) { if (e.target === e.currentTarget) onClose(); }}>
      <div style={dvS.sheet} role="dialog" aria-label="Aperçu du document">
        <div style={dvS.header}>
          <span className="material-icons-outlined" style={dvS.headerIcon}>{fileIconForKind(file.kind)}</span>
          <span style={dvS.headerTitle} title={file.name}>{file.name}</span>
          <button type="button" style={dvS.closeBtn} onClick={onClose} title="Fermer">
            <span className="material-icons-outlined" style={{ fontSize: 22 }}>close</span>
          </button>
        </div>

        <div style={file.kind === 'pdf' && !loading ? dvS.bodyFull : dvS.body}>
          {loading ? (
            <div style={dvS.loadingWrap}>
              <span className="material-symbols-outlined" style={dvS.spinner}>progress_activity</span>
              <span style={dvS.loadingLabel}>Ouverture du fichier en cours...</span>
            </div>
          ) : file.kind === 'pdf' ? (
            // Plein cadre, sans carte ni zoom custom : le viewer PDF natif du
            // navigateur gère déjà sa propre pagination/zoom en plein espace —
            // l'encarter dans .page (avec un transform: scale ancêtre) cassait
            // par ailleurs son rendu dans certains navigateurs.
            <iframe src={file.url} title={file.name} style={dvS.pdfFull} />
          ) : (
            <div style={dvS.pageWrap}>
              <div style={Object.assign({}, dvS.page, { transform: 'scale(' + (zoom / 100) + ')' })}>
                {file.kind === 'image' &&
                  <img src={file.url} alt={file.name} style={dvS.image} />}
                {file.kind === 'file' &&
                  <div style={dvS.unsupported}>
                    <span className="material-icons-outlined" style={{ fontSize: 40, color: 'rgba(0,0,0,0.35)' }}>description</span>
                    <span>Aperçu non disponible pour ce type de fichier</span>
                  </div>}
              </div>
            </div>
          )}
        </div>

        {!loading &&
          <div style={dvS.footer}>
            {file.kind !== 'pdf' &&
              <div style={dvS.zoomGroup}>
                <button type="button" style={dvS.zoomBtn} onClick={function () { zoomBy(-10); }} title="Réduire" disabled={zoom <= 50}>
                  <span className="material-icons-outlined" style={{ fontSize: 20 }}>zoom_out</span>
                </button>
                <span style={dvS.zoomPct}>{zoom}%</span>
                <button type="button" style={dvS.zoomBtn} onClick={function () { zoomBy(10); }} title="Agrandir" disabled={zoom >= 200}>
                  <span className="material-icons-outlined" style={{ fontSize: 20 }}>zoom_in</span>
                </button>
              </div>}
            <div style={{ flex: 1 }} />
            <button type="button" style={dvS.closePrimaryBtn} onClick={onClose}>Fermer</button>
          </div>}
      </div>
    </div>
  );
}

const dvS = {
  scrim: { position: 'fixed', inset: 0, zIndex: 600, background: 'rgba(0,0,0,0.3)', display: 'flex', justifyContent: 'flex-end', animation: 'sheet-scrim-in 200ms ease-out' },
  sheet: { position: 'relative', width: 'min(1200px, calc(100vw - 160px))', height: '100%', background: '#f8f7fd', boxShadow: '-12px 0 40px rgba(20,20,50,0.22)', display: 'flex', flexDirection: 'column', animation: 'docviewer-in 260ms cubic-bezier(.16,1,.3,1)', fontFamily: "'Inter',sans-serif" },
  header: { display: 'flex', alignItems: 'center', gap: 10, height: 68, flexShrink: 0, padding: '0 20px', borderBottom: '1px solid rgba(0,0,0,0.08)' },
  headerIcon: { fontSize: 22, color: 'rgba(0,0,0,0.55)', flexShrink: 0 },
  headerTitle: { flex: 1, font: "600 18px 'Poppins',sans-serif", color: '#17171a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  closeBtn: { width: 44, height: 44, borderRadius: 8, border: '1px solid #798086', background: 'transparent', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#232428', flexShrink: 0 },
  body: { flex: 1, minHeight: 0, overflow: 'auto', padding: 16 },
  bodyFull: { flex: 1, minHeight: 0, overflow: 'hidden', padding: 0 },
  loadingWrap: { height: '100%', minHeight: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 },
  spinner: { fontSize: 64, color: 'rgb(46,56,166)', animation: 'ai-spin 1s linear infinite' },
  loadingLabel: { font: "400 12px 'Inter',sans-serif", color: '#0a0a0a' },
  pageWrap: { minHeight: '100%', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' },
  page: { background: '#fff', borderRadius: 4, boxShadow: '0px 0px 4px rgba(44,41,61,.12), 0px 4px 6px rgba(44,41,61,.12)', overflow: 'hidden', transformOrigin: 'top center', maxWidth: '100%' },
  image: { display: 'block', maxWidth: '100%', height: 'auto' },
  pdfFull: { display: 'block', width: '100%', height: '100%', border: 0 },
  unsupported: { width: 400, height: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'rgba(0,0,0,0.5)', font: "400 13px 'Inter',sans-serif", textAlign: 'center', padding: 24 },
  footer: { display: 'flex', alignItems: 'center', gap: 10, height: 68, flexShrink: 0, padding: '0 20px', borderTop: '1px solid rgba(0,0,0,0.08)' },
  zoomGroup: { display: 'flex', alignItems: 'center', gap: 8 },
  zoomBtn: { width: 40, height: 40, borderRadius: 8, border: '1px solid #c9c9d6', background: '#fff', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#232428' },
  zoomPct: { font: "500 13px 'Inter',sans-serif", color: 'rgba(0,0,0,0.75)', minWidth: 40, textAlign: 'center' },
  closePrimaryBtn: { border: 0, borderRadius: 8, background: '#120082', color: '#fff', padding: '9px 22px', font: "600 14px 'Inter',sans-serif", cursor: 'pointer' }
};

Object.assign(window, { DocumentViewerModal, fileKindFromName, fileIconForKind });
