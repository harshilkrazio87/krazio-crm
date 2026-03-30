"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/ui/image-upload";
import { toast } from "sonner";
import type { Profile } from "@/types/database";

function getInitials(fullName: string | null, email: string): string {
  if (fullName?.trim()) {
    return fullName
      .trim()
      .split(/\s+/)
      .map((s) => s[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }
  if (email?.length >= 2) return email.slice(0, 2).toUpperCase();
  return "?";
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roleName, setRoleName] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const supabase = createClient();


  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setEmail(user.email ?? "");
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, email, full_name, phone, avatar_url, role_id, manager_id, created_at, updated_at, roles(name)")
        .eq("id", user.id)
        .single();
      if (profileData) {
        setProfile(profileData as Profile);
        const rolesData = (profileData as { roles?: { name: string } | { name: string }[] | null }).roles;
        setRoleName(rolesData ? (Array.isArray(rolesData) ? rolesData[0]?.name : rolesData?.name) ?? null : null);
        setFullName(profileData.full_name ?? "");
        setPhone(profileData.phone ?? "");
        setAvatarUrl(profileData.avatar_url ?? "");
        if (!user.email && profileData.email) setEmail(profileData.email);
      } else {
        setProfile({ id: user.id, email: user.email ?? "", full_name: null, avatar_url: null, role_id: null, manager_id: null, phone: null, created_at: "", updated_at: "" } as Profile);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("You must be signed in to update your profile.");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName || null,
        phone: phone || null,
        avatar_url: avatarUrl || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setProfile((p) => (p ? { ...p, full_name: fullName || null, phone: phone || null, avatar_url: avatarUrl || null } : null));
    toast.success("Profile updated.");
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
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
    toast.success("Password updated.");
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-muted-foreground">Sign in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-muted-foreground">Manage your account details and password.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Your profile information. Changes are saved to the profiles table.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <div>
              <Label>Profile photo</Label>
              <div className="mt-1">
                <ImageUpload value={avatarUrl} onChange={setAvatarUrl} size="lg" label="Upload Photo" />
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full name</Label>
              <Input
                id="full_name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">Email is managed by your account and cannot be changed here.</p>
            </div>
            {roleName && (
              <div className="space-y-2">
                <Label>Role</Label>
                <p className="text-sm py-2 text-muted-foreground">{roleName}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 234 567 8900"
              />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save profile"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Set a new password for your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new_password">New password</Label>
              <Input
                id="new_password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm_password">Confirm password</Label>
              <Input
                id="confirm_password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>
            <Button type="submit" variant="secondary" disabled={changingPassword}>
              {changingPassword ? "Updating…" : "Change password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
