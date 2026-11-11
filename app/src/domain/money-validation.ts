import { isRecord } from './canonical';
import type { Money } from './types';
/** API v0.7 asking-price amendment / methodology0.1 §3: exact canonical Money.
 * Null is handled as absence by callers, never coerced. No currency/amount coercion,
 * unknown keys, arrays, inherited fields or accessor execution at this boundary. */
export function isStrictMoney(value: unknown): value is Money {
  if (!isRecord(value)) return false;
  const keys = Reflect.ownKeys(value);
  return keys.length === 2 && keys.includes('amount_minor') && keys.includes('currency') &&
    value.currency === 'PKR' && typeof value.amount_minor === 'number' &&
    Number.isSafeInteger(value.amount_minor) && value.amount_minor > 0;
}
