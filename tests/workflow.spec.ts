import { test, expect } from "@playwright/test";
const note = "Kabir will own the nightly digest cron job after Aarav leaves.";
test("CampusConnect • eight-step signed-out handover and direct API permissions", async ({
  page,
  browser,
  baseURL,
}) => {
  const capture = async (p: typeof page, name: string) => {
    if (!process.env.RELAY_TEST_URL) {
      await p
        .locator(
          name === "evidence" ? ".inspector .explanation" : ".handover-banner",
        )
        .evaluate((el) => el.scrollIntoView({ block: "start" }));
      await p.screenshot({ path: "test-results/screens/" + name + ".png" });
    }
  };
  const b = (name: string) => page.getByRole("button", { name, exact: true });
  const go = async (path: string) => {
    await page.goto("/#/" + path);
  };
  const token = () =>
    page.evaluate(() => sessionStorage.getItem("relay-session-v2")!);
  await page.goto("/");
  await b("Try CampusConnect").click();
  await expect(
    page.getByText(
      "Synthetic sample workspace. Your notes stay in this workspace only.",
    ),
  ).toBeVisible();
  await go("sources");
  await page.getByLabel("Meeting note", { exact: true }).fill(note);
  await page
    .getByLabel("Reason for adding this source")
    .fill("Confirm project ownership from a new source.");
  await b("Import note").click();
  await expect(
    page.getByRole("heading", { name: "Imported meeting note" }),
  ).toBeVisible();
  await go("reconstruct");
  await b("Reconstruct Project Knowledge").click();
  await expect(page).toHaveURL(/knowledge/);
  await page
    .locator(".knowledge-card")
    .filter({ hasText: note })
    .first()
    .click();
  await expect(page.locator(".inspector")).toContainText(note);
  await go("evidence/payment");
  await expect(page.locator(".inspector")).toContainText("Conflicting");
  await expect(page.locator(".inspector")).toContainText("Issue #34");
  await expect(page.locator(".inspector")).toContainText("staging is fixed");
  await capture(page, "evidence");
  await go("review");
  const card = (id: string) =>
    page
      .locator(".review-card")
      .filter({ has: page.getByText(new RegExp("· " + id + "$")) });
  const correction = "Payment remains blocked until staging validation.";
  async function decide(id: string, decision: string, statement?: string) {
    await card(id).getByRole("button", { name: "Review / edit" }).click();
    const dialog = page.getByRole("dialog");
    if (statement) await dialog.getByLabel("Claim statement").fill(statement);
    await dialog.getByLabel("Review decision").selectOption(decision);
    await dialog
      .getByLabel("Review reason / notes")
      .fill("Reviewed the cited source for " + id + ".");
    await dialog
      .getByLabel(/Verification outcome/)
      .fill("Verified the evidence and recorded the outstanding checks.");
    await dialog.getByRole("button", { name: "Save review" }).click();
    await expect(dialog).toHaveCount(0);
  }
  await decide("payment", "Accepted", correction);
  await page.reload();
  await expect(card("payment")).toContainText(correction);
  const leadToken = await token();
  const auth = { Authorization: "Bearer " + leadToken };
  const api = page.request;
  const get = async (path: string, headers = auth) =>
    await api.get("/api/" + path, { headers });
  const claims = await (await get("claims")).json();
  const rejected = claims.find((c: any) => c.category === "Decisions");
  const restricted = claims.find((c: any) => c.restricted);
  for (const c of claims.filter((c: any) => c.id !== "payment"))
    await decide(
      c.id,
      c.id === rejected.id
        ? "Rejected"
        : c.id === "cron"
          ? "Unresolved"
          : "Accepted",
    );
  await page.getByLabel("Target audience").selectOption("incoming");
  await page.getByLabel("I confirm the included information").check();
  await b("Approve Handover").click();
  await b("Confirm approval").click();
  await expect(page).toHaveURL(/handover/);
  const original = await (await get("handover")).json();
  expect(original.id).toBe(1);
  await b("Share with Neha").click();
  const code = await page
    .locator("p")
    .filter({ hasText: "Access code:" })
    .locator("strong")
    .innerText();
  const link = await page.getByLabel("Neha’s access link").inputValue();
  const other = await browser.newContext({ baseURL });
  const neha = await other.newPage();
  await neha.goto(link);
  await neha.getByLabel("Access code").fill(code);
  await neha
    .getByRole("button", { name: "Open handover", exact: true })
    .click();
  await expect(neha.locator(".handover-banner")).toContainText("Aarav → Neha");
  await expect(neha.locator("main")).toContainText(correction);
  await expect(neha.locator("main")).toContainText(note);
  await expect(neha.locator("body")).not.toContainText("Vendor contingency");
  await capture(neha, "handover");
  const incoming = {
    Authorization:
      "Bearer " +
      (await neha.evaluate(() => sessionStorage.getItem("relay-session-v2"))),
  };
  for (const path of [
    "sources/CH-R1",
    "claims/" + restricted.id,
    "claims/" + rejected.id,
    "audit",
  ])
    expect([403, 404]).toContain((await get(path, incoming)).status());
  expect(
    (
      await api.patch("/api/claims/payment", {
        headers: incoming,
        data: { review: "Accepted" },
      })
    ).status(),
  ).toBe(403);
  expect(
    (await get("state", { Authorization: "Bearer invalid" })).status(),
  ).toBe(401);
  await neha.goto("/#/plan");
  const task = neha.locator(".plan-task").first();
  await task.locator("summary").click();
  await task.getByLabel("Personal notes").fill("Checked the linked evidence.");
  await task.getByLabel("Personal notes").blur();
  await expect(neha.getByText("Saving…", { exact: true })).toHaveCount(0);
  await task.getByLabel("Mark task complete").check();
  await expect(neha.locator(".progress-panel")).toContainText("1 of");
  await neha.reload();
  await expect(neha.locator(".progress-panel")).toContainText("1 of");
  await task.locator("summary").click();
  await expect(task.getByLabel("Personal notes")).toHaveValue(
    "Checked the linked evidence.",
  );
  await neha.goto("/#/handover");
  await neha.getByRole("button", { name: "Acknowledge receipt" }).click();
  await neha.getByRole("button", { name: "Confirm receipt" }).click();
  await expect(
    neha.getByRole("button", { name: "Receipt acknowledged" }),
  ).toBeVisible();
  await capture(neha, "receipt");
  await go("history");
  await page.reload();
  await expect(page.locator("main")).toContainText(
    "Neha acknowledged version 1",
  );
  await expect(
    page.locator(".history-event").filter({ hasText: "Review" }).count(),
  ).resolves.toBeGreaterThanOrEqual(claims.length);
  await page.locator(".version-card").first().click();
  await expect(page.getByRole("dialog")).toContainText(correction);
  await page.getByRole("button", { name: "Close dialog" }).click();
  await go("review");
  await decide("payment", "Accepted", "A later draft revision.");
  expect((await (await get("handover")).json()).claims).toEqual(
    original.claims,
  );
  const fresh = await api.post("/api/workspaces", { data: {} });
  const second = { Authorization: "Bearer " + (await fresh.json()).token };
  expect(await (await get("claims", second)).json()).toEqual([]);
  expect(
    (
      await get(
        "sources/" +
          claims
            .find((c: any) => c.owner === "Kabir")
            .refs.find((id: string) => id.length === 36),
        second,
      )
    ).status(),
  ).toBe(404);
  const extra = await api.post("/api/sources", {
    headers: auth,
    data: {
      title: "Later draft",
      reason: "New draft context",
      text: "Isha owns the new build checklist.",
      visibility: "all",
    },
  });
  expect(extra.status()).toBe(200);
  expect(
    (await api.post("/api/reconstruct", { headers: auth, data: {} })).status(),
  ).toBe(200);
  const pending = (await (await get("claims")).json()).find(
    (c: any) => c.owner === "Isha",
  );
  expect(pending.review).toBe("Pending Review");
  expect((await get("claims/" + pending.id, incoming)).status()).toBe(404);
  expect((await get("sources/" + pending.refs[0], incoming)).status()).toBe(
    404,
  );
  expect(
    (
      await api.patch("/api/claims/" + pending.id, {
        headers: auth,
        data: { ...pending, review: "Accepted", note: "  " },
      })
    ).status(),
  ).toBe(400);
  await expect(neha.locator("body")).not.toContainText("Vendor contingency");
  expect(original.claims.find((c: any) => c.id === "cron").review).toBe(
    "Unresolved",
  );
  const regenerated = await api.post("/api/invite", {
    headers: auth,
    data: {},
  });
  expect(regenerated.status()).toBe(200);
  expect((await get("state", incoming)).status()).toBe(403);
  const freshInvite = await regenerated.json();
  const redeemed = await api.post("/api/redeem", { data: freshInvite });
  expect(redeemed.status()).toBe(200);
  const newIncoming = {
    Authorization: "Bearer " + (await redeemed.json()).token,
  };
  await api.post("/api/revoke", { headers: auth, data: {} });
  expect((await get("state", newIncoming)).status()).toBe(403);
  expect((await api.post("/api/redeem", { data: freshInvite })).status()).toBe(
    403,
  );
  await other.close();
});

