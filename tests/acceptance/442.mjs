export default async (t) => {
  await t.open('#/topics?sort=rise&q=rust');
  t.equal(await t.js("document.getElementById('tp_q').value"), 'rust', 'search restored');
  t.equal(await t.js("document.getElementById('tp_sort').value"), 'rise', 'sort restored');
  t.ok(await t.js("[...document.querySelectorAll('#topics_list>a')].every(e=>e.hidden === !e.querySelector('b').textContent.toLowerCase().includes('rust'))"), 'filtered rows restored');
  await t.js("document.getElementById('tp_sort').value='fall';document.getElementById('tp_sort').dispatchEvent(new Event('change'))");
  t.equal(await t.js("new URLSearchParams(location.hash.split('?')[1]).get('q')"), 'rust', 'sorting keeps query');
  for (const text of ['Claude Code', 'C++ & ?', 'עברית 日本語']) {
    await t.js(`document.getElementById('tp_q').value=${JSON.stringify(text)};document.getElementById('tp_q').dispatchEvent(new Event('input'))`);
    const hash = await t.js('location.hash');
    await t.open(hash);
    t.equal(await t.js("document.getElementById('tp_q').value"), text, text + ': query round trip');
    t.equal(await t.js("document.getElementById('tp_sort').value"), 'fall', 'query keeps sort');
  }
  await t.js("document.getElementById('tp_q').value='';document.getElementById('tp_q').dispatchEvent(new Event('input'))");
  t.equal(await t.js("new URLSearchParams(location.hash.split('?')[1]).has('q')"), false, 'clear removes query');
  t.equal(await t.count('#topics_list>a[hidden]'), 0, 'clear shows all topics');
  t.ok(await t.js('document.documentElement.scrollWidth<=innerWidth+1'), 'no sideways scroll');
};
