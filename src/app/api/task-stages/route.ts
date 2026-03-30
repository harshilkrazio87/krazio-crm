import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/** Returns task stages for any authenticated user (used in task list, detail, form). */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("task_stages")
    .select("id, name, slug, color, order_index")
    .order("order_index", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
