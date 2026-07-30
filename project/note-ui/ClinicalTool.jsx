/* global React */
// =========================================================
// ClinicalTool.jsx — "Symptômes d'une infection urinaire"
// An embedded clinical tool (Outil clinique) form, adapted to
// the prototype's DS3 design language.
//
// Composants entièrement contrôlés : plus aucun state local pour les
// valeurs de champs, le collapse des sections, favori ou plié/déplié —
// tout vient du node ClinicalToolNode (editor-schema.jsx), qui persiste
// ces données comme attrs du node ProseMirror (fields, collapsedSections,
// favorite, bodyCollapsed). Voir NoteEditor.jsx pour l'insertion inline.
// =========================================================

function CTField({ label, placeholder, type, options, name, fields, onFieldChange, span }) {
  const v = (fields && fields[name]) || "";
  function handle(e) { onFieldChange(name, e.target.value); }
  const cls = "ct-field" + (span === 2 ? " ct-span2" : span === 3 ? " ct-span3" : "");
  return (
    <div className={cls}>
      <label>{label}</label>
      {options ? (
        <select value={v} onChange={handle}>
          <option value="">—</option>
          {options.map(function (o) { return <option key={o} value={o}>{o}</option>; })}
        </select>
      ) : (
        <input type={type || "text"} placeholder={placeholder || ""} value={v} onChange={handle} />
      )}
    </div>);
}

function CTCheck({ label, name, fields, onFieldChange }) {
  const on = !!(fields && fields[name]);
  return (
    <label className="ct-check">
      <input type="checkbox" checked={on} onChange={function (e) { onFieldChange(name, e.target.checked); }} />
      <span>{label}</span>
    </label>);
}

function CTSeg({ options, value, onChange }) {
  return (
    <span className="ct-seg">
      {options.map(function (o) {
        return (
          <button key={o} type="button" className={value === o ? "is-on" : ""}
            onClick={function () { onChange(value === o ? null : o); }}>{o}</button>);
      })}
    </span>);
}

function CTYesNo({ label, name, fields, onFieldChange }) {
  const v = (fields && fields[name]) || null;
  return (
    <div className="ct-qrow">
      <span className="ct-qrow__lbl">{label}</span>
      <CTSeg options={["Oui", "Non"]} value={v} onChange={function (val) { onFieldChange(name, val); }} />
    </div>);
}

function CTSection({ id, name, collapsed, onToggle, children }) {
  return (
    <div className={"ct-sec" + (collapsed ? " is-collapsed" : "")}>
      <button type="button" className="ct-sec__hd" onClick={function () { onToggle(id); }}>
        <span className="material-icons-outlined ct-sec__chev">expand_more</span>
        <span className="ct-sec__name">{name}</span>
      </button>
      <div className="ct-sec__bd">{children}</div>
    </div>);
}

const PHYS = ["Normal", "Anormal"];

// Résumé affiché quand un outil clinique est replié — lit l'état réel du DOM
// (plus simple et plus sûr que de dupliquer un modèle de résumé) au moment
// du collapse plutôt que de dupliquer un modèle de données. Générique :
// partagé par tous les outils (ClinicalTool, ClinicalToolExamCourt…), aucune
// dépendance aux champs d'un outil en particulier.
function ctBuildSummary(root) {
  if (!root) return '';
  const parts = [];
  const cleanLabel = function (txt) { return (txt || '').trim().replace(/\s*:?\s*$/, ''); };

  root.querySelectorAll('.ct-seg button.is-on').forEach(function (btn) {
    const row = btn.closest('.ct-qrow');
    const field = !row ? btn.closest('.ct-field') : null;
    const lblEl = row ? row.querySelector('.ct-qrow__lbl') : (field ? field.querySelector('label') : null);
    const lbl = cleanLabel(lblEl && lblEl.textContent);
    if (lbl) parts.push(lbl + ' : ' + btn.textContent);
  });

  root.querySelectorAll('.ct-check input[type="checkbox"]:checked').forEach(function (cb) {
    const span = cb.nextElementSibling;
    const txt = span && span.textContent.trim();
    if (txt) parts.push(txt);
  });

  root.querySelectorAll('.ct-field').forEach(function (f) {
    const label = f.querySelector('label');
    const input = f.querySelector('input, select');
    if (!label || !input || !input.value || input.type === 'date') return;
    const lbl = cleanLabel(label.textContent);
    if (lbl) parts.push(lbl + ' : ' + input.value);
  });

  if (!parts.length) return 'Aucune donnée saisie';
  const MAX = 4;
  const shown = parts.slice(0, MAX).join(' · ');
  return parts.length > MAX ? shown + ' · +' + (parts.length - MAX) + ' autres' : shown;
}

