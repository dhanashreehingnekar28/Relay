import test from "node:test";
import assert from "node:assert/strict";
import { verified, uncertainty, extract } from "./extract.js";
import { permitted } from "./workflow.js";
import { issue, verify } from "./session.js";
import { samples } from "./seed.js";
test("Exact quotes allow only whitespace differences", () => {
  assert.ok(verified({ text: "one\n two" }, "one two"));
  assert.equal(verified({ text: "issue open" }, "issue closed"), false);
  assert.equal(verified({ text: "anything" }, " "), false);
});
test("Contradictions outrank stale and low authority", () => {
  const fresh = { recorded_at: new Date(), type: "notes" };
  assert.equal(uncertainty([fresh], false), "Insufficient Evidence");
  assert.equal(
    uncertainty([{ ...fresh, type: "chat" }], false),
    "Insufficient Evidence",
  );
  assert.equal(
    uncertainty([{ ...fresh, recorded_at: "2000-01-01" }], false),
    "Insufficient Evidence",
  );
  assert.equal(uncertainty([fresh], true), "Conflicting");
});
test("Only reviewed, permitted claims can be published", () => {
  for (const review of ["Rejected", "Pending Review"])
    assert.equal(permitted({ review }), false);
  assert.equal(permitted({ review: "Accepted", restricted: true }), false);
  assert.ok(permitted({ review: "Unresolved" }));
});
test("Role signatures reject tampering", () => {
  process.env.SESSION_SECRET = "x".repeat(32);
  const token = issue("workspace", "incoming");
  assert.equal(verify("Bearer " + token).role, "incoming");
  assert.throws(() => verify(token + "x"));
});
test("Arbitrary owner and conflicting source states are grounded", async () => {
  delete process.env.LLM_API_KEY;
  const rs = samples.map(([id, title, type, author, text, visibility]) => ({
    id,
    type,
    text,
    visibility,
    recorded_at: new Date(),
  }));
  rs.push({
    id: "custom",
    type: "notes",
    text: "Savita will own the nightly digest.",
    visibility: "all",
    recorded_at: new Date(),
  });
  const { claims } = await extract(rs);
  assert.equal(claims.find((c) => c.id === "payment").evidence, "Conflicting");
  assert.equal(
    claims.find((c) => c.owner === "Savita").quotes.custom,
    rs.at(-1).text,
  );
});
test("Provider cannot cite unseen records or use a fabricated quotation", async () => {
  const original = globalThis.fetch;
  process.env.LLM_API_KEY = "test";
  process.env.LLM_PROVIDER = "groq";
  globalThis.fetch = async () =>
    Response.json({
      choices: [
        {
          message: {
            content: JSON.stringify({
              claims: [
                { source: "secret", excerpt: "fake", type: "Risks" },
                { source: "a", excerpt: "invented", type: "Risks" },
              ],
            }),
          },
        },
      ],
    });
  try {
    const result = await extract([
      { id: "a", text: "Safe source.", visibility: "all" },
    ]);
    assert.equal(result.claims.length, 0);
    assert.deepEqual(
      result.warnings,
      Array(2).fill("rejected: unverifiable citation"),
    );
  } finally {
    globalThis.fetch = original;
    delete process.env.LLM_API_KEY;
  }
});

test("Matching ownership notes accumulate evidence without crossing access scopes", async () => {
 const r=(id,text,visibility="all")=>({id,text,visibility,type:"notes",recorded_at:new Date()});
 const first=r("one","Neha owns the nightly digest cron job.");
 const match=r("two","Neha confirmed she will own the nightly digest cron job after Aarav leaves.");
 const a=await extract([first]); assert.equal(a.claims[0].evidence,"Insufficient Evidence");
 const b=await extract([first,match]); assert.equal(b.claims.length,1);assert.equal(b.claims[0].refs.length,2);assert.equal(b.claims[0].evidence,"Supported");
 const unrelated=await extract([first,r("other","We decided to defer OAuth.")]);assert.equal(unrelated.claims.find(c=>c.owner==="Neha").refs.length,1);
 const conflict=await extract([first,r("three","Kabir owns the nightly digest cron job.")]);assert.equal(conflict.claims[0].evidence,"Conflicting");
 const restricted=await extract([first,{...match,visibility:"lead_only"}]);assert.equal(restricted.claims.find(c=>!c.restricted).refs.length,1);
});
