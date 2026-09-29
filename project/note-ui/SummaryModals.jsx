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
          placeholder={placeholder||'Rechercher…'} />
        {noneBtn && (
          <button style={smS.noneBtn} title="Ajouter la mention Aucun" onClick={function(){ noneBtn(); }}>
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
var ALLERGY_SUGG = ['Pénicilline','Amoxicilline','Aspirine','Ibuprofène','Codéine','Latex','Arachides','Noix','Fruits de mer','Sulfamides'];

function AllergiesAddModal({ onClose, onAdd }) {
  var [query, setQuery] = React.useState('');
  var [type, setType] = React.useState('allergie');
  var [date, setDate] = React.useState('');
  var [notes, setNotes] = React.useState('');
  return (
    <ModalShell title="Ajouter une allergie ou intolérance" onClose={onClose}>
      <MField label="Rechercher un terme…">
        <SearchBox value={query} onChange={setQuery} placeholder="Rechercher un terme…" suggestions={ALLERGY_SUGG} onSelect={setQuery}
          noneBtn={function(){ onAdd({ name:'Aucune allergie connue', type:'none', muted:true }); onClose(); }} />
        <div style={smS.helpText}>Source : Vigilance Santé — pas de saisie texte libre</div>
      </MField>
      <div style={smS.row2}>
        <MField label="Type">
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
        <MField label="Date de début"><MDate value={date} onChange={setDate} /></MField>
      </div>
      <MField label="Informations additionnelles"><MTextarea value={notes} onChange={setNotes} rows={2} /></MField>
      <MFooter>
        <GhostBtn onClick={onClose}>Annuler</GhostBtn>
        <PrimaryBtn disabled={!query} onClick={function(){ onAdd({ name:query, type, date, notes }); onClose(); }}>
          Ajouter cette allergie
        </PrimaryBtn>
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
          ? <EmptyMsg>Aucun élément</EmptyMsg>
          : rows.map(function(r,i){
              return (
                <div key={i} style={smS.listRow}>
                  <div style={{ flex:1 }}>
                    <div style={smS.listName}>{r.name}</div>
                    {r.notes && <div style={smS.listSub}>{r.notes}</div>}
                    {r.date && <div style={smS.listMeta}>Depuis {r.date}</div>}
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
    <ModalShell title="Allergies et intolérances" onClose={onClose} width={520}>
      <ListSection sTitle="Allergies" rows={allergies} />
      <ListSection sTitle="Intolérances" rows={intol} />
      <MFooter><GhostBtn onClick={onClose}>Fermer</GhostBtn></MFooter>
    </ModalShell>
  );
}

// ── Signes vitaux ─────────────────────────────────────────────────────────────
function VitalsAddModal({ onClose, onAdd }) {
  var [unit, setUnit] = React.useState('Métrique');
  var [obsDate, setObsDate] = React.useState('2026/06/08');
  var [obsTime, setObsTime] = React.useState('');
  var [temp, setTemp] = React.useState('');
  var [tempSite, setTempSite] = React.useState('Oral');
  var [pressure, setPressure] = React.useState('');
  var [pressureSite, setPressureSite] = React.useState('Assis / bras droit');
  var [hr, setHr] = React.useState('');
  var [hrType, setHrType] = React.useState('Régulier');
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
    return <input style={vStyles.vInput} value={value} onChange={function(e){ onChange(e.target.value); }} placeholder="Sans mesure" />;
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
    <ModalShell title="Ajouter une observation de signes vitaux" onClose={onClose} width={640}>
      {/* System + date */}
      <VRow label="Système de mesure :">
        <VSelect value={unit} onChange={setUnit} options={['Métrique','Impérial']} />
      </VRow>
      <VRow label="Date d'observation :">
        <div style={{ ...smS.searchBox, width:160, gap:6 }}>
          <input style={smS.searchInner} value={obsDate} onChange={function(e){ setObsDate(e.target.value); }} />
          <span className="material-icons-outlined" style={{ fontSize:18, color:'color-mix(in srgb, var(--mat-sys-on-surface) 45%, transparent)' }}>calendar_today</span>
        </div>
        <input style={{ ...vStyles.vInput, width:80, marginLeft:8 }} value={obsTime} onChange={function(e){ setObsTime(e.target.value); }} placeholder="hh:mm" />
      </VRow>

      {/* Measured indicators */}
      <div style={vStyles.sectionHead}>Indicateurs mesurés</div>
      <div style={vStyles.sectionBody}>
        <VRow label="Température :">
          <VInput value={temp} onChange={setTemp} /><VUnit>°C</VUnit>
          <VSelect value={tempSite} onChange={setTempSite} options={['Oral','Axillaire','Rectal','Tympanique']} />
        </VRow>
        <VRow label="Pression :">
          <VInput value={pressure} onChange={setPressure} /><VUnit>mmHg</VUnit>
          <VSelect value={pressureSite} onChange={setPressureSite} options={['Assis / bras droit','Assis / bras gauche','Couché / bras droit','Debout']} />
        </VRow>
        <VRow label="Fréq. cardiaque :">
          <VInput value={hr} onChange={setHr} /><VUnit>bpm</VUnit>
          <VSelect value={hrType} onChange={setHrType} options={['Régulier','Irrégulier']} />
        </VRow>
        <VRow label="Fréq. respiratoire :">
          <VInput value={rr} onChange={setRr} /><VUnit>cpm</VUnit>
        </VRow>
        <VRow label="SpO₂ / Débit O₂ :">
          <VInput value={spo2} onChange={setSpo2} /><VUnit>%</VUnit>
          <input style={{ ...vStyles.vInput, width:80, marginLeft:8 }} value={o2flow} onChange={function(e){ setO2flow(e.target.value); }} placeholder="" />
          <VUnit>L/min</VUnit>
        </VRow>
        <VRow label="Taille :">
          <VInput value={height} onChange={setHeight} /><VUnit>m</VUnit>
        </VRow>
        <VRow label="Poids :">
          <VInput value={weight} onChange={setWeight} /><VUnit>kg</VUnit>
        </VRow>
        <VRow label="Tour de taille :">
          <VInput value={waist} onChange={setWaist} /><VUnit>cm</VUnit>
        </VRow>
        <VRow label="Périmètre crânien :">
          <VInput value={head} onChange={setHead} /><VUnit>cm</VUnit>
        </VRow>
        <VRow label="Glycémie :">
          <VInput value={glycemia} onChange={setGlycemia} /><VUnit>mmol/L</VUnit>
        </VRow>
      </div>

      {/* Calculated indicators */}
      <div style={vStyles.sectionHead}>Indicateurs calculés</div>
      <div style={vStyles.sectionBody}>
        <VRow label="IMC :">
          <span className="material-icons" style={{ fontSize:20, color:'var(--mat-sys-primary)', marginRight:8 }}>info</span>
          {bmi && <span style={{ fontSize:14, fontWeight:700, color:'var(--mat-sys-on-surface)' }}>{bmi}</span>}
        </VRow>
        <VRow label="Surface corporelle :">
          <span className="material-icons" style={{ fontSize:20, color:'var(--mat-sys-primary)', marginRight:8 }}>info</span>
          {bsa && <span style={{ fontSize:14, fontWeight:700, color:'var(--mat-sys-on-surface)', marginRight:6 }}>{bsa}</span>}
          <VUnit>m²</VUnit>
        </VRow>
      </div>

      <MFooter>
        <GhostBtn onClick={onClose}>Annuler</GhostBtn>
        <PrimaryBtn onClick={function(){ onAdd({ height, weight, pressure, hr, temp, bmi, bsa }); onClose(); }}>
          AJOUTER CETTE OBSERVATION
        </PrimaryBtn>
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

// ── Médicaments ───────────────────────────────────────────────────────────────
var MEDS_STATUS_COLOR = { active:'#1b8a3f', echue:'#c07a00', cessée:'#c62828', texte:'var(--mat-sys-primary)' };
var MEDS_TABS = [{ id:'profil',label:'Profil' },{ id:'renouvelables',label:'Renouvelables' },{ id:'ordonnance',label:'Ordonnance' },{ id:'archive',label:'Archive' }];

function MedsModal({ items, onClose }) {
  var [tab, setTab] = React.useState('profil');
  var [showPrefs, setShowPrefs] = React.useState(false);
  var [query, setQuery] = React.useState('');
  var [mode, setMode] = React.useState('prescrire');
  if (showPrefs) return <MedsPrefsModal onClose={function(){ setShowPrefs(false); }} />;
  return (
    <ModalShell title="Médicaments" onClose={onClose} width={620}>
      <div style={{ display:'flex', alignItems:'center', marginBottom:2 }}>
        <MTabs tabs={MEDS_TABS} active={tab} onChange={setTab} />
        <button style={smS.dotsBtn} onClick={function(){ setShowPrefs(true); }}>
          <span className="material-icons">more_vert</span>
        </button>
      </div>
      {tab === 'profil' && (
        <>
          <div style={smS.vitalsBar}>
            <span>Créatinine : <b>72 µmol/L</b></span>
            <span>DFGe : <b>89 mL/min</b></span>
            <span>Poids : <b>62 kg</b></span>
          </div>
          {items.length === 0 && <EmptyMsg>Aucune médication</EmptyMsg>}
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
                return <button key={m} style={{ ...smS.modeBtn, ...(mode===m?smS.modeBtnOn:{}) }} onClick={function(){ setMode(m); }}>{m==='prescrire'?'Prescrire':'Inscrire une médication'}</button>;
              })}
            </div>
            <SearchBox value={query} onChange={setQuery} placeholder="Rechercher un médicament…" suggestions={['Metformine','Ramipril','Atorvastatine','Lévothyroxine','Pantoprazole']} onSelect={setQuery} />
          </div>
        </>
      )}
      {tab !== 'profil' && <EmptyMsg>Aucun élément dans cet onglet</EmptyMsg>}
      <MFooter><GhostBtn onClick={onClose}>Fermer</GhostBtn></MFooter>
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
    <ModalShell title="Préférences — Médicaments" onClose={onClose} width={520}>
      <div style={smS.prefSection}>Préférences de prescription</div>
      <PrefToggle label="Affichage en dose visée" value={doseVisee} onChange={setDoseVisee} />
      <PrefToggle label="Envoi des ordonnances au DSQ" value={dsq} onChange={setDsq} />
      <PrefToggle label="Modification du poids dans le calculateur de dose" value={modifPoids} onChange={setModifPoids} />
      <div style={smS.row2}>
        <MField label="Renouvellements par défaut"><MInput value={renCount} onChange={setRenCount} /></MField>
        <MField label="Durée (jours)"><MInput value={renDuree} onChange={setRenDuree} /></MField>
      </div>
      <div style={smS.prefSection}>Préférences d'impression</div>
      <MField label="Format">
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
      <PrefToggle label="Pharmacie" value={pharma} onChange={setPharma} />
      <PrefToggle label="Mensurations du patient" value={mensur} onChange={setMensur} />
      <PrefToggle label="Raison de cessation" value={cessation} onChange={setCessation} />
      <PrefToggle label="Signature électronique" value={sig} onChange={setSig} />
      <MFooter>
        <GhostBtn onClick={onClose}>Annuler</GhostBtn>
        <PrimaryBtn onClick={onClose}>Sauvegarder</PrimaryBtn>
      </MFooter>
    </ModalShell>
  );
}

// ── Habitudes de vie ──────────────────────────────────────────────────────────
var HABITS_CATS = ['Alcool','Tabac','Drogue','Alimentation','Activité physique','Sommeil','Emploi','Autre'];
var HABITS_FREQS = ['Aucun','Régulier','Occasionnel','Abus','Cessé'];

function HabitsModal({ items, onClose, onAdd }) {
  var [view, setView] = React.useState('list');
  var [cat, setCat] = React.useState('');
  var [freq, setFreq] = React.useState('Régulier');
  var [desc, setDesc] = React.useState('');
  var [debut, setDebut] = React.useState('');
  var [fin, setFin] = React.useState('');
  var CAT_ICON = { Tabac:'smoking_rooms', Alcool:'local_bar', Drogue:'medication', Alimentation:'restaurant', 'Activité physique':'fitness_center', Sommeil:'bedtime', Emploi:'work', Autre:'more_horiz' };
  if (view === 'add') return (
    <ModalShell title="Ajouter une habitude de vie" onClose={onClose} width={500}>
      <MField label="Catégorie *">
        <select style={smS.input} value={cat} onChange={function(e){ setCat(e.target.value); }}>
          <option value="">Sélectionner…</option>
          {HABITS_CATS.map(function(c){ return <option key={c} value={c}>{c}</option>; })}
        </select>
      </MField>
      <MField label="Fréquence">
        <select style={smS.input} value={freq} onChange={function(e){ setFreq(e.target.value); }}>
          {HABITS_FREQS.map(function(f){ return <option key={f} value={f}>{f}</option>; })}
        </select>
      </MField>
      <MField label="Description (optionnel)"><MTextarea value={desc} onChange={setDesc} rows={2} /></MField>
      <div style={smS.row2}>
        <MField label="Début (optionnel)"><MDate value={debut} onChange={setDebut} /></MField>
        <MField label="Fin (optionnel)"><MDate value={fin} onChange={setFin} /></MField>
      </div>
      <MFooter>
        <GhostBtn onClick={function(){ setView('list'); }}>Retour</GhostBtn>
        <PrimaryBtn disabled={!cat} onClick={function(){ onAdd({ name:cat, detail:freq+(desc?' — '+desc:'') }); setView('list'); }}>Sauvegarder</PrimaryBtn>
      </MFooter>
    </ModalShell>
  );
  return (
    <ModalShell title="Habitudes de vie et contexte social" onClose={onClose} width={520}>
      {items.length === 0 && <EmptyMsg>Aucune saisie d'habitude de vie ou de contexte social</EmptyMsg>}
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
        <GhostBtn onClick={onClose}>Fermer</GhostBtn>
        <PrimaryBtn onClick={function(){ setView('add'); }}>
          <span className="material-icons" style={{ fontSize:16, marginRight:5 }}>add</span>Ajout par catégorie
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
          Trier la liste des {title.toLowerCase()}
        </button>
        {sortMode && <span style={{ fontSize:12, color:'var(--mat-sys-primary)', marginLeft:10 }}>Mode tri actif</span>}
      </div>
      {list.length === 0 && <EmptyMsg>Aucun élément</EmptyMsg>}
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
          <MField label="Ajouter"><MInput value={query} onChange={setQuery} placeholder="Rechercher…" /></MField>
          <MField label="Date"><MDate value={date} onChange={setDate} /></MField>
        </div>
      </div>
      <MFooter>
        <GhostBtn onClick={onClose}>Fermer</GhostBtn>
        <PrimaryBtn disabled={!query} onClick={function(){ onAdd({ left:query, name:query, right:date }); setQuery(''); setDate(''); }}>Ajouter</PrimaryBtn>
      </MFooter>
    </ModalShell>
  );
}

// ── Antécédents familiaux ─────────────────────────────────────────────────────
var FAM_RELATIONS = ['Père','Mère','Frère','Sœur','Grand-père paternel','Grand-mère paternelle','Grand-père maternel','Grand-mère maternelle'];

function FamilyModal({ items, onClose, onAdd }) {
  var [showAdd, setShowAdd] = React.useState(false);
  var [relation, setRelation] = React.useState('');
  var [condition, setCondition] = React.useState('');
  return (
    <ModalShell title="Antécédents familiaux" onClose={onClose} width={520}>
      {items.length === 0 && !showAdd && <EmptyMsg>Aucun antécédent familial</EmptyMsg>}
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
          <MField label="Type de relation *">
            <select style={smS.input} value={relation} onChange={function(e){ setRelation(e.target.value); }}>
              <option value="">Sélectionner…</option>
              {FAM_RELATIONS.map(function(r){ return <option key={r} value={r}>{r}</option>; })}
            </select>
          </MField>
          <MField label="Condition médicale *"><MInput value={condition} onChange={setCondition} placeholder="Ex : Diabète de type 2" /></MField>
          <MFooter>
            <GhostBtn onClick={function(){ setShowAdd(false); }}>Annuler</GhostBtn>
            <PrimaryBtn disabled={!relation||!condition} onClick={function(){ onAdd({ left:condition, name:condition, mid:relation }); setShowAdd(false); }}>Ajouter</PrimaryBtn>
          </MFooter>
        </div>
      )}
      {!showAdd && (
        <MFooter>
          <GhostBtn onClick={onClose}>Fermer</GhostBtn>
          <PrimaryBtn onClick={function(){ setShowAdd(true); }}>
            <span className="material-icons" style={{ fontSize:16, marginRight:5 }}>add</span>Ajouter
          </PrimaryBtn>
        </MFooter>
      )}
    </ModalShell>
  );
}

// ── Immunisations ─────────────────────────────────────────────────────────────
var VACCINE_SUGG = ['HPV (Gardasil)','dCaT (Tétanos-diphtérie)','Influenza','COVID-19','RRO','Varicelle','Hépatite B','Méningocoque'];

function ImmunModal({ items, onClose, onAdd }) {
  var [query, setQuery] = React.useState('');
  var [date, setDate] = React.useState('');
  var [lot, setLot] = React.useState('');
  return (
    <ModalShell title="Immunisations et vaccins" onClose={onClose} width={520}>
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
        <MField label="Rechercher un vaccin">
          <SearchBox value={query} onChange={setQuery} placeholder="Rechercher un vaccin…" suggestions={VACCINE_SUGG} onSelect={setQuery}
            noneBtn={function(){ onAdd({ left:'Aucun vaccin connu', right:'' }); }} />
        </MField>
        <div style={smS.row2}>
          <MField label="Date de vaccination"><MDate value={date} onChange={setDate} /></MField>
          <MField label="Numéro de lot (optionnel)"><MInput value={lot} onChange={setLot} /></MField>
        </div>
      </div>
      <MFooter>
        <GhostBtn onClick={onClose}>Fermer</GhostBtn>
        <PrimaryBtn disabled={!query} onClick={function(){ onAdd({ left:query, right:date||''+new Date().getFullYear() }); setQuery(''); setDate(''); }}>Ajouter ce vaccin</PrimaryBtn>
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
    <ModalShell title="Ajouter une tâche" onClose={onClose} width={620}>
      <div style={{ marginBottom:14 }}>
        <button style={{ background:'none', border:0, padding:0, cursor:'pointer', color:'var(--mat-sys-primary)', fontSize:14, fontWeight:600 }}>
          Sélectionner une tâche rapide…
        </button>
      </div>

      {/* Title + Date row */}
      <div style={{ display:'flex', gap:10, marginBottom:12 }}>
        <input
          style={{ ...smS.input, flex:1 }}
          value={title}
          onChange={function(e){ setTitle(e.target.value); }}
          placeholder="Titre"
        />
        <div style={{ ...smS.searchBox, width:180, gap:6 }}>
          <input
            style={{ ...smS.searchInner, width:'100%' }}
            value={date}
            onChange={function(e){ setDate(e.target.value); }}
            placeholder="AAAA/MM/JJ"
          />
          <span className="material-icons-outlined" style={{ fontSize:20, color:'color-mix(in srgb, var(--mat-sys-on-surface) 50%, transparent)', cursor:'pointer' }}>calendar_today</span>
        </div>
      </div>

      {/* Description */}
      <textarea
        style={{ ...smS.input, resize:'vertical', height:110, marginBottom:16 }}
        value={desc}
        onChange={function(e){ setDesc(e.target.value); }}
        placeholder="Description"
      />

      {/* Meta fields */}
      {[
        { label:'Institution :', ctrl: <select style={smS.input} value={institution} onChange={function(e){ setInstitution(e.target.value); }}><option>CLINIQUE DU CENTRE-VILLE</option><option>CENTRE DE SANTÉ INTÉGRALE</option></select> },
        { label:'Assigner à :', ctrl: <input style={smS.input} value={assignTo} onChange={function(e){ setAssignTo(e.target.value); }} placeholder="Prénom, nom, identifiant…" /> },
        { label:'File de tâches :', ctrl: <input style={smS.input} value={queue} onChange={function(e){ setQueue(e.target.value); }} placeholder="Titre de la file de tâches…" /> },
        { label:'État :', ctrl: <select style={{ ...smS.input, width:'auto' }} value={state} onChange={function(e){ setState(e.target.value); }}><option>Nouveau</option><option>En cours</option><option>Terminé</option></select> },
        { label:'Priorité :', ctrl: <select style={{ ...smS.input, width:'auto' }} value={priority} onChange={function(e){ setPriority(e.target.value); }}><option>Normal</option><option>Urgent</option><option>Faible</option></select> },
      ].map(function(row) {
        return (
          <div key={row.label} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
            <span style={{ fontSize:14, color:'color-mix(in srgb, var(--mat-sys-on-surface) 70%, transparent)', width:130, flexShrink:0 }}>{row.label}</span>
            <div style={{ flex:1 }}>{row.ctrl}</div>
          </div>
        );
      })}

      <MFooter>
        <GhostBtn onClick={onClose}>Annuler</GhostBtn>
        <PrimaryBtn disabled={!title} onClick={function(){ onAdd({ name:title, left:title, right:date, desc, state, priority }); setTitle(''); onClose(); }}>
          AJOUTER LA TÂCHE
        </PrimaryBtn>
      </MFooter>
    </ModalShell>
  );
}

// ── Programmes de suivi ───────────────────────────────────────────────────────
var PROGRAMS_LIST = ['Diabète','Hypertension','Grossesse','Insuffisance cardiaque','MPOC','Santé mentale','Anticoagulothérapie','Maladies rénales chroniques'];

function ProgramsModal({ items, onClose, onAdd }) {
  var [date, setDate] = React.useState('2026/06/08');
  var [program, setProgram] = React.useState('');

  return (
    <ModalShell title="Inscription à un suivi" onClose={onClose} width={520}>
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
        <div style={{ fontSize:14, color:'color-mix(in srgb, var(--mat-sys-on-surface) 72%, transparent)', marginBottom:8 }}>Quelle est la date d'inscription ?</div>
        <div style={{ ...smS.searchBox, width:200, marginBottom:16 }}>
          <input style={{ ...smS.searchInner }} value={date} onChange={function(e){ setDate(e.target.value); }} />
          <span className="material-icons-outlined" style={{ fontSize:18, color:'color-mix(in srgb, var(--mat-sys-on-surface) 45%, transparent)' }}>calendar_today</span>
        </div>

        <div style={{ fontSize:14, color:'color-mix(in srgb, var(--mat-sys-on-surface) 72%, transparent)', marginBottom:8 }}>Créer l'inscription dans quel programme ?</div>
        <select style={{ ...smS.input, width:'auto', minWidth:240 }} value={program} onChange={function(e){ setProgram(e.target.value); }}>
          <option value="">Choisir un programme…</option>
          {PROGRAMS_LIST.map(function(p){ return <option key={p} value={p}>{p}</option>; })}
        </select>
      </div>

      <MFooter>
        <GhostBtn onClick={onClose}>Annuler</GhostBtn>
        <PrimaryBtn disabled={!program} onClick={function(){ onAdd({ name:program, left:program, right:date }); onClose(); }}>
          INSCRIRE LE PATIENT
        </PrimaryBtn>
      </MFooter>
    </ModalShell>
  );
}

window.ProgramsModal = ProgramsModal;

// ── Résultats ─────────────────────────────────────────────────────────────────
var RESULT_SUGG = [
  // Hématologie
  'FSC — hémoglobine','FSC — hématocrite','FSC — leucocytes','FSC — plaquettes',
  'VGM','INR / RNI','TCA','Ferritine','Fer sérique','Saturation de la transferrine',
  'Vitamine B12','Folates (acide folique)',
  // Biochimie / ions
  'Sodium','Potassium','Chlore','Bicarbonates','Glucose à jeun','Créatinine',
  'DFGe (eGFR)','Urée','Calcium','Phosphore','Magnésium','Albumine','Protéines totales',
  // Profil lipidique
  'Cholestérol total','LDL','HDL','Triglycérides','Rapport cholestérol/HDL','Non-HDL',
  // Glycémie / diabète
  'HbA1c (hémoglobine glyquée)','Glycémie à jeun','Glycémie aléatoire',
  // Fonction hépatique
  'ALT','AST','GGT','Phosphatase alcaline','Bilirubine totale','Bilirubine conjuguée',
  // Thyroïde
  'TSH','T4 libre','T3 libre',
  // Rénal / urinaire
  'Analyse d\'urine (SMU)','Microalbuminurie','Rapport albumine/créatinine urinaire','Culture d\'urine',
  // Vitamines / endocrinien
  'Vitamine D (25-OH)','PTH','Cortisol','Testostérone',
  // Marqueurs / dépistage
  'APS (PSA)','CRP','CRP haute sensibilité','hCG','HBsAg','Sérologie VIH','Sérologie hépatite B','Sérologie hépatite C',
];

function ResultsModal({ items, onClose, onAdd }) {
  var [test, setTest] = React.useState('');
  var [result, setResult] = React.useState('');
  var [normality, setNormality] = React.useState('');
  var [sampDate, setSampDate] = React.useState('');
  var [showDrop, setShowDrop] = React.useState(false);
  var filtered = RESULT_SUGG.filter(function(s){ return s.toLowerCase().includes(test.toLowerCase()) && test.length > 0; });
  return (
    <ModalShell title="Insérer un nouveau résultat" onClose={onClose} width={640}>
      {items.length > 0 && (
        <div style={{ marginBottom:16 }}>
          {items.map(function(it,i){
            return (
              <div key={i} style={smS.listRow}>
                <div style={{ flex:1 }}>
                  <span style={smS.listName}>{it.name||it.left}</span>
                  {it.result && <span style={{ ...smS.listSub, marginLeft:8 }}>{it.result}</span>}
                  {it.normality && <span style={{ marginLeft:8, fontSize:12, fontWeight:600, color: it.normality==='Normal'?'light-dark(#1b8a3f, #a5e9bb)':it.normality==='Anormal'?'light-dark(#c62828, #e9a5a5)':'light-dark(#c07a00, #e9d0a5)' }}>{it.normality}</span>}
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
            placeholder="Nom du test…"
          />
          {showDrop && filtered.length > 0 && (
            <div style={smS.dropList}>
              {filtered.map(function(s){
                return <div key={s} style={smS.dropItem} onMouseDown={function(){ setTest(s); setShowDrop(false); }}>{s}</div>;
              })}
            </div>
          )}
        </div>
        <input style={{ ...smS.input, flex:1, minWidth:90 }} value={result} onChange={function(e){ setResult(e.target.value); }} placeholder="Résultat" />
        <select style={{ ...smS.input, flex:1, minWidth:110 }} value={normality} onChange={function(e){ setNormality(e.target.value); }}>
          <option value="">Normalité</option>
          <option>Normal</option>
          <option>Anormal</option>
          <option>Limite</option>
        </select>
        <div style={{ ...smS.searchBox, flex:1, minWidth:150 }}>
          <input style={smS.searchInner} value={sampDate} onChange={function(e){ setSampDate(e.target.value); }} placeholder="Date de prélèvement" />
          <span className="material-icons-outlined" style={{ fontSize:18, color:'color-mix(in srgb, var(--mat-sys-on-surface) 45%, transparent)' }}>calendar_today</span>
        </div>
      </div>
      <MFooter>
        <GhostBtn onClick={onClose}>Annuler</GhostBtn>
        <PrimaryBtn disabled={!test} onClick={function(){ onAdd({ name:test, left:test, result, normality, right:sampDate }); onClose(); }}>
          AJOUTER LE RÉSULTAT
        </PrimaryBtn>
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
    <ModalShell title="Imprimer le sommaire" onClose={onClose} width={400}>
      <div style={{ marginBottom:12 }}>
        <button style={smS.ghostBtn} onClick={function(){ setChecked([]); }}>Désélectionner tout</button>
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
        <GhostBtn onClick={onClose}>Annuler</GhostBtn>
        <PrimaryBtn onClick={onClose}>
          <span className="material-icons" style={{ fontSize:16, marginRight:5 }}>print</span>Imprimer
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
