/* global React */
// =========================================================
// VisitStartPanel.jsx — points de départ de la visite (rencontre vision
// 2026-10-27, réglage « Points de départ de la visite »), affichés avant
// l'ouverture de la note à la place des cartes de NoteStartCards :
//   1. le contexte du rendez-vous (heure, type, raison prise à l'accueil) ;
//   2. un ou plusieurs points de départ : la raison du rendez-vous, le suivi
//      d'un résultat, un problème au dossier (visitStartPoints) ;
//   3. un gabarit de début de note suggéré selon ces choix
//      (startTemplatesFor), ou aucun.
// « Commencer la note » construit la note de départ (buildVisitStartDoc,
// editor-schema.jsx) et l'ouvre — voir handleVisitStart, NoteEditor.jsx.
// =========================================================
const VSP_ICON = { raison: 'event_note', resultat: 'science', probleme: 'flag' };

function VisitStartPanel({ onStart, showTools }) {
  const D = window.NOTE_DATA;
  const appt = D.VISIT_APPOINTMENT;
  const points = React.useMemo(function () {
    return D.visitStartPoints({ appointment: appt, results: D.RESULTS_TO_FOLLOW, sommaire: window.getSommaireDiagnostics ? window.getSommaireDiagnostics() : [] });
  }, []);
  const [chosen, setChosen] = React.useState(['raison']);
  // null : le premier gabarit suggéré ; 'aucun' : pas de gabarit ; sinon une clé.
  const [tplChoice, setTplChoice] = React.useState(null);

  const picked = points.filter(function (p) { return chosen.indexOf(p.id) >= 0; });
  const tpls = D.startTemplatesFor(picked);
  const tplKey = tplChoice === 'aucun' ? null
    : (tplChoice && tpls.some(function (x) { return x.key === tplChoice; }) ? tplChoice : (tpls[0] ? tpls[0].key : null));

  function toggle(id) {
    setChosen(function (prev) { return prev.indexOf(id) >= 0 ? prev.filter(function (x) { return x !== id; }) : prev.concat([id]); });
  }

  function choiceRow(key, selected, onClick, icon, title, desc, role) {
    return (
      <button key={key} type="button" role={role} aria-checked={selected} onClick={onClick}
        style={Object.assign({}, vspS.row, selected ? vspS.rowOn : null)}>
        <span className="material-icons-outlined" aria-hidden="true" style={Object.assign({}, vspS.check, selected ? vspS.checkOn : null)}>
          {role === 'radio' ? (selected ? 'radio_button_checked' : 'radio_button_unchecked') : (selected ? 'check_box' : 'check_box_outline_blank')}
        </span>
        <span className="material-symbols-outlined" aria-hidden="true" style={vspS.icon}>{icon}</span>
        <span style={vspS.text}>
          <span style={vspS.title}>{title}</span>
          {desc && <span style={vspS.desc}>{desc}</span>}
        </span>
      </button>
    );
  }

  return (
    <section style={vspS.card} aria-label={t('visit.panel.aria')}>
      <div style={vspS.head}>
        <span className="material-icons-outlined" aria-hidden="true" style={vspS.headIcon}>event_available</span>
        <div>
          <div style={vspS.headTitle}>{t('visit.commencer.title')}</div>
          <div style={vspS.headMeta}>{t('visit.rdv.text', { time: appt.time, type: appt.type, by: appt.bookedBy })}</div>
        </div>
      </div>

      <div style={vspS.group}>{t('visit.pointsDepart.title')}</div>
      <p style={vspS.hint}>{t('visit.pointsDepart.hint')}</p>
      <div role="group" aria-label={t('visit.pointsDepart.title')} style={vspS.list}>
        {points.map(function (p) {
          return choiceRow(p.id, chosen.indexOf(p.id) >= 0, function () { toggle(p.id); }, VSP_ICON[p.kind], p.label, p.detail, 'checkbox');
        })}
      </div>

      <div style={vspS.group}>{t('visit.gabaritDebut.title')}</div>
      <div role="radiogroup" aria-label={t('visit.gabaritDebut.title')} style={vspS.list}>
        {tpls.map(function (tpl) {
          const item = (D.SLASH_ITEMS || []).find(function (it) { return it.key === 'tpl-' + tpl.key; }) || {};
          const desc = showTools === false && item.descNoTool ? item.descNoTool : item.desc;
          return choiceRow(tpl.key, tplKey === tpl.key, function () { setTplChoice(tpl.key); }, item.icon || 'description', tpl.name, desc, 'radio');
        })}
        {tpls.length === 0 && <p style={vspS.hint}>{t('visit.aucunGabarit.text')}</p>}
        {tpls.length > 0 && choiceRow('aucun', tplKey === null, function () { setTplChoice('aucun'); }, 'note_add', t('visit.sansGabarit.text'), null, 'radio')}
      </div>

      <div style={vspS.foot}>
        <button type="button" className="ds-btn ds-btn--filled" disabled={picked.length === 0}
          onClick={function () { if (onStart) onStart({ points: picked, tplKey: tplKey }); }}>
          {t('visit.commencerNote.button')}
        </button>
      </div>
    </section>
  );
}

