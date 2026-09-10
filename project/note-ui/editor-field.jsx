// =========================================================
// editor-field.jsx — NoteBody : UNE instance Tiptap pour toute la note
// (Tiptap « de base » : éditeur non contrôlé, JSON natif comme source de
// vérité — voir editor-schema.jsx pour DEFAULT_DOC/scanDoc/chips).
//
// PHASE D : régions diagnostic imbriquées (node diagnosticRegion, voir
// editor-schema.jsx) + mode /dx (recherche CIM-10, DiagnosticDropdown
// réutilisé du même plugin @tiptap/suggestion que le menu et le mode ordre).
// =========================================================
const { useState: useStateE, useEffect: useEffectE, useRef: useRefE } = React;
const { parseSlashQuery, flattenRxResults } = window;

// ---------------------------------------------------------
// NoteBody — éditeur Tiptap unique, non contrôlé.
// - initialDoc : contenu de départ, lu UNE FOIS au montage (le composant est
//   démonté/remonté entre deux notes — voir NoteEditor.jsx : {isOpen && <NoteBody/>}).
// - onReady(editor|null) : instance créée (puis null au démontage).
// - onDocChange(docJson) : à chaque transaction (frappe ou commande).
// ---------------------------------------------------------
function NoteBody({ placeholder, initialDoc, onReady, onDocChange, onChipClick, linkedChipId }) {
  const hostRef = useRefE(null);
  const editorRef = useRefE(null);
  const [addBtnOffset, setAddBtnOffset] = useStateE(null); // null = CSS default (unfocused)
  const [chipMenu, setChipMenu] = useStateE(null); // { cid, rect } — hover menu (Modifier / Prescrire / ⋮) on order chips
  const [chipDelete, setChipDelete] = useStateE(null); // { cid, rect } — delete confirmation popover
  const [chipMore, setChipMore] = useStateE(null); // { cid, rect } — sous-menu « ⋮ » du chip
  const chipMenuTimerRef = useRefE(null);
  const addBtnRef = useRefE(null);
  const fileInputRef = useRefE(null);
  const [diagRename, setDiagRename] = useStateE(null); // { pos, value, rect } — renommage d'une région diagnostic
  const [addFileMenu, setAddFileMenu] = useStateE(null); // { rect } — choix de la source (ordinateur/cellulaire/patient)

  const onChipClickRef = useRefE(null); onChipClickRef.current = onChipClick;

  // Menu slash — état affiché (voir makeSlashRender/runSlashCommand ci-dessous).
  // mode 'menu' : { mode, items, activeIndex, query, rect } → <SlashMenu>
  // mode 'order' : { mode, kind, query, results, activeIndex, rect } → <RxMenu>
  // mode 'dx' : { mode, query, suggestions, activeIndex, rect } → <DiagnosticDropdown>
  const [slash, setSlash] = useStateE(null);
  const slashRef = useRefE(null); slashRef.current = slash; // lu par openSlashMenu, abonné une seule fois
  const slashCommandRef = useRefE(null); // fonction `command` fournie par le plugin pour le item courant
  const slashApiRef = useRefE(null); // { setActiveIndex, republish } — pour onHover/onToggleFav (hors du contrôleur)

  function openSlashMenu() {
    const editor = editorRef.current; if (!editor) return;
    if (slashRef.current) { setSlash(null); return; }
    // Le plugin Suggestion n'active « / » que précédé d'un espace ou en début
    // de ligne — insérer '/' seul en plein milieu d'un mot n'ouvre rien et
    // laisse un caractère parasite (voir le bouton « + »).
    const { from } = editor.state.selection;
    const before = from > 0 ? editor.state.doc.textBetween(from - 1, from, '\n') : '';
    const needsSpace = from > 0 && before !== ' ' && before !== '\n';
    editor.chain().focus().insertContent(needsSpace ? ' /' : '/').run();
  }

  // Sélection d'un item du menu générique (clic ou clavier) — délègue au
  // `command` du plugin, qui a la position exacte de « /query » à remplacer.
  function chooseSlashItem(it) {
    if (slashCommandRef.current) slashCommandRef.current(it);
  }

  // Sélection d'un item du RxMenu (mode ordre). `action` = undefined
  // (sélection normale), ou 'renouveler'/'ajuster'/'cesser' (médication au
  // dossier) — voir runOrderCommand.
  function chooseOrderItem(it, action) {
    if (slashCommandRef.current && slash) slashCommandRef.current({ __order: true, item: it, action: action, kind: slash.kind });
  }

  // Sélection d'une suggestion CIM-10 (clic dans le DiagnosticDropdown).
  function chooseDiagSuggestion(libelle) {
    if (slashCommandRef.current) slashCommandRef.current({ __dx: true, name: libelle });
  }

  // Insère le chip d'ordonnance riche (posologie complète) à la position de
  // « /rx query » (ou /lab /img /ref). Porté de l'ancien insertOrderChip
  // Quill : « cesser » construit un chip barré sans posologie ; « ajuster »
  // rouvre la modale complète juste après l'insertion.
  function runOrderCommand(editor, range, props) {
    const kind = props.kind, item = props.item, action = props.action;
    const def = window.NOTE_DATA.ORDER_DEFS[kind];
    if (!def || !item) return;
    const chipId = window.newChipId();
    const label = (item.name + ' ' + (item.dose || '')).trim();
    const isCeasing = action === 'cesser' && kind === 'rx';
    const itemDetails = isCeasing ? {} : (item.details || {});
    // `renewal` distingue le renouvellement d'une médication déjà au dossier
    // d'une nouvelle prescription : les deux produisent le même chip, mais le
    // checkout les affiche avec une icône différente (plan V7 §G).
    const rx = isCeasing
      ? { name: item.name, dose: item.dose || '', sig: 'Cessé', kind: kind, ceased: true }
      : { name: item.name, dose: item.dose || '', sig: item.chipSig || item.sig, kind: kind,
          renewal: action === 'renouveler' };
    const text = isCeasing ? label + ' — Cessé' : label + ' — ' + (item.chipSig || item.sig);
    editor.chain().focus().insertContentAt(range, [
      { type: 'chip', attrs: { cid: chipId, type: def.type, label: label, icon: def.icon, text: text, rx: rx, details: itemDetails } },
      { type: 'text', text: ' ' }
    ]).run();
    if (action === 'ajuster') {
      requestAnimationFrame(function () {
        const node = editor.view.dom.querySelector('[data-cid="' + chipId + '"]');
        if (node && onChipClickRef.current) onChipClickRef.current(chipId, node.getBoundingClientRect(), { action: 'modal' });
      });
    }
  }

  // Crée la région diagnostic à la position de « /dx query » : en-tête +
  // un paragraphe de corps vide, curseur placé dans ce paragraphe.
  function runDiagnosticCommand(editor, range, props) {
    const name = (props.name || '').trim() || 'Diagnostic';
    const diagId = window.newDiagId();
    editor.chain().focus().insertContentAt(range, {
      type: 'diagnosticRegion',
      attrs: { id: diagId, name: name },
      content: [{ type: 'paragraph' }]
    }).run();
    // La position exacte de la région dépend de la façon dont ProseMirror a
    // scindé le paragraphe remplacé (un paragraphe vide résiduel peut rester
    // AVANT la région) — on la retrouve plutôt que de calculer depuis range.from,
    // pour placer le curseur dans le paragraphe de corps, pas à la frontière de la région.
    let regionPos = null;
    editor.state.doc.descendants(function(node, pos) {
      if (regionPos != null) return false;
      if (node.type.name === 'diagnosticRegion' && node.attrs.id === diagId) { regionPos = pos; return false; }
    });
    if (regionPos != null) editor.chain().setTextSelection(regionPos + 2).run();
  }

  // Exécute l'action d'un item choisi. Reçoit {editor, range, props} du
  // plugin — `props` est soit un item SLASH_ITEMS (menu générique), soit
  // {__order, item, action, kind} (RxMenu), soit {__dx, name} (DiagnosticDropdown).
  function runSlashCommand({ editor, range, props }) {
    if (props.__order) { runOrderCommand(editor, range, props); return; }
    if (props.__dx) { runDiagnosticCommand(editor, range, props); return; }
    const it = props;
    if (it.rxSearch || it.orderSearch) {
      // Bascule vers le mode ordre : réécrit « /query » en « /rx » (garde le
      // « / » — le plugin doit continuer à suivre la requête).
      editor.chain().focus().insertContentAt(range, '/' + (it.kbd || 'rx') + ' ').run();
      return;
    }
    if (it.diagnosticEntry) {
      // Bascule vers le mode diagnostic : réécrit « /query » en « /dx ».
      editor.chain().focus().insertContentAt(range, '/dx ').run();
      return;
    }
    if (it.fileAction) {
      // Choix de la source (ordinateur/cellulaire/patient) avant d'ouvrir
      // quoi que ce soit — voir <AddFileSourceMenu> plus bas.
      const coords = editor.view.coordsAtPos(range.from);
      const rect = { left: coords.left, right: coords.left, top: coords.top, bottom: coords.bottom, width: 0, height: coords.bottom - coords.top, x: coords.left, y: coords.top };
      editor.chain().focus().deleteRange(range).run();
      setAddFileMenu({ rect });
      return;
    }
    if (it.textRapides) {
      editor.chain().focus().deleteRange(range).run();
      return;
    }
    if (it.ctPicker) {
      const coords = editor.view.coordsAtPos(range.from);
      const rect = { left: coords.left, right: coords.left, top: coords.top, bottom: coords.bottom, width: 0, height: coords.bottom - coords.top, x: coords.left, y: coords.top };
      editor.chain().focus().deleteRange(range).run();
      window.dispatchEvent(new CustomEvent('ct-picker-open', { detail: { rect } }));
      return;
    }
    if (it.noteTemplate) {
      editor.chain().focus().deleteRange(range).run();
      window.dispatchEvent(new CustomEvent('note:apply-template', { detail: { key: it.noteTemplate } }));
      return;
    }
    if (it.addSection) {
      editor.chain().focus().insertContentAt(range, [
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Nouvelle section' }] },
        { type: 'paragraph' }
      ]).run();
      return;
    }
    if (it.template) {
      const chipId = window.newChipId();
      const meta = window.NOTE_DATA.ENTITY_TYPES[it.template.type] || {};
      editor.chain().focus().insertContentAt(range, [
        { type: 'chip', attrs: { cid: chipId, type: it.template.type, label: it.template.label, icon: meta.icon || 'bookmark', text: it.template.text || it.template.label, rx: null, details: it.template.details || null } },
        { type: 'text', text: ' ' }
      ]).run();
      // « openAfter » — ouvre la modale d'édition complète juste après l'insertion.
      requestAnimationFrame(function () {
        const node = editor.view.dom.querySelector('[data-cid="' + chipId + '"]');
        if (node && onChipClickRef.current) onChipClickRef.current(chipId, node.getBoundingClientRect(), { action: 'modal' });
      });
    }
  }

  // Contrôleur du plugin @tiptap/suggestion — un seul appel par éditeur
  // (render() n'est invoqué qu'une fois par le plugin). L'état local
  // (selectedIndex, items…) vit dans cette fermeture ; on le reflète dans
  // le state React (setSlash) uniquement pour le rendu de <SlashMenu>.
  function makeSlashRender() {
    let selectedIndex = 0, currentItems = [], currentClientRect = null, lastQuery = '';

    // Le mode dx démarre sans sélection (-1) : Entrée confirme alors le texte
    // tapé tel quel (voir onKeyDown) — les autres modes démarrent sur le 1er item.
    function initialIndex(mode) { return mode === 'dx' ? -1 : 0; }

    // Menu générique : même une requête avec espace et 0 résultat reste
    // affichée (message « aucun résultat » + indice Échap) — plus de
    // fermeture silencieuse qui laissait la requête devenir du texte libre
    // sans que l'utilisateur comprenne pourquoi. Les modes ordre/dx ne
    // « renoncent » jamais non plus — RxMenu/DiagnosticDropdown affichent
    // leur propre message « rien trouvé ».
    function publish(query) {
      const parsed = parseSlashQuery(query);
      if (parsed.mode === 'order') {
        const results = window.NOTE_DATA.searchOrder(parsed.kind, (parsed.term || '').trim());
        setSlash({ mode: 'order', kind: parsed.kind, query: (parsed.term || '').trim(), results: results, activeIndex: selectedIndex, rect: currentClientRect ? currentClientRect() : null });
        return;
      }
      if (parsed.mode === 'dx') {
        const term = (parsed.term || '').trim();
        setSlash({ mode: 'dx', query: term, suggestions: window.searchCIM10(term), activeIndex: selectedIndex, rect: currentClientRect ? currentClientRect() : null });
        return;
      }
      setSlash({ mode: 'menu', items: currentItems, activeIndex: selectedIndex, query: query, rect: currentClientRect ? currentClientRect() : null });
    }
    const api = {
      onStart(props) {
        selectedIndex = initialIndex(parseSlashQuery(props.query).mode);
        currentItems = props.items; currentClientRect = props.clientRect; lastQuery = props.query;
        slashCommandRef.current = props.command;
        publish(props.query);
      },
      onUpdate(props) {
        if (props.query !== lastQuery) selectedIndex = initialIndex(parseSlashQuery(props.query).mode);
        lastQuery = props.query; currentItems = props.items; currentClientRect = props.clientRect;
        slashCommandRef.current = props.command;
        publish(props.query);
      },
      onKeyDown(props) {
        if (props.event.key === 'Escape') { setSlash(null); return true; }
        const parsed = parseSlashQuery(lastQuery);
        // Menu générique sans aucun résultat : on n'intercepte plus les
        // flèches/Entrée (rien à sélectionner) — la frappe continue
        // normalement, le message « aucun résultat » reste affiché via publish().
        if (parsed.mode === 'menu' && currentItems.length === 0) return false;
        if (props.event.key === 'ArrowDown') {
          selectedIndex = parsed.mode === 'dx'
            ? Math.min(currentItems.length - 1, (selectedIndex >= 0 ? selectedIndex : -1) + 1)
            : Math.min(currentItems.length - 1, selectedIndex + 1);
          publish(lastQuery); return true;
        }
        if (props.event.key === 'ArrowUp') {
          selectedIndex = parsed.mode === 'dx'
            ? Math.max(-1, (selectedIndex >= 0 ? selectedIndex : 0) - 1)
            : Math.max(0, selectedIndex - 1);
          publish(lastQuery); return true;
        }
        if (props.event.key === 'Enter' || props.event.key === 'Tab') {
          if (!slashCommandRef.current) return true;
          if (parsed.mode === 'order') {
            const it = currentItems[selectedIndex];
            if (it) {
              const isActiveMed = it.med && it.medStatus === 'active';
              slashCommandRef.current({ __order: true, item: it, action: isActiveMed ? 'renouveler' : undefined, kind: parsed.kind });
            }
          } else if (parsed.mode === 'dx') {
            const s = selectedIndex >= 0 ? currentItems[selectedIndex] : null;
            slashCommandRef.current({ __dx: true, name: s ? s.libelle : (parsed.term || '').trim() });
          } else {
            const it = currentItems[selectedIndex];
            if (it) slashCommandRef.current(it);
          }
          return true;
        }
        return false;
      },
      onExit() { setSlash(null); },
      setActiveIndex(idx) { selectedIndex = idx; publish(lastQuery); },
      republish() { publish(lastQuery); }
    };
    slashApiRef.current = api;
    return api;
  }

  // Insère un chip fichier puis ouvre son aperçu automatiquement — même
  // geste que si on venait de cliquer dessus (onChipClickRef), pour que
  // « à l'ouverture, afficher un loader » s'applique aussi juste après
  // l'ajout, pas seulement au clic ultérieur sur le chip.
  function insertFileChip(name, url) {
    const editor = editorRef.current; if (!editor) return;
    const kind = window.fileKindFromName(name);
    const icon = window.fileIconForKind(kind);
    const chipId = window.newChipId();
    const pos = editor.state.selection.from;
    editor.chain().focus().insertContentAt(pos, [
      { type: 'chip', attrs: { cid: chipId, type: 'file', label: name, icon: icon, text: name, rx: null, details: { url: url } } },
      { type: 'text', text: ' ' }
    ]).run();
    requestAnimationFrame(function () {
      const node = editor.view.dom.querySelector('[data-cid="' + chipId + '"]');
      if (node && onChipClickRef.current) onChipClickRef.current(chipId, node.getBoundingClientRect(), null);
    });
  }

  function handleFileChange(e) {
    const files = Array.from(e.target.files || []);
    files.forEach(function (file) { insertFileChip(file.name, URL.createObjectURL(file)); });
    e.target.value = '';
  }

  // « Votre cellulaire » / « Le patient » — pas de vrai appairage
  // d'appareil dans ce prototype : on simule l'attente d'un envoi (toast)
  // puis on insère une photo factice, sur le même principe que l'Assistant
  // IA qui simule sa génération après un délai (voir AIBox.jsx).
  var MOCK_PHOTO_URL = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200">' +
    '<rect width="900" height="1200" fill="#eef0f6"/>' +
    '<rect x="60" y="60" width="780" height="1080" fill="#fff" stroke="#c9c9d6" stroke-width="2"/>' +
    '<text x="450" y="600" font-family="Inter,sans-serif" font-size="32" fill="#6b6f76" text-anchor="middle">Photo reçue</text>' +
    '</svg>'
  );
  function requestMobileFile(source) {
    const label = source === 'patient' ? 'le téléphone du patient' : 'votre cellulaire';
    if (window.toast) window.toast('En attente d’une photo depuis ' + label + '…', { icon: 'smartphone', duration: 2200 });
    setTimeout(function () {
      insertFileChip((source === 'patient' ? 'Photo — patient' : 'Photo — cellulaire') + '.jpg', MOCK_PHOTO_URL);
    }, 1800);
  }

  // Position (avant-nœud) de la région diagnostic la plus proche englobant
  // un nœud DOM donné — utilisé pour retrouver le node depuis un clic sur
  // son en-tête (.dxr-name / .dxr-promote), non géré par le NodeView lui-même.
  function findRegionPosFromDOM(editor, domNode) {
    try {
      const pos = editor.view.posAtDOM(domNode, 0);
      const $pos = editor.state.doc.resolve(pos);
      for (let d = $pos.depth; d >= 0; d--) {
        if ($pos.node(d).type.name === 'diagnosticRegion') return $pos.before(d);
      }
    } catch (e) {}
    return -1;
  }

  function openDiagRename(nameEl, regionPos, attrs) {
    const rect = nameEl.getBoundingClientRect();
    setDiagRename({
      pos: regionPos,
      value: attrs.name || '',
      rect: { top: rect.bottom + 4, left: Math.max(8, Math.min(rect.left, window.innerWidth - 280)) }
    });
  }

  function commitDiagRename(newName) {
    const editor = editorRef.current;
    const dr = diagRename;
    setDiagRename(null);
    if (!editor || !dr) return;
    const name = (newName || '').trim();
    if (!name) return;
    editor.chain().focus().command(function (props) {
      const node = props.tr.doc.nodeAt(dr.pos);
      if (!node || node.type.name !== 'diagnosticRegion') return false;
      props.tr.setNodeMarkup(dr.pos, undefined, Object.assign({}, node.attrs, { name: name }));
      return true;
    }).run();
  }

  // Rouvre le menu (bouton « + » ou retour du picker d'outils cliniques).
  useEffectE(function () {
    window.addEventListener('ct-addmenu-open', openSlashMenu);
    return function () { window.removeEventListener('ct-addmenu-open', openSlashMenu); };
  }, []);

  function cancelChipMenuClose() { if (chipMenuTimerRef.current) { clearTimeout(chipMenuTimerRef.current); chipMenuTimerRef.current = null; } }
  function scheduleChipMenuClose() {
    cancelChipMenuClose();
    chipMenuTimerRef.current = setTimeout(function () { setChipMenu(null); }, 180);
  }

  function updateAddBtnPos(editor) {
    try {
      const { from } = editor.state.selection;
      const coords = editor.view.coordsAtPos(from);
      const rootRect = editor.view.dom.getBoundingClientRect();
      const mid = coords.top - rootRect.top + (coords.bottom - coords.top) / 2;
      setAddBtnOffset(Math.max(0, mid - 15));
    } catch (e) {}
  }

  // --- init Tiptap once
  useEffectE(() => {
    if (!hostRef.current || editorRef.current) return;

    const slashExtension = window.buildSlashExtension({
      onCommand: runSlashCommand,
      makeRender: makeSlashRender
    });
    const editor = new window.Tiptap.Editor({
      element: hostRef.current,
      extensions: window.buildEditorExtensions(placeholder).concat([slashExtension]),
      content: initialDoc || window.DEFAULT_DOC(),
      editorProps: {
        attributes: { class: 'ql-editor ProseMirror' }
      },
      onUpdate({ editor }) {
        onDocChange(editor.getJSON());
        updateAddBtnPos(editor);
      },
      onSelectionUpdate({ editor }) {
        updateAddBtnPos(editor);
      }
    });
    editorRef.current = editor;
    hostRef.current.__editor = editor;
    updateAddBtnPos(editor);
    // Le contenu initial (brouillon, dernière note, gabarit) n'émet pas
    // d'update — on amorce nous-mêmes compteurs/Sommaire une seule fois.
    onDocChange(editor.getJSON());
    if (onReady) onReady(editor);

    // Diagnostic header — clic sur le nom → renommer ; clic sur le bouton →
    // promouvoir en problème (écouté par Summary.jsx via note:add-problem).
    editor.view.dom.addEventListener('mousedown', (e) => {
      const nameEl = e.target.closest('.dxr-name');
      if (nameEl) {
        e.preventDefault();
        const regionPos = findRegionPosFromDOM(editor, nameEl);
        if (regionPos >= 0) {
          const node = editor.state.doc.nodeAt(regionPos);
          if (node) openDiagRename(nameEl, regionPos, node.attrs);
        }
        return;
      }
      const promoteEl = e.target.closest('.dxr-promote');
      if (promoteEl) {
        e.preventDefault();
        const head = promoteEl.closest('.dxr-head');
        const nmEl = head && head.querySelector('.dxr-name');
        const nm = nmEl ? nmEl.textContent.trim() : '';
        if (nm) window.dispatchEvent(new CustomEvent('note:add-problem', { detail: { name: nm } }));
        promoteEl.classList.add('dxr-promoted');
      }
    });

    // Chip click handler — detects which zone was clicked (data-field or data-action)
    editor.view.dom.addEventListener('mousedown', (e) => {
      const chipEl = e.target.closest('.chip[data-cid]');
      if (!chipEl) return;
      e.preventDefault();
      const cid = chipEl.getAttribute('data-cid');
      const actionEl = e.target.closest('[data-action]');
      const fieldEl = e.target.closest('[data-field]');
      if (actionEl) {
        onChipClickRef.current(cid, chipEl.getBoundingClientRect(), { action: actionEl.getAttribute('data-action') });
      } else if (fieldEl) {
        onChipClickRef.current(cid, chipEl.getBoundingClientRect(), { field: fieldEl.getAttribute('data-field'), fieldRect: fieldEl.getBoundingClientRect() });
      } else {
        const doseEl = chipEl.querySelector('[data-field="dose"]');
        if (doseEl && chipEl.classList.contains('chip--rx')) {
          onChipClickRef.current(cid, chipEl.getBoundingClientRect(), { field: 'dose', fieldRect: doseEl.getBoundingClientRect() });
        } else {
          onChipClickRef.current(cid, chipEl.getBoundingClientRect(), null);
        }
      }
    });

    // Hover menu (Modifier / Prescrire / ⋮) on order chips — show on chip hover,
    // close shortly after the pointer leaves (cancelled if it enters the menu).
    editor.view.dom.addEventListener('mouseover', (e) => {
      const chipEl = e.target.closest('.chip--rx[data-cid]');
      if (!chipEl) return;
      cancelChipMenuClose();
      const cid = chipEl.getAttribute('data-cid');
      setChipMenu((cm) => (cm && cm.cid === cid) ? cm : { cid, rect: chipEl.getBoundingClientRect() });
    });
    editor.view.dom.addEventListener('mouseout', (e) => {
      if (e.target.closest('.chip--rx[data-cid]')) scheduleChipMenuClose();
    });

    return () => {
      editor.destroy();
      editorRef.current = null;
      if (onReady) onReady(null);
    };
  }, []);

  // Reconstruit le texte lisible d'un chip d'ordonnance à partir de ses segments
  // visibles (nom, dose, posologie…), en ignorant l'icône et les séparateurs.
  function chipPlainText(cid) {
    const editor = editorRef.current; if (!editor) return '';
    const node = editor.view.dom.querySelector('.chip[data-cid="' + cid + '"]');
    if (!node) return '';
    const keep = ['chip-rx-name', 'chip-rx-dose', 'chip-rx-form', 'chip-rx-route', 'chip-rx-freq', 'chip-rx-dur', 'chip-rx-badge', 'chip-rx-sig'];
    const parts = [];
    node.querySelectorAll('span').forEach(function (sp) {
      if (keep.some(function (c) { return sp.classList.contains(c); })) {
        const t = (sp.textContent || '').trim();
        if (t) parts.push(t);
      }
    });
    return parts.join(' ').replace(/\s+/g, ' ').trim();
  }

  // Supprime le chip (node atom) à sa position, en remplaçant éventuellement
  // par du texte brut (« Convertir en texte »).
  function applyChipEdit(cid, replacementText) {
    const editor = editorRef.current; if (!editor) return;
    const pos = window.findChipPos(editor, cid);
    if (pos < 0) return;
    let end = pos + 1;
    if (!replacementText) {
      const after = editor.state.doc.textBetween(end, Math.min(end + 1, editor.state.doc.content.size));
      if (after === ' ') end += 1;
    }
    const chain = editor.chain().focus().deleteRange({ from: pos, to: end });
    if (replacementText) chain.insertContentAt(pos, replacementText);
    chain.run();
  }

  function deleteChipFromMenu(cid) { applyChipEdit(cid, null); }
  function keepChipAsText(cid) { applyChipEdit(cid, chipPlainText(cid)); }

  useEffectE(function () {
    if (!chipDelete && !chipMenu && !chipMore) return;
    function onKey(e) { if (e.key === 'Escape') { setChipDelete(null); setChipMenu(null); setChipMore(null); } }
    document.addEventListener('keydown', onKey);
    return function () { document.removeEventListener('keydown', onKey); };
  }, [chipDelete, chipMenu, chipMore]);

  return (
    <>
      <div className="note-field-shell">
        <button
          ref={addBtnRef}
          type="button" className="nf-add" title="Insérer une fonction"
          style={addBtnOffset !== null ? { marginTop: addBtnOffset + 'px' } : undefined}
          onMouseDown={(e) => e.preventDefault()}
          onClick={openSlashMenu}>
          <span className="material-icons-outlined">add_circle_outline</span>
        </button>
        <div ref={hostRef} className="note-field" style={{ minHeight: "96px" }} />
        <button
          type="button" className="nf-tt" title="Afficher la barre de mise en forme"
          onMouseDown={(e) => {
            e.preventDefault();
            const editor = editorRef.current;
            if (!editor) return;
            editor.commands.focus();
            const rect = e.currentTarget.getBoundingClientRect();
            window.dispatchEvent(new CustomEvent('ftbar-pin', { detail: { editor, rect } }));
          }}>
          <span className="nf-tt-sm">T</span><span className="nf-tt-lg">T</span>
        </button>
      </div>

      {/* Menu de survol des chips d'ordonnance — bouton segmenté Modifier / Supprimer */}
      {chipMenu && !chipDelete && (function () {
        const r = chipMenu.rect;
        const placeBelow = r.top < 56;
        const top = placeBelow ? r.bottom + 8 : r.top - 48;
        const left = Math.max(8, Math.min(r.left, window.innerWidth - 260));
        const _ent = editorRef.current ? window.getChipEntity(editorRef.current, chipMenu.cid) : null;
        const _isRx = !_ent || _ent.type === 'prescription';
        const _isCeased = !!(_ent && _ent.rx && _ent.rx.ceased);
        return (
          <div
            style={Object.assign({ position: 'fixed', top: top, left: left, zIndex: 200 }, cmS.bar)}
            onMouseEnter={cancelChipMenuClose}
            onMouseLeave={scheduleChipMenuClose}>
            <button
              style={cmS.segStart}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                const cid = chipMenu.cid, rect = chipMenu.rect;
                setChipMenu(null);
                onChipClickRef.current(cid, rect, { action: 'modal' });
              }}>
              <span className="material-icons-outlined" style={{ fontSize: 20 }}>edit</span>
              Modifier
            </button>
            {!_isCeased &&
            <button
              style={cmS.segMid}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                const cid = chipMenu.cid;
                setChipMenu(null);
                window.dispatchEvent(new CustomEvent('note:open-checkout', { detail: { cid: cid, kind: _isRx ? 'rx' : 'order' } }));
              }}>
              {_isRx
                ? <span style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 700, fontSize: 18, lineHeight: 1 }}>℞</span>
                : <span className="material-icons-outlined" style={{ fontSize: 20 }}>send</span>}
              {_isRx ? 'Prescrire' : 'Transmettre'}
            </button>}
            <button
              style={cmS.segEnd}
              title="Plus d'options"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { cancelChipMenuClose(); setChipMore({ cid: chipMenu.cid, rect: chipMenu.rect }); setChipMenu(null); }}>
              <span className="material-icons-outlined" style={{ fontSize: 20, color: '#303336' }}>more_vert</span>
            </button>
          </div>
        );
      })()}

      {/* Confirmation de suppression — effacer ou conserver en texte */}
      {chipDelete && (function () {
        const r = chipDelete.rect;
        const W = 304;
        const top = r.bottom + 8;
        const left = Math.max(8, Math.min(r.left, window.innerWidth - W - 8));
        const ent = editorRef.current ? window.getChipEntity(editorRef.current, chipDelete.cid) : null;
        const isRx = ent && ent.type === 'prescription';
        const noun = isRx ? 'cette prescription' : 'cet élément';
        return (
          <React.Fragment>
            <div style={{ position: 'fixed', inset: 0, zIndex: 209 }} onMouseDown={() => setChipDelete(null)} />
            <div style={Object.assign({ position: 'fixed', top: top, left: left, width: W, zIndex: 210 }, cmS.confirm)}>
              <div style={cmS.confirmHead}>
                <span style={cmS.confirmTitle}>Supprimer {noun}&nbsp;?</span>
                <button style={cmS.confirmClose} title="Annuler" onClick={() => setChipDelete(null)}>
                  <span className="material-icons" style={{ fontSize: 20, color: 'rgba(0,0,0,0.5)' }}>close</span>
                </button>
              </div>
              <p style={cmS.confirmBody}>
                Retirer complètement {noun} de la note, ou la conserver sous forme de texte simple&nbsp;?
              </p>
              <div style={cmS.confirmActions}>
                <button style={cmS.btnKeep}
                  onClick={() => { keepChipAsText(chipDelete.cid); setChipDelete(null); }}>
                  Garder en texte
                </button>
                <button style={cmS.btnDelete}
                  onClick={() => { deleteChipFromMenu(chipDelete.cid); setChipDelete(null); }}>
                  Supprimer
                </button>
              </div>
            </div>
          </React.Fragment>
        );
      })()}

      {/* Sous-menu « ⋮ » du chip — options secondaires */}
      {chipMore && (function () {
        const r = chipMore.rect;
        const W = 220;
        const top = r.bottom + 8;
        const left = Math.max(8, Math.min(r.left, window.innerWidth - W - 8));
        const item = { display: 'flex', alignItems: 'center', gap: 10, width: '100%', border: 0, background: 'transparent', borderRadius: 8, padding: '9px 12px', cursor: 'pointer', font: "500 14px 'Inter',sans-serif", color: '#303336', textAlign: 'left' };
        return (
          <React.Fragment>
            <div style={{ position: 'fixed', inset: 0, zIndex: 209 }} onMouseDown={() => setChipMore(null)} />
            <div style={{ position: 'fixed', top: top, left: left, width: W, zIndex: 210, background: '#fff', border: '1px solid #e2e2ec', borderRadius: 10, boxShadow: '0 14px 40px rgba(37,36,94,0.22)', padding: 6, fontFamily: "'Inter',sans-serif", animation: 'pop-in 130ms ease-out' }}>
              <button style={item} onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4fb'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                onClick={() => { keepChipAsText(chipMore.cid); setChipMore(null); }}>
                <span className="material-icons-outlined" style={{ fontSize: 20, color: '#5b5f66' }}>notes</span>
                Convertir en texte
              </button>
              <button style={Object.assign({}, item, { color: '#ba1a1a' })} onMouseEnter={(e) => e.currentTarget.style.background = '#fdecec'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                onClick={() => { setChipDelete({ cid: chipMore.cid, rect: chipMore.rect }); setChipMore(null); }}>
                <span className="material-icons-outlined" style={{ fontSize: 20, color: '#ba1a1a' }}>delete</span>
                Supprimer
              </button>
            </div>
          </React.Fragment>
        );
      })()}

      {/* Menu slash (« / » ou bouton « + ») */}
      {slash && slash.mode === 'menu' &&
        <SlashMenu
          position={{ top: (slash.rect ? slash.rect.bottom : 0) + 6, left: Math.max(8, Math.min(slash.rect ? slash.rect.left : 0, window.innerWidth - 332)) }}
          query={slash.query}
          activeIndex={slash.activeIndex}
          items={slash.items}
          onSelect={chooseSlashItem}
          onClose={() => setSlash(null)} />
      }

      {/* Mode ordre — /rx /lab /img /ref */}
      {slash && slash.mode === 'order' &&
        <RxMenu
          position={{ top: (slash.rect ? slash.rect.bottom : 0) + 6, left: Math.max(8, Math.min(slash.rect ? slash.rect.left : 0, window.innerWidth - 476)), zIndex: 60 }}
          kind={slash.kind}
          def={window.NOTE_DATA.ORDER_DEFS[slash.kind]}
          query={slash.query}
          results={slash.results}
          activeIndex={slash.activeIndex}
          onHover={(i) => { if (slashApiRef.current) slashApiRef.current.setActiveIndex(i); }}
          onSelect={chooseOrderItem}
          onToggleFav={(k) => { window.NOTE_DATA.toggleOrderFav(slash.kind, k); if (slashApiRef.current) slashApiRef.current.republish(); }}
          onClose={() => setSlash(null)} />
      }

      {/* Mode diagnostic — /dx (recherche CIM-10) */}
      {slash && slash.mode === 'dx' &&
        <DiagnosticDropdown
          position={{ top: (slash.rect ? slash.rect.bottom : 0) + 6, left: Math.max(8, Math.min(slash.rect ? slash.rect.left : 0, window.innerWidth - 380)) }}
          query={slash.query}
          suggestions={slash.suggestions}
          activeIndex={slash.activeIndex}
          onPickSuggestion={chooseDiagSuggestion}
          onClose={() => setSlash(null)} />
      }

      {/* Renommage d'une région diagnostic (clic sur son nom) */}
      {diagRename &&
        <DiagRenamePopover
          pos={diagRename.rect}
          value={diagRename.value}
          onCommit={commitDiagRename}
          onCancel={() => setDiagRename(null)} />
      }

      {/* Choix de la source du fichier — sous-menu de « Ajouter des
          fichiers » (slash/+), même patron que ClinicalToolPicker : en-tête
          avec retour vers le menu d'ajout + liste d'options. */}
      {addFileMenu &&
        <AddFileSourceMenu
          anchorRect={addFileMenu.rect}
          onClose={() => setAddFileMenu(null)}
          onBack={() => { setAddFileMenu(null); openSlashMenu(); }}
          onSelect={function (key) {
            setAddFileMenu(null);
            if (key === 'computer') { if (fileInputRef.current) fileInputRef.current.click(); }
            else requestMobileFile(key);
          }} />
      }

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileChange} />
    </>
  );
}

