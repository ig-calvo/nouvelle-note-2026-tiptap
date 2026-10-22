/* global React */
// =========================================================
// presentation-mode.jsx — mode présentation de la note intelligente.
//
// Activé par ?presentation dans l'URL (voir Note Clinique.html). Une
// personne présente le prototype à des médecins : elle manipule seule, le
// client regarde (partage d'écran). Ce fichier ne contient que l'outillage
// du présentateur — un rail de chapitres, des aide-mémoire et quelques
// amorces de geste. Le prototype lui-même n'est pas modifié : tout passe
// par les événements window déjà écoutés par NoteEditor / editor-field.
//
// Les sept chapitres suivent les tâches 2 à 8 du script de test
// (Confluence VDP « Script V1 »). Le consentement, l'entrevue, la tâche 9
// et la clôture sont de la recherche, pas de la démo : exclus.
// =========================================================

// Réglages figés pendant la présentation : la démo montre la vision Q1 2027,
// sans option de test ni piste qui change d'une séance à l'autre. Appliqués
// par-dessus les valeurs par défaut ET les écarts locaux (localStorage) des
// Tweaks, pour que la démo soit la même d'une machine à l'autre.
const PRESENTATION_TWEAKS = {
  showClinicalTools: true,
  portalActive: true,
  startPoints: false,
  reviewingMode: false,
  checkoutSuggestions: false,
  simulateTxFailure: false,
  groupRequests: false,
  templateTextProposed: false,
  aiProposals: false,
  summaryAddToNote: false,
  inlineFieldEdit: true,
  formOpenMode: 'auto',
  themeMode: 'clair',
};

function isPresentationMode() {
  try { return new URLSearchParams(window.location.search).has('presentation'); }
  catch (e) { return false; }
}

// `needsNote` : le chapitre suppose une note ouverte (ouverte à l'arrivée).
// `focus` : sélecteur CSS de l'élément à mettre en évidence, s'il existe.
// `actions` : amorces de geste — pour gagner du temps, jamais obligatoires.
const PRESENTATION_CHAPTERS = [
  {
    id: 'note', label: 'La note', needsNote: false,
    say: [
      'Un patient fictif, un dossier réaliste : tout se passe dans la note, sans changer d’écran.',
      'Le sommaire reste à droite : c’est le dossier du patient.',
    ],
    show: ['Écran d’arrivée, sans rien toucher.', 'Ouvrir une note.'],
    actions: [{ label: 'Ouvrir la note', run: function (c) { c.openNote(); } }],
  },
  {
    id: 'commandes', label: 'Commandes / et +', needsNote: true, focus: '.nf-add',
    say: [
      'Deux portes d’entrée vers les mêmes fonctions : la touche « / » et le « + » à gauche du curseur.',
      'Ordonnance, diagnostic, outils cliniques, requêtes : tout s’insère sans quitter le texte.',
    ],
    show: ['Taper « / » au début d’une ligne.', 'Montrer le « + » à gauche du curseur.', 'Échap : rien ne reste dans la note.'],
    actions: [{ label: 'Ouvrir le menu +', run: function () { window.dispatchEvent(new CustomEvent('ct-addmenu-open')); } }],
  },
  {
    id: 'outils', label: 'Outils cliniques', needsNote: true,
    say: [
      'Les outils cliniques sont réorganisés : Favoris pour ce qu’on utilise tous les jours, Groupes pour explorer.',
    ],
    show: ['Ouvrir le sélecteur d’outils.', 'Distinguer Favoris et Groupes.', 'Ajouter un outil à la note.'],
    actions: [{ label: 'Ouvrir les outils cliniques', run: function () { window.dispatchEvent(new CustomEvent('ct-picker-open')); } }],
  },
  {
    id: 'dx', label: 'Diagnostic /dx', needsNote: true,
    say: [
      'On documente un diagnostic en le cherchant : CIM-10 et SNOMED CT.',
      'Il devient une région de la note, reliée au problème du dossier.',
    ],
    show: ['Taper « /dx » puis quelques lettres.', 'Choisir un résultat : c’est une région, pas du texte.'],
    actions: [{ label: 'Amorcer /dx', run: function () { window.dispatchEvent(new CustomEvent('note:summary-add', { detail: { command: 'dx' } })); } }],
  },
  {
    id: 'prescrire', label: 'Prescrire', needsNote: true,
    say: [
      'Trois façons de prescrire, au choix selon l’habitude : le « + », « /rx » + Entrée, ou « /rx » suivi du nom tapé comme du texte.',
      'La liste vient du profil du patient : actifs, échus et cessés, chacun avec son étiquette. Rien à retourner chercher dans le sommaire.',
    ],
    show: [
      'Chemin A : « + » puis Prescriptions.',
      'Chemin B : « /rx » puis Entrée, filtres à droite.',
      'Chemin C : « /rx » puis le nom du médicament.',
    ],
    actions: [{ label: 'Amorcer /rx', run: function () { window.dispatchEvent(new CustomEvent('note:summary-add', { detail: { command: 'rx' } })); } }],
  },
  {
    id: 'apres', label: 'Après la prescription', needsNote: true,
    say: [
      'La puce dit ce qu’elle est : une prescription, avec son état. Si un champ manque, elle le montre à sa place.',
      'On corrige sur place ou dans le formulaire complet, comme on préfère.',
    ],
    show: [
      'Une prescription doit exister (chapitre précédent).',
      'Cliquer une valeur de la puce (ex. la fréquence) : on la change sur place.',
      'Survoler la puce, « Modifier » : le formulaire complet.',
      'Retirer : curseur après la puce, Retour arrière (sélectionne la puce), Retour arrière encore : « Garder en texte » ou « Supprimer ».',
    ],
    actions: [],
  },
  {
    id: 'transmettre', label: 'Transmettre', needsNote: true, focus: '.ProseMirror .chip--rx',
    say: [
      'On finit là où on a prescrit : « Prescrire » sur la puce ouvre l’envoi rapide, sans quitter la note.',
      'Une puce transmise le dit (double coche) et ne se modifie plus.',
    ],
    show: [
      'Survoler la puce : « Prescrire ».',
      'Envoi rapide : ajouter une pharmacie (les favorites sont en tête), puis « Compléter et envoyer ».',
      'La puce affiche la double coche ; le pied de note passe à 1/1.',
    ],
    actions: [],
  },
];

