source_ref exact regex (unchanged from CTO-approved grammar; outer trim plus placeholder/'..'/'//' checks):
^(?:(?:[A-Za-z0-9_-]+/)*[A-Za-z0-9._-]+\.md(?: v(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*))?(?: §[0-9]+(?:\.[0-9]+)*(?:-[0-9]+(?:\.[0-9]+)*)?)?|D-[0-9]{3}|GP-[0-9]{8}-[0-9]{3})(?:; (?:(?:[A-Za-z0-9_-]+/)*[A-Za-z0-9._-]+\.md(?: v(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*))?(?: §[0-9]+(?:\.[0-9]+)*(?:-[0-9]+(?:\.[0-9]+)*)?)?|D-[0-9]{3}|GP-[0-9]{8}-[0-9]{3}))*$

CTO11 re-review R1–R3 completion —9Nov2026 02:07PKT
Read the re-review in full. Local-only scratch work in /workspace/kitne-ka/app;
no release/repo/deployment/runtime network/secrets/services. Numeric policy, exact
pricing maths, approved D-008 provenance and production config values unchanged.

REAL FINAL COMMANDS / VERBATIM SUMMARY OUTPUT

npm test
 Test Files  17 passed (17)
      Tests  1165 passed | 24 todo (1189)
Exit0.1165passed,0failed,24todo,0skipped assertions.17files passed.
This is CTO's synchronized1149baseline +16new passing resource-budget tests.

QA_VECTORS=/workspace/kitne-ka/qa/pricing-engine-test-vectors.json npx vitest run tests/vectors.harness.test.ts
 Test Files  1 passed (1)
      Tests  380 passed | 1 todo (381)
Exit0.380passed,0failed,1todo,0skipped assertions (381).

QA_INCLUDE_PROPOSED=1 QA_VECTORS=/workspace/kitne-ka/qa/pricing-engine-test-vectors.json npx vitest run tests/vectors.harness.test.ts
 Test Files  1 skipped (1)
      Tests  1 todo (1)
Exit0.0passed,0failed,1todo;0engine vectors selected. Vitest labels the FILE skipped,
not a skipped engine assertion. Explicit sentinel:
'No proposed vectors remain after approval promotion'. No global empty-suite override,
no claim of passing proposal coverage. Normal MAIN malformed/missing input still fails.

npm run typecheck
> kitne-ka-foundations@0.0.0 typecheck
> tsc --noEmit && tsc --noEmit -p tsconfig.domain.json
Exit0. Both main+tests and domain-only tsc --noEmit passed. No invented typecheck count.
Full stdout, JSON reports and exit-code files are adjacent to this report.

R1 — BUDGET IMPLEMENTATION / SOURCE LOCATIONS
src/domain/policy-budgets.ts:5–14 named inclusive limits:
POLICY_MAX_SERIALIZED_BYTES=65536; POLICY_MAX_STRING_CHARS=256 Unicodecodepoints;
POLICY_MAX_FREE_TEXT_BYTES=1024 UTF8bytes; POLICY_MAX_CONTAINER_KEYS=256;
POLICY_MAX_ARRAY_ITEMS=256; POLICY_MAX_NODES=100000; POLICY_MAX_DEPTH=32.
POLICY_FREE_TEXT_FIELDS=['attributes[].unit'] is the ONLY extended free-text field.
This is descriptive unit metadata, not an OCR/product/provider/free-text input.
label_key/localization keys, references/source_ref, IDs, versions, approval metadata,
enum/predicate strings retain256codepoints. No field extended implicitly.

policyDataShape at:23 rejects excessive width before a second descriptor collection;
uses bounded individual own-data descriptors, rejects sparse/extra-property arrays and
excessive array length before key enumeration. Prior getter/prototype/symbol/cycle
protections remain. canonicalConfigData at:67 measures raw compact own-data JSON UTF8
incrementally BEFORE schema normalization/copy, including quoted keys, JSON escaping,
commas/colons, numeric values and known non-enumerable data. Oversized strings reject
before scanning/copying them. Default strings bounded by codepoints; unit bounded by
UTF8 bytes. No whole-object stringify/toJSON/getter execution for this measurement.

