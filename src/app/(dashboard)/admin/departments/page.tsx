import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserWithRole } from "@/lib/get-user-role";
import { DepartmentsAdmin } from "@/components/admin/departments-admin";

export default async function AdminDepartmentsPage() {
  const userWithRole = await getUserWithRole();
  if (!userWithRole) redirect("/login");
  if (!userWithRole.isAdmin) redirect("/dashboard");
  const supabase = await createClient();

  const { data: departments } = await supabase
    .from("departments")
    .select("id, name, description, sop_content, sop_fields, updated_at")
    .order("name");

  const { data: profiles } = await supabase.from("profiles").select("id, department_id");

  const memberCountByDept: Record<string, number> = {};
  (profiles ?? []).forEach((p) => {
    const did = p.department_id as string | null;
    if (did) memberCountByDept[did] = (memberCountByDept[did] ?? 0) + 1;
  });

  const departmentsWithCount = (departments ?? []).map((d) => ({
    ...d,
    members_count: memberCountByDept[d.id] ?? 0,
  }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Departments</h1>
        <p className="text-muted-foreground">
          Manage departments, SOP content, custom fields, and SOP task checklists. Assign departments to users on Team.
        </p>
      </div>
      <DepartmentsAdmin initialDepartments={departmentsWithCount} />
    </div>
  );
}
