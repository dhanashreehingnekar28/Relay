# DEV404 · Round 2 form draft
Verification basis: local production build connected to PostgreSQL, with a fresh reviewer session and a separate incoming browser session. Recheck each line against the public domain before declaring it live.

## Completed features — one per line
Create an isolated CampusConnect workspace with synthetic source records.  
Paste a meeting note or upload a Markdown file and import it into the workspace.  
Extract ownership information from a new note and display its verified source quotation.  
Show the conflict between an open payment issue and a staging chat update.  
Edit a claim and record acceptance, rejection, or unresolved status with a reason.  
Publish a version for Neha and preserve its contents after subsequent draft edits.  
Open a separate incoming-member link that excludes restricted records and rejected claims.  
Complete a first-week task, save its note, and acknowledge receipt.  
Inspect review activity, version history and acknowledgement in the lead workspace.

## Technology and implementation
We extended the existing React, TypeScript and Vite application, using a Node API written for Vercel and PostgreSQL for durable state. We exercised the deterministic extractor on a new meeting note. Each candidate carries a source ID, verified quote and extractor label. The server checks role and workspace using signed access tokens. The incoming view reads the approved snapshot. Tests exercised direct API denial and database enforcement of version immutability.

## Changes from Round 1 and why
We kept the original review and handover screens. We replaced scripted extraction and browser-only state with note ingestion, verified extraction and database-backed approval. A single web deployment replaces the proposed FastAPI and pgvector services to reduce integration work. Signed anonymous links let judges exercise both roles without personal accounts. We narrowed source ingestion to the sample corpus and user notes.

## Known limits
External GitHub, task-board and chat synchronisation are outside this build. Rule extraction covers a limited set of English patterns. Signed links provide simplified access. Live model-provider calls were not verified. At report time the public Round 2 deployment and hosted Neon connection had not passed a signed-out acceptance test. Update this deployment statement only after a successful public run.