policy-validation.ts:83 clone uses named shape/node/depth limits; loader:103 validates
budget/raw schema before deep copy/freeze and defensive revalidation. Every engine
boundary still projects invalid configs as generic503 CONFIGURATION_REQUIRED without
malformed raw config, stack/canary/context. Registry loader:117 gives each category
its OWN64KiB budget, not an accidental combined-registry limit.

Optional loadCategoryConfigJson at policy-validation.ts:129 checks actual raw UTF8
INCLUDING whitespace BEFORE JSON.parse/materialization, returningnull for caller503.
Object input has no recoverable source whitespace, so its raw, unnormalized compact
own-data JSON size is measured. Both are explicitly documented in RULES.md.

Trusted-data caveat retained: materialized objects already exist; Reflect.ownKeys must
allocate its first key list. A synchronous JS function cannot deadline arbitrary
executable Proxy traps. This is not an unrestricted hostile-code DoS sandbox or real
HTTP streaming/ingress enforcement; untrusted executable objects need isolation.

R1 — REAL16-TEST BOUNDARY RESULTS
exactly64KiB serialized raw config passes;65537bytes returns503: PASSED
256character default string passes;257 returns503: PASSED
256Unicode code points pass;257 fail without confusing bytes/code units: PASSED
explicit attributes[].unit free text1024UTF8bytes passes;1025 returns503: PASSED
free-text cap is UTF8bytes, not characters: PASSED
CTO8MiB localization label rejected before copying or retention: PASSED
source_ref is structured metadata, not an extended free-text field: PASSED
UTF8 aggregate bytes and JSON escaping are measured exactly: PASSED
lone surrogate escaping counts six JSON bytes; paired surrogate counts fourUTF8bytes: PASSED
raw whitespace is counted before JSON.parse/materialization: PASSED
malformed raw JSON is safely rejected and oversized nonASCII text never parsed: PASSED
each registry category gets its own64KiB budget: PASSED
wide root rejected before a second descriptor collection or descriptor reads: PASSED
oversized array rejected before own-key enumeration: PASSED
depth limit remains bounded without a stack overflow: PASSED
oversized raw metadata is rejected before trimming/normalization: PASSED
Separate actual run: tests/policy-budgets.test.ts16passed/0failed/todo/skipped.
Includes exact65536accept/65537reject,256/257characters,1024/1025free-text UTF8bytes,
CTO8MiB label rejection, nonASCII/JSON escaping/lone surrogate correctness, preparse
raw-whitespace limit, early-width/array/depth rejection and pretrim size validation.
Original CTO regression file independently rerun:48passed/0failed/todo/skipped.

R2 — SYNCHRONIZED QA /12 FIXTURE RESULTS
Latest QA v1.13,381vectors. Harness copied fresh byte-for-byte. Relative imports were
checked recursively: this version's12 fixture constructors are INLINE; no extra QA
helper modules are imported. App ../src imports are application modules, not QA files.
All12 formerly unknown-constructor vectors now run and pass:
CFG-XF1-01: PASSED
CFG-XF1-02: PASSED
CFG-XF1-03: PASSED
CFG-XF1-04: PASSED
CFG-XF2-01: PASSED
CFG-XF2-02: PASSED
CFG-XF2-03: PASSED
CFG-XF2-04: PASSED
CFG-XF3-01: PASSED
CFG-XF3-02: PASSED
CFG-XF3-03: PASSED
CFG-XF3-04: PASSED
All current CFG vectors pass; original six CTO probes remain passing. No current
spec/vector conflict. Current MAIN todo BND-P17;23more todos in historical fixtures.

R3 — EMPTY PROPOSED MODE
Updated unchanged QA harness tests/vectors.harness.test.ts:294 adds the precise todo
sentinel only for expected empty proposed selection. Actual exit0/1todo confirmed.
The old false-red empty-suite report is historical, superseded by this run.

SEPARATE INPUT HASHES / PROVENANCE
Harness SHA256: cc1eb7617485cba31c1229e6a54ed638b51cf680484f450e8c83b0ab244f28b2
Vectors JSON SHA256: e50b30e8c56d5c1127b656af8289f4630f0fa8d8f9513cb5badf4b4077d96ce1
Vectors mtime: 2026-11-09T02:00:42.169722+05:00 PKT.
Fresh artifact JSON snapshot matches source; tests/harness copy matches QA source;
BEFORE/AFTER hashes identical through final verification. Source QA files not edited.
Run metadata + copied-file manifest: artifacts/provenance.json.

