import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  console.log(user);
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data: profile } = await supabase.from("profiles").select("role_id, roles(slug)").eq("id", user.id).single();
  const rolesData = profile?.roles as { slug: string } | { slug: string }[] | null | undefined;
  const slug = Array.isArray(rolesData) ? rolesData[0]?.slug : rolesData?.slug;
  if (slug !== "super_admin" && slug !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const to = (body as { to?: string }).to;
  if (!to) return NextResponse.json({ error: "Recipient required" }, { status: 400 });

  const { sendWelcomeEmail } = await import("@/lib/send-email");
  const result = await sendWelcomeEmail(to, "Test User", "test-preview-only");

  if (result.success) return NextResponse.json({ success: true });
  return NextResponse.json({ error: result.error }, { status: 500 });
}

