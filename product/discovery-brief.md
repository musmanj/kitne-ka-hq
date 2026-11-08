# Discovery Brief: Kitne Ka

Owner: PM · Contributors: CTO, DD · Status: **v0.1** · Target: G1 (Day 2, 2026-11-10)

Source: [Founder product brief](founder-brief-2026-11-09.md), received 2026-11-09. Statements marked **Assumption** are from brief §2 (or are conditional in the brief) and still need Founder approval. No other facts are inferred.

## 1. Problem
Buyers and sellers see a price on WhatsApp Status, OLX, an online marketplace or social media and cannot tell whether it is fair, overpriced or unusually low.

**Vision.** Kitne Ka — Know the Real Market Price Before You Buy or Sell. An AI price-verification and comparison platform. It identifies the product, retrieves comparable market prices, and returns an evidence-based assessment.

**Inputs.** A screenshot, a product URL, or a search (product name, brand, model or specs).

## 2. Audience and personas
**Assumption.** Individual buyers, sellers, secondhand shoppers and deal comparers. The brief does not say who is out of scope.

**Jobs to be done**
- **Buyer:** before paying, check an advertised price and learn whether it is fair, high or unusually low.
- **Seller:** before listing, check an asking price against current market evidence.

## 3. Market
**Assumption** (brief §2, pending Founder approval):
- Geography: Pakistan. Karachi first, then other major cities.
- Currency: PKR.
- Language: English UI first, then Urdu and Roman Urdu (the architecture must allow both).
- Platform: mobile-first PWA (responsive web, mobile-optimised).

No market-size figure is in the brief.

## 4. Competitors and alternatives
PM scan in progress (S2).

| Name | What they do | Strengths | Gaps we exploit | Source |
|---|---|---|---|---|
| PM scan in progress (S2) | | | | |

## 5. Value proposition
For buyers and sellers who need the real market price before they buy or sell, Kitne Ka verifies an advertised price from comparable market evidence. The "unlike" clause waits on the competitor scan (S2).

## 6. Assumptions (label each and say how to validate it)
| # | Assumption | Confidence | How we validate |
|---|---|---|---|
| A1 | **Assumption.** Pakistan, PKR, Karachi first, then other major cities. | Unscored | Founder approval at G1 (2026-11-10) |
| A2 | **Assumption.** English UI first; Urdu and Roman Urdu follow and must be architected for. | Unscored | Founder approval at G1 |
| A3 | **Assumption.** Mobile-first PWA, not a native app. | Unscored | Founder approval at G1 |
| A4 | **Assumption.** The users are individual buyers, sellers, secondhand shoppers and deal comparers. | Unscored | Founder approval at G1 |
| A5 | **Assumption.** A standard price check can run without an account if security and product constraints allow. | Unscored | SecOps + PM confirm whether the constraints allow it |

## 7. Risks
See the [risk register](../ops/risk-register.md). R1 (unconfirmed product purpose) is resolved. Open product risks: data-source access and licensing (highest), pricing accuracy and variant mismatch, OCR/vision on low-quality screenshots and Urdu text, screenshot privacy, paid AI/API cost, and the 14-day timeline against the data-source dependency.

## 8. Success metrics
The Founder brief sets no targets. None are invented here.

| Metric | Target at launch +30 days | How it's measured |
|---|---|---|
| North-star: TBD | | |
| Activation: TBD | | |
| Quality: error rate / p95 latency | TBD | Monitoring |

## 9. Founder inputs outstanding
Received 2026-11-09: purpose, vision, inputs, features F1–F5, MVP categories, the core journey, and the sprint calendar.

Open questions:
1. Data-source access and licensing (CTO + PM, Days 1–2, S17).
2. Pricing methodology (CTO + PM, Days 1–3, S18).
3. AI/OCR provider and cost (CTO + CoS; Founder approval before any spend).
4. Sharing format (owner not set).
5. Analytics consent approach (PM + SecOps).
