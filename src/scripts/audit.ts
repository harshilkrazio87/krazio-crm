/**
 * Krazio CRM — Feature Audit Script
 * Run: npx ts-node --compiler-options '{"module":"CommonJS"}' src/scripts/audit.ts
 * Or: node --loader ts-node/esm src/scripts/audit.ts
 */

import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(process.cwd());

const requiredFiles = [
  "src/app/(dashboard)/dashboard/page.tsx",
  "src/app/(dashboard)/tasks/page.tsx",
  "src/app/(dashboard)/tasks/new/page.tsx",
  "src/app/(dashboard)/tasks/[id]/page.tsx",
  "src/app/(dashboard)/leads/page.tsx",
  "src/app/(dashboard)/leads/new/page.tsx",
  "src/app/(dashboard)/leads/[id]/page.tsx",
  "src/app/(dashboard)/team/page.tsx",
  "src/app/(dashboard)/reports/page.tsx",
  "src/app/(dashboard)/commission/page.tsx",
  "src/app/(dashboard)/sticky-notes/page.tsx",
  "src/app/(dashboard)/settings/page.tsx",
  "src/app/(dashboard)/admin/page.tsx",
  "src/app/(dashboard)/profile/page.tsx",
  "src/app/(dashboard)/vault/page.tsx",
  "src/app/(auth)/login/page.tsx",
  "src/app/(auth)/register/page.tsx",
  "src/app/(auth)/forgot-password/page.tsx",
  "src/app/(auth)/reset-password/page.tsx",
  "src/app/api/timer/start/route.ts",
  "src/app/api/timer/stop/route.ts",
  "src/app/api/admin/create-user/route.ts",
  "src/app/api/send-test-email/route.ts",
  "src/app/api/gemini-research/route.ts",
  "src/app/api/commission/[id]/approve/route.ts",
  "src/app/api/vault/route.ts",
  "src/components/app-sidebar.tsx",
  "src/components/sticky-notes-panel.tsx",
  "src/components/meeting-reminder.tsx",
  "src/components/pending-task-reminder.tsx",
  "src/components/productivity-bar.tsx",
  "src/components/task-timer-client.tsx",
  "src/components/todays-meetings.tsx",
  "src/components/notifications-panel.tsx",
  "src/components/theme-toggle.tsx",
  "src/components/theme-provider.tsx",
  "src/components/settings/settings-client.tsx",
  "src/components/team/team-client.tsx",
  "src/lib/supabase/client.ts",
  "src/lib/supabase/server.ts",
  "src/lib/utils/get-user-role.ts",
  "src/lib/utils/use-user-role.ts",
  "src/lib/logger.ts",
  "src/middleware.ts",
];

const featureChecks = [
  { feature: "Timer Start/Stop", file: "src/components/tasks/task-detail.tsx", pattern: "started_at" },
  { feature: "Timer One-At-A-Time", file: "src/app/api/timer/start/route.ts", pattern: "ended_at" },
  { feature: "Recurring Tasks Interval", file: "src/components/tasks/task-form.tsx", pattern: "recur_interval_days" },
  { feature: "Recurring Tasks Weekday", file: "src/components/tasks/task-form.tsx", pattern: "recur_weekdays" },
  { feature: "Subtasks on Create", file: "src/components/tasks/task-form.tsx", pattern: "subtasks" },
  { feature: "Subtask Timer", file: "src/app/(dashboard)/tasks/[id]/page.tsx", pattern: "subtask" },
  { feature: "Lead Kanban Drag Drop", file: "src/components/leads/lead-kanban.tsx", pattern: "DragDropContext" },
  { feature: "Lead AI Research Button", file: "src/app/(dashboard)/leads/new/page.tsx", pattern: "research" },
  { feature: "Meeting Scheduler on Stage", file: "src/components/leads/lead-kanban.tsx", pattern: "requires_meeting" },
  { feature: "Meeting 30min Reminder", file: "src/components/meeting-reminder.tsx", pattern: "30" },
  { feature: "Pending Task Popup 3hrs", file: "src/components/pending-task-reminder.tsx", pattern: "3 * 60 * 60" },
  { feature: "Sound Alert", file: "src/components/pending-task-reminder.tsx", pattern: "AudioContext" },
  { feature: "Productivity Bar", file: "src/components/productivity-bar.tsx", pattern: "total_seconds" },
  { feature: "Sticky Notes Floating Panel", file: "src/components/sticky-notes-panel.tsx", pattern: "Sheet" },
  { feature: "Sticky Notes Count Badge", file: "src/components/sticky-notes-panel.tsx", pattern: "noteCount" },
  { feature: "Password Vault", file: "src/app/(dashboard)/vault/page.tsx", pattern: "vault" },
  { feature: "Vault Admin Export CSV", file: "src/app/api/vault/export/route.ts", pattern: "export" },
  { feature: "Commission Rules", file: "src/components/settings/settings-client.tsx", pattern: "commission" },
  { feature: "Dark Mode Toggle", file: "src/components/theme-toggle.tsx", pattern: "setTheme" },
  { feature: "User Profile Photo", file: "src/app/(dashboard)/profile/page.tsx", pattern: "avatar" },
  { feature: "Change Password", file: "src/app/(dashboard)/profile/page.tsx", pattern: "password" },
  { feature: "Logout Button", file: "src/components/app-sidebar.tsx", pattern: "signOut" },
  { feature: "User Dropdown in Header", file: "src/components/dashboard-header.tsx", pattern: "DropdownMenu" },
  { feature: "Activity Logs", file: "src/lib/logger.ts", pattern: "log" },
  { feature: "SMTP Config", file: "src/components/settings/settings-client.tsx", pattern: "smtp" },
  { feature: "Role Permission System", file: "src/lib/get-user-role.ts", pattern: "isSuperAdmin" },
  { feature: "Admin Create User", file: "src/app/api/admin/create-user/route.ts", pattern: "createUser" },
  { feature: "Commission Approve/Reject", file: "src/app/api/commission/[id]/approve/route.ts", pattern: "approve" },
  { feature: "Reports Charts", file: "src/app/(dashboard)/reports/page.tsx", pattern: "Chart" },
  { feature: "Reports CSV Export", file: "src/components/reports/reports-charts.tsx", pattern: "csv" },
  { feature: "Todays Meetings Widget", file: "src/app/(dashboard)/dashboard/page.tsx", pattern: "todaysMeetings" },
  { feature: "Breadcrumbs in Header", file: "src/components/dashboard-header.tsx", pattern: "breadcrumb" },
  { feature: "Lead Custom Fields", file: "src/components/leads/lead-form.tsx", pattern: "custom" },
  { feature: "Lead Notes/MOM", file: "src/app/(dashboard)/leads/[id]/page.tsx", pattern: "notes" },
  { feature: "Task Numeric Data on Complete", file: "src/components/tasks/task-detail.tsx", pattern: "numeric" },
  { feature: "Notification Bell", file: "src/components/notifications-panel.tsx", pattern: "unread_count" },
  { feature: "Browser Push Notifications", file: "src/components/meeting-reminder.tsx", pattern: "Notification" },
  { feature: "SOP Departments", file: "src/app/(dashboard)/admin/departments/page.tsx", pattern: "SOP" },
  { feature: "Lead Stage Customization", file: "src/components/settings/settings-client.tsx", pattern: "leadStages" },
  { feature: "404 Not Found Page", file: "src/app/not-found.tsx", pattern: "Not Found" },
  { feature: "Error Boundary", file: "src/app/error.tsx", pattern: "error" },
];

