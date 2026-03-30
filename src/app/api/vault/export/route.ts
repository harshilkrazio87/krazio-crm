import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function decodePassword(enc: string): string {
  try {
    return Buffer.from(enc, "base64").toString("utf8");
  } catch {
    return enc;
  }
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("id, roles(slug)").eq("id", user.id).single();
  const rolesData = (profile as { roles?: { slug: string } | { slug: string }[] })?.roles;
  const slug = Array.isArray(rolesData) ? rolesData[0]?.slug : rolesData?.slug;
  if (slug !== "super_admin" && slug !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: rows, error } = await supabase
    .from("password_vault")
    .select("id, user_id, company_name, url, username, password_encrypted, notes, created_at, profiles(full_name, email)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const headers = ["Company", "URL", "Username", "Password", "Notes", "Added By", "Created"];
  const lines = [headers.join(",")];
  for (const r of rows ?? []) {
    const p = Array.isArray((r as { profiles?: unknown }).profiles) ? (r as { profiles: { full_name?: string; email?: string }[] }).profiles[0] : (r as { profiles?: { full_name?: string; email?: string } }).profiles;
    const addedBy = p ? (p.full_name || p.email || "") : "";
    const pass = decodePassword((r as { password_encrypted?: string }).password_encrypted ?? "");
    const row = [
      `"${String((r as { company_name?: string }).company_name ?? "").replace(/"/g, '""')}"`,
      `"${String((r as { url?: string }).url ?? "").replace(/"/g, '""')}"`,
      `"${String((r as { username?: string }).username ?? "").replace(/"/g, '""')}"`,
      `"${pass.replace(/"/g, '""')}"`,
      `"${String((r as { notes?: string }).notes ?? "").replace(/"/g, '""')}"`,
      `"${String(addedBy).replace(/"/g, '""')}"`,
      (r as { created_at?: string }).created_at ?? "",
    ];
    lines.push(row.join(","));
  }
  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="vault-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
