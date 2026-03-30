"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import {
  List,
  LayoutGrid,
  Filter,
  Plus,
  Pencil,
  Clock,
  Trash2,
  ListTodo,
} from "lucide-react";
import { format } from "date-fns";
import { formatDuration } from "@/lib/utils";
import { getTaskColors } from "@/lib/utils/task-colors";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type TaskForPage = {
  id: string;
  title: string;
  status: string;
  priority: string | null;
  due_date: string | null;
  is_recurring_template?: boolean | null;
  task_assignees?: {
    user_id: string;
    profiles:
      | { full_name: string | null; email: string; avatar_url?: string | null }
      | {
          full_name: string | null;
          email: string;
          avatar_url?: string | null;
        }[]
      | null;
  }[];
  task_timers?: {
    id: string;
    ended_at: string | null;
    duration_seconds: number;
  }[];
};

type Profile = {
  id?: string;
  full_name: string | null;
  email: string;
  avatar_url?: string | null;
};

function getInitials(name: string | null, email: string) {
  if (name?.trim())
    return name
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  return (email ?? "").slice(0, 2).toUpperCase();
}

function AssigneeAvatar({ p }: { p: Profile }) {
  if (p?.avatar_url)
    return (
      <img
        src={p.avatar_url}
        alt=""
        className="h-6 w-6 rounded-full object-cover shrink-0"
      />
    );
  return (
    <span className="h-6 w-6 rounded-full bg-primary/15 flex items-center justify-center text-xs font-medium text-primary shrink-0">
      {getInitials(p?.full_name ?? null, p?.email ?? "")}
    </span>
  );
}

const DEFAULT_STAGES = [
  {
    id: "pending",
    name: "Pending",
    slug: "pending",
    color: "#F59E0B",
    order_index: 0,
  },
  {
    id: "in_progress",
    name: "In Progress",
    slug: "in_progress",
    color: "#3B82F6",
    order_index: 1,
  },
  {
    id: "completed",
    name: "Completed",
    slug: "completed",
    color: "#22C55E",
    order_index: 2,
  },
  {
    id: "cancelled",
    name: "Cancelled",
    slug: "cancelled",
    color: "#6B7280",
    order_index: 3,
  },
];

export type TaskStage = {
  id: string;
  name: string;
  slug: string;
  color?: string | null;
  order_index?: number;
};

const PRIORITY_OPTIONS = ["all", "high", "medium", "low"];
const DUE_OPTIONS = ["all", "today", "this_week", "overdue"];

