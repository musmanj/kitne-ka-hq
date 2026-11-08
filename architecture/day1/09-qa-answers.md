# QA answers — pricing v0.1, pack v1.1 (120 vectors)
CTO ·9 Nov2026 PKT. Authoritative decisions: `02-pricing-methodology-v0.1.md`; API amendment v0.4 in `03-api-contract-v0.md`. **18 requested questions**, Q1–Q10/Q17–Q24 (not14). Q11–Q16 belong to the separate PM/Founder normalisation scope decisions; no silent approval here.

## Answers
|Q|Decision / rationale / affected vectors|
|---|---|
|1|**Use exact P90−P10 / median >.30 for WIDE_SPREAD cap79 even n3–4**, despite MIN_MAX displayed. Compute internal quantiles. n3–4 already capped49; width reason still useful. This now rules the Engineer assumption; separate hard gate(max−min)/M>.60. CON-06/07; add small-n test.|
|2|Stats, fences, median, diff and verdict remain exact rational; half-even only final Money output. Fair band exact M×.85/M×1.10 then half-even. RNG-05/BND-01/02. Do not compare rounded labels for verdict.|
|3|Exact C_raw→round half-even once→min all caps→band.78.5→78,72.5→72;49.5→50 then small-n cap49. CON-10 resolves78; **CON-12 expected73 conflicts, correct72**. Float Math.round78 from78.49999 is not evidence of correct tie policy.|
|4|Age=max(0,now−min(valid observed_at,source_updated_at))/86,400,000ms, fractional days; one timestamp fallback; both missing UNDATED. New<=14.0/used<=30.0 inclusive. now injected checked_at; classified_at for classify R/recency/freshness recomputation. No timestamp/TTL reset. FIL-01/02/05/15/16,CLS-01/02.|
|5|Count resolved **ultimate sellerOwnerId**, not API vendor/domain/platform parent. One licensed API can expose several independently verified merchant owners. Canonical seller identity required; transport/source metadata alone doesn't establish diversity. Dedup owner+variant+condition one newest eligible offer. This intentionally refines old platform-independence wording.|
|6|All-stale: `[NO_FRESH_EVIDENCE,TOO_FEW_COMPARABLES]`, both, in that stable order. Empty discovery alone TOO_FEW; absent approved capability adds NO_PERMITTED_SOURCE. No fabricated confidence0. INS-09 resolves.|
|7|Supplied asking_price.amount_minor=0 or negative/noninteger/out-of-range→**422 INVALID_ASKING_PRICE**,retryable=false,`errors.price.invalid`, both assessments and classify. Null alone means absent, classify requires positive non-null. VER-15 resolves.|
|8|Primary unknown candidate PTA→UNKNOWN_CRITICAL_ATTRIBUTE; known mismatching PTA→VARIANT_MISMATCH; zero/EMI/instalment candidate→PRICE_NOT_COMPARABLE. Exactly one primary exclusion per candidate; ordered full precedence in02 §5. Target listing/rights/currency/price before stock/identity/condition/variant, then invalid/undated/stale/provenance/dedup/outlier. Detailed ZERO normaliser reason is not an ExclusionReason. PTA-04,FIL-09.|
|9|IQR0 and max>min→`warnings:['IQR_ZERO_SPREAD_REVIEW']`; do not automatically trim, penalise or block. Final hard spread/evidence gates still apply. IQR0/all identical no anomaly warning. OUT-03 resolves.|
|10|Malformed either provided timestamp or any timestamp>now+300s→INVALID_TIMESTAMP primary temporal reason. Both missing→UNDATED. Freshness uses older valid observation/update. FIL-13/14; future boundary clarified Q22.|
|17|PTA split summary=min(capped scores of **passing** branches); one passing branch uses its score. Failed branch ignored, never null→0. No passing branches NONE/null/insufficient. Each unconfirmed branch cap49. PTA-02 summary49LOW; PTA-03 same.|
|18|NO_ASKING_PRICE+LOW: indicative=false,low_confidence_modifier=true; no fabricated price verdict. Indicative=true only when LOW price verdict exists. PTA_SELECTION_REQUIRED same nonverdict rule. VER-14/16.|
|19|SINGLE_SOURCE iff d=1 resolved ultimate seller owner, even across domains/APIs/platforms. Shared platform parent alone not sufficient. With one offer/owner, integrated n=d normally; keep scorer n/d unit fixtures for independent cap tests. FIL-08 needs seller ownership fixture.|
|20|One IQR pass for pre-trim n>=8 **before** final n>=3 and max/min spread gate. Recompute final stats once; do not re-run IQR. OUT-04/05.|
|21|GEO_SPREAD compares medians of>=2cities each with>=2 included offers. Denominator=overall included median **including city-null**. Null/singleton city only excluded from city groups. Trigger strictly>.15; no score penalty/block. GEO-01/02/03/04.|
|22|Future skew exactly300s admitted,301s excluded; accepted future effective age clamped0. Check each supplied timestamp before older-of fallback. FIL-14 resolves as specified, FIL-13 remains rejected.|
|23|Positive decimal rounding0paisa→**ZERO**, same as literal zero (not TOO_SMALL); raw negative retains NEGATIVE. Technical bounds1..Number.MAX_SAFE_INTEGER paisa acceptable; not market plausibility bounds. NRM-45 resolves ZERO; NRM-31/32 retained.|
|24|Done: INVALID_TIMESTAMP in ExclusionReason; GEO_SPREAD/NEAR_EXPIRY in ConfidenceReason; fair_band_low/high Money fields in PricePool/DTO and02. Warnings, normaliser errors, metadata and classify rules typed in03 v0.4.|

