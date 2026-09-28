/* global React */
// =========================================================
// ActionLog.jsx — « Contenu de la note » : journal des actions en direct,
// tout en bas de la note (voir NoteEditor.jsx). Entièrement ABSENT du DOM
// (return null) tant qu'aucune activité n'est rattachée à la note — pas
// juste masqué. Les entrées viennent de buildActionLog (editor-schema.jsx),
// qui lit les attrs savedAt/author posés à la création/édition de chaque
// chip/outil clinique, ou à la documentation d'un diagnostic (Problème ou
// Antécédent — un diagnostic non documenté n'apparaît pas ici).
// =========================================================
function formatLogTimestamp(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const date = d.toLocaleDateString('fr-CA', { day: '2-digit', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' });
  return date + ' ' + time;
}

// Même glyphe (et couleur) que le chip dans la note (chipLogIcon,
// editor-schema.jsx) — le ℞ est un caractère de police texte, pas un icône
// de la police de symboles, d'où la branche à part plutôt qu'un seul <span>.
function ActionLogIcon({ entry }) {
  if (entry.isRx) return <span className="action-log__icon action-log__icon--rx">℞</span>;
  return <span className={'material-icons-outlined action-log__icon' + (entry.colorClass ? ' ' + entry.colorClass : '')}>{entry.icon}</span>;
}

// Renvoie vers l'élément source dans la note (scroll + flash bref) — pas de
// distinction de type au clic, chaque node atomique porte déjà son propre
// attribut data-* d'identification.
function scrollToLogSource(editor, entry) {
  if (!editor) return;
  // Pour un diagnostic, .dxr-name ET un éventuel renvoi .dxref portent aussi
  // data-diag-id (le renvoi le porte pour la RÉGION qu'il vise, pas pour
  // lui-même) — sans le restreindre à .dxr, un renvoi antérieur dans le DOM
  // ferait défiler vers la mauvaise puce.
  const selector = entry.sourceType === 'chip' ? '[data-cid="' + entry.sourceId + '"]'
    : entry.sourceType === 'clinicalTool' ? '[data-instance-id="' + entry.sourceId + '"]'
    : '.dxr[data-diag-id="' + entry.sourceId + '"]';
  const el = editor.view.dom.querySelector(selector);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.classList.add('action-log-flash');
  setTimeout(function () { el.classList.remove('action-log-flash'); }, 900);
}

function ActionLog({ docJson, editor }) {
  // Replié par défaut : le compte suffit à savoir que la note a des
  // activités rattachées sans pousser tout le reste plus bas à chaque
  // chip/outil ajouté.
  const [collapsed, setCollapsed] = React.useState(true);
  const entries = docJson ? window.buildActionLog(docJson) : [];
  if (!entries.length) return null;
  return (
    <div className="action-log">
      <button type="button" className="action-log__header"
        aria-expanded={!collapsed}
        onClick={function () { setCollapsed(function (v) { return !v; }); }}>
        <span className="action-log__title">Activités de la note ({entries.length})</span>
        <span className="material-icons-outlined action-log__chevron">{collapsed ? 'chevron_right' : 'expand_more'}</span>
      </button>
      {!collapsed && entries.map(function (entry) {
        // Un diagnostic porte son propre verbe (Documenté/Cessé/Modifié —
        // voir buildActionLog) ; les autres activités restent « Ajouté ».
        const verb = entry.verb || 'Ajouté';
        const meta = entry.author
          ? (entry.savedAt ? verb + ' par ' + entry.author + ' le ' + formatLogTimestamp(entry.savedAt) : verb + ' par ' + entry.author)
          : (entry.savedAt ? verb + ' le ' + formatLogTimestamp(entry.savedAt) : '');
        return (
          <button key={entry.key} type="button" className="action-log__row"
            onClick={function () { scrollToLogSource(editor, entry); }}>
            <ActionLogIcon entry={entry} />
            <span className="action-log__body">
              <span className="action-log__row-title">{entry.title}</span>
              {meta && <span className="action-log__meta">{meta}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

window.ActionLog = ActionLog;
