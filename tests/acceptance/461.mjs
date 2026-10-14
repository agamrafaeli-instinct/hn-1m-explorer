export default async(t)=>{
 await t.open('#/t/rust');
 t.equal(await t.js("document.querySelector('.cmp_dict').getAttribute('href')"),'https://github.com/agamrafaeli-instinct/hn-1m-explorer/blob/main/data/topic_series.json','exact dictionary source');
 t.ok((await t.text('.cmp_words')).includes('ignoring case')&&(await t.text('.cmp_dict')).includes('rust'),'identity and scope');
 t.ok(await t.js("(()=>{const r=document.querySelector('.cmp_dict').getBoundingClientRect();return r.height>=44&&r.width>=44&&document.documentElement.scrollWidth<=innerWidth+1})()"),'phone source target');
};
