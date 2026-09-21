// =========================================================
// data.jsx — scenarios + entity registry (FR-CA)
// =========================================================
const ENTITY_TYPES = {
  prescription: { key: 'prescription', label: 'Prescription', icon: 'pill', summaryGroup: 'Médications' },
  lab:          { key: 'lab',          label: 'Laboratoire',  icon: 'science', summaryGroup: 'Résultats' },
  imaging:      { key: 'imaging',      label: 'Imagerie',     icon: 'radiology', summaryGroup: 'Résultats' },
  problem:      { key: 'problem',      label: 'Problème', icon: 'flag', summaryGroup: 'Problèmes' },
  instructions: { key: 'instructions', label: 'Consignes',    icon: 'menu_book', summaryGroup: 'Consignes' },
  diagnostic:   { key: 'diagnostic',   label: 'Diagnostic',   icon: 'local_hospital', summaryGroup: 'Diagnostics' },
  file:         { key: 'file',         label: 'Fichier',       icon: 'attach_file',    summaryGroup: 'Fichiers' },
  referral:     { key: 'referral',     label: 'Référence',     icon: 'person_add',     summaryGroup: 'Références' },
};

// MED_CATALOG — catalogue de recherche /rx (source : medicaments.json, 50 entrées)
const MED_CATALOG = [
  { stem: 'atorvastatine', brand: 'Lipitor', klass: 'Hypolipemiant', din: '02230711',
    text: 'Atorvastatine 20 mg — 1 co DIE HS',
    label: 'Atorvastatine 20 mg',
    details: { molecule: 'Atorvastatine', dose: '20', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'DIE', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: 'Hypolipemiant' } },
  { stem: 'rosuvastatine', brand: 'Crestor', klass: 'Hypolipemiant', din: '02265325',
    text: 'Rosuvastatine 10 mg — 1 co DIE',
    label: 'Rosuvastatine 10 mg',
    details: { molecule: 'Rosuvastatine', dose: '10', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'DIE', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: 'Hypolipemiant' } },
  { stem: 'amlodipine', brand: 'Norvasc', klass: 'Antihypertenseur', din: '00878928',
    text: 'Amlodipine 5 mg — 1 co DIE',
    label: 'Amlodipine 5 mg',
    details: { molecule: 'Amlodipine', dose: '5', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'DIE', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: 'Antihypertenseur' } },
  { stem: 'ramipril', brand: 'Altace', klass: 'IECA', din: '02221829',
    text: 'Ramipril 5 mg — 1 caps DIE',
    label: 'Ramipril 5 mg',
    details: { molecule: 'Ramipril', dose: '5', unit: 'mg', form: 'gélule', route: 'PO',
      frequency: 'DIE', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: 'IECA' } },
  { stem: 'perindopril', brand: 'Coversyl', klass: 'IECA', din: '02246624',
    text: 'Perindopril 4 mg — 1 co DIE',
    label: 'Perindopril 4 mg',
    details: { molecule: 'Perindopril', dose: '4', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'DIE', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: 'IECA' } },
  { stem: 'losartan', brand: 'Cozaar', klass: 'ARA', din: '02182446',
    text: 'Losartan 50 mg — 1 co DIE',
    label: 'Losartan 50 mg',
    details: { molecule: 'Losartan', dose: '50', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'DIE', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: 'ARA' } },
  { stem: 'hydrochlorothiazide', brand: 'HydroDIURIL', klass: 'Diuretique thiazidique', din: '00021474',
    text: 'Hydrochlorothiazide 25 mg — 1 co DIE AM',
    label: 'Hydrochlorothiazide 25 mg',
    details: { molecule: 'Hydrochlorothiazide', dose: '25', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'DIE', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: 'Diuretique thiazidique' } },
  { stem: 'furosemide', brand: 'Lasix', klass: 'Diuretique de l\'anse', din: '02224561',
    text: 'Furosemide 40 mg — 1 co DIE AM',
    label: 'Furosemide 40 mg',
    details: { molecule: 'Furosemide', dose: '40', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'DIE', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: 'Diuretique de l\'anse' } },
  { stem: 'metoprolol', brand: 'Lopresor', klass: 'Betabloquant', din: '00397423',
    text: 'Metoprolol 50 mg — 1 co BID',
    label: 'Metoprolol 50 mg',
    details: { molecule: 'Metoprolol', dose: '50', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'BID', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: 'Betabloquant' } },
  { stem: 'bisoprolol', brand: 'Monocor', klass: 'Betabloquant', din: '02267964',
    text: 'Bisoprolol 5 mg — 1 co DIE',
    label: 'Bisoprolol 5 mg',
    details: { molecule: 'Bisoprolol', dose: '5', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'DIE', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: 'Betabloquant' } },
  { stem: 'apixaban', brand: 'Eliquis', klass: 'Anticoagulant', din: '02397754',
    text: 'Apixaban 5 mg — 1 co BID',
    label: 'Apixaban 5 mg',
    details: { molecule: 'Apixaban', dose: '5', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'BID', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: 'Anticoagulant' } },
  { stem: 'rivaroxaban', brand: 'Xarelto', klass: 'Anticoagulant', din: '02385360',
    text: 'Rivaroxaban 20 mg — 1 co DIE c. repas',
    label: 'Rivaroxaban 20 mg',
    details: { molecule: 'Rivaroxaban', dose: '20', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'DIE', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: 'Anticoagulant' } },
  { stem: 'warfarine', brand: 'Coumadin', klass: 'Anticoagulant', din: '02016330',
    text: 'Warfarine 5 mg — selon INR',
    label: 'Warfarine 5 mg',
    details: { molecule: 'Warfarine', dose: '5', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: '', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: 'Anticoagulant' } },
  { stem: 'acide acetylsalicylique', brand: 'Aspirin', klass: 'Antiplaquettaire', din: '02242881',
    text: 'Acide acetylsalicylique 81 mg — 1 co DIE',
    label: 'Acide acetylsalicylique 81 mg',
    details: { molecule: 'Acide acetylsalicylique', dose: '81', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'DIE', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: 'Antiplaquettaire' } },
  { stem: 'clopidogrel', brand: 'Plavix', klass: 'Antiplaquettaire', din: '02238682',
    text: 'Clopidogrel 75 mg — 1 co DIE',
    label: 'Clopidogrel 75 mg',
    details: { molecule: 'Clopidogrel', dose: '75', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'DIE', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: 'Antiplaquettaire' } },
  { stem: 'metformine', brand: 'Glucophage', klass: 'Antidiabetique', din: '02099233',
    text: 'Metformine 500 mg — 1 co BID c. repas',
    label: 'Metformine 500 mg',
    details: { molecule: 'Metformine', dose: '500', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'BID', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: 'Antidiabetique' } },
  { stem: 'gliclazide', brand: 'Diamicron MR', klass: 'Antidiabetique (sulfonyluree)', din: '02229453',
    text: 'Gliclazide 30 mg — 1 co DIE AM',
    label: 'Gliclazide 30 mg',
    details: { molecule: 'Gliclazide', dose: '30', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'DIE', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: 'Antidiabetique (sulfonyluree)' } },
  { stem: 'empagliflozine', brand: 'Jardiance', klass: 'Antidiabetique (iSGLT2)', din: '02443015',
    text: 'Empagliflozine 10 mg — 1 co DIE',
    label: 'Empagliflozine 10 mg',
    details: { molecule: 'Empagliflozine', dose: '10', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'DIE', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: 'Antidiabetique (iSGLT2)' } },
  { stem: 'empagliflozine', brand: 'Ozempic', klass: 'Antidiabetique (GLP-1)', din: '02471471',
    text: 'Empagliflozine 0.5 mg/dose — 1 inj SC q sem',
    label: 'Empagliflozine 0.5 mg/dose',
    details: { molecule: 'Empagliflozine', dose: '0.5', unit: 'mg/dose', form: 'stylo', route: 'SC',
      frequency: '1× / semaine', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: 'Antidiabetique (GLP-1)' } },
  { stem: 'insuline glargine', brand: 'Lantus', klass: 'Insuline', din: '02245689',
    text: 'Insuline glargine 100 U/mL — selon protocole',
    label: 'Insuline glargine 100 U/mL',
    details: { molecule: 'Insuline glargine', dose: '100', unit: 'U/mL', form: 'stylo', route: 'SC',
      frequency: '', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: 'Insuline' } },
  { stem: 'pantoprazole', brand: 'Pantoloc', klass: 'IPP', din: '02241804',
    text: 'Pantoprazole 40 mg — 1 co DIE AC',
    label: 'Pantoprazole 40 mg',
    details: { molecule: 'Pantoprazole', dose: '40', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'DIE', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: 'IPP' } },
  { stem: 'omeprazole', brand: 'Losec', klass: 'IPP', din: '02245058',
    text: 'Omeprazole 20 mg — 1 caps DIE AC',
    label: 'Omeprazole 20 mg',
    details: { molecule: 'Omeprazole', dose: '20', unit: 'mg', form: 'gélule', route: 'PO',
      frequency: 'DIE', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: 'IPP' } },
  { stem: 'esomeprazole', brand: 'Nexium', klass: 'IPP', din: '02244520',
    text: 'Esomeprazole 40 mg — 1 co DIE AC',
    label: 'Esomeprazole 40 mg',
    details: { molecule: 'Esomeprazole', dose: '40', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'DIE', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: 'IPP' } },
  { stem: 'ranitidine', brand: 'Zantac', klass: 'Anti-H2', din: '00828173',
    text: 'Ranitidine 150 mg — 1 co BID',
    label: 'Ranitidine 150 mg',
    details: { molecule: 'Ranitidine', dose: '150', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'BID', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: 'Anti-H2' } },
  { stem: 'levothyroxine', brand: 'Synthroid', klass: 'Hormone thyroidienne', din: '00036765',
    text: 'Levothyroxine 50 mcg — 1 co DIE a jeun',
    label: 'Levothyroxine 50 mcg',
    details: { molecule: 'Levothyroxine', dose: '50', unit: 'mcg', form: 'comprimé', route: 'PO',
      frequency: 'DIE', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: 'Hormone thyroidienne' } },
  { stem: 'sertraline', brand: 'Zoloft', klass: 'ISRS', din: '02132503',
    text: 'Sertraline 50 mg — 1 co DIE',
    label: 'Sertraline 50 mg',
    details: { molecule: 'Sertraline', dose: '50', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'DIE', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: 'ISRS' } },
  { stem: 'escitalopram', brand: 'Cipralex', klass: 'ISRS', din: '02273123',
    text: 'Escitalopram 10 mg — 1 co DIE',
    label: 'Escitalopram 10 mg',
    details: { molecule: 'Escitalopram', dose: '10', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'DIE', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: 'ISRS' } },
  { stem: 'citalopram', brand: 'Celexa', klass: 'ISRS', din: '02239607',
    text: 'Citalopram 20 mg — 1 co DIE',
    label: 'Citalopram 20 mg',
    details: { molecule: 'Citalopram', dose: '20', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'DIE', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: 'ISRS' } },
  { stem: 'venlafaxine', brand: 'Effexor XR', klass: 'IRSN', din: '02237279',
    text: 'Venlafaxine 75 mg — 1 caps DIE',
    label: 'Venlafaxine 75 mg',
    details: { molecule: 'Venlafaxine', dose: '75', unit: 'mg', form: 'gélule', route: 'PO',
      frequency: 'DIE', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: 'IRSN' } },
  { stem: 'bupropion', brand: 'Wellbutrin XL', klass: 'Antidepresseur', din: '02275940',
    text: 'Bupropion 150 mg — 1 co DIE AM',
    label: 'Bupropion 150 mg',
    details: { molecule: 'Bupropion', dose: '150', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'DIE', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: 'Antidepresseur' } },
  { stem: 'trazodone', brand: 'Desyrel', klass: 'Antidepresseur / hypnotique', din: '00711934',
    text: 'Trazodone 50 mg — 1 co HS PRN',
    label: 'Trazodone 50 mg',
    details: { molecule: 'Trazodone', dose: '50', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'HS PRN', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: 'Antidepresseur / hypnotique' } },
  { stem: 'lorazepam', brand: 'Ativan', klass: 'Benzodiazepine', din: '00655740',
    text: 'Lorazepam 1 mg — 1 co HS PRN',
    label: 'Lorazepam 1 mg',
    details: { molecule: 'Lorazepam', dose: '1', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'HS PRN', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: 'Benzodiazepine' } },
  { stem: 'zopiclone', brand: 'Imovane', klass: 'Hypnotique', din: '02172169',
    text: 'Zopiclone 7.5 mg — 1 co HS PRN',
    label: 'Zopiclone 7.5 mg',
    details: { molecule: 'Zopiclone', dose: '7.5', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'HS PRN', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: 'Hypnotique' } },
  { stem: 'gabapentine', brand: 'Neurontin', klass: 'Anticonvulsivant / neuropathique', din: '02239717',
    text: 'Gabapentine 300 mg — 1 caps TID',
    label: 'Gabapentine 300 mg',
    details: { molecule: 'Gabapentine', dose: '300', unit: 'mg', form: 'gélule', route: 'PO',
      frequency: 'TID', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: 'Anticonvulsivant / neuropathique' } },
  { stem: 'salbutamol', brand: 'Ventolin', klass: 'Bronchodilatateur (BACA)', din: '02232570',
    text: 'Salbutamol 100 mcg/dose — 1-2 inh PRN',
    label: 'Salbutamol 100 mcg/dose',
    details: { molecule: 'Salbutamol', dose: '100', unit: 'mcg/dose', form: 'aérosol-doseur', route: 'Inhalé',
      frequency: 'PRN', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: 'Bronchodilatateur (BACA)' } },
  { stem: 'fluticasone/salmeterol', brand: 'Advair', klass: 'CSI + BALA', din: '02240835',
    text: 'Fluticasone/Salmeterol 250/50 mcg — 1 inh BID',
    label: 'Fluticasone/Salmeterol 250/50 mcg',
    details: { molecule: 'Fluticasone/Salmeterol', dose: '250/50', unit: 'mcg', form: 'aérosol-doseur', route: 'Inhalé',
      frequency: 'BID', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: 'CSI + BALA' } },
  { stem: 'tiotropium', brand: 'Spiriva', klass: 'Anticholinergique (MPOC)', din: '02246793',
    text: 'Tiotropium 18 mcg — 1 inh DIE',
    label: 'Tiotropium 18 mcg',
    details: { molecule: 'Tiotropium', dose: '18', unit: 'mcg', form: 'aérosol-doseur', route: 'Inhalé',
      frequency: 'DIE', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: 'Anticholinergique (MPOC)' } },
  { stem: 'montelukast', brand: 'Singulair', klass: 'Antileucotriene', din: '02238217',
    text: 'Montelukast 10 mg — 1 co DIE HS',
    label: 'Montelukast 10 mg',
    details: { molecule: 'Montelukast', dose: '10', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'DIE', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: 'Antileucotriene' } },
  { stem: 'cetirizine', brand: 'Reactine', klass: 'Antihistaminique', din: '02238934',
    text: 'Cetirizine 10 mg — 1 co DIE PRN',
    label: 'Cetirizine 10 mg',
    details: { molecule: 'Cetirizine', dose: '10', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'DIE PRN', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: 'Antihistaminique' } },
  { stem: 'prednisone', brand: 'Winpred', klass: 'Corticosteroide', din: '00021695',
    text: 'Prednisone 5 mg — selon schema degressif',
    label: 'Prednisone 5 mg',
    details: { molecule: 'Prednisone', dose: '5', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: '', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: 'Corticosteroide' } },
  { stem: 'acetaminophene', brand: 'Tylenol', klass: 'Analgesique', din: '00559407',
    text: 'Acetaminophene 500 mg — 1-2 co QID PRN',
    label: 'Acetaminophene 500 mg',
    details: { molecule: 'Acetaminophene', dose: '500', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'QID PRN', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: 'Analgesique' } },
  { stem: 'ibuprofene', brand: 'Advil', klass: 'AINS', din: '02240333',
    text: 'Ibuprofene 400 mg — 1 co TID PRN c. repas',
    label: 'Ibuprofene 400 mg',
    details: { molecule: 'Ibuprofene', dose: '400', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'TID PRN', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: 'AINS' } },
  { stem: 'naproxene', brand: 'Naprosyn', klass: 'AINS', din: '02246699',
    text: 'Naproxene 500 mg — 1 co BID c. repas',
    label: 'Naproxene 500 mg',
    details: { molecule: 'Naproxene', dose: '500', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'BID', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: 'AINS' } },
  { stem: 'vitamine d', brand: 'D-Tabs', klass: 'Supplement', din: '02248860',
    text: 'Vitamine D 1000 UI — 1 co DIE',
    label: 'Vitamine D 1000 UI',
    details: { molecule: 'Vitamine D', dose: '1000', unit: 'UI', form: 'comprimé', route: 'PO',
      frequency: 'DIE', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: '', notes: 'Supplement' } },
  { stem: 'nitrofurantoine', brand: 'Macrobid', klass: 'Antibiotique', din: '02182780',
    text: 'Nitrofurantoine 100 mg — 1 caps BID x 5 j',
    label: 'Nitrofurantoine 100 mg',
    details: { molecule: 'Nitrofurantoine', dose: '100', unit: 'mg', form: 'gélule', route: 'PO',
      frequency: 'BID', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: 'Cystite non compliquee', notes: 'Antibiotique' } },
  { stem: 'trimethoprime-sulfamethoxazole', brand: 'Septra DS', klass: 'Antibiotique', din: '00445282',
    text: 'Trimethoprime-sulfamethoxazole 800/160 mg — 1 co BID x 3 j',
    label: 'Trimethoprime-sulfamethoxazole 800/160 mg',
    details: { molecule: 'Trimethoprime-sulfamethoxazole', dose: '800/160', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'BID', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: 'Cystite non compliquee', notes: 'Antibiotique' } },
  { stem: 'fosfomycine', brand: 'Monurol', klass: 'Antibiotique', din: '02244360',
    text: 'Fosfomycine 3 g — 1 sachet, dose unique',
    label: 'Fosfomycine 3 g',
    details: { molecule: 'Fosfomycine', dose: '3', unit: 'g', form: 'sachet', route: 'PO',
      frequency: '', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: 'Cystite non compliquee', notes: 'Antibiotique' } },
  { stem: 'ciprofloxacine', brand: 'Cipro', klass: 'Antibiotique', din: '02229521',
    text: 'Ciprofloxacine 500 mg — 1 co BID x 7 j',
    label: 'Ciprofloxacine 500 mg',
    details: { molecule: 'Ciprofloxacine', dose: '500', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'BID', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: 'Pyelonephrite / UTI compliquee', notes: 'Antibiotique' } },
  { stem: 'amoxicilline-clavulanate', brand: 'Clavulin', klass: 'Antibiotique', din: '02238829',
    text: 'Amoxicilline-clavulanate 875/125 mg — 1 co BID x 7 j',
    label: 'Amoxicilline-clavulanate 875/125 mg',
    details: { molecule: 'Amoxicilline-clavulanate', dose: '875/125', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'BID', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: 'UTI compliquee', notes: 'Antibiotique' } },
  { stem: 'cephalexine', brand: 'Keflex', klass: 'Antibiotique', din: '00583413',
    text: 'Cephalexine 500 mg — 1 caps QID x 7 j',
    label: 'Cephalexine 500 mg',
    details: { molecule: 'Cephalexine', dose: '500', unit: 'mg', form: 'gélule', route: 'PO',
      frequency: 'QID', duration: '', durationUnit: '', quantity: '', refills: '',
      indication: 'UTI (grossesse, alternative)', notes: 'Antibiotique' } }
];