## All120 reviewed; conflicts and fixture corrections
Scope: read all120 JSON vectors plus companion Markdown v1.1; reviewed expected states/codes/policies against v0.1, independently spot-checked key rational arithmetic, percentile/fair-band/confidence ties/city medians. **No Engineer code read/run, no QA JS probe/oracle run, no product tests or passing-test claim**. Not a replacement engine/oracle.

Evidence (CTO-owned only): `evidence/qa-v1.1-reviewed-input.json` frozen120-vector snapshot, `evidence/qa-v1.1-arithmetic-review.json`120-entry review inventory/calculations, `evidence/qa-review-arithmetic.py` independent spot-check script. QA originals untouched. Categories total: RNG5,INS9,VER16,CON15,PTA8,OUT5,FIL16,PRE1,CLS4,NRM32,BND2,NEX3,GEO4=120. Some TBDs are decisions/under-specification rather than incorrect expected values.

|Vector|Conflict / exact required correction|
|---|---|
|CON-12|72.5 half-even is **72 MEDIUM**, not73.|
|NRM-25|Input **1.23456 lac**=123456PKR=**12345600paisa**, not12345670. Alternatively change input to1.234567lac to retain12345670. This is a concrete arithmetic inconsistency in the reported prior ruling; v0.1 explicitly corrects it, does not alter numeral conversion to fit erroneous expected value.|
|FIL-08|Three marketplaces under group G are not enough to derive d=1; fixture source_owner_id is platform ownership, not sellerOwnerId. Add resolved ultimate seller-owner data. If five distinct verified seller owners→n=d=5, no SINGLE_SOURCE cap; if one owner→dedup n=d=1→Insufficient. Cannot retain integrated n5,d1 result merely because platforms share parent.|
|NRM-34|String99,99,99,99,99,999=**999999999999900paisa**, below9007199254740991 safe max. "Exceeds safe integer" rationale wrong. Configured plausibility might still flag absurd value, but bounds/approval required; not evidence of technical overflow. Fix rationale and provide config for expected behaviour.|
|CLS-01/02|Inclusive14d freshness decision correct as pure freshness tests. But if literally stored RNG-01 with oldest age5d then wait9d, private24h check already expired→410 CHECK_EXPIRED, not200/409. Rebase creation so evidence is already old and check still within24h, or label freshness-only unit scope; do not relax retention.|
|CON-10|Replace TBD with score78 MEDIUM, exact half-even. Add explicit72.5 and49.5+cap tests so float accident cannot pass policy.|
|INS-09,VER-15,OUT-03,NRM-45|Resolve TBDs per Q6/Q7/Q9/Q23 above; these were open, not claimed existing failures.|
|PTA-02,VER-14|Add explicit summary49LOW and indicative=false on no-price/split; LOW modifier true. Current omissions not contradictory expected numbers.|
|Q11–Q16/NRM-20/21/22/23/24/26/27|Suffix case, L, /-,₨ already required PRD (not optional parser bugs). Preserve decimal meaning1.2PKR, never infer120/lakh. Multiple numeric candidates confirmation; EMI-only asks full cash or null range. Urdu digits/compound Roman Urdu scope and concrete category plausibility thresholds still need PM/Founder ratification; **not approved here**, not made-up defaults. Technical parse/preview need not equal admitted market evidence.|

