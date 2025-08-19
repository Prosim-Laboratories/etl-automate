// __tests__/validation/etl-val.test.js

import { validateEtl } from '../validation/etl-val.js';

describe('validateEtl', () => {
  // helper to wrap async call
  const run = lines => validateEtl(lines);

  test('accepts simple addition between cells', async () => {
    await expect(run(['A1 + B2 -> C3'])).resolves.toBeUndefined();
  });

  test('accepts numeric literals in expressions', async () => {
    await expect(run(['(A1 + 2) * 3.5 -> D4'])).resolves.toBeUndefined();
  });

  test('accepts a single cell passthrough', async () => {
    await expect(run(['A10 -> Z99'])).resolves.toBeUndefined();
  });

  test('accepts nested parentheses', async () => {
    await expect(run(['((A1+B1)-(C1/D1))*2 -> F3'])).resolves.toBeUndefined();
  });

  test('accepts sheet reference on RHS', async () => {
    await expect(run(['A1 + B1 -> S1(C1)'])).resolves.toBeUndefined();
  });

  test('accepts sheet reference in LHS', async () => {
    await expect(run(['S1(A1) + S1(B2) -> C3'])).resolves.toBeUndefined();
  });

  test('accepts mixed sheet and cell references', async () => {
    await expect(run(['S2(A1) + B2 -> S1(C3)'])).resolves.toBeUndefined();
  });

  test('rejects when missing arrow', async () => {
    await expect(run(['A1 + B1 C2'])).rejects.toThrow(/missing "->"/);
  });

  test('rejects invalid RHS (not a cell, range, or sheet)', async () => {
    await expect(run(['A1 + B1 -> 123'])).rejects.toThrow(/RHS must be a single cell, range, or sheet reference/);
  });

  test('rejects invalid expression on LHS', async () => {
    await expect(run(['+A1 -> B1'])).rejects.toThrow(/invalid expression on LHS/);
  });

  test('rejects unknown tokens', async () => {
    await expect(run(['A1 $ B1 -> C1'])).rejects.toThrow(/invalid token "\$"/);
  });

  test('rejects exclamation tokens', async () => {
    await expect(run(['A1 ! B1 -> C1'])).rejects.toThrow(/invalid token "!"/);
  });

  test('collects multiple errors across lines', async () => {
    const lines = [
      'A1 + -> B1',      // invalid expression
      'C1 + D1 -> 2E',   // invalid cell on RHS
      'A1 + B1 -> SX()'  // invalid sheet reference
    ];
    await expect(run(lines)).rejects.toThrow(
      /Line 1: invalid expression on LHS\s*Line 2: RHS must be a single cell, range, or sheet reference[\s\S]*Line 3: invalid sheet reference/
    );
  });
});
