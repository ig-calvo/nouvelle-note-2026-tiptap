/* global React */
// =========================================================
// AgentFab.jsx — l'agent flottant (réglage « Suggestions », emplacement
// « Agent flottant » ; exploration du 2026-11-02). Un FAB en bas à droite :
//   - au repos il reste discret (passif) : rien de ciblé à proposer ;
//   - pendant l'écriture, il signale les suggestions du point actif, les
//     mêmes que la colonne (useNoteSuggestions, SuggestionsColumn.jsx) ;
//   - au clic, il ouvre un panneau persistant, qui reste ouvert pendant qu'on
//     écrit : les suggestions à choisir, et une invite pour demander à
//     l'assistant de nouvelles suggestions ou un ajout à la note, tirés d'une
//     recherche dans le dossier.
// Une recherche prend du temps : l'animation montre les sources lues une à
// une. Elle continue panneau fermé (anneau qui tourne autour du FAB).
// Réponses SIMULÉES, assemblées à partir des données de démonstration (notes
// antérieures, sommaire, catalogue des conduites) — à valider cliniquement.
// Mode passif (RA-57, PROPOSITION-assistant-ia-passif.md) : panneau fermé,
// quand le point actif a des suggestions ciblées, des bulles-boutons
// s'affichent au-dessus du FAB (3 au plus). Un clic sur une bulle INSÈRE la
// suggestion, en changement proposé (puce ou texte mauve, ✓ ✕ ; jamais posée
// d'office) ; ✕ l'écarte pour la note ; un clic sur l'en-tête des bulles ou
// sur le FAB OUVRE le panneau. Dans le panneau, un bloc de réponse inséré
// passe à « Inséré · Voir dans la note » et reste réinsérable ; refusé ou
// effacé dans la note, il redevient « à insérer ».
// Variantes (Tweaks) :
//   signal     'bulles' | 'pastille' | 'etendu' | 'halo' : comment l'assistant
//              signale ses suggestions (bulles : le mode passif ci-dessus) ;
//   ouverture  'panneau' | 'tiroir' : panneau ancré au FAB, ou tiroir latéral ;
//   animation  'etapes' | 'compacte' : les sources une à une, ou une seule ligne ;
//   taille     'petit' | 'grand' : panneau de 320 × 460 px au plus (laisse voir
//              le haut du Sommaire), ou de 400 × 640 px ; le tiroir 360 ou 400 px.
// =========================================================
const AG_STEP_MS = 750;
const AG_WRITE_MS = 1100;
// Le FAB étendu (« 3 suggestions · Migraine ») se replie après ce délai.
const AG_EXTENDED_MS = 6000;
const AG_MAX_ORDERS = 5;
// Bulles de suggestion au-dessus du FAB, et longueur du début de texte qui
// retrouve un passage inséré dans la note (proposedInsertionPos).
const AG_BUBBLES = 3;
const AG_PROBE = 24;
const AG_QUICK = [
  { intent: 'resume', icon: 'summarize', label: t('agent.rapide.resume.button') },
  { intent: 'commandes', icon: 'prescriptions', label: t('agent.rapide.commandes.button') },
  { intent: 'medication', icon: 'medication', label: t('agent.rapide.medication.button') },
];

const AG_CSS = `
/* Fond en dégradé et bordure plus marquée (RA-57) : de l'indigo du DS3 à son bleu
   acier, pâles pour les surfaces (texte sombre, plus de 7 : 1), pleins pour
   les gestes (icône, FAB allumé, texte blanc). Les jetons suivent clair / sombre. */
:root {
  --ag-grad: linear-gradient(135deg, var(--mat-sys-primary) 0%, var(--mat-sys-tertiary) 100%);
  --ag-grad-soft: linear-gradient(135deg,
    color-mix(in srgb, var(--mat-sys-primary) 16%, var(--mat-sys-surface-container-lowest)) 0%,
    color-mix(in srgb, var(--mat-sys-tertiary) 26%, var(--mat-sys-surface-container-lowest)) 100%);
  --ag-grad-panel: linear-gradient(180deg,
    color-mix(in srgb, var(--mat-sys-primary) 18%, var(--mat-sys-surface-container-low)) 0%,
    color-mix(in srgb, var(--mat-sys-tertiary) 10%, var(--mat-sys-surface-container-low)) 30%,
    var(--mat-sys-surface-container-low) 62%);
  --ag-border: color-mix(in srgb, var(--mat-sys-primary) 50%, transparent);
}
@keyframes ag-spin { to { transform: rotate(360deg); } }
@keyframes ag-halo {
  0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--mat-sys-primary) 45%, transparent); }
  70% { box-shadow: 0 0 0 16px color-mix(in srgb, var(--mat-sys-primary) 0%, transparent); }
  100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--mat-sys-primary) 0%, transparent); }
}
@keyframes ag-pop { 0% { transform: scale(0); } 70% { transform: scale(1.25); } 100% { transform: scale(1); } }
@keyframes ag-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
@keyframes ag-in { from { opacity: 0; transform: translateY(12px) scale(.98); } to { opacity: 1; transform: none; } }
@keyframes ag-drawer { from { transform: translateX(100%); } to { transform: none; } }
@keyframes ag-up { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
@keyframes ag-glow { 0%, 100% { opacity: .55; } 50% { opacity: 1; } }
/* Anneau qui tourne : l'angle du dégradé s'anime (@property), pas l'élément,
   pour épouser n'importe quelle forme (FAB carré arrondi, avatar rond). */
@property --ag-a { syntax: '<angle>'; inherits: false; initial-value: 0deg; }
@keyframes ag-turn { to { --ag-a: 360deg; } }
.ag-ring {
  position: absolute; inset: -4px; border-radius: inherit; padding: 3px; pointer-events: none;
  background: conic-gradient(from var(--ag-a), transparent 0 25%, var(--mat-sys-primary) 60%, var(--mat-sys-tertiary) 85%, transparent 100%);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor;
  mask: linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0);
  animation: ag-turn 1.1s linear infinite;
}
.ag-halo { animation: ag-halo 1.8s ease-out infinite; }
.ag-pop { animation: ag-pop 360ms ease-out; }
.ag-in { animation: ag-in 220ms ease-out; transform-origin: bottom right; }
.ag-drawer { animation: ag-drawer 240ms ease-out; }
.ag-up { animation: ag-up 260ms ease-out both; }
.ag-shimmer {
  background: linear-gradient(90deg, var(--mat-sys-on-surface-variant) 0%, var(--mat-sys-on-surface-variant) 35%, var(--mat-sys-primary) 50%, var(--mat-sys-on-surface-variant) 65%, var(--mat-sys-on-surface-variant) 100%);
  background-size: 200% 100%; -webkit-background-clip: text; background-clip: text; color: transparent;
  animation: ag-shimmer 1.8s linear infinite;
}
.ag-skel {
  height: 10px; border-radius: 6px;
  background: linear-gradient(90deg, var(--mat-sys-surface-container) 0%, var(--mat-sys-surface-container-highest) 50%, var(--mat-sys-surface-container) 100%);
  background-size: 200% 100%; animation: ag-shimmer 1.4s linear infinite;
}
.ag-bar-fill { position: relative; overflow: hidden; }
.ag-bar-fill::after {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(90deg, transparent, color-mix(in srgb, #fff 55%, transparent), transparent);
  background-size: 200% 100%; animation: ag-shimmer 1.2s linear infinite;
}
.ag-glow { animation: ag-glow 1.4s ease-in-out infinite; }
.ag-row:hover:not(:disabled) { background: var(--mat-sys-surface-container) !important; }
.ag-chip:hover { background: var(--mat-sys-surface-container-high) !important; }
.ag-bubble:hover { border-color: var(--mat-sys-primary) !important; box-shadow: var(--mat-sys-level3) !important; }
.ag-bubble-head:hover { background: color-mix(in srgb, var(--mat-sys-primary) 28%, var(--mat-sys-surface-container-lowest)) !important; }
.ag-main:focus-visible, .ag-x:focus-visible, .ag-bubble-head:focus-visible, .ag-link:focus-visible { outline: 3px solid var(--mat-sys-primary); outline-offset: 2px; }
.ag-x:hover { background: color-mix(in srgb, var(--mat-sys-primary) 14%, transparent) !important; }
@media (prefers-reduced-motion: reduce) {
  .ag-ring, .ag-halo, .ag-shimmer, .ag-skel, .ag-bar-fill::after, .ag-glow { animation-duration: 6s; }
  .ag-pop, .ag-in, .ag-drawer, .ag-up { animation: none; }
}
`;

