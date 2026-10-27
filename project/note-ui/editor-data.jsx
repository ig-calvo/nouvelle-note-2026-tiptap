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
};

// MED_CATALOG — catalogue de recherche /rx (source : medicaments.json, 50 entrées)
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
      indication: L('UTI (grossesse, alternative)'), notes: L('Antibiotique') } }
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
    key: 'cat-' + i, name: m.details.molecule || _cap(m.stem), brand: m.brand,
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
// profil garde le contraceptif et la nitrofurantoïne déjà au Sommaire.
const MED_STATUS_LABEL = { active: t('data.medStatusActive.text'), echue: t('data.medStatusExpired.text'), 'cessée': t('data.medStatusCeased.text') };
const PATIENT_MEDS = [
  { key: 'med-contraceptif', name: L('Contraceptif oral'), dose: '', med: true, medStatus: 'active', medStatusLabel: L('actif'),
    sig: L('1 co PO DIE'),
    chipSig: L('1 co PO DIE'),
    details: { molecule: L('Contraceptif oral'), dose: '', unit: '', form: 'comprimé', route: 'PO',
      frequency: 'DIE', duration: '', durationUnit: '', quantity: '', refills: '11',
      indication: L('Contraception'), notes: L('Profil actif au dossier.') } },
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
];

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
// Compteurs du rail, pour la recherche en cours. Tout = les lignes que « Tout »
// affiche.
function rxFilterCounts(q, favs) {
  const r = searchRx(q, favs);
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
// Laboratoire — commande « /lab » (mêmes sections que /rx)
// =========================================================
const LAB_FAVS = new Set(['fsc', 'lipide']);
const LAB_ITEMS = [
  { key: 'fsc', name: L('FSC'), dose: '',
    sig: L('Formule sanguine complète · Routine'),
    chipSig: L('Routine'),
    details: { tests: [L('FSC')], priority: 'Routine', fasting: false, context: '', collection: L('Au CH le plus proche') } },
  { key: 'lipide', name: L('Bilan lipidique'), dose: '',
    sig: L('Cholestérol total, HDL, LDL, TG · À jeun 12 h · Routine'),
    chipSig: L('À jeun · Routine'),
    details: { tests: [L('Cholestérol total'), L('HDL'), L('LDL'), L('Triglycérides')], priority: 'Routine', fasting: true, context: L('Dépistage cardiovasculaire'), collection: L('Au CH le plus proche') } },
  { key: 'tsh', name: L('TSH'), dose: '', freq: true,
    sig: L('Thyréostimuline · Routine'),
    chipSig: L('Routine'),
    details: { tests: [L('TSH')], priority: 'Routine', fasting: false, context: '', collection: L('Au CH le plus proche') } },
  { key: 'glyc', name: L('Glycémie à jeun'), dose: '', freq: true,
    sig: L('Glucose plasmatique · À jeun 8 h · Routine'),
    chipSig: L('À jeun · Routine'),
    details: { tests: [L('Glycémie à jeun')], priority: 'Routine', fasting: true, context: '', collection: L('Au CH le plus proche') } },
  { key: 'hba1c', name: L('HbA1c'), dose: '', freq: true,
    sig: L('Hémoglobine glyquée · Routine'),
    chipSig: L('Routine'),
    details: { tests: [L('HbA1c')], priority: 'Routine', fasting: false, context: L('Suivi diabète'), collection: L('Au CH le plus proche') } },
  { key: 'creat', name: L('Créatinine / DFGe'), dose: '', freq: true,
    sig: L('Créatinine sérique + débit de filtration · Routine'),
    chipSig: L('Routine'),
    details: { tests: [L('Créatinine'), L('DFGe')], priority: 'Routine', fasting: false, context: '', collection: L('Au CH le plus proche') } },
  { key: 'ions', name: L('Ions (Na, K, Cl)'), dose: '', freq: true,
    sig: L('Électrolytes · Routine'),
    chipSig: L('Routine'),
    details: { tests: [L('Sodium'), L('Potassium'), L('Chlore')], priority: 'Routine', fasting: false, context: '', collection: L('Au CH le plus proche') } },
  { key: 'ferritine', name: L('Ferritine'), dose: '',
    sig: L('Réserves de fer · Routine'), chipSig: L('Routine'),
    details: { tests: [L('Ferritine')], priority: 'Routine', fasting: false, context: '', collection: L('Au CH le plus proche') } },
  { key: 'b12', name: L('Vitamine B12'), dose: '',
    sig: L('Cobalamine sérique · Routine'), chipSig: L('Routine'),
    details: { tests: [L('Vitamine B12')], priority: 'Routine', fasting: false, context: '', collection: L('Au CH le plus proche') } },
  { key: 'bilanhep', name: L('Bilan hépatique'), dose: '',
    sig: L('ALT, AST, PAL, bilirubine · Routine'), chipSig: L('Routine'),
    details: { tests: [L('ALT'), L('AST'), L('PAL'), L('Bilirubine')], priority: 'Routine', fasting: false, context: '', collection: L('Au CH le plus proche') } },
  { key: 'inr', name: L('INR'), dose: '',
    sig: L('Temps de prothrombine · Prioritaire'), chipSig: L('Prioritaire'),
    details: { tests: [L('INR')], priority: 'Prioritaire', fasting: false, context: L('Suivi anticoagulation'), collection: L('Au CH le plus proche') } },
  { key: 'srum', name: L("Analyse d'urine (SMU-DCA)"), dose: '',
    sig: L('Sommaire microscopique + culture · Routine'), chipSig: L('Routine'),
    details: { tests: [L('SMU'), L('Culture urinaire')], priority: 'Routine', fasting: false, context: '', collection: L('Au CH le plus proche') } },
];

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
// =========================================================
const REF_FAVS = new Set(['cardio', 'ortho', 'derm']);
const REF_ITEMS = [
  { key: 'cardio',  name: L('Cardiologie'),       dose: '',
    sig: L('Avis cardiologie · Routine'),      chipSig: L('Routine'),
    details: { specialty: 'Cardiologie',       question: '', indication: '', priority: 'Routine', crds: '' } },
  { key: 'ortho',   name: L('Orthopédie'),         dose: '', freq: true,
    sig: L('Avis orthopédie · Routine'),       chipSig: L('Routine'),
    details: { specialty: 'Orthopédie',         question: '', indication: '', priority: 'Routine', crds: '' } },
  { key: 'derm',    name: L('Dermatologie'),       dose: '', freq: true,
    sig: L('Avis dermatologie · Routine'),     chipSig: L('Routine'),
    details: { specialty: 'Dermatologie',       question: '', indication: '', priority: 'Routine', crds: '' } },
  { key: 'gastro',  name: L('Gastroentérologie'),  dose: '', freq: true,
    sig: L('Avis gastroentérologie · Routine'), chipSig: L('Routine'),
    details: { specialty: 'Gastroentérologie',  question: '', indication: '', priority: 'Routine', crds: '' } },
  { key: 'neuro',   name: L('Neurologie'),         dose: '', freq: true,
    sig: L('Avis neurologie · Routine'),       chipSig: L('Routine'),
    details: { specialty: 'Neurologie',         question: '', indication: '', priority: 'Routine', crds: '' } },
  { key: 'pneumo',  name: L('Pneumologie'),        dose: '',
    sig: L('Avis pneumologie · Routine'),      chipSig: L('Routine'),
    details: { specialty: 'Pneumologie',        question: '', indication: '', priority: 'Routine', crds: '' } },
  { key: 'rhuma',   name: L('Rhumatologie'),       dose: '',
    sig: L('Avis rhumatologie · Routine'),     chipSig: L('Routine'),
    details: { specialty: 'Rhumatologie',       question: '', indication: '', priority: 'Routine', crds: '' } },
  { key: 'endo',    name: L('Endocrinologie'),     dose: '',
    sig: L('Avis endocrinologie · Routine'),   chipSig: L('Routine'),
    details: { specialty: 'Endocrinologie',     question: '', indication: '', priority: 'Routine', crds: '' } },
  { key: 'nephro',  name: L('Néphrologie'),        dose: '',
    sig: L('Avis néphrologie · Routine'),      chipSig: L('Routine'),
    details: { specialty: 'Néphrologie',        question: '', indication: '', priority: 'Routine', crds: '' } },
  { key: 'uro',     name: L('Urologie'),           dose: '',
    sig: L('Avis urologie · Routine'),         chipSig: L('Routine'),
    details: { specialty: 'Urologie',           question: '', indication: '', priority: 'Routine', crds: '' } },
  { key: 'gyn',     name: L('Gynécologie'),        dose: '',
    sig: L('Avis gynécologie · Routine'),      chipSig: L('Routine'),
    details: { specialty: 'Gynécologie',        question: '', indication: '', priority: 'Routine', crds: '' } },
  { key: 'ophthal', name: L('Ophtalmologie'),      dose: '',
    sig: L('Avis ophtalmologie · Routine'),    chipSig: L('Routine'),
    details: { specialty: 'Ophtalmologie',      question: '', indication: '', priority: 'Routine', crds: '' } },
];

// Unified order registry (rx / lab / img / ref) — shared search + favorites
const ORDER_DEFS = {
  rx:  { kbd: 'rx',  type: 'prescription', icon: 'pill',      glyph: '℞', verb: t('data.rxVerb.text'), emptyNoun: t('data.rxNoun.text'),
         sections: [t('data.sectionFavorites.title'), t('data.sectionRxFrequent.title'), t('data.sectionRxPhrases.title')],
         favs: RX_FAVS,  items: function () { return RX_ALL; }, search: searchRx },
  lab: { kbd: 'lab', type: 'lab',          icon: 'science',   glyph: null, verb: t('data.orderVerb.text'),  emptyNoun: t('data.labNoun.text'), multi: true,
         sections: [t('data.sectionFavorites.title'), t('data.sectionLabFrequent.title'), t('data.sectionLabOther.title')],
         favs: LAB_FAVS, items: function () { return LAB_ITEMS; }, search: function (q, favs) { return _searchList(LAB_ITEMS, favs || LAB_FAVS, q); } },
  img: { kbd: 'img', type: 'imaging',      icon: 'radiology',  glyph: null, verb: t('data.orderVerb.text'),  emptyNoun: t('data.imagingNoun.text'), multi: true,
         sections: [t('data.sectionFavorites.title'), t('data.sectionImgFrequent.title'), t('data.sectionImgOther.title')],
         favs: IMG_FAVS, items: function () { return IMG_ITEMS; }, search: function (q, favs) { return _searchList(IMG_ITEMS, favs || IMG_FAVS, q); } },
  // Recherche unifiée (profils + labo + imagerie) : un résultat peut être de
  // plusieurs natures, voir `orderKind` (searchRequests).
  req: { kbd: 'req', type: 'lab',          icon: 'lab_profile', glyph: null, verb: t('data.orderVerb.text'), emptyNoun: t('data.imagingNoun.text'), multi: true,
         sections: [t('data.sectionProfiles.title'), t('data.sectionLab.title'), t('data.sectionImaging.title')],
         favs: new Set(), items: function () { return LAB_PROFILES.concat(LAB_ITEMS.map(function (it) { return Object.assign({}, it, { orderKind: 'lab' }); }), IMG_ITEMS.map(function (it) { return Object.assign({}, it, { orderKind: 'img' }); })); }, search: searchRequests },
  ref: { kbd: 'ref', type: 'referral',     icon: 'person_add', glyph: null, verb: t('data.refVerb.text'),   emptyNoun: t('data.specialtyNoun.text'),
         sections: [t('data.sectionFavorites.title'), t('data.sectionRefFrequent.title'), t('data.sectionRefOther.title')],
         favs: REF_FAVS, items: function () { return REF_ITEMS; }, search: function (q, favs) { return _searchList(REF_ITEMS, favs || REF_FAVS, q); } },
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
// `conclusion` : gabarit de conclusion Omnimed du diagnostic — des lignes de
// texte et des ajouts proposés ({ kind, key, details? }, comme `proposals`
// dans NOTE_TEMPLATES), appliqués EN ATTENTE sous le diagnostic
// (buildConclusionBlocks, editor-schema.jsx). `mine` : le gabarit que le
// médecin s'est fait pour ce diagnostic, même forme (simulé).
const DX_CONTEXTS = [
  { key: 'itu', cim10: ['N30', 'N39.0'], snomed: ['68566005', '38822007'],
    words: ['infection urinaire', 'cystite', 'itu', 'urinary tract infection', 'cystitis', 'uti'],
    rx: ['cat-44', 'cat-46', 'cat-45'], lab: ['srum'], img: [],
    conclusion: { name: L('Infection urinaire non compliquée'),
      content: L('Plan : antibiothérapie 5 jours, hydratation.\nConsulter si fièvre ou douleur lombaire.'),
      proposals: [{ kind: 'rx', key: 'cat-44', details: { duration: '5', durationUnit: 'jours' } }, { kind: 'lab', key: 'srum' }] },
    mine: { name: L('Cystite — dose unique'),
      content: L('Plan : fosfomycine dose unique, culture d’urine.\nRevoir si symptômes persistent après 72 h.'),
      proposals: [{ kind: 'rx', key: 'cat-46' }, { kind: 'lab', key: 'srum' }] } },
  { key: 'asthme', cim10: ['J45', 'J46'], snomed: ['195967001'],
    words: ['asthme', 'asthma'],
    rx: ['vento100', 'cat-35', 'cat-37', 'cat-39'], lab: [], img: ['rxpoumon'],
    conclusion: { name: L('Asthme léger'),
      content: L('Plan : bronchodilatateur au besoin, revoir la technique d’inhalation.\nPlan d’action écrit remis.'),
      proposals: [{ kind: 'rx', key: 'vento100' }] },
    mine: { name: L('Asthme — palier 2'),
      content: L('Plan : corticostéroïde inhalé quotidien, bronchodilatateur au besoin.\nRéévaluation du contrôle dans 3 mois.'),
      proposals: [{ kind: 'rx', key: 'vento100' }, { kind: 'rx', key: 'cat-35' }] } },
  { key: 'pneumonie', cim10: ['J12', 'J13', 'J14', 'J15', 'J16', 'J17', 'J18'], snomed: ['233604007'],
    words: ['pneumonie', 'pneumonia'],
    rx: ['amox500', 'cat-48', 'cat-40'], lab: ['fsc'], img: ['rxpoumon'],
    conclusion: { name: L('Pneumonie (suspicion)'),
      content: L('Plan : radiographie pulmonaire, antibiothérapie.\nRevoir dans 48 à 72 h.'),
      proposals: [{ kind: 'img', key: 'rxpoumon' }, { kind: 'lab', key: 'fsc' }, { kind: 'rx', key: 'cat-48', details: { frequency: '' } }] } },
  { key: 'otite', cim10: ['H65', 'H66'], snomed: ['65363002'],
    words: ['otite', 'otitis'],
    rx: ['amox500', 'cat-48', 'cat-40', 'cat-41'], lab: [], img: [],
    conclusion: { name: L('Otite moyenne aiguë'),
      content: L('Plan : analgésie, antibiothérapie.\nRevoir si pas d’amélioration en 48 h.'),
      proposals: [{ kind: 'rx', key: 'amox500' }, { kind: 'rx', key: 'cat-40' }] } },
  { key: 'ivrs', cim10: ['J00', 'J01', 'J02', 'J03', 'J04', 'J05', 'J06', 'J10', 'J11'], snomed: [],
    words: ['ivrs', 'syndrome viral', 'rhume', 'grippe', 'common cold', 'viral syndrome', 'influenza', 'uri'],
    rx: ['cat-40', 'cat-41', 'cat-38'], lab: [], img: [],
    conclusion: { name: L('Syndrome viral / IVRS'),
      content: L('Plan : traitement symptomatique, hydratation, repos.\nConsulter si dyspnée ou fièvre au-delà de 5 jours.'),
      proposals: [{ kind: 'rx', key: 'cat-40' }] } },
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
// gabarit, le gabarit Omnimed. Chaque option : { id, kind, name, content,
// proposals, source, date?, author? } ; `source` signe ses ajouts en attente.
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
  if (c.mine) out.push(Object.assign({ id: 'mine', kind: 'mine', source: t('template.source.label', { name: c.mine.name }) }, c.mine));
  if (c.conclusion) out.push(Object.assign({ id: 'omnimed', kind: 'omnimed', source: t('template.source.label', { name: c.conclusion.name }) }, c.conclusion));
  return out;
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
  if (kind === 'req') {
    return pick('lab').map(function (it) { return Object.assign({}, it, { orderKind: 'lab' }); })
      .concat(pick('img').map(function (it) { return Object.assign({}, it, { orderKind: 'img' }); }));
  }
  if (!ORDER_DEFS[kind] || !c[kind]) return [];
  const favs = ORDER_DEFS[kind].favs;
  const list = pick(kind);
  return list.filter(function (it) { return favs.has(it.key); }).concat(list.filter(function (it) { return !favs.has(it.key); }));
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
  specialty: ['Cardiologie', 'Orthopédie', 'Dermatologie', 'Gastroentérologie', 'Neurologie', 'Pneumologie',
    'Rhumatologie', 'Endocrinologie', 'Néphrologie', 'Urologie', 'Gynécologie', 'Ophtalmologie', 'ORL',
    'Chirurgie générale', 'Chirurgie vasculaire', 'Hématologie', 'Oncologie', 'Psychiatrie', 'Gériatrie', 'Médecine interne'],
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
  'Médecine interne': L('Médecine interne')
};
function valueLabel(v) { return Object.prototype.hasOwnProperty.call(VALUE_LABEL, v) ? VALUE_LABEL[v] : v; }

// Profils de laboratoire : un raccourci qui commande plusieurs analyses du
// catalogue (rencontre inline entity, Antoine Cloutier). Choisir un profil ne
// crée rien d'office : ses analyses arrivent dans une seule puce labo, et
// chacune se retire dans le formulaire. Contenu d'exemple, à valider (ID-09).
const LAB_PROFILES = [
  { key: 'prof-diabete', name: L('Profil diabète'), labKeys: ['hba1c', 'glyc', 'creat', 'lipide'] },
  { key: 'prof-annuel', name: L('Bilan annuel'), labKeys: ['fsc', 'glyc', 'lipide', 'creat', 'tsh'] },
  { key: 'prof-anemie', name: L('Bilan anémie'), labKeys: ['fsc', 'ferritine', 'b12'] },
].map(function (p) {
  const items = p.labKeys.map(function (k) { return LAB_ITEMS.find(function (it) { return it.key === k; }); }).filter(Boolean);
  const tests = [];
  items.forEach(function (it) { (it.details.tests || []).forEach(function (t) { if (tests.indexOf(t) < 0) tests.push(t); }); });
  return { key: p.key, name: p.name, dose: '', profile: true, orderKind: 'lab',
    sig: tn('data.profileSig.text', tests.length, { tests: tests.join(', ') }),
    details: { tests: tests, priority: 'Routine', fasting: items.some(function (it) { return it.details.fasting; }), context: '', profile: p.name } };
});

// Recherche unifiée des requêtes (/req) : profils, analyses et examens
// d'imagerie dans une seule liste, en trois sections (mêmes clés que les
// autres recherches, pour RxMenu). Chaque résultat porte son `orderKind`.
function searchRequests(q) {
  const tag = function (kind) { return function (it) { return Object.assign({}, it, { orderKind: kind }); }; };
  const nq = _norm((q || '').trim());
  const match = function (it) { return !nq || _hay(it.name).includes(nq) || _hay(it.sig || '').includes(nq); };
  const lab = _searchList(LAB_ITEMS, LAB_FAVS, q), img = _searchList(IMG_ITEMS, IMG_FAVS, q);
  const firstOf = function (r) { return r.favoris.concat(r.frequents, r.autres); };
  return {
    favoris: LAB_PROFILES.filter(match),
    frequents: firstOf(lab).map(tag('lab')),
    autres: firstOf(img).map(tag('img'))
  };
}

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
// que rien n'est tapé, la liste montre seulement le contexte du diagnostic
// (`contexte`, `contextName`). Au premier caractère, ou sur un filtre du rail
// /rx, c'est une recherche normale.
function searchOrder(kind, q, dx) {
  const d = ORDER_DEFS[kind];
  if (!d) return { favoris: [], frequents: [], autres: [] };
  if (dx && !(q || '').trim() && (kind !== 'rx' || _rxFilter === 'tout')) {
    const ctx = contextResultsFor(dx, kind);
    if (ctx.length) return { contexte: ctx, contextName: dx.name, profil: [], favoris: [], frequents: [], autres: [] };
  }
  if (!_favFreeze[kind]) _favFreeze[kind] = new Set(d.favs);
  const r = d.search(q, _favFreeze[kind]);
  return kind === 'rx' ? applyRxFilter(r, _rxFilter) : r;
}
function endOrderSearch() { _favFreeze = {}; _rxFilter = 'tout'; }
// Compteurs du rail avec les favoris figés de la recherche en cours.
function rxCounts(q) { return rxFilterCounts(q, _favFreeze.rx || ORDER_DEFS.rx.favs); }
function toggleOrderFav(kind, key) { const d = ORDER_DEFS[kind]; if (d) { d.favs.has(key) ? d.favs.delete(key) : d.favs.add(key); } }

// Regenerate the rich-chip payload after a popover edit (lab / imaging)
function deriveLabRx(d) {
  const name = (d.tests && d.tests.length) ? d.tests.join(', ') : t('schema.labRequest.text');
  const sig = [d.fasting ? t('schema.fasting.text') : '', valueLabel(d.priority)].filter(Boolean).join(' · ');
  return { name: name, dose: '', sig: sig, kind: 'lab' };
}
function deriveImgRx(d) {
  const name = [valueLabel(d.modality), valueLabel(d.region)].filter(Boolean).join(' ') || t('data.imagingRequest.text');
  const sig = [d.contrast && d.contrast !== 'Sans' ? t('data.withContrast.text') : '', valueLabel(d.views), valueLabel(d.priority)].filter(Boolean).join(' · ');
  return { name: name, dose: '', sig: sig, kind: 'img' };
}
function deriveRefRx(d) {
  const name = valueLabel(d.specialty) || t('data.referralSpecialist.text');
  const sig = valueLabel(d.priority || 'Routine');
  return { name: name, dose: '', sig: sig, kind: 'ref' };
}

// Suggestions de médicaments en prose DÉSACTIVÉES : les suggestions
// n'apparaissent désormais que via la fonction « /rx ». Avec le catalogue
// élargi, des mots courants (« mo », « me », « na »…) déclenchaient le menu
// pendant la frappe normale. Pour réactiver, rétablir le recognizer ci-dessous
// (idéalement avec un préfixe minimal de 4+ lettres).
const RECOGNIZERS = [];

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
  { key: 'requests', section: L('Fonctions'), icon: 'lab_profile', title: L('Requêtes'), desc: L('Labo, imagerie et profils — plusieurs à la fois'), kbd: 'req',
    orderSearch: true },
  { key: 'imaging', section: L('Fonctions'), icon: 'radiology', title: L('Imagerie'), desc: L('Radio, écho, TDM'), kbd: 'img',
    orderSearch: true,
    template: { type: 'imaging', label: L("Demande d'imagerie"), text: L("Demande d'imagerie"),
      details: { modality: 'Radiographie', region: '', views: '', priority: 'Routine', context: '', contrast: 'Sans' } } },
  { key: 'referral', section: L('Fonctions'), icon: 'person_add', title: L('Référence spécialiste'), desc: L('Cardio, ortho, derm…'), kbd: 'ref',
    orderSearch: true,
    template: { type: 'referral', label: L('Référence spécialiste'), text: L('Référence spécialiste'),
      details: { specialty: '', question: '', indication: '', priority: 'Routine', crds: '' } } },
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
    key: 'periodique', name: L('Examen périodique'),
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

const PATIENT = {
  initials: 'GT',
  name: 'Geneviève Tremblay',
  age: L('38 ans'),
  sex: 'F',
  dob: L('03 mai 1987'),
  ramq: 'TREG 8705 0301',
  phone: '514 555 0184',
  reason: L('Otite moyenne aiguë'),
  status: L('En consultation'),
};

const VITALS = [
  { ic: 'thermostat',    lbl: L('Température'), val: '38,1 °C' },
  { ic: 'favorite',      lbl: L('FC'),            val: '84 bpm' },
  { ic: 'monitor_heart', lbl: L('TA'),            val: '118/72' },
  { ic: 'air',           lbl: L('SpO₂'),     val: '98 %' },
  { ic: 'scale',         lbl: L('Poids'),         val: '64 kg' },
];

const RESULTS_RECENT = [
  { id: 'r1', ttl: L('FSC — 17 mars 2026'), meta: L('Hb 128 g/L · Leuco 9,2'), sev: 'ok', sevLbl: L('Normal') },
  { id: 'r2', ttl: L('TSH — 12 janv 2026'), meta: L('2,1 mUI/L'), sev: 'ok', sevLbl: L('Normal') },
];

const SCENARIOS = [
  { key: 'empty',  name: L('Note vierge'), desc: L('Commencer à zéro'),
    detail: '', conclusion: '', hint: null },
  { key: 'rx',     name: L('Démo — prescription'), desc: L('Tapez « mét » pour voir la liste'),
    detail: L("Motif de consultation\nPatiente enceinte de 22 sem consulte pour otalgie droite depuis 48 h, accompagnée d'un écoulement clair intermittent et d'une sensation d'oreille bouchée. Pas de vertiges, pas d'acouphènes, pas de fièvre frissonnante.\n\nAntécédents\nAsthme léger bien contrôlé sous Ventolin PRN. Grossesse actuelle sans complication, suivie en GARE. Allergie légère à la pénicilline documentée en 2019 — éruption maculopapuleuse seulement, pas d'œdème ni d'urticaire.\n\nExamen physique\nTempérature 38,1 °C, TA 118/72, FC 84 régulière, SpO₂ 98 % à l'air ambiant. Patiente alerte, confortable.\nOtoscopie droite : tympan bombé, érythémateux, opaque, perte du triangle lumineux. Otoscopie gauche : tympan nacré, mobile à l'insufflation, reliefs normaux.\nAuscultation pulmonaire claire, pas de râles ni de sibilances. Pharynx sans érythème. Adénopathies cervicales non palpables.\n\nRevue des systèmes\nPas de céphalées, pas de nausées, pas d'éruption cutanée. Mouvements fœtaux perçus, pas de contractions.."),
    conclusion: L('Impression\nInfection bactérienne — plan de traitement à venir.\n\nPlan\nAntibiothérapie: mét'),
    hint: L('Le curseur est placé après « mét ». Continuez à taper pour filtrer la liste. ↑ ↓ pour naviguer, Entrée / Tab pour choisir.') },
  { key: 'composed', name: L('Note avancée'), desc: L('Plusieurs items confirmés'),
    detail: L('Bilan annuel. HTA et dyslipidémie suivis. Pas de plainte.\nTA 138/86, FC 72 rég. Auscultation normale.'),
    conclusion: L('Bilan stable. Renouvellement atorvastatine. Bilan lipidique annuel à jeun. Suivi 3 mois.'),
    preChips: [
      { slot: 'conclusion', entity: { type: 'prescription', label: L('Atorvastatine 20 mg'),
        text: L('Atorvastatine 20 mg — HS × 90 jours'),
        details: { molecule: L('Atorvastatine'), dose: '20', unit: 'mg', form: 'comprimé',
          route: 'PO', frequency: 'HS', duration: '90', durationUnit: 'jours',
          quantity: '90', refills: '3', indication: L('Dyslipidémie'), notes: L('Surveiller CK.') } } },
      { slot: 'conclusion', entity: { type: 'lab', label: L('Bilan lipidique'),
        text: L('Bilan lipidique + ALT + créat'),
        details: { tests: [L('Chol total'), L('HDL'), L('LDL'), L('TG'), L('ALT'), L('Créat')], priority: 'Routine',
          fasting: true, context: L('Suivi statine'), collection: L('Au CH') } } },
    ],
    hint: L('Cliquez sur un chip pour modifier les détails.') },
];

// Gabarits de note suggérés selon la raison de consultation (colonne de
// suggestions, rencontre vision 2026-10-27) : mots de la raison, dans les deux
// langues, qui appellent chaque gabarit. Au plus `max` gabarits, dans l'ordre
// de NOTE_TEMPLATES. Contenu SIMULÉ, à valider.
const TEMPLATE_REASON_WORDS = {
  virus: ['rhume', 'toux', 'fievre', 'gorge', 'congestion', 'ivrs', 'grippe', 'viral', 'cold', 'cough', 'fever', 'throat', 'flu'],
  itu: ['urinaire', 'urinaires', 'urine', 'brulure', 'brulures', 'mictionnelle', 'mictionnelles', 'dysurie', 'cystite', 'urinary', 'burning', 'dysuria', 'cystitis'],
  periodique: ['periodique', 'annuel', 'bilan', 'periodic', 'annual', 'checkup', 'physical'],
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
const VISIT_APPOINTMENT = { time: '08:30', type: L('Sans rendez-vous'), reason: L('Brûlures mictionnelles depuis 3 jours'), bookedBy: L('Prise par la réception') };
const RESULTS_TO_FOLLOW = [
  { id: 'res-a1c', name: L('HbA1c'), value: L('6,4 %'), flag: L('À la limite'), date: L('20 octobre 2026') },
];

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

window.NOTE_DATA = { ENTITY_TYPES, RECOGNIZERS, MED_CATALOG, SLASH_ITEMS, NOTE_TEMPLATES, PATIENT, VITALS, RESULTS_RECENT, SCENARIOS,
  RX_FAVS, RX_ITEMS, PATIENT_MEDS, MED_STATUS_LABEL, medActions, medStatusText, defaultMedAction, summaryAddDetail,
  medDoseStep, adjustMedDose, RX_FILTERS, setRxFilter, getRxFilter, rxCounts, rxFilterCounts, applyRxFilter, searchRx, toggleRxFav, deriveRx,
  ORDER_DEFS, orderKindForKbd, searchOrder, endOrderSearch, toggleOrderFav, deriveLabRx, deriveImgRx, deriveRefRx,
  LAB_PROFILES, searchRequests, FIELD_OPTIONS, valueLabel, AI_SAMPLE_PROPOSALS, DX_CONTEXTS, dxContextFor, contextResultsFor, templatesForReason,
  dxConclusionOptions, noteDayLabel, templateWithoutTool,
  VISIT_APPOINTMENT, RESULTS_TO_FOLLOW, visitStartPoints, startTemplatesFor, visitReason };
