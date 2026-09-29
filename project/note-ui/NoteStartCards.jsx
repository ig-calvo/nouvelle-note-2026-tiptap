/* global React */
// =========================================================
// NoteStartCards.jsx — points de départ affichés avant l'ouverture
// de la note (tweak "Points de départ", off par défaut). Un point de
// départ pré-remplit la note et peut la lier à une note existante :
//   - Nouvelle note : structure vierge
//   - Depuis la dernière note : reprend les sections de la dernière
//     note complétée et lie les deux notes au même épisode de soin
//     (chacune garde son propre timestamp — voir NotesList.jsx)
//   - Continuer la note : reprend un brouillon sauvegardé ; un seul
//     bouton, avec un menu déroulant s'il y en a plus qu'un
//   - Note intelligente : rédaction assistée (flux existant)
// =========================================================
function NoteStartCards({ onPick, hideSmart, hasLastNote, drafts }) {
  const [hover, setHover] = React.useState(null);
  const [draftMenuOpen, setDraftMenuOpen] = React.useState(false);
  const draftList = drafts || [];

  const cards = [
    { key: 'nouvelle', icon: 'note_add', iconColor: 'color-mix(in srgb, var(--mat-sys-on-surface) 78%, transparent)', overline: 'Note clinique', title: 'Nouvelle note' },
    hasLastNote && { key: 'derniere', icon: 'post_add', iconColor: 'color-mix(in srgb, var(--mat-sys-on-surface) 78%, transparent)', overline: 'Note médicale', title: 'Depuis la dernière note' },
    { key: 'intelligente', icon: 'auto_awesome', iconColor: 'light-dark(#6967d1, #aaa9e5)', overline: 'Rédaction assistée', title: 'Note intelligente' },
  ].filter(function (c) { return c && !(hideSmart && c.key === 'intelligente'); });

  function pickDraft(id) {
    setDraftMenuOpen(false);
    if (onPick) onPick('continuer', id);
  }

  return (
    <div style={nscStyles.row}>
      {cards.map(function (c) {
        const isHover = hover === c.key;
        return (
          <button
            key={c.key}
            style={Object.assign({}, nscStyles.card, isHover ? nscStyles.cardHover : null)}
            onMouseEnter={function () { setHover(c.key); }}
            onMouseLeave={function () { setHover(null); }}
            onClick={function () { if (onPick) onPick(c.key); }}>
            <span className="material-icons-outlined" style={Object.assign({}, nscStyles.icon, { color: c.iconColor })}>{c.icon}</span>
            <span style={nscStyles.textCol}>
              <span style={nscStyles.overline}>{c.overline}</span>
              <span style={nscStyles.title}>{c.title}</span>
            </span>
          </button>
        );
      })}

      {draftList.length > 0 &&
        <div style={{ position: 'relative' }}>
          <button
            style={Object.assign({}, nscStyles.card, hover === 'continuer' ? nscStyles.cardHover : null)}
            onMouseEnter={function () { setHover('continuer'); }}
            onMouseLeave={function () { setHover(null); }}
            onClick={function () {
              if (draftList.length === 1) { pickDraft(draftList[0].id); }
              else { setDraftMenuOpen(function (o) { return !o; }); }
            }}>
            <span className="material-icons-outlined" style={Object.assign({}, nscStyles.icon, { color: 'light-dark(#b3742e, #e8c9a6)' })}>edit_note</span>
            <span style={nscStyles.textCol}>
              <span style={nscStyles.overline}>{draftList.length > 1 ? draftList.length + ' brouillons' : 'Brouillon'}</span>
              <span style={nscStyles.title}>Continuer la note</span>
            </span>
            {draftList.length > 1 &&
              <span className="material-icons-outlined" style={nscStyles.caret}>arrow_drop_down</span>}
          </button>
          {draftMenuOpen && draftList.length > 1 &&
            <React.Fragment>
              <div style={nscStyles.ddBg} onClick={function () { setDraftMenuOpen(false); }} />
              <div style={nscStyles.dropdown}>
                {draftList.map(function (d) {
                  return (
                    <div key={d.id} style={nscStyles.ddItem} onClick={function () { pickDraft(d.id); }}>
                      <span style={nscStyles.ddTitle}>{d.raison || 'Note sans titre'}</span>
                      <span style={nscStyles.ddMeta}>{d.savedLabel}</span>
                    </div>
                  );
                })}
              </div>
            </React.Fragment>}
        </div>}
    </div>
  );
}

const nscStyles = {
  row: { display: 'flex', gap: 16, alignItems: 'stretch', flexWrap: 'wrap' },
  card: {
    flex: '0 1 300px', display: 'flex', alignItems: 'center', gap: 16,
    background: 'var(--mat-sys-surface-container-lowest)', border: '1px solid var(--mat-sys-outline-variant)', borderRadius: 10,
    padding: '16px 22px', cursor: 'pointer', textAlign: 'left',
    boxShadow: '0 1px 2px 0 rgba(37,36,94,.06)',
    transition: 'border-color 140ms ease, box-shadow 140ms ease, transform 140ms ease',
    fontFamily: "'Inter', sans-serif", position: 'relative', width: '100%',
  },
  cardHover: { borderColor: '#bdbce0', boxShadow: '0 3px 10px 0 rgba(37,36,94,.12)', transform: 'translateY(-1px)' },
  icon: { fontSize: 30, flexShrink: 0 },
  textCol: { display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 },
  overline: { fontSize: 13, color: 'color-mix(in srgb, var(--mat-sys-on-surface) 55%, transparent)', fontWeight: 400 },
  title: { fontFamily: "'Poppins', sans-serif", fontWeight: 500, fontSize: 21, color: 'color-mix(in srgb, var(--mat-sys-on-surface) 82%, transparent)', lineHeight: 1.1 },
  caret: { marginLeft: 'auto', fontSize: 22, color: 'color-mix(in srgb, var(--mat-sys-on-surface) 35%, transparent)', flexShrink: 0 },
  ddBg: { position: 'fixed', inset: 0, zIndex: 200 },
  dropdown: {
    position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 201,
    background: 'var(--mat-sys-surface-container-lowest)', border: '1px solid var(--mat-sys-outline-variant)', borderRadius: 10,
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: '6px 0', maxHeight: 260, overflowY: 'auto',
  },
  ddItem: { display: 'flex', flexDirection: 'column', gap: 2, padding: '9px 16px', cursor: 'pointer' },
  ddTitle: { fontSize: 14, color: 'color-mix(in srgb, var(--mat-sys-on-surface) 82%, transparent)', fontWeight: 500 },
  ddMeta: { fontSize: 12, color: 'color-mix(in srgb, var(--mat-sys-on-surface) 50%, transparent)' },
};

window.NoteStartCards = NoteStartCards;
