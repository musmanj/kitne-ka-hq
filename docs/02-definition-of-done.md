# Definition of Ready and Done

## Definition of Ready (story can move to Ready)
- [ ] Linked to the essential user journey or an approved epic
- [ ] User story plus testable acceptance criteria, including key edge and error cases
- [ ] Design attached (wireframe or screen), or marked "no UI"
- [ ] API and data impact noted, with CTO input
- [ ] Dependencies known and not blocking
- [ ] Small enough to finish in ≤1 day; otherwise split it
- [ ] Owner and reviewer assigned, with priority and labels set

## Definition of Done
A story is **Done** only when all of these are true:
1. [ ] Acceptance criteria are met
2. [ ] Implementation is complete and merged to `main`
3. [ ] Tests **actually passed** in CI (link the run)
4. [ ] Code review is complete (CTO or delegate approved the PR)
5. [ ] Important security findings are resolved, or accepted by the Founder in the decision log
6. [ ] Docs are updated (README, API, ADR, or changelog as relevant)
7. [ ] QA verified it on preview or staging
8. [ ] PM accepted it

Evidence (PR, CI run, preview URL, QA note) goes in the issue. No evidence means it isn't Done.

## Bugs
Done means: a regression test is added, the fix is verified by QA, and the root cause is noted in the issue.
