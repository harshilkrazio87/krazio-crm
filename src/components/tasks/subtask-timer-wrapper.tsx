"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { TaskTimerClient } from "@/components/task-timer-client";

export function SubtaskTimerWrapper({
  taskId,
  subtaskId,
  userId,
}: {
  taskId: string;
  subtaskId: string;
  userId: string;
}) {
  const router = useRouter();
  const [existingTimer, setExistingTimer] = useState<{ id: string; started_at: string } | null | undefined>(undefined);
  const [totalSeconds, setTotalSeconds] = useState(0);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: open } = await supabase
        .from("task_timers")
        .select("id, started_at")
        .eq("task_id", taskId)
        .eq("subtask_id", subtaskId)
        .is("ended_at", null)
        .maybeSingle();
      setExistingTimer(open ?? null);

      const { data: all } = await supabase
        .from("task_timers")
        .select("duration_seconds")
        .eq("task_id", taskId)
        .eq("subtask_id", subtaskId)
        .not("ended_at", "is", null);
      const total = all?.reduce((sum, t) => sum + (t.duration_seconds ?? 0), 0) ?? 0;
      setTotalSeconds(total);
    }
    load();
  }, [taskId, subtaskId]);

  if (existingTimer === undefined) return null;

  return (
    <div className="flex items-center gap-2 mt-1">
      <TaskTimerClient
        taskId={taskId}
        subtaskId={subtaskId}
        userId={userId}
        existingTimer={existingTimer}
        totalSeconds={totalSeconds}
        compact
        onStop={() => router.refresh()}
      />
    </div>
  );
}
