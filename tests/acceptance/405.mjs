// #405 Phone sweep: link tap targets on Phoenix and Rings are at least 44 px both ways.
export default async (t) => {
  for (const r of ['phoenix', 'rings']) {
    await t.open('#/' + r);
    await t.wait(3000);
    t.equal(await t.js("[...document.querySelectorAll('#v_" + r + " a, #v_" + r + " button')].filter(a=>{const b=a.getBoundingClientRect();return b.width>0&&(b.width<44||b.height<44)}).length"), 0, r + ' has no tap target under 44 px');
  }
};
