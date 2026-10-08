(function(){
'use strict';

const API_VERSION = '4.0';
const CONTACT_URL   = 'https://t.me/xcnak';
const CONTACT_LABEL = '@xcnak';
const DONATE_CARD   = '2202206254152148';

const $ = s => document.querySelector(s);
const $$ = s => Array.prototype.slice.call(document.querySelectorAll(s));

const LS = {
  get(k, d){
    try { const v = localStorage.getItem('calc_' + k); return v ? JSON.parse(v) : d; }
    catch (e) { return d; }
  },
  set(k, v){
    try { localStorage.setItem('calc_' + k, JSON.stringify(v)); } catch (e) {}
  },
  del(k){ try { localStorage.removeItem('calc_' + k); } catch (e) {} }
};

const parseVer = v => String(v || '1.0').split('.').map(n => parseInt(n, 10) || 0);

const S = Object.assign({
  mode: 'auto',
  hue: 'sys',
  vib: true,
  pow: 1,
  anim: !matchMedia('(prefers-reduced-motion: reduce)').matches,
  pluginTheme: null
}, LS.get('s', {}));
const saveS = () => LS.set('s', S);

let PAL = null;
let currentPage = 'calc';

const vib = m => {
  if (!S.vib) return false;
  const p = m || [8, 16, 28][S.pow] || 20;
  try {
    const N = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.NativeTools;
    if (N) { N.vibrate(Array.isArray(p) ? { pattern: p } : { duration: p }).catch(() => {}); return true; }
    if (navigator.vibrate) return navigator.vibrate(p);
  } catch (e) {}
  return false;
};
document.addEventListener('click', () => { if (window._vf) { window._vf = 0; vib(); } });

let tt;
const toast = m => {
  const t = $('#toast');
  if (!t) return;
  t.textContent = String(m);
  t.classList.add('on');
  clearTimeout(tt);
  tt = setTimeout(() => t.classList.remove('on'), 2400);
};

window.addEventListener('error', e => {
  if (e && e.message && e.message !== 'Script error.') {
    try { toast('Ошибка: ' + e.message); } catch (x) {}
  }
});
window.addEventListener('unhandledrejection', e => {
  try {
    const r = e && e.reason;
    toast('Ошибка: ' + ((r && r.message) || r || 'unknown'));
  } catch (x) {}
});

function sysHue(){
  try {
    const d = document.createElement('div');
    d.style.color = 'AccentColor';
    document.body.append(d);
    const col = getComputedStyle(d).color;
    d.remove();
    const nums = col.match(/[\d.]+/g);
    if (!nums) return 150;
    const [r, g, b] = nums.map(Number).map(x => x / 255);
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), c = mx - mn;
    if (c < .12) return 150;
    let h = mx === r ? ((g - b) / c) % 6 : mx === g ? (b - r) / c + 2 : (r - g) / c + 4;
    return Math.round((h * 60 + 360) % 360);
  } catch (e) { return 150; }
}

const HUES = [
  ['sys','Системный'],[150,'Зелёный'],[210,'Синий'],[270,'Фиолетовый'],
  [340,'Розовый'],[20,'Оранжевый'],[45,'Жёлтый']
];

function palMap(d){
  const P = PAL;
  return d ? {
    bg: P.n1_900, sf: P.n1_800, sc: P.n1_700, sfc_hi: P.n1_700,
    pr: P.a1_200, onpr: P.a1_800,
    pc: P.a1_700, onpc: P.a1_100,
    tc: P.a3_700, ontc: P.a3_100,
    tx: P.n1_100, tx2: P.n2_200, ol: P.n2_700,
    outline_variant: P.n2_800
  } : {
    bg: P.n1_10, sf: P.n1_50, sc: P.n2_100, sfc_hi: P.n2_50,
    pr: P.a1_600, onpr: P.a1_0,
    pc: P.a1_100, onpc: P.a1_900,
    tc: P.a3_100, ontc: P.a3_900,
    tx: P.n1_900, tx2: P.n2_700, ol: P.n2_200,
    outline_variant: P.n2_100
  };
}

function normalizeKey(k){ return String(k).replace(/^-+/, ''); }

function applyTheme(){
  try {
    const mq = matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = S.mode === 'dark' || (S.mode === 'auto' && mq);
    const h = S.hue === 'sys' ? sysHue() : +S.hue;
    const H = (a, s, l) => 'hsl(' + (a % 360) + ' ' + s + '% ' + l + '%)';
    const t = h + 60;

    let p;
    if (S.hue === 'sys' && PAL && PAL.a1_600) {
      p = palMap(dark);
    } else if (dark) {
      p = {
        bg: H(h,14,8), sf: H(h,14,13), sc: H(h,12,20), sfc_hi: H(h,12,24),
        pr: H(h,60,76), onpr: H(h,60,12),
        pc: H(h,45,26), onpc: H(h,70,90),
        tc: H(t,30,26), ontc: H(t,60,90),
        tx: H(h,10,90), tx2: H(h,8,68), ol: H(h,8,32),
        outline_variant: H(h,8,22)
      };
    } else {
      p = {
        bg: H(h,30,97), sf: H(h,22,92), sc: H(h,20,86), sfc_hi: H(h,22,88),
        pr: H(h,55,36), onpr: '#fff',
        pc: H(h,65,86), onpc: H(h,80,10),
        tc: H(t,40,84), ontc: H(t,80,10),
        tx: H(h,10,10), tx2: H(h,8,38), ol: H(h,10,80),
        outline_variant: H(h,15,90)
      };
    }

    if (S.pluginTheme && THEMES[S.pluginTheme]) {
      const theme = THEMES[S.pluginTheme];
      const vars = dark ? theme.dark : theme.light;
      if (vars) {
        for (const k in vars) {
          const clean = normalizeKey(k);
          if (clean) p[clean] = vars[k];
        }
      }
    }

    const r = document.documentElement.style;
    for (const k in p) {
      r.setProperty('--' + k.replace(/_/g, '-'), p[k]);
    }
    r.colorScheme = dark ? 'dark' : 'light';

    const mt = document.querySelector('meta[name=theme-color]');
    if (mt) mt.content = p.bg;

    emit('theme:change', { dark });
  } catch (e) { console.error('applyTheme', e); }
}
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);

const D = Math.PI / 180;
const F = {
  sin: x => Math.sin(x * D),
  cos: x => Math.cos(x * D),
  tan: x => Math.tan(x * D),
  ln: Math.log,
  log: Math.log10,
  sqrt: Math.sqrt,
  '√': Math.sqrt,
  abs: Math.abs
};
const CONSTS = { pi: Math.PI, π: Math.PI, e: Math.E };

function ev(s){
  const t = s.replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-')
    .match(/\d+\.?\d*|\.\d+|[a-zπ√]+|[-+*/^()%]/g) || [];
  let i = 0;
  const pe = () => {
    let v = pt();
    while (t[i] === '+' || t[i] === '-') {
      const o = t[i++], r = pt(), pc = t[i-1] === '%';
      v = o === '+' ? v + (pc ? v * r : r) : v - (pc ? v * r : r);
    }
    return v;
  };
  const pt = () => {
    let v = pp();
    while (t[i] === '*' || t[i] === '/') {
      const o = t[i++], r = pp();
      v = o === '*' ? v * r : v / r;
    }
    return v;
  };
  const pp = () => { const b = pu(); if (t[i] === '^') { i++; return Math.pow(b, pp()); } return b; };
  const pu = () => {
    if (t[i] === '-') { i++; return -pu(); }
    if (t[i] === '+') { i++; return pu(); }
    return po();
  };
  const po = () => { let v = pa(); while (t[i] === '%') { i++; v /= 100; } return v; };
  const pa = () => {
    const x = t[i++];
    if (x == null) throw new Error('unexpected end');
    if (/^[\d.]/.test(x)) return parseFloat(x);
    if (x === '(') { const v = pe(); if (t[i] === ')') i++; return v; }
    if (CONSTS[x] !== undefined) return CONSTS[x];
    if (F[x]) {
      if (t[i++] !== '(') throw new Error('need (');
      const v = pe();
      if (t[i] === ')') i++;
      return F[x](v);
    }
    throw new Error('bad token: ' + x);
  };
  const v = pe();
  if (i < t.length) throw new Error('trailing tokens');
  return v;
}

