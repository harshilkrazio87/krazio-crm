"use client";

type Profile = {
  id: string;
  full_name: string | null;
  email: string;
  manager_id: string | null;
  role_id: string | null;
  roles?: { name: string; slug: string } | { name: string; slug: string }[] | null;
};

export function TeamTree({ profiles }: { profiles: Profile[] }) {
  const byManager = profiles.reduce((acc, p) => {
    const mid = p.manager_id ?? "root";
    if (!acc[mid]) acc[mid] = [];
    acc[mid].push(p);
    return acc;
  }, {} as Record<string, Profile[]>);

  function renderNode(managerId: string, level: number) {
    const children = byManager[managerId];
    if (!children?.length) return null;
    return (
      <ul className={level > 0 ? "ml-4 border-l pl-4 space-y-2" : "space-y-2"}>
        {children.map((p) => (
          <li key={p.id}>
            <div className="flex items-center gap-2">
              <span className="font-medium">{p.full_name || p.email}</span>
              <span className="text-sm text-muted-foreground">({Array.isArray(p.roles) ? p.roles[0]?.name : p.roles?.name ?? "User"})</span>
            </div>
            {renderNode(p.id, level + 1)}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="min-h-[200px]">
      {renderNode("root", 0) ?? (
        <p className="text-sm text-muted-foreground">No team members. Add users from Admin.</p>
      )}
    </div>
  );
}