function ClinicalTool({ fields, onFieldChange, collapsedSections, onToggleSection, favorite, onToggleFavorite, bodyCollapsed, onBodyCollapseChange, onClose }) {
  function isCol(id) { return !!(collapsedSections && collapsedSections[id]); }
  function toggle(id) { onToggleSection(id); }

  // Liaisons locales (name → fields/onFieldChange déjà fermés) — évite de
  // répéter fields={fields} onFieldChange={onFieldChange} à chaque champ.
  function F(props) { return <CTField {...props} fields={fields} onFieldChange={onFieldChange} />; }
  function Chk(props) { return <CTCheck {...props} fields={fields} onFieldChange={onFieldChange} />; }
  function YN(props) { return <CTYesNo {...props} fields={fields} onFieldChange={onFieldChange} />; }
  function bind(name) { return { value: fields[name] || null, onChange: function (v) { onFieldChange(name, v); } }; }

  // Résumé affiché quand l'outil est replié — lit l'état réel du DOM.
  const bodyRef = React.useRef(null);
  const [summary, setSummary] = React.useState('');
  React.useEffect(function () {
    if (bodyCollapsed) setSummary(ctBuildSummary(bodyRef.current));
  }, [bodyCollapsed]);

  return (
    <div className="ct-panel" data-screen-label="Outil clinique — Infection urinaire">
      {/* Top bar */}
      <div className="ct-bar">
        <span className="ct-bar__wrench"><span className="material-icons-outlined">link</span></span>
        <span className="ct-bar__txt">
          <span className="ct-bar__overline">Outil clinique</span>
          <span className="ct-bar__title">Symptômes d'une infection urinaire</span>
        </span>
        {bodyCollapsed && summary &&
          <span className="ct-bar__summary">{summary}</span>}
        <span className="ct-bar__actions">
          <button className={"ct-iconbtn" + (favorite ? " is-fav" : "")} title="Favori" onClick={onToggleFavorite}>
            <span className="material-icons">{favorite ? "favorite" : "favorite_border"}</span>
          </button>
          <button className="ct-iconbtn is-accent" title="Envoyer"><span className="material-icons-outlined">mail</span></button>
          <button className="ct-iconbtn is-accent" title="Imprimer"><span className="material-icons-outlined">print</span></button>
          <button className="ct-iconbtn is-accent" title="Fermer" onClick={onClose}><span className="material-icons-outlined">close</span></button>
          <button className="ct-iconbtn is-accent" title={bodyCollapsed ? "Déplier l'outil" : "Replier l'outil"}
            onClick={function () { onBodyCollapseChange(!bodyCollapsed); }}>
            <span className="material-icons-outlined">{bodyCollapsed ? "expand_more" : "expand_less"}</span>
          </button>
        </span>
      </div>

      <div className="ct-body" ref={bodyRef} style={bodyCollapsed ? { display: "none" } : null}>
        <div className="ct-effrow">
          <F name="effDate" label="Date d'entrée en vigueur" type="date" />
        </div>

        <p className="ct-doctitle">Symptômes d'une infection urinaire</p>

        {/* ---- HISTOIRE ---- */}
        <CTSection id="hist" name="Histoire" collapsed={isCol("hist")} onToggle={toggle}>
          <div className="ct-grid ct-grid--3">
            <F name="sx_depuis" label="Présence de sx urinaires depuis :" />
            <F name="apparition_type" label="Type d'apparition :" />
            <F name="douleur_type" label="Type de douleur :" />
            <F name="irradiation" label="Irradiation :" />
            <F name="douleur_echelle" label="Échelle de la douleur :" />
            <F name="soulage_par" label="Soulagé par :" />
          </div>

          <p className="ct-sub ct-sub--plain">Présence de :</p>
          <div className="ct-checks ct-checks--3">
            <Chk name="sx_dysurie" label="Dysurie" />
            <Chk name="sx_urgence" label="Urgence mictionnelle" />
            <Chk name="sx_pollakiurie" label="Pollakiurie" />
            <Chk name="sx_dlr_suspubien" label="Douleur ou malaise sus-pubien" />
            <Chk name="sx_hematurie" label="Hématurie" />
            <Chk name="sx_fievre" label="Fièvre" />
            <Chk name="sx_dlr_costovert" label="Douleur costo-vertébrale (au dos) ou au flanc" />
          </div>
          <p className="ct-note">***Si présence d'<strong>AU MOINS 2 signes</strong> ou Sx d'apparition récente = <strong>CYSTITE</strong></p>

          <p className="ct-sub">Présence CRITÈRES COMPLEXES ou à RISQUE :</p>
          <div className="ct-checks ct-checks--3">
            <Chk name="risque_homme" label="Homme" />
            <Chk name="risque_grossesse" label="Grossesse" />
            <Chk name="risque_immunosup" label="Immunosuppression" />
            <Chk name="risque_diabete" label="Diabète mal contrôlé" />
            <Chk name="risque_irc" label="Insuffisance rénale sévère (DFG-30)" />
            <Chk name="risque_recidive" label="Infection urinaire récidivante" />
            <Chk name="risque_antibiores" label="Risque d'antibiorésistance" />
          </div>
          <p className="ct-note">** Présence d'un critère = <strong>CYSTITE COMPLIQUÉE</strong> OU aucun critère = <strong>CYSTITE SIMPLE</strong></p>
          <p className="ct-note">** Présence d'un critère ou plus de pyélonéphrite : fièvre, douleur costo-vertébrale (au dos) ou au flanc = <strong>PYÉLONÉPHRITE</strong></p>

          <p className="ct-sub">Présence autres Sx :</p>
          <div className="ct-checks ct-checks--3">
            <Chk name="sx_nausee" label="Nausée" />
            <Chk name="sx_vomissement" label="Vomissement" />
            <Chk name="sx_dlr_abdo" label="Douleur abdominale" />
            <Chk name="risque_itss" label="Risque ITSS*" />
          </div>
          <p className="ct-note"><span className="ct-link">* Se référer au questionnaire ITSS prn</span></p>

          <div className="ct-grid ct-grid--2" style={{ marginTop: 8 }}>
            <div>
              <p className="ct-sub">Femme :</p>
              <div className="ct-checks ct-checks--1">
                <Chk name="f_ecoulement_vaginal" label="Écoulement vaginal AN" />
                <Chk name="f_lesions_vulvaires" label="Lésions vulvaires de novo" />
                <Chk name="f_prurit_vulvaire" label="Prurit vulvaire" />
              </div>
              <div className="ct-grid ct-grid--2" style={{ marginTop: 12, marginBottom: 0 }}>
                <F name="f_risque_grossesse" label="Risque de grossesse ?" />
                <F name="f_ddm" label="DDM :" />
              </div>
            </div>
            <div>
              <p className="ct-sub">Homme :</p>
              <div className="ct-checks ct-checks--1">
                <Chk name="h_ecoulement_penien" label="Écoulement pénien" />
                <Chk name="h_lesions_genitales" label="Lésions génitales de novo" />
                <Chk name="h_prurit_genital" label="Prurit génital" />
              </div>
            </div>
          </div>
        </CTSection>

        {/* ---- DÉCISION CLINIQUE ---- */}
        <CTSection id="dec" name="Décision clinique" collapsed={isCol("dec")} onToggle={toggle}>
          <div className="ct-checks ct-checks--1">
            <Chk name="dec_rencontre_oc11" label="Le patient rencontre les critères pour l'application de l'OC #11" />
            <Chk name="dec_refere" label="Le patient ne rencontre pas les critères pour l'application de l'OC, il a été référé à une IPSPL ou un MD" />
          </div>
        </CTSection>

        {/* ---- CONDUITE À TENIR / PLAN ---- */}
        <CTSection id="plan" name="Conduite à tenir / Plan" collapsed={isCol("plan")} onToggle={toggle}>
          <p className="ct-sub">Traitement pharmacologique :</p>
          <div className="ct-grid" style={{ gridTemplateColumns: "1fr", marginBottom: 16 }}>
            <F name="plan_traitement_pharmaco" label="" />
          </div>

          <div className="ct-qrow" style={{ marginBottom: 14 }}>
            <span className="ct-qrow__lbl">Analyse de laboratoire de contrôle nécessaire :</span>
            <CTSeg options={["Oui", "Non"]} {...bind("plan_lab_necessaire")} />
          </div>
          <p className="ct-note">Si oui = Culture d'urine et contrôle 1 semaine post-fin de tx</p>

          <div className="ct-checks ct-checks--2">
            <Chk name="plan_requete_remise" label="Requête remise au patient" />
            <Chk name="plan_avise_contact" label="Avisé qu'il sera contacté lorsque résultats disponibles" />
          </div>

          <p className="ct-sub" style={{ marginTop: 16 }}>Counselling :</p>
          <div className="ct-checks ct-checks--1">
            <Chk name="couns_douleur" label="Pour le soulagement de la douleur, envisager la prise d'acétaminophène ou d'ibuprofène, à moins d'une contre-indication." />
            <Chk name="couns_hydratation" label="Boire suffisamment d'eau (au moins 1.5 L par jour, sauf si contre-indiqué) pour aller uriner fréquemment." />
            <Chk name="couns_reconsulter" label="Consulter à nouveau en cas de persistance, d'aggravation des signes et symptômes ou de détérioration de l'état général de la personne dans les 48-72 heures suivant le début des antibiotiques." />
            <Chk name="couns_comportements" label="Donner des conseils sur les comportements qui peuvent aider à réduire le risque d'infection urinaire (hydratation abondante, essuyage de l'avant vers l'arrière après la défécation, miction post-coïtale, vidange complète de la vessie lors des mictions)." />
          </div>
        </CTSection>

        {/* ---- RECOMMANDATIONS / FILET DE SÉCURITÉ ---- */}
        <CTSection id="reco" name="Recommandations / Filet de sécurité" collapsed={isCol("reco")} onToggle={toggle}>
          <div className="ct-grid ct-grid--2" style={{ marginBottom: 6 }}>
            <Chk name="reco_urgence_info" label="Patient informé de consulter une IPSPL ou médecin en urgence si :" />
            <p className="ct-note" style={{ margin: 0 }}>
              - Signes de réaction allergique <strong>*Doit cesser le traitement immédiatement*</strong><br />
              - T°, dlr aiguë, N, V ou DEG dans les 48-72 h après le début des antibiotiques
            </p>
          </div>
          <div className="ct-checks ct-checks--2">
            <Chk name="reco_reconsulter_2_4sem" label="Avisé qu'il doit reconsulter si retour des symptômes dans les 2 à 4 semaines suivant le traitement" />
            <Chk name="reco_fiche_remise" label="Fiche conseil remise" />
            <Chk name="reco_fiche_faxee" label="Fiche de liaison faxée à la pharmacie" />
            <Chk name="reco_satisfait" label="Patient dit être satisfait de la consultation" />
            <Chk name="reco_tache_suivi" label="Tâche ajoutée pour faire un suivi téléphonique d'ici 3-5 jours" />
          </div>
        </CTSection>

        {/* ---- EXAMEN PHYSIQUE ---- */}
        <CTSection id="exam" name="Examen physique" collapsed={isCol("exam")} onToggle={toggle}>
          <div className="ct-grid ct-grid--3">
            <F name="exam_apparence" label="Apparence générale" span={3} />

            <F name="exam_signes_vitaux" label="Signes vitaux :" />
            <F name="exam_ta" label="TA :" />
            <F name="exam_fc" label="FC :" />

            <F name="exam_fr" label="FR :" />
            <F name="exam_spo2" label="SpO2 % :" />
            <F name="exam_temp" label="T° :" />

            <F name="exam_coeur" label="Cœur :" options={PHYS} />
            <F name="exam_coeur_anormal" label="Si anormal :" />
            <span />

            <F name="exam_poumons" label="Poumons :" options={PHYS} />
            <F name="exam_poumons_anormal" label="Si anormal :" />
            <span />

            <F name="exam_abdomen" label="Abdomen :" options={PHYS} />
            <span /><span />

            <F name="exam_dlr_abdo_loc" label="Si douleur abdomen :" options={["Sus-pubienne", "Lombaire", "Diffuse", "Autre"]} />
            <span /><span />

            <F name="exam_punch_renaux" label="Punch rénaux :" options={["Négatif", "Positif droit", "Positif gauche", "Positif bilatéral"]} />
            <span /><span />

            <F name="exam_anorectal" label="Anorectal :" options={PHYS} />
            <F name="exam_tr" label="TR :" />
            <F name="exam_prostate" label="Prostate :" options={["Normale", "Augmentée", "Sensible", "Anormale"]} />

            <F name="exam_anus" label="Anus :" options={PHYS} />
            <F name="exam_anus_anormal" label="Si anormal :" />
            <span />

            <F name="exam_oge" label="OGE :" />
            <F name="exam_testicules" label="Testicules :" />
            <F name="exam_penis" label="Pénis :" />

            <F name="exam_gyneco" label="Gynéco :" />
            <F name="exam_vulve" label="Vulve :" />
            <F name="exam_vagin" label="Vagin :" />

            <F name="exam_col" label="Col :" options={PHYS} />
            <F name="exam_uterus" label="Utérus :" options={PHYS} />
            <F name="exam_annexes" label="Annexes :" options={PHYS} />

            <F name="exam_annexes_anormal" label="Si annexes anormal :" />
            <div className="ct-field">
              <label>Sensibilité à la mobilisation du col</label>
              <div style={{ paddingTop: 4 }}>
                <CTSeg options={["Oui", "Non"]} {...bind("exam_smc")} />
              </div>
            </div>
            <span />
          </div>
        </CTSection>

        {/* ---- INTERVENTION / PRÉLÈVEMENTS ---- */}
        <CTSection id="interv" name="Intervention / Prélèvements" collapsed={isCol("interv")} onToggle={toggle}>
          <div className="ct-grid ct-grid--3">
            <F name="interv_bandelette" label="Bandelette urinaire :" />
            <F name="interv_leuco" label="Leuco :" />
            <F name="interv_nitrite" label="Nitrite :" />
            <span />
            <F name="interv_hb" label="Hb :" />
            <F name="interv_proteines" label="Protéines :" />
          </div>

          <div className="ct-grid ct-grid--3" style={{ alignItems: "end" }}>
            <label className="ct-check" style={{ paddingBottom: 6 }}>
              <CTCheckInner name="interv_ac_urine" label="A+C d'urine" fields={fields} onFieldChange={onFieldChange} />
            </label>
            <div className="ct-field">
              <label>BHcg urinaire :</label>
              <div style={{ paddingTop: 4 }}>
                <CTBhcg name="interv_bhcg" fields={fields} onFieldChange={onFieldChange} />
              </div>
            </div>
            <F name="interv_autres" label="Autres :" />
          </div>

          <p className="ct-note"><strong>Cystite simple :</strong> Si absence de leuco = A+C d'urine &amp; attendre les résultats</p>
          <p className="ct-note ct-note--ital">*Si présence de sang et ou de protéines, envoyer une A+C d'urine*</p>

          <div className="ct-grid" style={{ gridTemplateColumns: "1fr", marginTop: 8, marginBottom: 0 }}>
            <F name="interv_imp" label="IMP :" />
            <F name="interv_sx_apparentant" label="Sx s'apparentant à :" options={["Cystite simple", "Cystite compliquée", "Pyélonéphrite", "Autre"]} />
          </div>
        </CTSection>

        {/* ---- CONTRE-INDICATIONS ABSOLUES ---- */}
        <CTSection id="ci" name="Présence de contre-indications absolues : Oui / Non" collapsed={isCol("ci")} onToggle={toggle}>
          <div className="ct-qgrid">
            <YN name="ci_anomalie_anatomique" label="Anomalie anatomique ou fonctionnelle de l'appareil urinaire" />
            <YN name="ci_hemodialyse" label="Hémodialyse ou pathologie rénale chronique autre que l'insuffisance rénale sévère" />
            <YN name="ci_chirurgie_recente" label="Chirurgie de l'appareil urinaire — 3 mois" />
            <YN name="ci_catheter" label="Port d'un cathéter urinaire (sonde à demeure)" />
            <YN name="ci_antibio" label="Contre-indication à l'usage de tous les antibiotiques recommandés" />
            <YN name="ci_instabilite" label="Instabilité hémodynamique et ou suspicion de sepsis" />
            <YN name="ci_grossesse_14sem" label="Femme enceinte de plus de 14 semaines" />
            <YN name="ci_symptomato" label="Symptomatologie compatible avec une prostatite, une orchiépididymite ou une pathologie gynécologique" />
          </div>
        </CTSection>

        {/* ---- SITUATION QUI NÉCESSITE UNE DISCUSSION ---- */}
        <CTSection id="disc" name="Situation qui nécessite une discussion avec le MD / IPSPL : Oui / Non" collapsed={isCol("disc")} onToggle={toggle}>
          <div className="ct-qgrid">
            <YN name="disc_itss" label="Facteurs de risque ITSS chez une personne symptomatique ET que l'inf. évaluatrice n'est pas habilitée à faire la prise en charge des ITSS ET que collègues inf. clin. habilitée n'est pas disponible" />
            <YN name="disc_ic_ir_immuno" label="Insuffisance cardiaque, insuffisance rénale et ou patient immunosupprimé" />
            <YN name="disc_hemodynamique" label="État hémodynamique instable : état toxique, temps élevé, vomissement aigu, SV instable" />
            <YN name="disc_hematurie_macro" label="Hématurie macroscopique" />
            <YN name="disc_age_extreme" label="Enfant de moins de 14 ans et adulte de 75 ans et plus" />
            <YN name="disc_personne_agee" label="Personne âgée (75 ans et plus) : patient confus et ou présence de rétention urinaire depuis plus de 16 h" />
          </div>
        </CTSection>
      </div>
    </div>);
}

