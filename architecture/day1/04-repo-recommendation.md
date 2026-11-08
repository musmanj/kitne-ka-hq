# App repository recommendation
CTO, 9 Nov 2026 PKT. **Recommend a separate private `musmanj/kitne-ka-app` repository**, subject to owner confirmation/creation. No repo was created, cloned, changed or pushed in this task.

`kitne-ka-hq` remains the authoritative product/governance home: Founder brief, PRD, schedule, gate decisions, architectural decision index and cross-functional issue tracking. App repo owns executable code, DB migrations, API schema, tests, deployment settings and code-adjacent technical documentation. Link—not copy—the governing ADR/PRD so the two do not drift; accepted API schema lives with app code and HQ links its version. For this assessment all deliverables remain local, not published.

## Why separate
- One atomic app release pipeline, dependency lockfile and predictable preview builds; strategy/doc commits need not trigger app deployments.
- Different access/secret environments and deployment permissions from board/governance documents; private app reduces accidental source disclosure (not a replacement for env-only secrets).
- One small modular monolith in one repo; **not** separate frontend/backend/source repos or a monorepo framework. Modules ordinary folders with testable public boundaries.
- Source-licence evidence/raw research snapshots do not enter app bundles, production fixtures or public artefacts.

## Alternative: `/app` inside HQ
Fastest if creating/granting a second repo blocks Day3. Valid low-overhead fallback: path-filter app CI, dedicated app root/lockfile, CODEOWNERS, same protected-main standards, envs only for app deployment; no forced migration during sprint. Separation helps governance but is NOT worth losing a day. Decide owner/access by G1; use existing HQ `/app` fallback if a new repo isn't ready. The fallback needs explicit repo-write authorisation and ordinary review; none is implied by this assessment.

## Suggested layout (proposal only)
```
src/domain/{catalogue,matching,pricing,verdict}
src/application/{assessment,jobs}
src/adapters/{sources,extraction,persistence}
src/api/             # schemas/routes/errors
src/ui/              # category-driven PWA
src/i18n/            # ICU messages
migrations/
tests/{unit,integration,e2e,fixtures}/
docs/{api,runbooks}/
```
No generic service layer for every entity or dependency-injection framework. Factory/constructor injection at actual I/O seams. Protect main, PR+green CI, small commits/PRs, lockfile, dependency licence checks, separate preview/prod secrets. App source does not contain screenshots, personal evidence, provider keys or licensed datasets unless their rights explicitly allow repository storage. Synthetic fixtures labelled and never loaded as market evidence in production.

## HQ documents reviewed successfully
- `docs/01-14-day-plan.md`: good gate/build structure; patch stale Day1=TBD and critical-path date-slip language to dated Founder plan. Day14 remains22 Nov2026 PKT unless Founder changes it.
- `docs/03-engineering-standards.md`: aligns; keep pragmatic SOLID and existing PR/testing/security bar.
- `architecture/adr/0001-modular-monolith-default.md`: CTO endorses with serverless/deployment clarification in ADR-0002. Repo status remains Proposed because no write performed.