// Ce que vise une demande : le diagnostic du curseur, sinon le premier de la
// note, sinon le premier problème du sommaire qui a des conduites suggérées.
// → { attrs: { id?, name, code }, inNote } ou null.
function agTargetDx(editor) {
  const here = editor ? window.dxRegionAtSelection(editor.state) : null;
  if (here) return { attrs: here, inNote: true };
  let first = null;
  if (editor) editor.state.doc.forEach(function (n) {
    if (!first && n.type.name === 'diagnosticRegion' && n.attrs.documentAs !== 'antecedent') first = n.attrs;
  });
  if (first) return { attrs: first, inNote: true };
  const data = window.NOTE_DATA;
  const som = (window.getSommaireDiagnostics ? window.getSommaireDiagnostics() : []).filter(function (d) { return d.sommaireKind === 'probleme'; });
  const d = som.find(function (x) { return data.contextResultsFor(x, 'rx').length + data.contextResultsFor(x, 'req').length > 0; }) || som[0];
  return d ? { attrs: { name: d.name, code: d.code }, inNote: false } : null;
}

// L'intention d'une demande écrite, par mots-clés (français et anglais).
// 'tout' : on cherche partout, et on répond par un résumé et des conduites.
function agIntentOf(text) {
  const s = (text || '').toLowerCase();
  if (/m[ée]dica|allerg|traitement|\bmeds?\b|drug/.test(s)) return 'medication';
  if (/prescri|requ[êe]t|labo|examen|imag|order|\btests?\b|bilan|conduite|suivi|follow/.test(s)) return 'commandes';
  if (/r[ée]sum|histor|summar|pr[ée]c[ée]d|dernier|last/.test(s)) return 'resume';
  return 'tout';
}

function agPatient() {
  const s = window.PATIENT_SUMMARY || {};
  return {
    meds: s.meds || [],
    allergies: (s.allergies || []).filter(function (a) { return a.type !== 'none'; }),
    problems: (window.getSommaireDiagnostics ? window.getSommaireDiagnostics() : []).filter(function (d) { return d.sommaireKind === 'probleme'; }),
    notes: window.PAST_NOTES || [],
  };
}

// Sources lues, dans l'ordre de l'animation, selon l'intention.
function agSources(intent, target) {
  const p = agPatient();
  const active = p.meds.filter(function (m) { return m.status === 'active'; });
  const all = {
    notes: { icon: 'history_edu', label: t('agent.source.notes.label'), found: tn('agent.source.notes.found', p.notes.length) },
    sommaire: { icon: 'assignment', label: t('agent.source.sommaire.label'), found: tn('agent.source.sommaire.found', p.problems.length) },
    meds: { icon: 'medication', label: t('agent.source.meds.label'), found: tn('agent.source.meds.found', active.length) },
    allergies: { icon: 'eco', label: t('agent.source.allergies.label'),
      found: p.allergies.length ? p.allergies.map(function (a) { return a.name; }).join(', ') : t('agent.source.allergies.none') },
    resultats: { icon: 'science', label: t('agent.source.resultats.label'), found: t('agent.source.resultats.none') },
    conduites: { icon: 'menu_book', label: t('agent.source.conduites.label'),
      found: target ? t('suggest.pour.text', { name: target.attrs.name }) : t('agent.source.conduites.none') },
  };
  const order = {
    resume: ['notes', 'sommaire', 'meds', 'allergies'],
    medication: ['meds', 'allergies', 'notes'],
    commandes: ['sommaire', 'allergies', 'resultats', 'conduites'],
    tout: ['notes', 'sommaire', 'meds', 'allergies', 'resultats', 'conduites'],
  }[intent];
  return order.map(function (k) { return Object.assign({ key: k }, all[k]); });
}

function agAuthor(a) { return /%%DOCTOR%%/.test(a || '') ? t('suggest.vous.text') : a; }
function agOneLine(s) { return String(s || '').replace(/\s*\n\s*/g, ' ').trim(); }
function agDate(s) { return String(s || '').replace(/\s+\d{1,2}:\d{2}$/, '').toLowerCase(); }

// Les notes antérieures qui parlent du diagnostic visé (un mot de son nom
// dans le titre ou les diagnostics de la note), sinon la plus récente.
function agNotesFor(target, notes) {
  const words = target ? window.dxNormName(target.attrs.name).split(/\W+/).filter(function (w) { return w.length > 4; }) : [];
  const hits = notes.filter(function (n) {
    const hay = window.dxNormName([n.title].concat(n.diagnostics || []).join(' '));
    return words.some(function (w) { return hay.indexOf(w) >= 0; });
  });
  return (hits.length ? hits : notes).slice(0, 2);
}

// Prescriptions et requêtes d'un diagnostic, sans allergène, sans molécule
// déjà au profil (active, ou cessée : déjà essayée), sans ce qui est déjà sous
// lui dans la note (`found`, sa région, ou null).
function agOrdersFor(dx, found) {
  const data = window.NOTE_DATA;
  const present = found ? scLabelsIn(found.node) : [];
  const profile = agPatient().meds.map(function (m) { return window.dxNormName(m.name).split(' ')[0]; });
  const onProfile = function (it) { return profile.indexOf(window.dxNormName(it.name).split(' ')[0]) >= 0; };
  const rx = data.contextResultsFor(dx, 'rx').filter(function (it) { return !data.rxAllergyOf(it) && !onProfile(it); })
    .map(function (it) { return { kind: 'rx', item: it }; });
  const req = data.contextResultsFor(dx, 'req').map(function (it) { return { kind: 'req', item: it }; });
  return rx.concat(req).filter(function (o) { return present.indexOf(scChipAttrs(o.kind, o.item).label) < 0; })
    .slice(0, AG_MAX_ORDERS).map(function (o) {
      return Object.assign(o, {
        id: o.kind + ':' + o.item.key,
        icon: data.ORDER_DEFS[o.kind === 'rx' ? 'rx' : (o.item.orderKind || o.kind)].icon,
        label: (o.item.name + ' ' + (o.item.dose || '')).trim(), desc: o.item.sig || '',
      });
    });
}

