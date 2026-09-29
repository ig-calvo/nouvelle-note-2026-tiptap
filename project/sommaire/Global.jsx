/* global React, useStore, Sheet, DlgHead, Seg, toast, BOX_META, deriveRows, dotColor */
// =========================================================
// Global.jsx — Reorder boxes, Quick entry, Print
// =========================================================
function ReorderBoxes({ onClose }) {
  const { state, update } = useStore();
  const [order, setOrder] = React.useState(state.order);
  const [dragIdx, setDragIdx] = React.useState(null);
  const [overIdx, setOverIdx] = React.useState(null);

  const move = (from, to) => {
    if (to < 0 || to >= order.length) return;
    const n = order.slice(); const [it] = n.splice(from, 1); n.splice(to, 0, it); setOrder(n);
  };
  const save = (close) => { update((s) => { s.order = order; return s; }); toast("Ordre des boîtes sauvegardé"); close(); };

  return (
    <Sheet kind="modal" onClose={onClose}>
      {(close) => (
        <>
          <DlgHead icon="swap_vert" overline="Sommaire" title="Réorganiser les boîtes" onClose={close} />
          <div className="dlg-body">
            <div className="hint-note" style={{ marginBottom: 14 }}>
              <span className="material-icons-outlined">person</span>
              Personnalisation par intervenant — cet ordre s'applique à votre vue, pas au dossier.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {order.map((id, i) => {
                const meta = BOX_META[id]; if (!meta) return null;
                return (
                  <div key={id}
                    draggable
                    onDragStart={() => setDragIdx(i)}
                    onDragOver={(e) => { e.preventDefault(); setOverIdx(i); }}
                    onDragEnd={() => { if (dragIdx != null && overIdx != null) move(dragIdx, overIdx); setDragIdx(null); setOverIdx(null); }}
                    onDrop={(e) => { e.preventDefault(); if (dragIdx != null) move(dragIdx, i); setDragIdx(null); setOverIdx(null); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 12, padding: "11px 12px",
                      border: "1px solid var(--s-line)", borderRadius: 9, background: dragIdx === i ? "light-dark(#eef0fb, #242b4c)" : "#fff",
                      cursor: "grab", boxShadow: overIdx === i && dragIdx !== i ? "inset 0 2px 0 var(--s-action)" : "none"
                    }}>
                    <span className="material-icons-outlined" style={{ color: "var(--s-ink-4)", cursor: "grab" }}>drag_indicator</span>
                    <span className="material-icons-outlined" style={{ color: "var(--s-ink-2)", fontSize: 19 }}>{meta.icon}</span>
                    <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{meta.label}</span>
                    <span style={{ display: "flex", flexDirection: "column" }}>
                      <button className="icon-btn" style={{ height: 20 }} onClick={() => move(i, i - 1)} disabled={i === 0}><span className="material-icons-outlined" style={{ fontSize: 18, opacity: i === 0 ? .3 : 1 }}>keyboard_arrow_up</span></button>
                      <button className="icon-btn" style={{ height: 20 }} onClick={() => move(i, i + 1)} disabled={i === order.length - 1}><span className="material-icons-outlined" style={{ fontSize: 18, opacity: i === order.length - 1 ? .3 : 1 }}>keyboard_arrow_down</span></button>
                    </span>
                  </div>);
              })}
            </div>
          </div>
          <div className="dlg-foot">
            <span className="foot-spacer" />
            <button className="btn btn-ghost" onClick={close}>Annuler</button>
            <button className="btn btn-primary" onClick={() => save(close)}><span className="material-icons-outlined">check</span>Sauvegarder</button>
          </div>
        </>)}
    </Sheet>);
}

// ---- Quick entry ----
const QE_SECTIONS = [
  { id: "prob", title: "Problèmes communs", icon: "healing", items: ["Hypertension artérielle", "Diabète type 2", "Dyslipidémie", "Asthme", "MPOC", "Anxiété / dépression"] },
  { id: "atcd", title: "Antécédents", icon: "history", items: ["Appendicectomie", "Cholécystectomie", "Amygdalectomie", "Césarienne"] },
  { id: "fam", title: "Antécédents familiaux", icon: "family_restroom", relation: true, items: ["Maladie coronarienne", "Cancer du sein", "Diabète type 2", "AVC"] },
  { id: "vacc", title: "Vaccins", icon: "vaccines", dated: true, items: ["Influenza", "COVID-19", "dT (tétanos-diphtérie)", "Zona", "Pneumocoque"] },
  { id: "allerg", title: "Allergies", icon: "error_outline", items: ["Pénicilline", "AAS (Aspirine)", "Sulfamidés", "Latex"] }
];