// Styles du menu de survol des chips (bouton segmenté Material 3) + confirmation
const cmS = {
  bar: {
    display: 'inline-flex', alignItems: 'center', background: '#fff',
    borderRadius: 8, boxShadow: '0 4px 14px rgba(37,36,94,0.16)',
    fontFamily: "'Inter', sans-serif", userSelect: 'none'
  },
  segStart: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    height: 40, padding: '0 14px', boxSizing: 'border-box',
    border: '1px solid #c3ccd5', borderRadius: '8px 0 0 8px',
    background: '#fff', cursor: 'pointer',
    font: "500 14px 'Inter',sans-serif", color: '#303336', letterSpacing: 0.25
  },
  segMid: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    height: 40, padding: '0 14px', marginLeft: -1, boxSizing: 'border-box',
    border: '1px solid #c3ccd5', borderRadius: 0,
    background: '#fff', cursor: 'pointer',
    font: "500 14px 'Inter',sans-serif", color: '#303336', letterSpacing: 0.25
  },
  segEnd: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    height: 40, width: 44, marginLeft: -1, boxSizing: 'border-box',
    border: '1px solid #c3ccd5', borderRadius: '0 8px 8px 0',
    background: '#fff', cursor: 'pointer'
  },
  confirm: {
    background: '#fff', border: '1px solid #e2e2ec', borderRadius: 12,
    boxShadow: '0 14px 40px rgba(37,36,94,0.22)', padding: '14px 16px 16px',
    fontFamily: "'Inter', sans-serif", animation: 'pop-in 130ms ease-out'
  },
  confirmHead: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  confirmTitle: { font: "600 15px 'Poppins',sans-serif", color: 'rgba(0,0,0,0.85)' },
  confirmClose: { border: 0, background: 'transparent', cursor: 'pointer', padding: 0, display: 'inline-flex', marginTop: -2 },
  confirmBody: { fontSize: 13, color: 'rgba(0,0,0,0.6)', lineHeight: 1.45, margin: '8px 0 14px' },
  confirmActions: { display: 'flex', gap: 8, justifyContent: 'flex-end' },
  btnKeep: {
    border: '1px solid #d0d0e0', borderRadius: 8, background: '#fff',
    padding: '8px 14px', cursor: 'pointer', font: "600 13px 'Inter',sans-serif", color: '#25245E'
  },
  btnDelete: {
    border: 0, borderRadius: 8, background: '#ba1a1a',
    padding: '8px 16px', cursor: 'pointer', font: "600 13px 'Inter',sans-serif", color: '#fff'
  }
};

