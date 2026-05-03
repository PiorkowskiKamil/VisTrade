// @author Kamil Piorkowski

import { fmtPLN, fmtNum, fmtInt } from './formatowanie.js';

/* eslint-disable no-undef */

function readColors() {
  // Wykresy biorą kolory z CSS, więc pasują do motywu.
  const styles = getComputedStyle(document.documentElement);

  const get = (name, fallback = '') => styles.getPropertyValue(name).trim() || fallback;
  return {
    brand:  get('--brand-500', '#ff5b1f'),
    win:    get('--win',  '#3ecf8e'),
    loss:   get('--loss', '#f06d6d'),
    grid:   get('--chart-grid', '#1f2a3e'),
    axis:   get('--chart-axis', '#525f78'),
    fg1:    get('--fg-1',  '#eef2f8'),
    fg2:    get('--fg-2',  '#b8c2d4'),
    fg3:    get('--fg-3',  '#7d8aa3'),
    bg2:    get('--bg-2',  '#161e2e'),
    line1:  get('--line-1','#1f2a3e'),
  };
}

function tooltipDefaults(c) {
  // Ten sam styl tooltipów jest używany we wszystkich wykresach.
  return {
    backgroundColor: c.bg2,
    borderColor: c.line1,
    borderWidth: 1,
    titleColor: c.fg1,
    bodyColor: c.fg2,
    titleFont: { family: 'Inter', size: 12, weight: '600' },
    bodyFont:  { family: 'JetBrains Mono', size: 12 },
    padding: 10,
    cornerRadius: 8,
    displayColors: false,
  };
}

/* Krzywa kapitału - wykres liniowy z gradientem */
export function drawEquity(canvas, points) {
  // Krzywa kapitału pokazuje sumę wyników po kolei.
  if (!canvas || !window.Chart) return null;
  const c = readColors();
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.clientHeight || 280);

  grad.addColorStop(0, hexToRgba(c.brand, 0.30));
  grad.addColorStop(1, hexToRgba(c.brand, 0));

  return new Chart(ctx, {
    type: 'line',
    data: {
      labels: points.map((p) => p.label),
      datasets: [{
        data: points.map((p) => p.equity),
        borderColor: c.brand,
        borderWidth: 2,
        backgroundColor: grad,
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: c.brand,
        pointHoverBorderColor: '#fff',
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          ...tooltipDefaults(c),
          callbacks: {
            label: (ctx) => `Kapitał: ${fmtNum(ctx.raw, 2)} zł`,
          },
        },
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: c.axis, font: { family: 'JetBrains Mono', size: 10 } } },
        y: { grid: { color: c.grid }, ticks: { color: c.axis, font: { family: 'JetBrains Mono', size: 10 }, callback: (v) => fmtInt(v) } },
      },
    },
  });
}

/* Win rate - wykres kołowy typu doughnut */
export function drawWinRate(canvas, wins, losses) {
  if (!canvas || !window.Chart) return null;
  const c = readColors();
  return new Chart(canvas.getContext('2d'), {
    type: 'doughnut',
    data: {
      labels: ['Wygrane', 'Stratne'],
      datasets: [{
        data: [wins, losses],
        backgroundColor: [c.win, c.loss],
        borderColor: 'transparent',
        borderWidth: 0,
        hoverOffset: 4,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      cutout: '72%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: c.fg2, font: { family: 'Inter', size: 12 }, boxWidth: 8, boxHeight: 8, padding: 12 },
        },
        tooltip: tooltipDefaults(c),
      },
    },
  });
}

/* Histogram R-multiple */
export function drawRR(canvas, distribution) {
  if (!canvas || !window.Chart) return null;
  const c = readColors();
  return new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels: distribution.map((d) => d.label),
      datasets: [{
        data: distribution.map((d) => d.count),

        backgroundColor: distribution.map((d) => (d.isLoss ? c.loss : c.win)),
        borderRadius: 6,
        barPercentage: 0.75,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: { legend: { display: false }, tooltip: tooltipDefaults(c) },
      scales: {
        x: { grid: { display: false }, ticks: { color: c.axis, font: { family: 'Inter', size: 11 } } },
        y: { grid: { color: c.grid }, ticks: { color: c.axis, font: { family: 'JetBrains Mono', size: 10 }, stepSize: 1 } },
      },
    },
  });
}

/* P&L według pary walutowej - poziomy wykres słupkowy */
export function drawByPair(canvas, rows) {
  if (!canvas || !window.Chart) return null;
  const c = readColors();
  return new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels: rows.map((r) => r.pair),
      datasets: [{
        data: rows.map((r) => r.pnl),

        backgroundColor: rows.map((r) => (r.pnl >= 0 ? c.win : c.loss)),
        borderRadius: 6,
        barPercentage: 0.7,
      }],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: { display: false },
        tooltip: { ...tooltipDefaults(c), callbacks: { label: (ctx) => fmtPLN(ctx.raw) } },
      },
      scales: {
        x: { grid: { color: c.grid }, ticks: { color: c.axis, font: { family: 'JetBrains Mono', size: 10 } } },
        y: { grid: { display: false }, ticks: { color: c.fg2, font: { family: 'Inter', size: 12 } } },
      },
    },
  });
}

/* P&L według dnia tygodnia */
export function drawByDow(canvas, rows) {
  if (!canvas || !window.Chart) return null;
  const c = readColors();
  return new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels: rows.map((r) => r.label),
      datasets: [{
        data: rows.map((r) => r.pnl),
        backgroundColor: rows.map((r) => (r.pnl >= 0 ? c.win : c.loss)),
        borderRadius: 6,
        barPercentage: 0.55,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: { display: false },
        tooltip: { ...tooltipDefaults(c), callbacks: { label: (ctx) => fmtPLN(ctx.raw) } },
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: c.fg2, font: { family: 'Inter', size: 12 } } },
        y: { grid: { color: c.grid }, ticks: { color: c.axis, font: { family: 'JetBrains Mono', size: 10 }, callback: (v) => fmtInt(v) } },
      },
    },
  });
}

function hexToRgba(hex, alpha = 1) {
  if (!hex) return `rgba(255, 91, 31, ${alpha})`;
  const h = hex.replace('#', '').trim();
  if (h.length !== 6) return `rgba(255, 91, 31, ${alpha})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const registry = new Map();

export function registerChart(id, chart, redrawFn) {
  // Rejestr pomaga przerysować wykresy po zmianie motywu.
  if (registry.has(id)) {
    const existing = registry.get(id);

    if (existing.chart) try { existing.chart.destroy(); } catch (_) {}
  }
  registry.set(id, { chart, redrawFn });
}

export function destroyAll() {
  registry.forEach(({ chart }) => { if (chart) try { chart.destroy(); } catch (_) {} });
  registry.clear();
}

export function redrawAll() {
  // Przy zmianie motywu rysujemy wykresy od nowa.
  const entries = Array.from(registry.entries());
  registry.clear();

  entries.forEach(([id, { redrawFn }]) => {
    if (typeof redrawFn === 'function') redrawFn();
  });
}

document.addEventListener('vt:theme-change', () => redrawAll());

let _resizeTimer = null;
window.addEventListener('resize', () => {
  if (_resizeTimer) clearTimeout(_resizeTimer);
  _resizeTimer = setTimeout(() => {
    registry.forEach(({ chart }) => {
      if (chart && typeof chart.resize === 'function') {
        try { chart.resize(); } catch (_) {  }
      }
    });
  }, 200);
});
