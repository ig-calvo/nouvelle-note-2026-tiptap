/* global React */

// Base de démo des Problèmes/Antécédents — partagée avec /dx (diagnostics.jsx,
// sommaireDxSeed) : c'est la MÊME liste qu'un pick « Sommaire » du picker
// propose, pas une liste à part comme l'ancienne PROBLEMS d'editor-data.jsx.
var DX_SEED = window.sommaireDxSeed();

var INIT_DATA = {
  results: [],
  programs: [],
  tasks: [],
  vitals: [
    { left:L('Poids'),        mid:'62 kg',           right:'08/12/2025' },
    { left:L('Pression'),     mid:'118/74 mmHg',     right:'08/12/2025' },
    { left:L('Fréq. cardiaque'), mid:'72 bpm',        right:'08/12/2025' },
    { left:L('Taille'),       mid:'165 cm',           right:'08/12/2025' },
    { left:L('IMC'),          mid:'22,8',             right:'08/12/2025' },
  ],
  // Lignes {id, name, code, since} / {id, name, code, status, resolvedOn} —
  // voir diagnostics.jsx (sommaireDxSeed, mergeSommaireDx). La mise en forme
  // {left, mid, right, title} est calculée à l'affichage par
  // sommaireDxRowView, jamais stockée : dxView plus bas fusionne cette base
  // avec ce que la note en cours documente (E2).
  problems: DX_SEED.problems,
  history: DX_SEED.history,
  allergies: [
    { name:L('Aucune allergie connue'), type:'none', muted:true },
  ],
  family: [
    { left:L('Nulligeste'),             mid:'' },
    { left:L('Cycles réguliers'),       mid:'' },
    { left:L('Contraception…'),         mid:L('depuis 5 ans') },
    { left:L('Antécédents…'),           mid:L('Aucun pertinent') },
    { left:L('Antécédents chirurgi…'),  mid:L('Aucun') },
  ],
  meds: [
    { name:L('Contraceptif…'),      detail:L('1 co DIE — actif'),  status:'active',  pinned:true },
    { name:L('Tylenol 100 mg'),     detail:L('1 co PRN — actif'),  status:'active' },
    { name:L('Tylenol 500 mg'),     detail:L('2 co DIE — échue'),  status:'echue',   date:'02/2026' },
    { name:L('Nitrofurantoïne…'),   detail:L('cessée (ITU)'),       status:'cessée',  date:'12/2025' },
  ],
  immun: [
    { left:L('HPV (Gardasil…'),             mid:L('série complète'),      right:'2010' },
    { left:L('dCaT (Tétanos-diphtérie)'),   mid:'',                    right:'2022' },
    { left:L('Influenza'),                   mid:L('à jour'),              right:'2025' },
    { left:L('COVID-19'),                    mid:L('primaire + rappels'),   right:'2023' },
  ],
  habits: [
    { left:L('Tabac'),   name:L('Tabac'),   mid:L('Non-fumeuse'),         detail:L('Non-fumeuse') },
    { left:L('Alcool'),  name:L('Alcool'),  mid:L('Occasionnel (social)'), detail:L('Occasionnel (social)') },
    { left:L('Drogues'), name:L('Drogues'), mid:L('Aucune'),               detail:L('Aucune') },
  ],
};

