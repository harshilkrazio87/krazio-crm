import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: assignees } = await supabase.from("task_assignees").select("task_id").eq("user_id", user.id);
  const taskIds = (assignees ?? []).map((a) => a.task_id);
  if (taskIds.length === 0) return NextResponse.json([]);
  const { data: tasks, error } = await supabase
    .from("tasks")
    .select("id, title, status, due_date, priority")
    .in("id", taskIds)
    .eq("status", "pending")
    .is("parent_task_id", null)
    .order("due_date", { ascending: true, nullsFirst: false })
    .limit(50);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(tasks ?? []);
}
