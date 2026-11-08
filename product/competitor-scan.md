# Competitor & alternatives scan (Day 1, v0.1)
Status: Proposed · Retrieved: 9 Nov 2026 (00:30–01:00 PKT) via curl from the box. No traffic or user figures are cited because none were verified.
Legend for data source: **Permitted / Prohibited / Unclear**. "Automated" means crawling or scraping by us. User-submitted screenshots or URLs aren't crawling.

| Alternative | What it does | Overlap | Gap Kitne Ka fills | Robots / ToS (fetched) | Data source? |
|---|---|---|---|---|---|
| PriceOye (https://priceoye.pk) | PK electronics retailer and price-comparison listings for phones | High for new-phone prices | No verdict on a third-party ad, no used market, no screenshot input | robots.txt (https://priceoye.pk/robots.txt): a `Disallow: /` group for some agent(s), and `User-agent: *` disallows `*?`, `*&` (query URLs), /account etc., then `Allow: /`. The T&C page (https://priceoye.pk/terms-and-conditions) loaded mostly as app JSON; scraping clauses not confirmed. Its page data shows fields such as `price_crawled_date`, so PriceOye itself aggregates crawled prices. | **Unclear → legal review.** No public API found. Ask about a partnership/feed. |
| Daraz.pk (https://www.daraz.pk) | Largest marketplace (no figure cited) | New-price evidence | No fairness verdict, no cross-source view | robots.txt allows most product paths (disallows /checkout, /cart, /catalog/ …). **ToS (https://www.daraz.pk/terms-of-use/) prohibits "any use of data mining, robots, or similar data gathering and extraction tools".** | **Prohibited for scraping.** Possible via the Daraz Open Platform/affiliate programme; terms for price display not yet verified |
| OLX Pakistan (https://www.olx.com.pk) | Classifieds, the main used-goods venue | Used prices | No price guidance or verdict | robots.txt disallows /api/, /post/, /chat/, /profile/; listings are not disallowed. The terms URL /terms-of-use returned 404, so terms weren't read. | **Unclear → legal review.** No public API found. User-pasted OLX URLs/screenshots are OK as user evidence. |
| PakWheels price calculator (https://www.pakwheels.com) | Used-car price estimator, the closest PK analogue for a "fair price" tool | Model of the UX/method (cars, not electronics) | Electronics category | robots.txt reviewed (forum/admin paths disallowed); terms not fetched | Not relevant as a source; it's a UX/method benchmark |
| WhatMobile (https://www.whatmobile.com.pk) | Phone specs and "official" PKR prices | Official/launch retail price | No market or used prices, no verdict | robots.txt disallows /search.php, /lookup.php, /m/; model pages are not disallowed. ToS not fetched. | **Unclear.** Candidate for *manual* seed of official retail prices, with citation |
| Mobilemall.pk, Hamariweb mobile prices | Spec and price listing sites | Same as WhatMobile | Same | Mobilemall robots.txt 301 redirect, not resolved. Hamariweb robots.txt has no relevant disallow for price pages. ToS not fetched. | Unclear. Manual seed only |
| iShopping.pk (https://www.ishopping.pk) | Retailer | New prices | — | robots.txt `User-agent: *` with an empty Disallow (permissive), plus admin paths | Robots permissive. **ToS not verified → Unclear** |
| Telemart (https://www.telemart.pk) | Retailer (Shopify) | New prices | — | robots.txt comment: "Public product, collection, page… HTML is crawlable" | Robots appears **Permitted**. ToS not verified. Shopify `/products.json` may exist (verify) |
| Google Shopping | Global product price aggregation | New prices | Weak coverage of PK used goods (ASSUMPTION) | Scraping Google is not allowed. Access is through licensed APIs (SerpAPI-type, paid) | Paid licensed API (CTO tier c), needs Founder budget |
| Keepa / CamelCamelCamel | Amazon price history | "Is now a good price" concept | Not in PK, not used goods | Keepa sells a paid API | Not a source; concept analogue |
| PriceSpy / PriceRunner | EU price comparison with history | Comparison UX | Not in PK | — | Analogue only |
| Swappa / Back Market | US/EU used-electronics marketplaces with price guides | Used-price guide by condition | Not in PK | — | Analogue for condition-pooled used pricing |
| WhatsApp groups / dealers / "ask a friend" | Status quo | The main alternative (ASSUMPTION) | Speed, evidence, neutrality | n/a | n/a |

Note: the terms pages for Daraz, OLX and PriceOye were fetched directly. PakWheels, iShopping, Telemart, WhatMobile and the global sites were not (rows that cite only a homepage or "—" weren't re-verified on 9 Nov). The Swappa/PriceSpy rows come from general knowledge and should be confirmed before publishing.

## Where my findings DIFFER from or add to the CTO list (to merge into one source list)
1. **Daraz:** the CTO has "affiliate/open platform to verify". I confirm the **ToS explicitly prohibits robots/data mining**, so scraping is definitively out, not just unverified.
2. **Telemart:** robots.txt *explicitly says product HTML is crawlable*. That's a possible tier-(b)-like candidate the CTO list doesn't include. It's still pending ToS review, so it's not "used" yet.
3. **iShopping:** robots.txt is permissive. ToS is unverified. Candidate for legal review.
4. **PriceOye:** robots.txt has a full-disallow group for some user-agent and blocks query URLs. It's itself a crawler-aggregator, so **treat it as Unclear and leaning prohibited**. Better as a partnership target.
5. **OLX:** I couldn't read the terms (404). It stays Unclear/excluded. The used-market evidence gap is therefore real: used pricing at launch will depend on user-submitted evidence plus manual seed data.
6. **WhatMobile/Hamariweb:** suggested only as *manually cited* official retail prices (tier d), not automated sources.

## Takeaway
No PK product gives a sourced fair/high/low verdict on a third-party ad, and none starts from a screenshot (based on this scan, not exhaustive). The defensible position is evidence transparency. The binding constraint is data access, especially for used prices.