const fmt = n => {
  if (!isFinite(n)) throw new Error('not finite');
  const s = +n.toPrecision(12);
  if (Math.abs(s) >= 1e15 || (s !== 0 && Math.abs(s) < 1e-9)) {
    return s.toExponential(6).replace(/\.?0+e/, 'e');
  }
  return String(s).replace('-', '−');
};

let expr = LS.get('ex', '');
let done = false;
let hist = LS.get('h', []);

const isOp = c => '+−×÷^'.indexOf(c) >= 0;

function upd(){
  LS.set('ex', expr);
  const e = $('#ex');
  if (e) {
    e.textContent = expr || '0';
    e.className = expr.length > 22 ? 's' : expr.length > 11 ? 'm' : '';
  }
  const rs = $('#rs');
  if (!rs) return;
  let r = '';
  if (expr && !done) {
    try {
      const v = fmt(ev(expr));
      if (v !== expr && /[^\d.]/.test(expr.replace(/^−/, ''))) r = '= ' + v;
    } catch (x) {}
  }
  rs.textContent = r;
  emit('calc:change', { expr });
}

function ins(s){
  if (done) { expr = isOp(s[0]) || s === '%' ? expr : ''; done = false; }
  if (expr.length < 60) expr += s;
  upd();
}

function press(v){
  const hook = { key: v, expr, cancel: false };
  emit('calc:press', hook);
  if (hook.cancel) return;

  if (v === 'AC') { expr = ''; done = false; }
  else if (v === '⌫') { expr = expr.replace(/(?:[a-z√]+\(|.)$/, ''); done = false; }
  else if (v === '=') {
    if (!expr) return;
    try {
      const r = fmt(ev(expr));
      const resultEvent = { expr, result: r, cancel: false };
      emit('calc:result', resultEvent);
      if (resultEvent.cancel) return;
      const finalExpr = resultEvent.expr;
      const finalResult = resultEvent.result;

      hist.unshift({ e: finalExpr, r: finalResult });
      hist = hist.slice(0, 50);
      LS.set('h', hist);
      expr = finalResult;
      done = true;
      const rs = $('#rs');
      upd();
      if (rs) rs.textContent = '';
      const ex = $('#ex');
      if (ex && ex.animate) {
        ex.animate(
          [{ transform: 'scale(.85)', opacity: .4 }, { transform: 'none', opacity: 1 }],
          { duration: 350, easing: 'cubic-bezier(.2,.9,.3,1.4)' }
        );
      }
      vib([10, 40, 18]);
      return;
    } catch (e) {
      const d = $('#disp');
      if (d) { d.classList.remove('shake'); void d.offsetWidth; d.classList.add('shake'); }
      vib([30, 40, 30]);
      return;
    }
  }
  else if (v === '()') {
    const o = (expr.match(/\(/g) || []).length;
    const c = (expr.match(/\)/g) || []).length;
    ins(o > c && /[\d)%π]$/.test(expr) ? ')' : '(');
    return;
  }
  else if (isOp(v)) {
    if (done) done = false;
    if (!expr) { if (v === '−') expr = '−'; upd(); return; }
    if (isOp(expr.slice(-1))) expr = expr.slice(0, -1);
    expr += v;
  }
  else if (v === '.') {
    const n = expr.split(/[^\d.]/).pop();
    if (n.indexOf('.') >= 0 && !done) return;
    ins(done ? '0.' : '.');
    return;
  }
  else { ins(v); return; }
  upd();
}

const KEYS = [
  ['AC','AC','fn'], ['()','( )','fn'], ['%','%','fn'], ['÷','÷','op'],
  ['7'], ['8'], ['9'], ['×','×','op'],
  ['4'], ['5'], ['6'], ['−','−','op'],
  ['1'], ['2'], ['3'], ['+','+','op'],
  ['0'], ['.'], ['⌫','⌫','fn'], ['=','=','eq']
];
const keysEl = $('#keys');
if (keysEl) {
  KEYS.forEach((arr, i) => {
    const v = arr[0], l = arr[1], c = arr[2];
    const b = document.createElement('button');
    b.className = 'k ' + (c || '');
    b.textContent = l || v;
    b.dataset.k = v;
    b.style.animationDelay = i * 25 + 'ms';
    keysEl.append(b);
  });
  keysEl.addEventListener('click', e => {
    const b = e.target.closest('.k');
    if (b && !window._lp) press(b.dataset.k);
    window._lp = 0;
  });
  let lpT, lpI;
  const lpStop = () => { clearTimeout(lpT); clearInterval(lpI); };
  keysEl.addEventListener('pointerdown', e => {
    window._lp = 0;
    lpStop();
    const b = e.target.closest('.k');
    if (!b || b.dataset.k !== '⌫') return;
    lpT = setTimeout(() => {
      window._lp = 1;
      lpI = setInterval(() => { if (!expr) return lpStop(); press('⌫'); vib(6); }, 70);
    }, 400);
  });
  ['pointerup','pointercancel','pointerleave'].forEach(n => keysEl.addEventListener(n, lpStop));
}

const dispEl = $('#disp');
if (dispEl) {
  let holdT;
  dispEl.addEventListener('pointerdown', e => {
    holdT = setTimeout(() => {
      const rs = $('#rs');
      const result = done ? expr : (rs ? rs.textContent.replace('= ', '') : '');
      if (!result) return;
      showResultMenu(e.clientX, e.clientY, result);
      vib([20, 30, 20]);
    }, 500);
  });
  ['pointerup','pointercancel','pointerleave'].forEach(n =>
    dispEl.addEventListener(n, () => clearTimeout(holdT))
  );
  dispEl.addEventListener('click', () => {
    const rs = $('#rs');
    const t = done ? expr : (rs ? rs.textContent.replace('= ', '') : '');
    if (!t) return;
    try {
      navigator.clipboard.writeText(t.replace('−', '-')).then(
        () => toast('Скопировано: ' + t),
        () => toast('Копирование недоступно')
      );
    } catch (e) { toast('Копирование недоступно'); }
  });
}

document.addEventListener('pointerdown', e => {
  const b = e.target.closest('.k,.btn,.hi');
  if (!b) return;
  if (!b.closest('#keys') || b.dataset.k !== '=') window._vf = !vib();
  if (!b.classList.contains('k')) return;
  const r = b.getBoundingClientRect();
  const z = Math.max(r.width, r.height) * 2.2;
  const s = document.createElement('span');
  s.className = 'rp';
  s.style.cssText =
    'width:' + z + 'px;height:' + z + 'px;left:' + (e.clientX - r.left - z/2) +
    'px;top:' + (e.clientY - r.top - z/2) + 'px';
  b.append(s);
  setTimeout(() => s.remove(), 600);
});

document.addEventListener('keydown', e => {
  if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
  const m = { '*':'×', '/':'÷', '-':'−', 'Enter':'=', 'Backspace':'⌫', 'Escape':'AC' };
  const k = m[e.key] || e.key;
  if (/^[\d.+%^]$/.test(k) || ('×÷−=⌫AC'.indexOf(k) >= 0 && k.length <= 2) || k === '(' || k === ')') {
    e.preventDefault();
    press(k === '(' || k === ')' ? '()' : k);
  }
});

const EVENTS = {};
function on(event, fn, pluginId){
  if (!EVENTS[event]) EVENTS[event] = [];
  EVENTS[event].push({ fn, pluginId: pluginId || null });
  return () => off(event, fn);
}
function off(event, fn){
  if (!EVENTS[event]) return;
  EVENTS[event] = EVENTS[event].filter(x => x.fn !== fn);
}
function emit(event, data){
  const list = EVENTS[event];
  if (!list) return;
  for (let i = 0; i < list.length; i++) {
    try { list[i].fn(data); }
    catch (e) { toast('Ошибка плагина: ' + e.message); }
  }
}