All remaining reviewed vectors are **compatible at specification-review level**; no execution pass claim. Confidence CON fixtures are isolated scorer inputs (n/d may not be constructible after seller-dedup), valid for cap boundary tests. NEX age flags add no penalty beyond normal R. GEO-04 includes null-city100k so denominator100k, exact15%→no flag. NRM-40/41 tie outputs12/14;42=12345679;43/44 NON_FINITE;45 ZERO.

## Required follow-up, not performed
QA should update only their owned fixtures/probes and rerun exact-unit + HTTP/TTL integration suites after Engineer implementation. Engineer should use02/03 as authoritative, keep pure engine/effectful adapters separate, assert no early money rounding/float tie dependence, no raw/image/provider persistence/network. Add duplicate-owner/cross-platform and unknown-owner cases, per-field invalid/future timestamp, fractional threshold±1ms, WIDE_SPREAD n3/4, post-IQR hard gate, expiry/classify clocks, split-summary/no-price modifiers and local confirmation. CTO did not edit QA or Engineer files, sign up, spend, push, or send messages.

## Send-ready message to QA/Engineer (under600 words, not sent)
Please use `/workspace/kitne-ka/cto/02-pricing-methodology-v0.1.md` and API v0.4 in03 as authoritative.09-qa-answers.md answers **all18 Q1–Q10/Q17–Q24** and records the review of all120 v1.1 vectors. No Engineer implementation or QA oracle/probe was run; independent exact-arithmetic spot checks only, and QA files are untouched.

Decimals stay exact through statistics/verdict; half-even Money output only. Confidence is exact C_raw→half-even integer once→caps→band:78.5→78,72.5→72,49.5→50 then n3–4 cap49. LOW0–49/MEDIUM50–79/HIGH80–100; below3 comparables means Insufficient, not a low score.

Freshness uses older observed_at/source_updated_at, fractional milliseconds/86,400,000 and injected checked_at/classified_at.14/30days inclusive; future skew<=300s accepted with age0, beyond/malformed INVALID_TIMESTAMP. Private24h TTL remains separate and takes precedence over freshness.

WIDE_SPREAD uses(P90−P10)/median>.30 even n3–4, though displayed min/max; this is now explicitly ruled. Hard(max−min)/median>.60 applies **after one IQR trim**, never re-trim. IQR0 with nonzero range emits warnings.IQR_ZERO_SPREAD_REVIEW without auto-trim/penalty. All-stale emits NO_FRESH_EVIDENCE plus TOO_FEW_COMPARABLES.

Independence/dedup follows resolved **ultimate sellerOwnerId**, not API/platform corporate ownership; one verified merchant owner contributes one effective offer per variant/condition. Unknown candidate PTA→UNKNOWN_CRITICAL_ATTRIBUTE; mismatching known PTA→VARIANT_MISMATCH; zero/EMI→PRICE_NOT_COMPARABLE. Full single-primary-exclusion precedence is in02. ZERO is normaliser reason for positive input rounding0; supplied invalid asking Money is422 INVALID_ASKING_PRICE, not absent price.

GEO_SPREAD compares eligible city medians, denominator overall median including city-null; strictly>.15, no penalty. NEAR_EXPIRY when oldest included age>=.8window, no added penalty beyond R. PTA split summary ignores failed branches and uses min passing score; one passing score stands. NO_ASKING_PRICE+LOW has indicative=false, low modifier=true. INVALID_TIMESTAMP/GEO_SPREAD/NEAR_EXPIRY/fair_band_low/high are now in API types.

**Corrections:** CON-12 needs72 not73. NRM-25 “1.23456 lac” needs12345600paisa, not12345670; the prior reported arithmetic was inconsistent. FIL-08 needs actual seller-owner metadata, not a shared marketplace-parent assumption. NRM-34 is within safe-integer range; any absurd-price rejection needs approved category bounds, not an overflow claim. CLS-01/02 must keep check age<=24h or explicitly be freshness-only tests: literal9day waits must return410. Resolve TBDs per09, add ties/caps and ownership/TTL boundary tests, then rerun owned suites. PM/Founder still owe scope/plausibility decisions; I have not invented numeric market floors.
