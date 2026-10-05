/* =========================================================
   CalcX — ядро калькулятора с системой плагинов
   ========================================================= */
(function(){
'use strict';

/* ---------- утилиты ---------- */
const $ = s => document.querySelector(s);
const $$ = s => Array.prototype.slice.call(document.querySelectorAll(s));
const LS = {
  get(k, d){
    try {
      const v = localStorage.getItem('calc_' + k);
      return v ? JSON.parse(v) : d;
    } catch (e) { return d; }
  },
  set(k, v){
    try { localStorage.setItem('calc_' + k, JSON.stringify(v)); } catch (e) {}
  }
};

/* ---------- состояние ---------- */
const S = Object.assign({
  mode: 'auto',
  hue: 'sys',
  vib: true,
  pow: 1,
  anim: !matchMedia('(prefers-reduced-motion: reduce)').matches
}, LS.get('s', {}));
const saveS = () => LS.set('s', S);
let PAL = null;

/* =========================================================
   ВЕРСИЯ API ПЛАГИНОВ
   MAJOR увеличивай при ломающих изменениях
   MINOR — только при добавлении нового
   ========================================================= */
const API_VERSION = '2.0';

/* ---------- вибро ---------- */
const vib = m => {
  if (!S.vib) return false;
  const p = m || [8, 16, 28][S.pow] || 20;
  try {
    const N = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.NativeTools;
    if (N) {
      N.vibrate(Array.isArray(p) ? { pattern: p } : { duration: p }).catch(function(){});
      return true;
    }
    if (navigator.vibrate) return navigator.vibrate(p);
  } catch (e) {}
  return false;
};
document.addEventListener('click', () => {
  if (window._vf) { window._vf = 0; vib(); }
});

/* ---------- тосты ---------- */
let tt;
const toast = m => {
  const t = $('#toast');
  if (!t) return;
  t.textContent = String(m);
  t.classList.add('on');
  clearTimeout(tt);
  tt = setTimeout(() => t.classList.remove('on'), 2200);
};

/* глобальный перехват ошибок — показываем тостом */
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

/* ---------- цвет системного акцента ---------- */
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
  ['sys','Системный'], [150,'Зелёный'], [210,'Синий'], [270,'Фиолетовый'],
  [340,'Розовый'], [20,'Оранжевый'], [45,'Жёлтый']
];

function palMap(d){
  const P = PAL;
  return d ? {
    bg: P.n1_900, sf: P.n1_800, sc: P.n1_700,
    pr: P.a1_200, onpr: P.a1_800,
    pc: P.a1_700, onpc: P.a1_100,
    tc: P.a3_700, ontc: P.a3_100,
    tx: P.n1_100, tx2: P.n2_200, ol: P.n2_700
  } : {
    bg: P.n1_10, sf: P.n1_50, sc: P.n2_100,
    pr: P.a1_600, onpr: P.a1_0,
    pc: P.a1_100, onpc: P.a1_900,
    tc: P.a3_100, ontc: P.a3_900,
    tx: P.n1_900, tx2: P.n2_700, ol: P.n2_200
  };
}

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
        bg: H(h,14,8), sf: H(h,14,13), sc: H(h,12,20),
        pr: H(h,60,76), onpr: H(h,60,12),
        pc: H(h,45,26), onpc: H(h,70,90),
        tc: H(t,30,26), ontc: H(t,60,90),
        tx: H(h,10,90), tx2: H(h,8,68), ol: H(h,8,32)
      };
    } else {
      p = {
        bg: H(h,30,97), sf: H(h,22,92), sc: H(h,20,86),
        pr: H(h,55,36), onpr: '#fff',
        pc: H(h,65,86), onpc: H(h,80,10),
        tc: H(t,40,84), ontc: H(t,80,10),
        tx: H(h,10,10), tx2: H(h,8,38), ol: H(h,10,80)
      };
    }

    const r = document.documentElement.style;
    for (const k in p) r.setProperty('--' + k, p[k]);
    r.colorScheme = dark ? 'dark' : 'light';

    const mt = document.querySelector('meta[name=theme-color]');
    if (mt) mt.content = p.bg;
  } catch (e) {
    console.error('applyTheme', e);
  }
}
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);

/* ---------- математика ---------- */
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
    if (x === 'π' || x === 'pi') return Math.PI;
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

/* ---------- калькулятор ---------- */
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
}

function ins(s){
  if (done) {
    expr = isOp(s[0]) || s === '%' ? expr : '';
    done = false;
  }
  if (expr.length < 60) expr += s;
  upd();
}

