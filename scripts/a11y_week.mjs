#!/usr/bin/env node
// Accessibility audit of the three This week screens at 320, 390 and 430px. Prints JSON findings.
// usage: node scripts/a11y_week.mjs --site http://127.0.0.1:8766/
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : process.argv[i + 1]; };
const SITE = arg('site', 'http://127.0.0.1:8766/').replace(/\/?$/, '/');
const port = 9500 + Math.floor(Math.random() * 150), prof = fs.mkdtempSync(path.join(os.tmpdir(), 'a11y-'));
const ch = spawn('google-chrome', ['--headless=new', '--no-sandbox', '--disable-gpu', '--remote-debugging-port=' + port, '--user-data-dir=' + prof, 'about:blank'], { stdio: 'ignore' });
let tabs; for (let i = 0; i < 60 && !tabs; i++) { await new Promise(r => setTimeout(r, 250)); try { tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); } catch { } }
const ws = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
let id = 0; const pend = {};
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend[m.id]) { pend[m.id](m.result); delete pend[m.id]; } };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async expr => (await send('Runtime.evaluate', { expression: expr, returnByValue: true })).result.value;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const PAGE = `(()=>{
  const out = { contrast: [], small_targets: [], no_name: [], overflow: null, focus: [], reduced_motion_css: false, lang: document.documentElement.lang, h1: document.querySelectorAll('h1').length, headings: [...document.querySelectorAll('#w_body h2,#w_body h3')].map(h=>h.tagName).join('') };
  const parse = c => { const m = c.match(/rgba?\\(([^)]+)\\)/); if (!m) return null; const p = m[1].split(/[ ,\\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const bg = el => { let e = el; let base = { r: 255, g: 255, b: 255 }; const stack = []; while (e) { const c = parse(getComputedStyle(e).backgroundColor); if (c && c.a > 0) { stack.push(c); if (c.a >= 1) break; } e = e.parentElement; } for (let i = stack.length - 1; i >= 0; i--) { const c = stack[i]; base = { r: c.r * c.a + base.r * (1 - c.a), g: c.g * c.a + base.g * (1 - c.a), b: c.b * c.a + base.b * (1 - c.a) }; } return base; };
  const seen = new Set();
  document.querySelectorAll('#w_body *').forEach(el => {
    const own = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()); if (!own) return;
    const cs = getComputedStyle(el); const fg = parse(cs.color); if (!fg) return; const b = bg(el);
    const f = { r: fg.r * fg.a + b.r * (1 - fg.a), g: fg.g * fg.a + b.g * (1 - fg.a), b: fg.b * fg.a + b.b * (1 - fg.a) };
    const L1 = lum(f), L2 = lum(b), ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    const px = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight) >= 700, large = px >= 24 || (px >= 18.66 && bold), need = large ? 3 : 4.5;
    if (ratio < need) { const k = el.tagName + '.' + el.className + '|' + ratio.toFixed(2); if (!seen.has(k)) { seen.add(k); out.contrast.push({ el: el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).split(' ')[0] : ''), text: el.textContent.trim().slice(0, 40), ratio: +ratio.toFixed(2), need, px }); } }
  });
  const tg = [...document.querySelectorAll('a[href],button,input,select,textarea,[tabindex]')].filter(e => e.offsetParent !== null);
  tg.forEach(e => { const r = e.getBoundingClientRect(); const inline = getComputedStyle(e).display === 'inline' && e.tagName === 'A' && e.closest('p,li,div:not(.wl)') && e.textContent.trim().length > 0 && r.height < 24 && e.closest('#w_body'); if (r.width < 24 || r.height < 24) out.small_targets.push({ el: e.tagName.toLowerCase(), text: (e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 40), w: Math.round(r.width), h: Math.round(r.height) }); });
  tg.forEach(e => { const n = (e.getAttribute('aria-label') || e.textContent || e.getAttribute('title') || '').trim(); if (!n) out.no_name.push(e.outerHTML.slice(0, 80)); });
  out.overflow = document.documentElement.scrollWidth > innerWidth ? document.documentElement.scrollWidth + ' > ' + innerWidth : null;
  out.focus = tg.filter(e => e.closest('#w_body, #tabs')).map(e => (e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 24)).slice(0, 12);
  try { for (const s of document.styleSheets) for (const r of s.cssRules) if (r.media && /prefers-reduced-motion/.test(r.media.mediaText)) out.reduced_motion_css = true; } catch (e) { }
  out.animated = [...document.querySelectorAll('#w_body *')].filter(e => { const s = getComputedStyle(e); return s.animationName !== 'none' || parseFloat(s.transitionDuration) > 0; }).length;
  return out;
})()`;
const res = {};
for (const w of [320, 390, 430]) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: 844, deviceScaleFactor: 2, mobile: true });
  for (const a of ['engineers', 'vcs', 'geeks']) {
    await send('Page.navigate', { url: SITE + '#/w/' + a }); await send('Page.navigate', { url: SITE + '?r=' + w + a + '#/w/' + a });
    for (let i = 0; i < 40; i++) { await sleep(250); if (await ev("!!document.querySelector('#w_body .wsec')")) break; }
    res[a + '@' + w] = await ev(PAGE);
  }
}
console.log(JSON.stringify(res, null, 1));
ch.kill(); process.exit(0);
