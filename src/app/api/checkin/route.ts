import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { ticketCode } = body;

  if (!ticketCode) {
    return NextResponse.json(
      { error: "チケットコードを入力してください", success: false },
      { status: 400 }
    );
  }

  // Clean up ticket code - extract from URL if needed
  const code = ticketCode.includes("/ticket/")
    ? ticketCode.split("/ticket/").pop()
    : ticketCode;

  const ticket = await prisma.ticket.findUnique({
    where: { ticketCode: code },
    include: {
      event: { select: { name: true, date: true, venue: true } },
      seatType: { select: { name: true, price: true } },
    },
  });

  if (!ticket) {
    return NextResponse.json(
      { error: "チケットが見つかりません", success: false },
      { status: 404 }
    );
  }

  if (ticket.status === "CANCELLED") {
    return NextResponse.json(
      {
        error: "このチケットはキャンセル済みです",
        success: false,
        ticket,
      },
      { status: 400 }
    );
  }

  if (ticket.status === "CHECKED_IN") {
    return NextResponse.json(
      {
        error: `このチケットは既に入場済みです (${ticket.checkedInAt?.toLocaleString("ja-JP")})`,
        success: false,
        ticket,
      },
      { status: 400 }
    );
  }

  if (ticket.status === "RESERVED") {
    return NextResponse.json(
      {
        error: "このチケットは未決済です。先に決済を完了してください。",
        success: false,
        ticket,
      },
      { status: 400 }
    );
  }

  // Status is PAID - proceed with check-in
  const updatedTicket = await prisma.ticket.update({
    where: { id: ticket.id },
    data: {
      status: "CHECKED_IN",
      checkedInAt: new Date(),
    },
    include: {
      event: { select: { name: true, date: true, venue: true } },
      seatType: { select: { name: true, price: true } },
    },
  });

  return NextResponse.json({
    success: true,
    message: "入場を確認しました",
    ticket: updatedTicket,
  });
}
