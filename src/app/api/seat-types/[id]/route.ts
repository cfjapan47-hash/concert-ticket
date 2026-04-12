import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { name, price, capacity } = body;

  const seatType = await prisma.seatType.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(price !== undefined && { price }),
      ...(capacity !== undefined && { capacity }),
    },
  });

  return NextResponse.json(seatType);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.seatType.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
