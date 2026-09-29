/* global React, useStore, fmtShort, Star */
// =========================================================
// Sidebar.jsx — interactive "Sommaire du dossier"
// =========================================================
const BOX_META = {
  problems:  { icon: "healing",        label: "Problèmes",          add: false, open: "problems" },
  past:      { icon: "history",        label: "Antécédents",        add: false, open: "past" },
  allergies: { icon: "error_outline",  label: "Allergies",          add: true,  open: "allergies", addOpen: "allergies-add" },
  meds:      { icon: "medication",     label: "Médicaments",        add: true,  open: "meds", addOpen: "meds-add" },
  results:   { icon: "science",        label: "Résultats",          add: false, open: "results" },
  vitals:    { icon: "favorite_border",label: "Signes vitaux",      add: true,  open: "vitals", addOpen: "vitals-add" },
  habits:    { icon: "directions_run", label: "Habitudes de vie et cont. soc.", add: true, open: null, addOpen: null }
};

const STATUS_DOT = { active: "active", echue: "echue", cessee: "cessee", texte: "texte" };

function boxCount(id, s) {
  switch (id) {
    case "allergies": return s.noAllergy ? 0 : s.allergies.length;
    case "meds": return s.meds.length;
    case "results": return s.results.length;
    case "vitals": return s.vitals.length;
    case "problems": return s.problems.filter((p) => p.kind === "probleme").length;
    case "past": return s.problems.filter((p) => p.kind === "antecedent").length;
    case "habits": return s.habits.length;
    default: return 0;
  }
}

function deriveRows(id, s) {
  const rows = [];
  if (id === "allergies") {
    if (s.noAllergy) { rows.push({ left: "Aucune allergie / intolérance connue", muted: true }); return rows; }
    s.allergies.slice(0, 4).forEach((a) =>
      rows.push({ left: a.name + (a.reaction ? " — " + a.reaction.toLowerCase() : ""), tag: a.kind }));
    return rows;
  }
  if (id === "meds") {
    const starred = s.meds.filter((m) => m.starred);
    (starred.length ? starred : s.meds.filter((m) => m.status === "active")).slice(0, 5).forEach((m) =>
      rows.push({ med: true, dot: STATUS_DOT[m.status], text: `${m.name}${m.dose ? " " + m.dose : ""} — ${m.sig}` }));
    s.noteAdds.filter((n) => n.kind === "prescription").forEach((n) =>
      rows.push({ temp: true, left: n.text, badge: "Note", nid: n.id }));
    return rows;
  }
  if (id === "results") {
    s.results.filter((r) => r.starred).forEach((r) => {
      const last = r.values[0];
      rows.push({ left: r.label, mid: last ? `${last.v} ${r.unit}` : "—", right: last ? fmtShort(last.date) : "" });
    });
    s.noteAdds.filter((n) => n.kind === "requete").forEach((n) =>
      rows.push({ temp: true, left: n.text, badge: "Requête", nid: n.id }));
    if (!rows.length) rows.push({ left: "Aucun résultat épinglé", muted: true });
    return rows;
  }
  if (id === "vitals") {
    const v = s.vitals[0];
    if (!v) return [{ left: "Aucune observation", muted: true }];
    const st = s.vitalsStar;
    if (st.ta) rows.push({ left: "TA", mid: `${v.sys}/${v.dia} mmHg`, right: fmtShort(v.date) });
    if (st.fc) rows.push({ left: "FC", mid: `${v.fc} /min`, right: fmtShort(v.date) });
    if (st.temp) rows.push({ left: "Température", mid: `${v.temp} °C`, right: fmtShort(v.date) });
    if (st.spo2) rows.push({ left: "SpO₂", mid: `${v.spo2} %`, right: fmtShort(v.date) });
    if (st.poids) rows.push({ left: "Poids", mid: `${v.poids} kg`, right: fmtShort(v.date) });
    if (st.tour) rows.push({ left: "Tour de taille", mid: `${v.tour} cm`, right: fmtShort(v.date) });
    if (st.imc) { const b = window.bmi(v.poids, v.taille); rows.push({ left: "IMC", mid: b ? `${b.toFixed(1)} kg/m²` : "—", right: fmtShort(v.date) }); }
    if (!rows.length) rows.push({ left: "Aucun signe vital épinglé", muted: true });
    return rows;
  }
  if (id === "problems" || id === "past") {
    const kind = id === "problems" ? "probleme" : "antecedent";
    const list = s.problems.filter((p) => p.kind === kind);
    const starred = list.filter((p) => p.starred);
    (starred.length ? starred : list).slice(0, 4).forEach((p) =>
      rows.push({ left: p.name, right: p.status !== "—" ? p.status : p.since }));
    if (!rows.length) rows.push({ left: id === "problems" ? "Aucun problème" : "Aucun antécédent", muted: true });
    return rows;
  }
  if (id === "habits") {
    s.habits.forEach((h) => rows.push({ left: h.text }));
    return rows;
  }
  return rows;
}

