import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getUserWithRole } from "@/lib/get-user-role";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const userWithRole = await getUserWithRole();
    if (!userWithRole) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      owner_id,
      company_name,
      website,
      linkedin_company_url,
      requirements,
      stage_id,
      custom_fields,
      gemini_research,
    } = body;

    if (!company_name) {
      return NextResponse.json(
        { error: "Company name is required" },
        { status: 400 }
      );
    }

    // Set owner_id to current user if not provided or if not admin
    const finalOwnerId = (!userWithRole.isAdmin && !userWithRole.isSuperAdmin) ? userWithRole.id : (owner_id || userWithRole.id);

    const { data: lead, error } = await supabase
      .from("leads")
      .insert({
        owner_id: finalOwnerId,
        company_name: company_name.trim(),
        website: website?.trim() || null,
        linkedin_company_url: linkedin_company_url?.trim() || null,
        requirements: requirements?.trim() || null,
        stage_id: stage_id || null,
        custom_fields: custom_fields || {},
        gemini_research: gemini_research || null,
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Created successfully",
      lead,
    });
  } catch (err) {
    console.error("API ERROR:", err);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}