/**
 * validation/etl-val.js
 * ─────────────────────────────────────────────────────────────────────
 * DSL line shape:
 *
 *     <expression>  ->  <target>
 *
 * Operands allowed on LHS:
 *   • CELL      –  A1, XYZ134
 *   • SHEET REF –  S0(A1), S1(B2), etc.
 *   • NUM       –  2, 3.14
 *   • RANGE     –  A3:B3, AA1:BB25
 *
 * Target (RHS) must be exactly one of:
 *   • CELL
 *   • SHEET REF
 *   • RANGE
 *   • Numeric or text literals are not allowed.
 *
 * If any RANGE appears on the LHS or RHS, its dimensions must match
 * the other side.
 */

/* ── token kinds ──────────────────────────────────────────────────── */
const TOKEN = {
  RANGE : 1,
  CELL  : 2,
  NUM   : 3,
  SHEET : 4,
  OP    : 5,
  LP    : 6,
  RP    : 7,
  ARROW : 8
};

/* ── regexes ─────────────────────────────────────────────────────── */
const SHEET_RE  = /^S\d+\([^)]*\)$/;        // e.g. S0(A1+ C1)
const RANGE_RE  = /^[A-Za-z]+\d+:[A-Za-z]+\d+$/;
const CELL_RE   = /^[A-Za-z]+\d+$/;
const ARROW_RE  = /->/;
const COMMENT_RE = /^#/; // To identify comment lines (lines starting with #)

/* ── tokeniser ─────────────────────────────────────────────────── */
function tokenize(src) {
  const tokens = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (/\s/.test(ch)) { i++; continue; }

    // arrow
    if (src.slice(i).startsWith('->')) {
      tokens.push({ t: TOKEN.ARROW, v: '->' });
      i += 2; continue;
    }
    // operators
    if ('+-*/'.includes(ch)) {
      tokens.push({ t: TOKEN.OP, v: ch }); i++; continue; 
    }
    if (ch === '(') { tokens.push({ t: TOKEN.LP, v: ch }); i++; continue; }
    if (ch === ')') { tokens.push({ t: TOKEN.RP, v: ch }); i++; continue; }

    // sheet ref
    const sheetMatch = src.slice(i).match(/^S\d+\([^)]*\)/);
    if (sheetMatch) {
      tokens.push({ t: TOKEN.SHEET, v: sheetMatch[0] });
      i += sheetMatch[0].length; continue;
    }
    // range or cell or numeric
    const wordMatch = src.slice(i).match(/^[A-Za-z]+\d+(:[A-Za-z]+\d+)?/);
    if (wordMatch) {
      const raw = wordMatch[0];
      if (RANGE_RE.test(raw)) tokens.push({ t: TOKEN.RANGE, v: raw });
      else                    tokens.push({ t: TOKEN.CELL,  v: raw });
      i += raw.length; continue;
    }
    const numMatch = src.slice(i).match(/^\d+(?:\.\d+)?/);
    if (numMatch) {
      tokens.push({ t: TOKEN.NUM, v: numMatch[0] });
      i += numMatch[0].length; continue;
    }

    // anything else is invalid
    tokens.push({ t: null, v: ch });
    i++;
  }
  return tokens;
}

/* ── LHS expression validator ──────────────────────────────────────── */
function isValidExpr(tokens, from, to) {
  let expectOperand = true;
  let depth         = 0;
  for (let i = from; i < to; i++) {
    const tk = tokens[i];
    switch (tk.t) {
      case TOKEN.CELL:
      case TOKEN.SHEET:
      case TOKEN.RANGE:
      case TOKEN.NUM:
        if (!expectOperand) return false;
        expectOperand = false;
        break;
      case TOKEN.LP:
        if (!expectOperand) return false;
        depth++;
        break;
      case TOKEN.RP:
        if (expectOperand || depth === 0) return false;
        depth--;
        expectOperand = false;
        break;
      case TOKEN.OP:
        if (expectOperand) return false;
        expectOperand = true;
        break;
      default:
        return false;
    }
  }
  return !expectOperand && depth === 0;
}

