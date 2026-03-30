import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppSidebar } from "@/components/app-sidebar";
import { DashboardHeader } from "@/components/dashboard-header";
import { MeetingReminder } from "@/components/meeting-reminder";
import { PendingTaskReminder } from "@/components/pending-task-reminder";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
        <div className="flex min-h-screen bg-background">
      <MeetingReminder />
      <PendingTaskReminder />
      <AppSidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader />
        <div className="flex-1 overflow-y-auto p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}
