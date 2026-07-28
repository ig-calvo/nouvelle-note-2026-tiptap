/* global React */
const NOTE_ITEMS_TEMPLATE = [
  {
    date: "2 JUILLET 2026 13:45",
    author: "%%DOCTOR%%",
    clinic: "Clinique du Centre-ville",
    role: "Médecin de famille",
    mode: "PRÉSENTIEL",
    title: "Retour post-imagerie — douleur au flanc",
    icons: [],
    diagnostics: ["Colique néphrétique"],
    episodeId: "ep-demo-flanc",
    details: "Patient de retour suite à la TDM. Douleur en nette amélioration depuis l'analgésie.\nTDM : Calcul urétéral droit de 4 mm, sans dilatation significative.",
    conclusion: "Impression : Colique néphrétique confirmée, calcul de 4 mm.\nPlan : Poursuite de l'analgésie et hydratation. Filtration des urines. Retour si fièvre, douleur non contrôlée ou absence de progression dans 2 semaines.",
    files: [{ name: "TDM abdomino-pelvien.pdf", size: "1.4MB" }],
  },
  {
    date: "2 JUILLET 2026 09:10",
    author: "%%DOCTOR%%",
    clinic: "Clinique du Centre-ville",
    role: "Médecin de famille",
    mode: "PRÉSENTIEL",
    title: "Douleur au flanc droit",
    icons: [],
    diagnostics: [],
    episodeId: "ep-demo-flanc",
    details: "Motif : Douleur au flanc droit depuis 2 jours, irradiant vers l'aine. Pas d'hématurie visible. Pas de fièvre.\nObjectif : Punch rénal droit positif. Abdomen souple. Bandelette urinaire : Sang traces, Leuco négatif.",
    conclusion: "Impression : Suspicion de colique néphrétique.\nPlan : Requête d'imagerie (TDM abdomino-pelvien sans contraste) envoyée. Analgésie prescrite. Patient dirigé vers l'imagerie, retour prévu avec les résultats.",
    files: [],
  },
  {
    date: "8 DÉCEMBRE 2025 09:15",
    author: "Dr Marc Lefebvre",
    clinic: "Clinique du Centre-ville",
    role: "Médecine d'urgence",
    mode: "PRÉSENTIEL",
    title: "Infection urinaire",
    icons: ["graphic_eq", "link"],
    diagnostics: ["Cystite aiguë non compliquée"],
    details: "Motif : Brûlures mictionnelles depuis 3 jours.\nSubjectif : Dysurie, pollakiurie, urgence mictionnelle. Pas de fièvre, pas de douleur lombaire, pas d'hématurie macroscopique. Premier épisode. Pas d'antécédent gynécologique pertinent. Pas enceinte.\nObjectif : Apyrétique. Abdomen souple, sensibilité sus-pubienne légère. Loges rénales indolores. Bandelette urinaire : Leu+++, Nit+, Sang trace.",
    conclusion: "Impression : Cystite aiguë non compliquée.\nPlan : Nitrofurantoïne 100 mg BID × 5 jours. Culture d'urine envoyée. Conseils d'hydratation. Retour si fièvre, douleur lombaire ou non-amélioration après 48h.",
    files: [
      { name: "Bandelette urinaire.jpg", size: "200KB" },
      { name: "Culture d'urine.pdf", size: "220KB" },
    ],
  },
  {
    date: "5 JUIN 2025 10:30",
    author: "%%DOCTOR%%",
    clinic: "Clinique du Centre-ville",
    role: "Médecin de famille",
    mode: "PRÉSENTIEL",
    title: "Examen annuel",
    icons: ["graphic_eq", "pan_tool", "link", "hub"],
    diagnostics: [],
    details: "Subjectif : Patiente sans plainte particulière. Se dit en bonne santé. Pas de symptôme cardiovasculaire, respiratoire ou digestif. Sommeil satisfaisant. Énergie correcte. Stress professionnel modéré lié au travail en milieu scolaire. Contraception orale bien tolérée, pas d'oubli. Objectif : TA 116/72. Pouls 70 bpm. Poids 61 kg. IMC 22,4. Examen physique général sans anomalie. Auscultation cardio-pulmonaire normale. Abdomen souple, indolore. Pas d'adénopathie. Examen gynécologique non effectué (refusé par la patiente, à reprendre). Impression : Bonne santé générale.",
    conclusion: "Pas de problème actif identifié. Plan : Renouvellement contraceptif oral pour 1 an. Rappel dépistage col utérin à planifier. Conseils hygiéno-diététiques généraux. Retour au besoin.",
    files: [
      { name: "Exempleimage.jpg", size: "200KB" },
      { name: "Exempledocument.pdf", size: "220KB" },
    ],
  },
];