const ICO = {
  calc: '<path d="M7 3h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2zm1 3v3h8V6H8zm0 6v2h2v-2H8zm4 0v2h2v-2h-2zm4 0v2h2v-2h-2zM8 16v2h2v-2H8zm4 0v2h2v-2h-2zm4 0v2h2v-2h-2z"/>',
  hist: '<path d="M13 3a9 9 0 00-9 9H1l4 4 4-4H6a7 7 0 117 7 7 7 0 01-5-2l-1.4 1.4A9 9 0 1013 3zm-1 4v5l4 2 .8-1.3-3.3-1.7V7H12z"/>',
  more: '<path d="M6 10a2 2 0 100 4 2 2 0 000-4zm6 0a2 2 0 100 4 2 2 0 000-4zm6 0a2 2 0 100 4 2 2 0 000-4z"/>',
  set: '<path fill-rule="evenodd" d="M12 8.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zM19.4 13a7.7 7.7 0 000-2l2-1.6-2-3.4-2.4 1a7 7 0 00-1.7-1L15 3.5h-4l-.4 2.5a7 7 0 00-1.7 1l-2.4-1-2 3.4 2 1.6a7.7 7.7 0 000 2l-2 1.6 2 3.4 2.4-1a7 7 0 001.7 1l.4 2.5h4l.4-2.5a7 7 0 001.7-1l2.4 1 2-3.4z"/>'
};

const PAGES = {};

const navEl = $('#nav');
if (navEl) {
  [['calc','Счёт'],['hist','История'],['more','Дополнительно'],['set','Настройки']].forEach(([id, l], i) => {
    const b = document.createElement('button');
    b.className = 'tab' + (i ? '' : ' on');
    b.dataset.t = id;
    b.innerHTML = '<i><svg viewBox="0 0 24 24">' + ICO[id] + '</svg></i>' + l;
    b.onclick = () => go(id);
    navEl.append(b);
  });
}

function go(id){
  if (currentPage === id) return;
  const prev = PAGES[currentPage];
  if (prev && prev.onHide) { try { prev.onHide(); } catch (e) {} }

  currentPage = id;

  $$('.tab').forEach(t => t.classList.toggle('on', t.dataset.t === id));
  $$('.page').forEach(p => p.classList.toggle('on', p.id === 'p-' + id));

  if (id === 'hist') rHist();
  if (id === 'plug') rPlug();
  if (id === 'more') rMorePages();
  const pg = PAGES[id];
  if (pg && pg.onShow) { try { pg.onShow(); } catch (e) {} }
  emit('page:open', { id });
}

function rHist(){
  const h = $('#hist');
  if (!h) return;
  h.innerHTML = '';

  if (!hist.length) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = 'Пока пусто';
    h.append(empty);
    return;
  }

  hist.forEach((x, i) => {
    const card = document.createElement('div');
    card.className = 'card hi';
    card.style.animationDelay = i * 30 + 'ms';

    const q = document.createElement('small');
    q.textContent = x.e + ' =';

    const a = document.createElement('b');
    a.textContent = x.r;

    card.append(q, a);
    card.onclick = () => {
      expr = x.r;
      done = true;
      upd();
      go('calc');
    };
    h.append(card);
  });

  const clear = document.createElement('button');
  clear.className = 'btn tonal';
  clear.style.cssText = 'width:100%;margin-top:12px';
  clear.textContent = 'Очистить историю';
  clear.onclick = () => {
    if (!confirm('Очистить всю историю?')) return;
    hist.length = 0;
    LS.set('h', hist);
    rHist();
    vib();
  };
  h.append(clear);
}

function rMorePages(){
  const box = $('#pagelist');
  if (!box) return;
  box.innerHTML = '';

  const list = Object.keys(PAGES).filter(id => PAGES[id].pluginId);

  if (!list.length) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = 'Плагины пока не создали своих вкладок';
    box.append(empty);
    return;
  }

  list.forEach(id => {
    const p = PAGES[id];
    const card = document.createElement('div');
    card.className = 'card hi';

    const row = document.createElement('div');
    row.className = 'row';

    const ava = document.createElement('div');
    ava.className = 'ava';
    ava.innerHTML = '<svg viewBox="0 0 24 24" style="width:22px;height:22px;fill:currentColor">' +
      (p.icon || '<path d="M4 4h16v16H4z"/>') + '</svg>';

    const g = document.createElement('div');
    g.className = 'grow';
    const b = document.createElement('b');
    b.textContent = p.title || id;
    const sm = document.createElement('small');
    sm.textContent = 'Открыть';
    g.append(b, sm);

    const chev = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    chev.setAttribute('viewBox', '0 0 24 24');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M9 6l6 6-6 6');
    chev.append(path);
    chev.style.cssText = 'width:20px;height:20px;fill:none;stroke:var(--tx2);stroke-width:2;stroke-linecap:round;stroke-linejoin:round;flex:none';

    row.append(ava, g, chev);
    card.append(row);

    card.onclick = () => openPluginView(id);
    box.append(card);
  });
}

function openPluginView(id){
  const p = PAGES[id];
  if (!p) return;

  const title = $('#pv-title');
  const content = $('#pv-content');
  if (title) title.textContent = p.title || id;
  if (content) {
    content.innerHTML = '';
    if (typeof p.render === 'function') {
      try { p.render(content); } catch (e) { toast('Ошибка плагина: ' + e.message); }
    }
  }

  $$('.tab').forEach(t => t.classList.remove('on'));
  $$('.page').forEach(pp => pp.classList.toggle('on', pp.id === 'p-plugin-view'));
  currentPage = 'plugin-view';

  if (p.onShow) { try { p.onShow(); } catch (e) {} }
  emit('page:open', { id: 'plugin-view:' + id });
}

function addPage(opts){
  if (!opts || !opts.id) throw new Error('нужен id страницы');
  if (PAGES[opts.id]) throw new Error('страница уже существует: ' + opts.id);

  const pg = document.createElement('section');
  pg.className = 'page';
  pg.id = 'p-' + opts.id;
  const main = $('main');
  if (main) main.append(pg);

  PAGES[opts.id] = {
    title: opts.title, icon: opts.icon,
    render: opts.render, onShow: opts.onShow, onHide: opts.onHide,
    pageEl: pg, tabEl: null, pluginId: opts._pluginId
  };

  if (typeof opts.render === 'function') {
    try { opts.render(pg); } catch (e) { toast('Ошибка страницы: ' + e.message); }
  }
  rMorePages();
  return opts.id;
}

function removePage(id){
  const p = PAGES[id];
  if (!p) return;
  p.pageEl.remove();
  if (p.tabEl) p.tabEl.remove();
  delete PAGES[id];
  if (currentPage === id) go('more');
  rMorePages();
}

const STORE_KEY = 'plugin_store';
const ALL_STORE = LS.get(STORE_KEY, {});

function makeStore(pluginId){
  if (!ALL_STORE[pluginId]) ALL_STORE[pluginId] = {};
  const bucket = ALL_STORE[pluginId];
  return {
    get(k, d){ return bucket[k] !== undefined ? bucket[k] : d; },
    set(k, v){ bucket[k] = v; LS.set(STORE_KEY, ALL_STORE); },
    remove(k){ delete bucket[k]; LS.set(STORE_KEY, ALL_STORE); },
    clear(){ ALL_STORE[pluginId] = {}; LS.set(STORE_KEY, ALL_STORE); },
    keys(){ return Object.keys(bucket); },
    all(){ return Object.assign({}, bucket); }
  };
}

