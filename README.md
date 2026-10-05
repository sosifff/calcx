📘 Плагин для CalcX — полный гайд (обновлён под API 3.0)

```
╔═══════════════════════════════════════════════════════════╗
║        ПЛАГИН ДЛЯ КАЛЬКУЛЯТОРА — ПОЛНЫЙ ГАЙД v3.0         ║
╚═══════════════════════════════════════════════════════════╝
```

🧩 ЧТО ТАКОЕ ПЛАГИН

Плагин — это маленькая программа в виде текста. Она может:

· добавлять кнопки над клавиатурой,
· добавлять свои функции в формулы (cube(3), fact(5)),
· создавать свои вкладки в нижнем баре,
· строить свой интерфейс (карточки, кнопки, поля, модалки),
· хранить свои данные (настройки, заметки — что угодно),
· менять тему оформления,
· ловить события калькулятора (нажатия, результат, смена темы),
· ходить в интернет (курсы валют, AI, база ГДЗ),
· делать звук, вибро и уведомления.

Текст между /* ... */ и строки после // — это комментарии. Калькулятор их не читает, они нужны людям.

---

🛠 КАК УСТАНОВИТЬ

1. Открой вкладку «Плагины».
2. Нажми «＋ Вставить код».
3. Удали весь текст в окошке и вставь свой плагин.
4. Нажми «Установить». Плагин сразу включится.

Выключить, обновить или удалить плагин — там же, во вкладке «Плагины».

Хочешь установить готовый .calc-файл? Нажми «📂 Открыть .calc».

---

✏️ КАК ПЕРЕДЕЛАТЬ ПОД СЕБЯ

Меняй только то, что стоит внутри кавычек ' ' и числа. Скобки { } ( ), запятые, точки с запятой и слова вроде onClick не трогай.

Каждая строка заканчивается на ; или , — как в примере.

---

✅ ЧТО МОЖНО

· Добавить сколько угодно кнопок (листаются вбок).
· Кнопка вставляет число, текст или функцию в формулу.
· Кнопка считает и меняет результат (скидка, НДС, округление).
· Своя функция от одного числа: cube(3) → 27.
· Своя константа для формул: g, c, h.
· Создать свою вкладку в баре со своим интерфейсом.
· Сделать свою тему (неон, матрица, киберпанк).
· Хранить свои данные между запусками.
· Реагировать на нажатия и результаты.
· Отправлять запросы в интернет (курс валют, AI, ГДЗ).
· Показать сообщение, вибрацию, звук, уведомление.
· Один плагин — сколько угодно кнопок, функций и вкладок сразу.

---

❌ ЧЕГО НЕЛЬЗЯ

· ❌ Менять встроенные кнопки (цифры, =, AC, ⌫).
· ❌ Функция от двух чисел: nod(12,18) — не сработает (нет запятой в формулах). Решение: кнопка с onClick (пример ниже).
· ❌ Имя функции с цифрами, заглавными буквами или пробелами. Только a–z: cube, half, tof.
· ❌ Занятые id: sci, vat, rnd, haptic, demo.
· ❌ Два плагина с одинаковым id.
· ❌ Два registerPlugin в одном файле — только один.
· ❌ Ставить плагины от людей, которым не доверяешь. Плагин — это код с полным доступом.

---

🧮 ЧТО ПОНИМАЕТ ФОРМУЛА