function roChipLabel(entity) {
  var d = entity.details || {};
  if (entity.type === 'prescription') {
    var rx = entity.rx || {};
    var name = rx.name || d.molecule || entity.label;
    var dose = rx.dose || (d.dose ? d.dose + ' ' + (d.unit || '') : '');
    var freq = d.frequency || rx.sig || '';
    return [name, dose, freq].filter(Boolean).join(' ');
  }
  if (entity.type === 'lab') return d.tests && d.tests.length ? d.tests.join(', ') : entity.label;
  if (entity.type === 'imaging') return [d.modality, d.region].filter(Boolean).join(' ') || entity.label;
  if (entity.type === 'referral') return d.specialty || entity.label;
  if (entity.type === 'problem') return d.name || entity.label;
  if (entity.type === 'instructions') return d.title || entity.label;
  return entity.label;
}

function roChipStyle(type) {
  var isRx = type === 'prescription';
  var isLab = type === 'lab';
  var isImg = type === 'imaging';
  var isRef = type === 'referral';
  return {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: isRx || isLab || isImg || isRef ? '2px 8px 2px 6px' : '2px 9px 2px 7px',
    borderRadius: isRx || isLab || isImg || isRef ? 7 : 6,
    background: isRx || isLab || isImg || isRef ? '#fff' : 'var(--brand-primary-container, #e8e8ff)',
    border: isRx || isLab || isImg || isRef ? '1px solid #b9b9d0' : '1px solid var(--brand-primary, #3f3ec8)',
    color: isRx || isLab || isImg || isRef ? 'rgba(0,0,0,0.8)' : 'var(--brand-primary, #3f3ec8)',
    fontSize: 14, fontWeight: 500, verticalAlign: 'baseline',
    whiteSpace: 'nowrap', margin: '0 2px', lineHeight: 1.5,
    boxShadow: '0 1px 2px rgba(37,36,94,0.06)',
  };
}

// Rendu read-only d'un chip (nœud atom Tiptap 'chip' — attrs = entité complète).
function ChipPill({ attrs, keyProp }) {
  var type = attrs.type;
  var isPrx = type === 'prescription';
  var iconMap = { lab: 'science', imaging: 'radiology', referral: 'person_add', problem: 'flag', instructions: 'menu_book', diagnostic: 'local_hospital', file: 'attach_file' };
  var label = roChipLabel(attrs);
  var iconColor = type === 'lab' ? '#1975d1' : type === 'imaging' ? '#7a3ec2' : type === 'referral' ? '#2e7d32' : '#25245E';
  return (
    <span key={keyProp} style={roChipStyle(type)}>
      {isPrx
        ? <span style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 500, fontSize: 16, color: '#25245E', lineHeight: 1 }}>℞</span>
        : <span className="material-symbols-outlined" style={{ fontSize: 14, color: iconColor }}>{iconMap[type] || 'bookmark'}</span>
      }
      <span>{label}</span>
    </span>
  );
}

// Rendu read-only d'un nœud inline (texte avec marques, ou chip).
function DocInline({ node, keyProp }) {
  if (node.type === 'text') {
    var el = node.text;
    (node.marks || []).forEach(function(m) {
      if (m.type === 'bold') el = <strong>{el}</strong>;
      else if (m.type === 'italic') el = <em>{el}</em>;
      else if (m.type === 'strike') el = <s>{el}</s>;
      else if (m.type === 'code') el = <code>{el}</code>;
    });
    return <React.Fragment key={keyProp}>{el}</React.Fragment>;
  }
  if (node.type === 'chip') return <ChipPill attrs={node.attrs} keyProp={keyProp} />;
  return null;
}