const UI = {
  el(tag, props, children){
    const e = document.createElement(tag);
    if (props) for (const k in props) {
      if (k === 'style' && typeof props[k] === 'object') Object.assign(e.style, props[k]);
      else if (k === 'class') e.className = props[k];
      else if (k === 'text') e.textContent = props[k];
      else if (k === 'html') e.innerHTML = props[k];
      else if (k.startsWith('on') && typeof props[k] === 'function') e['on' + k.slice(2).toLowerCase()] = props[k];
      else e.setAttribute(k, props[k]);
    }
    if (children) {
      (Array.isArray(children) ? children : [children]).forEach(c => {
        if (c == null) return;
        e.append(typeof c === 'string' ? document.createTextNode(c) : c);
      });
    }
    return e;
  },

  card(opts){
    const c = UI.el('div', { class: 'card' });
    if (opts.title) c.append(UI.el('b', { text: opts.title }));
    if (opts.hint) c.append(UI.el('small', { text: opts.hint }));
    if (opts.content) c.append(opts.content);
    return c;
  },

  button(opts){
    return UI.el('button', {
      class: 'btn ' + (opts.variant || 'filled'),
      text: opts.label || '',
      onClick: opts.onClick || (() => {})
    });
  },

  toggle(opts){
    const wrap = UI.el('div', { class: 'row' });
    const g = UI.el('div', { class: 'grow' });
    g.append(UI.el('b', { text: opts.label || '' }));
    if (opts.hint) g.append(UI.el('small', { text: opts.hint }));
    wrap.append(g);

    const lab = UI.el('label', { class: 'sw' });
    const inp = UI.el('input', { type: 'checkbox' });
    inp.checked = !!opts.value;
    inp.onchange = () => opts.onChange && opts.onChange(inp.checked);
    lab.append(inp, UI.el('i'));
    wrap.append(lab);
    return wrap;
  },

  input(opts){
    const inp = UI.el('input', {
      type: opts.type || 'text',
      placeholder: opts.placeholder || ''
    });
    inp.value = opts.value != null ? opts.value : '';
    inp.onchange = () => opts.onChange && opts.onChange(inp.value);
    return inp;
  },

  select(opts){
    const el = UI.el('div', { class: 'seg' });
    (opts.options || []).forEach(o => {
      const b = UI.el('button', { text: o.label || o.value });
      b.dataset.v = o.value;
      if (o.value === opts.value) b.classList.add('on');
      b.onclick = () => {
        Array.prototype.forEach.call(el.children, x => x.classList.remove('on'));
        b.classList.add('on');
        opts.onChange && opts.onChange(o.value);
      };
      el.append(b);
    });
    return el;
  },

  list(opts){
    const wrap = UI.el('div');
    (opts.items || []).forEach(item => {
      const c = UI.el('div', { class: 'card hi' });
      if (item.title) c.append(UI.el('b', { text: item.title }));
      if (item.subtitle) c.append(UI.el('small', { text: item.subtitle }));
      if (item.onClick) c.onclick = () => item.onClick(item);
      wrap.append(c);
    });
    return wrap;
  },

  toast: toast,

  modal(opts){
    const back = UI.el('div', { class: 'modal-back' });
    const m = UI.el('div', { class: 'modal' });
    if (opts.title) m.append(UI.el('h2', { text: opts.title }));
    if (opts.content) m.append(opts.content);

    const actions = UI.el('div', { class: 'modal-actions' });
    (opts.actions || [{ label: 'Закрыть', variant: 'tonal' }]).forEach(a => {
      const b = UI.el('button', {
        class: 'btn ' + (a.variant || 'tonal'),
        text: a.label || 'OK',
        onClick: () => {
          if (a.onClick) a.onClick();
          if (a.close !== false) close();
        }
      });
      actions.append(b);
    });
    m.append(actions);
    back.append(m);

    function close(){
      back.classList.remove('on');
      setTimeout(() => back.remove(), 300);
    }
    back.onclick = e => { if (e.target === back) close(); };
    const host = $('#plugin-modals');
    if (host) host.append(back);
    requestAnimationFrame(() => back.classList.add('on'));
    return { close, el: m };
  },

  overlay(text){
    const ov = UI.el('div', { class: 'overlay-load' });
    ov.append(UI.el('div', { class: 'spinner' }));
    if (text) ov.append(UI.el('div', { text: text }));
    const host = $('#plugin-overlays');
    if (host) host.append(ov);
    return () => ov.remove();
  },

  notify(opts){
    const n = UI.el('div', { class: 'notif' });
    n.append(UI.el('span', { text: opts.title || '' }));
    if (opts.body) {
      const b = UI.el('small', { text: opts.body });
      b.style.marginLeft = '6px';
      n.append(b);
    }
    const host = $('#plugin-notifications');
    if (host) host.append(n);
    requestAnimationFrame(() => n.classList.add('on'));
    const ttl = opts.duration || 3000;
    setTimeout(() => {
      n.classList.remove('on');
      setTimeout(() => n.remove(), 300);
    }, ttl);
  }
};

const THEMES = LS.get('plugin_themes', {});
function registerTheme(t){
  if (!t || !t.id) throw new Error('нужен id темы');
  THEMES[t.id] = t;
  LS.set('plugin_themes', THEMES);
  renderThemes();
  if (S.pluginTheme === t.id) applyTheme();
}
function setTheme(id){
  S.pluginTheme = id;
  saveS();
  applyTheme();
  renderThemes();
}
function renderThemes(){
  const wrap = $('#plugin-themes');
  if (!wrap) return;
  wrap.innerHTML = '';

  const none = UI.el('button', { title: 'Без плагинной темы' });
  none.style.background = 'var(--pc)';
  none.style.color = 'var(--onpc)';
  none.textContent = '×';
  none.onclick = () => setTheme(null);
  if (!S.pluginTheme) none.classList.add('on');
  wrap.append(none);

  Object.keys(THEMES).forEach(id => {
    const t = THEMES[id];
    const b = UI.el('button', { title: t.name || id });
    const color =
      (t.light && (t.light['--pr'] || t.light.pr)) ||
      (t.dark && (t.dark['--pr'] || t.dark.pr)) ||
      '#888';
    b.style.background = color;
    if (S.pluginTheme === id) b.classList.add('on');
    b.onclick = () => { setTheme(id); vib(); };
    wrap.append(b);
  });
}

const RESULT_ACTIONS = [];
function addResultAction(a){ RESULT_ACTIONS.push(a); }

function showResultMenu(x, y, result){
  $$('.ctx-menu').forEach(m => m.remove());

  const menu = UI.el('div', { class: 'ctx-menu' });
  const close = () => {
    menu.classList.remove('on');
    setTimeout(() => menu.remove(), 200);
  };

  const base = [
    { label: 'Скопировать', onClick: () => {
      navigator.clipboard.writeText(result.replace('−','-')).then(
        () => toast('Скопировано'), () => toast('Не удалось')
      );
    } },
    { label: 'Перенести в поле', onClick: () => {
      expr = result; done = true; upd();
    } },
    { label: 'Очистить', onClick: () => {
      expr = ''; done = false; upd();
    } }
  ];

  base.concat(RESULT_ACTIONS).forEach(a => {
    const b = UI.el('button', { text: a.label, onClick: () => { a.onClick(result); close(); } });
    menu.append(b);
  });

  document.body.append(menu);
  const rect = menu.getBoundingClientRect();
  const maxX = window.innerWidth - rect.width - 8;
  const maxY = window.innerHeight - rect.height - 8;
  menu.style.left = Math.min(x, maxX) + 'px';
  menu.style.top = Math.min(y, maxY) + 'px';
  requestAnimationFrame(() => menu.classList.add('on'));

  setTimeout(() => {
    const off2 = (e) => {
      if (!menu.contains(e.target)) { close(); document.removeEventListener('pointerdown', off2); }
    };
    document.addEventListener('pointerdown', off2);
  }, 50);
}

function injectCSS(css){
  const s = document.createElement('style');
  s.dataset.pluginStyle = '1';
  s.textContent = css;
  document.head.append(s);
  return () => s.remove();
}

async function netFetch(url, opts){
  opts = opts || {};
  const finalUrl = opts.proxy ? (opts.proxy + encodeURIComponent(url)) : url;
  const r = await fetch(finalUrl, opts);
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r;
}
async function netFetchJSON(url, opts){ return (await netFetch(url, opts)).json(); }
async function netFetchText(url, opts){ return (await netFetch(url, opts)).text(); }

function beep(freq, dur, type){
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq || 440;
    g.gain.setValueAtTime(0.2, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (dur || 0.2));
    osc.connect(g).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + (dur || 0.2));
    setTimeout(() => ctx.close(), (dur || 0.2) * 1000 + 500);
  } catch (e) {}
}

function nativeTools(){
  return window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.NativeTools;
}

const SPEECH = {
  isAvailable: async () => {
    try {
      const N = nativeTools();
      if (!N || !N.isSpeechAvailable) return false;
      const r = await N.isSpeechAvailable();
      return !!(r && r.available);
    } catch (e) { return false; }
  },
  listen: async (opts) => {
    const N = nativeTools();
    if (!N || !N.listen) throw new Error('Распознавание речи недоступно');
    const r = await N.listen({ lang: (opts && opts.lang) || 'ru-RU' });
    return (r && r.text) || '';
  },
  stop: async () => {
    const N = nativeTools();
    if (N && N.stopListening) {
      try { await N.stopListening(); } catch (e) {}
    }
  }
};

