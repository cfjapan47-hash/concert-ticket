import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      seatTypes: {
        include: { _count: { select: { tickets: true } } },
      },
      _count: { select: { tickets: true } },
    },
  });
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }
  return NextResponse.json(event);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { name, date, venue, description, status } = body;

  const event = await prisma.event.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(date && { date: new Date(date) }),
      ...(venue && { venue }),
      ...(description !== undefined && { description }),
      ...(status && { status }),
    },
    include: { seatTypes: true },
  });

  return NextResponse.json(event);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.event.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
