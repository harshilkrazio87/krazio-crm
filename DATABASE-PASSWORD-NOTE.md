# Database password (for future updates)

If you want to run database updates **from this project** (e.g. new tables or fixes) without using the Supabase SQL Editor, you can add your database password to `.env.local`.

**Do not commit or share this file.** It is already in `.gitignore`.

## Steps

1. Get your database password  
   Supabase Dashboard → **Project Settings** → **Database** → **Database password** (or reset it if you never saved it).

2. Open the file **`.env.local`** in the project root.

3. Add or uncomment this line and replace `YOUR-PASSWORD` with your real password:

   ```
   DATABASE_URL=postgresql://postgres:YOUR-PASSWORD@db.cmtujhakuaazsbgspxbu.supabase.co:5432/postgres
   ```

4. Save the file.

5. From the project folder, run:

   ```bash
   npm run db:setup
   ```

   That runs the main setup script. For small fixes (e.g. `fix-missing-profiles.sql`), you can run that file manually in the SQL Editor, or we can add more scripts later.

**Security:** Never put `.env.local` in git or share it. The password gives full access to your database.
