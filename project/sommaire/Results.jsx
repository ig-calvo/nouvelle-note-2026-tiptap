/* global React, useStore, Sheet, DlgHead, Seg, Star, toast, fmtDate, fmtShort */
// =========================================================
// Results.jsx — list (chrono / description), stars, chart
// =========================================================
function ResultsList({ onClose }) {
  const { state, update } = useStore();
  const [view, setView] = React.useState("desc");
  const [filter, setFilter] = React.useState([]); // type keys to include; empty = all
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [chartType, setChartType] = React.useState(null);

  const toggleStar = (type) => update((s) => { const r = s.results.find((x) => x.type === type); if (r) r.starred = !r.starred; return s; });
  const inFilter = (t) => filter.length === 0 || filter.includes(t);
  const results = state.results.filter((r) => inFilter(r.type));

  // chronological flatten
  const chrono = [];
  state.results.forEach((r) => { if (inFilter(r.type)) r.values.forEach((v) => chrono.push({ type: r.type, label: r.label, unit: r.unit, ...v })); });
  chrono.sort((a, b) => b.date.localeCompare(a.date));

  return (
    <Sheet kind="modal-lg" onClose={onClose}>
      {(close) => (
        <>
          <DlgHead icon="science" overline="Sommaire" title="Résultats de laboratoire" onClose={close}
            actions={
              <>
                <div style={{ position: "relative" }}>
                  <button className="icon-btn" title="Filtrer par type" onClick={() => setFilterOpen((o) => !o)}>
                    <span className="material-icons-outlined">filter_list</span>
                  </button>
                  {filterOpen &&
                    <div style={resFilterStyle} onMouseLeave={() => setFilterOpen(false)}>
                      <div style={{ fontWeight: 600, fontSize: 12, textTransform: "uppercase", letterSpacing: ".5px", color: "var(--s-ink-3)", padding: "2px 12px 8px" }}>Types de résultat</div>
                      {state.results.map((r) =>
                        <label key={r.type} style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 12px", fontSize: 13, cursor: "pointer" }}>
                          <input type="checkbox" checked={filter.length === 0 || filter.includes(r.type)}
                            onChange={() => setFilter((f) => {
                              const base = f.length === 0 ? state.results.map((x) => x.type) : f;
                              return base.includes(r.type) ? base.filter((t) => t !== r.type) : [...base, r.type];
                            })} />
                          {r.label}
                        </label>)}
                      <div style={{ padding: "6px 12px" }}><button className="btn btn-ghost btn-sm" onClick={() => setFilter([])}>Tout afficher</button></div>
                    </div>}
                </div>
                <button className={"icon-btn" + (chartType ? " accent" : "")} title="Vue graphique" onClick={() => setChartType(chartType ? null : (results.find((r) => r.starred) || results[0])?.type)}>
                  <span className="material-icons-outlined">insights</span>
                </button>
              </>}
          />
          <div className="tabs">
            <button className={"tab" + (view === "chrono" ? " active" : "")} onClick={() => setView("chrono")}>Chronologique</button>
            <button className={"tab" + (view === "desc" ? " active" : "")} onClick={() => setView("desc")}>Description</button>
          </div>
          <div className="dlg-body">
            {chartType &&
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--s-ink-2)" }}>Analyte :</label>
                  <select className="select" style={{ width: 240 }} value={chartType} onChange={(e) => setChartType(e.target.value)}>
                    {state.results.map((r) => <option key={r.type} value={r.type}>{r.label}</option>)}
                  </select>
                </div>
                <ResultChart result={state.results.find((r) => r.type === chartType)} />
                <div className="divider" />
              </div>}

            {view === "desc" &&
              results.map((r) => {
                const last = r.values[0];
                return (
                  <div key={r.type} className="list-li">
                    <Star on={r.starred} onClick={() => toggleStar(r.type)} />
                    <div className="ll-main">
                      <div className="ll-title">{r.label} <span style={{ color: "var(--s-ink-4)", fontWeight: 400, fontSize: 12 }}>· réf. {r.ref} {r.unit}</span></div>
                      <div className="ll-sub">
                        {r.values.map((v, i) => <span key={i} style={{ marginRight: 14 }}><b style={{ color: outOfRange(r, v.v) ? "var(--s-red)" : "var(--s-ink)" }}>{v.v}</b> {fmtShort(v.date)}</span>)}
                      </div>
                    </div>
                    <button className="icon-btn" title="Graphique" onClick={() => setChartType(r.type)}><span className="material-icons-outlined">show_chart</span></button>
                  </div>);
              })}

            {view === "chrono" &&
              chrono.map((c, i) =>
                <div key={i} className="list-li">
                  <div className="ll-main">
                    <div className="ll-title">{c.label}</div>
                    <div className="ll-sub">{fmtDate(c.date)}</div>
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "var(--s-ink)" }}>{c.v}</span>
                  <span style={{ fontSize: 12, color: "var(--s-ink-4)" }}>{c.unit}</span>
                </div>)}

            {((view === "desc" && results.length === 0) || (view === "chrono" && chrono.length === 0)) &&
              <div className="empty-state"><span className="material-icons-outlined">science</span>Aucun résultat pour ce filtre.</div>}
          </div>
          <div className="dlg-foot">
            <span style={{ fontSize: 11.5, color: "var(--s-ink-3)" }}>⭐ Épingler un type affiche son résultat le plus récent au sommaire.</span>
            <span className="foot-spacer" />
            <button className="btn btn-ghost" onClick={close}>Fermer</button>
          </div>
        </>)}
    </Sheet>);
}

