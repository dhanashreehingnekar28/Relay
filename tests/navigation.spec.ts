import { test, expect } from "@playwright/test";

test("Production navigation, refresh and browser health", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", e => errors.push(e.message));
  page.on("console", m => { if (m.type() === "error") errors.push(m.text() + " " + (m.location().url ? new URL(m.location().url).pathname : "")); });
  page.on("response", r => { if (r.status() >= 400) errors.push(`${r.status()} ${new URL(r.url()).pathname}`); });
  page.on("requestfailed", r => { if (r.failure()?.errorText !== "net::ERR_ABORTED") errors.push(`${new URL(r.url()).pathname}: ${r.failure()?.errorText}`); });
  await page.goto("/");
  await page.getByRole("button", { name: "Try CampusConnect", exact: true }).click();
  await expect(page.getByText("Viewing as Team Lead, Riya")).toBeVisible();
  for (const name of ["Overview", "Projects", "Data Sources", "Reconstruction", "Project Knowledge", "Evidence Explorer", "Knowledge Gap Radar", "Review & Approval", "Handover", "First-week Plan", "Activity History"]) {
    await page.getByRole("link", { name, exact: true }).click();
    await expect(page.locator("h1")).toBeVisible();
    await page.reload();
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.getByText("Viewing as Team Lead, Riya")).toBeVisible();
  }
  await page.screenshot({path:"test-results/production-desktop.png", fullPage:true});
  await page.setViewportSize({width:390,height:844});
  await expect(page.getByRole("button", {name:"Open navigation"})).toBeVisible();
  await page.getByRole("button", {name:"Open navigation"}).click();
  await page.getByRole("link", {name:"Data Sources",exact:true}).click();
  await expect(page.getByLabel("Meeting note",{exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({path:"test-results/production-mobile.png",fullPage:true});
  expect(errors).toEqual([]);
});
