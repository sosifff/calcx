const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const LS={get(k,d){try{const v=localStorage.getItem('calc_'+k);return v?JSON.parse(v):d}catch(e){return d}},set(k,v){try{localStorage.setItem('calc_'+k,JSON.stringify(v))}catch(e){}}};
const S=Object.assign({mode:'auto',hue:'sys',vib:true,pow:1,anim:!matchMedia('(prefers-reduced-motion: reduce)').matches},LS.get('s',{}));
const saveS=()=>LS.set('s',S);
let PAL=null;

/* =========================================================
   ВЕРСИЯ API ПЛАГИНОВ
   Меняй ТОЛЬКО при ломающих изменениях:
   - MAJOR увеличиваешь, если удалил/переименовал методы api
   - MINOR увеличиваешь, если только добавил новое
   ========================================================= */
const API_VERSION = '2.0';

/* ---------- вибро / тосты ---------- */
const vib=(m)=>{if(!S.vib)return false;const p=m||[8,16,28][S.pow];
 try{const N=window.Capacitor&&Capacitor.Plugins&&Capacitor.Plugins.NativeTools;
  if(N){N.vibrate(Array.isArray(p)?{pattern:p}:{duration:p}).catch(()=>{});return true}
  if(navigator.vibrate)return navigator.vibrate(p)}catch(e){}return false};
document.addEventListener('click',()=>{if(window._vf){window._vf=0;vib()}});
let tt;const toast=m=>{const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('on'),2200)};

/* ---------- тема (Material You) ---------- */
function sysHue(){try{const d=document.createElement('div');d.style.color='AccentColor';document.body.append(d);
 const [r,g,b]=getComputedStyle(d).color.match(/[\d.]+/g).map(Number).map(x=>x/255);d.remove();
 const mx=Math.max(r,g,b),mn=Math.min(r,g,b),c=mx-mn;if(c<.12)return 150;
 let h=mx==r?((g-b)/c)%6:mx==g?(b-r)/c+2:(r-g)/c+4;return Math.round((h*60+360)%360)}catch(e){return 150}}
const HUES=[['sys','Системный'],[150,'Зелёный'],[210,'Синий'],[270,'Фиолетовый'],[340,'Розовый'],[20,'Оранжевый'],[45,'Жёлтый']];
function palMap(d){const P=PAL;return d?{bg:P.n1_900,sf:P.n1_800,sc:P.n1_700,pr:P.a1_200,onpr:P.a1_800,pc:P.a1_700,onpc:P.a1_100,tc:P.a3_700,ontc:P.a3_100,tx:P.n1_100,tx2:P.n2_200,ol:P.n2_700}
 :{bg:P.n1_10,sf:P.n1_50,sc:P.n2_100,pr:P.a1_600,onpr:P.a1_0,pc:P.a1_100,onpc:P.a1_900,tc:P.a3_100,ontc:P.a3_900,tx:P.n1_900,tx2:P.n2_700,ol:P.n2_200}}
function applyTheme(){
 const mq=matchMedia('(prefers-color-scheme: dark)').matches;
 const dark=S.mode=='dark'||(S.mode=='auto'&&mq);
 const h=S.hue=='sys'?sysHue():+S.hue,H=(a,s,l)=>`hsl(${a%360} ${s}% ${l}%)`,t=(h+60);
 const p=(S.hue=='sys'&&PAL&&PAL.a1_600)?palMap(dark):dark?{bg:H(h,14,8),sf:H(h,14,13),sc:H(h,12,20),pr:H(h,60,76),onpr:H(h,60,12),pc:H(h,45,26),onpc:H(h,70,90),tc:H(t,30,26),ontc:H(t,60,90),tx:H(h,10,90),tx2:H(h,8,68),ol:H(h,8,32)}
  :{bg:H(h,30,97),sf:H(h,22,92),sc:H(h,20,86),pr:H(h,55,36),onpr:'#fff',pc:H(h,65,86),onpc:H(h,80,10),tc:H(t,40,84),ontc:H(t,80,10),tx:H(h,10,10),tx2:H(h,8,38),ol:H(h,10,80)};
 const r=document.documentElement.style;for(const k in p)r.setProperty('--'+k,p[k]);
 r.colorScheme=dark?'dark':'light';$('meta[name=theme-color]').content=p.bg;
}
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',applyTheme);

