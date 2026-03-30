import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { LeadKanban } from "@/components/leads/lead-kanban";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeadList } from "@/components/leads/lead-list";

export default async function LeadsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: leads } = await supabase
    .from("leads")
    .select(
      `
      id,
      company_name,
      website,
      stage_id,
      created_at,
      lead_stages(id, name, slug)
    `,
    )
    .order("created_at", { ascending: false });



  const { data: stages } = await supabase
    .from("lead_stages")
    .select("id,name,slug,order_index")
    .order("order_index");
  console.log("stages", stages);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold">Leads</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage leads, stages, meetings, and notes.
            <span className="hidden md:inline">
              Drag cards between columns to change stage.
            </span>
          </p>
        </div>

        <div className="flex-shrink-0">
          <Button asChild className="w-full sm:w-auto">
            <Link href="/leads/new">
              <Plus className="h-4 w-4 mr-2" />
              New lead
            </Link>
          </Button>
        </div>
      </div>
      <Tabs defaultValue="kanban">
        <TabsList>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
          <TabsTrigger value="list">List</TabsTrigger>
        </TabsList>
        <TabsContent value="kanban" className="mt-4">
          <LeadKanban initialLeads={leads ?? []} stages={stages ?? []} />
        </TabsContent>
        <TabsContent value="list" className="mt-4">
          <LeadList leads={leads ?? []} stages={stages ?? []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}