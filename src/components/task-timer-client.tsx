"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Square } from "lucide-react";
import { toast } from "sonner";
import { formatTimeHHMMSS } from "@/lib/utils";

type ExistingTimer = { id: string; started_at: string } | null;

type Props = {
  taskId: string;
  subtaskId?: string | null;
  userId: string;
  existingTimer: ExistingTimer;
  totalSeconds: number;
  onStop?: () => void;
  compact?: boolean;
};

export function TaskTimerClient({
  taskId,
  subtaskId,
  userId,
  existingTimer,
  totalSeconds: initialTotalSeconds,
  onStop,
  compact = false,
}: Props) {
  const [isRunning, setIsRunning] = useState(!!existingTimer);
  const [timerId, setTimerId] = useState<string | null>(existingTimer?.id ?? null);
  const [seconds, setSeconds] = useState(() => {
    if (existingTimer) {
      return Math.floor((Date.now() - new Date(existingTimer.started_at).getTime()) / 1000);
    }
    return 0;
  });
  const [totalSeconds, setTotalSeconds] = useState(initialTotalSeconds);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  async function handleStart() {
    try {
      const res = await fetch("/api/timer/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, subtask_id: subtaskId ?? null }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to start timer");
        return;
      }
      setTimerId(data.id);
      setSeconds(0);
      setIsRunning(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to start timer");
    }
  }

  async function handleStop() {
    if (!timerId) return;
    try {
      const res = await fetch("/api/timer/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timerId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to stop timer");
        return;
      }
      setTotalSeconds((t) => t + (data.duration_seconds ?? 0));
      setTimerId(null);
      setSeconds(0);
      setIsRunning(false);
      onStop?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to stop timer");
    }
  }

  const displayTotal = totalSeconds + (isRunning ? seconds : 0);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {!isRunning ? (
          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={handleStart}>
            <Play className="h-3.5 w-3.5 mr-1" />
            <span className="font-mono text-xs tabular-nums">{formatTimeHHMMSS(0)}</span>
          </Button>
        ) : (
          <>
            <span className="font-mono text-xs tabular-nums">
              {formatTimeHHMMSS(seconds)}
              <span className="ml-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
            </span>
            <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive" onClick={handleStop}>
              <Square className="h-3.5 w-3.5" />
            </Button>
          </>
        )}
        <span className="text-xs text-muted-foreground">Total: {formatTimeHHMMSS(displayTotal)}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-lg tabular-nums">
        {formatTimeHHMMSS(isRunning ? seconds : 0)}
        {isRunning && (
          <span className="ml-2 inline-flex h-2 w-2 animate-pulse rounded-full bg-green-500" />
        )}
      </span>
      {!isRunning ? (
        <Button size="sm" variant="outline" onClick={handleStart}>
          <Play className="h-4 w-4 mr-1" />
          Start Timer
        </Button>
      ) : (
        <Button size="sm" variant="destructive" onClick={handleStop}>
          <Square className="h-4 w-4 mr-1" />
          Stop Timer
        </Button>
      )}
      <span className="text-sm text-muted-foreground">
        Total: {formatTimeHHMMSS(displayTotal)}
      </span>
    </div>
  );
}
