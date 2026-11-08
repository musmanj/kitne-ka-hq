# Day1 CTO technical assessment — revised handoff
9 Nov2026 PKT. Assessment/design only; no signups, paid commitments, deployments, messages or pushes. Current authority: **pricing v0.1 in02; API revision v0.4 in03**. Old02-v0 remains explicitly historical. Detailed legal URLs, fetched clauses/dates and vendor pricing evidence are in01/ADR/06; no unrestricted scraping permission is assumed.

## Send-ready full assessment for Chief of Staff
**Recommendation:** proceed with low-risk modular-monolith foundations, but do not promise live market coverage until legally permitted, independently attributable evidence passes G1. The14-day MVP is evidence-backed price checking, not a scraper project. Existing GitHub ADR-0001 default is accepted; ADR-0002 recommends React/Vite PWA, Hono on Cloudflare Worker with Static Assets, and Supabase Postgres. Separate app repo from HQ docs, feature modules/contracts/pure pricing engine in one deployable, no microservices. No repo was created or pushed.

**Consolidated source policy (retrieval evidence in01):**
|Source|Status and reason|
|---|---|
|Owned/synthetic target screenshots + rights-cleared manual/partner observations|Conditional enabled class: permitted input processing only; independent verified provenance/rights before benchmarking. Synthetic data never production evidence.|
|User-pasted URLs|Conditional: canonicalise client-side; no request for blocked hosts, not benchmark evidence.|
|OLX Pakistan automation/pasted-fetch|Excluded: explicit anti-automation terms; pasted links NOT_PERMITTED403. Third-party listing screenshots remain legal-review gated, local OCR not exemption.|
|Daraz scrape/pasted-fetch|Excluded: terms ban robots/data mining; NOT_PERMITTED403.|
|Daraz affiliate/Open Platform|Conditional: application/access/redistribution licence and Founder decision; not permission for scraping.|
|PriceOye|Partnership target; bot/query restrictions, no general automated licence established.|
|Samsung PK, Xiaomi PK, Infinix/Tecno, Apple-authorised resellers|Partnership targets; official merchant feed/permission required, no assumed public API.|
|Mega.pk, gaming retailers|Conditional legal review; no proven reusable automated licence.|
|Telemart, iShopping|Conditional legal review: robots/public product availability is not ToS permission.|
|WhatMobile, Hamariweb|Conditional manual citation/reference only; neither scraped nor independent verified retail offers by default.|
|Mobilemall/other reference sites|Conditional legal review/manual reference, not admitted benchmark by default.|
|Google Shopping/SerpAPI/Serper|Conditional licensed search discovery only; API payment does not grant underlying listing reuse rights or independent-source diversity.|

**Methodology v0.1:** strict category-configured model/variant matching; never mix condition or PTA pools. Unknown target PTA doesn't block: separate Approved/Non-PTA branches, each independently sufficient, no merged median/verdict until selected. Exclude unknown candidate PTA. Resolve ultimate commercial seller owner, not platform parent; dedup to one owner/variant/condition offer. This intentionally tightens/clarifies source independence, affecting QA FIL-08.

Minimum3 final comparables; fewer→Insufficient with no range/median/score. New<=14days, used<=30days, fractional/inclusive; effective timestamp is older observed/update, retrieval doesn't rejuvenate evidence. Exactly300s future tolerated with age0; beyond/malformed INVALID_TIMESTAMP. Single IQR pass at pre-trim n>=8, then hard final(max−min)/median>.60 blocks. Display min/max n3–4 or P10/P90 n>=5; median anchor, Fair−15%/+10% inclusive, High above+10%, Unusually Low below−15% with caution. Exact arithmetic until half-even Money output; confidence half-even once then caps. LOW0–49,MEDIUM50–79,HIGH80–100; n3–4 or d1 cap49. GEO_SPREAD/NEAR_EXPIRY informative only. v0.1 documents every QA ruling and API fields/errors.

**Security/architecture:** launch **Tesseract browser-only plus mandatory confirmation**. No image/raw OCR/provider result stored or sent; Gemini/remote model fallback OFF. Official Gemini terms include55-day abuse monitoring and age restrictions; reactivation needs Founder/privacy/age-gate/disclosure approval. Server unresolved canonical candidates1h, sanitised checks24h, consented sanitised shares30d maximum/revocable; expiry410 at read time, no retained raw backups/telemetry. Future image ingestion must validate bytes/magic/pixels and server re-encode, not trust client EXIF stripping. Separate staging/prod Workers, DB projects/secrets; preview URL alone insufficient. Backup/log retention compliance remains release-blocking.

