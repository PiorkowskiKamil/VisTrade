// @author Kamil Piorkowski

import { $, el, clear } from '../dom.js';
import { initTheme, bindThemeToggle } from '../motyw.js';
import { highlightActiveNav, bindTopbarScroll } from '../nawigacja.js';
import { fmtPLN, fmtNum, fmtDateTime } from '../formatowanie.js';
import { getAllTrades, pnlByDay } from '../transakcje.js';
import { openModal } from '../interfejs.js';

initTheme();

const STATE = {
  // Kalendarz przechowuje aktualnie oglądany miesiąc.
  year: 2025,
  month: 10,
};

const MONTH_NAMES = [
  'styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec',
  'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień',
];

document.addEventListener('DOMContentLoaded', () => {
  highlightActiveNav();
  bindThemeToggle($('#theme-toggle'));
  bindTopbarScroll();

  const trades = getAllTrades();
  // Startujemy od miesiąca najnowszej transakcji.
  if (trades.length) {
    const d = new Date(trades[0].date);
    STATE.year = d.getFullYear();
    STATE.month = d.getMonth();
  } else {
    const now = new Date();
    STATE.year = now.getFullYear();
    STATE.month = now.getMonth();
  }

  $('#prev-month')?.addEventListener('click', () => {
    STATE.month -= 1;
    if (STATE.month < 0) { STATE.month = 11; STATE.year -= 1; }
    render();
  });
  $('#next-month')?.addEventListener('click', () => {
    STATE.month += 1;
    if (STATE.month > 11) { STATE.month = 0; STATE.year += 1; }
    render();
  });

  document.addEventListener('vt:trades-change', () => render());
  render();
});

function render() {
  // Render buduje nagłówki dni tygodnia i komórki miesiąca.
  const monthNode = $('#cal-month');
  if (monthNode) monthNode.textContent = `${capitalize(MONTH_NAMES[STATE.month])} ${STATE.year}`;

  const grid = $('#cal-grid');
  if (!grid) return;
  clear(grid);

  ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'].forEach((d) => {
    grid.appendChild(el('div', { class: 'cal-dow', text: d }));
  });

  const firstDow = (new Date(STATE.year, STATE.month, 1).getDay() + 6) % 7;
  for (let i = 0; i < firstDow; i += 1) {
    grid.appendChild(el('div', { class: ['cal-day', 'muted'] }));
  }

  const daysInMonth = new Date(STATE.year, STATE.month + 1, 0).getDate();
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === STATE.year && today.getMonth() === STATE.month;
  const dayMap = pnlByDay(STATE.year, STATE.month);

  for (let day = 1; day <= daysInMonth; day += 1) {
    const cellChildren = [el('span', { class: 'num', text: String(day) })];
    const data = dayMap[day];
    let extraClass = '';
    if (data) {
      extraClass = data.pnl >= 0 ? 'win' : 'loss';
      cellChildren.push(el('span', { class: 'pl', text: fmtPLN(data.pnl) }));
      cellChildren.push(el('span', { class: 'ct', text: `${data.count} ${plural(data.count, 'transakcja','transakcje','transakcji')}` }));
    }
    const isToday = isCurrentMonth && today.getDate() === day;

    const cell = el('div', {
      class: ['cal-day', extraClass, isToday ? 'today' : ''].filter(Boolean),
      attrs: { tabindex: data ? '0' : '-1', role: data ? 'button' : null,
               'aria-label': data ? `Dzień ${day}: ${fmtPLN(data.pnl)}` : null },
      children: cellChildren,
      events: data ? {
        click: () => openDayModal(day, data),
        keydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDayModal(day, data); } },
      } : {},
    });
    grid.appendChild(cell);
  }
}

async function openDayModal(day, data) {
  // Kliknięcie dnia pokazuje transakcje z tego konkretnego dnia.
  const trades = getAllTrades().filter((t) => {
    const d = new Date(t.date);
    return d.getFullYear() === STATE.year && d.getMonth() === STATE.month && d.getDate() === day;
  });

  const list = el('div', { attrs: { style: 'display: flex; flex-direction: column; gap: 10px;' } });
  trades.forEach((t) => {
    list.appendChild(el('div', {
      attrs: { style: 'display: flex; justify-content: space-between; gap: 12px; padding: 10px 12px; background: var(--bg-3); border-radius: 8px;' },
      children: [
        el('div', { children: [
          el('strong', { text: t.pair, attrs: { style: 'color: var(--fg-1); font-size: 14px;' } }),
          el('span', { text: ` ${t.dir.toUpperCase()}`, attrs: { style: 'margin-left: 8px; font-size: 11px; color: var(--fg-3);' } }),
          el('div', { text: fmtDateTime(t.date), attrs: { style: 'font-size: 11px; color: var(--fg-3); margin-top: 2px; font-family: var(--font-mono);' } }),
        ]}),
        el('div', { class: t.pnl >= 0 ? 'pnl-up' : 'pnl-down', text: fmtPLN(t.pnl) }),
      ],
    }));
  });

  await openModal({
    title: `${day} ${MONTH_NAMES[STATE.month]} ${STATE.year}`,
    subtitle: `${fmtPLN(data.pnl)} · ${data.count} ${plural(data.count, 'transakcja', 'transakcje', 'transakcji')}`,
    body: list,
    actions: [{ label: 'Zamknij', action: 'close', variant: 'secondary' }],
  });
}

function plural(n, one, few, many) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (n === 1) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