test("Mobile note upload and direct access before approval", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Try CampusConnect" }).click();
  await expect(
    page.getByRole("button", { name: "Open navigation" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("link", { name: "Data Sources", exact: true }).click();
  const text = "Meera will own the transfer checklist.";
  await page.getByLabel("Upload text or Markdown").setInputFiles({
    name: "handover.md",
    mimeType: "text/markdown",
    buffer: Buffer.from(text),
  });
  await page
    .getByLabel("Reason for adding this source")
    .fill("Imported supporting source.");
  await page.getByRole("button", { name: "Import note" }).click();
  await expect(
    page.getByRole("heading", { name: "handover.md" }),
  ).toBeVisible();
  const headers = {
    Authorization:
      "Bearer " +
      (await page.evaluate(() => sessionStorage.getItem("relay-session-v2"))),
  };
  const res = await page.request.post("/api/invite", { headers, data: {} });
  expect(res.status()).toBe(409);
  const missing = await page.request.get("/api/state");
  expect(missing.status()).toBe(401);
  await page.getByRole("link", { name: "Next: reconstruct" }).click();
  await page
    .getByRole("button", { name: "Reconstruct Project Knowledge" })
    .click();
  await expect(
    page.locator(".knowledge-card").filter({ hasText: text }),
  ).toBeVisible();
});

test("Evidence refresh preserves human confirmation without counting it as evidence", async ({
  request,
}) => {
  const start = await request.post("/api/workspaces", { data: {} });
  const headers = { Authorization: "Bearer " + (await start.json()).token };
  const add = async (text: string) =>
    request.post("/api/sources", {
      headers,
      data: {
        text,
        title: "Ownership confirmation",
        reason: "Confirm transfer",
        visibility: "all",
      },
    });
  const claims = async () =>
    (await request.get("/api/claims", { headers })).json();
  await add("Lena owns the transfer checklist.");
  await request.post("/api/reconstruct", { headers, data: {} });
  const first = (await claims()).find((c: any) => c.owner === "Lena");
  expect(first.refs).toHaveLength(1);
  expect(first.evidence).toBe("Insufficient Evidence");
  await request.patch("/api/claims/" + first.id, {
    headers,
    data: {
      ...first,
      review: "Accepted",
      note: "Human checked ownership",
      resolution: "Reviewer confirmed",
    },
  });
  const confirmed = (await claims()).find((c: any) => c.id === first.id);
  expect(confirmed.evidence).toBe("Insufficient Evidence");
  expect(confirmed.refs).toHaveLength(1);
  await add("Lena confirmed she will own the transfer checklist.");
  await request.post("/api/reconstruct", { headers, data: {} });
  const revised = (await claims()).find((c: any) => c.id === first.id);
  expect(revised.refs).toHaveLength(2);
  expect(revised.evidence).toBe("Supported");
  expect(revised.resolution).toBe("Reviewer confirmed");
  expect(revised.evidenceHistory.length).toBeGreaterThan(0);
});
