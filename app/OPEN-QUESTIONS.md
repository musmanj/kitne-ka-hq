# Current follow-up after D-008 and CTO11 review

## Resolved
- D-008 approves proposal v0.2 R1–R12, exact bounds/approval provenance and Option B.
- CTO11 F1–F4: validation-first shared raw-config loader; exceptions/invalid schemas503;
  safe inert error projection without rejected config/stack/context; typed conditional
  predicates; descriptor/prototype/array/cycle checks; immutable copies; obsolete flag gone.
- Six exact CTO probes and all16 independently failing QA vectors now have passing
  regression evidence in artifacts/FINAL-REPORT.md and group-counts.json.
- Current QA v1.12 accepts trimmed approved_by: former SCH-10 discrepancy is closed.
  Exact source_ref format is documented, tested and accepted by CTO review11.
- Shared strict Money validation and all MNY/PLH regressions pass. Price keys settled.
- Production policy1.0.0 can persist/reload through exact-rational codec using explicitly
  SYNTHETIC reviewed-style enums/integer ranges in tests, not invented real catalogue data.

## Remaining implementation / operational work
- Real reviewed per-model catalogue profiles, aliases/equivalence and source rights/seed
  ownership; production adapters must reject SYNTHETIC configurations. Approved sanity
  policy is not market evidence. Catalogue schemas stay separate from policy records.
- Condition-specific bounds remain post-G2 (QA BND-P17 todo). Historical fixture suites
  retain23 additional visible todos, not new current-main failures.
- App repo/stack, real DB transactions/crypto/auth/config/rights integration, distributed
  counters, HTTP/edge/log enforcement, physical cleanup and monitoring/restore rehearsal.
- D-008 backups/monitoring choices provision no accounts/services in this local task.
- Optional API-error-factory dependency-cycle cleanup noted by CTO is not a severity
  finding or runtime fault; deferred rather than changing unrelated architecture.

## QA invocation note, not an engine defect
D-008 moved every former proposal into MAIN. Latest unchanged QA harness now emits
one explicit todo sentinel and exits0 in proposed-only mode: zero engine vectors
tested. Do not report this as passing proposal coverage. Final report records exact output,
stable vector/harness hashes, named probes, per-group counts and all16 pass statuses.
No disagreement with CTO11. Local only; no deployment/release/infrastructure claim.

## CTO11 re-review R1–R3 closure
Named64KiB serialized UTF8,256-code-point default string,1024UTF8byte unit-metadata,
container/node/depth budgets now apply before copying; optional raw JSON text loader
checks actual bytes before parse. Exact boundary/escaping/Unicode/8MiB-label tests
are permanent. The only extended free-text field is attributes[].unit; all refs and
localization keys stay256characters. QA harness synchronized with12 CFG-XF constructors
and empty-proposal todo sentinel. No disagreements with re-review. Arbitrary executable
proxies still require isolation if ever untrusted; first Reflect.ownKeys allocation
cannot be prebounded by a synchronous object validator. Real streaming HTTP limits and
production infrastructure/catalogue/source-rights work remain separate, unreleased.
