"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import Header from "@/components/Header";

interface SeatTypeSummary {
  id: string;
  name: string;
  price: number;
  capacity: number;
  sold: number;
  paid: number;
  checkedIn: number;
  remaining: number;
  fillRate: number;
}

interface DashboardData {
  event: {
    id: string;
    name: string;
    date: string;
    venue: string;
    status: string;
  };
  totalCapacity: number;
  totalSold: number;
  totalPaid: number;
  totalCheckedIn: number;
  totalReserved: number;
  revenue: number;
  fillRate: number;
  seatTypeSummaries: SeatTypeSummary[];
}

export default function EventDashboardPage() {
  const params = useParams();
  const { data: session, status: authStatus } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authStatus !== "authenticated") return;

    fetch(`/api/event-dashboard/${params.id}`)
      .then(async (r) => {
        if (!r.ok) {
          const err = await r.json();
          setError(err.error || "エラーが発生しました");
          return;
        }
        return r.json();
      })
      .then((d) => d && setData(d))
      .finally(() => setLoading(false));
  }, [params.id, authStatus]);

  if (authStatus === "loading") {
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
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">📊</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              イベントダッシュボード
            </h1>
            <p className="text-gray-500 mb-6">ログインしてチケット状況を確認</p>
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

  if (error) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">⛔</div>
            <p className="text-xl text-red-600 font-bold">{error}</p>
            <p className="text-gray-500 mt-2">このイベントの閲覧権限がありません</p>
          </div>
        </div>
      </>
    );
  }

  if (loading || !data) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <p className="text-xl text-gray-500">読み込み中...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        {/* Event Header */}
        <div className="bg-indigo-600 text-white py-6 px-4">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold">{data.event.name}</h1>
            <p className="text-indigo-200 mt-1">
              📅{" "}
              {new Date(data.event.date).toLocaleDateString("ja-JP", {
                year: "numeric",
                month: "long",
                day: "numeric",
                weekday: "long",
              })}
              {" "}📍 {data.event.venue}
            </p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto p-4 mt-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow p-4">
              <p className="text-sm text-gray-500">売上</p>
              <p className="text-2xl font-bold text-green-600">
                ¥{data.revenue.toLocaleString()}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow p-4">
              <p className="text-sm text-gray-500">販売数</p>
              <p className="text-2xl font-bold text-blue-600">
                {data.totalSold}/{data.totalCapacity}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow p-4">
              <p className="text-sm text-gray-500">入場済</p>
              <p className="text-2xl font-bold text-purple-600">
                {data.totalCheckedIn}人
              </p>
            </div>
            <div className="bg-white rounded-xl shadow p-4">
              <p className="text-sm text-gray-500">予約中</p>
              <p className="text-2xl font-bold text-yellow-600">
                {data.totalReserved}件
              </p>
            </div>
          </div>

          {/* Overall Fill Rate */}
          <div className="bg-white rounded-xl shadow p-6 mb-6">
            <div className="flex justify-between mb-2">
              <span className="font-bold text-gray-700">全体充足率</span>
              <span className="text-gray-500">
                {data.totalSold}/{data.totalCapacity}席 (
                {data.fillRate.toFixed(0)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-5">
              <div
                className="bg-indigo-600 h-5 rounded-full transition-all"
                style={{ width: `${Math.min(data.fillRate, 100)}%` }}
              />
            </div>
          </div>

          {/* Seat Type Breakdown */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              席種別状況
            </h2>
            <div className="space-y-4">
              {data.seatTypeSummaries.map((st) => (
                <div key={st.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <span className="font-bold text-gray-800">
                        {st.name}
                      </span>
                      <span className="text-indigo-600 ml-2">
                        ¥{st.price.toLocaleString()}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      残り {st.remaining}席
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                    <div
                      className={`h-3 rounded-full ${
                        st.fillRate > 80
                          ? "bg-green-500"
                          : st.fillRate > 50
                            ? "bg-yellow-500"
                            : "bg-blue-500"
                      }`}
                      style={{ width: `${Math.min(st.fillRate, 100)}%` }}
                    />
                  </div>
                  <div className="flex gap-4 text-sm text-gray-500">
                    <span>販売: {st.sold}枚</span>
                    <span>決済済: {st.paid}枚</span>
                    <span>入場済: {st.checkedIn}人</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
