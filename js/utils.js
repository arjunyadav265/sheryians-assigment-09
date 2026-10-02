export const $ = (sel, scope = document) => scope.querySelector(sel);
export const $$ = (sel, scope = document) => Array.from(scope.querySelectorAll(sel));

export function make(tag, props = {}, kids = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (key.startsWith('on')) node.addEventListener(key.slice(2).toLowerCase(), value);
    else if (value === true) node.setAttribute(key, '');
    else if (value !== false && value != null) node.setAttribute(key, value);
  }
  for (const kid of (Array.isArray(kids) ? kids : [kids])) {
    if (kid != null) node.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return node;
}

export function icon(name) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'icon');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', '#' + name);
  svg.append(use);
  return svg;
}

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
export const pad = (n) => String(n).padStart(2, '0');
export const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

export function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function debounce(fn, ms) {
  let timer = null;
  const wrapped = (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
  wrapped.flush = (...args) => {
    clearTimeout(timer);
    fn(...args);
  };
  return wrapped;
}

export const KEY = {
  theme: 'pd_theme',
  todos: 'pd_todos',
  plan: 'pd_plan',
  goals: 'pd_goals',
  focus: 'pd_focus',
  pomo: 'pd_pomodoro',
  city: 'pd_city',
  quote: 'pd_quote'
};

export const Bus = {
  handlers: {},
  on(name, fn) {
    if (!this.handlers[name]) this.handlers[name] = [];
    this.handlers[name].push(fn);
  },
  emit(name, payload) {
    for (const fn of this.handlers[name] || []) fn(payload);
  }
};

export async function getJSON(url, timeoutMs = 9000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}