function outOfRange(r, v) {
  const m = (r.ref || "").match(/([\d,.]+)\s*[–-]\s*([\d,.]+)/);
  if (m) { const lo = parseFloat(m[1].replace(",", ".")), hi = parseFloat(m[2].replace(",", ".")); return v < lo || v > hi; }
  const lt = (r.ref || "").match(/<\s*([\d,.]+)/);
  if (lt) return v >= parseFloat(lt[1].replace(",", "."));
  return false;
}

function ResultChart({ result }) {
  if (!result) return null;
  const pts = result.values.slice().reverse();
  const W = 680, H = 230, pad = 44;
  const vals = pts.map((p) => p.v);
  let min = Math.min(...vals), max = Math.max(...vals);
  if (min === max) { min -= 1; max += 1; }
  const pd = (max - min) * 0.15; min -= pd; max += pd;
  const x = (i) => pad + (pts.length === 1 ? (W - 2 * pad) / 2 : (i / (pts.length - 1)) * (W - 2 * pad));
  const y = (v) => H - pad - ((v - min) / (max - min)) * (H - 2 * pad);
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ");
  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`}>
        {Array.from({ length: 5 }).map((_, i) => {
          const val = min + (i / 4) * (max - min), yy = y(val);
          return <g key={i}><line className="axis" x1={pad} y1={yy} x2={W - pad} y2={yy} opacity="0.5" /><text className="lbl" x={pad - 6} y={yy + 3} textAnchor="end">{val.toFixed(1)}</text></g>;
        })}
        {pts.length > 1 && <path className="line" d={path} />}
        {pts.map((p, i) =>
          <g key={i}>
            <circle className="dot-pt" cx={x(i)} cy={y(p.v)} r="4" />
            <text className="lbl" x={x(i)} y={H - pad + 16} textAnchor="middle">{fmtShort(p.date)}</text>
            <text className="lbl" x={x(i)} y={y(p.v) - 9} textAnchor="middle" style={{ fill: "var(--s-action)", fontWeight: 700 }}>{p.v}</text>
          </g>)}
      </svg>
      <div style={{ textAlign: "center", fontSize: 12, color: "var(--s-ink-3)", marginTop: 6 }}>{result.label} ({result.unit}) · réf. {result.ref}</div>
    </div>);
}

const resFilterStyle = { position: "absolute", top: 38, right: 0, background: "var(--mat-sys-surface-container-lowest)", borderRadius: 10, boxShadow: "0 8px 24px rgba(20,20,45,.22)", border: "1px solid var(--s-line)", padding: "10px 0 4px", width: 230, zIndex: 20 };

Object.assign(window, { ResultsList });
