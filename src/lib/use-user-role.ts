"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export interface UseUserRoleResult {
  role: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isManager: boolean;
  userId: string;
  email: string;
  profile: Record<string, unknown> | null;
  loading: boolean;
}

export function useUserRole(): UseUserRoleResult {
  const [state, setState] = useState<UseUserRoleResult>({
    role: "user",
    isAdmin: false,
    isSuperAdmin: false,
    isManager: false,
    userId: "",
    email: "",
    profile: null,
    loading: true,
  });

  useEffect(() => {
    async function fetchRole() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setState((s) => ({ ...s, loading: false }));
        return;
      }

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
        if (role?.slug) roleSlug = role.slug;
      }

      if (roleSlug === "user" && user.email === "admin@kraziocloud.com") {
        roleSlug = "super_admin";
      }

      setState({
        role: roleSlug,
        isAdmin: ["admin", "super_admin"].includes(roleSlug),
        isSuperAdmin: roleSlug === "super_admin",
        isManager: ["manager", "admin", "super_admin"].includes(roleSlug),
        userId: user.id,
        email: user.email ?? "",
        profile: profile ?? null,
        loading: false,
      });
    }
    fetchRole();
  }, []);

  return state;
}
