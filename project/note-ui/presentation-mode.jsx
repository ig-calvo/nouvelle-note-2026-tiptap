/* global React */
// =========================================================
// presentation-mode.jsx — mode présentation de la note intelligente.
//
// Activé par ?presentation dans l'URL (voir Note Clinique.html). Une
// personne présente le prototype à des médecins : elle manipule seule, le
// client regarde (partage d'écran). Ce fichier ne contient que l'outillage
// du présentateur — un rail de chapitres, des aide-mémoire et quelques
// amorces de geste. Le prototype lui-même n'est pas modifié : tout passe
// par les événements window déjà écoutés par NoteEditor / editor-field.
//
// Les sept chapitres suivent les tâches 2 à 8 du script de test
// (Confluence VDP « Script V1 »). Le consentement, l'entrevue, la tâche 9
// et la clôture sont de la recherche, pas de la démo : exclus.
// =========================================================

// Réglages figés pendant la présentation : la démo montre la vision Q1 2027,
// sans option de test ni piste qui change d'une séance à l'autre. Appliqués
// par-dessus les valeurs par défaut ET les écarts locaux (localStorage) des
// Tweaks, pour que la démo soit la même d'une machine à l'autre.
// Tous les réglages d'affichage y sont, pour qu'aucun écart local ne change
// ce que voit l'auditoire (complété le 2026-10-28) ; seuls les noms
// (utilisateur, clinique) et la langue restent ceux du présentateur.
const PRESENTATION_TWEAKS = {
  showClinicalTools: true,
  portalActive: true,
  noteWide: false,
  ftBarPosition: 'haut',
  reviewingMode: false,
  checkoutSuggestions: false,
  simulateTxFailure: false,
  groupRequests: false,
  templateDraftLines: true,
  templateTextProposed: false,
  suggestionStyle: 'tirets',
  pendingBadge: true,
  aiProposals: false,
  summaryAddToNote: false,
  suggestionsOn: false,
  suggestionsPlacement: 'curseur',
  visitStart: false,
  inlineFieldEdit: true,
  formOpenMode: 'auto',
  themeMode: 'clair',
};

function isPresentationMode() {
  try { return new URLSearchParams(window.location.search).has('presentation'); }
  catch (e) { return false; }
}

// `needsNote` : le chapitre suppose une note ouverte (ouverte à l'arrivée).
// `seed` : ce que les chapitres précédents ont produit dans la note ('tool',
// 'dx', 'rx'). À l'arrivée sur le chapitre, et avant chaque bouton d'amorce,
// ce qui manque est ajouté — jamais en double : un chapitre sauté ou un saut
// par les repères donne la même note qu'un déroulement complet.
// `focus` : sélecteur CSS de l'élément à mettre en évidence, s'il existe.
// `actions` : amorces de geste — pour gagner du temps, jamais obligatoires.
const PRESENTATION_CHAPTERS = [
  {
    id: 'note', label: t('presentation.note.label'), needsNote: false,
    say: [
      t('presentation.note.say1.text'),
      t('presentation.note.say2.text'),
    ],
    show: [t('presentation.note.show1.text'), t('presentation.note.show2.text')],
    actions: [{ label: t('presentation.note.action.button'), run: function (c) { c.openNote(); } }],
  },
  {
    id: 'commandes', label: t('presentation.commandes.label'), needsNote: true, focus: '.nf-add',
    say: [
      t('presentation.commandes.say1.text'),
      t('presentation.commandes.say2.text'),
    ],
    show: [t('presentation.commandes.show1.text'), t('presentation.commandes.show2.text'), t('presentation.commandes.show3.text')],
    actions: [{ label: t('presentation.commandes.action.button'), run: function () { window.dispatchEvent(new CustomEvent('ct-addmenu-open')); } }],
  },
  {
    id: 'outils', label: t('presentation.outils.label'), needsNote: true,
    say: [
      t('presentation.outils.say1.text'),
    ],
    show: [t('presentation.outils.show1.text'), t('presentation.outils.show2.text'), t('presentation.outils.show3.text')],
    actions: [{ label: t('presentation.outils.action.button'), run: function () { window.dispatchEvent(new CustomEvent('ct-picker-open')); } }],
  },
  {
    id: 'dx', label: t('presentation.dx.label'), needsNote: true, seed: ['tool'],
    say: [
      t('presentation.dx.say1.text'),
      t('presentation.dx.say2.text'),
    ],
    show: [t('presentation.dx.show1.text'), t('presentation.dx.show2.text')],
    actions: [{ label: t('presentation.dx.action.button'), run: function () { window.dispatchEvent(new CustomEvent('note:summary-add', { detail: { command: 'dx' } })); } }],
  },
  {
    id: 'prescrire', label: t('presentation.prescrire.label'), needsNote: true, seed: ['tool', 'dx'],
    say: [
      t('presentation.prescrire.say1.text'),
      t('presentation.prescrire.say2.text'),
    ],
    show: [
      t('presentation.prescrire.show1.text'),
      t('presentation.prescrire.show2.text'),
      t('presentation.prescrire.show3.text'),
    ],
    actions: [{ label: t('presentation.prescrire.action.button'), run: function () { pmStartCommand('rx'); } }],
  },
  {
    id: 'apres', label: t('presentation.apres.label'), needsNote: true, seed: ['tool', 'dx', 'rx'],
    say: [
      t('presentation.apres.say1.text'),
      t('presentation.apres.say2.text'),
    ],
    show: [
      t('presentation.apres.show1.text'),
      t('presentation.apres.show2.text'),
      t('presentation.apres.show3.text'),
      t('presentation.apres.show4.text'),
    ],
    actions: [],
  },
  {
    id: 'transmettre', label: t('presentation.transmettre.label'), needsNote: true, seed: ['tool', 'dx', 'rx'], focus: '.ProseMirror .chip--rx',
    say: [
      t('presentation.transmettre.say1.text'),
      t('presentation.transmettre.say2.text'),
    ],
    show: [
      t('presentation.transmettre.show1.text'),
      t('presentation.transmettre.show2.text'),
      t('presentation.transmettre.show3.text'),
    ],
    actions: [],
  },
];

