import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";

export async function POST(req: NextRequest) {
  // 30分以上経過した未決済チケットを自動削除
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  await prisma.ticket.deleteMany({
    where: { status: "RESERVED", createdAt: { lt: thirtyMinutesAgo } },
  });

  const body = await req.json();
  const { eventId, seatTypeId, buyerName, buyerEmail, buyerPhone, quantity } =
    body;

  const count = quantity || 1;

  // Validate seat type and availability
  const seatType = await prisma.seatType.findUnique({
    where: { id: seatTypeId },
    include: {
      event: true,
      _count: {
        select: {
          tickets: { where: { status: { not: "CANCELLED" } } },
        },
      },
    },
  });

  if (!seatType) {
    return NextResponse.json(
      { error: "席種が見つかりません" },
      { status: 404 }
    );
  }

  const remaining = seatType.capacity - seatType._count.tickets;
  if (remaining < count) {
    return NextResponse.json(
      { error: `残り${remaining}席です。${count}枚の購入はできません。` },
      { status: 400 }
    );
  }

  // Create tickets with RESERVED status (will be updated to PAID after payment)
  const ticketCodes: string[] = [];
  for (let i = 0; i < count; i++) {
    const ticketCode = `TK-${nanoid(10)}`;
    ticketCodes.push(ticketCode);

    await prisma.ticket.create({
      data: {
        ticketCode,
        eventId,
        seatTypeId,
        buyerName,
        buyerEmail: buyerEmail || null,
        buyerPhone: buyerPhone || null,
        status: "RESERVED",
      },
    });
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  // Create Stripe Checkout Session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card", "konbini", "customer_balance"],
    payment_method_options: {
      konbini: {
        expires_after_days: 3,
      },
      customer_balance: {
        funding_type: "bank_transfer",
        bank_transfer: {
          type: "jp_bank_transfer",
        },
      },
    },
    line_items: [
      {
        price_data: {
          currency: "jpy",
          product_data: {
            name: `${seatType.event.name} - ${seatType.name}`,
            description: `${new Date(seatType.event.date).toLocaleDateString("ja-JP")} / ${seatType.event.venue}`,
          },
          unit_amount: seatType.price,
        },
        quantity: count,
      },
    ],
    mode: "payment",
    success_url: `${baseUrl}/events/${eventId}/buy/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/events/${eventId}/buy`,
    metadata: {
      ticketCodes: ticketCodes.join(","),
      eventId,
      seatTypeId,
    },
  });

  return NextResponse.json({ url: session.url });
}
