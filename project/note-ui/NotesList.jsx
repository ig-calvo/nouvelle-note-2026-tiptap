/* global React */
const NOTE_ITEMS_TEMPLATE = [
  {
    date: "2 JUILLET 2026 13:45",
    author: "%%DOCTOR%%",
    clinic: "%%CLINIC%%",
    role: "Médecin de famille",
    mode: "PRÉSENTIEL",
    title: "Retour post-imagerie — douleur au flanc",
    icons: [],
    diagnostics: ["Colique néphrétique"],
    episodeId: "ep-demo-flanc",
    details: "Patient de retour suite à la TDM. Douleur en nette amélioration depuis l'analgésie.\nTDM : Calcul urétéral droit de 4 mm, sans dilatation significative.",
    conclusion: "Impression : Colique néphrétique confirmée, calcul de 4 mm.\nPlan : Poursuite de l'analgésie et hydratation. Filtration des urines. Retour si fièvre, douleur non contrôlée ou absence de progression dans 2 semaines.",
    files: [{ name: "TDM abdomino-pelvien.pdf", size: "1.4MB" }],
    // Documents transmis lors de cette visite. Les notes de démonstration
    // n'ont pas de contenu Tiptap : sans ces documents figés, leur bouton
    // « Checkout » n'aurait rien à montrer (voir noteDocs plus bas).
    txDocs: [
      { id: 'demo-rx-2', kind: 'prescription', title: 'Ordonnance',
        items: [
          { id: 'i1', label: 'Naproxen 500 mg', sub: '1 co PO BID avec nourriture, 30 co, 15 jours', variant: 'renouvellement' },
          { id: 'i2', label: 'Tamsulosine 0,4 mg', sub: '1 caps PO DIE au coucher, 30 caps, 30 jours', variant: 'nouvelle' },
        ],
        recipients: [{ id: 'r-demo-pjc', name: 'PJC Jean-Coutu — Centre-ville', address: '1211 rue King Ouest, Sherbrooke (Québec) J1H 1R2', phone: '819 565-9595', fax: '819 565-9673', favorite: true, channel: 'fax' }],
        complete: true, transmitted: true, attachments: ['Liste de médicaments active'], note: '' },
    ],
  },
  {
    date: "2 JUILLET 2026 09:10",
    author: "%%DOCTOR%%",
    clinic: "%%CLINIC%%",
    role: "Médecin de famille",
    mode: "PRÉSENTIEL",
    title: "Douleur au flanc droit",
    icons: [],
    diagnostics: [],
    episodeId: "ep-demo-flanc",
    details: "Motif : Douleur au flanc droit depuis 2 jours, irradiant vers l'aine. Pas d'hématurie visible. Pas de fièvre.\nObjectif : Punch rénal droit positif. Abdomen souple. Bandelette urinaire : Sang traces, Leuco négatif.",
    conclusion: "Impression : Suspicion de colique néphrétique.\nPlan : Requête d'imagerie (TDM abdomino-pelvien sans contraste) envoyée. Analgésie prescrite. Patient dirigé vers l'imagerie, retour prévu avec les résultats.",
    files: [],
    txDocs: [
      { id: 'demo-img-1', kind: 'imaging', title: 'TDM abdomino-pelvien',
        items: [{ id: 'i1', label: 'TDM abdomino-pelvien', sub: 'Sans contraste · Urgent · Suspicion de lithiase urinaire' }],
        recipients: [{ id: 'r-demo-chus', name: 'Radiologie CHUS — Hôpital Fleurimont', address: '3001 12e Avenue Nord, Sherbrooke (Québec) J1H 5N4', phone: '819 346-1110', fax: '819 346-1112', favorite: true, channel: 'fax' }],
        complete: true, transmitted: true, attachments: ['Note clinique'], note: '' },
      { id: 'demo-rx-1', kind: 'prescription', title: 'Ordonnance',
        items: [{ id: 'i1', label: 'Naproxen 500 mg', sub: '1 co PO BID avec nourriture, 20 co, 10 jours', variant: 'nouvelle' }],
        recipients: [{ id: 'r-demo-pjc', name: 'PJC Jean-Coutu — Centre-ville', address: '1211 rue King Ouest, Sherbrooke (Québec) J1H 1R2', phone: '819 565-9595', fax: '819 565-9673', favorite: true, channel: 'fax' }],
        complete: true, transmitted: true, attachments: ['Liste de médicaments active'], note: '' },
    ],
  },
  {
    date: "8 DÉCEMBRE 2025 09:15",
    author: "Dr Marc Lefebvre",
    clinic: "%%CLINIC%%",
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
    clinic: "%%CLINIC%%",
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

// Chip en lecture (note complétée, liste des notes) : son texte seulement,
// comme à l'impression — ni pastille, ni icône, ni état (chipPrintText,
// editor-schema.jsx). Rencontre inline entity : la note doit rester lisible
// dans les anciens systèmes et en PDF.
function ChipText({ attrs, keyProp }) {
  return <span key={keyProp}>{window.chipPrintText(attrs)}</span>;
}

// Rendu read-only d'un nœud inline (texte avec marques, chip, ou renvoi à un
// diagnostic). dxModel (diagnosticThreads sur le doc COMPLET — voir DocView)
// donne le numéro du fil visé, comme la décoration dxNumberingPlugin en édition.
function DocInline({ node, keyProp, dxModel }) {
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
  if (node.type === 'chip') return <ChipText attrs={node.attrs} keyProp={keyProp} />;
  if (node.type === 'diagnosticRef') {
    var a = node.attrs || {};
    var thread = dxModel && (dxModel.byKey[a.dxKey] || (a.diagId && dxModel.byId[a.diagId] && dxModel.byKey[dxModel.byId[a.diagId].dxKey]));
    return <span key={keyProp} style={nlStyles.roDxref}>{thread ? thread.number : '?'}</span>;
  }
  return null;
}

// Rendu read-only d'un document Tiptap complet (note complétée) : titres,
// paragraphes, chips, blocs de référence, régions/renvois diagnostic
// (numéro, Cessé, remplace — mêmes informations qu'en édition, voir
// editor-schema.jsx). Remplace l'ancien rendu à marqueurs {{CHIP}}/{{DIAG}}/
// {{REF}} — le doc JSON est déjà structuré.
//
// dxModel : passer explicitement diagnosticThreads(doc) quand `blocks` est
// une TRANCHE du document (ConclusionPreview, sous la ligne uniquement) — le
// numéro d'un fil dépend de la PREMIÈRE occurrence dans tout le document
// (Détails ET Conclusion), jamais calculable depuis la seule Conclusion.
// Recalculé depuis `doc` sinon (DocView appelé avec le document complet).
function DocView({ doc, blocks, dxModel }) {
  var source = blocks || (doc && doc.content);
  if (!source) return null;
  var model = dxModel || (doc && window.diagnosticThreads ? window.diagnosticThreads(doc) : null);
  var out = source.map(function(node, bi) {
    // Ligne de séparation Détails / Conclusion — même repère qu'en édition
    // (libellé au-dessus du trait), mais figé : une note complétée est signée,
    // sa conclusion ne se redécoupe plus.
    if (node.type === 'sectionSplit') {
      return (
        <div key={'ss-' + bi} style={nlStyles.roSplit}>
          <div style={nlStyles.roSplitLabel}>{window.CONCLUSION_LABEL || 'Conclusion'}</div>
          <div style={nlStyles.roSplitRule} />
        </div>
      );
    }
    if (node.type === 'heading') {
      var level = (node.attrs && node.attrs.level) || 2;
      var Tag = 'h' + Math.min(3, Math.max(1, level));
      var hStyle = level <= 1 ? nlStyles.roHeading1 : level === 2 ? nlStyles.roHeading2 : nlStyles.roHeading3;
      return React.createElement(Tag, { key: 'h-' + bi, style: hStyle },
        window.separateAdjacentChips(node.content).map(function(c, ci) { return <DocInline key={ci} node={c} keyProp={ci} dxModel={model} />; }));
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
      return <p key={'p-' + bi} style={{ margin: '0 0 8px' }}>{window.separateAdjacentChips(kids).map(function(c, ci) { return <DocInline key={ci} node={c} keyProp={ci} dxModel={model} />; })}</p>;
    }
    if (node.type === 'diagnosticRegion') {
      var a = node.attrs || {};
      var bodyParas = (node.content || []).filter(function(p) { return (p.content || []).length; });
      var entry = model && model.byId[a.id];
      var isCesse = a.status === 'cesse';
      return (
        <div key={'db-' + bi} style={nlStyles.roDiag}>
          <div style={nlStyles.roDiagHeader}>
            {entry && <span style={nlStyles.roDiagNum}>{entry.number}</span>}
            <span style={Object.assign({}, nlStyles.roDiagName, isCesse ? nlStyles.roDiagNameCesse : null)}>{a.name}</span>
            {a.code && <span style={nlStyles.roDiagCode}>{a.code}</span>}
            {isCesse && <span style={nlStyles.roDiagStatus}>Cessé</span>}
            {a.replaces && <span style={nlStyles.roDiagSub}>remplace : {a.replaces.name}</span>}
          </div>
          <div style={nlStyles.roDiagBody}>
            {bodyParas.map(function(p, pi) {
              return (
                <p key={pi} style={nlStyles.roDiagLine}>
                  <span className="material-icons-outlined" aria-hidden="true" style={nlStyles.roDiagArrow}>subdirectory_arrow_right</span>
                  {window.separateAdjacentChips(p.content).map(function(c, ci) { return <DocInline key={ci} node={c} keyProp={ci} dxModel={model} />; })}
                </p>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  });
  return <React.Fragment>{out}</React.Fragment>;
}

function NotesList({ doctorName = "Véronique Charland", clinicName = "Clinique du Centre-ville", extraNotes = [] }) {
  const NOTE_ITEMS = [
    ...extraNotes,
    ...NOTE_ITEMS_TEMPLATE.map(n => ({
      ...n,
      author: n.author === "%%DOCTOR%%" ? doctorName : n.author,
      clinic: n.clinic === "%%CLINIC%%" ? clinicName : n.clinic,
    })),
  ];
  const [openNotes, setOpenNotes] = React.useState({});
  // Note dont on regarde le checkout (lecture seule) — bouton « Checkout ».
  const [checkoutNote, setCheckoutNote] = React.useState(null);
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

  // Aperçu d'une note repliée : la CONCLUSION de la note, telle que
  // délimitée par la ligne de séparation de l'éditeur. Toutes les notes de
  // cette liste sont complétées (signées) — les brouillons, eux, ne sortent
  // pas de l'éditeur (voir NoteStartCards) et ne sont donc pas concernés.
  //   - note rédigée dans l'éditeur (n.doc) : les blocs sous la ligne ;
  //   - note de démonstration (pas de doc Tiptap) : son champ `conclusion` ;
  //   - rien sous la ligne : état vide explicite, jamais un aperçu muet qui
  //     laisserait croire à un bug d'affichage.
  function ConclusionPreview({ note }) {
    if (note.doc && window.conclusionBlocks) {
      var blocks = window.conclusionBlocks(note.doc);
      if (!window.conclusionIsEmpty(note.doc)) {
        // dxModel sur le DOCUMENT COMPLET, pas la seule tranche `blocks` — un
        // diagnostic peut avoir été numéroté en Détails, sa reprise ici doit
        // porter le même numéro (voir l'en-tête de DocView).
        var dxModel = window.diagnosticThreads ? window.diagnosticThreads(note.doc) : null;
        return <div style={nlStyles.conclPreviewText}><DocView blocks={blocks} dxModel={dxModel} /></div>;
      }
    } else if (note.conclusion && note.conclusion.trim()) {
      return (
        <div style={nlStyles.conclPreviewText}>
          {note.conclusion.split("\n").map(function(line, j) {
            return <p key={j} style={{ margin: "0 0 4px 0" }}>{line}</p>;
          })}
        </div>
      );
    }
    return (
      <div style={nlStyles.conclEmpty}>
        <span className="material-icons-outlined" style={nlStyles.conclEmptyIcon}>remove</span>
        Aucune conclusion à cette note
      </div>
    );
  }

  // Documents transmissibles d'une note déjà complétée, reconstruits depuis son
  // contenu Tiptap + l'état de transmission figé à la complétion (`txState`).
  // Même fonction que l'éditeur (editor-schema.jsx), donc même regroupement et
  // mêmes statuts — le checkout d'une note passée n'est pas une vue à part,
  // c'est le même checkout en lecture seule.
  // Les notes de démonstration (NOTE_ITEMS_TEMPLATE) n'ont pas de `doc` : elles
  // ne retournent rien et n'affichent donc pas le bouton.
  function noteDocs(n) {
    // Notes de démonstration : documents figés dans le gabarit (txDocs).
    if (n.txDocs) return n.txDocs;
    if (!n.doc || !window.scanDoc || !window.buildTransmissionDocs) return [];
    try { return window.buildTransmissionDocs(window.scanDoc(n.doc), n.txState || {}); }
    catch (e) { return []; }
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
        <div style={{ padding: '24px 0', textAlign: 'center', color: 'color-mix(in srgb, var(--mat-sys-on-surface) 45%, transparent)', fontSize: 14 }}>Aucune note ne correspond aux filtres actifs.</div>
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
            borderTop: i > 0 ? '1px solid var(--mat-sys-outline-variant)' : 'none',
            borderLeft: epTotal > 1 ? '3px solid var(--brand-primary, var(--mat-sys-primary))' : 'none',
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
                {/* Champ confidentiel — visible seulement par l'auteur, même
                    ici où toutes les notes du dossier sont listées (voir
                    l'exception d'accès, filtre par consentement actif). */}
                {n.confidential && n.author === doctorName &&
                  <span className="confidential-lock--badge"
                    title="Contient un champ confidentiel">
                    <span className="material-icons-outlined">lock</span>
                  </span>}
                <div style={{ flex: 1 }} />
                <div style={nlStyles.actionIcons}>
                  {noteDocs(n).length > 0 &&
                    <button style={nlStyles.checkoutBtn}
                      title="Voir les documents transmis pour cette note"
                      onClick={() => setCheckoutNote(n)}>
                      Checkout
                    </button>}
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

              {/* Note repliée : la conclusion sert d'aperçu (c'est elle qui
                  porte l'impression et le plan, donc ce qu'on cherche en
                  survolant le journal). Dépliée, elle réapparaît à sa place
                  dans le document, on ne la montre pas deux fois. */}
              {!isOpen && (
                <div style={nlStyles.conclPreview}>
                  <div style={nlStyles.conclLabel}>Conclusion</div>
                  <ConclusionPreview note={n} />
                </div>
              )}

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

      {/* Checkout d'une note déjà complétée : même vue que pendant la
          rédaction, mais figée — pas d'action de transmission, pas d'item
          « Note » (elle est déjà signée), pas de pied de page. */}
      {checkoutNote &&
        <window.TransmissionModal
          readOnly
          docs={noteDocs(checkoutNote)}
          doctorName={checkoutNote.author}
          institution={checkoutNote.clinic}
          noteInfo={{ title: checkoutNote.title, date: checkoutNote.date }}
          onClose={() => setCheckoutNote(null)} />}
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
      {icon && <span className="material-icons-outlined" style={{ ...nlStyles.chipIcon, color: active ? 'var(--mat-sys-primary)' : 'color-mix(in srgb, var(--mat-sys-on-surface) 50%, transparent)' }}>{icon}</span>}
      <span>{name}</span>
    </span>
  );
}

const nlStyles = {
  card: {
    background: "var(--mat-sys-surface-container-lowest)", borderRadius: 8, padding: "18px 22px 22px",
    boxShadow: "0 2px 4px 0 rgba(37,36,94,.14), 0 0 5px 0 rgba(37,36,94,.12)",
    fontFamily: "'Inter', sans-serif",
  },
  title: {
    fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 22,
    color: "color-mix(in srgb, var(--mat-sys-on-surface) 88%, transparent)", marginBottom: 16,
  },
  filterRow: { display: "flex", gap: 18, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 16 },
  filterField: { display: "flex", flexDirection: "column", gap: 4 },
  filterLabel: { fontSize: 13, color: "color-mix(in srgb, var(--mat-sys-on-surface) 55%, transparent)" },
  filterBox: {
    display: "flex", alignItems: "center",
    border: "1px solid #c4c4c4", borderRadius: 6,
    height: 40, padding: "0 8px 0 12px",
  },
  filterValue: { fontSize: 14, color: "color-mix(in srgb, var(--mat-sys-on-surface) 78%, transparent)" },
  filterIcon: { marginLeft: "auto", fontSize: 20, color: "color-mix(in srgb, var(--mat-sys-on-surface) 50%, transparent)" },
  chipRow: { display: "flex", gap: 12, marginBottom: 8, paddingBottom: 16, borderBottom: "1px solid var(--mat-sys-outline-variant)", flexWrap: "wrap", alignItems: "center" },
  chipDivider: { width: 1, height: 22, background: "var(--mat-sys-outline-variant)", margin: "0 2px" },
  authorChip: {
    display: "inline-flex", alignItems: "center", gap: 6,
    border: "1px solid #c9c9e0", borderRadius: 20, padding: "5px 12px 5px 8px",
    fontSize: 14, color: "color-mix(in srgb, var(--mat-sys-on-surface) 78%, transparent)", cursor: "pointer",
    userSelect: "none", transition: "background 0.12s, border-color 0.12s",
  },
  authorChipActive: {
    background: "color-mix(in srgb, var(--mat-sys-primary) 10%, var(--mat-sys-surface-container-lowest))", borderColor: "var(--mat-sys-primary)", color: "var(--mat-sys-primary)",
  },
  note: { display: "flex", gap: 28, paddingTop: 18, paddingBottom: 18 },
  episodeChip: {
    display: "inline-flex", alignItems: "center", gap: 5, alignSelf: "flex-start", marginTop: 2,
    background: "var(--brand-primary-container, light-dark(#e5e2f3, #2b244c))", color: "var(--brand-primary, var(--mat-sys-primary))",
    borderRadius: 20, padding: "3px 10px 3px 8px", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
  },
  episodeIcon: { fontSize: 14 },
  metaCol: { width: 220, flexShrink: 0 },
  dateRow: { display: "flex", alignItems: "center", gap: 8, marginBottom: 6 },
  noteFileIcon: { fontSize: 18, color: "color-mix(in srgb, var(--mat-sys-on-surface) 45%, transparent)" },
  dateText: { fontSize: 12, color: "color-mix(in srgb, var(--mat-sys-on-surface) 50%, transparent)", letterSpacing: 0.4, fontWeight: 500 },
  author: { fontSize: 15, fontWeight: 600, color: "color-mix(in srgb, var(--mat-sys-on-surface) 85%, transparent)" },
  clinic: { fontSize: 14, color: "color-mix(in srgb, var(--mat-sys-on-surface) 70%, transparent)", marginTop: 2 },
  role: { fontSize: 14, color: "var(--mat-sys-primary)", fontWeight: 500, marginTop: 2 },
  body: { flex: 1, minWidth: 0 },
  bodyHead: { display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 },
  mode: { fontSize: 11, fontWeight: 500, letterSpacing: 0.8, color: "color-mix(in srgb, var(--mat-sys-on-surface) 50%, transparent)" },
  noteTitle: { fontSize: 17, fontWeight: 600, color: "color-mix(in srgb, var(--mat-sys-on-surface) 85%, transparent)", marginTop: 2 },
  actionIcons: { display: "flex", alignItems: "center", gap: 10 },
  actionIcon: { fontSize: 20, color: "color-mix(in srgb, var(--mat-sys-on-surface) 50%, transparent)", cursor: "pointer" },
  checkoutBtn: {
    background: "color-mix(in srgb, var(--mat-sys-primary) 10%, var(--mat-sys-surface-container-lowest))", border: 0, borderRadius: 6, color: "var(--mat-sys-primary)",
    padding: "6px 12px", cursor: "pointer", fontWeight: 600, fontSize: 13,
    fontFamily: "'Inter', sans-serif",
  },
  caretBtn: {
    width: 28, height: 28, border: 0, background: "transparent", cursor: "pointer",
    display: "inline-flex", alignItems: "center", justifyContent: "center", padding: 0,
  },
  caretIcon: { fontSize: 20, color: "color-mix(in srgb, var(--mat-sys-on-surface) 45%, transparent)" },
  detailsSection: { marginBottom: 16 },
  // Titres de section — étiquette discrète (majuscules, gris, poids medium),
  // même traitement que .ql-editor h1/h2/h3 (editor.css), pour qu'une note
  // complétée garde l'apparence qu'elle avait en édition.
  roHeading1: {
    fontFamily: "'Inter',sans-serif", fontWeight: 500, fontSize: 16,
    lineHeight: '20px', letterSpacing: 0.25, textTransform: 'uppercase',
    color: "color-mix(in srgb, var(--mat-sys-on-surface) 54%, transparent)", margin: '14px 0 6px',
  },
  roHeading2: {
    fontFamily: "'Inter',sans-serif", fontWeight: 500, fontSize: 14,
    lineHeight: '20px', letterSpacing: 0.25, textTransform: 'uppercase',
    color: "color-mix(in srgb, var(--mat-sys-on-surface) 54%, transparent)", margin: '12px 0 5px',
  },
  roHeading3: {
    fontFamily: "'Inter',sans-serif", fontWeight: 500, fontSize: 12,
    lineHeight: '16px', letterSpacing: 0.4, textTransform: 'uppercase',
    color: "color-mix(in srgb, var(--mat-sys-on-surface) 54%, transparent)", margin: '10px 0 4px',
  },
  detailsLabel: {
    fontFamily: "'Inter',sans-serif", fontWeight: 500, fontSize: 14,
    lineHeight: '20px', letterSpacing: 0.25, textTransform: 'uppercase',
    color: "color-mix(in srgb, var(--mat-sys-on-surface) 54%, transparent)",
    marginBottom: 8,
  },
  detailsText: {
    fontSize: 14, color: "color-mix(in srgb, var(--mat-sys-on-surface) 82%, transparent)", lineHeight: 1.5, letterSpacing: 0.25,
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
    background: 'color-mix(in srgb, var(--mat-sys-primary) 10%, var(--mat-sys-surface-container-lowest))', border: '1px solid #b3ccf0', borderRadius: 20,
    padding: '4px 12px 4px 8px', fontSize: 13, color: 'var(--mat-sys-primary)', fontWeight: 500,
  },
  diagChipIcon: { fontSize: 14, color: 'var(--mat-sys-primary)' },
  // Même rendu que le style « actuel » de l'éditeur (editor.css, .diag-style-actuel
  // .dxr-*) : pas de boîte, pastille noire numérotée, nom en petites capitales
  // espacées, corps décalé avec une flèche « ↳ » sur chaque ligne.
  roDiag: { margin: '14px 0 12px' },
  roDiagHeader: { display: 'flex', flexWrap: 'wrap', rowGap: 2, alignItems: 'center', gap: 6, padding: '6px 10px 4px 12px' },
  roDiagName: { fontSize: 12, fontWeight: 500, color: 'light-dark(#4a6f94, #b4c7da)', letterSpacing: '0.07em', textTransform: 'uppercase', padding: '1px 4px' },
  roDiagNameCesse: { textDecoration: 'line-through', textDecorationColor: 'light-dark(#b04a4a, #deb0b0)' },
  roDiagNum: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: 18, height: 18, borderRadius: '50%',
    background: '#000', color: '#fff', fontSize: 11, fontWeight: 600, lineHeight: 1, flexShrink: 0,
  },
  roDiagCode: { fontSize: 11, fontWeight: 500, color: 'color-mix(in srgb, var(--mat-sys-on-surface) 50%, transparent)', fontVariantNumeric: 'tabular-nums' },
  roDiagStatus: {
    fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em',
    color: 'light-dark(#7a1f26, #e8a6ab)', background: 'light-dark(#ecdfe0, #462a2c)', borderRadius: 4, padding: '2px 6px',
  },
  roDiagSub: { fontSize: 11, fontStyle: 'italic', color: 'color-mix(in srgb, var(--mat-sys-on-surface) 55%, transparent)', marginLeft: 'auto', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  roDiagBody: { padding: '1px 12px 8px 28px', fontSize: 14, color: 'color-mix(in srgb, var(--mat-sys-on-surface) 82%, transparent)', lineHeight: 1.5, letterSpacing: 0.25 },
  roDiagLine: { position: 'relative', margin: '0 0 1px' },
  roDiagArrow: { position: 'absolute', left: -16, top: 4, width: 18, fontSize: 15, lineHeight: 1, color: '#9dbbd6', display: 'flex', justifyContent: 'center', userSelect: 'none', pointerEvents: 'none' },
  roDxref: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    minWidth: 20, height: 18, padding: '0 5px', margin: '0 1px', borderRadius: 9,
    background: 'var(--brand-primary-container, light-dark(#e3ecfa, #24344c))', color: 'var(--brand-primary, var(--mat-sys-primary))',
    fontWeight: 700, fontSize: 11, lineHeight: 1, verticalAlign: 1,
  },
  roRef: { margin: '8px 0', padding: '9px 14px', borderLeft: '3px solid #b0a99a', background: 'light-dark(#faf9f6, #484028)', borderRadius: '0 8px 8px 0' },
  roRefHeader: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 },
  roRefIcon: { fontSize: 15, color: 'var(--mat-sys-on-surface-variant)' },
  roRefSource: { fontSize: 12, fontWeight: 500, color: 'var(--mat-sys-on-surface-variant)', letterSpacing: '0.02em' },
  roRefBody: { fontSize: 14, fontStyle: 'italic', color: 'color-mix(in srgb, var(--mat-sys-on-surface) 68%, transparent)', lineHeight: 1.5 },
  roSplit: { margin: '14px 0 6px' },
  roSplitLabel: {
    fontFamily: "'Inter',sans-serif", fontWeight: 500, fontSize: 14,
    lineHeight: '20px', letterSpacing: 0.25, textTransform: 'uppercase',
    color: "color-mix(in srgb, var(--mat-sys-on-surface) 54%, transparent)", marginBottom: 3,
  },
  roSplitRule: { height: 0, borderTop: '1px solid var(--brand-primary, var(--mat-sys-primary))', opacity: 0.35 },
  conclPreview: { marginBottom: 8 },
  // Aperçu borné à 3 lignes : c'est un résumé de journal, pas la note.
  // Déplier la note reste le geste pour tout lire.
  conclPreviewText: {
    fontSize: 14, color: "color-mix(in srgb, var(--mat-sys-on-surface) 82%, transparent)", lineHeight: 1.5, letterSpacing: 0.25,
    display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
  },
  conclEmpty: {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    fontSize: 13, fontStyle: 'italic', color: "color-mix(in srgb, var(--mat-sys-on-surface) 45%, transparent)",
  },
  conclEmptyIcon: { fontSize: 16, color: "color-mix(in srgb, var(--mat-sys-on-surface) 35%, transparent)" },
  conclLabelWrap: { marginTop: 4, marginBottom: 4 },
  conclLabel: {
    fontSize: 12, fontWeight: 500, letterSpacing: 0.4,
    color: "color-mix(in srgb, var(--mat-sys-on-surface) 45%, transparent)", marginBottom: 4,
  },
  conclLabelOpen: {
    fontFamily: "'Inter',sans-serif", fontWeight: 500, fontSize: 14,
    lineHeight: '20px', letterSpacing: 0.25, textTransform: 'uppercase',
    color: "color-mix(in srgb, var(--mat-sys-on-surface) 54%, transparent)",
    marginBottom: 8, marginTop: 12,
  },
  conclText: { fontSize: 14, color: "color-mix(in srgb, var(--mat-sys-on-surface) 82%, transparent)", lineHeight: 1.5, letterSpacing: 0.25, marginBottom: 14 },
  fileRow: { display: "flex", gap: 12, flexWrap: "wrap" },
  fileChip: {
    display: "inline-flex", alignItems: "center", gap: 6,
    border: "1px solid var(--mat-sys-outline-variant)", borderRadius: 20, padding: "5px 14px 5px 10px",
  },
  clipIcon: { fontSize: 16, color: "color-mix(in srgb, var(--mat-sys-on-surface) 50%, transparent)" },
  fileName: { fontSize: 13, color: "var(--mat-sys-primary)", fontWeight: 500 },
  fileSize: { fontSize: 12, color: "color-mix(in srgb, var(--mat-sys-on-surface) 45%, transparent)" },
};

window.NotesList = NotesList;
