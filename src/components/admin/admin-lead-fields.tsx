"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Field = { id: string; name: string; slug: string; field_type: string };

export function AdminLeadFields() {
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [fieldType, setFieldType] = useState("text");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/lead-fields");
      if (res.ok) setFields(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditId(null);
    setName("");
    setSlug("");
    setFieldType("text");
    setOpen(true);
  }

  function openEdit(f: Field) {
    setEditId(f.id);
    setName(f.name);
    setSlug(f.slug);
    setFieldType(f.field_type);
    setOpen(true);
  }

  async function save() {
    if (!name.trim()) { toast.error("Name required"); return; }
    setSaving(true);
    try {
      const payload = { name: name.trim(), slug: slug.trim() || name.toLowerCase().replace(/\s+/g, "_"), field_type: fieldType };
      if (editId) {
        const res = await fetch("/api/admin/lead-fields/" + editId, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error((await res.json()).error);
        toast.success("Updated");
      } else {
        const res = await fetch("/api/admin/lead-fields", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error((await res.json()).error);
        toast.success("Created");
      }
      setOpen(false);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  async function deleteField(id: string) {
    if (!confirm("Delete this field?")) return;
    try {
      const res = await fetch("/api/admin/lead-fields/" + id, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast.success("Deleted");
      load();
    } catch { toast.error("Failed"); }
  }

  if (loading) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Lead custom fields</CardTitle>
            <CardDescription>Fields for lead forms.</CardDescription>
          </div>
          <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> Add field</Button>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {fields.map((f) => (
              <li key={f.id} className="flex items-center justify-between rounded border p-2">
                <span className="font-medium">{f.name}</span>
                <span className="text-muted-foreground text-sm">{f.slug} · {f.field_type}</span>
                <div>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(f)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteField(f.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </li>
            ))}
          </ul>
          {fields.length === 0 && <p className="py-4 text-muted-foreground text-sm">No custom fields.</p>}
        </CardContent>
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Edit field" : "Add field"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div><Label>Name</Label><Input value={name} onChange={(e) => { setName(e.target.value); if (!editId) setSlug(e.target.value.toLowerCase().replace(/\s+/g, "_")); }} /></div>
            <div><Label>Slug</Label><Input value={slug} onChange={(e) => setSlug(e.target.value)} /></div>
            <div><Label>Type</Label><select className="w-full border rounded px-3 py-2 bg-background" value={fieldType} onChange={(e) => setFieldType(e.target.value)}><option value="text">Text</option><option value="number">Number</option><option value="date">Date</option><option value="select">Select</option></select></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