function QuickEntry({ onClose }) {
  const { update } = useStore();
  const [vals, setVals] = React.useState({});   // key -> 'oui'|'non'|'nd'
  const [extra, setExtra] = React.useState({});  // key -> relation/date string
  const key = (sid, it) => sid + "::" + it;
  const setVal = (k, v) => setVals((p) => ({ ...p, [k]: v }));
  const setEx = (k, v) => setExtra((p) => ({ ...p, [k]: v }));

  const save = (close) => {
    let added = 0;
    update((s) => {
      QE_SECTIONS.forEach((sec) => sec.items.forEach((it) => {
        const k = key(sec.id, it);
        if (vals[k] !== "oui") return;
        added++;
        if (sec.id === "prob") s.problems.push({ id: "p" + Date.now() + added, name: it, kind: "probleme", status: "actif", since: String(new Date().getFullYear()), starred: false });
        else if (sec.id === "atcd") s.problems.push({ id: "p" + Date.now() + added, name: it, kind: "antecedent", status: "—", since: String(new Date().getFullYear()), starred: false });
        else if (sec.id === "fam") s.problems.push({ id: "p" + Date.now() + added, name: it + (extra[k] ? " (" + extra[k] + ")" : "") + " — antéc. familial", kind: "antecedent", status: "—", since: "—", starred: false });
        else if (sec.id === "allerg") { s.noAllergy = false; s.allergies.push({ id: "a" + Date.now() + added, name: it, kind: "allergie", reaction: "", date: window.todayISO(), author: "Saisie rapide", info: "" }); }
        // vaccins: no immun box in this prototype's order — counted only
      }));
      return s;
    });
    toast(added ? `${added} élément(s) ajouté(s) au sommaire` : "Aucun élément marqué « Oui »", { icon: added ? "check_circle" : "info" });
    close();
  };

  return (
    <Sheet kind="modal-lg" onClose={onClose}>
      {(close) => (
        <>
          <DlgHead icon="bolt" overline="Sommaire" title="Saisie rapide du sommaire" onClose={close} />
          <div className="dlg-body">
            <div className="hint-note" style={{ marginBottom: 16 }}>
              <span className="material-icons-outlined">sync_alt</span>
              Lien unidirectionnel : « Oui » ajoute au sommaire. « Non » ne retire pas ce qui existe déjà.
            </div>
            {QE_SECTIONS.map((sec) =>
              <div key={sec.id} style={{ marginBottom: 18 }}>
                <div className="section-label" style={{ fontSize: 12 }}>
                  <span className="material-icons-outlined" style={{ fontSize: 17, color: "var(--s-ink-3)" }}>{sec.icon}</span>{sec.title}
                </div>
                {sec.items.map((it) => {
                  const k = key(sec.id, it);
                  const v = vals[k] || "nd";
                  return (
                    <div key={it}>
                      <div className="qe-row">
                        <span className="qe-name">{it}</span>
                        <Seg className="tri yn"
                          options={[{ value: "oui", label: "Oui", cls: "yes" }, { value: "non", label: "Non", cls: "no" }, { value: "nd", label: "Non doc.", cls: "nd" }]}
                          value={v} onChange={(nv) => setVal(k, nv)} />
                      </div>
                      {v === "oui" && (sec.relation || sec.dated) &&
                        <div className="qe-extra">
                          {sec.relation &&
                            <select className="select" style={{ maxWidth: 220 }} value={extra[k] || ""} onChange={(e) => setEx(k, e.target.value)}>
                              <option value="">Lien de parenté…</option>
                              {["Père", "Mère", "Fratrie", "Grand-parent", "Enfant"].map((r) => <option key={r} value={r}>{r}</option>)}
                            </select>}
                          {sec.dated &&
                            <input className="input" style={{ maxWidth: 180 }} type="date" value={extra[k] || ""} onChange={(e) => setEx(k, e.target.value)} />}
                        </div>}
                    </div>);
                })}
              </div>)}
          </div>
          <div className="dlg-foot">
            <span className="foot-spacer" />
            <button className="btn btn-ghost" onClick={close}>Annuler</button>
            <button className="btn btn-primary" onClick={() => save(close)}><span className="material-icons-outlined">save</span>Sauvegarder et fermer</button>
          </div>
        </>)}
    </Sheet>);
}

