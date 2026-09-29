/* global React */
function SmartNoteModal({ onCancel, onConfirm }) {
  React.useEffect(function () {
    function onKey(e) { if (e.key === 'Escape') onCancel(); }
    document.addEventListener('keydown', onKey);
    return function () { document.removeEventListener('keydown', onKey); };
  }, []);

  return (
    <div style={snmStyles.overlay} onMouseDown={onCancel}>
      <div style={snmStyles.dialog} onMouseDown={function (e) { e.stopPropagation(); }} role="dialog" aria-modal="true">
        <div style={snmStyles.head}>
          <span style={snmStyles.title}>Note intelligente</span>
          <button style={snmStyles.closeBtn} onClick={onCancel} aria-label="Fermer">
            <span className="material-icons" style={{ fontSize: 24, color: 'color-mix(in srgb, var(--mat-sys-on-surface) 65%, transparent)' }}>close</span>
          </button>
        </div>
        <p style={snmStyles.body}>
          La fonctionnalité de «&nbsp;note intelligente&nbsp;» est définitivement rattachée à la note en cours, modifier ce statut supprimera tout le contenu actuel rédigé.
        </p>
        <div style={snmStyles.actions}>
          <button style={snmStyles.cancelBtn} onClick={onCancel}>Annuler</button>
          <button style={snmStyles.confirmBtn} onClick={onConfirm}>Activer la note intelligente</button>
        </div>
      </div>
    </div>
  );
}

const snmStyles = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(20,20,40,0.55)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 4000, animation: 'snm-fade 140ms ease-out',
  },
  dialog: {
    width: 460, maxWidth: 'calc(100vw - 40px)', background: 'var(--mat-sys-surface-container-lowest)', borderRadius: 18,
    padding: '28px 30px 26px', boxShadow: '0 18px 48px rgba(20,20,50,0.32)',
    fontFamily: "'Inter', sans-serif", animation: 'snm-pop 160ms cubic-bezier(.2,.8,.3,1)',
  },
  head: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 },
  title: { fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 24, color: 'color-mix(in srgb, var(--mat-sys-on-surface) 88%, transparent)' },
  closeBtn: { border: 0, background: 'transparent', cursor: 'pointer', padding: 2, display: 'inline-flex', marginTop: 2 },
  body: { fontSize: 18, lineHeight: 1.5, color: 'color-mix(in srgb, var(--mat-sys-on-surface) 70%, transparent)', margin: '0 0 28px' },
  actions: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 18 },
  cancelBtn: { border: 0, background: 'transparent', cursor: 'pointer', font: "600 17px 'Inter',sans-serif", color: 'var(--mat-sys-primary)', padding: '8px 12px' },
  confirmBtn: { border: 0, borderRadius: 999, background: 'var(--mat-sys-primary)', cursor: 'pointer', font: "600 17px 'Inter',sans-serif", color: 'var(--mat-sys-on-primary)', padding: '13px 28px' },
};

window.SmartNoteModal = SmartNoteModal;
