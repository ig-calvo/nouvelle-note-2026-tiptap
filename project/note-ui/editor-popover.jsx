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
  head: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderBottom: '1px solid var(--mat-sys-outline-variant)', flexShrink: 0 },
  rxIcon: { fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 22, fontWeight: 700, color: 'var(--mat-sys-on-surface)', width: 32, textAlign: 'center', flexShrink: 0 },
  molName: { font: "500 15px 'Poppins', sans-serif", color: 'var(--mat-sys-on-surface)', whiteSpace: 'nowrap' },
  ramq: { display: 'inline-flex', alignItems: 'center', gap: 3, font: "500 12px 'Inter', sans-serif", color: 'var(--mat-sys-on-surface-variant)', whiteSpace: 'nowrap' },
  alertChip: { display: 'inline-flex', alignItems: 'center', gap: 4, border: '1px solid var(--mat-sys-outline-variant)', borderRadius: 8, padding: '4px 8px', flexShrink: 0 },
  alertBand: { display: 'flex', alignItems: 'center', gap: 10, margin: '12px 18px 0', padding: '8px 14px', background: 'light-dark(#f8f7fd, #2b244c)', border: '1px solid var(--mat-sys-outline-variant)', borderRadius: 8 },
  pedsBand: { display: 'flex', alignItems: 'center', gap: 10, margin: '8px 18px 0', padding: '8px 14px', background: 'light-dark(#f5f0fa, #38244c)', border: '1px solid light-dark(#d9c9ea, #38244c)', borderRadius: 8 },
  pedsApply: { flexShrink: 0, border: '1px solid light-dark(#8a5cb8, #c7b1dd)', background: 'var(--mat-sys-surface-container-lowest)', color: 'light-dark(#8a5cb8, #c7b1dd)', borderRadius: 6, padding: '6px 12px', font: "600 12px 'Inter',sans-serif", cursor: 'pointer' },
  closeBtn: { width: 36, height: 36, border: 0, background: 'transparent', borderRadius: 8, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mat-sys-on-surface-variant)', flexShrink: 0 },
  body: { padding: '16px 18px 4px', overflowY: 'auto', flex: '1 1 auto', minHeight: 0 },
  sec: { font: "700 11px 'Inter', sans-serif", letterSpacing: '0.7px', textTransform: 'uppercase', color: 'var(--mat-sys-primary)', margin: '6px 0 16px' },
  row: { display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 },
  foot: { display: 'flex', alignItems: 'center', padding: '12px 18px', borderTop: '1px solid var(--mat-sys-outline-variant)', flexShrink: 0 },
  btnCancel: { border: '1px solid var(--mat-sys-outline-variant)', background: 'var(--mat-sys-surface-container-lowest)', color: 'light-dark(#3a3167, #bab3db)', borderRadius: 8, padding: '9px 18px', font: "600 14px 'Inter', sans-serif", cursor: 'pointer' },
  btnSave: { border: 0, background: 'light-dark(#dedbef, #2a244c)', color: 'light-dark(#3a3167, #bab3db)', borderRadius: 8, padding: '9px 22px', font: "600 14px 'Inter', sans-serif", cursor: 'pointer' },
  fieldWrap: { position: 'relative', border: '1.5px solid var(--mat-sys-outline-variant)', borderRadius: 8, height: 44, display: 'flex', alignItems: 'center', background: 'var(--mat-sys-surface-container-lowest)', boxSizing: 'border-box' },
  flabel: { position: 'absolute', top: -8, left: 10, background: 'var(--mat-sys-surface-container-lowest)', padding: '0 4px', font: "500 11px 'Inter', sans-serif", color: 'var(--mat-sys-on-surface-variant)', lineHeight: '16px', pointerEvents: 'none', whiteSpace: 'nowrap' },
  input: { border: 0, outline: 'none', background: 'transparent', width: '100%', padding: '0 12px', font: "400 14px 'Inter', sans-serif", color: 'var(--mat-sys-on-surface)' },
  select: { appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none', border: 0, outline: 'none', background: 'transparent', width: '100%', padding: '0 30px 0 12px', font: "400 14px 'Inter', sans-serif", color: 'var(--mat-sys-on-surface)', cursor: 'pointer' },
  chev: { position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--mat-sys-on-surface-variant)', fontSize: 20 },
};

