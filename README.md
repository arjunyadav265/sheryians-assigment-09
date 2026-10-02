# Productivity Dashboard

A single-page productivity web app built with **core web technologies only** — no frameworks, no build step, no server code. It brings together several small daily-use tools into one dashboard so you can manage tasks, plan your day, stay motivated, track focus time and check the weather, all from one screen.

**Main objective:** practise DOM manipulation, event handling and browser storage by building multiple independent mini-features that work together inside one dashboard layout.

---

## Project structure

```
8 Asiggment/
├── index.html          Structure: dashboard + all feature sections (the skeleton)
├── style.css           Visual layer: layout, light/dark variables, responsive rules
├── script.js           All logic: navigation, events, Local Storage, APIs, timers
├── assets/
│   └── favicon.svg     App icon (also used by the Pomodoro notification)
└── README.md           This file
```

## How to run

Because the app uses `fetch()` against external APIs and reads `localStorage`, serve it over HTTP rather than opening the file directly.

```bash
# any static server works
python -m http.server 8777          # then open http://127.0.0.1:8777
# or
npx serve .
```

---

## The workflow

The app follows one repeating flow:

1. **Dashboard loads** — cards for each feature, plus always-visible Date & Time and Weather widgets.
2. **User selects a feature** — clicking a card opens it.
3. **Feature opens in full view** — the selected feature takes over the main view.
4. **User interacts with it** — adding tasks, starting a timer, marking goals complete…
5. **Data is stored or updated** — saved to Local Storage so it survives a refresh.
6. **User returns to the dashboard** — the back button (or `Esc`) brings them back.

`dashboard → feature → interact → save → return` repeats for every feature.

---

## Features

### 1. Dashboard Navigation
The home screen and traffic controller. A grid of clickable cards (icon + title + live badge) opens each feature in a full-screen container.

- One delegated click listener on `#cards` drives every card — no per-card logic.
- `Nav.open()` hides *all* panels before showing one, so two features can never overlap.
- A short lock flag ignores rapid repeat clicks on the same card.
- `Esc` closes the open feature from anywhere.

### 2. Todo List
- Add via the button or the Enter key (the input lives in a `<form>`).
- Empty input is validated before anything touches the DOM.
- Per-task **important**, **complete**, **edit** and **delete** controls.
- **Event delegation** on the list container — one listener handles every task, including ones added later.
- Filters: All / Active / Done, plus "Clear completed".
- Saved to Local Storage on every change, rebuilt on page load.

### 3. Daily Planner
- 19 hourly slots (05:00 → 23:00) generated in fixed order, so the list is always chronological.
- Saves as you type (debounced 400 ms) and flushes on `change` / `beforeunload`, so a refresh mid-sentence is harmless.
- Each slot can be cleared individually, or all at once.
- The **current hour is highlighted** using the Date Object and re-checked every minute.
- Empty slots stay blank — no `undefined` leaking into the UI.

### 4. Motivation Quote
- Fetches live via the **Fetch API** with a loading state, so the card is never blank.
- Parses JSON and updates the quote text, author, and the sidebar "Quote of the moment".
- **Error handling:** tries each endpoint in turn, then falls back to a built-in list of quotes and says so.
- The last quote is cached, so returning to the tab shows something instantly.
- Very long quotes are clamped to seven lines so the card stays readable.

### 5. Pomodoro Timer
- `25:00` work / `5:00` short break / `15:00` long break after every 4 sessions (all in seconds).
- **Start / Pause / Reset / Skip** with an animated SVG progress ring.
- `clearInterval()` runs before every new interval, so the timer can never run double speed.
- `MM:SS` formatting with leading zeros.
- On completion: a Web Audio chime, a desktop notification, a toast and focus minutes added to today's total.
- After a focus session it automatically rolls into the break (toggleable).
- Remaining time is derived from wall-clock time, so a sleeping laptop or throttled tab stays accurate.

### 6. Weather Widget
Always visible in the sidebar, using **Open-Meteo** (free, **no API key required**).

- Location order: browser geolocation → last city searched → a city guessed from the time zone → a default city.
- Location denial is handled gracefully rather than breaking the widget.
- Shows temperature, condition, feels-like, humidity, precipitation and wind.
- WMO weather codes are mapped to a description **and** a matching day/night icon.
- Loading and error states, a manual refresh button, free-text city search, and auto-refresh every 10 minutes.

### 7. Date & Time
- Formats the date (`weekday, day, month, year`) and a live 12-hour clock.
- Painted immediately on load, then updated every second.
- A single interval is guaranteed — `clearInterval()` before `setInterval()`.

### 8. Dynamic Background
- Four gradients tied to the hour: **night** (0–4, 21–23), **morning** (5–11), **afternoon** (12–16), **evening** (17–20) — all 24 hours covered with no gaps.
- Two background layers **cross-fade** so the change never flashes.
- Re-checked every minute in case the tab stays open across a boundary.
- A scrim layer keeps text readable on every background in both themes.

### 9. Theme Switch
- Light and dark palettes defined with **CSS Variables** on `[data-theme]`.
- The saved theme is applied by an inline `<head>` script **before first paint**, so there is no flash of the wrong theme.
- Every part of the UI responds — surfaces, borders, text, shadows, icons, glass blur and the background scrim.
- The toggle's `aria-pressed`, label and knob position stay in sync with the active theme.
- Falls back to `prefers-color-scheme` and keeps following the OS until the user picks manually.

### 10. Daily Goals
- Add goals via the button or Enter, with the same validation as the todo list.
- Checkbox-style toggle and delete, both handled by delegation.
- Progress bar plus an accurate "2 of 5 completed" counter, recalculated on every add, remove or toggle.
- Goals belong to a day: the stored payload carries its date, so a new day starts a fresh list automatically (yesterday's result is summarised in a toast).

---

## Browser features used

| Feature | Where |
|---|---|
| **Local Storage** | `Store` wrapper → todo tasks, planner entries, daily goals, theme, focus minutes, last city, last quote |
| **Fetch API** | `Quotes` and `Weather`, with `AbortController` timeouts |
| **setInterval / clearInterval** | Pomodoro countdown, live clock, current-hour highlight, background re-check |
| **Date Object** | Clock formatting, greeting, background category, current planner hour, daily goal reset |
| **Event delegation** | Feature cards, todo list, goal list, planner container |
| **CSS Variables** | Both themes, swapped by a `data-theme` attribute |
| **Web Audio / Notifications API** | Pomodoro end-of-session chime and desktop notification |
| **Geolocation API** | Weather location, with timeout and a denial fallback |

## Robustness details

- Every `localStorage` call is wrapped in `try/catch`, so private mode or a full quota shows a toast instead of breaking the page.
- Every `fetch` has an `AbortController` timeout — the UI can never hang forever.
- `Storage` keys are namespaced (`pd_*`) so they cannot clash with anything else on the origin.
- `prefers-reduced-motion` is respected, and a print stylesheet strips the decoration.

## Keyboard & accessibility

- Skip link to main content, visible on focus.
- Visible `:focus-visible` rings throughout.
- `aria-pressed` on toggles, `aria-current` on the active card, `aria-live` for toasts and status text.
- Escape closes an open feature.