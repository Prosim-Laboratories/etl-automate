// operand.test.js
import { detect, add, sub, mul, div } from '../operand.js';

describe('detect()', () => {
  test('real numbers', () => {
    expect(detect(7)).toBe('number');
  });

  test('numeric strings', () => {
    expect(detect('42')).toBe('number');
    expect(detect('1,234.5')).toBe('number');
  });

  test('currency symbols', () => {
    expect(detect('$9')).toBe('currency');
    expect(detect('  €7.5')).toBe('currency');
  });

  test('ISO-code currency', () => {
    expect(detect('GBP10')).toBe('currency');
  });

  test('plain text', () => {
    expect(detect('Hello')).toBe('text');
  });
});

describe('arithmetic helpers', () => {
  test('numeric addition', () => {
    expect(add(1, 2)).toBe(3);
    expect(add('1', '1')).toBe(2);          // formerly “11”
  });

  test('currency addition keeps symbol', () => {
    expect(add('$2', '$3')).toBe('$5');
    expect(add('$2', 3)).toBe('$5');
  });

  test('text concatenation', () => {
    expect(add('Hello', 'World')).toBe('HelloWorld');
    expect(sub('Foo', 'Bar')).toBe('FooBar'); // any op with text concatenates
  });

  test('basic math ops with rounding', () => {
    expect(sub(5, 2)).toBe(3);
    expect(mul(2, 3)).toBe(6);
    expect(div(6, 4)).toBeCloseTo(1.5);
  });
});
