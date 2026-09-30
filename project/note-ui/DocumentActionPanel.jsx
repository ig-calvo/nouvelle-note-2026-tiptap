/* global React */
// =========================================================
// DocumentActionPanel — contenu/destinataire/aperçu + barre de
// statut et bouton split « Compléter » pour UN document
// transmissible. Composant partagé par les deux points d'entrée
// de la transmission.
// Une seule mise en page depuis le plan V7 (§A) : 3 colonnes
// contenu / destinataire / aperçu. Le mode `compact` a disparu avec
// la réécriture de l'Envoi rapide, qui a maintenant son propre
// contenu (QuickSendModal.jsx) au lieu de réutiliser ce panneau.
// Seul appelant : TransmissionModal.jsx.
// =========================================================

// Trois variantes de ligne de prescription (plan V7 §G) — la variante est
// calculée dans buildTransmissionDocs (NoteEditor.jsx), pas ici : le panneau
// ne connaît pas le modèle Tiptap.
const DAP_VARIANT = {
  nouvelle:       { icon: 'info', color: 'var(--mat-sys-primary)' },
  renouvellement: { icon: 'history', color: 'light-dark(#a15c00, #e9cca5)' },
  cessation:      { icon: 'cancel', color: 'light-dark(#b3261e, #e9a9a5)' },
};

// Section repliable de la colonne « contenu ».
function DapSection({ label, count, open, onToggle, onAdd, children }) {
  return (
    <div style={dap.section}>
      <div style={dap.sectionHead}>
        <button style={dap.sectionToggle} onClick={onToggle} aria-expanded={open}>
          <span className="material-icons" style={{ fontSize: 20, color: 'color-mix(in srgb, var(--mat-sys-on-surface) 40%, transparent)' }}>
            {open ? 'expand_more' : 'chevron_right'}
          </span>
          {label}{typeof count === 'number' ? ' (' + count + ')' : ''}
        </button>
        {onAdd &&
          <button style={dap.sectionAdd} title="Ajouter" onClick={onAdd}>
            <span className="material-icons" style={{ fontSize: 18 }}>add</span>
          </button>}
      </div>
      {open && <div style={dap.sectionBody}>{children}</div>}
    </div>
  );
}

// Ligne de contenu. Les icônes ✏️/🗑 au survol sont des affordances
// visuelles conformes au Figma mais NON câblées dans cette itération :
// éditer ou retirer une prescription depuis le checkout reviendrait à
// modifier la note elle-même, ce qui sort du périmètre (cf. la même
// décision pour « + Ajouter »).
// États d'un item (mêmes que sur la puce, chipIssues — editor-schema.jsx) :
// une ligne par état, sous le libellé. Partagé avec QuickSendModal. Jamais
// imprimé : DocumentPreview ne lit que label/sub.
function ChipIssueLines({ issues }) {
  if (!issues || !issues.length) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 3 }}>
      {issues.map(function (i) {
        const err = i.level === 'error';
        return (
          <div key={i.kind} style={{ display: 'flex', alignItems: 'flex-start', gap: 4, fontSize: 12, lineHeight: 1.35,
            color: err ? 'var(--mat-sys-error)' : 'light-dark(#8a6212, #e9d2a5)' }}>
            <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 15, flexShrink: 0 }}>
              {i.kind === 'transmission' ? 'sync_problem' : i.kind === 'interaction' ? 'report' : err ? 'error' : 'warning'}
            </span>
            <span>{i.message}</span>
          </div>
        );
      })}
    </div>
  );
}
window.ChipIssueLines = ChipIssueLines;

