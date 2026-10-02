import { $, $$ } from './utils.js';

export const Nav = {
  features: {
    todo: { title: 'Todo List', panel: '[data-panel="todo"]' },
    planner: { title: 'Daily Planner', panel: '[data-panel="planner"]' },
    goals: { title: 'Daily Goals', panel: '[data-panel="goals"]' },
    pomodoro: { title: 'Pomodoro Timer', panel: '[data-panel="pomodoro"]' },
    quote: { title: 'Motivation', panel: '[data-panel="quote"]' }
  },
  dashboard: null,
  featureView: null,
  titleEl: null,
  active: null,
  locked: false,
  hooks: {},

  init() {
    this.dashboard = $('#dashboard-view');
    this.featureView = $('#feature-view');
    this.titleEl = $('#feature-title');

    $('#cards').addEventListener('click', (event) => {
      const card = event.target.closest('[data-feature]');
      if (card) this.open(card.dataset.feature);
    });

    $('#feature-back').addEventListener('click', () => this.close());
    $('#mini-quote-open').addEventListener('click', () => this.open('quote'));

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.active) this.close();
    });
  },

  onOpen(key, fn) {
    this.hooks[key] = fn;
  },

  open(key) {
    if (this.locked) return;
    const feature = this.features[key];
    if (!feature || this.active === key) return;

    this.locked = true;
    this.active = key;

    $$('.panel', this.featureView).forEach((panel) => { panel.hidden = true; });
    $(feature.panel, this.featureView).hidden = false;
    this.titleEl.textContent = feature.title;
    this.dashboard.hidden = true;
    this.featureView.hidden = false;
    this.featureView.scrollIntoView({ block: 'start', behavior: 'smooth' });

    $$('#cards [data-feature]').forEach((card) => {
      card.setAttribute('aria-current', String(card.dataset.feature === key));
    });

    if (this.hooks[key]) this.hooks[key]();
    setTimeout(() => { this.locked = false; }, 260);
  },

  close() {
    if (!this.active) return;
    this.active = null;
    this.featureView.hidden = true;
    this.dashboard.hidden = false;
    const current = $('#cards [aria-current]');
    if (current) current.removeAttribute('aria-current');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};