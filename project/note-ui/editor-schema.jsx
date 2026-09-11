/* global React */
// =========================================================
// editor-schema.jsx — Tiptap schema + doc helpers (Tiptap natif : un seul
// document par note, JSON Tiptap = source de vérité). Voir le plan de
// migration : les sections deviennent des Titre 2 dans le document, les
// chips portent leur entité complète dans leurs attrs (plus de map à part).
// =========================================================

let _chipSeq = 1;
function newChipId() { return 'c' + _chipSeq++; }
let _diagSeq = 1;
function newDiagId() { return 'd' + _diagSeq++; }

// searchCIM10 — filtre les entrées CIM-10 par requête (insensible aux accents).
// Catégories génériques (parapluie) d'abord — plus rapides à repérer et
// suffisantes pour la majorité des consultations ; les codes précis restent
// juste en dessous pour qui en a besoin.
function searchCIM10(query) {
  const data = window.CIM10_DATA;
  if (!data || !query || query.trim().length < 2) return [];
  const norm = function (s) { return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };
  const q = norm(query.trim());
  const generic = [];
  const specific = [];
  for (let i = 0; i < data.length; i++) {
    if (!norm(data[i].libelle).includes(q)) continue;
    (data[i].generic ? generic : specific).push(data[i]);
  }
  return generic.concat(specific).slice(0, 8);
}

// ---------------------------------------------------------
// DOM builder for a chip — même rendu que l'ancien ChipBlot Quill.
// Réutilisé à la fois par la création du NodeView et par sa mise à jour
// (on vide et on repeuple le même nœud DOM, jamais on ne le remplace —
// ProseMirror garde une référence stable au `dom` retourné par le NodeView).
// ---------------------------------------------------------
function buildChipDom(data, existingEl) {
  const node = existingEl || document.createElement('span');
  while (node.firstChild) node.removeChild(node.firstChild);
  node.className = '';
  node.classList.add('ql-chip');
  node.setAttribute('data-cid', data.cid);
  node.setAttribute('data-type', data.type || '');
  node.setAttribute('contenteditable', 'false');
  node.classList.add('chip');
  if (data.rx) {
    const kind = data.rx.kind || 'rx';
    node.classList.add('chip--rx');
    node.classList.add('chip--' + kind);
    if (data.rx.ceased) node.classList.add('chip--ceased');
    node.setAttribute('data-rx', JSON.stringify(data.rx));
    node.setAttribute('data-label', data.label || '');
    const d = data.details || {};
    if (Object.keys(d).length > 0) node.setAttribute('data-details', JSON.stringify(d));
    const ic = document.createElement('span');
    if (kind === 'rx') {
      ic.className = 'chip-rx-icon';
      ic.setAttribute('data-action', 'modal');
      ic.setAttribute('title', 'Modifier les détails complets');
      ic.textContent = '℞';
    } else {
      ic.className = 'material-symbols-outlined chip-rx-glyph';
      ic.setAttribute('data-action', 'modal');
      ic.setAttribute('title', 'Modifier les détails');
      ic.textContent = kind === 'lab' ? 'science' : kind === 'img' ? 'radiology' : kind === 'ref' ? 'person_add' : 'bookmark';
    }
    node.appendChild(ic);
    if (kind === 'rx') {
      const head = document.createElement('span');
      head.className = 'chip-rx-head';
      const nm = document.createElement('span');
      nm.className = 'chip-rx-name';
      nm.textContent = data.rx.name || '';
      head.appendChild(nm);
      if (data.rx.dose) {
        const ds = document.createElement('span');
        ds.className = 'chip-rx-dose';
        ds.setAttribute('data-field', 'dose');
        ds.textContent = data.rx.dose;
        head.appendChild(document.createTextNode(' '));
        head.appendChild(ds);
      }
      node.appendChild(head);
      if (d.frequency) {
        const poso = document.createElement('span');
        poso.className = 'chip-rx-poso';
        const seg = function (cls, field, text) {
          const s = document.createElement('span');
          s.className = cls;
          if (field) s.setAttribute('data-field', field);
          s.textContent = text;
          return s;
        };
        const _n = (d.qtyDose && /^\d/.test(String(d.qtyDose))) ? String(d.qtyDose) : (d.form === 'aérosol-doseur' ? '2' : '1');
        const _ab = d.form === 'comprimé' ? 'comp.' : d.form === 'aérosol-doseur' ? 'inh' : d.form === 'gélule' ? 'gél' : d.form === 'capsule' ? 'caps.' : 'dose';
        const qty = _n + ' ' + _ab;
        const freqTxt = (d.frequency || '') + (d.prn && !/prn/i.test(d.frequency || '') ? ' PRN' : '');
        const tokens = [seg('chip-rx-form', 'form', qty)];
        if (d.route) tokens.push(seg('chip-rx-route', 'route', d.route));
        tokens.push(seg('chip-rx-freq', 'frequency', freqTxt));
        if (d.quantity && /^\d+$/.test(String(d.quantity))) tokens.push(seg('chip-rx-qty', null, '#' + d.quantity));
        if (d.duration && d.duration !== '—') {
          tokens.push(seg('chip-rx-dur', 'duration', d.duration + (d.durationUnit === 'jours' || !d.durationUnit ? 'j' : ' ' + d.durationUnit)));
        }
        const _rf = (d.refills === undefined || d.refills === null || String(d.refills) === '') ? '0' : String(d.refills);
        tokens.push(seg('chip-rx-dur', 'refills', 'R' + _rf));
        tokens.forEach(function (t) { poso.appendChild(t); });
        node.appendChild(poso);
      } else if (data.rx.sig) {
        const sg = document.createElement('span');
        sg.className = 'chip-rx-poso';
        sg.textContent = data.rx.sig;
        node.appendChild(sg);
      }
    } else {
      const nm = document.createElement('span');
      nm.className = 'chip-rx-name';
      nm.textContent = data.rx.name || '';
      node.appendChild(nm);
      const pr = document.createElement('span');
      pr.className = 'chip-rx-badge';
      pr.setAttribute('data-field', 'priority');
      pr.textContent = d.priority || 'Routine';
      node.appendChild(pr);
      if (kind === 'lab' && d.fasting) {
        const ft = document.createElement('span');
        ft.className = 'chip-rx-sig';
        ft.textContent = 'À jeun';
        node.appendChild(ft);
      }
    }
    return node;
  }
  const ic = document.createElement('span');
  ic.className = 'material-symbols-outlined chip-icon';
  ic.textContent = data.icon || 'bookmark';
  node.appendChild(ic);
  const lbl = document.createElement('span');
  lbl.textContent = data.label || '';
  node.appendChild(lbl);
  return node;
}

