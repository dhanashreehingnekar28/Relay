import { database } from "../server/db.js";

// Runs only in a Production build, before that build can receive traffic.
// Existing data and immutable triggers are not changed.
if (process.env.VERCEL_ENV === "production") {
  let client;
  try {
    if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32)
      throw Object.assign(new Error(), {code:"SESSION_SECRET_INVALID"});
    client = await database().connect();
    await client.query("BEGIN");
    await client.query("SET LOCAL lock_timeout = '10s'");
    await client.query("SELECT pg_advisory_xact_lock(724091)");
    await client.query("ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS invite_hash text");
    await client.query("ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS invite_code_hash text");
    await client.query("ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS invite_epoch int NOT NULL DEFAULT 0");
    const {rows} = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
    const required = ["workspaces","users","source_records","claims","evidence_links","review_actions","handover_versions","tasks","acknowledgements","audit_log","rate_limits"];
    if (!required.every(name => rows.some(r => r.table_name === name)))
      throw Object.assign(new Error(), {code:"SCHEMA_INCOMPLETE"});
    await client.query("COMMIT");
    const url = new URL(process.env.DATABASE_URL);
    console.log("Production migration verified: 11 required tables, 3 invitation columns; existing rows preserved.");
    console.log("Database provider:", url.hostname.endsWith(".neon.tech") ? "Neon" : "PostgreSQL", "TLS requested:", ["require","verify-full","verify-ca"].includes(url.searchParams.get("sslmode")));
  } catch (error) {
    if (client) await client.query("ROLLBACK").catch(() => {});
    console.error("Production migration failed; deployment must not be promoted. Error code:", error.code || "CONFIGURATION_OR_CONNECTION_ERROR");
    process.exitCode = 1;
  } finally {
    client?.release();
    if (process.env.DATABASE_URL) await database().end();
  }
} else {
  console.log("Production migration skipped outside Production.");
}