// Blocs « conduites » : ceux du diagnostic visé, puis ceux du premier autre
// problème actif au dossier qui en a (un suivi que la note n'aborde pas
// encore). Ajoutés sous le diagnostic visé s'il est dans la note, sinon au curseur.
function agOrderBlocks(target, problems, editor) {
  const out = [];
  function block(id, icon, title, dx, found, cites) {
    const items = agOrdersFor(dx, found);
    if (items.length) out.push({ id: id, kind: 'orders', icon: icon, title: title, items: items,
      regionId: found ? dx.id : null, dxName: dx.name, cites: cites });
    return items.length > 0;
  }
  if (target) {
    const found = target.inNote && target.attrs.id && editor ? scFindRegion(editor.state.doc, target.attrs.id) : null;
    block('commandes', 'prescriptions', t('agent.bloc.commandes.title', { name: target.attrs.name }), target.attrs, found,
      [t('agent.source.conduites.label'), t('agent.source.allergies.label')]);
  }
  const targetName = target ? window.dxNormName(target.attrs.name) : '';
  problems.some(function (d) {
    if (window.dxNormName(d.name) === targetName) return false;
    return block('suivi', 'event_repeat', t('agent.bloc.suivi.title', { name: d.name }), { name: d.name, code: d.code }, null,
      [t('agent.source.sommaire.label'), t('agent.source.conduites.label')]);
  });
  return out;
}

// La réponse : des blocs « texte » (à ajouter à la note) et « conduites »
// (prescriptions et requêtes à ajouter sous le diagnostic).
function agAnswer(intent, target, editor) {
  const p = agPatient();
  const blocks = [];
  const active = p.meds.filter(function (m) { return m.status === 'active'; });
  const stopped = p.meds.filter(function (m) { return m.status !== 'active'; });
  const allergyLine = p.allergies.length
    ? t('agent.ligne.allergies.text', { list: p.allergies.map(function (a) { return a.name + (a.mid ? ' (' + a.mid.toLowerCase() + ')' : ''); }).join(', ') })
    : t('agent.ligne.aucuneAllergie.text');
  if (intent === 'resume' || intent === 'tout') {
    const lines = [];
    if (p.problems.length) lines.push(t('agent.ligne.problemes.text', { list: p.problems.map(function (d) { return d.name; }).join(', ') }));
    agNotesFor(target, p.notes).forEach(function (n) {
      lines.push(t('agent.ligne.note.text', { date: agDate(n.date), author: agAuthor(n.author), text: agOneLine(n.conclusion) }));
    });
    if (active.length) lines.push(t('agent.ligne.medication.text', { list: active.map(function (m) { return m.name; }).join(', ') }));
    lines.push(allergyLine);
    blocks.push({ id: 'resume', kind: 'text', icon: 'summarize', title: t('agent.bloc.resume.title'), lines: lines,
      cites: [t('agent.source.notes.label'), t('agent.source.sommaire.label'), t('agent.source.meds.label')] });
  }
  if (intent === 'medication') {
    const lines = active.map(function (m) { return t('agent.ligne.medActive.text', { name: m.name, detail: m.detail }); })
      .concat(stopped.map(function (m) { return t('agent.ligne.medCessee.text', { name: m.name, detail: m.detail, date: m.date || '' }); }));
    lines.push(allergyLine);
    blocks.push({ id: 'medication', kind: 'text', icon: 'medication', title: t('agent.bloc.medication.title'), lines: lines,
      cites: [t('agent.source.meds.label'), t('agent.source.allergies.label')] });
  }
  if (intent === 'commandes' || intent === 'tout') {
    agOrderBlocks(target, p.problems, editor).forEach(function (b) { blocks.push(b); });
  }
  return blocks;
}

// Insère des blocs à la place du paragraphe vide du curseur, sinon après lui.
function agInsertBlocks(editor, nodes) {
  const st = editor.state;
  const $f = st.selection.$from;
  const chain = editor.chain().focus();
  if ($f.depth === 0 || !$f.parent.isTextblock) chain.insertContentAt(st.doc.content.size, nodes).run();
  else if ($f.parent.content.size === 0) chain.insertContentAt({ from: $f.before(), to: $f.after() }, nodes).run();
  else chain.insertContentAt($f.after(), nodes).run();
}

// Le texte d'une réponse entre en changement proposé (RA-57) : marques
// « insertion » signées « Assistant IA », à accepter ou refuser (RA-40).
function agProposeText(nodes) {
  return typeof window.markBlocksAsInsertion === 'function' && window.REVIEW_AI_AUTHOR ? window.markBlocksAsInsertion(nodes, window.REVIEW_AI_AUTHOR) : nodes;
}

// Une prescription ou une requête : sous son diagnostic s'il est dans la note
// (comme la colonne), sinon sur une ligne au curseur. Elle entre en puce en
// attente, signée « Assistant IA » (mauve, ✓ ✕ dans le coin) : jamais posée
// d'office. → { cid }, de quoi la retrouver dans la note (proposedInsertionPos).
function agAddOrder(editor, o, regionId) {
  const attrs = Object.assign(scChipAttrs(o.kind, o.item), scAddStamp(t('ai.assistant.name')));
  const chip = { type: 'chip', attrs: attrs };
  const rec = { cid: attrs.cid };
  const found = regionId ? scFindRegion(editor.state.doc, regionId) : null;
  if (!found) { agInsertBlocks(editor, [{ type: 'paragraph', content: [chip, { type: 'text', text: ' ' }] }]); return rec; }
  const end = found.pos + found.node.nodeSize - 1;
  const last = found.node.lastChild;
  if (last && last.content.size === 0) editor.chain().focus().insertContentAt(end - 1, [chip, { type: 'text', text: ' ' }]).run();
  else editor.chain().focus().insertContentAt(end, { type: 'paragraph', content: [chip, { type: 'text', text: ' ' }] }).run();
  return rec;
}

// « Voir dans la note » : le changement inséré, sélectionné et au centre de
// l'écran. Sans effet s'il n'y est plus.
function agShowInserted(editor, rec) {
  const pos = editor && rec ? window.proposedInsertionPos(editor.state.doc, rec) : -1;
  if (pos < 0) return;
  const chain = editor.chain().focus();
  if (rec.cid) chain.setNodeSelection(pos).run(); else chain.setTextSelection(pos + 1).run();
  try {
    const dom = editor.view.domAtPos(pos).node;
    (dom.nodeType === 1 ? dom : dom.parentElement).scrollIntoView({ block: 'center', behavior: 'smooth' });
  } catch (e) {}
}

// Ce qu'une réponse a posé est-il encore dans la note ? (accepté ou encore proposé)
function agIsInserted(editor, rec) {
  return !!editor && !!rec && window.proposedInsertionPos(editor.state.doc, rec) >= 0;
}

