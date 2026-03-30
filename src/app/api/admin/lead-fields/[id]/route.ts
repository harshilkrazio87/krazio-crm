import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getUserWithRole, isAdminByEmail } from "@/lib/get-user-role";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userWithRole = await getUserWithRole();
  if (!userWithRole?.isAdmin && !isAdminByEmail(userWithRole?.email ?? "")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const supabase = await createClient();
  const body = await request.json().catch(() => ({}));
  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name?.trim() ?? null;
  if (body.slug !== undefined) updates.slug = body.slug?.trim() ?? null;
  if (body.field_type !== undefined) updates.field_type = body.field_type;
  if (body.options !== undefined) updates.options = body.options;
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  const { data, error } = await supabase.from("lead_custom_fields").update(updates).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userWithRole = await getUserWithRole();
  if (!userWithRole?.isAdmin && !isAdminByEmail(userWithRole?.email ?? "")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const supabase = await createClient();
  const { error } = await supabase.from("lead_custom_fields").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