function _norm(s) { return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }

// =========================================================
// Rx search — commande « /rx » (favoris, fréquents, autres)
// =========================================================
const RX_FAVS = new Set(['amox500', 'vento100']);

const RX_ITEMS = [
  { key: 'amox500', name: 'Amoxicilline', dose: '500mg',
    sig: '1 comp. PO TID, #21, 7j, R0',
    chipSig: '1 comp. PO TID #21 7j R0',
    details: { molecule: 'Amoxicilline', dose: '500', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'TID', duration: '7', durationUnit: 'jours', quantity: '21', refills: '0',
      indication: 'Otite moyenne aiguë', notes: 'Prendre avec nourriture.',
      pedsDosing: { mgPerKg: 15, maxMgPerDose: 500, freq: 'TID (q8h)' } } },
  { key: 'vento100', name: 'Ventolin', dose: '100mcg',
    sig: '2 inh. q4-6h PRN, R5',
    chipSig: '2 inh q4-6h PRN R5',
    details: { molecule: 'Salbutamol (Ventolin)', dose: '100', unit: 'mcg/inh', form: 'aérosol-doseur', route: 'Inhalé',
      frequency: 'q4-6h PRN', duration: '', durationUnit: '', quantity: '1 inhalateur', refills: '5',
      indication: 'Bronchospasme', notes: 'Avec aérochambre.' } },
];

