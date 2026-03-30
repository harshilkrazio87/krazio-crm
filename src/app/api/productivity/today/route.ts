import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const today = new Date().toISOString().slice(0, 10);
  const { data: timers, error } = await supabase
    .from("task_timers")
    .select("id, task_id, duration_seconds, tasks(id, title)")
    .eq("user_id", user.id)
    .not("ended_at", "is", null)
    .gte("started_at", today + "T00:00:00")
    .lte("started_at", today + "T23:59:59.999Z");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const totalSeconds = (timers ?? []).reduce((s, t) => s + (t.duration_seconds ?? 0), 0);
  const byTask: Record<string, { title: string; seconds: number }> = {};
  for (const t of timers ?? []) {
    const task = Array.isArray(t.tasks) ? t.tasks[0] : t.tasks;
    const title = task?.title ?? "Unknown";
    const key = t.task_id ?? "none";
    if (!byTask[key]) byTask[key] = { title, seconds: 0 };
    byTask[key].seconds += t.duration_seconds ?? 0;
  }
  const breakdown = Object.entries(byTask).map(([task_id, v]) => ({ task_id, task_title: v.title, seconds: v.seconds }));
  return NextResponse.json({ total_seconds: totalSeconds, breakdown });
}