/* ---------- вычисления ---------- */
const D=Math.PI/180,F={sin:x=>Math.sin(x*D),cos:x=>Math.cos(x*D),tan:x=>Math.tan(x*D),ln:Math.log,log:Math.log10,sqrt:Math.sqrt,'√':Math.sqrt,abs:Math.abs};
function ev(s){
 const t=s.replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-').match(/\d+\.?\d*|\.\d+|[a-zπ√]+|[-+*/^()%]/g)||[];let i=0;
 const pe=()=>{let v=pt();while(t[i]=='+'||t[i]=='-'){const o=t[i++],r=pt(),pc=t[i-1]=='%';v=o=='+'?v+(pc?v*r:r):v-(pc?v*r:r)}return v};
 const pt=()=>{let v=pp();while(t[i]=='*'||t[i]=='/'){const o=t[i++],r=pp();v=o=='*'?v*r:v/r}return v};
 const pp=()=>{const b=pu();if(t[i]=='^'){i++;return b**pp()}return b};
 const pu=()=>{if(t[i]=='-'){i++;return -pu()}if(t[i]=='+'){i++;return pu()}return po()};
 const po=()=>{let v=pa();while(t[i]=='%'){i++;v/=100}return v};
 const pa=()=>{const x=t[i++];if(x==null)throw 0;if(/^[\d.]/.test(x))return parseFloat(x);
  if(x=='('){const v=pe();if(t[i]==')')i++;return v}if(x=='π'||x=='pi')return Math.PI;
  if(F[x]){if(t[i++]!='(')throw 0;const v=pe();if(t[i]==')')i++;return F[x](v)}throw 0};
 const v=pe();if(i<t.length)throw 0;return v}
const fmt=n=>{if(!isFinite(n))throw 0;const s=+n.toPrecision(12);
 return(Math.abs(s)>=1e15||(s!==0&&Math.abs(s)<1e-9))?s.toExponential(6).replace(/\.?0+e/,'e'):String(s).replace('-','−')};

/* ---------- калькулятор ---------- */
let expr=LS.get('ex',''),done=false,hist=LS.get('h',[]);
const isOp=c=>'+−×÷^'.includes(c);
function upd(){LS.set('ex',expr);const e=$('#ex');e.textContent=expr||'0';e.className=expr.length>22?'s':expr.length>11?'m':'';
 let r='';if(expr&&!done){try{const v=fmt(ev(expr));if(v!==expr&&/[^\d.]/.test(expr.replace(/^−/,'')))r='= '+v}catch(x){}}$('#rs').textContent=r}
function ins(s){if(done){expr=isOp(s[0])||s=='%'?expr:'';done=false}if(expr.length<60)expr+=s;upd()}
function press(v){
 if(v=='AC'){expr='';done=false}
 else if(v=='⌫'){expr=expr.replace(/(?:[a-z√]+\(|.)$/,'');done=false}
 else if(v=='='){if(!expr)return;try{const r=fmt(ev(expr));hist.unshift({e:expr,r});hist=hist.slice(0,50);LS.set('h',hist);expr=r;done=true;
   const rs=$('#rs');upd();rs.textContent='';$('#ex').animate([{transform:'scale(.85)',opacity:.4},{transform:'none',opacity:1}],{duration:350,easing:'cubic-bezier(.2,.9,.3,1.4)'});vib([10,40,18]);return}
   catch(e){const d=$('#disp');d.classList.remove('shake');void d.offsetWidth;d.classList.add('shake');vib([30,40,30]);return}}
 else if(v=='()'){const o=(expr.match(/\(/g)||[]).length,c=(expr.match(/\)/g)||[]).length;ins(o>c&&/[\d)%π]$/.test(expr)?')':'(');return}
 else if(isOp(v)){if(done)done=false;if(!expr){if(v=='−')expr='−';upd();return}if(isOp(expr.slice(-1)))expr=expr.slice(0,-1);expr+=v}
 else if(v=='.'){const n=expr.split(/[^\d.]/).pop();if(n.includes('.')&&!done)return;ins(done?'0.':'.');return}
 else{ins(v);return}
 upd()}
