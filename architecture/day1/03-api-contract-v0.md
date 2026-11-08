# API contract v0 — draft typed schemas / HTTP semantics
Owner CTO, 9 Nov 2026 PKT. Proposed for Design/PM/QA review before G2. No endpoints implemented. Base `/api/v0`; JSON unless image. Server validates schemas; prices integer PKR minor units (paisa), no binary floating monetary persistence. ISO8601 timestamps include explicit offset; render dates/times Asia/Karachi (PKT). Per-field extraction confidence is not market confidence.

## Types
```ts
type ISODateTime = string; // RFC3339
// integer >= 0, validated safe integer; PKR currency only in MVP
type Money = { amount_minor: number; currency: 'PKR' };
type CategoryId = string; // registry initially phones, laptops, consoles
type AttributeValue = string | number | boolean | null;
type Condition = 'NEW_SEALED' | 'USED';
type UsedGrade = 'LIKE_NEW' | 'GOOD' | 'FAIR';
type Verdict = 'FAIR' | 'HIGH' | 'UNUSUALLY_LOW' |
  'INSUFFICIENT_DATA' | 'NO_ASKING_PRICE';
type ConfidenceReason = 'FEW_COMPARABLES' | 'SINGLE_SOURCE' | 'NEAR_EXPIRY' |
  'WIDE_SPREAD' | 'ATTRIBUTE_MATCH_NOT_SKU' | 'GEOGRAPHIC_MIX' |
  'ASKING_NOT_SOLD_PRICES' | 'PTA_UNCONFIRMED';
type LinkFailure = 'INVALID_URL' | 'SOURCE_NOT_SUPPORTED' | 'NOT_PERMITTED' |
  'FETCH_FAILED' | 'NOT_PRODUCT_PAGE' | 'NOT_FOUND_OR_REMOVED' |
  'TIMEOUT' | 'UNSAFE_URL' | 'RATE_LIMITED';
type ExclusionReason = 'DUPLICATE' | 'TARGET_LISTING' | 'VARIANT_MISMATCH' |
  'UNKNOWN_CRITICAL_ATTRIBUTE' | 'CONDITION_MISMATCH' | 'STALE' | 'UNDATED' |
  'NOT_IN_STOCK' | 'PRICE_NOT_COMPARABLE' | 'UNVERIFIED_RIGHTS' |
  'UNVERIFIED_PROVENANCE' | 'STATISTICAL_OUTLIER' | 'UNSUPPORTED_CURRENCY';

type CategoryConfig = {
  id: CategoryId; version: string; label_key: string;
  attributes: Array<{
    key: string; label_key: string; type: 'enum'|'integer'|'text'|'boolean';
    required_for_assessment: boolean; enum_values?: string[]; unknown_policy?: 'BLOCK'|'BRANCH';
    unit?: string; hard_match: boolean; nullable: boolean;
    // schema may include conditional requirement on other attribute/condition
    required_when?: Record<string, AttributeValue>;
  }>;
  condition_values: Condition[]; used_grade_values: UsedGrade[];
};
type Product = { id: string; category_id: CategoryId; brand: string;
  model: string; manufacturer_model_id: string|null; aliases: string[] };
type Variant = { product_id: string; config_version: string;
  attributes: Record<string, AttributeValue>; condition: Condition;
  used_grade: UsedGrade|null; city: string|null };
type ExtractedField<T> = { value: T|null; confidence: number|null; // 0..1, null=unknown
  origin: 'OCR'|'VISION'|'USER'|'CATALOGUE'; raw_text: string|null;
  requires_confirmation: boolean; reason_codes: string[] };
type Extraction = {
  fields: Record<string, ExtractedField<AttributeValue>>;
  no_price_found: boolean; multiple_products: boolean;
  candidates: Array<{candidate_id: string; fields: Extraction['fields']}>;
  unsupported_category: boolean; candidate_selection_required: boolean; provider: string; // e.g. local-ocr; not a secret
  input_retention: { original_uploaded: false; remote_image_stored: false;
    private_fields_expires_at: ISODateTime; provider_notice_key: string|null };
};

type SourceProvenance = {
  source_id: string; source_name: string; source_owner_group: string;
  method: 'LICENSED_API'|'PERMISSIONED_FEED'|'RIGHTS_CLEARED_DIRECT_QUOTE';
  permission_record_id: string;
  url: string|null; // public merchant URL only; never private query tokens
  retrieved_at: ISODateTime; observed_at: ISODateTime;
  source_updated_at: ISODateTime|null; expires_at: ISODateTime;
};
type Listing = {
  id: string; seller_independence_group: string; variant: Variant;
  advertised_price: Money; delivery_price: Money|null;
  availability: 'IN_STOCK'|'OUT_OF_STOCK'|'UNKNOWN';
  source: SourceProvenance;
};
type PriceObservation = { id: string; listing_id: string; price: Money;
  variant: Variant; source: SourceProvenance; evidence_hash: string;
  match_quality: number; verification: 'VERIFIED'|'UNVERIFIED' };
type Confidence = { score: number|null; level: 'NONE'|'LOW'|'MEDIUM'|'HIGH';
  reasons: Array<{ code: ConfidenceReason; message_key: string;
    params: Record<string,string|number> }> };
type MarketPool = {
  range_low: Money; range_high: Money; median: Money;
  range_method: 'MIN_MAX'|'P10_P90'; observation_ids: string[];
  provenance: SourceProvenance[]; confidence: Confidence;
  n_effective: number; independent_sources: number;
};
type VerifiedRetail = { value: Money; kind: 'CURRENT_VERIFIED_RETAIL';
  provenance: SourceProvenance[]; label_key: string };
type Assessment = {
  assessment_id: string; product: Product; confirmed_variant: Variant;
  asking_price: Money|null; checked_at: ISODateTime;
  methodology_version: string; config_version: string;
  verdict: Verdict; indicative: boolean; confidence: Confidence;
  selected_pool: 'NEW'|'USED';
  range_low: Money|null; range_high: Money|null; median: Money|null;
  // not (low+high)/2; median anchors verdict; avoid ambiguous "midpoint"
  diff_absolute_minor: number|null; diff_percent: number|null;
  new_market: MarketPool|null; used_market: MarketPool|null;
  verified_retail: VerifiedRetail|null;
  evidence: {
    retrieved_count: number;
    included_count: number; // selected pool only; UI "listings used"
    used_condition_included_count: number; // avoids ambiguity with "used"
    excluded_count: number;
    excluded_by_reason: Array<{code: ExclusionReason; count: number}>;
    new_pool_count: number; used_pool_count: number;
    independent_sources: number;
    observations: PriceObservation[]; // selected pool; public safe fields only
  };
  insufficient_reasons: Array<'TOO_FEW_COMPARABLES'|'IDENTITY_UNCONFIRMED'|
    'NO_PERMITTED_SOURCE'|'EXCESSIVE_SPREAD'|'NO_FRESH_EVIDENCE'>;
  explanation: Array<{message_key: string; params: Record<string,string|number>}>;
  // deterministic localised rendering, NOT ungrounded LLM prose
  warnings: string[];
};
```

