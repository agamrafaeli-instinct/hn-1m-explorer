const capture = "Object.defineProperty(navigator,'share',{value:async x=>{window.share451=x},configurable:true})";
export default async (t) => {
  await t.open('#/topics?sort=fall&q=rust');
  const rows = await t.js("[...document.querySelectorAll('#topics_list>a')].filter(e=>!e.hidden).map(e=>e.getAttribute('href')).join('|')");
  await t.js(capture); await t.click('#v_topics .share-btn');
  const url = await t.js('window.share451.url');
  t.equal(await t.js("new URLSearchParams(window.share451.url.split('?')[1]).get('q')"), 'rust', 'query preserved');
  t.equal(await t.js("new URLSearchParams(window.share451.url.split('?')[1]).get('sort')"), 'fall', 'sort preserved');
  await t.open(url.slice(url.indexOf('#')));
  t.equal(await t.js("[...document.querySelectorAll('#topics_list>a')].filter(e=>!e.hidden).map(e=>e.getAttribute('href')).join('|')"), rows, 'same visible rows and order');
  await t.js("Object.defineProperty(navigator,'share',{value:undefined,configurable:true});Object.defineProperty(navigator,'clipboard',{value:{writeText:async x=>{window.copy451=x}},configurable:true})");
  await t.click('#v_topics .share-btn');
  t.equal(await t.js('window.copy451'), url, 'copy fallback preserves view');
  await t.js("window.copy451=null;Object.defineProperty(navigator,'share',{value:async()=>{throw {name:'AbortError'}},configurable:true})");
  await t.click('#v_topics .share-btn');
  t.equal(await t.js('window.copy451'), null, 'cancelled share does not copy');
  await t.open('#/topics'); await t.js(capture); await t.click('#v_topics .share-btn');
  t.ok(await t.js("window.share451.url.endsWith('/share/p/topics.html')"), 'unfiltered list keeps share page');
};
