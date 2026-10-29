/* global React */
// =========================================================
// TransmissionModal — « Transmission des documents » (checkout).
// Bottom sheet, ouvert par défaut quand l'utilisateur clique
// « Compléter » (avec l'item « Note » présélectionné) — inclut
// aussi la finalisation de la note (faire suivre + signature)
// comme un item de la liste, au même titre que l'ordonnance et
// les outils cliniques. Les actions individuelles sur une chip
// (« Prescrire »/« Transmettre ») ouvrent plutôt l'Envoi rapide
// (QuickSendModal.jsx), qui a son propre contenu depuis V7 —
// DocumentActionPanel.jsx n'est plus partagé, ce fichier en est
// le seul appelant.
// Voir PLAN-checkout-v7.md §A, §B.
// =========================================================

// Métadonnées de présentation par type de document (icône, couleur,
// suggestions de destinataires fictives) — la clé est le `kind` du
// document (= le type de chip). Exporté (window.TX_META) pour que
// QuickSendModal.jsx puisse résoudre les mêmes suggestions.
const TX_META = {
  prescription: {
    icon: 'medication', accent: 'var(--mat-sys-primary)', nounPhrase: t('transmission.txNounPrescription.text'),
    attachments: [L('Liste de médicaments active'), L('Note clinique')],
    attachmentsOn: [L('Liste de médicaments active')],
    noteLabel: t('transmission.txNotePharmacist.label'),
    // Bottin des pharmacies (editor-data.jsx) : distance, bannière, canaux.
    suggestions: window.NOTE_DATA.PHARMACIES,
    nearby: true,
  },
  lab: {
    icon: 'science', accent: '#2e9b7a', nounPhrase: t('transmission.txNounLab.text'),
    attachments: [L('Note clinique'), L('Résultats antérieurs')],
    attachmentsOn: [],
    noteLabel: t('transmission.txNoteLab.label'),
    suggestions: [
      { name: L('CIUSSS de l’Estrie — CHUS'), address: L('3001 12e Avenue Nord, Sherbrooke (Québec) J1H 5N4'), phone: '819 346-1110', fax: '819 346-1111', favorite: true },
      { name: L('Biron Groupe Santé'), address: L('1600 rue King Ouest, Sherbrooke (Québec) J1J 2C1'), phone: '819 562-8000', fax: '819 562-8001', favorite: false },
      { name: L('Dynacare'), address: L('375 rue Belvédère Sud, Sherbrooke (Québec) J1H 4B1'), phone: '819 566-3000', fax: '819 566-3001', favorite: false },
    ],
  },
  imaging: {
    icon: 'radiology', accent: '#7a5cc0', nounPhrase: t('transmission.txNounImaging.text'),
    attachments: [L('Note clinique'), L('Résultats antérieurs')],
    attachmentsOn: [],
    noteLabel: t('transmission.txNoteImaging.label'),
    suggestions: [
      { name: L('Radiologie CHUS — Hôpital Fleurimont'), address: L('3001 12e Avenue Nord, Sherbrooke (Québec) J1H 5N4'), phone: '819 346-1110', fax: '819 346-1112', favorite: true },
      { name: L('Clinique de radiologie de Sherbrooke'), address: L('1150 rue King Ouest, Sherbrooke (Québec) J1H 1S1'), phone: '819 562-3131', fax: '819 562-3132', favorite: false },
    ],
  },
  referral: {
    icon: 'assignment', accent: '#c0693c', nounPhrase: t('transmission.txNounReferral.text'),
    // Renseignements cliniques (Figma « Demande de consultation en médecine
    // spécialisée ») : trois pièces proposées d'office par l'assistant (✦),
    // retirables ; « Rechercher au dossier » ajoute le reste.
    attachments: [L('Formulaire pharmacologique'), L('Dernière note clinique'), L('Feuille sommaire'), L('Liste de médicaments active'), L('Note clinique')],
    attachmentsOn: [L('Formulaire pharmacologique'), L('Dernière note clinique'), L('Feuille sommaire')],
    attachmentsSuggested: [L('Formulaire pharmacologique'), L('Dernière note clinique'), L('Feuille sommaire')],
    noteLabel: t('transmission.txNoteSpecialist.label'),
    docTitle: t('documentAction.refDocTitle.title'),
    suggestions: [
      window.NOTE_DATA.CRDS_REGIONAL,
      { name: L('Cardiologie — CHUS'), address: L('3001 12e Avenue Nord, Sherbrooke (Québec) J1H 5N4'), phone: '819 346-1110', fax: '819 346-1113', favorite: false },
    ],
  },
  // Examen diagnostique et service (rencontre du 2026-10-27, C2). Destinations
  // d'exemple, fictives.
  exam: {
    icon: 'monitor_heart', accent: '#b04a6f', nounPhrase: t('transmission.txNounExam.text'),
    attachments: [L('Note clinique'), L('Résultats antérieurs')],
    attachmentsOn: [],
    noteLabel: t('transmission.txNoteExam.label'),
    suggestions: [
      { name: L('Électrophysiologie — CHUS Fleurimont'), address: L('3001 12e Avenue Nord, Sherbrooke (Québec) J1H 5N4'), phone: '819 346-1110', fax: '819 346-1114', favorite: true },
      { name: L('Clinique du sommeil de l’Estrie'), address: L('580 rue Bowen Sud, Sherbrooke (Québec) J1G 2E8'), phone: '819 563-2222', fax: '819 563-2223', favorite: false },
    ],
  },
  service: {
    icon: 'medical_services', accent: '#3d7f8f', nounPhrase: t('transmission.txNounService.text'),
    attachments: [L('Note clinique'), L('Liste de médicaments active')],
    attachmentsOn: [L('Note clinique')],
    noteLabel: t('transmission.txNoteService.label'),
    suggestions: [
      { name: L('Soins infirmiers — Clinique du Centre-ville'), address: '', phone: '', fax: '', favorite: true },
      { name: L('CLSC de Sherbrooke — soins à domicile'), address: L('50 rue Camirand, Sherbrooke (Québec) J1H 4J5'), phone: '819 780-2222', fax: '819 780-2223', favorite: false },
    ],
  },
  clinicalTool: {
    icon: 'handyman', accent: '#5b54b8', nounPhrase: t('transmission.txNounForm.text'),
    titlePrefix: t('transmission.txTitlePrefixTool.text'),
    attachments: [L('Note clinique')],
    attachmentsOn: [],
    noteLabel: t('transmission.txNoteRecipient.label'),
    suggestions: [
      { name: L('CIUSSS de l’Estrie — CHUS'), address: L('3001 12e Avenue Nord, Sherbrooke (Québec) J1H 5N4'), phone: '819 346-1110', fax: '819 346-1111', favorite: true },
      { name: L('GMF Sherbrooke-Est'), address: L('1200 rue King Est, Sherbrooke (Québec) J1G 1E5'), phone: '819 565-1200', fax: '819 565-1201', favorite: false },
    ],
  },
  instructions: {
    icon: 'menu_book', accent: 'var(--mat-sys-primary)', nounPhrase: t('transmission.txNounDocument.text'),
    attachments: [L('Note clinique')],
    attachmentsOn: [],
    noteLabel: t('transmission.txNotePatient.label'),
    suggestions: [
      { name: L('Portail patient sécurisé'), address: '', phone: '', fax: '', favorite: true },
    ],
  },
};