const FILES = {
  write: async (name, content) => {
    const N = nativeTools();
    if (!N || !N.writeFile) throw new Error('Файлы недоступны в вебе');
    return await N.writeFile({ name: String(name), content: String(content) });
  },
  read: async (name) => {
    const N = nativeTools();
    if (!N || !N.readFile) throw new Error('Файлы недоступны в вебе');
    const r = await N.readFile({ name: String(name) });
    return (r && r.content) || '';
  },
  delete: async (name) => {
    const N = nativeTools();
    if (!N || !N.deleteFile) throw new Error('Файлы недоступны в вебе');
    return await N.deleteFile({ name: String(name) });
  },
  list: async () => {
    const N = nativeTools();
    if (!N || !N.listFiles) return [];
    const r = await N.listFiles();
    return (r && r.files) || [];
  }
};

const CLIPBOARD = {
  set: async (text) => {
    const N = nativeTools();
    if (N && N.clipboardSet) {
      await N.clipboardSet({ text: String(text) });
      return;
    }
    if (navigator.clipboard) await navigator.clipboard.writeText(String(text));
  },
  get: async () => {
    const N = nativeTools();
    if (N && N.clipboardGet) {
      const r = await N.clipboardGet();
      return (r && r.text) || '';
    }
    if (navigator.clipboard && navigator.clipboard.readText) {
      return await navigator.clipboard.readText();
    }
    return '';
  }
};

const SHARE = async (opts) => {
  const text = typeof opts === 'string' ? opts : (opts && opts.text) || '';
  const subject = (opts && opts.subject) || '';
  const N = nativeTools();
  if (N && N.share) {
    await N.share({ text: String(text), subject: String(subject) });
    return;
  }
  if (navigator.share) {
    await navigator.share({ text: String(text), title: String(subject) });
  } else {
    toast('Поделиться недоступно');
  }
};

const DEVICE = {
  info: async () => {
    const N = nativeTools();
    if (!N || !N.getDeviceInfo) return {};
    return await N.getDeviceInfo();
  }
};

const PERMISSIONS = {
  check: async (name) => {
    const N = nativeTools();
    if (!N || !N.checkPermission) return false;
    const r = await N.checkPermission({ name: String(name) });
    return !!(r && r.granted);
  },
  request: async (name) => {
    const N = nativeTools();
    if (!N || !N.requestPermission) return false;
    try {
      await N.requestPermission({ name: String(name) });
    } catch (e) {}
    return await PERMISSIONS.check(name);
  }
};

const TIMERS = new Map();
let timerCounter = 0;

const PL = {};
const BUILTIN = new Set();
const custom = LS.get('custom', {});
let enabled = LS.get('en', ['sci', 'haptic']);

const PVALS = LS.get('pvals', {});
const getVals = id => PVALS[id] || (PVALS[id] = {});
const saveVals = () => { LS.set('pvals', PVALS); };
const PSUBS = {};

function registerPlugin(d, builtin){
  if (!d || !d.id) throw new Error('нужен id');

  const want = d.apiVersion || '1.0';
  const have = API_VERSION;
  const wmaj = parseVer(want)[0];
  const hmaj = parseVer(have)[0];

  d._compat = 'ok';
  if (wmaj > hmaj) d._compat = 'too-new';
  else if (wmaj < hmaj) d._compat = 'legacy';

  if (d.requires && d.requires.length) {
    d._missing = d.requires.filter(r => !PL[r]);
  }

  PL[d.id] = d;
  if (builtin) BUILTIN.add(d.id);
}

const api = id => {
  const store = makeStore(id);
  const cssList = [];
  const listeners = [];

  const apiObj = {
    _id: id,
    id,
    version: API_VERSION,
    getApiVersion: () => API_VERSION,
    getCompat: () => PL[id] ? PL[id]._compat : 'unknown',

    addButton(o){
      const extra = $('#extra');
      if (!extra) return;
      const b = document.createElement('button');
      b.className = 'k fn chip';
      b.textContent = o.label;
      b.dataset.plugin = id;
      b.onclick = () => {
        try {
          if (o.onClick) o.onClick(api(id));
          else ins(o.insert || o.label);
        } catch (e) { toast('Ошибка плагина: ' + e.message); }
      };
      extra.append(b);
      return b;
    },

    addFunction(n, f){
      if (!/^[a-z]+$/.test(n)) throw new Error('имя функции: только a-z');
      F[n] = f;
      (PL[id]._fn = PL[id]._fn || []).push(n);
    },
    addConstant(n, v){
      if (!/^[a-z]+$/i.test(n)) throw new Error('имя константы: только буквы');
      CONSTS[n] = v;
      (PL[id]._const = PL[id]._const || []).push(n);
    },

    insert: s => ins(s),
    getExpr: () => expr,
    getResult: () => { try { return ev(expr); } catch (e) { return NaN; } },
    setExpr: s => { expr = String(s); done = false; upd(); },

    vibrate: m => vib(m),
    vibratePattern: arr => vib(arr),
    beep: (f, d, t) => beep(f, d, t),
    toast,

    addPage(o){ o._pluginId = id; return addPage(o); },
    removePage: pid => removePage(pid),
    openPage: pid => openPluginView(pid),
    getCurrentPage: () => currentPage,

    store,

    getSetting(k){ return getVals(id)[k]; },
    getAllSettings(){ return Object.assign({}, getVals(id)); },
    setSetting(k, v){
      getVals(id)[k] = v;
      saveVals();
      (PSUBS[id] || []).forEach(fn => {
        try { fn(k, v, api(id)); }
        catch (e) { toast('Ошибка плагина: ' + e.message); }
      });
    },
    onSettingsChange(fn){
      if (!PSUBS[id]) PSUBS[id] = [];
      PSUBS[id].push(fn);
    },

    on(event, fn){
      const unsub = on(event, fn, id);
      listeners.push(unsub);
      return unsub;
    },
    off(event, fn){ off(event, fn); },
    emit(event, data){ emit(event, data); },

    ui: UI,
    speech: SPEECH,

    files: FILES,
    clipboard: CLIPBOARD,
    share: SHARE,
    device: DEVICE,
    permissions: PERMISSIONS,

    timers: {
      set: (fn, ms) => {
        const tid = ++timerCounter;
        const handle = setTimeout(() => { TIMERS.delete(tid); fn(); }, ms);
        TIMERS.set(tid, { handle, pluginId: id });
        return tid;
      },
      clear: (tid) => {
        const t = TIMERS.get(tid);
        if (t) { clearTimeout(t.handle); TIMERS.delete(tid); }
      },
      interval: (fn, ms) => {
        const tid = ++timerCounter;
        const handle = setInterval(fn, ms);
        TIMERS.set(tid, { handle, pluginId: id, interval: true });
        return tid;
      },
      clearInterval: (tid) => {
        const t = TIMERS.get(tid);
        if (t) { clearInterval(t.handle); TIMERS.delete(tid); }
      }
    },

    app: {
      version: () => API_VERSION,
      exit: () => {
        try {
          if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
            window.Capacitor.Plugins.App.exitApp();
          }
        } catch (e) {}
      },
      minimize: () => {
        try {
          if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
            window.Capacitor.Plugins.App.minimizeApp();
          }
        } catch (e) {}
      }
    },

    injectCSS(css){
      const unsub = injectCSS(css);
      cssList.push(unsub);
      return unsub;
    },

    registerTheme(t){ registerTheme(t); },
    setTheme(tid){ setTheme(tid); },
    getCurrentTheme: () => S.pluginTheme,
    listThemes: () => Object.keys(THEMES),
    addResultAction(a){ addResultAction(a); },

    fetch: netFetch,
    fetchJSON: netFetchJSON,
    fetchText: netFetchText,

    notify(opts){ UI.notify(opts); },

    log: (...args) => console.log('[' + id + ']', ...args),
    warn: (...args) => console.warn('[' + id + ']', ...args),
    error: (...args) => console.error('[' + id + ']', ...args),

    i18n(map){
      const lang = (navigator.language || 'en').slice(0, 2);
      const dict = map[lang] || map.en || map.ru || {};
      return k => dict[k] !== undefined ? dict[k] : (map.en && map.en[k]) || k;
    },

    _cleanup(){
      cssList.forEach(fn => { try { fn(); } catch (e) {} });
      listeners.forEach(fn => { try { fn(); } catch (e) {} });
      TIMERS.forEach((t, tid) => {
        if (t.pluginId === id) {
          if (t.interval) clearInterval(t.handle);
          else clearTimeout(t.handle);
          TIMERS.delete(tid);
        }
      });
    }
  };

  return apiObj;
};

