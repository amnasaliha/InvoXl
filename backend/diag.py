import sys, json, re
sys.path.insert(0, '.')
import pdfplumber

results = []
with pdfplumber.open(r'uploads/extract_1773362207505.pdf') as pdf:
    for i, page in enumerate(pdf.pages[:3]):
        text = page.extract_text() or ''
        results.append({'page': i+1, 'text': text[:2000]})

with open('diag_raw.txt', 'w', encoding='utf-8') as f:
    for r in results:
        f.write(f"\n\n{'='*60}\nPAGE {r['page']}\n{'='*60}\n")
        f.write(str(r['text']))
print('Done')
