// @author Kamil Piorkowski

import { $, $$, el, clear } from '../dom.js';
import { initTheme, bindThemeToggle } from '../motyw.js';
import { highlightActiveNav, bindTopbarScroll } from '../nawigacja.js';
import { fmtNum, parseNumPL, fmtPLN, fmtR } from '../formatowanie.js';
import {
  validateTrade, validatePair, validateDir, validatePrice,
  validateOptionalPrice, validateLot, validateDate, validateNote, ERR,
} from '../walidacja.js';
import { addTrade, updateTrade, getTradeById, computePips, computePnL, computeR, newTradeId } from '../transakcje.js';
import { simulateAsyncSave } from '../kursy.js';
import { toast } from '../interfejs.js';
import { CURRENCY_PAIRS, TAG_SUGGESTIONS } from '../dane-startowe.js';

initTheme();

const STATE = {
  // Stan formularza trzymamy tutaj zamiast czytać ciągle z DOM.
  step: 0,
  editId: null,
  data: {
    pair: '', dir: '', entry: '', exit: '', sl: '', tp: '',
    lot: '0,10', date: '', tags: [], note: '',
  },
};

function tryLoadEditMode() {
  // Parametr ?id=... oznacza edycję istniejącej transakcji.
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) return false;
  const trade = getTradeById(id);
  if (!trade) return false;
  STATE.editId = id;
  STATE.data = {
    pair: trade.pair || '',
    dir: trade.dir || '',
    entry: trade.entry != null ? String(trade.entry).replace('.', ',') : '',
    exit:  trade.exit  != null ? String(trade.exit).replace('.', ',')  : '',
    sl:    trade.sl    != null ? String(trade.sl).replace('.', ',')    : '',
    tp:    trade.tp    != null ? String(trade.tp).replace('.', ',')    : '',
    lot:   trade.lot   != null ? String(trade.lot).replace('.', ',')   : '0,10',
    date:  trade.date || '',
    tags:  Array.isArray(trade.tags) ? [...trade.tags] : [],
    note:  trade.note || '',
  };
  return true;
}

