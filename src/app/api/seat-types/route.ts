import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { eventId, name, price, capacity } = body;

  const seatType = await prisma.seatType.create({
    data: { eventId, name, price, capacity },
  });

  return NextResponse.json(seatType, { status: 201 });
}
