"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type Rule = { name: string; is_percentage: boolean };
type Entry = {
  id: string;
  amount: number | string;
  status: string;
  month: number | null;
  year: number | null;
  created_at: string;
  commission_rules: Rule | Rule[] | null;
};

export function CommissionUserView({
  entries,
  totalApprovedThisMonth,
}: {
  entries: Entry[];
  totalApprovedThisMonth: number;
}) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Total approved this month</CardTitle>
          <CardDescription>Sum of all approved commission entries for the current month.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">₹{totalApprovedThisMonth.toFixed(2)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your commissions</CardTitle>
          <CardDescription>History of your commission entries. Pending entries require admin approval.</CardDescription>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No commission entries yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium">Rule</th>
                    <th className="text-right py-2 font-medium">Amount</th>
                    <th className="text-left py-2 font-medium">Status</th>
                    <th className="text-left py-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e) => {
                    const rule = Array.isArray(e.commission_rules) ? e.commission_rules[0] : e.commission_rules;
                    return (
                      <tr key={e.id} className="border-b last:border-0">
                        <td className="py-2">{rule?.name ?? "—"}</td>
                        <td className="py-2 text-right">₹{Number(e.amount).toFixed(2)}</td>
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
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