CHANGES
New src/domain/policy-budgets.ts and tests/policy-budgets.test.ts;
policy-validation.ts reuses resource/shape guards and adds bounded JSON-text loader;
src/index.ts exports named budgets; fresh unchanged QA harness/vector snapshot;
RULES.md,OPEN-QUESTIONS.md,README.md and artifacts refreshed.

No disagreement with the re-review. No release/readiness claim. Remaining catalogue,
source permissions, real stack/security/storage/monitoring/cleanup/restore integration
and post-G2 per-condition bounds are still separate work, not provisioned here.

QA GROUP COUNTS (zero failed/skipped):
{
  "bounds": {
    "passed": 41,
    "todo": 1
  },
  "classify": {
    "passed": 22
  },
  "confidence": {
    "passed": 25
  },
  "config": {
    "passed": 121
  },
  "confirm": {
    "passed": 3
  },
  "filter": {
    "passed": 33
  },
  "insufficient": {
    "passed": 9
  },
  "normaliser": {
    "passed": 79
  },
  "outlier": {
    "passed": 8
  },
  "overflow": {
    "passed": 2
  },
  "precedence": {
    "passed": 1
  },
  "pta": {
    "passed": 10
  },
  "range": {
    "passed": 5
  },
  "verdict": {
    "passed": 21
  }
}

FULL FILE TREE (excluding node_modules):
.gitignore
OPEN-QUESTIONS.md
README.md
RULES.md
artifacts/FINAL-REPORT.md
artifacts/cto-probes.json
artifacts/cto-probes.txt
artifacts/current-spec-tests.txt
artifacts/current-spec.json
artifacts/file-tree.txt
artifacts/finding-locations.json
artifacts/group-counts.json
artifacts/group-counts.txt
artifacts/json-report-run.txt
artifacts/policy-budgets.json
artifacts/policy-budgets.txt
artifacts/provenance.json
artifacts/qa-harness-exact.txt
artifacts/qa-harness.exit.txt
artifacts/qa-main-json-run.txt
artifacts/qa-main.json
artifacts/qa-proposed-exact.txt
artifacts/qa-proposed-json-run.txt
artifacts/qa-proposed.exit.txt
artifacts/qa-proposed.json
artifacts/qa-vectors-used.json
artifacts/remaining-failures.json
artifacts/run-inputs-before.json
artifacts/source-reference-regex.txt
artifacts/summary.txt
artifacts/tests.exit.txt
artifacts/tests.txt
artifacts/typecheck.exit.txt
artifacts/typecheck.txt
artifacts/vitest.json
package-lock.json
package.json
src/adapters/sources.ts
src/application/check-store.ts
src/application/confirmation.ts
src/application/security-policy.ts
src/application/shares.ts
src/application/snapshot-codec.ts
src/domain/asking-policy.ts
src/domain/canonical.ts
src/domain/categories.ts
src/domain/checks.ts
src/domain/evidence.ts
src/domain/matching.ts
src/domain/money-validation.ts
src/domain/normalise-pkr.ts
src/domain/numeric.ts
src/domain/policy-budgets.ts
src/domain/policy-validation.ts
src/domain/policy.ts
src/domain/pricing.ts
src/domain/production-configs.ts
src/domain/retention.ts
src/domain/types.ts
src/fixtures/synthetic.ts
src/index.ts
tests/api-v05.test.ts
tests/application-v07.test.ts
tests/checks.test.ts
tests/config-bounds.test.ts
tests/cto-d008-review.test.ts
tests/fixtures/pricing-engine-test-vectors-v1.2.json
tests/fixtures/pricing-engine-test-vectors.json
tests/matching-adapters.test.ts
tests/methodology-v01.test.ts
tests/money-boundary.test.ts
tests/normalise.test.ts
tests/policy-budgets.test.ts
tests/policy-validation.test.ts
tests/pricing.test.ts
tests/production-configs.test.ts
tests/qa-vector-bridge.ts
tests/qa-vectors-v12.test.ts
tests/qa-vectors.test.ts
tests/safety-regressions.test.ts
tests/vectors.harness.test.ts
tsconfig.domain.json
tsconfig.json
vitest.config.ts
