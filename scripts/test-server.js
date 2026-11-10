import EmbeddedPostgres from "embedded-postgres";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import { serve } from "./serve.js";
import { database } from "../server/db.js";
const dir = await mkdtemp(join(tmpdir(), "relay-pg-"));
const password = randomBytes(24).toString("hex");
const db = new EmbeddedPostgres({
  databaseDir: dir,
  user: "relay",
  password,
  port: 55478,
  persistent: false,
  autoRehydrateSymlinks: true,
  onLog: console.log,
  onError: console.error,
});
await db.initialise();
await (
  await import("node:fs/promises")
).appendFile(join(dir, "postgresql.conf"), "\nunix_socket_directories=''\n");
await db.start();
process.env.DATABASE_URL =
  "postgres://relay:" + password + "@127.0.0.1:55478/postgres";
process.env.SESSION_SECRET = randomBytes(36).toString("hex");
delete process.env.LLM_API_KEY;
await database().query(await readFile("schema.sql", "utf8"));
const app = serve();
process.on("SIGTERM", async () => {
  app.close();
  await database().end();
  await db.stop();
  await rm(dir, { recursive: true, force: true });
  process.exit();
});
