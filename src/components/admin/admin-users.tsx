"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role_id: string | null;
  manager_id: string | null;
  created_at: string;
  roles?: { id?: string; name: string; slug: string } | { id?: string; name: string; slug: string }[] | null;
};

type Role = { id: string; name: string; slug: string; level: number };

export function AdminUsers({ profiles, roles }: { profiles: Profile[]; roles: Role[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Users</CardTitle>
        <CardDescription>Add users by email from Supabase Auth dashboard or via API. Assign role and manager here.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {profiles.map((p) => (
            <li key={p.id} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <span className="font-medium">{p.full_name || p.email}</span>
                <span className="text-muted-foreground ml-2">{p.email}</span>
                <Badge variant="secondary" className="ml-2">
                  {Array.isArray(p.roles) ? p.roles[0]?.name : (p.roles as { name: string } | null)?.name ?? "—"}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground">
                {format(new Date(p.created_at), "PP")}
              </span>
            </li>
          ))}
        </ul>
        {profiles.length === 0 && (
          <p className="text-sm text-muted-foreground">No users. Create accounts via Supabase Auth and they will get a profile.</p>
        )}
      </CardContent>
    </Card>
  );
}
