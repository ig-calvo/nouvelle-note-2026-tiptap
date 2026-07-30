/* global React */
function TopBar({
  user = "Véronique Charland",
  mandate = "En mon nom",
  clinic = "Clinique du Centre-ville",
  onMenuClick
}) {
  return (
    <div style={tbStyles.bar}>
      <div style={tbStyles.left}>
        <button style={tbStyles.iconBtn} aria-label="menu" onClick={onMenuClick}>
          <span className="material-icons" style={{ color: "#fff", fontSize: 24 }}>menu</span>
        </button>
        <div style={{ ...tbStyles.logo, width: "174px" }}>omnimed</div>
      </div>

      <div style={tbStyles.searchWrap}>
        <input style={tbStyles.search} placeholder="Rechercher un patient..." />
        <span className="material-icons" style={tbStyles.searchIcon}>search</span>
      </div>

      <div style={tbStyles.right}>
        <span style={tbStyles.user}>{user}</span>
        <span style={tbStyles.sep} />
        <button style={tbStyles.ctxBtn}>
          {mandate}
          <span className="material-icons" style={tbStyles.caret}>arrow_drop_down</span>
        </button>
        <span style={tbStyles.sep} />
        <button style={tbStyles.ctxBtn}>
          {clinic}
          <span className="material-icons" style={tbStyles.caret}>arrow_drop_down</span>
        </button>
        <span style={tbStyles.sep} />
        <button style={tbStyles.rxBadge}>
          Prescrip<span style={{ fontWeight: 700 }}>T</span>ion
        </button>
        <button style={tbStyles.iconBtn} aria-label="déconnexion">
          <span className="material-icons" style={{ color: "#fff", fontSize: 22 }}>logout</span>
        </button>
      </div>
    </div>);

}

const tbStyles = {
  bar: {
    height: 56, background: "#23235a", color: "#fff",
    display: "flex", alignItems: "center", gap: 16,
    padding: "0 18px 0 12px",
    fontFamily: "'Inter', sans-serif",
    flexShrink: 0
  },
  left: { display: "flex", alignItems: "center", gap: 14 },
  iconBtn: {
    width: 38, height: 38, border: 0, background: "transparent",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", padding: 0, borderRadius: 6
  },
  logo: {
    fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 22,
    color: "#fff", letterSpacing: 0.2
  },
  searchWrap: { position: "relative", display: "flex", alignItems: "center", marginLeft: 8 },
  search: {
    background: "#fff", border: "1px solid #d0d0e0", color: "rgba(0,0,0,0.75)",
    borderRadius: 8, padding: "0 38px 0 16px", height: 38, width: 360,
    font: "400 15px 'Inter', sans-serif", outline: "none"
  },
  searchIcon: {
    position: "absolute", right: 12, color: "rgba(0,0,0,0.5)",
    fontSize: 22, pointerEvents: "none"
  },
  right: {
    marginLeft: "auto",
    display: "flex", alignItems: "center", gap: 10,
    fontSize: 15
  },
  user: { color: "#fff", fontWeight: 400 },
  sep: { width: 1, height: 22, background: "rgba(255,255,255,0.25)" },
  ctxBtn: {
    display: "inline-flex", alignItems: "center", gap: 2,
    background: "transparent", border: 0, color: "#fff",
    font: "400 15px 'Inter', sans-serif", cursor: "pointer", padding: 0
  },
  caret: { fontSize: 22, color: "rgba(255,255,255,0.85)", marginLeft: -2 },
  rxBadge: {
    display: "inline-flex", alignItems: "center",
    border: "1.5px solid #5ec98a", color: "#7ee0a3",
    background: "transparent", borderRadius: 6,
    padding: "5px 12px", cursor: "pointer",
    font: "600 14px 'Poppins', sans-serif", letterSpacing: 0.2
  }
};

window.TopBar = TopBar;