// ---------------------------------------------------------
// État attendu de la note — ce que les chapitres précédents y ont laissé.
// Tiptap pose l'instance sur son élément DOM (`.ProseMirror`.editor) : on
// s'en sert plutôt que de toucher NoteEditor. Les nœuds sont construits avec
// les mêmes fonctions que les vraies commandes (runOrderCommand /
// runDiagnosticCommand, editor-field.jsx ; insertClinicalTool, NoteEditor.jsx).
// ---------------------------------------------------------
function pmEditor() {
  var el = document.querySelector('.note-card .ProseMirror');
  return (el && el.editor) || null;
}

function pmDocHas(editor, test) {
  var found = false;
  editor.state.doc.descendants(function (node) {
    if (found) return false;
    if (test(node)) found = true;
    return !found;
  });
  return found;
}

const PM_SEEDS = {
  // Chapitre « Outils cliniques » : l'examen physique, version courte.
  tool: {
    has: function (n) { return n.type.name === 'clinicalTool'; },
    node: function () { return window.buildClinicalToolNode('exam-court', L('Examen physique - Version courte')); },
  },
  // Chapitre « Diagnostic /dx » : une région, choisie dans la CIM-10.
  dx: {
    has: function (n) { return n.type.name === 'diagnosticRegion'; },
    node: function () {
      var attrs = window.makeDiagRegionAttrs(
        { __dx: true, action: 'nouveau', pick: { source: 'cim10', name: L('Infection des voies urinaires, siège non précisé'), code: 'N39.0', level: null } },
        { id: window.newDiagId(), now: new Date().toISOString(), author: window.__CURRENT_AUTHOR || null });
      return { type: 'diagnosticRegion', attrs: attrs, content: [{ type: 'paragraph' }] };
    },
  },
  // Chapitre « Prescrire » : l'amoxicilline, favorite du menu /rx.
  rx: {
    has: function (n) { return n.type.name === 'chip' && n.attrs.type === 'prescription'; },
    node: function () {
      var def = window.NOTE_DATA.ORDER_DEFS.rx;
      var item = def.items().filter(function (i) { return i.key === 'amox500'; })[0] || def.items()[0];
      var label = (item.name + ' ' + (item.dose || '')).trim();
      var sig = item.chipSig || item.sig;
      var attrs = {
        cid: window.newChipId(), type: def.type, label: label, icon: def.icon, text: label + ' — ' + sig,
        rx: { name: item.name, dose: item.dose || '', sig: sig, kind: 'rx', renewal: false },
        details: item.details || {}, savedAt: new Date().toISOString(), author: window.__CURRENT_AUTHOR || null,
      };
      return { type: 'paragraph', content: [{ type: 'chip', attrs: attrs }, { type: 'text', text: ' ' }] };
    },
  },
};

// Identifiant de chaque nœud posé par nous : sert à retirer SEULEMENT ceux-là
// en revenant à un chapitre antérieur (ce que le présentateur a créé en direct
// n'est jamais touché).
const PM_SEED_ID = {
  tool: function (n) { return n.attrs.instanceId; },
  dx: function (n) { return n.attrs.id; },
  rx: function (n) { return n.attrs.cid; },
};
const pmSeededIds = {};