// small inner check used where a checkbox sits inline in a grid cell
function CTCheckInner({ label, name, fields, onFieldChange }) {
  const on = !!(fields && fields[name]);
  return (
    <React.Fragment>
      <input type="checkbox" checked={on} onChange={function (e) { onFieldChange(name, e.target.checked); }} />
      <span>{label}</span>
    </React.Fragment>);
}

function CTBhcg({ name, fields, onFieldChange }) {
  const v = (fields && fields[name]) || null;
  return <CTSeg options={["Négatif", "Positif"]} value={v} onChange={function (val) { onFieldChange(name, val); }} />;
}

// =========================================================
// ClinicalToolExamCourt — "Examen physique - Version courte"
// Deuxième outil clinique fonctionnel (voir CLINICAL_TOOLS dans
// ClinicalToolPicker.jsx) : un examen physique bien plus court que le
// gabarit « complet » (encore désactivé/« Bientôt »), pour une visite de
// suivi rapide. Aucune spec exacte trouvée sur Confluence pour cet outil —
// structure reconstituée à partir des conventions déjà en place (signes
// vitaux, revue par système Normal/Anormal, impression/plan), à ajuster si
// le contenu réel diffère.
// =========================================================
function ClinicalToolExamCourt({ fields, onFieldChange, collapsedSections, onToggleSection, favorite, onToggleFavorite, bodyCollapsed, onBodyCollapseChange, onClose }) {
  function isCol(id) { return !!(collapsedSections && collapsedSections[id]); }
  function toggle(id) { onToggleSection(id); }
  function F(props) { return <CTField {...props} fields={fields} onFieldChange={onFieldChange} />; }

  const bodyRef = React.useRef(null);
  const [summary, setSummary] = React.useState('');
  React.useEffect(function () {
    if (bodyCollapsed) setSummary(ctBuildSummary(bodyRef.current));
  }, [bodyCollapsed]);

  return (
    <div className="ct-panel" data-screen-label="Outil clinique — Examen physique version courte">
      <div className="ct-bar">
        <span className="ct-bar__wrench"><span className="material-icons-outlined">link</span></span>
        <span className="ct-bar__txt">
          <span className="ct-bar__overline">Outil clinique</span>
          <span className="ct-bar__title">Examen physique - Version courte</span>
        </span>
        {bodyCollapsed && summary &&
          <span className="ct-bar__summary">{summary}</span>}
        <span className="ct-bar__actions">
          <button className={"ct-iconbtn" + (favorite ? " is-fav" : "")} title="Favori" onClick={onToggleFavorite}>
            <span className="material-icons">{favorite ? "favorite" : "favorite_border"}</span>
          </button>
          <button className="ct-iconbtn is-accent" title="Envoyer"><span className="material-icons-outlined">mail</span></button>
          <button className="ct-iconbtn is-accent" title="Imprimer"><span className="material-icons-outlined">print</span></button>
          <button className="ct-iconbtn is-accent" title="Fermer" onClick={onClose}><span className="material-icons-outlined">close</span></button>
          <button className="ct-iconbtn is-accent" title={bodyCollapsed ? "Déplier l'outil" : "Replier l'outil"}
            onClick={function () { onBodyCollapseChange(!bodyCollapsed); }}>
            <span className="material-icons-outlined">{bodyCollapsed ? "expand_more" : "expand_less"}</span>
          </button>
        </span>
      </div>

      <div className="ct-body" ref={bodyRef} style={bodyCollapsed ? { display: "none" } : null}>
        <div className="ct-effrow">
          <F name="effDate" label="Date d'entrée en vigueur" type="date" />
        </div>

        <p className="ct-doctitle">Examen physique - Version courte</p>

        <CTSection id="sv" name="Signes vitaux" collapsed={isCol("sv")} onToggle={toggle}>
          <div className="ct-grid ct-grid--3">
            <F name="sv_ta" label="TA :" />
            <F name="sv_fc" label="FC :" />
            <F name="sv_fr" label="FR :" />
            <F name="sv_spo2" label="SpO2 % :" />
            <F name="sv_temp" label="T° :" />
            <F name="sv_poids" label="Poids :" />
          </div>
        </CTSection>

        <CTSection id="gen" name="Apparence générale" collapsed={isCol("gen")} onToggle={toggle}>
          <div className="ct-grid" style={{ gridTemplateColumns: "1fr", marginBottom: 0 }}>
            <F name="gen_apparence" label="Apparence générale" span={3} />
          </div>
        </CTSection>

        <CTSection id="sys" name="Examen par système" collapsed={isCol("sys")} onToggle={toggle}>
          <div className="ct-grid ct-grid--3">
            <F name="sys_coeur" label="Cœur :" options={PHYS} />
            <F name="sys_coeur_anormal" label="Si anormal :" />
            <span />

            <F name="sys_poumons" label="Poumons :" options={PHYS} />
            <F name="sys_poumons_anormal" label="Si anormal :" />
            <span />

            <F name="sys_abdomen" label="Abdomen :" options={PHYS} />
            <F name="sys_abdomen_anormal" label="Si anormal :" />
            <span />

            <F name="sys_neuro" label="Neuro :" options={PHYS} />
            <F name="sys_neuro_anormal" label="Si anormal :" />
            <span />

            <F name="sys_peau" label="Peau / téguments :" options={PHYS} />
            <F name="sys_peau_anormal" label="Si anormal :" />
            <span />
          </div>
        </CTSection>

        <CTSection id="imp" name="Impression / Plan" collapsed={isCol("imp")} onToggle={toggle}>
          <div className="ct-grid" style={{ gridTemplateColumns: "1fr", marginBottom: 0 }}>
            <F name="imp_impression" label="Impression :" />
            <F name="imp_plan" label="Plan :" />
          </div>
        </CTSection>
      </div>
    </div>);
}

window.ClinicalTool = ClinicalTool;
window.ClinicalToolExamCourt = ClinicalToolExamCourt;
