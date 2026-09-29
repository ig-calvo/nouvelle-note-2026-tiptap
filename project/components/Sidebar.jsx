/* global React */
// Convert "First Middle Last-Name" into "Last-Name, F-M" for the sidebar
// patient pill. Splits on whitespace; everything after the first token is the
// surname (so multi-part Quebec names like "Bouchard-Tremblay" stay intact).
function formatSidebarName(full) {
  if (!full || typeof full !== "string") return "";
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  const firsts = parts.slice(0, -1);
  const last = parts[parts.length - 1];
  const initials = firsts.map(p => p.split("-").map(s => s.charAt(0).toUpperCase()).join("-")).join("-");
  return `${last}, ${initials}`;
}

function Sidebar({ active = "pending", onSelect = () => {}, patientName = "Jean-François Bouchard-Tremblay" }) {
  const items = [
    { id: "news", label: "Nouvelles", icon: "article" },
    { id: "results", label: "Résultats", icon: "science" },
    { id: "tasks", label: "Tâches", icon: "check_box", badge: 1, badgeKind: "blue" },
    { id: "communications", label: "Communications", icon: "chat_bubble_outline" },
    { id: "renewals", label: "Renouvellements", icon: "autorenew", badge: 1, badgeKind: "red" },
    { id: "pending", label: "Notes en attente", icon: "description" },
    { id: "appointment", label: "Rendez-vous", icon: "event" },
    { id: "waiting", label: "Salle d'attente", icon: "schedule" },
    { id: "directory", label: "Répertoire", icon: "contact_page" },
  ];
  const admin = [
    { id: "admin", label: "Administration", icon: "settings" },
    { id: "fax", label: "Gestion des télécopies", icon: "fax" },
    { id: "patient-lists", label: "Listes de patients", icon: "format_list_bulleted" },
    { id: "transmissions", label: "Transmissions", icon: "mail_outline" },
    { id: "reports", label: "Rapports", icon: "insert_chart_outlined" },
  ];

  const renderRow = (it) => (
    <div
      key={it.id}
      onClick={() => onSelect(it.id)}
      style={{
        ...sbStyles.item,
        ...(active === it.id ? sbStyles.itemActive : {}),
      }}
      onMouseOver={(e) => { if (active !== it.id) e.currentTarget.style.background = "rgba(0,0,0,0.04)"; }}
      onMouseOut={(e) => { if (active !== it.id) e.currentTarget.style.background = "transparent"; }}
    >
      <span className="material-icons-outlined" style={sbStyles.icon}>{it.icon}</span>
      <span style={sbStyles.label}>{it.label}</span>
      {it.badge && (
        <span style={{ ...sbStyles.badge, background: it.badgeKind === "red" ? "#b00020" : "var(--mat-sys-primary)" }}>
          {it.badge}
        </span>
      )}
    </div>
  );

  return (
    <aside style={sbStyles.bar}>
      {items.map(renderRow)}
      <div style={sbStyles.divider} />
      {admin.map(renderRow)}
      <div style={sbStyles.divider} />
      <div style={{ ...sbStyles.item, color: "color-mix(in srgb, var(--mat-sys-on-surface) 68%, transparent)" }}>
        <span className="material-icons-outlined" style={sbStyles.icon}>help_outline</span>
        <span style={sbStyles.label}>Besoin d'aide ?</span>
      </div>

      <div style={sbStyles.divider} />

      <div style={sbStyles.sectionLabel}>Salle d'attente</div>
      <div style={sbStyles.item}>
        <span className="material-icons-outlined" style={sbStyles.icon}>schedule</span>
        <span style={sbStyles.label}>Anglais</span>
        <span className="material-icons" style={{ marginLeft: "auto", color: "var(--mat-sys-primary)", fontSize: 20 }}>arrow_drop_down</span>
      </div>
      <div style={{ ...sbStyles.item, paddingLeft: 48, color: "color-mix(in srgb, var(--mat-sys-on-surface) 54%, transparent)", fontSize: 13, minHeight: 28 }}>
        Aucun patient
      </div>

      <div style={sbStyles.divider} />

      <div style={sbStyles.sectionLabel}>Consultés récemment</div>
      <div style={sbStyles.item}>
        <span
          className="material-icons"
          style={{
            ...sbStyles.icon,
            background: "light-dark(#e8e0f2, #36244c)",
            color: "light-dark(#8a5cb8, #c7b1dd)",
            borderRadius: "50%",
            padding: 3,
            fontSize: 14,
          }}
        >
          person
        </span>
        <span style={{ ...sbStyles.label, color: "var(--mat-sys-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {formatSidebarName(patientName)}
        </span>
      </div>
    </aside>
  );
}

const sbStyles = {
  bar: {
    width: 205, background: "var(--mat-sys-surface-container-lowest)", borderRight: "1px solid var(--mat-sys-outline-variant)",
    padding: "4px 0",
    fontFamily: "'Inter', sans-serif", fontSize: 13, color: "color-mix(in srgb, var(--mat-sys-on-surface) 85%, transparent)",
    flexShrink: 0, overflowY: "auto", overflowX: "hidden",
    boxSizing: "border-box",
  },
  item: {
    display: "flex", alignItems: "center", gap: 12,
    padding: "0 14px", cursor: "pointer", userSelect: "none",
    minHeight: 32, boxSizing: "border-box",
  },
  itemActive: { background: "rgba(25,117,209,0.08)", fontWeight: 500 },
  icon: { fontSize: 18, color: "color-mix(in srgb, var(--mat-sys-on-surface) 68%, transparent)", width: 20, textAlign: "center" },
  label: { fontSize: 13, fontWeight: 400, color: "color-mix(in srgb, var(--mat-sys-on-surface) 85%, transparent)" },
  badge: {
    marginLeft: "auto", color: "#fff", borderRadius: 10, fontSize: 11, fontWeight: 500,
    padding: "1px 7px", minWidth: 18, textAlign: "center", lineHeight: "16px",
  },
  divider: { borderTop: "1px solid var(--mat-sys-outline-variant)", margin: "6px 0" },
  sectionLabel: {
    padding: "4px 14px 2px", fontSize: 12,
    color: "color-mix(in srgb, var(--mat-sys-on-surface) 68%, transparent)", fontWeight: 400,
  },
};

window.Sidebar = Sidebar;
