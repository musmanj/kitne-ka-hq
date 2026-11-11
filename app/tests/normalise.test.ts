import { describe, expect, it } from 'vitest';
import { normalisePkr } from '../src/domain/normalise-pkr';
import { halfEven, money, rat } from '../src/domain/numeric';
describe('decimal PKR normaliser', () => {
  it.each([
    ['Rs 100,000', 10_000_000], [' PKR 1.5 LaKh ', 15_000_000], ['rs. 2 lac', 20_000_000],
    ['1 CRORE', 1_000_000_000], ['1.25k', 125_000], ['  Rs.12.50 K ', 1_250_000],
    ['1,23,456.78', 12_345_678], ['0.01', 1], [123.45, 12345], ['0002.000', 200],
    ['1.005', 100], ['1.015', 102], ['1.025', 102], ['1.035', 104], ['0.005', 0],
    ['0.015', 2], ['0.000015k', 2], ['90071992547409.91', Number.MAX_SAFE_INTEGER]
  ])('parses %s exactly to %s paisa', (input, minor) => {
    if (minor === 0) expect(normalisePkr(input)).toEqual({ ok: false, reason: 'ZERO' });
    else expect(normalisePkr(input)).toMatchObject({ ok: true, value: { amount_minor: minor, currency: 'PKR' } });
  });
  it.each([
    [NaN, 'NON_FINITE'], [Infinity, 'NON_FINITE'], ['-Infinity', 'NON_FINITE'], ['PKR Infinity', 'NON_FINITE'], ['NaN', 'NON_FINITE'],
    ['-1', 'NEGATIVE'], ['PKR -1 lakh', 'NEGATIVE'], [-2, 'NEGATIVE'], ['0', 'ZERO'], ['0.000', 'ZERO'],
    ['0.0049', 'ZERO'], ['90071992547409.92', 'TOO_LARGE'], ['9'.repeat(161), 'TOO_LARGE'],
    [undefined, 'NOT_A_NUMBER'], [null, 'NOT_A_NUMBER'], [true, 'NOT_A_NUMBER'], [{}, 'NOT_A_NUMBER'],
    ['', 'NOT_A_NUMBER'], ['garbage', 'NOT_A_NUMBER'], ['12,34', 'NOT_A_NUMBER'], ['1,234,56', 'NOT_A_NUMBER'],
    ['1e5', 'NOT_A_NUMBER'], ['1 000', 'NOT_A_NUMBER'], ['1..2', 'NOT_A_NUMBER'], ['+1', 'NOT_A_NUMBER'],
    ['1 lakh extra', 'NOT_A_NUMBER'], ['USD 100', 'UNSUPPORTED_CURRENCY'], ['Rs PKR 100', 'NOT_A_NUMBER'],
    ['10,000/month', 'NOT_A_NUMBER'], ['deposit 100', 'NOT_A_NUMBER'], ['1k EMI', 'NOT_A_NUMBER']
  ])('rejects %s with %s', (input, reason) => expect(normalisePkr(input)).toEqual({ ok: false, reason }));
  it.each([[1n, 2n, 0n], [3n, 2n, 2n], [5n, 2n, 2n], [-3n, 2n, -2n], [-5n, 2n, -2n]])('half-even %s/%s', (n, d, expected) => {
    expect(halfEven(rat(n, d))).toBe(expected);
  });
  it('rejects invalid rational and out-of-range output', () => {
    expect(() => rat(1n, 0n)).toThrow(); expect(() => money(rat(-1n))).toThrow();
    expect(() => money(rat(BigInt(Number.MAX_SAFE_INTEGER) + 1n))).toThrow();
  });
});
