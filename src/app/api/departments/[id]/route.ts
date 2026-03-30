import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await supabase
    .from("departments")
    .select("id, name, description, sop_content, sop_fields, updated_at")
    .eq("id", id)
    .single();
  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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
  if (roleSlug !== "super_admin" && roleSlug !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await request.json().catch(() => ({}));
  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name?.trim() ?? null;
  if (body.description !== undefined) updates.description = body.description?.trim() || null;
  if (body.sop_content !== undefined) updates.sop_content = body.sop_content ?? null;
  if (body.sop_fields !== undefined) updates.sop_fields = Array.isArray(body.sop_fields) ? body.sop_fields : [];
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }
  const { data, error } = await supabase
    .from("departments")
    .update(updates)
    .eq("id", id)
    .select("id, name, description, sop_content, sop_fields, updated_at")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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
  if (roleSlug !== "super_admin" && roleSlug !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { error } = await supabase.from("departments").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
