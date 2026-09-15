/* global React */
function NoteEditor({ isOpen, onOpen, onComplete, onPatchArchivedTx, completeRef, smartActive, doctorName, institution, showClinicalTools = true,
  startPoints = false, lastNote, onLinkEpisode, onSmartPick, saveDraftRef, transmitRef, ftBarStyle = 'haut', ftBarPosition = 'haut',
  reviewingMode = false, reviewAuthor = 'me', checkoutSuggestions = false }) {
  // Lu par editor-field.jsx (filterSlash) pour retirer l'entrée "Outils
  // cliniques" du menu slash sans faire dépendre editor-data.jsx d'une prop.
  React.useEffect(function() {
    window.__SHOW_CLINICAL_TOOLS = showClinicalTools;
  }, [showClinicalTools]);

  // Mode révision — reviewActive suit le toggle d'en-tête ET l'activation
  // auto par l'IA (voir AIBox onAddToNote plus bas) ; il vit ici (pas dans
  // NoteBody) pour survivre au démontage/remontage de l'éditeur Tiptap à
  // chaque ouverture de note. reviewingMode (tweak) coupe tout quand off :
  // pas de bouton, pas d'auto-activation.
  const [reviewActive, setReviewActive] = React.useState(false);
  const [reviewChanges, setReviewChanges] = React.useState([]);
  const [reviewPopover, setReviewPopover] = React.useState(null); // { change, anchorRect }
  const [reviewGate, setReviewGate] = React.useState(false);
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
  const [docStats, setDocStats] = React.useState({ counts: {}, items: [], diagNames: [], chips: [] });
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
  const [quickSendCid, setQuickSendCid] = React.useState(null);
  const [noteDate, setNoteDate] = React.useState(function() { return new Date().toISOString().slice(0, 10); });
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
    window.dispatchEvent(new CustomEvent('note:chips-change', { detail: stats.counts }));
    window.dispatchEvent(new CustomEvent('note:items-change', { detail: { items: stats.items } }));
  }

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

  // Gabarit de note (/virus, /itu, /periodique — editor-data.jsx NOTE_TEMPLATES) :
  // règle structure + sections (Titre 2 + paragraphes) + outil clinique en un
  // geste. Note vierge → remplace tout le doc ; note déjà amorcée → ajoute à
  // la suite pour ne rien écraser.
  React.useEffect(function() {
    function onApplyTemplate(e) {
      var key = e.detail && e.detail.key;
      var tpl = (window.NOTE_DATA.NOTE_TEMPLATES || []).find(function(t) { return t.key === key; });
      if (!tpl) return;
      var blocks = [];
      (tpl.sections || []).forEach(function(s) {
        blocks = blocks.concat(window.plainToBlocks(s.title, s.content || ''));
      });
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
    // Edit button (···) → open full modal
    if (extra && extra.action === 'modal') {
      setInlineEdit(null);
      setPopover({ chipId: chipId, anchorRect: rect });
      setLinkedChipId(chipId);
      return;
    }
    // Zone click → inline autocomplete editor (prescription, lab, imaging, referral)
    if (extra && extra.field && entity) {
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

  function savePopover(chipId, draft) {
    var ent = Object.assign({}, draft, { label: deriveLabel(draft) });
    if (ent.type === 'prescription' && ent.rx) ent.rx = window.NOTE_DATA.deriveRx(ent.details || {}, ent.rx);
    else if (ent.type === 'lab' && ent.rx) ent.rx = window.NOTE_DATA.deriveLabRx(ent.details || {});
    else if (ent.type === 'imaging' && ent.rx) ent.rx = window.NOTE_DATA.deriveImgRx(ent.details || {});
    else if (ent.type === 'referral' && ent.rx) ent.rx = window.NOTE_DATA.deriveRefRx(ent.details || {});
    if (editorRef.current) window.updateChipEntity(editorRef.current, chipId, ent);
    setPopover(null);
  }

  function revertChip(chipId) {
    var editor = editorRef.current;
    if (editor) {
      var entity = window.getChipEntity(editor, chipId);
      var txt = (entity && (entity.text || entity.label)) || '';
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
    setRaison('');
    setTags([]);
    setShowTags(false);
    setInlineEdit(null);
    setPopover(null);
    setLinkedChipId(null);
    setEpisodeId(null);
    setDocStats({ counts: {}, items: [], diagNames: [], chips: [] });
    setTxState({});
    setReviewActive(false);
    setReviewChanges([]);
    setReviewPopover(null);
    setReviewGate(false);
  }

  // ----- Points de départ (tweak "Points de départ") -----
  function startFromLast() {
    if (lastNote && lastNote.doc) {
      initialDocRef.current = lastNote.doc;
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
        date: noteDate, time: noteTime, visitType: visitType, tags: tags }].concat(prev);
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
    setTxState(function(prev) {
      var next = Object.assign({}, prev);
      next[id] = Object.assign({}, next[id], patch);
      return next;
    });
  }

  // Marque un document complété en capturant l'empreinte de ses items
  // actuels (`itemIds`) — voir la note sur `stale` dans buildTransmissionDocs :
  // si de nouveaux items sont ajoutés après coup, cette empreinte ne
  // correspondra plus et le document redeviendra « à compléter ».
  function markDocComplete(id) {
    var doc = buildTransmissionDocs().find(function(d) { return d.id === id; });
    if (!doc) return;
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
    openTransmission(window.TX_NOTE_ITEM_ID);
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
    var doc = window.ensureSplit(editorRef.current ? editorRef.current.getJSON() : (initialDocRef.current || window.DEFAULT_DOC()));
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
      // État de transmission au moment de la complétion : c'est lui qui permet
      // de rouvrir le checkout d'une note passée depuis le Journal (bouton
      // « Checkout » de NotesList) avec ses destinataires et ses statuts, au
      // lieu d'un checkout vierge reconstruit depuis le seul contenu.
      txState: txState,
    };
    resetNote();
    if (onComplete) onComplete(data);
  }

  React.useEffect(function() {
    if (completeRef) completeRef.current = openFinalize;
    if (saveDraftRef) saveDraftRef.current = saveDraft;
    if (transmitRef) transmitRef.current = function() { openTransmission(); };
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
              <span className="material-icons-outlined" style={neStyles.docIcon}>insert_drive_file</span>
              <span style={neStyles.assistChip}>
                <span className="material-icons" style={{ fontSize: 20, color: '#5b54b8' }}>check</span>
                Rédaction assistée
              </span>
            </div>
          )
          : <span className="material-icons-outlined" style={neStyles.docIcon}>insert_drive_file</span>
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
        <FloatField label="Date" width={210} input type="date" value={noteDate} onValueChange={setNoteDate} />
        <FloatField label="Heure" width={170} input type="time" value={noteTime} onValueChange={setNoteTime} />
        <FloatField label="Type de visite" width={260} select value={visitType} onValueChange={setVisitType} options={['Visite en clinique', 'Appel téléphonique', 'Mise à jour']} />
        <button
          type="button"
          title={showTags ? "Masquer les étiquettes" : "Ajouter des étiquettes"}
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
                      style={pickerOpen ? { background: '#eef1fb', color: 'var(--brand-primary, #1a5fd4)' } : undefined}
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
    frequency: [
      'DIE', 'BID', 'TID', 'QID', 'HS',
      'q4h', 'q6h', 'q8h', 'q12h',
      'q4-6h PRN', 'q6-8h PRN', 'q8-12h PRN',
      'DIE PRN', 'BID PRN', 'TID PRN', 'Au besoin (PRN)',
      '1× / semaine', '2× / semaine', '3× / semaine',
      '1× / 2 semaines', '1× / mois'
    ],
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
    route: [
      'PO', 'SL', 'TD', 'Inhalé', 'Nasal', 'SC', 'IM', 'IV', 'PR', 'Topique', 'Auriculaire', 'Ophtalmique'
    ],
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
    refills: [
      'R0', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R11', 'R12'
    ],
    priority: [
      'Routine', 'Prioritaire', 'Semi-urgent', 'Urgent', 'STAT'
    ],
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
    specialty: [
      'Cardiologie', 'Orthopédie', 'Dermatologie', 'Gastroentérologie',
      'Neurologie', 'Pneumologie', 'Rhumatologie', 'Endocrinologie',
      'Néphrologie', 'Urologie', 'Gynécologie', 'Ophtalmologie',
      'ORL', 'Chirurgie générale', 'Chirurgie vasculaire', 'Hématologie',
      'Oncologie', 'Psychiatrie', 'Gériatrie', 'Médecine interne'
    ]
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
      background: '#fff', border: '1px solid #c5cae9', borderRadius: 10,
      boxShadow: '0 6px 24px rgba(37,36,94,0.18)', overflow: 'hidden',
      fontFamily: "'Inter', sans-serif"
    }
  },
    React.createElement('div', { style: { padding: '7px 12px 6px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: 8 } },
      React.createElement('span', { style: { fontSize: 10, fontWeight: 700, letterSpacing: 0.6, color: '#6967d1', textTransform: 'uppercase', flexShrink: 0 } }, FIELD_LABELS[field] || field),
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
        style: { flex: 1, border: 'none', outline: 'none', font: "400 14px 'Inter', sans-serif", color: 'rgba(0,0,0,0.85)', background: 'transparent' }
      })
    ),
    React.createElement('div', { style: { maxHeight: 224, overflowY: 'auto', padding: '4px 0' } },
      suggestions.length === 0
        ? React.createElement('div', { style: { padding: '10px 14px', fontSize: 13, color: 'rgba(0,0,0,0.38)' } }, 'Aucune suggestion')
        : suggestions.map(function(s, i) {
            var isActive = i === activeIdx;
            return React.createElement('div', {
              key: s,
              onMouseEnter: function() { setActiveIdx(i); },
              onMouseDown: function(e) { e.preventDefault(); handleSelect(s); },
              style: {
                padding: '9px 14px', cursor: 'pointer', fontSize: 14,
                color: isActive ? '#fff' : 'rgba(0,0,0,0.82)',
                background: isActive ? '#4b3fa6' : 'transparent',
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

function FloatField({ label, children, width, flex, error, input, type, select, options, value: controlledValue, onValueChange, onFocus: onFocusProp }) {
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
      ...(flex ? { flex: 1, minWidth: 200 } : { width }),
      ...(error ? { border: '1px solid #d32f2f' } : {}),
      ...(isBuiltIn && focused ? neFieldStyles.wrapFocused : {})
    }}>
      {label &&
      <span style={{
        ...neFieldStyles.label,
        ...(floated ? neFieldStyles.labelFloating : neFieldStyles.labelResting),
        ...(isBuiltIn && focused ? { color: '#6967d1' } : {})
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
            style={{ ...neFieldStyles.input, colorScheme: 'light' }}
            type={type || 'text'}
            value={value}
            onChange={handleChange}
            onFocus={function() { setFocused(true); if (onFocusProp) onFocusProp(); }}
            onBlur={function() { setFocused(false); }} />
        ) : children}
      </div>
    </div>);
}

const neFieldStyles = {
  wrap: { position: 'relative', border: '1px solid #c4c4c4', borderRadius: 6, height: 52, display: 'flex', alignItems: 'center', padding: '0 14px', background: '#fff' },
  wrapFocused: { border: '1px solid #6967d1', boxShadow: '0 0 0 1px #6967d1' },
  label: { position: 'absolute', left: 12, padding: '0 5px', background: '#fff', color: 'rgba(0,0,0,0.6)', fontFamily: "'Inter', sans-serif", pointerEvents: 'none', transformOrigin: 'left center', transition: 'top 0.16s ease, font-size 0.16s ease, color 0.16s ease' },
  labelFloating: { top: -8, fontSize: 12 },
  labelResting: { top: 15, fontSize: 16, color: 'rgba(0,0,0,0.55)' },
  inner: { display: 'flex', alignItems: 'center', width: '100%', gap: 8 },
  input: { border: 'none', outline: 'none', background: 'transparent', width: '100%', font: "400 15px 'Inter', sans-serif", color: 'rgba(0,0,0,0.85)', padding: 0 }
};

const neStyles = {
  card: { background: '#fff', borderRadius: 8, padding: '16px 20px 18px', boxShadow: '0 2px 4px 0 rgba(37,36,94,.14), 0 0 5px 0 rgba(37,36,94,.12)', fontFamily: "'Inter', sans-serif" },
  // Cadre le corps éditable de la note (NoteBody) — un trait au-dessus, un en
  // dessous — repris de la maquette Figma (« redaction » y démarre par cette
  // même ligne, cf. "Ds2 - Rich text Toolbar" / node 11534:40525).
  noteDiv: { height: 1, background: 'var(--border-subtle, #e5e5ec)', margin: '12px 0' },
  topRow: { display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 18 },
  titleRow: { display: 'flex', alignItems: 'center', gap: 12, marginTop: 2 },
  statusBadge: { background: '#e8e6f5', color: '#4b3fa6', fontFamily: "'Inter',sans-serif", fontWeight: 600, fontSize: 14, padding: '4px 12px', borderRadius: 8 },
  assistRow: { display: 'flex', alignItems: 'center', gap: 14 },
  assistChip: { display: 'inline-flex', alignItems: 'center', gap: 8, background: '#e8e6f5', color: '#3a3370', fontFamily: "'Inter',sans-serif", fontWeight: 600, fontSize: 16, padding: '9px 18px', borderRadius: 10 },
  overline: { fontSize: 11, fontWeight: 500, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(0,0,0,0.5)' },
  title: { fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 22, color: 'rgba(0,0,0,0.88)', marginTop: 2 },
  docIcon: { fontSize: 24, color: 'rgba(0,0,0,0.45)', marginTop: 6 },
  fieldsRow: { display: 'flex', gap: 14, alignItems: 'center', marginBottom: 22 },
  tagToggle: { width: 46, height: 52, flexShrink: 0, border: 'none', background: 'transparent', borderRadius: 8, color: 'rgba(0,0,0,0.5)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'background .15s ease, color .15s ease' },
  tagToggleOn: { background: '#e8e6f5', color: '#4b3fa6' },
  fieldValue: { fontSize: 15, color: 'rgba(0,0,0,0.82)' },
  fieldIcon: { marginLeft: 'auto', fontSize: 20, color: 'rgba(0,0,0,0.5)' },
  aiBox: { position: 'relative', border: '1px solid #c9c9e8', borderRadius: 10, padding: '18px 16px 14px', marginTop: 6 },
  aiLegend: { position: 'absolute', top: -11, left: 14, display: 'flex', alignItems: 'center', gap: 5, background: '#fff', padding: '0 6px' },
  aiSparkle: { fontSize: 18, color: '#6967d1' },
  aiLabel: { fontSize: 14, fontWeight: 600, color: '#6967d1' },
  aiRow: { display: 'flex', alignItems: 'center', gap: 12 },
  gabaritBtn: { display: 'inline-flex', alignItems: 'center', gap: 4, border: '1px solid #c9c9d6', borderRadius: 8, background: '#fff', padding: '9px 10px 9px 16px', cursor: 'pointer', minWidth: 180, font: "400 14px 'Inter', sans-serif", color: 'rgba(0,0,0,0.7)', justifyContent: 'space-between' },
  gabaritCaret: { fontSize: 22, color: 'rgba(0,0,0,0.6)' },
  aiActionBtn: { display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid #c9c9d6', borderRadius: 8, background: '#fff', padding: '9px 16px', cursor: 'pointer', font: "500 14px 'Inter', sans-serif", color: 'rgba(0,0,0,0.8)' },
  aiActionIcon: { fontSize: 20, color: 'rgba(0,0,0,0.6)' },
  infoIcon: { fontSize: 22, color: 'rgba(0,0,0,0.4)', cursor: 'pointer' },
  chipsRow: { flex: 1, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  toolsIconBtn: { width: 36, height: 36, border: '1.5px solid rgba(0,0,0,0.18)', borderRadius: 8, background: '#fff', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  chip: { display: 'inline-flex', alignItems: 'center', border: '1.5px solid rgba(0,0,0,0.18)', borderRadius: 20, padding: '6px 14px', cursor: 'pointer', whiteSpace: 'nowrap', font: "500 13px 'Inter', sans-serif", color: 'rgba(0,0,0,0.72)', background: '#fff', flexShrink: 0 },
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
        <span style={{ ...neFieldStyles.label, ...neFieldStyles.labelFloating, ...(focused ? { color: '#6967d1' } : {}) }}>Étiquettes</span>
        <div style={tagStyles.inner} data-tagshell="1">
          <span className="material-icons-outlined" style={tagStyles.icon}>sell</span>
          {tags.map(function(t, i) {
            return (
              <span key={t + i} style={tagStyles.chip}>
                {t}
                <button type="button" style={tagStyles.chipX} title="Retirer" onClick={function() { removeTag(i); }}>
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
                  onMouseEnter={function(e) { e.currentTarget.style.background = '#f3f2fb'; }}
                  onMouseLeave={function(e) { e.currentTarget.style.background = 'transparent'; }}
                  onMouseDown={function(e) { e.preventDefault(); addTag(s); inputRef.current && inputRef.current.focus(); }}>
                  <span className="material-icons-outlined" style={{ fontSize: 16, color: 'rgba(0,0,0,0.4)' }}>sell</span>
                  {s}
                </div>);
            })}
          </div>}
      </div>
    </div>);
}

const tagStyles = {
  row: { marginTop: -6, marginBottom: 22 },
  wrap: { position: 'relative', border: '1px solid #c4c4c4', borderRadius: 6, minHeight: 52, display: 'flex', alignItems: 'center', padding: '7px 12px', background: '#fff' },
  wrapFocused: { border: '1px solid #6967d1', boxShadow: '0 0 0 1px #6967d1' },
  inner: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, width: '100%' },
  icon: { fontSize: 22, color: 'rgba(0,0,0,0.45)', marginRight: 2 },
  chip: { display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid #d2d2dd', borderRadius: 6, padding: '4px 4px 4px 12px', font: "500 14px 'Inter', sans-serif", color: 'rgba(0,0,0,0.82)', background: '#fff' },
  chipX: { border: 'none', background: 'transparent', cursor: 'pointer', color: 'rgba(0,0,0,0.45)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 2, borderRadius: 4 },
  input: { border: 'none', outline: 'none', background: 'transparent', flex: 1, minWidth: 120, font: "400 15px 'Inter', sans-serif", color: 'rgba(0,0,0,0.85)', padding: '4px 0' },
  menu: { position: 'absolute', top: 'calc(100% + 4px)', left: 0, minWidth: 240, background: '#fff', border: '1px solid #e3e3ea', borderRadius: 8, boxShadow: '0 8px 20px rgba(37,36,94,0.16)', padding: '4px 0', zIndex: 30 },
  menuItem: { display: 'flex', alignItems: 'center', gap: 9, padding: '8px 14px', fontSize: 14, color: 'rgba(0,0,0,0.8)', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }
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
  bar: { display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 8, flexWrap: 'nowrap', marginBottom: 12 }
};
