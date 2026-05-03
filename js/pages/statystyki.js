// @author Kamil Piorkowski

import { $, el, clear, setText } from '../dom.js';
import { initTheme, bindThemeToggle } from '../motyw.js';
import { highlightActiveNav, bindTopbarScroll } from '../nawigacja.js';
import { fmtPLN, fmtPct, fmtNum } from '../formatowanie.js';
import { getAllTrades, pnlByPair, pnlByDayOfWeek, statsByTag, totalPnL, winRate } from '../transakcje.js';
import { drawByPair, drawByDow, registerChart, destroyAll } from '../wykresy.js';

initTheme();

document.addEventListener('DOMContentLoaded', () => {
  highlightActiveNav();
  bindThemeToggle($('#theme-toggle'));
  bindTopbarScroll();

  drawAll();

  document.addEventListener('vt:trades-change', () => {
    destroyAll();
    drawAll();
  });
});

function drawAll() {
  // Widok statystyk zawsze liczy dane od nowa z zapisanych transakcji.
  const trades = getAllTrades();

  setText($('#kpi-total'),    fmtPLN(totalPnL(trades)));
  setText($('#kpi-trades'),   String(trades.length));
  setText($('#kpi-winrate'),  fmtPct(winRate(trades), 0));

  const byPair = $('#chart-by-pair');
  if (byPair) {
    const draw = () => {
      const c = drawByPair(byPair, pnlByPair(trades));
      registerChart('byPair', c, draw);
    };
    draw();
  }

  const byDow = $('#chart-by-dow');
  if (byDow) {
    const draw = () => {
      const c = drawByDow(byDow, pnlByDayOfWeek(trades));
      registerChart('byDow', c, draw);
    };
    draw();
  }

  renderTagBars(trades);
}

function renderTagBars(trades) {
  // Pasek tagu jest dłuższy, gdy tag ma większy wpływ na P&L.
  const list = $('#tag-bars');
  if (!list) return;
  clear(list);

  const stats = statsByTag(trades);
  if (!stats.length) {
    list.appendChild(el('div', { class: 'empty', children: [
      el('div', { class: 'ttl', text: 'Brak tagów do pokazania' }),
      el('div', { class: 'sub', text: 'Dodaj kilka transakcji z tagami, aby zobaczyć analizę.' }),
    ]}));
    return;
  }

  const max = Math.max(...stats.map((s) => Math.abs(s.pnl)));

  const TAG_CLASS = {
    breakout: 'tag-blue', pullback: 'tag-purple', news: 'tag-teal',
    scalp: 'tag-amber', FOMO: 'tag-pink', trend: 'tag-blue',
    reversal: 'tag-purple', demo: 'tag-graphite',
  };

  stats.forEach((s) => {
    const pct = max ? Math.abs(s.pnl) / max * 100 : 0;
    const fillClass = s.pnl >= 0 ? 'win' : 'loss';
    const tagCls = TAG_CLASS[s.tag] || 'tag-graphite';

    const row = el('div', { class: 'bar-row', children: [
      el('div', { class: 'bar-label', children: [
        el('span', { class: ['tag-chip', tagCls], children: [
          el('span', { class: 'dot' }),
          document.createTextNode(s.tag),
        ]}),
      ]}),
      el('div', { class: 'bar-track', children: [
        el('div', { class: ['bar-fill', fillClass], attrs: { style: `width: ${pct}%;` } }),
      ]}),
      el('div', { class: 'bar-val', text: fmtPLN(s.pnl) }),
    ]});
    list.appendChild(row);
  });
}
