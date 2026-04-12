import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json({ error: "session_id is required" }, { status: 400 });
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== "paid") {
    return NextResponse.json({ error: "Payment not completed" }, { status: 400 });
  }

  const ticketCodes = session.metadata?.ticketCodes?.split(",") || [];

  // Ensure tickets are marked as PAID
  for (const code of ticketCodes) {
    await prisma.ticket.updateMany({
      where: { ticketCode: code, status: "RESERVED" },
      data: { status: "PAID", purchasedAt: new Date() },
    });
  }

  // Fetch ticket details
  const tickets = await prisma.ticket.findMany({
    where: { ticketCode: { in: ticketCodes } },
    include: {
      event: { select: { name: true, date: true, venue: true } },
      seatType: { select: { name: true, price: true } },
    },
  });

  return NextResponse.json({ tickets });
}
