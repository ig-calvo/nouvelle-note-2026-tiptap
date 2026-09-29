/* global React, useStore, Sheet, DlgHead, Seg, Star, toast, MED_CATALOG, MED_FAVS, fmtDate, dotColor */
// =========================================================
// Medications.jsx — Prescripteur drawer + Prescrire modal
// =========================================================
const MED_TABS = [
  { id: "profil", label: "Profil" },
  { id: "renouv", label: "Renouvelables" },
  { id: "ordo", label: "Ordonnance" },
  { id: "archive", label: "Archive" }
];

function Prescripteur({ onClose, onPrescribe }) {
  const { state, update } = useStore();
  const [tab, setTab] = React.useState("profil");
  const [sel, setSel] = React.useState([]);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [prefs, setPrefs] = React.useState({ showCessee: true, groupClass: false });

  const toggleStar = (id) => update((s) => {
    const m = s.meds.find((x) => x.id === id); if (m) m.starred = !m.starred; return s;
  });
  const toggleSel = (id) => setSel((x) => x.includes(id) ? x.filter((i) => i !== id) : [...x, id]);
  const clearSel = () => setSel([]);

  const bulkCesser = () => {
    update((s) => { s.meds.forEach((m) => { if (sel.includes(m.id)) m.status = "cessee"; }); return s; });
    toast(`${sel.length} médicament(s) cessé(s)`); clearSel();
  };
  const bulkArchiver = () => {
    update((s) => { s.meds.forEach((m) => { if (sel.includes(m.id)) m.status = "archive"; }); return s; });
    toast(`${sel.length} médicament(s) archivé(s)`); clearSel();
  };
  const renew = (id) => {
    update((s) => { const m = s.meds.find((x) => x.id === id); if (m) { m.status = "active"; m.since = window.todayISO(); } return s; });
    toast("Médicament renouvelé");
  };
  const removeOrdo = (i) => update((s) => { s.ordonnance = (s.ordonnance || []).filter((_, k) => k !== i); return s; });
  const signOrdo = () => {
    update((s) => {
      (s.ordonnance || []).forEach((o) => s.meds.push({ id: "m" + Date.now() + Math.random().toString(36).slice(2, 5), name: o.name, dose: o.dose, sig: o.sig, status: "active", starred: false, since: window.todayISO(), presc: "Dr Tremblay (vous)" }));
      s.ordonnance = [];
      return s;
    });
    toast("Ordonnance complétée et ajoutée au profil", { icon: "task_alt" });
  };

  const profile = state.meds.filter((m) => m.status !== "archive" && (prefs.showCessee || m.status !== "cessee"));
  const renouv = state.meds.filter((m) => m.status === "active" || m.status === "echue");
  const archive = state.meds.filter((m) => m.status === "archive" || m.status === "cessee");
  const ordo = state.ordonnance || [];

  const Legend = () => (
    <div className="legend">
      <span className="lg-item"><span className="dot active" />Active</span>
      <span className="lg-item"><span className="dot echue" />Échue</span>
      <span className="lg-item"><span className="dot cessee" />Cessée</span>
      <span className="lg-item"><span className="dot texte" />Prescription texte</span>
    </div>);

  const MedItem = ({ m, mode }) => (
    <div className={"med-li" + (sel.includes(m.id) ? " sel" : "")} onClick={() => mode === "profil" && toggleSel(m.id)}>
      <span className="med-dot-lg" style={{ background: dotColor(m.status) }} title="Sélectionner"
        onClick={(e) => { e.stopPropagation(); toggleSel(m.id); }} />
      <div className="med-main">
        <div className="med-name">{m.name}{m.dose ? " " + m.dose : ""}</div>
        <div className="med-sig">{m.sig}</div>
        <div className="med-meta">Depuis {fmtDate(m.since)} · {m.presc}</div>
      </div>
      {mode === "renouv" &&
        <button className="btn btn-outline btn-sm" onClick={(e) => { e.stopPropagation(); renew(m.id); }}>
          <span className="material-icons-outlined">autorenew</span>Renouveler
        </button>}
      {mode === "profil" &&
        <Star on={m.starred} onClick={() => toggleStar(m.id)} />}
    </div>);

  return (
    <Sheet kind="drawer" onClose={onClose}>
      {(close) => (
        <>
          <DlgHead icon="medication" overline="Médicaments" title="Prescripteur" onClose={close}
            actions={
              <div style={{ position: "relative" }}>
                <button className="icon-btn" title="Options" onClick={() => setMenuOpen((o) => !o)}>
                  <span className="material-icons-outlined">more_vert</span>
                </button>
                {menuOpen &&
                  <div style={menuStyle} onMouseLeave={() => setMenuOpen(false)}>
                    <div style={menuTitle}>Préférences</div>
                    <label style={menuRow}>
                      <input type="checkbox" checked={prefs.showCessee} onChange={(e) => setPrefs((p) => ({ ...p, showCessee: e.target.checked }))} />
                      Afficher les médicaments cessés
                    </label>
                    <label style={menuRow}>
                      <input type="checkbox" checked={prefs.groupClass} onChange={(e) => setPrefs((p) => ({ ...p, groupClass: e.target.checked }))} />
                      Regrouper par classe
                    </label>
                  </div>}
              </div>}
          />

          <div className="head-stats">
            <div className="hs"><span className="hs-k">Créatinine</span><span className="hs-v">82 µmol/L</span></div>
            <div className="hs"><span className="hs-k">DFGe</span><span className="hs-v">88 mL/min</span></div>
            <div className="hs"><span className="hs-k">Poids</span><span className="hs-v">78 kg</span></div>
            <div className="hs" style={{ marginLeft: "auto", justifyContent: "center" }}>
              <button className="btn btn-primary btn-sm" onClick={() => onPrescribe()}>
                <span className="material-icons-outlined">add</span>Prescrire / Inscrire
              </button>
            </div>
          </div>

          <div className="tabs">
            {MED_TABS.map((t) =>
              <button key={t.id} className={"tab" + (tab === t.id ? " active" : "")} onClick={() => { setTab(t.id); clearSel(); }}>
                {t.label}
                {t.id === "renouv" && renouv.filter((m) => m.status === "echue").length > 0 &&
                  <span className="tab-badge">{renouv.filter((m) => m.status === "echue").length}</span>}
                {t.id === "ordo" && ordo.length > 0 && <span className="tab-badge" style={{ background: "var(--mat-sys-primary)" }}>{ordo.length}</span>}
              </button>)}
          </div>

          <div className="dlg-body">
            {tab === "profil" && <>
              <Legend />
              {sel.length > 0 &&
                <div className="bulk-bar">
                  <span className="bb-count">{sel.length}</span> sélectionné(s)
                  <span className="foot-spacer" />
                  <button className="btn btn-outline btn-sm" onClick={bulkCesser}><span className="material-icons-outlined">block</span>Cesser</button>
                  <button className="btn btn-outline btn-sm" onClick={bulkArchiver}><span className="material-icons-outlined">inventory_2</span>Archiver</button>
                  <button className="btn btn-ghost btn-sm" onClick={clearSel}>Annuler</button>
                </div>}
              <div className="hint-note" style={{ marginBottom: 10 }}>
                <span className="material-icons-outlined">info</span>
                Cliquez sur une pastille de couleur pour sélectionner plusieurs médicaments, puis appliquez une action groupée. L'étoile met le médicament au sommaire.
              </div>
              {profile.map((m) => <MedItem key={m.id} m={m} mode="profil" />)}
            </>}

            {tab === "renouv" && <>
              <div className="section-label">Médicaments renouvelables<span className="sl-count">· {renouv.length}</span></div>
              {renouv.map((m) => <MedItem key={m.id} m={m} mode="renouv" />)}
              {renouv.length === 0 && <div className="empty-state"><span className="material-icons-outlined">autorenew</span>Rien à renouveler.</div>}
            </>}

            {tab === "ordo" && <>
              <div className="section-label">Ordonnance en cours<span className="sl-count">· {ordo.length}</span></div>
              {ordo.length === 0 &&
                <div className="empty-state"><span className="material-icons-outlined">receipt_long</span>Aucun médicament dans l'ordonnance.<br />Utilisez « Prescrire / Inscrire » pour en ajouter.</div>}
              {ordo.map((o, i) =>
                <div key={i} className="list-li">
                  <span className="med-dot-lg" style={{ background: dotColor(o.mode === "inscrire" ? "texte" : "active") }} />
                  <div className="ll-main">
                    <div className="ll-title">{o.name}{o.dose ? " " + o.dose : ""}</div>
                    <div className="ll-sub">{o.sig}{o.instructions ? " · " + o.instructions : ""} · {o.mode === "inscrire" ? "Inscription (sans prescrire)" : "Prescription"}</div>
                  </div>
                  <button className="icon-btn" title="Retirer" onClick={() => removeOrdo(i)}><span className="material-icons-outlined" style={{ color: "light-dark(#b00020, #e9a5b1)" }}>delete_outline</span></button>
                </div>)}
              {ordo.length > 0 &&
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
                  <button className="btn btn-primary" onClick={signOrdo}><span className="material-icons-outlined">task_alt</span>Compléter l'ordonnance</button>
                </div>}
            </>}

            {tab === "archive" && <>
              <div className="section-label">Médicaments archivés / cessés<span className="sl-count">· {archive.length}</span></div>
              {archive.map((m) =>
                <div key={m.id} className="list-li">
                  <span className="med-dot-lg" style={{ background: dotColor(m.status) }} />
                  <div className="ll-main">
                    <div className="ll-title" style={{ color: "color-mix(in srgb, var(--mat-sys-on-surface) 50%, transparent)" }}>{m.name}{m.dose ? " " + m.dose : ""}</div>
                    <div className="ll-sub">{m.sig} · {m.status === "archive" ? "Archivé" : "Cessé"}</div>
                  </div>
                  <button className="btn btn-outline btn-sm" onClick={() => renew(m.id)}><span className="material-icons-outlined">restart_alt</span>Réactiver</button>
                </div>)}
              {archive.length === 0 && <div className="empty-state"><span className="material-icons-outlined">inventory_2</span>Archive vide.</div>}
            </>}
          </div>
        </>)}
    </Sheet>);
}

function Prescrire({ onClose }) {
  const { update } = useStore();
  const [mode, setMode] = React.useState("prescrire");
  const [q, setQ] = React.useState("");
  const [picked, setPicked] = React.useState(null);
  const [dose, setDose] = React.useState("");
  const [sig, setSig] = React.useState("");
  const [freq, setFreq] = React.useState("");
  const [duree, setDuree] = React.useState("");
  const [instr, setInstr] = React.useState("");

  const matches = q.trim() && !picked
    ? MED_CATALOG.filter((m) => m.name.toLowerCase().includes(q.toLowerCase()))
    : [];

  const pick = (m) => { setPicked(m); setQ(m.name); setDose(m.dose); setSig(m.sig); };
  const pickFav = (f) => { setPicked({ name: f.name, dose: f.dose, klass: "" }); setQ(f.name); setDose(f.dose); setSig(f.sig); };

  const canAdd = (picked || q.trim());
  const add = (close) => {
    const item = {
      name: picked ? picked.name : q.trim(), dose, sig: [sig, freq, duree].filter(Boolean).join(" "),
      instructions: instr, mode
    };
    update((s) => {
      if (mode === "inscrire") {
        s.meds.push({ id: "m" + Date.now(), name: item.name, dose, sig: item.sig || "—", status: "texte", starred: false, since: window.todayISO(), presc: "Inscrit (sans prescrire)" });
      } else {
        s.ordonnance = s.ordonnance || [];
        s.ordonnance.push(item);
      }
      return s;
    });
    toast(mode === "inscrire" ? "Médicament inscrit au profil" : "Ajouté à l'ordonnance", { icon: "medication" });
    close();
  };

  return (
    <Sheet kind="modal" onClose={onClose}>
      {(close) => (
        <>
          <DlgHead icon="medication" overline="Médicaments" title="Prescrire / Inscrire" onClose={close} />
          <div className="dlg-body">
            <div className="field">
              <Seg options={[{ value: "prescrire", label: "Prescrire" }, { value: "inscrire", label: "Inscrire sans prescrire" }]} value={mode} onChange={setMode} />
            </div>

            <div className="field">
              <label>Médicament</label>
              <div className="search-box">
                <span className="material-icons-outlined">search</span>
                <input className="input" placeholder="Rechercher un médicament…" value={q}
                  onChange={(e) => { setPicked(null); setQ(e.target.value); }} />
              </div>
              {matches.length > 0 &&
                <div className="search-results">
                  {matches.map((m) =>
                    <div key={m.name} className="search-item" onClick={() => pick(m)}>
                      <span className="material-icons-outlined">medication</span>
                      <span style={{ flex: 1 }}>{m.name} {m.dose}</span>
                      <span style={{ fontSize: 11, color: "var(--s-ink-4)" }}>{m.klass}</span>
                    </div>)}
                </div>}
            </div>

            {!picked &&
              <div className="field">
                <label>Favoris (prescriptions pré-construites)</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {MED_FAVS.map((f) =>
                    <button key={f.label} className="search-item" style={{ border: "1px solid var(--s-line)", borderRadius: 8, background: "var(--mat-sys-surface-container-lowest)", textAlign: "left", cursor: "pointer" }} onClick={() => pickFav(f)}>
                      <span className="material-icons" style={{ color: "var(--s-star)", fontSize: 17 }}>star</span>
                      <span style={{ flex: 1 }}><b>{f.name} {f.dose}</b> — {f.label}</span>
                    </button>)}
                </div>}
              </div>}

            {picked &&
              <>
                <div className="field-row">
                  <div className="field"><label>Posologie</label><input className="input" value={dose} onChange={(e) => setDose(e.target.value)} placeholder="500 mg" /></div>
                  <div className="field"><label>Fréquence</label><input className="input" value={freq} onChange={(e) => setFreq(e.target.value)} placeholder="BID, TID, DIE…" /></div>
                </div>
                <div className="field-row">
                  <div className="field"><label>Voie / posologie détaillée</label><input className="input" value={sig} onChange={(e) => setSig(e.target.value)} placeholder="1 co PO" /></div>
                  <div className="field"><label>Durée</label><input className="input" value={duree} onChange={(e) => setDuree(e.target.value)} placeholder="× 7 jours" /></div>
                </div>
                <div className="field"><label>Instructions au patient</label><textarea className="input" value={instr} onChange={(e) => setInstr(e.target.value)} placeholder="Prendre avec de la nourriture…" /></div>
              </>}
          </div>
          <div className="dlg-foot">
            <span className="foot-spacer" />
            <button className="btn btn-ghost" onClick={close}>Annuler</button>
            <button className="btn btn-primary" disabled={!canAdd} onClick={() => add(close)}>
              <span className="material-icons-outlined">{mode === "inscrire" ? "edit_note" : "add"}</span>
              {mode === "inscrire" ? "Inscrire au profil" : "Ajouter à l'ordonnance"}
            </button>
          </div>
        </>)}
    </Sheet>);
}

const menuStyle = { position: "absolute", top: 38, right: 0, background: "var(--mat-sys-surface-container-lowest)", borderRadius: 10, boxShadow: "0 8px 24px rgba(20,20,45,.22)", border: "1px solid var(--s-line)", padding: "8px 0", width: 250, zIndex: 20 };
const menuTitle = { fontFamily: "var(--font-h)", fontWeight: 600, fontSize: 12, textTransform: "uppercase", letterSpacing: ".6px", color: "var(--s-ink-3)", padding: "4px 14px 8px" };
const menuRow = { display: "flex", alignItems: "center", gap: 9, padding: "8px 14px", fontSize: 13, cursor: "pointer", color: "var(--s-ink)" };

Object.assign(window, { Prescripteur, Prescrire });
