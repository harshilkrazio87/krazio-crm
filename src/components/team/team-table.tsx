"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/ui/image-upload";
import { UserPlus, Users, LayoutGrid, Eye, EyeOff, RefreshCw, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Department = { id: string; name: string };
// type Profile = {
//   id: string;
//   full_name: string | null;
//   email: string;
//   avatar_url: string | null;
//   manager_id: string | null;
//   role_id: string | null;
//   is_active?: boolean;
//   employee_id?: string | null;
//   phone?: string | null;
//   department_id?: string | null;
//   joining_date?: string | null;
//   manager_name?: string | null;
//   roles?: { id: string; name: string; slug: string } | { id: string; name: string; slug: string }[] | null;
//   departments?: { id: string; name: string } | { id: string; name: string }[] | null;
// };

type Profile = {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  manager_id: string | null;
  role_id: string | null;
  is_active?: boolean;
  employee_id?: string | null;
  phone?: string | null;
  department_id?: string | null;
  joining_date?: string | null;
  manager_name?: string | null;

  // ✅ FIX: always array
  roles?: { id: string; name: string; slug: string }[];
  departments?: { id: string; name: string }[];
};

type Role = { id: string; name: string; slug: string };

export function TeamTable({
  profiles,
  roles,
  departments,
  isAdmin,
  treeView,
}: {
  profiles: Profile[];
  roles: Role[];
  departments: Department[];
  isAdmin: boolean;
  treeView: React.ReactNode;
}) {
  const [viewMode, setViewMode] = useState<"table" | "tree">("table");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteFullName, setInviteFullName] = useState("");
  const [invitePreferredName, setInvitePreferredName] = useState("");
  const [inviteEmployeeId, setInviteEmployeeId] = useState("");
  const [inviteAvatarUrl, setInviteAvatarUrl] = useState("");
  const [inviteMobile, setInviteMobile] = useState("");
  const [invitePassword, setInvitePassword] = useState("");
  const [inviteShowPassword, setInviteShowPassword] = useState(false);
  const [inviteGeneratePassword, setInviteGeneratePassword] = useState(true);
  const [inviteEmailPassword, setInviteEmailPassword] = useState(false);
  const [inviteJoiningDate, setInviteJoiningDate] = useState("");
  const [inviteDepartmentId, setInviteDepartmentId] = useState<string>("");
  const [inviteRoleId, setInviteRoleId] = useState<string>("");
  const [inviteManagerId, setInviteManagerId] = useState<string>("");
  const [inviteIsActive, setInviteIsActive] = useState(true);
  const [inviteSignInEnabled, setInviteSignInEnabled] = useState(true);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);
  const [createdEmail, setCreatedEmail] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editProfile, setEditProfile] = useState<Profile | null>(null);
  const [editFullName, setEditFullName] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");
  const [editEmployeeId, setEditEmployeeId] = useState("");
  const [editMobile, setEditMobile] = useState("");
  const [editDepartmentId, setEditDepartmentId] = useState<string>("");
  const [editJoiningDate, setEditJoiningDate] = useState("");
  const [editManagerId, setEditManagerId] = useState<string>("");
  const [editLoading, setEditLoading] = useState(false);
  const [resetPwOpen, setResetPwOpen] = useState(false);
  const [resetPwProfile, setResetPwProfile] = useState<Profile | null>(null);
  const [resetPwLoading, setResetPwLoading] = useState(false);
  const [resetPwResult, setResetPwResult] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteProfile, setDeleteProfile] = useState<Profile | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [teamData, setTeamData] = useState<Profile[]>(profiles);

  async function handleUpdateRole(profileId: string, roleId: string | null) {
    const res = await fetch(`/api/team/profile/${profileId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role_id: roleId || null }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Failed to update role");
      return;
    }
    toast.success("Role updated");
    window.location.reload();
  }

  // async function handleToggleActive(profileId: string, checked: boolean) {
  //   const res = await fetch(`/api/team/profile/${profileId}`, {
  //     method: "PATCH",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify({ is_active: checked }),
  //   });
  //   if (!res.ok) {
  //     const data = await res.json().catch(() => ({}));
  //     toast.error(data.error || "Failed to update status");
  //     return;
  //   }
  //   toast.success(checked ? "Active" : "Inactive");
  //   window.location.reload();
  // }
  async function handleToggleActive(profileId: string, checked: boolean) {
  const res = await fetch(`/api/team/profile/${profileId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_active: checked }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    toast.error(data.error || "Failed to update status");
    return;
  }

  toast.success(checked ? "Active" : "Inactive");

  // ✅ RELOAD REMOVE → STATE UPDATE ADD
  setTeamData(prev =>
    prev.map(p =>
      p.id === profileId ? { ...p, is_active: checked } : p
    )
  );
}

