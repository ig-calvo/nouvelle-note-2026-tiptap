/* global React */
function PatientBanner({ forceCollapsed, portalActive = true }) {
  const [phase, setPhase] = React.useState('expanded');
  const phaseRef = React.useRef(phase);
  phaseRef.current = phase;

  // Source unique du patient fictif — voir editor-data.jsx (window.NOTE_DATA.PATIENT).
  // Auparavant la bannière affichait « Julie Tremblay » pendant que le reste
  // de la note (allergies, grossesse) référait à une autre patiente.
  const P = (window.NOTE_DATA && window.NOTE_DATA.PATIENT) || {};
  const patientName = P.name || 'Geneviève Tremblay';
  const sexLabel = P.sex === 'M' ? 'Homme né le' : 'Femme née le';
  const patientSub = sexLabel + ' ' + (P.dob || '03 mai 1987') + ' (' + (P.age || '38 ans') + ')';
  const patientRamq = P.ramq || 'TREG 8705 0301';

  React.useEffect(() => {
    if (forceCollapsed && phase === 'expanded') setPhase('collapsed');
  }, [forceCollapsed]);

  React.useEffect(() => {
    function onScroll() {
      if (window.scrollY > 100 && phaseRef.current === 'expanded') setPhase('collapsed');
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Bannière épinglée hors du conteneur défilant (.center-col). PAS de z-index
  // positif : les scrims modaux sont piégés dans l'aside Summary (position:
  // sticky → contexte d'empilement), donc tout z-index positif ici passerait
  // AU-DESSUS du scrim. Sans z-index, la bannière reste au niveau de l'aside
  // (qui la suit dans le DOM et la recouvre quand un scrim s'ouvre) tout en
  // restant au-dessus du contenu de la note (région distincte, hors scroll).
  const stickyWrap = { position: 'relative' };

  /* ── Collapsed row ── */
  if (phase === 'collapsed') {
    return (
      <div style={stickyWrap}>
      <div className="banner-collapse" style={pbStyles.collapsedCard}>
        <div style={pbStyles.collapsedLeft}>
          <span style={pbStyles.avatarSm}>
            <span className="material-icons" style={{ color: "#8a5cb8", fontSize: 16 }}>person</span>
          </span>
          <div style={pbStyles.collapsedStack}>
            <span style={pbStyles.collapsedName}>{patientName}</span>
            <div style={pbStyles.collapsedMeta}>
              <span style={pbStyles.collapsedSub}>{patientSub}</span>
              <span style={pbStyles.collapsedRamq}>{patientRamq}</span>
              <span style={pbStyles.collapsedExp}>EXP. 03/28</span>
              <span style={pbStyles.collapsedFileChip}>
                <span className="material-icons-outlined" style={{ fontSize: 14, color: "rgba(0,0,0,0.55)" }}>folder_open</span>
                654189
              </span>
              <span style={pbStyles.collapsedLangChip}>FR</span>
            </div>
          </div>
        </div>
        <div style={pbStyles.collapsedActions}>
          <button style={pbStyles.iconBtn} aria-label="agenda">
            <span className="material-icons-outlined" style={pbStyles.iconBtnIc}>calendar_today</span>
          </button>
          <button style={pbStyles.iconBtn} aria-label="notes">
            <span className="material-icons-outlined" style={pbStyles.iconBtnIc}>assignment</span>
          </button>
          <button style={pbStyles.iconBtn} aria-label="médecin">
            <span className="material-icons-outlined" style={pbStyles.iconBtnIc}>medical_services</span>
          </button>
          <button style={pbStyles.iconBtn} aria-label="pharmacie">
            <span className="material-icons-outlined" style={pbStyles.iconBtnIc}>local_pharmacy</span>
          </button>
          <button style={pbStyles.consentBadge} aria-label="consentement valide">
            <span className="material-icons" style={{ fontSize: 18, color: "#1565c0" }}>thumb_up</span>
          </button>
          {portalActive &&
            <button style={pbStyles.portalBadge} aria-label="portail patient actif" title="Portail patient actif">
              <span className="material-icons" style={{ fontSize: 18, color: "#1565c0" }}>verified_user</span>
            </button>}
          <button style={pbStyles.iconBtn} aria-label="imprimer">
            <span className="material-icons-outlined" style={pbStyles.iconBtnIc}>print</span>
          </button>
          <button style={pbStyles.iconBtn} aria-label="documents">
            <span className="material-icons-outlined" style={pbStyles.iconBtnIc}>description</span>
          </button>
          <button style={{ ...pbStyles.iconBtn, border: 0 }} aria-label="étendre" onClick={() => setPhase('expanded')}>
            <span className="material-icons" style={{ ...pbStyles.iconBtnIc, color: "rgba(0,0,0,0.45)" }}>keyboard_arrow_down</span>
          </button>
        </div>
      </div>
      </div>
    );
  }

  /* ── Expanded card ── */
  return (
    <div style={stickyWrap}>
    <div style={pbStyles.card}>
      {/* Identity */}
      <div style={pbStyles.identCol}>
        <span style={pbStyles.avatar}>
          <span className="material-icons" style={{ color: "#8a5cb8", fontSize: 22 }}>person</span>
        </span>
        <div data-comment-anchor="8227936f7b-div-10-9" style={{ flex: 1 }}>
          <div style={pbStyles.name}>{patientName}</div>
          <div style={pbStyles.sub}>{patientSub}</div>
          <div style={pbStyles.ramqRow}>
            <span style={pbStyles.ramq}>{patientRamq}</span>
            <span style={{ ...pbStyles.exp, color: "rgb(138, 138, 138)" }}>EXP. 03/28</span>
          </div>
          <div style={pbStyles.fileRow}>
            <span style={pbStyles.fileChip}>
              <span className="material-icons-outlined" style={{ fontSize: 16, color: "rgba(0,0,0,0.6)" }}>folder_open</span>
              654189
            </span>
            <span style={pbStyles.langChip}>FR</span>
          </div>
        </div>
      </div>

      {/* Contact */}
      <div style={{ ...pbStyles.contactCol, flexGrow: 1, flexShrink: 1, flexBasis: 0, width: undefined }} data-comment-anchor="6d4d1b26f2-div-28-7">
        <div style={pbStyles.contactRow}>
          <span className="material-icons-outlined" style={pbStyles.contactIcon}>contact_phone</span>
          <span style={pbStyles.muted}>Cellulaire</span>
          <span style={pbStyles.link}>819-555-0456</span>
          <span className="material-icons" style={pbStyles.greenCheck}>check_circle</span>
        </div>
        <div style={{ ...pbStyles.contactRow, paddingLeft: 30 }}>
          <span style={pbStyles.email}>genevieve.tremblay.test@example.com</span>
          <span className="material-icons" style={pbStyles.greenCheck}>check_circle</span>
        </div>
      </div>

      {/* Clinic + pharmacy */}
      <div style={pbStyles.clinicCol}>
        <div style={pbStyles.contactRow}>
          <span className="material-icons-outlined" style={pbStyles.contactIcon}>medical_services</span>
          <div>
            <div style={pbStyles.clinicName}>Clinique du Centre-ville</div>
            <div style={pbStyles.muted}>Inscription de groupe</div>
          </div>
        </div>
        <div style={pbStyles.contactRow}>
          <span className="material-icons-outlined" style={pbStyles.contactIcon}>local_pharmacy</span>
          <div>
            <div style={pbStyles.clinicName}>PJC Jean-coutu Centre-ville</div>
            <div style={pbStyles.addrRow}>
              <span style={pbStyles.muted}>2333 ch. du boulevard, Sherbrooke, QC…</span>
              <span className="material-icons" style={pbStyles.sendIcon}>send</span>
            </div>
            <div style={pbStyles.link}>(438) 456-9763</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={pbStyles.actions}>
        <button style={{ ...pbStyles.calBtn, background: "rgb(240, 243, 250)" }} aria-label="agenda">
          <span className="material-icons" style={{ fontSize: 22, color: "rgb(126, 126, 126)" }}>calendar_today</span>
        </button>
        <button style={pbStyles.ghostBtn} aria-label="imprimer">
          <span className="material-icons-outlined" style={pbStyles.ghostIcon}>print</span>
        </button>
        <button style={pbStyles.ghostBtn} aria-label="documents">
          <span className="material-icons-outlined" style={pbStyles.ghostIcon}>description</span>
        </button>
        <button style={pbStyles.ghostBtn} aria-label="réduire" onClick={() => setPhase('collapsed')}>
          <span className="material-icons" style={pbStyles.ghostIcon}>keyboard_arrow_up</span>
        </button>
      </div>

      {/* Consentement + portail patient */}
      <div style={pbStyles.statusStack}>
        <div style={pbStyles.statusRow}>
          <span className="material-icons" style={{ fontSize: 20, color: "#39ab49" }}>thumb_up</span>
          <span style={pbStyles.consentText}>Consentement valide</span>
        </div>
        {portalActive &&
          <div style={pbStyles.statusRow}>
            <span className="material-icons" style={{ fontSize: 18, color: "#1565c0" }}>verified_user</span>
            <span style={pbStyles.portalText}>Portail patient actif</span>
          </div>}
      </div>
    </div>
    </div>
  );
}

const pbStyles = {
  card: {
    background: "#fff", borderRadius: 8,
    boxShadow: "0 2px 4px 0 rgba(37,36,94,.14), 0 0 5px 0 rgba(37,36,94,.12)",
    fontFamily: "'Inter', sans-serif",
    padding: "16px 18px",
    display: "flex", alignItems: "flex-start", gap: 28,
    position: "relative",
  },
  identCol: { display: "flex", gap: 12, flex: 1, minWidth: 220 },
  avatar: { width: 34, height: 34, borderRadius: "50%", background: "#ece3f5", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 },
  name: { fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 17, color: "rgba(0,0,0,0.88)" },
  sub: { fontSize: 13, color: "rgba(0,0,0,0.55)", marginTop: 1 },
  ramqRow: { display: "flex", alignItems: "center", gap: 8, marginTop: 5 },
  ramq: { fontSize: 13, color: "rgba(0,0,0,0.8)", fontWeight: 600, letterSpacing: 0.3, fontVariantNumeric: "tabular-nums" },
  exp: { fontSize: 12, color: "#d32f2f", fontWeight: 600, letterSpacing: 0.3 },
  fileRow: { display: "flex", alignItems: "center", gap: 8, marginTop: 8 },
  fileChip: { display: "inline-flex", alignItems: "center", gap: 5, border: "1px solid #e0e0e0", borderRadius: 6, padding: "3px 9px", fontSize: 13, color: "rgba(0,0,0,0.7)" },
  langChip: { border: "1px solid #e0e0e0", borderRadius: 6, padding: "3px 9px", fontSize: 13, color: "rgba(0,0,0,0.7)", fontWeight: 500 },
  contactCol: { display: "flex", flexDirection: "column", gap: 8, width: 280, flexShrink: 0, paddingTop: 2 },
  clinicCol: { display: "flex", flexDirection: "column", gap: 10, flex: 1, minWidth: 240, paddingTop: 2 },
  contactRow: { display: "flex", alignItems: "center", gap: 8 },
  contactIcon: { fontSize: 20, color: "rgba(0,0,0,0.5)", flexShrink: 0, alignSelf: "flex-start", marginTop: 1 },
  muted: { fontSize: 13, color: "rgba(0,0,0,0.55)" },
  link: { fontSize: 13, color: "#1975d1", fontWeight: 500 },
  email: { fontSize: 13, color: "#1975d1", fontWeight: 500 },
  greenCheck: { fontSize: 16, color: "#39ab49" },
  clinicName: { fontSize: 14, color: "rgba(0,0,0,0.82)", fontWeight: 500 },
  addrRow: { display: "flex", alignItems: "center", gap: 6 },
  sendIcon: { fontSize: 16, color: "#1975d1" },
  statusStack: { position: "absolute", bottom: 14, right: 18, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 },
  statusRow: { display: "flex", alignItems: "center", gap: 8 },
  consentText: { fontSize: 14, color: "#2e7d32", fontWeight: 500 },
  portalText: { fontSize: 13, color: "#1565c0", fontWeight: 500 },
  actions: { display: "flex", alignItems: "center", gap: 6, flexShrink: 0 },
  calBtn: { width: 40, height: 40, borderRadius: 8, border: 0, background: "#23235a", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" },
  ghostBtn: { width: 40, height: 40, borderRadius: 8, border: 0, background: "transparent", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" },
  ghostIcon: { fontSize: 24, color: "rgba(0,0,0,0.55)" },
  collapsedCard: { background: "#fff", borderRadius: 8, boxShadow: "0 2px 4px 0 rgba(37,36,94,.14), 0 0 5px 0 rgba(37,36,94,.12)", fontFamily: "'Inter', sans-serif", padding: "10px 16px", display: "flex", alignItems: "center", gap: 16 },
  collapsedLeft: { display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 },
  avatarSm: { width: 28, height: 28, borderRadius: "50%", background: "#ece3f5", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  collapsedStack: { display: "flex", flexDirection: "column", gap: 3, minWidth: 0 },
  collapsedMeta: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" },
  collapsedName: { fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 14, color: "rgba(0,0,0,0.88)", whiteSpace: "nowrap" },
  collapsedSub: { fontSize: 13, color: "rgba(0,0,0,0.55)", whiteSpace: "nowrap" },
  collapsedRamq: { fontSize: 13, fontWeight: 700, color: "rgba(0,0,0,0.8)", letterSpacing: 0.3, whiteSpace: "nowrap" },
  collapsedExp: { fontSize: 12, color: "rgba(0,0,0,0.45)", fontWeight: 600, letterSpacing: 0.2, whiteSpace: "nowrap" },
  collapsedFileChip: { display: "inline-flex", alignItems: "center", gap: 4, border: "1px solid #e0e0e0", borderRadius: 6, padding: "2px 8px", fontSize: 13, color: "rgba(0,0,0,0.7)", whiteSpace: "nowrap" },
  collapsedLangChip: { border: "1px solid #e0e0e0", borderRadius: 6, padding: "2px 8px", fontSize: 13, color: "rgba(0,0,0,0.7)", fontWeight: 500, whiteSpace: "nowrap" },
  collapsedActions: { display: "flex", alignItems: "center", gap: 4, flexShrink: 0 },
  iconBtn: { width: 34, height: 34, borderRadius: 7, border: "1px solid #e5e5e5", background: "#fff", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" },
  iconBtnIc: { fontSize: 20, color: "rgba(0,0,0,0.55)" },
  consentBadge: { width: 34, height: 34, borderRadius: 7, border: "1.5px solid #1565c0", background: "#fff", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" },
  portalBadge: { width: 34, height: 34, borderRadius: 7, border: "1.5px solid #1565c0", background: "#fff", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" },
};

window.PatientBanner = PatientBanner;
