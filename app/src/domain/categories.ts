import type { CategoryConfig } from './types';
const attr = (key: string, type: 'text' | 'integer' | 'enum' = 'text'): CategoryConfig['attributes'][number] => ({
  key, label_key: `attributes.${key}`, type, required_for_assessment: true, hard_match: true, nullable: false, unknown_policy: 'BLOCK'
});
const base = (id: string, attributes: CategoryConfig['attributes']): CategoryConfig => ({
  id, environment: 'SYNTHETIC', approver_allowlist: Object.freeze([]), version: 'synthetic-v0', label_key: `categories.${id}`, attributes,
  // SYNTHETIC test bounds only, NOT economic limits approved for launch.
  price_bounds_minor: { min: 1, max: Number.MAX_SAFE_INTEGER, basis: 'SYNTHETIC' },
  condition_values: ['NEW_SEALED', 'USED'], used_grade_values: ['LIKE_NEW', 'GOOD', 'FAIR']
});
/** PENDING PM/Founder: SYNTHETIC category fixtures, not ratified taxonomy. */
export const CATEGORIES: Record<string, CategoryConfig> = {
  phones: base('phones', [attr('storage_gb', 'integer'), attr('ram_gb', 'integer'),
    { ...attr('pta_status', 'enum'), enum_values: ['APPROVED', 'NON_PTA', 'NOT_SURE'], unknown_policy: 'BRANCH' },
    ...['lock_status', 'region_model', 'warranty'].map(k => attr(k)),
    { ...attr('battery_health_band', 'enum'), enum_values: ['GE90', '80_89', 'LT80', 'UNKNOWN'], required_for_assessment: false, hard_match: false, nullable: true },
    // PENDING Founder approval: metadata is optional/unmatched, NOT an approved repaired-condition pool.
    { ...attr('repair_status', 'enum'), enum_values: ['NEVER_REPAIRED', 'REPAIRED', 'UNKNOWN'], required_for_assessment: false, hard_match: false, nullable: true }]),
  laptops: base('laptops', [...['manufacturer_sku', 'cpu', 'gpu', 'storage_type', 'display', 'warranty'].map(k => attr(k)),
    ...['vram_gb', 'ram_gb', 'storage_gb'].map(k => attr(k, 'integer'))]),
  consoles: base('consoles', [...['generation', 'revision', 'edition', 'bundle', 'warranty'].map(k => attr(k)), attr('storage_gb', 'integer')])
};

/** API v0.7 R7 — PENDING PM/Founder; never production defaults or invented approvals. */
export const PRODUCTION_CONFIG_PLACEHOLDERS = Object.freeze({
  config_version: 'PENDING_PM_FOUNDER', approver_allowlist: Object.freeze([]), environment: 'PRODUCTION', approval_status: 'PENDING',
  price_bounds_minor: Object.freeze({ min: null, max: null, basis: null }),
  critical_variants: null, battery_rules: null, repair_rules: null, laptop_equivalence: null,
  taxonomy: null, default_used_grade: null, review_owner: 'PM', approved_by: null, approved_at: null,
  parser_scope: Object.freeze({ urdu: null, compound: null, plural: null, crore: null, cr: null })
});
