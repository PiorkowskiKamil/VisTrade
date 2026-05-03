// @author Kamil Piorkowski

import { parseNumPL } from './formatowanie.js';

export const RX_PAIR = /^[A-Z]{3}\/[A-Z]{3}$/;

// Liczby można wpisywać z kropką albo przecinkiem.
export const RX_NUMBER = /^\d+(?:[.,]\d+)?$/;

// Tagi są krótkie, żeby dobrze wyglądały w tabelach.
export const RX_TAG = /^[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż0-9-]{1,20}$/;

export const ERR = Object.freeze({
  PAIR_REQUIRED:   'Wybierz parę walutową.',
  PAIR_FORMAT:     'Para walutowa: format ABC/XYZ (np. EUR/USD).',
  DIR_REQUIRED:    'Wybierz kierunek transakcji.',
  ENTRY_REQUIRED:  'Podaj cenę wejścia.',
  ENTRY_FORMAT:    'Wpisz liczbę dodatnią (np. 1,0825).',
  EXIT_REQUIRED:   'Podaj cenę wyjścia.',
  EXIT_FORMAT:     'Wpisz liczbę dodatnią (np. 1,0871).',
  SL_FORMAT:       'Wpisz liczbę dodatnią lub zostaw puste.',
  TP_FORMAT:       'Wpisz liczbę dodatnią lub zostaw puste.',
  LOT_REQUIRED:    'Podaj rozmiar pozycji.',
  LOT_FORMAT:      'Rozmiar pozycji to liczba (np. 0,10).',
  LOT_MIN:         'Minimalny rozmiar pozycji to 0,01 lota.',
  LOT_MAX:         'Maksymalny rozmiar pozycji to 100 lotów.',
  DATE_REQUIRED:   'Wybierz datę i godzinę transakcji.',
  DATE_FUTURE:     'Data nie może być w przyszłości.',
  DATE_INVALID:    'Niepoprawny format daty.',
  TAG_FORMAT:      'Tag: tylko litery, cyfry i myślniki (max 20 znaków).',
  NOTE_TOO_LONG:   'Notatka: maksymalnie 500 znaków.',
  GENERIC:         'Sprawdź wpisane dane.',
});

export function validatePair(value) {
  if (!value || !value.trim()) return ERR.PAIR_REQUIRED;
  if (!RX_PAIR.test(value.trim())) return ERR.PAIR_FORMAT;
  return null;
}

export function validateDir(value) {
  if (value !== 'long' && value !== 'short') return ERR.DIR_REQUIRED;
  return null;
}

export function validatePrice(value, kind = 'entry') {
  if (value == null || String(value).trim() === '') {
    return kind === 'entry' ? ERR.ENTRY_REQUIRED : ERR.EXIT_REQUIRED;
  }
  if (!RX_NUMBER.test(String(value).trim())) {
    return kind === 'entry' ? ERR.ENTRY_FORMAT : ERR.EXIT_FORMAT;
  }
  const n = parseNumPL(value);
  if (!Number.isFinite(n) || n <= 0) {
    return kind === 'entry' ? ERR.ENTRY_FORMAT : ERR.EXIT_FORMAT;
  }
  return null;
}

export function validateOptionalPrice(value, kind = 'sl') {
  if (value == null || String(value).trim() === '') return null;
  if (!RX_NUMBER.test(String(value).trim())) {
    return kind === 'sl' ? ERR.SL_FORMAT : ERR.TP_FORMAT;
  }
  const n = parseNumPL(value);
  if (!Number.isFinite(n) || n <= 0) {
    return kind === 'sl' ? ERR.SL_FORMAT : ERR.TP_FORMAT;
  }
  return null;
}

export function validateLot(value) {
  if (value == null || String(value).trim() === '') return ERR.LOT_REQUIRED;
  if (!RX_NUMBER.test(String(value).trim())) return ERR.LOT_FORMAT;
  const n = parseNumPL(value);
  if (!Number.isFinite(n)) return ERR.LOT_FORMAT;

  if (n < 0.01) return ERR.LOT_MIN;
  if (n > 100) return ERR.LOT_MAX;
  return null;
}

export function validateDate(value) {
  if (!value || !String(value).trim()) return ERR.DATE_REQUIRED;
  const d = new Date(value);
  if (isNaN(d.getTime())) return ERR.DATE_INVALID;

  if (d.getTime() > Date.now() + 60_000) return ERR.DATE_FUTURE;
  return null;
}

export function validateTag(value) {
  if (!value || !value.trim()) return null;
  if (!RX_TAG.test(value.trim())) return ERR.TAG_FORMAT;
  return null;
}

export function validateNote(value) {
  if (!value) return null;
  if (value.length > 500) return ERR.NOTE_TOO_LONG;
  return null;
}

export function validateTrade(data) {
  // Walidacja całej transakcji zbiera błędy według nazw pól.
  const errors = {};

  const checks = [
    ['pair',  validatePair(data.pair)],
    ['dir',   validateDir(data.dir)],
    ['entry', validatePrice(data.entry, 'entry')],
    ['exit',  validatePrice(data.exit, 'exit')],
    ['sl',    validateOptionalPrice(data.sl, 'sl')],
    ['tp',    validateOptionalPrice(data.tp, 'tp')],
    ['lot',   validateLot(data.lot)],
    ['date',  validateDate(data.date)],
    ['note',  validateNote(data.note)],
  ];

  checks.forEach(([field, err]) => { if (err) errors[field] = err; });
  return { valid: Object.keys(errors).length === 0, errors };
}
