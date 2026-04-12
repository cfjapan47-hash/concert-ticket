import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user is event manager or global admin
  const isManager = await prisma.eventManager.findUnique({
    where: { eventId_email: { eventId: id, email: session.user.email } },
  });

  const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());
  const isGlobalAdmin = adminEmails.includes(session.user.email.toLowerCase());

  if (!isManager && !isGlobalAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      seatTypes: {
        include: {
          _count: { select: { tickets: true } },
          tickets: { select: { status: true } },
        },
      },
      tickets: {
        select: { status: true, seatType: { select: { price: true } } },
      },
    },
  });

  // チェックイン済みチケットの履歴を取得
  const checkinHistory = await prisma.ticket.findMany({
    where: { eventId: id, status: "CHECKED_IN" },
    select: {
      ticketCode: true,
      buyerName: true,
      checkedInAt: true,
      seatType: { select: { name: true } },
    },
    orderBy: { checkedInAt: "desc" },
    take: 50,
  });

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const totalCapacity = event.seatTypes.reduce((s, st) => s + st.capacity, 0);
  const activeTickets = event.tickets.filter((t) => t.status !== "CANCELLED");
  const paidTickets = event.tickets.filter((t) => t.status === "PAID" || t.status === "CHECKED_IN");
  const checkedInTickets = event.tickets.filter((t) => t.status === "CHECKED_IN");
  const reservedTickets = event.tickets.filter((t) => t.status === "RESERVED");
  const revenue = paidTickets.reduce((s, t) => s + t.seatType.price, 0);

  const seatTypeSummaries = event.seatTypes.map((st) => {
    const sold = st.tickets.filter((t) => t.status !== "CANCELLED").length;
    const paid = st.tickets.filter((t) => t.status === "PAID" || t.status === "CHECKED_IN").length;
    const checkedIn = st.tickets.filter((t) => t.status === "CHECKED_IN").length;
    return {
      id: st.id,
      name: st.name,
      price: st.price,
      capacity: st.capacity,
      sold,
      paid,
      checkedIn,
      remaining: st.capacity - sold,
      fillRate: st.capacity > 0 ? (sold / st.capacity) * 100 : 0,
    };
  });

  return NextResponse.json({
    event: {
      id: event.id,
      name: event.name,
      date: event.date,
      venue: event.venue,
      status: event.status,
    },
    totalCapacity,
    totalSold: activeTickets.length,
    totalPaid: paidTickets.length,
    totalCheckedIn: checkedInTickets.length,
    totalReserved: reservedTickets.length,
    revenue,
    fillRate: totalCapacity > 0 ? (activeTickets.length / totalCapacity) * 100 : 0,
    seatTypeSummaries,
    checkinHistory,
  });
}
