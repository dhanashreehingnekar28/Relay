# Relay Round 2 production build report

Production submission URL: https://relay2-rho.vercel.app/
Repository: https://github.com/dhanashreehingnekar28/Relay
Branch: main
Verification date: 10 November 2026 (India)

## Production release
The existing dev407 / relay2 project was deployed from the requested repository. Commit 347ee69 reached Ready in Production and the canonical domain was assigned to it. The production build verified all 11 required tables and added/verified the three invitation columns in the existing Neon database. TLS was requested. No existing rows or secrets were replaced. Subsequent release changes add the missing favicon, navigation health regression test and this report; see Vercel deployment metadata for the final commit.

## Eight-step live acceptance
All steps passed in fresh signed-out browser contexts against the canonical production domain:

| Step | Result |
|---|---|
| 1 Create isolated CampusConnect sample workspace | PASS |
| 2 Import the Kabir ownership note with a reason | PASS |
| 3 Reconstruct and inspect the exact quotation | PASS |
| 4 Correct conflicting payment claim and retain it after refresh | PASS |
| 5 Review, approve version 1 and preserve immutable snapshot | PASS |
| 6 Neha link/code session; direct-ID denial for restricted/rejected/unapproved data | PASS |
| 7 Task note, completion persistence and receipt acknowledgement | PASS |
| 8 Lead history contains reviews, approval and acknowledgement | PASS |

The three workflow scenarios passed in 36.7 seconds on the first updated live run. They also verify regeneration/revocation, unresolved labels, cross-workspace denial, and one-to-two-source recomputation without treating human confirmation as evidence. Mobile upload and pre-approval denial passed. The navigation/refresh/browser-health check found a missing favicon (404); this release supplies an explicit SVG favicon. Final navigation results are recorded in the deployment handoff after retesting.

## Architecture verified from source
React 19, TypeScript and Vite; npm lockfile; same-origin Node serverless handler at api/relay.js; pg connection pool and PostgreSQL SQL migrations (no ORM). Hash routes allow refresh without server route rewrites. Vercel rewrites /api/* to the handler. Signed seven-day demo sessions enforce workspace and reviewer/incoming roles at the API. Published versions, reviews and audit records have database immutability triggers. This is demo authentication, not OAuth.

Production settings: Vite, repository root, npm ci, Node 24, dist output. Build runs node scripts/production-migrate.js followed by npm run build. The migration takes a transaction advisory lock, adds only absent invitation columns, checks tables and stops on failure. A local upgrade-and-repeat test verified retained rows and immutable triggers.

## Environment verification
DATABASE_URL, SESSION_SECRET, LLM_API_KEY and LLM_PROVIDER are configured for Production. No values were printed or changed. Successful migration and live database writes verify DATABASE_URL; signed role tests verify SESSION_SECRET. Optional provider execution is not independently certified: rules and audited provider fallback remain available.

## Implemented behavior
Matching ownership sentences attach within their visibility scope. Source counts and evidence labels recompute; incompatible owners/states remain Conflicting. One independent source or any source over 42 days old is Insufficient Evidence; two fresh compatible records are Supported. Human confirmation has its own badge and never adds a source. Reviewer resolutions and previous evidence states persist during reconstruction.

Neha sharing uses a random link secret plus code; only hashes are stored. Redemption is rate-limited. Regeneration and revocation invalidate prior incoming sessions. Unresolved claims remain labelled in the approved view. Import/review/sharing actions are audited.

## Remaining configuration checks
The Vercel project remains persistently linked to kotebhakti30/Relay. Explicit deployments from the requested dhanashreehingnekar28/Relay repository work, but automatic deployment of future pushes requires changing the dashboard Git connection. The dashboard tab needs the owner to sign in; connector tools do not expose reconnection of an existing project. No duplicate project was created.

The existing connection is verified as Neon with successful schema access. Read-only PostgreSQL settings confirmed project late-cloud-34503087 and branch br-square-paper-bcw4qo4e, exactly matching the supplied Neon console link. The existing production credential was preserved.

Runtime logs showed a pg SSL-mode deprecation warning; the current driver treats require as verify-full. No application crash was observed. This warning is not an authentication or database failure.

## Real versus simulated
Database writes, exact-quote validation, review, immutable versions, role restrictions, sharing, tasks and acknowledgements are real. CampusConnect identities and initial records are synthetic. External GitHub/chat/task-board synchronization and OAuth are outside scope. English rule extraction is bounded; optional model access has fallback. No enterprise-security or extraction-accuracy certification is claimed.
