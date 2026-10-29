#!/usr/bin/env python3
"""Convertit l'inventaire CRDS (« APSS _ CRDS _ Safir - Inventaire des
prérequis _ pièces jointes », export CSV de l'onglet « Inventaire _ Pièce
jointe ») en note-ui/crds-data.js, lu par editor-data.jsx (menu /ref).

Usage : python3 tools/crds-csv-to-js.py "<export>.csv"

Colonnes attendues : Formulaire, Section, Sous-section, Diagnostic, Cote,
Pièce jointe, Type, Commentaire, Automatisable. Une ligne = une pièce jointe
d'une raison de consultation ; une raison sans pièce jointe a une ligne vide.

Hiérarchie (demande de Xavier Boilard, 2026-10-28) : Spécialité > Section >
Sous-section > Raison. Les colonnes Section et Sous-section ne sont remplies
que pour quelques formulaires ; ailleurs, les niveaux sont écrits au début du
texte de la raison, séparés par « - » (« Otologie - Surdité - Avec retard de
langage »). On prend donc les colonnes quand elles existent, puis les niveaux
du texte. La cote finale ([B]…[E]) devient la priorité ; « voir notes 1 et 2* »
renvoie aux notes du formulaire papier, absentes du fichier : retiré.

Contenu en français seulement : ce sont les libellés officiels des formulaires.
"""
import csv, json, re, sys

# Formulaire → (clé, nom court). Les clés des 12 spécialités d'avant restent
# les mêmes (favoris, gabarits) ; les noms suivent FIELD_OPTIONS.specialty.
SPECIALTIES = {
    'CRDS Consultation en Cardiologie adulte': ('cardio', 'Cardiologie'),
    'CRDS Consultation en Orthopédie adulte': ('ortho', 'Orthopédie'),
    'CRDS Consultation en Dermatologie adulte et pédiatrique': ('derm', 'Dermatologie'),
    'CRDS Consultation en Gastroentérologie adulte': ('gastro', 'Gastroentérologie'),
    'CRDS Consultation en Neurologie adulte': ('neuro', 'Neurologie'),
    'CRDS Consultation en Pneumologie adulte': ('pneumo', 'Pneumologie'),
    'CRDS Consultation en Rhumatologie adulte': ('rhuma', 'Rhumatologie'),
    'CRDS Consultation en Endocrinologie': ('endo', 'Endocrinologie'),
    'CRDS Consultation en Néphrologie adulte': ('nephro', 'Néphrologie'),
    'CRDS Consultation en Urologie adulte et enfant': ('uro', 'Urologie'),
    'CRDS Consultation en Gynécologie adulte': ('gyn', 'Gynécologie'),
    'CRDS Consultation en Ophtalmologie adulte et enfant': ('ophthal', 'Ophtalmologie'),
    'CRDS Consultation en ORL adulte et enfant': ('orl', 'ORL'),
    'CRDS Consultation en Chirurgie générale adulte': ('chirgen', 'Chirurgie générale'),
    'CRDS Consultation en Chirurgie vasculaire et endovasculaire adulte': ('vasc', 'Chirurgie vasculaire'),
    'CRDS Consultation en Chirurgie plastique': ('plastie', 'Chirurgie plastique'),
    'CRDS Consultation en Hémato-Oncologie / Hématologie adulte': ('hemato', 'Hématologie'),
    'CRDS Consultation en Oncologie Médicale/Hémato-Oncologie Adulte': ('onco', 'Oncologie'),
    'CRDS Consultation en Psychiatrie adulte': ('psy', 'Psychiatrie'),
    'CRDS Consultation dirigée au Médecin gériatre': ('geriatrie', 'Gériatrie'),
    'CRDS Consultation en Médecine interne adulte': ('interne', 'Médecine interne'),
    'CRDS Consultation en Immuno-Allergie adulte et Pédiatrique': ('allergie', 'Immuno-allergie'),
    'CRDS Consultation en Microbiologie-Infectiologie Maladies Infectieuses adulte': ('infectio', 'Infectiologie'),
    'CRDS Consultation en Neurochirurgie adulte': ('neurochir', 'Neurochirurgie'),
    'CRDS Consultation en Physiatrie adulte Médecine physique et Réadaptation': ('physiatrie', 'Physiatrie'),
    'CRDS Consultation en Pédiatrie générale': ('pedia', 'Pédiatrie'),
}

