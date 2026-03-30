import { createClient } from "@/lib/supabase/server";
import { TasksPageView } from "@/components/tasks/tasks-page-view";

export default async function TasksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;



  const { data: tasks } = await supabase.from("tasks").select(`id,title,status,due_date,priority,created_at,task_assignees(user_id, profiles(id, full_name, email, avatar_url)), task_timers(id, started_at, ended_at, duration_seconds)`).is("parent_task_id", null).order("created_at", { ascending: false });

  const { data: profiles } = await supabase.from("profiles").select("id, full_name, email, avatar_url").order("full_name");

  const { data: taskStages } = await supabase
    .from("task_stages")
    .select("id, name, slug, color, order_index")
    .order("order_index", { ascending: true });

  const mainTaskIds = (tasks ?? []).map((t) => t.id);
  const { data: subtasks } = mainTaskIds.length > 0
    ? await supabase
        .from("tasks")
        .select("id, parent_task_id, status")
        .in("parent_task_id", mainTaskIds)
    : { data: [] };

  const subtaskCounts: Record<string, { total: number; completed: number }> = {};
  for (const t of tasks ?? []) {
    subtaskCounts[t.id] = { total: 0, completed: 0 };
  }
  for (const st of subtasks ?? []) {
    if (st.parent_task_id && subtaskCounts[st.parent_task_id]) {
      subtaskCounts[st.parent_task_id].total += 1;
      if (st.status === "completed") subtaskCounts[st.parent_task_id].completed += 1;
    }
  }

  return (
    <div className="space-y-4">
      <TasksPageView
        tasks={tasks ?? []}
        profiles={profiles ?? []}
        subtaskCounts={subtaskCounts}
        taskStages={taskStages ?? []}
      />
    </div>
  );
}