// ---------------------------------------------------------
// DiagRenamePopover — éditeur inline pour renommer une région diagnostic
// (clic sur son nom dans l'en-tête).
// ---------------------------------------------------------
function DiagRenamePopover({ pos, value, onCommit, onCancel }) {
  const [v, setV] = useStateE(value || '');
  const inputRef = useRefE(null);
  useEffectE(function () {
    if (inputRef.current) { inputRef.current.focus(); inputRef.current.select(); }
  }, []);
  return (
    <div style={{
      position: 'fixed', top: pos.top, left: pos.left, zIndex: 70,
      background: '#fff', border: '1px solid #b3ccf0', borderRadius: 10,
      boxShadow: '0 4px 16px rgba(37,36,94,0.16)',
      display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', minWidth: 240
    }}>
      <span className="material-icons-outlined" style={{ fontSize: 16, color: '#1a5fd4', flexShrink: 0 }}>local_hospital</span>
      <input
        ref={inputRef}
        value={v}
        placeholder="Nom du diagnostic…"
        style={{
          flex: 1, border: 'none', borderBottom: '1.5px solid #1a5fd4', outline: 'none',
          background: 'transparent', font: "500 14px 'Inter',sans-serif", color: 'rgba(0,0,0,0.85)', padding: '2px 2px'
        }}
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); onCommit(v); }
          else if (e.key === 'Escape') { e.preventDefault(); onCancel(); }
        }}
        onBlur={() => onCommit(v)} />
    </div>
  );
}

