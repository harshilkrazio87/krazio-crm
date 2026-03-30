"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Plus, Clock, Users } from "lucide-react";
import { formatDuration } from "@/lib/utils";
import { TaskTimerClient } from "@/components/task-timer-client";
import { SubtaskTimerWrapper } from "./subtask-timer-wrapper";

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  is_recurring: boolean;
  recurrence_rule: unknown;
  task_admin_id: string | null;
  parent_task_id: string | null;
  created_at: string;
  completed_at: string | null;
  due_date?: string | null;
  priority?: string | null;
  task_assignees?: { user_id: string; profiles: { full_name: string | null; email: string } | { full_name: string | null; email: string }[] | null }[];
  task_timers?: { id: string; user_id: string; started_at: string; ended_at: string | null; duration_seconds: number }[];
};

type Subtask = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  completed_at: string | null;
  task_timers?: { duration_seconds: number }[];
};

type Profile = { id: string; full_name: string | null; email: string };

type ExistingTimer = { id: string; started_at: string } | null;

const DEFAULT_TASK_STAGES = [
  { id: "p", name: "Pending", slug: "pending" },
  { id: "ip", name: "In Progress", slug: "in_progress" },
  { id: "c", name: "Completed", slug: "completed" },
  { id: "x", name: "Cancelled", slug: "cancelled" },
];

type TaskStage = { id: string; name: string; slug: string };

export function TaskDetail({
  task,
  subtasks,
  profiles,
  userId,
  existingTimer,
  totalSeconds: totalSecondsProp,
  taskStages = [],
}: {
  task: Task;
  subtasks: Subtask[];
  profiles: Profile[];
  userId: string;
  existingTimer: ExistingTimer;
  totalSeconds: number;
  taskStages?: TaskStage[];
}) {
  const stages = taskStages.length > 0 ? taskStages : DEFAULT_TASK_STAGES;
  const router = useRouter();
  const supabase = createClient();
  const [status, setStatus] = useState(task.status);
  const [description, setDescription] = useState(task.description ?? "");
  const [saving, setSaving] = useState(false);

  async function handleStatusChange(newStatus: string) {
    setSaving(true);
    // On complete, optional numeric_data (e.g. "LinkedIn messages sent: 50") can be captured
    const numericDataText = newStatus === "completed" ? (window.prompt("Numeric data (optional, e.g. 'emails sent: 20')") ?? null) : null;
    const { error } = await supabase
      .from("tasks")
      .update({
        status: newStatus,
        completed_at: newStatus === "completed" ? new Date().toISOString() : null,
        ...(numericDataText ? { numeric_data: { value: numericDataText } } : {}),
      })
      .eq("id", task.id);
    setSaving(false);
    if (error) {
      toast.error("Failed to update status");
      return;
    }
    setStatus(newStatus);
    router.refresh();
  }

  async function handleSaveDescription() {
    setSaving(true);
    const { error } = await supabase
      .from("tasks")
      .update({ description: description || null })
      .eq("id", task.id);
    setSaving(false);
    if (error) {
      toast.error("Failed to save");
      return;
    }
    router.refresh();
  }

  async function addSubtask() {
    const title = window.prompt("Subtask title");
    if (!title?.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase.from("profiles").select("id").eq("id", user.id).single();
    const { error } = await supabase.from("tasks").insert({
      title: title.trim(),
      parent_task_id: task.id,
      status: "pending",
      created_by_id: profile?.id ?? user.id,
    });
    if (error) {
      toast.error("Failed to add subtask");
      return;
    }
    toast.success("Subtask added");
    router.refresh();
  }

  async function updateSubtaskStatus(subtaskId: string, newStatus: string) {
    const { error } = await supabase
      .from("tasks")
      .update({
        status: newStatus,
        completed_at: newStatus === "completed" ? new Date().toISOString() : null,
      })
      .eq("id", subtaskId);
    if (error) {
      toast.error("Failed to update subtask");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">{task.title}</h2>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge>{status.replace("_", " ")}</Badge>
              {task.is_recurring && <Badge variant="secondary">Recurring</Badge>}
              <span className="text-sm text-muted-foreground">
                Created {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm">Status</Label>
            <Select value={status} onValueChange={handleStatusChange} disabled={saving}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {stages.map((s) => (
                  <SelectItem key={s.id} value={s.slug}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {userId && (
              <TaskTimerClient
                taskId={task.id}
                userId={userId}
                existingTimer={existingTimer}
                totalSeconds={totalSecondsProp}
                onStop={() => router.refresh()}
              />
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleSaveDescription}
              rows={3}
              className="mt-1"
            />
          </div>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Total time: {formatDuration(totalSecondsProp)}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {task.task_assignees?.map((a) => { const p = Array.isArray(a.profiles) ? a.profiles[0] : a.profiles; return p?.full_name || p?.email; }).join(", ") || "—"}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h3 className="font-semibold">Subtasks</h3>
          <Button size="sm" variant="outline" onClick={addSubtask}>
            <Plus className="h-4 w-4 mr-1" />
            Add subtask
          </Button>
        </CardHeader>
        <CardContent>
          {subtasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No subtasks. Add one to break down the work.</p>
          ) : (
            <ul className="space-y-2">
              {subtasks.map((st) => {
                const stSeconds = st.task_timers?.reduce((s, t) => s + (t.duration_seconds || 0), 0) ?? 0;
                return (
                  <li
                    key={st.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{st.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDuration(stSeconds)} · {st.status.replace("_", " ")}
                      </p>
                      {userId && (
                        <SubtaskTimerWrapper
                          taskId={task.id}
                          subtaskId={st.id}
                          userId={userId}
                        />
                      )}
                    </div>
                    <Select
                      value={st.status}
                      onValueChange={(v) => updateSubtaskStatus(st.id, v)}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {stages.map((s) => (
                          <SelectItem key={s.id} value={s.slug}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