function press(v){
  if (v === 'AC') { expr = ''; done = false; }
  else if (v === '⌫') { expr = expr.replace(/(?:[a-z√]+\(|.)$/, ''); done = false; }
  else if (v === '=') {
    if (!expr) return;
    try {
      const r = fmt(ev(expr));
      hist.unshift({ e: expr, r: r });
      hist = hist.slice(0, 50);
      LS.set('h', hist);
      expr = r;
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
      if (d) {
        d.classList.remove('shake');
        void d.offsetWidth;
        d.classList.add('shake');
      }
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
    if (!expr) {
      if (v === '−') expr = '−';
      upd();
      return;
    }
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

/* кнопки калькулятора */
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
      lpI = setInterval(() => {
        if (!expr) return lpStop();
        press('⌫');
        vib(6);
      }, 70);
    }, 400);
  });
  ['pointerup','pointercancel','pointerleave'].forEach(n => keysEl.addEventListener(n, lpStop));
}

/* копирование результата */
const dispEl = $('#disp');
if (dispEl) {
  dispEl.onclick = () => {
    const rs = $('#rs');
    const t = done ? expr : (rs ? rs.textContent.replace('= ', '') : '');
    if (!t) return;
    try {
      navigator.clipboard.writeText(t.replace('−', '-')).then(
        () => toast('Скопировано: ' + t),
        () => toast('Копирование недоступно')
      );
    } catch (e) { toast('Копирование недоступно'); }
  };
}

/* ripple-эффект */
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

/* клавиатура */
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
  const m = { '*':'×', '/':'÷', '-':'−', 'Enter':'=', 'Backspace':'⌫', 'Escape':'AC' };
  const k = m[e.key] || e.key;
  if (/^[\d.+%^]$/.test(k) || ('×÷−=⌫AC'.indexOf(k) >= 0 && k.length <= 2) || k === '(' || k === ')') {
    e.preventDefault();
    press(k === '(' || k === ')' ? '()' : k);
  }
});

/* ---------- вкладки (ядро) ---------- */
const ICO = {
  calc: '<path d="M7 3h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2zm1 3v3h8V6H8zm0 6v2h2v-2H8zm4 0v2h2v-2h-2zm4 0v2h2v-2h-2zM8 16v2h2v-2H8zm4 0v2h2v-2h-2zm4 0v2h2v-2h-2z"/>',
  hist: '<path d="M12 3a9 9 0 100 18 9 9 0 000-18zm1 4v4.6l3.4 2-.8 1.4L11 12.4V7h2z"/>',
  plug: '<path d="M20.5 11H19V7a2 2 0 00-2-2h-4V3.5a2.5 2.5 0 00-5 0V5H4a2 2 0 00-2 2v3.8h1.5a2.7 2.7 0 010 5.4H2V20a2 2 0 002 2h3.8v-1.5a2.7 2.7 0 015.4 0V22H17a2 2 0 002-2v-4h1.5a2.5 2.5 0 000-5z"/>',
  set: '<path fill-rule="evenodd" d="M12 8.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zM19.4 13a7.7 7.7 0 000-2l2-1.6-2-3.4-2.4 1a7 7 0 00-1.7-1L15 3.5h-4l-.4 2.5a7 7 0 00-1.7 1l-2.4-1-2 3.4 2 1.6a7.7 7.7 0 000 2l-2 1.6 2 3.4 2.4-1a7 7 0 001.7 1l.4 2.5h4l.4-2.5a7 7 0 001.7-1l2.4 1 2-3.4z"/>'
};

const navEl = $('#nav');
if (navEl) {
  [['calc','Счёт'],['hist','История'],['plug','Плагины'],['set','Настройки']].forEach(([id, l], i) => {
    const b = document.createElement('button');
    b.className = 'tab' + (i ? '' : ' on');
    b.dataset.t = id;
    b.innerHTML = '<i><svg viewBox="0 0 24 24">' + ICO[id] + '</svg></i>' + l;
    b.onclick = () => go(id);
    navEl.append(b);
  });
}

function go(id){
  $$('.tab').forEach(t => t.classList.toggle('on', t.dataset.t === id));
  $$('.page').forEach(p => p.classList.toggle('on', p.id === 'p-' + id));
  if (id === 'hist') rHist();
  if (id === 'plug') rPlug();
}

