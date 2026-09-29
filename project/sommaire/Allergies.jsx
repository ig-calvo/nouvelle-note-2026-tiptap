/* global React, useStore, Sheet, DlgHead, Seg, toast, ALLERGEN_CATALOG, fmtDate, todayISO */
// =========================================================
// Allergies.jsx — add + consult (inline edit, delete)
// =========================================================
function AllergyAdd({ onClose }) {
  const { update } = useStore();
  const [q, setQ] = React.useState("");
  const [name, setName] = React.useState("");
  const [kind, setKind] = React.useState("allergie");
  const [reaction, setReaction] = React.useState("");
  const [date, setDate] = React.useState(todayISO());
  const [info, setInfo] = React.useState("");

  const matches = q.trim()
    ? ALLERGEN_CATALOG.filter((a) => a.toLowerCase().includes(q.toLowerCase()) && a !== name)
    : [];

  const save = (close) => {
    update((s) => {
      s.noAllergy = false;
      s.allergies.push({
        id: "a" + Date.now(), name: name || q.trim(), kind, reaction,
        date, author: "Dr Tremblay (vous)", info
      });
      return s;
    });
    toast("Allergie ajoutée au dossier", { icon: "vaccines" });
    close();
  };

  const markNone = (close) => {
    update((s) => { s.noAllergy = true; s.allergies = []; return s; });
    toast("Mention « Aucune allergie / intolérance » ajoutée");
    close();
  };

  return (
    <Sheet kind="modal" onClose={onClose}>
      {(close) => (
        <>
          <DlgHead icon="add_alert" overline="Allergies" title="Ajouter une allergie" onClose={close} />
          <div className="dlg-body">
            <div className="field">
              <label>Rechercher un terme</label>
              <div className="search-box">
                <span className="material-icons-outlined">search</span>
                <input className="input" placeholder="Pénicilline, latex, arachides…"
                  value={name || q} onChange={(e) => { setName(""); setQ(e.target.value); }} />
              </div>
              {matches.length > 0 &&
                <div className="search-results">
                  {matches.map((m) =>
                    <div key={m} className="search-item" onClick={() => { setName(m); setQ(m); }}>
                      <span className="material-icons-outlined">coronavirus</span>{m}
                    </div>)}
                </div>}
            </div>

            <div className="field">
              <label>Type</label>
              <Seg options={[{ value: "allergie", label: "Allergie" }, { value: "intolerance", label: "Intolérance" }]}
                value={kind} onChange={setKind} />
            </div>

            <div className="field-row">
              <div className="field">
                <label>Réaction</label>
                <input className="input" placeholder="Urticaire, œdème…" value={reaction} onChange={(e) => setReaction(e.target.value)} />
              </div>
              <div className="field">
                <label>Date de début</label>
                <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
            </div>

            <div className="field">
              <label>Informations additionnelles</label>
              <textarea className="input" placeholder="Contexte, sévérité, source…" value={info} onChange={(e) => setInfo(e.target.value)} />
            </div>

            <button className="btn btn-outline btn-sm" onClick={() => markNone(close)}>
              <span className="material-icons-outlined">block</span>
              Ajouter « Aucune allergie / intolérance »
            </button>
          </div>
          <div className="dlg-foot">
            <span className="foot-spacer" />
            <button className="btn btn-ghost" onClick={close}>Annuler</button>
            <button className="btn btn-primary" disabled={!(name || q.trim())} onClick={() => save(close)}>
              <span className="material-icons-outlined">check</span>Ajouter cette allergie
            </button>
          </div>
        </>)}
    </Sheet>);
}

