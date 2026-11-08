# Competitor & alternatives scan (Day 1, v0.1)
Status: Proposed · **v0.1.1 (9 Nov): reconciled with CTO consolidated source list (`/workspace/kitne-ka/cto/00-summary.md` §3, `01-data-source-matrix.md`)** · Retrieved: 9 Nov 2026 (00:30–01:00 PKT) via curl from the box. No traffic or user figures are cited because none were verified.
Legend for data source: **Permitted / Prohibited / Unclear**. "Automated" means crawling or scraping by us. User-submitted screenshots or URLs aren't crawling.

| Alternative | What it does | Overlap | Gap Kitne Ka fills | Robots / ToS (fetched) | Data source? |
|---|---|---|---|---|---|
| PriceOye (https://priceoye.pk) | PK electronics retailer and price-comparison listings for phones | High for new-phone prices | No verdict on a third-party ad, no used market, no screenshot input | robots.txt (https://priceoye.pk/robots.txt): a `Disallow: /` group for some agent(s), and `User-agent: *` disallows `*?`, `*&` (query URLs), /account etc., then `Allow: /`. The T&C page (https://priceoye.pk/terms-and-conditions) loaded mostly as app JSON; scraping clauses not confirmed. Its page data shows fields such as `price_crawled_date`, so PriceOye itself aggregates crawled prices. | **Unclear → legal review.** No public API found. Ask about a partnership/feed. |
| Daraz.pk (https://www.daraz.pk) | Largest marketplace (no figure cited) | New-price evidence | No fairness verdict, no cross-source view | robots.txt allows most product paths (disallows /checkout, /cart, /catalog/ …). **ToS (https://www.daraz.pk/terms-of-use/) prohibits "any use of data mining, robots, or similar data gathering and extraction tools".** | **Prohibited for scraping.** Possible via the Daraz Open Platform/affiliate programme; terms for price display not yet verified |
| OLX Pakistan (https://www.olx.com.pk) | Classifieds, the main used-goods venue | Used prices | No price guidance or verdict | robots.txt disallows /api/, /chat/, /profile/. **Terms (help centre, per CTO evidence T1: https://help.olx.com.pk/hc/en-us/articles/35615763019793-What-are-the-terms-of-use) §4 prohibit automated means (spiders, robots, crawlers, data mining) to download or scrape data, except search engines/archives. §7 requires a licence for collection/aggregation/commercial use.** My earlier `/terms-of-use` 404 was a dead endpoint, not an absence of terms (corrected 9 Nov). | **Prohibited (Excluded)** without a written licence. Pasted OLX URL → NOT_PERMITTED (403), no fetch. OLX screenshots → extraction disabled pending legal review. Partnership/licence is the only route |
| PakWheels price calculator (https://www.pakwheels.com) | Used-car price estimator, the closest PK analogue for a "fair price" tool | Model of the UX/method (cars, not electronics) | Electronics category | robots.txt reviewed (forum/admin paths disallowed); terms not fetched | Not relevant as a source; it's a UX/method benchmark |
| WhatMobile (https://www.whatmobile.com.pk) | Phone specs and "official" PKR prices | Official/launch retail price | No market or used prices, no verdict | robots.txt disallows /search.php, /lookup.php, /m/; model pages are not disallowed. ToS not fetched. | **Unclear.** Candidate for *manual* seed of official retail prices, with citation |
| Mobilemall.pk, Hamariweb mobile prices | Spec and price listing sites | Same as WhatMobile | Same | Mobilemall robots.txt 301 redirect, not resolved. Hamariweb robots.txt has no relevant disallow for price pages. ToS not fetched. | Unclear. Manual seed only |
| iShopping.pk (https://www.ishopping.pk) | Retailer | New prices | — | robots.txt permissive. CTO checked the terms: no reuse grant | **Partnership target** (CTO) |
| Telemart (https://www.telemart.pk) | Retailer (Shopify) | New prices | — | robots.txt comment says product HTML is "crawlable", but **CTO checked the terms: commercial/third-party use restricted** (redirect to Telex observed) | **Excluded** (CTO). Robots permission ≠ terms permission |
| Google Shopping | Global product price aggregation | New prices | Weak coverage of PK used goods (ASSUMPTION) | Scraping Google is not allowed. Access is through licensed APIs (SerpAPI-type, paid) | Paid licensed API (CTO tier c), needs Founder budget |
| Keepa / CamelCamelCamel | Amazon price history | "Is now a good price" concept | Not in PK, not used goods | Keepa sells a paid API | Not a source; concept analogue |
| PriceSpy / PriceRunner | EU price comparison with history | Comparison UX | Not in PK | — | Analogue only |
| Swappa / Back Market | US/EU used-electronics marketplaces with price guides | Used-price guide by condition | Not in PK | — | Analogue for condition-pooled used pricing |
| WhatsApp groups / dealers / "ask a friend" | Status quo | The main alternative (ASSUMPTION) | Speed, evidence, neutrality | n/a | n/a |

Note: the terms pages for Daraz, OLX and PriceOye were fetched directly. PakWheels, iShopping, Telemart, WhatMobile and the global sites were not (rows that cite only a homepage or "—" weren't re-verified on 9 Nov). The Swappa/PriceSpy rows come from general knowledge and should be confirmed before publishing.

## Reconciliation with the CTO list (9 Nov, v0.1.1): one source list = CTO `00-summary.md` §3
1. **OLX:** corrected from Unclear to **Prohibited/Excluded**. The help-centre terms (cited above) forbid automated extraction; the CTO evidence is authoritative. My earlier claim that user-pasted OLX URLs/screenshots "are OK" was too broad. URL → NOT_PERMITTED, screenshot extraction gated by legal review.
2. **Daraz:** agreed. The storefront is Excluded (the terms ban data mining/robots). Open Platform is Conditional, affiliate is a Partnership target.
3. **Telemart:** my robots.txt "crawlable" finding is superseded. The CTO checked the terms (commercial use restricted), so it's **Excluded**.
4. **iShopping:** permissive robots, no reuse grant in the terms → Partnership target.
5. **PriceOye:** agreed → Partnership target.
6. **WhatMobile/Hamariweb:** agreed → Conditional manual reference, *not* verified retail.
7. **Mobilemall:** CTO policy fetches 403 → Partnership target.
8. Sources the CTO added that weren't in my scan: Samsung PK, Apple, Mercantile, Xiaomi, Infinix, Tecno, Mega.pk, Games & Gears, Czone, SerpAPI/Serper, Google Merchant API (see the CTO list).
No remaining PM-vs-CTO differences.

## Takeaway
No PK product gives a sourced fair/high/low verdict on a third-party ad, and none starts from a screenshot (based on this scan, not exhaustive). The defensible position is evidence transparency. The binding constraint is data access, especially for used prices.
