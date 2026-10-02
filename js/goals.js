import { $, make, icon, uid, todayKey, KEY, Bus } from './utils.js';
import { Store } from './storage.js';
import { Toast } from './toast.js';
import { Nav } from './nav.js';

export const Goals = {
  form: null,
  input: null,
  list: null,
  empty: null,
  fill: null,
  text: null,
  error: null,
  items: [],
  date: null,

  init() {
    this.form = $('#goal-form');
    this.input = $('#goal-input');
    this.list = $('#goal-list');
    this.empty = $('#goal-empty');
    this.fill = $('#goal-fill');
    this.text = $('#goal-text');
    this.error = $('#goal-error');

    this.load();
    this.render();

    this.form.addEventListener('submit', (event) => {
      event.preventDefault();
      this.add(this.input.value);
    });

    this.list.addEventListener('click', (event) => {
      const button = event.target.closest('[data-action]');
      if (!button) return;
      const row = button.closest('[data-id]');
      if (!row) return;

      if (button.dataset.action === 'toggle') this.toggle(row.dataset.id);
      if (button.dataset.action === 'delete') this.remove(row.dataset.id);
    });

    Nav.onOpen('goals', () => this.render());
  },

  load() {
    const stored = Store.read(KEY.goals, null);
    const today = todayKey();

    if (stored && stored.date === today && Array.isArray(stored.items)) {
      this.items = stored.items;
      this.date = today;
      return;
    }

    if (stored && stored.date && Array.isArray(stored.items) && stored.items.length) {
      const done = stored.items.filter((g) => g.done).length;
      Store.write('pd_goals_prev', { date: stored.date, total: stored.items.length, done });
      Toast.show(`New day! Yesterday: ${done} of ${stored.items.length} goals done.`, 'info', 4200);
    }

    this.items = [];
    this.date = today;
    this.save();
  },

  add(raw) {
    const text = String(raw == null ? '' : raw).trim();
    if (!text) {
      this.error.hidden = false;
      this.input.focus();
      return;
    }

    this.error.hidden = true;
    this.items.push({ id: uid(), text, done: false, createdAt: Date.now() });
    this.save();
    this.input.value = '';
    this.render();
  },

  toggle(id) {
    const goal = this.items.find((g) => g.id === id);
    if (!goal) return;
    goal.done = !goal.done;
    this.save();
    this.render();
  },

  remove(id) {
    this.items = this.items.filter((g) => g.id !== id);
    this.save();
    this.render();
  },

  save() {
    this.date = todayKey();
    Store.write(KEY.goals, { date: this.date, items: this.items });
    Bus.emit('data:changed');
  },

  render() {
    this.list.replaceChildren(...this.items.map((goal) => this.row(goal)));
    this.empty.hidden = this.items.length > 0;

    const done = this.items.filter((g) => g.done).length;
    const total = this.items.length;
    this.fill.style.width = `${total ? Math.round((done / total) * 100) : 0}%`;
    this.text.textContent = `${done} of ${total} completed`;
  },

  row(goal) {
    const label = goal.done ? `Mark "${goal.text}" as not done` : `Mark "${goal.text}" as done`;

    return make('li', { class: `goal${goal.done ? ' is-done' : ''}`, dataset: { id: goal.id } }, [
      make('button', {
        class: 'goal__dot',
        type: 'button',
        role: 'checkbox',
        'aria-checked': String(goal.done),
        'aria-label': label,
        dataset: { action: 'toggle' }
      }, icon('i-check')),

      make('span', { class: 'goal__text', text: goal.text }),

      make('button', {
        class: 'icon-btn icon-btn--danger',
        type: 'button',
        title: 'Delete goal',
        'aria-label': `Delete goal "${goal.text}"`,
        dataset: { action: 'delete' }
      }, icon('i-trash'))
    ]);
  }
};