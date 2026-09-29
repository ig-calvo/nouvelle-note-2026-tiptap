/* global React, useStore, Sheet, DlgHead, Seg, ACTION_LABELS, fmtDate */
// =========================================================
// AuditReports.jsx — 3 audit report tabs (4a / 4b / 4c)
// =========================================================

// Prototype patient data for reports
const PATIENT_DB = {
  "12345678": { name: "Jean-François Bouchard-Tremblay", nam: "BOUJ01101234", dob: "1975-11-01", sex: "M" },
  "87654321": { name: "Marie Charland", nam: "CHARM8002114", dob: "1980-02-11", sex: "F" },
  "11223344": { name: "Pierre Tremblay", nam: "TREMP7005237", dob: "1970-05-23", sex: "M" },
};

const USER_DB = [
  { id: "usr-001", name: "Dr Véronique Charland", lastName: "Charland" },
  { id: "usr-002", name: "Dr Marc Lefebvre",       lastName: "Lefebvre" },
  { id: "usr-003", name: "IPS Côté",               lastName: "Côté" },
];

function fmtTs(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ---- Report 4a : consult + consent for a patient ----
function Report4a({ actionLog, consentLog }) {
  const [dossier, setDossier] = React.useState("");
  const [results, setResults] = React.useState(null);

  const run = () => {
    const patient = PATIENT_DB[dossier.trim()];
    const consults = actionLog.filter((e) => e.details?.patientDossier === dossier.trim() || dossier.trim() === "12345678");
    const consents = (consentLog || []).filter((e) => e.patientDossier === dossier.trim());
    setResults({ patient, consults, consents });
  };

  return (
    <div>
      <div className="hint-note" style={{ marginBottom: 16 }}>
        <span className="material-icons-outlined">info</span>
        Saisissez le numéro de dossier à 8 chiffres pour obtenir l'historique complet des consultations et consentements.
      </div>
      <div className="field-row" style={{ marginBottom: 16 }}>
        <div className="field" style={{ flex: 1 }}>
          <label>Numéro de dossier (8 chiffres)</label>
          <input className="input" placeholder="12345678" value={dossier} onChange={(e) => setDossier(e.target.value)} maxLength={8} />
        </div>
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <button className="btn btn-primary" disabled={dossier.trim().length !== 8} onClick={run}>
            <span className="material-icons-outlined">search</span>Générer
          </button>
        </div>
      </div>

      {results && (
        <>
          {results.patient
            ? <div style={{ background: "var(--s-bg-1)", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13 }}>
                <b>{results.patient.name}</b> · NAM {results.patient.nam} · né(e) {fmtDate(results.patient.dob)} · {results.patient.sex}
              </div>
            : <div className="hint-note" style={{ marginBottom: 16 }}>Dossier introuvable dans la base de données prototype.</div>}

          <div className="section-label">Consentements ponctuels <span className="sl-count">· {results.consents.length}</span></div>
          {results.consents.length === 0
            ? <div style={{ color: "var(--s-ink-3)", fontSize: 13, marginBottom: 12 }}>Aucun consentement enregistré.</div>
            : results.consents.map((c) => (
              <div key={c.id} className="list-li">
                <span className="material-icons-outlined" style={{ color: "var(--s-action)", fontSize: 18 }}>how_to_reg</span>
                <div className="ll-main">
                  <div className="ll-title">Consentement de {c.consentGivenByName}</div>
                  <div className="ll-sub">{fmtTs(c.timestamp)} · reçu par {c.userName}{c.onBehalfOf ? ` · au nom de ${c.onBehalfOf}` : ""}</div>
                </div>
              </div>))}

          <div className="divider" />
          <div className="section-label">Consultations <span className="sl-count">· {results.consults.length}</span></div>
          {results.consults.length === 0
            ? <div style={{ color: "var(--s-ink-3)", fontSize: 13 }}>Aucune consultation enregistrée.</div>
            : results.consults.map((e) => (
              <div key={e.id} className="list-li">
                <span className="material-icons-outlined" style={{ color: "var(--s-action)", fontSize: 18 }}>folder_open</span>
                <div className="ll-main">
                  <div className="ll-title">{ACTION_LABELS[e.action] || e.action}{e.details?.name ? ` · ${e.details.name}` : ""}</div>
                  <div className="ll-sub">
                    {fmtTs(e.timestamp)} · {e.actor?.name}
                    {e.actor?.onBehalfOf ? <span style={{ color: "var(--s-amber)", marginLeft: 4 }}>(au nom de {e.actor.onBehalfOf})</span> : null}
                    {e.details?.contactType ? ` · ${e.details.contactType}` : ""}
                  </div>
                </div>
                {e.removedFromNote && <span className="tag" style={{ background: "light-dark(#ffeee8, #4c2f24)", color: "light-dark(#b00020, #e9a5b1)" }}>retiré</span>}
              </div>))}
        </>)}
    </div>);
}

// ---- Report 4b : records accessed by a user ----
function Report4b({ actionLog, consentLog }) {
  const [userId, setUserId] = React.useState("");
  const [results, setResults] = React.useState(null);

  const run = () => {
    const user = USER_DB.find((u) => u.id === userId);
    // In prototype, all log entries belong to current user; show them as if filtered
    const entries = actionLog.filter((e) => !userId || e.actor?.userId === userId || userId === "usr-001");
    setResults({ user, entries });
  };

  return (
    <div>
      <div className="hint-note" style={{ marginBottom: 16 }}>
        <span className="material-icons-outlined">info</span>
        Sélectionnez un utilisateur pour voir tous les dossiers consultés pendant son mandat actif.
      </div>
      <div className="field-row" style={{ marginBottom: 16 }}>
        <div className="field" style={{ flex: 1 }}>
          <label>Utilisateur</label>
          <select className="input" value={userId} onChange={(e) => setUserId(e.target.value)}>
            <option value="">— Sélectionner —</option>
            {USER_DB.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <button className="btn btn-primary" disabled={!userId} onClick={run}>
            <span className="material-icons-outlined">search</span>Générer
          </button>
        </div>
      </div>

      {results && (
        <>
          {results.user && (
            <div style={{ background: "var(--s-bg-1)", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13 }}>
              <b>{results.user.name}</b>
            </div>)}
          <div className="section-label">Dossiers consultés <span className="sl-count">· {results.entries.length}</span></div>
          {results.entries.length === 0
            ? <div style={{ color: "var(--s-ink-3)", fontSize: 13 }}>Aucune entrée trouvée.</div>
            : results.entries.map((e, i) => {
                const patient = PATIENT_DB["12345678"]; // prototype: single patient
                const hasConsent = (consentLog || []).some((c) => Math.abs(new Date(c.timestamp) - new Date(e.timestamp)) < 3600000);
                return (
                  <div key={i} className="list-li">
                    <span className="material-icons-outlined" style={{ fontSize: 18, color: "var(--s-action)" }}>person</span>
                    <div className="ll-main">
                      <div className="ll-title">
                        {patient ? patient.name : "Dossier 12345678"}
                        <span style={{ marginLeft: 8, fontWeight: 400, color: "var(--s-ink-3)", fontSize: 12 }}>
                          NAM {patient?.nam} · {patient?.dob} · {patient?.sex}
                        </span>
                      </div>
                      <div className="ll-sub">
                        {fmtTs(e.timestamp)} · {ACTION_LABELS[e.action] || e.action}
                        {e.details?.noteTitle ? ` · ${e.details.noteTitle}` : ""}
                        {hasConsent && <span style={{ marginLeft: 6, color: "light-dark(#2e7d32, #ade1b0)", fontWeight: 600 }}>✓ Consentement</span>}
                      </div>
                    </div>
                  </div>);
              })}
        </>)}
    </div>);
}

// ---- Report 4c : suspicious accesses ----
const SUSPICION_LABELS = {
  "self-access":      "Accès à son propre dossier",
  "colleague-access": "Accès au dossier d'un collègue",
  "same-name-access": "Accès à un dossier du même nom de famille",
  "consent-no-note":  "Consentement sans écriture clinique subséquente",
};

function Report4c({ actionLog, consentLog }) {
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");
  const [results, setResults] = React.useState(null);

  const run = () => {
    const flags = [];

    // consent-no-note: consent with no clinical action within 24h
    (consentLog || []).forEach((c) => {
      const cTime = new Date(c.timestamp).getTime();
      const hasNote = actionLog.some((e) => {
        const eTime = new Date(e.timestamp).getTime();
        return eTime > cTime && eTime < cTime + 86400000 &&
          !["record-open", "consent"].includes(e.action);
      });
      if (!hasNote) {
        flags.push({
          reason: "consent-no-note",
          user: c.userName,
          userId: c.userId,
          patientDossier: c.patientDossier,
          patientName: PATIENT_DB[c.patientDossier]?.name || "—",
          dob: PATIENT_DB[c.patientDossier]?.dob || "—",
          accessDate: "—",
          consentDate: fmtTs(c.timestamp),
        });
      }
    });

    // same-name-access: user last name matches patient last name
    const currentUser = USER_DB.find((u) => u.id === "usr-001");
    if (currentUser) {
      Object.entries(PATIENT_DB).forEach(([dossier, patient]) => {
        const patientLastName = patient.name.split(" ").pop();
        if (patientLastName.toLowerCase() === currentUser.lastName.toLowerCase()) {
          const accessed = actionLog.some((e) => e.actor?.userId === "usr-001");
          if (accessed) {
            flags.push({
              reason: "same-name-access",
              user: currentUser.name,
              userId: currentUser.id,
              patientDossier: dossier,
              patientName: patient.name,
              dob: patient.dob,
              accessDate: fmtTs(actionLog[0]?.timestamp),
              consentDate: "—",
            });
          }
        }
      });
    }

    setResults(flags);
  };

  return (
    <div>
      <div className="hint-note" style={{ marginBottom: 16 }}>
        <span className="material-icons-outlined">warning</span>
        Détecte les accès potentiellement suspects selon les patrons définis : accès propre dossier, collègue, même nom, consentement sans écriture.
      </div>
      <div className="field-row" style={{ marginBottom: 16 }}>
        <div className="field">
          <label>Du</label>
          <input className="input" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div className="field">
          <label>Au</label>
          <input className="input" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <button className="btn btn-primary" onClick={run}>
            <span className="material-icons-outlined">search</span>Analyser
          </button>
        </div>
      </div>

      {results !== null && (
        <>
          <div className="section-label">
            Accès suspects détectés <span className="sl-count">· {results.length}</span>
          </div>
          {results.length === 0
            ? <div style={{ color: "var(--s-ink-3)", fontSize: 13 }}>Aucun accès suspect détecté pour la période sélectionnée.</div>
            : results.map((f, i) => (
              <div key={i} className="list-li" style={{ alignItems: "flex-start" }}>
                <span className="material-icons-outlined" style={{ fontSize: 18, color: "#e0a800", marginTop: 2 }}>flag</span>
                <div className="ll-main">
                  <div className="ll-title" style={{ color: "light-dark(#b00020, #e9a5b1)" }}>{SUSPICION_LABELS[f.reason]}</div>
                  <div className="ll-sub">
                    <b>{f.user}</b> (ID {f.userId}) · Dossier {f.patientDossier} · {f.patientName} · né(e) {fmtDate(f.dob)}
                  </div>
                  <div className="ll-sub">
                    Accès : {f.accessDate}
                    {f.consentDate !== "—" ? ` · Consentement : ${f.consentDate}` : ""}
                  </div>
                </div>
              </div>))}
        </>)}
    </div>);
}

// ---- Main AuditReports shell ----
function AuditReports({ onClose }) {
  const { state } = useStore();
  const [tab, setTab] = React.useState("4a");
  const actionLog = state.actionLog || [];
  const consentLog = state.consentLog || [];

  return (
    <Sheet kind="modal-lg" onClose={onClose}>
      {(close) => (
        <>
          <DlgHead icon="admin_panel_settings" overline="Gestion" title="Rapports d'audit" onClose={close} />
          <div style={{ padding: "0 20px 12px" }}>
            <Seg
              options={[
                { value: "4a", label: "4a — Patient" },
                { value: "4b", label: "4b — Utilisateur" },
                { value: "4c", label: "4c — Accès suspects" },
              ]}
              value={tab}
              onChange={setTab}
            />
          </div>
          <div className="dlg-body">
            {tab === "4a" && <Report4a actionLog={actionLog} consentLog={consentLog} />}
            {tab === "4b" && <Report4b actionLog={actionLog} consentLog={consentLog} />}
            {tab === "4c" && <Report4c actionLog={actionLog} consentLog={consentLog} />}
          </div>
          <div className="dlg-foot">
            <span style={{ fontSize: 11.5, color: "var(--s-ink-3)" }}>
              Données limitées au mandat actif · Établissement : Clinique du Centre-ville
            </span>
            <span className="foot-spacer" />
            <button className="btn btn-ghost" onClick={close}>Fermer</button>
          </div>
        </>)}
    </Sheet>);
}

Object.assign(window, { AuditReports });
