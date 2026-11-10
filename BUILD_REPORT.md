# Relay Round 2 build report

DEV404 — Dhanashree S. Hingnekar and Bhakti S. Kote.

Production submission URL: https://relay2-rho.vercel.app/
Repository: https://github.com/dhanashreehingnekar28/Relay

## Verification status

On 10 November 2026 the existing public deployment passed the eight-step browser acceptance journey and mobile import check in fresh, signed-out Edge contexts. This is the baseline deployment. The updated access-code and evidence-matching implementation has passed local testing but its Production release is not verified.

| Acceptance step | Existing live build | Updated local build |
|---|---|---|
| 1 Isolated CampusConnect workspace | Pass | Pass |
| 2 Paste Kabir ownership note and see imported record | Pass | Pass |
| 3 Kabir claim with exact input quotation | Pass | Pass |
| 4 Conflicting payment claim, corrected and persisted after refresh | Pass | Pass |
| 5 Accept/reject/unresolved with reasons, approved immutable version | Pass | Pass |
| 6 Separate incoming browser and 403/404 for restricted and unapproved IDs | Pass using previous bearer link | Pass using new link plus code |
| 7 Task note/completion persistence and acknowledgement | Pass | Pass |
| 8 Lead audit history with review, approval and acknowledgement | Pass | Pass |

The existing live API returned 200 for workspace creation and state, including five seeded records. This proves those deployed tables and sample creation work. It does not independently identify the Neon project or confirm optional provider variables. The source has serverless API routes and PostgreSQL queries. Vercel project inspection returned 403 for dev407. Access authorization recovery returned 404, Team not found. Production assignment, git linkage, environment variable presence, Deployment Protection settings and the new migration remain operator checks.

## Changes implemented

Matching ownership sentences group by normalized task subject within their visibility scope, including wording such as “Neha confirmed she will own”. Extra independent source records attach to the candidate. Incompatible owners or status updates produce Conflicting. A single source or any source over 42 days old produces Insufficient Evidence. Two or more independent fresh sources without conflict produce Supported. Adding a fresh note to the old Aarav record may correctly produce Conflicting, and the old 45-day record cannot satisfy a two-fresh-source requirement.

Reconstruction preserves existing review resolutions for stable candidate IDs and appends previous evidence states to the claim history. Confirmation is displayed separately from source evidence. Sources show age in days. Review offers supporting-note entry, human confirmation with a required reason, owner/statement editing, unresolved and rejection. Imported supporting notes require a reason and an explicit reconstruction.

Approved handovers have a Share with Neha action returning a random 256-bit link secret and six-digit code. Only hashes are stored. Redemption is rate-limited and issues an incoming-only signed session. Regeneration and revocation increment the workspace invitation epoch, invalidating prior sessions. Existing incoming links require regeneration after migration. Every API read remains workspace/role scoped. The incoming handover preserves unresolved labels. The UI displays the current authenticated role.

## Architecture and changes since Round 1

React/Vite calls same-origin Vercel serverless routes. PostgreSQL stores source records, extracted claims, exact evidence links, reviews, immutable handover snapshots, tasks, acknowledgements and audit records. The database is configured through server-only DATABASE_URL. Signed demo sessions replace OAuth. Real text/Markdown ingestion and persisted deterministic extraction replace the Round 1 browser-only fixtures. Optional Gemini/Groq extraction remains guarded by schema and quotation checks; no live provider execution was verified during this update.

The single deployable stack replaces the proposed separate FastAPI service and pgvector retrieval. Connectors remain narrow to support a complete demonstrable workflow. Round 3 refresh/re-review, departing-member clarification and evidence-backed Q&A are deferred.

## Worked handover verified on the existing live deployment

The judge entered “Kabir will own the nightly digest cron job after Aarav leaves.” The sentence appeared as inspectable evidence. The reviewer corrected the conflicting payment statement, refreshed and saw the correction persist. The reviewer accepted, rejected and marked claims unresolved, then approved version 1. In a second browser Neha received the permitted snapshot, completed a task with a saved note and acknowledged it. Direct restricted-source and claim requests returned 403/404. Lead history recorded the reviews and receipt, and a later draft edit did not mutate version 1.

## Tests and limitations

Seven extraction/permission unit tests and the PostgreSQL immutability test passed. Three updated local browser/API scenarios passed, including incoming code redemption, revocation and regeneration, rejected/restricted/unapproved direct-ID denial, unresolved handover inclusion, and evidence count increasing from one to two without counting human confirmation. See RELEASE_CHECKLIST.md for the migration and release handoff. Live status for the new implementation must be updated only after deployment and re-running those checks.

The app uses synthetic demo identities and signed demo access, not OAuth. Extraction uses bounded English rules unless an optional provider is configured. Deterministic topic matching is intentionally narrow and can require human correction. No extraction-accuracy claim or enterprise security certification is made. Historical evidence states are retained in claim data; prior versions and review events remain immutable.

## Final live check after pushing implementation

The updated suite against the canonical Production URL failed all three scenarios because the previous release is still served:

- Desktop and mobile: `Error: locator.fill: Test timeout of 15000ms exceeded.` Call log: `waiting for getByLabel('Reason for adding this source')`. This new required field is absent.
- Evidence refresh: `Expected: "Insufficient Evidence"; Received: "Supported"` for a single fresh source. Repeating this test with a 60-second timeout produced the same assertion failure.
- New redemption endpoint probe: HTTP 401, `{"error":"A valid workspace link is required."}`. The updated endpoint returns 403 for invalid codes instead.

For the updated eight-step run: step 1 passed; step 2 failed at the missing reason field; steps 3–8 were blocked by that failure and were not re-verified for the updated release. The baseline results above remain separate. No updated live success is claimed. GitHub main received the implementation; the GitHub combined status had no deployment statuses. Vercel production association and automatic deploy could not be confirmed.

Security checks: .env and .env.production are ignored; only blank .env.example placeholders are tracked. A pattern scan across 13 history revisions found no credentialed PostgreSQL URLs, known provider-token patterns or private-key headers. This is a scoped scan, not proof against every possible secret format. npm audit reported zero vulnerabilities.
