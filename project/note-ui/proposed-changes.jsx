// =========================================================
// proposed-changes.jsx — Changement proposé : un seul modèle pour le texte
// et les entités (lot 1 de PLAN-gabarits-vision-v1.md).
//
// Un « changement proposé » est soit un passage de texte (marque `insertion`
// ou `deletion`, review-mode.jsx), soit une entité en attente (puce `pending`,
// editor-schema.jsx). Le stockage reste celui d'avant (Q1) : ce module ne
// fait que LIRE le document d'une seule façon (scanProposedChanges), le
// RÉSOUDRE d'une seule façon (planProposedResolution → applyProposedOps, en
// UNE transaction) et le résumer d'une seule façon (summarizeProposedChanges).
//
// Aucun JSX et aucune dépendance au chargement : tout ce qui vient d'un autre
// fichier (window.chipIssues, window.TEMPLATE_AUTHOR) se lit à l'appel, pour
// que tests/proposed-changes.test.mjs le charge tel quel.
//
// États d'une entité proposée (D5 de la vision) :
//   'draft'      ligne à compléter (état 1) : une recherche à rouvrir, rien à accepter
//   'incomplete' préremplie incomplète (état 2) : dose, voie ou fréquence vide
//   'complete'   complète (état 3)
// « Tout accepter » ne prend que le texte et les entités complètes (D4) ; une
// entité qui n'a pas été acceptée n'entre pas dans la note finale (Q8).
// =========================================================

function proposedTemplateAuthorId() {
  return (window.TEMPLATE_AUTHOR && window.TEMPLATE_AUTHOR.id) || 'gabarit';
}

// 'ia' | 'gabarit' | 'medecin'. Lot 2 y ajoutera 'copie' avec des auteurs
// portés par le document ; d'ici là, l'auteur se déduit de ce que le
// document porte déjà (authorId d'une marque, proposedBy d'une puce).
function proposedAuthorKind(authorId) {
  if (authorId === 'ai') return 'ia';
  if (authorId === proposedTemplateAuthorId()) return 'gabarit';
  return 'medecin';
}

function proposedEntityAuthor(attrs) {
  const name = attrs.proposedBy || '';
  const ai = !!name && name === t('ai.assistant.name');
  return { id: ai ? 'ai' : proposedTemplateAuthorId(), name: name, kind: ai ? 'ia' : 'gabarit' };
}

function proposedEntityIssues(attrs) {
  return window.chipIssues ? window.chipIssues(attrs) : [];
}

function proposedEntityState(attrs) {
  if (attrs.draft) return 'draft';
  return proposedEntityIssues(attrs).some(function (i) { return i.kind === 'incomplete'; }) ? 'incomplete' : 'complete';
}

// ---------------------------------------------------------
// Scan — `doc` expose `descendants(fn(node, pos))` comme un doc ProseMirror
// (ou proposedDocLike pour un doc JSON). Texte : un changement = run contigu
// de text nodes {même type de marque, même auteur}, recalculé à la demande,
// jamais stocké. Entité : une puce `pending`, un changement à elle seule.
// Liste dans l'ordre du document.
// ---------------------------------------------------------
function scanProposedChanges(doc) {
  const changes = [];
  doc.descendants(function (node, pos) {
    if (node.isText) {
      const m = (node.marks || []).find(function (mk) { return mk.type.name === 'insertion' || mk.type.name === 'deletion'; });
      if (!m) return;
      const last = changes[changes.length - 1];
      if (last && last.to === pos && last.kind === m.type.name && last.authorId === m.attrs.authorId) {
        last.to = pos + node.nodeSize;
        last.text += node.text;
      } else {
        changes.push({
          id: m.type.name + ':' + pos,
          kind: m.type.name,
          from: pos,
          to: pos + node.nodeSize,
          author: { id: m.attrs.authorId, name: m.attrs.authorName || '', kind: proposedAuthorKind(m.attrs.authorId) },
          authorId: m.attrs.authorId,
          authorName: m.attrs.authorName,
          color: m.attrs.color,
          ts: m.attrs.ts,
          text: node.text,
          acceptable: true,
          canAccept: true
        });
      }
      return;
    }
    if (node.type.name === 'chip' && node.attrs && node.attrs.pending) {
      const a = node.attrs;
      const state = proposedEntityState(a);
      const author = proposedEntityAuthor(a);
      changes.push({
        id: 'entity:' + a.cid,
        kind: 'entity',
        from: pos,
        to: pos + node.nodeSize,
        author: author,
        authorId: author.id,
        authorName: author.name,
        cid: a.cid,
        entityType: a.type,
        state: state,
        label: (a.draft && a.draft.term) || a.label || (a.rx && a.rx.name) || '',
        detail: (state !== 'draft' && a.rx && a.rx.sig) || '',
        warn: a.warn || null,
        // Une alerte d'allergie ne rend pas l'entité incomplète : elle reste
        // acceptable, et visible dans la liste courte (proposedShortList).
        conflict: proposedEntityIssues(a).some(function (i) { return i.kind === 'allergy'; }),
        // Une ligne à compléter attend un choix : rien à accepter. Une entité
        // incomplète s'accepte à la pièce (le formulaire la complète), mais
        // « Tout accepter » ne la prend pas.
        canAccept: state !== 'draft',
        acceptable: state === 'complete'
      });
    }
  });
  return changes;
}

