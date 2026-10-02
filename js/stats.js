import { $, todayKey, KEY, Bus } from './utils.js';
import { Store } from './storage.js';

export const Stats = {
  init() {
    Bus.on('data:changed', () => this.refresh());
    window.addEventListener('focus', () => this.refresh());
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) this.refresh();
    });
    this.refresh();
  },

  refresh() {
    const tasks = Store.read(KEY.todos, []);
    const goalsData = Store.read(KEY.goals, { date: todayKey(), items: [] });
    const goals = goalsData.date === todayKey() && Array.isArray(goalsData.items) ? goalsData.items : [];
    const focus = Store.read(KEY.focus, { date: todayKey(), minutes: 0 });
    const plan = Store.read(KEY.plan, {});
    const pomo = Store.read(KEY.pomo, { completed: 0 });

    const filled = Object.values(plan).filter((t) => typeof t === 'string' && t.trim()).length;

    $('#stat-tasks').textContent = `${tasks.filter((t) => t.completed).length}/${tasks.length}`;
    $('#stat-goals').textContent = `${goals.filter((g) => g.done).length}/${goals.length}`;
    $('#stat-focus').textContent = `${focus.date === todayKey() ? focus.minutes : 0}m`;
    $('#stat-plan').textContent = String(filled);

    const badges = {
      todo: tasks.filter((t) => !t.completed).length,
      planner: filled,
      goals: goals.filter((g) => !g.done).length,
      pomodoro: pomo?.completed || 0
    };

    for (const [key, value] of Object.entries(badges)) {
      const badge = $(`.card__badge[data-bind="${key}"]`);
      if (badge) badge.textContent = String(value);
    }
  }
};