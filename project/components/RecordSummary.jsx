/* global React */
const { useState: useStateRS, useEffect: useEffectRS } = React;

const RS_ITEMS = [
{
  id: "tasks", icon: "check_box", label: "Tâches",
  rows: [
  { left: "Appeler patient — résultats lipidiques", right: "éch. 30 avr. 2026" },
  { left: "Référer en physiothérapie", right: "éch. 02 mai 2026" }]

},
{ id: "tools", icon: "build", label: "Outils cliniques", rows: [] },
{
  id: "vitals", icon: "favorite_border", label: "Signes vitaux",
  rows: [
  { left: "TA", mid: "118/74 mmHg", right: "24 avr. 2026" },
  { left: "FC", mid: "68 /min", right: "24 avr. 2026" },
  { left: "Température", mid: "36,8 °C", right: "24 avr. 2026" },
  { left: "IMC", mid: "23,4 kg/m²", right: "05 févr. 2026" }]

},
{
  id: "habits", icon: "directions_run", label: "Habitudes de vie et cont. soc.",
  rows: [
  { left: "Non-fumeur" },
  { left: "Alcool — occasionnel" },
  { left: "Exercice 3x/sem." }]

},
{
  id: "programs", icon: "local_offer", label: "Programmes",
  rows: [
  { left: "Suivi HTA", right: "#6997" },
  { left: "GMF — inscription active", right: "#4412" }]

},
{
  id: "allergies", icon: "error_outline", label: "Allergies",
  rows: [
  { left: "Pénicilline — urticaire", right: "Allergie" },
  { left: "Arachides", right: "Intolérance" }]

},
{
  id: "meds", icon: "medication", label: "Médicaments",
  rows: [
  { dot: "#2e7d32", text: "Amlodipine 5 mg — 1 co DIE" },
  { dot: "#2e7d32", text: "Rosuvastatine 10 mg — 1 co HS" },
  { dot: "#e0a800", text: "Acétaminophène 650 mg — 1 co PO PRN" },
  { dot: "var(--mat-sys-primary)", text: "Multivitamines (Centrum) — DIE" }]

},
{
  id: "results", icon: "science", label: "Résultats",
  rows: [
  { left: "Cholestérol LDL", mid: "3,4 mmol/L", right: "28 sept. 2025" },
  { left: "Hémoglobine", mid: "135 g/L", right: "28 sept. 2025" },
  { left: "Créatinine", mid: "82 µmol/L", right: "28 sept. 2025" }]

},
{
  id: "requests", icon: "assignment", label: "Requêtes",
  rows: [
  { left: "Bilan lipidique de contrôle", right: "en attente" },
  { left: "Physiothérapie — lombalgie", right: "active" }]

},
{
  id: "immun", icon: "vaccines", label: "Immunisation et vaccins",
  rows: [
  { left: "dT (tétanos-diphtérie)", right: "10 juin 2025" },
  { left: "Influenza", right: "15 oct. 2025" }]

},
{
  id: "problems", icon: "healing", label: "Problèmes",
  rows: [
  { left: "Hypertension artérielle", right: "actif" },
  { left: "Dyslipidémie légère", right: "actif" },
  { left: "Lombalgie mécanique", right: "résolu" }]

},
{
  id: "past", icon: "history", label: "Antécédents médicaux",
  rows: [
  { left: "Appendicectomie", right: "2014" },
  { left: "Fracture radius gauche", right: "2009" }]

},
{
  id: "family", icon: "folder_open", label: "Antécédents familiaux",
  rows: [
  { left: "Père — HTA, IM à 58 ans" },
  { left: "Mère — diabète type 2" }]

}];


