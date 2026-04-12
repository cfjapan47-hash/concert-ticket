import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [events, tickets, paidTickets, checkedInTickets, reservedTickets] =
    await Promise.all([
      prisma.event.findMany({
        include: {
          seatTypes: true,
          _count: { select: { tickets: true } },
          tickets: {
            select: { status: true, seatType: { select: { price: true } } },
          },
        },
        orderBy: { date: "asc" },
      }),
      prisma.ticket.count({ where: { status: { not: "CANCELLED" } } }),
      prisma.ticket.count({ where: { status: "PAID" } }),
      prisma.ticket.count({ where: { status: "CHECKED_IN" } }),
      prisma.ticket.count({ where: { status: "RESERVED" } }),
    ]);

  // Calculate total revenue from PAID and CHECKED_IN tickets
  const allPaidTickets = await prisma.ticket.findMany({
    where: { status: { in: ["PAID", "CHECKED_IN"] } },
    include: { seatType: { select: { price: true } } },
  });
  const totalRevenue = allPaidTickets.reduce(
    (sum, t) => sum + t.seatType.price,
    0
  );

  // Recent tickets
  const recentTickets = await prisma.ticket.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    include: {
      event: { select: { name: true } },
      seatType: { select: { name: true, price: true } },
    },
  });

  // Event summaries
  const eventSummaries = events.map((event) => {
    const totalCapacity = event.seatTypes.reduce(
      (sum, st) => sum + st.capacity,
      0
    );
    const soldCount = event.tickets.filter(
      (t) => t.status !== "CANCELLED"
    ).length;
    const revenue = event.tickets
      .filter((t) => t.status === "PAID" || t.status === "CHECKED_IN")
      .reduce((sum, t) => sum + t.seatType.price, 0);

    return {
      id: event.id,
      name: event.name,
      date: event.date,
      venue: event.venue,
      status: event.status,
      totalCapacity,
      soldCount,
      revenue,
      fillRate: totalCapacity > 0 ? (soldCount / totalCapacity) * 100 : 0,
    };
  });

  return NextResponse.json({
    totalRevenue,
    totalTickets: tickets,
    paidTickets,
    checkedInTickets,
    reservedTickets,
    recentTickets,
    eventSummaries,
  });
}