function fileExists(relativePath: string): boolean {
  const full = path.join(ROOT, relativePath);
  return fs.existsSync(full);
}

function fileContains(relativePath: string, pattern: string | RegExp): boolean {
  const full = path.join(ROOT, relativePath);
  if (!fs.existsSync(full)) return false;
  const content = fs.readFileSync(full, "utf8");
  if (typeof pattern === "string") return content.includes(pattern);
  return pattern.test(content);
}

// Resolve paths that might be in different locations
const fileAliases: Record<string, string> = {
  "src/lib/utils/get-user-role.ts": "src/lib/get-user-role.ts",
  "src/lib/utils/use-user-role.ts": "src/lib/use-user-role.ts",
  "src/middleware.ts": "middleware.ts",
};

function resolvePath(p: string): string {
  if (fileAliases[p]) return fileAliases[p];
  return p;
}

function main() {
  console.log("═══════════════════════════════════════");
  console.log("KRAZIO CRM — FEATURE AUDIT");
  console.log("═══════════════════════════════════════\n");

  let missingFiles = 0;
  const missingList: string[] = [];

  for (const file of requiredFiles) {
    const resolved = resolvePath(file);
    const exists = fileExists(resolved);
    if (exists) {
      console.log(`✅ PASS  — ${file} (exists)`);
    } else {
      console.log(`⚠️  MISSING — ${file}`);
      missingFiles++;
      missingList.push(file);
    }
  }

  console.log("\n--- Feature code checks ---\n");

  let implemented = 0;
  let incomplete = 0;

  for (const { feature, file, pattern } of featureChecks) {
    const resolved = resolvePath(file);
    const exists = fileExists(resolved);
    const found = exists && fileContains(resolved, pattern);
    if (exists && found) {
      console.log(`✅ PASS  — ${feature} (file exists, pattern found)`);
      implemented++;
    } else if (exists && !found) {
      console.log(`❌ FAIL  — ${feature} (file exists but pattern NOT found)`);
      incomplete++;
    } else {
      console.log(`⚠️  MISSING — ${feature} (file ${file} does not exist)`);
      incomplete++;
    }
  }

  const totalFeatures = requiredFiles.length + featureChecks.length;
  const totalImplemented = requiredFiles.length - missingFiles + implemented;
  const totalIncomplete = missingFiles + incomplete;
  const pct = totalFeatures > 0 ? Math.round((totalImplemented / totalFeatures) * 100) : 0;

  console.log("\n═══════════════════════════════════");
  console.log("AUDIT SUMMARY");
  console.log("Total Features: " + totalFeatures);
  console.log("✅ Implemented: " + totalImplemented);
  console.log("❌ Incomplete: " + totalIncomplete);
  console.log("⚠️  Missing Files: " + missingFiles);
  console.log("Implementation: " + pct + "%");
  console.log("═══════════════════════════════════\n");
}

main();
