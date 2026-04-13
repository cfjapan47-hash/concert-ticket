import { NextRequest, NextResponse } from "next/server";
import { handleLineWebhook } from "@/lib/line-notify";

export async function POST(req: NextRequest) {
  const body = await req.json();
  await handleLineWebhook(body);
  return NextResponse.json({ ok: true });
}