// Les demandes au dossier : chacune passe par « searching » (une source de
// plus toutes les AG_STEP_MS, puis la rédaction) avant « done ».
function useAgentSearch(editor) {
  const [turns, setTurns] = React.useState([]);
  const timers = React.useRef([]);
  React.useEffect(function () { return function () { timers.current.forEach(clearTimeout); }; }, []);

  function patch(id, fn) {
    setTurns(function (list) { return list.map(function (x) { return x.id === id ? Object.assign({}, x, fn(x)) : x; }); });
  }
  function ask(prompt, intent) {
    const target = agTargetDx(editor);
    const steps = agSources(intent, target);
    const id = 'turn-' + Date.now();
    setTurns(function (list) {
      return list.concat([{ id: id, prompt: prompt, intent: intent, target: target, steps: steps, step: 0, status: 'searching', blocks: [], added: {} }]);
    });
    steps.forEach(function (s, i) {
      timers.current.push(setTimeout(function () { patch(id, function () { return { step: i + 1 }; }); }, (i + 1) * AG_STEP_MS));
    });
    timers.current.push(setTimeout(function () {
      patch(id, function (x) { return { status: 'done', blocks: agAnswer(intent, x.target, editor) }; });
    }, steps.length * AG_STEP_MS + AG_WRITE_MS));
  }
  // `rec` : de quoi retrouver l'insertion dans la note ({ cid } ou { probe }).
  function markAdded(id, key, rec) { patch(id, function (x) { const a = Object.assign({}, x.added); a[key] = rec; return { added: a }; }); }
  return { turns: turns, ask: ask, markAdded: markAdded };
}

function AgentFab({ editor, raison, raisonActive, appliedTemplate, signal = 'bulles', opening = 'panneau', animation = 'etapes', size = 'petit' }) {
  // Ce que l'assistant insère entre en changement proposé, signé « Assistant IA » (RA-57).
  const sugg = window.useNoteSuggestions({ editor: editor, raison: raison, raisonActive: raisonActive, appliedTemplate: appliedTemplate, proposeAs: t('ai.assistant.name') });
  const search = useAgentSearch(editor);
  const [open, setOpen] = React.useState(false);
  // Nouvelles suggestions, ou réponse arrivée, depuis la dernière ouverture.
  const [fresh, setFresh] = React.useState(false);
  const [extended, setExtended] = React.useState(false);
  // Suggestions écartées par ✕ : elles ne reviennent pas en bulle pour cette note
  // (elles restent dans le panneau).
  const [dismissed, setDismissed] = React.useState({});
  const lastSig = React.useRef('');
  const lastDone = React.useRef(0);

  const bulles = signal === 'bulles';
  const dismissKey = function (it) { return (sugg.context || '') + '|' + it.key; };
  // Bulles : ce qui reste à proposer au point actif (ni déjà dans la note, ni écarté).
  const live = bulles && sugg.targeted ? sugg.items.filter(function (it) { return !it.done && !dismissed[dismissKey(it)]; }) : [];
  const n = bulles ? live.length : (sugg.targeted ? sugg.count : 0);
  const searching = search.turns.some(function (x) { return x.status === 'searching'; });
  const doneCount = search.turns.filter(function (x) { return x.status === 'done'; }).length;

  // Le FAB s'allume quand le point actif change et a des suggestions ciblées
  // (en mode bulles, ce sont elles qui le disent : pas de point en plus).
  const sig = n > 0 ? (sugg.context || '') + '|' + n : '';
  React.useEffect(function () {
    if (sig && sig !== lastSig.current && !open) {
      if (!bulles) setFresh(true);
      if (signal === 'etendu') setExtended(true);
    }
    if (!sig) { setFresh(false); setExtended(false); }
    lastSig.current = sig;
  }, [sig]); // eslint-disable-line
  React.useEffect(function () {
    if (doneCount > lastDone.current && !open) setFresh(true);
    lastDone.current = doneCount;
  }, [doneCount]); // eslint-disable-line
  React.useEffect(function () {
    if (!extended) return undefined;
    const id = setTimeout(function () { setExtended(false); }, AG_EXTENDED_MS);
    return function () { clearTimeout(id); };
  }, [extended, sig]);

  function toggle() {
    setOpen(function (o) { return !o; });
    setFresh(false);
    setExtended(false);
  }

  const drawer = opening === 'tiroir';
  const label = n > 0
    ? (sugg.context ? tn('agent.fab.etendu.contexte.text', n, { name: sugg.context }) : tn('agent.fab.etendu.text', n))
    : null;
  const aria = searching ? t('agent.fab.recherche.aria') : (n > 0 ? tn('agent.fab.suggestions.aria', n) : t('agent.fab.aria'));
  const lit = n > 0 || searching || fresh;
  const showExtended = signal === 'etendu' && extended && label && !open;

  return (
    <React.Fragment>
      <style>{AG_CSS}</style>
      {bulles && !open && live.length > 0 &&
        <AgentBubbles items={live.slice(0, AG_BUBBLES)} total={live.length} context={sugg.context} onOpen={toggle}
          onDismiss={function (it) { setDismissed(function (d) { const k = dismissKey(it); return Object.assign({}, d, { [k]: true }); }); }} />}
      {!(drawer && open) &&
        <button type="button" data-agent-fab="" onMouseDown={function (e) { e.preventDefault(); }} onClick={toggle}
          aria-label={aria} title={aria} aria-expanded={open} aria-haspopup="dialog"
          className={signal === 'halo' && fresh && !open ? 'ag-halo' : undefined}
          style={Object.assign({}, agS.fab, lit ? agS.fabLit : agS.fabQuiet, open ? agS.fabOpen : null, showExtended ? agS.fabExtended : null)}>
          {searching && <span className="ag-ring" aria-hidden="true" />}
          <span className="material-symbols-outlined" aria-hidden="true"
            style={Object.assign({}, agS.fabIcon, lit || open ? agS.fabIconLit : null)}>{open ? 'close' : 'auto_awesome'}</span>
          {showExtended && <span className="ag-up" style={agS.fabLabel}>{label}</span>}
          {!open && !showExtended && n > 0 && signal === 'pastille' &&
            <span key={sig} className="ag-pop" style={agS.badge} aria-hidden="true">{n}</span>}
          {!open && !showExtended && fresh && (signal !== 'pastille' || n === 0) &&
            <span className="ag-pop" style={agS.dot} aria-hidden="true" />}
        </button>}
      {open &&
        <AgentPanel drawer={drawer} large={size === 'grand'} animation={animation} editor={editor} sugg={sugg} search={search}
          onClose={function () { setOpen(false); }} />}
    </React.Fragment>
  );
}

