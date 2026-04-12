import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";
import QRCode from "qrcode";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("eventId");
  const search = searchParams.get("search");
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (eventId) where.eventId = eventId;
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { buyerName: { contains: search, mode: "insensitive" } },
      { buyerEmail: { contains: search, mode: "insensitive" } },
      { ticketCode: { contains: search, mode: "insensitive" } },
    ];
  }

  const tickets = await prisma.ticket.findMany({
    where,
    include: {
      event: { select: { name: true, date: true, venue: true } },
      seatType: { select: { name: true, price: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(tickets);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { eventId, seatTypeId, buyerName, buyerEmail, buyerPhone, status, quantity } = body;

  const count = quantity || 1;

  // Check seat availability
  const seatType = await prisma.seatType.findUnique({
    where: { id: seatTypeId },
    include: {
      _count: {
        select: {
          tickets: { where: { status: { not: "CANCELLED" } } },
        },
      },
    },
  });

  if (!seatType) {
    return NextResponse.json({ error: "席種が見つかりません" }, { status: 404 });
  }

  const remaining = seatType.capacity - seatType._count.tickets;
  if (remaining < count) {
    return NextResponse.json(
      { error: `残り${remaining}席です。${count}枚の発行はできません。` },
      { status: 400 }
    );
  }

  const tickets = [];
  for (let i = 0; i < count; i++) {
    const ticketCode = `TK-${nanoid(10)}`;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const qrData = `${baseUrl}/ticket/${ticketCode}`;
    const qrCodeDataUrl = await QRCode.toDataURL(qrData, { width: 300 });

    const ticket = await prisma.ticket.create({
      data: {
        ticketCode,
        eventId,
        seatTypeId,
        buyerName,
        buyerEmail: buyerEmail || null,
        buyerPhone: buyerPhone || null,
        status: status || "RESERVED",
      },
      include: {
        event: { select: { name: true, date: true, venue: true } },
        seatType: { select: { name: true, price: true } },
      },
    });

    tickets.push({ ...ticket, qrCode: qrCodeDataUrl });
  }

  return NextResponse.json(tickets.length === 1 ? tickets[0] : tickets, {
    status: 201,
  });
}