const PM_CSS = `
  .app.presentation > :first-child,
  .app.presentation .main-row > :first-child { pointer-events: none; }
  .pm-root { position: fixed; right: 16px; bottom: 16px; z-index: 1000; width: 296px; max-width: calc(100vw - 32px);
    display: flex; flex-direction: column; gap: 8px; font: var(--mat-sys-body-medium); color: var(--mat-sys-on-surface); }
  .pm-card { background: var(--mat-sys-surface-container-lowest); border: 1px solid var(--mat-sys-outline-variant);
    border-radius: 16px; box-shadow: 0 6px 24px rgba(0,0,0,.18); overflow: hidden; }
  .pm-notes { padding: 12px 16px 14px; display: flex; flex-direction: column; gap: 10px; max-height: 54vh; overflow-y: auto; }
  .pm-notes h4 { margin: 0 0 4px; font: var(--mat-sys-label-medium); font-weight: 600; letter-spacing: .04em;
    text-transform: uppercase; color: var(--mat-sys-on-surface-variant); }
  .pm-notes ul { margin: 0; padding-left: 18px; display: flex; flex-direction: column; gap: 4px; }
  .pm-bar { display: flex; align-items: center; gap: 4px; padding: 6px 6px 6px 14px; }
  .pm-title { flex: 1; min-width: 0; display: flex; flex-direction: column; line-height: 1.25; }
  .pm-title small { color: var(--mat-sys-on-surface-variant); font: var(--mat-sys-label-small); }
  .pm-title b { font: var(--mat-sys-title-small); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pm-ib { appearance: none; border: 0; background: transparent; color: var(--mat-sys-on-surface-variant);
    width: 32px; height: 32px; border-radius: 16px; display: grid; place-items: center; cursor: pointer; }
  .pm-ib:hover:not(:disabled) { background: var(--mat-sys-surface-container-high); color: var(--mat-sys-on-surface); }
  .pm-ib:disabled { opacity: .38; cursor: default; }
  .pm-ib:focus-visible, .pm-dot:focus-visible, .pm-act:focus-visible { outline: 2px solid var(--mat-sys-primary); outline-offset: 2px; }
  .pm-ib .material-symbols-outlined { font-size: 22px; }
  .pm-ib--s { width: 28px; height: 28px; border-radius: 14px; }
  .pm-ib--s .material-symbols-outlined { font-size: 18px; }
  .pm-foot { display: flex; align-items: center; gap: 2px; padding: 0 8px 8px 14px; }
  .pm-dots { flex: 1; min-width: 0; display: flex; gap: 4px; padding-right: 6px; }
  .pm-dot { appearance: none; border: 0; padding: 0; height: 6px; flex: 1; border-radius: 3px; cursor: pointer;
    background: var(--mat-sys-outline-variant); }
  .pm-dot[data-done="true"] { background: var(--mat-sys-primary); opacity: .45; }
  .pm-dot[aria-current="step"] { background: var(--mat-sys-primary); opacity: 1; }
  .pm-act { appearance: none; border: 1px solid var(--mat-sys-outline); background: transparent; color: var(--mat-sys-primary);
    font: var(--mat-sys-label-large); border-radius: 18px; padding: 6px 14px; cursor: pointer; align-self: flex-start; }
  .pm-act:hover { background: var(--mat-sys-primary-container); }
  .pm-hint { color: var(--mat-sys-on-surface-variant); font: var(--mat-sys-label-small); }
  .pm-ring { position: fixed; z-index: 999; pointer-events: none; border-radius: 12px;
    box-shadow: 0 0 0 3px var(--mat-sys-primary), 0 0 0 8px color-mix(in srgb, var(--mat-sys-primary) 25%, transparent);
    transition: all .2s ease; }
  .pm-show { position: fixed; right: 16px; bottom: 16px; z-index: 1000; }
  @media (prefers-reduced-motion: reduce) { .pm-ring { transition: none; } }
`;

