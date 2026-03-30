import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const { id: departmentId, taskId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role_id, roles(slug)").eq("id", user.id).single();
  const rolesData = profile?.roles as { slug: string } | { slug: string }[] | null;
  const roleSlug = Array.isArray(rolesData) ? rolesData[0]?.slug : rolesData?.slug;
  if (roleSlug !== "super_admin" && roleSlug !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const updates: Record<string, unknown> = {};
  if (body.title !== undefined) updates.title = body.title?.trim() ?? null;
  if (body.description !== undefined) updates.description = body.description?.trim() || null;
  if (body.priority !== undefined) updates.priority = ["low", "medium", "high"].includes(body.priority) ? body.priority : "medium";
  if (body.order_index !== undefined) updates.order_index = Number(body.order_index);
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  const { data, error } = await supabase.from("sop_tasks").update(updates).eq("id", taskId).eq("department_id", departmentId).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string; taskId: string }> }) {
  const { id: departmentId, taskId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role_id, roles(slug)").eq("id", user.id).single();
  const rolesData = profile?.roles as { slug: string } | { slug: string }[] | null;
  const roleSlug = Array.isArray(rolesData) ? rolesData[0]?.slug : rolesData?.slug;
  if (roleSlug !== "super_admin" && roleSlug !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { error } = await supabase.from("sop_tasks").delete().eq("id", taskId).eq("department_id", departmentId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