// ---------------------------------------------------------
// ChipNode — inline atom node. Les attrs SONT l'entité complète (plus de
// map `chips` séparée) : {cid, type, label, icon, text, rx, details}.
// ---------------------------------------------------------
function makeChipNode() { return window.Tiptap.Node.create({
  name: 'chip',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,
  draggable: false,
  addAttributes() {
    return {
      cid: { default: null },
      type: { default: null },
      label: { default: '' },
      icon: { default: 'bookmark' },
      text: { default: '' },
      rx: { default: null },
      details: { default: null }
    };
  },
  parseHTML() {
    return [{
      tag: 'span.ql-chip[data-cid]',
      getAttrs(dom) {
        let rx = null, details = null;
        try { rx = dom.getAttribute('data-rx') ? JSON.parse(dom.getAttribute('data-rx')) : null; } catch (e) {}
        try { details = dom.getAttribute('data-details') ? JSON.parse(dom.getAttribute('data-details')) : null; } catch (e) {}
        const labelEl = dom.querySelector('span:not(.chip-icon)');
        const label = dom.getAttribute('data-label') || (labelEl ? labelEl.textContent : '');
        return {
          cid: dom.getAttribute('data-cid'),
          type: dom.getAttribute('data-type') || null,
          label: label,
          icon: (dom.querySelector('.chip-icon') || {}).textContent || 'bookmark',
          text: label,
          rx: rx,
          details: details
        };
      }
    }];
  },
  renderHTML({ node, HTMLAttributes }) {
    const attrs = { 'data-cid': node.attrs.cid, 'data-type': node.attrs.type || '', contenteditable: 'false' };
    if (node.attrs.rx) attrs['data-rx'] = JSON.stringify(node.attrs.rx);
    if (node.attrs.details) attrs['data-details'] = JSON.stringify(node.attrs.details);
    if (node.attrs.label) attrs['data-label'] = node.attrs.label;
    return ['span', window.Tiptap.mergeAttributes({ class: 'ql-chip chip' }, HTMLAttributes, attrs), node.attrs.label || ''];
  },
  addNodeView() {
    return (props) => {
      let cid = props.node.attrs.cid;
      const dom = buildChipDom(props.node.attrs);
      return {
        dom,
        ignoreMutation: () => true,
        update(updatedNode) {
          if (updatedNode.type.name !== 'chip' || updatedNode.attrs.cid !== cid) return false;
          buildChipDom(updatedNode.attrs, dom);
          return true;
        }
      };
    };
  }
}); }

