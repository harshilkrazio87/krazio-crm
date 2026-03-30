import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const timerId = body?.timerId ?? body?.timer_id;
  if (!timerId || typeof timerId !== "string") {
    return NextResponse.json({ error: "timerId required" }, { status: 400 });
  }

  const { data: timer } = await supabase
    .from("task_timers")
    .select("id, started_at, user_id")
    .eq("id", timerId)
    .single();

  if (!timer) {
    return NextResponse.json({ error: "Timer not found" }, { status: 404 });
  }

  const { data: profile } = await supabase.from("profiles").select("id").eq("id", user.id).single();
  const userId = profile?.id ?? user.id;
  if (timer.user_id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const startedAt = new Date(timer.started_at).getTime();
  const now = Date.now();
  const durationSeconds = Math.floor((now - startedAt) / 1000);

  const { error } = await supabase
    .from("task_timers")
    .update({ ended_at: new Date().toISOString(), duration_seconds: durationSeconds })
    .eq("id", timerId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const { data: todayTimers } = await supabase
    .from("task_timers")
    .select("duration_seconds")
    .eq("user_id", userId)
    .not("ended_at", "is", null)
    .gte("started_at", today + "T00:00:00")
    .lte("started_at", today + "T23:59:59.999Z");
  const totalSeconds = (todayTimers ?? []).reduce((s, t) => s + (t.duration_seconds ?? 0), 0);
  await supabase.from("daily_productivity").upsert(
    { user_id: userId, date: today, total_seconds: totalSeconds, updated_at: new Date().toISOString() },
    { onConflict: "user_id,date" }
  );

  return NextResponse.json({ ok: true, duration_seconds: durationSeconds });
}
