/* global React */
const { useState: useStateCNL } = React;

const NOTES = [
  {
    id: 1,
    date: "24 avr. 2026, 06:31",
    title: "Suivi de routine",
    motif: "Consultation",
    type: "Consultation",
    physician: "Dre A. Tremblay",
    mine: true,
    details: "{firstName} se présente pour un suivi de routine. Aucune plainte aiguë. Examen physique sans particularité. Signes vitaux stables : TA 118/74, FC 68, T° 36.8°C.",
    conclusion: "Suivi stable. Poursuivre traitement actuel. Revoir {firstName} dans 3 mois.",
  },
  {
    id: 2,
    date: "18 mars 2026, 14:22",
    title: "Suivi — tension artérielle",
    motif: "Suivi HTA",
    type: "Suivi",
    physician: "Dre A. Tremblay",
    mine: true,
    details: "Retour de {firstName} pour contrôle de la tension artérielle. Bonne adhérence à la médication. Pas d'effets secondaires notés. Exercice régulier maintenu 3x/semaine.",
    conclusion: "HTA bien contrôlée. Continuer amlodipine 5mg DIE. Prise de TA à domicile recommandée.",
  },
  {
    id: 3,
    date: "05 févr. 2026, 09:15",
    title: "Contrôle annuel",
    motif: "Examen périodique",
    type: "Consultation",
    physician: "Dre A. Tremblay",
    mine: true,
    details: "Examen périodique annuel de {firstName}. Aucune nouvelle plainte. Vaccinations à jour. Bilan sanguin complet demandé. Rappel pour dépistage cholestérol.",
    conclusion: "Examen sans particularité. Encourager poursuite de la routine d'exercice.",
  },
  {
    id: 4,
    date: "12 nov. 2025, 16:40",
    title: "Consultation — douleur lombaire",
    motif: "Lombalgie",
    type: "Consultation",
    physician: "Dr M. Gagnon",
    details: "{firstName} consulte pour lombalgie mécanique depuis 2 semaines, suite à effort physique. Douleur 4/10, pas d'irradiation, pas de signes neurologiques. Mobilité réduite en flexion.",
    conclusion: "Lombalgie mécanique non compliquée. Repos relatif, AINS au besoin, physiothérapie prescrite.",
  },
  {
    id: 5,
    date: "28 sept. 2025, 11:05",
    title: "Téléconsultation",
    motif: "Résultats de laboratoire",
    type: "Téléconsultation",
    physician: "Dre A. Tremblay",
    mine: true,
    details: "Révision des résultats sanguins avec {firstName}. Hémoglobine 135 g/L, créatinine normale, lipides légèrement élevés. TSH dans les limites de la normale.",
    conclusion: "Légère dyslipidémie. Modifications alimentaires recommandées. Revoir bilan dans 6 mois.",
  },
  {
    id: 6,
    date: "10 juin 2025, 15:30",
    title: "Vaccination — rappel",
    motif: "Vaccination",
    type: "Procédure",
    physician: "Inf. L. Côté",
    details: "Administration du rappel dT (diphtérie-tétanos) à {firstName}, bras gauche. Aucune réaction immédiate. Demeure 15 min en observation. Carnet de vaccination mis à jour.",
    conclusion: "Vaccination dT administrée sans complication. Prochain rappel dans 10 ans.",
  },
];

// Format the tweaked "Prénom Nom" into a clinical signature like "Dr P. Nom"
// Falls back gracefully on single names / empty input.
function formatPhysicianName(full) {
  if (!full || typeof full !== "string") return "";
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return `Dr ${parts[0]}`;
  const first = parts[0];
  const last = parts.slice(1).join(" ");
  return `Dr ${first[0].toUpperCase()}. ${last.charAt(0).toUpperCase() + last.slice(1)}`;
}

