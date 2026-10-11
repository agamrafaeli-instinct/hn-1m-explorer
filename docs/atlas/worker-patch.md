# DuckDB-WASM worker patch for range reads on GitHub Pages

Applied on the site since #198: `scripts/patch_duckdb_worker.py STOCK OUT` writes `vendor/duckdb/worker.js` from the stock `duckdb-browser-eh.worker.js` (npm @duckdb/duckdb-wasm 1.33.1-dev65.0, since 1.33.1 itself is not on npm). The script and `tests/test_rowsearch.py` fail if the stock string is not found exactly once, so an engine upgrade cannot ship unpatched. `vendor/duckdb/duck.mjs` is the esbuild bundle of `duckdb-browser.mjs` (exports AsyncDuckDB, VoidLogger, DuckDBDataProtocol).

Original condition in the HTTP file open step:

    if(d!==null&&f.status==206){

Patched condition (also accept a 200 answer to the HEAD request when the server says it accepts byte ranges):

    if(d!==null&&(f.status==206||f.status==200&&f.getResponseHeader("Accept-Ranges")=="bytes")){

Settings used with it: `db.open({filesystem:{allowFullHTTPReads:false, reliableHeadRequests:true, forceFullHTTPReads:false}})` and `registerFileURL(name, url, DuckDBDataProtocol.HTTP, true)`.

Why: the stock worker only uses range reads when the HEAD request with `Range: bytes=0-` is answered with 206. GitHub Pages answers 200.

Open items for task 7c: ship the patched file with a test that fails if the string is not found after an engine upgrade, and re-measure after each upgrade.
