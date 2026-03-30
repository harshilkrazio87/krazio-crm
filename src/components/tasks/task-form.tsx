"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { logActivity } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { toast } from "sonner";
import { GripVertical, X } from "lucide-react";

type Profile = { id: string; full_name: string | null; email: string };

const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
const WEEKDAY_LABELS: Record<string, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

type RecurState = {
  recurType: "interval" | "weekday" | null;
  recurIntervalDays: number;
  recurWeekdays: string[];
  recurEndDate: string;
};

const defaultRecur: RecurState = {
  recurType: null,
  recurIntervalDays: 7,
  recurWeekdays: [],
  recurEndDate: "",
};

type SubtaskRow = {
  id: string;
  title: string;
  priority: string;
  recur: RecurState;
};

function RecurPreview({ recur }: { recur: RecurState }) {
  if (!recur.recurType) return null;
  if (recur.recurType === "interval") {
    return (
      <p className="text-sm text-muted-foreground">
        This task will repeat every {recur.recurIntervalDays} day{recur.recurIntervalDays !== 1 ? "s" : ""}
        {recur.recurEndDate ? ` until ${new Date(recur.recurEndDate).toLocaleDateString()}` : ""}.
      </p>
    );
  }
  if (recur.recurWeekdays.length === 0) return null;
  const labels = recur.recurWeekdays.map((d) => WEEKDAY_LABELS[d] || d).join(" and ");
  return (
    <p className="text-sm text-muted-foreground">
      This task will repeat every {labels}
      {recur.recurEndDate ? ` until ${new Date(recur.recurEndDate).toLocaleDateString()}` : ""}.
    </p>
  );
}