// Boîtes et ordre par défaut du sommaire du DME (PatientDashboardController,
// setupSummaryBoxIdList). Absentes volontairement : DSQ (bascule de
// fonctionnalité) et Requêtes - Physimed (rôle ROLE_WEB_ORDERWEB).
// `link` : boîte réduite à son titre, comme dans le DME — elle ouvre un autre
// module, n'a ni lignes ni « + » et ne se glisse pas vers la note.
var SECTION_CFG = [
  { id:'tasks',    icon:'check_box',      label:t('summary.taches.label'),                    add:true  },
  { id:'clinicalTools', icon:'handyman',  label:t('summary.outilsCliniques.label'),          link:true },
  { id:'vitals',   icon:'monitor_heart',  label:t('summary.signesVitaux.label'),             add:true,  list:true },
  { id:'habits',   icon:'nutrition',      label:t('summary.habitudesVieContexteSocial.label'), add:true, list:true },
  { id:'programs', icon:'assignment_turned_in', label:t('summary.programmes.label'),          add:true,  list:true },
  { id:'allergies',icon:'eco',            label:t('summary.allergies.label'),                 add:true,  list:true },
  { id:'meds',     icon:'medication',     label:t('summary.medications.label'),               add:false, list:true, dots:true },
  { id:'results',  icon:'science',        label:t('summary.resultats.label'),                 add:true,  list:true },
  { id:'requests', icon:'request_page',   label:t('summary.requetes.label'),                  link:true },
  { id:'immun',    icon:'vaccines',       label:t('summary.immunisationVaccins.label'),   add:true,  list:true },
  { id:'problems', icon:'healing',        label:t('summary.problemes.label'),                 add:true,  list:true },
  { id:'history',  icon:'assignment',     label:t('summary.antecedents.label'),               add:true,  list:true },
  { id:'family',   icon:'folder_open',    label:t('summary.antecedentsFamiliaux.label'),     add:true,  list:true },
];

var MEDS_STATUS_COLOR = { active:'#1b8a3f', echue:'#c07a00', cessée:'#c62828', texte:'var(--mat-sys-primary)' };

