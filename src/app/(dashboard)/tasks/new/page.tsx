import { createClient } from "@/lib/supabase/server";
import { TaskForm } from "@/components/tasks/task-form";

export default async function NewTaskPage() {
  const supabase = await createClient();
  const { data: profiles } = await supabase.from("profiles").select("id, full_name, email").order("full_name");
  const { data: roles } = await supabase.from("roles").select("id, name, slug");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">New task</h1>
        <p className="text-muted-foreground">
          Create a main task. You can add subtasks and assignees after saving.
        </p>
      </div>
      <TaskForm profiles={profiles ?? []} />
    </div>
  );
}
