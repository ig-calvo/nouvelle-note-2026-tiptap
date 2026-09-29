/* global React */
function TopNav({ user = "Ignacio Calvo", mandate = "Moi-même", inst = "CENTRE DE SANTÉ INTÉGRALE" }) {
  return (
    <div style={topNavStyles.bar}>
      <div style={topNavStyles.left}>
        <button style={topNavStyles.burgerBtn} aria-label="menu">
          <span className="material-icons" style={{color:"#fff", fontSize:22}}>menu</span>
        </button>
        <div style={topNavStyles.logo}>omnimed</div>
      </div>
      <div style={topNavStyles.searchWrap}>
        <input style={topNavStyles.search} placeholder="Rechercher un patient..." />
        <span className="material-icons" style={topNavStyles.searchIcon}>search</span>
      </div>
      <div style={topNavStyles.right}>
        <span>{user}</span><span style={topNavStyles.sep}>|</span>
        <span>{mandate}</span><span style={topNavStyles.sep}>|</span>
        <span style={topNavStyles.inst}>{inst}</span>
      </div>
    </div>
  );
}

const topNavStyles = {
  bar: {
    height: 40, background: "#25245e", color: "#fff",
    display: "flex", alignItems: "center",
    padding: "0 16px", gap: 16,
    fontFamily: "'Inter', sans-serif",
    position: "sticky", top: 0, zIndex: 40,
    flexShrink: 0,
  },
  left: { display: "flex", alignItems: "center", gap: 12, minWidth: 205 },
  burgerBtn: {
    width: 28, height: 28, border: 0, background: "transparent",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", padding: 0,
  },
  logo: {
    fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 18,
    color: "#fff", letterSpacing: 0,
  },
  searchWrap: { position: "relative", display: "flex", alignItems: "center" },
  search: {
    background: "var(--mat-sys-surface-container-lowest)", border: "1px solid var(--mat-sys-outline-variant)", color: "color-mix(in srgb, var(--mat-sys-on-surface) 75%, transparent)",
    borderRadius: 48, padding: "0 32px 0 14px", height: 26, width: 260,
    font: "400 13px 'Inter', sans-serif", outline: "none",
  },
  searchIcon: {
    position: "absolute", right: 8, color: "color-mix(in srgb, var(--mat-sys-on-surface) 54%, transparent)",
    fontSize: 18, pointerEvents: "none",
  },
  right: {
    marginLeft: "auto",
    display: "flex", alignItems: "center", gap: 8,
    color: "rgba(255,255,255,0.88)", fontSize: 12,
    fontFamily: "'Inter',sans-serif",
  },
  sep: { opacity: 0.5 },
  inst: { letterSpacing: 0.3 },
};

window.TopNav = TopNav;