// ---------------------------------------------------------
// ReferenceNode — passage cité depuis une note antérieure complétée. Bloc
// atomique non-éditable, insertion en un geste (jamais édité en place).
// ---------------------------------------------------------
function makeReferenceNode() { return window.Tiptap.Node.create({
  name: 'reference',
  group: 'block',
  atom: true,
  selectable: true,
  addAttributes() {
    return { source: { default: '' }, text: { default: '' } };
  },
  parseHTML() {
    return [{
      tag: 'div.ql-ref-block',
      getAttrs(dom) {
        return { source: dom.getAttribute('data-source') || '', text: dom.getAttribute('data-text') || '' };
      }
    }];
  },
  renderHTML({ node, HTMLAttributes }) {
    return ['div', window.Tiptap.mergeAttributes({ class: 'ql-ref-block', 'data-source': node.attrs.source, 'data-text': node.attrs.text, contenteditable: 'false' })];
  },
  addNodeView() {
    return (props) => {
      const dom = document.createElement('div');
      dom.className = 'ql-ref-block';
      dom.setAttribute('contenteditable', 'false');
      function render(attrs) {
        while (dom.firstChild) dom.removeChild(dom.firstChild);
        dom.setAttribute('data-source', attrs.source || '');
        dom.setAttribute('data-text', attrs.text || '');
        const hdr = document.createElement('div');
        hdr.className = 'ql-ref-header';
        const ic = document.createElement('span');
        ic.className = 'material-symbols-outlined ql-ref-ic';
        ic.textContent = 'format_quote';
        hdr.appendChild(ic);
        const src = document.createElement('span');
        src.className = 'ql-ref-source';
        src.textContent = 'Référence — ' + (attrs.source || '');
        hdr.appendChild(src);
        dom.appendChild(hdr);
        const body = document.createElement('div');
        body.className = 'ql-ref-body';
        (attrs.text || '').split('\n').forEach(function (line, i) {
          if (i > 0) body.appendChild(document.createElement('br'));
          body.appendChild(document.createTextNode(line));
        });
        dom.appendChild(body);
      }
      render(props.node.attrs);
      return {
        dom,
        ignoreMutation: () => true,
        update(updatedNode) {
          if (updatedNode.type.name !== 'reference') return false;
          render(updatedNode.attrs);
          return true;
        }
      };
    };
  }
}); }

// ---------------------------------------------------------
// DiagnosticRegionNode — callout façon Notion, node bloc IMBRIQUÉ natif
// (content: 'paragraph+') : plus le hack Quill « blocs plats + adjacence
// CSS ». Un seul curseur continu texte → en-tête (non-éditable) → corps
// (contentDOM, éditable) → texte. L'en-tête (nom + bouton promouvoir) est
// géré par un mousedown délégué sur editor.view.dom, voir editor-field.jsx.
// ---------------------------------------------------------
function makeDiagnosticRegionNode() { return window.Tiptap.Node.create({
  name: 'diagnosticRegion',
  group: 'block',
  content: 'paragraph+',
  isolating: true,
  defining: true,
  addAttributes() {
    return { id: { default: null }, name: { default: 'Diagnostic' } };
  },
  parseHTML() {
    return [{
      tag: 'div.dxr',
      getAttrs(dom) {
        const nameEl = dom.querySelector('.dxr-name');
        return { id: dom.getAttribute('data-diag-id') || null, name: nameEl ? nameEl.textContent : 'Diagnostic' };
      },
      contentElement: '.dxr-body'
    }];
  },
  renderHTML({ node, HTMLAttributes }) {
    return ['div', window.Tiptap.mergeAttributes({ class: 'dxr', 'data-diag-id': node.attrs.id }, HTMLAttributes),
      ['div', { class: 'dxr-head', contenteditable: 'false' },
        ['span', { class: 'material-icons-outlined dxr-ic' }, 'local_hospital'],
        ['span', { class: 'dxr-name', 'data-diag-id': node.attrs.id }, node.attrs.name],
        ['button', { type: 'button', class: 'dxr-promote', title: 'Promouvoir en problème' },
          ['span', { class: 'material-icons-outlined' }, 'add_task']]],
      ['div', { class: 'dxr-body' }, 0]];
  },
  addNodeView() {
    return (props) => {
      const dom = document.createElement('div');
      dom.className = 'dxr';

      const head = document.createElement('div');
      head.className = 'dxr-head';
      head.setAttribute('contenteditable', 'false');
      const ic = document.createElement('span');
      ic.className = 'material-icons-outlined dxr-ic';
      ic.textContent = 'local_hospital';
      head.appendChild(ic);
      const nameEl = document.createElement('span');
      nameEl.className = 'dxr-name';
      head.appendChild(nameEl);
      const promoteBtn = document.createElement('button');
      promoteBtn.type = 'button';
      promoteBtn.className = 'dxr-promote';
      promoteBtn.title = 'Promouvoir en problème';
      promoteBtn.innerHTML = '<span class="material-icons-outlined">add_task</span>';
      head.appendChild(promoteBtn);

      const body = document.createElement('div');
      body.className = 'dxr-body';

      function render(attrs) {
        dom.setAttribute('data-diag-id', attrs.id || '');
        nameEl.setAttribute('data-diag-id', attrs.id || '');
        nameEl.textContent = attrs.name || 'Diagnostic';
      }
      render(props.node.attrs);

      dom.appendChild(head);
      dom.appendChild(body);

      return {
        dom,
        contentDOM: body,
        update(updatedNode) {
          if (updatedNode.type.name !== 'diagnosticRegion') return false;
          render(updatedNode.attrs);
          return true;
        }
      };
    };
  },
  // Enter sur le dernier paragraphe vide de la région → sort (nouveau
  // paragraphe après, façon Notion). Backspace en tête d'une région réduite
  // à un seul paragraphe vide → supprime toute la région.
  addKeyboardShortcuts() {
    return {
      Enter: () => {
        const editor = this.editor;
        const { selection } = editor.state;
        if (!selection.empty) return false;
        const $from = selection.$from;
        if ($from.parent.type.name !== 'paragraph' || $from.parent.content.size !== 0) return false;
        const regionDepth = $from.depth - 1;
        if (regionDepth < 0 || $from.node(regionDepth).type.name !== 'diagnosticRegion') return false;
        const region = $from.node(regionDepth);
        if ($from.index(regionDepth) !== region.childCount - 1) return false;
        const afterRegionPos = $from.after(regionDepth);
        return editor.chain().insertContentAt(afterRegionPos, { type: 'paragraph' }).setTextSelection(afterRegionPos + 1).run();
      },
      Backspace: () => {
        const editor = this.editor;
        const { selection } = editor.state;
        if (!selection.empty || selection.$from.parentOffset !== 0) return false;
        const $from = selection.$from;
        if ($from.parent.type.name !== 'paragraph' || $from.parent.content.size !== 0) return false;
        const regionDepth = $from.depth - 1;
        if (regionDepth < 0 || $from.node(regionDepth).type.name !== 'diagnosticRegion') return false;
        const region = $from.node(regionDepth);
        if (region.childCount !== 1) return false;
        const regionPos = $from.before(regionDepth);
        return editor.chain().deleteRange({ from: regionPos, to: regionPos + region.nodeSize }).run();
      }
    };
  }
}); }

