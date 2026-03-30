import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("sop_tasks")
    .select("id, title, description, priority, order_index, created_at")
    .eq("department_id", id)
    .order("order_index");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role_id, roles(slug)")
    .eq("id", user.id)
    .single();
  const rolesData = profile?.roles as { slug: string } | { slug: string }[] | null;
  const roleSlug = Array.isArray(rolesData) ? rolesData[0]?.slug : rolesData?.slug;
  if (roleSlug !== "super_admin" && roleSlug !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const title = body?.title as string;
  const description = body?.description as string | undefined;
  const priority = (body?.priority as string) || "medium";

  if (!title || typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const { data: maxOrder } = await supabase
    .from("sop_tasks")
    .select("order_index")
    .eq("department_id", id)
    .order("order_index", { ascending: false })
    .limit(1)
    .single();

  const order_index = (maxOrder?.order_index ?? -1) + 1;

  const { data: row, error } = await supabase
    .from("sop_tasks")
    .insert({
      department_id: id,
      title: title.trim(),
      description: description?.trim() || null,
      priority: ["low", "medium", "high"].includes(priority) ? priority : "medium",
      order_index,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(row);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: departmentId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role_id, roles(slug)")
    .eq("id", user.id)
    .single();
  const rolesData = profile?.roles as { slug: string } | { slug: string }[] | null;
  const roleSlug = Array.isArray(rolesData) ? rolesData[0]?.slug : rolesData?.slug;
  if (roleSlug !== "super_admin" && roleSlug !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const order = body?.order as string[]; // array of task ids in new order

  if (!Array.isArray(order) || order.length === 0) {
    return NextResponse.json({ error: "order array required" }, { status: 400 });
  }

  for (let i = 0; i < order.length; i++) {
    await supabase.from("sop_tasks").update({ order_index: i }).eq("id", order[i]).eq("department_id", departmentId);
  }
  return NextResponse.json({ ok: true });
}
