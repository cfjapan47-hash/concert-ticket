"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface TicketInfo {
  ticketCode: string;
  buyerName: string;
  status: string;
  event: { name: string; date: string; venue: string };
  seatType: { name: string; price: number };
}

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [tickets, setTickets] = useState<TicketInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    // Poll for ticket status update (webhook may take a moment)
    const fetchTickets = async () => {
      const res = await fetch(
        `/api/stripe/verify?session_id=${sessionId}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.tickets && data.tickets.length > 0) {
          setTickets(data.tickets);
          setLoading(false);
          return true;
        }
      }
      return false;
    };

    const tryFetch = async () => {
      const success = await fetchTickets();
      if (!success && retryCount < 10) {
        setTimeout(() => setRetryCount((c) => c + 1), 2000);
      } else if (!success) {
        setLoading(false);
      }
    };

    tryFetch();
  }, [sessionId, retryCount]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-xl text-gray-600">決済を確認しています...</p>
        </div>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-4xl mb-4">✅</div>
          <p className="text-xl text-gray-800 font-bold mb-2">
            決済が完了しました
          </p>
          <p className="text-gray-500 mb-6">
            チケット情報の確認に時間がかかっています。
            <br />
            しばらくしてからページを再読み込みしてください。
          </p>
          <Link
            href="/events"
            className="text-indigo-600 text-lg hover:underline"
          >
            イベント一覧に戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-6 mt-8">
          <div className="text-6xl mb-3">🎉</div>
          <h1 className="text-2xl font-bold text-green-600">
            お支払い完了！ありがとうございます
          </h1>
          <p className="text-gray-500 mt-2 text-lg">
            当日はチケット確認ページのQRコードを受付でご提示ください
          </p>
        </div>

        <div className="space-y-4">
          {tickets.map((t) => (
            <div
              key={t.ticketCode}
              className="bg-white rounded-2xl shadow-lg p-6 text-center"
            >
              <p className="text-xl font-bold mb-1">{t.event.name}</p>
              <p className="text-gray-600">
                📅{" "}
                {new Date(t.event.date).toLocaleDateString("ja-JP", {
                  month: "long",
                  day: "numeric",
                  weekday: "long",
                })}
              </p>
              <p className="text-gray-600">📍 {t.event.venue}</p>
              <p className="text-gray-600 mt-2">
                {t.seatType.name} | ¥{t.seatType.price.toLocaleString()}
              </p>
              <p className="text-gray-600">{t.buyerName} 様</p>

              <p className="font-mono text-lg text-indigo-600 font-bold mt-4 mb-3">
                {t.ticketCode}
              </p>

              <Link
                href={`/ticket/${t.ticketCode}`}
                className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-xl text-lg font-bold hover:bg-indigo-700"
              >
                QRコード付きチケットを表示
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-gray-400 mt-6 text-base">
          「QRコード付きチケットを表示」をタップして、スクリーンショットで保存してください
        </p>

        <div className="text-center mt-6">
          <Link
            href="/events"
            className="text-indigo-600 text-lg hover:underline"
          >
            他のイベントを見る
          </Link>
        </div>
      </div>
    </div>
  );
}
