# UI ↔ CTO contract v0.5 mapping
Re-read CTO `03-api-contract-v0.md`, including authoritative Design handoff v0.5. v0.5 supersedes the older nullable-classify, evidence and snapshot gaps below. Portable source reference: `../../../cto/03-api-contract-v0.md` on the shared box tree (source remains CTO-owned). DD baseline: Day 1 spec §4. This mapping supersedes D2 assumptions and D3 numerical examples. Contract is a draft, not implemented endpoints.

## State routing (not a verdict enum)
1. `CheckResult.result_state === 'ERROR'`: `error: ApiError`, `data:null`; retain private inputs separately, no market finding, no Share/Recent save.
2. `INSUFFICIENT_DATA`: `data:null`, `evidence`, `insufficient_reasons`; no price numbers, ranges/retail/verdict or low modifier. Confidence NONE; diagnostic counts only.
3. `RANGE_AVAILABLE`: `data: RangeData`, top-level `confidence` and `low_confidence_modifier` must equal `data` values. Modifier does not replace state.
4. `data.mode === 'SINGLE_POOL'`: `data.selected_assessment` supplies selected values; `data.verdict_slot.state` PRICE_VERDICT or NO_ASKING_PRICE. PriceVerdict only FAIR/HIGH/UNUSUALLY_LOW. Show Indicative chip only with LOW + PRICE_VERDICT, not no-price or split.
5. `data.mode === 'PTA_SPLIT'`: `selected_assessment:null`; `pta_branches` independently qualifying pools; slot PTA_SELECTION_REQUIRED and verdict null even if asking exists. No global range, market median, difference or verdict. Caution, not Indicative. One passing branch is sufficient to show its own range; explain missing branch, never pool n2+n2.

