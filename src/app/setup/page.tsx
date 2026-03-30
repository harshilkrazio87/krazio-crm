import Link from "next/link";

export default function SetupPage() {
  return (
    <div
      style={{
        fontFamily: "sans-serif",
        maxWidth: 600,
        margin: "40px auto",
        padding: "0 20px",
      }}
    >
      <h1>🚀 Krazio CRM Setup</h1>
      <p>Run these steps in order to set up your CRM:</p>

      <h2>Step 1: Create exec_sql function</h2>
      <p>Run this ONCE in Supabase SQL Editor:</p>
      <pre
        style={{
          background: "#f4f4f4",
          padding: 16,
          borderRadius: 8,
          overflow: "auto",
        }}
      >
        {`CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN EXECUTE sql_query; END; $$;`}
      </pre>

      <h2>Step 2: Run Auto-Migration</h2>
      <p>Click to create all tables and default data:</p>
      <a
        href="/api/auto-migrate"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-block",
          background: "#3B82F6",
          color: "white",
          padding: "10px 20px",
          borderRadius: 8,
          textDecoration: "none",
          marginBottom: 16,
        }}
      >
        Run Database Migration →
      </a>

      <h2>Step 3: Fix User Accounts</h2>
      <p>Click to set up admin accounts and passwords:</p>
      <a
        href="/api/fix-users"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-block",
          background: "#10B981",
          color: "white",
          padding: "10px 20px",
          borderRadius: 8,
          textDecoration: "none",
          marginBottom: 16,
        }}
      >
        Fix User Accounts →
      </a>

      <h2>Step 4: Verify Setup</h2>
      <a
        href="/api/debug-role"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-block",
          background: "#8B5CF6",
          color: "white",
          padding: "10px 20px",
          borderRadius: 8,
          textDecoration: "none",
          marginBottom: 16,
        }}
      >
        Check Current User Role →
      </a>

      <h2>After Setup:</h2>
      <ul>
        <li>
          Super Admin: <strong>admin@kraziocloud.com</strong> (existing password)
        </li>
        <li>
          Admin: <strong>harsh.p@kraziocloud.com</strong> / Password: <strong>Krazio@2024</strong>
        </li>
      </ul>

      <Link
        href="/login"
        style={{
          display: "inline-block",
          background: "#1F2937",
          color: "white",
          padding: "10px 20px",
          borderRadius: 8,
          textDecoration: "none",
        }}
      >
        Go to Login →
      </Link>
    </div>
  );
}
