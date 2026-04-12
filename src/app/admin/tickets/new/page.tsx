"use client";

import { useEffect, useState } from "react";

interface SeatType {
  id: string;
  name: string;
  price: number;
  capacity: number;
  _count?: { tickets: number };
}

interface Event {
  id: string;
  name: string;
  date: string;
  venue: string;
  status: string;
  seatTypes: SeatType[];
}

interface IssuedTicket {
  ticketCode: string;
  buyerName: string;
  qrCode: string;
  event: { name: string; date: string; venue: string };
  seatType: { name: string; price: number };
}

export default function NewTicketPage() {
  const [step, setStep] = useState(1);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<SeatType | null>(null);
  const [form, setForm] = useState({
    buyerName: "",
    buyerEmail: "",
    buyerPhone: "",
    status: "PAID",
    quantity: 1,
  });
  const [issuedTickets, setIssuedTickets] = useState<IssuedTicket[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/events")
      .then((r) => r.json())
      .then(setEvents);
  }, []);

  const handleIssue = async () => {
    if (!selectedEvent || !selectedSeat) return;
    if (!form.buyerName) {
      alert("購入者名を入力してください");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: selectedEvent.id,
          seatTypeId: selectedSeat.id,
          ...form,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "エラーが発生しました");
        return;
      }

      const data = await res.json();
      setIssuedTickets(Array.isArray(data) ? data : [data]);
      setStep(4);
    } finally {
      setSubmitting(false);
    }
  };

  const resetAll = () => {
    setStep(1);
    setSelectedEvent(null);
    setSelectedSeat(null);
    setForm({
      buyerName: "",
      buyerEmail: "",
      buyerPhone: "",
      status: "PAID",
      quantity: 1,
    });
    setIssuedTickets([]);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">チケット発行</h2>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[
          "イベント選択",
          "席種選択",
          "購入者情報",
          "発行完了",
        ].map((label, i) => (
          <div key={i} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step > i + 1
                  ? "bg-green-500 text-white"
                  : step === i + 1
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-200 text-gray-500"
              }`}
            >
              {step > i + 1 ? "✓" : i + 1}
            </div>
            <span
              className={`ml-2 text-sm hidden sm:inline ${
                step === i + 1
                  ? "text-indigo-600 font-bold"
                  : "text-gray-500"
              }`}
            >
              {label}
            </span>
            {i < 3 && (
              <div className="w-8 h-0.5 bg-gray-200 mx-2 hidden sm:block" />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Select Event */}
      {step === 1 && (
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-bold mb-4">イベントを選択してください</h3>
          {events.length === 0 ? (
            <p className="text-gray-500">
              イベントがありません。先にイベントを作成してください。
            </p>
          ) : (
            <div className="space-y-3">
              {events.map((ev) => (
                <button
                  key={ev.id}
                  onClick={() => {
                    setSelectedEvent(ev);
                    setStep(2);
                  }}
                  className="w-full text-left border rounded-xl p-4 hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
                >
                  <p className="font-bold text-lg text-gray-800">{ev.name}</p>
                  <p className="text-gray-600">
                    📅 {new Date(ev.date).toLocaleString("ja-JP")} | 📍{" "}
                    {ev.venue}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Select Seat Type */}
      {step === 2 && selectedEvent && (
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-bold mb-2">席種を選択してください</h3>
          <p className="text-gray-500 mb-4">{selectedEvent.name}</p>
          <div className="space-y-3">
            {selectedEvent.seatTypes.map((st) => (
              <button
                key={st.id}
                onClick={() => {
                  setSelectedSeat(st);
                  setStep(3);
                }}
                className="w-full text-left border rounded-xl p-4 hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-lg">{st.name}</p>
                    <p className="text-gray-500">
                      定員: {st.capacity}席
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-indigo-600">
                    ¥{st.price.toLocaleString()}
                  </p>
                </div>
              </button>
            ))}
          </div>
          <button
            onClick={() => setStep(1)}
            className="mt-4 text-gray-500 hover:text-gray-700"
          >
            ← イベント選択に戻る
          </button>
        </div>
      )}

      {/* Step 3: Buyer Info */}
      {step === 3 && selectedEvent && selectedSeat && (
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-bold mb-4">購入者情報を入力してください</h3>

          <div className="bg-indigo-50 rounded-lg p-4 mb-6">
            <p className="font-bold">{selectedEvent.name}</p>
            <p className="text-sm text-gray-600">
              {selectedSeat.name} | ¥{selectedSeat.price.toLocaleString()}
            </p>
          </div>

          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                購入者名 *
              </label>
              <input
                type="text"
                value={form.buyerName}
                onChange={(e) =>
                  setForm({ ...form, buyerName: e.target.value })
                }
                className="w-full border rounded-lg px-4 py-3 text-lg"
                placeholder="山田 太郎"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                メールアドレス
              </label>
              <input
                type="email"
                value={form.buyerEmail}
                onChange={(e) =>
                  setForm({ ...form, buyerEmail: e.target.value })
                }
                className="w-full border rounded-lg px-4 py-3 text-lg"
                placeholder="yamada@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                電話番号
              </label>
              <input
                type="tel"
                value={form.buyerPhone}
                onChange={(e) =>
                  setForm({ ...form, buyerPhone: e.target.value })
                }
                className="w-full border rounded-lg px-4 py-3 text-lg"
                placeholder="090-1234-5678"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                枚数
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={form.quantity}
                onChange={(e) =>
                  setForm({ ...form, quantity: parseInt(e.target.value) || 1 })
                }
                className="w-full border rounded-lg px-4 py-3 text-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                決済状態
              </label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value })
                }
                className="w-full border rounded-lg px-4 py-3 text-lg"
              >
                <option value="PAID">即時決済（決済済み）</option>
                <option value="RESERVED">予約のみ（未決済）</option>
              </select>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-lg font-bold">
                合計: ¥{(selectedSeat.price * form.quantity).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleIssue}
              disabled={submitting}
              className="bg-indigo-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? "発行中..." : "チケットを発行する"}
            </button>
            <button
              onClick={() => setStep(2)}
              className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg text-lg hover:bg-gray-300"
            >
              ← 戻る
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Issued */}
      {step === 4 && (
        <div className="bg-white rounded-xl shadow p-6">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-2xl font-bold text-green-600">
              チケットを発行しました！
            </h3>
          </div>

          <div className="space-y-6">
            {issuedTickets.map((t) => (
              <div
                key={t.ticketCode}
                className="border-2 border-dashed border-indigo-300 rounded-xl p-6 text-center"
              >
                <p className="font-bold text-xl mb-2">{t.event.name}</p>
                <p className="text-gray-600 mb-4">
                  {t.seatType.name} | ¥{t.seatType.price.toLocaleString()}
                </p>
                <p className="text-gray-600 mb-2">購入者: {t.buyerName}</p>
                {t.qrCode && (
                  <div className="flex justify-center my-4">
                    <img
                      src={t.qrCode}
                      alt="QR Code"
                      className="w-48 h-48"
                    />
                  </div>
                )}
                <p className="font-mono text-lg text-indigo-600">
                  {t.ticketCode}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center mt-6">
            <button
              onClick={resetAll}
              className="bg-indigo-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-indigo-700"
            >
              続けてチケットを発行する
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