function applyDefaults(id){
  const p = PL[id];
  if (!p || !p.settings) return;
  const v = getVals(id);
  let changed = false;
  for (const k in p.settings) {
    if (!(k in v)) { v[k] = p.settings[k].default; changed = true; }
  }
  if (changed) saveVals();
}

function load(id){
  const p = PL[id];
  if (!p) return;
  if (p._compat === 'too-new') {
    toast('Плагин «' + (p.name || id) + '» требует ядро ' + (p.apiVersion || '?'));
    return;
  }
  if (p._missing && p._missing.length) {
    toast('Плагин «' + (p.name || id) + '» требует: ' + p._missing.join(', '));
    return;
  }
  applyDefaults(id);
  if (p._on) return;
  try {
    if (p.onLoad) p.onLoad(api(id));
    p._on = 1;
  } catch (e) {
    toast('Плагин «' + (p.name || id) + '»: ' + e.message);
  }
}

function unload(id){
  const p = PL[id];
  if (!p) return;
  try { if (p.onUnload) p.onUnload(api(id)); } catch (e) {}

  const a = api(id);
  if (a._cleanup) { try { a._cleanup(); } catch (e) {} }

  $$('[data-plugin="' + id + '"]').forEach(e => e.remove());
  Object.keys(PAGES).forEach(k => {
    if (PAGES[k] && PAGES[k].pluginId === id) removePage(k);
  });

  (p._fn || []).forEach(n => { delete F[n]; });
  (p._const || []).forEach(n => { delete CONSTS[n]; });
  p._fn = 0;
  p._const = 0;
  p._on = 0;
  PSUBS[id] = [];

  if (p.themes && p.themes.indexOf(S.pluginTheme) >= 0) {
    setTheme(null);
  }
}

function runCode(src){
  new Function('registerPlugin', src)(d => registerPlugin(d, false));
}

registerPlugin({
  id: 'sci',
  name: 'Научный режим',
  description: 'sin, cos, tan (в градусах), ln, log, корень, π и степень',
  version: '2.0',
  apiVersion: '4.0',
  author: 'CalcX',
  icon: 'S',
  onLoad(a){
    [['sin','sin('],['cos','cos('],['tan','tan('],['ln','ln('],['log','log('],
     ['√','√('],['π','π'],['e','e'],['x^y','^']]
      .forEach(([l, i]) => a.addButton({ label: l, insert: i }));
  }
}, 1);

registerPlugin({
  id: 'vat',
  name: 'НДС',
  description: 'Кнопки «+НДС» и «−НДС» с настраиваемой ставкой',
  version: '2.0',
  apiVersion: '4.0',
  author: 'CalcX',
  icon: 'Н',
  settings: {
    rate: { type: 'number', label: 'Ставка, %', default: 20, min: 0, max: 100, step: 0.5 },
    labelMode: { type: 'seg', label: 'Подписи кнопок', default: 'short',
      options: [{ value: 'short', label: '+НДС' }, { value: 'full', label: 'С налогом' }] }
  },
  onLoad(a){
    const render = () => {
      $$('[data-plugin="vat"]').forEach(e => e.remove());
      const rate = +a.getSetting('rate') || 20;
      const k = 1 + rate / 100;
      const short = a.getSetting('labelMode') === 'short';
      const f = mul => x => {
        const v = x.getResult();
        if (isNaN(v)) return x.toast('Нечего считать');
        x.setExpr(fmt(v * mul));
      };
      a.addButton({ label: short ? '+НДС' : 'С налогом', onClick: f(k) });
      a.addButton({ label: short ? '−НДС' : 'Без налога', onClick: f(1 / k) });
    };
    render();
    a.onSettingsChange(render);
  }
}, 1);

registerPlugin({
  id: 'rnd',
  name: 'Случайное число',
  description: 'Вставляет случайное число с вибро-откликом',
  version: '2.0',
  apiVersion: '4.0',
  author: 'CalcX',
  icon: 'R',
  settings: {
    min: { type: 'number', label: 'Минимум', default: 1, min: 0, max: 9999, step: 1 },
    max: { type: 'number', label: 'Максимум', default: 100, min: 1, max: 9999, step: 1 },
    vibOn: { type: 'bool', label: 'Вибро при вставке', default: true }
  },
  onLoad(a){
    a.addButton({
      label: 'rnd',
      onClick: x => {
        let lo = +x.getSetting('min') || 1, hi = +x.getSetting('max') || 100;
        if (hi < lo) { const t = lo; lo = hi; hi = t; }
        const v = lo + Math.floor(Math.random() * (hi - lo + 1));
        x.insert(String(v));
        if (x.getSetting('vibOn')) x.vibrate([10, 30, 10, 30]);
      }
    });
  }
}, 1);

registerPlugin({
  id: 'haptic',
  name: 'Вибро',
  description: 'Тест вибрации и диагностика',
  version: '2.0',
  apiVersion: '4.0',
  author: 'CalcX',
  icon: 'V',
  onLoad(a){
    a.addButton({
      label: 'Тест',
      onClick: x => {
        const ok = x.vibrate([40, 60, 40, 60, 80]);
        x.toast(ok ? 'Вибро отправлено' : 'Вибро выключено или недоступно');
      }
    });
  }
}, 1);

registerPlugin({
  id: 'demo',
  name: 'Демо API 4.0',
  description: 'Показывает вкладки, store, ui, хуки, темы, файлы, буфер, речь',
  version: '2.0',
  apiVersion: '4.0',
  author: 'CalcX',
  icon: 'D',
  onLoad(a){
    a.addPage({
      id: 'demo-page',
      title: 'Демо',
      icon: '<path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/>',
      render: root => {
        root.innerHTML = '';
        root.append(UI.el('h2', { text: 'Демо API 4.0' }));

        root.append(UI.card({
          title: 'Счётчик в store',
          hint: 'Изолированное хранилище плагина',
          content: (() => {
            const wrap = UI.el('div');
            const out = UI.el('b', { text: String(a.store.get('count', 0)) });
            out.style.fontSize = '28px';
            out.style.display = 'block';
            out.style.margin = '12px 0';
            out.style.color = 'var(--pr)';
            wrap.append(out);
            const inc = UI.button({
              label: '+1',
              onClick: () => {
                const v = a.store.get('count', 0) + 1;
                a.store.set('count', v);
                out.textContent = String(v);
                a.vibrate(15);
              }
            });
            const rst = UI.button({
              label: 'Сброс',
              variant: 'tonal',
              onClick: () => { a.store.set('count', 0); out.textContent = '0'; }
            });
            const row = UI.el('div', { class: 'row' });
            row.style.gap = '8px';
            row.append(inc, rst);
            wrap.append(row);
            return wrap;
          })()
        }));

        root.append(UI.card({
          title: 'Устройство',
          hint: 'Информация о модели и системе',
          content: (() => {
            const wrap = UI.el('div');
            const out = UI.el('small', { text: 'Загрузка…' });
            wrap.append(out);
            a.device.info().then(info => {
              out.textContent = (info.manufacturer || '?') + ' ' + (info.model || '?') +
                ' · Android ' + (info.androidVersion || '?') +
                ' (API ' + (info.apiLevel || '?') + ')';
            }).catch(() => { out.textContent = 'Недоступно'; });
            return wrap;
          })()
        }));

        root.append(UI.card({
          title: 'Буфер обмена',
          content: (() => {
            const wrap = UI.el('div');
            const inp = a.ui.input({ placeholder: 'Текст' });
            const btnSet = a.ui.button({
              label: 'Скопировать',
              onClick: async () => {
                await a.clipboard.set(inp.value);
                a.toast('Скопировано');
              }
            });
            const btnGet = a.ui.button({
              label: 'Вставить',
              variant: 'tonal',
              onClick: async () => {
                const t = await a.clipboard.get();
                inp.value = t;
                a.toast(t ? 'Вставлено' : 'Буфер пуст');
              }
            });
            const row = UI.el('div', { class: 'row' });
            row.style.gap = '8px';
            row.style.marginTop = '8px';
            row.append(btnSet, btnGet);
            wrap.append(inp, row);
            return wrap;
          })()
        }));

        root.append(UI.card({
          title: 'Файлы плагина',
          content: (() => {
            const wrap = UI.el('div');
            const inp = a.ui.input({ placeholder: 'Имя файла', value: 'note.txt' });
            const ta = document.createElement('textarea');
            ta.style.cssText = 'width:100%;min-height:80px;margin-top:8px;border-radius:12px;border:1px solid var(--ol);background:var(--sf);color:var(--tx);padding:10px;font:13px monospace';
            ta.placeholder = 'Содержимое';
            const save = a.ui.button({
              label: 'Сохранить',
              onClick: async () => {
                try {
                  await a.files.write(inp.value, ta.value);
                  a.toast('Сохранено');
                } catch (e) { a.toast(e.message); }
              }
            });
            const load = a.ui.button({
              label: 'Загрузить',
              variant: 'tonal',
              onClick: async () => {
                try {
                  ta.value = await a.files.read(inp.value);
                  a.toast('Загружено');
                } catch (e) { a.toast(e.message); }
              }
            });
            const row = UI.el('div', { class: 'row' });
            row.style.gap = '8px';
            row.style.marginTop = '8px';
            row.append(save, load);
            wrap.append(inp, ta, row);
            return wrap;
          })()
        }));

        root.append(UI.card({
          title: 'Голос',
          hint: 'Нативное распознавание речи',
          content: (() => {
            const wrap = UI.el('div');
            const out = UI.el('small', { text: 'Нажми и говори' });
            const btn = a.ui.button({
              label: '🎤 Слушать',
              onClick: async () => {
                try {
                  const text = await a.speech.listen({ lang: 'ru-RU' });
                  out.textContent = 'Распознано: ' + text;
                } catch (e) { out.textContent = 'Ошибка: ' + e.message; }
              }
            });
            wrap.append(btn, out);
            return wrap;
          })()
        }));

        root.append(UI.card({
          title: 'Разрешения',
          content: (() => {
            const wrap = UI.el('div');
            const out = UI.el('small', { text: '—' });
            const check = a.ui.button({
              label: 'Проверить',
              onClick: async () => {
                const mic = await a.permissions.check('microphone');
                const cam = await a.permissions.check('camera');
                out.textContent = 'Микрофон: ' + (mic ? 'да' : 'нет') +
                  ' · Камера: ' + (cam ? 'да' : 'нет');
              }
            });
            wrap.append(check, out);
            return wrap;
          })()
        }));
      }
    });

    a.on('calc:press', e => {
      if (e.key === '=') a.log('нажато =', e.expr);
    });

    a.addResultAction({
      label: 'Удвоить',
      onClick: result => {
        try {
          const n = parseFloat(result.replace('−','-'));
          if (!isNaN(n)) a.setExpr(String(n * 2));
        } catch (e) {}
      }
    });
  },
  onUnload(){}
}, 1);

