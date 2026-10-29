// =========================================================
// data.jsx — scenarios + entity registry (FR-CA)
// =========================================================
const ENTITY_TYPES = {
  prescription: { key: 'prescription', label: L('Prescription'), icon: 'pill', summaryGroup: L('Médications') },
  // Médication documentée au profil ou mentionnée, sans prescription (lot 4 : Documenter / Mentionner).
  medication:   { key: 'medication',   label: L('Médication'),   icon: 'medication', summaryGroup: L('Médications') },
  lab:          { key: 'lab',          label: L('Laboratoire'),  icon: 'science', summaryGroup: L('Résultats') },
  imaging:      { key: 'imaging',      label: L('Imagerie'),     icon: 'radiology', summaryGroup: L('Résultats') },
  problem:      { key: 'problem',      label: L('Problème'), icon: 'flag', summaryGroup: L('Problèmes') },
  instructions: { key: 'instructions', label: L('Consignes'),    icon: 'menu_book', summaryGroup: L('Consignes') },
  diagnostic:   { key: 'diagnostic',   label: L('Diagnostic'),   icon: 'local_hospital', summaryGroup: L('Diagnostics') },
  file:         { key: 'file',         label: L('Fichier'),       icon: 'attach_file',    summaryGroup: L('Fichiers') },
  referral:     { key: 'referral',     label: L('Référence'),     icon: 'person_add',     summaryGroup: L('Références') },
  // Requêtes ajoutées à la rencontre du 2026-10-27 (C2) : examen diagnostique et service.
  exam:         { key: 'exam',         label: L('Examen diagnostique'), icon: 'monitor_heart', summaryGroup: L('Résultats') },
  service:      { key: 'service',      label: L('Service'),       icon: 'medical_services', summaryGroup: L('Services') },
};

// MED_CATALOG — catalogue de recherche /rx (source : medicaments.json, 50 entrées, puis des ajouts). Clé : `key` si l’entrée en a une, sinon `cat-` + sa position.
const MED_CATALOG = [
  { stem: 'atorvastatine', brand: 'Lipitor', klass: L('Hypolipemiant'), din: '02230711',
    text: L('Atorvastatine 20 mg — 1 co DIE HS'),
    label: L('Atorvastatine 20 mg'),
    details: { molecule: L('Atorvastatine'), dose: '20', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'DIE', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: L('Hypolipemiant') } },
  { stem: 'rosuvastatine', brand: 'Crestor', klass: L('Hypolipemiant'), din: '02265325',
    text: L('Rosuvastatine 10 mg — 1 co DIE'),
    label: L('Rosuvastatine 10 mg'),
    details: { molecule: L('Rosuvastatine'), dose: '10', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'DIE', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: L('Hypolipemiant') } },
  { stem: 'amlodipine', brand: 'Norvasc', klass: L('Antihypertenseur'), din: '00878928',
    text: L('Amlodipine 5 mg — 1 co DIE'),
    label: L('Amlodipine 5 mg'),
    details: { molecule: L('Amlodipine'), dose: '5', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'DIE', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: L('Antihypertenseur') } },
  { stem: 'ramipril', brand: 'Altace', klass: L('IECA'), din: '02221829',
    text: L('Ramipril 5 mg — 1 caps DIE'),
    label: L('Ramipril 5 mg'),
    details: { molecule: L('Ramipril'), dose: '5', unit: 'mg', form: 'gélule', route: 'PO',
      frequency: 'DIE', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: L('IECA') } },
  { stem: 'perindopril', brand: 'Coversyl', klass: L('IECA'), din: '02246624',
    text: L('Perindopril 4 mg — 1 co DIE'),
    label: L('Perindopril 4 mg'),
    details: { molecule: L('Perindopril'), dose: '4', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'DIE', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: L('IECA') } },
  { stem: 'losartan', brand: 'Cozaar', klass: L('ARA'), din: '02182446',
    text: L('Losartan 50 mg — 1 co DIE'),
    label: L('Losartan 50 mg'),
    details: { molecule: L('Losartan'), dose: '50', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'DIE', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: L('ARA') } },
  { stem: 'hydrochlorothiazide', brand: 'HydroDIURIL', klass: L('Diuretique thiazidique'), din: '00021474',
    text: L('Hydrochlorothiazide 25 mg — 1 co DIE AM'),
    label: L('Hydrochlorothiazide 25 mg'),
    details: { molecule: L('Hydrochlorothiazide'), dose: '25', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'DIE', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: L('Diuretique thiazidique') } },
  { stem: 'furosemide', brand: 'Lasix', klass: L('Diuretique de l\'anse'), din: '02224561',
    text: L('Furosemide 40 mg — 1 co DIE AM'),
    label: L('Furosemide 40 mg'),
    details: { molecule: L('Furosemide'), dose: '40', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'DIE', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: L('Diuretique de l\'anse') } },
  { stem: 'metoprolol', brand: 'Lopresor', klass: L('Betabloquant'), din: '00397423',
    text: L('Metoprolol 50 mg — 1 co BID'),
    label: L('Metoprolol 50 mg'),
    details: { molecule: L('Metoprolol'), dose: '50', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'BID', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: L('Betabloquant') } },
  { stem: 'bisoprolol', brand: 'Monocor', klass: L('Betabloquant'), din: '02267964',
    text: L('Bisoprolol 5 mg — 1 co DIE'),
    label: L('Bisoprolol 5 mg'),
    details: { molecule: L('Bisoprolol'), dose: '5', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'DIE', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: L('Betabloquant') } },
  { stem: 'apixaban', brand: 'Eliquis', klass: L('Anticoagulant'), din: '02397754',
    text: L('Apixaban 5 mg — 1 co BID'),
    label: L('Apixaban 5 mg'),
    details: { molecule: L('Apixaban'), dose: '5', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'BID', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: L('Anticoagulant') } },
  { stem: 'rivaroxaban', brand: 'Xarelto', klass: L('Anticoagulant'), din: '02385360',
    text: L('Rivaroxaban 20 mg — 1 co DIE c. repas'),
    label: L('Rivaroxaban 20 mg'),
    details: { molecule: L('Rivaroxaban'), dose: '20', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'DIE', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: L('Anticoagulant') } },
  { stem: 'warfarine', brand: 'Coumadin', klass: L('Anticoagulant'), din: '02016330',
    text: L('Warfarine 5 mg — selon INR'),
    label: L('Warfarine 5 mg'),
    details: { molecule: L('Warfarine'), dose: '5', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: '', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: L('Anticoagulant') } },
  { stem: 'acide acetylsalicylique', brand: 'Aspirin', klass: L('Antiplaquettaire'), din: '02242881',
    text: L('Acide acetylsalicylique 81 mg — 1 co DIE'),
    label: L('Acide acetylsalicylique 81 mg'),
    details: { molecule: L('Acide acetylsalicylique'), dose: '81', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'DIE', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: L('Antiplaquettaire') } },
  { stem: 'clopidogrel', brand: 'Plavix', klass: L('Antiplaquettaire'), din: '02238682',
    text: L('Clopidogrel 75 mg — 1 co DIE'),
    label: L('Clopidogrel 75 mg'),
    details: { molecule: L('Clopidogrel'), dose: '75', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'DIE', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: L('Antiplaquettaire') } },
  { stem: 'metformine', brand: 'Glucophage', klass: L('Antidiabetique'), din: '02099233',
    text: L('Metformine 500 mg — 1 co BID c. repas'),
    label: L('Metformine 500 mg'),
    details: { molecule: L('Metformine'), dose: '500', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'BID', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: L('Antidiabetique') } },
  { stem: 'gliclazide', brand: 'Diamicron MR', klass: L('Antidiabetique (sulfonyluree)'), din: '02229453',
    text: L('Gliclazide 30 mg — 1 co DIE AM'),
    label: L('Gliclazide 30 mg'),
    details: { molecule: L('Gliclazide'), dose: '30', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'DIE', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: L('Antidiabetique (sulfonyluree)') } },
  { stem: 'empagliflozine', brand: 'Jardiance', klass: L('Antidiabetique (iSGLT2)'), din: '02443015',
    text: L('Empagliflozine 10 mg — 1 co DIE'),
    label: L('Empagliflozine 10 mg'),
    details: { molecule: L('Empagliflozine'), dose: '10', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'DIE', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: L('Antidiabetique (iSGLT2)') } },
  { stem: 'empagliflozine', brand: 'Ozempic', klass: L('Antidiabetique (GLP-1)'), din: '02471471',
    text: L('Empagliflozine 0.5 mg/dose — 1 inj SC q sem'),
    label: L('Empagliflozine 0.5 mg/dose'),
    details: { molecule: L('Empagliflozine'), dose: '0.5', unit: 'mg/dose', form: 'stylo', route: 'SC',
      frequency: '1× / semaine', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: L('Antidiabetique (GLP-1)') } },
  { stem: 'insuline glargine', brand: 'Lantus', klass: L('Insuline'), din: '02245689',
    text: L('Insuline glargine 100 U/mL — selon protocole'),
    label: L('Insuline glargine 100 U/mL'),
    details: { molecule: L('Insuline glargine'), dose: '100', unit: 'U/mL', form: 'stylo', route: 'SC',
      frequency: '', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: L('Insuline') } },
  { stem: 'pantoprazole', brand: 'Pantoloc', klass: L('IPP'), din: '02241804',
    text: L('Pantoprazole 40 mg — 1 co DIE AC'),
    label: L('Pantoprazole 40 mg'),
    details: { molecule: L('Pantoprazole'), dose: '40', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'DIE', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: L('IPP') } },
  { stem: 'omeprazole', brand: 'Losec', klass: L('IPP'), din: '02245058',
    text: L('Omeprazole 20 mg — 1 caps DIE AC'),
    label: L('Omeprazole 20 mg'),
    details: { molecule: L('Omeprazole'), dose: '20', unit: 'mg', form: 'gélule', route: 'PO',
      frequency: 'DIE', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: L('IPP') } },
  { stem: 'esomeprazole', brand: 'Nexium', klass: L('IPP'), din: '02244520',
    text: L('Esomeprazole 40 mg — 1 co DIE AC'),
    label: L('Esomeprazole 40 mg'),
    details: { molecule: L('Esomeprazole'), dose: '40', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'DIE', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: L('IPP') } },
  { stem: 'ranitidine', brand: 'Zantac', klass: L('Anti-H2'), din: '00828173',
    text: L('Ranitidine 150 mg — 1 co BID'),
    label: L('Ranitidine 150 mg'),
    details: { molecule: L('Ranitidine'), dose: '150', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'BID', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: L('Anti-H2') } },
  { stem: 'levothyroxine', brand: 'Synthroid', klass: L('Hormone thyroidienne'), din: '00036765',
    text: L('Levothyroxine 50 mcg — 1 co DIE a jeun'),
    label: L('Levothyroxine 50 mcg'),
    details: { molecule: L('Levothyroxine'), dose: '50', unit: 'mcg', form: 'comprimé', route: 'PO',
      frequency: 'DIE', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: L('Hormone thyroidienne') } },
  { stem: 'sertraline', brand: 'Zoloft', klass: L('ISRS'), din: '02132503',
    text: L('Sertraline 50 mg — 1 co DIE'),
    label: L('Sertraline 50 mg'),
    details: { molecule: L('Sertraline'), dose: '50', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'DIE', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: L('ISRS') } },
  { stem: 'escitalopram', brand: 'Cipralex', klass: L('ISRS'), din: '02273123',
    text: L('Escitalopram 10 mg — 1 co DIE'),
    label: L('Escitalopram 10 mg'),
    details: { molecule: L('Escitalopram'), dose: '10', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'DIE', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: L('ISRS') } },
  { stem: 'citalopram', brand: 'Celexa', klass: L('ISRS'), din: '02239607',
    text: L('Citalopram 20 mg — 1 co DIE'),
    label: L('Citalopram 20 mg'),
    details: { molecule: L('Citalopram'), dose: '20', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'DIE', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: L('ISRS') } },
  { stem: 'venlafaxine', brand: 'Effexor XR', klass: L('IRSN'), din: '02237279',
    text: L('Venlafaxine 75 mg — 1 caps DIE'),
    label: L('Venlafaxine 75 mg'),
    details: { molecule: L('Venlafaxine'), dose: '75', unit: 'mg', form: 'gélule', route: 'PO',
      frequency: 'DIE', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: L('IRSN') } },
  { stem: 'bupropion', brand: 'Wellbutrin XL', klass: L('Antidepresseur'), din: '02275940',
    text: L('Bupropion 150 mg — 1 co DIE AM'),
    label: L('Bupropion 150 mg'),
    details: { molecule: L('Bupropion'), dose: '150', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'DIE', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: L('Antidepresseur') } },
  { stem: 'trazodone', brand: 'Desyrel', klass: L('Antidepresseur / hypnotique'), din: '00711934',
    text: L('Trazodone 50 mg — 1 co HS PRN'),
    label: L('Trazodone 50 mg'),
    details: { molecule: L('Trazodone'), dose: '50', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'HS PRN', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: L('Antidepresseur / hypnotique') } },
  { stem: 'lorazepam', brand: 'Ativan', klass: L('Benzodiazepine'), din: '00655740',
    text: L('Lorazepam 1 mg — 1 co HS PRN'),
    label: L('Lorazepam 1 mg'),
    details: { molecule: L('Lorazepam'), dose: '1', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'HS PRN', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: L('Benzodiazepine') } },
  { stem: 'zopiclone', brand: 'Imovane', klass: L('Hypnotique'), din: '02172169',
    text: L('Zopiclone 7.5 mg — 1 co HS PRN'),
    label: L('Zopiclone 7.5 mg'),
    details: { molecule: L('Zopiclone'), dose: '7.5', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'HS PRN', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: L('Hypnotique') } },
  { stem: 'gabapentine', brand: 'Neurontin', klass: L('Anticonvulsivant / neuropathique'), din: '02239717',
    text: L('Gabapentine 300 mg — 1 caps TID'),
    label: L('Gabapentine 300 mg'),
    details: { molecule: L('Gabapentine'), dose: '300', unit: 'mg', form: 'gélule', route: 'PO',
      frequency: 'TID', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: L('Anticonvulsivant / neuropathique') } },
  { stem: 'salbutamol', brand: 'Ventolin', klass: L('Bronchodilatateur (BACA)'), din: '02232570',
    text: L('Salbutamol 100 mcg/dose — 1-2 inh PRN'),
    label: L('Salbutamol 100 mcg/dose'),
    details: { molecule: L('Salbutamol'), dose: '100', unit: 'mcg/dose', form: 'aérosol-doseur', route: 'Inhalé',
      frequency: 'PRN', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: L('Bronchodilatateur (BACA)') } },
  { stem: 'fluticasone/salmeterol', brand: 'Advair', klass: L('CSI + BALA'), din: '02240835',
    text: L('Fluticasone/Salmeterol 250/50 mcg — 1 inh BID'),
    label: L('Fluticasone/Salmeterol 250/50 mcg'),
    details: { molecule: L('Fluticasone/Salmeterol'), dose: '250/50', unit: 'mcg', form: 'aérosol-doseur', route: 'Inhalé',
      frequency: 'BID', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: L('CSI + BALA') } },
  { stem: 'tiotropium', brand: 'Spiriva', klass: L('Anticholinergique (MPOC)'), din: '02246793',
    text: L('Tiotropium 18 mcg — 1 inh DIE'),
    label: L('Tiotropium 18 mcg'),
    details: { molecule: L('Tiotropium'), dose: '18', unit: 'mcg', form: 'aérosol-doseur', route: 'Inhalé',
      frequency: 'DIE', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: L('Anticholinergique (MPOC)') } },
  { stem: 'montelukast', brand: 'Singulair', klass: L('Antileucotriene'), din: '02238217',
    text: L('Montelukast 10 mg — 1 co DIE HS'),
    label: L('Montelukast 10 mg'),
    details: { molecule: L('Montelukast'), dose: '10', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'DIE', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: L('Antileucotriene') } },
  { stem: 'cetirizine', brand: 'Reactine', klass: L('Antihistaminique'), din: '02238934',
    text: L('Cetirizine 10 mg — 1 co DIE PRN'),
    label: L('Cetirizine 10 mg'),
    details: { molecule: L('Cetirizine'), dose: '10', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'DIE PRN', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: L('Antihistaminique') } },
  { stem: 'prednisone', brand: 'Winpred', klass: L('Corticosteroide'), din: '00021695',
    text: L('Prednisone 5 mg — selon schema degressif'),
    label: L('Prednisone 5 mg'),
    details: { molecule: L('Prednisone'), dose: '5', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: '', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: L('Corticosteroide') } },
  { stem: 'acetaminophene', brand: 'Tylenol', klass: L('Analgesique'), din: '00559407',
    text: L('Acetaminophene 500 mg — 1-2 co QID PRN'),
    label: L('Acetaminophene 500 mg'),
    details: { molecule: L('Acetaminophene'), dose: '500', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'QID PRN', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: L('Analgesique') } },
  { stem: 'ibuprofene', brand: 'Advil', klass: L('AINS'), din: '02240333',
    text: L('Ibuprofene 400 mg — 1 co TID PRN c. repas'),
    label: L('Ibuprofene 400 mg'),
    details: { molecule: L('Ibuprofene'), dose: '400', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'TID PRN', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: L('AINS') } },
  { stem: 'naproxene', brand: 'Naprosyn', klass: L('AINS'), din: '02246699',
    text: L('Naproxene 500 mg — 1 co BID c. repas'),
    label: L('Naproxene 500 mg'),
    details: { molecule: L('Naproxene'), dose: '500', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'BID', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: L('AINS') } },
  { stem: 'vitamine d', brand: 'D-Tabs', klass: L('Supplement'), din: '02248860',
    text: L('Vitamine D 1000 UI — 1 co DIE'),
    label: L('Vitamine D 1000 UI'),
    details: { molecule: L('Vitamine D'), dose: '1000', unit: 'UI', form: 'comprimé', route: 'PO',
      frequency: 'DIE', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: L('Supplement') } },
  { stem: 'nitrofurantoine', brand: 'Macrobid', klass: L('Antibiotique'), din: '02182780',
    text: L('Nitrofurantoine 100 mg — 1 caps BID x 5 j'),
    label: L('Nitrofurantoine 100 mg'),
    details: { molecule: L('Nitrofurantoine'), dose: '100', unit: 'mg', form: 'gélule', route: 'PO',
      frequency: 'BID', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: L('Cystite non compliquee'), notes: L('Antibiotique') } },
  { stem: 'trimethoprime-sulfamethoxazole', brand: 'Septra DS', klass: L('Antibiotique'), din: '00445282',
    text: L('Trimethoprime-sulfamethoxazole 800/160 mg — 1 co BID x 3 j'),
    label: L('Trimethoprime-sulfamethoxazole 800/160 mg'),
    details: { molecule: L('Trimethoprime-sulfamethoxazole'), dose: '800/160', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'BID', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: L('Cystite non compliquee'), notes: L('Antibiotique') } },
  { stem: 'fosfomycine', brand: 'Monurol', klass: L('Antibiotique'), din: '02244360',
    text: L('Fosfomycine 3 g — 1 sachet, dose unique'),
    label: L('Fosfomycine 3 g'),
    details: { molecule: L('Fosfomycine'), dose: '3', unit: 'g', form: 'sachet', route: 'PO',
      frequency: '', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: L('Cystite non compliquee'), notes: L('Antibiotique') } },
  { stem: 'ciprofloxacine', brand: 'Cipro', klass: L('Antibiotique'), din: '02229521',
    text: L('Ciprofloxacine 500 mg — 1 co BID x 7 j'),
    label: L('Ciprofloxacine 500 mg'),
    details: { molecule: L('Ciprofloxacine'), dose: '500', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'BID', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: L('Pyelonephrite / UTI compliquee'), notes: L('Antibiotique'),
      // Alerte SIMULÉE pour montrer l'état « interaction de haut risque » de la
      // puce (chipIssues, editor-schema.jsx) — pas une donnée clinique.
      alert: { level: 'high', message: L('Interaction de haut risque avec la médication au dossier (exemple simulé, à valider cliniquement)') } } },
  { stem: 'amoxicilline-clavulanate', brand: 'Clavulin', klass: L('Antibiotique'), din: '02238829',
    text: L('Amoxicilline-clavulanate 875/125 mg — 1 co BID x 7 j'),
    label: L('Amoxicilline-clavulanate 875/125 mg'),
    details: { molecule: L('Amoxicilline-clavulanate'), dose: '875/125', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'BID', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: L('UTI compliquee'), notes: L('Antibiotique') } },
  { stem: 'cephalexine', brand: 'Keflex', klass: L('Antibiotique'), din: '00583413',
    text: L('Cephalexine 500 mg — 1 caps QID x 7 j'),
    label: L('Cephalexine 500 mg'),
    details: { molecule: L('Cephalexine'), dose: '500', unit: 'mg', form: 'gélule', route: 'PO',
      frequency: 'QID', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: L('UTI (grossesse, alternative)'), notes: L('Antibiotique') } },
  // Ajouts pour les textes rapides de pneumonie (PLAN-gabarits-conclusion.md),
  // hors de medicaments.json : posologies usuelles de l'adulte, SIMULÉES, à
  // valider cliniquement. DIN laissé vide plutôt qu'inventé.
  { stem: 'amoxicilline', brand: 'Amoxil', klass: L('Antibiotique'), din: '',
    text: L('Amoxicilline 1 g — 2 caps TID x 5 j'),
    label: L('Amoxicilline 1 g'),
    details: { molecule: L('Amoxicilline'), dose: '1', unit: 'g', form: 'gélule', route: 'PO',
      frequency: 'TID', duration: '5', durationUnit: 'jours', quantity: '30', refills: '0',
      indication: L('Pneumonie acquise en communauté'), notes: L('Antibiotique') } },
  { stem: 'doxycycline', brand: 'Vibra-Tabs', klass: L('Antibiotique'), din: '',
    text: L('Doxycycline 100 mg — 1 co BID x 5 j'),
    label: L('Doxycycline 100 mg'),
    details: { molecule: L('Doxycycline'), dose: '100', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'BID', duration: '5', durationUnit: 'jours', quantity: '10', refills: '0',
      indication: L('Pneumonie acquise en communauté'), notes: L('Prendre avec un grand verre d’eau, rester debout 30 min.') } },
  { stem: 'azithromycine', brand: 'Zithromax', klass: L('Antibiotique'), din: '',
    text: L('Azithromycine 250 mg — 2 co J1 puis 1 co DIE J2 à J5'),
    label: L('Azithromycine 250 mg'),
    details: { molecule: L('Azithromycine'), dose: '250', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'DIE', duration: '5', durationUnit: 'jours', quantity: '6', refills: '0',
      indication: L('Pneumonie acquise en communauté'), notes: L('500 mg (2 co) le jour 1, puis 250 mg DIE les jours 2 à 5.') } },
  // Ajouts pour les textes rapides des maladies courantes : clé explicite
  // (`key`), pour que deux ajouts en fin de tableau ne prennent pas le même
  // `cat-N`. Posologies usuelles de l'adulte, SIMULÉES, à valider cliniquement.
  { key: 'penv600', stem: 'penicilline v', brand: 'Pen-Vee', klass: L('Antibiotique'), din: '',
    text: L('Pénicilline V 600 mg — 2 co BID x 10 j'),
    label: L('Pénicilline V 600 mg'),
    details: { molecule: L('Pénicilline V'), dose: '600', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'BID', duration: '10', durationUnit: 'jours', quantity: '40', refills: '0',
      indication: L('Pharyngite à streptocoque'), notes: L('Antibiotique') } },
  { key: 'oseltamivir75', stem: 'oseltamivir', brand: 'Tamiflu', klass: L('Antiviral'), din: '',
    text: L('Oseltamivir 75 mg — 1 caps BID x 5 j'),
    label: L('Oseltamivir 75 mg'),
    details: { molecule: L('Oseltamivir'), dose: '75', unit: 'mg', form: 'gélule', route: 'PO',
      frequency: 'BID', duration: '5', durationUnit: 'jours', quantity: '10', refills: '0',
      indication: L('Influenza'), notes: L('Commencer dans les 48 h suivant le début des symptômes.') } },
  { key: 'valacyclovir1g', stem: 'valacyclovir', brand: 'Valtrex', klass: L('Antiviral'), din: '',
    text: L('Valacyclovir 1 g — 1 co TID x 7 j'),
    label: L('Valacyclovir 1 g'),
    details: { molecule: L('Valacyclovir'), dose: '1', unit: 'g', form: 'comprimé', route: 'PO',
      frequency: 'TID', duration: '7', durationUnit: 'jours', quantity: '21', refills: '0',
      indication: L('Zona'), notes: L('Commencer dans les 72 h suivant l’éruption.') } },
  { key: 'fluticasone-nasal', stem: 'fluticasone nasal', brand: 'Flonase', klass: L('Corticostéroïde nasal'), din: '',
    text: L('Fluticasone nasal 50 mcg/vap. — 2 vap. par narine DIE'),
    label: L('Fluticasone nasal 50 mcg/vap.'),
    details: { molecule: L('Fluticasone (nasal)'), dose: '50', unit: 'mcg/vap.', form: 'vaporisateur', route: 'Nasal',
      frequency: 'DIE', duration: '', durationUnit: '', quantity: L('1 flacon'), refills: '0',
      indication: L('Sinusite, rhinite'), notes: L('2 vaporisations dans chaque narine.') } },
  // Migraine (PLAN-reference-specialite.md, lot 2) : le triptan du texte rapide.
  { key: 'sumatriptan50', stem: 'sumatriptan', brand: 'Imitrex', klass: L('Triptan'), din: '',
    text: L('Sumatriptan 50 mg — 1 co au début de la crise, max. 4 co par 24 h'),
    label: L('Sumatriptan 50 mg'),
    details: { molecule: L('Sumatriptan'), dose: '50', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'PRN', duration: '', durationUnit: '', quantity: '6', refills: '2',
      indication: L('Migraine'), notes: L('Au début de la crise ; répéter après 2 h au besoin.') } },
  { key: 'prednisone50', stem: 'prednisone', brand: 'Winpred', klass: L('Corticosteroide'), din: '',
    text: L('Prednisone 50 mg — 1 co DIE x 5 j'),
    label: L('Prednisone 50 mg'),
    details: { molecule: L('Prednisone'), dose: '50', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'DIE', duration: '5', durationUnit: 'jours', quantity: '5', refills: '0',
      indication: L('Exacerbation d’asthme ou de MPOC'), notes: L('Prendre le matin avec de la nourriture.') } }
];

