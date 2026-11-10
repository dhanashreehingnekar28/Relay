# Release handoff

Production: https://relay2-rho.vercel.app/

UPDATE: The new release is deployed and passed the complete live workflow. The production build has already run the additive migration successfully. The remaining dashboard action is reconnecting Git for future automatic deployments. Steps below remain an operational reference.

## 1. Migrate the existing Neon database
In Neon select project late-cloud-34503087, branch br-square-paper-bcw4qo4e, and the database used by Vercel DATABASE_URL. Open SQL Editor and run:

```sql
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS invite_hash text;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS invite_code_hash text;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS invite_epoch int NOT NULL DEFAULT 0;
```

Alternatively, set DATABASE_URL privately in the ignored local .env and run `npm run migrate`. Do not paste credentials into chat or commit .env. Existing incoming links must be regenerated after this release.

## 2. Deploy the pushed main branch
In Vercel, open dev407 / relay2 / Settings / Git. Check that the connected repository is dhanashreehingnekar28/Relay and the Production branch is main. Changes were pushed to that repository; a project linked to another repository will not receive them.

Open Deployments. Check the latest main commit against `git log -1 --oneline`. Wait for Ready and confirm the deployment is Production. If necessary choose Redeploy after migrating and saving environment variables. Under Settings / Domains, assign relay2-rho.vercel.app to this project. Under Settings / Deployment Protection, turn protection off for Production and save. Open the canonical URL in a private window; it must not require Vercel sign-in.

The Bhakti connection now grants access to dev407. The release was deployed through that connection and migrated inside the Production build, keeping credentials private. The dashboard still requires owner sign-in to change the persistent Git repository link.

## 3. Run updated acceptance automatically
From the repository in PowerShell:

```powershell
git pull --ff-only origin main
npm ci
$env:RELAY_TEST_URL = "https://relay2-rho.vercel.app/"
npm run test:e2e
Remove-Item Env:RELAY_TEST_URL
```

On Windows the tests use installed Microsoft Edge. On other platforms first run `npx playwright install chromium`. Tests create isolated synthetic workspaces. The suite also tests source aggregation, reviewer confirmation, code redemption and revocation.

## 4. Manual eight-step private-window checklist
1. Open Production signed out. Click Try CampusConnect. Verify five synthetic source records and a fresh workspace.
2. Data Sources: paste `Kabir will own the nightly digest cron job after Aarav leaves.` Enter reason `Confirm ownership from the meeting note.` Click Import note. Verify the new source card.
3. Reconstruction: click Reconstruct Project Knowledge. Open the Kabir candidate and verify the exact sentence appears as evidence. The older Aarav source may correctly cause an ownership conflict.
4. Open payment evidence. Check both the open issue and staging chat. Review/edit statement: `Payment remains blocked until staging validation.` Reason: `The staging update does not establish that validation is complete.` Mark Unresolved; save and refresh. Verify it persists.
5. Review every remaining claim. For uncertain claims choose Unresolved, reason `The available sources do not establish this claim; the incoming member must verify it.` Reject an unwanted claim with reason `Exclude this claim from the incoming handover.` Accept supported claims only after checking citations. To demonstrate human confirmation, select Confirm with reason and enter `Demo reviewer confirmation: checked the supplied source and recorded this decision.` This is a simulated human decision, not new source evidence. Choose Neha, check the audience box, Approve Handover, Confirm approval. Verify version 1.
6. Share with Neha. Copy link and code into a separate private window. Enter the code. Verify Incoming Developer role, unresolved labels, and absence of rejected and lead-only material. Automated tests cover direct-ID denial. Regenerate/revoke invalidates previous access; test this after step 8 or generate another link.
7. In Neha's First-week Plan enter note `Reviewed the linked source; outstanding checks are recorded.` Leave the field to save, complete a task, refresh, verify persistence, then acknowledge receipt.
8. Return to the lead and refresh Activity History. Verify review, approval and acknowledgement. Make a later draft edit and confirm version 1 remains unchanged.

Record pass/fail and the exact displayed error for each step. Do not describe the updated release as live until this run passes. If approval is disabled, review all candidates and either record a genuine reviewer confirmation or mark uncertain claims Unresolved; an Accepted label alone does not resolve an evidence concern.

## Source delivery and Git fallback
Implementation commits have already been pushed to main. Normally use the git pull command above; do not duplicate those commits. A complete tracked-source ZIP and a patch are also supplied beside the local repository. If you must apply the source to a different clean checkout instead, review changes and run:

```powershell
git add server src schema.sql scripts tests playwright.config.ts index.html README.md BUILD_REPORT.md FORM_ANSWERS.md RELEASE_CHECKLIST.md
git commit -m "Implement reviewed evidence and revocable Neha handover access"
git push origin main
```

Use these fallback commands only when the changes are not already on that checkout. Then perform the migration and Vercel steps above.
