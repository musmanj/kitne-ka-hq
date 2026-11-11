/** API v0.7 snake_case fields; transport/auth/persistence are deliberately not implemented. */
export type ISODateTime = string;
/** spec v0.1 §7/API v0.5: numeric wire fraction, NOT percentage points. */
export type DifferenceFraction = number & { readonly __differenceUnit: 'FRACTION' };
/** Legacy flat QA/primitive-only percentage points; not Assessment.diff_percent. */
export type DifferencePercentagePoints = number & { readonly __differenceUnit: 'PERCENTAGE_POINTS' };
export type Money = { amount_minor: number; currency: 'PKR' };
export type CategoryId = string;
export type AttributeValue = string | number | boolean | null;
export type Condition = 'NEW_SEALED' | 'USED';
export type UsedGrade = 'LIKE_NEW' | 'GOOD' | 'FAIR';
export type Verdict = 'FAIR' | 'HIGH' | 'UNUSUALLY_LOW' | 'INSUFFICIENT_DATA' | 'NO_ASKING_PRICE';
export type PriceVerdict = Extract<Verdict, 'FAIR' | 'HIGH' | 'UNUSUALLY_LOW'>;
export type ConfidenceReason = 'FEW_COMPARABLES' | 'SINGLE_SOURCE' | 'NEAR_EXPIRY' | 'WIDE_SPREAD' |
  'ATTRIBUTE_MATCH_NOT_SKU' | 'ASKING_NOT_SOLD_PRICES' | 'PTA_UNCONFIRMED' | 'GEO_SPREAD';
export type ExclusionReason = 'DUPLICATE' | 'TARGET_LISTING' | 'VARIANT_MISMATCH' |
  'UNKNOWN_CRITICAL_ATTRIBUTE' | 'CONDITION_MISMATCH' | 'STALE' | 'UNDATED' |
  'NOT_IN_STOCK' | 'PRICE_NOT_COMPARABLE' | 'OUT_OF_CATEGORY_BOUNDS' | 'UNVERIFIED_RIGHTS' | 'UNVERIFIED_PROVENANCE' |
  'STATISTICAL_OUTLIER' | 'UNSUPPORTED_CURRENCY' | 'INVALID_TIMESTAMP';
export type CategoryConfig = {
  id: CategoryId; version: string; config_version?: string; label_key: string;
  attributes: Array<{ key: string; label_key: string; type: 'enum' | 'integer' | 'text' | 'boolean';
    required_for_assessment: boolean; enum_values?: string[]; unknown_policy?: 'BLOCK' | 'BRANCH';
    min?: number; max?: number; unit?: string; hard_match: boolean; nullable: boolean; required_when?: Record<string, AttributeValue> }>;
  condition_values: Condition[]; used_grade_values: UsedGrade[];
  /** API v0.7 R7: approved shape, values remain PENDING PM/Founder. */
  price_bounds_minor?: { min: number | null; max: number | null; basis: 'APPROVED' | 'SYNTHETIC' | null };
  environment?: 'SYNTHETIC' | 'PRODUCTION'; approval_status?: 'PENDING' | 'APPROVED';
  /** CTO ruling via steering,9Nov01:33PKT: default empty; NEVER populated from request. */
  approver_allowlist?: readonly string[] | null;
  approval_scope?: { category_id: string; conditions: Condition[]; approved_by: string; approved_at: string; source_ref: string };
};
export type Product = { id: string; category_id: CategoryId; brand: string; model: string;
  manufacturer_model_id: string | null; aliases: string[] };
export type Variant = { product_id: string; config_version: string;
  attributes: Record<string, AttributeValue>; condition: Condition; used_grade: UsedGrade | null; city: string | null };
export type ExtractedField<T> = { value: T | null; confidence: number | null;
  origin: 'OCR' | 'USER' | 'CATALOGUE';
  requires_confirmation: boolean; reason_codes: string[] };
