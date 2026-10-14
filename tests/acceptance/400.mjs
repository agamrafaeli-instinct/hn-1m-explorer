// #400 Share buttons on Hypotheses and Topics, and their share pages.
export default async (t) => {
  for (const r of ['hypotheses', 'topics']) {
    await t.open('#/' + r);
    await t.wait(800);
    const v = r === 'hypotheses' ? 'v_hyp' : 'v_topics';
    t.equal(await t.count('#' + v + ' button[data-share="' + r + '"]'), 1, r + ' has one share button');
    t.ok(await t.js("document.querySelector('#" + v + " .pg_share').getBoundingClientRect().height >= 44"), r + ' share button is 44px tall');
    t.ok(await t.js("fetch('share/p/" + r + ".html').then(x=>x.ok?x.text():'').then(x=>x.includes('url=../../#/" + r + "\"'))"), r + ' share page exists');
  }
  
};
