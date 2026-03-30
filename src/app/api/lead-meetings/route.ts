import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const lead_id = body?.lead_id as string;
  const scheduled_at = body?.scheduled_at as string;
  const meeting_link = body?.meeting_link as string | undefined;
  const title = body?.title as string | undefined;
  const agenda = body?.agenda as string | undefined;
  const duration_minutes = body?.duration_minutes as number | undefined;
  if (!lead_id || !scheduled_at) return NextResponse.json({ error: "lead_id and scheduled_at required" }, { status: 400 });
  const { data: lead } = await supabase.from("leads").select("owner_id").eq("id", lead_id).single();
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  const { data: profile } = await supabase.from("profiles").select("role_id, roles(slug)").eq("id", user.id).single();
  const r = profile?.roles as { slug: string } | { slug: string }[] | null;
  const slug = Array.isArray(r) ? r[0]?.slug : r?.slug;
  const isAdmin = slug === "super_admin" || slug === "admin";
  if (lead.owner_id !== user.id && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { data: row, error } = await supabase
    .from("lead_meetings")
    .insert({
      lead_id,
      scheduled_at: new Date(scheduled_at).toISOString(),
      meeting_link: meeting_link?.trim() || null,
      title: title?.trim() || null,
      agenda: agenda?.trim() || null,
      duration_minutes: duration_minutes ?? null,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(row);
}
