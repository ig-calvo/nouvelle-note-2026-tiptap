/* global React */
function PatientHeader({
  name = "Jean-François Bouchard-Tremblay",
  sub = "Homme de 24 ans, né le 10 oct. 2001",
}) {
  return (
    <div style={phStyles.card}>
      <div style={phStyles.row}>
        <div style={phStyles.avatar}>
          <span className="material-icons" style={{ color: "light-dark(#8a5cb8, #c7b1dd)", fontSize: 18 }}>person</span>
        </div>
        <div style={phStyles.ident}>
          <div style={phStyles.name}>{name}</div>
          <div style={phStyles.sub}>{sub}</div>
          <div style={phStyles.ramq}>RAMQ : BOUJ 0110 1234</div>
        </div>

        <div style={phStyles.midCol}>
          <InfoRow icon="phone" text="(514) 555-0184" />
          <InfoRow icon="mail_outline" text="jf.bouchard@example.ca" />
          <InfoRow icon="home" text="2845 rue Saint-Denis, Montréal, QC  H2X 3L7" />
        </div>

        <div style={phStyles.midCol}>
          <InfoRow icon="medical_services" text="Dre A. Tremblay (méd. famille)" />
          <InfoRow icon="local_pharmacy" text="Pharmacie Jean Coutu — Plateau" />
          <InfoRow icon="contact_emergency" text="Marie-Claude Bouchard (mère)" />
        </div>

        <div style={phStyles.actions}>
          <IconBtn icon="local_hospital" />
          <IconBtn icon="article" />
          <IconBtn icon="keyboard_arrow_up" chevron />
        </div>
      </div>

      <div style={phStyles.warnRow}>
        <div style={{ flex: 1 }} />
        <button style={phStyles.warnBtn}>
          <span className="material-icons" style={{ fontSize: 16, color: "#fff" }}>front_hand</span>
          <span>Accès limité au dossier</span>
        </button>
      </div>
    </div>
  );
}

function InfoRow({ icon, text }) {
  return (
    <div style={phStyles.infoRow}>
      <span className="material-icons-outlined" style={phStyles.infoIcon}>{icon}</span>
      <span style={phStyles.infoText}>{text}</span>
    </div>
  );
}

function IconBtn({ icon, chevron }) {
  return (
    <button style={phStyles.iconBtn}>
      <span className="material-icons" style={{ color: chevron ? "var(--mat-sys-primary)" : "color-mix(in srgb, var(--mat-sys-on-surface) 68%, transparent)", fontSize: 20 }}>
        {icon}
      </span>
    </button>
  );
}

const phStyles = {
  card: {
    background: "var(--mat-sys-surface-container-lowest)", borderRadius: 4, position: "relative",
    boxShadow: "0 2px 4px 0 rgba(37,36,94,.14), 0 0 5px 0 rgba(37,36,94,.12)",
    fontFamily: "'Inter', sans-serif", marginBottom: 14,
    padding: "14px 20px 12px",
  },
  row: { display: "flex", alignItems: "flex-start", gap: 16 },
  avatar: {
    width: 30, height: 30, borderRadius: "50%", background: "light-dark(#e8e0f2, #36244c)",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    marginTop: 2,
  },
  ident: { width: 240, flexShrink: 0 },
  name: {
    fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 14,
    color: "color-mix(in srgb, var(--mat-sys-on-surface) 87%, transparent)",
  },
  sub: { fontSize: 12, color: "color-mix(in srgb, var(--mat-sys-on-surface) 54%, transparent)", marginTop: 2 },
  ramq: {
    fontSize: 12, color: "color-mix(in srgb, var(--mat-sys-on-surface) 68%, transparent)", marginTop: 6,
    fontVariantNumeric: "tabular-nums",
  },
  midCol: {
    display: "flex", flexDirection: "column", gap: 8,
    paddingTop: 4, minWidth: 200, flex: 1,
  },
  infoRow: { display: "flex", alignItems: "center", gap: 8 },
  infoIcon: { fontSize: 18, color: "color-mix(in srgb, var(--mat-sys-on-surface) 54%, transparent)", width: 20, flexShrink: 0 },
  infoText: { fontSize: 13, color: "color-mix(in srgb, var(--mat-sys-on-surface) 78%, transparent)" },
  actions: {
    display: "flex", alignItems: "center", gap: 6,
    padding: "4px 6px",
  },
  iconBtn: {
    width: 34, height: 34, border: 0, borderRadius: 4,
    background: "transparent", cursor: "pointer",
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    transition: "background 0.15s",
  },
  warnRow: {
    display: "flex", alignItems: "center", marginTop: -28,
    paddingBottom: 0,
  },
  warnBtn: {
    display: "inline-flex", alignItems: "center", gap: 8,
    background: "#b00020", color: "#fff", border: 0, cursor: "pointer",
    padding: "6px 14px", borderRadius: 9999,
    fontFamily: "'Inter',sans-serif", fontWeight: 500, fontSize: 13,
  },
};

window.PatientHeader = PatientHeader;
