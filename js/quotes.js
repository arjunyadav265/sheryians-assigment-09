import { $, make, icon, KEY, getJSON } from './utils.js';
import { Store } from './storage.js';
import { Toast } from './toast.js';
import { Nav } from './nav.js';
import { CONFIG } from './config.js';

export const Quotes = {
  textEl: null,
  authorEl: null,
  statusEl: null,
  button: null,
  miniText: null,
  miniAuthor: null,
  busy: false,

  init() {
    this.textEl = $('#quote-text');
    this.authorEl = $('#quote-author');
    this.statusEl = $('#quote-status');
    this.button = $('#quote-btn');
    this.miniText = $('#mini-quote-text');
    this.miniAuthor = $('#mini-quote-author');

    const cached = Store.read(KEY.quote, null);
    if (cached?.text) this.paint(cached, 'Cached quote');

    this.button.addEventListener('click', () => this.load());

    Nav.onOpen('quote', () => {
      if (!this.textEl.textContent || this.textEl.classList.contains('is-loading')) this.load();
    });

    this.load();
  },

  paint(quote, status) {
    const text = String(quote.text ?? '').trim();
    if (!text) return;

    const author = String(quote.author ?? '').trim() || 'Unknown';

    this.textEl.textContent = text;
    this.textEl.classList.remove('is-loading');
    this.authorEl.textContent = `— ${author}`;
    this.statusEl.textContent = status;

    this.miniText.textContent = text;
    this.miniAuthor.textContent = `— ${author}`;

    Store.write(KEY.quote, { text, author });
  },

  setLoading(loading) {
    this.busy = loading;
    this.button.disabled = loading;
    this.button.replaceChildren(icon('i-refresh'), make('span', { text: loading ? 'Loading…' : 'New quote' }));
    this.statusEl.textContent = loading ? 'Fetching a quote…' : '';
  },

  async load() {
    if (this.busy) return;

    this.textEl.classList.add('is-loading');
    this.textEl.textContent = 'Loading a quote…';
    this.authorEl.textContent = '—';
    this.setLoading(true);

    for (const endpoint of CONFIG.quotes.endpoints) {
      try {
        const quote = endpoint.map(await getJSON(endpoint.url, CONFIG.quotes.requestTimeoutMs));
        if (quote?.text) {
          this.setLoading(false);
          this.paint(quote, 'Live from the quote API');
          return;
        }
      } catch (err) {
        console.warn('Quote endpoint failed:', endpoint.url, err.message);
      }
    }

    const pool = CONFIG.quotes.fallback;
    this.setLoading(false);
    this.paint(pool[Math.floor(Math.random() * pool.length)], 'Offline — showing a saved quote');
    Toast.show('Could not reach the quote API. Using a saved quote.', 'warn', 4000);
  }
};