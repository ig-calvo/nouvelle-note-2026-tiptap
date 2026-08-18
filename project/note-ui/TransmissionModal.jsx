/* global React */
// =========================================================
// TransmissionModal — « Transmission des documents » (checkout).
// Bottom sheet, ouvert par défaut quand l'utilisateur clique
// « Compléter » (avec l'item « Note » présélectionné) — inclut
// aussi la finalisation de la note (faire suivre + signature)
// comme un item de la liste, au même titre que l'ordonnance et
// les outils cliniques. Les actions individuelles sur une chip
// (« Prescrire »/« Transmettre ») utilisent plutôt le petit
// dialogue QuickSendModal.jsx, qui réutilise le composant
// DocumentActionPanel.jsx partagé par les deux.
// Voir PLAN-transmission-ordonnance.md §2, §5, §6.
// =========================================================

// Métadonnées de présentation par type de document (icône, couleur,
// suggestions de destinataires fictives) — la clé est le `kind` du
// document (= le type de chip). Exporté (window.TX_META) pour que
// QuickSendModal.jsx puisse résoudre les mêmes suggestions.
const TX_META = {
  prescription: {
    icon: 'medication', accent: '#1975d1', nounPhrase: "l'ordonnance",
    suggestions: [
      { name: 'PJC Jean-Coutu — Centre-ville', phone: '819 565-9595', fax: '819 565-9673', favorite: true },
      { name: 'Pharmacie Brunet — Wellington Sud', phone: '819 566-2223', fax: '819 566-0363', favorite: true },
      { name: 'Uniprix — King Ouest', phone: '819 823-2222', fax: '819 823-7204', favorite: false },
    ],
  },
  lab: {
    icon: 'science', accent: '#2e9b7a', nounPhrase: 'la requête de laboratoire',
    suggestions: [
      { name: 'CIUSSS de l’Estrie — CHUS', phone: '819 346-1110', fax: '819 346-1111', favorite: true },
      { name: 'Biron Groupe Santé', phone: '819 562-8000', fax: '819 562-8001', favorite: false },
      { name: 'Dynacare', phone: '819 566-3000', fax: '819 566-3001', favorite: false },
    ],
  },
  imaging: {
    icon: 'radiology', accent: '#7a5cc0', nounPhrase: "la requête d'imagerie",
    suggestions: [
      { name: 'Radiologie CHUS — Hôpital Fleurimont', phone: '819 346-1110', fax: '819 346-1112', favorite: true },
      { name: 'Clinique de radiologie de Sherbrooke', phone: '819 562-3131', fax: '819 562-3132', favorite: false },
    ],
  },
  referral: {
    icon: 'person_add', accent: '#c0693c', nounPhrase: 'la référence',
    suggestions: [
      { name: 'CRDS Estrie — Centre de répartition des demandes de service', phone: '819 780-2220', fax: '819 780-2221', favorite: true },
      { name: 'Cardiologie — CHUS', phone: '819 346-1110', fax: '819 346-1113', favorite: false },
    ],
  },
  instructions: {
    icon: 'menu_book', accent: '#1975d1', nounPhrase: 'le document',
    suggestions: [
      { name: 'Portail patient sécurisé', phone: '', fax: '', favorite: true },
    ],
  },
};

const TX_FORWARD_OPTS = [
  'Ne pas faire suivre',
  'Médecin de famille',
  'Médecin référent',
  'Patient (portail sécurisé)',
  'Autre professionnel de la santé',
];
const TX_OTHER_DOCTORS = ['Dr Marc Lefebvre', 'Dre Sophie Bouchard', 'Dr Julien Gagnon'];
const TX_OTHER_INSTITUTIONS = ['Hôpital Fleurimont — CHUS', 'GMF Sherbrooke-Est', 'Clinique médicale King Ouest'];

const NOTE_ITEM_ID = '__note__';

