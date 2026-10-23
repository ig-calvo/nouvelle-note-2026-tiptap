/* global React */

// ── Shared shell ──────────────────────────────────────────────────────────────
function ModalShell({ title, onClose, children, width }) {
  width = width || 480;
  React.useEffect(function() {
    var h = function(e) { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return function() { window.removeEventListener('keydown', h); };
  }, [onClose]);
  return (
    <div style={smS.overlay} onClick={function(e) { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ ...smS.modal, width: width }}>
        <div style={smS.mHeader}>
          <span style={smS.mTitle}>{title}</span>
          <button style={smS.closeBtn} onClick={onClose}>
            <span className="material-icons" style={{ fontSize: 20 }}>close</span>
          </button>
        </div>
        <div style={smS.mBody}>{children}</div>
      </div>
    </div>
  );
}

// ── Form primitives ───────────────────────────────────────────────────────────
function MField({ label, children }) {
  return <div style={smS.field}><label style={smS.fieldLabel}>{label}</label>{children}</div>;
}
function MInput({ value, onChange, placeholder }) {
  return <input style={smS.input} value={value} onChange={function(e){ onChange(e.target.value); }} placeholder={placeholder||''} />;
}
function MDate({ value, onChange }) {
  return <input type="date" style={smS.input} value={value} onChange={function(e){ onChange(e.target.value); }} />;
}
function MTextarea({ value, onChange, rows }) {
  rows = rows || 3;
  return <textarea style={{ ...smS.input, resize:'vertical', height: rows*24+16 }} value={value} onChange={function(e){ onChange(e.target.value); }} />;
}
function PrimaryBtn({ children, onClick, disabled }) {
  return <button style={{ ...smS.primaryBtn, opacity: disabled ? 0.5 : 1 }} onClick={onClick} disabled={!!disabled}>{children}</button>;
}
function GhostBtn({ children, onClick }) {
  return <button style={smS.ghostBtn} onClick={onClick}>{children}</button>;
}
function MTabs({ tabs, active, onChange }) {
  return (
    <div style={smS.tabs}>
      {tabs.map(function(t) {
        return <button key={t.id} style={{ ...smS.tab, ...(active===t.id ? smS.tabActive : {}) }} onClick={function(){ onChange(t.id); }}>{t.label}</button>;
      })}
    </div>
  );
}
function PrefToggle({ label, value, onChange }) {
  return (
    <div style={smS.prefRow}>
      <span style={smS.prefLabel}>{label}</span>
      <button style={{ ...smS.toggle, background: value ? 'var(--mat-sys-primary)' : 'var(--mat-sys-outline-variant)' }} onClick={function(){ onChange(!value); }}>
        <span style={{ ...smS.toggleThumb, left: value ? 22 : 3 }} />
      </button>
    </div>
  );
}
function MFooter({ children }) {
  return <div style={smS.footer}>{children}</div>;
}
function EmptyMsg({ children }) {
  return <div style={smS.emptyMsg}>{children}</div>;
}

// ── Autocomplete search box (shared) ──────────────────────────────────────────
function SearchBox({ value, onChange, placeholder, suggestions, onSelect, noneBtn }) {
  var [open, setOpen] = React.useState(false);
  var filtered = suggestions && value.length > 0 ? suggestions.filter(function(s){ return s.toLowerCase().includes(value.toLowerCase()); }) : [];
  return (
    <div style={{ position:'relative' }}>
      <div style={smS.searchBox}>
        <span className="material-icons" style={{ fontSize:18, color:'color-mix(in srgb, var(--mat-sys-on-surface) 40%, transparent)', marginRight:6 }}>search</span>
        <input style={smS.searchInner} value={value}
          onChange={function(e){ onChange(e.target.value); setOpen(true); }}
          onBlur={function(){ setTimeout(function(){ setOpen(false); }, 160); }}
          placeholder={placeholder||t('summaryModal.rechercher.placeholder')} />
        {noneBtn && (
          <button style={smS.noneBtn} title={t('summaryModal.ajouterMentionAucun.tooltip')} onClick={function(){ noneBtn(); }}>
            <span className="material-icons-outlined" style={{ fontSize:18, color:'var(--mat-sys-primary)' }}>block</span>
          </button>
        )}
      </div>
      {open && filtered.length > 0 && (
        <div style={smS.dropList}>
          {filtered.map(function(s){
            return <div key={s} style={smS.dropItem} onMouseDown={function(){ onSelect(s); setOpen(false); }}>{s}</div>;
          })}
        </div>
      )}
    </div>
  );
}

// ── Allergies ─────────────────────────────────────────────────────────────────
var ALLERGY_SUGG = [L('Pénicilline'),L('Amoxicilline'),L('Aspirine'),L('Ibuprofène'),L('Codéine'),L('Latex'),L('Arachides'),L('Noix'),L('Fruits de mer'),L('Sulfamides')];

function AllergiesAddModal({ onClose, onAdd }) {
  var [query, setQuery] = React.useState('');
  var [type, setType] = React.useState('allergie');
  var [date, setDate] = React.useState('');
  var [notes, setNotes] = React.useState('');
  return (
    <ModalShell title={t('summaryModal.ajouterAllergieIntolerance.tooltip')} onClose={onClose}>
      <MField label={t('summaryModal.rechercherTerme.label')}>
        <SearchBox value={query} onChange={setQuery} placeholder={t('summaryModal.rechercherTerme.placeholder')} suggestions={ALLERGY_SUGG} onSelect={setQuery}
          noneBtn={function(){ onAdd({ name:t('summaryModal.noKnownAllergy.text'), type:'none', muted:true }); onClose(); }} />
        <div style={smS.helpText}>{t('summaryModal.sourceVigilanceSantePas.text')}</div>
      </MField>
      <div style={smS.row2}>
        <MField label={t('summaryModal.type.label')}>
          <div style={smS.radioGroup}>
            {['allergie','intolérance'].map(function(v){
              return (
                <label key={v} style={smS.radioLabel}>
                  <input type="radio" value={v} checked={type===v} onChange={function(){ setType(v); }} style={{ marginRight:5 }} />
                  {v.charAt(0).toUpperCase()+v.slice(1)}
                </label>
              );
            })}
          </div>
        </MField>
        <MField label={t('summaryModal.dateDebut.label')}><MDate value={date} onChange={setDate} /></MField>
      </div>
      <MField label={t('summaryModal.informationsAdditionnelles.label')}><MTextarea value={notes} onChange={setNotes} rows={2} /></MField>
      <MFooter>
        <GhostBtn onClick={onClose}>{t('summaryModal.annuler.text')}</GhostBtn>
        <PrimaryBtn disabled={!query} onClick={function(){ onAdd({ name:query, type, date, notes }); onClose(); }}>{t('summaryModal.ajouterAllergie.text')}</PrimaryBtn>
      </MFooter>
    </ModalShell>
  );
}

function AllergiesListModal({ items, onClose, onDelete }) {
  var allergies = items.filter(function(i){ return i.type !== 'intolérance' && !i.muted; });
  var intol = items.filter(function(i){ return i.type === 'intolérance'; });
  function ListSection({ sTitle, rows }) {
    return (
      <div style={{ marginBottom:16 }}>
        <div style={smS.listSection}>{sTitle}</div>
        {rows.length === 0
          ? <EmptyMsg>{t('summaryModal.aucunElement.text')}</EmptyMsg>
          : rows.map(function(r,i){
              return (
                <div key={i} style={smS.listRow}>
                  <div style={{ flex:1 }}>
                    <div style={smS.listName}>{r.name}</div>
                    {r.notes && <div style={smS.listSub}>{r.notes}</div>}
                    {r.date && <div style={smS.listMeta}>{t('summaryModal.since.text', { date: r.date })}</div>}
                  </div>
                  <button style={smS.iconActionBtn} onClick={function(){ onDelete(r); }}>
                    <span className="material-icons-outlined" style={{ fontSize:18 }}>delete</span>
                  </button>
                </div>
              );
            })}
      </div>
    );
  }
  return (
    <ModalShell title={t('summaryModal.allergiesIntolerances.tooltip')} onClose={onClose} width={520}>
      <ListSection sTitle={t('summaryModal.allergies.title')} rows={allergies} />
      <ListSection sTitle={t('summaryModal.intolerances.title')} rows={intol} />
      <MFooter><GhostBtn onClick={onClose}>{t('summaryModal.fermer.text')}</GhostBtn></MFooter>
    </ModalShell>
  );
}

// ── Signes vitaux ─────────────────────────────────────────────────────────────
function VitalsAddModal({ onClose, onAdd }) {
  var [unit, setUnit] = React.useState(L('Métrique'));
  var [obsDate, setObsDate] = React.useState('2026/06/08');
  var [obsTime, setObsTime] = React.useState('');
  var [temp, setTemp] = React.useState('');
  var [tempSite, setTempSite] = React.useState(L('Oral'));
  var [pressure, setPressure] = React.useState('');
  var [pressureSite, setPressureSite] = React.useState(L('Assis / bras droit'));
  var [hr, setHr] = React.useState('');
  var [hrType, setHrType] = React.useState(L('Régulier'));
  var [rr, setRr] = React.useState('');
  var [spo2, setSpo2] = React.useState('');
  var [o2flow, setO2flow] = React.useState('');
  var [height, setHeight] = React.useState('');
  var [weight, setWeight] = React.useState('');
  var [waist, setWaist] = React.useState('');
  var [head, setHead] = React.useState('');
  var [glycemia, setGlycemia] = React.useState('');

  var h = parseFloat(height), w = parseFloat(weight);
  var bmi = h && w ? (w / Math.pow(h, 2)).toFixed(1) : null;
  var bsa = h && w ? (0.007184 * Math.pow(h * 100, 0.725) * Math.pow(w, 0.425)).toFixed(2) : null;

  function VRow({ label, children }) {
    return (
      <div style={vStyles.vRow}>
        <span style={vStyles.vLabel}>{label}</span>
        <div style={vStyles.vControls}>{children}</div>
      </div>
    );
  }
  function VInput({ value, onChange }) {
    return <input style={vStyles.vInput} value={value} onChange={function(e){ onChange(e.target.value); }} placeholder={t('summaryModal.sansMesure.placeholder')} />;
  }
  function VUnit({ children }) { return <span style={vStyles.vUnit}>{children}</span>; }
  function VSelect({ value, onChange, options }) {
    return (
      <select style={vStyles.vSelect} value={value} onChange={function(e){ onChange(e.target.value); }}>
        {options.map(function(o){ return <option key={o}>{o}</option>; })}
      </select>
    );
  }

  return (
    <ModalShell title={t('summaryModal.ajouterObservationSignesVitaux.tooltip')} onClose={onClose} width={640}>
      {/* System + date */}
      <VRow label={t('summaryModal.systemeMesure.label')}>
        <VSelect value={unit} onChange={setUnit} options={[L('Métrique'),L('Impérial')]} />
      </VRow>
      <VRow label={t('summaryModal.dateObservation.label')}>
        <div style={{ ...smS.searchBox, width:160, gap:6 }}>
          <input style={smS.searchInner} value={obsDate} onChange={function(e){ setObsDate(e.target.value); }} />
          <span className="material-icons-outlined" style={{ fontSize:18, color:'color-mix(in srgb, var(--mat-sys-on-surface) 45%, transparent)' }}>calendar_today</span>
        </div>
        <input style={{ ...vStyles.vInput, width:80, marginLeft:8 }} value={obsTime} onChange={function(e){ setObsTime(e.target.value); }} placeholder={t('summaryModal.hhMm.placeholder')} />
      </VRow>

      {/* Measured indicators */}
      <div style={vStyles.sectionHead}>{t('summaryModal.indicateursMesures.text')}</div>
      <div style={vStyles.sectionBody}>
        <VRow label={t('summaryModal.temperature.label')}>
          <VInput value={temp} onChange={setTemp} /><VUnit>°C</VUnit>
          <VSelect value={tempSite} onChange={setTempSite} options={[L('Oral'),L('Axillaire'),L('Rectal'),L('Tympanique')]} />
        </VRow>
        <VRow label={t('summaryModal.pression.label')}>
          <VInput value={pressure} onChange={setPressure} /><VUnit>{t('summaryModal.mmhg.text')}</VUnit>
          <VSelect value={pressureSite} onChange={setPressureSite} options={[L('Assis / bras droit'),L('Assis / bras gauche'),L('Couché / bras droit'),L('Debout')]} />
        </VRow>
        <VRow label={t('summaryModal.freqCardiaque.label')}>
          <VInput value={hr} onChange={setHr} /><VUnit>bpm</VUnit>
          <VSelect value={hrType} onChange={setHrType} options={[L('Régulier'),L('Irrégulier')]} />
        </VRow>
        <VRow label={t('summaryModal.freqRespiratoire.label')}>
          <VInput value={rr} onChange={setRr} /><VUnit>cpm</VUnit>
        </VRow>
        <VRow label={t('summaryModal.spoDebitO.label')}>
          <VInput value={spo2} onChange={setSpo2} /><VUnit>%</VUnit>
          <input style={{ ...vStyles.vInput, width:80, marginLeft:8 }} value={o2flow} onChange={function(e){ setO2flow(e.target.value); }} placeholder="" />
          <VUnit>{t('summaryModal.min.text')}</VUnit>
        </VRow>
        <VRow label={t('summaryModal.taille.label')}>
          <VInput value={height} onChange={setHeight} /><VUnit>m</VUnit>
        </VRow>
        <VRow label={t('summaryModal.poids.label')}>
          <VInput value={weight} onChange={setWeight} /><VUnit>kg</VUnit>
        </VRow>
        <VRow label={t('summaryModal.tourTaille.label')}>
          <VInput value={waist} onChange={setWaist} /><VUnit>cm</VUnit>
        </VRow>
        <VRow label={t('summaryModal.perimetreCranien.label')}>
          <VInput value={head} onChange={setHead} /><VUnit>cm</VUnit>
        </VRow>
        <VRow label={t('summaryModal.glycemie.label')}>
          <VInput value={glycemia} onChange={setGlycemia} /><VUnit>{t('summaryModal.mmol.text')}</VUnit>
        </VRow>
      </div>

      {/* Calculated indicators */}
      <div style={vStyles.sectionHead}>{t('summaryModal.indicateursCalcules.text')}</div>
      <div style={vStyles.sectionBody}>
        <VRow label={t('summaryModal.imc.label')}>
          <span className="material-icons" style={{ fontSize:20, color:'var(--mat-sys-primary)', marginRight:8 }}>info</span>
          {bmi && <span style={{ fontSize:14, fontWeight:700, color:'var(--mat-sys-on-surface)' }}>{bmi}</span>}
        </VRow>
        <VRow label={t('summaryModal.surfaceCorporelle.label')}>
          <span className="material-icons" style={{ fontSize:20, color:'var(--mat-sys-primary)', marginRight:8 }}>info</span>
          {bsa && <span style={{ fontSize:14, fontWeight:700, color:'var(--mat-sys-on-surface)', marginRight:6 }}>{bsa}</span>}
          <VUnit>m²</VUnit>
        </VRow>
      </div>

      <MFooter>
        <GhostBtn onClick={onClose}>{t('summaryModal.annuler.text')}</GhostBtn>
        <PrimaryBtn onClick={function(){ onAdd({ height, weight, pressure, hr, temp, bmi, bsa }); onClose(); }}>{t('summaryModal.ajouterObservation.text')}</PrimaryBtn>
      </MFooter>
    </ModalShell>
  );
}

var vStyles = {
  vRow:{ display:'flex', alignItems:'center', padding:'6px 0', borderBottom:'1px solid var(--mat-sys-outline-variant)', gap:6 },
  vLabel:{ width:200, flexShrink:0, fontSize:14, color:'color-mix(in srgb, var(--mat-sys-on-surface) 72%, transparent)' },
  vControls:{ display:'flex', alignItems:'center', gap:4, flex:1 },
  vInput:{ border:'1px solid #c8c8d0', borderRadius:4, padding:'5px 8px', fontSize:14, fontFamily:"'Inter',sans-serif", color:'color-mix(in srgb, var(--mat-sys-on-surface) 75%, transparent)', width:110, textAlign:'right' },
  vUnit:{ fontSize:14, color:'color-mix(in srgb, var(--mat-sys-on-surface) 55%, transparent)', flexShrink:0 },
  vSelect:{ border:'1px solid #c8c8d0', borderRadius:4, padding:'5px 8px', fontSize:13, fontFamily:"'Inter',sans-serif", color:'color-mix(in srgb, var(--mat-sys-on-surface) 75%, transparent)', background:'var(--mat-sys-surface-container-lowest)', marginLeft:6 },
  sectionHead:{ fontSize:16, fontWeight:600, fontFamily:"'Poppins',sans-serif", color:'color-mix(in srgb, var(--mat-sys-on-surface) 85%, transparent)', padding:'14px 0 6px', borderBottom:'1px solid var(--mat-sys-outline-variant)', marginBottom:4 },
  sectionBody:{ marginBottom:8 },
};

// ── Médications ───────────────────────────────────────────────────────────────
var MEDS_STATUS_COLOR = { active:'#1b8a3f', echue:'#c07a00', cessée:'#c62828', texte:'var(--mat-sys-primary)' };
var MEDS_TABS = [{ id:'profil',label:t('summaryModal.profil.label') },{ id:'renouvelables',label:t('summaryModal.renouvelables.label') },{ id:'ordonnance',label:t('summaryModal.ordonnance.label') },{ id:'archive',label:t('summaryModal.archive.label') }];

function MedsModal({ items, onClose }) {
  var [tab, setTab] = React.useState('profil');
  var [showPrefs, setShowPrefs] = React.useState(false);
  var [query, setQuery] = React.useState('');
  var [mode, setMode] = React.useState('prescrire');
  if (showPrefs) return <MedsPrefsModal onClose={function(){ setShowPrefs(false); }} />;
  return (
    <ModalShell title={t('summaryModal.medications.tooltip')} onClose={onClose} width={620}>
      <div style={{ display:'flex', alignItems:'center', marginBottom:2 }}>
        <MTabs tabs={MEDS_TABS} active={tab} onChange={setTab} />
        <button style={smS.dotsBtn} onClick={function(){ setShowPrefs(true); }}>
          <span className="material-icons">more_vert</span>
        </button>
      </div>
      {tab === 'profil' && (
        <>
          <div style={smS.vitalsBar}>
            <span>{t('summaryModal.creatinine.label')} <b>72 µmol/L</b></span>
            <span>{t('summaryModal.egfr.label')} <b>89 mL/min</b></span>
            <span>{t('summaryModal.weight.label')} <b>62 kg</b></span>
          </div>
          {items.length === 0 && <EmptyMsg>{t('summaryModal.aucuneMedication.text')}</EmptyMsg>}
          {items.map(function(m,i){
            return (
              <div key={i} style={smS.medsRow}>
                <span style={{ ...smS.medsStatusDot, background: MEDS_STATUS_COLOR[m.status]||MEDS_STATUS_COLOR.active }} />
                <div style={{ flex:1 }}>
                  <div style={smS.medsName}>{m.name}</div>
                  <div style={smS.medsSub}>{m.detail}</div>
                </div>
                {m.date && <span style={smS.medsDate}>{m.date}</span>}
                <span className="material-icons" style={{ fontSize:18, color: m.pinned?'#f59e0b':'color-mix(in srgb, var(--mat-sys-on-surface) 20%, transparent)', cursor:'pointer' }}>star</span>
              </div>
            );
          })}
          <div style={{ marginTop:16, borderTop:'1px solid var(--mat-sys-outline-variant)', paddingTop:14 }}>
            <div style={{ display:'flex', marginBottom:10, border:'1px solid var(--mat-sys-outline-variant)', borderRadius:7, overflow:'hidden', width:'fit-content' }}>
              {['prescrire','inscrire'].map(function(m){
                return <button key={m} style={{ ...smS.modeBtn, ...(mode===m?smS.modeBtnOn:{}) }} onClick={function(){ setMode(m); }}>{m==='prescrire'?t('summaryModal.prescrire.text'):t('summaryModal.inscrireMedication.text')}</button>;
              })}
            </div>
            <SearchBox value={query} onChange={setQuery} placeholder={t('summaryModal.rechercherMedicament.placeholder')} suggestions={[L('Metformine'),L('Ramipril'),L('Atorvastatine'),L('Lévothyroxine'),L('Pantoprazole')]} onSelect={setQuery} />
          </div>
        </>
      )}
      {tab !== 'profil' && <EmptyMsg>{t('summaryModal.aucunElementCetOnglet.text')}</EmptyMsg>}
      <MFooter><GhostBtn onClick={onClose}>{t('summaryModal.fermer.text')}</GhostBtn></MFooter>
    </ModalShell>
  );
}

function MedsPrefsModal({ onClose }) {
  var [doseVisee, setDoseVisee] = React.useState(false);
  var [dsq, setDsq] = React.useState(true);
  var [modifPoids, setModifPoids] = React.useState(false);
  var [format, setFormat] = React.useState('8.5x11');
  var [pharma, setPharma] = React.useState(true);
  var [mensur, setMensur] = React.useState(false);
  var [cessation, setCessation] = React.useState(false);
  var [sig, setSig] = React.useState(true);
  var [renCount, setRenCount] = React.useState('3');
  var [renDuree, setRenDuree] = React.useState('30');
  return (
    <ModalShell title={t('summaryModal.preferencesMedications.tooltip')} onClose={onClose} width={520}>
      <div style={smS.prefSection}>{t('summaryModal.preferencesPrescription.text')}</div>
      <PrefToggle label={t('summaryModal.affichageDoseVisee.label')} value={doseVisee} onChange={setDoseVisee} />
      <PrefToggle label={t('summaryModal.envoiOrdonnancesDsq.label')} value={dsq} onChange={setDsq} />
      <PrefToggle label={t('summaryModal.modificationPoidsCalculateurDose.label')} value={modifPoids} onChange={setModifPoids} />
      <div style={smS.row2}>
        <MField label={t('summaryModal.renouvellementsDefaut.label')}><MInput value={renCount} onChange={setRenCount} /></MField>
        <MField label={t('summaryModal.dureeJours.label')}><MInput value={renDuree} onChange={setRenDuree} /></MField>
      </div>
      <div style={smS.prefSection}>{t('summaryModal.preferencesImpression.text')}</div>
      <MField label={t('summaryModal.format.label')}>
        <div style={smS.radioGroup}>
          {[['8.5x11','8½" × 11"'],['4x7','4" × 7"']].map(function(p){
            return (
              <label key={p[0]} style={smS.radioLabel}>
                <input type="radio" value={p[0]} checked={format===p[0]} onChange={function(){ setFormat(p[0]); }} style={{ marginRight:5 }} />{p[1]}
              </label>
            );
          })}
        </div>
      </MField>
      <PrefToggle label={t('summaryModal.pharmacie.label')} value={pharma} onChange={setPharma} />
      <PrefToggle label={t('summaryModal.mensurationsPatient.label')} value={mensur} onChange={setMensur} />
      <PrefToggle label={t('summaryModal.raisonCessation.label')} value={cessation} onChange={setCessation} />
      <PrefToggle label={t('summaryModal.signatureElectronique.label')} value={sig} onChange={setSig} />
      <MFooter>
        <GhostBtn onClick={onClose}>{t('summaryModal.annuler.text')}</GhostBtn>
        <PrimaryBtn onClick={onClose}>{t('summaryModal.sauvegarder.text')}</PrimaryBtn>
      </MFooter>
    </ModalShell>
  );
}

// ── Habitudes de vie ──────────────────────────────────────────────────────────
var HABITS_CATS = [L('Alcool'),L('Tabac'),L('Drogue'),L('Alimentation'),L('Activité physique'),L('Sommeil'),L('Emploi'),L('Autre')];
var HABITS_FREQS = [L('Aucun'),L('Régulier'),L('Occasionnel'),L('Abus'),L('Cessé')];

function HabitsModal({ items, onClose, onAdd }) {
  var [view, setView] = React.useState('list');
  var [cat, setCat] = React.useState('');
  var [freq, setFreq] = React.useState(L('Régulier'));
  var [desc, setDesc] = React.useState('');
  var [debut, setDebut] = React.useState('');
  var [fin, setFin] = React.useState('');
  var CAT_ICON = { Tabac:'smoking_rooms', Alcool:'local_bar', Drogue:'medication', Alimentation:'restaurant', 'Activité physique':'fitness_center', Sommeil:'bedtime', Emploi:'work', Autre:'more_horiz' };
  if (view === 'add') return (
    <ModalShell title={t('summaryModal.ajouterHabitudeVie.tooltip')} onClose={onClose} width={500}>
      <MField label={t('summaryModal.categorie.label')}>
        <select style={smS.input} value={cat} onChange={function(e){ setCat(e.target.value); }}>
          <option value="">{t('summaryModal.selectionner.label')}</option>
          {HABITS_CATS.map(function(c){ return <option key={c} value={c}>{c}</option>; })}
        </select>
      </MField>
      <MField label={t('summaryModal.frequence.label')}>
        <select style={smS.input} value={freq} onChange={function(e){ setFreq(e.target.value); }}>
          {HABITS_FREQS.map(function(f){ return <option key={f} value={f}>{f}</option>; })}
        </select>
      </MField>
      <MField label={t('summaryModal.descriptionOptionnel.label')}><MTextarea value={desc} onChange={setDesc} rows={2} /></MField>
      <div style={smS.row2}>
        <MField label={t('summaryModal.debutOptionnel.label')}><MDate value={debut} onChange={setDebut} /></MField>
        <MField label={t('summaryModal.finOptionnel.label')}><MDate value={fin} onChange={setFin} /></MField>
      </div>
      <MFooter>
        <GhostBtn onClick={function(){ setView('list'); }}>{t('summaryModal.retour.text')}</GhostBtn>
        <PrimaryBtn disabled={!cat} onClick={function(){ onAdd({ name:cat, detail:freq+(desc?' — '+desc:'') }); setView('list'); }}>{t('summaryModal.sauvegarder.text')}</PrimaryBtn>
      </MFooter>
    </ModalShell>
  );
  return (
    <ModalShell title={t('summaryModal.habitudesVieContexteSocial.tooltip')} onClose={onClose} width={520}>
      {items.length === 0 && <EmptyMsg>{t('summaryModal.aucuneSaisieHabitudeVie.text')}</EmptyMsg>}
      {items.map(function(it,i){
        return (
          <div key={i} style={smS.listRow}>
            <span className="material-icons-outlined" style={{ fontSize:18, color:'color-mix(in srgb, var(--mat-sys-on-surface) 45%, transparent)', marginRight:8 }}>{CAT_ICON[it.name]||'more_horiz'}</span>
            <div style={{ flex:1 }}>
              <span style={smS.listName}>{it.name || it.left}</span>
              {(it.detail||it.mid) && <span style={{ ...smS.listSub, marginLeft:8 }}>{it.detail||it.mid}</span>}
            </div>
            <span className="material-icons" style={{ fontSize:16, color:'color-mix(in srgb, var(--mat-sys-on-surface) 25%, transparent)', cursor:'pointer' }}>star</span>
          </div>
        );
      })}
      <MFooter>
        <GhostBtn onClick={onClose}>{t('summaryModal.fermer.text')}</GhostBtn>
        <PrimaryBtn onClick={function(){ setView('add'); }}>
          <span className="material-icons" style={{ fontSize:16, marginRight:5 }}>add</span>{t('summaryModal.ajoutCategorie.text')}
        </PrimaryBtn>
      </MFooter>
    </ModalShell>
  );
}

// ── Problèmes / Antécédents ───────────────────────────────────────────────────
function ProblemsModal({ title, items, onClose, onAdd, convertLabel }) {
  var [sortMode, setSortMode] = React.useState(false);
  var [list, setList] = React.useState(items.slice());
  var [query, setQuery] = React.useState('');
  var [date, setDate] = React.useState('');
  function move(idx, dir) {
    var arr = list.slice();
    var t = idx + dir;
    if (t < 0 || t >= arr.length) return;
    var tmp = arr[idx]; arr[idx] = arr[t]; arr[t] = tmp;
    setList(arr);
  }
  return (
    <ModalShell title={title} onClose={onClose} width={520}>
      <div style={{ display:'flex', alignItems:'center', marginBottom:12 }}>
        <button style={{ ...smS.ghostBtn, fontSize:13 }} onClick={function(){ setSortMode(!sortMode); }}>
          <span className="material-icons-outlined" style={{ fontSize:16, marginRight:5 }}>sort</span>
          {t('summaryModal.sortList.button', { title: title.toLowerCase() })}
        </button>
        {sortMode && <span style={{ fontSize:12, color:'var(--mat-sys-primary)', marginLeft:10 }}>{t('summaryModal.modeTriActif.text')}</span>}
      </div>
      {list.length === 0 && <EmptyMsg>{t('summaryModal.aucunElement.text')}</EmptyMsg>}
      {list.map(function(r,i){
        return (
          <div key={i} style={smS.listRow}>
            {sortMode ? (
              <div style={{ display:'flex', flexDirection:'column', gap:2, marginRight:8 }}>
                <button style={smS.arrowBtn} onClick={function(){ move(i,-1); }}>▲</button>
                <button style={smS.arrowBtn} onClick={function(){ move(i,1); }}>▼</button>
              </div>
            ) : (
              <span className="material-icons" style={{ fontSize:15, color:'color-mix(in srgb, var(--mat-sys-on-surface) 25%, transparent)', cursor:'pointer', marginRight:8 }}>star</span>
            )}
            <div style={{ flex:1 }}>
              <div style={smS.listName}>{r.left||r.name}</div>
              {r.right && <div style={smS.listMeta}>{r.right}</div>}
            </div>
            {!sortMode && convertLabel && (
              <button style={smS.iconActionBtn} title={convertLabel}>
                <span className="material-icons-outlined" style={{ fontSize:18 }}>swap_horiz</span>
              </button>
            )}
          </div>
        );
      })}
      <div style={{ borderTop:'1px solid var(--mat-sys-outline-variant)', paddingTop:14, marginTop:12 }}>
        <div style={smS.row2}>
          <MField label={t('summaryModal.ajouter.label')}><MInput value={query} onChange={setQuery} placeholder={t('summaryModal.rechercher.placeholder')} /></MField>
          <MField label={t('summaryModal.date.label')}><MDate value={date} onChange={setDate} /></MField>
        </div>
      </div>
      <MFooter>
        <GhostBtn onClick={onClose}>{t('summaryModal.fermer.text')}</GhostBtn>
        <PrimaryBtn disabled={!query} onClick={function(){ onAdd({ left:query, name:query, right:date }); setQuery(''); setDate(''); }}>{t('summaryModal.ajouter.text')}</PrimaryBtn>
      </MFooter>
    </ModalShell>
  );
}

// ── Antécédents familiaux ─────────────────────────────────────────────────────
var FAM_RELATIONS = [L('Père'),L('Mère'),L('Frère'),L('Sœur'),L('Grand-père paternel'),L('Grand-mère paternelle'),L('Grand-père maternel'),L('Grand-mère maternelle')];

function FamilyModal({ items, onClose, onAdd }) {
  var [showAdd, setShowAdd] = React.useState(false);
  var [relation, setRelation] = React.useState('');
  var [condition, setCondition] = React.useState('');
  return (
    <ModalShell title={t('summaryModal.antecedentsFamiliaux.tooltip')} onClose={onClose} width={520}>
      {items.length === 0 && !showAdd && <EmptyMsg>{t('summaryModal.aucunAntecedentFamilial.text')}</EmptyMsg>}
      {items.map(function(r,i){
        return (
          <div key={i} style={smS.listRow}>
            <span className="material-icons" style={{ fontSize:15, color:'color-mix(in srgb, var(--mat-sys-on-surface) 25%, transparent)', cursor:'pointer', marginRight:8 }}>star</span>
            <div style={{ flex:1 }}>
              <span style={smS.listName}>{r.left||r.name}</span>
              {(r.mid) && <span style={{ ...smS.listSub, marginLeft:8 }}>{r.mid}</span>}
            </div>
          </div>
        );
      })}
      {showAdd && (
        <div style={{ borderTop:'1px solid var(--mat-sys-outline-variant)', paddingTop:14, marginTop:8 }}>
          <MField label={t('summaryModal.typeRelation.label')}>
            <select style={smS.input} value={relation} onChange={function(e){ setRelation(e.target.value); }}>
              <option value="">{t('summaryModal.selectionner.label')}</option>
              {FAM_RELATIONS.map(function(r){ return <option key={r} value={r}>{r}</option>; })}
            </select>
          </MField>
          <MField label={t('summaryModal.conditionMedicale.label')}><MInput value={condition} onChange={setCondition} placeholder={t('summaryModal.exDiabeteType2.placeholder')} /></MField>
          <MFooter>
            <GhostBtn onClick={function(){ setShowAdd(false); }}>{t('summaryModal.annuler.text')}</GhostBtn>
            <PrimaryBtn disabled={!relation||!condition} onClick={function(){ onAdd({ left:condition, name:condition, mid:relation }); setShowAdd(false); }}>{t('summaryModal.ajouter.text')}</PrimaryBtn>
          </MFooter>
        </div>
      )}
      {!showAdd && (
        <MFooter>
          <GhostBtn onClick={onClose}>{t('summaryModal.fermer.text')}</GhostBtn>
          <PrimaryBtn onClick={function(){ setShowAdd(true); }}>
            <span className="material-icons" style={{ fontSize:16, marginRight:5 }}>add</span>{t('summaryModal.ajouter2.text')}
          </PrimaryBtn>
        </MFooter>
      )}
    </ModalShell>
  );
}

// ── Immunisations ─────────────────────────────────────────────────────────────
var VACCINE_SUGG = [L('HPV (Gardasil)'),L('dCaT (Tétanos-diphtérie)'),L('Influenza'),L('COVID-19'),L('RRO'),L('Varicelle'),L('Hépatite B'),L('Méningocoque')];

function ImmunModal({ items, onClose, onAdd }) {
  var [query, setQuery] = React.useState('');
  var [date, setDate] = React.useState('');
  var [lot, setLot] = React.useState('');
  return (
    <ModalShell title={t('summaryModal.immunisationVaccins.tooltip')} onClose={onClose} width={520}>
      {items.map(function(r,i){
        return (
          <div key={i} style={smS.listRow}>
            <span className="material-icons" style={{ fontSize:15, color:'color-mix(in srgb, var(--mat-sys-on-surface) 25%, transparent)', cursor:'pointer', marginRight:8 }}>star</span>
            <div style={{ flex:1 }}>
              <span style={smS.listName}>{r.left}</span>
              {r.mid && <span style={{ ...smS.listSub, marginLeft:8 }}>{r.mid}</span>}
            </div>
            {r.right && <span style={smS.listMeta}>{r.right}</span>}
          </div>
        );
      })}
      <div style={{ borderTop:'1px solid var(--mat-sys-outline-variant)', paddingTop:14, marginTop:8 }}>
        <MField label={t('summaryModal.rechercherVaccin.label')}>
          <SearchBox value={query} onChange={setQuery} placeholder={t('summaryModal.rechercherVaccin.placeholder')} suggestions={VACCINE_SUGG} onSelect={setQuery}
            noneBtn={function(){ onAdd({ left:L('Aucun vaccin connu'), right:'' }); }} />
        </MField>
        <div style={smS.row2}>
          <MField label={t('summaryModal.dateVaccination.label')}><MDate value={date} onChange={setDate} /></MField>
          <MField label={t('summaryModal.numeroLotOptionnel.label')}><MInput value={lot} onChange={setLot} /></MField>
        </div>
      </div>
      <MFooter>
        <GhostBtn onClick={onClose}>{t('summaryModal.fermer.text')}</GhostBtn>
        <PrimaryBtn disabled={!query} onClick={function(){ onAdd({ left:query, right:date||''+new Date().getFullYear() }); setQuery(''); setDate(''); }}>{t('summaryModal.ajouterVaccin.text')}</PrimaryBtn>
      </MFooter>
    </ModalShell>
  );
}

// ── Tâches ────────────────────────────────────────────────────────────────────
function TasksModal({ items, onClose, onAdd }) {
  var [title, setTitle] = React.useState('');
  var [date, setDate] = React.useState('2026/06/08');
  var [desc, setDesc] = React.useState('');
  var [institution, setInstitution] = React.useState('CLINIQUE DU CENTRE-VILLE');
  var [assignTo, setAssignTo] = React.useState('');
  var [queue, setQueue] = React.useState('');
  var [state, setState] = React.useState('Nouveau');
  var [priority, setPriority] = React.useState('Normal');

  return (
    <ModalShell title={t('summaryModal.ajouterTache.tooltip')} onClose={onClose} width={620}>
      <div style={{ marginBottom:14 }}>
        <button style={{ background:'none', border:0, padding:0, cursor:'pointer', color:'var(--mat-sys-primary)', fontSize:14, fontWeight:600 }}>{t('summaryModal.selectionnerTacheRapide.button')}</button>
      </div>

      {/* Title + Date row */}
      <div style={{ display:'flex', gap:10, marginBottom:12 }}>
        <input
          style={{ ...smS.input, flex:1 }}
          value={title}
          onChange={function(e){ setTitle(e.target.value); }}
          placeholder={t('summaryModal.titre.placeholder')}
        />
        <div style={{ ...smS.searchBox, width:180, gap:6 }}>
          <input
            style={{ ...smS.searchInner, width:'100%' }}
            value={date}
            onChange={function(e){ setDate(e.target.value); }}
            placeholder={t('summaryModal.aaaaMmJj.placeholder')}
          />
          <span className="material-icons-outlined" style={{ fontSize:20, color:'color-mix(in srgb, var(--mat-sys-on-surface) 50%, transparent)', cursor:'pointer' }}>calendar_today</span>
        </div>
      </div>

      {/* Description */}
      <textarea
        style={{ ...smS.input, resize:'vertical', height:110, marginBottom:16 }}
        value={desc}
        onChange={function(e){ setDesc(e.target.value); }}
        placeholder={t('summaryModal.description.placeholder')}
      />

      {/* Meta fields */}
      {[
        { label:t('summaryModal.institution.label'), ctrl: <select style={smS.input} value={institution} onChange={function(e){ setInstitution(e.target.value); }}><option value="CLINIQUE DU CENTRE-VILLE">{t('summaryModal.cliniqueCentreVille.label')}</option><option value="CENTRE DE SANTÉ INTÉGRALE">{t('summaryModal.centreSanteIntegrale.label')}</option></select> },
        { label:t('summaryModal.assigner.label'), ctrl: <input style={smS.input} value={assignTo} onChange={function(e){ setAssignTo(e.target.value); }} placeholder={t('summaryModal.prenomNomIdentifiant.placeholder')} /> },
        { label:t('summaryModal.fileTaches.label'), ctrl: <input style={smS.input} value={queue} onChange={function(e){ setQueue(e.target.value); }} placeholder={t('summaryModal.titreFileTaches.placeholder')} /> },
        { label:t('summaryModal.etat.label'), ctrl: <select style={{ ...smS.input, width:'auto' }} value={state} onChange={function(e){ setState(e.target.value); }}><option value="Nouveau">{t('summaryModal.nouveau.label')}</option><option value="En cours">{t('summaryModal.cours.label')}</option><option value="Terminé">{t('summaryModal.termine.label')}</option></select> },
        { label:t('summaryModal.priorite.label'), ctrl: <select style={{ ...smS.input, width:'auto' }} value={priority} onChange={function(e){ setPriority(e.target.value); }}><option value="Normal">{t('summaryModal.normal.label')}</option><option value="Urgent">{t('summaryModal.urgent.label')}</option><option value="Faible">{t('summaryModal.faible.label')}</option></select> },
      ].map(function(row) {
        return (
          <div key={row.label} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
            <span style={{ fontSize:14, color:'color-mix(in srgb, var(--mat-sys-on-surface) 70%, transparent)', width:130, flexShrink:0 }}>{row.label}</span>
            <div style={{ flex:1 }}>{row.ctrl}</div>
          </div>
        );
      })}

      <MFooter>
        <GhostBtn onClick={onClose}>{t('summaryModal.annuler.text')}</GhostBtn>
        <PrimaryBtn disabled={!title} onClick={function(){ onAdd({ name:title, left:title, right:date, desc, state, priority }); setTitle(''); onClose(); }}>{t('summaryModal.ajouterTache.text')}</PrimaryBtn>
      </MFooter>
    </ModalShell>
  );
}

// ── Programmes ───────────────────────────────────────────────────────────────
var PROGRAMS_LIST = [L('Diabète'),L('Hypertension'),L('Grossesse'),L('Insuffisance cardiaque'),L('MPOC'),L('Santé mentale'),L('Anticoagulothérapie'),L('Maladies rénales chroniques')];

function ProgramsModal({ items, onClose, onAdd }) {
  var [date, setDate] = React.useState('2026/06/08');
  var [program, setProgram] = React.useState('');

  return (
    <ModalShell title={t('summaryModal.inscriptionSuivi.tooltip')} onClose={onClose} width={520}>
      {items.length > 0 && (
        <div style={{ marginBottom:16 }}>
          {items.map(function(it, i) {
            return (
              <div key={i} style={smS.listRow}>
                <span className="material-icons-outlined" style={{ fontSize:18, color:'var(--mat-sys-primary)', marginRight:8 }}>assignment_turned_in</span>
                <div style={{ flex:1 }}>
                  <span style={smS.listName}>{it.name||it.left}</span>
                  {it.right && <span style={{ ...smS.listMeta, marginLeft:8 }}>{it.right}</span>}
                </div>
                <button style={smS.iconActionBtn}>
                  <span className="material-icons-outlined" style={{ fontSize:16 }}>delete</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ borderTop: items.length > 0 ? '1px solid var(--mat-sys-outline-variant)' : 'none', paddingTop: items.length > 0 ? 16 : 0 }}>
        <div style={{ fontSize:14, color:'color-mix(in srgb, var(--mat-sys-on-surface) 72%, transparent)', marginBottom:8 }}>{t('summaryModal.quelleDateInscription.text')}</div>
        <div style={{ ...smS.searchBox, width:200, marginBottom:16 }}>
          <input style={{ ...smS.searchInner }} value={date} onChange={function(e){ setDate(e.target.value); }} />
          <span className="material-icons-outlined" style={{ fontSize:18, color:'color-mix(in srgb, var(--mat-sys-on-surface) 45%, transparent)' }}>calendar_today</span>
        </div>

        <div style={{ fontSize:14, color:'color-mix(in srgb, var(--mat-sys-on-surface) 72%, transparent)', marginBottom:8 }}>{t('summaryModal.creerInscriptionQuelProgramme.text')}</div>
        <select style={{ ...smS.input, width:'auto', minWidth:240 }} value={program} onChange={function(e){ setProgram(e.target.value); }}>
          <option value="">{t('summaryModal.choisirProgramme.label')}</option>
          {PROGRAMS_LIST.map(function(p){ return <option key={p} value={p}>{p}</option>; })}
        </select>
      </div>

      <MFooter>
        <GhostBtn onClick={onClose}>{t('summaryModal.annuler.text')}</GhostBtn>
        <PrimaryBtn disabled={!program} onClick={function(){ onAdd({ name:program, left:program, right:date }); onClose(); }}>{t('summaryModal.inscrirePatient.text')}</PrimaryBtn>
      </MFooter>
    </ModalShell>
  );
}

window.ProgramsModal = ProgramsModal;

// ── Résultats ─────────────────────────────────────────────────────────────────
var RESULT_SUGG = [
  // Hématologie
  L('FSC — hémoglobine'),L('FSC — hématocrite'),L('FSC — leucocytes'),L('FSC — plaquettes'),
  L('VGM'),L('INR / RNI'),L('TCA'),L('Ferritine'),L('Fer sérique'),L('Saturation de la transferrine'),
  L('Vitamine B12'),L('Folates (acide folique)'),
  // Biochimie / ions
  L('Sodium'),L('Potassium'),L('Chlore'),L('Bicarbonates'),L('Glucose à jeun'),L('Créatinine'),
  L('DFGe (eGFR)'),L('Urée'),L('Calcium'),L('Phosphore'),L('Magnésium'),L('Albumine'),L('Protéines totales'),
  // Profil lipidique
  L('Cholestérol total'),L('LDL'),L('HDL'),L('Triglycérides'),L('Rapport cholestérol/HDL'),L('Non-HDL'),
  // Glycémie / diabète
  L('HbA1c (hémoglobine glyquée)'),L('Glycémie à jeun'),L('Glycémie aléatoire'),
  // Fonction hépatique
  L('ALT'),L('AST'),L('GGT'),L('Phosphatase alcaline'),L('Bilirubine totale'),L('Bilirubine conjuguée'),
  // Thyroïde
  L('TSH'),L('T4 libre'),L('T3 libre'),
  // Rénal / urinaire
  L('Analyse d\'urine (SMU)'),L('Microalbuminurie'),L('Rapport albumine/créatinine urinaire'),L('Culture d\'urine'),
  // Vitamines / endocrinien
  L('Vitamine D (25-OH)'),L('PTH'),L('Cortisol'),L('Testostérone'),
  // Marqueurs / dépistage
  L('APS (PSA)'),L('CRP'),L('CRP haute sensibilité'),L('hCG'),L('HBsAg'),L('Sérologie VIH'),L('Sérologie hépatite B'),L('Sérologie hépatite C'),
];

// Normalité d'un résultat : le code est ce qu'on garde et compare (couleur du
// libellé) ; le libellé suit la langue.
var NORMALITY_LABEL = {
  normal: t('result.normality.normal'), abnormal: t('result.normality.abnormal'), borderline: t('result.normality.borderline')
};
var NORMALITY_COLOR = {
  normal: 'light-dark(#1b8a3f, #a5e9bb)', abnormal: 'light-dark(#c62828, #e9a5a5)', borderline: 'light-dark(#c07a00, #e9d0a5)'
};

function ResultsModal({ items, onClose, onAdd }) {
  var [test, setTest] = React.useState('');
  var [result, setResult] = React.useState('');
  var [normality, setNormality] = React.useState('');
  var [sampDate, setSampDate] = React.useState('');
  var [showDrop, setShowDrop] = React.useState(false);
  var filtered = RESULT_SUGG.filter(function(s){ return s.toLowerCase().includes(test.toLowerCase()) && test.length > 0; });
  return (
    <ModalShell title={t('summaryModal.insererNouveauResultat.tooltip')} onClose={onClose} width={640}>
      {items.length > 0 && (
        <div style={{ marginBottom:16 }}>
          {items.map(function(it,i){
            return (
              <div key={i} style={smS.listRow}>
                <div style={{ flex:1 }}>
                  <span style={smS.listName}>{it.name||it.left}</span>
                  {it.result && <span style={{ ...smS.listSub, marginLeft:8 }}>{it.result}</span>}
                  {it.normality && <span style={{ marginLeft:8, fontSize:12, fontWeight:600, color: NORMALITY_COLOR[it.normality] || NORMALITY_COLOR.borderline }}>{NORMALITY_LABEL[it.normality] || it.normality}</span>}
                </div>
                {it.right && <span style={smS.listMeta}>{it.right}</span>}
              </div>
            );
          })}
        </div>
      )}
      <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:2, minWidth:200 }}>
          <input
            style={{ ...smS.input, borderColor:'var(--mat-sys-primary)', borderWidth:2 }}
            value={test}
            onChange={function(e){ setTest(e.target.value); setShowDrop(true); }}
            onBlur={function(){ setTimeout(function(){ setShowDrop(false); }, 160); }}
            placeholder={t('summaryModal.nomTest.placeholder')}
          />
          {showDrop && filtered.length > 0 && (
            <div style={smS.dropList}>
              {filtered.map(function(s){
                return <div key={s} style={smS.dropItem} onMouseDown={function(){ setTest(s); setShowDrop(false); }}>{s}</div>;
              })}
            </div>
          )}
        </div>
        <input style={{ ...smS.input, flex:1, minWidth:90 }} value={result} onChange={function(e){ setResult(e.target.value); }} placeholder={t('summaryModal.resultat.placeholder')} />
        <select style={{ ...smS.input, flex:1, minWidth:110 }} value={normality} onChange={function(e){ setNormality(e.target.value); }}>
          <option value="">{t('summaryModal.normalite.label')}</option>
          {Object.keys(NORMALITY_LABEL).map(function(code){ return <option key={code} value={code}>{NORMALITY_LABEL[code]}</option>; })}
        </select>
        <div style={{ ...smS.searchBox, flex:1, minWidth:150 }}>
          <input style={smS.searchInner} value={sampDate} onChange={function(e){ setSampDate(e.target.value); }} placeholder={t('summaryModal.datePrelevement.placeholder')} />
          <span className="material-icons-outlined" style={{ fontSize:18, color:'color-mix(in srgb, var(--mat-sys-on-surface) 45%, transparent)' }}>calendar_today</span>
        </div>
      </div>
      <MFooter>
        <GhostBtn onClick={onClose}>{t('summaryModal.annuler.text')}</GhostBtn>
        <PrimaryBtn disabled={!test} onClick={function(){ onAdd({ name:test, left:test, result, normality, right:sampDate }); onClose(); }}>{t('summaryModal.ajouterResultat.text')}</PrimaryBtn>
      </MFooter>
    </ModalShell>
  );
}

window.ResultsModal = ResultsModal;

function PrintModal({ sections, onClose }) {
  var [checked, setChecked] = React.useState(sections.map(function(s){ return s.id; }));
  function toggle(id) {
    setChecked(function(prev){ return prev.includes(id) ? prev.filter(function(x){ return x!==id; }) : [...prev,id]; });
  }
  return (
    <ModalShell title={t('summaryModal.imprimerSommaire.tooltip')} onClose={onClose} width={400}>
      <div style={{ marginBottom:12 }}>
        <button style={smS.ghostBtn} onClick={function(){ setChecked([]); }}>{t('summaryModal.deselectionnerTout.button')}</button>
      </div>
      {sections.map(function(s){
        return (
          <label key={s.id} style={smS.printRow}>
            <input type="checkbox" checked={checked.includes(s.id)} onChange={function(){ toggle(s.id); }} style={{ marginRight:10 }} />
            {s.label}
          </label>
        );
      })}
      <MFooter>
        <GhostBtn onClick={onClose}>{t('summaryModal.annuler.text')}</GhostBtn>
        <PrimaryBtn onClick={onClose}>
          <span className="material-icons" style={{ fontSize:16, marginRight:5 }}>print</span>{t('summaryModal.imprimer.text')}
        </PrimaryBtn>
      </MFooter>
    </ModalShell>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
var smS = {
  overlay:{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 },
  modal:{ background:'var(--mat-sys-surface-container-lowest)', borderRadius:10, boxShadow:'0 8px 32px rgba(37,36,94,0.22)', maxHeight:'85vh', display:'flex', flexDirection:'column', overflow:'hidden' },
  mHeader:{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', padding:'18px 20px 14px', borderBottom:'1px solid var(--mat-sys-outline-variant)', flexShrink:0 },
  mTitle:{ fontSize:16, fontWeight:700, fontFamily:"'Poppins',sans-serif", color:'color-mix(in srgb, var(--mat-sys-on-surface) 88%, transparent)' },
  closeBtn:{ background:'none', border:0, cursor:'pointer', padding:4, color:'color-mix(in srgb, var(--mat-sys-on-surface) 50%, transparent)', display:'flex', alignItems:'center', flexShrink:0 },
  mBody:{ padding:'16px 20px 20px', overflowY:'auto', flex:1 },
  field:{ marginBottom:12 },
  fieldLabel:{ display:'block', fontSize:12, color:'color-mix(in srgb, var(--mat-sys-on-surface) 60%, transparent)', marginBottom:4, fontWeight:600, letterSpacing:0.2 },
  input:{ width:'100%', border:'1px solid var(--mat-sys-outline-variant)', borderRadius:6, padding:'8px 10px', fontSize:14, fontFamily:"'Inter',sans-serif", color:'color-mix(in srgb, var(--mat-sys-on-surface) 82%, transparent)', outline:'none', boxSizing:'border-box' },
  row2:{ display:'flex', gap:14 },
  helpText:{ fontSize:11, color:'color-mix(in srgb, var(--mat-sys-on-surface) 45%, transparent)', marginTop:3 },
  searchBox:{ display:'flex', alignItems:'center', border:'1px solid var(--mat-sys-outline-variant)', borderRadius:6, padding:'7px 8px' },
  searchInner:{ flex:1, border:'none', outline:'none', fontSize:14, fontFamily:"'Inter',sans-serif", color:'color-mix(in srgb, var(--mat-sys-on-surface) 82%, transparent)', background:'transparent' },
  noneBtn:{ background:'none', border:0, cursor:'pointer', padding:2, display:'flex', alignItems:'center', marginLeft:4 },
  dropList:{ position:'absolute', top:'100%', left:0, right:0, background:'var(--mat-sys-surface-container-lowest)', border:'1px solid var(--mat-sys-outline-variant)', borderRadius:6, zIndex:20, boxShadow:'0 4px 12px rgba(0,0,0,0.1)', maxHeight:180, overflowY:'auto' },
  dropItem:{ padding:'8px 12px', fontSize:14, cursor:'pointer', color:'color-mix(in srgb, var(--mat-sys-on-surface) 82%, transparent)' },
  radioGroup:{ display:'flex', gap:20, alignItems:'center', padding:'6px 0' },
  radioLabel:{ fontSize:14, color:'color-mix(in srgb, var(--mat-sys-on-surface) 78%, transparent)', cursor:'pointer', display:'flex', alignItems:'center' },
  footer:{ display:'flex', justifyContent:'flex-end', gap:10, paddingTop:14, borderTop:'1px solid var(--mat-sys-outline-variant)', marginTop:14 },
  primaryBtn:{ background:'var(--mat-sys-primary)', color:'var(--mat-sys-on-primary)', border:0, borderRadius:7, padding:'9px 18px', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:"'Inter',sans-serif", display:'flex', alignItems:'center' },
  ghostBtn:{ background:'none', border:'1px solid var(--mat-sys-outline-variant)', borderRadius:7, padding:'8px 14px', fontSize:13, cursor:'pointer', color:'color-mix(in srgb, var(--mat-sys-on-surface) 70%, transparent)', fontFamily:"'Inter',sans-serif", display:'flex', alignItems:'center' },
  tabs:{ display:'flex', borderBottom:'1px solid var(--mat-sys-outline-variant)', marginBottom:12 },
  tab:{ padding:'8px 14px', border:0, background:'none', cursor:'pointer', fontSize:13, color:'color-mix(in srgb, var(--mat-sys-on-surface) 60%, transparent)', fontFamily:"'Inter',sans-serif", borderBottom:'2px solid transparent', marginBottom:-1 },
  tabActive:{ color:'var(--mat-sys-primary)', borderBottomColor:'var(--mat-sys-primary)', fontWeight:600 },
  listSection:{ fontSize:11, fontWeight:700, letterSpacing:0.6, textTransform:'uppercase', color:'color-mix(in srgb, var(--mat-sys-on-surface) 45%, transparent)', marginBottom:6, marginTop:4 },
  listRow:{ display:'flex', alignItems:'center', padding:'8px 0', borderBottom:'1px solid var(--mat-sys-outline-variant)' },
  listName:{ fontSize:14, color:'color-mix(in srgb, var(--mat-sys-on-surface) 82%, transparent)', fontWeight:500 },
  listSub:{ fontSize:13, color:'color-mix(in srgb, var(--mat-sys-on-surface) 55%, transparent)' },
  listMeta:{ fontSize:12, color:'color-mix(in srgb, var(--mat-sys-on-surface) 45%, transparent)', flexShrink:0 },
  iconActionBtn:{ background:'none', border:0, cursor:'pointer', padding:4, color:'color-mix(in srgb, var(--mat-sys-on-surface) 40%, transparent)', display:'flex' },
  emptyMsg:{ fontSize:14, color:'color-mix(in srgb, var(--mat-sys-on-surface) 45%, transparent)', padding:'14px 0', textAlign:'center' },
  calcRow:{ display:'flex', gap:20, background:'color-mix(in srgb, var(--mat-sys-primary) 10%, var(--mat-sys-surface-container-lowest))', borderRadius:8, padding:'10px 14px', marginBottom:4 },
  calcItem:{ display:'flex', flexDirection:'column', gap:2 },
  calcLabel:{ fontSize:11, color:'color-mix(in srgb, var(--mat-sys-on-surface) 55%, transparent)' },
  calcVal:{ fontSize:16, fontWeight:700, color:'var(--mat-sys-on-surface)' },
  unitBtn:{ padding:'7px 16px', border:0, background:'none', cursor:'pointer', fontSize:13, color:'color-mix(in srgb, var(--mat-sys-on-surface) 60%, transparent)', fontFamily:"'Inter',sans-serif" },
  unitBtnOn:{ background:'#25245E', color:'#fff', fontWeight:600 },
  dotsBtn:{ background:'none', border:0, cursor:'pointer', padding:6, color:'color-mix(in srgb, var(--mat-sys-on-surface) 55%, transparent)', marginLeft:'auto', display:'flex' },
  vitalsBar:{ background:'color-mix(in srgb, var(--mat-sys-primary) 10%, var(--mat-sys-surface-container-lowest))', borderRadius:7, padding:'7px 12px', marginBottom:10, display:'flex', gap:18, fontSize:13, color:'color-mix(in srgb, var(--mat-sys-on-surface) 60%, transparent)' },
  medsRow:{ display:'flex', alignItems:'center', padding:'9px 0', borderBottom:'1px solid var(--mat-sys-outline-variant)', gap:10 },
  medsStatusDot:{ width:8, height:8, borderRadius:'50%', flexShrink:0 },
  medsName:{ fontSize:14, fontWeight:600, color:'color-mix(in srgb, var(--mat-sys-on-surface) 85%, transparent)' },
  medsSub:{ fontSize:13, color:'color-mix(in srgb, var(--mat-sys-on-surface) 55%, transparent)' },
  medsDate:{ fontSize:12, color:'color-mix(in srgb, var(--mat-sys-on-surface) 45%, transparent)', flexShrink:0 },
  modeBtn:{ padding:'7px 14px', border:0, background:'none', cursor:'pointer', fontSize:13, color:'color-mix(in srgb, var(--mat-sys-on-surface) 60%, transparent)', fontFamily:"'Inter',sans-serif" },
  modeBtnOn:{ background:'#25245E', color:'#fff', fontWeight:600 },
  prefSection:{ fontSize:12, fontWeight:700, color:'var(--mat-sys-on-surface)', textTransform:'uppercase', letterSpacing:0.5, margin:'14px 0 8px' },
  prefRow:{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--mat-sys-outline-variant)' },
  prefLabel:{ fontSize:14, color:'color-mix(in srgb, var(--mat-sys-on-surface) 78%, transparent)' },
  toggle:{ width:44, height:24, borderRadius:12, border:0, cursor:'pointer', position:'relative', transition:'background 0.2s', flexShrink:0 },
  toggleThumb:{ position:'absolute', top:3, width:18, height:18, borderRadius:'50%', background:'var(--mat-sys-surface-container-lowest)', transition:'left 0.18s' },
  arrowBtn:{ background:'none', border:'1px solid var(--mat-sys-outline-variant)', borderRadius:3, cursor:'pointer', fontSize:10, padding:'1px 5px', lineHeight:1.3 },
  printRow:{ display:'flex', alignItems:'center', padding:'8px 0', borderBottom:'1px solid var(--mat-sys-outline-variant)', fontSize:14, color:'color-mix(in srgb, var(--mat-sys-on-surface) 78%, transparent)', cursor:'pointer' },
};

Object.assign(window, {
  ModalShell, AllergiesAddModal, AllergiesListModal, VitalsAddModal,
  MedsModal, HabitsModal, ProblemsModal, FamilyModal, ImmunModal, TasksModal, PrintModal,
});
