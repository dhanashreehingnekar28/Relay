import test from "node:test";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import assert from "node:assert/strict";
import { randomUUID, randomBytes } from "node:crypto";
import { mkdtemp, readFile, appendFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import EmbeddedPostgres from "embedded-postgres";
import pg from "pg";
test("Database refuses edits and deletion of approved versions and audit events", async () => {
  const dir = await mkdtemp(join(tmpdir(), "relay-immutable-")),
    password = randomBytes(20).toString("hex");
  const db = new EmbeddedPostgres({
    databaseDir: dir,
    user: "relay",
    password,
    port: 55479,
    persistent: false,
    autoRehydrateSymlinks: true,
    onLog: () => {},
  });
  await db.initialise();
  await appendFile(
    join(dir, "postgresql.conf"),
    "\nunix_socket_directories=''\n",
  );
  await db.start();
  const c = new pg.Client({
    host: "127.0.0.1",
    port: 55479,
    user: "relay",
    password,
    database: "postgres",
  });
  try {
    await c.connect();
    await c.query(await readFile("schema.sql", "utf8"));
    const id = randomUUID();
    await c.query("INSERT INTO workspaces(id) VALUES($1)", [id]);
    await c.query(
      "INSERT INTO handover_versions VALUES($1,1,'incoming','{}')",
      [id],
    );
    await c.query(
      "INSERT INTO audit_log(workspace,actor,type,detail) VALUES($1,'Riya','Approved','Version 1')",
      [id],
    );
    // Simulate upgrading the existing schema, then repeat to prove idempotence.
    await c.query("ALTER TABLE workspaces DROP COLUMN invite_hash, DROP COLUMN invite_code_hash, DROP COLUMN invite_epoch");
    for (let run = 0; run < 2; run++) {
      const { stdout } = await promisify(execFile)(process.execPath, ["scripts/production-migrate.js"], {
        env: {...process.env, VERCEL_ENV: "production", DATABASE_URL: `postgres://relay:${password}@127.0.0.1:55479/postgres`, SESSION_SECRET: "local-test-secret-with-at-least-32-characters"}
      });
      assert.match(stdout, /Production migration verified/);
    }
    assert.equal((await c.query("SELECT invite_epoch FROM workspaces WHERE id=$1", [id])).rows[0].invite_epoch, 0);
    assert.equal((await c.query("SELECT count(*) FROM handover_versions WHERE workspace=$1", [id])).rows[0].count, "1");
    for (const q of [
      "UPDATE handover_versions SET snapshot='{}'",
      "DELETE FROM handover_versions",
      "UPDATE audit_log SET detail='changed'",
      "DELETE FROM audit_log",
    ])
      await assert.rejects(c.query(q), /immutable record/);
  } finally {
    await c.end();
    await db.stop();
    await rm(dir, { recursive: true, force: true });
  }
});
