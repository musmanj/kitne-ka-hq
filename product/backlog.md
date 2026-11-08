# Backlog

**The live board is GitHub Issues and a GitHub Project (Kanban)** in the application repo (or this repo before that exists). This file only defines the conventions and the seed tasks. Don't track status here.

Board columns: `Proposed` · `Ready` · `In Progress` · `In Review` · `Blocked` · `Done` (plus `Later` for post-MVP).

## Labels
| Group | Labels |
|---|---|
| Status | `status:proposed`, `status:ready`, `status:in-progress`, `status:in-review`, `status:blocked`, `status:done` |
| Type | `type:epic`, `type:story`, `type:task`, `type:bug`, `type:spike` |
| Area | `area:frontend`, `area:backend`, `area:db`, `area:infra`, `area:design`, `area:qa`, `area:security`, `area:docs` |
| Priority | `priority:P0` (blocker / core journey), `priority:P1` (must), `priority:P2` (should), `priority:P3` (could) |
| Owner | `owner:pm`, `owner:cto`, `owner:design`, `owner:uiux`, `owner:eng`, `owner:qa`, `owner:secops` |

Each issue uses the [task template](../docs/00-operating-model.md#task-template).

## Seed tasks: Days 1–4 (product-agnostic)
| # | Task | Owner | Day | Acceptance criteria |
|---|---|---|---|---|
| S1 | Run Founder intake and fill the discovery brief §1–5 | PM | 1 | Brief v0.1 committed. Every TBD either answered or listed as an open question. |
| S2 | Competitor and alternatives scan | PM | 1–2 | At least 5 entries with sources in the brief §4 |
| S3 | Draft and approve the essential user journey | PM + DD + CTO | 1–2 | PRD §1 complete. Founder approved at G1. |
| S4 | MVP MoSCoW scope and initial backlog | PM | 2 | PRD §3 filled. At least 10 stories created, at least 5 meet the DoR. |
| S5 | Create labels and the Project board | CoS | 1 | All labels above exist. Board columns match the statuses. |
| S6 | Stack options ADR (at least 2 options) | CTO | 2–3 | ADR-0002 written with trade-offs. Vendor/spend items flagged for the Founder. |
| S7 | App repo decision and scaffold | CTO + ENG | 3 | Repo created after approval. README, lint, format, test runner and a hello route working. |
| S8 | DB schema v1 and migrations | CTO + ENG | 3–4 | ERD in `architecture/`, migrations run in CI, indexes for the core queries |
| S9 | API contract v1 for the core journey | CTO + ENG | 3–4 | OpenAPI or typed schema committed, reviewed by PM and UX |
| S10 | CI pipeline: lint, test, build, dependency scan, SAST | SEC | 3 | Pipeline green on `main`. A failing test blocks the merge. |
| S11 | Preview/staging environment and secrets management | SEC | 3–4 | Preview URL per PR or on `main`. No secrets in the repo. `.env.example` present. |
| S12 | Low-fi flows for the core journey | UX | 2–3 | Flows cover the happy path and the main error/empty states. DD reviewed. |
| S13 | Hi-fi key screens and design tokens | UX + DD | 3–4 | Mobile and desktop for core screens. Tokens (colour, type, spacing) exported. AA contrast. |
| S14 | Test strategy and core-journey E2E skeleton | QA | 3–4 | Test plan committed. E2E framework runs in CI with 1 smoke test. |
| S15 | Threat model v1 | SEC + CTO | 4 | STRIDE-lite on the core journey. Top threats have mitigations or issues. |
| S16 | Daily report and decision log running | CoS | 1–14 | A report every day. Every gate decision logged. |
