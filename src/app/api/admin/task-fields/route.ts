import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getUserWithRole, isAdminByEmail } from "@/lib/get-user-role";

export async function GET() {
  const userWithRole = await getUserWithRole();
  if (!userWithRole?.isAdmin && !isAdminByEmail(userWithRole?.email ?? "")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const supabase = await createClient();
  const { data, error } = await supabase.from("task_custom_fields").select("*").order("field_name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const userWithRole = await getUserWithRole();
  if (!userWithRole?.isAdmin && !isAdminByEmail(userWithRole?.email ?? "")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const supabase = await createClient();
  const body = await request.json().catch(() => ({}));
  const field_name = (body?.field_name as string)?.trim();
  if (!field_name) return NextResponse.json({ error: "field_name required" }, { status: 400 });
  const { data, error } = await supabase.from("task_custom_fields").insert({
    field_name,
    field_type: body?.field_type || "text",
    field_options: body?.field_options ?? null,
    is_active: body?.is_active !== false,
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
