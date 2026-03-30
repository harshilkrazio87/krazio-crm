import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserWithRole } from "@/lib/get-user-role";
import { format, subDays, startOfDay, endOfDay, startOfQuarter, endOfQuarter } from "date-fns";
import { ReportsCharts } from "@/components/reports/reports-charts";
import type { ReportSummary, PerUserRow, LeadsOverTimeItem, StageItem, CommissionByPersonItem } from "@/components/reports/reports-charts";

type DateRange = "today" | "week" | "month" | "quarter";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const params = await searchParams;
  const range = (params.range as DateRange) || "month";
  const userWithRole = await getUserWithRole();
  if (!userWithRole) redirect("/login");
  const isAdmin = userWithRole.isAdmin;
  const isManager = userWithRole.isManager;
  const currentUserId = userWithRole.id;
  const supabase = await createClient();

  const now = new Date();
  let start: Date;
  let end: Date;
  if (range === "today") {
    start = startOfDay(now);
    end = endOfDay(now);
  } else if (range === "week") {
    start = startOfDay(subDays(now, 7));
    end = endOfDay(now);
  } else if (range === "quarter") {
    start = startOfQuarter(now);
    end = endOfQuarter(now);
  } else {
    start = startOfDay(subDays(now, 30));
    end = endOfDay(now);
  }
  const startStr = start.toISOString();
  const endStr = end.toISOString();

  const [
    { count: completedTasks },
    { count: pendingTasks },
    { count: totalLeads },
    wonStageRes,
    commissionApprovedRes,
  ] = await Promise.all([
    supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .is("parent_task_id", null)
      .eq("status", "completed")
      .gte("completed_at", startStr)
      .lte("completed_at", endStr),
    supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .is("parent_task_id", null)
      .neq("status", "completed")
      .gte("created_at", startStr)
      .lte("created_at", endStr),
    supabase.from("leads").select("*", { count: "exact", head: true }).gte("created_at", startStr).lte("created_at", endStr),
    supabase.from("lead_stages").select("id").eq("slug", "won").single(),
    supabase
      .from("commission_entries")
      .select("user_id, amount")
      .eq("status", "approved")
      .gte("created_at", startStr)
      .lte("created_at", endStr),
  ]);

  const { data: wonStage } = wonStageRes;
  const { count: wonLeads } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("stage_id", wonStage?.id ?? "")
    .gte("updated_at", startStr)
    .lte("updated_at", endStr);

  const totalCommissionPaid = (commissionApprovedRes.data ?? []).reduce((s, e) => s + Number(e.amount), 0);

  const summary: ReportSummary = {
    tasksCompleted: completedTasks ?? 0,
    tasksPending: pendingTasks ?? 0,
    leadsAdded: totalLeads ?? 0,
    leadsWon: wonLeads ?? 0,
    commissionPaid: totalCommissionPaid,
  };

  const { data: allProfiles } = await supabase
    .from("profiles")
    .select("id, full_name, email, manager_id")
    .order("full_name");

  let visibleProfileIds: string[];
  if (isAdmin) {
    visibleProfileIds = (allProfiles ?? []).map((p) => p.id);
  } else if (isManager) {
    const teamIds = (allProfiles ?? []).filter((p) => p.manager_id === currentUserId).map((p) => p.id);
    visibleProfileIds = [currentUserId, ...teamIds];
  } else {
    visibleProfileIds = [currentUserId];
  }

  const { data: tasksInRange } = await supabase
    .from("tasks")
    .select("id, status")
    .is("parent_task_id", null)
    .gte("created_at", startStr)
    .lte("created_at", endStr);

  const taskIds = (tasksInRange ?? []).map((t) => t.id);
  const { data: taskAssignments } = await supabase
    .from("task_assignees")
    .select("user_id, task_id")
    .in("task_id", taskIds.length ? taskIds : ["00000000-0000-0000-0000-000000000000"]);

  const { data: leadsData } = await supabase
    .from("leads")
    .select("owner_id, created_at, stage_id")
    .gte("created_at", startStr)
    .lte("created_at", endStr);

  const { data: meetingsInRange } = await supabase
    .from("lead_meetings")
    .select("lead_id, leads(owner_id)")
    .gte("scheduled_at", startStr)
    .lte("scheduled_at", endStr);

  const { data: stages } = await supabase.from("lead_stages").select("id, name").order("order_index");
  const stageIds = (stages ?? []).map((s) => s.id);
  const stageCounts: Record<string, number> = {};
  for (const sid of stageIds) stageCounts[sid] = 0;
  for (const l of leadsData ?? []) {
    if (l.stage_id) stageCounts[l.stage_id] = (stageCounts[l.stage_id] ?? 0) + 1;
  }
  const stageDistribution: StageItem[] = (stages ?? []).map((s, i) => ({
    name: s.name,
    value: stageCounts[s.id] ?? 0,
    color: ["#64748b", "#3b82f6", "#f59e0b", "#06b6d4", "#8b5cf6", "#22c55e", "#ef4444"][i % 7],
  }));

  const dateCount: Record<string, number> = {};
  const days = Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) || 1;
  for (let d = 0; d <= Math.min(days, 31); d++) {
    const dte = new Date(start);
    dte.setDate(dte.getDate() + d);
    dateCount[format(dte, "yyyy-MM-dd")] = 0;
  }
  for (const l of leadsData ?? []) {
    const key = format(new Date(l.created_at), "yyyy-MM-dd");
    if (dateCount[key] !== undefined) dateCount[key]++;
  }
  const leadsOverTime: LeadsOverTimeItem[] = Object.entries(dateCount)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  const completedTaskIds = new Set((tasksInRange ?? []).filter((t) => t.status === "completed").map((t) => t.id));
  const meetingsByOwner: Record<string, number> = {};
  for (const m of meetingsInRange ?? []) {
    const leads = m.leads as unknown;
    const lead = Array.isArray(leads) ? (leads[0] as { owner_id?: string | null }) : (leads as { owner_id?: string | null } | null);
    const ownerId = lead?.owner_id ?? null;
    if (ownerId) meetingsByOwner[ownerId] = (meetingsByOwner[ownerId] ?? 0) + 1;
  }
  const commissionByUserId: Record<string, number> = {};
  for (const e of commissionApprovedRes.data ?? []) {
    commissionByUserId[e.user_id] = (commissionByUserId[e.user_id] ?? 0) + Number(e.amount);
  }

  const visibleProfiles = (allProfiles ?? []).filter((p) => visibleProfileIds.includes(p.id));
  const perUserStats: PerUserRow[] = visibleProfiles.map((p) => {
    const assigned = taskAssignments?.filter((a) => a.user_id === p.id) ?? [];
    const tasksAssigned = assigned.length;
    const tasksCompleted = assigned.filter((a) => completedTaskIds.has(a.task_id)).length;
    const completionPct = tasksAssigned > 0 ? Math.round((tasksCompleted / tasksAssigned) * 100) : 0;
    const leadsAdded = leadsData?.filter((l) => l.owner_id === p.id).length ?? 0;
    const meetingsDone = meetingsByOwner[p.id] ?? 0;
    const commissionEarned = commissionByUserId[p.id] ?? 0;
    return {
      name: p.full_name || p.email || "—",
      email: p.email,
      tasksAssigned,
      tasksCompleted,
      completionPct,
      leadsAdded,
      meetingsDone,
      commissionEarned,
    };
  });

  const commissionByPerson: CommissionByPersonItem[] = perUserStats
    .filter((u) => u.commissionEarned > 0)
    .map((u) => ({ name: u.name, amount: u.commissionEarned }));

  return (
    <ReportsCharts
      range={range}
      summary={summary}
      perUserStats={perUserStats}
      leadsOverTime={leadsOverTime}
      stageDistribution={stageDistribution}
      commissionByPerson={commissionByPerson.length > 0 ? commissionByPerson : [{ name: "—", amount: 0 }]}
    />
  );
}
