import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const events = await prisma.event.findMany({
    include: {
      seatTypes: true,
      _count: { select: { tickets: true } },
    },
    orderBy: { date: "asc" },
  });
  return NextResponse.json(events);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, date, venue, description, flyerUrl, status, seatTypes } = body;

  const event = await prisma.event.create({
    data: {
      name,
      date: new Date(date),
      venue,
      description: description || null,
      flyerUrl: flyerUrl || null,
      status: status || "DRAFT",
      seatTypes: seatTypes
        ? {
            create: seatTypes.map(
              (st: { name: string; price: number; capacity: number }) => ({
                name: st.name,
                price: st.price,
                capacity: st.capacity,
              })
            ),
          }
        : undefined,
    },
    include: { seatTypes: true },
  });

  return NextResponse.json(event, { status: 201 });
}
