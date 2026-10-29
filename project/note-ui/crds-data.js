// Fichier généré par tools/crds-csv-to-js.py : ne pas modifier à la main.
// Formulaires CRDS : spécialités, raisons de consultation (Section > Sous-section > Raison),
// cote de priorité et pièces jointes requises. Libellés officiels, en français seulement.
window.CRDS_DATA = {
"source":"APSS / CRDS / Safir — Inventaire des prérequis (pièces jointes)",
"specialties":[
{
"key":"cardio",
"name":"Cardiologie",
"form":"Consultation en Cardiologie adulte",
"reasons":[
{
"id":"cardio-1",
"path":[
"DRS/Angine"
],
"label":"Angine d'effort sévère (CCS 3/4) stable",
"cote":"B"
},
{
"id":"cardio-2",
"path":[
"DRS/Angine"
],
"label":"DRS atypique avec facteurs de risque",
"cote":"C"
},
{
"id":"cardio-3",
"path":[
"DRS/Angine"
],
"label":"DRS typique évoluant depuis > 1 mois ou Angine d'effort (CCS <= 2/4) stable",
"cote":"C"
},
{
"id":"cardio-4",
"path":[
"DRS/Angine"
],
"label":"DRS atypique sans facteur de risque",
"cote":"D"
},
{
"id":"cardio-5",
"path":[
"Troubles du rythme"
],
"label":"Bradycardie asymptomatique avec FC < 40 bpm ou pauses diurnes > 3 secondes documentées",
"cote":"B"
},
{
"id":"cardio-6",
"path":[
"Troubles du rythme"
],
"label":"FA de novo FC < 110 bpm au repos",
"cote":"C",
"docs":[
{
"name":"Débuter anticoagulothérapie si indiqué",
"type":"action",
"auto":"Impossible"
}
]
},
{
"id":"cardio-7",
"path":[
"Troubles du rythme"
],
"label":"TSV ou suspicion de TSV",
"cote":"D"
},
{
"id":"cardio-8",
"path":[
"Troubles du rythme"
],
"label":"Palpitations d'allure bénigne",
"cote":"E",
"docs":[
{
"name":"Holter souhaitable",
"type":"document",
"auto":"Difficile"
}
]
},
{
"id":"cardio-9",
"path":[
"MCAS"
],
"label":"Suivi post infarctus de moins d'un an",
"cote":"D"
},
{
"id":"cardio-10",
"path":[
"MCAS"
],
"label":"Suivi post infarctus de plus d'un an",
"cote":"E"
},
{
"id":"cardio-11",
"path":[
"MCAS"
],
"label":"MCAS sans événement récent",
"cote":"E"
},
{
"id":"cardio-12",
"path":[
"Syncope"
],
"label":"Syncope avec cardiopathie",
"cote":"B"
},
{
"id":"cardio-13",
"path":[
"Syncope"
],
"label":"Syncope sans cardiopathie",
"cote":"D"
},
{
"id":"cardio-14",
"path":[
"Dyspnée/ Insuffisance cardiaque"
],
"label":"Dyspnée d'effort de novo marquée (NYHA = 3/4) ou connue avec détérioration récente",
"cote":"B"
},
{
"id":"cardio-15",
"path":[
"Dyspnée/ Insuffisance cardiaque"
],
"label":"Dysfonction ventriculaire de novo (fraction éjection < 50 % si connue)",
"cote":"C"
},
{
"id":"cardio-16",
"path":[
"Dyspnée/ Insuffisance cardiaque"
],
"label":"Dyspnée d'effort inexpliquée",
"cote":"D"
},
{
"id":"cardio-17",
"path":[
"Dyspnée/ Insuffisance cardiaque"
],
"label":"Suivi d'insuffisance cardiaque",
"cote":"E"
},
{
"id":"cardio-18",
"path":[
"Valvulopathie"
],
"label":"Valvulopathie aortique ou mitrale sévère",
"cote":"C"
},
{
"id":"cardio-19",
"path":[
"Valvulopathie"
],
"label":"Souffle cardiaque non investigué ou pathologie valvulaire non sévère",
"cote":"E"
}
]
},
{
"key":"chirgen",
"name":"Chirurgie générale",
"form":"Consultation en Chirurgie générale adulte",
"reasons":[
{
"id":"chirgen-1",
"path":[],
"label":"Colique biliaire (un ou plusieurs épisodes)",
"cote":"D",
"docs":[
{
"name":"Rapport d'échographie abdominal",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"chirgen-2",
"path":[],
"label":"Diverticulite avec récidives fréquentes prouvées au TDM de contrôle X 1",
"cote":"D",
"docs":[
{
"name":"Rapports de TDM",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"chirgen-3",
"path":[
"Pathologies anorectales (hémorroïdes, fissures, marisques, fistules, prolapsus, condylomes, masse, etc.)"
],
"label":"Avec lésion suspecte au toucher rectal",
"cote":"B"
},
{
"id":"chirgen-4",
"path":[
"Pathologies anorectales (hémorroïdes, fissures, marisques, fistules, prolapsus, condylomes, masse, etc.)"
],
"label":"Sans lésion suspecte au toucher rectal",
"cote":"E"
},
{
"id":"chirgen-5",
"path":[
"Hernies"
],
"label":"Ombilicale / épigastrique symptomatique",
"cote":"E"
},
{
"id":"chirgen-6",
"path":[
"Hernies"
],
"label":"Inguinale symptomatique ou fémorale",
"cote":"D"
},
{
"id":"chirgen-7",
"path":[
"Hernies"
],
"label":"Incisionnelle symptomatique",
"cote":"E"
},
{
"id":"chirgen-8",
"path":[],
"label":"Sinus pilonidal symptomatique",
"cote":"E"
},
{
"id":"chirgen-9",
"path":[],
"label":"Lipome >= 5 cm",
"cote":"E"
},
{
"id":"chirgen-10",
"path":[
"Sein"
],
"label":"Investigation révélant un carcinome",
"cote":"B",
"docs":[
{
"name":"Rapports d'imagerie",
"type":"dsq",
"auto":"DSQ"
},
{
"name":"Rapports de pathologie",
"type":"document",
"auto":"Difficile"
}
]
},
{
"id":"chirgen-11",
"path":[
"Sein"
],
"label":"Investigation révélant une anomalie autre",
"cote":"C",
"docs":[
{
"name":"Rapports d'imagerie",
"type":"dsq",
"auto":"DSQ"
},
{
"name":"Rapports de pathologie",
"type":"document",
"auto":"Difficile"
}
]
}
]
},
{
"key":"plastie",
"name":"Chirurgie plastique",
"form":"Consultation en Chirurgie plastique",
"reasons":[
{
"id":"plastie-1",
"path":[],
"label":"Tunnel carpien qui ne répond pas au traitement médical après 2 mois (orthèse et infiltration)",
"cote":"D"
},
{
"id":"plastie-2",
"path":[
"Doigt gachette"
],
"label":"Avec blocage permanent",
"cote":"C"
},
{
"id":"plastie-3",
"path":[
"Doigt gachette"
],
"label":"Sans blocage ou blocage intermittent réductible",
"cote":"D"
},
{
"id":"plastie-4",
"path":[],
"label":"Kyste arthro-synovial",
"cote":"E"
},
{
"id":"plastie-5",
"path":[
"Maladie de Dupuytren"
],
"label":"Avec perte d'extension",
"cote":"D"
},
{
"id":"plastie-6",
"path":[
"Maladie de Dupuytren"
],
"label":"Sans perte d'extension",
"cote":"E"
},
{
"id":"plastie-7",
"path":[],
"label":"Tendinite De Quervain avec échec au traitement médical après 2 mois (orthèse et infiltration)",
"cote":"D"
},
{
"id":"plastie-8",
"path":[],
"label":"Rhizarthrose INVALIDANTE avec échec au traitement médical (orthèse et infiltration)",
"cote":"D",
"docs":[
{
"name":"RX Main",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"plastie-9",
"path":[],
"label":"Fracture aiguë et non déplacée de la main (voir alerte cliniques)",
"cote":"B",
"docs":[
{
"name":"RX et immobilisation adéquat",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"plastie-10",
"path":[],
"label":"Doigt en Maillet (Mallet finger)",
"cote":"B",
"docs":[
{
"name":"RX et immobilisation adéquat",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"plastie-11",
"path":[],
"label":"Luxation réduite des doigts",
"cote":"B",
"docs":[
{
"name":"RX post réduction",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"plastie-12",
"path":[],
"label":"Masse bénigne (ex. : lipome, kyste sébacés, etc.) causant des symptômes d'ordre fonctionnel objectivable",
"cote":"E",
"docs":[
{
"name":"Rapport d'imagerie pour masse supérieure à 5 cm",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"plastie-13",
"path":[],
"label":"Lésion cutanée maligne avec PATHOLOGIE CONFIRMÉE (ex: basocellulaire, spinocellulaire, mélanome, etc)",
"cote":"B",
"docs":[
{
"name":"Rapport de pathologie",
"type":"document",
"auto":"Difficile"
}
]
},
{
"id":"plastie-14",
"path":[],
"label":"Lésion cutanée bénigne",
"cote":"E"
},
{
"id":"plastie-15",
"path":[],
"label":"Cicatrice vicieuse du visage",
"cote":"E"
},
{
"id":"plastie-16",
"path":[],
"label":"Réduction mammaire",
"cote":"E"
},
{
"id":"plastie-17",
"path":[],
"label":"Asymétrie mammaire",
"cote":"E"
},
{
"id":"plastie-18",
"path":[],
"label":"Reconstruction mammaire post néoplasie",
"cote":"E"
},
{
"id":"plastie-19",
"path":[],
"label":"Gynécomastie",
"cote":"E",
"docs":[
{
"name":"Imagerie médicale",
"type":"dsq",
"auto":"DSQ"
},
{
"name":"Bilan endocrinien",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"plastie-20",
"path":[],
"label":"Fracture immobilisée non déplacée du carpe incluant scaphoïde",
"cote":"B",
"docs":[
{
"name":"RX du poignet incluant vue du scaphoïde",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"plastie-21",
"path":[],
"label":"Brûlures qui ne répondent pas aux critères des centres d'expertise",
"cote":"B"
}
]
},
{
"key":"vasc",
"name":"Chirurgie vasculaire",
"form":"Consultation en Chirurgie vasculaire et endovasculaire adulte",
"reasons":[
{
"id":"vasc-1",
"path":[],
"label":"MVAS chronique avec gangrène humide ou douleur de repos ou plaie de novo (< 2 semaines)",
"cote":"B"
},
{
"id":"vasc-2",
"path":[],
"label":"MVAS chronique avec gangrène sèche ou plaie chronique (> 2 semaines)",
"cote":"C"
},
{
"id":"vasc-3",
"path":[
"Claudication intermittente"
],
"label":"Rapidement évolutive",
"cote":"C"
},
{
"id":"vasc-4",
"path":[
"Claudication intermittente"
],
"label":"Sévère et incapacitante",
"cote":"D"
},
{
"id":"vasc-5",
"path":[
"Claudication intermittente"
],
"label":"Stable",
"cote":"E"
},
{
"id":"vasc-6",
"path":[],
"label":"Sténose carotidienne documentée sévère (> 70 %) asymptomatique",
"cote":"D"
},
{
"id":"vasc-7",
"path":[],
"label":"Doppler carotidien (examen et consultation)",
"cote":"E",
"docs":[
{
"name":"Description des signes et symptômes amenant la demande d'examen",
"type":"saisie",
"auto":"Impossible"
}
]
},
{
"id":"vasc-8",
"path":[],
"label":"Étude vasculaire pour éliminer insuffisance artérielle",
"cote":"E",
"docs":[
{
"name":"Description des signes et symptômes amenant la demande d'examen",
"type":"saisie",
"auto":"Impossible"
}
]
},
{
"id":"vasc-9",
"path":[],
"label":"Index tibio-huméral (ITH) avant prescription de bas support",
"cote":"D",
"docs":[
{
"name":"Description des signes et symptômes amenant la demande d'examen",
"type":"saisie",
"auto":"Impossible"
}
]
},
{
"id":"vasc-10",
"path":[
"Anévrisme asymptomatique",
"Aorte abdominale"
],
"label":"50-70 mm",
"cote":"C",
"docs":[
{
"name":"Rapport d'imagerie",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"vasc-11",
"path":[
"Anévrisme asymptomatique",
"Aorte abdominale"
],
"label":"45-49 mm",
"cote":"D",
"docs":[
{
"name":"Rapport d'imagerie",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"vasc-12",
"path":[
"Anévrisme asymptomatique",
"Aorte abdominale"
],
"label":"Progression rapide peu importe le diamètre ( > 6 mm en 6 mois ou > 10 mm / année)",
"cote":"C",
"docs":[
{
"name":"Rapport d'imagerie",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"vasc-13",
"path":[
"Anévrisme asymptomatique",
"Aorte thoracique descendante"
],
"label":">= 60 mm",
"cote":"C",
"docs":[
{
"name":"Rapport d'imagerie",
"type":"dsq",
"auto":"DSQ"
},
{
"name":"Rapport TDM ou ETT",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"vasc-14",
"path":[
"Anévrisme asymptomatique",
"Aorte thoracique descendante",
"Anévrisme asymptomatique",
"Aorte thoracique descendante"
],
"label":">= 60 mm",
"cote":"C",
"docs":[
{
"name":"Rapport d'imagerie",
"type":"dsq",
"auto":"DSQ"
},
{
"name":"Rapport TDM ou ETT",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"vasc-15",
"path":[
"Anévrisme asymptomatique",
"Artère iliaque"
],
"label":">= 30 mm",
"cote":"C",
"docs":[
{
"name":"Rapport d'imagerie",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"vasc-16",
"path":[
"Anévrisme asymptomatique",
"Artère iliaque"
],
"label":"< 30 mm",
"cote":"E",
"docs":[
{
"name":"Rapport d'imagerie",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"vasc-17",
"path":[
"Anévrisme asymptomatique",
"Artère poplitée"
],
"label":">= 20 mm",
"cote":"C",
"docs":[
{
"name":"Rapport d'imagerie",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"vasc-18",
"path":[
"Anévrisme asymptomatique",
"Artère poplitée"
],
"label":"< 20 mm",
"cote":"E",
"docs":[
{
"name":"Rapport d'imagerie",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"vasc-19",
"path":[
"Anévrisme asymptomatique",
"Viscéraux (artères rénales, splénique, mésentériques)"
],
"label":">= 20 mm",
"cote":"C",
"docs":[
{
"name":"Rapport d'imagerie",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"vasc-20",
"path":[
"Anévrisme asymptomatique",
"Viscéraux (artères rénales, splénique, mésentériques)"
],
"label":"< 20 mm",
"cote":"E",
"docs":[
{
"name":"Rapport d'imagerie",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"vasc-21",
"path":[
"Anévrisme asymptomatique",
"Anévrisme viscéral chez femme enceinte ou en âge de procréer"
],
"label":"Peu importe le diamètre",
"cote":"B",
"docs":[
{
"name":"Rapport d'imagerie",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"vasc-22",
"path":[
"Insuffisance veineuse"
],
"label":"Ulcère veineux ou dermite de stase avec échec au traitement médical ou récidive (CEAP >= 4/6)",
"cote":"D"
},
{
"id":"vasc-23",
"path":[
"Insuffisance veineuse"
],
"label":"Varices",
"cote":"E"
}
]
},
{
"key":"derm",
"name":"Dermatologie",
"form":"Consultation en Dermatologie adulte et pédiatrique",
"reasons":[
{
"id":"derm-1",
"path":[
"Changement d'une lésion pigmentée au cours de la dernière année ( mélanome fortement soupçonné) Avec le ou les signes suivants"
],
"label":"Asymétrie ou bordure irrégulière",
"cote":null
},
{
"id":"derm-2",
"path":[
"Changement d'une lésion pigmentée au cours de la dernière année ( mélanome fortement soupçonné) Avec le ou les signes suivants"
],
"label":"Couleur hétérogène ou >= 2 couleurs",
"cote":null
},
{
"id":"derm-3",
"path":[
"Changement d'une lésion pigmentée au cours de la dernière année ( mélanome fortement soupçonné) Avec le ou les signes suivants"
],
"label":"Accroissement de la taille",
"cote":null
},
{
"id":"derm-4",
"path":[],
"label":"Lésion pigmentée irrégulière non évolutive",
"cote":"D"
},
{
"id":"derm-5",
"path":[],
"label":"Tumeur d'apparition très rapide (< 1 mois) et >= 1,5 cm",
"cote":"B"
},
{
"id":"derm-6",
"path":[],
"label":"Tumeur suspecte de cancer (autre que mélanome) lentement évolutive (ex: carcinomes: basocellulaire ou épidermoïde)",
"cote":"D"
},
{
"id":"derm-7",
"path":[],
"label":"Kératoses actiniques",
"cote":"E"
},
{
"id":"derm-8",
"path":[
"Lésions érythémato-squameuses (ex. : eczéma, psoriasis, tinea)"
],
"label":"Étendues > 30% de la surface corporelle ou atteignant visage, mains ou pieds",
"cote":"C"
},
{
"id":"derm-9",
"path":[
"Lésions érythémato-squameuses (ex. : eczéma, psoriasis, tinea)"
],
"label":"Limitées < 30% de la surface corporelle ne répondant pas au traitement",
"cote":"D"
},
{
"id":"derm-10",
"path":[],
"label":"Lésions vésiculo-bulleuses non infectieuses sans atteinte de l'état général (ex: pemphigoïde bulleuse, pemphigus, dermatite de contact aiguë extensive)",
"cote":"B"
},
{
"id":"derm-11",
"path":[],
"label":"Acné nodulo-kystique ou cicatricielle",
"cote":"D",
"docs":[
{
"name":"Contraception initiée chez la femme",
"type":"action",
"auto":"Impossible"
}
]
},
{
"id":"derm-12",
"path":[],
"label":"Lésions acnéiformes ne répondant pas au traitement (ex: acné, rosacée, folliculite, hidradénite)",
"cote":"E"
},
{
"id":"derm-13",
"path":[],
"label":"Molluscum contagiosum > 20 lésions chez l'enfant",
"cote":"E"
},
{
"id":"derm-14",
"path":[],
"label":"Pathologie rebelle des ongles excluant les ongles incarnés",
"cote":"E"
},
{
"id":"derm-15",
"path":[],
"label":"Désordre de pigmentation (ex : vitiligo)",
"cote":"E"
},
{
"id":"derm-16",
"path":[],
"label":"Lésions vasculaires de l'enfant (ex: hémangiome) excluant angiome stellaire unique",
"cote":"C"
}
]
},
{
"key":"endo",
"name":"Endocrinologie",
"form":"Consultation en Endocrinologie",
"reasons":[
{
"id":"endo-1",
"path":[
"Hyperthyroïdie (TSH ↓)"
],
"label":"T4 libre > 2X limite supérieure",
"cote":"B",
"docs":[
{
"name":"Joindre les rapports de laboratoire et d'imagerie pour toutes les raisons de consultation.",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"endo-2",
"path":[
"Hyperthyroïdie (TSH ↓)"
],
"label":"T4 libre élevée <= 2X limite supérieure",
"cote":"C",
"docs":[
{
"name":"Joindre les rapports de laboratoire et d'imagerie pour toutes les raisons de consultation.",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"endo-3",
"path":[
"Hyperthyroïdie (TSH ↓)"
],
"label":"T4 libre normale (et T3 normale si dosée)",
"cote":"E",
"docs":[
{
"name":"Joindre les rapports de laboratoire et d'imagerie pour toutes les raisons de consultation.",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"endo-4",
"path":[
"Nodule Thyroïdien"
],
"label":"Associé à l'apparition récente de dysphonie ou adénopathie suspecte",
"cote":"B",
"docs":[
{
"name":"TSH",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"endo-5",
"path":[
"Nodule Thyroïdien"
],
"label":"Critères échographiques suspects ou > 4 cm et 2*",
"cote":"D",
"docs":[
{
"name":"TSH",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"endo-6",
"path":[
"Nodule Thyroïdien"
],
"label":"Autres nodules solides/mixtes >= 1cm à l'écho",
"cote":"E",
"docs":[
{
"name":"TSH",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"endo-7",
"path":[],
"label":"Diabète de novo, type 1 soupçonné, sans acidose et sans cétonurie",
"cote":"B"
},
{
"id":"endo-8",
"path":[
"Diabète traité"
],
"label":"Avec hypoglycémie nécessitant assistance d'un tiers",
"cote":"C"
},
{
"id":"endo-9",
"path":[
"Diabète traité"
],
"label":"HbA1c >12 %",
"cote":"C"
},
{
"id":"endo-10",
"path":[
"Diabète traité"
],
"label":"HbA1c 9-12 %",
"cote":"D"
},
{
"id":"endo-11",
"path":[
"Diabète traité"
],
"label":"HbA1c < 9 %",
"cote":"E"
},
{
"id":"endo-12",
"path":[],
"label":"Hirsutisme sans virilisation",
"cote":"E"
},
{
"id":"endo-13",
"path":[],
"label":"Oligo/aménorrhée (ex. : syndrome ovaires polykystiques)",
"cote":"E"
},
{
"id":"endo-14",
"path":[
"Hypogonadisme chez l'homme"
],
"label":"<= 50 ans",
"cote":"D",
"docs":[
{
"name":"2 dosages (avant 10 h 00) de testostérone abaissée",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"endo-15",
"path":[
"Hypogonadisme chez l'homme"
],
"label":"> 50 ans",
"cote":"E",
"docs":[
{
"name":"2 dosages (avant 10 h 00) de testostérone abaissée",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"endo-16",
"path":[],
"label":"Hypogonadisme désirant fertilité (homme et femme)",
"cote":"D"
},
{
"id":"endo-17",
"path":[],
"label":"Gynécomastie d'apparition de moins de 6 mois",
"cote":"D"
},
{
"id":"endo-18",
"path":[],
"label":"Insuffisance surrénalienne de novo sans instabilité hémodynamique",
"cote":"B",
"docs":[
{
"name":"Cortisol de 8 h 00",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"endo-19",
"path":[],
"label":"Hypercorticisme",
"cote":"C",
"docs":[
{
"name":"Cortisolurie 24 h C (si prise d’oestrogène) ou test de suppression à la dexaméthasone 1 mg",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"endo-20",
"path":[
"Nodule surrénalien"
],
"label":">= 4 cm ou suspect à l'imagerie ou catécholamines ou métanéphrines élevées",
"cote":"C",
"docs":[
{
"name":"Dosage de catécholamines et métanéphrines sur collecte d'urine de 24 h et test de suppression à la dexaméthasone 1 mg à 23 h. Si hypertension ou hypokaliémie, ajouter dosage du ratio de rénine et d'aldostérone",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"endo-21",
"path":[
"Nodule surrénalien"
],
"label":"< 4 cm d'allure bénigne à l'imagerie et laboratoires ANORMAUX",
"cote":"D",
"docs":[
{
"name":"Dosage de catécholamines et métanéphrines sur collecte d'urine de 24 h et test de suppression à la dexaméthasone 1 mg à 23 h. Si hypertension ou hypokaliémie, ajouter dosage du ratio de rénine et d'aldostérone",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"endo-22",
"path":[],
"label":"Ostéoporose",
"cote":"E"
},
{
"id":"endo-23",
"path":[
"Hypercalcémie"
],
"label":"Ca < 3 mmol/l",
"cote":"D",
"docs":[
{
"name":"Ca total corrigé",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"endo-24",
"path":[
"Hypercalcémie"
],
"label":"Ca 3 à 3,5 mmol/l",
"cote":"B",
"docs":[
{
"name":"Ca total corrigé",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"endo-25",
"path":[
"Hypocalcémie"
],
"label":"Ca 1,6 à 1,9 mmol/l peu ou pas symptomatique",
"cote":"B",
"docs":[
{
"name":"Ca total corrigé",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"endo-26",
"path":[
"Hypocalcémie"
],
"label":"Ca > 1,9 mmol/l",
"cote":"D",
"docs":[
{
"name":"Ca total corrigé",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"endo-27",
"path":[
"Masse hypophysaire"
],
"label":"Avec symptôme visuel",
"cote":"B"
},
{
"id":"endo-28",
"path":[
"Masse hypophysaire"
],
"label":"Sans symptôme visuel",
"cote":"D"
},
{
"id":"endo-29",
"path":[],
"label":"Hyperprolactinémie (dosage contrôlé 2 fois)",
"cote":"D"
},
{
"id":"endo-30",
"path":[],
"label":"Diabète, dysthyroïdie ou autre endocrinopathie en grossesse",
"cote":"C"
},
{
"id":"endo-31",
"path":[],
"label":"Évaluation pré-grossesse chez patiente diabétique",
"cote":"D"
}
]
},
{
"key":"gastro",
"name":"Gastroentérologie",
"form":"Consultation en Gastroentérologie adulte",
"reasons":[
{
"id":"gastro-1",
"path":[
"Dysphagie (excluant origine oro-pharyngée ou neuromusculaire)"
],
"label":"Stable et intermittente",
"cote":"D"
},
{
"id":"gastro-2",
"path":[
"Dysphagie (excluant origine oro-pharyngée ou neuromusculaire)"
],
"label":"Rapidement progressive",
"cote":"B"
},
{
"id":"gastro-3",
"path":[
"ALT entre 201"
],
"label":"500 UI et INR normal",
"cote":"B",
"docs":[
{
"name":"FSC, créatinine, albumine et bilan hépatique < 3 mois",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"gastro-4",
"path":[
"ALT entre 91"
],
"label":"200 UI et INR normal",
"cote":"D",
"docs":[
{
"name":"FSC, créatinine, albumine et bilan hépatique < 3 mois",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"gastro-5",
"path":[],
"label":"ALT entre 40 et 90 UI et stable depuis 6 mois",
"cote":"E"
},
{
"id":"gastro-6",
"path":[],
"label":"Stéatose hépatique avec ALT < 90 UI",
"cote":"E"
},
{
"id":"gastro-7",
"path":[
"RGO ou dyspepsie ou douleur abdominale haute"
],
"label":"Perte de poids > 10 % en 6 mois",
"cote":"C"
},
{
"id":"gastro-8",
"path":[
"RGO ou dyspepsie ou douleur abdominale haute"
],
"label":"Évidence de saignement associé",
"cote":"C"
},
{
"id":"gastro-9",
"path":[
"RGO ou dyspepsie ou douleur abdominale haute"
],
"label":"Vomissements",
"cote":"C"
},
{
"id":"gastro-10",
"path":[],
"label":"RGO/Dyspepsie débutant à l'âge > 55 ans",
"cote":"D"
},
{
"id":"gastro-11",
"path":[],
"label":"HBSAg positif avec ALT < 40 UI et sans cirrhose",
"cote":"E"
},
{
"id":"gastro-12",
"path":[],
"label":"AntiHCV positif avec ALT < 200 UI et sans cirrhose",
"cote":"E"
},
{
"id":"gastro-13",
"path":[
"Cirrhose compensée ou de novo confirmée par imagerie"
],
"label":"INR > 1,7 ou bilirubine totale > 34 ou albumine < 28 sans encéphalopathie",
"cote":"C",
"docs":[
{
"name":"Rapport IM",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"gastro-14",
"path":[
"Cirrhose compensée ou de novo confirmée par imagerie"
],
"label":"INR entre 1,2-1,7 ou albumine entre 28-35 ou bilirubine totale entre 17-34",
"cote":"D",
"docs":[
{
"name":"Rapport IM",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"gastro-15",
"path":[
"Cirrhose compensée ou de novo confirmée par imagerie"
],
"label":"INR, albumine et bilirubine totale normaux",
"cote":"E",
"docs":[
{
"name":"Rapport IM",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"gastro-16",
"path":[],
"label":"Ictère avec bilirubine totale > 60 ou > 40 avec dilatation des voies biliaires à l'échographie avec INR normal",
"cote":"B",
"docs":[
{
"name":"Rapport IM",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"gastro-17",
"path":[],
"label":"Haute suspicion de cancer digestif basée sur l'imagerie (excluant le cancer colorectal : utiliser le formulaire AH-702)",
"cote":"B",
"docs":[
{
"name":"Rapport IM",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"gastro-18",
"path":[],
"label":"Anti-Transglutaminase positif (non connu coeliaque)",
"cote":"D"
},
{
"id":"gastro-19",
"path":[],
"label":"Douleur abdominale sans symptôme d'alarme",
"cote":"E"
}
]
},
{
"key":"gyn",
"name":"Gynécologie",
"form":"Consultation en Gynécologie adulte",
"reasons":[
{
"id":"gyn-1",
"path":[
"Saignements utérins anormaux (SUA)"
],
"label":"Post-ménopausiques",
"cote":"C"
},
{
"id":"gyn-2",
"path":[
"Saignements utérins anormaux (SUA)",
"Pré-ménopausiques"
],
"label":"Hb < 80",
"cote":"C",
"docs":[
{
"name":"Hb, β-HCG",
"type":"dsq",
"auto":"DSQ"
},
{
"name":"Rapport d'échographie pelvienne",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"gyn-3",
"path":[
"Saignements utérins anormaux (SUA)",
"Pré-ménopausiques"
],
"label":"Hb entre 80 et 120",
"cote":"D",
"docs":[
{
"name":"Hb, β-HCG",
"type":"dsq",
"auto":"DSQ"
},
{
"name":"Rapport d'échographie pelvienne",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"gyn-4",
"path":[
"Saignements utérins anormaux (SUA)",
"Pré-ménopausiques"
],
"label":"Hb >120",
"cote":"E",
"docs":[
{
"name":"Hb, β-HCG",
"type":"dsq",
"auto":"DSQ"
},
{
"name":"Rapport d'échographie pelvienne",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"gyn-5",
"path":[],
"label":"Fibromes > 10 cm ou signes / symptômes compressifs",
"cote":"D",
"docs":[
{
"name":"Rapport d'échographie pelvienne",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"gyn-6",
"path":[],
"label":"Fibromes asymptomatiques et Hb normale",
"cote":"E",
"docs":[
{
"name":"Rapport d'échographie pelvienne",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"gyn-7",
"path":[
"Masse annexielle",
"Post-ménopausique"
],
"label":"Complexe",
"cote":null,
"docs":[
{
"name":"Rapport d'échographie pelvienne et CA-125",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"gyn-8",
"path":[
"Masse annexielle",
"Post-ménopausique"
],
"label":"Simple",
"cote":"D",
"docs":[
{
"name":"Rapport d'échographie pelvienne et CA-125",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"gyn-9",
"path":[
"Masse annexielle",
"Pré-ménopausique, masse persistante > 3 cm"
],
"label":"Complexe",
"cote":null,
"docs":[
{
"name":"2 rapports d'échographie pelvienne ≥ 2 mois d'intervalle",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"gyn-10",
"path":[
"Masse annexielle",
"Pré-ménopausique, masse persistante > 3 cm"
],
"label":"Simple",
"cote":"D",
"docs":[
{
"name":"2 rapports d'échographie pelvienne ≥ 2 mois d'intervalle",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"gyn-11",
"path":[
"Masse annexielle"
],
"label":"Avec ascite ou carcinomatose péritonéale",
"cote":"B",
"docs":[
{
"name":"Rapport d'imagerie",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"gyn-12",
"path":[
"Néoplasie"
],
"label":"Lésion vulvaire ou vaginale suspecte",
"cote":"C"
},
{
"id":"gyn-13",
"path":[
"Néoplasie"
],
"label":"Néoplasie de l'endomètre confirmée",
"cote":"B",
"docs":[
{
"name":"Rapport de pathologie",
"type":"document",
"auto":"Difficile"
}
]
},
{
"id":"gyn-14",
"path":[
"Polypes de l'endomètre"
],
"label":"Post-ménopausiques sans SUA",
"cote":"D"
},
{
"id":"gyn-15",
"path":[
"Polypes de l'endomètre"
],
"label":"Pré-ménopausiques",
"cote":"E"
},
{
"id":"gyn-16",
"path":[
"Polypes de l'endomètre"
],
"label":"Épaississement de l'endomètre > 11 mm post ménopausique",
"cote":"D",
"docs":[
{
"name":"Rapport échographie endovaginale",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"gyn-17",
"path":[
"Polypes de l'endomètre"
],
"label":"Polype du col avec cytologie normale",
"cote":"E"
},
{
"id":"gyn-18",
"path":[],
"label":"Pathologies vulvaires / vaginales bénignes",
"cote":"E"
},
{
"id":"gyn-19",
"path":[],
"label":"Vulvo-vaginites récidivantes et réfractaires",
"cote":"E"
},
{
"id":"gyn-20",
"path":[],
"label":"Dyspareunie ou vaginisme",
"cote":"E"
},
{
"id":"gyn-21",
"path":[],
"label":"Contraception complexe, ligature tubaire ou stérilet",
"cote":"E"
},
{
"id":"gyn-22",
"path":[],
"label":"Infertilité",
"cote":"E"
},
{
"id":"gyn-23",
"path":[],
"label":"Aménorrhée secondaire de > 6 mois",
"cote":"D",
"docs":[
{
"name":"TSH, PRL, LH, FSH, ß-HCG",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"gyn-24",
"path":[],
"label":"Ménopause complexe",
"cote":"E",
"docs":[
{
"name":"Justifier",
"type":"saisie",
"auto":"Impossible"
}
]
},
{
"id":"gyn-25",
"path":[],
"label":"Prolapsus génital symptomatique",
"cote":"E"
},
{
"id":"gyn-26",
"path":[],
"label":"Endométriose suspectée ou douleur pelvienne chronique (> 6 mois)",
"cote":"E",
"docs":[
{
"name":"Rapport d'échographie pelvienne",
"type":"dsq",
"auto":"DSQ"
}
]
}
]
},
{
"key":"geriatrie",
"name":"Gériatrie",
"form":"Consultation dirigée au Médecin gériatre",
"reasons":[
{
"id":"geriatrie-1",
"path":[
"Trouble neurocognitif"
],
"label":"Trouble neurocognitif majeur atypique",
"cote":"D",
"docs":[
{
"name":"Imagerie cérébrale",
"type":"dsq",
"auto":"DSQ"
},
{
"name":"MOCA ou MMSE",
"type":"outil",
"auto":"Difficile"
}
]
},
{
"id":"geriatrie-2",
"path":[
"Trouble neurocognitif"
],
"label":"Trouble neurocognitif majeur typique: préciser la problématique à évaluer",
"cote":"E",
"docs":[
{
"name":"MOCA ou MMSE",
"type":"outil",
"auto":"Difficile"
},
{
"name":"Imagerie cérébrale",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"geriatrie-3",
"path":[
"Trouble neurocognitif",
"«Trouble du comportement» SCPD sans antécédent de maladies psychiatriques (réfractaire aux interventions de l'équipe SCPD de première ligne si disponible)"
],
"label":"MAD potentiellement compromis à court terme",
"cote":"C",
"docs":[
{
"name":"Imagerie cérébrale",
"type":"dsq",
"auto":"DSQ"
},
{
"name":"MOCA ou MMSE",
"type":"outil",
"auto":"Difficile"
}
]
},
{
"id":"geriatrie-4",
"path":[
"Trouble neurocognitif"
],
"label":"MAD non compromis à court terme",
"cote":"D",
"docs":[
{
"name":"Imagerie cérébrale",
"type":"dsq",
"auto":"DSQ"
},
{
"name":"MOCA ou MMSE",
"type":"outil",
"auto":"Difficile"
}
]
},
{
"id":"geriatrie-5",
"path":[
"Trouble neurocognitif"
],
"label":"Chutes récurrentes non syncopales inexpliquées",
"cote":"C",
"docs":[
{
"name":"Rapport d'évaluation en physiothérapie",
"type":"document",
"auto":"Difficile"
}
]
},
{
"id":"geriatrie-6",
"path":[
"Autres"
],
"label":"Maltraitance : situation d'abus, négligence, etc",
"cote":"C",
"docs":[
{
"name":"Rapport d'évaluation psychosociale",
"type":"document",
"auto":"Difficile"
},
{
"name":"Imagerie cérébrale",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"geriatrie-7",
"path":[
"Autres"
],
"label":"Perte de poids inexpliquée chez usager > 75 ans après investigation appropriée",
"cote":"D"
},
{
"id":"geriatrie-8",
"path":[
"Autres"
],
"label":"Polypharmacie potentiellement néfaste/ Déprescription",
"cote":"D",
"docs":[
{
"name":"Profil pharmacologique à jour",
"type":"profil",
"auto":"Facile"
}
]
},
{
"id":"geriatrie-9",
"path":[
"Autres"
],
"label":"Trouble de la marche et de l'équilibre",
"cote":"D",
"docs":[
{
"name":"Imagerie cérébrale",
"type":"dsq",
"auto":"DSQ"
},
{
"name":"Rapport d'évaluation en physiothérapie",
"type":"document",
"auto":"Difficile"
}
]
}
]
},
{
"key":"hemato",
"name":"Hématologie",
"form":"Consultation en Hémato-Oncologie / Hématologie adulte",
"reasons":[
{
"id":"hemato-1",
"path":[
"Anémie sévère non ferriprive Hb < 85 g/L"
],
"label":"Avec autre cytopénie",
"cote":"B"
},
{
"id":"hemato-2",
"path":[
"Anémie sévère non ferriprive Hb < 85 g/L"
],
"label":"Sans autre cytopénie",
"cote":"C"
},
{
"id":"hemato-3",
"path":[
"Anémie inexpliquée"
],
"label":"Hb entre 85 g/L et 100 g/L",
"cote":"D",
"docs":[
{
"name":"Bilan martial, B12, créatinine, TSH",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"hemato-4",
"path":[
"Anémie inexpliquée"
],
"label":"Hb >= 100 g/L",
"cote":"E",
"docs":[
{
"name":"Bilan martial, B12, créatinine, TSH",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"hemato-5",
"path":[
"Polyglobulie"
],
"label":"Ht > 0,65 ou Hb > 200 g/L contrôlée",
"cote":"C"
},
{
"id":"hemato-6",
"path":[
"Polyglobulie"
],
"label":"Ht > 0,10 de + que la normale",
"cote":"E"
},
{
"id":"hemato-7",
"path":[],
"label":"Neutropénie < 0,5 x 10 ⁹/L (valeur absolue)",
"cote":"B"
},
{
"id":"hemato-8",
"path":[],
"label":"Neutropénie entre 0,5 et 1 x 10 ⁹/L (valeur absolue)",
"cote":"D"
},
{
"id":"hemato-9",
"path":[],
"label":"Neutropénie entre 1,1 et 1,5 x 10⁹/L (contrôlée après 3 mois)",
"cote":"E"
},
{
"id":"hemato-10",
"path":[],
"label":"G.B. > 20 x 10⁹/L avec myélémie",
"cote":"B"
},
{
"id":"hemato-11",
"path":[],
"label":"Neutrophilie contrôlée et inexpliquée",
"cote":"E"
},
{
"id":"hemato-12",
"path":[],
"label":"Lymphocytose avec cytopénie (Hb <100 g/L ou plaquettes <100 x 10⁹/L ou neutros < 1 x 10⁹/L) ou lymphocytose >100 x 10⁹/L",
"cote":"B"
},
{
"id":"hemato-13",
"path":[],
"label":"Lymphocytose de 30 à 100 x 10⁹/L",
"cote":"C"
},
{
"id":"hemato-14",
"path":[],
"label":"Lymphocytose < 30 x 10⁹/L",
"cote":"D"
},
{
"id":"hemato-15",
"path":[
"Plaquettes"
],
"label":"20-49 x 10⁹ /L",
"cote":"B"
},
{
"id":"hemato-16",
"path":[
"Plaquettes"
],
"label":"50-74 x 10⁹ /L",
"cote":"D"
},
{
"id":"hemato-17",
"path":[
"Plaquettes"
],
"label":"75-140 x 10⁹ /L contrôlée après 3 mois",
"cote":"E"
},
{
"id":"hemato-18",
"path":[
"Plaquettes"
],
"label":"450-699 x 10⁹ /L contrôlée et inexpliquée",
"cote":"E"
},
{
"id":"hemato-19",
"path":[
"Plaquettes"
],
"label":"700-999 x 10⁹ /L",
"cote":"C"
},
{
"id":"hemato-20",
"path":[
"Plaquettes"
],
"label":">= 1000 x 10⁹ /L",
"cote":"B"
},
{
"id":"hemato-21",
"path":[
"Hémostase",
"Diathèse hémorragique"
],
"label":"Avec tests anormaux (INR, PTT, fibrinogène ou temps de thrombine)",
"cote":"D"
},
{
"id":"hemato-22",
"path":[
"Hémostase",
"Diathèse hémorragique"
],
"label":"Avec tests normaux",
"cote":"E"
},
{
"id":"hemato-23",
"path":[
"Hémostase"
],
"label":"Thrombose récidivante ou site non usuel",
"cote":"D"
},
{
"id":"hemato-24",
"path":[
"Hémostase"
],
"label":"Suspicion de thrombophilie",
"cote":"E"
},
{
"id":"hemato-25",
"path":[
"Suspicion de néoplasie"
],
"label":"Suspicion de lymphome (ex. magma ganglionnaire significatif de taille > 5 cm ou symptôme B",
"cote":"B"
},
{
"id":"hemato-26",
"path":[
"Suspicion de néoplasie"
],
"label":"Ganglions augmentés en nombre et en taille",
"cote":"C"
},
{
"id":"hemato-27",
"path":[
"Suspicion de néoplasie"
],
"label":"Splénomégalie >15 cm sans cytopénie",
"cote":"C"
},
{
"id":"hemato-28",
"path":[
"Suspicion de néoplasie"
],
"label":"Lymphome confirmé",
"cote":"B",
"docs":[
{
"name":"Rapport de pathologie",
"type":"document",
"auto":"Difficile"
}
]
},
{
"id":"hemato-29",
"path":[
"Suspicion de néoplasie",
"Pic monoclonal"
],
"label":"Avec cytopénie (Hb < 100 g/L ou plaquettes <100 x 10⁹/L ou neutros < 1 x 10⁹/L) ou insuffisance rénale de novo ou hypercalcémie",
"cote":"B"
},
{
"id":"hemato-30",
"path":[
"Suspicion de néoplasie",
"Pic monoclonal"
],
"label":"> 15 g/ L",
"cote":"C"
},
{
"id":"hemato-31",
"path":[
"Suspicion de néoplasie",
"Pic monoclonal"
],
"label":"< 15 g / L sans cytopénie (Hb > 100 g/L et plaquettes >100 x 10⁹/L et neutros > 1 x 10⁹/L)",
"cote":"E"
},
{
"id":"hemato-32",
"path":[],
"label":"Pancytopénie ou bicytopénie (neutros < 1 x 10⁹/L, plaquettes < 75 x 10⁹/L, Hb < 85 g/L)",
"cote":"B"
},
{
"id":"hemato-33",
"path":[
"Ferritine augmentée avec HFE positif"
],
"label":"> 1000 mcg /L",
"cote":"D"
},
{
"id":"hemato-34",
"path":[
"Ferritine augmentée avec HFE positif"
],
"label":"< 1000 mcg /L",
"cote":"E"
},
{
"id":"hemato-35",
"path":[],
"label":"Hématologie obstétricale",
"cote":"C"
}
]
},
{
"key":"allergie",
"name":"Immuno-allergie",
"form":"Consultation en Immuno-Allergie adulte et Pédiatrique",
"reasons":[
{
"id":"allergie-1",
"path":[
"Rhinite/sinusite à répétition"
],
"label":"Évaluation et opinion thérapeutique",
"cote":"E"
},
{
"id":"allergie-2",
"path":[
"Rhinite/sinusite à répétition"
],
"label":"Dépistage d'allergie",
"cote":"E"
},
{
"id":"allergie-3",
"path":[
"Rhinite/sinusite à répétition"
],
"label":"Évaluation pour désensibilisation",
"cote":"E"
},
{
"id":"allergie-4",
"path":[
"Asthme"
],
"label":"Évaluation et opinion thérapeutique",
"cote":"E"
},
{
"id":"allergie-5",
"path":[
"Asthme"
],
"label":"Dépistage d'allergie",
"cote":"E"
},
{
"id":"allergie-6",
"path":[
"Asthme"
],
"label":"Évaluation pour désensibilisation",
"cote":"E"
},
{
"id":"allergie-7",
"path":[
"Allergies alimentaires",
"Âge < 2 ans"
],
"label":">= 2 aliments",
"cote":"D",
"docs":[
{
"name":"Spécifier l'aliment(s) suspecté(s)",
"type":"saisie",
"auto":"Impossible"
}
]
},
{
"id":"allergie-8",
"path":[
"Allergies alimentaires",
"Âge < 2 ans"
],
"label":"1 seul aliment",
"cote":"E",
"docs":[
{
"name":"Spécifier l'aliment(s) suspecté(s)",
"type":"saisie",
"auto":"Impossible"
}
]
},
{
"id":"allergie-9",
"path":[
"Allergies alimentaires"
],
"label":"Âge >= 2 ans",
"cote":"E",
"docs":[
{
"name":"Spécifier l'aliment(s) suspecté(s)",
"type":"saisie",
"auto":"Impossible"
}
]
},
{
"id":"allergie-10",
"path":[
"Anaphylaxie"
],
"label":">= 2 épisodes dans la dernière année",
"cote":"C",
"docs":[
{
"name":"Spécifier systèmes atteints",
"type":"saisie",
"auto":"Impossible"
}
]
},
{
"id":"allergie-11",
"path":[
"Anaphylaxie"
],
"label":"1er épisode",
"cote":"D",
"docs":[
{
"name":"Spécifier systèmes atteints",
"type":"saisie",
"auto":"Impossible"
}
]
},
{
"id":"allergie-12",
"path":[
"Anaphylaxie"
],
"label":"Allergies aux insectes avec réactions systémiques",
"cote":"D"
},
{
"id":"allergie-13",
"path":[
"Urticaire/Angioedème"
],
"label":"Urticaire chronique > 6 semaines (avec ou sans angioedème) non contrôlée avec 4 fois la dose d'antihistaminique de 2e génération",
"cote":"D"
},
{
"id":"allergie-14",
"path":[
"Urticaire/Angioedème"
],
"label":"Angioedème isolé malgré l'arrêt de l'IECA >= 2 épisodes",
"cote":"D"
},
{
"id":"allergie-15",
"path":[
"Immuno-déficience"
],
"label":"Si IgG anormal",
"cote":"D",
"docs":[
{
"name":"FSC, IgG, IgA, IgM",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"allergie-16",
"path":[
"Immuno-déficience"
],
"label":"Si IgG normal",
"cote":"E",
"docs":[
{
"name":"FSC, IgG, IgA, IgM",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"allergie-17",
"path":[],
"label":"Pénicilline",
"cote":"E",
"docs":[
{
"name":"Spécifier le(s) médicament(s) et la réaction",
"type":"saisie",
"auto":"Impossible"
}
]
},
{
"id":"allergie-18",
"path":[],
"label":"Autre médicament",
"cote":"E",
"docs":[
{
"name":"Spécifier le(s) médicament(s) et la réaction",
"type":"saisie",
"auto":"Impossible"
}
]
},
{
"id":"allergie-19",
"path":[],
"label":"Médication essentielle sans alternative ET besoin de prescrire dans un court délai (préciser)",
"cote":"C",
"docs":[
{
"name":"Spécifier le(s) médicament(s) et la réaction et besoin de prescrire dans un court délai",
"type":"saisie",
"auto":"Impossible"
}
]
}
]
},
{
"key":"infectio",
"name":"Infectiologie",
"form":"Consultation en Microbiologie-Infectiologie Maladies Infectieuses adulte",
"reasons":[
{
"id":"infectio-1",
"path":[],
"label":"Gestion d'infections urinaires récidivantes",
"cote":"C",
"docs":[
{
"name":"Résultats de cultures d’urine positives",
"type":"dsq",
"auto":"DSQ"
},
{
"name":"Traitements associés (en pièce jointe)",
"type":"profil",
"auto":"Facile"
}
]
},
{
"id":"infectio-2",
"path":[],
"label":"Gestion d'infections récidivantes à germes multi-résistants (ex: SARM, ERV, etc)",
"cote":"C"
},
{
"id":"infectio-3",
"path":[],
"label":"Gestion d'infection dans un contexte de multiples allergies aux antibiotiques",
"cote":"C"
},
{
"id":"infectio-4",
"path":[],
"label":"Gestion d'infections à C. difficile récurrentes",
"cote":"B"
},
{
"id":"infectio-5",
"path":[
"Sérologie positive",
"VIH"
],
"label":"Nouvellement diagnostiqué",
"cote":"B",
"docs":[
{
"name":"Résultat VIH",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"infectio-6",
"path":[
"Sérologie positive",
"VIH"
],
"label":"Usager connu",
"cote":"C",
"docs":[
{
"name":"Justifier la raison de consultation",
"type":"saisie",
"auto":"Impossible"
},
{
"name":"Prescrire décompte de CD4 et charge virale",
"type":"action",
"auto":"Impossible"
}
]
},
{
"id":"infectio-7",
"path":[],
"label":"Hépatite B chronique",
"cote":"C",
"docs":[
{
"name":"Résultat de sérologie",
"type":"dsq",
"auto":"DSQ"
},
{
"name":"Justifier la raison de consultation",
"type":"saisie",
"auto":"Impossible"
}
]
},
{
"id":"infectio-8",
"path":[],
"label":"Hépatite C",
"cote":"C",
"docs":[
{
"name":"Résultat de sérologie",
"type":"dsq",
"auto":"DSQ"
},
{
"name":"Justifier la raison de consultation",
"type":"saisie",
"auto":"Impossible"
}
]
},
{
"id":"infectio-9",
"path":[],
"label":"Syphilis",
"cote":"B",
"docs":[
{
"name":"Résultat de sérologie",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"infectio-10",
"path":[],
"label":"Autres sérologies (ex: toxo)",
"cote":"C",
"docs":[
{
"name":"Résultat de sérologie",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"infectio-11",
"path":[],
"label":"Herpes simplex récidivant",
"cote":"D"
},
{
"id":"infectio-12",
"path":[],
"label":"Parasitose intestinale confirmée",
"cote":"B",
"docs":[
{
"name":"Résultat de recherche de parasites",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"infectio-13",
"path":[],
"label":"Infection non sévère du pied diabétique",
"cote":"B"
},
{
"id":"infectio-14",
"path":[],
"label":"Possibilité de maladie tropicale sans atteinte de l'état général (excluant la malaria)",
"cote":"B"
},
{
"id":"infectio-15",
"path":[
"TB latente suspectée (non active et non contagieuse)"
],
"label":"Avec agent immunosuppresseur en cours ou à venir",
"cote":"B"
},
{
"id":"infectio-16",
"path":[
"TB latente suspectée (non active et non contagieuse)"
],
"label":"Contexte de dépistage",
"cote":"D"
},
{
"id":"infectio-17",
"path":[],
"label":"FUO (fièvre d'origine indéterminée depuis > 14 jours et bilan infectieux de base négatif incluant hémocultures)",
"cote":"B",
"docs":[
{
"name":"Résultats de laboratoire",
"type":"dsq",
"auto":"DSQ"
}
]
}
]
},
{
"key":"interne",
"name":"Médecine interne",
"form":"Consultation en Médecine interne adulte",
"reasons":[
{
"id":"interne-1",
"path":[
"Médecine vasculaire",
"Thrombose veineuse profonde ou embolie pulmonaire"
],
"label":"Évaluation post début de traitement (Dx confirmé avec traitement amorcé)",
"cote":"C",
"docs":[
{
"name":"Fournir le rapport d'examen",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"interne-2",
"path":[
"Médecine vasculaire",
"Thrombose veineuse profonde ou embolie pulmonaire"
],
"label":"Récidivante ou suspicion de thrombophilie",
"cote":"D"
},
{
"id":"interne-3",
"path":[
"Médecine vasculaire",
"Maladie artérielle vasculaire"
],
"label":"Carotidienne asymptomatique",
"cote":"D"
},
{
"id":"interne-4",
"path":[
"Médecine vasculaire",
"Maladie artérielle vasculaire"
],
"label":"Claudication intermittente stable",
"cote":"E"
},
{
"id":"interne-5",
"path":[
"Médecine vasculaire",
"Maladie artérielle vasculaire"
],
"label":"Claudication intermittente progressive",
"cote":"C"
},
{
"id":"interne-6",
"path":[],
"label":"Évaluation préopératoire ou pré intervention",
"cote":"D",
"docs":[
{
"name":"Prérequis: préciser le type d'intervention et le besoin",
"type":"saisie",
"auto":"Impossible"
},
{
"name":"Date prévue de l'intervention",
"type":"saisie",
"auto":"Impossible"
}
]
},
{
"id":"interne-7",
"path":[
"Grossesse",
"Condition(s) préalables(s) : (HTA, diabète, thrombose veineuse, collagénose,…)"
],
"label":"Évaluation pré grossesse",
"cote":"D"
},
{
"id":"interne-8",
"path":[
"Grossesse",
"Condition(s) préalables(s) : (HTA, diabète, thrombose veineuse, collagénose,…)"
],
"label":"Grossesse en cours",
"cote":"C"
},
{
"id":"interne-9",
"path":[
"Grossesse",
"Dysthyroïdie pendant la grossesse"
],
"label":"T4 anormale",
"cote":"B"
},
{
"id":"interne-10",
"path":[
"Grossesse",
"Dysthyroïdie pendant la grossesse"
],
"label":"T4 normale",
"cote":"C"
},
{
"id":"interne-11",
"path":[
"Grossesse",
"Hypertension pendant la grossesse",
"1er"
],
"label":"2e trimestre",
"cote":"C"
},
{
"id":"interne-12",
"path":[
"Grossesse",
"Hypertension pendant la grossesse"
],
"label":"3e trimestre",
"cote":"B"
},
{
"id":"interne-13",
"path":[
"Grossesse",
"Thrombocytopénie pendant la grossesse",
"1er"
],
"label":"2e trimestre",
"cote":"C"
},
{
"id":"interne-14",
"path":[
"Grossesse",
"Thrombocytopénie pendant la grossesse"
],
"label":"3e trimestre",
"cote":"B"
},
{
"id":"interne-15",
"path":[
"Grossesse"
],
"label":"Diabète gestationnel",
"cote":"B"
}
]
},
{
"key":"neurochir",
"name":"Neurochirurgie",
"form":"Consultation en Neurochirurgie adulte",
"reasons":[
{
"id":"neurochir-1",
"path":[
"Rachis cervico-dorsal"
],
"label":"Myélopathie compressive avec symptômes > 8 semaines",
"cote":"C",
"docs":[
{
"name":"Rapport d'IRM < 3 mois et autres rapports d'investigation",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"neurochir-2",
"path":[
"Rachis cervico-dorsal",
"Radiculopathie douloureuse ou sensitivo-motrice"
],
"label":"Avec symptômes sévères et limitation fonctionnelle (AVD/AVQ) > 8 semaines",
"cote":"D",
"docs":[
{
"name":"Rapport d'IRM < 3 mois et autres rapports d'investigation",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"neurochir-3",
"path":[
"Rachis cervico-dorsal",
"Radiculopathie douloureuse ou sensitivo-motrice"
],
"label":"Avec symptômes modérés chroniques > 8 semaines",
"cote":"E",
"docs":[
{
"name":"Rapport d'IRM < 3 mois et autres rapports d'investigation",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"neurochir-4",
"path":[
"Rachis cervico-dorsal"
],
"label":"Cervicalgie / dorsalgie avec instabilité anatomique, démontrée à l’imagerie, sans atteinte médullaire ou radiculaire",
"cote":"D",
"docs":[
{
"name":"Rapport d'imagerie et autres rapports d'investigation",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"neurochir-5",
"path":[
"Rachis lombo sacré",
"Radiculopathie douloureuse ou sensitivo-motrice ou claudication neurogénique"
],
"label":"Avec symptômes sévères et limitation fonctionnelle (AVD/AVQ) > 8 semaines",
"cote":"D",
"docs":[
{
"name":"Rapport d'IRM < 3 mois et autres rapports d'investigation",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"neurochir-6",
"path":[
"Rachis lombo sacré",
"Radiculopathie douloureuse ou sensitivo-motrice ou claudication neurogénique"
],
"label":"Avec symptômes modérés chroniques > 8 semaines",
"cote":"E",
"docs":[
{
"name":"Rapport d'IRM < 3 mois et autres rapports d'investigation",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"neurochir-7",
"path":[
"Rachis lombo sacré"
],
"label":"Lombalgie isolée sans atteinte radiculaire avec anomalie structurelle (scoliose, spondylolyse, spondylolisthésis)",
"cote":"E",
"docs":[
{
"name":"Rapport d'IRM < 3 mois et autres rapports d'investigation",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"neurochir-8",
"path":[],
"label":"Tumeurs extracérébrales: méningiome, neurinome, schwannome, tumeur hypophysaire, base ou voûte du crâne",
"cote":"D",
"docs":[
{
"name":"Rapport d'IRM ou TDM et autres rapports d'investigation",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"neurochir-9",
"path":[],
"label":"Anévrisme cérébral, malformation artério-veineuse fistule durale, angiome caverneux (sans hémorragie)",
"cote":"D",
"docs":[
{
"name":"Rapport d'IRM ou TDM et autres rapports d'investigation",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"neurochir-10",
"path":[],
"label":"Sténose carotidienne asymptomatique (>=70%)",
"cote":"D",
"docs":[
{
"name":"Rapport d'IRM et autres rapports d'investigation",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"neurochir-11",
"path":[],
"label":"Névralgie cranio-faciale (ex: trijumeau) réfractaire au traitement médical",
"cote":"D",
"docs":[
{
"name":"Rapport d'IRM et autres rapports d'investigation",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"neurochir-12",
"path":[],
"label":"Neuromodulation pour syndrome douloureux chronique ou pour spasticité",
"cote":"E",
"docs":[
{
"name":"Rapports d'investigation",
"type":"autre"
}
]
},
{
"id":"neurochir-13",
"path":[],
"label":"Hydrocéphalie chronique ou à pression normale",
"cote":"D",
"docs":[
{
"name":"Rapport d'imagerie et autres rapports d'investigation",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"neurochir-14",
"path":[],
"label":"Kyste intracrânien (ex: arachnoïdien, glande pinéale)",
"cote":"E",
"docs":[
{
"name":"Rapport d'IRM ou TDM et autres rapports d'investigation",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"neurochir-15",
"path":[],
"label":"Lésion osseuse crânienne d’aspect bénin (ex: kyste, malformation osseuse)",
"cote":"E",
"docs":[
{
"name":"Rapport d'IRM ou TDM et autres rapports d'investigation",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"neurochir-16",
"path":[
"Nerfs périphériques",
"Neuropathie compressive (ex: tunnel carpien ou canal cubital)"
],
"label":"Avec atteinte motrice",
"cote":"D",
"docs":[
{
"name":"Rapport d'EMG < 1 an et autres rapports d'investigation",
"type":"document",
"auto":"Difficile"
}
]
},
{
"id":"neurochir-17",
"path":[
"Nerfs périphériques",
"Neuropathie compressive (ex: tunnel carpien ou canal cubital)"
],
"label":"Sans atteinte motrice",
"cote":"E",
"docs":[
{
"name":"Rapport d'EMG < 1 an et autres rapports d'investigation",
"type":"document",
"auto":"Difficile"
}
]
},
{
"id":"neurochir-18",
"path":[
"Nerfs périphériques"
],
"label":"Tumeur d’un nerf périphérique",
"cote":"D",
"docs":[
{
"name":"IRM ou échographie < 3 mois",
"type":"dsq",
"auto":"DSQ"
}
]
}
]
},
{
"key":"neuro",
"name":"Neurologie",
"form":"Consultation en Neurologie adulte",
"reasons":[
{
"id":"neuro-1",
"path":[],
"label":"Symptômes neurologiques focaux transitoires suggestifs d'AIT (ICT) se présentant après > 14 jours",
"cote":"C"
},
{
"id":"neuro-2",
"path":[],
"label":"Symptômes neurologiques focaux transitoires excluant une parésie unilatérale et un trouble de la parole se présentant entre 48 heures et 14 jours",
"cote":"C"
},
{
"id":"neuro-3",
"path":[],
"label":"Tunnel carpien",
"cote":"E"
},
{
"id":"neuro-4",
"path":[],
"label":"Tunnel carpien AVEC impact fonctionnel au travail",
"cote":"D"
},
{
"id":"neuro-5",
"path":[],
"label":"Neuromusculaire : Maladie neuromusculaire avec atrophie, fasciculation, augm. CK ou suspicion myasthénie",
"cote":"C"
},
{
"id":"neuro-6",
"path":[],
"label":"Polyneuropathie",
"cote":"E"
},
{
"id":"neuro-7",
"path":[
"Radiculopathie avec déficit neuro (moteur ou sensitif) ou mononévrite isolée"
],
"label":"Incapacité fonctionnelle sévère (impact majeur pr AVD et AVQ et symptomatologie présente >= 3 sem. Et réfractaire tx conservateur)",
"cote":"C"
},
{
"id":"neuro-8",
"path":[
"Radiculopathie avec déficit neuro (moteur ou sensitif) ou mononévrite isolée"
],
"label":"Incapacité fonctionnelle modérée (ex. : impact sur sommeil, travail, loisirs)",
"cote":"D"
},
{
"id":"neuro-9",
"path":[
"Radiculopathie avec déficit neuro (moteur ou sensitif) ou mononévrite isolée"
],
"label":"Incapacité fonctionnelle légère et persistante",
"cote":"E"
},
{
"id":"neuro-10",
"path":[
"Épilepsie"
],
"label":"Convulsion de novo",
"cote":"B"
},
{
"id":"neuro-11",
"path":[
"Épilepsie",
"Épilepsie connue sans neurologue traitant"
],
"label":"Contrôlée/demande de réévaluation",
"cote":"E"
},
{
"id":"neuro-12",
"path":[
"Épilepsie",
"Épilepsie connue sans neurologue traitant"
],
"label":"Non contrôlée",
"cote":"C"
},
{
"id":"neuro-13",
"path":[
"Épilepsie",
"Épilepsie connue sans neurologue traitant"
],
"label":"Perte de conscience inexpliquée",
"cote":"D"
},
{
"id":"neuro-14",
"path":[],
"label":"Trouble neurocognitif majeur (seront vus en neuro les usagers avec symptômes atypiques ou progression rapide ou moins de 65 ans avec une justification)",
"cote":"D",
"docs":[
{
"name":"Justification",
"type":"saisie",
"auto":"Impossible"
},
{
"name":"Résultat du MMSE ou MOCA",
"type":"outil",
"auto":"Difficile"
},
{
"name":"Bilan sanguin incluant B12, TSH, VDRL et imagerie cérébrale",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"neuro-15",
"path":[],
"label":"Suspicion clinique de SEP excluant trouvaille fortuite d'anomalies à l'IRM",
"cote":"D",
"docs":[
{
"name":"Préciser symptômes, anomalies neuro et impact fonctionnel",
"type":"saisie",
"auto":"Impossible"
}
]
},
{
"id":"neuro-16",
"path":[
"SEP ou suspicion",
"Diagnostic confirmé (sans neurologue traitant) :"
],
"label":"Poussée active",
"cote":"B",
"docs":[
{
"name":"Préciser",
"type":"saisie",
"auto":"Impossible"
}
]
},
{
"id":"neuro-17",
"path":[
"SEP ou suspicion",
"Diagnostic confirmé (sans neurologue traitant) :"
],
"label":"Poussée récente",
"cote":"D",
"docs":[
{
"name":"Préciser",
"type":"saisie",
"auto":"Impossible"
}
]
},
{
"id":"neuro-18",
"path":[
"SEP ou suspicion",
"Diagnostic confirmé (sans neurologue traitant) :"
],
"label":"Maladie stable",
"cote":"E",
"docs":[
{
"name":"Préciser",
"type":"saisie",
"auto":"Impossible"
}
]
},
{
"id":"neuro-19",
"path":[],
"label":"Suspicion de parkinsonisme",
"cote":"D"
},
{
"id":"neuro-20",
"path":[],
"label":"Suspicion de parkinsonisme AVEC CHUTES",
"cote":"C"
},
{
"id":"neuro-21",
"path":[
"Troubles du mouvement",
"Tremblement :"
],
"label":"Tête",
"cote":"D"
},
{
"id":"neuro-22",
"path":[
"Troubles du mouvement",
"Tremblement :"
],
"label":"MS (bilat.)",
"cote":"E"
},
{
"id":"neuro-23",
"path":[
"Troubles du mouvement"
],
"label":"Autres troubles du mouvement",
"cote":"E",
"docs":[
{
"name":"Préciser type de troubles",
"type":"saisie",
"auto":"Impossible"
}
]
},
{
"id":"neuro-24",
"path":[
"Céphalée"
],
"label":"Migraine",
"cote":"D",
"docs":[
{
"name":"Prérequis : échec au tx abortif (Triptan) et 2 tx prophylactiques, histoire tx tentés (agent, dose, efficacité et durée)) (Souhaitable : raison de l'échec",
"type":"profil",
"auto":"Impossible"
}
],
"added":true
},
{
"id":"neuro-25",
"path":[
"Céphalée"
],
"label":"Suspicion céphalée de Horton (Cluster)",
"cote":"C",
"docs":[
{
"name":"Justifier manif. autonomiques",
"type":"saisie",
"auto":"Impossible"
}
],
"added":true
},
{
"id":"neuro-26",
"path":[
"Céphalée"
],
"label":"Névralgie du trijumeau",
"cote":"C",
"docs":[
{
"name":"Prérequis : décrire dlr paroxystique, territoire, zone gachette, etc.) (Souhaitable : tentative tx à la Carbamazépine",
"type":"saisie",
"auto":"Impossible"
}
],
"added":true
},
{
"id":"neuro-27",
"path":[
"Céphalée"
],
"label":"Autre type de céphalée primaires",
"cote":"E",
"docs":[
{
"name":"Justifier dx suspecté",
"type":"saisie",
"auto":"Impossible"
}
],
"added":true
}
]
},
{
"key":"nephro",
"name":"Néphrologie",
"form":"Consultation en Néphrologie adulte",
"reasons":[
{
"id":"nephro-1",
"path":[],
"label":"IRA significative : contrôlée dans un délai de 30 jours",
"cote":"C",
"docs":[
{
"name":"2 rapports de créatinine",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"nephro-2",
"path":[
"HTA"
],
"label":"Réfractaire malgré 3 médicaments et plus, incluant un diurétique",
"cote":"D"
},
{
"id":"nephro-3",
"path":[
"HTA"
],
"label":"Troubles électrolytiques et/ou acidose métabolique contrôlée à 2 reprises sur une période de 10 jours (après investigation et traitement)",
"cote":"D"
},
{
"id":"nephro-4",
"path":[
"IRC"
],
"label":"DFGe < 15 ml/min",
"cote":"B"
},
{
"id":"nephro-5",
"path":[
"IRC"
],
"label":"DFGe entre 16-45 ml/min stable",
"cote":"D"
},
{
"id":"nephro-6",
"path":[
"IRC"
],
"label":"DFGe entre 46-60 ml/min",
"cote":"E"
},
{
"id":"nephro-7",
"path":[
"Protéinurie (voir tableau d'équivalence)"
],
"label":"> 3 g/24 h avec hypoalbuminémie et anasarque",
"cote":"B",
"docs":[
{
"name":"Protéine/créat sur une miction (spot urinaire) ou collecte urinaire de 24 h",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"nephro-8",
"path":[
"Protéinurie (voir tableau d'équivalence)"
],
"label":"Grave",
"cote":"C",
"docs":[
{
"name":"Protéine/créat sur une miction (spot urinaire) ou collecte urinaire de 24 h",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"nephro-9",
"path":[
"Protéinurie (voir tableau d'équivalence)"
],
"label":"Modérée",
"cote":"D",
"docs":[
{
"name":"Protéine/créat sur une miction (spot urinaire) ou collecte urinaire de 24 h",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"nephro-10",
"path":[
"Protéinurie (voir tableau d'équivalence)"
],
"label":"Légère",
"cote":"E",
"docs":[
{
"name":"Protéine/créat sur une miction (spot urinaire) ou collecte urinaire de 24 h",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"nephro-11",
"path":[],
"label":"Évaluation métabolique pour lithiases rénales (2 épisodes et +)",
"cote":"E"
},
{
"id":"nephro-12",
"path":[],
"label":"Maladies génétiques rénales",
"cote":"E"
},
{
"id":"nephro-13",
"path":[],
"label":"Anomalie de l'anatomie rénale : Rein unique, polykystose, fer à cheval",
"cote":"E"
},
{
"id":"nephro-14",
"path":[],
"label":"Hématurie isolée après investigation urologique négative",
"cote":"E",
"docs":[
{
"name":"Créatinine, A/C urine",
"type":"dsq",
"auto":"DSQ"
}
]
}
]
},
{
"key":"orl",
"name":"ORL",
"form":"Consultation en ORL adulte et enfant",
"reasons":[
{
"id":"orl-1",
"path":[
"Otologie",
"Surdité"
],
"label":"Avec retard de langage chez l'enfant",
"cote":"D"
},
{
"id":"orl-2",
"path":[
"Otologie",
"Surdité"
],
"label":"Évaluation surdité chronique",
"cote":"E",
"docs":[
{
"name":"Audiogramme",
"type":"document",
"auto":"Difficile"
}
]
},
{
"id":"orl-3",
"path":[
"Otologie"
],
"label":"Otites à répétition ou séreuse persistante (depuis + 3 mois)",
"cote":"D"
},
{
"id":"orl-4",
"path":[
"Otologie"
],
"label":"Acouphène incommodant depuis plus de 6 mois",
"cote":"E",
"docs":[
{
"name":"Audiogramme",
"type":"document",
"auto":"Difficile"
}
]
},
{
"id":"orl-5",
"path":[
"Otologie",
"Vertiges"
],
"label":"Sévères, anormalement incapacitants avec examen neurologique normal",
"cote":"C"
},
{
"id":"orl-6",
"path":[
"Otologie",
"Vertiges"
],
"label":"Récidivants ou dont l'évolution sur plusieurs semaines est non favorable",
"cote":"D"
},
{
"id":"orl-7",
"path":[
"Otologie"
],
"label":"Paralysie faciale périphérique unilatérale (Débuter stéroïdes oraux et antiviraux",
"cote":"C"
},
{
"id":"orl-8",
"path":[
"Rhinosinusologie"
],
"label":"Épistaxis récidivante et chronique",
"cote":"D"
},
{
"id":"orl-9",
"path":[
"Rhinosinusologie"
],
"label":"Fracture nasale déplacée",
"cote":"B"
},
{
"id":"orl-10",
"path":[
"Rhinosinusologie"
],
"label":"Rhinosinusites chroniques ou sinusites à répétition (+ de 3 par année)",
"cote":"E"
},
{
"id":"orl-11",
"path":[
"Rhinosinusologie"
],
"label":"Rhinite chronique/obstruction nasale chronique/déviation septale",
"cote":"E"
},
{
"id":"orl-12",
"path":[
"Hypertrophie adéno-amygdalienne"
],
"label":"Avec suspicion d'apnée du sommeil depuis > 3 mois",
"cote":"D"
},
{
"id":"orl-13",
"path":[
"Hypertrophie adéno-amygdalienne"
],
"label":"Sans suspicion d'apnée du sommeil",
"cote":"E"
},
{
"id":"orl-14",
"path":[],
"label":"Amygdalites à répétition",
"cote":"E"
},
{
"id":"orl-15",
"path":[],
"label":"Nodule thyroïdien",
"cote":"D",
"docs":[
{
"name":"Prescrire TSH et écho",
"type":"action",
"auto":"Impossible"
}
]
},
{
"id":"orl-16",
"path":[
"Changement de la voix"
],
"label":"D'apparition récente, constant, et d'une durée > 4 semaines",
"cote":"C"
},
{
"id":"orl-17",
"path":[
"Changement de la voix"
],
"label":"Chronique ou intermittente",
"cote":"D"
},
{
"id":"orl-18",
"path":[
"Masse cervicale"
],
"label":"Suspecte de néoplasie maligne (Facteurs de risques : alcool, tabac, apparition récente ou croissance rapide)",
"cote":"B"
},
{
"id":"orl-19",
"path":[
"Masse cervicale"
],
"label":"Sans suspicion de critère de néoplasie maligne",
"cote":"D"
},
{
"id":"orl-20",
"path":[
"Lésion buccale"
],
"label":"Suspecte de néoplasie maligne",
"cote":"B"
},
{
"id":"orl-21",
"path":[
"Lésion buccale"
],
"label":"Bénigne",
"cote":"D"
},
{
"id":"orl-22",
"path":[],
"label":"Lésion cutanée de la tête ou du cou suspecte de néoplasie maligne non mélanocytaire",
"cote":"D"
}
]
},
{
"key":"onco",
"name":"Oncologie",
"form":"Consultation en Oncologie Médicale/Hémato-Oncologie Adulte",
"reasons":[
{
"id":"onco-1",
"path":[],
"label":"Néoplasie de novo",
"cote":"B",
"docs":[
{
"name":"Rapport(s) d'imagerie médicale (obligatoire)",
"type":"dsq",
"auto":"DSQ"
},
{
"name":"Rapport de pathologie (s'il y a lieu)",
"type":"document",
"auto":"Difficile"
},
{
"name":"Site du primaire (si connu) + Métastase(s) si connue(s)",
"type":"saisie",
"auto":"Impossible"
}
]
},
{
"id":"onco-2",
"path":[],
"label":"Suspicion de nouvelles métastases chez un usager avec une histoire de néoplasie antérieure sans suivi actif en oncologie",
"cote":"B",
"docs":[
{
"name":"Rapport(s) d'imagerie médicale (obligatoire)",
"type":"dsq",
"auto":"DSQ"
},
{
"name":"Rapport de pathologie (s'il y a lieu)",
"type":"document",
"auto":"Difficile"
},
{
"name":"Site du primaire (si connu) + Métastase(s) si connue(s)",
"type":"saisie",
"auto":"Impossible"
}
]
},
{
"id":"onco-3",
"path":[],
"label":"Situation clinique suspecte de néoplasie ou de métastases sans site primaire identifié",
"cote":"B",
"docs":[
{
"name":"Rapport(s) d'imagerie médicale (obligatoire)",
"type":"dsq",
"auto":"DSQ"
},
{
"name":"Rapport de pathologie (s'il y a lieu)",
"type":"document",
"auto":"Difficile"
},
{
"name":"Spécifier",
"type":"saisie",
"auto":"Impossible"
}
]
},
{
"id":"onco-4",
"path":[],
"label":"Réévaluation du traitement en l'absence de suivi actif en oncologie (ex: hormonothérapie)",
"cote":"E"
}
]
},
{
"key":"ophthal",
"name":"Ophtalmologie",
"form":"Consultation en Ophtalmologie adulte et enfant",
"reasons":[
{
"id":"ophthal-1",
"path":[
"Conjonctivite réfractaire au traitement depuis plus de 2 semaines"
],
"label":"Avec douleur",
"cote":"C",
"docs":[
{
"name":"Inscrire résultat acuité visuelle",
"type":"saisie",
"auto":"Impossible"
}
]
},
{
"id":"ophthal-2",
"path":[
"Conjonctivite réfractaire au traitement depuis plus de 2 semaines"
],
"label":"Sans douleur",
"cote":"D",
"docs":[
{
"name":"Inscrire résultat acuité visuelle",
"type":"saisie",
"auto":"Impossible"
}
]
},
{
"id":"ophthal-3",
"path":[
"Lésions palpébrales"
],
"label":"D'allure maligne",
"cote":"D"
},
{
"id":"ophthal-4",
"path":[
"Lésions palpébrales"
],
"label":"D'allure bénigne",
"cote":"E"
},
{
"id":"ophthal-5",
"path":[
"Pédiatrie",
"Strabisme chez l'enfant de 8 mois à 6 ans"
],
"label":"Déviation aiguë et constante",
"cote":"D"
},
{
"id":"ophthal-6",
"path":[
"Pédiatrie",
"Strabisme chez l'enfant de 8 mois à 6 ans"
],
"label":"Déviation intermittente",
"cote":"E"
},
{
"id":"ophthal-7",
"path":[
"Pédiatrie"
],
"label":"Dacryosténose persistante",
"cote":"D"
},
{
"id":"ophthal-8",
"path":[],
"label":"Zona ophtalmique avec oeil rouge ou baisse de vision",
"cote":"B",
"docs":[
{
"name":"Prérequis : débuter traitement antiviral et inscrire résultat acuité visuelle",
"type":"saisie",
"auto":"Impossible"
}
]
},
{
"id":"ophthal-9",
"path":[],
"label":"Usager traité pour glaucome chronique",
"cote":"D",
"docs":[
{
"name":"Joindre résultat pression oculaire (si disponible)",
"type":"document",
"auto":"Difficile"
},
{
"name":"Inscrire résultat acuité visuelle",
"type":"saisie",
"auto":"Impossible"
}
]
},
{
"id":"ophthal-10",
"path":[],
"label":"Rétinopathie diabétique documentée",
"cote":"E",
"docs":[
{
"name":"Rapport de l'optométriste",
"type":"document",
"auto":"Difficile"
},
{
"name":"Inscrire résultat acuité visuelle",
"type":"saisie",
"auto":"Impossible"
}
]
},
{
"id":"ophthal-11",
"path":[],
"label":"Prise de Hydroxuchloroquine (Plaquenil)",
"cote":"E",
"docs":[
{
"name":"Prérequis : Date début, Dose et inscrire résultat acuité visuelle",
"type":"saisie",
"auto":"Impossible"
}
]
},
{
"id":"ophthal-12",
"path":[],
"label":"Larmoiement chronique chez l'adulte",
"cote":"E",
"docs":[
{
"name":"Inscrire résultat acuité visuelle",
"type":"saisie",
"auto":"Impossible"
}
]
},
{
"id":"ophthal-13",
"path":[],
"label":"Cataracte documentée et symptomatique",
"cote":"E",
"docs":[
{
"name":"Rapport de l'optométriste",
"type":"document",
"auto":"Difficile"
},
{
"name":"Inscrire résultat acuité visuelle",
"type":"saisie",
"auto":"Impossible"
}
]
},
{
"id":"ophthal-14",
"path":[],
"label":"Chalazion significatif persistant",
"cote":"E",
"docs":[
{
"name":"Traitement médical amorcé DEPUIS 3 MOIS",
"type":"action",
"auto":"Impossible"
}
]
}
]
},
{
"key":"ortho",
"name":"Orthopédie",
"form":"Consultation en Orthopédie adulte",
"reasons":[
{
"id":"ortho-1",
"path":[],
"label":"Rupture complète de la coiffe des rotateurs aigüe prouvée à l'IRM ou à l'écho (usager < 50 ans)",
"cote":"C",
"docs":[
{
"name":"Rapport IRM ou écho",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"ortho-2",
"path":[],
"label":"Maladie de la coiffe des rotateurs (bursite, tendinite, accrochage, déchirure chronique coiffe des rotateurs, tendinose)",
"cote":"D",
"docs":[
{
"name":"Échec au traitement",
"type":"action",
"auto":"Impossible"
},
{
"name":"Rapport IRM ou écho",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"ortho-3",
"path":[],
"label":"Luxation récidivante épaule avec physiothérapie débutée",
"cote":"D",
"docs":[
{
"name":"Rapport RX, arthro-IRM",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"ortho-4",
"path":[],
"label":"Arthrose invalidante épaule",
"cote":"D",
"docs":[
{
"name":"Échec au traitement",
"type":"action",
"auto":"Impossible"
},
{
"name":"Rapport RX",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"ortho-5",
"path":[],
"label":"Rupture complète du tendon d'Achille",
"cote":"B"
},
{
"id":"ortho-6",
"path":[],
"label":"Entorse sévère persistante cheville (symptômes plus de 2 mois malgré immobilisation et physio)",
"cote":"C",
"docs":[
{
"name":"Rapport RX et IRM",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"ortho-7",
"path":[],
"label":"Arthrose invalidante cheville",
"cote":"D",
"docs":[
{
"name":"Échec au traitement",
"type":"action",
"auto":"Impossible"
},
{
"name":"Rapport RX",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"ortho-8",
"path":[],
"label":"Hallux valgus ou orteils marteau symptomatiques",
"cote":"E",
"docs":[
{
"name":"Rapport RX",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"ortho-9",
"path":[],
"label":"Rupture complète du tendon biceps distal",
"cote":"B"
},
{
"id":"ortho-10",
"path":[],
"label":"Épicondylite et épitrochléite",
"cote":"D",
"docs":[
{
"name":"Échec au traitement",
"type":"action",
"auto":"Impossible"
},
{
"name":"Rapport écho ou IRM",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"ortho-11",
"path":[
"Rupture complète du tendon"
],
"label":"Rotulien",
"cote":"B"
},
{
"id":"ortho-12",
"path":[
"Rupture complète du tendon"
],
"label":"Quadriceps",
"cote":"B"
},
{
"id":"ortho-13",
"path":[],
"label":"Rupture ligament croisé avec physiothérapie initiée",
"cote":"C",
"docs":[
{
"name":"Rapport IRM",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"ortho-14",
"path":[],
"label":"Déchirure méniscale aiguë ou traumatique (< 60 ans)",
"cote":"D",
"docs":[
{
"name":"Rapport IRM",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"ortho-15",
"path":[],
"label":"Arthrose invalidante du genou",
"cote":"D",
"docs":[
{
"name":"Échec au traitement",
"type":"action",
"auto":"Impossible"
},
{
"name":"Rapport RX",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"ortho-16",
"path":[],
"label":"Fracture aiguë mineure non déplacée immobilisée ou subluxation aiguë",
"cote":"B",
"docs":[
{
"name":"Rapport RX",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"ortho-17",
"path":[],
"label":"Néoplasie musculo-squelettique",
"cote":"B",
"docs":[
{
"name":"Rapport RX",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"ortho-18",
"path":[],
"label":"Entorse sévère persistante poignet (symptômes plus de 2 mois malgré attelle et physio)",
"cote":"C",
"docs":[
{
"name":"Rapport RX et IRM",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"ortho-19",
"path":[],
"label":"Arthrose invalidante hanche",
"cote":"D",
"docs":[
{
"name":"Échec au traitement",
"type":"action",
"auto":"Impossible"
},
{
"name":"Rapport RX",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"ortho-20",
"path":[],
"label":"Syndrome du tunnel carpien ou tunnel cubital confirmé à EMG",
"cote":"C",
"docs":[
{
"name":"Rapport EMG",
"type":"document",
"auto":"Difficile"
}
]
}
]
},
{
"key":"physiatrie",
"name":"Physiatrie",
"form":"Consultation en Physiatrie adulte Médecine physique et Réadaptation",
"reasons":[
{
"id":"physiatrie-1",
"path":[],
"label":"Cervicalgie",
"cote":null,
"docs":[
{
"name":"Rapport RX",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"physiatrie-2",
"path":[],
"label":"Cervico-brachialgie",
"cote":null,
"docs":[
{
"name":"Rapport RX et IRM souhaitable",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"physiatrie-3",
"path":[],
"label":"Dorso-Lombalgie",
"cote":null,
"docs":[
{
"name":"Rapport RX",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"physiatrie-4",
"path":[],
"label":"Lombo-sciatalgie",
"cote":null,
"docs":[
{
"name":"Rapport RX, TDM ou IRM souhaitable",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"physiatrie-5",
"path":[],
"label":"Syndromes compressifs des nerfs périphériques",
"cote":null,
"docs":[
{
"name":"Rapport RX",
"type":"dsq",
"auto":"DSQ"
},
{
"name":"EMG",
"type":"document",
"auto":"Difficile"
},
{
"name":"Préciser l'atteinte",
"type":"saisie",
"auto":"Impossible"
}
]
},
{
"id":"physiatrie-6",
"path":[],
"label":"Atteinte de l'épaule",
"cote":null,
"docs":[
{
"name":"Rapport RX",
"type":"dsq",
"auto":"DSQ"
},
{
"name":"Préciser l'atteinte",
"type":"saisie",
"auto":"Impossible"
}
]
},
{
"id":"physiatrie-7",
"path":[],
"label":"Atteinte du poignet ou de la main ou du coude",
"cote":null,
"docs":[
{
"name":"Rapport RX",
"type":"dsq",
"auto":"DSQ"
},
{
"name":"Préciser l'atteinte",
"type":"saisie",
"auto":"Impossible"
}
]
},
{
"id":"physiatrie-8",
"path":[],
"label":"Atteinte de la hanche",
"cote":null,
"docs":[
{
"name":"Rapport RX",
"type":"dsq",
"auto":"DSQ"
},
{
"name":"Préciser l'atteinte",
"type":"saisie",
"auto":"Impossible"
}
]
},
{
"id":"physiatrie-9",
"path":[],
"label":"Atteinte du genou",
"cote":null,
"docs":[
{
"name":"Rapport RX",
"type":"dsq",
"auto":"DSQ"
},
{
"name":"Préciser l'atteinte",
"type":"saisie",
"auto":"Impossible"
}
]
},
{
"id":"physiatrie-10",
"path":[],
"label":"Atteinte de la cheville ou du pied",
"cote":null,
"docs":[
{
"name":"Rapport RX",
"type":"dsq",
"auto":"DSQ"
},
{
"name":"Préciser l'atteinte",
"type":"saisie",
"auto":"Impossible"
}
]
},
{
"id":"physiatrie-11",
"path":[],
"label":"Autre",
"cote":null,
"docs":[
{
"name":"Présicer",
"type":"saisie",
"auto":"Impossible"
}
]
}
]
},
{
"key":"pneumo",
"name":"Pneumologie",
"form":"Consultation en Pneumologie adulte",
"reasons":[
{
"id":"pneumo-1",
"path":[
"Suspicion de néoplasie"
],
"label":"Hémoptysie persistante",
"cote":"B"
},
{
"id":"pneumo-2",
"path":[
"Suspicion de néoplasie",
"Nodule ou lésion suspecte sans néoplasie connue"
],
"label":"> 15 mm",
"cote":"B",
"docs":[
{
"name":"Rapport TDM",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"pneumo-3",
"path":[
"Suspicion de néoplasie",
"Nodule ou lésion suspecte sans néoplasie connue"
],
"label":"8-15 mm",
"cote":"C",
"docs":[
{
"name":"Rapport TDM",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"pneumo-4",
"path":[
"Suspicion de néoplasie"
],
"label":"Épanchement pleural nouveau, unilatéral et symptomatique",
"cote":"B"
},
{
"id":"pneumo-5",
"path":[
"Suspicion de néoplasie"
],
"label":"Micronodule < 8 mm ÉVOLUTIF à la TDM de suivi",
"cote":"D"
},
{
"id":"pneumo-6",
"path":[
"Suspicion de néoplasie"
],
"label":"Adénopathie médiastinale ou hilaire > 1 cm",
"cote":"C"
},
{
"id":"pneumo-7",
"path":[],
"label":"Infiltrat persistant ou lentement résolutif (> 1 mois) à la radiographie pulmonnaire malgré traitement",
"cote":"C"
},
{
"id":"pneumo-8",
"path":[],
"label":"Bronchiectasies symptomatiques",
"cote":"D"
},
{
"id":"pneumo-9",
"path":[],
"label":"Toux chronique (> 8 semaines) avec radiographie pulmonaire normale",
"cote":"E"
},
{
"id":"pneumo-10",
"path":[
"Exacerbation aiguë avec échec du plan d'action (corticothérapie orale ou antibiothérapie)"
],
"label":"MPOC",
"cote":"B",
"docs":[
{
"name":"Détailler traitement",
"type":"saisie",
"auto":"Impossible"
}
]
},
{
"id":"pneumo-11",
"path":[
"Exacerbation aiguë avec échec du plan d'action (corticothérapie orale ou antibiothérapie)"
],
"label":"Asthme",
"cote":"B",
"docs":[
{
"name":"Détailler traitement",
"type":"saisie",
"auto":"Impossible"
}
]
},
{
"id":"pneumo-12",
"path":[
"MPOC/Asthme suspecté ou MPOC réponse inadéquate au traitement de base"
],
"label":"MPOC",
"cote":"E",
"docs":[
{
"name":"Spirométrie",
"type":"document",
"auto":"Difficile"
}
]
},
{
"id":"pneumo-13",
"path":[
"MPOC/Asthme suspecté ou MPOC réponse inadéquate au traitement de base"
],
"label":"Asthme",
"cote":"E",
"docs":[
{
"name":"Spirométrie",
"type":"document",
"auto":"Difficile"
}
]
},
{
"id":"pneumo-14",
"path":[],
"label":"Réadaptation respiratoire",
"cote":"E"
},
{
"id":"pneumo-15",
"path":[
"Apnée obstructive du sommeil suspectée ou traitée ET hypersomnolence diurne sévère OU EPWORTH ≥ 15 OU Index de désaturation (IDO) ≥ 30 /h"
],
"label":"AVEC métier à risque",
"cote":"C",
"docs":[
{
"name":"Justifier",
"type":"saisie",
"auto":"Impossible"
}
]
},
{
"id":"pneumo-16",
"path":[
"Apnée obstructive du sommeil suspectée ou traitée ET hypersomnolence diurne sévère OU EPWORTH ≥ 15 OU Index de désaturation (IDO) ≥ 30 /h"
],
"label":"SANS métier à risque",
"cote":"D",
"docs":[
{
"name":"Justifier",
"type":"saisie",
"auto":"Impossible"
}
]
},
{
"id":"pneumo-17",
"path":[],
"label":"Apnée du sommeil suspectée ou réévaluation de traitement",
"cote":"E"
},
{
"id":"pneumo-18",
"path":[],
"label":"Dyspnée d'effort inexpliquée (non cardiaque, sans anémie avec radiographie pulmonaire normale)",
"cote":"E",
"docs":[
{
"name":"Justifier",
"type":"saisie",
"auto":"Impossible"
}
]
},
{
"id":"pneumo-19",
"path":[],
"label":"Maladies pulmonaires interstitielles (ex. : fibrose)",
"cote":"D",
"docs":[
{
"name":"Rapport TDM",
"type":"dsq",
"auto":"DSQ"
}
]
}
]
},
{
"key":"psy",
"name":"Psychiatrie",
"form":"Consultation en Psychiatrie adulte",
"reasons":[
{
"id":"psy-1",
"path":[],
"label":"Dépression récurrente ou réfractaire aux traitements à dose optimale",
"cote":null,
"docs":[
{
"name":"Bilan de base, TSH",
"type":"dsq",
"auto":"DSQ"
},
{
"name":"Histoire pharmacologique",
"type":"saisie",
"auto":"Impossible"
}
]
},
{
"id":"psy-2",
"path":[],
"label":"Trouble anxieux réfractaire aux traitements à dose optimale",
"cote":null,
"docs":[
{
"name":"Bilan de base, TSH",
"type":"dsq",
"auto":"DSQ"
},
{
"name":"Histoire pharmacologique",
"type":"saisie",
"auto":"Impossible"
}
]
},
{
"id":"psy-3",
"path":[],
"label":"Trouble de personnalité, réfractaire à une approche psychologique d'un intervenant de première ligne",
"cote":null
},
{
"id":"psy-4",
"path":[],
"label":"Troubles de comportement ou de l'humeur associés à des troubles cognitifs",
"cote":null,
"docs":[
{
"name":"MOCA Folstein",
"type":"outil",
"auto":"Difficile"
}
]
},
{
"id":"psy-5",
"path":[],
"label":"PREMIER ÉPISODE psychotique ou de manie psychotique",
"cote":null,
"docs":[
{
"name":"Si possible, dosage de cannabis, cocaïne et amphétamines",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"psy-6",
"path":[],
"label":"Psychose ou manie",
"cote":null,
"docs":[
{
"name":"Bilan de base, TSH",
"type":"dsq",
"auto":"DSQ"
},
{
"name":"Histoire pharmacologique",
"type":"saisie",
"auto":"Impossible"
}
]
},
{
"id":"psy-7",
"path":[],
"label":"TDAH chez l'adulte réfractaire ou atypique",
"cote":null,
"docs":[
{
"name":"Questionnaire de dépistage CADDRA",
"type":"outil",
"auto":"Difficile"
}
]
},
{
"id":"psy-8",
"path":[],
"label":"Toxicomanie en comorbidité avec un trouble psychiatrique",
"cote":null,
"docs":[
{
"name":"Substance",
"type":"saisie",
"auto":"Impossible"
}
]
},
{
"id":"psy-9",
"path":[],
"label":"Autre",
"cote":null,
"docs":[
{
"name":"Préciser",
"type":"saisie",
"auto":"Impossible"
}
]
}
]
},
{
"key":"pedia",
"name":"Pédiatrie",
"form":"Consultation en Pédiatrie générale",
"reasons":[
{
"id":"pedia-1",
"path":[
"Irritabilité",
"Troubles d'alimentation"
],
"label":"Âge < 1 mois",
"cote":"B",
"docs":[
{
"name":"Courbes de croissance",
"type":"courbes",
"auto":"Facile"
}
]
},
{
"id":"pedia-2",
"path":[
"Irritabilité",
"Troubles d'alimentation"
],
"label":"Âge 1-6 mois",
"cote":"C",
"docs":[
{
"name":"Courbes de croissance",
"type":"courbes",
"auto":"Facile"
}
]
},
{
"id":"pedia-3",
"path":[
"Irritabilité",
"Troubles d'alimentation"
],
"label":"Âge > 6 mois",
"cote":"D",
"docs":[
{
"name":"Courbes de croissance",
"type":"courbes",
"auto":"Facile"
}
]
},
{
"id":"pedia-4",
"path":[
"Toux chronique/Asthme"
],
"label":"Âge <= 6 mois",
"cote":"C",
"docs":[
{
"name":"Calendrier des symptômes",
"type":"note",
"auto":"Impossible"
},
{
"name":"Courbes de croissance",
"type":"courbes",
"auto":"Facile"
}
]
},
{
"id":"pedia-5",
"path":[
"Toux chronique/Asthme"
],
"label":"Âge > 6 mois",
"cote":"D",
"docs":[
{
"name":"Calendrier des symptômes",
"type":"note",
"auto":"Impossible"
},
{
"name":"Courbes de croissance",
"type":"courbes",
"auto":"Facile"
}
]
},
{
"id":"pedia-6",
"path":[
"Retard de croissance statural et/ou pondéral"
],
"label":"Âge <= 1 an",
"cote":"C",
"docs":[
{
"name":"Courbes de croissance",
"type":"courbes",
"auto":"Facile"
}
]
},
{
"id":"pedia-7",
"path":[
"Retard de croissance statural et/ou pondéral"
],
"label":"Âge > 1 an",
"cote":"D",
"docs":[
{
"name":"Courbes de croissance",
"type":"courbes",
"auto":"Facile"
}
]
},
{
"id":"pedia-8",
"path":[
"Souffle cardiaque (enfant stable)"
],
"label":"Âge < 1 mois",
"cote":"B",
"docs":[
{
"name":"Courbes de croissance",
"type":"courbes",
"auto":"Facile"
}
]
},
{
"id":"pedia-9",
"path":[
"Souffle cardiaque (enfant stable)"
],
"label":"Âge 1-3 mois",
"cote":"C",
"docs":[
{
"name":"Courbes de croissance",
"type":"courbes",
"auto":"Facile"
}
]
},
{
"id":"pedia-10",
"path":[
"Souffle cardiaque (enfant stable)"
],
"label":"Âge > 3 mois",
"cote":"D",
"docs":[
{
"name":"Courbes de croissance",
"type":"courbes",
"auto":"Facile"
}
]
},
{
"id":"pedia-11",
"path":[
"Céphalée"
],
"label":"De novo avec vomissements et examen neurologique normal",
"cote":"B",
"docs":[
{
"name":"Calendrier des symptômes",
"type":"note",
"auto":"Impossible"
},
{
"name":"Courbes de croissance",
"type":"courbes",
"auto":"Facile"
}
]
},
{
"id":"pedia-12",
"path":[
"Céphalée"
],
"label":"Migraine",
"cote":"C",
"docs":[
{
"name":"Calendrier des symptômes",
"type":"note",
"auto":"Impossible"
},
{
"name":"Courbes de croissance",
"type":"courbes",
"auto":"Facile"
}
]
},
{
"id":"pedia-13",
"path":[
"Céphalée"
],
"label":"Chronique",
"cote":"D",
"docs":[
{
"name":"Calendrier des symptômes",
"type":"note",
"auto":"Impossible"
},
{
"name":"Courbes de croissance",
"type":"courbes",
"auto":"Facile"
}
]
},
{
"id":"pedia-14",
"path":[],
"label":"Douleur abdominale chronique/Diarrhée chronique/constipation",
"cote":"D",
"docs":[
{
"name":"Calendrier des symptômes",
"type":"note",
"auto":"Impossible"
},
{
"name":"Courbes de croissance",
"type":"courbes",
"auto":"Facile"
}
]
},
{
"id":"pedia-15",
"path":[],
"label":"Infections à répétition : respiratoires, urinaires et autres",
"cote":"D",
"docs":[
{
"name":"Rapport imagerie médicale",
"type":"dsq",
"auto":"DSQ"
},
{
"name":"Courbes de croissance",
"type":"courbes",
"auto":"Facile"
}
]
},
{
"id":"pedia-16",
"path":[],
"label":"Retard de développement chez un enfant 0-5 ans",
"cote":"D",
"docs":[
{
"name":"Courbe de périmètre crânien",
"type":"courbes",
"auto":"Facile"
},
{
"name":"Évaluation orthophonique et audiogramme demandés si retard de langage",
"type":"action",
"auto":"Impossible"
},
{
"name":"Courbes de croissance",
"type":"courbes",
"auto":"Facile"
},
{
"name":"Courbes de croissance",
"type":"courbes",
"auto":"Facile"
}
]
},
{
"id":"pedia-17",
"path":[
"Évaluation trouble scolaire"
],
"label":"TDAH",
"cote":"E",
"docs":[
{
"name":"Évaluation SNAP",
"type":"outil",
"auto":"Difficile"
},
{
"name":"Connors ou questionnaire Poulin ou évaluation psychosociale",
"type":"note",
"auto":"Impossible"
},
{
"name":"Courbes de croissance",
"type":"courbes",
"auto":"Facile"
},
{
"name":"Courbes de croissance",
"type":"courbes",
"auto":"Facile"
}
]
},
{
"id":"pedia-18",
"path":[],
"label":"Troubles de comportement",
"cote":"E",
"docs":[
{
"name":"Rapport évaluation psychosociale demandée",
"type":"action",
"auto":"Impossible"
},
{
"name":"Courbes de croissance",
"type":"courbes",
"auto":"Facile"
}
]
},
{
"id":"pedia-19",
"path":[],
"label":"Anomalie du crâne/plagiocéphalie",
"cote":"C",
"docs":[
{
"name":"Courbes de croissance",
"type":"courbes",
"auto":"Facile"
}
]
},
{
"id":"pedia-20",
"path":[],
"label":"Problèmes cutanés",
"cote":"D",
"docs":[
{
"name":"Préciser",
"type":"saisie",
"auto":"Impossible"
},
{
"name":"Courbes de croissance",
"type":"courbes",
"auto":"Facile"
}
]
},
{
"id":"pedia-21",
"path":[],
"label":"Énurésie",
"cote":"E",
"docs":[
{
"name":"Courbes de croissance",
"type":"courbes",
"auto":"Facile"
}
]
},
{
"id":"pedia-22",
"path":[],
"label":"Phimosis",
"cote":"E",
"docs":[
{
"name":"Courbes de croissance",
"type":"courbes",
"auto":"Facile"
}
]
}
]
},
{
"key":"rhuma",
"name":"Rhumatologie",
"form":"Consultation en Rhumatologie adulte",
"reasons":[
{
"id":"rhuma-1",
"path":[
"Arthropathie inflammatoire (excluant arthrose)",
"Synovite(s) aiguë(s) < 6 sem."
],
"label":"Monoarthrite ou oligoarthrite ou polyarthrite inexpliquée",
"cote":"D",
"docs":[
{
"name":"FSC, CRP, créatinine, acide urique, RX",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"rhuma-2",
"path":[
"Arthropathie inflammatoire (excluant arthrose)",
"Synovite(s) aiguë(s) < 6 sem."
],
"label":"Goutte récidivante malgré traitement standard ou goutte tophacée",
"cote":"D",
"docs":[
{
"name":"FSC, CRP, créatinine, acide urique, RX",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"rhuma-3",
"path":[
"Arthropathie inflammatoire (excluant arthrose)",
"Synovite(s) aiguë(s) < 6 sem."
],
"label":"Arthrite avec suspicion de pseudogoutte ou hydroxyapatite",
"cote":"D",
"docs":[
{
"name":"FSC, CRP, créatinine, acide urique, RX",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"rhuma-4",
"path":[
"Arthropathie inflammatoire (excluant arthrose)",
"Synovite(s) chronique(s) > 6 sem. Facteur rhumatoïde ou anti-CCP ou érosions radiologiques ou CRP augmentée"
],
"label":"Présence",
"cote":"C",
"docs":[
{
"name":"FSC, CRP, créatinine, ALT, facteur rhumatoïde, anti-CCP, RX",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"rhuma-5",
"path":[
"Arthropathie inflammatoire (excluant arthrose)",
"Synovite(s) chronique(s) > 6 sem. Facteur rhumatoïde ou anti-CCP ou érosions radiologiques ou CRP augmentée"
],
"label":"Absence",
"cote":"D",
"docs":[
{
"name":"FSC, CRP, créatinine, ALT, facteur rhumatoïde, anti-CCP, RX",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"rhuma-6",
"path":[
"Arthropathie inflammatoire (excluant arthrose)",
"Spondylo-arthropathie inflammatoire Antécédent d'uvéite ou de psoriasis ou de maladie inflammatoire intestinale ou d'ITSS récente ou d'une sacro-iliite à l'imagerie"
],
"label":"Présence",
"cote":null,
"docs":[
{
"name":"HLA-B27, RX des sacro-iliaques",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"rhuma-7",
"path":[
"Arthropathie inflammatoire (excluant arthrose)",
"Spondylo-arthropathie inflammatoire Antécédent d'uvéite ou de psoriasis ou de maladie inflammatoire intestinale ou d'ITSS récente ou d'une sacro-iliite à l'imagerie"
],
"label":"Absence",
"cote":null,
"docs":[
{
"name":"HLA-B27, RX des sacro-iliaques",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"rhuma-8",
"path":[
"Collagénose ou vasculite"
],
"label":"Polymyalgia rheumatica de novo ou rechute sans symptômes d'artérite temporale",
"cote":null,
"docs":[
{
"name":"FSC, VS, CRP",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"rhuma-9",
"path":[
"Collagénose ou vasculite"
],
"label":"Myopathie inflammatoire avec CK élevés",
"cote":"C",
"docs":[
{
"name":"CK, TSH",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"rhuma-10",
"path":[
"Collagénose ou vasculite"
],
"label":"Vasculite autre que l'artérite temporale sans atteinte sévère d'organe",
"cote":"C",
"docs":[
{
"name":"FSC, CRP, créatinine, analyse d'urine, RX pulmonaire",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"rhuma-11",
"path":[
"Collagénose ou vasculite",
"Collagénose sans atteinte sévère d'organe"
],
"label":"FAN >= 1/160",
"cote":"D",
"docs":[
{
"name":"FSC, CRP, créatinine, analyse d'urine",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"rhuma-12",
"path":[
"Collagénose ou vasculite",
"Collagénose sans atteinte sévère d'organe"
],
"label":"FAN < 1/160",
"cote":"E",
"docs":[
{
"name":"FSC, CRP, créatinine, ALT, facteur rhumatoïde, anti-CCP, RX",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"rhuma-13",
"path":[
"Collagénose ou vasculite"
],
"label":"Phénomène de Raynaud isolé avec FAN >= 1/160",
"cote":"E"
},
{
"id":"rhuma-14",
"path":[
"Collagénose ou vasculite"
],
"label":"Collagénose ou vasculite connue et stable",
"cote":"E",
"docs":[
{
"name":"Justifier",
"type":"saisie",
"auto":"Impossible"
}
]
},
{
"id":"rhuma-15",
"path":[
"Maladie osseuse",
"Ostéoporose"
],
"label":"Échec thérapeutique",
"cote":"E",
"docs":[
{
"name":"25(OH) vitamine D, DMO",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"rhuma-16",
"path":[
"Maladie osseuse"
],
"label":"Secondaire",
"cote":"E",
"docs":[
{
"name":"25(OH) vitamine D, DM",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"rhuma-17",
"path":[
"Maladie osseuse"
],
"label":"Maladie de Paget",
"cote":"E",
"docs":[
{
"name":"Phosphatase alcaline, RX, scintigraphie osseuse",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"rhuma-18",
"path":[],
"label":"Fibromyalgie avec PROBLÉMATIQUE DIAGNOSTIQUE et non thérapeutique",
"cote":"E",
"docs":[
{
"name":"FSC, CRP, CK, TSH",
"type":"dsq",
"auto":"DSQ"
},
{
"name":"Justifier",
"type":"saisie",
"auto":"Impossible"
}
]
},
{
"id":"rhuma-19",
"path":[],
"label":"Arthrose INVALIDANTE NON-AXIALE avec échec au traitement",
"cote":"E",
"docs":[
{
"name":"Rx",
"type":"dsq",
"auto":"DSQ"
},
{
"name":"Justifier",
"type":"saisie",
"auto":"Impossible"
}
]
}
]
},
{
"key":"uro",
"name":"Urologie",
"form":"Consultation en Urologie adulte et enfant",
"reasons":[
{
"id":"uro-1",
"path":[],
"label":"Calcul urétéral",
"cote":"C",
"docs":[
{
"name":"A/C urine, créatinine, RX abdominal, uroscan",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"uro-2",
"path":[],
"label":"Calcul rénal ou vésical asymptomatique",
"cote":"D",
"docs":[
{
"name":"A/C urine, créatinine, RX abdominal, uroscan",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"uro-3",
"path":[],
"label":"Infection urinaire chez l'homme",
"cote":"D",
"docs":[
{
"name":"A/C urine",
"type":"dsq",
"auto":"DSQ"
},
{
"name":"Écho rénale et pelvienne demandée",
"type":"action",
"auto":"Impossible"
}
]
},
{
"id":"uro-4",
"path":[],
"label":"Infections urinaires basses récidivantes chez la femme (+ de 4 par année)",
"cote":"E",
"docs":[
{
"name":"A/C urine",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"uro-5",
"path":[],
"label":"Examen prostatique suspect (TR)",
"cote":"C",
"docs":[
{
"name":"APS",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"uro-6",
"path":[],
"label":"APS élevé recontrôlé après 6 semaines",
"cote":"C",
"docs":[
{
"name":"APS x 2, A/C urine négative)",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"uro-7",
"path":[],
"label":"Masse vésicale",
"cote":"C",
"docs":[
{
"name":"Rapport d'IM",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"uro-8",
"path":[],
"label":"Masse rénale solide ou kyste rénal complexe",
"cote":"C",
"docs":[
{
"name":"Créatinine, rapport d'IM et pyéloscan (si non réalisé)",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"uro-9",
"path":[],
"label":"Masse scrotale suspecte de néoplasie",
"cote":"B",
"docs":[
{
"name":"Écho testiculaire",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"uro-10",
"path":[],
"label":"Dysfonction érectile avec échec au traitement médical",
"cote":"E",
"docs":[
{
"name":"Testostérone, glycémie, lipides, HbA1c",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"uro-11",
"path":[],
"label":"Maladie de La Peyronie",
"cote":"E"
},
{
"id":"uro-12",
"path":[],
"label":"Hémospermie récidivante avec examen prostatique non suspect de malignité",
"cote":"E",
"docs":[
{
"name":"A/C urine, APS si > 40 ans",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"uro-13",
"path":[],
"label":"Hématurie macroscopique intermittente avec culture négative",
"cote":"C",
"docs":[
{
"name":"A/C urine, créatinine et pyéloscan",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"uro-14",
"path":[
"Hématurie microscopique >= 2-5 GR/champ"
],
"label":"voir 1*",
"cote":"D",
"docs":[
{
"name":"A/C urine, écho abdominale pelvienne",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"uro-15",
"path":[],
"label":"Masse scrotale bénigne : hydrocèle, varicocèle, spermatocèle",
"cote":"E",
"docs":[
{
"name":"Écho testiculaire",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"uro-16",
"path":[],
"label":"Hydronéphrose obstructive ou symptomatique",
"cote":"C",
"docs":[
{
"name":"Rapport d'IM et créatinine, A/C urine",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"uro-17",
"path":[],
"label":"Symptômes du bas appareil urinaire chez l'homme et la femme (incontinence, vessie hyperactive, HBP avec échec de traitement)",
"cote":"E",
"docs":[
{
"name":"A/C urine et APS (si ♂)",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"uro-18",
"path":[],
"label":"Syndrome de douleur pelvienne chronique/orchialgie (incluant prostatite chronique, cystalgie)",
"cote":"E",
"docs":[
{
"name":"ITSS négatives, A/C urine",
"type":"dsq",
"auto":"DSQ"
}
]
},
{
"id":"uro-19",
"path":[],
"label":"Balanite récidivante/phimosis/vasectomie",
"cote":"E"
}
]
}
]
};
