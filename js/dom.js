// @author Kamil Piorkowski

export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

export function el(tag, opts = {}) {
  // Mały helper do tworzenia elementów bez powtarzania createElement.
  const node = document.createElement(tag);
  if (opts.class) {
    const classes = Array.isArray(opts.class) ? opts.class : [opts.class];
    classes.filter(Boolean).forEach((c) => node.classList.add(c));
  }
  if (opts.attrs) {
    for (const [k, v] of Object.entries(opts.attrs)) {
      if (v === false || v == null) continue;
      node.setAttribute(k, v === true ? '' : String(v));
    }
  }
  if (opts.dataset) {
    for (const [k, v] of Object.entries(opts.dataset)) node.dataset[k] = v;
  }
  if (opts.text != null) node.textContent = opts.text;
  if (opts.children) opts.children.filter(Boolean).forEach((c) => node.append(c));
  if (opts.events) {
    for (const [evt, handler] of Object.entries(opts.events)) {
      node.addEventListener(evt, handler);
    }
  }
  return node;
}

export const t = (text) => document.createTextNode(text == null ? '' : String(text));

export function setText(node, text) { if (node) node.textContent = text; }

export function clear(node) {
  // Czyścimy element przed ponownym renderem.
  while (node && node.firstChild) node.removeChild(node.firstChild);
}

export function throttle(fn, wait = 100) {
  // Throttle przydaje się przy scrollu.
  let last = 0;
  let timer = null;
  return function throttled(...args) {
    const now = Date.now();
    const remaining = wait - (now - last);
    if (remaining <= 0) {
      if (timer) { clearTimeout(timer); timer = null; }
      last = now;
      fn.apply(this, args);
    } else if (!timer) {
      timer = setTimeout(() => {
        last = Date.now();
        timer = null;
        fn.apply(this, args);
      }, remaining);
    }
  };
}

export function debounce(fn, wait = 200) {
  // Debounce czeka, aż użytkownik przestanie pisać.
  let timer = null;
  return function debounced(...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), wait);
  };
}
