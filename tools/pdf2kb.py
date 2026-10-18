#!/usr/bin/env python3
"""
Aggiunge PDF (studi, tesi, foglietti illustrativi, protocolli) alla base di conoscenza dell'assistente.

Uso:
    python3 tools/pdf2kb.py cartella-con-i-pdf/

Per ogni file.pdf si può affiancare un file.json con i metadati (consigliato):
    {"title": "Rossi et al. 2025 – ...", "source": "Citazione completa, rivista, anno, DOI",
     "url": "https://doi.org/...", "cat": "studio", "tags": ["parkinson", "cammino"]}
Senza .json si usano il nome del file come titolo e la categoria "studio".

Il testo viene diviso in parti di circa 2500 caratteri e scritto in assistente/knowledge/extra.mjs
(il file viene rigenerato ogni volta con tutti i PDF della cartella). Poi ripubblica sito e Worker.
Richiede: pip install pypdf
"""
import json
import re
import sys
from pathlib import Path

from pypdf import PdfReader

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'assistente' / 'knowledge' / 'extra.mjs'
CATS = {'dispositivo', 'protocollo', 'studio', 'riabilitazione', 'medicina', 'valutazione', 'sicurezza'}
CHUNK = 2500


def slug(s):
    s = re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')
    return s[:48] or 'doc'


def clean(text):
    text = text.replace('­', '')
    text = re.sub(r'-\n(?=[a-zà-ù])', '', text)  # parole spezzate a fine riga
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()


def chunks(text):
    paras = [p.strip() for p in re.split(r'\n\s*\n', text) if p.strip()]
    out, cur = [], ''
    for p in paras:
        if cur and len(cur) + len(p) > CHUNK:
            out.append(cur)
            cur = ''
        cur = f'{cur}\n{p}' if cur else p
        while len(cur) > CHUNK * 1.5:
            out.append(cur[:CHUNK])
            cur = cur[CHUNK:]
    if cur:
        out.append(cur)
    return out


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    folder = Path(sys.argv[1])
    docs = []
    for pdf in sorted(folder.glob('*.pdf')):
        meta_path = pdf.with_suffix('.json')
        meta = json.loads(meta_path.read_text(encoding='utf-8')) if meta_path.exists() else {}
        cat = meta.get('cat', 'studio')
        if cat not in CATS:
            sys.exit(f'{meta_path}: categoria non valida "{cat}"')
        title = meta.get('title') or pdf.stem.replace('_', ' ')
        text = clean('\n\n'.join(page.extract_text() or '' for page in PdfReader(pdf).pages))
        if len(text) < 200:
            print(f'ATTENZIONE: {pdf.name} non contiene testo (PDF scansionato? serve OCR) – saltato')
            continue
        parts = chunks(text)
        base = 'x-' + slug(pdf.stem)
        for i, part in enumerate(parts, 1):
            doc = {
                'id': base if len(parts) == 1 else f'{base}-{i}',
                'cat': cat,
                'title': title if len(parts) == 1 else f'{title} (parte {i}/{len(parts)})',
                'source': meta.get('source', pdf.name),
                'tags': meta.get('tags', []),
                'text': part,
            }
            if meta.get('url'):
                doc['url'] = meta['url']
            docs.append(doc)
        print(f'{pdf.name}: {len(parts)} parti')

    body = json.dumps(docs, ensure_ascii=False, indent=2)
    OUT.write_text(
        '/*\n * Documenti aggiuntivi della base di conoscenza.\n'
        ' * File generato da tools/pdf2kb.py: non modificarlo a mano (le modifiche verrebbero sovrascritte).\n */\n'
        f'export const EXTRA_DOCS = {body};\n',
        encoding='utf-8',
    )
    print(f'Scritti {len(docs)} documenti in {OUT.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
