import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getUserWithRole } from "@/lib/get-user-role";


  export async function PUT(
    req: Request,
    context: { params: Promise<{ id: string }> }
  ) {
    const { id } = await context.params;

    try {
      const supabase = await createClient();

      if (!id) {
        return NextResponse.json(
          { error: "ID missing" },
          { status: 400 }
        );
      }

      const userWithRole = await getUserWithRole();
      if (!userWithRole) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }

      // Get the lead to check ownership
      const { data: lead, error: fetchError } = await supabase
        .from("leads")
        .select("owner_id")
        .eq("id", id)
        .single();

      if (fetchError || !lead) {
        return NextResponse.json(
          { error: "Lead not found" },
          { status: 404 }
        );
      }

      // Check if user is admin or owner
      if (!userWithRole.isAdmin && !userWithRole.isSuperAdmin && lead.owner_id !== userWithRole.id) {
        return NextResponse.json(
          { error: "Forbidden" },
          { status: 403 }
        );
      }

      const body = await req.json();
      const {
        company_name,
        website,
        linkedin_company_url,
        requirements,
        stage_id,
        custom_fields,
        gemini_research,
      } = body;

      const updateData: Record<string, any> = {};
      if (company_name !== undefined) updateData.company_name = company_name;
      if (website !== undefined) updateData.website = website;
      if (linkedin_company_url !== undefined) updateData.linkedin_company_url = linkedin_company_url;
      if (requirements !== undefined) updateData.requirements = requirements;
      if (stage_id !== undefined) updateData.stage_id = stage_id;
      if (custom_fields !== undefined) updateData.custom_fields = custom_fields;
      if (gemini_research !== undefined) updateData.gemini_research = gemini_research;

      const { error } = await supabase
        .from("leads")
        .update(updateData)
        .eq("id", id);

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: "Updated successfully",
      });
    } catch (err) {
      console.error("API ERROR:", err);

      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const supabase = await createClient();

    if (!id) {
      return NextResponse.json(
        { error: "ID missing" },
        { status: 400 }
      );
    }

    const userWithRole = await getUserWithRole();
    if (!userWithRole) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the lead to check ownership
    const { data: lead, error: fetchError } = await supabase
      .from("leads")
      .select("owner_id")
      .eq("id", id)
      .single();
    console.log(lead);
    

    if (fetchError || !lead) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      );
    }

    // Check if user is admin or owner
    if (!userWithRole.isAdmin && !userWithRole.isSuperAdmin && lead.owner_id !== userWithRole.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // delete child
    await supabase.from("lead_notes").delete().eq("lead_id", id);
    await supabase.from("lead_meetings").delete().eq("lead_id", id);
    await supabase.from("lead_contacts").delete().eq("lead_id", id);

    // delete main
    const { error } = await supabase
      .from("leads")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Deleted successfully",
    });
  } catch (err) {
    console.error("API ERROR:", err);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
