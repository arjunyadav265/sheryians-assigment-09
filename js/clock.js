import { $, pad } from './utils.js';

export const Clock = {
  timeEl: null,
  dateEl: null,
  subEl: null,
  heroEl: null,
  timer: null,

  init() {
    this.timeEl = $('#clock-time');
    this.dateEl = $('#clock-date');
    this.subEl = $('#greeting');
    this.heroEl = $('#hero-title');
    this.tick();
    clearInterval(this.timer);
    this.timer = setInterval(() => this.tick(), 1000);
  },

  tick() {
    const now = new Date();
    const hours24 = now.getHours();
    const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;

    this.timeEl.textContent = `${pad(hours12)}:${pad(now.getMinutes())}:${pad(now.getSeconds())} ${hours24 < 12 ? 'AM' : 'PM'}`;
    this.dateEl.textContent = now.toLocaleDateString(undefined, {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
    });

    let greeting = 'Good night';
    if (hours24 < 5) greeting = 'Working late';
    else if (hours24 < 12) greeting = 'Good morning';
    else if (hours24 < 17) greeting = 'Good afternoon';
    else if (hours24 < 21) greeting = 'Good evening';

    this.subEl.textContent = `${greeting} — let's get something done.`;
    if (this.heroEl) this.heroEl.textContent = `${greeting}. Here is your day at a glance.`;
  }
};