Что Как
Числа 12.5 (запятая не работает, только точка)
Знаки + − × ÷ ^ % и скобки ( )
Константы π, e, а также твои через addConstant
Функции sin( cos( tan( — в градусах; ln( log( √( sqrt( abs(
Свои функции cube(3), half(10) — что добавишь через addFunction

Примеры:

· 100+10% → 110
· 200×10% → 20
· 2^10 → 1024
· sin(30) → 0.5

---

🎛 КОМАНДЫ API — что умеет плагин

Кнопки и функции

```js
api.addButton({ label:'текст', insert:'что вставить' });
api.addButton({ label:'текст', onClick: a => { /* действие */ } });
api.addFunction('имя', x => x ** 3);      // только маленькие латинские
api.addConstant('g', 9.81);               // константа для формул
```

Работа с формулой

```js
api.insert('текст');        // добавить в конец
api.getExpr();              // текущая формула (строка)
api.getResult();            // результат (число) или NaN
api.setExpr('текст');       // заменить формулу
```

Свои вкладки в баре

```js
api.addPage({
  id: 'notes-page',
  title: 'Заметки',
  icon: '<path d="M4 4h16v16H4z"/>',
  render: (root) => {
    root.innerHTML = '<h1>Заметки</h1>';
    root.append(api.ui.button({ label: 'Ок', onClick: () => {} }));
  },
  onShow: () => {},
  onHide: () => {}
});

api.openPage('notes-page');
api.removePage('notes-page');
```

Свои настройки (ядро само нарисует поля)

```js
settings: {
  step:    { type:'number', label:'Шаг', default:1, min:1, max:100 },
  сила:    { type:'range',  label:'Сила', default:5, min:1, max:10 },
  виб:     { type:'bool',   label:'Вибро', default:true },
  режим:   { type:'seg',    label:'Режим', default:'a',
             options:[{value:'a',label:'А'},{value:'b',label:'Б'}] },
  текст:   { type:'text',   label:'Заметка', default:'', placeholder:'...' }
}

api.getSetting('step');
api.setSetting('step', 5);
api.onSettingsChange((key, value) => { /* реагируем */ });
```

Хранилище (своё, изолированное)

```js
api.store.set('ключ', значение);
api.store.get('ключ', 'по умолчанию');
api.store.remove('ключ');
api.store.keys();
api.store.clear();
```

Интерфейс (готовые компоненты)

```js
api.ui.card({ title:'Заголовок', hint:'подпись', content: DOM });
api.ui.button({ label:'Кнопка', variant:'t', onClick:()=>{} });
api.ui.toggle({ label:'Вкл', value:true, onChange:v=>{} });
api.ui.input({ type:'text', value:'', placeholder:'...', onChange:v=>{} });
api.ui.select({ options:[{value,label}], value, onChange });
api.ui.list({ items:[{title, subtitle, onClick}] });
api.ui.modal({ title:'Заголовок', content: DOM, actions:[{label, onClick}] });
api.ui.overlay('Загрузка…');      // вернёт функцию close()
api.ui.notify({ title:'Сообщение', duration:3000 });
api.ui.el('div', { class:'x', text:'привет' }, [ребёнок1, ребёнок2]);
```

События

```js
api.on('calc:press', e => { /* e.key, e.expr, e.cancel */ });
api.on('calc:result', e => { /* e.expr, e.result, e.cancel */ });
api.on('calc:change', e => { /* e.expr */ });
api.on('page:open', e => { /* e.id */ });
api.on('theme:change', e => { /* e.dark */ });
api.on('resume', () => {});
api.on('pause', () => {});
api.on('network', e => { /* e.online */ });

api.emit('моё:событие', { данные });
api.off('calc:press', fn);
```

Отмена события: установи e.cancel = true в calc:press или calc:result — и ядро не выполнит действие.

Сеть

```js
await api.fetchJSON('https://api.example.com/data');
await api.fetchText('https://example.com/page');
await api.fetch('https://example.com', { method:'POST', body:'...' });
```

Эффекты

```js
api.vibrate(20);              // 20 мс
api.vibrate([10, 30, 10]);    // узор: вибро 10, пауза 30, вибро 10
api.beep(440, 0.2, 'sine');   // звук: частота, длительность, форма
api.toast('текст');
api.notify({ title:'Заголовок', body:'текст' });
```

Внешний вид

```js
api.registerTheme({
  id:'neon', name:'Неон',
  light:{ '--pr':'#06f', '--pc':'#cdf' },
  dark: { '--pr':'#0ff', '--pc':'#036' }
});
api.setTheme('neon');       // или null — вернуть системную
api.injectCSS('.my { color: red; }');

api.addResultAction({
  label:'🔥 Удвоить',
  onClick: (result) => { /* долгий тап по результату */ }
});
```

Разное

```js
api.log('текст', значение);   // [id плагина] текст 123
api.warn(...); api.error(...);
api.i18n({ ru:{hello:'Привет'}, en:{hello:'Hi'} });
```

---

📖 ПОЛНЫЙ ПРИМЕР ПЛАГИНА

```js
registerPlugin({
  id: 'my-plugin',
  name: 'Мой плагин',
  description: 'Пример всех возможностей',
  version: '1.0',
  apiVersion: '3.0',
  author: 'Твоё имя',
  icon: '✨',

  /* Настройки — ядро само нарисует поля */
  settings: {
    step: { type:'number', label:'Шаг', default:5, min:1, max:100 },
    vib:  { type:'bool',   label:'Вибро', default:true }
  },

  /* Всё, что должно появиться в калькуляторе */
  onLoad(api) {

    /* 1. Кнопка-константа */
    api.addButton({ label: 'g', insert: '9.81' });

    /* 2. Своя функция */
    api.addFunction('cube', x => x ** 3);
    api.addButton({ label: 'cube', insert: 'cube(' });

    /* 3. Кнопка с действием: ×2 */
    api.addButton({
      label: '×2',
      onClick: a => {
        const v = a.getResult();
        if (isNaN(v)) return a.toast('Сначала введите выражение');
        a.setExpr(String(v * 2));
        if (a.getSetting('vib')) a.vibrate(20);
      }
    });

    /* 4. Кнопка со своим шагом из настроек */
    api.addButton({
      label: '+' + api.getSetting('step'),
      onClick: a => {
        const v = a.getResult();
        a.setExpr(String((isNaN(v) ? 0 : v) + (+a.getSetting('step'))));
      }
    });

    /* 5. Своя вкладка */
    api.addPage({
      id: 'kitchen-page',
      title: 'Кухня',
      icon: '<path d="M4 4h16v16H4z"/>',
      render: (root) => {
        root.innerHTML = '';
        root.append(api.ui.el('h1', { text: 'Моя кухня' }));
        root.append(api.ui.card({
          title: 'Счётчик',
          content: (() => {
            const out = api.ui.el('b', { text: String(api.store.get('n', 0)) });
            out.style.fontSize = '24px';
            const inc = api.ui.button({
              label: '+1',
              onClick: () => {
                const v = api.store.get('n', 0) + 1;
                api.store.set('n', v);
                out.textContent = String(v);
              }
            });
            const box = api.ui.el('div');
            box.append(out, inc);
            return box;
          })()
        }));
      }
    });

    /* 6. Своя тема */
    api.registerTheme({
      id: 'myplugin-neon',
      name: 'Неон',
      light: { '--pr':'#06f', '--pc':'#cdf' },
      dark:  { '--pr':'#0ff', '--pc':'#036' }
    });

    /* 7. Реакция на нажатие = */
    api.on('calc:result', (e) => {
      api.log('Получили', e.expr, '=', e.result);
    });

    /* 8. Пункт в контекстное меню результата */
    api.addResultAction({
      label: '🔥 Удвоить',
      onClick: (r) => {
        const n = parseFloat(String(r).replace('−','-'));
        if (!isNaN(n)) api.setExpr(String(n * 2));
      }
    });

    /* 9. Сеть */
    api.addButton({
      label: '💵 Курс',
      onClick: async (a) => {
        const close = a.ui.overlay('Загружаю…');
        try {
          const data = await a.fetchJSON(
            'https://api.exchangerate.host/latest?base=USD&symbols=RUB'
          );
          a.ui.modal({
            title: 'Курс USD',
            content: a.ui.el('div', {
              text: '1 USD = ' + data.rates.RUB.toFixed(2) + ' ₽'
            })
          });
        } catch (err) {
          a.toast('Ошибка: ' + err.message);
        } finally {
          close();
        }
      }
    });
  },

  /* Вызывается при выключении. Кнопки и вкладки убираются сами */
  onUnload() {}
});
```

---

🧠 ЧАСТЫЕ ОШИБКИ

Сообщение Причина Решение
Плагин не зарегистрирован нет registerPlugin или id добавь registerPlugin({ id:'x', onLoad(api){} })
Ошибка: ... при установке потерялась }, ), ' или , сверь с примером, проверь парность скобок
Кнопки не появились плагин выключен включи переключатель во вкладке «Плагины»
Функция не работает имя с цифрой / заглавной / пробелом только a–z: cube, half, tof
Плагин требует ядро 3.x указан apiVersion выше, чем у ядра убери apiVersion или поставь '3.0'
Не хватает: sci указан requires:['sci'], а плагина нет включи требуемый плагин или убери requires
Хочу обновить плагин с тем же id ядро не даст поставить два удали старый или смени id
Вкладка не появляется addPage вызван до onLoad вызывай addPage внутри onLoad(api)

---

🚦 РЕКОМЕНДАЦИИ

· ✅ Используй api.store для хранения данных плагина — данные не пересекаются между плагинами.
· ✅ В onUnload убирай за собой: отписывайся от событий и удаляй DOM, если создавал вручную.
· ✅ Указывай apiVersion: '3.0', чтобы ядро не помечало плагин как legacy.
· ✅ Для тяжёлых задач используй async/await, чтобы не блокировать UI.
· ✅ Проверяй результат на isNaN перед setExpr.
· ❌ Не пиши в localStorage напрямую — используй api.store.
· ❌ Не трогай document.body — работай через api.addPage и api.ui.
· ❌ Не выключай чужие плагины программно — это не твоё дело.

---

🎢 ПРИМЕР: ПЛАГИН «ВЕСЁЛЫЕ КНОПКИ»

Кнопки калькулятора при нажатии подпрыгивают, крутятся и покачиваются. Всё визуально — вычисления не меняются.

```js
/*
╔═══════════════════════════════════════════════════════════╗
║        ПЛАГИН «ВЕСЁЛЫЕ КНОПКИ»                           ║
║        Кнопки прыгают и крутятся при каждом нажатии        ║
╚═══════════════════════════════════════════════════════════╝

ЧТО ДЕЛАЕТ
При каждом нажатии на кнопку калькулятора она подпрыгивает,
крутится, отлетает в сторону и возвращается на место.
Работает только визуально — сами вычисления не меняются.

КАК УСТАНОВИТЬ
1. Вкладка «Плагины» → «＋ Вставить код».
2. Удали всё в окошке и вставь этот файл.
3. Нажми «Установить».

ЧТО МОЖНО НАСТРОИТЬ
Открой «Плагины» → «Весёлые кнопки» → «Настройки плагина»:
• Сила эффекта — насколько сильно кнопки крутятся и отлетают.
• Прыжок — подпрыгивает ли кнопка вверх.
• Вращение — крутится ли кнопка.
• Покачивание — дрожит ли из стороны в сторону.
• Вибро — лёгкая вибрация при каждом прыжке.
*/

registerPlugin({

  id: 'funky-buttons',
  name: '🎢 Весёлые кнопки',
  description: 'Кнопки прыгают и крутятся при каждом нажатии',
  version: '1.0',
  apiVersion: '3.0',
  author: 'Ты',
  icon: '🎢',

  /* Настройки плагина */
  settings: {
    intensity: {
      type: 'range',
      label: 'Сила эффекта',
      default: 6,
      min: 1, max: 10, step: 1,
      hint: '1 — чуть-чуть, 10 — полный беспредел'
    },
    jump:   { type: 'bool', label: 'Прыжок вверх',   default: true },
    spin:   { type: 'bool', label: 'Вращение',        default: true },
    wiggle: { type: 'bool', label: 'Покачивание',     default: true },
    vib:    { type: 'bool', label: 'Вибро при нажатии', default: true }
  },

  onLoad(api) {

    /* 1. Свои CSS-анимации. Ядро само почистит их при выключении */
    api.injectCSS(`
      .k.funky { position: relative; will-change: transform; }

      @keyframes funky-jump {
        0%   { transform: translateY(0) rotate(0) scale(1); }
        30%  { transform: translateY(-40px) rotate(180deg) scale(1.15); }
        55%  { transform: translateY(-15px) rotate(320deg) scale(1.05); }
        75%  { transform: translateY(-5px) rotate(360deg) scale(1); }
        100% { transform: translateY(0) rotate(0) scale(1); }
      }
      @keyframes funky-wiggle {
        0%   { transform: translate(0,0) rotate(0); }
        20%  { transform: translate(-8px,-4px) rotate(-6deg); }
        40%  { transform: translate(10px,-6px) rotate(5deg); }
        60%  { transform: translate(-6px,3px) rotate(-4deg); }
        80%  { transform: translate(4px,-2px) rotate(2deg); }
        100% { transform: translate(0,0) rotate(0); }
      }
      @keyframes funky-spin {
        0%   { transform: rotate(0) scale(1); }
        50%  { transform: rotate(180deg) scale(1.25); }
        100% { transform: rotate(360deg) scale(1); }
      }

      .k.funky-jump   { animation: funky-jump   .8s cubic-bezier(.3,1.4,.5,1); }
      .k.funky-wiggle { animation: funky-wiggle .6s ease-in-out; }
      .k.funky-spin   { animation: funky-spin   .7s cubic-bezier(.3,1.4,.5,1); }
    `);

    /* 2. Помечаем все кнопки #keys классом .funky */
    const KEYS_SELECTOR = '#keys .k';

    function markButton(b){
      if (b && !b.classList.contains('funky')) b.classList.add('funky');
    }
    function markAll(){
      document.querySelectorAll(KEYS_SELECTOR).forEach(markButton);
    }
    markAll();

    /* 3. Наблюдаем за новыми кнопками — плагины могут их добавлять */
    const keysEl = document.getElementById('keys');
    if (keysEl) {
      const observer = new MutationObserver(muts => {
        muts.forEach(m => m.addedNodes.forEach(n => {
          if (n.nodeType === 1) {
            if (n.matches && n.matches(KEYS_SELECTOR)) markButton(n);
            if (n.querySelectorAll) n.querySelectorAll(KEYS_SELECTOR).forEach(markButton);
          }
        }));
      });
      observer.observe(keysEl, { childList: true, subtree: true });
    }

    /* 4. Анимация конкретной кнопки */
    function animateButton(btn){
      if (!btn) return;
      const it = +api.getSetting('intensity') || 6;
      const speed = (1100 - it * 60) / 1000;  // 1 — медленно, 10 — быстро
      btn.style.animationDuration = speed + 's';

      btn.classList.remove('funky-jump', 'funky-spin', 'funky-wiggle');
      void btn.offsetWidth;                    // перезапуск анимации

      if (api.getSetting('jump'))   btn.classList.add('funky-jump');
      if (api.getSetting('spin'))   btn.classList.add('funky-spin');
      if (api.getSetting('wiggle')) btn.classList.add('funky-wiggle');

      setTimeout(() => {
        btn.classList.remove('funky-jump', 'funky-spin', 'funky-wiggle');
      }, speed * 1000 + 50);

      if (api.getSetting('vib')) api.vibrate([8, 20, 8, 20, 8]);
    }

    /* 5. Ловим тап по клавиатуре */
    if (keysEl) {
      keysEl.addEventListener('pointerdown', e => {
        const btn = e.target.closest('.k');
        if (btn) animateButton(btn);
      }, { passive: true });
    }

    /* 6. Реакция на программные нажатия через хук ядра */
    api.on('calc:press', () => {
      if (!api.getSetting('jump')) return;
      const k = document.getElementById('keys');
      if (!k) return;
      k.animate(
        [{ transform: 'translateY(0)' },
         { transform: 'translateY(-4px)' },
         { transform: 'translateY(0)' }],
        { duration: 250, easing: 'ease-out' }
      );
    });

    api.toast('🎢 Кнопки теперь прыгают!');
  },

  onUnload(){
    document.querySelectorAll('.k.funky').forEach(b => {
      b.classList.remove('funky', 'funky-jump', 'funky-spin', 'funky-wiggle');
      b.style.animationDuration = '';
    });
  }
});
```

---

🎁 ЧТО ЕЩЁ МОЖНО СОБРАТЬ

Идеи для плагинов:

· 💱 Курс валют — кнопка пересчитывает в рубли/доллары
· 📊 График функции — своя вкладка с холстом
· 📝 Заметки — записи в api.store
· 🎮 Угадай число — игра во вкладке
· 🤖 AI-репетитор — задача → GigaChat → разбор
· 📚 ГДЗ — база заданий по классам и учебникам
· 🎨 Темы — неон, матрица, киберпанк
· 🔔 Напоминания — реакция на resume / pause
· 🧮 Инженерный пакет — fact, fib, gcd, константы
· 🌍 Переводчик — длинный тап по результату

---

📌 ШПАРГАЛКА

```js
registerPlugin({
  id, name, description, version, apiVersion, author, icon,
  settings: { /* поля */ },
  requires: ['другой-id'],      // опционально
  permissions: ['network'],     // опционально

  onLoad(api) {
    /* кнопки и функции */
    api.addButton({ label, onClick, insert });
    api.addFunction('имя', x => ...);
    api.addConstant('имя', число);

    /* вкладки */
    api.addPage({ id, title, icon, render, onShow, onHide });
    api.openPage(id); api.removePage(id);

    /* формула */
    api.insert(s); api.getExpr(); api.setExpr(s); api.getResult();

    /* хранилище */
    api.store.get/set/remove/keys/clear;

    /* настройки */
    api.getSetting(k); api.setSetting(k,v); api.onSettingsChange(fn);

    /* события */
    api.on(event, fn); api.off(event, fn); api.emit(event, data);

    /* UI */
    api.ui.card/button/toggle/input/select/list/modal/overlay/notify/el;

    /* сеть */
    await api.fetch / fetchJSON / fetchText;

    /* эффекты */
    api.vibrate(ms); api.beep(f, d, t); api.toast(text); api.notify({});

    /* внешний вид */
    api.registerTheme({id,name,light,dark});
    api.setTheme(id);
    api.injectCSS(css);
    api.addResultAction({label, onClick});

    /* разное */
    api.log(...); api.warn(...); api.error(...); api.i18n({...});
  },

  onUnload() { /* очистка */ }
});
```

Готово. Копируй пример, меняй id, name, добавляй кнопки и вкладки. Если что-то не работает — открой консоль, там увидишь ошибку с префиксом [твой-id].