### Category config initial examples (proposed)
Phones: `storage_gb`, `ram_gb`, `pta_status={APPROVED,NON_PTA}`, `lock_status`, `region_model`, `warranty`; used conditional `battery_health_band`, `repair_status`. Laptops: `manufacturer_sku`, `cpu`, `gpu`, `vram_gb`, `ram_gb`, `storage_gb/type`, `display`, `warranty`. Consoles: `generation`, `revision`, `edition={DISC,DIGITAL}`, `storage_gb`, `bundle`, `warranty`. User cannot submit arbitrary unknown attribute keys: category version controls schema. Display taxonomy may offer Unknown to explain why confirmation is required, but Unknown is not assessment-admissible for critical evidence fields. Target phone PTA alone uses unknown_policy=BRANCH, enum APPROVED/NON_PTA/NOT_SURE: absent/skipped normalises NOT_SURE and does not block Check. Candidate evidence with unknown PTA remains excluded. Colour explicitly soft-match only if configured.

## Endpoints
| Method / path | Input / response | Status / behaviour |
|---|---|---|
| GET `/categories` | CategoryConfig[] + ETag | 200/304; read-only local config versions |
| GET `/products?q=&category=&cursor=` | Product summaries, variants, next_cursor | 200; min query length2, max100 chars; max20 results/page; no live third-party scraping |
| POST `/extractions` | multipart normalised image OR JSON `{kind:'LOCAL_OCR', fields...}` OR `{kind:'URL',url}` OR `{kind:'SEARCH',product_id}` | 202 `{job_id,job_token,poll_url,expires_at}`; Idempotency-Key required. LOCAL_OCR text is untrusted, not verified facts. URL permission checked before network access |
| GET `/jobs/{id}` | JobProgress | 200 with `Authorization: Bearer <job_token>`; Retry-After; no secrets in URL |
| POST `/jobs/{id}/advance` | `{expected_version:number}` | 200/202 progress; runs at most one bounded stage, idempotent stage lease; 409 version conflict (refresh), no duplicate provider billing. Client initiates next stage; no unlimited background queue assumed |
| GET `/extractions/{id}` | Extraction | 200 when complete; owner capability; raw OCR trimmed/redacted and never public |
| POST `/assessments` | `{extraction_id?,product_id,variant,asking_price:null|Money,confirmed_fields:string[]}` | 202 job envelope; server validates catalogue/category config; inputs requiring confirmation return422; never trusts client prices as market evidence |
| GET `/assessments/{id}` | CheckResult (below; check_id aliases assessment_id) | 200 owner capability; service failure is503, not false “no market” |
| POST `/checks/{id}/classify` | asking_price + optional confirmed PTA; CheckResult | 200 no new collection; 409 stale/invalidated; full revision below |
| DELETE `/jobs/{id}` | no body | 202 cancellation requested; 204 already terminal; revoke input buffers, provider cancellation best effort; don't falsely promise all remote processing stopped |
| POST `/shares` | `{assessment_id,locale:'en-PK'|'ur-PK',confirm_public:true}` | 201 `{snapshot_id,url,og_image_url:null|string,image_status:'READY'|'PENDING'|'FAILED',expires_at,revoke_token}`; explicit preview before publish; no automatic creation from result fetch |
| GET `/s/{snapshot_id}` | server-rendered immutable safe HTML + OG tags | 200; random >=128-bit CSPRNG URL-safe ID, no sequential IDs; noindex; frozen checked_at and expiry. 404 unknown/revoked,410 expired. Locale support not promise of Urdu translation at launch |
| DELETE `/shares/{snapshot_id}` | Authorization with revoke token | 204; immutable payload remains unchanged, availability revoked; expire/delete public storage per policy |

