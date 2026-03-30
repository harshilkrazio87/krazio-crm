import { NextResponse } from "next/server";
import { getUserWithRole } from "@/lib/get-user-role";

export async function GET() {
  const userWithRole = await getUserWithRole();
  if (!userWithRole) {
    return NextResponse.json({
      error: "not logged in",
      hint: "Log in at /login first, then open this URL again in the same browser.",
    });
  }

  return NextResponse.json({
    user_id: userWithRole.id,
    email: userWithRole.email,
    role: userWithRole.role,
    roleId: userWithRole.roleId,
    isSuperAdmin: userWithRole.isSuperAdmin,
    isAdmin: userWithRole.isAdmin,
    isManager: userWithRole.isManager,
    profile: userWithRole.profile,
    ok: "Role is derived from profile.role_id → roles.slug. Known admin emails get fallback access.",
  });
}
