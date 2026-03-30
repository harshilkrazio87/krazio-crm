"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Plus, Pencil, Trash2, GripVertical, FileText } from "lucide-react";
import { toast } from "sonner";

type Dept = {
  id: string;
  name: string;
  description: string | null;
  sop_content: string | null;
  sop_fields: unknown[];
  updated_at?: string;
  members_count?: number;
};

type SopTask = {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  order_index: number;
};

export function DepartmentsAdmin({ initialDepartments }: { initialDepartments: Dept[] }) {
  const [departments, setDepartments] = useState<Dept[]>(initialDepartments);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sopContent, setSopContent] = useState("");
  const [sopFields, setSopFields] = useState<{ name: string; type: string }[]>([]);
  const [sopTasks, setSopTasks] = useState<SopTask[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadDepartments() {
    const res = await fetch("/api/departments");
    if (res.ok) {
      const data = await res.json();
      setDepartments(data);
    }
  }

  async function loadSopTasks(departmentId: string) {
    const res = await fetch(`/api/departments/${departmentId}/sop-tasks`);
    if (res.ok) {
      const data = await res.json();
      setSopTasks(data);
    } else {
      setSopTasks([]);
    }
  }

  function openCreate() {
    setEditId(null);
    setName("");
    setDescription("");
    setSopContent("");
    setSopFields([]);
    setSopTasks([]);
    setNewTaskTitle("");
    setOpen(true);
  }

  async function openEdit(d: Dept) {
    setEditId(d.id);
    setName(d.name);
    setDescription(d.description ?? "");
    setSopContent(d.sop_content ?? "");
    setSopFields(Array.isArray(d.sop_fields) ? (d.sop_fields as { name: string; type: string }[]) : []);
    setSopTasks([]);
    setNewTaskTitle("");
    setOpen(true);
    await loadSopTasks(d.id);
  }

  async function save() {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    setLoading(true);
    try {
      if (editId) {
        const res = await fetch(`/api/departments/${editId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim() || null,
            sop_content: sopContent.trim() || null,
            sop_fields: sopFields,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to update");
        }
        toast.success("Department updated");
      } else {
        const res = await fetch("/api/departments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim() || null,
            sop_content: sopContent.trim() || null,
            sop_fields: sopFields,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to create");
        }
        const created = await res.json();
        toast.success("Department created");
        setEditId(created.id);
        setSopTasks([]);
      }
      await loadDepartments();
      if (editId) await loadSopTasks(editId);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function addTask() {
    if (!newTaskTitle.trim() || !editId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/departments/${editId}/sop-tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTaskTitle.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to add task");
      }
      const task = await res.json();
      setSopTasks((prev) => [...prev, task]);
      setNewTaskTitle("");
      toast.success("Task added");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function deleteTask(taskId: string) {
    if (!editId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/departments/${editId}/sop-tasks/${taskId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setSopTasks((prev) => prev.filter((t) => t.id !== taskId));
      toast.success("Task removed");
    } catch {
      toast.error("Failed to delete task");
    } finally {
      setLoading(false);
    }
  }

  async function onDragEnd(result: { destination?: { index: number } | null; source?: { index: number }; draggableId?: string }) {
    if (!result.destination || result.destination.index === result.source?.index || !editId) return;
    const next = Array.from(sopTasks);
    const [removed] = next.splice(result.source!.index, 1);
    next.splice(result.destination.index, 0, removed);
    setSopTasks(next);
    setLoading(true);
    try {
      await fetch(`/api/departments/${editId}/sop-tasks`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: next.map((t) => t.id) }),
      });
      toast.success("Order saved");
    } catch {
      toast.error("Failed to save order");
    } finally {
      setLoading(false);
    }
  }

  function addSopField() {
    setSopFields((prev) => [...prev, { name: "", type: "text" }]);
  }

  function removeSopField(i: number) {
    setSopFields((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateSopField(i: number, key: "name" | "type", value: string) {
    setSopFields((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [key]: value };
      return next;
    });
  }

  async function deleteDept(id: string) {
    if (!confirm("Delete this department? Members will keep their profile but department link will be removed.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/departments/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete");
      }
      setDepartments((prev) => prev.filter((d) => d.id !== id));
      if (editId === id) setOpen(false);
      toast.success("Department deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  const hasSop = (d: Dept) => Boolean(d.sop_content?.trim() || (Array.isArray(d.sop_fields) && d.sop_fields.length > 0));

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Departments</CardTitle>
            <CardDescription>Add or edit departments with SOP content and task checklists.</CardDescription>
          </div>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" />
            Add department
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium">Name</th>
                  <th className="text-left py-2 font-medium">Description</th>
                  <th className="text-left py-2 font-medium">Members</th>
                  <th className="text-left py-2 font-medium">SOP</th>
                  <th className="text-right py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((d) => (
                  <tr key={d.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-2 font-medium">{d.name}</td>
                    <td className="py-2 text-muted-foreground max-w-[200px] truncate">{d.description ?? "—"}</td>
                    <td className="py-2">{d.members_count ?? 0}</td>
                    <td className="py-2">
                      {hasSop(d) ? (
                        <span className="text-green-600 flex items-center gap-1">
                          <FileText className="h-4 w-4" /> Yes
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-2 text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(d)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteDept(d.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {departments.length === 0 && (
              <p className="py-6 text-center text-muted-foreground">No departments yet. Add one to get started.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit department" : "Add department"}</DialogTitle>
            <DialogDescription>Name, description, SOP content, custom fields, and SOP tasks.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sales" />
            </div>
            <div>
              <Label>Description</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description" />
            </div>
            <div>
              <Label>SOP content</Label>
              <Textarea value={sopContent} onChange={(e) => setSopContent(e.target.value)} placeholder="Markdown or plain text SOP..." rows={4} className="resize-y" />
            </div>
            <div>
              <Label>SOP custom fields</Label>
              <div className="space-y-2 mt-1">
                {sopFields.map((f, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Input placeholder="Field name" value={f.name} onChange={(e) => updateSopField(i, "name", e.target.value)} />
                    <select className="border rounded px-2 py-2 h-9 bg-background" value={f.type} onChange={(e) => updateSopField(i, "type", e.target.value)}>
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                      <option value="date">Date</option>
                      <option value="checkbox">Checkbox</option>
                    </select>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeSopField(i)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addSopField}>
                  <Plus className="h-4 w-4 mr-1" /> Add field
                </Button>
              </div>
            </div>
            {editId && (
              <div>
                <Label>SOP tasks (drag to reorder)</Label>
                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="sop-tasks">
                    {(provided) => (
                      <ul ref={provided.innerRef} {...provided.droppableProps} className="mt-2 space-y-1 border rounded-md p-2 min-h-[80px]">
                        {sopTasks.map((t, idx) => (
                          <Draggable key={t.id} draggableId={t.id} index={idx}>
                            {(provided) => (
                              <li
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className="flex items-center gap-2 rounded border bg-background px-2 py-2"
                              >
                                <span {...provided.dragHandleProps}>
                                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                                </span>
                                <span className="flex-1 font-medium">{t.title}</span>
                                <Button type="button" variant="ghost" size="icon" onClick={() => deleteTask(t.id)} disabled={loading}>
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
                <div className="flex gap-2 mt-2">
                  <Input placeholder="New task title" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTask()} />
                  <Button type="button" onClick={addTask} disabled={loading || !newTaskTitle.trim()}>
                    <Plus className="h-4 w-4 mr-1" /> Add task
                  </Button>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={loading}>{loading ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