// ---------------------------------------------------------
// AddFileSourceMenu — sous-menu de « Ajouter des fichiers » (choix de la
// source), même patron que ClinicalToolPicker.jsx : en-tête retour/titre/
// fermer, liste d'options en dessous. « Retour » rouvre le menu d'ajout
// générique (onBack), pas seulement ce sous-menu.
// ---------------------------------------------------------
const ADD_FILE_SOURCES = [
  { key: 'computer', icon: 'computer', label: 'Votre ordinateur' },
  { key: 'mobile', icon: 'smartphone', label: 'Votre cellulaire' },
  { key: 'patient', icon: 'person', label: 'Le patient' }
];

function AddFileSourceMenu({ anchorRect, onBack, onClose, onSelect }) {
  const panelRef = useRefE(null);

  useEffectE(function () {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    function onDoc(e) { if (panelRef.current && !panelRef.current.contains(e.target)) onClose(); }
    window.addEventListener('keydown', onKey);
    // Différé d'un tick : l'item du menu slash qui ouvre ce sous-menu
    // déclenche sur mousedown — sans le délai, ce même mousedown le
    // refermerait aussitôt (voir ClinicalToolPicker, même piège).
    const t = setTimeout(function () { document.addEventListener('mousedown', onDoc); }, 0);
    return function () {
      clearTimeout(t);
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDoc);
    };
  }, [onClose]);

  const panelW = 300;
  const MARGIN = 16;
  let left = MARGIN, top = 80;
  if (anchorRect) {
    left = Math.max(MARGIN, Math.min(anchorRect.left, window.innerWidth - panelW - MARGIN));
    top = anchorRect.bottom + 6;
  }

  return (
    <div ref={panelRef} style={Object.assign({}, afmS.panel, { left: left, top: top, width: panelW })}>
      <div style={afmS.header}>
        <button style={afmS.iconBtn} onClick={onBack || onClose} title="Retour">
          <span className="material-icons-outlined" style={{ fontSize: 20 }}>arrow_back</span>
        </button>
        <span style={afmS.title}>Ajouter des fichiers</span>
        <button style={afmS.iconBtn} onClick={onClose} title="Fermer">
          <span className="material-icons-outlined" style={{ fontSize: 20 }}>close</span>
        </button>
      </div>
      <div style={afmS.list}>
        {ADD_FILE_SOURCES.map(function (opt) {
          return (
            <div key={opt.key} style={afmS.item}
              onMouseEnter={function (e) { e.currentTarget.style.background = '#eef1fb'; }}
              onMouseLeave={function (e) { e.currentTarget.style.background = 'transparent'; }}
              onClick={function () { onSelect(opt.key); }}>
              <span className="material-icons-outlined" style={afmS.itemIcon}>{opt.icon}</span>
              <span style={afmS.itemLabel}>{opt.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const afmS = {
  panel: {
    position: 'fixed', zIndex: 3000, background: '#fff', border: '1px solid #ececf2',
    borderRadius: 12, boxShadow: '0 14px 40px rgba(37,36,94,0.20)',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
    fontFamily: "var(--font-body, 'Inter', sans-serif)",
    animation: 'medmenu-in 140ms var(--motion-ease, cubic-bezier(0.2,0,0,1))'
  },
  header: { display: 'flex', alignItems: 'center', padding: '10px 12px', borderBottom: '1px solid #f0f0f6', flexShrink: 0 },
  iconBtn: { width: 32, height: 32, border: 0, background: 'transparent', borderRadius: 8, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(0,0,0,0.45)' },
  title: { flex: 1, textAlign: 'center', fontSize: 14, fontWeight: 600, color: 'var(--fg-1, rgba(0,0,0,0.82))', fontFamily: "var(--font-head, 'Poppins', sans-serif)" },
  list: { padding: '6px 0' },
  item: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer', transition: 'background 110ms' },
  itemIcon: { fontSize: 20, color: 'rgba(0,0,0,0.5)', flexShrink: 0 },
  itemLabel: { fontSize: 14, color: 'var(--fg-1, rgba(0,0,0,0.82))' }
};

window.NoteBody = NoteBody;