All private reads are `Cache-Control: no-store`. Rate limit anonymous actions; capability token bound to job/assessment and expiry, never job ID alone; same-origin CORS. `Idempotency-Key` scoped to capability/session, TTL24h. Share noindex is not confidentiality; anybody with link can read it. Proposed expiry30 days; explicit public consent permits retaining sanitised snapshot that long, separate from 24h temporary extraction expiry. Snapshot fields: safe product+variant+condition, asking price (opt-in), ranges/verdict/confidence/counts, checked_at, methodology, safe attribution only. No image, seller PII or raw listing URL by default. A clearly insufficient snapshot may contain no prices.

### Progress schema
```ts
type StepName = 'UPLOADING'|'READING_TEXT'|'IDENTIFYING_PRODUCT'|
  'AWAITING_CONFIRMATION'|'FINDING_LISTINGS'|'MATCHING_VARIANTS'|'BUILDING_RANGE';
type JobProgress = { job_id:string; version:number;
  status:'QUEUED'|'RUNNING'|'AWAITING_CONFIRMATION'|'COMPLETED'|
    'FAILED'|'CANCEL_REQUESTED'|'CANCELLED';
  steps:Array<{name:StepName; status:'PENDING'|'RUNNING'|'COMPLETED'|'SKIPPED'|'FAILED';
    started_at:ISODateTime|null; finished_at:ISODateTime|null; reason_code:string|null}>;
  result_id:string|null; error:ApiError|null; updated_at:ISODateTime;
};
type ApiError = { code:string; message_key:string; params:Record<string,string|number>;
  retryable:boolean; request_id:string; link_failure_reason:LinkFailure|null;
  fallback_actions:Array<'UPLOAD_RIGHTS_CLEARED_IMAGE'|'ENTER_MANUALLY'|'RETRY'> };
```
Use 1s polling then jittered2–5s with Retry-After; stop polling at terminal/confirmation or page hidden. `UPLOADING` is client-origin progress until server receipt; don't report as a measured server step. Skipped steps truthful for search/manual input. Individual advance may take15s; GET shows current stage. Lost response uses same idempotency key; lease expiry/retry must consult stored terminal/provider request state before rerunning a paid action. If browser closes, resume only with local capability; abandon private job after24h, don't charge an invisible workflow forever. SSE is optional future optimisation, not required for MVP.

