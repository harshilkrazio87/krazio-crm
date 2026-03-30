import { createClient } from "@/lib/supabase/client";

export async function logActivity(
  action: string,
  entityType: string,
  entityId?: string | null,
  details?: Record<string, unknown>
) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("activity_logs").insert({
      user_id: user.id,
      action,
      entity_type: entityType,
      entity_id: entityId ?? null,
      details: details ?? {},
      browser:
        typeof navigator !== "undefined" ? navigator.userAgent.substring(0, 200) : "unknown",
    });
  } catch {
    // Silent fail - logs should never break the app
  }
}
