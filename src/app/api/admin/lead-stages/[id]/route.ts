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
  if (body.order_index !== undefined) updates.order_index = Number(body.order_index);
  if (body.is_meeting_stage !== undefined) updates.is_meeting_stage = Boolean(body.is_meeting_stage);
  if (body.requires_meeting !== undefined) updates.requires_meeting = Boolean(body.requires_meeting);
  if (body.is_won !== undefined) updates.is_won = Boolean(body.is_won);
  if (body.is_lost !== undefined) updates.is_lost = Boolean(body.is_lost);
  if (body.color !== undefined) updates.color = body.color?.trim() || null;
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  const { data, error } = await supabase.from("lead_stages").update(updates).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userWithRole = await getUserWithRole();
  if (!userWithRole?.isAdmin && !isAdminByEmail(userWithRole?.email ?? "")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const supabase = await createClient();
  const { error } = await supabase.from("lead_stages").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
