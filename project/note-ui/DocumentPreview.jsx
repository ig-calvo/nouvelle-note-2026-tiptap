/* global React */
// =========================================================
// DocumentPreview — rendu façon PDF d'un document transmissible
// (ordonnance ou requête). Gabarit HTML/CSS partagé par la
// colonne Aperçu du checkout, le faux dialogue d'impression et
// l'écran de fax (voir PLAN-transmission-ordonnance.md §5.4).
// =========================================================

// Coordonnées fictives de la clinique — cohérentes avec le thème
// « Clinique du Centre-ville / Sherbrooke » déjà utilisé ailleurs
// dans le prototype (destinataires de CheckoutModal notamment).
const DP_CLINIC = {
  phone: '819 555-0100',
  fax: '819 555-0101',
  address: '12 rue Principale, Sherbrooke (Québec) J1H 4E4',
};

// Petite « signature manuscrite » en SVG — évite de dépendre d'une image.
function DPSignatureGlyph() {
  return (
    <svg width="86" height="30" viewBox="0 0 86 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 22 C 10 6, 16 6, 18 16 C 20 26, 25 14, 30 12 C 35 10, 33 22, 38 20 C 45 17, 44 6, 52 8 C 60 10, 55 24, 63 20 C 71 16, 70 8, 78 10"
        stroke="#25245E" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </svg>
  );
}

// Référence pseudo-stable dérivée de l'id du document — juste pour l'aspect
// visuel (« Réf. : … »), pas une vraie garantie d'unicité cryptographique.
function dpFakeRef(seed) {
  var s = String(seed || 'doc');
  var h = 0;
  for (var i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) >>> 0; }
  var hex = h.toString(16).padStart(8, '0');
  return hex.slice(0, 8) + '-' + hex.slice(0, 4) + '-4' + hex.slice(1, 4) + '-a' + hex.slice(2, 5) + '-' + hex + hex.slice(0, 4);
}

function dpFmtDate(d) {
  d = d || new Date();
  function pad(n) { return String(n).padStart(2, '0'); }
  return d.getFullYear() + '/' + pad(d.getMonth() + 1) + '/' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}

function DocumentPreview({ doc, doctorName, institution, scale }) {
  const P = (window.NOTE_DATA && window.NOTE_DATA.PATIENT) || {};
  const items = (doc && doc.items) || [];
  const isRx = doc && doc.kind === 'prescription';
  const complete = !!(doc && doc.complete);
  const style = scale ? { transform: 'scale(' + scale + ')', transformOrigin: 'top left' } : undefined;

  return (
    <div style={Object.assign({}, dp.page, style)}>
      <div style={dp.head}>
        <div style={dp.headLeft}>
          <div style={dp.doctorName}>{doctorName || 'Médecin actuel'}</div>
          <div style={dp.clinicName}>{institution || 'Établissement actuel'}</div>
          <div style={dp.clinicMeta}>{DP_CLINIC.address}</div>
          <div style={dp.clinicMeta}>Tél. : {DP_CLINIC.phone} / Téléc. : {DP_CLINIC.fax}</div>
        </div>
      </div>

      <div style={dp.patientRow}>
        <div style={dp.patientCol}>
          <div><b>Nom :</b> {P.name || 'Patient'}</div>
          <div><b>NAM :</b> {P.ramq || '—'}</div>
        </div>
        <div style={dp.patientCol}>
          <div><b>DDN :</b> {P.dob || '—'} ({P.age || '—'})</div>
          <div><b>Téléphone :</b> {P.phone || '—'}</div>
        </div>
      </div>

      <div style={dp.divider} />

      <div style={dp.bodyHead}>
        {isRx
          ? <span style={dp.rxGlyph}>℞</span>
          : <span style={dp.reqTitle}>{doc ? doc.title : 'Requête'}</span>}
        <span style={dp.dateRight}>Date : {dpFmtDate()}</span>
      </div>

      <div style={dp.body}>
        {items.map(function (it, i) {
          return (
            <div key={it.id || i} style={dp.item}>
              <div style={Object.assign({}, dp.itemLabel, it.ceased ? dp.itemLabelCeased : {})}>{it.label}</div>
              {it.sub ? <div style={dp.itemSub}>{it.sub}</div> : null}
              {it.ceased ? <div style={dp.itemCeased}>Cessé</div> : null}
            </div>
          );
        })}
        {items.length === 0 && <div style={dp.itemSub}>Aucun contenu.</div>}
      </div>

      <div style={dp.endLine}>— Fin du document —</div>

      <div style={dp.footer}>
        {complete
          ? <React.Fragment>
              <div style={dp.footerRow}>
                <div style={dp.footerText}>
                  <div>Document complété électroniquement</div>
                  <div>Par {doctorName || 'Médecin actuel'} le {dpFmtDate()}</div>
                  <div>Réf. : {dpFakeRef(doc && doc.id)}</div>
                </div>
                <div style={dp.sigBlock}>
                  <div style={dp.sigLabel}>Signature :</div>
                  <DPSignatureGlyph />
                </div>
              </div>
            </React.Fragment>
          : <div style={dp.draftNote}>Aperçu — document non complété (brouillon, sans valeur légale)</div>
        }
        <div style={dp.confidential}>Ce document est confidentiel.</div>
      </div>
    </div>
  );
}

const dp = {
  page: {
    width: 420, minHeight: 560, background: '#fff', color: '#1a1a1a',
    fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 12.5, lineHeight: 1.45,
    padding: '22px 24px', boxSizing: 'border-box', border: '1px solid #e4e4ec',
  },
  head: { marginBottom: 10 },
  headLeft: {},
  doctorName: { fontWeight: 700, fontSize: 13.5 },
  clinicName: { fontWeight: 700 },
  clinicMeta: { fontSize: 11, color: '#333' },

  patientRow: { display: 'flex', gap: 18, marginTop: 10, fontSize: 12 },
  patientCol: { flex: 1 },

  divider: { borderTop: '1px solid #999', margin: '10px 0' },

  bodyHead: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 },
  rxGlyph: { fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 22 },
  reqTitle: { fontWeight: 700, fontSize: 13.5 },
  dateRight: { fontSize: 11.5, color: '#333' },

  body: { minHeight: 160 },
  item: { marginBottom: 12 },
  itemLabel: { fontWeight: 700 },
  itemLabelCeased: { textDecoration: 'line-through', color: '#888', fontWeight: 400 },
  itemSub: { fontSize: 11.5, color: '#333', marginTop: 2 },
  itemCeased: { fontSize: 10.5, color: '#b3261e', marginTop: 2, fontStyle: 'italic' },

  endLine: { textAlign: 'center', color: '#888', fontSize: 11, margin: '14px 0' },

  footer: { marginTop: 20, borderTop: '1px solid #ccc', paddingTop: 10 },
  footerRow: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 },
  footerText: { fontSize: 10.5, color: '#333', lineHeight: 1.5 },
  sigBlock: { textAlign: 'center' },
  sigLabel: { fontSize: 10, color: '#666', marginBottom: 2 },
  draftNote: { fontSize: 11, color: '#a15c00', fontStyle: 'italic' },
  confidential: { fontSize: 10, color: '#888', marginTop: 8, textAlign: 'right' },
};

window.DocumentPreview = DocumentPreview;
