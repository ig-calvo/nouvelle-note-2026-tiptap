/* global React */
// =========================================================
// FaxScreen — écran « Faxer un document ». Répertoire filtrable +
// champ destinataire/numéro de fax + aperçu. Le destinataire
// choisi ici est propagé au document du checkout (onSent), pour
// respecter la règle sticky des maquettes Figma.
// =========================================================

// Quelques contacts génériques additionnels pour que la recherche du
// répertoire ait un peu de matière au-delà des suggestions du document.
const FAX_EXTRA_DIRECTORY = [
  { name: L('Hôpital Fleurimont — CHUS'), phone: '819 346-1110', fax: '819 346-1199' },
  { name: L('GMF Sherbrooke-Est'), phone: '819 555-0142', fax: '819 555-0143' },
  { name: L('Clinique médicale King Ouest'), phone: '819 555-0166', fax: '819 555-0167' },
];

function FaxScreen({ doc, doctorName, institution, directory, prefill, onCancel, onSent }) {
  const [query, setQuery] = React.useState('');
  const [sendTo, setSendTo] = React.useState(prefill ? prefill.name : '');
  const [faxNumber, setFaxNumber] = React.useState(prefill ? (prefill.fax || '') : '');

  React.useEffect(function () {
    function onKey(e) { if (e.key === 'Escape') onCancel(); }
    document.addEventListener('keydown', onKey);
    return function () { document.removeEventListener('keydown', onKey); };
  }, [onCancel]);

  const allContacts = (directory || []).concat(FAX_EXTRA_DIRECTORY);
  const q = query.toLowerCase().trim();
  const filtered = allContacts.filter(function (c) { return !q || c.name.toLowerCase().includes(q); });

  function pick(c) { setSendTo(c.name); setFaxNumber(c.fax || ''); }

  const canSend = faxNumber.trim().length > 0;
  function send() {
    if (!canSend) return;
    onSent({ name: sendTo || faxNumber, phone: '', fax: faxNumber.trim() });
  }

  return (
    <div style={fx.shell}>
      <div style={fx.head}>
        <div style={fx.headTitle}>{t('fax.faxerDocument.text')}</div>
        <button style={fx.closeBtn} onClick={onCancel} aria-label={t('fax.fermer.aria')}>
          <span className="material-icons" style={{ fontSize: 24, color: 'rgba(0,0,0,0.55)' }}>close</span>
        </button>
      </div>

      <div style={fx.expediteur}>{t('fax.sender.text', { name: institution || t('fax.etablissementActuel.text') })}</div>

      <div style={fx.bodyRow}>
        <div style={fx.left}>
          <div style={fx.tabs}>
            <div style={Object.assign({}, fx.tab, fx.tabActive)}>{t('fax.repertoire.text')}</div>
            <div style={fx.tab} title={t('fax.nonDisponiblePrototype.tooltip')}>{t('fax.cercleSoins.text')}</div>
          </div>

          <div style={fx.searchBox}>
            <span className="material-icons-outlined" style={{ fontSize: 18, color: 'rgba(0,0,0,0.4)' }}>search</span>
            <input
              value={query} onChange={function (e) { setQuery(e.target.value); }}
              placeholder={t('fax.ressource.placeholder')} style={fx.searchInput} />
          </div>

          <div style={fx.list}>
            {filtered.map(function (c) {
              return (
                <div key={c.name} style={fx.contactRow}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={fx.contactName}>{c.name}</div>
                    <div style={fx.contactMeta}>{[c.phone, c.fax].filter(Boolean).join(' · ')}</div>
                  </div>
                  <button style={fx.pickBtn} onClick={function () { pick(c); }} title={t('fax.choisir.tooltip')}>
                    <span className="material-icons" style={{ fontSize: 18 }}>add</span>
                  </button>
                </div>
              );
            })}
            {filtered.length === 0 && <div style={fx.noResult}>{t('fax.aucunResultat.text')}</div>}
          </div>

          <div style={fx.sendRow}>
            <div style={fx.sendField}>
              <div style={fx.sendLabel}>{t('fax.envoyer.text')}</div>
              <input value={sendTo} onChange={function (e) { setSendTo(e.target.value); }} style={fx.sendInput} placeholder={t('fax.destinataire.placeholder')} />
            </div>
            <div style={fx.sendField}>
              <div style={fx.sendLabel}>{t('fax.numeroFax.text')}</div>
              <input value={faxNumber} onChange={function (e) { setFaxNumber(e.target.value); }} style={fx.sendInput} placeholder="000 000-0000" />
            </div>
          </div>

          <button style={Object.assign({}, fx.faxBtn, !canSend ? fx.btnDisabled : {})} disabled={!canSend} onClick={send}>
            {t('fax.faxer.button')}
          </button>
        </div>

        <div style={fx.right}>
          <window.DocumentPreview doc={doc} doctorName={doctorName} institution={institution} scale={0.9} />
        </div>
      </div>
    </div>
  );
}

