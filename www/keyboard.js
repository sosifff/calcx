/* CalcX desktop keyboard support — preserves the existing calculator API. */
(function () {
  'use strict';
  const keyMap = { '*': '×', '/': '÷', '-': '−', 'Enter': '=', '=': '=', 'Backspace': '⌫', 'Delete': 'AC', 'Escape': 'AC', 'p': 'π' };
  document.addEventListener('keydown', function (event) {
    if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
    const target = event.target;
    if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
    const page = document.querySelector('#p-calc');
    if (!page || !page.classList.contains('on')) return;
    const key = event.key;
    const mapped = Object.prototype.hasOwnProperty.call(keyMap, key) ? keyMap[key] : (/^[0-9.+%()]$/.test(key) ? key : null);
    if (mapped === null) return;
    event.preventDefault();
    const button = Array.from(document.querySelectorAll('#keys .k, #extra button')).find(b => b.dataset.k === mapped);
    if (button) { button.click(); return; }
    // Parentheses are handled by the calculator's combined parentheses key.
    if (key === '(' || key === ')') {
      const parens = document.querySelector('#keys [data-k="()"]');
      if (parens) parens.click();
    }
  });
})();