// Catégories de la sidebar, dans l'ordre de la maquette « Transmission
// générale » : une par type de document, affichées même vides (avec 0).
// « Copie de note » n'a pas encore de type de document. « Consignes »,
// absente de la maquette, est ajoutée en dernier (Q5 du plan).
const TX_SIDE_GROUPS = [
  { title: t('transmission.catCopieNote.text'), kinds: [] },
  { title: t('transmission.catMedication.text'), kinds: ['prescription'] },
  { title: t('transmission.catLaboratoire.text'), kinds: ['lab'] },
  { title: t('transmission.catImagerie.text'), kinds: ['imaging'] },
  { title: t('transmission.catConsultation.text'), kinds: ['referral'] },
  { title: t('transmission.catExamen.text'), kinds: ['exam'] },
  { title: t('transmission.catService.text'), kinds: ['service'] },
  { title: t('transmission.catFormulaire.text'), kinds: ['clinicalTool'] },
  { title: t('transmission.catConsignes.text'), kinds: ['instructions'] },
];

const TX_FORWARD_OPTS = [
  L('Ne pas faire suivre'),
  L('Médecin de famille'),
  L('Médecin référent'),
  L('Patient (portail sécurisé)'),
  L('Autre professionnel de la santé'),
];
const TX_OTHER_DOCTORS = [L('Dr Marc Lefebvre'), L('Dre Sophie Bouchard'), L('Dr Julien Gagnon')];
const TX_OTHER_INSTITUTIONS = [L('Hôpital Fleurimont — CHUS'), L('GMF Sherbrooke-Est'), L('Clinique médicale King Ouest')];

function txStatus(doc) {
  if (!doc.complete) return 'todo';
  if (!doc.transmitted) return 'ready';
  return 'done';
}
const TX_STATUS_LABEL = { todo: t('transmission.statusTodo.text'), ready: t('transmission.statusReady.text'), done: t('transmission.statusDone.text') };
const TX_STATUS_ICON = { todo: 'warning_amber', ready: 'check_circle', done: 'done_all' };
const TX_STATUS_COLOR = { todo: '#a15c00', ready: 'var(--mat-sys-primary)', done: '#2e9b7a' };
// Pastilles de compte dans l'onglet « Transmission des documents ».
const TX_PILL_STYLE = {
  todo: { color: TX_STATUS_COLOR.todo, background: 'light-dark(#fdf1de, #4c3d24)' },
  ready: { color: TX_STATUS_COLOR.ready, background: 'color-mix(in srgb, var(--mat-sys-primary) 12%, var(--mat-sys-surface-container-lowest))' },
  done: { color: TX_STATUS_COLOR.done, background: 'light-dark(#e6f5ee, #244c39)' },
};

