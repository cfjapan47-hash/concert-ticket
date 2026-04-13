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

interface Manager {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
}

export default function EventDetailPage() {
  const params = useParams();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddSeat, setShowAddSeat] = useState(false);
  const [newSeat, setNewSeat] = useState({ name: "", price: "", capacity: "" });
  const [managers, setManagers] = useState<Manager[]>([]);
  const [newManagerEmail, setNewManagerEmail] = useState("");
  const [newManagerName, setNewManagerName] = useState("");

  const fetchEvent = () => {
    fetch(`/api/events/${params.id}`)
      .then((r) => r.json())
      .then(setEvent)
      .finally(() => setLoading(false));
  };

  const fetchManagers = () => {
    fetch(`/api/events/${params.id}/managers`)
      .then((r) => r.json())
      .then(setManagers);
  };

  useEffect(() => {
    fetchEvent();
    fetchManagers();
  }, [params.id]);

  const addManager = async () => {
    if (!newManagerEmail) {
      alert("メールアドレスを入力してください");
      return;
    }
    const res = await fetch(`/api/events/${params.id}/managers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newManagerEmail, name: newManagerName }),
    });
    if (res.ok) {
      setNewManagerEmail("");
      setNewManagerName("");
      fetchManagers();
    } else {
      const err = await res.json();
      alert(err.error);
    }
  };

  const removeManager = async (email: string) => {
    if (!confirm(`${email} を管理者から削除しますか？`)) return;
    await fetch(`/api/events/${params.id}/managers`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    fetchManagers();
  };

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

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const buyUrl = `${baseUrl}/events/${params.id}/buy?ref=line`;
  const dashboardUrl = `${baseUrl}/event-dashboard/${params.id}?ref=line`;

  const copyUrl = (url: string, label: string) => {
    navigator.clipboard.writeText(url);
    alert(`${label}のURLをコピーしました`);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">{event.name}</h2>
      <p className="text-gray-600 mb-4">
        📅 {new Date(event.date).toLocaleString("ja-JP")} | 📍 {event.venue}
      </p>

      {/* Share URLs */}
      <div className="bg-indigo-50 rounded-xl p-4 mb-6 space-y-3">
        <h3 className="font-bold text-indigo-800">共有URL</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 w-24 flex-shrink-0">チケット購入:</span>
          <code className="text-xs bg-white px-2 py-1 rounded flex-1 truncate">{buyUrl}</code>
          <button
            onClick={() => copyUrl(buyUrl, "チケット購入")}
            className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-indigo-700 flex-shrink-0"
          >
            コピー
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 w-24 flex-shrink-0">管理者共有:</span>
          <code className="text-xs bg-white px-2 py-1 rounded flex-1 truncate">{dashboardUrl}</code>
          <button
            onClick={() => copyUrl(dashboardUrl, "管理者ダッシュボード")}
            className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-indigo-700 flex-shrink-0"
          >
            コピー
          </button>
        </div>
        <p className="text-xs text-gray-500">
          チケット購入URLをLINEやSNSで共有すると、このイベントだけの購入ページが開きます
        </p>
      </div>

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

      {/* Event Managers */}
      <div className="bg-white rounded-xl shadow p-6 mt-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          イベント管理者
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          追加した管理者は、このイベントのチケット発行状況を閲覧できます。
          共有URL:{" "}
          <code className="bg-gray-100 px-2 py-1 rounded text-indigo-600 text-xs">
            {typeof window !== "undefined" ? window.location.origin : ""}/event-dashboard/{params.id}
          </code>
        </p>

        {/* Add Manager Form */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex gap-2 items-end flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs text-gray-500">メールアドレス *</label>
              <input
                type="email"
                value={newManagerEmail}
                onChange={(e) => setNewManagerEmail(e.target.value)}
                className="border rounded-lg px-3 py-2 w-full"
                placeholder="manager@example.com"
              />
            </div>
            <div className="w-32">
              <label className="text-xs text-gray-500">名前</label>
              <input
                type="text"
                value={newManagerName}
                onChange={(e) => setNewManagerName(e.target.value)}
                className="border rounded-lg px-3 py-2 w-full"
                placeholder="担当者名"
              />
            </div>
            <button
              onClick={addManager}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 whitespace-nowrap"
            >
              追加
            </button>
          </div>
        </div>

        {/* Manager List */}
        {managers.length === 0 ? (
          <p className="text-gray-500 text-sm">管理者がいません</p>
        ) : (
          <div className="space-y-2">
            {managers.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between border rounded-lg p-3"
              >
                <div>
                  <span className="font-medium text-gray-800">
                    {m.name || "名前未設定"}
                  </span>
                  <span className="text-gray-500 ml-2 text-sm">{m.email}</span>
                </div>
                <button
                  onClick={() => removeManager(m.email)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  削除
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
