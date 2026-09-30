/* global React */
// =========================================================
// editor-schema.jsx — Tiptap schema + doc helpers (Tiptap natif : un seul
// document par note, JSON Tiptap = source de vérité). Voir le plan de
// migration : les sections deviennent des Titre 2 dans le document, les
// chips portent leur entité complète dans leurs attrs (plus de map à part).
// =========================================================

let _chipSeq = 1;
function newChipId() { return 'c' + _chipSeq++; }
// newDiagId / listDiagnostics vivent maintenant dans diagnostics.jsx (chargé
// juste avant ce fichier — voir Note Clinique.html), avec le reste du modèle
// des diagnostics (fils, numéros, Sommaire).

// ---------------------------------------------------------
// DOM builder for a chip — même rendu que l'ancien ChipBlot Quill.
// Réutilisé à la fois par la création du NodeView et par sa mise à jour
// (on vide et on repeuple le même nœud DOM, jamais on ne le remplace —
// ProseMirror garde une référence stable au `dom` retourné par le NodeView).
// ---------------------------------------------------------
function buildChipDom(data, existingEl) {
  const node = buildChipDomBase(data, existingEl);
  decorateChipStates(node, data);
  if (data.pending) decoratePendingChip(node, data);
  else node.removeAttribute('data-pending'); // le DOM est réutilisé à la mise à jour (accepté)
  if (data.transmittedAt) decorateSentChip(node, data);
  else node.removeAttribute('data-sent');
  return node;
}

// Chip transmis (D-05) : lecture seule — plus d'édition inline des valeurs
// (data-field retiré ; l'icône ouvre encore les détails, en lecture seule) —
// double coche « Transmis » en fin de chip. Annulé : tag de statut
// « Annulée » après l'icône (anatomie du composant : icône, statut, valeur
// principale), valeurs barrées, plus de double coche.
function decorateSentChip(node, data) {
  node.setAttribute('data-sent', 'true');
  node.querySelectorAll('[data-field]').forEach(function (el) { el.removeAttribute('data-field'); });
  const when = formatChipStamp(data.cancelledAt || data.transmittedAt);
  if (data.cancelledAt) {
    node.classList.add('chip--cancelled');
    const tag = document.createElement('span');
    tag.className = 'chip-status chip-status--cancelled';
    tag.textContent = 'Annulée';
    tag.setAttribute('title', 'Annulation envoyée le ' + when);
    node.insertBefore(tag, node.children[1] || null);
    return;
  }
  node.classList.add('chip--sent');
  const ic = document.createElement('span');
  ic.className = 'material-symbols-outlined chip-sent-icon';
  ic.setAttribute('role', 'img');
  ic.setAttribute('aria-label', 'Transmis');
  ic.setAttribute('title', 'Transmis le ' + when);
  ic.textContent = 'done_all';
  node.appendChild(ic);
}

// ---------------------------------------------------------
// États d'une puce (rencontre inline entity : plusieurs niveaux d'erreur,
// pas seulement le ! rouge). Dérivés des attrs — rien n'est stocké, sauf
// l'échec de transmission (transmitError, posé par NoteEditor).
//   level 'error'   : bordure error + icône ; `blocking` = le checkout ne
//                     laisse pas compléter le document.
//   level 'warning' : icône seulement.
// Une puce annulée n'a plus d'état ; une puce transmise ne garde que
// l'échec de transmission.
// ---------------------------------------------------------
function chipIssues(a) {
  if (!a || a.cancelledAt) return [];
  const out = [];
  if (a.transmitError) out.push({ level: 'error', kind: 'transmission', message: 'Échec de transmission : ' + a.transmitError });
  if (a.transmittedAt) return out;
  const d = a.details || {};
  const blank = function (v) { return v === undefined || v === null || String(v).trim() === ''; };
  if (a.type === 'prescription' && !(a.rx && a.rx.ceased)) {
    // Champs requis du formulaire (ChipPopover) ; le renouvellement vide vaut
    // R0 partout dans le prototype, il n'est donc pas « manquant ».
    const missing = [['dose', 'dose'], ['route', 'voie'], ['frequency', 'fréquence']]
      .filter(function (f) { return blank(d[f[0]]); }).map(function (f) { return f[1]; });
    if (missing.length) out.push({ level: 'error', kind: 'incomplete', blocking: true, message: 'Prescription incomplète — à préciser : ' + missing.join(', ') });
    if (d.alert && d.alert.level === 'high') out.push({ level: 'error', kind: 'interaction', message: d.alert.message || 'Interaction de haut risque' });
  }
  if (a.type === 'referral' && blank(d.question)) out.push({ level: 'warning', kind: 'missing-info', message: 'Question clinique à préciser' });
  return out;
}

// Classes et icônes de fin de puce : état (erreur / avertissement), puis
// commentaire. La double coche « Transmis » vient après (decorateSentChip).
function decorateChipStates(node, data) {
  const issues = chipIssues(data);
  const kinds = issues.map(function (i) { return i.kind; });
  if (kinds.indexOf('interaction') >= 0) node.classList.add('chip--interaction');
  if (issues.some(function (i) { return i.level === 'error' && i.kind !== 'transmission'; })) node.classList.add('chip--error');
  if (issues.length) {
    const worst = issues.some(function (i) { return i.level === 'error'; }) ? 'error' : 'warning';
    const ic = document.createElement('span');
    ic.className = 'material-symbols-outlined chip-issue-icon chip-issue-icon--' + worst;
    ic.setAttribute('role', 'img');
    const text = issues.map(function (i) { return i.message; }).join(' · ');
    ic.setAttribute('aria-label', text);
    ic.setAttribute('title', text);
    ic.textContent = kinds.indexOf('transmission') >= 0 ? 'sync_problem' : kinds.indexOf('interaction') >= 0 ? 'report' : worst;
    node.appendChild(ic);
  }
  const comment = data.details && data.details.comment && String(data.details.comment).trim();
  if (comment) {
    const c = document.createElement('span');
    c.className = 'material-symbols-outlined chip-comment-icon';
    c.setAttribute('role', 'img');
    c.setAttribute('aria-label', 'Commentaire : ' + comment);
    c.setAttribute('title', 'Commentaire : ' + comment);
    c.textContent = 'chat';
    node.appendChild(c);
  }
}

// ---------------------------------------------------------
// Texte d'une puce hors de l'éditeur (rencontre inline entity : en liste de
// notes et à l'impression, seul le texte de la puce reste, lisible dans les
// anciens systèmes et en PDF). Statut + valeur principale + valeurs
// secondaires ; ni icône, ni état (erreur, transmis), ni commentaire. Sans
// icône, une référence ne se reconnaît plus à son nom seul (« Cardiologie ») :
// elle garde un préfixe « Référence : ». Aussi le texte de « Garder en texte ».
// ---------------------------------------------------------
function chipPrintText(a) {
  if (!a) return '';
  const d = a.details || {};
  const rx = a.rx || {};
  const join = function (parts, sep) { return parts.filter(function (p) { return p && String(p).trim(); }).join(sep); };
  let status = '';
  if (a.cancelledAt) status = 'Annulée';
  else if (rx.ceased) status = 'Cessée';
  else if (rx.renewal) status = 'Renouvelée';
  let main = '', second = '';
  if (a.type === 'prescription') {
    main = join([rx.name || d.molecule || a.label, rx.dose || (d.dose ? d.dose + ' ' + (d.unit || '') : '')], ' ');
    second = rx.ceased ? '' : (rx.sig || '');
  } else if (a.type === 'lab') {
    main = (d.tests && d.tests.length) ? d.tests.join(', ') : (rx.name || a.label);
    second = join([d.priority, d.fasting ? 'à jeun' : ''], ', ');
  } else if (a.type === 'imaging') {
    main = rx.name || join([d.modality, d.region], ' ') || a.label;
    second = join([d.laterality, d.priority], ', ');
  } else if (a.type === 'referral') {
    main = 'Référence : ' + (d.specialty || rx.name || a.label);
    second = d.priority || '';
  } else if (a.type === 'problem') {
    main = d.name || a.label;
  } else if (a.type === 'instructions') {
    main = d.title || a.label;
  } else {
    main = a.label || a.text || '';
  }
  return join([status, join([main, second], ' — ')], ' ');
}

