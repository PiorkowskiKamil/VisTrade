// @author Kamil Piorkowski

import { KEYS, load, save, setCookie, getCookie } from './przechowywanie.js';

const THEME_DARK = 'dark';
const THEME_LIGHT = 'light';

export function getCurrentTheme() {
  return document.documentElement.dataset.theme === 'light' ? THEME_LIGHT : THEME_DARK;
}

export function getInitialTheme() {
  // Kolejność: localStorage, cookie, ustawienia systemu, ciemny motyw.
  const fromStorage = load(KEYS.THEME);
  if (fromStorage === THEME_LIGHT || fromStorage === THEME_DARK) return fromStorage;

  const fromCookie = getCookie(KEYS.THEME);
  if (fromCookie === THEME_LIGHT || fromCookie === THEME_DARK) return fromCookie;

  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    return THEME_LIGHT;
  }
  return THEME_DARK;
}

export function applyTheme(theme) {
  // data-theme jest czytane przez CSS.
  const t = theme === THEME_LIGHT ? THEME_LIGHT : THEME_DARK;

  document.documentElement.dataset.theme = t === THEME_LIGHT ? THEME_LIGHT : '';
  save(KEYS.THEME, t);
  setCookie(KEYS.THEME, t, 365);

  document.dispatchEvent(new CustomEvent('vt:theme-change', { detail: { theme: t } }));
}

export function toggleTheme() {
  const next = getCurrentTheme() === THEME_LIGHT ? THEME_DARK : THEME_LIGHT;
  applyTheme(next);
  return next;
}

export function bindThemeToggle(button) {
  if (!button) return;
  const refresh = () => {
    // Ikona pokazuje motyw, na który można przełączyć stronę.
    const t = getCurrentTheme();
    const icon = button.querySelector('i');
    if (icon) {
      icon.className = t === THEME_LIGHT
        ? 'fa-solid fa-moon'
        : 'fa-solid fa-sun';
    }
    button.setAttribute('aria-label',
      t === THEME_LIGHT ? 'Przełącz na ciemny motyw' : 'Przełącz na jasny motyw');
    button.title = button.getAttribute('aria-label');
  };
  button.addEventListener('click', () => { toggleTheme(); refresh(); });
  document.addEventListener('vt:theme-change', refresh);
  refresh();
}

export function initTheme() {
  applyTheme(getInitialTheme());
}
