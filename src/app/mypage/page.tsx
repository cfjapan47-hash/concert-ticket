"use client";

import { useSession, signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";

interface Ticket {
  id: string;
  ticketCode: string;
  buyerName: string;
  status: string;
  createdAt: string;
  event: { name: string; date: string; venue: string };
  seatType: { name: string; price: number };
}

const statusLabel: Record<string, string> = {
  RESERVED: "予約中",
  PAID: "決済済み",
  CHECKED_IN: "入場済み",
};

const statusColor: Record<string, string> = {
  RESERVED: "bg-yellow-100 text-yellow-800",
  PAID: "bg-green-100 text-green-800",
  CHECKED_IN: "bg-blue-100 text-blue-800",
};

export default function MyPage() {
  const { data: session, status } = useSession();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/mytickets")
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) setTickets(data);
        })
        .finally(() => setLoading(false));
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status]);

  if (status === "loading" || loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <p className="text-xl text-gray-500">読み込み中...</p>
        </div>
      </>
    );
  }

  if (!session) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="text-6xl mb-4">🎟</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              マイチケット
            </h1>
            <p className="text-lg text-gray-500 mb-6">
              ログインしてチケットを確認してください
            </p>
            <button
              onClick={() => signIn("google")}
              className="bg-indigo-600 text-white px-8 py-4 rounded-xl text-xl font-bold hover:bg-indigo-700"
            >
              Googleでログイン
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto p-4 mt-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            マイチケット
          </h1>

          {tickets.length === 0 ? (
            <div className="bg-white rounded-2xl shadow p-8 text-center">
              <div className="text-4xl mb-4">📭</div>
              <p className="text-lg text-gray-500 mb-4">
                チケットがありません
              </p>
              <Link
                href="/events"
                className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-xl text-lg font-bold hover:bg-indigo-700"
              >
                チケットを購入する
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {tickets.map((t) => (
                <Link
                  key={t.id}
                  href={`/ticket/${t.ticketCode}`}
                  className="block bg-white rounded-2xl shadow hover:shadow-lg transition-shadow p-5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">
                        {t.event.name}
                      </h2>
                      <p className="text-gray-600 mt-1">
                        📅{" "}
                        {new Date(t.event.date).toLocaleDateString("ja-JP", {
                          month: "long",
                          day: "numeric",
                          weekday: "long",
                        })}
                      </p>
                      <p className="text-gray-600">📍 {t.event.venue}</p>
                      <p className="text-gray-500 mt-1">
                        {t.seatType.name} |
                        ¥{t.seatType.price.toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={`text-sm px-3 py-1 rounded-full ${statusColor[t.status]}`}
                    >
                      {statusLabel[t.status]}
                    </span>
                  </div>
                  <p className="text-indigo-600 text-sm mt-3 font-medium">
                    QRコードを表示 →
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
