import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserWithRole } from "@/lib/get-user-role";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { AdminUsers } from "@/components/admin/admin-users";
import { AdminRoles } from "@/components/admin/admin-roles";
import { AdminSMTP } from "@/components/admin/admin-smtp";
import { AdminLeadStages } from "@/components/admin/admin-lead-stages";
import { AdminLeadFields } from "@/components/admin/admin-lead-fields";
import { AdminTaskFields } from "@/components/admin/admin-task-fields";
import { AdminAuditLogs } from "@/components/admin/admin-audit-logs";
import { AdminCommissionRules } from "@/components/admin/admin-commission-rules";
import { AdminTaskStages } from "@/components/admin/admin-task-stages";

const knownSuperAdmins = ["admin@kraziocloud.com"];
const knownAdmins = ["harsh.p@kraziocloud.com"];

export default async function AdminPage() {
  const userWithRole = await getUserWithRole();
  if (!userWithRole) redirect("/login");
  const isAdmin =
    userWithRole.isAdmin ||
    knownSuperAdmins.includes(userWithRole.email) ||
    knownAdmins.includes(userWithRole.email);
  if (!isAdmin) redirect("/dashboard");
  const supabase = await createClient();

  const { data: roles } = await supabase
    .from("roles")
    .select("id, name, slug, level, permissions")
    .order("level", { ascending: false });
  const { data: profiles } = await supabase
    .from("profiles")
    .select(
      "id, email, full_name, role_id, manager_id, created_at, roles(id, name, slug)",
    )
  // const { data: roles } = await supabase.from("roles").select("id, name, slug, level, permissions").order("level", { ascending: false });
  // const { data: profiles } = await supabase
  //   .from("profiles")
  //   .select("id, email, full_name, role_id, manager_id, created_at, roles(id, name, slug)")
  //   .order("created_at", { ascending: false });

  const { data: activityLogs } = await supabase
    .from("activity_logs")
    .select(
      "id, user_id, action, entity_type, entity_id, details, browser, created_at, profiles(full_name, email)",
    )
    .select("id, user_id, action, entity_type, entity_id, details, browser, created_at, profiles(full_name, email)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-4">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-bold">Admin</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Roles, users, SMTP, lead/task stages & fields,
          <span className="hidden sm:inline">departments</span>
          <span className="inline sm:hidden">deps</span>, audit logs, commission
          rules.
        </p>
      </div>
      <Tabs defaultValue="users" className="w-full">
        <div className="w-full overflow-x-auto">
          <TabsList className="inline-flex w-max">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="roles">Roles</TabsTrigger>
            <TabsTrigger value="lead-stages">Lead stages</TabsTrigger>
            <TabsTrigger value="task-stages">Task stages</TabsTrigger>
            <TabsTrigger value="lead-fields">Lead fields</TabsTrigger>
            <TabsTrigger value="task-fields">Task fields</TabsTrigger>
            <TabsTrigger value="departments">Departments</TabsTrigger>
            <TabsTrigger value="smtp">SMTP</TabsTrigger>
            <TabsTrigger value="logs">Audit logs</TabsTrigger>
            <TabsTrigger value="commission-rules">Commission rules</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="users">
          <AdminUsers profiles={profiles ?? []} roles={roles ?? []} />
        </TabsContent>
        <TabsContent value="roles">
          <AdminRoles roles={roles ?? []} />
        </TabsContent>
        <TabsContent value="lead-stages">
          <AdminLeadStages />
        </TabsContent>
        <TabsContent value="task-stages">
          <AdminTaskStages />
        </TabsContent>
        <TabsContent value="lead-fields">
          <AdminLeadFields />
        </TabsContent>
        <TabsContent value="task-fields">
          <AdminTaskFields />
        </TabsContent>
        <TabsContent value="departments">
          <Card>
            <CardHeader>
              <CardTitle>Departments</CardTitle>
              <CardDescription>
                Manage departments, SOP content, and SOP task checklists.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/departments">
                <span className="text-primary underline font-medium">
                  Go to Departments →
                </span>
                <span className="text-primary underline font-medium">Go to Departments →</span>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="smtp">
          <AdminSMTP />
        </TabsContent>
        <TabsContent value="logs">
          <AdminAuditLogs logs={activityLogs ?? []} />
        </TabsContent>
        <TabsContent value="commission-rules">
          <AdminCommissionRules />
        </TabsContent>
      </Tabs>
    </div>
  );
}