const KEYS=[['AC','AC','fn'],['()','( )','fn'],['%','%','fn'],['÷','÷','op'],['7'],['8'],['9'],['×','×','op'],['4'],['5'],['6'],['−','−','op'],['1'],['2'],['3'],['+','+','op'],['0'],['.'],['⌫','⌫','fn'],['=','=','eq']];
KEYS.forEach(([v,l,c],i)=>{const b=document.createElement('button');b.className='k '+(c||'');b.textContent=l||v;b.dataset.k=v;b.style.animationDelay=i*25+'ms';$('#keys').append(b)});
$('#keys').addEventListener('click',e=>{const b=e.target.closest('.k');if(b&&!window._lp)press(b.dataset.k);window._lp=0});
let lpT,lpI;const lpStop=()=>{clearTimeout(lpT);clearInterval(lpI)};
$('#keys').addEventListener('pointerdown',e=>{window._lp=0;lpStop();const b=e.target.closest('.k');if(!b||b.dataset.k!='⌫')return;
 lpT=setTimeout(()=>{window._lp=1;lpI=setInterval(()=>{if(!expr)return lpStop();press('⌫');vib(6)},70)},400)});
['pointerup','pointercancel','pointerleave'].forEach(n=>$('#keys').addEventListener(n,lpStop));
$('#disp').onclick=()=>{const t=done?expr:$('#rs').textContent.replace('= ','');if(!t)return;
 try{navigator.clipboard.writeText(t.replace('−','-')).then(()=>toast('Скопировано: '+t),()=>toast('Копирование недоступно'))}catch(e){toast('Копирование недоступно')}};
addEventListener('error',e=>{if(e.message&&e.message!='Script error.')toast('Ошибка: '+e.message)});
document.addEventListener('pointerdown',e=>{const b=e.target.closest('.k,.btn,.hi');if(!b)return;
 if(!b.closest('#keys')||b.dataset.k!='=')window._vf=!vib();
 if(!b.classList.contains('k'))return;const r=b.getBoundingClientRect(),z=Math.max(r.width,r.height)*2.2,s=document.createElement('span');
 s.className='rp';s.style.cssText=`width:${z}px;height:${z}px;left:${e.clientX-r.left-z/2}px;top:${e.clientY-r.top-z/2}px`;b.append(s);setTimeout(()=>s.remove(),600)});
document.addEventListener('keydown',e=>{if(e.target.tagName=='TEXTAREA'||e.target.tagName=='INPUT')return;const m={'*':'×','/':'÷','-':'−','Enter':'=','Backspace':'⌫','Escape':'AC'};const k=m[e.key]||e.key;
 if(/^[\d.+%^]$/.test(k)||'×÷−=⌫AC'.includes(k)&&k.length<=2||k=='('||k==')'){e.preventDefault();press(k=='('||k==')'?'()':k)}});

/* ---------- вкладки ---------- */
const ICO={calc:'<path d="M7 3h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2zm1 3v3h8V6H8zm0 6v2h2v-2H8zm4 0v2h2v-2h-2zm4 0v2h2v-2h-2zM8 16v2h2v-2H8zm4 0v2h2v-2h-2zm4 0v2h2v-2h-2z"/>',
 hist:'<path d="M12 3a9 9 0 100 18 9 9 0 000-18zm1 4v4.6l3.4 2-.8 1.4L11 12.4V7h2z"/>',
 plug:'<path d="M20.5 11H19V7a2 2 0 00-2-2h-4V3.5a2.5 2.5 0 00-5 0V5H4a2 2 0 00-2 2v3.8h1.5a2.7 2.7 0 010 5.4H2V20a2 2 0 002 2h3.8v-1.5a2.7 2.7 0 015.4 0V22H17a2 2 0 002-2v-4h1.5a2.5 2.5 0 000-5z"/>',
 set:'<path fill-rule="evenodd" d="M12 8.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zM19.4 13a7.7 7.7 0 000-2l2-1.6-2-3.4-2.4 1a7 7 0 00-1.7-1L15 3.5h-4l-.4 2.5a7 7 0 00-1.7 1l-2.4-1-2 3.4 2 1.6a7.7 7.7 0 000 2l-2 1.6 2 3.4 2.4-1a7 7 0 001.7 1l.4 2.5h4l.4-2.5a7 7 0 001.7-1l2.4 1 2-3.4z"/>'};
[['calc','Счёт'],['hist','История'],['plug','Плагины'],['set','Настройки']].forEach(([id,l],i)=>{
 const b=document.createElement('button');b.className='tab'+(i?'':' on');b.dataset.t=id;b.innerHTML=`<i><svg viewBox="0 0 24 24">${ICO[id]}</svg></i>${l}`;
 b.onclick=()=>go(id);$('#nav').append(b)});
function go(id){$$('.tab').forEach(t=>t.classList.toggle('on',t.dataset.t==id));
 $$('.page').forEach(p=>p.classList.toggle('on',p.id=='p-'+id));if(id=='hist')rHist();if(id=='plug')rPlug()}
