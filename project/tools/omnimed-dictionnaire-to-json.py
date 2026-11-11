#!/usr/bin/env python3
"""Convertit la feuille Google « Dictionnaire : Diagnostics / Impressions
diagnostics / Symptômes » (export .xlsx) en données du prototype.

Usage : python3 tools/omnimed-dictionnaire-to-json.py "<export>.xlsx"

Onglet « CIM10 (Omnimed) » (colonnes ID_TERME, FRANÇAIS, ANGLAIS, CODE,
« Diagnostic ? ») : les lignes marquées 1 (diagnostics CIM-10) deviennent la
liste CIM-10 du prototype. Les lignes à 0 sont des interventions (codes CCI à
7 caractères) : ignorées. Écrit, dans note-ui/ :
  - cim10-fr-clinique.json / cim10-en-clinique.json : liste plate
    [{code, libelle[, generic]}], libellés tels que dans la feuille (le français
    d'Omnimed est abrégé, l'anglais est complet) ;
  - cim10-hierarchy.json / cim10-hierarchy-en.json : chapitres, blocs (voir
    BLOCS_COMPLEMENT : la feuille n'a ni chapitres ni blocs), codes fréquents.
Les parents manquants n'existent plus (`parents` et `ajouts` vides) : tout
ancêtre d'un code de la feuille est lui-même dans la feuille — vérifié ici.

Le lecteur .xlsx n'utilise que la bibliothèque standard.
"""
import csv, io, json, os, re, sys, zipfile
import xml.etree.ElementTree as ET

NOTE_UI = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'note-ui'))
NS = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
      'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}

# ---------------------------------------------------------------------------
# Lecture de l'.xlsx : { nom d'onglet: [[cellules d'une ligne], …] }
# ---------------------------------------------------------------------------
def _col(ref):
    n = 0
    for ch in re.match(r'[A-Z]+', ref).group(0):
        n = n * 26 + ord(ch) - 64
    return n - 1

def lire_xlsx(path):
    z = zipfile.ZipFile(path)
    ss = []
    if 'xl/sharedStrings.xml' in z.namelist():
        for si in ET.fromstring(z.read('xl/sharedStrings.xml')).findall('m:si', NS):
            ss.append(''.join(t.text or '' for t in si.iter('{%s}t' % NS['m'])))
    wb = ET.fromstring(z.read('xl/workbook.xml'))
    rels = {r.get('Id'): r.get('Target') for r in ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))}
    out = {}
    for sh in wb.find('m:sheets', NS):
        target = rels[sh.get('{%s}id' % NS['r'])]
        root = ET.fromstring(z.read('xl/' + target.lstrip('/').replace('xl/', '')))
        rows = []
        for row in root.iter('{%s}row' % NS['m']):
            vals = {}
            for c in row.findall('m:c', NS):
                t, v = c.get('t'), c.find('m:v', NS)
                if t == 's' and v is not None:
                    val = ss[int(v.text)]
                elif t == 'inlineStr':
                    val = ''.join(x.text or '' for x in c.iter('{%s}t' % NS['m']))
                else:
                    val = v.text if v is not None else ''
                vals[_col(c.get('r'))] = val
            while len(rows) < int(row.get('r')) - 1:
                rows.append([])
            rows.append([vals.get(k, '') for k in range(max(vals) + 1)] if vals else [])
        out[sh.get('name')] = rows
    return out

def propre(s):
    return re.sub(r'\s+', ' ', s or '').strip()

# ---------------------------------------------------------------------------
# CIM-10
# ---------------------------------------------------------------------------
# Génériques (« parapluies ») : badge « Général » en tête des résultats du /dx.
# Ils ne sont pas dans la feuille ; chacun s'accroche à la CATÉGORIE de la
# feuille qui contient son ancien code (J06.9 → J06 : la feuille n'a pas de
# sous-codes pour ces catégories).
GENERIQUES = [
    ('J06', 'IVRS / syndrome viral', 'URTI / viral syndrome'),
    ('N30', 'Cystite / infection urinaire', 'Cystitis / urinary tract infection'),
    ('M54', 'Lombalgie commune', 'Common low back pain'),
    ('A09', 'Gastroentérite aiguë', 'Acute gastroenteritis'),
    ('J02', 'Pharyngite / mal de gorge', 'Pharyngitis / sore throat'),
    ('L30', 'Dermatite / éruption cutanée non précisée', 'Dermatitis / unspecified skin rash'),
    ('Z00', 'Examen médical périodique', 'Periodic medical examination'),
]

