# 14-Day Plan

**Calendar:** Day 1 = 2026-11-09 · G1 = 2026-11-10 · G2 = 2026-11-12 · G3 = 2026-11-18 · G4 = 2026-11-21 · launch = 2026-11-22.
Principle: **progressive elaboration.** Building starts as soon as the essential user journey is approved. We don't wait for every document.

## Parallel tracks
| Track | Lead | Days |
|---|---|---|
| Product (scope, PRD, backlog, acceptance) | PM | 1–14 |
| Design (flows, wireframes, design system, review) | DD + UX | 1–10 |
| Architecture and build | CTO + ENG | 2–12 |
| Quality (test plan, automation, regression) | QA | 3–13 |
| Platform and security (env, CI/CD, threat model, deploy) | SEC | 2–14 |
| Coordination and reporting | CoS | 1–14 |

## Day by day
| Day | Focus | Owners | Exit evidence |
|---|---|---|---|
| 1 | Founder intake, discovery brief, competitor scan, draft essential journey | PM (lead), CTO, DD; CoS on labels | Brief v0.1, journey draft, labels live |
| 2 | MVP scope, PRD v1 (core journey), initial backlog; arch options; low-fi flows. **G1** | PM, CTO, DD, UX | G1 decision logged |
| 3 | Wireframes for core journey; ADRs, stack, DB schema v1, API contract v1; repo, CI skeleton, preview env; first stories Ready; build starts on scaffold and auth (if needed) | UX, CTO, SEC, ENG, QA (test plan) | App repo, green CI, preview URL |
| 4 | Hi-fi key screens and design tokens; threat model v1; story slicing. **G2** | DD, UX, CTO, SEC, PM | G2 decision logged |
| 5–7 | Core journey end-to-end: DB migrations, API, UI. QA writes E2E for the happy path | ENG, QA, UX (support) | Demo of the core journey on preview |
| 8–9 | Secondary must-haves, error/empty states, responsiveness; CI gates (lint, tests, SAST, dep scan) | ENG, QA, SEC | Green pipeline, E2E passing |
| 10 | Feature-complete. **G3 feature freeze** | PM, CTO, CoS | G3 decision logged |
| 11 | Bug fixing, security review, accessibility pass | ENG, SEC, QA, DD | P0/P1 bugs closed or triaged |
| 12 | Staging release candidate, performance check, monitoring and rollback ready | SEC, ENG, QA | RC on staging, [release checklist](../ops/release-checklist.md) drafted |
| 13 | Final regression, PM acceptance. **G4 go/no-go** (Founder) | QA, PM, CoS, F | G4 decision logged |
| 14 | Production deploy (after approval), smoke test, demo, launch | SEC, ENG, CoS, F | Live URL, release notes, demo |

## Quality gates
| Gate | Day | Approver | Must be true |
|---|---|---|---|
| **G1 Scope approved** | 2 · 2026-11-10 | Founder | Product purpose and audience confirmed. Essential user journey written. MVP must/should/won't list. Top risks known. First 5+ stories Ready. |
| **G2 Architecture and design approved** | 4 · 2026-11-12 | CTO + DD (Founder for vendor/spend) | Stack ADRs accepted. DB schema and API contract v1. Core-journey wireframes signed off. CI green on the scaffold. Preview env live. Threat model v1. |
| **G3 Feature freeze** | 10 · 2026-11-18 | PM + CTO | All Must stories merged or explicitly cut. E2E covers the core journey. No open P0s. After this, only fixes go in. |
| **G4 Release go/no-go** | 13 · 2026-11-21 | Founder | DoD met for every shipped story. QA sign-off. Security findings resolved or accepted by the Founder. Rollback tested. Monitoring live. Release checklist complete. |

## Critical path
Founder purpose input → G1 scope → API contract, DB schema and core wireframes → core journey build (Days 5–7) → E2E and security review → staging RC → G4 → deploy.
Founder product input was received on Day 1 (2026-11-09). Further delay on the critical path still moves launch (2026-11-22) unless scope is cut.

## Contingency and cut rules
Applied by the CoS and PM, logged in the decision log:
1. **Protect the core journey.** It never gets cut. Everything else can be.
2. If a track is behind by more than 1 day, cut **Could** items first, then **Should** items. Don't add hours by skipping tests or security.
3. Never cut: auth/authz correctness (if there's auth), input validation, secrets hygiene, automated tests for the core journey, a rollback plan.
4. Prefer simplification (manual admin, seeded data, a single locale, web-only responsive) over new infra.
5. If G1 slips past Day 3, the CoS escalates with a re-plan: either a reduced scope or a new Day 14.
6. If G3 slips, the release date holds and the scope shrinks. Moving the date needs Founder approval.
7. Post-MVP ideas go to the `Later` column, never into the sprint.
