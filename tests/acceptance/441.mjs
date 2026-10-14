// Simulated browser copy results. No native share or external send occurs.
const mock = (kind) => `Object.defineProperty(navigator,'share',{value:${kind === 'abort' ? "async()=>{throw {name:'AbortError'}}" : 'undefined'},configurable:true});Object.defineProperty(navigator,'clipboard',{value:{writeText:async()=>{${kind === 'ok' ? '' : "throw new Error('blocked')"}}},configurable:true});document.execCommand=()=>false`;
export default async (t) => {
  for (const [route, root, label, path] of [['#/c/h422', '#v_aud', 'Share this card', '/share/c/h422.html'], ['#/w/engineers/', '#v_week', 'Share this week', '/share/w/engineers/']]) {
    await t.open(route); await t.wait(1200);
    await t.js(mock('fail'));
    await t.click(root + ' .share-btn');
    t.equal(await t.text(root + ' .share-btn'), 'Copy the link below', route + ': honest feedback');
    t.equal(await t.count(root + ' input.share_link'), 1, 'one fallback field');
    t.ok(await t.js(`document.querySelector('${root} input.share_link').value.includes('${path}')`), 'right share link');
    t.ok(await t.js(`document.querySelector('${root} input.share_link').readOnly && !!document.querySelector('${root} input.share_link').getAttribute('aria-label')`), 'accessible read-only field');
    t.ok(await t.js('document.documentElement.scrollWidth<=innerWidth+1'), 'fallback fits phone');
    await t.click(root + ' .share-btn');
    t.equal(await t.count(root + ' input.share_link'), 1, 'retry does not duplicate field');
    await t.open(route); await t.wait(1200);
    await t.js(mock('ok')); await t.click(root + ' .share-btn');
    t.equal(await t.text(root + ' .share-btn'), 'Link copied', 'success feedback');
    await t.wait(2300);
    t.equal(await t.text(root + ' .share-btn'), label, 'label restored');
    await t.open(route); await t.wait(1200);
    await t.js(mock('abort')); await t.click(root + ' .share-btn');
    t.equal(await t.text(root + ' .share-btn'), label, 'cancelled share leaves label alone');
    t.equal(await t.count(root + ' input.share_link'), 0, 'cancelled share does not copy');
  }
};
