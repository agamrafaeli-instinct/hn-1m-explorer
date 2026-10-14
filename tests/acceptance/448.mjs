export default async (t) => {
  await t.open('#/topics?sort=fall&q=not-a-topic');
  t.ok(await t.js("!document.getElementById('tp_clear').hidden"), 'clear shown on URL restoration');
  t.ok(await t.js("(()=>{const r=document.getElementById('tp_clear').getBoundingClientRect();return r.height>=44 && r.width>=44})()"), 'clear is a phone tap target');
  await t.click('#tp_clear');
  t.equal(await t.count('#topics_list>a[hidden]'), 0, 'clear restores all topics');
  t.equal(await t.js("new URLSearchParams(location.hash.split('?')[1]).has('q')"), false, 'clear removes URL query');
  t.equal(await t.js("document.getElementById('tp_sort').value"), 'fall', 'sort preserved');
  t.ok(await t.js("document.activeElement===document.getElementById('tp_q')"), 'focus returns to search');
  t.ok(await t.js("document.getElementById('tp_clear').hidden"), 'clear hidden when empty');
  await t.js("document.getElementById('tp_q').value='rust';document.getElementById('tp_q').dispatchEvent(new Event('input'))");
  t.ok(await t.js("!document.getElementById('tp_clear').hidden"), 'typing shows clear');
  t.ok(await t.js('document.documentElement.scrollWidth<=innerWidth+1'), 'no sideways scroll');
};
