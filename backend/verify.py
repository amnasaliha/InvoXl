import sys, json, io, contextlib, os
import pdfplumber, re

os.chdir(r'c:\Users\shefi\Downloads\INVOXL\backend')

pdf_path = r'c:\Users\shefi\Downloads\INVOXL\backend\uploads\1773903923496-Sub_Order_Labels_57ddacc8-1f42-4334-9171-1fa7f03b3575.pdf'

out = []
with pdfplumber.open(pdf_path) as pdf:
    for page_num in [1, 2, 3]:
        page = pdf.pages[page_num - 1]
        text = page.extract_text()
        if not text:
            out.append(f'=== Page {page_num}: NO TEXT ===\n')
            continue
        lines = [l.strip() for l in text.split('\n') if l.strip()]
        out.append(f'=== Page {page_num} ===')
        for i, line in enumerate(lines):
            out.append(f'  [{i:02d}] {line!r}')
        out.append('')

with open('raw_lines.txt', 'w', encoding='utf-8') as fp:
    fp.write('\n'.join(out))
print('Written to raw_lines.txt')
