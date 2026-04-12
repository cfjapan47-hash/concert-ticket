import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const managers = await prisma.eventManager.findMany({
    where: { eventId: id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(managers);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { email, name } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "メールアドレスは必須です" }, { status: 400 });
  }

  // Check if already exists
  const existing = await prisma.eventManager.findUnique({
    where: { eventId_email: { eventId: id, email } },
  });
  if (existing) {
    return NextResponse.json({ error: "この管理者は既に追加されています" }, { status: 400 });
  }

  const manager = await prisma.eventManager.create({
    data: { eventId: id, email, name: name || null },
  });

  return NextResponse.json(manager, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { email } = await req.json();

  await prisma.eventManager.deleteMany({
    where: { eventId: id, email },
  });

  return NextResponse.json({ success: true });
}