const vspS = {
  card: {
    display: 'flex', flexDirection: 'column', gap: 'var(--ds-spacing-xxs)',
    padding: 'var(--ds-spacing-m)', borderRadius: 'var(--mat-sys-corner-medium)',
    background: 'var(--mat-sys-surface-container-low)', border: '1px solid var(--mat-sys-outline-variant)',
  },
  head: { display: 'flex', alignItems: 'center', gap: 'var(--ds-spacing-12)', marginBottom: 'var(--ds-spacing-xs)' },
  headIcon: { fontSize: 28, color: 'var(--mat-sys-primary)' },
  headTitle: { font: 'var(--mat-sys-title-medium)', color: 'var(--mat-sys-on-surface)' },
  headMeta: { font: 'var(--mat-sys-body-medium)', color: 'var(--mat-sys-on-surface-variant)' },
  group: { font: 'var(--mat-sys-label-medium)', color: 'var(--mat-sys-on-surface-variant)', marginTop: 'var(--ds-spacing-s)', textTransform: 'uppercase', letterSpacing: '0.04em' },
  hint: { font: 'var(--mat-sys-body-small)', color: 'var(--mat-sys-on-surface-variant)', margin: '0 0 var(--ds-spacing-xxs)' },
  list: { display: 'flex', flexDirection: 'column', gap: 'var(--ds-spacing-xxs)' },
  row: {
    display: 'flex', alignItems: 'center', gap: 'var(--ds-spacing-xs)', minHeight: 48, boxSizing: 'border-box', width: '100%',
    padding: 'var(--ds-spacing-xxs) var(--ds-spacing-xs)', border: '1px solid transparent', borderRadius: 'var(--mat-sys-corner-small)',
    background: 'var(--mat-sys-surface-container-lowest)', cursor: 'pointer', textAlign: 'left', color: 'var(--mat-sys-on-surface)',
  },
  rowOn: { borderColor: 'var(--mat-sys-primary)' },
  check: { fontSize: 22, color: 'var(--mat-sys-on-surface-variant)', flexShrink: 0 },
  checkOn: { color: 'var(--mat-sys-primary)' },
  icon: { fontSize: 20, color: 'var(--mat-sys-on-surface-variant)', flexShrink: 0 },
  text: { display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 },
  title: { font: 'var(--mat-sys-body-medium)', fontWeight: 600 },
  desc: { font: 'var(--mat-sys-body-small)', color: 'var(--mat-sys-on-surface-variant)' },
  foot: { display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--ds-spacing-s)' },
};

window.VisitStartPanel = VisitStartPanel;