/* ---------- история ---------- */
function rHist(){
  const h = $('#hist');
  if (!h) return;
  h.innerHTML = hist.length ? '' : '<div class="empty">Пока пусто</div>';
  hist.forEach((x, i) => {
    const d = document.createElement('div');
    d.className = 'card hi';
    d.style.animationDelay = i * 30 + 'ms';
    d.innerHTML = '<small></small><b></b>';
    d.children[0].textContent = x.e + ' =';
    d.children[1].textContent = x.r;
    d.onclick = () => {
      expr = x.r;
      done = true;
      upd();
      go('calc');
    };
    h.append(d);
  });
  if (hist.length) {
    const c = document.createElement('button');
    c.className = 'btn t';
    c.style.width = '100%';
    c.textContent = 'Очистить';
    c.onclick = () => { hist = []; LS.set('h', hist); rHist(); };
    h.append(c);
  }
}

/* =========================================================
   СИСТЕМА ПЛАГИНОВ
   ========================================================= */
const PL = {};
const BUILTIN = new Set();
const custom = LS.get('custom', {});
let enabled = LS.get('en', ['sci', 'haptic']);

const PVALS = LS.get('pvals', {});
const getVals = id => PVALS[id] || (PVALS[id] = {});
const saveVals = () => { LS.set('pvals', PVALS); };
const PSUBS = {};

const parseVer = v => String(v || '1.0').split('.').map(n => parseInt(n, 10) || 0);

function registerPlugin(d, builtin){
  if (!d || !d.id) throw new Error('нужен id');
  const want = d.apiVersion || '1.0';
  const have = API_VERSION;
  const wmaj = parseVer(want)[0];
  const hmaj = parseVer(have)[0];

  d._compat = 'ok';
  if (wmaj > hmaj) d._compat = 'too-new';
  else if (wmaj < hmaj) d._compat = 'legacy';

  PL[d.id] = d;
  if (builtin) BUILTIN.add(d.id);
}

const api = id => ({
  _id: id,

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
  },

  addFunction(n, f){
    if (!/^[a-z]+$/.test(n)) throw new Error('имя функции: только a-z');
    F[n] = f;
    (PL[id]._fn = PL[id]._fn || []).push(n);
  },

  insert: s => ins(s),
  getExpr: () => expr,
  getResult: () => { try { return ev(expr); } catch (e) { return NaN; } },
  setExpr: s => { expr = String(s); done = false; upd(); },
  vibrate: m => vib(m),
  toast: toast,

  getSetting(k){ return getVals(id)[k]; },
  getAllSettings(){ return Object.assign({}, getVals(id)); },
  setSetting(k, v){
    getVals(id)[k] = v;
    saveVals();
    (PSUBS[id] || []).forEach(fn => {
      try { fn(k, v, api(id)); } catch (e) { toast('Ошибка плагина: ' + e.message); }
    });
  },
  onSettingsChange(fn){
    if (!PSUBS[id]) PSUBS[id] = [];
    PSUBS[id].push(fn);
  },

  getApiVersion: () => API_VERSION,
  getCompat: () => PL[id] ? PL[id]._compat : 'unknown'
});

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
  $$('[data-plugin="' + id + '"]').forEach(e => e.remove());
  (p._fn || []).forEach(n => { delete F[n]; });
  p._fn = 0;
  p._on = 0;
  PSUBS[id] = [];
}

function runCode(src){
  new Function('registerPlugin', src)(d => registerPlugin(d, false));
}

/* =========================================================
   ВСТРОЕННЫЕ ПЛАГИНЫ
   ========================================================= */
registerPlugin({
  id: 'sci',
  name: 'Научный режим',
  description: 'sin, cos, tan (в градусах), ln, log, √, π и степень',
  version: '1.0',
  apiVersion: '2.0',
  author: 'Calc',
  onLoad(a){
    [['sin','sin('],['cos','cos('],['tan','tan('],['ln','ln('],['log','log('],['√','√('],['π','π'],['xʸ','^']]
      .forEach(([l, i]) => a.addButton({ label: l, insert: i }));
  }
}, 1);

