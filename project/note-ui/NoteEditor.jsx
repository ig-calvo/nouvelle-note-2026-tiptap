/* global React */
function NoteEditor({ isOpen, onOpen, onComplete, onPatchArchivedTx, completeRef, smartActive, doctorName, institution, showClinicalTools = true,
  startPoints = false, lastNote, onLinkEpisode, onSmartPick, saveDraftRef, ftBarStyle = 'haut', ftBarPosition = 'haut',
  reviewingMode = false, reviewAuthor = 'me', checkoutSuggestions = false, simulateTxFailure = false,
  templateTextProposed = false, suggestionStyle = 'tirets', formOpenMode = 'auto', groupRequests = false, inlineFieldEdit = true,
  aiProposals = false }) {
  // Tweak « Édition inline des valeurs secondaires (après Q1 2027) » (D-02) :
  // désactivée = portée Q1, un clic sur une valeur secondaire ouvre le
  // formulaire complet. Lu aussi par le clavier des puces (chipKeys) et le CSS.
  window.__INLINE_FIELD_EDIT = inlineFieldEdit !== false;
  React.useEffect(function() { document.documentElement.setAttribute('data-inline-edit', inlineFieldEdit !== false ? 'on' : 'off'); }, [inlineFieldEdit]);
  // Tweak « Checkout des requêtes » : lu par buildTransmissionDocs
  // (editor-schema.jsx), ici et dans la liste des notes. Posé pendant le rendu
  // pour que le pied de note et le checkout le voient dès ce rendu-ci.
  window.__GROUP_REQUESTS = !!groupRequests;
  // Lu par editor-field.jsx (filterSlash) pour retirer l'entrée "Outils
  // cliniques" du menu slash sans faire dépendre editor-data.jsx d'une prop.
  React.useEffect(function() {
    window.__SHOW_CLINICAL_TOOLS = showClinicalTools;
  }, [showClinicalTools]);

  // Même pont que ci-dessus : lu à la création/édition d'un chip, d'un outil
  // clinique ou à la documentation d'un diagnostic (editor-field.jsx,
  // editor-schema.jsx) pour horodater l'auteur au moment de l'action, sans
  // faire remonter ces fonctions profondément imbriquées jusqu'ici par props.
  React.useEffect(function() {
    window.__CURRENT_AUTHOR = doctorName;
  }, [doctorName]);

  // Mode révision — reviewActive suit le toggle d'en-tête ET l'activation
  // auto par l'IA (voir AIBox onAddToNote plus bas) ; il vit ici (pas dans
  // NoteBody) pour survivre au démontage/remontage de l'éditeur Tiptap à
  // chaque ouverture de note. reviewingMode (tweak) coupe tout quand off :
  // pas de bouton, pas d'auto-activation.
  const [reviewActive, setReviewActive] = React.useState(false);
  const [reviewChanges, setReviewChanges] = React.useState([]);
  const [reviewPopover, setReviewPopover] = React.useState(null); // { change, anchorRect }
  const [reviewGate, setReviewGate] = React.useState(false);
  // Finaliser avec des ajouts en attente (gabarit) : dialogue (Q-06).
  const [pendingGate, setPendingGate] = React.useState(false);
  // Tweak « Gabarit : texte proposé » — lu par l'écouteur de
  // note:apply-template, monté une seule fois.
  const templateTextProposedRef = React.useRef(templateTextProposed);
  templateTextProposedRef.current = templateTextProposed;
  // Tweak « Style des suggestions » : CSS seulement (editor.css).
  React.useEffect(function() { document.documentElement.setAttribute('data-suggestion-style', suggestionStyle || 'tirets'); }, [suggestionStyle]);
  const currentReviewAuthor = window.reviewAuthorById ? window.reviewAuthorById(doctorName, reviewAuthor) : null;

  // Pont React → extension Tiptap (hors de l'arbre React) — même pattern
  // que window.__SHOW_CLINICAL_TOOLS ci-dessus. Le tracker le relit à
  // chaque appendTransaction : pas besoin de reconfigurer l'éditeur quand
  // l'auteur ou l'activation changent.
  React.useEffect(function() {
    window.__REVIEW_STATE = { active: reviewingMode && reviewActive, author: currentReviewAuthor };
  }, [reviewingMode, reviewActive, reviewAuthor, doctorName]);

  // Brouillons sauvegardés (« Continuer la note ») et lien d'épisode de soin
  // (« Depuis la dernière note ») — voir NoteStartCards.jsx pour l'UI et
  // NotesList.jsx pour l'affichage de l'épisode dans la liste.
  const [drafts, setDrafts] = React.useState([]);
  const [episodeId, setEpisodeId] = React.useState(null);

  // L'éditeur Tiptap est non contrôlé : React n'écrit dans le doc que par
  // commandes impératives. `editorRef` référence l'instance vivante (le
  // temps où isOpen est vrai) ; `initialDocRef` porte le contenu de départ
  // pour le PROCHAIN montage de NoteBody (brouillon repris, dernière note,
  // gabarit appliqué avant ouverture) — voir handleEditorReady/handleDocChange.
  const editorRef = React.useRef(null);
  const initialDocRef = React.useRef(null);
  // Dernier instantané des fils de diagnostic envoyé au Sommaire (JSON, pour
  // comparaison bon marché) — évite de redispatcher note:diagnostics-change
  // quand rien n'a changé (handleDocChange tourne à chaque frappe).
  const lastDxRef = React.useRef(null);
  const [docStats, setDocStats] = React.useState({ counts: {}, items: [], diagNames: [], chips: [] });
  // Doc JSON brut (docStats n'en garde qu'un résumé) — nécessaire au Journal
  // des actions (buildActionLog a besoin des attrs savedAt/author de chaque
  // node, pas seulement des compteurs).
  const [docJson, setDocJson] = React.useState(null);
  // Champ confidentiel — hors du document Tiptap (comme raison/date/heure) :
  // jamais sérialisé dans le doc, donc jamais capturé par une impression ou
  // un export qui ne lit que le doc. Créé via l'item « Champ confidentiel »
  // du menu « + » (voir note:confidential-field-request, editor-field.jsx) ;
  // une fois `confidentialAdded`, il n'y a plus de repli/dépli — seule la
  // suppression (avec confirmation) le retire.
  const [confidentialContent, setConfidentialContent] = React.useState('');
  const [confidentialAdded, setConfidentialAdded] = React.useState(false);
  const [confidentialWarningOpen, setConfidentialWarningOpen] = React.useState(false);
  const [confidentialDeleteOpen, setConfidentialDeleteOpen] = React.useState(false);
  // Pont lu par filterSlashItems (editor-schema.jsx) pour retirer l'item du
  // menu « + » une fois le champ créé — une seule instance par note.
  React.useEffect(function() {
    window.__CONFIDENTIAL_FIELD_ADDED = confidentialAdded;
  }, [confidentialAdded]);
  // Filet de sécurité : si la note se ferme par un autre chemin que
  // Compléter/resetNote (ex. le parent bascule isOpen sans passer par eux),
  // la superposition du Sommaire ne doit pas rester accrochée à une note
  // qui n'est plus visible.
  React.useEffect(function() {
    if (!isOpen && lastDxRef.current) {
      lastDxRef.current = null;
      window.__NOTE_DX_OVERLAY = [];
      window.dispatchEvent(new CustomEvent('note:diagnostics-change', { detail: { threads: [] } }));
    }
  }, [isOpen]);
  // Déclenché par l'item « Champ confidentiel » du menu « + » (NoteBody vit
  // dans un composant distinct, voir ct-picker-open pour le même pont).
  React.useEffect(function() {
    function onRequest() { setConfidentialWarningOpen(true); }
    window.addEventListener('note:confidential-field-request', onRequest);
    return function() { window.removeEventListener('note:confidential-field-request', onRequest); };
  }, []);
  // État (pas seulement une ref) pour que NoteRichTextToolbar — rendu en flux
  // normal, voir plus bas — se (re)monte quand l'éditeur apparaît/disparaît.
  const [editorInstance, setEditorInstance] = React.useState(null);

  const [popover, setPopover] = React.useState(null);
  const [filePreview, setFilePreview] = React.useState(null); // { name, url, kind } — chip type "file"
  const [inlineEdit, setInlineEdit] = React.useState(null); // { chipId, field, fieldRect }
  const [linkedChipId, setLinkedChipId] = React.useState(null);

  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [pickerAnchor, setPickerAnchor] = React.useState(null);
  // Transmission des documents (checkout) — TransmissionModal (bottom sheet)
  // est le point d'entrée par défaut : ouvert par « Compléter » (item Note
  // présélectionné, qui porte faire-suivre + signature) et par l'icône ➤
  // (aucune présélection). Les actions individuelles sur une chip
  // (« Prescrire »/« Transmettre ») ouvrent plutôt QuickSendModal, un
  // dialogue léger pour CE document seulement.
  // `txState` persiste tant que la note est ouverte : { [docId]: { recipients,
  // complete, transmitted, comment } }, pour que le bandeau « documents non
  // transmis » de l'item Note reste exact même après fermeture du sheet.
  const [transmissionOpen, setTransmissionOpen] = React.useState(false);
  const [transmissionOnlyId, setTransmissionOnlyId] = React.useState(null);
  const [txState, setTxState] = React.useState({});
  // Événements d'action de la note (D-05) : [{cid, type: 'transmis' |
  // 'annule', at, author, snapshot}]. Hors du doc Tiptap : retirer un chip
  // de la note ne retire pas ce qui a été transmis — le Journal les lit
  // (buildActionLog, editor-schema.jsx).
  const [actionEvents, setActionEvents] = React.useState([]);
  // Lu par TransmissionModal / QuickSendModal : pas de message de succès
  // quand l'échec est simulé.
  React.useEffect(function() { window.__SIMULATE_TX_FAILURE = !!simulateTxFailure; }, [simulateTxFailure]);
  const [quickSendCid, setQuickSendCid] = React.useState(null);
  const [noteDate, setNoteDate] = React.useState(function() { return localIsoDate(new Date()); });
  const [noteTime, setNoteTime] = React.useState(function() { return new Date().toTimeString().slice(0, 5); });
  const [visitType, setVisitType] = React.useState('Visite en clinique');
  const [showTags, setShowTags] = React.useState(false);
  const [tags, setTags] = React.useState([]);

  const [raison, setRaison] = React.useState('');
  const noteCardRef = React.useRef(null);

  function handleEditorReady(editor) {
    editorRef.current = editor;
    setEditorInstance(editor);
  }

  function handleDocChange(docJson) {
    const stats = window.scanDoc(docJson);
    setDocStats(stats);
    setDocJson(docJson);
    window.dispatchEvent(new CustomEvent('note:items-change', { detail: { items: stats.items } }));
    // Superposition déclarative au Sommaire (Summary.jsx) : l'état effectif de
    // chaque fil documenté (Problème/Antécédent — D1/D2/D3), affiché « en
    // attente » tant que la note n'est pas complétée (E2). Comparaison JSON
    // pour ne dispatcher que si quelque chose a réellement changé.
    const dxJson = JSON.stringify(stats.diagThreads);
    if (dxJson !== lastDxRef.current) {
      lastDxRef.current = dxJson;
      window.__NOTE_DX_OVERLAY = stats.diagThreads;
      window.dispatchEvent(new CustomEvent('note:diagnostics-change', { detail: { threads: stats.diagThreads } }));
    }
  }

  // Pied de note (barre du bas, voir Note Clinique.html) : un résumé
  // « complété/total » par nature de document transmissible, plutôt que le
  // simple compte de chips d'avant — remplace note:chips-change. Recalculé
  // aussi bien à chaque changement de contenu (docStats) qu'à chaque
  // complétion/transmission dans le checkout (txState), les deux faisant
  // varier complete/transmitted dans buildTransmissionDocs().
  const DOC_KIND_ORDER = ['prescription', 'clinicalTool', 'lab', 'imaging', 'referral', 'instructions'];
  React.useEffect(function() {
    var byKind = {};
    buildTransmissionDocs().forEach(function(d) {
      if (!byKind[d.kind]) byKind[d.kind] = { total: 0, done: 0 };
      byKind[d.kind].total++;
      if (d.complete && d.transmitted) byKind[d.kind].done++;
    });
    var summary = DOC_KIND_ORDER.filter(function(k) { return byKind[k]; }).map(function(k) {
      var meta = window.TX_META[k] || {};
      return { kind: k, icon: meta.icon || 'description', done: byKind[k].done, total: byKind[k].total };
    });
    window.dispatchEvent(new CustomEvent('note:doc-status-change', { detail: summary }));
  }, [docStats, txState]); // eslint-disable-line

  // Mode révision — recalcule le compteur/liste de changements à chaque
  // update (pas `transaction`, qui feu aussi sur les changements de simple
  // sélection) et ouvre le popover ✓/✗ au clic sur une marque insertion/
  // suppression (délégué sur editor.view.dom, comme les chips ailleurs).
  React.useEffect(function() {
    if (!editorInstance) return undefined;
    function onUpdate() { setReviewChanges(window.scanReviewChanges(editorInstance.state.doc)); }
    function onClick(e) {
      var mark = e.target.closest('.rvw-ins, .rvw-del');
      if (!mark) return;
      var change = window.findChangeAtDom(editorInstance, mark);
      if (change) setReviewPopover({ change: change, anchorRect: mark.getBoundingClientRect() });
    }
    onUpdate();
    editorInstance.on('update', onUpdate);
    editorInstance.view.dom.addEventListener('click', onClick);
    return function() {
      editorInstance.off('update', onUpdate);
      editorInstance.view.dom.removeEventListener('click', onClick);
    };
  }, [editorInstance]);

  // Insère des blocs (paragraphes, node reference, node chip…) à la fin de
  // la première section — que l'éditeur soit déjà monté (commande live) ou
  // pas encore (contenu amorcé pour le prochain montage). Utilisé par la
  // référence de passage, l'Assistant IA et le glisser-déposer du Sommaire.
  function appendToFirstSection(blocks) {
    if (editorRef.current) {
      const pos = window.endOfFirstSectionPos(editorRef.current.state.doc);
      // meta 'reviewAction' : les insertions programmatiques (IA, référence,
      // gabarit, drop du Sommaire) ne doivent jamais être auto-marquées par
      // le reviewTracker — seule la frappe au clavier l'est. Le contenu de
      // l'IA porte déjà ses propres marks insertion (voir markBlocksAsInsertion,
      // câblage AIBox plus bas) quand le mode révision est actif.
      editorRef.current.chain()
        .command(function(props) { props.tr.setMeta('reviewAction', true); return true; })
        .insertContentAt(pos, blocks)
        .run();
    } else {
      const doc = window.ensureSplit(initialDocRef.current || window.DEFAULT_DOC());
      const idx = window.endOfFirstSectionIndexJSON(doc);
      doc.content.splice.apply(doc.content, [idx, 0].concat(blocks));
      initialDocRef.current = doc;
    }
    if (onOpen) onOpen();
  }

  // Insère un outil clinique (node inline, voir ClinicalToolNode dans
  // editor-schema.jsx) à la position du curseur — permet plusieurs
  // instances dans une même note, comme les chips d'ordonnance. Si
  // l'éditeur n'est pas encore monté, l'ajoute à la fin du contenu amorcé
  // (même convention que appendToFirstSection ci-dessus).
  function insertClinicalTool(toolId, label) {
    var node = window.buildClinicalToolNode(toolId, label);
    if (editorRef.current) {
      var pos = window.safeBlockInsertPos(editorRef.current.state.doc, editorRef.current.state.selection.from);
      editorRef.current.chain().focus().insertContentAt(pos, [node]).run();
    } else {
      var doc = initialDocRef.current || window.DEFAULT_DOC();
      doc.content.push(node);
      initialDocRef.current = doc;
    }
    if (onOpen) onOpen();
  }

  React.useEffect(function() {
    function onPickerOpen(e) {
      setPickerAnchor((e.detail && e.detail.rect) || null);
      setPickerOpen(true);
    }
    window.addEventListener('ct-picker-open', onPickerOpen);
    return function() { window.removeEventListener('ct-picker-open', onPickerOpen); };
  }, []);

  // Gabarit de note (/virus, /itu, /periodique, /otite — editor-data.jsx NOTE_TEMPLATES) :
  // règle structure + sections (Titre 2 + paragraphes) + outil clinique en un
  // geste. Les éléments inline d'un gabarit (`proposals`) arrivent en attente
  // (chip pending, ✓ / ✕), jamais appliqués d'office. Note vierge → remplace tout le doc ; note déjà amorcée → ajoute à
  // la suite pour ne rien écraser.
  React.useEffect(function() {
    function onApplyTemplate(e) {
      var key = e.detail && e.detail.key;
      var tpl = (window.NOTE_DATA.NOTE_TEMPLATES || []).find(function(t) { return t.key === key; });
      if (!tpl) return;
      var blocks = window.buildTemplateBlocks(tpl, { proposeText: templateTextProposedRef.current });
      if (tpl.tool === 'itu') blocks.push(window.buildClinicalToolNode('itu', "Feuille de route - Symptômes urinaires"));
      if (editorRef.current) {
        var blank = window.docIsBlank(editorRef.current.getJSON());
        // Note vierge : ensureSplit transforme le Titre 2 « Conclusion » du
        // gabarit en ligne de séparation, à sa place exacte — le contenu du
        // gabarit est inchangé, seule sa conclusion devient déplaçable.
        // Note déjà amorcée : on ajoute AU-DESSUS de la ligne existante (fin
        // des détails) plutôt qu'à la fin du document, qui serait sous la
        // ligne, donc dans la conclusion.
        if (blank) editorRef.current.commands.setContent(window.ensureSplit({ type: 'doc', content: blocks }), true);
        else editorRef.current.chain().insertContentAt(window.splitPosPM(editorRef.current.state.doc), blocks).run();
      } else {
        initialDocRef.current = window.ensureSplit({ type: 'doc', content: blocks });
      }
      setRaison(function(prev) { return prev && prev.trim() ? prev : (tpl.raison || ''); });
      if (onOpen) onOpen();
    }
    window.addEventListener('note:apply-template', onApplyTemplate);
    return function() { window.removeEventListener('note:apply-template', onApplyTemplate); };
  }, []);

  // « + » Problèmes / Antécédents du Sommaire (tweak, piste de vision) :
  // ouvre la recherche « /dx » dans la note — sous la ligne du curseur, ou à
  // la fin des détails si la note vient de s'ouvrir. Le diagnostic choisi
  // arrive déjà documenté comme problème ou antécédent (__DX_DOCUMENT_AS, lu
  // par runDiagnosticCommand, editor-field.jsx).
  React.useEffect(function() {
    function onSummaryAdd(e) {
      var documentAs = e.detail && e.detail.documentAs;
      if (!documentAs) return;
      var wasOpen = !!editorRef.current;
      if (!wasOpen && onOpen) onOpen();
      var tries = 0;
      (function insertWhenReady() {
        var editor = editorRef.current;
        if (!editor) { if (++tries < 30) setTimeout(insertWhenReady, 50); return; }
        var state = editor.state, $from = state.selection.$from;
        // Paragraphe de premier niveau seulement : une région diagnostic ne se
        // loge pas dans une autre.
        var inText = wasOpen && state.selection.from > 1 && $from.parent.type.name === 'paragraph' && $from.depth === 1;
        var pos = inText ? $from.after($from.depth) : window.endOfFirstSectionPos(state.doc);
        window.__DX_DOCUMENT_AS = documentAs;
        editor.chain().focus()
          .insertContentAt(pos, { type: 'paragraph', content: [{ type: 'text', text: '/dx ' }] })
          .setTextSelection(pos + 5)
          .run();
      })();
    }
    window.addEventListener('note:summary-add', onSummaryAdd);
    return function() { window.removeEventListener('note:summary-add', onSummaryAdd); };
  }, []);

  // Référencer un passage sélectionné dans une note antérieure complétée
  // (sélection + bouton flottant dans NotesList.jsx). Ajouté à la fin de la
  // 1re section — même convention que l'Assistant IA (onAddToNote plus bas).
  React.useEffect(function() {
    function onAddReference(e) {
      var detail = e.detail || {};
      var text = (detail.text || '').trim();
      if (!text) return;
      appendToFirstSection([{ type: 'reference', attrs: { source: detail.source || '', text: text } }]);
    }
    window.addEventListener('note:add-reference', onAddReference);
    return function() { window.removeEventListener('note:add-reference', onAddReference); };
  }, []);

  function deriveLabel(entity) {
    var d = entity.details || {};
    if (entity.type === 'prescription') {
      var head = [d.molecule, d.dose ? d.dose + ' ' + d.unit : ''].filter(Boolean).join(' ');
      var _n = (d.qtyDose && /^\d/.test(String(d.qtyDose))) ? String(d.qtyDose) : (d.form === 'aérosol-doseur' ? '2' : '1');
      var _ab = d.form === 'comprimé' ? 'comp.' : d.form === 'aérosol-doseur' ? 'inh' : d.form === 'gélule' ? 'gél' : d.form === 'capsule' ? 'caps.' : 'dose';
      var qty = _n + ' ' + _ab;
      var _rf = (d.refills === undefined || d.refills === null || String(d.refills) === '') ? '0' : d.refills;
      var tail = [qty, d.route, d.frequency + (d.prn && !/prn/i.test(d.frequency || '') ? ' PRN' : ''), d.duration ? '× ' + d.duration + ' ' + (d.durationUnit || 'jours') : '', 'R' + _rf].filter(Boolean).join(' ');
      return [head, tail].filter(Boolean).join(' — ') || entity.label;
    }
    if (entity.type === 'lab') return d.tests && d.tests[0] ? d.tests.join(', ').slice(0, 40) : entity.label;
    if (entity.type === 'imaging') return [d.modality, d.region].filter(Boolean).join(' ') || entity.label;
    if (entity.type === 'referral') return d.specialty || entity.label;
    if (entity.type === 'problem') return d.name || entity.label;
    if (entity.type === 'instructions') return d.title || entity.label;
    return entity.label;
  }

  function onChipClick(chipId, rect, extra) {
    var entity = editorRef.current ? window.getChipEntity(editorRef.current, chipId) : null;
    // Fichier joint (PDF/PNG/JPG) : panneau de prévisualisation dédié,
    // jamais le ChipPopover générique (son corps était vide pour ce type —
    // rien à y "modifier en détails structurés").
    if (entity && entity.type === 'file') {
      var url = entity.details && entity.details.url;
      if (url) setFilePreview({ name: entity.label || entity.text || 'Document', url: url, kind: window.fileKindFromName(entity.label || entity.text || '') });
      return;
    }
    // Chip transmis : détails en lecture seule, jamais d'édition inline.
    // Chip en attente : ses détails, pour le vérifier avant de l'accepter.
    if (entity && (entity.transmittedAt || entity.pending)) {
      setInlineEdit(null);
      setPopover({ chipId: chipId, anchorRect: rect });
      setLinkedChipId(chipId);
      return;
    }
    // Edit button (···) → open full modal
    if (extra && extra.action === 'modal') {
      setInlineEdit(null);
      setPopover({ chipId: chipId, anchorRect: rect });
      setLinkedChipId(chipId);
      return;
    }
    // Zone click → inline autocomplete editor (prescription, lab, imaging, referral)
    // — seulement si l'édition inline est active (D-02) ; sinon formulaire complet.
    if (extra && extra.field && entity && inlineFieldEdit !== false) {
      var editableTypes = ['prescription', 'lab', 'imaging', 'referral'];
      if (editableTypes.indexOf(entity.type) !== -1) {
        setInlineEdit({ chipId: chipId, field: extra.field, fieldRect: extra.fieldRect || rect });
        setLinkedChipId(chipId);
        return;
      }
    }
    // All other chips → full modal
    setPopover({ chipId: chipId, anchorRect: rect });
    setLinkedChipId(chipId);
  }

  function saveInlineEdit(chipId, field, val) {
    var editor = editorRef.current;
    var entity = editor ? window.getChipEntity(editor, chipId) : null;
    if (!editor || !entity) { setInlineEdit(null); return; }
    var details = Object.assign({}, entity.details || {});
    var type = entity.type;
    if (type === 'prescription') {
      if (field === 'dose') {
        var dm = /^([\d.]+)\s*(mg|g|mcg|µg|mL|unités?|UI)$/i.exec(val.trim());
        if (dm) { details.dose = dm[1]; details.unit = dm[2]; }
        // Non reconnu : on garde le texte tel quel plutôt que de l'effacer
        // silencieusement (ex. « q8h » tapé dans le champ Dose par erreur).
        else if (val.trim()) { details.dose = val.trim(); details.unit = ''; }
      } else if (field === 'frequency') {
        details.frequency = val;
      } else if (field === 'form') {
        var fmMap = {
          '1 co': 'comprimé', '2 co': 'comprimé', '½ co': 'comprimé', '1½ co': 'comprimé', '3 co': 'comprimé', '4 co': 'comprimé',
          '1 gél': 'gélule', '2 gél': 'gélule',
          '1 cap': 'capsule', '2 cap': 'capsule',
          '1 timbre': 'timbre',
          '2 inh': 'aérosol-doseur', '1 inh': 'aérosol-doseur', '4 inh': 'aérosol-doseur',
          '1 vap nasale': 'vaporisateur nasal', '2 vap nasale': 'vaporisateur nasal',
          '1 amp': 'ampoule',
          '5 mL': 'sirop', '10 mL': 'sirop', '15 mL': 'sirop', '20 mL': 'sirop',
          '1 supp': 'suppositoire'
        };
        details.form = fmMap[val] || val;
        // La quantité par prise (« 2 » dans « 2 co ») doit suivre la forme,
        // sinon le chip continue d'afficher « 1 comp. » quelle que soit la
        // valeur choisie — voir deriveLabel/_rxQty (NOTE_DATA).
        var qm = /^([\d.½]+)/.exec(val.trim());
        if (qm) details.qtyDose = qm[1];
      } else if (field === 'route') {
        details.route = val;
      } else if (field === 'duration_refills') {
        var drm = /^(\d+)\s*(jours?|semaines?|mois)(?:\s+R(\d+))?$/i.exec(val.trim());
        if (drm) { details.duration = drm[1]; details.durationUnit = drm[2]; if (drm[3] !== undefined) details.refills = drm[3]; }
        else if (/^long terme/i.test(val)) { details.duration = ''; details.durationUnit = ''; var rm = val.match(/R(\d+)/i); if (rm) details.refills = rm[1]; }
        else if (val.trim()) { details.duration = val.trim(); details.durationUnit = ''; }
      } else if (field === 'duration') {
        if (/^long terme/i.test(val)) { details.duration = ''; details.durationUnit = ''; }
        else {
          var dm2 = /^(\d+)\s*(jours?|semaines?|mois|an|ans|année?s?)?/i.exec(val.trim());
          if (dm2) { details.duration = dm2[1]; if (dm2[2]) details.durationUnit = /an|ann/i.test(dm2[2]) ? 'mois' : dm2[2].replace(/s$/, '') + (/jour|semaine/i.test(dm2[2]) ? 's' : ''); }
          else if (val.trim()) { details.duration = val.trim(); details.durationUnit = ''; }
        }
      } else if (field === 'refills') {
        var rfm = /R?\s*(\d+)/i.exec(val.trim());
        details.refills = rfm ? rfm[1] : '0';
      }
    } else if (type === 'lab' || type === 'imaging' || type === 'referral') {
      if (field === 'priority') {
        details.priority = val;
      } else if (field === 'exam' && type === 'imaging') {
        var examParts = val.split(' ');
        details.modality = examParts[0];
        details.region = examParts.slice(1).join(' ');
      } else if (field === 'specialty' && type === 'referral') {
        details.specialty = val;
      }
    }
    var newEntity = Object.assign({}, entity, { details: details });
    newEntity.label = deriveLabel(newEntity);
    if (newEntity.type === 'prescription' && newEntity.rx) newEntity.rx = window.NOTE_DATA.deriveRx(details, newEntity.rx);
    else if (newEntity.type === 'lab' && newEntity.rx) newEntity.rx = window.NOTE_DATA.deriveLabRx(details);
    else if (newEntity.type === 'imaging' && newEntity.rx) newEntity.rx = window.NOTE_DATA.deriveImgRx(details);
    else if (newEntity.type === 'referral' && newEntity.rx) newEntity.rx = window.NOTE_DATA.deriveRefRx(details);
    window.updateChipEntity(editor, chipId, newEntity);
    setInlineEdit(null);
  }

  // `accept` : ajout en attente vérifié puis accepté depuis ses détails.
  function savePopover(chipId, draft, accept) {
    var ent = Object.assign({}, draft, { label: deriveLabel(draft) });
    if (ent.type === 'prescription' && ent.rx) ent.rx = window.NOTE_DATA.deriveRx(ent.details || {}, ent.rx);
    else if (ent.type === 'lab' && ent.rx) ent.rx = window.NOTE_DATA.deriveLabRx(ent.details || {});
    else if (ent.type === 'imaging' && ent.rx) ent.rx = window.NOTE_DATA.deriveImgRx(ent.details || {});
    else if (ent.type === 'referral' && ent.rx) ent.rx = window.NOTE_DATA.deriveRefRx(ent.details || {});
    if (editorRef.current) window.updateChipEntity(editorRef.current, chipId, ent, accept ? { pending: false } : null);
    setPopover(null);
  }

  function revertChip(chipId) {
    var editor = editorRef.current;
    if (editor) {
      // Même texte que « Garder en texte » et que la note imprimée.
      var txt = window.chipPrintText(window.chipAttrs(editor, chipId));
      var pos = window.findChipPos(editor, chipId);
      if (pos >= 0) editor.chain().focus().deleteRange({ from: pos, to: pos + 1 }).insertContentAt(pos, txt).run();
    }
    setPopover(null);
  }

  function deleteChip(chipId) {
    var editor = editorRef.current;
    if (editor) {
      var pos = window.findChipPos(editor, chipId);
      if (pos >= 0) {
        var end = pos + 1;
        var after = editor.state.doc.textBetween(end, Math.min(end + 1, editor.state.doc.content.size));
        if (after === ' ') end += 1;
        editor.chain().focus().deleteRange({ from: pos, to: end }).run();
      }
    }
    setPopover(null);
  }

  var popoverEntity = popover && editorRef.current ? window.getChipEntity(editorRef.current, popover.chipId) : null;
  var popoverChip = popoverEntity ? { id: popover.chipId, entity: popoverEntity } : null;
  var inlineEditEntity = inlineEdit && editorRef.current ? window.getChipEntity(editorRef.current, inlineEdit.chipId) : null;

  // Handle summary section drops anywhere on the note — insère du texte à
  // puces en fin de première section.
  React.useEffect(function() {
    function handleDragEnter(e) {
      if (!window.__omniSummaryDrag) return;
      e.preventDefault();
      e.stopPropagation();
    }
    function handleDragOver(e) {
      if (!window.__omniSummaryDrag) return;
      e.preventDefault();
      e.stopPropagation();
      try { e.dataTransfer.dropEffect = 'copy'; } catch (er) {}
    }
    function handleDrop(e) {
      if (!window.__omniSummaryDrag) return;
      e.preventDefault();
      e.stopPropagation();
      var payload = window.__omniSummaryDrag;
      window.__omniSummaryDrag = null;
      if (payload) insertSummaryContent(payload);
    }
    var card = noteCardRef.current;
    if (!card) return;
    card.addEventListener('dragenter', handleDragEnter);
    card.addEventListener('dragover', handleDragOver);
    card.addEventListener('drop', handleDrop);
    return function() {
      card.removeEventListener('dragenter', handleDragEnter);
      card.removeEventListener('dragover', handleDragOver);
      card.removeEventListener('drop', handleDrop);
    };
  }, []);

  function insertSummaryContent(payload) {
    var sectionId = payload.sectionId, label = payload.label || '', items = payload.items || [];
    var blocks = [];
    if (label) blocks.push({ type: 'paragraph', content: [{ type: 'text', text: label }] });
    if (items.length === 0) {
      blocks.push({ type: 'paragraph', content: [{ type: 'text', text: '• (aucun élément au dossier)' }] });
    } else {
      items.forEach(function(item) {
        var txt = summaryItemText(sectionId, item);
        blocks.push(txt ? { type: 'paragraph', content: [{ type: 'text', text: '• ' + txt }] } : { type: 'paragraph' });
      });
    }
    appendToFirstSection(blocks);
  }

  function summaryItemText(sectionId, item) {
    if (!item) return '';
    if (sectionId === 'allergies') return item.name || item.left || '';
    if (sectionId === 'habits') return [item.name, item.detail].filter(Boolean).join(' : ');
    var head = item.left || item.name || '';
    var mid = item.mid || item.detail || '';
    var right = item.right || item.date || '';
    var s = head;
    if (mid) s += ' ' + mid;
    if (right) s += ' (' + right + ')';
    return s.trim();
  }

  function handleToolSelect(tool) {
    setPickerOpen(false);
    if (tool.hasTool) insertClinicalTool(tool.id, tool.label);
  }

  function resetNote() {
    initialDocRef.current = null;
    // La superposition n'a de sens que pour LA note en cours d'édition :
    // sans ce nettoyage, une prochaine note vierge repartirait avec les
    // lignes « en attente » de celle qu'on vient de fermer.
    lastDxRef.current = null;
    window.__NOTE_DX_OVERLAY = [];
    window.dispatchEvent(new CustomEvent('note:diagnostics-change', { detail: { threads: [] } }));
    setRaison('');
    setTags([]);
    setShowTags(false);
    setInlineEdit(null);
    setPopover(null);
    setLinkedChipId(null);
    setEpisodeId(null);
    setDocStats({ counts: {}, items: [], diagNames: [], chips: [] });
    setDocJson(null);
    setConfidentialContent('');
    setConfidentialAdded(false);
    setConfidentialWarningOpen(false);
    setConfidentialDeleteOpen(false);
    setTxState({});
    setActionEvents([]);
    setReviewActive(false);
    setReviewChanges([]);
    setReviewPopover(null);
    setReviewGate(false);
  }

  // ----- Points de départ (tweak "Points de départ") -----
  function startFromLast() {
    if (lastNote && lastNote.doc) {
      // rebaseDiagDocForNewNote (diagnostics.jsx) clone le doc (jamais la
      // même référence que la note complétée — appendToFirstSection et
      // insertClinicalTool ci-dessus mutent initialDocRef.current en place
      // avant montage) et relie chaque diagnostic à sa ligne du dossier :
      // cette note-ci n'a pas encore documenté quoi que ce soit, elle ne
      // doit pas prétendre avoir cessé/remplacé ce que la précédente a fait.
      initialDocRef.current = window.rebaseDiagDocForNewNote(lastNote.doc, window.__SOMMAIRE_DX_BASE || window.sommaireDxSeed());
      if (!raison.trim()) setRaison(lastNote.title || '');
    }
    var epId = (lastNote && lastNote.episodeId) || ('ep-' + Date.now());
    setEpisodeId(epId);
    if (onLinkEpisode) onLinkEpisode(epId);
    if (onOpen) onOpen();
  }

  // Sauvegarde un instantané du brouillon SANS toucher à la note en cours
  // d'édition — « Sauvegarder » ne doit pas la fermer ni en effacer le contenu.
  function saveDraft() {
    var id = 'draft-' + Date.now();
    var savedLabel = 'Sauvegardé à ' + new Date().toTimeString().slice(0, 5);
    var doc = window.ensureSplit(editorRef.current ? editorRef.current.getJSON() : (initialDocRef.current || window.DEFAULT_DOC()));
    setDrafts(function(prev) {
      return [{ id: id, savedLabel: savedLabel, raison: raison, doc: doc,
        date: noteDate, time: noteTime, visitType: visitType, tags: tags,
        confidential: confidentialContent || null, actionEvents: actionEvents }].concat(prev);
    });
    if (window.toast) window.toast('Brouillon sauvegardé', { icon: 'check_circle' });
  }

  function continueDraft(id) {
    var draft = drafts.find(function(d) { return d.id === id; });
    if (!draft) return;
    setDrafts(function(prev) { return prev.filter(function(d) { return d.id !== id; }); });
    initialDocRef.current = draft.doc;
    setRaison(draft.raison || '');
    setTags(draft.tags || []);
    if (draft.visitType) setVisitType(draft.visitType);
    if (draft.confidential) { setConfidentialContent(draft.confidential); setConfidentialAdded(true); }
    setActionEvents(draft.actionEvents || []);
    if (onOpen) onOpen();
  }

  function handleStartPick(key, payload) {
    if (key === 'nouvelle') { if (onOpen) onOpen(); return; }
    if (key === 'derniere') { startFromLast(); return; }
    if (key === 'continuer') { continueDraft(payload); return; }
    if (key === 'intelligente') { if (onSmartPick) onSmartPick(); return; }
  }

  // Construit la liste des documents transmissibles réellement présents dans
  // la note (prescriptions, requêtes, consignes patient) pour le checkout de
  // transmission. Contrairement à
  // l'ancien buildCheckoutGroups (qui bundlait tous les chips d'un même type
  // ensemble), seules les prescriptions sont bundlées en un seul document
  // « Ordonnance » ; chaque autre chip (labo/imagerie/référence/consignes)
  // devient son propre document, reflétant le fait que ce sont des requêtes
  // distinctes dans la vraie vie clinique.
  // Documents transmissibles de la note en cours — la logique est partagée
  // avec NotesList (checkout d'une note complétée), voir editor-schema.jsx.
  function buildTransmissionDocs() {
    return window.buildTransmissionDocs(docStats, txState);
  }
  // Met à jour l'état de transmission d'un document (recipients/complete/
  // transmitted/comment) — persiste au niveau de la note tant qu'elle est
  // ouverte, indépendamment de l'ouverture/fermeture de TransmissionModal.
  function patchTxState(id, patch) {
    // Transmission d'un document : ses chips sont marqués transmis et
    // l'événement est gardé, même si le chip quitte la note ensuite.
    // Un document renvoyé (item ajouté après une première transmission) ne
    // marque que ses chips pas encore transmis.
    if (patch && patch.transmitted === true) {
      var sentDoc = buildTransmissionDocs().find(function(d) { return d.id === id; });
      // Tweak « Simuler un échec de transmission » : rien ne part. Les puces
      // du document portent l'échec (icône sur la puce, ligne au checkout) et
      // le document reste « Non transmise ».
      if (simulateTxFailure) {
        if (sentDoc && editorRef.current) window.stampChips(editorRef.current, sentDoc.items.map(function(it) { return it.id; }), { transmitError: 'envoi non reçu par le destinataire (simulé)' });
        patch = Object.assign({}, patch, { transmitted: false });
        if (window.toast) window.toast('Échec de transmission (simulé)', { icon: 'sync_problem' });
      } else if (sentDoc && !sentDoc.transmitted) {
        recordChipEvents(sentDoc.items.map(function(it) { return it.id; }).filter(function(cid) {
          var a = editorRef.current && window.chipAttrs(editorRef.current, cid);
          return a && !a.transmittedAt;
        }), 'transmis');
      }
    }
    setTxState(function(prev) {
      var next = Object.assign({}, prev);
      next[id] = Object.assign({}, next[id], patch);
      return next;
    });
  }

  // Ajoute un événement par chip (instantané de ses attrs) et pose l'attr
  // correspondant sur le chip, hors historique (stampChips).
  function recordChipEvents(cids, type) {
    var editor = editorRef.current;
    if (!editor || !cids.length) return;
    var at = new Date().toISOString();
    var patch = type === 'annule' ? { cancelledAt: at } : { transmittedAt: at, transmitError: null };
    var evs = cids.map(function(cid) {
      var attrs = window.chipAttrs(editor, cid);
      return attrs ? { cid: cid, type: type, at: at, author: window.__CURRENT_AUTHOR || null, snapshot: Object.assign(attrs, patch) } : null;
    }).filter(Boolean);
    if (!evs.length) return;
    window.stampChips(editor, evs.map(function(e) { return e.cid; }), patch);
    setActionEvents(function(prev) { return prev.concat(evs); });
  }

  // Annuler une ordonnance / une requête transmise (menu ⋮ du chip,
  // editor-field.jsx) : action clinique séparée de l'effacement. L'envoi de
  // l'annulation au destinataire est simulé.
  React.useEffect(function() {
    function onCancel(e) {
      var cid = e.detail && e.detail.cid;
      if (!cid) return;
      recordChipEvents([cid], 'annule');
      if (window.toast) window.toast('Annulation envoyée', { icon: 'block' });
    }
    window.addEventListener('note:chip-cancel', onCancel);
    return function() { window.removeEventListener('note:chip-cancel', onCancel); };
  });

  // Marque un document complété en capturant l'empreinte de ses items
  // actuels (`itemIds`) — voir la note sur `stale` dans buildTransmissionDocs :
  // si de nouveaux items sont ajoutés après coup, cette empreinte ne
  // correspondra plus et le document redeviendra « à compléter ».
  function markDocComplete(id) {
    var doc = buildTransmissionDocs().find(function(d) { return d.id === id; });
    if (!doc || doc.blocking.length) return; // item incomplet : rien à compléter
    var idsKey = doc.items.map(function(it) { return it.id; }).sort().join(',');
    patchTxState(id, { complete: true, itemIds: idsKey });
  }

  // Retrouve le document de transmission qui contient un chip donné — pour
  // les prescriptions, plusieurs chips partagent le même document bundlé
  // (« Ordonnance »), d'où la recherche dans `items` en plus de l'id direct.
  function findDocByItemId(cid) {
    var docs = buildTransmissionDocs();
    return docs.find(function(d) {
      return d.id === cid || d.items.some(function(it) { return it.id === cid; });
    }) || null;
  }

  // Icône ➤ de la barre du bas — ouvre le checkout de transmission (bottom
  // sheet), sans présélection particulière.
  function openTransmission(onlyId) {
    setTransmissionOnlyId(onlyId || null);
    setTransmissionOpen(true);
  }

  // Bouton « Compléter » de la barre du bas — ouvre le même checkout de
  // transmission, avec l'item « Note » présélectionné (faire suivre +
  // signature), qui est le point d'entrée par défaut pour compléter la note.
  // Mode révision : des modifications en attente bloquent la complétion —
  // dialogue « Tout accepter et compléter / Réviser / Annuler » plutôt que
  // de laisser un contenu ambigu (non relu) partir au dossier.
  function openFinalize() {
    if (reviewingMode && reviewChanges.length > 0) {
      setReviewGate(true);
      return;
    }
    if (pending.count > 0) {
      setPendingGate(true);
      return;
    }
    openTransmission(window.TX_NOTE_ITEM_ID);
  }

  // Ajouts en attente (gabarit) — barre au-dessus du corps de la note et
  // dialogue de finalisation.
  var pending = docJson ? window.pendingSummary(docJson) : { count: 0, chips: 0, paragraphs: 0, sources: [] };
  function resolvePending(accept) { if (editorRef.current) window.resolveAllPending(editorRef.current, accept); }
  function reviewFirstPending() {
    var editor = editorRef.current;
    if (!editor) return;
    var first = null;
    editor.state.doc.descendants(function(node, pos) {
      if (first !== null) return false;
      if (node.type.name === 'chip' && node.attrs.pending) first = pos;
      else if (node.isText && node.marks.some(function(m) { return m.type.name === 'insertion' && m.attrs.authorId === window.TEMPLATE_AUTHOR.id; })) first = pos;
    });
    if (first === null) return;
    var node = editor.state.doc.nodeAt(first);
    if (node && node.type.name === 'chip') editor.chain().focus().setNodeSelection(first).run();
    else editor.chain().focus().setTextSelection(first).run();
    try { editor.view.domAtPos(first).node.parentElement.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) {}
  }

  function reviewGateAcceptAllAndComplete() {
    if (editorRef.current) window.acceptAllChanges(editorRef.current);
    setReviewGate(false);
    openTransmission(window.TX_NOTE_ITEM_ID);
  }

  function reviewGateReview() {
    setReviewGate(false);
    var editor = editorRef.current;
    if (!editor) return;
    var first = window.scanReviewChanges(editor.state.doc)[0];
    if (first) {
      editor.chain().focus().setTextSelection(first.from).run();
      try { editor.view.dom.querySelector('.rvw-ins, .rvw-del').scrollIntoView({ block: 'center' }); } catch (e) {}
    }
  }

  // « Prescrire »/« Transmettre » sur une chip — envoi rapide d'UN document,
  // sans ouvrir toute la vue de transmission.
  function openQuickSend(cid) {
    setQuickSendCid(cid);
  }

  // Finalisation réelle, déclenchée par la confirmation de l'item Note dans
  // TransmissionModal (NoteActionPanel) :
  // la note est sauvée et envoyée dans la liste.
  function finalizeComplete() {
    // Un ajout proposé par un gabarit et jamais accepté n'entre pas dans la note complétée.
    // Refus implicite de ce qui reste en attente (le dialogue de finalisation
    // l'a annoncé) : puces et texte proposés n'entrent pas dans la note.
    var doc = window.resolvePendingInDoc(window.ensureSplit(editorRef.current ? editorRef.current.getJSON() : (initialDocRef.current || window.DEFAULT_DOC())), false);
    var stats = window.scanDoc(doc);
    var data = {
      raison: raison,
      date: noteDate,
      time: noteTime,
      visitType: visitType,
      tags: tags,
      diagnostics: stats.diagNames,
      doc: doc,
      episodeId: episodeId,
      // Hors du doc Tiptap par conception (voir déclaration de l'état plus
      // haut) — persisté séparément pour que la note complétée garde le
      // champ, mais jamais lu par PrintDialog ni par un rendu « autre
      // intervenant » qui ne reçoit que `doc`.
      confidential: confidentialContent || null,
      // État de transmission au moment de la complétion : c'est lui qui permet
      // de rouvrir le checkout d'une note passée depuis le Journal (bouton
      // « Checkout » de NotesList) avec ses destinataires et ses statuts, au
      // lieu d'un checkout vierge reconstruit depuis le seul contenu.
      txState: txState,
      // Ce qui a été transmis ou annulé, y compris des chips retirés de la note.
      actionEvents: actionEvents,
      // Regroupement des requêtes au moment de la complétion : les ids des
      // documents de txState en dépendent (« lab » ou l'id de la puce).
      groupRequests: !!groupRequests,
    };
    // Fusion définitive dans le dossier (Summary.jsx) — après ça, la ligne
    // n'est plus « en attente » : Cesser devient résolu à la date DE LA NOTE
    // (pas celle du clic, une note peut être antidatée), un Remplacer
    // renomme la ligne d'origine. Doit précéder resetNote() : la ligne
    // ci-dessous vide docStats/docJson, dont stats.diagThreads dépend.
    window.dispatchEvent(new CustomEvent('note:diagnostics-commit', {
      detail: { threads: stats.diagThreads, today: window.fmtSommaireDate(noteDate ? new Date(noteDate + 'T12:00') : new Date()) }
    }));
    resetNote();
    if (onComplete) onComplete(data);
  }

  React.useEffect(function() {
    if (completeRef) completeRef.current = openFinalize;
    if (saveDraftRef) saveDraftRef.current = saveDraft;
    // « Prescrire » / « Transmettre » sur un chip ouvre l'envoi rapide,
    // restreint à ce document (voir QuickSendModal).
    function onOpenCheckout(e) { openQuickSend(e && e.detail && e.detail.cid); }
    window.addEventListener('note:open-checkout', onOpenCheckout);
    return function() { window.removeEventListener('note:open-checkout', onOpenCheckout); };
  });

  return (
    <div ref={noteCardRef} className="note-card" style={neStyles.card}>
      <div style={neStyles.topRow}>
        <div>
          <div style={neStyles.overline}>{(institution || 'Clinique du Centre-ville').toUpperCase()}</div>
          <div style={neStyles.titleRow}>
            <span style={neStyles.title}>Note Clinique</span>
            {smartActive && <span style={neStyles.statusBadge}>En cours</span>}
          </div>
        </div>
        <div style={{ flex: 1 }} />
        {reviewingMode &&
          <window.ReviewHeaderControls
            active={reviewActive}
            onToggle={function() { setReviewActive(function(v) { return !v; }); }}
            count={reviewChanges.length}
            onAcceptAll={function() { if (editorRef.current) window.acceptAllChanges(editorRef.current); }}
            onRejectAll={function() { if (editorRef.current) window.rejectAllChanges(editorRef.current); }} />}
        {smartActive
          ? (
            <div style={neStyles.assistRow}>
              <span style={neStyles.assistChip}>
                <span className="material-icons" style={{ fontSize: 20, color: 'var(--mat-sys-primary)' }}>check</span>
                Rédaction assistée
              </span>
            </div>
          )
          : null
        }
      </div>

      {/* Points de départ — tweak "Points de départ", masqués une fois la note ouverte */}
      {startPoints && !isOpen &&
        <div style={{ marginBottom: 20 }}>
          <NoteStartCards
            onPick={handleStartPick}
            hasLastNote={!!(lastNote && lastNote.doc)}
            drafts={drafts} />
        </div>}

      {/* Fields */}
      <div style={neStyles.fieldsRow}>
        <FloatField label="Raison de consultation" flex input value={raison} onValueChange={function(v) { setRaison(v); if (onOpen) onOpen(); }} onFocus={function() { if (onOpen) onOpen(); }} />
        {/* Date, heure et type restent groupés : quand la carte est trop étroite
            (≈ 760 px dans l'app), le groupe passe sous la raison de consultation
            au lieu d'écraser le sélecteur de type. */}
        <div style={neStyles.fieldsGroup}>
          <DsDateField label="Date" width={190} value={noteDate} onChange={setNoteDate} />
          <DsTimeField label="Heure" width={140} value={noteTime} onChange={setNoteTime} />
          <FloatField label="Type de visite" width={230} grow select value={visitType} onValueChange={setVisitType} options={['Visite en clinique', 'Appel téléphonique', 'Mise à jour']} />
        </div>
        <button
          type="button"
          title={showTags ? "Masquer les étiquettes" : "Ajouter des étiquettes"}
          aria-label={showTags ? "Masquer les étiquettes" : "Ajouter des étiquettes"}
          aria-pressed={showTags}
          onClick={function() { setShowTags(function(v) { return !v; }); }}
          style={Object.assign({}, neStyles.tagToggle, showTags ? neStyles.tagToggleOn : {})}>
          <span className="material-icons-outlined" style={{ fontSize: 22 }}>sell</span>
        </button>
      </div>

      {/* Étiquettes */}
      {showTags && <TagInput tags={tags} onChange={setTags} />}

      {/* Assistant IA */}
      <AIBox onAddToNote={function(text) {
        var blocks = (text || '').split('\n').map(function(line) {
          return line ? { type: 'paragraph', content: [{ type: 'text', text: line }] } : { type: 'paragraph' };
        });
        // Mode révision : le texte IA arrive marqué "Assistant IA" et
        // active le mode (s'il ne l'était pas déjà) — tout ce qui suit,
        // y compris les retouches du médecin, reste tracké jusqu'à
        // désactivation ou résolution complète (exigence produit).
        if (reviewingMode) {
          setReviewActive(true);
          blocks = window.markBlocksAsInsertion(blocks, window.REVIEW_AI_AUTHOR);
        }
        // Tweak « IA : éléments structurés proposés » (piste de vision, D-03) :
        // l'assistant propose aussi des puces, en attente comme celles d'un
        // gabarit — rien n'est créé avant d'être accepté.
        if (aiProposals) {
          var chips = window.NOTE_DATA.AI_SAMPLE_PROPOSALS.map(function(p) { return window.buildPendingChipNode(p, 'Assistant IA'); }).filter(Boolean);
          // Pas de libellé en texte : il resterait seul si tout est refusé ; la
          // puce dit elle-même qui la propose (infobulle, style « IA »).
          var inline = [];
          chips.forEach(function(c, i) { if (i) inline.push({ type: 'text', text: ' ' }); inline.push(c); });
          if (chips.length) blocks = blocks.concat([{ type: 'paragraph', content: inline }]);
        }
        appendToFirstSection(blocks);
      }} />

      {/* Expanding content */}
      {isOpen &&
        <div style={{ marginTop: 20, animation: 'note-expand 300ms ease-in-out' }}>

          {/* Position de la barre (tweak "Position de la barre") : "haut" la
              place avant le cadre de la note (comportement d'origine), "bas"
              la déplace après — le cadre (noteDiv) continue d'entourer
              uniquement le corps éditable dans les deux cas. */}
          {ftBarStyle === 'haut' && ftBarPosition !== 'bas' && <NoteRichTextToolbar editor={editorInstance} />}

          <div style={neStyles.noteDiv} />

          {pending.count > 0 &&
            <window.PendingProposalsBar
              summary={pending}
              onAcceptAll={function() { resolvePending(true); }}
              onRejectAll={function() { resolvePending(false); }}
              onReview={reviewFirstPending} />}

          <NoteBody
            placeholder="Appuyer sur « / » pour afficher les commandes"
            initialDoc={initialDocRef.current}
            onReady={handleEditorReady}
            onDocChange={handleDocChange}
            onChipClick={onChipClick}
            linkedChipId={linkedChipId} />

          <div style={neStyles.noteDiv} />

          {ftBarStyle === 'haut' && ftBarPosition === 'bas' && <NoteRichTextToolbar editor={editorInstance} />}

          <div className="ct-default-zone">
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={neStyles.chipsRow}>
                {showClinicalTools
                  ? <button
                      className="ct-toolsbtn"
                      title="Outils cliniques"
                      style={pickerOpen ? { background: 'var(--mat-sys-secondary-container)', color: 'var(--mat-sys-on-secondary-container)' } : undefined}
                      onClick={function(e) {
                        var r = e.currentTarget.getBoundingClientRect();
                        if (pickerOpen) { setPickerOpen(false); } else { setPickerAnchor(r); setPickerOpen(true); }
                      }}>
                      <span className="material-icons-outlined">handyman</span>
                    </button>
                  : null}
                {[
                  { label: 'Assurance privée' },
                  { label: 'Cardiologie' },
                  { label: 'CNESST' },
                  { label: 'Examen physique - Version courte', toolId: 'exam-court' }
                ].map(function(chip) {
                  return (
                    <button key={chip.label} className="ct-chip"
                      onClick={chip.toolId
                        ? function() { handleToolSelect({ id: chip.toolId, label: chip.label, hasTool: true }); }
                        : undefined}>
                      <span className="material-icons-outlined">description</span>
                      {chip.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Créé via l'item « Champ confidentiel » du menu « + » (voir
              note:confidential-field-request) — une fois ajouté, reste
              affiché tant qu'il n'est pas supprimé (icône corbeille
              ci-dessous), pas de repli/dépli. */}
          {confidentialAdded &&
            <div className="confidential-field">
              <div className="confidential-field__head">
                <span className="material-icons-outlined">lock</span>
                <span className="confidential-field__label">Champs confidentiel</span>
                <button type="button" className="confidential-field__delete-btn"
                  title="Supprimer le champ confidentiel"
                  onClick={function () { setConfidentialDeleteOpen(true); }}>
                  <span className="material-icons-outlined">delete</span>
                </button>
              </div>
              <textarea
                className="confidential-field__input"
                autoFocus
                placeholder="Documenter le champ confidentiel"
                value={confidentialContent}
                onChange={function (e) { setConfidentialContent(e.target.value); }} />
            </div>
          }

          <ActionLog docJson={docJson} events={actionEvents} editor={editorInstance} />
        </div>
      }

      {/* Avertissement à la création du champ confidentiel — un seul palier,
          jamais réaffiché ensuite (il n'y en a qu'un par note). */}
      {confidentialWarningOpen &&
        <div className="confidential-modal-backdrop" onMouseDown={function () { setConfidentialWarningOpen(false); }}>
          <div className="confidential-modal" onMouseDown={function (e) { e.stopPropagation(); }}>
            <div className="confidential-modal__title">
              <span className="material-icons-outlined">lock</span>
              <span className="confidential-modal__title-text">Note confidentielle</span>
              <button type="button" className="confidential-modal__close" onClick={function () { setConfidentialWarningOpen(false); }}>
                <span className="material-icons-outlined">close</span>
              </button>
            </div>
            <div className="confidential-modal__body">
              <p className="confidential-modal__headline">Voulez-vraiment écrire une note confidentielle?</p>
              <p>Le contenu du champs de note confidentielle sera uniquement visible par son auteur. Les informations ajoutées ne devraient pas entraver une décision clinique ou un diagnostique par un.e autre praticien.ne concernant ce patient.</p>
            </div>
            <div className="confidential-modal__actions">
              <button type="button" className="confidential-modal__btn-text" onClick={function () { setConfidentialWarningOpen(false); }}>Annuler</button>
              <button type="button" className="confidential-modal__btn-primary" onClick={function () {
                setConfidentialAdded(true);
                setConfidentialWarningOpen(false);
              }}>Écrire</button>
            </div>
          </div>
        </div>
      }

      {/* Suppression du champ confidentiel — irréversible (contenu perdu),
          donc confirmation dédiée plutôt qu'un simple clic sur la corbeille. */}
      {confidentialDeleteOpen &&
        <div className="confidential-modal-backdrop" onMouseDown={function () { setConfidentialDeleteOpen(false); }}>
          <div className="confidential-modal" onMouseDown={function (e) { e.stopPropagation(); }}>
            <div className="confidential-modal__title">
              <span className="material-icons-outlined">lock</span>
              <span className="confidential-modal__title-text">Supprimer le champ confidentiel?</span>
              <button type="button" className="confidential-modal__close" onClick={function () { setConfidentialDeleteOpen(false); }}>
                <span className="material-icons-outlined">close</span>
              </button>
            </div>
            <div className="confidential-modal__body">
              <p>Le contenu rédigé sera définitivement perdu.</p>
            </div>
            <div className="confidential-modal__actions">
              <button type="button" className="confidential-modal__btn-text" onClick={function () { setConfidentialDeleteOpen(false); }}>Annuler</button>
              <button type="button" className="confidential-modal__btn-danger" onClick={function () {
                setConfidentialContent('');
                setConfidentialAdded(false);
                setConfidentialDeleteOpen(false);
              }}>Supprimer</button>
            </div>
          </div>
        </div>
      }

      {/* Clinical tool picker */}
      {pickerOpen &&
        <ClinicalToolPicker
          anchorRect={pickerAnchor}
          onClose={function() { setPickerOpen(false); }}
          onBack={function() {
            setPickerOpen(false);
            window.dispatchEvent(new CustomEvent('ct-addmenu-open'));
          }}
          onSelect={handleToolSelect} />
      }

      {/* Transmission des documents (checkout) — bottom sheet, point d'entrée
          par défaut de « Compléter » (item Note présélectionné). */}
      {transmissionOpen &&
        <TransmissionModal
          docs={buildTransmissionDocs()}
          onPatch={patchTxState}
          onComplete={markDocComplete}
          doctorName={doctorName}
          institution={institution}
          initialSelectedId={transmissionOnlyId}
          showSuggestions={checkoutSuggestions}
          noteInfo={{ title: (raison && raison.trim()) || 'Note clinique', date: noteDate, time: noteTime, visitType: visitType }}
          onFinalizeNote={function() { finalizeComplete(); }}
          onPatchArchivedNote={onPatchArchivedTx}
          onClose={function() { setTransmissionOpen(false); setTransmissionOnlyId(null); }} />
      }

      {/* Envoi rapide d'un document individuel (« Prescrire »/« Transmettre »
          sur une chip) — dialogue léger, voir QuickSendModal.jsx. */}
      {quickSendCid &&
        <QuickSendModal
          doc={findDocByItemId(quickSendCid)}
          doctorName={doctorName}
          institution={institution}
          showSuggestions={checkoutSuggestions}
          onPatch={patchTxState}
          onComplete={markDocComplete}
          onCancel={function() { setQuickSendCid(null); }}
          onOpenFull={function() {
            var d = findDocByItemId(quickSendCid);
            setQuickSendCid(null);
            openTransmission(d ? d.id : null);
          }} />
      }

      {/* Aperçu d'un fichier joint (PDF/PNG/JPG) — side sheet dédié */}
      {filePreview &&
        <window.DocumentViewerModal file={filePreview} onClose={function () { setFilePreview(null); }} />
      }

      {/* Dialogue bloquant — changements en attente à la complétion */}
      {pendingGate &&
        <window.PendingCompleteDialog
          summary={pending}
          onAcceptAllAndComplete={function() { resolvePending(true); setPendingGate(false); openTransmission(window.TX_NOTE_ITEM_ID); }}
          onReview={function() { setPendingGate(false); reviewFirstPending(); }}
          onCompleteWithout={function() { resolvePending(false); setPendingGate(false); openTransmission(window.TX_NOTE_ITEM_ID); }}
          onCancel={function() { setPendingGate(false); }} />
      }

      {reviewGate &&
        <window.ReviewCompleteDialog
          count={reviewChanges.length}
          onAcceptAllAndComplete={reviewGateAcceptAllAndComplete}
          onReview={reviewGateReview}
          onCancel={function() { setReviewGate(false); }} />
      }

      {/* Popover de changement (mode révision) */}
      {reviewPopover &&
        <window.ReviewChangePopover
          change={reviewPopover.change}
          anchorRect={reviewPopover.anchorRect}
          onClose={function() { setReviewPopover(null); }}
          onAccept={function(c) { if (editorRef.current) window.acceptChange(editorRef.current, c); }}
          onReject={function(c) { if (editorRef.current) window.rejectChange(editorRef.current, c); }} />
      }

      {/* Chip popover */}
      {popoverChip &&
        <ChipPopover
          chip={popoverChip}
          readOnly={!!popoverChip.entity.transmittedAt}
          pending={!!popoverChip.entity.pending}
          openMode={formOpenMode}
          onReject={function(id) { if (editorRef.current) window.rejectPendingChip(editorRef.current, id); setPopover(null); setLinkedChipId(null); }}
          anchorRect={popover.anchorRect}
          onClose={function() { setPopover(null); setLinkedChipId(null); }}
          onSave={savePopover}
          onRevert={revertChip}
          onDelete={deleteChip} />
      }

      {/* Inline field editor (click on chip zone) */}
      {inlineEdit && inlineEditEntity &&
        <ChipInlineEditor
          chipId={inlineEdit.chipId}
          field={inlineEdit.field}
          fieldRect={inlineEdit.fieldRect}
          entity={inlineEditEntity}
          onSave={saveInlineEdit}
          onClose={function() { setInlineEdit(null); }} />
      }
    </div>
  );
}

// ---------------------------------------------------------
// ChipInlineEditor — autocomplete dropdown for a specific Rx chip field
// ---------------------------------------------------------
function ChipInlineEditor({ chipId, field, fieldRect, entity, onSave, onClose }) {
  var details = (entity && entity.details) || {};

  var initialVal = '';
  if (field === 'dose') initialVal = (details.dose || '') + (details.unit || '');
  else if (field === 'frequency') initialVal = details.frequency || '';
  else if (field === 'form') {
    initialVal = details.form === 'comprimé' ? '1 co' : details.form === 'aérosol-doseur' ? '2 inh' : details.form === 'gélule' ? '1 gél' : details.form || '';
  } else if (field === 'route') {
    initialVal = details.route || '';
  } else if (field === 'duration_refills') {
    var dp0 = [];
    if (details.duration) dp0.push(details.duration + ' ' + (details.durationUnit || 'jours'));
    if (details.refills) dp0.push('R' + details.refills);
    initialVal = dp0.join(' ');
  } else if (field === 'duration') {
    initialVal = details.duration ? (details.duration + ' ' + (details.durationUnit || 'jours')) : '';
  } else if (field === 'refills') {
    initialVal = 'R' + (details.refills != null ? details.refills : '0');
  } else if (field === 'priority') {
    initialVal = details.priority || 'Routine';
  } else if (field === 'exam') {
    initialVal = [details.modality, details.region].filter(Boolean).join(' ');
  } else if (field === 'specialty') {
    initialVal = details.specialty || '';
  }

  var ALL_SUGGESTIONS = {
    dose: [
      '0.5mg', '1mg', '2mg', '2.5mg', '5mg', '7.5mg', '10mg', '12.5mg', '15mg', '20mg',
      '25mg', '30mg', '37.5mg', '40mg', '50mg', '60mg', '75mg', '80mg', '100mg', '125mg',
      '150mg', '160mg', '200mg', '250mg', '300mg', '400mg', '500mg', '600mg', '750mg', '800mg',
      '1g', '1.5g', '2g', '3g', '4g',
      '25mcg', '50mcg', '75mcg', '100mcg', '125mcg', '150mcg', '175mcg', '200mcg',
      '1000UI', '2000UI', '5000UI', '10000UI',
      '5mL', '10mL', '15mL', '20mL', '30mL'
    ],
    // Mêmes listes que le formulaire (FIELD_OPTIONS, editor-data.jsx — D-04).
    frequency: window.NOTE_DATA.FIELD_OPTIONS.frequency,
    form: [
      '1 co', '2 co', '½ co', '1½ co', '3 co', '4 co',
      '1 gél', '2 gél',
      '1 cap', '2 cap',
      '1 timbre',
      '2 inh', '1 inh', '4 inh',
      '1 vap nasale', '2 vap nasale',
      '1 amp',
      '5 mL', '10 mL', '15 mL', '20 mL',
      '1 supp',
      'Appliquer localement'
    ],
    route: window.NOTE_DATA.FIELD_OPTIONS.route,
    duration_refills: [
      '3 jours R0', '5 jours R0', '7 jours R0', '10 jours R0', '14 jours R0',
      '21 jours R0', '28 jours R0',
      '30 jours R0', '30 jours R1', '30 jours R2', '30 jours R3',
      '30 jours R5', '30 jours R11',
      '60 jours R0', '60 jours R5',
      '90 jours R0', '90 jours R3', '90 jours R11',
      '6 mois R1', '1 an R0',
      'Long terme R0', 'Long terme R3', 'Long terme R11'
    ],
    duration: [
      '3 jours', '5 jours', '7 jours', '10 jours', '14 jours', '21 jours', '28 jours',
      '30 jours', '60 jours', '90 jours', '6 mois', '1 an', 'Long terme'
    ],
    refills: window.NOTE_DATA.FIELD_OPTIONS.refills.map(function(r) { return 'R' + r; }),
    priority: window.NOTE_DATA.FIELD_OPTIONS.priority,
    exam: [
      'Radiographie Thorax', 'Radiographie Genou', 'Radiographie Hanche',
      'Radiographie Cheville', 'Radiographie Poignet', 'Radiographie Colonne',
      'Échographie Abdomen', 'Échographie Pelvis', 'Échographie Thyroïde',
      'Échographie Sein', 'Échographie Carotides', 'Échographie Membres inférieurs',
      'TDM Cerveau', 'TDM Thorax', 'TDM Abdomen-Pelvis', 'TDM Sinus',
      'IRM Cerveau', 'IRM Rachis cervical', 'IRM Rachis lombaire',
      'IRM Genou', 'IRM Épaule', 'IRM Cheville',
      'Mammographie Bilatérale'
    ],
    specialty: window.NOTE_DATA.FIELD_OPTIONS.specialty
  };
  var FIELD_LABELS = {
    dose: 'Dose', frequency: 'Fréquence', form: 'Forme', route: 'Voie', duration_refills: 'Durée / Renouvellements',
    duration: 'Durée', refills: 'Renouvellement',
    priority: 'Priorité', exam: 'Examen', specialty: 'Spécialité'
  };

  var _q = React.useState(initialVal); var query = _q[0]; var setQuery = _q[1];
  var _ai = React.useState(0); var activeIdx = _ai[0]; var setActiveIdx = _ai[1];
  var inputRef = React.useRef(null);

  var suggestions = (ALL_SUGGESTIONS[field] || []).filter(function(s) {
    return !query || s.toLowerCase().includes(query.toLowerCase());
  });

  React.useEffect(function() { if (inputRef.current) inputRef.current.select(); }, []);
  // Sous le champ, ou au-dessus s'il n'y a pas la place (placePopover, mode 'flip').
  React.useLayoutEffect(function() {
    var el = document.getElementById('chip-inline-editor');
    if (!el || !window.placePopover) return;
    el.style.overflowY = 'auto';
    window.placePopover(el, fieldRect, { mode: 'flip' });
  });

  React.useEffect(function() {
    function onDown(e) {
      var el = document.getElementById('chip-inline-editor');
      if (el && !el.contains(e.target)) onClose();
    }
    document.addEventListener('mousedown', onDown, true);
    return function() { document.removeEventListener('mousedown', onDown, true); };
  }, [onClose]);

  function handleSelect(val) { onSave(chipId, field, val); }

  var edLeft = Math.max(8, Math.min(fieldRect.left, window.innerWidth - 280));
  var edTop = fieldRect.bottom + 6;

  return React.createElement('div', {
    id: 'chip-inline-editor',
    style: {
      position: 'fixed', top: edTop, left: edLeft, width: 260, zIndex: 85,
      background: 'var(--mat-sys-surface-container-low)', borderRadius: 'var(--mat-sys-corner-small)',
      boxShadow: 'var(--mat-sys-level3)', overflow: 'hidden',
      fontFamily: 'var(--font-mat-sys-plain-family)'
    }
  },
    React.createElement('div', { style: { padding: '7px 12px 6px', borderBottom: '1px solid var(--mat-sys-outline-variant)', display: 'flex', alignItems: 'center', gap: 8 } },
      React.createElement('span', { style: { font: 'var(--mat-sys-label-medium)', letterSpacing: 'var(--mat-sys-label-medium-tracking)', color: 'var(--mat-sys-primary)', textTransform: 'uppercase', flexShrink: 0 } }, FIELD_LABELS[field] || field),
      React.createElement('input', {
        ref: inputRef,
        value: query,
        onChange: function(e) { setQuery(e.target.value); setActiveIdx(0); },
        onKeyDown: function(e) {
          if (e.key === 'Escape') { e.preventDefault(); onClose(); }
          else if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(function(i) { return Math.min(suggestions.length - 1, i + 1); }); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(function(i) { return Math.max(0, i - 1); }); }
          else if (e.key === 'Enter') { e.preventDefault(); if (suggestions[activeIdx]) handleSelect(suggestions[activeIdx]); else if (query.trim()) handleSelect(query.trim()); }
        },
        placeholder: 'Rechercher…',
        style: { flex: 1, border: 'none', outline: 'none', font: 'var(--mat-sys-body-medium)', color: 'var(--mat-sys-on-surface)', background: 'transparent' }
      })
    ),
    React.createElement('div', { style: { maxHeight: 224, overflowY: 'auto', padding: '4px 0' } },
      suggestions.length === 0
        ? React.createElement('div', { style: { padding: 'var(--ds-spacing-12)', font: 'var(--mat-sys-body-medium)', color: 'var(--mat-sys-on-surface-variant)' } }, 'Aucune suggestion')
        : suggestions.map(function(s, i) {
            var isActive = i === activeIdx;
            return React.createElement('div', {
              key: s,
              onMouseEnter: function() { setActiveIdx(i); },
              onMouseDown: function(e) { e.preventDefault(); handleSelect(s); },
              style: {
                padding: 'var(--ds-spacing-xs) var(--ds-spacing-12)', cursor: 'pointer', font: 'var(--mat-sys-body-medium)',
                color: isActive ? 'var(--mat-sys-on-primary)' : 'var(--mat-sys-on-surface)',
                background: isActive ? 'var(--mat-sys-primary)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }
            },
              s,
              isActive ? React.createElement('span', { style: { fontSize: 11, opacity: 0.7 } }, '↵') : null
            );
          })
    )
  );
}

function FloatField({ label, children, width, flex, grow, error, input, type, select, options, value: controlledValue, onValueChange, onFocus: onFocusProp }) {
  const [focused, setFocused] = React.useState(false);
  const [internalValue, setInternalValue] = React.useState('');
  const value = controlledValue !== undefined ? controlledValue : internalValue;
  const isBuiltIn = input || select;
  const alwaysFloated = type === 'date' || type === 'time' || select;
  const floated = !isBuiltIn || alwaysFloated || focused || (value && value.length > 0);

  function handleChange(e) {
    const v = e.target.value;
    if (controlledValue === undefined) setInternalValue(v);
    if (onValueChange) onValueChange(v);
  }

  return (
    <div style={{
      ...neFieldStyles.wrap,
      ...(flex ? { flex: '3 1 240px', minWidth: 200 } : grow ? { flex: '1 1 ' + width + 'px', minWidth: width } : { width, flexShrink: 0 }),
      ...(error ? { border: '1px solid var(--mat-sys-error)' } : {}),
      ...(isBuiltIn && focused ? neFieldStyles.wrapFocused : {})
    }}>
      {label &&
      <span style={{
        ...neFieldStyles.label,
        ...(floated ? neFieldStyles.labelFloating : neFieldStyles.labelResting),
        ...(isBuiltIn && focused ? { color: 'var(--mat-sys-primary)' } : {})
      }}>{label}</span>}
      <div style={neFieldStyles.inner}>
        {select ? (
          <React.Fragment>
            <select
              style={{ ...neFieldStyles.input, cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none' }}
              value={value}
              onChange={handleChange}
              onFocus={function() { setFocused(true); }}
              onBlur={function() { setFocused(false); }}>
              {(options || []).map(function(o) { return <option key={o} value={o}>{o}</option>; })}
            </select>
            <span className="material-icons-outlined" style={neStyles.fieldIcon}>arrow_drop_down</span>
          </React.Fragment>
        ) : input ? (
          <input
            style={neFieldStyles.input}
            type={type || 'text'}
            value={value}
            onChange={handleChange}
            onFocus={function() { setFocused(true); if (onFocusProp) onFocusProp(); }}
            onBlur={function() { setFocused(false); }} />
        ) : children}
      </div>
    </div>);
}

// ─── Sélecteurs date / heure DS3 ────────────────────────────────────────────
// Équivalents prototype de MatDatepicker / MatTimepicker : champ texte (saisie
// clavier) + bouton d'ouverture + panneau (container-low, élévation 5). Format
// FR — « 28 sept. 2026 », « 15:35 » (24 h) — indépendant de la locale du
// navigateur. Les valeurs restent 'AAAA-MM-JJ' et 'HH:MM' pour le reste de l'app.
function pad2(n) { return String(n).padStart(2, '0'); }
function isoOf(y, m, d) { return y + '-' + pad2(m + 1) + '-' + pad2(d); }
function localIsoDate(dt) { return isoOf(dt.getFullYear(), dt.getMonth(), dt.getDate()); }
function parseIso(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
  return m ? { y: +m[1], m: +m[2] - 1, d: +m[3] } : null;
}
function isRealDate(y, m, d) {
  const dt = new Date(y, m, d);
  return dt.getFullYear() === y && dt.getMonth() === m && dt.getDate() === d;
}
function fmtDateFr(iso) {
  const p = parseIso(iso);
  return p ? new Intl.DateTimeFormat('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(p.y, p.m, p.d)) : '';
}
// Accepte 2026-09-28, 28/09/2026, 28-9-2026 ; null si invalide.
function parseDateInput(text) {
  const t = (text || '').trim();
  let y, m, d, r;
  if ((r = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(t))) { y = +r[1]; m = +r[2] - 1; d = +r[3]; }
  else if ((r = /^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/.exec(t))) { d = +r[1]; m = +r[2] - 1; y = +r[3]; }
  else return null;
  return isRealDate(y, m, d) ? isoOf(y, m, d) : null;
}
// Accepte 15:35, 15h35, 1535, 3:35 pm, 9 ; null si invalide.
function parseTimeInput(text) {
  const t = (text || '').trim().toLowerCase().replace(/\s+/g, '').replace(/\./g, '');
  let r = /^(\d{1,2})(?:[:h](\d{2})?)?(am|pm)?$/.exec(t);
  let h, mi, ap;
  if (r) { h = +r[1]; mi = r[2] ? +r[2] : 0; ap = r[3]; }
  else if ((r = /^(\d{2})(\d{2})(am|pm)?$/.exec(t))) { h = +r[1]; mi = +r[2]; ap = r[3]; }
  else return null;
  if (ap) { if (h < 1 || h > 12) return null; h = (h % 12) + (ap === 'pm' ? 12 : 0); }
  if (h > 23 || mi > 59) return null;
  return pad2(h) + ':' + pad2(mi);
}

function PickerField({ label, width, value, format, parse, onCommit, icon, toggleLabel, children }) {
  const [open, setOpen] = React.useState(false);
  const [focused, setFocused] = React.useState(false);
  const [draft, setDraft] = React.useState(null);
  const wrapRef = React.useRef(null);
  const toggleRef = React.useRef(null);
  const inputId = React.useId();

  React.useEffect(function() {
    if (!open) return undefined;
    function onDown(e) { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', onDown);
    return function() { document.removeEventListener('mousedown', onDown); };
  }, [open]);

  function commit() {
    if (draft === null) return;
    const v = parse(draft);
    if (v && v !== value) onCommit(v);
    setDraft(null);
  }
  function close(refocus) {
    setOpen(false);
    if (refocus && toggleRef.current) toggleRef.current.focus();
  }
  function choose(v) { onCommit(v); setDraft(null); close(true); }

  return (
    <div
      ref={wrapRef}
      style={{ ...neFieldStyles.wrap, width, flexShrink: 0, ...(focused || open ? neFieldStyles.wrapFocused : {}) }}
      onFocus={function() { setFocused(true); }}
      onBlur={function(e) { if (!wrapRef.current.contains(e.relatedTarget)) setFocused(false); }}>
      <label htmlFor={inputId} style={{ ...neFieldStyles.label, ...neFieldStyles.labelFloating, ...(focused || open ? { color: 'var(--mat-sys-primary)' } : {}) }}>{label}</label>
      <div style={neFieldStyles.inner}>
        <input
          id={inputId}
          type="text"
          autoComplete="off"
          style={neFieldStyles.input}
          value={draft !== null ? draft : format(value)}
          onChange={function(e) { setDraft(e.target.value); }}
          onFocus={function(e) { setDraft(format(value)); e.target.select(); }}
          onBlur={commit}
          onKeyDown={function(e) {
            if (e.key === 'Enter') { commit(); }
            else if (e.key === 'Escape') { setDraft(null); }
            else if (e.key === 'ArrowDown' && e.altKey) { e.preventDefault(); setOpen(true); }
          }} />
        <button
          ref={toggleRef}
          type="button"
          className="ds-icon-btn"
          aria-label={toggleLabel}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={function() { setOpen(function(o) { return !o; }); }}>
          <span className="material-icons-outlined" style={{ fontSize: 20 }}>{icon}</span>
        </button>
      </div>
      {open &&
        <div
          role="dialog"
          aria-label={label}
          style={neFieldStyles.popup}
          onKeyDown={function(e) { if (e.key === 'Escape') { e.stopPropagation(); close(true); } }}>
          {children({ choose: choose })}
        </div>}
    </div>);
}

function DsDateField({ label, width, value, onChange }) {
  return (
    <PickerField label={label} width={width} value={value} format={fmtDateFr} parse={parseDateInput} onCommit={onChange} icon="calendar_today" toggleLabel="Ouvrir le calendrier">
      {function(api) { return <DsCalendar value={value} onSelect={api.choose} />; }}
    </PickerField>);
}

function DsTimeField({ label, width, value, onChange }) {
  return (
    <PickerField label={label} width={width} value={value} format={function(v) { return v || ''; }} parse={parseTimeInput} onCommit={onChange} icon="schedule" toggleLabel="Choisir l’heure">
      {function(api) { return <DsTimeList value={value} onSelect={api.choose} />; }}
    </PickerField>);
}

function DsCalendar({ value, onSelect }) {
  const sel = parseIso(value);
  const now = new Date();
  const todayIso = localIsoDate(now);
  const [cursor, setCursor] = React.useState(sel || { y: now.getFullYear(), m: now.getMonth(), d: now.getDate() });
  const gridRef = React.useRef(null);
  const moveFocus = React.useRef(true); // focus initial + navigation clavier seulement

  React.useEffect(function() {
    if (!moveFocus.current || !gridRef.current) return;
    const el = gridRef.current.querySelector('[data-day="' + cursor.d + '"]');
    if (el) el.focus();
    moveFocus.current = false;
  }, [cursor]);

  const monthFmt = new Intl.DateTimeFormat('fr-CA', { month: 'long', year: 'numeric' });
  const wdShort = new Intl.DateTimeFormat('fr-CA', { weekday: 'narrow' });
  const wdLong = new Intl.DateTimeFormat('fr-CA', { weekday: 'long' });
  const dayLong = new Intl.DateTimeFormat('fr-CA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const first = new Date(cursor.y, cursor.m, 1);
  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < first.getDay(); i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  function goto(dt, focus) { moveFocus.current = !!focus; setCursor({ y: dt.getFullYear(), m: dt.getMonth(), d: dt.getDate() }); }
  function shiftMonth(delta, focus) {
    const last = new Date(cursor.y, cursor.m + delta + 1, 0).getDate();
    goto(new Date(cursor.y, cursor.m + delta, Math.min(cursor.d, last)), focus);
  }
  function onGridKey(e) {
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
    if (step) { e.preventDefault(); goto(new Date(cursor.y, cursor.m, cursor.d + step), true); }
    else if (e.key === 'PageUp') { e.preventDefault(); shiftMonth(-1, true); }
    else if (e.key === 'PageDown') { e.preventDefault(); shiftMonth(1, true); }
  }

  return (
    <div style={{ width: 296 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--ds-spacing-xs)' }}>
        <button type="button" className="ds-icon-btn" aria-label="Mois précédent" onClick={function() { shiftMonth(-1, false); }}>
          <span className="material-icons-outlined" style={{ fontSize: 20 }}>chevron_left</span>
        </button>
        <div aria-live="polite" style={{ font: 'var(--mat-sys-title-medium-bold, 600 16px/20px var(--font-mat-sys-brand-family))', color: 'var(--mat-sys-on-surface)', textTransform: 'capitalize' }}>{monthFmt.format(first)}</div>
        <button type="button" className="ds-icon-btn" aria-label="Mois suivant" onClick={function() { shiftMonth(1, false); }}>
          <span className="material-icons-outlined" style={{ fontSize: 20 }}>chevron_right</span>
        </button>
      </div>
      <div role="grid" aria-label={monthFmt.format(first)} ref={gridRef} onKeyDown={onGridKey}>
        <div role="row" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 40px)' }}>
          {[0, 1, 2, 3, 4, 5, 6].map(function(i) {
            const ref = new Date(2023, 0, 1 + i); // 1er janv. 2023 = dimanche
            return <div key={i} role="columnheader" aria-label={wdLong.format(ref)} style={{ height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', font: 'var(--mat-sys-label-medium)', color: 'var(--mat-sys-on-surface-variant)', textTransform: 'uppercase' }}>{wdShort.format(ref)}</div>;
          })}
        </div>
        {weeks.map(function(w, wi) {
          return (
            <div key={wi} role="row" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 40px)' }}>
              {w.map(function(d, di) {
                if (!d) return <div key={di} role="gridcell" />;
                const iso = isoOf(cursor.y, cursor.m, d);
                const isSel = value === iso;
                const isToday = iso === todayIso;
                return (
                  <div key={di} role="gridcell" aria-selected={isSel} style={{ display: 'flex', justifyContent: 'center' }}>
                    <button
                      type="button"
                      data-day={d}
                      className="ds-pick-item"
                      tabIndex={d === cursor.d ? 0 : -1}
                      aria-label={dayLong.format(new Date(cursor.y, cursor.m, d))}
                      aria-current={isToday ? 'date' : undefined}
                      onClick={function() { onSelect(iso); }}
                      style={{
                        width: 40, height: 40, borderRadius: 'var(--mat-sys-corner-full, 9999px)', cursor: 'pointer',
                        font: isSel ? 'var(--mat-sys-body-medium-bold, 600 14px/21px var(--font-mat-sys-plain-family))' : 'var(--mat-sys-body-medium)',
                        border: isToday && !isSel ? '1px solid var(--mat-sys-primary)' : '1px solid transparent',
                        background: isSel ? 'var(--mat-sys-primary)' : 'transparent',
                        color: isSel ? 'var(--mat-sys-on-primary)' : 'var(--mat-sys-on-surface)'
                      }}>{d}</button>
                  </div>);
              })}
            </div>);
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--ds-spacing-xs)' }}>
        <button type="button" className="ds-btn" style={{ height: 40, padding: '0 var(--ds-spacing-s)', background: 'transparent', color: 'var(--mat-sys-primary)' }} onClick={function() { onSelect(todayIso); }}>Aujourd’hui</button>
      </div>
    </div>);
}

const TIME_OPTIONS = (function() {
  const out = [];
  for (let m = 0; m < 24 * 60; m += 15) out.push(pad2(Math.floor(m / 60)) + ':' + pad2(m % 60));
  return out;
})();

function DsTimeList({ value, onSelect }) {
  const listRef = React.useRef(null);
  const toMin = function(t) { const p = /^(\d{2}):(\d{2})$/.exec(t || ''); return p ? +p[1] * 60 + +p[2] : 8 * 60; };
  const target = toMin(value);
  let nearest = 0;
  TIME_OPTIONS.forEach(function(t, i) { if (Math.abs(toMin(t) - target) < Math.abs(toMin(TIME_OPTIONS[nearest]) - target)) nearest = i; });

  React.useEffect(function() {
    const el = listRef.current && listRef.current.children[nearest];
    if (el) { el.focus(); listRef.current.scrollTop = el.offsetTop - listRef.current.clientHeight / 2 + el.offsetHeight / 2; }
  }, []);

  function onKey(e) {
    const items = listRef.current.children;
    const i = Array.prototype.indexOf.call(items, document.activeElement);
    let n = null;
    if (e.key === 'ArrowDown') n = Math.min(items.length - 1, i + 1);
    else if (e.key === 'ArrowUp') n = Math.max(0, i - 1);
    else if (e.key === 'Home') n = 0;
    else if (e.key === 'End') n = items.length - 1;
    if (n !== null) { e.preventDefault(); items[n].focus(); }
  }

  return (
    <div ref={listRef} role="listbox" aria-label="Heures" onKeyDown={onKey} style={{ width: 146, maxHeight: 264, overflowY: 'auto', position: 'relative' }}>
      {TIME_OPTIONS.map(function(t, i) {
        const isSel = t === value;
        return (
          <button
            key={t}
            type="button"
            role="option"
            className="ds-pick-item"
            aria-selected={isSel}
            tabIndex={i === nearest ? 0 : -1}
            onClick={function() { onSelect(t); }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', height: 40, padding: '0 var(--ds-spacing-12)',
              border: 0, borderRadius: 'var(--mat-sys-corner-small)', cursor: 'pointer', textAlign: 'left',
              font: isSel ? 'var(--mat-sys-body-medium-bold, 600 14px/21px var(--font-mat-sys-plain-family))' : 'var(--mat-sys-body-medium)',
              background: isSel ? 'var(--mat-sys-secondary-container)' : 'transparent',
              color: isSel ? 'var(--mat-sys-on-secondary-container)' : 'var(--mat-sys-on-surface)'
            }}>
            {t}
            {isSel ? <span className="material-icons-outlined" style={{ fontSize: 18 }}>check</span> : null}
          </button>);
      })}
    </div>);
}

const neFieldStyles = {
  // DS3 : champ 44 px, coin 8 px, contour --mat-sys-outline (4:1), focus 2 px primary
  wrap: { position: 'relative', border: '1px solid var(--mat-sys-outline)', borderRadius: 'var(--mat-sys-corner-small)', height: 44, display: 'flex', alignItems: 'center', padding: '0 var(--ds-spacing-12)', background: 'var(--mat-sys-surface-container-lowest)' },
  wrapFocused: { border: '1px solid var(--mat-sys-primary)', boxShadow: '0 0 0 1px var(--mat-sys-primary)' },
  label: { position: 'absolute', left: 'var(--ds-spacing-xs)', padding: '0 var(--ds-spacing-xxs)', background: 'var(--mat-sys-surface-container-lowest)', color: 'var(--mat-sys-on-surface-variant)', fontFamily: 'var(--font-mat-sys-plain-family)', pointerEvents: 'none', transformOrigin: 'left center', transition: 'top var(--motion-duration) var(--motion-ease), font-size var(--motion-duration) var(--motion-ease), line-height var(--motion-duration) var(--motion-ease), color var(--motion-duration) var(--motion-ease)' },
  // label-medium quand flottant, body-large au repos
  labelFloating: { top: -9, fontSize: 12, lineHeight: '16px', fontWeight: 500, letterSpacing: 'var(--mat-sys-label-medium-tracking)' },
  labelResting: { top: 9, fontSize: 16, lineHeight: '24px', fontWeight: 400, letterSpacing: 'var(--mat-sys-body-large-tracking)' },
  inner: { display: 'flex', alignItems: 'center', width: '100%', gap: 'var(--ds-spacing-xs)' },
  popup: { position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 40, background: 'var(--mat-sys-surface-container-low)', borderRadius: 'var(--mat-sys-corner-large)', boxShadow: 'var(--mat-sys-level5)', padding: 'var(--ds-spacing-12)' },
  input: { border: 'none', outline: 'none', background: 'transparent', width: '100%', font: 'var(--mat-sys-body-large)', letterSpacing: 'var(--mat-sys-body-large-tracking)', color: 'var(--mat-sys-on-surface)', padding: 0 }
};

const neStyles = {
  // DS3 : carte statique = container-lowest sur surface, élévation 1 (ombre noire neutre), grille 4 pt
  card: { background: 'var(--mat-sys-surface-container-lowest)', borderRadius: 'var(--mat-sys-corner-small)', padding: 'var(--ds-spacing-s) var(--ds-spacing-m)', boxShadow: 'var(--mat-sys-level1)', fontFamily: 'var(--font-mat-sys-plain-family)' },
  // Cadre le corps éditable de la note (NoteBody) — un trait au-dessus, un en
  // dessous — repris de la maquette Figma (« redaction » y démarre par cette
  // même ligne, cf. "Ds2 - Rich text Toolbar" / node 11534:40525).
  noteDiv: { height: 1, background: 'var(--mat-sys-outline-variant)', margin: 'var(--ds-spacing-12) 0' },
  topRow: { display: 'flex', alignItems: 'flex-start', gap: 'var(--ds-spacing-12)', marginBottom: 'var(--ds-spacing-s)' },
  titleRow: { display: 'flex', alignItems: 'center', gap: 'var(--ds-spacing-12)', marginTop: 'var(--ds-spacing-xxs)' },
  statusBadge: { background: 'var(--mat-sys-secondary-container)', color: 'var(--mat-sys-on-secondary-container)', font: 'var(--mat-sys-label-large-bold)', padding: 'var(--ds-spacing-xxs) var(--ds-spacing-12)', borderRadius: 'var(--mat-sys-corner-small)' },
  assistRow: { display: 'flex', alignItems: 'center', gap: 'var(--ds-spacing-12)' },
  assistChip: { display: 'inline-flex', alignItems: 'center', gap: 'var(--ds-spacing-xs)', background: 'var(--mat-sys-secondary-container)', color: 'var(--mat-sys-on-secondary-container)', font: 'var(--mat-sys-body-large-bold)', padding: 'var(--ds-spacing-xs) var(--ds-spacing-s)', borderRadius: 'var(--mat-sys-corner-small)' },
  overline: { font: 'var(--mat-sys-label-medium)', letterSpacing: 'var(--mat-sys-label-medium-tracking)', textTransform: 'uppercase', color: 'var(--mat-sys-on-surface-variant)' },
  title: { font: 'var(--mat-sys-headline-small)', color: 'var(--mat-sys-on-surface)', margin: 0 },
  // Entre deux lignes (carte étroite) : 12 + 8 = 20 px — le libellé flottant du deuxième rang mord déjà sur l'interligne.
  fieldsRow: { display: 'flex', flexWrap: 'wrap', columnGap: 'var(--ds-spacing-12)', rowGap: 'calc(var(--ds-spacing-12) + var(--ds-spacing-xs))', alignItems: 'center', marginBottom: 'var(--ds-spacing-m)' },
  // Sur une seule ligne le groupe garde sa largeur naturelle (la raison prend 3× plus de
  // place libre) ; passé sous la raison, il occupe toute la ligne et le type de visite s'étire.
  fieldsGroup: { display: 'flex', gap: 'var(--ds-spacing-12)', flex: '1 1 584px', minWidth: 584 },
  tagToggle: { width: 44, height: 44, flexShrink: 0, marginLeft: 'auto', border: 'none', background: 'transparent', borderRadius: 'var(--mat-sys-corner-small)', color: 'var(--mat-sys-on-surface-variant)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'background var(--motion-duration) var(--motion-ease), color var(--motion-duration) var(--motion-ease)' },
  tagToggleOn: { background: 'var(--mat-sys-secondary-container)', color: 'var(--mat-sys-on-secondary-container)' },
  fieldValue: { font: 'var(--mat-sys-body-large)', letterSpacing: 'var(--mat-sys-body-large-tracking)', color: 'var(--mat-sys-on-surface)' },
  fieldIcon: { marginLeft: 'auto', fontSize: 20, color: 'var(--mat-sys-on-surface-variant)' },
  aiBox: { position: 'relative', border: '1px solid var(--mat-sys-outline-variant)', borderRadius: 'var(--mat-sys-corner-medium)', padding: 'var(--ds-spacing-m) var(--ds-spacing-s) var(--ds-spacing-12)', marginTop: 'var(--ds-spacing-xs)' },
  aiLegend: { position: 'absolute', top: -11, left: 'var(--ds-spacing-s)', display: 'flex', alignItems: 'center', gap: 'var(--ds-spacing-xxs)', background: 'var(--mat-sys-surface-container-lowest)', padding: '0 var(--ds-spacing-xs)' },
  aiSparkle: { fontSize: 18, color: 'var(--mat-sys-primary)' },
  aiLabel: { font: 'var(--mat-sys-label-large-bold)', color: 'var(--mat-sys-primary)' },
  aiRow: { display: 'flex', alignItems: 'center', gap: 'var(--ds-spacing-12)' },
  gabaritBtn: { display: 'inline-flex', alignItems: 'center', gap: 'var(--ds-spacing-xxs)', border: '1px solid var(--mat-sys-outline)', borderRadius: 'var(--mat-sys-corner-small)', background: 'var(--mat-sys-surface-container-lowest)', height: 40, padding: '0 var(--ds-spacing-xs) 0 var(--ds-spacing-s)', cursor: 'pointer', minWidth: 180, font: 'var(--mat-sys-body-medium)', letterSpacing: 'var(--mat-sys-body-medium-tracking)', color: 'var(--mat-sys-on-surface)', justifyContent: 'space-between' },
  gabaritCaret: { fontSize: 22, color: 'var(--mat-sys-on-surface-variant)' },
  aiActionBtn: { display: 'inline-flex', alignItems: 'center', gap: 'var(--ds-spacing-xs)', border: '1px solid var(--mat-sys-outline)', borderRadius: 'var(--mat-sys-corner-small)', background: 'var(--mat-sys-surface-container-lowest)', height: 40, padding: '0 var(--ds-spacing-s)', cursor: 'pointer', font: 'var(--mat-sys-label-large)', letterSpacing: 'var(--mat-sys-label-large-tracking)', color: 'var(--mat-sys-on-surface)' },
  aiActionIcon: { fontSize: 20, color: 'var(--mat-sys-on-surface-variant)' },
  infoIcon: { fontSize: 22, color: 'var(--mat-sys-on-surface-variant)', cursor: 'pointer' },
  chipsRow: { flex: 1, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--ds-spacing-xs)' },
  toolsIconBtn: { width: 40, height: 40, border: '1px solid var(--mat-sys-outline)', borderRadius: 'var(--mat-sys-corner-small)', background: 'var(--mat-sys-surface-container-lowest)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  chip: { display: 'inline-flex', alignItems: 'center', border: '1px solid var(--mat-sys-outline)', borderRadius: 'var(--mat-sys-corner-small)', padding: 'var(--ds-spacing-xxs) var(--ds-spacing-12)', cursor: 'pointer', whiteSpace: 'nowrap', font: 'var(--mat-sys-label-large)', letterSpacing: 'var(--mat-sys-label-large-tracking)', color: 'var(--mat-sys-on-surface)', background: 'var(--mat-sys-surface-container-lowest)', flexShrink: 0 },
};

window.NoteEditor = NoteEditor;

// ---------------------------------------------------------
// TagInput — « Étiquettes » chips field
// ---------------------------------------------------------
const TAG_SUGGESTIONS = ['Visite en clinique', 'Appel téléphonique', 'Assurance privée', 'CNESST', 'Cardiologie', 'Suivi', 'Sans rendez-vous', 'Urgent', 'Télémédecine'];

function TagInput({ tags, onChange }) {
  const [input, setInput] = React.useState('');
  const [focused, setFocused] = React.useState(false);
  const inputRef = React.useRef(null);

  function addTag(raw) {
    const t = (raw || '').trim();
    if (!t) return;
    if (tags.some(function(x) { return x.toLowerCase() === t.toLowerCase(); })) { setInput(''); return; }
    onChange(tags.concat([t]));
    setInput('');
  }
  function removeTag(i) { onChange(tags.filter(function(_, k) { return k !== i; })); }

  function onKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(input); }
    else if (e.key === 'Backspace' && input === '' && tags.length) { e.preventDefault(); removeTag(tags.length - 1); }
  }

  const suggestions = TAG_SUGGESTIONS.filter(function(s) {
    return !tags.some(function(t) { return t.toLowerCase() === s.toLowerCase(); }) &&
      (input.trim() === '' || s.toLowerCase().includes(input.trim().toLowerCase()));
  }).slice(0, 6);

  return (
    <div style={tagStyles.row}>
      <div
        style={{ ...tagStyles.wrap, ...(focused ? tagStyles.wrapFocused : {}) }}
        onMouseDown={function(e) { if (e.target === e.currentTarget || e.target.dataset.tagshell) { inputRef.current && inputRef.current.focus(); } }}>
        <span style={{ ...neFieldStyles.label, ...neFieldStyles.labelFloating, ...(focused ? { color: 'var(--mat-sys-primary)' } : {}) }}>Étiquettes</span>
        <div style={tagStyles.inner} data-tagshell="1">
          <span className="material-icons-outlined" style={tagStyles.icon}>sell</span>
          {tags.map(function(t, i) {
            return (
              <span key={t + i} style={tagStyles.chip}>
                {t}
                <button type="button" className="ds-tb-btn" style={tagStyles.chipX} title={"Retirer l’étiquette " + t} aria-label={"Retirer l’étiquette " + t} onClick={function() { removeTag(i); }}>
                  <span className="material-icons" style={{ fontSize: 16 }}>close</span>
                </button>
              </span>);
          })}
          <input
            ref={inputRef}
            style={tagStyles.input}
            value={input}
            placeholder={tags.length ? 'Ajouter…' : 'Ajouter une étiquette…'}
            onChange={function(e) { setInput(e.target.value); }}
            onKeyDown={onKeyDown}
            onFocus={function() { setFocused(true); }}
            onBlur={function() { setTimeout(function() { setFocused(false); }, 120); }} />
        </div>
        {focused && suggestions.length > 0 &&
          <div style={tagStyles.menu}>
            {suggestions.map(function(s) {
              return (
                <div key={s} style={tagStyles.menuItem}
                  onMouseEnter={function(e) { e.currentTarget.style.background = 'var(--mat-sys-secondary-container)'; }}
                  onMouseLeave={function(e) { e.currentTarget.style.background = 'transparent'; }}
                  onMouseDown={function(e) { e.preventDefault(); addTag(s); inputRef.current && inputRef.current.focus(); }}>
                  <span className="material-icons-outlined" style={{ fontSize: 16, color: 'var(--mat-sys-on-surface-variant)' }}>sell</span>
                  {s}
                </div>);
            })}
          </div>}
      </div>
    </div>);
}

const tagStyles = {
  row: { marginTop: -6, marginBottom: 'var(--ds-spacing-m)' },
  wrap: { position: 'relative', border: '1px solid var(--mat-sys-outline)', borderRadius: 'var(--mat-sys-corner-small)', minHeight: 44, display: 'flex', alignItems: 'center', padding: 'var(--ds-spacing-xxs) var(--ds-spacing-12)', background: 'var(--mat-sys-surface-container-lowest)' },
  wrapFocused: { border: '1px solid var(--mat-sys-primary)', boxShadow: '0 0 0 1px var(--mat-sys-primary)' },
  inner: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--ds-spacing-xs)', width: '100%' },
  icon: { fontSize: 22, color: 'var(--mat-sys-on-surface-variant)', marginRight: 2 },
  chip: { display: 'inline-flex', alignItems: 'center', gap: 'var(--ds-spacing-xs)', minHeight: 32, border: '1px solid var(--mat-sys-outline)', borderRadius: 'var(--mat-sys-corner-small)', padding: 'var(--ds-spacing-xxs) var(--ds-spacing-xxs) var(--ds-spacing-xxs) var(--ds-spacing-12)', font: 'var(--mat-sys-label-large)', letterSpacing: 'var(--mat-sys-label-large-tracking)', color: 'var(--mat-sys-on-surface)', background: 'var(--mat-sys-surface-container-lowest)' },
  chipX: { position: 'relative', width: 24, height: 24, border: 'none', cursor: 'pointer', color: 'var(--mat-sys-on-surface-variant)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0, borderRadius: 'var(--mat-sys-corner-small)' },
  input: { border: 'none', outline: 'none', background: 'transparent', flex: 1, minWidth: 120, font: 'var(--mat-sys-body-large)', letterSpacing: 'var(--mat-sys-body-large-tracking)', color: 'var(--mat-sys-on-surface)', padding: 'var(--ds-spacing-xxs) 0' },
  menu: { position: 'absolute', top: 'calc(100% + 4px)', left: 0, minWidth: 240, background: 'var(--mat-sys-surface-container-low)', borderRadius: 'var(--mat-sys-corner-small)', boxShadow: 'var(--mat-sys-level2)', padding: 'var(--ds-spacing-xxs) 0', zIndex: 30 },
  menuItem: { display: 'flex', alignItems: 'center', gap: 'var(--ds-spacing-xs)', padding: 'var(--ds-spacing-xs) var(--ds-spacing-12)', font: 'var(--mat-sys-body-large)', color: 'var(--mat-sys-on-surface)', cursor: 'pointer' }
};

// ---------------------------------------------------------
// NoteRichTextToolbar — barre de mise en forme du tweak "Barre de mise en
// forme = Haut de note" (maquette Figma "Ds2 - Rich text Toolbar"). Bloc en
// flux normal entre l'Assistant IA et le corps de la note — jamais en
// position fixe/overlay, contrairement au mode "Flottante"
// (FloatingToolbar.jsx, qui suit la sélection). Boutons/palettes/logique de
// débordement partagés avec ce dernier — voir rich-text-controls.jsx : les deux
// modes ne doivent plus dériver l'un de l'autre.
// ---------------------------------------------------------
function NoteRichTextToolbar({ editor }) {
  const [, bump] = React.useState(0);
  const barRef = React.useRef(null);
  const S = window.ToolbarShared;

  React.useEffect(function () {
    if (!editor) return undefined;
    function onTx() { bump(function (n) { return n + 1; }); }
    editor.on('transaction', onTx);
    return function () { editor.off('transaction', onTx); };
  }, [editor]);

  // Mesure la largeur réelle disponible — la barre est en flux normal (pas
  // flottante), sa largeur dépend du panneau/de la fenêtre. Dépend de
  // `editor` (pas []) : au tout premier rendu editor est encore null (voir
  // le early-return plus bas), donc rien n'est monté sous barRef — un effet
  // [] figerait l'observer sur cet état et ne se redéclencherait jamais une
  // fois la barre réellement affichée.
  const containerWidth = S.useToolbarWidth(barRef, [editor]);

  // Doit rester appelé à chaque render (règle des Hooks) même quand
  // `editor` est encore null — voir le early-return juste après.
  const linkEditor = S.useLinkEditor(editor);

  if (!editor) return null;

  function run(fn) { fn(editor.chain().focus()).run(); }

  var curLevel = [1, 2, 3].find(function (l) { return editor.isActive('heading', { level: l }); }) || 0;
  var curBlock = S.TOOLBAR_BLOCK_TYPES.find(function (b) { return b.level === curLevel; }) || S.TOOLBAR_BLOCK_TYPES[0];

  var chunks = S.buildToolbarChunks(editor, linkEditor, run);
  var visibleCount = S.visibleChunkCount(S.CHUNK_WIDTHS, containerWidth);
  var hiddenChunks = chunks.slice(visibleCount);

  return (
    <div ref={barRef} style={rtS.bar}>
      {linkEditor.editing ? (
        <S.ToolbarLinkEditRow linkEditor={linkEditor} />
      ) : (
        <React.Fragment>
          <S.ToolbarBlockDropdown
            curBlock={curBlock}
            onPick={function (b) { run(function (c) { return b.level === 0 ? c.setParagraph() : c.toggleHeading({ level: b.level }); }); }} />

          {chunks.slice(0, visibleCount).map(function (chunk) {
            return (
              <React.Fragment key={chunk.key}>
                <div style={S.tbS.sep} />
                {chunk.render(false)}
              </React.Fragment>
            );
          })}

          {hiddenChunks.length > 0 &&
            <React.Fragment>
              <div style={S.tbS.sep} />
              <S.ToolbarOverflowMenu chunks={hiddenChunks} />
            </React.Fragment>}
        </React.Fragment>
      )}
    </div>
  );
}

const rtS = {
  bar: { display: 'flex', alignItems: 'center', gap: 0, padding: 'var(--ds-spacing-xxs) var(--ds-spacing-xs)', borderRadius: 'var(--mat-sys-corner-small)', flexWrap: 'nowrap', marginBottom: 'var(--ds-spacing-12)' }
};
