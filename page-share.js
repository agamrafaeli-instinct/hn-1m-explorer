'use strict';
window.SharePage = async function(b) {
    let url = new URL('share/p/' + b.dataset.share + '.html', location.href.split('#')[0]).href;
    if (b.dataset.share === 'compare' || b.dataset.share === 'topics') {
      const current = new URLSearchParams(location.hash.split('?')[1] || ''), chosen = new URLSearchParams();
      const keys = b.dataset.share === 'compare' ? ['topics', 'years'] : ['q', 'sort'];
      keys.forEach(k => { const v = current.get(k); if (v) chosen.set(k, v); });
      if (chosen.toString()) url = location.href.split('#')[0] + '#/' + b.dataset.share + '?' + chosen.toString();
    }
    if (b.dataset.share === 'finder') url = location.href.split('#')[0] + '#/saga?beat=sg_shelf&storyq=' + encodeURIComponent(document.getElementById('sg_storyq').value.slice(0,120));
    if (b.dataset.share === 'topic') url = location.href;
    if (b.dataset.share === 'beat') url = window.SagaShare(b);
    const title = b.dataset.share === 'finder' ? 'Published Hacker News questions' : b.dataset.share === 'beat' ? b.dataset.title : b.dataset.share === 'topic' ? document.title : (window.PageTitles[b.dataset.share] || [''])[0] + ' (Hacker News)';
    try { if (navigator.share) { await navigator.share({ title, text: title, url }); return; } } catch (err) { if (err && err.name === 'AbortError') return; }
    const original = b.textContent; let ok = false;
    try { await navigator.clipboard.writeText(url); ok = true; } catch (err) { const t = document.createElement('textarea'); t.value = url; t.style.position = 'fixed'; t.style.opacity = '0'; document.body.appendChild(t); t.select(); try { ok = document.execCommand('copy'); } catch (e2) { } t.remove(); }
    if (ok) { b.textContent = 'Link copied'; setTimeout(() => { b.textContent = original; }, 2000); return; }
    // Copy was blocked: show the link in a field the visitor can select and copy by hand.
    let f = b.parentNode.querySelector('input.share_link');
    if (!f) { f = document.createElement('input'); f.className = 'share_link'; f.readOnly = true; f.setAttribute('aria-label', 'Link to copy'); f.style.cssText = 'display:block;width:100%;box-sizing:border-box;margin:8px 0;padding:10px;font-size:16px'; b.after(f); }
    f.value = url; f.focus(); f.select(); b.textContent = 'Copy the link below'; setTimeout(() => { b.textContent = original; }, 4000);
};
