export async function sendWelcomeEmail(
  to: string,
  fullName: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const service = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: row } = await service.from("app_settings").select("value").eq("key", "smtp").maybeSingle();
    const smtp = (row?.value as Record<string, unknown>) || {};
    const host = smtp.host as string | undefined;
    const port = Number(smtp.port) || 587;
    const user = smtp.user as string | undefined;
    const pass = smtp.pass as string | undefined;
    const fromEmail = (smtp.from as string) || user;
    const fromName = (smtp.from_name as string) || "Krazio CRM";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    if (!host || !user || !pass) {
      console.warn("SMTP not configured, skipping email");
      return { success: false, error: "SMTP not configured" };
    }

    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.default.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    const html = `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1e40af;">Welcome to Krazio CRM</h2>
        <p>Hi <strong>${fullName}</strong>,</p>
        <p>Your account has been created. Here are your login credentials:</p>
        <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 4px 0;"><strong>URL:</strong> <a href="${appUrl}">${appUrl}</a></p>
          <p style="margin: 4px 0;"><strong>Email:</strong> ${to}</p>
          <p style="margin: 4px 0;"><strong>Password:</strong> <code style="background:#e0e7ff;padding:2px 6px;border-radius:4px;">${password}</code></p>
        </div>
        <p style="color: #ef4444; font-size: 13px;">Please change your password after first login.</p>
        <a href="${appUrl}/login" style="display:inline-block;background:#2563eb;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;margin-top:8px;">Login Now</a>
        <p style="color: #6b7280; font-size: 12px; margin-top: 24px;">Krazio CRM — Internal Access Only</p>
      </div>
    `;

    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject: "Welcome to Krazio CRM — Your Login Credentials",
      html,
    });

    return { success: true };
  } catch (err: unknown) {
    console.error("Email send error:", err);
    return { success: false, error: String(err) };
  }
}