// Rendu read-only d'un document Tiptap complet (note complétée) : titres,
// paragraphes, chips, blocs de référence. Remplace l'ancien rendu à
// marqueurs {{CHIP}}/{{DIAG}}/{{REF}} — le doc JSON est déjà structuré.
function DocView({ doc }) {
  if (!doc || !doc.content) return null;
  var blocks = doc.content.map(function(node, bi) {
    if (node.type === 'heading') {
      var level = (node.attrs && node.attrs.level) || 2;
      var Tag = 'h' + Math.min(3, Math.max(1, level));
      var hStyle = level <= 1 ? nlStyles.roHeading1 : level === 2 ? nlStyles.roHeading2 : nlStyles.roHeading3;
      return React.createElement(Tag, { key: 'h-' + bi, style: hStyle },
        (node.content || []).map(function(c, ci) { return <DocInline key={ci} node={c} keyProp={ci} />; }));
    }
    if (node.type === 'reference') {
      return (
        <div key={'rb-' + bi} style={nlStyles.roRef}>
          <div style={nlStyles.roRefHeader}>
            <span className="material-icons-outlined" style={nlStyles.roRefIcon}>format_quote</span>
            <span style={nlStyles.roRefSource}>Référence — {node.attrs.source}</span>
          </div>
          <div style={nlStyles.roRefBody}>{(node.attrs.text || '').split('\n').map(function(l, li) { return <React.Fragment key={li}>{li > 0 && <br />}{l}</React.Fragment>; })}</div>
        </div>
      );
    }
    if (node.type === 'paragraph') {
      var kids = node.content || [];
      if (!kids.length) return null;
      return <p key={'p-' + bi} style={{ margin: '0 0 8px' }}>{kids.map(function(c, ci) { return <DocInline key={ci} node={c} keyProp={ci} />; })}</p>;
    }
    if (node.type === 'diagnosticRegion') {
      var bodyParas = (node.content || []).filter(function(p) { return (p.content || []).length; });
      return (
        <div key={'db-' + bi} style={nlStyles.roDiag}>
          <div style={nlStyles.roDiagHeader}>
            <span className="material-icons-outlined" style={nlStyles.roDiagIcon}>local_hospital</span>
            <span style={nlStyles.roDiagName}>{node.attrs.name}</span>
          </div>
          <div style={nlStyles.roDiagBody}>
            {bodyParas.map(function(p, pi) {
              return <p key={pi} style={{ margin: '0 0 4px' }}>{(p.content || []).map(function(c, ci) { return <DocInline key={ci} node={c} keyProp={ci} />; })}</p>;
            })}
          </div>
        </div>
      );
    }
    return null;
  });
  return <React.Fragment>{blocks}</React.Fragment>;
}

