"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { ImageUpload } from "@/components/ui/image-upload";

type InitialSettings = {
  companyName: string;
  logoUrl: string;
  smtp: { host: string; port: string; username: string; password: string; from_email: string; from_name: string };
  geminiApiKey: string;
};

export function SettingsClient({ isAdmin, initialSettings }: { isAdmin: boolean; initialSettings: InitialSettings }) {
  const [companyName, setCompanyName] = useState(initialSettings.companyName);
  const [logoUrl, setLogoUrl] = useState(initialSettings.logoUrl);
  const [smtp, setSmtp] = useState(initialSettings.smtp);
  const [testEmail, setTestEmail] = useState("");
  const [smtpLoading, setSmtpLoading] = useState(false);
  const [geminiKey, setGeminiKey] = useState(initialSettings.geminiApiKey);

  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileAvatar, setProfileAvatar] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    setCompanyName(initialSettings.companyName);
    setLogoUrl(initialSettings.logoUrl);
    setSmtp(initialSettings.smtp);
    setGeminiKey(initialSettings.geminiApiKey);
  }, [initialSettings]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setProfileLoading(false);
        return;
      }
      const { data: profile } = await supabase.from("profiles").select("full_name, phone, avatar_url").eq("id", user.id).single();
      if (profile) {
        setProfileName(profile.full_name ?? "");
        setProfilePhone(profile.phone ?? "");
        setProfileAvatar(profile.avatar_url ?? "");
      }
      setProfileLoading(false);
    })();
  }, []);

  async function saveSetting(key: string, value: unknown) {
    const payload = typeof value === "object" && value !== null && !Array.isArray(value) ? value : { value };
    const { error } = await supabase
      .from("app_settings")
      .upsert({ key, value: payload, updated_at: new Date().toISOString() }, { onConflict: "key" });
    if (error) throw new Error(error.message);
  }

  async function saveGeneral() {
    try {
      await saveSetting("company_name", { value: companyName });
      await saveSetting("logo_url", { value: logoUrl });
      toast.success("General settings saved");
    } catch (err: unknown) {
      toast.error("Failed to save general settings", { description: String(err) });
    }
  }

  async function saveSmtp() {
    setSmtpLoading(true);
    try {
      await saveSetting("smtp", {
        host: smtp.host,
        port: Number(smtp.port) || 587,
        user: smtp.username,
        pass: smtp.password,
        from: smtp.from_email || smtp.username,
        from_name: smtp.from_name || "",
      });
      toast.success("SMTP settings saved");
    } catch (err: unknown) {
      toast.error("Failed to save SMTP", { description: String(err) });
    } finally {
      setSmtpLoading(false);
    }
  }

  async function sendTestEmail() {
    const res = await fetch("/api/send-test-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: testEmail }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) toast.success("Test email sent!");
    else toast.error("Failed to send test email", { description: (data as { error?: string }).error || res.statusText });
  }

  async function saveProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Not signed in");
      return;
    }
    setProfileSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profileName || null,
        phone: profilePhone || null,
        avatar_url: profileAvatar || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);
    setProfileSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Profile updated");
  }

  async function changePassword() {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);
    setNewPassword("");
    setConfirmPassword("");
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated");
  }

  async function saveGeminiKey() {
    try {
      await saveSetting("gemini_api_key", { value: geminiKey });
      toast.success("API key saved");
    } catch (err: unknown) {
      toast.error("Failed to save API key", { description: String(err) });
    }
  }

  return (
    <Tabs defaultValue="profile" className="space-y-4">
      <TabsList className="flex-wrap h-auto gap-1">
        <TabsTrigger value="profile">My Profile</TabsTrigger>
        {isAdmin && (
          <>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="smtp">SMTP</TabsTrigger>
            <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          </>
        )}
      </TabsList>

      <TabsContent value="profile">
        <Card>
          <CardHeader>
            <CardTitle>My Profile</CardTitle>
            <CardDescription>Edit your name, phone, photo, and password.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {profileLoading ? (
              <p className="text-muted-foreground">Loading…</p>
            ) : (
              <>
                <div>
                  <Label>Profile photo</Label>
                  <div className="mt-1">
                    <ImageUpload value={profileAvatar} onChange={setProfileAvatar} size="lg" label="Upload Photo" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Full name</Label>
                  <Input value={profileName} onChange={(e) => setProfileName(e.target.value)} placeholder="Your name" />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input type="tel" value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} placeholder="+1 234 567 8900" />
                </div>
                <Button onClick={saveProfile} disabled={profileSaving}>{profileSaving ? "Saving…" : "Save profile"}</Button>
                <div className="border-t pt-4 space-y-4">
                  <h4 className="font-medium">Change password</h4>
                  <div className="space-y-2">
                    <Label>New password</Label>
                    <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" autoComplete="new-password" />
                  </div>
                  <div className="space-y-2">
                    <Label>Confirm password</Label>
                    <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" autoComplete="new-password" />
                  </div>
                  <Button variant="secondary" onClick={changePassword} disabled={changingPassword}>{changingPassword ? "Updating…" : "Change password"}</Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {isAdmin && (
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Krazio Cloud" />
              </div>
              <div className="space-y-2">
                <Label>Logo URL</Label>
                <Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." />
                {logoUrl && <img src={logoUrl} alt="Logo preview" className="h-12 object-contain rounded border p-1 mt-2" />}
              </div>
              <Button onClick={saveGeneral}>Save General Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
      )}

      {isAdmin && (
        <TabsContent value="smtp">
          <Card>
            <CardHeader>
              <CardTitle>SMTP Configuration</CardTitle>
              <CardDescription>Configure email sending for notifications and user invites</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>SMTP Host</Label>
                  <Input value={smtp.host} onChange={(e) => setSmtp({ ...smtp, host: e.target.value })} placeholder="smtp.gmail.com" />
                </div>
                <div className="space-y-2">
                  <Label>Port</Label>
                  <Input value={smtp.port} onChange={(e) => setSmtp({ ...smtp, port: e.target.value })} placeholder="587" />
                </div>
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input value={smtp.username} onChange={(e) => setSmtp({ ...smtp, username: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input type="password" value={smtp.password} onChange={(e) => setSmtp({ ...smtp, password: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>From Email</Label>
                  <Input value={smtp.from_email} onChange={(e) => setSmtp({ ...smtp, from_email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>From Name</Label>
                  <Input value={smtp.from_name} onChange={(e) => setSmtp({ ...smtp, from_name: e.target.value })} />
                </div>
              </div>
              <Button onClick={saveSmtp} disabled={smtpLoading}>{smtpLoading ? "Saving..." : "Save SMTP"}</Button>
              <div className="border-t pt-4 space-y-2">
                <Label>Send Test Email</Label>
                <div className="flex gap-2">
                  <Input value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="test@example.com" />
                  <Button variant="outline" onClick={sendTestEmail}>Send Test</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      )}

      {isAdmin && (
        <TabsContent value="api-keys">
          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>External API integrations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Google Gemini API Key</Label>
                <Input type="password" value={geminiKey} onChange={(e) => setGeminiKey(e.target.value)} placeholder="AIza..." />
                <p className="text-xs text-muted-foreground">Used for AI research on leads. Get from Google AI Studio.</p>
              </div>
              <Button onClick={saveGeminiKey}>Save API Key</Button>
            </CardContent>
          </Card>
        </TabsContent>
      )}
    </Tabs>
  );
}
