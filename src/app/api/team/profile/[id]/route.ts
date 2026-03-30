import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getUserWithRole, isAdminByEmail } from "@/lib/get-user-role";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userWithRole = await getUserWithRole();
  if (!userWithRole) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const isAdmin = userWithRole.isAdmin || isAdminByEmail(userWithRole.email);
  const supabase = await createClient();
  const body = await request.json();
  const updates: Record<string, unknown> = {};

  if (isAdmin && body.role_id !== undefined) updates.role_id = body.role_id || null;
  if (isAdmin && body.is_active !== undefined) updates.is_active = Boolean(body.is_active);
  if (isAdmin && body.full_name !== undefined) updates.full_name = body.full_name?.trim() ?? null;
  if (isAdmin && body.avatar_url !== undefined) updates.avatar_url = body.avatar_url?.trim() || null;
  if (isAdmin && body.employee_id !== undefined) updates.employee_id = body.employee_id?.trim() || null;
  if (isAdmin && body.phone !== undefined) updates.phone = body.phone?.trim() || null;
  if (isAdmin && body.department_id !== undefined) updates.department_id = body.department_id || null;
  if (isAdmin && body.joining_date !== undefined) updates.joining_date = body.joining_date || null;
  if (isAdmin && body.manager_id !== undefined) updates.manager_id = body.manager_id || null;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { error } = await supabase.from("profiles").update(updates).eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
