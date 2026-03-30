import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role_id, roles(slug)")
    .eq("id", user.id)
    .single();
  const rolesData = profile?.roles as { slug: string } | { slug: string }[] | null;
  const roleSlug = Array.isArray(rolesData) ? rolesData[0]?.slug : rolesData?.slug;
  if (roleSlug !== "super_admin" && roleSlug !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: entry } = await supabase
    .from("commission_entries")
    .select("user_id, amount")
    .eq("id", id)
    .single();

  const { error } = await supabase
    .from("commission_entries")
    .update({ status: "approved" })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (entry?.user_id) {
    await supabase.from("notifications").insert({
      user_id: entry.user_id,
      title: "Commission approved",
      message: `Your commission of ₹${entry.amount ?? 0} has been approved.`,
      type: "commission",
      link: "/commission",
    });
  }
  return NextResponse.json({ ok: true });
}
