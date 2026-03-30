import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { LeadDetail } from "@/components/leads/lead-detail";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: lead } = await supabase
    .from("leads")
    .select(
      `
      id,
      owner_id,
      company_name,
      website,
      linkedin_company_url,
      requirements,
      stage_id,
      department_id,
      industry_id,
      custom_fields,
      gemini_research,
      created_at,
      updated_at,
      lead_stages(id, name, slug, is_meeting_stage)
    `,
    )
    .eq("id", id)
    .single();

  if (!lead) notFound();

  const { data: ownerProfile } = lead.owner_id
    ? await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("id", lead.owner_id)
        .single()
    : { data: null };

  const { data: contacts } = await supabase
    .from("lead_contacts")
    .select("*")
    .eq("lead_id", id);

  const { data: notes } = await supabase
    .from("lead_notes")
    .select("id, content, created_at, profiles(full_name)")
    .eq("lead_id", id)
    .order("created_at", { ascending: false });

  const { data: meetings } = await supabase
    .from("lead_meetings")
    .select("*")
    .eq("lead_id", id)
    .order("scheduled_at");

  const { data: stages } = await supabase
    .from("lead_stages")
    .select("id, name, slug")
    .order("order_index");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/leads">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
          <h1 className="text-2xl font-bold">Lead</h1>
      </div>
      <LeadDetail
        lead={lead}
        owner={ownerProfile ?? undefined}
        contacts={contacts ?? []}
        notes={notes ?? []}
        meetings={meetings ?? []}
        stages={stages ?? []}
      />
    </div>
  );
}
