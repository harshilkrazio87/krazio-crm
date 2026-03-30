"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import Link from "next/link";

const CHECK_INTERVAL_MS = 60_000;
const WINDOW_MINUTES = 35;
const REMIND_AT_MINUTES = [30, 20, 10];

export function MeetingReminder() {
  const shownRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const supabase = createClient();

    async function checkMeetings() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("id").eq("id", user.id).single();
      const userId = profile?.id ?? user.id;

      const now = new Date();
      const windowEnd = new Date(now.getTime() + WINDOW_MINUTES * 60 * 1000);

      const { data: meetings } = await supabase
        .from("lead_meetings")
        .select("id, lead_id, scheduled_at, meeting_link, title, leads(company_name, owner_id)")
        .gte("scheduled_at", now.toISOString())
        .lte("scheduled_at", windowEnd.toISOString())
        .eq("completed", false);

      if (!meetings?.length) return;

      for (const m of meetings) {
        const lead = Array.isArray(m.leads) ? m.leads[0] : m.leads;
        const ownerId = (lead as { owner_id?: string })?.owner_id;
        if (ownerId !== userId) continue;

        const scheduled = new Date(m.scheduled_at);
        const minsLeft = Math.round((scheduled.getTime() - now.getTime()) / 60000);

        for (const at of REMIND_AT_MINUTES) {
          if (minsLeft <= at && minsLeft > at - 2) {
            const key = `${m.id}-${at}`;
            if (shownRef.current.has(key)) continue;
            shownRef.current.add(key);

            const companyName = (lead as { company_name?: string })?.company_name ?? "Meeting";
            const link = m.meeting_link || `/leads/${m.lead_id}`;
            toast.info(`Meeting in ${at} mins: ${companyName}`, {
              description: m.title ?? (m.meeting_link ? "Link in description" : "View lead"),
              action: (
                <Link href={link} className="text-primary font-medium">
                  Open
                </Link>
              ),
              duration: 10000,
            });

            if (typeof Notification !== "undefined" && Notification.permission === "granted") {
              new Notification(`Meeting in ${at} mins: ${companyName}`, {
                body: m.title ?? link,
              });
            }
          }
        }
      }
    }

    checkMeetings();
    const id = setInterval(checkMeetings, CHECK_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return null;
}