function AllergyConsult({ onClose }) {
  const { state, update } = useStore();
  const [editId, setEditId] = React.useState(null);

  const del = (id) => {
    update((s) => { s.allergies = s.allergies.filter((a) => a.id !== id); return s; });
    toast("Entrée supprimée");
  };

  const allergies = state.allergies.filter((a) => a.kind === "allergie");
  const intol = state.allergies.filter((a) => a.kind === "intolerance");

  const Section = ({ title, list, tagCls, tagTxt }) => (
    <>
      <div className="section-label">{title}<span className="sl-count">· {list.length}</span></div>
      {list.length === 0 && <div className="sbox-empty" style={{ padding: "2px 0 12px" }}>Aucune entrée.</div>}
      {list.map((a) => editId === a.id
        ? <AllergyEditRow key={a.id} entry={a} onDone={() => setEditId(null)} />
        : (
          <div key={a.id} className="list-li editable" onClick={() => setEditId(a.id)}>
            <span className={"tag " + tagCls}>{tagTxt}</span>
            <div className="ll-main">
              <div className="ll-title">{a.name}{a.reaction ? " — " + a.reaction : ""}</div>
              <div className="ll-sub">{fmtDate(a.date)} · {a.author}{a.info ? " · " + a.info : ""}</div>
            </div>
            <button className="icon-btn" title="Modifier" onClick={(e) => { e.stopPropagation(); setEditId(a.id); }}>
              <span className="material-icons-outlined">edit</span>
            </button>
            <button className="icon-btn" title="Supprimer" onClick={(e) => { e.stopPropagation(); del(a.id); }}>
              <span className="material-icons-outlined" style={{ color: "light-dark(#b00020, #e9a5b1)" }}>delete_outline</span>
            </button>
          </div>))}
    </>);

  return (
    <Sheet kind="modal" onClose={onClose}>
      {(close) => (
        <>
          <DlgHead icon="error_outline" overline="Sommaire" title="Allergies et intolérances" onClose={close} />
          <div className="dlg-body">
            {state.noAllergy
              ? <div className="empty-state"><span className="material-icons-outlined">verified_user</span>Aucune allergie / intolérance connue.</div>
              : <>
                  <Section title="Allergies" list={allergies} tagCls="allergie" tagTxt="Allergie" />
                  <div className="divider" />
                  <Section title="Intolérances" list={intol} tagCls="intolerance" tagTxt="Intol." />
                </>}
          </div>
          <div className="dlg-foot">
            <span className="foot-spacer" />
            <button className="btn btn-ghost" onClick={close}>Fermer</button>
          </div>
        </>)}
    </Sheet>);
}

function AllergyEditRow({ entry, onDone }) {
  const { update } = useStore();
  const [name, setName] = React.useState(entry.name);
  const [reaction, setReaction] = React.useState(entry.reaction || "");
  const [kind, setKind] = React.useState(entry.kind);
  const [date, setDate] = React.useState(entry.date);
  const [info, setInfo] = React.useState(entry.info || "");

  const save = () => {
    update((s) => {
      const a = s.allergies.find((x) => x.id === entry.id);
      if (a) { a.name = name; a.reaction = reaction; a.kind = kind; a.date = date; a.info = info; }
      return s;
    });
    toast("Modifications enregistrées");
    onDone();
  };

  return (
    <div className="list-li" style={{ flexDirection: "column", alignItems: "stretch", gap: 0, background: "var(--mat-sys-surface-container-low)", borderRadius: 10, padding: 14, margin: "4px 0" }}>
      <div className="field-row">
        <div className="field" style={{ flex: 2 }}><label>Terme</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div className="field"><label>Type</label>
          <Seg options={[{ value: "allergie", label: "Allergie" }, { value: "intolerance", label: "Intol." }]} value={kind} onChange={setKind} />
        </div>
      </div>
      <div className="field-row">
        <div className="field"><label>Réaction</label><input className="input" value={reaction} onChange={(e) => setReaction(e.target.value)} /></div>
        <div className="field"><label>Date</label><input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
      </div>
      <div className="field" style={{ marginBottom: 10 }}><label>Informations additionnelles</label><textarea className="input" value={info} onChange={(e) => setInfo(e.target.value)} /></div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button className="btn btn-ghost btn-sm" onClick={onDone}>Annuler</button>
        <button className="btn btn-primary btn-sm" onClick={save}><span className="material-icons-outlined">check</span>Enregistrer</button>
      </div>
    </div>);
}

Object.assign(window, { AllergyAdd, AllergyConsult });
