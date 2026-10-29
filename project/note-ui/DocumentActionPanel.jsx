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

// Quatre variantes de ligne de prescription (plan V7 §G, plus l'ajustement de dose) — la variante est
// calculée dans buildTransmissionDocs (NoteEditor.jsx), pas ici : le panneau
// ne connaît pas le modèle Tiptap.
const DAP_VARIANT = {
  nouvelle:       { icon: 'info', color: 'var(--mat-sys-primary)' },
  renouvellement: { icon: 'history', color: 'light-dark(#a15c00, #e9cca5)' },
  cessation:      { icon: 'cancel', color: 'light-dark(#b3261e, #e9a9a5)' },
  ajustement:     { icon: 'swap_vert', color: 'light-dark(#a15c00, #e9cca5)' },
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
          <button style={dap.sectionAdd} title={t('documentAction.ajouter.tooltip')} onClick={onAdd}>
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
          <span style={dap.rowActionBtn} title={t('documentAction.modifier.tooltip')}>
            <span className="material-icons-outlined" style={{ fontSize: 17 }}>edit</span>
          </span>
          <span style={dap.rowActionBtn} title={t('documentAction.retirer.tooltip')}>
            <span className="material-icons-outlined" style={{ fontSize: 17 }}>delete</span>
          </span>
        </div>}
    </div>
  );
}

// Canaux d'envoi d'un destinataire (maquette « Transmission générale ») :
// PrescribeIT seul quand la pharmacie le reçoit ; sinon fax et courriel,
// selon les coordonnées connues. Le premier est le canal principal, toujours
// coché (Q7 du plan). `channels` garde les cases cochées ; l'ancien champ
// `channel` (notes d'exemple du journal) en tient lieu s'il est seul.
function recipientChannels(r) {
  if (r.prescribeIt) return ['prescribeit'];
  const list = [];
  if (r.fax) list.push('fax');
  if (r.email) list.push('email');
  return list;
}
function checkedChannels(r) {
  const avail = recipientChannels(r);
  const picked = r.channels || (r.channel ? [r.channel] : []);
  const out = avail.filter(function (c) { return picked.indexOf(c) >= 0; });
  if (avail.length && out.indexOf(avail[0]) < 0) out.unshift(avail[0]);
  return out;
}
const DAP_CHANNELS = {
  fax: { icon: 'fax', label: t('documentAction.canalFax.label'), value: function (r) { return r.fax; } },
  email: { icon: 'mail', label: t('documentAction.canalCourriel.label'), value: function (r) { return r.email; } },
  prescribeit: { icon: 'local_pharmacy', label: 'PrescribeIT', value: function (r) { return r.phone; } },
};

// Pastille à l'initiale du destinataire (« PJC » et « Pharmacie » ignorés).
const DAP_AVATAR_TONES = [
  ['light-dark(#f7dbe4, #5a2a3c)', 'light-dark(#8a2c4c, #f7dbe4)'],
  ['light-dark(#f4ecc8, #4c4224)', 'light-dark(#6b5a12, #f4ecc8)'],
  ['light-dark(#d7efdc, #244c32)', 'light-dark(#22683a, #d7efdc)'],
  ['light-dark(#e2e0f6, #322c5c)', 'light-dark(#3a3167, #e2e0f6)'],
];
function DapAvatar({ name }) {
  const letter = (name || '?').replace(/^(PJC|Pharmacie)\s+/i, '').charAt(0).toUpperCase();
  const tone = DAP_AVATAR_TONES[letter.charCodeAt(0) % DAP_AVATAR_TONES.length];
  return <span style={Object.assign({}, dap.avatar, { background: tone[0], color: tone[1] })} aria-hidden="true">{letter}</span>;
}

function DapContactLine({ r }) {
  return (
    <div style={dap.recipientMeta}>
      {r.phone ? <span style={dap.recipientMetaItem}>
        <span className="material-icons-outlined" style={{ fontSize: 15 }}>call</span>{r.phone}
      </span> : null}
      {r.fax ? <span style={dap.recipientMetaItem}>
        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>fax</span>{r.fax}
      </span> : null}
    </div>
  );
}

