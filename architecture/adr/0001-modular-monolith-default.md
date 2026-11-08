# ADR-0001: Modular monolith as default architecture

- **Status:** Proposed (pending CTO review)
- **Date:** TBD (Day 2–3)
- **Deciders:** CTO
- **Issue:** TBD

## Context
We have 14 days to a deployed, secure MVP, a small (AI) team, and the product purpose isn't confirmed yet. We need fast iteration, simple deploys and low operational cost, while keeping a path to scale.

## Options
| Option | Pros | Cons |
|---|---|---|
| **A. Modular monolith** | One deploy, simple CI/CD, easy local dev, transactional consistency, cheap to host, and boundaries still enforced through modules | One scaling unit, and boundaries need discipline |
| B. Microservices | Independent scaling and deploys | Heavy ops overhead, distributed failures, slow for 14 days. YAGNI. |
| C. Serverless functions only | Little ops, pay per use | Fragmented logic, cold starts, harder local testing and consistency |

## Decision
**A. Modular monolith.** It has domain modules with explicit public interfaces, business logic isolated from framework and I/O (Clean/Hexagonal-lite), one relational DB with per-module tables, and adapters for third-party services.

## Consequences
- Fastest route to Day 14, and a single pipeline and environment set
- Modules can be extracted later if real load or team boundaries need it
- The CTO enforces module boundaries in code review (no cross-module DB access)
- Revisit if: independent scaling becomes necessary, or the product needs heavy async or real-time workloads
