import { test, expect, type Page } from "@playwright/test";
async function sources(page: Page, all = true) {
  await page.goto("/#/sources");
  const buttons = page.getByRole("button", {
    name: "Connect Demo Source",
    exact: true,
  });
  if (all) {
    for (let i = 0; i < 4; i++) {
      await buttons.first().click();
      await expect(page.getByText("Simulating connection…")).toHaveCount(0);
    }
  } else {
    await buttons.first().click();
    await expect(page.getByText("Simulating connection…")).toHaveCount(0);
  }
}
async function run(page: Page) {
  await page.goto("/#/reconstruct");
  await page
    .getByRole("button", { name: "Reconstruct Project Knowledge", exact: true })
    .click();
  await expect(page).toHaveURL(/knowledge/);
}
async function review(
  page: Page,
  id: string,
  decision: string,
  statement?: string,
  owner?: string,
) {
  const card = page
    .locator(".review-card")
    .filter({ has: page.getByText(new RegExp(`· ${id}$`)) });
  await card.getByRole("button", { name: "Review / edit" }).click();
  const dialog = page.getByRole("dialog");
  if (statement) await dialog.getByLabel("Claim statement").fill(statement);
  if (owner)
    await dialog.getByLabel("Owner", { exact: true }).selectOption(owner);
  await dialog.getByLabel("Review decision").selectOption(decision);
  await dialog
    .getByLabel("Review reason / notes")
    .fill(`Reviewed ${id} against synthetic records.`);
  if (statement)
    await dialog
      .getByLabel(/Verification outcome/)
      .fill("Confirmed by Riya in this simulated review.");
  await dialog.getByRole("button", { name: "Save review" }).click();
  await expect(dialog).toHaveCount(0);
}
async function approve(page: Page) {
  await page.getByLabel("Target audience").selectOption("incoming");
  await page.getByLabel("I confirm the included information").check();
  await page
    .getByRole("button", { name: "Approve Handover", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirm approval", exact: true })
    .click();
  await expect(page).toHaveURL(/handover/);
}
test("complete handover journey, permissions, persistence, versions and reset", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Keep the context. Move forward." }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/overview-desktop.png",
    fullPage: true,
  });
  await sources(page);
  await expect(
    page.locator(".source-card").filter({ hasText: "Connected" }),
  ).toHaveCount(4);
  await page
    .locator(".source-card")
    .filter({ hasText: "Team Communication" })
    .getByRole("button", { name: "Inspect records" })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("link")
    .filter({ hasText: "Lead-only · Vendor contingency" })
    .click();
  await expect(
    page.getByText("Lead-only · Vendor contingency", { exact: true }),
  ).toBeVisible();
  await expect(page.locator("mark")).toContainText("₹18,000");
  await run(page);
  await expect(page.locator(".knowledge-card")).toHaveCount(10);
  await page.goto("/#/evidence/payment");
  await expect(page.locator(".inspector")).toContainText("Conflicting");
  await page
    .locator(".inspector")
    .getByRole("link")
    .filter({ hasText: "Issue #34" })
    .click();
  await expect(page.locator("mark")).toContainText("Status: open");
  await page.goto("/#/review");
  await expect(
    page.getByRole("button", { name: "Approve Handover", exact: true }),
  ).toBeDisabled();
  await review(
    page,
    "payment",
    "Accepted",
    "Payment API integration remains blocked pending confirmation of the staging fix.",
    "Neha",
  );
  await page.reload();
  await expect(
    page
      .locator(".review-card")
      .filter({ hasText: "Payment API integration remains blocked" }),
  ).toContainText("Owner: Neha");
  await review(page, "retry", "Rejected");
  for (const id of [
    "architecture",
    "oauth",
    "access",
    "security",
    "budget",
    "audit",
  ])
    await review(page, id, "Accepted");
  await review(page, "question", "Unresolved");
  await page.goto("/#/gaps");
  await page
    .locator(".knowledge-card")
    .filter({ hasText: "Cron job ownership needs a successor" })
    .getByRole("button", { name: "Inspect / resolve" })
    .click();
  await page
    .getByLabel("Claim statement")
    .fill("Neha owns the nightly digest cron job.");
  await page.getByLabel("Owner", { exact: true }).selectOption("Neha");
  await page
    .getByLabel("Review reason / notes")
    .fill("Neha confirmed ownership.");
  await page
    .getByLabel(/Verification outcome/)
    .fill("Ownership confirmed in the simulated handover review.");
  await page.getByRole("button", { name: "Save review" }).click();
  await page.getByLabel("Gap status").selectOption("Resolved");
  await expect(page.locator(".knowledge-card")).toHaveCount(1);
  await page.goto("/#/review");
  await approve(page);
  await expect(page.locator(".knowledge-card")).toHaveCount(7);
  await expect(page.locator("main")).not.toContainText("₹18,000");
  await expect(page.locator("main")).not.toContainText(
    "Validate the payment retry branch",
  );
  await page
    .getByRole("button", { name: "View as incoming developer" })
    .click();
  await page
    .locator(".knowledge-card")
    .filter({ hasText: "Payment API integration remains blocked" })
    .getByRole("button", { name: /Inspect evidence/ })
    .click();
  await expect(page.getByRole("dialog")).toContainText("Reviewer resolution");
  await page.getByRole("button", { name: "Close dialog" }).click();
  for (const path of ["/record/CH-R1", "/record/CH-R2"]) {
    await page.goto("/#" + path);
    await expect(
      page.getByRole("heading", { name: "Record unavailable" }),
    ).toBeVisible();
    await expect(page.locator("body")).not.toContainText("₹18,000");
  }
  for (const path of ["/review", "/evidence/budget", "/history", "/sources"]) {
    await page.goto("/#" + path);
    await expect(page).toHaveURL(/handover/);
    await expect(page.locator("main")).not.toContainText("Vendor contingency");
  }
  await page.goto("/#/plan");
  const task = page.locator(".plan-task").first();
  await task.locator("summary").click();
  await task.getByLabel("Personal notes").fill("Architecture understood.");
  await task.getByLabel("Mark task complete").check();
  await expect(
    page.getByRole("heading", { name: "1 of 7 tasks complete" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "1 of 7 tasks complete" }),
  ).toBeVisible();
  await task.locator("summary").click();
  await expect(task.getByLabel("Personal notes")).toHaveValue(
    "Architecture understood.",
  );
  await page.goto("/#/handover");
  await page
    .getByRole("button", { name: "Acknowledge receipt", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirm receipt", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Receipt acknowledged" }),
  ).toBeDisabled();
  await page.screenshot({
    path: "test-results/handover-desktop.png",
    fullPage: true,
  });
  await page.getByLabel("Demo role").selectOption("reviewer");
  await page.goto("/#/review");
  await review(
    page,
    "architecture",
    "Accepted",
    "API module boundaries reviewed for incoming development.",
  );
  await approve(page);
  await page.goto("/#/history");
  await expect(page.locator(".version-card")).toHaveCount(2);
  await page.getByLabel("Base version").selectOption("1");
  await page.getByLabel("Target version").selectOption("2");
  await expect(page.locator(".added")).toContainText(
    "API module boundaries reviewed",
  );
  await page.locator(".version-card").first().click();
  await expect(page.getByRole("dialog")).toContainText(
    "API modules separate authentication",
  );
  await expect(page.getByRole("dialog")).not.toContainText(
    "API module boundaries reviewed",
  );
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.getByLabel("Current project").selectOption("practice");
  await expect(page.locator(".stat").first()).toContainText("0");
  await page.getByLabel("Current project").selectOption("campus");
  await expect(page.locator(".stat").first()).toContainText("4");
  await page.getByRole("button", { name: "Reset Demo", exact: true }).click();
  await page.getByRole("button", { name: "Reset everything" }).click();
  await expect(page.locator(".stat").first()).toContainText("0");
  await page.goto("/#/handover");
  await expect(
    page.getByRole("heading", { name: "Your handover isn’t ready yet." }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("partial sources, filters, stale drafts, navigation and mobile", async ({
  page,
}) => {
  await sources(page, false);
  await run(page);
  await expect(page.locator(".knowledge-card")).toHaveCount(5);
  await page.getByLabel("Search claims").fill("OAuth");
  await expect(page.locator(".knowledge-card")).toHaveCount(0);
  await page.getByLabel("Search claims").fill("");
  await page.getByLabel("Category filter").selectOption("Ownership");
  await expect(page.locator(".knowledge-card")).toHaveCount(1);
  await expect(page.locator(".knowledge-card")).toContainText("Unassigned");
  await page.getByLabel("Category filter").selectOption("All categories");
  await page.getByLabel("Evidence filter").selectOption("Conflicting");
  await expect(page.locator(".knowledge-card")).toHaveCount(0);
  await page.goto("/#/sources");
  await page
    .locator(".source-card")
    .filter({ hasText: "Team Communication" })
    .getByRole("button", { name: "Connect Demo Source" })
    .click();
  await expect(page.getByText("Simulating connection…")).toHaveCount(0);
  await page.goto("/#/review");
  await expect(
    page.getByText("Sources changed. Reconstruct before approval."),
  ).toBeVisible();
  await page.goto("/#/reconstruct");
  await page
    .getByRole("button", { name: "Reconstruct Project Knowledge" })
    .click();
  await page
    .getByRole("button", { name: "Reconstruct draft", exact: true })
    .click();
  await expect(page).toHaveURL(/knowledge/);
  await page.getByLabel("Evidence filter").selectOption("Conflicting");
  await expect(page.locator(".knowledge-card")).toHaveCount(1);
  await page.goto("/");
  await page.getByRole("button", { name: "Guided Demo", exact: true }).click();
  await expect(page.getByRole("region", { name: "Guided demo" })).toBeVisible();
  await page.getByRole("button", { name: "Explore Freely" }).click();
  for (const route of [
    "projects",
    "sources",
    "reconstruct",
    "knowledge",
    "evidence",
    "gaps",
    "review",
    "handover",
    "plan",
    "history",
  ]) {
    await page.goto("/#/" + route);
    await expect(page.locator("main h1")).toHaveCount(1);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.screenshot({
    path: "test-results/overview-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Data Sources", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Bring the context together." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test("corrupt or unavailable local storage recovers without breaking the demo", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() =>
    localStorage.setItem("relay-concept-v1", "{broken"),
  );
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Keep the context. Move forward." }),
  ).toBeVisible();
  await page.addInitScript(() => {
    Storage.prototype.setItem = function () {
      throw new Error("Storage blocked");
    };
  });
  await page.reload();
  await expect(
    page.getByText("Browser storage is unavailable.", { exact: false }),
  ).toBeVisible();
  await sources(page, false);
  await expect(page.locator(".source-card").first()).toContainText(
    "5 authorized records",
  );
});
