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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const PERMISSIONS = [
  { key: "view_dashboard", label: "View Dashboard" },
  { key: "manage_tasks", label: "Manage Tasks" },
  { key: "delete_tasks", label: "Delete Any Task" },
  { key: "manage_leads", label: "Manage Leads" },
  { key: "view_all_leads", label: "View All Leads" },
  { key: "manage_team", label: "Manage Team" },
  { key: "view_reports", label: "View Reports" },
  { key: "view_all_reports", label: "View All Reports" },
  { key: "manage_commission", label: "Manage Commission" },
  { key: "approve_commission", label: "Approve Commission" },
  { key: "manage_vault", label: "Manage Vault" },
  { key: "view_all_vault", label: "View All Passwords (Admin)" },
  { key: "manage_settings", label: "Manage Settings" },
  { key: "manage_users", label: "Create/Edit Users" },
  { key: "view_audit_logs", label: "View Audit Logs" },
];

type Role = {
  id: string;
  name: string;
  slug: string;
  level?: number;
  permissions?: Record<string, boolean> | null;
};

export function AdminRoles({ roles: initialRoles }: { roles: Role[] }) {
  const [roles, setRoles] = useState<Role[]>(initialRoles);
  const [showDialog, setShowDialog] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", permissions: {} as Record<string, boolean> });

  const supabase = createClient();

  useEffect(() => {
    setRoles(initialRoles);
  }, [initialRoles]);

  async function loadRoles() {
    const { data } = await supabase.from("roles").select("id, name, slug, level, permissions").order("level", { ascending: false });
    if (data) setRoles(data as Role[]);
  }

  function getPerm(role: Role, key: string): boolean {
    const p = role.permissions ?? {};
    return p[key] === true;
  }

  async function setPerm(roleId: string, key: string, value: boolean) {
    const role = roles.find((r) => r.id === roleId);
    if (!role) return;
    const slug = role.slug;
    if (slug === "super_admin") {
      toast.info("Super Admin permissions are fixed.");
      return;
    }
    const next = { ...(role.permissions ?? {}), [key]: value };
    setSavingId(roleId);
    const { error } = await supabase.from("roles").update({ permissions: next }).eq("id", roleId);
    setSavingId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Saved");
    setRoles((prev) => prev.map((r) => (r.id === roleId ? { ...r, permissions: next } : r)));
  }

  function slugFromName(name: string) {
    return name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");
  }

  function openAdd() {
    setForm({ name: "", slug: "", permissions: {} });
    setShowDialog(true);
  }

  async function handleAdd() {
    if (!form.name.trim()) {
      toast.error("Role name required");
      return;
    }
    const slug = form.slug.trim() || slugFromName(form.name);
    const { error } = await supabase.from("roles").insert({
      name: form.name.trim(),
      slug,
      level: 0,
      permissions: form.permissions ?? {},
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Role added");
    setShowDialog(false);
    loadRoles();
  }

  const badgeColor = (slug: string) => {
    if (slug === "super_admin") return "bg-red-500/15 text-red-700";
    if (slug === "admin") return "bg-orange-500/15 text-orange-700";
    if (slug === "manager") return "bg-blue-500/15 text-blue-700";
    if (slug === "sales") return "bg-green-500/15 text-green-700";
    return "bg-gray-500/15 text-gray-700";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Roles</CardTitle>
            <CardDescription>Manage role permissions. Super Admin cannot be edited.</CardDescription>
          </div>
          <Button onClick={openAdd}>Add Role</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {roles.map((role) => (
          <div key={role.id} className="rounded-xl border p-4 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold">{role.name}</span>
              <Badge className={badgeColor(role.slug)}>{role.slug}</Badge>
              {role.slug === "super_admin" && (
                <span className="text-xs text-muted-foreground">(all permissions, read-only)</span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {PERMISSIONS.map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={role.slug === "super_admin" ? true : getPerm(role, key)}
                    disabled={role.slug === "super_admin" || savingId === role.id}
                    onChange={(e) => setPerm(role.id, key, e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="truncate">{label}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </CardContent>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Role</DialogTitle>
            <DialogDescription>Create a new role with a name and permissions.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Role name</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value, slug: f.slug || slugFromName(e.target.value) }))
                }
                placeholder="e.g. Support"
              />
            </div>
            <div>
              <Label>Slug (optional, auto from name)</Label>
              <Input
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder="support"
              />
            </div>
            <div>
              <Label>Permissions</Label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                {PERMISSIONS.map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.permissions[key] ?? false}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, permissions: { ...f.permissions, [key]: e.target.checked } }))
                      }
                      className="rounded border-gray-300"
                    />
                    <span className="truncate">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
