/* global React */
// =========================================================
// SuggestionsColumn.jsx — suggestions de la note (rencontre vision
// 2026-10-27, réglage « Suggestions »), en deux formats :
//   - SuggestionsColumn : une colonne étroite et repliable à droite de la
//     zone d'écriture. Elle part d'une page blanche (raison de consultation,
//     gabarits de base). Seule, elle suit aussi le curseur dans un diagnostic ;
//     avec la barre (« Les deux »), elle ne garde que la page blanche.
//   - SuggestionBar : une barre en ligne, sous la ligne du curseur, qui part
//     du curseur, après chaque fonction ajoutée (rencontre du 2026-10-27,
//     lot 2 ; forme reprise du mode « En ligne (au curseur) » du proto de
//     suggestions de Vanessa Bois). Elle propose la suite (nextStepSuggestions).
// La colonne suit le point actif et ne montre que ses suggestions, jamais
// toutes à la fois :
//   - raison de consultation, ou détails hors diagnostic → gabarits de note
//     selon la raison (templatesForReason), puis les diagnostics que suggère
//     le gabarit (flux de Sacha, note:add-suggested-dx, NoteEditor.jsx) ;
//   - curseur dans un diagnostic → ses gabarits de conclusion (dernière
//     conclusion si le problème est au dossier, mon gabarit, gabarit Omnimed —
//     dxConclusionOptions), appliqués en attente, à accepter
//     (note:apply-dx-template, NoteEditor.jsx), puis ses prescriptions et
//     requêtes (contextResultsFor), ajoutées sous lui en un clic ;
//   - sinon → une consigne discrète.
// Au plus 5 suggestions visibles (pas d'effet « guirlande »).
// =========================================================
// 5 lignes au plus sous un diagnostic : les gabarits de conclusion d'abord,
// puis au moins une prescription et une requête quand il y en a.
const SC_MAX_ROWS = 5;
const SC_MAX_REQ = 2;
const SC_OPTION_ICON = { last: 'history', mine: 'person', omnimed: 'library_add' };

// Ce que dxConclusionOptions lit hors de la note : les notes antérieures
// (NotesList.jsx) et les problèmes et antécédents au dossier (Sommaire).
function dxConclusionContext() {
  return { notes: window.PAST_NOTES || [], sommaire: window.getSommaireDiagnostics ? window.getSommaireDiagnostics() : [] };
}
window.dxConclusionContext = dxConclusionContext;

// Sous-titre d'une option de conclusion : qui et quand pour la dernière
// conclusion, sinon la sorte de gabarit et son nombre d'ajouts.
function scOptionDesc(opt) {
  const n = (opt.proposals || []).length;
  if (opt.kind === 'last') {
    const who = /%%DOCTOR%%/.test(opt.author || '') ? t('suggest.vous.text') : opt.author;
    return t('suggest.derniereConclusion.text', { author: who, date: opt.date });
  }
  return opt.kind === 'mine' ? tn('suggest.monGabarit.text', n) : tn('suggest.gabaritOmnimed.text', n);
}

// Libellé qu'aurait la puce d'un item : sert à savoir s'il est déjà sous le
// diagnostic (même constructeur que l'insertion, donc même libellé).
function scChipAttrs(kind, item) {
  return kind === 'rx' ? window.orderChipAttrs('rx', item) : window.buildRequestChips([item], item.orderKind || kind)[0];
}

// Position et node de la région de diagnostic `id`, ou null.
function scFindRegion(doc, id) {
  let found = null;
  doc.forEach(function (node, offset) {
    if (!found && node.type.name === 'diagnosticRegion' && node.attrs.id === id) found = { pos: offset, node: node };
  });
  return found;
}

function scLabelsIn(node) {
  const labels = [];
  node.descendants(function (n) { if (n.type.name === 'chip') labels.push(n.attrs.label); });
  return labels;
}

