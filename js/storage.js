import { Toast } from './toast.js';

export const Store = {
  read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (err) {
      console.warn(`Could not read "${key}"`, err);
      return fallback;
    }
  },

  write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.warn(`Could not save "${key}"`, err);
      Toast.show('Storage is full or blocked — changes will not persist.', 'warn');
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (err) {
      console.warn(`Could not remove "${key}"`, err);
    }
  }
};