// Ajoute ce qui manque, dans l'ordre des chapitres, à la fin de la première
// zone (avant la ligne de la conclusion). Sans focus : le curseur ne bouge pas.
function pmEnsureSeeds(editor, seeds) {
  (seeds || []).forEach(function (kind) {
    var seed = PM_SEEDS[kind];
    if (!seed || pmDocHas(editor, seed.has)) return;
    var json = seed.node();
    pmSeededIds[kind] = kind === 'rx' ? json.content[0].attrs.cid : (kind === 'tool' ? json.attrs.instanceId : json.attrs.id);
    editor.chain().insertContentAt(window.endOfFirstSectionPos(editor.state.doc), json).run();
  });
}

// Retour à un chapitre antérieur : retire ce que nous avions ajouté pour un
// chapitre plus avancé (le diagnostic et la prescription n'ont pas encore eu
// lieu au chapitre 4).
function pmClearBeyond(editor, seeds) {
  Object.keys(PM_SEEDS).forEach(function (kind) {
    var id = pmSeededIds[kind];
    if (!id || (seeds || []).indexOf(kind) >= 0) return;
    delete pmSeededIds[kind];
    var hit = null;
    editor.state.doc.descendants(function (node, pos) {
      if (hit) return false;
      if (PM_SEEDS[kind].has(node) && PM_SEED_ID[kind](node) === id) { hit = { node: node, pos: pos }; return false; }
    });
    if (!hit) return;
    var from = hit.pos, to = hit.pos + hit.node.nodeSize;
    if (kind === 'rx') {
      // La puce est dans un paragraphe à nous (puce + espace) : on retire le paragraphe.
      var $p = editor.state.doc.resolve(hit.pos), para = $p.parent;
      if (para.type.name === 'paragraph' && para.childCount === 2 && para.lastChild.isText && !para.lastChild.text.trim()) {
        from = $p.before(); to = $p.after();
      }
    }
    editor.chain().deleteRange({ from: from, to: to }).run();
  });
}

// Amorce « /rx » (ou « /dx ») dans un paragraphe posé juste SOUS le dernier
// diagnostic : l'événement note:summary-add, lui, s'insère après le paragraphe
// où se trouve le curseur — donc au-dessus du diagnostic si le présentateur a
// déjà écrit une phrase au début de la note. Sans diagnostic : l'événement.
function pmStartCommand(command) {
  var editor = pmEditor(), after = null;
  if (editor) {
    editor.state.doc.forEach(function (node, offset) {
      if (node.type.name === 'diagnosticRegion') after = offset + node.nodeSize;
    });
    // Pas encore de diagnostic : à la fin de la première zone (jamais dans la
    // conclusion, où le curseur peut avoir dérivé après un retrait).
    if (after == null) after = window.endOfFirstSectionPos(editor.state.doc);
  }
  if (!editor) {
    window.dispatchEvent(new CustomEvent('note:summary-add', { detail: { command: command } }));
    return;
  }
  var typed = '/' + command + ' ';
  editor.chain().focus()
    .insertContentAt(after, { type: 'paragraph', content: [{ type: 'text', text: typed }] })
    .setTextSelection(after + 1 + typed.length)
    .run();
}

// Attend que l'éditeur soit monté (Tiptap se charge en asynchrone, et la note
// s'ouvre après le clic) ; renvoie de quoi annuler l'attente.
function pmWhenEditor(cb) {
  var tries = 0;
  var timer = setInterval(function () {
    var editor = pmEditor();
    if (editor) { clearInterval(timer); cb(editor); }
    else if (++tries > 130) clearInterval(timer);
  }, 150);
  return function () { clearInterval(timer); };
}

// ---------------------------------------------------------
// Mode « Auto » : les boutons précédent / suivant avancent d'un ÉTAT de la
// démonstration (douze, tirés des sept chapitres) au lieu d'un chapitre. Chaque
// état met la note dans l'état attendu (outil, diagnostic, prescription : ce
// que `has` liste), puis exécute son geste (ouvrir un menu, amorcer /rx…).
// ---------------------------------------------------------
const PM_ALL = ['tool', 'dx', 'rx'];

function pmFire(name, detail) { window.dispatchEvent(new CustomEvent(name, { detail: detail })); }

// Ferme ce qui est ouvert (menu, recherche, formulaire, envoi rapide) comme le
// ferait Échap : c'est le chemin que prévoient déjà ces composants.
function pmDismiss() {
  var target = document.activeElement || document.body;
  target.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true, cancelable: true }));
}

