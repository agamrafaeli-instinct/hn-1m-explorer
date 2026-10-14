export default async (t) => {
  for (const [route, label, close] of [['#/t/rust', 'Rust', 'button'], ['#/t/python', 'Python', 'cancel']]) {
    await t.open(route);
    for (let i = 0; i < 2; i++) {
      await t.click('.cmp_det');
      t.equal(await t.js("document.querySelector('dialog').getAttribute('aria-labelledby')"), 'cmp_dialog_title', 'dialog names its heading');
      t.equal(await t.text('#cmp_dialog_title'), label, 'heading names selected topic');
      t.equal(await t.count('#cmp_dialog_title'), 1, 'heading ID is unique');
      if (close === 'button') await t.click('dialog button');
      else await t.js("document.querySelector('dialog').requestClose()");
      await t.wait(200);
      t.equal(await t.count('#cmp_dialog_title'), 0, 'close removes heading');
    }
  }
};
