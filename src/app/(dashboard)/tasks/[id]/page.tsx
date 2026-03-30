import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { TaskDetail } from "@/components/tasks/task-detail";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: task } = await supabase
    .from("tasks")
    .select(`
      id,
      title,
      description,
      status,
      is_recurring,
      recurrence_rule,
      task_admin_id,
      parent_task_id,
      created_at,
      completed_at,
      due_date,
      priority,
      task_assignees(user_id, profiles(id, full_name, email)),
      task_timers(id, user_id, started_at, ended_at, duration_seconds)
    `)
    .eq("id", id)
    .maybeSingle();

  if (!task) notFound();

  const { data: profile } = user
    ? await supabase.from("profiles").select("id").eq("id", user.id).single()
    : { data: null };
  const userId = profile?.id ?? user?.id ?? "";

  type TimerRow = { id: string; started_at: string; ended_at: string | null };
  const timers = (task.task_timers ?? []) as TimerRow[];
  const openTimerRow = user ? timers.find((t) => !t.ended_at) : null;
  const openTimer = openTimerRow ? { id: openTimerRow.id, started_at: openTimerRow.started_at } : null;

  const totalSeconds =
    (task.task_timers as { duration_seconds?: number }[] | undefined)?.reduce(
      (s, t) => s + (t.duration_seconds ?? 0),
      0
    ) ?? 0;

  const { data: subtasks } = await supabase
    .from("tasks")
    .select(`
      id,
      title,
      description,
      status,
      completed_at,
      task_timers(id, started_at, ended_at, duration_seconds)
    `)
    .eq("parent_task_id", id)
    .order("created_at");

  const { data: profiles } = await supabase.from("profiles").select("id, full_name, email");

  const { data: taskStages } = await supabase
    .from("task_stages")
    .select("id, name, slug, order_index")
    .order("order_index", { ascending: true });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/tasks">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Task</h1>
      </div>
      <TaskDetail
        task={task}
        subtasks={subtasks ?? []}
        profiles={profiles ?? []}
        userId={userId}
        existingTimer={openTimer}
        totalSeconds={totalSeconds}
        taskStages={taskStages ?? []}
      />
    </div>
  );
}
