import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function decodePassword(enc: string): string {
  try {
    return Buffer.from(enc, "base64").toString("utf8");
  } catch {
    return enc;
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("id").eq("id", user.id).single();
  const userId = profile?.id ?? user.id;

  const { data: row } = await supabase.from("password_vault").select("user_id").eq("id", id).single();
  if (!row || row.user_id !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const updates: Record<string, unknown> = {};
  if (body.company_name !== undefined) updates.company_name = body.company_name;
  if (body.url !== undefined) updates.url = body.url;
  if (body.username !== undefined) updates.username = body.username;
  if (body.notes !== undefined) updates.notes = body.notes;
  if (body.password !== undefined && body.password) {
    updates.password_encrypted = Buffer.from(String(body.password), "utf8").toString("base64");
  }
  updates.updated_at = new Date().toISOString();

  const { error } = await supabase.from("password_vault").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("id, roles(slug)").eq("id", user.id).single();
  const userId = profile?.id ?? user.id;
  const rolesData = (profile as { roles?: { slug: string } | { slug: string }[] })?.roles;
  const slug = Array.isArray(rolesData) ? rolesData[0]?.slug : rolesData?.slug;
  const isAdmin = slug === "super_admin" || slug === "admin";

  const { data: row } = await supabase.from("password_vault").select("user_id").eq("id", id).single();
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isAdmin && row.user_id !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { error } = await supabase.from("password_vault").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("id, roles(slug)").eq("id", user.id).single();
  const userId = profile?.id ?? user.id;
  const rolesData = (profile as { roles?: { slug: string } | { slug: string }[] })?.roles;
  const slug = Array.isArray(rolesData) ? rolesData[0]?.slug : rolesData?.slug;
  const isAdmin = slug === "super_admin" || slug === "admin";

  const { data: row, error } = await supabase.from("password_vault").select("*").eq("id", id).single();
  if (error || !row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isAdmin && row.user_id !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const plain = decodePassword(row.password_encrypted ?? "");
  return NextResponse.json({ ...row, password_plain: plain });
}
