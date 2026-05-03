// @author Kamil Piorkowski

import { $, el, clear } from './dom.js';
import { fmtNum, fmtPLN, fmtR, fmtDateTime } from './formatowanie.js';

const TAG_CLASS_MAP = {
  // Znane tagi dostają stałe kolory.
  breakout: 'tag-blue',
  pullback: 'tag-purple',
  news: 'tag-teal',
  scalp: 'tag-amber',
  FOMO: 'tag-pink',
  trend: 'tag-blue',
  reversal: 'tag-purple',
  demo: 'tag-graphite',
};

function tagChip(tag) {
  // Jeden tag w tabeli jako mały chip.
  const cls = TAG_CLASS_MAP[tag] || 'tag-graphite';
  return el('span', {
    class: ['tag-chip', cls],
    children: [
      el('span', { class: 'dot' }),
      document.createTextNode(tag),
    ],
  });
}

export function buildTradeRow(trade, opts = {}) {
  // Funkcja składa cały wiersz tabeli dla jednej transakcji.
  const isJpy = /JPY/.test(trade.pair);
  const priceDigits = isJpy ? 3 : 4;
  const pnlClass = trade.pnl >= 0 ? 'pnl-up' : 'pnl-down';

  const tdActions = el('td', { attrs: { style: 'white-space: nowrap;' } });
  if (opts.editable !== false) {
    const editBtn = el('a', {
      class: 'row-action',
      attrs: {
        href: `dodaj.html?id=${encodeURIComponent(trade.id)}`,
        'aria-label': `Edytuj transakcję ${trade.pair}`,
        title: 'Edytuj',
      },
      children: [el('i', { class: ['fa-solid', 'fa-pen-to-square'] })],
      events: { click: (e) => e.stopPropagation() },
    });
    tdActions.appendChild(editBtn);
  }
  if (opts.deletable && typeof opts.onDelete === 'function') {
    const btn = el('button', {
      class: 'row-action',
      attrs: { type: 'button', 'aria-label': `Usuń transakcję ${trade.pair}`, title: 'Usuń' },
      children: [el('i', { class: ['fa-solid', 'fa-trash'] })],
      events: { click: (e) => { e.stopPropagation(); opts.onDelete(trade.id); } },
    });
    tdActions.appendChild(btn);
  }

  const tdDir = el('td', { children: [
    el('span', { class: ['dir', `dir-${trade.dir}`], text: trade.dir.toUpperCase() }),
  ]});
  const tdPair = el('td', { children: [
    el('span', { class: 'pair', text: trade.pair }),
  ]});
  const tdEntry = el('td', { class: 'num-cell', text: fmtNum(trade.entry, priceDigits) });
  const tdExit  = el('td', { class: 'num-cell', text: fmtNum(trade.exit, priceDigits) });
  const tdLot   = el('td', { class: 'num-cell', text: fmtNum(trade.lot, 2) });
  const tdPnl   = el('td', { class: pnlClass, text: fmtPLN(trade.pnl) });
  const tdRr    = el('td', { class: ['num-cell', 'col-rr'], text: fmtR(trade.rr) });

  const tdTags = el('td', { class: 'col-tags' });

  (trade.tags || []).forEach((tag) => tdTags.appendChild(tagChip(tag)));

  const tdDate = el('td', { class: 'cell-date', text: fmtDateTime(trade.date) });

  const tr = el('tr', { dataset: { id: trade.id }, children: [
    tdActions, tdDir, tdPair, tdEntry, tdExit, tdLot, tdPnl, tdRr, tdTags, tdDate,
  ]});

  return tr;
}

export function renderTradeRows(tbody, trades, opts = {}) {
  // Gdy nie ma wyników, pokazujemy jeden pusty wiersz.
  if (!tbody) return;
  clear(tbody);
  if (!trades.length) {
    const tr = el('tr', { children: [
      el('td', { attrs: { colspan: 10, style: 'padding: 32px; text-align: center; color: var(--fg-3);' },
                 text: 'Brak transakcji do pokazania.' }),
    ]});
    tbody.appendChild(tr);
    return;
  }
  trades.forEach((t) => tbody.appendChild(buildTradeRow(t, opts)));
}

export function buildTradeTableHead() {
  const cols = ['', 'Kierunek', 'Para', 'Wejście', 'Wyjście', 'Lot', 'P&L', 'R', 'Tagi', 'Data'];
  const tr = el('tr', {});
  cols.forEach((label, i) => {
    const cls = i === 7 ? 'col-rr' : (i === 8 ? 'col-tags' : '');
    tr.appendChild(el('th', { class: cls, text: label }));
  });
  return tr;
}