## Invariants / UI contract
- Selected known-PTA pool fails gates → result_state INSUFFICIENT_DATA; internal assessment verdict INSUFFICIENT_DATA; selected range/median/diffs null; confidence NONE/null. Separate qualifying other-condition pool or verified-retail may remain stored internally but insufficient public/UI envelope hides all price numbers; explicit state precedence below controls rendering. Target PTA unknown follows independent branch rules, not one selected pool.
- Valid evidence and asking_price=null → NO_ASKING_PRICE; range still present; diffs null. No “Fair” without asking price. Otherwise Fair/High/Unusually Low per v0 deterministic policy for a selected PTA pool; indicative=true only if a price verdict exists and confidence LOW. low_confidence_modifier=true for any LOW range, including NO_ASKING_PRICE and PTA_SPLIT.
- `included_count + excluded_count = retrieved_count` for selected-pool candidate evaluation after recording all primary exclusions once; counts for alternative pools are reported separately and **not** added into this equality. `used_condition_included_count` is zero for selected new, included_count for selected used. Document the difference in UI copy.
- Every displayed evidence price/verified-retail has observed_at + **per-source retrieved_at** and source URL/name/variant/condition/city where licensed. Do not show a universal “now” on stale underlying offers.
- Link reasons distinguish unsupported vs prohibited vs removed vs operational failure. OLX URL returns NOT_PERMITTED with no target fetch; private URL risk UNSAFE_URL. “Screenshot fallback” is rights-conditioned, not blanket legal permission.
- Originals stay local; strip EXIF via decode/re-encode; remote accepted image4MiB/4MP max. No stored screenshot, 24h temporary field expiry,30-day explicitly shared sanitised snapshot proposal. Privacy strings must match real vendor policy.
- ICU `message_key`/params externalise all copy; client/server use same locale resources, HTML escapes and Intl PKR format. No text burned into screenshots except controlled share-card rendering. No inferred success percentages; reasoned, actual step states.

## Example semantics (illustrative, not live results)
Five illustrative comparable prices yield new_market P10=PKR98,800, P90=105,200, median102,000 (minor-unit amounts9,880,000 /10,520,000 /10,200,000). Asking115,000→HIGH, confidence82, included_count5, excluded_count1 (non-PTA), retrieved_count6; used_market=null, verified_retail=null. Missing asking price→NO_ASKING_PRICE; two eligible offers→INSUFFICIENT_DATA and no headline range. See methodology for complete arithmetic.

## Acceptance tests required, not executed
Contract validation for all verdicts/nullability; illegal/incompatible variants; extraction low-confidence/no-price/multiple products; all link errors; polling transition/cancel/race/idempotency; private capability denial; share entropy/expiry/revoke; EXIF rejection; no PII in share/logs/cache; ICU/plurals/en-PK/ur-PK/RTL. G2 contract v1 requires PM and Design sign-off; revision below defines full state coverage.


## Revision v0.2 — authoritative response envelope and complete UI states
Reviewed UI/UX state inventory `design/uiux/d2-ia-and-flows.md` and PRD v0.2 on9 Nov2026 PKT. This revision governs any conflict with the earlier per-pool Assessment type: **Assessment is an internal/selected-pool detail, not the top-level UI result**. No endpoint implementation is claimed.

### Result shape and precedence
```ts
type PriceVerdict = 'FAIR'|'HIGH'|'UNUSUALLY_LOW';
type EvidenceSummary = Assessment['evidence'];
type InsufficientReason = Assessment['insufficient_reasons'][number];
type PtaBranch = {
  pta_status:'APPROVED'|'NON_PTA';
  state:'INSUFFICIENT_DATA'|'RANGE_AVAILABLE';
  pool:MarketPool|null; // null on insufficient; never a fabricated range
  evidence:EvidenceSummary; insufficient_reasons:InsufficientReason[];
};
type RangeData = {
  mode:'SINGLE_POOL'|'PTA_SPLIT';
  selected_assessment:Assessment|null; // null for unconfirmed PTA
  pta_branches:PtaBranch[]; // [] for SINGLE_POOL; two evaluated branches otherwise
  asking_price:Money|null;
  verdict_slot:{state:'PRICE_VERDICT'|'NO_ASKING_PRICE'|'PTA_SELECTION_REQUIRED';
    verdict:PriceVerdict|null; message_key:string};
  confidence:Confidence; // SINGLE_POOL confidence; split conservative summary below
  low_confidence_modifier:boolean;
};
type ResultBase = {
  check_id:string; classification_version:number;
  checked_at:ISODateTime; // immutable evidence assessment time
  classified_at:ISODateTime; // this asking-price classification time
  valid_until:ISODateTime|null;
  methodology_version:string; category_config_version:string;
};
type CheckResult = ResultBase & (
  {result_state:'ERROR'; error:ApiError; data:null;
    confidence:null; low_confidence_modifier:false} |
  {result_state:'INSUFFICIENT_DATA'; error:null; data:null;
    evidence:EvidenceSummary; insufficient_reasons:InsufficientReason[];
    confidence:{score:null;level:'NONE';reasons:[]}; low_confidence_modifier:false} |
  {result_state:'RANGE_AVAILABLE'; error:null; data:RangeData;
    confidence:Confidence; low_confidence_modifier:boolean}
);
```
Evaluate Error first, then Insufficient, then Range available. Error is **not** a market verdict. Top-level duplicate confidence/modifier must equal data values when range available. Insufficient data has no displayed range/retail/price verdict; retain diagnostic counts/reasons, no numbers masquerading as estimates. Private stored records can retain inputs without exposing them in result envelope.

