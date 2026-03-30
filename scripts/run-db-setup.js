/**
 * Run the Supabase database setup SQL from this project.
 * Requires DATABASE_URL in .env.local (postgresql://postgres:PASSWORD@db.xxx.supabase.co:5432/postgres)
 *
 * Usage: npm run db:setup
 */

const path = require("path");
const fs = require("fs");

// Load .env.local from project root
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });

const { Client } = require("pg");

const sqlPath = path.join(__dirname, "..", "supabase", "setup-database.sql");

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error(
      "Missing DATABASE_URL in .env.local.\n" +
        "Add: DATABASE_URL=postgresql://postgres:YOUR-PASSWORD@db.cmtujhakuaazsbgspxbu.supabase.co:5432/postgres\n" +
        "Get your password from: Supabase Dashboard → Project Settings → Database"
    );
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
    console.log("Connected to Supabase database. Running setup-database.sql ...");
    await client.query(sql);
    console.log("Database setup completed successfully.");
  } catch (err) {
    console.error("Database setup failed:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