function DapContentRow({ it, meta, readOnly }) {
  const [hover, setHover] = React.useState(false);
  const vis = DAP_VARIANT[it.variant] || { icon: meta.icon, color: meta.accent };
  return (
    <div style={Object.assign({}, dap.contentItem, hover ? dap.contentItemHover : {})}
      onMouseEnter={function () { setHover(true); }}
      onMouseLeave={function () { setHover(false); }}>
      <span className="material-icons-outlined"
        style={{ fontSize: 18, color: vis.color, flexShrink: 0, marginTop: 1 }}>{vis.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={Object.assign({}, dap.contentItemLabel, it.ceased ? { textDecoration: 'line-through', color: 'color-mix(in srgb, var(--mat-sys-on-surface) 40%, transparent)' } : {})}>{it.label}</div>
        {it.sub ? <div style={dap.contentItemSub}>{it.sub}</div> : null}
        <ChipIssueLines issues={it.issues} />
      </div>
      {hover && !readOnly &&
        <div style={dap.rowActions}>
          <span style={dap.rowActionBtn} title="Modifier">
            <span className="material-icons-outlined" style={{ fontSize: 17 }}>edit</span>
          </span>
          <span style={dap.rowActionBtn} title="Retirer">
            <span className="material-icons-outlined" style={{ fontSize: 17 }}>delete</span>
          </span>
        </div>}
    </div>
  );
}

// Carte destinataire : favori, adresse, coordonnées, choix du canal
// (fax/courriel) et retrait au survol (plan V7 §F).
function DapRecipientCard({ r, readOnly, onRemove, onChannel }) {
  const [hover, setHover] = React.useState(false);
  const channel = r.channel || 'fax';
  function channelBtn(key, cls, icon, title) {
    const on = channel === key;
    return (
      <button style={Object.assign({}, dap.channelBtn, on ? dap.channelBtnOn : {},
          readOnly ? { cursor: 'default' } : {})}
        title={readOnly ? (on ? title.replace('Transmettre', 'Transmis') : '') : title}
        aria-pressed={on} disabled={readOnly}
        onClick={function () { if (!readOnly) onChannel(key); }}>
        <span className={cls} style={{ fontSize: 18 }}>{icon}</span>
      </button>
    );
  }
  return (
    <div style={dap.recipientCard}
      onMouseEnter={function () { setHover(true); }}
      onMouseLeave={function () { setHover(false); }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={dap.recipientName}>
          {r.name}
          <span className="material-icons"
            style={{ fontSize: 15, marginLeft: 5, color: r.favorite ? 'light-dark(#e0637a, #e9a5b2)' : 'color-mix(in srgb, var(--mat-sys-on-surface) 18%, transparent)' }}>
            {r.favorite ? 'favorite' : 'favorite_border'}
          </span>
        </div>
        {r.address ? <div style={dap.recipientAddr}>{r.address}</div> : null}
        <div style={dap.recipientMeta}>
          {r.phone ? <span style={dap.recipientMetaItem}>
            <span className="material-icons-outlined" style={{ fontSize: 14 }}>call</span>{r.phone}
          </span> : null}
          {r.fax ? <span style={dap.recipientMetaItem}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>fax</span>{r.fax}
          </span> : null}
        </div>
      </div>
      <div style={dap.channelGroup}>
        {(r.fax && (!readOnly || channel === 'fax')) ? channelBtn('fax', 'material-symbols-outlined', 'fax', 'Transmettre par fax') : null}
        {(!readOnly || channel === 'email') ? channelBtn('email', 'material-icons-outlined', 'mail', 'Transmettre par courriel') : null}
      </div>
      {hover && !readOnly &&
        <button style={dap.removeBadge} onClick={onRemove} title="Retirer ce destinataire">
          <span className="material-icons" style={{ fontSize: 15 }}>close</span>
        </button>}
    </div>
  );
}

function DocumentActionPanel({ doc, meta, doctorName, institution, onPatch, showSuggestions, readOnly,
  onAddRecipient, onRemoveRecipient, onComplete, onCompleteAndPrint, onCompleteAndFax,
  onQuickPrint, onQuickSend }) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [recipientPickerOpen, setRecipientPickerOpen] = React.useState(false);
  const [previewZoom, setPreviewZoom] = React.useState(false);
  const [openContent, setOpenContent] = React.useState(true);
  const [openAttach, setOpenAttach] = React.useState(false);
  const [attachPickerOpen, setAttachPickerOpen] = React.useState(false);
  const [suggestHidden, setSuggestHidden] = React.useState(false);

  // `doc.attachments` est null tant que rien n'a été coché/décoché : on
  // applique alors les pièces jointes par défaut du type de document. Même
  // convention que dans l'Envoi rapide (QuickSendModal.jsx).
  // Un outil clinique n'a pas de liste de contenu : le formulaire EST son
  // aperçu. On tombe alors à deux colonnes (destinataire + aperçu), comme
  // dans la maquette V7 (§D.3) — plutôt qu'une colonne « Détails » vide.
  const hasContent = doc.items.length > 0;
  const docTitle = meta.titlePrefix ? meta.titlePrefix + ' : ' + doc.title : doc.title;

  const attachOptions = meta.attachments || [];
  const attachments = doc.attachments || meta.attachmentsOn || [];
  const attachRemaining = attachOptions.filter(function (a) { return attachments.indexOf(a) < 0; });
  function setAttachments(next) { if (onPatch) onPatch({ attachments: next }); }
  function setChannel(rid, channel) {
    if (!onPatch) return;
    onPatch({ recipients: doc.recipients.map(function (x) {
      return x.id === rid ? Object.assign({}, x, { channel: channel }) : x;
    }) });
  }

  // Deux boutons persistants plutôt qu'un split qui disparaît une fois le
  // document complété (plan V7 §B1) : « Compléter » se grise, « Transmettre »
  // devient primaire. Le médecin voit donc toujours les deux gestes et où il
  // en est, au lieu de voir l'un remplacer l'autre.
  const noRecipient = doc.recipients.length === 0;
  // Un item incomplet (prescription sans voie, p. ex.) empêche de compléter.
  const blocked = !doc.complete && (doc.blocking || []).length > 0;
  const completeDisabled = doc.complete || noRecipient || blocked;
  const transmitDisabled = !doc.complete || noRecipient || doc.transmitted;
  const completeTitle = doc.complete
    ? 'Document déjà complété'
    : blocked ? (doc.blocking || []).join('\n')
    : (noRecipient ? 'Aucun destinataire sélectionné' : undefined);
  const transmitTitle = doc.transmitted
    ? 'Document déjà transmis'
    : [!doc.complete ? doc.title + ' non complétée' : '', noRecipient ? 'Aucun destinataire sélectionné' : '']
        .filter(Boolean).join('\n') || undefined;

  return (
    <React.Fragment>
      <div style={dap.statusBar}>
        <span className="material-icons-outlined" style={{ fontSize: 21, color: meta.accent, flexShrink: 0 }}>{meta.icon}</span>
        <span style={dap.docTitle}>{docTitle}</span>
        <span style={Object.assign({}, dap.statusBadge, doc.complete ? dap.statusBadgeOn : {})}>
          {doc.complete ? 'Complétée' : 'Non complétée'}
        </span>
        <span style={Object.assign({}, dap.statusBadge, doc.transmitted ? dap.statusBadgeOn : {})}>
          {doc.transmitted ? 'Transmise' : 'Non transmise'}
        </span>
        <div style={{ flex: 1 }} />
        {!readOnly &&
        <React.Fragment>
        <button
          title={doc.complete ? 'Imprimer' : 'Compléter le document avant impression'}
          style={Object.assign({}, dap.iconBtn, !doc.complete ? dap.btnDisabled : {})}
          disabled={!doc.complete}
          onClick={onQuickPrint}>
          <span className="material-icons-outlined" style={{ fontSize: 20 }}>print</span>
        </button>
        <div style={{ position: 'relative' }}>
          <button
            title={completeTitle}
            style={Object.assign({}, dap.splitBtn, completeDisabled ? dap.btnDisabled : {})}
            disabled={completeDisabled}
            onClick={function () { setMenuOpen(!menuOpen); }}>
            Compléter {meta.nounPhrase}
            <span className="material-icons" style={{ fontSize: 20 }}>arrow_drop_down</span>
          </button>
          {menuOpen && !completeDisabled &&
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
        <button
          title={transmitTitle}
          style={Object.assign({}, dap.transmitBtn, transmitDisabled ? dap.btnDisabled : {})}
          disabled={transmitDisabled}
          onClick={onQuickSend}>
          Transmettre {meta.nounPhrase}
        </button>
        </React.Fragment>}
      </div>

      <div style={hasContent ? dap.cols : dap.colsTwo}>
        {/* Colonne 1 — contenu du document, en sections repliables (plan V7
            §B3). « Pièces jointes » est repliée au départ : c'est un réglage
            secondaire, le contenu clinique doit rester ce qu'on voit en
            premier. Absente pour un outil clinique (voir hasContent). */}
        {hasContent &&
        <div style={dap.col}>
          <DapSection
            label={doc.kind === 'prescription' ? 'Prescriptions' : 'Détails'}
            count={doc.items.length}
            open={openContent}
            onToggle={function () { setOpenContent(!openContent); }}>
            <div style={dap.contentList}>
              {doc.items.map(function (it, i) {
                return <DapContentRow key={it.id || i} it={it} meta={meta} readOnly={readOnly} />;
              })}
            </div>
          </DapSection>

          <DapSection
            label="Pièces jointes"
            count={attachments.length}
            open={openAttach}
            onToggle={function () { setOpenAttach(!openAttach); }}
            onAdd={(!readOnly && attachRemaining.length) ? function () { setAttachPickerOpen(!attachPickerOpen); } : null}>
            {attachments.length === 0
              ? <div style={dap.attachEmpty}>Aucune pièce jointe.</div>
              : <div style={dap.attachRow}>
                  {attachments.map(function (name) {
                    return (
                      <span key={name} style={dap.attachChip}>
                        {name}
                        {!readOnly &&
                          <button style={dap.attachChipX} title="Retirer"
                            onClick={function () { setAttachments(attachments.filter(function (a) { return a !== name; })); }}>
                            <span className="material-icons" style={{ fontSize: 15 }}>close</span>
                          </button>}
                      </span>
                    );
                  })}
                </div>
            }
            {attachPickerOpen && attachRemaining.length > 0 &&
              <div style={dap.pickerBox}>
                {attachRemaining.map(function (name) {
                  return (
                    <button key={name} style={dap.pickerRow}
                      onClick={function () { setAttachments(attachments.concat([name])); setAttachPickerOpen(false); }}>
                      <span className="material-icons-outlined" style={{ fontSize: 17, color: 'var(--mat-sys-primary)' }}>attach_file</span>
                      <span style={dap.pickerName}>{name}</span>
                      <span className="material-icons" style={{ fontSize: 17, color: 'var(--mat-sys-primary)', marginLeft: 'auto' }}>add</span>
                    </button>
                  );
                })}
              </div>
            }
          </DapSection>
        </div>
        }

        {/* Colonne 2 — destinataires (plan V7 §F) */}
        <div style={dap.col}>
          <div style={dap.colLabel}>DESTINATAIRE ({doc.recipients.length})
            {!readOnly &&
              <button style={dap.addRecipientBtn} title="Ajouter un destinataire"
                onClick={function () { setRecipientPickerOpen(!recipientPickerOpen); }}>
                <span className="material-icons" style={{ fontSize: 18 }}>add</span>
              </button>}
          </div>

          {doc.recipients.length === 0 && readOnly &&
            <div style={dap.emptyReadonly}>Aucun destinataire n'a été choisi pour ce document.</div>
          }

          {doc.recipients.length === 0 && !readOnly &&
            <div style={dap.emptyBox}>
              <span className="material-icons-outlined" style={{ fontSize: 22, color: 'light-dark(#a15c00, #e9cca5)' }}>warning</span>
              <div style={dap.emptyTitle}>Aucun destinataire</div>
              <div style={dap.emptyText}>
                Ajouter une pharmacie ou un professionnel de la santé pour transmettre {meta.nounPhrase}
              </div>
              <button style={dap.emptyLink} onClick={function () { setRecipientPickerOpen(true); }}>
                Ajouter depuis le bottin
              </button>
            </div>
          }

          {doc.recipients.map(function (r) {
            return (
              <DapRecipientCard key={r.id} r={r} readOnly={readOnly}
                onRemove={function () { onRemoveRecipient(r.id); }}
                onChannel={function (ch) { setChannel(r.id, ch); }} />
            );
          })}

          {/* Le sélecteur de destinataire existe toujours ; c'est son
              habillage « suggestion » (✨ + masquage) qui est piloté par le
              tweak `checkoutSuggestions` (plan V7 §B4). Tweak à false : une
              simple liste de contacts, sans promesse d'intelligence. */}
          {recipientPickerOpen && !(showSuggestions && suggestHidden) &&
            <div style={dap.suggestBox}>
              <div style={dap.suggestTitle}>
                {showSuggestions
                  ? <React.Fragment>
                      <span className="material-icons" style={{ fontSize: 15, color: 'light-dark(#5b54b8, #b3b0de)' }}>auto_awesome</span>
                      SUGGESTION {meta.suggestions.length}
                      <button style={dap.suggestHideBtn} title="Masquer les suggestions"
                        onClick={function () { setSuggestHidden(true); }}>
                        <span className="material-icons-outlined" style={{ fontSize: 17 }}>visibility_off</span>
                      </button>
                    </React.Fragment>
                  : <span style={{ color: 'color-mix(in srgb, var(--mat-sys-on-surface) 50%, transparent)' }}>Ajouter un destinataire</span>}
              </div>
              {meta.suggestions.filter(function (s) { return !doc.recipients.some(function (r) { return r.name === s.name; }); }).map(function (s) {
                return (
                  <button key={s.name} style={dap.suggestRow} onClick={function () { onAddRecipient(s); setRecipientPickerOpen(false); }}>
                    {s.favorite ? <span className="material-icons" style={{ fontSize: 15, color: 'light-dark(#e0637a, #e9a5b2)' }}>favorite</span> : <span style={{ width: 15 }} />}
                    <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                      <div style={dap.suggestName}>{s.name}</div>
                      <div style={dap.suggestMeta}>{[s.phone, s.fax].filter(Boolean).join(' · ')}</div>
                    </div>
                    <span className="material-icons" style={{ fontSize: 18, color: 'var(--mat-sys-primary)' }}>add</span>
                  </button>
                );
              })}
            </div>
          }
        </div>

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
      </div>
    </React.Fragment>
  );
}

const dap = {
  statusBar: { display: 'flex', alignItems: 'center', gap: 9, marginBottom: 18, position: 'relative', flexWrap: 'wrap' },
  statusBadge: {
    fontSize: 12, fontWeight: 700, borderRadius: 7, padding: '5px 10px',
    background: 'var(--mat-sys-surface-container)', color: 'color-mix(in srgb, var(--mat-sys-on-surface) 50%, transparent)',
  },
  statusBadgeOn: { background: 'light-dark(#e6f5ee, #244c39)', color: 'light-dark(#2e9b7a, #a8e5d3)' },
  iconBtn: {
    width: 36, height: 36, borderRadius: 8, border: '1px solid var(--mat-sys-outline-variant)', background: 'var(--mat-sys-surface-container-lowest)',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'color-mix(in srgb, var(--mat-sys-on-surface) 60%, transparent)',
  },
  splitBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 4, border: 0, borderRadius: 9,
    background: '#25245E', color: '#fff', font: "600 13.5px 'Inter',sans-serif",
    padding: '9px 8px 9px 16px', cursor: 'pointer', whiteSpace: 'nowrap',
  },
  transmitBtn: {
    display: 'inline-flex', alignItems: 'center', border: 0, borderRadius: 9,
    background: '#1F4FD8', color: '#fff', font: "600 13.5px 'Inter',sans-serif",
    padding: '9px 16px', cursor: 'pointer', whiteSpace: 'nowrap',
  },
  btnDisabled: { opacity: 0.42, cursor: 'not-allowed' },
  ddScrim: { position: 'fixed', inset: 0, zIndex: 10 },
  splitMenu: {
    position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 11, minWidth: 220,
    background: 'var(--mat-sys-surface-container-lowest)', border: '1px solid var(--mat-sys-outline-variant)', borderRadius: 10,
    boxShadow: '0 10px 28px rgba(20,20,50,0.18)', padding: '5px 0',
  },
  splitMenuItem: {
    display: 'block', width: '100%', textAlign: 'left', border: 0, background: 'transparent',
    padding: '10px 14px', font: "500 13.5px 'Inter',sans-serif", color: 'color-mix(in srgb, var(--mat-sys-on-surface) 80%, transparent)', cursor: 'pointer',
  },

  docTitle: {
    fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 16,
    color: 'color-mix(in srgb, var(--mat-sys-on-surface) 85%, transparent)', marginRight: 4, whiteSpace: 'nowrap',
    overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 320,
  },
  cols: { display: 'grid', gridTemplateColumns: '1.15fr 1fr 1fr', gap: 22, alignItems: 'start' },
  colsTwo: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22, alignItems: 'start' },
  col: { minWidth: 0 },
  colLabel: {
    display: 'flex', alignItems: 'center', gap: 6,
    fontSize: 12, fontWeight: 700, color: 'color-mix(in srgb, var(--mat-sys-on-surface) 50%, transparent)', letterSpacing: 0.3,
    textTransform: 'uppercase', marginBottom: 10,
  },

  section: { marginBottom: 14 },
  sectionHead: {
    display: 'flex', alignItems: 'center', gap: 4,
    background: 'var(--mat-sys-surface-container-low)', borderRadius: 8, padding: '7px 8px 7px 4px', marginBottom: 8,
  },
  sectionToggle: {
    display: 'inline-flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 0,
    border: 0, background: 'transparent', cursor: 'pointer', textAlign: 'left',
    font: "600 13px 'Inter',sans-serif", color: 'color-mix(in srgb, var(--mat-sys-on-surface) 70%, transparent)',
  },
  sectionAdd: {
    border: 0, background: 'transparent', cursor: 'pointer', color: 'color-mix(in srgb, var(--mat-sys-on-surface) 45%, transparent)',
    display: 'inline-flex', alignItems: 'center', padding: 2, flexShrink: 0,
  },
  sectionBody: { padding: '0 2px' },

  contentList: { display: 'flex', flexDirection: 'column', gap: 8 },
  contentItem: {
    display: 'flex', alignItems: 'flex-start', gap: 9, position: 'relative',
    background: 'light-dark(#fbfbfe, #24244c)', border: '1px solid light-dark(#eeeef6, #272749)', borderRadius: 9, padding: '9px 11px',
  },
  contentItemHover: { background: 'light-dark(#f5f5fb, #24244c)', border: '1px solid light-dark(#e2e2ef, #282848)' },
  contentItemLabel: { fontSize: 14, fontWeight: 600, color: 'color-mix(in srgb, var(--mat-sys-on-surface) 82%, transparent)', lineHeight: 1.35 },
  contentItemSub: { fontSize: 12.5, color: 'color-mix(in srgb, var(--mat-sys-on-surface) 50%, transparent)', marginTop: 1, lineHeight: 1.3 },
  rowActions: { display: 'inline-flex', gap: 2, flexShrink: 0, alignSelf: 'center' },
  rowActionBtn: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: 26, height: 26, borderRadius: 7, color: 'color-mix(in srgb, var(--mat-sys-on-surface) 45%, transparent)',
  },

  attachEmpty: { fontSize: 12.5, color: 'color-mix(in srgb, var(--mat-sys-on-surface) 42%, transparent)', padding: '2px 2px 4px' },
  attachRow: { display: 'flex', flexWrap: 'wrap', gap: 7 },
  attachChip: {
    display: 'inline-flex', alignItems: 'center', gap: 3,
    background: 'light-dark(#ecebfa, #27244c)', border: '1px solid light-dark(#d5d3f2, #27244c)', borderRadius: 8,
    padding: '5px 5px 5px 10px', font: "500 12.5px 'Inter',sans-serif", color: 'var(--mat-sys-on-surface)',
  },
  attachChipX: {
    border: 0, background: 'transparent', cursor: 'pointer', color: 'var(--mat-sys-on-surface)',
    display: 'inline-flex', alignItems: 'center', padding: 1, opacity: 0.7,
  },

  pickerBox: { border: '1px solid var(--mat-sys-outline-variant)', borderRadius: 10, overflow: 'hidden', marginTop: 8 },
  pickerRow: {
    display: 'flex', alignItems: 'center', gap: 8, width: '100%',
    border: 0, borderBottom: '1px solid light-dark(#f2f2f8, #272749)', background: 'var(--mat-sys-surface-container-lowest)',
    padding: '9px 11px', cursor: 'pointer',
  },
  pickerName: { font: "500 13px 'Inter',sans-serif", color: 'color-mix(in srgb, var(--mat-sys-on-surface) 78%, transparent)' },

  emptyBox: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 4,
    border: '1px solid light-dark(#f3ddb0, #4c3f24)', background: 'light-dark(#fdf6e6, #4c4024)', borderRadius: 10, padding: '16px 14px', marginBottom: 10,
  },
  emptyReadonly: { fontSize: 12.5, color: 'color-mix(in srgb, var(--mat-sys-on-surface) 45%, transparent)', lineHeight: 1.45, marginBottom: 10 },
  emptyTitle: { font: "600 13.5px 'Inter',sans-serif", color: 'light-dark(#7a5200, #e9d2a5)' },
  emptyText: { fontSize: 12.5, color: 'light-dark(#7a5200, #e9d2a5)', lineHeight: 1.45, maxWidth: 260 },
  emptyLink: {
    border: 0, background: 'transparent', cursor: 'pointer', marginTop: 4,
    font: "600 13px 'Inter',sans-serif", color: 'var(--mat-sys-primary)',
  },

  addRecipientBtn: {
    marginLeft: 4, width: 20, height: 20, borderRadius: 6, border: 0, background: 'color-mix(in srgb, var(--mat-sys-primary) 10%, var(--mat-sys-surface-container-lowest))',
    color: 'var(--mat-sys-on-surface)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
  },
  warnBanner: {
    display: 'flex', alignItems: 'center', gap: 8, border: '1px solid light-dark(#f3ddb0, #4c3f24)', background: 'light-dark(#fdf6e6, #4c4024)',
    borderRadius: 9, padding: '9px 11px', marginBottom: 10,
  },
  warnText: { fontSize: 12.5, color: 'light-dark(#7a5200, #e9d2a5)', lineHeight: 1.4 },
  recipientCard: {
    display: 'flex', alignItems: 'center', gap: 8, border: '1px solid var(--mat-sys-outline-variant)', borderRadius: 9,
    padding: '10px 11px', marginBottom: 8, position: 'relative',
  },
  recipientName: { display: 'flex', alignItems: 'center', fontSize: 13.5, fontWeight: 600, color: 'color-mix(in srgb, var(--mat-sys-on-surface) 82%, transparent)' },
  recipientAddr: { fontSize: 12, color: 'color-mix(in srgb, var(--mat-sys-on-surface) 50%, transparent)', marginTop: 2, lineHeight: 1.35 },
  recipientMeta: { display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 12, color: 'color-mix(in srgb, var(--mat-sys-on-surface) 55%, transparent)', marginTop: 3 },
  recipientMetaItem: { display: 'inline-flex', alignItems: 'center', gap: 3 },

  channelGroup: { display: 'inline-flex', gap: 6, flexShrink: 0 },
  channelBtn: {
    width: 32, height: 32, borderRadius: 8, border: '1px solid var(--mat-sys-outline-variant)', background: 'var(--mat-sys-surface-container-lowest)',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: 'color-mix(in srgb, var(--mat-sys-on-surface) 55%, transparent)',
  },
  channelBtnOn: { background: 'var(--mat-sys-primary)', border: '1px solid var(--mat-sys-primary)', color: 'var(--mat-sys-on-primary)' },
  removeBadge: {
    position: 'absolute', top: -7, right: -7, width: 22, height: 22, borderRadius: '50%',
    border: '1px solid var(--mat-sys-outline-variant)', background: 'var(--mat-sys-surface-container-lowest)', boxShadow: '0 2px 6px rgba(20,20,50,0.16)',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: 'color-mix(in srgb, var(--mat-sys-on-surface) 55%, transparent)', padding: 0,
  },

  suggestBox: { border: '1px solid var(--mat-sys-outline-variant)', borderRadius: 10, marginTop: 6, padding: '6px 0', background: 'light-dark(#fcfcfe, #24244c)' },
  suggestTitle: {
    display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 700, color: 'light-dark(#5b54b8, #b3b0de)',
    padding: '6px 12px 6px', letterSpacing: 0.3, textTransform: 'uppercase',
  },
  suggestHideBtn: {
    marginLeft: 'auto', border: 0, background: 'transparent', cursor: 'pointer',
    color: 'color-mix(in srgb, var(--mat-sys-on-surface) 40%, transparent)', display: 'inline-flex', alignItems: 'center', padding: 0,
  },
  suggestRow: {
    display: 'flex', alignItems: 'center', gap: 8, width: '100%', border: 0, background: 'transparent',
    padding: '8px 12px', cursor: 'pointer',
  },
  suggestName: { fontSize: 13, fontWeight: 600, color: 'color-mix(in srgb, var(--mat-sys-on-surface) 80%, transparent)' },
  suggestMeta: { fontSize: 11.5, color: 'color-mix(in srgb, var(--mat-sys-on-surface) 48%, transparent)' },

  zoomBtn: { marginLeft: 'auto', border: 0, background: 'transparent', cursor: 'pointer', color: 'color-mix(in srgb, var(--mat-sys-on-surface) 45%, transparent)' },
  previewWrap: { border: '1px solid var(--mat-sys-outline-variant)', borderRadius: 12, padding: 14, background: 'var(--mat-sys-surface-container-low)', overflow: 'auto' },
};

window.DocumentActionPanel = DocumentActionPanel;
