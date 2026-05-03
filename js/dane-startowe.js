// @author Kamil Piorkowski

export const MOCK_TRADES = [
  { id: 't-001', pair: 'EUR/USD', dir: 'long',  entry: 1.0825, exit: 1.0871, lot: 0.10, sl: 1.0790, tp: 1.0900, pnl: 248.40,  pip:  12.4, rr:  1.8, date: '2025-11-21T14:32', tags: ['breakout'], note: 'Czysty wybicie z konsolidacji na H1.' },
  { id: 't-002', pair: 'GBP/JPY', dir: 'short', entry: 189.42, exit: 189.84, lot: 0.05, sl: 190.00, tp: 188.00, pnl: -112.80, pip: -42.0, rr: -0.5, date: '2025-11-21T11:08', tags: ['FOMO'],     note: 'Wszedłem za szybko, bez potwierdzenia.' },
  { id: 't-003', pair: 'USD/PLN', dir: 'long',  entry: 4.0312, exit: 4.0418, lot: 0.10, sl: 4.0240, tp: 4.0500, pnl:  86.00,  pip:  10.6, rr:  1.2, date: '2025-11-20T16:51', tags: ['news'],     note: 'Po danych CPI, plan trzymał się dobrze.' },
  { id: 't-004', pair: 'EUR/USD', dir: 'short', entry: 1.0892, exit: 1.0848, lot: 0.10, sl: 1.0920, tp: 1.0820, pnl: 184.80,  pip:  11.0, rr:  2.2, date: '2025-11-20T09:15', tags: ['pullback'], note: 'Korekta do średniej 50, perfekcyjne R:R.' },
  { id: 't-005', pair: 'AUD/USD', dir: 'long',  entry: 0.6582, exit: 0.6571, lot: 0.10, sl: 0.6560, tp: 0.6620, pnl: -46.20,  pip: -11.0, rr: -0.6, date: '2025-11-19T13:42', tags: ['scalp'],    note: '' },
  { id: 't-006', pair: 'USD/JPY', dir: 'long',  entry: 154.21, exit: 154.68, lot: 0.05, sl: 153.90, tp: 154.80, pnl: 152.30,  pip:  47.0, rr:  1.6, date: '2025-11-19T10:08', tags: ['breakout'], note: '' },
  { id: 't-007', pair: 'GBP/USD', dir: 'short', entry: 1.2614, exit: 1.2632, lot: 0.10, sl: 1.2640, tp: 1.2580, pnl: -75.60,  pip: -18.0, rr: -0.7, date: '2025-11-18T15:24', tags: ['news'],     note: 'Niespodziewana wypowiedź BoE.' },
  { id: 't-008', pair: 'EUR/PLN', dir: 'long',  entry: 4.3128, exit: 4.3214, lot: 0.10, sl: 4.3050, tp: 4.3220, pnl:  67.50,  pip:   8.6, rr:  1.0, date: '2025-11-18T11:50', tags: ['pullback'], note: '' },
  { id: 't-009', pair: 'EUR/USD', dir: 'long',  entry: 1.0814, exit: 1.0832, lot: 0.10, sl: 1.0790, tp: 1.0850, pnl:  72.90,  pip:  18.0, rr:  1.4, date: '2025-11-17T14:02', tags: ['breakout'], note: '' },
  { id: 't-010', pair: 'USD/PLN', dir: 'short', entry: 4.0451, exit: 4.0398, lot: 0.10, sl: 4.0500, tp: 4.0380, pnl:  53.00,  pip:   5.3, rr:  0.8, date: '2025-11-17T10:18', tags: ['scalp'],    note: '' },
  { id: 't-011', pair: 'GBP/JPY', dir: 'long',  entry: 188.76, exit: 188.92, lot: 0.05, sl: 188.40, tp: 189.00, pnl:  56.40,  pip:  16.0, rr:  0.9, date: '2025-11-15T16:30', tags: ['pullback'], note: '' },
  { id: 't-012', pair: 'EUR/USD', dir: 'short', entry: 1.0901, exit: 1.0925, lot: 0.10, sl: 1.0920, tp: 1.0860, pnl: -96.00,  pip: -24.0, rr: -1.0, date: '2025-11-14T09:48', tags: ['FOMO'],     note: 'Wszedłem przeciwko trendowi.' },
];

export const CURRENCY_PAIRS = [
  'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/PLN', 'EUR/PLN',
  'GBP/JPY', 'AUD/USD', 'USD/CHF', 'NZD/USD', 'EUR/GBP',
];

export const TAG_SUGGESTIONS = ['breakout', 'pullback', 'scalp', 'news', 'FOMO', 'trend', 'reversal', 'demo'];
