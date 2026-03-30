const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });
const { Client } = require("pg");

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("Missing DATABASE_URL in .env.local");
    process.exit(1);
  }
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  const res = await client.query(
    "UPDATE auth.users SET email_confirmed_at = NOW(), updated_at = NOW() WHERE email = $1 RETURNING id",
    ["admin@kraziocloud.com"]
  );
  await client.end();
  if (res.rowCount > 0) {
    console.log("Email confirmed for admin@kraziocloud.com – they can log in now.");
  } else {
    console.log("No user found with that email.");
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
