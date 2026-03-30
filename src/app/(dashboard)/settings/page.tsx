import { getUserWithRole } from "@/lib/get-user-role";
import { createClient } from "@/lib/supabase/server";
import { SettingsClient } from "@/components/settings/settings-client";

function getStr(v: unknown): string {
  if (typeof v === "string") return v;
  if (v && typeof v === "object" && "value" in v && typeof (v as { value: unknown }).value === "string")
    return (v as { value: string }).value;
  return "";
}

const knownSuperAdmins = ["admin@kraziocloud.com"];
const knownAdmins = ["harsh.p@kraziocloud.com"];

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userWithRole = await getUserWithRole();
  const isAdmin =
    (userWithRole?.isAdmin ?? false) ||
    knownSuperAdmins.includes(user?.email ?? "") ||
    knownAdmins.includes(user?.email ?? "");

  let initialSettings: {
    companyName: string;
    logoUrl: string;
    smtp: { host: string; port: string; username: string; password: string; from_email: string; from_name: string };
    geminiApiKey: string;
  } = {
    companyName: "",
    logoUrl: "",
    smtp: { host: "", port: "587", username: "", password: "", from_email: "", from_name: "" },
    geminiApiKey: "",
  };

  if (isAdmin) {
    const keys = ["company_name", "logo_url", "smtp", "gemini_api_key"];
    const rows = await Promise.all(
      keys.map(async (key) => {
        const { data } = await supabase.from("app_settings").select("key, value").eq("key", key).maybeSingle();
        return data;
      })
    );
    const byKey: Record<string, unknown> = {};
    rows.forEach((r) => {
      if (r) byKey[r.key] = r.value;
    });
    const smtp = byKey.smtp as { host?: string; port?: number; user?: string; pass?: string; from?: string; from_name?: string } | undefined;
    initialSettings = {
      companyName: getStr(byKey.company_name),
      logoUrl: getStr(byKey.logo_url),
      smtp: {
        host: smtp?.host ?? "",
        port: String(smtp?.port ?? 587),
        username: smtp?.user ?? "",
        password: smtp?.pass ?? "",
        from_email: smtp?.from ?? "",
        from_name: smtp?.from_name ?? "",
      },
      geminiApiKey: getStr(byKey.gemini_api_key),
    };
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          {isAdmin ? "Manage your profile and app settings (General, SMTP, API keys)." : "Manage your profile and password."}
        </p>
        {isAdmin && (
          <p className="text-xs text-green-600 mt-1">
            ✓ Admin access enabled — all settings tabs available
          </p>
        )}
      </div>
      <SettingsClient isAdmin={isAdmin} initialSettings={initialSettings} />
    </div>
  );
}
