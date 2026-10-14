// #436 Every top-level route has its own, non-empty page title.
const ROUTES = ['#/', '#/phoenix', '#/rings', '#/topics', '#/compare', '#/how', '#/explore', '#/hypotheses', '#/submit'];
export default async (t) => {
  const seen = {};
  for (const r of ROUTES) {
    await t.open(r);
    await t.wait(1800);
    const title = (await t.js('document.title')) || '';
    t.ok(title.trim() !== '', r + ' has a title');
    (seen[title] = seen[title] || []).push(r);
  }
  const dup = Object.keys(seen).filter(k => seen[k].length > 1).map(k => seen[k].join(' and ') + ' share "' + k + '"');
  t.ok(dup.length === 0, 'all titles differ' + (dup.length ? ': ' + dup.join('; ') : ''));
};
