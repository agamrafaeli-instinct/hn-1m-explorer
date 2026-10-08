#!/usr/bin/env python3
"""Redact credential-shaped strings from raw HN JSONL before publishing (GitHub push protection)."""
import re,sys,json,glob,os
PATS=[r'\bkey-[0-9a-f]{32}\b', r'sk-(?:proj|svcacct|admin|ant|or)-[A-Za-z0-9_-]{20,}', r'sk-[A-Za-z0-9]{32,}', r'\b(?:AKIA|ASIA|AGPA|AIDA|AROA)[0-9A-Z]{16}\b',
 r'\bgh[pousr]_[A-Za-z0-9]{30,}', r'github_pat_[A-Za-z0-9_]{40,}', r'\bxox[abprs]-[A-Za-z0-9-]{10,}', r'\bAIza[0-9A-Za-z_-]{35}',
 r'\b[sr]k_(?:live|test)_[0-9A-Za-z]{20,}', r'\bhf_[A-Za-z0-9]{30,}', r'\bglpat-[A-Za-z0-9_-]{20}', r'\bnpm_[A-Za-z0-9]{36}', r'\bSG\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}',
 r'-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?(?:-----END [A-Z ]*PRIVATE KEY-----|$)', r'\bpplx-[A-Za-z0-9]{40,}', r'\bgsk_[A-Za-z0-9]{40,}', r'\bdsk-[A-Za-z0-9]{30,}']
R=re.compile('|'.join(PATS)); n=0
def fix(s):
    global n
    out,k=R.subn('[REDACTED-SECRET]',s); n+=k; return out
src,dst=sys.argv[1],sys.argv[2]; os.makedirs(dst,exist_ok=True)
for f in sorted(glob.glob(src+'/*.jsonl')):
    with open(f) as i, open(os.path.join(dst,os.path.basename(f)),'w') as o:
        for l in i:
            d=json.loads(l)
            for k in('text','title','url'):
                if isinstance(d.get(k),str): d[k]=fix(d[k])
            o.write(json.dumps(d,separators=(',',':'),ensure_ascii=False)+'\n')
print('redacted',n)
