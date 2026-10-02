import { $$, $ } from './utils.js';

export const Background = {
  ranges: [
    { key: 'night', label: 'Night', from: 0, to: 4 },
    { key: 'morning', label: 'Morning', from: 5, to: 11 },
    { key: 'afternoon', label: 'Afternoon', from: 12, to: 16 },
    { key: 'evening', label: 'Evening', from: 17, to: 20 },
    { key: 'night', label: 'Night', from: 21, to: 23 }
  ],
  layers: [],
  currentKey: null,
  timer: null,

  init() {
    this.layers = $$('.bg__layer');
    this.apply();
    this.timer = setInterval(() => this.apply(), 60000);
  },

  resolve(hour) {
    return this.ranges.find((r) => hour >= r.from && hour <= r.to) || this.ranges[0];
  },

  apply() {
    const { key, label } = this.resolve(new Date().getHours());
    if (key === this.currentKey) return;

    const active = this.layers.find((l) => l.classList.contains('is-active')) || this.layers[0];
    const idle = this.layers.find((l) => l !== active);

    idle.dataset.bg = key;
    void idle.offsetWidth;
    idle.classList.add('is-active');
    active.classList.remove('is-active');
    this.currentKey = key;

    const readout = $('#bg-label');
    if (readout) readout.textContent = `${label} background`;
  }
};