registerPlugin({
  id: 'vat',
  name: 'НДС',
  description: 'Кнопки «+НДС» и «−НДС» с настраиваемой ставкой',
  version: '1.1',
  apiVersion: '2.0',
  author: 'Calc',
  settings: {
    rate: { type: 'number', label: 'Ставка, %', default: 20, min: 0, max: 100, step: 0.5, hint: 'Например, 20' },
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
  version: '1.1',
  apiVersion: '2.0',
  author: 'Calc',
  settings: {
    min: { type: 'number', label: 'Минимум', default: 1, min: 0, max: 9999, step: 1 },
    max: { type: 'number', label: 'Максимум', default: 100, min: 1, max: 9999, step: 1 },
    vibOn: { type: 'bool', label: 'Вибро при вставке', default: true }
  },
  onLoad(a){
    a.addButton({
      label: '🎲 rnd',
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
  version: '1.0',
  apiVersion: '2.0',
  author: 'Calc',
  onLoad(a){
    a.addButton({
      label: '📳 Тест',
      onClick: x => {
        const ok = x.vibrate([40, 60, 40, 60, 80]);
        x.toast(ok ? 'Вибро отправлено' : 'Вибро выключено или недоступно');
      }
    });
    a.addButton({
      label: '🔍 Диагноз',
      onClick: x => {
        const nat = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.NativeTools;
        const fr = window.self !== window.top;
        let msg;
        if (nat) msg = 'Нативное вибро доступно';
        else msg = 'navigator.vibrate: ' + (navigator.vibrate ? 'есть' : 'нет');
        if (fr && !nat) msg += ' · страница во фрейме';
        x.toast(msg);
      }
    });
  }
}, 1);

/* ---------- загрузка кастомных ---------- */
for (const id in custom) {
  try {
    const src = typeof custom[id] === 'string' ? custom[id] : custom[id]._src;
    if (src) runCode(src);
  } catch (e) { console.error('custom plugin', id, e); }
}
enabled = enabled.filter(id => PL[id]);
enabled.forEach(load);

/* ---------- рендер списка плагинов ---------- */
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
        '<svg class="chev" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg></div>' +
        '<div class="pl-body"></div>' : '');

    c.querySelector('.ava').textContent = (p.name || '?')[0];
    const bEl = c.querySelector('b');
    bEl.textContent = p.name || p.id;

    if (p._compat === 'too-new') {
      const badge = document.createElement('span');
      badge.className = 'badge warn';
      badge.textContent = '⚠ требует ядро ' + (p.apiVersion || '?');
      bEl.append(badge);
    } else if (p._compat === 'legacy') {
      const badge = document.createElement('span');
      badge.className = 'badge legacy';
      badge.textContent = 'legacy';
      bEl.append(badge);
    }

    c.querySelector('small').textContent =
      (p.description || '') + ' · v' + (p.version || '1') + (p.author ? ' · ' + p.author : '');

    const inp = c.querySelector('input[type=checkbox]');
    inp.checked = enabled.indexOf(p.id) >= 0;
    if (p._compat === 'too-new') {
      inp.disabled = true;
      inp.title = 'Обновите приложение';
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
      d.className = 'btn t';
      d.style.cssText = 'margin-top:12px;padding:8px 16px;font-size:13px';
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
      };
      c.append(d);
    }

    l.append(c);
  });
}

/* ---------- настройки плагина ---------- */
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

/* ---------- редактор плагинов ---------- */
const TPL = [
'registerPlugin({',
"  id: 'hello',",
"  name: 'Мой плагин',",
"  description: 'Кнопка +1',",
"  version: '1.0',",
"  apiVersion: '2.0',",
"  author: 'me',",
'  settings: {',
"    step: { type: 'number', label: 'Шаг', default: 1, min: 1, max: 100 },",
"    vib:  { type: 'bool',   label: 'Вибро', default: true }",
'  },',
'  onLoad(api) {',
'    const draw = () => {',
"      document.querySelectorAll('[data-plugin=\"hello\"]').forEach(e => e.remove());",
'      api.addButton({',
"        label: '+' + api.getSetting('step'),",
'        onClick: a => {',
'          const cur = a.getResult();',
"          a.setExpr(String((isNaN(cur) ? 0 : cur) + (+a.getSetting('step'))));",
"          if (a.getSetting('vib')) a.vibrate(20);",
'        }',
'      });',
'    };',
'    draw();',
'    api.onSettingsChange(draw);',
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
  toast('Плагин установлен');
};

/* ---------- настройки приложения ---------- */
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
    if (h === 'sys') { b.textContent = 'A'; b.style.color = '#fff'; b.style.fontWeight = '700'; }
    b.onclick = () => {
      S.hue = h;
      saveS();
      applyTheme();
      sw();
      vib();
    };
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

applyTheme();
upd();

/* ---------- нативный режим ---------- */
(function(){
  const N = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.NativeTools;
  if (!N) return;
  const col = () => N.getColors().then(r => { PAL = r; applyTheme(); }).catch(() => {});
  col();
  document.addEventListener('visibilitychange', () => { if (!document.hidden) col(); });
  N.getPending().then(r => { if (r && r.text) openCalcText(r.text, r.name); }).catch(() => {});
})();

})();