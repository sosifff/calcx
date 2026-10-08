*** Begin Patch
*** Update File: www/app.js
@@
-const API_VERSION = '3.0';
+const API_VERSION = '4.0';
@@
-    ui: UI,
+    app: {
+      createPage: o => addPage(Object.assign({}, o, { _pluginId: id })),
+      open: pid => openPluginView(pid),
+      close: () => go('calc'),
+      setTitle: title => { const e = $('#pv-title'); if (e) e.textContent = String(title); },
+      getSize: () => ({ width: window.innerWidth, height: window.innerHeight }),
+      fullscreen: async on => {
+        try {
+          if (on) {
+            if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
+          } else if (document.exitFullscreen) {
+            await document.exitFullscreen();
+          }
+          return true;
+        } catch (e) {
+          return false;
+        }
+      }
+    },
+
+    calc: {
+      evaluate: s => ev(String(s)),
+      getExpression: () => expr,
+      setExpression: s => { expr = String(s); done = false; upd(); },
+      insert: s => ins(String(s)),
+      registerFunction: (n, f) => apiObj.addFunction(n, f),
+      registerConstant: (n, v) => apiObj.addConstant(n, v),
+      addButton: o => apiObj.addButton(o)
+    },
+
+    storage: {
+      get: (k, d) => store.get(k, d),
+      set: (k, v) => store.set(k, v),
+      remove: k => store.del(k),
+      clear: () => store.clear(),
+      keys: () => store.keys(),
+      has: k => store.has(k)
+    },
+
+    events: {
+      on: (event, fn) => apiObj.on(event, fn),
+      off: (event, fn) => apiObj.off(event, fn),
+      emit: (event, data) => apiObj.emit(event, data)
+    },
+
+    timer: {
+      setTimeout: (fn, ms) => setTimeout(fn, ms),
+      setInterval: (fn, ms) => setInterval(fn, ms),
+      clearTimeout: h => clearTimeout(h),
+      clearInterval: h => clearInterval(h),
+      requestAnimationFrame: fn => requestAnimationFrame(fn),
+      cancelAnimationFrame: h => cancelAnimationFrame(h)
+    },
+
+    clipboard: {
+      readText: async () => navigator.clipboard ? navigator.clipboard.readText() : '',
+      writeText: async text => {
+        if (!navigator.clipboard) throw new Error('clipboard unavailable');
+        return navigator.clipboard.writeText(String(text));
+      }
+    },
+
+    device: {
+      get platform() {
+        return window.Capacitor && window.Capacitor.getPlatform
+          ? window.Capacitor.getPlatform()
+          : 'web';
+      },
+      get online() { return navigator.onLine; },
+      get language() { return navigator.language || 'en'; },
+      get screen() {
+        return {
+          width: screen.width,
+          height: screen.height,
+          pixelRatio: devicePixelRatio || 1
+        };
+      }
+    },
+
+    native: {
+      vibrate: m => vib(m),
+      toast: m => toast(m),
+      share: async data => navigator.share ? navigator.share(data || {}) : false,
+      openUrl: url => {
+        const u = String(url);
+        try {
+          const C = window.Capacitor;
+          if (C && C.Plugins && C.Plugins.App && C.Plugins.App.openUrl) {
+            return C.Plugins.App.openUrl({ url: u });
+          }
+        } catch (e) {}
+        window.open(u, '_blank', 'noopener,noreferrer');
+        return true;
+      }
+    },
+
+    lifecycle: {
+      on: (event, fn) => apiObj.on(event, fn),
+      off: (event, fn) => apiObj.off(event, fn)
+    },
+
+    theme: {
+      get: () => ({ mode: S.mode, hue: S.hue, pluginTheme: S.pluginTheme }),
+      setMode: mode => { S.mode = mode; saveS(); applyTheme(); },
+      setHue: hue => { S.hue = hue; saveS(); applyTheme(); sw(); },
+      set: tid => setTheme(tid),
+      list: () => Object.keys(THEMES)
+    },
+
+    permissions: {
+      has: name => {
+        const p = PL[id];
+        return !p || !p.permissions || p.permissions.indexOf(name) >= 0;
+      },
+      require: names => {
+        const list = Array.isArray(names) ? names : [names];
+        return list.every(name => apiObj.permissions.has(name));
+      }
+    },
+
+    network: {
+      fetch: (...args) => netFetch(...args),
+      json: (...args) => netFetchJSON(...args),
+      text: (...args) => netFetchText(...args)
+    },
+
+    ui: UI,
@@
-  description: 'Пример плагина на API 3.0',
+  description: 'Пример плагина на API 4.0',
@@
-  apiVersion: '3.0',
+  apiVersion: '4.0',
*** End Patch