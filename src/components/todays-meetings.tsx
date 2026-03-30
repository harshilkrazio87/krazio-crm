"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";

export type TodaysMeetingItem = {
  id: string;
  lead_id: string;
  scheduled_at: string;
  meeting_link: string | null;
  title: string | null;
  completed: boolean;
  leads: { company_name: string | null } | { company_name: string | null }[];
};

/** Today's meetings widget — used on dashboard and optionally in header */
export function TodaysMeetings({ meetings }: { meetings: TodaysMeetingItem[] }) {
  if (!meetings?.length) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Today&apos;s Meetings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No meetings today.</p>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Today&apos;s Meetings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {meetings.map((m) => {
            const lead = Array.isArray(m.leads) ? m.leads[0] : m.leads;
            const company = (lead as { company_name?: string | null })?.company_name ?? "—";
            const scheduled = new Date(m.scheduled_at);
            const meeting_time = scheduled.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            return (
              <li key={m.id} className="flex items-center justify-between gap-2 text-sm">
                <span>{meeting_time} — {company}</span>
                {m.meeting_link && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={m.meeting_link} target="_blank" rel="noopener noreferrer">Join</a>
                  </Button>
                )}
                {!m.meeting_link && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/leads/${m.lead_id}`}>View Lead</Link>
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

