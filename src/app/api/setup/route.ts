import { NextResponse } from "next/server";

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const secret = process.env.MIGRATE_SECRET ?? "";
  const response = await fetch(`${baseUrl}/api/auto-migrate`, {
    headers: { "x-migrate-secret": secret },
  });
  const data = await response.json();
  return NextResponse.json(data);
}
