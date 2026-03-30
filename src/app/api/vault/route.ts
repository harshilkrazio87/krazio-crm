import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getUserWithRole, isAdminByEmail } from "@/lib/get-user-role";

export async function GET() {
  const userWithRole = await getUserWithRole();
  if (!userWithRole) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const isAdmin = userWithRole.isAdmin || isAdminByEmail(userWithRole.email);
  const userId = userWithRole.id;
  const supabase = await createClient();
  if (isAdmin) {
    const { data, error } = await supabase.from("password_vault").select("id, user_id, company_name, url, username, password_encrypted, notes, created_at, profiles(full_name, email)").order("created_at", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ entries: data ?? [], admin: true });
  }
  const { data, error } = await supabase.from("password_vault").select("id, user_id, company_name, url, username, password_encrypted, notes, created_at").eq("user_id", userId).order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ entries: data ?? [], admin: false });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("id").eq("id", user.id).single();
  const userId = profile?.id ?? user.id;
  const body = await request.json().catch(() => ({}));
  const companyName = body?.company_name ?? body?.companyName;
  const username = body?.username ?? body?.username_email;
  const password = body?.password;
  const url = body?.url ?? "";
  const notes = body?.notes ?? "";
  if (!companyName || typeof companyName !== "string" || !companyName.trim()) return NextResponse.json({ error: "Company name is required" }, { status: 400 });
  if (!username || typeof username !== "string" || !username.trim()) return NextResponse.json({ error: "Username/Email is required" }, { status: 400 });
  if (!password || typeof password !== "string" || !password.trim()) return NextResponse.json({ error: "Password is required" }, { status: 400 });
  const passwordEncrypted = Buffer.from(password, "utf8").toString("base64");
  const { data, error } = await supabase.from("password_vault").insert({ user_id: userId, company_name: companyName.trim(), url: typeof url === "string" ? url.trim() || null : null, username: username.trim(), password_encrypted: passwordEncrypted, notes: typeof notes === "string" ? notes.trim() || null : null }).select("id").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}
