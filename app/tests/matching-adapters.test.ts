import { describe, expect, it } from 'vitest';
import { CATEGORIES } from '../src/domain/categories';
import { identityConfirmed, matchVariant } from '../src/domain/matching';
import { candidateFromListing, SOURCE_POLICIES } from '../src/adapters/sources';
import { syntheticCandidate, syntheticInput, SYNTHETIC_LABEL } from '../src/fixtures/synthetic';
import type { CategoryConfig, Listing, Variant } from '../src/domain/types';
describe('category extensibility and strict critical identity', () => {
  it.each(['phones', 'laptops', 'consoles'])('configured %s with complete attributes', category => {
    const config = CATEGORIES[category]!;
    const attrs = Object.fromEntries(config.attributes.filter(a => !a.required_when).map(a => [a.key, a.type === 'integer' ? 128 : a.enum_values?.[0] ?? `SYNTHETIC-${a.key}`]));
    const v: Variant = { product_id: 'SYNTHETIC', config_version: config.version, attributes: attrs, condition: 'NEW_SEALED', used_grade: null, city: null };
    expect(identityConfirmed(v, config)).toBe(true); expect(matchVariant(v, v, config)).toEqual({ matched: true, exclusion_reason: null, quality: 1 });
    const key = config.attributes.find(a => a.key !== 'pta_status' && !a.required_when)!.key;
    const bad = { ...v, attributes: { ...v.attributes } }; delete bad.attributes[key];
    expect(identityConfirmed(bad, config)).toBe(false);
    expect(matchVariant(v, bad, config)).toMatchObject({ matched: false, exclusion_reason: 'UNKNOWN_CRITICAL_ATTRIBUTE' });
  });
  it('custom category works without pricing hardcoding, optional configured colour can pool', () => {
    const config: CategoryConfig = { id: 'SYNTHETIC-custom', version: '1', label_key: 'synthetic.custom', attributes: [
      { key: 'size', label_key: 'size', type: 'integer', required_for_assessment: true, hard_match: true, nullable: false },
      { key: 'colour', label_key: 'colour', type: 'text', required_for_assessment: false, hard_match: false, nullable: true }
    ], condition_values: ['NEW_SEALED'], used_grade_values: [] };
    const v: Variant = { product_id: 'SYNTHETIC', config_version: '1', condition: 'NEW_SEALED', used_grade: null, city: null, attributes: { size: 1, colour: 'A' } };
    expect(matchVariant(v, { ...v, attributes: { size: 1, colour: 'B' } }, config).matched).toBe(true);
  });
  it('reported repair metadata is optional/unmatched, not a separate repaired condition', () => {
    const input = syntheticInput(); input.variant.condition = 'USED';
    expect(identityConfirmed(input.variant, input.config)).toBe(false); input.variant.used_grade = 'GOOD'; input.variant.attributes.repair_status = 'REPAIRED';
    expect(identityConfirmed(input.variant, input.config)).toBe(true);
  });
  it('unknown target PTA exception does not admit unknown evidence', () => {
    const input = syntheticInput(); delete input.variant.attributes.pta_status;
    expect(identityConfirmed(input.variant, input.config)).toBe(true);
    expect(matchVariant(input.variant, input.variant, input.config)).toMatchObject({ matched: false, exclusion_reason: 'UNKNOWN_CRITICAL_ATTRIBUTE' });
  });
  it.each(['ram_gb', 'region_model', 'lock_status', 'warranty'])('hard exclusion %s', key => {
    const input = syntheticInput(); const c = syntheticCandidate(0); c.variant.attributes[key] = key === 'ram_gb' ? 16 : 'SYNTHETIC-other';
    expect(matchVariant(input.variant, c.variant, input.config)).toMatchObject({ matched: false, exclusion_reason: 'VARIANT_MISMATCH' });
  });
  it('used grade, repair and battery are not inferred; unknown attrs and versions blocked', () => {
    const input = syntheticInput(); input.variant.condition = 'USED';
    expect(identityConfirmed(input.variant, input.config)).toBe(false); input.variant.used_grade = 'GOOD';
    expect(identityConfirmed(input.variant, input.config)).toBe(true);
    delete input.variant.attributes.battery_health_band; expect(identityConfirmed(input.variant, input.config)).toBe(true);
    const v = syntheticInput().variant; v.attributes.extra = 'not configured'; expect(identityConfirmed(v, input.config)).toBe(false);
    delete v.attributes.extra; v.config_version = 'wrong'; expect(identityConfirmed(v, input.config)).toBe(false);
    v.config_version = input.config.version; v.condition = 'USED'; v.used_grade = null; expect(identityConfirmed(v, input.config)).toBe(false);
  });
});
describe('disabled source boundary and synthetic data', () => {
  it('all source adapters disabled, zero quota, no permission or fields', () => {
    expect(SOURCE_POLICIES.length).toBeGreaterThan(0);
    for (const policy of SOURCE_POLICIES) expect(policy).toMatchObject({ enabled: false, kill_switch: true, permission_record_id: null,
      allowed_methods: [], allowed_fields: [], rate_cap_per_minute: 0, licence_cache_limit_seconds: 0, expires_at: null });
    expect(Object.isFrozen(SOURCE_POLICIES)).toBe(true); expect(Object.isFrozen(SOURCE_POLICIES[0])).toBe(true);
  });
  it('fixture label and fake URLs cannot be mistaken for live observations', () => {
    expect(SYNTHETIC_LABEL).toContain('SYNTHETIC'); const c = syntheticCandidate(0);
    expect(c.source.url).toContain('.invalid/'); expect(c.source.permission_record_id).toContain('NOT-A-REAL-LICENCE');
    expect(c.sellerOwnerId).toContain('SYNTHETIC');
  });
  it('joining mismatched listing refuses admission', () => {
    const c = syntheticCandidate(0), o = c.observation;
    const listing: Listing = { id: o.listing_id, seller_independence_group: c.sellerOwnerId!, variant: c.variant,
      advertised_price: o.price, delivery_price: null, availability: 'OUT_OF_STOCK', source: c.source };
    expect(candidateFromListing(listing, o, c).inStock).toBe(false);
    expect(() => candidateFromListing({ ...listing, id: 'wrong' }, o, c)).toThrow('mismatch');
    expect(() => candidateFromListing({ ...listing, advertised_price: { amount_minor: 1, currency: 'PKR' } }, o, c)).toThrow('mismatch');
  });
});