// ---------------------------------------------------------
// ClinicalToolNode — outil clinique inséré dans le flux du texte (node bloc
// atomique, comme ReferenceNode/DiagnosticRegionNode). Le formulaire lui-même
// (ClinicalTool / ClinicalToolExamCourt — voir ClinicalTool.jsx) est du React
// « ordinaire » à base de champs contrôlés, jamais du contenu ProseMirror : le
// NodeView monte donc un root React directement dans son DOM plutôt que de
// construire un NodeView à la main comme pour les chips. Toutes les données
// saisies (fields), la section repliée/dépliée et les sections d'accordéon
// vivent dans les attrs du node — donc dans le JSON Tiptap, sauvegardées et
// restaurées comme n'importe quel autre contenu de la note.
// ---------------------------------------------------------
let _ctSeq = 1;
function newToolInstanceId() { return 'ct' + _ctSeq++; }

// Valeurs par défaut à la création — un outil est toujours inséré avec la
// date du jour et (pour l'ITU) le libellé de traitement déjà rempli, comme
// avant ce refactor (l'ancien composant les affichait en dur, non persistés).
const CT_FIELD_DEFAULTS = {
  itu: { plan_traitement_pharmaco: "Antibiothérapie selon l'OC" },
  'exam-court': {}
};

function buildClinicalToolNode(toolId, label) {
  return {
    type: 'clinicalTool',
    attrs: {
      instanceId: newToolInstanceId(),
      toolId: toolId,
      label: label || '',
      favorite: false,
      bodyCollapsed: false,
      collapsedSections: {},
      fields: Object.assign({ effDate: new Date().toISOString().slice(0, 10) }, CT_FIELD_DEFAULTS[toolId] || {})
    }
  };
}

