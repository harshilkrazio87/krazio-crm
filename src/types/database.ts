export type RoleSlug = "super_admin" | "admin" | "manager" | "user";

export interface Role {
  id: string;
  name: string;
  slug: string;
  level: number;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role_id: string | null;
  manager_id: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
  role?: Role;
  manager?: Profile;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  task_admin_id: string | null;
  created_by_id: string | null;
  is_recurring: boolean;
  recurrence_rule: RecurrenceRule | null;
  status: TaskStatus;
  parent_task_id: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  assignees?: Profile[];
  subtasks?: Task[];
  timers?: TaskTimer[];
}

export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled";

export interface RecurrenceRule {
  frequency: "daily" | "weekly" | "monthly" | "custom";
  interval?: number;
  days_of_week?: number[];
  day_of_month?: number;
}

export interface TaskTimer {
  id: string;
  task_id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number;
}

export interface LeadStage {
  id: string;
  name: string;
  slug: string;
  order_index: number;
  is_meeting_stage: boolean;
}

export interface Lead {
  id: string;
  owner_id: string | null;
  stage_id: string | null;
  company_name: string | null;
  website: string | null;
  linkedin_company_url: string | null;
  requirements: string | null;
  department_id: string | null;
  industry_id: string | null;
  technology_ids: string[] | null;
  custom_fields: Record<string, unknown>;
  gemini_research: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  stage?: LeadStage;
  contacts?: LeadContact[];
  notes?: LeadNote[];
  meetings?: LeadMeeting[];
}

export interface LeadContact {
  id: string;
  lead_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  position: string | null;
}

export interface LeadNote {
  id: string;
  lead_id: string;
  author_id: string;
  content: string;
  created_at: string;
}

export interface LeadMeeting {
  id: string;
  lead_id: string;
  scheduled_at: string;
  meeting_link: string | null;
  title: string | null;
  completed: boolean;
  admin_approved_success: boolean | null;
}

export interface StickyNote {
  id: string;
  user_id: string;
  title: string | null;
  content: string | null;
  color: string;
  position_x: number;
  position_y: number;
  created_at: string;
  updated_at: string;
}

export interface CommissionRule {
  id: string;
  name: string;
  rule_type: string;
  value: number;
  is_percentage: boolean;
  trigger_type: string;
}

export interface CommissionEntry {
  id: string;
  user_id: string;
  rule_id: string | null;
  amount: number;
  reference_type: string | null;
  reference_id: string | null;
  project_amount: number | null;
  month: number;
  year: number;
  created_at: string;
}
