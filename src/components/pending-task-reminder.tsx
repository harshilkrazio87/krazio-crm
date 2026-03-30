"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Bell, ListTodo } from "lucide-react";

const STORAGE_KEY = "pending_task_reminder_last_shown";
const DEFAULT_INTERVAL_MS = 3 * 60 * 60 * 1000; // 3 hours
const ONE_HOUR_MS = 60 * 60 * 1000;

type PendingTask = { id: string; title: string; due_date: string | null; priority?: string };

function usePendingTasks() {
  const [tasks, setTasks] = useState<PendingTask[]>([]);
  const fetchTasks = useCallback(async (): Promise<PendingTask[]> => {
    try {
      const res = await fetch("/api/tasks/pending");
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
        return data;
      }
    } catch (_) {}
    setTasks([]);
    return [];
  }, []);
  return { tasks, fetchTasks };
}

function playBeep() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 800;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  } catch (_) {}
}

export function PendingTaskReminder() {
  const router = useRouter();
  const { tasks, fetchTasks } = usePendingTasks();
  const [open, setOpen] = useState(false);
  const [intervalMs, setIntervalMs] = useState(DEFAULT_INTERVAL_MS);
  const lastShownRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const stored = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (stored) lastShownRef.current = Number(stored);
    const storedInterval = typeof localStorage !== "undefined" ? localStorage.getItem("pending_reminder_interval_hours") : null;
    if (storedInterval) {
      const h = Number(storedInterval);
      if (h >= 1) setIntervalMs(h * 60 * 60 * 1000);
    }
  }, []);

  const showReminder = useCallback(async () => {
    const list = await fetchTasks();
    if (list.length === 0) return;
    lastShownRef.current = Date.now();
    if (typeof localStorage !== "undefined") localStorage.setItem(STORAGE_KEY, String(lastShownRef.current));
    playBeep();
    setOpen(true);
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Pending tasks", { body: `You have ${list.length} pending task(s).`, icon: "/favicon.ico" });
    }
  }, [fetchTasks]);

  useEffect(() => {
    const check = async () => {
      const now = Date.now();
      if (now - lastShownRef.current >= intervalMs) await showReminder();
    };
    check();
    timerRef.current = setInterval(check, 60 * 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [intervalMs, showReminder]);

  useEffect(() => {
    if (open) fetchTasks();
  }, [open, fetchTasks]);

  const requestNotificationPermission = () => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  };

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  const remindInOneHour = () => {
    lastShownRef.current = Date.now();
    if (typeof localStorage !== "undefined") localStorage.setItem(STORAGE_KEY, String(lastShownRef.current));
    setIntervalMs(ONE_HOUR_MS);
    if (typeof localStorage !== "undefined") localStorage.setItem("pending_reminder_interval_hours", "1");
    setOpen(false);
  };

  const markAllInProgress = async () => {
    const max = 5;
    const toUpdate = tasks.slice(0, max).map((t) => t.id);
    for (const id of toUpdate) {
      await fetch("/api/tasks/" + id + "/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "in_progress" }),
      });
    }
    setOpen(false);
    router.push("/tasks");
    router.refresh();
  };

  const displayTasks = tasks.slice(0, 5);
  const moreCount = tasks.length > 5 ? tasks.length - 5 : 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Pending task reminder
          </DialogTitle>
          <DialogDescription>
            You have {tasks.length} pending task(s). Here are the first few.
          </DialogDescription>
        </DialogHeader>
        <ul className="space-y-2 max-h-[200px] overflow-y-auto">
          {displayTasks.map((t) => (
            <li key={t.id} className="flex items-center gap-2 text-sm">
              <ListTodo className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{t.title}</span>
              {t.due_date && (
                <span className="text-muted-foreground shrink-0">
                  {new Date(t.due_date).toLocaleDateString()}
                </span>
              )}
            </li>
          ))}
          {moreCount > 0 && (
            <li className="text-sm text-muted-foreground">… and {moreCount} more</li>
          )}
        </ul>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button onClick={markAllInProgress}>Mark all in progress</Button>
          <Button variant="outline" onClick={() => { setOpen(false); router.push("/tasks"); }}>
            View tasks
          </Button>
          <Button variant="ghost" onClick={remindInOneHour}>Remind me in 1 hour</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
