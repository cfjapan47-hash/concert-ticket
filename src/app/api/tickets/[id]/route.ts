import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      event: true,
      seatType: true,
    },
  });
  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }
  return NextResponse.json(ticket);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { status, buyerName, buyerEmail, buyerPhone } = body;

  const data: Record<string, unknown> = {};
  if (status) data.status = status;
  if (buyerName) data.buyerName = buyerName;
  if (buyerEmail !== undefined) data.buyerEmail = buyerEmail;
  if (buyerPhone !== undefined) data.buyerPhone = buyerPhone;

  if (status === "PAID") {
    data.purchasedAt = new Date();
  }

  const ticket = await prisma.ticket.update({
    where: { id },
    data,
    include: {
      event: { select: { name: true, date: true, venue: true } },
      seatType: { select: { name: true, price: true } },
    },
  });

  return NextResponse.json(ticket);
}
