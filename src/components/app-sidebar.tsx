"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useUserRole } from "@/lib/use-user-role";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  ListTodo,
  Users,
  Target,
  BarChart3,
  Settings,
  IndianRupee,
  Shield,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  LogOut,
  Lock,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  { href: "/leads", label: "Leads", icon: Target },
  { href: "/team", label: "Team", icon: Users },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/commission", label: "Commission", icon: IndianRupee },
  { href: "/vault", label: "Vault", icon: Lock },
  { href: "/settings", label: "Settings", icon: Settings },
];

const adminItems = [{ href: "/admin", label: "Admin", icon: Shield }];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAdmin } = useUserRole();
  const [collapsed, setCollapsed] = useState(false);
  const [profile, setProfile] = useState<{ full_name: string | null; email: string; avatar_url?: string | null; roles?: { name: string } | { name: string }[] } | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [companyName, setCompanyName] = useState<string>("Krazio");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("full_name, email, avatar_url, roles(name)")
        .eq("id", user.id)
        .single();
      setProfile(data);
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data: companyRow } = await supabase.from("app_settings").select("value").eq("key", "company_name").maybeSingle();
      const companyVal = (companyRow?.value as { value?: string })?.value;
      if (companyVal) setCompanyName(companyVal);
      const { data: logoRow } = await supabase.from("app_settings").select("value").eq("key", "logo_url").maybeSingle();
      const logoVal = (logoRow?.value as { value?: string })?.value;
      if (logoVal) setLogoUrl(logoVal);
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const res = await fetch("/api/tasks/pending");
        if (res.ok) {
          const data = await res.json();
          setPendingCount(Array.isArray(data) ? data.length : 0);
        }
      } catch (_) {}
    };
    fetchPending();
    const t = setInterval(fetchPending, 60000);
    return () => clearInterval(t);
  }, []);

  function initials() {
    if (profile?.full_name) {
      const parts = profile.full_name.trim().split(/\s+/);
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return profile.full_name.slice(0, 2).toUpperCase();
    }
    return profile?.email?.slice(0, 2).toUpperCase() ?? "?";
  }

  const roleName = profile?.roles ? (Array.isArray(profile.roles) ? profile.roles[0]?.name : profile.roles?.name) : null;

  return (
    <aside
        className={cn(
    "sticky top-0 h-screen flex flex-col bg-gradient-to-b from-slate-900 to-slate-800 text-white border-r transition-all duration-200",
    collapsed ? "w-[72px]" : "w-64"
  )}
    >
      <div className="p-2 border-b border-slate-700/50 flex items-center justify-between">  {!collapsed && (
          <Link href="/dashboard" className="font-semibold text-lg flex items-center gap-2 min-w-0">
            {logoUrl ? (
              <img src={logoUrl} alt="" className="h-6 w-6 object-contain shrink-0 rounded" />
            ) : (
              <Sparkles className="h-5 w-5 text-amber-400 shrink-0" />
            )}
            <span className="truncate">{companyName}</span>
            <span className="text-slate-400 shrink-0">CRM</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="text-slate-300 hover:bg-slate-700/50 hover:text-white shrink-0"
          onClick={() => setCollapsed((c) => !c)}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href + "/")) || (item.href === "/dashboard" && pathname === "/dashboard");
          const showBadge = item.href === "/tasks" && pendingCount > 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                isActive ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-700/50 hover:text-white",
                collapsed && "justify-center px-2"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1">{item.label}</span>
                  {showBadge && (
                    <span className="bg-amber-500 text-white text-xs font-medium rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center">
                      {pendingCount > 99 ? "99+" : pendingCount}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
        {isAdmin && (
        <div className="pt-4 mt-4 border-t border-slate-700/50">
          {adminItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  isActive ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-700/50 hover:text-white",
                  collapsed && "justify-center px-2"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>
        )}
      </nav>
      {profile && (
        <div className="p-3 border-t border-slate-700/50 space-y-2">
          {!collapsed && (
            <div className="flex items-center gap-2">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover shrink-0" />
              ) : (
                <div className="h-8 w-8 rounded-full bg-slate-600 flex items-center justify-center text-xs font-medium shrink-0">
                  {initials()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{profile.full_name || profile.email}</p>
                <span className="text-xs text-slate-400 truncate inline-block">{roleName ?? "User"}</span>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size={collapsed ? "icon" : "sm"}
            className="w-full justify-start text-slate-300 hover:bg-slate-700/50 hover:text-white"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="ml-2">Logout</span>}
          </Button>
        </div>
      )}
    </aside>
  );
}