function _cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

// Nombre d'unités par prise (modale « Dose ») + abréviation de forme → « 2 comp. »
function _rxQty(d) {
  const n = (d.qtyDose && /^\d/.test(String(d.qtyDose))) ? String(d.qtyDose) : (d.form === 'aérosol-doseur' ? '2' : '1');
  const ab = d.form === 'comprimé' ? 'comp.' : d.form === 'aérosol-doseur' ? 'inh' : d.form === 'gélule' ? 'gél' : d.form === 'capsule' ? 'caps.' : 'dose';
  return n + ' ' + ab;
}
function _rxFreq(d) {
  return (d.frequency || '') + (d.prn && !/prn/i.test(d.frequency || '') ? ' PRN' : '');
}
function deriveRxSig(d) {
  const dur = d.duration && d.duration !== '—'
    ? d.duration + (d.durationUnit === 'jours' || !d.durationUnit ? 'j' : ' ' + d.durationUnit)
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
// Affichées en tête du menu /rx pour renouvellement / référence.
const PATIENT_MEDS = [
  { key: 'med-contraceptif', name: 'Contraceptif oral', dose: '', med: true, medStatus: 'active', medStatusLabel: 'actif',
    sig: '1 co PO DIE',
    chipSig: '1 co PO DIE',
    details: { molecule: 'Contraceptif oral', dose: '', unit: '', form: 'comprimé', route: 'PO',
      frequency: 'DIE', duration: '', durationUnit: '', quantity: '', refills: '11',
      indication: 'Contraception', notes: 'Profil actif au dossier.' } },
  { key: 'med-nitrofurantoine', name: 'Nitrofurantoïne', dose: '100 mg', med: true, medStatus: 'cessée', medStatusLabel: 'cessée (ITU)',
    sig: '1 co PO BID',
    chipSig: '1 co PO BID',
    details: { molecule: 'Nitrofurantoïne', dose: '100', unit: 'mg', form: 'comprimé', route: 'PO',
      frequency: 'BID', duration: '5', durationUnit: 'jours', quantity: '10', refills: '0',
      indication: 'Infection urinaire', notes: 'Cessée 12/2025.' } },
];

function searchRx(q) {
  const nq = _norm((q || '').trim());
  const match = function (it) {
    if (!nq) return true;
    if (_norm(it.name).includes(nq)) return true;
    if (it.brand && _norm(it.brand).includes(nq)) return true;
    if (it.klass && _norm(it.klass).includes(nq)) return true;
    if (it.din && /\d/.test(nq) && it.din.includes(nq.replace(/\D/g, ''))) return true;
    return false;
  };
  const profilAll = PATIENT_MEDS.filter(match);
  const profil = profilAll.filter(function (it) { return !it.med || it.medStatus === 'active'; });
  const profilCeased = profilAll.filter(function (it) { return it.med && it.medStatus !== 'active'; });
  const favoris = RX_ALL.filter(function (it) { return RX_FAVS.has(it.key) && match(it); });
  const frequents = RX_ALL.filter(function (it) { return it.freq && !RX_FAVS.has(it.key) && match(it); });
  const autres = nq
    ? RX_ALL.filter(function (it) { return !it.freq && !RX_FAVS.has(it.key) && match(it); }).slice(0, 6)
    : [];
  return { profil, profilCeased, favoris, frequents, autres };
}

function toggleRxFav(key) { RX_FAVS.has(key) ? RX_FAVS.delete(key) : RX_FAVS.add(key); }

// =========================================================
// Laboratoire — commande « /lab » (mêmes sections que /rx)
// =========================================================
const LAB_FAVS = new Set(['fsc', 'lipide']);
const LAB_ITEMS = [
  { key: 'fsc', name: 'FSC', dose: '',
    sig: 'Formule sanguine complète · Routine',
    chipSig: 'Routine',
    details: { tests: ['FSC'], priority: 'Routine', fasting: false, context: '', collection: 'Au CH le plus proche' } },
  { key: 'lipide', name: 'Bilan lipidique', dose: '',
    sig: 'Cholestérol total, HDL, LDL, TG · À jeun 12 h · Routine',
    chipSig: 'À jeun · Routine',
    details: { tests: ['Cholestérol total', 'HDL', 'LDL', 'Triglycérides'], priority: 'Routine', fasting: true, context: 'Dépistage cardiovasculaire', collection: 'Au CH le plus proche' } },
  { key: 'tsh', name: 'TSH', dose: '', freq: true,
    sig: 'Thyréostimuline · Routine',
    chipSig: 'Routine',
    details: { tests: ['TSH'], priority: 'Routine', fasting: false, context: '', collection: 'Au CH le plus proche' } },
  { key: 'glyc', name: 'Glycémie à jeun', dose: '', freq: true,
    sig: 'Glucose plasmatique · À jeun 8 h · Routine',
    chipSig: 'À jeun · Routine',
    details: { tests: ['Glycémie à jeun'], priority: 'Routine', fasting: true, context: '', collection: 'Au CH le plus proche' } },
  { key: 'hba1c', name: 'HbA1c', dose: '', freq: true,
    sig: 'Hémoglobine glyquée · Routine',
    chipSig: 'Routine',
    details: { tests: ['HbA1c'], priority: 'Routine', fasting: false, context: 'Suivi diabète', collection: 'Au CH le plus proche' } },
  { key: 'creat', name: 'Créatinine / DFGe', dose: '', freq: true,
    sig: 'Créatinine sérique + débit de filtration · Routine',
    chipSig: 'Routine',
    details: { tests: ['Créatinine', 'DFGe'], priority: 'Routine', fasting: false, context: '', collection: 'Au CH le plus proche' } },
  { key: 'ions', name: 'Ions (Na, K, Cl)', dose: '', freq: true,
    sig: 'Électrolytes · Routine',
    chipSig: 'Routine',
    details: { tests: ['Sodium', 'Potassium', 'Chlore'], priority: 'Routine', fasting: false, context: '', collection: 'Au CH le plus proche' } },
  { key: 'ferritine', name: 'Ferritine', dose: '',
    sig: 'Réserves de fer · Routine', chipSig: 'Routine',
    details: { tests: ['Ferritine'], priority: 'Routine', fasting: false, context: '', collection: 'Au CH le plus proche' } },
  { key: 'b12', name: 'Vitamine B12', dose: '',
    sig: 'Cobalamine sérique · Routine', chipSig: 'Routine',
    details: { tests: ['Vitamine B12'], priority: 'Routine', fasting: false, context: '', collection: 'Au CH le plus proche' } },
  { key: 'bilanhep', name: 'Bilan hépatique', dose: '',
    sig: 'ALT, AST, PAL, bilirubine · Routine', chipSig: 'Routine',
    details: { tests: ['ALT', 'AST', 'PAL', 'Bilirubine'], priority: 'Routine', fasting: false, context: '', collection: 'Au CH le plus proche' } },
  { key: 'inr', name: 'INR', dose: '',
    sig: 'Temps de prothrombine · Prioritaire', chipSig: 'Prioritaire',
    details: { tests: ['INR'], priority: 'Prioritaire', fasting: false, context: 'Suivi anticoagulation', collection: 'Au CH le plus proche' } },
  { key: 'srum', name: "Analyse d'urine (SMU-DCA)", dose: '',
    sig: 'Sommaire microscopique + culture · Routine', chipSig: 'Routine',
    details: { tests: ['SMU', 'Culture urinaire'], priority: 'Routine', fasting: false, context: '', collection: 'Au CH le plus proche' } },
];

// =========================================================
// Imagerie — commande « /img » (mêmes sections que /rx)
// =========================================================
const IMG_FAVS = new Set(['rxpoumon']);
const IMG_ITEMS = [
  { key: 'rxpoumon', name: 'Radiographie pulmonaire', dose: '',
    sig: '2 incidences (PA + latérale) · Sans contraste · Routine',
    chipSig: '2 incidences · Routine',
    details: { modality: 'Radiographie', region: 'Thorax', views: 'PA + latérale', priority: 'Routine', context: '', contrast: 'Sans' } },
  { key: 'echoabdo', name: 'Échographie abdominale', dose: '', freq: true,
    sig: 'Abdomen complet · Routine',
    chipSig: 'Routine',
    details: { modality: 'Échographie', region: 'Abdomen', views: 'Complète', priority: 'Routine', context: '', contrast: 'Sans' } },
  { key: 'rxgenou', name: 'Radiographie genou', dose: '', freq: true,
    sig: '3 incidences · Sans contraste · Routine',
    chipSig: '3 incidences · Routine',
    details: { modality: 'Radiographie', region: 'Genou', views: 'AP + latérale + rotule', priority: 'Routine', context: '', contrast: 'Sans' } },
  { key: 'tdmcereb', name: 'TDM cérébrale', dose: '', freq: true,
    sig: 'Sans contraste · Prioritaire',
    chipSig: 'Sans contraste · Prioritaire',
    details: { modality: 'TDM', region: 'Cerveau', views: '', priority: 'Prioritaire', context: 'Céphalées', contrast: 'Sans' } },
  { key: 'mammo', name: 'Mammographie', dose: '', freq: true,
    sig: 'Bilatérale · Dépistage · Routine',
    chipSig: 'Bilatérale · Routine',
    details: { modality: 'Mammographie', region: 'Seins', views: 'Bilatérale', priority: 'Routine', context: 'Dépistage', contrast: 'Sans' } },
  { key: 'irmlomb', name: 'IRM lombaire', dose: '',
    sig: 'Rachis lombaire · Sans contraste · Routine', chipSig: 'Sans contraste · Routine',
    details: { modality: 'IRM', region: 'Rachis lombaire', views: '', priority: 'Routine', context: 'Lombalgie persistante', contrast: 'Sans' } },
  { key: 'echopelv', name: 'Échographie pelvienne', dose: '',
    sig: 'Pelvis · Routine', chipSig: 'Routine',
    details: { modality: 'Échographie', region: 'Pelvis', views: 'Sus-pubienne + endovaginale', priority: 'Routine', context: '', contrast: 'Sans' } },
  { key: 'tdmthorax', name: 'TDM thoracique', dose: '',
    sig: 'Thorax · Avec contraste · Routine', chipSig: 'Avec contraste · Routine',
    details: { modality: 'TDM', region: 'Thorax', views: '', priority: 'Routine', context: '', contrast: 'Avec' } },
  { key: 'rxcolonne', name: 'Radiographie colonne', dose: '',
    sig: 'Rachis · Sans contraste · Routine', chipSig: 'Routine',
    details: { modality: 'Radiographie', region: 'Colonne dorsolombaire', views: 'AP + latérale', priority: 'Routine', context: '', contrast: 'Sans' } },
];

// =========================================================
// Référence spécialiste — commande « /ref »
// =========================================================
const REF_FAVS = new Set(['cardio', 'ortho', 'derm']);
const REF_ITEMS = [
  { key: 'cardio',  name: 'Cardiologie',       dose: '',
    sig: 'Avis cardiologie · Routine',      chipSig: 'Routine',
    details: { specialty: 'Cardiologie',       question: '', indication: '', priority: 'Routine', crds: '' } },
  { key: 'ortho',   name: 'Orthopédie',         dose: '', freq: true,
    sig: 'Avis orthopédie · Routine',       chipSig: 'Routine',
    details: { specialty: 'Orthopédie',         question: '', indication: '', priority: 'Routine', crds: '' } },
  { key: 'derm',    name: 'Dermatologie',       dose: '', freq: true,
    sig: 'Avis dermatologie · Routine',     chipSig: 'Routine',
    details: { specialty: 'Dermatologie',       question: '', indication: '', priority: 'Routine', crds: '' } },
  { key: 'gastro',  name: 'Gastroentérologie',  dose: '', freq: true,
    sig: 'Avis gastroentérologie · Routine', chipSig: 'Routine',
    details: { specialty: 'Gastroentérologie',  question: '', indication: '', priority: 'Routine', crds: '' } },
  { key: 'neuro',   name: 'Neurologie',         dose: '', freq: true,
    sig: 'Avis neurologie · Routine',       chipSig: 'Routine',
    details: { specialty: 'Neurologie',         question: '', indication: '', priority: 'Routine', crds: '' } },
  { key: 'pneumo',  name: 'Pneumologie',        dose: '',
    sig: 'Avis pneumologie · Routine',      chipSig: 'Routine',
    details: { specialty: 'Pneumologie',        question: '', indication: '', priority: 'Routine', crds: '' } },
  { key: 'rhuma',   name: 'Rhumatologie',       dose: '',
    sig: 'Avis rhumatologie · Routine',     chipSig: 'Routine',
    details: { specialty: 'Rhumatologie',       question: '', indication: '', priority: 'Routine', crds: '' } },
  { key: 'endo',    name: 'Endocrinologie',     dose: '',
    sig: 'Avis endocrinologie · Routine',   chipSig: 'Routine',
    details: { specialty: 'Endocrinologie',     question: '', indication: '', priority: 'Routine', crds: '' } },
  { key: 'nephro',  name: 'Néphrologie',        dose: '',
    sig: 'Avis néphrologie · Routine',      chipSig: 'Routine',
    details: { specialty: 'Néphrologie',        question: '', indication: '', priority: 'Routine', crds: '' } },
  { key: 'uro',     name: 'Urologie',           dose: '',
    sig: 'Avis urologie · Routine',         chipSig: 'Routine',
    details: { specialty: 'Urologie',           question: '', indication: '', priority: 'Routine', crds: '' } },
  { key: 'gyn',     name: 'Gynécologie',        dose: '',
    sig: 'Avis gynécologie · Routine',      chipSig: 'Routine',
    details: { specialty: 'Gynécologie',        question: '', indication: '', priority: 'Routine', crds: '' } },
  { key: 'ophthal', name: 'Ophtalmologie',      dose: '',
    sig: 'Avis ophtalmologie · Routine',    chipSig: 'Routine',
    details: { specialty: 'Ophtalmologie',      question: '', indication: '', priority: 'Routine', crds: '' } },
];

// Unified order registry (rx / lab / img / ref) — shared search + favorites
const ORDER_DEFS = {
  rx:  { kbd: 'rx',  type: 'prescription', icon: 'pill',      glyph: '℞', verb: 'prescrire', emptyNoun: 'produit',
         sections: ['Favoris', 'Traitements fréquemment prescrits', 'Autres produits trouvés'],
         favs: RX_FAVS,  items: function () { return RX_ALL; }, search: searchRx },
  lab: { kbd: 'lab', type: 'lab',          icon: 'science',   glyph: null, verb: 'demander',  emptyNoun: 'analyse',
         sections: ['Favoris', 'Analyses fréquemment demandées', 'Autres analyses'],
         favs: LAB_FAVS, items: function () { return LAB_ITEMS; }, search: function (q) { return _searchList(LAB_ITEMS, LAB_FAVS, q); } },
  img: { kbd: 'img', type: 'imaging',      icon: 'radiology',  glyph: null, verb: 'demander',  emptyNoun: 'examen',
         sections: ['Favoris', 'Examens fréquemment demandés', 'Autres examens'],
         favs: IMG_FAVS, items: function () { return IMG_ITEMS; }, search: function (q) { return _searchList(IMG_ITEMS, IMG_FAVS, q); } },
  ref: { kbd: 'ref', type: 'referral',     icon: 'person_add', glyph: null, verb: 'référer',   emptyNoun: 'spécialité',
         sections: ['Favoris', 'Spécialités fréquentes', 'Autres spécialités'],
         favs: REF_FAVS, items: function () { return REF_ITEMS; }, search: function (q) { return _searchList(REF_ITEMS, REF_FAVS, q); } },
};

function _searchList(list, favSet, q) {
  const nq = _norm((q || '').trim());
  const match = function (it) { return !nq || _norm(it.name).startsWith(nq) || _norm(it.name).includes(nq); };
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
function searchOrder(kind, q) { const d = ORDER_DEFS[kind]; return d ? d.search(q) : { favoris: [], frequents: [], autres: [] }; }
function toggleOrderFav(kind, key) { const d = ORDER_DEFS[kind]; if (d) { d.favs.has(key) ? d.favs.delete(key) : d.favs.add(key); } }

// Regenerate the rich-chip payload after a popover edit (lab / imaging)
function deriveLabRx(d) {
  const name = (d.tests && d.tests.length) ? d.tests.join(', ') : 'Demande de laboratoire';
  const sig = [d.fasting ? 'À jeun' : '', d.priority].filter(Boolean).join(' · ');
  return { name: name, dose: '', sig: sig, kind: 'lab' };
}
function deriveImgRx(d) {
  const name = [d.modality, d.region].filter(Boolean).join(' ') || "Demande d'imagerie";
  const sig = [d.contrast && d.contrast !== 'Sans' ? 'Avec contraste' : '', d.views, d.priority].filter(Boolean).join(' · ');
  return { name: name, dose: '', sig: sig, kind: 'img' };
}
function deriveRefRx(d) {
  const name = d.specialty || 'Référence spécialiste';
  const sig = d.priority || 'Routine';
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
  { key: 'add-section', section: 'Structure', icon: 'add', title: 'Ajouter une section', desc: 'Nouvelle section de texte libre', kbd: 'sec',
    addSection: true },
  { key: 'outils-cliniques', section: 'Structure', icon: 'handyman', title: 'Outils cliniques', desc: 'Score, calculatrice, outil clinique…', kbd: '',
    ctPicker: true, noKbd: true },
  { key: 'note-templates', section: 'Structure', icon: 'post_add', title: 'Gabarits de note', desc: 'Syndrome viral, infection urinaire, examen périodique…', kbd: '',
    notePicker: true, noKbd: true },
  // ── GABARITS DE NOTE ─────────────────────────────────────
  // Un niveau au-dessus des gabarits de section / outil clinique : règle
  // structure + sections + outil clinique associé en un seul geste. Masqués
  // du menu par défaut (hideWhenEmpty) — atteints via l'item « Gabarits de
  // note » ci-dessus (NoteTemplateMenu) ou directement au clavier (/virus…).
  { key: 'tpl-virus', section: 'Gabarits de note', icon: 'coronavirus', title: 'Syndrome viral / IVRS', desc: 'Histoire, examen, conclusion', kbd: 'virus',
    hideWhenEmpty: true, noteTemplate: 'virus' },
  { key: 'tpl-itu', section: 'Gabarits de note', icon: 'medical_information', title: 'Infection urinaire', desc: 'Structure + outil clinique ITU', kbd: 'itu',
    hideWhenEmpty: true, noteTemplate: 'itu' },
  { key: 'tpl-periodique', section: 'Gabarits de note', icon: 'event_repeat', title: 'Examen périodique', desc: 'Antécédents, examen, conclusion', kbd: 'periodique',
    hideWhenEmpty: true, noteTemplate: 'periodique' },
  // ── FONCTIONS ────────────────────────────────────────────
  { key: 'add-file', section: 'Fonctions', icon: 'upload_file', title: 'Ajouter des fichiers', desc: 'PDF, image depuis ordinateur…', kbd: '',
    noKbd: true, fileAction: true },
  { key: 'instructions', section: 'Fonctions', icon: 'menu_book', title: 'Instructions patient', desc: 'Consignes au patient', kbd: 'instr',
    template: { type: 'instructions', label: 'Consignes', text: 'Consignes au patient',
      details: { title: '', body: '', delivery: 'Imprimer + portail' } } },
  { key: 'textes-rapides', section: 'Fonctions', icon: 'bolt', title: 'Textes rapides', desc: 'Insérer un modèle de texte', kbd: '',
    noKbd: true, textRapides: true },
  { key: 'diagnostic', section: 'Fonctions', icon: 'local_hospital', title: 'Diagnostic', desc: 'Créer une section diagnostic', kbd: 'dx',
    diagnosticEntry: true },
  // N'apparaît que si la note contient déjà au moins un diagnostic — voir
  // window.__HAS_DIAGNOSTICS dans filterSlashItems (editor-schema.jsx).
  { key: 'diagnostic-ref', section: 'Fonctions', icon: 'tag', title: 'Renvoi à un diagnostic', desc: 'Insère le numéro d’un diagnostic déjà ajouté', kbd: '',
    noKbd: true, diagRefPicker: true },
  { key: 'prescription', section: 'Fonctions', icon: 'prescriptions', title: 'Prescriptions', desc: 'Rechercher et prescrire un médicament', kbd: 'rx',
    rxSearch: true },
  { key: 'lab', section: 'Fonctions', icon: 'science', title: 'Laboratoire', desc: 'FSC, TSH, bilan…', kbd: 'lab',
    orderSearch: true,
    template: { type: 'lab', label: 'Demande de laboratoire', text: 'Demande de laboratoire',
      details: { tests: ['FSC'], priority: 'Routine', fasting: false, context: '', collection: 'Au CH le plus proche' } } },
  { key: 'imaging', section: 'Fonctions', icon: 'radiology', title: 'Imagerie', desc: 'Radio, écho, TDM', kbd: 'img',
    orderSearch: true,
    template: { type: 'imaging', label: "Demande d'imagerie", text: "Demande d'imagerie",
      details: { modality: 'Radiographie', region: '', views: '', priority: 'Routine', context: '', contrast: 'Sans' } } },
  { key: 'referral', section: 'Fonctions', icon: 'person_add', title: 'Référence spécialiste', desc: 'Cardio, ortho, derm…', kbd: 'ref',
    orderSearch: true,
    template: { type: 'referral', label: 'Référence spécialiste', text: 'Référence spécialiste',
      details: { specialty: '', question: '', indication: '', priority: 'Routine', crds: '' } } },
  // ── accessible via /pb uniquement (masqué dans menu vide) ─
  { key: 'problem', section: 'Fonctions', icon: 'flag', title: 'Problème', desc: 'Ajouter au problématique', kbd: 'pb',
    hideWhenEmpty: true,
    template: { type: 'problem', label: 'Problème', text: 'Problème',
      details: { name: '', severity: 'Modéré', since: "Aujourd'hui", notes: '' } } },
  // ── CONFIDENTIEL — section à part (une seule instance par note, cf.
  // confidentialField ci-dessous et NoteEditor.jsx) ─────────
  { key: 'confidential-field', section: 'Confidentiel', icon: 'lock', title: 'Champ confidentiel', desc: 'Visible seulement par vous', kbd: '',
    noKbd: true, confidentialField: true },
];

// ── GABARITS DE NOTE ─────────────────────────────────────────
// Déclenchés par les entrées "Gabarits de note" ci-dessus (/virus, /itu,
// /periodique). Inspirés des types de notes communs déjà présents dans
// le picker d'outils cliniques et l'Assistant IA.
const NOTE_TEMPLATES = [
  {
    key: 'virus', name: 'Syndrome viral / IVRS',
    raison: 'Symptômes de rhume / syndrome viral',
    sections: [
      { title: 'Histoire de la maladie actuelle',
        content: 'Depuis : \nSymptômes : \nDrapeaux rouges (absents) : dyspnée, douleur thoracique, confusion, incapacité à s’hydrater' },
      { title: 'Examen physique',
        content: 'Apyrétique / fébrile (T°) : \nAuscultation pulmonaire : \nOropharynx / tympans : ' },
      { title: 'Conclusion', content: 'Impression : \nPlan : ' },
    ],
  },
  {
    key: 'itu', name: 'Infection urinaire',
    raison: 'Symptômes urinaires',
    sections: [
      { title: 'Détails de la consultation', content: '' },
      { title: 'Conclusion', content: 'Impression : \nPlan : ' },
    ],
    tool: 'itu',
  },
  {
    key: 'periodique', name: 'Examen périodique',
    raison: 'Examen médical périodique',
    sections: [
      { title: 'Antécédents et revue des systèmes',
        content: 'Antécédents personnels : \nMédication actuelle : \nAllergies : \nHabitudes de vie : \nRevue des systèmes : sans particularité' },
      { title: 'Examen physique',
        content: 'Signes vitaux : TA _/_, pouls _, poids _ kg, IMC _\nExamen général : ' },
      { title: 'Conclusion', content: 'Impression : Bonne santé générale.\nPlan : ' },
    ],
  },
];

const PATIENT = {
  initials: 'GT',
  name: 'Geneviève Tremblay',
  age: '38 ans',
  sex: 'F',
  dob: '03 mai 1987',
  ramq: 'TREG 8705 0301',
  phone: '514 555 0184',
  reason: 'Otite moyenne aiguë',
  status: 'En consultation',
};

const PROBLEMS = [
  { id: 'pb1', ttl: 'Asthme léger', meta: 'Depuis 2018 · Contrôlé', sev: 'ok', sevLbl: 'Stable' },
  { id: 'pb2', ttl: 'Allergie pénicilline', meta: 'Réaction: éruption cutanée', sev: 'err', sevLbl: 'Légère' },
  { id: 'pb3', ttl: 'Grossesse', meta: '22 sem · suivi GARE', sev: '', sevLbl: 'Actif' },
];

// Problemes au dossier - memes donnees que le sommaire (liste ci-dessus).
// Affiches en tete du menu /dx (voir searchDx dans editor-schema.jsx), meme
// principe que PATIENT_MEDS pour /rx : sans terme tape, on retrouve tout le
// dossier ; avec un terme, on filtre. Forme alignee sur searchCIM10 (libelle,
// generic) pour pouvoir fusionner les deux listes dans une seule navigation
// clavier - `fromChart` distingue un probleme du dossier d'un code CIM-10.
function searchProblems(query) {
  const q = _norm((query || '').trim());
  return PROBLEMS
    .filter(function (p) { return !q || _norm(p.ttl).includes(q); })
    .map(function (p) { return { key: p.id, libelle: p.ttl, generic: false, fromChart: true }; });
}

const VITALS = [
  { ic: 'thermostat',    lbl: 'Température', val: '38,1 °C' },
  { ic: 'favorite',      lbl: 'FC',            val: '84 bpm' },
  { ic: 'monitor_heart', lbl: 'TA',            val: '118/72' },
  { ic: 'air',           lbl: 'SpO₂',     val: '98 %' },
  { ic: 'scale',         lbl: 'Poids',         val: '64 kg' },
];

const RESULTS_RECENT = [
  { id: 'r1', ttl: 'FSC — 17 mars 2026', meta: 'Hb 128 g/L · Leuco 9,2', sev: 'ok', sevLbl: 'Normal' },
  { id: 'r2', ttl: 'TSH — 12 janv 2026', meta: '2,1 mUI/L', sev: 'ok', sevLbl: 'Normal' },
];

const SCENARIOS = [
  { key: 'empty',  name: 'Note vierge', desc: 'Commencer à zéro',
    detail: '', conclusion: '', hint: null },
  { key: 'rx',     name: 'Démo — prescription', desc: 'Tapez « mét » pour voir la liste',
    detail: "Motif de consultation\nPatiente enceinte de 22 sem consulte pour otalgie droite depuis 48 h, accompagnée d'un écoulement clair intermittent et d'une sensation d'oreille bouchée. Pas de vertiges, pas d'acouphènes, pas de fièvre frissonnante.\n\nAntécédents\nAsthme léger bien contrôlé sous Ventolin PRN. Grossesse actuelle sans complication, suivie en GARE. Allergie légère à la pénicilline documentée en 2019 — éruption maculopapuleuse seulement, pas d'œdème ni d'urticaire.\n\nExamen physique\nTempérature 38,1 °C, TA 118/72, FC 84 régulière, SpO₂ 98 % à l'air ambiant. Patiente alerte, confortable.\nOtoscopie droite : tympan bombé, érythémateux, opaque, perte du triangle lumineux. Otoscopie gauche : tympan nacré, mobile à l'insufflation, reliefs normaux.\nAuscultation pulmonaire claire, pas de râles ni de sibilances. Pharynx sans érythème. Adénopathies cervicales non palpables.\n\nRevue des systèmes\nPas de céphalées, pas de nausées, pas d'éruption cutanée. Mouvements fœtaux perçus, pas de contractions..",
    conclusion: 'Impression\nInfection bactérienne — plan de traitement à venir.\n\nPlan\nAntibiothérapie: mét',
    hint: 'Le curseur est placé après « mét ». Continuez à taper pour filtrer la liste. ↑ ↓ pour naviguer, Entrée / Tab pour choisir.' },
  { key: 'composed', name: 'Note avancée', desc: 'Plusieurs items confirmés',
    detail: 'Bilan annuel. HTA et dyslipidémie suivis. Pas de plainte.\nTA 138/86, FC 72 rég. Auscultation normale.',
    conclusion: 'Bilan stable. Renouvellement atorvastatine. Bilan lipidique annuel à jeun. Suivi 3 mois.',
    preChips: [
      { slot: 'conclusion', entity: { type: 'prescription', label: 'Atorvastatine 20 mg',
        text: 'Atorvastatine 20 mg — HS × 90 jours',
        details: { molecule: 'Atorvastatine', dose: '20', unit: 'mg', form: 'comprimé',
          route: 'PO', frequency: 'HS', duration: '90', durationUnit: 'jours',
          quantity: '90', refills: '3', indication: 'Dyslipidémie', notes: 'Surveiller CK.' } } },
      { slot: 'conclusion', entity: { type: 'lab', label: 'Bilan lipidique',
        text: 'Bilan lipidique + ALT + créat',
        details: { tests: ['Chol total', 'HDL', 'LDL', 'TG', 'ALT', 'Créat'], priority: 'Routine',
          fasting: true, context: 'Suivi statine', collection: 'Au CH' } } },
    ],
    hint: 'Cliquez sur un chip pour modifier les détails.' },
];

window.NOTE_DATA = { ENTITY_TYPES, RECOGNIZERS, MED_CATALOG, SLASH_ITEMS, NOTE_TEMPLATES, PATIENT, PROBLEMS, VITALS, RESULTS_RECENT, SCENARIOS,
  RX_FAVS, RX_ITEMS, PATIENT_MEDS, searchRx, toggleRxFav, deriveRx,
  ORDER_DEFS, orderKindForKbd, searchOrder, toggleOrderFav, deriveLabRx, deriveImgRx, deriveRefRx, searchProblems };