Known PTA: one selected assessment, slot NO_ASKING_PRICE with verdict=null if price absent, PRICE_VERDICT otherwise. Unknown target PTA: collect separately; one or both branches must independently pass n>=3 and all gates. If neither does, INSUFFICIENT_DATA; otherwise PTA_SPLIT with `selected_assessment=null`, slot PTA_SELECTION_REQUIRED and verdict=null, even if asking price exists. Branch-level new/used/verified retail remain labelled and nullable per original types. Candidate PTA unknown is excluded. No n2+n2 aggregation. Passing branch confidence capped49, PTA_UNCONFIRMED reason; split summary=min(passing branch capped scores), LOW, with reason and explanation that this is the **weakest displayed branch**, not a blended market estimate. Branch n, sources, dates/exclusions remain independent; aggregate evidence summary deduplicates across branches and does not imply pooled sufficiency. Display no single median/range/difference for split. Selecting PTA can classify using its stored valid branch; absent branch gives NO_STORED_RANGE, not the other PTA's valuation.

**Confidence bands:** LOW integer0–49; MEDIUM50–79; HIGH80–100. NONE/null means evidence gates failed, not score below some cutoff. n3–4 or d<2 caps49; normal confidence needs n>=5,d>=2. All other methodology gates/caps apply. `indicative` is true only when a LOW price verdict exists; no-price/split ranges get caution banner even without an indicative verdict label. Per-field extraction `requires_confirmation=true` when confidence is null or <0.85 (initial UX assumption), OR critical field absent/conflicting; model self-reported score cannot waive a hard-field requirement. User confirmation resolves field routing, not market-evidence confidence.

### New lightweight endpoint
`POST /api/v0/checks/{id}/classify`, where id is existing check_id/assessment_id (one identifier, not a second check service).
- Capability-authenticated, `Idempotency-Key` and `If-Match` classification version required.
- Input `{asking_price:Money, pta_status?:'APPROVED'|'NON_PTA'}`; positive safe integer PKR amount. Changing model, condition, storage or other variant attributes is rejected422 VARIANT_CHANGE_REQUIRES_CHECK.
- Success200 CheckResult, new classification_version; same fixed comparable snapshot/median, no OCR/LLM/source calls. Preserve checked_at/observed_at/retrieved_at and valid_until; classified_at now. Recompute recency score/caps using stored evidence only, not a refreshed range. Original snapshots unchanged.
- Stale409 RANGE_STALE when now>earliest evidence observed_at+14/30days or earlier contractual expiry. For split use selected branch validity, not the other branch. Permission/config/methodology revoked409 EVIDENCE_INVALIDATED; unknown/no retained qualifying branch422 NO_STORED_RANGE; PTA still unknown422 PTA_SELECTION_REQUIRED; concurrency409 VERSION_CONFLICT; expired private check410 CHECK_EXPIRED; unknown/unauthorised404 CHECK_NOT_FOUND. All require edit or explicit full recheck; never auto-incur collection spend. No storing original check for longer than its retention policy to support classify.
- Low score is not rejected if evidence gate passes. “Check again” from Recent always starts a full assessment, not this endpoint. Classify stale ranges never silently trims expired observations/rebuilds a new range.

### Error contract: synchronous and asynchronous
`ApiError` additionally requires `http_status:number` and `field_errors?:{field:string;message_key:string}[]`. Synchronous rejection uses listed HTTP status with `{error:ApiError}`. If an accepted202 job later fails, GET job remains200 and job.error.http_status carries the same semantic code/status; GET assessment CheckResult result_state=ERROR carries it too. Transport200 must not hide the error state. `retryable=true` means retry same request might succeed without editing; honour Retry-After, use original idempotency key. A fresh user edit/new image gets a new key. Never auto-retry validation/policy errors.

