/* global React */
// =========================================================
// QuickSendModal — dialogue léger pour transmettre UN document
// individuel, ouvert par « Prescrire »/« Transmettre » sur une
// chip (menu de survol). Réutilise DocumentActionPanel en mode
// compact (sans colonne Aperçu). Pour une vue d'ensemble de tous
// les documents de la note, voir TransmissionModal.jsx (ouvert
// par défaut via « Compléter » ou l'icône ➤).
// =========================================================
function QuickSendModal({ doc, doctorName, institution, onPatch, onComplete, onCancel, onOpenFull }) {
  const [screen, setScreen] = React.useState('review'); // 'review' | 'print' | 'fax'
  const [faxPrefill, setFaxPrefill] = React.useState(null);

  React.useEffect(function () {
    function onKey(e) { if (e.key === 'Escape' && screen === 'review') onCancel(); }
    document.addEventListener('keydown', onKey);
    return function () { document.removeEventListener('keydown', onKey); };
  }, [screen, onCancel]);

  if (!doc) return null;
  const meta = window.TX_META ? window.TX_META[doc.kind] : null;

  function patch(p) { if (onPatch) onPatch(doc.id, p); }
  function addRecipient(r) {
    if (doc.recipients.some(function (x) { return x.name === r.name; })) return;
    var withId = Object.assign({ id: 'r-' + doc.id + '-' + doc.recipients.length + '-' + r.name.length }, r);
    patch({ recipients: doc.recipients.concat([withId]) });
  }
  function removeRecipient(rid) {
    patch({ recipients: doc.recipients.filter(function (x) { return x.id !== rid; }) });
  }
  function markComplete() { if (onComplete) onComplete(doc.id); }
  function doCompleteAndPrint() { markComplete(); setScreen('print'); }
  function doCompleteAndFax(prefill) {
    markComplete();
    setFaxPrefill(prefill ? (doc.recipients[0] || null) : null);
    setScreen('fax');
  }
  function quickPrint() { setScreen('print'); }
  function quickSend() {
    patch({ transmitted: true });
    if (window.toast) window.toast('Document transmis', { icon: 'check_circle' });
    onCancel();
  }
  function onFaxSent(recipient) {
    if (recipient) addRecipient(recipient);
    patch({ transmitted: true });
    if (window.toast) window.toast('Fax envoyé', { icon: 'check_circle' });
    onCancel();
  }
  function onPrintDone() {
    patch({ transmitted: true });
    onCancel();
  }

  if (screen === 'print') {
    return (
      <window.PrintDialog
        doc={doc} doctorName={doctorName} institution={institution}
        onCancel={function () { setScreen('review'); }}
        onDone={onPrintDone} />
    );
  }
  if (screen === 'fax') {
    return (
      <window.FaxScreen
        doc={doc} doctorName={doctorName} institution={institution}
        directory={meta ? meta.suggestions : []}
        prefill={faxPrefill}
        onCancel={function () { setScreen('review'); setFaxPrefill(null); }}
        onSent={onFaxSent} />
    );
  }

  return (
    <div style={qs.overlay} onMouseDown={onCancel}>
      <div style={qs.dialog} onMouseDown={function (e) { e.stopPropagation(); }} role="dialog" aria-modal="true">
        <div style={qs.head}>
          <div>
            <div style={qs.title}>{doc.title}</div>
            <div style={qs.subtitle}>Envoi rapide — un seul document.</div>
          </div>
          <button style={qs.closeBtn} onClick={onCancel} aria-label="Fermer">
            <span className="material-icons" style={{ fontSize: 24, color: 'rgba(0,0,0,0.55)' }}>close</span>
          </button>
        </div>

        <div style={qs.body}>
          {meta &&
            <window.DocumentActionPanel
              doc={doc} meta={meta} doctorName={doctorName} institution={institution} compact
              onAddRecipient={addRecipient}
              onRemoveRecipient={removeRecipient}
              onComplete={markComplete}
              onCompleteAndPrint={doCompleteAndPrint}
              onCompleteAndFax={doCompleteAndFax}
              onQuickPrint={quickPrint}
              onQuickSend={quickSend} />
          }
        </div>

        {onOpenFull &&
          <div style={qs.footer}>
            <button style={qs.linkBtn} onClick={onOpenFull}>Voir tous les documents de la note</button>
          </div>
        }
      </div>
    </div>
  );
}

const qs = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(20,20,40,0.55)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 4000, animation: 'snm-fade 140ms ease-out',
  },
  dialog: {
    width: 640, maxWidth: 'calc(100vw - 40px)', maxHeight: '88vh',
    background: '#fff', borderRadius: 18, boxShadow: '0 18px 48px rgba(20,20,50,0.32)',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
    fontFamily: "'Inter', sans-serif", animation: 'snm-pop 160ms cubic-bezier(.2,.8,.3,1)',
  },
  head: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    padding: '22px 26px 16px', borderBottom: '1px solid #f0f0f6', flexShrink: 0,
  },
  title: { fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 19, color: 'rgba(0,0,0,0.88)' },
  subtitle: { fontSize: 13, color: 'rgba(0,0,0,0.5)', marginTop: 3 },
  closeBtn: { border: 0, background: 'transparent', cursor: 'pointer', padding: 2, display: 'inline-flex', marginTop: 1 },

  body: { padding: '18px 26px 22px', overflowY: 'auto', flex: 1 },

  footer: { padding: '10px 26px 18px', borderTop: '1px solid #f0f0f6', flexShrink: 0 },
  linkBtn: { border: 0, background: 'transparent', cursor: 'pointer', font: "600 13px 'Inter',sans-serif", color: '#1975d1', padding: '6px 0' },
};

window.QuickSendModal = QuickSendModal;