function txStatus(doc) {
  if (!doc.complete) return 'todo';
  if (!doc.transmitted) return 'ready';
  return 'done';
}
const TX_STATUS_LABEL = { todo: 'À compléter', ready: 'Prêt', done: 'Finalisé' };
const TX_STATUS_ICON = { todo: 'warning_amber', ready: 'check_circle', done: 'done_all' };
const TX_STATUS_COLOR = { todo: '#a15c00', ready: '#1975d1', done: '#2e9b7a' };

// Panneau de l'item « Note » — faire suivre la note + signature. Distinct de
// DocumentActionPanel : pas de destinataire/aperçu, la « complétion » ferme
// tout le flux (elle finalise la note plutôt que de changer un statut).
function NoteActionPanel({ noteInfo, doctorName, institution, pendingDocs, onFinalize }) {
  const [ddOpen, setDdOpen] = React.useState(null);
  const [forwardIdx, setForwardIdx] = React.useState(0);
  const [doctorIdx, setDoctorIdx] = React.useState(0);
  const [instIdx, setInstIdx] = React.useState(0);
  const docName = doctorName || 'Médecin actuel';
  const instName = institution || 'Établissement actuel';
  const doctorOpts = [docName].concat(TX_OTHER_DOCTORS.filter(function (d) { return d !== docName; }));
  const instOpts = [instName].concat(TX_OTHER_INSTITUTIONS.filter(function (i) { return i !== instName; }));

  function fmtNoteDate() {
    const parts = ((noteInfo && noteInfo.date) || '').split('-');
    const human = parts.length === 3 ? parts[2] + '/' + parts[1] + '/' + parts[0] : ((noteInfo && noteInfo.date) || '');
    return [human, noteInfo && noteInfo.time].filter(Boolean).join(' ');
  }

  function dropdown(key, value, options, onPick, leadIcon) {
    const open = ddOpen === key;
    return (
      <div style={{ position: 'relative' }}>
        <button style={Object.assign({}, nap.ddBtn, open ? nap.ddBtnOpen : {})}
          onClick={function () { setDdOpen(open ? null : key); }}>
          {leadIcon ? <span className="material-icons-outlined" style={{ fontSize: 18, color: '#6a6a86' }}>{leadIcon}</span> : null}
          <span style={nap.ddText}>{value}</span>
          <span className="material-icons" style={{ fontSize: 22, color: 'rgba(0,0,0,0.4)' }}>arrow_drop_down</span>
        </button>
        {open &&
          <React.Fragment>
            <div style={nap.ddScrim} onMouseDown={function () { setDdOpen(null); }} />
            <div style={nap.ddList}>
              {options.map(function (o, i) {
                const sel = o === value;
                return (
                  <button key={i} style={Object.assign({}, nap.ddOption, sel ? nap.ddOptionSel : {})}
                    onClick={function () { onPick(i); setDdOpen(null); }}>
                    <span className="material-icons" style={{ fontSize: 18, color: sel ? '#1975d1' : 'transparent' }}>check</span>
                    <span>{o}</span>
                  </button>
                );
              })}
            </div>
          </React.Fragment>
        }
      </div>
    );
  }

  return (
    <React.Fragment>
      <div style={nap.noteTile}>
        <span style={nap.noteTileIcon}>
          <span className="material-icons-outlined" style={{ fontSize: 20, color: '#25245E' }}>description</span>
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={nap.noteTileTitle}>{(noteInfo && noteInfo.title) || 'Note clinique'}</div>
          <div style={nap.noteTileMeta}>{[fmtNoteDate(), docName, instName].filter(Boolean).join(' · ')}</div>
        </div>
        {noteInfo && noteInfo.visitType ? <span style={nap.noteTileBadge}>{noteInfo.visitType}</span> : null}
      </div>

      {pendingDocs.length > 0 &&
        <div style={nap.warnBanner}>
          <span className="material-icons-outlined" style={{ fontSize: 19, color: '#a15c00', flexShrink: 0, marginTop: 1 }}>warning</span>
          <div style={nap.warnText}>
            Cette note contient {pendingDocs.length} document{pendingDocs.length > 1 ? 's' : ''} non transmis
            {' '}({pendingDocs.map(function (d) { return d.title; }).join(', ')}) — sélectionnez-les dans la liste à gauche pour les compléter.
          </div>
        </div>
      }

      <div style={nap.fieldBlock}>
        <div style={nap.fieldLabel}>Faire suivre la note</div>
        {dropdown('forward', TX_FORWARD_OPTS[forwardIdx], TX_FORWARD_OPTS, setForwardIdx, 'send')}
      </div>

      <div style={nap.fieldBlock}>
        <div style={nap.fieldLabel}>Signature</div>
        <div style={nap.sigRow}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={nap.subLabel}>Médecin</div>
            {dropdown('doctor', doctorOpts[doctorIdx], doctorOpts, setDoctorIdx, 'badge')}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={nap.subLabel}>Établissement</div>
            {dropdown('inst', instOpts[instIdx], instOpts, setInstIdx, 'business')}
          </div>
        </div>
      </div>

      <button style={nap.completeBtn} onClick={function () { onFinalize({ forwardIdx: forwardIdx, doctorIdx: doctorIdx, instIdx: instIdx }); }}>
        Compléter la note
      </button>
    </React.Fragment>
  );
}

