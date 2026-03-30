import { LeadForm } from "@/components/leads/lead-form";
import { createClient } from "@/lib/supabase/server";

export default async function EditPage({ params }: any) {
  const supabase = await createClient();
  const { id } = await params;
  console.log(id);
  

  const { data: lead, error } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .single();

  console.log(lead);
  
  if (error) {
    console.error("Error fetching lead:", error);
    return <div>Error fetching lead</div>;
  }

  return (
    <LeadForm
      initialData={lead}
      isEdit={true}
      stages={[]}
      profiles={[]}
      industries={[]}
      departments={[]}
      technologies={[]}
    />
  );
}