// Retire ce que la commande a laissé dans le texte : un « /dx » ou « /rx »
// seul dans son paragraphe (recherche abandonnée), ou le « / » que le menu
// « + » insère à la position du curseur (on en vide le paragraphe, qui reste).
function pmCleanCommands(editor) {
  var ranges = [];
  editor.state.doc.forEach(function (n, offset) {
    if (n.type.name !== 'paragraph' || n.childCount !== 1 || !n.firstChild.isText) return;
    if (/^\/(dx|rx)\b/.test(n.textContent)) ranges.push({ from: offset, to: offset + n.nodeSize });
    else if (n.textContent.trim() === '/') ranges.push({ from: offset + 1, to: offset + n.nodeSize - 1 });
  });
  ranges.reverse().forEach(function (r) { editor.chain().deleteRange(r).run(); });
}

// Curseur à la fin du premier paragraphe : le menu « + » y insère son « / ».
// Après un retrait, le curseur retombe parfois dans la conclusion.
function pmCursorInFirstZone(editor) {
  var doc = editor.state.doc, first = doc.firstChild;
  if (!first || first.type.name !== 'paragraph') return;
  editor.chain().focus().setTextSelection(first.nodeSize - 1).run();
}

function pmRxCid(editor) {
  var cid = null;
  editor.state.doc.descendants(function (n) {
    if (cid) return false;
    if (n.type.name === 'chip' && n.attrs.type === 'prescription') cid = n.attrs.cid;
  });
  return cid;
}

function pmOpenRxForm() {
  var editor = pmEditor(), cid = editor && pmRxCid(editor);
  if (cid) pmFire('note:chip-open-request', { editor: editor, cid: cid });
}

function pmOpenQuickSend() {
  var editor = pmEditor(), cid = editor && pmRxCid(editor);
  if (cid) pmFire('note:open-checkout', { cid: cid, kind: 'rx' });
}

// Ajoute une pharmacie puis « Compléter et envoyer », par les boutons mêmes de
// l'envoi rapide (QuickSendModal.jsx) : c'est le geste du présentateur, joué.
function pmTransmit() {
  // Repères data-pm posés par QuickSendModal : le texte change avec la langue.
  function dialog() {
    return document.querySelector('[data-pm="quick-send"]');
  }
  function send() {
    var d = dialog();
    var b = d && d.querySelector('[data-pm="send"]');
    if (b && !b.disabled) b.click();
  }
  function run() {
    var d = dialog();
    if (!d) return;
    if (!d.querySelector('[data-pm="need-recipient"]')) { send(); return; }
    var add = d.querySelector('[data-pm="add-recipient"]');
    if (!add) return;
    add.click();
    setTimeout(function () {
      var dd = dialog();
      if (!dd) return;
      // Les favorites sont en tête de liste : la première est la pharmacie du présentateur.
      var row = dd.querySelector('[data-pm="suggestion"][data-favorite]') || dd.querySelector('[data-pm="suggestion"]');
      if (row) row.click();
      setTimeout(send, 200);
    }, 200);
  }
  if (dialog()) run();
  else { pmOpenQuickSend(); setTimeout(run, 300); }
}

const PM_STATES = [
  { ch: 0, label: t('presentation.state1.label'), has: [] },
  { ch: 0, label: t('presentation.state2.label'), has: [], open: true },
  { ch: 1, label: t('presentation.state3.label'), has: [], open: true, run: function () { pmFire('ct-addmenu-open'); } },
  { ch: 2, label: t('presentation.state4.label'), has: [], open: true, run: function () { pmFire('ct-picker-open'); } },
  { ch: 2, label: t('presentation.state5.label'), has: ['tool'], open: true },
  { ch: 3, label: t('presentation.state6.label'), has: ['tool'], open: true, run: function () { pmStartCommand('dx'); } },
  { ch: 3, label: t('presentation.state7.label'), has: ['tool', 'dx'], open: true },
  { ch: 4, label: t('presentation.state8.label'), has: ['tool', 'dx'], open: true, run: function () { pmStartCommand('rx'); } },
  { ch: 4, label: t('presentation.state9.label'), has: PM_ALL, open: true },
  { ch: 5, label: t('presentation.state10.label'), has: PM_ALL, open: true, run: pmOpenRxForm },
  { ch: 6, label: t('presentation.state11.label'), has: PM_ALL, open: true, run: pmOpenQuickSend },
  { ch: 6, label: t('presentation.state12.label'), has: PM_ALL, open: true, run: pmTransmit },
];
const PM_SENT_STATE = PM_STATES.length - 1;