for (const id in custom) {
  try {
    const src = typeof custom[id] === 'string' ? custom[id] : custom[id]._src;
    if (src) runCode(src);
  } catch (e) { console.error('custom plugin', id, e); }
}
enabled = enabled.filter(id => PL[id]);
enabled.forEach(load);

function bindAuthorBlock(){
  const contactRow = $('#contact-row');
  if (contactRow && !contactRow._bound) {
    contactRow._bound = true;
    contactRow.onclick = () => {
      vib(15);
      try {
        const C = window.Capacitor;
        if (C && C.Plugins && C.Plugins.App && C.Plugins.App.openUrl) {
          C.Plugins.App.openUrl({ url: CONTACT_URL }).catch(() => {
            window.open(CONTACT_URL, '_blank');
          });
        } else {
          window.open(CONTACT_URL, '_blank');
        }
      } catch (e) {
        window.open(CONTACT_URL, '_blank');
      }
    };
  }

  const donateRow = $('#donate-row');
  if (donateRow && !donateRow._bound) {
    donateRow._bound = true;
    donateRow.onclick = () => {
      vib([10, 30, 10]);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(DONATE_CARD).then(
          () => toast('Номер карты скопирован'),
          () => toast('Номер: ' + DONATE_CARD)
        );
      } else {
        toast('Номер: ' + DONATE_CARD);
      }
    };
  }
}

function updatePluginsCount(){
  const el = $('#plugins-count');
  if (!el) return;
  const total = Object.keys(PL).length;
  el.textContent = total + (total === 1 ? ' плагин' : ' плагинов');
}

function rPlug(){
  const l = $('#plist');
  if (!l) return;
  l.innerHTML = '';
  Object.keys(PL).forEach((key, i) => {
    const p = PL[key];
    const c = document.createElement('div');
    c.className = 'card';
    c.style.animationDelay = i * 50 + 'ms';

    const hasSettings = p.settings && Object.keys(p.settings).length;
    c.innerHTML =
      '<div class="row">' +
        '<div class="ava"></div>' +
        '<div class="grow"><b></b><small></small></div>' +
        '<label class="sw"><input type="checkbox"><i></i></label>' +
      '</div>' +
      (hasSettings ?
        '<div class="pl-head"><span>Настройки плагина</span>' +
        '<svg class="chev" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">' +
        '<path d="M7 10l5 5 5-5z"/></svg></div>' +
        '<div class="pl-body"></div>' : '');

    c.querySelector('.ava').textContent = p.icon || (p.name || '?')[0];
    const bEl = c.querySelector('b');
    bEl.textContent = p.name || p.id;

    if (p._compat === 'too-new') {
      const b = document.createElement('span');
      b.className = 'badge warn';
      b.textContent = 'требует ядро ' + (p.apiVersion || '?');
      bEl.append(b);
    } else if (p._compat === 'legacy') {
      const b = document.createElement('span');
      b.className = 'badge legacy';
      b.textContent = 'legacy';
      bEl.append(b);
    }

    c.querySelector('small').textContent =
      (p.description || '') + ' · v' + (p.version || '1') + (p.author ? ' · ' + p.author : '');

    const inp = c.querySelector('input[type=checkbox]');
    inp.checked = enabled.indexOf(p.id) >= 0;
    if (p._compat === 'too-new' || (p._missing && p._missing.length)) {
      inp.disabled = true;
    } else {
      inp.onchange = () => {
        vib();
        if (inp.checked) {
          if (enabled.indexOf(p.id) < 0) enabled.push(p.id);
          load(p.id);
        } else {
          enabled = enabled.filter(x => x !== p.id);
          unload(p.id);
        }
        LS.set('en', enabled);
      };
    }

    if (hasSettings) {
      const body = c.querySelector('.pl-body');
      const head = c.querySelector('.pl-head');
      head.onclick = () => { c.classList.toggle('open'); vib(); };
      buildSettings(p.id, p.settings, body);
    }

    if (!BUILTIN.has(p.id)) {
      const d = document.createElement('button');
      d.className = 'btn tonal';
      d.style.cssText = 'margin-top:14px;padding:10px 18px;font-size:13px';
      d.textContent = 'Удалить';
      d.onclick = () => {
        unload(p.id);
        delete PL[p.id];
        delete custom[p.id];
        delete PVALS[p.id];
        enabled = enabled.filter(x => x !== p.id);
        LS.set('custom', custom);
        LS.set('en', enabled);
        LS.set('pvals', PVALS);
        rPlug();
        updatePluginsCount();
      };
      c.append(d);
    }

    l.append(c);
  });

  bindAuthorBlock();
  updatePluginsCount();
}