function SummaryRow({ row, onRemoveTemp }) {
  if (row.med) {
    return (
      <div className="srow med">
        <span className="med-dot" style={{ background: dotColor(row.dot) }} />
        <span className="r-left">{row.text}</span>
      </div>);
  }
  if (row.temp) {
    return (
      <div className="srow temp">
        <span className="r-left">{row.left}</span>
        <span className="temp-badge">{row.badge}</span>
        <span className="material-icons" style={{ fontSize: 14, cursor: "pointer", color: "#9aa" }}
          title="Retirer cet ajout temporaire" onClick={() => onRemoveTemp(row.nid)}>close</span>
      </div>);
  }
  return (
    <div className="srow">
      <span className="r-left" style={row.muted ? { fontStyle: "italic", color: "color-mix(in srgb, var(--mat-sys-on-surface) 40%, transparent)" } : null}>{row.left}</span>
      {row.tag && <span className={"r-tag tag " + row.tag}>{row.tag === "intolerance" ? "Intol." : "Allergie"}</span>}
      {row.mid && <span className="r-mid">{row.mid}</span>}
      {row.right && <span className="r-right">{row.right}</span>}
    </div>);
}

function dotColor(k) {
  return { active: "#2e7d32", echue: "#e0a800", cessee: "#b00020", texte: "var(--mat-sys-primary)" }[k] || "#999";
}

function Sidebar({ onOpen }) {
  const { state, update } = useStore();
  const order = state.order;
  const [dragId, setDragId] = React.useState(null);
  const [overId, setOverId] = React.useState(null);

  const removeTemp = (nid) => update((s) => { s.noteAdds = s.noteAdds.filter((n) => n.id !== nid); return s; });

  return (
    <aside className="summary">
      <div className="summary-hdr">
        <span>Sommaire du dossier</span>
        <span className="sh-spacer" />
        <button className="sh-btn" title="Saisie rapide du sommaire" onClick={() => onOpen("quick")}>
          <span className="material-icons-outlined">bolt</span>
        </button>
        <button className="sh-btn" title="Réorganiser les boîtes" onClick={() => onOpen("reorder")}>
          <span className="material-icons-outlined">swap_vert</span>
        </button>
        <button className="sh-btn" title="Imprimer le sommaire" onClick={() => onOpen("print")}>
          <span className="material-icons-outlined">print</span>
        </button>
      </div>

      <div className="summary-body">
        {order.map((id) => {
          const meta = BOX_META[id];
          if (!meta) return null;
          const rows = deriveRows(id, state);
          const count = boxCount(id, state);
          return (
            <div key={id} className="sbox">
              <div className="sbox-head" onClick={() => meta.open && onOpen(meta.open)}>
                <span className="material-icons-outlined sb-ico">{meta.icon}</span>
                <span className="sb-label">{meta.label}</span>
                {count > 0 && <span className="sb-count">{count}</span>}
                {meta.add &&
                  <button className="sb-add" title={"Ajouter — " + meta.label}
                    onClick={(e) => { e.stopPropagation(); onOpen(meta.addOpen); }}>
                    <span className="material-icons">add</span>
                  </button>}
              </div>
              {rows.length > 0 &&
                <div className="sbox-rows">
                  {rows.map((r, i) => <SummaryRow key={i} row={r} onRemoveTemp={removeTemp} />)}
                </div>}
            </div>);
        })}
      </div>
    </aside>);
}

Object.assign(window, { Sidebar, BOX_META, dotColor, deriveRows });