function pmFirstState(chapterIdx) {
  for (var i = 0; i < PM_STATES.length; i++) if (PM_STATES[i].ch === chapterIdx) return i;
  return 0;
}

// Une prescription déjà transmise ne se « dé-transmet » pas : en revenant avant
// l'état final, celle que nous avions posée est retirée (et reposée vierge).
function pmResetSent(editor, k) {
  var id = pmSeededIds.rx;
  if (!id || k >= PM_SENT_STATE) return;
  var sent = false;
  editor.state.doc.descendants(function (n) {
    if (n.type.name === 'chip' && n.attrs.cid === id && n.attrs.transmittedAt) sent = true;
  });
  if (sent) pmClearBeyond(editor, ['tool', 'dx']);
}

// Joue l'état k : ferme ce qui est ouvert, met la note dans l'état attendu,
// puis fait le geste. Renvoie de quoi annuler (un clic rapide sur suivant
// remplace l'état en cours plutôt que de s'y empiler).
function pmRunState(st, k, openNote, isOpen) {
  var dead = false, timers = [], cancelWait = null, readyHandler = null;
  function later(fn, ms) { timers.push(setTimeout(function () { if (!dead) fn(); }, ms)); }
  function apply(editor) {
    pmDismiss();
    later(function () {
      if (editor) {
        pmCleanCommands(editor);
        pmResetSent(editor, k);
        pmClearBeyond(editor, st.has);
        pmEnsureSeeds(editor, st.has);
      }
      later(function () {
        if (editor) pmCursorInFirstZone(editor);
        if (st.run) st.run();
      }, 80);
    }, 180);
  }
  if (st.open) {
    if (!isOpen()) {
      if (window.Tiptap) openNote();
      else { readyHandler = openNote; window.addEventListener('tiptap:ready', readyHandler, { once: true }); }
    }
    cancelWait = pmWhenEditor(apply);
  } else {
    apply(pmEditor());
  }
  return function () {
    dead = true;
    timers.forEach(clearTimeout);
    if (cancelWait) cancelWait();
    if (readyHandler) window.removeEventListener('tiptap:ready', readyHandler);
  };
}

const PM_CSS = `
  .pm-auto { appearance: none; border: 1px solid var(--mat-sys-outline); background: transparent; color: var(--mat-sys-on-surface-variant);
    font: var(--mat-sys-label-medium); font-weight: 600; height: 28px; padding: 0 10px; border-radius: 14px; cursor: pointer; margin-right: 2px; }
  .pm-auto:hover { background: var(--mat-sys-surface-container-high); }
  .pm-auto[aria-pressed="true"] { background: var(--mat-sys-primary); border-color: var(--mat-sys-primary); color: var(--mat-sys-on-primary); }
  .pm-auto:focus-visible { outline: 2px solid var(--mat-sys-primary); outline-offset: 2px; }
  .app.presentation > :first-child,
  .app.presentation .main-row > :first-child { pointer-events: none; }
  .pm-root { position: fixed; right: 16px; bottom: 16px; z-index: 1000; width: 296px; max-width: calc(100vw - 32px);
    display: flex; flex-direction: column; gap: 8px; font: var(--mat-sys-body-medium); color: var(--mat-sys-on-surface); }
  .pm-card { background: var(--mat-sys-surface-container-lowest); border: 1px solid var(--mat-sys-outline-variant);
    border-radius: 16px; box-shadow: 0 6px 24px rgba(0,0,0,.18); overflow: hidden; }
  .pm-notes { padding: 12px 16px 14px; display: flex; flex-direction: column; gap: 10px; max-height: 54vh; overflow-y: auto; }
  .pm-notes h4 { margin: 0 0 4px; font: var(--mat-sys-label-medium); font-weight: 600; letter-spacing: .04em;
    text-transform: uppercase; color: var(--mat-sys-on-surface-variant); }
  .pm-notes ul { margin: 0; padding-left: 18px; display: flex; flex-direction: column; gap: 4px; }
  .pm-bar { display: flex; align-items: center; gap: 4px; padding: 6px 6px 6px 14px; }
  .pm-title { flex: 1; min-width: 0; display: flex; flex-direction: column; line-height: 1.25; }
  .pm-title small { color: var(--mat-sys-on-surface-variant); font: var(--mat-sys-label-small); }
  .pm-title b { font: var(--mat-sys-title-small); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pm-ib { appearance: none; border: 0; background: transparent; color: var(--mat-sys-on-surface-variant);
    width: 32px; height: 32px; border-radius: 16px; display: grid; place-items: center; cursor: pointer; }
  .pm-ib:hover:not(:disabled) { background: var(--mat-sys-surface-container-high); color: var(--mat-sys-on-surface); }
  .pm-ib:disabled { opacity: .38; cursor: default; }
  .pm-ib:focus-visible, .pm-dot:focus-visible, .pm-act:focus-visible { outline: 2px solid var(--mat-sys-primary); outline-offset: 2px; }
  .pm-ib .material-symbols-outlined { font-size: 22px; }
  .pm-ib--s { width: 28px; height: 28px; border-radius: 14px; }
  .pm-ib--s .material-symbols-outlined { font-size: 18px; }
  .pm-foot { display: flex; align-items: center; gap: 2px; padding: 0 8px 8px 14px; }
  .pm-dots { flex: 1; min-width: 0; display: flex; gap: 4px; padding-right: 6px; }
  .pm-dot { appearance: none; border: 0; padding: 0; height: 6px; flex: 1; border-radius: 3px; cursor: pointer;
    background: var(--mat-sys-outline-variant); }
  .pm-dot[data-done="true"] { background: var(--mat-sys-primary); opacity: .45; }
  .pm-dot[aria-current="step"] { background: var(--mat-sys-primary); opacity: 1; }
  .pm-act { appearance: none; border: 1px solid var(--mat-sys-outline); background: transparent; color: var(--mat-sys-primary);
    font: var(--mat-sys-label-large); border-radius: 18px; padding: 6px 14px; cursor: pointer; align-self: flex-start; }
  .pm-act:hover { background: var(--mat-sys-primary-container); }
  .pm-hint { color: var(--mat-sys-on-surface-variant); font: var(--mat-sys-label-small); }
  .pm-ring { position: fixed; z-index: 999; pointer-events: none; border-radius: 12px;
    box-shadow: 0 0 0 3px var(--mat-sys-primary), 0 0 0 8px color-mix(in srgb, var(--mat-sys-primary) 25%, transparent);
    transition: all .2s ease; }
  .pm-show { position: fixed; right: 16px; bottom: 16px; z-index: 1000; }
  @media (prefers-reduced-motion: reduce) { .pm-ring { transition: none; } }
`;

