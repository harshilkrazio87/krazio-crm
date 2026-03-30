import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserWithRole } from "@/lib/get-user-role";
import { CommissionAdminView } from "@/components/commission/commission-admin-view";
import { CommissionUserView } from "@/components/commission/commission-user-view";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const knownSuperAdmins = ["admin@kraziocloud.com"];
const knownAdmins = ["harsh.p@kraziocloud.com"];

export default async function CommissionPage() {
  const userWithRole = await getUserWithRole();
  if (!userWithRole) redirect("/login");
  const isAdmin =
    userWithRole.isAdmin ||
    knownSuperAdmins.includes(userWithRole.email) ||
    knownAdmins.includes(userWithRole.email);
  const userId = userWithRole.id;
  const supabase = await createClient();

  const { data: rules } = await supabase
    .from("commission_rules")
    .select("id, name, rule_type, trigger_type, value, is_percentage")
    .order("created_at", { ascending: false });

  if (isAdmin) {
    const { data: entries } = await supabase
      .from("commission_entries")
      .select(`
        id,
        user_id,
        amount,
        status,
        reference_type,
        reference_id,
        month,
        year,
        created_at,
        commission_rules(id, name, is_percentage),
        profiles(id, full_name, email)
      `)
      .order("created_at", { ascending: false });

    const leadIds = (entries ?? [])
      .filter((e) => e.reference_type === "lead" && e.reference_id)
      .map((e) => e.reference_id as string);
    let leadsMap: Record<string, string> = {};
    if (leadIds.length > 0) {
      const { data: leads } = await supabase
        .from("leads")
        .select("id, company_name")
        .in("id", leadIds);
      leadsMap = (leads ?? []).reduce((acc, l) => ({ ...acc, [l.id]: l.company_name ?? "—" }), {});
    }

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Commission</h1>
          <p className="text-muted-foreground">
            Approve or reject commission entries. Rules define how commissions are calculated.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Active rules</CardTitle>
            <CardDescription>Commission rules used for meetings and project completion.</CardDescription>
          </CardHeader>
          <CardContent>
            {rules && rules.length > 0 ? (
              <ul className="space-y-2">
                {rules.map((r) => (
                  <li key={r.id} className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{r.name}</span>
                    <span className="text-muted-foreground">({r.trigger_type})</span>
                    <span className="text-muted-foreground">
                      {r.is_percentage ? `${Number(r.value)}%` : `₹${Number(r.value).toFixed(2)}`}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No commission rules. Add from Admin → Commission rules.</p>
            )}
          </CardContent>
        </Card>

        <CommissionAdminView entries={entries ?? []} leadsMap={leadsMap} />
      </div>
    );
  }

  const { data: entries } = await supabase
    .from("commission_entries")
    .select(`
      id,
      amount,
      status,
      month,
      year,
      created_at,
      commission_rules(name, is_percentage)
    `)
    .eq("user_id", userId)
    .order("year", { ascending: false })
    .order("month", { ascending: false });

  const now = new Date();
  const thisMonthApproved = (entries ?? [])
    .filter((e) => e.status === "approved" && e.month === now.getMonth() + 1 && e.year === now.getFullYear())
    .reduce((s, e) => s + Number(e.amount), 0);

      console.log("User role:", rules);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Commission</h1>
        <p className="text-muted-foreground">
          Your commission from successful meetings and project completion.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active rules</CardTitle>
          <CardDescription>Commission rules set by admin.</CardDescription>
        </CardHeader>
        <CardContent>
          {rules && rules.length > 0 ? (
            <ul className="space-y-2">
              {rules.map((r) => (
                <li key={r.id} className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{r.name}</span>
                  <span className="text-muted-foreground">
                    {r.is_percentage ? `${Number(r.value)}%` : `₹${Number(r.value).toFixed(2)}`}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No commission rules defined.</p>
          )}
        </CardContent>
      </Card>
      <CommissionUserView entries={entries ?? []} totalApprovedThisMonth={thisMonthApproved} />
    </div>
  );
}
