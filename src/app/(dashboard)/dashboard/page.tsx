import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  ListTodo,
  Target,
  Users,
  Plus,
  BarChart3,
  Calendar,
  Activity,
  CheckCircle2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { getTaskColors } from "@/lib/utils/task-colors";

function getInitials(name: string | null, email: string) {
  if (name?.trim()) {
    return name
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

export default async function DashboardHomePage() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  fetch(`${baseUrl}/api/tasks/process-recurring`, { method: "POST" }).catch(() => {});

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  if (user && !profile) {
    try {
      await supabase.rpc("ensure_profile_for_user");
      const res = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      profile = res.data ?? undefined;
    } catch {
      // ignore
    }
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());

  const { data: wonStageRows } = await supabase.from("lead_stages").select("id").eq("slug", "won");
  const wonStageIds = wonStageRows?.map((s) => s.id) ?? [];

  const [
    { count: totalTasks },
    { count: completedToday },
    { count: totalLeads },
    { count: leadsThisWeek },
    wonResult,
    totalLeadsForRate,
    { count: teamCount },
    activeTodayResult,
  ] = await Promise.all([
    supabase.from("tasks").select("*", { count: "exact", head: true }).is("parent_task_id", null),
    supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed")
      .gte("completed_at", todayStart.toISOString())
      .lt("completed_at", todayEnd.toISOString()),
    supabase.from("leads").select("*", { count: "exact", head: true }),
    supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .gte("created_at", weekStart.toISOString()),
    wonStageIds.length > 0
      ? supabase.from("leads").select("id", { count: "exact", head: true }).in("stage_id", wonStageIds)
      : { count: 0 },
    supabase.from("leads").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("audit_logs").select("user_id", { count: "exact", head: true }).gte("created_at", todayStart.toISOString()),
  ]);

  const wonCount = wonResult.count ?? 0;
  const totalForRate = totalLeadsForRate.count ?? 1;
  const conversionRate = totalForRate > 0 ? Math.round((wonCount / totalForRate) * 100) : 0;
  const activeToday = activeTodayResult.count ?? 0;

  const { data: tasksDueToday } = await supabase
    .from("tasks")
    .select(`
      id,
      title,
      status,
      priority,
      due_date,
      task_assignees(user_id, profiles(id, full_name, email, avatar_url))
    `)
    .is("parent_task_id", null)
    .gte("due_date", todayStart.toISOString())
    .lt("due_date", todayEnd.toISOString())
    .order("due_date")
    .limit(10);

    

  const { data: todaysMeetings } = await supabase
    .from("lead_meetings")
    .select(`
      id,
      lead_id,
      scheduled_at,
      meeting_link,
      title,
      completed,
      leads(company_name, owner_id)
    `)
    .gte("scheduled_at", todayStart.toISOString())
    .lt("scheduled_at", todayEnd.toISOString())
    .order("scheduled_at");

  const { data: recentLeads } = await supabase
    .from("leads")
    .select(`
      id,
      company_name,
      created_at,
      lead_stages(id, name, slug)
    `)
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: stagesWithCount } = await supabase
    .from("lead_stages")
    .select("id, name, slug, order_index")
    .order("order_index");

  const stageCounts: Record<string, number> = {};
  for (const s of stagesWithCount ?? []) {
    const { count } = await supabase.from("leads").select("*", { count: "exact", head: true }).eq("stage_id", s.id);
    stageCounts[s.id] = count ?? 0;
  }

  const { data: recentActivity } = await supabase
    .from("audit_logs")
    .select(`
      id,
      user_id,
      action,
      entity_type,
      entity_id,
      created_at,
      profiles(id, full_name, email)
    `)
    .order("created_at", { ascending: false })
    .limit(10);

  const stageColors: Record<string, string> = {
    new: "bg-slate-500",
    contacted: "bg-blue-500",
    meeting_scheduled: "bg-amber-500",
    meeting_done: "bg-cyan-500",
    proposal: "bg-purple-500",
    won: "bg-green-500",
    lost: "bg-red-500",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back{profile?.full_name ? `, ${profile.full_name}` : profile?.email ? `, ${profile.email}` : ""}
        </h1>
        <p className="text-muted-foreground">
          Here’s an overview of your tasks, leads, and team.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-xl border shadow-sm transition-shadow hover:shadow-md overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-blue-500 to-blue-600" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ListTodo className="h-4 w-4" />
              Total Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalTasks ?? 0}</p>
            <p className="text-xs text-muted-foreground">{completedToday ?? 0} completed today</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border shadow-sm transition-shadow hover:shadow-md overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-purple-500 to-purple-600" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Total Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalLeads ?? 0}</p>
            <p className="text-xs text-muted-foreground">{leadsThisWeek ?? 0} added this week</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border shadow-sm transition-shadow hover:shadow-md overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-green-500 to-green-600" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Won Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{wonCount}</p>
            <p className="text-xs text-muted-foreground">{conversionRate}% conversion rate</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border shadow-sm transition-shadow hover:shadow-md overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-orange-500 to-orange-600" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Team Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{teamCount ?? 0}</p>
            <p className="text-xs text-muted-foreground">{activeToday} active today</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-xl border shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Today&apos;s Meetings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todaysMeetings && todaysMeetings.length > 0 ? (
              <ul className="space-y-2">
                {todaysMeetings.map((m: {
                  id: string;
                  lead_id: string;
                  scheduled_at: string;
                  meeting_link: string | null;
                  title: string | null;
                  completed: boolean;
                  leads: { company_name: string | null; owner_id: string | null } | { company_name: string | null; owner_id: string | null }[];
                }) => {
                  const lead = Array.isArray(m.leads) ? m.leads[0] : m.leads;
                  const company = (lead as { company_name?: string | null })?.company_name ?? "—";
                  const scheduled = new Date(m.scheduled_at);
                  const now = Date.now();
                  const ms = scheduled.getTime() - now;
                  const mins = Math.round(ms / 60000);
                  let status = "Upcoming";
                  if (m.completed) status = "Done";
                  else if (mins < 0) status = "Now";
                  else if (mins <= 30) status = "In 30 min";
                  return (
                    <li key={m.id} className="flex items-center justify-between gap-2 text-sm border-b border-border/50 pb-2 last:border-0 last:pb-0">
                      <div>
                        <span className="font-medium">{scheduled.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        <span className="text-muted-foreground mx-1">·</span>
                        <span>{company}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${status === "Done" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" : status === "In 30 min" || status === "Now" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" : "bg-muted text-muted-foreground"}`}>{status}</span>
                        {m.meeting_link && (
                          <a href={m.meeting_link} target="_blank" rel="noopener noreferrer" className="text-primary text-xs font-medium">Join</a>
                        )}
                        <Link href={`/leads/${m.lead_id}`} className="text-primary text-xs font-medium">View</Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No meetings scheduled for today.</p>
            )}
          </CardContent>
        </Card>
        <Card className="rounded-xl border shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Tasks Due Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tasksDueToday && tasksDueToday.length > 0 ? (
              <ul className="space-y-2">
                {tasksDueToday.map((t: { id: string; title: string; status?: string; priority?: string; due_date?: string | null; task_assignees?: { profiles: { full_name: string | null; email: string; avatar_url?: string | null } | { full_name: string | null; email: string; avatar_url?: string | null }[] }[] }) => {
                  const assignee = t.task_assignees?.[0];
                  const p = assignee && (Array.isArray(assignee.profiles) ? assignee.profiles[0] : assignee.profiles);
                  const name = p?.full_name ?? null;
                  const email = p?.email ?? "";
                  const colors = getTaskColors(t.status ?? "pending", t.priority ?? "medium", t.due_date);
                  return (
                    <li key={t.id}>
                      <Link href={`/tasks/${t.id}`} className={`flex items-center gap-2 rounded-lg border p-2 hover:brightness-95 transition ${colors.cardBg} ${colors.cardBorder}`}>
                        <span className="font-medium flex-1 truncate">{t.title}</span>
                        <Badge className={colors.priorityBadge}>
                          {t.priority ?? "medium"}
                        </Badge>
                        {p?.avatar_url ? (
                          <img src={p.avatar_url} alt="" className="h-7 w-7 shrink-0 rounded-full object-cover" />
                        ) : (
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium">
                            {getInitials(name, email)}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center rounded-lg border border-dashed">
                No tasks due today 🎉
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="rounded-xl border shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Recent Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentLeads && recentLeads.length > 0 ? (
              <ul className="space-y-2">
                {recentLeads.map((l: { id: string; company_name: string | null; created_at: string; lead_stages: { name: string; slug: string } | { name: string; slug: string }[] | null }) => {
                  const stage = Array.isArray(l.lead_stages) ? l.lead_stages[0] : l.lead_stages;
                  return (
                    <li key={l.id}>
                      <Link href={`/leads/${l.id}`} className="flex items-center gap-2 rounded-lg border p-2 hover:bg-muted/50">
                        <span className="font-medium flex-1 truncate">{l.company_name || "—"}</span>
                        <Badge variant="secondary">{stage?.name ?? "—"}</Badge>
                        <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(l.created_at), { addSuffix: true })}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center rounded-lg border border-dashed">
                No leads yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-xl border shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Lead Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stagesWithCount?.map((s) => (
                <div key={s.id} className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full shrink-0 ${stageColors[s.slug] ?? "bg-gray-400"}`} />
                  <span className="text-sm w-32 shrink-0">{s.name}</span>
                  <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
                    <div
                      className="h-full bg-primary/60 rounded"
                      style={{ width: `${Math.max(2, (stageCounts[s.id] ?? 0) * 8)}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-8">{stageCounts[s.id] ?? 0}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild size="sm">
              <Link href="/tasks/new">
                <Plus className="h-4 w-4 mr-1" />
                New Task
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/leads/new">
                <Plus className="h-4 w-4 mr-1" />
                New Lead
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/reports">
                <BarChart3 className="h-4 w-4 mr-1" />
                View Reports
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/team">
                <Users className="h-4 w-4 mr-1" />
                Team
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-xl border shadow-sm transition-shadow hover:shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity && recentActivity.length > 0 ? (
            <ul className="space-y-2">
              {recentActivity.map((a: { id: string; action: string; entity_type: string | null; entity_id: string | null; created_at: string; profiles?: { full_name: string | null; email: string } | { full_name: string | null; email: string }[] | null }) => {
                const p = Array.isArray(a.profiles) ? a.profiles[0] : a.profiles;
                const name = p?.full_name ?? p?.email ?? "Someone";
                return (
                  <li key={a.id} className="flex items-center gap-2 rounded-lg border p-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium">
                      {typeof name === "string" && name.includes("@") ? name.slice(0, 2).toUpperCase() : name.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="text-sm flex-1">
                      {name} {a.action} {a.entity_type ?? "item"} {a.entity_id ? `(${String(a.entity_id).slice(0, 8)}…)` : ""}
                    </span>
                    <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">No recent activity</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