async function handleInvite() {
  if (!inviteEmail.trim()) {
    toast.error("Enter email");
    return;
  }

  if (!inviteFullName.trim()) {
    toast.error("Enter employee name");
    return;
  }

  setInviteLoading(true);
  setCreatedPassword(null);
  setCreatedEmail(null);

  const res = await fetch("/api/admin/create-user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: inviteEmail.trim(),
      full_name: inviteFullName.trim(),
      preferred_name: invitePreferredName.trim() || undefined,
      employee_id: inviteEmployeeId.trim() || undefined,
      avatar_url: inviteAvatarUrl.trim() || undefined,
      phone: inviteMobile.trim() || undefined,
      password: inviteGeneratePassword ? undefined : invitePassword.trim() || undefined,
      generate_password: inviteGeneratePassword,
      joining_date: inviteJoiningDate || undefined,
      department_id: inviteDepartmentId || null,
      role_id: inviteRoleId || null,
      manager_id: inviteManagerId || null,
      is_active: inviteIsActive,
      sign_in_enabled: inviteSignInEnabled,
      email_employee: inviteEmailPassword,
    }),
  });

  const data = await res.json().catch(() => ({}));
  setInviteLoading(false);

  if (!res.ok) {
    const errMsg = (data as { error?: string }).error || "Failed to invite";
    const desc = (data as { detail?: string }).detail;
    toast.error(errMsg, desc ? { description: desc } : undefined);
    return;
  }

  setCreatedPassword(data.password ?? null);
  setCreatedEmail(data.email ?? null);

  // ✅ IMPORTANT: USER ADD TO UI
  if (data.user) {
    setTeamData(prev => [...prev, data.user]);
  }

  if (data.password) {
    toast.success("User created! Share the password with them.");
  } else {
    toast.success("User created.");
    closeInviteDialog(); // (aa ma reload already remove karyu hoy joiye)
  }
}

  

  function openEdit(p: Profile) {
    setEditProfile(p);
    setEditFullName(p.full_name ?? "");
    setEditAvatarUrl(p.avatar_url ?? "");
    setEditEmployeeId(p.employee_id ?? "");
    setEditMobile(p.phone ?? "");
    setEditDepartmentId(p.department_id ?? "");
    setEditJoiningDate(p.joining_date ?? "");
    setEditManagerId(p.manager_id ?? "");
    setEditOpen(true);
  }

  async function handleEdit() {
    if (!editProfile) return;
    setEditLoading(true);
    const res = await fetch(`/api/team/profile/${editProfile.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: editFullName.trim() || null,
        avatar_url: editAvatarUrl.trim() || null,
        employee_id: editEmployeeId.trim() || null,
        phone: editMobile.trim() || null,
        department_id: editDepartmentId || null,
        joining_date: editJoiningDate || null,
        manager_id: editManagerId || null,
      }),
    });
    setEditLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Failed to update");
      return;
    }
    toast.success("Profile updated");
    setEditOpen(false);
    setEditProfile(null);
    window.location.reload();
  }

  function openResetPw(p: Profile) {
    setResetPwProfile(p);
    setResetPwResult(null);
    setResetPwOpen(true);
  }

  async function handleResetPassword() {
    if (!resetPwProfile) return;
    setResetPwLoading(true);
    setResetPwResult(null);
    const res = await fetch("/api/admin/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: resetPwProfile.id }),
    });
    const data = await res.json().catch(() => ({}));
    setResetPwLoading(false);
    if (!res.ok) {
      toast.error(data.error || "Failed to reset password");
      return;
    }
    setResetPwResult(data.password ?? "Password updated.");
    toast.success("Password reset. Share the new password with the user.");
  }

  function openDelete(p: Profile) {
    setDeleteProfile(p);
    setDeleteOpen(true);
  }

  async function handleDelete() {
  if (!deleteProfile) return;

  setDeleteLoading(true);

  try {
    const res = await fetch("/api/admin/delete-user", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: deleteProfile.id }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error);

    toast.success("User deleted successfully");

    // ✅ RELOAD REMOVE → STATE UPDATE
    setTeamData(prev =>
      prev.filter(p => p.id !== deleteProfile.id)
    );

    setDeleteOpen(false);
    setDeleteProfile(null);

  } catch (err: unknown) {
    toast.error("Delete failed", {
      description: err instanceof Error ? err.message : String(err),
    });
  } finally {
    setDeleteLoading(false);
  }
}

  function copyPassword() {
    if (createdPassword) {
      navigator.clipboard.writeText(createdPassword);
      toast.success("Password copied");
    }
  }

  function closeInviteDialog() {
    setInviteOpen(false);
    setInviteEmail("");
    setInviteFullName("");
    setInvitePreferredName("");
    setInviteEmployeeId("");
    setInviteAvatarUrl("");
    setInviteMobile("");
    setInvitePassword("");
    setInviteGeneratePassword(true);
    setInviteJoiningDate("");
    setInviteDepartmentId("");
    setInviteRoleId("");
    setInviteManagerId("");
    setInviteIsActive(true);
    setInviteSignInEnabled(true);
    setCreatedPassword(null);
    setCreatedEmail(null);
  }

  function initials(p: Profile) {
    if (p.full_name) {
      const parts = p.full_name.trim().split(/\s+/);
      if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      return p.full_name.slice(0, 2).toUpperCase();
    }
    return p.email.slice(0, 2).toUpperCase();
  }

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2">
  
  {/* LEFT SIDE */}
  <div className="min-w-0">
    <CardTitle className="text-base sm:text-lg truncate">
      Team members
    </CardTitle>
    <CardDescription className="text-xs sm:text-sm">
      {viewMode === "table" ? "Table view" : "Hierarchy"} — who reports to whom.
    </CardDescription>
  </div>

  {/* RIGHT SIDE */}
  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
    
    {/* TABLE BUTTON */}
    <Button
      variant={viewMode === "table" ? "default" : "outline"}
      size="sm"
      onClick={() => setViewMode("table")}
      className="flex-1 sm:flex-none"
    >
      <LayoutGrid className="h-4 w-4 mr-1" />
      <span className="hidden sm:inline">Table</span>
    </Button>

    {/* TREE BUTTON */}
    <Button
      variant={viewMode === "tree" ? "default" : "outline"}
      size="sm"
      onClick={() => setViewMode("tree")}
      className="flex-1 sm:flex-none"
    >
      <Users className="h-4 w-4 mr-1" />
      <span className="hidden sm:inline">Tree</span>
    </Button>

    {/* ADD MEMBER */}
    {isAdmin && (
      <Dialog
        open={inviteOpen}
        onOpenChange={(open) => {
          setInviteOpen(open);
          if (!open && !createdPassword) closeInviteDialog();
        }}
      >
        <DialogTrigger asChild>
          <Button
            size="sm"
            className="bg-primary text-primary-foreground flex-1 sm:flex-none"
          >
            <UserPlus className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Add Member</span>
          </Button>
        </DialogTrigger>

        {/* DIALOG */}
        <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto">
          
          <DialogHeader>
            <DialogTitle>
              {createdPassword ? "User created" : "Add team member"}
            </DialogTitle>
            <DialogDescription>
              {createdPassword
                ? "Share the password with the user."
                : "Create a new user with profile and sign-in settings."}
            </DialogDescription>
          </DialogHeader>

          {createdPassword ? (
            <div className="grid gap-4 py-4">
              <p className="text-sm">
                <strong>Email:</strong> {createdEmail}
              </p>
              <p className="text-sm">
                <strong>Password:</strong>{" "}
                <code className="bg-muted px-2 py-1 rounded break-all">
                  {createdPassword}
                </code>
              </p>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={copyPassword} className="w-full sm:w-auto">
                  Copy password
                </Button>
                <Button onClick={closeInviteDialog} className="w-full sm:w-auto">
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* FORM */}
              <div className="grid gap-4 py-4 grid-cols-1 sm:grid-cols-2">
                
                <div className="sm:col-span-2">
                  <Label>Profile picture</Label>
                  <ImageUpload
                    value={inviteAvatarUrl}
                    onChange={setInviteAvatarUrl}
                    size="md"
                    label="Upload Photo"
                  />
                </div>

                <div>
                  <Label>Employee ID</Label>
                  <Input
                    value={inviteEmployeeId}
                    onChange={(e) => setInviteEmployeeId(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Employee name *</Label>
                  <Input
                    value={inviteFullName}
                    onChange={(e) => setInviteFullName(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Mobile</Label>
                  <Input
                    type="tel"
                    value={inviteMobile}
                    onChange={(e) => setInviteMobile(e.target.value)}
                  />
                </div>

                {/* PASSWORD */}
                <div className="sm:col-span-2">
                  <Label>Password *</Label>
                  <div className="flex flex-col sm:flex-row gap-2 mt-1">
                    
                    <div className="relative flex-1">
                      <Input
                        type={inviteShowPassword ? "text" : "password"}
                        value={inviteGeneratePassword ? "" : invitePassword}
                        onChange={(e) => setInvitePassword(e.target.value)}
                        disabled={inviteGeneratePassword}
                      />
                    </div>

                    <Label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={inviteGeneratePassword}
                        onChange={(e) =>
                          setInviteGeneratePassword(e.target.checked)
                        }
                      />
                      Generate
                    </Label>
                  </div>
                </div>

              </div>

              {/* FOOTER */}
              <DialogFooter className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={() => setInviteOpen(false)}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>

                <Button
                  onClick={handleInvite}
                  disabled={inviteLoading}
                  className="w-full sm:w-auto"
                >
                  {inviteLoading ? "Creating…" : "Create user"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    )}
  </div>
</CardHeader>
      <CardContent>
        {viewMode === "tree" ? (
          treeView
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium">Avatar</th>
                  <th className="text-left py-2 font-medium">Employee ID</th>
                  <th className="text-left py-2 font-medium">Name</th>
                  <th className="text-left py-2 font-medium">Email</th>
                  <th className="text-left py-2 font-medium">Department</th>
                  <th className="text-left py-2 font-medium">Role</th>
                  <th className="text-left py-2 font-medium">Manager</th>
                  <th className="text-left py-2 font-medium">Status</th>
                  {isAdmin && <th className="text-right py-2 font-medium">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {teamData.map((p) => {
                  const role = Array.isArray(p.roles) ? p.roles[0] : p.roles;
                  const roleName = role?.name ?? "—";
                  const dept = Array.isArray(p.departments) ? p.departments[0] : p.departments;
                  const deptName = dept?.name ?? "—";
                  return (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-2">
                        {p.avatar_url ? (
                          <img src={p.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                        ) : (
                          <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium bg-primary/10 text-primary">
                            {initials(p)}
                          </div>
                        )}
                      </td>
                      <td className="py-2 text-muted-foreground">{p.employee_id ?? "—"}</td>
                      <td className="py-2 font-medium">{p.full_name || p.email}</td>
                      <td className="py-2 text-muted-foreground">{p.email}</td>
                      <td className="py-2 text-muted-foreground">{deptName}</td>
                      <td className="py-2">
                        <Badge className={cn(
                          role?.slug === "super_admin" && "bg-red-500/90",
                          role?.slug === "admin" && "bg-orange-500/90",
                          role?.slug === "manager" && "bg-blue-500/90",
                          role?.slug === "sales" && "bg-green-500/90",
                          !role?.slug && "bg-secondary"
                        )}>{roleName}</Badge>
                      </td>
                      <td className="py-2 text-muted-foreground">{p.manager_name ?? "—"}</td>
                      <td className="py-2">
                        {isAdmin ? (
                          <Switch checked={p.is_active !== false} onCheckedChange={(checked) => handleToggleActive(p.id, checked)} />
                        ) : (
                          <span className={p.is_active !== false ? "text-green-600" : "text-muted-foreground"}>
                            {p.is_active !== false ? "Active" : "Inactive"}
                          </span>
                        )}
                      </td>
                      {isAdmin && (
                        <td className="py-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit" onClick={() => openEdit(p)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="Reset password" onClick={() => openResetPw(p)}>
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" title="Delete" onClick={() => openDelete(p)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {profiles.length === 0 && (
              <p className="py-6 text-center text-muted-foreground">No team members yet. Add members (admin).</p>
            )}
          </div>
        )}
      </CardContent>

      {/* Edit member dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit member</DialogTitle>
            <DialogDescription>Update profile details.</DialogDescription>
          </DialogHeader>
          {editProfile && (
            <div className="grid gap-4 py-4 grid-cols-1 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>Avatar</Label>
                <div className="mt-1">
                  <ImageUpload value={editAvatarUrl} onChange={setEditAvatarUrl} size="md" label="Upload Photo" />
                </div>
              </div>
              <div>
                <Label>Employee ID</Label>
                <Input value={editEmployeeId} onChange={(e) => setEditEmployeeId(e.target.value)} />
              </div>
              <div>
                <Label>Full name *</Label>
                <Input value={editFullName} onChange={(e) => setEditFullName(e.target.value)} />
              </div>
              <div>
                <Label>Mobile</Label>
                <Input value={editMobile} onChange={(e) => setEditMobile(e.target.value)} type="tel" />
              </div>
              <div>
                <Label>Department</Label>
                <Select value={editDepartmentId || "none"} onValueChange={(v) => setEditDepartmentId(v === "none" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Joining date</Label>
                <Input type="date" value={editJoiningDate} onChange={(e) => setEditJoiningDate(e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <Label>Manager</Label>
                <Select value={editManagerId || "none"} onValueChange={(v) => setEditManagerId(v === "none" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Select manager" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {profiles.filter((x) => x.id !== editProfile.id).map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.full_name || p.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={editLoading}>{editLoading ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset password dialog */}
      <Dialog open={resetPwOpen} onOpenChange={(open) => { setResetPwOpen(open); if (!open) { setResetPwProfile(null); setResetPwResult(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset password</DialogTitle>
            <DialogDescription>
              {resetPwProfile && `Generate a new password for ${resetPwProfile.full_name || resetPwProfile.email}. Share it with them securely.`}
            </DialogDescription>
          </DialogHeader>
          {resetPwResult ? (
            <div className="py-4">
              <p className="text-sm font-medium">New password:</p>
              <code className="block mt-2 bg-muted px-3 py-2 rounded break-all">{resetPwResult}</code>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => resetPwResult && navigator.clipboard.writeText(resetPwResult).then(() => toast.success("Copied"))}>Copy</Button>
            </div>
          ) : (
            <DialogFooter>
              <Button variant="outline" onClick={() => setResetPwOpen(false)}>Cancel</Button>
              <Button onClick={handleResetPassword} disabled={resetPwLoading}>{resetPwLoading ? "Resetting…" : "Generate new password"}</Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={deleteOpen} onOpenChange={(open) => { setDeleteOpen(open); if (!open) setDeleteProfile(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete user?</DialogTitle>
            <DialogDescription>
              {deleteProfile && `This will permanently remove ${deleteProfile.full_name || deleteProfile.email} and their data. This cannot be undone.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteLoading}>{deleteLoading ? "Deleting…" : "Delete"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