// Compteurs, et de quoi alimenter la barre : qui propose, et par état.
// `count`, `chips`, `paragraphs`, `drafts` : la forme de l'ancien
// pendingSummary (editor-schema.jsx), que ses appelants lisent encore.
function summarizeProposedChanges(changes) {
  const s = { total: changes.length, text: 0, entities: 0, draft: 0, incomplete: 0, complete: 0, acceptable: 0, sources: [] };
  // Un gabarit signe son texte « Gabarit » et ses puces « Gabarit « Otite… » » :
  // c'est une seule source, nommée par ses puces.
  const entityAuthors = {};
  changes.forEach(function (c) { if (c.kind === 'entity') entityAuthors[c.author.id] = true; });
  changes.forEach(function (c) {
    if (c.kind === 'entity') { s.entities++; s[c.state]++; } else s.text++;
    if (c.acceptable) s.acceptable++;
    if (c.kind !== 'entity' && entityAuthors[c.author.id]) return;
    if (c.authorName && s.sources.indexOf(c.authorName) < 0) s.sources.push(c.authorName);
  });
  s.unfinished = s.draft + s.incomplete;
  s.count = s.total;
  s.chips = s.entities;
  s.paragraphs = s.text;
  s.drafts = s.draft;
  return s;
}

// La liste courte d'avant « Tout accepter » (Q7) : ce que le geste prendrait
// parmi les entités, soit les complètes — nom, posologie. Un conflit
// d'allergie y reste visible : la décision reste celle du médecin.
function proposedShortList(changes) {
  return changes.filter(function (c) { return c.kind === 'entity' && c.acceptable; }).map(function (c) {
    return { id: c.id, label: c.label, detail: c.detail, conflict: c.conflict };
  });
}

// Voisin à atteindre depuis la position `pos` : dir 1 = suivant, -1 =
// précédent. Fait le tour : après le dernier on retrouve le premier.
// `inclusive` : un changement qui commence à `pos` compte comme suivant —
// c'est le cas après un refus, où le changement d'après a pris la place de
// celui qui vient de partir.
function nextProposedChange(changes, pos, dir, inclusive) {
  if (!changes.length) return null;
  if (dir < 0) {
    for (let i = changes.length - 1; i >= 0; i--) if (changes[i].to < pos) return changes[i];
    return changes[changes.length - 1];
  }
  for (let i = 0; i < changes.length; i++) if (inclusive ? changes[i].from >= pos : changes[i].from > pos) return changes[i];
  return changes[0];
}

// Met le curseur sur un changement : la puce sélectionnée, ou le début du
// passage de texte ; la page défile jusqu'à lui.
function focusProposedChange(editor, change) {
  if (!change) return;
  if (change.kind === 'entity') editor.chain().focus().setNodeSelection(change.from).run();
  else editor.chain().focus().setTextSelection(change.from).run();
  try {
    const dom = editor.view.domAtPos(change.from).node;
    (dom.nodeType === 1 ? dom : dom.parentElement).scrollIntoView({ block: 'center', behavior: 'smooth' });
  } catch (e) {}
}