// addToNote (tweak « Le « + » du sommaire ajoute dans la note », piste de
// vision — rencontre inline entity, Xavier Boilard) : pour Problèmes et
// Antécédents, le « + » ouvre la recherche de diagnostic DANS la note
// (note:summary-add, NoteEditor.jsx) au lieu de l'ancienne modale. Pour
// Médications (lot 6 du plan « Prescription inline »), qui n'avait pas de « + »,
// il ouvre la recherche de médication « /rx » dans la note — le Figma
// (« Ajouter une prescription depuis le sommaire ») y prescrit par défaut.
// Ce que le « + » d'une boîte fait dans la note : NOTE_DATA.summaryAddDetail
// (editor-data.jsx), { documentAs } pour /dx, { command } pour /rx, null pour
// l'ancienne modale.
function Summary({ addToNote }) {
  var [data, setData] = React.useState(INIT_DATA);
  var [modal, setModal] = React.useState(null);   // { section, type:'add'|'list' }
  var [reorder, setReorder] = React.useState(false);
  var [sectionIds, setSectionIds] = React.useState(SECTION_CFG.map(function(s){ return s.id; }));
  var [showPrint, setShowPrint] = React.useState(false);
  var [dragSrc, setDragSrc] = React.useState(null);
  var [pending, setPending] = React.useState({}); // { sectionId: [{id,type,label}] } — éléments en attente venant de la note
  // Fils de diagnostic de la note en cours ({dxKey, number, name, code,
  // documentAs, status, replaces…} — un par fil, voir diagnosticThreads),
  // publiés par NoteEditor.jsx (note:diagnostics-change) à chaque frappe.
  var [dxOverlay, setDxOverlay] = React.useState(function() { return window.__NOTE_DX_OVERLAY || []; });

  // Publie la base du dossier (SANS la superposition de la note en cours) —
  // c'est ce que /dx (getSommaireDiagnostics, diagnostics.jsx) lit pour
  // proposer les problèmes/antécédents déjà connus.
  React.useEffect(function() {
    window.__SOMMAIRE_DX_BASE = { problems: data.problems, history: data.history };
    window.dispatchEvent(new Event('sommaire:diagnostics-change'));
  }, [data.problems, data.history]);

  // Pont déclaratif avec la note (D1/D2/D3, E2) : `note:diagnostics-change`
  // met à jour l'aperçu « en attente » (dxView plus bas) à chaque frappe ;
  // `note:diagnostics-commit`, envoyé à la complétion (NoteEditor.jsx), fusionne
  // définitivement dans la base et vide la superposition. Remplace l'ancien
  // note:add-problem (une seule ligne, jamais de lien vers les Antécédents,
  // jamais annulé si le diagnostic est retiré de la note).
  React.useEffect(function() {
    function onChange(e) { setDxOverlay((e.detail && e.detail.threads) || []); }
    function onCommit(e) {
      var threads = (e.detail && e.detail.threads) || [];
      var today = e.detail && e.detail.today;
      setData(function(prev) {
        var merged = window.commitSommaireDx({ problems: prev.problems, history: prev.history }, threads, { today: today });
        return Object.assign({}, prev, merged);
      });
      setDxOverlay([]);
    }
    window.addEventListener('note:diagnostics-change', onChange);
    window.addEventListener('note:diagnostics-commit', onCommit);
    return function() {
      window.removeEventListener('note:diagnostics-change', onChange);
      window.removeEventListener('note:diagnostics-commit', onCommit);
    };
  }, []);

  // Vue fusionnée Problèmes/Antécédents : base + effet de la note en cours,
  // avec les lignes touchées marquées « en attente » (pending/pendingNote —
  // voir mergeSommaireDx, diagnostics.jsx). Ni `data` ni `dxOverlay` ne sont
  // mutés : supprimer la région dans la note fait revenir la ligne à son
  // état d'origine dès le prochain rendu.
  var dxView = React.useMemo(function() {
    return window.mergeSommaireDx({ problems: data.problems, history: data.history }, dxOverlay, { today: window.fmtSommaireDate(new Date()) });
  }, [data.problems, data.history, dxOverlay]);

  // Items d'une section pour l'affichage — Problèmes/Antécédents passent par
  // dxView (mis en forme left/mid/right/title par sommaireDxRowView) ; les
  // autres sections lisent `data` directement, comme avant.
  function sectionItems(id) {
    if (id === 'problems' || id === 'history') return dxView[id].map(window.sommaireDxRowView);
    return data[id] || [];
  }

  // Chaque élément ajouté dans la note clinique apparaît « en attente » dans la
  // section correspondante du Sommaire (mappage type de chip → section).
  // Un diagnostic suit son propre mécanisme (dxOverlay/dxView ci-dessus),
  // pas cette liste générique.
  React.useEffect(function() {
    var MAP = { prescription:'meds', medication:'meds', problem:'problems', lab:'results', imaging:'results', exam:'results' };
    function onItems(e) {
      var list = (e.detail && e.detail.items) || [];
      var grouped = {};
      list.forEach(function(it) {
        var sec = MAP[it.type];
        if (!sec) return;
        (grouped[sec] = grouped[sec] || []).push(it);
      });
      setPending(grouped);
    }
    window.addEventListener('note:items-change', onItems);
    return function() { window.removeEventListener('note:items-change', onItems); };
  }, []);

  function addItem(section, item) {
    setData(function(prev) {
      var arr = prev[section] ? prev[section].slice() : [];
      if (section === 'allergies') {
        arr = arr.filter(function(a){ return a.type !== 'none'; });
      }
      // Ajout manuel (modale « + », pas /dx) — même forme de ligne que la
      // base (id/name/code + since ou status/resolvedOn) pour que mergeSommaireDx
      // puisse la retrouver plus tard si la note documente le même diagnostic.
      if (section === 'problems' || section === 'history') {
        var somId = 'som-manuel-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
        var somName = item.name || item.left || '';
        var row = section === 'problems'
          ? { id: somId, name: somName, code: item.code || null, since: item.right || item.since || null }
          : { id: somId, name: somName, code: item.code || null, status: item.status || null, resolvedOn: item.right || item.resolvedOn || null };
        arr.push(row);
        return Object.assign({}, prev, { [section]: arr });
      }
      if (section === 'vitals' && item.poids) {
        var next = [];
        if (item.poids)       next.push({ left:L('Poids'),            mid:item.poids+' kg',            right:'aujourd\'hui' });
        if (item.taille)      next.push({ left:L('Taille'),           mid:item.taille+' cm',           right:'aujourd\'hui' });
        if (item.paS&&item.paD) next.push({ left:L('Pression'),      mid:item.paS+'/'+item.paD+' mmHg', right:'aujourd\'hui' });
        if (item.fc)          next.push({ left:L('Fréq. cardiaque'),  mid:item.fc+' bpm',              right:'aujourd\'hui' });
        if (item.imc&&item.imc!=='—') next.push({ left:L('IMC'),     mid:item.imc,                     right:'aujourd\'hui' });
        return Object.assign({}, prev, { vitals: next.length ? next : arr });
      }
      if (section === 'habits') {
        arr.push({ left:item.name, name:item.name, mid:item.detail, detail:item.detail });
        return Object.assign({}, prev, { habits: arr });
      }
      arr.push(item);
      return Object.assign({}, prev, { [section]: arr });
    });
  }

  // Date d'une ligne Problèmes / Antécédents modifiée dans la tuile (lot 4).
  function updateDxDate(section, row, value) {
    var ok = window.sommaireDxValidDate(value);
    if (!ok) return false;
    setData(function(prev) {
      var next = window.sommaireDxPatchDate({ problems: prev.problems, history: prev.history }, section, row.id, value);
      return next ? Object.assign({}, prev, next) : prev;
    });
    if (window.toast) window.toast(t('summary.dateModifiee.toast', { name: row.name }), { icon: 'event' });
    return true;
  }

  function deleteItem(section, item) {
    setData(function(prev){
      return Object.assign({}, prev, { [section]: prev[section].filter(function(i){ return i !== item; }) });
    });
  }

  // Drag-to-reorder
  function onDragStart(e, idx) { setDragSrc(idx); e.dataTransfer.effectAllowed = 'move'; }
  function onDragOver(e, idx) {
    e.preventDefault();
    if (dragSrc === null || dragSrc === idx) return;
    var arr = sectionIds.slice();
    var moved = arr.splice(dragSrc, 1)[0];
    arr.splice(idx, 0, moved);
    setSectionIds(arr);
    setDragSrc(idx);
  }

  // Glisser un en-tête de section vers la note clinique (copie son contenu).
  // stopPropagation est ESSENTIEL : le dragstart du <span> remonte sinon jusqu'au
  // <div> SummaryBox dont le onDragStart (réordonnancement) écrase effectAllowed
  // en 'move'. Un dropEffect 'copy' devient alors incompatible et le navigateur
  // refuse le drop (l'événement `drop` ne se déclenche jamais, même si `dragover`
  // continue d'afficher la barre de dépôt).
  function startNoteDrag(e, cfg, items) {
    e.stopPropagation();
    window.__omniSummaryDrag = { sectionId: cfg.id, label: cfg.label, items: (items || []).slice() };
    try { e.dataTransfer.setData('text/omni-section', cfg.id); } catch (err) {}
    e.dataTransfer.effectAllowed = 'copy';
  }
  function endNoteDrag(e) { if (e && e.stopPropagation) e.stopPropagation(); window.__omniSummaryDrag = null; }

  var orderedCfg = sectionIds.map(function(id){ return SECTION_CFG.find(function(s){ return s.id===id; }); });

  function ActiveModal() {
    if (!modal) return null;
    var s = modal.section, type = modal.type;
    var items = sectionItems(s);
    var close = function(){ setModal(null); };
    var add   = function(item){ addItem(s, item); };

    if (s==='allergies' && type==='add')  return <AllergiesAddModal  onClose={close} onAdd={add} />;
    if (s==='allergies' && type==='list') return <AllergiesListModal items={items} onClose={close} onDelete={function(i){ deleteItem(s,i); }} />;
    if (s==='vitals'    && type==='add')  return <VitalsAddModal     onClose={close} onAdd={add} />;
    if (s==='vitals'    && type==='list') return <VitalsAddModal     onClose={close} onAdd={add} />;
    if (s==='meds')                       return <MedsModal          items={items}  onClose={close} />;
    if (s==='habits')                     return <HabitsModal        items={items}  onClose={close} onAdd={add} />;
    if (s==='problems')                   return <ProblemsModal      title={t('summary.problemes.tooltip')}    items={items} onClose={close} onAdd={add} convertLabel={t('summary.convertirAntecedent.label')} />;
    if (s==='history')                    return <ProblemsModal      title={t('summary.antecedents.tooltip')}  items={items} onClose={close} onAdd={add} convertLabel={t('summary.convertirProbleme.label')} />;
    if (s==='family')                     return <FamilyModal        items={items}  onClose={close} onAdd={add} />;
    if (s==='immun')                      return <ImmunModal         items={items}  onClose={close} onAdd={add} />;
    if (s==='results')                     return <ResultsModal       items={items}  onClose={close} onAdd={add} />;
    if (s==='programs')                    return <ProgramsModal      items={items}  onClose={close} onAdd={add} />;
    if (s==='tasks')                      return <TasksModal         items={items}  onClose={close} onAdd={add} />;
    return null;
  }

  return (
    <aside style={suS.panel}>
      {/* Header */}
      <div style={suS.header}>
        <span style={suS.headerTitle}>{t('summary.sommaire.text')}</span>
        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
          <button style={suS.hBtn} onClick={function(){ setShowPrint(true); }} title={t('summary.imprimerSommaire.tooltip')}>
            <span className="material-icons-outlined" style={{ fontSize:20 }}>print</span>
          </button>
          <button style={{ ...suS.hBtn, color: reorder ? '#f59e0b' : 'rgba(255,255,255,0.85)' }} onClick={function(){ setReorder(!reorder); }} title={t('summary.reorganiser.tooltip')}>
            <span className="material-icons-outlined" style={{ fontSize:22 }}>dashboard</span>
          </button>
        </div>
      </div>

      {reorder && (
        <div style={suS.reorderBar}>
          <span style={{ fontSize:12, color:'var(--mat-sys-on-surface)' }}>{t('summary.glissezReorganiser.text')}</span>
          <button style={suS.saveBtn} onClick={function(){ setReorder(false); }}>{t('summary.sauvegarder.button')}</button>
        </div>
      )}

      {/* Sections */}
      <div style={suS.scroll}>
        {orderedCfg.map(function(cfg, idx) {
          var items = sectionItems(cfg.id);
          return (
            <SummaryBox
              key={cfg.id}
              cfg={cfg}
              items={items}
              pending={pending[cfg.id] || []}
              reorder={reorder}
              draggable={reorder}
              onDragStart={function(e){ onDragStart(e, idx); }}
              onDragOver={function(e){ onDragOver(e, idx); }}
              onDragEnd={function(){ setDragSrc(null); }}
              onNoteDragStart={function(e){ startNoteDrag(e, cfg, items); }}
              onNoteDragEnd={endNoteDrag}
              canAdd={cfg.add || (!!addToNote && !!window.NOTE_DATA.summaryAddDetail(cfg.id))}
              onAdd={function(){
                var addDetail = addToNote ? window.NOTE_DATA.summaryAddDetail(cfg.id) : null;
                if (addDetail) {
                  window.dispatchEvent(new CustomEvent('note:summary-add', { detail: addDetail }));
                  return;
                }
                setModal({ section:cfg.id, type:'add' });
              }}
              onEditDate={(cfg.id === 'problems' || cfg.id === 'history') ? function(row, value){ return updateDxDate(cfg.id, row, value); } : null}
              onTitle={function(){
                if (cfg.link) { if (window.toast) window.toast(t('summary.comingSoon.toast', { label: cfg.label }), { icon: 'info' }); return; }
                if (cfg.list||cfg.dots) setModal({ section:cfg.id, type:'list' });
              }}
            />
          );
        })}
      </div>

      <ActiveModal />
      {showPrint && <PrintModal sections={SECTION_CFG} onClose={function(){ setShowPrint(false); }} />}
    </aside>
  );
}

