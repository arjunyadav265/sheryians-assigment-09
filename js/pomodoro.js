import { $, make, icon, pad, clamp, todayKey, KEY, Bus } from './utils.js';
import { Store } from './storage.js';
import { Toast } from './toast.js';
import { Nav } from './nav.js';
import { CONFIG } from './config.js';

export const Pomodoro = {
  modes: {
    work: { label: 'Work Session', seconds: () => CONFIG.pomodoro.work },
    short: { label: 'Short Break', seconds: () => CONFIG.pomodoro.shortBreak },
    long: { label: 'Long Break', seconds: () => CONFIG.pomodoro.longBreak }
  },
  mode: 'work',
  remaining: CONFIG.pomodoro.work,
  running: false,
  intervalId: null,
  deadline: null,
  completed: 0,
  autoStart: true,
  audio: null,
  ring: null,

  init() {
    const saved = Store.read(KEY.pomo, {});
    this.completed = Number.isFinite(saved?.completed) ? saved.completed : 0;
    this.autoStart = typeof saved?.autoStart === 'boolean' ? saved.autoStart : CONFIG.pomodoro.autoStart;

    $('#pomo-auto').checked = this.autoStart;
    this.ring = $('.pomo__ring');
    this.remaining = this.duration();

    $('#pomo-toggle').addEventListener('click', () => this.toggle());
    $('#pomo-reset').addEventListener('click', () => this.reset());
    $('#pomo-skip').addEventListener('click', () => this.skip());

    $('#pomo-auto').addEventListener('change', (event) => {
      this.autoStart = event.target.checked;
      this.save();
    });

    this.render();

    document.addEventListener('visibilitychange', () => {
      if (document.hidden || !this.deadline) return;
      const left = Math.round((this.deadline - Date.now()) / 1000);
      if (left <= 0) this.complete();
      else {
        this.remaining = left;
        this.render();
      }
    });

    Nav.onOpen('pomodoro', () => this.render());
  },

  duration() {
    return this.modes[this.mode].seconds();
  },

  save() {
    Store.write(KEY.pomo, { completed: this.completed, autoStart: this.autoStart });
    Bus.emit('data:changed');
  },

  toggle() {
    if (this.running) this.pause();
    else this.start();
  },

  start() {
    clearInterval(this.intervalId);
    this.unlockAudio();
    this.askNotify();

    this.running = true;
    this.deadline = Date.now() + this.remaining * 1000;

    this.intervalId = setInterval(() => {
      this.remaining = Math.round((this.deadline - Date.now()) / 1000);
      if (this.remaining <= 0) this.complete();
      else this.render();
    }, 250);

    this.render();
  },

  pause() {
    clearInterval(this.intervalId);
    this.intervalId = null;
    this.running = false;
    this.deadline = null;
    this.render();
  },

  reset() {
    this.pause();
    this.remaining = this.duration();
    this.render();
    Toast.show('Timer reset.', 'info', 1600);
  },

  skip() {
    this.pause();
    this.nextMode();
  },

  complete() {
    this.pause();
    const finished = this.mode;

    this.ring.classList.remove('is-done');
    void this.ring.offsetWidth;
    this.ring.classList.add('is-done');

    if (finished === 'work') {
      this.completed += 1;
      this.addFocus(Math.round(CONFIG.pomodoro.work / 60));
      this.save();
      this.beep();
      this.notify('Focus session complete', 'Time for a break. Well done!');
      Toast.show(`Focus session ${this.completed} complete — take a break.`, 'success', 5000);
    } else {
      this.beep();
      this.notify('Break over', 'Back to focus.');
      Toast.show('Break finished — back to work.', 'success', 4000);
    }

    this.nextMode();
    if (this.autoStart) this.start();
  },

  nextMode() {
    if (this.mode === 'work') {
      const after = CONFIG.pomodoro.longBreakAfter;
      this.mode = this.completed > 0 && this.completed % after === 0 ? 'long' : 'short';
    } else {
      this.mode = 'work';
    }
    this.remaining = this.duration();
    this.render();
  },

  unlockAudio() {
    if (this.audio) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) this.audio = new Ctx();
      this.audio?.resume?.().catch(() => {});
    } catch (err) {}
  },

  askNotify() {
    if (!CONFIG.pomodoro.notify || !('Notification' in window)) return;
    if (Notification.permission === 'default') Notification.requestPermission().catch(() => {});
  },

  beep() {
    if (!this.audio) return;
    [660, 784, 988].forEach((frequency, i) => {
      const osc = this.audio.createOscillator();
      const gain = this.audio.createGain();
      const at = this.audio.currentTime + i * 0.18;

      osc.type = 'sine';
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.22, at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.16);

      osc.connect(gain).connect(this.audio.destination);
      osc.start(at);
      osc.stop(at + 0.18);
    });
  },

  notify(title, body) {
    if (!CONFIG.pomodoro.notify || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    try {
      new Notification(title, { body, icon: 'assets/favicon.svg' });
    } catch (err) {}
  },

  addFocus(minutes) {
    const stored = Store.read(KEY.focus, { date: todayKey(), minutes: 0 });
    const fresh = stored.date === todayKey() ? stored : { date: todayKey(), minutes: 0 };
    fresh.minutes += minutes;
    Store.write(KEY.focus, fresh);
  },

  format(totalSeconds) {
    const safe = Math.max(0, totalSeconds);
    return `${pad(Math.floor(safe / 60))}:${pad(safe % 60)}`;
  },

  render() {
    const total = this.duration();
    const mode = this.modes[this.mode];

    $('#pomo-mode').textContent = mode.label;
    $('#pomo-mode').dataset.mode = this.mode;

    $('#pomo-time').textContent = this.format(this.remaining);
    $('#pomo-state').textContent = this.running ? 'Focusing' : this.remaining === total ? 'Ready' : 'Paused';

    const circumference = 2 * Math.PI * 88;
    const bar = $('#pomo-bar');
    bar.dataset.mode = this.mode;
    bar.style.strokeDasharray = circumference;
    bar.style.strokeDashoffset = circumference * (1 - clamp(this.remaining / total, 0, 1));

    const toggleLabel = this.running ? 'Pause' : this.remaining === total ? 'Start' : 'Resume';
    $('#pomo-toggle').replaceChildren(
      icon(this.running ? 'i-pause' : 'i-play'),
      make('span', { id: 'pomo-toggle-label', text: toggleLabel })
    );

    this.renderDots();
    document.title = this.running ? `${this.format(this.remaining)} · ${mode.label}` : 'Productivity Dashboard';
  },

  renderDots() {
    const after = CONFIG.pomodoro.longBreakAfter;
    const filled = this.completed === 0 ? 0 : this.completed % after || after;
    const dots = [];

    for (let i = 0; i < after; i++) {
      dots.push(make('span', { class: `pomo__dot${i < filled ? ' is-done' : ''}` }));
    }

    const host = $('#pomo-dots');
    host.replaceChildren(...dots);
    host.setAttribute('aria-label', `${this.completed} focus sessions completed`);
  }
};