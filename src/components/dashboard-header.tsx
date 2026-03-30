"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  DropdownMenu,  
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { StickyNotesPanel } from "@/components/sticky-notes-panel";
import { NotificationsPanel } from "@/components/notifications-panel";
import { ThemeToggle } from "@/components/theme-toggle";
import { ProductivityBar } from "@/components/productivity-bar";
import { ChevronRight, LogOut, User, Settings, KeyRound } from "lucide-react";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const PATH_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  tasks: "Tasks",
  "tasks/new": "New Task",
  leads: "Leads",
  "leads/new": "New Lead",
  team: "Team",
  reports: "Reports",
  commission: "Commission",
  "sticky-notes": "Sticky Notes",
  settings: "Settings",
  admin: "Admin",
  profile: "Profile",
  vault: "Vault",
};

export function DashboardHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<{ full_name: string | null; email: string; avatar_url?: string | null } | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("full_name, email, avatar_url").eq("id", user.id).single();
      setProfile(data);
    };
    fetchProfile();
  }, []);

  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs = segments.map((seg, i) => {
    const path = "/" + segments.slice(0, i + 1).join("/");
    const label = PATH_LABELS[seg] ?? PATH_LABELS[path.replace(/^\/[^/]+\//, "").replace(/^\//, "")] ?? seg;
    return { path, label };
  });
  if (breadcrumbs.length === 0) breadcrumbs.push({ path: "/dashboard", label: "Dashboard" });

  function initials() {
    if (profile?.full_name) {
      const parts = profile.full_name.trim().split(/\s+/);
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return profile.full_name.slice(0, 2).toUpperCase();
    }
    return profile?.email?.slice(0, 2).toUpperCase() ?? "?";
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
  <div className="flex h-14 items-center justify-between px-3 sm:px-4 gap-2 sm:gap-4">

    {/* LEFT SIDE */}
    <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0 overflow-hidden">
      
      {/* Breadcrumb Scroll */}
      <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-none">
        {breadcrumbs.map((b, i) => (
          <span key={b.path} className="flex items-center gap-2 shrink-0">
            {i > 0 && <ChevronRight className="h-4 w-4 text-slate-400" />}
            <Link
              href={b.path}
              className={cn(
                "truncate max-w-[120px]",
                i === breadcrumbs.length - 1 && "font-medium text-foreground"
              )}
            >
              {b.label}
            </Link>
          </span>
        ))}
      </div>

      {/* Date → hidden on small */}
      <span className="text-slate-400 ml-2 hidden md:inline">
        {format(new Date(), "EEE, MMM d")}
      </span>
    </div>

    {/* RIGHT SIDE */}
    <div className="flex items-center gap-1 sm:gap-2 shrink-0">

      {/* Hide less important on small */}
      <div className="hidden sm:flex items-center gap-1">
        <ProductivityBar />
      </div>

      <StickyNotesPanel />
      <NotificationsPanel />

      {/* Hide theme toggle on very small */}
      <div className="hidden sm:block">
        <ThemeToggle />
      </div>

      {/* PROFILE DROPDOWN */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt=""
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                {initials()}
              </div>
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild>
            <Link href="/profile">
              <User className="mr-2 h-4 w-4" />
              My Profile
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link href="/profile#password">
              <KeyRound className="mr-2 h-4 w-4" />
              Change Password
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link href="/settings">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={handleLogout}
            className="text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </div>
</header>
  )
}
