/**
 * Create the super admin user: admin@kraziocloud.com / Blackdog1?
 * Uses SUPABASE_SERVICE_ROLE_KEY if set; otherwise uses anon key signUp (may require email confirm in Dashboard).
 *
 * Usage: node scripts/create-admin-user.js
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });

const { createClient } = require("@supabase/supabase-js");
const { Client: PgClient } = require("pg");

const EMAIL = "admin@kraziocloud.com";
const PASSWORD = "Blackdog1?";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const databaseUrl = process.env.DATABASE_URL;

  if (!url || !anonKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
    process.exit(1);
  }

  let userId = null;

  if (serviceRoleKey) {
    const supabaseAdmin = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    console.log("Creating user (admin API):", EMAIL);
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: "Super Admin" },
    });
    if (error) {
      if (error.message && error.message.includes("already been registered")) {
        console.log("User already exists.");
      } else {
        console.error("Create user failed:", error.message);
        process.exit(1);
      }
    } else {
      userId = data.user?.id;
      console.log("User created:", userId);
    }
  } else {
    console.log("No SUPABASE_SERVICE_ROLE_KEY – trying signUp (anon). If login still fails, add service_role key.");
    const supabase = createClient(url, anonKey);
    const { data, error } = await supabase.auth.signUp({
      email: EMAIL,
      password: PASSWORD,
      options: { data: { full_name: "Super Admin" } },
    });
    if (error) {
      if (error.message && error.message.includes("already registered")) {
        console.log("User already exists.");
      } else {
        console.error("SignUp failed:", error.message);
        process.exit(1);
      }
    } else {
      userId = data.user?.id;
      console.log("User created (confirm email in Supabase if required):", userId);
    }
  }

  if (!databaseUrl) {
    console.log("Add DATABASE_URL to .env.local to auto-assign super_admin role.");
    console.log("\nLogin at http://localhost:3000 with:", EMAIL, "/", PASSWORD);
    return;
  }

  const pg = new PgClient({ connectionString: databaseUrl });
  await pg.connect();

  try {
    await pg.query(`
      INSERT INTO public.profiles (id, email, full_name)
      SELECT id, email, COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1))
      FROM auth.users WHERE email = $1
      ON CONFLICT (id) DO NOTHING
    `, [EMAIL]);

    const roleRes = await pg.query("SELECT id FROM public.roles WHERE slug = 'super_admin' LIMIT 1");
    const roleId = roleRes.rows[0]?.id;
    if (!roleId) {
      console.log("Roles table missing super_admin. Run npm run db:setup first.");
      await pg.end();
      return;
    }

    const updateRes = await pg.query(
      "UPDATE public.profiles SET role_id = $1, full_name = 'Super Admin' WHERE email = $2 RETURNING id",
      [roleId, EMAIL]
    );
    if (updateRes.rowCount > 0) {
      console.log("Profile updated: role set to Super Admin.");
    }
  } finally {
    await pg.end();
  }

  console.log("\nDone. Log in at http://localhost:3000 with:");
  console.log("  Email:", EMAIL);
  console.log("  Password:", PASSWORD);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
