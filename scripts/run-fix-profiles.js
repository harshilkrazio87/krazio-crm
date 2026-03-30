/**
 * Run fix-missing-profiles.sql (backfill profiles for existing users + ensure_profile_for_user function).
 * Requires DATABASE_URL in .env.local.
 * Usage: npm run db:fix-profiles
 */

const path = require("path");
const fs = require("fs");

require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });

const { Client } = require("pg");

const sqlPath = path.join(__dirname, "..", "supabase", "fix-missing-profiles.sql");

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("Missing DATABASE_URL in .env.local");
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
    console.log("Running fix-missing-profiles.sql ...");
    await client.query(sql);
    console.log("Done. Profiles created for existing users; ensure_profile_for_user() is ready.");
  } catch (err) {
    console.error("Failed:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