// Chapitre de départ : #ch=N dans l'URL (survit au rechargement de « Recommencer »).
function pmChapterFromHash() {
  var m = /ch=(\d+)/.exec(window.location.hash || '');
  var n = m ? parseInt(m[1], 10) - 1 : 0;
  return n >= 0 && n < PRESENTATION_CHAPTERS.length ? n : 0;
}

function PresentationMode({ noteOpen, onOpenNote }) {
  const [idx, setIdx] = React.useState(pmChapterFromHash);
  const [notesOpen, setNotesOpen] = React.useState(true);
  // « À dire » est caché par défaut : c'est le texte du présentateur, pas
  // quelque chose à laisser traîner sous les yeux du client en partage d'écran.
  const [sayOpen, setSayOpen] = React.useState(false);
  const [hidden, setHidden] = React.useState(false);
  const [ring, setRing] = React.useState(null);
  const ch = PRESENTATION_CHAPTERS[idx];
  const last = PRESENTATION_CHAPTERS.length - 1;

  // Mode Auto : précédent / suivant avancent d'un état (PM_STATES), pas d'un
  // chapitre. Désactivé : le comportement par chapitre, inchangé.
  const [auto, setAuto] = React.useState(false);
  const [stepIdx, setStepIdx] = React.useState(0);
  const autoRef = React.useRef(false);
  const stepIdxRef = React.useRef(0);
  const noteOpenRef = React.useRef(noteOpen);
  noteOpenRef.current = noteOpen;
  const cancelRef = React.useRef(null);
  const lastState = PM_STATES.length - 1;
  React.useEffect(function () { return function () { if (cancelRef.current) cancelRef.current(); }; }, []);

  function applyState(k) {
    k = Math.max(0, Math.min(lastState, k));
    var st = PM_STATES[k];
    if (cancelRef.current) cancelRef.current();
    stepIdxRef.current = k;
    setStepIdx(k);
    setIdx(st.ch);
    try { window.history.replaceState(null, '', '#ch=' + (st.ch + 1)); } catch (e) {}
    cancelRef.current = pmRunState(st, k, onOpenNote, function () { return noteOpenRef.current; });
  }
  function toggleAuto() {
    var next = !autoRef.current;
    autoRef.current = next;
    setAuto(next);
    // On démarre au premier état du chapitre courant, sans rien rejouer.
    if (next) { var k = pmFirstState(idx); stepIdxRef.current = k; setStepIdx(k); }
    else if (cancelRef.current) cancelRef.current();
  }

  function go(n) {
    n = Math.max(0, Math.min(last, n));
    if (autoRef.current) applyState(pmFirstState(n)); else setIdx(n);
  }
  // Relatif et fonctionnel : deux clics rapprochés avancent de deux pas.
  function step(d) {
    if (autoRef.current) { applyState(stepIdxRef.current + d); return; }
    setIdx(function (n) { return Math.max(0, Math.min(last, n + d)); });
  }
  function restart() {
    window.location.hash = '#ch=1';
    window.location.reload();
  }

  const stepRef = React.useRef(step);
  stepRef.current = step;

  // Un chapitre qui suppose une note ouverte l'ouvre à l'arrivée. Tiptap se
  // charge en asynchrone (esm.sh) : sur un rechargement directement à un
  // chapitre avancé (#ch=5), ouvrir l'éditeur avant tiptap:ready le fait planter.
  React.useEffect(function () {
    try { window.history.replaceState(null, '', '#ch=' + (idx + 1)); } catch (e) {}
    // En Auto, c'est l'état (applyState) qui met la note en place, pas l'arrivée sur le chapitre.
    if (autoRef.current) return undefined;
    // Chapitre sans note requise (le 1er) : si une note est déjà là, elle redevient vierge de ce qu'on a posé.
    if (!ch.needsNote) {
      var open = pmEditor();
      if (open) pmClearBeyond(open, ch.seed);
      return undefined;
    }
    var cleanups = [];
    if (!noteOpen) {
      if (window.Tiptap) onOpenNote();
      else {
        var whenReady = function () { onOpenNote(); };
        window.addEventListener('tiptap:ready', whenReady, { once: true });
        cleanups.push(function () { window.removeEventListener('tiptap:ready', whenReady); });
      }
    }
    cleanups.push(pmWhenEditor(function (editor) {
      pmClearBeyond(editor, ch.seed);
      pmEnsureSeeds(editor, ch.seed);
    }));
    return function () { cleanups.forEach(function (f) { f(); }); };
  }, [idx]);

  // Raccourcis : Ctrl+Alt+flèches / H. Une flèche seule appartient à l'éditeur.
  React.useEffect(function () {
    function onKey(e) {
      if (!(e.ctrlKey && e.altKey)) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); stepRef.current(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); stepRef.current(-1); }
      else if (e.code === 'KeyH') { e.preventDefault(); setHidden(function (h) { return !h; }); }
    }
    window.addEventListener('keydown', onKey, true);
    return function () { window.removeEventListener('keydown', onKey, true); };
  }, []);

  // Anneau de mise en évidence : relu périodiquement (l'élément apparaît, bouge ou disparaît avec la note).
  React.useEffect(function () {
    if (!ch.focus || hidden) { setRing(null); return undefined; }
    function measure() {
      var el = document.querySelector(ch.focus);
      if (!el) { setRing(null); return; }
      var r = el.getBoundingClientRect();
      if (!r.width || !r.height) { setRing(null); return; }
      setRing(function (p) {
        return p && p.top === r.top && p.left === r.left && p.width === r.width && p.height === r.height
          ? p : { top: r.top, left: r.left, width: r.width, height: r.height };
      });
    }
    measure();
    var t = setInterval(measure, 400);
    return function () { clearInterval(t); };
  }, [idx, hidden, noteOpen]);

  const ctx = { openNote: onOpenNote };
  // Un bouton d'amorce remet d'abord la note dans l'état attendu du chapitre
  // (l'utilisateur a pu retirer ce que les chapitres précédents y avaient mis).
  function runAction(a) {
    var editor = pmEditor();
    if (editor) pmEnsureSeeds(editor, ch.seed);
    a.run(ctx);
  }

  if (hidden) {
    return (
      <div className="pm-show">
        <style>{PM_CSS}</style>
        <button type="button" className="pm-ib pm-card" aria-label={t('presentation.showRail.aria')} title={t('presentation.showRail.tooltip')}
          onClick={function () { setHidden(false); }}>
          <span className="material-symbols-outlined" aria-hidden="true">slideshow</span>
        </button>
      </div>
    );
  }

  return (
    <React.Fragment>
      <style>{PM_CSS}</style>
      {ring && <div className="pm-ring" aria-hidden="true" style={{ top: ring.top - 4, left: ring.left - 4, width: ring.width + 8, height: ring.height + 8 }} />}
      {/* mousedown refusé sur les boutons : le curseur reste dans la note, sinon
          cliquer une amorce ferme le menu /rx qu'elle vient d'ouvrir. */}
      <section className="pm-root" aria-label={t('presentation.region.aria')}
        onMouseDown={function (e) { if (e.target.closest && e.target.closest('button')) e.preventDefault(); }}>
        {(notesOpen || sayOpen) &&
          <div className="pm-card pm-notes" id="pm-notes">
            {sayOpen &&
              <div id="pm-say">
                <h4>{t('presentation.aDire.heading')}</h4>
                <ul>{ch.say.map(function (s, i) { return <li key={i}>{s}</li>; })}</ul>
              </div>}
            {notesOpen &&
              <React.Fragment>
                <div>
                  <h4>{t('presentation.gestes.heading')}</h4>
                  <ul>{ch.show.map(function (s, i) { return <li key={i}>{s}</li>; })}</ul>
                </div>
                {ch.actions.map(function (a) {
                  return <button key={a.label} type="button" className="pm-act" onClick={function () { runAction(a); }}>{a.label}</button>;
                })}
                <span className="pm-hint">{t('presentation.hint.text', { unit: auto ? t('presentation.unitStep.text') : t('presentation.unitChapter.text') })}</span>
              </React.Fragment>}
          </div>}
        <div className="pm-card">
          <div className="pm-bar">
            <div className="pm-title">
              {auto
                ? <small>{t('presentation.stepOf.text', { n: stepIdx + 1, total: PM_STATES.length, label: PM_STATES[stepIdx].label })}</small>
                : <small>{t('presentation.chapterOf.text', { n: idx + 1, total: PRESENTATION_CHAPTERS.length })}</small>}
              <b>{ch.label}</b>
            </div>
            <button type="button" className="pm-ib" aria-label={auto ? t('presentation.prevStep.aria') : t('presentation.prevChapter.aria')}
              disabled={auto ? stepIdx === 0 : idx === 0}
              onClick={function () { step(-1); }}>
              <span className="material-symbols-outlined" aria-hidden="true">chevron_left</span>
            </button>
            <button type="button" className="pm-ib" aria-label={auto ? t('presentation.nextStep.aria') : t('presentation.nextChapter.aria')}
              disabled={auto ? stepIdx === lastState : idx === last}
              onClick={function () { step(1); }}>
              <span className="material-symbols-outlined" aria-hidden="true">chevron_right</span>
            </button>
          </div>
          <div className="pm-foot">
            <div className="pm-dots" role="list">
              {PRESENTATION_CHAPTERS.map(function (c, i) {
                return (
                  <button key={c.id} type="button" role="listitem" className="pm-dot" data-done={i < idx}
                    aria-current={i === idx ? 'step' : undefined} aria-label={t('presentation.chapter.aria', { n: i + 1, label: c.label })}
                    title={c.label} onClick={function () { go(i); }} />
                );
              })}
            </div>
            <button type="button" className="pm-auto" aria-pressed={auto} onClick={toggleAuto}
              title={auto ? t('presentation.autoOn.tooltip') : t('presentation.autoOff.tooltip')}>
              Auto
            </button>
            <button type="button" className="pm-ib pm-ib--s" aria-expanded={sayOpen} aria-controls="pm-say"
              aria-label={sayOpen ? t('presentation.hideSay.label') : t('presentation.showSay.label')}
              title={sayOpen ? t('presentation.hideSay.label') : t('presentation.showSay.label')}
              onClick={function () { setSayOpen(function (v) { return !v; }); }}>
              <span className="material-symbols-outlined" aria-hidden="true">{sayOpen ? 'voice_over_off' : 'record_voice_over'}</span>
            </button>
            <button type="button" className="pm-ib pm-ib--s" aria-expanded={notesOpen} aria-controls="pm-notes"
              aria-label={notesOpen ? t('presentation.hideGestures.label') : t('presentation.showGestures.label')}
              title={notesOpen ? t('presentation.hideGestures.label') : t('presentation.showGestures.label')}
              onClick={function () { setNotesOpen(function (v) { return !v; }); }}>
              <span className="material-symbols-outlined" aria-hidden="true">{notesOpen ? 'speaker_notes_off' : 'speaker_notes'}</span>
            </button>
            <button type="button" className="pm-ib pm-ib--s" aria-label={t('presentation.restart.aria')} title={t('presentation.restart.tooltip')}
              onClick={restart}>
              <span className="material-symbols-outlined" aria-hidden="true">restart_alt</span>
            </button>
            <button type="button" className="pm-ib pm-ib--s" aria-label={t('presentation.hideRail.aria')} title={t('presentation.hideRail.tooltip')}
              onClick={function () { setHidden(true); }}>
              <span className="material-symbols-outlined" aria-hidden="true">visibility_off</span>
            </button>
          </div>
        </div>
      </section>
    </React.Fragment>
  );
}