export type SourceProvenance = { source_id: string; source_name: string; source_owner_group: string;
  method: 'LICENSED_API' | 'PERMISSIONED_FEED' | 'RIGHTS_CLEARED_DIRECT_QUOTE'; permission_record_id: string;
  url: string | null; retrieved_at: ISODateTime; observed_at: ISODateTime;
  source_updated_at: ISODateTime | null; expires_at: ISODateTime };
export type Listing = { id: string; seller_independence_group: string; variant: Variant;
  advertised_price: Money; delivery_price: Money | null;
  availability: 'IN_STOCK' | 'OUT_OF_STOCK' | 'UNKNOWN'; source: SourceProvenance };
/** spec v0.1 §2; API revisions v0.3/v0.4 lean PriceObservation. */
export type PriceObservation = { id: string; listing_id: string; price: Money;
  observed_at: ISODateTime | null; source_updated_at: ISODateTime | null;
  retrieved_at: ISODateTime; provenance_ref: string };
export type VariantMatch = { matched: true; exclusion_reason: null; quality: number } |
  { matched: false; exclusion_reason: ExclusionReason; quality: number };
/** API-v0.3 evaluation DTO, plus private verified-ingestion flags needed for v0 gates. */
export type ComparableCandidate = { observation: PriceObservation; listing_id: string; canonicalListingId: string;
  sellerOwnerId: string | null; inStock: boolean | null; city: string | null; variantMatch: VariantMatch;
  variant: Variant; source: SourceProvenance; source_ref: string; rights_status: 'PERMITTED' | 'UNVERIFIED' | 'DENIED';
  price_basis: 'FULL_CASH_TAX_INCLUSIVE' | 'NOT_COMPARABLE';
  comparable: boolean; rightsVerified: boolean; targetListing: boolean;
  verification: 'VERIFIED' | 'UNVERIFIED'; evidence_hash: string };
/** Published v0.4 transport subset; evaluation joins private canonical variant/source metadata. */
export type ComparableCandidateDto = Pick<ComparableCandidate, 'observation' | 'canonicalListingId' | 'sellerOwnerId' | 'inStock' | 'city' | 'source_ref' | 'rights_status' | 'price_basis'> & {
  variantMatch: { matched: boolean; exclusion_reason: ExclusionReason | null; quality: 1 | 0.9 }
};
export type AssessmentWarning = 'IQR_ZERO_SPREAD_REVIEW';
export type TimestampPolicy = { future_skew_max_seconds: 300; freshness_new_days: 14; freshness_used_days: 30 };
export type Confidence = { score: number | null; level: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
  reasons: Array<{ code: ConfidenceReason; message_key: string; params: Record<string, string | number> }> };
export type EvidenceObservation = { observation_id: string; price: Money; variant: Variant; match_quality: number;
  source: { source_id: string; source_name: string; url: string | null; observed_at: ISODateTime | null; source_updated_at: ISODateTime | null; retrieved_at: ISODateTime } };
export type MarketPool = { range_low: Money; range_high: Money; median: Money;
  /** spec v0.1 §7: fair-band outputs; verdict precedes rounding. */
  fair_band_low: Money; fair_band_high: Money;
  range_method: 'MIN_MAX' | 'P10_P90'; observation_ids: string[]; provenance: EvidenceObservation['source'][];
  confidence: Confidence; n_effective: number; independent_sources: number };
export type VerifiedRetail = { value: Money; kind: 'CURRENT_VERIFIED_RETAIL'; provenance: SourceProvenance[]; label_key: string };
export type EvidenceSummary = { retrieved_count: number; included_count: number; used_condition_included_count: number;
  excluded_count: number; excluded_by_reason: Array<{ code: ExclusionReason; count: number }>;
  new_pool_count: number; used_pool_count: number; independent_sources: number; evidence_total_included: number; evidence_truncated: boolean;
  evidence_newest_effective_at: ISODateTime | null; observations: EvidenceObservation[] };
