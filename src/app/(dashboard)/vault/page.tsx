"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Lock, Plus, Eye, EyeOff, Copy, Pencil, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

type VaultEntry = {
  id: string;
  user_id: string;
  company_name: string;
  url?: string | null;
  username?: string | null;
  password_encrypted?: string | null;
  notes?: string | null;
  created_at: string;
  profiles?: { full_name?: string | null; email?: string } | { full_name?: string | null; email?: string }[] | null;
};

function decodePassword(enc: string): string {
  try {
    if (typeof atob !== "undefined") return decodeURIComponent(atob(enc));
    return "";
  } catch {
    return "";
  }
}

export default function VaultPage() {
  const [entries, setEntries] = useState<VaultEntry[]>([]);
  const [admin, setAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [url, setUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/vault")
      .then((r) => r.json())
      .then((data) => {
        console.log("data",data.entries);
        setEntries(data.entries ?? []);
        setAdmin(!!data.admin);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function toggleVisible(id: string) {
    setVisibleIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleAdd() {
    if (!companyName.trim()) {
      toast.error("Company name is required");
      return;
    }
    if (!username.trim()) {
      toast.error("Username/Email is required");
      return;
    }
    if (!password.trim()) {
      toast.error("Password is required");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/vault", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company_name: companyName, url: url || null, username, password, notes: notes || null }),
    });
    setSaving(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(data.error || "Failed to add");
      return;
    }
    toast.success("Password added");
    setAddOpen(false);
    setCompanyName("");
    setUrl("");
    setUsername("");
    setPassword("");
    setNotes("");
    fetch("/api/vault").then((r) => r.json()).then((d) => { setEntries(d.entries ?? []); setAdmin(!!d.admin); });
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this entry?")) return;
    const res = await fetch(`/api/vault/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Failed to delete");
      return;
    }
    toast.success("Deleted");
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  function copyPassword(enc: string) {
    const plain = decodePassword(enc);
    navigator.clipboard.writeText(plain);
    toast.success("Copied to clipboard");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Password Vault</h1>
          <p className="text-muted-foreground">Store and access your credentials securely.</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Password
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Password</DialogTitle>
              <DialogDescription>Store a new credential. Passwords are stored encoded (upgrade to proper encryption in production).</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Company Name *</Label>
                <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Acme Inc." />
              </div>
              <div className="space-y-2">
                <Label>URL</Label>
                <Input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label>Username / Email *</Label>
                <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="user@example.com" />
              </div>
              <div className="space-y-2">
                <Label>Password *</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" rows={2} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button onClick={handleAdd} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {entries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Lock className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg">No passwords yet</h3>
            <p className="text-muted-foreground text-sm mt-1">Add your first credential to get started.</p>
            <Button className="mt-4" onClick={() => setAddOpen(true)}><Plus className="h-4 w-4 mr-2" />Add Password</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {entries.map((e) => {
            const showPlain = admin || visibleIds.has(e.id);
            const plain = e.password_encrypted ? decodePassword(e.password_encrypted) : "";
            const addedBy = e.profiles ? (Array.isArray(e.profiles) ? e.profiles[0] : e.profiles) : null;
            return (
              <Card key={e.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{e.company_name}</CardTitle>
                    <div className="flex gap-1">
                      {!admin && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleVisible(e.id)}>
                          {showPlain ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      )}
                      {admin && (
                        <>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyPassword(e.password_encrypted ?? "")}>
                            <Copy className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(e.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {e.url && (
                    <a href={e.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" /> {e.url}
                    </a>
                  )}
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <p><span className="text-muted-foreground">Username:</span> {e.username ?? "—"}</p>
                  <p>
                    <span className="text-muted-foreground">Password:</span>{" "}
                    {showPlain ? plain : "••••••••••••"}
                  </p>
                  {e.notes && <p className="text-muted-foreground mt-2">{e.notes}</p>}
                  {admin && addedBy && (
                    <p className="text-xs text-muted-foreground mt-2">Added by: {addedBy.full_name || addedBy.email}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {admin && entries.length > 0 && (
        <div>
          <Button variant="outline" onClick={() => window.open("/api/vault/export", "_blank")}>
            Export CSV
          </Button>
        </div>
      )}
    </div>
  );
}
