# Policy labels and sources

> **PAUSED (CTO directive, 9 Nov 02:47 PKT, after Founder direction D-010):** verdict, range, confidence, fair band, /classify, comparable aggregation, and new vectors for them are paused. Nothing has been deleted. Work continues on the PKR parser ('cr' per D-009 #6), variant matching and identity, the config gate, on-device OCR input, retention and shares, and security plumbing. No source adapters, fetching, or scraping. Not moved to kitne-ka-hq /app. Nothing is released.


Authoritative files outside this worktree: CTO `02-pricing-methodology-v0.1.md`
(methodology), `03-api-contract-v0.md` (including API v0.7), and
`09-qa-answers.md`, `10-engineer-rulings.md` R1–R10 + latest steering, and `05-day1-foundations.md` SecOps C1–C6. Algorithm version remains0.1. Original v0 and old QA basis labels are historical. Every rule
below has a documented source; implementation assumptions are separate, not labelled
CTO-confirmed. All earlier message-confirmed rules now appear in the written spec.

| Label/source | Implemented rule |
|---|---|
| spec v0.1 §1 | Config-driven critical identity; condition/grade/PTA/lock separated; no inferred depreciation, target listing never benchmark. Canonical input boundary, no image/raw OCR/provider types or remote model path. |
| spec v0.1 §2 | Lean PriceObservation; ComparableCandidate joins verified Listing metadata. Ultimate sellerOwnerId, not platform parent, supplies independence. Canonical listing dedup, then one latest eligible offer/owner/variant/condition; effective/retrieved timestamp and ordinal-ID ties. |
| spec v0.1 §3 | Integer paisa; strict decimal string parse; Rs/Rs./PKR/₨; k/L/lac/lakh/crore; case, commas and /-. Half-even sub-paisa conversion. ZERO/NEGATIVE/NON_FINITE/NOT_A_NUMBER/safe-bound errors; positive rounding0→ZERO. EMI/deposit/monthly/starting-from noncash rejected upstream. |
| spec v0.1 §3; API v0.4 | Technical1..MAX_SAFE_INTEGER paisa is not market plausibility. Approved category bounds required for admission; missing config→503 CONFIGURATION_REQUIRED. Invalid supplied asking Money (including malformed Money shape)→422 INVALID_ASKING_PRICE/errors.price.invalid; only outer-envelope malformation400. |
| spec v0.1 §4 | Older of observed/update; either invalid or >300s future invalidates. Exactly300s allowed, age clamped0. Fractional-day inclusive14/30days; retrieval never refreshes age; source/contract expiry may be earlier. |
| spec v0.1 §5 | Single primary exclusion in exported EXCLUSION_ORDER, including unknown PTA→UNKNOWN_CRITICAL_ATTRIBUTE and mismatched PTA→VARIANT_MISMATCH. Rights and price failures precede stock, matching and temporal failures. |
| spec v0.1 §6 | Final n<3 insufficient; n3–4 min/max, n>=5 P10/P90 linear quantiles. Exactly one strict-fence IQR trim at pre-trim n>=8; IQR0/nonzero range warning without auto-trim. Then hard(max-min)/median>.60. Width cap uses(P90-P10)/median>.30 including n3–4. |
| spec v0.1 §7 | Exact rational median/stats/spread/verdict; Fair inclusive[-.15,+.10]. Half-even Money/fair bands at output; fair low=.85M, high=1.10M. Public diff_percent is fractional per updated §7/API v0.5, not legacy QA points. |
| spec v0.1 §8 | Exact weighted confidence; half-even ONCE→caps→band. n<5 or d<2 cap49; width/attribute cap79; unconfirmed target PTA cap49. Split independently gated; min passing branch score, no global range/verdict. Indicative only LOW price verdict; no-price LOW modifier retained. |
| spec v0.1 §9 | NEAR_EXPIRY oldest age>=.8window; GEO_SPREAD >=2 cities each>=2, city-median gap/overall median>.15, null-city included in global median. Informational only; no geography cap or extra recency penalty. |
| spec v0.1 §10 | Stable insufficiency reason order; all-stale→NO_FRESH_EVIDENCE then TOO_FEW_COMPARABLES. Operational ERROR precedes insufficient/range. |
| spec v0.1 §11; API v0.3 retention/v0.4/v0.5 | Private now>=created+24h→410 before freshness. Classify stored exact evidence only, recompute R/flags using injected classified_at; no new collection. Version/replay/selected-branch hard validity guards. |
| spec v0.1 §11; API v0.5 “Classify input and selected-branch state” | Optional/nullable asking price; omission preserves, null clears, {}422. Retained insufficient branch→success INSUFFICIENT_DATA with NO_STORED_RANGE first; absent/unevaluated branch also200 with NO_STORED_RANGE first and zero diagnostic counts (API v0.7 R8 supersedes v0.5). This supersedes old QA PTA-07. |
| API v0.5 “Safe confirmed context”/“Evidence DTO” | Safe canonical header for insufficient/split, separate authoritative PTA. Safe evidence row projection sorted quality/retrieval/source-ID/observation-ID, capped50 AFTER full computation; totals/newest use full included sample. Insufficient rows suppressed. |
| CTO 01-data-source-matrix/05-day1-foundations; API v0.3 | Source collection interfaces only; enabled=false, kill switch=true, zero quotas/no permissions, no network implementations. No server image/OCR/provider path. |

## spec v0.1 amendments / API v0.7 handoff

| Label/source | Implemented rule |
|---|---|
| spec v0.1 amendment1; API v0.7;10 R1 | WARN_ALL_UNMARKED ratified, **UNMARKED_NUMBER** is the one internal AND wire warning name. Advisory only, no floor/lakh inference. Foreign explicit currency→UNSUPPORTED_CURRENCY. |
| spec v0.1 amendment2;10 R2 | No URL-only dedup. Canonical observation-ID identical facts→DUPLICATE; conflicting facts→all UNVERIFIED_PROVENANCE. Canonical-listing then ultimate-owner dedup retained. |
| spec v0.1 amendment3;10 R3 | Unapproved/unsafe merchant URL→null with evidence retained; empty allowlist. Stale optional pool hidden, no substitution; unknown alternate grade defaultsnull. Required output overflow→500 PRICE_OUTPUT_OVERFLOW, nonretryable, no clamp. |
| spec v0.1 amendment4;10 R4 | Codec1 reduced exact rational numerator/denominator decimal strings; allowlisted JSON, UTC dates, bounded decoder. Fixed unresolved1h/private24h/share30d; current restore epoch external to stored data. |
| spec v0.1 amendment5;10 R5 | Atomic CAS/store reference; scoped HMAC replay reference+presence-aware digest; If-Match missing428; changed committed-key digest409; live guards before replay/new commit; original outcome replay; no TTL slide. |
| spec v0.1 amendment6;10 R6;05 C6 | Root confirmed_fields, every supplied fact includingnull, missingPTA→NOT_SURE; registry/schema validation rejects unknown/duplicate aliases/free text/raw fields. Server-stamped confirmation record over canonical validated facts only. |
| spec v0.1 amendment7;10 R7 | Ratified nullable config shape, NOT market values/taxonomy. Production missing/unapproved/scope-mismatched bounds503; explicit SYNTHETIC environment required for fixture technical bounds. |
| spec v0.1 amendment8;10 R8 | Valid absent/unevaluated/stored-insufficient branch→200 INSUFFICIENT_DATA, NO_STORED_RANGE first, no other branch leakage. Invalid input alone422. Public diff_percent remains fraction. |
| API v0.7;10 R9 | Known-unavailable share410 byte-identical generic errors.share.unavailable; no cause/tombstone. UTC lifecycle dates in creation/management/public DTO. Reasonless markers purge by originalexpiry+24h; creator hash only until actualexpiry. |
| API v0.6/v0.7;05 C1–C6 | Pure no-store/no-referrer/header/log projection, POST-only PII marker, rate-limit policy types, injected-epoch share gates, cleanup heartbeat/health logic. No remote OCR/model path. These are NOT proof of real ingress/storage/log/rate/cleanup enforcement. |

## Config/parser implementation — Founder-approved D-008; strict metadata gate

Source: methodology0.1 §3/§5 and latest amendments; API v0.7 PM/QA alignment;
CTO10 R10; PM config-bounds-proposal.md v0.2/Addendum B; CTO steering9Nov01:31–01:35PKT.
No pricing/quantile/confidence/verdict formula changed.

- Technical asking Money validity422 INVALID_ASKING_PRICE first. Approved config gate
  then strict asking>10×max422 ASKING_PRICE_IMPLAUSIBLE, even confirmed; exact10×max
  remains soft-confirmable. Outside inclusive bounds422 CONFIRMATION_REQUIRED unless
  exact-value bound acknowledgment, key **errors.check.confirm_fields**, details
  fields=[asking_price], reason=OUT_OF_CATEGORY_BOUNDS (explicit steering/QA contract).
- Optional boolean asking_price_confirmed participates in root confirmation, canonical
  HMAC, classify fingerprint and CAS digest. Private acknowledgment binds Money/product/
  category/config; changed price invalidates it, omission/PTA-only reuses only matching
  unexpired state. Codec persists that small typed binding, not a raw body.
- OUT_OF_CATEGORY_BOUNDS is separate from technical/noncash PRICE_NOT_COMPARABLE;
  primary order immediately after it, before stock/identity/time. No confirm bypass.
- Approved production allowlist is [musmanj] under D-008. Trim approved_by then
  exact-case membership; placeholders rejected even if listed. Missing/invalid approval
  metadata→503. SYNTHETIC test approvals remain distinct, never deployment authority.
- Approved phones min **150000 paisa (PKR1500)**, NOT100000. Exact category policy
  records below; legacy unapproved templates remain null, not active production policy.
- Other/open-box/kit/refurbished/repaired selection422 CONDITION_NOT_SUPPORTED,
  errors.condition.not_supported, before evidence; never relabelled Used/Insufficient.
  Battery/repair are optional nullable unmatched metadata, no invented defaults or score
  adjustment; USED_BATTERY_REPAIR_NOT_MATCHED disclosure; grade still required.
- Bounded native-digit/separator mapping, Urdu+Arabic mix allowed. Native+ASCII DIGITS
  preserve exact preview value but require confirmation and public MIXED_DIGIT_SCRIPTS
  /price.normalisation.mixed_digit_scripts. Arabic decimal punctuation alone with ASCII
  digits does not mix digit scripts. Plural lacs/lakhs/crores are singular aliases.
  Compound/word/bare-unit/invalid grouping still NOT_A_NUMBER, no partial amount.
- Public share404/410 body identical generic errors.share.unavailable;503 retains
  SNAPSHOT_UNAVAILABLE/retryabletrue. Retired reason-specific public codes never emitted.

## Engineering assumptions / PENDING PM/Founder (not market approval)

- `PRODUCTION_CONFIG_PLACEHOLDERS`: economic min/max, critical variants, battery/repair,
  laptop equivalence and per-model taxonomy are null legacy templates, NOT the D-008
  approved policy records. Reviewed per-model schemas still needed. Option B itself
  is D-008 approved. Used-grade defaultnull, never silentlyGOOD; no Other→Used remap.
- Parser160-codepoint budget, mapped-ASCII/leading-digit decimals/no plus or exponent,
  finite JS-number fixture convenience: engineering assumptions expressly retained by10 R1.
  Authoritative monetary input is an exact decimal string. Native/plural parser logic
  is implemented per latest CTO steering and scope is now D-008 approved. Compounds
  remain unsupported; real deployment/integration still pending, not performed here.
- Snapshot layout groups per-condition/PTA evidence/statistics under `pools`; fixed typed
  `classification.insufficient`, `geographic_unverified` and per-pool warning fields preserve
  exact diagnostic/flag replay without retaining a raw request/response. Engineering
  budgets:1MiB JSON,4 pools,1000 included rows/pool,128 rational digits; pending deployment
  measurement/CTO/SecOps review. Excluded raw candidates and arbitrary future metadata omitted.
- Synchronous in-memory transaction implements JS run-to-completion semantics ONLY;
  real async DB/RPC, crypto/HMAC/key management, auth/rights/config lookup and atomic quota
  admission are pending. Injected trusted booleans/HMAC/registry are not security proof.
- Initial rate-policy numbers remain the API's operational assumptions. Enforcement is
  disabled/unimplemented; HTTP/edge policy, real distributed counters and measured tuning pending.

Not open: half-even confidence, ratio units, owner independence, inclusive300s,
ZERO for rounded0, P10/P90 width cap, IQR warning, city medians, TTLs, absent-branch200,
unmarked warning, output-overflow mapping or the generic410 contract.

## Latest strict schema and D-008

Sources: CTO steering9Nov01:39PKT;03 l672/l701;D-008;Founder approval9Nov01:41PKT;
Chief of Staff steering01:42PKT. R1–R12 and local category policy metadata are now approved,
NOT deployed. Actual production policy records in src/domain/production-configs.ts:
phones150000..150000000, laptops500000..300000000, consoles500000..90000000paisa;
version/config_version1.0.0; approver musmanj, allowlist[musmanj], approved_at as recorded
in D-008 (UTC), exact source_ref pm/config-bounds-proposal.md v0.2 §1.1-1.2; D-008.
SYNTHETIC configs unchanged. Per-model canonical schemas/rights still supplied separately
with withApprovedProductionPolicy; no invented production catalogue values.

Shared isStrictMoney: exactly own amount_minor,currency; positive safe integer and literal
PKR. No extras/coercion/accessors/arrays/inherited fields. Used by check, classify,
confirmation and codec. Malformed asking input422 INVALID_ASKING_PRICE, null remains absent.

One parseApprovedPolicy strict schema rejects unknown keys at root, bounds, approval_scope,
attribute declarations and required_when. All required metadata, conditions and allowlist
entries validated; null/placeholder/malformed failures map503 CONFIGURATION_REQUIRED.

Formats (approver ID and source_ref ratified by CTO, 9 Nov 01:46 PKT; to be recorded in 03/10):
- Approver IDs/allowlist entries: ^[A-Za-z][A-Za-z0-9_-]{2,63}$, case-sensitive membership.
  approved_by trimmed BEFORE matching. Allowlist entries must already be canonical.
- version: strict SemVer2.0 (major.minor.patch, no numeric leading zeros; valid prerelease/
  build allowed). Optional config_version must be valid AND equal version.
- approved_at: ISO8601 UTC Z, valid calendar instant, optional1–3 fractional-second digits.
- source_ref: outer trim; one or more references separated EXACTLY by '; '. An atom is
  GP-[0-9]{8}-[0-9]{3}, D-[0-9]{3}, or repo-relative .md path optionally followed by
  ' vMAJOR.MINOR' then ' §N[.N...][-N[.N...]]'. No '..', '//', leading slash or placeholders.
  Exact regexp is recorded below from SOURCE_REFERENCE_PATTERN.source.
- Safety net isPlaceholder: trimmed blank, angle brackets, or case-insensitive whole
  placeholder tokens TBD/TODO/PENDING (including tokenised ID segments) always rejected.

SCH-10 resolved by CTO ruling (9 Nov 01:46 PKT, 03 l.701): trim, then exact match; a padded
ID whose trimmed form is allowlisted passes. Engine unchanged; QA is updating the vector.

Exact SOURCE_REFERENCE_PATTERN (outer trim; additionally reject placeholders, `..`, `//`):
```regex
^(?:(?:[A-Za-z0-9_-]+/)*[A-Za-z0-9._-]+\.md(?: v(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*))?(?: §[0-9]+(?:\.[0-9]+)*(?:-[0-9]+(?:\.[0-9]+)*)?)?|D-[0-9]{3}|GP-[0-9]{8}-[0-9]{3})(?:; (?:(?:[A-Za-z0-9_-]+/)*[A-Za-z0-9._-]+\.md(?: v(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*))?(?: §[0-9]+(?:\.[0-9]+)*(?:-[0-9]+(?:\.[0-9]+)*)?)?|D-[0-9]{3}|GP-[0-9]{8}-[0-9]{3}))*$
```

## CTO11 D-008 review closure (9Nov2026 PKT)

- F1: loadCategoryConfig validates RAW data graph + complete policy before config-dependent
  reads in evaluateCheck, classify, confirmation and snapshot codec/registry hydration.
  All config exceptions/invalid/parse-shaped inputs return generic503 CONFIGURATION_REQUIRED,
  never exception text/stack/confirmed context. Failed evaluation retains only an inert,
  unapproved error snapshot, NOT the malformed config. Technical asking Money still422
  before config checks; resource/auth/private-TTL precedence remains unchanged.
- F2: required_when predicates are validated against actual configured Condition/UsedGrade
  domains or referenced attribute enum/type/nullability/integer bounds. Unknown references,
  types and values503. Used-grade predicate now reads Variant.used_grade, not attributes.
  Root condition/grade and attribute type/unknown_policy enums are validated; PTA has
  only APPROVED/NON_PTA/NOT_SURE choices; BRANCH is supported only for pta_status.
- F3: descriptor-only inspection via Reflect.ownKeys rejects own symbols, unknown keys
  including non-enumerables, getters/setters, non-data object prototypes, sparse/extra-key
  arrays and cycles BEFORE schema copying. Object.prototype/null records and ordinary dense arrays only. Known non-enumerable DATA fields retained. Then detached
  descriptor-copy + deep freeze and defensive revalidation. Engineering budget100000nodes,
  depth32 for both validation and copy (implementation limits, not pricing policy).
  Proxy trap exceptions are caught and mapped503 without details; ordinary getters are
  never executed. No I/O, ambient clock, random values or remote-model code added.
- F4: removed obsolete exported NUMERIC_ABSURD_PRICE_POLICY; local source/test caller
  scan found no consumers. Public barrel wildcard no longer exposes it. Active D-008
  ASKING_HARD_CEILING_MULTIPLIER stays10n; no pricing formula changed.
- SYNTHETIC fixture builders now clone their trusted static template per call, so QA's
  malformed predicate descriptors cannot poison later control cases. This is fixture
  isolation, not cloning unvalidated incoming policy.
- Codec's config reference now accepts validated1.0.0 (rather than canonicalId-only)
  and requires exact registry-version equality. Reviewed-style SYNTHETIC enum/integer
  profile tests prove approved policy roundtrip; no real catalogue was invented.

The six exact CTO probe names and all16 QA F1/F2/F3 statuses are in FINAL-REPORT.
SCH-10's former discrepancy is resolved by current QA vectors adopting trimmed approver
semantics. Current QA has no proposal-pending-founder vectors after D-008; running
After the latest QA synchronization, QA_INCLUDE_PROPOSED=1 emits one explicit todo
sentinel and exits0: zero engine vectors selected, not invented passing coverage.

## CTO11 re-review conditions R1–R3 (9Nov2026 02:03PKT)

R1 resource-budget constants live in domain/policy-budgets.ts:
POLICY_MAX_SERIALIZED_BYTES=65536 (inclusive64KiB UTF8);
POLICY_MAX_STRING_CHARS=256 Unicode code points (not grapheme clusters);
POLICY_MAX_FREE_TEXT_BYTES=1024 decoded UTF8bytes;
POLICY_MAX_CONTAINER_KEYS=256, POLICY_MAX_ARRAY_ITEMS=256,
POLICY_MAX_NODES=100000, POLICY_MAX_DEPTH=32.

The ONLY extended free-text field is attributes[].unit (descriptive metadata).
IDs, localization label_key fields, source_ref/citations, versions, approval metadata,
enum values and required_when strings retain the default256character limit. No new
free-text product, raw OCR or provider-payload field is introduced. Unit strings may
be1024UTF8bytes, NOT1024multibyte characters. All limits checked BEFORE normalization
or copying; any failure maps to generic503 CONFIGURATION_REQUIRED at domain ingress.

The existing raw descriptor/cycle walk counts compact JSON punctuation, quoted keys,
escaping, numeric primitives and actual UTF8bytes incrementally, without stringify,
toJSON or getter execution. ALL own data fields count, including known non-enumerable
fields, before trim. The first key list is inherently allocated by Reflect.ownKeys;
width rejects before a second descriptor collection, using at most bounded individual
descriptor reads. Arrays reject excessive length before key enumeration. String length
is checked before walking it; huge labels reject without scanning/copying their payload.
Clone traversal reuses named shape/node/depth limits and final defensive validation.

Optional loadCategoryConfigJson first counts actual raw UTF8bytes INCLUDING whitespace
before JSON.parse/materialization; malformed/oversized input returnsnull for caller503.
Object ingress cannot recover source-file whitespace: it measures the unnormalized
own-data compact JSON representation, including escaping, before cloning. Each registry
category has its own64KiB budget (not an accidental shared registry cap).

Trusted canonical-data boundary remains explicit: materialized objects already exist;
Reflect.ownKeys necessarily returns its first list. Executable Proxy traps can run
arbitrary code or never return, so this is NOT a JS isolation/deadline sandbox or proof
of HTTP streaming/ingress enforcement. Real stack must cap bytes before constructing
objects; the pure text loader provides the bounded parsing path.

R2 latest QA harness synced byte-for-byte, including all12 CFG-XF fixture constructors.
No helper imports exist in this version: fixture builders are inline. Sync manifest
and separate harness/vector SHA256 values are in artifacts/provenance.json.
R3 unchanged QA sentinel: 'No proposed vectors remain after approval promotion',
only when that selection is empty; expected exit0,1todo,0engine vectors. Missing or
malformed main input is NOT globally ignored. Exact final output in FINAL-REPORT.