// Passe au changement suivant (dir 1) ou précédent (dir -1) depuis le curseur.
// → le changement atteint, ou null s'il n'y en a plus.
function moveToProposedChange(editor, dir, inclusive) {
  const next = nextProposedChange(scanProposedChanges(editor.state.doc), editor.state.selection.from, dir, inclusive);
  focusProposedChange(editor, next);
  return next;
}

// ---------------------------------------------------------
// Résolution — un plan d'opérations pur, puis une application en une seule
// transaction (un seul Ctrl+Z ; `reviewAction` : le traqueur du mode révision
// l'ignore). Texte : accepter une insertion ou refuser une suppression garde
// le texte et retire la marque ; refuser une insertion ou accepter une
// suppression le retire. Entité : accepter la crée pour de vrai ; refuser
// l'efface, avec l'espace qui la suivait.
//
// accept : true / false.
// opts.all      : le geste « Tout accepter » — seuls le texte et les entités
//                 complètes sont acceptés (sans `all`, tout ce qui s'accepte à
//                 la pièce l'est).
// opts.dropRest : avec `all`, ce qui n'est pas accepté est retiré (finalisation, Q8).
// opts.range    : { from, to } — seulement ce qui s'y trouve (une région de diagnostic).
// ---------------------------------------------------------
function planProposedResolution(changes, accept, opts) {
  opts = opts || {};
  const inside = function (c) { return !opts.range || (c.from >= opts.range.from && c.to <= opts.range.to); };
  const ops = [];
  changes.filter(inside).forEach(function (c) {
    const take = accept && (opts.all ? c.acceptable : c.canAccept);
    const drop = !accept || (opts.all && opts.dropRest);
    if (c.kind === 'entity') {
      if (take) ops.push({ op: 'accept', from: c.from, to: c.to });
      else if (drop) ops.push({ op: 'deleteEntity', from: c.from, to: c.to });
    } else if (take || !accept) {
      const kill = (c.kind === 'insertion') !== take;
      ops.push(kill ? { op: 'delete', from: c.from, to: c.to } : { op: 'unmark', from: c.from, to: c.to, mark: c.kind });
    }
  });
  return ops;
}

// Fin de la plage à effacer pour une puce : la puce, et l'espace qui la
// suivait si le texte d'avant finit déjà par un espace (ou si la puce ouvre
// son paragraphe) — sinon « Plan :  ». Lue sur le doc au moment de l'effacer.
function proposedEntityDeleteEnd(doc, pos) {
  const node = doc.nodeAt(pos);
  let to = pos + node.nodeSize;
  const before = doc.textBetween(Math.max(doc.resolve(pos).start(), pos - 1), pos);
  const after = doc.textBetween(to, Math.min(doc.resolve(to).end(), to + 1));
  if (after === ' ' && (before === '' || before === ' ')) to += 1;
  return to;
}

// Ce qu'une entité acceptée porte de plus : le moment et la personne.
function proposedAcceptStamp() {
  return { pending: false, warn: null, savedAt: new Date().toISOString(), author: window.__CURRENT_AUTHOR || null };
}

// Positions traitées en ordre décroissant : chaque opération laisse valides
// celles qui la précèdent. L'effacement d'une puce lit le doc vivant : si le
// texte qui la suit vient d'être refusé, l'espace n'y est plus.
function applyProposedOps(tr, ops, schema, stamp) {
  tr.setMeta('reviewAction', true);
  ops.slice().sort(function (a, b) { return b.from - a.from; }).forEach(function (op) {
    if (op.op === 'delete') tr.delete(op.from, op.to);
    else if (op.op === 'unmark') tr.removeMark(op.from, op.to, schema.marks[op.mark]);
    else if (op.op === 'accept') tr.setNodeMarkup(op.from, undefined, Object.assign({}, tr.doc.nodeAt(op.from).attrs, stamp));
    else if (op.op === 'deleteEntity') tr.delete(op.from, proposedEntityDeleteEnd(tr.doc, op.from));
  });
}

// → le nombre d'opérations faites.
function resolveProposed(editor, changes, accept, opts) {
  const ops = planProposedResolution(changes, accept, opts);
  if (!ops.length) return 0;
  const stamp = proposedAcceptStamp();
  editor.chain().command(function (props) {
    applyProposedOps(props.tr, ops, props.state.schema, stamp);
    return true;
  }).run();
  return ops.length;
}

