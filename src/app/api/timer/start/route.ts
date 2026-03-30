import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const taskId = body?.taskId ?? body?.task_id;
  const subtaskId = body?.subtask_id ?? body?.subtaskId ?? null;
  if (!taskId || typeof taskId !== "string") {
    return NextResponse.json({ error: "taskId required" }, { status: 400 });
  }

  const { data: profile } = await supabase.from("profiles").select("id").eq("id", user.id).single();
  const userId = profile?.id ?? user.id;

  const { data: openTimers } = await supabase
    .from("task_timers")
    .select("id, started_at")
    .eq("user_id", userId)
    .is("ended_at", null);
  for (const t of openTimers ?? []) {
    const startedAt = new Date(t.started_at).getTime();
    const durationSeconds = Math.floor((Date.now() - startedAt) / 1000);
    await supabase
      .from("task_timers")
      .update({ ended_at: new Date().toISOString(), duration_seconds: durationSeconds })
      .eq("id", t.id);
  }

  const insertPayload: { task_id: string; user_id: string; started_at: string; ended_at: null; duration_seconds: number; subtask_id?: string | null } = {
    task_id: taskId,
    user_id: userId,
    started_at: new Date().toISOString(),
    ended_at: null,
    duration_seconds: 0,
  };
  if (subtaskId != null) insertPayload.subtask_id = subtaskId;

  const { data: row, error } = await supabase
    .from("task_timers")
    .insert(insertPayload)
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ id: row.id });
}
