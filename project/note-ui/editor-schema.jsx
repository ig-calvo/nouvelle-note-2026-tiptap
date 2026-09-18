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

// searchDx - liste unique (dossier + CIM-10) pour le menu /dx, meme principe
// que flattenRxResults pour /rx : une seule liste a plat pour la navigation
// clavier (Suggestion.items()) et le rendu (DiagnosticDropdown), les
// problemes au dossier en tete.
function searchDx(query) {
  const term = (query || '').trim();
  return window.NOTE_DATA.searchProblems(term).concat(searchCIM10(term));
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
      const poso = document.createElement('span');
      poso.className = 'chip-rx-poso';
      const pr = document.createElement('span');
      pr.className = 'chip-rx-priority';
      pr.setAttribute('data-field', 'priority');
      pr.textContent = d.priority || 'Routine';
      poso.appendChild(pr);
      node.appendChild(poso);
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
      details: { default: null },
      // Horodatage/auteur de la dernière sauvegarde de ce chip — alimente le
      // Journal des actions (voir buildActionLog plus bas). Pas de round-trip
      // HTML (parseHTML) : les chips de ce prototype ne sont jamais recréés
      // depuis du HTML collé, seulement depuis du JSON.
      savedAt: { default: null },
      author: { default: null }
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
    return {
      id: { default: null }, name: { default: 'Diagnostic' },
      // Posés au clic sur « Promouvoir en problème » (editor-field.jsx) — un
      // diagnostic non promu n'alimente ni le Sommaire (Summary.jsx) ni le
      // Journal des actions ; voir buildActionLog plus bas.
      promotedAt: { default: null }, promotedBy: { default: null }
    };
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
        promoteBtn.classList.toggle('dxr-promoted', !!attrs.promotedAt);
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
        // Le paragraphe vide qui déclenche la sortie ne doit pas rester dans la
        // région (sinon une ligne fantôme y reste) : on le retire — ou, s'il est
        // seul, on retire toute la région — avant de placer le curseur dans un
        // nouveau paragraphe après.
        if (region.childCount === 1) {
          const regionStart = $from.before(regionDepth);
          const regionEnd = $from.after(regionDepth);
          return editor.chain()
            .deleteRange({ from: regionStart, to: regionEnd })
            .insertContentAt(regionStart, { type: 'paragraph' })
            .setTextSelection(regionStart + 1)
            .run();
        }
        const paraStart = $from.before($from.depth);
        const paraEnd = $from.after($from.depth);
        const afterRegionPos = paraStart + 1;
        return editor.chain()
          .deleteRange({ from: paraStart, to: paraEnd })
          .insertContentAt(afterRegionPos, { type: 'paragraph' })
          .setTextSelection(afterRegionPos + 1)
          .run();
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
// SectionSplitNode — la ligne de séparation « Détails de la consultation »
// (au-dessus) / « Conclusion » (en dessous).
//
// C'est un node bloc atomique du document, pas un réglage à part : sa
// position vit dans le JSON Tiptap, donc elle est propre à chaque note et
// suit la note partout (brouillon sauvegardé, note complétée, reprise de la
// dernière note) sans stockage parallèle. La logique pure de découpage vit
// dans note-sections.jsx ; ici il n'y a que le node, son rendu et ses
// interactions (glisser à la souris, flèches au clavier).
//
// Le node ne porte AUCUN attribut : sa seule donnée est sa position dans
// doc.content. Déplacer la ligne = déplacer le node.
// ---------------------------------------------------------

// Blocs de premier niveau du document, séparateur EXCLU, avec leur position
// ProseMirror et leur élément DOM — base commune du drag (rectangles) et du
// déplacement (positions).
function topLevelBlocks(editor) {
  const out = [];
  let splitPos = -1;
  editor.state.doc.forEach(function (node, offset) {
    if (node.type.name === window.SECTION_SPLIT) { splitPos = offset; return; }
    let dom = null;
    try { dom = editor.view.nodeDOM(offset); } catch (e) {}
    out.push({ node: node, pos: offset, dom: dom && dom.nodeType === 1 ? dom : null });
  });
  return { blocks: out, splitPos: splitPos };
}

// Slot courant de la ligne = nombre de blocs de contenu au-dessus d'elle.
function currentSplitSlot(editor) {
  let slot = 0, found = -1;
  editor.state.doc.forEach(function (node) {
    if (found >= 0) return;
    if (node.type.name === window.SECTION_SPLIT) { found = slot; return; }
    slot++;
  });
  return found;
}

// Déplace la ligne au slot demandé, en UNE transaction (suppression +
// réinsertion) : l'historique l'annule d'un seul Ctrl+Z, et le garde
// anti-suppression ci-dessous ne voit jamais de document sans séparateur.
function moveSplitToSlot(editor, slot, refocus) {
  const info = topLevelBlocks(editor);
  if (info.splitPos < 0) return false;
  const blocks = info.blocks;
  const target = Math.max(0, Math.min(slot, blocks.length));
  const from = currentSplitSlot(editor);
  if (target === from) return false;

  const doc = editor.state.doc;
  const splitNode = doc.nodeAt(info.splitPos);
  if (!splitNode) return false;
  const plan = window.splitMovePlan({
    blockPositions: blocks.map(function (b) { return b.pos; }),
    splitPos: info.splitPos,
    splitSize: splitNode.nodeSize,
    docSize: doc.content.size,
    currentSlot: from,
    targetSlot: target
  });
  if (!plan) return false;

  const tr = editor.state.tr;
  tr.delete(plan.from, plan.to);
  tr.insert(tr.mapping.map(plan.insertAt), splitNode);
  editor.view.dispatch(tr);

  if (refocus) {
    // Un déplacement sur une longue distance fait recréer le NodeView par
    // ProseMirror : la poignée qui avait le focus disparaît et le focus retombe
    // sur <body>. Sans ce rattrapage, un utilisateur au clavier perd la ligne
    // dès la première touche et ne peut plus la déplacer.
    // Deux passes volontairement : tout de suite (le nouveau DOM existe déjà,
    // la transaction est appliquée de façon synchrone) pour que la touche
    // suivante arrive au bon endroit, puis à la frame suivante pour repasser
    // après les corrections de focus que le navigateur applique à la fin de la
    // distribution de l'évènement clavier.
    refocusSplitBar(editor);
    requestAnimationFrame(function () { refocusSplitBar(editor); });
  }
  return true;
}

function refocusSplitBar(editor) {
  const bar = editor.view.dom.querySelector('.nsx-bar');
  if (bar && document.activeElement !== bar) bar.focus({ preventScroll: true });
}

function makeSectionSplitNode() {
  const T = window.Tiptap;
  return T.Node.create({
    name: window.SECTION_SPLIT,
    group: 'block',
    atom: true,
    // Ni sélectionnable ni déplaçable par le drag natif de ProseMirror : la
    // ligne ne doit pas pouvoir être sélectionnée puis effacée par mégarde, et
    // son déplacement passe par la poignée (ancré aux frontières de blocs),
    // jamais par un glisser-déposer libre.
    selectable: false,
    draggable: false,
    parseHTML() { return [{ tag: 'div[data-section-split]' }]; },
    renderHTML() { return ['div', { 'data-section-split': '', class: 'nsx' }]; },

    addNodeView() {
      return function (props) {
        const editor = props.editor;

        const dom = document.createElement('div');
        dom.className = 'nsx';
        dom.setAttribute('data-section-split', '');
        dom.setAttribute('contenteditable', 'false');

        // La barre entière est le contrôle : grande cible de pointage, et un
        // seul élément focusable qui porte le rôle ARIA « separator ».
        const bar = document.createElement('div');
        bar.className = 'nsx-bar';
        bar.setAttribute('role', 'separator');
        bar.setAttribute('aria-orientation', 'horizontal');
        bar.setAttribute('tabindex', '0');
        bar.setAttribute('aria-label', 'Début de la conclusion — flèches haut et bas pour déplacer');

        const grip = document.createElement('span');
        grip.className = 'material-icons-outlined nsx-grip';
        grip.textContent = 'drag_indicator';
        grip.setAttribute('aria-hidden', 'true');

        const label = document.createElement('span');
        label.className = 'nsx-label';
        label.textContent = window.CONCLUSION_LABEL;

        const spacer = document.createElement('span');
        spacer.className = 'nsx-spacer';

        // Alternative au glisser pour les utilisateurs de pointeur qui ne
        // peuvent pas maintenir-et-déplacer (WCAG 2.5.7). tabindex=-1 : au
        // clavier, les flèches sur la barre focalisée font déjà le travail, on
        // n'ajoute pas deux tabulations de plus par note.
        const up = document.createElement('button');
        up.type = 'button';
        up.className = 'nsx-nudge';
        up.tabIndex = -1;
        up.title = 'Monter la ligne d’un bloc';
        up.setAttribute('aria-label', 'Monter la ligne d’un bloc');
        up.innerHTML = '<span class="material-icons-outlined" aria-hidden="true">keyboard_arrow_up</span>';

        const down = document.createElement('button');
        down.type = 'button';
        down.className = 'nsx-nudge';
        down.tabIndex = -1;
        down.title = 'Descendre la ligne d’un bloc';
        down.setAttribute('aria-label', 'Descendre la ligne d’un bloc');
        down.innerHTML = '<span class="material-icons-outlined" aria-hidden="true">keyboard_arrow_down</span>';

        // Libellé aligné à gauche, au même niveau que les autres titres de
        // section (ex. « Détails de la consultation ») — la poignée n'est
        // donc plus en tête, elle est tout au bout de la ligne, après les
        // flèches haut/bas, l'autre façon de déplacer la ligne.
        bar.appendChild(label);
        bar.appendChild(spacer);
        bar.appendChild(up);
        bar.appendChild(down);
        bar.appendChild(grip);

        const rule = document.createElement('div');
        rule.className = 'nsx-rule';

        dom.appendChild(bar);
        dom.appendChild(rule);

        // --- état ARIA + compteur, resynchronisés à chaque changement du doc
        // (ajouter une ligne change le maximum atteignable, pas seulement la
        // position de la ligne — le node lui-même, lui, ne change jamais, donc
        // update() du NodeView ne suffirait pas).
        function sync() {
          const json = editor.getJSON();
          const slot = window.splitSlot(json);
          const max = window.splitMaxSlot(json);
          const n = window.conclusionLineCount(json);
          bar.setAttribute('aria-valuemin', '0');
          bar.setAttribute('aria-valuemax', String(max));
          bar.setAttribute('aria-valuenow', String(slot < 0 ? max : slot));
          bar.setAttribute('aria-valuetext', window.splitAriaValueText(json));
          up.disabled = slot <= 0;
          down.disabled = slot >= max;
        }
        sync();
        editor.on('update', sync);

        // --- déplacement au clavier (WCAG 2.1.1 / OMNI31) : la barre a le
        // rôle « separator » focusable, les flèches la déplacent d'un bloc,
        // Origine/Fin l'envoient aux extrémités.
        function onKeyDown(e) {
          let handled = true;
          const cur = currentSplitSlot(editor);
          if (cur < 0) return;
          if (e.key === 'ArrowUp') moveSplitToSlot(editor, cur - 1, true);
          else if (e.key === 'ArrowDown') moveSplitToSlot(editor, cur + 1, true);
          else if (e.key === 'Home') moveSplitToSlot(editor, 0, true);
          else if (e.key === 'End') moveSplitToSlot(editor, window.splitMaxSlot(editor.getJSON()), true);
          else handled = false;
          if (handled) { e.preventDefault(); e.stopPropagation(); }
        }
        bar.addEventListener('keydown', onKeyDown);

        up.addEventListener('click', function (e) {
          e.preventDefault();
          moveSplitToSlot(editor, currentSplitSlot(editor) - 1, true);
        });
        down.addEventListener('click', function (e) {
          e.preventDefault();
          moveSplitToSlot(editor, currentSplitSlot(editor) + 1, true);
        });
        // Les boutons sont dans la barre focusable : sans ça, leurs flèches
        // remonteraient au gestionnaire de la barre et déplaceraient deux fois.
        [up, down].forEach(function (b) {
          b.addEventListener('keydown', function (e) { e.stopPropagation(); });
        });

        // --- glisser à la souris, ancré aux frontières de blocs
        let drag = null;
        let dropLine = null;

        // L'indicateur de dépôt est posé SUR LE BODY, en position fixe, jamais
        // sur les blocs eux-mêmes : ProseMirror observe les mutations du DOM
        // qu'il gère et annule à la frame suivante toute classe ou tout style
        // qu'on y ajoute — un marqueur posé sur un paragraphe disparaissait
        // donc aussitôt, et le glisser se faisait à l'aveugle.
        function showDropLine(slot) {
          if (!drag) return;
          if (!dropLine) {
            dropLine = document.createElement('div');
            dropLine.className = 'nsx-drop-line';
            document.body.appendChild(dropLine);
          }
          const y = window.boundaryY(drag.rects, slot);
          const host = editor.view.dom.getBoundingClientRect();
          dropLine.style.top = y + 'px';
          dropLine.style.left = host.left + 'px';
          dropLine.style.width = host.width + 'px';
        }

        function hideDropLine() {
          if (dropLine && dropLine.parentNode) dropLine.parentNode.removeChild(dropLine);
          dropLine = null;
        }

        function onMouseMove(e) {
          if (!drag) return;
          const slot = window.boundarySlotFromY(drag.rects, e.clientY);
          if (slot !== drag.slot) {
            drag.slot = slot;
            showDropLine(slot);
          }
        }

        function onMouseUp() {
          if (!drag) return;
          const slot = drag.slot;
          const started = drag.startSlot;
          endDrag();
          if (slot !== started) moveSplitToSlot(editor, slot, false);
        }

        function endDrag() {
          drag = null;
          dom.classList.remove('nsx--dragging');
          document.body.classList.remove('nsx-dragging-body');
          hideDropLine();
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
          document.removeEventListener('keydown', onDragKey, true);
        }

        function onDragKey(e) {
          if (e.key === 'Escape') { e.preventDefault(); endDrag(); }
        }

        function onMouseDown(e) {
          if (e.button !== 0) return;
          if (e.target.closest('.nsx-nudge')) return;
          // preventDefault : sans ça, ProseMirror place une sélection dans le
          // document au mousedown et le glisser sélectionne du texte.
          e.preventDefault();
          const info = topLevelBlocks(editor);
          const blocks = info.blocks.filter(function (b) { return b.dom; });
          if (!blocks.length) return;
          const rects = blocks.map(function (b) {
            const r = b.dom.getBoundingClientRect();
            return { top: r.top, bottom: r.bottom };
          });
          const startSlot = currentSplitSlot(editor);
          drag = { blocks: blocks, rects: rects, slot: startSlot, startSlot: startSlot };
          dom.classList.add('nsx--dragging');
          document.body.classList.add('nsx-dragging-body');
          showDropLine(startSlot);
          bar.focus({ preventScroll: true });
          document.addEventListener('mousemove', onMouseMove);
          document.addEventListener('mouseup', onMouseUp);
          document.addEventListener('keydown', onDragKey, true);
        }
        bar.addEventListener('mousedown', onMouseDown);

        return {
          dom: dom,
          // Aucun contentDOM : node atomique. ignoreMutation empêche
          // ProseMirror de re-parser l'intérieur de la barre quand on y change
          // les attributs ARIA ou le compteur.
          ignoreMutation() { return true; },
          stopEvent() { return true; },
          update(updatedNode) { return updatedNode.type.name === window.SECTION_SPLIT; },
          destroy() {
            editor.off('update', sync);
            bar.removeEventListener('keydown', onKeyDown);
            bar.removeEventListener('mousedown', onMouseDown);
            if (drag) endDrag();
          }
        };
      };
    },

    addProseMirrorPlugins() {
      const PM = window.Tiptap.pm;
      function countSplits(doc) {
        let n = 0;
        doc.forEach(function (node) { if (node.type.name === window.SECTION_SPLIT) n++; });
        return n;
      }
      function splitOffset(doc) {
        let at = null;
        doc.forEach(function (node, offset) {
          if (at == null && node.type.name === window.SECTION_SPLIT) at = offset;
        });
        return at;
      }
      // Frontières de blocs de premier niveau — seules positions où un node
      // bloc peut être réinséré.
      function topLevelBounds(doc) {
        const bounds = [0];
        let acc = 0;
        doc.forEach(function (node) { acc += node.nodeSize; bounds.push(acc); });
        return bounds;
      }
      return [
        new PM.Plugin({
          key: new PM.PluginKey('sectionSplitGuard'),
          // Une note garde toujours exactement une ligne de séparation.
          //
          // Elle peut la perdre par une suppression large (Ctrl+A puis
          // Supprimer, ou une sélection à cheval sur les deux zones) : on
          // laisse alors la suppression se faire — la refuser en bloc rendrait
          // « tout sélectionner puis supprimer » sans effet, ce qui donne
          // l'impression d'un éditeur cassé — et on repose la ligne là où elle
          // se trouvait, ramenée à la frontière de bloc la plus proche.
          // L'undo natif annule les deux d'un coup (même groupe d'historique).
          //
          // Elle peut aussi être dupliquée par un copier-coller d'une sélection
          // qui la contenait : on ne garde alors que la première.
          appendTransaction(trs, oldState, newState) {
            if (!trs.some(function (t) { return t.docChanged; })) return null;
            const after = countSplits(newState.doc);

            if (after === 0) {
              if (countSplits(oldState.doc) === 0) return null;
              let at;
              if (window.docIsBlank(newState.doc.toJSON())) {
                // Note vidée : on repart de l'agencement par défaut, ligne en
                // bas. La reposer à la position mappée (donc en tête d'un
                // document vide) mettrait le seul paragraphe restant dans la
                // conclusion, et la frappe suivante y tomberait — alors que par
                // défaut on écrit dans les détails de la consultation.
                at = newState.doc.content.size;
              } else {
                let pos = splitOffset(oldState.doc);
                trs.forEach(function (t) { pos = t.mapping.map(pos, -1); });
                at = window.nearestBoundary(topLevelBounds(newState.doc), pos);
              }
              return newState.tr.insert(at, newState.schema.nodes[window.SECTION_SPLIT].create());
            }

            if (after < 2) return null;
            const extra = [];
            let seen = false;
            newState.doc.forEach(function (node, offset) {
              if (node.type.name !== window.SECTION_SPLIT) return;
              if (!seen) { seen = true; return; }
              extra.push({ from: offset, to: offset + node.nodeSize });
            });
            const tr = newState.tr;
            extra.reverse().forEach(function (r) { tr.delete(r.from, r.to); });
            return tr;
          }
        })
      ];
    }
  });
}

// Position ProseMirror de la ligne de séparation, ou la fin du document si la
// note n'en a pas — point d'insertion « tout en bas des détails ».
function splitPosPM(doc) {
  let found = null;
  doc.forEach(function (node, offset) {
    if (found == null && node.type.name === window.SECTION_SPLIT) found = offset;
  });
  return found == null ? doc.content.size : found;
}

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
      fields: Object.assign({ effDate: new Date().toISOString().slice(0, 10) }, CT_FIELD_DEFAULTS[toolId] || {}),
      savedAt: new Date().toISOString(), author: window.__CURRENT_AUTHOR || null
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
      fields: { default: {} },
      // Horodatage/auteur de la dernière sauvegarde — même rôle que sur
      // chip, voir buildActionLog. Rafraîchi à chaque patchAttrs (tout champ
      // modifié compte comme une sauvegarde de l'outil).
      savedAt: { default: null },
      author: { default: null }
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
        // Toute modification (champ, case, favori, repli…) compte comme une
        // sauvegarde de l'outil pour le Journal des actions.
        const stamped = Object.assign({ savedAt: new Date().toISOString(), author: window.__CURRENT_AUTHOR || null }, patch);
        view.dispatch(view.state.tr.setNodeMarkup(pos, undefined, Object.assign({}, node.attrs, stamped)));
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
        // Sans ça, le mousedown sur un champ du formulaire (input/checkbox…)
        // est intercepté par ProseMirror, qui pose une NodeSelection sur tout
        // l'outil (atom + selectable) au lieu de laisser le focus natif
        // atteindre le champ — la frappe suivante remplace alors le node
        // sélectionné (l'outil complet) par le texte tapé. Même pattern que
        // SectionSplitNode : la NodeView gère seule ses événements internes.
        stopEvent() { return true; },
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

// ---------------------------------------------------------
// LockedHeadingExtension — verrouille l'édition des titres de section fixes
// (posés par DEFAULT_DOC/plainToBlocks, ex. « Détails de la consultation ») :
// des repères structurels au même titre que la barre Conclusion, pas du texte
// que l'utilisateur est censé modifier. `locked` est un attribut global posé
// sur le node heading standard (pas un node custom) pour ne pas avoir à
// importer @tiptap/extension-heading séparément — StarterKit ne l'expose pas
// sur window.Tiptap. Les sections ajoutées à la main (« Nouvelle section »,
// voir editor-field.jsx) n'ont pas cet attribut et restent éditables/
// renommables.
// ---------------------------------------------------------
function makeLockedHeadingExtension() {
  const T = window.Tiptap;
  return T.Extension.create({
    name: 'lockedHeading',
    addGlobalAttributes() {
      return [{
        types: ['heading'],
        attributes: {
          locked: {
            default: false,
            parseHTML: (el) => el.getAttribute('data-locked') === 'true',
            renderHTML: (attrs) => attrs.locked ? { 'data-locked': 'true' } : {}
          }
        }
      }];
    },
    addProseMirrorPlugins() {
      const PM = window.Tiptap.pm;
      function touchesLockedHeading(doc, pos) {
        const $pos = doc.resolve(Math.max(0, Math.min(pos, doc.content.size)));
        for (let d = $pos.depth; d >= 0; d--) {
          if ($pos.node(d).type.name === 'heading' && $pos.node(d).attrs.locked) return true;
        }
        return false;
      }
      return [
        new PM.Plugin({
          key: new PM.PluginKey('lockedHeadingGuard'),
          // Refuse toute transaction dont un step touche l'intérieur d'un
          // heading verrouillé — frappe, collage, changement de niveau via la
          // barre de mise en forme flottante. Contrairement au garde de la
          // ligne de séparation (sectionSplitGuard), on bloque plutôt que
          // laisser faire puis réparer : il n'y a pas de texte « par défaut »
          // à restaurer après coup.
          filterTransaction(tr) {
            if (!tr.docChanged) return true;
            for (let i = 0; i < tr.steps.length; i++) {
              const step = tr.steps[i];
              if (step.from == null) continue;
              const before = tr.docs[i];
              if (touchesLockedHeading(before, step.from)) return false;
              if (step.to != null && touchesLockedHeading(before, step.to)) return false;
            }
            return true;
          }
        })
      ];
    }
  });
}

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
    T.Placeholder.configure({ placeholder: placeholder || '', showOnlyCurrent: true }),
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
    makeLockedHeadingExtension(),
    makeChipNode(),
    makeReferenceNode(),
    makeDiagnosticRegionNode(),
    makeSectionSplitNode(),
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
  let items = window.__SHOW_CLINICAL_TOOLS === false ? all.filter(function (it) { return !it.ctPicker; }) : all;
  // Une seule instance de champ confidentiel par note — le retirer du menu
  // une fois créé (voir window.__CONFIDENTIAL_FIELD_ADDED, posé par NoteEditor.jsx).
  if (window.__CONFIDENTIAL_FIELD_ADDED) items = items.filter(function (it) { return !it.confidentialField; });
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
            if (parsed.mode === 'dx') return searchDx(parsed.term || '');
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
// Document par défaut — les détails de la consultation (Titre 2 + paragraphe),
// puis la ligne de séparation qui ouvre la conclusion. La ligne REMPLACE
// l'ancien Titre 2 « Conclusion » : elle porte le même libellé en permanence,
// mais elle est déplaçable (voir SectionSplitNode).
// Factory (pas une constante partagée) pour ne jamais muter un objet réutilisé.
// ---------------------------------------------------------
function DEFAULT_DOC() {
  return {
    type: 'doc',
    content: [
      { type: 'heading', attrs: { level: 2, locked: true }, content: [{ type: 'text', text: 'Détails de la consultation' }] },
      { type: 'paragraph' },
      { type: 'sectionSplit' },
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
// Journal des actions — « Contenu de la note » (vue en direct, voir
// ActionLog.jsx). Types et ordre d'affichage fixes (spec omnimed) ; seuls
// les types que ce prototype peut réellement produire sont alimentés — les
// autres restent dans la liste pour la place qu'ils occuperaient, mais ne
// produisent jamais d'entrée tant qu'aucun flux ne les crée. Une activité
// modifiée plusieurs fois n'a qu'une entrée : le doc ne garde que le
// dernier état de chaque node, il n'y a pas de dédoublonnage à faire.
// attrs.savedAt/author sont posés à la création/édition (chip,
// clinicalTool) ou à la promotion (diagnosticRegion → Problèmes, voir
// editor-field.jsx) — un diagnostic non promu n'apparaît pas ici, comme
// dans le Sommaire.
// ---------------------------------------------------------
const ACTION_LOG_TYPES = [
  'taches', 'outilsCliniques', 'signesVitaux', 'habitudesDeVie', 'programme',
  'visiteDeProgramme', 'allergies', 'prescriptions', 'inscriptionMedication',
  'resultats', 'requetes', 'consignes', 'immunisation', 'problemes', 'antecedents',
  'antecedentsFamiliaux', 'fichier', 'transmissionCourriel', 'transmissionFax',
  'impression'
];
// Labels seulement — l'icône de chaque entrée vient de son node source
// (chipLogIcon plus bas), jamais d'une icône choisie indépendamment ici :
// c'est ce qui garde le Journal visuellement cohérent avec la note.
const ACTION_LOG_META = {
  outilsCliniques: { label: 'Outils cliniques' },
  prescriptions: { label: 'Prescriptions' },
  requetes: { label: 'Requêtes' },
  consignes: { label: 'Consignes' },
  problemes: { label: 'Problèmes' },
  fichier: { label: 'Fichier' }
};
// chip.attrs.type → clé du journal — seuls les types réellement produits par
// un chip dans ce prototype sont mappés ('problem' n'a pas de flux de
// création dédié, il reste hors journal pour l'instant).
const CHIP_TYPE_TO_LOG = { prescription: 'prescriptions', lab: 'requetes', imaging: 'requetes', referral: 'requetes', instructions: 'consignes', file: 'fichier' };

// Reprend exactement l'icône (et sa couleur, voir chip--rx/lab/img/ref et
// .chip .chip-icon dans editor.css) que ce chip affiche déjà dans le corps
// de la note — voir buildChipDom plus haut dans ce fichier, la même logique
// kind → glyphe. Une prescription n'a pas d'icône de police (glyphe ℞, texte
// pas symbole).
function chipLogIcon(node) {
  if (node.attrs.rx) {
    const kind = node.attrs.rx.kind || 'rx';
    if (kind === 'rx') return { isRx: true };
    return {
      icon: kind === 'lab' ? 'science' : kind === 'img' ? 'radiology' : kind === 'ref' ? 'person_add' : 'bookmark',
      colorClass: 'action-log__icon--' + kind
    };
  }
  if (node.attrs.type === 'instructions') {
    return { icon: node.attrs.icon || 'menu_book', colorClass: 'action-log__icon--consignes' };
  }
  return { icon: node.attrs.icon || 'bookmark' };
}

function buildActionLog(docJson) {
  const order = {};
  ACTION_LOG_TYPES.forEach(function (key, i) { order[key] = i; });
  const entries = [];
  function walk(node) {
    if (!node) return;
    if (node.type === 'chip') {
      const logType = CHIP_TYPE_TO_LOG[node.attrs.type];
      if (logType) {
        entries.push(Object.assign({
          key: 'chip-' + node.attrs.cid, logType: logType,
          title: node.attrs.text || node.attrs.label || '',
          author: node.attrs.author, savedAt: node.attrs.savedAt,
          sourceType: 'chip', sourceId: node.attrs.cid
        }, chipLogIcon(node)));
      }
    } else if (node.type === 'clinicalTool') {
      // Même icône que la barre de l'outil dans la note (ct-bar__wrench).
      entries.push({
        key: 'tool-' + node.attrs.instanceId, logType: 'outilsCliniques',
        title: node.attrs.label || 'Outil clinique', icon: 'link',
        author: node.attrs.author, savedAt: node.attrs.savedAt,
        sourceType: 'clinicalTool', sourceId: node.attrs.instanceId
      });
    } else if (node.type === 'diagnosticRegion' && node.attrs.promotedAt) {
      // Même icône que l'en-tête de la région diagnostic (dxr-ic).
      entries.push({
        key: 'dx-' + node.attrs.id, logType: 'problemes',
        title: node.attrs.name || 'Diagnostic', icon: 'local_hospital',
        author: node.attrs.promotedBy, savedAt: node.attrs.promotedAt,
        sourceType: 'diagnosticRegion', sourceId: node.attrs.id
      });
    }
    (node.content || []).forEach(walk);
  }
  walk(docJson);
  // Ordre fixe par type, puis dernière sauvegarde d'abord au sein d'un type.
  entries.sort(function (a, b) {
    if (order[a.logType] !== order[b.logType]) return order[a.logType] - order[b.logType];
    return (b.savedAt || '').localeCompare(a.savedAt || '');
  });
  return entries.map(function (e) { return Object.assign({}, e, ACTION_LOG_META[e.logType]); });
}

// ---------------------------------------------------------
// buildTransmissionDocs — documents transmissibles d'une note, à partir du
// résultat de scanDoc et de l'état de transmission. Vit ici plutôt que dans
// NoteEditor parce que deux appelants en ont besoin : l'éditeur pour la note
// en cours, et NotesList pour rouvrir le checkout d'une note DÉJÀ complétée
// (en lecture seule).
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

// Position (ProseMirror) juste avant le 2e Titre-2 de premier niveau ou la
// ligne de séparation (le premier des deux), sinon la fin du document —
// « fin de la première section ».
// La ligne de séparation est une borne au même titre qu'un titre : tout ce
// qui est inséré par programme (Assistant IA, référence de passage, dépôt
// depuis le Sommaire) reste ainsi dans les détails de la consultation et ne
// tombe jamais dans la conclusion, même après un déplacement manuel.
function endOfFirstSectionPos(doc) {
  let sawFirstH2 = false, result = null;
  doc.forEach(function (node, offset) {
    if (result != null) return;
    if (node.type.name === window.SECTION_SPLIT) { result = offset; return; }
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
    if (n.type === window.SECTION_SPLIT) return i;
    if (n.type === 'heading' && n.attrs && n.attrs.level === 2) {
      if (sawFirstH2) return i;
      sawFirstH2 = true;
    }
  }
  return content.length;
}

// Gabarit {title, content:'ligne1\nligne2'} → [Titre2, paragraphes...] JSON.
// Titre verrouillé (attrs.locked) : ces sections viennent du gabarit, pas
// d'une saisie — même traitement que le titre par défaut de DEFAULT_DOC.
// Si le titre est « Conclusion », ensureSplit le remplacera de toute façon
// par la ligne de séparation avant tout affichage (voir note-sections.jsx).
function plainToBlocks(title, content) {
  const blocks = [{ type: 'heading', attrs: { level: 2, locked: true }, content: [{ type: 'text', text: title }] }];
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
      rx: entity.rx || null, details: entity.details || null,
      savedAt: new Date().toISOString(), author: window.__CURRENT_AUTHOR || null
    }));
    return true;
  }).run();
}

Object.assign(window, {
  makeSectionSplitNode,
  moveSplitToSlot,
  currentSplitSlot,
  splitPosPM,
  newChipId,
  newDiagId,
  newToolInstanceId,
  searchCIM10,
  searchDx,
  CT_FIELD_DEFAULTS,
  buildClinicalToolNode,
  buildEditorExtensions,
  filterSlashItems,
  parseSlashQuery,
  flattenRxResults,
  buildSlashExtension,
  DEFAULT_DOC,
  scanDoc,
  buildActionLog,
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
