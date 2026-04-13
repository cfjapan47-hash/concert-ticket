import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { codeStore } from "../generate/route";

export async function POST(req: NextRequest) {
  const { code } = await req.json();

  if (!code) {
    return NextResponse.json(
      { error: "入場コードを入力してください", success: false },
      { status: 400 }
    );
  }

  const entry = codeStore.get(code);

  if (!entry) {
    return NextResponse.json(
      { error: "無効なコードです", success: false },
      { status: 400 }
    );
  }

  if (entry.expiresAt < Date.now()) {
    codeStore.delete(code);
    return NextResponse.json(
      { error: "コードの有効期限が切れています（30秒）", success: false },
      { status: 400 }
    );
  }

  if (entry.used) {
    return NextResponse.json(
      { error: "このコードは既に使用済みです", success: false },
      { status: 400 }
    );
  }

  // Mark as used
  entry.used = true;
  codeStore.delete(code);

  // Perform check-in
  const ticket = await prisma.ticket.findUnique({
    where: { ticketCode: entry.ticketCode },
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

  if (ticket.status === "CHECKED_IN") {
    return NextResponse.json(
      {
        error: `既に入場済みです`,
        success: false,
        ticket,
      },
      { status: 400 }
    );
  }

  if (ticket.status !== "PAID") {
    return NextResponse.json(
      { error: "未決済のチケットです", success: false, ticket },
      { status: 400 }
    );
  }

  const updatedTicket = await prisma.ticket.update({
    where: { id: ticket.id },
    data: { status: "CHECKED_IN", checkedInAt: new Date() },
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