## Field mapping
|UI requirement (DD §4)|Actual field / conversion|Null / special behavior|
|---|---|---|
|Product header|`confirmed_context.product.display_name`; `confirmed_context.variant.attributes/condition/used_grade/pta_status`|ResultBase.confirmed_context is available on every confirmed state, including split/insufficient. Null before validated confirmation: generic header. Never raw OCR/listing/seller text.|
|Asking price|`data.asking_price: Money|null`; selected `.asking_price` must agree|Money `amount_minor` integer paisa /100, PKR. Optional price absent is not zero.|
|Selected market range|`data.selected_assessment.range_low`, `.range_high` Money|Never range from alternate condition or branch. Null for insufficient.|
|Market median tick / anchor|`data.selected_assessment.median` Money|Not arithmetic center of endpoints. Position on number axis only.|
|Fair tinted zone|`data.selected_assessment.fair_band_low`, `.fair_band_high` Money|Present whenever median exists, including no-price. Server-computed; UI never multiplies median by thresholds. If absent, suppress band and flag contract violation rather than compute it.|
|Server verdict label/icon/color|`data.verdict_slot.verdict` when slot PRICE_VERDICT|Do not derive from endpoints, rounded difference or marker geometry.|
|Difference amount|`selected_assessment.diff_absolute_minor` signed paisa|/100 for display; use magnitude and direction, not asking-range arithmetic. Null without price/median.|
|Difference percent|`selected_assessment.diff_percent` decimal fraction; e.g. 0.0882 = 8.82%|`Intl.NumberFormat(style:'percent', 1 decimal)`. No extra /100; never derive verdict from display. See rounding table.|
|Confidence row|`confidence.level`, `.score`, `.reasons[{code,message_key,params}]`|Score not probability of correctness; illustrative High82. NONE for insufficient, no invented Error score.|
|Modifier|`low_confidence_modifier`; `selected_assessment.indicative` if price verdict|LOW no-price/split gets neutral caution; no Indicative label.|
|Evidence count|`selected_assessment.evidence.included_count`; insufficient top-level `.evidence.included_count`; branch `.evidence.included_count`|Selected pool only. “N listings used”; alternative pool counts not summed into sufficiency. `used_condition_included_count` means condition, not all listings used.|
|Newest date|`.evidence.evidence_newest_effective_at`|Server computes max effective date over all included rows, not the capped subset; PKT format. Null means unavailable, never “now”.|
|Evidence rows|`.evidence.observations[].price`, `.variant.attributes/condition/city`, `.source.source_name/url/observed_at/retrieved_at`|URL nullable: plain attribution, no dead link. Raw target URL never shared by default.|
|Evidence heading and Show all N|`.evidence.included_count`; `.observations` array|Inline expand of returned observations only, no pagination. `evidence_total_included`, `evidence_truncated`, cap50. Never promise unavailable rows.|
|Exclusions|`.evidence.excluded_count`, `.excluded_by_reason[{code,count}]`|Counts by primary reason only; no excluded row records, URLs, prices or titles.|
|New vs used / verified retail|`.new_market/.used_market` MarketPool; `.verified_retail.value/kind/label_key/provenance`|All independently nullable. Verified retail not original price; no price anchors displayed in insufficient envelope.|
|Range method info sheet|selected MarketPool `.range_method` MIN_MAX or P10_P90; selected via `.selected_pool`|n3–4 min–max, n>=5 P10–P90 per server method. Method label belongs in info sheet, not verdict threshold.|
|Explanation|`.explanation[{message_key,params}]`, `.warnings`|Deterministic localized text, escaped, not invented LLM claim.|
|Check/freshness dates|top-level `.checked_at`, `.classified_at`, `.valid_until`, `.classification_version`|Immutable evidence time preserved after classify. PKT rendering; do not imply evidence refreshed.|
|PTA branches|`data.pta_branches[].pta_status/state/pool/evidence/insufficient_reasons`|APPROVED and NON_PTA never blend. branch pool low/high/median and confidence remain separate; no global market median.|
|Branch Fair band|`pta_branches[].fair_band_low`, `.fair_band_high`|Informational only; no Fair/High label before PTA selection. Null if branch insufficient.|
|Confirm detected fields|`Extraction.fields[key].value/confidence/origin/requires_confirmation/reason_codes`|Focus first uncertain required field. Market confidence is not extraction confidence.|
|No price/multiple/category|`no_price_found`, `multiple_products`, `candidates`, `candidate_selection_required`, `unsupported_category`|Successful extraction flags, not generic service failures.|
|Category/conditions|`CategoryConfig.attributes[]`, `required_for_assessment`, `unknown_policy`, `condition_values`, `used_grade_values`|Versioned config; never hardcode unsupported Refurbished/Kit mapping to USED.|
|Progress|`JobProgress.steps[].name/status`, top-level `status/error`|Client upload stage truthful; no fake percentage. Cancellation best effort.|
|Error actions|`ApiError.code/message_key/params/retryable/http_status/field_errors/fallback_actions/link_failure_reason`|Async GET 200 does not imply success; inspect error state. Only retry retryable conditions.|
|Share|POST `/shares`→`snapshot_id,url,og_image_url,image_status,expires_at,revoke_token`|Explicit preview + `confirm_public:true`; no actual share calls in these files. Image FAILED still valid snapshot link; snapshot failure no URL.|

## API operation handoff
- Confirm → POST `/assessments`: `{product_id,variant,asking_price,confirmed_fields,extraction_id?}`. Confirm data maps to Variant config, not free text attribute keys.
- Inline price / branch selection → POST `/checks/{id}/classify`, `Idempotency-Key`, `If-Match` classification_version; `{asking_price?:Money|null,pta_status?:APPROVED|NON_PTA}`. No provider/collection call. Preserve checked_at and evidence dates. Stale409/invalidated/expired/no stored branch → explain and offer explicit full Check again, never silently incur spend.
- CTO v0.5: `{pta_status: APPROVED|NON_PTA, asking_price:null}` valid. Passing branch → SINGLE_POOL No-price (range/Fair band/Add asking price); stored insufficient branch →200 INSUFFICIENT_DATA, reasons NO_STORED_RANGE first, diagnostics only. Unknown/unevaluated branch →422 NO_STORED_RANGE. Never use the other branch numbers. Omitted asking_price preserves stored value, explicit null clears it. {} or null-only is422 CLASSIFICATION_INPUT_REQUIRED.
- Offline reconnect: GET known job first, then versioned advance with same key. At most one automatic retry per reconnect; respect Retry-After/backoff; manual Retry. Never automatic policy/validation retry.
- Cancel → DELETE job, return inputs; no promise provider processing instantly stopped.
- Recent saves sanitized local dated snapshot/confirmed facts for Range/Insufficient only, never images, PII or capabilities; Check again always full new assessment.
- Restricted source → explicit NOT_PERMITTED. Screenshot fallback rights-conditioned, not a bypass; manual facts always available.