const fx = {
  shell: {
    position: 'fixed', inset: 0, background: '#fff', zIndex: 4100,
    display: 'flex', flexDirection: 'column', fontFamily: "'Inter', sans-serif",
    animation: 'snm-fade 140ms ease-out',
  },
  head: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 26px', borderBottom: '1px solid #ececf2', flexShrink: 0,
  },
  headTitle: { fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 18, color: 'rgba(0,0,0,0.88)' },
  closeBtn: { border: 0, background: 'transparent', cursor: 'pointer', padding: 2, display: 'inline-flex' },
  expediteur: { fontSize: 12.5, color: 'rgba(0,0,0,0.5)', padding: '10px 26px 0' },

  bodyRow: { flex: 1, display: 'flex', gap: 24, padding: '16px 26px 26px', overflow: 'hidden' },
  left: { width: 420, flexShrink: 0, display: 'flex', flexDirection: 'column', minHeight: 0 },
  right: { flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', background: '#f4f4f8', borderRadius: 12, padding: 20 },

  tabs: { display: 'flex', gap: 18, borderBottom: '1px solid #ececf2', marginBottom: 12 },
  tab: { fontSize: 13.5, fontWeight: 600, color: 'rgba(0,0,0,0.4)', padding: '0 0 10px', cursor: 'default' },
  tabActive: { color: '#25245E', borderBottom: '2px solid #25245E' },

  searchBox: {
    display: 'flex', alignItems: 'center', gap: 8, border: '1.5px solid #d8d8e4', borderRadius: 9,
    padding: '8px 10px', marginBottom: 10,
  },
  searchInput: { border: 0, outline: 'none', flex: 1, font: "500 13.5px 'Inter',sans-serif" },

  list: { flex: 1, overflowY: 'auto', minHeight: 100, borderBottom: '1px solid #ececf2', paddingBottom: 8, marginBottom: 12 },
  contactRow: { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 4px', borderBottom: '1px solid #f4f4f8' },
  contactName: { fontSize: 13.5, fontWeight: 600, color: 'rgba(0,0,0,0.8)' },
  contactMeta: { fontSize: 12, color: 'rgba(0,0,0,0.48)', marginTop: 1 },
  pickBtn: {
    width: 28, height: 28, borderRadius: 7, border: 0, background: '#eef1fb', color: '#25245E',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
  },
  noResult: { fontSize: 13, color: 'rgba(0,0,0,0.4)', padding: '10px 4px' },

  sendRow: { display: 'flex', gap: 12, marginBottom: 14 },
  sendField: { flex: 1 },
  sendLabel: { fontSize: 11.5, fontWeight: 600, color: 'rgba(0,0,0,0.5)', marginBottom: 5 },
  sendInput: {
    width: '100%', boxSizing: 'border-box', border: '1.5px solid #d8d8e4', borderRadius: 8,
    padding: '9px 11px', font: "500 13.5px 'Inter',sans-serif", outline: 'none',
  },
  faxBtn: {
    alignSelf: 'flex-end', border: 0, borderRadius: 9, background: '#25245E', color: '#fff',
    font: "600 14px 'Inter',sans-serif", padding: '10px 24px', cursor: 'pointer',
  },
  btnDisabled: { opacity: 0.42, cursor: 'not-allowed' },
};

window.FaxScreen = FaxScreen;