function ClinicalNoteList({ currentPhysician, patientName = "Jean-François Bouchard-Tremblay" }) {
  const [openIds, setOpenIds] = useStateCNL(new Set([1]));
  const signature = formatPhysicianName(currentPhysician);
  const firstName = (patientName || "").trim().split(/\s+/)[0] || "le patient";
  const fillName = (s) => (s || "").replaceAll("{firstName}", firstName);
  const toggle = (id) => {
    setOpenIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div style={cnlStyles.card}>
      <div style={cnlStyles.head}>
        <span style={cnlStyles.title}>Liste des notes cliniques</span>
        <div style={{ flex: 1 }} />
        <span className="material-icons-outlined" style={cnlStyles.ico}>visibility_off</span>
        <span className="material-icons-outlined" style={cnlStyles.ico}>print</span>
        <span className="material-icons" style={cnlStyles.ico}>refresh</span>
      </div>

      <div style={cnlStyles.filter}>
        <span style={cnlStyles.filterLabel}>Afficher</span>
        <span style={cnlStyles.link}>Toutes les notes</span>
        <span style={cnlStyles.filterLabel}>triées par</span>
        <span style={cnlStyles.link}>Date d'effet</span>
        <span style={cnlStyles.filterLabel}>du</span>
        <input style={cnlStyles.date} placeholder="aaaa/mm/jj" />
        <span style={cnlStyles.filterLabel}>au</span>
        <input style={cnlStyles.date} defaultValue="2026/04/24" />
      </div>

      <div style={cnlStyles.chipRow}>
        <span style={cnlStyles.chip}>{patientName} ({NOTES.length})</span>
      </div>

      {NOTES.map(orig => {
        const withSig = orig.mine && signature
          ? { ...orig, physician: signature }
          : orig;
        const n = {
          ...withSig,
          details: fillName(withSig.details),
          conclusion: fillName(withSig.conclusion),
        };
        const open = openIds.has(n.id);
        return (
          <div key={n.id} style={cnlStyles.noteRow}>
            <div style={cnlStyles.noteHead} onClick={() => toggle(n.id)}>
              <span className="material-icons-outlined" style={cnlStyles.noteIcon}>description</span>
              <span style={cnlStyles.noteDate}>{n.date},</span>
              <span style={cnlStyles.noteTitle}>{n.title}</span>
              <a
                href="#"
                style={cnlStyles.modifyLink}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
              >
                Modifier
              </a>
              <div style={{ flex: 1 }} />
              <button
                style={cnlStyles.caretBtn}
                onClick={(e) => { e.stopPropagation(); toggle(n.id); }}
                aria-label={open ? "Réduire" : "Développer"}
              >
                <svg
                  width="10" height="14" viewBox="0 0 10 14" fill="none"
                  style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s ease" }}
                >
                  <path d="M1.5 4.5L5 1L8.5 4.5" stroke="#1975d1" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M1.5 9.5L5 13L8.5 9.5" stroke="#1975d1" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            {!open && (
              <div style={cnlStyles.noteSummary}>
                <span style={cnlStyles.summaryLabel}>Conclusion :</span> {n.conclusion}
              </div>
            )}

            {open && (
              <div style={cnlStyles.noteExpanded}>
                <div style={cnlStyles.metaGrid}>
                  <Meta label="Motif" value={n.motif} />
                  <Meta label="Type" value={n.type} />
                  <Meta label="Intervenant" value={n.physician} />
                </div>
                <div style={cnlStyles.section}>
                  <div style={cnlStyles.sectionLabel}>Détails</div>
                  <div style={cnlStyles.sectionBody}>{n.details}</div>
                </div>
                <div style={cnlStyles.section}>
                  <div style={cnlStyles.sectionLabel}>Conclusion</div>
                  <div style={cnlStyles.sectionBody}>{n.conclusion}</div>
                </div>
                <div style={cnlStyles.author}>{n.physician}</div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Meta({ label, value }) {
  return (
    <div>
      <div style={cnlStyles.metaLabel}>{label}</div>
      <div style={cnlStyles.metaValue}>{value}</div>
    </div>
  );
}

const cnlStyles = {
  card: {
    background: "var(--mat-sys-surface-container-lowest)", borderRadius: 4, padding: "12px 16px 14px",
    boxShadow: "0 2px 4px 0 rgba(37,36,94,.14), 0 0 5px 0 rgba(37,36,94,.12)",
    fontFamily: "'Inter',sans-serif", marginBottom: 14,
  },
  head: { display: "flex", alignItems: "center", gap: 12, marginBottom: 6 },
  title: {
    fontFamily: "'Poppins',sans-serif", fontSize: 15, fontWeight: 600,
    color: "color-mix(in srgb, var(--mat-sys-on-surface) 87%, transparent)",
  },
  ico: { color: "var(--mat-sys-primary)", fontSize: 20, cursor: "pointer" },
  filter: {
    display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap",
    fontSize: 13, paddingBottom: 2,
  },
  filterLabel: { color: "color-mix(in srgb, var(--mat-sys-on-surface) 68%, transparent)" },
  link: { color: "var(--mat-sys-primary)", fontWeight: 500, cursor: "pointer" },
  date: {
    height: 22, padding: "2px 6px", border: "1px solid var(--mat-sys-outline-variant)", borderRadius: 0,
    font: "400 12px 'Inter',sans-serif", width: 96,
    color: "color-mix(in srgb, var(--mat-sys-on-surface) 54%, transparent)", outline: "none",
  },
  chipRow: {
    borderTop: "1px solid color-mix(in srgb, var(--mat-sys-on-surface) 12%, transparent)", marginTop: 10,
    paddingTop: 10, display: "flex",
  },
  chip: {
    background: "color-mix(in srgb, var(--mat-sys-on-surface) 4%, transparent)", border: "1px solid var(--mat-sys-outline-variant)",
    borderRadius: 2, padding: "2px 8px", fontSize: 12,
    color: "color-mix(in srgb, var(--mat-sys-on-surface) 68%, transparent)",
  },
  noteRow: {
    borderTop: "1px solid color-mix(in srgb, var(--mat-sys-on-surface) 12%, transparent)", marginTop: 10,
    paddingTop: 8, paddingBottom: 4,
  },
  noteHead: {
    display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
    userSelect: "none",
  },
  noteIcon: { fontSize: 16, color: "color-mix(in srgb, var(--mat-sys-on-surface) 54%, transparent)" },
  noteDate: { fontSize: 13, color: "color-mix(in srgb, var(--mat-sys-on-surface) 87%, transparent)" },
  noteTitle: { fontSize: 13, color: "color-mix(in srgb, var(--mat-sys-on-surface) 87%, transparent)", fontWeight: 500 },
  modifyLink: {
    color: "var(--mat-sys-primary)", fontSize: 11, fontWeight: 500,
    cursor: "pointer", textDecoration: "none",
    marginLeft: 4,
  },
  caretBtn: {
    width: 28, height: 28, border: 0, borderRadius: 4,
    background: "transparent", cursor: "pointer",
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    padding: 0,
  },
  noteSummary: {
    fontSize: 13, color: "color-mix(in srgb, var(--mat-sys-on-surface) 68%, transparent)",
    paddingLeft: 28, marginTop: 6, marginBottom: 4,
    lineHeight: 1.45,
  },
  summaryLabel: { color: "color-mix(in srgb, var(--mat-sys-on-surface) 54%, transparent)", fontWeight: 500 },
  noteExpanded: {
    paddingLeft: 28, paddingTop: 10, paddingRight: 8, paddingBottom: 6,
  },
  metaGrid: {
    display: "grid", gridTemplateColumns: "1fr 1fr 1.5fr",
    gap: 16, marginBottom: 12,
    padding: "10px 12px", background: "var(--mat-sys-surface-container-low)",
    borderLeft: "3px solid light-dark(#41478d, #b2b5dc)",
  },
  metaLabel: {
    fontSize: 11, color: "color-mix(in srgb, var(--mat-sys-on-surface) 54%, transparent)",
    textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 2,
  },
  metaValue: { fontSize: 13, color: "color-mix(in srgb, var(--mat-sys-on-surface) 87%, transparent)", fontWeight: 500 },
  section: { marginBottom: 10 },
  sectionLabel: {
    fontSize: 12, color: "color-mix(in srgb, var(--mat-sys-on-surface) 54%, transparent)",
    textTransform: "uppercase", letterSpacing: 0.4,
    fontWeight: 500, marginBottom: 4,
  },
  sectionBody: {
    fontSize: 13, color: "color-mix(in srgb, var(--mat-sys-on-surface) 87%, transparent)", lineHeight: 1.5,
  },
  author: {
    fontSize: 13, color: "color-mix(in srgb, var(--mat-sys-on-surface) 68%, transparent)",
    textAlign: "right", marginTop: 8,
    fontStyle: "italic",
  },
};

window.ClinicalNoteList = ClinicalNoteList;
