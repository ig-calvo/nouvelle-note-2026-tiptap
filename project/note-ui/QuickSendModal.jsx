/* global React */
// =========================================================
// QuickSendModal — « Envoi rapide » : dialogue pour transmettre UN
// document, ouvert par « Prescrire »/« Transmettre » sur une chip
// (menu de survol). Voir PLAN-checkout-v7.md §C.
//
// Depuis V7 ce dialogue a son PROPRE contenu — il ne réutilise plus
// DocumentActionPanel en mode « compact ». Différences assumées avec
// le checkout complet (TransmissionModal.jsx) :
//  - une seule action primaire « Compléter et envoyer », pas de
//    bouton splitté à quatre options ;
//  - des pièces jointes à cocher et un mot libre au destinataire,
//    qui n'existent qu'ici pour l'instant ;
//  - pas d'écran fax : seule l'impression est accessible (icône du
//    pied). C'est ce qui permet de ne garder qu'UNE machine
//    review/print/fax dans le prototype, celle du checkout complet.
// =========================================================
function QuickSendModal({ doc, doctorName, institution, showSuggestions, onPatch, onComplete, onCancel, onOpenFull }) {
  const [printing, setPrinting] = React.useState(false);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [suggestHidden, setSuggestHidden] = React.useState(false);

  React.useEffect(function () {
    function onKey(e) { if (e.key === 'Escape' && !printing) onCancel(); }
    document.addEventListener('keydown', onKey);
    return function () { document.removeEventListener('keydown', onKey); };
  }, [printing, onCancel]);

  if (!doc) return null;
  const meta = window.TX_META ? window.TX_META[doc.kind] : null;
  if (!meta) return null;

  // `doc.attachments` vaut null tant que l'utilisateur n'a rien coché ni
  // décoché : on applique alors les cases par défaut du type de document.
  // Sans ce null, « tout décoché » serait indistinguable de « jamais ouvert »
  // et les défauts se réappliqueraient à chaque réouverture.
  const attachOptions = meta.attachments || [];
  const attachments = doc.attachments || meta.attachmentsOn || [];

  function patch(p) { if (onPatch) onPatch(doc.id, p); }
  function addRecipient(r) {
    if (doc.recipients.some(function (x) { return x.name === r.name; })) return;
    var withId = Object.assign({ id: 'r-' + doc.id + '-' + doc.recipients.length + '-' + r.name.length }, r);
    patch({ recipients: doc.recipients.concat([withId]) });
  }
  function removeRecipient(rid) {
    patch({ recipients: doc.recipients.filter(function (x) { return x.id !== rid; }) });
  }
  function toggleAttachment(name) {
    var next = attachments.indexOf(name) >= 0
      ? attachments.filter(function (a) { return a !== name; })
      : attachments.concat([name]);
    patch({ attachments: next });
  }

  const noRecipient = doc.recipients.length === 0;
  // Déjà transmis : on grise, comme le « Transmettre » du checkout complet.
  // Un renvoi passe par la reprise après échec (hors périmètre, plan §E),
  // pas par un second clic sur la même action.
  const sendDisabled = noRecipient || doc.transmitted;
  const sendTitle = doc.transmitted
    ? 'Document déjà transmis'
    : (noRecipient ? 'Aucun destinataire sélectionné' : undefined);

  function completeAndSend() {
    if (sendDisabled) return;
    if (!doc.complete && onComplete) onComplete(doc.id);
    patch({ transmitted: true });
    if (window.toast) window.toast('Document transmis', { icon: 'check_circle' });
    onCancel();
  }
  function onPrintDone() {
    patch({ transmitted: true });
    onCancel();
  }

  if (printing) {
    return (
      <window.PrintDialog
        doc={doc} doctorName={doctorName} institution={institution}
        onCancel={function () { setPrinting(false); }}
        onDone={onPrintDone} />
    );
  }

  const recipientCount = doc.recipients.length;
  const summary = '1 document · ' + recipientCount + ' destination' + (recipientCount > 1 ? 's' : '');

  return (
    <div style={qs.overlay} onMouseDown={onCancel}>
      <div style={qs.dialog} onMouseDown={function (e) { e.stopPropagation(); }} role="dialog" aria-modal="true">
        <div style={qs.head}>
          <div style={qs.title}>Envoi rapide</div>
          <button style={qs.closeBtn} onClick={onCancel} aria-label="Fermer">
            <span className="material-icons" style={{ fontSize: 24, color: 'rgba(0,0,0,0.55)' }}>close</span>
          </button>
        </div>

        <div style={qs.body}>
          <div style={qs.card}>
            <div style={qs.docHead}>
              <span className="material-icons-outlined" style={{ fontSize: 21, color: meta.accent }}>{meta.icon}</span>
              <span style={qs.docTitle}>{doc.title}</span>
              <span style={Object.assign({}, qs.badge, doc.complete ? qs.badgeOn : {})}>
                {doc.complete ? 'Complétée' : 'Non complétée'}
              </span>
              <span style={Object.assign({}, qs.badge, doc.transmitted ? qs.badgeOn : {})}>
                {doc.transmitted ? 'Transmise' : 'Non transmise'}
              </span>
            </div>

            <div style={qs.sectionLabel}>
              {doc.kind === 'prescription' ? 'PRESCRIPTIONS (' + doc.items.length + ')' : 'DÉTAILS (' + doc.items.length + ')'}
              <button style={qs.iconAdd} title="Ajouter" onClick={function () {}}>
                <span className="material-icons" style={{ fontSize: 17 }}>add</span>
              </button>
            </div>
            <div style={qs.itemList}>
              {doc.items.map(function (it, i) {
                return (
                  <div key={it.id || i} style={qs.itemRow}>
                    <span className="material-icons-outlined"
                      style={{ fontSize: 18, color: it.ceased ? '#b3261e' : meta.accent, flexShrink: 0, marginTop: 1 }}>
                      {it.ceased ? 'cancel' : meta.icon}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={Object.assign({}, qs.itemLabel, it.ceased ? { textDecoration: 'line-through', color: 'rgba(0,0,0,0.4)' } : {})}>{it.label}</div>
                      {it.sub ? <div style={qs.itemSub}>{it.sub}</div> : null}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={qs.sectionLabel}>
              DESTINATAIRE ({recipientCount})
              <button style={qs.iconAdd} title="Ajouter un destinataire"
                onClick={function () { setPickerOpen(!pickerOpen); }}>
                <span className="material-icons" style={{ fontSize: 17 }}>add</span>
              </button>
            </div>

            {noRecipient &&
              <div style={qs.warnBanner}>
                <span className="material-icons-outlined" style={{ fontSize: 18, color: '#a15c00' }}>warning</span>
                <span style={qs.warnText}>Ajouter un destinataire pour transmettre {meta.nounPhrase}.</span>
              </div>
            }

            {doc.recipients.map(function (r) {
              return (
                <div key={r.id} style={qs.recipientCard}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={qs.recipientName}>
                      {r.favorite ? <span className="material-icons" style={{ fontSize: 15, color: '#e8a33d', marginRight: 5 }}>star</span> : null}
                      {r.name}
                    </div>
                    <div style={qs.recipientMeta}>{[r.phone, r.fax].filter(Boolean).join(' · ')}</div>
                  </div>
                  <button style={qs.removeBtn} onClick={function () { removeRecipient(r.id); }} title="Retirer">
                    <span className="material-icons-outlined" style={{ fontSize: 17 }}>close</span>
                  </button>
                </div>
              );
            })}

            {/* Même règle qu'au checkout complet : la liste reste, seul son
                habillage « suggestion » dépend du tweak (plan V7 §B4). */}
            {pickerOpen && !(showSuggestions && suggestHidden) &&
              <div style={qs.pickerBox}>
                {showSuggestions &&
                  <div style={qs.pickerHead}>
                    <span className="material-icons" style={{ fontSize: 15, color: '#5b54b8' }}>auto_awesome</span>
                    SUGGESTION {meta.suggestions.length}
                    <button style={qs.pickerHideBtn} title="Masquer les suggestions"
                      onClick={function () { setSuggestHidden(true); }}>
                      <span className="material-icons-outlined" style={{ fontSize: 17 }}>visibility_off</span>
                    </button>
                  </div>}
                {meta.suggestions
                  .filter(function (s) { return !doc.recipients.some(function (r) { return r.name === s.name; }); })
                  .map(function (s) {
                    return (
                      <button key={s.name} style={qs.pickerRow}
                        onClick={function () { addRecipient(s); setPickerOpen(false); }}>
                        {s.favorite
                          ? <span className="material-icons" style={{ fontSize: 15, color: '#e0637a' }}>favorite</span>
                          : <span style={{ width: 15 }} />}
                        <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                          <div style={qs.pickerName}>{s.name}</div>
                          <div style={qs.pickerMeta}>{[s.phone, s.fax].filter(Boolean).join(' · ')}</div>
                        </div>
                        <span className="material-icons" style={{ fontSize: 18, color: '#1975d1' }}>add</span>
                      </button>
                    );
                  })}
              </div>
            }

            {attachOptions.length > 0 &&
              <React.Fragment>
                <div style={qs.sectionLabel}>
                  PIÈCES JOINTES
                  <button style={qs.iconAdd} title="Ajouter une pièce jointe" onClick={function () {}}>
                    <span className="material-icons" style={{ fontSize: 17 }}>add</span>
                  </button>
                </div>
                <div style={qs.attachRow}>
                  {attachOptions.map(function (name) {
                    var on = attachments.indexOf(name) >= 0;
                    return (
                      <button key={name} type="button" role="checkbox" aria-checked={on}
                        style={Object.assign({}, qs.attachChip, on ? qs.attachChipOn : {})}
                        onClick={function () { toggleAttachment(name); }}>
                        <span className="material-icons" style={{ fontSize: 17, color: on ? '#25245E' : 'rgba(0,0,0,0.35)' }}>
                          {on ? 'check_box' : 'check_box_outline_blank'}
                        </span>
                        {name}
                      </button>
                    );
                  })}
                </div>
              </React.Fragment>
            }

            <div style={qs.noteWrap}>
              <textarea
                style={qs.noteField}
                maxLength={500}
                placeholder={meta.noteLabel || 'Note pour le destinataire'}
                value={doc.note}
                onChange={function (e) { patch({ note: e.target.value.slice(0, 500) }); }} />
              <div style={qs.noteCount}>{(doc.note || '').length}/500</div>
            </div>
          </div>
        </div>

        <div style={qs.footer}>
          <div style={qs.summary}>
            <span className="material-icons-outlined" style={{ fontSize: 17, color: 'rgba(0,0,0,0.45)' }}>description</span>
            {summary}
          </div>
          {onOpenFull &&
            <button style={qs.linkBtn} onClick={onOpenFull}>Voir tous les documents</button>
          }
          <div style={{ flex: 1 }} />
          <button style={qs.printBtn} title="Imprimer" onClick={function () { setPrinting(true); }}>
            <span className="material-icons-outlined" style={{ fontSize: 20 }}>print</span>
          </button>
          <button
            style={Object.assign({}, qs.primaryBtn, sendDisabled ? qs.btnDisabled : {})}
            disabled={sendDisabled}
            title={sendTitle}
            onClick={completeAndSend}>
            <span className="material-icons-outlined" style={{ fontSize: 19 }}>send</span>
            Compléter et envoyer
          </button>
        </div>
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
    width: 660, maxWidth: 'calc(100vw - 40px)', maxHeight: '88vh',
    background: '#fff', borderRadius: 18, boxShadow: '0 18px 48px rgba(20,20,50,0.32)',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
    fontFamily: "'Inter', sans-serif", animation: 'snm-pop 160ms cubic-bezier(.2,.8,.3,1)',
  },
  head: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '20px 24px 14px', flexShrink: 0,
  },
  title: { fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 19, color: 'rgba(0,0,0,0.88)' },
  closeBtn: { border: 0, background: 'transparent', cursor: 'pointer', padding: 2, display: 'inline-flex' },

  body: { padding: '0 24px 8px', overflowY: 'auto', flex: 1 },
  card: { border: '1px solid #e6e6ef', borderRadius: 12, padding: '16px 18px 18px' },

  docHead: { display: 'flex', alignItems: 'center', gap: 9, marginBottom: 18, flexWrap: 'wrap' },
  docTitle: { fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 16, color: 'rgba(0,0,0,0.85)' },
  badge: { fontSize: 11.5, fontWeight: 700, borderRadius: 7, padding: '4px 9px', background: '#fdf3e2', color: '#8a6212' },
  badgeOn: { background: '#e6f5ee', color: '#2e9b7a' },

  sectionLabel: {
    display: 'flex', alignItems: 'center', gap: 4,
    fontSize: 11.5, fontWeight: 700, color: 'rgba(0,0,0,0.5)', letterSpacing: 0.3,
    textTransform: 'uppercase', margin: '18px 0 10px',
  },
  iconAdd: {
    border: 0, background: 'transparent', cursor: 'pointer', color: 'rgba(0,0,0,0.45)',
    display: 'inline-flex', alignItems: 'center', padding: 2, borderRadius: 6,
  },

  itemList: { display: 'flex', flexDirection: 'column', gap: 8 },
  itemRow: {
    display: 'flex', alignItems: 'flex-start', gap: 9,
    background: '#f8f8fc', border: '1px solid #eeeef6', borderRadius: 9, padding: '9px 12px',
  },
  itemLabel: { fontSize: 13.5, fontWeight: 600, color: 'rgba(0,0,0,0.82)', lineHeight: 1.35 },
  itemSub: { fontSize: 12.5, color: 'rgba(0,0,0,0.55)', marginTop: 2, lineHeight: 1.4 },

  warnBanner: {
    display: 'flex', alignItems: 'flex-start', gap: 8,
    background: '#fdf3e2', borderRadius: 9, padding: '10px 12px',
  },
  warnText: { fontSize: 12.5, color: '#8a6212', lineHeight: 1.4 },

  recipientCard: {
    display: 'flex', alignItems: 'center', gap: 10,
    border: '1px solid #e6e6ef', borderRadius: 9, padding: '10px 12px', marginBottom: 8,
  },
  recipientName: { display: 'flex', alignItems: 'center', fontSize: 13.5, fontWeight: 600, color: 'rgba(0,0,0,0.82)' },
  recipientMeta: { fontSize: 12.5, color: 'rgba(0,0,0,0.55)', marginTop: 2 },
  removeBtn: {
    border: 0, background: 'transparent', cursor: 'pointer', color: 'rgba(0,0,0,0.4)',
    display: 'inline-flex', padding: 3, borderRadius: 6, flexShrink: 0,
  },

  pickerBox: { border: '1px solid #e6e6ef', borderRadius: 10, overflow: 'hidden', marginTop: 4 },
  pickerHead: {
    display: 'flex', alignItems: 'center', gap: 6, background: '#f7f7fc',
    padding: '7px 12px', font: "700 11.5px 'Inter',sans-serif", color: '#5b54b8', letterSpacing: 0.3,
  },
  pickerHideBtn: {
    marginLeft: 'auto', border: 0, background: 'transparent', cursor: 'pointer',
    color: 'rgba(0,0,0,0.4)', display: 'inline-flex', alignItems: 'center', padding: 0,
  },
  pickerRow: {
    display: 'flex', alignItems: 'center', gap: 9, width: '100%',
    border: 0, borderBottom: '1px solid #f2f2f8', background: '#fff',
    padding: '10px 12px', cursor: 'pointer',
  },
  pickerName: { fontSize: 13, fontWeight: 600, color: 'rgba(0,0,0,0.8)' },
  pickerMeta: { fontSize: 12, color: 'rgba(0,0,0,0.5)', marginTop: 1 },

  attachRow: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  attachChip: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    border: '1px solid #e2e2ec', borderRadius: 9, background: '#fff',
    padding: '7px 12px 7px 8px', font: "500 13px 'Inter',sans-serif",
    color: 'rgba(0,0,0,0.7)', cursor: 'pointer',
  },
  attachChipOn: { background: '#ecebfa', border: '1px solid #d5d3f2', color: '#25245E' },

  noteWrap: { marginTop: 16 },
  noteField: {
    width: '100%', boxSizing: 'border-box', minHeight: 44, resize: 'vertical',
    border: '1px solid #dcdce8', borderRadius: 9, padding: '11px 12px',
    font: "400 13.5px 'Inter',sans-serif", color: 'rgba(0,0,0,0.8)', outline: 'none',
  },
  noteCount: { fontSize: 11.5, color: 'rgba(0,0,0,0.4)', marginTop: 4 },

  footer: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '14px 24px 18px', borderTop: '1px solid #f0f0f6', flexShrink: 0,
  },
  summary: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'rgba(0,0,0,0.5)' },
  linkBtn: { border: 0, background: 'transparent', cursor: 'pointer', font: "600 12.5px 'Inter',sans-serif", color: '#1975d1', padding: 0 },
  printBtn: {
    width: 38, height: 38, borderRadius: 9, border: '1px solid #e2e2ec', background: '#fff',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: 'rgba(0,0,0,0.6)',
  },
  primaryBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 7, border: 0, borderRadius: 9,
    background: '#25245E', color: '#fff', font: "600 13.5px 'Inter',sans-serif",
    padding: '10px 18px', cursor: 'pointer', whiteSpace: 'nowrap',
  },
  btnDisabled: { opacity: 0.42, cursor: 'not-allowed' },
};

window.QuickSendModal = QuickSendModal;
