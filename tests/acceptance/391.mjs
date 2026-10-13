// #391 each home essay section ends with a link to the page that holds its data.
export default async (t) => {
  await t.open('#/');
  const want = { sg2: '#/explore', sg3: '#/rings', sg4: '#/phoenix', sg5: '#/how' };
  for (const [id, href] of Object.entries(want)) {
    t.equal(await t.js("(document.querySelector('#" + id + " .sg_next a')||{}).getAttribute('href')"), href, id + ' ends with a link to ' + href);
  }
  t.ok(await t.js("[...document.querySelectorAll('.sg_next a')].every(a=>a.getBoundingClientRect().height>=44)"), 'links are at least 44px tall');
};
