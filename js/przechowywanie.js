// @author Kamil Piorkowski

export const KEYS = Object.freeze({
  // Wszystkie klucze localStorage trzymamy w jednym miejscu.
  TRADES: 'vt-trades',
  THEME: 'vt-theme',
  LAST_VIEW: 'vt-last-view',
  FX_CACHE: 'vt-fx-cache',
  SEEDED: 'vt-seeded',
  PAGE_SIZE: 'vt-page-size',
});

export function load(key, fallback = null) {
  // Przy błędzie zwracamy fallback, żeby aplikacja dalej działała.
  try {
    const raw = localStorage.getItem(key);

    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.warn('[storage] load failed for', key, err);
    return fallback;
  }
}

export function save(key, value) {
  // Zapisujemy jako JSON, więc można przechowywać tablice i obiekty.
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.warn('[storage] save failed for', key, err);
    return false;
  }
}

export function remove(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (err) {
    console.warn('[storage] remove failed for', key, err);
    return false;
  }
}

export function setCookie(name, value, daysValid = 365) {
  // Cookie jest używane głównie jako dodatkowy zapis motywu.
  const expires = new Date(Date.now() + daysValid * 86400000).toUTCString();

  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

export function getCookie(name) {
  const target = encodeURIComponent(name) + '=';
  const parts = document.cookie.split('; ');
  for (const p of parts) {
    if (p.startsWith(target)) {
      try { return decodeURIComponent(p.slice(target.length)); } catch { return null; }
    }
  }
  return null;
}
