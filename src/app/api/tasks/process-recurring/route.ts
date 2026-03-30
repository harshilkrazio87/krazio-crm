import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function POST() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return NextResponse.json({ error: "Missing env" }, { status: 500 });
  }

  const service = createServiceClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  const { data: recurringTasks } = await service
    .from("tasks")
    .select("id, title, description, priority, status, due_date, created_at, task_admin_id, created_by_id, recur_type, recur_interval_days, recur_weekdays, recur_end_date")
    .not("recur_type", "is", null)
    .neq("recur_type", "")
    .is("parent_task_id", null);

  if (!recurringTasks?.length) return NextResponse.json({ created: 0, date: todayStr });

  let created = 0;

  for (const task of recurringTasks) {
    if (task.recur_end_date && new Date(task.recur_end_date) < today) continue;

    let shouldCreateToday = false;

    if (task.recur_type === "interval" && task.recur_interval_days) {
      const baseDate = new Date(task.due_date ?? task.created_at ?? today);
      baseDate.setHours(0, 0, 0, 0);
      const daysDiff = Math.floor((today.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
      shouldCreateToday = daysDiff > 0 && daysDiff % task.recur_interval_days === 0;
    } else if (task.recur_type === "weekday" && task.recur_weekdays?.length) {
      const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
      const todayWeekday = weekdays[today.getDay()];
      shouldCreateToday = task.recur_weekdays.includes(todayWeekday);
    }

    if (!shouldCreateToday) continue;

    const { data: existing } = await service
      .from("tasks")
      .select("id")
      .eq("parent_task_id", task.id)
      .gte("created_at", todayStr + "T00:00:00")
      .limit(1);

    if (existing?.length) continue;

    const dueTomorrow = new Date(today);
    dueTomorrow.setDate(dueTomorrow.getDate() + 1);

    const { data: newTask, error: insertError } = await service
      .from("tasks")
      .insert({
        title: task.title,
        description: task.description ?? null,
        priority: task.priority ?? "medium",
        status: "pending",
        due_date: dueTomorrow.toISOString(),
        task_admin_id: task.task_admin_id ?? null,
        created_by_id: task.created_by_id ?? null,
      })
      .select()
      .single();

    if (insertError || !newTask) continue;

    const { data: assignees } = await service.from("task_assignees").select("user_id").eq("task_id", task.id);
    if (assignees?.length) {
      await service.from("task_assignees").insert(
        assignees.map((a: { user_id: string }) => ({ task_id: newTask.id, user_id: a.user_id }))
      );
    }

    const { data: childTasks } = await service
      .from("tasks")
      .select("id, title, description, priority")
      .eq("parent_task_id", task.id);
    if (childTasks?.length) {
      for (const st of childTasks) {
        await service.from("tasks").insert({
          title: st.title,
          description: st.description ?? null,
          priority: st.priority ?? "medium",
          status: "pending",
          parent_task_id: newTask.id,
          created_by_id: task.created_by_id ?? null,
        });
      }
    }

    created++;
  }

  return NextResponse.json({ created, date: todayStr });
}