| Endpoint / case | Code | HTTP status | Retryable | ICU message key |
|---|---|---:|---|---|
| Extraction malformed input/missing idempotency | INVALID_REQUEST |400|false|errors.request.invalid|
| Image unsupported type/magic/container | UNSUPPORTED_IMAGE_TYPE |415|false|errors.image.unsupported_type|
| Image over server bytes | IMAGE_TOO_LARGE |413|false|errors.image.too_large|
| Image pixel/dimension limit | IMAGE_DIMENSIONS_EXCEEDED |422|false|errors.image.dimensions|
| Metadata not stripped | IMAGE_METADATA_NOT_STRIPPED |422|false|errors.image.strip_metadata|
| Rights/policy gate not cleared | INPUT_RIGHTS_UNCLEARED |403|false|errors.image.rights_uncleared|
| Decode fails/unreadable screenshot | IMAGE_UNREADABLE |422|false|errors.extract.unreadable|
| Valid decode but no text | NO_TEXT_FOUND |422|false|errors.extract.no_text|
| Extracted non-MVP category | CATEGORY_NOT_SUPPORTED |422|false|errors.extract.category_not_supported|
| No identifiable product at all | PRODUCT_NOT_IDENTIFIED |422|false|errors.extract.product_not_identified|
| Optional provider timeout | EXTRACTION_TIMEOUT |504|true|errors.extract.timeout|
| Provider failed/invalid structured output | EXTRACTION_PROVIDER_FAILED |502|true|errors.extract.provider_failed|
| Provider not configured or disabled budget | EXTRACTION_UNAVAILABLE |503|false|errors.extract.unavailable|
| Invalid pasted URL | INVALID_URL |400|false|errors.link.invalid|
| Host has no implemented adapter (incl unclear rights) | SOURCE_NOT_SUPPORTED |422|false|errors.link.source_not_supported|
| Known policy forbids site fetch | NOT_PERMITTED |403|false|errors.link.not_permitted|
| SSRF/unsafe URL | UNSAFE_URL |400|false|errors.link.unsafe|
| Allowed URL non-product page | NOT_PRODUCT_PAGE |422|false|errors.link.not_product|
| Verified removed/expired listing | NOT_FOUND_OR_REMOVED |410|false|errors.link.removed|
| Allowed source returns upstream404 | NOT_FOUND_OR_REMOVED |404|false|errors.link.not_found|
| Allowed fetch network/upstream error | FETCH_FAILED |502|true|errors.link.fetch_failed|
| Allowed fetch timeout | TIMEOUT |504|true|errors.link.timeout|
| Catalogue query<2 chars | QUERY_TOO_SHORT |400|false|catalogue.query.too_short|
| Catalogue query>100/malformed cursor | INVALID_QUERY |400|false|catalogue.query.invalid|
| Unknown category config | CATEGORY_NOT_FOUND |404|false|catalogue.category.not_found|
| Unknown product ID | PRODUCT_NOT_FOUND |404|false|catalogue.product.not_found|
| Catalogue DB unavailable | CATALOGUE_UNAVAILABLE |503|true|catalogue.unavailable|
| Catalogue query timeout | CATALOGUE_TIMEOUT |504|true|catalogue.timeout|
| Any rate limit | RATE_LIMITED |429|true|errors.rate_limited|
| Assessment/DB cannot evaluate evidence | SERVICE_UNAVAILABLE |503|true|errors.check.unavailable|
| Analysis deadline exceeded | ANALYSIS_TIMEOUT |504|true|errors.check.timeout|
| Invalid/missing critical confirmed field | CONFIRMATION_REQUIRED |422|false|errors.check.confirm_fields|
| Classify range stale | RANGE_STALE |409|false|errors.classify.range_stale|
| Classify permission/config invalidated | EVIDENCE_INVALIDATED |409|false|errors.classify.invalidated|
| Classify no stored qualifying range | NO_STORED_RANGE |422|false|errors.classify.no_range|
| Classify PTA still unknown | PTA_SELECTION_REQUIRED |422|false|errors.classify.confirm_pta|
| Classify changed variant | VARIANT_CHANGE_REQUIRES_CHECK |422|false|errors.classify.variant_changed|
| Concurrent stage/classification | VERSION_CONFLICT |409|true|errors.request.version_conflict|
| Missing/invalid capability | CAPABILITY_REQUIRED |401|false|errors.session.required|
| Unknown or unauthorised resource | CHECK_NOT_FOUND |404|false|errors.check.not_found|
| Private check expired | CHECK_EXPIRED |410|false|errors.check.expired|
| Unexpected uncaught error | INTERNAL_ERROR |500|true|errors.internal|

A repeated502 invalid provider output may need manual fallback; retries bounded to one automatic retry, not an infinite paid loop. All ICU keys are proposed catalogue identifiers, not existing translations; params include actual limit_bytes, max_pixels, min_length, retry_after_seconds where relevant. No raw upstream HTML/provider details exposed. No matching catalogue products is **200 `{items:[],next_cursor:null,empty_reason:'NO_MATCHES',message_key:'catalogue.no_matches'}`**, not404. Valid multiple candidates/no visible price are successful Extraction flags/candidates, not errors. Unknown PTA alone never triggers CONFIRMATION_REQUIRED.

### PRD reason-code reconciliation
Keep both codes distinct, not aliases: **NOT_PERMITTED (403)** = known source-policy restriction; **SOURCE_NOT_SUPPORTED (422)** = no supported approved adapter/unclear permission. Remove earlier spelling UNSUPPORTED_SOURCE; canonical PRD/API spelling is SOURCE_NOT_SUPPORTED. **OLX and Daraz website URLs use NOT_PERMITTED** (no fetch); PriceOye/unclear hosts use SOURCE_NOT_SUPPORTED unless subsequent policy review explicitly prohibits. Empty allowlist never changes a known forbidden source to “we just haven't built it”. PRD F2/US9 must name both outcomes. Meta-tag-only fetching is still automated access and still gated.

