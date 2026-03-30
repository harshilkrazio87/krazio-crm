"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type SmtpConfig = { host?: string; port?: number; user?: string; pass?: string; from?: string };

export function AdminSMTP() {
  const [config, setConfig] = useState<SmtpConfig>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [pass, setPass] = useState("");

  useEffect(() => {
    fetch("/api/settings?key=smtp")
      .then((r) => r.json())
      .then((data) => {
        console.log(data);
        if (data && typeof data === "object") {
          setConfig(data);
          setPass((data as { pass?: string }).pass || "");
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const value = {
      host: config.host || "",
      port: config.port ? Number(config.port) : 587,
      user: config.user || "",
      pass: pass || config.pass || "",
      from: config.from || config.user || "",
    };
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "smtp", value }),
    });
    setSaving(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error("Failed to save", { description: (err as { error?: string }).error });
      return;
    }
    toast.success("SMTP settings saved");
    setConfig(value);
  }

  async function handleSendTest() {
    setSending(true);
    const res = await fetch("/api/send-test-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: config.user // send test email to the configured user/email
      }),
    })
    setSending(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error("Test email failed", { description: (err as { error?: string }).error });
      return;
    }
    toast.success("Test email sent");
  }

  

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>SMTP (e.g. Gmail)</CardTitle>
        <CardDescription>
          Used for welcome emails and custom notifications. Save and send a test email to verify.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Host</Label>
              <Input
                value={config.host || ""}
                onChange={(e) => setConfig((c) => ({ ...c, host: e.target.value }))}
                placeholder="smtp.gmail.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Port</Label>
              <Input
                type="number"
                value={config.port ?? 587}
                onChange={(e) => setConfig((c) => ({ ...c, port: parseInt(e.target.value, 10) || 587 }))}
                placeholder="587"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>User / Email</Label>
            <Input
              type="email"
              value={config.user || ""}
              onChange={(e) => setConfig((c) => ({ ...c, user: e.target.value }))}
              placeholder="your@gmail.com"
            />
          </div>
          <div className="space-y-2">
            <Label>Password (app password for Gmail)</Label>
            <Input
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <div className="space-y-2">
            <Label>From address (optional)</Label>
            <Input
              type="email"
              value={config.from || ""}
              onChange={(e) => setConfig((c) => ({ ...c, from: e.target.value }))}
              placeholder="noreply@yourdomain.com"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save SMTP"}
            </Button>
            <Button type="button" variant="outline" onClick={handleSendTest} disabled={sending}>
              {sending ? "Sending…" : "Send test email"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