/* ── helper: compute rows & cols from RANGE str ──────────────────── */
function colToNum(col) {
  return col.toUpperCase().split('').reduce((acc,ch)=> acc*26 + (ch.charCodeAt(0)-64), 0);
}
function rangeDims(rng) {
  const [s,e] = rng.split(':');
  const m1 = /^([A-Za-z]+)(\d+)$/.exec(s);
  const m2 = /^([A-Za-z]+)(\d+)$/.exec(e);
  if (!m1 || !m2) return { rows:0, cols:0 };
  const rows = Math.abs(+m1[2] - +m2[2]) + 1;
  const cols = Math.abs(colToNum(m1[1]) - colToNum(m2[1])) + 1;
  return { rows, cols };
}

/* ── main export ──────────────────────────────────────────────────── */
export async function validateEtl(lines) {
  const errors = [];
  for (let ln = 0; ln < lines.length; ln++) {
    const src = lines[ln].trim();

    // Skip comment lines
    if (COMMENT_RE.test(src)) {
      continue;
    }

    // Process metadata (input, output, overwrite)
    const metaMatch = /^input\s*[:=]\s*.+$/i.test(src) ||
                      /^output\s*[:=]\s*.+$/i.test(src) ||
                      /^overwrite\s*[:=]\s*(true|false)$/i.test(src);
    if (metaMatch) {
      continue;
    }

    if (!src) continue;  // Skip empty lines

    // split arrow
    const parts = src.split('->').map(s=>s.trim());
    if (parts.length !== 2) {
      errors.push(`Line ${ln+1}: missing "->"\ `);
      continue; // Skip lines with missing "->"
    }
    const [lhsRaw, rhsRaw] = parts;
    const tokens = tokenize(src);

    // 1️⃣ invalid token on LHS?
    const arrowIdx = tokens.findIndex(t=>t.t===TOKEN.ARROW);
    const lhsTokens = tokens.slice(0, arrowIdx);
    const bad = lhsTokens.find(t=> t.t===null );
    if (bad) {
      errors.push(`Line ${ln+1}: invalid token "${bad.v}"`);
      continue;
    }

    // 2️⃣ invalid sheet reference?
    if (rhsRaw.startsWith('S') && rhsRaw.includes('(') && !SHEET_RE.test(rhsRaw)) {
      errors.push(`Line ${ln+1}: invalid sheet reference`);
      continue;
    }
    // 3️⃣ invalid RHS syntax?
    if (!CELL_RE.test(rhsRaw) && !RANGE_RE.test(rhsRaw) && !SHEET_RE.test(rhsRaw)) {
      errors.push(`Line ${ln+1}: RHS must be a single cell, range, or sheet reference`);
      continue;
    }

    // 4️⃣ LHS expression syntax
    if (!isValidExpr(tokens, 0, arrowIdx)) {
      errors.push(`Line ${ln+1}: invalid expression on LHS`);
      continue;
    }

    // 5️⃣ dimension logic only when ranges present
    const lhsRanges = lhsTokens.filter(t=> t.t===TOKEN.RANGE ).map(t=>t.v);
    const rhsIsRange = RANGE_RE.test(rhsRaw);
    if (lhsRanges.length || rhsIsRange) {
      // compute LHS dims
      let target = { rows:1, cols:1 };
      if (lhsRanges.length) {
        target = rangeDims(lhsRanges[0]);
        for (let r of lhsRanges.slice(1)) {
          const d = rangeDims(r);
          if (d.rows!==target.rows || d.cols!==target.cols) {
            errors.push(`Line ${ln+1}: LHS ranges must have identical dimensions`);
            break;
          }
        }
      }
      // compute RHS dims
      const rdim = rhsIsRange ? rangeDims(rhsRaw) : { rows:1, cols:1 };
      if (rdim.rows!==target.rows || rdim.cols!==target.cols) {
        errors.push(
          `Line ${ln+1}: RHS dimensions ${rdim.rows}x${rdim.cols} do not match LHS ${target.rows}x${target.cols}`
        );
      }
    }
  }

  if (errors.length) throw new Error(errors.join('\n'));
}
