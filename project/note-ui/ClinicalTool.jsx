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
      <CTSeg options={[t('clinicalTool.oui.label'), t('clinicalTool.non.label')]} value={v} onChange={function (val) { onFieldChange(name, val); }} />
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
    if (lbl) parts.push(t('common.labelValue.text', { label: lbl, value: btn.textContent }));
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
    if (lbl) parts.push(t('common.labelValue.text', { label: lbl, value: input.value }));
  });

  if (!parts.length) return t('clinicalTool.noData.text');
  const MAX = 4;
  const shown = parts.slice(0, MAX).join(' · ');
  return parts.length > MAX ? t('clinicalTool.summaryMore.text', { shown: shown, n: parts.length - MAX }) : shown;
}

function ClinicalTool({ fields, onFieldChange, collapsedSections, onToggleSection, favorite, onToggleFavorite, bodyCollapsed, onBodyCollapseChange, onClose }) {
  function isCol(id) { return !!(collapsedSections && collapsedSections[id]); }
  function toggle(id) { onToggleSection(id); }

  // Liaisons locales (name → fields/onFieldChange déjà fermés) — évite de
  // répéter fields={fields} onFieldChange={onFieldChange} à chaque champ.
  // F/Chk/YN DOIVENT rester une référence stable (useCallback, deps [])
  // plutôt qu'une fonction redéfinie à chaque rendu : ClinicalTool se
  // rerend via root.render() à chaque frappe (voir editor-schema.jsx), et un
  // composant redéfini dans le corps d'un composant change de type à
  // chaque rendu — React démonte/remonte alors tout ce qu'il produit,
  // <input> compris, ce qui fait perdre le focus après chaque caractère.
  // Les refs exposent toujours la valeur courante de fields/onFieldChange
  // malgré la référence figée.
  const fieldsRef = React.useRef(fields); fieldsRef.current = fields;
  const onFieldChangeRef = React.useRef(onFieldChange); onFieldChangeRef.current = onFieldChange;
  const F = React.useCallback(function F(props) { return <CTField {...props} fields={fieldsRef.current} onFieldChange={onFieldChangeRef.current} />; }, []);
  const Chk = React.useCallback(function Chk(props) { return <CTCheck {...props} fields={fieldsRef.current} onFieldChange={onFieldChangeRef.current} />; }, []);
  const YN = React.useCallback(function YN(props) { return <CTYesNo {...props} fields={fieldsRef.current} onFieldChange={onFieldChangeRef.current} />; }, []);
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
          <span className="ct-bar__overline">{t('clinicalTool.outilClinique.text')}</span>
          <span className="ct-bar__title">{t('clinicalTool.symptomesInfectionUrinaire.text')}</span>
        </span>
        {bodyCollapsed && summary &&
          <span className="ct-bar__summary">{summary}</span>}
        <span className="ct-bar__actions">
          <button className={"ct-iconbtn" + (favorite ? " is-fav" : "")} title={t('clinicalTool.favori.tooltip')} onClick={onToggleFavorite}>
            <span className="material-icons">{favorite ? 'favorite' : "favorite_border"}</span>
          </button>
          <button className="ct-iconbtn is-accent" title={t('clinicalTool.envoyer.tooltip')}><span className="material-icons-outlined">mail</span></button>
          <button className="ct-iconbtn is-accent" title={t('clinicalTool.imprimer.tooltip')}><span className="material-icons-outlined">print</span></button>
          <button className="ct-iconbtn is-accent" title={t('clinicalTool.fermer.tooltip')} onClick={onClose}><span className="material-icons-outlined">close</span></button>
          <button className="ct-iconbtn is-accent" title={bodyCollapsed ? t('clinicalTool.deplierOutil.tooltip') : t('clinicalTool.replierOutil.tooltip')}
            onClick={function () { onBodyCollapseChange(!bodyCollapsed); }}>
            <span className="material-icons-outlined">{bodyCollapsed ? "expand_more" : "expand_less"}</span>
          </button>
        </span>
      </div>

      <div className="ct-body" ref={bodyRef} style={bodyCollapsed ? { display: "none" } : null}>
        <div className="ct-effrow">
          <F name="effDate" label={t('clinicalTool.dateEntreeVigueur.label')} type="date" />
        </div>

        <p className="ct-doctitle">{t('clinicalTool.symptomesInfectionUrinaire.text')}</p>

        {/* ---- HISTOIRE ---- */}
        <CTSection id="hist" name={t('clinicalTool.histoire.heading')} collapsed={isCol("hist")} onToggle={toggle}>
          <div className="ct-grid ct-grid--3">
            <F name="sx_depuis" label={t('clinicalTool.presenceSxUrinairesDepuis.label')} />
            <F name="apparition_type" label={t('clinicalTool.typeApparition.label')} />
            <F name="douleur_type" label={t('clinicalTool.typeDouleur.label')} />
            <F name="irradiation" label={t('clinicalTool.irradiation.label')} />
            <F name="douleur_echelle" label={t('clinicalTool.echelleDouleur.label')} />
            <F name="soulage_par" label={t('clinicalTool.soulage.label')} />
          </div>

          <p className="ct-sub ct-sub--plain">{t('clinicalTool.presence.text')}</p>
          <div className="ct-checks ct-checks--3">
            <Chk name="sx_dysurie" label={t('clinicalTool.dysurie.label')} />
            <Chk name="sx_urgence" label={t('clinicalTool.urgenceMictionnelle.label')} />
            <Chk name="sx_pollakiurie" label={t('clinicalTool.pollakiurie.label')} />
            <Chk name="sx_dlr_suspubien" label={t('clinicalTool.douleurMalaiseSusPubien.label')} />
            <Chk name="sx_hematurie" label={t('clinicalTool.hematurie.label')} />
            <Chk name="sx_fievre" label={t('clinicalTool.fievre.label')} />
            <Chk name="sx_dlr_costovert" label={t('clinicalTool.douleurCostoVertebraleDos.label')} />
          </div>
          <p className="ct-note">{tRich('clinicalTool.noteCystite.text')}</p>

          <p className="ct-sub">{t('clinicalTool.presenceCriteresComplexesRisque.text')}</p>
          <div className="ct-checks ct-checks--3">
            <Chk name="risque_homme" label={t('clinicalTool.homme.label')} />
            <Chk name="risque_grossesse" label={t('clinicalTool.grossesse.label')} />
            <Chk name="risque_immunosup" label={t('clinicalTool.immunosuppression.label')} />
            <Chk name="risque_diabete" label={t('clinicalTool.diabeteMalControle.label')} />
            <Chk name="risque_irc" label={t('clinicalTool.insuffisanceRenaleSevereDfg.label')} />
            <Chk name="risque_recidive" label={t('clinicalTool.infectionUrinaireRecidivante.label')} />
            <Chk name="risque_antibiores" label={t('clinicalTool.risqueAntibioresistance.label')} />
          </div>
          <p className="ct-note">{tRich('clinicalTool.noteComplicated.text')}</p>
          <p className="ct-note">{tRich('clinicalTool.notePyelo.text')}</p>

          <p className="ct-sub">{t('clinicalTool.presenceAutresSx.text')}</p>
          <div className="ct-checks ct-checks--3">
            <Chk name="sx_nausee" label={t('clinicalTool.nausee.label')} />
            <Chk name="sx_vomissement" label={t('clinicalTool.vomissement.label')} />
            <Chk name="sx_dlr_abdo" label={t('clinicalTool.douleurAbdominale.label')} />
            <Chk name="risque_itss" label={t('clinicalTool.risqueItss.label')} />
          </div>
          <p className="ct-note"><span className="ct-link">{t('clinicalTool.refererQuestionnaireItssPrn.text')}</span></p>

          <div className="ct-grid ct-grid--2" style={{ marginTop: 8 }}>
            <div>
              <p className="ct-sub">{t('clinicalTool.femme.text')}</p>
              <div className="ct-checks ct-checks--1">
                <Chk name="f_ecoulement_vaginal" label={t('clinicalTool.ecoulementVaginalAn.label')} />
                <Chk name="f_lesions_vulvaires" label={t('clinicalTool.lesionsVulvairesNovo.label')} />
                <Chk name="f_prurit_vulvaire" label={t('clinicalTool.pruritVulvaire.label')} />
              </div>
              <div className="ct-grid ct-grid--2" style={{ marginTop: 12, marginBottom: 0 }}>
                <F name="f_risque_grossesse" label={t('clinicalTool.risqueGrossesse.label')} />
                <F name="f_ddm" label={t('clinicalTool.ddm.label')} />
              </div>
            </div>
            <div>
              <p className="ct-sub">{t('clinicalTool.homme.text')}</p>
              <div className="ct-checks ct-checks--1">
                <Chk name="h_ecoulement_penien" label={t('clinicalTool.ecoulementPenien.label')} />
                <Chk name="h_lesions_genitales" label={t('clinicalTool.lesionsGenitalesNovo.label')} />
                <Chk name="h_prurit_genital" label={t('clinicalTool.pruritGenital.label')} />
              </div>
            </div>
          </div>
        </CTSection>

        {/* ---- DÉCISION CLINIQUE ---- */}
        <CTSection id="dec" name={t('clinicalTool.decisionClinique.heading')} collapsed={isCol("dec")} onToggle={toggle}>
          <div className="ct-checks ct-checks--1">
            <Chk name="dec_rencontre_oc11" label={t('clinicalTool.patientRencontreCriteresApplicatio.label')} />
            <Chk name="dec_refere" label={t('clinicalTool.patientNeRencontrePas.label')} />
          </div>
        </CTSection>

        {/* ---- CONDUITE À TENIR / PLAN ---- */}
        <CTSection id="plan" name={t('clinicalTool.conduiteATenirPlan.heading')} collapsed={isCol("plan")} onToggle={toggle}>
          <p className="ct-sub">{t('clinicalTool.traitementPharmacologique.text')}</p>
          <div className="ct-grid" style={{ gridTemplateColumns: "1fr", marginBottom: 16 }}>
            <F name="plan_traitement_pharmaco" label="" />
          </div>

          <div className="ct-qrow" style={{ marginBottom: 14 }}>
            <span className="ct-qrow__lbl">{t('clinicalTool.analyseLaboratoireControleNecessai.text')}</span>
            <CTSeg options={[t('clinicalTool.oui.label'), t('clinicalTool.non.label')]} {...bind("plan_lab_necessaire")} />
          </div>
          <p className="ct-note">{t('clinicalTool.siOuiCultureUrine.text')}</p>

          <div className="ct-checks ct-checks--2">
            <Chk name="plan_requete_remise" label={t('clinicalTool.requeteRemisePatient.label')} />
            <Chk name="plan_avise_contact" label={t('clinicalTool.aviseQuIlSera.label')} />
          </div>

          <p className="ct-sub" style={{ marginTop: 16 }}>{t('clinicalTool.counselling.text')}</p>
          <div className="ct-checks ct-checks--1">
            <Chk name="couns_douleur" label={t('clinicalTool.soulagementDouleurEnvisagerPrise.label')} />
            <Chk name="couns_hydratation" label={t('clinicalTool.boireSuffisammentEauMoins.label')} />
            <Chk name="couns_reconsulter" label={t('clinicalTool.consulterNouveauCasPersistance.label')} />
            <Chk name="couns_comportements" label={t('clinicalTool.donnerConseilsComportementsPeuvent.label')} />
          </div>
        </CTSection>

        {/* ---- RECOMMANDATIONS / FILET DE SÉCURITÉ ---- */}
        <CTSection id="reco" name={t('clinicalTool.recommandationsFiletSecurite.heading')} collapsed={isCol("reco")} onToggle={toggle}>
          <div className="ct-grid ct-grid--2" style={{ marginBottom: 6 }}>
            <Chk name="reco_urgence_info" label={t('clinicalTool.patientInformeConsulterIpspl.label')} />
            <p className="ct-note" style={{ margin: 0 }}>
              {tRich('clinicalTool.noteSafetyNet.text')}
            </p>
          </div>
          <div className="ct-checks ct-checks--2">
            <Chk name="reco_reconsulter_2_4sem" label={t('clinicalTool.aviseQuIlDoit.label')} />
            <Chk name="reco_fiche_remise" label={t('clinicalTool.ficheConseilRemise.label')} />
            <Chk name="reco_fiche_faxee" label={t('clinicalTool.ficheLiaisonFaxeePharmacie.label')} />
            <Chk name="reco_satisfait" label={t('clinicalTool.patientDitEtreSatisfait.label')} />
            <Chk name="reco_tache_suivi" label={t('clinicalTool.tacheAjouteeFaireSuivi.label')} />
          </div>
        </CTSection>

        {/* ---- EXAMEN PHYSIQUE ---- */}
        <CTSection id="exam" name={t('clinicalTool.examenPhysique.heading')} collapsed={isCol("exam")} onToggle={toggle}>
          <div className="ct-grid ct-grid--3">
            <F name="exam_apparence" label={t('clinicalTool.apparenceGenerale.label')} span={3} />

            <F name="exam_signes_vitaux" label={t('clinicalTool.signesVitaux.label')} />
            <F name="exam_ta" label={t('clinicalTool.ta.label')} />
            <F name="exam_fc" label={t('clinicalTool.fc.label')} />

            <F name="exam_fr" label={t('clinicalTool.fr.label')} />
            <F name="exam_spo2" label={t('clinicalTool.spo2.label')} />
            <F name="exam_temp" label={t('clinicalTool.t.label')} />

            <F name="exam_coeur" label={t('clinicalTool.cUr.label')} options={PHYS} />
            <F name="exam_coeur_anormal" label={t('clinicalTool.siAnormal.label')} />
            <span />

            <F name="exam_poumons" label={t('clinicalTool.poumons.label')} options={PHYS} />
            <F name="exam_poumons_anormal" label={t('clinicalTool.siAnormal.label')} />
            <span />

            <F name="exam_abdomen" label={t('clinicalTool.abdomen.label')} options={PHYS} />
            <span /><span />

            <F name="exam_dlr_abdo_loc" label={t('clinicalTool.siDouleurAbdomen.label')} options={[t('clinicalTool.susPubienne.label'), t('clinicalTool.lombaire.label'), t('clinicalTool.diffuse.label'), t('clinicalTool.autre.label')]} />
            <span /><span />

            <F name="exam_punch_renaux" label={t('clinicalTool.punchRenaux.label')} options={[t('clinicalTool.negatif.label'), t('clinicalTool.positifDroit.label'), t('clinicalTool.positifGauche.label'), t('clinicalTool.positifBilateral.label')]} />
            <span /><span />

            <F name="exam_anorectal" label={t('clinicalTool.anorectal.label')} options={PHYS} />
            <F name="exam_tr" label={t('clinicalTool.tr.label')} />
            <F name="exam_prostate" label={t('clinicalTool.prostate.label')} options={[t('clinicalTool.normale.label'), t('clinicalTool.augmentee.label'), t('clinicalTool.sensible.label'), t('clinicalTool.anormale.label')]} />

            <F name="exam_anus" label={t('clinicalTool.anus.label')} options={PHYS} />
            <F name="exam_anus_anormal" label={t('clinicalTool.siAnormal.label')} />
            <span />

            <F name="exam_oge" label={t('clinicalTool.oge.label')} />
            <F name="exam_testicules" label={t('clinicalTool.testicules.label')} />
            <F name="exam_penis" label={t('clinicalTool.penis.label')} />

            <F name="exam_gyneco" label={t('clinicalTool.gyneco.label')} />
            <F name="exam_vulve" label={t('clinicalTool.vulve.label')} />
            <F name="exam_vagin" label={t('clinicalTool.vagin.label')} />

            <F name="exam_col" label={t('clinicalTool.col.label')} options={PHYS} />
            <F name="exam_uterus" label={t('clinicalTool.uterus.label')} options={PHYS} />
            <F name="exam_annexes" label={t('clinicalTool.annexes.label')} options={PHYS} />

            <F name="exam_annexes_anormal" label={t('clinicalTool.siAnnexesAnormal.label')} />
            <div className="ct-field">
              <label>{t('clinicalTool.sensibiliteMobilisationCol.label')}</label>
              <div style={{ paddingTop: 4 }}>
                <CTSeg options={[t('clinicalTool.oui.label'), t('clinicalTool.non.label')]} {...bind("exam_smc")} />
              </div>
            </div>
            <span />
          </div>
        </CTSection>

        {/* ---- INTERVENTION / PRÉLÈVEMENTS ---- */}
        <CTSection id="interv" name={t('clinicalTool.interventionPrelevements.heading')} collapsed={isCol("interv")} onToggle={toggle}>
          <div className="ct-grid ct-grid--3">
            <F name="interv_bandelette" label={t('clinicalTool.bandeletteUrinaire.label')} />
            <F name="interv_leuco" label={t('clinicalTool.leuco.label')} />
            <F name="interv_nitrite" label={t('clinicalTool.nitrite.label')} />
            <span />
            <F name="interv_hb" label={t('clinicalTool.hb.label')} />
            <F name="interv_proteines" label={t('clinicalTool.proteines.label')} />
          </div>

          <div className="ct-grid ct-grid--3" style={{ alignItems: "end" }}>
            <label className="ct-check" style={{ paddingBottom: 6 }}>
              <CTCheckInner name="interv_ac_urine" label={t('clinicalTool.cUrine.label')} fields={fields} onFieldChange={onFieldChange} />
            </label>
            <div className="ct-field">
              <label>{t('clinicalTool.bhcgUrinaire.label')}</label>
              <div style={{ paddingTop: 4 }}>
                <CTBhcg name="interv_bhcg" fields={fields} onFieldChange={onFieldChange} />
              </div>
            </div>
            <F name="interv_autres" label={t('clinicalTool.autres.label')} />
          </div>

          <p className="ct-note">{tRich('clinicalTool.noteSimpleCystitis.text')}</p>
          <p className="ct-note ct-note--ital">{t('clinicalTool.siPresenceSangProteines.text')}</p>

          <div className="ct-grid" style={{ gridTemplateColumns: "1fr", marginTop: 8, marginBottom: 0 }}>
            <F name="interv_imp" label={t('clinicalTool.imp.label')} />
            <F name="interv_sx_apparentant" label={t('clinicalTool.sxApparentant.label')} options={[t('clinicalTool.cystiteSimple.label'), t('clinicalTool.cystiteCompliquee.label'), t('clinicalTool.pyelonephrite.label'), t('clinicalTool.autre.label')]} />
          </div>
        </CTSection>

        {/* ---- CONTRE-INDICATIONS ABSOLUES ---- */}
        <CTSection id="ci" name={t('clinicalTool.contreIndicationsAbsolues.heading')} collapsed={isCol("ci")} onToggle={toggle}>
          <div className="ct-qgrid">
            <YN name="ci_anomalie_anatomique" label={t('clinicalTool.anomalieAnatomiqueFonctionnelleApp.label')} />
            <YN name="ci_hemodialyse" label={t('clinicalTool.hemodialysePathologieRenaleChroniq.label')} />
            <YN name="ci_chirurgie_recente" label={t('clinicalTool.chirurgieAppareilUrinaire3.label')} />
            <YN name="ci_catheter" label={t('clinicalTool.portCatheterUrinaireSonde.label')} />
            <YN name="ci_antibio" label={t('clinicalTool.contreIndicationUsageTous.label')} />
            <YN name="ci_instabilite" label={t('clinicalTool.instabiliteHemodynamiqueSuspicionS.label')} />
            <YN name="ci_grossesse_14sem" label={t('clinicalTool.femmeEnceintePlus14.label')} />
            <YN name="ci_symptomato" label={t('clinicalTool.symptomatologieCompatibleAvecProst.label')} />
          </div>
        </CTSection>

        {/* ---- SITUATION QUI NÉCESSITE UNE DISCUSSION ---- */}
        <CTSection id="disc" name={t('clinicalTool.discussionMdIpspl.heading')} collapsed={isCol("disc")} onToggle={toggle}>
          <div className="ct-qgrid">
            <YN name="disc_itss" label={t('clinicalTool.facteursRisqueItssChez.label')} />
            <YN name="disc_ic_ir_immuno" label={t('clinicalTool.insuffisanceCardiaqueInsuffisanceR.label')} />
            <YN name="disc_hemodynamique" label={t('clinicalTool.etatHemodynamiqueInstableEtat.label')} />
            <YN name="disc_hematurie_macro" label={t('clinicalTool.hematurieMacroscopique.label')} />
            <YN name="disc_age_extreme" label={t('clinicalTool.enfantMoins14Ans.label')} />
            <YN name="disc_personne_agee" label={t('clinicalTool.personneAgee75Ans.label')} />
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
  return <CTSeg options={[t('clinicalTool.negatif.label'), t('clinicalTool.positif.label')]} value={v} onChange={function (val) { onFieldChange(name, val); }} />;
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
  // F doit rester stable (useCallback, deps []) — voir le commentaire dans
  // ClinicalTool ci-dessus pour la perte de focus que ça évite.
  const fieldsRef = React.useRef(fields); fieldsRef.current = fields;
  const onFieldChangeRef = React.useRef(onFieldChange); onFieldChangeRef.current = onFieldChange;
  const F = React.useCallback(function F(props) { return <CTField {...props} fields={fieldsRef.current} onFieldChange={onFieldChangeRef.current} />; }, []);

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
          <span className="ct-bar__overline">{t('clinicalTool.outilClinique.text')}</span>
          <span className="ct-bar__title">{t('clinicalTool.examenPhysiqueVersionCourte.text')}</span>
        </span>
        {bodyCollapsed && summary &&
          <span className="ct-bar__summary">{summary}</span>}
        <span className="ct-bar__actions">
          <button className={"ct-iconbtn" + (favorite ? " is-fav" : "")} title={t('clinicalTool.favori.tooltip')} onClick={onToggleFavorite}>
            <span className="material-icons">{favorite ? 'favorite' : "favorite_border"}</span>
          </button>
          <button className="ct-iconbtn is-accent" title={t('clinicalTool.envoyer.tooltip')}><span className="material-icons-outlined">mail</span></button>
          <button className="ct-iconbtn is-accent" title={t('clinicalTool.imprimer.tooltip')}><span className="material-icons-outlined">print</span></button>
          <button className="ct-iconbtn is-accent" title={t('clinicalTool.fermer.tooltip')} onClick={onClose}><span className="material-icons-outlined">close</span></button>
          <button className="ct-iconbtn is-accent" title={bodyCollapsed ? t('clinicalTool.deplierOutil.tooltip') : t('clinicalTool.replierOutil.tooltip')}
            onClick={function () { onBodyCollapseChange(!bodyCollapsed); }}>
            <span className="material-icons-outlined">{bodyCollapsed ? "expand_more" : "expand_less"}</span>
          </button>
        </span>
      </div>

      <div className="ct-body" ref={bodyRef} style={bodyCollapsed ? { display: "none" } : null}>
        <div className="ct-effrow">
          <F name="effDate" label={t('clinicalTool.dateEntreeVigueur.label')} type="date" />
        </div>

        <p className="ct-doctitle">{t('clinicalTool.examenPhysiqueVersionCourte.text')}</p>

        <CTSection id="sv" name={t('clinicalTool.signesVitaux.heading')} collapsed={isCol("sv")} onToggle={toggle}>
          <div className="ct-grid ct-grid--3">
            <F name="sv_ta" label={t('clinicalTool.ta.label')} />
            <F name="sv_fc" label={t('clinicalTool.fc.label')} />
            <F name="sv_fr" label={t('clinicalTool.fr.label')} />
            <F name="sv_spo2" label={t('clinicalTool.spo2.label')} />
            <F name="sv_temp" label={t('clinicalTool.t.label')} />
            <F name="sv_poids" label={t('clinicalTool.poids.label')} />
          </div>
        </CTSection>

        <CTSection id="gen" name={t('clinicalTool.apparenceGenerale.heading')} collapsed={isCol("gen")} onToggle={toggle}>
          <div className="ct-grid" style={{ gridTemplateColumns: "1fr", marginBottom: 0 }}>
            <F name="gen_apparence" label={t('clinicalTool.apparenceGenerale.label')} span={3} />
          </div>
        </CTSection>

        <CTSection id="sys" name={t('clinicalTool.examenParSysteme.heading')} collapsed={isCol("sys")} onToggle={toggle}>
          <div className="ct-grid ct-grid--3">
            <F name="sys_coeur" label={t('clinicalTool.cUr.label')} options={PHYS} />
            <F name="sys_coeur_anormal" label={t('clinicalTool.siAnormal.label')} />
            <span />

            <F name="sys_poumons" label={t('clinicalTool.poumons.label')} options={PHYS} />
            <F name="sys_poumons_anormal" label={t('clinicalTool.siAnormal.label')} />
            <span />

            <F name="sys_abdomen" label={t('clinicalTool.abdomen.label')} options={PHYS} />
            <F name="sys_abdomen_anormal" label={t('clinicalTool.siAnormal.label')} />
            <span />

            <F name="sys_neuro" label={t('clinicalTool.neuro.label')} options={PHYS} />
            <F name="sys_neuro_anormal" label={t('clinicalTool.siAnormal.label')} />
            <span />

            <F name="sys_peau" label={t('clinicalTool.peauTeguments.label')} options={PHYS} />
            <F name="sys_peau_anormal" label={t('clinicalTool.siAnormal.label')} />
            <span />
          </div>
        </CTSection>

        <CTSection id="imp" name={t('clinicalTool.impressionPlan.heading')} collapsed={isCol("imp")} onToggle={toggle}>
          <div className="ct-grid" style={{ gridTemplateColumns: "1fr", marginBottom: 0 }}>
            <F name="imp_impression" label={t('clinicalTool.impression.label')} />
            <F name="imp_plan" label={t('clinicalTool.plan.label')} />
          </div>
        </CTSection>
      </div>
    </div>);
}

window.ClinicalTool = ClinicalTool;
window.ClinicalToolExamCourt = ClinicalToolExamCourt;