function makeClinicalToolNode() { return window.Tiptap.Node.create({
  name: 'clinicalTool',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: false,
  addAttributes() {
    return {
      instanceId: { default: null },
      toolId: { default: null },
      label: { default: '' },
      favorite: { default: false },
      bodyCollapsed: { default: false },
      collapsedSections: { default: {} },
      fields: { default: {} }
    };
  },
  parseHTML() {
    return [{
      tag: 'div.ct-node[data-instance-id]',
      getAttrs(dom) {
        let fields = {}, collapsedSections = {};
        try { fields = JSON.parse(dom.getAttribute('data-fields') || '{}'); } catch (e) {}
        try { collapsedSections = JSON.parse(dom.getAttribute('data-collapsed-sections') || '{}'); } catch (e) {}
        return {
          instanceId: dom.getAttribute('data-instance-id'),
          toolId: dom.getAttribute('data-tool-id') || null,
          label: dom.getAttribute('data-label') || '',
          favorite: dom.getAttribute('data-favorite') === 'true',
          bodyCollapsed: dom.getAttribute('data-body-collapsed') === 'true',
          collapsedSections: collapsedSections,
          fields: fields
        };
      }
    }];
  },
  renderHTML({ node }) {
    return ['div', {
      class: 'ct-node',
      'data-instance-id': node.attrs.instanceId,
      'data-tool-id': node.attrs.toolId || '',
      'data-label': node.attrs.label || '',
      'data-favorite': node.attrs.favorite ? 'true' : 'false',
      'data-body-collapsed': node.attrs.bodyCollapsed ? 'true' : 'false',
      'data-collapsed-sections': JSON.stringify(node.attrs.collapsedSections || {}),
      'data-fields': JSON.stringify(node.attrs.fields || {}),
      contenteditable: 'false'
    }];
  },
  addNodeView() {
    return (props) => {
      const dom = document.createElement('div');
      dom.className = 'ct-node';
      dom.setAttribute('contenteditable', 'false');
      const root = window.ReactDOM.createRoot(dom);
      let currentNode = props.node;

      // Relit le node à jour depuis le doc (plutôt que de fermer sur les
      // attrs passés à renderReact) : évite d'écraser une modification
      // concurrente si plusieurs callbacks se déclenchent avant le prochain render.
      function patchAttrs(patch) {
        if (typeof props.getPos !== 'function') return;
        const pos = props.getPos();
        if (pos == null) return;
        const view = props.editor.view;
        const node = view.state.doc.nodeAt(pos);
        if (!node || node.type.name !== 'clinicalTool') return;
        view.dispatch(view.state.tr.setNodeMarkup(pos, undefined, Object.assign({}, node.attrs, patch)));
      }

      function renderReact(node) {
        const attrs = node.attrs;
        const Comp = attrs.toolId === 'exam-court' ? window.ClinicalToolExamCourt : window.ClinicalTool;
        root.render(React.createElement(Comp, {
          fields: attrs.fields || {},
          onFieldChange: function (fieldName, value) {
            patchAttrs({ fields: Object.assign({}, currentNode.attrs.fields, { [fieldName]: value }) });
          },
          collapsedSections: attrs.collapsedSections || {},
          onToggleSection: function (id) {
            const cs = Object.assign({}, currentNode.attrs.collapsedSections);
            cs[id] = !cs[id];
            patchAttrs({ collapsedSections: cs });
          },
          favorite: attrs.favorite,
          onToggleFavorite: function () { patchAttrs({ favorite: !currentNode.attrs.favorite }); },
          bodyCollapsed: attrs.bodyCollapsed,
          onBodyCollapseChange: function (v) {
            patchAttrs({ bodyCollapsed: typeof v === 'function' ? v(currentNode.attrs.bodyCollapsed) : v });
          },
          onClose: function () {
            if (typeof props.getPos !== 'function') return;
            const pos = props.getPos();
            if (pos == null) return;
            props.editor.chain().deleteRange({ from: pos, to: pos + currentNode.nodeSize }).run();
          }
        }));
      }

      renderReact(props.node);

      return {
        dom,
        ignoreMutation: () => true,
        update(updatedNode) {
          if (updatedNode.type.name !== 'clinicalTool') return false;
          currentNode = updatedNode;
          renderReact(updatedNode);
          return true;
        },
        destroy() { root.unmount(); }
      };
    };
  }
}); }

// buildEditorExtensions() n'est appelée qu'à la construction réelle de
// l'éditeur (effet de montage de NoteBody — voir editor-field.jsx), jamais
// au chargement du script : les node.create() ci-dessus dépendent tous de
// window.Tiptap, chargé de façon async (import() dynamique dans Note
// Clinique.html). Les construire ici, à l'exécution plutôt qu'au parse du
// script, laisse le temps à ce chargement de se terminer — les construire en
// haut de fichier (au parse, avant que window.Tiptap existe forcément)
// faisait planter silencieusement TOUT le schéma custom (chips, régions
// diagnostic, outils cliniques) selon l'ordre de course entre ce script
// synchrone et l'import async, sans jamais se rétablir pour le reste de la
// vie de la page.
function buildEditorExtensions(placeholder) {
  const T = window.Tiptap;
  return [
    T.StarterKit.configure({ hardBreak: false, horizontalRule: false, heading: { levels: [1, 2, 3] } }),
    T.Placeholder.configure({ placeholder: placeholder || '', showOnlyCurrent: false }),
    T.Underline,
    T.TextStyle,
    T.Color,
    T.Highlight.configure({ multicolor: true }),
    T.Link.configure({
      openOnClick: false,
      autolink: true,
      linkOnPaste: true,
      HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' }
    }),
    makeChipNode(),
    makeReferenceNode(),
    makeDiagnosticRegionNode(),
    makeClinicalToolNode()
  ].concat(window.buildReviewExtensions ? window.buildReviewExtensions() : []);
}

// ---------------------------------------------------------
// Menu slash — filtre les commandes disponibles. Choisir un item
// rxSearch/orderSearch/diagnosticEntry bascule vers le mode ordre ou
// diagnostic (voir runSlashCommand) au lieu d'agir directement.
// ---------------------------------------------------------
function filterSlashItems(query) {
  const t = (query || '').toLowerCase().trim();
  const all = window.NOTE_DATA.SLASH_ITEMS || [];
  const items = window.__SHOW_CLINICAL_TOOLS === false ? all.filter(function (it) { return !it.ctPicker; }) : all;
  if (!t) return items.filter(function (it) { return !it.hideWhenEmpty; });
  return items.filter(function (it) { return it.title.toLowerCase().includes(t) || (it.kbd && it.kbd.includes(t)); });
}

