// @author Kamil Piorkowski

import { KEYS, load, save } from './przechowywanie.js';
import { MOCK_TRADES } from './dane-startowe.js';

let cache = null;

export function getAllTrades() {
  // Pierwsze wejście wypełnia dziennik przykładowymi danymi.
  if (cache) return cache;
  const stored = load(KEYS.TRADES, null);
  if (!stored || !Array.isArray(stored) || stored.length === 0) {
    if (!load(KEYS.SEEDED, false)) {
      save(KEYS.TRADES, MOCK_TRADES);
      save(KEYS.SEEDED, true);
      cache = [...MOCK_TRADES];
    } else {
      cache = [];
    }
  } else {
    cache = stored;
  }

  cache.sort((a, b) => new Date(b.date) - new Date(a.date));
  return cache;
}

export function getTradeById(id) {
  return getAllTrades().find((t) => t.id === id) || null;
}

export function addTrade(trade) {
  // Po zapisie wysyłamy zdarzenie, gdyby inny widok chciał się odświeżyć.
  const trades = [...getAllTrades(), trade];
  save(KEYS.TRADES, trades);
  cache = null;

  document.dispatchEvent(new CustomEvent('vt:trades-change', { detail: { type: 'add', trade } }));
  return trade;
}

export function deleteTrade(id) {
  const before = getAllTrades();

  const after = before.filter((t) => t.id !== id);

  if (after.length === before.length) return false;
  save(KEYS.TRADES, after);
  cache = null;
  document.dispatchEvent(new CustomEvent('vt:trades-change', { detail: { type: 'delete', id } }));
  return true;
}

export function updateTrade(id, patch) {
  // Edycja zachowuje stare id, więc linki do transakcji dalej działają.
  const trades = getAllTrades();
  const idx = trades.findIndex((t) => t.id === id);
  if (idx < 0) return null;

  const merged = { ...trades[idx], ...patch, id };
  const next = [...trades];
  next[idx] = merged;
  save(KEYS.TRADES, next);
  cache = null;
  document.dispatchEvent(new CustomEvent('vt:trades-change', { detail: { type: 'update', trade: merged } }));
  return merged;
}

export function clearAllTrades() {
  save(KEYS.TRADES, []);
  cache = null;
  document.dispatchEvent(new CustomEvent('vt:trades-change', { detail: { type: 'clear' } }));
}

export function newTradeId() {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') {
    return 't-' + window.crypto.randomUUID().slice(0, 8);
  }

  return 't-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/* ---------- Statystyki ---------- */

export function computePips(pair, dir, entry, exit) {
  const isJpy = /JPY/.test(pair);
  const pipSize = isJpy ? 0.01 : 0.0001;

  const dirSign = dir === 'long' ? 1 : -1;
  return ((exit - entry) * dirSign) / pipSize;
}

export function computePnL(pair, dir, entry, exit, lot) {
  // Wynik jest szacunkowy i służy do dziennika, nie do rozliczeń brokerskich.
  const pips = computePips(pair, dir, entry, exit);
  const isJpy = /JPY/.test(pair);

  const usdPerPipPerStandardLot = isJpy ? (1000 / exit) : 10;
  const usd = pips * usdPerPipPerStandardLot * lot;
  const usdPln = 4.05;
  if (/PLN$/.test(pair)) {
    return pips * (isJpy ? 1000 : 10) * lot;
  }
  return usd * usdPln;
}

export function computeR(dir, entry, exit, sl) {
  if (sl == null || isNaN(sl) || entry === sl) return 0;
  if (dir === 'long') {
    const risk = entry - sl;

    if (risk <= 0) return 0;
    return (exit - entry) / risk;
  }
  const risk = sl - entry;
  if (risk <= 0) return 0;
  return (entry - exit) / risk;
}

export function winRate(trades = getAllTrades()) {
  if (!trades.length) return 0;

  const wins = trades.filter((t) => t.pnl > 0).length;
  return (wins / trades.length) * 100;
}

export function totalPnL(trades = getAllTrades()) {
  return trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
}

export function avgRR(trades = getAllTrades()) {
  if (!trades.length) return 0;
  return trades.reduce((sum, t) => sum + (t.rr || 0), 0) / trades.length;
}

export function equityCurve(trades = getAllTrades(), startBalance = 10000) {
  const sorted = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
  let cum = startBalance;
  return sorted.map((t) => {
    cum += t.pnl || 0;
    const d = new Date(t.date);

    const label = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`;
    return { label, equity: cum, date: t.date };
  });
}

export function pnlByPair(trades = getAllTrades()) {
  const map = {};
  trades.forEach((t) => { map[t.pair] = (map[t.pair] || 0) + (t.pnl || 0); });

  return Object.entries(map)
    .map(([pair, pnl]) => ({ pair, pnl }))
    .sort((a, b) => b.pnl - a.pnl);
}

export function pnlByDayOfWeek(trades = getAllTrades()) {
  const labels = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'];
  const sums = [0, 0, 0, 0, 0, 0, 0];
  trades.forEach((t) => {
    const d = new Date(t.date).getDay();
    const idx = (d + 6) % 7;
    sums[idx] += t.pnl || 0;
  });
  return labels.map((label, i) => ({ label, pnl: sums[i] }));
}

export function rrDistribution(trades = getAllTrades()) {
  // Koszyki pokazują, ile transakcji wpadło w dany zakres R.
  const buckets = [
    { label: '≤−1R',    min: -Infinity, max: -1 },
    { label: '−1 do 0', min: -1,        max: 0 },
    { label: '0 do 1',  min: 0,         max: 1 },
    { label: '1 do 2',  min: 1,         max: 2 },
    { label: '≥2R',     min: 2,         max: Infinity },
  ];
  return buckets.map((b) => ({
    label: b.label,
    isLoss: b.max <= 0,

    count: trades.filter((t) => (t.rr ?? 0) >= b.min && (t.rr ?? 0) < b.max).length,
  }));
}

export function statsByTag(trades = getAllTrades()) {
  const map = {};
  trades.forEach((t) => {
    (t.tags || []).forEach((tag) => {
      if (!map[tag]) map[tag] = { tag, pnl: 0, wins: 0, losses: 0, count: 0 };
      map[tag].pnl += t.pnl || 0;
      map[tag].count += 1;
      if (t.pnl > 0) map[tag].wins += 1;
      else if (t.pnl < 0) map[tag].losses += 1;
    });
  });

  return Object.values(map).sort((a, b) => Math.abs(b.pnl) - Math.abs(a.pnl));
}

export function pnlByDay(year, month, trades = getAllTrades()) {
  const map = {};
  trades.forEach((t) => {
    const d = new Date(t.date);

    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!map[day]) map[day] = { pnl: 0, count: 0 };
      map[day].pnl += t.pnl || 0;
      map[day].count += 1;
    }
  });
  return map;
}

export function currentStreak(trades = getAllTrades()) {
  if (!trades.length) return { type: 'none', count: 0 };

  const sorted = [...trades].sort((a, b) => new Date(b.date) - new Date(a.date));
  const first = sorted[0];
  const type = first.pnl > 0 ? 'win' : (first.pnl < 0 ? 'loss' : 'none');
  if (type === 'none') return { type, count: 0 };
  let count = 0;

  for (const t of sorted) {
    const tType = t.pnl > 0 ? 'win' : (t.pnl < 0 ? 'loss' : 'none');
    if (tType === type) count += 1;
    else break;
  }
  return { type, count };
}
