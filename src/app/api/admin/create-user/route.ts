import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUserWithRole, isAdminByEmail } from "@/lib/get-user-role";

function clean(value: any) {
  if (typeof value === "string") {
    const v = value.trim();
    return v === "" ? null : v;
  }
  return value ?? null;
}

export async function POST(request: Request) {
  const userWithRole = await getUserWithRole();

  if (!userWithRole?.isAdmin && !isAdminByEmail(userWithRole?.email ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => ({}));

    const {
      email,
      password: passwordInput,
      full_name,
      role_slug,
      role_id: roleIdBody,
      manager_id,
      employee_id,
      department_id,
      phone,
      joining_date,
      avatar_url,
      generate_password,
      email_employee,
    } = body;

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    // 🔐 Generate password
    function randomPassword(len: number) {
      const chars =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let s = "";
      for (let i = 0; i < len; i++) {
        s += chars[Math.floor(Math.random() * chars.length)];
      }
      return s;
    }

    const password =
      generate_password || !passwordInput?.trim()
        ? randomPassword(10)
        : String(passwordInput).trim();

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const serviceClient = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // ✅ STEP 1: Create Auth User
    const { data: authData, error: authError } =
      await serviceClient.auth.admin.createUser({
        email: String(email).trim(),
        password,
        email_confirm: true,
        user_metadata: { full_name: full_name || email },
      });

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    const userId = authData.user.id;

    // ✅ STEP 2: Resolve role_id
    let role_id = roleIdBody ?? null;

    if (!role_id && role_slug) {
      const { data: role } = await serviceClient
        .from("roles")
        .select("id")
        .eq("slug", String(role_slug))
        .single();

      role_id = role?.id ?? null;
    }

    // ✅ STEP 3: Insert profile (FIXED)
    const profilePayload = {
      id: userId,
      email: String(email).trim(),
      full_name: clean(full_name) || email,

      role_id: clean(role_id),
      manager_id: clean(manager_id),

      employee_id: clean(employee_id),
      department_id: clean(department_id),
      phone: clean(phone),
      joining_date: clean(joining_date),
      avatar_url: clean(avatar_url),

      is_active: true,
    };

    const { error: profileError } = await serviceClient
      .from("profiles")
      .upsert(profilePayload, { onConflict: "id" });

    if (profileError) {
      return NextResponse.json(
        { error: profileError.message },
        { status: 500 }
      );
    }

    // ✅ Activity log (optional)
    try {
      await serviceClient.from("activity_logs").insert({
        user_id: userWithRole?.id ?? null,
        action: "create_user",
        entity_type: "user",
        entity_id: userId,
        details: { email },
      });
    } catch {}

    // ✅ Email send (optional)
    let emailSent = false;

    if (email_employee) {
      const { sendWelcomeEmail } = await import("@/lib/send-email");

      const emailResult = await sendWelcomeEmail(
        String(email).trim(),
        full_name || String(email).trim(),
        password
      );

      emailSent = emailResult.success;
    }

    return NextResponse.json({
      success: true,
      userId,
      email: authData.user.email,
      password,
      emailSent,
    });

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Something went wrong" },
      { status: 500 }
    );
  }
}