// =========================================================
// popover.jsx — Chip popover + slash menu
// =========================================================
const { useState: useStateP, useEffect: useEffectP, useRef: useRefP } = React;

// ─────────────────────────────────────────────────────────
// Posologie structurée (Prescription) — refonte d'après Figma
// « Prescription - Vision » (node 3022:24791). Tokens : primaire
// #2e38a6, label #484c51, erreur #cc3340, warning #b88114,
// secondary-container #dedbef / #3a3167, radius 8.
// ─────────────────────────────────────────────────────────
const rxS = {
  panel: { width: 600, maxWidth: 'calc(100vw - 24px)', maxHeight: 'calc(100vh - 24px)', display: 'flex', flexDirection: 'column', padding: 0 },
  head: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderBottom: '1px solid #eceef3', flexShrink: 0 },
  rxIcon: { fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 22, fontWeight: 700, color: '#232428', width: 32, textAlign: 'center', flexShrink: 0 },
  molName: { font: "500 15px 'Poppins', sans-serif", color: '#232428', whiteSpace: 'nowrap' },
  ramq: { display: 'inline-flex', alignItems: 'center', gap: 3, font: "500 12px 'Inter', sans-serif", color: '#484c51', whiteSpace: 'nowrap' },
  alertChip: { display: 'inline-flex', alignItems: 'center', gap: 4, border: '1px solid #c3ccd5', borderRadius: 8, padding: '4px 8px', flexShrink: 0 },
  alertBand: { display: 'flex', alignItems: 'center', gap: 10, margin: '12px 18px 0', padding: '8px 14px', background: '#f8f7fd', border: '1px solid #c3ccd5', borderRadius: 8 },
  pedsBand: { display: 'flex', alignItems: 'center', gap: 10, margin: '8px 18px 0', padding: '8px 14px', background: '#f5f0fa', border: '1px solid #d9c9ea', borderRadius: 8 },
  pedsApply: { flexShrink: 0, border: '1px solid #8a5cb8', background: '#fff', color: '#8a5cb8', borderRadius: 6, padding: '6px 12px', font: "600 12px 'Inter',sans-serif", cursor: 'pointer' },
  closeBtn: { width: 36, height: 36, border: 0, background: 'transparent', borderRadius: 8, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#484c51', flexShrink: 0 },
  body: { padding: '16px 18px 4px', overflowY: 'auto', flex: '1 1 auto', minHeight: 0 },
  sec: { font: "700 11px 'Inter', sans-serif", letterSpacing: '0.7px', textTransform: 'uppercase', color: '#2e38a6', margin: '6px 0 16px' },
  row: { display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 },
  foot: { display: 'flex', alignItems: 'center', padding: '12px 18px', borderTop: '1px solid #eceef3', flexShrink: 0 },
  btnCancel: { border: '1px solid #c3ccd5', background: '#fff', color: '#3a3167', borderRadius: 8, padding: '9px 18px', font: "600 14px 'Inter', sans-serif", cursor: 'pointer' },
  btnSave: { border: 0, background: '#dedbef', color: '#3a3167', borderRadius: 8, padding: '9px 22px', font: "600 14px 'Inter', sans-serif", cursor: 'pointer' },
  fieldWrap: { position: 'relative', border: '1.5px solid #c3ccd5', borderRadius: 8, height: 44, display: 'flex', alignItems: 'center', background: '#fff', boxSizing: 'border-box' },
  flabel: { position: 'absolute', top: -8, left: 10, background: '#fff', padding: '0 4px', font: "500 11px 'Inter', sans-serif", color: '#6b6f76', lineHeight: '16px', pointerEvents: 'none', whiteSpace: 'nowrap' },
  input: { border: 0, outline: 'none', background: 'transparent', width: '100%', padding: '0 12px', font: "400 14px 'Inter', sans-serif", color: '#232428' },
  select: { appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none', border: 0, outline: 'none', background: 'transparent', width: '100%', padding: '0 30px 0 12px', font: "400 14px 'Inter', sans-serif", color: '#232428', cursor: 'pointer' },
  chev: { position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6b6f76', fontSize: 20 },
};

function _rxOpts(list, val) {
  const v = (val == null ? '' : String(val));
  return (v && list.indexOf(v) === -1) ? [v].concat(list) : list;
}
function RxFF({ label, required, value, onChange, placeholder, flex, width, suffix }) {
  const [foc, setFoc] = useStateP(false);
  return (
    <div style={Object.assign({}, rxS.fieldWrap, foc ? { borderColor: '#2e38a6' } : {}, width ? { width: width, flex: '0 0 auto' } : { flex: flex || 1 })}>
      <span style={Object.assign({}, rxS.flabel, foc ? { color: '#2e38a6' } : {})}>{label}{required ? <span style={{ color: '#cc3340' }}> *</span> : null}</span>
      <input style={rxS.input} value={value == null ? '' : value} placeholder={placeholder || ''}
        onFocus={() => setFoc(true)} onBlur={() => setFoc(false)}
        onChange={(e) => onChange && onChange(e.target.value)} />
      {suffix ? <span style={{ padding: '0 12px 0 2px', font: "400 14px 'Inter',sans-serif", color: '#484c51', whiteSpace: 'nowrap', flexShrink: 0 }}>{suffix}</span> : null}
    </div>
  );
}
function RxSel({ label, required, value, onChange, options, placeholder, flex, width }) {
  const [foc, setFoc] = useStateP(false);
  const opts = _rxOpts(options, value);
  return (
    <div style={Object.assign({}, rxS.fieldWrap, foc ? { borderColor: '#2e38a6' } : {}, width ? { width: width, flex: '0 0 auto' } : { flex: flex || 1 })}>
      <span style={Object.assign({}, rxS.flabel, foc ? { color: '#2e38a6' } : {})}>{label}{required ? <span style={{ color: '#cc3340' }}> *</span> : null}</span>
      <select style={rxS.select} value={value == null ? '' : value}
        onFocus={() => setFoc(true)} onBlur={() => setFoc(false)}
        onChange={(e) => onChange && onChange(e.target.value)}>
        {placeholder ? <option value="">{placeholder}</option> : null}
        {opts.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <span className="material-icons-outlined" style={rxS.chev}>expand_more</span>
    </div>
  );
}
function RxSwitch({ on, onToggle }) {
  return (
    <button type="button" onClick={onToggle} title="Ne pas substituer"
      style={{ width: 44, height: 24, borderRadius: 12, border: 0, background: on ? '#2e38a6' : '#c3ccd5', position: 'relative', cursor: 'pointer', flexShrink: 0, transition: 'background 120ms' }}>
      <span style={{ position: 'absolute', top: 2, left: on ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 120ms', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
    </button>
  );
}
// Sélecteur de source/substitution (3 icônes) — d'après Figma
function RxSourceToggle({ value, onChange }) {
  const opts = [
    { k: 'sub', icon: 'check', title: 'Substitution permise' },
    { k: 'profile', icon: 'inventory_2', title: 'Au dossier pharmacologique' },
    { k: 'manual', icon: 'edit', title: 'Saisie manuelle' },
  ];
  return (
    <div style={{ display: 'inline-flex', flexShrink: 0, borderRadius: 8, overflow: 'hidden', border: '1px solid #c3ccd5' }}>
      {opts.map((o, i) => {
        const on = value === o.k;
        return (
          <button key={o.k} type="button" title={o.title} onClick={() => onChange && onChange(o.k)}
            style={{ width: 42, height: 40, border: 0, borderLeft: i ? '1px solid #c3ccd5' : '0', background: on ? '#dedbef' : '#fff', color: on ? '#3a3167' : '#6b6f76', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-icons-outlined" style={{ fontSize: 20 }}>{o.icon}</span>
          </button>
        );
      })}
    </div>
  );
}

function ChipPopover({ chip, anchorRect, onClose, onSave, onRevert, onDelete }) {
  const [draft, setDraft] = useStateP(chip.entity);
  const ref = useRefP(null);
  useEffectP(() => { setDraft(chip.entity); }, [chip.id]);
  useEffectP(() => {
    function onDoc(e) { if (ref.current && !ref.current.contains(e.target) && !e.target.closest('.chip')) onClose(); }
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [onClose]);
  if (!anchorRect) return null;
  const isRx = draft.type === 'prescription';
  const W = isRx ? 600 : 380;
  const top = anchorRect.bottom + 8;
  let left = anchorRect.left;
  if (left + W > window.innerWidth - 16) left = Math.max(12, window.innerWidth - W - 16);
  const meta = window.NOTE_DATA.ENTITY_TYPES[draft.type] || {};
  function up(f, v) { setDraft(d => ({ ...d, details: { ...d.details, [f]: v } })); }

  if (isRx) {
    const d = draft.details || {};
    const pedsW = window.__PEDIATRIC_WEIGHT;
    const peds = d.pedsDosing && pedsW ? d.pedsDosing : null;
    let pedsCalc = null;
    if (peds) {
      const raw = peds.mgPerKg * pedsW.kg;
      const rounded = Math.max(25, Math.round(raw / 25) * 25);
      const capped = peds.maxMgPerDose ? Math.min(rounded, peds.maxMgPerDose) : rounded;
      pedsCalc = { raw, suggested: capped, wasCapped: capped < rounded };
    }
    return (
      <div className="popover" ref={ref} style={Object.assign({}, rxS.panel, { top: top, left: left, width: W })} role="dialog">
        <div style={rxS.head}>
          <span style={rxS.rxIcon}>℞</span>
          <span style={rxS.molName}>{d.molecule || 'Prescription'}</span>
          <span style={{ flex: 1 }} />
          <button style={rxS.closeBtn} onClick={onClose}><span className="material-icons-outlined">close</span></button>
        </div>
        <div style={rxS.alertBand}>
          <span className="material-icons-outlined" style={{ fontSize: 20, color: '#39604d', flexShrink: 0 }}>verified_user</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
            <span style={{ font: "500 14px 'Inter',sans-serif", color: '#232428' }}>Aucune alerte</span>
            <span style={{ font: "400 12px 'Inter',sans-serif", color: '#6b6f76' }}>
              Créatinine sérique : N/A&nbsp;&nbsp;·&nbsp;&nbsp;eGFR : N/A&nbsp;&nbsp;·&nbsp;&nbsp;
              Poids : {pedsW ? pedsW.kg + ' kg (pesée du ' + pedsW.weighedOn + ')' : 'N/A'}
            </span>
          </div>
        </div>
        {peds &&
          <div style={rxS.pedsBand}>
            <span className="material-icons-outlined" style={{ fontSize: 20, color: '#8a5cb8', flexShrink: 0 }}>child_care</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0, flex: 1 }}>
              <span style={{ font: "500 13px 'Inter',sans-serif", color: '#232428' }}>
                {peds.mgPerKg} mg/kg/dose × {pedsW.kg} kg = {Math.round(pedsCalc.raw)} mg → suggéré {pedsCalc.suggested} mg
                {peds.freq ? ' ' + peds.freq : ''}
                {pedsCalc.wasCapped ? ' (plafonné à la dose adulte)' : ''}
              </span>
              <span style={{ font: "400 12px 'Inter',sans-serif", color: '#6b6f76' }}>Dose max : {peds.maxMgPerDose} mg/dose — à valider cliniquement.</span>
            </div>
            <button type="button" style={rxS.pedsApply} onClick={() => up('dose', String(pedsCalc.suggested))}>Appliquer</button>
          </div>}
        <div style={rxS.body}>
          <div style={rxS.sec}>Médicament et posologie</div>
          <div style={rxS.row}>
            <RxFF label="Produit" value={d.molecule} onChange={(v) => up('molecule', v)} flex={2} />
            <span style={rxS.ramq}>RAMQ <span className="material-icons-outlined" style={{ fontSize: 16, color: '#cc3340' }}>do_not_disturb_on</span></span>
            <RxSourceToggle value={d.source || 'sub'} onChange={(v) => up('source', v)} />
          </div>
          <div style={rxS.row}>
            <RxFF label="Dose visée" required value={d.dose} onChange={(v) => up('dose', v)} suffix={d.unit || 'mg'} flex={1.2} />
            <span className="material-icons-outlined" style={{ color: '#6b6f76', fontSize: 22, flexShrink: 0 }}>link</span>
            <RxFF label="Dose" value={d.qtyDose} onChange={(v) => up('qtyDose', v)} placeholder="1" flex={0.9} />
            <RxFF label="Forme et teneur" value={d.formeTeneur != null ? d.formeTeneur : (d.form || '')} onChange={(v) => up('formeTeneur', v)} flex={1.9} />
          </div>
          <div style={rxS.row}>
            <RxSel label="Voie" required value={d.route} onChange={(v) => up('route', v)} options={['PO', 'IM', 'IV', 'SC', 'Inhalé', 'SL', 'Top.', 'Rect.']} flex={1.2} />
            <RxSel label="Site" value={d.site} onChange={(v) => up('site', v)} options={['—', 'Deltoïde G', 'Deltoïde D', 'Abdomen', 'Cuisse G', 'Cuisse D', 'Fessier']} placeholder="Site" flex={1.2} />
            <RxSel label="Fréquence" required value={d.frequency} onChange={(v) => up('frequency', v)} options={['DIE', 'BID', 'TID', 'QID', 'HS', 'q4-6h PRN', 'QID PRN', 'AC', 'PC']} flex={1.6} />
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, font: "400 14px 'Inter',sans-serif", color: '#232428', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
              <input type="checkbox" checked={!!d.prn} onChange={(e) => up('prn', e.target.checked)} style={{ width: 18, height: 18, accentColor: '#2e38a6' }} />
              PRN
            </label>
          </div>
          <div style={rxS.sec}>Durée et renouvellement</div>
          <div style={rxS.row}>
            <RxSel label="Durée" value={d.duration} onChange={(v) => up('duration', v)} options={['7', '10', '14', '21', '30', '60', '90', '180', '365']} flex={1} />
            <RxSel label="Unité" value={d.durationUnit} onChange={(v) => up('durationUnit', v)} options={['jours', 'semaines', 'mois']} flex={1} />
            <RxFF label="Quantité" value={d.quantity} onChange={(v) => up('quantity', v)} placeholder="Quantité" flex={1} />
            <RxSel label="Unité" value={d.quantityUnit} onChange={(v) => up('quantityUnit', v)} options={['comprimé(s)', 'capsule(s)', 'mL', 'application(s)', 'inhalation(s)']} placeholder="Unité" flex={1} />
          </div>
          <div style={rxS.row}>
            <RxSel label="Renouvellement" required value={d.refills} onChange={(v) => up('refills', v)} options={['0', '1', '2', '3', '4', '5', '6', '11', '12']} flex={1.3} />
            <RxFF label="Fin de traitement" value={d.finTraitement} onChange={(v) => up('finTraitement', v)} placeholder="Fin de traitement" flex={2} />
            <RxSel label="Mois" value={d.moisRenouv} onChange={(v) => up('moisRenouv', v)} options={['Jours', 'Semaines', 'Mois']} placeholder="Mois" flex={2} />
          </div>
        </div>
        <div style={rxS.foot}>
          <button style={rxS.btnCancel} onClick={onClose}>Annuler</button>
          <span style={{ flex: 1 }} />
          <button style={rxS.btnSave} onClick={() => onSave(chip.id, draft)}>Enregistrer</button>
        </div>
      </div>
    );
  }

  return (
    <div className="popover" ref={ref} style={{ top, left }} role="dialog">
      <div className="popover-head">
        <span className="ic"><span className="material-symbols-outlined">{meta.icon}</span></span>
        <div className="grow">
          <div className="ttl">{meta.label}</div>
          <div className="sub">Modifier les détails structurés</div>
        </div>
        <button className="close" onClick={onClose}><span className="material-symbols-outlined">close</span></button>
      </div>
      <div className="popover-body">
        {draft.type === 'lab' && <LabFields d={draft.details} up={up} />}
        {draft.type === 'imaging' && <ImgFields d={draft.details} up={up} />}
        {draft.type === 'problem' && <PbFields d={draft.details} up={up} />}
        {draft.type === 'instructions' && <InsFields d={draft.details} up={up} />}
        {draft.type === 'referral' && <RefFields d={draft.details} up={up} />}
      </div>
      <div className="popover-footer">
        <button className="btn btn-t btn-sm" onClick={() => onRevert(chip.id)}>
          <span className="material-symbols-outlined">undo</span>Reconvertir en texte
        </button>
        <span className="grow" />
        <button className="btn btn-o btn-sm" onClick={() => onDelete(chip.id)}>
          <span className="material-symbols-outlined">delete</span>
        </button>
        <button className="btn btn-p btn-sm" onClick={() => onSave(chip.id, draft)}>Confirmer</button>
      </div>
    </div>
  );
}

function RxFields({ d, up }) {
  return (<>
    <div className="field"><label>Molécule</label><input value={d.molecule} onChange={e => up('molecule', e.target.value)} /></div>
    <div className="row3">
      <div className="field"><label>Dose</label><input value={d.dose} onChange={e => up('dose', e.target.value)} /></div>
      <div className="field"><label>Unité</label>
        <select value={d.unit} onChange={e => up('unit', e.target.value)}>
          <option>mg</option><option>g</option><option>mcg</option><option>mcg/inh</option><option>mL</option>
        </select></div>
      <div className="field"><label>Forme</label>
        <select value={d.form} onChange={e => up('form', e.target.value)}>
          <option>comprimé</option><option>gélule</option><option>sirop</option><option>aérosol-doseur</option>
        </select></div>
    </div>
    <div className="row">
      <div className="field"><label>Voie</label>
        <select value={d.route} onChange={e => up('route', e.target.value)}>
          <option>PO</option><option>IM</option><option>IV</option><option>SC</option><option>Inhalé</option>
        </select></div>
      <div className="field"><label>Fréquence</label>
        <select value={d.frequency} onChange={e => up('frequency', e.target.value)}>
          <option>DIE</option><option>BID</option><option>TID</option><option>QID</option><option>HS</option><option>q4-6h PRN</option><option>QID PRN</option>
        </select></div>
    </div>
    <div className="row3">
      <div className="field"><label>Durée</label><input value={d.duration} onChange={e => up('duration', e.target.value)} /></div>
      <div className="field"><label>Unité</label>
        <select value={d.durationUnit} onChange={e => up('durationUnit', e.target.value)}>
          <option value="jours">jours</option><option value="semaines">semaines</option><option value="mois">mois</option><option value="">—</option>
        </select></div>
      <div className="field"><label>Renouv.</label><input value={d.refills} onChange={e => up('refills', e.target.value)} /></div>
    </div>
    <div className="row">
      <div className="field"><label>Quantité</label><input value={d.quantity} onChange={e => up('quantity', e.target.value)} /></div>
      <div className="field"><label>Indication</label><input value={d.indication} onChange={e => up('indication', e.target.value)} /></div>
    </div>
    <div className="field"><label>Notes</label><textarea rows={2} value={d.notes} onChange={e => up('notes', e.target.value)} /></div>
  </>);
}
function LabFields({ d, up }) { return (<>
  <div className="field"><label>Analyses</label><textarea rows={2} value={(d.tests||[]).join(', ')} onChange={e => up('tests', e.target.value.split(',').map(s=>s.trim()))} /></div>
  <div className="row">
    <div className="field"><label>Priorité</label><select value={d.priority} onChange={e=>up('priority', e.target.value)}><option>Routine</option><option>Semi-urgent</option><option>Urgent</option></select></div>
    <div className="field"><label>À jeun</label><select value={d.fasting?'oui':'non'} onChange={e=>up('fasting', e.target.value==='oui')}><option value="non">Non</option><option value="oui">Oui</option></select></div>
  </div>
  <div className="field"><label>Contexte</label><input value={d.context} onChange={e=>up('context', e.target.value)} /></div>
</>); }
function ImgFields({ d, up }) { return (<>
  <div className="row">
    <div className="field"><label>Modalité</label><select value={d.modality} onChange={e=>up('modality', e.target.value)}><option>Radiographie</option><option>Échographie</option><option>TDM</option><option>IRM</option></select></div>
    <div className="field"><label>Priorité</label><select value={d.priority} onChange={e=>up('priority', e.target.value)}><option>Routine</option><option>Semi-urgent</option><option>Urgent</option></select></div>
  </div>
  <div className="row">
    <div className="field"><label>Région</label><input value={d.region} onChange={e=>up('region', e.target.value)} /></div>
    <div className="field"><label>Vues</label><input value={d.views} onChange={e=>up('views', e.target.value)} /></div>
  </div>
  <div className="field"><label>Contexte</label><input value={d.context} onChange={e=>up('context', e.target.value)} /></div>
</>); }
function PbFields({ d, up }) { return (<>
  <div className="field"><label>Problème</label><input value={d.name} onChange={e=>up('name', e.target.value)} /></div>
  <div className="row">
    <div className="field"><label>Sévérité</label><select value={d.severity} onChange={e=>up('severity', e.target.value)}><option>Léger</option><option>Modéré</option><option>Sévère</option></select></div>
    <div className="field"><label>Depuis</label><input value={d.since} onChange={e=>up('since', e.target.value)} /></div>
  </div>
  <div className="field"><label>Notes</label><textarea rows={2} value={d.notes} onChange={e=>up('notes', e.target.value)} /></div>
</>); }
function InsFields({ d, up }) { return (<>
  <div className="field"><label>Titre</label><input value={d.title} onChange={e=>up('title', e.target.value)} /></div>
  <div className="field"><label>Contenu</label><textarea rows={4} value={d.body} onChange={e=>up('body', e.target.value)} /></div>
</>); }
function RefFields({ d, up }) { return (<>
  <div className="field"><label>Spécialité</label>
    <select value={d.specialty||''} onChange={e=>up('specialty', e.target.value)}>
      <option value="">— Choisir —</option>
      <option>Cardiologie</option><option>Orthopédie</option><option>Dermatologie</option>
      <option>Gastroentérologie</option><option>Neurologie</option><option>Pneumologie</option>
      <option>Rhumatologie</option><option>Endocrinologie</option><option>Néphrologie</option>
      <option>Urologie</option><option>Gynécologie</option><option>Ophtalmologie</option>
      <option>ORL</option><option>Chirurgie générale</option><option>Chirurgie vasculaire</option>
      <option>Hématologie</option><option>Oncologie</option><option>Psychiatrie</option>
      <option>Gériatrie</option><option>Médecine interne</option>
    </select></div>
  <div className="field"><label>Question clinique</label><textarea rows={2} value={d.question||''} onChange={e=>up('question', e.target.value)} /></div>
  <div className="row">
    <div className="field"><label>Priorité</label>
      <select value={d.priority||'Routine'} onChange={e=>up('priority', e.target.value)}>
        <option>Routine</option><option>Semi-urgent</option><option>Urgent</option><option>STAT</option>
      </select></div>
  </div>
  <div className="field"><label>Indication</label><input value={d.indication||''} onChange={e=>up('indication', e.target.value)} /></div>
  <div className="field"><label>CRDS / guichet</label><input value={d.crds||''} onChange={e=>up('crds', e.target.value)} /></div>
</>); }

// Slash menu
function SlashMenu({ position, query, onSelect, onClose, activeIndex, items }) {
  const ref = useRefP(null);
  useEffectP(() => {
    function onDoc(e) { if (ref.current && !ref.current.contains(e.target)) onClose(); }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [onClose]);
  const grouped = {};
  items.forEach(it => { if (!grouped[it.section]) grouped[it.section] = []; grouped[it.section].push(it); });
  return (
    <div className="slash-menu" ref={ref} style={position}>
      {items.length === 0 &&
        <div style={{padding:16, fontSize:12, color:'var(--fg-3)', textAlign:'center'}}>
          {query
            ? <>Aucun résultat pour «&nbsp;{query}&nbsp;». <kbd style={{fontFamily:'var(--font-mono)', background:'var(--bg-subtle)', border:'1px solid var(--border-subtle)', borderRadius:4, padding:'1px 5px'}}>Échap</kbd> pour écrire en texte libre.</>
            : 'Aucune commande.'}
        </div>}
      {Object.entries(grouped).map(([section, list]) => (
        <div key={section}>
          <div className="sm-section">{section}</div>
          {list.map(it => {
            const idx = items.indexOf(it);
            return (
              <div key={it.key} className={'sm-item' + (idx === activeIndex ? ' active' : '')}
                onMouseDown={e => { e.preventDefault(); onSelect(it); }}>
                <span className="ic"><span className="material-symbols-outlined">{it.icon}</span></span>
                <div>
                  <div className="ttl">{it.title}</div>
                  <div className="desc">{it.desc}</div>
                </div>
                {it.ctPicker || it.notePicker || it.diagRefPicker
                  ? <span className="material-icons-outlined" style={{fontSize:16,color:'rgba(0,0,0,0.35)',marginLeft:'auto'}}>chevron_right</span>
                  : !it.noKbd && <span className="kbd">{it.kbdNoSlash ? it.kbd : '/' + it.kbd}</span>
                }
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// DiagnosticDropdown — mode « /dx », affiché pendant la saisie du nom du
// diagnostic. Les suggestions viennent de searchCIM10 (editor-schema.jsx).
function DiagnosticDropdown({ position, query, suggestions, activeIndex, onPickSuggestion, onClose }) {
  const ref = useRefP(null);
  useEffectP(() => {
    function onDoc(e) { if (ref.current && !ref.current.contains(e.target)) onClose(); }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [onClose]);
  return (
    <div ref={ref} style={{
      position: 'fixed', top: position.top, left: position.left,
      background: '#fff', border: '1px solid #b3ccf0', borderRadius: 10,
      boxShadow: '0 4px 16px rgba(37,36,94,0.16)',
      zIndex: 60, minWidth: 320, maxWidth: 420,
      fontFamily: "'Inter',sans-serif", overflow: 'hidden'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px' }}>
        <span className="material-icons-outlined" style={{ fontSize: 18, color: '#1a5fd4', flexShrink: 0 }}>local_hospital</span>
        {query
          ? <span style={{ font: "400 14px 'Inter',sans-serif", color: 'rgba(0,0,0,0.75)', flex: 1 }}>
              Diagnostic : <strong>{query}</strong>
            </span>
          : <span style={{ font: "400 14px 'Inter',sans-serif", color: 'rgba(0,0,0,0.45)', flex: 1 }}>
              Saisissez le nom du diagnostic…
            </span>
        }
        {query && (
          <kbd style={{
            marginLeft: 'auto', background: '#f0f0f8', border: '1px solid #d0d0e0',
            borderRadius: 4, padding: '2px 7px', font: "500 12px 'Inter',sans-serif", color: '#555', flexShrink: 0
          }}>↵</kbd>
        )}
      </div>
      {suggestions && suggestions.length > 0 && (
        <>
          <div style={{ height: 1, background: '#e8ecf5', margin: '0 12px' }} />
          <div style={{ padding: '4px 0 6px' }}>
            {suggestions.map((s, i) => {
              const showChartHeader = s.fromChart && (i === 0 || !suggestions[i - 1].fromChart);
              const showCodeHeader = !s.fromChart && i > 0 && suggestions[i - 1].fromChart;
              const showDivider = !s.fromChart && i > 0 && suggestions[i - 1].generic && !s.generic;
              return (
                <React.Fragment key={(s.key || s.code || 'x') + '-' + i}>
                  {showChartHeader && (
                    <div style={{ padding: '6px 16px 4px', fontSize: 10, fontWeight: 600, letterSpacing: '0.04em', color: 'rgba(0,0,0,0.35)', textTransform: 'uppercase' }}>
                      Problèmes au dossier
                    </div>
                  )}
                  {showCodeHeader && (
                    <div style={{ padding: '6px 16px 4px', fontSize: 10, fontWeight: 600, letterSpacing: '0.04em', color: 'rgba(0,0,0,0.35)', textTransform: 'uppercase' }}>
                      Codes CIM-10
                    </div>
                  )}
                  {showDivider && (
                    <div style={{ padding: '6px 16px 4px', fontSize: 10, fontWeight: 600, letterSpacing: '0.04em', color: 'rgba(0,0,0,0.35)', textTransform: 'uppercase' }}>
                      Codes précis
                    </div>
                  )}
                  <div
                    onMouseDown={(e) => { e.preventDefault(); if (onPickSuggestion) onPickSuggestion(s.libelle); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '6px 16px', cursor: 'pointer',
                      background: i === activeIndex ? '#eef3fb' : 'transparent'
                    }}
                  >
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: s.fromChart ? 'center' : 'flex-start',
                      fontSize: 11, fontWeight: 600, minWidth: 44, flexShrink: 0,
                      color: s.fromChart ? '#2e7d32' : (s.generic ? '#6967d1' : '#1a5fd4'), fontVariantNumeric: 'tabular-nums'
                    }}>
                      {s.fromChart
                        ? <span className="material-icons-outlined" style={{ fontSize: 15 }} title="Au dossier">inventory_2</span>
                        : (s.generic ? 'Général' : s.code)}
                    </span>
                    <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.82)', fontWeight: (s.generic || s.fromChart) ? 600 : 400, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.libelle}</span>
                    {i === activeIndex && <kbd style={{ background: '#f0f0f8', border: '1px solid #d0d0e0', borderRadius: 3, padding: '1px 5px', fontSize: 11, color: '#888', flexShrink: 0 }}>↵</kbd>}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// Functions / "Ajouter" menu — opened from the + button
function AddMenu({ position, tools, orders, onPickTool, onPickOrder, onPickFile, onAddSection, onClose }) {
  const stop = (e) => e.stopPropagation();
  const [showFileSub, setShowFileSub] = useStateP(false);

  const instructionsItem = (tools || []).find(function(t) { return t.key === 'instructions'; });
  const diagnosticItem = (tools || []).find(function(t) { return t.key === 'diagnostic'; });

  return (
    <>
      <div className="addmenu-scrim" onMouseDown={(e) => { e.preventDefault(); onClose(); }} />
      <div className="addmenu" style={position} onMouseDown={stop}>

        <div className="addmenu-sec">RÉDACTION</div>
        <button className="addmenu-item" style={showFileSub ? { background: '#f5f5fa' } : {}}
          onMouseDown={(e) => { e.preventDefault(); setShowFileSub(s => !s); }}>
          <span className="material-icons-outlined ic">upload_file</span>
          <span className="lbl">Ajouter des fichiers</span>
          <span className="kbd">Alt+A</span>
          <span className="material-icons-outlined arr" style={{ transition: 'transform 0.15s', transform: showFileSub ? 'rotate(90deg)' : 'none' }}>chevron_right</span>
        </button>
        {showFileSub && (
          <div style={{ background: '#f8f8fb', borderLeft: '3px solid #dde0f5', margin: '0 0 4px 18px', borderRadius: '0 6px 6px 0' }}>
            <button className="addmenu-item" onMouseDown={(e) => { e.preventDefault(); if (onPickFile) onPickFile('computer'); onClose(); }}>
              <span className="material-icons-outlined ic" style={{ fontSize: 18 }}>laptop</span>
              <span className="lbl">Depuis mon ordinateur</span>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(0,0,0,0.35)', fontFamily: "'Inter',sans-serif" }}>PDF · PNG</span>
            </button>
            <button className="addmenu-item" onMouseDown={(e) => { e.preventDefault(); onClose(); }}>
              <span className="material-icons-outlined ic" style={{ fontSize: 18 }}>smartphone</span>
              <span className="lbl">Depuis mon téléphone</span>
            </button>
            <button className="addmenu-item" onMouseDown={(e) => { e.preventDefault(); onClose(); }}>
              <span className="material-icons-outlined ic" style={{ fontSize: 18 }}>person</span>
              <span className="lbl">Depuis le téléphone du patient</span>
            </button>
          </div>
        )}
        <button className="addmenu-item" onMouseDown={(e) => { e.preventDefault(); }}>
          <span className="material-icons-outlined ic">bolt</span>
          <span className="lbl">Textes rapides</span>
          <span className="kbd">Ctrl+R</span>
        </button>
        <button className="addmenu-item" onMouseDown={(e) => { e.preventDefault(); if (onAddSection) onAddSection(); onClose(); }}>
          <span className="material-icons-outlined ic">add</span>
          <span className="lbl">Ajouter une section</span>
          <span className="kbd">/sec</span>
        </button>
        {instructionsItem && (
          <button className="addmenu-item" onMouseDown={(e) => { e.preventDefault(); if (onPickTool) onPickTool(instructionsItem); onClose(); }}>
            <span className="material-symbols-outlined ic">{instructionsItem.icon}</span>
            <span className="lbl">Instructions patient</span>
            <span className="kbd">/{instructionsItem.kbd}</span>
          </button>
        )}

        <div className="addmenu-div" />

        <div className="addmenu-sec">FONCTIONS</div>
        {diagnosticItem && (
          <button className="addmenu-item" onMouseDown={(e) => { e.preventDefault(); if (onPickTool) onPickTool(diagnosticItem); onClose(); }}>
            <span className="material-symbols-outlined ic">{diagnosticItem.icon}</span>
            <span className="lbl">Diagnostic</span>
            <span className="kbd">/{diagnosticItem.kbd}</span>
          </button>
        )}
        {(orders || []).map((it) => (
          <button key={it.key} className="addmenu-item"
            onMouseDown={(e) => { e.preventDefault(); if (onPickOrder) onPickOrder(it.kbd); onClose(); }}>
            <span className="material-symbols-outlined ic">{it.icon}</span>
            <span className="lbl">{it.title}</span>
            <span className="kbd">/{it.kbd}</span>
          </button>
        ))}
        <button className="addmenu-item" onMouseDown={(e) => {
          e.preventDefault();
          onClose();
          const rect = e.currentTarget.getBoundingClientRect();
          window.dispatchEvent(new CustomEvent('ct-picker-open', { detail: { rect } }));
        }}>
          <span className="material-icons-outlined ic">handyman</span>
          <span className="lbl">Outils cliniques</span>
          <span className="material-icons-outlined arr">chevron_right</span>
        </button>
        <button className="addmenu-item" onMouseDown={(e) => { e.preventDefault(); if (onAddSection) onAddSection(); onClose(); }}>
          <span className="material-icons-outlined ic">lock</span>
          <span className="lbl">Note confidentielle</span>
        </button>
      </div>
    </>
  );
}

// =========================================================
// RxMenu — dropdown de recherche de médicaments (commande /rx)
// Sections : Favoris · Traitements fréquemment prescrits · Autres produits trouvés
// =========================================================
function RxNameHighlight({ name, query }) {
  const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const nq = norm((query || '').trim());
  if (!nq || !norm(name).startsWith(nq)) return name;
  return (
    <>
      <span className="rx-match">{name.slice(0, nq.length)}</span>
      {name.slice(nq.length)}
    </>);
}

function RxMenu({ position, kind, def, query, results, activeIndex, onSelect, onHover, onToggleFav, onClose }) {
  const ref = useRefP(null);
  const [showCeased, setShowCeased] = useStateP(false);
  useEffectP(() => {
    function onDoc(e) { if (ref.current && !ref.current.contains(e.target)) onClose(); }
    // Différé d'un tick : l'item du SlashMenu déclenche sur mousedown et React
    // monte ce menu pendant la propagation — sans le délai, ce mousedown
    // fermerait aussitôt le menu (le clic ne lancerait pas la fonction).
    const t = setTimeout(() => document.addEventListener('mousedown', onDoc), 0);
    return () => { clearTimeout(t); document.removeEventListener('mousedown', onDoc); };
  }, [onClose]);

  const d = def || window.NOTE_DATA.ORDER_DEFS.rx;
  const favSet = d.favs;
  const profil = results.profil || [];
  const profilCeased = results.profilCeased || [];
  const sections = [];
  if (profil.length) sections.push(['Médications au dossier', profil]);
  sections.push([d.sections[0], results.favoris]);
  sections.push([d.sections[1], results.frequents]);
  sections.push([d.sections[2], results.autres]);
  const total = profil.length + profilCeased.length + results.favoris.length + results.frequents.length + results.autres.length;
  let flat = -1;

  return (
    <div className="rx-menu" ref={ref} style={position} role="listbox">
      <div className="rx-menu__scroll">
        {total === 0 &&
          <div className="rx-empty">Aucun {d.emptyNoun} trouvé{query ? <> pour « {query} »</> : null}.</div>
        }
        {sections.map(([ttl, list]) => list.length === 0 ? null : (
          <div key={ttl} className="rx-sec-block">
            <div className="rx-sec">{ttl} <span className="rx-sec-count">({list.length})</span></div>
            {list.map((it) => {
              flat += 1;
              const idx = flat;
              const fav = favSet.has(it.key);
              const isActiveMed = it.med && it.medStatus === 'active';
              return (
                <div key={it.key} role="option" aria-selected={idx === activeIndex}
                  className={'rx-item' + (idx === activeIndex ? ' is-active' : '')}
                  onMouseEnter={() => onHover(idx)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onSelect(it, isActiveMed ? 'renouveler' : undefined)}>
                  <div className="rx-item__body">
                    <div className="rx-item__name">
                      <RxNameHighlight name={it.name} query={query} /> {it.dose}
                    </div>
                    <div className="rx-item__sig">{it.sig}</div>
                  </div>
                  <div className="rx-item__actions">
                    {it.med
                      ? (isActiveMed
                          ? <span className="rx-med-actions">
                              <button type="button" className="rx-med-btn" title="Renouveler — même posologie"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={(e) => { e.stopPropagation(); onSelect(it, 'renouveler'); }}>
                                <span className="material-icons-outlined">refresh</span>
                              </button>
                              <button type="button" className="rx-med-btn" title="Ajuster la posologie"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={(e) => { e.stopPropagation(); onSelect(it, 'ajuster'); }}>
                                <span className="material-icons-outlined">tune</span>
                              </button>
                              <button type="button" className="rx-med-btn rx-med-btn--stop" title="Cesser"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={(e) => { e.stopPropagation(); onSelect(it, 'cesser'); }}>
                                <span className="material-icons-outlined">block</span>
                              </button>
                            </span>
                          : <span className="rx-status rx-status--ceased" title={it.medStatusLabel || ''}>Cessé</span>)
                      : <button type="button" className={'rx-heart' + (fav ? ' is-fav' : '')}
                          title={fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={(e) => { e.stopPropagation(); onToggleFav(it.key); }}>
                          <span className="material-icons">{fav ? 'favorite' : 'favorite_border'}</span>
                        </button>
                    }
                    {it.active &&
                      <span className="rx-active" title="Déjà au dossier">
                        <span className="material-icons">check</span>
                      </span>
                    }
                  </div>
                </div>);
            })}
          </div>
        ))}
        {profilCeased.length > 0 &&
          <div className="rx-sec-block">
            <button type="button" className="rx-sec rx-sec--toggle" onClick={() => setShowCeased((v) => !v)}>
              <span className="material-icons-outlined" style={{ fontSize: 15, verticalAlign: 'middle' }}>
                {showCeased ? 'expand_less' : 'expand_more'}
              </span>
              {' '}Médicaments cessés <span className="rx-sec-count">({profilCeased.length})</span>
            </button>
            {showCeased && profilCeased.map((it) => (
              <div key={it.key} className="rx-item rx-item--ceased">
                <div className="rx-item__body">
                  <div className="rx-item__name"><RxNameHighlight name={it.name} query={query} /> {it.dose}</div>
                  <div className="rx-item__sig">{it.medStatusLabel || 'Cessé'}</div>
                </div>
                <div className="rx-item__actions">
                  <span className="rx-status rx-status--ceased">Cessé</span>
                </div>
              </div>
            ))}
          </div>
        }
      </div>
      <div className="rx-menu__foot">
        <span><kbd>↑ ↓</kbd> naviguer</span>
        <span><kbd>↵</kbd> {d.verb}</span>
        <span><kbd>Esc</kbd> annuler</span>
      </div>
    </div>);
}

Object.assign(window, { ChipPopover, SlashMenu, AddMenu, RxMenu, DiagnosticDropdown });
