// @author Kamil Piorkowski

import { $, $$, throttle } from './dom.js';

export function highlightActiveNav() {
  // Aktywny link zależy od body[data-page].
  const page = document.body.dataset.page || pageFromPath();
  $$('.nav-item').forEach((a) => {
    const target = a.dataset.page;
    if (!target) return;
    a.classList.toggle('active', target === page);
    if (target === page) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
}

function pageFromPath() {
  // Fallback dla stron bez data-page.
  const file = (window.location.pathname.split('/').pop() || 'strona-glowna.html').toLowerCase();
  if (!file || file === 'strona-glowna.html' || file === '') return 'dashboard';
  return file.replace(/\.html$/, '');
}

export function bindTopbarScroll() {
  // Po przewinięciu dodajemy cień do topbara.
  const topbar = $('.topbar');
  if (!topbar) return;
  const update = () => topbar.classList.toggle('is-scrolled', window.scrollY > 8);
  window.addEventListener('scroll', throttle(update, 16), { passive: true });
  update();
}