export function TasksPageView({
  tasks: initialTasks,
  profiles,
  subtaskCounts,
  taskStages = [],
}: {
  tasks: TaskForPage[];
  profiles: Profile[];
  subtaskCounts: Record<string, { total: number; completed: number }>;
  taskStages?: TaskStage[];
}) {
  const stages = taskStages.length > 0 ? taskStages : DEFAULT_STAGES;
  const statusOptions = ["all", "overdue", ...stages.map((s) => s.slug)];
  const router = useRouter();
  const supabase = createClient();
  const [view, setView] = useState<"list" | "board">("board");
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [dueFilter, setDueFilter] = useState("all");
  const [tasksState, setTasksState] = useState(initialTasks);

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);
  const weekEnd = new Date(todayStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const tasks = useMemo(() => {
    return tasksState.filter((t) => {
      const status = t.status;
      if (statusFilter !== "all" && statusFilter !== "overdue") {
        if (status !== statusFilter) return false;
      }
      // statusFilter "overdue" is handled in dueFilter below via status
      if (
        statusFilter === "overdue" &&
        (status === "completed" ||
          !t.due_date ||
          new Date(t.due_date) >= todayEnd)
      )
        return false;
      if (
        priorityFilter !== "all" &&
        (t.priority ?? "medium") !== priorityFilter
      )
        return false;
      if (assigneeFilter !== "all") {
        const assigneeIds = t.task_assignees?.map((a) => a.user_id) ?? [];
        if (!assigneeIds.includes(assigneeFilter)) return false;
      }
      if (dueFilter !== "all") {
        const due = t.due_date ? new Date(t.due_date) : null;
        if (!due) return false;
        if (dueFilter === "today" && (due < todayStart || due >= todayEnd))
          return false;
        if (dueFilter === "this_week" && (due < todayStart || due >= weekEnd))
          return false;
        if (
          dueFilter === "overdue" &&
          (due >= todayStart || status === "completed")
        )
          return false;
      }
      return true;
    });
  }, [
    tasksState,
    statusFilter,
    priorityFilter,
    assigneeFilter,
    dueFilter,
    todayStart,
    todayEnd,
    weekEnd,
  ]);

  const byStatus = useMemo(() => {
    const map: Record<string, TaskForPage[]> = {};
    for (const s of stages)
      map[s.slug] = tasks.filter((t) => t.status === s.slug);
    const other = tasks.filter((t) => !stages.some((s) => s.slug === t.status));
    if (other.length > 0) map["_other"] = other;
    return { map, stages };
  }, [tasks, stages]);

 
  async function handleDragEnd(result: DropResult) {
  if (!result.destination) return;
  const taskId = result.draggableId;
  let newStatus = result.destination.droppableId;
  if (newStatus === "_other") newStatus = "pending";
  setTasksState((prev) =>
    prev.map((t) =>
      t.id === taskId
        ? {
            ...t,
            status: newStatus,
            completed_at:
              newStatus === "completed"
                ? new Date().toISOString()
                : null,
          }
        : t
    )
  );
  const { error } = await supabase
    .from("tasks")
    .update({
      status: newStatus,
      completed_at:
        newStatus === "completed" ? new Date().toISOString() : null,
    })
    .eq("id", taskId);
  if (error) {
    toast.error("Failed to update task");
    setTasksState(initialTasks);
  } else {
    toast.success("Task updated");
  }
}

  // async function deleteTask(e: React.MouseEvent, taskId: string) {
  //   e.preventDefault();
  //   e.stopPropagation();
  //   if (!confirm("Delete this task?")) return;
  //   const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
  //   const data = await res.json().catch(() => ({}));
  //   if (!res.ok) {
  //     toast.error("Failed to delete", {
  //       description: (data as { error?: string }).error || res.statusText,
  //     });
  //     return;
  //   }
  //   toast.success("Task deleted");
  //   router.refresh();
  // }
  async function deleteTask(e: React.MouseEvent, taskId: string) {
  e.preventDefault();
  e.stopPropagation();

  if (!confirm("Delete this task?")) return;

  const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    toast.error("Failed to delete", {
      description: data.error || res.statusText,
    });
    return;
  }

  // ✅ UI instantly update
  setTasksState((prev) => prev.filter((t) => t.id !== taskId));

  toast.success("Task deleted");
}

  function taskCard(t: TaskForPage) {
    const assignee = t.task_assignees?.[0];
    const p =
      assignee &&
      (Array.isArray(assignee.profiles)
        ? assignee.profiles[0]
        : assignee.profiles);
    const hasRunningTimer = t.task_timers?.some((x) => !x.ended_at);
    const totalSeconds =
      t.task_timers?.reduce((s, x) => s + (x.duration_seconds ?? 0), 0) ?? 0;
    const sub = subtaskCounts[t.id];
    const due = t.due_date ? new Date(t.due_date) : null;
    const colors = getTaskColors(
      t.status,
      t.priority ?? "medium",
      t.due_date,
      t.is_recurring_template ?? false,
    );
    const isOverdue =
      due &&
      due < todayStart &&
      t.status !== "completed" &&
      !t.is_recurring_template;

    return (
      <Link href={`/tasks/${t.id}`}>
        <Card
          className={cn(
            "cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow",
            colors.cardBorder,
          )}
        >
          <CardContent className="p-3 space-y-2">
            <p className="font-semibold text-sm">{t.title}</p>
            <div className="flex flex-wrap gap-1">
              <Badge className={cn("text-xs", colors.priorityBadge)}>
                {t.priority ?? "medium"}
              </Badge>
            </div>
            {due && (
              <p
                className={cn(
                  "text-xs",
                  isOverdue && "text-red-600 font-medium",
                )}
              >
                {isOverdue ? "⚠️ " : "📅 "}Due {format(due, "MMM d")}
              </p>
            )}
            <div className="flex items-center justify-between">
              {p ? (
                <AssigneeAvatar p={p} />
              ) : (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs">
                  —
                </span>
              )}
              {sub && sub.total > 0 && (
                <span className="text-xs text-muted-foreground">
                  {sub.completed}/{sub.total} subtasks
                </span>
              )}
              {hasRunningTimer && (
                <span
                  className="h-2 w-2 rounded-full bg-green-500 animate-pulse"
                  title="Timer running"
                />
              )}
            </div>
            {totalSeconds > 0 && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDuration(totalSeconds)}
              </p>
            )}
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Title Section */}
        <div className="flex items-center justify-between sm:justify-start gap-2">
          <h1 className="text-xl sm:text-2xl font-bold">Tasks</h1>
          <Badge variant="secondary">{tasks.length}</Badge>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
          <Button
            className="flex-1 sm:flex-none"
            variant={view === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("list")}
          >
            <List className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">List</span>
          </Button>

          <Button
            className="flex-1 sm:flex-none"
            variant={view === "board" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("board")}
          >
            <LayoutGrid className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Board</span>
          </Button>

          <Button
            className="flex-1 sm:flex-none"
            variant="outline"
            size="sm"
            onClick={() => setFilterOpen((o) => !o)}
          >
            <Filter className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Filter</span>
          </Button>

          <Button asChild className="w-full sm:w-auto">
            <Link href="/tasks/new">
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Link>
          </Button>
        </div>
      </div>

      {filterOpen && (
        <Card className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  {stages.map((s) => (
                    <SelectItem key={s.id} value={s.slug}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Priority</label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p === "all" ? "All" : p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Assignee</label>
              <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {profiles.map((p) => (
                    <SelectItem key={p.id ?? p.email} value={p.id ?? ""}>
                      {p.full_name || p.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Due</label>
              <Select value={dueFilter} onValueChange={setDueFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DUE_OPTIONS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d === "all"
                        ? "All"
                        : d === "this_week"
                          ? "This Week"
                          : d === "overdue"
                            ? "Overdue"
                            : "Today"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>
      )}

      {view === "board" && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4  gap-4">
            {byStatus.stages.map((col) => {
              const colTasks = byStatus.map[col.slug] ?? [];
              return (
                <div key={col.id} className="rounded-lg border bg-muted/20 p-3">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: col.color ?? "#6366f1" }}
                    />
                    {col.name}
                    <Badge variant="secondary" className="text-xs">
                      {colTasks.length}
                    </Badge>
                  </h3>
                  <Droppable droppableId={col.slug}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="space-y-2 min-h-[200px]"
                      >
                        {colTasks.length === 0 ? (
                          <Card className="border border-dashed bg-transparent">
                            <CardContent className="p-4 text-center text-sm text-muted-foreground">
                              No tasks here
                            </CardContent>
                          </Card>
                        ) : (
                          colTasks.map((t, idx) => (
                            <Draggable
                              key={t.id}
                              draggableId={t.id}
                              index={idx}
                            >
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                >
                                  {taskCard(t)}
                                </div>
                              )}
                            </Draggable>
                          ))
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
            {(byStatus.map["_other"]?.length ?? 0) > 0 && (
              <div
                key="_other"
                className="rounded-lg border bg-muted/20 p-3 min-h-[280px] shrink-0 w-[280px]"
              >
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-muted-foreground" />
                  Other
                  <Badge variant="secondary" className="text-xs">
                    {byStatus.map["_other"].length}
                  </Badge>
                </h3>
                <Droppable droppableId="_other">
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="space-y-2 min-h-[200px]"
                    >
                      {byStatus.map["_other"].map((t, idx) => (
                        <Draggable key={t.id} draggableId={t.id} index={idx}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              {taskCard(t)}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            )}
          </div>
        </DragDropContext>
      )}

      {view === "list" && (
        <>
          {tasks.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <ListTodo className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg">No tasks yet</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Create your first task to get started.
                </p>
                <Button asChild className="mt-4">
                  <Link href="/tasks/new">Create your first task →</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                     <th className="text-left p-2">Title</th>
                    <th className="text-left p-2">Priority</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Assignee</th>
                    <th className="text-left p-2">Due Date</th>
                    <th className="text-left p-2">Time Spent</th>
                    <th className="text-left p-2 w-24">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((t) => {
                    const assignee = t.task_assignees?.[0];
                    const p =
                      assignee &&
                      (Array.isArray(assignee.profiles)
                        ? assignee.profiles[0]
                        : assignee.profiles);
                    const totalSeconds =
                      t.task_timers?.reduce(
                        (s, x) => s + (x.duration_seconds ?? 0),
                        0,
                      ) ?? 0;
                    const due = t.due_date ? new Date(t.due_date) : null;
                    const colors = getTaskColors(
                      t.status,
                      t.priority ?? "medium",
                      t.due_date,
                      t.is_recurring_template ?? false,
                    );
                    const isOverdue =
                      due &&
                      due < todayStart &&
                      t.status !== "completed" &&
                      !t.is_recurring_template;
                    return (
                      <tr
                        key={t.id}
                        className={cn(
                          "border-b hover:brightness-95 transition cursor-pointer",
                          colors.cardBorder,
                        )}
                        onClick={() => router.push(`/tasks/${t.id}`)}
                      >
                        <td className="p-2 font-medium">{t.title}</td>
                        <td className="p-2">
                          <Badge className={colors.priorityBadge}>
                            {t.priority ?? "medium"}
                          </Badge>
                        </td>
                        <td className="p-2">{t.status.replace("_", " ")}</td>
                        <td className="p-2">
                          {p ? (
                            <AssigneeAvatar p={p} />
                          ) : (
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs">
                              —
                            </span>
                          )}
                        </td>
                        <td className="p-2">
                          {due ? (
                            <span className={cn(isOverdue && "text-red-600")}>
                              {format(due, "MMM d, yyyy")}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="p-2">{formatDuration(totalSeconds)}</td>
                        <td
                          className="p-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              asChild
                            >
                              <Link href={`/tasks/${t.id}`}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              asChild
                            >
                              <Link href={`/tasks/${t.id}`}>
                                <Clock className="h-3.5 w-3.5" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={(e) => deleteTask(e, t.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}