function rHist(){const h=$('#hist');h.innerHTML=hist.length?'':'<div class="empty">Пока пусто</div>';
 hist.forEach((x,i)=>{const d=document.createElement('div');d.className='card hi';d.style.animationDelay=i*30+'ms';d.innerHTML=`<small></small><b></b>`;
  d.children[0].textContent=x.e+' =';d.children[1].textContent=x.r;d.onclick=()=>{expr=x.r;done=true;upd();go('calc')};h.append(d)});
 if(hist.length){const c=document.createElement('button');c.className='btn t';c.style.width='100%';c.textContent='Очистить';c.onclick=()=>{hist=[];LS.set('h',hist);rHist()};h.append(c)}}

/* =========================================================
   СИСТЕМА ПЛАГИНОВ
   ========================================================= */
const PL={},BUILTIN=new Set(),custom=LS.get('custom',{});
let enabled=LS.get('en',['sci','haptic','solver']);

/* значения настроек плагинов */
const PVALS=LS.get('pvals',{});
const getVals=id=>PVALS[id]||(PVALS[id]={});
const saveVals=id=>{LS.set('pvals',PVALS)};
const PSUBS={};

/* ---- версии ---- */
const parseVer = v => String(v||'1.0').split('.').map(n=>parseInt(n,10)||0);
const cmpVer = (a,b) => {const A=parseVer(a),B=parseVer(b);return (A[0]-B[0])||(A[1]-B[1])};

/* ---- шимы для legacy-плагинов ---- */
const SHIMS = {
  /* API 1.x: api.addPage не существовал — игнорируем без ошибки */
  addPage_1x(apiObj){
    return { warn: 'addPage недоступен в API 1.x' };
  },
  /* API 1.x: api.getSetting не существовал — возвращаем дефолт */
  getSetting_1x(apiObj, k, dflt){
    return dflt;
  }
};

/* ---- главный API ---- */
const api=id=>({
 _id:id,
 _legacy:false,

 addButton(o){
   const b=document.createElement('button');
   b.className='k fn chip';
   b.textContent=o.label;
   b.dataset.plugin=id;
   b.onclick=()=>{
     try{o.onClick?o.onClick(api(id)):ins(o.insert||o.label)}
     catch(e){toast('Ошибка плагина: '+e.message)}
   };
   $('#extra').append(b);
 },

 addFunction(n,f){
   if(!/^[a-z]+$/.test(n))throw new Error('имя функции: только a-z');
   F[n]=f;
   (PL[id]._fn=PL[id]._fn||[]).push(n);
 },

 insert:s=>ins(s),
 getExpr:()=>expr,
 getResult:()=>{try{return ev(expr)}catch(e){return NaN}},
 setExpr:s=>{expr=String(s);done=false;upd()},
 vibrate:m=>vib(m),
 toast,

 /* --- настройки --- */
 getSetting(k){return getVals(id)[k]},
 getAllSettings(){return {...getVals(id)}},
 setSetting(k,v){
   getVals(id)[k]=v;
   saveVals(id);
   (PSUBS[id]||[]).forEach(fn=>{try{fn(k,v,api(id))}catch(e){toast('Ошибка плагина: '+e.message)}});
 },
 onSettingsChange(fn){(PSUBS[id]=PSUBS[id]||[]).push(fn)},

 /* --- инфо о ядре --- */
 getApiVersion:()=>API_VERSION,
 getCompat:()=>PL[id]?PL[id]._compat:'unknown'
});

/* ---- регистрация плагина ---- */
function registerPlugin(d, builtin){
  if(!d || !d.id) throw new Error('нужен id');

  const want = d.apiVersion || '1.0';
  const have = API_VERSION;
  const [wmaj] = parseVer(want);
  const [hmaj] = parseVer(have);

  d._compat = 'ok';
  if (wmaj > hmaj) {
    d._compat = 'too-new';
  } else if (wmaj < hmaj) {
    d._compat = 'legacy';
  }

  PL[d.id] = d;
  if (builtin) BUILTIN.add(d.id);
}

/* ---- дефолты настроек ---- */
function applyDefaults(id){
 const p=PL[id];
 if(!p||!p.settings)return;
 const v=getVals(id);
 let changed=false;
 for(const k in p.settings){
   if(!(k in v)){v[k]=p.settings[k].default;changed=true}
 }
 if(changed)saveVals(id);
}

