# Risk Register

Owner: CoS · Reviewed daily · L/I = Likelihood/Impact (H/M/L)

| # | Risk | L | I | Mitigation | Owner | Status |
|---|---|---|---|---|---|---|
| R1 | **The product purpose is unconfirmed**, which delays G1 and the whole critical path | H | H | Founder intake on Day 1. The CoS escalates if there's no input by end of Day 1. Infra and CI setup, which don't depend on the product, continue in parallel. | CoS | Resolved 2026-11-09 |
| R2 | **Scope creep** in a 14-day window | H | H | MoSCoW at G1. Feature freeze at G3. New asks go to `Later` unless the Founder trades something out. | PM | Open |
| R3 | **Single human approver bottleneck.** Gates and approvals wait on the Founder. | M | H | Batch decisions into the daily report with options and a recommendation. Set decision deadlines. Pre-approve low-risk defaults. | CoS | Open |
| R4 | **AI-generated code quality** (hallucinated APIs, hidden bugs, inconsistency) | H | H | Small PRs, mandatory CTO review, tests that actually run in CI, lint and type checks, no merge without green CI | CTO | Open |
| R5 | **Security shortcuts** under time pressure | M | H | The security baseline can't be cut. SAST and dependency scan in CI. Threat model at G2. Security review on Day 11. Residual risk accepted only by the Founder. | SEC | Open |
| R6 | **Third-party / data availability.** APIs, data sources or vendors may be unavailable, paid or restricted. | M | H | Identify by G1. Use adapters plus a seeded or fallback dataset. Spike early (Day 2–3). Founder approval for paid access. | CTO | Open |
| R7 | Integration late in the sprint exposes broken assumptions | M | H | API contract by G2. Deploy to preview from Day 3. Core journey end-to-end by Day 7. | CTO | Open |
| R8 | Deployment or infra surprises on Day 13–14 | M | H | Staging from Day 3. Rollback rehearsed on Day 12. No first-time deploys on launch day. | SEC | Open |
| R9 | Bot coordination drift: agents work from stale requirements | M | M | This repo is the source of truth. Issues link to PRD sections. The daily report lists changes. | CoS | Open |
| R10 | Budget or spend uncertainty blocks hosting or tool choices | M | M | Prefer free tiers. List costs in the ADR. Founder approves before any spend. | CTO | Open |
| R11 | **Market data source access and licensing.** OLX, Daraz and others may prohibit scraping or have no API. Highest risk. | H | H | S17 (Days 1–2) records each source as permitted, prohibited or unknown before any connector is built. Do not scrape a platform that prohibits automated extraction. | CTO | Open |
| R12 | **Pricing accuracy and variant mismatch** giving misleading verdicts. | H | H | S18 (Days 1–3) sets methodology v0 and the evidence threshold. Exclude incompatible variants. Never fabricate a price; return "Insufficient market data" when evidence is thin. QA checks matching and the calculation. | CTO + QA | Open |
| R13 | **OCR/vision extraction accuracy** on low-quality screenshots and Urdu text. | H | H | The user confirms uncertain fields. Fallback is manual entry or another screenshot. QA includes low-quality and Urdu samples. | CTO | Open |
| R14 | **Screenshot privacy.** Images may contain phone numbers, names and other PII. | H | H | Secure upload processing. Do not log image contents. Keep retention minimal until the Founder approves storage. Include in the G2 threat model. | SecOps | Open |
| R15 | **Paid AI/API costs** needing Founder approval. | H | M | No paid provider is called until the Founder approves the cost. CoS lists the provider and the cost in the daily report. | CoS | Open |
| R16 | **The 14-day timeline versus the data-source dependency.** Launch cannot move without Founder approval, and pricing depends on source access. | H | H | S17 is the Day 1–2 priority. If access is blocked, CoS escalates a scope cut so 2026-11-22 holds. | CoS | Open |
