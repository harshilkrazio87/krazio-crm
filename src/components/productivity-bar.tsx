"use client";

import { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Timer } from "lucide-react";

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function ProductivityBar() {
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [breakdown, setBreakdown] = useState<{ task_id: string; task_title: string; seconds: number }[]>([]);
  const [open, setOpen] = useState(false);

  const fetchToday = async () => {
    try {
      const res = await fetch("/api/productivity/today");
      if (res.ok) {
        const data = await res.json();
        setTotalSeconds(data.total_seconds ?? 0);
        setBreakdown(data.breakdown ?? []);
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchToday();
    const interval = setInterval(fetchToday, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground font-normal">
          <Timer className="h-4 w-4 mr-1" />
          Today: {formatDuration(totalSeconds)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <p className="font-medium text-sm mb-2">Today&apos;s time by task</p>
        <ul className="space-y-1.5 text-sm">
          {breakdown.length === 0 && <li className="text-muted-foreground">No time logged today.</li>}
          {breakdown.map((b) => (
            <li key={b.task_id} className="flex justify-between">
              <span className="truncate">{b.task_title}</span>
              <span className="text-muted-foreground shrink-0">{formatDuration(b.seconds)}</span>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
