# Low-risk foundations the Engineer can start today
CTO, 9 Nov 2026 PKT. **Task recommendations only; nothing implemented or tested here.** Full build starts Day3 (11 Nov); preparatory work now must not lock vendors, spend, source rights or speculative features. No creation/push authority conveyed by this document.

## Ready now (reversible/local preparation)
1. Write domain schemas for Product, category-config Variant, Listing, immutable PriceObservation, source provenance/policy and Assessment. Prices PKR integer paisa, date/time explicit; no hidden defaults for PTA/condition. Start from draft API v0, solicit review before freezing.
2. Category config fixtures for phones/laptops/consoles, explicit critical variant attributes and versioning. Test unknown critical field prompts, not guesses. Synthetic examples only, clearly labelled.
3. Pure pricing/matching/verdict functions + unit-test specification: median, linear P10/P90, IQR n>=8, freshness14/30-day boundaries, independent-source dedup, 3/5 evidence rules, threshold equality -15/+10, confidence caps, null/NO_ASKING_PRICE/INSUFFICIENT precedence. No network or framework imports in domain.
4. SourceAdapter interface and **disabled-by-default** policy registry with permission ID, allowed methods/fields, rate cap, licence cache limits, expiry and kill-switch. Implement mock/synthetic feed adapter only; do not fetch any production listings. Third-party `products.json` endpoint availability is not permission.
5. ExtractionAdapter interface returns per-field confidence/null/no_price/multiple_products; mock provider with deterministic fixture outputs. Investigate browser-only Tesseract using synthetic image, lazy chunk and manual confirmation; no real private screenshots sent to remote free tiers.
6. Framework-neutral API validation/error schemas and step-progress state-machine tests (polling version/idempotency/cancel). Draft response fixtures for all result/error/fallback states; align Design §4.
7. Local repo scaffold plan, TypeScript strict, lint/format, lockfile, test scripts, `.gitignore`, env placeholders. Runtime shell can be prepared after stack recommendation endorsed; avoid installing speculative infra/framework dependencies. Never put real credentials anywhere in project files.
8. CI YAML skeleton for lint, typecheck, unit tests, build and dependency/secret scans. Existing standard: failing tests block merge. Public network actions/protected branch changes need repo workflow; no push in this assessment. No deployment secrets in PRs/forks.
9. Security checklist: env vars/runtime secret bindings only, `.env.example` placeholders, secret redaction, SSRF allowlist/redirect validation test vectors, magic-byte/pixel limits, EXIF rejection/stripping test cases, private-token scoping, no PII logs/share/cache. No random user URL fetching.
10. ICU resource keys and Intl PKR formatter, RTL-safe CSS tokens, app-shell-only PWA cache; component fixtures for nullable new/used/retail, confidence reasons and included/excluded counts. No claim of Urdu translation completion.

## Acceptance evidence for foundations
List actual files, command outputs, CI/build links and preview URL **only once they exist**. Unit tests must show negative/edge cases; a green mock path does not prove data access or OCR accuracy. Record package/version/Node or Worker runtime used. Distinguish synthetic fixtures from observed market examples everywhere.

## G1 / Day2 dependencies (10 Nov PKT)
- Founder: coverage limits, strict used taxonomy, screenshot rights/retention/provider notice, free-only vs extraction spend; approve vendor commitments before signup.
- PM+CTO+Design: required phone PTA/lock, warranty/used grade, null-result UX, median wording; approve methodology assumptions/calibration approach.
- Owner: app repo separate vs HQ fallback; permissions and review route.
- CTO/PM: permissioned retailer export/API pathway with commercial reuse provenance; no invented “approved source”. Manual curated inputs need rights too.

## Day3 start (11 Nov PKT)
Scaffold app/CI/preview once approved. Demonstrate real category-confirmation journey with mock evidence unmistakably labelled; run browser OCR and Worker compatibility/CPU smoke; start permitted-source integration ONLY after policy clearance. Threat model/upload tests in parallel; no authentication scope unless needed for protected admin/capabilities.

## G2 evidence (12 Nov PKT)
Accepted ADR/stack + cost approvals, schema/migrations v1, API v1, Design core states signed off, CI green/preview URL, threat model, real permitted source pathway, measured extraction sample outcomes and runtime CPU compatibility. If real source absent: escalate launch coverage/scope immediately; do not turn scraping on or postpone Day14 silently. G3 freeze18 Nov; G4 Founder21 Nov; live URL22 Nov2026 PKT.

## Do not start
Prohibited scraping, rotating proxies/cookies, marketplace internal APIs, paid subscriptions or trials, remote PII processing, microservices, vector DB, queues/workflow engines, payments, social login, user accounts absent need, alerting/history, Android share-target extras, automatic cross-condition price inference. Vendor/signup and repo writes remain explicitly gated.


## Revision: additional low-risk contract/test foundations
9 Nov2026 PKT. Add CheckResult discriminated union/Error→Insufficient→Range precedence; LOW0–49/MEDIUM50–79/HIGH80–100 boundaries; unknown PTA split strategy (never pooled, n2+n2 insufficient); classify-only freshness/version/policy tests proving no provider calls; complete extraction/catalogue ICU error matrix and UI inventory traceability; offline idempotent replay; snapshot-first/PNG-failure copy-link fallback; neutral native-share cancellation and public404/410. None executed. Use updated methodology/API, not older “unknown PTA blocks all checks” assumption.

## SecOps + pricing v0.1 priority amendment (9 Nov2026 PKT)
Before any old optional remote extraction work: **local-only Tesseract, all fields user-confirmed, image/raw OCR/provider network+storage disabled**. Minimal canonical JSON only. No raw OCR text/PII in fixtures/logs/DB/telemetry. Infra setup still requires Founder approval, no provisioned environment implied.

Implement pure pricing v0.1 +03 API v0.4 from09 decisions: exact rational stats/verdict, half-even output, half-even confidence once before caps, owner-level dedup, fractional older-of age/future300s inclusive, one-pass IQR before hard gate, percentile width cap even small n, city-median/no-city denominator, informational NEAR_EXPIRY/GEO_SPREAD, fair bands, ordered primary exclusions and insufficient reasons. Use immutable config/policy versions and injected clock. Do not copy old v0 geography/platform-owner semantics.

Test unresolved1h/check24h/share30d server expiry/read-denial/cleanup/capability revoke410 HTML+PNG. Classify TTL is independent of14/30day evidence age and never renewed. Separate staging/prod Workers, DB projects/secrets; no prod data/credentials in preview/untrusted PR. No shared production DB by schema alone. Reconcile actual backup/log retention before release. Add future-upload server-controls contract tests without enabling ingress. Use09 to correct owned tests (CON-12/NRM-25/FIL-08/NRM-34/CLS lifetime); QA originals remain QA-owned. No approved bounds/source rights →fail closed, not made-up valuation. No tests claimed executed here.