function NotesList({ doctorName = "Véronique Charland", extraNotes = [] }) {
  const NOTE_ITEMS = [
    ...extraNotes,
    ...NOTE_ITEMS_TEMPLATE.map(n => ({ ...n, author: n.author === "%%DOCTOR%%" ? doctorName : n.author })),
  ];
  const [openNotes, setOpenNotes] = React.useState({});
  const [activeFilters, setActiveFilters] = React.useState(new Set());
  const [refButton, setRefButton] = React.useState(null);

  // Sélectionner du texte dans une note complétée → « Référencer dans la
  // note » (bouton flottant). data-ref-source (posé sur .body ci-dessous)
  // porte l'auteur + la date de la note d'origine, quel que soit l'endroit
  // du texte sélectionné (détails, section étoilée, conclusion…).
  React.useEffect(function() {
    function onMouseUp() {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) { setRefButton(null); return; }
      const text = sel.toString().trim();
      if (!text) { setRefButton(null); return; }
      const anchorEl = sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentElement;
      const wrap = anchorEl && anchorEl.closest && anchorEl.closest('[data-ref-source]');
      if (!wrap) { setRefButton(null); return; }
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      setRefButton({ text: text, source: wrap.getAttribute('data-ref-source'), top: rect.top, left: rect.left + rect.width / 2 });
    }
    document.addEventListener('mouseup', onMouseUp);
    return function() { document.removeEventListener('mouseup', onMouseUp); };
  }, []);

  function addReference() {
    if (!refButton) return;
    window.dispatchEvent(new CustomEvent('note:add-reference', { detail: { text: refButton.text, source: refButton.source } }));
    setRefButton(null);
    window.getSelection().removeAllRanges();
  }

  // Épisode de soin : notes distinctes (chacune garde son propre timestamp)
  // reliées par un episodeId commun — ex. consultation puis retour après une
  // requête d'imagerie. NOTE_ITEMS est du plus récent au plus ancien, donc la
  // "visite 1" est celle dont l'index dans le groupe est le plus grand.
  const episodeGroups = {};
  NOTE_ITEMS.forEach((n, idx) => {
    if (!n.episodeId) return;
    (episodeGroups[n.episodeId] = episodeGroups[n.episodeId] || []).push(idx);
  });

  const toggleFilter = (key) => setActiveFilters(prev => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

  // Filter chips derived from the notes: author names first, then specialties.
  const authors = [...new Set(NOTE_ITEMS.map(n => n.author))];
  const specialties = [...new Set(NOTE_ITEMS.map(n => n.role))];

  const filtered = NOTE_ITEMS.filter(n => {
    const authorKeys = [...activeFilters].filter(k => k.startsWith('author:'));
    const specKeys = [...activeFilters].filter(k => k.startsWith('spec:'));
    if (authorKeys.length && !authorKeys.includes('author:' + n.author)) return false;
    if (specKeys.length && !specKeys.includes('spec:' + n.role)) return false;
    return true;
  });

  const toggle = (i) => setOpenNotes((prev) => ({ ...prev, [i]: !prev[i] }));

  return (
    <div style={nlStyles.card}>
      <div style={nlStyles.title}>Liste de notes cliniques</div>

      <div style={nlStyles.filterRow}>
        <Filter label="Voir" value="Toutes les notes" width={190} />
        <Filter label="triées par" value="Date d'entrée en vigueur" width={250} />
        <Filter label="Du" value="15/10/2023" width={150} cal />
        <Filter label="Au" value="15/10/2023" width={150} cal />
      </div>

      <div style={nlStyles.chipRow}>
        {authors.map(a => (
          <AuthorChip key={'a-' + a} name={a} icon="person" active={activeFilters.has('author:' + a)} onToggle={() => toggleFilter('author:' + a)} />
        ))}
        {specialties.length > 0 && <span style={nlStyles.chipDivider} />}
        {specialties.map(s => (
          <AuthorChip key={'s-' + s} name={s} icon="badge" active={activeFilters.has('spec:' + s)} onToggle={() => toggleFilter('spec:' + s)} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ padding: '24px 0', textAlign: 'center', color: 'rgba(0,0,0,0.45)', fontSize: 14 }}>Aucune note ne correspond aux filtres actifs.</div>
      )}
      {filtered.map((n, i) => {
        const origIdx = NOTE_ITEMS.indexOf(n);
        const isOpen = !!openNotes[origIdx];
        const epMembers = n.episodeId ? episodeGroups[n.episodeId] : null;
        const epTotal = epMembers ? epMembers.length : 0;
        const epVisitNum = epMembers ? epTotal - epMembers.indexOf(origIdx) : 0;
        return (
          <div key={origIdx} style={{
            ...nlStyles.note,
            borderTop: i > 0 ? '1px solid #eee' : 'none',
            borderLeft: epTotal > 1 ? '3px solid var(--brand-primary, rgb(46,56,166))' : 'none',
            paddingLeft: epTotal > 1 ? 14 : 0,
          }}>
            {/* Left meta column */}
            <div style={nlStyles.metaCol}>
              <div style={nlStyles.dateRow}>
                <span className="material-icons-outlined" style={nlStyles.noteFileIcon}>description</span>
                <span style={nlStyles.dateText}>{n.date}</span>
              </div>
              <div style={nlStyles.author}>{n.author}</div>
              <div style={nlStyles.clinic}>{n.clinic}</div>
              <div style={nlStyles.role}>{n.role}</div>
            </div>

            {/* Body */}
            <div style={nlStyles.body} data-ref-source={n.author + ' — ' + n.date}>
              {/* Header row */}
              <div style={nlStyles.bodyHead}>
                <div>
                  <div style={nlStyles.mode}>{n.mode}</div>
                  <div style={nlStyles.noteTitle}>
                    {n.title}
                  </div>
                </div>
                {epTotal > 1 &&
                  <span style={nlStyles.episodeChip}>
                    <span className="material-icons-outlined" style={nlStyles.episodeIcon}>link</span>
                    Épisode de soin · visite {epVisitNum}/{epTotal}
                  </span>}
                <div style={{ flex: 1 }} />
                <div style={nlStyles.actionIcons}>
                  <button style={nlStyles.checkoutBtn}>Checkout</button>
                  <button style={nlStyles.caretBtn} onClick={() => toggle(i)} aria-label={isOpen ? "Fermer" : "Ouvrir"}>
                    {isOpen
                      ? <span className="material-icons" style={nlStyles.caretIcon}>unfold_less</span>
                      : <span className="material-icons" style={nlStyles.caretIcon}>unfold_more</span>
                    }
                  </button>
                </div>
              </div>

              {/* Expanded: document Tiptap (nouvelles notes) ou détails texte (notes template) */}
              {isOpen && n.doc ? (
                <div style={nlStyles.detailsSection}>
                  <div style={nlStyles.detailsText}>
                    <DocView doc={n.doc} />
                  </div>
                </div>
              ) : isOpen && n.details ? (
                <div style={nlStyles.detailsSection}>
                  <div style={nlStyles.detailsLabel}>Détails de la note</div>
                  <div style={nlStyles.detailsText}>
                    {n.details.split("\n").map((line, j) => (
                      <p key={j} style={{ margin: "0 0 4px 0" }}>{line}</p>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Diagnostics — always visible (collapsed only shows these) */}
              {n.diagnostics && n.diagnostics.length > 0 && (
                <div style={nlStyles.diagRow}>
                  {n.diagnostics.map((d, j) => (
                    <span key={j} style={nlStyles.diagChip}>
                      <span className="material-icons-outlined" style={nlStyles.diagChipIcon}>local_hospital</span>
                      {d}
                    </span>
                  ))}
                </div>
              )}

              {/* Conclusion — uniquement pour les notes template (n.conclusion) */}
              {isOpen && !n.doc && n.conclusion ? (
                <>
                  <div style={nlStyles.conclLabelWrap}>
                    <div style={nlStyles.conclLabelOpen}>Conclusion</div>
                  </div>
                  <div style={nlStyles.conclText}>
                    {n.conclusion.split("\n").map((line, j) => (
                      <p key={j} style={{ margin: "0 0 4px 0" }}>{line}</p>
                    ))}
                  </div>
                </>
              ) : null}

              {/* Files — only when expanded */}
              {isOpen && n.files && n.files.length > 0 && (
                <div style={nlStyles.fileRow}>
                  {n.files.map((f) => (
                    <span key={f.name} style={nlStyles.fileChip}>
                      <span className="material-icons-outlined" style={nlStyles.clipIcon}>attach_file</span>
                      <span style={nlStyles.fileName}>{f.name}</span>
                      <span style={nlStyles.fileSize}>{f.size}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {refButton &&
        <button
          style={{ ...nlStyles.refBtn, top: refButton.top - 42, left: refButton.left }}
          onMouseDown={(e) => e.preventDefault()}
          onClick={addReference}>
          <span className="material-icons-outlined" style={{ fontSize: 16 }}>format_quote</span>
          Référencer dans la note
        </button>}
    </div>
  );
}

function Filter({ label, value, width, cal }) {
  return (
    <div style={nlStyles.filterField}>
      <span style={nlStyles.filterLabel}>{label}</span>
      <div style={{ ...nlStyles.filterBox, width }}>
        <span style={nlStyles.filterValue}>{value}</span>
        <span className="material-icons" style={nlStyles.filterIcon}>
          {cal ? "calendar_today" : "arrow_drop_down"}
        </span>
      </div>
    </div>
  );
}

function AuthorChip({ name, icon, active, onToggle }) {
  return (
    <span
      style={{
        ...nlStyles.authorChip,
        ...(active ? nlStyles.authorChipActive : {}),
      }}
      onClick={onToggle}
    >
      {icon && <span className="material-icons-outlined" style={{ ...nlStyles.chipIcon, color: active ? '#1975d1' : 'rgba(0,0,0,0.5)' }}>{icon}</span>}
      <span>{name}</span>
    </span>
  );
}

const nlStyles = {
  card: {
    background: "#fff", borderRadius: 8, padding: "18px 22px 22px",
    boxShadow: "0 2px 4px 0 rgba(37,36,94,.14), 0 0 5px 0 rgba(37,36,94,.12)",
    fontFamily: "'Inter', sans-serif",
  },
  title: {
    fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 22,
    color: "rgba(0,0,0,0.88)", marginBottom: 16,
  },
  filterRow: { display: "flex", gap: 18, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 16 },
  filterField: { display: "flex", flexDirection: "column", gap: 4 },
  filterLabel: { fontSize: 13, color: "rgba(0,0,0,0.55)" },
  filterBox: {
    display: "flex", alignItems: "center",
    border: "1px solid #c4c4c4", borderRadius: 6,
    height: 40, padding: "0 8px 0 12px",
  },
  filterValue: { fontSize: 14, color: "rgba(0,0,0,0.78)" },
  filterIcon: { marginLeft: "auto", fontSize: 20, color: "rgba(0,0,0,0.5)" },
  chipRow: { display: "flex", gap: 12, marginBottom: 8, paddingBottom: 16, borderBottom: "1px solid #eee", flexWrap: "wrap", alignItems: "center" },
  chipDivider: { width: 1, height: 22, background: "#d8d8e4", margin: "0 2px" },
  authorChip: {
    display: "inline-flex", alignItems: "center", gap: 6,
    border: "1px solid #c9c9e0", borderRadius: 20, padding: "5px 12px 5px 8px",
    fontSize: 14, color: "rgba(0,0,0,0.78)", cursor: "pointer",
    userSelect: "none", transition: "background 0.12s, border-color 0.12s",
  },
  authorChipActive: {
    background: "#e8f0fb", borderColor: "#1975d1", color: "#1975d1",
  },
  note: { display: "flex", gap: 28, paddingTop: 18, paddingBottom: 18 },
  episodeChip: {
    display: "inline-flex", alignItems: "center", gap: 5, alignSelf: "flex-start", marginTop: 2,
    background: "var(--brand-primary-container, #e5e2f3)", color: "var(--brand-primary, rgb(46,56,166))",
    borderRadius: 20, padding: "3px 10px 3px 8px", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
  },
  episodeIcon: { fontSize: 14 },
  metaCol: { width: 220, flexShrink: 0 },
  dateRow: { display: "flex", alignItems: "center", gap: 8, marginBottom: 6 },
  noteFileIcon: { fontSize: 18, color: "rgba(0,0,0,0.45)" },
  dateText: { fontSize: 12, color: "rgba(0,0,0,0.5)", letterSpacing: 0.4, fontWeight: 500 },
  author: { fontSize: 15, fontWeight: 600, color: "rgba(0,0,0,0.85)" },
  clinic: { fontSize: 14, color: "rgba(0,0,0,0.7)", marginTop: 2 },
  role: { fontSize: 14, color: "#1975d1", fontWeight: 500, marginTop: 2 },
  body: { flex: 1, minWidth: 0 },
  bodyHead: { display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 },
  mode: { fontSize: 11, fontWeight: 500, letterSpacing: 0.8, color: "rgba(0,0,0,0.5)" },
  noteTitle: { fontSize: 17, fontWeight: 600, color: "rgba(0,0,0,0.85)", marginTop: 2 },
  actionIcons: { display: "flex", alignItems: "center", gap: 10 },
  actionIcon: { fontSize: 20, color: "rgba(0,0,0,0.5)", cursor: "pointer" },
  checkoutBtn: {
    background: "#e8f0fb", border: 0, borderRadius: 6, color: "#1975d1",
    padding: "6px 12px", cursor: "pointer", fontWeight: 600, fontSize: 13,
    fontFamily: "'Inter', sans-serif",
  },
  caretBtn: {
    width: 28, height: 28, border: 0, background: "transparent", cursor: "pointer",
    display: "inline-flex", alignItems: "center", justifyContent: "center", padding: 0,
  },
  caretIcon: { fontSize: 20, color: "rgba(0,0,0,0.45)" },
  detailsSection: { marginBottom: 16 },
  // Titres de section — étiquette discrète (majuscules, gris, poids medium),
  // même traitement que .ql-editor h1/h2/h3 (editor.css), pour qu'une note
  // complétée garde l'apparence qu'elle avait en édition.
  roHeading1: {
    fontFamily: "'Inter',sans-serif", fontWeight: 500, fontSize: 16,
    lineHeight: '20px', letterSpacing: 0.25, textTransform: 'uppercase',
    color: "rgba(0,0,0,0.54)", margin: '14px 0 6px',
  },
  roHeading2: {
    fontFamily: "'Inter',sans-serif", fontWeight: 500, fontSize: 14,
    lineHeight: '20px', letterSpacing: 0.25, textTransform: 'uppercase',
    color: "rgba(0,0,0,0.54)", margin: '12px 0 5px',
  },
  roHeading3: {
    fontFamily: "'Inter',sans-serif", fontWeight: 500, fontSize: 12,
    lineHeight: '16px', letterSpacing: 0.4, textTransform: 'uppercase',
    color: "rgba(0,0,0,0.54)", margin: '10px 0 4px',
  },
  detailsLabel: {
    fontFamily: "'Inter',sans-serif", fontWeight: 500, fontSize: 14,
    lineHeight: '20px', letterSpacing: 0.25, textTransform: 'uppercase',
    color: "rgba(0,0,0,0.54)",
    marginBottom: 8,
  },
  detailsText: {
    fontSize: 14, color: "rgba(0,0,0,0.82)", lineHeight: 1.5, letterSpacing: 0.25,
  },
  refBtn: {
    position: 'fixed', transform: 'translateX(-50%)', zIndex: 500,
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: '#25245E', color: '#fff', border: 0, borderRadius: 8,
    padding: '8px 14px', font: "500 13px 'Inter', sans-serif", cursor: 'pointer',
    boxShadow: '0 6px 18px rgba(0,0,0,0.22)', whiteSpace: 'nowrap',
  },
  diagRow: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8, marginTop: 2 },
  diagChip: {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    background: '#e8f0fb', border: '1px solid #b3ccf0', borderRadius: 20,
    padding: '4px 12px 4px 8px', fontSize: 13, color: '#1a5fd4', fontWeight: 500,
  },
  diagChipIcon: { fontSize: 14, color: '#1a5fd4' },
  roDiag: { margin: '8px 0', border: '1px solid #b3ccf0', borderRadius: 10, overflow: 'hidden' },
  roDiagHeader: { display: 'flex', alignItems: 'center', gap: 7, background: '#e8f0fb', padding: '6px 12px' },
  roDiagIcon: { fontSize: 16, color: '#1a5fd4' },
  roDiagName: { fontSize: 12, fontWeight: 500, color: '#1a5fd4' },
  roDiagBody: { background: '#f5f9ff', padding: '8px 12px', fontSize: 14, color: 'rgba(0,0,0,0.82)', lineHeight: 1.5, letterSpacing: 0.25 },
  roRef: { margin: '8px 0', padding: '9px 14px', borderLeft: '3px solid #b0a99a', background: '#faf9f6', borderRadius: '0 8px 8px 0' },
  roRefHeader: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 },
  roRefIcon: { fontSize: 15, color: '#8a7f68' },
  roRefSource: { fontSize: 12, fontWeight: 500, color: '#756b56', letterSpacing: '0.02em' },
  roRefBody: { fontSize: 14, fontStyle: 'italic', color: 'rgba(0,0,0,0.68)', lineHeight: 1.5 },
  conclLabelWrap: { marginTop: 4, marginBottom: 4 },
  conclLabel: {
    fontSize: 12, fontWeight: 500, letterSpacing: 0.4,
    color: "rgba(0,0,0,0.45)", marginBottom: 4,
  },
  conclLabelOpen: {
    fontFamily: "'Inter',sans-serif", fontWeight: 500, fontSize: 14,
    lineHeight: '20px', letterSpacing: 0.25, textTransform: 'uppercase',
    color: "rgba(0,0,0,0.54)",
    marginBottom: 8, marginTop: 12,
  },
  conclText: { fontSize: 14, color: "rgba(0,0,0,0.82)", lineHeight: 1.5, letterSpacing: 0.25, marginBottom: 14 },
  fileRow: { display: "flex", gap: 12, flexWrap: "wrap" },
  fileChip: {
    display: "inline-flex", alignItems: "center", gap: 6,
    border: "1px solid #d8d8e4", borderRadius: 20, padding: "5px 14px 5px 10px",
  },
  clipIcon: { fontSize: 16, color: "rgba(0,0,0,0.5)" },
  fileName: { fontSize: 13, color: "#1975d1", fontWeight: 500 },
  fileSize: { fontSize: 12, color: "rgba(0,0,0,0.45)" },
};

window.NotesList = NotesList;
