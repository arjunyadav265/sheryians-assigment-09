import { Toast } from './toast.js';
import { Theme } from './theme.js';
import { Background } from './background.js';
import { Clock } from './clock.js';
import { Nav } from './nav.js';
import { Todo } from './todo.js';
import { Planner } from './planner.js';
import { Goals } from './goals.js';
import { Pomodoro } from './pomodoro.js';
import { Quotes } from './quotes.js';
import { Weather } from './weather.js';
import { Stats } from './stats.js';

document.addEventListener('DOMContentLoaded', () => {
  Toast.init();
  Theme.init();
  Background.init();
  Clock.init();
  Nav.init();
  Todo.init();
  Planner.init();
  Goals.init();
  Pomodoro.init();
  Quotes.init();
  Weather.init();
  Stats.init();
});