# Codes fréquents (colonne « Fréquents » du /dx). Un code absent de la feuille
# est remplacé par son plus long préfixe présent (E11.9 → E11), sinon écarté.
FREQUENTS = ['I10', 'E11.9', 'E78.5', 'J45.9', 'J44.9', 'F41.1', 'F32.9', 'K21.9', 'E03.9', 'M54.5',
             'J06.9', 'J02.9', 'H66.9', 'N39.0', 'N30.9', 'A09.9', 'L30.9', 'Z00.0', 'Z34.9', 'E66.9',
             'G43.9', 'R51', 'I48.9', 'J30.4', 'F90.0', 'L20.9', 'M17.9', 'R10.4', 'J20.9', 'J01.9']

CHAPITRES_COMPLEMENT = [
    ('XX', 'V01', 'Y98', "Causes externes de morbidité et de mortalité", 'External causes of morbidity and mortality'),
    ('XXII', 'U00', 'U99', "Codes d'utilisation particulière", 'Codes for special purposes'),
]
ORDRE_CHAPITRES = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV',
                   'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI', 'XXII']

# Libellés corrigés de blocs existants (M80-M85 portait l'intitulé du groupe M80-M94).
BLOCS_CORRIGES = {
    ('M80', 'M85'): ('Anomalies de la densité et de la structure osseuses', 'Disorders of bone density and structure'),
}