// Requête « rx amox » / « lab fsc » / « img thorax » / « ref cardio » →
// mode ordre. Sinon menu générique.
function parseSlashQuery(query) {
  const m = /^(rx|lab|img|ref)\s([\s\S]*)$/i.exec(query || '');
  if (m) {
    const kbd = m[1].toLowerCase();
    return { mode: 'order', kind: window.NOTE_DATA.orderKindForKbd(kbd) || kbd, term: m[2] };
  }
  const dxm = /^dx\s([\s\S]*)$/i.exec(query || '');
  if (dxm) return { mode: 'dx', term: dxm[1] };
  return { mode: 'menu' };
}

// Aplatit {profil?, favoris, frequents, autres} dans l'ordre de rendu de
// RxMenu — sert de liste unique pour la navigation clavier (↑↓/Entrée).
function flattenRxResults(r) {
  return (r.profil || []).concat(r.favoris || [], r.frequents || [], r.autres || []);
}

// ---------------------------------------------------------
// Extension « / » — un seul plugin officiel @tiptap/suggestion. `handlers`
// = { onCommand, makeRender } fournis par NoteBody (ils ferment sur son
// propre state React — voir editor-field.jsx).
// ---------------------------------------------------------
function buildSlashExtension(handlers) {
  return window.Tiptap.Extension.create({
    name: 'slashCommand',
    addProseMirrorPlugins() {
      return [
        window.Tiptap.Suggestion({
          editor: this.editor,
          char: '/',
          allowSpaces: true,
          decorationClass: 'slash-pending',
          items: function (props) {
            const parsed = parseSlashQuery(props.query);
            if (parsed.mode === 'order') return flattenRxResults(window.NOTE_DATA.searchOrder(parsed.kind, (parsed.term || '').trim()));
            if (parsed.mode === 'dx') return searchCIM10((parsed.term || '').trim());
            return filterSlashItems(props.query);
          },
          command: handlers.onCommand,
          render: handlers.makeRender
        })
      ];
    }
  });
}

// ---------------------------------------------------------
// Document par défaut — 2 sections (Titre 2 + paragraphe vide).
// Factory (pas une constante partagée) pour ne jamais muter un objet réutilisé.
// ---------------------------------------------------------
function DEFAULT_DOC() {
  return {
    type: 'doc',
    content: [
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Détails de la consultation' }] },
      { type: 'paragraph' },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Conclusion' }] },
      { type: 'paragraph' }
    ]
  };
}

// ---------------------------------------------------------
// scanDoc — une seule marche sur le doc JSON : chips présents (dans l'ordre
// du document), compteurs par type d'entité + diagnostics, items pour le
// Sommaire. Fonctionne sur un doc « vivant » (editor.getJSON()) ou stocké
// (brouillon / note complétée).
// ---------------------------------------------------------
function scanDoc(docJson) {
  const chips = [];
  const diagNames = [];
  // Formulaires d'outils cliniques présents dans la note. Depuis V7 ils sont
  // transmissibles au même titre qu'une requête (plan V7 §D) — le checkout
  // s'en sert pour construire un document par formulaire. Liste séparée des
  // chips : ce sont des nodes atomiques de bloc, pas des entités inline.
  const tools = [];
  function walk(node) {
    if (!node) return;
    if (node.type === 'chip') {
      chips.push({ cid: node.attrs.cid, entity: {
        type: node.attrs.type, label: node.attrs.label, icon: node.attrs.icon,
        text: node.attrs.text, rx: node.attrs.rx || undefined, details: node.attrs.details || undefined
      } });
    } else if (node.type === 'diagnosticRegion') {
      diagNames.push(node.attrs.name);
    } else if (node.type === 'clinicalTool') {
      tools.push({
        id: node.attrs.instanceId, toolId: node.attrs.toolId,
        label: node.attrs.label || '', fields: node.attrs.fields || {}
      });
    }
    (node.content || []).forEach(walk);
  }
  walk(docJson);
  const counts = {};
  chips.forEach(function (c) { if (c.entity.type) counts[c.entity.type] = (counts[c.entity.type] || 0) + 1; });
  if (diagNames.length) counts.diagnostic = diagNames.length;
  const items = chips.map(function (c) { return { id: c.cid, type: c.entity.type, label: c.entity.label }; });
  diagNames.forEach(function (nm, i) { items.push({ id: 'dx-' + i, type: 'diagnostic', label: nm }); });
  return { chips: chips, counts: counts, items: items, diagNames: diagNames, tools: tools };
}


