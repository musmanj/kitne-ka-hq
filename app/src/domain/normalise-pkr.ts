import { halfEven, rat } from './numeric';
import { BARE_NUMBER_MAGNITUDE_POLICY, MAX_AMOUNT_MINOR, MIN_AMOUNT_MINOR } from './policy';
import type { Money } from './types';
export type NormaliseFailure = 'NOT_A_NUMBER' | 'NON_FINITE' | 'NEGATIVE' | 'ZERO' | 'TOO_SMALL' | 'TOO_LARGE' | 'UNSUPPORTED_CURRENCY';
export type PriceNormalizationError = NormaliseFailure;
export type NormaliseResult = { ok: true; value: Money; warnings?: Array<'UNMARKED_NUMBER' | 'MIXED_DIGIT_SCRIPTS'>; requires_confirmation?: true } | { ok: false; reason: NormaliseFailure };
/** spec v0.1 §3: parse decimal digits via bigint; never parseFloat.
 * Instalments/deposits/monthly prices must be rejected upstream, not stripped here. */
export function normalisePkr(input: unknown): NormaliseResult {
  const fail = (reason: NormaliseFailure): NormaliseResult => ({ ok: false, reason });
  // Engineering assumption retained by API v0.7 R1: finite number convenience uses its decimal string; strings preferred.
  if (typeof input === 'number' && !Number.isFinite(input)) return fail('NON_FINITE');
  if (typeof input === 'number') {
    if (input < 0) return fail('NEGATIVE');
    if (input === 0) return fail('ZERO');
    if (input < 0.005) return fail('ZERO');
    if (input > MAX_AMOUNT_MINOR / 100) return fail('TOO_LARGE');
  }
  if (typeof input !== 'string' && typeof input !== 'number') return fail('NOT_A_NUMBER');
  const original = String(input).trim();
  let text = '', codepoints = 0, asciiDigits = false, mappedDigits = false;
  // CTO R10 + PM v0.2 Addendum B: bounded one-to-one mapping, no NFKC/word guesses.
  for (const char of original) {
    if (++codepoints > 160) return fail('TOO_LARGE');
    const point = char.codePointAt(0)!;
    if (point >= 0x30 && point <= 0x39) asciiDigits = true;
    if ((point >= 0x06f0 && point <= 0x06f9) || (point >= 0x0660 && point <= 0x0669)) {
      mappedDigits = true; text += String(point >= 0x06f0 ? point - 0x06f0 : point - 0x0660);
    } else text += point === 0x066c ? ',' : point === 0x066b ? '.' : char;
  }
  // Engineering assumption retained by API v0.7 R1: concrete grammar budget160; bounded input required by §3.
  if (text.length > 160) return fail('TOO_LARGE'); // bounded parser, no giant bigint inputs
  if (/^(?:nan|[+-]?infinity)$/i.test(text)) return fail('NON_FINITE');
  if (/^(?:USD|EUR|GBP|AED|SAR|\$|€|£)/i.test(text)) return fail('UNSUPPORTED_CURRENCY');
  const hasCurrency = /^(?:pkr|rs\.?|₨)/i.test(text), hasCashSuffix = /\s*\/\-\s*$/.test(text);
  text = text.replace(/^(?:pkr|rs\.?|₨)\s*/i, '').replace(/\s*\/\-\s*$/, '').trim();
  if (/^(?:nan|[+-]?infinity)$/i.test(text)) return fail('NON_FINITE');
  const m = /^(-?)(\d{1,3}(?:,\d{3})+|\d{1,2}(?:,\d{2})*,\d{3}|\d+)(?:\.(\d+))?\s*(k|l|lacs?|lakhs?|cr|crores?)?$/i.exec(text);
  if (!m) return fail('NOT_A_NUMBER');
  if (m[1]) return fail('NEGATIVE');
  const digits = m[2]!.replaceAll(',', ''), decimals = m[3] ?? '';
  const coefficient = BigInt(digits + decimals);
  if (coefficient === 0n) return fail('ZERO');
  // CTO parser plural-alias ruling via steering, 9 Nov 01:31 PKT; values remain category-free.
  const factors: Record<string, bigint> = { k: 1000n, l: 100_000n, lac: 100_000n, lakh: 100_000n, cr: 10_000_000n, crore: 10_000_000n, crores: 10_000_000n, lacs: 100_000n, lakhs: 100_000n };
  const raw = rat(coefficient * (factors[(m[4] ?? '').toLowerCase()] ?? 1n) * 100n, 10n ** BigInt(decimals.length));
  // Representation bounds apply to the unrounded value as well as its rounded output.
  if (raw.n > BigInt(MAX_AMOUNT_MINOR) * raw.d) return fail('TOO_LARGE');
  const amount = halfEven(raw);
  if (amount === 0n) return fail('ZERO');
  if (amount < BigInt(MIN_AMOUNT_MINOR)) return fail('TOO_SMALL');
  // Methodology0.1 amendment (latest CTO/Addendum B): candidate value is unchanged,
  // but native+ASCII digits are NOT silently accepted: explicit confirmation flag+advisory.
  const warnings: Array<'UNMARKED_NUMBER' | 'MIXED_DIGIT_SCRIPTS'> = [];
  if (asciiDigits && mappedDigits) warnings.push('MIXED_DIGIT_SCRIPTS');
  if (!hasCurrency && !hasCashSuffix && !m[4] && BARE_NUMBER_MAGNITUDE_POLICY === 'WARN_ALL_UNMARKED') warnings.push('UNMARKED_NUMBER');
  return { ok: true, value: { amount_minor: Number(amount), currency: 'PKR' },
    ...(warnings.length ? { warnings } : {}), ...(asciiDigits && mappedDigits ? { requires_confirmation: true as const } : {}) };
}

/** API v0.7 R1/R10 wire advisories. Mixed-script confirmation is NOT the
 * separate category-bounds override: confirm the preview's canonical asking_price. */
export function normalisationWarnings(result: NormaliseResult): Array<{ code: 'UNMARKED_NUMBER' | 'MIXED_DIGIT_SCRIPTS'; message_key: string; params: Record<string, never> }> {
  return result.ok ? (result.warnings ?? []).map(code => ({ code, message_key: code === 'UNMARKED_NUMBER' ? 'price.normalisation.unmarked_number' : 'price.normalisation.mixed_digit_scripts', params: {} })) : [];
}