function applyEditModeUI() {
  const h1 = document.querySelector('h1');
  if (h1) h1.textContent = 'Edytuj transakcję';
  const sub = document.querySelector('.page-head .sub');
  if (sub) sub.textContent = 'Zmień co potrzeba i zapisz.';
  document.title = 'Edytuj transakcję · VisTrade';

  const setVal = (sel, val) => { const n = document.querySelector(sel); if (n) n.value = val; };
  setVal('#f-pair',  STATE.data.pair);
  setVal('#f-lot',   STATE.data.lot);
  setVal('#f-entry', STATE.data.entry);
  setVal('#f-exit',  STATE.data.exit);
  setVal('#f-sl',    STATE.data.sl);
  setVal('#f-tp',    STATE.data.tp);
  setVal('#f-date',  STATE.data.date);
  setVal('#f-note',  STATE.data.note);
  setVal('#f-tags',  STATE.data.tags.join(', '));

  document.querySelectorAll('.dir-toggle button').forEach((b) => {
    const isMatch = b.dataset.dir === STATE.data.dir;
    b.classList.toggle('active', isMatch);
    b.classList.toggle(b.dataset.dir, isMatch);
    b.setAttribute('aria-checked', isMatch ? 'true' : 'false');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  highlightActiveNav();
  bindThemeToggle($('#theme-toggle'));
  bindTopbarScroll();

  const isEdit = tryLoadEditMode();
  if (!isEdit) {
    const now = new Date();
    now.setSeconds(0, 0);
    STATE.data.date = toLocalDateTimeString(now);
  }

  populatePairSelect();
  populateTagSuggestions();
  bindFormFields();
  bindWizardNav();
  bindRealtimeValidation();

  if (isEdit) applyEditModeUI();

  render();
});

function toLocalDateTimeString(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function populatePairSelect() {
  const sel = $('#f-pair');
  if (!sel) return;

  CURRENCY_PAIRS.forEach((p) => {
    sel.appendChild(el('option', { attrs: { value: p }, text: p }));
  });
  sel.value = '';
}

function populateTagSuggestions() {
  const list = $('#tag-suggestions');
  if (!list) return;

  TAG_SUGGESTIONS.forEach((tag) => {
    list.appendChild(el('option', { attrs: { value: tag } }));
  });

  const dateInput = $('#f-date');
  if (dateInput) dateInput.value = STATE.data.date;
}

function bindFormFields() {
  // Kliknięcia i inputy aktualizują STATE.
  $$('.dir-toggle button').forEach((b) => {
    b.addEventListener('click', () => {
      const parent = b.parentElement;
      $$('button', parent).forEach((s) => {
        s.classList.remove('active', 'long', 'short');
        s.setAttribute('aria-checked', 'false');
      });
      b.classList.add('active', b.dataset.dir);
      b.setAttribute('aria-checked', 'true');
      STATE.data.dir = b.dataset.dir;
      runFieldValidation('dir');
    });
  });

  bindInput('#f-pair',  'pair');
  bindInput('#f-lot',   'lot');
  bindInput('#f-entry', 'entry');
  bindInput('#f-exit',  'exit');
  bindInput('#f-sl',    'sl');
  bindInput('#f-tp',    'tp');
  bindInput('#f-date',  'date');
  bindInput('#f-note',  'note');

  const tagInput = $('#f-tags');
  if (tagInput) {
    tagInput.addEventListener('input', (e) => {
      const raw = e.target.value;
      STATE.data.tags = raw
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
    });
  }
}

function bindInput(selector, key) {
  const node = $(selector);
  if (!node) return;
  node.addEventListener('input', (e) => {
    STATE.data[key] = e.target.value;
  });
}

function bindRealtimeValidation() {
  const map = [
    ['#f-pair',  'pair',  () => validatePair(STATE.data.pair)],
    ['#f-lot',   'lot',   () => validateLot(STATE.data.lot)],
    ['#f-entry', 'entry', () => validatePrice(STATE.data.entry, 'entry')],
    ['#f-exit',  'exit',  () => validatePrice(STATE.data.exit,  'exit')],
    ['#f-sl',    'sl',    () => validateOptionalPrice(STATE.data.sl, 'sl')],
    ['#f-tp',    'tp',    () => validateOptionalPrice(STATE.data.tp, 'tp')],
    ['#f-date',  'date',  () => validateDate(STATE.data.date)],
    ['#f-note',  'note',  () => validateNote(STATE.data.note)],
  ];
  map.forEach(([sel, key, fn]) => {
    const node = $(sel);
    if (!node) return;
    const handler = () => setFieldError(key, fn());
    node.addEventListener('blur',  handler);
    node.addEventListener('input', handler);
  });
}

function runFieldValidation(field) {
  const result = validateTrade(STATE.data);
  setFieldError(field, result.errors[field] || null);
}

function setFieldError(field, msg) {
  const wrap = $(`.field[data-field="${field}"]`);
  if (!wrap) return;
  const errNode = wrap.querySelector('.field-error');
  if (msg) {
    wrap.classList.add('has-error');
    if (errNode) errNode.textContent = msg;
  } else {
    wrap.classList.remove('has-error');
    if (errNode) errNode.textContent = '';
  }
}

function clearAllErrors() {
  $$('.field.has-error').forEach((f) => f.classList.remove('has-error'));
}

function bindWizardNav() {
  $('#btn-next')?.addEventListener('click', () => goNext());
  $('#btn-prev')?.addEventListener('click', () => goPrev());
  $('#trade-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    submit();
  });
}

const STEP_FIELDS = [
  // Każdy krok ma swoje pola do sprawdzenia.
  ['dir'],
  ['pair', 'lot'],
  ['entry', 'exit', 'sl', 'tp'],
  ['date', 'note'],
];

function validateCurrentStep() {
  const fields = STEP_FIELDS[STATE.step] || [];
  const result = validateTrade(STATE.data);
  let firstErr = null;
  fields.forEach((f) => {
    const msg = result.errors[f] || null;
    setFieldError(f, msg);
    if (msg && !firstErr) firstErr = msg;
  });
  return firstErr === null;
}

function goNext() {
  if (!validateCurrentStep()) {
    toast('Sprawdź zaznaczone pola.', { variant: 'loss' });
    return;
  }
  if (STATE.step < STEP_FIELDS.length - 1) {
    STATE.step += 1;
    render();
  } else {
    submit();
  }
}

function goPrev() {
  if (STATE.step > 0) {
    STATE.step -= 1;
    render();
  }
}

async function submit() {
  // Przed zapisem sprawdzamy cały formularz jeszcze raz.
  const result = validateTrade(STATE.data);
  if (!result.valid) {
    Object.entries(result.errors).forEach(([f, msg]) => setFieldError(f, msg));
    toast('Formularz zawiera błędy.', { variant: 'loss' });

    for (let i = 0; i < STEP_FIELDS.length; i += 1) {
      if (STEP_FIELDS[i].some((f) => result.errors[f])) { STATE.step = i; render(); break; }
    }
    return;
  }

  const entry = parseNumPL(STATE.data.entry);
  const exit  = parseNumPL(STATE.data.exit);
  const sl    = STATE.data.sl ? parseNumPL(STATE.data.sl) : null;
  const tp    = STATE.data.tp ? parseNumPL(STATE.data.tp) : null;
  const lot   = parseNumPL(STATE.data.lot);
  const pip = computePips(STATE.data.pair, STATE.data.dir, entry, exit);
  const pnl = computePnL(STATE.data.pair, STATE.data.dir, entry, exit, lot);
  const rr  = computeR(STATE.data.dir, entry, exit, sl);

  const trade = {
    // To jest obiekt, który finalnie trafia do localStorage.
    id: STATE.editId || newTradeId(),
    pair: STATE.data.pair,
    dir: STATE.data.dir,
    entry, exit, sl, tp, lot,
    pip, pnl, rr,
    date: STATE.data.date,
    tags: STATE.data.tags,
    note: STATE.data.note || '',
  };

  const btnSave = $('#btn-next');
  if (btnSave) {
    btnSave.disabled = true;
    btnSave.textContent = 'Zapisuję…';
  }
  await simulateAsyncSave(trade, 480);

  if (STATE.editId) {
    updateTrade(STATE.editId, trade);
    toast('Zapisano zmiany.', { variant: trade.pnl >= 0 ? 'win' : 'loss' });
  } else {
    addTrade(trade);
    toast('Zapisano transakcję.', { variant: trade.pnl >= 0 ? 'win' : 'loss' });
  }
  setTimeout(() => { window.location.href = 'transakcje.html'; }, 700);
}

function render() {
  // Render przełącza widoczny krok i tekst przycisków.
  const step = STATE.step;

  $$('.wizard-step').forEach((s, i) => {
    s.classList.toggle('active', i === step);
    s.classList.toggle('done',   i <  step);
  });
  $$('.wizard-pane').forEach((p, i) => p.classList.toggle('active', i === step));

  const btnPrev = $('#btn-prev');
  const btnNext = $('#btn-next');
  if (btnPrev) btnPrev.style.visibility = step === 0 ? 'hidden' : 'visible';
  if (btnNext) {
    btnNext.disabled = false;
    if (step === STEP_FIELDS.length - 1) {
      btnNext.textContent = STATE.editId ? 'Zapisz zmiany' : 'Zapisz transakcję';
    } else {
      btnNext.textContent = 'Dalej';
    }
  }

  if (step === STEP_FIELDS.length - 1) buildSummary();

  clearAllErrors();
}

function buildSummary() {
  // Podsumowanie liczymy na żywo z aktualnych pól.
  const list = $('#summary');
  if (!list) return;
  clear(list);

  const entry = parseNumPL(STATE.data.entry);
  const exit  = parseNumPL(STATE.data.exit);
  const sl    = STATE.data.sl ? parseNumPL(STATE.data.sl) : null;
  const lot   = parseNumPL(STATE.data.lot);
  const pip   = Number.isFinite(entry) && Number.isFinite(exit)
    ? computePips(STATE.data.pair, STATE.data.dir, entry, exit) : NaN;
  const pnl   = Number.isFinite(entry) && Number.isFinite(exit) && Number.isFinite(lot)
    ? computePnL(STATE.data.pair, STATE.data.dir, entry, exit, lot) : NaN;
  const rr    = Number.isFinite(entry) && Number.isFinite(exit) && sl !== null
    ? computeR(STATE.data.dir, entry, exit, sl) : null;

  const rows = [
    ['Para',            STATE.data.pair || '—'],
    ['Kierunek',        STATE.data.dir === 'long' ? 'Long (kupno)' : (STATE.data.dir === 'short' ? 'Short (sprzedaż)' : '—')],
    ['Wielkość',        lot ? `${fmtNum(lot, 2)} lota` : '—'],
    ['Cena wejścia',    Number.isFinite(entry) ? fmtNum(entry, 4) : '—'],
    ['Cena wyjścia',    Number.isFinite(exit)  ? fmtNum(exit, 4)  : '—'],
    ['Stop loss',       sl !== null ? fmtNum(sl, 4) : '—'],
    ['Take profit',     STATE.data.tp ? fmtNum(parseNumPL(STATE.data.tp), 4) : '—'],
    ['Pip',             Number.isFinite(pip) ? fmtNum(pip, 1) : '—'],
    ['Szacowany P&L',   Number.isFinite(pnl) ? fmtPLN(pnl)  : '—'],
    ['R-multiple',      rr !== null ? fmtR(rr) : '—'],
    ['Data',            STATE.data.date || '—'],
    ['Tagi',            STATE.data.tags.join(', ') || '—'],
  ];
  rows.forEach(([k, v]) => {
    list.appendChild(el('dt', { text: k }));
    list.appendChild(el('dd', { text: v }));
  });
}