// ---------------------------------------------------------
// buildTransmissionDocs — documents transmissibles d'une note, à partir du
// résultat de scanDoc et de l'état de transmission. Vit ici plutôt que dans
// NoteEditor parce que deux appelants en ont besoin : l'éditeur pour la note
// en cours, et NotesList pour rouvrir le checkout d'une note DÉJÀ complétée
// (en lecture seule) — voir PLAN-transmission-ordonnance.md §5.1.
//
// `txState` est l'état par document ({recipients, complete, transmitted…}) ;
// passer {} donne des documents vierges.
// ---------------------------------------------------------
function buildTransmissionDocs(docStats, txState) {
  var ents = docStats.chips; // [{cid, entity}], dans l'ordre du document

  function mkItem(e) {
    var ent = e.entity, d = ent.details || {}, t = ent.type, label = ent.label, sub = '';
    if (t === 'prescription') {
      label = [d.molecule, d.dose ? d.dose + ' ' + (d.unit || '') : ''].filter(Boolean).join(' ').trim()
        || (ent.rx && ent.rx.name) || ent.label;
      sub = (ent.rx && ent.rx.sig)
        || [d.route, d.frequency, d.duration ? '× ' + d.duration + ' ' + (d.durationUnit || 'jours') : ''].filter(Boolean).join(' ');
    } else if (t === 'lab') {
      label = (d.tests && d.tests.length) ? d.tests.join(', ') : (ent.label || 'Demande de laboratoire');
      sub = [d.priority, d.fasting ? 'à jeun' : ''].filter(Boolean).join(' · ');
    } else if (t === 'imaging') {
      label = [d.modality, d.region].filter(Boolean).join(' ') || ent.label;
      sub = [d.views, d.priority, (d.contrast && d.contrast !== 'Sans') ? 'avec contraste' : ''].filter(Boolean).join(' · ');
    } else if (t === 'referral') {
      label = d.specialty || ent.label;
      sub = [d.priority, d.question].filter(Boolean).join(' · ');
    } else if (t === 'instructions') {
      label = d.title || ent.label || 'Consignes au patient';
    }
    var rx = ent.rx || {};
    var ceased = !!rx.ceased;
    // Trois variantes de ligne de prescription au checkout (plan V7 §G) :
    // nouvelle, renouvellement (médication déjà au dossier), cessation.
    var variant = ceased ? 'cessation' : (rx.renewal ? 'renouvellement' : 'nouvelle');
    return { id: e.cid, type: t, label: label, sub: sub, ceased: ceased, variant: variant };
  }

  // Un document bundlant plusieurs items (l'Ordonnance) peut recevoir un
  // nouvel item après avoir déjà été complété/transmis (ex. le médecin
  // ajoute une prescription après avoir faxé l'ordonnance) : dans ce cas,
  // le contenu signé/envoyé n'est plus celui qui existe réellement. On
  // invalide donc complete/transmitted dès que la liste d'items ne
  // correspond plus à celle capturée au moment de la complétion
  // (`itemIds`, posé par markDocComplete) — les destinataires déjà
  // choisis restent, eux, valides et ne sont pas perdus.
  function withTx(id, kind, title, items) {
    var st = txState[id] || {};
    var idsKey = items.map(function(it) { return it.id; }).sort().join(',');
    var stale = !!st.complete && st.itemIds !== idsKey;
    return {
      id: id, kind: kind, title: title, items: items,
      recipients: st.recipients || [],
      complete: stale ? false : !!st.complete,
      transmitted: stale ? false : !!st.transmitted,
      comment: st.comment || '',
      // Pièces jointes et mot libre au destinataire (Envoi rapide, §C du
      // plan V7). `attachments` reste à null tant que l'utilisateur n'y a
      // pas touché : c'est ce qui permet à l'Envoi rapide d'appliquer les
      // cases cochées par défaut du type de document (TX_META.attachmentsOn)
      // sans confondre « pas encore ouvert » et « tout décoché ».
      attachments: st.attachments || null,
      note: st.note || '',
    };
  }

  // Sous-titre d'un outil clinique : la première valeur de champ non vide
  // du formulaire (« Prostate » pour un examen physique, p. ex.). Rien de
  // figé — comme tout le reste du checkout, ça vient de la note.
  function toolSub(fields) {
    var keys = Object.keys(fields || {});
    for (var i = 0; i < keys.length; i++) {
      var v = fields[keys[i]];
      if (typeof v === 'string' && v.trim()) return v.trim().slice(0, 60);
    }
    return '';
  }

  var docs = [];
  var rxItems = ents.filter(function(e) { return e.entity.type === 'prescription'; }).map(mkItem);
  if (rxItems.length) docs.push(withTx('rx', 'prescription', 'Ordonnance', rxItems));
  ents.filter(function(e) { return ['lab', 'imaging', 'referral', 'instructions'].indexOf(e.entity.type) >= 0; })
    .forEach(function(e) {
      var item = mkItem(e);
      docs.push(withTx(e.cid, e.entity.type, item.label, [item]));
    });
  // Outils cliniques (plan V7 §D) : un document par formulaire présent dans
  // la note, et RIEN si la note n'en contient aucun — la catégorie
  // « Outils cliniques » de la sidebar disparaît alors d'elle-même, sans
  // titre ni compteur à zéro.
  (docStats.tools || []).forEach(function(t) {
    if (!t.id) return;
    var d = withTx(t.id, 'clinicalTool', t.label || 'Outil clinique', []);
    d.subtitle = toolSub(t.fields);
    docs.push(d);
  });
  return docs;
}


