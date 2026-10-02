import { $, KEY, getJSON } from './utils.js';
import { Store } from './storage.js';
import { Toast } from './toast.js';
import { CONFIG } from './config.js';

export const Weather = {
  codes: {
    0: ['Clear sky', '☀️', '🌙'],
    1: ['Mainly clear', '🌤️', '🌙'],
    2: ['Partly cloudy', '⛅', '☁️'],
    3: ['Overcast', '☁️', '☁️'],
    45: ['Fog', '🌫️', '🌫️'],
    48: ['Freezing fog', '🌫️', '🌫️'],
    51: ['Light drizzle', '🌦️', '🌦️'],
    53: ['Drizzle', '🌦️', '🌦️'],
    55: ['Heavy drizzle', '🌧️', '🌧️'],
    56: ['Freezing drizzle', '🌨️', '🌨️'],
    57: ['Freezing drizzle', '🌨️', '🌨️'],
    61: ['Light rain', '🌦️', '🌧️'],
    63: ['Rain', '🌧️', '🌧️'],
    65: ['Heavy rain', '🌧️', '🌧️'],
    66: ['Freezing rain', '🌨️', '🌨️'],
    67: ['Freezing rain', '🌨️', '🌨️'],
    71: ['Light snow', '🌳', '❄️'],
    73: ['Snow', '❄️', '❄️'],
    75: ['Heavy snow', '❄️', '❄️'],
    77: ['Snow grains', '❄️', '❄️'],
    80: ['Light showers', '🌦️', '🌧️'],
    81: ['Showers', '🌧️', '🌧️'],
    82: ['Violent showers', '⛈️', '⛈️'],
    85: ['Snow showers', '❄️', '❄️'],
    86: ['Heavy snow showers', '❄️', '❄️'],
    95: ['Thunderstorm', '⛈️', '⛈️'],
    96: ['Thunderstorm, hail', '⛈️', '⛈️'],
    99: ['Severe thunderstorm', '⛈️', '⛈️']
  },
  tzCities: {
    'Asia/Karachi': 'Karachi',
    'Asia/Kolkata': 'Kolkata',
    'Asia/Dhaka': 'Dhaka',
    'Asia/Dubai': 'Dubai',
    'Asia/Tokyo': 'Tokyo',
    'Asia/Singapore': 'Singapore',
    'Europe/London': 'London',
    'Europe/Paris': 'Paris',
    'Europe/Berlin': 'Berlin',
    'Europe/Madrid': 'Madrid',
    'Europe/Rome': 'Rome',
    'Europe/Moscow': 'Moscow',
    'America/New_York': 'New York',
    'America/Chicago': 'Chicago',
    'America/Denver': 'Denver',
    'America/Los_Angeles': 'Los Angeles',
    'America/Toronto': 'Toronto',
    'America/Sao_Paulo': 'São Paulo',
    'Australia/Sydney': 'Sydney',
    'Africa/Cairo': 'Cairo',
    'Africa/Lagos': 'Lagos',
    'Africa/Johannesburg': 'Johannesburg'
  },
  statusEl: null,
  timer: null,
  currentPlace: null,

  init() {
    this.statusEl = $('#weather-status');

    $('#weather-refresh').addEventListener('click', () => this.load(this.currentPlace));

    const search = $('#weather-search');
    search.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      this.searchCity(search.value);
    });
    search.addEventListener('search', () => this.searchCity(search.value));

    this.load();
    clearInterval(this.timer);
    this.timer = setInterval(() => this.load(this.currentPlace), CONFIG.weather.refreshMinutes * 60000);
  },

  locate() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);

      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => resolve(null),
        { timeout: CONFIG.weather.geoTimeoutMs, maximumAge: 600000 }
      );
    });
  },

  async nameFromCoords(lat, lon) {
    try {
      const url = `${CONFIG.weather.reverseGeocodeUrl}?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
      const data = await getJSON(url, 6000);
      return data.city || data.locality || data.principalSubdivision || 'Your location';
    } catch (err) {
      return 'Your location';
    }
  },

  timezoneCity() {
    try {
      return this.tzCities[Intl.DateTimeFormat().resolvedOptions().timeZone] || null;
    } catch (err) {
      return null;
    }
  },

  async geocode(name) {
    try {
      const url = `${CONFIG.weather.geocodeUrl}?name=${encodeURIComponent(name)}&count=1&language=en&format=json`;
      const data = await getJSON(url, CONFIG.weather.requestTimeoutMs);
      const hit = data?.results?.[0];
      return hit ? { name: hit.name, lat: hit.latitude, lon: hit.longitude } : null;
    } catch (err) {
      return null;
    }
  },

  describe(code, isDay) {
    const entry = this.codes[code] || ['Unknown', '🌡️', '🌡️'];
    return { label: entry[0], glyph: isDay ? entry[1] : entry[2] };
  },

  async searchCity(name) {
    const query = String(name ?? '').trim();
    if (query.length < 2) return;

    this.setStatus(`Searching for "${query}"…`);
    const place = await this.geocode(query);

    if (!place) return this.setStatus(`No city called "${query}" was found.`, true);

    Store.write(KEY.city, place);
    $('#weather-search').value = '';
    await this.load(place);
    Toast.show(`Showing weather for ${place.name}.`, 'success', 2400);
  },

  async load(place) {
    this.setStatus(place ? `Loading weather for ${place.name}…` : 'Detecting your location…');

    let target = place;

    if (!target) {
      const coords = await this.locate();

      if (coords) {
        target = {
          name: await this.nameFromCoords(coords.lat, coords.lon),
          lat: coords.lat,
          lon: coords.lon
        };
        Store.write(KEY.city, target);
      } else {
        const saved = Store.read(KEY.city, null);
        const guess = saved || this.timezoneCity() || CONFIG.weather.fallbackCity;
        target = await this.geocode(guess);

        if (!target) return this.setStatus('Could not find that location. Try searching for a city.', true);
      }
    }

    this.currentPlace = target;

    try {
      await this.fetchForecast(target);
    } catch (err) {
      console.warn('Weather request failed:', err.message);
      this.setStatus('Could not load weather. Tap the refresh button to try again.', true);
    }
  },

  async fetchForecast(place) {
    const url = `${CONFIG.weather.forecastUrl}?latitude=${place.lat}&longitude=${place.lon}` +
      '&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m' +
      '&timezone=auto';

    const data = await getJSON(url, CONFIG.weather.requestTimeoutMs);
    const now = data?.current;
    if (!now) throw new Error('Unexpected weather response');

    const { label, glyph } = this.describe(now.weather_code, now.is_day === 1);

    $('#weather-icon').textContent = glyph;
    $('#weather-temp').textContent = `${Math.round(now.temperature_2m)}°`;
    $('#weather-cond').textContent = label;
    $('#weather-city').textContent = place.name;
    $('#w-feels').textContent = `${Math.round(now.apparent_temperature)}°C`;
    $('#w-humidity').textContent = `${Math.round(now.relative_humidity_2m)}%`;
    $('#w-rain').textContent = `${(now.precipitation ?? 0).toFixed(1)} mm`;
    $('#w-wind').textContent = `${Math.round(now.wind_speed_10m)} km/h`;

    $('#weather-main').hidden = false;
    $('#weather-details').hidden = false;
    this.setStatus(`Updated ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
  },

  setStatus(message, isError) {
    this.statusEl.textContent = message;
    this.statusEl.classList.toggle('is-error', Boolean(isError));
  }
};