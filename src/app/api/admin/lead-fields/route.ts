import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getUserWithRole, isAdminByEmail } from "@/lib/get-user-role";

export async function GET() {
  const userWithRole = await getUserWithRole();
  if (!userWithRole?.isAdmin && !isAdminByEmail(userWithRole?.email ?? "")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const supabase = await createClient();
  const { data, error } = await supabase.from("lead_custom_fields").select("*").order("name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const userWithRole = await getUserWithRole();
  if (!userWithRole?.isAdmin && !isAdminByEmail(userWithRole?.email ?? "")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const supabase = await createClient();
  const body = await request.json().catch(() => ({}));
  const name = (body?.name as string)?.trim();
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });
  const slug = (body?.slug as string)?.trim() || name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "") || "field";
  const field_type = (body?.field_type as string) || "text";
  const { data, error } = await supabase.from("lead_custom_fields").insert({
    name,
    slug,
    field_type: ["text", "number", "date", "select", "multiselect"].includes(field_type) ? field_type : "text",
    options: body?.options ?? null,
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
