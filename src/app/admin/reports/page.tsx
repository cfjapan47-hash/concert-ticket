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

interface DashboardData {
  totalRevenue: number;
  totalTickets: number;
  paidTickets: number;
  checkedInTickets: number;
  reservedTickets: number;
  eventSummaries: EventSummary[];
}

export default function ReportsPage() {
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
      <h2 className="text-2xl font-bold text-gray-800 mb-6">レポート</h2>

      {/* Total Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-sm text-gray-500">総売上</p>
          <p className="text-3xl font-bold text-green-600">
            ¥{data.totalRevenue.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-sm text-gray-500">販売数(有効)</p>
          <p className="text-3xl font-bold text-blue-600">
            {data.totalTickets}枚
          </p>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-sm text-gray-500">入場済み</p>
          <p className="text-3xl font-bold text-purple-600">
            {data.checkedInTickets}人
          </p>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-sm text-gray-500">未入場(決済済)</p>
          <p className="text-3xl font-bold text-yellow-600">
            {data.paidTickets}人
          </p>
        </div>
      </div>

      {/* Event-level Reports */}
      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          イベント別レポート
        </h3>
        {data.eventSummaries.length === 0 ? (
          <p className="text-gray-500">イベントがありません</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">
                    イベント名
                  </th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">
                    開催日
                  </th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">
                    会場
                  </th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600 text-right">
                    売上
                  </th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600 text-right">
                    販売/定員
                  </th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">
                    充足率
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.eventSummaries.map((ev) => (
                  <tr key={ev.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{ev.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(ev.date).toLocaleDateString("ja-JP")}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {ev.venue}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-green-600">
                      ¥{ev.revenue.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      {ev.soldCount}/{ev.totalCapacity}
                    </td>
                    <td className="px-4 py-3 w-40">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full ${
                              ev.fillRate > 80
                                ? "bg-green-500"
                                : ev.fillRate > 50
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                            }`}
                            style={{
                              width: `${Math.min(ev.fillRate, 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-10">
                          {ev.fillRate.toFixed(0)}%
                        </span>
                      </div>
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
