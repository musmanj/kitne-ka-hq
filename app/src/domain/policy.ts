export const METHODOLOGY_VERSION = '0.1';
export const DAY_MS = 86_400_000;
/** spec v0.1 §4: fractional age, exact window equality admitted. */
export const FRESHNESS_DAYS = { NEW_SEALED: 14, USED: 30 } as const;
/** spec v0.1 §4: older timestamp and inclusive300s tolerance. */
export const FUTURE_TOLERANCE_MS = 5 * 60_000;
/** spec v0.1 §9: informational-only recency/city flags. */
export const NEAR_EXPIRY_REMAINING = 0.20;
export const GEO_MIN_CITY_SAMPLES = 2;
export const GEO_SPREAD_PERCENT = 15;
/** spec v0.1 §7: inclusive Fair endpoints, unrounded exact ratio. */
export const FAIR_LOW_PERCENT = -15;
export const FAIR_HIGH_PERCENT = 10;
/** spec v0.1 §6: post-single-trim hard spread; internal P90-P10 cap. */
export const MAX_SPREAD_PERCENT = 60;
export const WIDE_SPREAD_PERCENT = 30;
/** spec v0.1 §3: technical representation bounds, not economic plausibility. */
export const MIN_AMOUNT_MINOR = 1;
export const MAX_AMOUNT_MINOR = Number.MAX_SAFE_INTEGER;
/** spec v0.1 §8: half-even confidence once, then caps, then bands. */
export type ConfidenceRounding = 'HALF_UP' | 'HALF_EVEN';
export const CONFIDENCE_ROUNDING_POLICY: Readonly<{ mode: ConfidenceRounding }> = Object.freeze({ mode: 'HALF_EVEN' });
/** API v0.7 R1 ratified: warn on ALL unmarked numbers, without guessing
 * lakh or introducing a global small-price rejection threshold. */
export const BARE_NUMBER_MAGNITUDE_POLICY = 'WARN_ALL_UNMARKED' as const;
/** spec v0.1 §11; API v0.3 Retention classes, SANITISED_CHECK. */
export const PRIVATE_CHECK_TTL_MS = DAY_MS;
/** spec v0.1 §5: one primary exclusion, aggregate order is normative. */
export const EXCLUSION_ORDER = ['TARGET_LISTING', 'UNVERIFIED_RIGHTS', 'UNSUPPORTED_CURRENCY', 'PRICE_NOT_COMPARABLE',
  'OUT_OF_CATEGORY_BOUNDS', 'NOT_IN_STOCK', 'UNKNOWN_CRITICAL_ATTRIBUTE', 'CONDITION_MISMATCH', 'VARIANT_MISMATCH', 'INVALID_TIMESTAMP',
  'UNDATED', 'STALE', 'UNVERIFIED_PROVENANCE', 'DUPLICATE', 'STATISTICAL_OUTLIER'] as const;
/** spec v0.1 §10: stable insufficient reason order across all branches. */
export const INSUFFICIENT_REASON_ORDER = ['IDENTITY_UNCONFIRMED', 'NO_PERMITTED_SOURCE', 'NO_FRESH_EVIDENCE', 'TOO_FEW_COMPARABLES', 'EXCESSIVE_SPREAD'] as const;
export const INLINE_EVIDENCE_LIMIT = 50; // API v0.5 evidence DTO safety cap, AFTER pricing

/** D-008 approved10x rule; strict approved category-policy gate required. */
export const ASKING_HARD_CEILING_MULTIPLIER = 10n;