**Contracts/foundations:** typed ERROR→INSUFFICIENT→RANGE union, LOW modifier, confidence reasons/counts, nullable provenance-backed pools/fair bands, per-field extraction confidence, category variants, ICU/PKR formatting, progress polling, safe error/retry matrix, unguessable snapshots/capabilities, deletion/revocation410. Classify-only uses stored exact median/evidence and recalculates age; rejects expired/stale range without new collection. Engineer can start pure domain/schema, synthetic fixture adapters, local OCR confirmation, accessible PWA states, RLS/retention/migrations, CI and threat-model tests; no blocked source clients or paid setup.

|Option/commitment|Illustrative MVP monthly cost/approval|
|---|---|
|Browser OCR / remote models OFF|**$0 model usage**, no provider activation.|
|Cloudflare free Worker/static assets|Target$0 within existing free limits; separate environments share account quotas; paid~$5+ only Founder approval.|
|Supabase free projects|Target$0 if two environment allocations fit existing quota; paid plan from~$25/month, extra projects from~$10/month; add-ons can increase total; approval before any commitment.|
|Serper/SerpAPI|Disabled; published illustrative$50/50k credits or$25/1k monthly search tier; neither approved nor launch default.|
|Future Gemini/OpenAI/Cloud Vision|Disabled; estimates/free limits and official references in06; each reactivation/billing needs Founder approval.|
|Feed/licensing,domain,legal|Unknown/negotiated; no allocation or purchase; Founder approval.|
Assumption1,000 checks/month illustrative only, not benchmark/guaranteed cost; OCR bundle/browser resources and legal-source ops still need measurement.

**QA:** all120 v1.1 vectors specification-reviewed; independent exact arithmetic spot checks, not engine tests.09 answers all18 requested Q1–10/Q17–24. Conflicts: CON-12 score72 not73; NRM-25 amount12345600 not12345670; FIL-08 platform-owner fixture must become seller-owner; NRM-34 is not safe-integer overflow; classify fixtures must respect24h lifetime. QA originals untouched.

**Founder/G1 decisions:** permitted data/licensing and coverage, third-party screenshot policy, category plausibility bounds/normalisation scope, actual free environment quotas, backup/log expiry compliance, domain/vendor budget. No live evidence→honest Insufficient, never synthetic production valuation.

## Concise latest update for Chief of Staff (under400 words; not sent)
Security reconciliation is complete: all six SecOps challenges accepted, no substantive disagreement. Launch default is **local browser Tesseract plus mandatory confirmation**, remote models/Gemini/image upload OFF, hence **$0 model usage**. Official Gemini terms were independently checked;55-day abuse-monitoring retention and age limits require a separate Founder/privacy/age-gate/disclosure decision before remote fallback returns.

No raw OCR/provider output/images cross or persist at the server. TTLs: unresolved canonical fields1h, sanitised checks24h, explicit sanitised shares30d maximum, creator revocation and410 on HTML+PNG. Cache/CDN and backup/log retention compliance are release gates. Future ingress needs server byte/magic/pixel checks and re-encoding. Staging/prod require separate Workers, DB projects/secrets; no prod credentials/data in previews.

Pricing **v0.1 is published** and API v0.4 aligns all18 requested QA answers, timestamps, fair bands and confidence reasons. All120 synthetic vectors were reviewed with independent spot arithmetic, **not Engineer/QA engine execution**. Half-even confidence then caps, fractional inclusive freshness, city-median geography and post-IQR gating are explicit. Concrete fixture corrections: CON-12=72, NRM-25=12345600paisa; FIL-08 needs ultimate seller ownership, NRM-34 isn't safe-integer overflow, and classify cases must keep private check within24h. QA files untouched.

Changed: `02-pricing-methodology-v0.1.md` (v0 historical pointer),03 API,ADR-0002,05 foundations,06 costs,08 SecOps,09 QA,00 summary. PM07 lists required PRD changes: NOT_PERMITTED403 for known-blocked links, SOURCE_NOT_SUPPORTED422 for unclear/unsupported hosts; third-party listing screenshots remain legal-review gated, local OCR not permission; update local-only/TTL/revoke/confirmation and v0.1 terminology.

Still no approved live feed/coverage or paid commitments. Founder/PM decisions needed on source rights, category plausibility bounds/parser scope, actual free staging/prod quotas and backup/log expiry. Please have SecOps confirm agreement and QA update owned fixtures/re-run after implementation. Nothing provisioned, sent, signed up, paid or pushed.
