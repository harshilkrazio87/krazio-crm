import { createClient } from "@supabase/supabase-js";
import { getUserWithRole } from "@/lib/get-user-role";
import { Card, CardContent } from "@/components/ui/card";
import { TeamTable } from "@/components/team/team-table";
import { TeamTree } from "@/components/team/team-tree";

const knownSuperAdmins = ["admin@kraziocloud.com"];
const knownAdmins = ["harsh.p@kraziocloud.com"];

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export default async function TeamPage() {
  const userWithRole = await getUserWithRole();
  const isAdmin =
    (userWithRole?.isAdmin ?? false) ||
    knownSuperAdmins.includes(userWithRole?.email ?? "") ||
    knownAdmins.includes(userWithRole?.email ?? "");

  const serviceClient = getServiceClient();
  const { data: profiles } = await serviceClient
    .from("profiles")
    .select(`
      id,
      full_name,
      email,
      avatar_url,
      manager_id,
      role_id,
      is_active,
      employee_id,
      phone,
      department_id,
      joining_date,
      roles(id, name, slug),
      departments(id, name)
    `)
    .order("created_at", { ascending: false });

  const { data: roles } = await serviceClient
    .from("roles")
    .select("id, name, slug")
    .order("level", { ascending: false });

  const { data: departments } = await serviceClient
    .from("departments")
    .select("id, name")
    .order("name");

  const profilesWithManager = (profiles ?? []).map((p) => {
    const manager = (profiles ?? []).find((m) => m.id === p.manager_id);
    return {
      ...p,
      manager_name: manager?.full_name || manager?.email || null,
    };
  });

  const total = profilesWithManager.length;
  const admins = profilesWithManager.filter((p) => {
    const slug = (p.roles as { slug?: string } | null)?.slug;
    return slug === "admin" || slug === "super_admin";
  }).length;
  const managers = profilesWithManager.filter((p) => (p.roles as { slug?: string } | null)?.slug === "manager").length;
  const sales = profilesWithManager.filter((p) => (p.roles as { slug?: string } | null)?.slug === "sales").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Team</h1>
          <p className="text-muted-foreground">
            Team members, roles, managers, and hierarchy. Admins can invite members.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-xl border shadow-sm">
          <CardContent className="pt-4">
            <p className="text-sm font-medium text-muted-foreground">Total Members</p>
            <p className="text-2xl font-bold">{total}</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border shadow-sm">
          <CardContent className="pt-4">
            <p className="text-sm font-medium text-muted-foreground">Admins</p>
            <p className="text-2xl font-bold">{admins}</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border shadow-sm">
          <CardContent className="pt-4">
            <p className="text-sm font-medium text-muted-foreground">Managers</p>
            <p className="text-2xl font-bold">{managers}</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border shadow-sm">
          <CardContent className="pt-4">
            <p className="text-sm font-medium text-muted-foreground">Sales</p>
            <p className="text-2xl font-bold">{sales}</p>
          </CardContent>
        </Card>
      </div>

      <TeamTable
        profiles={profilesWithManager}
        roles={roles ?? []}
        departments={departments ?? []}
        isAdmin={!!isAdmin}
        treeView={<TeamTree profiles={profiles ?? []} />}
      />
    </div>
  );
}
