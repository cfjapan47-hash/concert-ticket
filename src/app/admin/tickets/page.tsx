"use client";

import { useEffect, useState } from "react";

interface Ticket {
  id: string;
  ticketCode: string;
  buyerName: string;
  buyerEmail: string | null;
  buyerPhone: string | null;
  status: string;
  purchasedAt: string;
  checkedInAt: string | null;
  createdAt: string;
  event: { name: string; date: string; venue: string };
  seatType: { name: string; price: number };
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

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const fetchTickets = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (filterStatus) params.set("status", filterStatus);
    fetch(`/api/tickets?${params}`)
      .then((r) => r.json())
      .then(setTickets)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTickets();
  }, [filterStatus]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTickets();
  };

  const updateStatus = async (id: string, newStatus: string) => {
    const label =
      newStatus === "PAID"
        ? "決済済みに変更"
        : newStatus === "CANCELLED"
          ? "キャンセル"
          : newStatus;
    if (!confirm(`このチケットを「${label}」にしますか？`)) return;

    await fetch(`/api/tickets/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchTickets();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-500">読み込み中...</div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">チケット一覧</h2>

      {/* Search & Filter */}
      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <form onSubmit={handleSearch} className="flex gap-3 flex-wrap">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="名前・メール・チケットIDで検索"
            className="border rounded-lg px-4 py-3 text-lg flex-1 min-w-[200px]"
          />
          <button
            type="submit"
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg text-lg hover:bg-indigo-700"
          >
            検索
          </button>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border rounded-lg px-4 py-3 text-lg"
          >
            <option value="">すべて</option>
            <option value="RESERVED">予約中</option>
            <option value="PAID">決済済</option>
            <option value="CHECKED_IN">入場済</option>
            <option value="CANCELLED">キャンセル</option>
          </select>
        </form>
      </div>

      {/* Ticket List */}
      {tickets.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <p className="text-gray-500 text-lg">チケットがありません</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-xl shadow p-4"
            >
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm text-gray-500">
                      {t.ticketCode}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${statusColor[t.status]}`}
                    >
                      {statusLabel[t.status]}
                    </span>
                  </div>
                  <p className="font-bold text-gray-800 text-lg">
                    {t.buyerName}
                  </p>
                  <p className="text-gray-600 text-sm">
                    {t.event.name} | {t.seatType.name} |
                    ¥{t.seatType.price.toLocaleString()}
                  </p>
                  {t.buyerEmail && (
                    <p className="text-gray-500 text-sm">{t.buyerEmail}</p>
                  )}
                  {t.buyerPhone && (
                    <p className="text-gray-500 text-sm">{t.buyerPhone}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  {t.status === "RESERVED" && (
                    <>
                      <button
                        onClick={() => updateStatus(t.id, "PAID")}
                        className="px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 text-sm"
                      >
                        決済済にする
                      </button>
                      <button
                        onClick={() => updateStatus(t.id, "CANCELLED")}
                        className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm"
                      >
                        キャンセル
                      </button>
                    </>
                  )}
                  {t.status === "PAID" && (
                    <button
                      onClick={() => updateStatus(t.id, "CANCELLED")}
                      className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm"
                    >
                      キャンセル
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-gray-500 text-sm mt-4">
        合計: {tickets.length}件
      </p>
    </div>
  );
}
