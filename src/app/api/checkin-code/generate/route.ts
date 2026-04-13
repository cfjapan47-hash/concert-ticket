import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// In-memory store for one-time codes (expires in 30 seconds)
// In production, use Redis for multi-instance support
const codeStore = new Map<
  string,
  { ticketCode: string; expiresAt: number; used: boolean }
>();

// Clean expired codes periodically
function cleanExpiredCodes() {
  const now = Date.now();
  for (const [key, val] of codeStore.entries()) {
    if (val.expiresAt < now) codeStore.delete(key);
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const { ticketCode } = await req.json();
  if (!ticketCode) {
    return NextResponse.json({ error: "チケットコードが必要です" }, { status: 400 });
  }

  // Verify the ticket belongs to this user
  const ticket = await prisma.ticket.findUnique({
    where: { ticketCode },
  });

  if (!ticket) {
    return NextResponse.json({ error: "チケットが見つかりません" }, { status: 404 });
  }

  if (ticket.buyerEmail !== session.user.email) {
    return NextResponse.json({ error: "このチケットの所有者ではありません" }, { status: 403 });
  }

  if (ticket.status === "CHECKED_IN") {
    return NextResponse.json({ error: "既に入場済みです" }, { status: 400 });
  }

  if (ticket.status === "CANCELLED") {
    return NextResponse.json({ error: "キャンセル済みのチケットです" }, { status: 400 });
  }

  // Clean old codes
  cleanExpiredCodes();

  // Generate 6-digit code
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = Date.now() + 30 * 1000; // 30 seconds

  codeStore.set(code, { ticketCode, expiresAt, used: false });

  return NextResponse.json({
    code,
    expiresIn: 30,
    ticketCode,
  });
}

// Export the store for the verify endpoint
export { codeStore };