function SummaryBox({ cfg, items, pending, reorder, draggable, onDragStart, onDragOver, onDragEnd, onNoteDragStart, onNoteDragEnd, canAdd, onAdd, onTitle, onEditDate }) {
  pending = pending || [];
  // Réordonnancement actif uniquement en mode `reorder`. Sinon ces handlers NE
  // doivent PAS exister : le dragstart du <span> « Glisser vers la note » remonte
  // sinon jusqu'à ce <div> et onDragStart écrase effectAllowed='copy' en 'move',
  // ce qui fait refuser le drop par le navigateur (le `drop` ne se déclenche
  // jamais alors que `dragover` affiche pourtant la barre de dépôt).
  return (
    <div
      style={{ ...suS.section, ...(reorder ? suS.sectionDrag : {}) }}
      draggable={draggable}
      onDragStart={reorder ? onDragStart : undefined}
      onDragOver={reorder ? onDragOver : undefined}
      onDragEnd={reorder ? onDragEnd : undefined}
    >
      <div style={suS.sHead}>
        {reorder && <span className="material-icons" style={{ fontSize:16, color:'color-mix(in srgb, var(--mat-sys-on-surface) 30%, transparent)', cursor:'grab', marginRight:4 }}>drag_indicator</span>}
        <span
          draggable={!reorder && !cfg.link}
          onDragStart={!reorder && !cfg.link ? onNoteDragStart : undefined}
          onDragEnd={!reorder && !cfg.link ? onNoteDragEnd : undefined}
          title={!reorder && !cfg.link ? t('summary.glisserVersNote.tooltip') : undefined}
          style={{ display:'flex', alignItems:'center', gap:7, flex:1, minWidth:0, cursor: reorder ? 'inherit' : (cfg.link ? 'default' : 'grab') }}>
          <span className="material-icons-outlined" style={suS.sIcon}>{cfg.icon}</span>
          <button style={suS.labelBtn} onClick={onTitle}>
            <span style={suS.sLabel}>{cfg.label}</span>
          </button>
        </span>
        {cfg.dots && (
          <button style={suS.addBtn} onClick={onTitle} title={t('summary.ouvrirMedications.tooltip')}>
            <span className="material-icons" style={{ fontSize:20 }}>more_vert</span>
          </button>
        )}
        {canAdd && (
          <button style={suS.addBtn} onClick={onAdd} title={t('summary.ajouter.tooltip')}>
            <span className="material-icons" style={{ fontSize:20 }}>add</span>
          </button>
        )}
      </div>
      {(items.length > 0 || pending.length > 0) && (
        <div style={suS.rows}>
          {items.slice(0, 6).map(function(r, i){ return <SummaryRow key={r.id || i} r={r} sId={cfg.id} onEditDate={onEditDate} />; })}
          {items.length > 6 && <div style={suS.more}>{t('summary.more.text', { n: items.length - 6 })}</div>}
          {pending.map(function(p, i){ return (
            <div key={'p'+i} style={suS.row}>
              <span className="material-icons-outlined" style={{ fontSize:13, color:'light-dark(#c07a00, #e9d0a5)', flexShrink:0, width:14 }}>schedule</span>
              <span style={{ ...suS.rLeft, color:'color-mix(in srgb, var(--mat-sys-on-surface) 50%, transparent)', fontStyle:'italic', maxWidth:130 }}>{p.label}</span>
              <span style={suS.pendingTag}>{t('summary.attente.text')}</span>
            </div>
          ); })}
        </div>
      )}
    </div>
  );
}