### Complete UI state inventory mapping
Every row in the UI/UX inventory is covered below; frontend-only failures have **http_status=null**, never an invented server status. Preserve confirmed inputs/query/link in session, retaining image only in memory after Search switch; clear on session end/user action. Do not persist screenshots through Recent/service-worker caches.

| UI anchors/states | Contract / state transition and fallback |
|---|---|
| H Home header, three entries, category chips | GET/categories + local ICU language control; English launch, Urdu architecture only. App shell remains navigable if catalogue fails; show retry, never fake catalogue |
| REC/STORED/RC Recent save/reopen/check-again/clear | Store sanitised dated snapshot+safe confirmed facts on device only, no capability secrets/images/PII. Save RANGE_AVAILABLE or INSUFFICIENT only, never ERROR; show original checked_at, never current; Check again submits fresh assessment; Clear removes local records only |
| PRIV privacy sheet | Versioned policy notice/ICU keys; no unapproved retention/“nothing stored” promises; distinguish local image, temporary fields, vendor retention, public share |
| A0/A1/A4 pick/validate/compress/cancel | Client configured10MiB original; server4MiB/4MP normalised request (proposals); type/magic/metadata/dimension validation server-side. CLIENT_IMAGE_PROCESSING_FAILED local code + errors.image.processing, retryable=false; reselect/manual fallback |
| A2/A3 unsupported/too large | UNSUPPORTED_IMAGE_TYPE / IMAGE_TOO_LARGE; show configured limit, pick again |
| A5 preview | Local preview/crop/redaction; Continue rights-conditioned; pick again; image not public |
| A6 extracting/upload/read/identify/cancel | Actual JobProgress stages; upload client-origin; DELETE cancellation returns preview with edits preserved; provider cancellation best-effort; no fake percentages |
| AU/A7/A8 unreadable/no text | IMAGE_UNREADABLE vs NO_TEXT_FOUND share layout, distinct ICU/analytics; Retake or Search retaining local image only in session |
| A9 outside MVP | CATEGORY_NOT_SUPPORTED; Search or category picker, no pricing |
| A10 multiple | successful multiple_products=true,candidates, candidate_selection_required=true; select candidate_id before confirmation; no automatic first-item choice |
| A11/A12 no price | successful no_price_found=true, asking_price=null; optional price input; evidence evaluation proceeds |
| B0/B1/B2/BP URL/invalid/clipboard | INVALID_URL inline; CLIENT_CLIPBOARD_UNAVAILABLE/CLIENT_CLIPBOARD_DENIED http=null, retryable=false, clipboard.unavailable/clipboard.denied; editable field/manual paste; no automatic clipboard reads |
| B3/B6 permitted link extraction | URL policy guard before fetch; actual progress, no scraping claims; unknown/forbidden below |
| B4/B5/B7 unsupported/not permitted/fetch failed | SOURCE_NOT_SUPPORTED/NOT_PERMITTED/FETCH_FAILED, distinct reasons; preserve URL, manual entry; screenshot fallback only when input rights policy clears it |
| B8/B9/B10 non-product/removed/timeout | NOT_PRODUCT_PAGE/NOT_FOUND_OR_REMOVED/TIMEOUT; retain URL; timeout retry idempotently or rights-cleared image/manual |
| FB/BM empty manual Confirm | No catalogue product picked yet; category config fields; require confirmed model+condition/other critical attrs; no fetching source while entering facts |
| C0/C1/C5 search/typeahead/pick | GET/products returns items/product IDs/aliases and category config refs; category chips narrow; pick pre-fills model, price optional |
| C2/C3/C4 short/no match/unavailable | QUERY_TOO_SHORT client hint before call;200 empty NO_MATCHES gives spelling tips/category browse; CATALOGUE_UNAVAILABLE/TIMEOUT shows Retry with query/chips intact |
| CF/CD/CV/CX/CP Confirm/Detected/Edit/focus/disabled/PTA | Confidence per field; focus first required uncertain field. Disabled only for model/condition/other required non-PTA critical fields. Missing PTA/Not sure may continue to split ranges; no silent guessing |
| Swappable price/condition controls | Category config version and ICU/Intl formatting; grouping Option A/B unresolved. Used/refurb/kit rules require approved config; do not silently map open-box/kit/10-of-10 to standard used |
| AN/AL analysing/long/cancel | Actual find/match/build steps; after proposed10s show check.still_working (not a completion promise); total proposed30s soft deadline gives ANALYSIS_TIMEOUT; cancel returns confirmed inputs |
| OFF network loss from A6/B6/C1/AN | CLIENT_OFFLINE http=null,retryable=true,network.offline; retain session inputs. On reconnect GET known job first, then resume versioned advance with same idempotency key; unknown submission response reuses key, never duplicate paid operation. Automatic reconnect retry at most once per reconnect, respect429/backoff; manual Retry available |
| RF full | RANGE_AVAILABLE/SINGLE_POOL, PRICE_VERDICT, range/evidence/source provenance |
| RL Low modifier | LOW0–49, caution+reasons+counts on any range; Indicative only if price verdict exists; unknown PTA forced LOW |
| RN no asking price / VR inline add | RANGE_AVAILABLE with NO_ASKING_PRICE; POST/checks/id/classify no source collection; stale409→offer explicit full Analysing; unknown PTA→confirm PTA, not wrong-pool verdict |
| RI insufficient | INSUFFICIENT_DATA; no price numbers/verdict; diagnostic counts/reasons. Edit/nearby variant requires user choice and new assessment; later retry only user action; share “Not enough data” |
| RE Error | ERROR before all domain outcomes; keep inputs, Retry/back Confirm; no saved Recent/Error share |
| CI/CONF confidence sheet | versioned methodology reasons/counts/bands; own-score explanation, not probabilistic accuracy claim |
| SH/S0/SAFE/REDACT/SI share / insufficient | Explicit public consent, immutable sanitised snapshot first; no seller data/image/target URL by default; only available fields, no numbers for insufficient; LOW card includes caution and Indicative only for verdict |
| S1/S2/S3 native success/cancel | Only invoke Web Share on gesture; resolved promise returns to result (not proof WhatsApp delivered); AbortError=CLIENT_SHARE_CANCELLED http=null retryable=false share.cancelled, neutral return, not failure toast |
| S4/S5/S6 native unavailable/failure/copy/download | CLIENT_SHARE_UNAVAILABLE/CLIENT_SHARE_FAILED http=null retryable=false share.unavailable/share.failed →Copy link/Download. CLIENT_COPY_FAILED/CLIENT_DOWNLOAD_FAILED http=null retryable=true share.copy_failed/share.download_failed → selectable URL/manual copy or retry download; no delivery claim |
| GF image generation fails | Persist snapshot before PNG rendering; POST/shares201 still returns valid url,image_status=FAILED,og_image_url=null +warning SHARE_IMAGE_FAILED/message share.image_failed. Copy link survives; Download unavailable/retry image only. Snapshot-creation failure503 SHARE_SNAPSHOT_UNAVAILABLE retryable=true share.snapshot_unavailable returns no URL—show retry, do not invent link |
| S7/SNAP public | Immutable dated server HTML+noindex+128bit ID; CTA home. Unknown/revoked404 SNAPSHOT_NOT_FOUND,share.snapshot_not_found; expired410 SNAPSHOT_EXPIRED,share.snapshot_expired; service503 SNAPSHOT_UNAVAILABLE,retryable=true,share.snapshot_unavailable. 404/410 not retryable; offer fresh check. OG failure doesn't remove HTML |

