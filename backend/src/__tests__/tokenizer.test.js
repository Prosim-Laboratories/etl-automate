// tokenizer.test.js
import { tokenize } from '../tokenizer.js';

describe('tokenize()', () => {
  /** Minimal ctx so the tokenizer can label cell / range tokens. */
  const ctx = {
    A1: '1',             // numeric string
    B1: 2,               // real number
    C1: 'Hello',
    D1: '$5',
    'A1:B1': 'stub'      // range value is swapped in by etl-runner – any stub ok
  };

  test('simple number literal', () => {
    const t = tokenize('3 + 4', ctx);
    expect(t.map(x => x.type)).toEqual(['number', 'op', 'number']);
    expect(t[0].value).toBe(3);
  });

  test('cell reference labelled from ctx', () => {
    const t = tokenize('A1 + B1', ctx);
    expect(t[0]).toMatchObject({ raw: 'A1',  type: 'number',   value: '1' });
    expect(t[2]).toMatchObject({ raw: 'B1',  type: 'number',   value: 2   });
  });

  test('range token produced & tagged', () => {
    const t = tokenize('(A1:B1) + 1', ctx);
    expect(t.find(x => x.raw === 'A1:B1').type).toBe('text'); // 'stub'→text
  }); 
  test('currency literal', () => {
    const t = tokenize('$9.99 + $1', ctx);
    expect(t[0]).toMatchObject({ type: 'currency', value: '$9.99' });
  });

  test('ISO-code currency literal', () => {
    const t = tokenize('USD5 + 1', ctx);
    expect(t[0]).toMatchObject({ type: 'currency', value: 'USD5' });
  });

  test('bare words become text', () => {
    const t = tokenize('Foo + Bar', ctx);
    expect(t[0].type).toBe('text');
    expect(t[2].type).toBe('text');
  });
});