function scSourcesIn(node) {
  const sources = [];
  node.descendants(function (n) { if (n.type.name === 'chip' && n.attrs.proposedBy) sources.push(n.attrs.proposedBy); });
  return sources;
}

// Diagnostics de la note (régions), pour marquer une suggestion déjà prise.
function scDiagnosesIn(doc) {
  const out = [];
  doc.forEach(function (node) { if (node.type.name === 'diagnosticRegion') out.push(node.attrs); });
  return out;
}

// startOnly : avec la barre en ligne (« Les deux »), la colonne ne sert que
// la page blanche — la barre prend le relais dans un diagnostic.
// appliedTemplate : clé du gabarit de début appliqué, dont les diagnostics
// suggérés suivent (flux de Sacha).
function SuggestionsColumn({ editor, raison, raisonActive, startOnly = false, appliedTemplate }) {
  // Re-rendu à chaque déplacement du curseur ou changement du document.
  const [, refresh] = React.useReducer(function (x) { return x + 1; }, 0);
  // Repliée : un rail de 48 px avec l'icône et le nombre de suggestions.
  const [collapsed, setCollapsed] = React.useState(false);
  React.useEffect(function () {
    if (!editor) return undefined;
    editor.on('selectionUpdate', refresh);
    editor.on('update', refresh);
    return function () { editor.off('selectionUpdate', refresh); editor.off('update', refresh); };
  }, [editor]);

  const region = !raisonActive && !startOnly && editor ? window.dxRegionAtSelection(editor.state) : null;
  const point = raisonActive ? 'raison' : (region ? 'dx' : (editor && editor.isFocused ? 'note' : 'raison'));

  // Ajoute la puce sous le diagnostic : dans son dernier paragraphe s'il est
  // vide, sinon dans un nouveau paragraphe à la fin de la région.
  function addToRegion(kind, item) {
    if (!editor || !region) return;
    const found = scFindRegion(editor.state.doc, region.id);
    if (!found) return;
    const attrs = Object.assign(scChipAttrs(kind, item), { savedAt: new Date().toISOString(), author: window.__CURRENT_AUTHOR || null });
    const chip = { type: 'chip', attrs: attrs };
    const end = found.pos + found.node.nodeSize - 1;
    const last = found.node.lastChild;
    if (last && last.content.size === 0) editor.chain().focus().insertContentAt(end - 1, [chip, { type: 'text', text: ' ' }]).run();
    else editor.chain().focus().insertContentAt(end, { type: 'paragraph', content: [chip, { type: 'text', text: ' ' }] }).run();
  }

  function fire(name, detail) { window.dispatchEvent(new CustomEvent(name, { detail: detail })); }

  // Un clic dans la colonne ne doit pas retirer le curseur de la note : le
  // point actif (et donc les suggestions) resterait sinon perdu.
  function keepFocus(e) { e.preventDefault(); }

  function suggestionRow(key, icon, title, desc, done, onClick, doneTitle, actionTitle) {
    return (
      <button key={key} type="button" style={Object.assign({}, scS.row, done ? scS.rowAdded : null)}
        disabled={done} onMouseDown={keepFocus} onClick={onClick} title={done ? doneTitle : actionTitle}>
        <span className="material-symbols-outlined" aria-hidden="true" style={scS.rowIcon}>{icon}</span>
        <span style={scS.rowText}>
          <span style={scS.rowTitle}>{title}</span>
          {desc && <span style={scS.rowDesc}>{desc}</span>}
        </span>
        <span className="material-icons-outlined" aria-hidden="true" style={scS.rowAction}>{done ? 'check' : 'add'}</span>
      </button>
    );
  }

  let body, count = 0, context = null;
  if (point === 'dx') {
    const found = scFindRegion(editor.state.doc, region.id);
    const present = found ? scLabelsIn(found.node) : [];
    const options = window.NOTE_DATA.dxConclusionOptions(region, dxConclusionContext());
    // Déjà proposé : une puce de cette option (acceptée ou en attente) est sous le diagnostic.
    const sources = found ? scSourcesIn(found.node) : [];
    const rxAll = window.NOTE_DATA.contextResultsFor(region, 'rx');
    const reqAll = window.NOTE_DATA.contextResultsFor(region, 'req');
    const room = SC_MAX_ROWS - options.length;
    const reqN = Math.max(0, Math.min(reqAll.length, SC_MAX_REQ, room - (rxAll.length ? 1 : 0)));
    const rx = rxAll.slice(0, room - reqN);
    const req = reqAll.slice(0, reqN);
    const orderRow = function (kind, it) {
      const icon = window.NOTE_DATA.ORDER_DEFS[kind === 'rx' ? 'rx' : (it.orderKind || kind)].icon;
      return suggestionRow(kind + ':' + it.key, icon, (it.name + ' ' + (it.dose || '')).trim(), it.sig,
        present.indexOf(scChipAttrs(kind, it).label) >= 0, function () { addToRegion(kind, it); },
        t('suggest.dejaAjoute.tooltip'), t('suggest.ajouterSous.tooltip', { name: region.name }));
    };
    count = options.filter(function (o) { return sources.indexOf(o.source) < 0; }).length + rx.length + req.length;
    context = region.name;
    body = (
      <React.Fragment>
        {options.length === 0 && rx.length === 0 && req.length === 0 && <p style={scS.hint}>{t('suggest.rienPourDiagnostic.text')}</p>}
        {options.length > 0 && <div style={scS.group}>{t('suggest.gabaritConclusion.title')}</div>}
        {options.map(function (opt) {
          return suggestionRow(opt.id, SC_OPTION_ICON[opt.kind], opt.name, scOptionDesc(opt), sources.indexOf(opt.source) >= 0,
            function () { fire('note:apply-dx-template', { regionId: region.id, optionId: opt.id }); },
            t('suggest.gabaritDejaPropose.tooltip'), t('suggest.appliquerGabarit.tooltip'));
        })}
        {rx.length > 0 && <div style={scS.group}>{t('suggest.prescriptions.title')}</div>}
        {rx.map(function (it) { return orderRow('rx', it); })}
        {req.length > 0 && <div style={scS.group}>{t('suggest.requetes.title')}</div>}
        {req.map(function (it) { return orderRow('req', it); })}
      </React.Fragment>
    );
  } else {
    // Gabarit de début appliqué : ses diagnostics suggérés seulement (il n'y a
    // plus de gabarit à choisir). Sinon les gabarits selon la raison, et les
    // diagnostics du premier dans la place qui reste.
    const all = window.NOTE_DATA.NOTE_TEMPLATES || [];
    const applied = appliedTemplate ? all.find(function (x) { return x.key === appliedTemplate; }) : null;
    const tpls = applied ? [] : window.NOTE_DATA.templatesForReason(raison, 3);
    const dxFrom = applied || tpls[0] || null;
    const dxs = ((dxFrom && dxFrom.dxSuggestions) || []).slice(0, SC_MAX_ROWS - tpls.length);
    const inNote = editor ? scDiagnosesIn(editor.state.doc) : [];
    const dxTaken = function (d) { return inNote.some(function (a) { return (a.code && a.code === d.code) || a.name === d.name; }); };
    count = tpls.length + dxs.filter(function (d) { return !dxTaken(d); }).length;
    body = (tpls.length === 0 && dxs.length === 0)
      ? <p style={scS.hint}>{(raison || '').trim() ? t('suggest.aucunGabarit.text') : (startOnly ? t('suggest.ecrireRaisonSeule.text') : t('suggest.ecrireRaison.text'))}</p>
      : (
        <React.Fragment>
          {tpls.length > 0 && <div style={scS.group}>{t('suggest.gabarits.title')}</div>}
          {tpls.map(function (tpl) {
            const item = (window.NOTE_DATA.SLASH_ITEMS || []).find(function (it) { return it.key === 'tpl-' + tpl.key; }) || {};
            const desc = window.__SHOW_CLINICAL_TOOLS === false && item.descNoTool ? item.descNoTool : item.desc;
            return suggestionRow(tpl.key, item.icon || 'description', tpl.name, desc, false,
              function () { fire('note:apply-template', { key: tpl.key }); }, '', t('suggest.appliquerGabaritNote.tooltip'));
          })}
          {dxs.length > 0 && <div style={scS.group}>{t('suggest.diagnostics.title', { name: dxFrom.name })}</div>}
          {dxs.map(function (d) {
            return suggestionRow('dx:' + d.code, 'local_hospital', d.name, d.code, dxTaken(d),
              function () { fire('note:add-suggested-dx', { name: d.name, code: d.code }); },
              t('suggest.diagnosticDejaNote.tooltip'), t('suggest.ajouterDiagnostic.tooltip'));
          })}
        </React.Fragment>
      );
  }

  const contextLine = context &&
    <div style={scS.context}>
      <span className="material-icons-outlined" aria-hidden="true" style={scS.contextIcon}>local_hospital</span>
      {t('suggest.pour.text', { name: context })}
    </div>;

  if (collapsed) {
    return (
      <aside style={Object.assign({}, scS.col, scS.colCollapsed)} aria-label={t('suggest.colonne.aria')}>
        <button type="button" style={scS.railBtn} onMouseDown={keepFocus} onClick={function () { setCollapsed(false); }}
          aria-expanded="false" aria-label={t('suggest.deplier.aria', { n: count })} title={t('suggest.deplier.aria', { n: count })}>
          <span className="material-icons-outlined" aria-hidden="true" style={scS.headIcon}>tips_and_updates</span>
          {count > 0 && <span style={scS.railCount} aria-hidden="true">{count}</span>}
        </button>
      </aside>
    );
  }
  return (
    <aside style={scS.col} aria-label={t('suggest.colonne.aria')}>
      <div style={scS.head}>
        <span className="material-icons-outlined" aria-hidden="true" style={scS.headIcon}>tips_and_updates</span>
        <span style={{ flex: 1 }}>{t('suggest.colonne.title')}</span>
        <button type="button" style={scS.collapseBtn} onMouseDown={keepFocus} onClick={function () { setCollapsed(true); }}
          aria-expanded="true" aria-label={t('suggest.replier.aria')} title={t('suggest.replier.aria')}>
          <span className="material-icons-outlined" aria-hidden="true" style={{ fontSize: 20 }}>last_page</span>
        </button>
      </div>
      {contextLine}
      {body}
    </aside>
  );
}

