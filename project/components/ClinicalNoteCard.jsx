/* global React */
function ClinicalNoteCard({ institution = "CENTRE DE SANTÉ INTÉGRALE", status = "(Rédaction en cours)" }) {
  return (
    <div style={cnStyles.card}>
      <div style={cnStyles.overline}>{institution}</div>
      <div style={cnStyles.titleRow}>
        <span style={cnStyles.title}>Note clinique</span>
        <span style={cnStyles.italic}>{status}</span>
        <div style={{ flex: 1 }} />
        <span className="material-icons-outlined" style={cnStyles.rightIcon}>save</span>
        <span className="material-icons" style={{ ...cnStyles.rightIcon, color: "var(--mat-sys-primary)" }}>info</span>
      </div>
      <div style={cnStyles.form}>
        <input style={{ ...cnStyles.input, flex: 1, minWidth: 160 }} placeholder="Motif de consultation" />
        <div style={cnStyles.inputWrap}>
          <input style={{ ...cnStyles.input, width: 108, paddingRight: 26 }} defaultValue="2026/04/24" />
          <span className="material-icons" style={cnStyles.inputIcon}>calendar_today</span>
        </div>
        <input style={{ ...cnStyles.input, width: 60, textAlign: "center" }} defaultValue="08:32" />
        <div style={cnStyles.selectWrap}>
          <select style={cnStyles.select} defaultValue="">
            <option value="" disabled>Type de note</option>
            <option>Consultation</option>
            <option>Suivi</option>
          </select>
        </div>
      </div>
    </div>
  );
}

const cnStyles = {
  card: {
    background: "var(--mat-sys-surface-container-lowest)", borderRadius: 4, padding: "10px 16px 12px",
    boxShadow: "0 2px 4px 0 rgba(37,36,94,.14), 0 0 5px 0 rgba(37,36,94,.12)",
    fontFamily: "'Inter', sans-serif", marginBottom: 14,
  },
  overline: {
    fontFamily: "'Inter',sans-serif", fontSize: 11, fontWeight: 500,
    letterSpacing: 0.8, textTransform: "uppercase",
    color: "color-mix(in srgb, var(--mat-sys-on-surface) 54%, transparent)", marginBottom: 2,
  },
  titleRow: { display: "flex", alignItems: "center", gap: 8, marginBottom: 10 },
  title: {
    fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 16,
    color: "color-mix(in srgb, var(--mat-sys-on-surface) 87%, transparent)",
  },
  italic: { fontStyle: "italic", fontSize: 13, color: "color-mix(in srgb, var(--mat-sys-on-surface) 68%, transparent)" },
  rightIcon: { fontSize: 20, color: "color-mix(in srgb, var(--mat-sys-on-surface) 38%, transparent)", cursor: "pointer" },
  form: { display: "flex", alignItems: "center", gap: 8 },
  input: {
    height: 26, padding: "2px 6px", border: "1px solid var(--mat-sys-outline-variant)", borderRadius: 0,
    font: "400 13px 'Inter',sans-serif", color: "color-mix(in srgb, var(--mat-sys-on-surface) 87%, transparent)",
    background: "var(--mat-sys-surface-container-lowest)", boxSizing: "border-box", outline: "none",
  },
  inputWrap: { position: "relative", display: "inline-flex" },
  inputIcon: {
    position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)",
    fontSize: 16, color: "color-mix(in srgb, var(--mat-sys-on-surface) 54%, transparent)", pointerEvents: "none",
  },
  selectWrap: { position: "relative" },
  select: {
    height: 26, padding: "2px 24px 2px 6px", border: "1px solid #767676",
    borderRadius: 0, font: "400 13px 'Inter',sans-serif",
    background: "var(--mat-sys-surface-container-lowest)", minWidth: 86, appearance: "menulist",
    color: "color-mix(in srgb, var(--mat-sys-on-surface) 54%, transparent)",
  },
};

window.ClinicalNoteCard = ClinicalNoteCard;
