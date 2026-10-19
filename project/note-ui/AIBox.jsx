/* global React */

const GABARITS = ['Canevas', 'Première visite', 'Suivi', 'Consultation SOAP', 'Note de décharge'];

const SAMPLE_TRANSCRIPT = `Patiente de 35 ans, consulte pour brûlures mictionnelles depuis 3 jours. Dysurie, pollakiurie, urgence mictionnelle. Pas de fièvre, pas de douleur lombaire, pas d'hématurie macroscopique. Premier épisode. Pas d'antécédent gynécologique pertinent. Examen : apyrétique, abdomen souple, sensibilité sus-pubienne légère. Bandelette urinaire : leucocytes positifs, nitrites positifs.`;

const SAMPLE_NOTE = `Patiente de 35 ans, consulte pour brûlures mictionnelles depuis 3 jours. Dysurie, pollakiurie, urgence mictionnelle. Pas de fièvre, pas de douleur lombaire, pas d'hématurie macroscopique. Premier épisode. Pas d'antécédent gynécologique pertinent. Examen : apyrétique, abdomen souple, sensibilité sus-pubienne légère. Bandelette urinaire : leucocytes positifs, nitrites positifs.`;

function padTimer(n) {return String(n).padStart(2, '0');}
function fmtTimer(s) {return `${padTimer(Math.floor(s / 3600))}:${padTimer(Math.floor(s % 3600 / 60))}:${padTimer(s % 60)}`;}

