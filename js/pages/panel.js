// @author Kamil Piorkowski

import { $, el, clear, setText } from '../dom.js';
import { fmtPLN, fmtPct, fmtR, fmtDate, fmtNum } from '../formatowanie.js';
import { initTheme, bindThemeToggle } from '../motyw.js';
import { highlightActiveNav, bindTopbarScroll } from '../nawigacja.js';
import {
  getAllTrades, totalPnL, winRate, avgRR, equityCurve,
  rrDistribution, currentStreak,
} from '../transakcje.js';
import { drawEquity, drawWinRate, drawRR, registerChart, destroyAll } from '../wykresy.js';
import { renderTradeRows } from '../renderowanie-transakcji.js';
import { getRates } from '../kursy.js';

initTheme();

document.addEventListener('DOMContentLoaded', () => {
  highlightActiveNav();
  bindThemeToggle($('#theme-toggle'));
  bindTopbarScroll();

  // Dashboard pokazuje szybkie podsumowanie aktualnego dziennika.
  const trades = getAllTrades();

  setText($('#kpi-pnl'),     fmtPLN(totalPnL(trades)));
  setText($('#kpi-pnl-cap'), `${trades.length} transakcji łącznie`);
  setText($('#kpi-winrate'), fmtPct(winRate(trades), 0));
  const wins = trades.filter((t) => t.pnl > 0).length;
  setText($('#kpi-winrate-cap'), `${wins} z ${trades.length} transakcji`);
  setText($('#kpi-rr'),      `1:${fmtNum(Math.abs(avgRR(trades)), 1)}`);
  setText($('#kpi-rr-cap'),  'Średnie R:R z dziennika');

  const streak = currentStreak(trades);
  const streakNode = $('#kpi-streak');
  if (streakNode) {
    if (streak.type === 'win') {
      streakNode.textContent = `Seria: ${streak.count} wygranych z rzędu`;
      streakNode.classList.add('win');
    } else if (streak.type === 'loss') {
      streakNode.textContent = `Seria: ${streak.count} stratnych z rzędu`;
      streakNode.classList.add('loss');
    }
  }

  drawCharts(trades);

  renderTradeRows($('#recent-tbody'), trades.slice(0, 5), { deletable: false });

  loadFx();

  document.addEventListener('vt:trades-change', () => {
    destroyAll();
    drawCharts(getAllTrades());
  });
});

function drawCharts(trades) {
  // Każdy wykres rejestrujemy, żeby można go było odświeżyć po zmianie motywu.
  const eq = $('#chart-equity');
  if (eq) {
    const draw = () => {
      const c = drawEquity(eq, equityCurve(trades, 10000));
      registerChart('equity', c, draw);
    };
    draw();
  }
  const wr = $('#chart-winrate');
  if (wr) {
    const draw = () => {
      const wins = trades.filter((t) => t.pnl > 0).length;
      const losses = trades.filter((t) => t.pnl < 0).length;
      const c = drawWinRate(wr, wins, losses);
      registerChart('winrate', c, draw);
    };
    draw();
  }
  const rr = $('#chart-rr');
  if (rr) {
    const draw = () => {
      const c = drawRR(rr, rrDistribution(trades));
      registerChart('rr', c, draw);
    };
    draw();
  }
}

async function loadFx() {
  // Ticker kursów pobiera dane z API albo z cache.
  const ticker = $('#fx-ticker');
  if (!ticker) return;

  ticker.addEventListener('click', async (e) => {
    const btn = e.target.closest('#fx-refresh');
    if (!btn) return;
    btn.disabled = true;
    setFxLoading(ticker);
    const payload = await getRates({ force: true });
    renderFx(ticker, payload);
  });

  setFxLoading(ticker);
  try {
    const payload = await getRates();
    renderFx(ticker, payload);
  } catch (err) {
    renderFxError(ticker, err);
  }
}

function setFxLoading(ticker) {
  clear(ticker);
  ticker.appendChild(el('span', { class: 'lbl', text: 'Kurs referencyjny' }));
  ticker.appendChild(el('span', { class: 'pair', text: 'Ładowanie…' }));
}

function renderFx(ticker, payload) {
  clear(ticker);
  ticker.appendChild(el('span', { class: 'lbl', text: 'Kurs referencyjny' }));
  if (!payload.rates || !payload.rates.length) {
    ticker.appendChild(el('span', { class: 'pair', text: 'Brak danych' }));
    ticker.appendChild(el('span', { class: ['meta', 'offline'], text: 'tryb offline' }));
    return;
  }
  payload.rates.forEach((r) => {
    const span = el('span', { class: 'pair', children: [
      document.createTextNode(`${r.base}/PLN `),
      el('strong', { text: fmtNum(r.rate, 4) }),
    ]});
    ticker.appendChild(span);
  });
  const ts = new Date(payload.ts);
  const meta = el('span', {
    class: ['meta', payload.offline ? 'offline' : ''],
    text: payload.offline
      ? `tryb offline · ${fmtDate(ts)}`
      : `aktualizacja: ${ts.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}`,
  });
  ticker.appendChild(meta);
  ticker.appendChild(el('button', {
    class: ['btn', 'btn-icon', 'btn-sm'],
    attrs: { id: 'fx-refresh', type: 'button', title: 'Odśwież kursy', 'aria-label': 'Odśwież kursy' },
    children: [el('i', { class: ['fa-solid', 'fa-arrows-rotate'] })],
  }));
}

function renderFxError(ticker, err) {
  clear(ticker);
  ticker.appendChild(el('span', { class: 'lbl', text: 'Kurs referencyjny' }));
  ticker.appendChild(el('span', { class: 'pair', text: 'Brak połączenia' }));
  ticker.appendChild(el('span', { class: ['meta', 'offline'], text: 'tryb offline' }));
}