/* ---- загрузка плагина ---- */
function load(id){
  const p=PL[id];
  if(!p) return;

  if (p._compat === 'too-new') {
    toast('Плагин «'+(p.name||id)+'» требует ядро '+(p.apiVersion||'?')+
          ', у вас '+API_VERSION);
    return;
  }

  applyDefaults(id);
  if (p._on) return;

  const realApi = api(id);
  if (p._compat === 'legacy') realApi._legacy = true;

  /* подкладываем шимы для legacy */
  if (p._compat === 'legacy') {
    if (typeof realApi.addPage !== 'function') {
      /* уже нет — ок */
    }
  }

  try {
    p.onLoad && p.onLoad(realApi);
    p._on = 1;
  } catch(e) {
    toast('Плагин «'+(p.name||id)+'»: '+e.message);
  }
}

/* ---- выгрузка ---- */
function unload(id){
  const p=PL[id];
  if(!p) return;
  try { p.onUnload && p.onUnload(api(id)); } catch(e) {}
  $$(`[data-plugin="${id}"]`).forEach(e=>e.remove());
  (p._fn||[]).forEach(n=>delete F[n]);
  p._fn=0;
  p._on=0;
  PSUBS[id]=[];
}

function runCode(src){new Function('registerPlugin',src)(d=>registerPlugin(d,false))}

/* =========================================================
   ВСТРОЕННЫЕ ПЛАГИНЫ
   ========================================================= */
registerPlugin({id:'sci',name:'Научный режим',description:'sin, cos, tan (в градусах), ln, log, √, π и степень',version:'1.0',apiVersion:'2.0',author:'Calc',
 onLoad(a){[['sin','sin('],['cos','cos('],['tan','tan('],['ln','ln('],['log','log('],['√','√('],['π','π'],['xʸ','^']].forEach(([l,i])=>a.addButton({label:l,insert:i}))}},1);

registerPlugin({id:'vat',name:'НДС',description:'Кнопки «+НДС» и «−НДС» с настраиваемой ставкой',version:'1.1',apiVersion:'2.0',author:'Calc',
 settings:{
   rate:{type:'number',label:'Ставка, %',default:20,min:0,max:100,step:0.5,hint:'Например, 20 для России'},
   labelMode:{type:'seg',label:'Подписи кнопок',default:'short',
     options:[{value:'short',label:'+НДС'},{value:'full',label:'С налогом'}]}
 },
 onLoad(a){
   const render=()=>{
     $$('[data-plugin="vat"]').forEach(e=>e.remove());
     const rate=+a.getSetting('rate')||20;
     const k=1+rate/100;
     const short=a.getSetting('labelMode')==='short';
     const f=mul=>x=>{const v=x.getResult();if(isNaN(v))return x.toast('Нечего считать');x.setExpr(fmt(v*mul))};
     a.addButton({label:(short?'+НДС':'С налогом'),onClick:f(k)});
     a.addButton({label:(short?'−НДС':'Без налога'),onClick:f(1/k)});
   };
   render();
   a.onSettingsChange(render);
 }},1);

registerPlugin({id:'rnd',name:'Случайное число',description:'Вставляет случайное число с вибро-откликом',version:'1.1',apiVersion:'2.0',author:'Calc',
 settings:{
   min:{type:'number',label:'Минимум',default:1,min:0,max:9999,step:1},
   max:{type:'number',label:'Максимум',default:100,min:1,max:9999,step:1},
   vibOn:{type:'bool',label:'Вибро при вставке',default:true}
 },
 onLoad(a){
   a.addButton({label:'🎲 rnd',onClick:x=>{
     let lo=+x.getSetting('min')||1, hi=+x.getSetting('max')||100;
     if(hi<lo){const t=lo;lo=hi;hi=t}
     const v=lo+Math.floor(Math.random()*(hi-lo+1));
     x.insert(String(v));
     if(x.getSetting('vibOn'))x.vibrate([10,30,10,30]);
   }})
 }},1);

registerPlugin({id:'haptic',name:'Вибро',description:'Тест вибрации и диагностика',version:'1.0',apiVersion:'2.0',author:'Calc',
 onLoad(a){
   a.addButton({label:'📳 Тест',onClick:x=>{const ok=x.vibrate([40,60,40,60,80]);
     x.toast(ok?'Вибро отправлено — если не чувствуете, проверьте системные настройки':'Вибро заблокировано или выключено в настройках')}});
   a.addButton({label:'🔍 Диагноз',onClick:x=>{
     const nat=window.Capacitor&&Capacitor.Plugins&&Capacitor.Plugins.NativeTools,fr=window.self!==window.top;
     x.toast((nat?'Нативное вибро доступно':'navigator.vibrate: '+(navigator.vibrate?'есть':'нет'))+
       (fr&&!nat?' · страница во встроенном окне, откройте ссылку напрямую в Chrome':''))}})
 }},1);

