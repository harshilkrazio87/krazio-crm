import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserWithRole, isAdminByEmail } from "@/lib/get-user-role";

function randomPassword(length: number): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let s = "";
  for (let i = 0; i < length; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export async function POST(request: Request) {
  const userWithRole = await getUserWithRole();
  if (!userWithRole?.isAdmin && !isAdminByEmail(userWithRole?.email ?? "")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const userId = body?.user_id as string;
  const newPassword = body?.new_password as string | undefined;

  if (!userId || typeof userId !== "string") {
    return NextResponse.json({ error: "user_id is required" }, { status: 400 });
  }

  let adminClient;
  try {
    adminClient = createAdminClient();
  } catch (e) {
    return NextResponse.json(
      { error: "Server misconfiguration. Set SUPABASE_SERVICE_ROLE_KEY." },
      { status: 500 }
    );
  }

  const password = (typeof newPassword === "string" && newPassword.trim()) ? newPassword.trim() : randomPassword(10);
  const { error } = await adminClient.auth.admin.updateUserById(userId, { password });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, password });
}
