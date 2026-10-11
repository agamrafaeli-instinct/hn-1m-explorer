#!/usr/bin/env python3
"""Make the DuckDB-WASM worker use range reads on GitHub Pages (docs/atlas/worker-patch.md).
Usage: patch_duckdb_worker.py STOCK_WORKER_JS OUTPUT_JS
Fails loudly if the stock string is not found exactly once (for example after an engine upgrade)."""
import sys
STOCK = 'if(d!==null&&f.status==206){'
PATCHED = 'if(d!==null&&(f.status==206||f.status==200&&f.getResponseHeader("Accept-Ranges")=="bytes")){'
def patch(text):
    if text.count(STOCK) != 1:
        raise SystemExit('worker patch: stock string found %d times, expected 1; re-check docs/atlas/worker-patch.md' % text.count(STOCK))
    return text.replace(STOCK, PATCHED)
if __name__ == '__main__':
    open(sys.argv[2], 'w').write(patch(open(sys.argv[1]).read()))
