"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";

const TRIGGER_OPTIONS = [
  { value: "meeting_complete", label: "Meeting Completed" },
  { value: "project_confirm", label: "Project Confirmed" },
  { value: "lead_won", label: "Lead Won" },
  { value: "manual", label: "Manual (Admin adds)" },
] as const;

type Rule = {
  id: string;
  name: string;
  trigger_type: string | null;
  amount: number;
  is_percentage: boolean | null;
  description: string | null;
  is_active: boolean | null;
  created_at: string;
};

const defaultForm = {
  name: "",
  trigger_type: "meeting_complete" as string,
  amount: "",
  is_percentage: false,
  description: "",
  is_active: true,
};

export function AdminCommissionRules() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const supabase = createClient();

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("commission_rules")
      .select("id, name, trigger_type, amount, is_percentage, description, is_active, created_at")
      .order("created_at", { ascending: false });
    setRules((data as Rule[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function openAdd() {
    setEditingId(null);
    setForm(defaultForm);
    setShowDialog(true);
  }

  function openEdit(r: Rule) {
    setEditingId(r.id);
    setForm({
      name: r.name,
      trigger_type: r.trigger_type ?? "meeting_complete",
      amount: String(r.amount ?? ""),
      is_percentage: r.is_percentage ?? false,
      description: r.description ?? "",
      is_active: r.is_active ?? true,
    });
    setShowDialog(true);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error("Rule name required");
      return;
    }
    const amount = parseFloat(form.amount);
    if (Number.isNaN(amount) || amount < 0) {
      toast.error("Valid amount required");
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      trigger_type: form.trigger_type || null,
      amount,
      is_percentage: form.is_percentage,
      description: form.description.trim() || null,
      is_active: form.is_active,
    };
    if (editingId) {
      const { error } = await supabase.from("commission_rules").update(payload).eq("id", editingId);
      if (error) {
        toast.error(error.message);
        setSaving(false);
        return;
      }
      toast.success("Rule updated");
    } else {
      const { error } = await supabase.from("commission_rules").insert(payload);
      if (error) {
        toast.error(error.message);
        setSaving(false);
        return;
      }
      toast.success("Rule added");
    }
    setSaving(false);
    setShowDialog(false);
    load();
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("commission_rules").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Rule deleted");
    setDeleteConfirm(null);
    load();
  }

  function triggerLabel(value: string) {
    return TRIGGER_OPTIONS.find((o) => o.value === value)?.label ?? value;
  }

  function triggerBadgeColor(value: string) {
    if (value === "meeting_complete") return "bg-blue-500/15 text-blue-700";
    if (value === "project_confirm") return "bg-green-500/15 text-green-700";
    if (value === "lead_won") return "bg-purple-500/15 text-purple-700";
    return "bg-gray-500/15 text-gray-700";
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Commission rules</CardTitle>
            <CardDescription>
              Define rules by trigger type; flat amount or percentage.
            </CardDescription>
          </div>
          <Button onClick={openAdd}>Add Rule</Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <ul className="space-y-3">
            {rules.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between rounded-lg border p-4 gap-4 flex-wrap"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{r.name}</span>
                    <Badge className={triggerBadgeColor(r.trigger_type ?? "")}>
                      {triggerLabel(r.trigger_type ?? "")}
                    </Badge>
                    {r.is_percentage ? (
                      <span className="text-muted-foreground">{Number(r.amount)}%</span>
                    ) : (
                      <span className="text-muted-foreground">₹{Number(r.amount).toFixed(2)}</span>
                    )}
                    {r.is_active === false && (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>
                  {r.description && (
                    <p className="text-sm text-muted-foreground mt-1">{r.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(r)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {deleteConfirm === r.id ? (
                    <>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(r.id)}
                      >
                        Confirm
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(null)}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteConfirm(r.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
        {!loading && rules.length === 0 && (
          <p className="py-4 text-sm text-muted-foreground">No commission rules. Add one to get started.</p>
        )}
      </CardContent>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit rule" : "Add rule"}</DialogTitle>
            <DialogDescription>Set name, trigger, amount type, and value.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Rule name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Meeting completed bonus"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Optional"
              />
            </div>
            <div>
              <Label>Trigger type</Label>
              <Select
                value={form.trigger_type}
                onValueChange={(v) => setForm((f) => ({ ...f, trigger_type: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRIGGER_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_percentage}
                onCheckedChange={(c) => setForm((f) => ({ ...f, is_percentage: c }))}
              />
              <Label>{form.is_percentage ? "Percentage %" : "Flat amount ₹"}</Label>
            </div>
            <div>
              <Label>Amount</Label>
              <Input
                type="number"
                min={0}
                step={form.is_percentage ? 1 : 0.01}
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder={form.is_percentage ? "10" : "5000"}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_active}
                onCheckedChange={(c) => setForm((f) => ({ ...f, is_active: c }))}
              />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}




