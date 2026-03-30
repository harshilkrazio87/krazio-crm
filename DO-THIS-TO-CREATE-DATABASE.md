# Create Your Database – Simple Steps (No Tech Needed)

Your app needs tables in Supabase before you can create a user and login. Do these **3 steps once**.

---

## Step 1: Open the SQL page in Supabase

Click this link (it opens your project’s SQL Editor):

**👉 https://supabase.com/dashboard/project/cmtujhakuaazsbgspxbu/sql/new**

(If it asks you to log in, use your Supabase account.)

---

## Step 2: Copy the database script

1. On your computer, open the project folder **krazio-cloud-crm**.
2. Open the folder **supabase**, then open the file **setup-database.sql** (with Notepad, TextEdit, or any editor).
3. Select **all** the text in that file:
   - **Windows:** Press `Ctrl + A`
   - **Mac:** Press `Cmd + A`
4. Copy it:
   - **Windows:** Press `Ctrl + C`
   - **Mac:** Press `Cmd + C`

---

## Step 3: Paste and run in Supabase

1. Go back to the Supabase browser tab (the link from Step 1).
2. Click inside the **big empty box** (where it says “Query” or “Write your query”).
3. Paste the script you copied:
   - **Windows:** Press `Ctrl + V`
   - **Mac:** Press `Cmd + V`
4. Click the green **Run** button (or “Run” at the bottom right).

Wait a few seconds. You should see a message like **Success** or **Success. No rows returned**. That means all tables were created.

---

## You’re done

- The database (all tables) is now created in Supabase.
- Next: **create your user** and start using the tool (see below).

---

## If you created your user but still can’t log in or the dashboard shows an error

Run this **one more time** in the SQL Editor (same place as Step 1):

1. Open: **https://supabase.com/dashboard/project/cmtujhakuaazsbgspxbu/sql/new**
2. Open the file **supabase/fix-missing-profiles.sql** in your project, copy **all** of it, paste in the box, and click **Run**.

That creates a profile for your user so the app can load the dashboard.

---

## Create your first user and start the tool

1. **Create a user in Supabase**
   - In the left menu click **Authentication** → **Users**.
   - Click **Add user** → **Create new user**.
   - Enter your **email** and a **password** (remember it).
   - Click **Create user**.

2. **Open your app**
   - In the project folder, run: **npm run dev** (or ask someone to start it for you).
   - Open in the browser: **http://localhost:3000**
   - Log in with the **same email and password** you just created.

3. **(Optional) Make yourself admin**
   - In Supabase left menu: **Table Editor** → **profiles**.
   - Find your row (your email).
   - In **role_id**, paste the ID of the “Super Admin” role (from the **roles** table, first row).
   - Save.

---

**Note:** No one can connect to your Supabase database from outside without your database password. So this one-time copy-paste in the SQL Editor is the way to create all tables. After that, you only need to create your user and use the app.
