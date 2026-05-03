// @author Kamil Piorkowski

import { KEYS, load, save } from './przechowywanie.js';

const CACHE_TTL_MS = 60 * 60 * 1000;
const PAIRS = ['EUR', 'USD', 'GBP'];

async function fetchOne(base, signal) {
  // Pobieramy kurs jednej waluty do PLN z Frankfurter API.
  const url = `https://api.frankfurter.dev/v1/latest?base=${encodeURIComponent(base)}&symbols=PLN`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();

  const rate = json && json.rates && json.rates.PLN;
  if (!Number.isFinite(rate)) throw new Error('Invalid response shape');
  return { base, rate, date: json.date };
}

export async function getRates({ force = false, signal } = {}) {
  // Cache ogranicza liczbę zapytań do zewnętrznego API.
  const cached = load(KEYS.FX_CACHE, null);
  const fresh  = cached && (Date.now() - cached.ts) < CACHE_TTL_MS;

  if (!force && fresh) {
    return { ...cached, fromCache: true, offline: false };
  }

  try {
    const results = await Promise.all(PAIRS.map((b) => fetchOne(b, signal)));
    const payload = {
      rates: results,
      ts: Date.now(),
      fromCache: false,
      offline: false,
    };
    save(KEYS.FX_CACHE, payload);
    return payload;
  } catch (err) {
    // Gdy API nie odpowiada, próbujemy pokazać ostatnie zapisane kursy.
    if (cached) {
      return { ...cached, fromCache: true, offline: true };
    }
    return { rates: [], ts: 0, fromCache: false, offline: true, error: err.message };
  }
}

export function simulateAsyncSave(payload, delay = 480) {
  // Mała pauza udaje zapis na serwerze i pokazuje stan przycisku.
  return new Promise((resolve) => {
    setTimeout(() => resolve({ ok: true, payload, ts: Date.now() }), delay);
  });
}
