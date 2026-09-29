#!/usr/bin/env python3
"""Convertit l'export CSV du navigateur SNOMED d'Infoway (refset « Most
commonly used clinical problems… ») en note-ui/snomed-diagnostics.json, lu par
note-ui/snomed-index.jsx.

Usage : python3 tools/csv-to-snomed-json.py "<export>.csv"

Colonnes attendues (après 2 lignes d'en-tête de l'export) :
  Term (nom complet avec balise sémantique), Preferred Term, Concept Id
Forme produite : concepts = [[conceptId, terme préféré, nom complet sans balise
ou 0 s'il est identique, index de la balise dans _meta.tags], …]
"""
import csv, json, os, re, sys

TAG = re.compile(r'\s*\(([^()]*)\)\s*$')

def main(src):
    with open(src, encoding='utf-8-sig', newline='') as f:
        rows = list(csv.reader(f))
    start = next(i for i, r in enumerate(rows) if r[:3] == ['Term', 'Preferred Term', 'Concept Id']) + 1
    tags, concepts, seen = [], [], set()
    for r in rows[start:]:
        if len(r) < 3 or not r[2].strip():
            continue
        term, preferred, cid = r[0].strip(), r[1].strip(), r[2].strip()
        if cid in seen:
            continue
        seen.add(cid)
        m = TAG.search(term)
        tag = m.group(1) if m else None
        fsn = TAG.sub('', term).strip() if m else term
        if tag is not None and tag not in tags:
            tags.append(tag)
        concepts.append([cid, preferred, 0 if fsn == preferred else fsn, tags.index(tag) if tag is not None else -1])
    out = {
        '_meta': {
            'source': "Infoway - navigateur SNOMED CT : refset « Most commonly used clinical problems, conditions, diagnoses, symptoms, findings and complaints… »",
            'langue': 'en',
            'tags': tags,
            'count': len(concepts),
            'colonnes': ['conceptId', 'terme préféré', 'nom complet sans balise (0 = identique)', 'balise sémantique (index de tags)'],
        },
        'concepts': concepts,
    }
    dest = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'note-ui', 'snomed-diagnostics.json')
    with open(dest, 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, separators=(',', ':'))
        f.write('\n')
    print(len(concepts), 'concepts ->', os.path.normpath(dest), os.path.getsize(dest), 'octets')

if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