function RecordSummary() {
  const [dsqStatus, setDsqStatus] = useStateRS("connecting");
  useEffectRS(() => {
    const t = setTimeout(() => setDsqStatus("connected"), 1400);
    return () => clearTimeout(t);
  }, []);

  const toggleDsq = () => {
    if (dsqStatus === "connected") {
      setDsqStatus("connecting");
      setTimeout(() => setDsqStatus("connected"), 1200);
    }
  };

  return (
    <aside style={rsStyles.panel}>
      <div style={{ ...rsStyles.hdr, width: "261px" }}>
        <span>Résumé du dossier</span>
        <span className="material-icons-outlined" style={rsStyles.hdrIcon}>dashboard</span>
      </div>

      <div style={rsStyles.dsqBlock} onClick={toggleDsq}>
        <div style={rsStyles.dsqRow}>
          <span className="material-icons-outlined" style={rsStyles.dsqIcon}>description</span>
          <span style={rsStyles.dsqLabel}>Dossier santé Québec (DSQ)</span>
          <StatusDot status={dsqStatus} />
        </div>
        <div style={rsStyles.dsqStatusLine}>
          {dsqStatus === "connecting" &&
          <>
              <span style={rsStyles.spinner} />
              <span style={{ color: "color-mix(in srgb, var(--mat-sys-on-surface) 68%, transparent)" }}>Connexion en cours…</span>
            </>
          }
          {dsqStatus === "connected" &&
          <>
              <span className="material-icons" style={{ fontSize: 14, color: "light-dark(#2e7d32, #ade1b0)" }}>check_circle</span>
              <span style={{ color: "light-dark(#2e7d32, #ade1b0)" }}>Connecté · Visualiseur disponible</span>
            </>
          }
        </div>
        {dsqStatus === "connected" &&
        <div style={rsStyles.dsqLink}>Ouvrir le visualiseur DSQ</div>
        }
      </div>

      {RS_ITEMS.map((it) =>
      <div key={it.id} style={rsStyles.section}>
          <div style={rsStyles.sectionHead}>
            <span className="material-icons-outlined" style={rsStyles.ico}>{it.icon}</span>
            <span style={rsStyles.label}>{it.label}</span>
            <span className="material-icons" style={rsStyles.plus}>add</span>
          </div>
          {it.rows && it.rows.length > 0 &&
        <div style={rsStyles.rows}>
              {it.rows.map((r, i) =>
          <SectionRow key={i} row={r} />
          )}
            </div>
        }
        </div>
      )}
    </aside>);

}

function SectionRow({ row }) {
  if (row.dot !== undefined) {
    return (
      <div style={rsStyles.medRow}>
        <span style={{ ...rsStyles.medDot, background: row.dot }} />
        <span style={rsStyles.medText}>{row.text}</span>
      </div>);

  }
  return (
    <div style={rsStyles.dataRow}>
      <span style={rsStyles.dataLeft}>{row.left}</span>
      {row.mid && <span style={rsStyles.dataMid}>{row.mid}</span>}
      {row.right && <span style={rsStyles.dataRight}>{row.right}</span>}
    </div>);

}

function StatusDot({ status }) {
  const bg = status === "connected" ? "#2e7d32" : "#e0a800";
  return (
    <span
      style={{
        width: 8, height: 8, borderRadius: "50%", background: bg,
        marginLeft: "auto", flexShrink: 0,
        boxShadow: status === "connected" ? "0 0 0 3px rgba(46,125,50,0.15)" : "0 0 0 3px rgba(224,168,0,0.2)",
        animation: status === "connecting" ? "rsPulse 1.2s ease-in-out infinite" : "none"
      }} />);


}

