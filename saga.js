(function () {
  'use strict';
  // Saga beat 2 (#261): how many stories and how many points per story, each year, from data/saga.json (scripts/saga_data.py).
  var D = null, shelfReady = Promise.resolve(), countsReady = null;
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function needRings() {
    if (window.Rings) return Promise.resolve();
    return new Promise(function (ok, no) { var s = document.createElement('script'); s.src = 'rings.js'; s.onload = ok; s.onerror = function () { no(new Error('rings.js')); }; document.head.appendChild(s); });
  }
  function bars(label, vals, fmt, years, low, ik) {
    var row = el('div', 'sg_row'), cap = el('p', 'sg_cap'), mx = Math.max.apply(null, vals.filter(function (v, i) { return low.indexOf(years[i]) < 0; })) || 1, box = el('div', 'rg_bars sg_bars');
    cap.appendChild(el('b', null, label)); row.appendChild(cap);
    vals.forEach(function (v, i) {
      var isLow = low.indexOf(years[i]) >= 0, b = window.Rings.tipEl('span', 'rg_bar' + (isLow ? ' sg_low' : ''), '', years[i] + ': ' + fmt(v) + (isLow ? ' (points low in the archive)' : ''));
      b.style.height = Math.max(2, Math.round(Math.min(v, mx) / mx * 64)) + 'px'; box.appendChild(b);
    });
    row.appendChild(box); return row;
  }
  var returnBeat = null;
  document.addEventListener('click', function(e){
    var a=e.target.closest&&e.target.closest('a[href^="#/"]');
    if(!a||document.body.dataset.view!=='saga'||a.getAttribute('href').startsWith('#/saga'))return;
    var beat=a.closest('.sg_beat');if(!beat)return;
    returnBeat=['sg2','sg3','sg4','sg5','sg9'].includes(beat.id)?beat.id:null;
  });
  function returnLink(){
    document.querySelectorAll('.sg_return').forEach(function(a){a.remove();});
    if(!returnBeat||document.body.dataset.view==='saga')return;
    var view=document.getElementById('v_'+document.body.dataset.view);if(!view)return;
    var a=el('a','back sg_return','Return to the Home section');a.href='#/saga?beat='+returnBeat;
    a.style.cssText='display:flex;align-items:center;min-height:44px;padding:8px 18px;text-decoration:underline';view.prepend(a);
  }
  addEventListener('hashchange',function(){setTimeout(returnLink,0);});
  window.SagaShare=function(b){return new URL('share/p/home-'+b.dataset.beat+'.html',location.href.split('#')[0]).href;};
  function land(){
    if(document.body.dataset.view!=='saga')return;
    var id=new URLSearchParams(location.hash.split('?')[1]||'').get('beat');
    if(!id)scrollTo({top:0,behavior:'instant'});
    if(['sg2','sg3','sg4','sg5','sg9'].includes(id)){
      document.getElementById(id).scrollIntoView({behavior:'instant'});
      window.SetPageMeta(document.getElementById(id).querySelector('h2').textContent,'A section of Hacker News, counted. Existing sources and limits are shown in the essay.');
    }
  }
  window.SagaInit = function () {
    var map=document.getElementById('sg_map');
    if(map&&!map.dataset.on){map.dataset.on='1';map.appendChild(el('p','','Or start with a question:'));[['sg2','Every story, counted'],['sg3','Year by year'],['sg4','Two things only the full archive shows'],['sg5','The answer, and what it cannot settle'],['sg9','Start anywhere']].forEach(function(x){var a=el('a','',x[1]);a.href='#/saga?beat='+x[0];map.appendChild(a);});}

    var selected=new URLSearchParams(location.hash.split('?')[1]||'').get('beat');map.querySelectorAll('a').forEach(function(a){if(a.hash==='#/saga?beat='+selected)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});
    ['sg2','sg3','sg4','sg5'].forEach(function(id){var beat=document.getElementById(id);if(!beat.querySelector('[data-share=beat]')){var b=el('button','share-btn pg_share','Share this section');b.type='button';b.dataset.share='beat';b.dataset.beat=id;b.dataset.title=beat.querySelector('h2').textContent;beat.appendChild(b);}});
    var fm = document.getElementById('sg_find');
    if (fm && !fm.dataset.on) { fm.dataset.on = '1'; fm.addEventListener('submit', function (e) { e.preventDefault(); var q = document.getElementById('sg_q').value.trim().slice(0, 80); location.hash = '#/explore' + (q ? '?q=' + encodeURIComponent(q) : ''); }); }
    var shelf = document.getElementById('sg_shelf');
    if (shelf && !shelf.dataset.on) {
      shelf.dataset.on = '1'; var title=el('h2','','Pick a story');title.id='sg_shelf_title';shelf.appendChild(title);
      function choice(href,title,desc){var a=el('a','deep');a.href=href;a.appendChild(el('b','',title));a.appendChild(el('span','',desc));return a;}
      shelf.appendChild(choice('#/rings','What HN rewarded, year by year','Compare themes, sites and story types across years.'));
      shelf.appendChild(choice('#/phoenix','Quiet, then back','Words and sites that went quiet and returned.'));
      var pick=el('div');pick.id='sg_card_pick';shelf.appendChild(pick);
      shelf.appendChild(el('p','src rg_fine','Existing stories, with their sources and limits on each page.'));
      shelfReady = fetch('stories/h319.json').then(function(r){if(!r.ok)throw 0;return r.json();}).then(function(card){pick.replaceChildren(choice('#/c/'+card.id,card.question,'Title matching across the full archive, with its counts and caveats.'));}).catch(function(){pick.replaceChildren();});
    }
    var box = document.getElementById('sg_count'); if (!box) return Promise.resolve(); if (box.dataset.on) return Promise.all([shelfReady,countsReady]).then(land); box.dataset.on = '1';
    countsReady = Promise.all([fetch('data/saga.json').then(function (r) { if (!r.ok) throw new Error('saga.json ' + r.status); return r.json(); }), needRings()]).then(function (a) {
      D = a[0]; var y = D.years, n = y.length - 1, low = D.low_score_years, f = function (v) { return v.toLocaleString('en-US'); };
      box.replaceChildren(
        bars('Stories each year', D.stories, f, y, [], 'show'),
        bars('Points per story', D.points_per_story, function (v) { return v.toFixed(1); }, y, low, 'show'));
      var ax = el('div', 'rg_ax'); ax.appendChild(el('span', null, String(y[0]))); ax.appendChild(el('span', null, String(y[n]))); box.appendChild(ax);
      box.appendChild(el('p', 'rg_note rg_fine', 'Source: daily counts of every story in the archive, ' + D.first_month + ' to ' + D.last_month + '. 2006 and ' + y[n] + ' are partial years. Hollow bars: the archive holds low points for ' + low.join(' and ') + ', so they are not compared.'));
      window.Rings.wire(box);
      var rb = document.getElementById('sg_rings'); if (rb && !rb.dataset.on) { rb.dataset.on = '1'; window.Rings.mount(rb); }
    }).catch(function (e) { box.textContent = 'Could not load the counts: ' + e.message; });
    return Promise.all([shelfReady,countsReady]).then(land);
  };
})();
