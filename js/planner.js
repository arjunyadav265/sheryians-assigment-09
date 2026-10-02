import { $, $$, make, icon, pad, debounce, KEY, Bus } from './utils.js';
import { Store } from './storage.js';
import { Toast } from './toast.js';
import { Nav } from './nav.js';
import { CONFIG } from './config.js';

export const Planner = {
  container: null,
  counter: null,
  plan: {},
  inputs: {},
  timer: null,

  init() {
    this.container = $('#planner-slots');
    this.counter = $('#planner-counter');

    this.plan = Store.read(KEY.plan, {});
    if (!this.plan || typeof this.plan !== 'object') this.plan = {};

    this.render();
    this.highlightNow();
    clearInterval(this.timer);
    this.timer = setInterval(() => this.highlightNow(), 60000);

    const save = debounce(() => this.save(), CONFIG.planner.saveDebounce);

    this.container.addEventListener('input', (event) => {
      const field = event.target.closest('.slot__input');
      if (!field) return;
      this.plan[field.dataset.hour] = field.value;
      this.updateCounter();
      save();
    });

    this.container.addEventListener('change', (event) => {
      if (event.target.closest('.slot__input')) save.flush();
    });

    this.container.addEventListener('click', (event) => {
      const button = event.target.closest('[data-clear-hour]');
      if (!button) return;
      const hour = button.dataset.clearHour;
      delete this.plan[hour];
      if (this.inputs[hour]) this.inputs[hour].value = '';
      this.updateCounter();
      this.save();
      Toast.show(`Cleared ${this.hourLabel(hour)}.`, 'info', 1800);
    });

    window.addEventListener('beforeunload', () => this.save());
    $('#planner-clear').addEventListener('click', () => this.clearAll());

    Nav.onOpen('planner', () => this.highlightNow());
  },

  hours() {
    const out = [];
    for (let h = CONFIG.planner.startHour; h <= CONFIG.planner.endHour; h++) out.push(h);
    return out;
  },

  save() {
    Store.write(KEY.plan, this.plan);
    Bus.emit('data:changed');
  },

  hourLabel(hour) {
    const h = Number(hour);
    return `${pad(h % 12 === 0 ? 12 : h % 12)}:00 ${h < 12 ? 'AM' : 'PM'}`;
  },

  render() {
    this.inputs = {};

    const slots = this.hours().map((hour) => {
      const key = String(hour);
      const value = typeof this.plan[key] === 'string' ? this.plan[key] : '';

      const input = make('textarea', {
        class: 'slot__input',
        rows: '1',
        placeholder: 'Add a plan…',
        'aria-label': `Plan for ${this.hourLabel(key)}`,
        dataset: { hour: key }
      }, value);

      input.value = value;
      this.inputs[key] = input;

      const clearLabel = `Clear ${this.hourLabel(hour)}`;

      return make('div', { class: 'slot', dataset: { hour: key } }, [
        make('span', { class: 'slot__time', text: this.hourLabel(hour) }),
        input,
        make('button', {
          class: 'icon-btn icon-btn--danger slot__clear',
          type: 'button',
          title: clearLabel,
          'aria-label': clearLabel,
          dataset: { clearHour: key }
        }, icon('i-close'))
      ]);
    });

    this.container.replaceChildren(...slots);
    this.updateCounter();
    this.highlightNow();
  },

  highlightNow() {
    const hour = String(new Date().getHours());
    $$('.slot', this.container).forEach((slot) => {
      slot.classList.toggle('is-now', slot.dataset.hour === hour);
    });
  },

  updateCounter() {
    const filled = Object.values(this.plan).filter((t) => typeof t === 'string' && t.trim()).length;
    this.counter.textContent = `${filled} of ${this.hours().length} slots filled`;
  },

  clearAll() {
    const filled = Object.values(this.plan).filter((t) => t && t.trim()).length;
    if (!filled) return Toast.show('The planner is already empty.', 'info', 2000);
    if (!window.confirm(`Clear all ${filled} planned slot${filled > 1 ? 's' : ''}?`)) return;

    this.plan = {};
    this.render();
    this.save();
    Toast.show('Planner cleared.', 'success');
  }
};