export type InsufficientReason = 'NO_STORED_RANGE' | 'TOO_FEW_COMPARABLES' | 'IDENTITY_UNCONFIRMED' | 'NO_PERMITTED_SOURCE' |
  'EXCESSIVE_SPREAD' | 'NO_FRESH_EVIDENCE';
export type Assessment = { assessment_id: string; product: Product; confirmed_variant: Variant;
  asking_price: Money | null; checked_at: ISODateTime; classified_at: ISODateTime | null; methodology_version: string; config_version: string;
  verdict: Verdict; indicative: boolean; confidence: Confidence; selected_pool: 'NEW' | 'USED';
  range_low: Money | null; range_high: Money | null; median: Money | null;
  fair_band_low: Money | null; fair_band_high: Money | null;
  diff_absolute_minor: number | null; diff_percent: DifferenceFraction | null;
  alternative_pool_unavailable?: 'STALE' | null;
  new_market: MarketPool | null; used_market: MarketPool | null; verified_retail: VerifiedRetail | null;
  evidence: EvidenceSummary; insufficient_reasons: InsufficientReason[];
  explanation: Array<{ message_key: string; params: Record<string, string | number> }>; warnings: string[] };
export type LinkFailure = 'INVALID_URL' | 'SOURCE_NOT_SUPPORTED' | 'NOT_PERMITTED' | 'FETCH_FAILED' |
  'NOT_PRODUCT_PAGE' | 'NOT_FOUND_OR_REMOVED' | 'TIMEOUT' | 'UNSAFE_URL' | 'RATE_LIMITED';
export type ApiError = { code: string; message_key: string; params: Record<string, string | number>;
  retryable: boolean; request_id: string; http_status: number; link_failure_reason: LinkFailure | null;
  fallback_actions: Array<'UPLOAD_RIGHTS_CLEARED_IMAGE' | 'ENTER_MANUALLY' | 'RETRY'>;
  details?: { fields: string[]; reason?: 'OUT_OF_CATEGORY_BOUNDS' };
  field_errors?: Array<{ field: string; message_key: string }> };
export type PtaBranch = { pta_status: 'APPROVED' | 'NON_PTA'; state: 'INSUFFICIENT_DATA' | 'RANGE_AVAILABLE';
  pool: MarketPool | null; fair_band_low: Money | null; fair_band_high: Money | null; evidence: EvidenceSummary; insufficient_reasons: InsufficientReason[] };
export type RangeData = { mode: 'SINGLE_POOL' | 'PTA_SPLIT'; selected_assessment: Assessment | null;
  pta_branches: PtaBranch[]; asking_price: Money | null;
  verdict_slot: { state: 'PRICE_VERDICT' | 'NO_ASKING_PRICE' | 'PTA_SELECTION_REQUIRED';
    verdict: PriceVerdict | null; message_key: string }; confidence: Confidence; low_confidence_modifier: boolean };
export type ConfirmedCanonicalContext = { product: { id: string; display_name: string };
  variant: { config_version: string; attributes: Record<string, AttributeValue>; condition: Condition; used_grade: UsedGrade | null; pta_status: 'APPROVED' | 'NON_PTA' | 'NOT_SURE' | null } };
export type ResultBase = { check_id: string; classification_version: number; confirmed_context: ConfirmedCanonicalContext | null; checked_at: ISODateTime;
  classified_at: ISODateTime; valid_until: ISODateTime | null; methodology_version: string; category_config_version: string };
export type CheckResult = ResultBase & (
  { result_state: 'ERROR'; error: ApiError; data: null; confidence: null; low_confidence_modifier: false } |
  { result_state: 'INSUFFICIENT_DATA'; error: null; data: null; evidence: EvidenceSummary;
    insufficient_reasons: InsufficientReason[]; confidence: Confidence; low_confidence_modifier: false } |
  { result_state: 'RANGE_AVAILABLE'; error: null; data: RangeData; confidence: Confidence; low_confidence_modifier: boolean });