// Date d'une ligne Problèmes / Antécédents, modifiable sur place : un clic
// la change en champ ; Entrée ou quitter le champ enregistre (si la date est
// valable, sinon rien ne change), Échap annule. Une ligne « en attente »
// (touchée par la note en cours) reste en lecture seule.
function DxDateEdit({ r, onSave }) {
  var field = window.sommaireDxDateField(r);
  var raw = r[field] || '';
  var [editing, setEditing] = React.useState(false);
  var [val, setVal] = React.useState(raw);
  var [bad, setBad] = React.useState(false);
  function start(e) { e.stopPropagation(); setVal(raw); setBad(false); setEditing(true); }
  function save() { if (onSave(r, val)) setEditing(false); else setBad(true); }
  if (editing) {
    return (
      <input autoFocus value={val} style={{ ...suS.dateInput, ...(bad ? suS.dateInputBad : {}) }}
        aria-label={t('summary.date.aria', { name: r.name })} aria-invalid={bad || undefined}
        placeholder={t('summary.dateFormat.placeholder')} title={bad ? t('summary.dateInvalide.text') : undefined}
        onFocus={function(e){ e.target.select(); }}
        onChange={function(e){ setVal(e.target.value); setBad(false); }}
        onKeyDown={function(e){
          if (e.key === 'Enter') { e.preventDefault(); save(); }
          else if (e.key === 'Escape') { e.preventDefault(); setEditing(false); }
        }}
        onBlur={function(){ if (window.sommaireDxValidDate(val)) onSave(r, val); setEditing(false); }} />
    );
  }
  return (
    <button type="button" style={suS.dateBtn} onClick={start}
      title={t('summary.modifierDate.tooltip')} aria-label={t('summary.date.aria', { name: r.name }) + (r.right ? ' : ' + r.right : '')}>
      {r.right || t('summary.ajouterDate.text')}
    </button>
  );
}

