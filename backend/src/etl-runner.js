// backend/src/etl-runner.js
import fs      from 'fs/promises';
import XLSX    from 'xlsx';
import { parse } from 'csv-parse/sync';
import * as ops  from './operand.js';
import { tokenize } from './tokenizer.js';

const CELL_RE = /([A-Za-z]+)(\d+)/;

// ── coordinate helpers ────────────────────────────────────────────
function colToIdx(col) {
  return col
    .toUpperCase()
    .split('')
    .reduce((v,ch) => v*26 + (ch.charCodeAt(0)-64), 0) - 1;
}

function idxToCol(i) {
  let n = i+1, s = '';
  while (n) {
    const r = (n-1) % 26;
    s = String.fromCharCode(65+r) + s;
    n = ((n-1)/26)|0;
  }
  return s;
}

function parseCell(c) {
  const m = CELL_RE.exec(c);
  if (!m) throw new Error(`Invalid cell "${c}"`);
  return [ Number(m[2]) - 1, colToIdx(m[1]) ];
}

function expandRange(str) {
  const [A,B] = str.split(':').map(s=>s.trim());
  const [r1,c1] = parseCell(A), [r2,c2] = parseCell(B);
  const out = [];
  for (let r = Math.min(r1,r2); r <= Math.max(r1,r2); r++)
    for (let c = Math.min(c1,c2); c <= Math.max(c1,c2); c++)
      out.push([r,c]);
  return out;
}

// ── core evaluator ─────────────────────────────────────────────────
function evalExpr(expr, ctx) {
  const tok = tokenize(expr, ctx);

  // fast path: only “+” chains
  const plusOnly =
    tok.every(t=>['number','currency','text','op'].includes(t.type)) &&
    tok.some(t=>t.type==='op') &&
    tok.every(t=>t.type!=='op' || t.raw==='+');

  if (plusOnly) {
    const vals  = tok.filter(t=>t.type!=='op').map(t=>t.value);
    const kinds = new Set(vals.map(v =>
      typeof v==='number' ? 'number' :
      typeof v==='string' && /^[^\d\s]/.test(v) ? 'currency' :
      typeof v==='string' && /^\d/.test(v) ? 'number' :
      'text'
    ));
    if (kinds.has('text') || kinds.size>1) {
      return vals.map(String).join('');
    }
    if (kinds.has('number')) {
      return vals.reduce((sum,v)=> sum + Number(v), 0);
    }
    // currency
    const sym = String(vals[0]).match(/^[^\d\s]+/)[0],
          tot = vals.reduce((sum,v)=> sum + Number(String(v).replace(/[^0-9.-]/g,'')), 0);
    return sym + tot;
  }

  // RPN fallback
  const outQ = [], opS = [], prec = {'+':1,'-':1,'*':2,'/':2};
  for (const t of tok) {
    if (['number','currency','text'].includes(t.type)) {
      outQ.push(t);
    } else if (t.type === 'op') {
      while (
        opS.length &&
        opS.at(-1).type==='op' &&
        prec[opS.at(-1).raw] >= prec[t.raw]
      ) {
        outQ.push(opS.pop());
      }
      opS.push(t);
    } else if (t.type === 'lp') {
      opS.push(t);
    } else if (t.type === 'rp') {
      while (opS.at(-1).type!=='lp') outQ.push(opS.pop());
      opS.pop();
    }
  }
  while (opS.length) outQ.push(opS.pop());

  const st = [];
  for (const t of outQ) {
    if (['number','currency','text'].includes(t.type)) {
      st.push(t.value);
    } else {
      const b = st.pop(), a = st.pop();
      st.push({ '+':ops.add, '-':ops.sub, '*':ops.mul, '/':ops.div }[t.raw](a,b));
    }
  }
  return st[0];
}

// ── file‐lock helpers ───────────────────────────────────────────────
async function assertFree(mode, p) {
  if (!p) return;
  const flags = mode==='read' ? 'rs+' : 'r+';
  const h = await fs.open(p, flags);
  await h.close();
}
const isLocked = e => ['EBUSY','EPERM','EACCES'].includes(e?.code);

