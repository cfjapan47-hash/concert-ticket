import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import QRCode from "qrcode";

const statusLabel: Record<string, string> = {
  RESERVED: "予約中（未決済）",
  PAID: "決済済み",
  CHECKED_IN: "入場済み",
  CANCELLED: "キャンセル済み",
};

const statusStyle: Record<string, string> = {
  RESERVED: "bg-yellow-100 text-yellow-800 border-yellow-300",
  PAID: "bg-green-100 text-green-800 border-green-300",
  CHECKED_IN: "bg-blue-100 text-blue-800 border-blue-300",
  CANCELLED: "bg-red-100 text-red-800 border-red-300",
};

export default async function TicketPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const ticket = await prisma.ticket.findUnique({
    where: { ticketCode: code },
    include: {
      event: true,
      seatType: true,
    },
  });

  if (!ticket) {
    notFound();
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const qrCodeDataUrl = await QRCode.toDataURL(`${baseUrl}/ticket/${code}`, {
    width: 300,
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Ticket Card */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-indigo-600 text-white p-6 text-center">
            <p className="text-sm uppercase tracking-wider mb-1">
              CONCERT TICKET
            </p>
            <h1 className="text-2xl font-bold">{ticket.event.name}</h1>
          </div>

          {/* Status */}
          <div className="px-6 pt-4">
            <div
              className={`text-center py-2 rounded-lg border text-lg font-bold ${statusStyle[ticket.status]}`}
            >
              {statusLabel[ticket.status]}
            </div>
          </div>

          {/* Details */}
          <div className="p-6 space-y-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📅</span>
              <div>
                <p className="text-sm text-gray-500">開催日時</p>
                <p className="text-xl font-bold text-gray-800">
                  {new Date(ticket.event.date).toLocaleDateString("ja-JP", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    weekday: "long",
                  })}
                </p>
                <p className="text-lg text-gray-700">
                  {new Date(ticket.event.date).toLocaleTimeString("ja-JP", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  開演
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-2xl">📍</span>
              <div>
                <p className="text-sm text-gray-500">会場</p>
                <p className="text-xl font-bold text-gray-800">
                  {ticket.event.venue}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-2xl">💺</span>
              <div>
                <p className="text-sm text-gray-500">席種</p>
                <p className="text-xl font-bold text-gray-800">
                  {ticket.seatType.name}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-2xl">👤</span>
              <div>
                <p className="text-sm text-gray-500">購入者名</p>
                <p className="text-xl font-bold text-gray-800">
                  {ticket.buyerName}
                </p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="relative px-6">
            <div className="border-t-2 border-dashed border-gray-200" />
            <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-indigo-50 rounded-full" />
            <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-indigo-50 rounded-full" />
          </div>

          {/* QR Code */}
          <div className="p-6 text-center">
            <p className="text-sm text-gray-500 mb-3">
              入場時にこのQRコードを提示してください
            </p>
            <div className="flex justify-center">
              <img
                src={qrCodeDataUrl}
                alt="QR Code"
                className="w-56 h-56"
              />
            </div>
            <p className="mt-3 font-mono text-lg text-indigo-600 font-bold">
              {ticket.ticketCode}
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-400 mt-4">
          このページをスクリーンショットで保存しても入場できます
        </p>
        <div className="flex justify-center gap-4 mt-4">
          <a
            href="/mypage"
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl text-lg font-bold hover:bg-indigo-700"
          >
            マイチケット
          </a>
          <a
            href="/"
            className="bg-gray-200 text-gray-700 px-6 py-3 rounded-xl text-lg font-bold hover:bg-gray-300"
          >
            ホーム
          </a>
        </div>
      </div>
    </div>
  );
}