function SummaryRow({ r, sId, onEditDate }) {
  if (sId === 'meds') {
    var c = MEDS_STATUS_COLOR[r.status] || MEDS_STATUS_COLOR.active;
    return (
      <div style={{ ...suS.row, cursor:'grab' }}
        draggable={true}
        title={t('summary.glisserMedicamentVersNote.tooltip')}
        onDragStart={function(e){
          e.stopPropagation();
          window.__omniSummaryDrag = { sectionId:'meds', label:'', items:[r], single:true };
          try { e.dataTransfer.setData('text/omni-section', 'meds'); } catch(err){}
          e.dataTransfer.effectAllowed = 'copy';
        }}
        onDragEnd={function(e){ if (e && e.stopPropagation) e.stopPropagation(); window.__omniSummaryDrag = null; }}>
        <span style={{ ...suS.dot, background:c }} />
        <span style={{ ...suS.rLeft, maxWidth:100 }}>{r.name}</span>
        {r.detail && <span style={suS.rMid}>{r.detail}</span>}
        {r.date && <span style={suS.rRight}>{r.date}</span>}
      </div>
    );
  }
  if (sId === 'allergies' && r.muted) {
    return <div style={{ ...suS.row }}><span style={{ ...suS.rLeft, color:'color-mix(in srgb, var(--mat-sys-on-surface) 45%, transparent)', fontStyle:'italic', maxWidth:220 }}>{r.name}</span></div>;
  }
  return (
    <div style={suS.row} title={r.title || undefined}>
      <span style={suS.rLeft}>{r.left || r.name}</span>
      {r.mid && <span style={suS.rMid}>{r.mid}</span>}
      {onEditDate && !r.pending && r.id
        ? <><span style={{ flex: 1 }} /><DxDateEdit r={r} onSave={onEditDate} /></>
        : r.right && <span style={suS.rRight}>{r.right}</span>}
      {/* Ligne touchée par la note en cours, pas encore complétée — voir
          mergeSommaireDx (diagnostics.jsx) et note:diagnostics-change
          (NoteEditor.jsx). pendingNote explique CE QUI a changé au survol. */}
      {r.pending && <span style={suS.pendingTag} title={r.pendingNote || undefined}>{t('summary.attente.text')}</span>}
    </div>
  );
}