const rsStyles = {
  panel: {
    width: 260, background: "var(--mat-sys-surface-container-lowest)", borderRadius: 4, overflow: "hidden",
    boxShadow: "0 2px 4px 0 rgba(37,36,94,0.14), 0 0 5px 0 rgba(37,36,94,0.12)",
    fontFamily: "'Inter',sans-serif",
    height: "fit-content", flexShrink: 0
  },
  hdr: {
    background: "#41478d", color: "#fff", padding: "10px 14px",
    fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 15,
    display: "flex", alignItems: "center"
  },
  hdrIcon: { marginLeft: "auto", fontSize: 20, color: "#a6a7e5", cursor: "pointer" },
  dsqBlock: {
    padding: "10px 14px",
    borderBottom: "1px solid color-mix(in srgb, var(--mat-sys-on-surface) 8%, transparent)",
    cursor: "pointer"
  },
  dsqRow: { display: "flex", alignItems: "center", gap: 8 },
  dsqIcon: { fontSize: 18, color: "color-mix(in srgb, var(--mat-sys-on-surface) 68%, transparent)" },
  dsqLabel: { fontSize: 13, color: "color-mix(in srgb, var(--mat-sys-on-surface) 87%, transparent)", fontWeight: 500 },
  dsqStatusLine: {
    display: "flex", alignItems: "center", gap: 6,
    marginTop: 6, paddingLeft: 26, fontSize: 12
  },
  spinner: {
    width: 12, height: 12, borderRadius: "50%",
    border: "2px solid rgba(25,117,209,0.25)",
    borderTopColor: "var(--mat-sys-primary)",
    animation: "rsSpin 0.8s linear infinite",
    display: "inline-block"
  },
  dsqLink: {
    color: "var(--mat-sys-primary)", fontSize: 12, fontWeight: 500,
    paddingLeft: 26, marginTop: 4, cursor: "pointer"
  },
  section: {
    borderBottom: "1px solid color-mix(in srgb, var(--mat-sys-on-surface) 8%, transparent)"
  },
  sectionHead: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "9px 14px",
    minHeight: 36, boxSizing: "border-box",
    cursor: "pointer"
  },
  ico: { fontSize: 18, color: "color-mix(in srgb, var(--mat-sys-on-surface) 68%, transparent)", width: 20 },
  label: {
    fontSize: 13, color: "color-mix(in srgb, var(--mat-sys-on-surface) 87%, transparent)", fontWeight: 500,
    fontFamily: "'Poppins',sans-serif"
  },
  plus: {
    marginLeft: "auto", fontSize: 18, color: "color-mix(in srgb, var(--mat-sys-on-surface) 54%, transparent)",
    cursor: "pointer"
  },
  rows: {
    padding: "2px 14px 10px 14px",
    display: "flex", flexDirection: "column", gap: 6
  },
  dataRow: {
    display: "flex", alignItems: "baseline", gap: 8,
    fontSize: 12, color: "color-mix(in srgb, var(--mat-sys-on-surface) 78%, transparent)"
  },
  dataLeft: { flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  dataMid: { color: "color-mix(in srgb, var(--mat-sys-on-surface) 87%, transparent)", fontVariantNumeric: "tabular-nums" },
  dataRight: { color: "color-mix(in srgb, var(--mat-sys-on-surface) 54%, transparent)", fontSize: 11, fontVariantNumeric: "tabular-nums" },
  medRow: {
    display: "flex", alignItems: "center", gap: 8,
    fontSize: 12, color: "color-mix(in srgb, var(--mat-sys-on-surface) 78%, transparent)",
    lineHeight: 1.4
  },
  medDot: {
    width: 8, height: 8, borderRadius: "50%", flexShrink: 0
  },
  medText: { flex: 1 }
};

if (typeof document !== "undefined" && !document.getElementById("rs-keyframes")) {
  const s = document.createElement("style");
  s.id = "rs-keyframes";
  s.textContent = `
    @keyframes rsSpin { to { transform: rotate(360deg); } }
    @keyframes rsPulse {
      0%, 100% { box-shadow: 0 0 0 3px rgba(224,168,0,0.2); }
      50% { box-shadow: 0 0 0 6px rgba(224,168,0,0.08); }
    }
  `;
  document.head.appendChild(s);
}

window.RecordSummary = RecordSummary;