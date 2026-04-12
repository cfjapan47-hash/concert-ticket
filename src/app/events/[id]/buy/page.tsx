"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface SeatType {
  id: string;
  name: string;
  price: number;
  capacity: number;
  _count?: { tickets: number };
}

interface EventDetail {
  id: string;
  name: string;
  date: string;
  venue: string;
  description: string | null;
  seatTypes: SeatType[];
}

interface IssuedTicket {
  ticketCode: string;
  buyerName: string;
  qrCode: string;
  event: { name: string; date: string; venue: string };
  seatType: { name: string; price: number };
}

export default function BuyTicketPage() {
  const params = useParams();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [selectedSeat, setSelectedSeat] = useState<SeatType | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [submitting, setSubmitting] = useState(false);
  const [tickets, setTickets] = useState<IssuedTicket[]>([]);

  useEffect(() => {
    fetch(`/api/events/${params.id}`)
      .then((r) => r.json())
      .then(setEvent)
      .finally(() => setLoading(false));
  }, [params.id]);

  const handlePurchase = async () => {
    if (!form.name.trim()) {
      alert("お名前を入力してください");
      return;
    }
    if (!event || !selectedSeat) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          seatTypeId: selectedSeat.id,
          buyerName: form.name,
          buyerEmail: form.email || null,
          buyerPhone: form.phone || null,
          quantity,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "エラーが発生しました");
        return;
      }

      const data = await res.json();
      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-xl text-gray-500">読み込み中...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-xl text-red-500">イベントが見つかりません</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-indigo-600 text-white py-4 px-4">
        <div className="max-w-lg mx-auto">
          <Link
            href="/events"
            className="text-indigo-200 hover:text-white text-lg"
          >
            ← イベント一覧に戻る
          </Link>
          <h1 className="text-2xl font-bold mt-1">{event.name}</h1>
          <p className="text-indigo-200">
            📅{" "}
            {new Date(event.date).toLocaleDateString("ja-JP", {
              month: "long",
              day: "numeric",
              weekday: "long",
            })}
            {" "}
            📍 {event.venue}
          </p>
        </div>
      </header>

      {/* Step Indicator */}
      <div className="max-w-lg mx-auto px-4 mt-6 mb-4">
        <div className="flex items-center justify-between">
          {["席種選択", "お客様情報", "確認", "完了"].map((label, i) => (
            <div key={i} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                  step > i + 1
                    ? "bg-green-500 text-white"
                    : step === i + 1
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-200 text-gray-500"
                }`}
              >
                {step > i + 1 ? "✓" : i + 1}
              </div>
              <span className="ml-1 text-sm text-gray-600 hidden sm:inline">
                {label}
              </span>
              {i < 3 && <div className="w-4 sm:w-8 h-0.5 bg-gray-300 mx-1" />}
            </div>
          ))}
        </div>
      </div>

      <main className="max-w-lg mx-auto px-4 pb-8">
        {/* Step 1: Seat Selection */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800">
              席種を選んでください
            </h2>
            {event.seatTypes.map((st) => {
              const sold = st._count?.tickets ?? 0;
              const remaining = st.capacity - sold;
              const soldOut = remaining <= 0;
              return (
                <button
                  key={st.id}
                  disabled={soldOut}
                  onClick={() => {
                    setSelectedSeat(st);
                    setStep(2);
                  }}
                  className={`w-full text-left rounded-2xl p-6 transition-all ${
                    soldOut
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white shadow hover:shadow-lg hover:border-indigo-300 border-2 border-transparent"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xl font-bold">{st.name}</p>
                      {soldOut ? (
                        <p className="text-red-500 font-bold mt-1">売り切れ</p>
                      ) : (
                        <p className="text-gray-500 mt-1">
                          残り {remaining}席
                        </p>
                      )}
                    </div>
                    <p className="text-2xl font-bold text-indigo-600">
                      ¥{st.price.toLocaleString()}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Step 2: Customer Info */}
        {step === 2 && selectedSeat && (
          <div className="bg-white rounded-2xl shadow p-6">
            <div className="bg-indigo-50 rounded-xl p-4 mb-6">
              <p className="font-bold text-lg">{selectedSeat.name}</p>
              <p className="text-indigo-600 font-bold text-xl">
                ¥{selectedSeat.price.toLocaleString()}
              </p>
            </div>

            <h2 className="text-xl font-bold text-gray-800 mb-4">
              お客様情報を入力してください
            </h2>

            <div className="space-y-5">
              <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">
                  お名前（必須）
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border-2 rounded-xl px-4 py-4 text-xl focus:border-indigo-500 focus:outline-none"
                  placeholder="山田 太郎"
                />
              </div>

              <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">
                  電話番号
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full border-2 rounded-xl px-4 py-4 text-xl focus:border-indigo-500 focus:outline-none"
                  placeholder="090-1234-5678"
                />
              </div>

              <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">
                  メールアドレス
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border-2 rounded-xl px-4 py-4 text-xl focus:border-indigo-500 focus:outline-none"
                  placeholder="example@mail.com"
                />
              </div>

              <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">
                  枚数
                </label>
                <select
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value))}
                  className="w-full border-2 rounded-xl px-4 py-4 text-xl focus:border-indigo-500 focus:outline-none"
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n}枚
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setStep(3)}
                disabled={!form.name.trim()}
                className="flex-1 bg-indigo-600 text-white py-4 rounded-xl text-xl font-bold hover:bg-indigo-700 disabled:opacity-40"
              >
                確認へ進む →
              </button>
              <button
                onClick={() => setStep(1)}
                className="bg-gray-200 text-gray-700 px-6 py-4 rounded-xl text-lg hover:bg-gray-300"
              >
                戻る
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && selectedSeat && (
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              ご注文内容の確認
            </h2>

            <div className="space-y-4 text-lg">
              <div className="flex justify-between py-3 border-b">
                <span className="text-gray-500">イベント</span>
                <span className="font-bold">{event.name}</span>
              </div>
              <div className="flex justify-between py-3 border-b">
                <span className="text-gray-500">日時</span>
                <span>
                  {new Date(event.date).toLocaleDateString("ja-JP", {
                    month: "long",
                    day: "numeric",
                    weekday: "long",
                  })}
                </span>
              </div>
              <div className="flex justify-between py-3 border-b">
                <span className="text-gray-500">会場</span>
                <span>{event.venue}</span>
              </div>
              <div className="flex justify-between py-3 border-b">
                <span className="text-gray-500">席種</span>
                <span>{selectedSeat.name}</span>
              </div>
              <div className="flex justify-between py-3 border-b">
                <span className="text-gray-500">枚数</span>
                <span>{quantity}枚</span>
              </div>
              <div className="flex justify-between py-3 border-b">
                <span className="text-gray-500">お名前</span>
                <span className="font-bold">{form.name}</span>
              </div>
              {form.phone && (
                <div className="flex justify-between py-3 border-b">
                  <span className="text-gray-500">電話番号</span>
                  <span>{form.phone}</span>
                </div>
              )}
            </div>

            <div className="bg-indigo-50 rounded-xl p-4 mt-6 text-center">
              <p className="text-gray-500">お支払い金額</p>
              <p className="text-3xl font-bold text-indigo-600">
                ¥{(selectedSeat.price * quantity).toLocaleString()}
              </p>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={handlePurchase}
                disabled={submitting}
                className="flex-1 bg-green-600 text-white py-4 rounded-xl text-xl font-bold hover:bg-green-700 disabled:opacity-50"
              >
                {submitting ? "決済画面に移動中..." : "カード決済に進む"}
              </button>
              <button
                onClick={() => setStep(2)}
                className="bg-gray-200 text-gray-700 px-6 py-4 rounded-xl text-lg hover:bg-gray-300"
              >
                戻る
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Complete */}
        {step === 4 && (
          <div>
            <div className="text-center mb-6">
              <div className="text-6xl mb-3">🎉</div>
              <h2 className="text-2xl font-bold text-green-600">
                ご購入ありがとうございます！
              </h2>
              <p className="text-gray-500 mt-2 text-lg">
                当日はこの画面のQRコードを受付でご提示ください
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
                    {t.seatType.name} | ¥{t.seatType.price.toLocaleString()}
                  </p>
                  <p className="text-gray-600 mb-4">{t.buyerName} 様</p>

                  {t.qrCode && (
                    <div className="flex justify-center my-4">
                      <img
                        src={t.qrCode}
                        alt="QRコード"
                        className="w-52 h-52"
                      />
                    </div>
                  )}

                  <p className="font-mono text-lg text-indigo-600 font-bold mb-3">
                    {t.ticketCode}
                  </p>

                  <Link
                    href={`/ticket/${t.ticketCode}`}
                    className="inline-block bg-indigo-100 text-indigo-700 px-6 py-3 rounded-xl text-lg hover:bg-indigo-200"
                  >
                    チケット確認ページを開く
                  </Link>
                </div>
              ))}
            </div>

            <p className="text-center text-gray-400 mt-6 text-base">
              この画面をスクリーンショットで保存しておくと安心です
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
        )}
      </main>
    </div>
  );
}