function _norm(s) { return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
// Une recherche trouve un produit par son nom dans l'une ou l'autre langue : le
// texte affiché, plus son équivalent dans l'autre langue (I18N.other) quand il existe.
function _hay(s) { return _norm(s) + ' ' + _norm(window.I18N.other(s)); }

// =========================================================
// Rx search — commande « /rx » (favoris, fréquents, autres)
// =========================================================
const RX_FAVS = new Set(['amox500', 'vento100']);

const RX_ITEMS = [
  { key: 'amox500', name: L('Amoxicilline'), dose: '500mg',
    sig: L('1 comp. PO TID, #21, 7j, R0'),
    chipSig: L('1 comp. PO TID #21 7j R0'),
    details: { molecule: L('Amoxicilline'), dose: '500', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'TID', duration: '7', durationUnit: 'jours', quantity: '21', refills: '0',
      indication: L('Otite moyenne aiguë'), notes: L('Prendre avec nourriture.'),
      pedsDosing: { mgPerKg: 15, maxMgPerDose: 500, freq: 'TID (q8h)' } } },
  { key: 'vento100', name: L('Ventolin'), dose: '100mcg',
    sig: L('2 inh. q4-6h PRN, R5'),
    chipSig: L('2 inh q4-6h PRN R5'),
    details: { molecule: L('Salbutamol (Ventolin)'), dose: '100', unit: 'mcg/inh', form: 'aérosol-doseur', route: 'Inhalé',
      frequency: 'q4-6h PRN', duration: '', durationUnit: '', quantity: L('1 inhalateur'), refills: '5',
      indication: L('Bronchospasme'), notes: L('Avec aérochambre.') } },
];

function _cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

// Nombre d'unités par prise (modale « Dose ») + abréviation de forme → « 2 comp. »
function _rxQty(d) {
  return window.RX_TEXT.qtyLabel(d);
}
function _rxFreq(d) {
  return L(d.frequency || '') + (d.prn && !/prn/i.test(d.frequency || '') ? ' PRN' : '');
}
function deriveRxSig(d) {
  const dur = d.duration && d.duration !== '—'
    ? window.RX_TEXT.durationShort(d)
    : '';
  return [_rxQty(d), d.route, _rxFreq(d),
    d.quantity && /^\d+$/.test(d.quantity) ? '#' + d.quantity : '',
    dur,
    'R' + ((d.refills === undefined || d.refills === null || String(d.refills) === '') ? '0' : d.refills)]
    .filter(Boolean).join(' ');
}

function deriveRx(d, prev) {
  return {
    name: d.molecule || (prev && prev.name) || '',
    dose: d.dose ? d.dose + (d.unit || '') : '',
    sig: deriveRxSig(d),
    kind: 'rx'
  };
}

const RX_OTHERS = MED_CATALOG.map(function (m, i) {
  return {
    key: m.key || 'cat-' + i, name: m.details.molecule || _cap(m.stem), brand: m.brand,
    klass: m.klass, din: m.din,
    dose: (m.details.dose + ' ' + m.details.unit).trim(),
    sig: (m.text.split(' — ')[1] || '') + (m.klass ? ', ' + m.klass : ''),
    chipSig: deriveRxSig(m.details),
    details: m.details
  };
});

const RX_ALL = RX_ITEMS.concat(RX_OTHERS);

// Médications au dossier du patient (profil pharmacologique — cf. sommaire).
// Affichées en tête du menu /rx avec leur statut, toutes prescriptibles (spec
// Figma « Recherche », EX-023). Statuts : 'active' (Actif), 'echue' (Échu),
// 'cessée' (Cessé) — mêmes clés que le Sommaire (MEDS_STATUS_COLOR). Contenu
// d'exemple fictif, à valider : le Figma montre Sertraline et Tylenol ; ici le
// profil garde le Tylenol et la nitrofurantoïne déjà au Sommaire.
const MED_STATUS_LABEL = { active: t('data.medStatusActive.text'), echue: t('data.medStatusExpired.text'), 'cessée': t('data.medStatusCeased.text') };
const PATIENT_MEDS = window.forPatient({ adulte: [
  // Micheline Lamontagne (patients.js) : le profil que reprend le Figma
  // « Demande de consultation en médecine spécialisée » — almotriptan et
  // candesartan cochés d'office dans les médicaments essayés de la référence.
  { key: 'med-almotriptan', name: L('Almotriptan'), dose: '12,5 mg', med: true, medStatus: 'active', medStatusLabel: L('actif'),
    sig: L('1 co PO PRN'),
    chipSig: L('1 co PO PRN'),
    details: { molecule: L('Almotriptan'), dose: '12,5', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'PRN', duration: '', durationUnit: '', quantity: '', refills: '0',
      indication: L('Migraine'), notes: L('Au début de la crise, max. 2 co par 24 h.') } },
  { key: 'med-candesartan', name: L('Candesartan'), dose: '8 mg', med: true, medStatus: 'active', medStatusLabel: L('actif'),
    doseSteps: ['4', '8', '16'], // paliers d'exemple (mg), à valider
    sig: L('1 co PO DIE'),
    chipSig: L('1 co PO DIE'),
    details: { molecule: L('Candesartan'), dose: '8', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'DIE', duration: '', durationUnit: '', quantity: '', refills: '0',
      indication: L('Prophylaxie de la migraine'), notes: L('Profil actif au dossier.') } },
  { key: 'med-levothyroxine', name: L('Lévothyroxine'), dose: '75 mcg', med: true, medStatus: 'active', medStatusLabel: L('actif'),
    sig: L('1 co PO DIE'),
    chipSig: L('1 co PO DIE'),
    details: { molecule: L('Lévothyroxine'), dose: '75', unit: 'mcg', form: 'comprimé', route: 'PO',
      frequency: 'DIE', duration: '', durationUnit: '', quantity: '', refills: '0',
      indication: L('Hypothyroïdie'), notes: L('Profil actif au dossier.') } },
  { key: 'med-naproxene', name: L('Naproxène'), dose: '500 mg', med: true, medStatus: 'cessée', medDate: '11/2025', medStatusLabel: L('cessé (inefficace)'),
    sig: L('1 co PO BID'),
    chipSig: L('1 co PO BID'),
    details: { molecule: L('Naproxène'), dose: '500', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'BID', duration: '', durationUnit: '', quantity: '', refills: '0',
      indication: L('Migraine'), notes: L('Cessé 11/2025.') } },
], pediatrique: [
  { key: 'med-tylenol-100', name: L('Tylenol'), dose: '100 mg', med: true, medStatus: 'active', medStatusLabel: L('actif'),
    renewSoon: true, doseSteps: ['100', '325', '500', '650'], // paliers d'exemple (mg), à valider
    sig: L('1 co PO PRN'),
    chipSig: L('1 co PO PRN'),
    details: { molecule: L('Tylenol'), dose: '100', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'PRN', duration: '', durationUnit: '', quantity: '', refills: '0',
      indication: L('Douleur'), notes: L('Profil actif au dossier.') } },
  { key: 'med-tylenol-500', name: L('Tylenol'), dose: '500 mg', med: true, medStatus: 'echue', doseSteps: ['100', '325', '500', '650'], medDate: '02/2026', medStatusLabel: L('échue 02/2026'),
    sig: L('2 co PO DIE'),
    chipSig: L('2 co PO DIE'),
    details: { molecule: L('Tylenol'), dose: '500', unit: 'mg', form: 'comprimé', qtyDose: '2', route: 'PO',
      frequency: 'DIE', duration: '', durationUnit: '', quantity: '', refills: '0',
      indication: L('Douleur'), notes: L('Échue au dossier (02/2026).') } },
  { key: 'med-nitrofurantoine', name: L('Nitrofurantoïne'), dose: '100 mg', med: true, medStatus: 'cessée', medDate: '12/2025', medStatusLabel: L('cessée (ITU)'),
    sig: L('1 co PO BID'),
    chipSig: L('1 co PO BID'),
    details: { molecule: L('Nitrofurantoïne'), dose: '100', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'BID', duration: '5', durationUnit: 'jours', quantity: '10', refills: '0',
      indication: L('Infection urinaire'), notes: L('Cessée 12/2025.') } },
] });

// Boutons d'une ligne du menu /rx (RxMenu), dans l'ordre d'affichage. Une
// médication déjà au dossier : renouveler, augmenter, diminuer, cesser (active ou
// échue) ; prescrire seul, le « + » (cessée). « Documenter » (l'ajouter au
// profil sans prescrire) n'est offert que pour un produit qui n'est pas au
// dossier : il est toujours actif, sans tweak. « Mentionner » (référencer une
// médication du dossier sans prescription) n'est plus offert : la commande
// `mentionner` de runOrderCommand reste. Le clic ou Entrée sur la ligne reste
// l'action principale : `defaultMedAction` — renouveler une médication active ou
// échue, une nouvelle prescription sans marque de renouvellement pour une cessée
// ou un produit du catalogue (undefined). Augmenter / diminuer remplacent
// l'ancien « Ajuster » (Figma « Recherche de prescriptions », 2026-10-15).
function medActions(it) {
  if (!it || !it.med) return ['documenter'];
  if (it.medStatus === 'active' || it.medStatus === 'echue') return ['renouveler', 'augmenter', 'diminuer', 'cesser'];
  return ['prescrire']; // cessée : seulement le « + »
}
// Palier de dose suivant (dir 'up') ou précédent (dir 'down') d'une médication
// au profil : { from, to } en nombre (mg), ou null quand elle n'a pas de paliers,
// que sa dose n'en est pas un, ou qu'elle est déjà au bout de l'échelle.
function medDoseStep(it, dir) {
  if (!it || !it.med || !it.doseSteps || !it.details) return null;
  const steps = it.doseSteps, i = steps.indexOf(String(it.details.dose));
  if (i < 0) return null;
  const j = dir === 'up' ? i + 1 : i - 1;
  return j >= 0 && j < steps.length ? { from: steps[i], to: steps[j] } : null;
}
// La médication avec sa dose changée d'un palier : { item, dir, from, to }, ou
// null. La posologie de la puce est recalculée (deriveRxSig).
function adjustMedDose(it, dir) {
  const step = medDoseStep(it, dir);
  if (!step) return null;
  const unit = (it.details.unit || '').trim();
  const details = Object.assign({}, it.details, { dose: step.to });
  const sig = deriveRxSig(details);
  const item = Object.assign({}, it, { dose: (step.to + ' ' + unit).trim(), sig: sig, chipSig: sig, details: details });
  return { item: item, dir: dir, from: step.from, to: step.to, unit: unit };
}

// Filtres du menu /rx (rail à droite, Figma « Recherche de prescriptions ») :
// Tout, Renouvelables (échues ou à renouveler bientôt), Actives, Cessées,
// Favoris, Gabarits (ceux qui proposent une ordonnance). Le filtre vit le temps
// d'une recherche, comme les favoris figés (endOrderSearch).
const RX_FILTERS = [
  { key: 'tout', label: t('data.filterAll.label'), icon: 'collections_bookmark' },
  { key: 'renouvelables', label: t('data.filterRenewable.label'), icon: 'history' },
  { key: 'actives', label: t('data.filterActive.label'), icon: 'check_circle' },
  { key: 'cessees', label: t('data.filterCeased.label'), icon: 'block' },
  { key: 'favoris', label: t('data.filterFavorites.label'), icon: 'favorite_border' },
  { key: 'phrases', label: t('data.filterPhrases.label'), icon: 'assignment' },
];
let _rxFilter = 'tout';
function setRxFilter(f) { _rxFilter = RX_FILTERS.some(function (x) { return x.key === f; }) ? f : 'tout'; }
function getRxFilter() { return _rxFilter; }
function isRenewable(it) { return !!(it && it.med && (it.medStatus === 'echue' || it.renewSoon)); }
// `r` = résultat de searchRx ; rend la liste du filtre choisi.
function applyRxFilter(r, f) {
  const none = { profil: [], favoris: [], frequents: [], autres: [] };
  switch (f) {
    case 'renouvelables': return Object.assign(none, { profil: r.profil.filter(isRenewable) });
    case 'actives': return Object.assign(none, { profil: r.profil.filter(function (it) { return it.medStatus === 'active'; }) });
    case 'cessees': return Object.assign(none, { profil: r.profil.filter(function (it) { return it.medStatus === 'cessée'; }) });
    case 'favoris': return Object.assign(none, { favoris: r.favoris });
    // Hors du dossier : les favoris, les traitements fréquents et les autres produits trouvés.
    case 'phrases': return Object.assign(none, { favoris: r.favoris, frequents: r.frequents, autres: r.autres });
    default: return r;
  }
}
// Allergies du patient (débrief du 2026-10-28) : la recherche /rx masque les
// produits d'une classe à laquelle le patient est allergique et le dit dans une
// bannière ; « Afficher » les remet, marqués. Les médications au dossier ne sont
// jamais masquées. Le Sommaire tient la liste à jour (setPatientAllergies) ;
// classes et correspondances simulées, à valider cliniquement.
const ALLERGEN_CLASSES = [
  { key: 'penicilline', allergy: /penicill|amoxicill|ampicill|cloxacill/, product: /penicill|amoxicill|ampicill|cloxacill|piperacill/ },
  // Sulfamides antibactériens (2e patiente, RA-38) : le TMP-SMX (cat-45).
  { key: 'sulfamides', allergy: /sulfam|sulfon/, product: /sulfamethox/ },
];
let _patientAllergies = window.forPatient({ pediatrique: [L('Pénicilline')], adulte: [L('Sulfamides')] });
let _showAllergens = false;
function setPatientAllergies(names) { _patientAllergies = (names || []).filter(Boolean); }
function getPatientAllergies() { return _patientAllergies.slice(); }
function setShowAllergens(on) { _showAllergens = !!on; }
// L'allergie au dossier qui exclut ce produit, ou null.
function rxAllergyOf(it) {
  if (!it || it.med) return null;
  const hay = _hay(it.name) + ' ' + _hay((it.details && it.details.molecule) || '');
  for (let i = 0; i < _patientAllergies.length; i++) {
    const a = _hay(_patientAllergies[i]);
    const cls = ALLERGEN_CLASSES.find(function (c) { return c.allergy.test(a); });
    if (cls ? cls.product.test(hay) : (a.trim() && hay.includes(_norm(_patientAllergies[i])))) return _patientAllergies[i];
  }
  return null;
}
// Retire des sections hors dossier les produits allergènes (sauf « Afficher ») ;
// `allergy` = { count, names, shown } quand la recherche en a trouvé.
function applyAllergyFilter(r) {
  const out = Object.assign({}, r);
  let count = 0; const names = [];
  ['contexte', 'favoris', 'frequents', 'autres'].forEach(function (k) {
    if (!r[k]) return;
    out[k] = r[k].filter(function (it) {
      const a = rxAllergyOf(it);
      if (!a) return true;
      count += 1;
      if (names.indexOf(a) < 0) names.push(a);
      return _showAllergens;
    });
  });
  if (count) out.allergy = { count: count, names: names, shown: _showAllergens };
  return out;
}

// Compteurs du rail, pour la recherche en cours. Tout = les lignes que « Tout »
// affiche.
function rxFilterCounts(q, favs) {
  const r = applyAllergyFilter(searchRx(q, favs));
  const tout = r.profil.length + r.favoris.length + r.frequents.length + r.autres.length;
  return { tout: tout, renouvelables: r.profil.filter(isRenewable).length,
    actives: r.profil.filter(function (it) { return it.medStatus === 'active'; }).length,
    cessees: r.profil.filter(function (it) { return it.medStatus === 'cessée'; }).length,
    favoris: r.favoris.length, phrases: r.favoris.length + r.frequents.length + r.autres.length };
}

// Texte du statut d'une médication au profil, pour la puce documentaire :
// « Cessé 12/2025 », « Échu 02/2026 » ; vide pour une médication active.
function medStatusText(m) {
  if (!m || !m.medStatus || m.medStatus === 'active') return '';
  return MED_STATUS_LABEL[m.medStatus] + (m.medDate ? ' ' + m.medDate : '');
}
// « + » du Sommaire derrière le tweak « Le « + » du sommaire ajoute dans la
// note » : ce que la boîte demande à la note. { documentAs } = région
// diagnostic (/dx) documentée comme problème ou antécédent ; { command } =
// fonction de la note (/rx) ; null = l'ancienne modale de la boîte.
function summaryAddDetail(sectionId) {
  const dx = { problems: 'probleme', history: 'antecedent' };
  const fn = { meds: 'rx' };
  if (dx[sectionId]) return { documentAs: dx[sectionId] };
  if (fn[sectionId]) return { command: fn[sectionId] };
  return null;
}
function defaultMedAction(it) {
  if (!it || !it.med) return undefined;
  return it.medStatus === 'cessée' ? undefined : 'renouveler';
}

function searchRx(q, favs) {
  const favSet = favs || RX_FAVS;
  const nq = _norm((q || '').trim());
  const match = function (it) {
    if (!nq) return true;
    if (_hay(it.name).includes(nq)) return true;
    if (it.brand && _norm(it.brand).includes(nq)) return true;
    if (it.klass && _hay(it.klass).includes(nq)) return true;
    if (it.din && /\d/.test(nq) && it.din.includes(nq.replace(/\D/g, ''))) return true;
    return false;
  };
  const profil = PATIENT_MEDS.filter(match); // tous les statuts : actif, échu, cessé
  const favoris = RX_ALL.filter(function (it) { return favSet.has(it.key) && match(it); });
  const frequents = RX_ALL.filter(function (it) { return it.freq && !favSet.has(it.key) && match(it); });
  const autres = nq
    ? RX_ALL.filter(function (it) { return !it.freq && !favSet.has(it.key) && match(it); }).slice(0, 6)
    : [];
  return { profil, favoris, frequents, autres };
}

function toggleRxFav(key) { RX_FAVS.has(key) ? RX_FAVS.delete(key) : RX_FAVS.add(key); }

// =========================================================
// Laboratoire — commande « /lab » (PLAN-menu-requetes-labo.md)
// =========================================================
// Catalogue : la liste « contenu fourni » du prototype « Menu requete »
// (Claude Design, 2026-10-14, décision D1), termes repris tels quels,
// coquilles comprises (« Électrolytes (Na, K, CI) »). Une analyse est une
// chaîne, ou un objet quand il lui faut une clé connue (gabarits, bilans,
// données du dossier), un acronyme (`short`, montré dans la puce) ou des
// alias de recherche (`alias`, FR et EN, table du prototype). La spirométrie
// reste dans /lab (RA-25), seule dans son groupe.
const LAB_GROUPS = [
  { key: 'biochimie', name: L('Biochimie'), tests: [
    L('Acide folique'), L('Acide urique'), L('Acide valproïque'),
    { key: 'alb', name: L('Albumine') },
    { key: 'pal', name: L('Phosphatase alcaline'), short: L('PAL'), alias: 'pal alp' },
    { key: 'alt', name: L('Alanine aminotransférase'), short: L('ALT'), alias: 'alt' },
    { key: 'srum', name: L("Analyse d'urine"), alias: 'au smu urine' },
    { key: 'ttg', name: L('Anticorps anti-transglutaminase'), short: L('Anti-TTG'), alias: 'ttg' },
    { key: 'tpo', name: L('Anticorps antithyroïdiens'), alias: 'tpo' },
    { key: 'apob', name: L('Apolipoprotéine B'), short: L('Apo B'), alias: 'apob apo b', fasting: true },
    { key: 'ast', name: L('Aspartate aminotransférase'), short: L('AST'), alias: 'ast' },
    { key: 'bhcg', name: L('Beta-HCG'), alias: 'bhcg hcg' },
    { key: 'bili', name: L('Bilirubine (totale)') },
    { key: 'bun', name: L('Azote uréique du sang'), short: L('BUN'), alias: 'bun' },
    { key: 'ca', name: L('Calcium (total)') },
    { key: 'ca125', name: L('Cancer antigen 125'), short: L('CA 125'), alias: 'ca125 ca-125' },
    L('Analyse de calcul'),
    { key: 'ace', name: L('Antigène carcinoembryonaire'), short: L('ACE'), alias: 'ace cea' },
    { key: 'chol', name: L('Cholestérol total'), fasting: true },
    { key: 'hdl', name: L('Lipoprotéines de haute densité'), short: L('HDL'), alias: 'hdl', fasting: true },
    { key: 'ldl', name: L('Lipoprotéine de basse densité'), short: L('LDL'), alias: 'ldl', fasting: true },
    { key: 'ckmb', name: L('Créatine kinase-MB'), short: L('CK-MB'), alias: 'ck-mb ckmb' },
    L('Cortisol - AM'), L('Cortisol - Au hasard'), L('Cortisol - PM'), L('Cortisol - Urine de 24 h'),
    { key: 'creat', name: L('Créatinine sérique'), alias: 'creat' },
    { key: 'ions', name: L('Électrolytes (Na, K, CI)'), short: L('Électrolytes'), alias: 'lytes ions na k cl' },
    L('Électrophorèse (hémoglobine)'),
    { key: 'eps', name: L('Électrophorèse des protéines sériques'), short: L('EPS'), alias: 'eps' },
    { key: 'oestradiol', name: L('Oestradiol') },
    { key: 'fer', name: L('Fer') },
    { key: 'ferritine', name: L('Ferritine') },
    { key: 'fsh', name: L('Hormone folliculo-stimulante'), short: L('FSH'), alias: 'fsh' },
    L('Glucose 1 h post 50 g glucose PO'),
    { key: 'hgpo', name: L('Glucose 2 h post 75 g glucose PO'), alias: 'hgpo' },
    { key: 'glyc', name: L('Glucose à jeun'), alias: 'glycemie gaj', fasting: true },
    { key: 'glucose', name: L('Glucose'), alias: 'glycemie' },
    L('Glucose 2 h post 100 g glucose PO'),
    { key: 'hba1c', name: L('Hémoglobine glyquée'), short: L('HbA1c'), alias: 'hba1c a1c' },
    L('Immunoglobulines'),
    { key: 'k', name: L('Potassium'), alias: 'k' },
    { key: 'ldh', name: L('Lactate déshydrogénase'), short: L('LDH'), alias: 'ld ldh' },
    { key: 'lh', name: L('Hormone lutéino-stimulante'), short: L('LH'), alias: 'lh' },
    L('Lithium'),
    { key: 'lipase', name: L('Triacylglycérol lipase'), short: L('Lipase'), alias: 'lipase' },
    { key: 'mg', name: L('Magnésium'), alias: 'mg' },
    { key: 'na', name: L('Sodium'), alias: 'na' },
    L('Phénytoïne'), L('Phosphore'),
    { key: 'prolactine', name: L('Prolactine') },
    { key: 'aps', name: L('Antigène prostatique spécifique'), short: L('APS'), alias: 'aps psa' },
    { key: 'rsosi', name: L('Recherche de sang occulte (selles)'), short: L('RSOSi'), alias: 'rsosi' },
    { key: 't4l', name: L('T4 libre'), alias: 't4l' },
    { key: 'grossesse', name: L('Test de grossesse (qualitatif)'), alias: 'bhcg' },
    { key: 'testo', name: L('Testostérone') },
    { key: 'tg', name: L('Triglycérides'), alias: 'tg trig', fasting: true },
    { key: 'tsh', name: L('Hormone thyréostimulante'), short: L('TSH'), alias: 'tsh' },
    L('Urée'), L('Acide urique (Urine 24h)'), L('Calcium (Urine 24)'), L('Clairance créatinine (Urine 24h)'),
    L('Protéine (Urine 24h)'), L('Magnésium (Urine 24h)'), L('Phosphore (Urine 24h)'),
    { key: 'b12', name: L('Vitamine B12'), short: L('B12'), alias: 'b12' },
    { key: 'vitd', name: L('Vitamine D'), short: L('Vit D'), alias: 'vit d 25-oh' }
  ] },
  { key: 'biochimie-urinaire', name: L('Biochimie urinaire'), tests: [
    L('Électrophorèse des protéines (urine)'),
    { key: 'microalb', name: L('Microalbumine (Urine)'), alias: 'microalb rac' },
    L('Protéine totale (Urine)')
  ] },
  { key: 'hematologie', name: L('Hématologie'), tests: [
    L('Antithrombine III'), L('Fibrinogène'), L('Frottis sanguin'),
    { key: 'fsc', name: L('Formule sanguine complète'), short: L('FSC'), alias: 'fsc cbc' },
    { key: 'g6pd', name: L('Glucose-6-phosphate déshydrogénase'), short: L('G6PD'), alias: 'g6pd' },
    { key: 'crp', name: L('Protéine C-réactive'), short: L('CRP'), alias: 'crp pcr' },
    L('Protéine C+S'),
    { key: 'inr', name: L('International Normalized Ratio'), short: L('INR'), alias: 'inr rin pt' },
    { key: 'tca', name: L('Temps de céphaline induite'), short: L('TCA'), alias: 'tca ptt' },
    { key: 'fr', name: L('Facteur rhumatoïde'), alias: 'fr' },
    L('Réticulocytes'),
    { key: 'vs', name: L('Sédimentation'), alias: 'vs esr' },
    L('Streptozyme'), L('Temps de saignement'), L('Transfusion'),
    { key: 'vih', name: L('VIH 1+2 Ac + VIH 1 p24 Ag'), short: L('VIH'), alias: 'vih hiv' }
  ] },
  { key: 'medicament', name: L('Médicament'), tests: [
    L('Carbamazépine'), L('Digoxine'), L('Théophylline'), L('Tricycliques')
  ] },
  { key: 'microbiologie', name: L('Microbiologie'), tests: [
    L('Malaria'),
    { key: 'cguri', name: L('CGURI - Chlamydia+gono - Urine'), alias: 'chlamydia gonorrhee itss' },
    L('Chlamydia+gono - Col'), L('Chlamydia+gono - Urètre'),
    L('Culture - Expectorations'), L('Culture - Gorge'), L('Culture - Plaie/Pus'),
    L('Culture - Selles x1'), L('Culture - Selles x2'),
    { key: 'curine', name: L('Culture - Urine (bas compte de colonie non-requis)'), alias: 'cu culture urinaire' },
    L('Culture - Urogénital (précisez le site dans sectio'),
    L('Culture champignon - Crachat'), L('Culture champignons - Poil'), L("Culture champignons - Rognures d'ongles"),
    L('Cultures tuberculose - Crachat'), L('Cultures tuberculose - Urine (première urine du matin)'),
    { name: L('Dépistage de Staphylococcus aureus résistant à la méticilline - Autre site'), alias: 'sarm mrsa' },
    { name: L('Dépistage de Staphylococcus aureus résistant à la méticilline - Narines'), alias: 'sarm mrsa' },
    { name: L('Dépistage de Staphylococcus aureus résistant à la méticilline - Péri anal'), alias: 'sarm mrsa' },
    { name: L('Dépistage de Staphylococcus aureus résistant à la méticilline - Plaies/incision'), alias: 'sarm mrsa' },
    { name: L('Entérocoque résistant à la vancomycine'), alias: 'erv vre' },
    L('Enterobius vermicularis; Examen des oxyures'), L('Ova & parasites; Microscopie fond clair')
  ] },
  { key: 'serologie', name: L('Sérologie'), tests: [
    { key: 'aan', name: L('Anticorps antinucléaires'), short: L('AAN'), alias: 'aan ana' },
    L("Anticorps de l'hépatite B"),
    { key: 'hbsag', name: L("Antigène de l'hépatite B"), alias: 'hbsag' },
    L('Hépatite A'),
    { key: 'vhc', name: L('Hépatite C'), alias: 'vhc hcv' },
    { name: L('Monotest'), alias: 'mono' },
    { key: 'syphilis', name: L('Syphilis'), alias: 'vdrl' }
  ] },
  // Requête liée à l'asthme (table d'intention thérapeutique, DX_CONTEXTS) :
  // contenu d'exemple, à valider.
  { key: 'fonction-respiratoire', name: L('Fonction respiratoire'), tests: [
    { key: 'efr', name: L('Spirométrie (EFR)'), alias: 'efr', collection: L('Laboratoire de physiologie respiratoire') }
  ] }
];
const LAB_FAVS = new Set(['fsc', 'lipide']);
// Une analyse = un item de recherche, comme un médicament dans /rx : son nom,
// son groupe (badge et panneau de droite) et ses détails de requête.
const LAB_ITEMS = [];
LAB_GROUPS.forEach(function (g) {
  g.tests.forEach(function (x, i) {
    const o = typeof x === 'string' ? { name: x } : x;
    LAB_ITEMS.push({ key: o.key || g.key + '-' + i, name: o.name, dose: '', short: o.short || '', alias: o.alias || '',
      group: g.key, groupName: g.name, sig: g.name, chipSig: L('Routine'),
      details: { tests: [o.name], priority: 'Routine', fasting: !!o.fasting, context: '', collection: o.collection || L('Au CH le plus proche') } });
  });
});
function _labItem(key) { return LAB_ITEMS.find(function (it) { return it.key === key; }) || null; }

// Bilans courants (décision D2) : ceux de la requête de laboratoire papier,
// leurs analyses renommées selon le catalogue quand il en a une (clé), sinon
// gardées en texte. Un bilan se coche en entier dans le menu ; ses analyses
// arrivent dans une puce à son nom et chacune se retire dans le formulaire.
// Bilans prénatal 1 et 2 laissés de côté (contenu inconnu, Q-07 du
// prototype). Les trois profils d'avant (rencontre inline entity, ID-09)
// restent : les gabarits et les tests s'en servent. Contenu à valider.
const LAB_BILANS = [
  { key: 'bilan-base', name: L('Bilan de base'), tests: ['fsc', 'glucose', 'creat', 'k', 'na'] },
  { key: 'bilan-cardiaque', name: L('Bilan cardiaque'), tests: ['fsc', 'glucose', 'creat', 'k', 'na', L('Troponine T cardiaque'), L('Créatine kinase'), 'inr', 'tca'] },
  { key: 'bilan-hta-initial', name: L('Bilan HTA initial'), tests: ['na', 'k', 'creat', 'glyc', 'chol', 'hdl', 'ldl', 'tg', 'srum'] },
  { key: 'bilan-hta-suivi', name: L('Bilan HTA de suivi'), tests: ['na', 'k', 'creat', 'glyc', 'srum'] },
  { key: 'bilanhep', name: L('Bilan hépatique'), tests: ['alb', 'alt', 'pal', 'bili', L('Bilirubine directe')] },
  { key: 'bilan-hep-court', name: L('Bilan hépatique (court)'), tests: ['alt', 'pal', 'ast', L('GGT'), 'bili'] },
  { key: 'bilan-hep-urgence', name: L('Bilan hépatique urgence'), tests: ['fsc', 'glucose', 'creat', 'k', 'na', 'alt', 'ldh', 'bili', 'lipase', 'pal'] },
  { key: 'bilan-calcique', name: L('Bilan calcique'), tests: ['ca', 'alb'] },
  { key: 'lipide', name: L('Bilan lipidique'), tests: ['chol', 'hdl', 'ldl', 'tg'] },
  { key: 'bilan-lipidique-2', name: L('Bilan lipidique 2'), tests: ['hdl', 'ldl', 'chol', 'tg', 'apob', L('Rapport cholestérol total/HDL')] },
  { key: 'bilan-fatigue', name: L('Fatigue'), tests: ['fsc', 'ferritine', 'tsh', 'creat'] },
  { key: 'bilan-martial', name: L('Bilan martial'), tests: ['fsc', 'ferritine', 'crp'] },
  { key: 'bilan-pcos', name: L('Bilan PCOS'), tests: ['oestradiol', 'fsh', 'lh', 'bhcg', 'prolactine', L('17-OH progestérone'), 'testo', 'tsh', 'hba1c'] },
  { key: 'bilan-itss', name: L('Bilan ITSS'), tests: ['hbsag', 'vih', 'syphilis'] },
  { key: 'prof-diabete', name: L('Profil diabète'), tests: ['hba1c', 'glyc', 'creat', 'lipide'] },
  { key: 'prof-annuel', name: L('Bilan annuel'), tests: ['fsc', 'glyc', 'lipide', 'creat', 'tsh'] },
  { key: 'prof-anemie', name: L('Bilan anémie'), tests: ['fsc', 'ferritine', 'b12'] }
].map(function (b, i, all) {
  // Une clé d'analyse donne son item ; une clé de bilan, ses analyses ; un texte reste tel quel.
  const items = [];
  const tests = [];
  const add = function (name, it) { if (tests.indexOf(name) < 0) { tests.push(name); items.push(it); } };
  b.tests.forEach(function (x) {
    const it = _labItem(x);
    if (it) { add(it.name, it); return; }
    const sub = all.find(function (o) { return o.key === x; });
    if (sub) { sub.tests.forEach(function (y) { const s = _labItem(y); if (s) add(s.name, s); }); return; }
    add(x, null);
  });
  return { key: b.key, name: b.name, dose: '', profile: true, orderKind: 'lab',
    sig: items.map(function (it, j) { return it ? (it.short || it.name) : tests[j]; }).join(' · '),
    details: { tests: tests, priority: 'Routine', fasting: items.some(function (it) { return it && it.details.fasting; }), context: '', profile: b.name, profileTests: tests.slice() } };
});

// Acronyme d'une analyse (« Formule sanguine complète » → « FSC ») pour le
// nom d'une puce ; le nom complet reste dans le formulaire et l'infobulle.
function labShortName(name) {
  const it = LAB_ITEMS.find(function (x) { return x.name === name; });
  return (it && it.short) || name;
}

// Au dossier (RA-01 du prototype « Explorations requetes ») : les analyses
// déjà faites, leur dernier résultat et sa tendance par rapport au résultat
// précédent (décision D4). Repris des résultats du Sommaire
// (sommaire/store.jsx) ; « Stable » sous 5 % d'écart, seuil fictif (Q-08).
const LAB_ON_FILE = window.forPatient({ adulte: {
  fsc:   { date: '2026-05-12', value: L('Hb 128 g/L'), status: 'normal', prev: L('Hb 131 g/L'), trend: 'stable' },
  creat: { date: '2026-05-12', value: L('78 µmol/L'), status: 'normal', prev: L('74 µmol/L'), trend: 'stable' },
  ions:  { date: '2026-05-12', value: L('K 4,3 mmol/L'), status: 'normal' },
  tsh:   { date: '2026-05-12', value: L('2,4 mUI/L'), status: 'normal', prev: L('3,1 mUI/L'), trend: 'down' },
  hba1c: { date: '2026-05-12', value: '5,6 %', status: 'normal' }
}, pediatrique: {
  fsc:   { date: '2025-09-28', value: L('Hb 135 g/L'), status: 'normal', prev: L('Hb 141 g/L'), trend: 'stable' },
  creat: { date: '2025-09-28', value: L('82 µmol/L'), status: 'normal', prev: L('79 µmol/L'), trend: 'stable' },
  ldl:   { date: '2025-09-28', value: L('3,4 mmol/L'), status: 'anormal', prev: L('3,7 mmol/L'), trend: 'down' },
  tsh:   { date: '2025-09-28', value: L('2,1 mUI/L'), status: 'normal', prev: L('1,8 mUI/L'), trend: 'up' },
  fer:   { date: '2025-09-28', value: L('18 µmol/L'), status: 'normal' }
} });
function labOnFile(key) { return LAB_ON_FILE[key] || null; }
// Prévention (RA-16 du prototype) et Suggérés selon les problèmes actifs du
// Sommaire (RA-05) : la raison, la fréquence et l'échéance sur la 2e ligne.
// Contenu fictif, validation clinique requise (Q-01, Q-10 du prototype).
const LAB_PREVENTION = window.forPatient({ adulte: [
  { key: 'lipide', why: L('Dépistage de la dyslipidémie · aux 5 ans · dû depuis le 2026-03-01') },
  { key: 'hba1c', why: L('Dépistage du diabète · aux 3 ans · fait le 2026-05-12') }
], pediatrique: [
  { key: 'cguri', why: L('Dépistage des ITSS · selon les facteurs de risque') },
  { key: 'vih', why: L('Dépistage des ITSS · selon les facteurs de risque') },
  { key: 'syphilis', why: L('Dépistage des ITSS · selon les facteurs de risque') }
] });
const LAB_SUGGESTED = window.forPatient({ adulte: [
  { problem: L('Hypothyroïdie'), items: [
    { key: 'tsh', why: L('Aux 12 mois · prochain le 2027-05-12') }] },
  { problem: L('Migraine sans aura'), items: [
    { key: 'creat', why: L('Suivi du candesartan · aux 12 mois · prochain le 2027-05-12') },
    { key: 'ions', why: L('Suivi du candesartan · aux 12 mois · prochain le 2027-05-12') }] }
], pediatrique: [
  { problem: L('Hypertension artérielle'), items: [
    { key: 'ions', why: L('Aux 12 mois · jamais fait') },
    { key: 'creat', why: L('Aux 12 mois · dû depuis le 2026-09-28') }] },
  { problem: L('Dyslipidémie'), items: [
    { key: 'lipide', why: L('Aux 12 mois · dû depuis le 2026-09-28') },
    { key: 'apob', why: L('Selon le risque cardiovasculaire · jamais fait') }] }
] });

// Panneau de droite du menu /lab (RA-10 du prototype) : des vues, puis les
// groupes du catalogue. Une vue filtre aussi la recherche en cours, comme le
// rail de /rx (RA-17), et revient à « Tout » à chaque nouvelle recherche.
let _labView = 'tout';
function labViewKeys() {
  return ['tout', 'prev', 'sugg', 'favoris', 'bilans'].concat(LAB_GROUPS.map(function (g) { return g.key; }));
}
function setLabView(v) { _labView = labViewKeys().indexOf(v) >= 0 ? v : 'tout'; }
function getLabView() { return _labView; }

// Texte où chercher : nom (deux langues), acronyme, alias et nom du groupe
// (« biochimie » liste tout le groupe, RA-03 de « Menu sélection examens »).
function _labHay(it) {
  if (it.profile) return _hay(it.name) + ' ' + _hay(t('data.sectionLabBilans.title')) + ' ' + it.details.tests.map(_hay).join(' ');
  return _hay(it.name) + ' ' + _hay(it.short) + ' ' + _norm(it.alias) + ' ' + _hay(it.groupName);
}
function _labWith(list) {
  return list.map(function (x) {
    const it = _labItem(x.key) || LAB_BILANS.find(function (b) { return b.key === x.key; });
    return it ? Object.assign({}, it, { why: x.why }) : null;
  }).filter(Boolean);
}
// Toutes les vues pour la recherche `q` : { vue: [sections] }, une section =
// { key, title, items }. Sans recherche, Tout = Au dossier, Prévention,
// Suggérés, Favoris (RA-01, RA-16) ; avec une recherche, Tout = les bilans
// trouvés puis les analyses sous leur groupe.
function labViews(q, favSet) {
  const words = _norm((q || '').trim()).split(/\s+/).filter(Boolean);
  const match = function (it) { const h = _labHay(it); return words.every(function (w) { return h.includes(w); }); };
  const sec = function (key, title, items) { return { key: key, title: title, items: items.filter(match) }; };
  const all = LAB_ITEMS.concat(LAB_BILANS);
  const dossier = sec('dossier', t('data.sectionLabOnFile.title'), Object.keys(LAB_ON_FILE).map(_labItem).filter(Boolean));
  const prev = sec('prev', t('data.sectionLabPrevention.title'), _labWith(LAB_PREVENTION));
  const sugg = LAB_SUGGESTED.map(function (s, i) { return sec('sugg' + i, t('data.sectionLabSuggested.title', { problem: s.problem }), _labWith(s.items)); });
  const fav = sec('favoris', t('data.sectionFavorites.title'), all.filter(function (it) { return favSet.has(it.key); }));
  const bilans = sec('bilans', t('data.sectionLabBilans.title'), LAB_BILANS);
  const groups = LAB_GROUPS.map(function (g) { return sec(g.key, g.name, LAB_ITEMS.filter(function (it) { return it.group === g.key; })); });
  const v = {
    tout: words.length ? [bilans].concat(groups) : [dossier, prev].concat(sugg, [fav]),
    prev: [prev], sugg: sugg, favoris: [fav], bilans: [bilans]
  };
  LAB_GROUPS.forEach(function (g, i) { v[g.key] = [groups[i]]; });
  Object.keys(v).forEach(function (k) { v[k] = v[k].filter(function (s) { return s.items.length; }); });
  return v;
}
function _labCount(secs) { return secs.reduce(function (n, s) { return n + s.items.length; }, 0); }
// Recherche /lab : les sections de la vue choisie (`labSections`, rendues par
// RxMenu et aplaties pour le clavier par flattenRxResults).
function searchLab(q, favSet) {
  const v = labViews(q, favSet);
  return { labSections: v[_labView] || [], favoris: [], frequents: [], autres: [] };
}
// Le panneau de droite : chaque vue et chaque groupe, avec son nombre de
// résultats pour la recherche en cours.
const LAB_VIEW_DEFS = [
  { key: 'tout', label: t('data.labViewAll.label'), icon: 'folder_copy' },
  { key: 'prev', label: t('data.sectionLabPrevention.title'), icon: 'health_and_safety' },
  { key: 'sugg', label: t('data.labViewSuggested.label'), icon: 'lightbulb' },
  { key: 'favoris', label: t('data.sectionFavorites.title'), icon: 'favorite_border' },
  { key: 'bilans', label: t('data.sectionLabBilans.title'), icon: 'library_add_check' }
];
function labRail(q, favSet) {
  const v = labViews(q, favSet || _favFreeze.lab || LAB_FAVS);
  return LAB_VIEW_DEFS.map(function (d) { return Object.assign({ count: _labCount(v[d.key] || []) }, d); })
    .concat(LAB_GROUPS.map(function (g) { return { key: g.key, label: g.name, icon: 'folder', group: true, count: _labCount(v[g.key] || []) }; }));
}

// =========================================================
// Imagerie — commande « /img » (mêmes sections que /rx)
// =========================================================
const IMG_FAVS = new Set(['rxpoumon']);
const IMG_ITEMS = [
  { key: 'rxpoumon', name: L('Radiographie pulmonaire'), dose: '',
    sig: L('2 incidences (PA + latérale) · Sans contraste · Routine'),
    chipSig: L('2 incidences · Routine'),
    details: { modality: 'Radiographie', region: 'Thorax', views: 'PA + latérale', priority: 'Routine', context: '', contrast: 'Sans' } },
  { key: 'echoabdo', name: L('Échographie abdominale'), dose: '', freq: true,
    sig: L('Abdomen complet · Routine'),
    chipSig: L('Routine'),
    details: { modality: 'Échographie', region: 'Abdomen', views: 'Complète', priority: 'Routine', context: '', contrast: 'Sans' } },
  { key: 'rxgenou', name: L('Radiographie genou'), dose: '', freq: true,
    sig: L('3 incidences · Sans contraste · Routine'),
    chipSig: L('3 incidences · Routine'),
    details: { modality: 'Radiographie', region: 'Genou', views: 'AP + latérale + rotule', priority: 'Routine', context: '', contrast: 'Sans' } },
  { key: 'tdmcereb', name: L('TDM cérébrale'), dose: '', freq: true,
    sig: L('Sans contraste · Prioritaire'),
    chipSig: L('Sans contraste · Prioritaire'),
    details: { modality: 'TDM', region: 'Cerveau', views: '', priority: 'Prioritaire', context: L('Céphalées'), contrast: 'Sans' } },
  { key: 'mammo', name: L('Mammographie'), dose: '', freq: true,
    sig: L('Bilatérale · Dépistage · Routine'),
    chipSig: L('Bilatérale · Routine'),
    details: { modality: 'Mammographie', region: 'Seins', views: 'Bilatérale', priority: 'Routine', context: L('Dépistage'), contrast: 'Sans' } },
  { key: 'irmlomb', name: L('IRM lombaire'), dose: '',
    sig: L('Rachis lombaire · Sans contraste · Routine'), chipSig: L('Sans contraste · Routine'),
    details: { modality: 'IRM', region: 'Rachis lombaire', views: '', priority: 'Routine', context: L('Lombalgie persistante'), contrast: 'Sans' } },
  { key: 'echopelv', name: L('Échographie pelvienne'), dose: '',
    sig: L('Pelvis · Routine'), chipSig: L('Routine'),
    details: { modality: 'Échographie', region: 'Pelvis', views: 'Sus-pubienne + endovaginale', priority: 'Routine', context: '', contrast: 'Sans' } },
  { key: 'tdmthorax', name: L('TDM thoracique'), dose: '',
    sig: L('Thorax · Avec contraste · Routine'), chipSig: L('Avec contraste · Routine'),
    details: { modality: 'TDM', region: 'Thorax', views: '', priority: 'Routine', context: '', contrast: 'Avec' } },
  { key: 'rxcolonne', name: L('Radiographie colonne'), dose: '',
    sig: L('Rachis · Sans contraste · Routine'), chipSig: L('Routine'),
    details: { modality: 'Radiographie', region: 'Colonne dorsolombaire', views: 'AP + latérale', priority: 'Routine', context: '', contrast: 'Sans' } },
];

// =========================================================
// Référence spécialiste — commande « /ref »
// Spécialités et raisons de consultation des formulaires CRDS (crds-data.js,
// généré par tools/crds-csv-to-js.py depuis l'inventaire du CRDS — demande de
// Xavier Boilard, 2026-10-28) : Spécialité > Section > Sous-section > Raison,
// la cote de priorité (A à E) et les pièces jointes requises. Les libellés des
// raisons sont ceux des formulaires officiels, en français seulement.
// =========================================================
const CRDS_SPECS = (window.CRDS_DATA && window.CRDS_DATA.specialties) || [];
const REF_FAVS = new Set(['cardio', 'ortho', 'derm']);
const REF_FREQ = ['ortho', 'derm', 'gastro', 'neuro'];
const REF_ITEMS = CRDS_SPECS.map(function (s) {
  return { key: s.key, name: L(s.name), dose: '', freq: REF_FREQ.indexOf(s.key) >= 0,
    sig: tn('data.refReasons.text', s.reasons.length), chipSig: L('Routine'),
    details: { specialty: s.name, question: '', indication: '', priority: 'Routine' } };
});
// Une raison de consultation : un item du menu /ref, sous sa spécialité.
// `path` : ses sections (« Otologie », « Surdité »), `cote` : sa priorité.
const CRDS_REASONS = [];
CRDS_SPECS.forEach(function (s) {
  s.reasons.forEach(function (r) {
    CRDS_REASONS.push({ key: 'crds:' + r.id, crds: r.id, name: r.label, dose: '', spec: s.key, specName: s.name,
      path: r.path, cote: r.cote || null, docs: r.docs || [], sig: r.path.join(' › ') });
  });
});
function crdsReason(id) { return CRDS_REASONS.find(function (r) { return r.crds === id; }) || null; }
function crdsReasonsOf(specialty) {
  const s = CRDS_SPECS.find(function (x) { return x.name === specialty; });
  return s ? CRDS_REASONS.filter(function (r) { return r.spec === s.key; }) : [];
}
// Détails d'une puce de référence pour une raison CRDS : la spécialité, la
// raison et sa cote comme priorité (Routine si le formulaire n'en donne pas).
function crdsRefDetails(r, base) {
  return Object.assign({ question: '', indication: '' }, base || {}, { specialty: r.specName, crdsKey: r.crds,
    reason: r.name, reasonPath: r.path.slice(), priority: r.cote || 'Routine', prereqs: crdsPrereqInit(r.crds) });
}
// Section d'une raison, ou sa spécialité quand le CRDS ne la range pas (D2) :
// « Céphalée », « Cardiologie ».
function crdsSection(r) { return (r && r.path && r.path[0]) || (r && r.specName) || ''; }

// Formulaires qui vont à l'âge de la patiente : moins de 18 ans, la Pédiatrie
// générale et les formulaires « adulte et enfant » ; sinon, tout sauf la
// Pédiatrie générale (D3).
function crdsFitsPatient(r) {
  const s = CRDS_SPECS.find(function (x) { return x.key === r.spec; });
  const form = _norm((s && s.form) || '');
  if (PATIENT.ageYears < 18) return r.spec === 'pedia' || (/enfant|pediatrique/.test(form) && /adulte/.test(form));
  return r.spec !== 'pedia';
}
// Raisons suggérées pour le diagnostic de la région où /ref est tapé (D1) : la
// liste `ref` de son contexte (DX_CONTEXTS), selon l'âge de la patiente.
let _refDx = null;
function refSuggestionsFor(dx) {
  const c = dx ? dxContextFor(dx) : null;
  return ((c && c.ref) || []).map(crdsReason).filter(Boolean).filter(crdsFitsPatient);
}

// Prérequis d'une raison CRDS, à remplir dans le formulaire de la référence.
// Migraine en Neurologie adulte (Figma, D5) : les « Médicaments essayés » en
// pastilles par groupe, avec un minimum par groupe (1 triptan, 2 traitements
// prophylactiques) ; cochés d'office d'après le profil médicamenteux (actifs ou
// cessés : essayés). Liste d'exemple, à valider cliniquement. Les autres
// raisons : leurs pièces jointes CRDS, rendues par type (D5b) — jointes
// d'office (DSQ, dossier), texte à inscrire, action à faire, pièce à joindre.
const CRDS_PREREQ_CHOICES = {
  'neuro-24': { title: L('Médicaments essayés'), groups: [
    { key: 'triptan', label: L('Triptan'), min: 1, options: [
      { key: 'almotriptan', label: L('almotriptan'), match: /almotriptan/ },
      { key: 'eletriptan', label: L('élétriptan'), match: /eletriptan/ },
      { key: 'frovatriptan', label: L('frovatriptan'), match: /frovatriptan/ },
      { key: 'naratriptan', label: L('naratriptan'), match: /naratriptan/ },
      { key: 'rizatriptan', label: L('rizatriptan'), match: /rizatriptan/ },
      { key: 'sumatriptan', label: L('sumatriptan'), match: /sumatriptan/ },
      { key: 'zolmitriptan', label: L('zolmitriptan'), match: /zolmitriptan/ }] },
    { key: 'prophylaxie', label: L('Prophylaxie'), min: 2, options: [
      { key: 'tricycliques', label: L('tricycliques'), match: /amitriptyl|nortriptyl/ },
      { key: 'beta-bloqueurs', label: L('bêta-bloqueurs'), match: /propranolol|metoprolol|nadolol/ },
      { key: 'candesartan', label: L('candesartan'), match: /candesartan/ },
      { key: 'topiramate', label: L('topiramate'), match: /topiramat/ },
      { key: 'cgrp', label: L('anticorps CGRP'), match: /erenumab|galcanezumab|fremanezumab|eptinezumab/ }] }] },
};
// Pièces que le DSQ ou le dossier fournit : jointes d'office (colonne « Automatisable » du CRDS).
const CRDS_AUTO_SOURCE = { DSQ: 'dsq', Facile: 'dossier' };
// [{ key, kind: 'choices'|'auto'|'text'|'check'|'attach', label, … }]
function crdsPrereqs(id) {
  const r = crdsReason(id);
  if (!r) return [];
  const choice = CRDS_PREREQ_CHOICES[id];
  const out = [];
  const profil = r.docs.find(function (doc) { return doc.type === 'profil'; });
  if (choice) choice.groups.forEach(function (g) {
    out.push({ key: g.key, kind: 'choices', title: choice.title, hint: profil ? profil.name : '', label: g.label, min: g.min, options: g.options });
  });
  r.docs.forEach(function (doc, i) {
    if (choice && doc === profil) return; // remplacé par les pastilles
    const f = { key: 'doc' + i, label: doc.name, note: doc.note || '' };
    const source = CRDS_AUTO_SOURCE[doc.auto];
    if (source) out.push(Object.assign(f, { kind: 'auto', source: source }));
    else if (doc.type === 'saisie') out.push(Object.assign(f, { kind: 'text', required: true }));
    else if (doc.type === 'action') out.push(Object.assign(f, { kind: 'check', required: true }));
    else out.push(Object.assign(f, { kind: 'attach', required: true }));
  });
  return out;
}
// Valeurs de départ : les pastilles du profil médicamenteux cochées, le reste vide.
function crdsPrereqInit(id) {
  const vals = {};
  crdsPrereqs(id).forEach(function (f) {
    if (f.kind === 'choices') {
      vals[f.key] = f.options.filter(function (o) {
        return PATIENT_MEDS.some(function (m) { return o.match.test(_hay((m.details && m.details.molecule) || m.name)); });
      }).map(function (o) { return o.key; });
    } else if (f.kind === 'text') vals[f.key] = '';
    else if (f.kind === 'check' || f.kind === 'attach') vals[f.key] = false;
  });
  return vals;
}
// Les prérequis qui manquent encore (puce « à faire », lot 3).
function crdsPrereqMissing(id, vals) {
  const v = vals || {};
  return crdsPrereqs(id).filter(function (f) {
    if (f.kind === 'choices') return (v[f.key] || []).length < f.min;
    if (f.kind === 'text') return !String(v[f.key] || '').trim();
    if (f.kind === 'check' || f.kind === 'attach') return !v[f.key];
    return false;
  });
}
// Item à insérer pour une raison choisie dans le menu : la puce porte le nom
// de la spécialité, la raison et la priorité vont dans sa 2e ligne.
function crdsRefItem(r) {
  const details = crdsRefDetails(r);
  return { key: r.key, name: L(r.specName), dose: '', chipSig: deriveRefRx(details).sig, details: details };
}

// Menu /ref : un panneau de droite comme celui de /lab — Tout, Favoris, puis
// une vue par spécialité, qui liste ses raisons sous leurs sections. Une vue
// revient à « Tout » à chaque nouvelle recherche (endOrderSearch).
let _refView = 'tout';
function refViewKeys() { return ['tout', 'favoris'].concat(CRDS_SPECS.map(function (s) { return s.key; })); }
function setRefView(v) { _refView = refViewKeys().indexOf(v) >= 0 ? v : 'tout'; }
function getRefView() { return _refView; }
const REF_PER_SPEC = 6; // raisons trouvées montrées par spécialité dans « Tout »
// Toutes les vues pour la recherche `q` : { vue: [sections] }. Une spécialité
// se trouve par son nom ; une raison par son libellé et ses sections.
function refViews(q, favSet) {
  const words = _norm((q || '').trim()).split(/\s+/).filter(Boolean);
  const match = function (hay) { return words.every(function (w) { return hay.includes(w); }); };
  const specs = REF_ITEMS.filter(function (it) { return match(_hay(it.name) + ' ' + _norm(it.details.specialty)); });
  const reasons = CRDS_REASONS.filter(function (r) { return match(_hay(r.name) + ' ' + r.path.map(_hay).join(' ')); });
  const sec = function (key, title, items) { return { key: key, title: title, items: items }; };
  const v = {};
  if (words.length) {
    v.tout = [sec('specs', t('data.sectionRefSpecialties.title'), specs)].concat(REF_ITEMS.map(function (it) {
      return sec('r:' + it.key, it.name, reasons.filter(function (r) { return r.spec === it.key; }).slice(0, REF_PER_SPEC));
    }));
  } else {
    const sugg = refSuggestionsFor(_refDx).map(function (r) { return Object.assign({}, r, { sig: [r.specName].concat(r.path).join(' › ') }); });
    v.tout = [
      sec('suggeres', _refDx ? t('data.sectionRefSuggested.title', { dx: _refDx.name }) : '', sugg),
      sec('favoris', t('data.sectionFavorites.title'), REF_ITEMS.filter(function (it) { return favSet.has(it.key); })),
      sec('freq', t('data.sectionRefFrequent.title'), REF_ITEMS.filter(function (it) { return it.freq && !favSet.has(it.key); })),
      sec('autres', t('data.sectionRefOther.title'), REF_ITEMS.filter(function (it) { return !it.freq && !favSet.has(it.key); }))
    ];
  }
  v.favoris = [sec('favoris', t('data.sectionFavorites.title'), specs.filter(function (it) { return favSet.has(it.key); }))];
  // Vue d'une spécialité : la spécialité seule (sans raison précise), puis ses
  // raisons sous leur 1re section ; la 2e ligne d'une raison dit le reste.
  REF_ITEMS.forEach(function (it) {
    const own = [];
    if (!words.length || specs.indexOf(it) >= 0) own.push(sec(it.key + ':spec', t('data.sectionRefNoReason.title'), [it]));
    reasons.filter(function (r) { return r.spec === it.key; }).forEach(function (r) {
      const title = r.path[0] || t('data.sectionRefOtherReasons.title');
      let last = own[own.length - 1];
      if (!last || last.title !== title || last.key.indexOf(':spec') >= 0) { last = sec(it.key + ':' + own.length, title, []); own.push(last); }
      last.items.push(Object.assign({}, r, { sig: r.path.slice(1).join(' › ') }));
    });
    v[it.key] = own;
  });
  Object.keys(v).forEach(function (k) { v[k] = v[k].filter(function (s) { return s.items.length; }); });
  return v;
}
function searchRef(q, favSet) {
  const v = refViews(q, favSet);
  return { labSections: v[_refView] || [], favoris: [], frequents: [], autres: [] };
}
// Le panneau de droite : chaque vue avec son nombre de résultats — pour une
// spécialité, ses raisons (toutes, pas seulement celles montrées dans « Tout »).
function refRail(q, favSet) {
  const v = refViews(q, favSet || _favFreeze.ref || REF_FAVS);
  const count = function (k) { return (v[k] || []).reduce(function (n, s) { return n + s.items.filter(function (it) { return it.crds; }).length; }, 0); };
  const all = (v.tout || []).reduce(function (n, s) { return n + s.items.length; }, 0);
  return [
    { key: 'tout', label: t('data.labViewAll.label'), icon: 'folder_copy', count: all },
    { key: 'favoris', label: t('data.sectionFavorites.title'), icon: 'favorite_border', count: (v.favoris[0] || { items: [] }).items.length }
  ].concat(REF_ITEMS.map(function (it) { return { key: it.key, label: it.name, icon: 'folder', group: true, count: count(it.key) }; }));
}

// Panneaux de droite des menus /lab et /ref, pour l'éditeur (editor-field.jsx).
function orderViewKeys(kind) { return kind === 'lab' ? labViewKeys() : kind === 'ref' ? refViewKeys() : null; }
function getOrderView(kind) { return kind === 'lab' ? getLabView() : kind === 'ref' ? getRefView() : null; }
function setOrderView(kind, v) { if (kind === 'lab') setLabView(v); else if (kind === 'ref') setRefView(v); }
function orderRail(kind, q) { return kind === 'lab' ? labRail(q) : kind === 'ref' ? refRail(q) : null; }

// =========================================================
// Examen diagnostique — commande « /exam » ; services — commande « /serv »
// (rencontre du 2026-10-27, C2 : les branches de la requête, avec labo,
// imagerie et référence). La spirométrie reste dans /lab. Contenu
// d'exemple, à valider cliniquement.
// =========================================================
const EXAM_FAVS = new Set(['ecg', 'holter']);
const EXAM_ITEMS = [
  { key: 'ecg', name: L('ECG au repos'), dose: '', freq: true, sig: L('12 dérivations · Routine'), chipSig: L('Routine'),
    details: { exam: L('ECG au repos'), question: '', priority: 'Routine', comment: '' } },
  { key: 'holter', name: L('Holter 24 h'), dose: '', freq: true, sig: L('Enregistrement de 24 h · Routine'), chipSig: L('Routine'),
    details: { exam: L('Holter 24 h'), question: '', priority: 'Routine', comment: '' } },
  { key: 'mapa', name: L('MAPA 24 h'), dose: '', freq: true, sig: L('Monitorage ambulatoire de la pression artérielle · Routine'), chipSig: L('Routine'),
    details: { exam: L('MAPA 24 h'), question: '', priority: 'Routine', comment: '' } },
  { key: 'effort', name: L('Épreuve d’effort'), dose: '', sig: L('Sur tapis roulant · Routine'), chipSig: L('Routine'),
    details: { exam: L('Épreuve d’effort'), question: '', priority: 'Routine', comment: '' } },
  { key: 'oxymetrie', name: L('Oxymétrie nocturne'), dose: '', sig: L('À domicile · Routine'), chipSig: L('Routine'),
    details: { exam: L('Oxymétrie nocturne'), question: '', priority: 'Routine', comment: '' } },
  { key: 'polysomno', name: L('Polysomnographie'), dose: '', sig: L('En laboratoire du sommeil · Routine'), chipSig: L('Routine'),
    details: { exam: L('Polysomnographie'), question: '', priority: 'Routine', comment: '' } },
];
const SERV_FAVS = new Set(['pansement', 'injection']);
const SERV_ITEMS = [
  { key: 'pansement', name: L('Soins de plaie et pansement'), dose: '', freq: true, sig: L('Infirmière · Routine'), chipSig: L('Routine'),
    details: { service: L('Soins de plaie et pansement'), frequency: '', priority: 'Routine', instructions: '' } },
  { key: 'injection', name: L('Injection par l’infirmière'), dose: '', freq: true, sig: L('Vaccin, vitamine B12… · Routine'), chipSig: L('Routine'),
    details: { service: L('Injection par l’infirmière'), frequency: '', priority: 'Routine', instructions: '' } },
  { key: 'points', name: L('Retrait de points de suture'), dose: '', freq: true, sig: L('Dans 7 à 10 jours · Routine'), chipSig: L('Routine'),
    details: { service: L('Retrait de points de suture'), frequency: '', priority: 'Routine', instructions: '' } },
  { key: 'suivipa', name: L('Suivi de la pression artérielle'), dose: '', sig: L('Prises par l’infirmière · Routine'), chipSig: L('Routine'),
    details: { service: L('Suivi de la pression artérielle'), frequency: '', priority: 'Routine', instructions: '' } },
  { key: 'enseignement', name: L('Enseignement au patient'), dose: '', sig: L('Inhalateur, glucomètre… · Routine'), chipSig: L('Routine'),
    details: { service: L('Enseignement au patient'), frequency: '', priority: 'Routine', instructions: '' } },
  { key: 'prelevement', name: L('Prélèvements à domicile'), dose: '', sig: L('CLSC · Routine'), chipSig: L('Routine'),
    details: { service: L('Prélèvements à domicile'), frequency: '', priority: 'Routine', instructions: '' } },
];

// =========================================================
// Instructions au patient — commande « /instr » : des consignes courantes,
// une puce « Consignes » chacune (titre et texte, modifiables). Un terme qui
// ne correspond à aucune se garde en texte libre (instrFreeItem). Contenu
// SIMULÉ, à valider cliniquement.
// =========================================================
const INSTR_DELIVERY = 'Imprimer + portail';
const INSTR_FAVS = new Set(['hydratation', 'retour']);
const INSTR_ITEMS = [
  { key: 'hydratation', title: L('Hydratation'), body: L('Boire 1,5 à 2 litres d’eau par jour.'), freq: true },
  { key: 'repos', title: L('Repos'), body: L('Se reposer et reprendre les activités selon la tolérance.'), freq: true },
  { key: 'retour', title: L('Consulter si aggravation'), body: L('Revenir consulter si fièvre de plus de 38,5 °C, si les symptômes s’aggravent ou durent plus de 7 jours.'), freq: true },
  { key: 'antibio', title: L('Antibiotique jusqu’au bout'), body: L('Prendre l’antibiotique jusqu’à la fin, même si les symptômes disparaissent avant.'), freq: true },
  { key: 'analgesie', title: L('Analgésie au besoin'), body: L('Acétaminophène ou ibuprofène au besoin, selon la posologie remise.') },
  { key: 'glace', title: L('Glace et élévation'), body: L('Glace 15 minutes, 3 à 4 fois par jour, et membre surélevé.') },
  { key: 'nasal', title: L('Lavage nasal salin'), body: L('Rinçage nasal à l’eau salée 2 à 3 fois par jour.') },
  { key: 'alerte-itu', title: L('Signes d’alerte — infection urinaire'), body: L('Consulter rapidement si fièvre, frissons, douleur au dos ou vomissements.') },
  { key: 'alimentation', title: L('Alimentation légère'), body: L('Repas légers et fractionnés tant que les symptômes digestifs durent.') },
  { key: 'tabac', title: L('Arrêt tabagique'), body: L('Ressources d’aide à l’arrêt : J’ARRÊTE, 1 866 527-7383.') },
].map(function (it) {
  return Object.assign({ name: it.title, dose: '', sig: it.body, details: { title: it.title, body: it.body, delivery: INSTR_DELIVERY } }, it);
});
// Un terme sans consigne au catalogue : une consigne à ce titre, texte à écrire.
function instrFreeItem(term) {
  const title = (term || '').trim();
  return { key: 'free:' + _norm(title), name: title, dose: '', free: true, sig: t('data.freeText.text'),
    details: { title: title, body: '', delivery: INSTR_DELIVERY } };
}

// =========================================================
// Antécédents — commande « /ant » (rencontre du 2026-10-27, C5) : les
// antécédents les plus fréquents, à cocher. Chacun devient un diagnostic
// documenté comme antécédent (même approche que le « + » Antécédents du
// Sommaire, buildAntecedentRegions). Codes CIM-10 ; contenu à valider.
// =========================================================
const ANT_FAVS = new Set();
const ANT_ITEMS = [
  { key: 'hta', name: L('Hypertension artérielle'), short: 'HTA', code: 'I10', freq: true },
  { key: 'db2', name: L('Diabète de type 2'), short: 'DB2', code: 'E11.9', freq: true },
  { key: 'dlp', name: L('Dyslipidémie'), code: 'E78.5', freq: true },
  { key: 'asthme', name: L('Asthme'), code: 'J45.9', freq: true },
  { key: 'mpoc', name: L('MPOC'), code: 'J44.9', freq: true },
  { key: 'hypothyr', name: L('Hypothyroïdie'), code: 'E03.9', freq: true },
  { key: 'depression', name: L('Dépression'), code: 'F32.9', freq: true },
  { key: 'anxiete', name: L('Trouble anxieux'), code: 'F41.9', freq: true },
  { key: 'rgo', name: L('Reflux gastro-œsophagien'), short: 'RGO', code: 'K21.9' },
  { key: 'arthrose', name: L('Arthrose'), code: 'M19.9' },
  { key: 'fa', name: L('Fibrillation auriculaire'), short: 'FA', code: 'I48.9' },
  { key: 'mci', name: L('Cardiopathie ischémique'), short: 'MCAS', code: 'I25.9' },
].map(function (it) { return Object.assign({ dose: '', sig: it.code }, it); });
// Un terme sans antécédent au catalogue : un antécédent à ce nom, sans code.
function antFreeItem(term) {
  const name = (term || '').trim();
  return { key: 'free:' + _norm(name), name: name, code: null, dose: '', free: true, sig: t('data.freeText.text') };
}
// /instr et /ant : une recherche sans résultat exact propose aussi le terme
// tel quel, en texte libre, à la fin de la liste.
function withFreeItem(r, q, make) {
  const term = (q || '').trim();
  if (!term) return r;
  const all = [].concat(r.favoris, r.frequents, r.autres);
  const exact = all.some(function (it) { return _norm(it.name) === _norm(term); });
  return exact ? r : Object.assign({}, r, { autres: r.autres.concat([make(term)]) });
}

// Unified order registry (rx / lab / img / ref / exam / serv / ant) — shared search + favorites
const ORDER_DEFS = {
  rx:  { kbd: 'rx',  type: 'prescription', icon: 'pill',      glyph: '℞', verb: t('data.rxVerb.text'), emptyNoun: t('data.rxNoun.text'),
         sections: [t('data.sectionFavorites.title'), t('data.sectionRxFrequent.title'), t('data.sectionRxPhrases.title')],
         favs: RX_FAVS,  items: function () { return RX_ALL; }, search: searchRx },
  // Labo en sélection multiple, avec son panneau de droite (searchLab, labRail) ;
  // les bilans sont des items comme les analyses (`profile`).
  // Imagerie en sélection unique : on commande un examen précis à la fois
  // (rencontre du 2026-10-27 : Xavier Boilard, A2). Plus de recherche unifiée
  // /req : on va directement aux branches (C1).
  lab: { kbd: 'lab', type: 'lab',          icon: 'science',   glyph: null, verb: t('data.orderVerb.text'),  emptyNoun: t('data.labNoun.text'), multi: true,
         sections: [t('data.sectionFavorites.title'), t('data.sectionLabFrequent.title'), t('data.sectionLabOther.title')],
         favs: LAB_FAVS, items: function () { return LAB_ITEMS.concat(LAB_BILANS); }, search: function (q, favs) { return searchLab(q, favs || LAB_FAVS); } },
  img: { kbd: 'img', type: 'imaging',      icon: 'radiology',  glyph: null, verb: t('data.orderVerb.text'),  emptyNoun: t('data.imagingNoun.text'),
         sections: [t('data.sectionFavorites.title'), t('data.sectionImgFrequent.title'), t('data.sectionImgOther.title')],
         favs: IMG_FAVS, items: function () { return IMG_ITEMS; }, search: function (q, favs) { return _searchList(IMG_ITEMS, favs || IMG_FAVS, q); } },
  ref: { kbd: 'ref', type: 'referral',     icon: 'person_add', glyph: null, verb: t('data.refVerb.text'),   emptyNoun: t('data.specialtyNoun.text'),
         sections: [t('data.sectionFavorites.title'), t('data.sectionRefFrequent.title'), t('data.sectionRefOther.title')],
         favs: REF_FAVS, items: function () { return REF_ITEMS; }, search: function (q, favs) { return searchRef(q, favs || REF_FAVS); } },
  exam: { kbd: 'exam', type: 'exam',       icon: 'monitor_heart', glyph: null, verb: t('data.orderVerb.text'), emptyNoun: t('data.examNoun.text'),
         sections: [t('data.sectionFavorites.title'), t('data.sectionExamFrequent.title'), t('data.sectionExamOther.title')],
         favs: EXAM_FAVS, items: function () { return EXAM_ITEMS; }, search: function (q, favs) { return _searchList(EXAM_ITEMS, favs || EXAM_FAVS, q); } },
  serv: { kbd: 'serv', type: 'service',    icon: 'medical_services', glyph: null, verb: t('data.orderVerb.text'), emptyNoun: t('data.serviceNoun.text'),
         sections: [t('data.sectionFavorites.title'), t('data.sectionServFrequent.title'), t('data.sectionServOther.title')],
         favs: SERV_FAVS, items: function () { return SERV_ITEMS; }, search: function (q, favs) { return _searchList(SERV_ITEMS, favs || SERV_FAVS, q); } },
  instr: { kbd: 'instr', type: 'instructions', icon: 'menu_book', glyph: null, verb: t('data.instrVerb.text'), emptyNoun: t('data.instrNoun.text'),
         sections: [t('data.sectionFavorites.title'), t('data.sectionInstrFrequent.title'), t('data.sectionInstrOther.title')],
         favs: INSTR_FAVS, items: function () { return INSTR_ITEMS; }, search: function (q, favs) { return withFreeItem(_searchList(INSTR_ITEMS, favs || INSTR_FAVS, q), q, instrFreeItem); } },
  // Pas une puce : des diagnostics documentés comme antécédents (runOrderCommand).
  ant:  { kbd: 'ant', type: 'antecedent',  icon: 'history', glyph: null, verb: t('data.antVerb.text'), emptyNoun: t('data.antNoun.text'), multi: true,
         sections: [t('data.sectionFavorites.title'), t('data.sectionAntFrequent.title'), t('data.sectionAntOther.title')],
         favs: ANT_FAVS, items: function () { return ANT_ITEMS; }, search: function (q, favs) { return withFreeItem(_searchList(ANT_ITEMS, favs || ANT_FAVS, q), q, antFreeItem); } },
};

// Table d'intention thérapeutique (rencontre vision 2026-10-27) : ce qu'une
// recherche ouverte SOUS un diagnostic montre avant toute frappe — « comme une
// recherche par défaut » sur le diagnostic. Simule la table d'intention que
// le produit exposerait dans l'index. Items du catalogue seulement ; contenu
// SIMULÉ, à valider cliniquement. Clés : cat-35 Fluticasone/salmétérol,
// cat-37 Montélukast, cat-38 Cétirizine, cat-39 Prednisone, cat-40
// Acétaminophène, cat-41 Ibuprofène, cat-44 Nitrofurantoïne, cat-45
// TMP-SMX, cat-46 Fosfomycine, cat-48 Amoxicilline-clavulanate.
// `cim10` : préfixes de code ; `snomed` : codes exacts ; `words` : mots du
// libellé (les deux langues), pour un diagnostic saisi en texte libre.
// `label` : le nom du diagnostic à suggérer quand aucun gabarit de note n'en
// donne un (dxSuggestionFor). Ses gabarits de conclusion sont des textes
// rapides (QUICK_TEXTS, plus bas).
const DX_CONTEXTS = [
  { key: 'itu', cim10: ['N30', 'N39.0'], snomed: ['68566005', '38822007'],
    words: ['infection urinaire', 'cystite', 'itu', 'urinary tract infection', 'cystitis', 'uti'],
    rx: ['cat-44', 'cat-46', 'cat-45'], lab: ['srum'], img: [], label: L('Infection urinaire non compliquée') },
  { key: 'pyelo', cim10: ['N10'], snomed: [],
    words: ['pyélonéphrite', 'pyelonephritis'],
    rx: ['cat-45', 'cat-47'], lab: ['curine', 'fsc', 'creat'], img: [], label: L('Pyélonéphrite aiguë') },
  { key: 'asthme', cim10: ['J45', 'J46'], snomed: ['195967001'],
    words: ['asthme', 'asthma'],
    rx: ['vento100', 'cat-35', 'cat-37', 'cat-39'], lab: ['efr'], img: ['rxpoumon'], label: L('Asthme léger') },
  { key: 'mpoc', cim10: ['J44'], snomed: [],
    words: ['mpoc', 'bpco', 'copd'],
    rx: ['prednisone50', 'cat-48', 'cat-51', 'cat-36', 'cat-34'], lab: ['fsc'], img: ['rxpoumon'], label: L('Exacerbation de MPOC') },
  // cat-50 Amoxicilline 1 g, cat-51 Doxycycline, cat-52 Azithromycine.
  { key: 'pneumonie', cim10: ['J12', 'J13', 'J14', 'J15', 'J16', 'J17', 'J18'], snomed: ['233604007'],
    words: ['pneumonie', 'pneumonia'],
    rx: ['cat-50', 'cat-51', 'cat-48', 'cat-52', 'cat-40'], lab: ['fsc', 'crp'], img: ['rxpoumon'], label: L('Pneumonie (suspicion)') },
  { key: 'otite', cim10: ['H65', 'H66'], snomed: ['65363002'],
    words: ['otite', 'otitis'],
    rx: ['amox500', 'cat-48', 'cat-40', 'cat-41'], lab: [], img: [], label: L('Otite moyenne aiguë') },
  { key: 'pharyngite', cim10: ['J02', 'J03'], snomed: [],
    words: ['pharyngite', 'amygdalite', 'angine', 'pharyngitis', 'tonsillitis', 'strep'],
    rx: ['penv600', 'amox500', 'cat-52', 'cat-40', 'cat-41'], lab: [], img: [], label: L('Pharyngite aiguë') },
  { key: 'sinusite', cim10: ['J01'], snomed: [],
    words: ['sinusite', 'sinusitis'],
    rx: ['fluticasone-nasal', 'cat-50', 'cat-51', 'cat-40'], lab: [], img: [], label: L('Sinusite aiguë') },
  { key: 'influenza', cim10: ['J09', 'J10', 'J11'], snomed: [],
    words: ['influenza', 'grippe', 'flu'],
    rx: ['oseltamivir75', 'cat-40', 'cat-41'], lab: [], img: [], label: L('Influenza') },
  { key: 'ivrs', cim10: ['J00', 'J04', 'J05', 'J06'], snomed: [],
    words: ['ivrs', 'syndrome viral', 'rhume', 'common cold', 'viral syndrome', 'uri'],
    rx: ['cat-40', 'cat-41', 'cat-38'], lab: [], img: [], label: L('Syndrome viral / IVRS') },
  { key: 'cellulite', cim10: ['L03'], snomed: [],
    words: ['cellulite', 'cellulitis'],
    rx: ['cat-49', 'cat-40'], lab: [], img: [], label: L('Cellulite') },
  { key: 'zona', cim10: ['B02'], snomed: [],
    words: ['zona', 'zoster', 'shingles'],
    rx: ['valacyclovir1g', 'cat-40', 'cat-33'], lab: [], img: [], label: L('Zona') },
  { key: 'hta', cim10: ['I10', 'I11', 'I12', 'I13', 'I15'], snomed: [],
    words: ['hypertension', 'hta'],
    rx: ['cat-3', 'cat-2', 'cat-6', 'cat-5'], lab: ['creat', 'ions', 'srum'], img: [], label: L('Hypertension artérielle') },
  { key: 'db2', cim10: ['E11'], snomed: [],
    words: ['diabète de type 2', 'diabete de type 2', 'diabète type 2', 'type 2 diabetes', 'db2'],
    rx: ['cat-15', 'cat-17', 'cat-16'], lab: ['hba1c', 'microalb', 'creat'], img: [], label: L('Diabète de type 2') },
  // Migraine (PLAN-reference-specialite.md, lot 2) : `ref`, les raisons CRDS
  // suggérées dans /ref, gardées selon l'âge (crdsFitsPatient) — Neurologie
  // adulte, ou Pédiatrie générale › Céphalée.
  { key: 'migraine', cim10: ['G43', 'G44'], snomed: ['37796009'],
    words: ['migraine', 'céphalée', 'cephalee', 'céphalées', 'headache'],
    rx: [], lab: [], img: [], ref: ['neuro-24', 'neuro-25', 'neuro-26', 'neuro-27', 'pedia-12', 'pedia-11', 'pedia-13'],
    label: L('Migraine') },
];

// Textes rapides (PLAN-textes-rapides.md, PLAN-gabarits-conclusion.md). Un
// gabarit de conclusion est un texte rapide lié à des diagnostics (`dx`, clés
// de DX_CONTEXTS), appliqué EN ATTENTE sous le diagnostic
// (buildConclusionBlocks, editor-schema.jsx). `kind` : 'omnimed' (fourni) ou
// 'mine' (celui que le médecin s'est fait, simulé). `content` : des lignes où
// `{clé}` place, à même le texte, la tuile `tiles[clé]` ({ kind, key,
// details? }, comme `proposals` dans NOTE_TEMPLATES) ; `proposals` : des
// ajouts sans place dans le texte, sur une ligne à la fin. Une variante d'un
// diagnostic (comorbidités, allergie) est un texte à part. Le délai de suivi
// est sur sa propre ligne (une tuile « rendez-vous » viendra plus tard).
// Contenu SIMULÉ, à valider cliniquement.
const QUICK_TEXTS = [
  { key: 'itu', kind: 'omnimed', dx: ['itu'], name: L('Infection urinaire non compliquée'),
    content: L('Impression : cystite non compliquée.\nAntibiotique : {abx}\nAnalyse d’urine : {au}\nHydratation.\nConsulter si fièvre ou douleur lombaire.'),
    tiles: { abx: { kind: 'rx', key: 'cat-44', details: { duration: '5', durationUnit: 'jours', quantity: '10', refills: '0' } },
      au: { kind: 'lab', key: 'srum' } } },
  { key: 'itu-mine', kind: 'mine', dx: ['itu'], name: L('Cystite — dose unique'),
    content: L('Antibiotique en dose unique : {abx}\nCulture d’urine : {cu}\nRevoir si les symptômes persistent après 72 h.'),
    tiles: { abx: { kind: 'rx', key: 'cat-46' },
      cu: { kind: 'lab', key: 'curine' } } },
  { key: 'pyelo', kind: 'omnimed', dx: ['pyelo'], name: L('Pyélonéphrite simple'),
    content: L('Impression : pyélonéphrite aiguë simple, prise en charge ambulatoire.\nCulture d’urine avant l’antibiotique : {cu}\nAntibiotique : {abx}\nBilan : {fsc} {creat}\nRevoir dans 48 h.\nConsulter si vomissements, fièvre persistante ou douleur qui augmente.'),
    tiles: { cu: { kind: 'lab', key: 'curine' },
      abx: { kind: 'rx', key: 'cat-45', details: { duration: '14', durationUnit: 'jours', quantity: '28', refills: '0' } },
      fsc: { kind: 'lab', key: 'fsc' },
      creat: { kind: 'lab', key: 'creat' } } },
  { key: 'asthme', kind: 'omnimed', dx: ['asthme'], name: L('Asthme léger'),
    content: L('Bronchodilatateur au besoin : {saba}\nTechnique d’inhalation revue.\nPlan d’action écrit remis.'),
    tiles: { saba: { kind: 'rx', key: 'vento100' } } },
  { key: 'asthme-mine', kind: 'mine', dx: ['asthme'], name: L('Asthme — palier 2'),
    content: L('Traitement de fond quotidien : {fond}\nBronchodilatateur au besoin : {saba}\nRéévaluation du contrôle dans 3 mois.'),
    tiles: { fond: { kind: 'rx', key: 'cat-35' },
      saba: { kind: 'rx', key: 'vento100' } } },
  { key: 'asthme-exac', kind: 'omnimed', dx: ['asthme'], name: L('Exacerbation d’asthme légère'),
    content: L('Impression : exacerbation d’asthme légère.\nCorticostéroïde oral : {cso}\nBronchodilatateur : {saba}\nTechnique d’inhalation et plan d’action revus.\nRevoir dans 48 à 72 h.\nConsulter si dyspnée au repos ou si le bronchodilatateur est requis aux 4 h ou plus souvent.'),
    tiles: { cso: { kind: 'rx', key: 'prednisone50' },
      saba: { kind: 'rx', key: 'vento100' } } },
  { key: 'mpoc-exac', kind: 'omnimed', dx: ['mpoc'], name: L('Exacerbation de MPOC'),
    content: L('Impression : exacerbation de MPOC.\nCorticostéroïde oral : {cso}\nSi expectorations purulentes : {abx}\nBronchodilatateur : {saba}\nRadiographie pulmonaire : {img}\nRevoir dans 48 à 72 h.\nConsulter si dyspnée au repos, confusion ou somnolence.'),
    tiles: { cso: { kind: 'rx', key: 'prednisone50' },
      abx: { kind: 'rx', key: 'cat-48', details: { duration: '5', durationUnit: 'jours', quantity: '10', refills: '0' } },
      saba: { kind: 'rx', key: 'vento100' },
      img: { kind: 'img', key: 'rxpoumon' } } },
  { key: 'mpoc-allergie', kind: 'omnimed', dx: ['mpoc'], name: L('Exacerbation de MPOC, allergie à la pénicilline'),
    content: L('Impression : exacerbation de MPOC, allergie à la pénicilline.\nCorticostéroïde oral : {cso}\nSi expectorations purulentes : {abx}\nBronchodilatateur : {saba}\nRadiographie pulmonaire : {img}\nRevoir dans 48 à 72 h.\nConsulter si dyspnée au repos, confusion ou somnolence.'),
    tiles: { cso: { kind: 'rx', key: 'prednisone50' },
      abx: { kind: 'rx', key: 'cat-51' },
      saba: { kind: 'rx', key: 'vento100' },
      img: { kind: 'img', key: 'rxpoumon' } } },
  { key: 'pac-ambu', kind: 'omnimed', dx: ['pneumonie'], name: L('PAC ambulatoire'),
    content: L('Impression : pneumonie acquise en communauté, CRB-65 à 0, prise en charge ambulatoire.\nAntibiotique : {abx}\nRadiographie pulmonaire si non faite : {img}\nFièvre ou douleur : {analg}\nRevoir dans 48 à 72 h.\nConsulter si dyspnée, confusion ou fièvre au-delà de 72 h.'),
    tiles: { abx: { kind: 'rx', key: 'cat-50' }, img: { kind: 'img', key: 'rxpoumon' }, analg: { kind: 'rx', key: 'cat-40' } } },
  { key: 'pac-comorb', kind: 'omnimed', dx: ['pneumonie'], name: L('PAC avec comorbidités'),
    content: L('Impression : pneumonie acquise en communauté avec comorbidités (MPOC, diabète, insuffisance cardiaque…).\nAntibiotiques : {abx} et {macro}\nBilan : {img} {fsc} {crp}\nRevoir dans 48 h.\nConsulter si dyspnée, confusion ou fièvre au-delà de 72 h.'),
    tiles: { abx: { kind: 'rx', key: 'cat-48', details: { duration: '5', durationUnit: 'jours', quantity: '10', refills: '0' } },
      macro: { kind: 'rx', key: 'cat-52' }, img: { kind: 'img', key: 'rxpoumon' }, fsc: { kind: 'lab', key: 'fsc' }, crp: { kind: 'lab', key: 'crp' } } },
  { key: 'pac-allergie', kind: 'omnimed', dx: ['pneumonie'], name: L('PAC, allergie à la pénicilline'),
    content: L('Impression : pneumonie acquise en communauté, allergie à la pénicilline.\nAntibiotique : {abx}\nRadiographie pulmonaire si non faite : {img}\nFièvre ou douleur : {analg}\nRevoir dans 48 à 72 h.\nConsulter si dyspnée, confusion ou fièvre au-delà de 72 h.'),
    tiles: { abx: { kind: 'rx', key: 'cat-51' }, img: { kind: 'img', key: 'rxpoumon' }, analg: { kind: 'rx', key: 'cat-40' } } },
  { key: 'otite', kind: 'omnimed', dx: ['otite'], name: L('Otite moyenne aiguë'),
    content: L('Impression : otite moyenne aiguë.\nAntibiotique : {abx}\nDurée : 10 jours avant 2 ans, 5 jours ensuite.\nDouleur : {analg}\nRevoir si pas d’amélioration en 48 h.'),
    tiles: { abx: { kind: 'rx', key: 'amox500' },
      analg: { kind: 'rx', key: 'cat-40' } } },
  { key: 'otite-allergie', kind: 'omnimed', dx: ['otite'], name: L('Otite, allergie à la pénicilline'),
    content: L('Impression : otite moyenne aiguë, allergie à la pénicilline.\nAntibiotique : {abx}\nDouleur : {analg}\nRevoir si pas d’amélioration en 48 h.'),
    tiles: { abx: { kind: 'rx', key: 'cat-52' },
      analg: { kind: 'rx', key: 'cat-40' } } },
  { key: 'pharyngite', kind: 'omnimed', dx: ['pharyngite'], name: L('Pharyngite à streptocoque'),
    content: L('Impression : pharyngite à streptocoque, test rapide positif.\nAntibiotique : {abx}\nDouleur ou fièvre : {analg}\nRetour à l’école ou au travail 24 h après le début de l’antibiotique.'),
    tiles: { abx: { kind: 'rx', key: 'penv600' },
      analg: { kind: 'rx', key: 'cat-40' } } },
  { key: 'pharyngite-allergie', kind: 'omnimed', dx: ['pharyngite'], name: L('Pharyngite, allergie à la pénicilline'),
    content: L('Impression : pharyngite à streptocoque, test rapide positif, allergie à la pénicilline.\nAntibiotique : {abx}\nDouleur ou fièvre : {analg}\nRetour à l’école ou au travail 24 h après le début de l’antibiotique.'),
    tiles: { abx: { kind: 'rx', key: 'cat-52' },
      analg: { kind: 'rx', key: 'cat-40' } } },
  { key: 'sinusite', kind: 'omnimed', dx: ['sinusite'], name: L('Sinusite bactérienne aiguë'),
    content: L('Impression : sinusite bactérienne aiguë.\nCorticostéroïde nasal : {nasal}\nLavage nasal salin.\nAntibiotique : {abx}\nRevoir si pas d’amélioration en 72 h.'),
    tiles: { nasal: { kind: 'rx', key: 'fluticasone-nasal' },
      abx: { kind: 'rx', key: 'cat-50' } } },
  { key: 'sinusite-allergie', kind: 'omnimed', dx: ['sinusite'], name: L('Sinusite, allergie à la pénicilline'),
    content: L('Impression : sinusite bactérienne aiguë, allergie à la pénicilline.\nCorticostéroïde nasal : {nasal}\nLavage nasal salin.\nAntibiotique : {abx}\nRevoir si pas d’amélioration en 72 h.'),
    tiles: { nasal: { kind: 'rx', key: 'fluticasone-nasal' },
      abx: { kind: 'rx', key: 'cat-51' } } },
  { key: 'influenza', kind: 'omnimed', dx: ['influenza'], name: L('Influenza'),
    content: L('Impression : influenza.\nRepos, hydratation. Fièvre ou douleur : {analg}\nSi risque de complications et moins de 48 h de symptômes : {antiviral}\nConsulter si dyspnée, douleur thoracique ou fièvre au-delà de 5 jours.'),
    tiles: { analg: { kind: 'rx', key: 'cat-40' },
      antiviral: { kind: 'rx', key: 'oseltamivir75' } } },
  { key: 'ivrs', kind: 'omnimed', dx: ['ivrs'], name: L('Syndrome viral / IVRS'),
    content: L('Impression : syndrome viral des voies respiratoires supérieures.\nTraitement symptomatique : {analg}, hydratation, repos.\nConsulter si dyspnée ou fièvre au-delà de 5 jours.'),
    tiles: { analg: { kind: 'rx', key: 'cat-40' } } },
  { key: 'cellulite', kind: 'omnimed', dx: ['cellulite'], name: L('Cellulite non compliquée'),
    content: L('Impression : cellulite non compliquée.\nAntibiotique : {abx}\nContour de la rougeur tracé au crayon. Membre surélevé.\nRevoir dans 48 h, plus tôt si la rougeur dépasse le contour ou si fièvre.'),
    tiles: { abx: { kind: 'rx', key: 'cat-49', details: { duration: '5', durationUnit: 'jours', quantity: '20', refills: '0' } } } },
  { key: 'zona', kind: 'omnimed', dx: ['zona'], name: L('Zona'),
    content: L('Impression : zona.\nAntiviral, si moins de 72 h après l’éruption : {antiviral}\nDouleur : {analg}\nVaccin contre le zona à discuter après la guérison.\nConsulter si l’éruption touche l’œil ou le front.'),
    tiles: { antiviral: { kind: 'rx', key: 'valacyclovir1g' },
      analg: { kind: 'rx', key: 'cat-40' } } },
  { key: 'hta-suivi', kind: 'omnimed', dx: ['hta'], name: L('HTA — suivi'),
    content: L('Impression : hypertension artérielle, suivi.\nBilan : {bilan}\nTraitement : {ieca}\nSuivi infirmier : {pa}\nCible : PA inférieure à 130/80.\nRevoir dans 3 mois avec les mesures à domicile.'),
    tiles: { bilan: { kind: 'profile', key: 'bilan-hta-suivi' },
      ieca: { kind: 'rx', key: 'cat-3' },
      pa: { kind: 'serv', key: 'suivipa' } } },
  { key: 'db2-suivi', kind: 'omnimed', dx: ['db2'], name: L('Diabète de type 2 — suivi'),
    content: L('Impression : diabète de type 2, suivi.\nBilan : {a1c} {microalb} {creat}\nTraitement : {metf}\nCible : HbA1c à 7 % ou moins.\nRevoir dans 3 mois avec les résultats.'),
    tiles: { a1c: { kind: 'lab', key: 'hba1c' },
      microalb: { kind: 'lab', key: 'microalb' },
      creat: { kind: 'lab', key: 'creat' },
      metf: { kind: 'rx', key: 'cat-15' } } },
  { key: 'migraine', kind: 'omnimed', dx: ['migraine'], name: L('Migraine'),
    content: L('Impression : migraine sans aura.\nCrise : {triptan}\nProphylaxie si 4 jours de migraine ou plus par mois.\nCalendrier des céphalées.\nRéférer en neurologie si échec d’un triptan et de 2 traitements prophylactiques.\nRevoir dans 3 mois.'),
    tiles: { triptan: { kind: 'rx', key: 'sumatriptan50' } } },
];

// Attributs d'un diagnostic (name, code) → son contexte, ou null. Le code
// l'emporte ; sinon un mot entier du libellé, dans l'une ou l'autre langue.
function dxContextFor(dx) {
  if (!dx) return null;
  const code = String(dx.code || '').toUpperCase();
  const byCode = code && DX_CONTEXTS.find(function (c) {
    return c.snomed.indexOf(code) >= 0 || c.cim10.some(function (p) { return code === p || code.indexOf(p + '.') === 0 || (p.indexOf('.') > 0 && code.indexOf(p) === 0); });
  });
  if (byCode) return byCode;
  const hay = ' ' + _hay(dx.name || '').replace(/[^a-z0-9]+/g, ' ') + ' ';
  return DX_CONTEXTS.find(function (c) {
    return c.words.some(function (w) { return hay.indexOf(' ' + _norm(w) + ' ') >= 0; });
  }) || null;
}

// Date d'une note antérieure sans l'heure, en minuscules dans la langue de
// l'interface : « 8 DÉCEMBRE 2025 09:15 » → « 8 décembre 2025 » ;
// « DECEMBER 8, 2025 9:15 AM » → « December 8, 2025 ».
function noteDayLabel(date) {
  const day = (date || '').replace(/\s+\d{1,2}:\d{2}(\s*[AP]M)?\s*$/i, '').toLowerCase();
  return window.I18N.lang === 'fr' ? day : day.replace(/^[a-z]/, function (c) { return c.toUpperCase(); });
}

// Gabarits de conclusion offerts sous un diagnostic, dans l'ordre de la
// rencontre vision (2026-10-27) : réutiliser la dernière conclusion, mon
// gabarit, le gabarit Omnimed — mes textes rapides et ceux d'Omnimed liés au
// diagnostic. Chaque option : { id, kind, name, content, tiles?, proposals,
// source, allergy, date?, author? } ; `source` signe ses ajouts en attente.
// « Dernière conclusion » : seulement si le problème est au dossier
// (`ctx.sommaire`, lignes de getSommaireDiagnostics) ET qu'une note
// antérieure (`ctx.notes`, la plus récente d'abord) le conclut — son texte et
// ses ajouts réutilisables (`reuse`).
function dxConclusionOptions(dx, ctx) {
  const c = dxContextFor(dx);
  if (!c) return [];
  const same = function (other) { const o = dxContextFor(other); return !!o && o.key === c.key; };
  const out = [];
  const inChart = ((ctx && ctx.sommaire) || []).some(same);
  const note = inChart && ((ctx && ctx.notes) || []).find(function (n) {
    return n.conclusion && (n.diagnostics || []).some(function (name) { return same({ name: name }); });
  });
  if (note) {
    const date = noteDayLabel(note.date);
    out.push({ id: 'last', kind: 'last', name: t('suggest.derniereConclusion.title'), date: date, author: note.author,
      content: note.conclusion, proposals: note.reuse || [], source: t('template.lastConclusion.label', { date: date }) });
  }
  ['mine', 'omnimed'].forEach(function (kind) {
    QUICK_TEXTS.forEach(function (q) { if (q.kind === kind && q.dx.indexOf(c.key) >= 0) out.push(quickTextOption(q)); });
  });
  out.forEach(function (o) { o.allergy = optionAllergy(o); });
  // Allergie au dossier (PLAN-gabarits-conclusion.md, Q7) : les options sans
  // conflit d'abord, l'ordre ci-dessus gardé sinon.
  return out.filter(function (o) { return !o.allergy; }).concat(out.filter(function (o) { return !!o.allergy; }));
}

// Texte rapide → option de conclusion. `proposals` : tous ses ajouts — les
// tuiles dans l'ordre où le texte les place, puis ceux sans place.
function quickTextOption(q) {
  const tiles = q.tiles || {};
  const keys = [];
  (q.content || '').replace(/\{([A-Za-z][\w-]*)\}/g, function (token, k) { if (tiles[k] && keys.indexOf(k) < 0) keys.push(k); return token; });
  Object.keys(tiles).forEach(function (k) { if (keys.indexOf(k) < 0) keys.push(k); });
  return Object.assign({}, q, { id: q.key, proposals: keys.map(function (k) { return tiles[k]; }).concat(q.proposals || []),
    source: t('template.source.label', { name: q.name }) });
}

// Conflit d'une option avec une allergie au dossier (rxAllergyOf) :
// { names, items } — les allergies et les produits en cause —, ou null.
function optionAllergy(opt) {
  const names = [], items = [];
  (opt.proposals || []).forEach(function (p) {
    if (p.kind !== 'rx') return;
    const it = RX_ALL.find(function (x) { return x.key === p.key; });
    const a = it && rxAllergyOf(it);
    if (!a) return;
    if (names.indexOf(a) < 0) names.push(a);
    if (items.indexOf(it.name) < 0) items.push(it.name);
  });
  return names.length ? { names: names, items: items } : null;
}

// Gabarit de note sans son outil clinique (réglage « Outils cliniques »
// désactivé — rencontre vision 2026-10-27 : « 80 % des outils cliniques, ce
// sont des requêtes ») : ses requêtes `toolRequests` sont proposées à la fin
// de sa dernière section, comme ses autres ajouts.
function templateWithoutTool(tpl) {
  if (!tpl || !tpl.tool) return tpl;
  const sections = (tpl.sections || []).map(function (s, i, all) {
    return i === all.length - 1 ? Object.assign({}, s, { proposals: (s.proposals || []).concat(tpl.toolRequests || []) }) : s;
  });
  return Object.assign({}, tpl, { tool: null, sections: sections });
}

// Résultats d'une recherche `kind` en contexte d'un diagnostic, favoris en
// tête. /req réunit labo et imagerie, chacun avec son `orderKind`.
function contextResultsFor(dx, kind) {
  const c = dxContextFor(dx);
  if (!c) return [];
  const pick = function (k) {
    const d = ORDER_DEFS[k];
    return (c[k] || []).map(function (key) { return d.items().find(function (it) { return it.key === key; }); }).filter(Boolean);
  };
  // 'req' n'est plus une commande : c'est la vue « requêtes » de la colonne de
  // suggestions (labo et imagerie réunis, chacun avec son `orderKind`).
  if (kind === 'req') {
    return pick('lab').map(function (it) { return Object.assign({}, it, { orderKind: 'lab' }); })
      .concat(pick('img').map(function (it) { return Object.assign({}, it, { orderKind: 'img' }); }));
  }
  if (!ORDER_DEFS[kind] || !c[kind]) return [];
  const favs = ORDER_DEFS[kind].favs;
  const list = pick(kind);
  return list.filter(function (it) { return favs.has(it.key); }).concat(list.filter(function (it) { return !favs.has(it.key); }));
}

// ---------------------------------------------------------------------------
// Suggestions de la suite, après chaque fonction ajoutée (rencontre du
// 2026-10-27, lot 2 : barre en ligne sous le curseur, SuggestionBar).
// ---------------------------------------------------------------------------

// Tests d'une analyse ou d'une puce labo (une puce labo réunit plusieurs analyses).
function _labTests(x) { return (x && x.details && x.details.tests) || (x ? [x.name] : []); }

// Vrai si la puce `attrs` est déjà l'item `item` de la recherche `kind`
// ('rx', 'lab', 'img', ou 'req' avec item.orderKind) : même libellé pour une
// ordonnance ou un examen, analyses comprises dans une puce labo, ou ligne à
// compléter sur le même terme.
function chipIsItem(attrs, kind, item) {
  if (!attrs || !item) return false;
  const k = kind === 'req' ? (item.orderKind || 'lab') : kind;
  if (attrs.draft) return attrs.draft.kind === k && attrs.draft.term === item.name;
  const rk = attrs.rx && attrs.rx.kind;
  if (k === 'lab') {
    if (attrs.type !== 'lab') return false;
    const have = _labTests(attrs);
    return _labTests(item).every(function (x) { return have.indexOf(x) >= 0; });
  }
  return rk === k && attrs.label === (item.name + ' ' + (item.dose || '')).trim();
}

// La puce `attrs` → { kind, item } du catalogue (ordonnance, analyse, examen), ou null.
function orderItemForChip(attrs) {
  if (!attrs || attrs.draft) return null;
  const k = attrs.type === 'lab' ? 'lab' : (attrs.rx && attrs.rx.kind);
  if (['rx', 'lab', 'img'].indexOf(k) < 0) return null;
  const item = ORDER_DEFS[k].items().find(function (it) { return chipIsItem(attrs, k, it); });
  return item ? { kind: k, item: item } : null;
}

// Le diagnostic à suggérer pour un contexte : celui qu'un gabarit de note
// suggère déjà (nom et code réels), sinon le nom de sa conclusion.
function dxSuggestionFor(c) {
  let found = null;
  NOTE_TEMPLATES.some(function (tpl) {
    found = (tpl.dxSuggestions || []).find(function (d) { const o = dxContextFor(d); return o && o.key === c.key; }) || null;
    return !!found;
  });
  return found || { name: c.label, code: c.cim10[0] };
}

const NEXT_TEMPLATE_ICON = { last: 'history', mine: 'person', omnimed: 'library_add' };

// Suggestions de la suite, dans l'ordre de la barre. `a` :
//   region     attributs du diagnostic où vient d'arriver la fonction, ou null ;
//   chip       la puce ajoutée hors d'un diagnostic, ou null ;
//   present    attributs des puces déjà là (dans le diagnostic, ou la ligne) ;
//   sources    `proposedBy` déjà présents (un gabarit déjà appliqué) ;
//   diagnoses  attributs des diagnostics de la note ;
//   ctx        { notes, sommaire } pour la dernière conclusion.
// Sous un diagnostic : son meilleur gabarit de conclusion pas encore
// appliqué, puis ses prescriptions et requêtes. Après une ordonnance ou une
// requête hors diagnostic : le diagnostic qui va avec (s'il n'est pas déjà
// dans la note), puis les autres prescriptions et requêtes de ce diagnostic.
// Entrées : { id, kind: 'template'|'dx'|'order', icon, label, desc, … }.
function nextStepSuggestions(a) {
  const present = a.present || [], sources = a.sources || [];
  let dx = a.region, out = [];
  let except = null;
  if (dx) {
    const opt = dxConclusionOptions(dx, a.ctx).filter(function (o) { return sources.indexOf(o.source) < 0; })[0];
    // Tous en conflit d'allergie (dxConclusionOptions met les autres d'abord) :
    // la pastille le dit, par son icône et son info-bulle.
    const warn = opt && opt.allergy && t('suggest.allergieGabarit.text', { name: opt.allergy.names.join(', '), items: opt.allergy.items.join(', ') });
    if (opt) out.push({ id: 'tpl:' + opt.id, kind: 'template', icon: warn ? 'warning' : NEXT_TEMPLATE_ICON[opt.kind], label: opt.name,
      desc: warn || undefined, option: opt, regionId: dx.id });
  } else {
    except = orderItemForChip(a.chip);
    const c = except && DX_CONTEXTS.find(function (x) { return (x[except.kind] || []).indexOf(except.item.key) >= 0; });
    if (!c) return [];
    const d = dxSuggestionFor(c);
    dx = { name: d.name, code: d.code };
    const inNote = (a.diagnoses || []).some(function (n) { const o = dxContextFor(n); return o && o.key === c.key; });
    if (!inNote) out.push({ id: 'dx:' + d.code, kind: 'dx', icon: 'local_hospital', label: d.name, desc: d.code, dx: d });
  }
  // Pas de produit allergène pour ce patient (comme la recherche /rx, qui les masque).
  const orders = contextResultsFor(dx, 'rx').filter(function (it) { return !rxAllergyOf(it); }).map(function (it) { return { kind: 'rx', item: it }; })
    .concat(contextResultsFor(dx, 'req').map(function (it) { return { kind: 'req', item: it }; }));
  orders.forEach(function (o) {
    if (except && except.item.key === o.item.key) return;
    if (present.some(function (p) { return chipIsItem(p, o.kind, o.item); })) return;
    const k = o.kind === 'rx' ? 'rx' : o.item.orderKind;
    out.push({ id: 'order:' + k + ':' + o.item.key, kind: 'order', icon: ORDER_DEFS[k].icon,
      label: (o.item.name + ' ' + (o.item.dose || '')).trim(), desc: o.item.sig || '', orderKind: o.kind, item: o.item });
  });
  return out;
}

// Éléments structurés que l'Assistant IA propose pour la transcription
// d'exemple (AIBox.jsx : brûlures mictionnelles, bandelette positive) — tweak
// « IA : éléments structurés proposés ». Items du catalogue seulement ;
// contenu SIMULÉ, à valider cliniquement (ID-10). `cat-44` = Nitrofurantoïne.
const AI_SAMPLE_PROPOSALS = [
  { kind: 'lab', key: 'srum' },
  { kind: 'rx', key: 'cat-44', details: { duration: '5', durationUnit: 'jours' } },
];

// Valeurs proposées pour les champs d'une puce — UNE source pour le
// formulaire (ChipPopover, editor-popover.jsx) et l'éditeur inline d'un champ
// (ChipInlineEditor, NoteEditor.jsx), D-04 : pas deux systèmes pour la même
// prescription. Couvre toutes les valeurs du catalogue (tests/field-options).
const FIELD_OPTIONS = {
  route: ['PO', 'SL', 'TD', 'Inhalé', 'Nasal', 'SC', 'IM', 'IV', 'PR', 'Topique', 'Auriculaire', 'Ophtalmique'],
  frequency: ['DIE', 'BID', 'TID', 'QID', 'HS', 'AC', 'PC', 'q4h', 'q6h', 'q8h', 'q12h',
    'PRN', 'DIE PRN', 'BID PRN', 'TID PRN', 'QID PRN', 'HS PRN', 'q4-6h PRN', 'q6-8h PRN', 'q8-12h PRN',
    '1× / semaine', '2× / semaine', '3× / semaine', '1× / 2 semaines', '1× / mois'],
  refills: ['0', '1', '2', '3', '4', '5', '6', '11', '12'],
  durationUnit: ['jours', 'semaines', 'mois'],
  priority: ['Routine', 'Prioritaire', 'Semi-urgent', 'Urgent', 'STAT'],
  // Les spécialités des formulaires CRDS (crds-data.js), par ordre alphabétique.
  specialty: CRDS_SPECS.map(function (s) { return s.name; }),
  // Cotes de priorité CRDS (formulaire d'une référence à une raison CRDS).
  crdsPriority: ['A', 'B', 'C', 'D', 'E'],
};

// Libellé affiché d'une valeur de champ (priorité, spécialité, modalité, région, vues,
// latéralité). La valeur reste un CODE (français, comme dans FIELD_OPTIONS et les
// <select> de formulaire) ; seul son affichage suit la langue, par ce tableau : les
// L() ci-dessous la rendent traduisible par la piste B. Une valeur absente s'affiche telle quelle.
const VALUE_LABEL = {
  'Routine': L('Routine'),
  'Prioritaire': L('Prioritaire'),
  'Semi-urgent': L('Semi-urgent'),
  'Urgent': L('Urgent'),
  'STAT': L('STAT'),
  'Radiographie': L('Radiographie'),
  'Échographie': L('Échographie'),
  'TDM': L('TDM'),
  'IRM': L('IRM'),
  'Mammographie': L('Mammographie'),
  'Thorax': L('Thorax'),
  'Abdomen': L('Abdomen'),
  'Genou': L('Genou'),
  'Cerveau': L('Cerveau'),
  'Seins': L('Seins'),
  'Rachis lombaire': L('Rachis lombaire'),
  'Pelvis': L('Pelvis'),
  'Colonne dorsolombaire': L('Colonne dorsolombaire'),
  'PA + latérale': L('PA + latérale'),
  'AP + latérale': L('AP + latérale'),
  'AP + latérale + rotule': L('AP + latérale + rotule'),
  'Complète': L('Complète'),
  'Bilatérale': L('Bilatérale'),
  'Sus-pubienne + endovaginale': L('Sus-pubienne + endovaginale'),
  'Gauche': L('Gauche'),
  'Droite': L('Droite'),
  'Bilatéral': L('Bilatéral'),
  'Cardiologie': L('Cardiologie'),
  'Orthopédie': L('Orthopédie'),
  'Dermatologie': L('Dermatologie'),
  'Gastroentérologie': L('Gastroentérologie'),
  'Neurologie': L('Neurologie'),
  'Pneumologie': L('Pneumologie'),
  'Rhumatologie': L('Rhumatologie'),
  'Endocrinologie': L('Endocrinologie'),
  'Néphrologie': L('Néphrologie'),
  'Urologie': L('Urologie'),
  'Gynécologie': L('Gynécologie'),
  'Ophtalmologie': L('Ophtalmologie'),
  'ORL': L('ORL'),
  'Chirurgie générale': L('Chirurgie générale'),
  'Chirurgie vasculaire': L('Chirurgie vasculaire'),
  'Hématologie': L('Hématologie'),
  'Oncologie': L('Oncologie'),
  'Psychiatrie': L('Psychiatrie'),
  'Gériatrie': L('Gériatrie'),
  'Médecine interne': L('Médecine interne'),
  'Chirurgie plastique': L('Chirurgie plastique'),
  'Immuno-allergie': L('Immuno-allergie'),
  'Infectiologie': L('Infectiologie'),
  'Neurochirurgie': L('Neurochirurgie'),
  'Physiatrie': L('Physiatrie'),
  'Pédiatrie': L('Pédiatrie')
};
function valueLabel(v) { return Object.prototype.hasOwnProperty.call(VALUE_LABEL, v) ? VALUE_LABEL[v] : v; }

// Les profils d'avant sont des bilans comme les autres (LAB_BILANS) ; le nom
// reste pour les gabarits ({ kind: 'profile', key }) et le formulaire.
const LAB_PROFILES = LAB_BILANS;

function _searchList(list, favSet, q) {
  const nq = _norm((q || '').trim());
  const match = function (it) { return !nq || _norm(it.name).startsWith(nq) || _hay(it.name).includes(nq); };
  const favoris = list.filter(function (it) { return favSet.has(it.key) && match(it); });
  const frequents = list.filter(function (it) { return it.freq && !favSet.has(it.key) && match(it); });
  const autres = nq
    ? list.filter(function (it) { return !it.freq && !favSet.has(it.key) && match(it); }).slice(0, 6)
    : [];
  return { favoris, frequents, autres };
}

// kbd → order kind ('rx' | 'lab' | 'img'), or null
function orderKindForKbd(kbd) {
  const k = (kbd || '').toLowerCase();
  return ORDER_DEFS[k] ? k : null;
}
// Une recherche ouverte ne se réorganise pas quand on ajoute ou retire un
// favori (cœur) : les sections gardent les favoris tels qu'ils étaient à la
// première recherche de la session (spec « Recherche », Figma). Le cœur, lui,
// lit toujours les favoris à jour (`ORDER_DEFS[kind].favs`). La session se
// termine à la fermeture du menu (`endOrderSearch`, onExit du plugin « / »).
let _favFreeze = {};
// `dx` (attributs du diagnostic sous lequel la recherche est ouverte) : tant
// que rien n'est tapé, la liste montre le contexte du diagnostic (`contexte`,
// `contextName`) puis, pour /rx, toutes les médications au dossier — souvent
// on modifie une prescription en maladie chronique plutôt qu'on en crée une
// (rencontre du 2026-10-27, A1). Au premier caractère, ou sur un filtre du
// rail /rx, c'est une recherche normale.
function searchOrder(kind, q, dx) {
  const d = ORDER_DEFS[kind];
  if (!d) return { favoris: [], frequents: [], autres: [] };
  // /ref : le diagnostic de la région donne « Suggérés pour … » en tête de Tout (refViews).
  if (kind === 'ref') _refDx = dx || null;
  if (dx && kind !== 'ref' && !(q || '').trim() && (kind !== 'rx' || _rxFilter === 'tout')) {
    const ctx = contextResultsFor(dx, kind);
    if (ctx.length) {
      const res = { contexte: ctx, contextName: dx.name, profil: kind === 'rx' ? PATIENT_MEDS.slice() : [], favoris: [], frequents: [], autres: [] };
      return kind === 'rx' ? applyAllergyFilter(res) : res;
    }
  }
  if (!_favFreeze[kind]) _favFreeze[kind] = new Set(d.favs);
  const r = d.search(q, _favFreeze[kind]);
  return kind === 'rx' ? applyAllergyFilter(applyRxFilter(r, _rxFilter)) : r;
}
// ---------------------------------------------------------
// Ajout en lot par virgules (« /lab fsc, tsh, ferritine ») : chaque terme
// suivi d'une virgule est déjà résolu — son meilleur résultat, ou rien —, le
// dernier terme reste la recherche en cours. Entrée ajoute le lot et le
// résultat choisi pour ce dernier terme. Pour /instr et /ant, un terme sans
// résultat se garde en texte libre.
// ---------------------------------------------------------
// Les résultats d'une recherche, à plat, dans l'ordre de la vue « Tout » (sans
// filtre du rail ni contexte de diagnostic). Les allergènes masqués de /rx
// n'y sont pas.
function _orderResults(kind, q) {
  const d = ORDER_DEFS[kind];
  const favs = (_favFreeze[kind]) || d.favs;
  if (kind === 'lab') return labViews(q, favs).tout.reduce(function (a, s) { return a.concat(s.items); }, []);
  if (kind === 'ref') return refViews(q, favs).tout.reduce(function (a, s) { return a.concat(s.items); }, []);
  let r = d.search(q, favs);
  if (kind === 'rx') r = applyAllergyFilter(applyRxFilter(r, 'tout'));
  return [].concat(r.profil || [], r.favoris || [], r.frequents || [], r.autres || []);
}
// Le meilleur résultat d'un terme : le nom (ou l'acronyme) exact, puis un nom
// qui commence par le terme, puis le premier de la liste ; un texte libre
// (/instr, /ant) seulement s'il n'y a rien d'autre.
function bestOrderMatch(kind, term) {
  const q = (term || '').trim();
  if (!q) return null;
  const nq = _norm(q);
  const list = _orderResults(kind, q);
  let real = list.filter(function (it) { return !it.free; });
  // Rien pour le terme entier : chaque mot, n'importe où dans le nom ou le
  // sigle (« echo abdo » → Échographie abdominale, « hta »).
  if (!real.length) {
    const words = nq.split(/\s+/).filter(Boolean);
    real = ORDER_DEFS[kind].items().filter(function (it) {
      const h = _hay(it.name) + ' ' + _norm(it.short || '');
      return words.every(function (w) { return h.includes(w); }) && !(kind === 'rx' && rxAllergyOf(it));
    });
  }
  const score = function (it) {
    const names = [it.name, it.short].filter(Boolean).map(_norm);
    return names.indexOf(nq) >= 0 ? 2 : names.some(function (n) { return n.startsWith(nq); }) ? 1 : 0;
  };
  let best = null, top = -1;
  real.forEach(function (it) { const s = score(it); if (s > top) { best = it; top = s; } });
  return best || list.find(function (it) { return it.free; }) || null;
}
// « fsc, tsh, fer » → { picks: [{ term, item|null }], current: 'fer' }, ou
// null sans virgule. Les termes vides (« fsc,, tsh ») sont ignorés.
function orderBatch(kind, term) {
  const parts = String(term || '').split(',');
  if (parts.length < 2 || !ORDER_DEFS[kind]) return null;
  const picks = parts.slice(0, -1).map(function (p) { return p.trim(); }).filter(Boolean)
    .map(function (p) {
      const item = bestOrderMatch(kind, p);
      // /rx : un terme qui ne trouve qu'un allergène masqué le dit (bannière d'allergie).
      const masked = !item && kind === 'rx' && RX_ALL.some(function (it) { return rxAllergyOf(it) && _hay(it.name).includes(_norm(p)); });
      return { term: p, item: item, masked: masked };
    });
  return { picks: picks, current: parts[parts.length - 1].trim() };
}

function endOrderSearch() { _favFreeze = {}; _rxFilter = 'tout'; _labView = 'tout'; _refView = 'tout'; _showAllergens = false; }
// Compteurs du rail avec les favoris figés de la recherche en cours.
function rxCounts(q) { return rxFilterCounts(q, _favFreeze.rx || ORDER_DEFS.rx.favs); }
function toggleOrderFav(kind, key) { const d = ORDER_DEFS[kind]; if (d) { d.favs.has(key) ? d.favs.delete(key) : d.favs.add(key); } }

// Regenerate the rich-chip payload after a popover edit (lab / imaging)
// Nom d'une puce labo : le nom du bilan tant qu'il est entier (RA-19 du
// prototype « Note saisie fonction chips »), sinon les analyses, en acronyme
// quand elles en ont un (« FSC, TSH », RA-18).
function deriveLabRx(d) {
  const tests = d.tests || [];
  const whole = d.profile && d.profileTests && d.profileTests.length === tests.length
    && d.profileTests.every(function (x) { return tests.indexOf(x) >= 0; });
  const name = whole ? d.profile : tests.length ? tests.map(labShortName).join(', ') : t('schema.labRequest.text');
  const sig = [d.fasting ? t('schema.fasting.text') : '', valueLabel(d.priority)].filter(Boolean).join(' · ');
  return { name: name, dose: '', sig: sig, kind: 'lab' };
}
function deriveImgRx(d) {
  const name = [valueLabel(d.modality), valueLabel(d.region)].filter(Boolean).join(' ') || t('data.imagingRequest.text');
  const sig = [d.contrast && d.contrast !== 'Sans' ? t('data.withContrast.text') : '', valueLabel(d.views), valueLabel(d.priority)].filter(Boolean).join(' · ');
  return { name: name, dose: '', sig: sig, kind: 'img' };
}
// Priorité affichée : une cote CRDS (A à E) se lit « Priorité B ».
function priorityLabel(p) { return /^[A-E]$/.test(p || '') ? t('data.crdsPriority.text', { cote: p }) : valueLabel(p); }
// La raison CRDS précède la priorité.
function deriveRefRx(d) {
  const name = valueLabel(d.specialty) || t('data.referralSpecialist.text');
  return { name: name, dose: '', sig: [d.reason, priorityLabel(d.priority || 'Routine')].filter(Boolean).join(' · '), kind: 'ref' };
}
function deriveExamRx(d) {
  return { name: d.exam || t('data.examRequest.text'), dose: '', sig: valueLabel(d.priority || 'Routine'), kind: 'exam' };
}
function deriveServRx(d) {
  const sig = [d.frequency, valueLabel(d.priority || 'Routine')].filter(Boolean).join(' · ');
  return { name: d.service || t('data.serviceRequest.text'), dose: '', sig: sig, kind: 'serv' };
}

const SLASH_ITEMS = [
  // ── STRUCTURE ────────────────────────────────────────────
  { key: 'outils-cliniques', section: L('Structure'), icon: 'handyman', title: L('Outils cliniques'), desc: L('Score, calculatrice, outil clinique…'), kbd: '',
    ctPicker: true, noKbd: true },
  { key: 'note-templates', section: L('Structure'), icon: 'post_add', title: L('Gabarits de note'), desc: L('Syndrome viral, infection urinaire, examen périodique…'), kbd: '',
    notePicker: true, noKbd: true },
  // ── GABARITS DE NOTE ─────────────────────────────────────
  // Un niveau au-dessus des gabarits de section / outil clinique : règle
  // structure + sections + outil clinique associé en un seul geste. Masqués
  // du menu par défaut (hideWhenEmpty) — atteints via l'item « Gabarits de
  // note » ci-dessus (NoteTemplateMenu) ou directement au clavier (/virus…).
  { key: 'tpl-premiere', section: L('Gabarits de note'), icon: 'how_to_reg', title: L('Première rencontre'), desc: L('Antécédents, habitudes de vie, examen, conclusion'), kbd: 'premiere',
    hideWhenEmpty: true, noteTemplate: 'premiere' },
  { key: 'tpl-suivi', section: L('Gabarits de note'), icon: 'update', title: L('Suivi'), desc: L('Évolution, examen ciblé, plan'), kbd: 'suivi',
    hideWhenEmpty: true, noteTemplate: 'suivi' },
  { key: 'tpl-aigu', section: L('Gabarits de note'), icon: 'sick', title: L('Problème aigu'), desc: L('Histoire, examen ciblé, conclusion'), kbd: 'aigu',
    hideWhenEmpty: true, noteTemplate: 'aigu' },
  { key: 'tpl-virus', section: L('Gabarits de note'), icon: 'coronavirus', title: L('Syndrome viral / IVRS'), desc: L('Histoire, examen, conclusion'), kbd: 'virus',
    hideWhenEmpty: true, noteTemplate: 'virus' },
  { key: 'tpl-itu', section: L('Gabarits de note'), icon: 'medical_information', title: L('Infection urinaire'), desc: L('Structure + outil clinique ITU'), kbd: 'itu',
    descNoTool: L('Structure + analyse d’urine proposée'),
    hideWhenEmpty: true, noteTemplate: 'itu' },
  { key: 'tpl-periodique', section: L('Gabarits de note'), icon: 'event_repeat', title: L('Examen périodique'), desc: L('Antécédents, examen, conclusion'), kbd: 'periodique',
    hideWhenEmpty: true, noteTemplate: 'periodique' },
  { key: 'tpl-otite', section: L('Gabarits de note'), icon: 'hearing', title: L('Otite moyenne aiguë'), desc: L('Histoire, examen, conclusion + ordonnance proposée'), kbd: 'otite',
    hideWhenEmpty: true, noteTemplate: 'otite' },
  { key: 'tpl-pneumonie', section: L('Gabarits de note'), icon: 'pulmonology', title: L('Pneumonie (suspicion)'), desc: L('Histoire, examen, conclusion + requêtes et ordonnance proposées'), kbd: 'pneumonie',
    hideWhenEmpty: true, noteTemplate: 'pneumonie' },
  // ── FONCTIONS ────────────────────────────────────────────
  { key: 'add-file', section: L('Fonctions'), icon: 'upload_file', title: L('Ajouter des fichiers'), desc: L('PDF, image depuis ordinateur…'), kbd: '',
    noKbd: true, fileAction: true },
  { key: 'instructions', section: L('Fonctions'), icon: 'menu_book', title: L('Instructions patient'), desc: L('Consignes au patient'), kbd: 'instr',
    orderSearch: true,
    template: { type: 'instructions', label: L('Consignes'), text: L('Consignes au patient'),
      details: { title: '', body: '', delivery: 'Imprimer + portail' } } },
  { key: 'textes-rapides', section: L('Fonctions'), icon: 'bolt', title: L('Textes rapides'), desc: L('Insérer un modèle de texte'), kbd: '',
    noKbd: true, textRapides: true },
  { key: 'diagnostic', section: L('Fonctions'), icon: 'local_hospital', title: L('Diagnostic'), desc: L('Créer une section diagnostic'), kbd: 'dx',
    diagnosticEntry: true },
  // N'apparaît que si la note contient déjà au moins un diagnostic — voir
  // window.__HAS_DIAGNOSTICS dans filterSlashItems (editor-schema.jsx).
  { key: 'diagnostic-ref', section: L('Fonctions'), icon: 'tag', title: L('Renvoi à un diagnostic'), desc: L('Insère le numéro d’un diagnostic déjà ajouté'), kbd: '',
    noKbd: true, diagRefPicker: true },
  { key: 'prescription', section: L('Fonctions'), icon: 'prescriptions', title: L('Prescriptions'), desc: L('Rechercher et prescrire un médicament'), kbd: 'rx',
    rxSearch: true },
  { key: 'lab', section: L('Fonctions'), icon: 'science', title: L('Laboratoire'), desc: L('FSC, TSH, bilan…'), kbd: 'lab',
    orderSearch: true,
    template: { type: 'lab', label: L('Demande de laboratoire'), text: L('Demande de laboratoire'),
      details: { tests: [L('FSC')], priority: 'Routine', fasting: false, context: '', collection: L('Au CH le plus proche') } } },
  { key: 'imaging', section: L('Fonctions'), icon: 'radiology', title: L('Imagerie'), desc: L('Radio, écho, TDM'), kbd: 'img',
    orderSearch: true,
    template: { type: 'imaging', label: L("Demande d'imagerie"), text: L("Demande d'imagerie"),
      details: { modality: 'Radiographie', region: '', views: '', priority: 'Routine', context: '', contrast: 'Sans' } } },
  { key: 'referral', section: L('Fonctions'), icon: 'person_add', title: L('Référence spécialiste'), desc: L('Cardio, ortho, derm…'), kbd: 'ref',
    orderSearch: true,
    template: { type: 'referral', label: L('Référence spécialiste'), text: L('Référence spécialiste'),
      details: { specialty: '', question: '', indication: '', priority: 'Routine', crds: '' } } },
  { key: 'exam', section: L('Fonctions'), icon: 'monitor_heart', title: L('Examen diagnostique'), desc: L('ECG, Holter, MAPA…'), kbd: 'exam',
    orderSearch: true,
    template: { type: 'exam', label: L('Examen diagnostique'), text: L('Examen diagnostique'),
      details: { exam: '', question: '', priority: 'Routine', comment: '' } } },
  { key: 'service', section: L('Fonctions'), icon: 'medical_services', title: L('Services'), desc: L('Soins infirmiers, pansement…'), kbd: 'serv',
    orderSearch: true,
    template: { type: 'service', label: L('Service'), text: L('Service'),
      details: { service: '', frequency: '', priority: 'Routine', instructions: '' } } },
  { key: 'antecedents', section: L('Fonctions'), icon: 'history', title: L('Antécédents'), desc: L('Plusieurs à la fois, documentés au dossier'), kbd: 'ant',
    orderSearch: true },
  // ── accessible via /pb uniquement (masqué dans menu vide) ─
  { key: 'problem', section: L('Fonctions'), icon: 'flag', title: L('Problème'), desc: L('Ajouter au problématique'), kbd: 'pb',
    hideWhenEmpty: true,
    template: { type: 'problem', label: L('Problème'), text: L('Problème'),
      details: { name: '', severity: 'Modéré', since: "Aujourd'hui", notes: '' } } },
  // ── CONFIDENTIEL — section à part (une seule instance par note, cf.
  // confidentialField ci-dessous et NoteEditor.jsx) ─────────
  { key: 'confidential-field', section: L('Confidentiel'), icon: 'lock', title: L('Champ confidentiel'), desc: L('Visible seulement par vous'), kbd: '',
    noKbd: true, confidentialField: true },
];

// ── GABARITS DE NOTE ─────────────────────────────────────────
// Déclenchés par les entrées "Gabarits de note" ci-dessus (/virus, /itu,
// /periodique). Inspirés des types de notes communs déjà présents dans
// le picker d'outils cliniques et l'Assistant IA.
const NOTE_TEMPLATES = [
  // Gabarits de visite (`general`), proposés tant que la note est vide :
  // le type de rencontre plutôt qu'une maladie (demande d'Ignacio Calvo,
  // 2026-10-27). Contenu d'exemple, à valider.
  {
    key: 'premiere', name: L('Première rencontre'), general: true,
    raison: L('Première rencontre — prise en charge'),
    sections: [
      { title: L('Antécédents'), content: L('Antécédents personnels : \nAntécédents familiaux : \nAntécédents chirurgicaux : ') },
      { title: L('Médication et allergies'), content: L('Médication actuelle : \nAllergies : ') },
      { title: L('Habitudes de vie'), content: L('Tabac : \nAlcool : \nActivité physique : ') },
      { title: L('Examen physique'), content: L('Signes vitaux : TA _/_, pouls _, poids _ kg, taille _ cm\nExamen général : ') },
      { title: t('sections.conclusion.heading'), content: L('Impression : \nPlan : ') },
    ],
  },
  {
    key: 'suivi', name: L('Suivi'), general: true,
    raison: L('Visite de suivi'),
    sections: [
      { title: L('Depuis la dernière visite'), content: L('Évolution : \nObservance du traitement : \nEffets indésirables : ') },
      { title: L('Examen physique'), content: L('Signes vitaux : \nExamen ciblé : ') },
      { title: t('sections.conclusion.heading'), content: L('Impression : \nPlan : \nProchain suivi : ') },
    ],
  },
  {
    key: 'aigu', name: L('Problème aigu'), general: true,
    raison: L('Consultation pour un problème aigu'),
    sections: [
      { title: L('Histoire de la maladie actuelle'), content: L('Depuis : \nSymptômes : \nFacteurs aggravants ou soulageants : ') },
      { title: L('Examen physique'), content: L('Signes vitaux : \nExamen ciblé : ') },
      { title: t('sections.conclusion.heading'), content: L('Impression : \nPlan : ') },
    ],
  },
  {
    key: 'virus', name: L('Syndrome viral / IVRS'),
    raison: L('Symptômes de rhume / syndrome viral'),
    sections: [
      { title: L('Histoire de la maladie actuelle'),
        content: L('Depuis : \nSymptômes : \nDrapeaux rouges (absents) : dyspnée, douleur thoracique, confusion, incapacité à s’hydrater') },
      { title: L('Examen physique'),
        content: L('Apyrétique / fébrile (T°) : \nAuscultation pulmonaire : \nOropharynx / tympans : ') },
      { title: t('sections.conclusion.heading'), content: L('Impression : \nPlan : ') },
    ],
    // Flux de Sacha (rencontre vision 2026-10-27) : à la fin d'un gabarit de
    // début de note, 3 ou 4 diagnostics suggérés ; un clic ajoute le
    // diagnostic et son gabarit de conclusion. Codes CIM-10 ; à valider.
    dxSuggestions: [
      { name: L('Infection des voies respiratoires supérieures'), code: 'J06.9' },
      { name: L('Pharyngite aiguë'), code: 'J02.9' },
      { name: L('Sinusite aiguë'), code: 'J01.9' },
      { name: L('Pneumonie'), code: 'J18.9' },
    ],
  },
  {
    key: 'itu', name: L('Infection urinaire'),
    raison: L('Symptômes urinaires'),
    sections: [
      { title: t('sections.details.heading'), content: '' },
      { title: t('sections.conclusion.heading'), content: L('Impression : \nPlan : ') },
    ],
    tool: 'itu',
    toolRequests: [{ kind: 'lab', key: 'srum' }],
    dxSuggestions: [
      { name: L('Cystite aiguë non compliquée'), code: 'N30.0' },
      { name: L('Pyélonéphrite aiguë'), code: 'N10' },
      { name: L('Urétrite'), code: 'N34.1' },
      { name: L('Vaginite'), code: 'N76.0' },
    ],
  },
  {
    key: 'periodique', name: L('Examen périodique'), general: true,
    raison: L('Examen médical périodique'),
    sections: [
      { title: L('Antécédents et revue des systèmes'),
        content: L('Antécédents personnels : \nMédication actuelle : \nAllergies : \nHabitudes de vie : \nRevue des systèmes : sans particularité') },
      { title: L('Examen physique'),
        content: L('Signes vitaux : TA _/_, pouls _, poids _ kg, IMC _\nExamen général : ') },
      { title: t('sections.conclusion.heading'), content: L('Impression : Bonne santé générale.\nPlan : ') },
    ],
  },
  // Gabarit avec ajout proposé : `proposals` = éléments inline (ordonnance…)
  // que le gabarit ne crée pas, il les propose — chip en attente avec ✓ / ✕
  // (voir buildTemplateBlocks et decoratePendingChip, editor-schema.jsx).
  // Chaque proposition pointe un item du catalogue { kind, key } (ORDER_DEFS).
  {
    key: 'otite', name: L('Otite moyenne aiguë'),
    raison: L('Otalgie'),
    sections: [
      { title: L('Histoire de la maladie actuelle'),
        content: L('Depuis : \nOtalgie (côté) : \nFièvre : \nÉcoulement / hypoacousie : ') },
      { title: L('Examen physique'),
        content: L('Température : \nOtoscopie droite : \nOtoscopie gauche : \nOropharynx : ') },
      { title: t('sections.conclusion.heading'), content: L('Impression : Otite moyenne aiguë.\nPlan : '),
        proposals: [{ kind: 'rx', key: 'amox500' }] },
    ],
    dxSuggestions: [
      { name: L('Otite moyenne aiguë'), code: 'H66.9' },
      { name: L('Otite externe'), code: 'H60.9' },
      { name: L('Otite séreuse'), code: 'H65.9' },
    ],
  },
  // Gabarit avec plusieurs ajouts proposés, dont une ordonnance INCOMPLÈTE
  // (fréquence laissée vide, cas soulevé en rencontre : un gabarit de
  // prescription qui crée une ordonnance à compléter). Contenu clinique
  // d'exemple, à valider (ID-07). `cat-48` = Amoxicilline-clavulanate au
  // catalogue (clé dérivée de sa position dans MED_CATALOG).
  {
    key: 'pneumonie', name: L('Pneumonie (suspicion)'),
    raison: L('Toux et fièvre'),
    sections: [
      { title: L('Histoire de la maladie actuelle'),
        content: L('Toux depuis : \nFièvre : \nDyspnée / douleur thoracique : \nExpectorations : ') },
      { title: L('Examen physique'),
        content: L('Température : \nFR / SpO2 : \nAuscultation pulmonaire : ') },
      { title: t('sections.conclusion.heading'), content: L('Impression : Pneumonie acquise en communauté à confirmer.\nPlan : '),
        proposals: [
          { kind: 'img', key: 'rxpoumon' },
          { kind: 'lab', key: 'fsc' },
          { kind: 'rx', key: 'cat-48', details: { frequency: '' } }
        ] },
    ],
    dxSuggestions: [
      { name: L('Pneumonie'), code: 'J18.9' },
      { name: L('Bronchite aiguë'), code: 'J20.9' },
      { name: L('Infection des voies respiratoires supérieures'), code: 'J06.9' },
    ],
  },
];

const PATIENT = window.forPatient({ adulte: {
  // Micheline Lamontagne : l'exemple du Figma « Demande de consultation en
  // médecine spécialisée » (patients.js). Données fictives.
  initials: 'ML',
  name: 'Micheline Lamontagne',
  age: L('47 ans'),
  ageYears: 47,
  sex: 'F',
  dob: L('05 décembre 1978'),
  ramq: 'LAMM 7862 0512',
  phone: '819 555 0273',
  cell: '819-555-0273',
  email: 'micheline.lamontagne.test@example.com',
  chart: '702415',
  reason: L('Migraine sans aura'),
  status: L('En consultation'),
  pharmacyId: 'pjc-centre',
}, pediatrique: {
  initials: 'GT',
  name: 'Geneviève Tremblay',
  age: L('15 ans'),
  ageYears: 15,
  sex: 'F',
  dob: L('03 mai 2011'),
  ramq: 'TREG 1155 0301',
  phone: '514 555 0184',
  reason: L('Otite moyenne aiguë'),
  status: L('En consultation'),
  // Pharmacie favorite au dossier : préremplie comme destinataire de
  // l'ordonnance au checkout (maquette « Transmission générale »).
  pharmacyId: 'pjc-centre',
} });

// Bottin des pharmacies à proximité, pour le destinataire de l'ordonnance au
// checkout. Données SIMULÉES : distances fictives depuis la clinique, courriels
// en exemple. `favorite` = favori du médecin (♡) ; la pharmacie du patient est
// PATIENT.pharmacyId (★). `prescribeIt` : la pharmacie reçoit l'ordonnance par
// PrescribeIT, qui remplace alors le fax et le courriel.
const PHARMACIES = [
  { id: 'pjc-centre', name: L('PJC Jean-Coutu — Centre-ville'), banner: 'Jean Coutu', distanceKm: 1.2,
    address: L('1211 rue King Ouest, Sherbrooke (Québec) J1H 1R2'), phone: '819 565-9595', fax: '819 565-9673',
    email: 'centre-ville@pharmacie.exemple', favorite: true },
  { id: 'brunet-wellington', name: L('Pharmacie Brunet — Wellington Sud'), banner: 'Brunet', distanceKm: 2.4,
    address: L('560 rue Wellington Sud, Sherbrooke (Québec) J1H 5E3'), phone: '819 566-2223', fax: '819 566-0363',
    prescribeIt: true, favorite: true },
  { id: 'uniprix-king', name: L('Uniprix — King Ouest'), banner: 'Uniprix', distanceKm: 2.4,
    address: L('2050 rue King Ouest, Sherbrooke (Québec) J1J 2E8'), phone: '819 823-2222', fax: '819 823-7204',
    favorite: false },
  { id: 'familiprix-fleurimont', name: L('Familiprix — Fleurimont'), banner: 'Familiprix', distanceKm: 4.1,
    address: L('3050 boulevard de Portland, Sherbrooke (Québec) J1L 1K1'), phone: '819 569-1414', fax: '819 569-1415',
    prescribeIt: true, favorite: false },
  { id: 'pjc-rock-forest', name: L('PJC Jean-Coutu — Rock Forest'), banner: 'Jean Coutu', distanceKm: 8.7,
    address: L('4800 boulevard Bourque, Sherbrooke (Québec) J1N 2A7'), phone: '819 864-4441', fax: '819 864-4442',
    email: 'rock-forest@pharmacie.exemple', favorite: false },
  { id: 'proxim-lennoxville', name: L('Proxim — Lennoxville'), banner: 'Proxim', distanceKm: 9.6,
    address: L('150 rue Queen, Sherbrooke (Québec) J1M 1J6'), phone: '819 346-8411', fax: '819 346-8412',
    favorite: false },
];

// Gabarits de note suggérés selon la raison de consultation (colonne de
// suggestions, rencontre vision 2026-10-27) : mots de la raison, dans les deux
// langues, qui appellent chaque gabarit. Au plus `max` gabarits, dans l'ordre
// de NOTE_TEMPLATES. Contenu SIMULÉ, à valider.
const TEMPLATE_REASON_WORDS = {
  virus: ['rhume', 'toux', 'fievre', 'gorge', 'congestion', 'ivrs', 'grippe', 'viral', 'cold', 'cough', 'fever', 'throat', 'flu'],
  itu: ['urinaire', 'urinaires', 'urine', 'brulure', 'brulures', 'mictionnelle', 'mictionnelles', 'dysurie', 'cystite', 'urinary', 'burning', 'dysuria', 'cystitis'],
  periodique: ['periodique', 'annuel', 'bilan', 'periodic', 'annual', 'checkup', 'physical'],
  premiere: ['premiere', 'nouveau', 'nouvelle', 'first', 'new', 'intake'],
  suivi: ['suivi', 'controle', 'follow', 'followup', 'recheck'],
  otite: ['oreille', 'otalgie', 'otite', 'ear', 'earache', 'otalgia', 'otitis'],
  pneumonie: ['toux', 'fievre', 'dyspnee', 'pneumonie', 'cough', 'fever', 'dyspnea', 'pneumonia'],
};
function templatesForReason(text, max) {
  const words = ' ' + _hay(text || '').replace(/[^a-z0-9]+/g, ' ') + ' ';
  if (!words.trim()) return [];
  return NOTE_TEMPLATES.filter(function (tpl) {
    return (TEMPLATE_REASON_WORDS[tpl.key] || []).some(function (w) { return words.indexOf(' ' + w + ' ') >= 0; });
  }).slice(0, max || 3);
}

// Points de départ de la visite (rencontre vision 2026-10-27, Xavier
// Boilard) : au début de la visite, le contexte du rendez-vous, puis un ou
// plusieurs points de départ — la raison du rendez-vous, le suivi d'un
// résultat, un problème au dossier — et un gabarit de début de note suggéré
// selon ces choix. Données SIMULÉES : le rendez-vous du jour (sans rendez-vous,
// scénario infection urinaire des tests) et un résultat à suivre.
const VISIT_APPOINTMENT = window.forPatient({
  pediatrique: { time: '08:30', type: L('Sans rendez-vous'), reason: L('Brûlures mictionnelles depuis 3 jours'), bookedBy: L('Prise par la réception') },
  adulte: { time: '10:15', type: L('Rendez-vous de suivi'), reason: L('Céphalées plus fréquentes depuis 4 mois'), bookedBy: L('Pris par la patiente en ligne') } });
const RESULTS_TO_FOLLOW = window.forPatient({ adulte: [], pediatrique: [
  { id: 'res-a1c', name: L('HbA1c'), value: L('6,4 %'), flag: L('À la limite'), date: L('20 octobre 2026') },
] });

// ctx = { appointment, results, sommaire (lignes de getSommaireDiagnostics) }
// → [{ id, kind: 'raison'|'resultat'|'probleme', label, detail, text, short, target? }].
// `text` : les mots qui choisissent le gabarit ; `short` : ce qui entre dans la
// raison de consultation ; `target` : la ligne du dossier, pour reprendre le
// problème en diagnostic. Problèmes actifs seulement (pas les antécédents).
function visitStartPoints(ctx) {
  const out = [];
  const a = ctx && ctx.appointment;
  if (a && a.reason) out.push({ id: 'raison', kind: 'raison', label: t('visit.raisonRdv.label'), detail: a.reason, text: a.reason, short: a.reason });
  ((ctx && ctx.results) || []).forEach(function (r) {
    out.push({ id: 'res:' + r.id, kind: 'resultat', label: t('visit.suiviResultat.label', { name: r.name }),
      detail: [r.value, r.flag, r.date].filter(Boolean).join(' · '),
      text: t('visit.suiviResultat.text', { name: r.name, value: r.value, date: r.date }), short: t('visit.suiviResultat.label', { name: r.name }) });
  });
  ((ctx && ctx.sommaire) || []).filter(function (row) { return row.sommaireKind === 'probleme' && row.sommaireStatus !== 'resolu'; }).forEach(function (row) {
    out.push({ id: 'pb:' + row.sommaireId, kind: 'probleme', label: row.name, detail: row.meta || '', text: row.name, short: row.name, target: row });
  });
  return out;
}
// Gabarits de début de note pour les points de départ choisis (au plus 3).
function startTemplatesFor(points) {
  return templatesForReason((points || []).map(function (p) { return p.text; }).join(' '), 3);
}
// Raison de consultation de la note : les points choisis, dans l'ordre.
function visitReason(points) {
  return (points || []).map(function (p) { return p.short; }).join(' · ');
}

window.NOTE_DATA = { ENTITY_TYPES, MED_CATALOG, SLASH_ITEMS, NOTE_TEMPLATES, PATIENT, PHARMACIES,
  RX_FAVS, RX_ITEMS, PATIENT_MEDS, MED_STATUS_LABEL, medActions, medStatusText, defaultMedAction, summaryAddDetail,
  medDoseStep, adjustMedDose, RX_FILTERS, setRxFilter, getRxFilter, rxCounts, rxFilterCounts, applyRxFilter, searchRx, toggleRxFav, deriveRx,
  setPatientAllergies, getPatientAllergies, setShowAllergens, rxAllergyOf, applyAllergyFilter,
  ORDER_DEFS, orderKindForKbd, searchOrder, endOrderSearch, toggleOrderFav, deriveLabRx, deriveImgRx, deriveRefRx, deriveExamRx, deriveServRx,
  LAB_PROFILES, LAB_GROUPS, LAB_BILANS, searchLab, labRail, labViewKeys, setLabView, getLabView,
  CRDS_SPECS, CRDS_REASONS, crdsReason, crdsReasonsOf, crdsRefDetails, crdsRefItem, crdsSection, crdsFitsPatient, refSuggestionsFor, crdsPrereqs, crdsPrereqInit, crdsPrereqMissing, searchRef, refRail, refViewKeys, setRefView, getRefView,
  orderViewKeys, getOrderView, setOrderView, orderRail, priorityLabel, orderBatch, bestOrderMatch, INSTR_ITEMS, labOnFile, labShortName, FIELD_OPTIONS, valueLabel, AI_SAMPLE_PROPOSALS, DX_CONTEXTS, dxContextFor, contextResultsFor, templatesForReason, chipIsItem, orderItemForChip, dxSuggestionFor, nextStepSuggestions,
  dxConclusionOptions, QUICK_TEXTS, noteDayLabel, templateWithoutTool,
  VISIT_APPOINTMENT, RESULTS_TO_FOLLOW, visitStartPoints, startTemplatesFor, visitReason };
