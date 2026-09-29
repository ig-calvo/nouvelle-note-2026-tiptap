/* global React, useStore, Sheet, DlgHead, Seg, ACTION_LABELS, fmtDate */
// =========================================================
// ActionLog.jsx — Note content & Note history views
// =========================================================

const ACTION_ICONS = {
  "allergy-add":       "vaccines",
  "allergy-update":    "edit",
  "allergy-delete":    "delete_outline",
  "no-allergy":        "block",
  "med-add":           "medication",
  "med-status-change": "swap_horiz",
  "med-star":          "star",
  "vitals-add":        "monitor_heart",
  "vitals-update":     "edit",
  "vitals-delete":     "delete_outline",
  "result-add":        "science",
  "result-delete":     "delete_outline",
  "result-star":       "star",
  "problem-add":       "healing",
  "problem-flip":      "swap_horiz",
  "problem-star":      "star",
  "habit-add":         "directions_run",
  "habit-update":      "edit",
  "habit-delete":      "delete_outline",
  "habit-star":        "star",
  "no-habits":         "block",
  "consent":           "how_to_reg",
  "record-open":       "folder_open",
};

function fmtTimestamp(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${String(d.getFullYear()).slice(2)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function detailSummary(entry) {
  const d = entry.details || {};
  if (d.name) return d.name;
  if (d.names && d.names.length) return d.names.join(", ");
  if (d.label) return d.label;
  if (d.category) return d.category + (d.frequency ? " — " + d.frequency : "");
  if (d.date) return fmtDate(d.date);
  return "";
}

function ActionLogPanel({ onClose }) {
  const { state } = useStore();
  const [view, setView] = React.useState("content");

  const log = state.actionLog || [];

  // "Note content" = actions not removed from note
  const content = log.filter((e) => !e.removedFromNote);
  // "Note history" = everything, newest first
  const history = [...log].reverse();

  const displayed = view === "content" ? content : history;

  return (
    <Sheet kind="drawer-md" onClose={onClose}>
      {(close) => (
        <>
          <DlgHead icon="history" overline="Dossier patient" title="Journal des actions" onClose={close} />
          <div style={{ padding: "0 20px 12px" }}>
            <Seg
              options={[
                { value: "content", label: "Contenu de la note" },
                { value: "history", label: "Historique complet" }
              ]}
              value={view}
              onChange={setView}
            />
          </div>
          <div className="dlg-body" style={{ paddingTop: 4 }}>
            {displayed.length === 0 &&
              <div className="empty-state">
                <span className="material-icons-outlined">history</span>
                {view === "content" ? "Aucune action dans la note active." : "Aucune action enregistrée."}
              </div>}
            {displayed.map((entry) => {
              const label = ACTION_LABELS[entry.action] || entry.action;
              const icon = ACTION_ICONS[entry.action] || "radio_button_unchecked";
              const detail = detailSummary(entry);
              const removed = entry.removedFromNote;
              return (
                <div key={entry.id} className="list-li" style={{ opacity: removed ? 0.55 : 1 }}>
                  <span className="material-icons-outlined" style={{ fontSize: 18, color: removed ? "var(--mat-sys-on-surface-variant)" : "var(--s-action)", flexShrink: 0 }}>
                    {icon}
                  </span>
                  <div className="ll-main">
                    <div className="ll-title" style={{ textDecoration: removed ? "line-through" : "none" }}>
                      {label}
                      {detail && <span style={{ fontWeight: 400, color: "var(--s-ink-3)", marginLeft: 6 }}>· {detail}</span>}
                    </div>
                    <div className="ll-sub">
                      {fmtTimestamp(entry.timestamp)}
                      {entry.actor?.name && <span style={{ marginLeft: 8 }}>· {entry.actor.name}</span>}
                      {entry.actor?.onBehalfOf && <span style={{ marginLeft: 4, color: "var(--s-amber)" }}>(au nom de {entry.actor.onBehalfOf})</span>}
                    </div>
                  </div>
                  {removed &&
                    <span className="tag" style={{ background: "light-dark(#ffeee8, #4c2f24)", color: "light-dark(#b00020, #e9a5b1)", flexShrink: 0 }}>retiré</span>}
                </div>);
            })}
          </div>
          <div className="dlg-foot">
            <span style={{ fontSize: 11.5, color: "var(--s-ink-3)" }}>
              {log.length} entrée{log.length !== 1 ? "s" : ""} au total
            </span>
            <span className="foot-spacer" />
            <button className="btn btn-ghost" onClick={close}>Fermer</button>
          </div>
        </>)}
    </Sheet>);
}

Object.assign(window, { ActionLogPanel });