var suS = {
  panel:{
    width:300, background:'var(--mat-sys-surface-container-lowest)', borderRadius:8,
    boxShadow:'0 2px 4px 0 rgba(37,36,94,0.14), 0 0 5px 0 rgba(37,36,94,0.12)',
    fontFamily:"'Inter',sans-serif", flexShrink:0,
    display:'flex', flexDirection:'column',
    height:'100%', alignSelf:'stretch',
    position:'sticky', top:0,
  },
  header:{
    background:'#25245E', color:'#fff', padding:'13px 14px',
    display:'flex', alignItems:'center',
    borderRadius:'8px 8px 0 0', flexShrink:0,
  },
  headerTitle:{ flex:1, fontSize:15, fontWeight:700, fontFamily:"'Poppins',sans-serif" },
  hBtn:{ background:'none', border:0, cursor:'pointer', padding:3, color:'rgba(255,255,255,0.85)', display:'flex' },
  reorderBar:{
    background:'color-mix(in srgb, var(--mat-sys-primary) 10%, var(--mat-sys-surface-container-lowest))', padding:'7px 14px',
    display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0,
  },
  saveBtn:{
    background:'#25245E', color:'#fff', border:0, borderRadius:6,
    padding:'4px 12px', cursor:'pointer', fontSize:12, fontWeight:600,
  },
  scroll:{ overflowY:'auto', flex:1 },
  section:{ borderBottom:'1px solid var(--mat-sys-outline-variant)' },
  sectionDrag:{ cursor:'grab', background:'light-dark(#fafafd, #24244c)' },
  sHead:{
    display:'flex', alignItems:'center', gap:7,
    padding:'9px 12px', minHeight:40, boxSizing:'border-box',
  },
  sIcon:{ fontSize:17, color:'color-mix(in srgb, var(--mat-sys-on-surface) 55%, transparent)', width:20, flexShrink:0 },
  labelBtn:{ background:'none', border:0, padding:0, cursor:'pointer', flex:1, textAlign:'left' },
  sLabel:{ fontSize:13, fontWeight:600, fontFamily:"'Poppins',sans-serif", color:'color-mix(in srgb, var(--mat-sys-on-surface) 85%, transparent)' },
  addBtn:{ background:'none', border:0, cursor:'pointer', padding:2, color:'var(--mat-sys-primary)', display:'flex', alignItems:'center', marginLeft:'auto', flexShrink:0 },
  rows:{ padding:'0 12px 10px 39px', display:'flex', flexDirection:'column', gap:6 },
  row:{ display:'flex', alignItems:'center', gap:5, fontSize:12 },
  dot:{ width:7, height:7, borderRadius:'50%', flexShrink:0 },
  rLeft:{ color:'color-mix(in srgb, var(--mat-sys-on-surface) 78%, transparent)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:108, fontSize:12 },
  rMid:{ color:'color-mix(in srgb, var(--mat-sys-on-surface) 52%, transparent)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:12 },
  rRight:{ color:'color-mix(in srgb, var(--mat-sys-on-surface) 45%, transparent)', fontSize:11, fontVariantNumeric:'tabular-nums', flexShrink:0 },
  // Date modifiable sur place (DxDateEdit) : même allure que rRight, soulignée
  // en pointillé pour dire qu'elle se clique.
  dateBtn:{ border:0, background:'transparent', padding:'2px 4px', margin:'-2px -4px', borderRadius:4, cursor:'pointer', color:'color-mix(in srgb, var(--mat-sys-on-surface) 55%, transparent)', fontSize:11, fontVariantNumeric:'tabular-nums', flexShrink:0, textDecoration:'underline dotted', textUnderlineOffset:2, fontFamily:'inherit' },
  dateInput:{ width:92, flexShrink:0, fontSize:11, padding:'2px 4px', border:'1px solid var(--mat-sys-outline)', borderRadius:4, background:'var(--mat-sys-surface-container-lowest)', color:'var(--mat-sys-on-surface)', fontFamily:'inherit', fontVariantNumeric:'tabular-nums' },
  dateInputBad:{ borderColor:'var(--mat-sys-error)', outline:'1px solid var(--mat-sys-error)' },
  more:{ fontSize:11, color:'var(--mat-sys-primary)', cursor:'pointer' },
  pendingTag:{ fontSize:9, fontWeight:700, color:'light-dark(#c07a00, #e9d0a5)', background:'light-dark(#fdf3e2, #4c3d24)', borderRadius:4, padding:'1px 5px', letterSpacing:0.3, textTransform:'uppercase', marginLeft:'auto', flexShrink:0, whiteSpace:'nowrap' },
};

window.Summary = Summary;
