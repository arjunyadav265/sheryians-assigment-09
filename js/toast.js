import { $, make, icon } from './utils.js';

export const Toast = {
  stack: null,

  init() {
    this.stack = $('#toast-stack');
  },

  show(message, type = 'info', ms = 3200) {
    if (!this.stack) return;

    const glyph = { success: 'i-check', warn: 'i-close', info: 'i-bolt' }[type] || 'i-bolt';
    const node = make('div', { class: `toast toast--${type}` }, [icon(glyph), make('span', { text: message })]);

    this.stack.append(node);
    setTimeout(() => {
      node.classList.add('is-out');
      node.addEventListener('animationend', () => node.remove(), { once: true });
    }, ms);
  }
};