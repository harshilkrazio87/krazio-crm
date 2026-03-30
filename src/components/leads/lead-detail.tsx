"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CalendarPlus } from "lucide-react";

type Lead = {
  id: string;
  owner_id: string | null;
  company_name: string | null;
  website: string | null;
  linkedin_company_url: string | null;
  requirements: string | null;
  stage_id: string | null;
  custom_fields: Record<string, unknown>;
  gemini_research: Record<string, unknown> | null;
  lead_stages?: { name: string; is_meeting_stage: boolean } | { name: string; is_meeting_stage: boolean }[] | null;
};

type Owner = { id: string; full_name: string | null; email: string } | undefined;
type Contact = { id: string; name: string | null; email: string | null; phone: string | null; linkedin_url: string | null; position: string | null };
type Note = { id: string; content: string; created_at: string; profiles?: { full_name: string | null } | { full_name: string | null }[] | null };
type Meeting = { id: string; scheduled_at: string; meeting_link: string | null; title: string | null; completed: boolean };
type Stage = { id: string; name: string; slug: string };

export function LeadDetail({
  lead,
  owner,
  contacts,
  notes,
  meetings,
  stages,
}: {
  lead: Lead;
  owner?: Owner;
  contacts: Contact[];
  notes: Note[];
  meetings: Meeting[];
  stages: Stage[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [stageId, setStageId] = useState(lead.stage_id ?? "");
  const [noteContent, setNoteContent] = useState("");
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [meetingScheduledAt, setMeetingScheduledAt] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingAgenda, setMeetingAgenda] = useState("");
  const [meetingDuration, setMeetingDuration] = useState("");
  const [meetingSaving, setMeetingSaving] = useState(false);

  const cf = (lead.custom_fields ?? {}) as Record<string, string>;

  async function handleStageChange(newStageId: string) {
    const { error } = await supabase
      .from("leads")
      .update({ stage_id: newStageId || null })
      .eq("id", lead.id);
    if (error) {
      toast.error("Failed to update stage");
      return;
    }
    setStageId(newStageId);
    router.refresh();
  }

  async function addMeeting() {
    if (!meetingScheduledAt.trim()) {
      toast.error("Date and time required");
      return;
    }
    setMeetingSaving(true);
    try {
      const res = await fetch("/api/lead-meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id: lead.id,
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
      setMeetingOpen(false);
      setMeetingScheduledAt("");
      setMeetingLink("");
      setMeetingTitle("");
      setMeetingAgenda("");
      setMeetingDuration("");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setMeetingSaving(false);
    }
  }

  async function addNote() {
    if (!noteContent.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase.from("profiles").select("id").eq("id", user.id).single();
    const { error } = await supabase.from("lead_notes").insert({
      lead_id: lead.id,
      author_id: profile?.id ?? user.id,
      content: noteContent.trim(),
    });
    if (error) {
      toast.error("Failed to add note");
      return;
    }
    setNoteContent("");
    toast.success("Note added");
    router.refresh();
  }

  const researchText = lead.gemini_research && typeof (lead.gemini_research as { text?: string }).text === "string"
    ? (lead.gemini_research as { text: string }).text
    : lead.gemini_research && Object.keys(lead.gemini_research).length > 0
      ? JSON.stringify(lead.gemini_research, null, 2)
      : null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold">{lead.company_name || "Unnamed"}</h2>
            {lead.website && (
              <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                {lead.website}
              </a>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm">Stage</Label>
            <Select value={stageId} onValueChange={handleStageChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {stages.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Lead Info</h3>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <dt className="text-muted-foreground">Lead Source</dt>
              <dd>{cf.lead_source ?? "—"}</dd>
              <dt className="text-muted-foreground">Assigned To</dt>
              <dd>{owner ? (owner.full_name || owner.email) : "—"}</dd>
              <dt className="text-muted-foreground">Priority</dt>
              <dd className="capitalize">{cf.priority ?? "—"}</dd>
            </dl>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Contact Details</h3>
            {contacts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No contacts</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {contacts.map((c) => (
                  <li key={c.id}>
                    <span className="font-medium">{c.name ?? "—"}</span>
                    {c.position && <span className="text-muted-foreground"> · {c.position}</span>}
                    {c.email && <span className="text-muted-foreground"> · {c.email}</span>}
                    {c.phone && <span className="text-muted-foreground"> · {c.phone}</span>}
                    {c.linkedin_url && (
                      <a href={c.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">LinkedIn</a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Company Details</h3>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <dt className="text-muted-foreground">Company Name</dt>
              <dd>{lead.company_name ?? "—"}</dd>
              <dt className="text-muted-foreground">Website</dt>
              <dd>{lead.website ? <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{lead.website}</a> : "—"}</dd>
              <dt className="text-muted-foreground">LinkedIn</dt>
              <dd>{lead.linkedin_company_url ? <a href={lead.linkedin_company_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Link</a> : "—"}</dd>
              <dt className="text-muted-foreground">Industry</dt>
              <dd>{cf.industry ?? "—"}</dd>
              <dt className="text-muted-foreground">Department</dt>
              <dd>{cf.department ?? "—"}</dd>
              <dt className="text-muted-foreground">Technology</dt>
              <dd>{cf.technology ?? "—"}</dd>
              <dt className="text-muted-foreground">Company Size</dt>
              <dd>{cf.company_size ?? "—"}</dd>
              <dt className="text-muted-foreground">Location</dt>
              <dd>{cf.location ?? "—"}</dd>
            </dl>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Requirements</h3>
            <p className="text-sm whitespace-pre-wrap">{lead.requirements ?? "—"}</p>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mt-2">
              <dt className="text-muted-foreground">Budget Range</dt>
              <dd>{cf.budget_range ?? "—"}</dd>
              <dt className="text-muted-foreground">Timeline</dt>
              <dd>{cf.timeline ?? "—"}</dd>
            </dl>
            {cf.notes && <p className="text-sm mt-2 text-muted-foreground">Notes: {cf.notes}</p>}
          </div>
          {researchText && (
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-xs font-medium text-muted-foreground mb-1">AI Research</p>
              <pre className="text-xs whitespace-pre-wrap">{researchText}</pre>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="notes">
        <TabsList>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="meetings">Meetings</TabsTrigger>
        </TabsList>
        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader>
              <h3 className="font-semibold">Add note</h3>
              <Textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Discussion, MOM, or status note..."
                rows={3}
              />
              <Button size="sm" onClick={addNote} disabled={!noteContent.trim()}>
                Add note
              </Button>
            </CardHeader>
            <CardContent>
              {notes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No notes yet.</p>
              ) : (
                <ul className="space-y-3">
                  {notes.map((n) => (
                    <li key={n.id} className="border-l-2 pl-3 py-1">
                      <p className="text-sm">{n.content}</p>
                      <p className="text-xs text-muted-foreground">
                        {Array.isArray(n.profiles) ? n.profiles[0]?.full_name : n.profiles?.full_name ?? "Someone"} · {format(new Date(n.created_at), "PPp")}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="contacts">
          <Card>
            <CardContent className="pt-6">
              {contacts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No contacts yet.</p>
              ) : (
                <ul className="space-y-2">
                  {contacts.map((c) => (
                    <li key={c.id}>
                      <span className="font-medium">{c.name ?? "—"}</span>
                      {c.email && <span className="text-muted-foreground"> · {c.email}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="meetings">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="font-semibold">Meetings</h3>
              <Button size="sm" variant="outline" onClick={() => setMeetingOpen(true)}>
                <CalendarPlus className="h-4 w-4 mr-1" />
                Add Meeting
              </Button>
            </CardHeader>
            <CardContent>
              {meetings.length === 0 ? (
                <p className="text-sm text-muted-foreground">No meetings scheduled. Schedule one below.</p>
              ) : (
                <ul className="space-y-2">
                  {meetings.map((m) => (
                    <li key={m.id} className="flex items-center gap-2">
                      <Badge variant={m.completed ? "default" : "secondary"}>
                        {format(new Date(m.scheduled_at), "PPp")}
                      </Badge>
                      {m.title && <span className="text-sm">{m.title}</span>}
                      {m.meeting_link && (
                        <a href={m.meeting_link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                          Join
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          <Dialog open={meetingOpen} onOpenChange={setMeetingOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule meeting</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div>
                  <Label>Date & time *</Label>
                  <Input type="datetime-local" value={meetingScheduledAt} onChange={(e) => setMeetingScheduledAt(e.target.value)} />
                </div>
                <div>
                  <Label>Title</Label>
                  <Input value={meetingTitle} onChange={(e) => setMeetingTitle(e.target.value)} placeholder="Meeting title" />
                </div>
                <div>
                  <Label>Join link</Label>
                  <Input value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)} placeholder="https://..." />
                </div>
                <div>
                  <Label>Agenda</Label>
                  <Textarea value={meetingAgenda} onChange={(e) => setMeetingAgenda(e.target.value)} placeholder="Agenda..." rows={2} />
                </div>
                <div>
                  <Label>Duration (minutes)</Label>
                  <Input type="number" value={meetingDuration} onChange={(e) => setMeetingDuration(e.target.value)} placeholder="30" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setMeetingOpen(false)}>Cancel</Button>
                <Button onClick={addMeeting} disabled={meetingSaving}>{meetingSaving ? "Saving…" : "Schedule"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}