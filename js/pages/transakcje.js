// @author Kamil Piorkowski

import { $, $$, el, debounce, clear, setText } from '../dom.js';
import { initTheme, bindThemeToggle } from '../motyw.js';
import { highlightActiveNav, bindTopbarScroll } from '../nawigacja.js';
import { getAllTrades, deleteTrade } from '../transakcje.js';
import { renderTradeRows } from '../renderowanie-transakcji.js';
import { confirmDialog, toast } from '../interfejs.js';
import { KEYS, load, save } from '../przechowywanie.js';

initTheme();

const STATE = {
  // Stan filtrów i paginacji dla tabeli.
  dir: 'all',
  outcome: 'all',
  query: '',
  sortBy: 'date',
  sortDir: 'desc',
  page: 1,
  pageSize: 10,
};

document.addEventListener('DOMContentLoaded', () => {
  highlightActiveNav();
  bindThemeToggle($('#theme-toggle'));
  bindTopbarScroll();

  STATE.pageSize = load(KEYS.PAGE_SIZE, 10);

  $$('.filter-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const group = chip.dataset.group;
      const value = chip.dataset.value;
      $$(`.filter-chip[data-group="${group}"]`).forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      STATE[group] = value;
      STATE.page = 1;
      render();
    });
  });

  const search = $('#search');
  if (search) {
    search.addEventListener('input', debounce((e) => {
      STATE.query = e.target.value.trim().toLowerCase();
      STATE.page = 1;
      render();
    }, 200));
  }

  const sortSel = $('#sort');
  if (sortSel) {
    sortSel.addEventListener('change', (e) => {
      const [by, dir] = e.target.value.split(':');
      STATE.sortBy = by;
      STATE.sortDir = dir;
      render();
    });
  }

  const pageSizeSel = $('#page-size');
  if (pageSizeSel) {
    pageSizeSel.value = String(STATE.pageSize);
    pageSizeSel.addEventListener('change', (e) => {
      STATE.pageSize = Number(e.target.value) || 10;
      STATE.page = 1;
      save(KEYS.PAGE_SIZE, STATE.pageSize);
      render();
    });
  }

  document.addEventListener('vt:trades-change', () => render());

  render();
});

function applyFilters(trades) {
  // Filtry działają na danych z localStorage, bez odświeżania strony.
  return trades.filter((t) => {
    if (STATE.dir !== 'all' && t.dir !== STATE.dir) return false;
    if (STATE.outcome === 'win'  && t.pnl <= 0) return false;
    if (STATE.outcome === 'loss' && t.pnl >= 0) return false;
    if (STATE.query) {
      const hay = `${t.pair} ${(t.tags || []).join(' ')} ${t.note || ''}`.toLowerCase();
      if (!hay.includes(STATE.query)) return false;
    }
    return true;
  });
}

function applySort(trades) {
  // Sortowanie tworzy kopię, żeby nie zmieniać oryginalnej tablicy.
  const dirSign = STATE.sortDir === 'asc' ? 1 : -1;
  const by = STATE.sortBy;

  return [...trades].sort((a, b) => {
    let av, bv;
    if (by === 'date') { av = new Date(a.date).getTime(); bv = new Date(b.date).getTime(); }
    else if (by === 'pair') { return a.pair.localeCompare(b.pair, 'pl') * dirSign; }
    else { av = a[by] ?? 0; bv = b[by] ?? 0; }
    return (av - bv) * dirSign;
  });
}

function render() {
  // Render łączy filtrowanie, sortowanie i paginację.
  const all = getAllTrades();
  const filtered = applyFilters(all);
  const sorted   = applySort(filtered);

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / STATE.pageSize));

  STATE.page = Math.min(STATE.page, totalPages);
  const start = (STATE.page - 1) * STATE.pageSize;
  const pageSlice = sorted.slice(start, start + STATE.pageSize);

  renderTradeRows($('#trades-tbody'), pageSlice, {
    deletable: true,
    onDelete: handleDelete,
  });

  renderPager(total, totalPages);
  setText($('#count'), `${filtered.length} z ${all.length}`);
}

function renderPager(total, totalPages) {
  // Paginacja pokazuje maksymalnie kilka przycisków naraz.
  const pager = $('#pager');
  if (!pager) return;
  clear(pager);

  const info = el('span', {
    class: 'pager-info',
    text: total === 0
      ? 'Brak wyników'
      : `Strona ${STATE.page} z ${totalPages} · ${total} ${pluralPL(total, 'transakcja', 'transakcje', 'transakcji')}`,
  });
  pager.appendChild(info);

  const prev = el('button', {
    class: 'pager-btn',
    attrs: { type: 'button', 'aria-label': 'Poprzednia strona', disabled: STATE.page === 1 || null },
    children: [el('i', { class: ['fa-solid', 'fa-chevron-left'] })],
    events: { click: () => { if (STATE.page > 1) { STATE.page -= 1; render(); } } },
  });
  pager.appendChild(prev);

  const maxButtons = 5;

  let from = Math.max(1, STATE.page - 2);
  let to = Math.min(totalPages, from + maxButtons - 1);
  from = Math.max(1, to - maxButtons + 1);
  for (let p = from; p <= to; p += 1) {
    const btn = el('button', {
      class: ['pager-btn', p === STATE.page ? 'active' : ''].filter(Boolean),
      attrs: { type: 'button' },
      text: String(p),
      events: { click: () => { STATE.page = p; render(); } },
    });
    pager.appendChild(btn);
  }

  const next = el('button', {
    class: 'pager-btn',
    attrs: { type: 'button', 'aria-label': 'Następna strona', disabled: STATE.page >= totalPages || null },
    children: [el('i', { class: ['fa-solid', 'fa-chevron-right'] })],
    events: { click: () => { if (STATE.page < totalPages) { STATE.page += 1; render(); } } },
  });
  pager.appendChild(next);
}

async function handleDelete(id) {
  // Usunięcie wymaga potwierdzenia w modalu.
  const ok = await confirmDialog({
    title: 'Usunąć transakcję?',
    message: 'Tej operacji nie można cofnąć. Transakcja zostanie usunięta z dziennika.',
    confirmLabel: 'Usuń',
    cancelLabel: 'Anuluj',
    variant: 'danger',
  });
  if (!ok) return;
  if (deleteTrade(id)) {
    toast('Transakcja usunięta.', { variant: 'info' });
  }
}

function pluralPL(n, one, few, many) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (n === 1) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}
