import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role_id, roles(slug)")
    .eq("id", user.id)
    .single();
  const rolesData = profile?.roles as { slug: string } | { slug: string }[] | null;
  const roleSlug = Array.isArray(rolesData) ? rolesData[0]?.slug : rolesData?.slug;
  const isAdmin = roleSlug === "super_admin" || roleSlug === "admin";
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const email = body?.email as string;
  const roleId = body?.role_id as string | null;
  if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  let adminClient;
  try {
    const m = await import("@/lib/supabase/admin");
    adminClient = m.createAdminClient();
  } catch {
    return NextResponse.json(
      { error: "Server misconfiguration: admin client not available. Set SUPABASE_SERVICE_ROLE_KEY." },
      { status: 500 }
    );
  }

  const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
    email,
    email_confirm: true,
    
  });

  if (createError) {
    return NextResponse.json({ error: createError.message }, { status: 500 });
  }
  if (!newUser.user) {
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }

  if (roleId) {
    await adminClient
      .from("profiles")
      .update({ role_id: roleId })
      .eq("id", newUser.user.id);
  }

  return NextResponse.json({
    ok: true,
    user_id: newUser.user.id,
    email: newUser.user.email,
  });
}
