"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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

const eventStatusLabel: Record<string, string> = {
  DRAFT: "下書き",
  ON_SALE: "販売中",
  CLOSED: "終了",
};

const eventStatusColor: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  ON_SALE: "bg-green-100 text-green-800",
  CLOSED: "bg-red-100 text-red-800",
};

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    date: "",
    venue: "",
    description: "",
    flyerUrl: "",
    status: "DRAFT",
  });
  const [uploading, setUploading] = useState(false);
  const [seatTypeForm, setSeatTypeForm] = useState<
    { name: string; price: string; capacity: string }[]
  >([{ name: "S席", price: "10000", capacity: "100" }]);

  const fetchEvents = () => {
    fetch("/api/events")
      .then((r) => r.json())
      .then(setEvents)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const resetForm = () => {
    setForm({ name: "", date: "", venue: "", description: "", flyerUrl: "", status: "DRAFT" });
    setSeatTypeForm([{ name: "S席", price: "10000", capacity: "100" }]);
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.date || !form.venue) {
      alert("イベント名、日時、会場は必須です");
      return;
    }

    const payload = {
      ...form,
      seatTypes: editingId
        ? undefined
        : seatTypeForm.map((st) => ({
            name: st.name,
            price: parseInt(st.price),
            capacity: parseInt(st.capacity),
          })),
    };

    const url = editingId ? `/api/events/${editingId}` : "/api/events";
    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      resetForm();
      fetchEvents();
    } else {
      alert("エラーが発生しました");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("このイベントを削除しますか？関連するチケットもすべて削除されます。")) return;
    await fetch(`/api/events/${id}`, { method: "DELETE" });
    fetchEvents();
  };

  const startEdit = (event: Event) => {
    setForm({
      name: event.name,
      date: event.date.slice(0, 16),
      venue: event.venue,
      description: event.description || "",
      flyerUrl: event.flyerUrl || "",
      status: event.status,
    });
    setEditingId(event.id);
    setShowForm(true);
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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">イベント管理</h2>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="bg-indigo-600 text-white px-6 py-3 rounded-lg text-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          ＋ 新規作成
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">
              {editingId ? "イベント編集" : "新規イベント作成"}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  イベント名 *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border rounded-lg px-4 py-3 text-lg"
                  placeholder="例: 春の音楽祭 2026"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  開催日時 *
                </label>
                <input
                  type="datetime-local"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full border rounded-lg px-4 py-3 text-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  会場 *
                </label>
                <input
                  type="text"
                  value={form.venue}
                  onChange={(e) => setForm({ ...form, venue: e.target.value })}
                  className="w-full border rounded-lg px-4 py-3 text-lg"
                  placeholder="例: 東京ドーム"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  説明
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="w-full border rounded-lg px-4 py-3 text-lg"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  チラシ画像 / PDF
                </label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploading(true);
                    try {
                      const fd = new FormData();
                      fd.append("file", file);
                      fd.append("eventId", editingId || "new");
                      const res = await fetch("/api/upload", {
                        method: "POST",
                        body: fd,
                      });
                      const data = await res.json();
                      if (res.ok) {
                        setForm({ ...form, flyerUrl: data.url });
                      } else {
                        alert(data.error || "アップロードに失敗しました");
                      }
                    } finally {
                      setUploading(false);
                    }
                  }}
                  className="w-full border rounded-lg px-4 py-3 text-lg"
                />
                {uploading && (
                  <p className="text-sm text-indigo-600 mt-1">アップロード中...</p>
                )}
                {form.flyerUrl && (
                  <div className="mt-2">
                    {form.flyerUrl.endsWith(".pdf") ? (
                      <a
                        href={form.flyerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 underline"
                      >
                        PDF を確認
                      </a>
                    ) : (
                      <img
                        src={form.flyerUrl}
                        alt="チラシプレビュー"
                        className="max-h-40 rounded-lg"
                      />
                    )}
                    <button
                      onClick={() => setForm({ ...form, flyerUrl: "" })}
                      className="text-red-500 text-sm ml-2"
                    >
                      削除
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ステータス
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full border rounded-lg px-4 py-3 text-lg"
                >
                  <option value="DRAFT">下書き</option>
                  <option value="ON_SALE">販売中</option>
                  <option value="CLOSED">終了</option>
                </select>
              </div>

              {/* Seat Types - only for new events */}
              {!editingId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    席種
                  </label>
                  {seatTypeForm.map((st, i) => (
                    <div
                      key={i}
                      className="flex gap-2 mb-2 items-center"
                    >
                      <input
                        type="text"
                        value={st.name}
                        onChange={(e) => {
                          const updated = [...seatTypeForm];
                          updated[i].name = e.target.value;
                          setSeatTypeForm(updated);
                        }}
                        className="border rounded-lg px-3 py-2 w-24"
                        placeholder="名前"
                      />
                      <input
                        type="number"
                        value={st.price}
                        onChange={(e) => {
                          const updated = [...seatTypeForm];
                          updated[i].price = e.target.value;
                          setSeatTypeForm(updated);
                        }}
                        className="border rounded-lg px-3 py-2 w-28"
                        placeholder="料金"
                      />
                      <input
                        type="number"
                        value={st.capacity}
                        onChange={(e) => {
                          const updated = [...seatTypeForm];
                          updated[i].capacity = e.target.value;
                          setSeatTypeForm(updated);
                        }}
                        className="border rounded-lg px-3 py-2 w-20"
                        placeholder="定員"
                      />
                      {seatTypeForm.length > 1 && (
                        <button
                          onClick={() =>
                            setSeatTypeForm(
                              seatTypeForm.filter((_, j) => j !== i)
                            )
                          }
                          className="text-red-500 text-xl px-2"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() =>
                      setSeatTypeForm([
                        ...seatTypeForm,
                        { name: "", price: "5000", capacity: "50" },
                      ])
                    }
                    className="text-indigo-600 text-sm hover:underline"
                  >
                    ＋ 席種を追加
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSubmit}
                className="flex-1 bg-indigo-600 text-white py-3 rounded-lg text-lg font-medium hover:bg-indigo-700"
              >
                {editingId ? "更新" : "作成"}
              </button>
              <button
                onClick={resetForm}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg text-lg font-medium hover:bg-gray-300"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event List */}
      {events.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <p className="text-gray-500 text-lg">
            イベントがありません。「新規作成」から追加してください。
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-white rounded-xl shadow p-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Link
                      href={`/admin/events/${event.id}`}
                      className="text-xl font-bold text-gray-800 hover:text-indigo-600"
                    >
                      {event.name}
                    </Link>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${eventStatusColor[event.status]}`}
                    >
                      {eventStatusLabel[event.status]}
                    </span>
                  </div>
                  <p className="text-gray-600">
                    📅 {new Date(event.date).toLocaleString("ja-JP")} | 📍{" "}
                    {event.venue}
                  </p>
                  <div className="flex gap-4 mt-2 text-sm text-gray-500">
                    <span>
                      席種: {event.seatTypes.length}種類
                    </span>
                    <span>
                      チケット: {event._count.tickets}枚
                    </span>
                    <span>
                      総定員:{" "}
                      {event.seatTypes.reduce((s, st) => s + st.capacity, 0)}席
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(event)}
                    className="px-4 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => handleDelete(event.id)}
                    className="px-4 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                  >
                    削除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