// Dialogue « Compléter la note » — faire suivre la note + signature, ouvert
// par « Finaliser » dans l'éditeur. La complétion de la note est sortie du
// checkout (D-11) : celui-ci ne traite plus que les documents, et s'ouvre
// après la complétion s'il en reste à transmettre (Q-40).
function NoteFinalizeDialog({ noteInfo, doctorName, institution, pendingDocs, onFinalize, onCancel }) {
  const [ddOpen, setDdOpen] = React.useState(null);
  const [forwardIdx, setForwardIdx] = React.useState(0);
  const [doctorIdx, setDoctorIdx] = React.useState(0);
  const [instIdx, setInstIdx] = React.useState(0);
  const docName = doctorName || t('documentPreview.medecinActuel.text');
  const instName = institution || t('fax.etablissementActuel.text');
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
          {leadIcon ? <span className="material-icons-outlined" style={{ fontSize: 18, color: 'var(--mat-sys-on-surface-variant)' }}>{leadIcon}</span> : null}
          <span style={nap.ddText}>{value}</span>
          <span className="material-icons" style={{ fontSize: 22, color: 'color-mix(in srgb, var(--mat-sys-on-surface) 40%, transparent)' }}>arrow_drop_down</span>
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
                    <span className="material-icons" style={{ fontSize: 18, color: sel ? 'var(--mat-sys-primary)' : 'transparent' }}>check</span>
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

  React.useEffect(function () {
    function onKey(e) { if (e.key === 'Escape' && !ddOpen) onCancel(); }
    document.addEventListener('keydown', onKey);
    return function () { document.removeEventListener('keydown', onKey); };
  }, [onCancel, ddOpen]);

  return (
    <div style={nap.scrim} onMouseDown={function (e) { if (e.target === e.currentTarget) onCancel(); }}>
      <div style={nap.dialog} role="dialog" aria-modal="true" aria-label={t('transmission.completerNote.button')}>
      <div style={nap.dialogHead}>
        <span style={nap.dialogTitle}>{t('transmission.completerNote.button')}</span>
        <button type="button" className="ds-icon-btn" onClick={onCancel} aria-label={t('transmission.fermer.aria')}>
          <span className="material-icons" style={{ fontSize: 22 }}>close</span>
        </button>
      </div>
      <div style={nap.noteTile}>
        <span style={nap.noteTileIcon}>
          <span className="material-icons-outlined" style={{ fontSize: 20, color: 'var(--mat-sys-on-surface)' }}>description</span>
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={nap.noteTileTitle}>{(noteInfo && noteInfo.title) || t('transmission.noteClinique.text')}</div>
          <div style={nap.noteTileMeta}>{[fmtNoteDate(), docName, instName].filter(Boolean).join(' · ')}</div>
        </div>
        {noteInfo && noteInfo.visitType ? <span style={nap.noteTileBadge}>{noteInfo.visitType}</span> : null}
      </div>

      {pendingDocs.length > 0 &&
        <div style={nap.warnBanner}>
          <span className="material-icons-outlined" style={{ fontSize: 19, color: 'light-dark(#a15c00, #e9cca5)', flexShrink: 0, marginTop: 1 }}>warning</span>
          <div style={nap.warnText}>
            {tn('transmission.pending.hint', pendingDocs.length, { titles: pendingDocs.map(function (d) { return d.title; }).join(', ') })}
          </div>
        </div>
      }

      <div style={nap.fieldBlock}>
        <div style={nap.fieldLabel}>{t('transmission.faireSuivreNote.text')}</div>
        {dropdown('forward', TX_FORWARD_OPTS[forwardIdx], TX_FORWARD_OPTS, setForwardIdx, 'send')}
      </div>

      <div style={nap.fieldBlock}>
        <div style={nap.fieldLabel}>{t('transmission.signature.text')}</div>
        <div style={nap.sigRow}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={nap.subLabel}>{t('transmission.medecin.text')}</div>
            {dropdown('doctor', doctorOpts[doctorIdx], doctorOpts, setDoctorIdx, 'badge')}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={nap.subLabel}>{t('transmission.etablissement.text')}</div>
            {dropdown('inst', instOpts[instIdx], instOpts, setInstIdx, 'business')}
          </div>
        </div>
      </div>

      <div style={nap.dialogActions}>
        <button type="button" className="ds-btn ds-btn--outlined" onClick={onCancel}>{t('transmission.annuler.button')}</button>
        <button type="button" className="ds-btn ds-btn--filled" autoFocus
          onClick={function () { onFinalize({ forwardIdx: forwardIdx, doctorIdx: doctorIdx, instIdx: instIdx }); }}>
          {t('transmission.completerNote.button')}
        </button>
      </div>
      </div>
    </div>
  );
}

