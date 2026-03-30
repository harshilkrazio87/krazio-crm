"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Rule = { id: string; name: string; is_percentage: boolean };
type Prof = { id: string; full_name: string | null; email: string };
type Entry = {
  id: string;
  user_id: string;
  amount: number | string;
  status: string;
  reference_type: string | null;
  reference_id: string | null;
  month: number | null;
  year: number | null;
  created_at: string;
  commission_rules: Rule | Rule[] | null;
  profiles: Prof | Prof[] | null;
};

export function CommissionAdminView({
  entries,
  leadsMap,
}: {
  entries: Entry[];
  leadsMap: Record<string, string>;
}) {
  async function updateStatus(id: string, status: "approved" | "rejected") {
    const path = status === "approved" ? `/api/commission/${id}/approve` : `/api/commission/${id}/reject`;
    const res = await fetch(path, { method: "POST" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Failed to update");
      return;
    }
    toast.success(status === "approved" ? "Approved" : "Rejected");
    window.location.reload();
  }

  if (entries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>All commissions</CardTitle>
          <CardDescription>No commission entries yet.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-6 text-center">No commissions yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All commissions</CardTitle>
        <CardDescription>Approve or reject each entry.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 font-medium">User Name</th>
                <th className="text-left py-2 font-medium">Lead/Company</th>
                <th className="text-right py-2 font-medium">Amount</th>
                <th className="text-left py-2 font-medium">Type</th>
                <th className="text-left py-2 font-medium">Status</th>
                <th className="text-left py-2 font-medium">Date</th>
                <th className="text-right py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => {
                const profile = Array.isArray(e.profiles) ? e.profiles[0] : e.profiles;
                const rule = Array.isArray(e.commission_rules) ? e.commission_rules[0] : e.commission_rules;
                const userName = profile?.full_name || profile?.email || "—";
                const leadCompany =
                  e.reference_type === "lead" && e.reference_id
                    ? leadsMap[e.reference_id] ?? "—"
                    : e.reference_type ?? "—";
                const typeLabel = rule?.is_percentage ? "%" : "Flat";
                return (
                  <tr key={e.id} className="border-b last:border-0">
                    <td className="py-2">{userName}</td>
                    <td className="py-2">{leadCompany}</td>
                    <td className="py-2 text-right">₹{Number(e.amount).toFixed(2)}</td>
                    <td className="py-2">{typeLabel}</td>
                    <td className="py-2">
                      <Badge
                        className={cn(
                          e.status === "pending" && "bg-yellow-500/20 text-yellow-700 dark:bg-yellow-500/30 dark:text-yellow-300",
                          e.status === "approved" && "bg-green-500/20 text-green-700 dark:bg-green-500/30 dark:text-green-300",
                          e.status === "rejected" && "bg-red-500/20 text-red-700 dark:bg-red-500/30 dark:text-red-300"
                        )}
                      >
                        {e.status}
                      </Badge>
                    </td>
                    <td className="py-2 text-muted-foreground">
                      {format(new Date(e.created_at), "PP")}
                    </td>
                    <td className="py-2 text-right">
                      {e.status === "pending" && (
                        <span className="flex gap-1 justify-end">
                          <Button
                            size="sm"
                            variant="default"
                            className="h-7 text-xs"
                            onClick={() => updateStatus(e.id, "approved")}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-7 text-xs"
                            onClick={() => updateStatus(e.id, "rejected")}
                          >
                            Reject
                          </Button>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
