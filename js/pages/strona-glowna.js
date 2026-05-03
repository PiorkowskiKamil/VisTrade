// @author Kamil Piorkowski

import { $ } from '../dom.js';
import { initTheme, bindThemeToggle } from '../motyw.js';

initTheme();

document.addEventListener('DOMContentLoaded', () => {
  bindThemeToggle($('#theme-toggle'));
});