function AIBox({ onAddToNote }) {
  const [aiState, setAiState] = React.useState('idle');
  const [gabarit, setGabarit] = React.useState('Canevas');
  const [gabaritOpen, setGabaritOpen] = React.useState(false);
  const [recSec, setRecSec] = React.useState(0);
  const [showPreview, setShowPreview] = React.useState(false);
  const [transcriptExpanded, setTranscriptExpanded] = React.useState(false);
  const [feedbackGiven, setFeedbackGiven] = React.useState(null);

  const timerRef = React.useRef(null);
  const loadRef = React.useRef(null);
  const genRef = React.useRef(null);

  // Cleanup on unmount
  React.useEffect(() => () => {
    clearInterval(timerRef.current);
    clearTimeout(loadRef.current);
    clearTimeout(genRef.current);
  }, []);

  function startRecording() {
    setAiState('recording');
    setRecSec(0);
    setShowPreview(false);
    timerRef.current = setInterval(() => setRecSec((s) => s + 1), 1000);
    setTimeout(() => setShowPreview(true), 2000);
  }

  function pauseRecording() {
    clearInterval(timerRef.current);
    setAiState('paused');
  }

  function resumeRecording() {
    setAiState('recording');
    timerRef.current = setInterval(() => setRecSec((s) => s + 1), 1000);
  }

  function finishRecording() {
    clearInterval(timerRef.current);
    setAiState('loading');
    loadRef.current = setTimeout(() => {
      setAiState('ready');
      setTranscriptExpanded(true);
    }, 2000);
  }

  function generateNote() {
    setAiState('generating');
    genRef.current = setTimeout(() => setAiState('generated'), 2500);
  }

  function resetToIdle() {
    setAiState('idle');
    setRecSec(0);
    setShowPreview(false);
    setTranscriptExpanded(false);
    setFeedbackGiven(null);
  }

  const isRecording = aiState === 'recording';
  const isPaused = aiState === 'paused';
  const isLoading = aiState === 'loading';
  const isReady = aiState === 'ready';
  const isGenerating = aiState === 'generating';
  const isGenerated = aiState === 'generated';

  const showTranscriptChip = aiState !== 'idle';
  // Le canevas ne sert qu'à générer la note depuis une transcription : caché
  // tant qu'aucun enregistrement n'a été lancé.
  const showCanevas = aiState !== 'idle';
  // Même comportement qu'un FloatField (NoteEditor.jsx) : au repos, le libellé
  // est posé dans le cadre ; il remonte sur la bordure dès qu'un
  // enregistrement est lancé.
  const labelFloated = aiState !== 'idle';
  const genBtnPrimary = isReady || isGenerated;
  const genBtnDim = aiState === 'idle' || isLoading || isGenerating;
  const recBtnDim = isLoading || isGenerating;

  return (
    <div style={aiS.box}>
      {/* Legend */}
      <div style={{ ...aiS.legend, ...(labelFloated ? aiS.legendFloating : aiS.legendResting) }}>
        <span className="material-icons" style={{ ...aiS.legendIcon, ...(labelFloated ? {} : aiS.legendIconResting) }}>auto_awesome</span>
        <span style={{ ...aiS.legendLabel, ...(labelFloated ? {} : aiS.legendLabelResting) }}>Assistant IA</span>
      </div>

      {/* Recording bar */}
      {(isRecording || isPaused) &&
      <div style={aiS.recBar}>
          <span style={{ ...aiS.recDot, ...(isPaused ? aiS.recDotPaused : {}) }} />
          <span style={aiS.recStatusLabel}>{isPaused ? 'Enregistrement en pause' : 'Enregistrement en cours'}</span>
          <span style={aiS.recTimer}>{fmtTimer(recSec)}</span>
          {showPreview && <>
            <span style={aiS.recSep}>|</span>
            <span style={aiS.recPreview}>{SAMPLE_TRANSCRIPT.slice(0, 60)}…</span>
          </>}
          <div style={{ flex: 1, minWidth: 8 }} />
          {isRecording &&
        <button style={aiS.outlineBtn} onClick={pauseRecording}>
              <span className="material-icons" style={aiS.btnIcSm}>pause</span>
              Pause
            </button>
        }
          {isPaused &&
        <button style={aiS.outlineBtn} onClick={resumeRecording}>
              <span className="material-icons-outlined" style={aiS.btnIcSm}>mic</span>
              Reprendre (FR)
              <span className="material-icons" style={{ ...aiS.btnIcSm, fontSize: 18 }}>arrow_drop_down</span>
            </button>
        }
          <button style={aiS.primaryBtn} onClick={finishRecording}>
            <span className="material-icons" style={aiS.btnIcSm}>bolt</span>
            Terminer et générer (FR)
            <span className="material-icons" style={{ fontSize: 18 }}>arrow_drop_down</span>
          </button>
        </div>
      }

      {/* Idle / Loading / Ready / Generating / Generated toolbar */}
      {!(isRecording || isPaused) &&
      <div style={aiS.aiRow}>
          {/* Canevas dropdown */}
          {showCanevas &&
          <div style={aiS.gabaritWrap}>
            <button
            style={{ ...aiS.gabaritBtn, ...(gabaritOpen ? aiS.gabaritBtnOpen : {}) }}
            onClick={() => setGabaritOpen((o) => !o)}>
            
              <span>{gabarit}</span>
              <span className="material-icons" style={aiS.gabaritCaret}>arrow_drop_down</span>
            </button>
            {gabaritOpen &&
          <>
                <div style={aiS.ddBg} onClick={() => setGabaritOpen(false)} />
                <div style={aiS.gabaritDrop}>
                  {GABARITS.map((g) =>
              <div key={g}
              style={{ ...aiS.gabaritOption, ...(g === gabarit ? aiS.gabaritOptionActive : {}) }}
              onClick={() => {setGabarit(g);setGabaritOpen(false);}}>
                      <span className="material-icons" style={{ ...aiS.checkIc, opacity: g === gabarit ? 1 : 0 }}>check</span>
                      {g}
                    </div>
              )}
                </div>
              </>
          }
          </div>
          }

          {/* Transcript chip */}
          {showTranscriptChip &&
        <button
          style={{ ...aiS.transcriptChip, ...(isLoading ? aiS.transcriptChipLoading : {}) }}
          onClick={() => !isLoading && setTranscriptExpanded((e) => !e)}>
          
              {isLoading ?
          <span className="material-icons" style={aiS.spinIc}>refresh</span> :
          <span style={aiS.transcriptBadge}>①</span>
          }
              <span>Transcription(s)</span>
              {!isLoading && <span className="material-icons" style={aiS.chipCaret}>arrow_drop_down</span>}
            </button>
        }

          <div style={{ flex: 1 }} />

          {/* Record button */}
          <button
          style={{ ...aiS.actionBtn, ...(recBtnDim ? aiS.dim : {}) }}
          onClick={!recBtnDim ? startRecording : undefined}>
          
            <span className="material-icons-outlined" style={{ ...aiS.actionBtnIc, color: 'var(--mat-sys-primary)' }}>mic</span>
            <span style={{ color: 'var(--mat-sys-primary)', fontWeight: 500 }}>Lancer l'enregistrement (FR)</span>
            <span className="material-icons" style={{ ...aiS.actionBtnIc, color: 'var(--mat-sys-primary)' }}>arrow_drop_down</span>
          </button>

          {/* Generate button */}
          <button
          style={{ ...aiS.actionBtn, ...(genBtnPrimary ? aiS.actionBtnPrimary : {}), ...(genBtnDim ? aiS.dim : {}) }}
          onClick={genBtnPrimary && !isGenerating ? generateNote : undefined}>
          
            <span className="material-icons" style={{ ...aiS.actionBtnIc, color: genBtnPrimary ? '#fff' : 'color-mix(in srgb, var(--mat-sys-on-surface) 55%, transparent)' }}>auto_awesome</span>
            <span style={{ color: genBtnPrimary ? '#fff' : 'color-mix(in srgb, var(--mat-sys-on-surface) 80%, transparent)' }}>Générer une note (FR)</span>
            <span className="material-icons" style={{ ...aiS.actionBtnIc, color: genBtnPrimary ? '#fff' : 'color-mix(in srgb, var(--mat-sys-on-surface) 55%, transparent)' }}>arrow_drop_down</span>
          </button>

          {/* Info */}
          <span className="material-icons-outlined" style={aiS.infoIc}>info</span>
        </div>
      }

      {/* Generating row */}
      {isGenerating &&
      <div style={aiS.generatingRow}>
          <span style={aiS.dots}>・・・</span>
          <span style={aiS.generatingLabel}>Récupération des détails...</span>
        </div>
      }

      {/* Generated note */}
      {isGenerated &&
      <div style={aiS.generatedBox}>
          <button style={aiS.closeBtn} onClick={() => setAiState('ready')}>
            <span className="material-icons" style={{ fontSize: 18 }}>close</span>
          </button>
          <p style={aiS.generatedText}>{SAMPLE_NOTE}</p>

          <div style={aiS.feedbackRow}>
            <span style={aiS.feedbackLabel}>Comment évaluez-vous la note générée ?</span>
            <button style={{ ...aiS.iconBtnSm, ...(feedbackGiven === 'up' ? { background: 'rgba(46,56,166,0.1)' } : {}) }} onClick={() => setFeedbackGiven('up')}>
              <span className="material-icons-outlined" style={{ fontSize: 20, color: feedbackGiven === 'up' ? 'var(--mat-sys-primary)' : 'color-mix(in srgb, var(--mat-sys-on-surface) 55%, transparent)' }}>thumb_up</span>
            </button>
            <button style={{ ...aiS.iconBtnSm, ...(feedbackGiven === 'down' ? { background: 'rgba(230,50,50,0.08)' } : {}) }} onClick={() => setFeedbackGiven('down')}>
              <span className="material-icons-outlined" style={{ fontSize: 20, color: feedbackGiven === 'down' ? 'light-dark(#e53935, #e9a7a5)' : 'color-mix(in srgb, var(--mat-sys-on-surface) 55%, transparent)' }}>thumb_down</span>
            </button>
            <button style={aiS.iconBtnSm}>
              <span className="material-icons-outlined" style={{ fontSize: 20, color: 'color-mix(in srgb, var(--mat-sys-on-surface) 55%, transparent)' }}>border_color</span>
            </button>
          </div>

          <div style={aiS.noteActions}>
            <button style={aiS.outlineActionBtn} onClick={resetToIdle}>
              <span className="material-icons" style={{ fontSize: 16 }}>replay</span>
              Remplacer la note
            </button>
            <button style={aiS.primaryActionBtn} onClick={() => {if (onAddToNote) onAddToNote(SAMPLE_NOTE);resetToIdle();}}>
              <span className="material-icons" style={{ fontSize: 16 }}>add</span>
              Ajouter à la note
            </button>
          </div>
        </div>
      }
    </div>);

}

