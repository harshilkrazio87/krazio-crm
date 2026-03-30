# Krazio CRM — Complete Feature Checklist

## 🔐 Authentication & Users
- [ ] Email/password login
- [ ] Register new account
- [ ] Forgot password email
- [ ] Reset password
- [ ] Session persistence (stay logged in)
- [ ] Auto-redirect logged in users to dashboard
- [ ] Auto-redirect logged out users to login

## 👤 User Profile
- [ ] View own profile (name, email, phone, role)
- [ ] Edit profile info
- [ ] Upload/set profile photo URL
- [ ] Photo shows in tasks, reports, assignee lists
- [ ] Change password
- [ ] User dropdown in header (profile, settings, logout)
- [ ] Logout button in sidebar

## 🏗️ Roles & Permissions
- [ ] Super Admin role (full access to everything)
- [ ] Admin role (full access except super admin)
- [ ] Manager role (view team, manage tasks, view reports)
- [ ] Sales role (own leads and tasks only)
- [ ] Role-based UI (buttons/sections show/hide by role)
- [ ] Role-based data access (users see only allowed data)
- [ ] Admin can create/edit roles and permissions

## ✅ Task Management
- [ ] Create task (title, description, priority, due date optional)
- [ ] Assign task to multiple users
- [ ] Set task admin (different from assignee)
- [ ] Regular task type
- [ ] Recurring task — every X days
- [ ] Recurring task — specific weekdays (Mon, Tue, etc.)
- [ ] Recurring end date
- [ ] Subtasks within main task
- [ ] Add subtasks while creating main task (toggle)
- [ ] Subtask has own recurring settings
- [ ] Main task recur = main + all subtasks repeat
- [ ] Subtask recur only = just that subtask repeats under same parent
- [ ] Task status: Pending → In Progress → Completed
- [ ] Subtask individual status change
- [ ] Task timer (start/stop per task)
- [ ] Subtask timer (start/stop per subtask)
- [ ] Only ONE timer running at a time per user
- [ ] Starting new timer auto-stops previous timer
- [ ] Total time spent shown on task
- [ ] Numeric data entry on task completion (e.g. "LinkedIn messages sent: 50")
- [ ] Pending tasks carry over to next day
- [ ] Manager can delete any task
- [ ] User can delete only own tasks
- [ ] Task list view with filters (status, priority, assignee, due date)
- [ ] Task board/kanban view (3 columns)
- [ ] Drag tasks between kanban columns
- [ ] Overdue tasks highlighted red
- [ ] Task detail page with full info

## 📊 Task Stages (Admin Configurable)
- [ ] Default stages: Pending, In Progress, Completed
- [ ] Admin can add custom task stages
- [ ] Admin can edit/delete stages
- [ ] Stages update live everywhere

## 🎯 Lead Management
- [ ] Add new lead with all fields:
  - [ ] Contact name, email, phone, LinkedIn, designation
  - [ ] Company name, website, LinkedIn, size, location
  - [ ] Industry (from admin list)
  - [ ] Department (from admin list)
  - [ ] Technology stack (from admin list)
  - [ ] Requirements, budget range, timeline
  - [ ] Lead source, assigned to, stage, priority
  - [ ] Notes
- [ ] Lead custom fields (added from admin)
- [ ] Lead kanban board by stage
- [ ] All stages show even with 0 leads
- [ ] Drag lead between stages
- [ ] Lead detail page with all info
- [ ] Edit lead
- [ ] Lead notes/MOM (add discussions, meeting notes)
- [ ] Notes shown chronologically on lead detail
- [ ] Stage change triggers meeting dialog (for meeting stages)
- [ ] AI Research button on lead form
- [ ] Gemini API fetches company info, pain points, job posts
- [ ] Research stored in lead record

## 📅 Meeting Management
- [ ] Schedule meeting on lead (date, time, link, agenda, duration)
- [ ] Meeting reminder at 30 minutes before (banner + browser notification)
- [ ] Meeting reminder at 20 minutes before
- [ ] Meeting reminder at 10 minutes before
- [ ] Today's meetings widget on dashboard
- [ ] Admin sees all team's meetings
- [ ] User sees own meetings
- [ ] Mark meeting as fruitful/not fruitful
- [ ] Meeting triggers commission if fruitful

## 📈 Lead Stages (Admin Configurable)
- [ ] Default stages (New Lead, Contacted, Meeting Scheduled, etc.)
- [ ] Admin can add new stages
- [ ] Admin can set stage color
- [ ] Admin can mark stage as "requires meeting" (auto-shows meeting dialog)
- [ ] Admin can mark stage as Won or Lost
- [ ] Admin can reorder stages
- [ ] Admin can delete stages
- [ ] Changes apply live everywhere (kanban, forms, reports)

