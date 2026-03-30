import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const status = body?.status as string;
  if (!status || !["pending", "in_progress", "completed"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  const { data: assignees } = await supabase.from("task_assignees").select("task_id").eq("task_id", id).eq("user_id", user.id);
  const isAssigned = (assignees ?? []).length > 0;
  const { data: task } = await supabase.from("tasks").select("created_by_id").eq("id", id).single();
  const isCreator = task?.created_by_id === user.id;
  if (!isAssigned && !isCreator) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const updates: { status: string; completed_at?: string | null } = { status };
  if (status === "completed") updates.completed_at = new Date().toISOString();
  const { error } = await supabase.from("tasks").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
