"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Repeat, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

type TaskRow = {
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
  task_assignees?: { profiles: { full_name: string | null } | { full_name: string | null }[] | null }[];
  task_timers?: { duration_seconds: number }[];
};

export function TaskList({ tasks }: { tasks: TaskRow[] }) {
  if (!tasks.length) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
          <p>No tasks yet.</p>
          <Link href="/tasks/new" className="text-primary hover:underline mt-2">
            Create your first task
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => {
        const totalSeconds = task.task_timers?.reduce((s, t) => s + (t.duration_seconds || 0), 0) ?? 0;
        const assigneeNames = task.task_assignees
          ?.map((a) => (Array.isArray(a.profiles) ? a.profiles[0]?.full_name : a.profiles?.full_name))
          .filter(Boolean)
          .join(", ") || "—";
        return (
          <Link key={task.id} href={`/tasks/${task.id}`}>
            <Card className="transition-colors hover:bg-accent/50">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{task.title}</h3>
                  <Badge
                    variant={task.status === "completed" ? "default" : "secondary"}
                    className={cn(
                      task.status === "in_progress" && "bg-primary/20 text-primary"
                    )}
                  >
                    {task.status.replace("_", " ")}
                  </Badge>
                </div>
                {task.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {task.description}
                  </p>
                )}
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {assigneeNames}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {totalSeconds >= 3600
                    ? `${Math.floor(totalSeconds / 3600)}h ${Math.floor((totalSeconds % 3600) / 60)}m`
                    : `${Math.floor(totalSeconds / 60)}m`}
                </span>
                {task.is_recurring && (
                  <span className="flex items-center gap-1">
                    <Repeat className="h-3.5 w-3.5" />
                    Recurring
                  </span>
                )}
                <span>
                  {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
                </span>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
