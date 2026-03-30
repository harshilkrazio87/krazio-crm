"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Plus, Pencil, Trash2, GripVertical } from "lucide-react";
import { toast } from "sonner";
type Stage = {
  id: string;
  name: string;
  slug: string;
  order_index: number;
  is_meeting_stage?: boolean;
  requires_meeting?: boolean;
  is_won?: boolean;
  is_lost?: boolean;
  color?: string | null;
};

export function AdminLeadStages() {
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [requiresMeeting, setRequiresMeeting] = useState(false);
  const [isWon, setIsWon] = useState(false);
  const [isLost, setIsLost] = useState(false);
  const [color, setColor] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/lead-stages");
      if (res.ok) {
        const data = await res.json();
        setStages(data);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditId(null);
    setName("");
    setSlug("");
    setRequiresMeeting(false);
    setIsWon(false);
    setIsLost(false);
    setColor("");
    setOpen(true);
  }

  function openEdit(s: Stage) {
    setEditId(s.id);
    setName(s.name);
    setSlug(s.slug);
    setRequiresMeeting(!!s.requires_meeting);
    setIsWon(!!s.is_won);
    setIsLost(!!s.is_lost);
    setColor(s.color ?? "");
    setOpen(true);
  }

  async function save() {
    if (!name.trim()) {
      toast.error("Name required");
      return;
    }
    setSaving(true);
    try {
      if (editId) {
        const res = await fetch(`/api/admin/lead-stages/${editId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            slug: slug.trim() || name.toLowerCase().replace(/\s+/g, "_"),
            requires_meeting: requiresMeeting,
            is_won: isWon,
            is_lost: isLost,
            color: color.trim() || null,
          }),
        });
        if (!res.ok) throw new Error((await res.json()).error);
        toast.success("Stage updated");
      } else {
        const res = await fetch("/api/admin/lead-stages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            slug: slug.trim() || name.toLowerCase().replace(/\s+/g, "_"),
            requires_meeting: requiresMeeting,
            is_won: isWon,
            is_lost: isLost,
            color: color.trim() || null,
          }),
        });
        if (!res.ok) throw new Error((await res.json()).error);
        toast.success("Stage created");
      }
      setOpen(false);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  async function deleteStage(id: string) {
    if (!confirm("Delete this stage?")) return;
    try {
      const res = await fetch(`/api/admin/lead-stages/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast.success("Deleted");
      load();
    } catch {
      toast.error("Failed to delete");
    }
  }

  async function onDragEnd(result: { destination?: { index: number } | null; source?: { index: number }; draggableId?: string }) {
    if (!result.destination || result.destination.index === result.source?.index) return;
    const next = Array.from(stages);
    const [removed] = next.splice(result.source!.index, 1);
    next.splice(result.destination.index, 0, removed);
    setStages(next);
    try {
      await fetch("/api/admin/lead-stages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: next.map((s) => s.id) }),
      });
      toast.success("Order saved");
    } catch {
      toast.error("Failed to save order");
    }
  }

  if (loading) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <>
       <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Lead stages</CardTitle>
            <CardDescription>Reorder and edit stages. Set requires meeting, won, or lost. Used in Leads kanban.</CardDescription>
          </div>
          <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> Add stage</Button>
        </CardHeader>
        <CardContent>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="lead-stages">
              {(provided) => (
                <ul ref={provided.innerRef} {...provided.droppableProps} className="space-y-1">
                  {stages.map((s, idx) => (
                    <Draggable key={s.id} draggableId={s.id} index={idx}>
                      {(provided) => (
                        <li ref={provided.innerRef} {...provided.draggableProps} className="flex items-center gap-2 rounded border p-2 bg-background">
                          <span {...provided.dragHandleProps}><GripVertical className="h-4 w-4 text-muted-foreground" /></span>
                          <span className="font-medium flex-1">{s.name}</span>
                          {s.requires_meeting && <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-1.5 rounded">Meeting</span>}
                          {s.is_won && <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 px-1.5 rounded">Won</span>}
                          {s.is_lost && <span className="text-xs bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 px-1.5 rounded">Lost</span>}
                          <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteStage(s.id)}><Trash2 className="h-4 w-4" /></Button>
                        </li>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </ul>
              )}
            </Droppable>
          </DragDropContext>
          {stages.length === 0 && <p className="py-4 text-muted-foreground text-sm">No stages. Add one.</p>}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? "Edit stage" : "Add stage"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Name</Label>
              <Input value={name} onChange={(e) => { setName(e.target.value); if (!editId) setSlug(e.target.value.toLowerCase().replace(/\s+/g, "_")); }} />
            </div>
            <div>
              <Label>Slug</Label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
            </div>
            <div className="flex items-center gap-4">
              <Label className="flex items-center gap-2 cursor-pointer">
                <Switch checked={requiresMeeting} onCheckedChange={setRequiresMeeting} />
                Requires meeting
              </Label>
              <Label className="flex items-center gap-2 cursor-pointer">
                <Switch checked={isWon} onCheckedChange={setIsWon} />
                Won
              </Label>
              <Label className="flex items-center gap-2 cursor-pointer">
                <Switch checked={isLost} onCheckedChange={setIsLost} />
                Lost
              </Label>
            </div>
            <div>
              <Label>Color (hex)</Label>
              <Input value={color} onChange={(e) => setColor(e.target.value)} placeholder="#3b82f6" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
