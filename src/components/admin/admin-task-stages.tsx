"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Plus, Pencil, Trash2, GripVertical } from "lucide-react";
import { toast } from "sonner";

type Stage = {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  order_index: number;
  is_default: boolean | null;
};

export function AdminTaskStages() {
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [color, setColor] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/task-stages");
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
    setColor("#6366f1");
    setOpen(true);
  }

  function openEdit(s: Stage) {
    setEditId(s.id);
    setName(s.name);
    setSlug(s.slug);
    setColor(s.color ?? "#6366f1");
    setOpen(true);
  }

  async function save() {
    if (!name.trim()) {
      toast.error("Name required");
      return;
    }
    setSaving(true);
    try {
      const slugVal = slug.trim() || name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
      const colorVal = color.trim() || "#6366f1";
      if (editId) {
        const res = await fetch(`/api/admin/task-stages/${editId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), slug: slugVal, color: colorVal }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed");
        }
        toast.success("Stage updated");
      } else {
        const res = await fetch("/api/admin/task-stages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), slug: slugVal, color: colorVal }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed");
        }
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
    const stage = stages.find((s) => s.id === id);
    if (stage?.is_default) {
      toast.error("Cannot delete default stage");
      return;
    }
    if (!confirm("Delete this stage?")) return;
    try {
      const res = await fetch(`/api/admin/task-stages/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed");
      }
      toast.success("Deleted");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete");
    }
  }

  async function onDragEnd(result: { destination?: { index: number } | null; source?: { index: number }; draggableId?: string }) {
    if (!result.destination || result.destination.index === result.source?.index) return;
    const next = Array.from(stages);
    const [removed] = next.splice(result.source!.index, 1);
    next.splice(result.destination.index, 0, removed);
    setStages(next);
    try {
      await fetch("/api/admin/task-stages", {
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
            <CardTitle>Task stages</CardTitle>
            <CardDescription>
              Reorder and edit task stages. Default stages (Pending, In Progress, Completed) cannot be deleted.
            </CardDescription>
          </div>
          <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> Add stage</Button>
        </CardHeader>
        <CardContent>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="task-stages">
              {(provided) => (
                <ul ref={provided.innerRef} {...provided.droppableProps} className="space-y-1">
                  {stages.map((s, idx) => (
                    <Draggable key={s.id} draggableId={s.id} index={idx}>
                      {(provided) => (
                        <li ref={provided.innerRef} {...provided.draggableProps} className="flex items-center gap-2 rounded border p-2 bg-background">
                          <span {...provided.dragHandleProps}><GripVertical className="h-4 w-4 text-muted-foreground" /></span>
                          <span
                            className="h-4 w-4 rounded-full shrink-0"
                            style={{ backgroundColor: s.color ?? "#6366f1" }}
                          />
                          <span className="font-medium flex-1">{s.name}</span>
                          {s.is_default && <span className="text-xs text-muted-foreground">Default</span>}
                          <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => deleteStage(s.id)}
                            disabled={!!s.is_default}
                            title={s.is_default ? "Default stages cannot be deleted" : "Delete"}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </li>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </ul>
              )}
            </Droppable>
          </DragDropContext>
          {stages.length === 0 && <p className="py-4 text-muted-foreground text-sm">No stages. Add one or run /api/auto-migrate to seed defaults.</p>}
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
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!editId) setSlug(e.target.value.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, ""));
                }}
              />
            </div>
            <div>
              <Label>Slug</Label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
            </div>
            <div>
              <Label>Color (hex)</Label>
              <Input value={color} onChange={(e) => setColor(e.target.value)} placeholder="#6366f1" />
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
