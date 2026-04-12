"use client";

import { useEffect, useState } from "react";

interface EventSummary {
  id: string;
  name: string;
  date: string;
  venue: string;
  status: string;
  totalCapacity: number;
  soldCount: number;
  revenue: number;
  fillRate: number;
}

interface RecentTicket {
  id: string;
  ticketCode: string;
  buyerName: string;
  status: string;
  createdAt: string;
  event: { name: string };
  seatType: { name: string; price: number };
}

interface DashboardData {
  totalRevenue: number;
  totalTickets: number;
  paidTickets: number;
  checkedInTickets: number;
  reservedTickets: number;
  recentTickets: RecentTicket[];
  eventSummaries: EventSummary[];
}

const statusLabel: Record<string, string> = {
  RESERVED: "予約中",
  PAID: "決済済",
  CHECKED_IN: "入場済",
  CANCELLED: "キャンセル",
};

const statusColor: Record<string, string> = {
  RESERVED: "bg-yellow-100 text-yellow-800",
  PAID: "bg-green-100 text-green-800",
  CHECKED_IN: "bg-blue-100 text-blue-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-500">読み込み中...</div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">ダッシュボード</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <SummaryCard
          label="総売上"
          value={`¥${data.totalRevenue.toLocaleString()}`}
          color="bg-green-500"
        />
        <SummaryCard
          label="販売数"
          value={`${data.totalTickets}枚`}
          color="bg-blue-500"
        />
        <SummaryCard
          label="入場済"
          value={`${data.checkedInTickets}人`}
          color="bg-purple-500"
        />
        <SummaryCard
          label="予約中"
          value={`${data.reservedTickets}件`}
          color="bg-yellow-500"
        />
      </div>

      {/* Event Fill Rates */}
      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          イベント別 充足率
        </h3>
        {data.eventSummaries.length === 0 ? (
          <p className="text-gray-500">イベントがありません</p>
        ) : (
          <div className="space-y-4">
            {data.eventSummaries.map((ev) => (
              <div key={ev.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{ev.name}</span>
                  <span className="text-gray-500">
                    {ev.soldCount}/{ev.totalCapacity}席 (
                    {ev.fillRate.toFixed(0)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-indigo-600 h-4 rounded-full transition-all"
                    style={{ width: `${Math.min(ev.fillRate, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Tickets */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">最近の予約</h3>
        {data.recentTickets.length === 0 ? (
          <p className="text-gray-500">予約がありません</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">
                    コード
                  </th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">
                    購入者
                  </th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">
                    イベント
                  </th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">
                    席種
                  </th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">
                    金額
                  </th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">
                    状態
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.recentTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-mono">
                      {t.ticketCode}
                    </td>
                    <td className="px-4 py-3 text-sm">{t.buyerName}</td>
                    <td className="px-4 py-3 text-sm">{t.event.name}</td>
                    <td className="px-4 py-3 text-sm">{t.seatType.name}</td>
                    <td className="px-4 py-3 text-sm">
                      ¥{t.seatType.price.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${statusColor[t.status]}`}
                      >
                        {statusLabel[t.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className={`w-12 h-12 ${color} rounded-lg mb-3`} />
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  );
}