// Chapitre de départ : #ch=N dans l'URL (survit au rechargement de « Recommencer »).
function pmChapterFromHash() {
  var m = /ch=(\d+)/.exec(window.location.hash || '');
  var n = m ? parseInt(m[1], 10) - 1 : 0;
  return n >= 0 && n < PRESENTATION_CHAPTERS.length ? n : 0;
}

function PresentationMode({ noteOpen, onOpenNote }) {
  const [idx, setIdx] = React.useState(pmChapterFromHash);
  const [notesOpen, setNotesOpen] = React.useState(true);
  // « À dire » est caché par défaut : c'est le texte du présentateur, pas
  // quelque chose à laisser traîner sous les yeux du client en partage d'écran.
  const [sayOpen, setSayOpen] = React.useState(false);
  const [hidden, setHidden] = React.useState(false);
  const [ring, setRing] = React.useState(null);
  const ch = PRESENTATION_CHAPTERS[idx];
  const last = PRESENTATION_CHAPTERS.length - 1;

  function go(n) { setIdx(Math.max(0, Math.min(last, n))); }
  // Relatif et fonctionnel : deux clics rapprochés avancent de deux chapitres.
  function step(d) { setIdx(function (n) { return Math.max(0, Math.min(last, n + d)); }); }
  function restart() {
    window.location.hash = '#ch=1';
    window.location.reload();
  }

  const stepRef = React.useRef(step);
  stepRef.current = step;

  // Un chapitre qui suppose une note ouverte l'ouvre à l'arrivée. Tiptap se
  // charge en asynchrone (esm.sh) : sur un rechargement directement à un
  // chapitre avancé (#ch=5), ouvrir l'éditeur avant tiptap:ready le fait planter.
  React.useEffect(function () {
    try { window.history.replaceState(null, '', '#ch=' + (idx + 1)); } catch (e) {}
    if (!ch.needsNote || noteOpen) return undefined;
    if (window.Tiptap) { onOpenNote(); return undefined; }
    function whenReady() { onOpenNote(); }
    window.addEventListener('tiptap:ready', whenReady, { once: true });
    return function () { window.removeEventListener('tiptap:ready', whenReady); };
  }, [idx]);

  // Raccourcis : Ctrl+Alt+flèches / H. Une flèche seule appartient à l'éditeur.
  React.useEffect(function () {
    function onKey(e) {
      if (!(e.ctrlKey && e.altKey)) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); stepRef.current(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); stepRef.current(-1); }
      else if (e.code === 'KeyH') { e.preventDefault(); setHidden(function (h) { return !h; }); }
    }
    window.addEventListener('keydown', onKey, true);
    return function () { window.removeEventListener('keydown', onKey, true); };
  }, []);

  // Anneau de mise en évidence : relu périodiquement (l'élément apparaît, bouge ou disparaît avec la note).
  React.useEffect(function () {
    if (!ch.focus || hidden) { setRing(null); return undefined; }
    function measure() {
      var el = document.querySelector(ch.focus);
      if (!el) { setRing(null); return; }
      var r = el.getBoundingClientRect();
      if (!r.width || !r.height) { setRing(null); return; }
      setRing(function (p) {
        return p && p.top === r.top && p.left === r.left && p.width === r.width && p.height === r.height
          ? p : { top: r.top, left: r.left, width: r.width, height: r.height };
      });
    }
    measure();
    var t = setInterval(measure, 400);
    return function () { clearInterval(t); };
  }, [idx, hidden, noteOpen]);

  const ctx = { openNote: onOpenNote };

  if (hidden) {
    return (
      <div className="pm-show">
        <style>{PM_CSS}</style>
        <button type="button" className="pm-ib pm-card" aria-label="Afficher le rail de présentation" title="Afficher (Ctrl+Alt+H)"
          onClick={function () { setHidden(false); }}>
          <span className="material-symbols-outlined" aria-hidden="true">slideshow</span>
        </button>
      </div>
    );
  }

  return (
    <React.Fragment>
      <style>{PM_CSS}</style>
      {ring && <div className="pm-ring" aria-hidden="true" style={{ top: ring.top - 4, left: ring.left - 4, width: ring.width + 8, height: ring.height + 8 }} />}
      {/* mousedown refusé sur les boutons : le curseur reste dans la note, sinon
          cliquer une amorce ferme le menu /rx qu'elle vient d'ouvrir. */}
      <section className="pm-root" aria-label="Présentation"
        onMouseDown={function (e) { if (e.target.closest && e.target.closest('button')) e.preventDefault(); }}>
        {(notesOpen || sayOpen) &&
          <div className="pm-card pm-notes" id="pm-notes">
            {sayOpen &&
              <div id="pm-say">
                <h4>À dire</h4>
                <ul>{ch.say.map(function (s, i) { return <li key={i}>{s}</li>; })}</ul>
              </div>}
            {notesOpen &&
              <React.Fragment>
                <div>
                  <h4>Gestes</h4>
                  <ul>{ch.show.map(function (s, i) { return <li key={i}>{s}</li>; })}</ul>
                </div>
                {ch.actions.map(function (a) {
                  return <button key={a.label} type="button" className="pm-act" onClick={function () { a.run(ctx); }}>{a.label}</button>;
                })}
                <span className="pm-hint">Ctrl+Alt+←/→ : chapitre · Ctrl+Alt+H : masquer</span>
              </React.Fragment>}
          </div>}
        <div className="pm-card">
          <div className="pm-bar">
            <div className="pm-title">
              <small>Chapitre {idx + 1} sur {PRESENTATION_CHAPTERS.length}</small>
              <b>{ch.label}</b>
            </div>
            <button type="button" className="pm-ib" aria-label="Chapitre précédent" disabled={idx === 0}
              onClick={function () { step(-1); }}>
              <span className="material-symbols-outlined" aria-hidden="true">chevron_left</span>
            </button>
            <button type="button" className="pm-ib" aria-label="Chapitre suivant" disabled={idx === last}
              onClick={function () { step(1); }}>
              <span className="material-symbols-outlined" aria-hidden="true">chevron_right</span>
            </button>
          </div>
          <div className="pm-foot">
            <div className="pm-dots" role="list">
              {PRESENTATION_CHAPTERS.map(function (c, i) {
                return (
                  <button key={c.id} type="button" role="listitem" className="pm-dot" data-done={i < idx}
                    aria-current={i === idx ? 'step' : undefined} aria-label={'Chapitre ' + (i + 1) + ' : ' + c.label}
                    title={c.label} onClick={function () { go(i); }} />
                );
              })}
            </div>
            <button type="button" className="pm-ib pm-ib--s" aria-expanded={sayOpen} aria-controls="pm-say"
              aria-label={sayOpen ? 'Masquer « À dire »' : 'Afficher « À dire »'}
              title={sayOpen ? 'Masquer « À dire »' : 'Afficher « À dire »'}
              onClick={function () { setSayOpen(function (v) { return !v; }); }}>
              <span className="material-symbols-outlined" aria-hidden="true">{sayOpen ? 'voice_over_off' : 'record_voice_over'}</span>
            </button>
            <button type="button" className="pm-ib pm-ib--s" aria-expanded={notesOpen} aria-controls="pm-notes"
              aria-label={notesOpen ? 'Masquer les gestes' : 'Afficher les gestes'}
              title={notesOpen ? 'Masquer les gestes' : 'Afficher les gestes'}
              onClick={function () { setNotesOpen(function (v) { return !v; }); }}>
              <span className="material-symbols-outlined" aria-hidden="true">{notesOpen ? 'speaker_notes_off' : 'speaker_notes'}</span>
            </button>
            <button type="button" className="pm-ib pm-ib--s" aria-label="Recommencer la démonstration" title="Recommencer (recharge la page)"
              onClick={restart}>
              <span className="material-symbols-outlined" aria-hidden="true">restart_alt</span>
            </button>
            <button type="button" className="pm-ib pm-ib--s" aria-label="Masquer le rail" title="Masquer (Ctrl+Alt+H)"
              onClick={function () { setHidden(true); }}>
              <span className="material-symbols-outlined" aria-hidden="true">visibility_off</span>
            </button>
          </div>
        </div>
      </section>
    </React.Fragment>
  );
}