## Reconciled and open mismatches versus DD §4
- Median and Fair bands now in revised contract: replaces ambiguous original DD anchor; endpoints not thresholds. diff_percent fraction confirmed by updated comment.
- PTA missing/skipped normalises NOT_SURE and does not block per CTO §9; earlier DD required-answer assumption conflicts. Frames show selected answer and disabled Model confirmation only. **Founder + DD/CTO to ratify**; keep in assumptions register.
- Condition Option A Refurbished/Kit/Open box not supported by `Condition='NEW_SEALED'|'USED'`; Founder/PM must ratify taxonomy and CTO config. Never silently collapse categories.
- Resolved in v0.5: ConfirmedCanonicalContext and ShareSnapshotPayload provide safe context; EvidenceObservation and explicit cap/totals provide inline evidence. ICU resource integration remains implementation work.
- `fair_band_low/high` present as revised fields; integration/schema tests still required (not implemented). Never client fallback thresholds.
- Stack React/Vite + Hono (TypeScript) proposed by CTO, pending Founder. Handoff stays framework-agnostic CSS+JSON, no React code.
- Screenshot privacy, upload and retention proposals not approved copy. Security must approve; placeholder remains.

## C1/C2 DD follow-up — authoritative decisions
**Design Director review: ready for G2, conditional on C1/C2.** C1/C2 applied in artefacts; Founder owns the G2 gate.

### Canonical share rule
Share card and snapshot use **only user-confirmed canonical fields**: catalogue model plus versioned variant, condition and PTA. Never raw OCR text, listing titles or seller-entered strings. `ShareSnapshotPayload.confirmed_context` is server-derived from validated confirmed state, not client display_name. Server-rendered HTML/PNG freeze that payload. POST/shares accepts ID/version/consent/locale/price opt-in, not a client snapshot object. Default no price opt-in means public asking_price and diffs null, NO_ASKING_PRICE and indicative=false; example price-bearing cards represent explicit opt-in.

### Evidence expansion (resolved, no pagination)
All included EvidenceObservation rows inline, sorted match_quality DESC then source.retrieved_at instant DESC; tie source_id ASC then observation_id ASC. Return first50 only; `evidence_total_included` is full included count and `evidence_truncated` is true only above50. Expand returned full list inline; label Show all N only when N available. When truncated show returned/total and ICU evidence.truncated {shown:50,total}; no extra evidence endpoint. Excluded evidence is counts by reason only. Confidence newest date uses evidence_newest_effective_at over the entire included set, not capped rows or retrieval sorting.

### Range C1 anatomy
One **uniform linear** monetary axis, domain `[min(fair_band_low,range_low,asking),max(fair_band_high,range_high,asking)]` plus5% span padding at each end; omit asking when null. Price thus plots at true position. No default extreme-value clipping: axis expands. Clamp only if a value is beyond an explicitly fixed domain. Most listings text identifies dark segment; no Low/High labels under Fair box. Fair tag at tint top-start; Median micro-label anchored to tick. Share keeps marker core, omits duplicate marker-value label. Numeric bar/labels have dir=ltr even in RTL UI; to validate with Urdu-reading users before Urdu launch.
