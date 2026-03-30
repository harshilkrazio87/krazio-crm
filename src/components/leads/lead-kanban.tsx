"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { Plus, Trophy, XCircle, Calendar } from "lucide-react";

type Lead = {
  id: string;
  company_name: string | null;
  website: string | null;
  stage_id: string | null;
  created_at: string;
  lead_stages: { id: string; name: string; slug: string } | { id: string; name: string; slug: string }[] | null;
};

type Stage = { id: string; name: string; slug: string; order_index: number; requires_meeting?: boolean; is_won?: boolean; is_lost?: boolean };

export function LeadKanban({
  initialLeads,
  stages,
}: {
  initialLeads: Lead[];
  stages: Stage[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [scheduleLeadId, setScheduleLeadId] = useState<string | null>(null);
  const [meetingScheduledAt, setMeetingScheduledAt] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingAgenda, setMeetingAgenda] = useState("");
  const [meetingDuration, setMeetingDuration] = useState("");
  const [meetingSaving, setMeetingSaving] = useState(false);
  const [leadStages, setLeadStages] = useState(initialLeads);

  const leadsByStage = stages.map((stage) => ({
    ...stage,
    leads: leadStages.filter((l) => l.stage_id === stage.id),
  }));

  async function handleDragEnd(result: DropResult) {
  if (!result.destination) return;
  const sourceStage = result.source.droppableId;
  const destStageId = result.destination.droppableId;
  if (sourceStage === destStageId) return;
  const leadId = result.draggableId;
  const destStage = stages.find((s) => s.id === destStageId);
  const prevLeads = leadStages;
  setLeadStages((prev) =>
    prev.map((l) =>
      l.id === leadId ? { ...l, stage_id: destStageId } : l
    )
  );
  const { error } = await supabase
    .from("leads")
    .update({ stage_id: destStageId })
    .eq("id", leadId);
  if (error) {
    setLeadStages(prevLeads);
    toast.error("Failed to move lead", {
      description: error.message,
    });
    return;
  }
  toast.success("Lead moved");
  if (destStage?.requires_meeting) {
    setScheduleLeadId(leadId);
    setMeetingScheduledAt("");
    setMeetingLink("");
    setMeetingTitle("");
    setMeetingAgenda("");
    setMeetingDuration("");
  }
}

  async function submitScheduleMeeting() {
    if (!scheduleLeadId || !meetingScheduledAt.trim()) {
      toast.error("Date and time required");
      return;
    }
    setMeetingSaving(true);
    try {
      const res = await fetch("/api/lead-meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id: scheduleLeadId,
          scheduled_at: new Date(meetingScheduledAt).toISOString(),
          meeting_link: meetingLink.trim() || undefined,
          title: meetingTitle.trim() || undefined,
          agenda: meetingAgenda.trim() || undefined,
          duration_minutes: meetingDuration ? parseInt(meetingDuration, 10) : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed");
      }
      toast.success("Meeting scheduled");
      setScheduleLeadId(null);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setMeetingSaving(false);
    }
  }

  const stageColors: Record<string, string> = {
    new: "bg-slate-500",
    contacted: "bg-blue-500",
    meeting_scheduled: "bg-amber-500",
    meeting_done: "bg-cyan-500",
    proposal: "bg-purple-500",
    won: "bg-green-500",
    lost: "bg-red-500",
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div
  className="
    grid gap-4 pb-4 min-h-[350px]
    grid-cols-1 
    sm:grid-cols-2 
    md:grid-cols-3 
    lg:grid-cols-4 
  "
>
  {leadsByStage.map((stage) => {
    const isWon = stage.is_won === true;
    const isLost = stage.is_lost === true;

    const colBorder = isWon
      ? "border-green-500/50 bg-green-50/50 dark:bg-green-950/20"
      : isLost
      ? "border-red-500/50 bg-red-50/50 dark:bg-red-950/20"
      : "";

    return (
      <div
        key={stage.id}
        className={`w-full rounded-lg border p-3 ${
          colBorder || "bg-muted/30"
        }`}
      >
        {/* HEADER */}
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          {isWon && <Trophy className="h-4 w-4 text-green-600" />}
          {isLost && <XCircle className="h-4 w-4 text-red-600" />}
          {!isWon && !isLost && (
            <span
              className={`h-2 w-2 rounded-full ${
                stageColors[stage.slug] ?? "bg-gray-400"
              }`}
            />
          )}

          <span className="truncate">{stage.name}</span>

          <span className="text-sm font-normal text-muted-foreground ml-auto">
            {stage.leads.length} lead
            {stage.leads.length !== 1 ? "s" : ""}
          </span>
        </h3>

        {/* DROPPABLE AREA */}
        <Droppable droppableId={stage.id}>
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="space-y-2 min-h-[120px]"
            >
              {/* EMPTY STATE */}
              {stage.leads.length === 0 ? (
                <Link href="/leads/new">
                  <Card className="border border-dashed bg-transparent hover:bg-muted/50 transition-colors">
                    <CardContent className="p-4 text-center text-sm text-muted-foreground">
                      Drop leads here or + Add Lead
                    </CardContent>
                  </Card>
                </Link>
              ) : (
                stage.leads.map((lead, index) => (
                  <Draggable
                    key={lead.id}
                    draggableId={lead.id}
                    index={index}
                  >
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        <Link href={`/leads/${lead.id}`}>
                          <Card className="cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors">
                            <CardContent className="p-3">
                              <p className="font-medium text-sm truncate">
                                {lead.company_name || "Unnamed"}
                              </p>

                              {lead.website && (
                                <p className="text-xs text-muted-foreground truncate mt-0.5">
                                  {lead.website}
                                </p>
                              )}

                              <p className="text-xs text-muted-foreground mt-1">
                                {formatDistanceToNow(
                                  new Date(lead.created_at),
                                  { addSuffix: true }
                                )}
                              </p>
                            </CardContent>
                          </Card>
                        </Link>
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
</div>
      <Dialog open={!!scheduleLeadId} onOpenChange={(open) => !open && setScheduleLeadId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Schedule meeting</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div><Label>Date & time *</Label><Input type="datetime-local" value={meetingScheduledAt} onChange={(e) => setMeetingScheduledAt(e.target.value)} /></div>
            <div><Label>Title</Label><Input value={meetingTitle} onChange={(e) => setMeetingTitle(e.target.value)} placeholder="Meeting title" /></div>
            <div><Label>Join link</Label><Input value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)} placeholder="https://..." /></div>
            <div><Label>Agenda</Label><Textarea value={meetingAgenda} onChange={(e) => setMeetingAgenda(e.target.value)} placeholder="Agenda..." rows={2} /></div>
            <div><Label>Duration (minutes)</Label><Input type="number" value={meetingDuration} onChange={(e) => setMeetingDuration(e.target.value)} placeholder="30" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleLeadId(null)}>Skip</Button>
            <Button onClick={submitScheduleMeeting} disabled={meetingSaving}>{meetingSaving ? "Saving…" : "Schedule"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DragDropContext>
  );
}