// true si le document ne contient aucun texte, chip ou node atome — les
// titres de section par défaut ne comptent pas comme contenu.
function docIsBlank(docJson) {
  let blank = true;
  function walk(node) {
    if (!blank || !node) return;
    // Les titres de section (headings) sont structurels, pas du contenu saisi —
    // on ne descend pas dans leur texte.
    if (node.type === 'heading') return;
    if (node.type === 'text' && node.text && node.text.trim()) { blank = false; return; }
    if (node.type === 'chip' || node.type === 'reference' || node.type === 'diagnosticRegion') { blank = false; return; }
    (node.content || []).forEach(walk);
  }
  walk(docJson);
  return blank;
}

// Position (ProseMirror) juste avant le 2e Titre-2 de premier niveau, sinon
// la fin du document — « fin de la première section ».
function endOfFirstSectionPos(doc) {
  let sawFirstH2 = false, result = null;
  doc.forEach(function (node, offset) {
    if (result != null) return;
    if (node.type.name === 'heading' && node.attrs.level === 2) {
      if (sawFirstH2) { result = offset; return; }
      sawFirstH2 = true;
    }
  });
  return result != null ? result : doc.content.size;
}

// Position sûre pour insérer un node bloc atomique (outil clinique, région
// diagnostic…) près d'une position donnée : si cette position tombe DANS un
// titre de section (Titre 1/2/3), on insère plutôt juste après ce titre —
// sinon on scinderait le titre en un titre vide + le reste du texte (visible
// après coup comme une section fantôme sans nom). Cas fréquent : le curseur
// « au repos » d'une note neuve se trouve au tout début du premier titre.
function safeBlockInsertPos(doc, pos) {
  const $pos = doc.resolve(Math.max(0, Math.min(pos, doc.content.size)));
  for (let d = $pos.depth; d >= 0; d--) {
    if ($pos.node(d).type.name === 'heading') return $pos.after(d);
  }
  return pos;
}

// Équivalent JSON (doc pas encore monté) — index dans doc.content où insérer.
function endOfFirstSectionIndexJSON(docJson) {
  const content = docJson.content || [];
  let sawFirstH2 = false;
  for (let i = 0; i < content.length; i++) {
    const n = content[i];
    if (n.type === 'heading' && n.attrs && n.attrs.level === 2) {
      if (sawFirstH2) return i;
      sawFirstH2 = true;
    }
  }
  return content.length;
}

// Gabarit {title, content:'ligne1\nligne2'} → [Titre2, paragraphes...] JSON.
function plainToBlocks(title, content) {
  const blocks = [{ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: title }] }];
  (content || '').split('\n').forEach(function (line) {
    blocks.push(line ? { type: 'paragraph', content: [{ type: 'text', text: line }] } : { type: 'paragraph' });
  });
  return blocks;
}

// Position (depth-1) du node chip dont attrs.cid correspond, ou -1.
function findChipPos(editor, cid) {
  let found = -1;
  editor.state.doc.descendants(function (node, pos) {
    if (found >= 0) return false;
    if (node.type.name === 'chip' && node.attrs.cid === cid) { found = pos; return false; }
  });
  return found;
}

function getChipEntity(editor, cid) {
  const pos = findChipPos(editor, cid);
  if (pos < 0) return null;
  const node = editor.state.doc.nodeAt(pos);
  return node ? {
    type: node.attrs.type, label: node.attrs.label, icon: node.attrs.icon,
    text: node.attrs.text, rx: node.attrs.rx || undefined, details: node.attrs.details || undefined
  } : null;
}

// Édition undoable : tr.setNodeMarkup préserve la position, couvert par
// l'historique natif de Tiptap (Ctrl+Z annule l'édition d'un chip).
function updateChipEntity(editor, cid, entity) {
  const pos = findChipPos(editor, cid);
  if (pos < 0) return;
  editor.chain().command(function (props) {
    props.tr.setNodeMarkup(pos, undefined, Object.assign({}, props.tr.doc.nodeAt(pos).attrs, {
      type: entity.type, label: entity.label, icon: entity.icon, text: entity.text,
      rx: entity.rx || null, details: entity.details || null
    }));
    return true;
  }).run();
}

Object.assign(window, {
  newChipId,
  newDiagId,
  newToolInstanceId,
  searchCIM10,
  CT_FIELD_DEFAULTS,
  buildClinicalToolNode,
  buildEditorExtensions,
  filterSlashItems,
  parseSlashQuery,
  flattenRxResults,
  buildSlashExtension,
  DEFAULT_DOC,
  scanDoc,
  buildTransmissionDocs,
  docIsBlank,
  endOfFirstSectionPos,
  safeBlockInsertPos,
  endOfFirstSectionIndexJSON,
  plainToBlocks,
  findChipPos,
  getChipEntity,
  updateChipEntity
});
