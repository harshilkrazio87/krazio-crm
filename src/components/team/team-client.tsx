"use client";

import { TeamTable } from "@/components/team/team-table";
import { TeamTree } from "@/components/team/team-tree";

export type TeamClientProfile = {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url?: string | null;
  manager_id?: string | null;
  role_id?: string | null;
  is_active?: boolean | null;
  employee_id?: string | null;
  phone?: string | null;
  department_id?: string | null;
  joining_date?: string | null;
  manager_name?: string | null;
  roles?: { id: string; name: string; slug: string } | { id: string; name: string; slug: string }[];
  departments?: { id: string; name: string } | { id: string; name: string }[] | null;
};

export type TeamClientRole = { id: string; name: string; slug: string };
export type TeamClientDepartment = { id: string; name: string };

// Cast to satisfy TeamTable/TeamTree strict Profile types (avatar_url, manager_id, role_id required there)
type TableProfile = Parameters<typeof TeamTable>[0]["profiles"][number];
type TreeProfile = Parameters<typeof TeamTree>[0]["profiles"][number];

/** Client wrapper for team page: table + tree view */
export function TeamClient({
  profiles,
  roles,
  departments,
  isAdmin,
}: {
  profiles: TeamClientProfile[];
  roles: TeamClientRole[];
  departments: TeamClientDepartment[];
  isAdmin: boolean;
}) {
  const tableProfiles = profiles as TableProfile[];
  const treeView = <TeamTree profiles={profiles as TreeProfile[]} />;
  return (
    <TeamTable
      profiles={tableProfiles}
      roles={roles}
      departments={departments}
      isAdmin={isAdmin}
      treeView={treeView}
    />
  );
}
