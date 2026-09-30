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
  const [lineBtnOffset, setLineBtnOffset] = useStateE(null); // null = CSS default (unfocused) — partagé par + et Tt, qui suivent tous deux la ligne du curseur
  const [chipMenu, setChipMenu] = useStateE(null); // { cid, rect } — hover menu (Modifier / Prescrire / ⋮) on order chips
  const [chipDelete, setChipDelete] = useStateE(null); // { cid, rect } — delete confirmation popover
  const [chipMore, setChipMore] = useStateE(null); // { cid, rect } — sous-menu « ⋮ » du chip
  const [chipCancel, setChipCancel] = useStateE(null); // { cid, rect } — confirmation « Annuler l'ordonnance / la requête » (chip transmis)
  const chipMenuTimerRef = useRefE(null);
  const addBtnRef = useRefE(null);
  const fileInputRef = useRefE(null);
  const [dxEdit, setDxEdit] = useStateE(null); // { id, region, mode, rect, otherMentionsCount } — DxEditPopover (edit/refine)
  const [addFileMenu, setAddFileMenu] = useStateE(null); // { rect } — choix de la source (ordinateur/cellulaire/patient)
  const [tplMenu, setTplMenu] = useStateE(null); // { rect } — sous-menu « Gabarits de note »
  const [diagRefMenu, setDiagRefMenu] = useStateE(null); // { rect, diagnostics } — sous-menu « Renvoi à un diagnostic »
  const [diagDocMenu, setDiagDocMenu] = useStateE(null); // { dxKey, number, rect, ctx } — menu « Documenter comme »

  // Section du Sommaire (base, hors superposition de la note) où vit une
  // ligne liée — pour le libellé « Déjà aux problèmes… » vs « Ajouté aux… »
  // dans diagDocMenuItems (diagnostics.jsx). null si non liée ou si le
  // Sommaire n'a encore rien publié.
  function dxBaseKindFor(sommaireId) {
    if (!sommaireId) return null;
    const base = window.__SOMMAIRE_DX_BASE;
    if (!base) return null;
    if ((base.problems || []).some(function (r) { return r.id === sommaireId; })) return 'problems';
    if ((base.history || []).some(function (r) { return r.id === sommaireId; })) return 'history';
    return null;
  }

  // Applique la documentation (Problème/Antécédent/Non documenté — D1) à
  // TOUTES les occurrences du fil (patchDiagRegions, editor-schema.jsx) —
  // renommer/Cesser/Remplacer ne touchent qu'une occurrence, mais documenter
  // est un état du FIL, pas d'une seule région (voir dxThreadIdentity).
  function commitDiagDocumentation(dxKey, value) {
    const editor = editorRef.current;
    if (!editor) return;
    const model = window.getDiagModel(editor);
    const thread = model.byKey[dxKey];
    if (!thread) return;
    const now = new Date().toISOString();
    const author = window.__CURRENT_AUTHOR || null;
    const patches = thread.occurrences.map(function (o) {
      return { id: o.id, patch: { documentAs: value, documentedAt: value ? now : null, documentedBy: value ? author : null } };
    });
    window.patchDiagRegions(editor, patches);
    editor.commands.focus();
  }

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

  // Insère le chip d'ordonnance riche (posologie complète) à la position de
  // « /rx query » (ou /lab /img /ref). Porté de l'ancien insertOrderChip
  // Quill : « cesser » construit un chip barré sans posologie ; « ajuster »
  // rouvre la modale complète juste après l'insertion.
  function runOrderCommand(editor, range, props) {
    const kind = props.kind, item = props.item, action = props.action;
    // Plusieurs résultats cochés, un profil, ou la recherche unifiée /req :
    // une puce labo pour les analyses, une puce par examen d'imagerie
    // (buildRequestChips, editor-schema.jsx).
    if (props.items || kind === 'req' || (item && item.profile)) {
      const list = props.items || (item ? [item] : []);
      const stamp = { savedAt: new Date().toISOString(), author: window.__CURRENT_AUTHOR || null };
      const nodes = [];
      window.buildRequestChips(list, kind === 'req' ? null : kind).forEach(function (a) {
        nodes.push({ type: 'chip', attrs: Object.assign(a, stamp) }, { type: 'text', text: ' ' });
      });
      if (nodes.length) editor.chain().focus().insertContentAt(range, nodes).run();
      return;
    }
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
      { type: 'chip', attrs: { cid: chipId, type: def.type, label: label, icon: def.icon, text: text, rx: rx, details: itemDetails, savedAt: new Date().toISOString(), author: window.__CURRENT_AUTHOR || null } },
      { type: 'text', text: ' ' }
    ]).run();
    if (action === 'ajuster') {
      requestAnimationFrame(function () {
        const node = editor.view.dom.querySelector('[data-cid="' + chipId + '"]');
        if (node && onChipClickRef.current) onChipClickRef.current(chipId, node.getBoundingClientRect(), { action: 'modal' });
      });
    }
  }

  // Crée (bientôt aussi : Reprend/Remplace/Cesse — dx-picker.jsx) une région
  // diagnostic à la position de « /dx query » : en-tête + un paragraphe de
  // corps vide, curseur placé dans ce paragraphe. makeDiagRegionAttrs
  // (diagnostics.jsx) est le seul endroit qui construit ses attributs.
  function runDiagnosticCommand(editor, range, props) {
    const now = new Date().toISOString();
    const attrs = window.makeDiagRegionAttrs(props, { id: window.newDiagId(), now: now, author: window.__CURRENT_AUTHOR || null });
    if (!attrs) return;
    // Ouvert depuis le « + » Problèmes / Antécédents du Sommaire : documenté d'emblée.
    if (window.__DX_DOCUMENT_AS && props.action === 'nouveau' && !attrs.documentAs) {
      Object.assign(attrs, { documentAs: window.__DX_DOCUMENT_AS, documentedAt: now, documentedBy: window.__CURRENT_AUTHOR || null });
    }
    window.__DX_DOCUMENT_AS = null;
    const diagId = attrs.id;
    const diagnosticContent = {
      type: 'diagnosticRegion',
      attrs: attrs,
      content: [{ type: 'paragraph' }]
    };
    // Si « /dx query » occupe tout le paragraphe courant (ligne vide avant
    // la commande), on remplace ce paragraphe en entier plutôt que la simple
    // plage de texte : sinon ProseMirror doit scinder le paragraphe pour loger
    // ce node bloc et laisse une ligne vide résiduelle AVANT la région.
    const $from = editor.state.doc.resolve(range.from);
    const insertRange = ($from.parent.type.name === 'paragraph' && $from.start() === range.from && $from.end() === range.to)
      ? { from: $from.before(), to: $from.after() }
      : range;
    editor.chain().focus().insertContentAt(insertRange, diagnosticContent).run();
    // La position exacte de la région dépend de la façon dont ProseMirror l'a
    // placée — on la retrouve plutôt que de calculer depuis insertRange.from,
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
  // {__order, item, action, kind} (RxMenu), soit {__dx, action, pick, target}
  // (DiagnosticDropdown — voir makeDiagRegionAttrs, diagnostics.jsx).
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
    if (it.notePicker) {
      const coords = editor.view.coordsAtPos(range.from);
      const rect = { left: coords.left, right: coords.left, top: coords.top, bottom: coords.bottom, width: 0, height: coords.bottom - coords.top, x: coords.left, y: coords.top };
      editor.chain().focus().deleteRange(range).run();
      setTplMenu({ rect });
      return;
    }
    if (it.diagRefPicker) {
      const coords = editor.view.coordsAtPos(range.from);
      const rect = { left: coords.left, right: coords.left, top: coords.top, bottom: coords.bottom, width: 0, height: coords.bottom - coords.top, x: coords.left, y: coords.top };
      // Capturé au moment de l'ouverture, pas relu à la sélection : la liste
      // ne peut pas changer pendant que ce petit picker est ouvert (l'éditeur
      // perd le focus), même convention que ClinicalToolPicker/NoteTemplateMenu.
      const diagnostics = window.listDiagnostics(editor.state.doc);
      editor.chain().focus().deleteRange(range).run();
      setDiagRefMenu({ rect, diagnostics });
      return;
    }
    if (it.noteTemplate) {
      editor.chain().focus().deleteRange(range).run();
      window.dispatchEvent(new CustomEvent('note:apply-template', { detail: { key: it.noteTemplate } }));
      return;
    }
    if (it.confidentialField) {
      // Le champ lui-même vit hors du document (voir NoteEditor.jsx) — cet
      // item ne fait qu'ouvrir l'avertissement, comme ctPicker au-dessus
      // ouvre un composant qui vit dans NoteEditor plutôt que NoteBody.
      editor.chain().focus().deleteRange(range).run();
      window.dispatchEvent(new CustomEvent('note:confidential-field-request'));
      return;
    }
    if (it.template) {
      const chipId = window.newChipId();
      const meta = window.NOTE_DATA.ENTITY_TYPES[it.template.type] || {};
      editor.chain().focus().insertContentAt(range, [
        { type: 'chip', attrs: { cid: chipId, type: it.template.type, label: it.template.label, icon: meta.icon || 'bookmark', text: it.template.text || it.template.label, rx: null, details: it.template.details || null, savedAt: new Date().toISOString(), author: window.__CURRENT_AUTHOR || null } },
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
    let selectedIndex = 0, currentItems = [], currentClientRect = null, currentRange = null, lastQuery = '';
    // État du picker /dx (dx-picker.jsx) — vit dans cette fermeture comme
    // selectedIndex pour les autres modes ; reconstruit à chaque appel de
    // publish() via dxBuildModel, jamais recalculé séparément pour le
    // clavier et l'affichage (voir l'en-tête de dx-picker.jsx : c'était le
    // piège de searchDx, deux appels indépendants).
    let dxState = null, dxModel = null, dxSelfRewrite = false;
    // Sélection multiple des recherches de requêtes (ORDER_DEFS[kind].multi :
    // /req, /lab, /img) : items cochés, gardés quand la recherche change,
    // ajoutés d'un coup par Entrée ou « Ajouter (n) ».
    let checked = [];
    function checkUid(it, kind) { return (it.orderKind || kind) + ':' + it.key; }
    function toggleChecked(it, kind) {
      const u = checkUid(it, kind);
      const i = checked.findIndex(function (c) { return checkUid(c, c.__kind) === u; });
      if (i >= 0) checked.splice(i, 1);
      else checked.push(Object.assign({}, it, { __kind: kind }));
    }

    function initialIndex() { return 0; }

    // Contexte lu à chaque (re)construction du modèle /dx : fils de la note
    // (par dxKey, décorations à jour via getDiagModel), lignes du Sommaire
    // (base + superposition en attente, via getSommaireDiagnostics) et
    // façade CIM-10 (peut ne pas être prête — dxBuildModel s'en accommode).
    function dxCtx() {
      const editor = editorRef.current;
      return {
        threads: editor ? window.getDiagModel(editor).threads : [],
        sommaire: window.getSommaireDiagnostics ? window.getSommaireDiagnostics() : [],
        cim: window.CIM10 || null,
        snomed: window.SNOMED || null
      };
    }

    // Réécrit « /dx <ancien terme> » en « /dx <nouveau terme> » sans altérer
    // l'historique (undo) — utilisé par les effets `setTerm` de dxStep
    // (drill, remonter, fil d'Ariane) : le terme affiché doit suivre le
    // niveau courant de l'arbre CIM-10 sans que l'utilisateur retape rien.
    // dxSelfRewrite distingue cette réécriture d'une vraie frappe pour
    // onUpdate, qui sinon réinitialiserait la sélection du picker (voir plus bas).
    function rewriteDxTerm(term) {
      const editor = editorRef.current;
      if (!editor || !currentRange) { publish(lastQuery); return; }
      const next = '/dx ' + term;
      // drillTo/popStack effacent presque toujours le terme (retour à '') —
      // si le terme AFFICHÉ est déjà celui-là (cas le plus fréquent : ouvrir
      // « Parcourir la CIM-10 » sans avoir tapé de recherche), le texte du
      // document ne change pas du tout : insertContentAt ne produit alors
      // aucune transaction, et onUpdate (donc publish) ne se redéclenche
      // jamais tout seul. dxState porte déjà le nouvel état (assigné par
      // l'appelant avant applyDxEffects) — il ne reste qu'à republier nous-
      // mêmes pour que l'affichage suive.
      if (editor.state.doc.textBetween(currentRange.from, currentRange.to, '\n') === next) { publish(lastQuery); return; }
      dxSelfRewrite = true;
      editor.chain().focus().insertContentAt(currentRange, next).run();
    }

    // Exécute les effets renvoyés par dxStep — setTerm réécrit la requête
    // (déclenche onUpdate, qui republie avec le nouveau terme), commit
    // délègue à runDiagnosticCommand (editor-field.jsx) via le `command` du
    // plugin (ce qui ferme aussi le picker), close ferme sans rien insérer.
    // relabel n'apparaît jamais ici : ce contrôleur n'ouvre le picker qu'en
    // intent 'nouveau', jamais 'edit'/'refine' (réservés à DxEditPopover).
    function applyDxEffects(effects) {
      effects.forEach(function (effect) {
        if (effect.type === 'setTerm') { rewriteDxTerm(effect.term); }
        else if (effect.type === 'commit' && slashCommandRef.current) {
          slashCommandRef.current({ __dx: true, action: effect.payload.action, pick: effect.payload.pick || null, target: effect.payload.target || null });
        } else if (effect.type === 'close') { setSlash(null); }
      });
    }

    // Menu générique : même une requête avec espace et 0 résultat reste
    // affichée (message « aucun résultat » + indice Échap) — plus de
    // fermeture silencieuse qui laissait la requête devenir du texte libre
    // sans que l'utilisateur comprenne pourquoi. Les modes ordre/dx ne
    // « renoncent » jamais non plus — RxMenu/DiagnosticDropdown affichent
    // leur propre message « rien trouvé ».
    function publish(query) {
      const parsed = parseSlashQuery(query);
      if (parsed.mode !== 'dx') { dxState = null; dxModel = null; }
      if (parsed.mode === 'order') {
        const results = window.NOTE_DATA.searchOrder(parsed.kind, (parsed.term || '').trim());
        setSlash({ mode: 'order', kind: parsed.kind, query: (parsed.term || '').trim(), results: results, activeIndex: selectedIndex, rect: currentClientRect ? currentClientRect() : null,
          checked: checked.map(function (c) { return checkUid(c, c.__kind); }) });
        return;
      }
      if (parsed.mode === 'dx') {
        if (!dxState) dxState = window.dxInitState({ kind: 'nouveau' });
        dxModel = window.dxBuildModel(dxState, parsed.term || '', dxCtx());
        setSlash({
          mode: 'dx', model: dxModel, actionFocus: dxState.actionFocus,
          activeIndex: window.dxActiveIndex(dxState, dxModel),
          rect: currentClientRect ? currentClientRect() : null
        });
        return;
      }
      setSlash({ mode: 'menu', items: currentItems, activeIndex: selectedIndex, query: query, rect: currentClientRect ? currentClientRect() : null });
    }
    const api = {
      onStart(props) {
        selectedIndex = initialIndex();
        checked = [];
        dxState = null; dxModel = null; dxSelfRewrite = false;
        currentItems = props.items; currentClientRect = props.clientRect; currentRange = props.range; lastQuery = props.query;
        slashCommandRef.current = props.command;
        publish(props.query);
      },
      onUpdate(props) {
        const parsed = parseSlashQuery(props.query);
        if (dxSelfRewrite) {
          dxSelfRewrite = false; // réécriture déclenchée par un effet setTerm — dxState déjà à jour, ne pas retoucher la sélection
        } else if (parsed.mode === 'dx' && dxState) {
          // Vraie frappe pendant que le picker est déjà ouvert : la sélection
          // se réinitialise (même règle que l'événement 'term' non-self de
          // dxStep), mais intent/vue/pile restent (on continue de chercher
          // dans le même sous-arbre CIM-10 si on y était).
          dxState = Object.assign({}, dxState, { activeIndex: null, actionFocus: 0 });
        } else if (props.query !== lastQuery) {
          selectedIndex = initialIndex();
        }
        lastQuery = props.query; currentItems = props.items; currentClientRect = props.clientRect; currentRange = props.range;
        slashCommandRef.current = props.command;
        publish(props.query);
      },
      onKeyDown(props) {
        const parsed = parseSlashQuery(lastQuery);
        if (parsed.mode === 'dx') {
          if (!dxState || !dxModel) return false;
          const evt = { type: 'key', key: props.event.key, mod: props.event.metaKey || props.event.ctrlKey || props.event.altKey };
          const result = window.dxStep(dxState, evt, dxModel);
          if (!result.handled) return false;
          dxState = result.state;
          applyDxEffects(result.effects);
          if (result.effects.length === 0) publish(lastQuery);
          return true;
        }
        if (props.event.key === 'Escape') { setSlash(null); return true; }
        // Menu générique sans aucun résultat : on n'intercepte plus les
        // flèches/Entrée (rien à sélectionner) — la frappe continue
        // normalement, le message « aucun résultat » reste affiché via publish().
        if (parsed.mode === 'menu' && currentItems.length === 0) return false;
        if (props.event.key === 'ArrowDown') {
          selectedIndex = Math.min(currentItems.length - 1, selectedIndex + 1);
          publish(lastQuery); return true;
        }
        if (props.event.key === 'ArrowUp') {
          selectedIndex = Math.max(0, selectedIndex - 1);
          publish(lastQuery); return true;
        }
        const orderDef = parsed.mode === 'order' ? window.NOTE_DATA.ORDER_DEFS[parsed.kind] : null;
        // ⇧ Entrée : coche / décoche le résultat actif, le menu reste ouvert.
        if (props.event.key === 'Enter' && props.event.shiftKey && orderDef && orderDef.multi) {
          const it = currentItems[selectedIndex];
          if (it) { toggleChecked(it, parsed.kind); publish(lastQuery); }
          return true;
        }
        if (props.event.key === 'Enter' || props.event.key === 'Tab') {
          if (!slashCommandRef.current) return true;
          if (parsed.mode === 'order' && checked.length) {
            const items = checked.slice(); checked = [];
            slashCommandRef.current({ __order: true, items: items, kind: parsed.kind });
            return true;
          }
          if (parsed.mode === 'order') {
            const it = currentItems[selectedIndex];
            if (it) {
              const isActiveMed = it.med && it.medStatus === 'active';
              slashCommandRef.current({ __order: true, item: it, action: isActiveMed ? 'renouveler' : undefined, kind: parsed.kind });
            }
          } else {
            const it = currentItems[selectedIndex];
            if (it) slashCommandRef.current(it);
          }
          return true;
        }
        return false;
      },
      onExit() { checked = []; window.__DX_DOCUMENT_AS = null; setSlash(null); },
      setActiveIndex(idx) { selectedIndex = idx; publish(lastQuery); },
      // Souris (RxMenu) : case à cocher d'un résultat, bouton « Ajouter (n) ».
      toggleCheck(it) { const parsed = parseSlashQuery(lastQuery); toggleChecked(it, parsed.kind); publish(lastQuery); },
      addChecked() {
        const parsed = parseSlashQuery(lastQuery);
        if (!checked.length || !slashCommandRef.current) return;
        const items = checked.slice(); checked = [];
        slashCommandRef.current({ __order: true, items: items, kind: parsed.kind });
      },
      republish() { publish(lastQuery); },
      // Événements souris du picker /dx (DxRow/DxList — editor-popover.jsx) :
      // même réducteur que le clavier (dxStep), pour que survol/clic/fil
      // d'Ariane restent cohérents avec ↑↓/→/←/Entrée sans dupliquer la logique.
      dxEvent(evt) {
        if (!dxState || !dxModel) return;
        const result = window.dxStep(dxState, evt, dxModel);
        dxState = result.state;
        applyDxEffects(result.effects);
        if (result.effects.length === 0) publish(lastQuery);
      }
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
      { type: 'chip', attrs: { cid: chipId, type: 'file', label: name, icon: icon, text: name, rx: null, details: { url: url }, savedAt: new Date().toISOString(), author: window.__CURRENT_AUTHOR || null } },
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
    '<rect x="60" y="60" width="780" height="1080" fill="#fff" stroke="var(--mat-sys-outline-variant)" stroke-width="2"/>' +
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
  // son en-tête (.dxr-name/.dxr-code/.dxr-refine/.dxr-doc), non géré par le
  // NodeView lui-même.
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

  // Ouvre DxEditPopover sur le nom/code (mode 'edit') ou le bouton « Préciser »
  // (mode 'refine', dxCanRefine) d'une région existante — anchorEl sert au
  // positionnement (dxMenuPlacement), attrs à l'intent initial de dx-picker
  // (dxInitState). otherMentionsCount (indice « Renomme aussi N autres
  // mentions ») : occurrences du MÊME fil qui portent encore la version
  // actuelle (nom+code) — celles qu'un renommage toucherait aussi, hors
  // celle-ci (voir diagRelabelPatches, appliqué tel quel à la validation).
  function openDxEdit(regionPos, attrs, mode, anchorEl) {
    const editor = editorRef.current;
    const rect = anchorEl.getBoundingClientRect();
    const thread = editor && window.getDiagModel(editor).byKey[attrs.dxKey];
    const version = { name: attrs.name, code: attrs.code || null };
    const otherMentionsCount = thread
      ? thread.occurrences.filter(function (o) {
          return o.id !== attrs.id && o.attrs.name === version.name && (o.attrs.code || null) === version.code;
        }).length
      : 0;
    setDxEdit({ pos: regionPos, region: attrs, mode: mode, rect: rect, otherMentionsCount: otherMentionsCount });
  }

  // Applique un renommage/reclassement (relabel de dx-picker.jsx — DxEditPopover)
  // à TOUTES les occurrences de la même version, via diagRelabelPatches
  // (diagnostics.jsx) + patchDiagRegions (editor-schema.jsx), en une seule
  // transaction. Un `replaces` qui visait cette version est aussi mis à jour.
  function commitDxRelabel(editedId, to) {
    const editor = editorRef.current;
    if (!editor || !editedId) return;
    const model = window.getDiagModel(editor);
    const allOccurrences = model.threads.reduce(function (acc, t) { return acc.concat(t.occurrences); }, []);
    const patches = window.diagRelabelPatches(allOccurrences, editedId, to, {
      now: new Date().toISOString(), author: window.__CURRENT_AUTHOR || null
    });
    if (patches.length) window.patchDiagRegions(editor, patches);
    editor.commands.focus();
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

  function updateLineBtnPos(editor) {
    try {
      const { from } = editor.state.selection;
      const coords = editor.view.coordsAtPos(from);
      const rootRect = editor.view.dom.getBoundingClientRect();
      const mid = coords.top - rootRect.top + (coords.bottom - coords.top) / 2;
      setLineBtnOffset(Math.max(0, mid - 15));
    } catch (e) {}
  }

  // Le numéro de chaque puce « Renvoi à un diagnostic » (.dxref) est
  // maintenant posé par décoration (dxNumberingPlugin, editor-schema.jsx),
  // recalculée par ProseMirror à chaque transaction — plus besoin de le
  // faire ici. Il ne reste que window.__HAS_DIAGNOSTICS, lu par
  // filterSlashItems pour n'offrir le picker « Renvoi à un diagnostic » que
  // si la note contient déjà au moins un diagnostic (un FIL, pas une
  // occurrence — une reprise ne compte pas deux fois).
  function syncDiagFlags(editor) {
    window.__HAS_DIAGNOSTICS = window.getDiagModel(editor).threads.length > 0;
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
      // ensureSplit : tout document venu d'ailleurs (brouillon repris, dernière
      // note, gabarit, note d'avant cette fonctionnalité) reçoit sa ligne de
      // séparation — à la place de son ancien Titre 2 « Conclusion » quand il
      // en avait un, sinon à la fin. prepareDiagDoc (diagnostics.jsx) fait de
      // même pour les diagnostics : recale newDiagId, corrige les ids/dxKey
      // manquants ou dupliqués, migre l'ancien promotedAt/promotedBy. Un seul
      // point de passage pour tous les chemins de montage.
      content: window.prepareDiagDoc(window.ensureSplit(initialDoc || window.DEFAULT_DOC())),
      editorProps: {
        attributes: { class: 'ql-editor ProseMirror' }
      },
      onUpdate({ editor }) {
        onDocChange(editor.getJSON());
        updateLineBtnPos(editor);
        syncDiagFlags(editor);
      },
      onSelectionUpdate({ editor }) {
        updateLineBtnPos(editor);
      }
    });
    editorRef.current = editor;
    hostRef.current.__editor = editor;
    updateLineBtnPos(editor);
    // Le contenu initial (brouillon, dernière note, gabarit) n'émet pas
    // d'update — on amorce nous-mêmes compteurs/Sommaire une seule fois.
    onDocChange(editor.getJSON());
    syncDiagFlags(editor);
    if (onReady) onReady(editor);

    // La CIM-10 peut finir de charger après le montage (fetch asynchrone,
    // Note Clinique.html) : canRefine (posé dans les décorations,
    // dxNumberingPlugin) dépend de son index. Une transaction à méta
    // dxRefresh force le plugin à se reconstruire sans rien changer au doc.
    function onCim10Ready() {
      editor.view.dispatch(editor.state.tr.setMeta('dxRefresh', true).setMeta('addToHistory', false));
    }
    window.addEventListener('cim10:ready', onCim10Ready);

    // Diagnostic header — clic sur le nom → renommer ; clic sur le bouton →
    // documenter comme problème (écouté par Summary.jsx via note:add-problem
    // — bouton et libellé « Promouvoir » inchangés ici ; le menu « Documenter
    // comme » et le pont déclaratif avec le Sommaire arrivent avec la suite
    // de la branche diagnostics).
    editor.view.dom.addEventListener('mousedown', (e) => {
      const refEl = e.target.closest('.dxref');
      if (refEl) {
        e.preventDefault();
        // Puce cassée (diagnostic référencé supprimé depuis) : rien à
        // ouvrir — voir le NodeView de diagnosticRef (editor-schema.jsx) qui
        // pose dxref-broken quand la décoration ne porte aucun numéro.
        if (refEl.classList.contains('dxref-broken')) return;
        // Par dxKey (le FIL visé) d'abord — la seule forme que produisent les
        // nouveaux renvois ; data-diag-id reste lu pour un renvoi ancien
        // (diagId) collé avant cette fonctionnalité, résolu vers la PREMIÈRE
        // occurrence de son fil via getDiagModel.byId.
        const dxKey = refEl.getAttribute('data-dx-key');
        let target = dxKey && editor.view.dom.querySelector('.dxr[data-dx-key="' + CSS.escape(dxKey) + '"]');
        if (!target) {
          const id = refEl.getAttribute('data-diag-id');
          const entry = id && window.getDiagModel(editor).byId[id];
          if (entry) target = editor.view.dom.querySelector('.dxr[data-dx-key="' + CSS.escape(entry.dxKey) + '"]');
        }
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
          target.classList.add('dxr-flash');
          setTimeout(() => target.classList.remove('dxr-flash'), 900);
        }
        return;
      }
      // Nom OU code : mode 'edit' (DxEditPopover) — un renommage libre ne
      // change que le nom (le code est conservé), choisir un code CIM-10
      // change nom+code+niveau (voir dx-picker.jsx, intent 'edit').
      const nameOrCodeEl = e.target.closest('.dxr-name, .dxr-code');
      if (nameOrCodeEl) {
        e.preventDefault();
        const regionPos = findRegionPosFromDOM(editor, nameOrCodeEl);
        if (regionPos >= 0) {
          const node = editor.state.doc.nodeAt(regionPos);
          if (node) openDxEdit(regionPos, node.attrs, 'edit', nameOrCodeEl);
        }
        return;
      }
      const refineEl = e.target.closest('.dxr-refine');
      if (refineEl) {
        e.preventDefault();
        const regionPos = findRegionPosFromDOM(editor, refineEl);
        if (regionPos >= 0) {
          const node = editor.state.doc.nodeAt(regionPos);
          if (node) openDxEdit(regionPos, node.attrs, 'refine', refineEl);
        }
        return;
      }
      const docEl = e.target.closest('.dxr-doc');
      if (docEl) {
        e.preventDefault();
        const regionPos = findRegionPosFromDOM(editor, docEl);
        if (regionPos >= 0) {
          const node = editor.state.doc.nodeAt(regionPos);
          const model = node && window.getDiagModel(editor);
          const thread = model && model.byKey[node.attrs.dxKey];
          if (thread) {
            const e2 = thread.effective;
            setDiagDocMenu({
              dxKey: thread.dxKey, number: thread.number, rect: docEl.getBoundingClientRect(),
              ctx: { documentAs: e2.documentAs, ceased: e2.status === 'cesse', linked: !!e2.sommaireId, baseKind: dxBaseKindFor(e2.sommaireId) }
            });
          }
        }
      }
    });

    // Chip click handler — detects which zone was clicked (data-field or data-action)
    editor.view.dom.addEventListener('mousedown', (e) => {
      const chipEl = e.target.closest('.chip[data-cid]');
      if (!chipEl) return;
      e.preventDefault();
      // Ajout en attente (gabarit) : rien à ouvrir, seuls ✓ / ✕ agissent (click, ci-dessous).
      if (chipEl.classList.contains('chip--pending')) return;
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

    // Double-clic sur un chip en attente : ses détails, pour le vérifier et
    // l'ajuster avant de l'accepter (Q-07 renversée, rencontre inline entity).
    editor.view.dom.addEventListener('dblclick', (e) => {
      const chipEl = e.target.closest('.chip--pending[data-cid]');
      if (!chipEl || e.target.closest('.chip-pending-btn')) return;
      e.preventDefault();
      onChipClickRef.current(chipEl.getAttribute('data-cid'), chipEl.getBoundingClientRect(), { action: 'modal' });
    });

    // ✓ / ✕ d'un chip en attente — sur `click` (pas mousedown) pour que Entrée /
    // Espace au clavier sur le bouton focalisé marchent aussi.
    editor.view.dom.addEventListener('click', (e) => {
      const btn = e.target.closest('.chip--pending [data-pending]');
      if (!btn) return;
      const cid = btn.closest('.chip[data-cid]').getAttribute('data-cid');
      if (btn.getAttribute('data-pending') === 'accept') window.acceptPendingChip(editor, cid);
      else window.rejectPendingChip(editor, cid);
    });

    // Hover menu (Modifier / Prescrire / ⋮) on order chips — show on chip hover,
    // close shortly after the pointer leaves (cancelled if it enters the menu).
    editor.view.dom.addEventListener('mouseover', (e) => {
      const chipEl = e.target.closest('.chip--rx[data-cid]:not(.chip--pending)');
      if (!chipEl) return;
      cancelChipMenuClose();
      const cid = chipEl.getAttribute('data-cid');
      setChipMenu((cm) => (cm && cm.cid === cid) ? cm : { cid, rect: chipEl.getBoundingClientRect() });
    });
    editor.view.dom.addEventListener('mouseout', (e) => {
      if (e.target.closest('.chip--rx[data-cid]')) scheduleChipMenuClose();
    });

    return () => {
      window.removeEventListener('cim10:ready', onCim10Ready);
      editor.destroy();
      editorRef.current = null;
      if (onReady) onReady(null);
    };
  }, []);

  // Texte d'un chip une fois « gardé en texte » : le même que dans la liste
  // des notes et à l'impression (chipPrintText, editor-schema.jsx).
  function chipPlainText(cid) {
    const editor = editorRef.current; if (!editor) return '';
    return window.chipPrintText(window.chipAttrs(editor, cid));
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

  // Puce dont le formulaire est ouvert (NoteEditor → linkedChipId) : contour.
  useEffectE(function () {
    const editor = editorRef.current;
    if (!editor) return undefined;
    const dom = editor.view.dom;
    dom.querySelectorAll('.chip--editing').forEach(function (el) { el.classList.remove('chip--editing'); });
    const el = linkedChipId && dom.querySelector('.chip[data-cid="' + linkedChipId + '"]');
    if (el) el.classList.add('chip--editing');
    return function () { if (el) el.classList.remove('chip--editing'); };
  }, [linkedChipId]);

  // Fermer le dialogue de suppression sans rien faire : le focus revient à
  // la note, la puce reste sélectionnée (Backspace de nouveau le rouvre).
  function closeChipDelete() {
    setChipDelete(null);
    if (editorRef.current) editorRef.current.commands.focus();
  }

  // Demandes venues du clavier (makeChipKeysExtension, editor-schema.jsx) :
  // Backspace / Delete sur une puce sélectionnée ou sur une sélection qui
  // en contient → dialogue ; Entrée sur une puce sélectionnée → ses détails.
  useEffectE(function () {
    function chipRect(cid) {
      const el = editorRef.current && editorRef.current.view.dom.querySelector('.chip[data-cid="' + cid + '"]');
      return el ? el.getBoundingClientRect() : null;
    }
    function onDeleteRequest(e) {
      const d = e.detail || {};
      if (!editorRef.current || d.editor !== editorRef.current) return;
      setChipMenu(null); setChipMore(null);
      if (d.range) {
        const c = editorRef.current.view.coordsAtPos(d.range.to);
        setChipDelete({ cids: d.cids, range: d.range, rect: { left: c.left, right: c.right, top: c.top, bottom: c.bottom } });
        return;
      }
      const rect = chipRect(d.cid);
      if (rect) setChipDelete({ cid: d.cid, rect: rect });
    }
    function onOpenRequest(e) {
      const d = e.detail || {};
      if (!editorRef.current || d.editor !== editorRef.current) return;
      const rect = chipRect(d.cid);
      if (!rect || !onChipClickRef.current) return;
      // Valeur secondaire ciblée au clavier (Tab) : son éditeur inline.
      if (d.field) onChipClickRef.current(d.cid, rect, { field: d.field, fieldRect: d.fieldRect || rect });
      else onChipClickRef.current(d.cid, rect, { action: 'modal' });
    }
    window.addEventListener('note:chip-delete-request', onDeleteRequest);
    window.addEventListener('note:chip-open-request', onOpenRequest);
    return function () {
      window.removeEventListener('note:chip-delete-request', onDeleteRequest);
      window.removeEventListener('note:chip-open-request', onOpenRequest);
    };
  }, []);

  useEffectE(function () {
    if (!chipDelete && !chipMenu && !chipMore && !chipCancel) return;
    function onKey(e) {
      if (e.key !== 'Escape') return;
      if (chipDelete) closeChipDelete();
      setChipMenu(null); setChipMore(null); setChipCancel(null);
    }
    document.addEventListener('keydown', onKey);
    return function () { document.removeEventListener('keydown', onKey); };
  }, [chipDelete, chipMenu, chipMore, chipCancel]);

  return (
    <>
      <div className="note-field-shell">
        <button
          ref={addBtnRef}
          type="button" className="nf-add" title="Insérer une fonction"
          style={lineBtnOffset !== null ? { marginTop: lineBtnOffset + 'px' } : undefined}
          onMouseDown={(e) => e.preventDefault()}
          onClick={openSlashMenu}>
          <span className="material-icons-outlined">add_circle_outline</span>
        </button>
        <div ref={hostRef} className="note-field" style={{ minHeight: "96px" }} />
        <button
          type="button" className="nf-tt" title="Afficher la barre de mise en forme"
          style={lineBtnOffset !== null ? { marginTop: lineBtnOffset + 'px' } : undefined}
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
        const _isSent = !!(_ent && _ent.transmittedAt);
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
              <span className="material-icons-outlined" style={{ fontSize: 20 }}>{_isSent ? 'visibility' : 'edit'}</span>
              {_isSent ? 'Voir' : 'Modifier'}
            </button>
            {!_isCeased && !_isSent &&
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
              <span className="material-icons-outlined" style={{ fontSize: 20, color: 'var(--mat-sys-on-surface)' }}>more_vert</span>
            </button>
          </div>
        );
      })()}

      {/* Confirmation de suppression — effacer ou conserver en texte */}
      {/* Sélection de texte qui contient des puces (Backspace / Delete) */}
      {chipDelete && chipDelete.range && (function () {
        const r = chipDelete.rect;
        const W = 340;
        const top = r.bottom + 8;
        const left = Math.max(8, Math.min(r.left, window.innerWidth - W - 8));
        const editor = editorRef.current;
        const ents = editor ? chipDelete.cids.map(function (cid) { return window.getChipEntity(editor, cid); }).filter(Boolean) : [];
        const n = ents.length;
        const names = ents.map(function (e) { return (e.rx && e.rx.name) || e.label; }).join(', ');
        const anySent = ents.some(function (e) { return e.transmittedAt; });
        return (
          <React.Fragment>
            <div style={{ position: 'fixed', inset: 0, zIndex: 209 }} onMouseDown={closeChipDelete} />
            <div role="dialog" aria-label="Supprimer la sélection" style={Object.assign({ position: 'fixed', top: top, left: left, width: W, zIndex: 210 }, cmS.confirm)}>
              <div style={cmS.confirmHead}>
                <span style={cmS.confirmTitle}>Supprimer la sélection&nbsp;?</span>
                <button style={cmS.confirmClose} title="Annuler" onClick={closeChipDelete}>
                  <span className="material-icons" style={{ fontSize: 20, color: 'color-mix(in srgb, var(--mat-sys-on-surface) 50%, transparent)' }}>close</span>
                </button>
              </div>
              <p style={cmS.confirmBody}>
                {n > 1 ? 'La sélection contient ' + n + ' éléments' : 'La sélection contient un élément'} ({names}), qui {n > 1 ? 'seront retirés' : 'sera retiré'} de la note.
                {anySent ? ' Ce qui a été transmis n’est pas annulé et reste dans les activités de la note.' : ''}
              </p>
              <div style={cmS.confirmActions}>
                <button style={cmS.btnKeep} autoFocus onClick={closeChipDelete}>Annuler</button>
                <button style={cmS.btnDelete}
                  onClick={() => { const range = chipDelete.range; setChipDelete(null); if (editor) editor.chain().focus().deleteRange(range).run(); }}>
                  Supprimer la sélection
                </button>
              </div>
            </div>
          </React.Fragment>
        );
      })()}

      {chipDelete && !chipDelete.range && (function () {
        const r = chipDelete.rect;
        const ent = editorRef.current ? window.getChipEntity(editorRef.current, chipDelete.cid) : null;
        const isRx = ent && ent.type === 'prescription';
        const noun = isRx ? 'cette prescription' : 'cet élément';
        // Chip transmis (D-05) : le retirer de la note n'annule rien.
        const sent = !!(ent && ent.transmittedAt);
        const W = sent ? 360 : 304; // « Retirer de la note » tient sur une ligne
        const top = r.bottom + 8;
        const left = Math.max(8, Math.min(r.left, window.innerWidth - W - 8));
        const sentWhat = isRx ? 'l’ordonnance transmise' : 'la requête transmise';
        return (
          <React.Fragment>
            <div style={{ position: 'fixed', inset: 0, zIndex: 209 }} onMouseDown={closeChipDelete} />
            <div role="dialog" aria-label={sent ? 'Retirer de la note' : 'Supprimer'} style={Object.assign({ position: 'fixed', top: top, left: left, width: W, zIndex: 210 }, cmS.confirm)}>
              <div style={cmS.confirmHead}>
                <span style={cmS.confirmTitle}>{sent ? 'Retirer ' + noun + ' de la note' : 'Supprimer ' + noun}&nbsp;?</span>
                <button style={cmS.confirmClose} title="Annuler" onClick={closeChipDelete}>
                  <span className="material-icons" style={{ fontSize: 20, color: 'color-mix(in srgb, var(--mat-sys-on-surface) 50%, transparent)' }}>close</span>
                </button>
              </div>
              <p style={cmS.confirmBody}>
                {sent
                  ? <>Retirer {noun} de la note n’annule pas {sentWhat}. Elle reste dans les activités de la note. Pour l’annuler, utilisez le menu ⋮.</>
                  : <>Retirer complètement {noun} de la note, ou la conserver sous forme de texte simple&nbsp;?</>}
              </p>
              <div style={cmS.confirmActions}>
                <button style={cmS.btnKeep} autoFocus
                  onClick={() => { keepChipAsText(chipDelete.cid); setChipDelete(null); }}>
                  Garder en texte
                </button>
                <button style={cmS.btnDelete}
                  onClick={() => { deleteChipFromMenu(chipDelete.cid); setChipDelete(null); }}>
                  {sent ? 'Retirer de la note' : 'Supprimer'}
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
        const item = { display: 'flex', alignItems: 'center', gap: 10, width: '100%', border: 0, background: 'transparent', borderRadius: 8, padding: '9px 12px', cursor: 'pointer', font: "500 14px 'Inter',sans-serif", color: 'var(--mat-sys-on-surface)', textAlign: 'left' };
        const ent = editorRef.current ? window.getChipEntity(editorRef.current, chipMore.cid) : null;
        const sent = !!(ent && ent.transmittedAt);
        // Annuler (D-05) : action clinique séparée de l'effacement, en dernier
        // et sans mise en avant — seulement pour un chip transmis, pas encore annulé.
        const canCancel = sent && !ent.cancelledAt;
        const isRx = ent && ent.type === 'prescription';
        return (
          <React.Fragment>
            <div style={{ position: 'fixed', inset: 0, zIndex: 209 }} onMouseDown={() => setChipMore(null)} />
            <div style={{ position: 'fixed', top: top, left: left, width: W, zIndex: 210, background: 'var(--mat-sys-surface-container-lowest)', border: '1px solid var(--mat-sys-outline-variant)', borderRadius: 10, boxShadow: '0 14px 40px rgba(37,36,94,0.22)', padding: 6, fontFamily: "'Inter',sans-serif", animation: 'pop-in 130ms ease-out' }}>
              <button style={item} onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4fb'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                onClick={() => { keepChipAsText(chipMore.cid); setChipMore(null); }}>
                <span className="material-icons-outlined" style={{ fontSize: 20, color: 'var(--mat-sys-on-surface-variant)' }}>notes</span>
                Convertir en texte
              </button>
              <button style={Object.assign({}, item, { color: 'light-dark(#ba1a1a, #e9a5a5)' })} onMouseEnter={(e) => e.currentTarget.style.background = '#fdecec'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                onClick={() => { setChipDelete({ cid: chipMore.cid, rect: chipMore.rect }); setChipMore(null); }}>
                <span className="material-icons-outlined" style={{ fontSize: 20, color: 'light-dark(#ba1a1a, #e9a5a5)' }}>delete</span>
                {sent ? 'Retirer de la note' : 'Supprimer'}
              </button>
              {canCancel && <div role="separator" style={{ height: 1, margin: '6px 4px', background: 'var(--mat-sys-outline-variant)' }} />}
              {canCancel &&
              <button style={Object.assign({}, item, { font: "400 13px 'Inter',sans-serif", color: 'var(--mat-sys-on-surface-variant)' })} onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4fb'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                onClick={() => { setChipCancel({ cid: chipMore.cid, rect: chipMore.rect }); setChipMore(null); }}>
                <span className="material-icons-outlined" style={{ fontSize: 20, color: 'var(--mat-sys-on-surface-variant)' }}>block</span>
                {isRx ? 'Annuler l’ordonnance…' : 'Annuler la requête…'}
              </button>}
            </div>
          </React.Fragment>
        );
      })()}

      {/* Confirmation « Annuler l'ordonnance / la requête » — chip transmis.
          L'envoi de l'annulation est simulé (note:chip-cancel, NoteEditor.jsx). */}
      {chipCancel && (function () {
        const r = chipCancel.rect;
        const W = 320;
        const top = r.bottom + 8;
        const left = Math.max(8, Math.min(r.left, window.innerWidth - W - 8));
        const ent = editorRef.current ? window.getChipEntity(editorRef.current, chipCancel.cid) : null;
        const isRx = ent && ent.type === 'prescription';
        const what = isRx ? 'l’ordonnance' : 'la requête';
        return (
          <React.Fragment>
            <div style={{ position: 'fixed', inset: 0, zIndex: 209 }} onMouseDown={() => setChipCancel(null)} />
            <div role="dialog" aria-label={'Annuler ' + what} style={Object.assign({ position: 'fixed', top: top, left: left, width: W, zIndex: 210 }, cmS.confirm)}>
              <div style={cmS.confirmHead}>
                <span style={cmS.confirmTitle}>Annuler {what}&nbsp;?</span>
                <button style={cmS.confirmClose} title="Fermer" onClick={() => setChipCancel(null)}>
                  <span className="material-icons" style={{ fontSize: 20, color: 'color-mix(in srgb, var(--mat-sys-on-surface) 50%, transparent)' }}>close</span>
                </button>
              </div>
              <p style={cmS.confirmBody}>
                Une annulation sera envoyée au destinataire. Les activités de la note garderont la transmission, puis l’annulation.
              </p>
              <div style={cmS.confirmActions}>
                <button style={cmS.btnKeep} autoFocus onClick={() => setChipCancel(null)}>Retour</button>
                <button style={cmS.btnDelete}
                  onClick={() => { const cid = chipCancel.cid; setChipCancel(null); window.dispatchEvent(new CustomEvent('note:chip-cancel', { detail: { cid: cid } })); }}>
                  Envoyer l’annulation
                </button>
              </div>
            </div>
          </React.Fragment>
        );
      })()}

      {/* Menu slash (« / » ou bouton « + ») — hauteur bornée à l'espace
          réellement disponible sous le curseur (sinon au-dessus), pour que
          la liste complète (STRUCTURE + GABARITS + FONCTIONS) reste
          consultable par défilement au lieu de déborder de l'écran. */}
      {slash && slash.mode === 'menu' && (() => {
        const MARGIN = 8;
        const HEIGHT_CAP = 600;
        const anchor = slash.rect || { top: 0, bottom: 0, left: 0 };
        const spaceBelow = window.innerHeight - anchor.bottom - MARGIN - 6;
        const spaceAbove = anchor.top - MARGIN - 6;
        let top, maxHeight;
        if (spaceBelow >= 200 || spaceBelow >= spaceAbove) {
          top = anchor.bottom + 6;
          maxHeight = Math.max(120, Math.min(HEIGHT_CAP, spaceBelow));
        } else {
          maxHeight = Math.max(120, Math.min(HEIGHT_CAP, spaceAbove));
          top = Math.max(MARGIN, anchor.top - 6 - maxHeight);
        }
        return (
          <SlashMenu
            position={{ top: top, left: Math.max(8, Math.min(anchor.left, window.innerWidth - 332)), maxHeight: maxHeight }}
            query={slash.query}
            activeIndex={slash.activeIndex}
            items={slash.items}
            onSelect={chooseSlashItem}
            onClose={() => setSlash(null)} />
        );
      })()}

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
          checked={slash.checked || []}
          onToggleCheck={(it) => { if (slashApiRef.current) slashApiRef.current.toggleCheck(it); }}
          onAddChecked={() => { if (slashApiRef.current) slashApiRef.current.addChecked(); }}
          onClose={() => setSlash(null)} />
      }

      {/* Mode diagnostic — /dx (dx-picker.jsx : Dans cette note → Sommaire → CIM-10) */}
      {slash && slash.mode === 'dx' && (() => {
        const anchor = slash.rect || { top: 0, bottom: 0, left: 0 };
        const placement = window.dxMenuPlacement(
          { top: anchor.top, bottom: anchor.bottom, left: anchor.left },
          { w: window.innerWidth, h: window.innerHeight }
        );
        return (
          <DiagnosticDropdown
            placement={placement}
            model={slash.model}
            activeIndex={slash.activeIndex}
            actionFocus={slash.actionFocus}
            onEvent={(evt) => { if (slashApiRef.current) slashApiRef.current.dxEvent(evt); }}
            onClose={() => setSlash(null)} />
        );
      })()}

      {/* Modifier (nom/code) ou Préciser un diagnostic existant (clic sur
          son nom, son code, ou son bouton .dxr-refine) */}
      {dxEdit &&
        <DxEditPopover
          anchorRect={dxEdit.rect}
          region={dxEdit.region}
          mode={dxEdit.mode}
          otherMentionsCount={dxEdit.otherMentionsCount}
          onRelabel={(to) => commitDxRelabel(dxEdit.region.id, to)}
          onClose={() => setDxEdit(null)} />
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

      {/* Choix du gabarit — sous-menu de « Gabarits de note » (slash/+),
          même patron que AddFileSourceMenu/ClinicalToolPicker : en-tête
          avec retour vers le menu d'ajout + liste d'options. */}
      {tplMenu &&
        <NoteTemplateMenu
          anchorRect={tplMenu.rect}
          onClose={() => setTplMenu(null)}
          onBack={() => { setTplMenu(null); openSlashMenu(); }}
          onSelect={function (key) {
            setTplMenu(null);
            window.dispatchEvent(new CustomEvent('note:apply-template', { detail: { key: key } }));
          }} />
      }

      {/* Choix du diagnostic visé — sous-menu de « Renvoi à un diagnostic »
          (slash/+), même patron que NoteTemplateMenu : en-tête avec retour
          vers le menu d'ajout + liste d'options. */}
      {diagRefMenu &&
        <DiagnosticRefMenu
          anchorRect={diagRefMenu.rect}
          diagnostics={diagRefMenu.diagnostics}
          onClose={() => setDiagRefMenu(null)}
          onBack={() => { setDiagRefMenu(null); openSlashMenu(); }}
          onSelect={function (d) {
            setDiagRefMenu(null);
            editorRef.current.chain().focus().insertContent({ type: 'diagnosticRef', attrs: { dxKey: d.dxKey, diagId: d.id } }).run();
          }} />
      }

      {/* « Documenter comme » (D1) — Problème / Antécédent / Non documenté,
          ouvert depuis le bouton .dxr-doc de l'en-tête d'une région. */}
      {diagDocMenu &&
        <DiagDocMenu
          anchorRect={diagDocMenu.rect}
          number={diagDocMenu.number}
          items={window.diagDocMenuItems(diagDocMenu.ctx)}
          onClose={() => setDiagDocMenu(null)}
          onSelect={function (value) {
            const dxKey = diagDocMenu.dxKey;
            setDiagDocMenu(null);
            commitDiagDocumentation(dxKey, value);
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
    display: 'inline-flex', alignItems: 'center', background: 'var(--mat-sys-surface-container-lowest)',
    borderRadius: 8, boxShadow: '0 4px 14px rgba(37,36,94,0.16)',
    fontFamily: "'Inter', sans-serif", userSelect: 'none'
  },
  segStart: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    height: 40, padding: '0 14px', boxSizing: 'border-box',
    border: '1px solid var(--mat-sys-outline-variant)', borderRadius: '8px 0 0 8px',
    background: 'var(--mat-sys-surface-container-lowest)', cursor: 'pointer',
    font: "500 14px 'Inter',sans-serif", color: 'var(--mat-sys-on-surface)', letterSpacing: 0.25
  },
  segMid: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    height: 40, padding: '0 14px', marginLeft: -1, boxSizing: 'border-box',
    border: '1px solid var(--mat-sys-outline-variant)', borderRadius: 0,
    background: 'var(--mat-sys-surface-container-lowest)', cursor: 'pointer',
    font: "500 14px 'Inter',sans-serif", color: 'var(--mat-sys-on-surface)', letterSpacing: 0.25
  },
  segEnd: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    height: 40, width: 44, marginLeft: -1, boxSizing: 'border-box',
    border: '1px solid var(--mat-sys-outline-variant)', borderRadius: '0 8px 8px 0',
    background: 'var(--mat-sys-surface-container-lowest)', cursor: 'pointer'
  },
  confirm: {
    background: 'var(--mat-sys-surface-container-lowest)', border: '1px solid var(--mat-sys-outline-variant)', borderRadius: 12,
    boxShadow: '0 14px 40px rgba(37,36,94,0.22)', padding: '14px 16px 16px',
    fontFamily: "'Inter', sans-serif", animation: 'pop-in 130ms ease-out'
  },
  confirmHead: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  confirmTitle: { font: "600 15px 'Poppins',sans-serif", color: 'color-mix(in srgb, var(--mat-sys-on-surface) 85%, transparent)' },
  confirmClose: { border: 0, background: 'transparent', cursor: 'pointer', padding: 0, display: 'inline-flex', marginTop: -2 },
  confirmBody: { fontSize: 13, color: 'color-mix(in srgb, var(--mat-sys-on-surface) 60%, transparent)', lineHeight: 1.45, margin: '8px 0 14px' },
  confirmActions: { display: 'flex', gap: 8, justifyContent: 'flex-end' },
  btnKeep: {
    border: '1px solid var(--mat-sys-outline-variant)', borderRadius: 8, background: 'var(--mat-sys-surface-container-lowest)',
    padding: '8px 14px', cursor: 'pointer', font: "600 13px 'Inter',sans-serif", color: 'var(--mat-sys-on-surface)'
  },
  btnDelete: {
    border: 0, borderRadius: 8, background: '#ba1a1a',
    padding: '8px 16px', cursor: 'pointer', font: "600 13px 'Inter',sans-serif", color: '#fff'
  }
};

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
              onMouseEnter={function (e) { e.currentTarget.style.background = 'color-mix(in srgb, var(--mat-sys-on-surface) 8%, transparent)'; }}
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

// ---------------------------------------------------------
// NoteTemplateMenu — sous-menu de « Gabarits de note » (structure + sections
// + outil clinique associé en un seul geste, voir NOTE_TEMPLATES et
// onApplyTemplate dans NoteEditor.jsx). Même patron que AddFileSourceMenu :
// en-tête retour/titre/fermer, liste d'options en dessous. Les items
// viennent de SLASH_ITEMS (noteTemplate) pour garder icône/titre/description
// synchronisés avec le raccourci clavier (/virus, /itu, /periodique).
// ---------------------------------------------------------
function NoteTemplateMenu({ anchorRect, onBack, onClose, onSelect }) {
  const panelRef = useRefE(null);
  const templates = (window.NOTE_DATA.SLASH_ITEMS || []).filter(function (it) { return it.noteTemplate; });

  useEffectE(function () {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    function onDoc(e) { if (panelRef.current && !panelRef.current.contains(e.target)) onClose(); }
    window.addEventListener('keydown', onKey);
    // Différé d'un tick — même piège que AddFileSourceMenu/ClinicalToolPicker :
    // le mousedown qui ouvre ce sous-menu le refermerait aussitôt sinon.
    const t = setTimeout(function () { document.addEventListener('mousedown', onDoc); }, 0);
    return function () {
      clearTimeout(t);
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDoc);
    };
  }, [onClose]);

  const panelW = 320;
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
        <span style={afmS.title}>Gabarits de note</span>
        <button style={afmS.iconBtn} onClick={onClose} title="Fermer">
          <span className="material-icons-outlined" style={{ fontSize: 20 }}>close</span>
        </button>
      </div>
      <div style={afmS.list}>
        {templates.map(function (it) {
          return (
            <div key={it.key} style={afmS.item}
              onMouseEnter={function (e) { e.currentTarget.style.background = 'color-mix(in srgb, var(--mat-sys-on-surface) 8%, transparent)'; }}
              onMouseLeave={function (e) { e.currentTarget.style.background = 'transparent'; }}
              onClick={function () { onSelect(it.noteTemplate); }}>
              <span className="material-symbols-outlined" style={afmS.itemIcon}>{it.icon}</span>
              <div>
                <div style={afmS.itemLabel}>{it.title}</div>
                <div style={afmS.itemDesc}>{it.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------
// DiagnosticRefMenu — sous-menu de « Renvoi à un diagnostic » : liste les
// diagnostics déjà présents dans la note (capturée à l'ouverture, voir
// runSlashCommand), un par FIL (listDiagnostics dédoublonne par dxKey — une
// reprise en Détails ET en Conclusion n'y figure qu'une fois), et insère une
// puce .dxref pointant sur le fil choisi. Le numéro affiché (d.number) est
// le même que la pastille de sa région : les deux viennent de la même
// numérotation par fil (diagnosticThreads/dxNumberingPlugin).
// ---------------------------------------------------------
function DiagnosticRefMenu({ anchorRect, diagnostics, onBack, onClose, onSelect }) {
  const panelRef = useRefE(null);

  useEffectE(function () {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    function onDoc(e) { if (panelRef.current && !panelRef.current.contains(e.target)) onClose(); }
    window.addEventListener('keydown', onKey);
    const t = setTimeout(function () { document.addEventListener('mousedown', onDoc); }, 0);
    return function () {
      clearTimeout(t);
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDoc);
    };
  }, [onClose]);

  const panelW = 320;
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
        <span style={afmS.title}>Renvoi à un diagnostic</span>
        <button style={afmS.iconBtn} onClick={onClose} title="Fermer">
          <span className="material-icons-outlined" style={{ fontSize: 20 }}>close</span>
        </button>
      </div>
      <div style={afmS.list}>
        {(diagnostics || []).length === 0
          ? <div style={{ padding: '14px 16px', fontSize: 12, color: 'var(--fg-3, color-mix(in srgb, var(--mat-sys-on-surface) 50%, transparent))', textAlign: 'center' }}>Aucun diagnostic dans cette note.</div>
          : diagnostics.map(function (d) {
            return (
              <div key={d.dxKey} style={afmS.item}
                onMouseEnter={function (e) { e.currentTarget.style.background = 'color-mix(in srgb, var(--mat-sys-on-surface) 8%, transparent)'; }}
                onMouseLeave={function (e) { e.currentTarget.style.background = 'transparent'; }}
                onClick={function () { onSelect(d); }}>
                <span style={afmS.dxrefBadge}>{d.number}</span>
                <span style={afmS.itemLabel}>{d.name}</span>
                {d.status === 'cesse' && <span style={afmS.ceasedTag}>Cessé</span>}
              </div>
            );
          })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------
// DiagDocMenu — « Documenter comme » (D1) : Problème / Antécédent / Non
// documenté, un choix exclusif. items vient de diagDocMenuItems
// (diagnostics.jsx), déjà calculé (selected/disabled/desc) selon l'état du
// fil. Clavier complet (↑↓ sautent les options désactivées, Entrée valide,
// Échap ferme) : contrairement au reste de l'en-tête, ce bouton est le seul
// endroit du header qui doit être opérable sans souris — le panneau prend
// le focus à l'ouverture et le rend à l'éditeur à la fermeture.
// ---------------------------------------------------------
function DiagDocMenu({ anchorRect, items, number, onSelect, onClose }) {
  const panelRef = useRefE(null);
  const [active, setActive] = useStateE(function () {
    const i = items.findIndex(function (it) { return it.selected; });
    return i >= 0 ? i : 0;
  });

  useEffectE(function () {
    if (panelRef.current) panelRef.current.focus();
  }, []);

  useEffectE(function () {
    function onDoc(e) { if (panelRef.current && !panelRef.current.contains(e.target)) onClose(); }
    const t = setTimeout(function () { document.addEventListener('mousedown', onDoc); }, 0);
    return function () { clearTimeout(t); document.removeEventListener('mousedown', onDoc); };
  }, [onClose]);

  function pick(idx) { if (!items[idx].disabled) onSelect(items[idx].value); }
  function step(dir) {
    let next = active;
    for (let i = 0; i < items.length; i++) {
      next = (next + dir + items.length) % items.length;
      if (!items[next].disabled) break;
    }
    setActive(next);
  }
  function onKeyDown(e) {
    if (e.key === 'Escape') { e.preventDefault(); onClose(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); step(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); step(-1); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(active); }
  }

  const panelW = 280;
  const MARGIN = 8;
  let left = MARGIN, top = 80;
  if (anchorRect) {
    left = Math.max(MARGIN, Math.min(anchorRect.left, window.innerWidth - panelW - MARGIN));
    top = anchorRect.bottom + 6;
  }

  return (
    <div ref={panelRef} tabIndex={-1} role="menu" aria-label="Documenter comme" onKeyDown={onKeyDown}
      style={Object.assign({}, ddmS.panel, { left: left, top: top, width: panelW })}>
      <div style={ddmS.heading}>Documenter comme</div>
      {items.map(function (it, i) {
        return (
          <div key={it.value || 'aucun'} role="menuitemradio" aria-checked={it.selected} aria-disabled={it.disabled || undefined}
            onMouseEnter={function () { if (!it.disabled) setActive(i); }}
            onMouseDown={function (e) { e.preventDefault(); }}
            onClick={function () { pick(i); }}
            style={Object.assign({}, ddmS.item, it.disabled ? ddmS.itemDisabled : {}, (i === active && !it.disabled) ? ddmS.itemActive : {})}>
            <span className="material-icons-outlined" style={{ fontSize: 18, color: it.selected ? 'var(--mat-sys-primary)' : 'color-mix(in srgb, var(--mat-sys-on-surface) 50%, transparent)', flexShrink: 0 }}>{it.icon}</span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: it.selected ? 600 : 400, color: 'color-mix(in srgb, var(--mat-sys-on-surface) 85%, transparent)' }}>{it.label}</div>
              <div style={{ fontSize: 11.5, color: 'color-mix(in srgb, var(--mat-sys-on-surface) 50%, transparent)' }}>{it.desc}</div>
            </span>
            {it.selected && <span className="material-icons-outlined" style={{ fontSize: 16, color: 'var(--mat-sys-primary)', flexShrink: 0 }}>check</span>}
          </div>
        );
      })}
      <div style={ddmS.foot}>S'applique au diagnostic n° {number} partout dans la note.</div>
    </div>
  );
}

const ddmS = {
  panel: {
    position: 'fixed', zIndex: 3000, background: 'var(--mat-sys-surface-container-low)',
    borderRadius: 'var(--mat-sys-corner-small)', boxShadow: 'var(--mat-sys-level2)', padding: 'var(--ds-spacing-xxs) 0',
    fontFamily: "var(--font-body, 'Inter', sans-serif)", outline: 'none',
    animation: 'medmenu-in 140ms var(--motion-ease, cubic-bezier(0.2,0,0,1))'
  },
  // Panneau et items alignés sur ds-popover-list : items 48 px, padding 8/12, gap 12,
  // survol / actif = state layer on-surface 8 %, désactivé = 38 %, en-tête label-medium.
  heading: { padding: 'var(--ds-spacing-xxs) var(--ds-spacing-12)', font: 'var(--mat-sys-label-medium)', letterSpacing: 'var(--mat-sys-label-medium-tracking)', color: 'var(--mat-sys-on-surface-variant)' },
  item: { display: 'flex', alignItems: 'center', gap: 'var(--ds-spacing-12)', minHeight: 48, padding: 'var(--ds-spacing-xs) var(--ds-spacing-12)', cursor: 'pointer', font: 'var(--mat-sys-body-medium)' },
  itemActive: { background: 'color-mix(in srgb, var(--mat-sys-on-surface) 8%, transparent)' },
  itemDisabled: { opacity: 0.38, cursor: 'default' },
  foot: { padding: '6px 14px 2px', borderTop: '1px solid var(--mat-sys-surface-container-low)', marginTop: 4, fontSize: 11, color: 'color-mix(in srgb, var(--mat-sys-on-surface) 40%, transparent)' }
};

const afmS = {
  panel: {
    position: 'fixed', zIndex: 3000, background: 'var(--mat-sys-surface-container-low)',
    borderRadius: 'var(--mat-sys-corner-small)', boxShadow: 'var(--mat-sys-level2)',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
    fontFamily: "var(--font-body, 'Inter', sans-serif)",
    animation: 'medmenu-in 140ms var(--motion-ease, cubic-bezier(0.2,0,0,1))'
  },
  header: { display: 'flex', alignItems: 'center', padding: '10px 12px', borderBottom: '1px solid var(--mat-sys-surface-container-low)', flexShrink: 0 },
  iconBtn: { width: 32, height: 32, border: 0, background: 'transparent', borderRadius: 8, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'color-mix(in srgb, var(--mat-sys-on-surface) 45%, transparent)' },
  title: { flex: 1, textAlign: 'center', fontSize: 14, fontWeight: 600, color: 'var(--fg-1, color-mix(in srgb, var(--mat-sys-on-surface) 82%, transparent))', fontFamily: "var(--font-head, 'Poppins', sans-serif)" },
  list: { padding: '6px 0' },
  item: { display: 'flex', alignItems: 'center', gap: 'var(--ds-spacing-12)', minHeight: 48, padding: 'var(--ds-spacing-xs) var(--ds-spacing-12)', cursor: 'pointer', transition: 'background var(--motion-duration) var(--motion-ease)' },
  itemIcon: { fontSize: 20, color: 'color-mix(in srgb, var(--mat-sys-on-surface) 50%, transparent)', flexShrink: 0 },
  itemLabel: { fontSize: 14, color: 'var(--fg-1, color-mix(in srgb, var(--mat-sys-on-surface) 82%, transparent))', flex: 1 },
  itemDesc: { fontSize: 12, color: 'var(--fg-3, color-mix(in srgb, var(--mat-sys-on-surface) 50%, transparent))', marginTop: 1 },
  dxrefBadge: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: 18, height: 18, borderRadius: '50%', background: '#000', color: '#fff',
    fontFamily: "var(--font-body, 'Inter', sans-serif)", fontWeight: 600, fontSize: 11,
    lineHeight: 1, flexShrink: 0
  },
  // Même palette que .rx-status--ceased (editor.css) — un fil cessé peut
  // quand même être repris par un renvoi (il reste dans la note).
  ceasedTag: {
    fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em',
    color: 'light-dark(#7a1f26, #e8a6ab)', background: 'light-dark(#ecdfe0, #462a2c)', borderRadius: 4, padding: '2px 6px', flexShrink: 0
  }
};

window.NoteBody = NoteBody;
