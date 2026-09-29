/* global React, useStore, Sheet, DlgHead, Seg, Star, toast, HABITS_SECTIONS, HABITS_CATEGORIES, FREQUENCY_OPTIONS, fmtDate, todayISO, appendLog */
// =========================================================
// Habits.jsx — lifestyle & social context (full implementation)
// =========================================================

function HabitsAdd({ onClose }) {
  const { update } = useStore();
  const [section, setSection] = React.useState("alcool-tabac");
  const [category, setCategory] = React.useState("");
  const [frequency, setFrequency] = React.useState("Régulier");
  const [description, setDescription] = React.useState("");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");

  const categories = HABITS_CATEGORIES[section] || [];

  const save = (close) => {
    update((s) => {
      s.noHabits = false;
      s.habits.push({
        id: "h" + Date.now(),
        section,
        category,
        frequency,
        description,
        startDate: startDate || null,
        endDate: endDate || null,
        starred: false
      });
      return s;
    });
    appendLog("habit-add", { section, category, frequency });
    toast("Habitude de vie ajoutée", { icon: "directions_run" });
    close();
  };

  const markNone = (close) => {
    update((s) => { s.noHabits = true; s.habits = []; return s; });
    appendLog("no-habits", {});
    toast("Mention « Aucune habitude documentée » ajoutée");
    close();
  };

  const sectionLabel = HABITS_SECTIONS[section]?.label || "Sélectionner une section";

  return (
    <Sheet kind="modal" onClose={onClose}>
      {(close) => (
        <>
          <DlgHead icon="directions_run" overline="Habitudes de vie" title="Ajouter une habitude ou un contexte social" onClose={close} />
          <div className="dlg-body">
            <div className="field">
              <label>Section</label>
              <Seg
                options={Object.entries(HABITS_SECTIONS).map(([k, v]) => ({ value: k, label: v.label }))}
                value={section}
                onChange={setSection}
              />
            </div>

            <div className="field">
              <label>Catégorie</label>
              <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">-- Sélectionner --</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="field">
              <label>Fréquence</label>
              <Seg options={FREQUENCY_OPTIONS} value={frequency} onChange={setFrequency} />
            </div>

            <div className="field">
              <label>Description</label>
              <textarea className="input" placeholder="Détails, contexte, notes…" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <div className="field-row">
              <div className="field">
                <label>Date de début</label>
                <input className="input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="field">
                <label>Date de fin (si applicable)</label>
                <input className="input" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>

            <button className="btn btn-outline btn-sm" onClick={() => markNone(close)}>
              <span className="material-icons-outlined">block</span>
              Ajouter « Aucune habitude »
            </button>
          </div>
          <div className="dlg-foot">
            <span className="foot-spacer" />
            <button className="btn btn-ghost" onClick={close}>Annuler</button>
            <button className="btn btn-primary" disabled={!category} onClick={() => save(close)}>
              <span className="material-icons-outlined">check</span>Ajouter cette habitude
            </button>
          </div>
        </>)}
    </Sheet>);
}