// ---------------------------------------------------------
// Sur un doc JSON — la finalisation et les tests. Même règles, sans
// transaction ; ne modifie pas le doc reçu. `accept` : texte et entités
// complètes acceptés, le reste (ligne à compléter, entité incomplète) retiré.
// Refuser retire tout : puces, textes insérés ; les suppressions refusées
// gardent leur texte.
// ---------------------------------------------------------
function resolveProposedInDoc(docJson, accept) {
  const markOf = function (c) {
    return (c.marks || []).find(function (m) { return m.type === 'insertion' || m.type === 'deletion'; });
  };
  function walk(node) {
    if (!node || !node.content) return node;
    const content = [];
    let dropSpace = false; // puce retirée : l'espace qui la suivait part aussi (voir proposedEntityDeleteEnd)
    node.content.forEach(function (c) {
      if (dropSpace && c.type === 'text' && c.text.charAt(0) === ' ') {
        dropSpace = false;
        if (c.text.length === 1) return;
        c = Object.assign({}, c, { text: c.text.slice(1) });
      }
      dropSpace = false;
      if (c.type === 'chip' && c.attrs && c.attrs.pending) {
        if (accept && proposedEntityState(c.attrs) === 'complete') {
          content.push(Object.assign({}, c, { attrs: Object.assign({}, c.attrs, { pending: false, warn: null }) }));
        } else {
          const prev = content[content.length - 1];
          dropSpace = !prev || (prev.type === 'text' && /\s$/.test(prev.text));
        }
        return;
      }
      const m = c.type === 'text' ? markOf(c) : null;
      if (m) {
        const kill = (m.type === 'insertion') !== accept;
        if (kill) return;
        const marks = c.marks.filter(function (x) { return x !== m; });
        const out = Object.assign({}, c);
        if (marks.length) out.marks = marks; else delete out.marks;
        content.push(out);
        return;
      }
      content.push(walk(c));
    });
    return Object.assign({}, node, { content: content });
  }
  return walk(docJson);
}

// Un doc JSON vu comme un doc ProseMirror pour le scan (`descendants`,
// `nodeSize`, `isText`, `marks`, `type.name`, `attrs`). Les tailles suivent
// ProseMirror (texte : sa longueur ; puce et autres feuilles : 1 ; le reste :
// le contenu + 2) pour les types connus de ce prototype ; elles ne servent
// qu'à ordonner les changements d'un doc qui n'est pas dans l'éditeur.
const PROPOSED_LEAF_TYPES = ['chip', 'sectionSplit', 'reference', 'hardBreak'];
function proposedDocLike(docJson) {
  function wrap(n) {
    if (n.type === 'text') {
      return {
        isText: true, text: n.text, type: { name: 'text' }, attrs: {}, nodeSize: n.text.length,
        marks: (n.marks || []).map(function (m) { return { type: { name: m.type }, attrs: m.attrs || {} }; })
      };
    }
    const kids = (n.content || []).map(wrap);
    const inner = kids.reduce(function (sum, k) { return sum + k.nodeSize; }, 0);
    return {
      isText: false, type: { name: n.type }, attrs: n.attrs || {}, marks: [], children: kids,
      nodeSize: PROPOSED_LEAF_TYPES.indexOf(n.type) >= 0 ? 1 : inner + 2
    };
  }
  const root = wrap(docJson);
  root.descendants = function (fn) {
    function visit(node, start) {
      let pos = start;
      node.children.forEach(function (k) {
        // Comme ProseMirror : `false` n'entre pas dans le nœud.
        if (fn(k, pos) !== false && k.children) visit(k, pos + 1);
        pos += k.nodeSize;
      });
    }
    visit(root, 0);
  };
  return root;
}

Object.assign(window, {
  proposedAuthorKind,
  proposedEntityState,
  scanProposedChanges,
  summarizeProposedChanges,
  proposedShortList,
  nextProposedChange,
  focusProposedChange,
  moveToProposedChange,
  planProposedResolution,
  proposedEntityDeleteEnd,
  applyProposedOps,
  resolveProposed,
  resolveProposedInDoc,
  proposedDocLike
});