/* ---------- Плагин: AI-репетитор «Решения» ---------- */
registerPlugin({
 id:'solver',
 name:'Решения (AI-репетитор)',
 description:'Отправляет задачу в AI и показывает пошаговый разбор',
 version:'1.0',
 apiVersion:'2.0',
 author:'Calc',
 settings:{
   provider:{
     type:'seg',
     label:'Провайдер AI',
     default:'demo',
     options:[
       {value:'demo',label:'Демо (оффлайн)'},
       {value:'gigachat',label:'GigaChat'},
       {value:'openai',label:'OpenAI'},
       {value:'custom',label:'Свой сервер'}
     ],
     hint:'Демо работает без интернета и решает простые примеры'
   },
   apiKey:{type:'text',label:'API-ключ',default:'',placeholder:'вставь ключ провайдера',
     hint:'Хранится только на этом устройстве'},
   endpoint:{type:'text',label:'Адрес своего сервера',default:'',placeholder:'https://example.com/solve',
     hint:'POST {task} → {solution}'},
   detailed:{type:'bool',label:'Подробный разбор',default:true,hint:'Пошаговое решение вместо просто ответа'}
 },
 onLoad(api){
   function demoSolve(task){
     const t=task.trim().toLowerCase();
     let m=t.match(/^(-?\d*\.?\d*)\s*\*?\s*x\s*([+\-])\s*(\d+\.?\d*)\s*=\s*(-?\d+\.?\d*)$/);
     if(m){
       const A=(m[1]===''||m[1]==='-')?-1:parseFloat(m[1]);
       const sign=m[2]==='+'?1:-1;
       const B=parseFloat(m[3]);
       const C=parseFloat(m[4]);
       const x=(C-sign*B)/A;
       return `Линейное уравнение:\n${A}x ${sign>0?'+':'-'} ${B} = ${C}\n\n`
             +`Шаг 1. Переносим число вправо:\n${A}x = ${C} ${sign>0?'-':'+'} ${B}\n${A}x = ${C-sign*B}\n\n`
             +`Шаг 2. Делим обе стороны на ${A}:\nx = ${x}\n\nОтвет: x = ${x}`;
     }
     m=t.match(/(\d+\.?\d*)\s*%\s*от\s*(\d+\.?\d*)/);
     if(m){
       const p=parseFloat(m[1]),n=parseFloat(m[2]);
       const r=p*n/100;
       return `${p}% от ${n}:\n\n${p}% = ${p}/100\n${p}/100 × ${n} = ${r}\n\nОтвет: ${r}`;
     }
     try{
       const v=api.getResult();
       if(isFinite(v))return `Вычисление:\n${task}\n\nОтвет: ${v}`;
     }catch(e){}
     return null;
   }

   async function askAI(task){
     const provider=api.getSetting('provider');
     const detailed=api.getSetting('detailed');
     const prompt=detailed
       ?`Реши задачу пошагово, на русском, кратко и понятно:\n\n${task}`
       :`Реши задачу, дай только ответ:\n\n${task}`;

     if(provider==='demo'){
       const r=demoSolve(task);
       if(r)return {text:r,provider:'Демо'};
       throw new Error('Демо не умеет такое. Выбери GigaChat/OpenAI в настройках.');
     }

     if(provider==='gigachat'){
       const key=api.getSetting('apiKey');
       if(!key)throw new Error('Укажи API-ключ GigaChat в настройках плагина');
       const r=await fetch('https://gigachat.devices.sberbank.ru/api/v1/chat/completions',{
         method:'POST',
         headers:{'Content-Type':'application/json','Authorization':'Bearer '+key},
         body:JSON.stringify({model:'GigaChat',messages:[{role:'user',content:prompt}]})
       });
       if(!r.ok)throw new Error('GigaChat: '+r.status);
       const j=await r.json();
       return {text:j.choices?.[0]?.message?.content||'Пусто',provider:'GigaChat'};
     }

     if(provider==='openai'){
       const key=api.getSetting('apiKey');
       if(!key)throw new Error('Укажи API-ключ OpenAI в настройках плагина');
       const r=await fetch('https://api.openai.com/v1/chat/completions',{
         method:'POST',
         headers: