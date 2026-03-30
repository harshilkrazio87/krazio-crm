import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: depts, error } = await supabase.from("departments").select("id, name, description, sop_content, sop_fields, updated_at").order("name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const { data: profiles } = await supabase.from("profiles").select("id, department_id");
  const countByDept: Record<string, number> = {};
  (profiles ?? []).forEach((p: { department_id?: string | null }) => {
    const id = p.department_id;
    if (id) countByDept[id] = (countByDept[id] ?? 0) + 1;
  });
  const list = (depts ?? []).map((d: { id: string }) => ({ ...d, members_count: countByDept[d.id] ?? 0 }));
  return NextResponse.json(list);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role_id, roles(slug)").eq("id", user.id).single();
  const rolesData = profile?.roles as { slug: string } | { slug: string }[] | null;
  const roleSlug = Array.isArray(rolesData) ? rolesData[0]?.slug : rolesData?.slug;
  if (roleSlug !== "super_admin" && roleSlug !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const name = body?.name as string;
  if (!name || typeof name !== "string" || !name.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  const description = body?.description as string | undefined;
  const sop_content = body?.sop_content as string | undefined;
  const sop_fields = body?.sop_fields;
  const { data: row, error } = await supabase.from("departments").insert({
    name: name.trim(),
    description: description?.trim() || null,
    sop_content: sop_content ?? null,
    sop_fields: Array.isArray(sop_fields) ? sop_fields : [],
  }).select("id, name, description, sop_content, sop_fields, updated_at").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(row);
}
