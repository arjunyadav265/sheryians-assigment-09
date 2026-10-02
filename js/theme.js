import { $, KEY } from './utils.js';
import { Store } from './storage.js';
import { Toast } from './toast.js';

export const Theme = {
  button: null,
  label: null,

  init() {
    this.button = $('#theme-toggle');
    this.label = $('#theme-label');
    this.sync(this.current());

    this.button.addEventListener('click', () => {
      const next = this.current() === 'dark' ? 'light' : 'dark';
      this.apply(next);
      Store.write(KEY.theme, next);
      Toast.show(`${next === 'dark' ? 'Dark' : 'Light'} theme enabled`, 'info', 1800);
    });

    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (event) => {
        if (Store.read(KEY.theme, null) === null) this.apply(event.matches ? 'light' : 'dark');
      });
    }
  },

  current() {
    return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  },

  apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    this.sync(theme);
  },

  sync(theme) {
    if (!this.button) return;
    this.button.setAttribute('aria-pressed', String(theme === 'dark'));
    this.button.title = `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`;
    if (this.label) this.label.textContent = theme === 'dark' ? 'Dark' : 'Light';
  }
};