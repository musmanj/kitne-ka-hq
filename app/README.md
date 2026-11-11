# Kitne Ka — local TypeScript foundations

> **PAUSED (CTO directive, 9 Nov 02:47 PKT, after Founder direction D-010):** verdict, range, confidence, fair band, /classify, comparable aggregation, and new vectors for them are paused. Nothing has been deleted. Work continues on the PKR parser ('cr' per D-009 #6), variant matching and identity, the config gate, on-device OCR input, retention and shares, and security plumbing. No source adapters, fetching, or scraping. Not moved to kitne-ka-hq /app. Nothing is released.


Strict, stack-agnostic scratch code; no repository, deployment, runtime dependencies,
network/source collection, scraping, secrets, remote models or server OCR. All fixtures
and HMAC test keys are **SYNTHETIC**. Source adapters default disabled with zero quotas.
No real market prices, coverage, security deployment or accuracy is claimed.

## Run
Node24.22.1/npm11.21.1 used; exact dev versions in package-lock.json.

```sh
cd /workspace/kitne-ka/app
npm test
npm run typecheck
```
`npm test` includes the **unchanged QA-owned harness** by default (CI handoff):
```sh
cp /workspace/kitne-ka/qa/tools/vectors.harness.test.ts /workspace/kitne-ka/app/tests/
QA_VECTORS=/workspace/kitne-ka/qa/pricing-engine-test-vectors.json npx vitest run tests/vectors.harness.test.ts
```
QA published through v1.13 during this task; logs identify exact inputs run. Its harness
defaults to MAIN spec/TBD cases. After D-008, no proposal-labelled vectors remain, so
the proposed-only mode emits1explicit todo and exits0. Fixtures are SYNTHETIC, never real market evidence.
Run those conditional policy tests with:
```sh
QA_INCLUDE_PROPOSED=1 QA_VECTORS=/workspace/kitne-ka/qa/pricing-engine-test-vectors.json npx vitest run tests/vectors.harness.test.ts
```
Historical v1.1/v1.2 packs are unchanged labelled snapshots with visible todos/bridges,
not a replacement for QA's current harness. See `artifacts/` for real run logs/counts.
Typecheck runs both strict main+tests and domain-only without Node ambient types.

## Interfaces
Import `src/index.ts`; fixtures separately from `src/fixtures/synthetic.ts`.
- `evaluateCheck` / `classify`: immutable evidence, injected `now`, exact rational
  statistics and output-only half-even rounding. Algorithm0.1, API v0.7 amendments.
- `normalisePkr`: exact decimal strings→positive safe-integer paisa; advisory
  UNMARKED_NUMBER never changes value or infers lakh.
- `serialiseSnapshot` / `deserialiseSnapshot` / `hydrateSnapshot`: codec1 allowlisted,
  bounded JSON with reduced exact rationals, canonical registry references, UTC dates.
- `validateAssessmentRequest`: existing root confirmed_fields, canonical registry
  validation and server-stamped HMAC confirmation record; no raw OCR/title/PII fields.
- `CheckStore` / `InMemoryCheckStore` / `classifyAtomically`: reference CAS+scoped
  HMAC version replay with lifecycle/epoch/policy guards, fixed24h retention.
- Pure share projections/state/management, generic identical410, UTC dates,
  no-store/no-referrer, safe-log/rate policy and cleanup-heartbeat helpers.

## TECH-DEBT / assumptions
`RULES.md` maps rules to spec sections/CTO rulings. `OPEN-QUESTIONS.md` separates
resolved CTO questions, PENDING PM/Founder policy and real-stack integration work.
D-008 approves exact local category bounds and Option B. Actual reviewed per-model
catalogue schemas/aliases/equivalence remain separate, never invented from fixtures.
Bounds logic (inclusive soft bounds/strict10×ceiling), bound-value acknowledgement,
OUT_OF_CATEGORY_BOUNDS and optional-used disclosure are implemented. Strict policy
schema still returns503 for missing/placeholder/invalid approvals. Approved musmanj
metadata is only in PRODUCTION_CATEGORY_CONFIGS; synthetic fixtures stay unchanged.
Native digits/separators/plurals (including crores) are implemented; native+ASCII
DIGITS expose MIXED_DIGIT_SCRIPTS and requires_confirmation, never silently parsed.
Arabic punctuation alone doesn't mix scripts. Compounds remain unsupported.

Core functions perform no I/O/clock reads. Only the expressly allowed in-memory store
mutates local reference state; it proves no distributed atomicity. Registry/HMAC/auth/
rights/quota inputs must come from real trusted adapters later. Real DB transactions,
crypto, rate counters, HTTP/edge/log enforcement, cleanup/monitoring/restore rehearsal
and idempotent share/create admission are **not implemented**. No source/OCR/model
adapter can be enabled by these helpers. Snapshot budgets and initial rate limits are
engineering/operational assumptions pending measurement, not market evidence.

The QA harness's default absolute external vector path needs QA_VECTORS/configured
QA assets when moved into a repository. No repo or CI provider has been created.

## D-008 / strict-policy update
Founder approved R1–R12 at9Nov01:41PKT. PRODUCTION_CATEGORY_CONFIGS now records the exact
approved policy values, musmanj allowlist and UTC/citation metadata; no deployment or
provider/account work. withApprovedProductionPolicy binds a separately reviewed canonical
category schema. Tests use SYNTHETIC schema/evidence to prove approved gates clear and
missing/invalid/placeholder policies remain503. Legacy null templates are not used as
approved records. Production policy metadata is not a reviewed canonical catalogue.
Strict Money and full approved-policy parsers are shared; see RULES.md for exact formats.
Final logs/provenance report latest QA counts and any schema-format conflicts honestly.

## CTO11 review hardening
Raw configuration is inspected and strictly validated before use/copying; hostile
accessors, prototypes, sparse arrays, unknown descriptor keys and cycles fail503 with
no exception details. Valid policies are detached/deep-frozen. Conditional identity
predicates are typed against actual referenced domains. The six CTO probes are in
`tests/cto-d008-review.test.ts`; current QA inputs/hashes/results are in FINAL-REPORT.
The latest approved QA pack has no proposal-labelled cases: synchronized QA emits
one explicit todo in proposed-only mode and exits0, with zero engine vectors tested.

Policy resource limits:64KiB compact raw own-data JSON UTF8,256Unicode-code-point
strings,1024UTF8bytes only for attributes[].unit; bounded containers/nodes/depth.
The pure loadCategoryConfigJson checks raw text bytes before parsing. See RULES.md
for exact semantics and trusted-data/Proxy limitations; tests/policy-budgets.test.ts
covers inclusive limits, escaping, Unicode and the8MiB label. No pricing policy change.
