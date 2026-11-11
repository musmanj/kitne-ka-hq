import type { Money } from './types';
/** Exact rational intermediates avoid rounding changing a threshold decision. */
export type Rational = { n: bigint; d: bigint };
export const rat = (n: bigint, d = 1n): Rational => {
  if (d <= 0n) throw new RangeError('Positive denominator required');
  let a = n < 0n ? -n : n, b = d;
  while (b !== 0n) { const r = a % b; a = b; b = r; }
  return { n: n / a, d: d / a };
};
export const add = (a: Rational, b: Rational): Rational => rat(a.n * b.d + b.n * a.d, a.d * b.d);
export const sub = (a: Rational, b: Rational): Rational => rat(a.n * b.d - b.n * a.d, a.d * b.d);
export const mul = (a: Rational, n: bigint, d = 1n): Rational => rat(a.n * n, a.d * d);
export const cmp = (a: Rational, b: Rational): number => {
  const v = a.n * b.d - b.n * a.d; return v < 0n ? -1 : v > 0n ? 1 : 0;
};
export const asNumber = (a: Rational): number => Number(a.n) / Number(a.d);
export function halfEven(a: Rational): bigint {
  const sign = a.n < 0n ? -1n : 1n, n = a.n * sign;
  const q = n / a.d, r = n % a.d;
  return sign * (q + (r * 2n > a.d || (r * 2n === a.d && q % 2n !== 0n) ? 1n : 0n));
}
/** API v0.7 R3: projection overflow is server output failure, not invalid asking input. */
export class PriceOutputOverflowError extends RangeError {}
export function money(a: Rational): Money {
  const amount = halfEven(a);
  if (amount < 0n || amount > BigInt(Number.MAX_SAFE_INTEGER)) throw new PriceOutputOverflowError('PRICE_OUTPUT_OVERFLOW');
  return { amount_minor: Number(amount), currency: 'PKR' };
}
/** Sorted integer paisa inputs; linear h=(n-1)p, p represented as numerator/denominator. */
export function quantile(xs: readonly number[], numerator: number, denominator: number): Rational {
  if (!xs.length || !Number.isInteger(numerator) || !Number.isInteger(denominator) || denominator < 1 || numerator < 0 || numerator > denominator ||
      xs.some((x, i) => !Number.isSafeInteger(x) || (i > 0 && x < xs[i - 1]!))) throw new RangeError('Invalid quantile input');
  const h = (xs.length - 1) * numerator, lo = Math.floor(h / denominator), rem = h % denominator;
  const a = BigInt(xs[lo]!);
  return rat(a * BigInt(denominator) + BigInt((xs[Math.min(lo + 1, xs.length - 1)]! - xs[lo]!)) * BigInt(rem), BigInt(denominator));
}
export const median = (xs: readonly number[]): Rational => quantile(xs, 1, 2);

/** Exact decimal conversion for formula inputs; no binary arithmetic in rounding. */
export function decimalRational(value: number | string): Rational {
  if (typeof value === 'number' && !Number.isFinite(value)) throw new RangeError('Nonfinite decimal');
  const m = /^(-?)(\d+)(?:\.(\d+))?(?:e([+-]?\d+))?$/i.exec(String(value));
  if (!m) throw new RangeError('Invalid decimal');
  const digits = m[2]! + (m[3] ?? ''), power = Number(m[4] ?? 0) - (m[3]?.length ?? 0);
  if (!Number.isSafeInteger(power) || Math.abs(power) > 1000) throw new RangeError('Decimal exponent out of bounds');
  const n = BigInt(digits) * (m[1] ? -1n : 1n);
  return power >= 0 ? rat(n * 10n ** BigInt(power)) : rat(n, 10n ** BigInt(-power));
}
