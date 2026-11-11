import type { ApiError, CategoryConfig, Money, Product } from './types';
import { ASKING_HARD_CEILING_MULTIPLIER } from './policy';
import { apiError } from './checks';
/** Founder-approved D-008; gated by503 until strict approved config parses.
 * An acknowledgement is private canonical state, never an auth/rights proof. */
export type AskingAcknowledgement = { amount_minor: number; currency: 'PKR'; product_id: string; category_id: string; config_version: string };
export function bindAskingAcknowledgement(asking: Money | null, product: Product, config: CategoryConfig): AskingAcknowledgement | null {
  return asking === null ? null : { amount_minor: asking.amount_minor, currency: asking.currency, product_id: product.id, category_id: config.id, config_version: config.version };
}
export function sameAskingAcknowledgement(a: AskingAcknowledgement | null | undefined, asking: Money | null, product: Product, config: CategoryConfig): boolean {
  const b = bindAskingAcknowledgement(asking, product, config);
  return a !== undefined && a !== null && b !== null && a.amount_minor === b.amount_minor && a.currency === b.currency && a.product_id === b.product_id && a.category_id === b.category_id && a.config_version === b.config_version;
}
export function askingBoundsError(asking: Money | null, bounds: { min: number; max: number }, confirmed: boolean): ApiError | null {
  if (asking === null) return null;
  if (BigInt(asking.amount_minor) > BigInt(bounds.max) * ASKING_HARD_CEILING_MULTIPLIER) return { ...apiError('ASKING_PRICE_IMPLAUSIBLE', 422, 'price.implausible'), details: { fields: ['asking_price'] } };
  if ((asking.amount_minor < bounds.min || asking.amount_minor > bounds.max) && !confirmed) return { ...apiError('CONFIRMATION_REQUIRED', 422, 'check.confirm_fields'),
    details: { fields: ['asking_price'], reason: 'OUT_OF_CATEGORY_BOUNDS' } };
  return null;
}