// Contenu inline d'un paragraphe, prêt pour le texte seul : deux puces
// séparées par un simple espace (« Plan : [Rx] [Labo] ») se lisent comme une
// seule phrase une fois leurs bordures disparues — on met « ; » entre elles.
function separateAdjacentChips(nodes) {
  const out = [];
  (nodes || []).forEach(function (n, i) {
    const prev = out[out.length - 1];
    const next = nodes[i + 1];
    if (n.type === 'text' && !n.text.trim() && prev && prev.type === 'chip' && next && next.type === 'chip') {
      out.push(Object.assign({}, n, { text: '; ' }));
      return;
    }
    if (n.type === 'chip' && prev && prev.type === 'chip') out.push({ type: 'text', text: '; ' });
    out.push(n);
  });
  return out;
}

function formatChipStamp(iso) {
  const d = iso ? new Date(iso) : null;
  if (!d || isNaN(d.getTime())) return '';
  return d.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' }) + ' à ' + d.toTimeString().slice(0, 5);
}

// Chip en attente (ajout proposé par un gabarit, pas encore accepté) : même
// rendu que le chip réel, mais aucune zone n'est cliquable (plus de
// data-action / data-field, donc ni édition inline ni menu ; double-clic ou
// Entrée ouvre ses détails pour le vérifier avant d'accepter) et deux
// boutons — accepter (check) / refuser (close) — s'ajoutent à la fin. Les
// clics sont traités dans editor-field.jsx (acceptPendingChip / rejectPendingChip).
function decoratePendingChip(node, data) {
  node.classList.add('chip--pending');
  node.setAttribute('data-pending', 'true');
  node.setAttribute('title', (data.proposedBy ? 'Proposé par ' + data.proposedBy : 'Ajout proposé') + ' — double-cliquer pour vérifier avant d’accepter');
  // Proposé par l'Assistant IA (piste de vision) : même puce en attente,
  // marquée comme venant de l'IA (étincelle, couleur des ajouts IA).
  if (data.proposedBy === 'Assistant IA') {
    node.classList.add('chip--ai');
    const spark = document.createElement('span');
    spark.className = 'material-symbols-outlined chip-ai-icon';
    spark.setAttribute('aria-hidden', 'true');
    spark.textContent = 'auto_awesome';
    node.insertBefore(spark, node.firstChild);
  }
  node.querySelectorAll('[data-action], [data-field]').forEach(function (el) {
    el.removeAttribute('data-action');
    el.removeAttribute('data-field');
    el.removeAttribute('title');
  });
  const name = (data.rx && data.rx.name) || data.label || '';
  const wrap = document.createElement('span');
  wrap.className = 'chip-pending-actions';
  [['accept', 'check', 'Accepter l’ajout'], ['reject', 'close', 'Refuser l’ajout']].forEach(function (a) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip-pending-btn chip-pending-btn--' + a[0];
    b.setAttribute('data-pending', a[0]);
    b.setAttribute('aria-label', a[2] + ' : ' + name);
    b.setAttribute('title', a[2]);
    const ic = document.createElement('span');
    ic.className = 'material-symbols-outlined';
    ic.setAttribute('aria-hidden', 'true');
    ic.textContent = a[1];
    b.appendChild(ic);
    wrap.appendChild(b);
  });
  node.appendChild(wrap);
}

function buildChipDomBase(data, existingEl) {
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
      if (kind === 'img' && d.laterality) {
        const lt = document.createElement('span');
        lt.className = 'chip-rx-sig';
        lt.textContent = d.laterality;
        node.appendChild(lt);
      }
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
      author: { default: null },
      // Ajout proposé par un gabarit, en attente d'acceptation (voir
      // decoratePendingChip) : ignoré par scanDoc/buildActionLog tant qu'il
      // n'est pas accepté, effacé s'il est refusé.
      pending: { default: false },
      // Transmission et annulation (D-05) : posés par stampChips, hors
      // historique (Ctrl+Z ne « détransmet » pas). Le Journal ne lit pas ces
      // attrs mais les événements d'action de la note (buildActionLog) : un
      // chip retiré de la note ne porte plus rien, l'événement reste.
      transmittedAt: { default: null },
      cancelledAt: { default: null },
      // Échec de la dernière transmission (tweak « Simuler un échec de
      // transmission ») — effacé par une transmission réussie.
      transmitError: { default: null },
      // Qui propose un ajout en attente (« Gabarit « Otite moyenne aiguë » »).
      proposedBy: { default: null }
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
    if (node.attrs.pending) attrs['data-pending'] = 'true';
    if (node.attrs.transmittedAt) attrs['data-sent'] = 'true';
    return ['span', window.Tiptap.mergeAttributes({ class: 'ql-chip chip' }, HTMLAttributes, attrs), node.attrs.label || ''];
  },
  addNodeView() {
    return (props) => {
      let cid = props.node.attrs.cid;
      const dom = buildChipDom(props.node.attrs);
      return {
        dom,
        ignoreMutation: () => true,
        // ✓ / ✕ d'un chip en attente : ProseMirror ne doit pas traiter ces
        // événements (Entrée y insérerait un saut de ligne au lieu d'activer
        // le bouton focalisé au clavier).
        stopEvent: (event) => !!(event.target && event.target.closest && event.target.closest('.chip-pending-btn')),
        update(updatedNode) {
          if (updatedNode.type.name !== 'chip' || updatedNode.attrs.cid !== cid) return false;
          buildChipDom(updatedNode.attrs, dom);
          return true;
        }
      };
    };
  }
}); }

// Valeur secondaire d'une puce sélectionnée ciblée au clavier (Tab / ⇧ Tab,
// lot 8) : { cid, index } dans ses [data-field]. Effacée dès que la
// sélection quitte la puce (vue du plugin de chipKeys).
let chipFieldFocus = null;
function chipFieldEls(editor, cid) {
  const el = editor.view.dom.querySelector('.chip[data-cid="' + cid + '"]');
  return el ? Array.prototype.slice.call(el.querySelectorAll('[data-field]')) : [];
}
function showChipFieldFocus(editor) {
  editor.view.dom.querySelectorAll('.chip-field--kbd').forEach(function (el) { el.classList.remove('chip-field--kbd'); });
  if (!chipFieldFocus) return;
  const f = chipFieldEls(editor, chipFieldFocus.cid)[chipFieldFocus.index];
  if (f) f.classList.add('chip-field--kbd');
}

