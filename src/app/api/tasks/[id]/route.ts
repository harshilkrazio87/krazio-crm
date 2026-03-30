import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getUserWithRole } from "@/lib/get-user-role";

/** DELETE: Manager/Admin can delete any task; others only if they created it or are assigned. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: taskId } = await params;
  const userWithRole = await getUserWithRole();
  if (!userWithRole) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createClient();
  const canDeleteAny = userWithRole.isManager || userWithRole.isAdmin;

  if (!canDeleteAny) {
    const { data: task } = await supabase
      .from("tasks")
      .select("created_by_id, task_assignees(user_id)")
      .eq("id", taskId)
      .single();
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
    const assigneeIds = (task.task_assignees as { user_id: string }[] ?? []).map((a) => a.user_id);
    const isCreator = task.created_by_id === userWithRole.id;
    const isAssignee = assigneeIds.includes(userWithRole.id);
    if (!isCreator && !isAssignee) {
      return NextResponse.json({ error: "You can only delete your own tasks" }, { status: 403 });
    }
  }

  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