### Consolidated screenshot posture (replaces unconditional PRD fallback)
Distinguish transient **target extraction** from ingestion/redistribution. User ownership of a screenshot does not establish rights to all depicted content. For user's own/rights-cleared ad images: conditional private extraction, EXIF stripped, redacted, no image retention beyond request processing and no reuse as comparables. For OLX/Daraz or other third-party platform screenshots: **legal-review gate before enabling automated extraction in MVP**; absent clearance return INPUT_RIGHTS_UNCLEARED with manual facts fallback. This is a conservative launch policy under ambiguous third-party processing rights, not a claim that every private screenshot analysis is legally prohibited. EXIF removal, short retention or uploader consent alone do not grant platform/content rights. No screenshot/target ever enters its own benchmark; reusable evidence needs separate rights/provenance verification, not merely consent. No source-site fetch for pasted restricted URL. Apply origin/rights question before client OCR; client processing must not bypass app policy. Cannot reliably infer platform origin from every image, so use explicit rights/origin declaration and documented review policy, not a claimed automatic copyright detector.

### Additional required tests (specification only)
Every error/status/key row; async semantic status vs200 transport; n2/n3 and49/50/79/80 boundaries; error+insufficient precedence; split n2+n2 insufficient, one eligible branch, missing PTA permits submission, no global split verdict; classify fresh/exact-expiry/expired/revoked/config-version/price-only/unchanged n/methodology; stale action no provider calls; cancellation/offline replay; failed PNG with working snapshot; copy/download/cancel/public404/410; all inventory traceability rows. Nothing executed in this document task.
