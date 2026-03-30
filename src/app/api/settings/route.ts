import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getUserWithRole, isAdminByEmail } from "@/lib/get-user-role";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  if (!key) {
    return NextResponse.json({ error: "Missing key" }, { status: 400 });
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (key === "smtp") {
    const userWithRole = await getUserWithRole();
    if (!userWithRole?.isAdmin && !isAdminByEmail(userWithRole?.email ?? "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", key)
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data?.value ?? {});
}

export async function POST(request: Request) {
  const userWithRole = await getUserWithRole();
  if (!userWithRole) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!userWithRole.isAdmin && !isAdminByEmail(userWithRole.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const supabase = await createClient();
  const body = await request.json();
  const { key, value } = body;
  if (!key || value === undefined) {
    return NextResponse.json({ error: "Missing key or value" }, { status: 400 });
  }
  const { error } = await supabase
    .from("app_settings")
    .upsert({ key, value: typeof value === "object" ? value : { value } }, { onConflict: "key" });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
