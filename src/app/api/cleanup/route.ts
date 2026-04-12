import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 30分以上経過した予約中（未決済）チケットを自動削除
async function cleanup() {
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

  const deleted = await prisma.ticket.deleteMany({
    where: {
      status: "RESERVED",
      createdAt: { lt: thirtyMinutesAgo },
    },
  });

  return NextResponse.json({
    message: `${deleted.count}件の期限切れ予約を削除しました`,
    count: deleted.count,
  });
}

export async function GET() {
  return cleanup();
}

export async function POST() {
  return cleanup();
}