# Blocs absents du jeu réduit d'avant : la feuille couvre 2 040 catégories, dont
# 830 hors des 149 blocs d'origine. Structure standard des blocs de la CIM-10
# (OMS, volume 1) ; intitulés français et anglais écrits de mémoire de la
# classification, À REVALIDER contre la CIM-10-CA (aucune source vivante
# n'a pu être lue). Un bloc sans catégorie dans la feuille est ignoré.
BLOCS_COMPLEMENT = [
    # I
    ('B15', 'B19', 'Hépatite virale', 'Viral hepatitis'),
    ('B50', 'B64', 'Maladies dues à des protozoaires', 'Protozoal diseases'),
    ('B95', 'B98', 'Bactéries, virus et autres agents infectieux', 'Bacterial, viral and other infectious agents'),
    ('B99', 'B99', 'Autres maladies infectieuses', 'Other infectious diseases'),
    # II
    ('C00', 'C14', 'Tumeurs malignes de la lèvre, de la cavité buccale et du pharynx', 'Malignant neoplasms of lip, oral cavity and pharynx'),
    ('C40', 'C41', 'Tumeurs malignes des os et du cartilage articulaire', 'Malignant neoplasms of bone and articular cartilage'),
    ('C45', 'C49', 'Tumeurs malignes du tissu mésothélial et des tissus mous', 'Malignant neoplasms of mesothelial and soft tissue'),
    ('C51', 'C58', 'Tumeurs malignes des organes génitaux de la femme', 'Malignant neoplasms of female genital organs'),
    ('C64', 'C68', 'Tumeurs malignes des voies urinaires', 'Malignant neoplasms of urinary tract'),
    ('C69', 'C72', "Tumeurs malignes de l'œil, du cerveau et d'autres parties du système nerveux central", 'Malignant neoplasms of eye, brain and other parts of central nervous system'),
    ('C73', 'C75', "Tumeurs malignes de la thyroïde et d'autres glandes endocrines", 'Malignant neoplasms of thyroid and other endocrine glands'),
    ('C76', 'C80', 'Tumeurs malignes de sièges mal définis, secondaires et non précisés', 'Malignant neoplasms of ill-defined, secondary and unspecified sites'),
    ('C81', 'C96', 'Tumeurs malignes, primitives ou présumées primitives, des tissus lymphoïde, hématopoïétique et apparentés', 'Malignant neoplasms, stated or presumed to be primary, of lymphoid, hematopoietic and related tissue'),
    ('C97', 'C97', 'Tumeurs malignes de sièges multiples indépendants (primitifs)', 'Malignant neoplasms of independent (primary) multiple sites'),
    ('D00', 'D09', 'Tumeurs in situ', 'In situ neoplasms'),
    ('D37', 'D48', 'Tumeurs à évolution imprévisible ou inconnue', 'Neoplasms of uncertain or unknown behavior'),
    # III
    ('D70', 'D77', 'Autres maladies du sang et des organes hématopoïétiques', 'Other diseases of blood and blood-forming organs'),
    ('D80', 'D89', 'Certaines anomalies du système immunitaire', 'Certain disorders involving the immune mechanism'),
    # IV
    ('E15', 'E16', 'Autres troubles de la régulation du glucose et de la sécrétion pancréatique interne', 'Other disorders of glucose regulation and pancreatic internal secretion'),
    ('E40', 'E46', 'Malnutrition', 'Malnutrition'),
    # V
    ('F60', 'F69', "Troubles de la personnalité et du comportement chez l'adulte", 'Disorders of adult personality and behavior'),
    ('F70', 'F79', 'Retard mental', 'Mental retardation'),
    ('F99', 'F99', 'Trouble mental, sans précision', 'Unspecified mental disorder'),
    # VI
    ('G10', 'G14', 'Atrophies systémiques affectant principalement le système nerveux central', 'Systemic atrophies primarily affecting the central nervous system'),
    ('G30', 'G32', 'Autres maladies dégénératives du système nerveux', 'Other degenerative diseases of the nervous system'),
    ('G35', 'G37', 'Maladies démyélinisantes du système nerveux central', 'Demyelinating diseases of the central nervous system'),
    ('G60', 'G64', 'Polynévrites et autres atteintes du système nerveux périphérique', 'Polyneuropathies and other disorders of the peripheral nervous system'),
    ('G80', 'G83', 'Paralysie cérébrale et autres syndromes paralytiques', 'Cerebral palsy and other paralytic syndromes'),
    # VII
    ('H25', 'H28', 'Affections du cristallin', 'Disorders of lens'),
    ('H30', 'H36', 'Affections de la choroïde et de la rétine', 'Disorders of choroid and retina'),
    ('H40', 'H42', 'Glaucome', 'Glaucoma'),
    ('H43', 'H45', 'Affections du corps vitré et du globe oculaire', 'Disorders of vitreous body and globe'),
    ('H46', 'H48', 'Affections du nerf optique et des voies optiques', 'Disorders of optic nerve and visual pathways'),
    ('H53', 'H54', 'Troubles de la vision et cécité', 'Visual disturbances and blindness'),
    ('H55', 'H59', "Autres affections de l'œil et de ses annexes", 'Other disorders of eye and adnexa'),
    # VIII
    ('H90', 'H95', "Autres affections de l'oreille", 'Other disorders of ear'),
    # IX
    ('I00', 'I02', 'Rhumatisme articulaire aigu', 'Acute rheumatic fever'),
    ('I05', 'I09', 'Cardiopathies rhumatismales chroniques', 'Chronic rheumatic heart diseases'),
    ('I70', 'I79', 'Maladies des artères, des artérioles et des capillaires', 'Diseases of arteries, arterioles and capillaries'),
    # X
    ('J80', 'J84', 'Autres maladies respiratoires touchant principalement le tissu interstitiel', 'Other respiratory diseases principally affecting the interstitium'),
    ('J85', 'J86', 'Affections suppuratives et nécrotiques des voies respiratoires inférieures', 'Suppurative and necrotic conditions of lower respiratory tract'),
    ('J90', 'J94', 'Autres maladies de la plèvre', 'Other diseases of pleura'),
    ('J95', 'J99', "Autres maladies de l'appareil respiratoire", 'Other diseases of the respiratory system'),
    # XI
    ('K40', 'K46', 'Hernies', 'Hernia'),
    ('K65', 'K67', 'Maladies du péritoine', 'Diseases of peritoneum'),
    # XIII
    ('M30', 'M36', 'Affections systémiques du tissu conjonctif', 'Systemic connective tissue disorders'),
    ('M40', 'M43', 'Dorsopathies déformantes', 'Deforming dorsopathies'),
    ('M86', 'M90', 'Autres ostéopathies', 'Other osteopathies'),
    ('M91', 'M94', 'Chondropathies', 'Chondropathies'),
    # XIV
    ('N60', 'N64', 'Affections du sein', 'Disorders of breast'),
    # XV
    ('O00', 'O08', 'Grossesse se terminant par un avortement', 'Pregnancy with abortive outcome'),
    ('O10', 'O16', "Œdème, protéinurie et troubles hypertensifs au cours de la grossesse, de l'accouchement et de la puerpéralité", 'Edema, proteinuria and hypertensive disorders in pregnancy, childbirth and the puerperium'),
    ('O30', 'O48', "Soins maternels liés au fœtus et à la cavité amniotique et problèmes éventuels de l'accouchement", 'Maternal care related to the fetus and amniotic cavity and possible delivery problems'),
    ('O60', 'O75', "Complications du travail et de l'accouchement", 'Complications of labor and delivery'),
    ('O80', 'O84', 'Accouchement', 'Delivery'),
    ('O85', 'O92', 'Complications principalement liées à la puerpéralité', 'Complications predominantly related to the puerperium'),
    ('O94', 'O99', 'Autres affections obstétricales, non classées ailleurs', 'Other obstetric conditions, not elsewhere classified'),
    # XVI
    ('P05', 'P08', 'Troubles liés à la durée de la gestation et à la croissance du fœtus', 'Disorders related to length of gestation and fetal growth'),
    ('P10', 'P15', 'Traumatisme obstétrical', 'Birth trauma'),
    ('P80', 'P83', 'Affections touchant les téguments et la régulation thermique du fœtus et du nouveau-né', 'Conditions involving the integument and temperature regulation of fetus and newborn'),
    # XVII
    ('Q00', 'Q07', 'Malformations congénitales du système nerveux', 'Congenital malformations of the nervous system'),
    ('Q10', 'Q18', "Malformations congénitales de l'œil, de l'oreille, de la face et du cou", 'Congenital malformations of eye, ear, face and neck'),
    ('Q20', 'Q28', "Malformations congénitales de l'appareil circulatoire", 'Congenital malformations of the circulatory system'),
    ('Q30', 'Q34', "Malformations congénitales de l'appareil respiratoire", 'Congenital malformations of the respiratory system'),
    ('Q35', 'Q37', 'Fente labiale et fente palatine', 'Cleft lip and cleft palate'),
    ('Q65', 'Q79', 'Malformations et déformations congénitales du système ostéo-articulaire et musculaire', 'Congenital malformations and deformations of the musculoskeletal system'),
    ('Q80', 'Q89', 'Autres malformations congénitales', 'Other congenital malformations'),
    ('Q90', 'Q99', 'Anomalies chromosomiques, non classées ailleurs', 'Chromosomal abnormalities, not elsewhere classified'),
    # XVIII
    ('R47', 'R49', 'Symptômes et signes relatifs à la parole et à la voix', 'Symptoms and signs involving speech and voice'),
    ('R80', 'R82', "Anomalies des examens d'urine, sans diagnostic", 'Abnormal findings on examination of urine, without diagnosis'),
    ('R83', 'R89', "Anomalies des examens d'autres liquides, substances et tissus de l'organisme, sans diagnostic", 'Abnormal findings on examination of other body fluids, substances and tissues, without diagnosis'),
    ('R95', 'R99', 'Causes de mortalité mal définies et inconnues', 'Ill-defined and unknown causes of mortality'),
    # XIX
    ('T20', 'T25', 'Brûlures et corrosions de la surface externe du corps, selon la localisation', 'Burns and corrosions of external body surface, specified by site'),
    ('T29', 'T32', 'Brûlures et corrosions de plusieurs parties du corps et de parties non précisées', 'Burns and corrosions of multiple and unspecified body regions'),
    ('T33', 'T35', 'Gelures', 'Frostbite'),
    ('T51', 'T65', "Effets toxiques de substances d'origine essentiellement non médicinale", 'Toxic effects of substances chiefly nonmedicinal as to source'),
    ('T79', 'T79', 'Certaines complications précoces des traumatismes', 'Certain early complications of trauma'),
    # XX
    ('V01', 'V09', 'Piéton blessé dans un accident de transport', 'Pedestrian injured in transport accident'),
    ('V10', 'V19', 'Cycliste blessé dans un accident de transport', 'Pedal cyclist injured in transport accident'),
    ('V20', 'V29', 'Motocycliste blessé dans un accident de transport', 'Motorcycle rider injured in transport accident'),
    ('V30', 'V39', "Occupant d'un véhicule à moteur à trois roues blessé dans un accident de transport", 'Occupant of three-wheeled motor vehicle injured in transport accident'),
    ('V40', 'V49', "Occupant d'une automobile blessé dans un accident de transport", 'Car occupant injured in transport accident'),
    ('V50', 'V59', "Occupant d'une camionnette blessé dans un accident de transport", 'Occupant of pick-up truck or van injured in transport accident'),
    ('V60', 'V69', "Occupant d'un véhicule de transport lourd blessé dans un accident de transport", 'Occupant of heavy transport vehicle injured in transport accident'),
    ('V70', 'V79', "Occupant d'un autobus blessé dans un accident de transport", 'Bus occupant injured in transport accident'),
    ('V80', 'V89', 'Autres accidents de transport terrestre', 'Other land transport accidents'),
    ('V90', 'V94', 'Accidents de transport par eau', 'Water transport accidents'),
    ('V95', 'V97', 'Accidents de transport aérien et spatial', 'Air and space transport accidents'),
    ('V98', 'V99', 'Autres accidents de transport et accidents de transport sans précision', 'Other and unspecified transport accidents'),
    ('W00', 'W19', 'Chutes', 'Falls'),
    ('W20', 'W49', 'Exposition à des forces mécaniques inanimées', 'Exposure to inanimate mechanical forces'),
    ('W50', 'W64', 'Exposition à des forces mécaniques animées', 'Exposure to animate mechanical forces'),
    ('W65', 'W74', 'Noyade et submersion accidentelles', 'Accidental drowning and submersion'),
    ('W75', 'W84', 'Autres accidents affectant la respiration', 'Other accidental threats to breathing'),
    ('W85', 'W99', "Exposition au courant électrique, aux rayonnements et à des températures et pressions extrêmes de l'air ambiant", 'Exposure to electric current, radiation and extreme ambient air temperature and pressure'),
    ('X00', 'X09', 'Exposition à la fumée, au feu et aux flammes', 'Exposure to smoke, fire and flames'),
    ('X10', 'X19', 'Contact avec une source de chaleur et des substances brûlantes', 'Contact with heat and hot substances'),
    ('X20', 'X29', 'Contact avec des animaux et des plantes venimeux', 'Contact with venomous animals and plants'),
    ('X30', 'X39', 'Exposition aux forces de la nature', 'Exposure to forces of nature'),
    ('X40', 'X49', 'Intoxication accidentelle par des substances nocives et exposition à ces substances', 'Accidental poisoning by and exposure to noxious substances'),
    ('X50', 'X57', 'Surmenage, voyages et privations', 'Overexertion, travel and privation'),
    ('X58', 'X59', 'Exposition accidentelle à d\'autres facteurs et à des facteurs non précisés', 'Accidental exposure to other and unspecified factors'),
    ('X60', 'X84', 'Lésions auto-infligées', 'Intentional self-harm'),
    ('X85', 'Y09', 'Agressions', 'Assault'),
    ('Y10', 'Y34', "Événements dont l'intention n'est pas déterminée", 'Event of undetermined intent'),
    ('Y35', 'Y36', 'Intervention de la force publique et faits de guerre', 'Legal intervention and operations of war'),
    ('Y40', 'Y59', "Médicaments, produits pharmaceutiques et substances biologiques ayant des effets indésirables lorsqu'ils sont utilisés à des fins thérapeutiques", 'Drugs, medicaments and biological substances causing adverse effects in therapeutic use'),
    ('Y60', 'Y69', 'Accidents survenus au cours d\'actes médicaux et chirurgicaux', 'Misadventures to patients during surgical and medical care'),
    ('Y70', 'Y82', "Matériel médical associé à des accidents survenus au cours d'une utilisation diagnostique et thérapeutique", 'Medical devices associated with adverse incidents in diagnostic and therapeutic use'),
    ('Y83', 'Y84', "Actes chirurgicaux et autres actes médicaux, causes de réaction anormale du patient ou de complications ultérieures, sans mention d'accident au moment de l'acte", 'Surgical and other medical procedures as the cause of abnormal reaction of the patient, or of later complication, without mention of misadventure at the time of the procedure'),
    ('Y85', 'Y89', 'Séquelles de causes externes de morbidité et de mortalité', 'Sequelae of external causes of morbidity and mortality'),
    ('Y90', 'Y98', 'Facteurs supplémentaires liés aux causes de morbidité et de mortalité classées ailleurs', 'Supplementary factors related to causes of morbidity and mortality classified elsewhere'),
    # XXII
    ('U00', 'U49', "Attribution provisoire de nouvelles affections d'étiologie incertaine ou d'usage urgent", 'Provisional assignment of new diseases of uncertain etiology or emergency use'),
    ('U80', 'U89', 'Résistance aux antimicrobiens et aux antinéoplasiques', 'Resistance to antimicrobial and antineoplastic drugs'),
    ('U98', 'U99', "Lieu de l'événement et activité", 'Place of occurrence and activity'),
]

