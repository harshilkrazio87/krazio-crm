import { createClient } from "@/lib/supabase/server";
import { LeadForm } from "@/components/leads/lead-form";

const DEFAULT_INDUSTRIES = ["Technology", "Healthcare", "Finance", "Retail", "Manufacturing", "Other"];
const DEFAULT_DEPARTMENTS = ["Sales", "Marketing", "Engineering", "Operations", "HR", "Other"];
const DEFAULT_TECHNOLOGIES = ["React", "Node.js", "Python", "AWS", "Azure", "Other"];

function getList(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((x) => typeof x === "string");
  if (value && typeof value === "object" && "value" in value && Array.isArray((value as { value: unknown }).value)) {
    return ((value as { value: unknown[] }).value).filter((x) => typeof x === "string");
  }
  return [];
}

export default async function NewLeadPage() {
  const supabase = await createClient();
  const [stagesRes, profilesRes, indRes, deptRes, techRes] = await Promise.all([
    supabase.from("lead_stages").select("id, name, slug").order("order_index"),
    supabase.from("profiles").select("id, full_name, email").order("full_name"),
    supabase.from("app_settings").select("value").eq("key", "industries").single(),
    supabase.from("app_settings").select("value").eq("key", "departments").single(),
    supabase.from("app_settings").select("value").eq("key", "technologies").single(),
  ]);

  const industries = getList(indRes.data?.value).length ? getList(indRes.data?.value) : DEFAULT_INDUSTRIES;
  const departments = getList(deptRes.data?.value).length ? getList(deptRes.data?.value) : DEFAULT_DEPARTMENTS;
  const technologies = getList(techRes.data?.value).length ? getList(techRes.data?.value) : DEFAULT_TECHNOLOGIES;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">New lead</h1>
        <p className="text-muted-foreground">
          Add company details, contacts, and requirements. Use AI research after entering company name.
        </p>
      </div>
      <LeadForm
        stages={stagesRes.data ?? []}
        profiles={profilesRes.data ?? []}
        industries={industries}
        departments={departments}
        technologies={technologies}
      />
    </div>
  );
}
