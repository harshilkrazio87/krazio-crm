import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    const authHeader = request.headers.get("x-migrate-secret");
    if (authHeader !== process.env.MIGRATE_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return NextResponse.json(
      {
        error: "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
        fix: "Add these to your .env.local file (create it in the project root if needed). Get the values from Supabase Dashboard → Project Settings → API: use Project URL for NEXT_PUBLIC_SUPABASE_URL and the 'service_role' secret key for SUPABASE_SERVICE_ROLE_KEY. Then restart the dev server (npm run dev).",
        needed: [
          "NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co",
          "SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (your service_role key)",
        ],
      },
      { status: 500 }
    );
  }

  const supabase = createClient(url, key);
  const results: { action: string; status: string; error?: string; userId?: string }[] = [];

  // Step 1: Try to create harsh.p@kraziocloud.com (if exists, createUser will error; then we find and update)
  const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
    email: "harsh.p@kraziocloud.com",
    password: "Krazio@2024",
    email_confirm: true,
    user_metadata: { full_name: "Harsh Parekh" },
  });

  let harshUserId: string | null = null;

  if (createError) {
    results.push({ action: "create harsh.p", status: "already_exists_or_error", error: createError.message });
    const { data: listData, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const users = listData?.users ?? [];
    if (!listError && users.length) {
      const found = users.find((u) => u.email === "harsh.p@kraziocloud.com");
      if (found) {
        harshUserId = found.id;
        const { error: updateError } = await supabase.auth.admin.updateUserById(found.id, {
          password: "Krazio@2024",
          email_confirm: true,
        });
        results.push({ action: "reset harsh.p password", status: updateError ? "error" : "ok", error: updateError?.message });
      }
    }
  } else {
    harshUserId = newUser?.user?.id ?? null;
    results.push({ action: "create harsh.p", status: "created", userId: harshUserId ?? undefined });
  }

  // Step 2: Ensure profile exists for harsh.p and assign admin role
  if (harshUserId) {
    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: harshUserId,
        email: "harsh.p@kraziocloud.com",
        full_name: "Harsh Parekh",
      },
      { onConflict: "id" }
    );
    results.push({ action: "upsert harsh.p profile", status: profileError ? "error" : "ok", error: profileError?.message });

    const { data: adminRole } = await supabase.from("roles").select("id").eq("slug", "admin").single();
    if (adminRole) {
      const { error: roleError } = await supabase.from("profiles").update({ role_id: adminRole.id }).eq("id", harshUserId);
      results.push({ action: "assign admin role to harsh.p", status: roleError ? "error" : "ok" });
    }
  }

  // Step 3: Ensure admin@kraziocloud.com has super_admin role
  const { data: listData2 } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const allUsers = listData2?.users ?? [];
  const adminUser = allUsers.find((u) => u.email === "admin@kraziocloud.com");

  if (adminUser) {
    await supabase.from("profiles").upsert(
      {
        id: adminUser.id,
        email: "admin@kraziocloud.com",
        full_name: "Super Admin",
      },
      { onConflict: "id" }
    );
    const { data: superAdminRole } = await supabase.from("roles").select("id").eq("slug", "super_admin").single();
    if (superAdminRole) {
      await supabase.from("profiles").update({ role_id: superAdminRole.id }).eq("id", adminUser.id);
      results.push({ action: "assign super_admin to admin@kraziocloud.com", status: "ok" });
    }
  }

  return NextResponse.json({
    results,
    credentials: {
      superAdmin: { email: "admin@kraziocloud.com", note: "use your existing password" },
      admin: { email: "harsh.p@kraziocloud.com", password: "Krazio@2024" },
    },
  });
}
