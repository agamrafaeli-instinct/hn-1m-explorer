// #380 and #381: table rows link to the Explorer.
export default async (t) => {
  await t.open('#/');
  t.equal(await t.js("document.querySelectorAll('.sgx_tbl a[href^=\"#/explore?domain=\"]').length"), 10, 'ten site rows link to the Explorer by site');
  t.equal(await t.js("document.querySelectorAll('.sgx_tbl a[href^=\"#/explore?q=\"]').length"), 13, 'thirteen sharp-return words link to the Explorer search');
  t.ok(await t.js("[...document.querySelectorAll('.sgx_tbl td a')].every(a=>a.getBoundingClientRect().height===0||a.getBoundingClientRect().height>=44)"), 'links are at least 44px tall');
};