// ---- Print ----
function PrintSummary({ onClose }) {
  const { state } = useStore();
  const [incl, setIncl] = React.useState(() => state.order.reduce((a, id) => (a[id] = true, a), {}));
  const toggle = (id) => setIncl((p) => ({ ...p, [id]: !p[id] }));
  const selected = state.order.filter((id) => incl[id]);

  return (
    <Sheet kind="modal-lg" onClose={onClose}>
      {(close) => (
        <>
          <DlgHead icon="print" overline="Sommaire" title="Imprimer le sommaire" onClose={close} />
          <div className="dlg-body">
            <div style={{ display: "flex", gap: 18 }}>
              <div style={{ width: 220, flexShrink: 0 }}>
                <div className="section-label">Boîtes à inclure</div>
                {state.order.map((id) => {
                  const meta = BOX_META[id]; if (!meta) return null;
                  return (
                    <label key={id} style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 4px", fontSize: 13.5, cursor: "pointer" }}>
                      <input type="checkbox" checked={!!incl[id]} onChange={() => toggle(id)} />
                      <span className="material-icons-outlined" style={{ fontSize: 17, color: "var(--s-ink-3)" }}>{meta.icon}</span>
                      {meta.label}
                    </label>);
                })}
              </div>
              <div style={{ flex: 1, background: "var(--mat-sys-surface-container-low)", borderRadius: 10, padding: 18, border: "1px solid var(--s-line)" }}>
                <div style={{ background: "var(--mat-sys-surface-container-lowest)", borderRadius: 6, boxShadow: "0 1px 3px rgba(0,0,0,.1)", padding: "18px 20px", minHeight: 280 }}>
                  <div style={{ fontFamily: "var(--font-h)", fontWeight: 700, fontSize: 16 }}>Sommaire du dossier — Julie Tremblay</div>
                  <div style={{ fontSize: 11, color: "var(--s-ink-3)", marginBottom: 14 }}>Imprimé le {window.fmtDate(window.todayISO())}</div>
                  {selected.length === 0 && <div className="empty-state">Aucune boîte sélectionnée.</div>}
                  {selected.map((id) => {
                    const meta = BOX_META[id]; const rows = deriveRows(id, state);
                    return (
                      <div key={id} style={{ marginBottom: 13 }}>
                        <div style={{ fontFamily: "var(--font-h)", fontWeight: 600, fontSize: 12.5, color: "var(--s-summary-text)", borderBottom: "1px solid var(--s-line)", paddingBottom: 3, marginBottom: 5 }}>{meta.label}</div>
                        {rows.map((r, i) =>
                          <div key={i} style={{ display: "flex", gap: 8, fontSize: 11.5, color: "var(--s-ink-2)", padding: "1px 0" }}>
                            {r.med && <span style={{ width: 7, height: 7, borderRadius: "50%", background: dotColor(r.dot), marginTop: 4, flexShrink: 0 }} />}
                            <span style={{ flex: 1 }}>{r.text || r.left}</span>
                            {r.mid && <span style={{ fontVariantNumeric: "tabular-nums" }}>{r.mid}</span>}
                            {r.right && <span style={{ color: "var(--s-ink-4)" }}>{r.right}</span>}
                          </div>)}
                      </div>);
                  })}
                </div>
              </div>
            </div>
          </div>
          <div className="dlg-foot">
            <span style={{ fontSize: 12, color: "var(--s-ink-3)" }}>{selected.length} boîte(s) sélectionnée(s)</span>
            <span className="foot-spacer" />
            <button className="btn btn-ghost" onClick={close}>Fermer</button>
            <button className="btn btn-primary" disabled={!selected.length} onClick={() => { toast("Envoi vers l'impression…", { icon: "print" }); close(); }}><span className="material-icons-outlined">print</span>Imprimer</button>
          </div>
        </>)}
    </Sheet>);
}

Object.assign(window, { ReorderBoxes, QuickEntry, PrintSummary });
