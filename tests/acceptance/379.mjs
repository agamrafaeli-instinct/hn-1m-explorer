// #379 Explorer keeps its filters in the address, so Back restores them.
export default async (t) => {
  await t.open('#/explore?q=rust&min=50&by=pg');
  await t.wait(1500);
  t.equal(await t.js("document.getElementById('q').value+'|'+document.getElementById('minscore').value+'|'+document.getElementById('by').value"), 'rust|50|pg', 'a link fills word, minimum score and author');
  await t.js("(()=>{const q=document.getElementById('q');q.value='python';q.dispatchEvent(new Event('input',{bubbles:true}))})()");
  await t.wait(500);
  t.ok(await t.js("location.hash.includes('q=python') && location.hash.includes('min=50')"), 'typing a filter writes it to the address');
  await t.js("document.getElementById('reset').click()");
  await t.wait(300);
  t.equal(await t.js("location.hash"), '#/explore', 'reset clears the address filters');
};
