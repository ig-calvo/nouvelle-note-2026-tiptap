/* global React */
// =========================================================
// SuggestionsColumn.jsx — suggestions qui suivent le point actif de la note
// (rencontre vision 2026-10-27, réglage « Suggestions ») : en colonne à
// droite de la zone d'écriture, au tiers de la largeur de la note, ou près
// du curseur (une pastille qui ouvre la même liste). Elles suivent le point actif
// et ne montre que ses suggestions, jamais toutes à la fois :
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

// placement : 'colonne' (au tiers droit de la note) ou 'curseur' (une
// pastille au bout de la ligne active, qui ouvre la même liste — rien ne
// s'affiche tant que le médecin ne l'ouvre pas). appliedTemplate : clé du
// gabarit de début appliqué, dont les diagnostics suggérés suivent (flux de
// Sacha). raisonAnchor() : le champ de la raison de consultation.
function SuggestionsColumn({ editor, raison, raisonActive, placement = 'colonne', appliedTemplate, raisonAnchor }) {
  // Re-rendu à chaque déplacement du curseur ou changement du document.
  const [, refresh] = React.useReducer(function (x) { return x + 1; }, 0);
  const [open, setOpen] = React.useState(false);
  React.useEffect(function () {
    if (!editor) return undefined;
    editor.on('selectionUpdate', refresh);
    editor.on('update', refresh);
    return function () { editor.off('selectionUpdate', refresh); editor.off('update', refresh); };
  }, [editor]);
  // Près du curseur : la pastille suit la page quand elle défile.
  React.useEffect(function () {
    if (placement !== 'curseur') return undefined;
    window.addEventListener('scroll', refresh, true);
    window.addEventListener('resize', refresh);
    return function () { window.removeEventListener('scroll', refresh, true); window.removeEventListener('resize', refresh); };
  }, [placement]);

  const region = !raisonActive && editor ? window.dxRegionAtSelection(editor.state) : null;
  const point = raisonActive ? 'raison' : (region ? 'dx' : (editor && editor.isFocused ? 'note' : 'raison'));
  const pointKey = point + ':' + (region ? region.id : '');
  // La liste près du curseur se referme quand le point actif change.
  const lastPoint = React.useRef(pointKey);
  if (lastPoint.current !== pointKey) { lastPoint.current = pointKey; if (open) setOpen(false); }

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
      ? <p style={scS.hint}>{(raison || '').trim() ? t('suggest.aucunGabarit.text') : t('suggest.ecrireRaison.text')}</p>
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

  if (placement === 'curseur') {
    // Ancre : la ligne du curseur dans la note, sinon le champ de la raison.
    if (count === 0) return null;
    let anchor = null;
    if (point !== 'raison' && editor && editor.view) {
      const c = editor.view.coordsAtPos(editor.state.selection.from);
      const r = editor.view.dom.getBoundingClientRect();
      anchor = { top: c.top, bottom: c.bottom, right: r.right };
    } else {
      const el = raisonAnchor && raisonAnchor();
      if (el) { const r = el.getBoundingClientRect(); anchor = { top: r.top + (r.height - 28) / 2, bottom: r.bottom, right: r.right - 8 }; }
    }
    if (!anchor) return null;
    const right = Math.max(8, window.innerWidth - anchor.right);
    // Pastille compacte (icône + nombre) pour couvrir le moins possible la
    // ligne ; le texte complet est dans l'infobulle et le nom accessible.
    const label = context ? tn('suggest.pastilleDx.text', count, { name: context }) : tn('suggest.pastille.text', count);
    return (
      <React.Fragment>
        <button type="button" style={Object.assign({}, scS.pill, { top: anchor.top - 2, right: right })} onMouseDown={keepFocus}
          aria-expanded={open} aria-label={label} title={label}
          onClick={function () { setOpen(function (o) { return !o; }); }}>
          <span className="material-icons-outlined" aria-hidden="true" style={{ fontSize: 16 }}>tips_and_updates</span>
          <span aria-hidden="true">{count}</span>
        </button>
        {open &&
          <div role="dialog" aria-label={t('suggest.colonne.aria')} style={Object.assign({}, scS.pop, { top: anchor.bottom + 6, right: right })}
            onKeyDown={function (e) { if (e.key === 'Escape') setOpen(false); }}>
            {contextLine}
            {body}
          </div>}
      </React.Fragment>
    );
  }

  return (
    <aside style={scS.col} aria-label={t('suggest.colonne.aria')}>
      <div style={scS.head}>
        <span className="material-icons-outlined" aria-hidden="true" style={scS.headIcon}>tips_and_updates</span>
        {t('suggest.colonne.title')}
      </div>
      {contextLine}
      {body}
    </aside>
  );
}

const scS = {
  col: {
    flex: '1 1 0', minWidth: 0, position: 'sticky', top: 0, alignSelf: 'flex-start',
    display: 'flex', flexDirection: 'column', gap: 'var(--ds-spacing-xxs)',
    padding: 'var(--ds-spacing-12)', borderRadius: 'var(--mat-sys-corner-medium)',
    background: 'var(--mat-sys-surface-container-low)', border: '1px solid var(--mat-sys-outline-variant)',
  },
  head: { display: 'flex', alignItems: 'center', gap: 'var(--ds-spacing-xs)', font: 'var(--mat-sys-title-small)', color: 'var(--mat-sys-on-surface)', marginBottom: 'var(--ds-spacing-xxs)' },
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
  pill: {
    position: 'fixed', zIndex: 40, display: 'inline-flex', alignItems: 'center', gap: 4, height: 28, padding: '0 10px',
    border: '1px solid var(--mat-sys-outline-variant)', borderRadius: 999, cursor: 'pointer',
    background: 'var(--mat-sys-surface-container-lowest)', color: 'var(--mat-sys-primary)', font: 'var(--mat-sys-label-medium)',
    boxShadow: 'var(--mat-sys-level1)', whiteSpace: 'nowrap',
  },
  pop: {
    position: 'fixed', zIndex: 41, width: 320, maxHeight: '60vh', overflowY: 'auto', boxSizing: 'border-box',
    display: 'flex', flexDirection: 'column', gap: 'var(--ds-spacing-xxs)', padding: 'var(--ds-spacing-12)',
    borderRadius: 'var(--mat-sys-corner-medium)', background: 'var(--mat-sys-surface-container-low)',
    border: '1px solid var(--mat-sys-outline-variant)', boxShadow: 'var(--mat-sys-level2)',
  },
};

window.SuggestionsColumn = SuggestionsColumn;
