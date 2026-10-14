(function () {
'use strict';
var baselineNotice = null;
function el(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e;}
var pct = function(v){return(v<0.1?v.toFixed(3):v<1?v.toFixed(2):v.toFixed(1))+'%';};
  window.TopicPeriod = function (tid, D, evidence, topicId) {
    var slot = document.getElementById('cmp_baseline'), hash = location.hash;
    slot.hidden = false; slot.textContent = 'Loading period counts...';
    evidence().then(function (film) {
      if (location.hash !== hash || !slot.isConnected) return;
      var initial = TopicBaseline.compare(film, D, tid), years = initial.eligibleYears;
      var params = new URLSearchParams(hash.split('?')[1] || ''), base = params.get('base'), range = null, note = baselineNotice && baselineNotice.hash === hash ? baselineNotice.text : '';
      if (base) {
        var m = /^(\d{4})-(\d{4})$/.exec(base);
        if (m && years.indexOf(+m[1]) >= 0 && years.indexOf(+m[2]) >= 0 && +m[1] <= +m[2]) range = { from: +m[1], to: +m[2] };
        else { note = 'Invalid baseline. Showing all earlier months.'; params.delete('base'); history.replaceState(null, '', location.pathname + location.search + hash.split('?')[0] + (params.toString() ? '?' + params.toString() : '')); baselineNotice = {hash: location.hash, text: note}; }
      }
      var result = TopicBaseline.compare(film, D, tid, range); slot.replaceChildren();
      slot.appendChild(el('h3', '', 'Compare with an earlier baseline'));
      var explanation = el('p', 'src rg_fine', 'Latest stays fixed. All earlier months includes every source month before it, even months in its first year. A chosen range uses only earlier calendar years. Counts use available source months; the first archive year may be partial. Chart zoom does not change this baseline.'); slot.appendChild(explanation);
      if (note) slot.appendChild(el('p', 'src rg_fine baseline_notice', note));
      var controls = el('div', 'baseline_controls');
      function choose(label, id, value) {
        var l = el('label', '', label), select = el('select', 'cmp_add'); select.id = id;
        years.forEach(function (y) { var o = el('option', '', y); o.value = y; select.appendChild(o); }); select.value = value;
        l.appendChild(select); controls.appendChild(l); return select;
      }
      var from = choose('Earlier from year', 'base_from', range ? range.from : years[0]), to = choose('Earlier through year', 'base_to', range ? range.to : years[years.length - 1]);
      function update(value) { baselineNotice = null; var q = new URLSearchParams(location.hash.split('?')[1] || ''); if (value) q.set('base', value); else q.delete('base'); location.hash = '#/t/' + tid + (q.toString() ? '?' + q.toString() : ''); }
      var apply = el('button', 'cmp_chip', 'Use these years'); apply.type = 'button'; apply.disabled = !years.length;
      var error = el('p', 'src rg_fine'); error.setAttribute('role', 'status');
      apply.onclick = function () { if (+from.value > +to.value) { error.textContent = 'From year must be no later than through year.'; return; } update(from.value + '-' + to.value); };
      var reset = el('button', 'cmp_chip', 'Use all earlier months'); reset.type = 'button'; reset.onclick = function () { update(null); };
      controls.appendChild(apply); controls.appendChild(reset); slot.appendChild(controls); slot.appendChild(error);
      function period(label, v) { var months = v.months, p = el('p', 'baseline_period'); p.appendChild(el('b', '', label + (months.length ? ', ' + months[0] + ' to ' + months[months.length - 1] : ', no source months'))); p.appendChild(el('span', '', v.n.toLocaleString('en-US') + ' matching titles / ' + v.total.toLocaleString('en-US') + ' all-story titles; pooled share ' + (v.share === null ? 'unavailable' : pct(v.share * 100)) + '.')); slot.appendChild(p); }
      period('Latest 12 months', result.latest); period(range ? 'Baseline years ' + range.from + ' to ' + range.to : 'All earlier months', result.baseline);
      slot.appendChild(el('p', 'baseline_ratio', result.ratio === null ? 'Latest-to-baseline ratio unavailable: an empty period, zero total or zero baseline share has no ratio.' : 'Latest-to-baseline share ratio: ' + result.ratio.toFixed(2) + 'x. A ratio does not establish a cause.'));
      var share = el('button', 'cmp_chip', 'Share this page'); share.type = 'button'; share.dataset.share = 'topic'; slot.appendChild(share);
    }).catch(function (err) { if (topicId() === tid) { slot.textContent = 'Period comparison unavailable: ' + err.message + '. No data was substituted.'; } });
  };
})();
