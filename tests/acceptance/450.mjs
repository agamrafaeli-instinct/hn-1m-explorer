export default async (t) => {
  for (const [route, title] of [['#/t/rust','Rust'], ['#/t/python','Python'], ['#/t/not-a-real-topic','Topic not found']]) {
    await t.open(route);
    t.ok(await t.js(`document.title.startsWith(${JSON.stringify(title + ' | ')})`), route + ': topic title');
    for (const [next, title2] of [['#/compare', 'Compare topics'], ['#/topics','Topics']]) {
      await t.js(`location.hash=${JSON.stringify(next)}`); await t.wait(500);
      t.ok(await t.js(`document.title.startsWith(${JSON.stringify(title2 + ' | ')})`), next + ': title restored');
    }
  }
};
