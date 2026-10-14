// Each share button names the destination in its accessible label.
export default async (t) => {
  const routes = [
    ['#/', 'Hacker News, counted'], ['#/rings', 'What HN rewarded, year by year'],
    ['#/phoenix', 'Quiet, then back'], ['#/hypotheses', 'Hypotheses, tested'],
    ['#/topics', 'Topics'], ['#/compare', 'Compare topics'],
    ['#/c/h422', 'h422'], ['#/w/engineers/', 'week']
  ];
  for (const [route, name] of routes) {
    await t.open(route);
    await t.wait(1800);
    const labels = JSON.parse(await t.js("JSON.stringify([...document.querySelectorAll('button.share-btn')].filter(e=>!e.closest('[hidden]')).map(e=>({label:e.getAttribute('aria-label')||'',text:e.textContent})))"));
    t.ok(labels.length > 0, route + ': share button exists');
    t.ok(labels.every(e => e.label.includes(name) || (route === '#/hypotheses' && /^Share card h[0-9]+: .+/.test(e.label))), route + ': label names destination');
    t.ok(labels.every(e => /^Share this (page|card|week)$/.test(e.text)), route + ': visible text explains scope');
    t.ok(await t.js('document.documentElement.scrollWidth<=innerWidth+1'), route + ': no sideways scroll');
  }
  // Restore the explicit label after copy feedback. No external share is sent.
  await t.open('#/topics');
  await t.js("Object.defineProperty(navigator,'share',{value:undefined,configurable:true});Object.defineProperty(navigator,'clipboard',{value:{writeText:async()=>{}},configurable:true})");
  await t.click('#v_topics button[data-share]');
  t.equal(await t.text('#v_topics button[data-share]'), 'Link copied', 'copy feedback');
  await t.wait(2300);
  t.equal(await t.text('#v_topics button[data-share]'), 'Share this page', 'explicit label restored');
};