function _rxOpts(list, val) {
  const v = (val == null ? '' : String(val));
  return (v && list.indexOf(v) === -1) ? [v].concat(list) : list;
}
function RxFF({ label, required, value, onChange, placeholder, flex, width, suffix }) {
  const [foc, setFoc] = useStateP(false);
  return (
    <div style={Object.assign({}, rxS.fieldWrap, foc ? { borderColor: 'var(--mat-sys-primary)' } : {}, width ? { width: width, flex: '0 0 auto' } : { flex: flex || 1 })}>
      <span style={Object.assign({}, rxS.flabel, foc ? { color: 'var(--mat-sys-primary)' } : {})}>{label}{required ? <span style={{ color: 'light-dark(#cc3340, #e9a5ab)' }}> *</span> : null}</span>
      <input style={rxS.input} value={value == null ? '' : value} placeholder={placeholder || ''}
        onFocus={() => setFoc(true)} onBlur={() => setFoc(false)}
        onChange={(e) => onChange && onChange(e.target.value)} />
      {suffix ? <span style={{ padding: '0 12px 0 2px', font: "400 14px 'Inter',sans-serif", color: 'var(--mat-sys-on-surface-variant)', whiteSpace: 'nowrap', flexShrink: 0 }}>{suffix}</span> : null}
    </div>
  );
}
function RxSel({ label, required, value, onChange, options, placeholder, flex, width }) {
  const [foc, setFoc] = useStateP(false);
  const opts = _rxOpts(options, value);
  return (
    <div style={Object.assign({}, rxS.fieldWrap, foc ? { borderColor: 'var(--mat-sys-primary)' } : {}, width ? { width: width, flex: '0 0 auto' } : { flex: flex || 1 })}>
      <span style={Object.assign({}, rxS.flabel, foc ? { color: 'var(--mat-sys-primary)' } : {})}>{label}{required ? <span style={{ color: 'light-dark(#cc3340, #e9a5ab)' }}> *</span> : null}</span>
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
      style={{ width: 44, height: 24, borderRadius: 12, border: 0, background: on ? 'var(--mat-sys-primary)' : 'var(--mat-sys-outline-variant)', position: 'relative', cursor: 'pointer', flexShrink: 0, transition: 'background 120ms' }}>
      <span style={{ position: 'absolute', top: 2, left: on ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: 'var(--mat-sys-surface-container-lowest)', transition: 'left 120ms', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
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
    <div style={{ display: 'inline-flex', flexShrink: 0, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--mat-sys-outline-variant)' }}>
      {opts.map((o, i) => {
        const on = value === o.k;
        return (
          <button key={o.k} type="button" title={o.title} onClick={() => onChange && onChange(o.k)}
            style={{ width: 42, height: 40, border: 0, borderLeft: i ? '1px solid var(--mat-sys-outline-variant)' : '0', background: on ? 'light-dark(#dedbef, #2a244c)' : '#fff', color: on ? 'light-dark(#3a3167, #bab3db)' : 'var(--mat-sys-on-surface-variant)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
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
          <span className="material-icons-outlined" style={{ fontSize: 20, color: 'light-dark(#39604d, #b9d5c7)', flexShrink: 0 }}>verified_user</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
            <span style={{ font: "500 14px 'Inter',sans-serif", color: 'var(--mat-sys-on-surface)' }}>Aucune alerte</span>
            <span style={{ font: "400 12px 'Inter',sans-serif", color: 'var(--mat-sys-on-surface-variant)' }}>
              Créatinine sérique : N/A&nbsp;&nbsp;·&nbsp;&nbsp;eGFR : N/A&nbsp;&nbsp;·&nbsp;&nbsp;
              Poids : {pedsW ? pedsW.kg + ' kg (pesée du ' + pedsW.weighedOn + ')' : 'N/A'}
            </span>
          </div>
        </div>
        {peds &&
          <div style={rxS.pedsBand}>
            <span className="material-icons-outlined" style={{ fontSize: 20, color: 'light-dark(#8a5cb8, #c7b1dd)', flexShrink: 0 }}>child_care</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0, flex: 1 }}>
              <span style={{ font: "500 13px 'Inter',sans-serif", color: 'var(--mat-sys-on-surface)' }}>
                {peds.mgPerKg} mg/kg/dose × {pedsW.kg} kg = {Math.round(pedsCalc.raw)} mg → suggéré {pedsCalc.suggested} mg
                {peds.freq ? ' ' + peds.freq : ''}
                {pedsCalc.wasCapped ? ' (plafonné à la dose adulte)' : ''}
              </span>
              <span style={{ font: "400 12px 'Inter',sans-serif", color: 'var(--mat-sys-on-surface-variant)' }}>Dose max : {peds.maxMgPerDose} mg/dose — à valider cliniquement.</span>
            </div>
            <button type="button" style={rxS.pedsApply} onClick={() => up('dose', String(pedsCalc.suggested))}>Appliquer</button>
          </div>}
        <div style={rxS.body}>
          <div style={rxS.sec}>Médicament et posologie</div>
          <div style={rxS.row}>
            <RxFF label="Produit" value={d.molecule} onChange={(v) => up('molecule', v)} flex={2} />
            <span style={rxS.ramq}>RAMQ <span className="material-icons-outlined" style={{ fontSize: 16, color: 'light-dark(#cc3340, #e9a5ab)' }}>do_not_disturb_on</span></span>
            <RxSourceToggle value={d.source || 'sub'} onChange={(v) => up('source', v)} />
          </div>
          <div style={rxS.row}>
            <RxFF label="Dose visée" required value={d.dose} onChange={(v) => up('dose', v)} suffix={d.unit || 'mg'} flex={1.2} />
            <span className="material-icons-outlined" style={{ color: 'var(--mat-sys-on-surface-variant)', fontSize: 22, flexShrink: 0 }}>link</span>
            <RxFF label="Dose" value={d.qtyDose} onChange={(v) => up('qtyDose', v)} placeholder="1" flex={0.9} />
            <RxFF label="Forme et teneur" value={d.formeTeneur != null ? d.formeTeneur : (d.form || '')} onChange={(v) => up('formeTeneur', v)} flex={1.9} />
          </div>
          <div style={rxS.row}>
            <RxSel label="Voie" required value={d.route} onChange={(v) => up('route', v)} options={['PO', 'IM', 'IV', 'SC', 'Inhalé', 'SL', 'Top.', 'Rect.']} flex={1.2} />
            <RxSel label="Site" value={d.site} onChange={(v) => up('site', v)} options={['—', 'Deltoïde G', 'Deltoïde D', 'Abdomen', 'Cuisse G', 'Cuisse D', 'Fessier']} placeholder="Site" flex={1.2} />
            <RxSel label="Fréquence" required value={d.frequency} onChange={(v) => up('frequency', v)} options={['DIE', 'BID', 'TID', 'QID', 'HS', 'q4-6h PRN', 'QID PRN', 'AC', 'PC']} flex={1.6} />
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, font: "400 14px 'Inter',sans-serif", color: 'var(--mat-sys-on-surface)', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
              <input type="checkbox" checked={!!d.prn} onChange={(e) => up('prn', e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--mat-sys-primary)' }} />
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
                  ? <span className="material-icons-outlined" style={{fontSize:16,color:'color-mix(in srgb, var(--mat-sys-on-surface) 35%, transparent)',marginLeft:'auto'}}>chevron_right</span>
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

// DiagnosticDropdown — mode « /dx ». Un seul modèle par publication
// (dxBuildModel, dx-picker.jsx), construit par le contrôleur
// (makeSlashRender, editor-field.jsx) : ce composant ne fait qu'afficher
// `model`/`activeIndex`/`actionFocus` et relayer les événements souris à
// `onEvent` (même forme que les événements dxStep — hover/drill/jump/back/
// activate/commitFreeText), jamais son propre calcul de résultats.
function DxHighlight({ text, term }) {
  const ranges = window.dxHighlightRanges(text, term);
  if (!ranges.length) return text;
  const parts = [];
  let last = 0;
  ranges.forEach(function (r, i) {
    if (r[0] > last) parts.push(<React.Fragment key={'t' + i}>{text.slice(last, r[0])}</React.Fragment>);
    parts.push(<mark key={'m' + i} className="dx-hl">{text.slice(r[0], r[1])}</mark>);
    last = r[1];
  });
  if (last < text.length) parts.push(<React.Fragment key="tail">{text.slice(last)}</React.Fragment>);
  return parts;
}

function DxHead({ model, onEvent }) {
  const b = model.banner;
  const crumbs = model.crumbs;
  if (!b && !(crumbs && crumbs.length > 1)) return null;
  return (
    <div className="dx-head">
      {b &&
        <div className="dx-banner">
          <span className="dx-banner__text">
            {b.kind === 'remplacer' ? window.DX_COPY.banner.remplacer(b.target)
              : b.kind === 'refine' ? window.DX_COPY.banner.refine(b.region)
              : window.DX_COPY.banner.edit(b.region)}
          </span>
          <button type="button" className="dx-banner__cancel" title="Annuler"
            onMouseDown={(e) => { e.preventDefault(); onEvent({ type: 'back' }); }}>
            <span className="material-icons-outlined">close</span>
          </button>
        </div>
      }
      {crumbs && crumbs.length > 1 &&
        <div className="dx-crumbs">
          {crumbs.map((c, i) => (
            <React.Fragment key={c.id}>
              {i > 0 && <span className="dx-crumbs__sep">›</span>}
              {c.current
                ? <span className="dx-crumbs__here">{c.label}</span>
                : <button type="button" className="dx-crumbs__link"
                    onMouseDown={(e) => { e.preventDefault(); onEvent({ type: 'jump', nodeId: c.id }); }}>{c.label}</button>}
            </React.Fragment>
          ))}
        </div>
      }
    </div>
  );
}

function DxRow({ item, term, active, actionFocus, onEvent }) {
  const it = item;
  const isNav = it.kind === 'nav';
  const canDrill = !!it.nav && !isNav;
  const showActions = active && (it.actions || []).length > 0;
  return (
    <div className={'dx-item' + (active ? ' is-active' : '') + (isNav ? ' dx-item--nav' : '') + (!it.selectable && !isNav ? ' dx-item--branch' : '')}
      role="option" aria-selected={active}
      onMouseEnter={() => onEvent({ type: 'hover', index: it.idx })}
      onMouseDown={(e) => { e.preventDefault(); onEvent({ type: 'activate', index: it.idx }); }}>
      <span className="dx-item__lead">
        {it.kind === 'note' ? <span className="dx-num">{it.lead}</span>
          : it.kind === 'sommaire' ? <span className="material-icons-outlined">{it.lead}</span>
          : isNav ? <span className="material-icons-outlined">account_tree</span>
          : it.lead ? <span className="dx-code">{it.lead}</span> : null}
      </span>
      <div className="dx-item__body">
        <div className="dx-item__name">
          <DxHighlight text={it.label} term={term} />
          {it.code && it.kind !== 'cim' && <span className="dx-item__code"> · {it.code}</span>}
        </div>
        {it.sub && <div className="dx-item__sub">{it.sub}</div>}
        {it.tags.map(function (t) { return <span key={t.kind} className={'dx-tag dx-tag--' + t.kind}>{t.text}</span>; })}
      </div>
      {showActions &&
        <div className="dx-act-group">
          {it.actions.map(function (a, i) {
            const meta = window.DX_COPY.actions[a];
            return (
              <button key={a} type="button" title={meta.title}
                className={'dx-act' + (i === actionFocus ? ' is-focus' : '')}
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onEvent({ type: 'activate', index: it.idx, action: a }); }}>
                {meta.label}
              </button>
            );
          })}
        </div>
      }
      {canDrill &&
        <button type="button" className="dx-item__chev" title="Explorer"
          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onEvent({ type: 'drill', nodeId: it.nav }); }}>
          <span className="material-icons-outlined">chevron_right</span>
        </button>
      }
    </div>
  );
}

function DxList({ model, activeIndex, actionFocus, onEvent }) {
  return (
    <div className="dx-menu__scroll">
      {model.empty &&
        <div className="dx-empty">
          <div>{model.empty.text}</div>
          {model.empty.hint && <div className="dx-empty__hint">{model.empty.hint}</div>}
        </div>
      }
      {model.sections.map((sec) => (
        <div key={sec.key} className="dx-sec-block">
          {sec.title && <div className="dx-sec">{sec.title}</div>}
          {sec.items.map((it) => (
            <DxRow key={it.key} item={it} term={model.term}
              active={it.idx === activeIndex} actionFocus={it.idx === activeIndex ? actionFocus : 0}
              onEvent={onEvent} />
          ))}
          {sec.note && <div className="dx-sec-note">{sec.note}</div>}
          {sec.more > 0 && <div className="dx-more">{window.DX_COPY.more(sec.more)}</div>}
        </div>
      ))}
      {model.freeText && (function () {
        const copy = window.DX_COPY.freeText[model.freeText.kind](model.freeText.name, model.freeText.hadCode);
        const isActive = activeIndex === model.minIndex;
        return (
          <div className={'dx-item dx-item--free' + (isActive ? ' is-active' : '')}
            onMouseEnter={() => onEvent({ type: 'hover', index: model.minIndex })}
            onMouseDown={(e) => { e.preventDefault(); onEvent({ type: 'commitFreeText' }); }}>
            <span className="dx-item__lead"><span className="material-icons-outlined">add_circle_outline</span></span>
            <div className="dx-item__body">
              <div className="dx-item__name">{copy.title}</div>
              {copy.sub && <div className="dx-item__sub">{copy.sub}</div>}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function DxFoot({ model, activeIndex }) {
  const active = activeIndex >= 0 ? model.flat[activeIndex] : null;
  const text = model.view.kind === 'browse' ? window.DX_COPY.foot.nav
    : (active && active.actions && active.actions.length > 0) ? window.DX_COPY.foot.note
    : window.DX_COPY.foot.root;
  return <div className="dx-menu__foot">{text}</div>;
}

function DiagnosticDropdown({ placement, model, activeIndex, actionFocus, onEvent, onClose }) {
  const ref = useRefP(null);
  useEffectP(() => {
    function onDoc(e) { if (ref.current && !ref.current.contains(e.target)) onClose(); }
    // Différé d'un tick — même raison que RxMenu ci-dessus : la ligne qui a
    // ouvert ce menu (item « diagnosticEntry » du SlashMenu, ou la frappe
    // « /dx ») ne doit pas le refermer aussitôt via son propre mousedown.
    const t = setTimeout(() => document.addEventListener('mousedown', onDoc), 0);
    return () => { clearTimeout(t); document.removeEventListener('mousedown', onDoc); };
  }, [onClose]);
  return (
    <div className="dx-menu" ref={ref} style={Object.assign({ position: 'fixed', zIndex: 60 }, placement.style)} role="listbox">
      <DxHead model={model} onEvent={onEvent} />
      <DxList model={model} activeIndex={activeIndex} actionFocus={actionFocus} onEvent={onEvent} />
      <DxFoot model={model} activeIndex={activeIndex} />
    </div>
  );
}

// DxEditPopover — clic sur le nom/le code d'une région existante (mode
// 'edit') ou son bouton « Préciser » (mode 'refine', dxCanRefine — commit
// 10). Même modèle/réducteur que DiagnosticDropdown (dxBuildModel/dxStep,
// DxHead/DxList/DxFoot réutilisés tels quels), mais ce popover porte SON
// PROPRE terme dans un vrai <input> : contrairement au sélecteur /dx, il
// n'est pas déclenché par le plugin Suggestion et n'a donc pas de texte de
// document à lire — et il produit un effet `relabel` (renommer en place),
// jamais `commit` (qui insérerait une NOUVELLE région).
function DxEditPopover({ anchorRect, region, mode, otherMentionsCount, onRelabel, onClose }) {
  const ref = useRefP(null);
  const [term, setTerm] = useStateP(mode === 'refine' ? '' : (region.name || ''));
  const [dxState, setDxState] = useStateP(function () { return window.dxInitState({ kind: mode, region: region }); });
  const [, bumpCim] = useStateP(0);

  useEffectP(() => {
    function onDoc(e) { if (ref.current && !ref.current.contains(e.target)) onClose(); }
    const t = setTimeout(() => document.addEventListener('mousedown', onDoc), 0);
    return () => { clearTimeout(t); document.removeEventListener('mousedown', onDoc); };
  }, [onClose]);

  // La CIM-10 peut finir de charger après l'ouverture (fetch asynchrone,
  // Note Clinique.html) — whenReady (cim10-index.jsx) appelle son callback
  // tout de suite si déjà prête, une seule fois sinon : un seul re-rendu
  // suffit à faire apparaître enfants/résultats une fois l'index disponible.
  // `cancelled` évite un setState après une fermeture du popover survenue
  // avant que cim10:ready n'ait fini de se déclencher (whenReady ne renvoie
  // rien à désabonner : son propre listener DOM s'enlève tout seul une fois
  // déclenché, mais sans ce garde son callback tenterait quand même de
  // rafraîchir un popover déjà démonté).
  useEffectP(() => {
    let cancelled = false;
    if (window.CIM10 && window.CIM10.whenReady && !window.CIM10.ready()) {
      window.CIM10.whenReady(function () { if (!cancelled) bumpCim(function (n) { return n + 1; }); });
    }
    return () => { cancelled = true; };
  }, []);

  const model = window.dxBuildModel(dxState, term, { threads: [], sommaire: [], cim: window.CIM10 || null });
  const activeIndex = window.dxActiveIndex(dxState, model);

  function applyResult(result) {
    setDxState(result.state);
    result.effects.forEach(function (effect) {
      if (effect.type === 'setTerm') setTerm(effect.term);
      else if (effect.type === 'relabel') { onRelabel(effect.to); onClose(); }
      else if (effect.type === 'close') onClose();
    });
  }
  function dispatch(evt) { applyResult(window.dxStep(dxState, evt, model)); }
  function onKeyDown(e) {
    const evt = { type: 'key', key: e.key, mod: e.metaKey || e.ctrlKey || e.altKey };
    const result = window.dxStep(dxState, evt, model);
    if (!result.handled) return;
    e.preventDefault();
    applyResult(result);
  }
  function onChangeTerm(v) {
    setTerm(v);
    setDxState(function (s) { return Object.assign({}, s, { activeIndex: null, actionFocus: 0 }); });
  }

  const placement = window.dxMenuPlacement(
    { top: anchorRect.top, bottom: anchorRect.bottom, left: anchorRect.left },
    { w: window.innerWidth, h: window.innerHeight },
    { width: 380 }
  );

  return (
    <div className="dx-menu dx-edit" ref={ref} style={Object.assign({ position: 'fixed', zIndex: 70 }, placement.style)}>
      <div className="dx-edit__field">
        <input
          autoFocus
          value={term}
          placeholder={mode === 'refine' ? 'Rechercher un code plus précis…' : 'Renommer ou choisir un code CIM-10…'}
          onChange={(e) => onChangeTerm(e.target.value)}
          onKeyDown={onKeyDown} />
      </div>
      <DxHead model={model} onEvent={dispatch} />
      <DxList model={model} activeIndex={activeIndex} actionFocus={0} onEvent={dispatch} />
      {otherMentionsCount > 0 &&
        <div className="dx-edit__hint">
          Renomme aussi {otherMentionsCount} autre{otherMentionsCount > 1 ? 's' : ''} mention{otherMentionsCount > 1 ? 's' : ''} de ce diagnostic.
        </div>
      }
      <DxFoot model={model} activeIndex={activeIndex} />
    </div>
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

Object.assign(window, { ChipPopover, SlashMenu, RxMenu, DiagnosticDropdown, DxHead, DxList, DxRow, DxFoot, DxEditPopover });
