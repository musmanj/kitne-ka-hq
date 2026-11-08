# Engineering Standards

Owner: CTO. The aim is **simple, secure, maintainable**. Good engineering here is pragmatic, not ceremonial.

## Principles, applied pragmatically
- **SOLID:** apply it at module boundaries. Use a single responsibility per module or service, and depend on interfaces where there are real alternatives (DB, external APIs, payments, email). Don't add interfaces with only one implementation "just in case".
- **DRY:** extract on the third repetition, not the first.
- **KISS / YAGNI:** build only what an approved story needs. No speculative abstractions, microservices or plugins.
- **Patterns when justified:** Repository (data access), Adapter (third-party APIs), Strategy (swappable behaviour), DI via constructors. Name the pattern in the PR if it isn't obvious.

## Architecture default
A **modular monolith** ([ADR-0001](../architecture/adr/0001-modular-monolith-default.md)): one deployable unit, domain modules with clear boundaries, business logic isolated from frameworks and I/O, and an API-first contract (OpenAPI or typed schema).

## Repo, branches, PRs, commits
- Branch: `main` is protected, always deployable and needs PR plus green CI. Feature branches are `feat/<issue#>-slug`, `fix/<issue#>-slug`, `chore/...`, `docs/...`
- Commits: [Conventional Commits](https://www.conventionalcommits.org), e.g. `feat(auth): add session refresh (#12)`
- PRs: small (aim for under 400 lines changed), link the issue, include a test plan and screenshots for UI. Squash merge.
- No direct pushes to `main`, no force-pushes to shared branches.

## Code review checklist
- [ ] Meets the story's acceptance criteria. No scope creep.
- [ ] Clear names, small functions, business logic out of controllers and UI
- [ ] Inputs validated server-side, authz enforced server-side on every protected route
- [ ] Parameterized queries or ORM. No string-built SQL.
- [ ] Errors handled. No secrets or PII in logs.
- [ ] Tests cover the behaviour, including failure paths. CI green.
- [ ] DB changes come via migrations, with indexes for new query paths
- [ ] Responsive and accessible (labels, contrast, keyboard) for UI changes
- [ ] No new dependency without a reason (check maintenance and licence)

## Testing priorities (pyramid)
1. **Unit:** domain logic, validation, authz rules (fast, the most tests)
2. **Integration:** API plus DB on the critical endpoints
3. **E2E:** the essential user journey and auth flows only (few, stable)
4. Smoke tests on every deploy

Prioritize critical paths over a coverage percentage. A failing test blocks the merge.

## Security baseline (OWASP-aligned)
- OWASP Top 10 and ASVS L1 as the checklist. Threat model v1 by G2.
- Authentication: a proven library or provider. No hand-rolled crypto. Hashed passwords (argon2 or bcrypt) if local. Secure, HttpOnly, SameSite cookies or short-lived tokens. Rate-limit auth.
- Authorization: deny by default, checked server-side, with object-level checks (no IDOR).
- Input validation at the boundary. Output encoding. CSRF protection where cookies are used. Security headers (CSP, HSTS).
- Dependencies: lockfiles, automated vulnerability scanning and SAST in CI, approved versions only.
- **Secrets never in code, commits, issues, logs or chat.** Use the platform secret store or env vars, and keep a `.env.example` with placeholders only. If a secret leaks, rotate it immediately and log it.
- Least privilege for infra and CI tokens. Separate preview, staging and prod.
- Sensitive data (PII, payments) needs Founder approval before collection.

## Tech choices
Any major technology choice compares **at least 2 options** in an ADR (trade-offs plus a recommendation). Paid or vendor commitments need Founder approval.

## Technical debt
Log it as an issue labelled `type:task` with `debt` in the title, plus the reason and the payoff trigger. It's reviewed at G3.