// Clavier des puces — extension à part, priorité haute : ses raccourcis
// doivent passer AVANT le keymap de base de Tiptap (deleteSelection
// effacerait la puce sélectionnée avant qu'on puisse demander quoi en faire).
function makeChipKeysExtension() { return window.Tiptap.Extension.create({
  name: 'chipKeys',
  priority: 1000,
  // D-05 — une puce ne disparaît jamais d'un coup au clavier :
  // - Backspace juste après une puce (Delete juste avant) la sélectionne ;
  // - Backspace / Delete sur une puce sélectionnée demande quoi en faire
  //   (note:chip-delete-request → dialogue « Garder en texte / Supprimer »,
  //   editor-field.jsx) ; une puce en attente (gabarit) est refusée sans
  //   dialogue, ce n'est pas encore une entité ;
  // - une sélection de texte qui contient des puces demande confirmation ;
  // - Entrée sur une puce sélectionnée ouvre ses détails.
  addKeyboardShortcuts() {
    const editor = this.editor;
    function selectedChip() {
      const sel = editor.state.selection;
      return sel.node && sel.node.type.name === 'chip' ? sel.node : null;
    }
    function chipsIn(from, to) {
      const out = [];
      editor.state.doc.nodesBetween(from, to, function (node) {
        if (node.type.name === 'chip' && !node.attrs.pending) out.push(node.attrs.cid);
      });
      return out;
    }
    function request(detail) {
      window.dispatchEvent(new CustomEvent('note:chip-delete-request', { detail: Object.assign({ editor: editor }, detail) }));
      return true;
    }
    function remove(dir) {
      const chip = selectedChip();
      if (chip) {
        if (chip.attrs.pending) { window.rejectPendingChip(editor, chip.attrs.cid); return true; }
        return request({ cid: chip.attrs.cid });
      }
      const sel = editor.state.selection;
      if (sel.empty) {
        const $pos = sel.$from;
        const next = dir < 0 ? $pos.nodeBefore : $pos.nodeAfter;
        if (!next || next.type.name !== 'chip') return false;
        return editor.commands.setNodeSelection(dir < 0 ? $pos.pos - next.nodeSize : $pos.pos);
      }
      const cids = chipsIn(sel.from, sel.to);
      if (!cids.length) return false;
      return request({ cids: cids, range: { from: sel.from, to: sel.to } });
    }
    // Tab / ⇧ Tab sur une puce sélectionnée : passe d'une valeur secondaire à
    // l'autre (dose, voie, fréquence…) ; Entrée ouvre alors son éditeur. Actif
    // seulement avec l'édition inline (tweak, D-02) ; les flèches gardent leur
    // rôle habituel (déplacer le curseur hors de la puce).
    function moveField(dir) {
      const chip = selectedChip();
      if (!chip || chip.attrs.pending || chip.attrs.transmittedAt || window.__INLINE_FIELD_EDIT === false) return false;
      const n = chipFieldEls(editor, chip.attrs.cid).length;
      if (!n) return false;
      const cur = chipFieldFocus && chipFieldFocus.cid === chip.attrs.cid ? chipFieldFocus.index : (dir > 0 ? -1 : n);
      chipFieldFocus = { cid: chip.attrs.cid, index: (cur + dir + n) % n };
      showChipFieldFocus(editor);
      return true;
    }
    return {
      Tab: () => moveField(1),
      'Shift-Tab': () => moveField(-1),
      Backspace: () => remove(-1),
      Delete: () => remove(1),
      Enter: () => {
        const chip = selectedChip();
        if (!chip) return false;
        if (chipFieldFocus && chipFieldFocus.cid === chip.attrs.cid) {
          const f = chipFieldEls(editor, chip.attrs.cid)[chipFieldFocus.index];
          if (f) {
            window.dispatchEvent(new CustomEvent('note:chip-open-request', { detail: { editor: editor, cid: chip.attrs.cid, field: f.getAttribute('data-field'), fieldRect: f.getBoundingClientRect() } }));
            return true;
          }
        }
        // Sans ça, Entrée remplacerait la puce sélectionnée par un saut de ligne.
        // Une puce en attente s'ouvre aussi : on peut la vérifier avant d'accepter.
        window.dispatchEvent(new CustomEvent('note:chip-open-request', { detail: { editor: editor, cid: chip.attrs.cid } }));
        return true;
      }
    };
  },
  // Taper une lettre sur une puce sélectionnée la remplacerait : le texte va
  // après la puce, qui reste.
  addProseMirrorPlugins() {
    const editor = this.editor;
    return [new window.Tiptap.pm.Plugin({
      view: function () {
        return {
          update: function (view) {
            const sel = view.state.selection;
            if (chipFieldFocus && !(sel.node && sel.node.type.name === 'chip' && sel.node.attrs.cid === chipFieldFocus.cid)) {
              chipFieldFocus = null;
              showChipFieldFocus(editor);
            } else if (chipFieldFocus) showChipFieldFocus(editor); // la puce a pu être redessinée
          }
        };
      },
      props: {
        handleTextInput(view, from, to, text) {
          const sel = view.state.selection;
          if (!(sel.node && sel.node.type.name === 'chip')) return false;
          const tr = view.state.tr.insertText(text, sel.to);
          tr.setSelection(window.Tiptap.pm.TextSelection.create(tr.doc, sel.to + text.length));
          view.dispatch(tr);
          return true;
        }
      }
    })];
  },
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
//
// Attributs (voir diagnostics.jsx pour leur usage complet — normalizeDiagAttrs,
// diagnosticThreads, makeDiagRegionAttrs) :
//  - id : identifiant de CETTE occurrence, unique dans le document.
//  - dxKey : identité du FIL — partagée par toutes les occurrences d'un même
//    diagnostic repris (Reprendre), c'est elle qui donne le numéro (R3).
//  - name/code/level/source : le diagnostic choisi (texte libre, CIM-10 ou
//    sommaire) — source ne vaut jamais 'note', voir dxThreadIdentity.
//  - sommaireId/documentAs : le lien avec le Sommaire (Problème/Antécédent —
//    D1) et la ligne visée, si le fil vient du dossier ou y a été ajouté.
//  - status/replaces : Cesser (D2) et Remplacer (D3).
//  - documentedAt/documentedBy : horodatage du dernier acte qui a touché le
//    Sommaire — clé du Journal des actions (buildActionLog plus haut).
// Tous font l'aller-retour par des attributs data-* (round-trip HTML), pour
// que le copier-coller d'une région garde son identité complète.
// ---------------------------------------------------------
function dxDataAttrs(attrs) {
  const a = attrs || {};
  const out = { 'data-diag-id': a.id || '' };
  if (a.dxKey) out['data-dx-key'] = a.dxKey;
  if (a.code) out['data-dx-code'] = a.code;
  if (a.level) out['data-dx-level'] = a.level;
  if (a.source) out['data-dx-source'] = a.source;
  if (a.sommaireId) out['data-dx-sommaire-id'] = a.sommaireId;
  if (a.documentAs) out['data-dx-document-as'] = a.documentAs;
  if (a.status === 'cesse') out['data-dx-status'] = 'cesse';
  if (a.replaces) out['data-dx-replaces'] = JSON.stringify(a.replaces);
  if (a.documentedAt) out['data-dx-documented-at'] = a.documentedAt;
  if (a.documentedBy) out['data-dx-documented-by'] = a.documentedBy;
  if (a.createdAt) out['data-dx-created-at'] = a.createdAt;
  return out;
}
function dxAttrsFromDom(dom) {
  const nameEl = dom.querySelector('.dxr-name');
  let replaces = null;
  try { replaces = dom.getAttribute('data-dx-replaces') ? JSON.parse(dom.getAttribute('data-dx-replaces')) : null; } catch (e) {}
  return {
    id: dom.getAttribute('data-diag-id') || null,
    dxKey: dom.getAttribute('data-dx-key') || null,
    name: nameEl ? nameEl.textContent : 'Diagnostic',
    code: dom.getAttribute('data-dx-code') || null,
    level: dom.getAttribute('data-dx-level') || null,
    source: dom.getAttribute('data-dx-source') || null,
    sommaireId: dom.getAttribute('data-dx-sommaire-id') || null,
    documentAs: dom.getAttribute('data-dx-document-as') || null,
    status: dom.getAttribute('data-dx-status') === 'cesse' ? 'cesse' : 'actif',
    replaces: replaces,
    documentedAt: dom.getAttribute('data-dx-documented-at') || null,
    documentedBy: dom.getAttribute('data-dx-documented-by') || null,
    createdAt: dom.getAttribute('data-dx-created-at') || null
  };
}
// ---------------------------------------------------------
// Numérotation des diagnostics par décorations ProseMirror — remplace le
// compteur CSS positionnel omd-diag-counter (editor.css), incapable de
// dédoublonner par fil (R3). Un seul plugin, partagé par la clé
// dxNumberingKey : son state {model, decos} est reconstruit à chaque
// transaction qui change le doc, ou quand la méta dxRefresh est posée (ex.
// au chargement de la CIM-10, pour recalculer canRefine — voir editor-field.jsx).
// decos pose data-dx-num sur chaque .dxr-head (lu par le NodeView, voir
// render() plus bas) et sur chaque .dxref ; le CSS lit attr(data-dx-num)
// au lieu de counter(omd-diag-counter) dans les 5 styles.
// ---------------------------------------------------------
let _dxNumKey = null;
function dxNumberingKey() { return _dxNumKey || (_dxNumKey = new window.Tiptap.pm.PluginKey('diagNumbering')); }

function dxBuildNumberingState(doc) {
  const PM = window.Tiptap.pm;
  const model = window.diagnosticThreads(doc);
  if (!PM.Decoration || !PM.DecorationSet) {
    // Instance de prosemirror-view manquante ou incompatible (voir le
    // commentaire d'import, Note Clinique.html) : pas de numéros affichés
    // plutôt qu'un plantage — signalé une seule fois par appel, pas assez
    // grave pour la bannière tiptap:error (le reste de l'éditeur fonctionne).
    console.error('diagNumbering : Decoration/DecorationSet indisponibles sur window.Tiptap.pm — les numéros de diagnostic ne s’afficheront pas.');
    return { model: model, decos: null };
  }
  const decos = [];
  model.threads.forEach(function (t) {
    const placement = window.diagPlacement(t.effective);
    const linked = !!t.effective.sommaireId;
    const canRefine = window.diagCanRefine(t.effective);
    t.occurrences.forEach(function (o, i) {
      if (o.pos == null || o.nodeSize == null) return; // JSON hors éditeur : rien à décorer
      decos.push(PM.Decoration.node(o.pos, o.pos + o.nodeSize, { 'data-dx-num': String(t.number) }, {
        dxNum: t.number, dxKey: t.dxKey, dxOcc: i + 1, dxOccCount: t.occurrences.length,
        dxPlacement: placement, dxLinked: linked, dxCanRefine: canRefine
      }));
    });
  });
  model.refs.forEach(function (r) {
    if (r.pos == null || r.nodeSize == null) return;
    decos.push(PM.Decoration.node(r.pos, r.pos + r.nodeSize, r.number ? { 'data-dx-num': String(r.number) } : {}, { dxNum: r.number }));
  });
  return { model: model, decos: PM.DecorationSet.create(doc, decos) };
}

function dxNumberingPlugin() {
  const PM = window.Tiptap.pm;
  return new PM.Plugin({
    key: dxNumberingKey(),
    state: {
      init(_config, state) { return dxBuildNumberingState(state.doc); },
      apply(tr, prev, _oldState, newState) {
        if (!tr.docChanged && !tr.getMeta('dxRefresh')) return prev;
        return dxBuildNumberingState(newState.doc);
      }
    },
    props: {
      decorations(state) {
        const s = dxNumberingKey().getState(state);
        return s ? s.decos : null;
      }
    }
  });
}

// Extrait le spec de décoration (dxNum, dxKey…) portant sur CE node depuis le
// tableau `decorations` reçu par le NodeView (création et update()).
function dxSpecFromDecorations(decorations) {
  if (!decorations) return null;
  for (let i = 0; i < decorations.length; i++) {
    const spec = decorations[i] && decorations[i].spec;
    if (spec && spec.dxNum != null) return spec;
  }
  return null;
}

function makeDiagnosticRegionNode() { return window.Tiptap.Node.create({
  name: 'diagnosticRegion',
  group: 'block',
  content: 'paragraph+',
  isolating: true,
  defining: true,
  addAttributes() {
    return {
      id: { default: null }, dxKey: { default: null }, name: { default: 'Diagnostic' },
      code: { default: null }, level: { default: null }, source: { default: null },
      sommaireId: { default: null }, documentAs: { default: null }, status: { default: 'actif' },
      replaces: { default: null }, documentedAt: { default: null }, documentedBy: { default: null },
      createdAt: { default: null }
    };
  },
  parseHTML() {
    return [{ tag: 'div.dxr', getAttrs: dxAttrsFromDom, contentElement: '.dxr-body' }];
  },
  renderHTML({ node, HTMLAttributes }) {
    const a = node.attrs;
    const head = ['div', { class: 'dxr-head', contenteditable: 'false' },
      ['span', { class: 'material-icons-outlined dxr-ic' }, 'local_hospital'],
      ['span', { class: 'dxr-name', 'data-diag-id': a.id }, a.name]];
    if (a.code) head.push(['span', { class: 'dxr-code' }, window.diagCodeLabel(a)]);
    if (a.status === 'cesse') head.push(['span', { class: 'dxr-status' }, 'Cessé']);
    if (a.replaces) head.push(['span', { class: 'dxr-sub' }, 'remplace : ' + a.replaces.name]);
    if (window.diagCanRefine(a)) {
      head.push(['button', { type: 'button', class: 'dxr-refine', title: 'Choisir un code plus précis' }, 'Préciser']);
    }
    const b = window.diagDocButton(window.diagPlacement(a), !!a.sommaireId);
    head.push(['button', { type: 'button', class: 'dxr-doc dxr-doc--' + b.mod, title: b.title },
      ['span', { class: 'material-icons-outlined' }, b.icon],
      ['span', {}, b.label],
      ['span', { class: 'material-icons-outlined dxr-doc__caret' }, 'arrow_drop_down']]);
    return ['div', window.Tiptap.mergeAttributes({ class: 'dxr' }, HTMLAttributes, dxDataAttrs(a)),
      head,
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
      const codeEl = document.createElement('span');
      codeEl.className = 'dxr-code';
      head.appendChild(codeEl);
      const statusEl = document.createElement('span');
      statusEl.className = 'dxr-status';
      statusEl.textContent = 'Cessé';
      head.appendChild(statusEl);
      const subEl = document.createElement('span');
      subEl.className = 'dxr-sub';
      head.appendChild(subEl);
      // « Préciser » — descend d'un niveau dans la CIM-10 sur un code qui a
      // des enfants (D4, diagCanRefine). Ouvre DxEditPopover en mode refine
      // (editor-field.jsx), pas visible tant que le code n'a pas d'enfants
      // (catégorie déjà la plus précise, texte libre, CIM-10 pas encore chargée).
      const refineBtn = document.createElement('button');
      refineBtn.type = 'button';
      refineBtn.className = 'dxr-refine';
      refineBtn.title = 'Choisir un code plus précis';
      refineBtn.textContent = 'Préciser';
      head.appendChild(refineBtn);
      // « Documenter comme » (D1) — remplace l'ancien bouton « Promouvoir en
      // problème ». Son icône/libellé/couleur suivent diagDocButton
      // (diagnostics.jsx) : Documenter / Non documenté / Problème / Antécédent
      // / Antécédent · résolu. Ouvre DiagDocMenu (editor-field.jsx), qui
      // applique la documentation à TOUT le fil (patchDiagRegions).
      const docBtn = document.createElement('button');
      docBtn.type = 'button';
      docBtn.setAttribute('aria-haspopup', 'menu');
      const docIcon = document.createElement('span');
      docIcon.className = 'material-icons-outlined';
      docBtn.appendChild(docIcon);
      const docLabel = document.createElement('span');
      docBtn.appendChild(docLabel);
      const docCaret = document.createElement('span');
      docCaret.className = 'material-icons-outlined dxr-doc__caret';
      docCaret.textContent = 'arrow_drop_down';
      docBtn.appendChild(docCaret);
      head.appendChild(docBtn);

      const body = document.createElement('div');
      body.className = 'dxr-body';

      function render(attrs, spec) {
        const a = window.normalizeDiagAttrs(attrs);
        dom.setAttribute('data-diag-id', a.id || '');
        if (a.dxKey) dom.setAttribute('data-dx-key', a.dxKey); else dom.removeAttribute('data-dx-key');
        dom.classList.toggle('dxr--cesse', a.status === 'cesse');
        nameEl.setAttribute('data-diag-id', a.id || '');
        nameEl.setAttribute('data-dx-code', a.code || '');
        nameEl.textContent = a.name || 'Diagnostic';
        codeEl.textContent = window.diagCodeLabel(a);
        codeEl.hidden = !a.code;
        statusEl.hidden = a.status !== 'cesse';
        subEl.hidden = !a.replaces;
        subEl.textContent = a.replaces ? ('remplace : ' + a.replaces.name) : '';
        refineBtn.hidden = spec ? !spec.dxCanRefine : !window.diagCanRefine(a);
        // Le placement/lien viennent de la décoration quand elle existe (déjà
        // calculés une fois pour tout le fil par dxNumberingPlugin) — sinon
        // (décorations indisponibles) on retombe sur un calcul local.
        const placement = spec ? spec.dxPlacement : window.diagPlacement(a);
        const linked = spec ? spec.dxLinked : !!a.sommaireId;
        const b = window.diagDocButton(placement, linked);
        docBtn.className = 'dxr-doc dxr-doc--' + b.mod;
        docBtn.title = b.title;
        docBtn.setAttribute('aria-label', b.title);
        docIcon.textContent = b.icon;
        docLabel.textContent = b.label;
        // Numéro du fil (dxNumberingPlugin plus haut) : posé par décoration,
        // pas par un attribut du node — il dépend de la position de TOUTES
        // les occurrences du même fil dans le document entier
        // (diagnosticThreads), jamais de cette seule région. Lu par le CSS
        // via attr(data-dx-num) (editor.css, les 5 styles de région).
        if (spec && spec.dxNum != null) head.setAttribute('data-dx-num', String(spec.dxNum));
        else head.removeAttribute('data-dx-num');
      }
      render(props.node.attrs, dxSpecFromDecorations(props.decorations));

      dom.appendChild(head);
      dom.appendChild(body);

      return {
        dom,
        contentDOM: body,
        // Les classes/attrs posés directement sur `head` par ce mousedown
        // délégué (ex. le flash .dxr-flash sur `dom`, voir editor-field.jsx)
        // ne doivent pas déclencher une relecture du node par ProseMirror.
        ignoreMutation(m) { return !body.contains(m.target); },
        update(updatedNode, decorations) {
          if (updatedNode.type.name !== 'diagnosticRegion') return false;
          render(updatedNode.attrs, dxSpecFromDecorations(decorations));
          return true;
        }
      };
    };
  },
  // Entrée sur le dernier paragraphe vide de la région → sort en insérant un
  // nouveau paragraphe APRÈS. Comme une liste à puces, la ligne vide qui a
  // servi à « sortir » ne reste pas dans la région : on la retire dès que la
  // région a un autre paragraphe. Quand c'est son SEUL paragraphe, on ne
  // supprime rien : une région Reprendre/Cesser/Remplacer n'a souvent aucun
  // texte à ajouter, et Entrée est la touche la plus naturelle à taper
  // ensuite — elle ne doit jamais effacer la région ni son numéro (et la
  // région exige au moins un paragraphe).
  // Backspace en tête d'une région réduite à un seul paragraphe vide →
  // suppression explicite de toute la région, elle continue de fonctionner.
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
        const chain = editor.chain();
        let regionEnd = $from.after(regionDepth);
        if (region.childCount > 1) {
          // Le paragraphe vide est le dernier enfant : après sa suppression la
          // région se ferme là où il commençait (+1 pour le jeton de fermeture).
          chain.deleteRange({ from: $from.before(), to: $from.after() });
          regionEnd = $from.before() + 1;
        }
        return chain
          .insertContentAt(regionEnd, { type: 'paragraph' })
          .setTextSelection(regionEnd + 1)
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
  },
  // Garde d'hygiène des ids/dxKey — recale newDiagId() et sépare deux
  // occurrences qui partageraient le même id (copier-coller d'une région),
  // en gardant leur dxKey commune (X4 : elles restent le même fil, donc le
  // même numéro). N'affecte jamais l'état effectif du fil (voir
  // diagnosticThreads) : seule l'identité d'instance est corrigée ici.
  addProseMirrorPlugins() {
    return [
      new window.Tiptap.pm.Plugin({
        appendTransaction(transactions, oldState, newState) {
          if (!transactions.some(function (t) { return t.docChanged; })) return null;
          const seenIds = new Set();
          let changed = false;
          const tr = newState.tr;
          newState.doc.descendants(function (node, pos) {
            if (node.type.name !== 'diagnosticRegion') return;
            let id = node.attrs.id;
            if (!id || seenIds.has(id)) {
              id = window.newDiagId();
              tr.setNodeAttribute(pos, 'id', id);
              changed = true;
            }
            seenIds.add(id);
            if (!node.attrs.dxKey) { tr.setNodeAttribute(pos, 'dxKey', 'n:' + id); changed = true; }
          });
          return changed ? tr : null;
        }
      }),
      dxNumberingPlugin()
    ];
  }
}); }

// patchDiagRegions — seul chemin pour modifier les attributs d'une ou
// plusieurs régions diagnostic après coup (documenter, renommer, préciser…).
// `patches` est un tableau [{id, patch}] — même forme que le retour de
// diagRelabelPatches (diagnostics.jsx) : `patch` est un objet à fusionner
// dans les attrs existants, ou une fonction (attrs) => objet. Une seule
// transaction pour tout le tableau.
function patchDiagRegions(editor, patches) {
  const byId = {};
  (patches || []).forEach(function (p) { if (p && p.id) byId[p.id] = p.patch; });
  if (!Object.keys(byId).length) return false;
  let changed = false;
  editor.chain().command(function (props) {
    const tr = props.tr;
    tr.doc.descendants(function (node, pos) {
      if (node.type.name !== 'diagnosticRegion') return;
      const patch = byId[node.attrs.id];
      if (!patch) return;
      const next = (typeof patch === 'function') ? patch(node.attrs) : patch;
      tr.setNodeMarkup(pos, undefined, Object.assign({}, node.attrs, next));
      changed = true;
    });
    return changed;
  }).run();
  return changed;
}

// getDiagModel — les fils du document VIVANT de l'éditeur. Lit le state du
// plugin dxNumberingPlugin (déjà reconstruit à chaque transaction qui change
// le doc, voir plus haut) au lieu de recalculer : un seul calcul par
// transaction, partagé avec les décorations.
function getDiagModel(editor) {
  const s = dxNumberingKey().getState(editor.state);
  return s ? s.model : window.diagnosticThreads(editor.state.doc);
}

// ---------------------------------------------------------
// DiagnosticRefNode — puce inline « (N) » renvoyant au diagnostic visé par
// dxKey (l'identité du FIL, pas d'une occurrence — R3 : reprendre un
// diagnostic dans la Conclusion doit renvoyer au même numéro qu'en Détails).
// diagId reste lu en parseHTML pour un ancien renvoi collé/repris (résolu
// via byId, voir dxNumberingPlugin/diagnosticThreads) mais n'est plus écrit
// par de nouvelles insertions. Le numéro affiché n'est pas un attribut du
// node : il dépend de la position de TOUS les diagnostics du document et est
// posé par décoration (dxNumberingPlugin ci-dessus), comme updateLineBtnPos
// pour la même raison (état dérivé du doc entier).
// ---------------------------------------------------------
function makeDiagnosticRefNode() { return window.Tiptap.Node.create({
  name: 'diagnosticRef',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,
  draggable: false,
  addAttributes() {
    return { dxKey: { default: null }, diagId: { default: null } };
  },
  parseHTML() {
    return [{
      tag: 'span.dxref[data-diag-id], span.dxref[data-dx-key]',
      getAttrs(dom) { return { dxKey: dom.getAttribute('data-dx-key') || null, diagId: dom.getAttribute('data-diag-id') || null }; }
    }];
  },
  renderHTML({ node }) {
    const attrs = { class: 'dxref', contenteditable: 'false' };
    if (node.attrs.dxKey) attrs['data-dx-key'] = node.attrs.dxKey;
    if (node.attrs.diagId) attrs['data-diag-id'] = node.attrs.diagId;
    return ['span', attrs, '(?)'];
  },
  addNodeView() {
    return (props) => {
      const dom = document.createElement('span');
      dom.className = 'dxref';
      dom.setAttribute('contenteditable', 'false');
      function render(attrs, spec) {
        if (attrs.dxKey) dom.setAttribute('data-dx-key', attrs.dxKey); else dom.removeAttribute('data-dx-key');
        if (attrs.diagId) dom.setAttribute('data-diag-id', attrs.diagId); else dom.removeAttribute('data-diag-id');
        const num = spec ? spec.dxNum : null;
        dom.textContent = num ? '(' + num + ')' : '(?)';
        dom.classList.toggle('dxref-broken', !num);
      }
      render(props.node.attrs, dxSpecFromDecorations(props.decorations));
      return {
        dom,
        ignoreMutation: () => true,
        update(updatedNode, decorations) {
          if (updatedNode.type.name !== 'diagnosticRef') return false;
          render(updatedNode.attrs, dxSpecFromDecorations(decorations));
          return true;
        }
      };
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
    makeChipKeysExtension(),
    makeReferenceNode(),
    makeDiagnosticRegionNode(),
    makeDiagnosticRefNode(),
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
  // Renvoi à un diagnostic : rien à renvoyer tant qu'aucun diagnostic
  // n'existe (voir window.__HAS_DIAGNOSTICS, posé par syncDiagnosticRefs
  // dans editor-field.jsx à chaque transaction).
  if (!window.__HAS_DIAGNOSTICS) items = items.filter(function (it) { return !it.diagRefPicker; });
  if (!t) return items.filter(function (it) { return !it.hideWhenEmpty; });
  return items.filter(function (it) { return it.title.toLowerCase().includes(t) || (it.kbd && it.kbd.includes(t)); });
}

// Requête « rx amox » / « lab fsc » / « img thorax » / « ref cardio » →
// mode ordre. Sinon menu générique.
function parseSlashQuery(query) {
  const m = /^(rx|lab|img|ref|req)\s([\s\S]*)$/i.exec(query || '');
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
            // Mode dx : le modèle affiché/navigué vient de dxBuildModel, construit
            // une seule fois par le contrôleur (editor-field.jsx) — items() ne sert
            // qu'à activer/désactiver la navigation clavier interne du plugin
            // Suggestion, qu'on laisse volontairement inerte ici (voir dxStep).
            if (parsed.mode === 'dx') return [];
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
// (brouillon / note complétée). Les diagnostics sont dédoublonnés par fil
// (diagnosticThreads, diagnostics.jsx) : un diagnostic repris en Détails et
// en Conclusion ne compte qu'une fois.
// ---------------------------------------------------------
function scanDoc(docJson) {
  const chips = [];
  // Formulaires d'outils cliniques présents dans la note. Depuis V7 ils sont
  // transmissibles au même titre qu'une requête (plan V7 §D) — le checkout
  // s'en sert pour construire un document par formulaire. Liste séparée des
  // chips : ce sont des nodes atomiques de bloc, pas des entités inline.
  const tools = [];
  function walk(node) {
    if (!node) return;
    if (node.type === 'chip') {
      if (node.attrs.pending) return; // ajout non accepté : pas encore dans la note
      chips.push({ cid: node.attrs.cid, entity: {
        type: node.attrs.type, label: node.attrs.label, icon: node.attrs.icon,
        text: node.attrs.text, rx: node.attrs.rx || undefined, details: node.attrs.details || undefined,
        transmittedAt: node.attrs.transmittedAt || undefined, cancelledAt: node.attrs.cancelledAt || undefined,
        transmitError: node.attrs.transmitError || undefined
      } });
    } else if (node.type === 'clinicalTool') {
      tools.push({
        id: node.attrs.instanceId, toolId: node.attrs.toolId,
        label: node.attrs.label || '', fields: node.attrs.fields || {}
      });
    }
    (node.content || []).forEach(walk);
  }
  walk(docJson);
  const diagThreads = window.diagnosticThreads(docJson).threads.map(function (t) { return t.effective; });
  const diagNames = diagThreads.map(function (e) { return e.status === 'cesse' ? e.name + ' (cessé)' : e.name; });
  const counts = {};
  chips.forEach(function (c) { if (c.entity.type) counts[c.entity.type] = (counts[c.entity.type] || 0) + 1; });
  if (diagThreads.length) counts.diagnostic = diagThreads.length;
  const items = chips.map(function (c) { return { id: c.cid, type: c.entity.type, label: c.entity.label }; });
  diagThreads.forEach(function (e) { items.push({ id: 'dx-' + e.dxKey, type: 'diagnostic', label: e.name }); });
  return { chips: chips, counts: counts, items: items, diagNames: diagNames, diagThreads: diagThreads, tools: tools };
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
// clinicalTool) ou à la documentation (diagnosticRegion → Problèmes ou
// Antécédents, voir le menu « Documenter comme » dans editor-field.jsx) —
// un diagnostic non documenté n'apparaît pas ici, comme dans le Sommaire.
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
  antecedents: { label: 'Antécédents' },
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

// Événements d'action de la note (D-05) — [{cid, type: 'transmis' | 'annule',
// at, author, snapshot}], `snapshot` = attrs du chip au moment de
// l'événement. Regroupés par chip : c'est ce qui garde au Journal un chip
// transmis puis retiré de la note (effacer n'annule pas l'action clinique).
function chipEventsByCid(events) {
  const byCid = {};
  (events || []).forEach(function (ev) {
    if (!ev || !ev.cid) return;
    const s = byCid[ev.cid] || (byCid[ev.cid] = { transmittedAt: null, cancelledAt: null, snapshot: null });
    if (ev.type === 'transmis' && !s.transmittedAt) s.transmittedAt = ev.at;
    if (ev.type === 'annule') s.cancelledAt = ev.at;
    if (ev.snapshot) s.snapshot = ev.snapshot;
  });
  return byCid;
}

function buildActionLog(docJson, events) {
  const order = {};
  ACTION_LOG_TYPES.forEach(function (key, i) { order[key] = i; });
  const entries = [];
  const sent = chipEventsByCid(events);
  const seen = {};
  function pushChip(attrs, removed) {
    const logType = CHIP_TYPE_TO_LOG[attrs.type];
    if (!logType) return;
    const s = sent[attrs.cid] || {};
    entries.push(Object.assign({
      key: 'chip-' + attrs.cid, logType: logType,
      title: attrs.text || attrs.label || '',
      author: attrs.author, savedAt: attrs.savedAt,
      transmittedAt: s.transmittedAt || null, cancelledAt: s.cancelledAt || null,
      removed: !!removed,
      // Retiré de la note : rien vers quoi défiler.
      sourceType: removed ? null : 'chip', sourceId: removed ? null : attrs.cid
    }, chipLogIcon({ attrs: attrs })));
  }
  function walk(node) {
    if (!node) return;
    if (node.type === 'chip') {
      if (node.attrs.pending) return;
      seen[node.attrs.cid] = true;
      pushChip(node.attrs, false);
    } else if (node.type === 'clinicalTool') {
      // Même icône que la barre de l'outil dans la note (ct-bar__wrench).
      entries.push({
        key: 'tool-' + node.attrs.instanceId, logType: 'outilsCliniques',
        title: node.attrs.label || 'Outil clinique', icon: 'link',
        author: node.attrs.author, savedAt: node.attrs.savedAt,
        sourceType: 'clinicalTool', sourceId: node.attrs.instanceId
      });
    }
    (node.content || []).forEach(walk);
  }
  walk(docJson);
  // Transmis puis retiré de la note : l'entrée reste, depuis l'instantané. Un
  // chip jamais transmis et effacé n'a pas d'événement : il disparaît.
  Object.keys(sent).forEach(function (cid) {
    const s = sent[cid];
    if (!seen[cid] && s.transmittedAt && s.snapshot) pushChip(s.snapshot, true);
  });
  // Diagnostics : une entrée par FIL (pas par occurrence), seulement pour un
  // fil documenté (Problème ou Antécédent — voir diagPlacement,
  // diagnostics.jsx). Même icône que l'en-tête de la région (dxr-ic).
  window.diagnosticThreads(docJson).threads.forEach(function (t) {
    const e = t.effective, placement = window.diagPlacement(e);
    if (!placement || !e.documentedAt) return;
    entries.push({
      key: 'dx-' + t.dxKey, logType: placement === 'probleme' ? 'problemes' : 'antecedents',
      title: e.status === 'cesse' ? e.name + ' — cessé' : (e.replaces ? e.name + ' (remplace ' + e.replaces.name + ')' : e.name),
      verb: e.status === 'cesse' ? 'Cessé' : (e.replaces ? 'Modifié' : 'Documenté'),
      icon: 'local_hospital',
      author: e.documentedBy, savedAt: e.documentedAt,
      sourceType: 'diagnosticRegion', sourceId: e.lastId
    });
  });
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
// opts.groupRequests (tweak « Checkout des requêtes », aussi lu sur
// window.__GROUP_REQUESTS) : toutes les puces labo de la note dans UNE
// requête de laboratoire, toutes les puces imagerie dans une requête
// d'imagerie — comme l'Ordonnance regroupe les prescriptions. Sinon, un
// document par puce (comportement d'origine).
function buildTransmissionDocs(docStats, txState, opts) {
  var groupRequests = opts && opts.groupRequests !== undefined ? !!opts.groupRequests : !!window.__GROUP_REQUESTS;
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
    // Mêmes états que sur la puce (chipIssues) : le checkout les montre, et un
    // état bloquant (prescription incomplète) empêche de compléter le document.
    var issues = chipIssues(ent);
    return { id: e.cid, type: t, label: label, sub: sub, ceased: ceased, variant: variant, issues: issues };
  }

  // Un document bundlant plusieurs items (l'Ordonnance) peut recevoir un
  // nouvel item après avoir déjà été complété/transmis (ex. le médecin
  // ajoute une prescription après avoir faxé l'ordonnance) : dans ce cas,
  // le contenu signé/envoyé n'est plus celui qui existe réellement. On
  // invalide donc complete/transmitted dès que la liste d'items ne
  // correspond plus à celle capturée au moment de la complétion
  // (`itemIds`, posé par markDocComplete) — les destinataires déjà
  // choisis restent, eux, valides et ne sont pas perdus. Seul un AJOUT
  // invalide : un item retiré de la note après la transmission est parti
  // quand même (D-05, effacer n'annule pas), le document reste transmis.
  function withTx(id, kind, title, items) {
    var st = txState[id] || {};
    var captured = (st.itemIds || '').split(',');
    var stale = !!st.complete && items.some(function(it) { return captured.indexOf(it.id) < 0; });
    return {
      id: id, kind: kind, title: title, items: items,
      // Messages des états bloquants de ses items : tant qu'il y en a, le
      // document ne peut pas être complété (DocumentActionPanel, QuickSendModal).
      blocking: items.reduce(function(acc, it) {
        (it.issues || []).forEach(function(i) { if (i.blocking) acc.push(it.label + ' : ' + i.message); });
        return acc;
      }, []),
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
  var grouped = groupRequests ? ['lab', 'imaging'] : [];
  [['lab', 'Requête de laboratoire'], ['imaging', 'Requête d’imagerie']].forEach(function(g) {
    if (grouped.indexOf(g[0]) < 0) return;
    var its = ents.filter(function(e) { return e.entity.type === g[0]; }).map(mkItem);
    if (its.length) docs.push(withTx(g[0], g[0], g[1], its));
  });
  ents.filter(function(e) { return ['lab', 'imaging', 'referral', 'instructions'].indexOf(e.entity.type) >= 0 && grouped.indexOf(e.entity.type) < 0; })
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
    text: node.attrs.text, rx: node.attrs.rx || undefined, details: node.attrs.details || undefined,
    transmittedAt: node.attrs.transmittedAt || undefined, cancelledAt: node.attrs.cancelledAt || undefined,
    transmitError: node.attrs.transmitError || undefined,
    pending: node.attrs.pending || undefined, proposedBy: node.attrs.proposedBy || undefined
  } : null;
}

// Pose des attrs sur des chips sans passer par l'historique : une
// transmission ou une annulation est un fait, Ctrl+Z ne la défait pas.
function stampChips(editor, cids, patch) {
  const tr = editor.state.tr;
  editor.state.doc.descendants(function (node, pos) {
    if (node.type.name === 'chip' && cids.indexOf(node.attrs.cid) >= 0) {
      tr.setNodeMarkup(pos, undefined, Object.assign({}, node.attrs, patch));
    }
  });
  if (!tr.docChanged) return;
  tr.setMeta('addToHistory', false);
  editor.view.dispatch(tr);
}

// Attrs courants d'un chip (instantané d'un événement d'action), ou null.
function chipAttrs(editor, cid) {
  const pos = findChipPos(editor, cid);
  const node = pos >= 0 ? editor.state.doc.nodeAt(pos) : null;
  return node ? Object.assign({}, node.attrs) : null;
}

// Édition undoable : tr.setNodeMarkup préserve la position, couvert par
// l'historique natif de Tiptap (Ctrl+Z annule l'édition d'un chip).
// `extra` : autres attrs dans la même transaction (p. ex. { pending: false }
// — modifier puis accepter un ajout en attente = un seul Ctrl+Z).
function updateChipEntity(editor, cid, entity, extra) {
  const pos = findChipPos(editor, cid);
  if (pos < 0) return;
  editor.chain().command(function (props) {
    props.tr.setNodeMarkup(pos, undefined, Object.assign({}, props.tr.doc.nodeAt(pos).attrs, {
      type: entity.type, label: entity.label, icon: entity.icon, text: entity.text,
      rx: entity.rx || null, details: entity.details || null,
      savedAt: new Date().toISOString(), author: window.__CURRENT_AUTHOR || null
    }, extra || {}));
    return true;
  }).run();
}

// ---------------------------------------------------------
// Ajouts en attente — un gabarit (NOTE_TEMPLATES, `proposals`) n'applique pas
// ses éléments inline : il les propose. Chip `pending` = version temporaire,
// avec ✓ / ✕ (decoratePendingChip). Accepter le crée pour de vrai (même état
// qu'un chip inséré par « / »), refuser l'efface. Les deux sont annulables
// (Ctrl+Z) comme toute transaction Tiptap.
// ---------------------------------------------------------

// Attrs d'un chip d'ordonnance/requête pour un item du catalogue — même
// résultat que runOrderCommand (editor-field.jsx) pour un ajout normal.
function orderChipAttrs(kind, item) {
  const def = window.NOTE_DATA.ORDER_DEFS[kind];
  const label = (item.name + ' ' + (item.dose || '')).trim();
  const sig = item.chipSig || item.sig;
  return {
    cid: newChipId(), type: def.type, label: label, icon: def.icon, text: label + ' — ' + sig,
    rx: { name: item.name, dose: item.dose || '', sig: sig, kind: kind, renewal: false },
    details: item.details || {}
  };
}

// Puce labo pour une liste d'analyses (sélection multiple, profil) : une
// seule puce, ses analyses dans details.tests — retirables dans le formulaire.
function labChipAttrs(details) {
  const d = Object.assign({ tests: [], priority: 'Routine', fasting: false, context: '' }, details);
  const rx = window.NOTE_DATA.deriveLabRx(d);
  return {
    cid: newChipId(), type: 'lab', label: rx.name, icon: window.NOTE_DATA.ORDER_DEFS.lab.icon,
    text: rx.name + (rx.sig ? ' — ' + rx.sig : ''), rx: rx, details: d
  };
}

// Sélection multiple d'une recherche de requêtes (/req, /lab, /img) → attrs
// des puces à insérer, dans cet ordre : UNE puce labo pour toutes les
// analyses cochées (profils déployés, doublons retirés), puis une puce par
// examen d'imagerie (une puce imagerie décrit un seul examen : modalité,
// région, vues). `kind` = recherche d'origine, pour les items sans orderKind.
function buildRequestChips(items, kind) {
  const tests = [];
  let fasting = false;
  const imgs = [];
  const profiles = [];
  (items || []).forEach(function (it) {
    const k = it.orderKind || kind;
    if (k === 'img') { imgs.push(it); return; }
    if (it.profile) profiles.push(it.name);
    (it.details && it.details.tests || [it.name]).forEach(function (t) { if (tests.indexOf(t) < 0) tests.push(t); });
    if (it.details && it.details.fasting) fasting = true;
  });
  const out = [];
  // `profile` : rappel dans le formulaire (« Depuis le profil … »), rien de plus.
  if (tests.length) out.push(labChipAttrs(Object.assign({ tests: tests, fasting: fasting }, profiles.length ? { profile: profiles.join(', ') } : {})));
  imgs.forEach(function (it) { out.push(orderChipAttrs('img', it)); });
  return out;
}

// Auteur des marques « insertion » posées sur le texte d'un gabarit quand il
// est proposé (tweak « Gabarit : texte proposé ») — même mécanisme que le
// texte de l'Assistant IA (markBlocksAsInsertion, review-mode.jsx).
const TEMPLATE_AUTHOR = { id: 'gabarit', name: 'Gabarit' };

// { kind: 'rx'|'lab'|'img'|'ref', key, details? } → node chip en attente, ou
// null si l'item n'existe pas au catalogue. `details` remplace des champs de
// l'item (p. ex. fréquence vide : un gabarit qui crée une ordonnance
// incomplète) ; la posologie affichée est alors recalculée. `source` = qui
// propose (« Gabarit « Otite moyenne aiguë » »), affiché sur la puce et
// dans la barre des ajouts en attente.
function buildPendingChipNode(proposal, source) {
  // { kind: 'profile', key } : un profil de laboratoire, déployé en une puce
  // labo — on retire une analyse en vérifiant l'ajout avant de l'accepter.
  if (proposal.kind === 'profile') {
    const prof = (window.NOTE_DATA.LAB_PROFILES || []).find(function (p) { return p.key === proposal.key; });
    return prof ? { type: 'chip', attrs: Object.assign(buildRequestChips([prof], 'lab')[0], { pending: true, proposedBy: source || null }) } : null;
  }
  const def = window.NOTE_DATA.ORDER_DEFS[proposal.kind];
  const item = def && def.items().find(function (it) { return it.key === proposal.key; });
  if (!item) return null;
  const attrs = Object.assign(orderChipAttrs(proposal.kind, item), { pending: true, proposedBy: source || null });
  if (proposal.details) {
    attrs.details = Object.assign({}, attrs.details, proposal.details);
    if (proposal.kind === 'rx') {
      attrs.rx = Object.assign({}, attrs.rx, { sig: window.NOTE_DATA.deriveRx(attrs.details, attrs.rx).sig });
      attrs.text = attrs.label + ' — ' + attrs.rx.sig;
    }
  }
  return { type: 'chip', attrs: attrs };
}

// Blocs d'un gabarit de note : titres + paragraphes de chaque section, puis
// les ajouts proposés (`proposals`) en fin de dernier paragraphe de la
// section — donc inline, à la suite du texte (« Plan : » + ordonnance).
// opts.proposeText : le texte des paragraphes (pas les titres) arrive aussi
// en suggestion, à accepter ou refuser (D-03, tout le gabarit).
function buildTemplateBlocks(tpl, opts) {
  const source = 'Gabarit « ' + (tpl.name || tpl.key) + ' »';
  const proposeText = !!(opts && opts.proposeText) && typeof window.markBlocksAsInsertion === 'function';
  let blocks = [];
  (tpl.sections || []).forEach(function (s) {
    let sec = plainToBlocks(s.title, s.content || '');
    if (proposeText) {
      sec = sec.map(function (b) { return b.type === 'paragraph' ? window.markBlocksAsInsertion([b], TEMPLATE_AUTHOR)[0] : b; });
    }
    const nodes = (s.proposals || []).map(function (p) { return buildPendingChipNode(p, source); }).filter(Boolean);
    if (nodes.length) {
      const last = sec[sec.length - 1];
      const inline = [];
      nodes.forEach(function (n) { inline.push(n, { type: 'text', text: ' ' }); });
      if (last && last.type === 'paragraph') last.content = (last.content || []).concat(inline);
      else sec.push({ type: 'paragraph', content: inline });
    }
    blocks = blocks.concat(sec);
  });
  return blocks;
}

function acceptPendingChip(editor, cid) {
  const pos = findChipPos(editor, cid);
  if (pos < 0) return;
  editor.chain().focus().command(function (props) {
    props.tr.setNodeMarkup(pos, undefined, Object.assign({}, props.tr.doc.nodeAt(pos).attrs, {
      pending: false, savedAt: new Date().toISOString(), author: window.__CURRENT_AUTHOR || null
    }));
    return true;
  }).run();
}

// Fin de la plage à effacer pour un chip : le chip, et l'espace qui le
// suivait si le texte d'avant finit déjà par un espace (ou si le chip ouvre
// son paragraphe) — sinon « Plan :  ».
function pendingChipDeleteEnd(doc, pos) {
  const node = doc.nodeAt(pos);
  let to = pos + node.nodeSize;
  const before = doc.textBetween(Math.max(doc.resolve(pos).start(), pos - 1), pos);
  const after = doc.textBetween(to, Math.min(doc.resolve(to).end(), to + 1));
  if (after === ' ' && (before === '' || before === ' ')) to += 1;
  return to;
}

function rejectPendingChip(editor, cid) {
  const pos = findChipPos(editor, cid);
  if (pos < 0) return;
  editor.chain().focus().command(function (props) {
    props.tr.delete(pos, pendingChipDeleteEnd(props.tr.doc, pos));
    return true;
  }).run();
}

// Ajouts en attente d'un doc JSON : puces `pending` et paragraphes qui
// portent du texte proposé par un gabarit. `sources` = qui les propose.
function pendingSummary(docJson) {
  let chips = 0, paragraphs = 0;
  const sources = [];
  const isTemplateText = function (n) {
    return n.type === 'text' && (n.marks || []).some(function (m) { return m.type === 'insertion' && m.attrs && m.attrs.authorId === TEMPLATE_AUTHOR.id; });
  };
  function walk(node) {
    if (!node) return;
    if (node.type === 'chip' && node.attrs && node.attrs.pending) {
      chips++;
      if (node.attrs.proposedBy && sources.indexOf(node.attrs.proposedBy) < 0) sources.push(node.attrs.proposedBy);
    }
    if (node.type === 'paragraph' && (node.content || []).some(isTemplateText)) paragraphs++;
    (node.content || []).forEach(walk);
  }
  walk(docJson);
  return { chips: chips, paragraphs: paragraphs, count: chips + paragraphs, sources: sources };
}

// Tout accepter / tout refuser les ajouts en attente, en UNE transaction
// (un seul Ctrl+Z). `reviewAction` : le traqueur du mode révision l'ignore.
function resolveAllPending(editor, accept) {
  const doc = editor.state.doc;
  const ops = [];
  doc.descendants(function (node, pos) {
    if (node.type.name === 'chip' && node.attrs.pending) ops.push({ chip: node, from: pos });
  });
  (window.scanReviewChanges ? window.scanReviewChanges(doc) : []).forEach(function (c) {
    if (c.kind === 'insertion' && c.authorId === TEMPLATE_AUTHOR.id) ops.push({ from: c.from, to: c.to });
  });
  if (!ops.length) return;
  const stamp = { pending: false, savedAt: new Date().toISOString(), author: window.__CURRENT_AUTHOR || null };
  editor.chain().focus().command(function (props) {
    const tr = props.tr;
    tr.setMeta('reviewAction', true);
    ops.sort(function (a, b) { return b.from - a.from; }).forEach(function (op) {
      if (op.chip) {
        if (accept) tr.setNodeMarkup(op.from, undefined, Object.assign({}, op.chip.attrs, stamp));
        else tr.delete(op.from, pendingChipDeleteEnd(tr.doc, op.from));
      } else if (accept) tr.removeMark(op.from, op.to, props.state.schema.marks.insertion);
      else tr.delete(op.from, op.to);
    });
    return true;
  }).run();
}

// Même résolution sur un doc JSON (finalisation, tests). Ne modifie pas le
// doc reçu. Refuser retire les puces en attente et le texte proposé.
function resolvePendingInDoc(docJson, accept) {
  const isTemplateMark = function (m) { return m.type === 'insertion' && m.attrs && m.attrs.authorId === TEMPLATE_AUTHOR.id; };
  function walk(node) {
    if (!node || !node.content) return node;
    const content = [];
    let dropSpace = false; // chip refusé : l'espace qui le suivait part aussi (voir pendingChipDeleteEnd)
    node.content.forEach(function (c) {
      if (dropSpace && c.type === 'text' && c.text.charAt(0) === ' ') {
        dropSpace = false;
        if (c.text.length === 1) return;
        c = Object.assign({}, c, { text: c.text.slice(1) });
      }
      dropSpace = false;
      if (c.type === 'chip' && c.attrs && c.attrs.pending) {
        if (accept) content.push(Object.assign({}, c, { attrs: Object.assign({}, c.attrs, { pending: false }) }));
        else {
          const prev = content[content.length - 1];
          dropSpace = !prev || (prev.type === 'text' && /\s$/.test(prev.text));
        }
        return;
      }
      if (c.type === 'text' && (c.marks || []).some(isTemplateMark)) {
        if (!accept) return;
        const marks = c.marks.filter(function (m) { return !isTemplateMark(m); });
        const t = Object.assign({}, c);
        if (marks.length) t.marks = marks; else delete t.marks;
        content.push(t);
        return;
      }
      content.push(walk(c));
    });
    return Object.assign({}, node, { content: content });
  }
  return walk(docJson);
}

// Doc sans ses chips en attente — ce qui n'a pas été accepté n'entre pas dans
// la note complétée. Ne modifie pas le doc reçu.
function stripPendingChips(docJson) {
  function walk(node) {
    if (!node || !node.content) return node;
    const content = [];
    node.content.forEach(function (c) {
      if (c.type === 'chip' && c.attrs && c.attrs.pending) return;
      content.push(walk(c));
    });
    return Object.assign({}, node, { content: content });
  }
  return walk(docJson);
}

Object.assign(window, {
  orderChipAttrs,
  labChipAttrs,
  buildRequestChips,
  buildPendingChipNode,
  buildTemplateBlocks,
  acceptPendingChip,
  rejectPendingChip,
  pendingSummary,
  resolveAllPending,
  resolvePendingInDoc,
  TEMPLATE_AUTHOR,
  stripPendingChips,
  makeSectionSplitNode,
  moveSplitToSlot,
  currentSplitSlot,
  splitPosPM,
  newChipId,
  newToolInstanceId,
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
  stampChips,
  chipAttrs,
  chipIssues,
  chipPrintText,
  separateAdjacentChips,
  formatChipStamp,
  updateChipEntity,
  patchDiagRegions,
  getDiagModel
});