function TransmissionModal({ docs, initialFrozenDocs, onPatch, onComplete, doctorName, institution, initialSelectedId, showSuggestions, readOnly, noteInfo, onPatchArchivedNote, onClose }) {
  const [selectedId, setSelectedId] = React.useState(function () {
    const list = initialFrozenDocs || docs;
    return initialSelectedId || (list[0] && list[0].id) || null;
  });
  // 'review' | 'print'. L'écran fax n'a plus d'entrée depuis que le split
  // « Compléter et faxer » est retiré (maquette « Transmission générale ») :
  // Transmettre envoie par les canaux cochés du destinataire.
  const [screen, setScreen] = React.useState('review');
  // Compléter la note (NoteFinalizeDialog, dans l'éditeur) réinitialise
  // l'éditeur (docStats/txState remis à vide pour une nouvelle note) — si des
  // documents restent à transmettre, le checkout s'ouvre ensuite sur un
  // instantané pris avant la complétion (`initialFrozenDocs`), et toute la
  // suite (sélection, compteurs, patch) l'utilise à la place de la prop
  // `docs` tant qu'il existe.
  const [frozenDocs, setFrozenDocs] = React.useState(initialFrozenDocs || null);
  const effectiveDocs = frozenDocs || docs;

  React.useEffect(function () {
    if (effectiveDocs.length && !effectiveDocs.some(function (d) { return d.id === selectedId; })) {
      setSelectedId(effectiveDocs[0].id);
    }
  }, [effectiveDocs]); // eslint-disable-line

  React.useEffect(function () {
    function onKey(e) { if (e.key === 'Escape' && screen === 'review') onClose(); }
    document.addEventListener('keydown', onKey);
    return function () { document.removeEventListener('keydown', onKey); };
  }, [screen, onClose]);

  const selected = effectiveDocs.find(function (d) { return d.id === selectedId; }) || null;
  const meta = selected ? TX_META[selected.kind] : null;

  const counts = { todo: 0, ready: 0, done: 0 };
  effectiveDocs.forEach(function (d) { counts[txStatus(d)]++; });

  // Un kind absent des catégories tombe dans « Autres documents » plutôt que
  // de disparaître de la sidebar.
  const sideGroups = TX_SIDE_GROUPS.map(function (g) {
    return { title: g.title, docs: effectiveDocs.filter(function (d) { return g.kinds.indexOf(d.kind) !== -1; }) };
  });
  const otherDocs = effectiveDocs.filter(function (d) {
    return !TX_SIDE_GROUPS.some(function (g) { return g.kinds.indexOf(d.kind) !== -1; });
  });
  if (otherDocs.length) sideGroups.push({ title: t('transmission.autresDocuments.tooltip'), docs: otherDocs });

  // Une fois figé (voir frozenDocs plus haut), le patch/complete ne peut
  // plus remonter au txState vivant de l'éditeur (déjà réinitialisé pour une
  // nouvelle note) : il modifie l'instantané local ET la note déjà archivée
  // dans le Journal (onPatchArchivedNote), sans quoi la suite de la
  // transmission (destinataire ajouté, document complété/transmis) ne
  // survivrait pas à la fermeture de ce modal.
  function patch(id, p) {
    if (frozenDocs) {
      setFrozenDocs(function (prev) { return prev.map(function (d) { return d.id === id ? Object.assign({}, d, p) : d; }); });
      if (onPatchArchivedNote) onPatchArchivedNote(id, p);
      return;
    }
    if (onPatch) onPatch(id, p);
  }

  function addRecipient(doc, r) {
    if (doc.recipients.some(function (x) { return x.name === r.name; })) return;
    var withId = Object.assign({ id: 'r-' + doc.id + '-' + doc.recipients.length + '-' + r.name.length }, r);
    patch(doc.id, { recipients: doc.recipients.concat([withId]) });
  }
  function removeRecipient(doc, rid) {
    patch(doc.id, { recipients: doc.recipients.filter(function (x) { return x.id !== rid; }) });
  }

  // Après une transmission (impression, envoi) : s'il reste des
  // documents non transmis, on revient à l'écran de revue ; sinon on ferme
  // tout le flux (règle sticky Figma, voir PLAN §2.6).
  function afterTransmit(thisId) {
    var remaining = effectiveDocs.filter(function (d) { return d.id !== thisId && !(d.complete && d.transmitted); }).length;
    setScreen('review');
    if (remaining === 0) onClose();
  }

  function markComplete(doc) {
    if (frozenDocs) {
      var idsKey = doc.items.map(function (it) { return it.id; }).sort().join(',');
      setFrozenDocs(function (prev) { return prev.map(function (d) { return d.id === doc.id ? Object.assign({}, d, { complete: true }) : d; }); });
      if (onPatchArchivedNote) onPatchArchivedNote(doc.id, { complete: true, itemIds: idsKey });
      return;
    }
    if (onComplete) onComplete(doc.id);
  }
  function quickPrint() { setScreen('print'); }
  function quickSend(doc) {
    patch(doc.id, { transmitted: true });
    // Échec simulé (tweak) : NoteEditor annonce l'échec, pas de succès ici.
    if (!window.__SIMULATE_TX_FAILURE && window.toast) window.toast(t('transmission.documentTransmis.toast'), { icon: 'check_circle' });
    afterTransmit(doc.id);
  }

  function transmitReady() {
    if (!selected || selected.transmitted || !selected.complete) return;
    quickSend(selected);
  }
  // « Signer et transmettre » : complète le document s'il ne l'est pas, puis
  // le transmet d'un seul geste.
  function signAndTransmit() {
    if (!selected || selected.transmitted) return;
    if (!selected.complete) markComplete(selected);
    quickSend(selected);
  }
  function transmitAll() {
    var ids = effectiveDocs.filter(function (d) { return d.complete && !d.transmitted; }).map(function (d) { return d.id; });
    ids.forEach(function (id) { patch(id, { transmitted: true }); });
    if (!window.__SIMULATE_TX_FAILURE && window.toast) window.toast(tn('transmission.sent.toast', ids.length), { icon: 'check_circle' });
    setScreen('review');
    onClose();
  }

  function onPrintDone() {
    if (selected) patch(selected.id, { transmitted: true });
    if (selected) afterTransmit(selected.id);
  }

  const readyCount = effectiveDocs.filter(function (d) { return d.complete && !d.transmitted; }).length;

  // Boutons du document, dans le pied (maquette « Transmission générale ») :
  // « Compléter » puis « Transmettre ». Transmettre reste désactivé tant que
  // le document n'est pas complété (réponse Q2 du plan, 2026-10-29).
  const noRecipient = !selected || selected.recipients.length === 0;
  const blocked = !!selected && !selected.complete && (selected.blocking || []).length > 0;
  const completeDisabled = !selected || selected.complete || noRecipient || blocked;
  const transmitDisabled = !selected || !selected.complete || noRecipient || selected.transmitted;
  const signDisabled = !selected || selected.transmitted || noRecipient || blocked;
  const signTitle = !selected ? undefined
    : selected.transmitted ? t('documentAction.alreadyTransmitted.tooltip')
    : blocked ? (selected.blocking || []).join('\n')
    : (noRecipient ? t('documentAction.noRecipient.tooltip') : undefined);
  const completeTitle = !selected ? undefined
    : selected.complete ? t('documentAction.alreadyCompleted.tooltip')
    : blocked ? (selected.blocking || []).join('\n')
    : (noRecipient ? t('documentAction.noRecipient.tooltip') : undefined);
  const transmitTitle = !selected ? undefined
    : selected.transmitted ? t('documentAction.alreadyTransmitted.tooltip')
    : [!selected.complete ? t('documentAction.notCompleted.tooltip', { title: selected.title }) : '', noRecipient ? t('documentAction.noRecipient.tooltip') : '']
        .filter(Boolean).join('\n') || undefined;

  // Document précédent / suivant : l'ordre de la sidebar.
  const navIds = sideGroups.reduce(function (acc, g) {
    return acc.concat(g.docs.map(function (d) { return d.id; }));
  }, []);
  const navIdx = navIds.indexOf(selectedId);
  function goTo(delta) {
    const id = navIds[navIdx + delta];
    if (id) setSelectedId(id);
  }
  function comingSoon() {
    if (window.toast) window.toast(t('transmission.aVenir.toast'), { icon: 'info' });
  }

  if (screen === 'print' && selected) {
    return (
      <window.PrintDialog
        doc={selected} doctorName={doctorName} institution={institution}
        onCancel={function () { setScreen('review'); }}
        onDone={onPrintDone} />
    );
  }

  return (
    <div style={tx.scrim} onMouseDown={onClose}>
      <div style={tx.shell} onMouseDown={function (e) { e.stopPropagation(); }}>
        {/* Onglets du checkout. Portail patient et Pré-facturation ne sont
            pas encore conçus : affichés, ils annoncent « à venir » (Q10). */}
        <div style={tx.tabsRow}>
          <div style={tx.tabs} role="tablist">
            <div style={tx.tab} role="tab" aria-selected="true">
              <span style={Object.assign({}, tx.tabTitle, tx.tabTitleOn)}>
                {readOnly ? t('transmission.documentsNote.text') : t('transmission.transmissionDocuments.text')}
                {readOnly && noteInfo && noteInfo.title
                  ? <span style={tx.headNote}> — {noteInfo.title}</span> : null}
              </span>
              <span style={tx.tabSub}>
                {['todo', 'ready', 'done'].map(function (st) {
                  if (!counts[st]) return null;
                  return (
                    <span key={st} style={Object.assign({}, tx.pill, TX_PILL_STYLE[st])}>
                      <span className="material-icons-outlined" style={{ fontSize: 15 }}>{TX_STATUS_ICON[st]}</span>
                      {counts[st]} {TX_STATUS_LABEL[st]}
                    </span>
                  );
                })}
              </span>
              <span style={tx.tabIndicator} />
            </div>
            {!readOnly &&
              <button style={tx.tab} role="tab" aria-selected="false" onClick={comingSoon}>
                <span style={tx.tabTitle}>{t('transmission.portailPatient.text')}</span>
                <span style={tx.tabSubText}>{tn('transmission.elementsPartages.label', 0)}</span>
              </button>}
            {!readOnly &&
              <button style={tx.tab} role="tab" aria-selected="false" onClick={comingSoon}>
                <span style={tx.tabTitle}>{t('transmission.preFacturation.text')}</span>
                <span style={tx.tabSubText}>{t('transmission.preFacturationMontant.text')}</span>
              </button>}
          </div>
          <button style={tx.closeBtn} onClick={onClose} aria-label={t('transmission.fermer.aria')}>
            <span className="material-icons" style={{ fontSize: 24 }}>close</span>
          </button>
        </div>

        <div style={tx.bodyRow}>
          <div style={tx.sidebar}>
            <div style={tx.sideHead}>
              <span>{t('transmission.documentsCount.label', { n: effectiveDocs.length })}</span>
              {!readOnly &&
                <button type="button" className="ds-icon-btn" style={tx.sideAddBtn}
                  title={t('transmission.ajouterDocument.button')} aria-label={t('transmission.ajouterDocument.button')}
                  onClick={function () { if (window.toast) window.toast(t('transmission.ajoutDocumentVenir.toast'), { icon: 'info' }); }}>
                  <span className="material-icons" style={{ fontSize: 20 }}>add</span>
                </button>}
            </div>
            {sideGroups.filter(function (g) { return g.docs.length > 0; }).map(function (g) {
              // Tout ce que contient la section est transmis : coche verte.
              const allSent = g.docs.every(function (d) { return txStatus(d) === 'done'; });
              return (
                <div key={g.title} style={tx.sideGroup}>
                  <div style={tx.sideGroupTitle}>
                    {g.title} {g.docs.length}
                    {allSent &&
                      <span className="material-icons" role="img" title={TX_STATUS_LABEL.done} aria-label={TX_STATUS_LABEL.done}
                        style={tx.sideGroupCheck}>check_circle</span>}
                  </div>
                  {g.docs.map(function (d) { return renderSideRow(d); })}
                </div>
              );
            })}
          </div>

          <div style={tx.main}>
            {/* Bandeau patient du DME, version repliée : le flux peut s'ouvrir
                en lecture seule depuis le journal d'une autre note, il faut
                rappeler de qui il s'agit. */}
            <div style={tx.bannerWrap}>
              <window.PatientBanner compactOnly />
            </div>
            <div style={tx.panel}>
              {selected
                ? <window.DocumentActionPanel
                    doc={selected} meta={meta} doctorName={doctorName} institution={institution}
                    showSuggestions={showSuggestions}
                    readOnly={readOnly}
                    onPatch={function (p) { patch(selected.id, p); }}
                    onAddRecipient={function (r) { addRecipient(selected, r); }}
                    onRemoveRecipient={function (rid) { removeRecipient(selected, rid); }}
                    onQuickPrint={quickPrint} />
                : <div style={tx.panelEmpty}>{t('transmission.selectionnezDocumentListe.text')}</div>
              }
            </div>
          </div>
        </div>

        {/* Pied : navigation entre documents (boutons icônes) à gauche,
            « Tout transmettre » puis « Signer et transmettre » à droite. */}
        <div style={tx.footer}>
          <button type="button" className="ds-btn ds-btn--outlined" style={tx.footIconBtn}
            title={t('transmission.documentPrecedent.button')} aria-label={t('transmission.documentPrecedent.button')}
            disabled={navIdx <= 0} onClick={function () { goTo(-1); }}>
            <span className="material-icons" style={{ fontSize: 22 }}>chevron_left</span>
          </button>
          <button type="button" className="ds-btn ds-btn--outlined" style={tx.footIconBtn}
            title={t('transmission.documentSuivant.button')} aria-label={t('transmission.documentSuivant.button')}
            disabled={navIdx < 0 || navIdx >= navIds.length - 1} onClick={function () { goTo(1); }}>
            <span className="material-icons" style={{ fontSize: 22 }}>chevron_right</span>
          </button>
          <div style={{ flex: 1 }} />
          {!readOnly &&
            <button type="button" className="ds-btn ds-btn--tonal" style={tx.footIconBtn}
              title={t('transmission.transmitAll.button', { n: readyCount })}
              aria-label={t('transmission.transmitAll.button', { n: readyCount })}
              disabled={readyCount === 0} onClick={transmitAll}>
              <span className="material-icons" style={{ fontSize: 22 }}>send</span>
            </button>}
          {!readOnly && selected &&
            <button type="button" className="ds-btn ds-btn--filled" style={tx.footBtn}
              title={signTitle} disabled={signDisabled}
              onClick={signAndTransmit}>
              <span className="material-icons" style={tx.footIc}>send</span>
              {t('documentAction.signTransmit.button')}
            </button>}
        </div>
      </div>
    </div>
  );

  // Ligne.document du Figma (plan V7 §G) : titre, sous-titre, ligne
  // destinataire — « Aucun destinataire » en ambre quand il en manque un,
  // pour que le blocage de la transmission se lise depuis la liste sans
  // avoir à ouvrir chaque document. L'état sélectionné pose une barre bleue
  // à gauche et passe le titre en bleu.
  function renderSideRow(d) {
    const st = txStatus(d);
    const sel = d.id === selectedId;
    const sub = d.kind === 'prescription'
      ? tn('transmission.prescriptions.label', d.items.length)
      : (d.subtitle || (d.items[0] && d.items[0].sub) || '');
    const dest = d.recipients.length
      ? d.recipients.map(function (r) { return r.name; }).join(', ')
      : null;
    return (
      <button key={d.id}
        style={Object.assign({}, tx.sideRow, st === 'done' ? tx.sideRowDone : {}, sel ? tx.sideRowSel : {})}
        aria-current={sel ? 'true' : undefined}
        onClick={function () { setSelectedId(d.id); }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={Object.assign({}, tx.sideRowTitle, st === 'done' ? tx.sideRowTitleDone : {}, sel ? tx.sideRowTitleSel : {})}>{d.title}</div>
          {sub ? <div style={tx.sideRowSub}>{sub}</div> : null}
          <div style={dest ? tx.sideRowDest : tx.sideRowDestNone}>{dest || t('transmission.aucunDestinataire.text')}</div>
        </div>
        <span className="material-icons-outlined" style={{ fontSize: 20, color: TX_STATUS_COLOR[st], flexShrink: 0 }}
          title={st === 'done' ? t('documentAction.transmise.text') : TX_STATUS_LABEL[st]}>
          {TX_STATUS_ICON[st]}
        </span>
      </button>
    );
  }
}

const tx = {
  // Modale ancrée sous la barre du DME, à marges latérales (maquette
  // « Transmission générale ») ; l'entrée sheet-up est gardée (V7 §A.1).
  scrim: {
    position: 'fixed', inset: 0, background: 'rgba(20,20,40,0.5)', zIndex: 3999,
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    animation: 'sheet-scrim-in 200ms ease-out',
  },
  shell: {
    position: 'relative', width: 'calc(100% - 80px)', maxWidth: 1440, height: 'calc(100vh - 66px)',
    background: 'var(--mat-sys-surface-container-lowest)', zIndex: 4000, borderRadius: '20px 20px 0 0',
    boxShadow: '0 -12px 40px rgba(20,20,50,0.28)',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
    fontFamily: "'Inter', sans-serif", animation: 'sheet-up 320ms cubic-bezier(.16,1,.3,1)',
  },
  tabsRow: {
    display: 'flex', alignItems: 'center', gap: 12, padding: '0 14px 0 12px', height: 79,
    borderBottom: '1px solid var(--mat-sys-outline-variant)', flexShrink: 0,
  },
  tabs: { flex: 1, display: 'flex', alignSelf: 'stretch' },
  tab: {
    flex: '0 1 33.333%', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
    border: 0, background: 'transparent', padding: '0 8px', cursor: 'pointer', font: 'inherit',
  },
  tabTitle: { fontFamily: "'Poppins', sans-serif", fontWeight: 500, fontSize: 15, color: 'color-mix(in srgb, var(--mat-sys-on-surface) 80%, transparent)', whiteSpace: 'nowrap' },
  tabTitleOn: { fontWeight: 600, color: 'var(--mat-sys-primary)' },
  tabSub: { display: 'flex', gap: 6, minHeight: 22 },
  tabSubText: { fontSize: 13, color: 'color-mix(in srgb, var(--mat-sys-on-surface) 75%, transparent)' },
  tabIndicator: {
    position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
    width: 128, height: 3, borderRadius: '3px 3px 0 0', background: 'var(--mat-sys-primary)',
  },
  headNote: { fontWeight: 400, color: 'color-mix(in srgb, var(--mat-sys-on-surface) 50%, transparent)' },
  pill: { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12.5, fontWeight: 600, borderRadius: 4, padding: '2px 6px' },
  closeBtn: {
    width: 40, height: 40, flexShrink: 0, border: 0, borderRadius: 8, cursor: 'pointer',
    background: 'var(--mat-sys-surface-container)', color: 'var(--mat-sys-on-surface)',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  },

  bodyRow: { flex: 1, display: 'flex', overflow: 'hidden' },

  // Sidebar (maquette « Transmission générale ») : fond lavande, catégories
  // en casse normale avec compteur, lignes sans icône de type ; la ligne
  // choisie est une carte blanche au titre bleu, une ligne transmise est grise.
  sidebar: {
    width: 280, flexShrink: 0, borderRight: '1px solid var(--mat-sys-outline-variant)',
    background: 'var(--mat-sys-surface-container-low)',
    overflowY: 'auto', padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 14,
  },
  sideHead: {
    display: 'flex', alignItems: 'center', gap: 4, padding: '0 0 0 12px',
    fontSize: 12.5, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase',
    color: 'color-mix(in srgb, var(--mat-sys-on-surface) 85%, transparent)',
  },
  sideAddBtn: { color: 'var(--mat-sys-on-surface)' },
  sideGroup: { display: 'flex', flexDirection: 'column', gap: 4 },
  sideGroupCheck: { fontSize: 18, verticalAlign: 'middle', marginLeft: 6, color: 'light-dark(#1e7e34, #6fcf8a)' },
  sideGroupTitle: { fontSize: 13, fontWeight: 500, color: 'color-mix(in srgb, var(--mat-sys-on-surface) 80%, transparent)', padding: '0 12px' },
  sideRow: {
    display: 'flex', alignItems: 'flex-start', gap: 8, width: '100%',
    border: 0, background: 'transparent', borderRadius: 8, padding: '10px 12px',
    cursor: 'pointer', textAlign: 'left', font: 'inherit',
  },
  sideRowSel: { background: 'var(--mat-sys-surface-container-lowest)', boxShadow: '0 1px 2px rgba(37,36,94,.08)' },
  sideRowDone: { background: 'var(--mat-sys-surface-container)' },
  sideRowTitle: { fontSize: 13, fontWeight: 500, color: 'color-mix(in srgb, var(--mat-sys-on-surface) 88%, transparent)' },
  sideRowTitleSel: { color: 'var(--mat-sys-primary)' },
  sideRowTitleDone: { color: 'color-mix(in srgb, var(--mat-sys-on-surface) 70%, transparent)' },
  sideRowSub: { fontSize: 12.5, color: 'color-mix(in srgb, var(--mat-sys-on-surface) 60%, transparent)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  sideRowDest: { fontSize: 12.5, color: 'color-mix(in srgb, var(--mat-sys-on-surface) 60%, transparent)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  sideRowDestNone: { fontSize: 12.5, color: 'light-dark(#a15c00, #e9cca5)', marginTop: 2 },

  main: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  bannerWrap: { padding: '12px 12px 0', flexShrink: 0 },
  panel: { flex: 1, overflowY: 'auto', padding: '22px 28px 28px' },
  panelEmpty: { color: 'color-mix(in srgb, var(--mat-sys-on-surface) 45%, transparent)', fontSize: 14, padding: 30, textAlign: 'center' },

  footer: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '16px 24px', borderTop: '1px solid var(--mat-sys-outline-variant)', flexShrink: 0,
    background: 'var(--mat-sys-surface-container-lowest)',
  },
  footBtn: { height: 44, whiteSpace: 'nowrap' },
  footIc: { fontSize: 20 },
  footIconBtn: { width: 44, height: 44, padding: 0 },
};

// Styles du panneau « Note » (faire suivre + signature).
const nap = {
  noteTile: {
    display: 'flex', alignItems: 'center', gap: 11,
    border: '1px solid var(--mat-sys-outline-variant)', borderRadius: 10, background: 'light-dark(#f7f9fc, #24344c)', padding: '11px 13px',
  },
  noteTileIcon: {
    width: 34, height: 34, borderRadius: 8, flexShrink: 0, background: 'color-mix(in srgb, var(--mat-sys-primary) 10%, var(--mat-sys-surface-container-lowest))',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  },
  noteTileTitle: { fontSize: 14, fontWeight: 600, color: 'color-mix(in srgb, var(--mat-sys-on-surface) 82%, transparent)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  noteTileMeta: { fontSize: 12.5, color: 'color-mix(in srgb, var(--mat-sys-on-surface) 50%, transparent)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  noteTileBadge: {
    flexShrink: 0, fontSize: 11, fontWeight: 600, color: 'var(--mat-sys-on-surface)',
    background: 'color-mix(in srgb, var(--mat-sys-primary) 10%, var(--mat-sys-surface-container-lowest))', borderRadius: 6, padding: '3px 8px', letterSpacing: 0.2,
  },
  warnBanner: {
    display: 'flex', alignItems: 'flex-start', gap: 9, marginTop: 14,
    border: '1px solid light-dark(#f3ddb0, #4c3f24)', background: 'light-dark(#fdf6e6, #4c4024)', borderRadius: 10, padding: '10px 12px',
  },
  warnText: { fontSize: 13, color: 'light-dark(#7a5200, #e9d2a5)', lineHeight: 1.45 },

  fieldBlock: { marginTop: 18 },
  fieldLabel: { fontSize: 12, fontWeight: 600, color: 'color-mix(in srgb, var(--mat-sys-on-surface) 55%, transparent)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.3 },
  subLabel: { fontSize: 11.5, fontWeight: 500, color: 'color-mix(in srgb, var(--mat-sys-on-surface) 50%, transparent)', marginBottom: 5 },
  sigRow: { display: 'flex', gap: 12 },

  ddBtn: {
    width: '100%', display: 'flex', alignItems: 'center', gap: 8,
    border: '1.5px solid var(--mat-sys-outline-variant)', borderRadius: 9, background: 'var(--mat-sys-surface-container-lowest)',
    padding: '9px 10px 9px 12px', cursor: 'pointer', textAlign: 'left',
    font: "500 14px 'Inter',sans-serif", color: 'color-mix(in srgb, var(--mat-sys-on-surface) 82%, transparent)',
  },
  ddBtnOpen: { border: '1.5px solid var(--mat-sys-primary)', boxShadow: '0 0 0 3px rgba(25,117,209,0.13)' },
  ddText: { flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  ddScrim: { position: 'fixed', inset: 0, zIndex: 10 },
  ddList: {
    position: 'absolute', top: 'calc(100% + 5px)', left: 0, right: 0, zIndex: 11,
    background: 'var(--mat-sys-surface-container-lowest)', border: '1px solid var(--mat-sys-outline-variant)', borderRadius: 10,
    boxShadow: '0 10px 28px rgba(20,20,50,0.16)', padding: '5px 0', maxHeight: 240, overflowY: 'auto',
  },
  ddOption: {
    width: '100%', display: 'flex', alignItems: 'center', gap: 9,
    border: 0, background: 'transparent', cursor: 'pointer', textAlign: 'left',
    padding: '9px 13px', font: "500 13.5px 'Inter',sans-serif", color: 'color-mix(in srgb, var(--mat-sys-on-surface) 78%, transparent)',
  },
  ddOptionSel: { color: 'var(--mat-sys-primary)', background: 'light-dark(#f5f8fe, #24324c)' },

  scrim: {
    position: 'fixed', inset: 0, zIndex: 3999, background: 'rgba(20,20,40,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'sheet-scrim-in 200ms ease-out',
  },
  dialog: {
    width: 560, maxWidth: 'calc(100vw - 32px)', maxHeight: 'calc(100vh - 48px)', overflowY: 'auto',
    background: 'var(--mat-sys-surface-container-lowest)', borderRadius: 14, padding: '18px 24px 22px',
    boxShadow: '0 20px 48px rgba(0,0,0,0.24)', fontFamily: "'Inter', sans-serif",
  },
  dialogHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  dialogTitle: { font: "600 19px 'Poppins',sans-serif", color: 'var(--mat-sys-on-surface)' },
  dialogActions: { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 26 },
};

window.TransmissionModal = TransmissionModal;
window.TX_META = TX_META;
window.NoteFinalizeDialog = NoteFinalizeDialog;
