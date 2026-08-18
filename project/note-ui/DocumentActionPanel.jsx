/* global React */
// =========================================================
// DocumentActionPanel — contenu/destinataire/aperçu + barre de
// statut et bouton split « Compléter » pour UN document
// transmissible. Composant partagé par les deux points d'entrée
// de la transmission (voir PLAN-transmission-ordonnance.md) :
//  - TransmissionModal (bottom sheet, tous les documents) : mode
//    complet (3 colonnes, avec aperçu).
//  - QuickSendModal (dialogue léger, un seul document — ouvert
//    par « Prescrire »/« Transmettre » sur une chip) : mode
//    `compact` (2 colonnes, sans aperçu — dispo via Imprimer).
// =========================================================
function DocumentActionPanel({ doc, meta, doctorName, institution, compact,
  onAddRecipient, onRemoveRecipient, onComplete, onCompleteAndPrint, onCompleteAndFax,
  onQuickPrint, onQuickSend }) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [recipientPickerOpen, setRecipientPickerOpen] = React.useState(false);
  const [previewZoom, setPreviewZoom] = React.useState(false);

  const disabledReason = doc.recipients.length === 0
    ? 'Aucun destinataire sélectionné\n' + (doc.complete ? '' : (doc.title + ' non complétée'))
    : '';
  const splitDisabled = doc.recipients.length === 0;

  return (
    <React.Fragment>
      <div style={dap.statusBar}>
        <span style={Object.assign({}, dap.statusBadge, doc.complete ? dap.statusBadgeOn : {})}>
          {doc.complete ? 'Complétée' : 'Non complétée'}
        </span>
        <span style={Object.assign({}, dap.statusBadge, doc.transmitted ? dap.statusBadgeOn : {})}>
          {doc.transmitted ? 'Transmise' : 'Non transmise'}
        </span>
        <div style={{ flex: 1 }} />
        <button
          title={doc.complete ? 'Imprimer' : 'Compléter le document avant impression'}
          style={Object.assign({}, dap.iconBtn, !doc.complete ? dap.btnDisabled : {})}
          disabled={!doc.complete}
          onClick={onQuickPrint}>
          <span className="material-icons-outlined" style={{ fontSize: 20 }}>print</span>
        </button>
        <button
          title={(!doc.complete || doc.recipients.length === 0) ? 'Compléter et choisir un destinataire avant de transmettre' : 'Transmettre'}
          style={Object.assign({}, dap.iconBtn, (!doc.complete || doc.recipients.length === 0 || doc.transmitted) ? dap.btnDisabled : {})}
          disabled={!doc.complete || doc.recipients.length === 0 || doc.transmitted}
          onClick={onQuickSend}>
          <span className="material-icons-outlined" style={{ fontSize: 20 }}>send</span>
        </button>
        {!doc.complete &&
          <div style={{ position: 'relative' }}>
            <button
              title={splitDisabled ? disabledReason : undefined}
              style={Object.assign({}, dap.splitBtn, splitDisabled ? dap.btnDisabled : {})}
              disabled={splitDisabled}
              onClick={function () { setMenuOpen(!menuOpen); }}>
              Compléter {meta.nounPhrase}
              <span className="material-icons" style={{ fontSize: 20 }}>arrow_drop_down</span>
            </button>
            {menuOpen && !splitDisabled &&
              <React.Fragment>
                <div style={dap.ddScrim} onMouseDown={function () { setMenuOpen(false); }} />
                <div style={dap.splitMenu}>
                  <button style={dap.splitMenuItem} onClick={function () { setMenuOpen(false); onComplete(); }}>Compléter</button>
                  <button style={dap.splitMenuItem} onClick={function () { setMenuOpen(false); onCompleteAndPrint(); }}>Compléter et imprimer</button>
                  <button style={dap.splitMenuItem} onClick={function () { setMenuOpen(false); onCompleteAndFax(true); }}>Compléter et faxer</button>
                  <button style={dap.splitMenuItem} onClick={function () { setMenuOpen(false); onCompleteAndFax(false); }}>Compléter et faxer à</button>
                </div>
              </React.Fragment>
            }
          </div>
        }
      </div>

      <div style={compact ? dap.colsCompact : dap.cols}>
        <div style={dap.col}>
          <div style={dap.colLabel}>{doc.kind === 'prescription' ? 'PRESCRIPTIONS (' + doc.items.length + ')' : 'DÉTAILS'}</div>
          <div style={dap.contentList}>
            {doc.items.map(function (it, i) {
              return (
                <div key={it.id || i} style={dap.contentItem}>
                  <span className="material-icons-outlined" style={{ fontSize: 18, color: it.ceased ? '#b3261e' : meta.accent, flexShrink: 0, marginTop: 1 }}>
                    {it.ceased ? 'cancel' : meta.icon}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={Object.assign({}, dap.contentItemLabel, it.ceased ? { textDecoration: 'line-through', color: 'rgba(0,0,0,0.4)' } : {})}>{it.label}</div>
                    {it.sub ? <div style={dap.contentItemSub}>{it.sub}</div> : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={dap.col}>
          <div style={dap.colLabel}>DESTINATAIRE ({doc.recipients.length})
            <button style={dap.addRecipientBtn} onClick={function () { setRecipientPickerOpen(!recipientPickerOpen); }}>
              <span className="material-icons" style={{ fontSize: 18 }}>add</span>
            </button>
          </div>

          {doc.recipients.length === 0 &&
            <div style={dap.warnBanner}>
              <span className="material-icons-outlined" style={{ fontSize: 18, color: '#a15c00' }}>warning</span>
              <span style={dap.warnText}>Ajouter un destinataire pour transmettre {meta.nounPhrase}.</span>
            </div>
          }

          {doc.recipients.map(function (r) {
            return (
              <div key={r.id} style={dap.recipientCard}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={dap.recipientName}>{r.name}</div>
                  <div style={dap.recipientMeta}>{[r.phone, r.fax].filter(Boolean).join(' · ')}</div>
                </div>
                <button style={dap.removeBtn} onClick={function () { onRemoveRecipient(r.id); }} title="Retirer">
                  <span className="material-icons-outlined" style={{ fontSize: 17 }}>close</span>
                </button>
              </div>
            );
          })}

          {recipientPickerOpen &&
            <div style={dap.suggestBox}>
              <div style={dap.suggestTitle}>
                <span className="material-icons" style={{ fontSize: 15, color: '#a37f00' }}>auto_awesome</span>
                Suggestions
              </div>
              {meta.suggestions.filter(function (s) { return !doc.recipients.some(function (r) { return r.name === s.name; }); }).map(function (s) {
                return (
                  <button key={s.name} style={dap.suggestRow} onClick={function () { onAddRecipient(s); setRecipientPickerOpen(false); }}>
                    {s.favorite ? <span className="material-icons" style={{ fontSize: 15, color: '#e0637a' }}>favorite</span> : <span style={{ width: 15 }} />}
                    <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                      <div style={dap.suggestName}>{s.name}</div>
                      <div style={dap.suggestMeta}>{[s.phone, s.fax].filter(Boolean).join(' · ')}</div>
                    </div>
                    <span className="material-icons" style={{ fontSize: 18, color: '#1975d1' }}>add</span>
                  </button>
                );
              })}
            </div>
          }
        </div>

        {!compact &&
          <div style={dap.col}>
            <div style={dap.colLabel}>APERÇU
              <button style={dap.zoomBtn} onClick={function () { setPreviewZoom(!previewZoom); }} title="Agrandir">
                <span className="material-icons-outlined" style={{ fontSize: 17 }}>{previewZoom ? 'close_fullscreen' : 'open_in_full'}</span>
              </button>
            </div>
            <div style={dap.previewWrap}>
              <window.DocumentPreview doc={doc} doctorName={doctorName} institution={institution} scale={previewZoom ? 1 : 0.72} />
            </div>
          </div>
        }
      </div>
    </React.Fragment>
  );
}

const dap = {
  statusBar: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, position: 'relative' },
  statusBadge: {
    fontSize: 12, fontWeight: 700, borderRadius: 7, padding: '5px 10px',
    background: '#f1f1f6', color: 'rgba(0,0,0,0.5)',
  },
  statusBadgeOn: { background: '#e6f5ee', color: '#2e9b7a' },
  iconBtn: {
    width: 36, height: 36, borderRadius: 8, border: '1px solid #e2e2ec', background: '#fff',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(0,0,0,0.6)',
  },
  splitBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 4, border: 0, borderRadius: 9,
    background: '#25245E', color: '#fff', font: "600 13.5px 'Inter',sans-serif",
    padding: '9px 8px 9px 16px', cursor: 'pointer', whiteSpace: 'nowrap',
  },
  btnDisabled: { opacity: 0.42, cursor: 'not-allowed' },
  ddScrim: { position: 'fixed', inset: 0, zIndex: 10 },
  splitMenu: {
    position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 11, minWidth: 220,
    background: '#fff', border: '1px solid #e2e2ec', borderRadius: 10,
    boxShadow: '0 10px 28px rgba(20,20,50,0.18)', padding: '5px 0',
  },
  splitMenuItem: {
    display: 'block', width: '100%', textAlign: 'left', border: 0, background: 'transparent',
    padding: '10px 14px', font: "500 13.5px 'Inter',sans-serif", color: 'rgba(0,0,0,0.8)', cursor: 'pointer',
  },

  cols: { display: 'grid', gridTemplateColumns: '1.15fr 1fr 1fr', gap: 22, alignItems: 'start' },
  colsCompact: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' },
  col: { minWidth: 0 },
  colLabel: {
    display: 'flex', alignItems: 'center', gap: 6,
    fontSize: 12, fontWeight: 700, color: 'rgba(0,0,0,0.5)', letterSpacing: 0.3,
    textTransform: 'uppercase', marginBottom: 10,
  },

  contentList: { display: 'flex', flexDirection: 'column', gap: 12 },
  contentItem: { display: 'flex', alignItems: 'flex-start', gap: 9 },
  contentItemLabel: { fontSize: 14, fontWeight: 600, color: 'rgba(0,0,0,0.82)', lineHeight: 1.35 },
  contentItemSub: { fontSize: 12.5, color: 'rgba(0,0,0,0.5)', marginTop: 1, lineHeight: 1.3 },

  addRecipientBtn: {
    marginLeft: 4, width: 20, height: 20, borderRadius: 6, border: 0, background: '#eef1fb',
    color: '#25245E', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
  },
  warnBanner: {
    display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #f3ddb0', background: '#fdf6e6',
    borderRadius: 9, padding: '9px 11px', marginBottom: 10,
  },
  warnText: { fontSize: 12.5, color: '#7a5200', lineHeight: 1.4 },
  recipientCard: {
    display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #e2e2ec', borderRadius: 9,
    padding: '9px 10px', marginBottom: 8,
  },
  recipientName: { fontSize: 13.5, fontWeight: 600, color: 'rgba(0,0,0,0.82)' },
  recipientMeta: { fontSize: 12, color: 'rgba(0,0,0,0.5)', marginTop: 1 },
  removeBtn: { border: 0, background: 'transparent', cursor: 'pointer', color: 'rgba(0,0,0,0.4)', flexShrink: 0 },

  suggestBox: { border: '1px solid #e2e2ec', borderRadius: 10, marginTop: 6, padding: '6px 0', background: '#fcfcfe' },
  suggestTitle: {
    display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 700, color: '#a37f00',
    padding: '4px 12px 6px', letterSpacing: 0.2,
  },
  suggestRow: {
    display: 'flex', alignItems: 'center', gap: 8, width: '100%', border: 0, background: 'transparent',
    padding: '8px 12px', cursor: 'pointer',
  },
  suggestName: { fontSize: 13, fontWeight: 600, color: 'rgba(0,0,0,0.8)' },
  suggestMeta: { fontSize: 11.5, color: 'rgba(0,0,0,0.48)' },

  zoomBtn: { marginLeft: 'auto', border: 0, background: 'transparent', cursor: 'pointer', color: 'rgba(0,0,0,0.45)' },
  previewWrap: { border: '1px solid #ececf2', borderRadius: 12, padding: 14, background: '#f4f4f8', overflow: 'auto' },
};

window.DocumentActionPanel = DocumentActionPanel;