export function TaskForm({ profiles }: { profiles: Profile[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [mainRecur, setMainRecur] = useState<RecurState>(defaultRecur);
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [taskAdminId, setTaskAdminId] = useState<string>("");
  const [addSubtasks, setAddSubtasks] = useState(false);
  const [subtaskInput, setSubtaskInput] = useState("");
  const [subtasks, setSubtasks] = useState<SubtaskRow[]>([]);
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<string>("medium");

  function addSubtask() {
    const t = subtaskInput.trim();
    if (!t) return;
    setSubtasks((prev) => [...prev, { id: crypto.randomUUID(), title: t, priority: "medium", recur: { ...defaultRecur } }]);
    setSubtaskInput("");
  }

  function removeSubtask(id: string) {
    setSubtasks((prev) => prev.filter((s) => s.id !== id));
  }

  function updateSubtask(id: string, field: "title" | "priority" | "recur", value: string | RecurState) {
    setSubtasks((prev) =>
      prev.map((s) =>
        s.id === id
          ? field === "recur"
            ? { ...s, recur: value as RecurState }
            : { ...s, [field]: value }
          : s
      )
    );
  }

  function toggleSubtaskWeekday(subtaskId: string, day: string) {
    setSubtasks((prev) =>
      prev.map((s) => {
        if (s.id !== subtaskId) return s;
        const next = s.recur.recurWeekdays.includes(day)
          ? s.recur.recurWeekdays.filter((d) => d !== day)
          : [...s.recur.recurWeekdays, day];
        return { ...s, recur: { ...s.recur, recurWeekdays: next } };
      })
    );
  }

    async function handleSubmit(e: React.FormEvent) {
      e.preventDefault();
      if (!title.trim() || !description.trim()) {
        toast.error("Enter a title and description");
        return;
      }
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data: profile } = await supabase.from("profiles").select("id").eq("id", user.id).single();
      const createdBy = profile?.id ?? user.id;

      const mainPayload: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim() || null,
        task_admin_id: taskAdminId || null,
        created_by_id: createdBy,
        is_recurring: isRecurring,
        recurrence_rule: isRecurring
          ? {
              type: mainRecur.recurType,
              interval_days: mainRecur.recurType === "interval" ? mainRecur.recurIntervalDays : null,
              weekdays: mainRecur.recurType === "weekday" ? mainRecur.recurWeekdays : null,
              end_date: mainRecur.recurEndDate || null,
            }
          : null,
        status: "pending",
        parent_task_id: null,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        priority: priority || "medium",
      };
      if (mainRecur.recurType) {
        (mainPayload as Record<string, unknown>).recur_type = mainRecur.recurType;
        (mainPayload as Record<string, unknown>).recur_interval_days = mainRecur.recurType === "interval" ? mainRecur.recurIntervalDays : null;
        (mainPayload as Record<string, unknown>).recur_weekdays = mainRecur.recurType === "weekday" ? mainRecur.recurWeekdays : null;
        (mainPayload as Record<string, unknown>).recur_end_date = mainRecur.recurEndDate ? new Date(mainRecur.recurEndDate).toISOString() : null;
        (mainPayload as Record<string, unknown>).is_recurring_template = true;
      }

      const { data: task, error } = await supabase.from("tasks").insert(mainPayload).select("id").single();

      if (error) {
        toast.error("Failed to create task", { description: error.message });
        setLoading(false);
        return;
      }

      if (task && assigneeIds.length > 0) {
        await supabase.from("task_assignees").insert(assigneeIds.map((user_id) => ({ task_id: task.id, user_id })));
        const { data: { user } } = await supabase.auth.getUser();
        const taskTitle = (mainPayload.title as string) ?? "Task";
        for (const uid of assigneeIds) {
          if (uid === user?.id) continue;
          await supabase.from("notifications").insert({
            user_id: uid,
            title: "Task assigned",
            message: `You were assigned to "${taskTitle}".`,
            type: "task",
            link: `/tasks/${task.id}`,
          });
        }
      }

      if (task) {
        logActivity("create_task", "task", task.id, { title: mainPayload.title }).catch(() => {});
      }
      if (task && addSubtasks && subtasks.length > 0) {
        for (const st of subtasks) {
          const subPayload: Record<string, unknown> = {
            title: st.title.trim(),
            parent_task_id: task.id,
            status: "pending",
            created_by_id: createdBy,
            priority: st.priority || "medium",
          };
          if (st.recur.recurType) {
            (subPayload as Record<string, unknown>).recur_type = st.recur.recurType;
            (subPayload as Record<string, unknown>).recur_interval_days = st.recur.recurType === "interval" ? st.recur.recurIntervalDays : null;
            (subPayload as Record<string, unknown>).recur_weekdays = st.recur.recurType === "weekday" ? st.recur.recurWeekdays : null;
            (subPayload as Record<string, unknown>).recur_end_date = st.recur.recurEndDate ? new Date(st.recur.recurEndDate).toISOString() : null;
          }
          await supabase.from("tasks").insert(subPayload);
        }
      } 
      
      toast.success("Task created");
      router.push("/tasks");
      router.refresh();
      setLoading(false);
    }

  return (
    <Card>
  <CardHeader>
    <h2 className="text-lg sm:text-xl font-semibold">Task details</h2>
  </CardHeader>

  <CardContent className="p-4 sm:p-6">
    <form onSubmit={handleSubmit} className="space-y-4">

      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title"
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description"
          rows={3}
          className="w-full"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Due date</Label>
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Priority</Label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4 border-t pt-4">
        <div className="flex items-center gap-2">
          <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
          <Label>Recurring task</Label>
        </div>

        {isRecurring && (
          <div className="space-y-4 rounded-lg border p-4 bg-muted/30">

            {/* TYPE */}
            <div className="flex flex-col sm:flex-row gap-3">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={mainRecur.recurType === "interval"}
                  onChange={() =>
                    setMainRecur((r) => ({
                      ...r,
                      recurType: "interval",
                      recurWeekdays: [],
                    }))
                  }
                />
                Every X days
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={mainRecur.recurType === "weekday"}
                  onChange={() =>
                    setMainRecur((r) => ({
                      ...r,
                      recurType: "weekday",
                    }))
                  }
                />
                Weekdays
              </label>
            </div>

            {mainRecur.recurType === "interval" && (
              <div className="flex flex-wrap items-center gap-2">
                <span>Every</span>
                <Input
                  type="number"
                  className="w-20"
                  value={mainRecur.recurIntervalDays || ""}
                  onChange={(e) =>
                    setMainRecur((r) => ({
                      ...r,
                      recurIntervalDays: parseInt(e.target.value) || 1,
                    }))
                  }
                />
                <span>days</span>
              </div>
            )}

            {mainRecur.recurType === "weekday" && (
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map((d) => (
                  <label key={d} className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={mainRecur.recurWeekdays.includes(d)}
                      onChange={() =>
                        setMainRecur((r) => ({
                          ...r,
                          recurWeekdays: r.recurWeekdays.includes(d)
                            ? r.recurWeekdays.filter((x) => x !== d)
                            : [...r.recurWeekdays, d],
                        }))
                      }
                    />
                    {WEEKDAY_LABELS[d]}
                  </label>
                ))}
              </div>
            )}

            <div>
              <Label>Repeat until</Label>
              <Input
                type="date"
                value={mainRecur.recurEndDate}
                onChange={(e) =>
                  setMainRecur((r) => ({
                    ...r,
                    recurEndDate: e.target.value,
                  }))
                }
              />
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Assignees</Label>
        <Select>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select assignee" />
          </SelectTrigger>
          <SelectContent>
            {profiles.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.full_name || p.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4 border-t pt-4">
        <div className="flex items-center gap-2">
          <Switch checked={addSubtasks} onCheckedChange={setAddSubtasks} />
          <Label>Add Subtasks</Label>
        </div>

        {addSubtasks && (
          <>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                value={subtaskInput}
                onChange={(e) => setSubtaskInput(e.target.value)}
                className="flex-1"
              />
              <Button type="button" className="w-full sm:w-auto" onClick={addSubtask}>
                Add
              </Button>
            </div>

            <ul className="space-y-2">
              {subtasks.map((st) => (
                <li key={st.id} className="border rounded-lg p-3 space-y-2">

                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      value={st.title}
                      onChange={(e) =>
                        updateSubtask(st.id, "title", e.target.value)
                      }
                      className="flex-1"
                    />

                    <Select>
                      <SelectTrigger className="w-full sm:w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeSubtask(st.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <Button type="submit" className="w-full sm:w-auto">
          Create task
        </Button>

        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>

    </form>
  </CardContent>
</Card>
  );
}