// Les bulles du mode passif : l'en-tête OUVRE le panneau, chaque bulle INSÈRE sa
// suggestion (en changement proposé), ✕ l'écarte. Au-dessus du FAB, à la place
// qu'occupera le panneau ; le curseur reste dans la note (onMouseDown).
function AgentBubbles({ items, total, context, onOpen, onDismiss }) {
  function keepFocus(e) { e.preventDefault(); }
  const head = context ? tn('agent.fab.etendu.contexte.text', total, { name: context }) : tn('agent.fab.etendu.text', total);
  return (
    <div role="group" aria-label={t('agent.bulles.aria')} style={agS.bubbles}>
      <button type="button" className="ag-bubble-head ag-up" style={agS.bubbleHead} onMouseDown={keepFocus} onClick={onOpen}
        aria-label={t('agent.bulles.ouvrir.aria')} title={t('agent.bulles.ouvrir.aria')}>
        <span className="material-symbols-outlined" aria-hidden="true" style={agS.bubbleHeadIcon}>auto_awesome</span>
        <span style={agS.bubbleHeadText}>{head}</span>
        <span className="material-icons-outlined" aria-hidden="true" style={agS.bubbleHeadIcon}>open_in_full</span>
      </button>
      {items.map(function (it, i) {
        return (
          <div key={it.key} className="ag-bubble ag-up" style={Object.assign({}, agS.bubble, { animationDelay: (i * 70) + 'ms' })}>
            <button type="button" className="ag-main" style={agS.bubbleMain} onMouseDown={keepFocus} onClick={it.onClick}
              aria-label={t('agent.bulle.inserer.aria', { title: it.title })}
              title={t('agent.bulle.inserer.tooltip') + (it.desc ? ' : ' + it.title + ' — ' + it.desc : ' : ' + it.title)}>
              <span style={agS.bubbleIcon} aria-hidden="true">
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{it.icon}</span>
              </span>
              <span style={agS.bubbleText}>
                <span style={agS.bubbleTitle}>{it.title}</span>
                {it.source && <span style={agS.bubbleSource}>{it.source}</span>}
              </span>
              <span className="material-icons-outlined" aria-hidden="true" style={agS.bubbleAdd}>add</span>
            </button>
            <button type="button" className="ag-x" style={agS.bubbleX} onMouseDown={keepFocus} onClick={function () { onDismiss(it); }}
              aria-label={t('agent.bulle.ecarter.aria', { title: it.title })} title={t('agent.bulle.ecarter.aria', { title: it.title })}>
              <span className="material-icons" aria-hidden="true" style={{ fontSize: 16 }}>close</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}

function AgentPanel({ drawer, large, animation, editor, sugg, search, onClose }) {
  const [text, setText] = React.useState('');
  const scrollRef = React.useRef(null);
  const last = search.turns[search.turns.length - 1];
  // Suit la conversation : la recherche en cours, puis la réponse.
  React.useEffect(function () {
    const el = scrollRef.current;
    if (el && search.turns.length) el.scrollTop = el.scrollHeight;
  }, [search.turns.length, last && last.step, last && last.status]);

  function submit(e) {
    if (e) e.preventDefault();
    const q = text.trim();
    if (!q) return;
    search.ask(q, agIntentOf(q));
    setText('');
  }
  function quick(item) { search.ask(item.label, item.intent); }
  function keepFocus(e) { e.preventDefault(); }

  const header = (
    <div style={agS.head}>
      <span style={agS.avatar} aria-hidden="true">
        {search.turns.some(function (x) { return x.status === 'searching'; }) && <span className="ag-ring" />}
        <span className="material-symbols-outlined" style={agS.avatarIcon}>auto_awesome</span>
      </span>
      <span style={agS.headText}>
        <span style={agS.title}>{t('agent.panneau.title')}</span>
        <span style={agS.subtitle}>{sugg.context ? t('suggest.pour.text', { name: sugg.context }) : t('agent.panneau.sousTitre.text')}</span>
      </span>
      <button type="button" style={agS.iconBtn} onMouseDown={keepFocus} onClick={onClose} aria-label={t('agent.fermer.aria')} title={t('agent.fermer.aria')}>
        <span className="material-icons-outlined" aria-hidden="true" style={{ fontSize: 20 }}>{drawer ? 'last_page' : 'close'}</span>
      </button>
    </div>
  );

  return (
    <section role="dialog" aria-modal="false" aria-label={t('agent.panneau.title')}
      className={drawer ? 'ag-drawer' : 'ag-in'} style={Object.assign({}, drawer ? agS.drawer : agS.panel, large ? (drawer ? agS.drawerLarge : agS.panelLarge) : null)}
      onKeyDown={function (e) { if (e.key === 'Escape') { e.stopPropagation(); onClose(); if (editor) editor.commands.focus(); } }}>
      {header}
      <div ref={scrollRef} style={agS.scroll}>
        <div style={agS.group}>
          <span className="material-icons-outlined" aria-hidden="true" style={{ fontSize: 16 }}>tips_and_updates</span>
          {t('agent.suggestions.title')}
        </div>
        <div style={agS.suggList}>{sugg.body}</div>
        {search.turns.map(function (turn) {
          return <AgentTurn key={turn.id} turn={turn} animation={animation} editor={editor} onAdded={search.markAdded} />;
        })}
      </div>
      <form style={agS.foot} onSubmit={submit}>
        <div style={agS.quickRow}>
          {AG_QUICK.map(function (q) {
            return (
              <button key={q.intent} type="button" className="ag-chip" style={agS.quickChip} onMouseDown={keepFocus} onClick={function () { quick(q); }}>
                <span className="material-symbols-outlined" aria-hidden="true" style={agS.quickIcon}>{q.icon}</span>
                {q.label}
              </button>
            );
          })}
        </div>
        <div style={agS.inputRow}>
          <input type="text" value={text} onChange={function (e) { setText(e.target.value); }}
            placeholder={t('agent.invite.placeholder')} aria-label={t('agent.invite.placeholder')} style={agS.input} />
          <button type="submit" disabled={!text.trim()} style={Object.assign({}, agS.send, text.trim() ? null : agS.sendOff)}
            aria-label={t('agent.envoyer.aria')} title={t('agent.envoyer.aria')}>
            <span className="material-icons" aria-hidden="true" style={{ fontSize: 20 }}>arrow_upward</span>
          </button>
        </div>
        <p style={agS.disclaimer}>{t('agent.avertissement.text')}</p>
      </form>
    </section>
  );
}

function AgentTurn({ turn, animation, editor, onAdded }) {
  return (
    <div style={agS.turn}>
      <div style={agS.prompt}>{turn.prompt}</div>
      {turn.status === 'searching'
        ? (animation === 'compacte' ? <AgentSearchCompact turn={turn} /> : <AgentSearchSteps turn={turn} />)
        : <AgentAnswer turn={turn} editor={editor} onAdded={onAdded} />}
    </div>
  );
}

// Animation « Étapes » : chaque source passe d'en attente à en cours (anneau,
// texte qui miroite) à lue (coche et ce qu'on y a trouvé), puis la rédaction.
function AgentSearchSteps({ turn }) {
  const writing = turn.step >= turn.steps.length;
  return (
    <div style={agS.card} role="status" aria-live="polite">
      <div style={agS.searchHead}>
        <span style={agS.miniAvatar} aria-hidden="true">
          <span className="ag-ring" />
          <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--mat-sys-primary)' }}>travel_explore</span>
        </span>
        <span className="ag-shimmer" style={agS.searchTitle}>{writing ? t('agent.redaction.text') : t('agent.recherche.title')}</span>
      </div>
      <ol style={agS.steps}>
        {turn.steps.map(function (s, i) {
          const done = i < turn.step, active = i === turn.step;
          return (
            <li key={s.key} style={Object.assign({}, agS.step, !done && !active ? agS.stepPending : null)}>
              <span style={agS.stepIconBox} aria-hidden="true">
                {active
                  ? <span style={agS.stepSpinner}><span className="ag-ring" style={{ inset: 0 }} /></span>
                  : <span className="material-symbols-outlined" style={Object.assign({}, agS.stepIcon, done ? agS.stepIconDone : null)}>{done ? 'check_circle' : s.icon}</span>}
              </span>
              <span style={agS.stepText}>
                <span className={active ? 'ag-shimmer' : undefined} style={agS.stepLabel}>{s.label}</span>
                {done && <span className="ag-up" style={agS.stepFound}>{s.found}</span>}
              </span>
            </li>
          );
        })}
      </ol>
      <div style={agS.skelBox} aria-hidden="true">
        <div className="ag-skel" style={{ width: '92%' }} />
        <div className="ag-skel" style={{ width: '78%' }} />
        {writing && <div className="ag-skel" style={{ width: '64%' }} />}
      </div>
    </div>
  );
}

// Animation « Compacte » : une ligne qui nomme la source en cours, et une
// barre de progression qui miroite.
function AgentSearchCompact({ turn }) {
  const writing = turn.step >= turn.steps.length;
  const cur = turn.steps[Math.min(turn.step, turn.steps.length - 1)];
  const pct = Math.round((Math.min(turn.step, turn.steps.length) + (writing ? 1 : 0.4)) / (turn.steps.length + 1) * 100);
  return (
    <div style={agS.card} role="status" aria-live="polite">
      <div style={agS.searchHead}>
        <span style={agS.miniAvatar} aria-hidden="true">
          <span className="ag-ring" />
          <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--mat-sys-primary)' }}>{writing ? 'edit_note' : cur.icon}</span>
        </span>
        <span key={writing ? 'w' : cur.key} className="ag-shimmer ag-up" style={agS.searchTitle}>
          {writing ? t('agent.redaction.text') : t('agent.recherche.source.text', { name: cur.label })}
        </span>
        <span style={agS.counter}>{Math.min(turn.step, turn.steps.length)}/{turn.steps.length}</span>
      </div>
      <div style={agS.track} aria-hidden="true">
        <div className="ag-bar-fill" style={Object.assign({}, agS.fill, { width: pct + '%' })} />
      </div>
    </div>
  );
}

function AgentAnswer({ turn, editor, onAdded }) {
  function keepFocus(e) { e.preventDefault(); }
  if (!turn.blocks.length) return <div style={agS.card} className="ag-up"><p style={agS.empty}>{t('agent.reponse.rien.text')}</p></div>;
  // Pas de « fait » une fois pour toutes : ce qui a été inséré se relit dans la
  // note à chaque rendu (accepté ou encore proposé : inséré ; refusé ou effacé :
  // à insérer de nouveau, RA-57).
  function status(rec) {
    return (
      <div style={agS.status} role="status">
        <span className="material-icons-outlined" aria-hidden="true" style={{ fontSize: 16 }}>check_circle</span>
        <span>{t('agent.insere.text')}</span>
        <span aria-hidden="true">·</span>
        <button type="button" className="ag-link" style={agS.link} onMouseDown={keepFocus} onClick={function () { agShowInserted(editor, rec); }}>
          {t('agent.voirNote.button')}
        </button>
      </div>
    );
  }
  return turn.blocks.map(function (b, bi) {
    const delay = { animationDelay: (bi * 120) + 'ms' };
    if (b.kind === 'text') {
      const rec = turn.added[b.id];
      const inserted = agIsInserted(editor, rec);
      return (
        <div key={b.id} className="ag-up" style={Object.assign({}, agS.card, delay)}>
          <div style={agS.blockHead}>
            <span className="material-symbols-outlined" aria-hidden="true" style={agS.blockIcon}>{b.icon}</span>
            <span style={{ flex: 1 }}>{b.title}</span>
          </div>
          <ul style={agS.lines}>{b.lines.map(function (l, i) { return <li key={i}>{l}</li>; })}</ul>
          <AgentCites cites={b.cites} />
          {inserted && status(rec)}
          <div style={agS.actions}>
            <button type="button" className={inserted ? 'ds-btn ds-btn--outlined' : 'ds-btn ds-btn--tonal'} onMouseDown={keepFocus}
              onClick={function () {
                agInsertBlocks(editor, agProposeText(b.lines.map(function (l) { return { type: 'paragraph', content: [{ type: 'text', text: l }] }; })));
                onAdded(turn.id, b.id, { probe: b.lines[0].slice(0, AG_PROBE) });
                if (window.toast) window.toast(t('agent.ajoute.toast'));
              }}>
              <span className="material-icons-outlined" aria-hidden="true" style={{ fontSize: 18 }}>{inserted ? 'refresh' : 'note_add'}</span>
              {inserted ? t('agent.insererNouveau.button') : t('agent.insererNote.button')}
            </button>
          </div>
        </div>
      );
    }
    const left = b.items.filter(function (o) { return !agIsInserted(editor, turn.added[b.id + o.id]); });
    function add(o) { onAdded(turn.id, b.id + o.id, agAddOrder(editor, o, b.regionId)); }
    return (
      <div key={b.id} className="ag-up" style={Object.assign({}, agS.card, delay)}>
        <div style={agS.blockHead}>
          <span className="material-symbols-outlined" aria-hidden="true" style={agS.blockIcon}>{b.icon}</span>
          <span style={{ flex: 1 }}>{b.title}</span>
        </div>
        {b.items.map(function (o) {
          const rec = turn.added[b.id + o.id];
          const inserted = agIsInserted(editor, rec);
          const action = b.regionId ? t('agent.inserer.sous.tooltip', { name: b.dxName }) : t('agent.inserer.curseur.tooltip');
          // Une ligne : son corps insère (ou, une fois insérée, montre où) ; le bouton
          // de droite insère, ou insère à nouveau.
          return (
            <div key={o.id} className="ag-row" style={Object.assign({}, scS.row, agS.orderRow, agS.orderBox)}>
              <button type="button" className="ag-main" style={agS.orderMain} onMouseDown={keepFocus}
                onClick={function () { if (inserted) agShowInserted(editor, rec); else add(o); }}
                title={inserted ? t('agent.voirNote.button') : action}>
                <span className="material-symbols-outlined" aria-hidden="true" style={scS.rowIcon}>{inserted ? 'check_circle' : o.icon}</span>
                <span style={scS.rowText}>
                  <span style={scS.rowTitle}>{o.label}</span>
                  {o.desc && <span style={scS.rowDesc}>{o.desc}</span>}
                  {inserted && <span style={agS.rowStatus}>{t('agent.insere.text')} · {t('agent.voirNote.button')}</span>}
                </span>
              </button>
              <button type="button" className="ag-x" style={agS.orderAdd} onMouseDown={keepFocus} onClick={function () { add(o); }}
                aria-label={(inserted ? t('agent.insererNouveau.button') : t('agent.inserer.button')) + ' : ' + o.label}
                title={inserted ? t('agent.insererNouveau.button') : action}>
                <span className="material-icons-outlined" aria-hidden="true" style={scS.rowAction}>add</span>
              </button>
            </div>
          );
        })}
        <AgentCites cites={b.cites} />
        {left.length >= 2 &&
          <div style={agS.actions}>
            <button type="button" className="ds-btn ds-btn--tonal" onMouseDown={keepFocus} onClick={function () { left.forEach(add); }}>
              {t('agent.toutInserer.button', { n: left.length })}
            </button>
          </div>}
      </div>
    );
  });
}

function AgentCites({ cites }) {
  return (
    <div style={agS.cites}>
      <span className="material-icons-outlined" aria-hidden="true" style={{ fontSize: 14 }}>link</span>
      {t('agent.sources.text', { list: cites.join(' · ') })}
    </div>
  );
}

const agS = {
  fab: {
    position: 'fixed', right: 24, bottom: 24, zIndex: 60, height: 56, minWidth: 56, padding: 0, boxSizing: 'border-box',
    borderRadius: 'var(--mat-sys-corner-large)', border: '1.5px solid transparent', backgroundOrigin: 'border-box', cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--ds-spacing-xs)',
    transition: 'background 200ms, box-shadow 200ms, padding 200ms, min-width 200ms',
  },
  // Passif : un dégradé pâle et une bordure nette (RA-57, plus de contraste
  // qu'avant) — il ne réclame rien. Allumé ou ouvert : le dégradé plein.
  fabQuiet: { background: 'var(--ag-grad-soft)', borderColor: 'var(--ag-border)', boxShadow: 'var(--mat-sys-level2)' },
  fabLit: { background: 'var(--ag-grad)', boxShadow: 'var(--mat-sys-level3)' },
  fabOpen: { background: 'var(--ag-grad)', boxShadow: 'var(--mat-sys-level2)' },
  fabExtended: { padding: '0 20px 0 16px' },
  fabIcon: { fontSize: 24, color: 'var(--mat-sys-primary)', transition: 'color 200ms' },
  fabIconLit: { color: 'var(--mat-sys-on-primary)' },
  fabLabel: { font: 'var(--mat-sys-label-large)', color: 'var(--mat-sys-on-primary)', whiteSpace: 'nowrap', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis' },
  badge: {
    position: 'absolute', top: -4, right: -4, minWidth: 20, height: 20, padding: '0 6px', boxSizing: 'border-box', borderRadius: 10,
    background: 'var(--mat-sys-primary)', color: 'var(--mat-sys-on-primary)', font: '600 11px/20px var(--font-body)', textAlign: 'center',
  },
  dot: { position: 'absolute', top: 4, right: 4, width: 12, height: 12, borderRadius: '50%', background: 'var(--mat-sys-on-primary)', border: '2px solid var(--mat-sys-primary)' },

  // Panneau : à peu près la largeur du Sommaire, et la hauteur de son contenu
  // (460 px au plus), pour en laisser voir le haut.
  panel: {
    position: 'fixed', right: 24, bottom: 92, zIndex: 60, width: 320, maxWidth: 'calc(100vw - 48px)',
    maxHeight: 'min(460px, calc(100vh - 140px))', boxSizing: 'border-box', display: 'flex', flexDirection: 'column',
    background: 'var(--ag-grad-panel)', border: '1.5px solid var(--ag-border)',
    borderRadius: 'var(--mat-sys-corner-large)', boxShadow: 'var(--mat-sys-level3)', overflow: 'hidden',
  },
  panelLarge: { width: 400, maxHeight: 'none', height: 'min(640px, calc(100vh - 140px))' },
  drawerLarge: { width: 400 },
  drawer: {
    position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 60, width: 360, maxWidth: '100vw', boxSizing: 'border-box',
    display: 'flex', flexDirection: 'column', background: 'var(--ag-grad-panel)',
    borderLeft: '1.5px solid var(--ag-border)', boxShadow: 'var(--mat-sys-level3)',
  },
  head: { display: 'flex', alignItems: 'center', gap: 'var(--ds-spacing-xs)', padding: '8px 8px 8px 12px', borderBottom: '1px solid var(--ag-border)' },
  avatar: {
    position: 'relative', width: 32, height: 32, borderRadius: '50%', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--ag-grad)',
  },
  avatarIcon: { fontSize: 20, color: 'var(--mat-sys-on-primary)' },
  headText: { display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 },
  title: { font: 'var(--mat-sys-title-small)', color: 'var(--mat-sys-on-surface)' },
  subtitle: { font: 'var(--mat-sys-body-small)', color: 'var(--mat-sys-on-surface-variant)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  iconBtn: { width: 36, height: 36, border: 0, borderRadius: '50%', background: 'transparent', color: 'var(--mat-sys-on-surface-variant)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  scroll: { flex: 1, minHeight: 0, overflowY: 'auto', padding: 'var(--ds-spacing-12)', display: 'flex', flexDirection: 'column', gap: 'var(--ds-spacing-xs)' },
  group: { display: 'flex', alignItems: 'center', gap: 6, font: 'var(--mat-sys-label-medium)', color: 'var(--mat-sys-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.04em' },
  suggList: { display: 'flex', flexDirection: 'column', gap: 'var(--ds-spacing-xxs)' },
  turn: { display: 'flex', flexDirection: 'column', gap: 'var(--ds-spacing-xs)', marginTop: 'var(--ds-spacing-12)' },
  prompt: {
    alignSelf: 'flex-end', maxWidth: '85%', padding: '8px 12px', borderRadius: '16px 16px 4px 16px',
    background: 'var(--ag-grad)', color: 'var(--mat-sys-on-primary)', font: 'var(--mat-sys-body-medium)',
  },
  card: {
    display: 'flex', flexDirection: 'column', gap: 'var(--ds-spacing-xs)', padding: 'var(--ds-spacing-12)',
    borderRadius: 'var(--mat-sys-corner-medium)', background: 'var(--mat-sys-surface-container-lowest)',
    border: '1px solid color-mix(in srgb, var(--mat-sys-primary) 30%, var(--mat-sys-outline-variant))',
  },
  searchHead: { display: 'flex', alignItems: 'center', gap: 'var(--ds-spacing-xs)' },
  miniAvatar: { position: 'relative', width: 28, height: 28, borderRadius: '50%', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--mat-sys-surface-container)' },
  searchTitle: { font: 'var(--mat-sys-label-large)', flex: 1 },
  counter: { font: 'var(--mat-sys-label-small)', color: 'var(--mat-sys-on-surface-variant)', fontVariantNumeric: 'tabular-nums' },
  steps: { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 },
  step: { display: 'flex', alignItems: 'flex-start', gap: 'var(--ds-spacing-xs)', transition: 'opacity 200ms' },
  stepPending: { opacity: 0.45 },
  stepIconBox: { width: 20, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stepSpinner: { position: 'relative', width: 16, height: 16, borderRadius: '50%' },
  stepIcon: { fontSize: 18, color: 'var(--mat-sys-on-surface-variant)' },
  stepIconDone: { color: 'var(--mat-sys-primary)' },
  stepText: { display: 'flex', flexDirection: 'column', minWidth: 0 },
  stepLabel: { font: 'var(--mat-sys-body-medium)', color: 'var(--mat-sys-on-surface)' },
  stepFound: { font: 'var(--mat-sys-body-small)', color: 'var(--mat-sys-on-surface-variant)' },
  skelBox: { display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 },
  track: { height: 4, borderRadius: 2, background: 'var(--mat-sys-surface-container-highest)', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 2, background: 'linear-gradient(90deg, var(--mat-sys-primary), var(--mat-sys-tertiary))', transition: 'width 600ms ease' },
  blockHead: { display: 'flex', alignItems: 'center', gap: 'var(--ds-spacing-xs)', font: 'var(--mat-sys-title-small)', color: 'var(--mat-sys-on-surface)' },
  blockIcon: { fontSize: 20, color: 'var(--mat-sys-primary)' },
  lines: { margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4, font: 'var(--mat-sys-body-medium)', color: 'var(--mat-sys-on-surface)' },
  orderRow: { background: 'transparent' },
  cites: { display: 'flex', alignItems: 'center', gap: 4, font: 'var(--mat-sys-body-small)', color: 'var(--mat-sys-on-surface-variant)' },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: 'var(--ds-spacing-xs)' },
  empty: { margin: 0, font: 'var(--mat-sys-body-medium)', color: 'var(--mat-sys-on-surface-variant)' },
  foot: { display: 'flex', flexDirection: 'column', gap: 'var(--ds-spacing-xs)', padding: 'var(--ds-spacing-xs) var(--ds-spacing-12) var(--ds-spacing-12)', borderTop: '1px solid var(--mat-sys-outline-variant)', margin: 0 },
  quickRow: { display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', margin: '0 -12px', padding: '0 12px' },
  quickChip: {
    display: 'inline-flex', alignItems: 'center', gap: 4, height: 32, padding: '0 12px 0 8px', borderRadius: 'var(--mat-sys-corner-small)',
    border: '1px solid var(--ag-border)', background: 'var(--mat-sys-surface-container-lowest)', color: 'var(--mat-sys-on-surface)',
    font: 'var(--mat-sys-label-large)', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
  },
  quickIcon: { fontSize: 18, color: 'var(--mat-sys-primary)' },
  inputRow: {
    display: 'flex', alignItems: 'center', gap: 'var(--ds-spacing-xs)', padding: '4px 4px 4px 14px', borderRadius: 999,
    background: 'var(--mat-sys-surface-container-lowest)', border: '1px solid var(--mat-sys-outline)',
  },
  input: { flex: 1, minWidth: 0, height: 36, border: 0, outline: 'none', background: 'transparent', color: 'var(--mat-sys-on-surface)', font: 'var(--mat-sys-body-large)' },
  send: { width: 36, height: 36, borderRadius: '50%', border: 0, background: 'var(--mat-sys-primary)', color: 'var(--mat-sys-on-primary)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  sendOff: { background: 'var(--mat-sys-surface-container-highest)', color: 'var(--mat-sys-on-surface-variant)', cursor: 'default' },
  disclaimer: { margin: 0, font: 'var(--mat-sys-body-small)', color: 'var(--mat-sys-on-surface-variant)', textAlign: 'center' },

  // Bulles du mode passif : au-dessus du FAB (56 px + 24 de marge + 12 d'écart),
  // à la place qu'occupera le panneau.
  bubbles: {
    position: 'fixed', right: 24, bottom: 92, zIndex: 59, display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
    gap: 8, maxWidth: 'calc(100vw - 48px)',
  },
  bubbleHead: {
    display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 32, padding: '0 12px', boxSizing: 'border-box', borderRadius: 999,
    border: '1.5px solid var(--ag-border)', background: 'color-mix(in srgb, var(--mat-sys-primary) 16%, var(--mat-sys-surface-container-lowest))',
    color: 'var(--mat-sys-on-surface)', font: 'var(--mat-sys-label-large)', cursor: 'pointer', boxShadow: 'var(--mat-sys-level1)',
  },
  bubbleHeadIcon: { fontSize: 16, color: 'var(--mat-sys-primary)' },
  bubbleHeadText: { whiteSpace: 'nowrap' },
  bubble: {
    display: 'flex', alignItems: 'flex-start', width: 300, maxWidth: '100%', boxSizing: 'border-box',
    borderRadius: 'var(--mat-sys-corner-large)', border: '1.5px solid var(--ag-border)', background: 'var(--ag-grad-soft)',
    boxShadow: 'var(--mat-sys-level2)', transition: 'border-color 150ms, box-shadow 150ms',
  },
  bubbleMain: {
    flex: 1, minWidth: 0, minHeight: 52, display: 'flex', alignItems: 'center', gap: 10, padding: '6px 4px 6px 8px', border: 0,
    background: 'transparent', cursor: 'pointer', textAlign: 'left', color: 'var(--mat-sys-on-surface)', borderRadius: 'var(--mat-sys-corner-large)',
  },
  bubbleIcon: {
    width: 32, height: 32, borderRadius: '50%', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--ag-grad)', color: 'var(--mat-sys-on-primary)',
  },
  bubbleText: { display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 },
  bubbleTitle: { font: 'var(--mat-sys-body-medium)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  bubbleSource: { font: 'var(--mat-sys-body-small)', color: 'var(--mat-sys-on-surface-variant)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  bubbleAdd: { fontSize: 20, color: 'var(--mat-sys-primary)', flexShrink: 0 },
  bubbleX: {
    width: 28, height: 28, margin: '4px 4px 0 0', flexShrink: 0, border: 0, borderRadius: '50%', background: 'transparent',
    color: 'var(--mat-sys-on-surface-variant)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  },

  // Réponse : « Inséré · Voir dans la note », et la ligne d'une conduite insérée.
  status: { display: 'flex', alignItems: 'center', gap: 6, font: 'var(--mat-sys-label-large)', color: 'var(--mat-sys-primary)' },
  link: { border: 0, background: 'transparent', padding: 0, color: 'var(--mat-sys-primary)', font: 'inherit', textDecoration: 'underline', cursor: 'pointer' },
  rowStatus: { font: 'var(--mat-sys-label-medium)', color: 'var(--mat-sys-primary)' },
  orderBox: { padding: 0, gap: 0, alignItems: 'stretch', cursor: 'default' },
  orderMain: {
    flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 'var(--ds-spacing-xs)', padding: 'var(--ds-spacing-xxs) var(--ds-spacing-xs)',
    border: 0, background: 'transparent', cursor: 'pointer', textAlign: 'left', color: 'var(--mat-sys-on-surface)', borderRadius: 'var(--mat-sys-corner-small)',
  },
  orderAdd: { width: 44, flexShrink: 0, border: 0, background: 'transparent', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--mat-sys-corner-small)' },
};

window.AgentFab = AgentFab;
