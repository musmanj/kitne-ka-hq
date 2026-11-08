# KITNE KA — OFFICIAL PRODUCT BRIEF (Founder, received 2026-11-09 00:21 PKT)
Day 1 of the 14-day MVP sprint = Mon 9 Nov 2026. G1 scope = Day 2 (10 Nov), G2 design+architecture = Day 4 (12 Nov), G3 feature freeze = Day 10 (18 Nov), G4 go/no-go = Day 13 (21 Nov), launch = Day 14 (22 Nov). Deadline cannot change without Founder approval.

## 1. Vision
Kitne Ka — Know the Real Market Price Before You Buy or Sell. AI-powered product price verification and comparison platform. Users upload a screenshot, paste a product URL, or enter a product name. The system identifies the product, retrieves available comparable market prices, and gives an evidence-based estimate of whether the advertised price is fair, overpriced, or unusually low. Major use case: products advertised via WhatsApp Status, OLX, online marketplaces, social media. Must help both buyers and sellers.

## 2. Target market (initial assumptions, subject to Founder approval)
Pakistan; PKR; Karachi and other major cities; English UI first, architected for Urdu and Roman Urdu; responsive web app / PWA, mobile-optimised; individual buyers, sellers, secondhand shoppers, deal comparers.

## 3. MVP features
F1 Screenshot price verification: read visible text and price; identify category, brand, model; extract specs when visible; detect new vs used when stated; ask user to confirm uncertain info; compare against market evidence; produce assessment.
F2 Product link analysis: extract details via permitted integrations or publicly accessible content where authorised; if extraction unavailable/prohibited, fall back to manual entry or screenshot upload.
F3 Product search: by name, brand, model or specs; find matches and comparable market prices.
F4 AI price intelligence output: seller asking price; estimated market range; difference from midpoint; Fair / High / Unusually Low; confidence and evidence quality; new vs used comparison; source links and retrieval dates; brief explanation. Never present a single absolute "original price" without reliable evidence. Distinguish official retail price, current new-market price, estimated used-market value.
F5 Comparison results: comparable offers with source, price, variant, condition, location, freshness. Only legally and technically permitted data access. No scraping of platforms that prohibit automated extraction. Identify source availability and licensing dependencies early.

## 4. Categories
Long term: mobiles, laptops, consoles, accessories, cameras, appliances, electronics, furniture, more. MVP priority: 1) mobile phones 2) laptops 3) gaming consoles. Architecture must be category-extensible, not hardcoded.

## 5. Core journey
Open app → upload screenshot / paste link / search → AI extracts and identifies → user confirms model, condition, specs when needed → pricing engine gathers evidence → matching engine excludes incompatible variants → engine produces defensible range → result + sources shown → user can share the assessment. If evidence is insufficient, return "Insufficient market data"; never fabricate a price.

## 6. Technical expectations (CTO)
Modular extensible architecture; product identification and matching service; OCR/vision extraction pipeline; marketplace integration abstraction; normalisation and variant matching; price estimation and comparison engine; source provenance and freshness tracking; persistence and caching; secure file upload processing; screenshot privacy; observability and error handling. SOLID; Strategy/Adapter where justified for source integrations. Avoid overengineering.

## 7. Design expectations
Premium, simple, mobile-first. Three primary actions: Upload Screenshot | Paste Product Link | Search Product. Results screen intuitive, polished, readable, transparent about confidence and sources. Standard price check without an account if security/product constraints allow.

## 8. Team
CoS coordinates all eight. PM: PRD, categories, MVP boundaries, acceptance criteria. CTO: architecture, approved integrations, price intelligence logic, technical risks. Design Lead: complete core UX. UI/UX: implementation-ready responsive screens. Engineer: working functionality. QA: extraction, matching accuracy, pricing calculations, critical journeys. DevOps/Security: deployment readiness, security, privacy, monitoring.

## 10. Day 1 instructions
Update discovery brief and PRD; create the 16 planned GitHub issues with owners, priorities, acceptance criteria; joint PM + CTO + Design Lead assessment; prioritise validating data-source access and pricing methodology (largest technical risks); begin approved low-risk foundations without waiting on docs; first daily report 9 PM PKT with real evidence.
