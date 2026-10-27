/* global React */
// =========================================================
// SuggestionsColumn.jsx — colonne de suggestions à droite de la zone
// d'écriture, au tiers de la largeur de la note (rencontre vision
// 2026-10-27, réglage « Colonne de suggestions »). Elle suit le point actif
// et ne montre que ses suggestions, jamais toutes à la fois :
//   - raison de consultation, ou détails hors diagnostic → gabarits de note
//     selon la raison (templatesForReason) ;
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

function SuggestionsColumn({ editor, raison, raisonActive }) {
  // Re-rendu à chaque déplacement du curseur ou changement du document.
  const [, refresh] = React.useReducer(function (x) { return x + 1; }, 0);
  React.useEffect(function () {
    if (!editor) return undefined;
    editor.on('selectionUpdate', refresh);
    editor.on('update', refresh);
    return function () { editor.off('selectionUpdate', refresh); editor.off('update', refresh); };
  }, [editor]);

  const region = !raisonActive && editor ? window.dxRegionAtSelection(editor.state) : null;
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

  function applyTemplate(key) {
    window.dispatchEvent(new CustomEvent('note:apply-template', { detail: { key: key } }));
  }

  // Un clic dans la colonne ne doit pas retirer le curseur de la note : le
  // point actif (et donc les suggestions) resterait sinon perdu.
  function keepFocus(e) { e.preventDefault(); }

  let body;
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
    const row = function (kind, it) {
      const added = present.indexOf(scChipAttrs(kind, it).label) >= 0;
      const icon = window.NOTE_DATA.ORDER_DEFS[kind === 'rx' ? 'rx' : (it.orderKind || kind)].icon;
      return (
        <button key={kind + ':' + it.key} type="button" style={Object.assign({}, scS.row, added ? scS.rowAdded : null)}
          disabled={added} onMouseDown={keepFocus} onClick={function () { addToRegion(kind, it); }}
          title={added ? t('suggest.dejaAjoute.tooltip') : t('suggest.ajouterSous.tooltip', { name: region.name })}>
          <span className="material-symbols-outlined" aria-hidden="true" style={scS.rowIcon}>{icon}</span>
          <span style={scS.rowText}>
            <span style={scS.rowTitle}>{(it.name + ' ' + (it.dose || '')).trim()}</span>
            {it.sig && <span style={scS.rowDesc}>{it.sig}</span>}
          </span>
          <span className="material-icons-outlined" aria-hidden="true" style={scS.rowAction}>{added ? 'check' : 'add'}</span>
        </button>
      );
    };
    body = (
      <React.Fragment>
        <div style={scS.context}>
          <span className="material-icons-outlined" aria-hidden="true" style={scS.contextIcon}>local_hospital</span>
          {t('suggest.pour.text', { name: region.name })}
        </div>
        {options.length === 0 && rx.length === 0 && req.length === 0 && <p style={scS.hint}>{t('suggest.rienPourDiagnostic.text')}</p>}
        {options.length > 0 && <div style={scS.group}>{t('suggest.gabaritConclusion.title')}</div>}
        {options.map(function (opt) {
          const applied = sources.indexOf(opt.source) >= 0;
          return (
            <button key={opt.id} type="button" style={Object.assign({}, scS.row, applied ? scS.rowAdded : null)}
              disabled={applied} onMouseDown={keepFocus}
              onClick={function () { window.dispatchEvent(new CustomEvent('note:apply-dx-template', { detail: { regionId: region.id, optionId: opt.id } })); }}
              title={applied ? t('suggest.gabaritDejaPropose.tooltip') : t('suggest.appliquerGabarit.tooltip')}>
              <span className="material-symbols-outlined" aria-hidden="true" style={scS.rowIcon}>{SC_OPTION_ICON[opt.kind]}</span>
              <span style={scS.rowText}>
                <span style={scS.rowTitle}>{opt.name}</span>
                <span style={scS.rowDesc}>{scOptionDesc(opt)}</span>
              </span>
              <span className="material-icons-outlined" aria-hidden="true" style={scS.rowAction}>{applied ? 'check' : 'add'}</span>
            </button>
          );
        })}
        {rx.length > 0 && <div style={scS.group}>{t('suggest.prescriptions.title')}</div>}
        {rx.map(function (it) { return row('rx', it); })}
        {req.length > 0 && <div style={scS.group}>{t('suggest.requetes.title')}</div>}
        {req.map(function (it) { return row('req', it); })}
      </React.Fragment>
    );
  } else {
    const tpls = window.NOTE_DATA.templatesForReason(raison, 3);
    body = tpls.length === 0
      ? <p style={scS.hint}>{(raison || '').trim() ? t('suggest.aucunGabarit.text') : t('suggest.ecrireRaison.text')}</p>
      : (
        <React.Fragment>
          <div style={scS.group}>{t('suggest.gabarits.title')}</div>
          {tpls.map(function (tpl) {
            const item = (window.NOTE_DATA.SLASH_ITEMS || []).find(function (it) { return it.key === 'tpl-' + tpl.key; }) || {};
            return (
              <button key={tpl.key} type="button" style={scS.row} onMouseDown={keepFocus} onClick={function () { applyTemplate(tpl.key); }}>
                <span className="material-symbols-outlined" aria-hidden="true" style={scS.rowIcon}>{item.icon || 'description'}</span>
                <span style={scS.rowText}>
                  <span style={scS.rowTitle}>{tpl.name}</span>
                  {(window.__SHOW_CLINICAL_TOOLS === false && item.descNoTool ? item.descNoTool : item.desc) &&
                    <span style={scS.rowDesc}>{window.__SHOW_CLINICAL_TOOLS === false && item.descNoTool ? item.descNoTool : item.desc}</span>}
                </span>
                <span className="material-icons-outlined" aria-hidden="true" style={scS.rowAction}>add</span>
              </button>
            );
          })}
        </React.Fragment>
      );
  }

  return (
    <aside style={scS.col} aria-label={t('suggest.colonne.aria')}>
      <div style={scS.head}>
        <span className="material-icons-outlined" aria-hidden="true" style={scS.headIcon}>tips_and_updates</span>
        {t('suggest.colonne.title')}
      </div>
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
};

window.SuggestionsColumn = SuggestionsColumn;