const scS = {
  // 260 px : moins large que le Sommaire (300 px), qu'on élargira un jour.
  col: {
    width: 260, flexShrink: 0, boxSizing: 'border-box', position: 'sticky', top: 0, alignSelf: 'flex-start',
    display: 'flex', flexDirection: 'column', gap: 'var(--ds-spacing-xxs)',
    padding: 'var(--ds-spacing-12)', borderRadius: 'var(--mat-sys-corner-medium)',
    background: 'var(--mat-sys-surface-container-low)', border: '1px solid var(--mat-sys-outline-variant)',
  },
  head: { display: 'flex', alignItems: 'center', gap: 'var(--ds-spacing-xs)', font: 'var(--mat-sys-title-small)', color: 'var(--mat-sys-on-surface)', marginBottom: 'var(--ds-spacing-xxs)' },
  colCollapsed: { width: 48, padding: 'var(--ds-spacing-xxs)', alignItems: 'center' },
  collapseBtn: { width: 32, height: 32, border: 0, borderRadius: 'var(--mat-sys-corner-small)', background: 'transparent', color: 'var(--mat-sys-on-surface-variant)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
  railBtn: { width: 40, minHeight: 48, border: 0, borderRadius: 'var(--mat-sys-corner-small)', background: 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 },
  railCount: { font: 'var(--mat-sys-label-medium)', color: 'var(--mat-sys-primary)' },
  headIcon: { fontSize: 20, color: 'var(--mat-sys-primary)' },
  context: { display: 'flex', alignItems: 'center', gap: 'var(--ds-spacing-xxs)', font: 'var(--mat-sys-label-large)', color: 'var(--mat-sys-on-surface)', padding: 'var(--ds-spacing-xxs) 0' },
  contextIcon: { fontSize: 18, color: 'var(--mat-sys-on-surface-variant)' },
  group: { font: 'var(--mat-sys-label-medium)', color: 'var(--mat-sys-on-surface-variant)', marginTop: 'var(--ds-spacing-xs)', textTransform: 'uppercase', letterSpacing: '0.04em' },
  hint: { font: 'var(--mat-sys-body-small)', color: 'var(--mat-sys-on-surface-variant)', margin: 'var(--ds-spacing-xxs) 0' },
  row: {
    display: 'flex', alignItems: 'center', gap: 'var(--ds-spacing-xs)', minHeight: 48, boxSizing: 'border-box', width: '100%',
    padding: 'var(--ds-spacing-xxs) var(--ds-spacing-xs)', border: 0, borderRadius: 'var(--mat-sys-corner-small)',
    background: 'var(--mat-sys-surface-container-lowest)', cursor: 'pointer', textAlign: 'left', color: 'var(--mat-sys-on-surface)',
  },
  rowAdded: { cursor: 'default', opacity: 0.6 },
  rowIcon: { fontSize: 20, color: 'var(--mat-sys-primary)', flexShrink: 0 },
  rowText: { display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 },
  rowTitle: { font: 'var(--mat-sys-body-medium)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  rowDesc: { font: 'var(--mat-sys-body-small)', color: 'var(--mat-sys-on-surface-variant)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  rowAction: { fontSize: 20, color: 'var(--mat-sys-on-surface-variant)', flexShrink: 0 },
  // Barre en ligne (SuggestionBar) : capsule sous la ligne du curseur.
  bar: {
    position: 'fixed', zIndex: 41, display: 'flex', alignItems: 'center', gap: 'var(--ds-spacing-xxs)', boxSizing: 'border-box',
    padding: '4px 6px', borderRadius: 999, background: 'var(--mat-sys-surface-container-lowest)',
    border: '1px solid var(--mat-sys-outline-variant)', boxShadow: 'var(--mat-sys-level2)',
  },
  barSpark: { fontSize: 16, color: 'var(--mat-sys-primary)', margin: '0 2px 0 4px', flexShrink: 0 },
  barPill: {
    display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 28, maxWidth: 240, padding: '0 10px', border: 0, borderRadius: 999,
    background: 'var(--mat-sys-surface-container)', color: 'var(--mat-sys-on-surface)', font: 'var(--mat-sys-label-large)',
    cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flexShrink: 1, minWidth: 0,
  },
  barPillAll: { background: 'var(--mat-sys-primary-container)', color: 'var(--mat-sys-on-primary-container)', flexShrink: 0 },
  barPillIcon: { fontSize: 16, color: 'var(--mat-sys-primary)', flexShrink: 0 },
  barPillText: { overflow: 'hidden', textOverflow: 'ellipsis' },
  barNum: { font: '600 10px var(--font-body)', color: 'var(--mat-sys-on-surface-variant)', flexShrink: 0 },
  barKbd: { font: '600 10px var(--font-body)', padding: '1px 5px', borderRadius: 4, border: '1px solid var(--mat-sys-outline-variant)', color: 'var(--mat-sys-on-surface-variant)', flexShrink: 0 },
  barClose: { width: 24, height: 24, border: 0, borderRadius: '50%', background: 'transparent', color: 'var(--mat-sys-on-surface-variant)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
};

window.SuggestionsColumn = SuggestionsColumn;

// ---------------------------------------------------------------------------
// SuggestionBar — la suite après chaque fonction ajoutée (rencontre du
// 2026-10-27 : « à chaque fonction », après l'ajout). La dernière fonction
// ajoutée (un diagnostic, ou une puce qui n'est pas en attente) ouvre la
// barre ; elle reste tant que le curseur est dans son diagnostic (ou sur sa
// ligne, hors diagnostic), et se ferme par ✕ ou Échap jusqu'à la fonction
// suivante. Au plus 3 pastilles, plus « Tout » quand au moins 2
// prescriptions ou requêtes sont suggérées.
// Clavier : Tab entre dans la barre ; ← → passent d'une pastille à l'autre,
// Entrée choisit, 1 2 3 choisissent directement, T ajoute tout ; Échap ou Tab
// rend la main à la note.
// ---------------------------------------------------------------------------
const SB_MAX = 3;

// Fonctions de la note : diagnostics et puces (sauf celles en attente, que
// le médecin n'a pas encore ajoutées).
function sbScan(doc) {
  const cids = [], regions = [];
  doc.descendants(function (n) {
    if (n.type.name === 'diagnosticRegion') regions.push(n.attrs.id);
    else if (n.type.name === 'chip' && !n.attrs.pending) cids.push(n.attrs.cid);
  });
  return { cids: cids, regions: regions };
}

function sbFindChip(doc, cid) {
  let found = null;
  doc.descendants(function (n, pos) {
    if (found) return false;
    if (n.type.name === 'chip' && n.attrs.cid === cid) { found = { node: n, pos: pos }; return false; }
  });
  return found;
}

function sbRegionOf($pos) {
  for (let d = $pos.depth; d > 0; d--) if ($pos.node(d).type.name === 'diagnosticRegion') return $pos.node(d).attrs;
  return null;
}

function SuggestionBar({ editor }) {
  const [, refresh] = React.useReducer(function (x) { return x + 1; }, 0);
  const [added, setAdded] = React.useState(null); // { region: id } ou { cid }
  const [dismissed, setDismissed] = React.useState(false);
  const seen = React.useRef(null);
  const barRef = React.useRef(null);
  const visibleRef = React.useRef(false);

  React.useEffect(function () {
    if (!editor) return undefined;
    seen.current = sbScan(editor.state.doc);
    function onUpdate() {
      const now = sbScan(editor.state.doc);
      const prev = seen.current;
      seen.current = now;
      const region = now.regions.filter(function (id) { return prev.regions.indexOf(id) < 0; }).pop();
      const cid = now.cids.filter(function (c) { return prev.cids.indexOf(c) < 0; }).pop();
      if (region) { setAdded({ region: region }); setDismissed(false); }
      else if (cid) { setAdded({ cid: cid }); setDismissed(false); }
      refresh();
    }
    // Tab (entrer dans la barre) et Échap (la fermer), avant l'éditeur, sauf
    // quand un menu de la note est ouvert ou qu'une puce est sélectionnée.
    function onKey(e) {
      if (!visibleRef.current || !editor.view.dom.contains(e.target)) return;
      if (document.querySelector('.slash-menu, .rx-menu, .dx-menu')) return;
      if (e.key === 'Tab' && !e.shiftKey && editor.state.selection.empty) {
        const b = barRef.current && barRef.current.querySelector('button[data-sb]');
        if (b) { e.preventDefault(); e.stopPropagation(); b.focus(); }
      } else if (e.key === 'Escape') setDismissed(true);
    }
    editor.on('update', onUpdate);
    editor.on('selectionUpdate', refresh);
    document.addEventListener('keydown', onKey, true);
    window.addEventListener('scroll', refresh, true);
    window.addEventListener('resize', refresh);
    // La note change de largeur sans redimensionner la fenêtre (colonne de
    // suggestions repliée, Sommaire) : la barre suit la ligne du curseur.
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(function () { refresh(); }) : null;
    if (ro) ro.observe(editor.view.dom);
    return function () {
      if (ro) ro.disconnect();
      editor.off('update', onUpdate);
      editor.off('selectionUpdate', refresh);
      document.removeEventListener('keydown', onKey, true);
      window.removeEventListener('scroll', refresh, true);
      window.removeEventListener('resize', refresh);
    };
  }, [editor]);

  // Où est la fonction ajoutée, et le curseur y est-il encore ?
  let list = [], region = null, line = null;
  if (editor && added && !dismissed) {
    const st = editor.state, doc = st.doc;
    const here = window.dxRegionAtSelection(st);
    if (added.region) {
      if (here && here.id === added.region) region = scFindRegion(doc, added.region);
    } else {
      const chip = sbFindChip(doc, added.cid);
      if (chip) {
        const $c = doc.resolve(chip.pos);
        const inRegion = sbRegionOf($c);
        if (inRegion) { if (here && here.id === inRegion.id) region = scFindRegion(doc, inRegion.id); }
        else if (st.selection.$from.parent === $c.parent) line = { chip: chip, $c: $c };
      }
    }
    const ctx = dxConclusionContext();
    if (region) {
      const present = [], sources = [];
      region.node.descendants(function (n) {
        if (n.type.name !== 'chip') return;
        present.push(n.attrs);
        if (n.attrs.proposedBy) sources.push(n.attrs.proposedBy);
      });
      list = window.NOTE_DATA.nextStepSuggestions({ region: region.node.attrs, present: present, sources: sources, ctx: ctx });
    } else if (line) {
      const present = [];
      line.$c.parent.descendants(function (n) { if (n.type.name === 'chip') present.push(n.attrs); });
      list = window.NOTE_DATA.nextStepSuggestions({ chip: line.chip.node.attrs, present: present, diagnoses: scDiagnosesIn(doc), ctx: ctx });
    }
  }
  visibleRef.current = list.length > 0;
  if (!list.length) return null;

  function fire(name, detail) { window.dispatchEvent(new CustomEvent(name, { detail: detail })); }
  function keepFocus(e) { e.preventDefault(); }

  // Une ordonnance ou une requête : à la fin du diagnostic (dans son dernier
  // paragraphe s'il est vide), sinon au bout de la ligne de la fonction.
  function addOrder(s) {
    const doc = editor.state.doc;
    const attrs = Object.assign(scChipAttrs(s.orderKind, s.item), { savedAt: new Date().toISOString(), author: window.__CURRENT_AUTHOR || null });
    const chip = { type: 'chip', attrs: attrs };
    if (region) {
      const found = scFindRegion(doc, region.node.attrs.id);
      if (!found) return;
      const end = found.pos + found.node.nodeSize - 1;
      const last = found.node.lastChild;
      if (last && last.content.size === 0) editor.chain().focus().insertContentAt(end - 1, [chip, { type: 'text', text: ' ' }]).run();
      else editor.chain().focus().insertContentAt(end, { type: 'paragraph', content: [chip, { type: 'text', text: ' ' }] }).run();
      return;
    }
    const found = sbFindChip(doc, added.cid);
    if (!found) return;
    const $c = doc.resolve(found.pos);
    const prev = $c.parent.lastChild;
    const space = prev && !(prev.isText && /\s$/.test(prev.text)) ? [{ type: 'text', text: ' ' }] : [];
    editor.chain().focus().insertContentAt($c.end(), space.concat([chip, { type: 'text', text: ' ' }])).run();
  }

  function choose(s) {
    if (s.kind === 'template') fire('note:apply-dx-template', { regionId: s.regionId, optionId: s.option.id });
    else if (s.kind === 'dx') fire('note:add-suggested-dx', { name: s.dx.name, code: s.dx.code });
    else addOrder(s);
  }
  const orders = list.filter(function (s) { return s.kind === 'order'; });
  function chooseAll() { orders.forEach(addOrder); }

  function onBarKey(e) {
    const btns = Array.prototype.slice.call(barRef.current.querySelectorAll('button[data-sb]'));
    const i = btns.indexOf(document.activeElement);
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const next = btns[(i + (e.key === 'ArrowRight' ? 1 : -1) + btns.length) % btns.length];
      if (next) next.focus();
    } else if (/^[1-3]$/.test(e.key)) {
      const b = btns.filter(function (x) { return /^\d$/.test(x.getAttribute('data-sb')); })[Number(e.key) - 1];
      if (b) { e.preventDefault(); b.click(); }
    } else if (e.key === 't' || e.key === 'T') {
      const b = barRef.current.querySelector('button[data-sb="all"]');
      if (b) { e.preventDefault(); b.click(); }
    } else if (e.key === 'Escape' || e.key === 'Tab') {
      e.preventDefault();
      if (e.key === 'Escape') setDismissed(true);
      editor.commands.focus();
    }
  }

  // Sous la ligne du curseur, à partir du curseur, ramenée dans la note.
  const c = editor.view.coordsAtPos(editor.state.selection.from);
  const box = editor.view.dom.getBoundingClientRect();
  const left = Math.max(box.left, Math.min(c.left, box.right - 640));
  const shown = list.slice(0, SB_MAX);
  const ctxName = region ? region.node.attrs.name : null;
  return (
    <div ref={barRef} role="toolbar" aria-label={t('suggest.barre.aria')} style={Object.assign({}, scS.bar, { top: c.bottom + 6, left: left, maxWidth: Math.max(320, box.right - left) })} onKeyDown={onBarKey}>
      <span className="material-icons-outlined" aria-hidden="true" style={scS.barSpark}>auto_awesome</span>
      {shown.map(function (s, i) {
        const action = s.kind === 'template' ? t('suggest.appliquerGabarit.tooltip')
          : s.kind === 'dx' ? t('suggest.ajouterDiagnostic.tooltip')
          : ctxName ? t('suggest.ajouterSous.tooltip', { name: ctxName }) : t('suggest.ajouterLigne.tooltip');
        return (
          <button key={s.id} type="button" data-sb={String(i + 1)} style={scS.barPill} onMouseDown={keepFocus}
            onClick={function () { choose(s); }} title={action + ' : ' + (s.desc ? s.label + ' — ' + s.desc : s.label)}>
            <span style={scS.barNum} aria-hidden="true">{i + 1}</span>
            <span className="material-symbols-outlined" aria-hidden="true" style={scS.barPillIcon}>{s.icon}</span>
            <span style={scS.barPillText}>{s.label}</span>
          </button>
        );
      })}
      {orders.length >= 2 &&
        <button type="button" data-sb="all" style={Object.assign({}, scS.barPill, scS.barPillAll)} onMouseDown={keepFocus}
          onClick={chooseAll} title={t('suggest.toutAjouter.tooltip', { n: orders.length })}>
          {t('suggest.toutAjouter.button', { n: orders.length })}
        </button>}
      <kbd style={scS.barKbd} title={t('suggest.barre.clavier.tooltip')}>{t('suggest.barre.tab.text')}</kbd>
      <button type="button" data-sb="close" style={scS.barClose} onMouseDown={keepFocus}
        onClick={function () { setDismissed(true); editor.commands.focus(); }} aria-label={t('suggest.ignorer.aria')} title={t('suggest.ignorer.aria')}>
        <span className="material-icons" aria-hidden="true" style={{ fontSize: 16 }}>close</span>
      </button>
    </div>
  );
}

window.SuggestionBar = SuggestionBar;
