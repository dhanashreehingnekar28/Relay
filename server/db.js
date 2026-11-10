import pg from "pg";
let pool;
export function database() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is missing");
  return (pool ??= new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 3,
    connectionTimeoutMillis: 6500,
    idleTimeoutMillis: 10000,
    allowExitOnIdle: true,
  }));
}
export async function transaction(fn) {
  const client = await database().connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
export function fail(status, message) {
  throw Object.assign(new Error(message), { status });
}
export function field(value, max, optional = false) {
  if (
    typeof value !== "string" ||
    value.length > max ||
    /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(value) ||
    (!optional && !value.trim())
  )
    fail(400, "Invalid or oversized text field.");
  return value.trim();
}
