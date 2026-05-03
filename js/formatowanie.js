// @author Kamil Piorkowski
// Funkcje formatujące liczby i daty zgodnie z polskimi konwencjami (pl-PL).

// Znak minus U+2212 jest optycznie szerszy niż klawiaturowy myślnik.
const MINUS = '−';
// Twarda spacja oddziela liczbę od jednostki i nie łamie linii.
const NBSP = ' ';

const numFmt2 = new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const numFmt0 = new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

// Zwraca P&L w złotych z wyraźnym + lub − i separatorem tysięcy.
export function fmtPLN(n) {
  if (n == null || isNaN(n)) return '—';
  const sign = n > 0 ? '+' : (n < 0 ? MINUS : '');
  const abs = numFmt2.format(Math.abs(n));
  return `${sign}${abs}${NBSP}zł`;
}

// Formatuje liczbę z podaną liczbą miejsc po przecinku (domyślnie 2).
export function fmtNum(n, digits = 2) {
  if (n == null || isNaN(n)) return '—';
  return new Intl.NumberFormat('pl-PL', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);
}

// Liczba całkowita — bez miejsc po przecinku.
export function fmtInt(n) {
  if (n == null || isNaN(n)) return '—';
  return numFmt0.format(n);
}

// Współczynnik R z jednostką — np. "+1,8R" lub "−0,5R".
export function fmtR(rr) {
  if (rr == null || isNaN(rr)) return '—';
  const sign = rr > 0 ? '+' : (rr < 0 ? MINUS : '');
  return `${sign}${fmtNum(Math.abs(rr), 1)}R`;
}

// Zmiana w pipsach z jednostką — np. "+12,4 pip".
export function fmtPip(p) {
  if (p == null || isNaN(p)) return '—';
  const sign = p > 0 ? '+' : (p < 0 ? MINUS : '');
  return `${sign}${fmtNum(Math.abs(p), 1)}${NBSP}pip`;
}

// Procent — domyślnie bez miejsc po przecinku.
export function fmtPct(n, digits = 0) {
  if (n == null || isNaN(n)) return '—';
  return `${fmtNum(n, digits)}%`;
}

// Data w formacie "21 lis 2025".
export function fmtDate(input) {
  const d = input instanceof Date ? input : new Date(input);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pl-PL', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Data i godzina — "21 lis · 14:32".
export function fmtDateTime(input) {
  const d = input instanceof Date ? input : new Date(input);
  if (isNaN(d.getTime())) return '—';
  const date = d.toLocaleDateString('pl-PL', { day: '2-digit', month: 'short' });
  const time = d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
  return `${date} · ${time}`;
}

// Parsuje liczbę wpisaną przez użytkownika — akceptuje przecinek lub kropkę.
export function parseNumPL(input) {
  if (input == null) return NaN;

  const s = String(input).trim().replace(',', '.').replace(/\s/g, '');
  if (s === '') return NaN;
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}
