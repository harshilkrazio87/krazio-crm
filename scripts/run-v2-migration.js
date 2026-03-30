/**
 * Run v2 schema migration. Uses DATABASE_URL from .env.local.
 * Run once: npm run db:v2
 * Do not ask the user to run SQL manually in Supabase again.
 */
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });
const { Client } = require("pg");

const sqlPath = path.join(__dirname, "..", "supabase", "migrations", "v2.sql");

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("Missing DATABASE_URL in .env.local. Add your Supabase Postgres connection string.");
    process.exit(1);
  }
  if (!fs.existsSync(sqlPath)) {
    console.error("SQL file not found:", sqlPath);
    process.exit(1);
  }
  const sql = fs.readFileSync(sqlPath, "utf8");
  const client = new Client({ connectionString: databaseUrl });
  try {
    await client.connect();
    console.log("Running v2 migration...");
    await client.query(sql);
    console.log("v2 migration completed.");
  } catch (err) {
    console.error("Migration failed:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