function DapHeart({ on }) {
  return (
    <span className="material-icons" title={on ? t('documentAction.favoriMedecin.tooltip') : undefined}
      style={{ fontSize: 18, flexShrink: 0, color: on ? 'light-dark(#e0637a, #e9a5b2)' : 'color-mix(in srgb, var(--mat-sys-on-surface) 25%, transparent)' }}>
      {on ? 'favorite' : 'favorite_border'}
    </span>
  );
}

// Destinataire choisi : pastille, ★ (pharmacie favorite au dossier du
// patient, ordonnance seulement), nom, ♡ (favori du médecin), coordonnées,
// puis une ligne à cocher par canal.
function DapRecipientCard({ r, readOnly, showStar, isPatientPharmacy, onRemove, onChannels }) {
  const avail = recipientChannels(r);
  const checked = checkedChannels(r);
  // Un fax seul n'offre aucun choix de canal : la ligne est omise (le numéro reste dans la carte).
  const shown = (readOnly ? avail.filter(function (c) { return checked.indexOf(c) >= 0; }) : avail)
    .filter(function (c) { return !(c === 'fax' && avail.length === 1); });
  function toggle(c) {
    onChannels(checked.indexOf(c) >= 0
      ? checked.filter(function (x) { return x !== c; })
      : avail.filter(function (x) { return x === c || checked.indexOf(x) >= 0; }));
  }
  return (
    <div style={dap.recipientCard}>
      <div style={dap.cardHead}>
        <DapAvatar name={r.name} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={dap.cardName}>
            {showStar &&
              <span className="material-icons"
                title={isPatientPharmacy ? t('documentAction.pharmacieDossier.tooltip') : undefined}
                style={{ fontSize: 19, flexShrink: 0, color: isPatientPharmacy ? 'light-dark(#c98a12, #f0c060)' : 'color-mix(in srgb, var(--mat-sys-on-surface) 35%, transparent)' }}>
                {isPatientPharmacy ? 'star' : 'star_border'}
              </span>}
            <span style={dap.cardNameText}>{r.name}</span>
            <DapHeart on={r.favorite} />
          </div>
          {r.address ? <div style={dap.recipientAddr}>{r.address}</div> : null}
          <DapContactLine r={r} />
        </div>
        {!readOnly &&
          <button type="button" className="ds-icon-btn" onClick={onRemove}
            title={t('documentAction.retirerDestinataire.tooltip')} aria-label={t('documentAction.retirerDestinataire.tooltip')}>
            <span className="material-icons" style={{ fontSize: 20 }}>close</span>
          </button>}
      </div>
      {shown.length > 0 &&
        <div style={dap.channelList}>
          {shown.map(function (c) {
            const def = DAP_CHANNELS[c];
            const on = checked.indexOf(c) >= 0;
            const locked = readOnly || c === avail[0];
            return (
              <label key={c} style={Object.assign({}, dap.channelRow, on ? dap.channelRowOn : {}, locked ? { cursor: 'default' } : {})}
                title={!readOnly && c === avail[0] ? t('documentAction.canalPrincipal.tooltip') : undefined}>
                <input type="checkbox" checked={on} disabled={locked} style={dap.channelCheck}
                  onChange={function () { toggle(c); }} />
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--mat-sys-on-surface-variant)' }}>{def.icon}</span>
                <span style={{ minWidth: 0 }}>
                  <span style={dap.channelLabel}>{def.label}</span>
                  <span style={dap.channelValue}>{def.value(r)}</span>
                </span>
              </label>
            );
          })}
        </div>}
    </div>
  );
}

// Carte du bottin : comme le destinataire choisi, avec la distance et « + ».
function DapDirectoryCard({ s, onAdd }) {
  return (
    <div style={dap.dirCard}>
      <div style={dap.cardHead}>
        <DapAvatar name={s.name} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={dap.cardName}>
            <span style={dap.cardNameText}>{s.name}</span>
            <DapHeart on={s.favorite} />
          </div>
          {s.address ? <div style={dap.recipientAddr}>{s.address}</div> : null}
          <DapContactLine r={s} />
        </div>
        <button type="button" className="ds-icon-btn" style={{ alignSelf: 'center' }} onClick={onAdd}
          title={t('documentAction.ajouterDestinataire.tooltip')} aria-label={t('documentAction.ajouterNom.aria', { name: s.name })}>
          <span className="material-icons" style={{ fontSize: 22 }}>add</span>
        </button>
      </div>
      {s.distanceKm != null &&
        <span style={dap.distBadge}>{t('documentAction.distanceKm.text', { km: s.distanceKm.toLocaleString(window.I18N.locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) })}</span>}
    </div>
  );
}

