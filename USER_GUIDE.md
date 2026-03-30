# Krazio CRM — User Guide
*How to use every feature of the system*

---

## 🚀 Getting Started

### First Login
1. Go to your app URL (e.g. http://localhost:3000)
2. You will be redirected to `/login`
3. Enter your email and password
4. Click "Sign in"
5. You will land on the **Dashboard**

### Your Role Determines What You See
- **Super Admin**: Sees everything, can do everything
- **Admin**: Same as super admin except cannot delete super admin
- **Manager**: Sees own team's tasks and leads, can view reports for their team
- **Sales**: Sees only own tasks and leads

---

## 📊 Dashboard
**URL:** `/dashboard`

The dashboard is your home screen. It shows:
- **Stats Cards** at the top: total tasks, leads, won leads, team members
- **Tasks Due Today**: your tasks that need attention now
- **Recent Leads**: last 5 leads added
- **Lead Pipeline**: visual bar showing how many leads are in each stage
- **Quick Actions**: buttons to add a task, add a lead, etc.
- **Today's Meetings**: meetings scheduled for today (with Join button)
- **Recent Activity**: log of recent actions by you and your team

---

## ✅ Tasks

### Creating a Task
**URL:** `/tasks/new`
1. Click **"+ New Task"** from the Tasks page or Dashboard
2. Fill in:
   - **Title** (required)
   - **Description** (optional)
   - **Priority**: High / Medium / Low
   - **Due Date** (optional)
   - **Task Type**: Regular or Recurring
3. If **Recurring**:
   - Choose "Every X days" → enter number (e.g. 7 for weekly)
   - OR choose "Specific weekdays" → check Mon, Tue, etc.
   - Set end date (optional)
4. **Assign to**: select one or more team members
5. **Task Admin**: select who manages this task
6. Toggle **"Add Subtasks"** to add subtasks now:
   - Enter subtask title
   - Select priority
   - Toggle subtask recurring if needed
   - Click "+ Add" to add more
7. Click **"Create Task"**

### Managing Tasks
**URL:** `/tasks`
- Switch between **Board view** (kanban columns) and **List view** (table)
- **Board view**: drag cards between Pending → In Progress → Completed
- **Filter** by status, priority, assignee, due date
- **Click any task card** to open its detail page
- Overdue tasks are highlighted in red

### Task Detail & Timer
**URL:** `/tasks/[task-id]`
1. Click a task to open its detail page
2. See all task info, assignees, subtasks
3. **Timer section**:
   - Click **"▶ Start Timer"** to begin tracking time
   - Timer counts up in HH:MM:SS
   - Starting a timer on another task auto-stops this one
   - Click **"⏹ Stop Timer"** when done
4. **Total time spent** is shown below the timer
5. **Change status** using the status dropdown
6. **Add subtask** from the detail page
7. When completing: enter **numeric data** if prompted (e.g. "emails sent: 20")

---

## 🎯 Leads

### Adding a Lead
**URL:** `/leads/new`
1. Click **"+ New Lead"** from Leads page
2. Fill in sections:
   - **Lead Info**: source, assigned to, stage, priority
   - **Contact Details**: name, email, phone, LinkedIn
   - **Company Details**: company name, website, industry, technology
   - **Requirements**: what they need, budget, timeline
3. Click **"🤖 Generate AI Research"** after entering company name/website:
   - Gemini AI fetches company info, pain points, recent job posts
   - Review the research shown below the button
4. Click **"Create Lead"**

### Leads Kanban Board
**URL:** `/leads`
- Leads are organized in columns by stage
- **Drag a lead card** to move it to a different stage
- If dropped on a "Meeting" stage → meeting scheduler opens automatically
- Click a lead card to open its detail page

### Lead Detail & Notes
**URL:** `/leads/[lead-id]`
- See all lead information
- **Change Stage**: click stage buttons at top
- **Add Note**: type in the notes section, click "Add Note"
  - Notes show who wrote them and when
  - Use for MOM (Minutes of Meeting), discussions, updates
- **Schedule Meeting**: click "Add Meeting" or change to meeting stage
  - Enter: date, time, meeting link, agenda, duration
  - System will remind you 30/20/10 minutes before

---

## 📅 Meetings

### Scheduling a Meeting
From a lead detail page:
1. Click **"Add Meeting"**
2. Enter meeting date and time
3. Paste the meeting link (Google Meet, Zoom, etc.)
4. Add agenda and notes
5. Click **"Schedule"**

### Meeting Reminders
- At 30, 20, and 10 minutes before your meeting:
  - A **banner appears** at the top of the screen
  - A **browser notification** pops up (grant permission when asked)
  - Click "Join Meeting" to open the link

### Today's Meetings
- Visible on the **Dashboard** and in the header
- Shows time, company name, and Join button
- Admin sees ALL team meetings

---

## 📋 Reports
**URL:** `/reports`

1. Select date range: **Today / This Week / This Month / Quarter**
2. View charts:
   - Tasks completed per person (bar chart)
   - Leads added over time (line chart)
   - Lead stage distribution (pie chart)
   - Commission per person (bar chart)
3. View **per-user performance table**
4. View **time tracking section** (hours per task per person)
5. Click **"Export CSV"** to download the table data

---

## 💰 Commission
**URL:** `/commission`

### For Sales/Manager Users:
- See your commission history
- Pending commissions await admin approval
- Total earned this month shown at top

### For Admins:
- See ALL team members' commissions
- Filter by user, status, month
- Click **✓ Approve** or **✗ Reject** on pending commissions
- **Add Manual Commission**: create a commission entry for any user

### Setting Up Commission Rules:
Go to **Settings → Commission Rules** or **Admin → Commission Rules**:
1. Click **"Add Rule"**
2. Enter rule name (e.g. "Meeting Bonus")
3. Select trigger: Meeting Completed / Project Confirmed / Lead Won
4. Enter amount
5. Toggle Flat Amount (₹) vs Percentage (%)
6. Click **"Add Rule"**

---

## 👥 Team Management
**URL:** `/team`

### Adding a Team Member (Admin only):
1. Click **"Add Member"** button
2. Fill in:
   - Profile photo URL (optional)
   - Employee ID, Full Name, Email (required)
   - Mobile, Gender, Joining Date
   - Department, Role, Manager
   - Status (Active/Inactive)
3. Check **"Generate Random Password"** to auto-create one
4. Check **"Email employee their password"** to send welcome email
5. Click **"Save"**

### Managing Members:
- **Edit** member by clicking edit icon in their row
- **Reset Password** generates new password and emails it
- **Toggle Active/Inactive** to enable/disable login
- Switch to **Tree View** to see org hierarchy

---

## 🏢 Departments & SOP (Admin)
**URL:** `/admin → Departments tab`

### Creating a Department:
1. Click **"Add Department"**
2. Enter name and description
3. Add SOP (Standard Operating Procedure) text
4. Add SOP Tasks (template tasks for this department)
5. Save

### Assigning SOP to New User:
When creating a user with a department that has SOP tasks:
1. A dialog asks "Assign SOP tasks to this user?"
2. Checkboxes show each SOP task
3. Select which tasks to assign
4. Tasks are created automatically for the user

---

## 🔒 Password Vault
**URL:** `/vault`

### Adding a Password:
1. Click **"Add Password"**
2. Enter: Company Name, URL, Username, Password, Notes
3. Use **"Generate"** button to create a strong random password
4. Click **"Save"**

### Viewing Passwords:
- Your passwords: click the eye icon 👁 to reveal
- **Admin**: sees all users' passwords, can copy them
- **Admin**: click **"Export CSV"** to download all passwords

---

## 📌 Sticky Notes

### Opening Sticky Notes:
1. Click the **sticky note icon** in the header (top right)
2. A panel slides in from the right
3. The badge number shows how many notes you have

### Creating a Note:
1. Click **"+ New Note"** in the panel
2. A new colored card appears — type your note
3. Click colored dots at bottom to change note color
4. Click outside the note to auto-save

### Managing Notes:
- Hover over a note → **X button** appears to delete
- Click note text to edit it
- Only YOU can see your sticky notes

---

## ⏱️ Productivity Tracking

### Tracking Your Time:
- Timer is in each Task detail page
- Your **today's total time** shows in the top header: "⏱ Today: 2h 34m"
- Click it to see time broken down by task

### Viewing in Reports:
- Go to Reports → Time Tracking section
- See hours per task, per person, per day
- Filter by date range

---

## 🔔 Notifications

### Notification Bell:
- Bell icon in header shows unread count badge
- Click to open notification panel
- Notifications for: new task assigned, commission status, meeting reminders
- Click **"Mark all read"** to clear

### Pending Task Reminder:
- Every 3 hours: a popup appears if you have pending tasks
- Includes a sound alert
- Shows list of pending tasks with priority
- Click **"Mark All In Progress"** or **"View Tasks"**
- Click **"Remind in 1 hour"** to snooze

---

## ⚙️ Settings

### For All Users:
**URL:** `/settings`
- **Appearance tab**: Switch between Light / Dark / System theme

### For Admins Only:
- **General**: Set company name and logo URL
- **SMTP**: Configure email settings for sending notifications
  - Test with "Send Test Email" button
- **Lead Stages**: Add/edit/delete/reorder kanban stages for leads
- **Industries**: Manage industry options in lead form
- **Technologies**: Manage technology options in lead form
- **Departments**: Manage department list
- **Commission Rules**: Add/edit commission rules
- **API Keys**: Set Google Gemini API key for AI research

---

## 🛡️ Admin Panel
**URL:** `/admin`

### Users Tab:
- See all users with their encrypted passwords visible
- Create new user
- Copy any user's password

### Roles Tab:
- See all roles and their permissions
- Check/uncheck permissions per role
- Save changes

### Audit Logs Tab:
- Every action in the system is logged here
- Shows: who did it, what they did, which browser, location, when
- Filter by user and date

---

## 🌙 Dark Mode
- Click the **sun/moon icon** in the top right header
- Or go to Settings → Appearance → select Dark

---

## 🆘 Troubleshooting

**I can't see admin features:**
→ Your account role is not set to admin. Ask super admin to update your role.

**Timer won't start:**
→ You may have another timer running. Check other tasks and stop any running timer first.

**Meeting reminder not showing:**
→ Allow browser notifications when prompted. Check that meeting link and time are saved correctly.

**AI Research not working:**
→ Ask admin to set the Gemini API key in Settings → API Keys.

**Email not sending:**
→ Ask admin to configure SMTP in Settings → SMTP.

**Lead stages not showing:**
→ Admin needs to add stages in Settings → Lead Stages.

---

*Last updated: March 2026 | Krazio CRM v1.0*
