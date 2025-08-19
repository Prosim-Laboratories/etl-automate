/**
 * tokenizer.js
 * -------------------------------------------------------------------
 * Token shape:
 *   { raw, type:'number'|'currency'|'text'|'op'|'lp'|'rp'|'sheet', value }
 */

import { detect } from './operand.js';

const OPS     = '+-*/';
const ISO_CUR = /^[A-Z]{3}\d/;
const CUR_SYM = '$£€¥';

export function tokenize(expr, ctx = {}) {
  const tok = [];
  const push = (raw, type, value = raw) => tok.push({ raw, type, value });

  let i = 0;
  while (i < expr.length) {
    const ch = expr[i];

    // whitespace
    if (/\s/.test(ch)) { i++; continue; }

    // operators & parens
    if (OPS.includes(ch)) { push(ch, 'op'); i++; continue; }
    if (ch === '(')        { push(ch, 'lp'); i++; continue; }
    if (ch === ')')        { push(ch, 'rp'); i++; continue; }

    // sheet ref S0(A1)
    const sheetMatch = /^S(\d+)\([A-Za-z]+\d+\)/.exec(expr.slice(i));
    if (sheetMatch) {
      push(sheetMatch[0], 'sheet', sheetMatch[0]);
      i += sheetMatch[0].length;
      continue;
    }

    // letter-start: cell, range, or ISO-currency or text literal
    if (/[A-Za-z]/.test(ch)) {
      let j = i;
      while (j < expr.length && /[A-Za-z]/.test(expr[j])) j++;
      let k = j;
      while (k < expr.length && /\d/.test(expr[k])) k++;

      // maybe range A1:B5
      if (expr[k] === ':') {
        k++;
        while (k < expr.length && /[A-Za-z]/.test(expr[k])) k++;
        while (k < expr.length && /\d/.test(expr[k])) k++;
      }

      const raw = expr.slice(i, k);
      const cellVal = ctx[raw];
      if (cellVal === undefined && ISO_CUR.test(raw)) {
        push(raw, 'currency', raw);
      } else if (cellVal === undefined && raw.match(/^[A-Za-z]+$/)) {
        push(raw, 'text', raw);
      } else {
        const type = detect(cellVal ?? 0);
        push(raw, type, cellVal ?? 0);
      }

      i = k;
      continue;
    }

    // numbers
    if (/\d/.test(ch) || (ch === '.' && /\d/.test(expr[i+1]))) {
      let j = i, dot = false;
      while (j < expr.length && (/\d/.test(expr[j]) || (!dot && expr[j] === '.'))) {
        if (expr[j] === '.') dot = true;
        j++;
      }
      const raw = expr.slice(i, j);
      push(raw, 'number', Number(raw));
      i = j;
      continue;
    }

    // currency symbol
    if (CUR_SYM.includes(ch)) {
      let j = i+1;
      while (j < expr.length && (/\d/.test(expr[j])||expr[j]==='.'||expr[j]===',')) j++;
      const raw = expr.slice(i, j);
      push(raw, 'currency', raw);
      i = j;
      continue;
    }

    throw new Error(`Unexpected character “${ch}” in "${expr}"`);
  }

  return tok;
}