// Petit menu déroulant des filtres (distance, bannière).
function DapSelect({ value, options, onChange }) {
  const [open, setOpen] = React.useState(false);
  const cur = options.find(function (o) { return o.value === value; }) || options[0];
  return (
    <div style={{ position: 'relative' }}>
      <button type="button" style={dap.selectBtn} aria-haspopup="listbox" aria-expanded={open}
        onClick={function () { setOpen(!open); }}>
        {cur.label}
        <span className="material-icons" style={{ fontSize: 20 }}>arrow_drop_down</span>
      </button>
      {open &&
        <React.Fragment>
          <div style={dap.menuScrim} onMouseDown={function () { setOpen(false); }} />
          <div style={dap.selectMenu} role="listbox">
            {options.map(function (o) {
              const sel = o.value === cur.value;
              return (
                <button key={String(o.value)} type="button" role="option" aria-selected={sel}
                  style={Object.assign({}, dap.selectItem, sel ? dap.selectItemOn : {})}
                  onClick={function () { onChange(o.value); setOpen(false); }}>
                  <span className="material-icons" style={{ fontSize: 18, color: sel ? 'var(--mat-sys-primary)' : 'transparent' }}>check</span>
                  {o.label}
                </button>
              );
            })}
          </div>
        </React.Fragment>}
    </div>
  );
}

