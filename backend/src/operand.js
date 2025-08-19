/**
 * operand.js
 * Pair-wise arithmetic aware of numbers, currency strings, and text.
 */

/* ------------------------------------------------------------------ */
/* 1️⃣  Type-detection helpers                                         */
/* ------------------------------------------------------------------ */

/* “real” currency symbol at the start of the string, e.g. £123 */
const CUR_SYM  = /^\s*([$£€¥])/;

/* ISO 4217 code followed by at least one digit, e.g. USD99, EUR7.50 */
const CUR_CODE = /^\s*[A-Z]{3}\d/;

/* Does the string look like a plain number (allow , and .)? */
const isNumericString = s => {
  if (typeof s !== 'string') return false;
  const clean = s.trim().replace(/,/g, '');
  return clean !== '' && !Number.isNaN(Number(clean));
};

/**
 * detect(v)
 *   → 'number' | 'currency' | 'text'
 */
export const detect = v =>
  typeof v === 'number'                              ? 'number'   :
  typeof v === 'string' && (CUR_SYM.test(v) ||
                             CUR_CODE.test(v))       ? 'currency' :
  isNumericString(v)                                 ? 'number'   :
                                                       'text';


/* ------------------------------------------------------------------ */
/* 2️⃣  Internal helpers                                               */
/* ------------------------------------------------------------------ */

/* numeric value of anything; strips non-numeric chars from strings */
const num = v =>
  typeof v === 'number'
    ? v
    : Number(String(v).replace(/[^0-9.-]/g, '') || '0');

/* 12-digit rounding to tame floating-point noise */
const rnd = x => Math.round((x + Number.EPSILON) * 1e12) / 1e12;

/**
 * pref(a, b, fn)
 * Chooses the output type based on a & b, applies fn() to their
 * numeric parts when arithmetic is needed, and decorates the result.
 */
const pref = (a, b, fn) => {
  const ta = detect(a);
  const tb = detect(b);

  /* Any text ⇒ concatenation */
  if (ta === 'text' || tb === 'text') return '' + a + b;

  /* Any currency ⇒ keep the currency symbol of the first currency value */
  if (ta === 'currency' || tb === 'currency') {
    const sym = (ta === 'currency' ? a : b).match(CUR_SYM)?.[1] ?? '';
    return sym + rnd(fn());
  }

  /* Plain numeric arithmetic */
  return rnd(fn());
};


/* ------------------------------------------------------------------ */
/* 3️⃣  Public arithmetic functions                                    */
/* ------------------------------------------------------------------ */

export const add = (a, b) => pref(a, b, () => num(a) + num(b));
export const sub = (a, b) => pref(a, b, () => num(a) - num(b));
export const mul = (a, b) => pref(a, b, () => num(a) * num(b));
export const div = (a, b) => pref(a, b, () => num(a) / num(b));