function HabitsConsult({ onClose }) {
  const { state, update } = useStore();
  const [editId, setEditId] = React.useState(null);

  const del = (id) => {
    update((s) => {
      s.habits = s.habits.filter((h) => h.id !== id);
      return s;
    });
    appendLog("habit-delete", { habitId: id });
    toast("Entrée supprimée");
  };

  const toggleStar = (id) => {
    update((s) => {
      const h = s.habits.find((x) => x.id === id);
      if (h) {
        h.starred = !h.starred;
        appendLog("habit-star", { habitId: id, starred: h.starred });
      }
      return s;
    });
  };

  // Group by section
  const sections = Object.entries(HABITS_SECTIONS);
  const habitsBySection = {};
  sections.forEach(([key]) => {
    habitsBySection[key] = state.habits.filter((h) => h.section === key);
  });

  const Section = ({ sectionKey, sectionData, habits }) => {
    if (habits.length === 0) return null;
    return (
      <>
        <div className="section-label">{sectionData.label}<span className="sl-count">· {habits.length}</span></div>
        {habits.map((h) => editId === h.id
          ? <HabitEditRow key={h.id} entry={h} onDone={() => setEditId(null)} />
          : (
            <div key={h.id} className="list-li editable" onClick={() => setEditId(h.id)}>
              {h.category && <span className="tag" style={{ background: "var(--s-blue-10)", color: "var(--s-blue)" }}>{h.category}</span>}
              <div className="ll-main">
                <div className="ll-title">{h.category}{h.frequency && h.frequency !== "Aucun" ? " — " + h.frequency : ""}</div>
                <div className="ll-sub">{h.description}{h.startDate ? " · depuis " + fmtDate(h.startDate) : ""}</div>
              </div>
              <Star on={h.starred} onClick={(e) => { e.stopPropagation(); toggleStar(h.id); }} />
              <button className="icon-btn" title="Modifier" onClick={(e) => { e.stopPropagation(); setEditId(h.id); }}>
                <span className="material-icons-outlined">edit</span>
              </button>
              <button className="icon-btn" title="Supprimer" onClick={(e) => { e.stopPropagation(); del(h.id); }}>
                <span className="material-icons-outlined" style={{ color: "light-dark(#b00020, #e9a5b1)" }}>delete_outline</span>
              </button>
            </div>))}
        <div className="divider" />
      </>);
  };

  return (
    <Sheet kind="modal-lg" onClose={onClose}>
      {(close) => (
        <>
          <DlgHead icon="directions_run" overline="Sommaire" title="Habitudes de vie et contexte social" onClose={close} />
          <div className="dlg-body">
            {state.noHabits && state.habits.length === 0
              ? <div className="empty-state"><span className="material-icons-outlined">info</span>Aucune habitude de vie ou contexte social documenté.</div>
              : sections.map(([key, data]) =>
                  <Section key={key} sectionKey={key} sectionData={data} habits={habitsBySection[key]} />)}
          </div>
          <div className="dlg-foot">
            <span className="foot-spacer" />
            <button className="btn btn-ghost" onClick={close}>Fermer</button>
          </div>
        </>)}
    </Sheet>);
}

function HabitEditRow({ entry, onDone }) {
  const { update } = useStore();
  const [category, setCategory] = React.useState(entry.category);
  const [frequency, setFrequency] = React.useState(entry.frequency);
  const [description, setDescription] = React.useState(entry.description || "");
  const [startDate, setStartDate] = React.useState(entry.startDate || "");
  const [endDate, setEndDate] = React.useState(entry.endDate || "");

  const save = () => {
    update((s) => {
      const h = s.habits.find((x) => x.id === entry.id);
      if (h) {
        h.category = category;
        h.frequency = frequency;
        h.description = description;
        h.startDate = startDate || null;
        h.endDate = endDate || null;
      }
      return s;
    });
    appendLog("habit-update", { habitId: entry.id, category, frequency });
    toast("Modifications enregistrées");
    onDone();
  };

  const categories = HABITS_CATEGORIES[entry.section] || [];

  return (
    <div className="list-li" style={{ flexDirection: "column", alignItems: "stretch", gap: 0, background: "var(--mat-sys-surface-container-low)", borderRadius: 10, padding: 14, margin: "4px 0" }}>
      <div className="field-row">
        <div className="field" style={{ flex: 2 }}>
          <label>Catégorie</label>
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">-- Sélectionner --</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Fréquence</label>
          <Seg options={FREQUENCY_OPTIONS} value={frequency} onChange={setFrequency} />
        </div>
      </div>
      <div className="field">
        <label>Description</label>
        <textarea className="input" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="field-row">
        <div className="field">
          <label>Date de début</label>
          <input className="input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="field">
          <label>Date de fin</label>
          <input className="input" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button className="btn btn-ghost btn-sm" onClick={onDone}>Annuler</button>
        <button className="btn btn-primary btn-sm" onClick={save}><span className="material-icons-outlined">check</span>Enregistrer</button>
      </div>
    </div>);
}

Object.assign(window, { HabitsAdd, HabitsConsult });
