// #419 Every visible link and button on each top-level route is at least 44px tall at 390px.
const ROUTES = ['#/', '#/phoenix', '#/rings', '#/topics', '#/compare', '#/how', '#/explore?q=a', '#/hypotheses'];
const SCAN = `(() => { const bad = []; document.querySelectorAll('a[href], button').forEach(e => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); if (!r.width || !r.height || cs.visibility === 'hidden' || e.closest('[hidden]')) return; if (r.height < 43.5) bad.push((e.textContent || e.getAttribute('aria-label') || e.id || e.tagName).trim().slice(0, 40) + ' [' + e.tagName.toLowerCase() + '.' + (e.className || e.parentNode.className) + '] (' + Math.round(r.width) + 'x' + Math.round(r.height) + ')'); }); return bad.join(' | '); })()`;
export default async (t) => {
  for (const r of ROUTES) {
    await t.open(r);
    await t.wait(r.includes('explore') ? 8000 : 3500);
    const bad = await t.js(SCAN);
    t.ok(bad === '', r + ' small targets: ' + bad);
  }
};