function dapNorm(v) { return (v || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
// Nom, adresse, téléphone ou télécopie ; les chiffres se comparent sans
// espaces ni tirets.
function dapMatches(s, query) {
  const q = dapNorm(query).trim();
  if (!q) return true;
  const digits = q.replace(/\D/g, '');
  if (digits.length >= 3 && [s.phone, s.fax].some(function (n) { return (n || '').replace(/\D/g, '').indexOf(digits) >= 0; })) return true;
  return q.split(/\s+/).every(function (w) { return dapNorm([s.name, s.address, s.banner].join(' ')).indexOf(w) >= 0; });
}

function DocumentActionPanel({ doc, meta, doctorName, institution, onPatch, showSuggestions, readOnly,
  onAddRecipient, onRemoveRecipient, onQuickPrint }) {
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [maxKm, setMaxKm] = React.useState(5);
  const [banner, setBanner] = React.useState('');
  const [previewZoom, setPreviewZoom] = React.useState(false);
  const [fileQuery, setFileQuery] = React.useState(''); // « Rechercher au dossier » (référence)
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
  const docTitle = meta.titlePrefix ? t('common.labelValue.text', { label: meta.titlePrefix, value: doc.title }) : doc.title;

  const attachOptions = meta.attachments || [];
  const attachments = doc.attachments || meta.attachmentsOn || [];
  const attachRemaining = attachOptions.filter(function (a) { return attachments.indexOf(a) < 0; });
  function setAttachments(next) { if (onPatch) onPatch({ attachments: next }); }
  function setChannels(rid, channels) {
    if (!onPatch) return;
    onPatch({ recipients: doc.recipients.map(function (x) {
      return x.id === rid ? Object.assign({}, x, { channels: channels }) : x;
    }) });
  }

  // Bottin (maquette « Transmission générale ») : recherche, et pour les
  // pharmacies (`meta.nearby`) filtres de distance et de bannière, triés du
  // plus proche au plus loin. Visible tant qu'il n'y a pas de destinataire,
  // puis par le « + » de l'en-tête.
  const nearby = !!meta.nearby;
  const patient = (window.NOTE_DATA && window.NOTE_DATA.PATIENT) || {};
  const patientPharmacy = nearby && (meta.suggestions || []).find(function (p) { return p.id === patient.pharmacyId; });
  const showSearch = !readOnly && (doc.recipients.length === 0 || searchOpen);
  const directory = (meta.suggestions || [])
    .filter(function (s) { return !doc.recipients.some(function (r) { return r.name === s.name; }); })
    .filter(function (s) { return dapMatches(s, query); })
    .filter(function (s) { return !nearby || maxKm == null || s.distanceKm <= maxKm; })
    .filter(function (s) { return !nearby || !banner || s.banner === banner; })
    .sort(function (a, b) { return nearby ? a.distanceKm - b.distanceKm : 0; });
  const bannerOptions = [{ value: '', label: t('documentAction.toutesBannieres.text') }].concat(
    (meta.suggestions || []).reduce(function (acc, s) { return s.banner && acc.indexOf(s.banner) < 0 ? acc.concat([s.banner]) : acc; }, [])
      .sort().map(function (b) { return { value: b, label: b }; }));
  const kmOptions = [1, 5, 10].map(function (k) { return { value: k, label: t('documentAction.distanceKm.text', { km: k }) }; })
    .concat([{ value: null, label: t('documentAction.touteDistance.text') }]);
  function comingSoon() { if (window.toast) window.toast(t('transmission.aVenir.toast'), { icon: 'info' }); }

  const recipientsCol = (
    <React.Fragment>
      {/* Colonne 2 — destinataires (maquette « Transmission générale ») */}
      <div style={dap.col}>
        <div style={dap.recipHead}>
          <span style={dap.recipTitle}>{t('documentAction.destinataire.label', { n: doc.recipients.length })}</span>
          {!readOnly && doc.recipients.length > 0 &&
            <button type="button" className="ds-icon-btn" style={{ color: 'var(--mat-sys-primary)' }}
              title={t('documentAction.ajouterDestinataire.tooltip')} aria-label={t('documentAction.ajouterDestinataire.tooltip')}
              aria-expanded={searchOpen} onClick={function () { setSearchOpen(!searchOpen); }}>
              <span className="material-icons" style={{ fontSize: 22 }}>add</span>
            </button>}
          {!readOnly &&
            <button type="button" className="ds-icon-btn" style={{ marginLeft: 'auto', color: 'var(--mat-sys-primary)' }}
              title={t('documentAction.ajouterDepuisBottin.button')} aria-label={t('documentAction.ajouterDepuisBottin.button')}
              onClick={comingSoon}>
              <span className="material-icons-outlined" style={{ fontSize: 22 }}>contact_page</span>
            </button>}
        </div>
  
        {doc.recipients.length === 0 && readOnly &&
          <div style={dap.emptyReadonly}>{t('documentAction.aucunDestinataireEteChoisi.text')}</div>
        }
  
        {doc.recipients.map(function (r) {
          return (
            <DapRecipientCard key={r.id} r={r} readOnly={readOnly}
              showStar={nearby}
              isPatientPharmacy={!!patientPharmacy && r.name === patientPharmacy.name}
              onRemove={function () { onRemoveRecipient(r.id); }}
              onChannels={function (chs) { setChannels(r.id, chs); }} />
          );
        })}
  
        {showSearch &&
          <div style={dap.searchBlock}>
            <div style={dap.searchField}>
              <span className="material-icons" style={{ fontSize: 22, color: 'var(--mat-sys-on-surface-variant)' }}>search</span>
              <input style={dap.searchInput} value={query} placeholder={t('documentAction.rechercheDestinataire.placeholder')}
                aria-label={t('documentAction.rechercheDestinataire.placeholder')}
                onChange={function (e) { setQuery(e.target.value); }} />
              <button type="button" className="ds-icon-btn" onClick={comingSoon}
                title={t('documentAction.carte.tooltip')} aria-label={t('documentAction.carte.tooltip')}>
                <span className="material-icons-outlined" style={{ fontSize: 22 }}>map</span>
              </button>
            </div>
            {nearby &&
              <div style={dap.filterRow}>
                <DapSelect value={maxKm} options={kmOptions} onChange={setMaxKm} />
                <DapSelect value={banner} options={bannerOptions} onChange={setBanner} />
              </div>}
            {/* Le bottin est la base ; le tweak `checkoutSuggestions` n'y
                ajoute que l'habillage ✨ (D-12). */}
            {showSuggestions && !suggestHidden && directory.length > 0 &&
              <div style={dap.suggestTitle}>
                <span className="material-icons" style={{ fontSize: 15, color: 'light-dark(#5b54b8, #b3b0de)' }}>auto_awesome</span>
                {t('documentAction.suggestions.label', { n: directory.length })}
                <button style={dap.suggestHideBtn} title={t('documentAction.masquerSuggestions.tooltip')}
                  onClick={function () { setSuggestHidden(true); }}>
                  <span className="material-icons-outlined" style={{ fontSize: 17 }}>visibility_off</span>
                </button>
              </div>}
            {directory.length === 0
              ? <div style={dap.emptyReadonly}>{t('documentAction.aucunResultat.text')}</div>
              : directory.map(function (s) {
                  return (
                    <DapDirectoryCard key={s.id || s.name} s={s}
                      onAdd={function () { onAddRecipient(s); setSearchOpen(false); setQuery(''); }} />
                  );
                })}
          </div>}
      </div>
    </React.Fragment>);

  // Référence en spécialité (Figma « Demande de consultation en médecine
  // spécialisée », PLAN-reference-specialite.md, lot 5) : destinataire, détail
  // de la requête, renseignements cliniques — proposés par l'assistant (✦) et
  // retirables, ou ajoutés depuis le dossier.
  if (doc.kind === 'referral') {
    const rd = (doc.items[0] && doc.items[0].ref) || {};
    const suggested = meta.attachmentsSuggested || [];
    const lastNote = (window.PAST_NOTES || [])[0];
    const attachSub = function (name) { return name === L('Dernière note clinique') && lastNote ? String(lastNote.date).replace(/\s+\d{1,2}:\d{2}.*$/, '').toLowerCase() : ''; };
    const D = window.NOTE_DATA;
    const dossier = attachRemaining
      .concat((D.PATIENT_MEDS || []).map(function (m) { return (m.name + ' ' + (m.dose || '')).trim(); }))
      .concat(((window.__SOMMAIRE_DX_BASE && window.__SOMMAIRE_DX_BASE.problems) || []).map(function (p) { return p.name; }))
      .filter(function (n, i, all) { return attachments.indexOf(n) < 0 && all.indexOf(n) === i; })
      .filter(function (n) { return fileQuery.trim() && dapNorm(n).indexOf(dapNorm(fileQuery).trim()) >= 0; });
    return (
      <React.Fragment>
        <div style={dap.titleRow}>
          <span className="material-symbols-outlined" style={dap.titleIcon}>{meta.icon}</span>
          <h2 style={dap.docTitle}>{meta.docTitle || docTitle}</h2>
          {(doc.complete || doc.transmitted) &&
            <span style={Object.assign({}, dap.statusBadge, doc.transmitted ? dap.statusBadgeSent : {})}>
              <span className="material-icons-outlined" style={{ fontSize: 16 }}>{doc.transmitted ? 'done_all' : 'check_circle'}</span>
              {doc.transmitted ? t('documentAction.transmise.text') : t('documentAction.completee.text')}
            </span>}
        </div>
        <div style={dap.cols3}>
          <div style={dap.col}>{recipientsCol}</div>
          <div style={dap.col}>
            <div style={dap.colLabel}>{t('documentAction.refDetail.label')}</div>
            <div style={dap.refCard}>
              <div style={dap.refSpec}>{rd.specialty || doc.title}</div>
              {rd.section && <div style={dap.refSection}>{rd.section}</div>}
              {rd.reason && <div style={dap.refReason}>{rd.reason}</div>}
              {(rd.tags || []).map(function (tg) {
                return <span key={tg.label} style={dap.refTag}><b>{tg.label}</b> {tg.value}</span>;
              })}
              <div style={dap.refMeta}>{[rd.priority, rd.orientation === 'designe' ? t('popover.refOrientNamed.label') : t('popover.refOrientFirst.label')].filter(Boolean).join(' · ')}</div>
              {rd.clinical && <div style={dap.refClinical}>{rd.clinical}</div>}
            </div>
          </div>
          <div style={dap.col}>
            <div style={dap.colLabel}>{t('documentAction.refClinical.label', { n: attachments.length })}</div>
            {!readOnly &&
            <div style={Object.assign({}, dap.searchField, { marginBottom: 8 })}>
              <span className="material-icons" style={{ fontSize: 22, color: 'var(--mat-sys-on-surface-variant)' }}>search</span>
              <input style={dap.searchInput} value={fileQuery} placeholder={t('documentAction.refSearchFile.placeholder')}
                aria-label={t('documentAction.refSearchFile.placeholder')} onChange={function (e) { setFileQuery(e.target.value); }} />
            </div>}
            {dossier.map(function (name) {
              return (
                <button key={name} type="button" style={dap.pickerRow}
                  onClick={function () { setAttachments(attachments.concat([name])); setFileQuery(''); }}>
                  <span className="material-icons" style={{ fontSize: 17, color: 'var(--mat-sys-primary)' }}>add</span>
                  <span style={dap.pickerName}>{name}</span>
                </button>);
            })}
            {attachments.map(function (name) {
              const ai = suggested.indexOf(name) >= 0;
              const sub = attachSub(name);
              return (
                <div key={name} style={dap.refAttach}>
                  <span className="material-icons" aria-hidden={!ai} title={ai ? t('documentAction.refSuggested.tooltip') : undefined}
                    style={{ fontSize: 18, color: ai ? 'light-dark(#5b54b8, #b3b0de)' : 'var(--mat-sys-on-surface-variant)' }}>{ai ? 'auto_awesome' : 'attach_file'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={dap.refAttachName}>{name}</div>
                    {sub && <div style={dap.refAttachSub}>{sub}</div>}
                  </div>
                  {!readOnly &&
                    <button type="button" className="ds-icon-btn" title={t('documentAction.retirer.tooltip')} aria-label={t('documentAction.retirer.tooltip') + ' : ' + name}
                      onClick={function () { setAttachments(attachments.filter(function (a) { return a !== name; })); }}>
                      <span className="material-icons-outlined" style={{ fontSize: 20 }}>delete</span>
                    </button>}
                </div>);
            })}
          </div>
        </div>
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      {/* Titre du document (maquette « Transmission générale ») : grand titre
          et un seul badge, une fois le document complété ou transmis. Les
          gestes Compléter / Transmettre sont dans le pied du checkout
          (TransmissionModal). */}
      <div style={dap.titleRow}>
        <span className="material-symbols-outlined" style={dap.titleIcon}>{meta.icon}</span>
        <h2 style={dap.docTitle}>{docTitle}</h2>
        {(doc.complete || doc.transmitted) &&
          <span style={Object.assign({}, dap.statusBadge, doc.transmitted ? dap.statusBadgeSent : {})}>
            <span className="material-icons-outlined" style={{ fontSize: 16 }}>{doc.transmitted ? 'done_all' : 'check_circle'}</span>
            {doc.transmitted ? t('documentAction.transmise.text') : t('documentAction.completee.text')}
          </span>}
      </div>

      <div style={hasContent ? dap.cols : dap.colsTwo}>
        {/* Colonne 1 — contenu du document, en sections repliables (plan V7
            §B3). « Pièces jointes » est repliée au départ : c'est un réglage
            secondaire, le contenu clinique doit rester ce qu'on voit en
            premier. Absente pour un outil clinique (voir hasContent). */}
        {hasContent &&
        <div style={dap.col}>
          <DapSection
            label={doc.kind === 'prescription' ? t('documentAction.prescriptions.label') : t('documentAction.details.label')}
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
            label={t('documentAction.piecesJointes.label')}
            count={attachments.length}
            open={openAttach}
            onToggle={function () { setOpenAttach(!openAttach); }}
            onAdd={(!readOnly && attachRemaining.length) ? function () { setAttachPickerOpen(!attachPickerOpen); } : null}>
            {attachments.length === 0
              ? <div style={dap.attachEmpty}>{t('documentAction.aucunePieceJointe.text')}</div>
              : <div style={dap.attachRow}>
                  {attachments.map(function (name) {
                    return (
                      <span key={name} style={dap.attachChip}>
                        {name}
                        {!readOnly &&
                          <button style={dap.attachChipX} title={t('documentAction.retirer.tooltip')}
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

        {recipientsCol}

        <div style={dap.col}>
          <div style={dap.colLabel}>{t('documentAction.preview.label')}
            {!readOnly &&
              <button style={Object.assign({}, dap.zoomBtn, !doc.complete ? dap.btnDisabled : {})}
                disabled={!doc.complete} onClick={onQuickPrint}
                title={doc.complete ? t('documentAction.imprimer.tooltip') : t('documentAction.completerDocumentAvantImpression.tooltip')}>
                <span className="material-icons-outlined" style={{ fontSize: 17 }}>print</span>
              </button>}
            <button style={dap.zoomBtn} onClick={function () { setPreviewZoom(!previewZoom); }} title={t('documentAction.agrandir.tooltip')}>
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
  titleRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 },
  titleIcon: { fontSize: 26, color: 'color-mix(in srgb, var(--mat-sys-on-surface) 70%, transparent)', flexShrink: 0 },
  docTitle: { margin: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 26, lineHeight: 1.2, color: 'var(--mat-sys-on-surface)' },
  statusBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600, borderRadius: 6, padding: '4px 10px',
    background: 'color-mix(in srgb, var(--mat-sys-primary) 12%, var(--mat-sys-surface-container-lowest))', color: 'var(--mat-sys-primary)',
  },
  statusBadgeSent: { background: 'light-dark(#e6f5ee, #244c39)', color: 'light-dark(#2e9b7a, #a8e5d3)' },
  btnDisabled: { opacity: 0.42, cursor: 'not-allowed' },
  cols: { display: 'grid', gridTemplateColumns: '1.15fr 1fr 1fr', gap: 22, alignItems: 'start' },
  colsTwo: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22, alignItems: 'start' },
  cols3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 22, alignItems: 'start' },
  refCard: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6, padding: 12, border: '1px solid var(--mat-sys-outline)', borderRadius: 8, background: 'var(--mat-sys-surface-container-lowest)' },
  refSpec: { font: "500 16px 'Inter',sans-serif", color: 'var(--mat-sys-on-surface)' },
  refSection: { font: "600 13px 'Inter',sans-serif", color: 'var(--mat-sys-on-surface)' },
  refReason: { font: "400 13px/18px 'Inter',sans-serif", color: 'var(--mat-sys-on-surface-variant)' },
  refTag: { font: "400 12.5px 'Inter',sans-serif", color: 'var(--mat-sys-on-surface-variant)', padding: '2px 6px', border: '1px solid var(--mat-sys-outline-variant)', borderRadius: 4 },
  refMeta: { font: "400 12.5px 'Inter',sans-serif", color: 'var(--mat-sys-on-surface-variant)' },
  refClinical: { font: "400 12.5px/17px 'Inter',sans-serif", color: 'var(--mat-sys-on-surface)', whiteSpace: 'pre-wrap', borderTop: '1px solid var(--mat-sys-outline-variant)', paddingTop: 6, alignSelf: 'stretch' },
  refAttach: { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 8px 8px 10px', marginBottom: 8, border: '1px solid var(--mat-sys-outline-variant)', borderRadius: 6, background: 'var(--mat-sys-surface-container-lowest)' },
  refAttachName: { font: "600 14px 'Inter',sans-serif", color: 'var(--mat-sys-on-surface)' },
  refAttachSub: { font: "400 12px 'Inter',sans-serif", color: 'var(--mat-sys-on-surface-variant)', marginTop: 2 },
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

  emptyReadonly: { fontSize: 12.5, color: 'color-mix(in srgb, var(--mat-sys-on-surface) 45%, transparent)', lineHeight: 1.45, marginBottom: 10 },

  recipHead: { display: 'flex', alignItems: 'center', gap: 4, marginBottom: 12, minHeight: 32 },
  recipTitle: { fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 16, color: 'var(--mat-sys-on-surface)' },
  avatar: {
    width: 40, height: 40, borderRadius: '50%', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    font: "500 15px 'Inter',sans-serif",
  },
  recipientCard: {
    background: 'var(--mat-sys-surface-container-lowest)', borderRadius: 8, padding: 12, marginBottom: 10,
    boxShadow: '0 2px 4px 0 rgba(37,36,94,.14), 0 0 5px 0 rgba(37,36,94,.12)',
  },
  dirCard: {
    position: 'relative', background: 'var(--mat-sys-surface-container-lowest)', borderRadius: 8, padding: '14px 12px', marginBottom: 10,
    boxShadow: '0 2px 4px 0 rgba(37,36,94,.14), 0 0 5px 0 rgba(37,36,94,.12)',
  },
  cardHead: { display: 'flex', alignItems: 'flex-start', gap: 12 },
  cardName: { display: 'flex', alignItems: 'flex-start', gap: 5, fontSize: 13.5, fontWeight: 600, color: 'var(--mat-sys-on-surface)', minWidth: 0 },
  cardNameText: { minWidth: 0 },
  recipientAddr: { fontSize: 13, color: 'color-mix(in srgb, var(--mat-sys-on-surface) 70%, transparent)', marginTop: 2, lineHeight: 1.35 },
  recipientMeta: { display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 13, color: 'color-mix(in srgb, var(--mat-sys-on-surface) 70%, transparent)', marginTop: 3 },
  recipientMetaItem: { display: 'inline-flex', alignItems: 'center', gap: 4 },
  distBadge: {
    position: 'absolute', top: 0, right: 0, padding: '2px 8px', borderRadius: '0 8px 0 8px',
    background: 'var(--mat-sys-secondary-container)', color: 'var(--mat-sys-on-secondary-container)', font: "600 12px 'Inter',sans-serif",
  },

  channelList: { display: 'flex', flexDirection: 'column', gap: 2, marginTop: 10 },
  channelRow: {
    display: 'flex', alignItems: 'center', gap: 14, padding: '8px 12px', borderRadius: 4, cursor: 'pointer',
  },
  channelRowOn: { background: 'var(--mat-sys-surface-container-low)' },
  channelCheck: { width: 18, height: 18, margin: 0, accentColor: 'var(--mat-sys-primary)', flexShrink: 0 },
  channelLabel: { display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--mat-sys-on-surface)' },
  channelValue: { display: 'block', fontSize: 13, color: 'color-mix(in srgb, var(--mat-sys-on-surface) 70%, transparent)' },

  searchBlock: { display: 'flex', flexDirection: 'column', gap: 0, marginTop: 4 },
  searchField: {
    display: 'flex', alignItems: 'center', gap: 8, height: 44, padding: '0 6px 0 12px', marginBottom: 12,
    border: '1px solid var(--mat-sys-outline)', borderRadius: 8, background: 'var(--mat-sys-surface-container-lowest)',
  },
  searchInput: {
    flex: 1, minWidth: 0, border: 0, outline: 'none', background: 'transparent',
    font: "400 14px 'Inter',sans-serif", color: 'var(--mat-sys-on-surface)',
  },
  filterRow: { display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' },
  selectBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 6, height: 32, padding: '0 6px 0 12px',
    border: '1px solid var(--mat-sys-outline-variant)', borderRadius: 8, background: 'var(--mat-sys-surface-container-lowest)',
    font: "500 13px 'Inter',sans-serif", color: 'var(--mat-sys-on-surface)', cursor: 'pointer',
  },
  menuScrim: { position: 'fixed', inset: 0, zIndex: 10 },
  selectMenu: {
    position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 11, minWidth: 180,
    background: 'var(--mat-sys-surface-container-lowest)', border: '1px solid var(--mat-sys-outline-variant)', borderRadius: 8,
    boxShadow: '0 10px 28px rgba(20,20,50,0.16)', padding: '4px 0',
  },
  selectItem: {
    display: 'flex', alignItems: 'center', gap: 8, width: '100%', border: 0, background: 'transparent', cursor: 'pointer',
    padding: '8px 12px', font: "400 13.5px 'Inter',sans-serif", color: 'var(--mat-sys-on-surface)', textAlign: 'left',
  },
  selectItemOn: { color: 'var(--mat-sys-primary)' },

  suggestTitle: {
    display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 700, color: 'light-dark(#5b54b8, #b3b0de)',
    padding: '0 2px 8px', letterSpacing: 0.3, textTransform: 'uppercase',
  },
  suggestHideBtn: {
    marginLeft: 'auto', border: 0, background: 'transparent', cursor: 'pointer',
    color: 'color-mix(in srgb, var(--mat-sys-on-surface) 40%, transparent)', display: 'inline-flex', alignItems: 'center', padding: 0,
  },

  zoomBtn: { marginLeft: 'auto', border: 0, background: 'transparent', cursor: 'pointer', color: 'color-mix(in srgb, var(--mat-sys-on-surface) 45%, transparent)' },
  previewWrap: { border: '1px solid var(--mat-sys-outline-variant)', borderRadius: 12, padding: 14, background: 'var(--mat-sys-surface-container-low)', overflow: 'auto' },
};

window.DocumentActionPanel = DocumentActionPanel;
