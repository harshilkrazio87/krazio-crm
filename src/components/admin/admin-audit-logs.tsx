import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function formatAction(action: string): string {
  return action
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function relativeTime(date: string): string {
  const d = new Date(date);
  const now = new Date();
  const sec = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)} min ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} hours ago`;
  if (sec < 604800) return `${Math.floor(sec / 86400)} days ago`;
  return d.toLocaleString();
}

type LogRow = {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  browser: string | null;
  created_at: string;
  profiles?: { full_name: string | null; email: string | null } | { full_name: string | null; email: string | null }[] | null;
};

export function AdminAuditLogs({ logs }: { logs: LogRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit logs</CardTitle>
        <CardDescription>
          User actions with entity and browser. Last 100 entries from activity_logs.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 font-medium">User</th>
                <th className="text-left py-2 font-medium">Action</th>
                <th className="text-left py-2 font-medium">Entity</th>
                <th className="text-left py-2 font-medium">Browser</th>
                <th className="text-left py-2 font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const profile = Array.isArray(log.profiles) ? log.profiles[0] : log.profiles;
                const userLabel = profile
                  ? [profile.full_name, profile.email].filter(Boolean).join(" · ") || "—"
                  : log.user_id
                    ? `${String(log.user_id).slice(0, 8)}…`
                    : "—";
                const entityLabel = [log.entity_type, log.entity_id].filter(Boolean).join(" ").trim() || "—";
                const entityTruncated = entityLabel.length > 30 ? entityLabel.slice(0, 30) + "…" : entityLabel;
                const browserTruncated = log.browser ? String(log.browser).slice(0, 50) : "—";
                return (
                  <tr key={log.id} className="border-b last:border-0">
                    <td className="py-2">{userLabel}</td>
                    <td className="py-2">{formatAction(log.action)}</td>
                    <td className="py-2 max-w-[140px] truncate text-muted-foreground">{entityTruncated}</td>
                    <td className="py-2 max-w-[120px] truncate text-muted-foreground">{browserTruncated}</td>
                    <td className="py-2 text-muted-foreground">{relativeTime(log.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {logs.length === 0 && (
            <p className="py-6 text-center text-muted-foreground">
              No audit logs yet. Actions will appear here automatically after login and other actions.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