function TransmissionModal({ docs, onPatch, onComplete, doctorName, institution, initialSelectedId, noteInfo, onFinalizeNote, onClose }) {
  const [selectedId, setSelectedId] = React.useState(initialSelectedId || (docs[0] && docs[0].id) || NOTE_ITEM_ID);
  const [screen, setScreen] = React.useState('review'); // 'review' | 'print' | 'fax'
  const [faxPrefill, setFaxPrefill] = React.useState(null);

  React.useEffect(function () {
    if (selectedId !== NOTE_ITEM_ID && docs.length && !docs.some(function (d) { return d.id === selectedId; })) {
      setSelectedId(docs[0].id);
    }
  }, [docs]); // eslint-disable-line

  React.useEffect(function () {
    function onKey(e) { if (e.key === 'Escape' && screen === 'review') onClose(); }
    document.addEventListener('keydown', onKey);
    return function () { document.removeEventListener('keydown', onKey); };
  }, [screen, onClose]);

  const isNoteSelected = selectedId === NOTE_ITEM_ID;
  const selected = isNoteSelected ? null : (docs.find(function (d) { return d.id === selectedId; }) || null);
  const meta = selected ? TX_META[selected.kind] : null;

  const counts = { todo: 0, ready: 0, done: 0 };
  docs.forEach(function (d) { counts[txStatus(d)]++; });

  const rxDocs = docs.filter(function (d) { return d.kind === 'prescription'; });
  const toolDocs = docs.filter(function (d) { return d.kind !== 'prescription'; });
  const pendingDocs = docs.filter(function (d) { return !(d.complete && d.transmitted); });

  function patch(id, p) { if (onPatch) onPatch(id, p); }

  function addRecipient(doc, r) {
    if (doc.recipients.some(function (x) { return x.name === r.name; })) return;
    var withId = Object.assign({ id: 'r-' + doc.id + '-' + doc.recipients.length + '-' + r.name.length }, r);
    patch(doc.id, { recipients: doc.recipients.concat([withId]) });
  }
  function removeRecipient(doc, rid) {
    patch(doc.id, { recipients: doc.recipients.filter(function (x) { return x.id !== rid; }) });
  }

  // Après une transmission (fax, impression, envoi rapide) : s'il reste des
  // documents non transmis, on revient à l'écran de revue ; sinon on ferme
  // tout le flux (règle sticky Figma, voir PLAN §2.6).
  function afterTransmit(thisId) {
    var remaining = docs.filter(function (d) { return d.id !== thisId && !(d.complete && d.transmitted); }).length;
    setScreen('review');
    setFaxPrefill(null);
    if (remaining === 0) onClose();
  }

  function markComplete(doc) { if (onComplete) onComplete(doc.id); }
  function doCompleteAndPrint(doc) { markComplete(doc); setScreen('print'); }
  function doCompleteAndFax(doc, prefill) {
    markComplete(doc);
    setFaxPrefill(prefill ? (doc.recipients[0] || null) : null);
    setScreen('fax');
  }
  function quickPrint() { setScreen('print'); }
  function quickSend(doc) {
    patch(doc.id, { transmitted: true });
    if (window.toast) window.toast('Document transmis', { icon: 'check_circle' });
    afterTransmit(doc.id);
  }

  function transmitReady() {
    if (!selected || selected.transmitted || !selected.complete) return;
    quickSend(selected);
  }
  function transmitAll() {
    var ids = docs.filter(function (d) { return d.complete && !d.transmitted; }).map(function (d) { return d.id; });
    ids.forEach(function (id) { patch(id, { transmitted: true }); });
    if (window.toast) window.toast(ids.length + ' document' + (ids.length > 1 ? 's' : '') + ' transmis', { icon: 'check_circle' });
    setScreen('review');
    onClose();
  }

  function finalizeNote(meta) {
    if (onFinalizeNote) onFinalizeNote(meta);
    if (window.toast) window.toast('Note complétée', { icon: 'check_circle' });
    onClose();
  }

  function onFaxSent(recipient) {
    if (recipient && selected) addRecipient(selected, recipient);
    if (selected) patch(selected.id, { transmitted: true });
    if (window.toast) window.toast('Fax envoyé', { icon: 'check_circle' });
    if (selected) afterTransmit(selected.id);
  }
  function onPrintDone() {
    if (selected) patch(selected.id, { transmitted: true });
    if (selected) afterTransmit(selected.id);
  }

  const readyCount = docs.filter(function (d) { return d.complete && !d.transmitted; }).length;

  if (screen === 'print' && selected) {
    return (
      <window.PrintDialog
        doc={selected} doctorName={doctorName} institution={institution}
        onCancel={function () { setScreen('review'); }}
        onDone={onPrintDone} />
    );
  }
  if (screen === 'fax' && selected) {
    return (
      <window.FaxScreen
        doc={selected} doctorName={doctorName} institution={institution}
        directory={meta ? meta.suggestions : []}
        prefill={faxPrefill}
        onCancel={function () { setScreen('review'); setFaxPrefill(null); }}
        onSent={onFaxSent} />
    );
  }

  return (
    <div style={tx.scrim} onMouseDown={onClose}>
      <div style={tx.shell} onMouseDown={function (e) { e.stopPropagation(); }}>
        <div style={tx.dragHandle} />
        <div style={tx.head}>
          <div style={tx.headTitle}>Transmission des documents</div>
          <div style={tx.headCounts}>
            {counts.todo > 0 && <span style={Object.assign({}, tx.pill, { color: TX_STATUS_COLOR.todo, background: '#fdf1de' })}>{counts.todo} À compléter</span>}
            {counts.ready > 0 && <span style={Object.assign({}, tx.pill, { color: TX_STATUS_COLOR.ready, background: '#e9f2fc' })}>{counts.ready} Prêt</span>}
            {counts.done > 0 && <span style={Object.assign({}, tx.pill, { color: TX_STATUS_COLOR.done, background: '#e6f5ee' })}>{counts.done} Finalisé</span>}
          </div>
          <button style={tx.closeBtn} onClick={onClose} aria-label="Fermer">
            <span className="material-icons" style={{ fontSize: 24, color: 'rgba(0,0,0,0.55)' }}>close</span>
          </button>
        </div>

        <div style={tx.bodyRow}>
          <div style={tx.sidebar}>
            <div style={tx.sideGroup}>
              <button
                style={Object.assign({}, tx.sideRow, isNoteSelected ? tx.sideRowSel : {})}
                onClick={function () { setSelectedId(NOTE_ITEM_ID); }}>
                <span className="material-icons-outlined" style={{ fontSize: 18, color: '#25245E', flexShrink: 0, marginTop: 1 }}>description</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={tx.sideRowTitle}>{(noteInfo && noteInfo.title) || 'Note clinique'}</div>
                  <div style={tx.sideRowSub}>Faire suivre et signer</div>
                </div>
              </button>
            </div>

            {rxDocs.length > 0 &&
              <div style={tx.sideGroup}>
                <div style={tx.sideGroupTitle}>ORDONNANCE</div>
                {rxDocs.map(function (d) { return renderSideRow(d); })}
              </div>
            }
            {toolDocs.length > 0 &&
              <div style={tx.sideGroup}>
                <div style={tx.sideGroupTitle}>OUTILS CLINIQUES {toolDocs.length}</div>
                {toolDocs.map(function (d) { return renderSideRow(d); })}
              </div>
            }
            <button style={tx.addDocBtn} onClick={function () {
              if (window.toast) window.toast('Ajout de document — à venir', { icon: 'info' });
            }}>
              <span className="material-icons-outlined" style={{ fontSize: 18 }}>add</span>
              Ajouter un document
            </button>
          </div>

          <div style={tx.panel}>
            {isNoteSelected
              ? <NoteActionPanel noteInfo={noteInfo} doctorName={doctorName} institution={institution} pendingDocs={pendingDocs} onFinalize={finalizeNote} />
              : selected
                ? <window.DocumentActionPanel
                    doc={selected} meta={meta} doctorName={doctorName} institution={institution}
                    onAddRecipient={function (r) { addRecipient(selected, r); }}
                    onRemoveRecipient={function (rid) { removeRecipient(selected, rid); }}
                    onComplete={function () { markComplete(selected); }}
                    onCompleteAndPrint={function () { doCompleteAndPrint(selected); }}
                    onCompleteAndFax={function (prefill) { doCompleteAndFax(selected, prefill); }}
                    onQuickPrint={quickPrint}
                    onQuickSend={function () { quickSend(selected); }} />
                : <div style={tx.panelEmpty}>Sélectionnez un document dans la liste.</div>
            }
          </div>
        </div>

        {!isNoteSelected &&
          <div style={tx.footer}>
            <div style={tx.footerSummary}>
              {readyCount > 0 &&
                <React.Fragment>
                  <span className="material-icons-outlined" style={{ fontSize: 18, color: 'rgba(0,0,0,0.45)' }}>outbox</span>
                  {readyCount} document{readyCount > 1 ? 's' : ''} prêt{readyCount > 1 ? 's' : ''} à transmettre
                </React.Fragment>
              }
            </div>
            <button
              style={Object.assign({}, tx.secondaryBtn, (!selected || !selected.complete || selected.transmitted) ? tx.btnDisabled : {})}
              disabled={!selected || !selected.complete || selected.transmitted}
              onClick={transmitReady}>
              Transmettre le document prêt
            </button>
            <button
              style={Object.assign({}, tx.primaryBtn, readyCount === 0 ? tx.btnDisabled : {})}
              disabled={readyCount === 0}
              onClick={transmitAll}>
              Tout transmettre ({readyCount})
            </button>
          </div>
        }
      </div>
    </div>
  );

  function renderSideRow(d) {
    const st = txStatus(d);
    const m = TX_META[d.kind];
    const sub = d.kind === 'prescription'
      ? d.items.length + ' prescription' + (d.items.length > 1 ? 's' : '')
      : (d.recipients[0] ? d.recipients[0].name : (d.items[0] && d.items[0].sub) || '');
    return (
      <button key={d.id}
        style={Object.assign({}, tx.sideRow, d.id === selectedId ? tx.sideRowSel : {})}
        onClick={function () { setSelectedId(d.id); }}>
        <span className="material-icons-outlined" style={{ fontSize: 18, color: m.accent, flexShrink: 0, marginTop: 1 }}>{m.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={tx.sideRowTitle}>{d.title}</div>
          {sub ? <div style={tx.sideRowSub}>{sub}</div> : null}
        </div>
        <span className="material-icons" style={{ fontSize: 17, color: TX_STATUS_COLOR[st], flexShrink: 0 }} title={TX_STATUS_LABEL[st]}>
          {TX_STATUS_ICON[st]}
        </span>
      </button>
    );
  }
}

const tx = {
  scrim: {
    position: 'fixed', inset: 0, background: 'rgba(20,20,40,0.5)', zIndex: 3999,
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    animation: 'sheet-scrim-in 200ms ease-out',
  },
  shell: {
    position: 'relative', width: '100%', maxWidth: 1180, height: '92vh', maxHeight: 'calc(100vh - 20px)',
    background: '#fff', zIndex: 4000, borderRadius: '20px 20px 0 0',
    boxShadow: '0 -12px 40px rgba(20,20,50,0.28)',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
    fontFamily: "'Inter', sans-serif", animation: 'sheet-up 320ms cubic-bezier(.16,1,.3,1)',
  },
  dragHandle: {
    width: 44, height: 5, borderRadius: 3, background: '#e0e0ea',
    margin: '10px auto 0', flexShrink: 0,
  },
  head: {
    display: 'flex', alignItems: 'center', gap: 16,
    padding: '12px 26px 16px', borderBottom: '1px solid #ececf2', flexShrink: 0,
  },
  headTitle: { fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 19, color: 'rgba(0,0,0,0.88)' },
  headCounts: { display: 'flex', gap: 8, flex: 1 },
  pill: { fontSize: 12.5, fontWeight: 700, borderRadius: 20, padding: '5px 12px' },
  closeBtn: { border: 0, background: 'transparent', cursor: 'pointer', padding: 2, display: 'inline-flex' },

  bodyRow: { flex: 1, display: 'flex', overflow: 'hidden' },

  sidebar: {
    width: 280, flexShrink: 0, borderRight: '1px solid #ececf2',
    overflowY: 'auto', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 18,
  },
  sideGroup: { display: 'flex', flexDirection: 'column', gap: 6 },
  sideGroupTitle: { fontSize: 11, fontWeight: 700, color: 'rgba(0,0,0,0.45)', letterSpacing: 0.4, padding: '0 8px', marginBottom: 2 },
  sideRow: {
    display: 'flex', alignItems: 'flex-start', gap: 9, width: '100%',
    border: 0, background: 'transparent', borderRadius: 10, padding: '9px 8px',
    cursor: 'pointer', textAlign: 'left',
  },
  sideRowSel: { background: '#eef1fb' },
  sideRowTitle: { fontSize: 13.5, fontWeight: 600, color: 'rgba(0,0,0,0.82)' },
  sideRowSub: { fontSize: 12, color: 'rgba(0,0,0,0.5)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  addDocBtn: {
    display: 'flex', alignItems: 'center', gap: 6, border: '1px dashed #cfcfe0', borderRadius: 9,
    background: 'transparent', color: 'rgba(0,0,0,0.5)', font: "500 13px 'Inter',sans-serif",
    padding: '9px 10px', cursor: 'pointer', marginTop: 'auto',
  },

  panel: { flex: 1, overflowY: 'auto', padding: '18px 28px 28px' },
  panelEmpty: { color: 'rgba(0,0,0,0.45)', fontSize: 14, padding: 30, textAlign: 'center' },

  footer: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '14px 26px', borderTop: '1px solid #ececf2', flexShrink: 0,
  },
  footerSummary: { flex: 1, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(0,0,0,0.55)', fontWeight: 500 },
  secondaryBtn: {
    border: '1.5px solid #25245E', borderRadius: 9, background: '#fff', color: '#25245E',
    font: "600 13.5px 'Inter',sans-serif", padding: '10px 16px', cursor: 'pointer',
  },
  primaryBtn: {
    border: 0, borderRadius: 9, background: '#25245E', color: '#fff',
    font: "600 13.5px 'Inter',sans-serif", padding: '10px 18px', cursor: 'pointer',
  },
  btnDisabled: { opacity: 0.42, cursor: 'not-allowed' },
};

// Styles du panneau « Note » (faire suivre + signature).
const nap = {
  noteTile: {
    display: 'flex', alignItems: 'center', gap: 11,
    border: '1px solid #e2e2ec', borderRadius: 10, background: '#f7f9fc', padding: '11px 13px',
  },
  noteTileIcon: {
    width: 34, height: 34, borderRadius: 8, flexShrink: 0, background: '#eef1fb',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  },
  noteTileTitle: { fontSize: 14, fontWeight: 600, color: 'rgba(0,0,0,0.82)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  noteTileMeta: { fontSize: 12.5, color: 'rgba(0,0,0,0.5)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  noteTileBadge: {
    flexShrink: 0, fontSize: 11, fontWeight: 600, color: '#25245E',
    background: '#eef1fb', borderRadius: 6, padding: '3px 8px', letterSpacing: 0.2,
  },
  warnBanner: {
    display: 'flex', alignItems: 'flex-start', gap: 9, marginTop: 14,
    border: '1px solid #f3ddb0', background: '#fdf6e6', borderRadius: 10, padding: '10px 12px',
  },
  warnText: { fontSize: 13, color: '#7a5200', lineHeight: 1.45 },

  fieldBlock: { marginTop: 18, maxWidth: 460 },
  fieldLabel: { fontSize: 12, fontWeight: 600, color: 'rgba(0,0,0,0.55)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.3 },
  subLabel: { fontSize: 11.5, fontWeight: 500, color: 'rgba(0,0,0,0.5)', marginBottom: 5 },
  sigRow: { display: 'flex', gap: 12 },

  ddBtn: {
    width: '100%', display: 'flex', alignItems: 'center', gap: 8,
    border: '1.5px solid #d8d8e4', borderRadius: 9, background: '#fff',
    padding: '9px 10px 9px 12px', cursor: 'pointer', textAlign: 'left',
    font: "500 14px 'Inter',sans-serif", color: 'rgba(0,0,0,0.82)',
  },
  ddBtnOpen: { border: '1.5px solid #1975d1', boxShadow: '0 0 0 3px rgba(25,117,209,0.13)' },
  ddText: { flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  ddScrim: { position: 'fixed', inset: 0, zIndex: 10 },
  ddList: {
    position: 'absolute', top: 'calc(100% + 5px)', left: 0, right: 0, zIndex: 11,
    background: '#fff', border: '1px solid #e2e2ec', borderRadius: 10,
    boxShadow: '0 10px 28px rgba(20,20,50,0.16)', padding: '5px 0', maxHeight: 240, overflowY: 'auto',
  },
  ddOption: {
    width: '100%', display: 'flex', alignItems: 'center', gap: 9,
    border: 0, background: 'transparent', cursor: 'pointer', textAlign: 'left',
    padding: '9px 13px', font: "500 13.5px 'Inter',sans-serif", color: 'rgba(0,0,0,0.78)',
  },
  ddOptionSel: { color: '#1975d1', background: '#f5f8fe' },

  completeBtn: {
    marginTop: 26, border: 0, borderRadius: 9, background: '#25245E', color: '#fff',
    font: "600 14px 'Inter',sans-serif", padding: '11px 22px', cursor: 'pointer',
  },
};

window.TransmissionModal = TransmissionModal;
window.TX_META = TX_META;
window.TX_NOTE_ITEM_ID = NOTE_ITEM_ID;