## 📋 Reports
- [ ] Summary stat cards (tasks, leads, conversions)
- [ ] Bar chart: tasks completed per person
- [ ] Line chart: leads added over time
- [ ] Pie chart: lead stage distribution
- [ ] Bar chart: commission per person
- [ ] Per-user performance table
- [ ] Time tracking report (time per task, per user)
- [ ] Productivity report (hours logged per day)
- [ ] Date range filter (Today, Week, Month, Quarter)
- [ ] Admin sees all users' reports
- [ ] Manager sees team reports
- [ ] User sees own reports
- [ ] Export reports as CSV

## 💰 Commission
- [ ] Admin creates commission rules (flat ₹ or %)
- [ ] Trigger types: meeting complete, project confirmed, lead won
- [ ] Commission auto-created when trigger event happens
- [ ] Admin approves or rejects commissions
- [ ] User sees own commission history and totals
- [ ] Admin sees all users' commissions
- [ ] Monthly commission summary
- [ ] Commission report with charts
- [ ] Manual commission entry by admin

## 👥 Team Management
- [ ] Add new team member (full form with all fields)
- [ ] Profile photo on member
- [ ] Employee ID
- [ ] Department assignment
- [ ] Role assignment
- [ ] Manager assignment (hierarchy)
- [ ] Generate random password option
- [ ] Email new user their credentials
- [ ] Active/Inactive status toggle
- [ ] Table view of all members
- [ ] Hierarchy tree view (who reports to whom)
- [ ] Edit member details
- [ ] Reset member password
- [ ] Admin sees all members
- [ ] Manager sees own team

## 🏢 Departments & SOP
- [ ] Create departments
- [ ] Add SOP (Standard Operating Procedure) to department
- [ ] SOP has custom fields
- [ ] SOP tasks (template tasks per department)
- [ ] When creating user with department: option to assign SOP tasks
- [ ] SOP tasks become real tasks for the user
- [ ] Drag to select which SOP tasks to assign

## 📌 Sticky Notes
- [ ] Floating panel accessible from header (not a separate page)
- [ ] Count badge on sticky notes icon
- [ ] Create note with content and color
- [ ] 5 color options (yellow, pink, blue, green, purple)
- [ ] Edit note inline
- [ ] Auto-save on blur
- [ ] Delete note with confirmation
- [ ] Notes only visible to the creator
- [ ] Panel stays open while working

## 🔒 Password Vault
- [ ] Add passwords (company name, URL, username, password)
- [ ] User sees only own passwords
- [ ] Toggle password visibility
- [ ] Admin/super admin sees ALL users' passwords
- [ ] Admin can copy passwords
- [ ] Admin can export passwords as CSV
- [ ] Regular users cannot copy or export
- [ ] Add notes to password entries
- [ ] Edit/delete entries

## ⚙️ Settings (Admin)
- [ ] Appearance tab (theme - all users)
- [ ] General tab: company name, logo URL
- [ ] SMTP tab: full email config + test email
- [ ] Lead Stages management tab
- [ ] Industries list management
- [ ] Technologies list management
- [ ] Departments list management
- [ ] Commission Rules tab
- [ ] API Keys tab (Gemini key)

## 🛡️ Admin Panel
- [ ] Users tab: see all users with passwords visible
- [ ] Create user from admin
- [ ] Copy user password
- [ ] Roles & Permissions tab
- [ ] Edit role permissions via checkboxes
- [ ] Audit Logs tab (all actions logged)
- [ ] Logs show: user, action, browser, location, timestamp
- [ ] Location permission requested on login
- [ ] SMTP tab
- [ ] Commission Rules tab

## 🔔 Notifications
- [ ] Bell icon in header with unread count
- [ ] New task assignment notification
- [ ] Commission approved/rejected notification
- [ ] Meeting upcoming notification
- [ ] Mark notifications as read
- [ ] Browser push notifications (with permission)

## ⏰ Reminders & Alerts
- [ ] Pending task popup every 3 hours
- [ ] Sound alert with pending task popup
- [ ] "Remind in 1 hour" option
- [ ] Meeting reminder banners (30/20/10 min)
- [ ] Recurring tasks appear at 12:01 AM on due day

## ⏱️ Productivity Tracking
- [ ] Today's total tracked time in header nav
- [ ] Breakdown by task in productivity popover
- [ ] Auto-updates every 60 seconds
- [ ] Daily productivity stored in database
- [ ] Productivity shown in reports

## 🎨 UI/UX
- [ ] Dark mode
- [ ] Light mode
- [ ] Responsive sidebar (collapsible)
- [ ] User avatar + name + role at sidebar bottom
- [ ] Breadcrumbs in header
- [ ] Page-level loading skeletons
- [ ] Empty states with CTAs on all pages
- [ ] Toast notifications for all actions
- [ ] Confirmation dialogs before delete
- [ ] 404 page
- [ ] Error boundary page

## 🌐 Deployment Ready
- [ ] Environment variables documented
- [ ] Build passes with zero errors
- [ ] All routes return correct HTTP status
- [ ] Middleware protects all private routes
- [ ] Supabase RLS policies configured

---
Total Features: 150
✅ Implemented: __
❌ Pending: __
