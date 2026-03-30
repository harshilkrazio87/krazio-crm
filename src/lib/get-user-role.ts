import { createClient } from "@/lib/supabase/server";

export type UserRole = "super_admin" | "admin" | "manager" | "sales" | "user";

const knownSuperAdmins = ["admin@kraziocloud.com"];
const knownAdmins = ["harsh.p@kraziocloud.com"];

export function isAdminByEmail(email: string): boolean {
  return knownSuperAdmins.includes(email) || knownAdmins.includes(email);
}

export interface UserWithRole {
  id: string;
  email: string;
  role: string;
  roleId: string | null;
  profile: Record<string, unknown> | null;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isManager: boolean;
}

export async function getUserWithRole(): Promise<UserWithRole | null> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    let roleSlug = "user";

    if (profile?.role_id) {
      const { data: role } = await supabase
        .from("roles")
        .select("slug")
        .eq("id", profile.role_id)
        .maybeSingle();

      if (role?.slug) {
        roleSlug = role.slug;
      }
    }

    if (roleSlug === "user" && user.email === "admin@kraziocloud.com") {
      roleSlug = "super_admin";
    }

    return {
      id: user.id,
      email: user.email ?? "",
      role: roleSlug,
      roleId: profile?.role_id ?? null,
      profile: profile ?? null,
      isSuperAdmin: roleSlug === "super_admin",
      isAdmin: roleSlug === "admin" || roleSlug === "super_admin",
      isManager: ["manager", "admin", "super_admin"].includes(roleSlug),
    };
  } catch {
    return null;
  }
}
