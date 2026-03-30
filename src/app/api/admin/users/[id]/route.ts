import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserWithRole, isAdminByEmail } from "@/lib/get-user-role";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: userId } = await params;
  const userWithRole = await getUserWithRole();
  if (!userWithRole) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (userWithRole.id === userId) {
    return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
  }
  if (!userWithRole.isAdmin && !isAdminByEmail(userWithRole.email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let adminClient: ReturnType<typeof createAdminClient>;
  try {
    adminClient = createAdminClient();
  } catch (e) {
    return NextResponse.json(
      { error: "Server misconfiguration. Set SUPABASE_SERVICE_ROLE_KEY." },
      { status: 500 }
    );
  }

  const { error } = await adminClient.auth.admin.deleteUser(userId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
