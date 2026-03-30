import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const companyName = body?.companyName ?? body?.company_name ?? "";
  const website = body?.website ?? "";
  if (!String(companyName).trim()) {
    return NextResponse.json({ error: "Company name is required" }, { status: 400 });
  }

  const { data: keyRow } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "gemini_api_key")
    .single();

  const v = keyRow?.value;
  const apiKey =
    (typeof v === "object" && v && "value" in v && typeof (v as { value: string }).value === "string"
      ? (v as { value: string }).value
      : typeof v === "string"
        ? v
        : null) ?? process.env.GEMINI_API_KEY ?? null;
  if (!apiKey) {
    return NextResponse.json({ error: "Gemini API key not configured. Add it in Settings → API Keys." }, { status: 400 });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `You are a B2B research assistant. Provide a concise company research summary (max 400 words) for sales/CRM context. Include: company overview, industry, size if inferable, key products/services, and any notable recent news or positioning. Do not use markdown headers, use short paragraphs.\n\nCompany: ${companyName}\n${website ? `Website: ${website}` : ""}`;
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return NextResponse.json({ research: text });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gemini request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