# Type de pièce jointe → code court, lu par le formulaire de la puce.
TYPES = {
    'Labo / Imagerie (DSQ)': 'dsq',
    'Profil pharmacologique': 'profil',
    'Note clinique': 'note',
    'Courbes de croissance pédiatrique': 'courbes',
    'Outil clinique': 'outil',
    'Documents numérisé au dossier': 'document',
    'User input': 'saisie',
    'User action': 'action',
}

# Sections ajoutées à l'inventaire (PLAN-reference-specialite.md, D4) : le CRDS
# ne range pas ces raisons de Neurologie, le Figma les regroupe sous
# « Céphalée » (suggestions et libellé de la puce). Marquées `added` dans les
# données, pour les distinguer des sections officielles.
ADDED_PATH = {
    ('neuro', 'Migraine'): ['Céphalée'],
    ('neuro', 'Suspicion céphalée de Horton (Cluster)'): ['Céphalée'],
    ('neuro', 'Névralgie du trijumeau'): ['Céphalée'],
    ('neuro', 'Autre type de céphalée primaires'): ['Céphalée'],
}

COTE = re.compile(r'\s*\[([A-E])\]\s*$')
SEE_NOTES = re.compile(r'\s*-?\s*\(?voir (?:la |les )?notes? [0-9][0-9 ,et]*\*?\)?', re.I)
LEVELS = re.compile(r'\s+[-–]\s+')

def clean(s):
    return re.sub(r'\s+', ' ', s or '').strip()

def main(src):
    with open(src, encoding='utf-8-sig', newline='') as f:
        rows = list(csv.DictReader(f))
    specs, order = {}, []
    for r in rows:
        form = clean(r['Formulaire'])
        if form not in SPECIALTIES:
            sys.exit('Formulaire inconnu, à ajouter dans SPECIALTIES : ' + form)
        key, name = SPECIALTIES[form]
        spec = specs.get(key)
        if not spec:
            spec = specs[key] = {'key': key, 'name': name, 'form': form.replace('CRDS ', '', 1), 'reasons': [], '_by': {}}
            order.append(key)
        raw = clean(r['Diagnostic'])
        if not raw:
            continue
        m = COTE.search(raw)
        cote = m.group(1) if m else None
        text = COTE.sub('', raw)
        text = clean(SEE_NOTES.sub('', text)).strip(' -–')
        parts = [p.strip() for p in LEVELS.split(text) if p.strip()]
        cols = [clean(r['Section']), clean(r['Sous-section'])]
        path = [c for c in cols if c] + parts[:-1]
        reason = spec['_by'].get(text)
        if not reason:
            reason = {'id': '%s-%d' % (key, len(spec['reasons']) + 1), 'path': path, 'label': parts[-1], 'cote': cote, 'docs': []}
            spec['_by'][text] = reason
            spec['reasons'].append(reason)
        elif len(path) > len(reason['path']):
            # Colonnes fusionnées dans la feuille : seule la 1re ligne d'une raison porte sa sous-section.
            reason['path'] = path
        doc = clean(r['Pièce jointe'])
        if doc:
            reason['docs'].append({'name': doc[0].upper() + doc[1:], 'type': TYPES.get(clean(r['Type']), 'autre'),
                                   'auto': clean(r['Automatisable']) or None, 'note': clean(r['Commentaire']) or None})
    out = []
    for key in sorted(order, key=lambda k: specs[k]['name']):
        s = specs[key]
        del s['_by']
        for reason in s['reasons']:
            extra = ADDED_PATH.get((key, reason['label']))
            if extra and not reason['path']:
                reason['path'] = list(extra)
                reason['added'] = True
            if not reason['docs']:
                del reason['docs']
            for d in reason.get('docs', []):
                for k in ('auto', 'note'):
                    if d[k] is None:
                        del d[k]
        out.append(s)
    total = sum(len(s['reasons']) for s in out)
    body = json.dumps({'source': 'APSS / CRDS / Safir — Inventaire des prérequis (pièces jointes)', 'specialties': out},
                      ensure_ascii=False, indent=0, separators=(',', ':'))
    with open('note-ui/crds-data.js', 'w', encoding='utf-8') as f:
        f.write('// Fichier généré par tools/crds-csv-to-js.py : ne pas modifier à la main.\n')
        f.write('// Formulaires CRDS : spécialités, raisons de consultation (Section > Sous-section > Raison),\n')
        f.write('// cote de priorité et pièces jointes requises. Libellés officiels, en français seulement.\n')
        f.write('window.CRDS_DATA = ' + body + ';\n')
    print('note-ui/crds-data.js écrit : %d spécialités, %d raisons.' % (len(out), total))

if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
