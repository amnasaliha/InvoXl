import sys
sys.path.append('.')
from extract_invoices import extract_invoices
import json
import io
import contextlib

f = io.StringIO()
with contextlib.redirect_stdout(f):
    extract_invoices(r'c:\Users\shefi\Downloads\INVOXL\backend\uploads\1773903923496-Sub_Order_Labels_57ddacc8-1f42-4334-9171-1fa7f03b3575.pdf')

data = json.loads(f.getvalue())
print('Total invoices:', len(data))
print('States:', set([d.get('state') for d in data]))
print('Missing Tracking:', len([d for d in data if not d.get('tracking_id')]))
print('Missing State:', len([d for d in data if not d.get('state')]))
