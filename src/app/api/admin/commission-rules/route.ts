import { getUserWithRole, isAdminByEmail } from "@/lib/get-user-role";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const userWithRole = await getUserWithRole();
  if (!userWithRole?.isAdmin && !isAdminByEmail(userWithRole?.email ?? "")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const supabase = await createClient();
  const { data, error } = await supabase.from("commission_rules").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const userWithRole = await getUserWithRole();
  if (!userWithRole?.isAdmin && !isAdminByEmail(userWithRole?.email ?? "")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const name = (body?.name as string)?.trim();
  const trigger_type = (body?.trigger_type as string) || (body?.rule_type as string) || "meeting_complete";
  const value = Number(body?.value ?? body?.amount ?? 0);
  const is_percentage = Boolean(body?.is_percentage);
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("commission_rules")
    .insert({ name, rule_type: trigger_type, trigger_type, value, is_percentage })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
