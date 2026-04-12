"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface SeatType {
  id: string;
  name: string;
  price: number;
  capacity: number;
  _count: { tickets: number };
}

interface EventDetail {
  id: string;
  name: string;
  date: string;
  venue: string;
  description: string | null;
  status: string;
  seatTypes: SeatType[];
  _count: { tickets: number };
}

export default function EventDetailPage() {
  const params = useParams();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddSeat, setShowAddSeat] = useState(false);
  const [newSeat, setNewSeat] = useState({ name: "", price: "", capacity: "" });

  const fetchEvent = () => {
    fetch(`/api/events/${params.id}`)
      .then((r) => r.json())
      .then(setEvent)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEvent();
  }, [params.id]);

  const addSeatType = async () => {
    if (!newSeat.name || !newSeat.price || !newSeat.capacity) {
      alert("すべての項目を入力してください");
      return;
    }
    const res = await fetch("/api/seat-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId: params.id,
        name: newSeat.name,
        price: parseInt(newSeat.price),
        capacity: parseInt(newSeat.capacity),
      }),
    });
    if (res.ok) {
      setNewSeat({ name: "", price: "", capacity: "" });
      setShowAddSeat(false);
      fetchEvent();
    }
  };

  const deleteSeatType = async (stId: string) => {
    if (!confirm("この席種を削除しますか？")) return;
    await fetch(`/api/seat-types/${stId}`, { method: "DELETE" });
    fetchEvent();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-500">読み込み中...</div>
      </div>
    );
  }

  if (!event) {
    return <div className="text-red-500 text-xl">イベントが見つかりません</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">{event.name}</h2>
      <p className="text-gray-600 mb-6">
        📅 {new Date(event.date).toLocaleString("ja-JP")} | 📍 {event.venue}
      </p>

      {event.description && (
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h3 className="font-bold text-gray-700 mb-2">説明</h3>
          <p className="text-gray-600">{event.description}</p>
        </div>
      )}

      {/* Seat Types */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">席種一覧</h3>
          <button
            onClick={() => setShowAddSeat(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            ＋ 席種追加
          </button>
        </div>

        {showAddSeat && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex gap-2 items-end">
              <div>
                <label className="text-xs text-gray-500">名前</label>
                <input
                  type="text"
                  value={newSeat.name}
                  onChange={(e) =>
                    setNewSeat({ ...newSeat, name: e.target.value })
                  }
                  className="border rounded-lg px-3 py-2 w-full"
                  placeholder="A席"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">料金</label>
                <input
                  type="number"
                  value={newSeat.price}
                  onChange={(e) =>
                    setNewSeat({ ...newSeat, price: e.target.value })
                  }
                  className="border rounded-lg px-3 py-2 w-full"
                  placeholder="5000"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">定員</label>
                <input
                  type="number"
                  value={newSeat.capacity}
                  onChange={(e) =>
                    setNewSeat({ ...newSeat, capacity: e.target.value })
                  }
                  className="border rounded-lg px-3 py-2 w-full"
                  placeholder="100"
                />
              </div>
              <button
                onClick={addSeatType}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 whitespace-nowrap"
              >
                追加
              </button>
              <button
                onClick={() => setShowAddSeat(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                取消
              </button>
            </div>
          </div>
        )}

        {event.seatTypes.length === 0 ? (
          <p className="text-gray-500">席種がありません</p>
        ) : (
          <div className="space-y-3">
            {event.seatTypes.map((st) => {
              const remaining = st.capacity - st._count.tickets;
              const fillRate =
                st.capacity > 0
                  ? (st._count.tickets / st.capacity) * 100
                  : 0;
              return (
                <div
                  key={st.id}
                  className="border rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-bold text-gray-800">{st.name}</span>
                      <span className="text-indigo-600 font-medium">
                        ¥{st.price.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      販売: {st._count.tickets}/{st.capacity}席 | 残り: {remaining}席
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full"
                        style={{ width: `${Math.min(fillRate, 100)}%` }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => deleteSeatType(st.id)}
                    className="ml-4 text-red-500 hover:text-red-700"
                  >
                    削除
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
