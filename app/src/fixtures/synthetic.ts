import { CATEGORIES } from '../domain/categories';
import type { CheckInput } from '../domain/checks';
import type { ComparableCandidate, Listing, PriceObservation, Variant } from '../domain/types';
import { candidateFromListing } from '../adapters/sources';
export const SYNTHETIC_LABEL = 'SYNTHETIC — invented test data, NOT live market evidence';
export const SYNTHETIC_NOW = '2026-11-09T00:00:00+05:00';
export const SYNTHETIC_VARIANT: Variant = { product_id: 'SYNTHETIC-phone', config_version: CATEGORIES.phones!.version,
  attributes: { storage_gb: 128, ram_gb: 8, pta_status: 'APPROVED', lock_status: 'FACTORY_UNLOCKED',
    region_model: 'SYNTHETIC-PK', warranty: 'LOCAL', battery_health_band: 'GE90', repair_status: 'NEVER_REPAIRED' },
  condition: 'NEW_SEALED', used_grade: null, city: null };
export function syntheticCandidate(index: number, pricePkr = 100_000, ageDays = 1): ComparableCandidate {
  const variant = { ...SYNTHETIC_VARIANT, attributes: { ...SYNTHETIC_VARIANT.attributes } };
  const source = { source_id: `SYNTHETIC-source-${index % 3}`, source_name: `SYNTHETIC merchant ${index}`,
    source_owner_group: `SYNTHETIC-source-owner-${index % 3}`, method: 'RIGHTS_CLEARED_DIRECT_QUOTE' as const,
    permission_record_id: 'SYNTHETIC-NOT-A-REAL-LICENCE', url: `https://merchant-${index}.invalid/SYNTHETIC`,
    observed_at: new Date(Date.parse(SYNTHETIC_NOW) - ageDays * 86_400_000).toISOString(), retrieved_at: SYNTHETIC_NOW,
    source_updated_at: null, expires_at: '2027-01-01T00:00:00+05:00' };
  const price = { amount_minor: pricePkr * 100, currency: 'PKR' as const };
  const listing: Listing = { id: `SYNTHETIC-listing-${index}`, seller_independence_group: `SYNTHETIC-seller-${index}`,
    variant, advertised_price: price, delivery_price: null, availability: 'IN_STOCK', source };
  const observation: PriceObservation = { id: `SYNTHETIC-observation-${index}`, listing_id: listing.id, price,
    observed_at: source.observed_at, source_updated_at: source.source_updated_at, retrieved_at: source.retrieved_at, provenance_ref: source.source_id };
  return candidateFromListing(listing, observation, { variantMatch: { matched: true, exclusion_reason: null, quality: 1 }, comparable: true,
    rightsVerified: true, canonicalListingId: listing.id, targetListing: false, verification: 'VERIFIED', evidence_hash: `SYNTHETIC-hash-${index}` });
}
export function syntheticInput(n = 5): CheckInput {
  return { check_id: 'SYNTHETIC-check', product: { id: SYNTHETIC_VARIANT.product_id, category_id: 'phones', brand: 'SYNTHETIC',
    model: 'SYNTHETIC Model A', manufacturer_model_id: 'SYNTHETIC-SKU', aliases: [] },
    variant: { ...SYNTHETIC_VARIANT, attributes: { ...SYNTHETIC_VARIANT.attributes } }, // Isolate mutable fixture builders: a malformed policy vector must not poison
    // subsequent control cases. This clones our trusted static template, never ingress.
    config: JSON.parse(JSON.stringify(CATEGORIES.phones!)) as CheckInput['config'],
    candidates: Array.from({ length: n }, (_, i) => syntheticCandidate(i)),
    asking_price: { amount_minor: 10_000_000, currency: 'PKR' }, now: SYNTHETIC_NOW,
    private_expires_at: '2026-11-10T00:00:00+05:00' };
}
export type LabelledSyntheticCase = { label: typeof SYNTHETIC_LABEL; name: string; input: CheckInput;
  expected_result_state: 'INSUFFICIENT_DATA' | 'RANGE_AVAILABLE';
  expected_verdict: 'FAIR' | 'HIGH' | 'UNUSUALLY_LOW' | 'NO_ASKING_PRICE' | null };
/** Labelled ground truth is deterministic policy output, NOT measured market accuracy. */
export function labelledSyntheticCases(): LabelledSyntheticCase[] {
  const cases: LabelledSyntheticCase[] = [];
  for (const [name, asking, expected] of [['fair', 10000000, 'FAIR'], ['high', 11500000, 'HIGH'],
    ['low-caution', 8000000, 'UNUSUALLY_LOW'], ['no-ask', null, 'NO_ASKING_PRICE']] as const) {
    const input = syntheticInput(); input.asking_price = asking === null ? null : { amount_minor: asking, currency: 'PKR' };
    cases.push({ label: SYNTHETIC_LABEL, name: `SYNTHETIC-${name}`, input, expected_result_state: 'RANGE_AVAILABLE', expected_verdict: expected });
  }
  cases.push({ label: SYNTHETIC_LABEL, name: 'SYNTHETIC-insufficient', input: syntheticInput(2),
    expected_result_state: 'INSUFFICIENT_DATA', expected_verdict: null });
  return cases;
}