def ecrire_json(nom, data, une_ligne_par_element=None):
    """Écrit note-ui/<nom>. `une_ligne_par_element` : clés dont la liste tient une entrée par ligne."""
    dest = os.path.join(NOTE_UI, nom)
    if une_ligne_par_element is None:
        txt = json.dumps(data, ensure_ascii=False, separators=(',', ':')) + '\n'
    else:
        parts = []
        for k, v in data.items():
            if k in une_ligne_par_element:
                inner = ',\n'.join('    ' + json.dumps(x, ensure_ascii=False) for x in v)
                parts.append('  ' + json.dumps(k) + ': [\n' + inner + '\n  ]' if v else '  ' + json.dumps(k) + ': []')
            else:
                parts.append('  ' + json.dumps(k) + ': ' + json.dumps(v, ensure_ascii=False))
        txt = '{\n' + ',\n'.join(parts) + '\n}\n'
    with open(dest, 'w', encoding='utf-8') as f:
        f.write(txt)
    print('  ', nom, os.path.getsize(dest), 'octets')

def lire_json(nom):
    with open(os.path.join(NOTE_UI, nom), encoding='utf-8') as f:
        return json.load(f)

def convertir_cim10(rows):
    entete = rows[0]
    assert [propre(c) for c in entete[:5]] == ['ID_TERME', 'FRANÇAIS', 'ANGLAIS', 'CODE', 'Diagnostic ?'], entete[:5]
    dx = {}
    for r in rows[1:]:
        r = r + [''] * (5 - len(r))
        code = propre(r[3])
        if code and r[4] == '1' and code not in dx:
            dx[code] = (propre(r[1]), propre(r[2]))
    vides = [c for c, (f, e) in dx.items() if not f or not e]
    assert not vides, ('libellé vide', vides[:5])

    def cmp_key(code):
        # 3 caractères d'abord, puis l'ordre naturel des codes (même idée que cmpCim10Code)
        return (code[:3], len(code) > 3, code)
    codes = sorted(dx, key=cmp_key)

    cats = {c for c in codes if len(c) == 3}
    cible_generique = {}
    for g, fr, en in GENERIQUES:
        assert g in dx, 'catégorie générique absente de la feuille : ' + g
    fr_rows = [{'code': g, 'libelle': fr, 'generic': True} for g, fr, _ in GENERIQUES] + \
              [{'code': c, 'libelle': dx[c][0]} for c in codes]
    en_rows = [{'code': g, 'libelle': en, 'generic': True} for g, _, en in GENERIQUES] + \
              [{'code': c, 'libelle': dx[c][1]} for c in codes]

    # Ancêtres : tout code de plus de 3 caractères a un parent dans la feuille.
    def parent(c):
        for L in range(len(c) - 1, 2, -1):
            cand = c[:L].rstrip('.')
            if cand != c and cand in dx:
                return cand
        return None
    sans_parent = [c for c in codes if len(c) > 3 and parent(c) is None]
    assert not sans_parent, ('codes sans parent', sans_parent[:10])

    # Hiérarchie : chapitres et blocs existants + compléments.
    base = lire_json('cim10-hierarchy.json')
    base_en = lire_json('cim10-hierarchy-en.json')
    en_ch = {c['id']: c['libelle'] for c in base_en['chapters']}
    en_bl = {tuple(b['range']): b['libelle'] for b in base_en['blocks']}
    chapitres = {c['id']: {'id': c['id'], 'range': c['range'], 'fr': c['libelle'], 'en': en_ch[c['id']]} for c in base['chapters']}
    for cid, a, b, fr, en in CHAPITRES_COMPLEMENT:
        chapitres.setdefault(cid, {'id': cid, 'range': [a, b], 'fr': fr, 'en': en})
    blocs = {tuple(b['range']): {'range': b['range'], 'fr': b['libelle'], 'en': en_bl[tuple(b['range'])]} for b in base['blocks']}
    for a, b, fr, en in BLOCS_COMPLEMENT:
        if any(a <= c <= b for c in cats):
            blocs.setdefault((a, b), {'range': [a, b], 'fr': fr, 'en': en})
    for rg, (fr, en) in BLOCS_CORRIGES.items():
        if rg in blocs:
            blocs[rg].update({'fr': fr, 'en': en})
    # Vérifications : chaque catégorie dans un bloc et un chapitre, aucun bloc vide ni chevauchant.
    liste_blocs = sorted(blocs.values(), key=lambda x: x['range'][0])
    for c in sorted(cats):
        assert sum(1 for b in liste_blocs if b['range'][0] <= c <= b['range'][1]) == 1, ('catégorie hors bloc ou dans deux blocs', c)
        assert sum(1 for ch in chapitres.values() if ch['range'][0] <= c <= ch['range'][1]) == 1, ('catégorie hors chapitre', c)
    vides = [b['range'] for b in liste_blocs if not any(b['range'][0] <= c <= b['range'][1] for c in cats)]
    assert not vides, ('blocs vides', vides)
    liste_chap = [chapitres[i] for i in ORDRE_CHAPITRES if i in chapitres]
    for ch in liste_chap:
        assert any(ch['range'][0] <= c <= ch['range'][1] for c in cats), ('chapitre vide', ch['id'])

    # Fréquents : le code lui-même, sinon son plus long préfixe présent.
    frequents, remplaces = [], []
    for f in FREQUENTS:
        cand = f if f in dx else next((f[:L].rstrip('.') for L in range(len(f) - 1, 2, -1) if f[:L].rstrip('.') in dx), None)
        if cand is None:
            remplaces.append((f, None)); continue
        if cand != f: remplaces.append((f, cand))
        if cand not in frequents: frequents.append(cand)

    meta = lambda lang: {'version': 2, 'sources': {
        'codes': "Feuille « Dictionnaire : Diagnostics / Impressions diagnostics / Symptômes », onglet « CIM10 (Omnimed) », lignes « Diagnostic ? » = 1 (" + str(len(codes)) + " codes ; tools/omnimed-dictionnaire-to-json.py)",
        'chapitres': "chapitre_libelle du jeu CIM-10 FR complet (git 89f60b0^:project/note-ui/cim10-fr-clinique.json) ; chapitres XX et XXII ajoutés pour les causes externes (V01-Y98) et les codes d'utilisation particulière (U00-U99) que contient la feuille",
        'blocs': "Structure standard des blocs OMS CIM-10 (Volume 1) ; les intitulés des blocs ajoutés au 2026-11-11 sont écrits de mémoire de la classification, à revalider contre la CIM-10-CA ; K55-K64 regroupe les mises à jour ultérieures (hémorroïdes) sous un intitulé combiné.",
        'frequents': "Liste d'origine, ramenée au code présent dans la feuille (E11.9 -> E11) ; voir FREQUENTS dans l'outil",
        'parents': "aucun : tout ancêtre d'un code de la feuille y figure déjà",
    }}
    def hier(lang):
        return {
            '_meta': meta(lang),
            'chapters': [{'id': c['id'], 'range': c['range'], 'libelle': c[lang]} for c in liste_chap],
            'blocks': [{'range': b['range'], 'libelle': b[lang]} for b in liste_blocs],
            'parents': [], 'ajouts': [], 'frequents': frequents,
        }
    ecrire_json('cim10-fr-clinique.json', fr_rows)
    ecrire_json('cim10-en-clinique.json', en_rows)
    ecrire_json('cim10-hierarchy.json', hier('fr'), ('chapters', 'blocks'))
    ecrire_json('cim10-hierarchy-en.json', hier('en'), ('chapters', 'blocks'))
    print('CIM-10 :', len(codes), 'codes dont', len(cats), 'catégories,', len(liste_chap), 'chapitres,', len(liste_blocs), 'blocs,', len(frequents), 'fréquents')
    for f, c in remplaces:
        print('   fréquent', f, '->', c if c else 'écarté')
    return {'codes': len(codes), 'chapitres': len(liste_chap), 'blocs': len(liste_blocs)}

def main(src):
    classeur = lire_xlsx(src)
    onglet = next((n for n in classeur if n.strip() == 'CIM10 (Omnimed)'), None)
    if onglet is None:
        sys.exit("onglet « CIM10 (Omnimed) » introuvable : " + ', '.join(classeur))
    convertir_cim10(classeur[onglet])

if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
