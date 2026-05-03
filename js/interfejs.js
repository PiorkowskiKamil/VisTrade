// @author Kamil Piorkowski

import { $, $$, el, clear } from './dom.js';

/* Modal */

const MODAL_BACKDROP_ID = 'vt-modal-backdrop';
let activeModalDone = null;

function ensureBackdrop() {
  // Tworzymy backdrop tylko raz i potem go używamy ponownie.
  let bd = document.getElementById(MODAL_BACKDROP_ID);
  if (bd) return bd;

  bd = el('div', { class: 'modal-backdrop', attrs: { id: MODAL_BACKDROP_ID } });
  document.body.appendChild(bd);

  bd.addEventListener('click', (e) => { if (e.target === bd) closeModal(); });

  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && bd.classList.contains('open')) closeModal(); });
  return bd;
}

export function openModal(opts) {
  // Modal zwraca Promise, więc kod może czekać na wybór użytkownika.
  const bd = ensureBackdrop();
  clear(bd);

  return new Promise((resolve) => {
    let finished = false;
    const head = el('div', { class: 'modal-head', children: [
      el('div', { children: [
        el('div', { class: 'modal-title', text: opts.title || '', attrs: { id: 'vt-modal-title' } }),
        opts.subtitle ? el('div', { class: 'modal-sub', text: opts.subtitle }) : null,
      ].filter(Boolean) }),
      el('button', {
        class: ['btn', 'btn-icon'],
        attrs: { type: 'button', 'aria-label': 'Zamknij' },
        children: [el('i', { class: ['fa-solid', 'fa-xmark'] })],
        events: { click: () => done(null) },
      }),
    ]});

    const body = el('div', { class: 'modal-body' });

    if (typeof opts.body === 'string') body.textContent = opts.body;
    else if (opts.body instanceof Node) body.appendChild(opts.body);

    const footChildren = (opts.actions || []).map((a) => el('button', {
      class: ['btn', a.variant ? `btn-${a.variant}` : 'btn-secondary'],
      attrs: { type: 'button' },
      text: a.label,
      events: { click: () => done(a.action) },
    }));
    const foot = el('div', { class: 'modal-foot', children: footChildren });

    const modal = el('div', {
      class: 'modal',
      attrs: { role: 'dialog', 'aria-labelledby': 'vt-modal-title' },
      children: [head, body, foot],
    });
    bd.appendChild(modal);
    bd.classList.add('open');

    document.body.style.overflow = 'hidden';
    activeModalDone = done;

    function done(result) {
      if (finished) return;
      finished = true;
      activeModalDone = null;
      bd.classList.remove('open');
      document.body.style.overflow = '';
      setTimeout(() => clear(bd), 300);
      resolve(result);
    }
  });
}

export function closeModal() {
  if (activeModalDone) {
    activeModalDone(null);
    return;
  }
  const bd = document.getElementById(MODAL_BACKDROP_ID);
  if (!bd) return;
  bd.classList.remove('open');
  document.body.style.overflow = '';
}

export async function confirmDialog({ title, message, confirmLabel = 'OK', cancelLabel = 'Anuluj', variant = 'primary' }) {
  const body = el('p', { text: message, attrs: { style: 'color: var(--fg-2); font-size: 14px; line-height: 1.5;' } });
  const action = await openModal({
    title,
    body,
    actions: [
      { label: cancelLabel, action: 'cancel', variant: 'secondary' },
      { label: confirmLabel, action: 'confirm', variant },
    ],
  });
  return action === 'confirm';
}

/* Toast */

function ensureToastStack() {
  // Toasty wpadają do jednego wspólnego kontenera.
  let stack = $('.toast-stack');
  if (stack) return stack;

  stack = el('div', { class: 'toast-stack', attrs: { 'aria-live': 'polite', 'aria-atomic': 'true' } });
  document.body.appendChild(stack);
  return stack;
}

export function toast(message, { variant = 'info', duration = 3500 } = {}) {
  // Krótka informacja po akcji użytkownika.
  const stack = ensureToastStack();
  const node = el('div', {
    class: ['toast', variant !== 'info' ? variant : ''].filter(Boolean),
    text: message,
    attrs: { role: 'status' },
  });
  stack.appendChild(node);

  setTimeout(() => {
    node.style.transition = 'opacity 200ms';
    node.style.opacity = '0';
    setTimeout(() => node.remove(), 220);
  }, duration);
}