function buildSettings(pid, defs, root){
  const vals = getVals(pid);
  const set = (k, v) => {
    vals[k] = v;
    saveVals();
    (PSUBS[pid] || []).forEach(fn => {
      try { fn(k, v, api(pid)); } catch (e) { toast('Ошибка плагина: ' + e.message); }
    });
  };

  for (const key in defs) {
    const d = defs[key] || {};
    const wrap = document.createElement('div');
    wrap.className = 'set-row';

    if (d.type !== 'bool' && d.type !== 'seg') {
      const lab = document.createElement('label');
      lab.textContent = d.label || key;
      wrap.append(lab);
    }

    if (d.type === 'bool') {
      wrap.innerHTML =
        '<div class="row"><div class="grow"><label style="margin:0">' + (d.label || key) + '</label>' +
        (d.hint ? '<small>' + d.hint + '</small>' : '') +
        '</div><label class="sw"><input type="checkbox"><i></i></label></div>';
      const inp = wrap.querySelector('input');
      inp.checked = !!vals[key];
      inp.onchange = () => { set(key, inp.checked); vib(); };
    }
    else if (d.type === 'range') {
      const min = d.min != null ? d.min : 0;
      const max = d.max != null ? d.max : 100;
      const step = d.step != null ? d.step : 1;
      const row = document.createElement('div');
      row.className = 'row';
      const inp = document.createElement('input');
      inp.type = 'range';
      inp.min = min; inp.max = max; inp.step = step;
      inp.value = vals[key] != null ? vals[key] : d.default;
      inp.style.flex = '1';
      const out = document.createElement('span');
      out.className = 'range-val';
      out.textContent = inp.value;
      row.append(inp, out);
      wrap.append(row);
      inp.oninput = () => { out.textContent = inp.value; };
      inp.onchange = () => { set(key, +inp.value); vib(); };
    }
    else if (d.type === 'seg' || d.type === 'select') {
      const el = document.createElement('div');
      el.className = 'seg';
      const opts = Array.isArray(d.options)
        ? d.options
        : Object.keys(d.options || {}).map(v => ({ value: v, label: d.options[v] }));
      opts.forEach(o => {
        const b = document.createElement('button');
        b.dataset.v = o.value;
        b.textContent = o.label || o.value;
        if ((vals[key] != null ? vals[key] : d.default) == o.value) b.classList.add('on');
        b.onclick = () => {
          Array.prototype.forEach.call(el.children, x => x.classList.remove('on'));
          b.classList.add('on');
          set(key, o.value);
          vib();
        };
        el.append(b);
      });
      wrap.append(el);
    }
    else if (d.type === 'text') {
      const inp = document.createElement('input');
      inp.type = 'text';
      inp.value = vals[key] != null ? vals[key] : (d.default || '');
      inp.placeholder = d.placeholder || '';
      inp.onchange = () => { set(key, inp.value); vib(); };
      wrap.append(inp);
    }
    else {
      const inp = document.createElement('input');
      inp.type = 'number';
      if (d.min != null) inp.min = d.min;
      if (d.max != null) inp.max = d.max;
      if (d.step != null) inp.step = d.step;
      inp.value = vals[key] != null ? vals[key] : (d.default || 0);
      inp.onchange = () => { set(key, +inp.value); vib(); };
      wrap.append(inp);
    }

    if (d.hint && d.type !== 'bool') {
      const h = document.createElement('small');
      h.textContent = d.hint;
      wrap.append(h);
    }
    root.append(wrap);
  }
}

const TPL = [
'registerPlugin({',
"  id: 'myplugin',",
"  name: 'Мой плагин',",
"  description: 'Пример плагина на API 4.0',",
"  version: '1.0',",
"  apiVersion: '4.0',",
"  author: 'me',",
"  icon: 'M',",
'  onLoad(api) {',
'    api.addButton({',
"      label: 'Привет',",
'      onClick: a => {',
"        a.toast('Привет из плагина!');",
"        a.vibrate(20);",
'      }',
'    });',
'',
'    api.addPage({',
"      id: 'my-page',",
"      title: 'Моя',",
'      render: root => {',
"        root.innerHTML = '';",
"        root.append(api.ui.el('h2', { text: 'Моя страница' }));",
'      }',
'    });',
'  },',
'  onUnload() {}',
'});'
].join('\n');

const addBtn = $('#add');
if (addBtn) addBtn.onclick = () => {
  const c = $('#code');
  if (c) c.value = TPL;
  const s = $('#sheet');
  if (s) s.classList.add('on');
};

function openCalcText(t, name){
  if (!/registerPlugin\s*\(/.test(t)) return toast('Это не файл плагина' + (name ? ': ' + name : ''));
  const c = $('#code');
  if (c) c.value = t;
  go('plug');
  const s = $('#sheet');
  if (s) s.classList.add('on');
  vib([15, 40, 15]);
}
window.openCalcText = openCalcText;

const openCalcFile = f => f && f.text().then(t => openCalcText(t, f.name)).catch(() => toast('Не удалось прочитать файл'));

const fileEl = $('#file');
if (fileEl) fileEl.onchange = e => { openCalcFile(e.target.files[0]); e.target.value = ''; };
addEventListener('dragover', e => e.preventDefault());
addEventListener('drop', e => { e.preventDefault(); openCalcFile(e.dataTransfer.files[0]); });
if ('launchQueue' in window) {
  launchQueue.setConsumer(async p => {
    if (p.files && p.files[0]) openCalcFile(await p.files[0].getFile());
  });
}

const cancelBtn = $('#cancel');
if (cancelBtn) cancelBtn.onclick = () => { const s = $('#sheet'); if (s) s.classList.remove('on'); };

const sheetEl = $('#sheet');
if (sheetEl) sheetEl.onclick = e => { if (e.target.id === 'sheet') e.target.classList.remove('on'); };

const instBtn = $('#inst');
if (instBtn) instBtn.onclick = () => {
  const c = $('#code');
  const src = c ? c.value : '';
  let id;
  try {
    const before = Object.keys(PL);
    runCode(src);
    const after = Object.keys(PL);
    id = after.find(k => before.indexOf(k) < 0 && !BUILTIN.has(k));
  } catch (e) { return toast('Ошибка: ' + e.message); }
  if (!id) return toast('Плагин не зарегистрирован');
  custom[id] = src;
  LS.set('custom', custom);
  if (enabled.indexOf(id) < 0) enabled.push(id);
  LS.set('en', enabled);
  load(id);
  const s = $('#sheet');
  if (s) s.classList.remove('on');
  rPlug();
  updatePluginsCount();
  toast('Плагин установлен');
};

const plugBack = $('#plug-back');
if (plugBack) plugBack.onclick = () => go('set');

const pvBack = $('#pv-back');
if (pvBack) pvBack.onclick = () => go('more');

const openPlugins = $('#open-plugins');
if (openPlugins) openPlugins.onclick = () => go('plug');

function seg(id, key, conv){
  const el = $('#' + id);
  if (!el) return;
  const sync = () => {
    $$('#' + id + ' button').forEach(b => b.classList.toggle('on', conv(b.dataset.v) == S[key]));
  };
  el.onclick = e => {
    const b = e.target.closest('button');
    if (!b) return;
    S[key] = conv(b.dataset.v);
    saveS();
    sync();
    applyTheme();
    vib();
  };
  sync();
}
seg('mode','mode', v => v);
seg('pow','pow', v => +v);

const swsEl = $('#sws');
if (swsEl) {
  HUES.forEach(([h, n]) => {
    const b = document.createElement('button');
    b.title = n;
    b.dataset.h = h;
    b.style.background = 'hsl(' + (h === 'sys' ? sysHue() : h) + ' 60% 50%)';
    if (h === 'sys') {
      b.textContent = 'A';
      b.style.color = '#fff';
      b.style.fontWeight = '700';
      b.style.fontSize = '14px';
    }
    b.onclick = () => { S.hue = h; saveS(); applyTheme(); sw(); vib(); };
    swsEl.append(b);
  });
}
const sw = () => $$('#sws button').forEach(b => b.classList.toggle('on', b.dataset.h == S.hue));
sw();

const vibEl = $('#vib');
if (vibEl) {
  vibEl.checked = S.vib;
  vibEl.onchange = e => { S.vib = e.target.checked; saveS(); vib(); };
}

const an = () => document.body.classList.toggle('noanim', !S.anim);
const animEl = $('#anim');
if (animEl) {
  animEl.checked = S.anim;
  animEl.onchange = e => { S.anim = e.target.checked; saveS(); an(); };
}
an();

const avEl = $('#api-ver');
if (avEl) avEl.textContent = 'API ' + API_VERSION;

renderThemes();
applyTheme();
upd();
rMorePages();
updatePluginsCount();

(function(){
  const N = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.NativeTools;
  if (!N) return;
  const col = () => N.getColors().then(r => { PAL = r; applyTheme(); }).catch(() => {});
  col();
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      col();
      emit('resume', {});
    } else {
      emit('pause', {});
    }
  });
  N.getPending().then(r => { if (r && r.text) openCalcText(r.text, r.name); }).catch(() => {});
})();

window.addEventListener('online', () => emit('network', { online: true }));
window.addEventListener('offline', () => emit('network', { online: false }));

(function waitForNativeTools(){
  let tries = 0;
  function tryRequest(){
    tries++;
    const C = window.Capacitor;
    if (C && C.Plugins && C.Plugins.NativeTools && C.Plugins.NativeTools.requestAudio) {
      C.Plugins.NativeTools.requestAudio()
        .then(() => {})
        .catch(() => {});
    } else if (tries < 20) {
      setTimeout(tryRequest, 300);
    }
  }
  setTimeout(tryRequest, 500);
})();

})();