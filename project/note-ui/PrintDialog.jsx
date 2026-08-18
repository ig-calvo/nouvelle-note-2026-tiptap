/* global React */
// =========================================================
// PrintDialog — faux dialogue d'impression de navigateur,
// superposé à l'aperçu du document (voir
// PLAN-transmission-ordonnance.md §2.5). Purement simulé : ne
// déclenche pas window.print(), le contenu étant généré
// dynamiquement par DocumentPreview.
// =========================================================
function PrintDialog({ doc, doctorName, institution, onCancel, onDone }) {
  React.useEffect(function () {
    function onKey(e) { if (e.key === 'Escape') onCancel(); }
    document.addEventListener('keydown', onKey);
    return function () { document.removeEventListener('keydown', onKey); };
  }, [onCancel]);

  return (
    <div style={pd.shell}>
      <div style={pd.previewArea}>
        <window.DocumentPreview doc={doc} doctorName={doctorName} institution={institution} scale={1} />
      </div>
      <div style={pd.panel}>
        <div style={pd.panelTitle}>Imprimer</div>

        <div style={pd.field}>
          <div style={pd.fieldLabel}>Destination</div>
          <div style={pd.fieldValue}>
            <span className="material-icons-outlined" style={{ fontSize: 18, color: 'rgba(0,0,0,0.5)' }}>print</span>
            Imprimante par défaut
          </div>
        </div>
        <div style={pd.field}>
          <div style={pd.fieldLabel}>Pages</div>
          <div style={pd.fieldValue}>Toutes</div>
        </div>
        <div style={pd.field}>
          <div style={pd.fieldLabel}>Copies</div>
          <div style={pd.fieldValue}>1</div>
        </div>

        <div style={{ flex: 1 }} />

        <div style={pd.actions}>
          <button style={pd.cancelBtn} onClick={onCancel}>Annuler</button>
          <button style={pd.printBtn} onClick={onDone}>Imprimer</button>
        </div>
      </div>
    </div>
  );
}

const pd = {
  shell: {
    position: 'fixed', inset: 0, background: '#e8e8ec', zIndex: 4100,
    display: 'flex', alignItems: 'stretch', justifyContent: 'center', gap: 24,
    padding: '40px 40px', fontFamily: "'Inter', sans-serif", animation: 'snm-fade 140ms ease-out',
  },
  previewArea: { display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflow: 'auto', flex: 1 },
  panel: {
    width: 300, flexShrink: 0, background: '#fff', borderRadius: 10,
    boxShadow: '0 8px 24px rgba(0,0,0,0.18)', padding: '20px 20px 16px', display: 'flex', flexDirection: 'column',
  },
  panelTitle: { fontSize: 16, fontWeight: 600, color: 'rgba(0,0,0,0.85)', marginBottom: 16 },
  field: { marginBottom: 14 },
  fieldLabel: { fontSize: 11.5, color: 'rgba(0,0,0,0.5)', marginBottom: 5 },
  fieldValue: {
    display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: 'rgba(0,0,0,0.82)',
    border: '1px solid #dcdce6', borderRadius: 7, padding: '8px 10px',
  },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 },
  cancelBtn: { border: 0, background: 'transparent', cursor: 'pointer', font: "500 13.5px 'Inter',sans-serif", color: 'rgba(0,0,0,0.6)', padding: '8px 12px' },
  printBtn: { border: 0, borderRadius: 7, background: '#1975d1', color: '#fff', font: "600 13.5px 'Inter',sans-serif", padding: '8px 18px', cursor: 'pointer' },
};

window.PrintDialog = PrintDialog;
