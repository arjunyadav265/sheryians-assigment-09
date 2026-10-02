import { $, $$, make, icon, uid, KEY, Bus } from './utils.js';
import { Store } from './storage.js';
import { Toast } from './toast.js';
import { Nav } from './nav.js';

export const Todo = {
  form: null,
  input: null,
  list: null,
  empty: null,
  counter: null,
  error: null,
  filters: null,
  tasks: [],
  filter: 'all',

  init() {
    this.form = $('#todo-form');
    this.input = $('#todo-input');
    this.list = $('#todo-list');
    this.empty = $('#todo-empty');
    this.counter = $('#todo-counter');
    this.error = $('#todo-error');
    this.filters = $('#todo-filters');

    this.tasks = Store.read(KEY.todos, []);
    if (!Array.isArray(this.tasks)) this.tasks = [];
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

      const action = button.dataset.action;
      if (action === 'toggle') this.toggle(row.dataset.id);
      if (action === 'important') this.star(row.dataset.id);
      if (action === 'delete') this.remove(row.dataset.id);
      if (action === 'edit') this.startEdit(row.dataset.id);
    });

    this.list.addEventListener('keydown', (event) => {
      const field = event.target.closest('.todo__edit');
      if (!field) return;
      if (event.key === 'Enter') {
        event.preventDefault();
        this.commitEdit(field.dataset.id, field.value);
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        this.render();
      }
    });

    this.filters.addEventListener('click', (event) => {
      const chip = event.target.closest('[data-filter], [data-action]');
      if (!chip) return;
      if (chip.dataset.action === 'clear-done') return this.clearDone();

      this.filter = chip.dataset.filter;
      $$('.chip', this.filters).forEach((c) => c.classList.toggle('is-active', c === chip));
      this.render();
    });

    Nav.onOpen('todo', () => this.render());
  },

  add(raw) {
    const text = String(raw == null ? '' : raw).trim();
    if (!text) {
      this.error.hidden = false;
      this.input.focus();
      return;
    }

    this.error.hidden = true;
    this.tasks.push({ id: uid(), text, important: false, completed: false, createdAt: Date.now() });
    this.save();
    this.input.value = '';
    this.render();
  },

  toggle(id) {
    const task = this.tasks.find((t) => t.id === id);
    if (!task) return;
    task.completed = !task.completed;
    this.save();
    this.render();
  },

  star(id) {
    const task = this.tasks.find((t) => t.id === id);
    if (!task) return;
    task.important = !task.important;
    this.save();
    this.render();
  },

  remove(id) {
    if (!this.tasks.some((t) => t.id === id)) return;

    const row = this.list.querySelector(`[data-id="${id}"]`);
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      this.tasks = this.tasks.filter((t) => t.id !== id);
      this.save();
      this.render();
    };

    if (!row) return finish();

    row.classList.add('is-removing');
    row.addEventListener('animationend', finish, { once: true });
    setTimeout(finish, 280);
  },

  clearDone() {
    const removed = this.tasks.filter((t) => t.completed).length;
    if (!removed) return Toast.show('No completed tasks to clear.', 'info', 2000);

    this.tasks = this.tasks.filter((t) => !t.completed);
    this.save();
    this.render();
    Toast.show(`Cleared ${removed} completed task${removed > 1 ? 's' : ''}.`, 'success');
  },

  startEdit(id) {
    const task = this.tasks.find((t) => t.id === id);
    if (!task) return;

    const label = this.list.querySelector(`[data-id="${id}"] .todo__text`);
    const field = make('input', {
      class: 'todo__edit',
      type: 'text',
      value: task.text,
      maxlength: '160',
      'aria-label': 'Edit task',
      dataset: { id }
    });

    label.replaceWith(field);
    field.focus();
    field.select();
  },

  commitEdit(id, value) {
    const text = String(value).trim();
    const task = this.tasks.find((t) => t.id === id);
    if (!task) return this.render();
    if (!text) {
      this.error.hidden = false;
      return;
    }

    task.text = text;
    this.error.hidden = true;
    this.save();
    this.render();
  },

  save() {
    Store.write(KEY.todos, this.tasks);
    Bus.emit('data:changed');
  },

  visible() {
    if (this.filter === 'active') return this.tasks.filter((t) => !t.completed);
    if (this.filter === 'done') return this.tasks.filter((t) => t.completed);
    return this.tasks;
  },

  render() {
    const items = this.visible();
    this.list.replaceChildren(...items.map((task) => this.row(task)));
    this.empty.hidden = items.length > 0;

    const done = this.tasks.filter((t) => t.completed).length;
    this.counter.textContent = `${done} of ${this.tasks.length} completed`;
  },

  row(task) {
    const node = make('li', {
      class: `todo${task.completed ? ' is-done' : ''}${task.important ? ' is-important' : ''}`,
      dataset: { id: task.id }
    });

    const label = task.completed ? 'Mark as active' : 'Mark as complete';
    const starLabel = task.important ? 'Remove importance' : 'Mark as important';

    node.append(
      make('button', {
        class: 'todo__check',
        type: 'button',
        title: label,
        'aria-pressed': String(task.completed),
        'aria-label': label,
        dataset: { action: 'toggle' }
      }, icon('i-check')),

      make('span', { class: 'todo__text', text: task.text }),

      make('span', { class: 'todo__actions' }, [
        make('button', {
          class: `icon-btn icon-btn--star${task.important ? ' is-on' : ''}`,
          type: 'button',
          title: starLabel,
          'aria-pressed': String(task.important),
          'aria-label': starLabel,
          dataset: { action: 'important' }
        }, icon('i-star')),

        make('button', {
          class: 'icon-btn',
          type: 'button',
          title: 'Edit task',
          'aria-label': 'Edit task',
          dataset: { action: 'edit' }
        }, icon('i-edit')),

        make('button', {
          class: 'icon-btn icon-btn--danger',
          type: 'button',
          title: 'Delete task',
          'aria-label': 'Delete task',
          dataset: { action: 'delete' }
        }, icon('i-trash'))
      ])
    );

    return node;
  }
};