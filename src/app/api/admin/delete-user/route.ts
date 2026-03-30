import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(request: NextRequest) {
  try {
    const callerSupabase = await createClient();
    const { data: { user: caller } } = await callerSupabase.auth.getUser();
    if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const { userId } = body;
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    if (userId === caller.id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
    }

    const service = createServiceClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    await service.from("task_assignees").delete().eq("user_id", userId);
    await service.from("task_timers").delete().eq("user_id", userId);
    await service.from("activity_logs").delete().eq("user_id", userId);
    await service.from("sticky_notes").delete().eq("user_id", userId);
    await service.from("password_vault").delete().eq("user_id", userId);
    await service.from("notifications").delete().eq("user_id", userId);
    await service.from("daily_productivity").delete().eq("user_id", userId);
    await service.from("lead_notes").delete().eq("created_by", userId);
    await service.from("profiles").update({ manager_id: null }).eq("manager_id", userId);

    const { error: profileError } = await service.from("profiles").delete().eq("id", userId);
    if (profileError) {
      return NextResponse.json({ error: "Failed to delete profile: " + profileError.message }, { status: 500 });
    }

    const { error: authError } = await service.auth.admin.deleteUser(userId);
    if (authError) {
      return NextResponse.json({ error: "Failed to delete auth user: " + authError.message }, { status: 500 });
    }

    try {
      await service.from("activity_logs").insert({
        user_id: caller.id,
        action: "delete_user",
        entity_type: "user",
        entity_id: userId,
        details: { deleted_by: caller.email },
      });
    } catch {
      // ignore
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
