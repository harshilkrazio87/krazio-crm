import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getUserWithRole, isAdminByEmail } from "@/lib/get-user-role";

export async function GET() {
  const userWithRole = await getUserWithRole();
  if (!userWithRole?.isAdmin && !isAdminByEmail(userWithRole?.email ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("task_stages")
    .select("*")
    .order("order_index");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const userWithRole = await getUserWithRole();
  if (!userWithRole?.isAdmin && !isAdminByEmail(userWithRole?.email ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const supabase = await createClient();
  const body = await request.json().catch(() => ({}));
  const name = (body?.name as string)?.trim();
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });
  const slug = (body?.slug as string)?.trim() || name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "") || "stage";
  const color = (body?.color as string)?.trim() || "#6366f1";
  const { data: max } = await supabase
    .from("task_stages")
    .select("order_index")
    .order("order_index", { ascending: false })
    .limit(1)
    .single();
  const order_index = (max?.order_index ?? -1) + 1;
  const { data, error } = await supabase
    .from("task_stages")
    .insert({ name, slug, color, order_index, is_default: false })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(request: Request) {
  const userWithRole = await getUserWithRole();
  if (!userWithRole?.isAdmin && !isAdminByEmail(userWithRole?.email ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const supabase = await createClient();
  const body = await request.json().catch(() => ({}));
  const order = body?.order as string[] | undefined;
  if (!Array.isArray(order)) return NextResponse.json({ error: "order array required" }, { status: 400 });
  for (let i = 0; i < order.length; i++) {
    await supabase.from("task_stages").update({ order_index: i }).eq("id", order[i]);
  }
  return NextResponse.json({ ok: true });
}