// ── main ETL runner ───────────────────────────────────────────────
export async function runEtl(etlDef) {
  const { input, output, overwrite } = etlDef;
  const commands = Array.isArray(etlDef) ? etlDef : etlDef.commands;
  if (!Array.isArray(commands)) throw new Error('ETL definition missing commands[]');

  // 1️⃣ Load or clone workbook
  const isXlsxIn  = input?.toLowerCase().endsWith('.xlsx');
  const isXlsxOut = output?.toLowerCase().endsWith('.xlsx');
  const outExists = output && await fs.stat(output).then(()=>true).catch(()=>false);

  let outWb;
  if (isXlsxOut && !overwrite && outExists) {
    await assertFree('read', output);
    outWb = XLSX.readFile(output);
  } else if (isXlsxIn) {
    outWb = XLSX.readFile(input);
  } else {
    outWb = XLSX.utils.book_new();
  }

  // helper: ensure sheet at index idx (0-based) exists, return its name
  function ensureSheet(idx) {
    const names = outWb.SheetNames;
    if (idx < names.length) return names[idx];

    for (let i = names.length; i <= idx; i++) {
      const base = `Sheet${i+1}`;
      let name  = base, suffix = 1;
      while (outWb.SheetNames.includes(name)) {
        name = `${base}_${suffix++}`;
      }
      const ws = XLSX.utils.aoa_to_sheet([]);
      XLSX.utils.book_append_sheet(outWb, ws, name);
    }

    return outWb.SheetNames[idx];
  }

  // 2️⃣ Load input sheets into memory
  let sheetsIn = [];
  if (input) {
    await assertFree('read', input).catch(e=>{
      if (isLocked(e)) return console.warn('[ETL] input locked, skipping');
      throw e;
    });

    if (isXlsxIn) {
      const wbIn = XLSX.readFile(input);
      sheetsIn   = wbIn.SheetNames.map(n=> wbIn.Sheets[n]);
    } else {
      const txt = await fs.readFile(input, 'utf8');
      const aoa = parse(txt, { relax_column_count:true });
      sheetsIn   = [ XLSX.utils.aoa_to_sheet(aoa) ];
    }
  }

  // 3️⃣ Build baseCtx off sheet 0
  const baseCtx = {};
  {
    const ws0 = sheetsIn[0] || {};
    const ref = ws0['!ref'];
    if (ref) {
      const {s,e} = XLSX.utils.decode_range(ref);
      for (let R = s.r; R <= e.r; R++)
        for (let C = s.c; C <= e.c; C++) {
          const addr = XLSX.utils.encode_cell({r:R,c:C});
          baseCtx[`${idxToCol(C)}${R+1}`] = ws0[addr]?.v ?? 0;
        }
    }
  }

  const sheetRefRE = /S(\d+)\(([^)]+)\)/g;
  const RANGE_RE   = /[A-Za-z]+[0-9]+:[A-Za-z]+[0-9]+/g;

  // 4️⃣ Run each command
  for (const { expression, output: rawTgt } of commands) {
    let tgt     = rawTgt.trim();
    let toSheet = 0;

    // detect “S#(…)” on the RHS → sheet index is 1-based in the DSL
    const m = tgt.match(/^S(\d+)\((.+)\)$/);
    if (m) {
      toSheet = parseInt(m[1], 10) - 1;
      tgt      = m[2].trim();
      if (toSheet < 0) throw new Error(`Invalid sheet index S${m[1]}`);
    }

    // grab (or create) the right sheet
    const sheetName = ensureSheet(toSheet);
    const targetWs  = outWb.Sheets[sheetName];

    // pre-eval any nested sheet refs in the LHS
    const expr = expression.replace(sheetRefRE, (_, si, inner) => {
      const idx = parseInt(si,10) - 1;
      const ws  = sheetsIn[idx] || {};
      if (/^[A-Za-z]+\d+$/.test(inner)) {
        const [rr,cc] = parseCell(inner);
        const addr    = XLSX.utils.encode_cell({r:rr,c:cc});
        return String(ws[addr]?.v ?? 0);
      }
      // otherwise build a mini-ctx for that sheet
      const tmp = {};
      if (ws['!ref']) {
        const {s,e} = XLSX.utils.decode_range(ws['!ref']);
        for (let R=s.r; R<=e.r; R++)
          for (let C=s.c; C<=e.c; C++){
            const ad = XLSX.utils.encode_cell({r:R,c:C});
            tmp[`${idxToCol(C)}${R+1}`] = ws[ad]?.v ?? 0;
          }
      }
      return String(evalExpr(inner, tmp));
    });

    // if there are ranges on the LHS, build a per-element map
    const rngTokens = [...new Set(expr.match(RANGE_RE)||[])];
    const rangeMap  = Object.fromEntries(
      rngTokens.map(r=>[r, expandRange(r)])
    );

    // figure out the list of target coords
    const coords = tgt.includes(':')
      ? expandRange(tgt)
      : [ parseCell(tgt) ];

    // write out each one
    coords.forEach(([r,c], i) => {
      // new ctx for this element (if ranges)
      const ctx = Object.create(baseCtx);
      for (const tk of rngTokens) {
        const [rr,cc] = rangeMap[tk][i];
        ctx[tk] = baseCtx[`${idxToCol(cc)}${rr+1}`] ?? 0;
      }

      const val  = evalExpr(expr, ctx);
      const addr = XLSX.utils.encode_cell({r,c});
      // preserve original number format (currency) if present
      const orig = sheetsIn[toSheet]?.[addr];
      const cell = { v: val, t: typeof val==='number'? 'n':'s' };
      if (orig && orig.t==='n' && orig.z) cell.z = orig.z;
      targetWs[addr] = cell;
    });

    // bump the sheet’s !ref so Excel sees your new cells
    {
      const old = targetWs['!ref']||'A1:A1';
      const {s,e} = XLSX.utils.decode_range(old);
      const upd   = { s:{...s}, e:{...e} };
      coords.forEach(([r,c]) => {
        upd.e.r = Math.max(upd.e.r, r);
        upd.e.c = Math.max(upd.e.c, c);
      });
      targetWs['!ref'] = XLSX.utils.encode_range(upd);
    }
  }

  // 5️⃣ Save back out
  try { await assertFree('write', output); }
  catch (e) { if (isLocked(e)) return console.warn('[ETL] output locked'); else throw e; }

  if (isXlsxOut) {
    XLSX.writeFile(outWb, output);
  } else {
    // CSV fallback from sheet 0
    const aoa = XLSX.utils.sheet_to_json(
      outWb.Sheets[outWb.SheetNames[0]], { header:1, raw:true }
    );
    const txt = aoa.map(r=>r.map(v=>v??'').join(',')).join('\n');
    await fs.writeFile(output, txt, 'utf8');
  }
}
