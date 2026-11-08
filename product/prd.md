# PRD: Kitne Ka MVP

v0.2 draft for G1: see prd-v0.2-draft.md

Owner: PM · Reviewers: CTO, DD, QA · Status: **Draft** · Version: 0.1
Pending G1 on Day 2, 2026-11-10. Elaborated progressively. Sections below the journey can trail behind the build.

Source: [Founder product brief](founder-brief-2026-11-09.md).

## 1. Essential user journey (approve first)
The Day 14 path is the nine steps from the brief.

| Step | User does | System does | Screen | Acceptance criteria |
|---|---|---|---|---|
| 1 | Opens the app | Shows the start | Entry | A standard price check needs no account, if security and product constraints allow. |
| 2 | Uploads a screenshot, pastes a link, or searches | Accepts that input | Entry | The three actions are Upload Screenshot, Paste Product Link, and Search Product. |
| 3 | Waits | AI extracts and identifies the product | TBD | Category, brand and model are identified. Specs are extracted when visible. New vs used is detected when stated. |
| 4 | Confirms model, condition and specs when needed | Asks where the extraction is uncertain | TBD | Uncertain info is not filled in silently. The user can correct it. |
| 5 | Waits | Pricing engine gathers evidence | TBD | Only legally permitted sources are used. |
| 6 | Waits | Matching engine excludes incompatible variants | TBD | Incompatible variants are not used as evidence. |
| 7 | Waits | Produces a defensible range, or stops | TBD | Thin evidence returns "Insufficient market data". A price is never fabricated. |
| 8 | Reads the result | Shows the assessment and sources | Results | The output fields below are present. Official retail, current new-market and estimated used values are distinct. |
| 9 | Shares the assessment | Offers a share action | Results | The user can share. The format is an open question. |

Happy-path success = an evidence-based Fair / High / Unusually Low result with sources, or "Insufficient market data".

### Rules
- Never fabricate a price. When evidence is thin, return **Insufficient market data**.
- Distinguish official retail price, current new-market price, and estimated used-market value.
- Never present a single absolute "original price" without reliable evidence.
- Only use legally permitted data sources. Do not scrape a platform that prohibits automated extraction.

### Price assessment output
- Seller asking price
- Estimated market range
- Difference from midpoint
- Verdict: Fair / High / Unusually Low
- Confidence and evidence quality
- New vs used comparison
- Source links and retrieval dates
- Brief explanation

## 2. Goal and success metrics
Know the real market price before a buy or sell. Targets are not in the brief. See [discovery brief §8](discovery-brief.md#8-success-metrics).

## 3. Scope (MoSCoW)
**PM finalising for G1.**

| Must (core journey) | Should | Could | Won't (this MVP) |
|---|---|---|---|
| PM finalising for G1 | PM finalising for G1 | PM finalising for G1 | PM finalising for G1 |

**MVP categories:** mobile phones, laptops, gaming consoles.
**Extensibility:** categories must be extensible, not hardcoded. Later categories (accessories, cameras, appliances, electronics, furniture, others) have to be addable without a rewrite.
**No-account checks:** a standard price check runs with no sign-up and no login, if security and product constraints allow.

## 4. Epics and stories
Draft acceptance criteria, taken from the brief. Priorities wait on the MoSCoW pass.

| Epic | Story ("As a…, I want…, so that…") | Priority | Issue |
|---|---|---|---|
| F1 Screenshot price verification | As a user, I want to upload a screenshot so that the visible price is checked against the market. | Draft | — |
| F2 Product link analysis | As a user, I want to paste a product URL so that details are read where access is permitted. | Draft | — |
| F3 Product search | As a user, I want to search by name, brand, model or specs so that I get matches and comparable prices. | Draft | — |
| F4 AI price intelligence | As a user, I want an evidence-based assessment so that I can tell if the asking price is fair, high or unusually low. | Draft | — |
| F5 Comparison results | As a user, I want the comparable offers and their provenance so that I can see why the range was produced. | Draft | — |

**F1 Screenshot price verification**
- Reads visible text and the price.
- Identifies category, brand and model.
- Extracts specs when visible.
- Detects new vs used when stated.
- Asks the user to confirm uncertain info.
- Compares against market evidence and produces the assessment.

**F2 Product link analysis**
- Extracts details via permitted integrations, or from publicly accessible content where that is authorised.
- If extraction is unavailable or prohibited, falls back to manual entry or a screenshot upload.

**F3 Product search**
- Search by name, brand, model or specs.
- Returns matches and comparable market prices.

**F4 AI price intelligence**
- Returns every field in the price assessment output.
- Follows the rules in §1.

**F5 Comparison results**
- Each comparable offer shows source, price, variant, condition, location and freshness.
- Only legally and technically permitted data access.
- No scraping of platforms that prohibit automated extraction.

The full acceptance criteria live in each GitHub issue (Given/When/Then) once the issues exist.

## 5. Non-functional requirements
- Responsive, mobile-first PWA. WCAG 2.2 AA.
- Performance: p95 page load **TBD** (default under 2.5 s LCP on 4G)
- Security: [engineering standards](../docs/03-engineering-standards.md#security-baseline-owasp-aligned)
- Languages / locales: English first, architected for Urdu and Roman Urdu.
- Availability and observability: errors tracked, uptime monitor on the live URL.
- No-account checks: see §3.
- Category model is extensible: see §3.

## 6. Data and privacy
Screenshots may contain phone numbers, names and other PII. The brief requires secure upload processing and screenshot privacy. Retention is not specified. Analytics consent is an open question (§9).

## 7. Edge cases and errors
- Thin evidence: return "Insufficient market data". Do not fabricate a price.
- Link extraction unavailable or prohibited: fall back to manual entry or a screenshot.
- Uncertain extraction: the user confirms model, condition and specs.
- Incompatible variant: exclude it.
- Offline, slow network and third-party failure behaviour: not specified yet.

## 8. Analytics events
**TBD.** No event list until the analytics consent approach is decided (§9).

## 9. Open questions
| # | Question | Owner | Due |
|---|---|---|---|
| Q1 | Data-source access and licensing | CTO + PM | Days 1–2 (S17) |
| Q2 | Pricing methodology | CTO + PM | Days 1–3 (S18) |
| Q3 | AI/OCR provider and cost | CTO + CoS | Before any spend |
| Q4 | Sharing format | — | Open |
| Q5 | Analytics consent approach | PM + SecOps | Open |

Product purpose was confirmed by the Founder brief on 2026-11-09.
