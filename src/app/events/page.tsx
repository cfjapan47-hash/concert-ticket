"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";

interface SeatType {
  id: string;
  name: string;
  price: number;
  capacity: number;
}

interface Event {
  id: string;
  name: string;
  date: string;
  venue: string;
  description: string | null;
  flyerUrl: string | null;
  status: string;
  seatTypes: SeatType[];
  _count: { tickets: number };
}

export default function PublicEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/events")
      .then((r) => r.json())
      .then((data: Event[]) =>
        setEvents(data.filter((e) => e.status === "ON_SALE"))
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-xl text-gray-500">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      {/* Sub Header */}
      <header className="bg-indigo-600 text-white py-6 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold">チケット購入</h1>
          <p className="text-indigo-200 mt-1 text-lg">
            ご希望のイベントを選んでください
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 mt-6">
        {events.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-8 text-center">
            <p className="text-xl text-gray-500">
              現在販売中のイベントはありません
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {events.map((event) => {
              const minPrice = Math.min(
                ...event.seatTypes.map((st) => st.price)
              );
              return (
                <Link
                  key={event.id}
                  href={`/events/${event.id}/buy`}
                  className="block bg-white rounded-2xl shadow hover:shadow-lg transition-shadow"
                >
                  {event.flyerUrl && !event.flyerUrl.endsWith(".pdf") && (
                    <img
                      src={event.flyerUrl}
                      alt={event.name}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-3">
                      {event.name}
                    </h2>
                    <div className="space-y-2 text-lg text-gray-600">
                      <p>
                        📅{" "}
                        {new Date(event.date).toLocaleDateString("ja-JP", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          weekday: "long",
                        })}
                        {" "}
                        {new Date(event.date).toLocaleTimeString("ja-JP", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <p>📍 {event.venue}</p>
                    </div>
                    {event.description && (
                      <p className="text-gray-500 mt-2">{event.description}</p>
                    )}
                    {event.flyerUrl && event.flyerUrl.endsWith(".pdf") && (
                      <a
                        href={event.flyerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-2 text-indigo-600 underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        📄 チラシPDFを見る
                      </a>
                    )}

                    {/* Seat types summary */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {event.seatTypes.map((st) => (
                        <span
                          key={st.id}
                          className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg text-base"
                        >
                          {st.name} ¥{st.price.toLocaleString()}
                        </span>
                      ))}
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-xl font-bold text-indigo-600">
                        ¥{minPrice.toLocaleString()}〜
                      </p>
                      <span className="bg-indigo-600 text-white px-6 py-3 rounded-xl text-lg font-bold">
                        チケットを購入 →
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