const BP = 'rgb(46,56,166)';
const BP_HOVER = 'rgb(37,47,150)';

const aiS = {
  box: { position: 'relative', border: '1px solid rgb(217,217,230)', borderRadius: 10, padding: '10px 16px 8px', marginTop: 6, fontFamily: "'Inter',sans-serif" },
  legend: { position: 'absolute', left: 14, display: 'flex', alignItems: 'center', gap: 5, background: 'var(--mat-sys-surface-container-lowest)', padding: '0 6px', pointerEvents: 'none', transition: 'top 0.16s ease' },
  legendFloating: { top: -11 },
  legendResting: { top: 17 },
  legendIcon: { fontSize: 16, color: BP, transition: 'font-size 0.16s ease, color 0.16s ease' },
  legendIconResting: { fontSize: 18, color: 'color-mix(in srgb, var(--mat-sys-on-surface) 45%, transparent)' },
  legendLabel: { fontFamily: 'Inter', fontWeight: 600, fontSize: 13, color: BP, transition: 'font-size 0.16s ease, color 0.16s ease' },
  legendLabelResting: { fontWeight: 400, fontSize: 16, color: 'color-mix(in srgb, var(--mat-sys-on-surface) 55%, transparent)' },

  /* Toolbar row */
  aiRow: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'nowrap' },

  /* Gabarit */
  gabaritWrap: { position: 'relative', flexShrink: 0 },
  gabaritBtn: { display: 'inline-flex', alignItems: 'center', justifyContent: 'space-between', gap: 4, minWidth: 158, borderWidth: 1, borderStyle: 'solid', borderColor: 'rgb(200,200,215)', borderRadius: 8, background: 'var(--mat-sys-surface-container-lowest)', padding: '7px 8px 7px 14px', font: "400 13.5px 'Inter',sans-serif", color: 'color-mix(in srgb, var(--mat-sys-on-surface) 70%, transparent)', whiteSpace: 'nowrap', cursor: 'pointer' },
  gabaritBtnOpen: { borderColor: BP, boxShadow: '0 0 0 3px rgba(46,56,166,0.15)' },
  gabaritCaret: { fontSize: 20, color: 'color-mix(in srgb, var(--mat-sys-on-surface) 40%, transparent)' },
  ddBg: { position: 'fixed', inset: 0, zIndex: 199 },
  gabaritDrop: { position: 'absolute', top: 'calc(100% + 6px)', left: 0, background: 'var(--mat-sys-surface-container-lowest)', border: '1px solid rgb(217,217,230)', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 200, minWidth: 220, padding: '5px 0' },
  gabaritOption: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', font: "400 14px 'Inter',sans-serif", color: 'color-mix(in srgb, var(--mat-sys-on-surface) 80%, transparent)', cursor: 'pointer' },
  gabaritOptionActive: { color: BP, fontWeight: 600 },
  checkIc: { fontSize: 16, color: BP },

  /* Transcript chip */
  transcriptChip: { display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid rgb(200,200,215)', borderRadius: 8, background: 'var(--mat-sys-surface-container-lowest)', padding: '6px 10px', font: "400 13px 'Inter',sans-serif", color: 'color-mix(in srgb, var(--mat-sys-on-surface) 75%, transparent)', cursor: 'pointer', flexShrink: 0 },
  transcriptChipLoading: { opacity: 0.65, cursor: 'default' },
  transcriptBadge: { width: 18, height: 18, borderRadius: '50%', background: BP, color: '#fff', fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  spinIc: { fontSize: 16, color: BP, animation: 'ai-spin 0.75s linear infinite' },
  chipCaret: { fontSize: 18, color: 'color-mix(in srgb, var(--mat-sys-on-surface) 40%, transparent)' },

  /* Action buttons */
  actionBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid rgb(200,200,215)', borderRadius: 8, background: 'var(--mat-sys-surface-container-lowest)', padding: '7px 12px', font: "400 13.5px 'Inter',sans-serif", color: 'color-mix(in srgb, var(--mat-sys-on-surface) 80%, transparent)', whiteSpace: 'nowrap', flexShrink: 0, cursor: 'pointer' },
  actionBtnPrimary: { background: BP, borderColor: BP, color: '#fff' },
  actionBtnIc: { fontSize: 18 },
  dim: { opacity: 0.42, cursor: 'default', pointerEvents: 'none' },
  infoIc: { fontSize: 20, color: 'color-mix(in srgb, var(--mat-sys-on-surface) 40%, transparent)', cursor: 'pointer', flexShrink: 0 },

  /* Recording bar */
  recBar: { display: 'flex', alignItems: 'center', gap: 10, minHeight: 40 },
  recDot: { width: 10, height: 10, borderRadius: '50%', background: '#e53935', flexShrink: 0, animation: 'ai-blink 1.2s ease-in-out infinite' },
  recDotPaused: { background: '#9e9e9e', animation: 'none' },
  recStatusLabel: { fontSize: 13.5, fontWeight: 600, color: 'color-mix(in srgb, var(--mat-sys-on-surface) 80%, transparent)', whiteSpace: 'nowrap' },
  recTimer: { fontSize: 13.5, fontWeight: 500, color: 'color-mix(in srgb, var(--mat-sys-on-surface) 60%, transparent)', fontVariantNumeric: 'tabular-nums' },
  recSep: { color: 'color-mix(in srgb, var(--mat-sys-on-surface) 25%, transparent)', userSelect: 'none' },
  recPreview: { fontSize: 13.5, color: 'color-mix(in srgb, var(--mat-sys-on-surface) 50%, transparent)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180, flexShrink: 1 },

  /* Rec buttons */
  outlineBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid rgb(200,200,215)', borderRadius: 8, background: 'var(--mat-sys-surface-container-lowest)', padding: '7px 14px', font: "500 13.5px 'Inter',sans-serif", color: 'color-mix(in srgb, var(--mat-sys-on-surface) 80%, transparent)', whiteSpace: 'nowrap', flexShrink: 0, cursor: 'pointer' },
  primaryBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, background: BP, border: `1px solid ${BP}`, borderRadius: 8, padding: '7px 14px', font: "500 13.5px 'Inter',sans-serif", color: '#fff', whiteSpace: 'nowrap', flexShrink: 0, cursor: 'pointer' },
  btnIcSm: { fontSize: 16 },

  /* Transcript area */
  transcriptArea: { position: 'relative', marginTop: 14, background: 'rgb(250,250,252)', border: '1px solid light-dark(#e2e2f0, #26264a)', borderRadius: 8, padding: '12px 40px 12px 16px', maxHeight: 200, overflowY: 'auto' },
  transcriptText: { font: "400 13px/1.65 'Inter',sans-serif", color: 'color-mix(in srgb, var(--mat-sys-on-surface) 75%, transparent)', whiteSpace: 'pre-wrap', margin: 0 },
  closeBtn: { position: 'absolute', top: 10, right: 10, width: 26, height: 26, borderRadius: 6, border: 0, background: 'transparent', cursor: 'pointer', color: 'color-mix(in srgb, var(--mat-sys-on-surface) 45%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center' },

  /* Generating */
  generatingRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '16px 0 6px', justifyContent: 'center' },
  dots: { fontSize: 20, letterSpacing: 5, color: BP },
  generatingLabel: { fontSize: 13.5, color: 'color-mix(in srgb, var(--mat-sys-on-surface) 55%, transparent)' },

  /* Generated */
  generatedBox: { position: 'relative', marginTop: 14, background: 'var(--mat-sys-surface-container-lowest)', border: '1px solid light-dark(#e2e2ee, #292947)', borderRadius: 8, padding: '16px 40px 16px 16px' },
  generatedText: { font: "400 13.5px/1.72 'Inter',sans-serif", color: 'color-mix(in srgb, var(--mat-sys-on-surface) 80%, transparent)', whiteSpace: 'pre-line', margin: 0 },
  feedbackRow: { display: 'flex', alignItems: 'center', gap: 6, marginTop: 12 },
  feedbackLabel: { fontSize: 12.5, color: 'color-mix(in srgb, var(--mat-sys-on-surface) 50%, transparent)', flex: 1 },
  iconBtnSm: { width: 30, height: 30, borderRadius: 6, background: 'transparent', border: 0, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
  noteActions: { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 },
  outlineActionBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid rgb(200,200,215)', borderRadius: 8, background: 'var(--mat-sys-surface-container-lowest)', padding: '8px 16px', font: "500 13.5px 'Inter',sans-serif", color: 'color-mix(in srgb, var(--mat-sys-on-surface) 80%, transparent)', cursor: 'pointer' },
  primaryActionBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, border: `1px solid ${BP}`, background: BP, borderRadius: 8, padding: '8px 16px', font: "500 13.5px 'Inter',sans-serif", color: '#fff', cursor: 'pointer' }
};

window.AIBox = AIBox;